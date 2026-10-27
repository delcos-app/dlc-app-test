/**
 * Calidad del dato (v2.410.0): the page with completeness, doubtful addresses and the follow-up list, and the Cuentas header
 * button that opens it. The legacy names cargarSeguimiento and botonCalidad stay as adapters (the page map of legado 001 and the
 * start-up of legado 018 use them). Duplicados (its page and window) is still legacy.
 * Plan 7.3 (cut A): the page is loaded on first use (chunk.ts → min/chunks/quality.js); the Cuentas header button is painted at
 * start-up, so it stays in the core.
 */
import { lazyChunk } from '../../core/lazy/load';
import type * as Chunk from './chunk';

export { paintAccountsHeader } from './accounts-header';

export const loadQuality = lazyChunk<typeof Chunk>('quality')('loadQuality');
