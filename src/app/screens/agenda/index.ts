/**
 * Agenda screen, migrated piece by piece (strangler): the month calendar and the header figures (v2.390.0), the trays and
 * «En este centro también» (v2.391.0), «Tu semana» (v2.392.0), the data loader `data` (v2.393.0), the day strip (v2.394.0), the day
 * view and the team view (v2.395.0), the open week (v2.396.0), «Tu día» (v2.397.0), the appointment sheet, menu and actions
 * (v2.398.0), order and repaints (v2.399.0), the appointment and task editors (v2.400.0). The working day, rescheduling, the day menu,
 * the appointment origin and «No estaba» (v2.414.0). The legacy names (src/pantallas/agenda.js) call these through window.delcos.
 * Plan 7.3 (cut C): the screen is loaded on first use (chunk.ts → min/chunks/agenda.js). What is read at once by the core, the
 * legacy code or the tests stays here: the data loader, the state and options of an appointment, its origin, «En este centro
 * también» (its listener and grouping), the working day in progress and the times with traffic of the day estimate.
 */
import { backOpener } from '../../core/layers/dialogs';
import { lazyChunk } from '../../core/lazy/load';
import { cachedModuleLoader } from '../../core/legacy-c/module-cache';
import type * as Chunk from './chunk';

export * as data from './preload';
export { groupByAttendance, paintSameCentre } from './same-centre';
export { hasMenu } from './appointment-options';
export { activeWorkingDay } from './active-day';
export { originText } from './appointment-origin';
export { dayRoute, legMinutes, setRealTimes } from './traffic-times';

const fromChunk = lazyChunk<typeof Chunk>('agenda');

export const closeMonth = fromChunk('closeMonth');
export const refreshOpenMonth = fromChunk('refreshOpenMonth');
export const renderMonth = fromChunk('renderMonth');
export const toggleMonth = fromChunk('toggleMonth');
export const metricsHtml = fromChunk('metricsHtml');
export const refreshMetrics = fromChunk('refreshMetrics');
export const reloadMetrics = fromChunk('reloadMetrics');
export const paintWeekSidebar = fromChunk('paintWeekSidebar');
export const dueList = fromChunk('dueList');
export const openTray = fromChunk('openTray');
export const paintTrayButtons = fromChunk('paintTrayButtons');
export const refreshOpenTray = fromChunk('refreshOpenTray');
export const bindWeekButton = fromChunk('bindWeekButton');
export const paintStrip = fromChunk('paintStrip');
export const shareWeek = fromChunk('shareWeek');
// The cache of the screen and «‹ Volver» the app used to add by wrapping the global names cargarAgenda and verCita are added here,
// to the screen's own functions (plan 7.3, cut C)
export const loadAgenda = cachedModuleLoader('agenda', fromChunk('loadAgenda'));
export const refreshAfterChange = fromChunk('refreshAfterChange');
export const showDay = fromChunk('showDay');
export const paintOpenWeek = fromChunk('paintOpenWeek');
export const markQueuedVisits = fromChunk('markQueuedVisits');
export const paintYourDay = fromChunk('paintYourDay');
export const applyTaskFolding = fromChunk('applyTaskFolding');
/** What a button of «Tu día» does (its listener, your-day/listeners.ts, is in the core). */
export const answerCardClick = fromChunk('answerCardClick');
export const changeTime = fromChunk('changeTime');
export const runAction = fromChunk('runAction');
export const openMenu = fromChunk('openMenu');
export const showAppointment = backOpener('verCita', fromChunk('showAppointment'));
export const refreshQuietly = fromChunk('refreshQuietly');
export const repaintSmoothly = fromChunk('repaintSmoothly');
export const saveOrder = fromChunk('saveOrder');
export const newAppointment = fromChunk('newAppointment');
export const editTask = fromChunk('editTask');
export const rescheduleAppointments = fromChunk('rescheduleAppointments');
export const startWorkingDay = fromChunk('startWorkingDay');
export const endWorkingDay = fromChunk('endWorkingDay');
export const openDayMenu = fromChunk('openDayMenu');
export const prepareRouteStops = fromChunk('prepareRouteStops');
export const markTraffic = fromChunk('markTraffic');
export const requestTraffic = fromChunk('requestTraffic');
