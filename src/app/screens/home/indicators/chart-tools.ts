/** Small helpers shared by the indicator charts. */
import { addDays, fromIsoDate } from '../../../services/dates';

/** What each indicator card shows under its figure: a sentence and a small chart (both may be empty). */
export interface ChartResult { readonly summary: string; readonly visual: string }
export const EMPTY_CHART: ChartResult = { summary: '', visual: '' };

export const WEEKDAY_LETTERS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
export const STATE_COLORS: Readonly<Record<string, string>> = {
  inicial: '#C9D7E6', avance: '#3F82C0', interes: '#17457A', positivo: '#1E7A4C', negativo: '#94A3B8',
};

/** 0, 1, … length − 1. */
export const range = (length: number): number[] => [...Array(length).keys()];

export const sum = (values: readonly number[]): number => values.reduce((total, value) => total + value, 0);

export function lineIcon(path: string, width = 2.4): string {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}

/** Monday of the week of `isoDate`. */
export function mondayOf(isoDate: string): string {
  const date = fromIsoDate(isoDate);
  return addDays(isoDate, -((date.getDay() + 6) % 7));
}

/** «09:30» → 570 minutes; null if it is not a time. */
export function minutesOf(time: string | null | undefined): number | null {
  const match = /(\d{1,2}):(\d{2})/.exec(String(time ?? ''));
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

/** Counts per date, from a list of {fecha, n}. */
export function countsByDate(rows: readonly { fecha: string; n: number }[] | undefined): Map<string, number> {
  return new Map((rows ?? []).map(row => [row.fecha, row.n]));
}
