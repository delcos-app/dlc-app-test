/**
 * Exportar the selected rows (D-048, E3 A): an Excel with the columns the table shows, in the same order and with the same names
 * (a column hidden in «Columnas» does not come out), amounts as numbers and dates as dates. The values come from each row's data
 * (rows of other pages too), as the screen published them; services/files.ts records the export and writes the file.
 */
import { exportSheet, type SheetCell } from '../../../services/files';
import { todayIso } from '../../../services/dates';
import { dataCells } from '../../list/row';
import type { SelectionState } from './source';
import type { PageSource, SelectionConfig } from './types';

const HIDDEN = 'htno';

/** The header names and their positions, without the hidden columns. */
function shownColumns(section: Element, config: SelectionConfig): { index: number; name: string }[] {
  return dataCells(section.querySelector(config.shape.head))
    .map((cell, index) => ({ index, name: (cell.textContent ?? '').trim(), hidden: cell.classList.contains(HIDDEN) }))
    .filter(column => !column.hidden && column.name).map(({ index, name }) => ({ index, name }));
}

/** Writes the Excel of the selected rows; true when it was written (and recorded). */
export async function exportSelection(section: Element, config: SelectionConfig, state: SelectionState, page: PageSource): Promise<boolean> {
  const values = page.values; if (!values) return false;
  const columns = shownColumns(section, config), rows = [...state.rows.values()];
  const body = rows.map(row => { const all = values(row); return columns.map(column => (all[column.index] ?? null) as SheetCell); });
  return exportSheet({ list: config.key, head: columns.map(column => column.name), body }, `${config.key}_${todayIso()}.xlsx`);
}
