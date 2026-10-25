/**
 * Dates, periods and calendar words shared by every screen, always in local time (Spain). Migrated from the legacy
 * servicios/fechas.js (v2.425.0); the legacy names (hoyISO, isoLocal, rangoPeriodo, fechaCorta…) stay as adapters.
 */
import { coreLegacy } from '../legacy/core-bridge';
import { t } from '../i18n';
import { LOCALES } from '../i18n/dom-translations';
import { addDays, mondayOf, toIsoDate, todayIso } from './dates';

import { formatMinutes } from './dates';
const NOON = 12, SATURDAY = 6, SUNDAY = 0, MAX_MONTHS = 36, MS_PER_DAY = 864e5;
const LETTERS = 'DLMXJVS';

const split = (text: string): string[] => text.split(',');

/** «YYYY-MM-DD» of a date in local time (the same as toIsoDate; kept for the legacy names isoLocal and fechaLocal). */
export const localIso = (date: Date): string => toIsoDate(date);
export const today = (): string => todayIso();
export const plusDays = (isoDate: string, days: number): string => addDays(isoDate, days);
export const mondayOfWeek = (isoDate: string): string => mondayOf(isoDate);

/** 570 → «09:30». */
export const minutesToTime = (minutes: number): string => formatMinutes(minutes);

/** «09:30» → 570 (null without a time). */
export const timeToMinutes = (time: string | null | undefined): number | null =>
  (time ? Number(String(time).slice(0, 2)) * 60 + Number(String(time).slice(3, 5)) : null);

const rangeBuilders = (base: Date): ReadonlyMap<string, () => [string, string]> => {
  const year = base.getFullYear(), month = base.getMonth(), quarter = Math.floor(month / 3);
  const on = (yearOf: number, monthOf: number, day: number): string => localIso(new Date(yearOf, monthOf, day, NOON));
  const plus = (days: number): string => { const date = new Date(base); date.setDate(date.getDate() + days); return localIso(date); };
  const now = localIso(base);
  return new Map<string, () => [string, string]>([
    ['hoy', () => [now, now]], ['ayer', () => [plus(-1), plus(-1)]], ['semana', () => [plus(-((base.getDay() + 6) % 7)), now]], ['7d', () => [plus(-6), now]],
    ['mes', () => [on(year, month, 1), on(year, month + 1, 0)]], ['mesant', () => [on(year, month - 1, 1), on(year, month, 0)]],
    ['tri', () => [on(year, quarter * 3, 1), on(year, quarter * 3 + 3, 0)]], ['triant', () => [on(year, quarter * 3 - 3, 1), on(year, quarter * 3, 0)]],
    ['anio', () => [on(year, 0, 1), on(year, 11, 31)]], ['anioant', () => [on(year - 1, 0, 1), on(year - 1, 11, 31)]],
  ]);
};

/** First and last day of a period key (hoy, semana, mes, tri…); [null, null] for any other. */
export function periodRange(key: string): [string | null, string | null] {
  const base = new Date(); base.setHours(NOON, 0, 0, 0);
  const build = rangeBuilders(base).get(key);
  return build ? build() : [null, null];
}

/** Easter Sunday of a year (anonymous Gregorian algorithm). */
/* eslint-disable id-length -- the letters of the published algorithm, to compare it with its source */
export function easterSunday(year: number): string {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
/* eslint-enable id-length */

/** «YYYY-MM» of every month from `from` to `to` (at most 36). */
export function monthsBetween(from: string, to: string): string[] {
  const out: string[] = [], date = new Date(`${from.slice(0, 7)}-01T12:00:00`), end = new Date(`${to.slice(0, 7)}-01T12:00:00`);
  while (date <= end && out.length < MAX_MONTHS) { out.push(localIso(date).slice(0, 7)); date.setMonth(date.getMonth() + 1); }
  return out;
}

/** «sábado, 24 de octubre» in the language the person chose. */
export function longDate(date: Date): string {
  const language = coreLegacy.language();
  return language === 'es' ? date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
    : new Date(date).toLocaleDateString(LOCALES[language], { weekday: 'long', day: 'numeric', month: 'long' });
}

/** «24 oct». */
export const shortDate = (isoDate: string): string => new Date(`${isoDate}T00:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

/** The date window of the legacy pedirFecha. */
export const askDate = (message: string, value: string, options: { titulo?: string; ok?: string } = {}): Promise<unknown> =>
  coreLegacy.showDialog({ msg: message, titulo: options.titulo ?? t('core.dates.chooseDate'), ok: options.ok ?? t('core.dates.accept'), campo: { valor: value, tipo: 'date' } });

export const currentPeriod = (): string => today().slice(0, 7);

export const MONTHS_LONG: readonly string[] = split(t('dates.monthsLong'));
export const MONTHS_SHORT: readonly string[] = split(t('dates.monthsShort'));

/** «2026-10» → «octubre 2026». */
export const periodText = (period: string): string => {
  const [year, month] = period.split('-');
  return `${MONTHS_LONG[Number(month) - 1] ?? ''} ${year ?? ''}`;
};

/** The next weekday (Monday to Friday) after today. */
export function nextWorkingDay(): string {
  const date = new Date();
  do { date.setDate(date.getDate() + 1); } while (date.getDay() === SUNDAY || date.getDay() === SATURDAY);
  return localIso(date);
}

/** Letter of the day of a date (L, M, X…; D for Sunday). */
export const dayLetter = (isoDate: string): string => LETTERS[new Date(`${isoDate}T12:00:00`).getDay()] ?? '';
export const todayLetter = (): string => LETTERS[new Date().getDay()] ?? '';

/** «visitado el 3 oct (Ana), cita el 9 oct». */
export const recentText = (list: readonly { tipo: string; fecha: string; usuario?: string | null }[]): string =>
  list.map(item => `${t(item.tipo === 'visita' ? 'core.dates.visitedOn' : 'core.dates.appointmentOn', { date: shortDate(item.fecha) })}${item.usuario ? ` (${item.usuario})` : ''}`).join(', ');

/** «2026-10» → «oct 26». */
export const monthShortText = (month: string): string => `${MONTHS_SHORT[Number(month.slice(5, 7)) - 1] ?? ''} ${month.slice(2, 4)}`;

/** «24 oct, 10:30». */
export const shortDateTime = (value: string | number | Date): string =>
  new Date(value).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** Calendar days from today to a date (null without date). */
export const daysUntil = (value: string | null | undefined): number | null =>
  (value ? Math.round((Date.parse(String(value).slice(0, 10)) - Date.parse(today())) / MS_PER_DAY) : null);

/** «24 oct 2026» (a date or a timestamp); «—» without value. */
export const dateWithYear = (value: string | null | undefined): string =>
  (value ? new Date(String(value).length === 10 ? `${value}T12:00:00` : value).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

/** «24 de octubre». */
export const dayAndMonth = (value: string | null | undefined): string =>
  (value ? new Date(`${String(value).slice(0, 10)}T12:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }) : '');

/** «sábado». */
export const weekdayOf = (value: string): string => new Date(`${String(value).slice(0, 10)}T12:00:00`).toLocaleDateString('es-ES', { weekday: 'long' });

/** Working-week letters and names (L–V), with their default visiting hours. */
export const WORK_DAYS: readonly string[] = ['L', 'M', 'X', 'J', 'V'];
const longWeekdays = split(t('dates.weekdaysLong')).map(name => name.charAt(0).toUpperCase() + name.slice(1));
export const WORK_DAY_NAMES: Readonly<Record<string, string>> = Object.fromEntries(WORK_DAYS.map((letter, index) => [letter, longWeekdays[index] ?? letter]));
export const DEFAULT_HOURS: readonly string[] = ['09:00-13:00', '09:30-13:30', '10:00-14:00', '08:00-15:00'];
export const WEEK_DAYS: readonly (readonly [string, string])[] = ['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((letter, index) => [letter, longWeekdays[index] ?? letter] as const);

/** Short month names as people write them («sept» too), to their month number. */
export const SHORT_MONTH_NUMBERS: Readonly<Record<string, number>> = { ...Object.fromEntries(MONTHS_SHORT.map((name, index) => [name, index + 1])), sept: 9 };

/** The period choices of the date filters. */
export const PERIODS: readonly (readonly [string, string])[] = [
  ['todo', t('core.periods.all')], ['hoy', t('core.periods.today')], ['ayer', t('core.periods.yesterday')], ['semana', t('core.periods.thisWeek')],
  ['7d', t('core.periods.last7')], ['mes', t('core.periods.thisMonth')], ['mesant', t('core.periods.lastMonth')], ['tri', t('core.periods.thisQuarter')],
  ['triant', t('core.periods.lastQuarter')], ['anio', t('core.periods.thisYear')], ['anioant', t('core.periods.lastYear')], ['pers', t('core.periods.custom')],
];
