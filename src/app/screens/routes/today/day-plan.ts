/**
 * The day on the map: the stops in their order, the start (if there is one) and the legs of travel and of visit. With street times
 * (`legs`), each hour comes from the trip (the fixed ones are respected). Migrated from the legacy rmPlanBase and rmPlan (v2.418.0).
 */
import { appointments } from '../../../legacy/bridge';
import { routes2Legacy } from '../../../legacy/routes2-bridge';
import { planSettings } from '../planner/settings';
import type { Point } from '../planner/visits';

const DEFAULT_VISIT = 15, DAY_START = 9 * 60, DAY_END = 18 * 60;

export interface StreetLeg { linea?: [number, number][]; min: number; km: number }
export interface DayStop { c: RouteAppointment; i: number; xy: Point; ini: number }
export interface TravelSegment { tipo: 'viaje'; a: number; b: number; de: Point; hasta: Point; k: number; km: number | null }
export interface VisitSegment { tipo: 'vis'; a: number; b: number; p: DayStop }
export type DaySegment = TravelSegment | VisitSegment;
export interface DayMapPlan { paradas: DayStop[]; puntos: Point[]; segs: DaySegment[]; casa: Point | null; ini: number; fin: number; tope: number | null }

interface Walk { pos: Point | null; time: number | null; leg: number; index: number }

/** The trip to `stop` (none from the same place); returns when the visit starts. */
function travelTo(plan: { segs: DaySegment[] }, walk: Walk, stop: DayStop, legs: readonly StreetLeg[] | null): number {
  const from = walk.pos;
  if (!from || (from[0] === stop.xy[0] && from[1] === stop.xy[1])) return stop.ini;
  const leg = legs?.[walk.leg], trip = leg ? leg.min + (Number(planSettings().parada) || 0) : routes2Legacy.travelMinutes(from, stop.xy);
  const leaves = walk.time ?? stop.ini - trip;
  plan.segs.push({ tipo: 'viaje', a: leaves, b: leaves + trip, de: from, hasta: stop.xy, k: walk.leg, km: leg ? leg.km : null });
  // With real times, the hour comes from the trip (the fixed ones are respected)
  return legs ? Math.max(leaves + trip, routes2Legacy.minutesOf(stop.c.hora) ?? 0) : stop.ini;
}

function addStop(plan: { segs: DaySegment[]; casa: Point | null }, walk: Walk, stop: DayStop, legs: readonly StreetLeg[] | null): void {
  const length = planSettings().visita || DEFAULT_VISIT, start = travelTo(plan, walk, stop, legs);
  if (walk.pos && (plan.casa || walk.index > 0)) walk.leg += 1;
  stop.ini = start;
  plan.segs.push({ tipo: 'vis', a: start, b: start + length, p: stop });
  walk.pos = stop.xy; walk.time = start + length; walk.index += 1;
}

/** Where the user leaves from, or null. */
function homeOf(): Point | null {
  const leaving = routes2Legacy.start();
  return leaving.lat !== null && leaving.lat !== undefined && leaving.lon !== null && leaving.lon !== undefined ? [Number(leaving.lat), Number(leaving.lon)] : null;
}

/** The trip back home after the last stop. */
function comeBack(plan: { segs: DaySegment[] }, walk: Walk, home: Point, legs: readonly StreetLeg[] | null): void {
  if (!walk.pos || walk.time === null) return;
  const leg = legs?.[walk.leg], trip = leg ? leg.min : routes2Legacy.travelMinutes(walk.pos, home);
  plan.segs.push({ tipo: 'viaje', a: walk.time, b: walk.time + trip, de: walk.pos, hasta: home, k: walk.leg, km: leg ? leg.km : null });
  walk.time += trip;
}

function plan(list: readonly RouteAppointment[], isoDate: string, legs: readonly StreetLeg[] | null): DayMapPlan {
  const alive = list.filter(item => routes2Legacy.pointOf(item) && (appointments.isOpen(item.estado) || routes2Legacy.isDone(item.estado)));
  const estimate = routes2Legacy.estimateDay(alive, isoDate), casa = homeOf();
  const paradas = alive.map((item, index) => ({ c: item, i: index, xy: routes2Legacy.pointOf(item) ?? [0, 0] as Point, ini: estimate.est[item.id] ?? routes2Legacy.minutesOf(item.hora) }))
    .filter((stop): stop is DayStop => stop.ini !== null);
  const puntos = [...(casa ? [casa] : []), ...paradas.map(stop => stop.xy), ...(casa && paradas.length ? [casa] : [])];
  const result: DayMapPlan = { paradas, puntos, segs: [], casa, ini: DAY_START, fin: DAY_END, tope: Number.isFinite(estimate.tope) ? estimate.tope : null };
  const walk: Walk = { pos: casa, time: null, leg: 0, index: 0 };
  for (const stop of paradas) addStop(result, walk, stop, legs);
  if (casa) comeBack(result, walk, casa, legs);
  result.ini = result.segs[0]?.a ?? DAY_START; result.fin = walk.time ?? DAY_END;
  return result;
}

/** The plan of the map. Without street legs it is always computed with the estimate (so its key is the same in Rutas and «Tu día»). */
export function dayMapPlan(list: readonly RouteAppointment[], isoDate: string, legs: readonly StreetLeg[] | null): DayMapPlan {
  if (legs) return plan(list, isoDate, legs);
  const real = routes2Legacy.realTraffic(); routes2Legacy.setRealTraffic(null);
  try { return plan(list, isoDate, null); } finally { routes2Legacy.setRealTraffic(real); }
}
