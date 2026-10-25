/**
 * Small helpers every legacy file uses: an element by id, text safe in HTML, the missing .catch/.finally of Supabase queries, the
 * company name and a colour as RGB. Migrated from the legacy nucleo/utilidades.js (v2.425.0); $, esc, conCatch, nombreApp and hexRGB
 * stay as adapters.
 */
import { coreLegacy } from '../legacy/core-bridge';
import { t } from '../i18n';
import { escapeHtml } from '../services/format';
import { orFallback } from '../services/values';

const DEFAULT_COLOUR = '#1C2733', HEX = 16;

/** Element by id (any type: each id is a different element). */
export const byId = (id: string): HTMLElement | null => document.getElementById(id);

export const escapeText = (value: unknown): string => escapeHtml(value);

type Thenable = { then?: unknown; catch?: unknown; finally?: unknown } | null | undefined;

/** Supabase queries have no .catch or .finally: they are added so the code using them does not fail. */
export function withCatch<T extends Thenable>(query: T): T {
  if (query && typeof query.then === 'function' && typeof query.catch !== 'function') {
    const target = query as { catch: unknown; finally: unknown };
    target.catch = (handler: (reason: unknown) => unknown): Promise<unknown> => Promise.resolve(query as PromiseLike<unknown>).catch(handler);
    target.finally = (handler: () => void): Promise<unknown> => Promise.resolve(query as PromiseLike<unknown>).finally(handler);
  }
  return query;
}

/** The company's name (its brand), or «Mi empresa». */
export const appName = (): string => coreLegacy.brandName() || t('core.myCompany');

/** «#1C2733» → [28, 39, 51]. */
export const hexToRgb = (hex: string | null | undefined): number[] => {
  const digits = orFallback(hex, DEFAULT_COLOUR).replace('#', '');
  return [0, 2, 4].map(start => parseInt(digits.substring(start, start + 2), HEX));
};
