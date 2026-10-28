/**
 * Pedidos, loaded on first use (plan 7.3, cut C): the page with its sections, the sales list, the order window, the order editor,
 * the distributors, the alert settings, the card payment settings and choosing a plan. herramientas/bundle.mjs builds this file
 * into min/chunks/orders.js and index.ts calls it through core/lazy. What the core calls at start-up or expects an answer from at
 * once (the order model and its pills, the order cards of Inicio, the menu entries, the VAT field, the payment email texts, the
 * payment state and its notices, the company billing figures of the Panel delcos) stays in the core.
 */
import './texts';
export { configureAlerts } from './alerts-settings';
export { paintDistributors } from './distributors';
export { paintOrderList } from './list';
export { loadSales } from './page';
export { showOrder } from './sheet';
export { editOrder, openEditorDistributor } from './editor';
export { choosePlan } from './subscription/choose-plan';
export { paintTpvSettings } from './tpv/settings';
