/**
 * Maps outside the app: navigating to a stop (Google Maps with every stop, Waze or Apple Maps), finding an address in Spain (only valid
 * in its town), the address of a point, travel minutes between two points and «Estoy aquí» in the account editor. Migrated from the
 * legacy servicios/mapas.js (v2.425.0); enlaceNav, navegarA, geoInversa, enlaceNavApp, cambiarNavegador, rellenarDireccion, estoyAqui,
 * minutosEntre, navActual, navAttr, selectorNav, normGeo and geocodificar stay as adapters.
 */
import { coreLegacy } from '../legacy/core-bridge';
import { t } from '../i18n';
import { escapeHtml } from './format';
import { isPresent } from './values';
import { countryCode } from '../core/organisation';

type Point = readonly (number | null | undefined)[];

const CITY_KMH = 40, ROAD_KMH = 100, CITY_KM = 30, MIN_MINUTES = 6, EXTRA_MINUTES = 5, NEAR_METRES = 250, NEAR_LIMIT = 6, APP_WAIT_MS = 1500;
const NOMINATIM = 'https://nominatim.openstreetmap.org';

export const NAVIGATORS: readonly (readonly [string, string])[] = [['google', 'Google Maps'], ['apple', 'Apple Maps'], ['waze', 'Waze']];

const joined = (point: unknown): string => (Array.isArray(point) ? point.join(',') : String(point));

/** The web link to navigate to `destination` (Google Maps takes the stops on the way). */
export function webLink(destination: unknown, stops: readonly Point[] | null | undefined, app = 'google'): string {
  const target = joined(destination);
  if (app === 'waze') return `https://waze.com/ul?ll=${encodeURIComponent(target)}&navigate=yes`;
  if (app === 'apple') return `https://maps.apple.com/?daddr=${encodeURIComponent(target)}&dirflg=d`;
  const waypoints = stops?.length ? `&waypoints=${encodeURIComponent(stops.map(stop => stop.join(',')).join('|'))}` : '';
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(target)}&travelmode=driving${waypoints}`;
}

/** The link that opens the maps app of the phone (null where only the web link works). */
export function appLink(destination: unknown, stops: readonly Point[] | null | undefined, app: string): string | null {
  const target = joined(destination), ios = coreLegacy.isIos(), android = coreLegacy.isAndroid();
  if (app === 'waze') return `waze://?ll=${encodeURIComponent(target)}&navigate=yes`;
  if (app === 'apple') return ios ? `maps://?daddr=${encodeURIComponent(target)}&dirflg=d` : null;
  if (ios) return `comgooglemaps://?daddr=${[...(stops ?? []).map(stop => stop.join(',')), target].map(encodeURIComponent).join('+to:')}&directionsmode=driving`;
  if (android && !stops?.length) return `google.navigation:q=${encodeURIComponent(target)}&mode=d`;
  return null;   // Android with stops: only the web link takes the whole route
}

/** The maps app takes over; if it is not installed, delcos stays in view and the web link opens. */
export function openApp(app: string, web: string): void {
  let away = false;
  const mark = (): void => { if (document.visibilityState === 'hidden') away = true; };
  document.addEventListener('visibilitychange', mark);
  location.href = app;
  setTimeout(() => {
    document.removeEventListener('visibilitychange', mark);
    // Without the click the browser may block the window: then it opens here
    if (!away && document.visibilityState === 'visible') { const opened = window.open(web, '_blank'); if (!opened) location.href = web; }
  }, APP_WAIT_MS);
}

/** Asks which app to navigate with and opens it (Google Maps with every stop; the others with the first). */
export async function navigateTo(destination: unknown, stops?: readonly Point[] | null): Promise<void> {
  if (!destination) { coreLegacy.toast(t('core.maps.noLocation'), true); return; }
  const several = Boolean(stops?.length);
  const choice = await coreLegacy.choose(t('core.maps.whichApp'), several ? t('core.maps.severalStops') : '',
    [{ k: 'google', t: 'Google Maps' }, { k: 'waze', t: 'Waze', cls: 'sec' }, { k: 'apple', t: 'Apple Maps', cls: 'sec' }, { k: 'no', t: t('common.cancel'), cls: 'sec' }]);
  if (!choice || choice === 'no') return;
  openWith(choice, destination, stops);
}

/** Google Maps takes the whole route; Waze and Apple Maps only the first stop. */
function openWith(choice: string, destination: unknown, stops: readonly Point[] | null | undefined): void {
  const google = choice === 'google', first = stops?.length ? stops[0] : destination;
  const target = google ? destination : first, onTheWay = google ? stops : null;
  const web = webLink(target, onTheWay, choice);
  const app = coreLegacy.isIos() || coreLegacy.isAndroid() ? appLink(target, onTheWay, choice) : null;
  if (!app) { window.open(web, '_blank', 'noopener'); return; }
  openApp(app, web);
}

/** The address of a point (null without answer). */
export async function reverseGeocode(lat: number, lon: number): Promise<unknown> {
  try { return await (await fetch(`${NOMINATIM}/reverse?format=json&addressdetails=1&lat=${lat}&lon=${lon}`)).json() as unknown; } catch { return null; }
}


/** Saves the person's maps app. */
export async function changeNavigator(app: string): Promise<void> {
  const profile = coreLegacy.profile(); if (!profile) return;
  const preferences = { ...(profile.preferencias ?? {}), navegador: app };
  const { data } = await coreLegacy.db().rpc('guardar_preferencias', { p: preferences });
  profile.preferencias = (data as typeof preferences | null) ?? preferences;
  coreLegacy.toast(t('core.maps.navigationWith', { app: NAVIGATORS.find(item => item[0] === app)?.[1] ?? '' }));
  if (coreLegacy.routePlan()) coreLegacy.paintRoutePlan();
}

/** The navigation data of a button (destination and stops), asked when pressed. */
export const navigationAttribute = (destination: unknown, stops?: readonly Point[] | null): string =>
  escapeHtml(JSON.stringify({ d: destination, p: stops?.length ? stops : null }));


/**
 * Travel minutes (decision of Eric, v2.175.0): the first 30 km in a straight line at 40 km/h (town) and the rest at 100 km/h (the road is
 * about 1.2 times longer: about 120 km/h on the motorway), plus 5 minutes; at least 6.
 */
export function minutesBetween(from: Point | null | undefined, to: Point | null | undefined): number {
  if (!from || !to || !isPresent(from[0]) || !isPresent(to[0])) return 0;
  const distance = coreLegacy.km(from, to);
  return Math.max(MIN_MINUTES, Math.round(Math.min(distance, CITY_KM) / CITY_KMH * 60 + Math.max(distance - CITY_KM, 0) / ROAD_KMH * 60) + EXTRA_MINUTES);
}

interface Address { road?: string; house_number?: string; city?: string; town?: string; village?: string; municipality?: string; postcode?: string; province?: string; state_district?: string; county?: string; state?: string; suburb?: string; city_district?: string }

/** Fills the empty address fields of a consultation with a found address. */
export function fillAddress(box: Element, index: string | number, address: Address | null | undefined): void {
  if (!address) return;
  const set = (field: string, value: string): void => {
    const input = box.querySelector<HTMLInputElement>(`[data-cf="${index}|${field}"]`);
    if (input && value && !input.value.trim()) input.value = value;
  };
  set('direccion', [address.road, address.house_number].filter(Boolean).join(', '));
  set('municipio', (address.city ?? address.town ?? address.village ?? address.municipality ?? '').toUpperCase());
  set('cp', address.postcode ?? '');
  set('provincia', (address.province ?? address.state_district ?? address.county ?? address.state ?? '').toUpperCase());
}

/** A place name compared without accents, case or punctuation. */
export const geoText = (text: unknown): string =>
  String(text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

interface Found { address?: Address; fuera?: string; lat?: string; lon?: string }
interface GeocodeHints { municipio?: string | null; direccion?: string | null; cp?: string | null }

const placeOf = (found: Found | undefined): string => {
  const address = found?.address ?? {};
  return address.city ?? address.town ?? address.village ?? address.municipality ?? address.suburb ?? address.county ?? '';
};

const inTown = (town: string) => (found: Found): boolean => {
  if (!town) return true;
  const address = found.address ?? {};
  return [address.city, address.town, address.village, address.municipality, address.city_district, address.county]
    .some(place => { const name = geoText(place); return Boolean(name) && (name === town || name.includes(town) || town.includes(name)); });
};

async function search(query: string): Promise<Found[]> {
  try { const response = await fetch(`${NOMINATIM}/search?format=json&addressdetails=1&limit=5${countryCode() ? `&countrycodes=${countryCode()}` : ''}&${query}`); return response.ok ? await response.json() as Found[] : []; } catch { return []; }
}

/** Street, town and postcode apart (when the free text does not find it). */
const byParts = (street: string, hints: GeocodeHints): string =>
  `street=${encodeURIComponent(street)}&city=${encodeURIComponent(hints.municipio ?? '')}${hints.cp ? `&postalcode=${encodeURIComponent(hints.cp)}` : ''}`;

/**
 * Finds an address only in Spain and, with the town, only a result of that town (trying street, town and postcode apart if the free text
 * fails). Found only elsewhere, the result comes with `fuera` (where it is) and the caller does not save the point.
 */
export async function geocode(query: string, hints: GeocodeHints = {}): Promise<Found | null> {
  const town = geoText(hints.municipio), fits = inTown(town);
  let list = await search(`q=${encodeURIComponent(query)}`);
  let found = list.find(fits);
  if (!found && town && hints.direccion) {
    const second = await search(byParts(hints.direccion, hints));
    found = second.find(fits); if (!list.length) list = second;
  }
  if (found) return found;
  const first = list[0];
  if (town && first) return { ...first, fuera: placeOf(first) || t('core.maps.elsewhere') };
  return first ?? null;
}

async function nearbyCentres(box: Element, index: string | number, lat: number, lon: number): Promise<void> {
  const { data } = await coreLegacy.rpc('buscar_centros', { p_q: null, p_lat: lat, p_lon: lon, p_radio: NEAR_METRES, p_lim: NEAR_LIMIT });
  const near = (data ?? []) as unknown[], results = box.querySelector(`[data-cp="${index}"] .cpres`);
  if (!near.length || !results) { await coreLegacy.centreFromLocation(box, index, lat, lon); return; }
  results.innerHTML = `<div class="sm cpaviso">${t('core.maps.inOneOfThese')}</div>`;
  const list = document.createElement('div'); results.appendChild(list);
  coreLegacy.centreList(list, near, {
    onPick: centre => { coreLegacy.setCentre(box, index, centre); coreLegacy.paintCentreChoice(box, index); coreLegacy.toast(t('core.maps.centreChosen', { name: centre.nombre })); },
    extra: `<button type="button" class="cpitem cpnuevo">${t('core.maps.otherCentre')}</button>`, onExtra: () => coreLegacy.centreFromLocation(box, index, lat, lon),
  });
}

/** «Estoy aquí»: first the centres already known within 250 m; if none, a new centre with the map's data. */
export async function hereNow(box: Element, index: string | number, button: HTMLButtonElement): Promise<void> {
  if (!('geolocation' in navigator)) { coreLegacy.toast(t('core.maps.noGeolocation'), true); return; }
  const text = button.textContent; button.disabled = true; button.textContent = t('core.maps.locating');
  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => { navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }); });
    await nearbyCentres(box, index, Number(position.coords.latitude.toFixed(6)), Number(position.coords.longitude.toFixed(6)));
  } catch { coreLegacy.toast(t('core.maps.locationFailed'), true); }
  finally { button.disabled = false; button.textContent = text; }
}
