/**
 * Orders visits from where the user leaves: each time the one that can start soonest, respecting the hours of attention, the
 * appointments with a fixed hour (without arriving late to the next one) and the time to come back home. Migrated from the legacy
 * programarVisitas, ordenarPorCercania and ordenarPorCercaniaBase (v2.418.0); programarVisitas and ordenarPorCercania stay as
 * adapters (legado 024 and the tests use them).
 */
import { appointments } from '../../../legacy/bridge';
import { routes2Legacy } from '../../../legacy/routes2-bridge';
import { t } from '../../../i18n';
import { todayIso } from '../../../services/dates';
import { orFallback } from '../../../services/values';
import { planSettings, withHours } from './settings';

const LATE_MARGIN = 10, ROUND_MINUTES = 5;

export type Point = [number, number];
export type Windows = [number, number][];
export interface VisitItem<T> { id: string; ref: T; xy: Point | null; ventanas: Windows | null; fija: number | null }
export interface ScheduledVisit<T> { it: VisitItem<T>; llegada: number; ini: number; fin: number }
export interface LeftOut<T> { it: VisitItem<T>; motivo: string }
export interface VisitSchedule<T> { seq: ScheduledVisit<T>[]; fuera: LeftOut<T>[]; fin: number }

interface Walk { pos: Point; time: number; first: boolean }

const samePlace = (first: Point, second: Point): boolean => first[0] === second[0] && first[1] === second[1];

/** Where the user leaves from, as it is stored (without a place, the trips from it count 0 minutes). */
export function homePoint(): Point {
  const leaving = routes2Legacy.start();
  return [leaving.lat, leaving.lon] as unknown as Point;
}

/** Minutes since midnight now. */
export function nowMinutes(): number { const now = new Date(); return now.getHours() * 60 + now.getMinutes(); }

/** Minutes now, rounded up to five. */
export const nowRounded = (): number => Math.ceil(nowMinutes() / ROUND_MINUTES) * ROUND_MINUTES;

function arrivalAt(item: VisitItem<unknown>, from: Point, time: number, first: boolean): number {
  const point = item.xy ?? from, same = !first && samePlace(from, point);
  return time + (same ? 0 : routes2Legacy.travelMinutes(from, point) + planSettings().parada);
}

/** Whether visiting `item` first makes the user late for the next appointment with a fixed hour. */
function makesLate(item: VisitItem<unknown>, fixed: VisitItem<unknown> | undefined, end: number): boolean {
  if (item.fija !== null || !fixed) return false;
  return arrivalAt(fixed, item.xy ?? [0, 0], end, false) > (fixed.fija ?? 0) + LATE_MARGIN;
}

interface Best<T> { it: VisitItem<T>; lleg: number; ini: number; cost: number }

function bestNext<T>(pending: readonly VisitItem<T>[], walk: Walk, home: Point): Best<T> | null {
  const settings = planSettings(), limit = routes2Legacy.minutesOf(settings.tope) ?? Infinity, length = settings.visita;
  const fixed = pending.filter(item => item.fija !== null).sort((first, second) => (first.fija ?? 0) - (second.fija ?? 0))[0];
  let best: Best<T> | null = null;
  for (const item of pending) {
    const arrival = arrivalAt(item, walk.pos, walk.time, walk.first), start = routes2Legacy.possibleStart(item, arrival, length);
    // It has to finish the visit AND be back home before «Vuelta como tarde»
    if (start === null || start + length + routes2Legacy.travelMinutes(item.xy ?? walk.pos, home) > limit) continue;
    if (makesLate(item, fixed, start + length)) continue;
    if (!best || start - walk.time < best.cost) best = { it: item, lleg: arrival, ini: start, cost: start - walk.time };
  }
  return best;
}

function reasonLeftOut(item: VisitItem<unknown>, time: number): string {
  if (item.fija !== null) return t('routesMore.planner.lateForFixed');
  const windows = item.ventanas;
  if (windows?.every(([, to]) => to <= time)) return t('routesMore.planner.hoursOver', { hours: routes2Legacy.windowsText(windows) });
  return t('routesMore.planner.noTimeToComeBack');
}

/** The visits in order (`seq`), those that do not fit (`fuera`, with why) and when the user is back home (`fin`). */
export function scheduleVisits<T>(items: readonly VisitItem<T>[], start: number): VisitSchedule<T> {
  const home = homePoint(), length = planSettings().visita;
  const seq: ScheduledVisit<T>[] = [], fuera: LeftOut<T>[] = [];
  let pending: VisitItem<T>[] = [];
  for (const item of items) {
    if (item.ventanas && !item.ventanas.length) fuera.push({ it: item, motivo: t('routesMore.planner.notThatDay') });
    else if (!item.xy) fuera.push({ it: item, motivo: t('routesMore.planner.noLocation') });
    else pending.push(item);
  }
  const walk: Walk = { pos: home, time: start, first: true };
  while (pending.length) {
    const best = bestNext(pending, walk, home);
    if (!best) break;
    seq.push({ it: best.it, llegada: best.lleg, ini: best.ini, fin: best.ini + length });
    walk.time = best.ini + length; walk.pos = best.it.xy ?? walk.pos; walk.first = false;
    pending = pending.filter(item => item !== best.it);
  }
  for (const item of pending) fuera.push({ it: item, motivo: reasonLeftOut(item, walk.time) });
  return { seq, fuera, fin: walk.time + routes2Legacy.travelMinutes(walk.pos, home) };
}

/** Appointments of a day in the order of the route: the closed ones first, then the open ones in the best order. */
export function orderByDistance(list: readonly RouteAppointment[]): { list: RouteAppointment[]; left: number } {
  return withHours(routes2Legacy.hoursOfAppointments(list), () => {
    const isoDate = orFallback(list[0]?.fecha, orFallback(routes2Legacy.selectedDate(), ''));
    let start = routes2Legacy.minutesOf(planSettings().salida) ?? 0;
    if (isoDate === todayIso()) start = Math.max(start, nowRounded());
    const closed = list.filter(item => !appointments.isOpen(item.estado)), open = list.filter(item => appointments.isOpen(item.estado));
    const items = open.map(item => ({ id: item.id, ref: item, xy: routes2Legacy.pointOf(item), ventanas: routes2Legacy.windowsOf(item.dias, isoDate), fija: routes2Legacy.minutesOf(item.hora) }));
    // To order, nobody is left out by the time to come back: everything possible is ordered
    const { seq, fuera } = scheduleVisits(items, start);
    return { list: [...closed, ...seq.map(step => step.it.ref), ...fuera.map(step => step.it.ref)], left: fuera.length };
  });
}
