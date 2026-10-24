// componentes/iconos.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

function iconosMenu() {
  document.querySelectorAll('nav.main [data-t]').forEach(b => {
    if (b.querySelector('.navico') || !ICO_NAV[b.dataset.t]) return;
    b.insertAdjacentHTML('afterbegin', `<span class="navico">${svgIco(ICON_NOM[ICO_NAV[b.dataset.t]])}</span>`);
  });
}

// Sustituye los emojis y glifos por iconos de línea, en todo lo que se pinta
function iconizar(raiz) {
  if (!raiz || !raiz.nodeType) return;
  const el = raiz.nodeType === 1 ? raiz : raiz.parentElement; if (!el) return;
  if (el.closest && el.closest('script,style,textarea,svg,[data-noico]')) return;
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: n => {
    const p = n.parentElement; if (!p || p.closest('script,style,textarea,svg,[data-noico]')) return NodeFilter.FILTER_REJECT;
    RE_ICO.lastIndex = 0; return RE_ICO.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; } });
  const nodos = []; while (w.nextNode()) nodos.push(w.currentNode);
  nodos.forEach(n => {
    const p = n.parentElement;
    if (p.tagName === 'OPTION' || p.tagName === 'TITLE') { n.nodeValue = n.nodeValue.replace(RE_ICO, '').replace(/^\s+/, ''); return; }
    const frag = document.createDocumentFragment(); let ult = 0, m; RE_ICO.lastIndex = 0;
    const t = n.nodeValue;
    while ((m = RE_ICO.exec(t))) {
      if (m.index > ult) frag.appendChild(document.createTextNode(t.slice(ult, m.index)));
      if (m[0] !== '\ufe0f') { const s = document.createElement('span'); s.className = 'icw'; s.innerHTML = svgIco(ICON_EMOJI[m[0]]); frag.appendChild(s); }
      ult = m.index + m[0].length;
    }
    if (ult < t.length) frag.appendChild(document.createTextNode(t.slice(ult)));
    n.replaceWith(frag);
  });
  // Ayudas «i»
  (el.matches && el.matches('.ai') ? [el] : []).concat([...(el.querySelectorAll ? el.querySelectorAll('.ai') : [])]).forEach(b => {
    if (!b.querySelector('svg') && b.textContent.trim() === 'i') b.innerHTML = svgIco(ICON_NOM.info);
  });
}
