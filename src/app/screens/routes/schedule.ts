/**
 * The hours of a route: the best order (the usual planner: nearness and hours of attention) and the hours following the order
 * there is, with the ones fixed by hand. Migrated from the legacy rnItems, rnConHor, rnOrdenAuto and rnHoras (v2.414.0).
 */
import { routesLegacy } from '../../legacy/routes-bridge';
import { weekPlanner, yourDayLegacy } from '../../legacy/bridge';
import { t } from '../../i18n';
import { isPresent, nonZeroOr, orFallback } from '../../services/values';
import { hasLocation, pointOf } from './model';

const DEFAULT_START = '09:00', DEFAULT_VISIT = 15, KM_PER_DEGREE = 111.32, ROAD_FACTOR = 1.3;

type Windows = [number, number][];

export interface RouteHour {
  m: RouteMember; i: number; ini: number; fin: number; viaje: number; ven: Windows | null; aviso: string; fija: boolean; mismo: boolean;
}
export interface RouteHours { filas: RouteHour[]; fin: number; km: number; pasa: boolean }

const windowsOf = (member: RouteMember, isoDate: string): Windows | null => weekPlanner.attendanceWindows(member.dias, isoDate) as Windows | null;

const withHours = <T>(start: string | null | undefined, back: string | null | undefined, work: () => T): T =>
  routesLegacy.withSchedule({ salida: orFallback(start, DEFAULT_START), vuelta: back ? back : null }, work);

const startMinutes = (start: string | null | undefined): number => routesLegacy.minutesOf(orFallback(start, DEFAULT_START)) ?? 0;

/** The members in the best order (those that do not fit go at the end). */
export function bestOrder(members: readonly RouteMember[], isoDate: string, start: string | null | undefined, back: string | null | undefined): RouteMember[] {
  return withHours(start, back, () => {
    const items: PlanItem[] = members.map(member => ({ id: member.id, ref: member, xy: pointOf(member), ventanas: windowsOf(member, isoDate), fija: null }));
    const { seq, fuera } = routesLegacy.schedule(items, startMinutes(start));
    return [...seq.map(step => step.it.ref), ...fuera.map(step => step.it.ref)];
  });
}

function warningOf(point: [number, number] | null, windows: Windows | null, start: number, length: number): string {
  if (!point) return t('routes.hours.noLocation');
  if (windows && !windows.length) return t('routes.hours.notThatDay');
  if (windows?.length && !windows.some(([from, to]) => start >= from && start + length <= to)) return t('routes.hours.outOfHours', { hours: yourDayLegacy.windowsText(windows) });
  return '';
}

/** When the visit starts: after the trip, at its fixed hour, or when the professional starts attending. */
function startOf(arrival: number, fixed: number | null, windows: Windows | null, length: number): number {
  if (fixed !== null) return Math.max(arrival, fixed);
  const window = windows?.find(([, to]) => arrival <= to - length);
  return window && arrival < window[0] ? window[0] : arrival;
}

const kmBetween = (from: [number, number], to: [number, number]): number =>
  Math.hypot((to[0] - from[0]) * KM_PER_DEGREE, (to[1] - from[1]) * KM_PER_DEGREE * Math.cos(to[0] * Math.PI / 180)) * ROAD_FACTOR;

interface Walk { pos: [number, number] | null; time: number; km: number }

/** The trip from where the walk is to `point` (none at the same place or without location); it adds its km to the walk. */
function tripTo(walk: Walk, point: [number, number] | null, stopMinutes: number): { trip: number; same: boolean } {
  const from = walk.pos;
  if (!from || !point) return { trip: 0, same: false };
  if (from[0] === point[0] && from[1] === point[1]) return { trip: 0, same: true };
  walk.km += kmBetween(from, point);
  return { trip: routesLegacy.travelMinutes(from, point) + stopMinutes, same: false };
}

function hourOf(member: RouteMember, index: number, walk: Walk, context: { isoDate: string; fixed: Readonly<Record<string, string>> | null | undefined }): RouteHour {
  const settings = routesLegacy.settings(), length = nonZeroOr(settings.visita, DEFAULT_VISIT), point: [number, number] | null = hasLocation(member) ? [Number(member.lat), Number(member.lon)] : null;
  const windows = windowsOf(member, context.isoDate), { trip, same } = tripTo(walk, point, nonZeroOr(settings.parada, 0));
  const fixedTime = context.fixed?.[member.id], fixed = fixedTime ? routesLegacy.minutesOf(fixedTime) : null;
  const start = startOf(walk.time + trip, fixed, windows, length);
  if (point) walk.pos = point;
  walk.time = start + length;
  return { m: member, i: index, ini: start, fin: start + length, viaje: trip, ven: windows, aviso: warningOf(point, windows, start, length), fija: fixed !== null, mismo: same };
}

/** The hours following the order there is (with the ones fixed by hand), the km and when it ends. */
export function hoursOf(members: readonly RouteMember[], isoDate: string, hours: { start?: string | null | undefined; back?: string | null | undefined; fixed?: Readonly<Record<string, string>> | null | undefined }): RouteHours {
  return withHours(hours.start, hours.back, () => {
    const home = routesLegacy.start();
    const walk: Walk = { pos: isPresent(home.lat) ? [Number(home.lat), Number(home.lon)] : null, time: startMinutes(hours.start), km: 0 };
    const rows = members.map((member, index) => hourOf(member, index, walk, { isoDate, fixed: hours.fixed }));
    const limit = routesLegacy.minutesOf(routesLegacy.settings().tope) ?? Infinity;
    return { filas: rows, fin: walk.time, km: walk.km, pasa: Boolean(hours.back) && walk.time > limit };
  });
}
