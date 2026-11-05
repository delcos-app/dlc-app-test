/**
 * Clientes, what the selection needs from each painted page (D-048, v2.472.0): the rows with their data, the filter they belong to,
 * every customer of the filter and the values of each column for Exportar (the same columns and order as the table header).
 */
import { accountColumnsLegacy } from '../../legacy/bridge';
import { filterKey, publishPage, type ExportCell, type SelectableRow } from '../../components/list-bar';
import { customerDataFields } from '../../components/customer-data';
import { t } from '../../i18n';
import type { Row } from './list';
import { listParams, TYPES, words } from './model';

const sheetDate = (value: string | null | undefined): Date | null => (value ? new Date(`${String(value).slice(0, 10)}T00:00:00`) : null);

function exportValues(row: Row, fields: readonly CustomField[]): ExportCell[] {
  const values = row.clasificadores ?? {};
  return [row.nombre, row.tipo === TYPES.company ? t('customers.company') : words().Patient ?? null, row.nif ?? null,
    ...customerDataFields(row).map(field => field.value || null), row.medico ?? null, row.comercial ?? null,
    Number(row.pedidos) || 0, Number(row.unidades) || 0, sheetDate(row.ultimo_pedido), ...fields.map(field => accountColumnsLegacy.fieldText(field, values[field.clave]) || null)];
}

const toSelectable = (row: Row): SelectableRow => ({ id: row.id, label: row.nombre, data: row });

export interface PublishedCustomers {
  readonly rows: readonly Row[];
  readonly total: number;
  readonly fields: readonly CustomField[];
  readonly loadAll: (limit: number) => Promise<Row[]>;
}

/** Publishes the page being painted; the filter is the query without its page. */
export function publishCustomers(page: PublishedCustomers): void {
  publishPage('pacientes', {
    filter: filterKey(listParams()), rows: page.rows.map(toSelectable), total: page.total,
    all: async limit => (await page.loadAll(limit)).map(toSelectable),
    values: row => exportValues(row.data as Row, page.fields),
  });
}
