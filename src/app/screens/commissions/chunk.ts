/**
 * Comisiones, loaded on first use (plan 7.3, cut A): the schemes and settlements page and the scheme window. herramientas/bundle.mjs
 * builds this file into min/chunks/commissions.js and index.ts calls it through core/lazy. The Inicio card stays in the core.
 */
import './texts';
export { paintCommissions } from './page';
export { editScheme } from './scheme-editor';
