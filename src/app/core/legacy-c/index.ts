/**
 * The legacy layers 050–079 folded into src/app (v2.425.0). Each legado file now calls its start function at the same place of the
 * load order (startNNN), so listeners, observers and database wrappers stay in the same order as before; the legacy names other code
 * uses stay as one-line adapters calling the functions exported here.
 */
import { addIconsOf } from './icons';
import { addCompany, addProfileAndPlan, addReportProblem, markMenuNavigation, openOrganizationPage, openOwnPages } from './user-menu';
import { countNetwork, countWrites, limitCallTime, logErrors, readNextReceipt, recordTrail, runQueriesOnce } from './rpc-hooks';
import { watchVersionNotice, checkVersionPeriodically } from './version';
import { keepContactsLabel, applyVocabularyToFixedTexts } from './contacts-label';
import { createColumnsPanel, listenToFieldChips, placeToolsButton, prepareToolsOnChanges, resizeColumnsByDragging, setPanelFilters } from './tools';
import { arrangeEveryScreen, arrangeTableBars, keepOneTitleHelp, listenToSeeMore, nameInEveryText, raisePageAction, renameIndicators, watchAnalyticsChannel, watchBillingSettings, watchModuleSections } from './screen-layout';
import { improveNumbers, noSystemPickers, undoWrongVat, watchFormFields, watchVatFields, watchWideNotes } from './form-fields';
import { cacheModuleLoaders, keepUpdateTime, loaderOnPageChange, watchDialogWrites } from './module-cache';
import { embedWindows, focusOpenedWindows, forgetVisitOnClose, neverHalfOpen, repaintCycleOnClose, repaintEventsOnClose, repaintSurgeriesOnClose, revealWindows, sizeWindows, stackWindows, trackDialogEpoch } from './dialogs';
import { freezeOnTabChange, rememberLogin, rememberPressedTab, summariseNewHelps } from './tabs-and-help';
import { navigateSuggestions, rememberScreenOnReload } from './keys';
import * as pages from './pages';
import { buildMenusSoon, buildSalesMenusSoon, cycleMenu, eventsMenu, padlocksSoon, surgeriesMenu } from './menu-permissions';
import { watchSideMenu } from './side-menu';
import { markerInsteadOfStrip, stripWithBringButton } from './test-environment';
import { markPortalOrderRows } from './order-alerts';
import { coverWhenLeavingOrganization, extrasAreExceptions, finishOrganizationChange } from './platform';
import { cancellationOnStart, forgetPlanReturnLater, paymentOnStart, reportVersionInUse, signUpNotices } from './plan-page';
import { addToAgendaFromCard, checkSamplesBeforeSaving, closePopupOutside, decorateVisitResults, openCentreFromSearch, pullToReload, toggleDayMenu } from './agenda-extras';

export { addIconsOf } from './icons';
export { notificationExplanations } from './notifications';
export { contactLabels, applyContactsLabel } from './contacts-label';
export { openTools, showColumnsPanel } from './tools';
export { vatSelector, visibleValue, withLoading } from './form-fields';
export { moduleStates, paintUpdated } from './module-cache';
export { pendingSince } from './rpc-hooks';
export { summariseHelp } from './tabs-and-help';
export { planModules, hasExtra } from './plans';
export { applyMenuPermissions, applyPlatformMode, showApp } from './menu-permissions';
export { mountSideMenu } from './side-menu';
export { paintOrderAlerts } from './order-alerts';
export { paintNextReceipt, paintPlanPage } from './plan-page';
export { estimateDay, explainNotice } from './agenda-notices';
export { paintPlan } from './agenda-extras';
export { paintCompany, fieldNames } from './company';

export function start050(): void { addIconsOf('050'); watchVersionNotice(); ordenarMenu(); addProfileAndPlan(); }
export function start051(): void { addIconsOf('051'); limitCallTime(); keepContactsLabel(); addCompany(); Object.assign(CFG_ANTES, { marca: ['__empresa', 'marca'], correo: ['__empresa', 'correo'], copias: ['__empresa', 'copias'], empresa: ['__empresa', 'marca'] }); }
export function start053(): void { addIconsOf('053'); logErrors(); addReportProblem(); listenToSeeMore(); }
export function start054(): void { prepareToolsOnChanges(); openOwnPages(); }
export function start055(): void { placeToolsButton(); freezeOnTabChange(); watchVatFields(); }
export function start056(): void { createColumnsPanel(); arrangeEveryScreen(); }
export function start057(): void {
  addIconsOf('057'); countWrites(); watchDialogWrites(); cacheModuleLoaders(); keepUpdateTime(); loaderOnPageChange(); resizeColumnsByDragging();
  watchFormFields(); watchModuleSections(); renameIndicators();
}
export function start058(): void {
  addIconsOf('058'); keepOneTitleHelp(); undoWrongVat(); watchWideNotes(); sizeWindows(); stackWindows(); recordTrail(); watchAnalyticsChannel(); arrangeTableBars(); nameInEveryText();
}
export function start059(): void { countNetwork(); runQueriesOnce(); revealWindows(); }
export function start060(): void { rememberPressedTab(); summariseNewHelps(); watchBillingSettings(); rememberLogin(); }
export function start065(): void { listenToFieldChips(); }
export const start069 = applyVocabularyToFixedTexts;
export function start071(): void {
  mejorarCamposNuevos(document); improveNumbers(); navigateSuggestions(); rememberScreenOnReload(); focusOpenedWindows();
}
export function start072(): void { pages.defineOrganization(); openOrganizationPage(); embedWindows(); }
export function start073(): void {
  pages.defineUsersAndPanel(); buildMenusSoon(); watchSideMenu(); stripWithBringButton(); markPortalOrderRows(); pages.addTestEnvironmentTab(); markerInsteadOfStrip();
  colocarIndPruebas(); markMenuNavigation(); pages.addSalesSections(); buildSalesMenusSoon();
}
export function start074(): void { addIconsOf('074'); closePopupOutside('.agpop', '[data-agdia]'); setPanelFilters(); raisePageAction(); closePopupOutside('.ankpop', '[data-ancfg]'); }
export function start075(): void {
  pages.iconsForAllSections(); extrasAreExceptions(); neverHalfOpen(); pages.addErrorsTab(); reportVersionInUse(); paymentOnStart(); padlocksSoon();
  pages.hideReadOnlyBillingTabs();
}
export function start076(): void {
  cancellationOnStart(); forgetPlanReturnLater(); pages.addRequestsTab(); signUpNotices(); pages.addPlatformTabs(); pages.addPanelMenu(); pages.completePanel();
  coverWhenLeavingOrganization(); finishOrganizationChange(); readNextReceipt();
}
export function start077(): void {
  addToAgendaFromCard(); toggleDayMenu(); noSystemPickers(); closePopupOutside('.agmpop', '#agmtit'); pullToReload(); openCentreFromSearch(); decorateVisitResults();
}
export function start078(): void { checkVersionPeriodically(); sinSelectorDelSistema(document); trackDialogEpoch(); forgetVisitOnClose(); checkSamplesBeforeSaving(); }
export function start079(): void {
  addIconsOf('079'); pages.defineEvents(); repaintEventsOnClose(); eventsMenu();
  addIconsOf('079-1'); pages.defineCycle(); repaintCycleOnClose(); cycleMenu(); pages.coverageInPlans();
  addIconsOf('079-2'); pages.defineSurgeries(); repaintSurgeriesOnClose(); surgeriesMenu();
}
