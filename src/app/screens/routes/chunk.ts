/**
 * Rutas, loaded on first use (plan 7.3, cut C): «Mis rutas» and its page, the route wizard, copying a route to the agenda, the
 * planner and the plan of the day with its card in Configuración, the week planner, the route editor, the visit frequency and
 * today's map. herramientas/bundle.mjs builds this file into min/chunks/routes.js and index.ts calls it through core/lazy. What the
 * core calls at start-up or expects an answer from at once (the plan settings, ordering by distance, the day estimate, the bar of the
 * working day, the street route service, the state, the route cards of Inicio) stays in the core.
 */
import './texts';
export { paintRoutes } from './list';
export { openRoute } from './wizard';
export { appointmentsOn, copyToAgenda, refillRepeating } from './to-agenda';
export { buildPlan, planFromList, planRoute, planToAgenda, startRoute } from './planner/plan';
export { planAgendaButtons, planCardsAndNotes, planHoursAndLeftOut, planMapAndDiscard, planNoStartNotice, planRecentlyVisited } from './planner/plan-view';
export { showPlanMap } from './planner/plan-map';
export { openPlanTimesWindow, paintPlanCard } from './planner/plan-card';
export { planWeek, saveWeekDraft } from './planner/week';
export { editRoute } from './editor';
export { editFrequency } from './frequency';
export { loadDayMap } from './today';
export { loadRoutesPage } from './page';
