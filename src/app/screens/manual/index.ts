/**
 * Manual de uso (v2.410.0): the book inside the app with «‹ Volver a …», the manual of the professional portal and the «i» of
 * each screen. The legacy names cargarManual, abrirManual and ponerAyudaManual stay as adapters (the screen table of legado 001,
 * the «i» windows, navigation and the tests use them); MANUAL_ANCLA and MANUAL_VUELTA stay in legacy.
 * Plan 7.3 (cut A): the book and the portal manual are loaded on first use (chunk.ts → min/chunks/manual.js); the «i» is put on
 * every screen, so it stays in the core.
 */
import { lazyChunk } from '../../core/lazy/load';
import type * as Chunk from './chunk';

export { putHelpButton } from './help';

const fromChunk = lazyChunk<typeof Chunk>('manual');

export const goBack = fromChunk('goBack');
export const openManual = fromChunk('openManual');
export const paintManual = fromChunk('paintManual');
