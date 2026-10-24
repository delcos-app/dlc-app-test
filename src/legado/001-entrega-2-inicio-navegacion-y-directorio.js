/* ============================================================
   DLC OS 2.0 · Entrega 2: inicio, navegación y directorio
   ============================================================ */

const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CFG = window.DLC_CONFIG;
// Enlace del correo de recuperación: se detecta antes de que se procese, para no arrancar la app con esa sesión
// v2.168.0: también el enlace de bienvenida (invitación) de quien se da de alta desde la web: primero crea su contraseña
const INVITACION_URL = /(^#|&)type=invite(&|$)/.test(location.hash);
const RECUPERACION_URL = /(^#|&)type=(recovery|invite)(&|$)/.test(location.hash);
const ENLACE_CADUCADO = /(^#|&)error_code=/.test(location.hash) || /(^#|&)error=access_denied/.test(location.hash);
/* Sesión: si al entrar se desmarcó «Mantener la sesión iniciada», al cerrar el navegador hay que volver a entrar */
try { if (localStorage.getItem('dlc-no-recordar') && !/(^|; )dlc-sesion-viva=1/.test(document.cookie)) localStorage.removeItem('dlc-os-sesion'); } catch (e) {}

/* v2.181.0 · Nombres neutros en las respuestas de la base (decisión de Eric: dos versiones). Desde la v2.182.0 (SQL 116) estas funciones
   responden con nombres neutros (cuenta, ubicaciones, actividades…) en lugar de los de DLC (medico, consultas, visitas…). La app sigue usando
   por dentro los de siempre: al recibir la respuesta de una de ellas, cada clave nueva se copia también con su nombre antiguo (si no viene ya).
   Con la base todavía en los nombres antiguos no hace nada. Para una función nueva que use estos nombres, añadirla a FN_NEUTRAS. */
const CLAVES_NEUTRAS = { cuenta: 'medico', cuentas: 'medicos', ubicaciones: 'consultas', actividades: 'visitas', cuenta_codigo: 'medico_codigo',
  clientes: 'pacientes', ultima_actividad: 'ultima_visita', actividades_mes: 'visitas_mes', actividades_semana: 'visitas_semana',
  ubicacion_telefono: 'consulta_telefono', dias_con_actividad: 'dias_con_visitas', dias_sin_actividad: 'dias_sin_visita',
  cuentas_visitadas: 'medicos_visitados', n_ubicaciones: 'n_consultas', n_actividades: 'n_visitas', por_cuenta: 'por_medico',
  ultimas_actividades: 'ultimas_visitas', actividades_dia: 'visitas_dia', actividades_total: 'visitas_total' };
const FN_NEUTRAS = new Set(['actividad_mensual', 'agenda_metricas', 'analitica_kpis', 'analitica_kpis_periodo', 'analitica_v2', 'buscar_centros', 'buscar_cuentas',
  'buscar_global', 'cartera_usuario', 'clientes_lista', 'constancia_pacientes', 'contacto_detalle', 'contactos_lista', 'ficha_centro', 'ficha_cuenta', 'guardar_cuenta',
  'importar_lote', 'informe_cuenta', 'llamadas_lista', 'llamadas_resumen', 'llamadas_seguimiento', 'panel_inicio', 'pedido_detalle', 'pedidos_lista',
  'pedidos_pagina', 'pedidos_pagina_base', 'plan_uso', 'resumen_inicio', 'resumen_seguimiento', 'rutas_candidatos', 'seguimiento_lista',
  'sugerencias_centros', 'supervision_equipo', 'toca_actividad', 'trazabilidad_lote', 'usuarios_lista', 'usuarios_resumen', 'zonas_resumen']);
const RE_NEUTRAS = new RegExp('"(' + Object.keys(CLAVES_NEUTRAS).join('|') + ')"\\s*:');

const db = window.supabase.createClient(CFG.url, CFG.anon, {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: 'dlc-os-sesion',
    // Bloqueo dentro de la pestaña: evita esperas largas cuando hay otra pestaña de la app abierta.
    // Nunca se espera más de 8 s a la operación anterior: si una renovación de sesión se cuelga (mala cobertura,
    // volver del segundo plano en el móvil), las consultas siguientes no se quedan esperando para siempre
    lock: (() => { const colas = {}; return (nombre, t, fn) => {
      const previa = colas[nombre] || Promise.resolve();
      const run = Promise.race([previa, new Promise(r => setTimeout(r, 8000))]).then(() => fn());
      colas[nombre] = run.catch(() => {}); return run; }; })() },
  // Toda consulta tiene un tiempo máximo (20 s): si la red no responde, se da error en lugar de quedarse cargando
  global: { fetch: (url, o = {}) => {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 20000);
    if (o.signal) { if (o.signal.aborted) ctl.abort(); else o.signal.addEventListener('abort', () => ctl.abort()); }
    // Aquí pasan TODAS las peticiones reales: es donde se cuentan las pendientes (para mostrar cada pantalla entera)
    const marca = window.__redIni ? window.__redIni() : null;
    return fetch(url, Object.assign({}, o, { signal: ctl.signal })).then(r => respuestaConClavesAntiguas(url, r)).finally(() => { clearTimeout(t); if (marca && window.__redFin) window.__redFin(marca); });
  } }
});

let PERFIL = null, TAB = 'inicio';

/* v2.71.0 · Diccionario de términos. Los textos no escriben «médico», «paciente» ni «visita»: los piden a TT(),
   que los saca del vocabulario de cada cliente (ajuste «terminos») con su plural, su género y el artículo que concuerda.
   TT(término, 's'|'p', determinante, mayúsculas del determinante, mayúsculas del nombre[, adjetivo en masculino singular]) · 'l' minúscula, 'C' inicial, 'U' todo. */
// v2.224.0: palabras de partida genéricas (antes «médico» y «paciente»: DLC las tiene como vocabulario propio desde el SQL 133)
const TERM_DEF = { medico: { s: 'profesional', p: 'profesionales', g: 'm' }, paciente: { s: 'cliente', p: 'clientes', g: 'm' }, visita: { s: 'visita', p: 'visitas', g: 'f' }, pauta: { s: 'solicitud', p: 'solicitudes', g: 'f' },
  consulta: { s: 'ubicación', p: 'ubicaciones', g: 'f' }, especialidad: { s: 'segmento', p: 'segmentos', g: 'm' } };   // v2.347.0
const TERM_DET = { el: ['el', 'los', 'la', 'las'], un: ['un', 'unos', 'una', 'unas'], del: ['del', 'de los', 'de la', 'de las'], al: ['al', 'a los', 'a la', 'a las'],
  este: ['este', 'estos', 'esta', 'estas'], ningun: ['ningún', 'ningunos', 'ninguna', 'ningunas'], otro: ['otro', 'otros', 'otra', 'otras'],
  nuevo: ['nuevo', 'nuevos', 'nueva', 'nuevas'], primer: ['primer', 'primeros', 'primera', 'primeras'], ultimo: ['último', 'últimos', 'última', 'últimas'],
  proximo: ['próximo', 'próximos', 'próxima', 'próximas'] };
const TERMKEY = 'dlc-terminos';
let TERMINOS = {};
try { TERMINOS = JSON.parse(localStorage.getItem(TERMKEY) || '{}') || {}; } catch (e) { TERMINOS = {}; }
const terminoDe = k => { const d = TERM_DEF[k] || { s: k, p: k + 's', g: 'm' }, t = TERMINOS[k] || {};
  return { s: String(t.s || '').trim() || d.s, p: String(t.p || '').trim() || d.p, g: t.g === 'f' || t.g === 'm' ? t.g : d.g }; };
const casoTermino = (t, c) => c === 'U' ? t.toUpperCase() : c === 'C' ? t.charAt(0).toUpperCase() + t.slice(1) : t;
// v2.347.0: «Todos los segmentos» / «Todas las especialidades»
const todosLos = k => (terminoDe(k).g === 'f' ? 'Todas ' : 'Todos ') + TT(k, 'p', 'el', 'l', 'l');
const consultaPrivada = (cn = 'C') => TT('consulta', 's', '', 'l', cn, 'privado');

/* v2.69.0 · Permisos por capacidad. El código pregunta qué puede hacer una persona (puede('administrar')),
   nunca cómo se llama su rol: los roles y sus capacidades son datos de cada cliente (tablas roles y roles_capacidades). */
const ROLKEY = 'dlc-roles';
let ROLES_DEF = [];
try { ROLES_DEF = JSON.parse(localStorage.getItem(ROLKEY) || '[]') || []; } catch (e) { ROLES_DEF = []; }
const puede = c => !!(PERFIL && (PERFIL.capacidades || []).includes(c));
const rolDef = r => ROLES_DEF.find(x => x.nombre === r) || null;
const rolPuede = (r, c) => { const d = rolDef(r); return !!(d && (d.capacidades || []).includes(c)); };
const rolesNombres = () => ROLES_DEF.map(x => x.nombre);
const rolCon = c => (ROLES_DEF.find(x => (x.capacidades || []).includes(c)) || {}).nombre || '';
const rolPorDefecto = () => (ROLES_DEF.find(x => x.por_defecto) || ROLES_DEF.find(x => !(x.capacidades || []).includes('administrar')) || {}).nombre || '';
/* v2.70.0 · Estados comerciales como catálogo: el código conoce su papel (inicial, avance, interes, positivo, negativo), no su nombre */
const ESTKEY = 'dlc-estados';
let ESTADOS_DEF = [];
try { ESTADOS_DEF = JSON.parse(localStorage.getItem(ESTKEY) || '[]') || []; } catch (e) { ESTADOS_DEF = []; }
const estados = () => ESTADOS_DEF.map(x => x.valor);
const estadoPapel = p => (ESTADOS_DEF.find(x => x.papel === p) || {}).valor || '';
const papelEstado = v => (ESTADOS_DEF.find(x => x.valor === v) || {}).papel || '';
// v2.97.0: colores del sistema de diseño por papel (pendiente ámbar, avance azul, interés marino, positivo verde, negativo gris)
const COL_PAPEL = { inicial: '#8A4B0B', avance: '#3F82C0', interes: '#17457A', positivo: '#0E6B4C', negativo: '#4A5868' };
const colEstado = v => COL_PAPEL[papelEstado(v)] || '';
const F = { q: '', prov: '', muni: '', esp: '', est: '', urg: false, orden: 'nombre', pagina: 0, total: 0, campos: {} };
const PASO = 50;

// Fechas SIEMPRE en hora local (España): convertir a hora universal restaba un día de 00:00 a 02:00
const isoLocal = d => { const x = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return x.toISOString().slice(0, 10); };
const hoyISO = () => isoLocal(new Date());
let fechaLarga = d => d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
const fechaCorta = s => { const d = new Date(s + 'T00:00:00'); return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }); };
// Nombre sin tratamiento delante («Dr. Gonzalo Serrano» → Gonzalo, iniciales GS)
const TRATAMIENTO = /^(dr|dra|d|dña|dª|sr|sra|srta|prof|profa|lic|ldo|lda)\.?$/i;
const partesNombre = n => { const p = String(n || '').trim().split(/\s+/); while (p.length > 1 && TRATAMIENTO.test(p[0])) p.shift(); return p; };
const nombrePila = n => partesNombre(n)[0] || '';
const iniciales = n => partesNombre(n).slice(0, 2).map(x => x[0] || '').join('').toUpperCase();
const num = n => Number(n || 0).toLocaleString('es');

/* ---------------- acceso ---------------- */

$('lform').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = $('lbtn'), msg = $('lmsg');
  btn.disabled = true; btn.textContent = 'Entrando…'; msg.textContent = '';
  const { error } = await db.auth.signInWithPassword({ email: $('lu').value.trim(), password: $('lp').value });
  btn.disabled = false; btn.textContent = 'Entrar';
  if (error) {
    if (/not confirmed/i.test(error.message)) { accesoSinActivar('Tu cuenta aún no está activada: abre el enlace del correo que te enviamos o pide uno nuevo.'); return; }
    msg.textContent = error.message === 'Invalid login credentials'
      ? 'Correo o contraseña incorrectos.' : 'No se ha podido entrar: ' + error.message;
    return;
  }
  arrancar();
});


/* ---------------- menú de usuario ---------------- */

$('ubtn').addEventListener('click', e => { e.stopPropagation(); $('umenu').classList.toggle('hide'); });
document.addEventListener('click', () => $('umenu').classList.add('hide'));
$('umenu').addEventListener('click', async e => {
  const b = e.target.closest('[data-u]'); if (!b) return;
  if (b.dataset.u === 'salir') {
    await db.rpc('registrar_acceso', { p_evento: 'Salida', p_agente: navigator.userAgent }).catch(() => {});
    await db.auth.signOut(); location.reload();
  }
  else if (b.dataset.u === 'cfg') ir('config');
  else if (b.dataset.u === 'pass') { /* lo gestiona el módulo de contraseñas */ }
  else if (b.dataset.u === 'adm') ir('admin');
});

/* ---------------- navegación ---------------- */

$('nav').addEventListener('click', e => {
  const b = e.target.closest('[data-t]'); if (!b || b.disabled) return;
  ir(b.dataset.t);
});

/* Navegación entre módulos.
   Reúne en una sola función lo que antes estaba repartido en 13 piezas (la original y 12 capas),
   con el mismo orden: comprobaciones de destino, cancelación de lo pendiente, cambio de pantalla,
   carga del módulo e indicador de carga. */
var ir = function (t) {
  // 1. Destinos que no se abren o que se redirigen
  if (t in MODULO_AREA && PERFIL && puedeModuloV2400(t) && !planIncluye(t)) { avisoPlan(t); return; }   // fuera del plan contratado
  if (t === 'admin') { CFG_SEC = CFG_ADMIN[ADM_SEC] || 'usuarios'; t = 'config'; }                       // Administración vive en Configuración

  // 2. Se cancela todo lo que estaba pendiente de la pantalla anterior
  document.querySelectorAll('main > section.cargando').forEach(s => s.classList.remove('cargando'));
  PEND = 0;
  if (t !== 'config') salirPanel();
  NAV_CTRL.abort(); NAV_CTRL = new AbortController(); NAV_GEN++;
  if (typeof cerrarSelector === 'function') cerrarSelector();

  // 3. Destino según el perfil y los permisos
  if (ES_MEDICO() && !['informe', 'manual', 'config'].includes(t)) t = 'informe';
  if (t in MODULO_AREA && !puedeModulo(t)) { toast('No tienes permiso para ese módulo', true); t = puedeModulo('inicio') ? 'inicio' : 'agenda'; }

  // 4. Cambio de pantalla
  if (t !== TAB) TAB_ANTERIOR = TAB;
  $('tools').classList.remove('abierto');
  if (t !== 'agenda') AG_VISTA = null;
  TAB = t;
  document.querySelectorAll('nav.main [data-t], #bnav [data-t]').forEach(x => x.setAttribute('aria-selected', String(x.dataset.t === t)));
  document.querySelectorAll('main > section').forEach(s => s.classList.toggle('hide', s.id !== 'v-' + t));
  window.scrollTo({ top: 0 });

  // 5. Carga del módulo
  const cargar = {
    directorio: () => { if (!$('lista').children.length) buscar(true); },
    inicio: cargarInicio, agenda: cargarAgenda, rutas: cargarRutas, seguimiento: cargarSeguimiento,
    ventas: cargarVentas, analitica: cargarAnalitica, config: cargarConfig, duplicados: cargarDuplicados,
    pacientes: cargarPacientes, productos: cargarProductosModulo, manual: cargarManual,
    facturacion: cargarFacturacion, informe: cargarInforme
  };
  if (cargar[t]) cargar[t]();
  pintarBnav();

  // 6. Indicador de carga: se quita cuando el módulo deja de pedir datos (como mucho, 8 segundos)
  const sec = $('v-' + t); if (!sec || ES_MEDICO()) return;
  sec.classList.add('cargando');
  const t0 = performance.now(); let quietos = 0;
  const w = setInterval(() => {
    if (TAB !== t) { clearInterval(w); sec.classList.remove('cargando'); return; }
    quietos = PEND === 0 ? quietos + 1 : 0;
    if ((quietos >= 3 && performance.now() - t0 > 300) || performance.now() - t0 > 8000) { clearInterval(w); requestAnimationFrame(() => sec.classList.remove('cargando')); }
  }, 80);
};

/* ---------------- inicio ---------------- */


const itemHTML = (id, ico, clase, titulo, sub) =>
  `<button class="item" data-id="${id}"><span class="ic ${clase || ''}">${ico}</span>
   <span class="tx"><b>${esc(titulo)}</b><span class="sm">${sub}</span></span></button>`;


$('v-inicio').addEventListener('click', e => {
  const kf = e.target.closest('[data-kf]');
  if (kf) { aplicarFiltroGuardado(JSON.parse(kf.dataset.kf)); return; }
  const k = e.target.closest('[data-k]');
  if (k) {
    if (k.dataset.k === 'cfgkpis') { abrirKpis(); return; }
    if (k.dataset.k === 'dups') { ir('duplicados'); return; }
    Object.assign(F, { q: '', prov: '', muni: '', esp: '', est: '', urg: false, orden: 'nombre' });
    if (k.dataset.k === 'urgentes') { F.urg = true; F.orden = 'urgentes'; }
    if (k.dataset.k === 'interesados') F.est = estadoPapel('interes');
    if (k.dataset.k === 'sin_contactar') F.est = estadoPapel('inicial');
    $('q').value = ''; $('fest').value = F.est;
    ir('directorio'); buscar(true);
    return;
  }
  const it = e.target.closest('[data-id]');
  if (it) abrirFicha(it.dataset.id);
});

/* ---------------- filtros ---------------- */


let temporizador;
$('q').addEventListener('input', e => {
  clearTimeout(temporizador);
  temporizador = setTimeout(() => {
    // Solo filtra si ya estás en el directorio: desde otra pantalla espera a que elijas un resultado
    if (TAB !== 'directorio') return;
    F.q = e.target.value.trim();
    buscar(true);
  }, 300);
});

$('fprov').addEventListener('change', e => { F.prov = e.target.value; F.muni = ''; cargarFiltros(true); buscar(true); });
$('fmuni').addEventListener('change', e => { F.muni = e.target.value; buscar(true); });
$('fesp').addEventListener('change', e => { F.esp = e.target.value; buscar(true); });
$('frep').addEventListener('change', e => { F.rep = e.target.value; buscar(true); });
$('fest').addEventListener('change', e => { F.est = e.target.value; buscar(true); });
$('forden').addEventListener('change', e => { F.orden = e.target.value; buscar(true); });

function pintarChips() {
  const c = [];
  if (F.q) c.push(['q', 'Búsqueda: ' + F.q]);
  if (F.prov) c.push(['prov', F.prov]);
  if (F.muni) c.push(['muni', F.muni]);
  if (F.esp) c.push(['esp', F.esp]);
  if (F.est) c.push(['est', F.est]);
  if (F.urg) c.push(['urg', 'Solo urgentes']);
  if (F.mios) c.push(['mios', 'De mi cartera']);
  if (F.sin) c.push(['sin', 'Sin visitar nunca']);
  $('chips').innerHTML = c.map(([k, t]) => `<button class="chip" data-x="${k}">${esc(t)} ✕</button>`).join('');
}

$('chips').addEventListener('click', e => {
  const b = e.target.closest('[data-x]'); if (!b) return;
  const k = b.dataset.x;
  if (k === 'q') { F.q = ''; $('q').value = ''; }
  else if (k === 'urg') F.urg = false;
  else if (k === 'mios' || k === 'sin') F[k] = false;
  else { F[k] = ''; $('f' + k).value = ''; if (k === 'prov') { F.muni = ''; cargarFiltros(true); } }
  buscar(true);
});

/* ---------------- directorio ---------------- */

let BUSQ_N = 0;   // solo cuenta la última búsqueda: las anteriores se descartan aunque respondan después
async function buscar(reiniciar) {
  if (typeof MODO_MAPA !== 'undefined' && MODO_MAPA && reiniciar) setTimeout(() => pintarMapa(), 10);
  if (reiniciar) F.pagina = 0;
  const yo = ++BUSQ_N;
  cargando($('lista'), 'Buscando ' + etiquetaContactos().toLowerCase() + '…');
  $('cuenta').textContent = 'Buscando…';
  const t0 = performance.now();
  const params = {
    q: F.q || null, f_provincia: F.prov || null, f_municipio: F.muni || null,
    f_estado: F.est || null, f_especialidad: F.esp || null, f_area: null,
    f_urgentes: F.urg, f_mios: !!F.mios, f_sin_visitar: !!F.sin, f_comercial: F.com || null, f_reporting: F.rep || null,
    ...(F.tipo ? { f_tipo: F.tipo } : {}),
    orden: F.orden, lim: tamPagina(), desplaz: F.pagina * tamPagina(),
    ...(Object.keys(F.campos || {}).length ? { f_campos: F.campos } : {})
  };
  let { data, error } = await db.rpc('buscar_cuentas', params);
  if (yo !== BUSQ_N) return;   // ya hay una búsqueda más reciente
  // Si falla (móvil que vuelve del segundo plano, cobertura), se reintenta una vez al momento antes de avisar
  if (error || !data) {
    ({ data, error } = await db.rpc('buscar_cuentas', params));
    if (yo !== BUSQ_N) return;
  }

  if (error || !data) {
    $('cuenta').textContent = '';
    $('lista').innerHTML = `<div class="vacio">No se ha podido cargar la lista${error && /abort/i.test(error.message || '') ? ' (la conexión no responde)' : ''}.<br><button class="btn sec" type="button" id="dirreint" style="margin-top:10px">Reintentar</button></div>`;
    $('dirreint').onclick = () => buscar(true);
    return;
  }

  F.total = data.total;
  const ms = Math.round(performance.now() - t0);
  $('cuenta').innerHTML = `<b>${num(data.total)}</b> ${esc(etiquetaContactos().toLowerCase())} <span class="sm">· ${ms} ms</span>`;
  pintarChips();

  const filas = data.filas || [];
  if (!filas.length) { $('lista').innerHTML = `<div class="vacio">Ningún registro cumple estos filtros.</div>`; $('thead').innerHTML = ''; }
  else { cabeceraTabla(); $('lista').innerHTML = filas.map(filaTabla).join(''); }

  paginador($('dirpag'), data.total, F.pagina, p => {
    F.pagina = p; buscar(false);
    $('tabla').scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, () => buscar(true));
}



$('lista').addEventListener('click', e => { const b = e.target.closest('[data-id]'); if (b) abrirFicha(b.dataset.id); });

/* ---------------- ficha ---------------- */

/* Ficha del prescriptor: la ficha base y, en orden, cada bloque que se le añade
   (antes eran 6 capas separadas). */
async function abrirFicha(id, ...r) {
  const d = $('ficha'); d.classList.add('cargando');
  const limite = setTimeout(() => d.classList.remove('cargando'), 8000);
  try {
    FICHA_PAC = null;
    await pintarFichaBase(id, ...r);
    await fichaComercialYPacientes(id);
    await fichaAvisoHorario(id);
    await fichaMaterialVisitas(id);
    await fichaUnidades(id);
    await fichaClientes(id);
    // v2.96.0: si no hay ventas que enseñar (o no hay permiso para verlas), la sección no aparece
    if ($('fventas') && !$('fventasc').children.length) $('fventas').remove();
  } finally { clearTimeout(limite); requestAnimationFrame(() => d.classList.remove('cargando')); }
  await fichaAcceso(id);
}





// v2.113.0 · Unidades de la ficha por semana (12), mes (12) o año (5)
const UDS_SERIES = [['semana', 'Semana'], ['mes', 'Mes'], ['anio', 'Año']];
let UDS_SERIE = (() => { try { const v = localStorage.getItem('dlc-uds-serie'); return ['semana', 'mes', 'anio'].includes(v) ? v : 'mes'; } catch (e) { return 'mes'; } })();
const leyendaUnidades = k => ({ semana: 'barras: últimas 12 semanas', mes: 'barras: últimos 12 meses', anio: 'barras: últimos 5 años' })[k];




/* v2.96.0 · «Para la visita»: lo que hace falta al llegar, arriba del todo.
   Dónde (centro, planta, sala, cómo llegar), cuándo (su horario de hoy y el del centro), cómo entrar,
   lo que quedó pendiente en la última visita, las notas y a quién llamar. Las ventas van al final. */
// La consulta de la visita: la que tiene consulta hoy; si ninguna, la principal
function consultaDeLaVisita(cons) {
  const hoy = hoyLetra();
  return (cons || []).find(c => (c.dias || {})[hoy]) || (cons || [])[0] || null;
}

$('ficha').addEventListener('click', e => { if (e.target.id === 'ficha') $('ficha').close(); });

/* ---------------- arranque ---------------- */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

