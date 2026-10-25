/**
 * «Tu día en el mapa», at the top of Rutas: today's appointments on the map with the route through the streets and with traffic
 * (TomTom, within the quota) or, when it cannot be asked, in a straight line with the usual estimate, saying why. Migrated from
 * the legacy rutasMapaBase (v2.418.0); the name stays as an adapter (the legacy rutasMapa of servicios/mapas.js wraps it).
 */
import { appointments, currentScreen } from '../../../legacy/bridge';
import { t } from '../../../i18n';
import { formatMinutes, todayIso } from '../../../services/dates';
import { escapeHtml } from '../../../services/format';
import { paintDayMap } from './day-map';
import { dayMapPlan, type DayMapPlan, type StreetLeg } from './day-plan';
import { durationText, lineIcon, mapLibrary, reasonText, streetRoute } from './service';

const MAX_POINTS = 30;

function frameHtml(): string {
  return `<div class="rmcab"><div><h2>${t('routesMore.dayMap.title')}</h2><span class="sm" id="rmsub">${t('routesMore.dayMap.searching')}</span></div>
      <button type="button" class="btn" id="rmplay">${lineIcon('<path d="M6 4l14 8-14 8z"/>')}<span>${t('routesMore.dayMap.play')}</span></button></div>
    <div class="rmwrap"><div class="rmc" id="rmc"></div><div class="rmnav" id="rmnav"></div></div>
    <div class="rmjorn"><div class="rmpista" id="rmpista"></div><div class="rmhoras" id="rmhoras"></div>
      <input type="range" class="rmscrub" id="rmscrub" step="5" aria-label="${t('routesMore.dayMap.hourLabel')}"><div class="rmtx sm" id="rmtx"></div></div>`;
}

function subtitle(route: StreetRoute, plan: DayMapPlan, real: boolean): string {
  if (!real) return t('routesMore.dayMap.straight', { reason: escapeHtml(reasonText(route.motivo)), end: formatMinutes(plan.fin) });
  const delay = (route as { retraso_min?: number }).retraso_min;
  return t('routesMore.dayMap.streets', { km: String(route.km).replace('.', ','), duration: durationText(route.min ?? 0), delay: delay ? t('routesMore.dayMap.delay', { minutes: delay }) : '', end: formatMinutes(plan.fin) });
}

/** The box of the map, added after the day in progress (or the page header); null when there are no stops today. */
function mapBox(reference: Element, plan: DayMapPlan): HTMLElement | null {
  let box = document.getElementById('rmapa');
  if (!plan.paradas.length) { box?.remove(); return null; }
  if (!box) { reference.insertAdjacentHTML('afterend', `<section class="card rmapa" id="rmapa" aria-label="${t('routesMore.dayMap.title')}"></section>`); box = document.getElementById('rmapa'); }
  return box;
}

/** Today's appointments and their plan, with the box of the map ready (null when the page is gone or there are no stops). */
async function prepare(): Promise<{ list: RouteAppointment[]; estimate: DayMapPlan } | null> {
  const view = document.getElementById('v-rutas');
  if (currentScreen() !== 'rutas' || !view) return null;
  const reference = document.getElementById('renc') ?? view.querySelector('.saludo'); if (!reference) return null;
  const list = await appointments.ofDay(todayIso()) as unknown as RouteAppointment[];
  if (currentScreen() !== 'rutas' || !reference.isConnected) return null;
  const estimate = dayMapPlan(list, todayIso(), null), box = mapBox(reference, estimate); if (!box) return null;
  box.innerHTML = frameHtml();
  return { list, estimate };
}

/** The route through the streets (in a straight line with more than 30 points or fewer than 2). */
function routeOf(estimate: DayMapPlan, isoDate: string): Promise<StreetRoute> {
  const first = estimate.segs[0], leaving = first ? `${isoDate}T${formatMinutes(Math.max(0, first.a))}:00` : null;
  const fits = estimate.puntos.length > 1 && estimate.puntos.length <= MAX_POINTS;
  return fits ? streetRoute(estimate.puntos, leaving) : Promise.resolve({ ok: false, motivo: 'datos' });
}

async function libraryOrNotice(): Promise<MapLibrary | null> {
  try { return await mapLibrary(); } catch {
    const place = document.getElementById('rmc'); if (place) place.innerHTML = `<div class="vacio">${t('routesMore.dayMap.noMap')}</div>`;
    return null;
  }
}

export async function loadDayMap(): Promise<void> {
  const ready = await prepare(); if (!ready) return;
  const library = await libraryOrNotice(); if (!library || !document.getElementById('rmc')) return;
  const isoDate = todayIso(), { list, estimate } = ready, route = await routeOf(estimate, isoDate);
  if (!document.getElementById('rmc')) return;
  const legs = route.ok && route.tramos?.length === estimate.puntos.length - 1 ? route.tramos as StreetLeg[] : null;
  const plan = legs ? dayMapPlan(list, isoDate, legs) : estimate;
  const text = document.getElementById('rmsub'); if (text) text.innerHTML = subtitle(route, plan, Boolean(legs));
  paintDayMap(library, plan, legs, { play: t('routesMore.dayMap.play'), stop: t('routesMore.dayMap.stop') });
}
