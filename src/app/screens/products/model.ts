/**
 * Productos: the stock state of a product, the expiry class of a batch, the store names and the money format. Migrated from the
 * legacy estadoStock and cadClase (v2.413.0).
 */
import { t } from '../../i18n';
import { addDays, todayIso } from '../../services/dates';
import { escapeHtml, formatCurrency } from '../../services/format';
import { orFallback } from '../../services/values';

/** Days before the supplier's delivery time when a product must be ordered again. */
const ORDER_MARGIN_DAYS = 14, EXPIRY_SOON_DAYS = 90;

export interface StockBatch { id: string; numero_lote: string; unidades: number; caducidad?: string | null; fecha_fabricacion?: string | null; almacen: string; almacen_id: string; proveedor?: string | null }
export interface StockLine {
  id: string; nombre: string; presentacion?: string | null; activo?: boolean; stock: number; stock_minimo?: number | null; dias_cobertura?: number | null;
  plazo_dias: number; en_camino?: number | null; llegada?: string | null; sin_lote?: number | null; proxima_caducidad?: string | null; consumo_diario?: number | string | null;
  proveedor?: string | null; por_almacen?: { almacen: string; unidades: number }[] | null; lotes?: StockBatch[] | null;
}
export interface Store { id: string; nombre: string; tipo?: string | null; activo?: boolean; usuario?: string | null; usuario_id?: string | null; unidades?: number }

/** Euros with up to two decimals, rounded to the cent (the legacy eurI). */
export const euros = (value: unknown): string => formatCurrency(Math.round((Number(value) || 0) * 100) / 100);

export const round2 = (value: number): number => Math.round(value * 100) / 100;

/** [label, pill class] of the stock of a product. */
export function stockState(line: StockLine): readonly [string, string] {
  if (line.stock <= 0) return [t('products.stock.outOfStock'), 'p-anu'];
  if (line.stock_minimo !== null && line.stock_minimo !== undefined && line.stock < line.stock_minimo) return [t('products.stock.belowMinimum'), 'p-bor'];
  if (line.dias_cobertura !== null && line.dias_cobertura !== undefined && line.dias_cobertura <= line.plazo_dias + ORDER_MARGIN_DAYS && !line.en_camino) return [t('products.stock.orderNow'), 'p-bor'];
  return [t('products.stock.fine'), 'p-est'];
}

/** «cad-pasada» if it expired, «cad-pronto» within 90 days. */
export function expiryClass(isoDate: string | null | undefined): string {
  if (!isoDate) return '';
  const today = todayIso();
  if (isoDate < today) return 'cad-pasada';
  return isoDate <= addDays(today, EXPIRY_SOON_DAYS) ? 'cad-pronto' : '';
}

export const storeIcon = (store: Store): string => (store.tipo === 'central' || store.tipo === 'deposito' ? '🏢' : '💼');

export function storeKind(store: Store): string {
  if (store.tipo === 'central') return t('products.stores.central');
  return store.tipo === 'deposito' ? t('products.stores.deposit') : t('products.stores.caseOf', { name: escapeHtml(orFallback(store.usuario, '—')) });
}

export const errorMessage = (error: unknown): string => (error as { message?: string } | null)?.message ?? '';
