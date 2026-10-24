// nucleo/navegacion.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

function volverTrasF5(v) {
  if (v.c) CFG_SEC = v.c;
  if (v.s) CFG_SUB = v.s;
  if (v.p) Object.assign(PAG_TAB, v.p);
  if (['config', 'perfil', 'empresa', 'plan'].includes(v.t) || puedeModulo(v.t)) ir(v.t);
}

/* v2.137.0 · Entorno de pruebas sin franja (petición de Eric: tapaba la cabecera y no hace falta algo tan grande). Junto al logo, un
   indicador pequeño «Pruebas»; los botones «Traer los datos de producción» y «Volver a los datos de partida», con sus fechas y el
   estado de la copia, pasan a Organización → Entorno de pruebas. */
async function volverDatosPartida() {
  if (!await preguntar('Se borrará todo lo creado o cambiado en el entorno de pruebas y los datos volverán a como se copiaron de producción. No se puede deshacer.',
    { titulo: '¿Volver a los datos de partida?', ok: 'Sí, volver', peligro: true })) return;
  pantallaCarga('Volviendo a los datos de partida…');
  let { data: r, error } = await RPC_ORIG('pruebas_resetear_responsable', { p_confirmacion: 'RESTABLECER' });
  if (error && /pruebas_resetear_responsable|PGRST202|not find/i.test(error.message || '')) ({ data: r, error } = await RPC_ORIG('pruebas_resetear', { p_confirmacion: 'RESTABLECER' }));
  if (error || !r || !r.ok) {
    quitarCarga();
    toast(r && r.error === 'permiso' ? 'Solo la persona responsable del entorno puede hacerlo' : r && r.error === 'sin_maestro' ? 'Faltan los datos de partida' : 'No se ha podido: ' + ((error && error.message) || (r && r.error) || ''), true);
    return;
  }
  limpiarDatosLocales(); location.reload();
}

/* ============================================================
   v2.267.0 · Carga visible y arreglos del móvil (avisos de Eric, 11/10/2026).
   - Al cambiar de pantalla, una línea de luz cruza la parte alta de punta a punta (como un cometa, con los colores de la marca).
   - Los esqueletos llevan su cargador pequeño en cada bloque (y el brillo es más visible): se ve que está cargando.
   - Inicio en el móvil: el engranaje y «Actualizar» están en su sitio desde el primer momento (antes aparecían tarde, primero en
     otra línea y después junto al título) y el saludo no se corta.
   - Menú del móvil: Oportunidades, Compras y Proveedores se marcan ellas (antes se marcaba Pedidos); «Usuarios y roles» pasa a
     «Usuarios» (los roles están en Configuración).
   - El «+» de las listas vuelve a ser el botón redondo después de girar el móvil (antes se quedaba como un botón de texto grande).
   ============================================================ */
// ---- La línea de luz al cambiar de pantalla
function cometa() {
  let c = $('cometa');
  if (!c) { document.body.insertAdjacentHTML('beforeend', '<div id="cometa" class="cometa" aria-hidden="true"><i></i></div>'); c = $('cometa'); }
  c.classList.remove('va'); void c.offsetWidth; c.classList.add('va');
}

function tabDelMenu() { return TAB === 'ventas' && typeof PEDSEC !== 'undefined' && SUBSEC_MENU[pedsecVista()] ? SUBSEC_MENU[pedsecVista()] : TAB; }

// 2. «Estable»: sin consultas pendientes y sin cambios en el elemento durante 120 ms (como mucho, el tiempo indicado)
function estable(el, max = 4000, desde) {
  return new Promise(res => {
    // Las esperas se miden con el cronómetro interno del navegador (siempre avanza; el reloj puede saltar)
    const t0 = desde || Date.now() - 5, p0 = performance.now(); let ultimo = p0 - 5, fin = false;
    // Cuentan los cambios dentro del elemento (no los de su propia clase, que son los del mecanismo de carga)
    const mo = new MutationObserver(ms => { if (ms.some(m => m.target !== el && !cambioDeCifra(m))) ultimo = performance.now(); });   // v2.269.0
    mo.observe(el, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
    const listo = () => { if (fin) return; fin = true; mo.disconnect(); res(); };
    // Pantalla ya cargada: si al terminar la tarea actual no hay consultas ni cambios, se muestra al momento
    // Una pantalla con esqueletos de carga (recuadros «Cargando…») todavía no está lista
    const conEsqueletos = () => !!el.querySelector('.skel, .ksk, .cargandolocal');
    setTimeout(() => { if (pendientesDesde(t0) === 0 && ultimo <= p0 && !conEsqueletos()) listo(); }, 0);
    const w = setInterval(() => {
      if (fin) { clearInterval(w); return; }
      // Solo las consultas lanzadas desde que empezó (las que ya estaban en curso, como la campana, no cuentan)
      // …y con un respiro de 120 ms desde el último cambio y desde la última consulta terminada (las encadenadas no se toman por el final)
      const ya = performance.now();
      if ((pendientesDesde(t0) === 0 && ya - Math.max(ultimo, RED_ULTIMO_FIN) >= 50 && !conEsqueletos()) || ya - p0 > max) { clearInterval(w); listo(); }   // v2.269.0: 50 ms (antes 120)
    }, 15);
  });
}

function pantallaTrasF5() {
  let v = null;
  try { v = JSON.parse(sessionStorage.getItem('dlc-f5') || 'null'); sessionStorage.removeItem('dlc-f5'); } catch (x) { v = null; }
  // Solo si se acaba de pulsar (una recarga horas después, o desde el botón del navegador, entra por el inicio)
  return v && v.t && Date.now() - (v.h || 0) < 60000 ? v : null;
}

function nombrePantalla(t) {
  const b = document.querySelector(`nav.main [data-t="${t}"]`);
  const n = (b && b.textContent.trim()) || (typeof PAGINAS !== 'undefined' && PAGINAS[t] && PAGINAS[t].t) || (t === 'config' ? 'Configuración' : '');
  return n || 'donde estabas';
}

/* ============================================================
   v2.269.0 · Cargas rápidas, filtros que se mantienen y notas en Pedidos (petición de Eric, 11/10/2026; necesita el SQL 144).
   - Las pantallas se enseñan antes: «estable» espera 50 ms sin cambios (antes 120), mira cada 15 ms (antes 30) y no espera a las
     cifras que cuentan (Analítica esperaba ~1 s oculta a que terminaran sus indicadores). Con el SQL 144
     las consultas lentas bajan a 20-60 ms.
   - Los indicadores de una lista solo se piden en su pantalla (los de Clientes se pedían también en Pedidos, Compras, Productos…).
   - Los filtros de las listas (los de la fila de filtros y los propios del panel «Filtros») se recuerdan: si la pantalla se vuelve a pintar (al guardar un pedido,
     al volver a ella…) salen con lo que tenías puesto, hasta que los quites tú.
   - Pedidos: columna «Notas».
   ============================================================ */
// Una cifra que se anima al contar (solo cambia su texto, y son números) no es «la pantalla sigue cargando»: antes, en Analítica,
// la pantalla esperaba oculta ~1 s a que terminaran de contar los indicadores
function cambioDeCifra(m) {
  if (m.type !== 'childList') return false;
  const ns = [...m.addedNodes, ...m.removedNodes];
  return ns.length > 0 && ns.every(n => n.nodeType === 3) && /^[\d.,\s%€+\-−]*$/.test(m.target.textContent || '');
}

function refrescarDebajo() {
  if (document.querySelector('dialog[open]')) { DATOS_CAMBIADOS = true; return; }
  DATOS_CAMBIADOS = false;
  if (TAB === 'agenda' && $('agcuerpo')) agRefrescoQuieto(null, { cifras: false });
  else if (TAB === 'directorio' && typeof buscar === 'function') buscar(true);
}

// v2.92.0: la pantalla recién revelada llega con un fundido corto (las repintadas posteriores no se animan)
function llegar(el) {
  if (!el || !el.matches('main > section')) return;
  el.classList.remove('llega'); void el.offsetWidth; el.classList.add('llega');
  clearTimeout(el._llega); el._llega = setTimeout(() => el.classList.remove('llega'), 700);
}

function subirAccionPagina() {
  if (typeof PAGINAS === 'undefined' || !PAGINAS[TAB]) return;
  const sec = $('v-' + TAB), sal = sec && sec.querySelector(':scope > .saludo'); if (!sal) return;
  ACCION_PAGINA.forEach(id => {
    const b = $(id); if (!b || !sec.contains(b) || b.closest('.saludo')) return;
    let acts = sal.querySelector(':scope > .acts');
    if (!acts) { sal.insertAdjacentHTML('beforeend', '<div class="acts htacts"></div>'); acts = sal.querySelector(':scope > .acts'); }
    acts.appendChild(b);
  });
}

function vistaBoton(v, d0) {
  const d = d0 || (v && v.dlg); if (!d || !d.open || !VUELTA.length || d.querySelector('.vueltabtn')) return;
  const fh = d.querySelector('.fh'); if (!fh) return;
  const ant = VUELTA[VUELTA.length - 1];
  const t = fh.firstElementChild, dentro = t && t.tagName !== 'BUTTON' && !t.matches('h2') ? t : fh;
  dentro.insertAdjacentHTML('afterbegin', `<button type="button" class="btn sec chico vueltabtn" title="Volver a ${esc(VISTA_TITULO[ant.fn] || 'la ventana anterior')}">‹ Volver</button>`);
}

let TAB_ANTERIOR = 'inicio';

let APP_VISIBLE = false;

const PAGINAS = {
  perfil: { t: 'Mi perfil', d: 'Tus datos, idioma, qué abrir al entrar y tus notificaciones', tabs: [['datos', 'Mis datos', () => pintarPerfil()], ['notif', 'Notificaciones', () => pintarNotif()]] },
  empresa: { t: 'Empresa', d: 'Marca, correo de la empresa y copias de seguridad', admin: true, tabs: [['marca', 'Marca y logo', () => pintarMarca()], ['correo', 'Correo y firma', () => pintarCorreo()], ['copias', 'Copias de seguridad', () => pintarCopias()]] },
  plan: { t: 'Plan y suscripción', d: '', admin: true, tabs: [['plan', 'Plan', () => pintarPaginaPlan()]] }
};

let VIA_IR = null;

// 3. Pantallas: se preparan ocultas y se muestran de golpe
let REVELADO = 0;

let CLIC_PESTANA = null;

let IR_DESDE_MENU = false;

/* v2.144.0 · Páginas propias: la acción principal («+ Nuevo usuario», «+ Nueva organización») sube a la derecha de la cabecera, como
   «+ Nueva venta» en el resto de pantallas (regla de Eric: misma posición en todas). Antes iba dentro de la tarjeta, junto al buscador. */
const ACCION_PAGINA = ['usrnuevo', 'orgnueva'];

let ACCION_PAG_PEND = false;

// ---- Menú del móvil: la sección que se ve, no la página que la contiene
const SUBSEC_MENU = { llamadas: 'oportunidades', compras: 'compras', proveedores: 'proveedores' };

/* ============================================================
   v2.300.0 · Volver siempre al punto de partida (petición de Eric). Cuando desde una ventana se abre otra (una cita → la
   ficha del centro → la ficha de un profesional…), la de antes se apunta en una pila. Al cerrar la de dentro (con su ✕,
   con «‹ Volver» o al guardar y cerrarse), se vuelve a abrir la anterior con sus datos al día, en vez de dejar a la persona
   en la pantalla de debajo. Cerrar la primera cierra del todo. Cambiar de pantalla vacía la pila.
   ============================================================ */
const VUELTA = [];

const VISTA_TITULO = { verCita: 'la cita', fichaCentro: 'el centro', abrirFicha: 'la ficha', verPedido: 'el pedido', verFactura: 'la factura', verEvento: 'el evento',
  verCirugia: 'la intervención', verConcurso: 'el concurso', verEquipo: 'el equipo', verDeposito: 'el depósito', fichaStock: 'el producto' };

const vistaDlg = () => ['ficha', 'dlg'].map($).find(d => d && d.open) || null;

const vistaIgual = (a, b) => a && b && a.fn === b.fn && JSON.stringify(a.args.map(x => x && x.id || x)) === JSON.stringify(b.args.map(x => x && x.id || x));

/** Paginador para listas que se piden al servidor por páginas. */
function paginadorBase(el, total, pagina, alCambiar, alCambiarTam) {
  if (!el) return;
  const tam = tamPagina();
  if (total <= TAMANOS[0]) { el.innerHTML = ''; return; }
  el.innerHTML = pagHTML(total, pagina, tam);
  el.querySelectorAll('[data-pg]').forEach(b => b.onclick = () => alCambiar(+b.dataset.pg));
  el.querySelector('[data-pgtam]').onchange = e => { fijarTam(+e.target.value); alCambiarTam(); };
}

async function arrancarBase() {
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

async function volverAMiSesionBase() {
  const s = suplantando(); if (!s) return;
  const { error } = await db.auth.setSession({ access_token: s.access_token, refresh_token: s.refresh_token });
  localStorage.removeItem(SKEY);
  limpiarDatosLocales();
  if (error) { await db.auth.signOut(); toast('Tu sesión había caducado: vuelve a entrar', true); }
  location.reload();
}

async function volverAMiSesion() {
  const s = suplantando();
  pantallaCarga('Volviendo a tu sesión' + (s ? ', ' + nombrePila(s.nombre) : '') + '…');
  await volverAMiSesionBase();
}

// Con el enlace de recuperación la plataforma no arranca ni se pinta
async function arrancar(...a) { if (RECUPERANDO) { pantallaRecuperacion(); return; } return arrancarBase.apply(this, a); }

/* ============================================================
   v2.250.0 · Ventas sin paginadores repetidos (listas sin fantasmas, segundo grupo). Las listas de Ventas (Pedidos,
   Oportunidades, Compras, Proveedores, Facturas, Catálogo, Servicios y Stock) ya llegaban de una vez (v2.238) y no se
   recolocan al buscar, filtrar, pulsar un indicador, pasar de página u ordenar (prueba ventas2250). Lo que sí fallaba: en
   Facturas y Oportunidades el paginador se crea dentro de la lista y la plantilla lo saca al pie de la tabla; al volver a
   pintar se creaba otro y quedaban dos (con el mismo id). Ahora, antes de pintar un paginador se quita el anterior con su nombre.
   ============================================================ */
function paginador(el, ...a) {
  if (el && el.id) document.querySelectorAll('#' + el.id).forEach(x => { if (x !== el) x.remove(); });
  return paginadorBase.call(this, el, ...a);
}

function irEnlaceBase(e) {
  if (!e) return;
  const [t, id] = String(e).split(':');
  if (t === 'ficha' && id) abrirFicha(id); else if (t === 'pedido' && id) verPedido(id);
  else if (t === 'informe') ir('informe'); else if (t === 'directorio') ir('directorio');
}

function irEnlaceBase2(e) {
  const [t] = String(e || '').split(':');
  if (t === 'agenda') { AG_MODO = 'dia'; AG_FECHA = hoyISO(); ir('agenda'); }
  else if (t === 'llamadas') { PEDSEC = 'llamadas'; ir('ventas'); }
  else if (t === 'ventas') { PEDSEC = 'ventas'; ir('ventas'); }
  else if (t === 'stock') { PSEC = 'stock'; ir('productos'); }
  else if (t === 'facturacion') ir('facturacion');
  else if (t === 'duplicados') ir('duplicados');
  else irEnlaceBase(e);
}

function cargarPaginaBase(t) {
  const P = PAGINAS[t];
  if (P.permiso && !P.permiso()) { ir('inicio'); return; }   // v2.121.0: páginas con su propio permiso (Organización)
  if (P.admin && !puede('administrar')) { ir('inicio'); return; }
  let sec = $('v-' + t);
  if (!sec) { document.querySelector('main').insertAdjacentHTML('beforeend', `<section id="v-${t}"></section>`); sec = $('v-' + t); }
  // Solo puede haber un contenedor de contenido a la vez: Configuración y las otras páginas se vacían (se repintan al volver)
  if ($('v-config')) $('v-config').innerHTML = '';
  Object.keys(PAGINAS).forEach(o => { if (o !== t && $('v-' + o)) $('v-' + o).innerHTML = ''; });
  const tab = P.tabs.some(x => x[0] === PAG_TAB[t]) ? PAG_TAB[t] : P.tabs[0][0];
  sec.innerHTML = `${t === 'plan' ? '' : `<div class="saludo"><div><h1>${esc(P.t)}</h1><div class="fecha">${esc(P.d)}</div></div></div>`}
    ${P.tabs.length > 1 ? `<div class="cfgsubs pagtabs">${P.tabs.map(([k, n]) => `<button data-ptab="${k}" class="${k === tab ? 'on' : ''}">${esc(n)}</button>`).join('')}</div>` : ''}
    <div id="cfgcuerpo" class="pagcuerpo"></div>`;
  sec.querySelectorAll('.pagtabs [data-ptab]').forEach(b => b.onclick = () => { PAG_TAB[t] = b.dataset.ptab; cargarPagina(t); });
  Promise.resolve().then(P.tabs.find(x => x[0] === tab)[2]);
}

function revelarBase(el, max, desde) {
  if (!el) return; const turno = ++REVELADO;
  el.classList.add('preparando');
  estable(el, max, desde).then(() => { if (turno === REVELADO || !el.matches('main > section')) { el.classList.remove('preparando'); llegar(el); } });
}

// Enlaces nuevos de los avisos
function irEnlaceBase3(e) {
  const [t, id] = String(e || '').split(':');
  if (t === 'cliente' && id) return nuevaVenta({ contacto_id: id });
  if (t === 'cita') { AG_MODO = 'dia'; AG_FECHA = hoyISO(); return ir('agenda'); }
  return irEnlaceBase2(e);
}

function cargarPaginaBase2(t, ...a) {
  const r = cargarPaginaBase.call(this, t, ...a);
  if (t === 'delcos' && MODO_PLATAFORMA) {
    const sec = $('v-delcos'), tab = PAG_TAB.delcos || 'orgs', s = PANEL_SECCIONES.find(x => x[1] === tab);
    if (sec && s) { const h = sec.querySelector('.saludo h1'), d = sec.querySelector('.saludo .fecha'); if (h) h.textContent = s[2]; if (d) d.textContent = PANEL_DESC[tab] || ''; }
  }
  return r;
}

function irEnlaceBase4(e) {
  const [t, id] = String(e || '').split(':');
  if (t === 'cirugia' && id) { verCirugia(id); return; }
  return irEnlaceBase3.call(this, e);
}

function irEnlaceBase5(e) {
  const [t, id] = String(e || '').split(':');
  if (t === 'concurso' && id) { verConcurso(id); return; }
  return irEnlaceBase4.call(this, e);
}

function irEnlaceBase6(e) {
  const [t, id] = String(e || '').split(':');
  if (t === 'equipo' && id) { verEquipo(id); return; }
  return irEnlaceBase5.call(this, e);
}

function irEnlace(e) {
  const [t] = String(e || '').split(':');
  if (t === 'plan') { ir('plan'); return; }
  if (t === 'delcos' && puede('gestionar_plataforma')) { ir('delcos'); return; }
  return irEnlaceBase6.call(this, e);
}

// Al llegar, sin cargador que tape la pantalla: se ve la plantilla con su esqueleto
function revelarBase2(el, max, desde) {
  const tab = el && el.id && el.id.slice(2);
  if (el && PL[tab] && el.matches('main > section')) { el.classList.remove('preparando'); plSync(tab); llegar(el); return; }
  return revelarBase(el, max, desde);
}

function revelarBase3(el, max, desde) {
  const tab = el && el.id && el.id.slice(2), listo = LISTA_PARA[tab];
  if (!listo || !el.matches || !el.matches('main > section')) return revelarBase2(el, max, desde);
  // Inicio con su esqueleto: sin cargador encima
  if (tab === 'inicio' && !ES_MEDICO()) { inicioEsqueleto(); el.classList.remove('preparando'); llegar(el); return; }
  const turno = ++REVELADO, t0 = performance.now(), tope = LISTA_ESPERA[tab] || 6000;
  el.classList.add('preparando'); el.__t0 = t0; el.__cinta = 0;
  const mirar = () => estable(el, Math.max(300, tope - (performance.now() - t0)), desde).then(() => {
    if (turno !== REVELADO) return;
    if (listo(el) || performance.now() - t0 > tope) { el.classList.remove('preparando'); llegar(el); }
    else setTimeout(mirar, 60);
  });
  mirar();
}

// Revelado de las pantallas con secciones: la primera llegada, de una vez (como siempre), con la plantilla ya puesta
function revelarBase4(el, max, desde) {
  const tab = el && el.id && el.id.slice(2);
  if (PL_SECC[tab] && el.matches && el.matches('main > section')) {
    // Primera llegada de una pantalla en rejilla: de una vez, con el cargador (el esqueleto queda para cuando se vuelve a buscar)
    const t0 = Date.now(); el.classList.add('preparando');
    // La sección puede decidirse un momento después (al pintarse): se vuelve a mirar
    setTimeout(() => { if (plCfg(tab)) plSync(tab);
      // La v2.236 trataba como plantilla toda pantalla de PL: mientras se llama al revelado de siempre, esta no está en PL
      const keep = PL[tab]; delete PL[tab]; try { revelarBase3(el, max, desde || t0); } finally { PL[tab] = keep; } }, 0);
    return;
  }
  return revelarBase3(el, max, desde);
}

/* ============================================================
   v2.251.0 · Pestañas sin fantasmas en Eventos, Intervenciones, Concursos y Parque (listas sin fantasmas, tercer grupo). Las cuatro
   listas de bloques llegan de una vez y no se recolocan al buscar, filtrar, pulsar un bloque u ordenar (prueba bloques2251),
   pero al cambiar de pestaña (Concursos: En marcha, Contratos, Cerrados) la página entera se volvía a montar y, mientras
   llegaban los datos, la cabecera se quedaba sin su botón, el filtro de bloques desaparecía y la barra se movía. Ahora:
   - Cambiar entre pestañas que son listas no vuelve a montar la página: la pestaña se marca al momento, la lista de antes se
     atenúa y la nueva la sustituye de una vez cuando llegan sus datos (a Informe de gastos de Eventos, que no es una lista, se
     sigue llegando montando la página entera).
   - El filtro de bloques se queda en su sitio, desactivado, si la pestaña tiene un solo bloque (antes desaparecía y el buscador
     se ensanchaba).
   ============================================================ */
function cargarPagina(t, ...a) {
  const P = PAGINAS[t], sec = $('v-' + t), caja = sec && sec.querySelector('#cfgcuerpo'), tabs = sec && sec.querySelector(':scope > .pagtabs');
  if (!P || !BLQ[t] || TAB !== t || !caja || !tabs || !sec.classList.contains('plantilla')) return cargarPaginaBase2.call(this, t, ...a);
  const tab = P.tabs.some(x => x[0] === PAG_TAB[t]) ? PAG_TAB[t] : P.tabs[0][0];
  tabs.querySelectorAll('[data-ptab]').forEach(b => b.classList.toggle('on', b.dataset.ptab === tab));
  // Solo entre pestañas que son listas (Informe de gastos de Eventos no lo es: esa página se vuelve a montar entera, como antes)
  if (PL_SECC[t] && !PL_SECC[t]()) return cargarPaginaBase2.call(this, t, ...a);
  caja.classList.add('pagcambia');
  return Promise.resolve().then(P.tabs.find(x => x[0] === tab)[2]).finally(() => { const c = $('cfgcuerpo'); if (c) c.classList.remove('pagcambia'); });
}

/* ============================================================
   v2.256.0 · Fichas sin fantasmas. La ficha de una cuenta se enseña cuando está entera (revelado de las ventanas), pero se rendía a
   los 1,5 s: con la red lenta, los bloques que llegan después (historial de visitas, campos, muestras, ciclo…) aparecían ya abierta
   y empujaban lo de debajo. Ahora la ficha espera hasta 5 s a tener todos sus bloques. Pedido, factura, evento y ficha de centro ya
   se abrían de una vez (prueba fichas2256).
   ============================================================ */
function revelar(el, max, desde) {
  if (el && el.id === 'fbody') max = Math.max(max || 0, 5000);
  return revelarBase4.call(this, el, max, desde);
}

// Cambio de pestaña: la vista anterior se queda fija hasta que llegan los datos y la pantalla deja de cambiar
function congelar(sec) {
  if (!sec || sec.classList.contains('hide') || document.querySelector('.congelada')) return;
  const r = sec.getBoundingClientRect(); if (r.height < 40) return;
  const t0 = Date.now() - 2;
  // La copia conserva sus identificadores (así mantiene exactamente su aspecto); al estar al final de la página,
  // la plataforma sigue encontrando siempre los elementos reales, que van antes
  const c = sec.cloneNode(true);
  c.classList.add('congelada', 'atenuada'); c.classList.remove('cargando', 'cargando-pend', 'preparando');
  Object.assign(c.style, { position: 'absolute', left: (r.left + scrollX) + 'px', top: (r.top + scrollY) + 'px', width: r.width + 'px', margin: 0, zIndex: 45, background: 'var(--bg, #F3F8FC)' });
  // La pestaña pulsada se marca activa al momento en la copia
  const b = CLIC_PESTANA;
  if (b && sec.contains(b)) {
    const attrs = [...b.attributes].filter(a => a.name.startsWith('data-') && a.name !== 'data-expl');
    const sel = attrs.length ? attrs.map(a => `[${a.name}="${CSS.escape(a.value)}"]`).join('') : null;
    const cb = sel && c.querySelector(sel);
    if (cb) { [...cb.parentElement.children].forEach(x => { x.setAttribute('aria-pressed', String(x === cb)); x.classList.toggle('on', x === cb); if (x !== cb && x.classList.contains('btn') && !x.classList.contains('sec')) x.classList.add('sec'); }); cb.classList.remove('sec'); }
  }
  c.insertAdjacentHTML('afterbegin', '<div class="barraprog"><i></i></div>');
  // Se coloca justo debajo de la fila de botones que se ha pulsado (pestañas, modos de la agenda…)
  if (b && sec.contains(b)) { const fila = b.closest('.subnav, .cfgsubs, .acts, .segs') || b.parentElement; const rb = fila.getBoundingClientRect(); c.querySelector('.barraprog').style.top = Math.round(rb.bottom - r.top + 4) + 'px'; }
  document.body.appendChild(c); sec.style.minHeight = r.height + 'px';
  setTimeout(() => estable(sec, 3000, t0).then(() => { c.remove(); requestAnimationFrame(() => { sec.style.minHeight = ''; }); }), 0);
}
