/**
 * The legacy layers 080–161 folded into src/app (v2.424.0). Each install runs from its legado file, at the same place of the load
 * order (listeners, db.rpc wrappers and dialog patches keep their order). The legacy names that other code, «‹ Volver» or the tests
 * call (arbolCfgUnico, aplicarPermisosMenu, pintarBnav, estimarDia…) stay as one-line adapters of these functions.
 */
export { estimateDay, installAgendaListeners, installTeamToggle, toggleUrgent } from './agenda-glue';
export { installDesktopAddButton, installFloatingButton, installPasswordEyes, installRefusedChanges, installRoundAddButton, installScanner, paintConnection } from './device-glue';
export { installBack, installCentreLinks, installClosedWhileLoading, installSheetLook } from './dialogs';
export { installAccountTypeFilter, installCustomerDoctorFilter, installFilterMemory, installListIndicators, installListListeners, installOrderCards, mountPeriod } from './list-glue';
export { applyLabel, installBottomBarMeasure, installFirstReveal, installMenuDetails, installMenuNames, installStartDetails, paintBottomBar, summariseHelp } from './navigation-glue';
export { installFrozenChanges, installFrozenTabs, installPageSave, installSettingsParts } from './page-glue';
export { installRemovedAccounts, installRemovedCustomers, installRemovedProducts } from './removed-records';
export { installOrderParameter, installPdfTemplates, installPreloadedAnswers, installRefreshAfterAccountWrites, installRememberedSorts, installReportedFilter, installSlowReadRetry } from './rpc-hooks';
export { applyMenuPermissions, installSalesModules, loadAdmin } from './sales-modules';
export { installSaveFeedback } from './save-feedback';
export { installAccessChecks, installCentrePaymentState, installExpiredLink, installMaterialForCentres, installProfessionalSettingsHelp } from './session-glue';
export { installSettingsPolish, polishSettings } from './settings-polish';
export { installSettingsSearchWords, settingsTree } from './settings-tree';
export { installRememberedSortColumns, installTableSort } from './table-sort';
