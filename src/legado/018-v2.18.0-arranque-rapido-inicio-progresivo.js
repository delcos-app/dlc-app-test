/* ============================================================
   DLC OS 2.0 · v2.18.0 · Arranque rápido, Inicio progresivo,
   pedidos con IVA y borrador, productos, pacientes y agenda
   ============================================================ */

Object.assign(RPC_TTL, { clientes_lista: 30, responsable_de_cuenta: 60 });

/* ---------------- arranque: la app aparece al momento ----------------
   Si hay sesión guardada, se muestra la app con el último perfil conocido y se comprueba
   después. En la consola del navegador queda el tiempo de cada paso: [DLC OS] … ms */

const T0 = performance.now();
const marca = paso => console.info(`[App] ${paso} · ${Math.round(performance.now() - T0)} ms`);
const PKEY = 'dlc-perfil';
let APP_VISIBLE = false;

/* Entrada en la plataforma con el perfil de la persona.
   Reúne en una sola función lo que antes estaba repartido en 21 capas añadidas versión a versión,
   con el mismo orden de ejecución. */
function mostrarApp(perfil) {
  const p = perfil, pref = p.preferencias || {};

  // 1. Con el enlace de recuperación de contraseña no se abre la plataforma
  if (RECUPERANDO) { pantallaRecuperacion(); return; }

  // 2. Idioma del perfil (como mucho una recarga por sesión para aplicarlo)
  const idioma = pref.idioma || 'es';
  let guardado = 'es'; try { guardado = localStorage.getItem('app-idioma') || 'es'; } catch (e) {}
  if (idioma !== guardado) {
    let ya = false; try { ya = sessionStorage.getItem('app-idioma-recarga') === idioma; } catch (e) {}
    try { localStorage.setItem('app-idioma', idioma); sessionStorage.setItem('app-idioma-recarga', idioma); } catch (e) {}
    if (!ya) { location.reload(); return; }
  }
  prepararIdioma(idioma);

  const primera = !APP_VISIBLE;
  document.body.classList.remove('sin-sesion');

  // 3. Indicadores de Inicio guardados: se completan con los que se han añadido después
  if (Array.isArray(pref.kpis) && pref.kpis.length) {
    ['uds_mes', 'prescriptores', 'citas_7d', 'sin_visita_60'].forEach(id => { if (!pref.kpis.some(x => x.id === id)) pref.kpis.push({ id, on: true, t: '' }); });
    KPI_CAT.forEach(k => { if (!pref.kpis.some(x => x.id === k.id)) pref.kpis.push({ id: k.id, on: false, t: '' }); });
  }

  // 4. Datos de la persona y pantalla principal
  PERFIL = p;
  $('bootsplash').classList.add('hide');
  $('login').classList.add('hide');
  $('app').classList.remove('hide');
  $('av').textContent = iniciales(p.nombre);
  $('uname').textContent = nombrePila(p.nombre);
  $('umnom').textContent = p.nombre;
  $('umrol').textContent = p.rol + ' · ' + p.email;
  const h = new Date().getHours();
  $('hola').textContent = (h < 13 ? 'Buenos días' : h < 20 ? 'Buenas tardes' : 'Buenas noches') + ', ' + nombrePila(p.nombre);
  $('hoyfecha').textContent = fechaLarga(new Date()).replace(/^./, c => c.toUpperCase());
  $('nuevoBtn').classList.toggle('hide', !puedeCrear());
  $('dupBtn').classList.toggle('hide', !puede('administrar'));
  document.querySelectorAll('#nav [data-t="ventas"], #nav [data-t="pacientes"], #nav [data-t="productos"]').forEach(b => b.classList.toggle('hide', !veVentas()));
  if (!APP_VISIBLE) {
    APP_VISIBLE = true;
    cargarCatalogos();
    pintarRutaBarra();
    cargarInicio();
    cargarFiltros();
  }
  $('fcomwrap').classList.toggle('hide', !VE_TODO());
  if (VE_TODO()) cargarComerciales();
  cargarAjustes();
  if (EN_PRUEBAS) pintarFranjaPruebas();

  // 5. Barra inferior, «Entrar como», manual y módulos según permisos
  pintarBarraSuplantacion();
  pintarBnav();
  if (!$('manbtn')) {
    const ub = document.querySelector('[data-u="cfg"]');
    if (ub) ub.insertAdjacentHTML('beforebegin', '<button data-u="manual" id="manbtn">Manual de uso</button>');
  }
  document.querySelectorAll('[data-t="facturacion"]').forEach(b => b.classList.toggle('hide', !VE_TODO()));
  aplicarPermisosMenu();

  // 6. Médicos con acceso: solo ven su informe
  document.body.classList.toggle('modo-medico', puede('portal_prescriptor'));
  if (puede('portal_prescriptor')) {
    document.querySelectorAll('nav.main [data-t]').forEach(b => b.classList.add('hide'));
    let bi = document.querySelector('nav.main [data-t="informe"]');
    if (!bi) { document.querySelector('nav.main .in').insertAdjacentHTML('afterbegin', `<button data-t="informe" aria-selected="true">${puede('portal_centro') ? 'Mi centro' : 'Mi informe'}</button>`); bi = document.querySelector('nav.main [data-t="informe"]'); }
    bi.classList.remove('hide');
    if (!$('mdavisos')) $('ubtn').insertAdjacentHTML('beforebegin', '<button class="mdavisos" id="mdavisos" aria-label="Avisos"></button>');
    pintarAvisos();
    if ($('q')) $('q').closest('.gsearch').classList.add('hide');
    setTimeout(() => ir('informe'), 0);
  }

  // 7. Menú de usuario y marca de la empresa
  document.querySelectorAll('[data-u="adm"]').forEach(b => b.classList.add('hide'));
  aplicarMarca();
  const admin = puede('administrar');
  const pl = document.querySelector('[data-u="plan"]'); if (pl) pl.classList.toggle('hide', !admin);
  const em = document.querySelector('[data-u="empresa"]'); if (em) em.classList.toggle('hide', !admin);

  // 8. Notificaciones, módulo de inicio preferido y resumen del día
  setTimeout(refrescarCampana, 800);
  // v2.111.0: tras F5 se vuelve a la pantalla en la que se estaba (Ctrl+F5 entra de cero, por el inicio)
  const f5 = primera ? pantallaTrasF5() : null;
  if (f5) setTimeout(() => volverTrasF5(f5), 50);
  else if (primera && pref.inicio && pref.inicio !== 'inicio' && puedeModulo(pref.inicio)) setTimeout(() => ir(pref.inicio), 50);
  if (!puede('portal_prescriptor')) setTimeout(() => Promise.resolve(RPC_ORIG('avisos_del_dia', {})).then(r => { if (r && r.data && r.data.nuevo) refrescarCampana(); }, () => {}), 1500);

  // 9. Traducción, iconos y orden del menú
  if (MAPA_I18N) traducir(document.body);
  const m = $('manbtn'); if (m && !m.querySelector('svg')) m.insertAdjacentHTML('afterbegin', svgIco(ICON_NOM['book-open']) + ' ');
  setTimeout(iconosMenu, 0);
  setTimeout(() => { ordenarMenu(); botonCalidad(); }, 0);
}

function mostrarLogin(msg) {
  $('bootsplash').classList.add('hide');
  $('app').classList.add('hide');
  $('login').classList.remove('hide');
  if (msg) $('lmsg').textContent = msg;
  APP_VISIBLE = false;
}

async function arrancar() {
  marca('inicio del arranque');
  let guardado = null;
  try { guardado = JSON.parse(localStorage.getItem(PKEY) || 'null'); } catch (e) {}
  // v2.69.0: el perfil guardado solo sirve si ya trae sus capacidades y están los roles (si no, se espera al de la red)
  if (guardado && !Array.isArray(guardado.capacidades)) guardado = null;
  if (guardado && ROLES_DEF.length && ESTADOS_DEF.length && localStorage.getItem('dlc-os-sesion') && !APP_VISIBLE) {
    mostrarApp(guardado);
    marca('app visible con el perfil guardado');
  }

  const { data: { session } } = await db.auth.getSession();
  marca('sesión comprobada');
  if (!session) { if (!navigator.onLine && guardado && APP_VISIBLE) return;   // v2.259.0: sin conexión se sigue con el perfil guardado
    localStorage.removeItem(PKEY); mostrarLogin(); return; }

  const rolesListos = cargarRoles().catch(() => false);
  let { data: perfil, error } = await db.from('perfiles').select('*,capacidades').eq('id', session.user.id).single();
  // Un fallo de conexión no cierra la sesión: se reintenta y, si sigue fallando, se entra con el perfil guardado
  for (let i = 0; i < 2 && error && error.code !== 'PGRST116'; i++) {
    await new Promise(r => setTimeout(r, 1500));
    ({ data: perfil, error } = await db.from('perfiles').select('*,capacidades').eq('id', session.user.id).single());
  }
  if (error && error.code !== 'PGRST116' && guardado) { perfil = guardado; error = null; }
  marca('perfil recibido');
  if (error || !perfil || !perfil.activo) {
    // v2.117.0: si su empresa está bloqueada (prueba terminada o desactivada), se dice eso
    const { data: acc } = await Promise.resolve(RPC_ORIG('acceso_organizacion', {})).catch(() => ({ data: null }));
    localStorage.removeItem(PKEY);
    await db.auth.signOut();
    mostrarLogin(acc && acc.bloqueada ? (acc.motivo === 'prueba_terminada'
        ? `La prueba de ${acc.organizacion} terminó el ${fechaCorta(acc.prueba_hasta)}. Tus datos se conservan: escríbenos para seguir.`
        : `${acc.organizacion} está desactivada. Tus datos se conservan: escríbenos para volver a activarla.`)
      : perfil && !perfil.activo ? 'Tu usuario está desactivado.'
      : 'Tu usuario no tiene perfil en la plataforma. Avisa a administración.');
    return;
  }
  try { localStorage.setItem(PKEY, JSON.stringify(perfil)); } catch (e) {}
  if (!(await rolesListos) && !(ROLES_DEF.length && ESTADOS_DEF.length)) await cargarRoles().catch(() => false);
  const cambio = !guardado || JSON.stringify(guardado) !== JSON.stringify(perfil);
  if (!APP_VISIBLE) mostrarApp(perfil);
  else if (cambio) { mostrarApp(perfil); if (TAB === 'inicio') cargarInicio(); }
  db.rpc('registrar_acceso', { p_evento: 'Entrada', p_agente: navigator.userAgent }).catch(() => {});
}

/* ---------------- inicio: esqueleto y carga por partes ---------------- */

const skelCard = t => `<h2>${esc(t)}</h2><div class="skel" style="width:45%"></div><div class="skel"></div><div class="skel" style="width:70%"></div>`;

/* pintarInicio: la parte base y, en orden, cada paso que se le añade (antes eran 5 capas separadas). */
async function pintarInicio() {
  await pintarInicioBase();
  await inicioResumenSemanaYVentas();
  await inicioOperativaPedidos();
  await inicioVistazoEIndicadores();
  await inicioLlamadasHoy();
  await inicioFiltrarAlertas();
}

async function inicioResumenSemanaYVentas() {
  if (TAB !== 'inicio') return;
  if (!$('iniextra')) $('kpis').insertAdjacentHTML('afterend', '<div class="iniextra" id="iniextra"></div>');
  const cont = $('iniextra');
  const esTop = VE_TODO();
  const desde = lunesDe(hoyISO()), hoy = hoyISO();
  const mesIni = hoy.slice(0, 8) + '01', ant = new Date(mesIni + 'T12:00:00'); ant.setMonth(ant.getMonth() - 1);
  const antIni = fechaLocal(ant), antFin = isoMas(mesIni, -1);
  const antMismoDia = isoMas(antIni, +hoy.slice(8, 10) - 1) > antFin ? antFin : isoMas(antIni, +hoy.slice(8, 10) - 1);
  cont.innerHTML = ['Mi semana'].concat(puedeModulo('ventas') ? ['Ventas del mes'] : [], ['Alertas'], esTop ? ['Equipo esta semana'] : []).map(t => `<div class="card">${skelCard(t)}</div>`).join('');
  const [sem, v1, v0, mias, cruce, equipo, toca] = await Promise.all([
    RPC_ORIG('agenda_rango', { p_desde: desde, p_hasta: isoMas(desde, 6), p_usuario: PERFIL.id }).then(r => r.data || []),
    db.rpc('analitica_v2', { p_dim: 'producto', p_desde: mesIni, p_hasta: hoy }).then(r => (r.data || {}).totales || {}),
    db.rpc('analitica_v2', { p_dim: 'producto', p_desde: antIni, p_hasta: antMismoDia }).then(r => (r.data || {}).totales || {}),
    db.rpc('alertas_mias').then(r => r.data || []),
    esTop ? Promise.all([db.rpc('alertas_cruce', { p_dias: 30 }), puedeCompras() || VE_TODO() ? db.rpc('alertas_stock') : Promise.resolve({ data: [] })])
      .then(([a, b]) => (a.data || []).concat(b.data || [])) : Promise.resolve([]),
    esTop ? db.rpc('supervision_equipo', { p_desde: desde, p_hasta: isoMas(desde, 6) }).then(r => r.data || []) : Promise.resolve([]),
    db.rpc('toca_actividad', { p_usuario: PERFIL.id, lim: 300 }).then(r => (r.data || []).length)
  ]);
  if (TAB !== 'inicio' || !$('iniextra')) return;
  const pasadas = sem.filter(c => c.fecha < hoy && !['Descartada'].includes(c.estado));
  const cerradasOk = pasadas.filter(c => c.estado === 'Visitada').length;
  const cumple = pasadas.length ? Math.round(cerradasOk / pasadas.length * 100) : null;
  const semVis = sem.filter(c => c.estado === 'Visitada').length, semPend = sem.filter(c => CITA_ABIERTA.includes(c.estado) && c.fecha >= hoy).length;
  const delta = (a, b) => !b ? '' : `<span class="delta ${a >= b ? 'up' : 'down'}">${a >= b ? '▲' : '▼'} ${Math.abs(Math.round((a - b) / b * 100))}%</span>`;
  const alertas = cruce.map(x => Object.assign({ equipo: true }, x)).concat(mias);
  const eqTot = equipo.reduce((t, x) => { ['visitadas', 'no_estaba', 'aplazadas', 'sin_hacer', 'atrasados'].forEach(k => t[k] = (t[k] || 0) + (+x[k] || 0)); return t; }, {});
  const eqBase = (eqTot.visitadas || 0) + (eqTot.no_estaba || 0) + (eqTot.aplazadas || 0) + (eqTot.sin_hacer || 0);
  cont.innerHTML = `
    <div class="card"><h2>Mi semana</h2>
      <div class="minis"><div><b>${num(semVis)}</b><span>visitadas</span></div><div><b>${num(semPend)}</b><span>por hacer</span></div>
        <div><b style="${cumple != null && cumple < 60 ? 'color:var(--warn)' : ''}">${cumple == null ? '—' : cumple + '%'}</b><span>cumplimiento</span></div>
        <div><b style="${toca ? 'color:var(--warn)' : ''}">${num(toca)}</b><span>les toca ${TT('visita', 's', '', 'l', 'l')}</span></div></div>
      <div class="acts" style="padding:0 16px 14px"><button class="btn sec" data-inisem="semana">Ver mi semana</button>${toca ? '<button class="btn sec" data-inisem="plan">Planificarlos</button>' : ''}</div></div>
    ${puedeModulo('ventas') ? `<div class="card"><h2>Ventas del mes</h2>
      <div class="minis"><div><b>${num(v1.unidades || 0)}</b><span>unidades ${delta(+v1.unidades || 0, +v0.unidades || 0)}</span></div>
        ${verImportes() ? `<div><b>${eurI(v1.importe || 0)}</b><span>sin IVA ${delta(+v1.importe || 0, +v0.importe || 0)}</span></div>` : ''}
        <div><b>${num(v1.medicos || 0)}</b><span>${TT('medico', 'p', '', 'l', 'l')} con ventas</span></div></div>
      <p class="sm" style="padding:0 16px 14px">Comparado con los mismos días del mes anterior (${num(v0.unidades || 0)} unidades).</p></div>` : ''}
    <div class="card"><h2>Alertas<span class="n">${alertas.reduce((n, a) => n + a.n, 0)}</span></h2>
      ${alertas.length ? `<div class="lista">${alertas.map((a, i) => `<details class="alerta2 ${a.gravedad || ''}">
        <summary><span class="an">${num(a.n)}</span> ${esc(a.titulo)}${a.equipo ? ' <span class="pill p-per">equipo</span>' : ''}</summary>
        <div>${(a.items || []).map(it => `<button class="item" ${a.tipo === 'pedido_sin_medico' ? `data-iniped="${it.id}"` : a.tipo === 'citas_sin_hacer' ? ''
          : ['stock_pedir', 'stock_minimo', 'caducidad', 'sin_lote'].includes(a.tipo) ? 'data-inistock="1"' : a.tipo === 'compra_retrasada' ? `data-inicomp="${it.id}"` : `data-inificha="${it.id}"`} style="padding:6px 8px">
          <span class="tx"><b>${esc(it.nombre)}</b><span class="sm">${esc(it.quien || '')}</span></span></button>`).join('')}
          ${a.n > (a.items || []).length ? `<div class="sm" style="padding:4px 8px">y ${num(a.n - a.items.length)} más</div>` : ''}</div></details>`).join('')}</div>`
        : '<div class="vacio">Todo en orden: no hay cruces ni pendientes.</div>'}</div>
    ${esTop ? `<div class="card"><h2>Equipo esta semana</h2>
      <div class="minis"><div><b>${eqBase ? Math.round((eqTot.visitadas || 0) / eqBase * 100) + '%' : '—'}</b><span>cumplimiento</span></div>
        <div><b>${num(eqTot.visitadas || 0)}</b><span>visitadas</span></div>
        <div><b style="${eqTot.sin_hacer ? 'color:var(--warn)' : ''}">${num(eqTot.sin_hacer || 0)}</b><span>sin hacer</span></div>
        <div><b style="${eqTot.atrasados ? 'color:var(--warn)' : ''}">${num(eqTot.atrasados || 0)}</b><span>les toca</span></div></div>
      <div class="acts" style="padding:0 16px 14px"><button class="btn sec" id="iniequipo">Ver el equipo</button></div></div>` : ''}`;
  cont.querySelectorAll('[data-inificha]').forEach(b => b.onclick = () => abrirFicha(b.dataset.inificha));
  cont.querySelectorAll('[data-iniped]').forEach(b => b.onclick = () => verPedido(b.dataset.iniped));
  cont.querySelectorAll('[data-inistock]').forEach(b => b.onclick = () => { PSEC = 'stock'; ir('productos'); });
  cont.querySelectorAll('[data-inicomp]').forEach(b => b.onclick = () => editorCompra(b.dataset.inicomp));
  cont.querySelectorAll('[data-inisem]').forEach(b => b.onclick = () => {
    AG_MODO = 'semana'; AG_FECHA = hoyISO(); ir('agenda');
    if (b.dataset.inisem === 'plan') setTimeout(() => $('semplan') && $('semplan').click(), 900);
  });
  if ($('iniequipo')) $('iniequipo').onclick = () => { AG_MODO = 'equipo'; ir('agenda'); };
}

async function inicioOperativaPedidos() {
  if (TAB !== 'inicio' || !$('iniextra') || !(VE_TODO() && nivelDe2('V') >= 1)) return;
  const { data } = await RPC_ORIG('operativa_pendiente', {});
  const d = data || {}, n = k => (d[k] || []).length;
  if (!(n('pago') + n('paquete') + n('email_factura') + n('email_pago')) || $('iniops')) return;
  $('iniextra').insertAdjacentHTML('afterbegin', `<div class="card" id="iniops"><h2>Operativa de pedidos</h2>
    <div class="opfilas">${[[n('pago'), 'pendientes de cobro', n('pago') ? 'aviso' : ''], [n('paquete'), 'paquetes por preparar', ''],
      [n('email_factura') + n('email_pago'), 'emails por enviar', '']].map(([v, t, c]) =>
      `<button class="opfila" data-opver><b class="${c}">${num(v)}</b><span>${t}</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></button>`).join('')}</div></div>`);
  $('iniops').querySelectorAll('[data-opver]').forEach(b => b.onclick = () => { PEDSEC = 'ventas'; ir('ventas'); });
}

async function inicioVistazoEIndicadores() {
  if (TAB !== 'inicio') return;
  // El aviso de duplicados ya está como indicador: se quita el cartel repetido
  document.querySelectorAll('#v-inicio .avisoh').forEach(a => { if (/unificar|duplicad/i.test(a.textContent)) a.remove(); });
  vistazoHoy();
  indicadoresCompletos();
}

async function inicioLlamadasHoy() {
  if (TAB !== 'inicio' || !VE_TODO() || !hayOportunidades() || !$('iniextra') || $('inillam')) return;
  const { data } = await RPC_ORIG('llamadas_seguimiento', {});
  const hoy = hoyISO(), pend = (data || []).filter(x => x.proxima_fecha <= hoy);
  if (!pend.length || $('inillam')) return;
  $('iniextra').insertAdjacentHTML('afterbegin', `<div class="card" id="inillam"><h2>Volver a llamar hoy<span class="n">${pend.length}</span></h2>
    <p class="sm" style="padding:0 16px">Clientes a los que quedaste en volver a llamar${pend.some(x => x.proxima_fecha < hoy) ? ', algunas atrasadas' : ''}.</p>
    <div class="acts" style="padding:0 16px 14px"><button class="btn sec" id="inillamver">Ver oportunidades</button></div></div>`);
  $('inillamver').onclick = () => { PEDSEC = 'llamadas'; ir('ventas'); };
}

async function inicioFiltrarAlertas() {
 if (TAB === 'inicio') await filtrarAlertasInicio();
}

async function pintarInicioBase() {
  const sec = $('v-inicio');
  sec.classList.remove('ini-cargando');
  if (!$('inialerta')) sec.querySelector('.saludo').insertAdjacentHTML('afterend', '<div id="inialerta"></div>');
  const esAdmin = puede('administrar');
  const cfg = kpiConfig().filter(x => x.on);

  // Cada bloque se pinta en cuanto llegan sus datos; mientras, se ve su esqueleto.
  const pComision = tarjetaComision().catch(() => {});
  const pRutas = tarjetasRuta().catch(() => {});
  const res = await rpcCache('panel_inicio', { lim: 6 }, 'inicio');
  marca('datos de Inicio recibidos');

  const data = res.data;
  if (!data) { $('c-agenda').innerHTML = '<h2>Tu agenda de hoy</h2><div class="vacio">Sin conexión y sin copia guardada todavía.</div>'; return; }
  const k = data.kpis;

  const avisoDup = () => {
    const nPend = (DUP_RES && DUP_RES.pendientes) || k.pendientes_unificar || 0;
    const nPar = (DUP_RES && DUP_RES.parecidos) || 0;
    $('inialerta').innerHTML = esAdmin && (nPend || nPar) ? `<div class="alerta">
        <span>⚠ ${[nPend ? `${num(nPend)} ${nPend === 1 ? 'ficha pendiente' : 'fichas pendientes'} de unificar` : '',
                  nPar ? `${num(nPar)}${nPar >= 200 ? '+' : ''} ${nPar === 1 ? 'posible duplicado' : 'posibles duplicados'} por nombre` : '']
                  .filter(Boolean).join(' y ')}</span>
        <button class="btn chico" data-k="dups">Revisar duplicados</button></div>` : '';
  };
  avisoDup();
  if (esAdmin) db.rpc('resumen_duplicados').then(r => { DUP_RES = r.data || null; avisoDup(); }).catch(() => {});

  const kpi = (n, t, cls, accion, ayuda, id) =>
    `<div class="kpi ${cls || ''} ${accion ? 'click' : ''}" ${accion ? `data-k="${accion}"` : ''} ${id ? `data-kid="${id}"` : ''}>
       ${ayuda ? `<button class="ai" data-ayuda-txt="${esc(ayuda)}" data-ayuda-tit="${esc(t)}" aria-label="Qué es">i</button>` : ''}
       <b>${typeof n === 'string' ? n : num(n)}</b><span>${esc(t.charAt(0).toUpperCase() + t.slice(1))}</span></div>`;

  $('kpis').innerHTML = cfg.map((x, i) => {
    if (x.filtro) return `<div class="kpi click" data-kf="${esc(JSON.stringify(x.filtro))}" data-kfi="${i}">
        <button class="ai" data-ayuda-txt="${esc(AYUDA_KPI.filtro + ' Filtro: ' + textoFiltro(x.filtro) + '.')}" data-ayuda-tit="${esc(x.t || 'Filtro guardado')}" aria-label="Qué es">i</button>
        <b class="cont"><span class="spin" style="width:18px;height:18px;border-width:2px;display:inline-block"></span></b><span>${esc(x.t || textoFiltro(x.filtro))}</span></div>`;
    const c = KPI_CAT.find(y => y.id === x.id);
    if (!kpiPermitido(c)) return '';
    return kpi(c.v(k), x.t || c.t, c.cls ? c.cls(k) : '', c.h, AYUDA_KPI[c.id], c.id);
  }).join('');
  if (res.cache) avisoCache($('kpis'), res.fecha);
  cfg.forEach((x, i) => {
    if (!x.filtro) return;
    contarFiltro(x.filtro).then(n => {
      const b = document.querySelector(`#kpis [data-kfi="${i}"] .cont`); if (b) b.textContent = num(n);
    }).catch(() => {});
  });

  tarjeta($('c-agenda'), 'Tu agenda de hoy', data.agenda_hoy.length,
    data.agenda_hoy.map(a => itemHTML(a.cuenta_id, a.hora ? esc(a.hora).slice(0, 5) : '·',
      a.estado === 'Visitada' ? 'o' : '', a.nombre,
      `${esc(a.centro_nombre || '')} · <b style="color:${a.estado === 'Visitada' ? 'var(--ok)' : 'var(--navy)'}">${esc(a.estado)}</b>`)),
    '', 'No tienes citas para hoy. En Agenda tienes sugerencias para el día.');
  tarjeta($('c-acciones'), 'Próximas acciones', data.acciones.length,
    data.acciones.map(a => itemHTML(a.cuenta_id, '↻', a.proxima_fecha < hoyISO() ? 'w' : '', a.nombre,
      `<b style="color:${a.proxima_fecha < hoyISO() ? 'var(--warn)' : 'var(--navy)'}">${fechaCorta(a.proxima_fecha)}</b> · ${esc(a.proxima_accion || 'Seguimiento')}`)),
    '', 'Sin acciones pendientes en los próximos 7 días.');
  tarjeta($('c-urgentes'), 'Urgentes sin visitar', k.urgentes,
    data.urgentes.map(u => itemHTML(u.cuenta_id, '!', 'w', u.nombre,
      `${esc(u.especialidad || '')} · ${esc(u.centro_nombre || u.municipio || '')}`)),
    k.urgentes > 6 ? `<button class="verlo" data-k="urgentes">Ver los ${num(k.urgentes)} urgentes</button>` : '',
    'Todos los urgentes están visitados.');
  tarjeta($('c-ultimas'), `${TT('visita', 'p', 'ultimo', 'C', 'l')}`, null,
    data.ultimas_visitas.map(v => itemHTML(v.cuenta_id, '✓', 'o', v.nombre,
      `${fechaCorta(v.fecha)} · ${esc((v.resultados || []).join(' + ') || 'Sin resultado')}`)),
    '', `Todavía no hay ${TT('visita', 'p', '', 'l', 'l', 'registrado')}.`);
  ponerAyudas();
  await Promise.all([pComision, pRutas]);
  marca('Inicio completo');
}

/* ---------------- cálculos de IVA ---------------- */

const r2 = n => Math.round((+n || 0) * 100) / 100;
const eurI = n => eur(r2(n));

/** Mismo cálculo que la base de datos: descuento de línea, descuento general y luego IVA. */

function lineaDesglose(l) {
  const bruto = +l.importe || 0, base = bruto * (1 - (+l.descuento || 0) / 100), iva = base * (+l.iva || 0) / 100;
  return { bruto, base, iva, total: base + iva };
}


/* ---------------- ventas: pedidos, pacientes y productos ---------------- */

let VSEC = 'pedidos';
const PAC = { q: '', medico: null, medicoNombre: '', pagina: 0 };
const pillEstado = e => `<span class="pill ${e === 'Borrador' ? 'p-bor' : e === 'Anulado' ? 'p-anu' : 'p-est'}">${esc(e)}</span>`;



/* ---------------- editor de pedido ---------------- */

async function editorPedido(pedido) {
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

/* ---------------- detalle de pedido ---------------- */

// (v2.183.0: aquí iba la primera versión de ventanaCargando; se redefine entera más abajo)
/* Ver pedido: la ventana base, sus facturas (o emitirla) y la operativa (antes eran 4 capas). */
async function verPedido(id) {
  return ventanaCargando(async () => {
    await verPedidoBase(id);
    await pedidoFacturas(id);
    await pedidoOperativa(id);
    await pedidoPago(id);
  });
}

// Ver pedido · Facturas del pedido, o botón para emitirla
async function pedidoFacturas(id) {
  if (!VE_TODO() || !$('dlg').open) return;
  const acts = $('dbody').querySelector('.acts:last-of-type'); if (!acts) return;
  const { data } = await RPC_ORIG('pedido_detalle', { p_id: id });
  const p = data && data.pedido; if (!p) return;
  const { data: fs } = await db.from('facturas').select('id,numero,pedido_id').eq('pedido_id', id);   // v2.350.0: solo las de este pedido
  const fac = fs || [];
  if (fac.length) {
    acts.insertAdjacentHTML('afterbegin', fac.map(f => `<button class="btn sec" data-pvfac="${f.id}">🧾 ${esc(f.numero)}</button>`).join(''));
    acts.querySelectorAll('[data-pvfac]').forEach(b => b.onclick = () => verFactura(b.dataset.pvfac));
  } else if (p.estado === 'Confirmado' && !p.sin_cargo && puedeFacturar()) {
    acts.insertAdjacentHTML('afterbegin', '<button class="btn" id="pvemitir">🧾 Ver la factura</button>');   // v2.339.0: primero la vista previa
    acts.querySelector('#pvemitir').onclick = () => previaFacturaPedido(id);
  }
}

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

/* Parte base; verPedido le añade el resto */
async function verPedidoBase(id) {
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

/* ---------------- pacientes ---------------- */

let FICHA_PAC = null;




async function fichaPaciente(id) {
  FICHA_PAC = id; FICHA_ID = null;
  $('fbody').innerHTML = '<div class="skel" style="width:50%"></div><div class="skel"></div><div class="skel" style="width:80%"></div>';
  if (!$('ficha').open) $('ficha').showModal();
  const { data } = await RPC_ORIG('contacto_detalle', { p_id: id });
  if (FICHA_PAC !== id) return;
  if (!data || !data.contacto) { $('fbody').innerHTML = `<div class="vacio">No se ha encontrado ${TT('paciente', 's', 'el', 'l', 'l')}.</div>`; return; }
  const c = data.contacto, m = data.medico, ped = data.pedidos || [];
  const validos = ped.filter(p => p.estado !== 'Anulado' && p.estado !== 'Borrador');
  const permitido = puedeVentas();

  $('fbody').innerHTML = `
    <div class="fh"><div><h2>${esc(c.nombre)}</h2><div class="sm">${TT('paciente', 's', '', 'l', 'C')}${c.nif ? ' · NIF ' + esc(c.nif) : ''}</div></div>
      <button class="x" id="fpx" aria-label="Cerrar">✕</button></div>
    ${permitido ? `<div class="acts"><button class="btn" id="fpnped">+ Nuevo pedido</button>
      <button class="btn sec" id="fpedit">Editar datos</button></div>` : ''}
    <div class="kpis" style="margin:10px 0 0;grid-template-columns:repeat(3,minmax(0,1fr))">
      <div class="kpi"><b>${num(validos.length)}</b><span>pedidos</span></div>
      <div class="kpi"><b>${num(data.total_unidades)}</b><span>unidades</span></div>
      <div class="kpi"><b>${eurI(validos.reduce((n, p) => n + (+p.total || 0), 0))}</b><span>con IVA</span></div></div>
    <div class="blk"><h3>${TT('medico', 's', '', 'l', 'C')} que lo trata</h3>
      ${m ? `<div><button class="kcfg" data-fpmed="${m.id}" style="font-size:15px">${esc(m.nombre)}</button>
          <span class="sm"> · código ${esc(m.codigo)}${m.especialidad ? ' · ' + esc(m.especialidad) : ''}</span></div>
        <div class="sm">${m.comercial ? 'Comercial: ' + esc(m.comercial) : 'Sin comercial asignado'}</div>`
        : `<div class="sm">Sin ${TT('medico', 's', '', 'l', 'l', 'asignado')}. Las unidades de ${TT('paciente', 's', 'este', 'l', 'l')} no se atribuyen a nadie hasta que lo asignes.</div>`}
      ${permitido ? `<label>${m ? `Cambiar de ${TT('medico', 's', '', 'l', 'l')}` : `Asignar ${TT('medico', 's', '', 'l', 'l')}`}</label><div id="fpsel"></div>
        ${m ? `<div class="acts"><button class="btn sec" id="fpmedquitar">Quitar ${TT('medico', 's', '', 'l', 'l')}</button></div>` : ''}` : ''}
    </div>
    <div class="blk"><h3>Contacto</h3>
      ${[['Teléfono', c.telefono], ['Móvil', c.movil], ['Email', c.email],
         ['Dirección', [c.direccion, c.cp, c.municipio, c.provincia].filter(Boolean).join(', ')], ['Nota', c.nota]]
        .filter(x => x[1]).map(([k, v]) => `<div class="sm"><b style="color:var(--ink)">${k}:</b> ${esc(v)}</div>`).join('')
        || '<div class="sm">Sin datos de contacto.</div>'}</div>
    <div class="blk"><h3>Pedidos</h3>
      ${ped.map(p => `<button class="item" data-fpped="${p.id}" style="padding:8px 4px">
        <span class="tx"><b>${fechaCorta(p.fecha)} · ${esc(p.productos || 'Sin productos')}</b>
          <span class="sm">${num(p.unidades)} uds. · ${eurI(p.total)} con IVA${p.medico ? ' · ' + esc(p.medico) : ''}</span></span>
        ${pillEstado(p.estado)}</button>`).join('') || '<div class="sm">Todavía no tiene pedidos.</div>'}</div>`;

  $('fpx').onclick = () => { FICHA_PAC = null; $('ficha').close(); };
  $('fbody').querySelectorAll('[data-fpped]').forEach(b => b.onclick = () => verPedido(b.dataset.fpped));
  const bm = $('fbody').querySelector('[data-fpmed]');
  if (bm) bm.onclick = () => { FICHA_PAC = null; abrirFicha(bm.dataset.fpmed); };
  if ($('fpnped')) $('fpnped').onclick = () => nuevaVenta({ contacto: Object.assign({}, c, m ? { medico: m.nombre, medico_codigo: m.codigo } : {}), medico: m ? { id: m.id, nombre: m.nombre } : null });
  if ($('fpedit')) $('fpedit').onclick = () => editorContacto(c, () => fichaPaciente(id));
  const asignar = async medicoId => {
    const { data: r, error } = await db.rpc('asignar_cuenta_cliente', { p_contacto: id, p_medico: medicoId });
    if (error || (r && r.ok === false)) { toast('No se ha podido guardar', true); return; }
    toast(medicoId ? `${TT('medico', 's', '', 'l', 'C', 'asignado')}` : `${TT('medico', 's', '', 'l', 'C', 'quitado')}`); fichaPaciente(id);
    if (TAB === 'pacientes') listaPacientes();
  };
  if ($('fpmedquitar')) $('fpmedquitar').onclick = () => asignar(null);
  if ($('fpsel')) selectorMedico($('fpsel'), { valor: null, placeholder: `Busca ${TT('medico', 's', 'el', 'l', 'l')} por nombre, centro o municipio`, alElegir: x => { if (x) asignar(x.id); } });
}

/* ---------------- productos ---------------- */


function editorProducto(p) {
  const esAdmin = puede('administrar');
  p = p || { iva: 10, activo: true, unidades_envase: 1 };
  const ro = esAdmin ? '' : 'disabled';
  $('dbody').innerHTML = `
    <div class="fh"><div><h2>${p.id ? esc(p.nombre) : 'Nuevo producto'}</h2>
      <div class="sm">${esAdmin ? 'Escribe el precio sin IVA o con IVA: el otro se calcula solo.' : 'Solo administración puede cambiar productos.'}</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <div style="display:flex;gap:14px;align-items:center;margin-top:8px">
      <span class="pfoto" id="prfprev" style="width:72px;height:72px;${p.foto_url ? `background-image:url('${esc(p.foto_url)}')` : ''}">${p.foto_url ? '' : '◧'}</span>
      ${esAdmin ? '<div style="flex:1"><label for="prfoto" style="margin-top:0">Foto</label><input id="prfoto" type="file" accept="image/*"></div>' : ''}</div>
    <div class="g2">
      <div><label for="prn">Nombre</label><input id="prn" value="${esc(p.nombre || '')}" ${ro}></div>
      <div><label for="prp">Presentación</label><input id="prp" value="${esc(p.presentacion || '')}" placeholder="Caja de 30 sobres" ${ro}></div></div>
    <div class="pvp">
      <div><label for="prpr">Precio sin IVA (€)</label><input id="prpr" type="number" step="0.01" min="0" value="${p.precio != null ? +(+p.precio).toFixed(4) : ''}" ${ro}></div>
      <div><label for="priva">IVA (%)</label><input id="priva" type="number" step="1" min="0" max="21" value="${p.iva != null ? p.iva : 10}" ${ro}></div>
      <div><label for="prpvp">Precio con IVA (€)</label><input id="prpvp" type="number" step="0.01" min="0" value="${p.precio != null ? r2(p.precio * (1 + (+p.iva || 0) / 100)) : ''}" ${ro}></div></div>
    <div class="g2">
      <div><label for="prref">Referencia</label><input id="prref" value="${esc(p.referencia || '')}" ${ro}></div>
      <div><label for="prcb">Código de barras</label><input id="prcb" value="${esc(p.codigo_barras || '')}" ${ro}></div></div>
    <div class="g2">
      <div><label for="prue">Unidades por envase</label><input id="prue" type="number" min="1" value="${p.unidades_envase || 1}" ${ro}></div>
      <div><label for="prco">Coste (€, sin IVA)</label><input id="prco" type="number" step="0.01" min="0" value="${p.coste != null ? p.coste : ''}" ${ro}></div></div>
    ${esAdmin && p.id ? `<label class="opt" style="margin-top:12px"><input type="checkbox" id="pract" ${p.activo ? 'checked' : ''}> Activo: aparece al crear pedidos</label>` : ''}
    <div class="acts" style="justify-content:flex-end">
      <button class="btn sec" data-cerrar>${esAdmin ? 'Cancelar' : 'Cerrar'}</button>
      ${esAdmin ? `<button class="btn" id="prok">${p.id ? 'Guardar' : 'Crear producto'}</button>` : ''}</div>`;
  $('dlg').showModal();
  if (!esAdmin) return;

  const iva = () => (+$('priva').value || 0) / 100;
  $('prpr').oninput = () => { $('prpvp').value = $('prpr').value === '' ? '' : r2(+$('prpr').value * (1 + iva())); };
  $('prpvp').oninput = () => { $('prpr').value = $('prpvp').value === '' ? '' : +(+$('prpvp').value / (1 + iva())).toFixed(4); };
  $('priva').oninput = () => { if ($('prpr').value !== '') $('prpvp').value = r2(+$('prpr').value * (1 + iva())); };
  $('prfoto').onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    $('prfprev').style.backgroundImage = `url('${URL.createObjectURL(f)}')`; $('prfprev').textContent = '';
  };
  camposInsertar($('dbody'), 'producto', p.id, $('prok') && $('prok').closest('.acts'));
  $('prok').onclick = async ev => {
    if (!$('prn').value.trim()) { toast('Escribe el nombre', true); return; }
    const cps = camposLeer($('dbody'));
    if (cps && cps.falta.length) { toast(`Rellena «${cps.falta[0]}»`, true); return; }
    ev.target.disabled = true; ev.target.textContent = 'Guardando…';
    let foto_url;
    const f = $('prfoto').files && $('prfoto').files[0];
    if (f) {
      const ruta = 'p-' + Date.now() + '-' + f.name.replace(/[^a-zA-Z0-9.]/g, '');
      const { error: eu } = await db.storage.from('productos').upload(ruta, f, { upsert: true });
      if (!eu) foto_url = db.storage.from('productos').getPublicUrl(ruta).data.publicUrl;
      else toast('La foto no se ha podido subir: ' + eu.message, true);
    }
    const { data: r, error } = await db.rpc('guardar_producto', { p: {
      id: p.id || null, nombre: $('prn').value.trim(), presentacion: $('prp').value.trim(),
      precio: $('prpr').value, iva: $('priva').value, referencia: $('prref').value.trim(),
      codigo_barras: $('prcb').value.trim(), unidades_envase: $('prue').value, coste: $('prco').value,
      ...(foto_url ? { foto_url } : {}), ...($('pract') ? { activo: $('pract').checked } : {}) } });
    ev.target.disabled = false; ev.target.textContent = p.id ? 'Guardar' : 'Crear producto';
    if (error || (r && r.ok === false)) { toast('No se ha podido guardar: ' + ((error && error.message) || (r && r.error) || ''), true); return; }
    if (cps && !(await camposGuardar(cps, (r && r.id) || p.id))) return;
    $('dlg').close(); toast(p.id ? 'Producto guardado' : 'Producto creado');
    await cargarProductos(); if (TAB === 'productos') pintarProductos();
  };
}

/* ---------------- ficha del médico: comercial y pacientes ---------------- */


/* ---------------- agenda: sugerencias para el día ---------------- */



/* ---------------- ayudas nuevas ---------------- */

Object.assign(AYUDA, {
  ventas: ['Ventas', `Pedidos, ${TT('paciente', 'p', '', 'l', 'l')} y productos.`, [
    'Los pedidos se guardan como <b>borrador</b> (editable y se puede eliminar; no cuenta en métricas) o se <b>confirman</b> (cuenta en métricas y comisiones; solo se puede anular).',
    'Los importes van sin IVA; el IVA de cada producto se suma aparte y se ve el total.',
    `La venta a ${TT('paciente', 's', '', 'l', 'l')} se atribuye ${TT('medico', 's', 'al', 'l', 'l', 'indicado')} y al comercial que lo tenía asignado en ese momento.`,
    'La venta a centro se atribuye a la ficha del centro, si la tiene; si no, a nadie.',
    `Si un pedido no tiene ${TT('medico', 's', '', 'l', 'l', 'reconocido')}, se puede encontrar filtrando la lista de pedidos para asignarlo a mano.`]],
  pacientes: [`${TT('paciente', 'p', '', 'l', 'C')}`, `Las personas que compran con ${TT('medico', 's', 'un', 'l', 'l')} de referencia.`, [
    `Cada ${TT('paciente', 's', '', 'l', 'l')} puede tener un <b>${TT('medico', 's', '', 'l', 'l')} que lo trata</b>: se asigna solo con su primer pedido o a mano desde su ficha.`,
    `Desde la ficha ves sus pedidos, unidades e importe, y creas un pedido nuevo con ${TT('medico', 's', 'el', 'l', 'l')} ya puesto.`,
    `En la ficha de ${TT('medico', 's', 'un', 'l', 'l')} verás sus ${TT('paciente', 'p', '', 'l', 'l')}.`]],
  productos: ['Productos', 'El catálogo que se usa en pedidos, muestras y analítica.', [
    'Escribe el precio sin IVA o con IVA: el otro se calcula con el IVA del producto.',
    'Un producto inactivo no aparece al crear pedidos, pero se conserva en el histórico.']],
  agenda: ['Agenda', 'Tus citas por día, semana o mes.', [
    `«+ Nueva cita» crea una cita con ${TT('medico', 's', 'un', 'l', 'l')}.`,
    'En cada cita puedes cambiar la hora, moverla o descartarla.',
    `Al registrar ${TT('visita', 's', 'el', 'l', 'l')} desde la ficha, la cita pasa a «Visitada».`,
    'En la vista de día verás <b>sugerencias</b>: quién atiende ese día, acciones pendientes, urgentes e interesados.']]
});


