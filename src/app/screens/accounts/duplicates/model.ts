/**
 * Duplicados: what the page remembers (the pending and similar pairs, the kind of each account, the tab and the pair being
 * compared) and the fields a unification chooses. Migrated from the legacy DUP_* state of legado 017 and 136 (v2.417.0).
 */
import { term } from '../../../legacy/bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';

export const PERSON = 'Persona', CENTRE = 'Centro';

export interface PendingDuplicate { id: string; nombre: string; codigo: string; centro?: string | null; municipio?: string | null; pct?: number | null; par_id?: string | null; par_nombre?: string | null }
export interface SimilarPair { a_id: string; b_id: string; a_nombre: string; b_nombre: string; a_codigo: string; b_codigo: string; pct: number }

export const duplicatesState = {
  pending: [] as PendingDuplicate[],
  similar: [] as SimilarPair[],
  kindById: new Map<string, string>(),
  tab: PERSON,
  current: null as [string, string] | null,
};

/** Pairs are always of the same kind: a person or a centre. */
export const kindOf = (id: string): string => (duplicatesState.kindById.get(id) === CENTRE ? CENTRE : PERSON);

/** The main fields a unification lets choose, in this order. */
export const unifyFields = (): readonly (readonly [string, string])[] => [
  ['nombre', t('accountsMore.fields.name')], ['especialidad', term('especialidad', { capital: 'C' })], ['area', t('accountsMore.fields.area')],
  ['telefono', t('accountsMore.fields.phone')], ['email', t('accountsMore.fields.email')], ['contacto', t('accountsMore.fields.contact')],
  ['nota', t('accountsMore.fields.note')], ['estado_comercial', t('accountsMore.fields.commercialState')],
];

/** The compare panel without a pair, with an optional message. */
export function emptyPanel(message: string): void {
  const panel = document.getElementById('dcmp');
  if (panel) panel.innerHTML = `<div class="vacio">${escapeHtml(message)} ${t('accountsMore.duplicates.nextPair')}</div>`;
}

/** Takes a pair out of both lists (after unifying or marking them as different). */
export function forgetPair(first: string, second: string): void {
  const inPair = (id: string | null | undefined): boolean => id === first || id === second;
  duplicatesState.similar = duplicatesState.similar.filter(pair => !(inPair(pair.a_id) && inPair(pair.b_id)));
  duplicatesState.pending = duplicatesState.pending.filter(item => !(inPair(item.id) && inPair(item.par_id)));
}

/** Takes every pair of an account that no longer exists out of both lists. */
export function forgetAccount(id: string): void {
  duplicatesState.similar = duplicatesState.similar.filter(pair => pair.a_id !== id && pair.b_id !== id);
  duplicatesState.pending = duplicatesState.pending.filter(item => item.id !== id && item.par_id !== id);
}
