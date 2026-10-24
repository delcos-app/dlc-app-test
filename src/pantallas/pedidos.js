// pantallas/pedidos.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

// Ver pedido · Operativa: pago, paquete, emails
async function pedidoOperativa(id) {
  if (!$('dlg').open || !(VE_TODO() || puede('administrar'))) return;
  const { data } = await RPC_ORIG('pedido_detalle', { p_id: id });
  const p = data && data.pedido; if (!p || p.estado !== 'Confirmado' || $('pdops')) return;
  await cargarAjustes();
  const cli = data.contacto || {}, total = +((data.totales || {}).total || 0);
  const permitido = VE_TODO() && nivelDe2('V') >= 2;
  const acts = $('dbody').querySelector('.acts:last-of-type');
  acts.insertAdjacentHTML('beforebegin', `<div class="blk" id="pdops" data-nosucio><h3>Operativa</h3>
    ${p.sin_cargo ? '<p class="sm">Entrega sin cargo: sin factura ni cobro. Las unidades cuentan al profesional de referencia.</p>' : ''}${OPS.filter(([k]) => !(p.sin_cargo && k === 'pago')).map(([k, t]) => `<label class="opchk ${opHecho(p, k) ? 'on' : ''}"><input type="checkbox" data-op="${k}" ${opHecho(p, k) ? 'checked' : ''} ${permitido ? '' : 'disabled'}>
      <span>${esc(t)}${k === 'pago' && p.forma_pago ? ` <span class="sm">· ${esc(p.forma_pago)}${/reembolso/i.test(p.forma_pago) ? ' (se cobra al entregar)' : ''}</span>` : ''}</span></label>`).join('')}
    <label class="opchk ${p.reportar_profesional ? 'on' : ''}"><input type="checkbox" data-reporte ${p.reportar_profesional ? 'checked' : ''} ${permitido ? '' : 'disabled'}>
      <span>Reportado ${esc(TT('medico', 's', 'al', 'l', 'l'))}</span></label>
    <div class="acts" style="margin:6px 0 0">
      ${p.sin_cargo ? '' : cli.email ? `<a class="btn sec" id="pdmailpago" data-ped="${id}" href="mailto:${esc(cli.email)}?subject=${encodeURIComponent(asuntoEmailPago(p, total, cli.nombre))}&body=${encodeURIComponent(textoEmailPago(p, total, cli.nombre))}">✉️ Preparar email con los datos de pago</a>` : '<span class="sm">El cliente no tiene email en su ficha.</span>'}
    </div></div>`);
  $('dbody').querySelectorAll('[data-op]').forEach(c => c.onchange = async () => {
    const { data: r, error } = await db.rpc('marcar_operativa', { p_pedido: id, p_campo: c.dataset.op, p_hecho: c.checked });
    if (error || (r && r.ok === false)) { c.checked = !c.checked; toast('No se ha podido guardar', true); return; }
    c.closest('.opchk').classList.toggle('on', c.checked);
    toast(c.checked ? (c.dataset.op === 'pago' ? 'Cobrado' + (p.factura_id ? ' · cobro anotado en la factura' : '') : 'Hecho') : 'Desmarcado');
    if (TAB === 'ventas' && PEDSEC === 'ventas') pintarOperativa();
  });
  const crep = $('dbody').querySelector('[data-reporte]');   // v2.328.0
  if (crep) crep.onchange = async () => {
    const { data: r, error } = await db.rpc('marcar_reporte', { p_id: id, p_valor: crep.checked });
    if (error || (r && r.ok === false)) { crep.checked = !crep.checked; toast('No se ha podido guardar', true); return; }
    crep.closest('.opchk').classList.toggle('on', crep.checked);
    toast(crep.checked ? 'Reportado' : 'Ya no se reporta');
  };
  if ($('pdmailpago')) $('pdmailpago').addEventListener('click', () => setTimeout(async () => {
    if (await preguntar('¿Has enviado el email con los datos de pago?', { titulo: 'Email de pago', ok: 'Sí, marcar como enviado' })) {
      await db.rpc('marcar_operativa', { p_pedido: id, p_campo: 'email_pago', p_hecho: true }); verPedido(id);
    }
  }, 800));
}

function totalesPedido(lineas, d, dt, env) {
  const ls = lineas.map(l => ({ b: (+l.importe || 0) * (1 - (+l.descuento || 0) / 100), iva: +l.iva || 0, u: +l.unidades || 0 }));
  const sb = ls.reduce((n, l) => n + l.b, 0);
  const k = !+d || !sb ? 1 : dt === 'importe' ? Math.max(0, 1 - d / sb) : Math.max(0, 1 - d / 100);
  const porIva = {};
  ls.forEach(l => { porIva[l.iva] = (porIva[l.iva] || 0) + l.b * k * l.iva / 100; });
  const t = { unidades: ls.reduce((n, l) => n + l.u, 0), bruto: sb, descuento: sb * (1 - k), baseProd: sb * k, porIva };
  // El envío se escribe con IVA; aquí se separa su base y su IVA
  t.envio = env && env.on ? { con: r2(env.con), iva: +env.iva || 0, base: (+env.con || 0) / (1 + (+env.iva || 0) / 100), nombre: env.nombre || 'Envío' } : null;
  if (t.envio) { t.envio.ivaImp = t.envio.con - t.envio.base; porIva[t.envio.iva] = (porIva[t.envio.iva] || 0) + t.envio.ivaImp; }
  t.base = t.baseProd + (t.envio ? t.envio.base : 0);
  t.iva = Object.values(porIva).reduce((n, x) => n + x, 0);
  t.total = t.base + t.iva;
  return t;
}

// Pedidos · Pestañas Ventas, Compras y Proveedores, y contenido de Compras y Proveedores
async function pedidosSecciones() {
  const v = $('v-ventas');
  v.querySelector('.saludo h1').firstChild.textContent = 'Pedidos';
  v.querySelector('.saludo .fecha').textContent = 'Ventas, compras y proveedores';
  v.querySelector('.saludo').insertAdjacentHTML('afterend', `<div class="subnav" id="pedsub">
    <button data-pedsec="ventas" aria-pressed="${pedsecVista() === 'ventas'}">Ventas</button>
    <button data-pedsec="compras" aria-pressed="${pedsecVista() === 'compras'}">Compras</button>
    <button data-pedsec="proveedores" aria-pressed="${pedsecVista() === 'proveedores'}">Proveedores</button></div>`);
  v.querySelectorAll('[data-pedsec]').forEach(b => b.onclick = () => { PEDSEC = b.dataset.pedsec; cargarVentas(); });
  if (PEDSEC === 'ventas') return;
  const acts = v.querySelector('.saludo .acts');
  acts.innerHTML = puedeCompras() ? (PEDSEC === 'compras' ? '<button class="btn" id="compnueva">+ Nuevo pedido de compra</button>'
    : '<button class="btn" id="provnuevo">+ Nuevo proveedor</button>') : '';
  if ($('compnueva')) $('compnueva').onclick = () => editorCompra(null);
  if ($('provnuevo')) $('provnuevo').onclick = () => editorProveedor(null);
  if (PEDSEC === 'compras') pintarCompras(); else pintarProveedores();
}

// Pedidos · Pestaña Llamadas y operativa de ventas
async function pedidosLlamadas(sec) {
  PEDSEC = sec;
  const sub = $('pedsub');
  if (PEDSEC === 'llamadas' && !hayOportunidades()) PEDSEC = 'ventas';
  if (sub && VE_TODO() && hayOportunidades() && !sub.querySelector('[data-pedsec="llamadas"]')) {
    sub.insertAdjacentHTML('beforeend', `<button data-pedsec="llamadas" aria-pressed="${PEDSEC === 'llamadas'}">Oportunidades</button>`);
    sub.querySelector('[data-pedsec="llamadas"]').onclick = () => { PEDSEC = 'llamadas'; cargarVentas(); };
  }
  if (sub) sub.querySelectorAll('[data-pedsec]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.pedsec === PEDSEC)));
  if (PEDSEC === 'ventas' && VE_TODO()) pintarOperativa();
  if (PEDSEC === 'llamadas') {
    const acts = $('v-ventas').querySelector('.saludo .acts');
    acts.innerHTML = '<button class="btn" id="llnueva">+ Nueva venta</button>';
    $('llnueva').onclick = () => nuevaVenta();
    pintarLlamadas();
  }
}

// Pedidos · Botón «Registrar llamada» en Ventas
async function pedidosBotonLlamada() {
  return;   // v2.125.0: «+ Nueva venta» une llamada y pedido
  if (!VE_TODO() || PEDSEC !== 'ventas') return;
  const acts = $('v-ventas').querySelector('.saludo .acts');
  if (acts && !$('pedllam')) {
    acts.insertAdjacentHTML('afterbegin', '<button class="btn sec" id="pedllam">📞 Registrar llamada</button>');
    $('pedllam').onclick = () => editorLlamada(null);
  }
}

/* Parte base; cargarVentas le añade el resto */
async function cargarVentasBase() {
  vaciarModulos('v-ventas');
  $('v-ventas').innerHTML = `
    <div class="saludo"><div><h1>Ventas</h1><div class="fecha">Pedidos, unidades e importes</div></div>
      <div class="acts" style="margin:0">${puedeVentas() ? '<button class="btn" id="pednuevo">+ Nueva venta</button>' : ''}</div></div>
    <div id="vcuerpo">
      <div class="panel">
        <div class="filtros">
          <div id="pper"></div>
          <div><label for="pcanal">Canal</label><select id="pcanal">
            <option value="">Todos</option><option value="paciente">Venta ${TT('paciente', 's', 'al', 'l', 'l')}</option>
            <option value="centro">Venta a centro</option></select></div>
          <div><label for="pestado">Estado</label><select id="pestado">
            <option value="">Todos</option><option value="Confirmado">Confirmados</option>
            <option value="Borrador">Borradores</option><option value="Anulado">Anulados</option></select></div>
          <div><label for="pq">Buscar</label><input id="pq" type="search" placeholder="${TT('medico', 's', '', 'l', 'C')}, ${TT('paciente', 's', '', 'l', 'l')} o nº de pedido"></div>
        </div>
        <div class="kpis vtot" id="ptotales"></div>
        <div id="pedlista"></div>
      </div>
    </div>`;
  if ($('pednuevo')) $('pednuevo').onclick = () => nuevaVenta();   // v2.125.0: cliente, interés y cierre en un recorrido
  montarPeriodo($('pper'), { id: 'ventas', valor: 'mes', alCambiar: listaPedidos });
  ['pcanal', 'pestado'].forEach(id => $(id).onchange = listaPedidos);
  let tq; $('pq').oninput = () => { clearTimeout(tq); tq = setTimeout(listaPedidos, 350); };
  await cargarProductos();
  listaPedidos();
  pintarSinAtribuir();
}

function textoEmailPago(p, total, cliente) { return plantillaCorreo('pago', 'texto', varsCorreo({ documento: 'pedido', numero: p.numero, importe: total, nombre: cliente })); }

async function listaPedidos() {
  if (!$('pedlista') || !$('pper') || !$('pcanal')) return;
  const r = $('pper').__rango();
  if (!$('popf') && $('pestado')) {
    $('pestado').closest('div').insertAdjacentHTML('afterend', `<div><label for="popf">Operativa</label><select id="popf">
      <option value="">Todo</option><option value="pago">Pendiente de cobro</option><option value="paquete">Paquete por preparar</option><option value="email">Factura por enviar</option></select></div>`);
    $('popf').onchange = () => { PEDPAG = 0; listaPedidos(); };
  }
  // v2.115.0: origen del pedido (web o el resto)
  if (!$('porigf') && $('popf')) {
    $('popf').closest('div').insertAdjacentHTML('afterend', `<div><label for="porigf">Origen</label><select id="porigf">
      <option value="">Todos</option><option value="web">Por la web</option><option value="portal">Portal del centro</option><option value="otros">Comercial, teléfono o correo</option></select></div>`);
    $('porigf').onchange = () => { PEDPAG = 0; listaPedidos(); };
  }
  // v2.329.0: reportados o no al profesional (interno: solo quien ve todo)
  if (!$('prepf') && $('porigf') && VE_TODO()) {
    $('porigf').closest('div').insertAdjacentHTML('afterend', `<div><label for="prepf">Reporte</label><select id="prepf">
      <option value="">Todos</option><option value="si">Reportados</option><option value="no">Sin reportar</option></select></div>`);
    $('prepf').onchange = () => { PEDPAG = 0; listaPedidos(); };
  }
  filtrosRestaurar($('v-ventas'));   // v2.269.0: los filtros que tenías
  const params = { p_desde: r.desde, p_hasta: r.hasta, p_canal: $('pcanal').value || null, q: ($('pq') && $('pq').value.trim()) || null,
    p_estado: $('pestado').value || null, p_operativa: ($('popf') && $('popf').value) || null, lim: tamPagina(), desplaz: PEDPAG * tamPagina(),
    ...(($('porigf') && $('porigf').value) ? { p_origen: $('porigf').value } : {}),
    ...(($('prepf') && $('prepf').value) ? { p_reportado: $('prepf').value } : {}),
    ...(Object.keys(PEDF).length ? { f_campos: PEDF } : {}) };
  const clave = 'pedidos-' + JSON.stringify(params);
  if (!$('pedlista').querySelector('.dgrid')) cargando($('pedlista'), 'Cargando pedidos…');
  const res = await rpcCache('pedidos_pagina', params, clave);
  if (!$('pedlista') || !$('pestado')) return;
  if (!res.data) { $('pedlista').innerHTML = `<div class="vacio">No se ha podido cargar${res.error ? ': ' + esc(res.error.message) : ''}.</div>`; return; }
  const d = res.data, s = d.resumen || {}, imp = verImportes();
  PEDIDOS = d.filas || [];
  $('ptotales').innerHTML = `
    <div class="kpi"><b>${num(s.pedidos || 0)}</b><span>Pedidos completados${s.borradores ? ` · ${s.borradores} en borrador` : ''}</span></div>
    <div class="kpi"><b>${num(s.unidades || 0)}</b><span>Unidades</span></div>
    ${s.web_pedidos != null ? `<div class="kpi" id="pkweb"><b>${num(s.web_pedidos || 0)}</b><span>Por la web${imp && s.web_base != null ? ` · ${eurI(s.web_base || 0)} sin IVA` : ''}</span></div>` : ''}
    ${imp ? `<div class="kpi"><b>${eurI(s.base || 0)}</b><span>Base sin IVA</span></div>
    <div class="kpi"><b>${eurI(s.iva || 0)}</b><span>IVA</span></div>
    <div class="kpi ok"><b>${eurI(s.total || 0)}</b><span>Total con IVA</span></div>` : ''}`;
  const ico = p => p.estado !== 'Confirmado' ? '' : p.sin_cargo ? `<span class="opico" title="Paquete ${p.paquete_en ? 'preparado' : 'por preparar'}"><i class="${p.paquete_en ? 'ok' : 'no'}">📦</i></span>` : `<span class="opico" title="Pago ${p.pago_estado === 'Cobrado' ? 'recibido' : 'pendiente'} · Paquete ${p.paquete_en ? 'preparado' : 'por preparar'}${p.factura ? ' · Factura ' + (p.email_factura_en ? 'enviada' : 'por enviar') : ''}">
      <i class="${p.pago_estado === 'Cobrado' ? 'ok' : 'no'}">💳</i><i class="${p.paquete_en ? 'ok' : 'no'}">📦</i>${p.factura ? `<i class="${p.email_factura_en ? 'ok' : 'no'}">🧾</i>` : ''}</span>`;
  const cpCols = clasVisibles('pedido');
  $('pedlista').innerHTML = PEDIDOS.length ? `<div class="dgrid-wrap"><div class="dgrid peds2 ${imp ? '' : 'sinimp'}">
    <div class="dh"><span>Fecha</span><span>Cliente</span><span>${TT('medico', 's', '', 'l', 'C')}</span><span>Comercial</span><span>Productos</span>
      <span class="num">Uds.</span>${imp ? '<span class="num">Base</span><span class="num">Total</span>' : ''}<span>Estado</span><span>Operativa</span><span>Notas</span>${clasCabeceras(cpCols)}</div>
    ${PEDIDOS.map(p => `<button class="dr" data-ped="${p.id}" style="${p.estado === 'Anulado' ? 'opacity:.55' : ''}">
      <span>${fechaCorta(p.fecha)}${p.factura || p.numero ? `<span class="sm">${esc(p.factura || p.numero)}</span>` : ''}</span>
      <span><b>${esc(p.contacto || p.centro || p.cuenta_texto || '—')}</b><span class="sm">${etiquetaCanal(p, p.total)}${p.origen === 'web' ? ' · <span class="pweb">Web</span>' : p.origen === 'portal' ? ' · <span class="pweb">Portal</span>' : ''}${p.forma_pago ? ' · ' + esc(p.forma_pago) : ''}${p.justificante ? ' · <span title="Con justificante de pago">📎</span>' : ''}</span></span>
      <span class="corta">${p.medico ? esc(p.medico) : '<span class="vac">Sin atribuir</span>'}</span>
      <span>${p.comercial ? esc(p.comercial) : '<span class="vac">—</span>'}</span>
      <span class="sm corta">${esc(p.productos || '')}</span><span class="num">${num(p.unidades)}</span>
      ${imp ? `<span class="num">${eurI(p.base)}</span><span class="num"><b>${eurI(p.total)}</b></span>` : ''}
      <span>${pillPaso(p)}</span><span>${ico(p)}</span><span class="sm corta pednota" title="${esc(p.nota || '')}">${esc(p.nota || '')}</span>${clasCeldas(cpCols, p.clasificadores)}</button>`).join('')}
  </div></div>` : '<div class="vacio">No hay pedidos con estos filtros.</div>';
  clasRejilla($('pedlista').querySelector('.dgrid.peds2'), cpCols.length);
  if (!$('pedpag')) $('pedlista').insertAdjacentHTML('afterend', '<div id="pedpag"></div>');
  paginador($('pedpag'), d.total, PEDPAG, p => { PEDPAG = p; listaPedidos(); $('pedlista').scrollIntoView({ block: 'start' }); }, () => { PEDPAG = 0; listaPedidos(); });
  if (res.cache) avisoCache($('pedlista'), res.fecha);
  $('pedlista').querySelectorAll('[data-ped]').forEach(b => b.onclick = () => verPedido(b.dataset.ped));
}

function nuevaVenta(pre) { return editorOportunidad(pre || null); }

function menuPedidos2139() {
  const nav = document.querySelector('nav.main .in'); if (!nav || ES_MEDICO()) return;
  const ped = nav.querySelector('[data-t="ventas"]'); if (!ped) return;
  const ve = !ped.classList.contains('hide') && puedeModulo('ventas');
  let tras = ped;
  [['oportunidades', 'Oportunidades', ve && VE_TODO() && hayOportunidades()], ['compras', 'Compras', ve], ['proveedores', 'Proveedores', ve]].forEach(([t, txt, vis]) => {
    let b = nav.querySelector(`[data-t="${t}"]`);
    if (!b) { tras.insertAdjacentHTML('afterend', `<button data-t="${t}" aria-selected="false">${txt}</button>`); b = nav.querySelector(`[data-t="${t}"]`); }
    b.classList.toggle('hide', !vis);
    if (!b.closest('.mlbs')) tras = b;   // con el menú lateral, cada uno va en su bloque
  });
}

async function configurarAvisosPedidos(oblig) {
  const pref = ((PERFIL.preferencias || {}).avisos_pedidos) || {}, admin = puede('administrar');
  const { data: aj } = admin ? await db.from('ajustes').select('valor').eq('clave', 'avisos_pedidos').maybeSingle() : { data: null };
  const fij = ((aj && aj.valor) || {}).obligatorios || {}, roles = admin ? rolesNombres().filter(r => !rolPuede(r, 'portal_prescriptor')) : [];
  $('dbody').innerHTML = `<div class="fh"><div><h2>Avisos de pedidos</h2><div class="sm">Qué avisos quieres ver arriba en Pedidos</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="lista">${AVISOS_PED.map(([k, t, ic]) => `<label class="item" style="cursor:default"><input type="checkbox" data-avp="${k}" ${oblig.includes(k) || pref[k] !== false ? 'checked' : ''} ${oblig.includes(k) ? 'disabled' : ''}>
        <span class="tx"><b>${ic} ${t}</b>${oblig.includes(k) ? '<span class="sm">Obligatorio para tu rol</span>' : ''}</span></label>`).join('')}</div>
    ${admin ? `<h3 style="margin:14px 0 4px">Obligatorios por rol</h3><p class="sm">Los marcados no se pueden ocultar ni quitar.</p>
      <div class="dgrid-wrap"><table class="tabla avrol"><thead><tr><th>Rol</th>${AVISOS_PED.map(([, t]) => `<th>${t}</th>`).join('')}</tr></thead>
        <tbody>${roles.map(r => `<tr><td>${esc(r)}</td>${AVISOS_PED.map(([k]) => `<td style="text-align:center"><input type="checkbox" data-avr="${esc(r)}|${k}" ${(fij[r] || []).includes(k) ? 'checked' : ''} aria-label="${esc(r)}: obligatorio"></td>`).join('')}</tr>`).join('')}</tbody></table></div>` : ''}
    <div class="acts" style="justify-content:flex-end"><button class="btn sec" data-cerrar>Cancelar</button><button class="btn" id="avpok">Guardar</button></div>`;
  $('dlg').showModal();
  $('avpok').onclick = async () => {
    const av = {}; $('dbody').querySelectorAll('[data-avp]').forEach(x => { if (!x.disabled) av[x.dataset.avp] = x.checked; });
    if (!await guardarPrefsAvisos(av)) return;
    if (admin) {
      const ob = {}; $('dbody').querySelectorAll('[data-avr]:checked').forEach(x => { const [r, k] = x.dataset.avr.split('|'); (ob[r] = ob[r] || []).push(k); });
      const { data: r, error } = await db.rpc('guardar_ajuste', { p_clave: 'avisos_pedidos', p_valor: { obligatorios: ob } });
      if (error || (r && r.ok === false)) { toast('No se han podido guardar los obligatorios', true); return; }
    }
    $('dlg').close(); toast('Avisos guardados'); pintarOperativa();
  };
}

async function pagoLlamar(cuerpo, boton) {
  if (boton) { boton.disabled = true; boton.dataset.txt = boton.textContent; boton.textContent = 'Abriendo…'; }
  try {
    const { data, error } = await db.functions.invoke('pagos', { body: cuerpo });
    let d = data;
    if (error) { try { d = await error.context.json(); } catch (e) { d = { ok: false, error: error.message }; } }
    if (!d || !d.ok) { toast('No se ha podido: ' + ((d && d.error) || 'error del pago'), true); return null; }
    return d;
  } finally { if (boton) { boton.disabled = false; boton.textContent = boton.dataset.txt; } }
}

// Al volver de Stripe: se espera a que llegue el aviso y el plan quede activo
async function pagoEsperarActivo() {
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 3000));
    await pagoCargarEstado();
    const pl = PLAN_ACTUAL || {};
    if (pl.stripe_suscripcion && pl.estado === 'activo') { toast('Suscripción activa: plan ' + planDe(pl.plan).nombre); if (TAB === 'plan' || TAB === 'organizacion' || TAB === 'config') ir(TAB); return; }
  }
  toast('El pago está hecho; la suscripción aparecerá en unos minutos');
}

async function pagoEsperarBaja() {
  for (let i = 0; i < 15; i++) {
    await pagoCargarEstado();
    const pl = PLAN_ACTUAL || {};
    if (pl.baja_al_final || pl.estado === 'cancelada') {
      toast(`Baja registrada: puedes usar delcos hasta el ${fechaCorta(pl.periodo_fin)}`);
      if (TAB === 'plan' || TAB === 'organizacion' || TAB === 'config') ir(TAB); return;
    }
    await new Promise(r => setTimeout(r, 2000));
  }
  toast('Baja pedida: en unos minutos lo verás en Plan y suscripción');
}

// ---- Cobros y suscripciones: el estado de pago de cada empresa (de ajustes.plan, que mantiene el aviso de Stripe)
function pdCobroEstado(o) {
  const p = o.plan_datos || {};
  if (o.bloqueada) return ['Bloqueada', 'p-anu', o.bloqueada === 'desactivada' ? 'Desactivada' : 'Prueba terminada'];
  if (p.estado === 'cancelada') return ['Cancelada', 'p-anu', p.periodo_fin ? 'Acceso hasta el ' + pdFecha(p.periodo_fin) : ''];
  if (p.estado === 'impago') { const d = p.impago_desde ? Math.round((Date.now() - new Date(p.impago_desde + 'T12:00:00')) / 864e5) : 0;
    return ['Impago', 'p-urg', d >= 14 ? 'Solo lectura desde hace ' + (d - 14) + ' días' : 'Le quedan ' + (14 - d) + ' días de gracia']; }
  if (p.en_prueba || p.estado === 'prueba') return ['En prueba', 'p-warn', (p.prueba_hasta || p.periodo_fin) ? 'Hasta el ' + pdFecha(p.prueba_hasta || p.periodo_fin) : ''];
  if (!p.stripe_suscripcion) return [p.plan === 'medida' ? 'A medida' : 'Sin suscripción', 'p-per', p.plan === 'medida' ? 'Contrato con delcos' : 'Sin pago con tarjeta'];
  return ['Al día', 'p-est', p.periodo_fin ? 'Próximo recibo: ' + pdFecha(p.periodo_fin) : ''];
}

function pdMensual(p) {
  if (!p || !p.stripe_suscripcion || p.estado === 'cancelada' || p.plan === 'medida') return 0;
  const pl = planDe(p.plan), u = Math.max(+p.usuarios || 0, pl.minimo || 3);
  return (p.pago === 'anual' ? (pl.anual || pl.precio) : pl.precio) * u;
}

async function cargarDistribuidores(forzar) {
  if (DISTRIBUIDORES && !forzar) return DISTRIBUIDORES;
  const { data } = await db.from('distribuidores').select('id,nombre,email,telefono,activo').order('nombre');
  DISTRIBUIDORES = (data || []).filter(d => d.activo);
  return DISTRIBUIDORES;
}

function pintarBloqueDistribuidor() {
  const o = $('porig'), fila = o && o.closest('.g2');
  if (!fila || $('pdist') || !PED_DIST) return;
  const l = DISTRIBUIDORES || [], admin = puede('administrar');
  if (PED_DIST.on && !PED_DIST.id && l.length) PED_DIST.id = l[0].id;
  fila.insertAdjacentHTML('afterend', `<div class="pdist" id="pdist"><label>Lo sirve</label>
    <div class="segs" id="pdsirve" role="group" aria-label="Lo sirve"><button type="button" data-ds="0" class="${PED_DIST.on ? '' : 'on'}" aria-pressed="${!PED_DIST.on}">Nosotros</button>
      <button type="button" data-ds="1" class="${PED_DIST.on ? 'on' : ''}" aria-pressed="${PED_DIST.on}">Un distribuidor</button></div>
    <div id="pddat" class="${PED_DIST.on ? '' : 'hide'}">
      ${l.length ? `<div class="g2"><div><label for="pdsel">Distribuidor</label><select id="pdsel">${l.map(d => `<option value="${d.id}" ${d.id === PED_DIST.id ? 'selected' : ''}>${esc(d.nombre)}</option>`).join('')}</select></div>
        <div><label for="pdcod">Código del cliente en el distribuidor</label><input id="pdcod" value="${esc(PED_DIST.codigo)}" placeholder="Si lo tiene"></div></div>
        <label class="opt"><input type="checkbox" id="pdfac" ${PED_DIST.factura ? 'checked' : ''}> Lo factura el distribuidor <span class="sm">· no se emite factura nuestra</span></label>`
      : `<p class="sm">Todavía no hay distribuidores.${admin ? '' : ' Pide a administración que los añada.'}</p>`}
      ${admin ? '<button type="button" class="lnk" id="pdnuevo">+ Nuevo distribuidor</button>' : ''}
      <p class="sm">Un pedido que sirve el distribuidor no descuenta stock de vuestro almacén.</p></div></div>`);
  $('pdist').querySelectorAll('[data-ds]').forEach(b => b.onclick = () => {
    PED_DIST.on = b.dataset.ds === '1';
    if (PED_DIST.on && !PED_DIST.id && l.length) PED_DIST.id = l[0].id;
    $('pdist').querySelectorAll('[data-ds]').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
    $('pddat').classList.toggle('hide', !PED_DIST.on);
  });
  if ($('pdsel')) $('pdsel').onchange = e => { PED_DIST.id = e.target.value; };
  if ($('pdcod')) $('pdcod').oninput = e => { PED_DIST.codigo = e.target.value; };
  if ($('pdfac')) $('pdfac').onchange = e => { PED_DIST.factura = e.target.checked; };
  if ($('pdnuevo')) $('pdnuevo').onclick = () => nuevoDistribuidor();
}

async function nuevoDistribuidor() {
  $('dlg2body').innerHTML = `<div class="fh"><div><h2>Nuevo distribuidor</h2><div class="sm">Mayorista o depósito que sirve pedidos a vuestros clientes</div></div>
      <button class="x" data-cerrar2 aria-label="Cerrar">✕</button></div>
    <label for="dsn">Nombre</label><input id="dsn" placeholder="p. ej. Cofares">
    <div class="g2"><div><label for="dse">Correo para pedidos</label><input id="dse" type="email"></div><div><label for="dst">Teléfono</label><input id="dst" inputmode="tel"></div></div>
    <div class="acts" style="justify-content:flex-end"><button type="button" class="btn sec" data-cerrar2>Cancelar</button><button type="button" class="btn" id="dsok">Añadir</button></div>`;
  $('dlg2').showModal();
  $('dsok').onclick = async () => {
    const nombre = $('dsn').value.trim(); if (!nombre) { toast('Escribe el nombre', true); return; }
    const { data, error } = await db.from('distribuidores').insert({ nombre, email: $('dse').value.trim() || null, telefono: $('dst').value.trim() || null }).select('id').single();
    if (error) { toast('No se ha podido añadir: ' + error.message, true); return; }
    $('dlg2').close(); toast('Distribuidor añadido');
    await cargarDistribuidores(true);
    if (PED_DIST) { PED_DIST.on = true; PED_DIST.id = data.id; }
    const b = $('pdist'); if (b) { b.remove(); pintarBloqueDistribuidor(); }
  };
}

function pkMarcar() {
  const s = $('popf'), v = s ? s.value : '';
  document.querySelectorAll('#operativa [data-pk]').forEach(b => { b.classList.toggle('on', b.dataset.pk === v); b.setAttribute('aria-pressed', b.dataset.pk === v); });
}

function editarDistribuidor(d) {
  const nuevo = !d; d = d || {};
  $('dlg2body').innerHTML = `<div class="fh"><div><h2>${nuevo ? 'Nuevo distribuidor' : 'Editar distribuidor'}</h2><div class="sm">Mayorista o depósito que sirve pedidos a vuestros clientes</div></div>
      <button class="x" data-cerrar2 aria-label="Cerrar">✕</button></div>
    <label for="dsn">Nombre</label><input id="dsn" placeholder="p. ej. Cofares" value="${esc(d.nombre || '')}">
    <div class="g2"><div><label for="dse">Correo para pedidos</label><input id="dse" type="email" value="${esc(d.email || '')}"></div>
      <div><label for="dst">Teléfono</label><input id="dst" inputmode="tel" value="${esc(d.telefono || '')}"></div></div>
    <label for="dsnota">Nota</label><input id="dsnota" placeholder="Horario de pedidos, persona de contacto…" value="${esc(d.nota || '')}">
    <div class="acts" style="justify-content:flex-end"><button type="button" class="btn sec" data-cerrar2>Cancelar</button><button type="button" class="btn" id="dsok">${nuevo ? 'Añadir' : 'Guardar'}</button></div>`;
  $('dlg2').showModal();
  $('dsok').onclick = async () => {
    const nombre = $('dsn').value.trim(); if (!nombre) { toast('Escribe el nombre', true); return; }
    const email = $('dse').value.trim() || null;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast('El correo no parece válido', true); return; }
    const fila = { nombre, email, telefono: $('dst').value.trim() || null, nota: $('dsnota').value.trim() || null };
    $('dsok').disabled = true;
    const { error } = nuevo ? await db.from('distribuidores').insert(fila) : await db.from('distribuidores').update(fila).eq('id', d.id);
    if (error) { $('dsok').disabled = false; toast((nuevo ? 'No se ha podido añadir: ' : 'No se ha podido guardar: ') + error.message, true); return; }
    $('dlg2').close(); toast(nuevo ? 'Distribuidor añadido' : 'Guardado');
    await cargarDistribuidores(true).catch(() => []);
    if (CFG_KEY === 'distribuidores' && $('cfgcuerpo')) pintarDistribuidores();
  };
}

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

// (R-12: textoEmailPago se definía aquí otra vez; ahora está en su sitio, más arriba)
function asuntoEmailPago(p, total, cliente) { return plantillaCorreo('pago', 'asunto', varsCorreo({ documento: 'pedido', numero: p.numero, importe: total, nombre: cliente })); }

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

/* ============================================================
   v2.314.0 · Pedido con pago por transferencia (aviso de Eric: el correo con los datos de pago solo salía con el pedido
   validado y, si el cliente no pagaba, había que hacer una rectificativa). En el pedido, con la forma de pago
   «Transferencia»: «Enviar los datos de pago» guarda el pedido en borrador y envía el correo; «Guardar y validar» pregunta si
   se guarda en borrador hasta que llegue el pago. En el borrador, el bloque «Pago por transferencia» con el estado del correo,
   «Enviar los datos de pago» y «Pago recibido · validar» (valida el pedido y anota el pago).
   ============================================================ */
/* v2.315.0: la pregunta usa elegirOpcion de siempre (una segunda declaración con el mismo nombre la sustituía y rompía las demás ventanas). */
function esTransferencia(fp) { return /transfer/i.test(fp || ''); }

function pkFestivo(iso) { return PK_FESTIVOS.includes(iso.slice(5)) || iso === isoMas(pkPascua(+iso.slice(0, 4)), -2); }

function pkLibre(iso) { const w = new Date(iso + 'T12:00:00').getDay(); return w === 0 || w === 6 || pkFestivo(iso); }

function pkDia(iso, n, hoy) {
  const f = new Date(iso + 'T12:00:00'), letra = 'DLMXJVS'[f.getDay()];
  const tit = `${f.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}${pkFestivo(iso) ? ' (festivo)' : ''} · ${num(n)}`;
  return `<span class="${pkLibre(iso) ? 'fin' : ''} ${hoy ? 'u' : ''}" title="${esc(tit)}"><b>${f.getDate()}</b>${letra}</span>`;
}

function tpvError(r) {
  r = r || {};
  if (r.error === 'movil') return `Falta el móvil ${TT('paciente', 's', 'del', 'l', 'l')}: hace falta un móvil español para enviarle el enlace`;
  if (r.error === 'redsys') return r.detalle || 'El banco no ha aceptado el cobro';
  return TPV_ERR[r.error] || ('No se ha podido enviar el enlace de pago' + (r.detalle ? ': ' + r.detalle : ''));
}

async function tpvLlamar(body) {
  let { data, error } = await db.functions.invoke('cobro_tpv', { body });
  if (!data && error) { try { data = await error.context.json(); } catch (e) { data = null; } }
  if (!data && error) data = { ok: false, error: 'interno', detalle: /Failed to send|not found|404/i.test(error.message || '') ? 'falta publicar la función «cobro_tpv» en el servidor' : error.message };
  return data || { ok: false };
}

async function tpvEnviar(pedidoId) {
  const r = await tpvLlamar({ accion: 'enviar', pedido_id: pedidoId });
  if (!r.ok) { toast(tpvError(r), true); return r; }
  toast(`Enlace de pago enviado por SMS al ${r.movil}`);
  return r;
}

async function tpvBloque(id) {
  const box = $('pdpago'); if (!box || $('pdtpv')) return;
  const [{ data: ls }, { data: p }] = await Promise.all([
    db.from('pagos_tpv').select('*').eq('pedido_id', id).neq('estado', 'Anulado').order('creado_en', { ascending: false }).limit(1),
    db.from('pedidos').select('estado,pago_estado,forma_pago,sin_cargo').eq('id', id).maybeSingle()]);
  if (!$('pdpago') || $('pdtpv') || !p) return;
  const t = (ls || [])[0];
  const pendiente = ['Confirmado', 'Borrador'].includes(p.estado) && (p.pago_estado || 'Pendiente') === 'Pendiente' && !p.sin_cargo;   // v2.333.0: también en borrador
  const puedeEnviar = pendiente && tpvActivo() && esPagoTpv(p.forma_pago) && (puede('administrar') || nivelDe2('V') >= 2);
  if (!t && !puedeEnviar) return;
  const est = t && t.estado === 'Enviado' && t.caduca_en && new Date(t.caduca_en) < new Date() ? 'Caducado' : t && t.estado;
  const [etq, cls] = TPV_EST[est] || ['', ''];
  const cuando = s => s ? `${fechaCorta(String(s).slice(0, 10))} a las ${new Date(s).toTimeString().slice(0, 5)}` : '';
  const detalle = !t ? 'Todavía no se ha enviado el enlace de pago.'
    : est === 'Pagado' ? `Pagado${t.metodo ? ' con ' + esc(t.metodo === 'Bizum' ? t.metodo : t.metodo.toLowerCase()) : ''} el ${cuando(t.pagado_en)}${t.autorizacion ? ' · autorización ' + esc(t.autorizacion) : ''}${t.metodo && t.forma_pedida && t.forma_pedida.toLowerCase() !== t.metodo.toLowerCase() ? ` · el pedido se hizo con «${esc(t.forma_pedida)}» y el cliente eligió ${esc(t.metodo === 'Bizum' ? t.metodo : t.metodo.toLowerCase())}` : ''}`
    : est === 'Fallido' ? esc(t.error || 'El banco no ha autorizado el pago')
    : est === 'Caducado' ? `El enlace enviado al ${esc(t.movil || '')} el ${cuando(t.creado_en)} ha caducado sin pagar`
    : `Enviado por SMS al ${esc(t.movil || '')} el ${cuando(t.creado_en)} · esperando el pago${p.estado === 'Borrador' ? '. Cuando pague, el pedido se confirma solo.' : ''}`;
  const verPrueba = t && t.entorno === 'pruebas' && est === 'Enviado' && t.url_pago;
  box.insertAdjacentHTML('beforeend', `<div class="tpvped" id="pdtpv">
    <div class="pdpagof"><span class="sm">Cobro con tarjeta o Bizum</span>${etq ? `<span class="pill ${cls}">${etq}</span>` : ''}</div>
    <p class="sm">${detalle}</p>
    ${puedeEnviar || verPrueba ? `<div class="acts">
      ${verPrueba ? `<a class="btn sec chico" id="tpvabrir" href="${esc(t.url_pago)}" target="_blank" rel="noopener">Abrir la página de pago (pruebas)</a>` : ''}
      ${puedeEnviar ? `<button type="button" class="btn ${t ? 'sec ' : ''}chico" id="tpvenviar">${t ? 'Volver a enviar' : 'Enviar enlace de pago'}</button>` : ''}</div>` : ''}</div>`);
  const b = $('tpvenviar');
  if (b) b.onclick = async () => {
    if (t && est === 'Enviado' && !await preguntar('El enlace anterior deja de valer y le llega uno nuevo por SMS.', { titulo: '¿Volver a enviar el enlace de pago?', ok: 'Enviar' })) return;
    b.disabled = true;
    const r = await tpvEnviar(id);
    b.disabled = false;
    if (r.ok && $('pdtpv')) { $('pdtpv').remove(); tpvBloque(id); }
  };
  // Mientras se espera el pago y el pedido está abierto, se mira cada 8 s: al pagar, el pedido se repinta cobrado
  clearTimeout(TPV_MIRA);
  if (est === 'Enviado') TPV_MIRA = setTimeout(async function mira() {
    if (!$('dlg').open || !$('pdtpv')) return;
    const { data: x } = await db.from('pagos_tpv').select('estado').eq('id', t.id).maybeSingle();
    if (!$('dlg').open || !$('pdtpv')) return;
    if (x && x.estado === 'Pagado') { toast(p.estado === 'Borrador' ? 'Cobrado · pedido confirmado' : 'Cobrado'); invalidarCache(); verPedido(id); if (TAB === 'ventas') cargarVentas(); return; }
    if (x && x.estado !== 'Enviado') { $('pdtpv').remove(); tpvBloque(id); return; }
    TPV_MIRA = setTimeout(mira, 8000);
  }, 8000);
}

function pintarTpv() {
  const c = $('cfgcuerpo'); if (!c) return;
  const cfg = tpvCfg();
  c.innerHTML = `<div class="card tpvw">
    <p class="sm">Al confirmar un pedido con forma de pago tarjeta o Bizum, ${TT('paciente', 's', 'el', 'l', 'l')} recibe un SMS de vuestro banco con un enlace para pagar con tarjeta o Bizum. Cuando paga, el pedido queda cobrado solo. Funciona con el TPV virtual de Redsys (el de la mayoría de bancos) con PayGold activado: los datos los da el banco.</p>
    <label class="opt"><input type="checkbox" id="tpvact" ${cfg.activo ? 'checked' : ''}> Cobrar con tarjeta o Bizum desde los pedidos</label>
    <div class="g2"><div><label for="tpvcom">Número de comercio</label><input id="tpvcom" inputmode="numeric" value="${esc(cfg.comercio || '')}"></div>
      <div><label for="tpvter">Terminal</label><input id="tpvter" inputmode="numeric" value="${esc(cfg.terminal || '')}"></div></div>
    <div class="g2"><div><label for="tpvcla">Clave secreta del TPV</label><input id="tpvcla" type="password" autocomplete="new-password" placeholder="${cfg.hay_clave ? '•••••••• guardada · escribe solo para cambiarla' : ''}"></div>
      <div><label for="tpvent">Entorno</label><select id="tpvent"><option value="pruebas">Pruebas (sin dinero real)</option><option value="real" ${cfg.entorno === 'real' ? 'selected' : ''}>Real</option></select></div></div>
    <p class="sm">Dirección de aviso que hay que dar al banco: <b id="tpvurl">${esc(CFG.url)}/functions/v1/cobro_tpv</b></p>
    <div class="acts"><button type="button" class="btn sec" id="tpvdemo">Usar los datos de pruebas de Redsys</button>
      <button type="button" class="btn sec" id="tpvprobar">Probar</button><button type="button" class="btn" id="tpvok">Guardar</button></div>
    <p class="sm" id="tpvmsg"></p></div>`;
  $('tpvdemo').onclick = () => { $('tpvcom').value = TPV_PRUEBAS.comercio; $('tpvter').value = TPV_PRUEBAS.terminal; $('tpvcla').value = TPV_PRUEBAS.clave; $('tpvent').value = 'pruebas'; };
  const msg = (t, err) => { $('tpvmsg').innerHTML = `<b class="${err ? 'tpverr' : 'tpvok'}">${t}</b>`; };
  const guardar = async () => {
    const p = { activo: $('tpvact').checked, entorno: $('tpvent').value, comercio: $('tpvcom').value.trim(), terminal: $('tpvter').value.trim() };
    const { data: r, error } = await db.rpc('guardar_cobro_tpv', { p, p_clave: $('tpvcla').value.trim() || null });
    if (error || !r || !r.ok) {
      const e = r && r.error;
      msg(e === 'comercio' ? 'El número de comercio son solo cifras (hasta 9)' : e === 'terminal' ? 'El terminal son solo cifras (hasta 3)'
        : e === 'clave' ? 'Para activarlo falta la clave secreta del TPV' : e === 'permiso' ? 'Solo quien configura la empresa puede cambiar esto'
        : 'No se ha podido guardar' + (error ? ': ' + esc(error.message) : ''), true);
      return false;
    }
    AJUSTES.cobro_tpv = Object.assign({}, p, { hay_clave: r.hay_clave });
    $('tpvcla').value = ''; if (r.hay_clave) $('tpvcla').placeholder = '•••••••• guardada · escribe solo para cambiarla';
    msg('✓ Guardado'); return true;
  };
  $('tpvok').onclick = () => conCarga($('tpvok'), 'Guardando…', guardar);
  $('tpvprobar').onclick = () => conCarga($('tpvprobar'), 'Probando…', async () => {
    if (!await guardar()) return;
    const r = await tpvLlamar({ accion: 'probar' });
    if (!r.ok) { msg(esc(tpvError(r)), true); return; }
    $('tpvmsg').innerHTML = `<b class="tpvok">✓ El banco acepta los datos.</b> ${r.url ? `<a href="${esc(r.url)}" target="_blank" rel="noopener">Ver la página de pago de prueba (1 €)</a>` : ''}`;
  });
}

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

function pillCobroPed(p) {
  if (p.estado !== 'Confirmado') return '';
  const c = cobroDe(p);
  return ' <span class="pill ' + (c === 'Cobrado' ? 'p-trfok' : c === 'Sin cargo' ? 'p-sr' : 'p-bor') + '">' + c + '</span>';
}

function pasoPedido(p) {
  if (p.estado === 'Anulado') return ['Anulado', 'p-anu'];
  if (p.estado === 'Borrador') return p.email_pago_en ? ['Esperando pago', 'p-bor'] : ['Borrador', 'p-sr'];
  if (p.completado === true) return ['Completado', 'p-trfok'];   // v2.351.0: la misma regla que las cifras (pedido_completado)
  const alEntregar = /reembolso/i.test(p.forma_pago || ''), porCobrar = cobroDe(p) === 'Pendiente de cobro';
  if (porCobrar && !alEntregar) return ['Por cobrar', 'p-bor'];
  if (!p.paquete_en) return ['Por preparar', 'p-est'];
  if (porCobrar) return ['Por cobrar', 'p-bor'];
  if (p.completado === false || (!p.factura && !p.factura_id && cobroDe(p) !== 'Sin cargo')) return ['Por facturar', 'p-est'];
  return ['Completado', 'p-trfok'];
}

async function atribuir(lineaId, texto) {
  const { data } = await db.rpc('resolver_cuenta', { p_texto: texto || '' });
  const cand = data || [];
  $('dbody').innerHTML = `
    <div class="fh"><div><h2>Atribuir a ${TT('medico', 's', 'un', 'l', 'l')}</h2><div class="sm">Texto del pedido: ${esc(texto || '(vacío)')}</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <label for="abusca">Buscar ${TT('medico', 's', '', 'l', 'l')}</label><input id="abusca" value="${esc(texto || '')}" placeholder="Código o nombre">
    <div id="acand" class="lista">${cand.map(c => `<button class="item" data-am="${c.id}">
      <span class="ic">${c.pct}%</span><span class="tx"><b>${esc(c.nombre)}</b><span class="sm">Código ${esc(c.codigo)}</span></span></button>`).join('')
      || '<div class="vacio">Sin coincidencias. Escribe otro nombre o código.</div>'}</div>`;

  const pintar = lista => {
    $('acand').innerHTML = lista.length ? lista.map(c => `<button class="item" data-am="${c.id}">
      <span class="ic">${c.pct}%</span><span class="tx"><b>${esc(c.nombre)}</b><span class="sm">Código ${esc(c.codigo)}</span></span></button>`).join('')
      : '<div class="vacio">Sin coincidencias.</div>';
    $('acand').querySelectorAll('[data-am]').forEach(b => b.onclick = async () => {
      const { data: r, error } = await db.rpc('atribuir_linea', { p_linea: lineaId, p_medico: b.dataset.am });
      if (error || (r && r.ok === false)) { toast('No se ha podido atribuir', true); return; }
      $('dlg').close(); toast('Atribuido'); pintarSinAtribuir(); listaPedidos();
    });
  };
  pintar(cand);
  let t;
  $('abusca').oninput = e => {
    clearTimeout(t);
    t = setTimeout(async () => {
      const { data: d2 } = await db.rpc('resolver_cuenta', { p_texto: e.target.value });
      pintar(d2 || []);
    }, 300);
  };
  $('dlg').showModal();
}

function pedsecVista() { return PEDSEC_CARGA || PEDSEC; }

function abrirKpis() {
  let D = kpiConfig().slice();
  KPI_CAT.forEach(k => { if (!D.some(x => x.id === k.id)) D.push({ id: k.id, on: false, t: '' }); });
  const esAdmin = puede('administrar');
  const pinta = () => {
    $('dbody').innerHTML = `
      <div class="fh"><div><h2>Indicadores de Inicio</h2>
        <div class="sm">Pulsa el ojo para mostrar u ocultar. Ordénalos con las flechas y cambia el nombre si quieres.</div></div>
        <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
      <div class="kcards">${D.map((x, i) => {
        const k = KPI_CAT.find(y => y.id === x.id);
        if (!k && !x.filtro) return '';
        if (k && !kpiPermitido(k)) return '';
        const desc = x.filtro ? 'Filtro guardado del Directorio: ' + textoFiltro(x.filtro) + '.' : (AYUDA_KPI[x.id] || '');
        return `<div class="kcard ${x.on ? 'on' : ''}">
          <button type="button" class="kojo" data-kon="${i}" aria-pressed="${x.on}" title="${x.on ? 'Visible: pulsa para ocultar' : 'Oculto: pulsa para mostrar'}">${x.on ? ICO.ojo : ICO.ojoNo}</button>
          <div class="ktx"><input class="chico" data-kt="${i}" value="${esc(x.t)}" placeholder="${esc(k ? k.t.charAt(0).toUpperCase() + k.t.slice(1) : textoFiltro(x.filtro))}" aria-label="Nombre del indicador">
            <span class="sm">${esc(desc)}</span></div>
          <div class="kord">
            <button type="button" class="kmv" data-kmv="${i}|-1" aria-label="Subir" ${i === 0 ? 'disabled' : ''}>${ICO.arriba}</button>
            <button type="button" class="kmv" data-kmv="${i}|1" aria-label="Bajar" ${i === D.length - 1 ? 'disabled' : ''}>${ICO.abajo}</button>
            ${x.filtro ? `<button type="button" class="kmv" data-kdel="${i}" aria-label="Eliminar" title="Eliminar">✕</button>` : ''}</div>
        </div>`;
      }).join('')}</div>
      <div class="acts" style="justify-content:flex-end">
        <button class="btn sec" id="kres">Restaurar</button>
        <button class="btn" id="kok">Guardar</button></div>`;
    const leer = () => $('dbody').querySelectorAll('[data-kt]').forEach(i => D[+i.dataset.kt].t = i.value.trim());
    $('dbody').querySelectorAll('[data-kon]').forEach(b => b.onclick = () => { leer(); D[+b.dataset.kon].on = !D[+b.dataset.kon].on; $('dlg').dataset.sucio = '1'; pinta(); });
    $('dbody').querySelectorAll('[data-kmv]').forEach(b => b.onclick = () => {
      leer(); const [i, dir] = b.dataset.kmv.split('|').map(Number), j = i + dir;
      if (j < 0 || j >= D.length) return; [D[i], D[j]] = [D[j], D[i]]; $('dlg').dataset.sucio = '1'; pinta();
    });
    $('dbody').querySelectorAll('[data-kdel]').forEach(b => b.onclick = () => { leer(); D.splice(+b.dataset.kdel, 1); $('dlg').dataset.sucio = '1'; pinta(); });
    $('kres').onclick = () => { D = KPI_CAT.map(k => ({ id: k.id, on: KPI_DEF.includes(k.id), t: '' })); $('dlg').dataset.sucio = '1'; pinta(); };
    $('kok').onclick = async ev => {
      leer(); ev.target.disabled = true; ev.target.textContent = 'Guardando…';
      const ok = await guardarKpis(D.map(x => ({ id: x.id, on: x.on, t: x.t, ...(x.filtro ? { filtro: x.filtro } : {}) })));
      ev.target.disabled = false; ev.target.textContent = 'Guardar';
      if (!ok) return;
      $('dlg').close(); toast('Indicadores guardados'); cargarInicio();
    };
  };
  pinta();
  $('dlg').showModal();
}

function esPorcentajeIva(i) {
  // Una vez decidido, no cambia (evita que la comprobación y la conversión se contradigan en bucle)
  if (i.dataset.ivaok) return i.dataset.ivaok === '1';
  // La etiqueta puede apuntar ya a la lista de IVA (id + «_sel») si el campo se convirtió antes
  const lab = (((i.id && (document.querySelector(`label[for="${i.id}"]`) || document.querySelector(`label[for="${i.id}_sel"]`))) || i.closest('label') || {}).textContent || '').trim();
  const clave = i.id + ' ' + (i.dataset.f || '') + ' ' + (i.name || '');
  const r = !(ES_IMPORTE.test(clave) || /importe|precio|total|base|coste/i.test(lab))
    && (i.dataset.f === 'iva' || /(^|[_-])iva$/i.test(i.id) || /^[a-z]{0,3}iva$|^penvv$/i.test(i.id) || /^IVA(\s*\(%\)|\s+del servicio(\s*\(%\))?|\s+%)?$|tipo de iva/i.test(lab));
  i.dataset.ivaok = r ? '1' : '0';
  return r;
}

async function verJustificante(id) {
  const { data, error } = await db.from('pedidos_justificantes').select('nombre,tipo,datos').eq('id', id).single();
  if (error || !data) { toast('No se ha podido abrir el justificante', true); return; }
  const bin = atob(data.datos), u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  const url = URL.createObjectURL(new Blob([u8], { type: data.tipo }));
  const w = window.open(url, '_blank');
  if (!w) { const a = document.createElement('a'); a.href = url; a.download = data.nombre; a.click(); }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

/* ============================================================
   v2.325.0 · Pedidos: pago solo de lectura y entregas sin cargo (aviso de Eric, 16/10/2026).
   - El bloque «Pago» del pedido ya no se edita a medias: enseña la referencia y los justificantes que haya; se cambian con
     «Editar» (o «Editar datos» si ya tiene factura). Fuera «Guardar referencia» y «Añadir justificante» (basta el check de
     «Pago recibido»); en el editor tampoco se adjuntan justificantes.
   - Un pedido sin cargo (marcado así o a 0 € con unidades) se describe como «Entrega sin cargo» y no como «Venta al …»: no es una
     venta (también los que se hicieron antes al 100 % de descuento).
   ============================================================ */
function sinCargoP(p, total) { return !!(p && (p.sin_cargo || (total != null && Math.abs(+total) < 0.005 && (p.unidades == null || +p.unidades > 0)))); }

function pillPaso(p) {
  const [t, c] = pasoPedido(p);
  const hechos = p.estado === 'Confirmado' ? ['Confirmado', p.paquete_en ? 'Preparado' : '', cobroDe(p) === 'Cobrado' ? 'Cobrado' : '', p.factura ? 'Facturado' : ''].filter(Boolean).join(' · ') : '';
  return '<span class="pill ' + c + '"' + (hechos ? ' title="Hecho: ' + hechos + '"' : '') + '>' + t + '</span>';
}

function lineaDesglose(l) {
  const bruto = +l.importe || 0, base = bruto * (1 - (+l.descuento || 0) / 100), iva = base * (+l.iva || 0) / 100;
  return { bruto, base, iva, total: base + iva };
}

function bloqueTotales(t) {
  const tipos = Object.keys(t.porIva).sort((a, b) => a - b);
  return `<div><span>Unidades</span><b>${num(t.unidades)}</b></div>
    ${t.descuento > 0.004 ? `<div><span>Suma de líneas</span><b>${eurI(t.bruto)}</b></div>
      <div><span>Descuento general</span><b>−${eurI(t.descuento)}</b></div>` : ''}
    ${t.envio ? `<div><span>Productos sin IVA</span><b>${eurI(t.baseProd)}</b></div>
      <div><span>${esc(t.envio.nombre)} sin IVA</span><b>${eurI(t.envio.base)}</b></div>` : ''}
    <div><span>Base imponible</span><b>${eurI(t.base)}</b></div>
    ${tipos.filter(k => t.porIva[k] > 0.004 || tipos.length === 1).map(k => `<div><span>IVA ${k}%</span><b>${eurI(t.porIva[k])}</b></div>`).join('')}
    ${t.envio ? `<div class="sm" style="justify-content:flex-end"><span>Incluye ${esc(t.envio.nombre.toLowerCase())} de ${eurI(t.envio.con)} con IVA</span></div>` : ''}
    <div class="tot"><span>Total con IVA</span><b>${eurI(t.total)}</b></div>`;
}

const veVentas = () => PERFIL && (puede('administrar') || ((PERFIL.areas || {}).V || 0) >= 1 || puede('cartera'));

let VSEC = 'pedidos';

const pillEstado = e => `<span class="pill ${e === 'Borrador' ? 'p-bor' : e === 'Anulado' ? 'p-anu' : 'p-est'}">${esc(e)}</span>`;

const txtVentanas = v => v && v.length ? v.map(([a, b]) => `${txtMin(a)}–${txtMin(b)}`).join(' y ') : '';

const OPS = [['pago', 'Cobrado', 'pago_estado', '💳'], ['paquete', 'Paquete preparado', 'paquete_en', '📦'],
  ['email_factura', 'Email con la factura enviado', 'email_factura_en', '🧾'], ['email_pago', 'Email con los datos de pago enviado', 'email_pago_en', '✉️']];

const opHecho = (p, k) => k === 'pago' ? p.pago_estado === 'Cobrado' : !!p[OPS.find(o => o[0] === k)[2]];

let PEDPAG = 0;

let PEDF = {};   // v2.88.0: filtros por campos del pedido (Clasificadores)

const NV_DIAS = [['Mañana', 1], ['En 3 días', 3], ['En una semana', 7], ['En un mes', 30]];

const nvLinea = (pid, u) => { const p = PRODUCTOS.find(x => x.id === pid) || {}; return p.precio != null ? r2(p.precio * (1 + (+p.iva || 0) / 100) * (+u || 0)) : 0; };

// Pestaña «Oportunidades» (antes «Llamadas»): volver a llamar, métricas y lista
const NV_DIA_TXT = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

// Pedidos, Oportunidades, Compras y Proveedores: cada uno su entrada en el menú (por dentro, el mismo módulo con su sección)
const ALIAS_PEDIDOS = { oportunidades: 'llamadas', compras: 'compras', proveedores: 'proveedores' };

const TITULO_PEDSEC = { ventas: ['Pedidos', 'Pedidos de tus clientes, con sus unidades e importes'], llamadas: ['Oportunidades', 'Cada venta, se cierre con pedido o no, y por qué'],
  compras: ['Compras', 'Pedidos a proveedores y mercancía en camino'], proveedores: ['Proveedores', 'A quién compras y en qué condiciones'] };

// «Por hacer» de pedidos, configurable
const AVISOS_PED = [['pago', 'Pendientes de cobro', '💳'], ['paquete', 'Paquetes por preparar', '📦'], ['email_factura', 'Facturas por enviar', '🧾'], ['email_pago', 'Datos de pago por enviar', '✉️']];

/* v2.162.0 · Suscripciones y pagos con Stripe (decisiones de Eric, 4/10/2026). «Plan y suscripción» ya no manda correos: «Contratar»
   abre el pago seguro de Stripe (tarjeta), «Cambiar a…» y «Añadir o quitar usuarios» cambian la suscripción con
   prorrateo y «Gestionar el pago» abre el portal de Stripe (tarjeta, recibos, cancelar). Todo pasa por la función de Supabase
   «pagos»; Stripe avisa a «stripe-webhook» y la base (aplicar_suscripcion, SQL 102) activa o cambia el plan. Si un cobro falla, aviso
   arriba durante 14 días y después la empresa queda en solo lectura (la base no deja crear, cambiar ni borrar) hasta que pague. */
const PAGO_PLANES = ['campo', 'comercial', 'empresa'];

let PAGO_ESTADO = null;   // la respuesta de plan_uso (plan, usuarios, solo_lectura)

const pagoAlPlan = () => {
  PAGO_IR_PLAN = false;
  try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
};

const pdHace = v => { if (!v) return '—'; const m = Math.round((Date.now() - new Date(v)) / 60000);
  return m < 60 ? `hace ${Math.max(1, m)} min` : m < 1440 ? `hace ${Math.round(m / 60)} h` : `hace ${Math.round(m / 1440)} días`; };

const pdKpis = l => `<div class="pdkpis">${l.map(([v, t, cls]) => `<div class="pdkpi${cls ? ' ' + cls : ''}"><b>${v}</b><span>${esc(t)}</span></div>`).join('')}</div>`;

const pdEsqueleto = () => `<div class="card cfgpanel"><div class="pdkpis">${'<div class="pdkpi"><div class="skel" style="width:50%"></div><div class="skel" style="width:70%"></div></div>'.repeat(4)}</div><div class="skel"></div><div class="skel" style="width:80%"></div></div>`;

/* v2.173.0 · El próximo recibo con IVA en «Plan y suscripción» (petición de Eric por la sesión de la web: que la web, Stripe y la app digan lo mismo).
   Durante la prueba: hoy 0 €, el primer recibo con IVA (con la puesta en marcha si el pago es mensual) y lo que viene después; fuera de ella, el
   próximo recibo y su fecha. Se pinta al momento con la misma cuenta que la web (IVA = redondeo de base × 21 / 100) y, si la función «pagos»
   devuelve el recibo de Stripe (acción datos, campo proximo), se cambia por ese (lleva descuentos y lo ya apuntado). */
let PAGO_PROXIMO = null;

// Pedidos: el precio del contrato en vigor de la ficha (editorPedido lo consulta en su sitio)
let PED_PRECIOS = { cuenta: null, precios: {} };

/* v2.230.0 · KPIs de Pedidos y Analítica (Eric eligió la A de https://claude.ai/artifact/PTBZBvZ3yZrQxpxXCNKyrs).
   - Pedidos: #operativa deja de ser el cartel con los avisos desplegables y pasa a tres tarjetas vivas (pagos por validar, paquetes por
     preparar y facturas por enviar) con su número que cuenta, una frase y la entrada de los últimos 10 días. Pulsar una pone el filtro
     «Operativa» (#popf) de la tabla; volver a pulsarla lo quita. Las cifras son las de la tabla (todos los pendientes). El engranaje
     (#opcfg) sigue eligiendo qué tarjetas se ven.
   - Analítica: cada indicador cuenta hasta su cifra y dibuja la línea de los últimos seis meses (analitica_kpis_periodo por mes, con
     el filtro propio del indicador). Sin línea los de «a día de hoy» y los de texto. */
const PK_TARJ = [['pago', 'pago', 'Pendientes de cobro', 'credit-card'], ['paquete', 'paquete', 'Paquetes por preparar', 'package'],
  ['email_factura', 'email', 'Facturas por enviar', 'mail']];

const pkMovimiento = () => !matchMedia('(prefers-reduced-motion: reduce)').matches;

let DIS_TODOS = null;

/* ============================================================
   v2.265.0 · Transfer completo con el distribuidor (grupo 4 del plan del 11/10/2026; necesita el SQL 142).
   - Ver pedido → bloque «Distribuidor»: en qué punto está el transfer (Enviado, Aceptado, Servido o Incidencia, con su nota) y
     «Descargar transfer», un PDF con el cliente, su código en el distribuidor y las líneas con referencia y código de barras.
   - Configuración → Datos → Distribuidores: cada distribuidor con sus transfers (cuántos sin enviar, en marcha, servidos y con
     incidencia); al pulsar uno se abre el pedido.
   ============================================================ */
const TRF_EST = [['Enviado', 'Enviado'], ['Aceptado', 'Aceptado'], ['Servido', 'Servido'], ['Incidencia', 'Incidencia']];

const trfPill = e => e ? `<span class="pill ${e === 'Servido' ? 'p-trfok' : e === 'Incidencia' ? 'p-urg' : 'p-per'}">${esc(e)}</span>` : '<span class="pill">Sin enviar</span>';

const PK_FESTIVOS = ['01-01', '01-06', '05-01', '08-15', '10-12', '11-01', '12-06', '12-08', '12-25'];

/* ============================================================
   v2.331.0 · Cobro con tarjeta o Bizum desde el pedido (petición de Eric, 20/10/2026; SQL 171 y función del servidor «cobro_tpv»).
   - Al confirmar un pedido con forma de pago tarjeta o Bizum (y el cobro configurado), delcos pide a Redsys un cobro PayGold y el banco
     envía al móvil del cliente un SMS con el enlace; en esa página paga con tarjeta o Bizum. Cuando paga, Redsys avisa y el pedido pasa
     solo a «Cobrado» (y, si tiene factura, se apunta el cobro). Nadie coge el TPV ni mira la cuenta.
   - En el pedido, dentro de «Pago», el cobro con tarjeta o Bizum: estado del envío (enviado, pagado, no pagado, caducado),
     «Volver a enviar» y, en el entorno de pruebas, «Abrir la página de pago» (el banco de pruebas no envía SMS).
   - Configuración → Facturación → «Cobro con tarjeta y Bizum» (quien configura la empresa): número de comercio, terminal, clave
     secreta, entorno pruebas/real, «Probar» y la dirección de aviso para el banco.
   ============================================================ */
const tpvCfg = () => AJUSTES.cobro_tpv || {};

const tpvActivo = () => !!(TPV_VISIBLE && tpvCfg().activo && puedeModulo('ventas'));

const esPagoTpv = fp => /tarjeta|bizum/i.test(fp || '');

const tpvMovil = t => { let m = String(t || '').replace(/\D/g, ''); m = m.replace(/^(0034|34)(?=[67]\d{8}$)/, ''); return /^[67]\d{8}$/.test(m) ? m : ''; };

const TPV_ERR = {
  permiso: 'No tienes permiso para enviar cobros', estado: 'El pedido tiene que estar confirmado', pagado: 'Este pedido ya está cobrado',
  sin_cargo: 'Una entrega sin cargo no se cobra', importe: 'El pedido no tiene importe', sesion: 'La sesión ha caducado: vuelve a entrar',
  sin_configurar: 'El cobro con tarjeta o Bizum no está configurado (Configuración → Facturación)', no_encontrado: 'No se encuentra el pedido'
};

const TPV_EST = { Enviado: ['Enviado', 'p-est'], Pagado: ['Pagado', 'p-trfok'], Fallido: ['No pagado', 'p-urg'], Caducado: ['Caducado', 'p-urg'], Preparado: ['Enviando…', 'p-warn'] };

let TPV_MIRA = null;

// Datos públicos del entorno de pruebas de Redsys (no cobran nada)
const TPV_PRUEBAS = { comercio: '999008881', terminal: '1', clave: 'sq7HjrUOBfKmC576ILgskD5srU870gJ7' };

async function editorPedidoBase(pedido) {
  if (!PRODUCTOS.length) await cargarProductos();
  const ped = pedido && pedido.pedido ? pedido.pedido : null;
  // v2.322.0: un pedido confirmado se edita entero mientras no tenga factura
  if (ped && (ped.estado === 'Anulado' || (ped.estado !== 'Borrador' && ped.factura_id))) { toast(ped.factura_id ? 'Ese pedido ya tiene factura: para cambiarlo, haz una rectificativa' : 'Un pedido anulado no se puede editar', true); return; }
  // v2.200.0: con un contrato en vigor de la ficha, el precio es el adjudicado
  await cargarPreciosContrato((pedido && ((pedido.medico && pedido.medico.id) || (pedido.lineas && pedido.lineas[0] && pedido.lineas[0].cuenta_id) || (pedido.contacto && pedido.contacto.cuenta_id))) || null);
  const prod = id => conPrecioContrato(PRODUCTOS.find(p => p.id === id) || {});
  let lineas = pedido && pedido.lineas && pedido.lineas.length
    ? pedido.lineas.map(l => ({ producto_id: l.producto_id, producto: l.producto, unidades: l.unidades, importe: l.importe,
        descuento: l.descuento || 0, iva: l.iva != null ? +l.iva : prod(l.producto_id).iva,
        // Solo es manual si el importe no coincide con precio × unidades
        manual: prod(l.producto_id).precio == null || r2(prod(l.producto_id).precio * l.unidades) !== r2(l.importe) }))
    : [{ producto_id: productoPorDefecto(), unidades: 1, descuento: 0 }];
  let medico = pedido && pedido.medico ? pedido.medico
    : (pedido && pedido.lineas && pedido.lineas[0] && pedido.lineas[0].cuenta_id ? { id: pedido.lineas[0].cuenta_id, nombre: pedido.lineas[0].medico } : null);
  let contacto = pedido && pedido.contacto ? pedido.contacto : null;
  if (!medico && contacto && contacto.cuenta_id) medico = { id: contacto.cuenta_id, nombre: contacto.medico || `${TT('medico', 's', '', 'l', 'C')} ${TT('paciente', 's', 'del', 'l', 'l')}`, codigo: contacto.medico_codigo || '' };
  const autoImporte = l => { const p = prod(l.producto_id); if (!l.manual && p.precio != null) l.importe = r2(p.precio * (+l.unidades || 0)); if (l.iva == null || !l.manualIva) l.iva = p.iva != null ? +p.iva : l.iva; };
  lineas.forEach(l => { if (l.importe == null) autoImporte(l); if (l.iva == null) l.iva = prod(l.producto_id).iva || 0; });
  // Datos del formulario que se conservan al repintar
  const form = { fecha: ped ? ped.fecha : hoyISO(), canal: ped ? ped.canal : 'paciente', forma_pago: ped ? ped.forma_pago : '',
    descuento: ped ? (ped.descuento || 0) : 0, descuento_tipo: ped ? ped.descuento_tipo : 'porcentaje', nota: ped ? ped.nota || '' : '',
    cuenta_texto: ped ? ped.cuenta_texto || '' : '',
    servicio_id: ped ? (ped.envio ? (ped.servicio_id || ((SERVICIOS[0] || {}).id) || '') : '') : ((SERVICIOS.find(x => x.por_defecto && x.activo) || {}).id || ''),
    envio: ped ? !!ped.envio : !!SERVICIOS.find(x => x.por_defecto && x.activo),
    envio_iva: ped && ped.envio ? +ped.envio_iva : +((SERVICIOS.find(x => x.por_defecto && x.activo) || {}).iva ?? 21),
    envio_con: ped && ped.envio ? r2(+ped.envio_base * (1 + (+ped.envio_iva || 0) / 100)) : +((SERVICIOS.find(x => x.por_defecto && x.activo) || {}).pvp || 0),
    // v2.115.0: origen (web o no) y referencia del pago
    origen: ['web', 'portal'].includes((ped || pedido || {}).origen) ? (ped || pedido).origen : 'manual', pago_referencia: ped ? ped.pago_referencia || '' : '',
    sin_cargo: ped ? !!ped.sin_cargo : false,   // v2.317.0
    reportar: ped ? !!ped.reportar_profesional : false };   // v2.328.0: por defecto no se reporta
  const justifs = [];   // v2.115.0: justificantes elegidos, se suben al guardar
  const leerForm = () => {
    if (!$('pfecha')) return;
    Object.assign(form, { fecha: $('pfecha').value, canal: $('pcan').value, forma_pago: $('ppago').value,
      descuento: $('pdto').value, descuento_tipo: $('pdtot').value, nota: $('pnota').value,
      envio: $('penv').checked, envio_con: +$('penvi').value || 0, envio_iva: +$('penvv').value || 0, servicio_id: $('pserv').value,
      cuenta_texto: $('pselmed') ? ($('pselmed').__texto || '') : form.cuenta_texto,
      origen: $('porig') ? $('porig').value : form.origen, pago_referencia: $('pref') ? $('pref').value : form.pago_referencia,
      sin_cargo: $('psincargo') ? $('psincargo').checked : form.sin_cargo, reportar: $('prepprof') ? $('prepprof').checked : form.reportar });
  };

  const pinta = () => {
    leerForm();
    $('dbody').innerHTML = `
      <div class="fh"><div><h2>${ped ? (ped.estado === 'Confirmado' ? 'Editar pedido' : 'Editar borrador') : 'Nuevo pedido'}</h2>
        <div class="sm">Escribe los importes con IVA: la base y el IVA se calculan solos.</div></div>
        <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
      <div class="g2">
        <div><label for="pfecha">Fecha</label><input id="pfecha" type="date" value="${esc(form.fecha)}"></div>
        <div><label for="pcan">Canal</label><select id="pcan">
          <option value="paciente" ${form.canal !== 'centro' ? 'selected' : ''}>Venta ${TT('paciente', 's', 'al', 'l', 'l')}</option>
          <option value="centro" ${form.canal === 'centro' ? 'selected' : ''}>Venta a centro (con descuento)</option></select></div>
      </div>
      <div class="g2"><div><label for="porig">Origen</label><select id="porig">
          <option value="manual">Comercial, teléfono o correo</option>
          <option value="web" ${form.origen === 'web' ? 'selected' : ''}>Pedido por la web</option>${form.origen === 'portal' ? '<option value="portal" selected>Portal del centro</option>' : ''}</select></div><div></div></div>
      <div id="zonapac" class="${form.canal === 'centro' ? 'escentro' : ''}">
        <label class="solopac">${TT('paciente', 's', '', 'l', 'C')}</label><div id="pselpac" class="solopac"></div>
        <label><span class="solopac">${TT('medico', 's', '', 'l', 'C')} de referencia</span><span class="solocen">Centro que compra</span></label><div id="pselmed"></div>
        <div class="sm" style="margin-top:4px"><span class="solopac">Si no lo encuentras, deja el nombre escrito: el pedido quedará pendiente de atribuir.</span><span class="solocen">Elige su ficha (de tipo centro): las unidades cuentan para el centro y su comercial.</span></div>
        <label class="opt solopac prepbox"><input type="checkbox" id="prepprof" ${form.reportar ? 'checked' : ''}> Reportar ${esc(TT('medico', 's', 'al', 'l', 'l'))}</label>
      </div>
      <label>Líneas</label>
      <div id="plineas">${lineas.map((l, i) => `<div class="lin" data-li="${i}">
        <div class="lrow">
          <div><label>Producto</label><select data-f="producto_id">${opcionesProducto(l.producto_id, l.producto)}</select></div>
          <div><label>Unidades</label><input data-f="unidades" type="number" min="1" value="${l.unidades}"></div>
          <div><label>Importe con IVA</label><input data-f="importeiva" type="number" step="0.01" min="0" value="${l.importe != null ? r2(l.importe * (1 + (+l.iva || 0) / 100)) : ''}"></div>
          <div><label>% dto.</label><input data-f="descuento" type="number" step="1" min="0" max="100" value="${l.descuento || 0}"></div>
          <div>${lineas.length > 1 ? `<button type="button" class="btn sec" data-lx="${i}" aria-label="Quitar línea">✕</button>` : ''}</div>
        </div>
        <div class="ldes" data-des="${i}"></div></div>`).join('')}</div>
      <div class="acts" style="margin-top:0"><button type="button" class="btn sec" id="plmas">+ Añadir línea</button></div>
      <div class="pscbox"><label class="opt"><input type="checkbox" id="psincargo" ${form.sin_cargo ? 'checked' : ''}> Entrega sin cargo (muestra)</label>
        <span class="sm">Las unidades cuentan ${esc(TT('medico', 's', 'al', 'l', 'l'))} de referencia y salen del stock, pero no es una venta: 0 €, sin factura, sin cobro y sin comisión.</span></div>
      <div class="g2 pscg2">
        <div><label for="ppago">Forma de pago</label><select id="ppago"><option value=""></option>
          ${(CAT.forma_pago || []).map(x => `<option ${form.forma_pago === x.valor ? 'selected' : ''}>${esc(x.valor)}</option>`).join('')}</select></div>
        <div><label for="pdto">Descuento general</label>
          <div style="display:flex;gap:6px"><input id="pdto" type="number" min="0" step="0.01" value="${esc(form.descuento)}">
            <select id="pdtot" style="max-width:110px"><option value="porcentaje">%</option>
              <option value="importe" ${form.descuento_tipo === 'importe' ? 'selected' : ''}>€</option></select></div></div>
      </div>
      <div id="ppagox" class="pagofila ${form.forma_pago ? '' : 'hide'}">
        <div class="pagoref"><label for="pref">Referencia del pago</label><input id="pref" value="${esc(form.pago_referencia)}" placeholder="Código de la transferencia, bizum…"></div>
        <span id="ptrfbox" class="pagoacc ${esTransferencia(form.forma_pago) && !(ped && ped.estado === 'Confirmado') ? '' : 'hide'}"><button type="button" class="btn sec" id="ptrfmail">Enviar los datos de pago</button>
          ${pmAyu('Pago por transferencia', 'Envía al cliente los datos de pago y el pedido se guarda en borrador. Cuando llegue el pago, lo confirmas desde el pedido.')}</span>
        <span id="ptpvbox" class="pagoacc ${tpvActivo() && esPagoTpv(form.forma_pago) && !(ped && ped.estado === 'Confirmado') ? '' : 'hide'}"><button type="button" class="btn sec" id="ptpvenv">Enviar enlace de pago</button>
          ${pmAyu('Pago con tarjeta o Bizum', 'Al cliente le llega por SMS el enlace y elige cómo pagar. El pedido espera en borrador y, cuando paga, se confirma solo y queda cobrado con la forma de pago que haya usado.')}</span>
        <div><label>Justificante (foto o PDF)</label><label class="btn sec" style="display:inline-flex">📎 Adjuntar<input id="pjus" type="file" accept="image/*,application/pdf" data-fp="1" hidden></label>
          <div class="sm" id="pjusl">${justifs.map((j, i) => `<span class="jusp">📎 ${esc(j.nombre)} <button type="button" class="lnk" data-jx="${i}" aria-label="Quitar ${esc(j.nombre)}">quitar</button></span>`).join(' ')}</div></div>
      </div>
      <div class="envbox">
        <label for="pserv" style="margin-top:0">Servicio</label>
        <select id="pserv"><option value="">Sin servicio</option>${SERVICIOS.filter(x => x.activo || x.id === form.servicio_id).map(x =>
          `<option value="${x.id}" ${form.servicio_id === x.id ? 'selected' : ''}>${esc(x.nombre)} · ${eurI(x.pvp || 0)} con IVA</option>`).join('')}</select>
        <input type="checkbox" id="penv" class="hide" ${form.envio ? 'checked' : ''}>
        <div class="g2 ${form.envio ? '' : 'hide'}" id="penvd">
          <div><label for="penvi">Importe del servicio con IVA (€)</label><input id="penvi" type="number" step="0.01" min="0" value="${esc(form.envio_con)}"></div>
          <div><label for="penvv">IVA del servicio (%)</label><input id="penvv" type="number" step="1" min="0" max="21" value="${esc(form.envio_iva)}"></div></div>
      </div>
      <div class="totbox" id="ptot"></div>
      <label for="pnota">Nota</label><input id="pnota" value="${esc(form.nota)}">
      <div class="acts" style="justify-content:flex-end">
        <button class="btn sec" data-cerrar>Cancelar</button>
        <button class="btn sec ${ped && ped.estado === 'Confirmado' ? 'hide' : ''}" id="pborr">Guardar borrador</button>
        <button class="btn" id="pvalid">${ped && ped.estado === 'Confirmado' ? 'Guardar cambios' : 'Guardar y confirmar'}</button></div>`;   // v2.322.0

    const desglose = () => {
      if ($('psincargo') && $('psincargo').checked) lineas.forEach(l => { l.descuento = 100; });   // v2.317.0
      lineas.forEach((l, i) => {
        const d = lineaDesglose(l), el = $('plineas').querySelector(`[data-des="${i}"]`);
        if (el) el.innerHTML = `<span>Base <b>${eurI(d.base)}</b></span><span>IVA ${num(l.iva || 0)}% <b>${eurI(d.iva)}</b></span><span>Total <b>${eurI(d.total)}</b></span>
          ${prod(l.producto_id).precio != null ? `<span>Precio unidad ${eurI(prod(l.producto_id).precio * (1 + (+prod(l.producto_id).iva || 0) / 100))} con IVA</span>` : ''}${prod(l.producto_id).contrato ? `<span class="pill p-est" title="${esc(prod(l.producto_id).contrato)}">Precio de concurso</span>` : ''}`;
      });
      $('penvd').classList.toggle('hide', !$('penv').checked);
      $('ptot').innerHTML = bloqueTotales(totalesPedido(lineas, +$('pdto').value || 0, $('pdtot').value,
        { on: $('penv').checked, con: +$('penvi').value || 0, iva: +$('penvv').value || 0,
          nombre: ((SERVICIOS.find(x => x.id === $('pserv').value) || {}).nombre) || 'Servicio' }));
    };

    $('plineas').oninput = $('plineas').onchange = e => {
      const box = e.target.closest('[data-li]'); if (!box) return;
      const l = lineas[+box.dataset.li], f = e.target.dataset.f;
      if (!f) return;
      l[f] = f === 'producto_id' ? e.target.value : (e.target.value === '' ? null : +e.target.value);
      if (f === 'importeiva') { l.importe = e.target.value === '' ? null : +e.target.value / (1 + (+l.iva || 0) / 100); delete l.importeiva; l.manual = true; }
      if (f === 'producto_id') { l.manual = false; l.iva = prod(l.producto_id).iva || 0; }
      if (f === 'producto_id' || f === 'unidades') {
        autoImporte(l);
        box.querySelector('[data-f="importeiva"]').value = l.importe != null ? r2(l.importe * (1 + (+l.iva || 0) / 100)) : '';
      }
      desglose();
    };
    $('plmas').onclick = () => { lineas.push({ producto_id: productoPorDefecto(), unidades: 1, descuento: 0 }); autoImporte(lineas[lineas.length - 1]); pinta(); };
    $('plineas').querySelectorAll('[data-lx]').forEach(b => b.onclick = () => { lineas.splice(+b.dataset.lx, 1); pinta(); });
    $('pcan').onchange = () => $('zonapac').classList.toggle('escentro', $('pcan').value === 'centro');
    $('ppago').onchange = () => { $('ppagox').classList.toggle('hide', !$('ppago').value); $('ptrfbox').classList.toggle('hide', !esTransferencia($('ppago').value) || !!(ped && ped.estado === 'Confirmado'));
      $('ptpvbox').classList.toggle('hide', !(tpvActivo() && esPagoTpv($('ppago').value)) || !!(ped && ped.estado === 'Confirmado')); };   // v2.314.0 y v2.333.0
    $('pjus').onchange = async e => {
      const f = e.target.files[0]; e.target.value = ''; if (!f) return;
      const j = await leerJustificante(f); if (!j) return;
      justifs.push(j); pinta();
    };
    $('dbody').querySelectorAll('[data-jx]').forEach(b => b.onclick = () => { justifs.splice(+b.dataset.jx, 1); pinta(); });
    ['pdto', 'pdtot', 'penv', 'penvi', 'penvv'].forEach(id => $(id).oninput = $(id).onchange = desglose);
    $('pserv').onchange = () => {
      const sv = SERVICIOS.find(x => x.id === $('pserv').value);
      $('penv').checked = !!sv;
      if (sv) { $('penvi').value = r2(sv.pvp || 0); $('penvv').value = sv.iva != null ? sv.iva : 21; }
      desglose();
    };
    desglose();

    // v2.200.0: al cambiar de ficha, los precios de su contrato (si lo hay) en las líneas que no se han tocado a mano
    const precios = () => cargarPreciosContrato(medico && medico.id).then(c => { if (c) { lineas.forEach(l => { if (!l.manual) autoImporte(l); }); pinta(); } });
    const montarMed = () => {
      $('pselmed').__texto = medico ? '' : form.cuenta_texto;
      selectorMedico($('pselmed'), { valor: medico, placeholder: 'Nombre, código, centro o municipio', alElegir: m => { medico = m; precios(); } });
    };
    selectorPaciente($('pselpac'), { valor: contacto, alElegir: c => {
      contacto = c;
      if (c && !medico && c.cuenta_id) { medico = { id: c.cuenta_id, nombre: c.medico, codigo: c.medico_codigo }; montarMed(); precios(); }
    } });
    montarMed();

    const guardar = async (estado, btn, o = {}) => {
      if (!lineas.some(l => l.producto_id)) { toast('Añade al menos un producto', true); return; }
      const cps = camposLeer($('dbody'));
      if (cps && cps.falta.length) { toast(`Rellena «${cps.falta[0]}»`, true); return; }
      let trfVal = false;   // v2.314.0: con transferencia, el pedido puede esperar al pago en borrador
      const sc = !!($('psincargo') && $('psincargo').checked);   // v2.317.0: entrega sin cargo
      const yaVal = !!(ped && ped.estado === 'Confirmado');   // v2.322.0: validado y sin factura: se guarda tal cual, sin volver a preguntar
      // v2.333.0: con tarjeta o Bizum (y el cobro activo) se elige: enviar el enlace (el pedido espera al pago en borrador y se confirma solo
      // al pagar) o validar ya (cobrado de otra forma). Sin móvil del cliente, se confirma como siempre y se avisa.
      let tpvSinMovil = false;
      if (!sc && !yaVal && estado === 'Confirmado' && !o.alGuardar && tpvActivo() && esPagoTpv($('ppago').value)) {
        if (!await tpvMovilDe(contacto)) tpvSinMovil = true;
        else {
          const v = await elegirOpcion('Pago con tarjeta o Bizum', `Se le puede enviar por SMS el enlace de pago: el pedido espera en borrador y, cuando paga, se confirma solo y queda cobrado. Si ya lo habéis cobrado de otra forma, valídalo ya.`,
            [{ k: 'no', t: 'Cancelar', cls: 'sec' }, { k: 'validar', t: 'Confirmar ya', cls: 'sec' }, { k: 'enlace', t: 'Enviar enlace de pago' }]);
          if (!v) return;
          if (v === 'enlace') { estado = 'Borrador'; o = Object.assign({}, o, { alGuardar: tpvTrasGuardar }); } else trfVal = true;
        }
      }
      if (!medico && contacto && contacto.id && !$('zonapac').classList.contains('escentro')) {   // v2.329.0
        const { data: kc } = await db.from('contactos').select('cuenta_id, cuenta_por_pedido').eq('id', contacto.id).maybeSingle();
        if (kc && kc.cuenta_id && !kc.cuenta_por_pedido) medico = { id: kc.cuenta_id, nombre: contacto.medico || '' };
      }
      if (sc && !medico && !await preguntar(`Sin ${TT('medico', 's', '', 'l', 'l')} de referencia, estas unidades no cuentan a nadie.`, { titulo: 'Entrega sin cargo', ok: 'Guardar igualmente' })) return;
      if (!sc && !yaVal && estado === 'Confirmado' && esTransferencia($('ppago').value)) {
        const v = await elegirOpcion('Pago por transferencia', 'Este pedido se puede guardar en borrador hasta que llegue el pago: no cuenta en métricas ni comisiones y aún se puede cambiar. Cuando llegue la transferencia, lo confirmas desde el pedido.',
          [{ k: 'no', t: 'Cancelar', cls: 'sec' }, { k: 'validar', t: 'Confirmar ya', cls: 'sec' }, { k: 'borrador', t: 'Guardar en borrador' }]);
        if (!v) return;
        if (v === 'borrador') estado = 'Borrador'; else trfVal = true;
      }
      if (estado === 'Confirmado' && !trfVal && !yaVal && !await preguntar('Una vez confirmado, el pedido cuenta en métricas y comisiones y ya no se puede editar ni eliminar: solo anular.',
        { titulo: '¿Confirmar el pedido?', ok: 'Confirmar' })) return;
      btn.disabled = true; const txt = btn.textContent; btn.textContent = 'Guardando…';
      const { data: r, error } = await db.rpc('guardar_pedido', { p: {
        id: ped ? ped.id : null, estado,
        fecha: $('pfecha').value, canal: $('pcan').value,
        cuenta_id: medico ? medico.id : null, cuenta_texto: medico ? '' : ($('pselmed').__texto || '').trim(),
        contacto_id: contacto ? contacto.id : null, nota: $('pnota').value.trim(),
        forma_pago: $('ppago').value || null, origen: $('porig').value, pago_referencia: $('ppago').value ? $('pref').value.trim() : '',
        descuento: +$('pdto').value || 0, descuento_tipo: $('pdtot').value,
        envio: $('penv').checked, envio_con_iva: +$('penvi').value || 0, envio_iva: +$('penvv').value || 0, servicio_id: $('pserv').value || null,
        sin_cargo: sc,
        lineas: lineas.filter(l => l.producto_id).map(l => ({ producto_id: l.producto_id, unidades: l.unidades || 1,
          importe: l.importe, descuento: l.descuento || 0, iva: l.iva })),
        op_id: 'p-' + Date.now()
      }});
      btn.disabled = false; btn.textContent = txt;
      if (error || (r && r.ok === false)) {
        toast(r && r.error === 'facturado' ? 'Ese pedido ya tiene factura: para cambiarlo, haz una rectificativa' : r && r.error === 'validado' ? 'Ese pedido ya no se puede editar'
          : 'No se ha podido guardar: ' + ((error && error.message) || 'sin permiso'), true);
        return;
      }
      if (cps && !(await camposGuardar(cps, (r && r.id) || (ped && ped.id)))) return;
      {   // v2.328.0: reportar al profesional solo si se marca (por defecto, no)
        const rid = (r && r.id) || (ped && ped.id), rep = !!($('prepprof') && $('prepprof').checked) && !$('zonapac').classList.contains('escentro');
        if (rid && (rep || (ped && ped.reportar_profesional))) {
          const { data: mr, error: me } = await db.rpc('marcar_reporte', { p_id: rid, p_valor: rep });
          if (me || (mr && mr.ok === false)) toast('El pedido se ha guardado, pero no se ha podido cambiar «Reportar»', true);
        }
      }
      if (justifs.length && !(await subirJustificantes((r && r.id) || (ped && ped.id), justifs))) return;
      $('dlg').close();
      if (o.alGuardar) { await o.alGuardar((r && r.id) || (ped && ped.id)); return; }   // v2.314.0
      toast(yaVal ? 'Pedido actualizado' : sc ? (estado === 'Borrador' ? 'Entrega sin cargo guardada en borrador' : 'Entrega sin cargo confirmada') : estado === 'Borrador' ? (esTransferencia($('ppago').value) ? 'Guardado en borrador hasta que llegue el pago' : 'Borrador guardado') : (medico ? 'Pedido confirmado y atribuido' : 'Pedido confirmado · pendiente de atribuir'));
      if (tpvSinMovil) toast(`Pedido confirmado. Sin móvil ${TT('paciente', 's', 'del', 'l', 'l')} no se puede enviar el enlace de pago: cóbralo como siempre`);   // v2.333.0
      if (estado === 'Borrador' && ped && ped.id) tpvAvisoImporte(ped.id);
      if (TAB === 'ventas') cargarVentas();
      if (TAB === 'pacientes') listaPacientes();
      if ($('ficha').open && FICHA_PAC) fichaPaciente(FICHA_PAC);
    };
    $('pborr').onclick = e => guardar('Borrador', e.target);
    $('psincargo').onchange = () => { leerForm(); lineas.forEach(l => { l.descuento = form.sin_cargo ? 100 : 0; }); pinta(); };   // v2.317.0
    $('ptrfmail').onclick = e => {   // v2.314.0: guarda en borrador y envía los datos de pago
      if (!contacto) { toast(`Elige ${TT('paciente', 's', 'el', 'l', 'l')} para enviarle los datos de pago`, true); return; }
      if (!((AJUSTES.empresa || {}).iban || '').trim()) { toast('Falta el IBAN: ponlo en Configuración → Facturación → Datos fiscales antes de enviar los datos de pago', true); return; }
      guardar('Borrador', e.target, { alGuardar: async id => { await enviarDatosPago(id); verPedido(id); if (TAB === 'ventas') cargarVentas(); } });
    };
    $('ptpvenv').onclick = async e => {   // v2.333.0: guarda en borrador y envía el enlace de pago
      if (!contacto) { toast(`Elige ${TT('paciente', 's', 'el', 'l', 'l')} para enviarle el enlace de pago`, true); return; }
      if (!await tpvMovilDe(contacto)) { toast(`${TT('paciente', 's', '', 'l', 'C')} no tiene móvil: añádelo en su ficha para enviarle el enlace de pago`, true); return; }
      guardar('Borrador', e.target, { alGuardar: tpvTrasGuardar });
    };
    $('pvalid').onclick = e => guardar('Confirmado', e.target);
    // Campos personalizados del pedido: se conservan al repintar
    if ((CAMPOS.pedido || []).some(c => c.en_ficha) && $('pnota')) {
      const poner = () => { if ($('dbody').querySelector('.cpersform')) return;
        $('pnota').insertAdjacentHTML('afterend', camposHTML('pedido', cpPed));
        $('dbody').querySelector('.cpersform').addEventListener('input', e => { const i = e.target.closest('[data-cpk]'); if (i) cpPed[i.dataset.cpk] = i.value; });
        $('dbody').querySelector('.cpersform').addEventListener('change', e => { const i = e.target.closest('[data-cpk]'); if (i) cpPed[i.dataset.cpk] = i.value; }); };
      if (cpPed) poner();
      else if (ped && ped.id) db.from('pedidos').select('clasificadores').eq('id', ped.id).maybeSingle().then(({ data }) => { cpPed = Object.assign({}, (data && data.clasificadores) || {}); poner(); });
      else { cpPed = {}; poner(); }
    }
  };
  let cpPed = null;
  pinta();
  $('dlg').showModal();
}

/* Parte base; verPedido le añade el resto */
async function verPedidoBaseBase(id) {
  cargando($('dbody'), 'Abriendo el pedido…');
  $('dlg').showModal();
  const { data, error } = await RPC_ORIG('pedido_detalle', { p_id: id });
  if (error || !data || !data.pedido) { $('dbody').innerHTML = `<div class="vacio">${esc(error ? error.message : 'No se ha encontrado el pedido.')}</div>`; return; }
  const p = data.pedido, l = data.lineas || [], c = data.contacto;
  const t = totalesPedido(l, +p.descuento || 0, p.descuento_tipo,
    { on: !!p.envio, con: r2(+p.envio_base * (1 + (+p.envio_iva || 0) / 100)), iva: +p.envio_iva || 0,
      nombre: ((SERVICIOS.find(x => x.id === p.servicio_id) || {}).nombre) || 'Envío' });
  const bor = p.estado === 'Borrador', anulado = p.estado === 'Anulado';

  $('dbody').innerHTML = `
    <div class="fh pdcab"><div class="pdcabt"><h2>Pedido${p.numero ? ' ' + esc(p.numero) : ''}</h2>${pillEstado(p.estado)}${pillCobroPed(p)}
      <span class="sm pdmeta">${fechaCorta(p.fecha)} · ${etiquetaCanal(p, t.total)}${p.forma_pago ? ' · ' + esc(p.forma_pago) : ''}</span></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    ${bor ? '<div class="cacheaviso" style="margin-top:10px">Borrador: todavía no cuenta en métricas ni en comisiones.</div>' : ''}
    ${c ? `<div class="blk"><h3>${TT('paciente', 's', '', 'l', 'C')}</h3><div><b>${esc(c.nombre)}</b></div>
      <div class="sm">${esc(c.telefono || c.movil || '')} ${esc(c.email || '')}</div>
      <div class="acts"><button class="btn sec" data-vpac="${c.id}">Ver ficha ${TT('paciente', 's', 'del', 'l', 'l')}</button></div></div>` : ''}
    ${data.medico ? `<div class="blk"><h3>${TT('medico', 's', '', 'l', 'C')}</h3><div><b>${esc(data.medico.nombre)}</b> <span class="sm">· código ${esc(data.medico.codigo)}</span></div>
      ${l[0] && l[0].comercial ? `<div class="sm">Comercial: ${esc(l[0].comercial)}</div>` : ''}</div>` : ''}
    <div class="blk"><h3>Líneas</h3>
      ${l.map(x => { const d = lineaDesglose(x); return `<div style="display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-top:1px solid var(--line)">
        <span><b>${esc(x.producto || 'Sin producto')}</b> · ${num(x.unidades)} uds.
          <div class="sm">Base ${eurI(d.base)}${+x.descuento ? ` (dto. ${num(x.descuento)}%)` : ''} · IVA ${num(x.iva || 0)}% ${eurI(d.iva)}</div></span>
        <b style="white-space:nowrap">${eurI(d.total)}</b></div>`; }).join('') || '<div class="sm">Sin líneas.</div>'}
      <div class="totbox">${bloqueTotales(t)}</div></div>
    ${p.nota ? `<div class="blk"><h3>Nota</h3><div>${esc(p.nota)}</div></div>` : ''}
    <div class="acts" style="justify-content:flex-end">
      ${puedeVentas() && bor ? `<button class="btn sec dang" id="pdborrar">Eliminar borrador</button>
        <button class="btn sec" id="pdeditar">Editar</button>
        <button class="btn" id="pdvalidar">Confirmar pedido</button>` : ''}
      ${puedeVentas() && !bor && !anulado ? (p.factura_id ? '<button class="btn sec" id="pdeditnf">Editar datos</button>' : '<button class="btn sec" id="pdeditar">Editar pedido</button>') : ''}
      ${puedeVentas() && !bor && !anulado ? '<button class="btn sec dang" id="pdanular">Anular pedido</button>' : ''}
      <button class="btn sec" data-cerrar>Cerrar</button></div>`;

  const vp = $('dbody').querySelector('[data-vpac]');
  if (vp) vp.onclick = () => { $('dlg').close(); fichaPaciente(vp.dataset.vpac); };
  if ($('pdeditar')) $('pdeditar').onclick = () => editorPedido(data);
  if ($('pdeditnf')) $('pdeditnf').onclick = () => editarPedidoNoFiscal(data);   // v2.307.0
  if ($('pdborrar')) $('pdborrar').onclick = async () => {
    if (!await preguntar('El borrador desaparece por completo.', { titulo: '¿Eliminar el borrador?', ok: 'Eliminar', peligro: true })) return;
    const { data: r, error: e } = await db.rpc('borrar_pedido', { p_id: id });
    if (e || (r && r.ok === false)) { toast(r && r.error === 'validado' ? 'Solo se pueden eliminar borradores' : 'No se ha podido eliminar', true); return; }
    $('dlg').close(); toast('Borrador eliminado'); if (TAB === 'ventas') cargarVentas();
  };
  if ($('pdvalidar')) $('pdvalidar').onclick = async e => {
    if (!await preguntar((e.target.dataset.pago ? 'Se anota el pago como recibido. ' : '') + 'Una vez confirmado, el pedido cuenta en métricas y comisiones y ya no se puede editar ni eliminar: solo anular.',
      { titulo: '¿Confirmar el pedido?', ok: 'Confirmar' })) return;
    e.target.disabled = true;
    const { data: r, error: er } = await db.rpc('guardar_pedido', { p: {
      id, estado: 'Confirmado', fecha: p.fecha, canal: p.canal, contacto_id: p.contacto_id, centro_id: p.centro_id,
      cuenta_id: data.medico ? data.medico.id : null, cuenta_texto: p.cuenta_texto, nota: p.nota, forma_pago: p.forma_pago, pago_referencia: p.pago_referencia || '',
      descuento: p.descuento || 0, descuento_tipo: p.descuento_tipo,
      envio: !!p.envio, envio_con_iva: p.envio ? r2(+p.envio_base * (1 + (+p.envio_iva || 0) / 100)) : 0, envio_iva: p.envio_iva, servicio_id: p.servicio_id,
      lineas: l.map(x => ({ producto_id: x.producto_id, unidades: x.unidades, importe: x.importe, descuento: x.descuento, iva: x.iva })) } });
    e.target.disabled = false;
    if (er || (r && r.ok === false)) { toast('No se ha podido confirmar: ' + ((er && er.message) || (r && r.error) || ''), true); return; }
    if (e.target.dataset.pago) await db.rpc('marcar_operativa', { p_pedido: id, p_campo: 'pago', p_hecho: true });   // v2.314.0
    toast(e.target.dataset.pago ? 'Pedido confirmado y cobrado' : 'Pedido confirmado'); verPedido(id); if (TAB === 'ventas') cargarVentas();
  };
  if ($('pdanular')) $('pdanular').onclick = async () => {
    const motivo = await pedirTexto('Motivo de la anulación (opcional)', '', { titulo: '¿Anular el pedido?', ok: 'Anular' });
    if (motivo === null) return;
    const { data: r, error: er } = await db.rpc('anular_pedido', { p_id: id, p_motivo: motivo || null });
    if (er || (r && r.ok === false)) { toast(r && r.error === 'facturado' ? 'Tiene factura: emite antes una rectificativa de toda la factura y marca «Anular también el pedido»' : 'No se ha podido anular: ' + ((er && er.message) || (r && r.error) || ''), true); return; }
    $('dlg').close(); toast('Pedido anulado'); if (TAB === 'ventas') cargarVentas();
  };
}

// Desde el pedido: la ficha del cliente se abre como panel encima, sin cerrar el pedido
async function verPedidoBase(...a) {
  const r = await verPedidoBaseBase.apply(this, a);
  const vp = $('dbody').querySelector('[data-vpac]');
  if (vp) vp.onclick = () => fichaPaciente(vp.dataset.vpac);
  return r;
}

// Aviso arriba si hay un cobro pendiente o la cuenta está en solo lectura
function pagoAvisoBase() {
  const e = PAGO_ESTADO || {}, pl = e.plan || {}; let el = $('pagoaviso');
  const msg = e.solo_lectura ? 'Tu empresa está en <b>solo lectura</b> porque hay un pago pendiente. Puedes consultar y exportar; para volver a trabajar, actualiza el pago.'
    : pl.estado === 'impago' ? 'No hemos podido cobrar tu suscripción. Actualiza el método de pago antes de 14 días para no quedarte en solo lectura.' : '';
  if (!msg) { if (el) el.remove(); return; }
  const main = document.querySelector('main'); if (!main) return;
  if (!el) { main.insertAdjacentHTML('afterbegin', '<div id="pagoaviso" class="banda-peligro" role="alert"></div>'); el = $('pagoaviso'); }
  el.innerHTML = msg + (puedeOrganizacion() ? ' <button type="button" class="btn sec" id="pgavbtn">Gestionar el pago</button>' : ' Avisa a quien gestiona la cuenta de tu empresa.');
  if ($('pgavbtn')) $('pgavbtn').onclick = ev => pagoPortal(ev.target);
}

// En los 7 últimos días de la prueba, aviso arriba (no tapa los de impago o solo lectura)
function pagoAviso(...a) {
  const r = pagoAvisoBase.apply(this, a);
  const pl = (PAGO_ESTADO || {}).plan || PLAN_ACTUAL || {}, n = diasHasta(pl.periodo_fin);
  let el = $('pruebaaviso');
  const ver = pl.en_prueba && !pl.baja_al_final && n != null && n >= 0 && n <= 7 && !$('pagoaviso') && puedeOrganizacion();
  if (!ver) { if (el) el.remove(); return r; }
  const main = document.querySelector('main'); if (!main) return r;
  if (!el) { main.insertAdjacentHTML('afterbegin', '<div id="pruebaaviso" class="banda-info" role="status"></div>'); el = $('pruebaaviso'); }
  el.innerHTML = `Tu prueba termina ${n === 0 ? 'hoy' : n === 1 ? 'mañana' : `en ${n} días`} (${fechaCorta(pl.periodo_fin)}): ese día se pasa el primer recibo.
    Revisa que tus datos de facturación están bien. <button type="button" class="btn sec" id="pruebaver">Revisar mis datos</button>`;
  $('pruebaver').onclick = () => ir('plan');
  return r;
}

async function editorPedido(pedido, ...a) {
  const ped = pedido && pedido.pedido ? pedido.pedido : null;
  PED_DIST = { on: !!(ped && ped.distribuidor_id), id: (ped && ped.distribuidor_id) || '', codigo: (ped && ped.distribuidor_codigo) || '',
    factura: ped && ped.distribuidor_id ? !!ped.factura_distribuidor : true };
  await cargarDistribuidores().catch(() => []);
  return editorPedidoBase.call(this, pedido, ...a);
}

function pkContarBase(els, fmt) {
  if (!pkMovimiento()) { els.forEach(el => el.textContent = fmt(+el.dataset.v, el)); return; }
  const t0 = performance.now();
  const paso = t => { const p = Math.min(1, (t - t0) / 900), e = 1 - Math.pow(1 - p, 3); els.forEach(el => { if (el.isConnected) el.textContent = fmt(+el.dataset.v * e, el); }); if (p < 1) requestAnimationFrame(paso); };
  requestAnimationFrame(paso);
}

function pkContar(els, fmt) {
  if (plYaContado('pk' + els.length, els.map(e => e.dataset.v))) { els.forEach(el => el.textContent = fmt(+el.dataset.v, el)); return; }
  return pkContarBase(els, fmt);
}

async function pintarDistribuidoresBase() {
  const c = $('cfgcuerpo'); if (!c) return;
  cargando(c, 'Cargando los distribuidores…');
  const { data, error } = await db.from('distribuidores').select('id,nombre,email,telefono,nota,activo').order('nombre');
  if (!$('cfgcuerpo') || CFG_KEY !== 'distribuidores') return;
  if (error) { c.innerHTML = `<div class="card"><p class="sm">No se han podido leer los distribuidores: ${esc(error.message)}</p></div>`; return; }
  DIS_TODOS = data || [];
  const fila = d => `<div class="ajfila disfila${d.activo ? '' : ' disoff'}" data-disid="${d.id}">
      <div><b>${esc(d.nombre)}${d.activo ? '' : ' <span class="pill">No se usa</span>'}</b>
        <span class="sm">${[d.email, d.telefono].filter(Boolean).map(esc).join(' · ') || 'Sin correo ni teléfono'}${d.nota ? ' · ' + esc(d.nota) : ''}</span></div>
      <div class="ajctl"><button type="button" class="btn sec" data-dised="${d.id}">Editar</button>
        <button type="button" class="btn sec" data-disact="${d.id}">${d.activo ? 'Dejar de usar' : 'Volver a usar'}</button></div></div>`;
  const act = DIS_TODOS.filter(d => d.activo), off = DIS_TODOS.filter(d => !d.activo);
  c.innerHTML = `<div class="card disw">
      <div class="discab"><p class="sm">Mayoristas o depósitos que sirven pedidos a vuestros clientes. Al hacer un pedido se elige si lo servís vosotros o uno de ellos; el suyo no descuenta stock de vuestro almacén.</p>
        <button type="button" class="btn" id="disnuevo">+ Nuevo distribuidor</button></div>
      ${DIS_TODOS.length ? act.map(fila).join('') + (off.length ? `<h3 class="dissub">Que ya no se usan</h3>` + off.map(fila).join('') : '')
        : '<p class="vacio" id="disvacio">Todavía no hay distribuidores.</p>'}</div>`;
  $('disnuevo').onclick = () => editarDistribuidor(null);
  c.querySelectorAll('[data-dised]').forEach(b => b.onclick = () => editarDistribuidor(DIS_TODOS.find(d => d.id === b.dataset.dised)));
  c.querySelectorAll('[data-disact]').forEach(b => b.onclick = async () => {
    const d = DIS_TODOS.find(x => x.id === b.dataset.disact); if (!d) return;
    if (d.activo && !await preguntar('No saldrá al hacer pedidos nuevos. Los pedidos que ya sirvió siguen diciendo que fue él.', { titulo: `¿Dejar de usar ${d.nombre}?`, ok: 'Dejar de usar' })) return;
    b.disabled = true;
    const { error } = await db.from('distribuidores').update({ activo: !d.activo }).eq('id', d.id);
    if (error) { b.disabled = false; toast('No se ha podido cambiar: ' + error.message, true); return; }
    toast(d.activo ? 'Ya no se usa' : 'Se vuelve a usar');
    await cargarDistribuidores(true).catch(() => []);
    pintarDistribuidores();
  });
}

// Distribuidores: los transfers de cada uno
async function pintarDistribuidores(...a) {
  const r = await pintarDistribuidoresBase.apply(this, a);
  const c = $('cfgcuerpo'); if (!c || CFG_KEY !== 'distribuidores') return r;
  c.querySelectorAll('.disfila[data-disid] .ajctl').forEach(x => {
    if (x.querySelector('[data-distrf]')) return;
    x.insertAdjacentHTML('afterbegin', `<button type="button" class="btn sec" data-distrf="${x.closest('.disfila').dataset.disid}">Transfers</button>`);
  });
  c.querySelectorAll('[data-distrf]').forEach(b => b.onclick = () => verTransfers(b.dataset.distrf));
  return r;
}

async function enviarDatosPagoBase(id) {
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

async function enviarDatosPago(id, ...a) {
  if (!await elegirPlantillaCorreo('pago')) return false;
  try { return await enviarDatosPagoBase.call(this, id, ...a); } finally { PLANT_ELEGIDA.pago = null; }
}
