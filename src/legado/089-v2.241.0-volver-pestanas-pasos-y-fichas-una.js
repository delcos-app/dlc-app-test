(() => {
  const d = $('dlg'); if (!d) return;
  const sm = d.showModal;
  d.showModal = function () { d.classList.toggle('dlgficha', !!FX_FICHA); return sm.apply(this, arguments); };
  d.addEventListener('close', () => d.classList.remove('dlgficha'));
})();
['verPedido', 'verFactura', 'verEvento', 'verCirugia', 'verConcurso', 'verEquipo', 'fichaCentro', 'fichaStock', 'verDeposito'].forEach(n => {
  const orig = window[n]; if (typeof orig !== 'function') return;
  window[n] = async function (...a) { FX_FICHA++; try { return await orig.apply(this, a); } finally { FX_FICHA--; } };
});


/* v2.242.0 · Limpieza segura: fuera funciones sin uso y cuerpos antiguos redefinidos; estilos de clases que ya no existen. */


