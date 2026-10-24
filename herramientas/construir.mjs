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
// --repartir: solo para herramientas mecánicas que reescriben app.js o index.html enteros (p. ej. fundir capas). Devuelve cada trozo a su
// pieza buscando, en orden, las dos primeras líneas de cada pieza; si no aparecen, no toca nada.
if (process.argv.includes('--repartir')) {
  for (const [destino, piezas] of Object.entries(ORDEN.salidas)) {
    const lin = leer(destino).split('\n'), cortes = [];
    let desde = 0;
    for (const p of piezas) {
      const [primera, segunda] = leer(p).split('\n');
      let i = desde;
      while (i < lin.length && !(lin[i] === primera && (segunda === undefined || lin[i + 1] === segunda))) i++;
      if (i >= lin.length || (cortes.length === 0 && i !== 0)) { console.error(`✗ ${destino}: no encuentro el principio de ${p} («${primera.slice(0, 60)}»)`); process.exit(1); }
      cortes.push(i); desde = i + 1;
    }
    cortes.push(lin.length);
    piezas.forEach((p, k) => fs.writeFileSync(path.join(RAIZ, p), lin.slice(cortes[k], cortes[k + 1]).join('\n') + (k === piezas.length - 1 ? '' : '\n')));
    console.log(`${destino} → ${piezas.length} piezas`);
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
