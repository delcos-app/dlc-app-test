/**
 * Pedidos → Ventas, what the selection needs from each painted page (D-048, v2.472.0): the rows with their data and how they are
 * named, the filter they belong to, every order of the filter («Seleccionar los N del filtro») and the values of each column for
 * Exportar (the same columns and order as the table header).
 */
import { accountColumnsLegacy, permissions } from '../../legacy/bridge';
import { filterKey, publishPage, type ExportCell, type SelectableRow } from '../../components/list-bar';
import { t } from '../../i18n';
import { formatShortDate } from '../../services/date-format';
import { orFallback } from '../../services/values';
import { orderStep, STATES, type Order } from './model';

export interface ListedOrder extends Order {
  contacto?: string | null; centro?: string | null; medico?: string | null; comercial?: string | null; productos?: string | null;
  unidades: number; base?: number | null; total?: number | null;
}

const PAID = 'Cobrado';

export const customerOf = (row: ListedOrder): string => orFallback(row.contacto, orFallback(row.centro, orFallback(row.cuenta_texto, '—')));

/** «5 nov · F-2026-0012 · Pablo Navarro»: how an order is named in the selection and on its open button. */
export const orderLabel = (row: ListedOrder): string => [formatShortDate(row.fecha), orFallback(row.factura, row.numero ?? ''), customerOf(row)].filter(Boolean).join(' · ');

/** The operations of a confirmed order in words (as the title of its icons). */
function operationsText(row: ListedOrder): string {
  if (row.estado !== STATES.confirmed) return '';
  const packed = t(row.paquete_en ? 'orders.list.packageReady' : 'orders.list.packageToPrepare');
  if (row.sin_cargo) return packed;
  const paid = t(row.pago_estado === PAID ? 'orders.list.paymentReceived' : 'orders.list.paymentPending');
  return [paid, packed, row.factura ? t(row.email_factura_en ? 'orders.list.invoiceSent' : 'orders.list.invoiceToSendShort') : ''].filter(Boolean).join(' · ');
}

/** A date «2026-11-05» as a date of Excel (local midnight). */
export const sheetDate = (value: string | null | undefined): Date | null => (value ? new Date(`${String(value).slice(0, 10)}T00:00:00`) : null);

const amount = (value: number | null | undefined): number | null => (value === null || value === undefined ? null : Number(value));

/** One value per column of the header, in its order (amounts only for who sees them, as the header). */
function exportValues(row: ListedOrder, fields: readonly CustomField[]): ExportCell[] {
  const amounts = permissions.canSeeAmounts() ? [amount(row.base), amount(row.total)] : [];
  const values = row.clasificadores ?? {};
  return [sheetDate(row.fecha), customerOf(row), row.medico ?? null, row.comercial ?? null, row.productos ?? null, Number(row.unidades) || 0, ...amounts,
    orderStep(row)[0], operationsText(row), row.nota ?? null, ...fields.map(field => accountColumnsLegacy.fieldText(field, values[field.clave]) || null)];
}

export const toSelectable = (row: ListedOrder): SelectableRow => ({ id: row.id, label: orderLabel(row), data: row });

export interface PublishedOrders {
  readonly rows: readonly ListedOrder[];
  readonly total: number;
  /** The query of the page: without its page and size, it is the filter */
  readonly query: Record<string, unknown>;
  readonly fields: readonly CustomField[];
  /** The orders of the filter, up to a limit */
  readonly loadAll: (limit: number) => Promise<ListedOrder[]>;
}

/** Publishes the page being painted. */
export function publishOrders(page: PublishedOrders): void {
  publishPage('pedidos', {
    filter: filterKey(page.query), rows: page.rows.map(toSelectable), total: page.total,
    all: async limit => (await page.loadAll(limit)).map(toSelectable),
    values: row => exportValues(row.data as ListedOrder, page.fields),
  });
}
