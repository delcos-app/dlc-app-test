/**
 * Analítica (v2.412.0): «Pedidos tras la visita» and «Explorar datos» (ranking and monthly table). The page, its filters and the
 * panel of indicators of «Resumen» are still in pantallas/analitica.js. The legacy names pintarAnalitica, pintarTablaAnalitica,
 * refrescarAnalitica and tvTarjeta stay as adapters.
 * Plan 7.3 (cut A): the screen is loaded on first use (chunk.ts → min/chunks/analytics.js); these are its functions, async.
 */
import { lazyChunk } from '../../core/lazy/load';
import { cachedModuleLoader } from '../../core/legacy-c/module-cache';
import type * as Chunk from './chunk';

const fromChunk = lazyChunk<typeof Chunk>('analytics');

export const paintRanking = fromChunk('paintRanking');
export const refreshExplore = fromChunk('refreshExplore');
export const paintMonthlyTable = fromChunk('paintMonthlyTable');
/** With the cache of the screen, added here instead of wrapping the global name cargarAnalitica (plan 7.3, cut D). */
export const loadAnalytics = cachedModuleLoader('analitica', fromChunk('loadAnalytics'));
export const loadKpis = fromChunk('loadKpis');
export const paintSummary = fromChunk('paintSummary');
export const showVisitOrders = fromChunk('showVisitOrders');
