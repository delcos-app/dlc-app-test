/* ============================================================
   DLC OS 2.0 · Entrega 2: inicio, navegación y directorio
   ============================================================ */

const CFG = window.DLC_CONFIG;
// Enlace del correo de recuperación: se detecta antes de que se procese, para no arrancar la app con esa sesión
// v2.168.0: también el enlace de bienvenida (invitación) de quien se da de alta desde la web: primero crea su contraseña
const INVITACION_URL = /(^#|&)type=invite(&|$)/.test(location.hash);
const RECUPERACION_URL = /(^#|&)type=(recovery|invite)(&|$)/.test(location.hash);
const ENLACE_CADUCADO = /(^#|&)error_code=/.test(location.hash) || /(^#|&)error=access_denied/.test(location.hash);
/* Sesión: si al entrar se desmarcó «Mantener la sesión iniciada», al cerrar el navegador hay que volver a entrar */
try { if (localStorage.getItem('dlc-no-recordar') && !/(^|; )dlc-sesion-viva=1/.test(document.cookie)) localStorage.removeItem('dlc-os-sesion'); } catch (e) {}

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

try { TERMINOS = JSON.parse(localStorage.getItem(TERMKEY) || '{}') || {}; } catch (e) { TERMINOS = {}; }

try { ROLES_DEF = JSON.parse(localStorage.getItem(ROLKEY) || '[]') || []; } catch (e) { ROLES_DEF = []; }
try { ESTADOS_DEF = JSON.parse(localStorage.getItem(ESTKEY) || '[]') || []; } catch (e) { ESTADOS_DEF = []; }
const PASO = 50;


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
function irBase(t) {
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
}

/* ir(): cambiar de pantalla. Las reglas (redirecciones, bloqueos y lo que pasa antes y después) están en
   src/app/core/navigation (v2.386.0): aquí solo queda el adaptador para el código antiguo, y irBase, el cambio de pantalla en sí. */
function ir(t, ...a) { window.delcos.navigate(t, ...a); }

/* ---------------- inicio ---------------- */




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

function pintarChipsBase() {
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




$('lista').addEventListener('click', e => { const b = e.target.closest('[data-id]'); if (b) abrirFicha(b.dataset.id); });

/* ---------------- ficha ---------------- */






let UDS_SERIE = (() => { try { const v = localStorage.getItem('dlc-uds-serie'); return ['semana', 'mes', 'anio'].includes(v) ? v : 'mes'; } catch (e) { return 'mes'; } })();
const leyendaUnidades = k => ({ semana: 'barras: últimas 12 semanas', mes: 'barras: últimos 12 meses', anio: 'barras: últimos 5 años' })[k];





$('ficha').addEventListener('click', e => { if (e.target.id === 'ficha') $('ficha').close(); });

/* ---------------- arranque ---------------- */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

