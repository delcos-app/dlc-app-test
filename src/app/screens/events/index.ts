/**
 * Eventos (v2.407.0): the list of events, the editor, the sheet with attendees and costs, and the yearly expense report.
 * The legacy names pintarEventos, pintarTransparencia, editarEvento and verEvento stay as adapters (page tabs of legado 079,
 * «‹ Volver» and the tests use them).
 */
export { editEvent } from './editor';
export { paintEvents } from './list';
export { EVENT_TYPES } from './model';
export { paintExpenseReport } from './report';
export { showEvent } from './sheet';
