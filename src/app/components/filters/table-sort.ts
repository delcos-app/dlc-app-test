/**
 * Sorting and filtering any table (.dgrid) in the screen: pressing a column name sorts (▲), again reverses (▼) and a third time
 * restores the order; the «Filtros y columnas» panel filters by text, value and range. Tables paged in the database (ORD_SRV) are
 * sorted there instead. The chosen order (HT_ORDEN) and filters (HT_ESTADO) stay in legacy state: the panel, api.js and the
 * tests read them. Migrated from the legacy htTipo, htOcultas, anchosGuardados, htMarcarCabecera, htOrdenarFilas, htQuitarOrden and
 * htAplicarFiltros (v2.416.0).
 */
import { listsLegacy, type TableFilters } from '../../legacy/lists-bridge';
import { t } from '../../i18n';
import { cellValue, compareCells, normalise, notSortable } from './cell-values';

/** The kind of a table: its first class other than dgrid (e.g. 'peds2'), the key of its order, filters and columns. */
export const tableKind = (grid: Element): string => [...grid.classList].find(name => name !== 'dgrid') ?? 'tabla';

function storedJson(key: string): unknown {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null'); } catch { return null; }
}

/** Columns hidden by the person in this kind of table. */
export const hiddenColumns = (kind: string): unknown => storedJson(`ht-cols-${kind}`) ?? [];

/** Column widths dragged by the person in this kind of table (null if none). */
export const savedWidths = (kind: string): unknown => storedJson(listsLegacy.widthsKey(kind)) ?? null;

const headerOf = (grid: Element): Element | null => grid.querySelector(':scope > .dh');
const rowsOf = (grid: Element): HTMLElement[] => [...grid.querySelectorAll<HTMLElement>(':scope > .dr')];

/** Marks which columns sort and which one is sorted, and how. */
export function markHeader(grid: Element): void {
  const kind = tableKind(grid), order = listsLegacy.sortState()[kind], header = headerOf(grid); if (!header) return;
  const server = listsLegacy.serverSort()[kind];
  [...header.children].forEach((column, index) => {
    const name = column.textContent?.trim() ?? '', sortable = server ? Boolean(server(index, name)) : !notSortable(name);
    column.classList.toggle('htord', sortable);
    column.classList.toggle('ord-asc', Boolean(order) && order?.i === index && order.dir === 1);
    column.classList.toggle('ord-desc', Boolean(order) && order?.i === index && order.dir === -1);
    if (sortable) { column.setAttribute('role', 'button'); (column as HTMLElement).title = t('listComponents.sort.byColumn'); }
  });
}

/** Sorts the rows on screen by the chosen column (each row remembers where it was, to restore it). */
export function sortRows(grid: Element): void {
  const kind = tableKind(grid), order = listsLegacy.sortState()[kind]; markHeader(grid);
  if (!order || listsLegacy.serverSort()[kind]) return;
  const header = headerOf(grid), rows = rowsOf(grid); if (!header || !rows.length) return;
  rows.forEach((row, position) => { row.dataset.htpos ??= String(position); });
  const cellText = (row: HTMLElement): string | null | undefined => row.children[order.i]?.textContent;
  const sorted = [...rows].sort((first, second) => order.dir * compareCells(cellText(first), cellText(second)) || (Number(first.dataset.htpos) - Number(second.dataset.htpos)));
  if (sorted.some((row, position) => row !== rows[position])) { let previous: Element = header; sorted.forEach(row => { previous.after(row); previous = row; }); }
}

/** Puts the rows back in the order they were painted. */
export function clearSort(grid: Element): void {
  const rows = rowsOf(grid);
  if (rows.some(row => row.dataset.htpos === undefined)) return;
  let previous = headerOf(grid); if (!previous) return;
  [...rows].sort((first, second) => Number(first.dataset.htpos) - Number(second.dataset.htpos)).forEach(row => { previous?.after(row); previous = row; });
}

type Range = NonNullable<TableFilters['rangos']>[string];

function inRange(text: string | null | undefined, range: Range): boolean {
  const value = cellValue(text), isDate = range.k === 'fecha', current = isDate ? value.f : value.n;
  if (current === undefined) return false;
  const bound = (end: string | number | null | undefined): string | number | null => (isDate ? end ?? null : end === '' || end === null || end === undefined ? null : Number(end));
  const from = bound(range.d), to = bound(range.h);
  return (from === null || from === '' || current >= from) && (to === null || to === '' || current <= to);
}

/** Hides (class htfuera) the rows that do not match the text, the column values and the ranges chosen for this table. */
export function applyColumnFilters(grid: Element): void {
  const filters = listsLegacy.filterState()[tableKind(grid)] ?? { texto: '', facetas: {} };
  const text = normalise(filters.texto ?? ''), facets = Object.entries(filters.facetas ?? {}).filter(([, value]) => value);
  const ranges = Object.entries(filters.rangos ?? {}).filter(([, range]) => Boolean(range.d) || Boolean(range.h));
  rowsOf(grid).forEach(row => {
    const cells = [...row.children];
    const matches = (!text || normalise(row.textContent).includes(text))
      && facets.every(([index, value]) => { const cell = cells[Number(index)]; return Boolean(cell) && normalise(cell?.textContent).includes(normalise(value)); })
      && ranges.every(([index, range]) => inRange(cells[Number(index)]?.textContent, range));
    row.classList.toggle('htfuera', !matches);
  });
}
