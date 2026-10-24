/* ============================================================
   v2.348.0 · Estados del pedido (Eric: A + B de https://claude.ai/artifact/TNX2JSHkXP6thEzunyUZ8b). «Validado» decía que el
   pedido estaba bien hecho, no que estuviera cobrado, y el indicador «Pagos por validar» usaba la misma palabra. Ahora:
   A · el estado es «Confirmado» y el cobro va aparte (Pendiente de cobro / Cobrado / Sin cargo);
   B · en la lista, el estado dice qué le falta: Borrador, Esperando pago, Por cobrar, Por preparar, Por facturar, Completado
   o Anulado. Se calcula con lo que ya se guarda. Con contrarreembolso se prepara antes de cobrar; con las demás formas de
   pago, primero se cobra (así, en «Pendientes de cobro» todos dicen «Por cobrar»).
   ============================================================ */
const cobroDe = p => p.sin_cargo || sinCargoP(p, p.total) ? 'Sin cargo' : p.pago_estado === 'Cobrado' || p.pago_validado_en ? 'Cobrado' : 'Pendiente de cobro';
function pillCobroPed(p) {
  if (p.estado !== 'Confirmado') return '';
  const c = cobroDe(p);
  return ' <span class="pill ' + (c === 'Cobrado' ? 'p-trfok' : c === 'Sin cargo' ? 'p-sr' : 'p-bor') + '">' + c + '</span>';
}
function pasoPedido(p) {
  if (p.estado === 'Anulado') return ['Anulado', 'p-anu'];
  if (p.estado === 'Borrador') return p.email_pago_en ? ['Esperando pago', 'p-bor'] : ['Borrador', 'p-sr'];
  if (p.completado === true) return ['Completado', 'p-trfok'];   // v2.351.0: la misma regla que las cifras (pedido_completado)
  const alEntregar = /reembolso/i.test(p.forma_pago || ''), porCobrar = cobroDe(p) === 'Pendiente de cobro';
  if (porCobrar && !alEntregar) return ['Por cobrar', 'p-bor'];
  if (!p.paquete_en) return ['Por preparar', 'p-est'];
  if (porCobrar) return ['Por cobrar', 'p-bor'];
  if (p.completado === false || (!p.factura && !p.factura_id && cobroDe(p) !== 'Sin cargo')) return ['Por facturar', 'p-est'];
  return ['Completado', 'p-trfok'];
}
function pillPaso(p) {
  const [t, c] = pasoPedido(p);
  const hechos = p.estado === 'Confirmado' ? ['Confirmado', p.paquete_en ? 'Preparado' : '', cobroDe(p) === 'Cobrado' ? 'Cobrado' : '', p.factura ? 'Facturado' : ''].filter(Boolean).join(' · ') : '';
  return '<span class="pill ' + c + '"' + (hechos ? ' title="Hecho: ' + hechos + '"' : '') + '>' + t + '</span>';
}


