/* ============================================================
   v2.333.0 · Cobro con tarjeta o Bizum con el pedido en borrador hasta que se paga (decisión de Eric, 20/10/2026; SQL 172), como la
   transferencia: en el pedido, con tarjeta o Bizum, «Enviar enlace de pago» guarda el pedido en borrador y envía el SMS; «Guardar y
   validar» pregunta si se envía el enlace o se valida ya. Al pagar, el pedido se confirma solo y queda cobrado (lo hace la base con el aviso
   del banco). Si no paga, sigue en borrador: se reenvía o se elimina, sin rectificativa. Si se cambia un borrador con un enlace enviado y
   cambia el importe, se avisa de enviar uno nuevo (un enlace antiguo pagado no valida nada: avisa para revisarlo).
   ============================================================ */
async function tpvMovilDe(contacto) {
  if (!contacto || !contacto.id) return '';
  const { data: kc } = await db.from('contactos').select('movil,telefono').eq('id', contacto.id).maybeSingle();
  return tpvMovil((kc && (kc.movil || kc.telefono)) || '');
}
async function tpvTrasGuardar(id) {
  await tpvEnviar(id);
  verPedido(id);
  if (TAB === 'ventas') cargarVentas();
}
async function tpvAvisoImporte(id) {
  const [{ data: t }, { data: d }] = await Promise.all([
    db.from('pagos_tpv').select('importe').eq('pedido_id', id).eq('estado', 'Enviado').order('creado_en', { ascending: false }).limit(1).maybeSingle(),
    RPC_ORIG('pedido_detalle', { p_id: id })]);
  const tot = d && d.totales ? +d.totales.total : null;
  if (t && tot != null && Math.abs(+t.importe - tot) > 0.005)
    toast(`El enlace de pago enviado era de ${eurI(+t.importe)} y el pedido es ahora de ${eurI(tot)}: envía uno nuevo desde el pedido`, true);
}

/* v2.334.0: al cobrar por el enlace, la forma de pago del pedido pasa a ser la que eligió el cliente (SQL 173); «Abrir la página de pago (pruebas)» centrado como los demás botones. */


