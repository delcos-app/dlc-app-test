/**
 * «Tu día en el mapa»: today's appointments numbered on a flat map, the route through the streets, the day as a track with the
 * hour, and «Ver el día», which moves the marker along the streets with the camera following it. Pressing a stop opens the
 * appointment. Migrated from the legacy pintarRutasMapa (v2.418.0).
 */
import { appointmentLegacy, commercialStates } from '../../../legacy/bridge';
import { routes2Legacy } from '../../../legacy/routes2-bridge';
import { t } from '../../../i18n';
import { orFallback } from '../../../services/values';
import type { DayMapPlan, DayStop, StreetLeg } from './day-plan';
import { styleDayMap } from './map-style';
import { dayPosition, type MapParts } from './position';
import { CAR_ICON, lineIcon } from './service';
import { paintTrack, trackScale, travelLines } from './track';

const STYLE = 'https://tiles.openfreemap.org/styles/liberty', MAX_ZOOM = 15, FOLLOW_ZOOM = 13.6;
const PADDING = { top: 50, bottom: 90, left: 50, right: 50 }, FIT_MS = 900, MAX_STEP_S = 0.1, TRAVEL_SPEED = 6, VISIT_SPEED = 70, END_MARGIN = 5, CAMERA_EASE = 2.2;

type Bounds = [[number, number], [number, number]];

function boundsOf(points: readonly [number, number][]): Bounds {
  return points.reduce<Bounds>((box, [latitude, longitude]) => [[Math.min(box[0][0], longitude), Math.min(box[0][1], latitude)], [Math.max(box[1][0], longitude), Math.max(box[1][1], latitude)]], [[180, 90], [-180, -90]]);
}

function stopMarkers(library: MapLibrary, map: RouteMap, plan: DayMapPlan): Record<string, HTMLElement> {
  const markers: Record<string, HTMLElement> = {}, groups = new Map<string, DayStop[]>();
  for (const stop of plan.paradas) { const key = stop.xy.join(','); groups.set(key, [...(groups.get(key) ?? []), stop]); }
  for (const group of groups.values()) {
    const first = group[0]; if (!first) continue;
    const element = document.createElement('button'); element.type = 'button'; element.className = `rmmk${group.length > 1 ? ' multi' : ''}`;
    element.style.setProperty('--c', commercialStates.color(first.c.estado) ?? 'var(--navy)');
    element.innerHTML = `<span>${group.map(stop => stop.i + 1).join('·')}</span>`; element.setAttribute('aria-label', group.map(stop => stop.c.nombre ?? '').join(', '));
    element.onclick = (event): void => { event.stopPropagation(); appointmentLegacy.openSheet(first.c); };
    new library.Marker({ element, anchor: 'bottom' }).setLngLat([first.xy[1], first.xy[0]]).addTo(map);
    for (const stop of group) markers[stop.c.id] = element;
  }
  return markers;
}

function homeMarker(library: MapLibrary, map: RouteMap, plan: DayMapPlan): void {
  if (!plan.casa) return;
  const home = document.createElement('div'); home.className = 'rmcasa'; home.title = orFallback(routes2Legacy.start().nombre, t('routesMore.dayMap.start')); home.innerHTML = routes2Legacy.iconOrEmpty('house');
  new library.Marker({ element: home }).setLngLat([plan.casa[1], plan.casa[0]]).addTo(map);
}

/** The own marker, with its beam. */
function ownMarker(library: MapLibrary, map: RouteMap, start: [number, number]): { element: HTMLElement; marker: MapMarker } {
  const element = document.createElement('div'); element.className = 'rmyo';
  element.innerHTML = `<span class="haz"><svg viewBox="0 0 84 84"><path d="M42 42 L27 2.9 A42 42 0 0 1 57 2.9 Z" fill="#3F82C0" fill-opacity=".38"/></svg></span><span class="pun">${lineIcon(CAR_ICON)}</span>`;
  return { element, marker: new library.Marker({ element }).setLngLat([start[1], start[0]]).addTo(map) };
}

function stopAnimation(): void { const frame = routes2Legacy.animation(); if (frame) cancelAnimationFrame(frame); routes2Legacy.setAnimation(null); }

/** «Ver el día» / «Parar»: plays the day from the hour of the slider (or from the start when it is at the end). */
function bindPlayer(parts: MapParts, bounds: Bounds, move: (minutes?: number) => void): void {
  const button = document.getElementById('rmplay'), slider = parts.slider, label = (): HTMLElement | null => button?.querySelector('span') ?? null;
  const stop = (): void => {
    stopAnimation(); const text = label(); if (text) text.textContent = parts.texts.play;
    parts.own.classList.remove('va');
    if (parts.camera.on) { parts.camera.on = false; parts.camera.centre = null; parts.camera.last = 0; parts.map.fitBounds(bounds, { padding: PADDING, duration: FIT_MS, maxZoom: MAX_ZOOM }); }
  };
  if (!button) return;
  button.onclick = (): void => {
    if (routes2Legacy.animation()) { stop(); return; }
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let minutes = Number(slider.value) >= parts.scale.hi - END_MARGIN ? parts.scale.lo : Number(slider.value), last: number | null = null;
    parts.camera.on = !reduce; const text = label(); if (text) text.textContent = parts.texts.stop; parts.own.classList.add('va');
    const step = (time: number): void => {
      if (!document.getElementById('rmscrub')) { stop(); return; }
      last ??= time; const elapsed = Math.min(MAX_STEP_S, (time - last) / 1000); last = time;
      const travelling = parts.travel.some(segment => minutes >= segment.a && minutes <= segment.b);
      minutes = Math.min(parts.scale.hi, minutes + elapsed * (travelling ? TRAVEL_SPEED : VISIT_SPEED)); slider.value = String(minutes); move(minutes);
      if (minutes < parts.scale.hi) routes2Legacy.setAnimation(requestAnimationFrame(step)); else stop();
    };
    routes2Legacy.setAnimation(requestAnimationFrame(step));
  };
}

/** Follows the marker with the camera, easing towards it. */
export function follow(parts: MapParts, point: [number, number]): void {
  const camera = parts.camera; if (!camera.on) return;
  const time = performance.now(), ease = camera.last ? 1 - Math.exp(-Math.min(500, time - camera.last) / 1000 * CAMERA_EASE) : 1; camera.last = time;
  camera.centre = camera.centre ? [camera.centre[0] + (point[0] - camera.centre[0]) * ease, camera.centre[1] + (point[1] - camera.centre[1]) * ease] : point;
  parts.map.jumpTo({ center: camera.centre, zoom: FOLLOW_ZOOM });
}

/** Paints the map of the day in #rmc (the previous map, if any, is removed). */
export function paintDayMap(library: MapLibrary, plan: DayMapPlan, legs: readonly StreetLeg[] | null, texts: { play: string; stop: string }): void {
  stopAnimation();
  const previous = routes2Legacy.dayMap(); if (previous) { try { previous.remove(); } catch { /* already gone */ } routes2Legacy.setDayMap(null); }
  const points = [...plan.paradas.map(stop => stop.xy), ...(plan.casa ? [plan.casa] : [])], bounds = boundsOf(points);
  const map = new library.Map({ container: 'rmc', style: STYLE, maxPitch: 0, dragRotate: false, attributionControl: { compact: true } });
  routes2Legacy.setDayMap(map); map.touchZoomRotate.disableRotation();
  map.fitBounds(bounds, { padding: PADDING, duration: 0, maxZoom: MAX_ZOOM });
  map.addControl(new library.NavigationControl({ showCompass: false }), 'top-right');
  const travel = plan.segs.filter(segment => segment.tipo === 'viaje'), lines = travelLines(travel, legs);
  const slider = document.getElementById('rmscrub') as HTMLInputElement | null; if (!slider) return;
  // The stops (those at the same place, together) and the start, then the own marker on top
  homeMarker(library, map, plan);
  const markers = stopMarkers(library, map, plan), first = points[0] ?? [0, 0], own = ownMarker(library, map, first), scale = trackScale(plan);
  const parts: MapParts = { map, plan, travel, lines, markers, own: own.element, ownMarker: own.marker, slider, scale, start: first, camera: { on: false, centre: null, last: 0 }, texts };
  const move = (minutes?: number): void => { const point = dayPosition(parts, minutes); if (point) follow(parts, point); };
  map.on('load', () => { styleDayMap(map, { type: 'Feature', geometry: { type: 'LineString', coordinates: lines.flatMap(line => line.l) } }, Boolean(legs)); move(); });
  paintTrack(plan, scale, slider);
  slider.oninput = (): void => { move(); };
  bindPlayer(parts, bounds, move);
  move();
}
