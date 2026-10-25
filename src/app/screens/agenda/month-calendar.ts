/**
 * Month calendar of Agenda: the popover under «Mes» in the day strip, with the number of appointments per day, and the month and
 * year picker. Migrated from the legacy agPintarMes / agElegirMes / agMesPop / cerrarMesCinta (v2.390.0).
 */
import { cachedRpc, legacyAgenda } from '../../legacy/bridge';
import { t } from '../../i18n';
import { addDays, todayIso, toIsoDate } from '../../services/dates';
import { capitalise, formatMonth, formatShortDate, shortMonthNames } from '../../services/date-format';
import { escapeHtml } from '../../services/format';
import { orFallback, range } from '../../services/values';

/** Appointments in these states do not count in the calendar. */
const NOT_COUNTED = ['Descartada', 'Aplazada'];
const POPOVER_WIDTH = 380, PICKER_WIDTH = 280;

/** The month shown («2026-10»), kept while the user moves through months. */
let shownMonth: string | null = null;

const calendar = (): HTMLElement | null => document.getElementById('agmes');
const monthOf = (isoDate: string): string => isoDate.slice(0, 7);

function lastDayOf(month: string): string {
  const first = new Date(`${month}-01T12:00:00`);
  return addDays(toIsoDate(new Date(first.getFullYear(), first.getMonth() + 1, 1)), -1);
}

function shiftMonth(month: string, months: number): string {
  const date = new Date(`${month}-01T12:00:00`);
  date.setMonth(date.getMonth() + months);
  return monthOf(toIsoDate(date));
}

async function appointmentsPerDay(month: string): Promise<Map<string, number>> {
  const result = await cachedRpc<{ fecha: string; estado: string }[]>('agenda_rango',
    { p_desde: `${month}-01`, p_hasta: lastDayOf(month), p_usuario: legacyAgenda.userFilter() }, `agenda-mes-${month}`);
  const perDay = new Map<string, number>();
  (result.data ?? []).filter(item => !NOT_COUNTED.includes(item.estado)).forEach(item => { perDay.set(item.fecha, (perDay.get(item.fecha) ?? 0) + 1); });
  return perDay;
}

function dayCell(isoDate: string, count: number, today: string): string {
  const classes = ['agmc', isoDate === today ? 'hoy' : '', isoDate < today ? 'pasado' : '', count ? 'con' : ''].filter(Boolean).join(' ');
  const label = t('agenda.month.dayLabel', { date: formatShortDate(isoDate), count });
  return `<button type="button" class="${classes}" data-agdia="${isoDate}" aria-label="${label}">
        <span>${Number(isoDate.slice(8))}</span>${count ? `<i class="agpt">${count > 9 ? '9+' : count}</i>` : ''}</button>`;
}

function gridHtml(month: string, perDay: Map<string, number>): string {
  const today = todayIso(), first = new Date(`${month}-01T12:00:00`);
  const blanks = (first.getDay() + 6) % 7, days = Number(lastDayOf(month).slice(8));
  const header = t('dates.weekdayLetters').split(',').map(letter => `<span class="agmd">${letter}</span>`).join('');
  const cells = range(days).map(index => `${month}-${String(index + 1).padStart(2, '0')}`);
  return header + '<span></span>'.repeat(blanks) + cells.map(day => dayCell(day, perDay.get(day) ?? 0, today)).join('');
}

function headerHtml(month: string, current: string): string {
  return `<button type="button" class="kmv agmnav" data-agm="-1" aria-label="${t('agenda.month.previous')}">‹</button>
    <button type="button" class="agmtit" id="agmtit" aria-label="${t('agenda.month.choose')}">${escapeHtml(capitalise(formatMonth(month)))}</button>
    <button type="button" class="kmv agmnav" data-agm="1" aria-label="${t('agenda.month.next')}">›</button>
    ${month !== current ? `<button type="button" class="btn sec agmhoy" id="agmhoy">${t('agenda.month.today')}</button>` : ''}`;
}

function onClick(element: Element | null, action: () => void): void {
  if (element instanceof HTMLElement) element.onclick = (event): void => { event.stopPropagation(); action(); };
}

function bindHeader(box: HTMLElement, month: string, current: string): void {
  box.querySelectorAll<HTMLElement>('[data-agm]').forEach(button => { onClick(button, () => { void renderMonth(shiftMonth(month, Number(button.dataset.agm))); }); });
  onClick(document.getElementById('agmhoy'), () => { void renderMonth(current); });
  const title = document.getElementById('agmtit');
  onClick(title, () => { if (title) openMonthPicker(month, title); });
}

function bindDays(box: HTMLElement): void {
  const selected = legacyAgenda.selectedDate(), today = todayIso();
  box.querySelectorAll<HTMLElement>('.agmc[data-agdia]').forEach(button => {
    const day = button.dataset.agdia ?? '';
    button.classList.toggle('sel', day === selected && selected !== today);
    onClick(button, () => { legacyAgenda.showDay(day); });
  });
}

/** Paints `month` (the current one if empty). The grid is only fetched again when the month changes or `box.dataset.mes` is «-». */
export async function renderMonth(month?: string | null): Promise<void> {
  const box = calendar(); if (!box) return;
  const current = monthOf(todayIso()), target = month ?? current;
  shownMonth = target;
  if (orFallback(box.dataset.mes, current) !== target) {
    const perDay = await appointmentsPerDay(target);
    const fresh = calendar();
    if (shownMonth !== target || !fresh) return;
    fresh.dataset.mes = target;
    const grid = fresh.querySelector('.agmesgrid'); if (grid) grid.innerHTML = gridHtml(target, perDay);
  }
  const box2 = calendar(), header = box2?.querySelector<HTMLElement>('.fh');
  if (!box2 || !header) return;
  header.classList.add('agmesh');
  header.innerHTML = headerHtml(target, current);
  bindHeader(header, target, current);
  bindDays(box2);
}

/** Month and year picker, under the month title. */
function openMonthPicker(month: string, anchor: HTMLElement): void {
  document.querySelectorAll('.agmpop').forEach(element => { element.remove(); });
  let year = Number(month.slice(0, 4));
  const picker = document.createElement('div'); picker.className = 'agmpop';
  const names = shortMonthNames();
  const paint = (): void => {
    picker.innerHTML = `<div class="agmpoph"><button type="button" class="kmv" data-an="-1" aria-label="${t('agenda.month.previousYear')}">‹</button><b>${year}</b>
      <button type="button" class="kmv" data-an="1" aria-label="${t('agenda.month.nextYear')}">›</button></div>
      <div class="agmpopg">${names.map((name, index) => {
        const key = `${year}-${String(index + 1).padStart(2, '0')}`;
        return `<button type="button" data-mk="${key}" class="${key === month ? 'on' : ''}">${name}</button>`;
      }).join('')}</div>`;
    picker.querySelectorAll<HTMLElement>('[data-an]').forEach(button => { onClick(button, () => { year += Number(button.dataset.an); paint(); }); });
    picker.querySelectorAll<HTMLElement>('[data-mk]').forEach(button => { onClick(button, () => { picker.remove(); void renderMonth(button.dataset.mk); }); });
  };
  paint();
  document.body.appendChild(picker);
  const rect = anchor.getBoundingClientRect(), width = Math.min(PICKER_WIDTH, innerWidth - 20);
  picker.style.width = `${width}px`;
  picker.style.left = `${Math.max(10, Math.min(innerWidth - width - 10, rect.left + rect.width / 2 - width / 2))}px`;
  picker.style.top = `${Math.min(innerHeight - picker.offsetHeight - 10, rect.bottom + 6)}px`;
}

export function closeMonth(): void {
  calendar()?.classList.remove('pop');
  document.getElementById('cmesb')?.setAttribute('aria-expanded', 'false');
}

/** Opens the calendar already painted under the «Mes» button of the strip (or closes it if open). */
export async function toggleMonth(): Promise<void> {
  let box = calendar();
  if (box?.classList.contains('pop')) { closeMonth(); return; }
  if (!box) {
    document.getElementById('v-agenda')?.insertAdjacentHTML('beforeend', '<div class="card agmes" id="agmes"><div class="fh"></div><div class="agmesgrid"></div></div>');
    box = calendar();
  }
  if (!box) return;
  box.dataset.mes = '-';
  await renderMonth(shownMonth ?? monthOf(legacyAgenda.selectedDate() ?? todayIso()));
  const button = document.getElementById('cmesb'), opened = calendar();
  if (!button || !opened) return;
  opened.classList.add('pop'); button.setAttribute('aria-expanded', 'true');
  const rect = button.getBoundingClientRect(), width = Math.min(POPOVER_WIDTH, innerWidth - 32);
  Object.assign(opened.style, { top: `${Math.round(rect.bottom + 8)}px`, left: `${Math.round(Math.max(16, Math.min(rect.left, innerWidth - width - 16)))}px`, bottom: 'auto', right: 'auto' });
}

/** After a change in the agenda: the open calendar is fetched and painted again. */
export function refreshOpenMonth(): void {
  const box = calendar();
  if (!box?.classList.contains('pop')) return;
  box.dataset.mes = '-';
  void renderMonth(shownMonth);
}
