/**
 * The day strip of Agenda: two weeks of days with a dot per appointment, blocked days and their «⋯» menu, the month button and
 * «Ver la semana». Painted once with everything (the blocked days used to be added afterwards).
 * Migrated from the legacy agCintaBase / agCinta / agMenusCinta / agBotonSemana (v2.394.0).
 */
import { agendaSources, appointments, cachedRpc, currentScreen, icon, legacyAgenda, legacyAgendaParts, stripState } from '../../legacy/bridge';
import { t } from '../../i18n';
import { addDays, fromIsoDate, mondayOf, todayIso } from '../../services/dates';
import { capitalise, formatLongDate, formatMonthYear, monthNameOf } from '../../services/date-format';
import { escapeHtml } from '../../services/format';
import { range } from '../../services/values';
import { closeMonth, toggleMonth } from './month-calendar';
import { paintOpenWeek } from './open-week';
import { stripLoads, weekLoads, withData } from './preload';
import { openDayMenu } from './day-menu';

const STRIP_DAYS = 14, WEEK_DAYS = 7, MAX_DOTS = 6, DAY_MS = 864e5;

export const hasStrip = (): boolean => currentScreen() === 'agenda' && legacyAgendaParts.mode() === 'dia' && Boolean(document.getElementById('v-agenda'));

function weekTitle(monday: string, today: string): string {
  const weeks = Math.round((fromIsoDate(monday).getTime() - fromIsoDate(mondayOf(today)).getTime()) / DAY_MS / WEEK_DAYS);
  if (weeks === 0) return t('agenda.strip.thisWeek');
  if (weeks === 1) return t('agenda.strip.nextWeek');
  if (weeks === -1) return t('agenda.strip.lastWeek');
  return t('agenda.strip.weekOf', { day: fromIsoDate(monday).getDate(), month: monthNameOf(monday) });
}

interface StripContext { readonly today: string; readonly selected: string | null; readonly perDay: Map<string, RangeAppointment[]>; readonly blocked: Readonly<Record<string, string>> }

function dotKind(item: RangeAppointment, isoDate: string, today: string): string {
  if (!appointments.isOpen(item.estado)) return 'ch';
  return isoDate < today ? 'cx' : 'cp';
}

function dayButton(isoDate: string, context: StripContext): string {
  const { today, selected, perDay, blocked } = context;
  const items = perDay.get(isoDate) ?? [], date = fromIsoDate(isoDate), reason = blocked[isoDate];
  const dots = items.slice(0, MAX_DOTS).map(item => `<i class="${dotKind(item, isoDate, today)}"></i>`).join('') + (items.length > MAX_DOTS ? `<em>+${items.length - MAX_DOTS}</em>` : '');
  const count = t(items.length === 1 ? 'agenda.strip.oneAppointment' : 'agenda.strip.appointments', { count: items.length });
  const classes = ['cdia', isoDate === today ? 'hoy' : '', isoDate === selected ? 'sel' : '', [0, 6].includes(date.getDay()) ? 'finde' : '', reason ? 'bloq' : ''].filter(Boolean).join(' ');
  const options = isoDate >= today ? `<span class="cdmas" role="button" tabindex="0" aria-label="${t('agenda.strip.dayOptions')}" title="${t('agenda.strip.dayOptions')}">⋯</span>` : '';
  const letter = t('dates.weekdayLetters').split(',')[(date.getDay() + 6) % 7] ?? '';
  return `<button type="button" class="${classes}" data-cf="${isoDate}"${reason ? ` data-bloq="${escapeHtml(reason)}"` : ''} aria-label="${escapeHtml(formatLongDate(isoDate))}: ${count}" title="${count}">
      <span class="dn">${letter}</span><span class="dd">${date.getDate()}</span><span class="cpts">${dots || '<b></b>'}</span>${options}</button>`;
}

function weekButtonHtml(open: boolean): string {
  const label = t(open ? 'agenda.strip.hideWeek' : 'agenda.strip.showWeek');
  return `<button type="button" class="btn sec chico" id="cplan" title="${open ? label : t('agenda.strip.showWeekTitle')}" aria-expanded="${String(open)}">${icon('calendar-days')}<span>${label}</span></button>`;
}

function stripHtml(start: string, context: StripContext): string {
  const month = capitalise(formatMonthYear(addDays(start, 3)));
  const today = mondayOf(context.today) === start ? '' : `<button type="button" class="btn sec chico" id="choy">${t('agenda.strip.today')}</button>`;
  const weeks = [0, WEEK_DAYS].map(offset => `<div class="csem"><span class="csemt">${weekTitle(addDays(start, offset), context.today)}</span><div class="c7">${range(WEEK_DAYS).map(index => dayButton(addDays(start, offset + index), context)).join('')}</div></div>`).join('');
  return `<div class="cinta" id="agcinta" data-ini="${start}"><div class="ccab">
      <div class="cnav"><button type="button" class="kmv" data-cm="-7" aria-label="${t('agenda.strip.previousWeekNav')}" title="${t('agenda.strip.previousWeekNav')}">‹</button><button type="button" id="cmesb" class="cmesb" aria-expanded="false" title="${t('agenda.strip.seeMonth')}">${escapeHtml(month)} <span aria-hidden="true">▾</span></button><button type="button" class="kmv" data-cm="7" aria-label="${t('agenda.strip.nextWeekNav')}" title="${t('agenda.strip.nextWeekNav')}">›</button>${today}</div>
      <div class="cley" aria-hidden="true"><span><i class="ch"></i>${t('agenda.strip.done')}</span><span><i class="cp"></i>${t('agenda.strip.toDo')}</span><span><i class="cx"></i>${t('agenda.strip.notClosed')}</span></div>
      ${weekButtonHtml(stripState.weekOpen())}</div>
    <div class="csems">${weeks}</div></div>`;
}

function perDayOf(list: readonly RangeAppointment[], owner: string): Map<string, RangeAppointment[]> {
  const days = new Map<string, RangeAppointment[]>();
  list.filter(item => item.usuario_id === owner && !appointments.isCancelled(item.estado)).forEach(item => { days.set(item.fecha, [...(days.get(item.fecha) ?? []), item]); });
  return days;
}

/** «Ver la semana» / «Ocultar la semana»: says what is painted, and opens or closes the week under the strip. */
export function bindWeekButton(): void {
  const button = document.getElementById('cplan'); if (!button) return;
  const open = Boolean(document.getElementById('agsemexp')), label = t(open ? 'agenda.strip.hideWeek' : 'agenda.strip.showWeek');
  button.innerHTML = `${icon('calendar-days')}<span>${label}</span>`;
  button.title = open ? label : t('agenda.strip.showWeekTitle');
  button.setAttribute('aria-expanded', String(open));
  button.onclick = async (event): Promise<void> => {
    event.stopPropagation(); event.preventDefault();
    if (button.dataset.ocupado) return;
    button.dataset.ocupado = '1';
    stripState.setWeekOpen(!open);
    try { await paintOpenWeek(); } finally { delete button.dataset.ocupado; bindWeekButton(); }
  };
}

function bindDayOptions(strip: HTMLElement): void {
  strip.querySelectorAll<HTMLElement>('.cdmas').forEach(options => {
    const day = options.closest<HTMLElement>('[data-cf]');
    const open = (event: Event): void => { event.stopPropagation(); event.preventDefault(); openDayMenu(options, day?.dataset.cf ?? '', Boolean(day?.classList.contains('bloq'))); };
    options.addEventListener('click', open, true);
    options.addEventListener('keydown', event => { if (event.key === 'Enter') open(event); });
  });
}

function bind(strip: HTMLElement): void {
  strip.querySelectorAll<HTMLElement>('[data-cf]').forEach(day => {
    day.onclick = (): void => { closeMonth(); strip.querySelectorAll('.cdia').forEach(other => other.classList.toggle('sel', other === day)); legacyAgenda.showDay(day.dataset.cf ?? ''); };
  });
  strip.querySelectorAll<HTMLElement>('[data-cm]').forEach(arrow => {
    arrow.onclick = (): void => { stripState.setStart(addDays(stripState.start() ?? mondayOf(todayIso()), Number(arrow.dataset.cm))); void paintStrip(); };
  });
  const month = document.getElementById('cmesb'); if (month) month.onclick = (event): void => { event.stopPropagation(); void toggleMonth(); };
  const today = document.getElementById('choy'); if (today) today.onclick = (): void => { stripState.setStart(null); legacyAgenda.showDay(todayIso()); };
  bindDayOptions(strip);
}

async function render(): Promise<void> {
  if (!hasStrip() || !document.getElementById('agcuerpo')) return;
  const today = todayIso(), start = stripState.start() ?? mondayOf(legacyAgenda.selectedDate() ?? today), owner = agendaSources.ownerId();
  stripState.setStart(start);
  const end = addDays(start, STRIP_DAYS - 1);
  const [result, blocked] = await Promise.all([
    cachedRpc<RangeAppointment[]>('agenda_rango', { p_desde: start, p_hasta: end, p_usuario: owner }, `agenda-cinta-${owner}-${start}`),
    legacyAgendaParts.blockedDays(start, STRIP_DAYS),
  ]);
  const body = document.getElementById('agcuerpo');
  if (!hasStrip() || stripState.start() !== start || !body) return;
  const html = stripHtml(start, { today, selected: legacyAgenda.selectedDate(), perDay: perDayOf(result.data ?? [], owner), blocked });
  const old = document.getElementById('agcinta');
  if (old) old.outerHTML = html; else body.insertAdjacentHTML('beforebegin', html);
  const strip = document.getElementById('agcinta'); if (!strip) return;
  bind(strip);
  showSelectedWeek(strip, start);
}

/** On mobile the strip opens on the week of the selected day. */
function showSelectedWeek(strip: HTMLElement, start: string): void {
  const weeks = strip.querySelector('.csems'), selected = legacyAgenda.selectedDate();
  if (weeks && selected && selected >= addDays(start, WEEK_DAYS)) weeks.scrollLeft = weeks.scrollWidth;
}

/** Paints the strip (and the open week under it, if it is open) once their data is preloaded. */
export function paintStrip(): Promise<void> {
  if (!legacyAgenda.isDayView()) return Promise.resolve();
  if (!stripState.start()) stripState.setStart(mondayOf(legacyAgenda.selectedDate() ?? todayIso()));
  return withData([...stripLoads(), ...(stripState.weekOpen() ? weekLoads(legacyAgenda.selectedDate()) : [])], async () => {
    await render();
    if (!legacyAgenda.isDayView() || !document.getElementById('agcinta')) return;
    if (stripState.weekOpen()) await paintOpenWeek();
    bindWeekButton();
  });
}

/** Opens the week under the strip and starts «Repartir la semana». */
export async function shareWeek(): Promise<void> {
  stripState.setWeekOpen(true);
  await paintOpenWeek(); bindWeekButton();
  const plan = document.getElementById('semplan');
  if (plan) { document.getElementById('agsemexp')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); plan.click(); }
}
