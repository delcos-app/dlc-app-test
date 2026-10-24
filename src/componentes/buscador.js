// @ts-check
// componentes/buscador.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

/* ============================================================
   v2.94.0 · Buscador inteligente
   La base de datos busca palabra a palabra (sin acentos, en cualquier orden,
   por el principio de cada palabra y con una letra de margen) y ordena por
   relevancia. Aquí se resalta en los resultados la parte que coincide.
   ============================================================ */
function resaltarBusqueda(texto, q) {
  const s = String(texto == null ? '' : texto);
  // Las más largas primero: si «pe» y «pedro» coinciden, se marca «pedro»
  const tks = [...new Set(clasNorm(q).split(/[^\p{L}\p{N}]+/u).filter(Boolean))].sort((a, b) => b.length - a.length);
  if (!tks.length) return esc(s);
  let html = '', ult = 0;
  for (const m of s.matchAll(/[\p{L}\p{N}]+/gu)) {
    const w = clasNorm(m[0]);
    if (w.length !== m[0].length) continue;   // si al quitar acentos cambia el largo, no se marca (no se descuadra)
    let ini = -1, largo = 0;
    for (const tk of tks) {
      if (w.startsWith(tk)) { ini = 0; largo = tk.length; break; }
      if (ini < 0 && tk.length >= 3 && w.indexOf(tk) > 0) { ini = w.indexOf(tk); largo = tk.length; }
    }
    if (ini < 0) continue;
    const a = m.index + ini;
    html += esc(s.slice(ult, a)) + '<mark>' + esc(s.slice(a, a + largo)) + '</mark>';
    ult = a + largo;
  }
  return html + esc(s.slice(ult));
}

let BUSQ_N = 0;   // solo cuenta la última búsqueda: las anteriores se descartan aunque respondan después

// Solo los buscadores: los de tipo búsqueda y los campos con su lista de resultados justo debajo
const esBuscador = i => i && i.matches && i.matches('input') && !i.list && (i.type === 'search' || (!!i.nextElementSibling && i.nextElementSibling.matches('.gsug, .cpres, .lista, [role=listbox]')));
