/**
 * Agenda screen. Migrated piece by piece (strangler): the month calendar and the header figures are here (v2.390.0); the day,
 * the strip, the week and the appointment sheet are still legacy (src/pantallas/agenda.js) and call these through window.delcos.
 */
export { closeMonth, refreshOpenMonth, renderMonth, toggleMonth } from './month-calendar';
export { metricsHtml, refreshMetrics, reloadMetrics } from './metrics';
