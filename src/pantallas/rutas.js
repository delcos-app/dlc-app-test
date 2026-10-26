// @ts-check
// pantallas/rutas.js · Rutas está en src/app/screens/routes (v2.414.0 y v2.418.0): «Mis rutas», el asistente, el planificador, el
// plan del día, el mapa de hoy, la barra de la jornada, el editor de rutas y la frecuencia. Aquí queda el estado que comparten otros
// archivos y los nombres que usan Configuración (pintarPlan), Agenda, Inicio, Analítica, Parque, legado 001/003/007/018/019/024/083,
// servicios/mapas.js y las pruebas. Normas: docs/normas_codigo.md.

const rutaActiva = () => { try { return JSON.parse(localStorage.getItem(RKEY()) || 'null'); } catch (e) { return null; } };

const RPKEY = () => 'dlc-ruta-pausa-' + (PERFIL ? PERFIL.id : '');

 // v2.440.0: ULTIMO_PLAN → estado de src/app (plan 6.6), accesible en window

 // v2.440.0: SEM_BORRADOR → estado de src/app (plan 6.6), accesible en window   // propuesta del planificador aún sin guardar

 // v2.440.0: RPROP → estado de src/app (plan 6.6), accesible en window   // propuestas del día (v2.145.0): ya no se pintan; rpPlanDe (Configuración) aún lo nombra

const RM_MEM = new Map();   // ruta pedida → {t, r}: solo en memoria y 10 minutos (legado 103 la lee)

 // v2.440.0: RN → estado de src/app (plan 6.6), accesible en window          // la ruta que se está creando o editando

function rnAbrir(item, paso) { return window.delcos.screens.routes.openRoute(item || null, paso || 1); }
function pintarRutaEnCurso() { return window.delcos.screens.routes.paintDayInProgress(); }
function rutasMapaBase() { return window.delcos.screens.routes.loadDayMap(); }
function planificar(rutaId, btn) { return window.delcos.screens.routes.planRoute(rutaId, btn); }
function planDesdeLista(lista, nombre, btn) { return window.delcos.screens.routes.planFromList(lista, nombre, btn || null); }
function construirPlan(conXY, rutaId, btn, opts) { return window.delcos.screens.routes.buildPlan(conXY, rutaId, btn || null, opts || {}); }
function planBotonesAgenda() { return window.delcos.screens.routes.planAgendaButtons(); }
function planHorasYFueraDePlan() { return window.delcos.screens.routes.planHoursAndLeftOut(); }
function planMapaYDescartar() { return window.delcos.screens.routes.planMapAndDiscard(); }
function planVisitadosRecientes() { return window.delcos.screens.routes.planRecentlyVisited(); }
function planAvisoSinSalida() { return window.delcos.screens.routes.planNoStartNotice(); }
function planFichasYNotas() { return window.delcos.screens.routes.planCardsAndNotes(); }
function mapaDelPlan() { return window.delcos.screens.routes.showPlanMap(); }
function programarVisitas(items, t0) { return window.delcos.screens.routes.scheduleVisits(items, t0); }
function ordenarPorCercania(citas) { const r = window.delcos.screens.routes.orderByDistance(citas); /** @type {any} */ (ordenarPorCercania).fuera = r.left; return r.list; }
function conHor(h, fn) { return window.delcos.screens.routes.withHours(h, fn); }
function PLANCFG() { return window.delcos.screens.routes.planSettings(); }
function prefsActivas() { return window.delcos.screens.routes.activePreferences(); }
function planificarSemana(desde, dias, bloq, porDia) { return window.delcos.screens.routes.planWeek(desde, dias, bloq, porDia); }
function guardarBorradorSemana(btn) { return window.delcos.screens.routes.saveWeekDraft(btn); }
function editorRuta(id) { return window.delcos.screens.routes.editRoute(id || null); }
function editorFrecuencia() { return window.delcos.screens.routes.editFrequency(); }
function prepararParadas(fecha) { return window.delcos.screens.agenda.prepareRouteStops(fecha); }
function rpTitulo(s) { return window.delcos.screens.routes.titleCase(s); }

// Tiempos de una propuesta del día (v2.145.0): ya no se pintan, pero la prueba rutas2145 de qa_pantallas.py aún la nombra
function rpTiempos(sel, t0) {
  const cfg = PLANCFG(), sal = salidaUsuario();
  let pos = sal.lat != null ? [+sal.lat, +sal.lon] : null, t = t0, kms = 0, paradas = 0;
  sel.forEach(c => {
    const xy = [+c.lat, +c.lon], mismo = pos && km(pos, xy) < 0.05;
    if (!mismo) { if (pos) { t += minutosEntre(pos, xy); kms += km(pos, xy); } t += cfg.parada; paradas++; }
    t += cfg.visita; pos = xy;
  });
  return { fin: t, km: kms, paradas };
}
