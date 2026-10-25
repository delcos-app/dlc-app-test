/** What a purchase order is (states stored in the database), its pill and the shared formats of Compras. */
import { escapeHtml, formatCurrency } from '../../services/format';
import { round2 } from '../../services/money';

export const STATES = {
  draft: 'Borrador', sent: 'Enviado', inTransit: 'En tránsito', partlyReceived: 'Recibido parcial', received: 'Recibido', cancelled: 'Cancelado',
} as const;

/** Still waiting for goods: they count as «en curso» and can be received. */
export const OPEN_STATES: readonly string[] = [STATES.sent, STATES.inTransit, STATES.partlyReceived];
/** The order can still be changed. */
export const EDITABLE_STATES: readonly string[] = [STATES.draft, STATES.sent, STATES.inTransit];
/** The order is closed: it cannot be cancelled. */
export const CLOSED_STATES: readonly string[] = [STATES.received, STATES.cancelled];

/** Days a supplier takes to deliver when it does not say. */
export const DEFAULT_LEAD_DAYS = 90;

export interface Purchase {
  id?: string; numero?: string; estado: string; fecha: string; fecha_prevista?: string | null; proveedor_id?: string | null;
  portes?: number | string | null; nota?: string | null;
}

export interface PurchaseLine {
  id?: string; producto_id?: string; producto?: string; unidades: number; coste_unitario?: number | null | undefined; recibidas?: number;
}

export interface ReceivedBatch { producto: string; numero_lote: string; unidades: number; caducidad?: string | null }

export interface PurchaseDetail { compra: Purchase & { numero: string }; lineas: PurchaseLine[]; lotes: ReceivedBatch[] }

/** A supplier as the legacy catalog keeps it (Productos uses it too). */
export type Supplier = PurchaseSupplier;


/** The message of a database error or of the error code the function answers. */
export const errorText = (error: unknown, result: { error?: string } | null): string => (error as { message?: string } | null)?.message ?? result?.error ?? '';

/** Euros with cents, rounded like the legacy eurI (half up) before formatting. */
export const euros = (value: unknown): string => formatCurrency(round2(value));

export function purchasePill(state: string): string {
  const kind = state === STATES.received ? 'p-est' : state === STATES.cancelled ? 'p-anu' : state === STATES.draft ? 'p-bor' : 'p-per';
  return `<span class="pill ${kind}">${escapeHtml(state)}</span>`;
}
