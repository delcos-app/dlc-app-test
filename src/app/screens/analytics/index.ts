/**
 * Analítica (v2.412.0): «Pedidos tras la visita» and «Explorar datos» (ranking and monthly table). The page, its filters and the
 * panel of indicators of «Resumen» are still in pantallas/analitica.js. The legacy names pintarAnalitica, pintarTablaAnalitica,
 * refrescarAnalitica and tvTarjeta stay as adapters.
 */
export { paintRanking, refreshExplore } from './explore';
export { paintMonthlyTable } from './monthly-table';
export { loadAnalytics, loadKpis, paintSummary } from './page';
export { listenToVisitOrdersViews, showVisitOrders } from './visit-orders';
