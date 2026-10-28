/**
 * What legado 000–024 did, now in src/app (v2.424.0). Each legado file calls these at its own place in the load order (the order of
 * listeners matters: some stop the event for those registered later), and keeps the legacy names other code uses as adapters.
 */
export { forgetUnrememberedSession, linkKind, patchClassList, readLinkError, storedList, storedObject } from './early';
export { databaseOptions } from './database';
export { switchScreen } from './switch-screen';
export { startShell } from './shell-listeners';
export { listenToBottomBarAndMap, listenToDirectoryButtons, listenToSalespersonFilter, registerServiceWorker, startSelectorsAndWindows, watchNewVersion } from './shell-extras';
export { paintConnection, watchConnection } from './connection';
export { startPasswordFlows } from './password';
export { startGlobalSearch } from './global-search';
export { installRequestCache } from './request-cache';
export { listenToHelpButtons, listenToOutsideClicks, watchListsAndHelp } from './outside-clicks';
export { showApp } from './show-app';
export { paintTestStrip } from './test-strip';
export { addHelpAnchors, appointmentStates, cacheMoreRequests, unitsLegend } from './load-time';
export { listenToCardActions, toggleUrgent } from '../../screens/accounts/card-actions';
export { openTools } from '../../screens/accounts/list/tools-panel';
export { listenToSaveFilter } from '../../screens/accounts/list/save-filter';
export { listenToAddToAgenda, listenToAppointmentClicks, listenToDayMenus } from '../../screens/agenda/appointment-clicks';
export { km, listenToNavigationLinks, listenToRouteButtons, refreshRouteAfterDialog, refreshRouteBar } from '../../screens/routes/route-listeners';
export { estimateDayBase, estimateDayWithRouteHours } from '../../screens/routes/day-estimate';
export { listenToSectionButtons, loadAdmin } from '../../screens/settings/admin-page';
export { assignPortfolio, assignPortfolioToUser } from '../../screens/settings/portfolio-assign';
export { mountPeriod } from '../../components/period-picker';

