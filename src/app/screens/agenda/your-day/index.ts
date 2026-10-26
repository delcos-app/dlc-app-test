/**
 * «Tu día»: the appointments of the shown day as cards, straight from the data, with its header, the «no cabe» banner, the
 * working day, the tasks and the appointments of other people; then «En este centro también», the trays, the traffic mark, the
 * visits queued on the phone and the tasks folding. Migrated from the legacy tdPintar / pintarTuDia(Base, Base2, Base3) /
 * tdMarcarPendientes / tdPlegarTareas / tdCompacto and the listeners of legado 091 and 125 (v2.397.0).
 * The day estimate and its stop information (estimarDia, TD_INFO) and the traffic stay in legacy: they are the route domain.
 */
import { agendaSources, agendaSuggestions, cachedRpc, commercialStates, legacyAgenda, legacyAgendaParts, term, yourDayLegacy } from '../../../legacy/bridge';
import { t } from '../../../i18n';
import { formatDuration, todayIso } from '../../../services/dates';
import { formatShortDate } from '../../../services/date-format';
import { isAbsent, isCancelled, isDone, isOpen, pointOf } from '../appointment-state';
import { refreshMetrics } from '../metrics';
import { applySuggestions, dayLoads, loadSuggestions, withData, type DaySuggestions } from '../preload';
import { paintSameCentre } from '../same-centre';
import { hasStrip } from '../strip';
import { paintTrayButtons } from '../trays';
import { appointmentCard, nextOf, type DayContext } from './card';
import { headerHtml, noFitHtml, othersHtml, setCompactButton, workingDayHtml, type DaySummary } from './header';
import { applyTaskFolding, paintTasks } from './tasks';
import { openDayMenu } from '../day-menu';
import { rescheduleAppointments } from '../reschedule';
import { activeWorkingDay, endWorkingDay, startWorkingDay } from '../working-day';
import { prepareRouteStops } from '../route-buttons';
import { markTraffic } from '../traffic';

const COMPACT_KEY = 'delcos-tdcompacto', DEFAULT_LIMIT = 21 * 60, WARNINGS_FOR_BANNER = 3;

function compact(): boolean {
  try { return localStorage.getItem(COMPACT_KEY) === '1'; } catch { return false; }
}

const applyCompact = (): void => { document.body.classList.toggle('tdcompacto', compact()); };

interface DayData { readonly day: string; readonly today: string; readonly mine: DayAppointmentFull[]; readonly others: DayAppointmentFull[] }

function buildContext(data: DayData, estimate: { est: Record<string, number>; fin: number; tope: number }): { context: DayContext; summary: DaySummary; noFit: Parameters<typeof noFitHtml>[0] } {
  const { day, today, mine } = data, isPast = day < today, info = yourDayLegacy.stopInfo();
  const open = mine.filter(item => isOpen(item.estado)), limit = Number.isFinite(estimate.tope) ? estimate.tope : DEFAULT_LIMIT;
  const warnings = Object.values(info).filter(stop => stop.aviso && !stop.lejos).length;
  const overLimit = !isPast && open.length > 0 && estimate.fin > limit, banner = !isPast && open.length > 0 && (overLimit || warnings >= WARNINGS_FOR_BANNER);
  const now = new Date().getHours() * 60 + new Date().getMinutes(), withPlace = open.filter(item => pointOf(item)).length;
  const viewed = legacyAgenda.viewedUserId(), visit = term('visita');
  const context: DayContext = {
    day, isPast, now, visit, estimates: estimate.est, info, open, next: day === today ? nextOf(open, estimate.est, now) : null,
    ladder: commercialStates.all().filter(step => step.papel !== 'negativo'), noFitBanner: banner, limit,
  };
  const summary: DaySummary = {
    isToday: day === today, isPast, isFutureOrToday: day >= today, mine: mine.length, active: mine.filter(item => !isCancelled(item.estado)).length,
    done: mine.filter(item => isDone(item.estado)).length, absent: mine.filter(item => isAbsent(item.estado)).length, open: open.length,
    end: estimate.fin, overReturn: open.length > 0 && estimate.fin > estimate.tope, withPlace, own: !viewed || agendaSources.isOwnAgenda(),
    isOwner: agendaSources.isOwnAgenda(), workingDay: activeWorkingDay(), compact: compact(), visit,
  };
  const outside = Object.values(info).filter(stop => stop.llegada !== null && stop.llegada !== undefined && stop.llegada >= limit).length;
  return { context, summary, noFit: { shown: banner, overLimit, end: estimate.fin, outside, canOrder: !isPast && withPlace > 1 } };
}

function on(id: string, action: (event: MouseEvent) => void): void {
  const button = document.getElementById(id); if (button) button.onclick = action;
}

function bindHeader(data: DayData, open: readonly DayAppointmentFull[]): void {
  on('tdempezar', () => { void startWorkingDay(); });
  on('tdterminar', () => { void endWorkingDay(); });
  on('tdrepro', () => { void rescheduleAppointments(open, t('agenda.yourDay.pendingOf', { date: formatShortDate(data.day) }), t('agenda.yourDay.notVisitedThatDay')); });
  on('tddiamas', event => {
    event.stopPropagation();
    const stripDay = document.querySelector(`#agcinta [data-cf="${data.day}"]`), button = document.getElementById('tddiamas');
    if (button) openDayMenu(button, data.day, Boolean(stripDay?.classList.contains('bloq')));
  });
}

/**
 * The cards of the day, or why there are none. v2.443.0: without network and without a copy of that day it says so (an empty day
 * would look like a day with no appointments).
 */
function cardsHtml(mine: readonly DayAppointmentFull[], context: DayContext, isToday: boolean, noCopy: boolean): string {
  if (noCopy) return `<div class="vacio">${t('agenda.yourDay.offlineNoCopy')}</div>`;
  if (!mine.length) return `<div class="vacio">${t(isToday ? 'agenda.yourDay.emptyToday' : 'agenda.yourDay.emptyOther')}</div>`;
  return `<div class="tdesc" role="group" aria-label="${t('agenda.yourDay.dayAppointments')}">${mine.map((item, index) => appointmentCard(item, index, context)).join('')}</div>`;
}

/** Paints the cards of the shown day (tdPintar). */
async function paintDay(): Promise<void> {
  const day = legacyAgenda.selectedDate() ?? todayIso(), today = todayIso();
  const result = await cachedRpc<DayAppointmentFull[]>('agenda_rango', { p_desde: day, p_hasta: day, p_usuario: legacyAgenda.userFilter() }, `agenda-${day}`);
  const body = document.getElementById('agcuerpo');
  if (legacyAgenda.selectedDate() !== day || legacyAgendaParts.mode() !== 'dia' || !body) return;
  const all = result.data ?? [], owner = agendaSources.ownerId();
  const data: DayData = { day, today, mine: all.filter(item => item.usuario_id === owner), others: all.filter(item => item.usuario_id !== owner) };
  yourDayLegacy.setDayAppointments(data.mine);
  const { context, summary, noFit } = buildContext(data, yourDayLegacy.estimateDay(data.mine, day));
  const cards = cardsHtml(data.mine, context, summary.isToday, !result.data && Boolean(result.cache));
  body.innerHTML = `${headerHtml(summary)}
    ${workingDayHtml(summary, summary.workingDay ? formatDuration(Date.now() - summary.workingDay.inicio) : '')}
    ${noFitHtml(noFit)}
    ${cards}
    ${othersHtml(data.others)}`;
  bindHeader(data, context.open);
  refreshMetrics();
  // The route buttons of the day (Empezar ruta / Ruta completa), also when the day changes
  prepareRouteStops(day);
  if (!summary.own) return;
  const tasks = await agendaSources.dayTasks(day) as DayTask[] | null;
  const fresh = document.getElementById('agcuerpo');
  if (legacyAgenda.selectedDate() === day && fresh) paintTasks(fresh, tasks);
}

/** The appointments whose visit is saved on the phone (offline queue): marked and without «Registrar». */
export function markQueuedVisits(): void {
  const day = legacyAgenda.selectedDate();
  const queued = yourDayLegacy.queuedVisits().filter(item => item.fn === 'registrar_actividad' && item.payload?.p?.fecha === day);
  const byId = new Map(legacyAgenda.dayAppointments().map(item => [String(item.id), item]));
  document.querySelectorAll<HTMLElement>('#agcuerpo .tdu[data-tdu]').forEach(card => {
    const item = byId.get(card.dataset.tdu ?? ''); if (!item) return;
    const pending = queued.some(entry => entry.payload?.p?.cuenta_id === item.cuenta_id);
    if (card.classList.contains('tdpend') !== pending) card.classList.toggle('tdpend', pending);
    const mark = card.querySelector('.tdpendm');
    if (pending && !mark) card.querySelector('.tdu-pie')?.insertAdjacentHTML('afterbegin', `<span class="tdpendm">${t('agenda.yourDay.queued')}</span>`);
    if (!pending && mark) mark.remove();
    card.querySelectorAll('[data-td^="visita|"]').forEach(button => { if (button.classList.contains('hide') !== pending) button.classList.toggle('hide', pending); });
  });
}

/** «Tu día» with its trays and «En este centro también», at once. */
export async function paintYourDay(): Promise<void> {
  if (hasStrip()) {
    const day = legacyAgenda.selectedDate() ?? todayIso(), current = agendaSuggestions.forDay();
    let suggestions: DaySuggestions | null = null;
    await withData([...dayLoads(day), current?.fecha === day ? null : loadSuggestions(day).then(found => { suggestions = found; })], async () => {
      if (legacyAgenda.selectedDate() !== day || !hasStrip()) return;
      applySuggestions(day, suggestions);
      await paintDay();
      if (legacyAgenda.isDayView()) { paintSameCentre(); paintTrayButtons(); }
    });
    if (hasStrip()) markTraffic();
    if (hasStrip()) markQueuedVisits();
  }
  applyTaskFolding();
}

/** The compact toggle and the «i» of a warning (one listener each for the whole app); the compact mode applies on start. */
export function listenToYourDay(): void {
  applyCompact();
  document.addEventListener('click', event => {
    const button = event.target instanceof Element ? event.target.closest<HTMLElement>('#tdcompactar') : null; if (!button) return;
    const value = !compact();
    try { localStorage.setItem(COMPACT_KEY, value ? '1' : '0'); } catch { /* not remembered */ }
    applyCompact(); setCompactButton(button, value);
  });
  document.addEventListener('click', event => {
    const button = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-tdavi]') : null; if (!button) return;
    event.stopPropagation();
    const info = yourDayLegacy.stopInfo()[button.dataset.tdavi ?? '']; if (!info) return;
    yourDayLegacy.showDialog(t('agenda.yourDay.whyWarning'), yourDayLegacy.explainWarning(info), t('agenda.yourDay.understood'));
  }, true);
}
