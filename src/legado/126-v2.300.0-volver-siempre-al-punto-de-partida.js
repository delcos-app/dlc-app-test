/* ============================================================
   v2.300.0 · Volver siempre al punto de partida (petición de Eric). Cuando desde una ventana se abre otra (una cita → la
   ficha del centro → la ficha de un profesional…), la de antes se apunta en una pila. Al cerrar la de dentro (con su ✕,
   con «‹ Volver» o al guardar y cerrarse), se vuelve a abrir la anterior con sus datos al día, en vez de dejar a la persona
   en la pantalla de debajo. Cerrar la primera cierra del todo. Cambiar de pantalla vacía la pila.
   ============================================================ */
const VUELTA = [];
let VISTA = null, VUELTA_REABRIENDO = false, VUELTA_CLIC = null, VUELTA_PONER = false;
// El último clic dentro de una ventana (menos su ✕): así se sabe que la ventana nueva se abrió desde ella aunque el botón la cierre antes
document.addEventListener('click', e => {
  const d = e.target.closest && e.target.closest('dialog'); if (!d || e.target.closest('[data-cerrar], .x, .vueltabtn')) return;
  VUELTA_CLIC = { d, t: performance.now() };
}, true);
const VISTA_TITULO = { verCita: 'la cita', fichaCentro: 'el centro', abrirFicha: 'la ficha', verPedido: 'el pedido', verFactura: 'la factura', verEvento: 'el evento',
  verCirugia: 'la intervención', verConcurso: 'el concurso', verEquipo: 'el equipo', verDeposito: 'el depósito', fichaStock: 'el producto' };
const vistaDlg = () => ['ficha', 'dlg'].map($).find(d => d && d.open) || null;
const vistaIgual = (a, b) => a && b && a.fn === b.fn && JSON.stringify(a.args.map(x => x && x.id || x)) === JSON.stringify(b.args.map(x => x && x.id || x));
function vistaBoton(v, d0) {
  const d = d0 || (v && v.dlg); if (!d || !d.open || !VUELTA.length || d.querySelector('.vueltabtn')) return;
  const fh = d.querySelector('.fh'); if (!fh) return;
  const ant = VUELTA[VUELTA.length - 1];
  const t = fh.firstElementChild, dentro = t && t.tagName !== 'BUTTON' && !t.matches('h2') ? t : fh;
  dentro.insertAdjacentHTML('afterbegin', `<button type="button" class="btn sec chico vueltabtn" title="Volver a ${esc(VISTA_TITULO[ant.fn] || 'la ventana anterior')}">‹ Volver</button>`);
}
Object.keys(VISTA_TITULO).forEach(fn => {
  const orig = window[fn]; if (typeof orig !== 'function') return;
  window[fn] = async function (...args) {
    const nueva = { fn, args, t: performance.now() };
    // La de antes cuenta si sigue abierta o se acaba de cerrar para abrir esta (los botones cierran y abren seguido)
    const desde = VISTA && VISTA.dlg && (VISTA.dlg.open || (VUELTA_CLIC && VUELTA_CLIC.d === VISTA.dlg && performance.now() - VUELTA_CLIC.t < 1500));
    if (!VUELTA_REABRIENDO && desde && !vistaIgual(VISTA, nueva)) { VISTA.cerrada = null; VUELTA.push(VISTA); if (VUELTA.length > 8) VUELTA.shift(); }
    VISTA = nueva; VUELTA_PONER = VUELTA.length > 0;
    try { const r = await orig.apply(this, args); if (VISTA === nueva) { nueva.dlg = vistaDlg(); vistaBoton(nueva); } return r; }
    finally { if (VISTA === nueva) VUELTA_PONER = false; }
  };
});
['dlg', 'ficha'].forEach(id => {
  const d = $(id); if (!d) return;
  // «‹ Volver» se pone antes de que la ventana se vea (si aparece después, el título salta)
  const sm = d.showModal;
  d.showModal = function (...a) { const r = sm.apply(this, a); if (VUELTA_PONER && VISTA) { VISTA.dlg = d; vistaBoton(VISTA, d); } return r; };
  d.addEventListener('close', () => {
    const v = VISTA; if (!v || v.dlg !== d) return;
    v.cerrada = performance.now();
    setTimeout(() => {
      if (VISTA !== v || !v.cerrada || d.open || !VUELTA.length) return;
      if (document.querySelector('dialog[open]')) return;   // se abrió otra cosa encima: no se toca
      const ant = VUELTA.pop(); VISTA = null; VUELTA_REABRIENDO = true;
      Promise.resolve(window[ant.fn](...ant.args)).finally(() => { VUELTA_REABRIENDO = false; if (VISTA) vistaBoton(VISTA); });
    }, 380);
  });
});
document.addEventListener('click', e => { const b = e.target.closest('.vueltabtn'); if (!b) return; const d = b.closest('dialog'); if (d && d.open) d.close(); });
ir = (orig => function (...a) { VUELTA.length = 0; VISTA = null; return orig.apply(this, a); })(ir);

