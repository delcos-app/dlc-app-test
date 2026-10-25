/**
 * Rutas (v2.414.0): «Mis rutas», the route wizard and copying a route to the agenda. The planner, the plan of the day, today's map,
 * the day in progress and the old proposals stay in legacy (pantallas/rutas.js): the Agenda and Configuración use them. The legacy
 * names cargarRutasBase, rnAbrir, rnFechas, rnHorizonte, rnCitasEn and rnRellenar stay as adapters.
 */
export { paintRoutes } from './list';
export { openRoute } from './wizard';
export { appointmentsOn, copyToAgenda, refillRepeating } from './to-agenda';
export { datesOf, horizonOf } from './model';
