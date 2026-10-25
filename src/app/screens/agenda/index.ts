/**
 * Agenda screen, migrated piece by piece (strangler): the month calendar and the header figures (v2.390.0), the trays and
 * «En este centro también» (v2.391.0), «Tu semana» (v2.392.0), the data loader `data` (v2.393.0), the day strip (v2.394.0), the day view and the team view (v2.395.0), the open week (v2.396.0), «Tu día» (v2.397.0), the appointment sheet, menu and actions (v2.398.0), order and repaints (v2.399.0), the appointment and task editors (v2.400.0). The working day, rescheduling, the day menu, the appointment origin and «No estaba» (v2.414.0). Still legacy: the traffic (route domain)
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
export { paintOpenWeek } from './open-week';
export { markQueuedVisits, paintYourDay } from './your-day';
export { applyTaskFolding } from './your-day/tasks';
export { changeTime, runAction } from './appointment-actions';
export { openMenu } from './appointment-menu';
export { hasMenu } from './appointment-options';
export { showAppointment } from './appointment-sheet';
export { refreshQuietly, repaintSmoothly, saveOrder } from './your-day/reorder';
export { newAppointment } from './editors/appointment-editor';
export { editTask } from './editors/task-editor';
export { rescheduleAppointments } from './reschedule';
export { activeWorkingDay, endWorkingDay, startWorkingDay } from './working-day';
export { openDayMenu } from './day-menu';
export { originText } from './appointment-origin';
export { prepareRouteStops } from './route-buttons';
export { dayRoute, legMinutes, markTraffic, requestTraffic, setRealTimes } from './traffic';
