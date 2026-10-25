/**
 * Step 2 of the route wizard, «Orden y horario»: the start and back times, the automatic order or the one changed with the arrows,
 * the hours (fixed by hand or computed) and the summary of stops, km and when it ends. Migrated from the legacy rnAuto and
 * rnPaso2 (v2.414.0).
 */
import { routesLegacy } from '../../legacy/routes-bridge';
import { notices, term, yourDayLegacy } from '../../legacy/bridge';
import { t } from '../../i18n';
import { formatMinutes } from '../../services/dates';
import { formatLongDate } from '../../services/date-format';
import { escapeHtml } from '../../services/format';
import { orFallback } from '../../services/values';
import { referenceDate, routeIcon, stepFooter, titleCase } from './model';
import { bestOrder, hoursOf, type RouteHour, type RouteHours } from './schedule';
import { currentDraft, unfix, wizardHooks } from './state';

/** Puts the route in the best order. */
export function bestOrderOf(draft: RouteDraft): void {
  draft.ms = bestOrder(draft.ms, referenceDate(draft.rep, draft.nombre), draft.salida, draft.vuelta);
  draft.ordenManual = false;
}

export const draftHours = (draft: RouteDraft, isoDate: string): RouteHours => hoursOf(draft.ms, isoDate, { start: draft.salida, back: draft.vuelta, fixed: draft.fijas });

/** The minutes of driving before a visit (not before the first one nor at the same place). */
const tripHtml = (row: RouteHour, index: number): string =>
  (index && !row.mismo && row.viaje ? `<div class="rntramo">${t('routes.order.minutes', { minutes: Math.round(row.viaje) })}</div>` : '');

/** Its warning or, without one, when the professional attends. */
const noteOf = (row: RouteHour): string => row.aviso || (row.ven?.length ? t('routes.order.attends', { hours: yourDayLegacy.windowsText(row.ven) }) : '');

function moveButtons(index: number, count: number): string {
  return `<button type="button" data-rnmv="-1|${index}" aria-label="${t('routes.order.up')}" ${index ? '' : 'disabled'}>${routeIcon('up')}</button><button type="button" data-rnmv="1|${index}" aria-label="${t('routes.order.down')}" ${index < count - 1 ? '' : 'disabled'}>${routeIcon('down')}</button>`;
}

function rowHtml(row: RouteHour, index: number, count: number): string {
  const note = noteOf(row);
  return `${tripHtml(row, index)}<div class="rnpar ${row.aviso ? 'aviso' : ''}">
          <span class="n">${index + 1}</span>
          <div class="tx"><b>${escapeHtml(row.m.nombre)}</b><span class="sm">${escapeHtml([row.m.centro_nombre, titleCase(row.m.municipio)].filter(Boolean).join(' · '))}</span>
            <span class="sm ${row.aviso ? 'rnav' : ''}">${escapeHtml(note)}</span></div>
          <div class="der"><button type="button" class="rnh ${row.fija ? 'fija' : ''}" data-rnh="${row.m.id}" title="${t(row.fija ? 'routes.order.fixedTitle' : 'routes.order.computedTitle')}">${row.fija ? routeIcon('clock') : '~'}${formatMinutes(row.ini)}</button>
            <span class="ops">${moveButtons(index, count)}
              <button type="button" data-rnx="${index}" aria-label="${t('routes.order.remove')}">${routeIcon('close')}</button></span></div></div>`;
}

function summaryHtml(draft: RouteDraft, hours: RouteHours): string {
  const stops = new Set(draft.ms.filter(member => member.lat !== null && member.lat !== undefined).map(member => `${String(member.lat)},${String(member.lon)}`)).size;
  return `<div class="rnresum"><div><b>${draft.ms.length}</b>${term('medico', { number: 'p' })}</div><div><b>${stops}</b>${t('routes.order.stops')}</div>
      <div><b>${Math.round(hours.km)} km</b>${t('routes.order.approx')}</div><div><b class="${hours.pasa ? 'rnmal' : ''}">${formatMinutes(hours.fin)}</b>${t('routes.order.finish')}${hours.pasa ? t('routes.order.pastBack') : ''}</div></div>`;
}

function stepHtml(draft: RouteDraft, isoDate: string, hours: RouteHours): string {
  const home = routesLegacy.start();
  return `<div class="rnb2"><div class="rnord">
      <div class="rnordcab"><div class="rnhor2"><label>${t('routes.order.leaveAt')} <input type="time" id="rnsal" value="${escapeHtml(draft.salida)}"></label><label>${t('routes.order.backBy')} <input type="time" id="rnvue" value="${escapeHtml(draft.vuelta)}" placeholder="${t('routes.order.noTime')}"></label>
        <span class="sm">${escapeHtml(t('routes.order.from', { place: orFallback(home.nombre, t('routes.order.yourStart')), date: formatLongDate(isoDate) }))}</span></div>
        <button class="btn sec" type="button" id="rnauto">${routeIcon('wand')} ${t(draft.ordenManual ? 'routes.order.backToAuto' : 'routes.order.auto')}</button></div>
      <p class="sm rnordtx">${t(draft.ordenManual ? 'routes.order.manualText' : 'routes.order.autoText')} ${t('routes.order.howTo')}</p>
      <div class="rnlst">${hours.filas.map((row, index) => rowHtml(row, index, hours.filas.length)).join('')}</div></div>
    ${summaryHtml(draft, hours)}</div>
    ${stepFooter(t('routes.order.mapNext'), `<button class="btn sec" type="button" id="rnant2">${t('routes.order.previous')}</button><button class="btn" type="button" id="rnsig2">${t('routes.order.nextStep')}</button>`)}`;
}

/** «Hora de la visita»: fix an hour, let the app compute it again, or cancel. */
async function chooseTime(draft: RouteDraft, row: RouteHour): Promise<void> {
  const id = row.m.id, attends = row.ven?.length ? t('routes.order.attendsShort', { hours: yourDayLegacy.windowsText(row.ven) }) : '';
  const option = await notices.choose(t('routes.order.timeTitle'), `${row.m.nombre}${attends ? ` · ${attends}` : ''}`,
    [{ k: 'no', t: t('routes.order.cancel'), cls: 'sec' }, ...(draft.fijas[id] ? [{ k: 'quitar', t: t('routes.order.letAppCompute'), cls: 'sec' }] : []), { k: 'fijar', t: t('routes.order.fixTime') }]);
  if (option === 'quitar') { unfix(draft, id); paintOrder(); return; }
  if (option !== 'fijar') return;
  const time = await routesLegacy.askField(t('routes.order.fixTimeTitle'), 'time', draft.fijas[id] ?? formatMinutes(row.ini), t('routes.order.timeLabel'));
  if (!time) return;
  draft.fijas[id] = time; paintOrder();
}

function bindTimes(draft: RouteDraft): void {
  const reorder = (): void => { if (!draft.ordenManual) bestOrderOf(draft); paintOrder(); };
  const start = document.getElementById('rnsal') as HTMLInputElement | null;
  if (start) start.onchange = (): void => { draft.salida = orFallback(start.value, '09:00'); reorder(); };
  const back = document.getElementById('rnvue') as HTMLInputElement | null;
  if (back) back.onchange = (): void => { draft.vuelta = back.value; reorder(); };
  const auto = document.getElementById('rnauto'); if (auto) auto.onclick = (): void => { bestOrderOf(draft); paintOrder(); };
}

function bindRows(box: HTMLElement, draft: RouteDraft, hours: RouteHours): void {
  box.querySelectorAll<HTMLElement>('[data-rnmv]').forEach(button => { button.onclick = (): void => {
    const [step = 0, index = 0] = (button.dataset.rnmv ?? '').split('|').map(Number), other = index + step;
    const first = draft.ms[index], second = draft.ms[other];
    if (first && second) { draft.ms[index] = second; draft.ms[other] = first; }
    draft.ordenManual = true; paintOrder();
  }; });
  box.querySelectorAll<HTMLElement>('[data-rnx]').forEach(button => { button.onclick = (): void => {
    const [removed] = draft.ms.splice(Number(button.dataset.rnx), 1);
    if (removed) unfix(draft, removed.id);
    if (!draft.ms.length) { draft.paso = 1; wizardHooks.repaint(); return; }
    paintOrder();
  }; });
  box.querySelectorAll<HTMLElement>('[data-rnh]').forEach(button => { button.onclick = (): void => {
    const row = hours.filas.find(item => item.m.id === button.dataset.rnh); if (row) void chooseTime(draft, row);
  }; });
}

/** Paints step 2 with the hours of the reference day. */
export function paintOrder(): void {
  const box = document.getElementById('rnpaso'), draft = currentDraft(); if (!box || !draft) return;
  const isoDate = referenceDate(draft.rep, draft.nombre), hours = draftHours(draft, isoDate);
  box.innerHTML = stepHtml(draft, isoDate, hours);
  bindTimes(draft);
  bindRows(box, draft, hours);
  const previous = document.getElementById('rnant2'); if (previous) previous.onclick = (): void => { draft.paso = 1; wizardHooks.repaint(); };
  const next = document.getElementById('rnsig2'); if (next) next.onclick = (): void => { draft.paso = 3; wizardHooks.repaint(); };
}
