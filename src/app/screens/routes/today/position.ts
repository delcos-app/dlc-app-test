/**
 * Where the user is at a minute of the day on «Tu día en el mapa»: the marker (on its travel line, or at the stop), the part of
 * the route done, which stops are behind and which is next, and the text of the moment («Hacia…», «En…», «Siguiente…»). Migrated
 * from the legacy pintarRutasMapa (v2.418.0).
 */
import { routes2Legacy } from '../../../legacy/routes2-bridge';
import { t } from '../../../i18n';
import { formatMinutes } from '../../../services/dates';
import { escapeHtml } from '../../../services/format';
import { planSettings } from '../planner/settings';
import type { DayMapPlan, DayStop, TravelSegment, VisitSegment } from './day-plan';
import { CAR_ICON, lineIcon } from './service';
import { pointOnLine, type PreparedLine, type TrackScale } from './track';

const DEFAULT_VISIT = 15, CHECK_ICON = '<path d="M20 6 9 17l-5-5"/>', CLOCK_ICON = '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>';

export interface MapParts {
  map: RouteMap; plan: DayMapPlan; travel: TravelSegment[]; lines: PreparedLine[]; markers: Record<string, HTMLElement>; own: HTMLElement; ownMarker: MapMarker;
  slider: HTMLInputElement; scale: TrackScale; start: [number, number]; camera: { on: boolean; centre: [number, number] | null; last: number }; texts: { play: string; stop: string };
}

interface Moment { leg: number; travel: TravelSegment | null; visit: VisitSegment | undefined; part: number }

const lngLat = (point: readonly [number, number]): [number, number] => [point[1], point[0]];

function momentAt(parts: MapParts, minutes: number): Moment {
  const leg = parts.travel.findIndex(segment => minutes >= segment.a && minutes < segment.b), travel = leg >= 0 ? parts.travel[leg] ?? null : null;
  const visit = parts.plan.segs.find((segment): segment is VisitSegment => segment.tipo === 'vis' && minutes >= segment.a && minutes <= segment.b);
  return { leg, travel, visit, part: travel ? (minutes - travel.a) / ((travel.b - travel.a) || 1) : 0 };
}

function markerPoint(parts: MapParts, moment: Moment, minutes: number): { point: [number, number]; heading: number | null } {
  if (moment.travel) { const at = pointOnLine(parts.lines[moment.leg] ?? { l: [], c: [0], tot: 1 }, moment.part); return { point: at.pt, heading: at.rumbo }; }
  if (moment.visit) return { point: lngLat(moment.visit.p.xy), heading: null };
  const before = parts.plan.segs.filter(segment => segment.b <= minutes).pop();
  if (before) return { point: lngLat(before.tipo === 'vis' ? before.p.xy : before.hasta), heading: null };
  return { point: lngLat(parts.start), heading: null };
}

/** The part of the route done up to `minutes`. */
function donePart(parts: MapParts, moment: Moment, minutes: number): [number, number][] {
  const done: [number, number][] = [];
  parts.lines.forEach((line, index) => {
    if ((parts.travel[index]?.b ?? Infinity) <= minutes) done.push(...line.l);
    else if (index === moment.leg) { const at = pointOnLine(line, moment.part); done.push(...line.l.slice(0, at.i), at.pt); }
  });
  return done;
}

function placeName(parts: MapParts, point: readonly [number, number]): string {
  const stop = parts.plan.paradas.find(item => item.xy[0] === point[0] && item.xy[1] === point[1]);
  return stop ? stop.c.nombre ?? '' : routes2Legacy.start().nombre ?? t('routesMore.dayMap.theStart');
}

function momentHtml(parts: MapParts, moment: Moment, next: DayStop | undefined): string {
  const { travel, visit, part } = moment;
  if (travel) {
    const left = travel.km !== null ? ` · ${String(Math.round((1 - part) * travel.km * 10) / 10).replace('.', ',')} km` : '';
    return `<span class="ico">${lineIcon(CAR_ICON)}</span><div><b>${t('routesMore.dayMap.towards', { place: escapeHtml(placeName(parts, travel.hasta)) })}</b><span>${t('routesMore.dayMap.arrive', { time: formatMinutes(travel.b) })}${left}</span></div>`;
  }
  if (visit) {
    const after = next && next !== visit.p ? t('routesMore.dayMap.after', { name: escapeHtml(next.c.nombre ?? '') }) : '';
    return `<span class="ico">${lineIcon(CHECK_ICON)}</span><div><b>${t('routesMore.dayMap.at', { place: escapeHtml(visit.p.c.nombre ?? '') })}</b><span>${t('routesMore.dayMap.until', { time: formatMinutes(visit.b) })}${after}</span></div>`;
  }
  if (next) return `<span class="ico">${lineIcon(CLOCK_ICON)}</span><div><b>${t('routesMore.dayMap.next', { name: escapeHtml(next.c.nombre ?? '') })}</b><span>${t('routesMore.dayMap.around', { time: formatMinutes(next.ini) })}</span></div>`;
  return `<span class="ico">${routes2Legacy.iconOrEmpty('house')}</span><div><b>${t('routesMore.dayMap.dayOver')}</b><span>${t('routesMore.dayMap.backAround', { time: formatMinutes(parts.plan.fin) })}</span></div>`;
}

/** Puts everything at minute `minutes` (by default, the hour of the slider); returns where the marker is. */
export function dayPosition(parts: MapParts, minutes?: number): [number, number] | null {
  if (!document.getElementById('rmscrub')) return null;
  const now = minutes ?? Number(parts.slider.value), moment = momentAt(parts, now), { point, heading } = markerPoint(parts, moment, now);
  parts.ownMarker.setLngLat(point); parts.own.classList.toggle('parado', !moment.travel);
  if (heading !== null) { const beam = parts.own.querySelector<HTMLElement>('.haz'); if (beam) beam.style.transform = `rotate(${heading}deg)`; }
  const done = donePart(parts, moment, now), source = parts.map.getSource('rm-hecho');
  source?.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: done.length > 1 ? done : [] } });
  const length = planSettings().visita || DEFAULT_VISIT, next = parts.plan.paradas.find(stop => stop.ini + length > now);
  for (const stop of parts.plan.paradas) {
    const element = parts.markers[stop.c.id]; if (!element) continue;
    element.classList.toggle('pasada', stop.ini + length <= now); element.classList.toggle('sig', stop === next);
  }
  const nav = document.getElementById('rmnav'), text = document.getElementById('rmtx');
  if (nav) nav.innerHTML = momentHtml(parts, moment, next);
  if (text) text.innerHTML = t('routesMore.dayMap.atTime', { time: formatMinutes(now) });
  return point;
}
