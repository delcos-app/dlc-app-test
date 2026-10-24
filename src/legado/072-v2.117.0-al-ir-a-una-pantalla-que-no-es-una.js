// v2.117.0 · Al ir a una pantalla que no es una página propia (Perfil, Empresa, Plan), esas páginas se vacían: así nunca hay dos
// contenedores #cfgcuerpo a la vez (pasaba al ir de «Plan y suscripción» a Configuración)
const IR_V2117 = ir;
ir = function (t, ...a) {
  if (!(t in PAGINAS)) Object.keys(PAGINAS).forEach(o => { const v = $('v-' + o); if (v) v.innerHTML = ''; });
  return IR_V2117(t, ...a);
};


let LL_ALTA = { motivo: '', resultado: '' };


/* v2.121.0 · Página «Organización» (menú de usuario, arriba): marca, correo, copias, plan y facturación de la empresa, solo para el
   Propietario (configurar_organizacion) y el Administrador de la plataforma (gestionar_plataforma). Empresa y Plan pasan a ser
   pestañas suyas; Configuración se queda con lo del día a día. Y en escritorio, las ventanas de Configuración y de estas páginas
   se abren dentro del área de contenido, no por encima. */
// Las pestañas de facturación usan #fcuerpo, como el módulo Facturación: su pantalla se vacía para no tener dos (se rehace al volver)
const facOrg = fn => () => { const v = $('v-facturacion'); if (v) v.innerHTML = ''; fac(fn)(); };
const puedeOrganizacion = () => puede('configurar_organizacion') || puede('gestionar_plataforma');
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
// Empresa y Plan (y los apartados de Configuración que se han movido) llevan a su pestaña de Organización
const ORG_DESDE = { marca: 'marca', correo: 'correo', copias: 'copias', __empresa: 'marca', empresa: 'marca', plan: 'plan', fact: 'fiscal', fiscal: 'fiscal',
  series: 'series', vf: 'vf', pdf: 'pdf', orgs: 'orgs' };
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

// Ventanas integradas: en escritorio, dentro de Configuración y de las páginas propias, una ventana ocupa el área de contenido
// (sin fondo oscuro ni ventana flotante); al cerrarla vuelve el apartado. En el móvil las ventanas ya ocupan la pantalla.
const ENCAJE_MIN = 900;
function areaEncaje() {
  if (innerWidth < ENCAJE_MIN) return null;
  if (TAB === 'config') return $('cfgcuerpo-hub') || $('cfgcuerpo');
  if (PAGINAS[TAB]) return document.querySelector(`#v-${TAB} .pagcuerpo`) || $('cfgcuerpo');
  return null;
}
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
const cerrarEncajadas = () => ['dlg2', 'dlg'].forEach(id => { const d = $(id); if (d && d.open && d.classList.contains('encajada')) d.close(); });
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


/* v2.123.0 · Historial de cambios y deshacer (administración). La base guarda cada cambio con su valor de antes; aquí se ve por
   ficha y se deshace: un cambio, o todo lo que una persona cambió desde una fecha. Solo fichas, consultas, clientes, productos y
   rutas (pedidos, facturas, usuarios y cartera tienen efectos en stock, facturación, comisiones o permisos). */
const DESHACIBLES = ['cuentas', 'ubicaciones', 'contactos', 'productos', 'rutas'];
const deshacible = a => DESHACIBLES.includes(a.entidad) && ['Edición', 'Baja'].includes(a.accion);
const CAMPO_TXT = { nombre: 'Nombre', estado_comercial: 'Estado', get especialidad() { return TT('especialidad', 's', '', 'l', 'C'); }, area: 'Área', telefono: 'Teléfono', movil: 'Móvil', email: 'Email',
  direccion: 'Dirección', cp: 'Código postal', municipio: 'Población', provincia: 'Provincia', nota: 'Nota', urgente: 'Urgente', centro_nombre: 'Centro',
  dias: 'Horario', principal: 'Principal', nif: 'DNI / CIF', cuenta_id: TT('medico', 's', '', 'l', 'C'), codigo: 'Código', precio: 'Precio', estado: 'Estado',
  sin_reporting: 'Sin reporting', clasificadores: 'Campos propios', planta: 'Planta', sala: 'Sala', indicaciones: 'Cómo llegar', lat: 'Latitud', lon: 'Longitud' };
const campoTxt = k => CAMPO_TXT[k] || (k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, ' '));
const MOTIVO_DESHACER = { permiso: 'No tienes permiso', no_existe: 'Ese cambio ya no está en el registro', no_deshacible: 'Ese tipo de cambio no se puede deshacer',
  ya_no_existe: 'El registro ya no existe', ya_existe: 'Ya estaba recuperado' };
abrirFicha = (orig => async function (id, ...a) { const r = await orig.call(this, id, ...a); fichaHistorial(id); return r; })(abrirFicha);


const NV_DIAS = [['Mañana', 1], ['En 3 días', 3], ['En una semana', 7], ['En un mes', 30]];
const nvLinea = (pid, u) => { const p = PRODUCTOS.find(x => x.id === pid) || {}; return p.precio != null ? r2(p.precio * (1 + (+p.iva || 0) / 100) * (+u || 0)) : 0; };

editorLlamada = editorOportunidad;

// Pestaña «Oportunidades» (antes «Llamadas»): volver a llamar, métricas y lista
const NV_DIA_TXT = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
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



/* v2.126.0 · Portal del médico (extra «Portal» de la organización). En «Mi informe», además: la constancia de sus pacientes solo en
   cifras (sin ninguna fila por paciente), pedir material de lo que la empresa permite y escribir dudas a su comercial. En la ficha,
   quien la lleva entrega el material y contesta. En Configuración → Portal del médico, qué material se puede pedir y cuánto. */
// v2.242.0: aquí iba la primera versión de hayExtra (se redefine entera más abajo)
const MOTIVO_PORTAL = { permiso: 'No tienes permiso', extra: 'Tu empresa no tiene el portal activado', material: 'Ese material ya no se puede pedir',
  cantidad: 'Esa cantidad supera el máximo', vacio: 'Escribe el mensaje', cerrada: 'Ya estaba cerrado', no_existe: 'Ya no existe' };
const motivoPortal = r => MOTIVO_PORTAL[(r && r.motivo) || ''] || 'No se ha podido hacer';
const horaCorta = f => new Date(f).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const pillMaterial = e => `<span class="pill ${e === 'Pendiente' ? 'p-warn' : e === 'Entregado' ? 'p-est' : 'p-anu'}">${esc(e)}</span>`;


// ——— Lado del médico ———
async function portalMedico() {
  // Al arrancar, «Mi informe» se pinta antes de leerse el final de este archivo y antes de tener el plan: se espera a los dos
  try { void MOTIVO_PORTAL; void PLAN_ACTUAL; } catch (e) { setTimeout(portalMedico, 300); return; }
  if (!('estado' in PLAN_ACTUAL)) { const { data } = await RPC_ORIG('plan_uso', {}); if (data && data.plan) PLAN_ACTUAL = data.plan; }
  if (!ES_MEDICO() || !hayExtra('portal') || !$('v-informe')) return;
  let caja = $('mdportal');
  if (!caja) { $('v-informe').insertAdjacentHTML('beforeend', '<div id="mdportal" class="angrid"></div>'); caja = $('mdportal'); }
  const [{ data: c }, { data: perm }, { data: sols }, { data: msgs }] = await Promise.all([
    puede('portal_centro') ? Promise.resolve({ data: null }) : RPC_ORIG('constancia_pacientes', { p_meses: 12 }), RPC_ORIG('portal_material_permitido', {}),
    db.from('solicitudes_material').select('id,material,cantidad,nota,estado,creado_en,cerrado_en').order('creado_en', { ascending: false }).limit(20),
    db.from('mensajes_cuenta').select('id,texto,del_portal,creado_en,leido_en').order('creado_en', { ascending: true }).limit(200)]);
  caja = $('mdportal'); if (!caja) return;   // v2.318.0: si se ha vuelto a pintar mientras llegaban los datos, la caja de ahora
  const pac = TT('paciente', 'p', '', 'l', 'l'), k = c || {};
  const pct = (a, b) => b ? Math.round(a / b * 100) + '%' : '—';
  const constancia = !k.ok ? '<div class="sm">No disponible.</div>' : k.pocos
    ? `<p class="sm" style="padding:0 16px">En los últimos ${num(k.meses || 12)} meses han empezado ${num(k.empezaron)} ${pac}. A partir de ${num(k.minimo || 5)} verás aquí su constancia (con menos no se muestra, para que nadie pueda reconocerlos).</p>`
    : `<div class="minis cons">
        <div><b>${num(k.empezaron)}</b><span>empezaron</span></div>
        <div><b>${pct(k.repiten, k.empezaron)}</b><span>repiten (${num(k.repiten)})</span></div>
        <div><b>${k.dias_entre ? num(k.dias_entre) + ' días' : '—'}</b><span>entre pedidos</span></div>
        <div><b>${num(k.dejaron)}</b><span>lo dejaron tras el primero</span></div>
        <div><b>${num(k.sin_pedir)}</b><span>llevan más de 60 días sin pedir</span></div></div>
      ${(k.por_producto || []).length ? barrasH(k.por_producto.map(x => ({ n: x.producto, v: Math.round(x.repiten / x.pacientes * 100) })), v => v + '% repiten') : ''}`;
  const lp = Array.isArray(perm) ? perm : [];
  const ls = sols || [], lm = msgs || [];
  caja.innerHTML = `
    <div class="card ancard ancha" id="mdcons"><h2>Continuidad de las ${TT('pauta', 'p', '', 'l', 'l')}</h2>${constancia}
      <p class="leer">En los últimos 12 meses: cuántas ${TT('pauta', 'p', '', 'l', 'l')} han empezado, qué parte se ha repetido y cada cuántos días.</p></div>
    <div class="card ancard" id="mdmat"><h2>Pedir material</h2>
      ${lp.length ? `<div class="g2"><div><label for="mdmatm">Material</label><select id="mdmatm">${lp.map(x => `<option value="${esc(x.valor)}" data-max="${x.max}">${esc(x.valor)}</option>`).join('')}</select></div>
        <div><label for="mdmatn">Cantidad</label><input id="mdmatn" type="number" min="1" value="1"><span class="sm" id="mdmatmax">Máximo ${num(lp[0].max)} por petición</span></div></div>
        <label for="mdmatt">Nota para tu comercial</label><input id="mdmatt" placeholder="Opcional">
        <div class="acts" style="justify-content:flex-start"><button type="button" class="btn" id="mdmatok">Pedir</button></div>`
      : '<p class="sm" style="padding:0 16px">Tu empresa todavía no ofrece material para pedir.</p>'}
      ${ls.length ? `<div class="lista" id="mdmatl">${ls.map(x => `<div class="item" style="cursor:default"><span class="tx"><b>${num(x.cantidad)} × ${esc(x.material)}</b>
          <span class="sm">${horaCorta(x.creado_en)}${x.nota ? ' · ' + esc(x.nota) : ''}</span></span>${pillMaterial(x.estado)}
          ${x.estado === 'Pendiente' ? `<button type="button" class="btn sec chico" data-mdanu="${x.id}">Anular</button>` : ''}</div>`).join('')}</div>` : ''}</div>
    <div class="card ancard" id="mdmsg"><h2>Dudas a tu comercial</h2>
      <div id="mdhilo">${hiloMensajes(lm, true)}</div>
      <textarea id="mdmsgt" rows="2" placeholder="Escribe tu duda" aria-label="Tu mensaje"></textarea>
      <div class="acts" style="justify-content:flex-start"><button type="button" class="btn" id="mdmsgok">Enviar</button></div></div>`;
  if (puede('portal_centro') && $('mdcons')) $('mdcons').remove();
  // v2.277.0: sin máximo en el campo (rebajaba en silencio lo escrito); en cuanto lo escrito pasa del máximo, el aviso se pone en rojo
  const mdMatAviso = () => {
    const w = $('mdmatmax'), o = $('mdmatm') && $('mdmatm').selectedOptions[0]; if (!w || !o) return;
    const m = +o.dataset.max, n = +$('mdmatn').value || 0;
    w.classList.toggle('mdmatpasa', n > m); w.textContent = (n > m ? 'Como máximo ' : 'Máximo ') + num(m) + ' por petición';
  };
  if ($('mdmatm')) $('mdmatm').onchange = mdMatAviso;
  if ($('mdmatn')) $('mdmatn').addEventListener('input', mdMatAviso);
  if ($('mdmatok')) $('mdmatok').onclick = async ev => {
    ev.target.disabled = true;
    const mx = +$('mdmatm').selectedOptions[0].dataset.max, n = +$('mdmatn').value || 0;
    if (n < 1 || n > mx) { ev.target.disabled = false; mdMatAviso(); toast(n < 1 ? 'Indica cuántos necesitas' : `Como máximo ${num(mx)} por petición: pide ${num(mx)} o escribe en la nota cuántos necesitas`, true); return; }
    const { data: r } = await db.rpc('pedir_material', { p_material: $('mdmatm').value, p_cantidad: n, p_nota: $('mdmatt').value.trim() || null });
    ev.target.disabled = false;
    if (!r || !r.ok) { toast(r && r.motivo === 'cantidad' ? `Como máximo ${num(r.max)}` : motivoPortal(r), true); return; }
    toast('Pedido enviado a tu comercial'); portalMedico();
  };
  caja.querySelectorAll('[data-mdanu]').forEach(b => b.onclick = async () => {
    const { data: r } = await db.rpc('cerrar_material', { p_id: b.dataset.mdanu, p_estado: 'Anulado' });
    if (!r || !r.ok) { toast(motivoPortal(r), true); return; }
    toast('Pedido de material anulado'); portalMedico();
  });
  if ($('mdmsgok')) $('mdmsgok').onclick = async ev => {
    const t = $('mdmsgt').value.trim(); if (!t) { toast('Escribe el mensaje', true); return; }
    ev.target.disabled = true;
    const { data: r } = await db.rpc('enviar_mensaje_cuenta', { p_cuenta: null, p_texto: t });
    ev.target.disabled = false;
    if (!r || !r.ok) { toast(motivoPortal(r), true); return; }
    toast('Mensaje enviado'); portalMedico();
  };
  if (lm.some(x => !x.del_portal && !x.leido_en)) RPC_ORIG('leer_mensajes_cuenta', { p_cuenta: null });
}

abrirFicha = (orig => async function (id, ...a) { const r = await orig.call(this, id, ...a); fichaPortal(id); return r; })(abrirFicha);

// ——— Configuración: qué material se puede pedir y cuánto ———
async function pintarCfgPortal() {
  const c = $('cfgcuerpo'); if (!c) return;
  c.innerHTML = `<div class="card">${skelCard('Cargando…')}</div>`;
  const [{ data: cat }, { data: perm }, { data: aj }] = await Promise.all([
    db.rpc('catalogo_papel', { p_papel: 'material_visita' }), RPC_ORIG('portal_material_permitido', {}),
    db.from('ajustes').select('valor').eq('clave', 'portal').maybeSingle()]);
  if (!$('cfgcuerpo')) return;
  const l = cat || [], p = Array.isArray(perm) ? perm : [], conAjuste = !!(aj && aj.valor && aj.valor.material);
  const de = v => p.find(x => x.valor === v);
  c.innerHTML = `<div class="card"><div class="fh"><div><h2>Portal ${TT('medico', 's', 'del', 'l', 'l')}</h2>
      <div class="sm">Qué material pueden pedir ${TT('medico', 'p', 'el', 'l', 'l')} desde su portal y cuánto como máximo cada vez. Les llega a su comercial.</div></div></div>
    ${l.length ? `<div class="lista" id="cfpmat">${l.map(x => { const d = de(x.valor); return `<label class="item" style="cursor:default">
        <input type="checkbox" data-cfpm="${esc(x.valor)}" ${d ? 'checked' : ''}> <span class="tx"><b>${esc(x.valor)}</b></span>
        <span class="sm">Máximo</span> <input type="number" min="1" max="1000" value="${d ? d.max : 20}" data-cfpx="${esc(x.valor)}" style="max-width:110px" aria-label="Máximo de ${esc(x.valor)}"></label>`; }).join('')}</div>
      ${conAjuste ? '' : '<p class="sm" style="padding:0 16px">Ahora mismo se puede pedir todo el material, hasta 20 de cada. Guarda para decidirlo tú.</p>'}
      <div class="acts" style="justify-content:flex-end"><button class="btn" id="cfpok">Guardar</button></div>`
      : '<div class="vacio">No hay material en el catálogo «Material comercial entregado». Añádelo en Clasificadores.</div>'}</div>`;
  if ($('cfpok')) $('cfpok').onclick = async () => {
    const material = [...c.querySelectorAll('[data-cfpm]')].filter(x => x.checked)
      .map(x => ({ valor: x.dataset.cfpm, max: Math.max(1, Math.min(1000, +c.querySelector(`[data-cfpx="${CSS.escape(x.dataset.cfpm)}"]`).value || 20)) }));
    const { data: r, error } = await db.rpc('guardar_ajuste', { p_clave: 'portal', p_valor: Object.assign({}, (aj && aj.valor) || {}, { material }) });   // v2.284.0: sin borrar el resto del ajuste
    if (error || (r && r.ok === false)) { toast('No se ha podido guardar', true); return; }
    toast('Guardado'); pintarCfgPortal();
  };
}
arbolConfig = (orig => function () {
  const g = orig();
  if (puede('administrar') && hayExtra('portal')) {
    const it = { k: 'portal', ic: 'stethoscope', t: `Portal ${TT('medico', 's', 'del', 'l', 'l')}`, d: 'Material que pueden pedir', r: pintarCfgPortal };
    const datos = g.find(x => x[0] === 'Datos');
    if (datos) datos[1].push(it); else g.push(['Datos', [it]]);
  }
  return g;
})(arbolConfig);


