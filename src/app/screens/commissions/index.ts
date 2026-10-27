/**
 * Comisiones (v2.411.0): the schemes and settlements page, the scheme window with who is paid with it, and the commission card
 * of Inicio. The legacy names pintarComisiones, tarjetaComision and editorEsquema stay as adapters. The commission and zone parts
 * of the user editor (Configuración) and cargarComerciales stay in legacy.
 * Plan 7.3 (cut A): the page and the scheme window are loaded on first use (chunk.ts → min/chunks/commissions.js); the Inicio card
 * is painted at start-up, so it stays in the core.
 */
import { lazyChunk } from '../../core/lazy/load';
import type * as Chunk from './chunk';

export { paintCommissionCard } from './home-card';

const fromChunk = lazyChunk<typeof Chunk>('commissions');

export const paintCommissions = fromChunk('paintCommissions');
export const editScheme = fromChunk('editScheme');
