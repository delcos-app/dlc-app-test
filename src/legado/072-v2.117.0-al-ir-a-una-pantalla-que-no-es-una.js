// v2.117.0 · Al ir a una pantalla que no es una página propia (Perfil, Empresa, Plan), esas páginas se vacían: así nunca hay dos
// contenedores #cfgcuerpo a la vez (pasaba al ir de «Plan y suscripción» a Configuración)
const IR_V2117 = ir;
ir = function (t, ...a) {
  if (!(t in PAGINAS)) Object.keys(PAGINAS).forEach(o => { const v = $('v-' + o); if (v) v.innerHTML = ''; });
  return IR_V2117(t, ...a);
};


/* v2.119.0 · Registro de llamada dentro del alta de cliente. El cliente nuevo de una llamada se da de alta siempre con la ficha
   completa; su desplegable «Registro de llamada» guarda la llamada con el cliente o, si no compra, solo la llamada (sin cliente) con
   lo apuntado de él en llamadas.datos (población, provincia, email…), para las métricas. */
function llamadaAltaHTML(est) {
  est = est || {};
  return `<details class="blk kollam" id="kollam" ${est.motivo !== undefined ? 'open' : ''}><summary>Registro de llamada</summary>
    <div class="sm">Si llama y no compra, guarda solo la llamada: no se crea el cliente, pero quedan sus datos para las métricas.</div>
    <label>Motivo</label><div class="chipsw" id="kolmot"></div>
    <label>Resultado</label><div class="chipsw" id="kolres"></div>
    <div id="kolseg" class="${!est.resultado || est.resultado === 'Pedido hecho' ? 'hide' : ''}">
      <div class="sm" style="margin:8px 0 4px">¿Cuándo volver a llamar?</div>
      <div class="chipsw">${[['Mañana', 1], ['En 3 días', 3], ['En una semana', 7], ['En un mes', 30]].map(([t, d]) => `<button type="button" class="chipsel" data-kold="${d}">${t}</button>`).join('')}</div>
      <div class="g2" style="margin-top:6px"><div><input id="kolpf" type="date" value="${esc(est.proxima_fecha || '')}" aria-label="Volver a llamar el"></div>
        <div><input id="kolpa" value="${esc(est.proxima_accion || '')}" placeholder="p. ej. Enviarle el precio por WhatsApp" aria-label="Qué hacer"></div></div></div>
    <div class="g2"><div><label for="kold">Tipo</label><select id="kold"><option ${est.direccion !== 'Saliente' ? 'selected' : ''}>Entrante</option><option ${est.direccion === 'Saliente' ? 'selected' : ''}>Saliente</option></select></div>
      <div><label for="kolno">Nota de la llamada</label><input id="kolno" value="${esc(est.nota || '')}"></div></div>
    <div class="acts" style="margin-top:8px"><button type="button" class="btn sec" id="kosolo">No compra: guardar solo la llamada</button></div>
  </details>`;
}
let LL_ALTA = { motivo: '', resultado: '' };
function llamadaAltaActivar(getMedico, est) {
  est = est || {};
  LL_ALTA = { motivo: est.motivo || '', resultado: est.resultado || '' };
  catLlamadas().then(() => {
    if (!$('kolmot')) return;
    const chips = (cat, v, attr) => (CAT[cat] || []).map(x => `<button type="button" class="chipsel ${x.valor === v ? 'on' : ''} ${x.extra === 'neg' ? 'neg' : x.extra === 'pos' ? 'pos' : ''}" ${attr}="${esc(x.valor)}">${esc(x.valor)}</button>`).join('');
    $('kolmot').innerHTML = chips('motivo_llamada', LL_ALTA.motivo, 'data-kom');
    $('kolres').innerHTML = chips('resultado_llamada', LL_ALTA.resultado, 'data-kor');
  });
  $('kollam').onclick = e => {
    const m = e.target.closest('[data-kom]'), r = e.target.closest('[data-kor]'), d = e.target.closest('[data-kold]');
    if (m) { LL_ALTA.motivo = LL_ALTA.motivo === m.dataset.kom ? '' : m.dataset.kom; $('kolmot').querySelectorAll('[data-kom]').forEach(x => x.classList.toggle('on', x.dataset.kom === LL_ALTA.motivo)); }
    if (r) {
      LL_ALTA.resultado = LL_ALTA.resultado === r.dataset.kor ? '' : r.dataset.kor;
      $('kolres').querySelectorAll('[data-kor]').forEach(x => x.classList.toggle('on', x.dataset.kor === LL_ALTA.resultado));
      $('kolseg').classList.toggle('hide', !LL_ALTA.resultado || LL_ALTA.resultado === 'Pedido hecho');
    }
    if (d) { const f = new Date(); f.setDate(f.getDate() + +d.dataset.kold); $('kolpf').value = fechaLocal(f); $('kollam').querySelectorAll('[data-kold]').forEach(x => x.classList.toggle('on', x === d)); }
  };
}
function llamadaAltaLeer() {
  if (!$('kollam')) return null;
  return { motivo: LL_ALTA.motivo, resultado: LL_ALTA.resultado, direccion: $('kold').value, nota: $('kolno').value.trim(),
    proxima_fecha: $('kolpf').value, proxima_accion: $('kolpa').value.trim() };
}
async function llamadaAltaGuardar(ll, x, est) {
  est = est || {};
  const seguir = x.resultado && x.resultado !== 'Pedido hecho';
  const { data: r, error } = await db.rpc('guardar_llamada', { p: { id: est.id || null, fecha: est.fecha || null, direccion: ll.direccion,
    nombre: x.nombre || '', telefono: x.telefono || '', contacto_id: x.contacto_id || null, cliente_nuevo: null,
    cuenta_id: x.medico ? x.medico.id : null, cuenta_texto: x.medico ? '' : (est.cuenta_texto || ''), motivo: ll.motivo, resultado: x.resultado || '',
    proxima_accion: seguir ? ll.proxima_accion : '', proxima_fecha: seguir ? ll.proxima_fecha : '', nota: ll.nota,
    pedido_id: null, llamada_origen: est.previa || null, ...(x.datos && Object.keys(x.datos).length ? { datos: x.datos } : {}) } });
  if (error || (r && r.ok === false)) { toast('No se ha podido guardar la llamada' + (error ? ': ' + error.message : ''), true); return null; }
  return r.id;
}


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
// Menú de usuario: una sola entrada «Organización» en lugar de Empresa y Plan
function menuOrganizacion() {
  const plan = document.querySelector('[data-u="plan"]'), emp = document.querySelector('[data-u="empresa"]');
  if (!document.querySelector('[data-u="organizacion"]') && (emp || plan))
    (emp || plan).insertAdjacentHTML('beforebegin', `<button data-u="organizacion" class="hide">${svgIco(ICON_NOM.building)} Organización</button>`);
  [plan, emp].forEach(b => b && b.classList.add('hide'));
  const o = document.querySelector('[data-u="organizacion"]'); if (o) o.classList.toggle('hide', !puedeOrganizacion());
}
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
// v2.122.0: la ventana va EN la página, en el sitio del apartado (antes flotaba encima con posición absoluta y su propio desplazamiento).
// Se devuelve a <body> antes de cerrarse, para que los repintados del apartado no se la lleven por delante.
function colocarEncajada(d, area) {
  // v2.134.0: con el menú lateral, nav.main ocupa toda la altura y no es cabecera (daba el alto de la pantalla)
  const cab = Math.max(0, ...['header', '.top', document.body.classList.contains('menulat') ? '' : 'nav.main'].filter(Boolean).map(q => { const e = document.querySelector(q); return e && getComputedStyle(e).position.match(/fixed|sticky/) ? e.getBoundingClientRect().bottom : 0; }));
  document.documentElement.style.setProperty('--alto-cab', cab + 'px');
}
function devolverEncajada(d) {
  if (d.__casa && d.parentNode !== d.__casa) d.__casa.appendChild(d);
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
async function deshacerUno(id, despues) {
  const { data: s } = await db.rpc('deshacer_cambio', { p_id: id, p_simular: true });
  if (!s || !s.ok) { toast(MOTIVO_DESHACER[(s && s.motivo) || ''] || (s && s.motivo) || 'No se puede deshacer', true); return; }
  if (!(s.campos || []).length) { toast('No hay nada que deshacer: esos datos se han vuelto a cambiar después', true); return; }
  if (!await preguntar(`Volverán a su valor de antes: ${s.campos.map(campoTxt).join(', ')}. Lo que se haya cambiado después no se toca.`, { titulo: 'Deshacer el cambio', ok: 'Deshacer' })) return;
  const { data: r, error } = await db.rpc('deshacer_cambio', { p_id: id, p_simular: false });
  if (error || !r || !r.ok) { toast('No se ha podido deshacer: ' + ((r && (MOTIVO_DESHACER[r.motivo] || r.motivo)) || (error && error.message) || ''), true); return; }
  toast('Cambio deshecho'); if (despues) despues();
}
function cajaDeshacerPersona(caja, usuario, desde, nombre, despues) {
  if (!caja) return;
  if (!usuario || !desde) { caja.innerHTML = ''; return; }
  caja.innerHTML = `<div class="card" id="audpersona" style="margin:0 16px 10px"><h3>Deshacer los cambios de ${esc(nombre.trim())}</h3>
    <p class="sm">Todo lo que cambió o borró en fichas, ${TT('consulta', 'p', '', 'l', 'l')}, clientes, productos y rutas desde el ${fechaCorta(desde)}. Lo que otra persona haya cambiado después no se toca.</p>
    <div class="acts" style="margin:6px 0 0"><button type="button" class="btn sec" id="audsim">Ver qué se desharía</button></div><div id="audres" class="sm"></div></div>`;
  $('audsim').onclick = async ev => {
    ev.target.disabled = true;
    const { data: s } = await db.rpc('deshacer_persona', { p_usuario: usuario, p_desde: desde + 'T00:00:00', p_simular: true });
    ev.target.disabled = false;
    if (!s || !s.ok) { toast('No se ha podido calcular', true); return; }
    const nom = { cuentas: 'fichas', ubicaciones: TT('consulta', 'p', '', 'l', 'l'), contactos: 'clientes', productos: 'productos', rutas: 'rutas' };
    if (!s.cambios) { $('audres').textContent = 'No hay nada que deshacer en ese periodo (o ya se ha vuelto a cambiar).'; return; }
    $('audres').innerHTML = `Se desharían <b>${num(s.cambios)}</b> cambios (${num(s.campos)} datos): ${Object.entries(s.por_entidad || {}).map(([k, n]) => `${num(n)} en ${nom[k] || k}`).join(', ')}.
      ${s.sin_deshacer ? ` ${num(s.sin_deshacer)} no se pueden deshacer porque se han vuelto a cambiar después.` : ''}
      <div class="acts" style="margin:8px 0 0"><button type="button" class="btn" id="audok">Deshacer ${num(s.cambios)} cambios</button></div>`;
    $('audok').onclick = async ev2 => {
      if (!await preguntar(`Se desharán ${num(s.cambios)} cambios de ${nombre.trim()} desde el ${fechaCorta(desde)}. Queda registrado y cada uno se puede volver a cambiar a mano.`, { titulo: 'Deshacer sus cambios', ok: 'Deshacer' })) return;
      ev2.target.disabled = true;
      const { data: r } = await db.rpc('deshacer_persona', { p_usuario: usuario, p_desde: desde + 'T00:00:00', p_simular: false });
      if (!r || !r.ok) { ev2.target.disabled = false; toast('No se ha podido deshacer', true); return; }
      toast(`Deshechos ${num(r.cambios)} cambios`); if (despues) despues();
    };
  };
}
// Ficha: historial de cambios (de la ficha y de sus consultas), plegado al final; solo administración
async function fichaHistorial(id) {
  if (!puede('administrar') || FICHA_ID !== id || !$('fbody') || $('fhist')) return;
  const { data } = await RPC_ORIG('historial_entidad', { p_entidad: 'cuentas', p_id: id, lim: 100 });
  const l = Array.isArray(data) ? data : [];
  if (FICHA_ID !== id || !$('fbody') || $('fhist')) return;
  const lineas = a => a.accion === 'Edición' && a.detalle && typeof a.detalle === 'object'
    ? Object.keys(a.detalle).filter(k => Array.isArray(a.detalle[k]) && a.detalle[k].length === 2)
        .map(k => `<span class="sm">${esc(campoTxt(k))}: ${esc(textoValor(a.detalle[k][0]).slice(0, 40) || '—')} → ${esc(textoValor(a.detalle[k][1]).slice(0, 40) || '—')}</span>`).join('')
    : `<span class="sm">${esc(resumenDetalle(a.detalle))}</span>`;
  $('fbody').insertAdjacentHTML('beforeend', `<details class="blk" id="fhist"><summary>Historial de cambios <span class="n">${num(l.length)}</span></summary>
    <div class="lista">${l.map(a => `<div class="item" style="cursor:default"><span class="tx">
        <b>${esc(a.accion)}${a.entidad === 'ubicaciones' ? ' · ' + TT('consulta', 's', '', 'l', 'l') : ''}</b>
        <span class="sm">${esc(a.usuario)} · ${new Date(a.creado_en).toLocaleString('es', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        ${lineas(a)}</span>${a.deshacible ? `<button type="button" class="btn sec" data-fhx="${a.id}">Deshacer</button>` : ''}</div>`).join('')
      || '<div class="sm">Sin cambios registrados.</div>'}</div></details>`);
  $('fhist').querySelectorAll('[data-fhx]').forEach(b => b.onclick = () => deshacerUno(+b.dataset.fhx, () => abrirFicha(id)));
}
abrirFicha = (orig => async function (id, ...a) { const r = await orig.call(this, id, ...a); fichaHistorial(id); return r; })(abrirFicha);


/* v2.125.0 · Nueva venta y Oportunidades. Un solo recorrido para vender (antes «Registrar llamada» y «+ Nuevo pedido» por separado):
   1 cliente (buscar o ficha nueva, con lo que ya sabemos de él), 2 qué quiere (productos y unidades, médico de referencia, cómo llegó),
   3 cómo termina (pedido o motivo de no compra y cuándo volver a llamar). Con el extra «Oportunidades» de la organización, cada venta
   queda registrada con su día y hora, lo que quería y cuánto, se cierre con pedido o no; sin él, el recorrido lleva al pedido. */
// v2.242.0: aquí iba la primera versión de hayOportunidades (se redefine entera más abajo)
function extraNombre(k) { return { oportunidades: 'Oportunidades', portal: 'Portal' }[k] || k; }
async function catOportunidades() {
  await catLlamadas();
  if (!(CAT.origen_oportunidad || []).length) { const { data } = await db.rpc('catalogo_papel', { p_papel: 'origen_oportunidad' }); CAT.origen_oportunidad = data || []; }
}
const NV_DIAS = [['Mañana', 1], ['En 3 días', 3], ['En una semana', 7], ['En un mes', 30]];
const nvLinea = (pid, u) => { const p = PRODUCTOS.find(x => x.id === pid) || {}; return p.precio != null ? r2(p.precio * (1 + (+p.iva || 0) / 100) * (+u || 0)) : 0; };

// l: oportunidad existente o datos de partida ({ contacto, medico, interes, origen… }); previa: la oportunidad a la que se hace seguimiento
async function editorOportunidad(l, previa) {
  if (!PRODUCTOS.length) await cargarProductos();
  const reg = hayOportunidades();
  if (reg) await catOportunidades();
  l = Object.assign({ fecha: new Date().toISOString() }, l || {});
  if (!l.fecha) l.fecha = new Date().toISOString();
  const cerrada = !!l.pedido_id;
  let cliente = l.contacto ? l.contacto : l.contacto_id ? { id: l.contacto_id, nombre: l.cliente || l.nombre, movil: l.tel_cliente || l.telefono } : null;
  let medico = l.medico && typeof l.medico === 'object' ? l.medico : l.cuenta_id ? { id: l.cuenta_id, nombre: l.medico } : null;
  if (!medico && cliente && cliente.cuenta_id) medico = { id: cliente.cuenta_id, nombre: cliente.medico || TT('medico', 's', '', 'l', 'C') };
  let lineas = (l.interes || []).map(x => ({ producto_id: x.producto_id, unidades: x.unidades }));
  if (!lineas.length) lineas = [{ producto_id: productoPorDefecto(), unidades: 1 }];
  let origen = l.origen || (previa ? 'Llamada saliente' : ((CAT.origen_oportunidad || [])[0] || {}).valor || '');
  let motivo = l.motivo || '', resultado = l.resultado || '', noCompra = !!(l.id && l.resultado && l.resultado !== 'Pedido hecho');
  const f = new Date(l.fecha), local = new Date(f.getTime() - f.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  const chips = (lista, v, attr) => lista.map(x => `<button type="button" class="chipsel ${x.valor === v ? 'on' : ''} ${x.extra === 'neg' ? 'neg' : x.extra === 'pos' ? 'pos' : ''}" ${attr}="${esc(x.valor)}">${esc(x.valor)}</button>`).join('');
  const titulo = l.id ? (cerrada ? 'Venta cerrada' : 'Oportunidad') : previa ? 'Volver a llamar' : 'Nueva venta';
  $('dbody').innerHTML = `
    <div class="fh"><div><h2>${titulo}</h2>
      <div class="sm">${previa ? 'Seguimiento de ' + esc(previa.cliente || previa.nombre || '') : reg ? 'Cliente, qué quiere y cómo termina: queda registrado aunque no compre' : 'Busca el cliente o crea su ficha y haz el pedido'}</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="llpaso" id="nvp1"><span class="lln">1</span><b>Cliente</b><div id="nvcli"></div><div id="nvctx" class="nvctx"></div></div>
    ${reg ? `<div class="llpaso" id="nvp2"><span class="lln">2</span><b>Qué quiere</b>
      <div id="nvint"></div>
      <label>${TT('medico', 's', '', 'l', 'C')} o centro de referencia</label><div id="nvmed"></div>
      <div class="sm" style="margin-top:4px">Si no está en la base, escribe su nombre: se guarda igualmente para las métricas.</div>
      <label>Cómo llegó</label><div class="chipsw" id="nvori">${chips(CAT.origen_oportunidad || [], origen, 'data-nvo')}</div>
      <label>Motivo</label><div class="chipsw" id="nvmot">${chips(CAT.motivo_llamada || [], motivo, 'data-nvm')}</div>
      <details class="llmas"><summary>Más detalles</summary>
        <div class="g2"><div><label for="nvf">Fecha y hora</label><input id="nvf" type="datetime-local" value="${local}"></div>
          <div><label for="nvno">Nota</label><input id="nvno" value="${esc(l.nota || '')}"></div></div></details></div>` : ''}
    <div class="llpaso" id="nvp3"><span class="lln">${reg ? 3 : 2}</span><b>Cómo termina</b>
      ${cerrada ? `<div class="banda-ok">Cerrada con el pedido ${esc(l.pedido || '')}.</div>`
        : `<div class="acts nvfin" style="margin:6px 0 0;justify-content:flex-start">
          <button type="button" class="btn" id="nvped">🛒 Hacer el pedido</button>
          ${reg ? `<button type="button" class="btn sec ${noCompra ? 'on' : ''}" id="nvno2">No compra</button>` : ''}</div>`}
      ${reg && !cerrada ? `<div id="nvnoz" class="${noCompra ? '' : 'hide'}">
        <label>Por qué no compra</label><div class="chipsw" id="nvres">${chips((CAT.resultado_llamada || []).filter(x => x.extra !== 'pos' && x.valor !== 'Pedido hecho'), resultado, 'data-nvr')}</div>
        <div class="sm" style="margin:8px 0 4px">¿Cuándo volver a llamar?</div>
        <div class="chipsw">${NV_DIAS.map(([t, d]) => `<button type="button" class="chipsel" data-nvd="${d}">${t}</button>`).join('')}</div>
        <div class="g2" style="margin-top:6px"><div><input id="nvpf" type="date" value="${esc(l.proxima_fecha || '')}" aria-label="Volver a llamar el"></div>
          <div><input id="nvpa" value="${esc(l.proxima_accion || '')}" placeholder="p. ej. Enviarle el precio por WhatsApp" aria-label="Qué hacer"></div></div>
        <div id="nvperd" class="sm" style="margin-top:6px"></div>
        <div class="acts" style="margin:8px 0 0;justify-content:flex-start"><button type="button" class="btn" id="nvnook">Guardar sin pedido</button></div></div>` : ''}
    </div>
    <div class="acts" style="justify-content:flex-end;flex-wrap:wrap"><button class="btn sec" data-cerrar>Cerrar</button>
      ${reg && (cerrada || l.id) ? '<button class="btn sec" id="nvguar">Guardar cambios</button>' : ''}</div>`;
  $('dlg').showModal();
  const q = () => ($('nvq') ? $('nvq').value.trim() : '');

  // 1 · Cliente: buscar, crear ficha o lo que ya sabemos de él
  const pintaCli = () => {
    const c = $('nvcli');
    if (cliente) {
      c.innerHTML = `<div class="clisel"><span><b>${esc(cliente.nombre || '')}</b><span class="sm">${esc([cliente.movil || cliente.telefono || cliente.tel, cliente.nif].filter(Boolean).join(' · '))}</span></span>
        ${cerrada ? '' : '<button type="button" class="btn sec" id="nvcamb">Cambiar</button>'}</div>`;
      if ($('nvcamb')) $('nvcamb').onclick = () => { cliente = null; $('nvctx').innerHTML = ''; pintaCli(); };
      contexto();
      return;
    }
    c.innerHTML = `<input id="nvq" type="search" placeholder="Nombre, teléfono o DNI" autocomplete="off" value="${esc(l.id ? (l.nombre || l.telefono || '') : '')}"><div class="lista" id="nvres1"></div>
      <div class="acts" style="margin:6px 0 0;justify-content:flex-start"><button type="button" class="btn sec" id="nvalta">+ Crear ficha nueva</button>
        ${l.id || previa ? '' : '<button type="button" class="lnk" id="nvsin">Pedido sin cliente (venta a centro)</button>'}</div>
      ${reg ? '<div class="sm" style="margin-top:4px">Si no compra y no quiere ficha, basta con escribir aquí su nombre o su teléfono.</div>' : ''}`;
    let tq;
    $('nvq').oninput = () => { clearTimeout(tq); tq = setTimeout(async () => {
      const r = await buscarClientes(q());
      if (!$('nvres1')) return;
      $('nvres1').innerHTML = r.map(x => `<button type="button" class="item" data-nvc="${x.id}"><span class="tx"><b>${esc(x.nombre)}</b><span class="sm">${esc([x.movil || x.telefono, x.nif].filter(Boolean).join(' · '))}</span></span></button>`).join('')
        || (q().length > 1 ? '<div class="sm" style="padding:6px">No está: crea su ficha con «+ Crear ficha nueva».</div>' : '');
      $('nvres1').querySelectorAll('[data-nvc]').forEach(b => b.onclick = () => elegir(r.find(y => y.id === b.dataset.nvc)));
    }, 250); };
    $('nvalta').onclick = () => {
      const t = q(), tel = /^[+\d\s]{6,}$/.test(t);
      editorContacto({ nombre: tel ? '' : t, movil: tel ? t : '', cuenta_id: medico ? medico.id : null, medico: medico ? medico.nombre : '' }, res => elegir(res));
    };
    if ($('nvsin')) $('nvsin').onclick = () => { $('dlg').close(); editorPedido(); };
  };
  const elegir = async x => {
    if (!x) return;
    cliente = x;
    if (x.cuenta_id && !medico) {
      const { data: m } = await db.from('cuentas').select('id,nombre').eq('id', x.cuenta_id).maybeSingle();
      if (m) { medico = m; if ($('nvmed')) pintaMed(); }
    }
    pintaCli();
  };
  // Lo que ya sabemos del cliente: último pedido (para repetirlo), cuántos lleva y si quedamos en llamarle
  const contexto = async () => {
    const id = cliente && cliente.id; if (!id) return;
    const [{ data: peds0 }, segs] = await Promise.all([
      db.from('pedidos').select('id,numero,fecha,estado').eq('contacto_id', id).neq('estado', 'Anulado').order('fecha', { ascending: false }).limit(20),
      reg ? db.from('llamadas').select('id,fecha,resultado,proxima_fecha,proxima_accion,seguimiento_hecho_en,pedido_id').eq('contacto_id', id).order('fecha', { ascending: false }).limit(5) : Promise.resolve({ data: [] })]);
    // Las líneas, aparte (sin depender de la relación entre tablas)
    const { data: lin } = (peds0 || []).length ? await db.from('lineas_pedido').select('pedido_id,producto_id,unidades,importe,iva').in('pedido_id', peds0.map(x => x.id)) : { data: [] };
    const peds = (peds0 || []).map(x => Object.assign({}, x, { lineas_pedido: (lin || []).filter(y => y.pedido_id === x.id) }));
    if (!cliente || cliente.id !== id || !$('nvctx')) return;
    const p = peds || [], u = p[0], pend = ((segs && segs.data) || []).find(s => s.proxima_fecha && !s.seguimiento_hecho_en && !s.pedido_id && s.id !== l.id);
    const tot = x => (x.lineas_pedido || []).reduce((s, y) => s + (+y.importe || 0) * (1 + (+y.iva || 0) / 100), 0);
    const nom = pid => (PRODUCTOS.find(z => z.id === pid) || {}).nombre || 'Producto';
    $('nvctx').innerHTML = !p.length && !pend ? '<span class="sm">Cliente sin pedidos todavía.</span>' : `
      ${u ? `<div class="nvult"><span><b>Último pedido</b> · ${fechaCorta(String(u.fecha).slice(0, 10))} · ${esc((u.lineas_pedido || []).map(y => `${nom(y.producto_id)} × ${num(y.unidades)}`).join(', '))} · ${eurI(tot(u))}</span>
        ${reg && !cerrada ? '<button type="button" class="btn sec" id="nvrep">Repetir</button>' : ''}</div>` : ''}
      ${p.length ? `<span class="sm">${num(p.length)}${p.length === 20 ? ' o más' : ''} pedidos · ${eurI(p.reduce((s, x) => s + tot(x), 0))} en total</span>` : ''}
      ${pend ? `<div class="banda-aviso">Quedaste en llamarle el ${fechaCorta(pend.proxima_fecha)}${pend.proxima_accion ? ': ' + esc(pend.proxima_accion) : ''} (${esc(pend.resultado || '')}).</div>` : ''}`;
    if ($('nvrep')) $('nvrep').onclick = () => { lineas = (u.lineas_pedido || []).map(y => ({ producto_id: y.producto_id, unidades: +y.unidades || 1 })); pintaInt(); toast('Interés con lo del último pedido'); };
  };

  // 2 · Qué quiere
  const pintaInt = () => {
    if (!$('nvint')) return;
    const prods = PRODUCTOS.filter(p => p.tipo !== 'servicio' && p.estado !== 'En pausa' && p.estado !== 'Descatalogado');
    $('nvint').innerHTML = lineas.map((x, i) => `<div class="nvlin" data-nvi="${i}">
        <select data-nvf="producto_id" aria-label="Producto">${prods.map(p => `<option value="${p.id}" ${p.id === x.producto_id ? 'selected' : ''}>${esc(p.nombre)}</option>`).join('')
          || '<option value="">Sin productos</option>'}</select>
        <input data-nvf="unidades" type="number" min="1" step="1" value="${esc(x.unidades)}" aria-label="Unidades">
        <span class="nvimp">${eurI(nvLinea(x.producto_id, x.unidades))}</span>
        ${lineas.length > 1 ? `<button type="button" class="btn sec" data-nvx="${i}" aria-label="Quitar">✕</button>` : '<span></span>'}</div>`).join('') +
      `<div class="nvtot"><button type="button" class="lnk" id="nvmas">+ Otro producto</button><span>Iría a comprar <b id="nvtotv">${eurI(totalInt())}</b></span></div>`;
    $('nvint').querySelectorAll('[data-nvi]').forEach(row => {
      const i = +row.dataset.nvi;
      row.querySelectorAll('[data-nvf]').forEach(inp => inp.oninput = inp.onchange = () => {
        lineas[i][inp.dataset.nvf] = inp.dataset.nvf === 'unidades' ? Math.max(0, +inp.value || 0) : inp.value;
        row.querySelector('.nvimp').textContent = eurI(nvLinea(lineas[i].producto_id, lineas[i].unidades));
        $('nvtotv').textContent = eurI(totalInt()); perdida();
      });
    });
    $('nvint').querySelectorAll('[data-nvx]').forEach(b => b.onclick = () => { lineas.splice(+b.dataset.nvx, 1); pintaInt(); });
    $('nvmas').onclick = () => { lineas.push({ producto_id: productoPorDefecto(), unidades: 1 }); pintaInt(); };
    perdida();
  };
  const totalInt = () => lineas.reduce((s, x) => s + nvLinea(x.producto_id, x.unidades), 0);
  const perdida = () => { if ($('nvperd')) $('nvperd').innerHTML = totalInt() ? `Sin pedido se quedan sin vender <b>${eurI(totalInt())}</b>.` : ''; };
  const pintaMed = () => {
    $('nvmed').innerHTML = ''; $('nvmed').__texto = medico ? '' : (l.cuenta_texto || '');
    selectorMedico($('nvmed'), { valor: medico, placeholder: 'Nombre, código, centro o municipio', alElegir: m => { medico = m; } });
  };
  pintaCli();
  if (reg) {
    pintaInt(); pintaMed();
    $('nvori').onclick = e => { const b = e.target.closest('[data-nvo]'); if (!b) return; origen = origen === b.dataset.nvo ? '' : b.dataset.nvo; $('nvori').querySelectorAll('[data-nvo]').forEach(x => x.classList.toggle('on', x.dataset.nvo === origen)); };
    $('nvmot').onclick = e => { const b = e.target.closest('[data-nvm]'); if (!b) return; motivo = motivo === b.dataset.nvm ? '' : b.dataset.nvm; $('nvmot').querySelectorAll('[data-nvm]').forEach(x => x.classList.toggle('on', x.dataset.nvm === motivo)); };
  }
  if ($('nvnoz')) $('nvnoz').onclick = e => {
    const d = e.target.closest('[data-nvd]');
    if (d) { const f2 = new Date(); f2.setDate(f2.getDate() + +d.dataset.nvd); $('nvpf').value = fechaLocal(f2); $('nvnoz').querySelectorAll('[data-nvd]').forEach(x => x.classList.toggle('on', x === d)); return; }
    const b = e.target.closest('[data-nvr]'); if (!b) return;
    resultado = resultado === b.dataset.nvr ? '' : b.dataset.nvr;
    $('nvres').querySelectorAll('[data-nvr]').forEach(x => x.classList.toggle('on', x.dataset.nvr === resultado));
  };
  if ($('nvno2')) $('nvno2').onclick = () => { noCompra = !noCompra; $('nvno2').classList.toggle('on', noCompra); $('nvnoz').classList.toggle('hide', !noCompra); };

  // Guarda la oportunidad; resultado vacío = sigue abierta (el pedido la cierra al guardarse)
  const guardar = async res => {
    const t = q(), tel = /^[+\d\s]{6,}$/.test(t);
    const nombre = cliente ? cliente.nombre : (tel ? '' : t) || l.nombre || '', telefono = cliente ? (cliente.movil || cliente.telefono || cliente.tel || '') : (tel ? t : l.telefono || '');
    const conSeg = res && res !== 'Pedido hecho';
    const { data: r, error } = await db.rpc('guardar_llamada', { p: { id: l.id || null, fecha: $('nvf') && $('nvf').value ? new Date($('nvf').value).toISOString() : l.fecha,
      nombre, telefono, contacto_id: cliente ? cliente.id : null, cuenta_id: medico ? medico.id : null,
      cuenta_texto: medico ? '' : (($('nvmed') || {}).__texto || '').trim(), origen, motivo, resultado: res || '',
      proxima_fecha: conSeg && $('nvpf') ? $('nvpf').value : '', proxima_accion: conSeg && $('nvpa') ? $('nvpa').value.trim() : '',
      nota: $('nvno') ? $('nvno').value.trim() : (l.nota || ''), pedido_id: l.pedido_id || null, llamada_origen: previa ? previa.id : (l.llamada_origen || null),
      interes: lineas.filter(x => x.producto_id && +x.unidades > 0).map(x => ({ producto_id: x.producto_id, unidades: +x.unidades })) } });
    if (error || !r || r.ok === false) { toast('No se ha podido guardar' + (error ? ': ' + error.message : r && r.motivo === 'extra' ? ': tu organización no tiene el registro de oportunidades' : ''), true); return null; }
    return r;
  };
  const refrescar = () => { if (TAB === 'ventas' && PEDSEC === 'llamadas') pintarLlamadas(); };
  if ($('nvped')) $('nvped').onclick = async ev => {
    if (!cliente) { toast('Busca el cliente o crea su ficha para hacer el pedido', true); return; }
    ev.target.disabled = true;
    let r = null;
    if (reg) { r = await guardar(''); if (!r) { ev.target.disabled = false; return; } }
    const { data: c } = await db.from('contactos').select('id,nombre,nif,email,telefono,movil,cuenta_id').eq('id', cliente.id).maybeSingle();
    $('dlg').close(); refrescar();
    if (r) LLAMADA_PEND = r.id;
    const ls = reg ? lineas.filter(x => x.producto_id && +x.unidades > 0).map(x => { const p = PRODUCTOS.find(y => y.id === x.producto_id) || {};
      return { producto_id: x.producto_id, unidades: +x.unidades, importe: p.precio != null ? r2(p.precio * x.unidades) : null }; }) : [];
    await editorPedido({ contacto: Object.assign(c || cliente, { medico: medico ? medico.nombre : '' }), medico: medico ? { id: medico.id, nombre: medico.nombre } : null,
      lineas: ls.length ? ls : undefined, origen: /web/i.test(origen) ? 'web' : undefined });
  };
  if ($('nvnook')) $('nvnook').onclick = async ev => {
    if (!resultado) { toast('Marca por qué no compra', true); return; }
    if (!cliente && !q() && !l.nombre && !l.telefono) { toast('Apunta al menos su nombre o su teléfono', true); return; }
    ev.target.disabled = true;
    const r = await guardar(resultado);
    ev.target.disabled = false;
    if (!r) return;
    $('dlg').close(); toast('Oportunidad guardada sin pedido'); refrescar();
  };
  if ($('nvguar')) $('nvguar').onclick = async () => {
    const r = await guardar(cerrada ? (l.resultado || 'Pedido hecho') : noCompra ? resultado : '');
    if (!r) return;
    $('dlg').close(); toast('Oportunidad guardada'); refrescar();
  };
}
function nuevaVenta(pre) { return editorOportunidad(pre || null); }
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

// Organizaciones: los extras de cada empresa (los activa la plataforma)
function orgExtras(c, l) {
  c.querySelectorAll('[data-orgext]').forEach(b => b.onclick = () => {
    const o = l.find(x => x.id === b.dataset.orgext); if (!o) return;
    const act = (o.plan_datos || {}).extras || [];
    $('dbody').innerHTML = `<div class="fh"><div><h2>Extras de ${esc(o.nombre)}</h2><div class="sm">Lo que tiene contratado aparte de su plan</div></div>
        <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
      <label class="chk"><input type="checkbox" id="oxopor" ${act.includes('oportunidades') ? 'checked' : ''}> <span><b>Oportunidades</b>
        <span class="sm">Registro de cada venta, se cierre con pedido o no: día y hora, qué producto y cuántas unidades quería, su ${TT('medico', 's', '', 'l', 'l')} de referencia y cómo llegó, con sus métricas.</span></span></label>
      <label class="chk"><input type="checkbox" id="oxport" ${act.includes('portal') ? 'checked' : ''}> <span><b>Portal ${TT('medico', 's', 'del', 'l', 'l')}</b>
        <span class="sm">En su portal, cifras agregadas de ${TT('pauta', 'p', '', 'l', 'l')} (sin datos de personas), pedir material y escribir dudas a su comercial.</span></span></label>
      <div class="acts" style="justify-content:flex-end"><button class="btn sec" data-cerrar>Cancelar</button><button class="btn" id="oxok">Guardar</button></div>`;
    $('dlg').showModal();
    $('oxok').onclick = async () => {
      const { data: r, error } = await db.rpc('guardar_extras_organizacion', { p_org: o.id, p_extras: [$('oxopor').checked && 'oportunidades', $('oxport').checked && 'portal'].filter(Boolean) });
      if (error || !r || !r.ok) { toast('No se han podido guardar los extras' + (error ? ': ' + error.message : ''), true); return; }
      $('dlg').close(); toast('Extras guardados');
      const { data: u } = await RPC_ORIG('plan_uso', {}); if (u && u.plan) PLAN_ACTUAL = u.plan;   // por si es la propia
      pintarOrganizaciones();
    };
  });
}


/* v2.126.0 · Portal del médico (extra «Portal» de la organización). En «Mi informe», además: la constancia de sus pacientes solo en
   cifras (sin ninguna fila por paciente), pedir material de lo que la empresa permite y escribir dudas a su comercial. En la ficha,
   quien la lleva entrega el material y contesta. En Configuración → Portal del médico, qué material se puede pedir y cuánto. */
// v2.242.0: aquí iba la primera versión de hayExtra (se redefine entera más abajo)
const MOTIVO_PORTAL = { permiso: 'No tienes permiso', extra: 'Tu empresa no tiene el portal activado', material: 'Ese material ya no se puede pedir',
  cantidad: 'Esa cantidad supera el máximo', vacio: 'Escribe el mensaje', cerrada: 'Ya estaba cerrado', no_existe: 'Ya no existe' };
const motivoPortal = r => MOTIVO_PORTAL[(r && r.motivo) || ''] || 'No se ha podido hacer';
const horaCorta = f => new Date(f).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const pillMaterial = e => `<span class="pill ${e === 'Pendiente' ? 'p-warn' : e === 'Entregado' ? 'p-est' : 'p-anu'}">${esc(e)}</span>`;

// Mensajes: el hilo de una ficha (el médico ve los suyos; quien lleva la ficha, los de esa ficha)
function hiloMensajes(l, yoMedico) {
  return l.length ? `<div class="hilo">${l.map(x => `<div class="msj ${x.del_portal === yoMedico ? 'mio' : 'suyo'}"><div>${esc(x.texto)}</div>
      <span class="sm">${x.del_portal ? TT('medico', 's', '', 'l', 'C') : 'Equipo'} · ${horaCorta(x.creado_en)}</span></div>`).join('')}</div>`
    : '<div class="sm">Todavía no hay mensajes.</div>';
}

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

// ——— Lado de quien lleva la ficha ———
async function fichaPortal(id) {
  if (ES_MEDICO() || !hayExtra('portal') || FICHA_ID !== id || !$('fbody') || $('fportal')) return;
  const [{ data: sols }, { data: msgs }, { data: acc }] = await Promise.all([
    db.from('solicitudes_material').select('id,material,cantidad,nota,estado,creado_en,cerrado_en').eq('cuenta_id', id).order('creado_en', { ascending: false }).limit(10),
    db.from('mensajes_cuenta').select('id,texto,del_portal,creado_en,leido_en').eq('cuenta_id', id).order('creado_en', { ascending: true }).limit(200),
    db.from('perfiles').select('id').eq('cuenta_id', id).eq('activo', true).limit(1)]);
  if (FICHA_ID !== id || !$('fbody') || $('fportal')) return;
  const ls = sols || [], lm = msgs || [], pend = ls.filter(x => x.estado === 'Pendiente'), sinLeer = lm.filter(x => x.del_portal && !x.leido_en).length;
  if (!ls.length && !lm.length && !(acc || []).length) return;   // sin portal ni actividad: no se ocupa sitio
  const html = `<section class="blk" id="fportal"><h3>Portal${pend.length ? ` <span class="pill p-warn">${num(pend.length)} material por entregar</span>` : ''}${sinLeer ? ` <span class="pill p-urg">${num(sinLeer)} sin leer</span>` : ''}</h3>
    ${ls.length ? `<div class="lista">${ls.map(x => `<div class="item" style="cursor:default"><span class="tx"><b>${num(x.cantidad)} × ${esc(x.material)}</b>
        <span class="sm">Pedido el ${horaCorta(x.creado_en)}${x.nota ? ' · ' + esc(x.nota) : ''}</span></span>${pillMaterial(x.estado)}
        ${x.estado === 'Pendiente' ? `<button type="button" class="btn chico" data-fpent="${x.id}">Entregado</button>` : ''}</div>`).join('')}</div>` : ''}
    <div class="fpmsg"><b class="sm">Mensajes</b><div id="fphilo">${hiloMensajes(lm, false)}</div>
      <div class="fpresp"><input id="fpmsgt" placeholder="Contestar" aria-label="Contestar"><button type="button" class="btn sec" id="fpmsgok">Enviar</button></div></div></section>`;
  const vis = $('fbody').querySelector('section.fvis');
  if (vis) vis.insertAdjacentHTML('afterend', html); else $('fbody').insertAdjacentHTML('beforeend', html);
  const rehacer = () => { const b = $('fportal'); if (b) b.remove(); fichaPortal(id); };
  $('fportal').querySelectorAll('[data-fpent]').forEach(b => b.onclick = async () => {
    const { data: r } = await db.rpc('cerrar_material', { p_id: b.dataset.fpent, p_estado: 'Entregado' });
    if (!r || !r.ok) { toast(motivoPortal(r), true); return; }
    toast('Material entregado: se le avisa'); rehacer();
  });
  $('fpmsgok').onclick = async ev => {
    const t = $('fpmsgt').value.trim(); if (!t) { toast('Escribe el mensaje', true); return; }
    ev.target.disabled = true;
    const { data: r } = await db.rpc('enviar_mensaje_cuenta', { p_cuenta: id, p_texto: t });
    ev.target.disabled = false;
    if (!r || !r.ok) { toast(motivoPortal(r), true); return; }
    toast('Mensaje enviado'); rehacer();
  };
  if (sinLeer) RPC_ORIG('leer_mensajes_cuenta', { p_cuenta: id });
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


