/**
 * Parque instalado (v2.409.0): the list with reviews and expiring contracts, the editor and the sheet with its reviews. The legacy
 * names pintarParque, editarEquipo and verEquipo stay as adapters (page tab and dialog-close listener of legado 080, the account
 * card, «‹ Volver», links and the tests use them).
 */
export { editEquipment } from './editor';
export { paintEquipment } from './list';
export { expiryPill, reviewPill } from './model';
import { backOpener, sheetOpener } from '../../core/layers/dialogs';
import { showEquipment as openEquipmentSheet } from './sheet';

/** The sheet look and «‹ Volver», added here instead of wrapping the global name verEquipo (plan 7.3, cut D). */
export const showEquipment = backOpener('verEquipo', sheetOpener(openEquipmentSheet));
