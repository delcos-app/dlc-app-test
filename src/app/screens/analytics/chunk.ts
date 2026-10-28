/**
 * Analítica, loaded on first use (plan 7.3, cut A): herramientas/bundle.mjs builds this file into min/chunks/analytics.js and
 * index.ts calls it through core/lazy. The ‹ › of «Pedidos tras la visita» start listening here: the card only exists once this
 * chunk has painted it.
 */
import './texts';
import { listenToVisitOrdersViews } from './visit-orders';

export { paintRanking, refreshExplore } from './explore';
export { paintMonthlyTable } from './monthly-table';
export { loadAnalytics, loadKpis, paintSummary } from './page';
export { showVisitOrders } from './visit-orders';

listenToVisitOrdersViews();
