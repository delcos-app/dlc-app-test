/**
 * The working day in progress, kept on this device for its own day. Split from working-day.ts for plan 7.3 (cut C): the bar of every
 * screen and Rutas read it at once, so it stays in the core; starting and ending it are in the Agenda chunk.
 */
import { restLegacy } from '../../legacy/rest-bridge';
import { todayIso } from '../../services/dates';

export interface WorkingDay { fecha: string; inicio: number }

/** The working day in progress today, or null (one from another day is forgotten). */
export function activeWorkingDay(): WorkingDay | null {
  let stored: WorkingDay | null = null;
  try { stored = JSON.parse(localStorage.getItem(restLegacy.workingDayKey()) ?? 'null') as WorkingDay | null; } catch { /* nothing stored */ }
  if (stored && stored.fecha !== todayIso()) { localStorage.removeItem(restLegacy.workingDayKey()); return null; }
  return stored;
}
