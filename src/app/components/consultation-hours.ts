/** Consultation hours of a professional on a date. Migrated from ventanasDe in componentes/ventana.js (v2.416.0); ventanasDe stays as an adapter. */
import { componentsLegacy } from '../legacy/components-bridge';

const MORNING: [number, number] = [9 * 60, 14 * 60], AFTERNOON: [number, number] = [15 * 60, 20 * 60], WHOLE_DAY: [number, number] = [0, 24 * 60];
const RANGE = /(\d{1,2})(?:[:.h](\d{2}))?\s*[-–a]\s*(\d{1,2})(?:[:.h](\d{2}))?/;

const minutes = (hours: string | undefined, rest: string | undefined): number => Number(hours) * 60 + (Number(rest) || 0);

function windowOf(part: string): [number, number] | null {
  const found = RANGE.exec(part);
  if (found) return [minutes(found[1], found[2]), minutes(found[3], found[4])];
  if (/mañana/i.test(part)) return MORNING;
  if (/tarde/i.test(part)) return AFTERNOON;
  return null;
}

/**
 * The time windows of `days` on `isoDate`, in minutes: null when the timetable is unknown (no restriction), [] when that day it
 * does not attend, else the windows in order («9-14 y 16:30-19» → [[540, 840], [990, 1140]]; a day with text but no hours: all day).
 */
export function attendanceWindows(days: Readonly<Record<string, string | null | undefined>> | null | undefined, isoDate: string): [number, number][] | null {
  const timetable = days ?? {};
  if (!Object.keys(timetable).some(key => timetable[key])) return null;
  const text = timetable[componentsLegacy.weekdayLetter(isoDate)];
  if (!text) return [];
  const windows = String(text).split(/[;,/]| y /i).map(windowOf).filter((window): window is [number, number] => window !== null);
  return windows.length ? windows.sort((first, second) => first[0] - second[0]) : [WHOLE_DAY];
}
