
const CIERRE_USUARIO = {}, CIERRE_PEND = {};
['pointerdown', 'keydown'].forEach(t => document.addEventListener(t, () => { ULT_ACCION = performance.now(); }, true));
['dlg', 'dlg2', 'ficha'].forEach(id => {
  const d = $(id); if (!d) return;
  d.addEventListener('cancel', () => { CIERRE_PEND[id] = performance.now(); });
  d.addEventListener('click', e => { if (e.target === d || e.target.closest('[data-cerrar], [data-cerrar2], .x')) CIERRE_PEND[id] = performance.now(); }, true);
  // v2.354.0: solo cuenta si se cerró mientras cargaba (con el cargador a la vista); cerrar una ventana ya pintada no bloquea nada
  d.addEventListener('close', () => { const p = CIERRE_PEND[id], cargando = d.classList.contains('pdprep') || !!d.querySelector('.spin, .preparando, .cargando, .skel');
    if (p && performance.now() - p < 600 && cargando) CIERRE_USUARIO[id] = performance.now(); CIERRE_PEND[id] = 0; });
  const sm = d.showModal;
  d.showModal = function (...a) {
    const c = CIERRE_USUARIO[id];
    if (c && ULT_ACCION < c && !(typeof VUELTA_REABRIENDO !== 'undefined' && VUELTA_REABRIENDO) && performance.now() - c < 8000) { CIERRE_USUARIO[id] = 0; return; }
    return sm.apply(this, a);
  };
});


