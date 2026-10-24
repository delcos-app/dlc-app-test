/* ============================================================
   v2.241.0 · Volver, pestañas, pasos y fichas: una sola forma (Eric eligió la A «Ligera» de
   https://claude.ai/artifact/SYZkDbbm8dtSRTUWEN5TE4). «‹ Destino» como enlace encima del título; pestañas en caja segmentada;
   pasos de los asistentes en barra numerada; y la ficha de un registro (pedido, factura, evento, intervención, concurso, equipo, centro,
   stock, depósito) en panel lateral en el ordenador, como la de un contacto: la lista sigue a la vista. Los formularios y las
   ventanas anchas (comparar, importar…) siguen como estaban, y Configuración sigue sin ventanas emergentes.
   ============================================================ */
let FX_FICHA = 0;
// Mientras se abre una ficha, no se encaja en la página
areaEncaje = (orig => function (...a) { return FX_FICHA ? null : orig.apply(this, a); })(areaEncaje);
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


