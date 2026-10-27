// Traduce una pila de error de la app publicada (min/app.js:línea:columna) a líneas de app.js, con el mapa min/app.js.map.
//   node herramientas/pila.mjs "<pila copiada del registro de errores>"     (o por la entrada estándar)
// Sin dependencias: usa el lector de mapas de Node (node:module).
// Plan 7.3: las pantallas que se cargan al usarlas van en min/chunks/<pantalla>.js, cada una con su mapa; sus líneas se leen en
// src/generated/chunks/<pantalla>.js (el trozo legible, como app.js para el núcleo).
import fs from 'node:fs';
import path from 'node:path';
import { SourceMap } from 'node:module';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const texto = process.argv[2] ?? fs.readFileSync(0, 'utf8');

// Para cada archivo publicado: su mapa y el archivo legible del que sale (se leen una vez y solo si la pila los nombra)
const leidos = new Map();
function fuente(publicado) {
  if (!leidos.has(publicado)) {
    const trozo = /^min\/chunks\/([\w-]+)\.js$/.exec(publicado), legible = trozo ? `src/generated/chunks/${trozo[1]}.js` : 'app.js';
    const mapa = path.join(RAIZ, `${publicado}.map`);
    leidos.set(publicado, fs.existsSync(mapa) ? {
      mapa: new SourceMap(JSON.parse(fs.readFileSync(mapa, 'utf8'))), legible,
      lineas: fs.readFileSync(path.join(RAIZ, legible), 'utf8').split('\n'),
    } : null);
  }
  return leidos.get(publicado);
}

console.log(texto.replace(/(?:[\w./:-]*\/)?(min\/app\.js|min\/chunks\/[\w-]+\.js)(?:\?v=[\d.]+)?:(\d+):(\d+)/g, (todo, publicado, linea, columna) => {
  const f = fuente(publicado);
  if (!f) return todo;
  // Las pilas cuentan desde 1; el mapa, desde 0
  const sitio = f.mapa.findEntry(Number(linea) - 1, Number(columna) - 1);
  if (!sitio || sitio.originalLine === undefined) return todo;
  const n = sitio.originalLine + 1, codigo = (f.lineas[sitio.originalLine] ?? '').trim().slice(0, 100);
  return `${f.legible}:${n}:${sitio.originalColumn + 1} «${codigo}»`;
}));
