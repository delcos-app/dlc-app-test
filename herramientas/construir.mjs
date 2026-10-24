// Construcción de la app: junta los archivos de src/ y estilos/ en app.js e index.html, en el orden de src/orden.json.
//
//   node herramientas/construir.mjs              → escribe app.js e index.html
//   node herramientas/construir.mjs --comprobar  → no escribe: falla si app.js o index.html no son lo que sale de src/ (para antes de subir)
//
// app.js e index.html son GENERADOS: no se editan a mano (docs/normas_codigo.md). La construcción solo encadena los archivos tal cual,
// así que el resultado se puede comparar byte a byte. Los saltos de línea se normalizan a LF.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = f => fs.readFileSync(path.join(RAIZ, f), 'utf8').replace(/\r\n/g, '\n');
const ORDEN = JSON.parse(leer('src/orden.json'));
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
  const texto = piezas.map(leer).join('');
  if (comprobar) {
    const actual = fs.existsSync(path.join(RAIZ, destino)) ? leer(destino) : '';
    if (actual !== texto) { console.error(`✗ ${destino} no es lo que sale de src/: edita src/ y ejecuta «node herramientas/construir.mjs»`); mal++; }
    else console.log(`✓ ${destino} (${piezas.length} piezas)`);
  } else {
    fs.writeFileSync(path.join(RAIZ, destino), texto);
    console.log(`${destino}: ${piezas.length} piezas, ${texto.split('\n').length - 1} líneas`);
  }
}
// Archivos de src/ y estilos/ que no están en el orden: se olvidarían en silencio
const enOrden = new Set(Object.values(ORDEN.salidas).flat());
const sueltos = ['src', 'estilos'].flatMap(d => fs.existsSync(path.join(RAIZ, d)) ? fs.readdirSync(path.join(RAIZ, d), { recursive: true }).map(f => `${d}/${f}`.replace(/\\/g, '/')) : [])
  .filter(f => /\.(js|css|html)$/.test(f) && !enOrden.has(f));
if (sueltos.length) { console.error('✗ No están en src/orden.json: ' + sueltos.join(', ')); mal++; }
process.exit(mal ? 1 : 0);
