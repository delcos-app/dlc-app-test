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
function copiarClavesAntiguas(x) {
  if (Array.isArray(x)) { x.forEach(copiarClavesAntiguas); return; }
  if (!x || typeof x !== 'object') return;
  for (const k of Object.keys(x)) { copiarClavesAntiguas(x[k]); const v = CLAVES_NEUTRAS[k]; if (v && !(v in x)) x[v] = x[k]; }
}
async function respuestaConClavesAntiguas(url, r) {
  const m = /\/rest\/v1\/rpc\/([a-z0-9_]+)/.exec(String(url));
  if (!m || !FN_NEUTRAS.has(m[1]) || !r.ok) return r;
  const t = await r.clone().text();
  if (!RE_NEUTRAS.test(t)) return r;
  let j; try { j = JSON.parse(t); } catch (e) { return r; }
  copiarClavesAntiguas(j);
  const h = new Headers(r.headers); h.delete('content-length');
  return new Response(JSON.stringify(j), { status: r.status, statusText: r.statusText, headers: h });
}

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
function TT(k, n, det, cd, cn, adj) {
  const d = terminoDe(k), nom = casoTermino(n === 'p' ? d.p : d.s, cn);
  // Adjetivo que acompaña al nombre (se escribe en masculino singular): concuerda en género y número
  const ad = adj ? ' ' + (d.g === 'f' ? adj.replace(/o$/, 'a') : adj) + (n === 'p' ? 's' : '') : '';
  if (!det || !TERM_DET[det]) return nom + ad;
  return casoTermino(TERM_DET[det][(d.g === 'f' ? 2 : 0) + (n === 'p' ? 1 : 0)], cd) + ' ' + nom + ad;
}

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

function tarjeta(el, titulo, n, items, pie, vacio) {
  el.innerHTML = `<h2>${titulo}${n != null ? `<span class="n">${num(n)}</span>` : ''}</h2>` +
    (items.length ? `<div class="lista">${items.join('')}</div>` : `<div class="vacio">${vacio}</div>`) +
    (pie && items.length ? pie : '');
}

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

async function cargarFiltros(soloMunicipios) {
  const { data, error } = await db.rpc('opciones_filtros', { f_provincia: F.prov || null });
  if (error) return;
  OPF = data;
  const pon = (sel, lista, etiqueta, valor) => {
    $(sel).innerHTML = `<option value="">${etiqueta}</option>` +
      lista.map(o => `<option value="${esc(o.v)}" ${valor === o.v ? 'selected' : ''}>${esc(o.v)} (${o.n})</option>`).join('');
  };
  if (!soloMunicipios) {
    pon('fprov', data.provincias, 'Todas las provincias', F.prov);
    pon('fesp', data.especialidades, todosLos('especialidad'), F.esp);
    pon('fest', data.estados, 'Todos los estados', F.est);
  }
  pon('fmuni', data.municipios, 'Todos los municipios', F.muni);
}

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

function fila(m) {
  const d = m.dias || {};
  return `<button class="fila" data-id="${m.id}">
    <span><span class="nm">${m.urgente ? '<span class="pill p-urg">Urgente</span> ' : ''}${m.sin_reporting ? `<span class="pill p-sr" title="Solo ${TT('visita', 's', '', 'l', 'l')} presencial: sin informes ni feedback">Sin reporting</span> ` : ''}${esc(m.nombre)}</span>
      <span class="sm">${esc(m.especialidad || 'Sin ' + TT('especialidad', 's', '', 'l', 'l'))}</span></span>
    <span class="c2"><span class="nm" style="font-size:13.5px">${esc(m.centro_nombre || consultaPrivada())}</span>
      <span class="sm">${esc([m.municipio, m.provincia].filter(Boolean).join(' · '))}</span></span>
    <span class="c3"><span class="dias">${['L','M','X','J','V'].map(k => `<span class="${d[k] ? 'on' : ''}">${k}</span>`).join('')}</span></span>
    <span class="pill p-est">${esc(m.estado_comercial)}</span>
  </button>`;
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

// Ficha · Comercial asignado (administración) y pacientes que vienen de este prescriptor
async function fichaComercialYPacientes(id) {
  if (FICHA_ID !== id || !$('fbody').querySelector('.fh')) return;
  const esAdmin = puede('administrar');
  if (esAdmin) {
    $('fbody').insertAdjacentHTML('beforeend', `<div class="blk" id="fcomblk"><h3>Comercial asignado</h3>
      <div style="display:flex;gap:8px"><select id="fcomsel" style="flex:1"><option>Cargando…</option></select>
        <button class="btn sec" id="fcomok">Guardar</button></div>
      <div class="sm" style="margin-top:6px">Las ventas nuevas se atribuyen al comercial asignado en ese momento. Las anteriores no cambian.</div></div>`);
    const [{ data: us }, { data: act }] = await Promise.all([db.rpc('usuarios_lista'), RPC_ORIG('responsable_de_cuenta', { p_medico: id })]);
    if (FICHA_ID !== id || !$('fcomsel')) return;
    $('fcomsel').innerHTML = '<option value="">Sin comercial</option>' + (us || []).filter(u => u.activo && (rolPuede(u.rol, 'cartera') || (act && act.id === u.id)))
      .map(u => `<option value="${u.id}" ${act && act.id === u.id ? 'selected' : ''}>${esc(u.nombre)} · ${esc(u.rol)}</option>`).join('');
    $('fcomok').onclick = async ev => {
      ev.target.disabled = true;
      const { data: r, error } = await db.rpc('asignar_responsable_cuenta', { p_medico: id, p_usuario: $('fcomsel').value || null });
      ev.target.disabled = false;
      if (error || (r && r.ok === false)) { toast('No se ha podido asignar', true); return; }
      toast('Comercial asignado'); abrirFicha(id);
    };
  }
  if (esAdmin || ((PERFIL.areas || {}).V || 0) >= 1) {
    const { data } = await db.rpc('clientes_lista', { q: null, p_medico: id, lim: 5, desplaz: 0 });
    if (FICHA_ID !== id || !data || !data.total) return;
    ($('fventasc') || $('fbody')).insertAdjacentHTML('beforeend', `<div class="blk"><h3>${TT('paciente', 'p', '', 'l', 'C')}<span class="n" style="margin-left:6px">${num(data.total)}</span></h3>
      ${data.filas.map(x => `<button class="item" data-fmpac="${x.id}"><span class="tx"><b>${esc(x.nombre)}</b>
        <span class="sm">${num(x.unidades)} uds. · ${num(x.pedidos)} pedidos${x.ultimo_pedido ? ' · último ' + fechaCorta(x.ultimo_pedido) : ''}</span></span></button>`).join('')}
      ${data.total > 5 ? `<button class="verlo" id="fmpactodos" style="border-radius:8px;margin-top:6px">Ver los ${num(data.total)} ${TT('paciente', 'p', '', 'l', 'l')}</button>` : ''}</div>`);
    $('fbody').querySelectorAll('[data-fmpac]').forEach(b => b.onclick = () => fichaPaciente(b.dataset.fmpac));
    const nombre = ($('fbody').querySelector('.fh h2') || {}).textContent || '';
    if ($('fmpactodos')) $('fmpactodos').onclick = () => {
      $('ficha').close(); Object.assign(PAC, { q: '', medico: id, medicoNombre: nombre.replace(/^Urgente\s*/, ''), pagina: 0 }); ir('pacientes');
    };
  }
}

// Ficha · Aviso si falta su horario de atención
async function fichaAvisoHorario(id) {
  if (FICHA_ID !== id || !$('fbody').querySelector('.fh')) return;
  if (!await faltaHorario(id) || FICHA_ID !== id || $('fhorario')) return;
  $('fbody').querySelector('.fh').insertAdjacentHTML('afterend', `<div class="avisoh" id="fhorario">
    <span>⚠ <b>Falta su horario de atención.</b> Sin él, las rutas y el planificador no saben qué días y horas atiende.</span>
    ${puedeEditar() ? '<button class="btn sec" id="fhcompletar">Completar horario</button>' : ''}</div>`);
  if ($('fhcompletar')) $('fhcompletar').onclick = () => abrirEditor(id);
}

// Ficha · Material entregado y datos bajo cada visita del historial
async function fichaMaterialVisitas(id) {
  if (FICHA_ID !== id) return;
  // Material y datos bajo cada visita del historial
  $('fbody').querySelectorAll('[data-editv]').forEach(b => {
    let v; try { v = JSON.parse(b.dataset.editv); } catch (e) { return; }
    const t = detTxt(v); if (!t) return;
    const span = b.parentElement.querySelector(':scope > span');
    if (span && !span.querySelector('.vdet')) span.insertAdjacentHTML('beforeend', `<div class="sm vdet">📎 ${esc(t)}</div>`);
  });
}

// Ficha · Unidades pautadas por periodo y evolución de los últimos 12 meses
async function fichaUnidades(id) {
  if (FICHA_ID !== id || !$('fbody') || $('fundades')) return;
  const { data: u } = await RPC_ORIG('unidades_cuenta', { p_medico: id });
  if (!u || FICHA_ID !== id || $('fundades')) return;
  const bloque = `<div class="blk" id="fundades"><h3>Unidades atribuidas</h3>
    <div class="uper">${[['Hoy', u.hoy], ['Semana', u.semana], ['Mes', u.mes], ['Trimestre', u.trimestre], ['Año', u.anio], ['Total', u.total]]
      .map(([t, v]) => `<div><b>${num(v)}</b><span>${t}</span></div>`).join('')}</div>
    ${u.total ? `<div class="segs" id="fuserie" role="group" aria-label="Evolución">${UDS_SERIES.map(([k, t]) => `<button type="button" data-us="${k}" class="${k === UDS_SERIE ? 'on' : ''}">${t}</button>`).join('')}</div>` : ''}
    <div class="spark" id="fuspark">${sparkUnidades(u, UDS_SERIE)}</div>
    <div class="sm">${u.total ? `${num(u.pautas)} ${TT('pauta', u.pautas === 1 ? 's' : 'p', '', 'l', 'l')} · última el ${fechaCorta(u.ultima)} · <span id="fusley">${leyendaUnidades(UDS_SERIE)}</span>` : `Todavía sin ${TT('pauta', 'p', '', 'l', 'l')} registradas.`}</div></div>`;
  // v2.96.0: las ventas van en su sección plegada, al final de la ficha
  const zona = $('fventasc');
  if (zona) zona.insertAdjacentHTML('afterbegin', bloque);
  else ($('fbody').querySelector('.blk:nth-of-type(2)') || $('fbody').lastElementChild).insertAdjacentHTML('beforebegin', bloque);
  // v2.113.0: semana, mes o año (se recuerda la última elegida)
  $('fbody').querySelectorAll('#fuserie [data-us]').forEach(b => b.onclick = () => {
    UDS_SERIE = b.dataset.us; try { localStorage.setItem('dlc-uds-serie', UDS_SERIE); } catch (e) {}
    $('fbody').querySelectorAll('#fuserie [data-us]').forEach(x => x.classList.toggle('on', x === b));
    $('fuspark').innerHTML = sparkUnidades(u, UDS_SERIE); $('fusley').textContent = leyendaUnidades(UDS_SERIE);
  });
}

// v2.113.0 · Unidades de la ficha por semana (12), mes (12) o año (5)
const UDS_SERIES = [['semana', 'Semana'], ['mes', 'Mes'], ['anio', 'Año']];
let UDS_SERIE = (() => { try { const v = localStorage.getItem('dlc-uds-serie'); return ['semana', 'mes', 'anio'].includes(v) ? v : 'mes'; } catch (e) { return 'mes'; } })();
const leyendaUnidades = k => ({ semana: 'barras: últimas 12 semanas', mes: 'barras: últimos 12 meses', anio: 'barras: últimos 5 años' })[k];
function sparkUnidades(u, k) {
  const s = k === 'semana' ? (u.semanas || []).map(x => [x.unidades, 'Semana del ' + fechaCorta(x.semana), fechaCorta(x.semana)])
    : k === 'anio' ? (u.anios || []).map(x => [x.unidades, x.anio, x.anio])
    : (u.meses || []).map(x => [x.unidades, periodoTxt(x.mes), periodoTxt(x.mes)]);
  const max = Math.max(1, ...s.map(x => x[0]));
  // v2.118.0: barra vacía como línea de base, la del periodo actual resaltada y las fechas de los extremos debajo
  // (las fechas van como atributo de la primera y la última barra: el gráfico solo tiene barras)
  return s.map(([n, t, c], i) => `<i class="${n ? '' : 'cero'}${i === s.length - 1 ? ' actual' : ''}" style="height:${Math.round(n / max * 100)}%" title="${esc(t)}: ${num(n)}"${i === 0 ? ` data-ini="${esc(c)}"` : ''}${i === s.length - 1 ? ` data-fin="${esc(c)}"` : ''}></i>`).join('');
}

// v2.113.0 · Ficha · Cuántos clientes tiene (vinculados o que han comprado con ella). Solo números: también lo ve el comercial
async function fichaClientes(id) {
  if (FICHA_ID !== id || !$('fventasc') || $('fclientes')) return;
  const { data: c } = await RPC_ORIG('clientes_de_cuenta', { p_cuenta: id });
  if (!c || !c.ok || FICHA_ID !== id || !$('fventasc') || $('fclientes')) return;
  const bloque = `<div class="blk" id="fclientes"><h3>${TT('paciente', 'p', '', 'l', 'C')} asociados</h3>
    <div class="uper">${[['Asociados', c.total], ['Con pedidos', c.con_pedido], ['Sin pedidos', c.sin_pedido]].map(([t, v]) => `<div><b>${num(v)}</b><span>${t}</span></div>`).join('')}</div>
    ${c.total ? '' : `<div class="sm">Todavía no tiene ${TT('paciente', 'p', '', 'l', 'l')} asociados.</div>`}</div>`;
  const u = $('fundades');
  if (u) u.insertAdjacentHTML('afterend', bloque); else $('fventasc').insertAdjacentHTML('afterbegin', bloque);
}

// Ficha · Acceso del médico a la plataforma (administración)
async function fichaAcceso(id) {
  // v2.109.0: quien tiene «Dar acceso a fichas de su cartera» lo hace desde la ficha, sin pasar por Usuarios
  if (!puede('administrar') && puede('dar_acceso_cuentas')) return fichaAccesoCartera(id);
  if (!puede('administrar') || FICHA_ID !== id || !$('fbody') || $('facceso')) return;
  const [{ data: us }, rfm] = await Promise.all([RPC_ORIG('usuarios_resumen', {}), rpcCache('ficha_cuenta', { p_id: id }, 'ficha-' + id)]);
  const ya = (us || []).find(u => u.cuenta_id === id), m = (rfm && rfm.data && rfm.data.medico) || {};   // v2.128.0: m.tipo (centro o no)
  $('fbody').insertAdjacentHTML('beforeend', `<div class="blk" id="facceso"><h3>Acceso a la plataforma</h3>
    ${ya ? `<p class="sm">Tiene acceso como <b>${esc(ya.email || '')}</b>${ya.activo ? '' : ' (desactivado)'}: ${m.tipo === 'Centro' ? 'pide la reposición de sus productos, material y escribe a su comercial' : 've su portal: cifras agregadas, sin importes ni datos de personas'}.</p><p class="sm facccon" data-facccon="${ya.id}"></p>${ya.activo && typeof puedeVerComo === 'function' && puedeVerComo(ya) ? `<button class="btn sec" data-ucomo="${ya.id}">👤 Impersonalizar</button>` : ''}`
      : m.tipo === 'Centro' ? `<p class="sm">Puede tener acceso para pedir la reposición de los productos que le des de alta, pedir material y escribir a su comercial.</p>
         <button class="btn sec" id="fdaracc">Dar acceso</button>`
      : `<p class="sm">Puede tener acceso a su portal (cifras agregadas de ${TT('pauta', 'p', '', 'l', 'l')}) , pedir material y escribir a su comercial. No verá importes ni datos de ${TT('paciente', 'p', '', 'l', 'l')}.</p>
         <button class="btn sec" id="fdaracc">Dar acceso</button>`}</div>`);
  if (ya) facccon(ya.id);   // v2.335.0
  if ($('fdaracc')) $('fdaracc').onclick = async () => {
    const { data: f } = await db.rpc('ficha_cuenta', { p_id: id });
    $('ficha').close(); nuevoUsuario({ medico: { id, nombre: f.medico.nombre }, nombre: f.medico.nombre, email: f.medico.email || '', centro: f.medico.tipo === 'Centro' });
  };
}

/* Ficha base del prescriptor; abrirFicha le añade el resto de bloques */
async function pintarFichaBase(id) {
  FICHA_ID = id;
  $('fbody').innerHTML = '<div class="skel" style="width:50%"></div><div class="skel"></div><div class="skel" style="width:80%"></div>';
  $('ficha').showModal();
  const rf = await rpcCache('ficha_cuenta', { p_id: id }, 'ficha-' + id);
  const data = rf.data;
  if (!data || !data.medico) { $('fbody').innerHTML = '<p class="sm">Sin conexión y sin copia guardada de esta ficha.</p>'; return; }

  const m = data.medico, cons = data.consultas || [], vis = data.visitas || [], com = data.comerciales || [];
  const dias = ['L','M','X','J','V'];

  $('fbody').innerHTML = `${rf.cache ? '<div class="cacheaviso">Sin conexión · ficha guardada en este dispositivo</div>' : ''}
    <div class="fh">
      <div><h2>${m.urgente ? '<span class="pill p-urg">Urgente</span> ' : ''}${m.sin_reporting ? `<span class="pill p-sr" title="Solo ${TT('visita', 's', '', 'l', 'l')} presencial: sin informes ni feedback">Sin reporting</span> ` : ''}${esc(m.nombre)}</h2>
        <div class="sm">${esc(m.especialidad || '')}${m.area ? ' · ' + esc(m.area) : ''} · código ${esc(m.codigo)}</div></div>
      <button class="x" id="fx" aria-label="Cerrar">✕</button>
    </div>
    ${(puedeRegistrar() || puedeEditarTipo(m.tipo)) ? `<div class="acts">
      ${puedeRegistrar() ? `<button class="btn" data-act="visita" data-id="${m.id}">Registrar ${TT('visita', 's', '', 'l', 'l')}</button>` : ''}
      ${puedeEditarTipo(m.tipo) ? `<button class="btn sec" data-act="editar" data-id="${m.id}">Editar ficha</button>` : ''}
      ${puedeEditarTipo(m.tipo) ? `<button class="btn ${m.urgente ? 'sec' : 'warn'}" data-act="urgente" data-id="${m.id}" data-urg="${m.urgente ? 1 : 0}">${m.urgente ? 'Quitar urgente' : 'Marcar urgente'}</button>` : ''}
      <button class="btn sec" data-agendar="${m.id}">+ Añadir a mi agenda</button>
    </div>` : ''}
    ${fichaVisitaHTML(m, cons, vis)}
    <div class="blk"><h3>Estado</h3>
      <div>${puedeEditar()
        ? `<select data-estado="${m.id}" style="max-width:240px">${estados().map(x => `<option ${x === m.estado_comercial ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>`
        : `<span class="pill p-est">${esc(m.estado_comercial)}</span>`}</div>
      ${com.length ? `<div class="sm" style="margin-top:6px">Comercial: ${com.map(esc).join(', ')}</div>` : ''}
    </div>
    ${cons.filter(c => c !== consultaDeLaVisita(cons)).map(c => `<div class="blk"><h3>${esc(c.centro_nombre || consultaPrivada())}</h3>
      <div>${esc([c.direccion, c.cp, c.municipio].filter(Boolean).join(', ')) || '<span class="sm">Sin dirección</span>'}</div>
      ${c.planta || c.sala ? `<div class="sm">${esc([c.planta, c.sala].filter(Boolean).join(' · '))}</div>` : ''}
      ${c.indicaciones ? `<div class="sm">${esc(c.indicaciones)}</div>` : ''}
      ${c.telefono ? `<div class="sm">Teléfono: ${esc(c.telefono)}</div>` : ''}
      <div class="dias" style="margin-top:8px">${dias.map(k => `<span class="${(c.dias || {})[k] ? 'on' : ''}">${k}</span>`).join('')}</div>
      ${dias.filter(k => (c.dias || {})[k]).map(k => `<div class="sm">${k}: ${esc(c.dias[k])}</div>`).join('')}
      ${c.lat ? `<div class="sm" style="margin-top:6px"><button class="lnk" type="button" data-nav="${navAttr([c.lat, c.lon])}">Cómo llegar</button></div>` : ''}
    </div>`).join('')}
    <div class="blk"><h3>${TT('visita', 'p', '', 'l', 'C')}</h3>
      ${vis.length ? vis.slice(0, 10).map(v => `<div data-vrow="${v.id}" style="padding:7px 0;border-top:1px solid var(--line);display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
        <span><b>${fechaCorta(v.fecha)}</b>${v.modo === 'telefono' ? ' · Por teléfono' : v.modo === 'video' ? ' · Por videollamada' : ''} · ${esc((v.resultados || []).join(' + ') || 'Sin resultado')}
          ${v.muestras ? ` · ${v.muestras} muestras` : ''}
          ${v.nota ? `<div class="sm">${esc(v.nota)}</div>` : ''}
          ${v.proxima_fecha ? `<div class="sm">Próxima: ${fechaCorta(v.proxima_fecha)} · ${esc(v.proxima_accion || '')}</div>` : ''}</span>
        ${puedeRegistrar() ? `<button class="btn sec chico" data-editv='${esc(JSON.stringify(v))}'>Editar</button>` : ''}
      </div>`).join('') : `<div class="sm">Todavía no hay ${TT('visita', 'p', '', 'l', 'l', 'registrado')}.</div>`}</div>
    <div id="fzcampos"></div>
    <section class="blk fventas" id="fventas"><h3>Ventas y ${TT('paciente', 'p', '', 'l', 'l')}</h3><div id="fventasc"></div></section>`;
  $('fx').onclick = () => $('ficha').close();
  $('fbody').querySelectorAll('[data-editv]').forEach(b => b.onclick = () => editarVisita(JSON.parse(b.dataset.editv), id));
}

/* v2.96.0 · «Para la visita»: lo que hace falta al llegar, arriba del todo.
   Dónde (centro, planta, sala, cómo llegar), cuándo (su horario de hoy y el del centro), cómo entrar,
   lo que quedó pendiente en la última visita, las notas y a quién llamar. Las ventas van al final. */
// La consulta de la visita: la que tiene consulta hoy; si ninguna, la principal
function consultaDeLaVisita(cons) {
  const hoy = hoyLetra();
  return (cons || []).find(c => (c.dias || {})[hoy]) || (cons || [])[0] || null;
}
function fichaVisitaHTML(m, cons, vis) {
  const fila = (ico, html, cls) => `<div class="fvfila ${cls || ''}"><span class="fvico">${svgIco(ICON_NOM[ico] || '')}</span><div>${html}</div></div>`;
  const c = consultaDeLaVisita(cons), hoy = hoyLetra(), filas = [];
  const NOMDIA = { L: 'lunes', M: 'martes', X: 'miércoles', J: 'jueves', V: 'viernes', S: 'sábado', D: 'domingo' };
  if (m.urgente) filas.push(fila('circle-alert', `<b>Urgente</b>${m.urgente_motivo ? ': ' + esc(m.urgente_motivo) : ''}`, 'fvurg'));
  if (c) {
    const donde = [c.planta, c.sala].map(x => String(x || '').trim()).filter(x => x && !/^[-–·.]+$/.test(x)).map(esc).join(' · ');   // v2.343.0: sin pastilla vacía
    filas.push(fila('building-2', `<b>${esc(c.centro_nombre || consultaPrivada())}</b>${donde ? `<span class="fvdonde">${donde}</span>` : ''}
      <div class="sm">${esc([c.direccion, [c.cp, c.municipio].filter(Boolean).join(' ')].filter(Boolean).join(', ')) || 'Sin dirección'}</div>
      ${c.lat ? `<button class="btn sec fvbtn" type="button" data-nav="${navAttr([c.lat, c.lon])}">${svgIco(ICON_NOM['map-pin'])} Cómo llegar</button>` : ''}`));
    // Cuándo: su horario de hoy en esta consulta (o el próximo día que atiende) y el horario del centro
    const d = c.dias || {}, orden = 'LMXJVSD', h = d[hoy];
    const prox = h ? null : [...orden.slice(orden.indexOf(hoy) + 1), ...orden.slice(0, orden.indexOf(hoy) + 1)].find(k => d[k]);
    const cen = (c.horario_centro || {})[hoy];
    filas.push(fila('clock', `${h ? `<b>Hoy atiende: ${esc(h)}</b>` : prox ? `Hoy no atiende aquí · el ${NOMDIA[prox]}: ${esc(d[prox])}` : 'Sin horario de atención'}
      ${cen ? `<div class="sm">Centro abierto hoy: ${esc(cen)}</div>` : ''}
      <div class="dias fvdias">${['L', 'M', 'X', 'J', 'V'].map(k => `<span class="${d[k] ? 'on' : ''} ${k === hoy ? 'hoy' : ''}" title="${esc(d[k] || '')}">${k}</span>`).join('')}</div>`));
    if (c.indicaciones) filas.push(fila('info', `<b>Cómo llegar dentro:</b> ${esc(c.indicaciones)}`, 'fvind'));
  } else filas.push(fila('building-2', `<span class="sm">Sin ${TT('consulta', 's', '', 'l', 'l')} registrada: añádela en «Editar ficha».</span>`));
  // Lo último que pasó y lo que quedó pendiente
  const ult = (vis || [])[0];
  if (ult) {
    const mat = detTxt(ult);
    filas.push(fila('notebook-pen', `<b>Última ${TT('visita', 's', '', 'l', 'l')}: ${fechaCorta(ult.fecha)}</b> · ${esc((ult.resultados || []).join(' + ') || 'Sin resultado')}
      ${ult.nota ? `<div class="sm">${esc(ult.nota)}</div>` : ''}${mat ? `<div class="sm">Material: ${esc(mat)}</div>` : ''}`));
  }
  const pend = (vis || []).find(v => v.proxima_accion || v.proxima_fecha);
  if (pend) {
    const f = pend.proxima_fecha, hoyIso = hoyISO();
    const est = !f ? '' : f < hoyIso ? '<span class="pill p-bor">Atrasada</span>' : f === hoyIso ? '<span class="pill p-est">Hoy</span>' : '';
    filas.push(fila('clipboard-list', `<b>Pendiente:</b> ${esc(pend.proxima_accion || 'Volver a ' + TT('visita', 's', '', 'l', 'l'))}${f ? ` · ${fechaCorta(f)}` : ''} ${est}`));
  }
  if (m.nota) filas.push(fila('message-circle', `<b>Notas:</b> ${esc(m.nota)}`));
  const tels = [m.telefono, c && c.telefono].filter(Boolean).filter((x, i, a) => a.indexOf(x) === i);
  if (tels.length || m.contacto) filas.push(fila('phone', `${tels.map(t => `<a href="tel:${esc(t.replace(/\s+/g, ''))}"><b>${esc(t)}</b></a>`).join(' · ')}
    ${m.contacto ? `<div class="sm">${esc(m.contacto)}</div>` : ''}`));
  return `<section class="fvis" aria-label="Para la ${TT('visita', 's', '', 'l', 'l')}"><h3>Para la ${TT('visita', 's', '', 'l', 'l')}</h3>${filas.join('')}</section>`;
}

$('ficha').addEventListener('click', e => { if (e.target.id === 'ficha') $('ficha').close(); });

/* ---------------- arranque ---------------- */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

