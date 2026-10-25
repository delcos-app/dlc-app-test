/**
 * «Mi ficha» (or «Mi centro»): contact, how and when visits suit best, the places where they attend with a quick, flexible
 * timetable, and what is still needed. It is sent to their sales rep as a proposal. Migrated from the legacy pmPintarFicha,
 * pmConsulta, pmHorario, pmPintarCheck, pmBuscarCentro and pmEnviar (v2.413.0).
 */
import { callRpc, legacyDb, notices } from '../../legacy/bridge';
import { t, type MessageKey } from '../../i18n';
import { escapeHtml } from '../../services/format';
import { orFallback } from '../../services/values';
import { isValidRange, loadForm, readForm, timeOf } from './form-data';
import { helpButton, isCentre, portalState, shortDateTime, WEEKDAYS, words, type FoundCentre, type Place } from './model';

const SEARCH_WAIT_MS = 250, MIN_SEARCH = 2;
const HOW_OPTIONS: readonly MessageKey[] = ['portal.form.howBooked', 'portal.form.howEndOfDay', 'portal.form.howAnyGap', 'portal.form.howPhone', 'portal.form.howWriteFirst'];
const DAY_NAMES = new Map<string, MessageKey>([['L', 'portal.form.monday'], ['M', 'portal.form.tuesday'], ['X', 'portal.form.wednesday'], ['J', 'portal.form.thursday'], ['V', 'portal.form.friday'], ['S', 'portal.form.saturday']]);

function timetableDay(index: number, day: string, ranges: readonly [string, string][]): string {
  const rows = ranges.map((range, row) => `<span class="pmhf"><input data-pmhi="${index}|${day}|${row}|0" value="${escapeHtml(range[0])}" inputmode="numeric" maxlength="5" aria-label="${t('portal.form.from')}">
          <span>${t('portal.form.to')}</span><input data-pmhi="${index}|${day}|${row}|1" value="${escapeHtml(range[1])}" inputmode="numeric" maxlength="5" aria-label="${t('portal.form.until')}">
          <button type="button" class="pmhx" data-pmhx="${index}|${day}|${row}" aria-label="${t('portal.form.removeRange')}">✕</button></span>`).join('');
  return `<div class="pmhd ${ranges.length ? 'on' : ''}">
      <button type="button" class="pmhdia" data-pmhd="${index}|${day}" aria-pressed="${String(Boolean(ranges.length))}">${t(DAY_NAMES.get(day) ?? 'portal.form.monday')}</button>
      <div class="pmhr">${ranges.length ? `${rows}<button type="button" class="pmhmas" data-pmha="${index}|${day}">${t('portal.form.addRange')}</button>` : `<span class="sm">${t('portal.form.closed')}</span>`}</div></div>`;
}

/** The days that light up, several ranges per day and buttons to fill the marked days at once. */
function timetableHtml(days: Place['dias'], index: number): string {
  return `<div class="pmhz">
    <div class="pmhzpre"><span class="sm">${t('portal.form.fillMarked')}</span>
      <button type="button" class="chip" data-pmhp="${index}|m">${t('portal.form.fillMorning')}</button><button type="button" class="chip" data-pmhp="${index}|t">${t('portal.form.fillAfternoon')}</button>
      <button type="button" class="chip" data-pmhp="${index}|mt">${t('portal.form.fillBoth')}</button><button type="button" class="chip" data-pmhp="${index}|c">${t('portal.form.copyFirst')}</button></div>
    ${WEEKDAYS.map(day => timetableDay(index, day, days[day] ?? [])).join('')}</div>`;
}

const placeText = (place: Place, separator: string): string => [place.direccion, place.municipio].filter(Boolean).join(separator);

function placeHtml(place: Place, index: number): string {
  // Without a name (a new place), the name and address are written
  const isNew = (!place.centro_id && !place.ubicacion_id) || !String(place.nombre ?? '').trim();
  const head = isNew ? `<div class="g2 pmcnuevo"><div><label>${t('portal.form.placeName')}</label><input data-pmcf="${index}|nombre" value="${escapeHtml(place.nombre ?? '')}"></div>
        <div><label>${t('portal.form.placeAddress')}</label><input data-pmcf="${index}|direccion" value="${escapeHtml(placeText(place, ', '))}" placeholder="${t('portal.form.placeAddressPlaceholder')}"></div></div>`
    : `<div><b>${escapeHtml(orFallback(place.nombre, words().place))}</b><span class="sm">${escapeHtml(placeText(place, ' · '))}</span></div>`;
  return `<div class="pmc" data-pmc="${index}">
    <div class="pmccab">${head}
      <button type="button" class="btn sec chico pmcx" data-pmcx="${index}">${t('portal.form.remove')}</button></div>
    ${timetableHtml(place.dias, index)}</div>`;
}

const placesHtml = (places: readonly Place[]): string => places.map(placeHtml).join('') || `<p class="sm">${t('portal.form.noPlaces')}</p>`;

/** What is needed to remove the «faltan datos» notice, up to date as it is filled in. */
export function paintChecklist(): void {
  const box = document.getElementById('pmcheck'); if (!box || !portalState.form) return;
  try { readForm(); } catch { /* the form may be half painted */ }
  const form = portalState.form, phone = Boolean(form.telefono.trim()), how = Boolean(form.visitas.como.trim());
  const timetable = form.consultas.some(place => Object.values(place.dias).some(ranges => ranges.some(isValidRange)));
  const done = phone && how && timetable;
  box.classList.toggle('ok', done);
  box.innerHTML = `<b>${t(done ? 'portal.form.checkDone' : 'portal.form.checkTitle')}</b>
    <ul><li class="${phone ? 'ok' : ''}">${t('portal.form.checkPhone')}</li><li class="${timetable ? 'ok' : ''}">${t(isCentre() ? 'portal.form.checkTimetableCentre' : 'portal.form.checkTimetable')}</li><li class="${how ? 'ok' : ''}">${t('portal.form.checkHow', words())}</li></ul>
    <span class="sm">${t(done ? 'portal.form.checkDoneText' : 'portal.form.checkText')}</span>`;
}

/** Repaints the places after adding, removing or changing their hours. */
export function repaintPlaces(): void {
  const list = document.getElementById('pmclist');
  if (list && portalState.form) list.innerHTML = placesHtml(portalState.form.consultas);
  paintChecklist();
}

async function searchCentre(): Promise<void> {
  const input = document.getElementById('pmcq') as HTMLInputElement | null, box = document.getElementById('pmcres');
  if (!input || !box) return;
  const query = input.value.trim();
  if (query.length < MIN_SEARCH) { box.innerHTML = ''; return; }
  const { data } = await callRpc<FoundCentre[]>('portal_buscar_centros', { p_q: query });
  if (input.value.trim() !== query) return;
  portalState.found = Array.isArray(data) ? data : [];
  box.innerHTML = portalState.found.map((centre, index) => `<button type="button" data-pmcr="${index}"><b>${escapeHtml(centre.nombre)}</b><span class="sm">${escapeHtml([centre.direccion, centre.municipio].filter(Boolean).join(' · '))}</span></button>`).join('')
    + `<button type="button" data-pmcr="nuevo" class="pmcnew"><b>${t('portal.form.notFound', { query: escapeHtml(query) })}</b><span class="sm">${t('portal.form.notFoundText')}</span></button>`;
}

function stateText(): string {
  const proposal = portalState.proposal;
  if (!proposal) return t('portal.form.notSent');
  return proposal.estado === 'Pendiente' ? t('portal.form.sentOn', { date: shortDateTime(proposal.modificado_en ?? '') }) : t('portal.form.reviewed');
}

function contactCard(): string {
  const form = portalState.form, title = t('portal.form.contactTitle', words());
  if (!form) return '';
  const how = HOW_OPTIONS.map(key => `<option ${form.visitas.como === t(key) ? 'selected' : ''}>${escapeHtml(t(key))}</option>`).join('');
  return `<div class="card ancard pmcons pmcont"><h2>${title} ${helpButton(title, t('portal.form.contactHelp'))}</h2>
      <div class="pmcampos"><div><label for="pmtel">${t('portal.form.phone')} <span class="pmreq">${t('portal.form.required')}</span></label><input id="pmtel" inputmode="tel" value="${escapeHtml(form.telefono)}" placeholder="${t('portal.form.phonePlaceholder')}"></div>
        <div><label for="pmmail">${t('portal.form.email')}</label><input id="pmmail" type="email" value="${escapeHtml(form.email)}" placeholder="${t('portal.form.emailPlaceholder')}"></div>
        <div><label for="pmcomo">${t('portal.form.how', words())} <span class="pmreq">${t('portal.form.required')}</span></label><select id="pmcomo"><option value="">${t('portal.form.choose')}</option>${how}</select></div>
        <div><label for="pmmom">${t('portal.form.when')}</label><input id="pmmom" value="${escapeHtml(form.visitas.momento)}" placeholder="${t('portal.form.whenPlaceholder')}"></div>
        <div class="pmancho"><label for="pmnot">${t('portal.form.notes')}</label><textarea id="pmnot" rows="2" placeholder="${t('portal.form.notesPlaceholder')}">${escapeHtml(form.notas)}</textarea></div></div></div>`;
}

function placesCard(places: readonly Place[]): string {
  const title = t(isCentre() ? 'portal.form.placesTitleCentre' : 'portal.form.placesTitle');
  return `<div class="card ancard pmcons"><h2>${title} <span class="pmreq">${t('portal.form.placesRequired')}</span> ${helpButton(title, t('portal.form.placesHelp'))}</h2>
      <div id="pmclist" class="pmclist">${placesHtml(places)}</div>
      <div class="pmcadd"><input id="pmcq" type="search" placeholder="${t('portal.form.searchPlaceholder')}" aria-label="${t('portal.form.searchLabel')}"><div id="pmcres" class="pmcres"></div></div></div>`;
}

let searchTimer: ReturnType<typeof setTimeout> | undefined;

/** Paints «Mi ficha» from the form in memory. */
export function paintForm(): void {
  const box = document.getElementById('pmficha'), form = portalState.form;
  if (!box || !form) return;
  document.querySelectorAll<HTMLElement>('#v-informe [data-pmt=ficha] .pmtpunto').forEach(dot => { dot.hidden = !portalState.missing.length; });
  box.innerHTML = `
    <div class="pmcheck" id="pmcheck"></div>
    ${contactCard()}
    ${placesCard(form.consultas)}
    <div class="pmpie"><span class="sm" id="pmest">${escapeHtml(stateText())}</span><button type="button" class="btn" id="pmenviar">${t('portal.form.send')}</button></div>`;
  const search = document.getElementById('pmcq'); if (search) search.oninput = (): void => { clearTimeout(searchTimer); searchTimer = setTimeout(() => { void searchCentre(); }, SEARCH_WAIT_MS); };
  const send = document.getElementById('pmenviar') as HTMLButtonElement | null; if (send) send.onclick = (): void => { void sendForm(send); };
  box.addEventListener('input', paintChecklist); box.addEventListener('change', paintChecklist); paintChecklist();
}

function formProblem(places: readonly Place[]): string | null {
  const wrong = places.find(place => Object.values(place.dias).some(ranges => ranges.some(range => !isValidRange(range))));
  if (wrong) return t('portal.form.checkHours', { name: wrong.nombre ?? '' });
  return places.some(place => !String(place.nombre ?? '').trim()) ? t('portal.form.nameEachPlace') : null;
}

const proposalOf = (places: readonly Place[]): Place[] => places.map(place => ({
  centro_id: place.centro_id ?? null, ubicacion_id: place.ubicacion_id ?? null, nombre: place.nombre, direccion: place.direccion ?? '', municipio: place.municipio ?? '',
  dias: Object.fromEntries(Object.entries(place.dias).map(([day, ranges]) => [day, ranges.map(range => `${range[0]}-${range[1]}`).join(', ')])) as unknown as Place['dias'],
}));

async function sendForm(button: HTMLButtonElement): Promise<void> {
  readForm();
  const form = portalState.form; if (!form) return;
  const problem = formProblem(form.consultas);
  if (problem) { notices.toast(problem, true); return; }
  const data = { telefono: form.telefono, email: form.email, visitas: form.visitas, notas: form.notas, consultas: proposalOf(form.consultas) };
  button.disabled = true;
  const { data: result } = await legacyDb().rpc<{ ok?: boolean }>('portal_guardar_ficha', { p: data });
  button.disabled = false;
  if (!result?.ok) { notices.toast(t('portal.form.couldNotSend'), true); return; }
  notices.toast(t('portal.form.sent'));
  const { data: answer } = await callRpc<{ ok?: boolean }>('portal_mi_ficha', {}); if (answer?.ok) loadForm(answer);
  paintForm();
  const banner = document.querySelector('#mdcuerpo > .pmaviso'); if (banner && !portalState.missing.length) banner.remove();
}


function toggleDay(place: Place, day: string): void {
  // Turning a day on copies the hours of the first marked day
  if (place.dias[day]?.length) { Reflect.deleteProperty(place.dias, day); return; }
  const first = WEEKDAYS.find(other => place.dias[other]?.length);
  place.dias[day] = first ? (place.dias[first] ?? []).map(range => [...range] as [string, string]) : [['09:00', '14:00']];
}

const PRESETS = new Map<string, [string, string][]>([['m', [['09:00', '14:00']]], ['t', [['16:00', '20:00']]], ['mt', [['09:00', '14:00'], ['16:00', '20:00']]]]);

function fillDays(place: Place, preset: string): void {
  let days: string[] = WEEKDAYS.filter(day => place.dias[day]?.length);
  if (!days.length) days = ['L', 'M', 'X', 'J', 'V'];
  const ranges = PRESETS.get(preset) ?? place.dias[days[0] ?? ''] ?? [['09:00', '14:00']];
  days.forEach(day => { place.dias[day] = ranges.map(range => [...range] as [string, string]); });
}

function removeRange(place: Place, day: string, row: number): void {
  const ranges = place.dias[day]; if (!ranges) return;
  ranges.splice(row, 1); if (!ranges.length) Reflect.deleteProperty(place.dias, day);
}

function addRange(place: Place, day: string): void {
  const ranges = place.dias[day]; if (!ranges) return;
  const last = ranges[ranges.length - 1];
  ranges.push(last && last[1] < '15:00' ? ['16:00', '20:00'] : ['', '']);
}

function addFound(places: Place[], key: string): void {
  const centre = portalState.found[Number(key)], input = document.getElementById('pmcq') as HTMLInputElement | null;
  places.push(centre ? { centro_id: centre.id, nombre: centre.nombre, direccion: centre.direccion, municipio: centre.municipio, dias: {} } : { nombre: input?.value.trim() ?? '', direccion: '', dias: {} });
  if (input) input.value = '';
  const results = document.getElementById('pmcres'); if (results) results.innerHTML = '';
}

/** What each timetable button does: data-pmhd (day on or off), data-pmhp (fill), data-pmhx (remove range), data-pmha (add range). */
const TIMETABLE_ACTIONS: readonly (readonly [string, (place: Place, day: string, row: number) => void])[] = [
  ['pmhd', (place, day) => { toggleDay(place, day); }], ['pmhp', (place, preset) => { fillDays(place, preset); }],
  ['pmhx', (place, day, row) => { removeRange(place, day, row); }], ['pmha', (place, day) => { addRange(place, day); }],
];

function applyClick(button: HTMLElement, places: Place[]): void {
  const data = button.dataset;
  if (data.pmcx) { places.splice(Number(data.pmcx), 1); return; }
  if (data.pmcr) { addFound(places, data.pmcr); return; }
  const found = TIMETABLE_ACTIONS.find(([key]) => data[key]);
  if (!found) return;
  const [index = '', day = '', row = ''] = (data[found[0]] ?? '').split('|'), place = places[Number(index)];
  if (place) found[1](place, day, Number(row));
}

/** Buttons of the timetable and the places (one listener for the whole form), and hours tidied on leaving the field. */
export function listenToForm(): void {
  document.addEventListener('click', event => {
    const button = (event.target as Element | null)?.closest<HTMLElement>('#pmficha [data-pmhd], #pmficha [data-pmhp], #pmficha [data-pmhx], #pmficha [data-pmha], #pmficha [data-pmcx], #pmficha [data-pmcr]');
    if (!button || !portalState.form) return;
    readForm();
    applyClick(button, portalState.form.consultas);
    repaintPlaces();
  });
  document.addEventListener('focusout', event => {
    const input = (event.target as Element | null)?.closest<HTMLInputElement>('#pmficha [data-pmhi]');
    if (!input) return;
    const value = timeOf(input.value); if (value) input.value = value;
  });
}
