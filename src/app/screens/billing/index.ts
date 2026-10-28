/**
 * Facturación (v2.413.0): the screen and its tabs, the invoice list, the invoice sheet with payments and rectifications, the series
 * and VeriFactu. The legacy names cargarFacturacion, verFactura, pintarSeries and pintarVerifactu stay as adapters. The PDF, the
 * email, issuing from an order, the fiscal data and the log stay in legacy (shared with Pedidos and Configuración).
 * Plan 7.3 (cut B): the screen is loaded on first use (chunk.ts → min/chunks/billing.js). Issuing (issue/) is called synchronously
 * by Pedidos, Configuración and the screen layout (readOnlyBilling, paymentStateOf, arrangeBilling…), so it stays in the core.
 */
import { backOpener, sheetOpener } from '../../core/layers/dialogs';
import { lazyChunk } from '../../core/lazy/load';
import { wideOpener } from '../../core/legacy-c/dialogs';
import { cachedModuleLoader } from '../../core/legacy-c/module-cache';
import type * as Chunk from './chunk';

// v2.427.0: issuing, the order's invoices, sending by email, the read-only mode and the payment state
export { arrangeBilling, issueOrderInvoice, paintOrderInvoices, paymentStateOf, previewOrderInvoice, readOnlyBilling, sendInvoiceByEmail } from './issue';

const fromChunk = lazyChunk<typeof Chunk>('billing');

export const paintInvoices = fromChunk('paintInvoices');
export const refreshInvoices = fromChunk('refreshInvoices');
// The cache of the screen, the wide window, the sheet look and «‹ Volver», added to the screen's own functions instead of wrapping the
// global names cargarFacturacion and verFactura (plan 7.3, cut D)
export const loadBilling = cachedModuleLoader('facturacion', fromChunk('loadBilling'));
export const editSeries = fromChunk('editSeries');
export const paintSeries = fromChunk('paintSeries');
export const showInvoice = backOpener('verFactura', sheetOpener(wideOpener(fromChunk('showInvoice'))));
export const paintVerifactu = fromChunk('paintVerifactu');
