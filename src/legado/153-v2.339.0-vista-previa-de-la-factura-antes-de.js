/* ============================================================
   v2.339.0 · Vista previa de la factura antes de emitirla (Eric, 20/10/2026). En el pedido, «Ver la factura» enseña el PDF tal como
   saldrá (mismas cuentas que emitir_factura: precio = importe / unidades, base con el descuento general repartido, envío como línea,
   desglose por tipo de IVA) con «VISTA PREVIA» y sin número; desde ahí, «Emitir factura». No guarda nada.
   ============================================================ */
function facturaDePedido(d) {
  const p = d.pedido, t = d.totales || {}, c = d.contacto || {};
  const emp = Object.fromEntries(Object.entries((AJUSTES || {}).empresa || {}).filter(([, v]) => v));
  if (emp.poblacion && !emp.municipio) emp.municipio = emp.poblacion;
  const bruto = +t.bruto || 0, k = bruto ? (+t.base_productos || 0) / bruto : 1, r2 = v => Math.round(v * 100) / 100;
  const lineas = (d.lineas || []).map(x => ({ descripcion: x.producto || 'Sin producto', unidades: +x.unidades || 0,
    precio: (+x.unidades ? (+x.importe || 0) / +x.unidades : 0), descuento: +x.descuento || 0, iva: +x.iva || 0,
    base: r2((+x.importe || 0) * (1 - (+x.descuento || 0) / 100) * k) }));
  if (p.envio) lineas.push({ descripcion: ((SERVICIOS || []).find(x => x.id === p.servicio_id) || {}).nombre || 'Envío', unidades: 1,
    precio: +p.envio_base || 0, descuento: 0, iva: +p.envio_iva || 0, base: r2(+p.envio_base || 0), servicio: true });
  const g = {}; lineas.forEach(l => { g[l.iva] = (g[l.iva] || 0) + l.base; });
  const desglose_iva = Object.keys(g).map(Number).sort((a, b) => a - b).map(iva => ({ iva, base: r2(g[iva]), cuota: r2(g[iva] * iva / 100) }));
  const base = r2(desglose_iva.reduce((a, x) => a + x.base, 0)), total = r2(desglose_iva.reduce((a, x) => a + x.base + x.cuota, 0));
  return { numero: 'Sin número hasta emitirla', fecha: hoyISO(), vencimiento: hoyISO(), emisor: emp, forma_pago: p.forma_pago || '',
    cliente: c.id ? { nombre: c.nombre, nif: c.nif, direccion: c.direccion, cp: c.cp, municipio: c.municipio, provincia: c.provincia, email: c.email } : {},
    lineas, base, desglose_iva, total, verifactu: {} };
}
async function previaFacturaPedido(id) {
  // v2.352.0: en su ventana grande, encima del pedido (que sigue abierto tal cual); se abre al momento con el cargador
  const d2 = $('dlg2');
  $('dlg2body').innerHTML = '<div class="fh"><div><h2>Vista previa de la factura</h2></div><button class="x" data-cerrar2 aria-label="Cerrar">✕</button></div><div class="facprev facpcarga"><div class="spin"></div></div>';
  d2.classList.add('amplia'); d2.addEventListener('close', () => d2.classList.remove('amplia'), { once: true });
  if (!d2.open) d2.showModal();
  await cargarAjustes();
  const { data: d } = await RPC_ORIG('pedido_detalle', { p_id: id });
  if (!d2.open) return;
  if (!d || !d.pedido) { d2.close(); toast('No se ha podido leer el pedido', true); return; }
  const c = d.contacto, falta = !c ? `El pedido no tiene ${TT('paciente', 's', '', 'l', 'l')}: la factura saldrá sin destinatario.` : !c.nif ? `${esc(c.nombre)} no tiene DNI o CIF en su ficha: conviene añadirlo antes.` : '';
  $('dlg2body').innerHTML = `<div class="fh"><div><h2>Vista previa de la factura</h2></div><button class="x" data-cerrar2 aria-label="Cerrar">✕</button></div>
    ${falta ? `<div class="banda-aviso facpaviso">${falta}</div>` : ''}
    <div class="facprev"><iframe id="facpif" title="Vista previa de la factura"></iframe></div>
    <p class="sm">Al emitirla se le da el número siguiente de la serie y ya no se puede modificar ni borrar: un error se corrige con una rectificativa.</p>
    <div class="acts"><button type="button" class="btn sec" data-cerrar2>Cancelar</button><button type="button" class="btn" id="facpemitir">Emitir factura</button></div>`;
  try {
    const C = Object.assign({}, cfgPDF()); C.titulo = (C.titulo || 'FACTURA') + ' · VISTA PREVIA';
    const doc = await facturaPDF(facturaDePedido(d), '', C);
    if ($('facpif')) $('facpif').src = doc.output('bloburl') + '#toolbar=0&navpanes=0&view=FitH';
  } catch (e) { toast('No se ha podido preparar la vista previa', true); registrarError('app', 'Vista previa de la factura', { e: String(e) }); }
  $('facpemitir').onclick = () => conCarga($('facpemitir'), 'Emitiendo…', async () => {
    const r = await emitirFacturaPedido(id, { yaVista: true });
    if (r) { d2.close(); verFactura(r.id); }
  });
}


/* v2.339.0 · «Reparto por producto» en barras (Eric: el anillo dejaba media tarjeta vacía): total arriba y, por producto, barra con
   unidades y porcentaje, hasta 10 (los demás juntos en «Otros»), con el mismo ritmo que la tarjeta de al lado. */
function barrasReparto(items) {
  const l = [...items].sort((a, b) => b.v - a.v), tot = l.reduce((n, x) => n + x.v, 0) || 1;
  const vis = l.length > 10 ? [...l.slice(0, 9), { n: 'Otros (' + (l.length - 9) + ')', v: l.slice(9).reduce((n, x) => n + x.v, 0) }] : l;
  const pc = v => { const p = v / tot * 100; return (p > 0 && p < 1 ? '<1' : Math.round(p)) + ' %'; };
  return `<div class="reptot"><b>${num(tot)}</b> unidades · ${num(l.length)} ${l.length === 1 ? 'producto' : 'productos'}</div>
    <div class="barrash reparto">${vis.map(x => `<div class="bh"><span class="bhn" title="${esc(x.n)}">${esc(x.n)}</span>
      <svg class="bhsvg" viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden="true"><rect class="f" width="100" height="12" rx="6"/><rect class="v" width="${Math.max(2, x.v / tot * 100).toFixed(1)}" height="12" rx="6"/></svg><b>${num(x.v)}</b><span class="sm bhp">${pc(x.v)}</span></div>`).join('')}</div>`;
}


