/**
 * What a table cell holds, read from its text, to sort and filter any table: a number («1.234,5 €», «12 uds.»), a date («24/10/26»,
 * «2026-10-24», «sáb 24 oct»), a text or nothing («—»). Migrated from the legacy htValor, htComparar, htTipoColumna, htNorm,
 * htCeldaNoOrdenable, htNoFiltrable and filtroConValor (v2.416.0).
 */
import { listsLegacy } from '../../legacy/lists-bridge';

/** { n: number } | { f: 'YYYY-MM-DD' } | { t: lower-case text } | {} for an empty cell. */
export interface CellValue { readonly n?: number; readonly f?: string; readonly t?: string }

const pad = (value: string): string => value.padStart(2, '0');
const SLASH_DATE = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/, ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})/;
const SHORT_DATE = /^(?:[a-záéíóú]{3,4}\.? )?(\d{1,2}) (ene|feb|mar|abr|may|jun|jul|ago|sept?|oct|nov|dic)[a-z.]*(?: (\d{4}))?/;
const DOTTED_NUMBER = /^[-−]?\s?\d{1,3}(?:\.\d{3})*(?:,\d+)?\s*(?:€|%|uds?\.?|h|min|km)?$/i, PLAIN_NUMBER = /^[-−]?\d+(?:[.,]\d+)?\s*(?:€|%|uds?\.?|h|min|km)?$/i;

function dateOf(text: string): string | null {
  const slash = SLASH_DATE.exec(text);
  if (slash) { const [, day = '', month = '', year = ''] = slash; return `${year.length === 2 ? `20${year}` : year}-${pad(month)}-${pad(day)}`; }
  const iso = ISO_DATE.exec(text); if (iso) return iso[0];
  const short = SHORT_DATE.exec(text.toLowerCase());
  if (!short) return null;
  const [, day = '', month = '', year = String(new Date().getFullYear())] = short;
  return `${year}-${pad(String(listsLegacy.shortMonths()[month]))}-${pad(day)}`;
}

function numberOf(text: string): number | null {
  if (!DOTTED_NUMBER.test(text) && !PLAIN_NUMBER.test(text)) return null;
  const value = parseFloat(text.replace(/[−]/, '-').replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'));
  return Number.isNaN(value) ? null : value;
}

export function cellValue(text: string | null | undefined): CellValue {
  const clean = (text ? String(text) : '').replace(/\s+/g, ' ').trim();
  if (!clean || clean === '—' || clean === '-') return {};
  const date = dateOf(clean); if (date) return { f: date };
  const value = numberOf(clean); if (value !== null) return { n: value };
  return { t: clean.toLowerCase() };
}

const isEmpty = (value: CellValue): boolean => value.n === undefined && value.f === undefined && value.t === undefined;
const asText = (value: CellValue): string => String(value.t ?? value.n ?? value.f);

/** Order of two cells: empty ones last, numbers and dates by value, the rest as Spanish text with numbers in order. */
export function compareCells(first: string | null | undefined, second: string | null | undefined): number {
  const one = cellValue(first), other = cellValue(second);
  if (isEmpty(one) || isEmpty(other)) return Number(isEmpty(one)) - Number(isEmpty(other));
  if (one.n !== undefined && other.n !== undefined) return one.n - other.n;
  if (one.f !== undefined && other.f !== undefined) return one.f < other.f ? -1 : one.f > other.f ? 1 : 0;
  return asText(one).localeCompare(asText(other), 'es', { numeric: true, sensitivity: 'base' });
}

/** The filter a column gets: 'fecha' or 'numero' if every filled cell is one, else 'texto'. */
export function columnKind(texts: readonly (string | null | undefined)[]): 'texto' | 'fecha' | 'numero' {
  const values = texts.map(cellValue).filter(value => !isEmpty(value));
  if (!values.length) return 'texto';
  if (values.every(value => value.f !== undefined)) return 'fecha';
  if (values.every(value => value.n !== undefined)) return 'numero';
  return 'texto';
}

/** Lower case, without accents and with single spaces, to compare texts. */
export const normalise = (text: unknown): string => (text ? String(text) : '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/\s+/g, ' ').trim();

/** Columns that are not sorted (actions, products) or not filtered (actions). */
export const notSortable = (name: string | null | undefined): boolean => !name || /^(operativa|acciones?|productos)$/i.test(name);
export const notFilterable = (name: string | null | undefined): boolean => !name || /^(operativa|acciones?)$/i.test(name);

/** A custom field filter counts if it has something: a text, a list or a range with one end. */
export function filterHasValue(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.values(value).some(part => part !== null && part !== undefined && part !== '');
  return true;
}
