/* ============================================================
   v2.67.0 · Centros: buscador en la ficha del médico, «Estoy aquí»
   que rellena los datos solo, centro nuevo con horario de apertura
   ============================================================ */

// Cada consulta del editor de la ficha pinta su selector al aparecer
new MutationObserver(() => {
  const cons = $('econs'); if (!cons) return;
  [...cons.children].forEach(box => {
    const i = box.dataset.cons, cp = box.querySelector(`[data-cp="${i}"]`);
    if (cp && !cp.dataset.listo) { cp.dataset.listo = '1'; pintarCentroSel(box, i); }
  });
}).observe(document.body, { childList: true, subtree: true });



