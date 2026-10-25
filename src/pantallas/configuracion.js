// pantallas/configuracion.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

async function cargarRoles() {
  const [{ data, error }, { data: est, error: e2 }, voc] = await Promise.all([
    db.from('roles').select('nombre,orden,color,plantilla,por_defecto,roles_capacidades(capacidad)').order('orden').order('nombre'),
    db.rpc('catalogo_papel', { p_papel: 'estado_comercial' }),
    db.from('ajustes').select('valor').eq('clave', 'terminos').maybeSingle()]);
  // Vocabulario: si cambia respecto al guardado, se recarga una vez para que todos los textos lo usen
  if (voc && !voc.error) {
    const nuevo = JSON.stringify((voc.data && voc.data.valor) || {}), antes = JSON.stringify(TERMINOS || {});
    if (nuevo !== antes) {
      try { localStorage.setItem(TERMKEY, nuevo); } catch (e) {}
      let ya = false; try { ya = sessionStorage.getItem('dlc-terminos-recarga') === nuevo; sessionStorage.setItem('dlc-terminos-recarga', nuevo); } catch (e) {}
      if (!ya) { location.reload(); return false; }
    }
  }
  if (!e2 && Array.isArray(est)) {
    ESTADOS_DEF = est.map(x => ({ valor: x.valor, papel: x.papel || '' }));
    try { localStorage.setItem(ESTKEY, JSON.stringify(ESTADOS_DEF)); } catch (e) {}
  }
  if (error || !data) return false;
  ROLES_DEF = data.map(r => ({ nombre: r.nombre, orden: r.orden, color: r.color, plantilla: r.plantilla || {}, por_defecto: !!r.por_defecto,
    capacidades: (r.roles_capacidades || []).map(x => x.capacidad) }));
  try { localStorage.setItem(ROLKEY, JSON.stringify(ROLES_DEF)); } catch (e) {}
  return !e2;
}

function pintarPlanBase() {
  if (!PLAN) { $('rplan').innerHTML = ''; return; }
  const total = PLAN.paradas.reduce((n, p) => n + p.medicos.length, 0);
  const ultima = PLAN.paradas[PLAN.paradas.length - 1];
  // Ruta completa: todas las paradas y la vuelta a la salida (o termina en la última parada si no hay salida con ubicación)
  const conCasa = PLAN.salida.lat != null;
  const rutaDest = conCasa ? [PLAN.salida.lat, PLAN.salida.lon] : ultima.xy;
  const rutaParadas = conCasa ? PLAN.paradas.map(p => p.xy) : PLAN.paradas.slice(0, -1).map(p => p.xy);

  $('rplan').innerHTML = `<div class="card">
    <h2>${PLAN.fecha && PLAN.fecha !== hoyISO() ? 'Plan para el ' + fechaLarga(new Date(PLAN.fecha + 'T00:00:00')) : 'Plan de hoy'}<span class="n">${total} ${TT('medico', total === 1 ? 's' : 'p', '', 'l', 'l')}</span></h2>
    <p class="sm">Salida de ${esc(PLAN.salida.nombre)} a las ${PLAN.inicio != null ? hm(PLAN.inicio) : PLANCFG().salida} · ${PLAN.paradas.length} ${PLAN.paradas.length === 1 ? 'parada' : 'paradas'} ·
      vuelta sobre las ${hm(PLAN.fin)} · <button class="kcfg" id="planhora">⚙ Cambiar horario</button></p>
    <div class="lista">${PLAN.paradas.map((p, i) => `<div class="item" style="cursor:default">
      <span class="ic">${i + 1}</span>
      <span class="tx"><b>${esc(p.centro)}</b>
        <span class="sm">${hm(p.llegada)}–${hm(p.fin)} · ${esc([p.dir, p.municipio].filter(Boolean).join(', '))} · ${p.medicos.length} ${TT('medico', p.medicos.length === 1 ? 's' : 'p', '', 'l', 'l')}</span>
        <span class="sm">${p.medicos.map(m => esc(m.nombre)).join(' · ')}</span></span>
      <span class="acts" style="margin:0"><button class="btn sec" type="button" data-nav="${navAttr(p.xy)}">Ir</button></span>
    </div>`).join('')}</div>
    <div id="planmapa" style="height:0;margin:0 16px;border-radius:12px;overflow:hidden"></div>
    <div class="acts" style="padding:12px 16px 16px">
      <button class="btn sec" id="planver">Ver la ruta en el mapa</button>
      <button class="btn" type="button" data-nav="${navAttr(rutaDest, rutaParadas)}">Abrir la ruta en el navegador</button>
      <button class="btn sec" id="planag">Guardar en mi agenda</button>
      ${!PLAN.fecha || PLAN.fecha === hoyISO() ? '<button class="btn" id="planempezar">▶ Empezar ruta</button>' : ''}
      <button class="btn sec" id="plancerrar">Cerrar</button>
    </div></div>`;

  $('plancerrar').onclick = () => { PLAN = null; pintarPlan(); };
  $('planver').onclick = e => { mapaDelPlan(); e.target.classList.add('hide'); };
  if ($('planhora')) $('planhora').onclick = abrirHorarioPlan;
  if ($('planempezar')) $('planempezar').onclick = () => empezarRuta();
  $('planag').onclick = async ev => {
    ev.target.disabled = true; ev.target.textContent = 'Guardando…';
    let n = 0;
    for (const p of PLAN.paradas) {
      for (const m of p.medicos) {
        await escribir('guardar_cita', { p: {
          cuenta_id: m.id, fecha: PLAN.fecha || hoyISO(), hora: hm(p.llegada), centro_nombre: p.centro,
          estado: 'Planificada', origen: 'Plan del día',
          op_id: 'c-' + m.id + '-' + (PLAN.fecha || hoyISO())
        }});
        n++;
      }
    }
    ev.target.disabled = false; ev.target.textContent = 'Guardar en mi agenda';
    toast(`${n} citas guardadas en tu agenda`);
    cargarInicio();
  };
}

























function cfgMovil() {
  const hub = document.querySelector('.cfghub'); if (!hub) return;
  hub.classList.toggle('movil', ES_MOVIL());
  if (!ES_MOVIL()) { hub.classList.remove('detalle'); return; }
  const cont = $('cfgcuerpo-hub');
  if (cont && !cont.querySelector(':scope > .cfgvolver')) cont.insertAdjacentHTML('afterbegin', '<button class="cfgvolver" type="button">‹ Configuración</button>');
}
/* v2.87.0 · Borrar un usuario por completo (administración). Pedidos, facturas, cobros y auditoría se conservan siempre. */

// Editar usuario y asignar cartera funcionan aunque la lista de usuarios aún no esté cargada (por ejemplo, desde una notificación)

function marcarCache(t) { CACHE_MOD[t] = { clave: ESTADO_MOD[t](), t: Date.now(), esc: ESCRITURAS }; }

// Todo texto que diga «Directorio» (ayudas, manual, avisos…) usa el nombre que ha elegido la empresa
function nombreEnTextos(raiz) {
  const et = etiquetaContactos(); if (!raiz || et === 'Directorio') return;
  const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT, { acceptNode: n => n.parentElement && !n.parentElement.closest('script,style,textarea,input,[data-notr]') && /directorio/i.test(n.nodeValue) ? 1 : 2 });
  const ns = []; while (w.nextNode()) ns.push(w.currentNode);
  ns.forEach(n => { n.nodeValue = n.nodeValue.replace(/\bDirectorio\b/g, et).replace(/\bdirectorio\b/g, et.toLowerCase()); });
}









// v2.135.0 · Menú lateral: «Configuración» (pie del menú) se marca como sección activa cuando se está en Configuración
function menuMarcarPie() { const b = $('mlcfg'); if (b) b.classList.toggle('activo', TAB === 'config'); }



// v2.138.0 · Pastilla «Pruebas» en el menú lateral: junto a la marca (desplegado) o como punto sobre el logo (plegado); sin menú
// lateral vuelve a la cabecera, detrás del logo
function colocarIndPruebas() {
  const p = $('indpruebas'); if (!p) return;
  const marca = document.body.classList.contains('menulat') && document.querySelector('nav.main .mlmarca');
  const casa = marca || document.querySelector('.top .logo');
  if (!casa) return;
  if (marca) { if (p.parentNode !== marca) marca.appendChild(p); }
  else if (p.previousElementSibling !== casa) casa.insertAdjacentElement('afterend', p);
}

function marcarPedsec() {
  if (TAB !== 'ventas') return;
  const alias = Object.keys(ALIAS_PEDIDOS).find(k => ALIAS_PEDIDOS[k] === pedsecVista()) || 'ventas';
  document.querySelectorAll('nav.main [data-t], #bnav [data-t]').forEach(x => x.setAttribute('aria-selected', String(x.dataset.t === alias)));
}


function rpPlanDe(i) {
  const p = RPROP.lista[i]; if (!p) return null;
  PROPUESTAS = PROPUESTAS || {};
  PROPUESTAS['prop' + (i + 1)] = p.sel;   // así «Tiempos de visita» puede recalcular el plan
  return p;
}





function marcarFacPlan() {
  document.body.classList.toggle('facsolo', facSinPlan());
  try { aplicarPermisosMenu(); } catch (e) {}
}


function marcarPanel() {
  const tab = PAG_TAB.delcos || 'orgs';
  document.querySelectorAll('nav.main [data-t]').forEach(b => { if (b.classList.contains('pdsec') || b.dataset.t === 'delcos') b.setAttribute('aria-selected', String(b.dataset.t === 'pd-' + tab)); });
}

function claveCfgVieja(sec, sub) {
  if (!sec || sec === '__cfg') return '';
  if (sec === 'equipo') return sub === 'roles' ? 'roles' : 'usuarios';
  if (sub) return sec + '.' + sub;
  return CFG_VIEJO[sec] || sec;
}

// El índice cabe siempre en la pantalla: su alto llega justo al borde de abajo, así la rueda lo recorre entero sin tener que mover la página
function cfuAjustarIndice() {
  const n = document.querySelector('#v-config .cfuidx'); if (!n || TAB !== 'config' || ES_MOVIL()) return;
  const top = Math.max(0, n.getBoundingClientRect().top);
  n.style.setProperty('--cfuidxh', Math.max(240, innerHeight - top - 12) + 'px');
}


// ---------- nombres del menú ----------
function txTexto(b) {
  const l = b.querySelector('.mllab, b, em, small, .lb'); if (l && !l.querySelector('svg')) return { get: () => l.textContent.trim(), set: v => { l.textContent = v; if (b.dataset.tip) b.dataset.tip = v; } };
  const tn = [...b.childNodes].find(x => x.nodeType === 3 && x.nodeValue.trim());
  return tn ? { get: () => tn.nodeValue.trim(), set: v => { tn.nodeValue = tn.nodeValue.replace(tn.nodeValue.trim(), v); if (b.dataset.tip) b.dataset.tip = v; } } : null;
}





/* ============================================================
   v2.279.0 · Datos de acceso a mano, «Mi ficha» con lo necesario y ver la contraseña (peticiones de Eric, 12/10/2026; SQL 148).
   - Al dar de alta a alguien se guardan su usuario y su contraseña temporal; en su ventana de Usuarios, «Datos de acceso» los vuelve a
     enseñar para copiarlos. Cuando esa persona ya ha entrado, la contraseña ya no sirve: se borra y se ofrece enviarle el cambio.
   - Mi ficha del profesional: arriba, lo necesario para quitar el aviso de «faltan datos» (teléfono, al menos un día con horario y
     cómo prefiere las visitas), marcado según lo va rellenando; esos campos llevan «Necesario». Un centro sin nombre se puede escribir.
   - Cualquier campo de contraseña (también el de entrar) tiene un botón para ver lo que se escribe.
   ============================================================ */



// Configuración → Correo y firma: «Textos de los correos»
// Configuración → Correo y firma → «Plantillas de correo»


// (R-12: plantillaCorreo se definía aquí otra vez; ahora está en su sitio, más arriba)

// Elegir plantilla al enviar (solo si hay más de una para ese uso). Devuelve false si se cancela.

// (R-12: pintarPlantillasCorreo se definía aquí otra vez; ahora está en su sitio, más arriba)

function cfgSecDormir(sec) {
  sec.querySelectorAll(IDS_SEC.map(i => '#' + i).join(',')).forEach(e => { e.dataset.idd = e.id; e.removeAttribute('id'); });
  const c = sec.querySelector(':scope > .cfgsecc'); if (c && c.id === 'cfgcuerpo') c.removeAttribute('id');
}

function cfgSecDespertar(sec) {
  if (!sec || CFG_SEC_ACT === sec) return;
  document.querySelectorAll('#cfgcuerpo-hub .cfgsec').forEach(o => { if (o !== sec) cfgSecDormir(o); });
  const viejo = $('cfgcuerpo'); if (viejo && !sec.contains(viejo)) viejo.removeAttribute('id');
  sec.querySelector(':scope > .cfgsecc').id = 'cfgcuerpo';
  sec.querySelectorAll('[data-idd]').forEach(e => { e.id = e.dataset.idd; delete e.dataset.idd; });
  // La ventana de siempre (#dbody) solo se aparta si la sección tiene su panel
  if (sec.__panel) { const m = document.querySelector('dialog #dbody'); if (m) m.id = 'dbody-modal'; PANEL_ACTIVO = sec.__panel; }
  else { const m = $('dbody-modal'); if (m && !document.querySelector('#dbody')) m.id = 'dbody'; PANEL_ACTIVO = null; }
  CFG_SEC_ACT = sec; CFG_KEY = sec.dataset.cfgsec;
}

async function cfgApilar(it, foco) {
  const hub = $('cfgcuerpo-hub'); if (!hub) return;
  CFG_SEC_ACT = null;
  // Se preparan escondidas y la página aparece entera de una vez (sin fantasmas)
  hub.innerHTML = '<div class="cfgsecs" hidden>' + it.hijos.map(h => `<section class="cfgsec" data-cfgsec="${h.k}"><h3 class="cfgsectit">${esc(h.t)}</h3><div class="cfgsecc"></div></section>`).join('') + '</div><div class="cfgcarga cargandolocal"><span class="giro"></span> Cargando…</div>';
  hub.dataset.apilado = '1';
  for (const sec of hub.querySelectorAll('.cfgsec')) {
    if (!hub.isConnected) return;
    const h = it.hijos.find(x => x.k === sec.dataset.cfgsec);
    sec.__panel = null; PANEL_ACTIVO = null;
    const m = $('dbody-modal'); if (m && !document.querySelector('#dbody')) m.id = 'dbody';
    cfgSecDespertar(sec);
    try { await h.r(); } catch (e) {}
    await cfgEstable(sec, 4000);
    if (PANEL_ACTIVO && sec.querySelector('[data-panel]')) sec.__panel = PANEL_ACTIVO;
    try { if (typeof pulirCfg === 'function') pulirCfg(); } catch (e) {}
    // Sin título repetido: si la parte ya empieza con su título, fuera el de la sección
    if ([...sec.querySelectorAll('.cfgsecc h2')].some(x => x.offsetParent)) sec.querySelector('.cfgsectit').hidden = true;   // la parte ya trae su título
    CFG_SEC_ACT = null;
  }
  const caja = hub.querySelector('.cfgsecs'); if (caja) caja.hidden = false; const cg = hub.querySelector(':scope > .cfgcarga'); if (cg) cg.remove();
  const primera = (foco && hub.querySelector(`.cfgsec[data-cfgsec="${foco.k}"]`)) || hub.querySelector('.cfgsec');
  cfgSecDespertar(primera);
  if (foco && foco !== it.hijos[0] && primera) primera.scrollIntoView({ block: 'start', behavior: 'smooth' });
}

// v2.344.0: los estilos de Configuración hablan de #cfgcuerpo (el contenedor activo); se copian para las demás secciones de la página
function cfgClonarEstilos() {
  const re = /#cfgcuerpo(?![-\w])/g;
  const nuevo = sel => sel.split(',').filter(p => re.test(p) && !(re.lastIndex = 0)).map(p => p.replace(re, '#cfgcuerpo-hub .cfgsecc')).join(',');
  const recorrer = (lista, dentro) => {
    for (const r of [...lista]) {
      if (r.cssRules && (r.media || (typeof CSSLayerBlockRule !== 'undefined' && r instanceof CSSLayerBlockRule))) { recorrer(r.cssRules, r); continue; }   // v2.356.0: también dentro de las capas
      if (!r.selectorText || !r.selectorText.includes('#cfgcuerpo')) continue;
      re.lastIndex = 0; const sel = nuevo(r.selectorText); if (!sel) continue;
      // v2.361.0: la copia va justo detrás de su original (al final del bloque, la de escritorio quedaba detrás de la del @media y le ganaba)
      const caja = dentro || r.parentStyleSheet;
      try { caja.insertRule(`${sel}{${r.style.cssText}}`, [...caja.cssRules].indexOf(r) + 1); } catch (e) {}
    }
  };
  for (const h of document.styleSheets) { try { if (!h.href) recorrer(h.cssRules, null); } catch (e) {} }
}

function pagMarcarSucio() { const n = PAG_SUCIO.size; ['cfuguardar', 'cfudescartar'].forEach(id => { const b = $(id); if (b) b.disabled = !n; }); }



// En la factura solo va el logo si la empresa ha subido el suyo
async function logoData() { if (MARCA.logo && (AJUSTES.marca || {}).logo_factura !== false) { LOGO_DATA = MARCA.logo; LOGO_CIRC = true; return MARCA.logo; } return null; }







async function pendientesCfg() {
  if (Date.now() - CFG_PEND.t < 60000) return CFG_PEND.l;
  const l = {};
  try { if (!prefsActivas().salida && puedeModulo('agenda')) l['rutas.salida'] = 'Sin punto de salida: las horas del día salen sin el primer trayecto'; } catch (e) {}
  if (puedeOrganizacion()) {
    try { const { data: c } = await RPC_ORIG('correo_config', {}); if (!c || !c.host) l['o.correo'] = 'Sin configurar: los correos de la empresa no salen'; } catch (e) {}
    try {
      const { data: au } = await db.from('auditoria').select('creado_en').eq('accion', 'Copia de seguridad').order('creado_en', { ascending: false }).limit(1);
      const d = au && au[0] ? Math.floor((Date.now() - new Date(au[0].creado_en)) / 864e5) : null;
      if (d == null) l['o.copias'] = 'Todavía no hay ninguna copia'; else if (d > 7) l['o.copias'] = `La última copia es de hace ${d} días`;
    } catch (e) {}
  }
  CFG_PEND = { t: Date.now(), l };
  return l;
}









/* v2.69.0 · Permisos por capacidad. El código pregunta qué puede hacer una persona (puede('administrar')),
   nunca cómo se llama su rol: los roles y sus capacidades son datos de cada cliente (tablas roles y roles_capacidades). */
const ROLKEY = 'dlc-roles';

let ROLES_DEF = [];

const rolDef = r => ROLES_DEF.find(x => x.nombre === r) || null;

const rolPuede = (r, c) => { const d = rolDef(r); return !!(d && (d.capacidades || []).includes(c)); };

const rolesNombres = () => ROLES_DEF.map(x => x.nombre);

const rolCon = c => (ROLES_DEF.find(x => (x.capacidades || []).includes(c)) || {}).nombre || '';

const rolPorDefecto = () => (ROLES_DEF.find(x => x.por_defecto) || ROLES_DEF.find(x => !(x.capacidades || []).includes('administrar')) || {}).nombre || '';


const marca = paso => console.info(`[App] ${paso} · ${Math.round(performance.now() - T0)} ms`);

let AJUSTES = {};

const salidaUsuario = () => prefsActivas().salida || { nombre: `la ${TT('visita', 's', 'primer', 'l', 'l')}`, lat: null, lon: null, falta: true };

let ABRIR_PLAN_SEMANA = false;


let LOGO_DATA = null;

let PANEL_ACTIVO = null;

const CFG_DE_MODULO = { agenda: 'horario', rutas: 'horario', admin: 'usuarios', facturacion: 'fiscal', inicio: 'kpis', config: 'prefs', directorio: 'cat', ventas: 'cat', permisos: 'usuarios', medico: 'usuarios', roles: 'usuarios' };


const plantillaRol = r => Object.assign({}, (rolDef(r) || {}).plantilla || {}, (AJUSTES.roles || {})[r] || {});

const CFG_ADMIN = { usuarios: 'usuarios', comisiones: 'comis', accesos: 'accesos', auditoria: 'auditoria' };

let NOTIF_N = 0;

const LOGO_NEUTRO = 'logo-app.png';

let CFG_SUB = null;

// Nombres anteriores de cada apartado → dónde está ahora
const CFG_ANTES = { prefs: ['perfil'], horario: ['rutas', 'horario'], kpis: ['inicio', 'kpis'], usuarios: ['equipo', 'usuarios'],
  roles: ['equipo', 'roles'], reglas: ['cartera', 'reglas'], frec: ['cartera', 'frec'], accesos: ['seguridad', 'accesos'], auditoria: ['seguridad', 'auditoria'],
  alm: ['stock', 'alm'], mues: ['stock', 'mues'], fiscal: ['fact', 'fiscal'], series: ['fact', 'series'], vf: ['fact', 'vf'] };

// Registro de facturación: el detalle de cada evento en texto legible
const NOMBRES_DETALLE = { importe: 'Importe', forma: 'Forma de pago', motivo: 'Motivo', para: 'Para', asunto: 'Asunto', clave: 'Ajuste', total: 'Total', serie: 'Serie', numero: 'Número' };

/* ============================================================
   v2.72.0 · Motor de campos personalizados (fase 2 de la auditoría)
   Cada cliente define sus campos (tipo, obligatorio, dónde se ven) en
   Configuración → Catálogos, y la plataforma genera los formularios,
   las columnas y los filtros. Los valores se guardan con guardar_campos().
   ============================================================ */
const CAMPOS = { medico: [], cliente: [], producto: [], pedido: [] };

// Campos de la pantalla: primero los marcados como «Filtro», después el resto (en su orden)
const clasCampos = amb => [...(CAMPOS[amb] || [])].sort((a, b) => (b.en_filtro ? 1 : 0) - (a.en_filtro ? 1 : 0));

const PUESTA_EN_MARCHA = 490;

const precioPlan = p => p.presupuesto ? 'presupuesto a medida' : `${eurI(p.precio)} por usuario al mes, ${eurI(p.anual)} con pago anual`;

// Usuarios contratados (A medida o sin dato: sin límite)
const usuariosContratados = () => PLAN_ACTUAL.plan === 'medida' || PLAN_ACTUAL.usuarios == null ? Infinity : +PLAN_ACTUAL.usuarios;

/* v2.123.0 · Historial de cambios y deshacer (administración). La base guarda cada cambio con su valor de antes; aquí se ve por
   ficha y se deshace: un cambio, o todo lo que una persona cambió desde una fecha. Solo fichas, consultas, clientes, productos y
   rutas (pedidos, facturas, usuarios y cartera tienen efectos en stock, facturación, comisiones o permisos). */
const DESHACIBLES = ['cuentas', 'ubicaciones', 'contactos', 'productos', 'rutas'];

const deshacible = a => DESHACIBLES.includes(a.entidad) && ['Edición', 'Baja'].includes(a.accion);


/* v2.133.0 · Entorno de pruebas: «Traer los datos de producción». Junto a «Volver a los datos de partida» (y para quien puede
   usarlo), pide a la función «refrescar-pruebas» de Supabase que lance el proceso de GitHub que copia los datos actuales de
   producción (solo los lee) y los deja como nuevos datos de partida. La franja enseña en qué punto está y recarga al terminar. */
const MOTIVO_REFRESCO = { permiso: 'Solo la administración puede traer los datos de producción', responsable: 'Solo la persona responsable del entorno de pruebas puede hacerlo',
  en_marcha: 'Ya se están copiando los datos de producción', github: 'No se ha podido lanzar la copia en GitHub', no_es_pruebas: 'Esto solo funciona en el entorno de pruebas' };


const NOTIF_AREAS = [
  ['ventas', 'Ventas', ['reponer', 'caida_ventas', 'pedido_portal', 'venta_cartera', 'pauta', 'pedido_validado', 'pago_recibido', 'borrador_nuevo', 'cliente_nuevo']],
  ['cartera', 'Cartera y agenda', ['citas_hoy', 'visita_sin_registrar', 'seguimientos_hoy', 'sin_visitar', 'cartera', 'cruce', 'duplicado', 'portal']],
  ['cobros', 'Cobros y stock', ['pagos_pendientes', 'facturas_vencidas', 'stock_minimo', 'lotes_caducan', 'compra_recibida', 'rectificativa']],
  ['equipo', 'Equipo', ['usuario_nuevo', 'esquema']]
];

// Los que se preparan al empezar el día: solo tienen «en el resumen»
const NOTIF_DIARIOS = ['citas_hoy', 'seguimientos_hoy', 'pagos_pendientes', 'facturas_vencidas', 'lotes_caducan', 'sin_visitar', 'reponer', 'caida_ventas', 'visita_sin_registrar'];

const notifArea = t => (NOTIF_AREAS.find(a => a[2].includes(t)) || ['otros'])[0];

/* v2.167.0 · «Pedir presupuesto» dentro de delcos (petición de Eric: nada de abrir el correo ni llevar al cliente fuera). Un formulario con
   la imagen de la plataforma: el contacto ya relleno, qué buscan (opciones que se marcan, sin cerrar nada: siempre hay «Cuéntanos con tus
   palabras»), tamaño, cuándo y cómo prefieren que les contactemos. Se guarda (pedir_presupuesto, SQL 104), delcos recibe un aviso al
   momento y la empresa ve en «Plan y suscripción» en qué punto está. Con A medida, el mismo formulario sirve para hablar del contrato.
   En el panel de delcos, pestaña «Solicitudes» con su estado y una nota. */
const PRESU_NECESITA = [
  ['usuarios', 'Más de 50 usuarios'], ['migracion', 'Migrar nuestros datos'], ['conexion', 'Conectar con nuestro programa (ERP, CRM, contabilidad…)'],
  ['portal', 'Portal para muchos profesionales o centros'], ['desarrollo', 'Algo hecho a nuestra medida'], ['formacion', 'Formación del equipo'],
  ['soporte', 'Soporte prioritario'], ['otro', 'Otra cosa']];

const PRESU_CUANDO = ['Lo antes posible', 'Este trimestre', 'Más adelante', 'Solo me estoy informando'];

const PRESU_ESTADO = { 'Nueva': 'Recibida', 'En curso': 'En curso', 'Cerrada': 'Atendida' };

const CFG_VIEJO = { prefs: 'rutas.salida', perfil: 'datos', datos: 'datos', notif: 'notif', horario: 'rutas.horario', kpis: 'inicio.kpis', usuarios: 'usuarios',
  roles: 'roles', equipo: 'usuarios', reglas: 'cartera.reglas', frec: 'cartera.frec', accesos: 'seguridad.accesos', auditoria: 'seguridad.auditoria',
  alm: 'stock.alm', mues: 'stock.mues', marca: 'o.marca', __empresa: 'o.marca', empresa: 'o.marca', correo: 'o.correo', copias: 'o.copias', plan: 'o.plan',
  fact: 'o.fiscal', fiscal: 'o.fiscal', series: 'o.series', vf: 'o.vf', pdf: 'o.pdf', orgs: 'o.orgs' };

const CFG_CLAVES = { datos: 'nombre teléfono idioma perfil contraseña sesión cerrar', notif: 'avisos campana silencio resumen',
  'rutas.salida': 'salida llegada casa oficina navegar google maps waze', 'rutas.horario': 'tiempos minutos duración parada',
  'inicio.kpis': 'indicadores kpi inicio', usuarios: 'personas equipo alta invitar cartera zona', roles: 'permisos capacidades',
  comis: 'comisiones esquemas tramos', 'o.marca': 'logo nombre vocabulario términos palabras', 'o.correo': 'smtp firma remitente email correo',
  'o.plan': 'suscripción pago tarjeta usuarios precio', 'o.copias': 'copia seguridad descargar exportar', 'o.fiscal': 'nif razón social dirección',
  'o.series': 'numeración factura', 'o.vf': 'verifactu hacienda', 'o.pdf': 'factura diseño logo colores', cat: 'clasificadores listas valores especialidades motivos',
  portal: 'portal material pedir' };

// v2.340.0 (Eric): cada apartado es una sola entrada del índice; sus partes (Rutas: salida y tiempos…) van dentro, en pestañas
const hojasCfg = arbol => arbol.flatMap(([gr, l]) => l.map(it => Object.assign({ gr }, it)));

let CFG_PEND = { t: 0, l: {} };

const LUPA_CFG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';

let CFG_DETALLE = false;

let CFU_RAF = 0;

/* v2.216.0 · Tu cuenta y Empresa en filas de ajuste (segunda versión del rediseño de Configuración).
   pulirCfg() se aplica al contenido de cada apartado mientras se pinta (MutationObserver de #cfgcuerpo), sin tocar cómo guarda cada uno:
   - Las tarjetas que solo presentan el apartado desaparecen y su texto pasa a la cabecera; el título repetido de la primera tarjeta se oculta.
   - Tiempos de visita y el aviso de Salida y llegada: filas de ajuste con el número compacto a la derecha.
   - Marca y vocabulario: el vocabulario, en su propia tarjeta como tabla (singular, plural y género por fila), con el nombre del módulo.
   - Correo y firma: arriba, el estado del correo y «Enviar un correo de prueba»; la vista previa de la firma acompaña al desplazarse.
   - Copias de seguridad: el estado y «Descargar copia completa» en la misma fila. */
const CFG_PULIR = ['datos', 'rutas.salida', 'rutas.horario', 'inicio.kpis', 'o.marca', 'o.correo', 'o.plan', 'o.copias'];

const notifIco = t => (TIPOS_NOTIF.find(x => x[0] === t) || [])[1] || '🔔';

/* v2.235.0 · Textos personalizados (Eric eligió la A de https://claude.ai/artifact/6uxwD5zLEbd3krk1QMeoPF; SQL 140).
   - Configuración → Empresa → «Textos personalizados»: una lista con buscador y filtros con todo lo que cada empresa puede llamar a
     su manera: vocabulario (ajuste terminos), nombres del menú (ajuste menu_nombres; el de las fichas es marca.etiqueta), estados
     comerciales y resultados de visita (renombrar_texto: también en las fichas y en las visitas ya registradas), roles y campos.
   - Los nombres del menú se aplican en el menú lateral, la barra del móvil, «Más» y el título de cada pantalla. */


let TX_OBS = 0;





/* ============================================================
   v2.306.0 · Textos de los correos a los clientes (revisión de Eric con un correo real: al cliente le llegó «IBAN: (añade el
   IBAN…)», la despedida repetía lo que ya dice la firma y el concepto no era su nombre). Cada empresa escribe sus textos en
   Configuración → Correo y firma → «Textos de los correos», con huecos como [nombre] o [iban] que se rellenan al enviar.
   Se guardan en el ajuste plantillas_correo. Sin IBAN no se envían los datos de pago. La despedida y los teléfonos van solo en la firma.
   ============================================================ */


/* ============================================================
   v2.342.0 · Plantillas de correo y de PDF (Eric, 20/10/2026: «que el usuario vaya creando las que quiera, con el nombre que quiera»;
   eligió que al enviar salga la de por defecto y se pueda cambiar).
   - Correo: ajuste plantillas_correo.lista = [{ id, nombre, uso: pago|factura, asunto, texto, defecto }]. Sin lista, las dos de
     siempre (y los textos guardados antes). Configuración → Correo y firma → «Plantillas de correo»: crear, editar, duplicar,
     eliminar y elegir la de por defecto de cada uso. Al enviar los datos de pago o la factura, si hay más de una, se elige.
   - PDF: ajuste factura_pdf_plantillas = { lista: [{ id, nombre, cfg }], defecto }. factura_pdf sigue siendo el de por defecto (lo usa
     también la base, en la proforma del portal). En «Diseño del PDF», una barra para elegir la plantilla, crear, renombrar, eliminar
     y hacerla la de por defecto. Al descargar o enviar una factura, si hay más de una, se elige.
   ============================================================ */



const cfgDePlantilla = id => { const p = listaPDF().lista.find(x => x.id === id); const c = (p && p.cfg) || {};
  return Object.assign({}, PDF_DEF, c, { cols: Object.assign({}, PDF_DEF.cols, c.cols || {}) }); };

let CFG_SEC_ACT = null;

const cfgEstable = (el, max) => new Promise(ok => {
  let t = 0, fin = 0; const ob = new MutationObserver(() => { clearTimeout(t); t = setTimeout(listo, 150); });
  const listo = () => { if (el.querySelector('.cfgcarga, .giro, .spin')) { t = setTimeout(listo, 150); return; } ob.disconnect(); clearTimeout(fin); ok(); };
  ob.observe(el, { childList: true, subtree: true, attributes: true }); t = setTimeout(listo, 200); fin = setTimeout(() => { ob.disconnect(); clearTimeout(t); ok(); }, max || 5000);
});

/* pintarPlan: la parte base y, en orden, cada paso que se le añade (antes eran 6 capas separadas). */
function pintarPlanBase2() {
  pintarPlanBase();
  planBotonesAgenda();
  planHorasYFueraDePlan();
  planMapaYDescartar();
  planVisitadosRecientes();
  planAvisoSinSalida();
  planFichasYNotas();
}

function abrirHorarioPlanBase() {
  const c = PLANCFG();
  $('dbody').innerHTML = `
    <div class="fh"><div><h2>Tiempos de ${TT('visita', 's', '', 'l', 'l')}</h2><div class="sm">Se guardan en tus preferencias. La hora de salida y la de vuelta se ponen en cada ruta.</div></div>
      <button class="x" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="g2">
      <div><label for="hvis">Minutos por ${TT('medico', 's', '', 'l', 'l')}</label><input id="hvis" type="number" min="5" max="60" value="${c.visita}"></div>
      <div><label for="hpar">Minutos fijos por parada</label><input id="hpar" type="number" min="0" max="40" value="${c.parada}"></div>
    </div>
    <div class="acts" style="justify-content:flex-end">
      <button class="btn sec" data-cerrar>Cancelar</button>
      <button class="btn" id="hok">Guardar</button></div>`;
  $('hok').onclick = async ev => {
    ev.target.disabled = true;
    const plan = { visita: +$('hvis').value || 15, parada: $('hpar').value === '' ? 10 : +$('hpar').value };
    const prefs = Object.assign({}, PERFIL.preferencias || {}, { plan });
    const { data } = await db.rpc('guardar_preferencias', { p: prefs });
    PERFIL.preferencias = data || prefs;
    $('dlg').close(); toast('Horario guardado');
    if (ULTIMO_PLAN) construirPlan(ULTIMO_PLAN.conXY, ULTIMO_PLAN.rutaId, null, ULTIMO_PLAN.opts);
    else if (PLAN && PLAN.rutaId) {
      if (typeof PLAN.rutaId === 'string' && PROPUESTAS && PROPUESTAS[PLAN.rutaId]) planDesdeLista(PROPUESTAS[PLAN.rutaId], PLAN.rutaId);
      else planificar(PLAN.rutaId, $('rnueva') || document.createElement('button'));
    }
  };
  $('dlg').showModal();
}









// v2.242.0: aquí iba envioCfg (nadie la usaba)
async function cargarAjustesBase() {
  const { data } = await db.rpc('ajustes_lista');
  AJUSTES = data || {};
}



function arbolConfigBase() {
  const admin = puede('administrar');
  return [
    ['Tu cuenta', [
      { k: 'perfil', ic: 'user', t: 'Mi perfil', d: 'Tus datos, idioma y qué abrir al entrar', r: pintarPerfil },
      { k: 'notif', ic: 'bell', t: 'Notificaciones', d: 'Qué avisos quieres recibir', r: pintarNotif },
      { k: 'rutas', ic: 'route', t: 'Rutas', d: `Punto de salida y llegada, y tiempos de ${TT('visita', 's', '', 'l', 'l')}`, sub: [['salida', 'Salida y llegada', () => pintarPrefsParte('rutas')], ['horario', `Tiempos de ${TT('visita', 's', '', 'l', 'l')}`, () => panelDeVentana(abrirHorarioPlan)]] },
      { k: 'inicio', ic: 'house', t: 'Inicio', d: 'Indicadores de Inicio', sub: [['kpis', 'Indicadores', () => panelDeVentana(abrirKpis)]] }]],
    ['Equipo', admin ? [
      { k: 'equipo', ic: 'users', t: 'Usuarios y roles', d: 'Personas, permisos y roles', sub: [['usuarios', 'Usuarios', pintarUsuarios2], ['roles', 'Roles y permisos', pintarRoles]] },
      { k: 'cartera', ic: 'compass', t: `Cartera y ${TT('visita', 'p', '', 'l', 'l')}`, d: `Reglas de cartera y frecuencia de ${TT('visita', 's', '', 'l', 'l')}`, sub: [['reglas', 'Reglas de cartera', () => panelDeVentana(editorReglasCartera)], ['frec', `Frecuencia de ${TT('visita', 's', '', 'l', 'l')}`, () => panelDeVentana(editorFrecuencia)], ['ciclo', 'Ciclo A/B/C', () => panelDeVentana(editorCiclo)]] },
      { k: 'comis', ic: 'euro', t: 'Comisiones', d: 'Esquemas y quién cobra con cada uno', mod: 'ventas', r: () => panelDeModulo('comisiones') },
      { k: 'seguridad', ic: 'lock-keyhole', t: 'Seguridad y registro', d: 'Accesos y cambios registrados', sub: [['accesos', 'Accesos', () => panelDeModulo('accesos')], ['auditoria', 'Auditoría', () => panelDeModulo('auditoria')]] }] : []],
    ['Datos', [
      ...(puedeCatalogos() ? [{ k: 'cat', ic: 'tag', t: 'Clasificadores', d: 'Listas de valores: estados, motivos…', r: () => { $('cfgcuerpo').innerHTML = ''; pintarCatalogos(); } }] : []),
      ...(admin || nivelDe2('P') >= 3 ? [{ k: 'stock', ic: 'warehouse', t: 'Stock y material', d: `Almacenes y material de ${TT('visita', 's', '', 'l', 'l')}`, mod: 'productos', sub: [['alm', 'Almacenes', pintarAlmacenes2], ['mues', `Material de ${TT('visita', 's', '', 'l', 'l')}`, pintarMaterial]] }] : [])]],
    ['Facturación', admin ? [
      { k: 'fact', ic: 'receipt', t: 'Facturación', d: 'Datos fiscales, series y VeriFactu', mod: 'facturacion', sub: [['fiscal', 'Datos fiscales', fac(pintarEmpresa)], ['series', 'Series', fac(pintarSeries)], ['vf', 'VeriFactu', fac(pintarVerifactu)], ['pdf', 'Diseño del PDF', () => disenoPDF()]] }] : []],
    ['Empresa', admin ? [
      { k: 'marca', ic: 'palette', t: 'Marca y logo', d: 'Nombre de la plataforma y logo', r: pintarMarca },
      { k: 'correo', ic: 'mail', t: 'Correo y firma', d: 'Cuenta de envío y firma', r: pintarCorreo },
      { k: 'copias', ic: 'save', t: 'Copias de seguridad', d: 'Descarga todos los datos', r: pintarCopias }] : []],
    ['Plataforma', puede('gestionar_plataforma') ? [
      { k: 'orgs', ic: 'building', t: 'Organizaciones', d: 'Empresas de la plataforma y alta de nuevas', r: pintarOrganizaciones }] : []]
  ].filter(g => g[1].length);
}

function arbolConfigBase2() { return arbolConfigBase().filter(g => g[0] !== 'Empresa'); }

// Se amplía el árbol con los apartados ocultos y se envuelve cada pintado para mostrar carga y errores
function arbolConfigBase3() {
  const g = arbolConfigBase2();
  const envolver = f => async () => {
    const c = $('cfgcuerpo'); c.innerHTML = '<div class="cfgcarga"><span class="giro"></span> Cargando…</div>';
    // Si al cabo de 20 segundos sigue cargando, se avisa en lugar de dejarlo en blanco
    setTimeout(() => { if (c.isConnected && c.querySelector(':scope > .cfgcarga')) mostrarError(new Error('El apartado no ha terminado de cargar. Revisa la conexión y vuelve a intentarlo.')); }, 20000);
    const mostrarError = e => {
      c.innerHTML = `<div class="card cfgpanel"><h2>No se ha podido cargar</h2><p class="sm">${esc(e && e.message ? e.message : String(e))}</p>
        <div class="acts"><button class="btn sec" id="cfgreint">${svgIco(ICON_NOM['rotate-cw'])} Reintentar</button></div></div>`;
      $('cfgreint').onclick = () => envolver(f)();
    };
    try { await f(); }
    catch (e) { mostrarError(e); }
  };
  g.forEach(([, l]) => l.forEach(x => { if (x.r) x.r = envolver(x.r); if (x.sub) x.sub.forEach(s => { s[2] = envolver(s[2]); }); }));
  // Apartado oculto «Empresa» (se abre desde el menú de usuario)
  g.push(['__oculto', [{ k: '__empresa', ic: 'building', t: 'Empresa', d: '', sub: [['marca', 'Marca y logo', envolver(pintarMarca)], ['correo', 'Correo y firma', envolver(pintarCorreo)], ['copias', 'Copias de seguridad', envolver(pintarCopias)]] }]]);
  return g;
}


function arbolConfigBase4() {
  const g = arbolConfigBase3();
  g.forEach(([, l]) => l.forEach(x => { if (x.k === 'seguridad' && x.sub && !x.sub.some(s => s[0] === 'errores')) x.sub.push(['errores', 'Errores y reportes', pintarErrores]); }));
  return g;
}

// Configuración ya no repite Mi perfil ni Notificaciones: están en su propia página
function arbolConfigBase5() { return arbolConfigBase4().map(([g, l]) => [g, l.filter(x => !['perfil', 'notif'].includes(x.k))]).filter(g => g[1].length); }



// Configuración ya no repite Facturación (datos fiscales, series y VeriFactu): están en Facturación → Configuración.
// Además, tenerlo en los dos sitios creaba dos contenedores con el mismo identificador.
function arbolConfigBase6() { return arbolConfigBase5().map(([g, l]) => [g, l.filter(x => x.k !== 'fact')]).filter(g => g[1].length); }

// Configuración → Datos → Importar datos (administración)
function arbolConfigBase7() {
  const g = arbolConfigBase6();
  // v2.109.0: con el permiso «Importar datos» del rol (antes, solo administración)
  if (!puede('importar_datos')) return g;
  const datos = g.find(x => x[0] === 'Datos');
  const item = { k: 'importar', ic: 'file-spreadsheet', t: 'Importar datos', d: `Clientes, productos, ${etiquetaContactos().toLowerCase()} y ventas desde Excel o CSV`,
    sub: [['nueva', 'Nueva importación', pintarImportar], ['historial', 'Importaciones', pintarImportaciones]] };
  if (datos) { if (!datos[1].some(x => x.k === 'importar')) datos[1].push(item); } else g.push(['Datos', [item]]);
  return g;
}

// Configuración, sin lo que ahora está en Organización
function arbolConfigBase8() {
  return arbolConfigBase7().map(([g, l]) => [g, l.filter(x => !['fact', 'marca', 'correo', 'copias', 'orgs'].includes(x.k))]).filter(g => g[1].length);
}

function arbolConfigBase9() {
  const g = arbolConfigBase8();
  if (puede('administrar') && hayExtra('portal')) {
    const it = { k: 'portal', ic: 'stethoscope', t: `Portal ${TT('medico', 's', 'del', 'l', 'l')}`, d: 'Material que pueden pedir', r: pintarCfgPortal };
    const datos = g.find(x => x[0] === 'Datos');
    if (datos) datos[1].push(it); else g.push(['Datos', [it]]);
  }
  return g;
}

// Configuración: Inicio primero; Usuarios y roles, y Seguridad y registro, ya no están aquí
function arbolConfig() {
  const g = arbolConfigBase9().map(([n, l]) => [n, l.filter(x => !['equipo', 'seguridad', 'orgs'].includes(x.k))]).filter(x => x[1].length);
  for (const grupo of g) {
    const i = grupo[1].findIndex(x => x.k === 'inicio');
    if (i >= 0) { const [it] = grupo[1].splice(i, 1); g[0][1].unshift(it); break; }
  }
  return g;
}


// Filtros generados (listas y sí/no) para una zona de filtros; al cambiar, actualiza «estado» y llama a «alCambiar»
function camposFiltros() { return ''; }

/* ---------- Cuentas: la sección va en su panel de filtros, con sus columnas ---------- */
// Todos los campos pueden ser columna; de entrada se ven los que tienen «Columna en la tabla»



async function cargarCatalogosBase() {
  const claves = Object.keys(CAT);
  const res = await Promise.all(claves.map(k => db.rpc('catalogo_papel', { p_papel: k })));
  claves.forEach((k, i) => { CAT[k] = res[i].data || []; });
  cargarCampos().catch(() => {});
}

function aplicarMarcaBase() {
  const n = nombreApp();
  document.title = n;
  document.querySelectorAll('meta[name="apple-mobile-web-app-title"]').forEach(m => m.content = n);
  const logo = MARCA.logo;
  document.querySelectorAll('header .logo, .lbox img, #bootsplash img').forEach(i => { if (logo) i.src = logo; i.alt = n; });
  const h = document.querySelector('.lbox h1'); if (h) h.textContent = n;
  const g = document.querySelector('#girar span:last-child'); if (g) g.textContent = n + ' se usa en vertical.';
}

function aplicarMarca() {
  aplicarMarcaBase();
  if (!MARCA.logo) document.querySelectorAll('header .logo, .lbox img, #bootsplash img').forEach(i => { i.src = LOGO_NEUTRO; });
}

async function cargarAjustesBase2() { await cargarAjustesBase(); aplicarEtiqueta(); }

// Plan y suscripción: tu plan (usuarios contratados, pago, prueba), los cuatro planes y la comparativa por módulos

// Si la app ya estaba a la vista al cargar este bloque (arranque con el perfil guardado), el menú se ajusta igualmente
async function cargarAjustes(...a) { const r = await cargarAjustesBase2(...a); if (PERFIL) menuOrganizacion(); return r; }


// Comparativa de «Plan y suscripción»: la fila del espacio del profesional pasa a ser la del portal (Oportunidades va en PLAN_FILAS)

// «Plan y suscripción»: los botones reales en lugar de correos

// A medida (como la empresa principal): sin botones de contratar ni de cambiar en línea, salvo que ya pague con Stripe

// «Plan y suscripción»: cambio previsto (con «Anular el cambio»), baja pedida y compromiso de A medida


// «Plan y suscripción»: botones al formulario (en lugar de correos) y la última solicitud con su estado

// «Plan y suscripción»: periodo de prueba de Stripe


async function cargarConfigBase() {
  // v2.340.0 (avisos de Eric): se abre siempre en «Mis datos» (no en el último apartado); al cambiar de apartado solo cambia la página
  // de la derecha (el índice se queda, con su desplazamiento: antes se volvía a montar todo y daba un salto); los apartados con partes
  // son una sola entrada y las partes, pestañas dentro de la página.
  if (typeof salirPanel === 'function') salirPanel();
  const arbol = arbolCfgUnico(), hojas = hojasCfg(arbol);
  const pedida = CFG_KEY || 'datos';
  const it = hojas.find(x => x.k === pedida) || hojas.find(x => x.hijos && x.hijos.some(h => h.k === pedida)) || hojas.find(x => pedida.startsWith(x.k + '.'))
    || hojas.find(x => x.k === 'datos') || hojas[0];
  if (!it) return;
  const hijo = it.hijos ? (it.hijos.find(h => h.k === pedida) || it.hijos[0]) : null;
  CFG_KEY = hijo ? hijo.k : it.k;
  const movil = ES_MOVIL(), v = $('v-config');
  const firma = hojas.map(x => x.k + (x.hijos ? '(' + x.hijos.map(h => h.k).join(',') + ')' : '')).join('|') + '|' + movil;
  if (!(v.dataset.cfgfirma === firma && $('cfulista') && v.querySelector('.cfupag'))) {
    const ind = arbol.map(([gr, l]) => `<h4>${esc(gr)}</h4>${l.map(x => `<button type="button" data-ck="${x.k}">${svgIco(ICON_NOM[x.ic] || '')}<span>${esc(x.t)}</span>${x.mod && !planIncluye(x.mod) ? `<span class="pill p-plan">${esc(planMinimo(x.mod) ? planMinimo(x.mod).nombre : 'Plan')}</span>` : ''}</button>`).join('')}`).join('');
    v.innerHTML = `<div class="saludo"><div><h1>Configuración</h1><div class="fecha">Tu cuenta${arbol.length > 1 ? ', tu equipo y tu empresa, en un solo sitio' : ' y tus preferencias'}</div></div></div>
      <div class="cfu">
        <nav class="cfuidx" aria-label="Apartados de configuración"><div class="cfubusca">${LUPA_CFG}<input id="cfubus" type="search" placeholder="Buscar un ajuste" autocomplete="off" aria-label="Buscar un ajuste"></div>
          <div id="cfulista">${ind}</div><div class="cfusin hide" id="cfusin">Ningún ajuste con esas palabras</div></nav>
        <section class="cfupag"><button type="button" class="cfuvolver" id="cfuvolver">‹ Configuración</button>
          <div class="cfucab"></div><div class="cfupend hide" id="cfupend"></div>
          <div id="cfgcuerpo-hub"><div id="cfgcuerpo"></div></div></section></div>`;
    v.dataset.cfgfirma = firma;
    v.querySelectorAll('#cfulista [data-ck]').forEach(b => b.onclick = () => { CFG_KEY = b.dataset.ck; CFG_DETALLE = true; cargarConfig(); if (ES_MOVIL()) scrollTo(0, 0); });
    $('cfuvolver').onclick = () => { CFG_DETALLE = false; v.querySelector('.cfu').classList.remove('det'); scrollTo(0, 0); };
    // Buscador: por nombre, apartado, partes y palabras clave; Intro abre el primero
    const busca = $('cfubus');
    busca.oninput = () => {
      const q = impNorm(busca.value.trim());
      let vis = 0;
      v.querySelectorAll('#cfulista [data-ck]').forEach(b => {
        const h = hojasCfg(arbolCfgUnico()).find(x => x.k === b.dataset.ck) || {};
        const partes = (h.hijos || []).map(x => x.t + ' ' + (CFG_CLAVES[x.k] || '')).join(' ');
        const txt = impNorm([h.t, h.gr, h.d, partes, CFG_CLAVES[h.k] || ''].join(' '));
        const ok = !q || q.split(/\s+/).every(p => txt.includes(p)); b.classList.toggle('hide', !ok); if (ok) vis++;
      });
      v.querySelectorAll('#cfulista h4').forEach(e => {
        let x = e.nextElementSibling, alguno = false;
        while (x && x.tagName !== 'H4') { if (x.matches('[data-ck]:not(.hide)')) alguno = true; x = x.nextElementSibling; }
        e.classList.toggle('hide', !!q && !alguno);
      });
      $('cfusin').classList.toggle('hide', vis > 0);
    };
    busca.onkeydown = e => { if (e.key === 'Enter') { const b = v.querySelector('#cfulista [data-ck]:not(.hide)'); if (b) { e.preventDefault(); b.click(); } } };
    cfuAjustarIndice();
  }
  v.querySelector('.cfu').classList.toggle('det', movil && CFG_DETALLE);
  v.querySelectorAll('#cfulista [data-ck]').forEach(b => b.classList.toggle('on', b.dataset.ck === it.k));
  // Cabecera de la página y, si tiene partes, sus pestañas
  v.querySelector('.cfucab').innerHTML = `<div class="miga">${esc(it.gr)}</div><h2>${esc(it.t)}</h2>${it.d ? `<p>${esc(it.d)}</p>` : ''}`;   // v2.344.0: sin pestañas: las partes, una debajo de otra
  v.querySelectorAll('.cfucab [data-cks]').forEach(b => b.onclick = () => { if (b.dataset.cks === CFG_KEY) return; CFG_KEY = b.dataset.cks; cargarConfig(); });
  $('cfupend').classList.add('hide'); $('cfupend').innerHTML = '';
  $('cfgcuerpo-hub').innerHTML = '<div id="cfgcuerpo"></div>';
  // Lo pendiente: punto en el índice (en el apartado que lo contiene) y aviso en la página
  pendientesCfg().then(l => {
    if (!$('cfulista')) return;
    Object.entries(l).forEach(([k, t]) => { const b = [...v.querySelectorAll('#cfulista [data-ck]')].find(x => k === x.dataset.ck || k.startsWith(x.dataset.ck + '.')); if (b && !b.querySelector('.cfupt')) { b.insertAdjacentHTML('beforeend', '<span class="cfupt"></span>'); b.title = t; } });
    if (l[CFG_KEY] && $('cfupend')) { $('cfupend').innerHTML = `<span class="cfupt"></span>${esc(l[CFG_KEY])}`; $('cfupend').classList.remove('hide'); }
  });
  // El apartado (o, si el plan no lo incluye, qué plan lo trae)
  const r = it.hijos ? () => cfgApilar(it, hijo) : it.r;
  if (it.mod && !planIncluye(it.mod)) {
    const p = planMinimo(it.mod);
    $('cfgcuerpo').innerHTML = `<div class="card cfgpanel planup"><div class="planupico">${svgIco(ICON_NOM.lock)}</div><h2>${esc(it.t)} está en el plan ${esc(p ? p.nombre : 'A medida')}</h2>
      <p class="sm">Tu plan ${esc(planDe(PLAN_ACTUAL.plan).nombre)} no lo incluye.</p>${puedeOrganizacion() ? '<div class="acts"><button class="btn" id="planver">Ver planes</button></div>' : ''}</div>`;
    if ($('planver')) $('planver').onclick = () => { CFG_KEY = 'o.plan'; cargarConfig(); };
  } else Promise.resolve().then(r);
}


// Configuración: botón de volver
async function cargarConfigBase2(...a) {
  const r = await cargarConfigBase.apply(this, a);
  const b = $('cfuvolver');
  if (b && !b.classList.contains('manvuelta')) { b.classList.add('manvuelta'); b.innerHTML = '<b aria-hidden="true">‹</b> Volver'; b.setAttribute('aria-label', 'Volver a Configuración'); }
  return r;
}

// Catálogos guardados en el móvil (resultado por defecto de la visita, «No estaba»…)
async function cargarCatalogos(...a) {
  const r = await cargarCatalogosBase.apply(this, a);
  try {
    const vacio = Object.values(CAT).every(v => !v || !v.length);
    if (!vacio) localStorage.setItem('dlc-cat', JSON.stringify(CAT));
    else { const g = JSON.parse(localStorage.getItem('dlc-cat') || 'null'); if (g) Object.keys(CAT).forEach(k => { if (g[k] && g[k].length) CAT[k] = g[k]; }); }
  } catch (e) {}
  return r;
}

// Al cambiar de apartado, la ventana de siempre vuelve a su sitio
async function cargarConfig(...a) {
  const hub = $('cfgcuerpo-hub');
  if (hub && hub.dataset.apilado) {
    hub.querySelectorAll('[data-idd]').forEach(e => e.removeAttribute('data-idd'));
    const m = $('dbody-modal'); if (m) { const p = document.querySelector('#dbody[data-panel]'); if (p) p.removeAttribute('id'); m.id = 'dbody'; }
    PANEL_ACTIVO = null; CFG_SEC_ACT = null; delete hub.dataset.apilado;
  }
  return cargarConfigBase2.apply(this, a);
}

// Preferencias, Clasificadores, Auditoría, Registro, campos personalizados y entorno de pruebas están en src/app/screens/settings
// (v2.415.0). Estos nombres se quedan: las secciones de Configuración, Facturación, Pedidos, Productos, Clientes, la ficha, el Panel
// delcos, legado 002, 004, 014, 073 y 148 y las pruebas los usan.
function pintarPrefs() { return window.delcos.screens.settings.paintPreferences(); }
function pintarPrefsPaso2() { return window.delcos.screens.settings.paintProfile(); }
function pintarCatalogos() { return window.delcos.screens.settings.paintClassifiers(); }
function pintarAuditoria() { return window.delcos.screens.settings.paintAudit(); }
function pintarRegistro() { return window.delcos.screens.settings.paintBillingLog(); }
function cargarCampos() { return window.delcos.screens.settings.loadCustomFields(); }
function camposHTML(amb, valores) { return window.delcos.screens.settings.customFieldsHtml(amb, valores); }
function camposLeer(raiz) { return window.delcos.screens.settings.readCustomFields(raiz); }
function camposGuardar(leido, id) { return window.delcos.screens.settings.saveCustomFields(leido, id); }
function camposInsertar(raiz, amb, id, antesDe) { return window.delcos.screens.settings.insertCustomFields(raiz, amb, id, antesDe); }
function camposFiltrosActivar(zona, estado, alCambiar) { return window.delcos.screens.settings.bindCustomFieldFilters(zona, estado, alCambiar); }
function bloqueCampos(tabla, id, cont) { return window.delcos.screens.settings.paintCustomFieldsBlock(tabla, id, cont); }
function estadoRefresco() { return window.delcos.screens.settings.refreshStatus(); }
function pintarCfgPruebas() { return window.delcos.screens.settings.paintTestEnvironment(); }

// Configuración, segunda parte: está en src/app/screens/settings/more (v2.415.0). Estos nombres se quedan: el resto de
// Configuración, las pestañas de las páginas, los puentes, Productos, Eventos y las pruebas los usan.
function editorReglasCartera() { return window.delcos.screens.settingsMore.editPortfolioRules(); }
function pintarCopias() { return window.delcos.screens.settingsMore.paintBackups(); }
function deshacerUno(id, despues) { return window.delcos.screens.settingsMore.undoChange(id, despues); }
function cajaDeshacerPersona(caja, usuario, desde, nombre, despues) { if (caja) window.delcos.screens.settingsMore.paintPersonUndo({ box: caja, user: usuario, from: desde, name: nombre, then: despues }); }
function pintarEstadosPapel() { return window.delcos.screens.settingsMore.paintCommercialStates(); }
function matMejorar() { return window.delcos.screens.settingsMore.improveMaterial(); }
function conexionTxt(a, largo) { return window.delcos.screens.settingsMore.connectionText(a, !!largo); }
function pintarAccesos() { return window.delcos.screens.settingsMore.paintAccesses(); }
function facccon(uid) { return window.delcos.screens.settingsMore.fillConnection(uid); }
function textoValor(v) { return window.delcos.screens.settingsMore.valueText(v); }
function resumenDetalle(d) { return window.delcos.screens.settingsMore.detailSummary(d); }
function abrirClasificador(id) { return window.delcos.screens.settingsMore.openClassifier(id); }
function decorarResultados() { return window.delcos.screens.settingsMore.decorateResults(); }
function pintarRoles() { return window.delcos.screens.settingsMore.paintRoles(); }
function pintarMarca() { return window.delcos.screens.settingsMore.paintBrand(); }

// Correo y firma, notificaciones y textos personalizados están en src/app/screens/settings (v2.417.0). Estos nombres se quedan:
// el árbol de Configuración, la campana, Pedidos, Facturación, servicios/pdf.js, el menú y las pruebas los usan.
function pintarCorreo() { return window.delcos.screens.settingsExtra.paintEmail(); }
function varsCorreo(o) { return window.delcos.screens.settingsExtra.emailVariables(o || {}); }
function plantillaCorreo(k, campo, v) { return window.delcos.screens.settingsExtra.fillTemplate(k, campo, v); }
function listaCorreos() { return window.delcos.screens.settingsExtra.templateList(); }
function plantillasCorreo(uso) { return window.delcos.screens.settingsExtra.templatesFor(uso); }
function guardarCorreos(lista) { return window.delcos.screens.settingsExtra.saveTemplates(lista); }
function elegirPlantillaCorreo(uso) { return window.delcos.screens.settingsExtra.chooseTemplate(uso); }
function idPlant() { return window.delcos.screens.settingsExtra.newTemplateId(); }
function panelNotificaciones(l) { return window.delcos.screens.settingsExtra.showNotifications(l); }
function pintarNotif() { return window.delcos.screens.settingsExtra.paintNotificationSettings(); }
function notifModo(k) { return window.delcos.screens.settingsExtra.notificationMode(k); }
function guardarPrefsAvisos(avisos) { return window.delcos.screens.settingsExtra.saveOrderAlerts(avisos); }
function pintarTextos() { return window.delcos.screens.settingsExtra.paintMenuNames(); }

// Usuarios, Mi perfil y «Plan y suscripción» están en src/app/screens/settings (v2.420.0). Estos nombres se quedan: el árbol de
// Configuración, las páginas «perfil» y «plan», legado 004/007/052/076, la ficha, Panel delcos y las pruebas los usan.
function editarUsuario(id) { return window.delcos.screens.settingsRest.editUser(id); }
function nuevoUsuario(pre) { return window.delcos.screens.settingsRest.newUser(pre && pre.medico ? pre : null); }
function pintarUsuarios2() { return window.delcos.screens.settingsRest.paintUsers(); }
function detalleUsuario(u) { return window.delcos.screens.settingsRest.showUser(u); }
function asegurarUsuario(id) { return window.delcos.screens.settingsRest.ensureUser(id); }
function guardarKpis(lista) { return window.delcos.screens.settingsRest.saveIndicators(lista); }
function pintarPrefsParte(parte) { return window.delcos.screens.settingsRest.paintPreferencesPart(parte); }
function pintarPerfil() { return window.delcos.screens.settingsRest.paintMyProfile(); }
function perdidasPlan(de, a, datos) { return window.delcos.screens.settingsRest.planLosses(de, a, datos || null); }
function reciboCalculado(pl) { return window.delcos.screens.settingsRest.receiptOf(pl); }
function pintarPaginaPlanBase10() { return window.delcos.screens.settingsRest.paintPlanPage(); }
