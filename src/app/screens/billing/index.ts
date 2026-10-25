/**
 * Facturación (v2.413.0): the screen and its tabs, the invoice list, the invoice sheet with payments and rectifications, the series
 * and VeriFactu. The legacy names cargarFacturacion, verFactura, pintarSeries and pintarVerifactu stay as adapters. The PDF, the
 * email, issuing from an order, the fiscal data and the log stay in legacy (shared with Pedidos and Configuración).
 */
export { paintInvoices, refreshInvoices } from './list';
export { loadBilling } from './page';
export { editSeries, paintSeries } from './series';
export { showInvoice } from './sheet';
export { paintVerifactu } from './verifactu';
