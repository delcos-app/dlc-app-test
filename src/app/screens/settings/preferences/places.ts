/**
 * Configuración → Preferencias: the start and end points of the day (searched by address or taken from the GPS), used by the
 * day plan and the routes. Migrated from the legacy pintarPrefsBase (v2.415.0).
 */
import { legacyDb, notices } from '../../../legacy/bridge';
import { settingsLegacy, type Place } from '../../../legacy/settings1-bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { countryCode } from '../../../core/organisation';

const searchUrl = (): string => `https://nominatim.openstreetmap.org/search?format=json&limit=1${countryCode() ? `&countrycodes=${countryCode()}` : ''}&q=`;
const GPS_TIMEOUT_MS = 15000, GPS_DECIMALS = 6, SHOWN_ADDRESS_PARTS = 3;
const KEYS = { start: 'salida', end: 'llegada' } as const;

const located = (text: string): string => `<b class="u-ok">${t('settings.preferences.located')}</b> ${text}`;

function placeCard(key: string, place: Place | null, title: string, hint: string): string {
  return `<div class="card" style="padding-top:16px;padding-bottom:16px">
    <h2 class="u-p-0">${title}</h2><p class="sm u-p-0">${hint}</p>
    <div class="g2 u-mt-10">
      <div><label>${t('settings.preferences.name')}</label><input data-pn="${key}" value="${escapeHtml(place?.nombre ?? '')}" placeholder="${t('settings.preferences.namePlaceholder')}"></div>
      <div><label>${t('settings.preferences.address')}</label><input data-pd="${key}" value="${escapeHtml(place?.dir ?? '')}" placeholder="${t('settings.preferences.addressPlaceholder')}"></div>
    </div>
    <div class="sm u-mt-8" data-pe="${key}">${place?.lat
      ? located(escapeHtml(place.dir))
      : `<span class="u-warn">${t('settings.preferences.notLocated')}</span>`}</div>
    <div class="acts"><button class="btn sec" data-pg="${key}">${t('settings.preferences.findAddress')}</button>
      <button class="btn sec" data-pgps="${key}">${t('settings.preferences.useLocation')}</button></div></div>`;
}

const field = (box: HTMLElement, attribute: string, key: string): HTMLInputElement | null => box.querySelector<HTMLInputElement>(`[data-${attribute}="${key}"]`);
const status = (box: HTMLElement, key: string): HTMLElement | null => box.querySelector<HTMLElement>(`[data-pe="${key}"]`);

async function findAddress(box: HTMLElement, button: HTMLButtonElement): Promise<void> {
  const key = button.dataset.pg ?? '', address = field(box, 'pd', key)?.value.trim() ?? '';
  if (!address) { notices.toast(t('settings.preferences.writeAddress'), true); return; }
  button.disabled = true; button.textContent = t('settings.preferences.finding');
  try {
    const found = await (await fetch(searchUrl() + encodeURIComponent(address))).json() as { lat: string; lon: string; display_name: string }[];
    button.disabled = false; button.textContent = t('settings.preferences.findAddress');
    const first = found[0];
    if (!first) { notices.toast(t('settings.preferences.addressNotFound'), true); return; }
    button.dataset.lat = first.lat; button.dataset.lon = first.lon;
    const shown = status(box, key); if (shown) shown.innerHTML = located(escapeHtml(first.display_name.split(',').slice(0, SHOWN_ADDRESS_PARTS).join(',')));
    notices.toast(t('settings.preferences.addressFound'));
  } catch {
    button.disabled = false; button.textContent = t('settings.preferences.findAddress');
    notices.toast(t('settings.preferences.couldNotSearch'), true);
  }
}

function useLocation(box: HTMLElement, button: HTMLButtonElement): void {
  const key = button.dataset.pgps ?? '';
  if (!('geolocation' in navigator)) { notices.toast(t('settings.preferences.noLocationDevice'), true); return; }
  button.disabled = true; button.textContent = t('settings.preferences.locating');
  const done = (): void => { button.disabled = false; button.textContent = t('settings.preferences.useLocation'); };
  navigator.geolocation.getCurrentPosition(position => {
    done();
    const search = field(box, 'pg', key), address = field(box, 'pd', key), shown = status(box, key);
    if (search) { search.dataset.lat = position.coords.latitude.toFixed(GPS_DECIMALS); search.dataset.lon = position.coords.longitude.toFixed(GPS_DECIMALS); }
    if (address) address.value = t('settings.preferences.myLocation');
    if (shown) shown.innerHTML = located(t('settings.preferences.fromGps'));
    notices.toast(t('settings.preferences.locationTaken'));
  }, () => { done(); notices.toast(t('settings.preferences.couldNotLocate'), true); }, { enableHighAccuracy: true, timeout: GPS_TIMEOUT_MS });
}

const inputValue = (box: HTMLElement, attribute: string, key: string): string => field(box, attribute, key)?.value.trim() ?? '';

/** A coordinate just found, or the one saved before. */
const coordinate = (found: string | undefined, saved: number | null | undefined): number | null => (found ? Number(found) : saved ?? null);

/** What the card of `key` says now; the coordinates are kept while the address does not change. */
function readPlace(box: HTMLElement, key: string, fallback: Place | null): Place | null {
  const name = inputValue(box, 'pn', key), address = inputValue(box, 'pd', key);
  if (!address) return null;
  const found = box.querySelector<HTMLElement>(`[data-pg="${key}"]`)?.dataset ?? {}, before = settingsLegacy.place(key) ?? fallback;
  const kept = before?.dir === address ? before : null;
  return { nombre: name || address, dir: address, lat: coordinate(found.lat, kept?.lat), lon: coordinate(found.lon, kept?.lon) };
}

async function save(box: HTMLElement, button: HTMLButtonElement, start: Place, repaint: () => void): Promise<void> {
  const leaving = readPlace(box, KEYS.start, start), arriving = readPlace(box, KEYS.end, null);
  if (!leaving?.lat) { notices.toast(t('settings.preferences.locateStart'), true); return; }
  if (arriving && !arriving.lat) { notices.toast(t('settings.preferences.locateEnd'), true); return; }
  button.disabled = true; button.textContent = t('settings.preferences.saving');
  const preferences = { ...(settingsLegacy.user().preferencias ?? {}), salida: leaving, llegada: arriving };
  const { data, error } = await legacyDb().rpc<Record<string, unknown>>('guardar_preferencias', { p: preferences });
  button.disabled = false; button.textContent = t('settings.preferences.save');
  if (error) { notices.toast(t('settings.preferences.couldNotSave', { error: (error as { message?: string }).message ?? '' }), true); return; }
  settingsLegacy.setPreferences(data ?? preferences);
  notices.toast(t('settings.preferences.saved', { start: leaving.nombre, end: (arriving ?? leaving).nombre }));
  repaint();
}

/** Paints the two cards and the save button in the Configuración body. */
export function paintPlaces(box: HTMLElement, repaint: () => void): void {
  const start = settingsLegacy.place(KEYS.start) ?? { nombre: '', dir: '' }, end = settingsLegacy.place(KEYS.end);
  box.innerHTML = `
    <p class="sm">${t('settings.preferences.intro')}</p>
    <div class="cols">
      ${placeCard(KEYS.start, start, t('settings.preferences.startTitle'), t('settings.preferences.startHint'))}
      ${placeCard(KEYS.end, end, t('settings.preferences.endTitle'), t('settings.preferences.endHint'))}
    </div>
    <div class="acts u-end"><button class="btn" id="pfguardar">${t('settings.preferences.save')}</button></div>`;
  const navigatorSelect = document.getElementById('navsel') as HTMLSelectElement | null;
  if (navigatorSelect) navigatorSelect.onchange = (): void => { settingsLegacy.changeNavigator(navigatorSelect.value); };
  box.querySelectorAll<HTMLButtonElement>('[data-pg]').forEach(button => { button.onclick = (): void => { void findAddress(box, button); }; });
  box.querySelectorAll<HTMLButtonElement>('[data-pgps]').forEach(button => { button.onclick = (): void => { useLocation(box, button); }; });
  const saveButton = document.getElementById('pfguardar') as HTMLButtonElement | null;
  if (saveButton) saveButton.onclick = (): void => { void save(box, saveButton, start, repaint); };
}
