/**
 * The calendar and the clock of date, month, time and date-and-time fields. Calendar: days, months and years (pressing the title),
 * «Hoy», «Mañana» and the keyboard. Clock: hours, minutes by the field's step, «Ahora», «Borrar» and «Aceptar». They open each
 * other (the date of a date-and-time field, «Cambiar día»). Migrated from abrirCalendario and abrirReloj in
 * componentes/selector_fecha.js (v2.416.0); both names stay as adapters.
 */
import { isMobile } from '../../legacy/bridge';
import { t } from '../../i18n';
import { addDays, toIsoDate, todayIso } from '../../services/dates';
import { orFallback, range } from '../../services/values';
import { attachPopup, kindOf, longDate, longMonths, mediumDate, newPopup, placePopup, setValue, shortMonths, twoDigits, type PickerKind, type PickerOptions, type PickerPopup } from './shared';

type View = 'dias' | 'meses' | 'anios';
const YEARS_SHOWN = 12, YEARS_BEFORE = 5;
const KEY_STEPS: Readonly<Record<string, number>> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };

interface Calendar {
  input: HTMLInputElement; options: PickerOptions; popup: PickerPopup; kind: PickerKind;
  shown: Date; focused: string; view: View; min: string | null; max: string | null; chosen: string; thisMonth: string;
}
interface Parts { head: string; body: string; foot: string }

const optional = (calendar: Calendar): string => (calendar.input.required ? '' : `<button type="button" data-cq="borrar">${t('components.datePicker.clear')}</button>`);
const outside = (value: string, min: string | null, max: string | null): boolean => (min !== null && value < min) || (max !== null && value > max);

function dayButton(calendar: Calendar, isoDate: string, day: number): string {
  const today = todayIso(), focused = isoDate === calendar.focused;
  return `<button type="button" data-cd="${isoDate}" class="${isoDate === calendar.chosen ? 'sel' : ''} ${isoDate === today ? 'hoy' : ''}" tabindex="${focused ? 0 : -1}" ${focused ? 'autofocus' : ''}
          aria-label="${longDate(isoDate)}" aria-pressed="${String(isoDate === calendar.chosen)}" ${outside(isoDate, calendar.min, calendar.max) ? 'disabled' : ''}>${day}</button>`;
}

function daysView(calendar: Calendar): Parts {
  const year = calendar.shown.getFullYear(), month = calendar.shown.getMonth();
  const gap = (new Date(year, month, 1).getDay() + 6) % 7, days = new Date(year, month + 1, 0).getDate();
  const cells = '<span></span>'.repeat(gap) + range(days).map(index => dayButton(calendar, `${year}-${twoDigits(month + 1)}-${twoDigits(index + 1)}`, index + 1)).join('');
  return {
    head: `<button type="button" data-cm="-1" aria-label="${t('components.datePicker.previousMonth')}">‹</button><button type="button" class="caltit" data-cv="meses" aria-label="${t('components.datePicker.chooseMonthYear')}">${longMonths()[month] ?? ''} ${year}</button><button type="button" data-cm="1" aria-label="${t('components.datePicker.nextMonth')}">›</button>`,
    body: `<div class="calg">${t('dates.weekdayLetters').split(',').map(letter => `<i>${letter}</i>`).join('')}${cells}</div>`,
    foot: `<button type="button" data-cq="hoy">${t('components.datePicker.today')}</button><button type="button" data-cq="manana">${t('components.datePicker.tomorrow')}</button>${optional(calendar)}`,
  };
}

function monthsView(calendar: Calendar): Parts {
  const year = calendar.shown.getFullYear(), short = shortMonths(), min = calendar.min?.slice(0, 7) ?? null, max = calendar.max?.slice(0, 7) ?? null;
  const months = longMonths().map((name, index) => {
    const key = `${year}-${twoDigits(index + 1)}`;
    return `<button type="button" data-cmes="${index}" class="${key === calendar.chosen.slice(0, 7) ? 'sel' : ''} ${key === calendar.thisMonth ? 'hoy' : ''}" aria-label="${t('components.datePicker.monthOf', { month: name, year })}" ${outside(key, min, max) ? 'disabled' : ''}>${short[index] ?? ''}</button>`;
  }).join('');
  return {
    head: `<button type="button" data-cy="-1" aria-label="${t('components.datePicker.previousYear')}">‹</button><button type="button" class="caltit" data-cv="anios" aria-label="${t('components.datePicker.chooseYear')}">${year}</button><button type="button" data-cy="1" aria-label="${t('components.datePicker.nextYear')}">›</button>`,
    body: `<div class="calm">${months}</div>`,
    foot: calendar.kind === 'mes' ? `<button type="button" data-cq="estemes">${t('components.datePicker.thisMonth')}</button>${optional(calendar)}` : '',
  };
}

function yearsView(calendar: Calendar): Parts {
  const first = calendar.shown.getFullYear() - YEARS_BEFORE;
  const years = range(YEARS_SHOWN).map(index => first + index).map(year => `<button type="button" data-canio="${year}" class="${String(year) === calendar.chosen.slice(0, 4) ? 'sel' : ''} ${String(year) === calendar.thisMonth.slice(0, 4) ? 'hoy' : ''}">${year}</button>`).join('');
  return {
    head: `<button type="button" data-cy="-12" aria-label="${t('components.datePicker.previousYears')}">‹</button><b>${first} – ${first + YEARS_SHOWN - 1}</b><button type="button" data-cy="12" aria-label="${t('components.datePicker.nextYears')}">›</button>`,
    body: `<div class="calm">${years}</div>`, foot: '',
  };
}

function paint(calendar: Calendar): void {
  const parts = calendar.view === 'dias' ? daysView(calendar) : calendar.view === 'meses' ? monthsView(calendar) : yearsView(calendar);
  calendar.popup.innerHTML = `<div class="calh">${parts.head}</div>${parts.body}${parts.foot ? `<div class="calp">${parts.foot}</div>` : ''}`;
  placePopup(calendar.popup, calendar.input);
  if (isMobile() || calendar.view !== 'dias') return;
  const button = calendar.popup.querySelector<HTMLElement>(`[data-cd="${calendar.focused}"]`);
  if ((button && calendar.popup.contains(document.activeElement)) || calendar.options.teclado) button?.focus({ preventScroll: true });
}

function pick(calendar: Calendar, isoDate: string): void {
  if (calendar.kind === 'fechahora') { openClock(calendar.input, { fecha: isoDate, desdeCal: true, mismo: true }); return; }
  setValue(calendar.input, isoDate, true);
}

function quick(calendar: Calendar, action: string | undefined): void {
  if (action === 'hoy') pick(calendar, todayIso());
  else if (action === 'manana') pick(calendar, addDays(todayIso(), 1));
  else if (action === 'estemes') setValue(calendar.input, calendar.thisMonth);
  else if (action === 'borrar') setValue(calendar.input, '');
}

function move(calendar: Calendar, data: DOMStringMap): boolean {
  const { shown } = calendar;
  if (data.cm) calendar.shown = new Date(shown.getFullYear(), shown.getMonth() + Number(data.cm), 1);
  else if (data.cy) calendar.shown = new Date(shown.getFullYear() + Number(data.cy), shown.getMonth(), 1);
  else if (data.cv) calendar.view = data.cv as View;
  else if (data.canio) { calendar.shown = new Date(Number(data.canio), shown.getMonth(), 1); calendar.view = 'meses'; }
  else return false;
  paint(calendar); return true;
}

function onClick(calendar: Calendar, event: MouseEvent): void {
  event.stopPropagation();
  const button = (event.target as Element).closest('button'); if (!button || button.disabled) return;
  const data = button.dataset;
  if (data.cd) { pick(calendar, data.cd); return; }
  if (move(calendar, data)) return;
  if (data.cmes !== undefined) {
    const shown = calendar.shown;
    if (calendar.kind === 'mes') { setValue(calendar.input, `${shown.getFullYear()}-${twoDigits(Number(data.cmes) + 1)}`); return; }
    calendar.shown = new Date(shown.getFullYear(), Number(data.cmes), 1); calendar.view = 'dias'; paint(calendar); return;
  }
  quick(calendar, data.cq);
}

/** Arrows day by day and week by week, Page Up / Page Down month by month, Home / End of the week. */
function onKey(calendar: Calendar, event: KeyboardEvent): void {
  if (calendar.view !== 'dias') return;
  const step = KEY_STEPS[event.key], date = new Date(`${calendar.focused}T12:00:00`);
  if (step) date.setDate(date.getDate() + step);
  else if (event.key === 'PageUp' || event.key === 'PageDown') date.setMonth(date.getMonth() + (event.key === 'PageUp' ? -1 : 1));
  else if (event.key === 'Home') date.setDate(date.getDate() - (date.getDay() + 6) % 7);
  else if (event.key === 'End') date.setDate(date.getDate() + (6 - (date.getDay() + 6) % 7));
  else return;
  event.preventDefault();
  calendar.focused = toIsoDate(date); calendar.shown = new Date(date.getFullYear(), date.getMonth(), 1); calendar.options.teclado = true; paint(calendar);
}

function startOf(input: HTMLInputElement, kind: PickerKind, options: PickerOptions): string {
  const value = input.value || '';
  if (options.fecha) return options.fecha;
  if (kind === 'mes') return value ? `${value}-01` : '';
  return value.slice(0, 10);
}

/** Opens the calendar of `input` (a date, a month, or the date of a date-and-time field). */
export function openCalendar(input: HTMLInputElement, options: PickerOptions = {}): void {
  const kind = kindOf(input), value = input.value || '', start = startOf(input, kind, options), size = kind === 'mes' ? 7 : 10;
  const popup = newPopup('selpop cal', t(kind === 'mes' ? 'components.datePicker.chooseMonth' : 'components.datePicker.chooseDate'), options.mismo);
  const calendar: Calendar = {
    input, options, popup, kind, shown: new Date(`${start || todayIso()}T12:00:00`), focused: start || todayIso(), view: kind === 'mes' ? 'meses' : 'dias',
    min: input.min.slice(0, size) || null, max: input.max.slice(0, size) || null, chosen: kind === 'mes' ? value.slice(0, 7) : value.slice(0, 10), thisMonth: todayIso().slice(0, 7),
  };
  popup.addEventListener('click', event => { onClick(calendar, event); });
  popup.addEventListener('keydown', event => { onKey(calendar, event); });
  attachPopup(popup, input); paint(calendar);
}

// ---------- Clock ----------

const DEFAULT_STEP = 5, MAX_STEP = 30, HOURS = 24, MINUTES_PER_HOUR = 60, SECONDS_PER_MINUTE = 60, DEFAULT_HOUR = 9;

interface Clock { input: HTMLInputElement; options: PickerOptions; popup: PickerPopup; kind: PickerKind; step: number; hour: number; minute: number }

/** Minutes step from the field's step in seconds: 5 unless it is 5–30 minutes. */
function stepOf(input: HTMLInputElement): number {
  const seconds = Number(input.step), minutes = seconds >= SECONDS_PER_MINUTE ? Math.round(seconds / SECONDS_PER_MINUTE) : DEFAULT_STEP;
  return [1, 2, 3, 4].includes(minutes) || minutes > MAX_STEP ? DEFAULT_STEP : minutes;
}

function paintClock(clock: Clock): void {
  const { hour, minute, input, options } = clock, minutes = range(Math.ceil(MINUTES_PER_HOUR / clock.step)).map(index => index * clock.step);
  clock.popup.innerHTML = `${options.fecha ? `<div class="rjfecha"><span>${mediumDate(options.fecha)}</span><button type="button" data-rq="dia">${t('components.datePicker.changeDay')}</button></div>` : ''}
      <div class="rjh"><b>${twoDigits(hour)}:${twoDigits(minute)}</b></div>
      <div class="rjt">${t('components.datePicker.hour')}</div><div class="rjg">${range(HOURS).map(index => `<button type="button" data-rh="${index}" class="${index === hour ? 'sel' : ''}" aria-pressed="${String(index === hour)}">${twoDigits(index)}</button>`).join('')}</div>
      <div class="rjt">${t('components.datePicker.minutes')}</div><div class="rjg m">${minutes.map(index => `<button type="button" data-rm="${index}" class="${index === minute ? 'sel' : ''}" aria-pressed="${String(index === minute)}">${twoDigits(index)}</button>`).join('')}</div>
      <div class="calp"><button type="button" data-rq="ahora">${t('components.datePicker.now')}</button>${input.required ? '' : `<button type="button" data-rq="borrar">${t('components.datePicker.clear')}</button>`}<button type="button" data-rq="ok" class="okb">${t('components.datePicker.accept')}</button></div>`;
  placePopup(clock.popup, input);
}

function finishClock(clock: Clock, action: string): void {
  const { input, options } = clock;
  if (action === 'dia') { openCalendar(input, { fecha: options.fecha, mismo: true }); return; }
  if (action === 'ahora') {
    const now = new Date();
    clock.hour = now.getHours(); clock.minute = Math.min(MINUTES_PER_HOUR - clock.step, Math.round(now.getMinutes() / clock.step) * clock.step); paintClock(clock); return;
  }
  const time = `${twoDigits(clock.hour)}:${twoDigits(clock.minute)}`;
  const day = orFallback(options.fecha, (input.value || todayIso()).slice(0, 10));
  setValue(input, action === 'borrar' ? '' : clock.kind === 'fechahora' ? `${day}T${time}` : time, true);
}

function onClockClick(clock: Clock, event: MouseEvent): void {
  event.stopPropagation();
  const target = event.target as Element;
  const hour = target.closest<HTMLElement>('[data-rh]'), minute = target.closest<HTMLElement>('[data-rm]'), action = target.closest<HTMLElement>('[data-rq]');
  if (hour) { clock.hour = Number(hour.dataset.rh); paintClock(clock); }
  if (minute) { clock.minute = Number(minute.dataset.rm); paintClock(clock); }
  if (action) finishClock(clock, action.dataset.rq ?? '');
}

/** The time shown when the clock opens: the field's, or 09:00. */
function initialTime(input: HTMLInputElement, kind: PickerKind): [number, number] {
  const current = kind === 'fechahora' ? input.value.slice(11, 16) : input.value;
  const [hour = NaN, minute = NaN] = (current || '09:00').split(':').map(Number);
  return [isNaN(hour) ? DEFAULT_HOUR : hour, isNaN(minute) ? 0 : minute];
}

/** Opens the clock of `input`; a month or date-and-time field opens the calendar first. */
export function openClock(input: HTMLInputElement, options: PickerOptions = {}): void {
  const kind = kindOf(input);
  if (!options.desdeCal && (kind === 'mes' || kind === 'fechahora')) { openCalendar(input); return; }
  const [hour, minute] = initialTime(input, kind);
  const popup = newPopup('selpop reloj', t('components.datePicker.chooseTime'), options.mismo);
  const clock: Clock = { input, options, popup, kind, step: stepOf(input), hour, minute };
  popup.addEventListener('click', event => { onClockClick(clock, event); });
  attachPopup(popup, input); paintClock(clock);
}
