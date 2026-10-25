/**
 * The Agenda day view: mounts the screen (header, «Tu día», strip, «Tu semana») in one go after preloading everything, changes
 * the shown day, marks it («Volver a hoy») and refreshes the figures after a change.
 * Migrated from the legacy cargarAgenda / agCargarDia / agVerDia / agMarcarDia(Base) / agDiaVacio / agCifrasQuietas /
 * agRepartirSemana (v2.395.0). cargarAgenda and agVerDia stay in legacy as adapters (many callers and the tests use them).
 */
import { agendaState, callRpc, currentScreen, legacyAgenda, legacyAgendaPaint, legacyAgendaParts, permissions, salesTeam, stripState } from '../../legacy/bridge';
import { t } from '../../i18n';
import { addDays, mondayOf, todayIso } from '../../services/dates';
import { capitalise, formatLongDate } from '../../services/date-format';
import { escapeHtml } from '../../services/format';
import { metricsHtml, refreshMetrics, reloadMetrics } from './metrics';
import { closeMonth, refreshOpenMonth, toggleMonth } from './month-calendar';
import { applySuggestions, dayLoads, loadSuggestions, stripLoads, weekLoads, withData, type DaySuggestions } from './preload';
import { paintSameCentre } from './same-centre';
import { paintStrip, shareWeek } from './strip';
import { ensureTeamControls, loadTeamView } from './team';
import { paintTrayButtons, refreshOpenTray } from './trays';
import { paintWeekSidebar } from './week-sidebar';

const STRIP_DAYS = 14, SCROLL_MARGIN = 90, SCROLL_TOP_LIMIT = 80, SCROLL_BOTTOM_RATIO = 0.6;

const agendaView = (): HTMLElement | null => document.getElementById('v-agenda');
const dayBody = (): HTMLElement | null => document.getElementById('agcuerpo');

function titleText(): string {
  const viewed = agendaState.viewed();
  return t('agenda.todayTitle', { date: formatLongDate(todayIso()) }) + (viewed && legacyAgenda.isDayView() ? t('agenda.agendaOf', { name: viewed.nombre }) : '');
}

/** With no appointments the day figures hide; a past empty day says so. */
function markEmptyDay(): void {
  const body = dayBody(); if (!body || currentScreen() !== 'agenda') return;
  const empty = body.querySelector(':scope > .vacio'), stats = body.querySelector('.tdhead .tdstats');
  stats?.classList.toggle('hide', Boolean(empty) && !body.querySelector('.tdesc'));
  if (!empty) return;
  empty.classList.add('vlinea');
  const selected = legacyAgenda.selectedDate();
  if (selected && selected < todayIso()) empty.textContent = t('agenda.noAppointmentsThatDay');
}

/** The header says today; «Tu día» says the shown day and, if it is not today, offers «Volver a hoy». */
function markSelectedDay(): void {
  const view = agendaView(); if (!view?.classList.contains('agunida')) return;
  const today = todayIso(), selected = legacyAgenda.selectedDate();
  const title = document.getElementById('agtit'); if (title) title.textContent = titleText();
  const heading = view.querySelector('#agcuerpo .tdhead h2'); if (!heading) return;
  let back = document.getElementById('agahoy');
  if (!selected || selected === today) { back?.remove(); return; }
  heading.textContent = capitalise(formatLongDate(selected));
  back ??= addBackToToday(heading);
  if (back) putFirstOnMobile(view, back);
  heading.parentElement?.classList.add('agtitdia');
}

/** v2.338.0 (Eric): on mobile «Volver a hoy» goes before «+ Tarea», in the same row. */
function putFirstOnMobile(view: HTMLElement, back: HTMLElement): void {
  const actions = !matchMedia('(min-width: 761px)').matches && view.querySelector('#agcuerpo .tdhead .acts');
  if (actions && actions.firstElementChild !== back) actions.prepend(back);
}

function addBackToToday(heading: Element): HTMLElement | null {
  heading.insertAdjacentHTML('afterend', `<button type="button" class="btn sec" id="agahoy">${t('agenda.backToToday')}</button>`);
  const back = document.getElementById('agahoy');
  if (back) back.onclick = (): void => { void showDay(todayIso()); };
  return back;
}

function headerHtml(): string {
  return `
      <div class="saludo"><div><h1>${t('agenda.title')}</h1><div class="fecha" id="agtit">${escapeHtml(titleText())}</div></div>
        <div class="aghud" id="aghud" aria-label="${t('agenda.yourNumbers')}">${metricsHtml()}</div>
        <div class="acts u-m-0"><button class="btn" data-ag="nueva">${t('agenda.newAppointment')}</button></div></div>
      <div class="card" id="agcuerpo"></div>
      <div class="card" id="agsemlat"></div>`;
}

/** v2.273.0: after midnight an agenda left on «today» opens on the new today. */
function dayToShow(): string {
  const today = todayIso(), selected = legacyAgenda.selectedDate(), lastToday = agendaState.lastTodaySeen();
  const day = !selected || (selected === lastToday && lastToday !== today) ? today : selected;
  agendaState.setSelectedDate(day);
  if (day === today) agendaState.setLastTodaySeen(day);
  return day;
}

async function loadDayView(): Promise<void> {
  const view = agendaView(); if (!view) return;
  const day = dayToShow();
  agendaState.forgetDayTasks();
  stripState.setStart(mondayOf(day));   // v2.273.0: the week of the day on the left and the next one on the right
  view.dataset.listo = '';
  const scroll = scrollY, same = view.classList.contains('agn') && dayBody();
  if (same) dayBody()?.classList.add('agcargando');
  let suggestions: DaySuggestions | null = null, metrics: AgendaMetrics | null = null;
  await withData([...dayLoads(day), loadSuggestions(day).then(found => { suggestions = found; }),
    Promise.resolve(callRpc<AgendaMetrics>('agenda_metricas', { p_usuario: legacyAgenda.viewedUserId() })).then(result => { metrics = result.data; }),
    ...stripLoads(), ...weekLoads(day), permissions.seesEverything() && !salesTeam.members().length ? salesTeam.load() : null], async () => {
    if (legacyAgenda.selectedDate() !== day || currentScreen() !== 'agenda' || legacyAgendaParts.mode() !== 'dia') return;
    if (metrics) legacyAgenda.setMetrics(metrics);
    applySuggestions(day, suggestions);
    view.classList.add('agunida', 'agcinta', 'agb', 'agn');
    view.innerHTML = headerHtml();
    ensureTeamControls();
    await Promise.all([legacyAgendaPaint.yourDay(), paintStrip(), paintWeekSidebar()]);
    markSelectedDay(); markEmptyDay();
    if (!agendaState.viewed()) legacyAgendaPaint.noStartWarning(dayBody());
    if (same) window.scrollTo(0, scroll);
    view.dataset.listo = '1';
    // A tray left open (e.g. after «Mover a hoy») shows the new data
    refreshOpenTray();
  });
}

/** Shows Agenda: the team view, or the day view (with the week or the month open if they were asked for). */
export async function loadAgenda(): Promise<void> {
  if (currentScreen() !== 'agenda' || !agendaView()) return;
  const mode = legacyAgendaParts.mode();
  if (mode === 'equipo') { await loadTeamView(); return; }
  const plan = agendaState.takeWeekPlanRequest();
  if (mode === 'semana') stripState.setWeekOpen(true);
  agendaState.setMode('dia');
  await loadDayView();
  if (mode === 'mes') void toggleMonth();
  if (plan) void shareWeek();
}

function scrollToDay(): void {
  const body = dayBody(); if (!body) return;
  const top = body.getBoundingClientRect().top;
  if (top < SCROLL_TOP_LIMIT || top > innerHeight * SCROLL_BOTTOM_RATIO) scrollTo({ top: scrollY + top - SCROLL_MARGIN, behavior: 'smooth' });
}

/** Another day: «Tu día», trays, strip, «Tu semana» and the open week change at once. */
export async function showDay(day: string): Promise<void> {
  document.querySelectorAll('.agpop').forEach(element => { element.remove(); });
  closeMonth();
  if (!day) return;
  if (!legacyAgenda.isDayView()) { agendaState.setMode('dia'); agendaState.setSelectedDate(day); await loadAgenda(); return; }
  const before = legacyAgenda.selectedDate() ?? day, start = stripState.start();
  agendaState.setSelectedDate(day);
  dayBody()?.classList.add('agcargando');
  const outside = !start || day < start || day > addDays(start, STRIP_DAYS - 1);
  if (outside) stripState.setStart(mondayOf(day));
  const otherWeek = mondayOf(day) !== mondayOf(before);
  let suggestions: DaySuggestions | null = null;
  try {
    await withData([...dayLoads(day), loadSuggestions(day).then(found => { suggestions = found; }), ...(outside ? stripLoads() : []), ...weekLoads(day)], async () => {
      if (legacyAgenda.selectedDate() !== day || !legacyAgenda.isDayView()) return;
      applySuggestions(day, suggestions);
      const pieces = [legacyAgendaPaint.yourDay(), paintWeekSidebar()];
      if (outside || (otherWeek && stripState.weekOpen())) pieces.push(paintStrip());
      await Promise.all(pieces);
      if (!outside) document.querySelectorAll<HTMLElement>('#agcinta .cdia').forEach(element => { element.classList.toggle('sel', element.dataset.cf === day); });
      markSelectedDay(); markEmptyDay(); refreshMetrics();
    });
  } finally { dayBody()?.classList.remove('agcargando'); }
  if (legacyAgenda.selectedDate() === day) scrollToDay();
}

/** After a change (move, record, notes…): figures, strip, «Tu semana», trays and the open month, at once. */
export function refreshAfterChange(): void {
  if (!legacyAgenda.isDayView()) return;
  const day = legacyAgenda.selectedDate() ?? todayIso();
  let suggestions: DaySuggestions | null = null;
  void reloadMetrics();
  void withData([...stripLoads(), ...weekLoads(day), loadSuggestions(day).then(found => { suggestions = found; })], async () => {
    if (legacyAgenda.selectedDate() !== day || !legacyAgenda.isDayView()) return;
    applySuggestions(day, suggestions);
    await Promise.all([paintStrip(), paintWeekSidebar()]);
    paintSameCentre(); paintTrayButtons();
  });
  refreshOpenMonth();
}
