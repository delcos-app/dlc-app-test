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


