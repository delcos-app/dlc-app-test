/**
 * The map library (MapLibre, loaded once from its pinned address), the street route of a day (the «rutas» function: TomTom with
 * traffic, within the daily quota; kept only in memory for 10 minutes), and the texts and palette of the map. Migrated from the
 * legacy rmLib, rmRuta, rmDur, rmKm, RM_SV, RM_COCHE, RM_PAL and RM_MOTIVO (v2.418.0); rmLib and rmRuta stay as adapters.
 */
import { routes2Legacy } from '../../../legacy/routes2-bridge';
import { t, type MessageKey } from '../../../i18n';

const LIBRARY = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl', INTEGRITY = 'sha384-SYKAG6cglRMN0RVvhNeBY0r3FYKNOJtznwA0v7B5Vp9tr31xAHsZC0DqkQ/pZDmj';
const MEMORY_MS = 600000, NOT_FOUND = 404, KM_PER_DEGREE = 111.32;

export const PALETTE: Readonly<Record<string, string>> = {
  tierra: '#F1F3F4', zona: '#ECEEF0', parque: '#D6EDDA', agua: '#AFD3F2', edif: '#E4E6EA', calle: '#FFFFFF', borde: '#DADCE0',
  via: '#FFF1C2', viaBorde: '#F2D27A', texto: '#5F6368', ruta: '#3F82C0', rutaBorde: '#1F5A99', hecho: '#A8BCD2',
};

export const CAR_ICON = '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>';

/** A line icon with the given SVG paths. */
export const lineIcon = (paths: string): string => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

const REASONS = new Map<string, MessageKey>([
  ['empresa', 'routesMore.service.company'], ['global', 'routesMore.service.global'], ['apagado', 'routesMore.service.off'],
  ['sin_clave', 'routesMore.service.noKey'], ['servicio', 'routesMore.service.service'], ['sesion', 'routesMore.service.session'], ['datos', 'routesMore.service.data'],
]);

/** Why the route goes in a straight line. */
export const reasonText = (reason: string | null | undefined): string => t(REASONS.get(reason ?? '') ?? 'routesMore.service.service');

/** «1 h 05», «40 min». */
export const durationText = (minutes: number): string => (minutes >= 60 ? `${Math.floor(minutes / 60)} h ${String(Math.round(minutes % 60)).padStart(2, '0')}` : `${Math.round(minutes)} min`);

/** Km between two [latitude, longitude] points (flat approximation, for the animation). */
export const flatKm = (from: [number, number], to: [number, number]): number =>
  Math.hypot((to[1] - from[1]) * KM_PER_DEGREE * Math.cos(from[0] * Math.PI / 180), (to[0] - from[0]) * KM_PER_DEGREE);

let loading: Promise<MapLibrary> | null = null;

/** MapLibre, loaded the first time it is needed (its style goes in the layer of the libraries). */
export function mapLibrary(): Promise<MapLibrary> {
  const loaded = routes2Legacy.mapLibre();
  if (loaded) return Promise.resolve(loaded);
  loading ??= new Promise((resolve, reject) => {
    document.head.insertAdjacentHTML('beforeend', `<style>@import url("${LIBRARY}.css") layer(lib);</style>`);
    const script = document.createElement('script');
    script.src = `${LIBRARY}.js`; script.integrity = INTEGRITY; script.crossOrigin = 'anonymous';
    script.onload = (): void => { const library = routes2Legacy.mapLibre(); if (library) resolve(library); else reject(new Error('mapa')); };
    script.onerror = (): void => { loading = null; reject(new Error('mapa')); };
    document.head.appendChild(script);
  });
  return loading;
}

async function failureOf(error: RoutesFunctionError): Promise<StreetRoute> {
  if (error.context?.status === NOT_FOUND) return { ok: false, motivo: 'sin_clave' };
  try {
    const body = await error.context?.json?.() as { motivo?: string } | null | undefined;
    return body?.motivo ? body as StreetRoute : { ok: false, motivo: 'servicio' };
  } catch { return { ok: false, motivo: 'servicio' }; }
}

/** The route through the streets of `points` leaving at `start` (or why not). */
export async function streetRoute(points: readonly [number, number][], start: string | null): Promise<StreetRoute> {
  const key = JSON.stringify([points, start]), remembered = routes2Legacy.routeMemory().get(key);
  if (remembered && Date.now() - remembered.t < MEMORY_MS) return remembered.r;
  let result: StreetRoute | null;
  try {
    const { data, error } = await routes2Legacy.invokeRoutes({ puntos: points, salida: start });
    result = error ? await failureOf(error) : data;
  } catch { result = { ok: false, motivo: 'servicio' }; }
  if (result?.ok) routes2Legacy.routeMemory().set(key, { t: Date.now(), r: result });
  return result ?? { ok: false, motivo: 'servicio' };
}
