/**
 * The Agenda, loaded on first use (plan 7.3, cut C): the day view and the team view, «Tu día» with its cards and buttons, the strip,
 * the month, «Tu semana», the open week, the trays, the metrics, the appointment sheet, menu and actions, the appointment and task
 * editors, rescheduling, the working day, the day menu and the traffic of «Tu día». herramientas/bundle.mjs builds this file into
 * min/chunks/agenda.js and index.ts calls it through core/lazy. It is the start screen of the sales reps: when it is the first
 * screen its chunk is asked for at once (SCREEN_CHUNKS) and the screen waits for it hidden, as for its data.
 */
import './texts';
export { closeMonth, refreshOpenMonth, renderMonth, toggleMonth } from './month-calendar';
export { metricsHtml, refreshMetrics, reloadMetrics } from './metrics';
export { paintWeekSidebar } from './week-sidebar';
export { dueList, openTray, paintTrayButtons, refreshOpenTray } from './trays';
export { bindWeekButton, paintStrip, shareWeek } from './strip';
export { loadAgenda, refreshAfterChange, showDay } from './day-view';
export { paintOpenWeek } from './open-week';
export { markQueuedVisits, paintYourDay } from './your-day';
export { applyTaskFolding } from './your-day/tasks';
export { answerCardClick } from './your-day/card-buttons';
export { changeTime, runAction } from './appointment-actions';
export { openMenu } from './appointment-menu';
export { showAppointment } from './appointment-sheet';
export { refreshQuietly, repaintSmoothly, saveOrder } from './your-day/reorder';
export { newAppointment } from './editors/appointment-editor';
export { editTask } from './editors/task-editor';
export { rescheduleAppointments } from './reschedule';
export { endWorkingDay, startWorkingDay } from './working-day';
export { openDayMenu } from './day-menu';
export { prepareRouteStops } from './route-buttons';
export { markTraffic, requestTraffic } from './traffic';
