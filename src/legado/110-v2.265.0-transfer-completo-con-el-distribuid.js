/* ============================================================
   v2.265.0 · Transfer completo con el distribuidor (grupo 4 del plan del 11/10/2026; necesita el SQL 142).
   - Ver pedido → bloque «Distribuidor»: en qué punto está el transfer (Enviado, Aceptado, Servido o Incidencia, con su nota) y
     «Descargar transfer», un PDF con el cliente, su código en el distribuidor y las líneas con referencia y código de barras.
   - Configuración → Datos → Distribuidores: cada distribuidor con sus transfers (cuántos sin enviar, en marcha, servidos y con
     incidencia); al pulsar uno se abre el pedido.
   ============================================================ */
const TRF_EST = [['Enviado', 'Enviado'], ['Aceptado', 'Aceptado'], ['Servido', 'Servido'], ['Incidencia', 'Incidencia']];
const trfPill = e => e ? `<span class="pill ${e === 'Servido' ? 'p-trfok' : e === 'Incidencia' ? 'p-urg' : 'p-per'}">${esc(e)}</span>` : '<span class="pill">Sin enviar</span>';
// En el bloque del distribuidor del pedido (se llama en el mismo momento en que se pinta el bloque)
function trfPoner(id, p, d, data) {
  const caja = $('pddist'); if (!caja || $('pdtrf') || !$('pdmailest')) return;
  caja.insertAdjacentHTML('beforeend', `<div class="pdtrf" id="pdtrf"><span class="sm">Estado del transfer</span>
      <div class="segs" role="group" aria-label="Estado del transfer">${TRF_EST.map(([k, t]) => `<button type="button" data-trf="${k}" class="${p.transfer_estado === k ? 'on' : ''}" aria-pressed="${p.transfer_estado === k}">${t}</button>`).join('')}</div>
      <button type="button" class="btn sec" id="pdtrfpdf">Descargar transfer</button>
      <p class="sm" id="pdtrfnota">${p.transfer_nota ? 'Nota: ' + esc(p.transfer_nota) : ''}</p></div>`);
  caja.querySelectorAll('[data-trf]').forEach(b => b.onclick = async () => {
    const e = b.dataset.trf; let nota = null;
    if (e === 'Incidencia') { nota = await pedirTexto('Qué ha pasado (falta de stock, dirección, código del cliente…)', p.transfer_nota || '', { titulo: 'Incidencia en el transfer', ok: 'Guardar' }); if (nota === null) return; }
    const { data: r, error } = await db.rpc('estado_transfer', { p_id: id, p_estado: e, p_nota: nota });
    if (error || !r || !r.ok) { toast(({ permiso: 'No tienes permiso para cambiarlo' })[(r && r.error) || ''] || ('No se ha podido cambiar' + (error ? ': ' + error.message : '')), true); return; }
    p.transfer_estado = e; if (nota !== null) p.transfer_nota = nota || null;
    caja.querySelectorAll('[data-trf]').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
    $('pdtrfnota').textContent = p.transfer_nota ? 'Nota: ' + p.transfer_nota : '';
    if (!p.transfer_enviado_en && $('pdmailest')) { p.transfer_enviado_en = new Date().toISOString(); $('pdmailest').textContent = 'Enviado el ' + fechaCorta(hoyISO()); }
    toast('Transfer: ' + e.toLowerCase());
  });
  $('pdtrfpdf').onclick = () => trfPDF(p, d, data).catch(e => toast('No se ha podido preparar el PDF: ' + (e.message || e), true));
  // Preparar el correo deja el transfer «Enviado» si no tenía estado
  if ($('pdmaild')) $('pdmaild').addEventListener('click', () => {
    if (p.transfer_estado) return; p.transfer_estado = 'Enviado';
    const b = caja.querySelector('[data-trf="Enviado"]'); if (b) { b.classList.add('on'); b.setAttribute('aria-pressed', 'true'); }
  });
}
async function trfPDF(p, d, data) {
  const J = await cargarJsPDF(), doc = new J({ unit: 'mm', format: 'a4' });
  const l = (data && data.lineas) || [], cli = (data && data.contacto) || {};
  const ids = [...new Set(l.map(x => x.producto_id).filter(Boolean))];
  const { data: pr } = ids.length ? await db.from('productos').select('id,referencia,codigo_barras').in('id', ids) : { data: [] };
  const pm = new Map((pr || []).map(x => [x.id, x]));
  let y = 18; const t = (s, x, yy, o) => doc.text(String(s || ''), x, yy, o);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(16); t(`Transfer · Pedido ${p.numero || ''}`, 15, y); y += 7;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); t(`${nombreApp()} · ${fechaCorta(String(p.fecha || hoyISO()).slice(0, 10))}`, 15, y); y += 10;
  doc.setFont('helvetica', 'bold'); t('Distribuidor', 15, y); t('Cliente', 110, y); y += 5; doc.setFont('helvetica', 'normal');
  const izq = [d.nombre, d.email, d.telefono].filter(Boolean);
  const der = [cli.nombre || p.cuenta_texto, p.distribuidor_codigo ? 'Código en el distribuidor: ' + p.distribuidor_codigo : '', [cli.direccion, cli.cp, cli.municipio].filter(Boolean).join(', '), cli.nif ? 'NIF: ' + cli.nif : ''].filter(Boolean);
  for (let i = 0; i < Math.max(izq.length, der.length); i++) { if (izq[i]) t(izq[i], 15, y); if (der[i]) doc.text(doc.splitTextToSize(der[i], 85), 110, y); y += 5; }
  y += 6; doc.setFont('helvetica', 'bold'); t('Producto', 15, y); t('Referencia', 105, y); t('Código de barras', 140, y); t('Uds.', 195, y, { align: 'right' });
  doc.setDrawColor(200); doc.line(15, y + 2, 195, y + 2); y += 8; doc.setFont('helvetica', 'normal');
  l.forEach(x => {
    if (y > 270) { doc.addPage(); y = 20; }
    const m = pm.get(x.producto_id) || {};
    doc.text(doc.splitTextToSize(String(x.producto || ''), 86), 15, y); t(m.referencia || '—', 105, y); t(m.codigo_barras || '—', 140, y); t(num(x.unidades), 195, y, { align: 'right' });
    y += 7;
  });
  doc.line(15, y - 3, 195, y - 3); y += 4;
  doc.setFont('helvetica', 'bold'); t(`Total: ${num(l.reduce((n, x) => n + (+x.unidades || 0), 0))} unidades`, 195, y, { align: 'right' }); y += 8;
  doc.setFont('helvetica', 'normal'); t(p.factura_distribuidor ? 'Lo factura el distribuidor.' : `Lo factura ${nombreApp()}.`, 15, y); y += 6;
  if (p.nota) doc.text(doc.splitTextToSize('Nota: ' + p.nota, 180), 15, y);
  doc.save(`transfer_${String(p.numero || p.id).replace(/[^\w-]+/g, '_')}.pdf`);
}
// Distribuidores: los transfers de cada uno
pintarDistribuidores = (orig => async function (...a) {
  const r = await orig.apply(this, a);
  const c = $('cfgcuerpo'); if (!c || CFG_KEY !== 'distribuidores') return r;
  c.querySelectorAll('.disfila[data-disid] .ajctl').forEach(x => {
    if (x.querySelector('[data-distrf]')) return;
    x.insertAdjacentHTML('afterbegin', `<button type="button" class="btn sec" data-distrf="${x.closest('.disfila').dataset.disid}">Transfers</button>`);
  });
  c.querySelectorAll('[data-distrf]').forEach(b => b.onclick = () => verTransfers(b.dataset.distrf));
  return r;
})(pintarDistribuidores);
async function verTransfers(dist) {
  const d = (DIS_TODOS || []).find(x => x.id === dist) || {};
  $('dlg2body').innerHTML = `<div class="fh"><div><h2>Transfers · ${esc(d.nombre || '')}</h2><div class="sm">Pedidos que sirve este distribuidor (los 200 últimos)</div></div>
      <button class="x" data-cerrar2 aria-label="Cerrar">✕</button></div><div id="trfcuerpo"></div>`;
  cargando($('trfcuerpo'), 'Cargando los transfers…');
  $('dlg2').showModal();
  const { data, error } = await db.rpc('transfers_distribuidor', { p_dist: dist });
  const caja = $('trfcuerpo'); if (!caja) return;
  if (error) { caja.innerHTML = `<p class="vacio">No se han podido leer: ${esc(error.message)}</p>`; return; }
  const s = (data && data.resumen) || {}, l = (data && data.pedidos) || [];
  caja.innerHTML = `<div class="trfres">${[['Sin enviar', s.sin_enviar], ['Enviados', s.enviado], ['Aceptados', s.aceptado], ['Servidos', s.servido], ['Con incidencia', s.incidencia]]
      .map(([t, n]) => `<span class="${t === 'Con incidencia' && n ? 'warn' : ''}"><b>${num(n || 0)}</b> ${t}</span>`).join('')}</div>
    ${l.length ? `<div class="lista trflista">${l.map(x => `<button type="button" class="item" data-trfped="${x.id}">
        <span class="tx"><b>${esc(x.numero || 'Pedido')} · ${esc(x.cliente || '—')}</b><span class="sm">${fechaCorta(String(x.fecha).slice(0, 10))} · ${num(x.unidades)} uds · ${eurI(x.base)}${x.transfer_nota ? ' · ' + esc(x.transfer_nota) : ''}</span></span>
        ${trfPill(x.transfer_estado)}</button>`).join('')}</div>` : '<p class="vacio">Todavía no hay pedidos de este distribuidor.</p>'}`;
  caja.querySelectorAll('[data-trfped]').forEach(b => b.onclick = () => { $('dlg2').close(); verPedido(b.dataset.trfped); });
}




