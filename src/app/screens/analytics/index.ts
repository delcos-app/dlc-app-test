/**
 * Analítica (v2.412.0): «Pedidos tras la visita» and «Explorar datos» (ranking and monthly table). The page, its filters and the
 * panel of indicators of «Resumen» are still in pantallas/analitica.js. The legacy names pintarAnalitica, pintarTablaAnalitica,
 * refrescarAnalitica and tvTarjeta stay as adapters.
 * Plan 7.3 (cut A): the screen is loaded on first use (chunk.ts → min/chunks/analytics.js); these are its functions, async.
 */
import { lazyChunk } from '../../core/lazy/load';
import type * as Chunk from './chunk';

const fromChunk = lazyChunk<typeof Chunk>('analytics');

export const paintRanking = fromChunk('paintRanking');
export const refreshExplore = fromChunk('refreshExplore');
export const paintMonthlyTable = fromChunk('paintMonthlyTable');
export const loadAnalytics = fromChunk('loadAnalytics');
export const loadKpis = fromChunk('loadKpis');
export const paintSummary = fromChunk('paintSummary');
export const showVisitOrders = fromChunk('showVisitOrders');
