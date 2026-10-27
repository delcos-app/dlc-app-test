// Construcción de la app: junta los archivos de src/ y estilos/ en app.js e index.html, en el orden de src/orden.json.
//
//   node herramientas/construir.mjs              → escribe app.js e index.html
//   node herramientas/construir.mjs --comprobar  → no escribe: falla si app.js o index.html no son lo que sale de src/ (para antes de subir)
//
// app.js e index.html son GENERADOS: no se editan a mano (docs/normas_codigo.md). La construcción solo encadena los archivos tal cual,
// así que el resultado se puede comparar byte a byte. Los saltos de línea se normalizan a LF.
//
// v2.433.0 (plan 7.3 y 10.3): lo que carga index.html es min/app.js, el mismo app.js minimizado con esbuild, con su mapa
// min/app.js.map (los errores se leen sobre app.js con «node herramientas/pila.mjs»). app.js sigue siendo el legible: lo leen las
// pruebas y las herramientas de análisis. La ruta conserva «app.js?v=» (la comprobación de versión, VERSION_APP y el cambio de
// versión con sed lo buscan así). Presupuesto de peso: si min/app.js pasa de PESO, --comprobar falla.
// Sin esbuild (WSL con node_modules de Windows, o los flujos de publicación sin npm ci) no se minimiza: se deja el min/app.js que
// hay y --comprobar solo mira su peso.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = f => fs.readFileSync(path.join(RAIZ, f), 'utf8').replace(/\r\n/g, '\n');
const ORDEN = JSON.parse(leer('src/orden.json'));

// v2.445.0 (plan 11.2): the texts of the startup HTML live in the catalogue src/app/i18n/es/startup.ts. The pieces say
// {{startup.key}} and the build writes the text in, so index.html carries it before the code loads. The catalogue is a plain object
// of strings, read here without compiling TypeScript.
const STARTUP_CATALOGUE = 'src/app/i18n/es/startup.ts';
let startupTexts = null;
function startupText(key) {
  if (!startupTexts) {
    const source = leer(STARTUP_CATALOGUE), match = source.match(/export const startup = (\{[\s\S]*\}) as const;/);
    if (!match) throw new Error(`${STARTUP_CATALOGUE}: no tiene «export const startup = { … } as const;»`);
    startupTexts = new Function(`return (${match[1]});`)();
  }
  const value = key.split('.').slice(1).reduce((node, part) => (node && typeof node === 'object' ? node[part] : undefined), startupTexts);
  if (typeof value !== 'string') throw new Error(`index.html: {{${key}}} no está en ${STARTUP_CATALOGUE}`);
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
const fillStartupTexts = (output, text) => (output.endsWith('.html') ? text.replace(/\{\{(startup(?:\.\w+)+)\}\}/g, (_, key) => startupText(key)) : text);
// --repartir: solo para herramientas mecánicas que reescriben app.js o index.html enteros (p. ej. fundir capas). Compara, línea a
// línea, lo que salía de las piezas con el archivo nuevo (diferencias de Myers): cada línea que no cambia sigue en su pieza, una línea
// nueva va a la pieza de la línea anterior y una borrada desaparece. Así nunca pasa texto de una pieza a otra.
function diferencias(a, b) {
  // Myers O((N+M)·D): devuelve, para cada línea de b, el índice de su igual en a (o -1 si es nueva)
  const N = a.length, M = b.length, max = N + M, V = new Int32Array(2 * max + 2), traza = [];
  let fin = false;
  for (let d = 0; d <= max && !fin; d++) {
    traza.push(V.slice());
    for (let k = -d; k <= d; k += 2) {
      let x = (k === -d || (k !== d && V[max + k - 1] < V[max + k + 1])) ? V[max + k + 1] : V[max + k - 1] + 1, y = x - k;
      while (x < N && y < M && a[x] === b[y]) { x++; y++; }
      V[max + k] = x;
      if (x >= N && y >= M) { fin = true; break; }
    }
  }
  const de = new Int32Array(M).fill(-1);
  let x = N, y = M;
  for (let d = traza.length - 1; d >= 0 && (x > 0 || y > 0); d--) {
    const W = traza[d], k = x - y;
    const kp = (k === -d || (k !== d && W[max + k - 1] < W[max + k + 1])) ? k + 1 : k - 1;
    const xp = W[max + kp], yp = xp - kp;
    while (x > xp && y > yp) { x--; y--; de[y] = x; }
    if (d > 0) { x = xp; y = yp; }
  }
  return de;
}
if (process.argv.includes('--repartir')) {
  for (const [destino, piezas] of Object.entries(ORDEN.salidas)) {
    // The texts written in at build time cannot go back to their {{startup.…}} placeholders
    if (piezas.some(p => /\{\{startup\./.test(leer(p)))) { console.error(`✗ --repartir no reparte ${destino}: sus piezas llevan textos del catálogo ({{startup.…}})`); process.exit(1); }
    const viejas = [], dueno = [];
    piezas.forEach((p, k) => { const l = leer(p).split('\n'); if (k < piezas.length - 1) l.pop(); l.forEach(t => { viejas.push(t); dueno.push(k); }); });
    const nuevas = leer(destino).split('\n');
    const de = diferencias(viejas, nuevas);
    const trozos = piezas.map(() => []);
    let actual = 0;
    nuevas.forEach((t, i) => { if (de[i] >= 0) actual = dueno[de[i]]; trozos[actual].push(t); });
    piezas.forEach((p, k) => fs.writeFileSync(path.join(RAIZ, p), trozos[k].join('\n') + (k === piezas.length - 1 ? '' : '\n')));
    console.log(`${destino} → ${piezas.length} piezas (${de.filter(x => x < 0).length} líneas nuevas)`);
  }
  process.argv.push('--comprobar');
}
const comprobar = process.argv.includes('--comprobar');

let mal = 0;
for (const [destino, piezas] of Object.entries(ORDEN.salidas)) {
  const falta = piezas.filter(p => !fs.existsSync(path.join(RAIZ, p)));
  if (falta.length) { console.error(`✗ ${destino}: faltan ${falta.join(', ')}`); mal++; continue; }
  const texto = fillStartupTexts(destino, piezas.map(leer).join(''));
  if (comprobar) {
    const actual = fs.existsSync(path.join(RAIZ, destino)) ? leer(destino) : '';
    if (actual !== texto) { console.error(`✗ ${destino} no es lo que sale de src/: edita src/ y ejecuta «node herramientas/construir.mjs»`); mal++; }
    else console.log(`✓ ${destino} (${piezas.length} piezas)`);
  } else {
    fs.writeFileSync(path.join(RAIZ, destino), texto);
    console.log(`${destino}: ${piezas.length} piezas, ${texto.split('\n').length - 1} líneas`);
  }
}
// Plan 7.3 (cut A): the screens loaded on first use. herramientas/bundle.mjs writes them readable to src/generated/chunks (they are
// not part of app.js); here each one is minimised to min/chunks/<screen>.js with its map, and sw.js gets their list so the service
// worker keeps a copy (the app keeps working offline).
const CHUNKS_SRC = 'src/generated/chunks', CHUNKS_MIN = 'min/chunks';
const chunkNames = () => (fs.existsSync(path.join(RAIZ, CHUNKS_SRC)) ? fs.readdirSync(path.join(RAIZ, CHUNKS_SRC)).filter(f => f.endsWith('.js')).map(f => f.slice(0, -3)).sort() : []);

// Archivos de src/ y estilos/ que no están en el orden: se olvidarían en silencio
const enOrden = new Set(Object.values(ORDEN.salidas).flat());
const sueltos = ['src', 'estilos'].flatMap(d => fs.existsSync(path.join(RAIZ, d)) ? fs.readdirSync(path.join(RAIZ, d), { recursive: true }).map(f => `${d}/${f}`.replace(/\\/g, '/')) : [])
  .filter(f => /\.(js|css|html)$/.test(f) && !enOrden.has(f) && !f.startsWith(`${CHUNKS_SRC}/`));
if (sueltos.length) { console.error('✗ No están en src/orden.json: ' + sueltos.join(', ')); mal++; }

// v2.435.0 (plan 9.1): la política de seguridad (CSP) de index.html. Cada <script> en línea lleva su huella en script-src (si se
// cambia su texto sin cambiar la huella, el navegador no lo ejecuta) y cada base de config.js está en connect-src.
function comprobarPolitica() {
  if (!fs.existsSync(path.join(RAIZ, 'index.html'))) return 0;
  const html = leer('index.html'), meta = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/);
  if (!meta) { console.error('✗ index.html no tiene la política de seguridad (Content-Security-Policy)'); return 1; }
  const directiva = nombre => (meta[1].split(';').map(d => d.trim()).find(d => d.startsWith(nombre + ' ')) || '').split(/\s+/).slice(1);
  const scripts = directiva('script-src'), conexiones = directiva('connect-src');
  let fallos = 0;
  for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
    const huella = `'sha256-${crypto.createHash('sha256').update(m[1], 'utf8').digest('base64')}'`;
    if (!scripts.includes(huella)) { console.error(`✗ Un <script> en línea de index.html no tiene su huella en script-src: añade ${huella}`); fallos++; }
  }
  const config = fs.existsSync(path.join(RAIZ, 'config.js')) ? leer('config.js') : '';
  for (const [, base] of config.matchAll(/url:\s*'(https:\/\/[^'/]+)'/g)) {
    for (const origen of [base, base.replace('https://', 'wss://')]) {
      if (!conexiones.includes(origen)) { console.error(`✗ connect-src no permite ${origen} (está en config.js)`); fallos++; }
    }
  }
  if (!fallos) console.log('✓ política de seguridad (huellas en línea y bases de config.js)');
  return fallos;
}
mal += comprobarPolitica();

// Lo que se publica: min/app.js y su mapa, desde app.js
const MIN = 'min/app.js', MAPA = 'min/app.js.map';
// Presupuesto de la primera carga (v2.433.0: 2,02 MB y 620 KB comprimido; un 10 % de margen)
const PESO = { bruto: 2_230_000, gzip: 690_000 };
const kb = n => `${Math.round(n / 1024)} KB`;

async function minimizar(texto, origen = '../app.js', mapa = 'app.js.map') {
  let esbuild;
  try { esbuild = await import('esbuild'); } catch { return null; }
  try {
    const r = await esbuild.transform(texto, { minify: true, sourcemap: 'external', sourcefile: origen, target: 'es2020', charset: 'utf8', legalComments: 'none' });
    return { codigo: r.code + `//# sourceMappingURL=${mapa}\n`, mapa: r.map };
  } catch (e) {
    // esbuild instalado para otro sistema (node_modules de Windows usado desde WSL): no se puede minimizar aquí
    if (/platform/i.test(String(e && e.message))) return null;
    throw e;
  }
}

function pesar(codigo) {
  const bruto = Buffer.byteLength(codigo), gzip = zlib.gzipSync(codigo).length;
  const sobra = bruto > PESO.bruto || gzip > PESO.gzip;
  (sobra ? console.error : console.log)(`${sobra ? '✗' : '✓'} ${MIN}: ${kb(bruto)} (${kb(gzip)} comprimido; presupuesto ${kb(PESO.bruto)} y ${kb(PESO.gzip)})`);
  return sobra ? 1 : 0;
}

const appJs = fs.existsSync(path.join(RAIZ, 'app.js')) ? leer('app.js') : '';
const min = appJs ? await minimizar(appJs) : null;
const hay = fs.existsSync(path.join(RAIZ, MIN));
if (min) {
  if (comprobar) {
    const igual = hay && leer(MIN) === min.codigo && fs.existsSync(path.join(RAIZ, MAPA)) && leer(MAPA) === min.mapa;
    if (!igual) { console.error(`✗ ${MIN} no es app.js minimizado: ejecuta «node herramientas/construir.mjs»`); mal++; }
  } else {
    fs.mkdirSync(path.join(RAIZ, 'min'), { recursive: true });
    fs.writeFileSync(path.join(RAIZ, MIN), min.codigo);
    fs.writeFileSync(path.join(RAIZ, MAPA), min.mapa);
  }
  mal += pesar(min.codigo);
} else if (hay) {
  console.log(`· sin esbuild: no se minimiza; se mira el peso del ${MIN} que hay`);
  mal += pesar(leer(MIN));
} else { console.error(`✗ Falta ${MIN} y no hay esbuild para hacerlo (npm ci)`); mal++; }

// The lazy chunks: min/chunks/<screen>.js (and its map) from src/generated/chunks
async function minimizeChunk(name) {
  const file = `${CHUNKS_MIN}/${name}.js`, map = `${file}.map`, exists = fs.existsSync(path.join(RAIZ, file));
  const result = await minimizar(leer(`${CHUNKS_SRC}/${name}.js`), `../../${CHUNKS_SRC}/${name}.js`, `${name}.js.map`);
  if (!result) {
    if (exists) return 0;
    console.error(`✗ Falta ${file} y no hay esbuild para hacerlo (npm ci)`); return 1;
  }
  if (!comprobar) {
    fs.mkdirSync(path.join(RAIZ, CHUNKS_MIN), { recursive: true });
    fs.writeFileSync(path.join(RAIZ, file), result.codigo);
    fs.writeFileSync(path.join(RAIZ, map), result.mapa);
    return 0;
  }
  if (exists && leer(file) === result.codigo && fs.existsSync(path.join(RAIZ, map)) && leer(map) === result.mapa) return 0;
  console.error(`✗ ${file} no es ${CHUNKS_SRC}/${name}.js minimizado: ejecuta «node herramientas/construir.mjs»`); return 1;
}

async function minimizeChunks() {
  const names = chunkNames(), folder = path.join(RAIZ, CHUNKS_MIN);
  let failures = 0;
  for (const name of names) failures += await minimizeChunk(name);
  // Chunks of screens that are no longer loaded on first use
  const stale = fs.existsSync(folder) ? fs.readdirSync(folder).filter(f => !names.includes(f.replace(/\.js(\.map)?$/, ''))) : [];
  if (stale.length && comprobar) { console.error(`✗ ${CHUNKS_MIN} tiene archivos que ya no salen de ${CHUNKS_SRC}: ${stale.join(', ')}`); failures++; }
  else stale.forEach(f => { fs.rmSync(path.join(folder, f)); });
  const size = name => { const f = path.join(folder, `${name}.js`); return fs.existsSync(f) ? kb(fs.statSync(f).size) : '-'; };
  if (names.length) console.log(`· ${CHUNKS_MIN}: ${names.map(name => `${name} ${size(name)}`).join(', ')}`);
  return failures;
}

// sw.js keeps a copy of every chunk: its list (const CHUNKS = [...];) is written from the chunks there are
function chunkListInServiceWorker() {
  if (!fs.existsSync(path.join(RAIZ, 'sw.js'))) return 0;
  const text = leer('sw.js'), line = /^const CHUNKS = \[.*\];$/m;
  if (!line.test(text)) { console.error('✗ sw.js no tiene la lista de pantallas que se cargan al usarlas (const CHUNKS = [...];)'); return 1; }
  const wanted = text.replace(line, `const CHUNKS = [${chunkNames().map(name => `'./${CHUNKS_MIN}/${name}.js'`).join(', ')}];`);
  if (wanted === text) return 0;
  if (comprobar) { console.error('✗ La lista de pantallas de sw.js (const CHUNKS) no es la de src/generated/chunks: ejecuta «node herramientas/construir.mjs»'); return 1; }
  fs.writeFileSync(path.join(RAIZ, 'sw.js'), wanted);
  console.log('sw.js: lista de pantallas que se cargan al usarlas');
  return 0;
}

mal += await minimizeChunks();
mal += chunkListInServiceWorker();
process.exit(mal ? 1 : 0);
