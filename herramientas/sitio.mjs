// Copia en una carpeta lo que se publica (la app construida), sin el código fuente ni las herramientas.
// Uso: node herramientas/sitio.mjs <carpeta de salida> [--produccion]
//   --produccion: sin config.js, CNAME ni README.md (dlc-app-v2 tiene los suyos y no se tocan)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SAL = path.resolve(process.argv[2]);
const PROD = process.argv.includes('--produccion');
const FUERA = new Set(['src', 'estilos', 'herramientas', '.github', '.git', 'node_modules', 'tsconfig.json', 'package.json', 'package-lock.json',
  '.gitattributes', '.gitignore', 'eslint.config.mjs', ...(PROD ? ['config.js', 'CNAME', 'README.md'] : [])]);
fs.mkdirSync(SAL, { recursive: true });
let n = 0;
for (const f of fs.readdirSync(RAIZ)) {
  if (FUERA.has(f)) continue;
  fs.cpSync(path.join(RAIZ, f), path.join(SAL, f), { recursive: true }); n++;
}
console.log(`${n} entradas copiadas a ${SAL}${PROD ? ' (producción: sin config.js, CNAME ni README.md)' : ''}`);
