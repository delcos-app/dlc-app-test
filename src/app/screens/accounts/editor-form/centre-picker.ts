/**
 * The centre of a consultation: the chosen centre's card, or a search with «Estoy aquí», «+ Centro nuevo» and the private
 * consultation. Choosing fills the consultation's hidden fields. Migrated from the legacy pintarCentroSel, listaCentros, cpPoner,
 * centroDesdeUbicacion, marcarUbicado and the [data-cp] MutationObserver of legado 064 (v2.419.0).
 */
import { callRpc, legacyDb } from '../../../legacy/bridge';
import { accountsEditorLegacy } from '../../../legacy/accounts2-bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { centreCard } from './centre-card';
import { centreForm } from './centre-form';
import { consultationField, fieldValue, markDirty, privateConsultation, type CentreData } from './model';

const SEARCH_WAIT_MS = 250, SEARCH_RADIUS_KM = 400, SEARCH_LIMIT = 8, METRES_IN_KM = 1000;
const CENTRE_FIELDS = ['centro_id', 'centro_nombre', 'direccion', 'municipio', 'cp', 'provincia'] as const;

/** Fills the consultation's hidden fields with a centre (or empties them). */
export function setCentre(box: HTMLElement, index: string, centre: CentreData | null): void {
  const set = (name: string, value: unknown): void => { const field = consultationField(box, index, name); if (field) field.value = value === null || value === undefined ? '' : String(value); };
  const keys: Record<(typeof CENTRE_FIELDS)[number], keyof CentreData> = { centro_id: 'id', centro_nombre: 'nombre', direccion: 'direccion', municipio: 'municipio', cp: 'cp', provincia: 'provincia' };
  CENTRE_FIELDS.forEach(name => { set(name, centre ? centre[keys[name]] ?? '' : ''); });
  set('lat', centre?.lat ?? ''); set('lon', centre?.lon ?? '');
  if (centre && centre.lat !== null && centre.lat !== undefined) box.dataset.lat = String(centre.lat); else delete box.dataset.lat;
  markDirty(box);
}

const distanceText = (metres: number): string => (metres < METRES_IN_KM ? `${metres} m` : `${(metres / METRES_IN_KM).toFixed(1)} km`);

function centreItem(centre: CentreData, key: number): string {
  const details = [centre.direccion, centre.municipio].filter(Boolean).join(' · ');
  const away = centre.metros !== null && centre.metros !== undefined ? t('accountsEditor.picker.away', { distance: distanceText(centre.metros) }) : '';
  const doctors = centre.medicos ? ` · ${t(centre.medicos === 1 ? 'accountsEditor.picker.oneDoctor' : 'accountsEditor.picker.doctors', { count: centre.medicos })}` : '';
  return `<button type="button" class="cpitem" data-k="${key}"><b>${escapeHtml(centre.nombre)}</b>
      <span class="sm">${escapeHtml(details)}${away}${doctors}</span></button>`;
}

/** A list of centres to choose from, with an optional last button (create the centre…). */
export function centreList(results: HTMLElement, list: readonly CentreData[], choose: (centre: CentreData) => void, extra?: { html: string; onClick: () => void }): void {
  results.innerHTML = list.map(centreItem).join('') + (list.length ? '' : `<div class="sm" style="padding:8px 2px">${t('accountsEditor.picker.none')}</div>`) + (extra?.html ?? '');
  results.querySelectorAll<HTMLElement>('[data-k]').forEach(button => { button.onclick = (): void => { const centre = list[Number(button.dataset.k)]; if (centre) choose(centre); }; });
  const last = results.querySelector<HTMLElement>('.cpnuevo'); if (last && extra) last.onclick = extra.onClick;
}

/** A new centre with the data of the map at the device location (the name, if the map knows it). */
export async function centreFromLocation(box: HTMLElement, index: string, lat: number, lon: number): Promise<void> {
  const found = await accountsEditorLegacy.reverseGeocode(lat, lon).catch(() => null), address = found?.address ?? {};
  const first = (...values: (string | undefined)[]): string => values.find(Boolean) ?? '';
  const name = first(found?.name, address.hospital, address.clinic, address.doctors, address.amenity, address.healthcare, address.building);
  centreForm(box, index, {
    nombre: name, direccion: [address.road, address.house_number].filter(Boolean).join(', '), cp: first(address.postcode),
    municipio: first(address.city, address.town, address.village, address.municipality).toUpperCase(),
    provincia: first(address.province, address.state_district, address.county).toUpperCase(), lat, lon,
  }, t(name ? 'accountsEditor.picker.fromLocation' : 'accountsEditor.picker.fromLocationNoName'));
}

/** The located point of a consultation (legado 044's «Buscar la dirección» and «Estoy aquí» use it). */
export function markLocated(box: HTMLElement, index: string, point: { lat: number; lon: number }, text: string): void {
  const set = (name: string, value: number): void => {
    let field = consultationField(box, index, name);
    if (!field) { field = Object.assign(document.createElement('input'), { type: 'hidden' }); field.dataset.cf = `${index}|${name}`; box.appendChild(field); }
    field.value = String(value);
  };
  set('lat', point.lat); set('lon', point.lon);
  const state = box.querySelector('.cubest');
  if (state) state.innerHTML = `<b class="u-ok">${t('accountsEditor.picker.located')}</b> ${escapeHtml(text)} <a href="https://www.openstreetmap.org/?mlat=${point.lat}&mlon=${point.lon}#map=18/${point.lat}/${point.lon}" target="_blank" rel="noopener">${t('accountsEditor.picker.seeOnMap')}</a>`;
  markDirty(box);
}

const chosenOf = (box: HTMLElement, index: string): CentreData => ({
  id: fieldValue(box, index, 'centro_id'), nombre: fieldValue(box, index, 'centro_nombre'), direccion: fieldValue(box, index, 'direccion'),
  municipio: fieldValue(box, index, 'municipio'), cp: fieldValue(box, index, 'cp'), lat: fieldValue(box, index, 'lat'), lon: fieldValue(box, index, 'lon'),
});

function bindCard(place: HTMLElement, box: HTMLElement, index: string, centre: CentreData): void {
  const change = place.querySelector<HTMLElement>('[data-cpcambiar]'); if (change) change.onclick = (): void => { void paintCentrePicker(box, index, 'buscar'); };
  const edit = place.querySelector<HTMLElement>('[data-cpeditar]'); if (edit) edit.onclick = (): void => { centreForm(box, index, centre); };
  const link = place.querySelector<HTMLElement>('[data-cpenlazar]');
  if (link) link.onclick = (): void => {
    void paintCentrePicker(box, index, 'buscar');
    const search = place.querySelector<HTMLInputElement>('.cpq'); if (search) { search.value = centre.nombre ?? ''; search.dispatchEvent(new Event('input')); }
  };
}

async function paintChosen(place: HTMLElement, box: HTMLElement, index: string): Promise<void> {
  let centre = chosenOf(box, index);
  place.innerHTML = centreCard(centre, Boolean(centre.id));
  if (centre.id) {   // the whole centre: phone, opening hours
    const { data } = await legacyDb().from<CentreData>('centros').select('id,nombre,direccion,municipio,cp,provincia,telefono,lat,lon,horario').eq('id', centre.id).maybeSingle();
    if (data && place.isConnected) { centre = data; place.innerHTML = centreCard(centre, true); }
  }
  bindCard(place, box, index, centre);
}

function searchHtml(): string {
  return `<div class="cpbus"><input class="cpq" type="search" placeholder="${t('accountsEditor.picker.searchPlaceholder')}" autocomplete="off">
      <div class="cpres"></div>
      <div class="acts u-m-8-0-0 u-wrap"><button type="button" class="btn sec" data-cpaqui>${t('accountsEditor.picker.imHere')}</button>
        <button type="button" class="btn sec" data-cpnuevo>${t('accountsEditor.picker.newCentre')}</button><button type="button" class="btn sec" data-cpprivada>${t('accountsEditor.picker.private', { privateConsultation: privateConsultation() })}</button></div></div>`;
}

function bindSearch(place: HTMLElement, box: HTMLElement, index: string): HTMLInputElement | null {
  const search = place.querySelector<HTMLInputElement>('.cpq'), results = place.querySelector<HTMLElement>('.cpres');
  if (!search || !results) return null;
  let timer: ReturnType<typeof setTimeout> | undefined, asked = 0;
  search.oninput = (): void => {
    clearTimeout(timer); const mine = ++asked, text = search.value.trim();
    if (text.length < 2) { results.innerHTML = ''; return; }
    timer = setTimeout(() => { void (async (): Promise<void> => {
      const { data } = await callRpc<CentreData[]>('buscar_centros', { p_q: text, p_lat: null, p_lon: null, p_radio: SEARCH_RADIUS_KM, p_lim: SEARCH_LIMIT });
      if (mine !== asked) return;
      centreList(results, data ?? [], centre => { setCentre(box, index, centre); void paintCentrePicker(box, index); },
        { html: `<button type="button" class="cpitem cpnuevo">${t('accountsEditor.picker.createNamed', { name: escapeHtml(text) })}</button>`, onClick: () => { centreForm(box, index, { nombre: text }); } });
    })(); }, SEARCH_WAIT_MS);
  };
  return search;
}

/** Paints the centre of consultation `index`: its card, or the search (`mode` 'buscar' forces the search). */
export async function paintCentrePicker(box: HTMLElement, index: string, mode?: string): Promise<void> {
  const place = box.querySelector<HTMLElement>(`[data-cp="${index}"]`); if (!place) return;
  place.dataset.listo = '1';
  if (mode !== 'buscar' && (fieldValue(box, index, 'centro_id') || fieldValue(box, index, 'centro_nombre'))) { await paintChosen(place, box, index); return; }
  place.innerHTML = searchHtml();
  const search = bindSearch(place, box, index);
  const on = (selector: string, action: (button: HTMLElement) => void): void => { const button = place.querySelector<HTMLElement>(selector); if (button) button.onclick = (): void => { action(button); }; };
  on('[data-cpnuevo]', () => { centreForm(box, index, { nombre: search?.value.trim() ?? '' }); });
  on('[data-cpprivada]', () => {
    setCentre(box, index, { nombre: privateConsultation('U') }); void paintCentrePicker(box, index);
    centreForm(box, index, { nombre: privateConsultation(), privada: true });
  });
  on('[data-cpaqui]', button => { accountsEditorLegacy.imHere(box, index, button); });
  if (mode === 'buscar') search?.focus();
}

/** Every consultation of the editor paints its centre once it is in the page. */
export function paintNewPickers(list: Element): void {
  [...list.children].forEach(box => {
    const index = (box as HTMLElement).dataset.cons ?? '', place = box.querySelector<HTMLElement>(`[data-cp="${index}"]`);
    if (place && !place.dataset.listo) void paintCentrePicker(box as HTMLElement, index);
  });
}
