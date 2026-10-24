// v2.117.0 · Al ir a una pantalla que no es una página propia (Perfil, Empresa, Plan), esas páginas se vacían: así nunca hay dos
// contenedores #cfgcuerpo a la vez (pasaba al ir de «Plan y suscripción» a Configuración)
const IR_V2117 = ir;
ir = function (t, ...a) {
  if (!(t in PAGINAS)) Object.keys(PAGINAS).forEach(o => { const v = $('v-' + o); if (v) v.innerHTML = ''; });
  return IR_V2117(t, ...a);
};




PAGINAS.organizacion = {
  t: 'Organización', d: 'Marca, correo, copias de seguridad, plan y facturación de la empresa', permiso: puedeOrganizacion,
  get tabs() {
    const fact = planIncluye('facturacion');
    return [['marca', 'Marca y logo', () => pintarMarca()], ['correo', 'Correo y firma', () => pintarCorreo()], ['copias', 'Copias de seguridad', () => pintarCopias()],
      ['plan', 'Plan y suscripción', () => pintarPaginaPlan()],
      ...(fact ? [['fiscal', 'Datos fiscales', facOrg(pintarEmpresa)], ['series', 'Series', facOrg(pintarSeries)], ['vf', 'VeriFactu', facOrg(pintarVerifactu)], ['pdf', 'Diseño del PDF', () => disenoPDF()]] : []),
      ...(puede('gestionar_plataforma') ? [['orgs', 'Organizaciones', () => pintarOrganizaciones()]] : [])];
  }
};
const IR_V2121 = ir;
ir = function (t, ...a) {
  if (t === 'empresa') { PAG_TAB.organizacion = PAG_TAB.empresa || 'marca'; t = 'organizacion'; }
  else if (t === 'plan') { PAG_TAB.organizacion = 'plan'; t = 'organizacion'; }
  else if (t === 'config' && ORG_DESDE[CFG_SEC]) { PAG_TAB.organizacion = ORG_DESDE[CFG_SUB] || ORG_DESDE[CFG_SEC]; CFG_SEC = 'rutas'; t = 'organizacion'; }
  if (t === 'organizacion' && !puedeOrganizacion()) t = 'inicio';
  return IR_V2121(t, ...a);
};
// Configuración, sin lo que ahora está en Organización
arbolConfig = (orig => function () {
  return orig().map(([g, l]) => [g, l.filter(x => !['fact', 'marca', 'correo', 'copias', 'orgs'].includes(x.k))]).filter(g => g[1].length);
})(arbolConfig);
mostrarApp = (orig => function (...a) { const r = orig(...a); menuOrganizacion(); return r; })(mostrarApp);
document.addEventListener('click', e => {
  const b = e.target.closest('[data-u="organizacion"]'); if (!b) return;
  e.stopImmediatePropagation(); e.preventDefault();
  document.querySelectorAll('.umenu, #umenu').forEach(m => m.classList.add('hide'));
  ir('organizacion');
}, true);

['dlg', 'dlg2'].forEach(id => {
  const d = $(id); if (!d) return;
  const modal = d.showModal.bind(d);
  d.showModal = function () {
    const area = areaEncaje();
    if (!area) return modal();
    // v2.129.0: los apartados que se pintan en la propia página (#dbody como panel) no abren ventana: antes quedaba abierta una
    // ventana vacía de 46 px (la barra blanca) que seguía abierta al cambiar de pantalla
    if (d.id === 'dlg' && typeof PANEL_ACTIVO !== 'undefined' && PANEL_ACTIVO && PANEL_ACTIVO.tipo === 'dbody') return;
    if (d.open) return;
    d.classList.add('encajada'); d.__area = area; d.__casa = d.__casa || d.parentNode;
    area.parentNode.insertBefore(d, area);
    area.classList.add('con-ventana');
    d.show(); colocarEncajada(d, area);
    // Al abrir, el navegador lleva la vista al primer campo: se vuelve arriba del área para ver su cabecera
    const tapa = () => Math.max(0, ...['body > header', 'header', '.top', 'nav.main'].map(q => { const e = document.querySelector(q); return e && getComputedStyle(e).position.match(/fixed|sticky/) ? e.getBoundingClientRect().bottom : 0; }));
    // v2.122.0: la ventana ocupa el sitio del apartado; solo se desplaza la página si su cabecera queda por encima de la vista
    const arriba = () => { const t = d.getBoundingClientRect().top; if (t < tapa()) scrollTo({ top: Math.max(0, t + scrollY - tapa() - 12) }); };
    arriba(); requestAnimationFrame(arriba);
    const f = d.querySelector('input:not([type=hidden]), select, textarea'); if (f) setTimeout(() => { f.focus({ preventScroll: true }); arriba(); }, 30);
  };
  const cerrar = d.close;
  d.close = function () { devolverEncajada(d); return cerrar.apply(this, arguments); };
  // Si un repintado borra el apartado con la ventana dentro, se recupera (cerrada) en <body>
  new MutationObserver(() => { if (d.__casa && !d.isConnected) { d.__casa.appendChild(d); if (d.open) d.close(); } }).observe(document.body, { childList: true, subtree: true });
  d.addEventListener('close', () => {
    // v2.275.0: si la ventana ya se ha vuelto a abrir (cerrar y abrir otra seguida, como «Borrar usuario» desde su ficha), el aviso
    // de cierre llega tarde y deshacía su sitio: quedaba suelta al final de la página, fuera de la vista
    if (d.open) return;
    devolverEncajada(d); delete d.dataset.fija;
    if (!d.classList.contains('encajada')) return;
    d.classList.remove('encajada'); d.removeAttribute('style');
    const area = d.__area; d.__area = null;
    // El apartado vuelve a verse si ya no queda ninguna otra ventana encajada encima de él
    if (area && !document.querySelector('dialog.encajada[open]')) { area.classList.remove('con-ventana'); area.style.minHeight = ''; }
  });
});
// Escape cierra la de arriba; cambiar de apartado, de pestaña o de pantalla las cierra
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const d = ['dlg2', 'dlg'].map(id => $(id)).find(x => x && x.open && x.classList.contains('encajada'));
  // v2.124.0: lo que forma parte de la página (el diseño del PDF en su pestaña) no se cierra con Escape
  if (d && !d.dataset.fija) { e.preventDefault(); d.close(); }
});
document.addEventListener('click', e => { if (e.target.closest('.cfgnav [data-cfg], .cfuidx [data-ck], .pagtabs [data-ptab], #cfgsubs button, nav.main [data-t], #bnav [data-t], [data-u]')) cerrarEncajadas(); }, true);
const IR_ENCAJE = ir;
ir = function (...a) { cerrarEncajadas(); return IR_ENCAJE(...a); };
addEventListener('resize', () => ['dlg', 'dlg2'].forEach(id => { const d = $(id); if (d && d.open && d.__area) { if (innerWidth < ENCAJE_MIN) d.close(); else colocarEncajada(d, d.__area); } }));
// Si la app ya estaba a la vista al cargar este bloque (arranque con el perfil guardado), el menú se ajusta igualmente
if (typeof PERFIL !== 'undefined' && PERFIL) menuOrganizacion();
cargarAjustes = (orig => async function (...a) { const r = await orig(...a); if (PERFIL) menuOrganizacion(); return r; })(cargarAjustes);


const CAMPO_TXT = { nombre: 'Nombre', estado_comercial: 'Estado', get especialidad() { return TT('especialidad', 's', '', 'l', 'C'); }, area: 'Área', telefono: 'Teléfono', movil: 'Móvil', email: 'Email',
  direccion: 'Dirección', cp: 'Código postal', municipio: 'Población', provincia: 'Provincia', nota: 'Nota', urgente: 'Urgente', centro_nombre: 'Centro',
  dias: 'Horario', principal: 'Principal', nif: 'DNI / CIF', cuenta_id: TT('medico', 's', '', 'l', 'C'), codigo: 'Código', precio: 'Precio', estado: 'Estado',
  sin_reporting: 'Sin reporting', clasificadores: 'Campos propios', planta: 'Planta', sala: 'Sala', indicaciones: 'Cómo llegar', lat: 'Latitud', lon: 'Longitud' };
abrirFicha = (orig => async function (id, ...a) { const r = await orig.call(this, id, ...a); fichaHistorial(id); return r; })(abrirFicha);



editorLlamada = editorOportunidad;

pintarLlamadas = async function () {
  await catOportunidades();
  $('vcuerpo').innerHTML = `<div class="panel">
    <div id="llsegz"></div>
    <div class="filtros"><div id="llper"></div>
      <div><label for="llq">Buscar</label><input id="llq" type="search" placeholder="Cliente, teléfono o ${TT('medico', 's', '', 'l', 'l')}"></div>
      <div><label for="llfres">Resultado</label><select id="llfres"><option value="">Todos</option><option>Sin cerrar</option>${(CAT.resultado_llamada || []).map(x => `<option>${esc(x.valor)}</option>`).join('')}</select></div></div>
    <div class="kpis vtot" id="lltot"></div>
    <div class="angrid" id="llres2" style="margin:0 0 14px"></div>
    <div id="lllista"></div></div>`;
  let tq;
  const segs = async () => {
    const { data: seg } = await RPC_ORIG('llamadas_seguimiento', {});
    const l = seg || [], hoy = hoyISO();
    if (!$('llsegz')) return;
    $('llsegz').innerHTML = !l.length ? '' : `<div class="card" id="llsegs"><h2>Volver a llamar<span class="n">${l.length}</span></h2>
      <p class="sm" style="padding:0 16px">Clientes que no compraron y a los que quedaste en volver a llamar.</p>
      <div class="lista">${l.slice(0, 20).map(x => `<div class="item" style="cursor:default">
        <span class="ic" style="${x.proxima_fecha < hoy ? 'background:#FDECEC;color:var(--dang)' : x.proxima_fecha === hoy ? 'background:#FFF4E5;color:var(--warn)' : ''}">📞</span>
        <span class="tx"><b>${esc(x.cliente || x.nombre || 'Sin nombre')}</b>
          <span class="sm">${x.proxima_fecha < hoy ? '<b style="color:var(--dang)">Atrasada · </b>' : x.proxima_fecha === hoy ? '<b style="color:var(--warn)">Hoy · </b>' : fechaCorta(x.proxima_fecha) + ' · '}${esc(x.resultado || '')}${x.proxima_accion ? ' · ' + esc(x.proxima_accion) : ''}${x.medico ? ' · de ' + esc(x.medico) : ''}</span></span>
        <span class="acts" style="margin:0;flex-wrap:nowrap">${(x.tel_cliente || x.telefono) ? `<a class="btn sec chico" href="tel:${esc(x.tel_cliente || x.telefono)}">Llamar</a>` : ''}
          <button class="btn chico" data-llseg="${x.id}">Registrar</button><button class="btn sec chico" data-llok="${x.id}" title="Ya no hace falta">✓</button></span></div>`).join('')}</div></div>`;
    $('llsegz').querySelectorAll('[data-llseg]').forEach(b => b.onclick = async () => {
      const x = l.find(y => y.id === b.dataset.llseg);
      const { data: an } = await db.from('llamadas').select('interes').eq('id', x.id).maybeSingle();
      editorOportunidad({ contacto_id: x.contacto_id, cliente: x.cliente, nombre: x.nombre, telefono: x.telefono, tel_cliente: x.tel_cliente, cuenta_id: x.cuenta_id, medico: x.medico,
        motivo: 'Seguimiento de televenta', origen: 'Llamada saliente', interes: (an && an.interes) || [] }, x);
    });
    $('llsegz').querySelectorAll('[data-llok]').forEach(b => b.onclick = async () => { await db.rpc('marcar_seguimiento', { p_id: b.dataset.llok, p_hecho: true }); toast('Seguimiento cerrado'); segs(); });
  };
  const pinta = async () => {
    const r = $('llper').__rango();
    const [{ data: l }, { data: s }] = await Promise.all([
      db.rpc('llamadas_lista', { p_desde: r.desde, p_hasta: r.hasta, q: $('llq').value.trim() || null, p_resultado: $('llfres').value || null }),
      db.rpc('llamadas_resumen', { p_desde: r.desde, p_hasta: r.hasta })]);
    if (!$('lllista')) return;
    const res = s || {}, lista = l || [], cerradas = (res.total || 0) - (res.sin_cerrar || 0);
    $('lltot').innerHTML = `<div class="kpi"><b>${num(res.total || 0)}</b><span>Oportunidades</span></div>
      <div class="kpi"><b>${num(res.con_pedido || 0)}</b><span>Acaban en pedido</span></div>
      <div class="kpi"><b>${cerradas ? Math.round((res.con_pedido || 0) / cerradas * 100) + '%' : '—'}</b><span>Conversión</span></div>
      <div class="kpi"><b>${eurI(res.importe_ganado || 0)}</b><span>Vendido</span></div>
      <div class="kpi"><b>${eurI(res.importe_perdido || 0)}</b><span>Sin vender</span></div>
      <div class="kpi"><b>${num(res.sin_cerrar || 0)}</b><span>Sin cerrar</span></div>`;
    // v2.127.0: la barra es el total (azul suave) y dentro, en azul, la parte que acaba en pedido; el texto dice «ganadas de total»
    const ratio = (x, i, max) => `<div class="bh bhr"><span class="bhn">${esc(x.n)}</span><span class="bhb" title="${num(x.p)} de ${num(x.t)} acaban en pedido"><i style="width:${Math.max(3, x.t / max * 100)}%"><em style="width:${x.t ? Math.round(x.p / x.t * 100) : 0}%"></em></i></span><b>${num(x.p)}<span>/${num(x.t)}</span></b></div>`;
    const barrasR = items => { const max = Math.max(1, ...items.map(x => x.t)); return `<div class="barrash">${items.map((x, i) => ratio(x, i, max)).join('')}</div>`; };
    const card = (id, t, cuerpo, leer) => `<div class="card ancard" id="${id}"><h2>${t}</h2>${cuerpo}<p class="leer">${leer}</p></div>`;
    $('llres2').innerHTML =
      card('llgprod', 'Qué piden', (res.por_producto || []).length ? barrasR(res.por_producto.map(x => ({ n: x.producto, p: +x.unidades_ganadas || 0, t: +x.unidades || 0 })))
        : vacioGrafico('Apunta qué producto y cuántas unidades quiere cada cliente.'),
        '<b>Cómo leerlo:</b> unidades vendidas sobre las que pidieron. Mucha diferencia en un producto señala precio, stock o argumentario.') +
      card('llgres', 'Cómo terminan', (res.por_resultado || []).length ? barrasH(res.por_resultado.map(x => ({ n: x.resultado, v: x.n })), num) : vacioGrafico('Aparecerá con las primeras oportunidades.'),
        '<b>Cómo leerlo:</b> si pesan «El precio no le convence» o «Solo quería información», conviene revisar el argumentario o las condiciones.') +
      card('llghora', 'A qué hora', (res.por_hora || []).length ? barrasR(res.por_hora.map(x => ({ n: `${String(x.hora).padStart(2, '0')}:00`, p: x.pedidos, t: x.n }))) : vacioGrafico('Verás en qué horas llegan y cuáles venden más.'),
        '<b>Para qué sirve:</b> poner más gente al teléfono en las horas con más oportunidades.') +
      card('llgdia', 'Qué día', (res.por_dia || []).length ? barrasR(res.por_dia.map(x => ({ n: NV_DIA_TXT[x.dia] || '', p: x.pedidos, t: x.n }))) : vacioGrafico('Verás qué días de la semana llegan más.'),
        '<b>Cómo leerlo:</b> pedidos sobre oportunidades de cada día de la semana.') +
      card('llgori', 'Cómo llegan', (res.por_origen || []).length ? barrasR(res.por_origen.map(x => ({ n: x.origen, p: x.pedidos, t: x.n }))) : vacioGrafico('Marca en cada venta cómo llegó el cliente.'),
        '<b>Cómo leerlo:</b> pedidos sobre oportunidades por canal: dónde merece la pena invertir.') +
      card('llgmed', `Por ${TT('medico', 's', '', 'l', 'l')} de referencia`, (res.por_medico || []).length ? barrasR(res.por_medico.map(x => ({ n: x.medico, p: x.pedidos, t: x.n }))) : vacioGrafico(`Verás qué ${TT('medico', 'p', '', 'l', 'l')} y centros mandan clientes.`),
        `<b>Cómo leerlo:</b> ${TT('medico', 's', 'un', 'C', 'l')} con muchas oportunidades y pocos pedidos es una oportunidad de seguimiento.`) +
      card('llcom', `Por comercial ${TT('medico', 's', 'del', 'l', 'l')}`, (res.por_comercial || []).length ? barrasR(res.por_comercial.map(x => ({ n: x.comercial, p: x.pedidos, t: x.n }))) : vacioGrafico(`Aparecerá cuando las oportunidades tengan ${TT('medico', 's', '', 'l', 'l')} de referencia.`),
        `<b>Cómo leerlo:</b> el volumen que genera el trabajo de cada zona.`);
    const tamL = tamPagina(); LLPAG = Math.min(LLPAG, Math.max(0, Math.ceil(lista.length / tamL) - 1));
    const lvis = lista.slice(LLPAG * tamL, LLPAG * tamL + tamL);
    const interes = x => (x.interes || []).map(y => `${y.producto} × ${num(y.unidades)}`).join(', ');
    $('lllista').innerHTML = lista.length ? `<div class="dgrid-wrap"><div class="dgrid llam opor">
      <div class="dh"><span>Fecha</span><span>Cliente</span><span>Qué quiere</span><span>${TT('medico', 's', '', 'l', 'C')}</span><span>Cómo termina</span><span>Próximo paso</span><span>Atendió</span></div>
      ${lvis.map(x => `<button class="dr" data-ll="${x.id}"><span>${new Date(x.fecha).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}<span class="sm">${esc(x.origen || x.direccion || '')}</span></span>
        <span><b>${esc(x.cliente || x.nombre || '—')}</b><span class="sm">${esc(x.tel_cliente || x.telefono || '')}</span></span>
        <span class="corta">${esc(interes(x) || '—')}${x.importe_estimado ? `<span class="sm">${eurI(x.importe_estimado)}</span>` : ''}</span>
        <span class="corta">${esc(x.medico || x.cuenta_texto || '—')}</span>
        <span>${x.pedido_id || x.resultado ? esc(x.resultado || 'Pedido hecho') : '<span class="pill p-warn">Sin cerrar</span>'}${x.pedido ? `<span class="sm">Pedido ${esc(x.pedido)}</span>` : ''}</span>
        <span class="sm">${x.proxima_fecha ? fechaCorta(x.proxima_fecha) + ' · ' : ''}${esc(x.proxima_accion || '')}</span><span class="sm">${esc(x.usuario || '')}</span></button>`).join('')}</div></div>`
      : '<div class="vacio">Sin oportunidades en este periodo. Empieza con «+ Nueva venta»: queda registrada aunque no acabe en pedido.</div>';
    $('lllista').querySelectorAll('[data-ll]').forEach(b => b.onclick = () => editorOportunidad(lista.find(x => x.id === b.dataset.ll)));
    $('lllista').insertAdjacentHTML('beforeend', '<div id="llpag"></div>');
    paginador($('llpag'), lista.length, LLPAG, p => { LLPAG = p; pinta(); }, () => { LLPAG = 0; pinta(); });
  };
  montarPeriodo($('llper'), { id: 'llamadas', valor: 'mes', alCambiar: pinta });
  $('llq').oninput = () => { clearTimeout(tq); tq = setTimeout(pinta, 300); };
  $('llfres').onchange = pinta;
  segs(); pinta();
};






abrirFicha = (orig => async function (id, ...a) { const r = await orig.call(this, id, ...a); fichaPortal(id); return r; })(abrirFicha);

arbolConfig = (orig => function () {
  const g = orig();
  if (puede('administrar') && hayExtra('portal')) {
    const it = { k: 'portal', ic: 'stethoscope', t: `Portal ${TT('medico', 's', 'del', 'l', 'l')}`, d: 'Material que pueden pedir', r: pintarCfgPortal };
    const datos = g.find(x => x[0] === 'Datos');
    if (datos) datos[1].push(it); else g.push(['Datos', [it]]);
  }
  return g;
})(arbolConfig);


