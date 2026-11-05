/**
 * A row of a list table that opens something (D-048, v2.472.0). It is not a button any more, so that it can hold its selection
 * checkbox (a checkbox inside a button is not valid for screen readers): the row keeps its click, and an invisible button laid
 * over it (.dropen) opens it with the keyboard and names it. The data cells of a row or a header are the children that are not the
 * checkbox, the open button or the mobile card: hidden or widened columns, sorting and filters count only those.
 */
import { escapeHtml } from '../../services/format';

const NOT_DATA = '.plselc, .dropen, .plcard';

/** The data cells of a table row or header, in their order. */
export const dataCells = (row: Element | null | undefined): Element[] => (row ? [...row.children].filter(cell => !cell.matches(NOT_DATA)) : []);

/** The open button of a row, named after what it opens («Abrir …»). */
export const openButtonHtml = (label: string): string => `<button type="button" class="dropen" aria-label="${escapeHtml(label)}"></button>`;

/** A row of a list table: `kind` dr (grid tables) or trow (Cuentas), its data attributes and style, its cells and what it opens. */
export function openableRowHtml(kind: 'dr' | 'trow', attributes: string, cells: string, label: string): string {
  return `<div class="${kind}" ${attributes}>${cells}${openButtonHtml(label)}</div>`;
}
