/**
 * Intervenciones (v2.407.0): the list, the editor, the sheet with what was used (batch and serial number), the order and the
 * replenishment in 48 hours. The legacy names pintarCirugias, editarCirugia and verCirugia stay as adapters (page tab of legado
 * 079, notices, the account card, «‹ Volver» and the tests use them).
 */
export { editSurgery } from './editor';
export { paintSurgeries } from './list';
import { backOpener, sheetOpener } from '../../core/layers/dialogs';
import { showSurgery as openSurgerySheet } from './sheet';

/** The sheet look and «‹ Volver», added here instead of wrapping the global name verCirugia (plan 7.3, cut D). */
export const showSurgery = backOpener('verCirugia', sheetOpener(openSurgerySheet));
