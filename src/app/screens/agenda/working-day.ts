/**
 * The working day: start it (with open appointments today), its time and visits when it ends, and the open appointments left,
 * proposed to another day. It is kept on this device for its own day. Migrated from the legacy jornadaActiva, empezarJornada and
 * terminarJornada (v2.414.0); the three names stay as adapters (Rutas and the tests use them).
 */
import { agendaState, appLegacy, appointments, currentScreen, goTo, legacyAgenda, notices, reloadAgenda } from '../../legacy/bridge';
import { paintRouteBar } from '../routes/page';
import { requestTraffic } from './traffic';
import { restLegacy } from '../../legacy/rest-bridge';
import { t } from '../../i18n';
import { formatDuration, todayIso } from '../../services/dates';
import { isOpen } from './appointment-state';
import { rescheduleAppointments, type ReschedulableAppointment } from './reschedule';

/** Values stored in the database. */
const VISITED = 'Visitada', NOT_COUNTED = ['Descartada', 'Aplazada'];

interface WorkingDay { fecha: string; inicio: number }
type DayAppointment = ReschedulableAppointment & { estado: string };

/** The working day in progress today, or null (one from another day is forgotten). */
export function activeWorkingDay(): WorkingDay | null {
  let stored: WorkingDay | null = null;
  try { stored = JSON.parse(localStorage.getItem(restLegacy.workingDayKey()) ?? 'null') as WorkingDay | null; } catch { /* nothing stored */ }
  if (stored && stored.fecha !== todayIso()) { localStorage.removeItem(restLegacy.workingDayKey()); return null; }
  return stored;
}

export async function startWorkingDay(): Promise<void> {
  const list = await appointments.ofDay(todayIso()) as DayAppointment[];
  if (!list.some(item => isOpen(item.estado))) { notices.toast(t('agendaMore.workday.noOpen'), true); return; }
  localStorage.setItem(restLegacy.workingDayKey(), JSON.stringify({ fecha: todayIso(), inicio: Date.now() }));
  void paintRouteBar();
  notices.toast(t('agendaMore.workday.started'));
  agendaState.setMode('dia'); agendaState.setSelectedDate(todayIso());
  if (currentScreen() === 'agenda') reloadAgenda(); else goTo('agenda');
  try { if (legacyAgenda.selectedDate() === todayIso()) void requestTraffic(true); } catch { /* the traffic is optional */ }
}

function endQuestion(day: WorkingDay, list: readonly DayAppointment[], open: number): string {
  const done = list.filter(item => item.estado === VISITED).length, total = list.filter(item => !NOT_COUNTED.includes(item.estado)).length;
  const left = open === 1 ? t('agendaMore.workday.oneOpen') : t('agendaMore.workday.open', { count: open });
  return t('agendaMore.workday.summary', { time: formatDuration(Date.now() - day.inicio), done, total }) + (open ? left : '');
}

export async function endWorkingDay(): Promise<void> {
  const day = activeWorkingDay(); if (!day) return;
  appLegacy.forgetCache();
  const list = await appointments.ofDay(todayIso()) as DayAppointment[];
  const open = list.filter(item => isOpen(item.estado)), done = list.filter(item => item.estado === VISITED).length;
  if (!await notices.confirm(endQuestion(day, list, open.length), { titulo: t('agendaMore.workday.endTitle'), ok: t('agendaMore.workday.end') })) return;
  localStorage.removeItem(restLegacy.workingDayKey());
  void paintRouteBar();
  notices.toast(t('agendaMore.workday.ended', { count: done }));
  if (open.length) await rescheduleAppointments(open, t('agendaMore.workday.leftTitle'), t('agendaMore.workday.leftText', { count: open.length }));
  if (currentScreen() === 'agenda') reloadAgenda();
  if (currentScreen() === 'rutas') restLegacy.reloadRoutes();
}
