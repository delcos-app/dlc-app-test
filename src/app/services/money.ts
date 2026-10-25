/**
 * Amounts, VAT and small number formats. Migrated from the legacy servicios/formato.js (v2.425.0); the legacy names (eur, eurI,
 * eurW, r2, pct, TIPOS_IVA…) stay as adapters.
 */
import { t } from '../i18n';
import { formatNumber } from './format';
import { formatDuration } from './dates';

export const number = (value: unknown): string => formatNumber(value || 0);
export const duration = (milliseconds: number): string => formatDuration(milliseconds);
/** «1.234,50 €» (up to two decimals). */
export const euros = (value: unknown): string => Number(value || 0).toLocaleString('es', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });

/** Rounded to cents. */
/** Rounds to cents half away from zero, like the database: 1.005 → 1.01 (×100 in floating point gave 100.4999… → 1). */
export function round2(value: unknown): number {
  const amount = Number(value) || 0, cents = Math.round(Number((Math.abs(amount) * 100).toPrecision(12)));
  return (amount < 0 ? -cents : cents) / 100;
}

export const eurosRounded = (value: unknown): string => euros(round2(value));

/** Percentage of `part` in `whole` (0 without whole). */
export const percent = (part: number, whole: number): number => (whole ? Math.round(part / whole * 100) : 0);

/** The legal VAT rates, with their names. */
export const VAT_RATES: readonly (readonly [number, string])[] = [
  [21, t('core.vat.general')], [10, t('core.vat.reduced')], [4, t('core.vat.superReduced')], [0, t('core.vat.exempt')],
];

const labelText = (input: HTMLInputElement): string => (input.id ? document.querySelector(`label[for="${input.id}"]`)?.textContent ?? '' : '');

/** A VAT field, found by its name or its label: it always gets the list of legal rates. */
export const isVatField = (input: HTMLInputElement): boolean =>
  /iva/i.test(`${input.id} ${input.dataset.f ?? ''} ${input.name}`) || /\bIVA\s*\(%\)|tipo de iva/i.test(labelText(input));

export const AMOUNT_FIELD = /imp|importe|total|base|precio|pvp|coste|cobro|con_iva|conIva|sin_iva/i;

/** 21 % of an amount, rounded to cents. */
export const vatOf = (amount: number): number => Math.round(amount * 21) / 100;

/** Euros without «,00» when the amount is whole (490 €), as on the website. */
export const eurosWeb = (value: unknown): string => {
  const text = euros(value);
  return Math.round(Number(value) * 100) % 100 === 0 ? text.replace(/,00(?=\s?€)/, '') : text;
};
