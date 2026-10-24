/* ============================================================
   DLC OS 2.0 · v2.28.0 · Móvil con todos los módulos, entrar como
   otro usuario, manual, alertas de cruce, cartera exclusiva, aviso
   de visita reciente, servicios, inicio de Rutas y un Inicio con más valor
   ============================================================ */

Object.assign(RPC_TTL, { alertas_mias: 60, alertas_cruce: 120, actividades_recientes: 30 });
let SERVICIOS = [];

async function cargarProductos() {
  const { data } = await db.rpc('productos_lista');
  const l = data || [];
  PRODUCTOS = l.filter(p => (p.tipo || 'producto') === 'producto');
  SERVICIOS = l.filter(p => p.tipo === 'servicio');
}

/* ---------------- móvil: los cuatro principales y «Más» ---------------- */

function pintarBnav() {
  const b = $('bnav'); if (!b) return;
  const principales = ['inicio', 'agenda', 'rutas', 'directorio'];
  const iconos = { inicio: '◉', agenda: '▤', rutas: '➤', directorio: '☰' };
  b.innerHTML = principales.map(t => `<button data-t="${t}" aria-selected="${TAB === t}"><span>${iconos[t]}</span>${esc((document.querySelector(`nav.main [data-t="${t}"]`) || {}).textContent || t)}</button>`).join('')
    + `<button id="bmasbtn" aria-selected="${!principales.includes(TAB)}"><span>⋯</span>Más</button>`;
  b.querySelectorAll('[data-t]').forEach(x => x.onclick = () => ir(x.dataset.t));
  $('bmasbtn').onclick = abrirMasMovil;
}


/* ---------------- entrar como otro usuario ---------------- */

const SKEY = 'dlc-suplantador';
const suplantando = () => { try { return JSON.parse(localStorage.getItem(SKEY) || 'null'); } catch (e) { return null; } };
// v2.117.0: «Entrar como otro usuario» es del plan A medida
const puedeSuplantar = () => PERFIL && (puede('administrar') || ((PERFIL.areas || {}).U || 0) >= 3) && !suplantando() && PLAN_ACTUAL.plan === 'medida';

function limpiarDatosLocales() {
  try { Object.keys(localStorage).filter(k => /^dlc-(rc-|perfil|jornada-)/.test(k)).forEach(k => localStorage.removeItem(k)); } catch (e) {}
}

async function entrarComo(id) {
  const u = (USUARIOS || []).find(x => x.id === id) || { nombre: 'esta persona' };
  const inv = esInvitado(u);
  if (!await preguntar(inv
      ? `Abrirás una sesión con el usuario de ${u.nombre} y verás su portal tal como lo ve.\n\nLo que hagas quedará a su nombre y la impersonalización queda registrada en la auditoría. Para terminar, pulsa «Terminar la impersonalización» en la barra morada de arriba.`
      : `Abrirás una sesión con el usuario de ${u.nombre}: su menú, sus permisos, su cartera y sus datos.\n\nLo que hagas quedará a su nombre y la impersonalización queda registrada en la auditoría. Para terminar, pulsa «Terminar la impersonalización» en la barra morada de arriba.`,
    { titulo: `¿Impersonalizar a ${u.nombre}?`, ok: 'Impersonalizar' })) return;
  pantallaCarga('Impersonalizando a ' + u.nombre + '…');
  const { data: { session } } = await db.auth.getSession();
  if (!session) { quitarCarga(); toast(SUPL_ERR.sesion, true); return; }
  let { data, error } = await db.functions.invoke('impersonar', { body: { usuario_id: id } });
  // La función antigua respondía con un error HTTP: se lee el motivo igualmente
  if (error && !data && error.context && typeof error.context.json === 'function') { try { data = await error.context.json(); } catch (e) {} }
  if (!data || !data.ok) {
    const e = data && data.error;
    toast(SUPL_ERR[e] || ('No se ha podido entrar: ' + ((data && data.detalle) || (error && error.message) || e || 'la función «impersonar» no responde')), true);
    if (!SUPL_ERR[e] || e === 'sesion') registrarError('api', 'Impersonalizar: ' + (e || (error && error.message) || 'sin respuesta'), { estado: error && error.context && error.context.status, detalle: data && data.detalle });
    quitarCarga(); return;
  }
  localStorage.setItem(SKEY, JSON.stringify({ access_token: session.access_token, refresh_token: session.refresh_token,
    nombre: PERFIL.nombre, id: PERFIL.id, como: data.nombre, rol: data.rol, desde: Date.now() }));
  const { error: e2 } = await db.auth.verifyOtp({ token_hash: data.token_hash, type: 'magiclink' });
  if (e2) {
    localStorage.removeItem(SKEY);
    await db.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token });
    registrarError('api', 'Impersonalizar: no se abre la sesión', { mensaje: e2.message });
    toast('No se ha podido abrir su sesión: ' + e2.message, true); quitarCarga(); return;
  }
  limpiarDatosLocales();
  location.reload();
}

async function volverAMiSesion() {
  const s = suplantando(); if (!s) return;
  const { error } = await db.auth.setSession({ access_token: s.access_token, refresh_token: s.refresh_token });
  localStorage.removeItem(SKEY);
  limpiarDatosLocales();
  if (error) { await db.auth.signOut(); toast('Tu sesión había caducado: vuelve a entrar', true); }
  location.reload();
}

function pintarBarraSuplantacion() {
  const s = suplantando();
  let b = $('barrasup');
  if (!s) { if (b) b.remove(); return; }
  if (!b) { document.body.insertAdjacentHTML('afterbegin', '<div id="barrasup"></div>'); b = $('barrasup'); }
  b.innerHTML = `<span>👤 <b>Impersonalizando a ${esc(PERFIL ? PERFIL.nombre : s.como)}</b>${PERFIL ? ' · ' + esc(PERFIL.rol) : ''} · Sesión con su usuario: lo que hagas queda a su nombre</span>
    <button class="btn chico" id="supvolver">↩ Terminar la impersonalización (${esc(nombrePila(s.nombre))})</button>`;
  $('supvolver').onclick = volverAMiSesion;
}

document.addEventListener('click', e => {
  const b = e.target.closest('[data-ucomo]');
  if (b) entrarComo(b.dataset.ucomo);
});

AREAS.push(['U', 'Impersonalizar usuarios']);

/* ---------------- manual de uso ---------------- */

const NIVEL_TXT = ['Sin acceso', 'Ver', 'Editar', 'Completo'];
const nivelDe = a => puede('administrar') ? 3 : ((PERFIL.areas || {})[a] || 0);

const MANUAL = [
  { id: 'inicio', t: 'Inicio', a: 'H', para: 'El resumen de tu día y de tu semana: indicadores, alertas, tu agenda de hoy y lo que conviene hacer.',
    hacer: [[1, 'Ver tus indicadores, tu semana, tus ventas del mes y las alertas'], [1, 'Personalizar qué indicadores ves (icono ⚙)']],
    config: ['Indicadores visibles y su orden (⚙ junto al saludo)'] },
  { id: 'agenda', t: 'Agenda y «Tu día»', a: 'G', para: `Tus citas por día, semana o mes. La vista de día es tu ruta: orden, horas estimadas y registro de ${TT('visita', 'p', '', 'l', 'l')}.`,
    hacer: [[1, 'Ver tu agenda'], [2, 'Crear, mover, aplazar, confirmar o descartar citas'], [2, 'Ordenar tu día por cercanía y empezar la jornada'], [2, 'Planificar la semana y bloquear días'],
      [3, 'Ver la agenda de otra persona y el cumplimiento del equipo (administración y televenta)']],
    config: [`Salida y vuelta: en cada ruta y en «Planificar la semana»; minutos por ${TT('visita', 's', '', 'l', 'l')} en Rutas → ⚙ Tiempos de ${TT('visita', 's', '', 'l', 'l')}`, `Aviso de ${TT('visita', 's', '', 'l', 'l')} reciente (Configuración → Preferencias)`, 'Frecuencia objetivo por estado (Agenda → Equipo, administración)'] },
  { id: 'rutas', t: 'Rutas', a: 'R', para: `Plantillas de ${TT('medico', 'p', '', 'l', 'l')} para llenar tu agenda: listas fijas o por criterios, y propuestas automáticas.`,
    hacer: [[1, 'Ver tus rutas y las propuestas'], [2, 'Crear y editar rutas, planificarlas y pasarlas a tu agenda']],
    config: ['Punto de salida y llegada (Configuración → Preferencias)', `Salida y vuelta de cada ruta (al crearla o editarla) y tiempos de ${TT('visita', 's', '', 'l', 'l')} (⚙ Tiempos de ${TT('visita', 's', '', 'l', 'l')})`] },
  { id: 'directorio', t: `${TT('medico', 'p', '', 'l', 'C')}`, a: 'M', para: `Todos ${TT('medico', 'p', 'el', 'l', 'l')} que puedes ver: tu cartera o toda la base si eres de administración o televenta.`,
    hacer: [[1, 'Buscar, filtrar y ver fichas'], [2, 'Editar fichas y horarios de atención'], [3, `Dar de alta ${TT('medico', 'p', '', 'l', 'l', 'nuevo')}`], [3, 'Unificar duplicados (administración)']],
    config: ['Columnas visibles (⋯ → Elegir columnas)', 'Filtros guardados como indicadores de Inicio'] },
  { id: 'centros', t: 'Centros', a: 'C', para: 'Las fichas de centros y clínicas.',
    hacer: [[1, 'Ver fichas de centros'], [2, 'Editarlas'], [3, 'Darlas de alta']], config: [] },
  { id: 'visitas', t: `${TT('visita', 'p', '', 'l', 'C')}`, a: 'S', para: `El registro de cada ${TT('visita', 's', '', 'l', 'l')}: resultado, muestras, material entregado y próxima acción.`,
    hacer: [[1, `Ver el historial de ${TT('visita', 'p', '', 'l', 'l')}`], [2, `Registrar y editar ${TT('visita', 'p', '', 'l', 'l')}`]],
    config: ['Resultados y material comercial con su dato (Configuración → Clasificadores, «+ Dato»)'] },
  { id: 'ventas', t: 'Ventas, Clientes y Productos', a: 'V', para: `Pedidos con IVA y servicios, clientes (${TT('paciente', 'p', '', 'l', 'l')} y empresas) y el catálogo de productos y servicios.`,
    hacer: [[1, `Ver los pedidos y clientes de tus ${TT('medico', 'p', '', 'l', 'l')}`], [2, 'Crear, confirmar y anular pedidos; dar de alta clientes (televenta)'], [3, 'Todo lo anterior sobre toda la base']],
    config: ['Productos y servicios (solo administración)', 'Servicio propuesto por defecto en pedidos nuevos'] },
  { id: 'config', t: 'Configuración', a: 'K', para: 'Tus preferencias y las listas que usa toda la plataforma.',
    hacer: [[0, 'Cambiar tus preferencias de salida, llegada, navegador y avisos'], [1, 'Ver clasificadores'], [2, 'Añadir y editar valores de clasificadores'], [3, 'Crear clasificadores nuevos']], config: [] },
  { id: 'admin', t: 'Administración', a: null, para: 'Usuarios, permisos, carteras, comisiones, accesos y auditoría. Solo administración.',
    hacer: [[3, 'Crear y editar usuarios y sus permisos'], [3, 'Asignar carteras (exclusivas o no)'], [3, 'Configurar comisiones y liquidar'], [3, 'Impersonalizar a otro usuario para revisar lo que ve']],
    config: [`Cartera exclusiva: ${TT('medico', 's', 'un', 'l', 'l')} en una sola cartera (Agenda → Equipo → ⚙ Reglas de cartera)`] }
];

const FAQ = [
  ['No veo un módulo', 'Depende de tus permisos. En la ficha de cada módulo de este manual ves tu nivel de acceso; si necesitas más, pídelo a administración.'],
  [`He registrado ${TT('visita', 's', 'un', 'l', 'l')} por error`, `Abre la ficha ${TT('medico', 's', 'del', 'l', 'l')}, busca ${TT('visita', 's', 'el', 'l', 'l')} en el historial y pulsa «Editar»: puedes corregirla o borrarla.`],
  ['La hora estimada de una cita no cuadra', `Revisa tu horario de rutas y el horario de atención ${TT('medico', 's', 'del', 'l', 'l')} en su ficha. La estimación cuenta desplazamientos, esperas y minutos por ${TT('visita', 's', '', 'l', 'l')}.`],
  [`${TT('medico', 's', 'un', 'C', 'l')} no aparece en mis rutas`, `Solo entran ${TT('medico', 'p', '', 'l', 'l')} con ubicación y, si tiene horario de atención, en sus días y horas. Revisa su ficha.`],
  ['¿Puedo usar la app sin conexión?', `Sí: consulta lo último que viste y registra ${TT('visita', 'p', '', 'l', 'l')}; se envían solas al recuperar la conexión.`],
  ['¿Por qué no puedo descargar datos?', `Por seguridad: los datos de ${TT('medico', 'p', '', 'l', 'l')} y ventas solo se consultan dentro de la plataforma.`]
];


/* ---------------- navegación: manual y barra de suplantación ---------------- */


document.addEventListener('click', e => {
  if (e.target.closest('#manbtn')) { e.stopPropagation(); document.querySelectorAll('.umenu').forEach(m => m.classList.add('hide')); ir('manual'); }
}, true);

/* ---------------- reglas de cartera ---------------- */

async function editorReglasCartera() {
  await cargarAjustes();
  const excl = !AJUSTES.cartera || AJUSTES.cartera.exclusiva !== false;
  $('dbody').innerHTML = `
    <div class="fh"><div><h2>Reglas de cartera</h2><div class="sm">Cómo se reparten ${TT('medico', 'p', 'el', 'l', 'l')} entre el equipo</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <label class="opt" style="margin-top:10px"><input type="checkbox" id="rcexcl" ${excl ? 'checked' : ''}>
      <span><b>Cartera exclusiva</b><br><span class="sm">${TT('medico', 's', 'un', 'C', 'l')} solo puede estar en la cartera de una persona. Al asignarlo a alguien, sale de la cartera de quien lo tuviera.</span></span></label>
    <p class="sm">Si la desactivas, ${TT('medico', 's', 'un', 'l', 'l')} podrá estar en varias carteras y administración verá una alerta «${TT('medico', 'p', '', 'l', 'C')} en más de una cartera» en Inicio.</p>
    <div class="acts" style="justify-content:flex-end"><button class="btn sec" data-cerrar>Cancelar</button><button class="btn" id="rcok">Guardar</button></div>`;
  $('dlg').showModal();
  $('rcok').onclick = async () => {
    const { data: r, error } = await db.rpc('guardar_ajuste', { p_clave: 'cartera', p_valor: { exclusiva: $('rcexcl').checked } });
    if (error || (r && r.ok === false)) { toast('No se ha podido guardar', true); return; }
    AJUSTES.cartera = { exclusiva: $('rcexcl').checked }; $('dlg').close(); toast('Reglas guardadas');
  };
}

pintarEquipo = (orig => async function () {
  await orig();
  const h = $('agcuerpo').querySelector('.semhead');
  if (h && puede('administrar') && !$('eqcart')) {
    h.insertAdjacentHTML('beforeend', '<button class="btn sec" id="eqcart">⚙ Reglas de cartera</button>');
    $('eqcart').onclick = editorReglasCartera;
  }
})(pintarEquipo);

/* ---------------- aviso de visita reciente ---------------- */

const avisoRevisita = () => Object.assign({ on: true, dias: 7 }, ((PERFIL.preferencias || {}).avisos || {}).revisita || {});

async function guardarAvisoRevisita(v) {
  const prefs = Object.assign({}, PERFIL.preferencias || {});
  prefs.avisos = Object.assign({}, prefs.avisos || {}, { revisita: v });
  const { data, error } = await db.rpc('guardar_preferencias', { p: prefs });
  if (error) { toast('No se ha podido guardar', true); return false; }
  PERFIL.preferencias = data || prefs;
  return true;
}

/** Visitas o citas de estos médicos cerca de la fecha (sin contar ese mismo día). */
async function recientesDe(ids, fecha) {
  const a = avisoRevisita(); if (!a.on || !ids.length) return {};
  const { data } = await db.rpc('actividades_recientes', { p_ids: ids, p_desde: isoMas(fecha, -(a.dias - 1)), p_hasta: isoMas(fecha, a.dias - 1) });
  const por = {};
  (data || []).filter(x => x.fecha !== fecha).forEach(x => (por[x.cuenta_id] = por[x.cuenta_id] || []).push(x));
  return por;
}
const txtReciente = l => l.map(x => `${x.tipo === 'visita' ? 'visitado' : 'cita'} el ${fechaCorta(x.fecha)}${x.usuario ? ' (' + x.usuario + ')' : ''}`).join(', ');

citaRepetida = (orig => async function (medicoId, fecha) {
  const r = await orig(medicoId, fecha);
  if (!r) return r;
  const por = await recientesDe([medicoId], fecha);
  const l = por[medicoId];
  if (!l || !l.length) return r;
  const op = await elegirOpcion('Ya se ha visto hace poco', `${txtReciente(l.slice(0, 3))}.\n\n¿Añades la cita igualmente?`,
    [{ k: 'no', t: 'Cancelar', cls: 'sec' }, { k: 'nomas', t: 'Sí, y no volver a avisarme', cls: 'sec' }, { k: 'si', t: 'Añadir igualmente' }]);
  if (!op) return null;
  if (op === 'nomas') { await guardarAvisoRevisita(Object.assign(avisoRevisita(), { on: false })); toast('Aviso desactivado. Puedes activarlo en Configuración → Rutas'); }
  return r;
})(citaRepetida);

// Plan de ruta: marca a quien ya se ha visto hace poco y permite quitarlo

// Preferencias: el aviso se puede activar, desactivar y ajustar

/* ---------------- servicios en Productos ---------------- */

let PSEC = 'productos';
let PRODF = {};   // v2.88.0: filtros por campos del producto (Clasificadores)
async function cargarProductosModulo() {
  const esAdmin = puede('administrar');
  vaciarModulos('v-productos');
  $('v-productos').innerHTML = `
    <div class="saludo"><div><h1>Productos</h1><div class="fecha">Catálogo de productos y servicios, con precios sin IVA y con IVA</div></div>
      <div class="acts" style="margin:0">${esAdmin ? `<button class="btn" id="prodnuevo">+ Nuevo ${PSEC === 'servicios' ? 'servicio' : 'producto'}</button>` : ''}</div></div>
    <div class="subnav"><button data-ps="productos" aria-pressed="${PSEC === 'productos'}">Productos</button>
      <button data-ps="servicios" aria-pressed="${PSEC === 'servicios'}">Servicios</button></div>
    <div id="vcuerpo"></div>`;
  $('v-productos').querySelectorAll('[data-ps]').forEach(b => b.onclick = () => { PSEC = b.dataset.ps; cargarProductosModulo(); });
  if ($('prodnuevo')) $('prodnuevo').onclick = () => PSEC === 'servicios' ? editorServicio(null) : editorProducto(null);
  if (PSEC === 'servicios') pintarServicios(); else pintarProductos();
}

async function pintarProductos() {
  const esAdmin = puede('administrar');
  cargando($('vcuerpo'), 'Cargando productos…');
  const { data } = await RPC_ORIG('productos_lista', { p_todos: esAdmin });
  // v2.88.0: filtros por campos (Clasificadores); la lista llega entera, así que se filtra aquí
  const l = (data || []).filter(p => (p.tipo || 'producto') === 'producto' && clasCumple(p.clasificadores, PRODF));
  const cpCols = clasVisibles('producto');
  $('vcuerpo').innerHTML = `<div class="panel">
    <div class="cuenta"><b>${num(l.filter(p => p.activo).length)}</b> ${l.filter(p => p.activo).length === 1 ? 'producto activo' : 'productos activos'}${l.some(p => !p.activo) ? ` · ${num(l.filter(p => !p.activo).length)} inactivos` : ''}</div>
    <div class="dgrid-wrap"><div class="dgrid prods">
      <div class="dh"><span></span><span>Producto</span><span>Referencia</span><span class="num">Sin IVA</span><span class="num">IVA</span><span class="num">Con IVA</span><span>Estado</span>${clasCabeceras(cpCols)}</div>
      ${l.map(p => `<button class="dr" data-prod="${p.id}" style="${p.activo ? '' : 'opacity:.55'}">
        <span><span class="pfoto" style="${p.foto_url ? `background-image:url('${esc(p.foto_url)}')` : ''}">${p.foto_url ? '' : '◧'}</span></span>
        <span><b>${esc(p.nombre)}</b><span class="sm">${esc(p.presentacion || 'Sin presentación')}</span></span>
        <span class="sm">${esc(p.referencia || '—')}</span><span class="num">${p.precio != null ? eurI(p.precio) : '—'}</span>
        <span class="num">${num(p.iva || 0)}%</span><span class="num"><b>${p.pvp != null ? eurI(p.pvp) : '—'}</b></span>
        <span><span class="pill ${p.activo ? 'p-est' : 'p-anu'}">${p.activo ? 'Activo' : 'Inactivo'}</span></span>${clasCeldas(cpCols, p.clasificadores)}</button>`).join('')
        || `<div class="vacio">${Object.keys(PRODF).length ? 'Ningún producto con estos filtros.' : 'Todavía no hay productos.'}</div>`}
    </div></div></div>`;
  clasRejilla($('vcuerpo').querySelector('.dgrid.prods'), cpCols.length);
  $('vcuerpo').querySelectorAll('[data-prod]').forEach(b => b.onclick = () => editorProducto(l.find(p => p.id === b.dataset.prod)));
}

async function pintarServicios() {
  const esAdmin = puede('administrar');
  cargando($('vcuerpo'), 'Cargando servicios…');
  const { data } = await RPC_ORIG('productos_lista', { p_todos: esAdmin });
  const l = (data || []).filter(p => p.tipo === 'servicio');
  $('vcuerpo').innerHTML = `<div class="panel">
    <div class="cuenta"><b>${num(l.filter(p => p.activo).length)}</b> servicios activos · Un pedido puede llevar un servicio (envío, portes urgentes…), que se suma con su propio IVA.</div>
    <div class="dgrid-wrap"><div class="dgrid servs">
      <div class="dh"><span>Servicio</span><span class="num">Sin IVA</span><span class="num">IVA</span><span class="num">Con IVA</span><span>En pedidos nuevos</span><span>Estado</span></div>
      ${l.map(p => `<button class="dr" data-serv="${p.id}" style="${p.activo ? '' : 'opacity:.55'}">
        <span><b>${esc(p.nombre)}</b></span><span class="num">${p.precio != null ? eurI(p.precio) : '—'}</span>
        <span class="num">${num(p.iva || 0)}%</span><span class="num"><b>${p.pvp != null ? eurI(p.pvp) : '—'}</b></span>
        <span>${p.por_defecto ? '<span class="pill p-est">Se propone por defecto</span>' : '<span class="vac">—</span>'}</span>
        <span><span class="pill ${p.activo ? 'p-est' : 'p-anu'}">${p.activo ? 'Activo' : 'Inactivo'}</span></span></button>`).join('') || '<div class="vacio">Todavía no hay servicios.</div>'}
    </div></div></div>`;
  $('vcuerpo').querySelectorAll('[data-serv]').forEach(b => b.onclick = () => editorServicio(l.find(p => p.id === b.dataset.serv)));
}

function editorServicio(s) {
  const esAdmin = puede('administrar');
  s = s || { iva: 21, activo: true };
  const ro = esAdmin ? '' : 'disabled';
  $('dbody').innerHTML = `
    <div class="fh"><div><h2>${s.id ? esc(s.nombre) : 'Nuevo servicio'}</h2>
      <div class="sm">Escribe el precio sin IVA o con IVA: el otro se calcula solo. En cada pedido se puede cambiar.</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <label for="svn">Nombre</label><input id="svn" value="${esc(s.nombre || '')}" placeholder="p. ej. Envío, Envío urgente" ${ro}>
    <div class="pvp">
      <div><label for="svs">Sin IVA (€)</label><input id="svs" type="number" step="0.01" min="0" value="${s.precio != null ? +(+s.precio).toFixed(4) : ''}" ${ro}></div>
      <div><label for="svi">IVA (%)</label><input id="svi" type="number" step="1" min="0" max="21" value="${s.iva != null ? s.iva : 21}" ${ro}></div>
      <div><label for="svc">Con IVA (€)</label><input id="svc" type="number" step="0.01" min="0" value="${s.precio != null ? r2(s.precio * (1 + (+s.iva || 0) / 100)) : ''}" ${ro}></div></div>
    <label class="opt" style="margin-top:12px"><input type="checkbox" id="svdef" ${s.por_defecto ? 'checked' : ''} ${ro}> Proponerlo por defecto en los pedidos nuevos</label>
    ${s.id ? `<label class="opt" style="margin-top:8px"><input type="checkbox" id="svact" ${s.activo ? 'checked' : ''} ${ro}> Activo</label>` : ''}
    <div class="acts" style="justify-content:flex-end"><button class="btn sec" data-cerrar>${esAdmin ? 'Cancelar' : 'Cerrar'}</button>
      ${esAdmin ? `<button class="btn" id="svok">${s.id ? 'Guardar' : 'Crear servicio'}</button>` : ''}</div>`;
  $('dlg').showModal();
  if (!esAdmin) return;
  const iva = () => (+$('svi').value || 0) / 100;
  $('svs').oninput = () => { $('svc').value = $('svs').value === '' ? '' : r2(+$('svs').value * (1 + iva())); };
  $('svc').oninput = () => { $('svs').value = $('svc').value === '' ? '' : +(+$('svc').value / (1 + iva())).toFixed(4); };
  $('svi').oninput = () => { if ($('svs').value !== '') $('svc').value = r2(+$('svs').value * (1 + iva())); };
  $('svok').onclick = async () => {
    if (!$('svn').value.trim()) { toast('Escribe el nombre', true); return; }
    const { data: r, error } = await db.rpc('guardar_producto', { p: { id: s.id || null, tipo: 'servicio', nombre: $('svn').value.trim(),
      precio: $('svs').value, iva: $('svi').value, por_defecto: $('svdef').checked, ...($('svact') ? { activo: $('svact').checked } : {}) } });
    if (error || (r && r.ok === false)) { toast('No se ha podido guardar', true); return; }
    $('dlg').close(); toast(s.id ? 'Servicio guardado' : 'Servicio creado');
    await cargarProductos(); if (TAB === 'productos') pintarServicios();
  };
}

/* ---------------- Rutas: resumen como pantalla de entrada ---------------- */

RSEC = 'inicio';

// v2.242.0: aquí iba resumenRutas (nadie la usaba)

/* ---------------- Inicio: mi semana, ventas, alertas y equipo ---------------- */


/* ---------------- ayudas ---------------- */

Object.assign(AYUDA, {
  productos: ['Productos y servicios', 'El catálogo que se usa en pedidos, muestras y analítica.', [
    '<b>Productos</b>: lo que se vende. Escribe el precio sin IVA o con IVA: el otro se calcula solo.',
    '<b>Servicios</b>: envío, portes urgentes… Un pedido puede llevar un servicio, que se suma con su propio IVA y no cuenta como unidades.',
    'Marca un servicio como «por defecto» para que se proponga en los pedidos nuevos.',
    'Un producto o servicio inactivo no aparece al crear pedidos, pero se conserva en el histórico.']]
});
AYUDA.inicio[2].push(`<b>Mi semana</b>, <b>Ventas del mes</b> y <b>Alertas</b> resumen lo importante. Administración y televenta ven además los cruces del equipo (${TT('medico', 'p', '', 'l', 'l')} en dos carteras, ${TT('visita', 'p', '', 'l', 'l')} a ${TT('medico', 'p', '', 'l', 'l')} de otra cartera…) y el cumplimiento del equipo.`);
AYUDA.rutas[2].unshift('La pestaña <b>Resumen</b> muestra tu día, las propuestas para hoy y tus rutas, con accesos directos a planificar.');


