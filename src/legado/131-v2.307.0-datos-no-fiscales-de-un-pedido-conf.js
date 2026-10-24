/* ============================================================
   v2.307.0 · Datos no fiscales de un pedido confirmado (petición de Eric: «todo lo que no es fiscal debe poder editarse»).
   «Editar datos» en un pedido confirmado o facturado: nota, forma de pago, referencia del pago y campos personalizados del
   pedido. Las líneas, precios, IVA, cliente y fecha no se tocan (son la base de la factura); una factura emitida tampoco
   cambia: conserva la forma de pago con la que se emitió. Se guarda directamente (la regla ped_edit ya lo permite a
   administración y a quien lleva ventas con nivel 2) y queda en el historial de cambios.
   ============================================================ */
function editarPedidoNoFiscal(data) {
  const p = data.pedido, cps = camposHTML('pedido', p.clasificadores || {});
  $('dlg2body').innerHTML = `<div class="fh"><div><h2>Editar datos del pedido ${esc(p.numero || '')}</h2>
      <div class="sm">Solo lo que no es fiscal: las líneas, los importes, el cliente y la fecha no cambian.</div></div>
      <button class="x" data-cerrar2 aria-label="Cerrar">✕</button></div>
    <label for="nfnota">Nota</label><textarea id="nfnota" rows="4">${esc(p.nota || '')}</textarea>
    <div class="g2"><div><label for="nffp">Forma de pago</label><select id="nffp"><option value="">—</option>${(CAT.forma_pago || []).map(x => `<option ${p.forma_pago === x.valor ? 'selected' : ''}>${esc(x.valor)}</option>`).join('')}</select></div>
      <div><label for="nfref">Referencia del pago</label><input id="nfref" value="${esc(p.pago_referencia || '')}" placeholder="p. ej. número de la transferencia"></div></div>
    ${p.factura_id ? '<p class="sm">Este pedido ya tiene factura: la factura emitida conserva la forma de pago con la que se hizo.</p>' : ''}
    <div id="nfcampos">${cps}</div>
    <div class="acts nfacts"><button class="btn sec" data-cerrar2>Cancelar</button><button class="btn" id="nfok">Guardar</button></div>`;
  $('dlg2').showModal();
  $('nfok').onclick = async ev => {
    const leido = camposLeer($('nfcampos'));
    if (leido && leido.falta.length) { toast(`Rellena «${leido.falta[0]}»`, true); return; }
    ev.target.disabled = true;
    const { error } = await db.from('pedidos').update({ nota: $('nfnota').value.trim() || null, forma_pago: $('nffp').value || null, pago_referencia: $('nfref').value.trim() || null }).eq('id', p.id);
    if (error) { ev.target.disabled = false; toast('No se ha podido guardar: ' + error.message, true); return; }
    if (!(await camposGuardar(leido, p.id))) { ev.target.disabled = false; return; }
    $('dlg2').close(); toast('Datos del pedido guardados');
    try { invalidarCache(); } catch (e) {}
    verPedido(p.id);
  };
}


