/**
 * The file rows as the database expects them (sales grouped into orders), sent in batches of 200 to importar_lote, to check
 * them (simulate) or to save them. Migrated from the legacy impFilas and impLotes (v2.410.0).
 */
import { callRpc } from '../../legacy/bridge';
import { t } from '../../i18n';
import type { Entity } from './fields';
import { customFieldKey } from './matching';
import { wizard, type DataRow } from './wizard';

const BATCH = 200;

type Payload = Record<string, unknown>;
export interface RowError { fila: number; error: string }
export interface BatchResult { creados: number; actualizados: number; omitidos: number; errores: RowError[]; filas: { accion: string }[] }

/** Column index of each platform field and of each custom field. */
function columnsOf(): { standard: Map<string, number>; custom: Map<string, number> } {
  const standard = new Map<string, number>(), custom = new Map<string, number>();
  wizard.mapping.forEach((value, index) => {
    if (value.startsWith('std:')) standard.set(value.slice(4), index);
    else if (value === 'extra') custom.set(customFieldKey(wizard.headers[index] ?? ''), index);
  });
  return { standard, custom };
}

function rowObject(row: DataRow, columns: ReturnType<typeof columnsOf>): Payload {
  const result: Payload = { _fila: row.fila }, extra: Record<string, string> = {};
  columns.standard.forEach((index, key) => { result[key] = row.v[index] ?? ''; });
  columns.custom.forEach((index, key) => { const value = row.v[index]; if (value !== undefined && value !== '') extra[key] = value; });
  result.extra = extra;
  return result;
}

const text = (value: unknown): string => (typeof value === 'string' ? value : '');

function newOrder(row: Payload): Payload & { lineas: Payload[] } {
  return {
    _fila: row._fila, numero: text(row.numero), fecha: row.fecha, cliente: row.cliente, nif: text(row.nif), medico: text(row.medico),
    forma_pago: text(row.forma_pago), cobrado: text(row.cobrado), canal: text(row.canal), extra: row.extra, lineas: [],
  };
}

/** Sales: the rows with the same number (or the same date and customer) are one order. */
function salesOrders(rows: readonly Payload[]): Payload[] {
  const orders = new Map<string, Payload & { lineas: Payload[] }>();
  for (const row of rows) {
    const key = text(row.numero) ? `n:${text(row.numero)}` : `f:${String(row.fecha)}|${String(row.cliente)}`;
    const order = orders.get(key) ?? newOrder(row);
    orders.set(key, order);
    order.lineas.push({ producto: text(row.producto), referencia: text(row.referencia), unidades: row.unidades, precio: row.precio, importe: row.importe, iva: row.iva, medico: text(row.medico) });
  }
  return [...orders.values()];
}

/** The rows to import. */
export function rowsToImport(): Payload[] {
  const columns = columnsOf(), rows = wizard.rows.map(row => rowObject(row, columns));
  return wizard.entity === 'ventas' ? salesOrders(rows) : rows;
}

interface BatchOptions { readonly entity: Entity; readonly mode: string; readonly simulate: boolean; readonly importId: string | null }

function add(total: BatchResult, part: BatchResult): void {
  total.creados += part.creados; total.actualizados += part.actualizados; total.omitidos += part.omitidos;
  total.errores.push(...part.errores); total.filas.push(...part.filas);
}

/** Sends the rows in batches; `onProgress(done, total)` after each one. Throws on the first failed batch. */
export async function sendInBatches(rows: readonly Payload[], options: BatchOptions, onProgress: (done: number, total: number) => void): Promise<BatchResult> {
  const total: BatchResult = { creados: 0, actualizados: 0, omitidos: 0, errores: [], filas: [] };
  for (let start = 0; start < rows.length; start += BATCH) {
    const { data, error } = await callRpc<BatchResult & { ok?: boolean; error?: string }>('importar_lote', {
      p_imp: options.importId, p_entidad: options.entity, p_filas: rows.slice(start, start + BATCH), p_modo: options.mode, p_simular: options.simulate,
    });
    if (error || !data?.ok) throw new Error(error ? (error as { message?: string }).message ?? '' : data?.error ?? t('importing.run.noAnswer'));
    add(total, data);
    onProgress(Math.min(rows.length, start + BATCH), rows.length);
  }
  return total;
}
