/**
 * The private consultation (where a professional sees people without a centre: at home, an office…): address, postcode, town,
 * province and its point on the map (searching the address or «Estoy aquí»). Saved with the account, not as a shared centre.
 * Migrated from the legacy formPrivada (v2.419.0).
 */
import { notices, qualityLegacy } from '../../../legacy/bridge';
import { accountsEditorLegacy } from '../../../legacy/accounts2-bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { paintCentrePicker, setCentre } from './centre-picker';
import { fieldValue, privateConsultation } from './model';

const LOCATION_TIMEOUT_MS = 12000, LOCATION_MAX_AGE_MS = 30000, DECIMALS = 6;

interface PrivateContext { place: HTMLElement; box: HTMLElement; index: string; key: string; point: { lat: number | null; lon: number | null }; located: boolean; addressBefore: string }

const valueOf = (context: PrivateContext, suffix: string): string => ((document.getElementById(context.key + suffix) as HTMLInputElement | null)?.value ?? '').trim();
const inputOf = (context: PrivateContext, suffix: string): HTMLInputElement | null => document.getElementById(context.key + suffix) as HTMLInputElement | null;
const first = (...values: (string | undefined)[]): string => values.find(Boolean) ?? '';

function formHtml(box: HTMLElement, index: string, key: string, located: boolean): string {
  const value = (name: string): string => escapeHtml(fieldValue(box, index, name).trim());
  return `<div class="cpform cppriv">
    <div class="cpformcab"><b>${privateConsultation()}</b><span class="sm">${t('accountsEditor.private.hint')}</span></div>
    <div class="g2"><div><label for="${key}d">${t('accountsEditor.private.address')}</label><input id="${key}d" value="${value('direccion')}" placeholder="${t('accountsEditor.private.addressPlaceholder')}"></div>
      <div><label for="${key}c">${t('accountsEditor.centreForm.postcode')}</label><input id="${key}c" value="${value('cp')}" inputmode="numeric"></div></div>
    <div class="g2"><div><label for="${key}m">${t('accountsEditor.centreForm.town')}</label><input id="${key}m" value="${value('municipio')}"></div>
      <div><label for="${key}p">${t('accountsEditor.centreForm.province')}</label><input id="${key}p" value="${value('provincia')}"></div></div>
    <div class="cpubi sm">${located ? `<b class="u-ok">${t('accountsEditor.private.located')}</b>` : t('accountsEditor.centreForm.notLocated')}
      <button type="button" class="lnk" data-pvgeo>${t('accountsEditor.centreForm.findOnMap')}</button> <button type="button" class="lnk" data-pvaqui>${t('accountsEditor.picker.imHere')}</button></div>
    <div class="acts" style="justify-content:flex-end;margin:10px 0 0"><button type="button" class="btn sec" data-pvcancel>${t('common.cancel')}</button><button type="button" class="btn" data-pvok>${t('common.save')}</button></div></div>`;
}

function showLocated(context: PrivateContext, extra = ''): void {
  context.place.querySelector('.cpubi')?.firstChild?.replaceWith(Object.assign(document.createElement('b'), { style: 'color:var(--ok)', textContent: `${t('accountsEditor.private.located')} ${extra}` }));
}

/** Empty fields take what the map knows of the address. */
function fillFrom(context: PrivateContext, address: Record<string, string | undefined> | null | undefined): void {
  if (!address) return;
  const set = (suffix: string, text: string): void => { const field = inputOf(context, suffix); if (field && !field.value.trim()) field.value = text; };
  if (address.road) set('d', [address.road, address.house_number].filter(Boolean).join(', '));
  if (address.postcode) set('c', address.postcode);
  set('m', first(address.city, address.town, address.village, address.municipality).toUpperCase());
  set('p', first(address.province, address.state_district, address.county, address.state).toUpperCase());
}

async function search(context: PrivateContext, quiet: boolean): Promise<boolean> {
  const value = (suffix: string): string => valueOf(context, suffix);
  if (!value('d') && !value('m')) { if (!quiet) notices.toast(t('accountsEditor.centreForm.writeAddress'), true); return false; }
  const query = [value('d'), value('c'), value('m'), value('p'), 'España'].filter(Boolean).join(', ');
  const found = await qualityLegacy.geocode(query, { direccion: value('d'), municipio: value('m'), cp: value('c') }).catch(() => null);
  if (!found) { if (!quiet) notices.toast(t('accountsEditor.centreForm.notFound'), true); return false; }
  if (found.fuera) { notices.toast(t('accountsEditor.private.elsewhere', { place: found.fuera, town: value('m') }), true); return false; }
  context.point = { lat: Number(found.lat), lon: Number(found.lon) }; context.located = true;
  fillFrom(context, (found as { address?: Record<string, string | undefined> }).address); showLocated(context);
  return true;
}

async function here(context: PrivateContext, button: HTMLElement): Promise<void> {
  if (!('geolocation' in navigator)) { notices.toast(t('accountsEditor.private.noGeolocation'), true); return; }
  const text = button.textContent; button.textContent = t('accountsEditor.private.locating');
  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => { navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: LOCATION_TIMEOUT_MS, maximumAge: LOCATION_MAX_AGE_MS }); });
    const lat = Number(position.coords.latitude.toFixed(DECIMALS)), lon = Number(position.coords.longitude.toFixed(DECIMALS));
    context.point = { lat, lon }; context.located = true;
    const found = await accountsEditorLegacy.reverseGeocode(lat, lon); fillFrom(context, found?.address); showLocated(context, t('accountsEditor.private.withLocation'));
  } catch { notices.toast(t('accountsEditor.private.locationFailed'), true); } finally { button.textContent = text; }
}

async function accept(context: PrivateContext, button: HTMLButtonElement): Promise<void> {
  const value = (suffix: string): string => valueOf(context, suffix);
  if (!value('d') && !value('m')) { notices.toast(t('accountsEditor.private.writeTown'), true); inputOf(context, 'm')?.focus(); return; }
  // A changed address not located again is searched on the map (if not found, it is saved without a point)
  if ([value('d'), value('c'), value('m')].join('|') !== context.addressBefore && !context.located) {
    button.disabled = true; const found = await search(context, true); button.disabled = false;
    if (!found) context.point = { lat: null, lon: null };
  }
  setCentre(context.box, context.index, { nombre: t('accountsEditor.private.savedName'), direccion: value('d'), cp: value('c'), municipio: value('m').toUpperCase(), provincia: value('p').toUpperCase(), ...context.point });
  void paintCentrePicker(context.box, context.index);
  notices.toast(context.point.lat !== null ? t('accountsEditor.private.ready', { privateConsultation: privateConsultation() }) : t('accountsEditor.private.readyNoPoint'));
}

export function privateForm(box: HTMLElement, index: string): void {
  const place = box.querySelector<HTMLElement>(`[data-cp="${index}"]`); if (!place) return;
  const lat = fieldValue(box, index, 'lat').trim(), lon = fieldValue(box, index, 'lon').trim(), key = `pv${index}_`;
  const context: PrivateContext = {
    place, box, index, key, point: { lat: lat ? Number(lat) : null, lon: lon ? Number(lon) : null }, located: false,
    addressBefore: ['direccion', 'cp', 'municipio'].map(name => fieldValue(box, index, name).trim()).join('|'),
  };
  place.innerHTML = formHtml(box, index, key, Boolean(lat));
  const on = (selector: string, action: (button: HTMLButtonElement) => void): void => { const button = place.querySelector<HTMLButtonElement>(selector); if (button) button.onclick = (): void => { action(button); }; };
  on('[data-pvgeo]', button => { const text = button.textContent; button.textContent = t('accountsEditor.centreForm.searching'); void search(context, false).finally(() => { button.textContent = text; }); });
  on('[data-pvaqui]', button => { void here(context, button); });
  on('[data-pvcancel]', () => { void paintCentrePicker(box, index); });
  on('[data-pvok]', button => { void accept(context, button); });
  inputOf(context, fieldValue(box, index, 'direccion') ? 'd' : 'm')?.focus();
}
