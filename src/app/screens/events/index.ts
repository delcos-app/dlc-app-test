/**
 * Eventos (v2.407.0): the list of events, the editor, the sheet with attendees and costs, and the yearly expense report.
 * The legacy names pintarEventos, pintarTransparencia, editarEvento and verEvento stay as adapters (page tabs of legado 079,
 * «‹ Volver» and the tests use them).
 * Plan 7.3 (cut B): the screen is loaded on first use (chunk.ts → min/chunks/events.js); the event types (model.ts) are read by the
 * list bar, so they stay in the core.
 */
import { lazyChunk } from '../../core/lazy/load';
import type * as Chunk from './chunk';

export { EVENT_TYPES } from './model';

const fromChunk = lazyChunk<typeof Chunk>('events');

export const editEvent = fromChunk('editEvent');
export const paintEvents = fromChunk('paintEvents');
export const paintExpenseReport = fromChunk('paintExpenseReport');
export const showEvent = fromChunk('showEvent');
