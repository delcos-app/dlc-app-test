/**
 * The checkbox column of a list table (D-048): one box per row and the one in the header that marks the page. Each box goes last in
 * the row (and first on screen, order −1): the data cells keep their positions, so hidden or widened columns stored by position,
 * sorting and the column filters do not move. Only on the computer; on the phone nothing is painted and the list stays as it was.
 */
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import type { SelectionState } from './source';
import type { PageSource, SelectableRow, SelectionConfig } from './types';

const CELL = 'plselc', ROW_BOX = 'plselk', PAGE_BOX = 'plselall', MARKED = 'plselon', TABLE = 'plsel';

const boxHtml = (kind: string, label: string): string => `<label class="${CELL}"><input type="checkbox" class="${kind}" aria-label="${escapeHtml(label)}"></label>`;

export const rowsOf = (section: Element, config: SelectionConfig): HTMLElement[] => [...section.querySelectorAll<HTMLElement>(config.shape.rows)];

export const idOf = (element: HTMLElement, config: SelectionConfig): string => element.dataset[config.shape.idKey] ?? '';

/** The row of the page painted in `element` (with its data). */
export function pageRowOf(element: HTMLElement, config: SelectionConfig, page: PageSource): SelectableRow | undefined {
  const id = idOf(element, config);
  return id ? page.rows.find(row => row.id === id) : undefined;
}

function setBox(box: HTMLInputElement | null, checked: boolean, mixed = false): void {
  if (!box) return;
  if (box.checked !== checked) box.checked = checked;
  if (box.indeterminate !== mixed) box.indeterminate = mixed;
}

/** One box per row of the page (added once) and the selected rows marked. */
function paintRows(section: Element, config: SelectionConfig, state: SelectionState, page: PageSource): { shown: number; marked: number } {
  let shown = 0, marked = 0;
  rowsOf(section, config).forEach(element => {
    const row = pageRowOf(element, config, page); if (!row) return;
    let box = element.querySelector<HTMLInputElement>(`:scope > .${CELL} > .${ROW_BOX}`);
    if (!box) { element.insertAdjacentHTML('beforeend', boxHtml(ROW_BOX, t('listSelection.selectRow', { name: row.label }))); box = element.querySelector(`:scope > .${CELL} > .${ROW_BOX}`); }
    const on = state.rows.has(row.id); shown += 1; if (on) marked += 1;
    setBox(box, on);
    if (box) box.disabled = Boolean(state.running);
    if (element.classList.contains(MARKED) !== on) element.classList.toggle(MARKED, on);
  });
  return { shown, marked };
}

/** Adds the checkbox column (header and rows) and marks what is selected. */
export function paintChecks(section: Element, config: SelectionConfig, state: SelectionState, page: PageSource): void {
  const table = section.querySelector(config.shape.table), head = section.querySelector(config.shape.head);
  if (!table || !head) return;
  if (!table.classList.contains(TABLE)) table.classList.add(TABLE);
  if (!head.querySelector(`:scope > .${CELL}`)) head.insertAdjacentHTML('beforeend', boxHtml(PAGE_BOX, t('listSelection.selectPage')));
  const { shown, marked } = paintRows(section, config, state, page), all = head.querySelector<HTMLInputElement>(`.${PAGE_BOX}`);
  setBox(all, shown > 0 && marked === shown, marked > 0 && marked < shown);
  if (all) all.disabled = Boolean(state.running) || !shown;
}

/** On the phone (or a list without anything to do): no checkbox column. */
export function removeChecks(section: Element, config: SelectionConfig): void {
  section.querySelectorAll(`.${CELL}`).forEach(cell => { cell.remove(); });
  section.querySelectorAll(`.${MARKED}`).forEach(row => { row.classList.remove(MARKED); });
  section.querySelector(config.shape.table)?.classList.remove(TABLE);
}

export const CLASSES = { cell: CELL, rowBox: ROW_BOX, pageBox: PAGE_BOX };
