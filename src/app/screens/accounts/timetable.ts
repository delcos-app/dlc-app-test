/**
 * Timetables of the accounts: the next weekday with consultation, the days of a list of accounts, whether an account lacks its
 * timetable, and the other centre with consultation on a day without one. Migrated from the legacy proximoDiaConsulta,
 * conHorarios, faltaHorario and centroConConsulta (v2.419.0).
 */
import { cachedRpc, legacyDb } from '../../legacy/bridge';
import { attendanceWindows } from '../../components';
import { addDays, toIsoDate, todayIso } from '../../services/dates';

type Days = Record<string, string | null> | null | undefined;

const LETTERS = 'DLMXJVS', LOOK_AHEAD_DAYS = 21, NOON = 'T12:00:00';

/** The next weekday (Monday to Friday) with consultation after `from`; any weekday if it has no timetable. */
export function nextAttendanceDay(days: Days, from: string): string {
  const start = from || todayIso(), open = Object.keys(days ?? {}).filter(key => days?.[key]);
  const date = new Date(start + NOON);
  for (let step = 1; step <= LOOK_AHEAD_DAYS; step++) {
    date.setDate(date.getDate() + 1);
    const letter = LETTERS[date.getDay()] ?? '';
    if (letter === 'D' || letter === 'S') continue;
    if (!open.length || open.includes(letter)) return toIsoDate(date);
  }
  return addDays(start, 1);
}

/** The list with the days of each account (only the ones that lack them are asked). */
export async function withTimetables<T extends { id: string; dias?: Days }>(list: readonly T[]): Promise<T[]> {
  const missing = list.filter(item => !('dias' in item)).map(item => item.id);
  if (!missing.length) return [...list];
  const { data } = await legacyDb().rpc<{ id: string; dias?: Days }[]>('horarios_cuentas', { p_ids: missing });
  const found = new Map((data ?? []).map(item => [item.id, item]));
  return list.map(item => { const timetable = found.get(item.id); return timetable ? { ...item, dias: timetable.dias ?? {} } : item; });
}

interface CardData { medico?: { tipo?: string } | null; consultas?: { dias?: Days }[] | null }

/** A professional (not a centre) none of whose consultations has days of attention. */
export async function missingTimetable(id: string): Promise<boolean> {
  const { data } = navigator.onLine ? await legacyDb().rpc<CardData>('ficha_cuenta', { p_id: id }) : await cachedRpc<CardData>('ficha_cuenta', { p_id: id }, 'ficha-' + id);
  const consultations = data?.consultas ?? [];
  return Boolean(data?.medico) && data?.medico?.tipo !== 'Centro' && !consultations.some(item => item.dias && Object.keys(item.dias).some(key => item.dias?.[key]));
}

interface WithOthers { dias?: Days; centro_nombre?: string | null; otros_dias?: ({ lugar?: string | null; dias?: Days } | null)[] | null }

/** On a day its centre has no consultation, the other centre where it has one (null if unknown or nothing to change). */
export function otherCentreWithConsultation<T extends WithOthers>(item: T, isoDate: string): NonNullable<NonNullable<T['otros_dias']>[number]> | null {
  const windows = attendanceWindows(item.dias, isoDate);
  if (!windows || windows.length) return null;
  return (item.otros_dias ?? []).find(other => other && other.lugar !== item.centro_nombre && (attendanceWindows(other.dias, isoDate)?.length ?? 0) > 0) ?? null;
}
