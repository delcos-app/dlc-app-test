// nucleo/idioma.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

function prepararIdioma(id) {
  IDIOMA = LOCALES[id] ? id : 'es'; document.documentElement.lang = IDIOMA;
  const i = IDIOMAS.findIndex(x => x[0] === IDIOMA);
  MAPA_I18N = null; if (i <= 0) return;
  MAPA_I18N = new Map();
  const may = t => t.charAt(0).toUpperCase() + t.slice(1), min = t => t.charAt(0).toLowerCase() + t.slice(1);
  I18N.forEach(r => { MAPA_I18N.set(r[0], r[i]); MAPA_I18N.set(min(r[0]), min(r[i])); MAPA_I18N.set(may(r[0]), may(r[i])); });
}

function traducirTexto(t) {
  if (!MAPA_I18N) return null;
  const k = t.trim(); if (!k || k.length > 90) return null;
  const v = MAPA_I18N.get(k); if (v) return t.replace(k, v);
  const m = k.match(/^(Buenos días|Buenas tardes|Buenas noches), (.+)$/);
  if (m && SALUDOS[IDIOMA]) return t.replace(k, SALUDOS[IDIOMA][['Buenos días', 'Buenas tardes', 'Buenas noches'].indexOf(m[1])] + ', ' + m[2]);
  return null;
}

function traducir(raiz) {
  if (!MAPA_I18N || !raiz) return;
  const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT, { acceptNode: n => n.parentElement && n.parentElement.closest('script,style,textarea,[data-notr]') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
  const nodos = []; while (w.nextNode()) nodos.push(w.currentNode);
  nodos.forEach(n => { const v = traducirTexto(n.nodeValue); if (v != null && v !== n.nodeValue) n.nodeValue = v; });
  (raiz.querySelectorAll ? raiz.querySelectorAll('[placeholder],[title],[aria-label]') : []).forEach(e => ['placeholder', 'title', 'aria-label'].forEach(a => {
    const x = e.getAttribute(a); if (!x) return; const v = traducirTexto(x); if (v != null && v !== x) e.setAttribute(a, v);
  }));
}

function aplicarIdioma(id) {
  prepararIdioma(id);
  try { localStorage.setItem('app-idioma', IDIOMA); } catch (e) {}
  if (MAPA_I18N) traducir(document.body);
}
