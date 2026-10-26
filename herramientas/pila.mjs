// Traduce una pila de error de la app publicada (min/app.js:línea:columna) a líneas de app.js, con el mapa min/app.js.map.
//   node herramientas/pila.mjs "<pila copiada del registro de errores>"     (o por la entrada estándar)
// Sin dependencias: usa el lector de mapas de Node (node:module).
import fs from 'node:fs';
import path from 'node:path';
import { SourceMap } from 'node:module';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mapa = new SourceMap(JSON.parse(fs.readFileSync(path.join(RAIZ, 'min', 'app.js.map'), 'utf8')));
const lineas = fs.readFileSync(path.join(RAIZ, 'app.js'), 'utf8').split('\n');
const texto = process.argv[2] ?? fs.readFileSync(0, 'utf8');

console.log(texto.replace(/(?:[\w./:-]*\/)?min\/app\.js(?:\?v=[\d.]+)?:(\d+):(\d+)/g, (todo, linea, columna) => {
  // Las pilas cuentan desde 1; el mapa, desde 0
  const sitio = mapa.findEntry(Number(linea) - 1, Number(columna) - 1);
  if (!sitio || sitio.originalLine === undefined) return todo;
  const n = sitio.originalLine + 1, codigo = (lineas[sitio.originalLine] ?? '').trim().slice(0, 100);
  return `app.js:${n}:${sitio.originalColumn + 1} «${codigo}»`;
}));
