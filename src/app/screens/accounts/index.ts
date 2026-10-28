/**
 * Cuentas screen, migrated piece by piece (strangler): the account card is an explicit list of sections (v2.401.0) with its base, timetable notice and units in TypeScript (v2.402.0); the list view (search, table, chips: v2.405.0) and the columns model; the map (v2.414.0),
 * Duplicados, the centre sheet and «Cerca de mí» (v2.417.0); the editor, the saved filters, the timetables, the portfolio and the bar (v2.419.0).
 * Plan 7.3 (cut D2): the screen is loaded on first use (chunk.ts → min/chunks/accounts.js, functions in lazy.ts). What other
 * screens, the legacy code and the tests read at once stays in the core: the columns, the saved filters and their options, the
 * timetables, the new account names and the private consultation, the account picker of the forms, the bar of the list and the
 * startup listeners (listeners.ts), which say what was pressed and call the chunk.
 */
import { backOpener, sheetOpener } from '../../core/layers/dialogs';
import { openCard, showCentreSheet } from './lazy';

export {
  answerDayPickerClick, answerDuplicatesClick, centreFromLocation, centreList, changeState, consultationHtml, loadDuplicates, markLocated,
  openColumnsPanel, openEditor, paintAccountsHeader, paintCentrePicker, paintMap, paintNearby, readDays, refreshPortal, searchAccounts,
  searchNearby, setAccountOut, setCentre, showPortfolio,
} from './lazy';
export { columnSettings, saveColumns } from './list/columns';
export { hoursText, isPrivateConsultation, newAccountNames, privateConsultation } from './editor-form/model';
export { pickAccount } from './account-picker';
export { applySavedFilter, countFilter, currentFilter, filterText } from './filters/saved';
export { filterOptionsHtml, loadFilters } from './filters/options';
export { missingTimetable, nextAttendanceDay, otherCentreWithConsultation, withTimetables } from './timetable';
export { arrangeHeader, refreshBar } from './list/bar';

// «‹ Volver» (and the sheet look of the centre), added to the screen's own functions instead of wrapping the global names abrirFicha
// and fichaCentro (plan 7.3, cut D)
export const openAccountCard = backOpener('abrirFicha', openCard);
export const showCentre = backOpener('fichaCentro', sheetOpener(showCentreSheet));
