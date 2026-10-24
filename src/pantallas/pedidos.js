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
