/**
 * The working day as a track under the map (travel and visit segments, the hour now and the limit to come back) and the lines of
 * the travel legs with the point at a fraction of each, to move the marker. Migrated from the legacy pintarRutasMapa (v2.418.0).
 */
import { appointments } from '../../../legacy/bridge';
import { routes2Legacy } from '../../../legacy/routes2-bridge';
import { t } from '../../../i18n';
import { formatMinutes } from '../../../services/dates';
import { escapeHtml } from '../../../services/format';
import { range } from '../../../services/values';
import { nowMinutes } from '../planner/visits';
import type { DayMapPlan, StreetLeg, TravelSegment } from './day-plan';
import { flatKm } from './service';

const MARGIN = 30, HOUR = 60, MIN_KM = 0.001;

export interface TrackScale { lo: number; hi: number; x: (minutes: number) => string }
/** A travel line as [longitude, latitude] points with the km run up to each one. */
export interface PreparedLine { l: [number, number][]; c: number[]; tot: number }

export function trackScale(plan: DayMapPlan): TrackScale {
  const lo = Math.floor((Math.min(plan.ini, plan.tope ?? plan.ini) - MARGIN) / HOUR) * HOUR, hi = Math.ceil((Math.max(plan.fin, plan.tope ?? 0) + MARGIN) / HOUR) * HOUR;
  return { lo, hi, x: minutes => `${((minutes - lo) / ((hi - lo) || 1) * 100).toFixed(2)}%` };
}

function segmentHtml(segment: DayMapPlan['segs'][number], scale: TrackScale): string {
  const position = `left:${scale.x(segment.a)};width:calc(${scale.x(segment.b)} - ${scale.x(segment.a)})`;
  if (segment.tipo === 'viaje') return `<div class="seg viaje" style="${position}"></div>`;
  const state = segment.p.c.estado, kind = routes2Legacy.isDone(state) ? 'hecha' : appointments.isOpen(state) ? '' : 'no';
  return `<div class="seg vis ${kind}" style="${position}" title="${escapeHtml(segment.p.c.nombre ?? '')}"><span>${segment.p.i + 1}</span></div>`;
}

/** Paints the track and the hours, and sets the range of the hour slider. */
export function paintTrack(plan: DayMapPlan, scale: TrackScale, slider: HTMLInputElement): void {
  const now = nowMinutes(), { lo, hi, x } = scale;
  const track = document.getElementById('rmpista'), hours = document.getElementById('rmhoras');
  if (track) track.innerHTML = `${plan.tope && plan.tope < hi ? `<div class="tope" style="left:${x(plan.tope)};right:0" title="${t('routesMore.dayMap.afterBack')}"></div>` : ''}
    ${plan.segs.map(segment => segmentHtml(segment, scale)).join('')}
    ${now > lo && now < hi ? `<div class="ahora" style="left:${x(now)}"></div>` : ''}`;
  if (hours) hours.innerHTML = range((hi - lo) / HOUR + 1).map(step => lo + step * HOUR).map(minutes => `<span style="left:${x(minutes)}">${formatMinutes(minutes)}</span>`).join('');
  slider.min = String(lo); slider.max = String(hi); slider.value = String(Math.min(hi, Math.max(lo, now)));
}

function prepare(points: [number, number][]): PreparedLine {
  const run = [0];
  for (let index = 1; index < points.length; index++) {
    const from = points[index - 1] ?? [0, 0], to = points[index] ?? from;
    run.push((run[index - 1] ?? 0) + flatKm([from[1], from[0]], [to[1], to[0]]));
  }
  const total = run[run.length - 1] ?? 0;
  return { l: points, c: run, tot: total || MIN_KM };
}

/** The travel lines: through the streets when there are legs; otherwise straight. */
export function travelLines(travel: readonly TravelSegment[], legs: readonly StreetLeg[] | null): PreparedLine[] {
  return travel.map(segment => {
    const line = legs?.[segment.k]?.linea;
    return prepare(line && line.length > 1 ? line.map(([latitude, longitude]) => [longitude, latitude]) : [[segment.de[1], segment.de[0]], [segment.hasta[1], segment.hasta[0]]]);
  });
}

/** The point at fraction `part` of a line, the index of the next point and the heading. */
export function pointOnLine(line: PreparedLine, part: number): { pt: [number, number]; i: number; rumbo: number } {
  const distance = Math.max(0, Math.min(1, part)) * line.tot;
  let index = 1;
  while (index < line.c.length - 1 && (line.c[index] ?? 0) < distance) index++;
  const from = line.l[index - 1] ?? [0, 0], to = line.l[index] ?? from, before = line.c[index - 1] ?? 0;
  const share = Math.max(0, Math.min(1, (distance - before) / (((line.c[index] ?? 0) - before) || 1)));
  const heading = (Math.atan2((to[0] - from[0]) * Math.cos(from[1] * Math.PI / 180), to[1] - from[1]) * 180 / Math.PI + 360) % 360;
  return { pt: [from[0] + (to[0] - from[0]) * share, from[1] + (to[1] - from[1]) * share], i: index, rumbo: heading };
}
