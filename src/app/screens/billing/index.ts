/**
 * Facturación (v2.413.0): the screen and its tabs, the invoice list, the invoice sheet with payments and rectifications, the series
 * and VeriFactu. The legacy names cargarFacturacion, verFactura, pintarSeries and pintarVerifactu stay as adapters. The PDF, the
 * email, issuing from an order, the fiscal data and the log stay in legacy (shared with Pedidos and Configuración).
 * Plan 7.3 (cut B): the screen is loaded on first use (chunk.ts → min/chunks/billing.js). Issuing (issue/) is called synchronously
 * by Pedidos, Configuración and the screen layout (readOnlyBilling, paymentStateOf, arrangeBilling…), so it stays in the core.
 */
import { lazyChunk } from '../../core/lazy/load';
import type * as Chunk from './chunk';

// v2.427.0: issuing, the order's invoices, sending by email, the read-only mode and the payment state
export { arrangeBilling, issueOrderInvoice, paintOrderInvoices, paymentStateOf, previewOrderInvoice, readOnlyBilling, sendInvoiceByEmail } from './issue';

const fromChunk = lazyChunk<typeof Chunk>('billing');

export const paintInvoices = fromChunk('paintInvoices');
export const refreshInvoices = fromChunk('refreshInvoices');
export const loadBilling = fromChunk('loadBilling');
export const editSeries = fromChunk('editSeries');
export const paintSeries = fromChunk('paintSeries');
export const showInvoice = fromChunk('showInvoice');
export const paintVerifactu = fromChunk('paintVerifactu');
