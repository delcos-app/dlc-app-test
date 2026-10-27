/**
 * Configuración → Importar datos (v2.410.0): the wizard «Nueva importación» (what, file, columns, review and run) and the list
 * «Importaciones» with undo. The legacy names pintarImportar and pintarImportaciones stay as adapters (Configuración opens them),
 * and impNorm (Configuración and the manual compare texts with it).
 * Plan 7.3 (cut B): the wizard and the list are loaded on first use (chunk.ts → min/chunks/import.js); normaliseHeader is called
 * synchronously by other screens, so it stays in the core.
 */
import { lazyChunk } from '../../core/lazy/load';
import type * as Chunk from './chunk';

export { normaliseHeader } from './matching';

const fromChunk = lazyChunk<typeof Chunk>('import');

export const paintImport = fromChunk('paintImport');
export const paintImports = fromChunk('paintImports');
