/**
 * Facturación: the payment states of an invoice, its pill and the money format. Migrated from the legacy pillCobro (v2.413.0).
 */
import { escapeHtml, formatCurrency } from '../../services/format';

/** Payment states as the database names them. */
export const PAYMENT = { paid: 'Cobrada', overdue: 'Vencida', pending: 'Pendiente' } as const;

/** Euros with up to two decimals, rounded to the cent (the legacy eurI). */
export const euros = (value: unknown): string => formatCurrency(Math.round((Number(value) || 0) * 100) / 100);

export function paymentPill(state: string): string {
  const kind = state === PAYMENT.paid ? 'p-est' : state === PAYMENT.overdue ? 'p-anu' : 'p-bor';
  return `<span class="pill ${kind}">${escapeHtml(state)}</span>`;
}

export const errorMessage = (error: unknown): string => (error as { message?: string } | null)?.message ?? '';

export interface InvoiceLine { descripcion: string; unidades: number; precio: number; descuento?: number | null; iva: number; base: number }
export interface InvoiceParty { nombre?: string | null; nif?: string | null; direccion?: string | null; cp?: string | null; municipio?: string | null; provincia?: string | null; razon_social?: string | null }
export interface Invoice {
  id: string; numero: string; fecha: string; vencimiento?: string | null; forma_pago?: string | null; total: number; cobrado: number;
  rectifica_id?: string | null; motivo_rectificacion?: string | null; pedido_id?: string | null; huella?: string | null;
  verifactu?: { estado?: string | null } | null; cliente: InvoiceParty; emisor: InvoiceParty; lineas: InvoiceLine[]; desglose_iva: { iva: number; base: number; cuota: number }[];
}
