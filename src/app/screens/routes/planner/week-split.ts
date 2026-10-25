/**
 * Shares out accounts among the days of a week: each day starts from the one that can go on fewest days (urgent first) and fills
 * the day with the 40 closest to it, respecting the appointments already there. Migrated from the legacy repartirSemana (v2.418.0).
 */
import { appointments } from '../../../legacy/bridge';
import { routes2Legacy } from '../../../legacy/routes2-bridge';
import { t } from '../../../i18n';
import { todayIso } from '../../../services/dates';
import { planSettings } from './settings';
import { homePoint, nowRounded, scheduleVisits, type Point, type VisitItem, type Windows } from './visits';

const CLOSEST = 40;

export interface WeekCandidate { id: string; nombre: string; lat?: number | string | null; lon?: number | string | null; dias?: Record<string, string | null> | null; urgente?: boolean | null; centro_nombre?: string | null; municipio?: string | null }
interface Placed { m: WeekCandidate; xy: Point }
interface WeekRef { existente?: RouteAppointment; p?: Placed }
export interface WeekEntry { existente?: RouteAppointment; m?: WeekCandidate; ini?: number; cita?: Record<string, unknown>; motivo?: string }
export interface WeekSplit { semana: string; uid: string; dias: Record<string, WeekEntry[]>; orden: Record<string, WeekEntry[]>; sinDia: WeekEntry[]; total: number; horario?: PlanHoursLike | null }
interface PlanHoursLike { salida: string | null; vuelta: string | null }
export interface WeekOptions { days: readonly string[]; perDay: Record<string, RouteAppointment[]>; max: number | null; monday: string }

const windowsOn = (days: WeekCandidate['dias'], isoDate: string): Windows | null => routes2Legacy.windowsOf(days, isoDate);
const attendsOn = (candidate: WeekCandidate, isoDate: string): boolean => { const windows = windowsOn(candidate.dias, isoDate); return !(windows && !windows.length); };

function startOn(isoDate: string): number {
  const start = routes2Legacy.minutesOf(planSettings().salida) ?? 0;
  return isoDate === todayIso() ? Math.max(start, nowRounded()) : start;
}

/** The new ones that fit on `isoDate`, in order with those already there. */
function dayEntries(pending: readonly Placed[], isoDate: string, options: WeekOptions, uid: string): { entries: WeekEntry[]; chosen: Set<Placed> } {
  const available = pending.filter(item => attendsOn(item.m, isoDate));
  if (!available.length) return { entries: [], chosen: new Set() };
  // Seed: the one that can go on fewest days (and urgent first), so it is not left without a place
  const home = homePoint(), dayCount = (item: Placed): number => options.days.filter(day => attendsOn(item.m, day)).length;
  available.sort((first, second) => dayCount(first) - dayCount(second) || (second.m.urgente ? 1 : 0) - (first.m.urgente ? 1 : 0)
    || routes2Legacy.km(home, first.xy) - routes2Legacy.km(home, second.xy));
  const seed = available[0]?.xy ?? home;
  const close = available.slice().sort((first, second) => routes2Legacy.km(seed, first.xy) - routes2Legacy.km(seed, second.xy)).slice(0, CLOSEST);
  const existing = (options.perDay[isoDate] ?? []).filter(item => item.usuario_id === uid && appointments.isOpen(item.estado));
  const items: VisitItem<WeekRef>[] = [
    ...existing.map(item => ({ id: item.id, ref: { existente: item }, xy: routes2Legacy.pointOf(item), ventanas: windowsOn(item.dias, isoDate), fija: routes2Legacy.minutesOf(item.hora) })),
    ...close.map(item => ({ id: item.m.id, ref: { p: item }, xy: item.xy, ventanas: windowsOn(item.m.dias, isoDate), fija: null })),
  ];
  const { seq } = scheduleVisits(items, startOn(isoDate));
  let fresh = seq.filter(step => step.it.ref.p);
  if (options.max) fresh = fresh.slice(0, options.max);
  const chosen = new Set(fresh.map(step => step.it.ref.p).filter((item): item is Placed => Boolean(item)));
  const entries = seq.filter(step => step.it.ref.existente ?? (step.it.ref.p && chosen.has(step.it.ref.p))).map(step => toEntry(step.it.ref, step.ini, isoDate));
  return { entries, chosen };
}

function toEntry(ref: WeekRef, start: number, isoDate: string): WeekEntry {
  if (ref.existente || !ref.p) return ref.existente ? { existente: ref.existente } : {};
  const { m: candidate, xy } = ref.p;
  return { m: candidate, ini: start, cita: { id: `nueva-${candidate.id}`, fecha: isoDate, dias: candidate.dias, lat: xy[0], lon: xy[1] } };
}

/** The proposal: new appointments per day (`dias`), the order to save with those already there (`orden`) and who is left out. */
export function splitWeek(list: readonly WeekCandidate[], options: WeekOptions): WeekSplit {
  const uid = routes2Legacy.agendaOwner();
  const located = (item: WeekCandidate): boolean => item.lat !== null && item.lat !== undefined && item.lon !== null && item.lon !== undefined;
  let pending: Placed[] = list.filter(located).map(item => ({ m: item, xy: [Number(item.lat), Number(item.lon)] }));
  const sinDia: WeekEntry[] = list.filter(item => !located(item)).map(item => ({ m: item, motivo: t('routesMore.planner.noLocation') }));
  const result: WeekSplit = { semana: options.monday, uid, dias: {}, orden: {}, sinDia, total: 0 };
  for (const day of options.days) {
    const { entries, chosen } = dayEntries(pending, day, options, uid);
    result.orden[day] = entries;
    // Only the new ones count in the view; the existing ones are kept to respect the order when saving
    result.dias[day] = entries.filter(entry => !entry.existente);
    pending = pending.filter(item => !chosen.has(item));
  }
  result.total = options.days.reduce((count, day) => count + (result.dias[day]?.length ?? 0), 0);
  for (const item of pending) {
    sinDia.push({ m: item.m, motivo: t(options.days.some(day => attendsOn(item.m, day)) ? 'routesMore.planner.noRoomOnDays' : 'routesMore.planner.noneOfDays') });
  }
  return result;
}
