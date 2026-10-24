const PAG_GUARDA_RE = /^guardar(\s|$)/i, PAG_GUARDA_NO = '#coprueba, #copruebaarriba, .cfuguarda .btn';
['input', 'change'].forEach(ev => document.addEventListener(ev, e => {
  const p = pagActual(); if (!p || !e.isTrusted) return;
  const t = e.target; if (!t.closest || !p.cuerpo.contains(t) || t.closest('dialog:not(.encajada:has([data-pagina])), .cfucab') || t.matches(PAG_NO_CAMBIA)) return;
  PAG_SUCIO.add(pagBloque(t, p.cuerpo)); pagMarcarSucio();
}, true));
// Elegir con botones (segmentados, marcar) también es cambiar
document.addEventListener('click', e => {
  const p = pagActual(); if (!p || !e.isTrusted) return;
  const b = e.target.closest && e.target.closest('.segs > button, [aria-pressed], [role=radio], [role=switch]');
  if (!b || !p.cuerpo.contains(b) || b.closest('.cfucab, .cfuidx, .pagtabs, .cfgsubs, dialog:not(.encajada:has([data-pagina]))')) return;
  PAG_SUCIO.add(pagBloque(b, p.cuerpo)); pagMarcarSucio();
}, true);
new MutationObserver(() => { if (PAG_GUARDA_RAF || !PAG_GUARDA.some(x => x.tab === TAB)) return; PAG_GUARDA_RAF = requestAnimationFrame(() => { PAG_GUARDA_RAF = 0; pagPonerGuardar(); }); })
  .observe(document.body, { childList: true, subtree: true });
