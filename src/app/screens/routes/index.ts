/**
 * Rutas (v2.414.0): «Mis rutas», the route wizard and copying a route to the agenda. The planner, the plan of the day, today's map,
 * the day in progress and the old proposals stay in legacy (pantallas/rutas.js): the Agenda and Configuración use them. The legacy
 * names cargarRutasBase, rnAbrir, rnFechas, rnHorizonte, rnCitasEn and rnRellenar stay as adapters.
 */
export { paintRoutes } from './list';
export { openRoute } from './wizard';
export { appointmentsOn, copyToAgenda, refillRepeating } from './to-agenda';
export { datesOf, horizonOf } from './model';
// v2.418.0: the planner, the plan of the day, today's map, the page around «Mis rutas», the route window and the frequency
export { activePreferences, planSettings, withHours } from './planner/settings';
export { orderByDistance, scheduleVisits } from './planner/visits';
export { buildPlan, planFromList, planRoute, planToAgenda, startRoute } from './planner/plan';
export { planAgendaButtons, planCardsAndNotes, planHoursAndLeftOut, planMapAndDiscard, planNoStartNotice, planRecentlyVisited } from './planner/plan-view';
export { showPlanMap } from './planner/plan-map';
export { planWeek, saveWeekDraft } from './planner/week';
export { editRoute } from './editor';
export { editFrequency } from './frequency';
export { loadDayMap } from './today';
export { mapLibrary, streetRoute } from './today/service';
export { loadRoutesPage, paintDayInProgress, paintRouteBar } from './page';
export { paintRouteCards } from './suggestions';
export { titleCase } from './title-case';
