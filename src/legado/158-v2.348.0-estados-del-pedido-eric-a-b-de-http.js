/* ============================================================
   v2.348.0 · Estados del pedido (Eric: A + B de https://claude.ai/artifact/TNX2JSHkXP6thEzunyUZ8b). «Validado» decía que el
   pedido estaba bien hecho, no que estuviera cobrado, y el indicador «Pagos por validar» usaba la misma palabra. Ahora:
   A · el estado es «Confirmado» y el cobro va aparte (Pendiente de cobro / Cobrado / Sin cargo);
   B · en la lista, el estado dice qué le falta: Borrador, Esperando pago, Por cobrar, Por preparar, Por facturar, Completado
   o Anulado. Se calcula con lo que ya se guarda. Con contrarreembolso se prepara antes de cobrar; con las demás formas de
   pago, primero se cobra (así, en «Pendientes de cobro» todos dicen «Por cobrar»).
   ============================================================ */
const cobroDe = p => p.sin_cargo || sinCargoP(p, p.total) ? 'Sin cargo' : p.pago_estado === 'Cobrado' || p.pago_validado_en ? 'Cobrado' : 'Pendiente de cobro';


