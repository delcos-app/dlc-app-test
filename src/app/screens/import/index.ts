/**
 * Configuración → Importar datos (v2.410.0): the wizard «Nueva importación» (what, file, columns, review and run) and the list
 * «Importaciones» with undo. The legacy names pintarImportar and pintarImportaciones stay as adapters (Configuración opens them),
 * and impNorm (Configuración and the manual compare texts with it).
 */
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

export { normaliseHeader } from './matching';
export { paintImport, paintImports };
