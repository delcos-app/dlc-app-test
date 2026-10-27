/**
 * «Tu semana»: the card beside «Tu día» with the seven days of the shown week (first appointments, blocked days, «⋯» menu) and
 * «Repartir la semana». Migrated from the legacy agSemanaLateralBase / agSemanaLateral (v2.392.0).
 */
import { appointments, cachedRpc, currentScreen, legacyAgenda, legacyAgendaParts } from '../../legacy/bridge';
import { t } from '../../i18n';
import { addDays, fromIsoDate, mondayOf, todayIso } from '../../services/dates';
import { formatShortDate } from '../../services/date-format';
import { escapeHtml } from '../../services/format';
import { orFallback, range } from '../../services/values';
import { weekLoads, withData } from './preload';
import { shareWeek } from './strip';
import { openDayMenu } from './day-menu';

const SHOWN_PER_DAY = 3, WEEK_DAYS = 7;

const timeOf = (item: RangeAppointment): string => String(item.hora ?? '');

function byDay(list: readonly RangeAppointment[]): Map<string, RangeAppointment[]> {
  const days = new Map<string, RangeAppointment[]>();
  list.filter(item => !appointments.isCancelled(item.estado)).forEach(item => { days.set(item.fecha, [...(days.get(item.fecha) ?? []), item]); });
  days.forEach(items => items.sort((first, second) => timeOf(first).localeCompare(timeOf(second))));
  return days;
}

interface DayContext { readonly today: string; readonly selected: string | null; readonly blocked: Readonly<Record<string, string>> }

function dayContent(items: readonly RangeAppointment[], blockedReason: string | undefined): string {
  const blocked = blockedReason ? `<span class="agslb">${escapeHtml(blockedReason)}</span>` : '';
  const shown = items.slice(0, SHOWN_PER_DAY).map(item => `<span class="agslx"><b>${escapeHtml(timeOf(item).slice(0, 5))}</b>${escapeHtml(orFallback(item.medico, item.nombre ?? ''))}</span>`).join('');
  const more = items.length > SHOWN_PER_DAY ? `<span class="agslv">${t('agenda.week.andMore', { count: items.length - SHOWN_PER_DAY })}</span>` : '';
  const free = !items.length && !blockedReason ? `<span class="agslv">${t('agenda.week.free')}</span>` : '';
  return blocked + shown + more + free;
}

function dayHtml(isoDate: string, items: readonly RangeAppointment[], context: DayContext): string {
  const date = fromIsoDate(isoDate), blockedReason = context.blocked[isoDate];
  const classes = ['agsld', isoDate === context.today ? 'hoy' : '', isoDate === context.selected ? 'sel' : '', blockedReason ? 'bloq' : ''].filter(Boolean).join(' ');
  const weekday = t('dates.weekdaysShort').split(',')[date.getDay()] ?? '';
  const menu = isoDate >= context.today
    ? `<button type="button" class="agslm" data-agslm="${isoDate}" aria-label="${t('agenda.week.dayOptions', { date: formatShortDate(isoDate) })}">⋯</button>` : '';
  // The «⋯» sits next to the day card, not inside it: a control inside another one is not reachable by assistive technology
  // (axe nested-interactive). The cell wraps both and the menu is placed over the card's last column as before.
  return `<div><div class="${classes}" data-agsl="${isoDate}" role="button" tabindex="0" aria-label="${t('agenda.week.seeDay', { date: formatShortDate(isoDate) })}">
        <span class="agslf">${date.getDate()}<small>${weekday}</small></span>
        <span class="agslc">${dayContent(items, blockedReason)}</span>
        <span></span></div>${menu}</div>`;
}

function bind(box: HTMLElement, blocked: Readonly<Record<string, string>>): void {
  box.querySelectorAll<HTMLElement>('[data-agslm]').forEach(button => {
    button.onclick = (event): void => { event.stopPropagation(); const day = button.dataset.agslm ?? ''; openDayMenu(button, day, Boolean(blocked[day])); };
  });
  box.querySelectorAll<HTMLElement>('[data-agsl]').forEach(day => {
    const show = (): void => { legacyAgenda.showDay(day.dataset.agsl ?? ''); };
    day.onclick = show;
    day.onkeydown = (event): void => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); show(); } };
  });
  const share = document.getElementById('agslrep'); if (share) share.onclick = (): void => { void shareWeek(); };
}

function sidebarBox(): HTMLElement | null {
  const existing = document.getElementById('agsemlat'); if (existing) return existing;
  document.getElementById('agcuerpo')?.insertAdjacentHTML('afterend', '<div class="card" id="agsemlat"></div>');
  return document.getElementById('agsemlat');
}

async function paint(): Promise<void> {
  if (currentScreen() !== 'agenda' || legacyAgendaParts.mode() !== 'dia') return;
  if (!document.getElementById('v-agenda')?.classList.contains('agcinta')) return;
  const box = sidebarBox(); if (!box) return;
  const today = todayIso(), selected = legacyAgenda.selectedDate(), monday = mondayOf(selected ?? today);
  const [result, blocked] = await Promise.all([
    cachedRpc<RangeAppointment[]>('agenda_rango', { p_desde: monday, p_hasta: addDays(monday, WEEK_DAYS - 1), p_usuario: legacyAgenda.userFilter() }, `agenda-${monday}`),
    legacyAgendaParts.blockedDays(monday, WEEK_DAYS),
  ]);
  if (!document.getElementById('agsemlat')) return;
  const days = range(WEEK_DAYS).map(index => addDays(monday, index)), perDay = byDay(result.data ?? []);
  const context: DayContext = { today, selected, blocked };
  box.innerHTML = `<h2>${t('agenda.week.title')}</h2><p class="sm agslnota">${t('agenda.week.hint')}</p>
    <div class="agsl">${days.map(day => dayHtml(day, perDay.get(day) ?? [], context)).join('')}</div>
    ${days.some(day => day >= today) ? `<div class="acts agslacts"><button type="button" class="btn sec" id="agslrep">${t('agenda.week.share')}</button></div>` : ''}`;
  bind(box, blocked);
}

/** Paints «Tu semana» (in the day view, after the week data is preloaded so it appears in one go). */
export function paintWeekSidebar(): Promise<void> {
  return legacyAgenda.isDayView() ? withData(weekLoads(legacyAgenda.selectedDate()), paint) : paint();
}
