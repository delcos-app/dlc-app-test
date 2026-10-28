/**
 * Configuración → Importar datos, loaded on first use (plan 7.3, cut B): the wizard «Nueva importación» and the list
 * «Importaciones». herramientas/bundle.mjs builds this file into min/chunks/import.js and index.ts calls it through core/lazy.
 * The steps are wired here, when the chunk runs: they are only used from then on.
 */
import './texts';
import { paintColumnsStep } from './columns-step';
import { paintFileStep, paintImport } from './file-step';
import { paintImports } from './history';
import { paintReviewStep } from './review-step';
import { steps } from './wizard';

Object.assign(steps, {
  start: paintImport,
  file: paintFileStep,
  columns: paintColumnsStep,
  review: (): void => { void paintReviewStep(); },
  history: (): void => { void paintImports(); },
});

export { paintImport, paintImports };
