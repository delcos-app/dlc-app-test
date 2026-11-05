/**
 * Cuentas, what the selection needs from each painted page (D-048, v2.472.0): the rows with their data, the filter they belong to,
 * every account of the filter and the values of the columns shown, for Exportar (the same columns and order as the header).
 */
import { publishPage, type SelectableRow } from '../../../components/list-bar';
import { cell } from './cells';
import { visibleColumns } from './columns';

/** The text of a cell painted as HTML (pills, links…). */
function textOf(html: string): string {
  const box = document.createElement('template'); box.innerHTML = html;
  return (box.content.textContent ?? '').replace(/s+/g, ' ').trim();
}

const toSelectable = (row: AccountListRow): SelectableRow => ({ id: row.id, label: row.nombre ?? '', data: row });

export interface PublishedAccounts {
  readonly rows: readonly AccountListRow[];
  readonly total: number;
  readonly filter: string;
  readonly loadAll: (limit: number) => Promise<AccountListRow[]>;
}

export function publishAccounts(page: PublishedAccounts): void {
  publishPage('directorio', {
    filter: page.filter, rows: page.rows.map(toSelectable), total: page.total,
    all: async limit => (await page.loadAll(limit)).map(toSelectable),
    values: row => visibleColumns().map(column => textOf(cell(row.data as AccountListRow, column.k, () => undefined)) || null),
  });
}
