/**
 * Concursos (v2.409.0): the list (en marcha, contratos, cerrados), the editor, the window with its lots and prices and the
 * expiry warnings. The legacy names pintarConcursos and verConcurso stay as adapters (page tabs and dialog-close listener of
 * legado 080, notices, links, «‹ Volver» and the tests use them).
 */
export { editTender } from './editor';
export { paintTenders, type TenderView } from './list';
export { editWarnings } from './warnings';
import { backOpener, sheetOpener } from '../../core/layers/dialogs';
import { showTender as openTenderSheet } from './sheet';

/** The sheet look and «‹ Volver», added here instead of wrapping the global name verConcurso (plan 7.3, cut D). */
export const showTender = backOpener('verConcurso', sheetOpener(openTenderSheet));
