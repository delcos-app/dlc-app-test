/**
 * Pedidos (v2.414.0): the page with its sections, the sales list, the order window (operations, payment, distributor and transfer,
 * equipment, bank transfer, non-fiscal edit), the payment details email, the distributors and the alert settings. The order editor,
 * the card payment (TPV), the subscriptions (Stripe), the alert cards and the invoices of an order stay in legacy. The legacy names
 * cargarVentas, listaPedidos, verPedido, pintarDistribuidores, configurarAvisosPedidos, enviarDatosPago and the order helpers stay
 * as adapters (the editor, other screens, «‹ Volver» and the tests use them).
 */
export { configureAlerts } from './alerts-settings';
export { paintDistributors } from './distributors';
export { paintOrderList } from './list';
export { isBankTransfer, isFree, lineBreakdown, orderStep, orderTotals, statePill, stepPill, totalsHtml } from './model';
export { loadSales } from './page';
export { paymentSubject, paymentText, sendPaymentDetails } from './payment-email';
export { showOrder } from './sheet';
