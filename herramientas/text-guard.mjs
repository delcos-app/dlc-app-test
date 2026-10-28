// The texts of the lazy chunks (plan 7.3, cut F): a chunk brings the texts only its screen uses (screens/<x>/texts.ts, registered
// when the chunk loads) and the core keeps the rest. This guard, run by herramientas/bundle.mjs on every build and check, makes sure
// t('key') can never show a raw key:
// - every key the core uses (the TypeScript of the core, the legacy files of app.js and the {{key}} of index.html) is in the core
//   catalog (src/app/i18n/es.ts);
// - every key a chunk uses is in the core catalog or in that chunk's texts;
// - no key is in two places, and a chunk's texts.ts is the first import of its chunk.ts (they register before any of its code runs).
// A key is «used» by a file when the file has it as a string ('a.b.c') or starts a template with its beginning (`a.b.${x}`, which
// counts as every key that starts with «a.b.»), comments included: a mention keeps the text where it is mentioned, never the reverse.
import fs from 'node:fs';
import path from 'node:path';
import * as esbuild from 'esbuild';

const CORE_CATALOG = 'src/app/i18n/es.ts';
const TEXTS_FILE = 'texts.ts';

const posix = file => file.replace(/\\/g, '/');

/** Runs a TypeScript module (bundled with its imports) and returns its exports. */
async function evaluate(root, file) {
  const result = await esbuild.build({ entryPoints: [file], bundle: true, format: 'esm', write: false, absWorkingDir: root, logLevel: 'silent', target: 'es2020',
    define: { window: 'globalThis' } });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
}

/** The leaf keys of a catalog object («analytics.table.title»…). */
function leaves(node, prefix = '', out = new Set()) {
  for (const [name, value] of Object.entries(node)) {
    const key = prefix ? `${prefix}.${name}` : name;
    if (typeof value === 'string') out.add(key);
    else if (value && typeof value === 'object') leaves(value, key, out);
  }
  return out;
}

/** The keys a source text refers to, among the known ones. */
function referencedKeys(text, known, namespaces) {
  const found = new Set();
  const isOurs = value => namespaces.has(value.split('.')[0]);
  // Whole strings: 'a.b.c', "a.b.c" or `a.b.c` (a key, or the beginning of keys when it ends with a dot)
  for (const [, value] of text.matchAll(/['"`]([A-Za-z]\w*(?:\.\w+)+\.?)['"`]/g)) {
    if (!isOurs(value)) continue;
    if (value.endsWith('.')) { for (const key of known) if (key.startsWith(value)) found.add(key); } else if (known.has(value)) found.add(value);
  }
  // The beginning of a template: `a.b.${x}…` is every key that starts with «a.b.»
  for (const [, head] of text.matchAll(/`([A-Za-z]\w*(?:\.\w*)*)\$\{/g)) {
    if (!isOurs(head) || !head.includes('.')) continue;
    for (const key of known) if (key.startsWith(head)) found.add(key);
  }
  // The {{key}} of the start-up HTML
  for (const [, value] of text.matchAll(/\{\{([A-Za-z]\w*(?:\.\w+)+)\}\}/g)) if (known.has(value)) found.add(value);
  return found;
}

/** The texts.ts of a chunk entry (screens/<x>/chunk.ts → screens/<x>/texts.ts), if it has one. */
const textsOf = entry => posix(path.join(path.dirname(entry), TEXTS_FILE));

/**
 * Checks the texts of the core and of every chunk. coreFiles: the files of the core bundle (esbuild inputs); legacyFiles: the other
 * pieces of app.js and index.html; chunks: [{ name, entry, own }] with the files only that chunk carries.
 * Returns the list of problems (empty when all is well) and a summary.
 */
export async function checkTexts({ root, coreFiles, legacyFiles, chunks }) {
  const problems = [];
  const core = leaves((await evaluate(root, CORE_CATALOG)).es);
  const owner = new Map([...core].map(key => [key, 'core']));
  const chunkKeys = new Map();
  for (const chunk of chunks) {
    const textsFile = textsOf(chunk.entry);
    const keys = new Set();
    chunkKeys.set(chunk.name, keys);
    if (!fs.existsSync(path.join(root, textsFile))) continue;
    if (!chunk.own.includes(textsFile)) problems.push(`${textsFile} is not part of the chunk ${chunk.name}`);
    const first = fs.readFileSync(path.join(root, chunk.entry), 'utf8').match(/^(?:import|export)\s[^;]*;/m)?.[0] ?? '';
    if (!/^import\s+'\.\/texts';$/.test(first)) problems.push(`${chunk.entry} must start with import './texts'; (its texts register before its code runs)`);
    const { texts } = await evaluate(root, textsFile);
    if (!texts) { problems.push(`${textsFile} does not export its texts (export const texts = {…})`); continue; }
    for (const key of leaves(texts)) {
      if (owner.has(key)) problems.push(`the key ${key} is both in ${owner.get(key)} and in the chunk ${chunk.name}`);
      else { owner.set(key, chunk.name); keys.add(key); }
    }
  }
  const known = new Set(owner.keys()), namespaces = new Set([...known].map(key => key.split('.')[0]));
  const scan = files => {
    const keys = new Map();
    for (const file of files) {
      if (/^src\/app\/i18n\/es(\/|\.ts$)/.test(file) || /\/texts\.ts$/.test(file) || !/\.(ts|js|html)$/.test(file)) continue;
      for (const key of referencedKeys(fs.readFileSync(path.join(root, file), 'utf8'), known, namespaces)) {
        if (!keys.has(key)) keys.set(key, file);
      }
    }
    return keys;
  };
  const coreUses = scan([...coreFiles, ...legacyFiles]);
  for (const [key, file] of coreUses) if (!core.has(key)) problems.push(`${file} (core) uses ${key}, which only arrives with the chunk ${owner.get(key)}: keep it in the core catalog`);
  const chunkUses = new Map();
  for (const chunk of chunks) {
    const uses = scan(chunk.own);
    chunkUses.set(chunk.name, uses);
    for (const [key, file] of uses) {
      if (!core.has(key) && !chunkKeys.get(chunk.name).has(key)) problems.push(`${file} (chunk ${chunk.name}) uses ${key}, which is in the chunk ${owner.get(key)}: keep it in the core catalog`);
    }
  }
  return { problems, core, chunkKeys, coreUses, chunkUses };
}
