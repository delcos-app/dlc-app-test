/**
 * Agenda screen, migrated piece by piece (strangler): the month calendar and the header figures (v2.390.0), the trays and
 * «En este centro también» (v2.391.0), «Tu semana» (v2.392.0), the data loader `data` (v2.393.0), the day strip (v2.394.0), the day view and the team view (v2.395.0). «Tu día», the open week and the appointment sheet are still legacy
 * (src/pantallas/agenda.js) and call these through window.delcos.
 */
export { closeMonth, refreshOpenMonth, renderMonth, toggleMonth } from './month-calendar';
export { metricsHtml, refreshMetrics, reloadMetrics } from './metrics';
export { groupByAttendance, paintSameCentre } from './same-centre';
export { paintWeekSidebar } from './week-sidebar';
export { dueList, openTray, paintTrayButtons, refreshOpenTray } from './trays';
export * as data from './preload';
export { bindWeekButton, paintStrip } from './strip';
export { loadAgenda, refreshAfterChange, showDay } from './day-view';
export { shareWeek } from './strip';
