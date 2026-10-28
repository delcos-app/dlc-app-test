/**
 * Eventos, loaded on first use (plan 7.3, cut B): the list, the editor, the sheet with attendees and costs and the yearly expense
 * report. herramientas/bundle.mjs builds this file into min/chunks/events.js and index.ts calls it through core/lazy.
 */
import './texts';
export { editEvent } from './editor';
export { paintEvents } from './list';
export { paintExpenseReport } from './report';
export { showEvent } from './sheet';
