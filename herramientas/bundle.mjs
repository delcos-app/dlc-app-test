// Bundles src/app with esbuild (plan 7.3, cut A): the core and one chunk per screen loaded on first use.
//
//   node herramientas/bundle.mjs     → src/generated/core.js, src/generated/chunks/<screen>.js and src/app/core/lazy/manifest.ts
//
// - The core (src/app/main.ts) is one classic script (IIFE): it runs first in app.js, before the legacy pieces that call window.delcos.
// - Every src/app/screens/<screen>/chunk.ts is the entry of a lazy chunk: an ES module that src/app/core/lazy loads with import()
//   the first time the screen is used (min/chunks/<screen>.js, minimised by herramientas/construir.mjs).
// - A chunk never carries its own copy of a module the core already has (that would duplicate its state): each such import is
//   read from the registry the core publishes (window.__delcosModules, src/app/core/lazy/registry.ts). The list of shared modules
//   is written to src/app/core/lazy/manifest.ts, so it is reviewed, typed and linted like any other source file.
// - A module that only one chunk uses goes inside that chunk. A module used by two chunks and not by the core stops the build:
//   it would exist twice.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCREENS = 'src/app/screens';
const CORE_ENTRY = 'src/app/main.ts', CORE_OUT = 'src/generated/core.js', CHUNKS_OUT = 'src/generated/chunks';
const MANIFEST = 'src/app/core/lazy/manifest.ts';
/** The global the core publishes the shared modules in (the same name as src/app/core/lazy/registry.ts). */
const REGISTRY_GLOBAL = '__delcosModules';
const COMMON = { bundle: true, target: 'es2020', charset: 'utf8', legalComments: 'none', absWorkingDir: ROOT, write: false, metafile: true, logLevel: 'warning' };

const posix = file => file.replace(/\\/g, '/');
const relative = file => posix(path.relative(ROOT, file));
const read = file => (fs.existsSync(path.join(ROOT, file)) ? fs.readFileSync(path.join(ROOT, file), 'utf8') : null);
const write = (file, text) => {
  if (read(file) === text) return false;
  fs.mkdirSync(path.dirname(path.join(ROOT, file)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, file), text);
  return true;
};

/** The lazy chunks: one per screen folder with a chunk.ts. */
const chunkNames = () => fs.readdirSync(path.join(ROOT, SCREENS), { withFileTypes: true })
  .filter(entry => entry.isDirectory() && fs.existsSync(path.join(ROOT, SCREENS, entry.name, 'chunk.ts')))
  .map(entry => entry.name).sort();

/** The registry key of a module: its path inside src/app, without the extension («services/format»). */
const registryKey = file => file.replace(/^src\/app\//, '').replace(/\.ts$/, '');

/** While the core is measured, the manifest is empty (a stale list must not keep a module in the core). */
const emptyManifest = {
  name: 'empty-manifest',
  setup(build) {
    // Also when it does not exist yet (the first build)
    build.onResolve({ filter: /^\.\/manifest$/ }, args => (/[\\/]core[\\/]lazy$/.test(args.resolveDir) ? { path: path.join(ROOT, MANIFEST) } : undefined));
    build.onLoad({ filter: /[\\/]core[\\/]lazy[\\/]manifest\.ts$/ }, () => ({ contents: 'export const sharedModules = () => ({}); export const LAZY_CHUNKS = [];', loader: 'ts' }));
  },
};

async function buildCore(measuring) {
  const result = await esbuild.build({ ...COMMON, entryPoints: [CORE_ENTRY], format: 'iife', outfile: CORE_OUT, plugins: measuring ? [emptyManifest] : [] });
  return { text: result.outputFiles[0].text, inputs: new Set(Object.keys(result.metafile.inputs)) };
}

/** The names a shared module exports (what a chunk may import from it). */
const exportCache = new Map();
async function exportsOf(file) {
  if (!exportCache.has(file)) {
    const result = await esbuild.build({ ...COMMON, entryPoints: [file], format: 'esm', outfile: 'exports.js', logLevel: 'silent', plugins: [emptyManifest] });
    exportCache.set(file, Object.values(result.metafile.outputs)[0].exports);
  }
  return exportCache.get(file);
}

/** In a chunk, an import of a module of the core becomes a read of the registry. */
function registryPlugin(coreInputs, used) {
  return {
    name: 'shared-modules',
    setup(build) {
      build.onResolve({ filter: /.*/ }, async args => {
        if (args.kind === 'entry-point' || args.pluginData?.inner || args.namespace !== 'file') return undefined;
        const resolved = await build.resolve(args.path, { kind: args.kind, importer: args.importer, resolveDir: args.resolveDir, pluginData: { inner: true } });
        if (resolved.errors.length || !resolved.path) return undefined;
        const file = relative(resolved.path);
        if (!coreInputs.has(file)) return undefined;
        used.add(file);
        return { path: file, namespace: 'delcos-shared', sideEffects: false };
      });
      build.onLoad({ filter: /.*/, namespace: 'delcos-shared' }, async args => {
        const names = await exportsOf(args.path);
        const lines = [`const shared = globalThis[${JSON.stringify(REGISTRY_GLOBAL)}][${JSON.stringify(registryKey(args.path))}];`,
          'const pick = name => shared[name];',
          ...names.map(name => (name === 'default'
            ? 'const defaultExport = /* @__PURE__ */ pick("default");\nexport { defaultExport as default };'
            : `export const ${name} = /* @__PURE__ */ pick(${JSON.stringify(name)});`))];
        return { contents: lines.join('\n'), loader: 'js', resolveDir: ROOT };
      });
    },
  };
}

async function buildChunk(name, coreInputs, used) {
  const entry = `${SCREENS}/${name}/chunk.ts`;
  const result = await esbuild.build({ ...COMMON, entryPoints: [entry], format: 'esm', outfile: `${CHUNKS_OUT}/${name}.js`, plugins: [registryPlugin(coreInputs, used)] });
  const own = Object.keys(result.metafile.inputs).filter(file => !file.startsWith('delcos-shared:') && !file.startsWith('<'));
  return { name, text: result.outputFiles[0].text, own };
}

/** The variable name of a shared module in the manifest («services/format» → servicesFormat). */
const variableOf = key => key.split(/[/-]/).map((part, i) => (i ? part.charAt(0).toUpperCase() + part.slice(1) : part)).join('');

function manifestText(keys, chunks) {
  const imports = keys.map(key => `import * as ${variableOf(key)} from '../../${key}';`);
  const entries = keys.map(key => `  '${key}': ${variableOf(key)},`);
  return `/**
 * GENERATED by herramientas/bundle.mjs (npm run build): do not edit by hand.
 * The screens loaded on first use (each src/app/screens/<screen>/chunk.ts) and the modules of the core they import. The core
 * publishes these modules once (registry.ts) and each chunk reads them from there, so every module and its state exist only once.
 */
${imports.join('\n')}

/** The modules of the core that the lazy chunks import, by their path inside src/app (read when the core publishes them). */
export const sharedModules = (): Record<string, object> => ({
${entries.join('\n')}
});

/** The lazy chunks: min/chunks/<name>.js. */
export const LAZY_CHUNKS = [${chunks.map(name => `'${name}'`).join(', ')}] as const;
`;
}

const names = chunkNames();
const measured = await buildCore(true);
const used = new Set(), chunks = [];
for (const name of names) chunks.push(await buildChunk(name, measured.inputs, used));

// A module outside the core that two chunks carry would exist twice
const owners = new Map();
for (const chunk of chunks) for (const file of chunk.own) owners.set(file, [...(owners.get(file) ?? []), chunk.name]);
const twice = [...owners].filter(([, list]) => list.length > 1);
if (twice.length) {
  for (const [file, list] of twice) console.error(`✗ ${file} is in the chunks ${list.join(' and ')}: import it from the core so it exists once`);
  process.exit(1);
}

const keys = [...used].map(registryKey).sort();
const manifestChanged = write(MANIFEST, manifestText(keys, names));
const core = await buildCore(false);
// The real manifest only adds itself: every shared module was already in the core
const extra = [...core.inputs].filter(file => !measured.inputs.has(file) && file !== MANIFEST);
if (extra.length) { console.error(`✗ the registry added modules to the core: ${extra.join(', ')}`); process.exit(1); }

write(CORE_OUT, core.text);
fs.mkdirSync(path.join(ROOT, CHUNKS_OUT), { recursive: true });
for (const file of fs.readdirSync(path.join(ROOT, CHUNKS_OUT))) {
  if (!names.includes(file.replace(/\.js$/, ''))) fs.rmSync(path.join(ROOT, CHUNKS_OUT, file));
}
for (const chunk of chunks) write(`${CHUNKS_OUT}/${chunk.name}.js`, chunk.text);
const kb = text => `${Math.round(Buffer.byteLength(text) / 1024)} KB`;
console.log(`${CORE_OUT}: ${kb(core.text)} · ${keys.length} shared modules${manifestChanged ? ` (${MANIFEST} rewritten)` : ''}`);
for (const chunk of chunks) console.log(`${CHUNKS_OUT}/${chunk.name}.js: ${kb(chunk.text)} (${chunk.own.length} own modules)`);
