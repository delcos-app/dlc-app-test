/** Dates written for people, in the current language (names from the i18n files, formats from the browser's Intl). */
import { t } from '../i18n';
import { fromIsoDate } from './dates';
import { range } from './values';

const locale = (): string => t('dates.locale');

/** «2026-10-24» → «24 oct» */
export function formatShortDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString(locale(), { day: 'numeric', month: 'short' });
}

/** «2026-10» → «octubre 2026» */
export function formatMonth(month: string): string {
  const [year = '', number = '1'] = month.split('-');
  return `${t('dates.monthsLong').split(',')[Number(number) - 1] ?? ''} ${year}`;
}

/** «2026-10-24» → «sábado» */
export function weekdayName(isoDate: string): string {
  return fromIsoDate(isoDate).toLocaleDateString(locale(), { weekday: 'long' });
}

/** The twelve short month names as the browser writes them («ene», «feb»…). */
export function shortMonthNames(): string[] {
  return range(12).map(index => new Date(2026, index, 15).toLocaleDateString(locale(), { month: 'short' }).replace('.', ''));
}

export const capitalise = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

/** «2026-10-24» → «sábado, 24 de octubre» */
export function formatLongDate(isoDate: string): string {
  return fromIsoDate(isoDate).toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' });
}

/** «2026-10-24» → «octubre de 2026» */
export function formatMonthYear(isoDate: string): string {
  return fromIsoDate(isoDate).toLocaleDateString(locale(), { month: 'long', year: 'numeric' });
}

/** «2026-10-24» → «octubre» */
export function monthNameOf(isoDate: string): string {
  return fromIsoDate(isoDate).toLocaleDateString(locale(), { month: 'long' });
}

/** «2026-10-24» → «24 de octubre» */
export function formatDayMonth(isoDate: string): string {
  return fromIsoDate(isoDate.slice(0, 10)).toLocaleDateString(locale(), { day: 'numeric', month: 'long' });
}
