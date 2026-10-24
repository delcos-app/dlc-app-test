async function enviarDatosPago(id) {
  if (!((AJUSTES.empresa || {}).iban || '').trim()) { toast('Falta el IBAN: ponlo en Configuración → Facturación → Datos fiscales antes de enviar los datos de pago', true); return false; }
  const { data } = await RPC_ORIG('pedido_detalle', { p_id: id });
  const p = data && data.pedido; if (!p) { toast('No se ha encontrado el pedido', true); return false; }
  const cli = data.contacto || {}, total = +((data.totales || {}).total || 0);
  if (!cli.email) { toast(`${TT('paciente', 's', '', 'l', 'C')} no tiene email en su ficha`, true); return false; }
  const asunto = asuntoEmailPago(p, total, cli.nombre), texto = textoEmailPago(p, total, cli.nombre);
  const { data: r, error } = await db.functions.invoke('enviar_email', { body: { para: cli.email, asunto, texto, pedido_id: id, marca: 'email_pago' } });
  if (!error && r && r.ok) { toast('Datos de pago enviados · el pedido espera al pago en borrador'); return true; }
  location.href = `mailto:${cli.email}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(texto)}`;   // sin envío directo: el correo del dispositivo
  if (await preguntar('¿Has enviado el email con los datos de pago?', { titulo: 'Email de pago', ok: 'Sí, marcar como enviado' }))
    await db.rpc('marcar_operativa', { p_pedido: id, p_campo: 'email_pago', p_hecho: true });
  return true;
}
verPedido = (orig => async function (id, ...a) {
  const r = await orig.call(this, id, ...a);
  try {
    if (!$('dlg').open || $('pdtrfb') || !$('pdvalidar') || !puedeVentas()) return r;
    const { data } = await RPC_ORIG('pedido_detalle', { p_id: id });
    const p = data && data.pedido;
    if (!p || p.estado !== 'Borrador' || !esTransferencia(p.forma_pago) || $('pdtrfb') || !$('pdvalidar')) return r;
    const cli = data.contacto || {};
    const acts = $('pdvalidar').closest('.acts');
    acts.insertAdjacentHTML('beforebegin', `<div class="blk" id="pdtrfb"><h3>Pago por transferencia</h3>
      <p class="sm">${p.email_pago_en ? `Datos de pago enviados el ${fechaCorta(String(p.email_pago_en).slice(0, 10))}. El pedido espera en borrador hasta que llegue el pago.` : 'Datos de pago sin enviar. El pedido espera en borrador hasta que llegue el pago.'}</p>
      <div class="acts pdtrfacts">${cli.email ? `<button type="button" class="btn sec chico" id="pdtrfmail">${p.email_pago_en ? 'Volver a enviar los datos de pago' : 'Enviar los datos de pago'}</button>` : `<span class="sm">${esc(TT('paciente', 's', '', 'l', 'C'))} no tiene email en su ficha.</span>`}
        <button type="button" class="btn chico" id="pdtrfok">Cobrado · confirmar</button></div></div>`);
    if ($('pdtrfmail')) $('pdtrfmail').onclick = async e => { e.target.disabled = true; if (await enviarDatosPago(id)) verPedido(id); else e.target.disabled = false; };
    $('pdtrfok').onclick = () => { const v = $('pdvalidar'); v.dataset.pago = '1'; v.click(); setTimeout(() => { if (v.isConnected) delete v.dataset.pago; }, 60000); };
  } catch (e) {}
  return r;
})(verPedido);


