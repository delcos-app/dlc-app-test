/* ============================================================
   v2.284.0 · Pago por adelantado en el portal del centro (SQL 152).
   - Configuración → Portal: «Pago por adelantado» (ajuste portal.pago_anticipado). Con él, un pedido del portal validado y sin
     cobrar sale al centro «Pendiente de pago», con su factura proforma (datos de la empresa e IBAN, líneas, IVA; diseño del PDF de
     la empresa). Al marcarlo cobrado se prepara como siempre. El centro recibe un aviso al validar, cobrar, preparar o anular.
   ============================================================ */
NOMBRE_ESTADO_CENTRO['Pendiente de pago'] = 'p-warn';
window.PC_ANT = false;

document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-pcpro]'); if (b) pcProforma(b.dataset.pcpro, b); });

// Configuración → Portal: pago por adelantado de los pedidos del centro
pintarCfgPortal = (orig => async function (...a) {
  const r = await orig.apply(this, a);
  const c = $('cfgcuerpo'); if (!c || $('cfpant')) return r;
  const { data: aj } = await db.from('ajustes').select('valor').eq('clave', 'portal').maybeSingle();
  if (!$('cfgcuerpo') || $('cfpant')) return r;
  const on = !!(aj && aj.valor && aj.valor.pago_anticipado);
  c.insertAdjacentHTML('beforeend', `<div class="card" id="cfpantc"><div class="fh"><div><h2>Pedidos del portal del centro ${typeof pmAyu === 'function' ? pmAyu('Pago por adelantado', 'Con el pago por adelantado, al confirmar un pedido del portal el centro lo ve «Pendiente de pago» y descarga la factura proforma con vuestros datos y el IBAN para hacer la transferencia. Cuando la recibáis, marcad el pago como cobrado en el pedido: el centro recibe el aviso y el pedido se prepara como siempre. El IBAN y los datos salen de Facturación → Datos fiscales.') : ''}</h2></div></div>
    <label class="opt"><input type="checkbox" id="cfpant" ${on ? 'checked' : ''}> Pago por adelantado (transferencia antes de preparar el pedido)</label>
    <div class="acts" style="justify-content:flex-end"><button class="btn" id="cfpantok" type="button">Guardar</button></div></div>`);
  $('cfpantok').onclick = async ev => {
    ev.target.disabled = true;
    const { data: a2 } = await db.from('ajustes').select('valor').eq('clave', 'portal').maybeSingle();
    const { data: x, error } = await db.rpc('guardar_ajuste', { p_clave: 'portal', p_valor: Object.assign({}, (a2 && a2.valor) || {}, { pago_anticipado: $('cfpant').checked }) });
    ev.target.disabled = false;
    if (error || (x && x.ok === false)) { toast('No se ha podido guardar', true); return; }
    toast($('cfpant').checked ? 'Guardado: los centros pagarán por adelantado' : 'Guardado: sin pago por adelantado');
  };
  return r;
})(pintarCfgPortal);





