/**
 * What each list has selected and the page it shows (D-048). The selection is kept while paging and is emptied when the filter or
 * the search changes (E4 A): a selected row is always one that the filter shows, and the count says how many on every page.
 */
import type { PageSource, SelectableRow } from './types';

/** At most 500 rows (E5 A): «Seleccionar los N del filtro» and the boxes stop there. */
export const SELECTION_LIMIT = 500;

export interface SelectionState {
  /** Selected rows by id (from any page of the same filter), in the order they were marked */
  readonly rows: Map<string, SelectableRow>;
  /** The filter the selection belongs to */
  filter: string;
  /** An action is running: its progress line («Marcando… 3 de 8»); nothing else can be pressed */
  running: string;
  /** The last row marked or unmarked by hand (Shift + click marks from it to the next one) */
  anchor: string | null;
}

const states = new Map<string, SelectionState>();
const pages = new Map<string, PageSource>();

export function selectionOf(key: string): SelectionState {
  let state = states.get(key);
  if (!state) { state = { rows: new Map(), filter: '', running: '', anchor: null }; states.set(key, state); }
  return state;
}

/** The page a list shows now (null before its first paint). */
export const pageOf = (key: string): PageSource | null => pages.get(key) ?? null;

/** The screen publishes the page it is painting; a new filter empties the selection. */
export function publishPage(key: string, page: PageSource): void {
  pages.set(key, page);
  const state = selectionOf(key);
  if (state.filter !== page.filter) { state.filter = page.filter; state.rows.clear(); state.anchor = null; }
}

/** Marks or unmarks rows; false when the limit left some out. */
export function setRows(state: SelectionState, rows: readonly SelectableRow[], on: boolean): boolean {
  let complete = true;
  rows.forEach(row => {
    if (!on) { state.rows.delete(row.id); return; }
    if (state.rows.has(row.id)) return;
    if (state.rows.size >= SELECTION_LIMIT) { complete = false; return; }
    state.rows.set(row.id, row);
  });
  return complete;
}

/** The filter of a query: the query without its page, its size and, if given, its order (`without`). */
export function filterKey(query: Readonly<Record<string, unknown>>, without: readonly string[] = []): string {
  const skipped = new Set(['lim', 'desplaz', ...without]);
  return JSON.stringify(Object.fromEntries(Object.entries(query).filter(([key]) => !skipped.has(key))));
}

export function clearSelection(state: SelectionState): void { state.rows.clear(); state.anchor = null; }
