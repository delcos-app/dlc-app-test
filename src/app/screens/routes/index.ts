/**
 * Rutas (v2.414.0): «Mis rutas», the route wizard and copying a route to the agenda. The planner, the plan of the day, today's map,
 * the day in progress and the old proposals stay in legacy (pantallas/rutas.js): the Agenda and Configuración use them. The legacy
 * names cargarRutasBase, rnAbrir, rnFechas, rnHorizonte, rnCitasEn and rnRellenar stay as adapters.
 * Plan 7.3 (cut C): the screen is loaded on first use (chunk.ts → min/chunks/routes.js). What is called at start-up or answered at
 * once stays in the core: the plan settings (PLANCFG), ordering by distance, the route dates, the bar of the working day and the
 * day in progress card (day-bar.ts), the street route service, the store and the title case of names.
 */
import { lazyChunk } from '../../core/lazy/load';
import type * as Chunk from './chunk';

export { datesOf, horizonOf } from './model';
export { activePreferences, planSettings, withHours } from './planner/settings';
export { orderByDistance, scheduleVisits } from './planner/visits';
export { mapLibrary, streetRoute } from './today/service';
export { paintDayInProgress, paintRouteBar } from './day-bar';
export { titleCase } from './title-case';
// The route cards of Inicio are painted with Inicio (planning from a card opens the planner, in the chunk)
export { paintRouteCards } from './suggestions';

const fromChunk = lazyChunk<typeof Chunk>('routes');

export const paintRoutes = fromChunk('paintRoutes');
export const openRoute = fromChunk('openRoute');
export const appointmentsOn = fromChunk('appointmentsOn');
export const copyToAgenda = fromChunk('copyToAgenda');
export const refillRepeating = fromChunk('refillRepeating');
export const buildPlan = fromChunk('buildPlan');
export const planFromList = fromChunk('planFromList');
export const planRoute = fromChunk('planRoute');
export const planToAgenda = fromChunk('planToAgenda');
export const startRoute = fromChunk('startRoute');
export const planAgendaButtons = fromChunk('planAgendaButtons');
export const planCardsAndNotes = fromChunk('planCardsAndNotes');
export const planHoursAndLeftOut = fromChunk('planHoursAndLeftOut');
export const planMapAndDiscard = fromChunk('planMapAndDiscard');
export const planNoStartNotice = fromChunk('planNoStartNotice');
export const planRecentlyVisited = fromChunk('planRecentlyVisited');
export const showPlanMap = fromChunk('showPlanMap');
/** The plan card of Configuración and its hours window (core/settings publishes them). */
export const paintPlanCard = fromChunk('paintPlanCard');
export const openPlanTimesWindow = fromChunk('openPlanTimesWindow');
export const planWeek = fromChunk('planWeek');
export const saveWeekDraft = fromChunk('saveWeekDraft');
export const editRoute = fromChunk('editRoute');
export const editFrequency = fromChunk('editFrequency');
export const loadDayMap = fromChunk('loadDayMap');
export const loadRoutesPage = fromChunk('loadRoutesPage');
