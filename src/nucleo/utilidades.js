// @ts-check
// nucleo/utilidades.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función y constantes de valor puro: su sitio no cambia lo que hace la app. Normas: docs/normas_codigo.md.

/** Elemento por id. Devuelve any: cada id es un tipo distinto (dialog, input, select…) y se resuelve al ejecutar. @type {(id: string) => any} */
const $ = id => document.getElementById(id);

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const partesNombre = n => { const p = String(n || '').trim().split(/\s+/); while (p.length > 1 && TRATAMIENTO.test(p[0])) p.shift(); return p; };

const nombrePila = n => partesNombre(n)[0] || '';

const iniciales = n => partesNombre(n).slice(0, 2).map(x => x[0] || '').join('').toUpperCase();

let temporizador;

// Las peticiones de Supabase no traen .catch ni .finally: se añaden para que el código que los usa no falle.
const conCatch = b => {
  if (b && typeof b.then === 'function' && typeof b.catch !== 'function') {
    b.catch = f => Promise.resolve(b).catch(f);
    b.finally = f => Promise.resolve(b).finally(f);
  }
  return b;
};

const nombreApp = () => MARCA.nombre || 'Mi empresa';

const hexRGB = h => { const x = (h || '#1C2733').replace('#', ''); return [0, 2, 4].map(i => parseInt(x.substr(i, 2), 16)); };
