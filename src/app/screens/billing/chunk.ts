/**
 * Facturación, loaded on first use (plan 7.3, cut B): the screen and its tabs, the invoice list, the invoice sheet with payments and
 * rectifications, the series and VeriFactu. herramientas/bundle.mjs builds this file into min/chunks/billing.js and index.ts calls
 * it through core/lazy. Issuing from an order (issue/), the store, the company data and the settings subnav stay in the core.
 */
import './texts';
export { paintInvoices, refreshInvoices } from './list';
export { loadBilling } from './page';
export { editSeries, paintSeries } from './series';
export { showInvoice } from './sheet';
export { paintVerifactu } from './verifactu';
