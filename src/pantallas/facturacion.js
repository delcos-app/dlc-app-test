// pantallas/facturacion.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

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

function ajustarFacturacion() {
  if (TAB !== 'facturacion') return;
  const cu = $('fcuerpo'); if (!cu) return;
  if (FSEC === 'series') {
    const nb = [...cu.querySelectorAll('button')].find(x => /nueva serie/i.test(x.textContent));
    const barra = cu.querySelector('.tbarra, .filtros.conbtn');
    if (nb && barra && nb.parentElement !== barra) { const hb = barra.querySelector('.htbtn'); nb.classList.add('tbacc'); hb ? barra.insertBefore(nb, hb) : barra.appendChild(nb); }
  }
  // Series y Registro: su texto explicativo pasa a una ayuda «i» al principio de la barra de la tabla
  if (FSEC === 'series' || FSEC === 'registro') {
    const barra = cu.querySelector('.tbarra, .filtros.conbtn');
    if (barra && !barra.querySelector('.ai')) {
      const txt = [cu.querySelector('.panel > .cuenta'), FSEC === 'series' ? cu.querySelector('.panel > p.sm') : null].filter(Boolean);
      if (txt.length) {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'ai'; b.textContent = 'i'; b.setAttribute('aria-label', 'Ayuda');
        b.dataset.ayudaTit = FSEC === 'series' ? 'Series y numeración' : 'Registro de facturación';
        b.dataset.ayudaTxt = txt.map(x => { const c = x.cloneNode(true); c.querySelectorAll('button').forEach(y => y.remove()); return c.textContent.trim().replace(/\s+/g, ' '); }).join(' ');
        barra.insertBefore(b, barra.firstChild); txt.forEach(x => x.remove());
      }
    }
  }
}

// Factura de ejemplo para la vista previa
function facturaEjemplo() {
  // Los datos reales de la empresa (Facturación → Configuración → Datos fiscales); de ejemplo solo lo que falte
  const real = Object.fromEntries(Object.entries((AJUSTES || {}).empresa || {}).filter(([, v]) => v));
  if (real.poblacion && !real.municipio) real.municipio = real.poblacion;
  const e = Object.assign({ razon_social: nombreApp(), nif: 'B00000000', direccion: 'Calle Mayor 1', cp: '08001', municipio: 'Barcelona', telefono: '930 000 000', web: 'www.tuempresa.com', email: 'hola@tuempresa.com', iban: 'ES00 0000 0000 0000 0000 0000', pie: 'Gracias por su confianza.' }, real);
  const pr = (PRODUCTOS[0] || { nombre: 'Producto de ejemplo' }).nombre;
  return { numero: 'F260001', fecha: hoyISO(), vencimiento: hoyISO(), emisor: e, forma_pago: 'Transferencia bancaria',
    cliente: { nombre: 'Cliente de ejemplo', nif: '12345678Z', direccion: 'Avenida Diagonal 100', municipio: 'Barcelona', cp: '08018', provincia: 'Barcelona', email: 'cliente@correo.es' },
    lineas: [{ descripcion: pr + ' · caja de 60 cápsulas', precio: 41.82, unidades: 2, base: 83.64, iva: 10 }, { descripcion: 'Envío', precio: 5, unidades: 1, base: 5, iva: 21 }],
    base: 88.64, desglose_iva: [{ iva: 10, cuota: 8.36 }, { iva: 21, cuota: 1.05 }], total: 98.05, verifactu: {} };
}

// Botón en Facturas (administración)
function botonDisenoPDF() {
  return;   // v2.87.0: el diseño del PDF está en la configuración de facturación, no en Facturas
  if (TAB !== 'facturacion' || FSEC !== 'facturas' || !PERFIL || !puede('administrar') || $('fpdfbtn')) return;
  const acts = document.querySelector('#v-facturacion .saludo .acts'); if (!acts) return;
  acts.insertAdjacentHTML('afterbegin', `<button class="btn sec" id="fpdfbtn" type="button">${svgIco(ICON_NOM.file)} Diseño del PDF</button>`);
  $('fpdfbtn').onclick = () => disenoPDF();
}

/* v2.165.0 · Bajar de plan con orden (decisiones de Eric, 4/10/2026):
   - A medida: no se baja desde la app; lo hace delcos desde su panel y no antes de la fecha de compromiso del contrato.
   - Las bajadas (plan menor, menos usuarios o de anual a mensual) se programan para el final del periodo pagado; las subidas, al momento.
     Antes de confirmar se enseña lo que se deja de tener. «Plan y suscripción» dice el cambio previsto (con «Anular el cambio») y la baja pedida.
   - Sin Facturación en el plan pero con facturas emitidas: Facturación en solo consulta (verlas y descargarlas, no emitir; la base lo impide). */
function facConsulta() {
  try { return !!(PAGO_ESTADO && PAGO_ESTADO.facturas) && !['empresa', 'medida'].includes((PLAN_ACTUAL || {}).plan); } catch (e) { return false; }
}

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

// ---- PDF ----
function listaPDF() {
  const a = AJUSTES.factura_pdf_plantillas || {};
  if (Array.isArray(a.lista) && a.lista.length) return { lista: a.lista, defecto: a.defecto || a.lista[0].id };
  return { lista: [{ id: 'base', nombre: 'Diseño principal', cfg: AJUSTES.factura_pdf || {} }], defecto: 'base' };
}

async function guardarPDFPlantillas(v) {
  const { data: r, error } = await RPC_V2342('guardar_ajuste', { p_clave: 'factura_pdf_plantillas', p_valor: v });
  if (error || (r && r.ok === false)) { toast('No se han podido guardar las plantillas del PDF', true); return false; }
  AJUSTES.factura_pdf_plantillas = v; return true;
}

async function elegirPlantillaPDF() {
  const { lista, defecto } = listaPDF(); PDF_ELEGIDO = null;
  if (lista.length < 2) return true;
  const def = lista.find(x => x.id === defecto) || lista[0];
  const k = await elegirOpcion('¿Con qué diseño?', `Hay ${lista.length} diseños del PDF. El de por defecto es «${def.nombre}».`,
    [{ k: '', t: 'Cancelar', cls: 'sec' }, ...[def, ...lista.filter(x => x !== def)].map((x, i) => ({ k: x.id, t: x.nombre, cls: i ? 'sec' : '' }))]);
  if (!k) return false;
  PDF_ELEGIDO = k; return true;
}

function emitir(inp) { inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true })); }

// v2.113.0 · Unidades de la ficha por semana (12), mes (12) o año (5)
const UDS_SERIES = [['semana', 'Semana'], ['mes', 'Mes'], ['anio', 'Año']];

let FSEC = 'facturas';

const pillCobro = e => `<span class="pill ${e === 'Cobrada' ? 'p-est' : e === 'Vencida' ? 'p-anu' : 'p-bor'}">${esc(e)}</span>`;

const refrescarFacturas = () => { if (TAB === 'facturacion' && FSEC === 'facturas' && $('flista')) pintarFacturas(); };

const fac = fn => () => { $('cfgcuerpo').innerHTML = '<div id="fcuerpo"></div>'; fn(); };

const FAC_CONFIG = [['empresa', 'Datos fiscales'], ['series', 'Series y numeración'], ['verifactu', 'VeriFactu'], ['registro', 'Registro']];

let FAC_ULTIMA = 'empresa';

/* v2.121.0 · Página «Organización» (menú de usuario, arriba): marca, correo, copias, plan y facturación de la empresa, solo para el
   Propietario (configurar_organizacion) y el Administrador de la plataforma (gestionar_plataforma). Empresa y Plan pasan a ser
   pestañas suyas; Configuración se queda con lo del día a día. Y en escritorio, las ventanas de Configuración y de estas páginas
   se abren dentro del área de contenido, no por encima. */
// Las pestañas de facturación usan #fcuerpo, como el módulo Facturación: su pantalla se vacía para no tener dos (se rehace al volver)
const facOrg = fn => () => { const v = $('v-facturacion'); if (v) v.innerHTML = ''; fac(fn)(); };

const facSinPlan = () => { try { return !['empresa', 'medida'].includes((PLAN_ACTUAL || {}).plan); } catch (e) { return false; } };

/* ---------------- Analítica: cifras que cuentan y línea de seis meses ---------------- */
const AN_SERIE = new Map();

/* ============================================================
   v2.348.0 · Estados del pedido (Eric: A + B de https://claude.ai/artifact/TNX2JSHkXP6thEzunyUZ8b). «Validado» decía que el
   pedido estaba bien hecho, no que estuviera cobrado, y el indicador «Pagos por validar» usaba la misma palabra. Ahora:
   A · el estado es «Confirmado» y el cobro va aparte (Pendiente de cobro / Cobrado / Sin cargo);
   B · en la lista, el estado dice qué le falta: Borrador, Esperando pago, Por cobrar, Por preparar, Por facturar, Completado
   o Anulado. Se calcula con lo que ya se guarda. Con contrarreembolso se prepara antes de cobrar; con las demás formas de
   pago, primero se cobra (así, en «Pendientes de cobro» todos dicen «Por cobrar»).
   ============================================================ */
const cobroDe = p => p.sin_cargo || sinCargoP(p, p.total) ? 'Sin cargo' : p.pago_estado === 'Cobrado' || p.pago_validado_en ? 'Cobrado' : 'Pendiente de cobro';
