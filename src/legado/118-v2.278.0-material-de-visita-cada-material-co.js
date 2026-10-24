/* ============================================================
   v2.278.0 · Material de visita: cada material con su cantidad y su máximo en el portal (aviso de Eric, 12/10/2026).
   Antes, «Pide cantidad» solo se elegía al añadir y el máximo que puede pedir el profesional desde su portal (20 si nadie lo
   cambiaba) estaba en otro apartado. Ahora cada fila de «Material promocional» lleva:
   - Al registrar: «Anotar cuántas se entregan» o «Solo marcar que se entregó» (guardar_valor dato_tipo).
   - Con el portal: «Se puede pedir desde el portal» y «Máximo por petición» (1 a 1.000; vacío o fuera de rango avisa en la fila
     y no se guarda). Se guarda en el mismo ajuste que «Portal del profesional» (portal.material).
   ============================================================ */
pintarMaterial = (orig => async function (...x) {
  const r = await orig.apply(this, x);
  try { await matMejorar(); } catch (e) { registrarError('error', 'Material promocional: ' + e.message); }
  return r;
})(pintarMaterial);





