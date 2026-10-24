// Revisión de las librerías de fuera (plan de migración, 2.6). Uso: node herramientas/dependencias.mjs [--actualizaciones]
//
// Busca en src/, estilos/ y sw.js cada dirección de cdnjs, jsdelivr o unpkg y comprueba:
//   1. que lleva una versión exacta (nada de «@2» ni «latest»): una versión nueva de la librería no puede entrar sola;
//   2. que la huella de integridad (integrity="sha384-…") coincide con lo que sirve hoy la CDN: si la cambiaran, el navegador
//      no la ejecutaría (las hojas de estilo con @import no admiten huella: se avisa);
//   3. con --actualizaciones, si npm tiene una versión más nueva (para revisarla, nunca para cambiarla sin probar).
// Sale con 1 si algo no cumple. Necesita red.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const archivos = ['sw.js', ...['src', 'estilos'].flatMap(d => fs.readdirSync(path.join(RAIZ, d), { recursive: true }).map(f => path.join(d, String(f))))]
  .filter(f => /\.(js|css|html)$/.test(f));
const URL_RE = /https:\/\/(?:cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|unpkg\.com)\/[^'"`\s)]+/g;
const usos = new Map();
for (const f of archivos) {
  const t = fs.readFileSync(path.join(RAIZ, f), 'utf8');
  for (const m of t.matchAll(URL_RE)) {
    const u = m[0];
    // la huella va en el mismo elemento o en la línea siguiente de código: se busca cerca
    const cerca = t.slice(m.index, m.index + 400).match(/integrity\s*=\s*['"]?(sha384-[A-Za-z0-9+/=]+)/);
    const e = usos.get(u) || { archivos: new Set(), huella: null };
    e.archivos.add(f.replace(/\\/g, '/')); if (cerca) e.huella = cerca[1];
    usos.set(u, e);
  }
}
let mal = 0;
const ver = u => (u.match(/@(\d[\w.-]*)\//) || u.match(/\/(\d+\.\d+\.\d+)\//) || [])[1];
for (const [u, e] of usos) {
  const v = ver(u), exacta = v && /^\d+\.\d+\.\d+$/.test(v);
  const linea = [`${exacta ? '✓' : '✗'} ${u}`];
  if (!exacta) { linea.push('   sin versión exacta'); mal++; }
  if (u.endsWith('.css')) linea.push('   hoja de estilo (@import): sin huella posible');
  else if (!e.huella) { linea.push('   sin huella de integridad'); mal++; }
  else {
    try {
      const r = await fetch(u); const b = Buffer.from(await r.arrayBuffer());
      const h = 'sha384-' + crypto.createHash('sha384').update(b).digest('base64');
      if (h !== e.huella) { linea.push(`   ✗ la huella no coincide con lo que sirve la CDN (${h})`); mal++; } else linea.push('   huella correcta');
    } catch (err) { linea.push('   no se ha podido descargar: ' + err.message); mal++; }
  }
  if (process.argv.includes('--actualizaciones') && exacta) {
    const pk = (u.match(/\/npm\/(@?[^@]+)@/) || u.match(/unpkg\.com\/(@?[^@]+)@/) || u.match(/\/ajax\/libs\/([^/]+)\//) || [])[1];
    try { const j = await (await fetch(`https://registry.npmjs.org/${pk === 'leaflet' || pk === 'xlsx' ? pk : pk}`)).json();
      const ult = j['dist-tags'] && j['dist-tags'].latest;
      if (ult && ult !== v) linea.push(`   hay una versión más nueva: ${ult} (publicada ${String(j.time[ult]).slice(0, 10)})`);
    } catch { }
  }
  linea.push('   en ' + [...e.archivos].join(', '));
  console.log(linea.join('\n'));
}
console.log(mal ? `\n${mal} problemas` : '\nTodas las librerías con versión exacta y huella correcta');
process.exit(mal ? 1 : 0);
