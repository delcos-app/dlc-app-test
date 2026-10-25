/**
 * Shared components (v2.416.0): small windows, the corner notice, loading states, the date, time and number pickers, charts,
 * custom-field filters and columns, the «i» of help, search highlighting, keyboard lists, consultation hours and the signature.
 * Registered as window.delcos.components: the legacy names in src/componentes are one-line adapters to these.
 */
export * from './charts';
export * from './classifiers';
export { attendanceWindows } from './consultation-hours';
export * from './date-picker';
export { askField, askText, chooseOption, confirmAction, hasSaveButton, isSaveButton, showDialog, tryClose } from './dialogs';
export { addHelpButtons, glueHelp, helpAnchor } from './help';
export { activateItem, listItems, resultsOf } from './keyboard';
export { cardSkeleton, hideFullLoading, showFullLoading, showLoading } from './loading';
export { highlightSearch, isSearchBox } from './search-highlight';
export { signaturePad } from './signature';
export { cacheNotice, noStartNotice, raiseNotice, toast } from './toast';
