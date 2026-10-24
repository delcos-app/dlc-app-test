/* ============================================================
   DLC OS 2.0 · v2.31.0 · Facturación: facturas desde pedidos,
   series y numeración, rectificativas, cobros, PDF y VeriFactu preparado
   ============================================================ */

Object.assign(RPC_TTL, { facturas_lista: 20, series_lista: 60, eventos_facturacion_lista: 20 });
let FSEC = 'facturas';
const puedeFacturar = () => PERFIL && (puede('administrar') || (VE_TODO() && ((PERFIL.areas || {}).V || 0) >= 2));
const pillCobro = e => `<span class="pill ${e === 'Cobrada' ? 'p-est' : e === 'Vencida' ? 'p-anu' : 'p-bor'}">${esc(e)}</span>`;

/* ---------------- navegación ---------------- */


/* ---------------- módulo ---------------- */

async function cargarFacturacion() {
  const admin = puede('administrar');
  const secs = [['facturas', 'Facturas'], ['series', 'Series y numeración']].concat(admin ? [['empresa', 'Datos fiscales'], ['verifactu', 'VeriFactu'], ['registro', 'Registro']] : []);
  if (!secs.some(s => s[0] === FSEC)) FSEC = 'facturas';
  $('v-facturacion').innerHTML = `
    <div class="saludo"><div><h1>Facturación</h1><div class="fecha">Facturas emitidas desde los pedidos, rectificativas y cobros</div></div>
      <div class="acts" style="margin:0"></div></div>
    <div class="subnav">${secs.map(([k, t]) => `<button data-fsec="${k}" aria-pressed="${FSEC === k}">${t}</button>`).join('')}</div>
    <div id="fcuerpo"></div>`;
  $('v-facturacion').querySelectorAll('[data-fsec]').forEach(b => b.onclick = () => { FSEC = b.dataset.fsec; cargarFacturacion(); });
  if (FSEC === 'facturas') pintarFacturas();
  if (FSEC === 'series') pintarSeries();
  if (FSEC === 'empresa') pintarEmpresa();
  if (FSEC === 'verifactu') pintarVerifactu();
  if (FSEC === 'registro') pintarRegistro();
}

async function pintarFacturas() {
  $('fcuerpo').innerHTML = `<div class="panel">
    <div class="filtros">
      <div id="fper"></div>
      <div><label for="fq">Buscar</label><input id="fq" type="search" placeholder="Número, cliente o NIF"></div>
      <div><label for="fcob">Cobro</label><select id="fcob"><option value="">Todos</option><option>Pendiente</option><option>Vencida</option><option>Cobrada</option></select></div>
    </div>
    <div class="kpis vtot" id="ftot"></div>
    <div id="flista"></div></div>`;
  let tq;
  const pinta = async () => {
    cargando($('flista'), 'Cargando facturas…');
    const r = $('fper').__rango();
    const { data, error } = await db.rpc('facturas_lista', { p_desde: r.desde, p_hasta: r.hasta, q: $('fq').value.trim() || null, p_cobro: $('fcob').value || null });
    if (!$('flista')) return;
    if (error) { $('flista').innerHTML = `<div class="vacio">${esc(error.message)}</div>`; return; }
    const l = data || [];
    const sum = (arr, k) => arr.reduce((n, x) => n + (+x[k] || 0), 0);
    const pend = l.filter(x => x.estado_cobro !== 'Cobrada'), venc = l.filter(x => x.estado_cobro === 'Vencida');
    $('ftot').innerHTML = `
      <div class="kpi"><b>${eurI(sum(l, 'total'))}</b><span>Facturado con IVA · ${num(l.length)} facturas</span></div>
      <div class="kpi"><b>${eurI(sum(l, 'base'))}</b><span>Base imponible</span></div>
      <div class="kpi"><b>${eurI(sum(l, 'cuota_iva'))}</b><span>IVA repercutido</span></div>
      <div class="kpi"><b>${eurI(sum(pend, 'total') - sum(pend, 'cobrado'))}</b><span>Pendiente de cobro · ${num(pend.length)}</span></div>
      <div class="kpi ${venc.length ? 'warn' : ''}"><b>${eurI(sum(venc, 'total') - sum(venc, 'cobrado'))}</b><span>Vencido · ${num(venc.length)}</span></div>`;
    const tamF = tamPagina(); FACPAG = Math.min(FACPAG, Math.max(0, Math.ceil(l.length / tamF) - 1));
    const lp = l.slice(FACPAG * tamF, FACPAG * tamF + tamF);
    $('flista').innerHTML = l.length ? `<div class="dgrid-wrap"><div class="dgrid facts">
      <div class="dh"><span>Número</span><span>Fecha</span><span>Cliente</span><span>NIF</span><span class="num">Base</span><span class="num">IVA</span><span class="num">Total</span><span>Vencimiento</span><span>Cobro</span></div>
      ${lp.map(f => `<button class="dr" data-fac="${f.id}">
        <span><b>${esc(f.numero)}</b>${f.rectifica ? `<span class="sm">rectifica ${esc(f.rectifica)}</span>` : f.rectificada_por ? `<span class="sm">rectificada: ${esc(f.rectificada_por)}</span>` : ''}</span>
        <span>${fechaCorta(f.fecha)}</span><span class="corta">${esc(f.cliente || '—')}</span><span class="sm">${esc(f.nif || '—')}</span>
        <span class="num">${eurI(f.base)}</span><span class="num">${eurI(f.cuota_iva)}</span><span class="num"><b>${eurI(f.total)}</b></span>
        <span class="${f.estado_cobro === 'Vencida' ? 'cad-pasada' : ''}">${f.vencimiento ? fechaCorta(f.vencimiento) : '—'}</span>
        <span>${pillCobro(f.estado_cobro)}</span></button>`).join('')}</div></div>`
      : '<div class="vacio">No hay facturas con estos filtros. Las facturas se emiten desde un pedido confirmado (Pedidos → Ventas → abrir el pedido → «Emitir factura»).</div>';
    $('flista').querySelectorAll('[data-fac]').forEach(b => b.onclick = () => verFactura(b.dataset.fac));
    $('flista').insertAdjacentHTML('beforeend', '<div id="fpag"></div>');
    paginador($('fpag'), l.length, FACPAG, p => { FACPAG = p; pinta(); }, () => { FACPAG = 0; pinta(); });
  };
  montarPeriodo($('fper'), { id: 'facturas', valor: 'mes', alCambiar: pinta });
  $('fq').oninput = () => { clearTimeout(tq); tq = setTimeout(() => { FACPAG = 0; pinta(); }, 300); };
  $('fcob').onchange = () => { FACPAG = 0; pinta(); };
  pinta();
}

/* Ver factura: la ventana base y los botones de PDF y email (antes eran 3 capas). */
async function verFactura(id) {
  return ventanaCargando(async () => {
    await verFacturaBase(id);
    await facturaBotonesPdfYEmail(id);
  });
}

// Ver factura · Ver, descargar el PDF y enviarlo por email
async function facturaBotonesPdfYEmail(id) {
  const acts = $('dbody').querySelector('.acts:last-of-type');
  if (!acts || !$('fvpdf')) return;
  const { data } = await RPC_ORIG('factura_detalle', { p_id: id });
  const f = data && data.factura; if (!f) return;
  const rn = data.rectifica && data.rectifica.numero;
  $('fvpdf').textContent = 'Ver';
  $('fvpdf').classList.add('sec');
  $('fvpdf').insertAdjacentHTML('afterend', `<button class="btn sec" id="fvdl">⬇ PDF</button>${puedeFacturar() ? '<button class="btn" id="fvmail">✉️ Enviar por email</button>' : ''}`);
  $('fvdl').onclick = () => descargarFacturaPDF(f, rn);
  if ($('fvmail')) $('fvmail').onclick = () => enviarFacturaEmail(f, rn);
  // «Ver» abre el mismo PDF que se envía
  $('fvpdf').onclick = async () => { const doc = await facturaPDF(f, rn); window.open(doc.output('bloburl'), '_blank'); };
}

/* Parte base; verFactura le añade el resto */
async function verFacturaBase(id) {
  const { data } = await RPC_ORIG('factura_detalle', { p_id: id });
  if (!data || !data.factura) { toast('No se ha podido abrir la factura', true); return; }
  const f = data.factura, cob = data.cobros || [], vf = data.verifactu || {};
  const pendiente = +(f.total - f.cobrado).toFixed(2);
  const estado = f.total === 0 || Math.abs(f.cobrado) >= Math.abs(f.total) ? 'Cobrada' : (f.vencimiento < hoyISO() ? 'Vencida' : 'Pendiente');
  $('dbody').innerHTML = `
    <div class="fh"><div><h2>${f.rectifica_id ? 'Rectificativa' : 'Factura'} ${esc(f.numero)} ${pillCobro(estado)}</h2>
      <div class="sm">${fechaLarga(new Date(f.fecha + 'T00:00:00'))}${f.vencimiento ? ' · vence el ' + fechaCorta(f.vencimiento) : ''}${f.forma_pago ? ' · ' + esc(f.forma_pago) : ''}</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    ${data.rectifica ? `<div class="avisoh"><span>Rectifica la factura <b>${esc(data.rectifica.numero)}</b> · Motivo: ${esc(f.motivo_rectificacion || '')}</span><button class="btn sec" data-vfac="${data.rectifica.id}">Ver original</button></div>` : ''}
    ${(data.rectificativas || []).length ? `<div class="avisoh"><span>Rectificada por ${data.rectificativas.map(r => `<b>${esc(r.numero)}</b> (${eurI(r.total)} · ${esc(r.motivo || '')})`).join(', ')}</span></div>` : ''}
    <div class="g2">
      <div class="blk"><h3>Cliente</h3><b>${esc(f.cliente.nombre || '')}</b><div class="sm">${esc(f.cliente.nif || 'Sin NIF')}</div>
        <div class="sm">${esc([f.cliente.direccion, f.cliente.cp, f.cliente.municipio, f.cliente.provincia].filter(Boolean).join(', '))}</div></div>
      <div class="blk"><h3>Emisor</h3><b>${esc(f.emisor.razon_social || '')}</b><div class="sm">${esc(f.emisor.nif || '')}</div>
        <div class="sm">${esc([f.emisor.direccion, f.emisor.cp, f.emisor.municipio].filter(Boolean).join(', '))}</div></div></div>
    <div class="dgrid-wrap"><div class="dgrid flin">
      <div class="dh"><span>Concepto</span><span class="num">Uds.</span><span class="num">Precio</span><span class="num">Dto.</span><span class="num">IVA</span><span class="num">Base</span></div>
      ${f.lineas.map(l => `<div class="dr" style="cursor:default"><span>${esc(l.descripcion)}</span><span class="num">${num(l.unidades)}</span>
        <span class="num">${eurI(l.precio)}</span><span class="num">${l.descuento ? num(l.descuento) + '%' : '—'}</span><span class="num">${num(l.iva)}%</span><span class="num"><b>${eurI(l.base)}</b></span></div>`).join('')}</div></div>
    <div class="totbox">${f.desglose_iva.map(d => `<div><span>Base al ${num(d.iva)}%</span><b>${eurI(d.base)}</b></div><div><span>IVA ${num(d.iva)}%</span><b>${eurI(d.cuota)}</b></div>`).join('')}
      <div class="tot"><span>Total</span><b>${eurI(f.total)}</b></div></div>
    <div class="blk"><h3>Cobros</h3>
      ${cob.length ? cob.map(c => `<div class="sm" style="display:flex;justify-content:space-between;gap:8px;padding:4px 0">
        <span>${fechaCorta(c.fecha)} · ${esc(c.forma_pago || '')}${c.nota ? ' · ' + esc(c.nota) : ''}</span><b>${eurI(c.importe)}</b>
        ${puede('administrar') ? `<button class="kcfg" data-bcob="${c.id}">Quitar</button>` : ''}</div>`).join('') : '<div class="sm">Sin cobros registrados.</div>'}
      ${pendiente ? `<div class="sm" style="margin-top:4px">Pendiente: <b>${eurI(pendiente)}</b></div>` : ''}</div>
    ${f.huella ? `<div class="blk"><h3>Registro de facturación</h3><div class="sm mono">Huella: ${esc(f.huella.slice(0, 32))}…</div>
      <div class="sm">VeriFactu: ${esc((f.verifactu || {}).estado || 'No aplica')}</div></div>` : ''}
    <div class="acts" style="justify-content:flex-end;flex-wrap:wrap">
      <button class="btn sec" data-cerrar>Cerrar</button>
      ${f.pedido_id ? '<button class="btn sec" id="fvped">Ver pedido</button>' : ''}
      ${puedeFacturar() && !f.rectifica_id ? '<button class="btn sec dang" id="fvrect">Rectificar</button>' : ''}
      ${puedeFacturar() && pendiente ? '<button class="btn sec" id="fvcob">Registrar cobro</button>' : ''}
      <button class="btn" id="fvpdf">Ver e imprimir</button></div>`;
  $('dlg').showModal();
  $('dbody').querySelectorAll('[data-vfac]').forEach(b => b.onclick = () => verFactura(b.dataset.vfac));
  $('dbody').querySelectorAll('[data-bcob]').forEach(b => b.onclick = async () => {
    if (!await preguntar('Se quita este cobro de la factura.', { titulo: '¿Quitar el cobro?', ok: 'Quitar', peligro: true })) return;
    await db.rpc('borrar_cobro', { p_id: b.dataset.bcob }); verFactura(id); refrescarFacturas();
  });
  if ($('fvped')) $('fvped').onclick = () => verPedido(f.pedido_id);
  if ($('fvpdf')) $('fvpdf').onclick = () => imprimirFactura(f, vf, data.rectifica && data.rectifica.numero);
  if ($('fvcob')) $('fvcob').onclick = () => cobroFactura(f, pendiente);
  if ($('fvrect')) $('fvrect').onclick = () => rectificarFactura(f);
}
const refrescarFacturas = () => { if (TAB === 'facturacion' && FSEC === 'facturas' && $('flista')) pintarFacturas(); };

function cobroFactura(f, pendiente) {
  $('dlg2body').innerHTML = `
    <div class="fh"><div><h2>Registrar cobro · ${esc(f.numero)}</h2><div class="sm">Pendiente: ${eurI(pendiente)}</div></div>
      <button class="x" data-cerrar2 aria-label="Cerrar">✕</button></div>
    <div class="g2"><div><label for="cbi">Importe (€)</label><input id="cbi" type="number" step="0.01" value="${pendiente}"></div>
      <div><label for="cbf">Fecha</label><input id="cbf" type="date" value="${hoyISO()}"></div></div>
    <div class="g2"><div><label for="cbp">Forma de pago</label><select id="cbp">${(CAT.forma_pago || []).map(x => `<option ${x.valor === f.forma_pago ? 'selected' : ''}>${esc(x.valor)}</option>`).join('')}</select></div>
      <div><label for="cbn">Nota</label><input id="cbn" placeholder="Opcional"></div></div>
    <div class="acts" style="justify-content:flex-end"><button class="btn sec" data-cerrar2>Cancelar</button><button class="btn" id="cbok">Registrar</button></div>`;
  $('dlg2').showModal();
  $('cbok').onclick = async () => {
    const imp = +$('cbi').value; if (!imp) { toast('Indica el importe', true); return; }
    const { data: r, error } = await db.rpc('registrar_cobro', { p_factura: f.id, p_importe: imp, p_fecha: $('cbf').value, p_forma: $('cbp').value, p_nota: $('cbn').value.trim() || null });
    if (error || (r && r.ok === false)) { toast('No se ha podido registrar', true); return; }
    $('dlg2').close(); toast('Cobro registrado'); verFactura(f.id); refrescarFacturas();
  };
}

function rectificarFactura(f) {
  $('dlg2body').innerHTML = `
    <div class="fh"><div><h2>Rectificar ${esc(f.numero)}</h2><div class="sm">Se emite una factura rectificativa en negativo. La original no se toca.</div></div>
      <button class="x" data-cerrar2 aria-label="Cerrar">✕</button></div>
    <label for="rfm">Motivo</label><input id="rfm" placeholder="p. ej. Devolución de una caja rota, error en el precio…">
    <label>Qué se rectifica</label>
    <div class="opciones" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr)"><label class="opt"><input type="radio" name="rft" value="total" checked> Toda la factura</label>
      <label class="opt"><input type="radio" name="rft" value="parcial"> Solo algunas unidades</label></div>
    <div id="rflin" class="hide">${f.lineas.map((l, i) => `<div class="g2" style="align-items:center"><div>${esc(l.descripcion)} <span class="sm">(${num(l.unidades)} uds)</span></div>
      <div><input type="number" min="0" max="${l.unidades}" data-rfi="${i}" value="0" aria-label="Unidades a rectificar"></div></div>`).join('')}</div>
    ${f.pedido_id ? '<label class="opt" style="margin-top:10px"><input type="checkbox" id="rfan"> Anular también el pedido (las unidades vuelven al stock y dejan de contar en métricas)</label>' : ''}
    <div class="acts" style="justify-content:flex-end"><button class="btn sec" data-cerrar2>Cancelar</button><button class="btn dang" id="rfok">Emitir rectificativa</button></div>`;
  $('dlg2').showModal();
  $('dlg2body').querySelectorAll('[name=rft]').forEach(r => r.onchange = () => {
    const parcial = $('dlg2body').querySelector('[name=rft]:checked').value === 'parcial';
    $('rflin').classList.toggle('hide', !parcial); if ($('rfan')) { $('rfan').disabled = parcial; if (parcial) $('rfan').checked = false; }
  });
  $('rfok').onclick = async ev => {
    const motivo = $('rfm').value.trim(); if (!motivo) { toast('Escribe el motivo', true); return; }
    const parcial = $('dlg2body').querySelector('[name=rft]:checked').value === 'parcial';
    const lineas = parcial ? [...$('dlg2body').querySelectorAll('[data-rfi]')].map(i => ({ indice: +i.dataset.rfi, unidades: +i.value || 0 })).filter(x => x.unidades > 0) : null;
    if (parcial && !lineas.length) { toast('Indica las unidades a rectificar', true); return; }
    ev.target.disabled = true;
    const { data: r, error } = await db.rpc('rectificar_factura', { p_factura: f.id, p_motivo: motivo, p_lineas: lineas });
    if (error || (r && r.ok === false)) { ev.target.disabled = false; toast('No se ha podido: ' + ((error && error.message) || r.error), true); return; }
    if ($('rfan') && $('rfan').checked) await db.rpc('anular_pedido', { p_id: f.pedido_id, p_motivo: 'Rectificativa ' + r.numero + ': ' + motivo });
    $('dlg2').close(); toast('Rectificativa ' + r.numero + ' emitida'); verFactura(r.id); refrescarFacturas();
  };
}

/* ---------------- ver e imprimir (PDF desde el navegador) ---------------- */

function imprimirFactura(f, vf, rectificaNum) {
  const e = f.emisor || {}, c = f.cliente || {};
  const conQR = (f.verifactu || {}).activo;
  const eur = v => (Math.round(v * 100) / 100).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  const w = window.open('', '_blank');
  if (!w) { toast('Permite las ventanas emergentes para ver la factura', true); return; }
  w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(f.numero)}</title>
    <style>
      body{font:13px/1.45 -apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1c2733;margin:0;padding:36px 42px}
      h1{font-size:22px;margin:0;color:#0E2F52} .top{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}
      .marca{font-size:20px;font-weight:800;color:#0E2F52;letter-spacing:.02em} .sm{color:#5b6b7b;font-size:12px}
      .cajas{display:flex;gap:18px;margin:22px 0} .caja{flex:1;border:1px solid #dbe3ea;border-radius:10px;padding:12px 14px}
      .caja h3{margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#5b6b7b}
      table{width:100%;border-collapse:collapse;margin-top:6px} th{font-size:11px;text-transform:uppercase;color:#5b6b7b;text-align:left;border-bottom:2px solid #0E2F52;padding:7px 6px}
      td{border-bottom:1px solid #e6ecf1;padding:8px 6px} .n{text-align:right;white-space:nowrap}
      .tot{margin-left:auto;width:300px;margin-top:14px} .tot div{display:flex;justify-content:space-between;padding:4px 0}
      .tot .g{border-top:2px solid #0E2F52;margin-top:4px;padding-top:8px;font-size:16px;font-weight:800;color:#0E2F52}
      .pie{margin-top:28px;font-size:11.5px;color:#5b6b7b;border-top:1px solid #e6ecf1;padding-top:12px}
      .qr{display:flex;gap:12px;align-items:center;margin-top:18px} .qr div{font-size:11px;color:#5b6b7b}
      .rect{background:#fff4e5;border:1px solid #f0c48a;border-radius:8px;padding:8px 12px;margin-top:14px}
      @media print{body{padding:18px 22px}.noimp{display:none}}
    </style></head><body>
    <div class="noimp" style="text-align:right;margin-bottom:12px"><button onclick="print()" style="padding:9px 16px;border-radius:8px;border:0;background:#0E2F52;color:#fff;font-weight:700;cursor:pointer">Imprimir o guardar en PDF</button></div>
    <div class="top"><div><div class="marca">${esc(e.razon_social || nombreApp())}</div>
      <div class="sm">${esc(e.nif || '')}<br>${esc([e.direccion, e.cp, e.municipio, e.provincia].filter(Boolean).join(', '))}<br>${esc([e.telefono, e.email].filter(Boolean).join(' · '))}</div></div>
      <div style="text-align:right"><h1>${f.rectifica_id ? 'Factura rectificativa' : 'Factura'}</h1><div style="font-size:16px;font-weight:700">${esc(f.numero)}</div>
        <div class="sm">Fecha: ${esc(f.fecha.split('-').reverse().join('/'))}${f.vencimiento && !f.rectifica_id ? '<br>Vencimiento: ' + esc(f.vencimiento.split('-').reverse().join('/')) : ''}</div></div></div>
    ${f.rectifica_id ? `<div class="rect">Rectifica la factura <b>${esc(rectificaNum || '')}</b> · Motivo: ${esc(f.motivo_rectificacion || '')}</div>` : ''}
    <div class="cajas"><div class="caja"><h3>Cliente</h3><b>${esc(c.nombre || '')}</b><br>${esc(c.nif || '')}<br>${esc([c.direccion, c.cp, c.municipio, c.provincia, c.pais].filter(Boolean).join(', '))}</div>
      <div class="caja"><h3>Pago</h3>${esc(f.forma_pago || '—')}${e.iban ? '<br>IBAN: ' + esc(e.iban) : ''}</div></div>
    <table><thead><tr><th>Concepto</th><th class="n">Uds.</th><th class="n">Precio</th><th class="n">Dto.</th><th class="n">IVA</th><th class="n">Importe</th></tr></thead>
      <tbody>${f.lineas.map(l => `<tr><td>${esc(l.descripcion)}</td><td class="n">${l.unidades}</td><td class="n">${eur(l.precio)}</td>
        <td class="n">${l.descuento ? l.descuento + '%' : ''}</td><td class="n">${l.iva}%</td><td class="n">${eur(l.base)}</td></tr>`).join('')}</tbody></table>
    <div class="tot">${f.desglose_iva.map(d => `<div><span>Base imponible ${d.iva}%</span><span>${eur(d.base)}</span></div><div><span>IVA ${d.iva}%</span><span>${eur(d.cuota)}</span></div>`).join('')}
      <div class="g"><span>Total</span><span>${eur(f.total)}</span></div></div>
    ${conQR ? `<div class="qr"><span id="qr"></span><div><b>VERI*FACTU</b><br>Factura verificable en la sede electrónica de la AEAT</div></div>` : ''}
    <div class="pie">${esc(e.pie || '')}${e.registro ? '<br>' + esc(e.registro) : ''}</div>
    ${conQR ? `<script src="${new URL('qrcode.js', location.href).href}"><\/script>
      <script>try{var q=qrcode(0,'M');q.addData(${JSON.stringify(f.qr_url || '')});q.make();document.getElementById('qr').innerHTML=q.createSvgTag(3,0);}catch(e){}<\/script>` : ''}
    </body></html>`);
  w.document.close();
}

/* ---------------- series ---------------- */

async function pintarSeries() {
  cargando($('fcuerpo'), 'Cargando series…');
  const { data } = await RPC_ORIG('series_lista', {});
  const l = data || [], admin = puede('administrar');
  $('fcuerpo').innerHTML = `<div class="panel">
    <div class="cuenta">Cada serie numera sus facturas de forma correlativa. Para continuar la numeración de otro programa, pon en «Siguiente número» el que toca.
      ${admin ? '<button class="btn sec" id="sernueva" style="margin-left:8px">+ Nueva serie</button>' : ''}</div>
    <div class="dgrid-wrap"><div class="dgrid sers">
      <div class="dh"><span>Serie</span><span>Tipo</span><span>Formato</span><span>Próximo número</span><span>Última emitida</span><span class="num">Emitidas</span><span>Reinicio anual</span></div>
      ${l.map(s => `<button class="dr" data-ser="${s.id}"><span><b>${esc(s.codigo)}</b><span class="sm">${esc(s.nombre)}${s.por_defecto ? ' · por defecto' : ''}${s.activa ? '' : ' · inactiva'}</span></span>
        <span>${esc(s.tipo === 'ordinaria' ? 'Facturas' : s.tipo === 'rectificativa' ? 'Rectificativas' : 'Simplificadas')}</span><span class="mono">${esc(s.formato)}</span>
        <span><b>${esc(s.proximo)}</b></span><span>${esc(s.ultima || '—')}</span><span class="num">${num(s.emitidas)}</span><span>${s.reinicio_anual ? 'Sí' : 'No'}</span></button>`).join('')}
    </div></div>
    <p class="sm" style="padding:10px 16px">Formato: <b>{S}</b> código de la serie · <b>{AAAA}</b> o <b>{AA}</b> año · <b>{NNNN}</b> número con tantas cifras como «N». Ejemplo: {S}{AA}{NNNN} → F260408.</p></div>`;
  $('fcuerpo').querySelectorAll('[data-ser]').forEach(b => b.onclick = () => editorSerie(l.find(s => s.id === b.dataset.ser)));
  if ($('sernueva')) $('sernueva').onclick = () => editorSerie(null);
}

function editorSerie(s) {
  const admin = puede('administrar'), ro = admin ? '' : 'disabled';
  s = s || { codigo: '', nombre: '', tipo: 'ordinaria', formato: '{S}{AA}{NNNN}', siguiente: 1, anio: +hoyISO().slice(0, 4), reinicio_anual: true };
  $('dbody').innerHTML = `
    <div class="fh"><div><h2>${s.id ? 'Serie ' + esc(s.codigo) : 'Nueva serie'}</h2><div class="sm">Próximo número: <b id="serprev"></b></div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="g2"><div><label for="sec">Código</label><input id="sec" value="${esc(s.codigo)}" ${s.id ? 'disabled' : ro} placeholder="p. ej. F, CN, W"></div>
      <div><label for="sen">Nombre</label><input id="sen" value="${esc(s.nombre)}" ${ro}></div></div>
    <div class="g2"><div><label for="set">Tipo</label><select id="set" ${s.id ? 'disabled' : ro}>
        <option value="ordinaria" ${s.tipo === 'ordinaria' ? 'selected' : ''}>Facturas</option><option value="rectificativa" ${s.tipo === 'rectificativa' ? 'selected' : ''}>Rectificativas</option>
        <option value="simplificada" ${s.tipo === 'simplificada' ? 'selected' : ''}>Simplificadas (tickets)</option></select></div>
      <div><label for="sef">Formato</label><input id="sef" value="${esc(s.formato)}" ${ro}></div></div>
    <div class="g2"><div><label for="ses">Siguiente número</label><input id="ses" type="number" min="1" value="${s.siguiente}" ${ro}></div>
      <div><label for="sea">Año de la numeración</label><input id="sea" type="number" value="${s.anio}" ${ro}></div></div>
    <label class="opt" style="margin-top:10px"><input type="checkbox" id="ser" ${s.reinicio_anual ? 'checked' : ''} ${ro}> Volver a empezar desde 1 cada año</label>
    <label class="opt" style="margin-top:8px"><input type="checkbox" id="sed" ${s.por_defecto ? 'checked' : ''} ${ro}> Serie por defecto para su tipo</label>
    ${s.id ? `<label class="opt" style="margin-top:8px"><input type="checkbox" id="seac" ${s.activa !== false ? 'checked' : ''} ${ro}> Activa</label>` : ''}
    <div class="acts" style="justify-content:flex-end"><button class="btn sec" data-cerrar>Cerrar</button>${admin ? '<button class="btn" id="seok">Guardar</button>' : ''}</div>`;
  $('dlg').showModal();
  const prev = () => {
    const cod = $('sec').value.trim().toUpperCase() || 'X', a = +$('sea').value || 2026, n = +$('ses').value || 1;
    let r = $('sef').value.replace('{S}', cod).replace('{AAAA}', a).replace('{AA}', String(a % 100).padStart(2, '0'));
    r = r.replace(/\{(N+)\}/, (m, g) => String(n).padStart(g.length, '0'));
    $('serprev').textContent = r;
  };
  ['sec', 'sef', 'ses', 'sea'].forEach(k => $(k).oninput = prev); prev();
  if (!$('seok')) return;
  $('seok').onclick = async () => {
    const { data: r, error } = await db.rpc('guardar_serie', { p: { id: s.id || null, codigo: $('sec').value.trim(), nombre: $('sen').value.trim(), tipo: $('set').value,
      formato: $('sef').value.trim(), siguiente: +$('ses').value, anio: +$('sea').value, reinicio_anual: $('ser').checked, por_defecto: $('sed').checked,
      ...($('seac') ? { activa: $('seac').checked } : {}) } });
    if (error || (r && r.ok === false)) { toast(r && r.error === 'numero_usado' ? `Ese número ya se ha usado: el último emitido es el ${r.ultimo}` : 'No se ha podido guardar', true); return; }
    $('dlg').close(); toast('Serie guardada'); pintarSeries();
  };
}

/* ---------------- datos fiscales y preferencias de facturación ---------------- */

async function pintarEmpresa() {
  await cargarAjustes();
  const e = AJUSTES.empresa || {}, c = Object.assign({ vencimiento_dias: 15, forma_pago: '', emitir_al_validar: false }, AJUSTES.facturacion || {});
  const f = (k, t, extra) => `<div><label for="em_${k}">${t}</label><input id="em_${k}" value="${esc(e[k] || '')}" ${extra || ''}></div>`;
  $('fcuerpo').innerHTML = `<div class="card" style="padding-top:16px;padding-bottom:16px">
    <h2 style="padding:0 0 8px">Datos fiscales del emisor</h2><p class="sm">Aparecen en cada factura. Las facturas ya emitidas conservan los datos con los que se emitieron.</p>
    <div class="g2">${f('razon_social', 'Razón social')}${f('nif', 'NIF')}</div>
    <div class="g2">${f('direccion', 'Dirección')}${f('cp', 'Código postal')}</div>
    <div class="g2">${f('municipio', 'Población')}${f('provincia', 'Provincia')}</div>
    <div class="g2">${f('telefono', 'Teléfono')}${f('email', 'Email', 'type="email"')}</div>
    <div class="g2">${f('iban', 'IBAN para transferencias')}${f('registro', 'Datos registrales (Registro Mercantil)')}</div>
    <label for="em_pie">Pie de factura</label><textarea id="em_pie" rows="2" placeholder="Condiciones, protección de datos…">${esc(e.pie || '')}</textarea>
    <h2 style="padding:18px 0 8px">Al emitir</h2>
    <div class="g2"><div><label for="fcv">Días hasta el vencimiento</label><input id="fcv" type="number" min="0" value="${+c.vencimiento_dias || 0}"></div>
      <div><label for="fcf">Forma de pago si el pedido no la indica</label><select id="fcf"><option value="">—</option>${(CAT.forma_pago || []).map(x => `<option ${x.valor === c.forma_pago ? 'selected' : ''}>${esc(x.valor)}</option>`).join('')}</select></div></div>
    <label class="opt" style="margin-top:10px"><input type="checkbox" id="fce" ${c.emitir_al_validar ? 'checked' : ''}>
      <span><b>Emitir la factura automáticamente al confirmar un pedido</b><br><span class="sm">Si no, se emite a mano desde el pedido con «Emitir factura».</span></span></label>
    <div class="acts" style="justify-content:flex-end"><button class="btn" id="emok">Guardar</button></div></div>`;
  $('emok').onclick = async () => {
    const emp = {}; ['razon_social', 'nif', 'direccion', 'cp', 'municipio', 'provincia', 'telefono', 'email', 'iban', 'registro', 'pie'].forEach(k => emp[k] = $('em_' + k).value.trim());
    emp.pais = e.pais || 'España';
    if (!emp.razon_social || !emp.nif) { toast('La razón social y el NIF son obligatorios', true); return; }
    const [a, b] = await Promise.all([
      db.rpc('guardar_ajuste', { p_clave: 'empresa', p_valor: emp }),
      db.rpc('guardar_ajuste', { p_clave: 'facturacion', p_valor: { vencimiento_dias: +$('fcv').value || 0, forma_pago: $('fcf').value, emitir_al_validar: $('fce').checked } })]);
    if (a.error || b.error) { toast('No se ha podido guardar', true); return; }
    AJUSTES.empresa = emp; toast('Datos guardados');
  };
}

/* ---------------- VeriFactu (solo administración) ---------------- */

// (v2.183.0: aquí iba la primera versión de pintarVerifactu; se redefine entera más abajo)

async function pintarRegistro() {
  cargando($('fcuerpo'), 'Cargando el registro…');
  const { data } = await RPC_ORIG('eventos_facturacion_lista', { lim: 200 });
  const l = data || [];
  $('fcuerpo').innerHTML = `<div class="panel"><div class="cuenta">Todo lo que ocurre en la facturación queda anotado: emisiones, rectificaciones, cobros y cambios de configuración.</div>
    <div class="dgrid-wrap"><div class="dgrid evs"><div class="dh"><span>Fecha y hora</span><span>Evento</span><span>Factura</span><span>Persona</span><span>Detalle</span></div>
    ${l.map(e => `<div class="dr" style="cursor:default"><span>${new Date(e.fecha).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}</span><span><b>${esc(e.tipo)}</b></span>
      <span>${esc(e.numero || '—')}</span><span>${esc(e.usuario || '—')}</span><span class="sm corta">${esc(detalleEvento(e.detalle))}</span></div>`).join('') || '<div class="vacio">Sin eventos.</div>'}
    </div></div></div>`;
}

/* ---------------- desde el pedido: emitir o ver la factura ---------------- */

async function emitirFacturaPedido(pedidoId, o = {}) {
  const { data: pd } = await RPC_ORIG('pedido_detalle', { p_id: pedidoId });
  const cli = pd && pd.contacto;
  const aviso = !cli ? '\n\n⚠ El pedido no tiene cliente: la factura saldrá sin destinatario. Para una factura completa, asigna antes un cliente con su NIF.'
    : !cli.nif ? `\n\n⚠ ${cli.nombre} no tiene DNI o CIF en su ficha: conviene añadirlo antes para una factura completa.` : '';
  if (!o.yaVista && !await preguntar('Se emite la factura con el número siguiente de la serie. Una vez emitida no se puede modificar ni borrar: si hay un error se corrige con una rectificativa.' + aviso,
    { titulo: '¿Emitir la factura?', ok: 'Emitir factura' })) return null;
  const { data: r, error } = await db.rpc('emitir_factura', { p_pedido: pedidoId });
  if (error || (r && r.ok === false)) {
    toast(r && r.error === 'ya_facturado' ? 'Este pedido ya tiene la factura ' + r.numero : r && r.error === 'no_validado' ? 'Solo se facturan pedidos confirmados' : r && r.error === 'distribuidor' ? 'Este pedido lo factura el distribuidor' : r && r.error === 'sin_cargo' ? 'Una entrega sin cargo no se factura' : 'No se ha podido emitir: ' + ((error && error.message) || (r && r.error)), true);
    return null;
  }
  toast('Factura ' + r.numero + ' emitida');
  return r;
}


// Emisión automática al validar, si está configurada
const RPC_V2300 = db.rpc;
db.rpc = function (fn, params, opts) {
  const b = RPC_V2300.call(db, fn, params, opts);
  if (fn !== 'guardar_pedido' || !params || !params.p || params.p.estado === 'Borrador') return b;
  return conCatch(Promise.resolve(b).then(async res => {
    try {
      if (!res.error && res.data && res.data.ok && res.data.estado !== 'Borrador' && (AJUSTES.facturacion || {}).emitir_al_validar && puedeFacturar()) {
        const { data: f } = await RPC_ORIG('emitir_factura', { p_pedido: res.data.id });
        if (f && f.ok) setTimeout(() => toast('Factura ' + f.numero + ' emitida'), 900);
      }
    } catch (e) {}
    return res;
  }));
};

/* ---------------- ayudas ---------------- */

AYUDA.facturacion = ['Facturación', 'Facturas emitidas desde los pedidos, rectificativas y cobros.', [
  'La factura se emite desde un pedido confirmado (<b>🧾 Emitir factura</b> en el pedido) o sola al confirmarlo, si está configurado en Datos fiscales.',
  'Cada serie numera de forma correlativa y puede continuar la numeración de tu programa anterior (indica el siguiente número al configurarla).',
  'Una factura emitida no se puede modificar ni borrar. Si hay un error, <b>Rectificar</b> emite una rectificativa en negativo, total o por unidades, y puede anular el pedido para devolver el stock.',
  'Registra los cobros (total o parcial). El estado pasa a Cobrada, Pendiente o Vencida según el vencimiento.',
  '<b>Ver e imprimir</b> abre la factura lista para imprimir o guardar en PDF.',
  'VeriFactu está preparado (huella encadenada, QR y registro de eventos) y se activa solo desde administración.']];
MANUAL.push({ id: 'facturacion', t: 'Facturación', a: 'V', para: 'Facturas desde pedidos confirmados, rectificativas, cobros, series y VeriFactu.',
  hacer: [[1, 'Ver facturas y cobros (administración y televenta)'], [2, 'Emitir facturas, rectificar y registrar cobros'], [3, 'Configurar series, datos fiscales y VeriFactu (administración)']],
  config: ['Series y numeración', 'Datos fiscales, vencimiento y emisión automática', 'VeriFactu (solo administración)'] });


