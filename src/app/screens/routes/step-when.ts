/**
 * Step 3 of the route wizard, «Vista previa y cuándo»: the day as it will be (timeline and map, by the streets if the route service
 * answers), when the route is done (one day, every week, every 15 days, once a month or without date) and saving it. Migrated from
 * the legacy rnRepHtml, rnPaso3 and rnGuardar (v2.414.0).
 */
import { routesLegacy } from '../../legacy/routes-bridge';
import { appLegacy, legacyDb, notices, term } from '../../legacy/bridge';
import { t, type MessageKey } from '../../i18n';
import { formatMinutes, todayIso } from '../../services/dates';
import { capitalise, formatLongDate, formatShortDate } from '../../services/date-format';
import { escapeHtml } from '../../services/format';
import { orFallback } from '../../services/values';
import { datesOf, hasLocation, horizonOf, referenceDate, stepFooter, titleCase, WEEKDAYS, weekdayShort, whenText } from './model';
import { newMap, paintLayers } from './map';
import { draftHours } from './step-order';
import { copyToAgenda } from './to-agenda';
import { currentDraft, routeName, wizardHooks } from './state';
import type { RouteHours } from './schedule';

const MAX_STREET_POINTS = 30, SHOWN_DATES = 4, WEEKS_OF_MONTH = 5;
const KINDS: readonly (readonly [string, MessageKey])[] = [['fecha', 'routes.preview.oneDay'], ['semanal', 'routes.preview.weekly'], ['quincenal', 'routes.preview.fortnightly'], ['mensual', 'routes.preview.monthly'], ['nada', 'routes.preview.noDate']];

function repeatDetailsHtml(repeat: RouteRepeat | null, kind: string): string {
  const day = repeat?.dia ?? 'L', nextDay = routesLegacy.nextWorkingDay();
  const date = kind === 'fecha' ? `<label for="rnfe">${t('routes.preview.day')}</label><input type="date" id="rnfe" value="${escapeHtml(orFallback(repeat?.fecha, nextDay))}" min="${todayIso()}">` : '';
  const days = ['semanal', 'quincenal', 'mensual'].includes(kind) ? `<div class="rndias2" role="group" aria-label="${t('routes.preview.weekday')}">${WEEKDAYS.map(letter => `<button type="button" data-rnd="${letter}" class="${letter === day ? 'on' : ''}">${weekdayShort(letter)}</button>`).join('')}</div>` : '';
  const weeks = t('routes.when.weeksOfMonth').split(','), week = Number(repeat?.semana ?? 1);
  const month = kind === 'mensual' ? `<label for="rnsem">${t('routes.preview.weekOfMonth')}</label><select id="rnsem">${weeks.slice(0, WEEKS_OF_MONTH).map((label, index) => `<option value="${index + 1}" ${week === index + 1 ? 'selected' : ''}>${label}</option>`).join('')}</select>` : '';
  const start = kind === 'quincenal' ? `<label for="rnde">${t('routes.preview.startingOn')}</label><input type="date" id="rnde" value="${escapeHtml(orFallback(repeat?.desde, nextDay))}" min="${todayIso()}">` : '';
  return date + days + month + start;
}

function repeatTextHtml(repeat: RouteRepeat | null): string {
  if (!repeat) return t('routes.preview.savedNoDate');
  const next = datesOf(repeat, todayIso(), horizonOf(repeat)).slice(0, SHOWN_DATES);
  return `${escapeHtml(whenText(repeat))}.${next.length ? t('routes.preview.nextDates', { dates: next.map(formatShortDate).join(', ') }) : ''}`;
}

/** «¿Cuándo la haces?» */
function repeatHtml(repeat: RouteRepeat | null): string {
  const kind = repeat ? repeat.tipo : 'nada';
  const options = KINDS.map(([key, label]) => `<button type="button" data-rnrt="${key}" class="${kind === key ? 'on' : ''}" aria-pressed="${String(kind === key)}">${t(label)}</button>`).join('');
  return `<div class="rncuando"><h3>${t('routes.preview.whenTitle')}</h3>
    <div class="segs rnrt" role="group" aria-label="${t('routes.preview.when')}">${options}</div>
    ${repeatDetailsHtml(repeat, kind)}
    <p class="sm rnrtx">${repeatTextHtml(repeat)}</p></div>`;
}

const dayTitle = (isoDate: string): string => t('routes.preview.dayTitle', { date: capitalise(formatLongDate(isoDate)) });

function timelineHtml(draft: RouteDraft, hours: RouteHours): string {
  const home = routesLegacy.start(), line = (time: string, text: string): string => `<div class="rntli viaje"><span class="h">${time}</span><span class="l"></span><span class="t">${text}</span></div>`;
  const rows = hours.filas.map((row, index) => `${index && !row.mismo && row.viaje ? line('', t('routes.preview.driving', { minutes: Math.round(row.viaje) })) : ''}
        <div class="rntli"><span class="h">${formatMinutes(row.ini)}</span><span class="l"><i></i></span><span class="t"><b>${index + 1}. ${escapeHtml(row.m.nombre)}</b><span class="sm">${escapeHtml(orFallback(row.m.centro_nombre, titleCase(row.m.municipio)))}${row.aviso ? ` · <span class="rnav">${escapeHtml(row.aviso)}</span>` : ''}</span></span></div>`).join('');
  return `${line(formatMinutes(routesLegacy.minutesOf(orFallback(draft.salida, '09:00')) ?? 0), t('routes.preview.leave', { place: escapeHtml(orFallback(home.nombre, t('routes.order.yourStart'))) }))}
      ${rows}
      ${line(formatMinutes(hours.fin), t('routes.preview.lastVisit', { visit: term('visita') }))}`;
}

const saveLabel = (draft: RouteDraft): string => t(draft.rep ? 'routes.preview.saveToAgenda' : 'routes.preview.saveChooseDay');

function stepHtml(draft: RouteDraft, isoDate: string): string {
  return `<div class="rnb3"><div class="rnmini"><div class="mc" id="rnmc"></div><div class="rnchip" id="rnchip">${t('routes.preview.calculating')}</div></div>
      <div class="rnlado"><div class="rntl"><h3 id="rntlh">${escapeHtml(dayTitle(isoDate))}</h3><div id="rntl"></div></div>${repeatHtml(draft.rep)}</div></div>
    ${stepFooter(t(draft.id ? 'routes.preview.savedKeepsAgenda' : 'routes.preview.savedInList'),
      `<button class="btn sec" type="button" id="rnant3">${t('routes.order.previous')}</button><button class="btn sec" type="button" id="rnguar">${t('routes.preview.save')}</button><button class="btn" type="button" id="rnguarag">${saveLabel(draft)}</button>`)}`;
}

function paintTimeline(draft: RouteDraft, hours: RouteHours): void {
  const box = document.getElementById('rntl'); if (box) box.innerHTML = timelineHtml(draft, hours);
}

/** The repeat chosen with a button of «¿Cuándo la haces?». */
function repeatOfKind(kind: string, current: RouteRepeat | null): RouteRepeat | null {
  const day = current?.dia ?? 'L', nextDay = routesLegacy.nextWorkingDay();
  if (kind === 'nada') return null;
  if (kind === 'fecha') return { tipo: 'fecha', fecha: orFallback(current?.fecha, nextDay) };
  if (kind === 'mensual') return { tipo: 'mensual', dia: day, semana: current?.semana ?? 1 };
  return { tipo: kind, dia: day, desde: orFallback(current?.desde, nextDay) };
}

/** After a change of «¿Cuándo la haces?»: the block, the timeline of its day, the proposed name and the save button. */
function repaintRepeat(box: HTMLElement, draft: RouteDraft): void {
  const block = box.querySelector('.rncuando'); if (block) block.outerHTML = repeatHtml(draft.rep);
  bindRepeat(box, draft);
  const isoDate = referenceDate(draft.rep, draft.nombre), title = document.getElementById('rntlh');
  if (title) title.textContent = dayTitle(isoDate);
  paintTimeline(draft, draftHours(draft, isoDate));
  const name = document.getElementById('rnnom') as HTMLInputElement | null; if (draft.auto && name) name.value = routeName(draft);
  const save = document.getElementById('rnguarag'); if (save) save.textContent = saveLabel(draft);
}

function bindRepeat(box: HTMLElement, draft: RouteDraft): void {
  const change = (repeat: RouteRepeat | null): void => { draft.rep = repeat; repaintRepeat(box, draft); };
  box.querySelectorAll<HTMLElement>('[data-rnrt]').forEach(button => { button.onclick = (): void => { change(repeatOfKind(button.dataset.rnrt ?? 'nada', draft.rep)); }; });
  box.querySelectorAll<HTMLElement>('[data-rnd]').forEach(button => { button.onclick = (): void => { change({ ...(draft.rep ?? { tipo: '' }), dia: button.dataset.rnd ?? 'L' }); }; });
  const input = (id: string): HTMLInputElement | null => document.getElementById(id) as HTMLInputElement | null;
  const date = input('rnfe'); if (date) date.onchange = (): void => { change({ tipo: 'fecha', fecha: date.value }); };
  const start = input('rnde'); if (start) start.onchange = (): void => { change({ ...(draft.rep ?? { tipo: '' }), desde: start.value }); };
  const week = input('rnsem'); if (week) week.onchange = (): void => { change({ ...(draft.rep ?? { tipo: '' }), semana: Number(week.value) }); };
  routesLegacy.improveFields(box);
}

/** The start point and the places of the members, without repeating a place right after itself ([lat, lon]). */
function previewPoints(draft: RouteDraft): [number, number][] {
  const home = routesLegacy.start();
  const all: [number, number][] = [...(home.lat !== null && home.lat !== undefined ? [[Number(home.lat), Number(home.lon)] as [number, number]] : []), ...draft.ms.filter(hasLocation).map(member => [Number(member.lat), Number(member.lon)] as [number, number])];
  return all.filter((point, index) => !index || point[0] !== all[index - 1]?.[0] || point[1] !== all[index - 1]?.[1]);
}

/** The map of step 3: in a straight line first and, if the route service answers, by the streets. */
async function paintPreviewMap(draft: RouteDraft, isoDate: string): Promise<void> {
  const element = document.getElementById('rnmc'); if (!element) return;
  const { library, map } = await newMap(element); if (!document.getElementById('rnmc')) return;
  const chip = (): HTMLElement | null => document.getElementById('rnchip'), points = previewPoints(draft);
  paintLayers(map, library, { members: draft.ms, line: points.map(([lat, lon]) => [lon, lat]) });
  const label = chip();
  if (points.length < 2 || points.length > MAX_STREET_POINTS) { if (label) label.textContent = t('routes.preview.straight'); return; }
  const result = await routesLegacy.streetRoute(points, `${isoDate}T${orFallback(draft.salida, '09:00')}:00`), shown = chip(); if (!shown) return;
  if (result.ok && result.tramos?.length === points.length - 1) {
    paintLayers(map, library, { members: draft.ms, line: result.tramos.flatMap(part => (part.linea ?? []).map(([lat, lon]) => [lon, lat] as [number, number])), fit: false });
    shown.innerHTML = t('routes.preview.streets', { km: String(result.km).replace('.', ','), duration: routesLegacy.durationText(result.min ?? 0) });
  } else shown.textContent = t('routes.preview.fallback', { reason: routesLegacy.reasonText(result.motivo) });
}

/** When the route changes, the agenda is looked at again from today: the repeat is saved without its end. */
const withoutEnd = (repeat: RouteRepeat): RouteRepeat => ({ tipo: repeat.tipo, ...Object.fromEntries(Object.entries(repeat).filter(([key]) => key !== 'hasta')) });

/** What is saved: the name, the members in order, the hours and when it repeats. */
function payloadOf(draft: RouteDraft): Omit<SavedRoute, 'id'> & { id?: string } {
  const nameInput = document.getElementById('rnnom') as HTMLInputElement | null, name = orFallback(nameInput?.value.trim(), routeName(draft));
  const payload: Omit<SavedRoute, 'id'> & { id?: string } = { nombre: name, codigos: draft.ms.map(member => member.id), reglas: null, salida: draft.salida || null, vuelta: draft.vuelta || null,
    repeticion: draft.rep ? withoutEnd(draft.rep) : null, fijas: Object.keys(draft.fijas).length ? draft.fijas : null, centros: draft.centros };
  if (draft.id) payload.id = draft.id;
  return payload;
}

/** Saves the route (and, with `toAgenda`, copies it to the agenda). */
async function save(toAgenda: boolean): Promise<void> {
  const draft = currentDraft(); if (!draft) return;
  const payload = payloadOf(draft);
  const buttons = ['rnguar', 'rnguarag'].map(id => document.getElementById(id) as HTMLButtonElement | null);
  buttons.forEach(button => { if (button) button.disabled = true; });
  const { data, error } = await legacyDb().rpc<{ ok?: boolean; id: string }>('guardar_ruta', { p: payload });
  buttons.forEach(button => { if (button) button.disabled = false; });
  if (error || !data?.ok) { notices.toast(error ? t('routes.preview.couldNotSaveError', { error: (error as { message?: string }).message ?? '' }) : t('routes.preview.couldNotSave'), true); return; }
  appLegacy.forgetCache();
  const members = draft.ms.slice();
  routesLegacy.setDraft(null);
  notices.toast(t('routes.preview.saved'));
  if (toAgenda) { await copyToAgenda({ r: { ...payload, id: data.id, mia: true }, ms: members }); return; }
  routesLegacy.reload();
}

/** Paints step 3 with the day of reference. */
export async function paintWhen(): Promise<void> {
  const box = document.getElementById('rnpaso'), draft = currentDraft(); if (!box || !draft) return;
  const isoDate = referenceDate(draft.rep, draft.nombre);
  box.innerHTML = stepHtml(draft, isoDate);
  paintTimeline(draft, draftHours(draft, isoDate));
  bindRepeat(box, draft);
  const previous = document.getElementById('rnant3'); if (previous) previous.onclick = (): void => { draft.paso = 2; wizardHooks.repaint(); };
  const saveOnly = document.getElementById('rnguar'); if (saveOnly) saveOnly.onclick = (): void => { void save(false); };
  const saveAndCopy = document.getElementById('rnguarag'); if (saveAndCopy) saveAndCopy.onclick = (): void => { void save(true); };
  await paintPreviewMap(draft, isoDate);
}
