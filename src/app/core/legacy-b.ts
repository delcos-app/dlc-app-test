/**
 * What legado 025–049 did, folded into src/app (v2.424.0) and registered as window.delcos.legacyB: each legado file now calls
 * these at its own place in the load order (the order of listeners and of db.rpc layers is kept), and the legacy names other
 * files, «‹ Volver» or the tests use stay there as one-line adapters.
 */
export { addMapCloseButton, hideAdminMenu, keepPortrait, limitLocalCache, loadPlanUsage, loadPublicBrand, markSignedOut, pollBell, releaseDetachedMaps, renameMenuEntry } from './boot/startup';
export { countPendingReads, invoiceOnConfirm, keepLatestAnswers, rememberOrderProduct } from './boot/rpc-hooks';
export { hideForeignViews, watchIcons, watchTranslations } from './boot/watchers';
export { guardTestReset } from './boot/test-strip';
export { listenToImpersonateAndManual, listenToIndicatorLinks, listenToManualSearch, listenToOrderListLinks, listenToPaymentEmailLinks, listenToTeamButton, listenToWeekPlanLinks } from './boot/entry-points';
export { openMoreMenu, orderMobileToolbars, paintBottomNav } from './mobile/navigation';
export { listenToPickers, placePicker, preparePickerLayer, showVisibleValue } from '../components/date-picker-events';
export { withLoading } from '../components/loading-button';
export { completeRecoveryForm, prepareLoginForm, showAccessNotices, showRecovery } from '../screens/access/recovery';
export { paintCompanyData } from '../screens/billing/company-data';
export { listenToAlertWindows, listenToHideAlerts } from '../screens/home/alert-window';
export { paintTeam } from '../screens/agenda/team-rules';
export { visitDetails } from '../screens/accounts/card/visit-details';
export { keepOnlySalespeople } from '../screens/accounts/salesperson-options';
export { cardsForPeopleOnMobile, listenToMobileSettings } from '../screens/settings/mobile-sections';
