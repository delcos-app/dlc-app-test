/**
 * The times of «Tu día» with traffic: the minutes of a leg, today's route with the points of «Tu día en el mapa» and keeping the times
 * with traffic of a route. Split from traffic.ts for plan 7.3 (cut C): the day estimate of the core (legado 024 and 103) calls these at
 * once, so they stay in the core; asking for the traffic and its mark in the header are in the Agenda chunk.
 */
import { appointments } from '../../legacy/bridge';
import { routes2Legacy } from '../../legacy/routes2-bridge';
import { formatMinutes, todayIso } from '../../services/dates';
import { dayMapPlan } from '../routes/today/day-plan';

const MIN_STOPS = 2, MAX_POINTS = 30;

export interface DayRoute { puntos: [number, number][]; salida: string | null; k: string }

/** Minutes between two points: the time with traffic of that leg when it is known, otherwise the usual estimate. */
export function legMinutes(from: [number, number], to: [number, number]): number {
  if (routes2Legacy.realTrafficValid()) { const known = routes2Legacy.realTraffic()?.mapa.get(routes2Legacy.legKey(from, to)); if (known !== undefined) return known; }
  return routes2Legacy.travelMinutes(from, to);
}

/** Today's route with the same points and start as «Tu día en el mapa» (null on another day or with fewer than two stops). */
export function dayRoute(list: readonly RouteAppointment[] | null | undefined, isoDate: string | null): DayRoute | null {
  if (isoDate !== todayIso() || !list) return null;
  if (list.filter(item => appointments.isOpen(item.estado) && routes2Legacy.pointOf(item)).length < MIN_STOPS) return null;
  routes2Legacy.setCalculating(true);
  let plan;
  try { plan = dayMapPlan(list, isoDate, null); } finally { routes2Legacy.setCalculating(false); }
  if (plan.puntos.length < MIN_STOPS || plan.puntos.length > MAX_POINTS) return null;
  const first = plan.segs[0], start = first ? `${isoDate}T${formatMinutes(Math.max(0, first.a))}:00` : null;
  return { puntos: plan.puntos, salida: start, k: JSON.stringify([plan.puntos, start]) };
}

/** Keeps the times with traffic of `route` (false when the answer does not fit its legs). */
export function setRealTimes(route: DayRoute | null, result: StreetRoute | null | undefined): boolean {
  const legs = result?.tramos;
  if (!route || !result?.ok || !legs || legs.length !== route.puntos.length - 1) return false;
  const times = new Map<string, number>();
  legs.forEach((leg, index) => { times.set(routes2Legacy.legKey(route.puntos[index], route.puntos[index + 1]), Math.round(Number(leg.min) || 0)); });
  routes2Legacy.setRealTraffic({ k: route.k, mapa: times, t: Date.now() });
  return true;
}
