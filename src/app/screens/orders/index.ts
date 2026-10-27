/**
 * Pedidos (v2.414.0): the page with its sections, the sales list, the order window (operations, payment, distributor and transfer,
 * equipment, bank transfer, non-fiscal edit), the payment details email, the distributors and the alert settings. The order editor,
 * the card payment (TPV), the subscriptions (Stripe), the alert cards and the invoices of an order stay in legacy. The legacy names
 * cargarVentas, listaPedidos, verPedido, pintarDistribuidores, configurarAvisosPedidos, enviarDatosPago and the order helpers stay
 * as adapters (the editor, other screens, «‹ Volver» and the tests use them).
 * Plan 7.3 (cut C): the screen is loaded on first use (chunk.ts → min/chunks/orders.js). The order model, the cards and menu entries,
 * the VAT field, the payment email texts, the payment state and the company billing figures are called synchronously by Inicio, the
 * forms, Facturación and the Panel delcos, so they stay in the core.
 */
import { backOpener, sheetOpener } from '../../core/layers/dialogs';
import { lazyChunk } from '../../core/lazy/load';
import { wideOpener } from '../../core/legacy-c/dialogs';
import { cachedModuleLoader } from '../../core/legacy-c/module-cache';
import type * as Chunk from './chunk';

export { isBankTransfer, isFree, lineBreakdown, orderStep, orderTotals, statePill, stepPill, totalsHtml } from './model';
export { paymentSubject, paymentText, sendPaymentDetails } from './payment-email';
// v2.417.0: the order editor, the card payment, the subscription, the order cards and the menu entries
export { addOrderMenuEntries } from './menu';
export { countUp, dayHtml, isDayOff, isHoliday, markChosenCard } from './cards';
export { isVatPercentField } from './editor/vat-field';
export { ago, billingSkeleton, companyPaymentState, kpiTiles, monthlyAmount } from './subscription/company-billing';
export { paintPaymentNotices } from './subscription/notices';
export { callPayments, loadPaymentState, waitUntilActive, waitUntilCancelled } from './subscription/payments';

const fromChunk = lazyChunk<typeof Chunk>('orders');

export const configureAlerts = fromChunk('configureAlerts');
export const paintDistributors = fromChunk('paintDistributors');
export const paintOrderList = fromChunk('paintOrderList');
// The window behaviour the app used to add by wrapping the global names (cargarVentas, verPedido, editorPedido) is added here, to
// the screen's own functions: the cache of the screen, the wide window, the sheet look and «‹ Volver» (plan 7.3, cut C).
export const loadSales = cachedModuleLoader('ventas', fromChunk('loadSales'));
export const showOrder = backOpener('verPedido', sheetOpener(wideOpener(fromChunk('showOrder'))));
export const editOrder = wideOpener(fromChunk('editOrder'));
/** What the open editor saves as who serves the order (now async: await it). */
export const openEditorDistributor = fromChunk('openEditorDistributor');
export const choosePlan = fromChunk('choosePlan');
export const paintTpvSettings = fromChunk('paintTpvSettings');
