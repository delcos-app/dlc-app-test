/**
 * Navigation: `navigate('agenda')` is the only way to change screen (the legacy `ir()` is now a one-line adapter to it).
 * The rules are the steps below, in order: the first ones run first before switching and last after it.
 * To add a rule, add a step in its place (never wrap `ir`). The screen switch itself is still the legacy `irBase` until every
 * screen is registered in the router.
 */
import { runNavigation, type NavigationStep } from './pipeline';
import * as outer from './steps-outer';
import * as inner from './steps-inner';
import * as legacyFreeCoreLegacyA from '../legacy-a';

export const NAVIGATION_STEPS: readonly NavigationStep[] = [
  outer.resetBackStack,
  outer.professionalPortalOnly,
  outer.loadingComet,
  outer.watchListPage,
  outer.customMenuNames,
  outer.rememberManualReturn,
  outer.announceNavigation,
  outer.singleConfiguration,
  outer.directoryLabel,
  outer.manualHelpButton,
  outer.platformPanel,
  outer.stripeReturnToPlan,
  outer.planSections,
  outer.agendaFromMenuIsToday,
  outer.ordersSections,
  outer.closePageDialog,
  outer.footerMenuMark,
  inner.configToOwnPages,
  inner.closeEmbeddedWindows,
  inner.organizationPage,
  inner.clearPagesWhenLeaving,
  inner.atomicReveal,
  inner.billingSettings,
  inner.loadingIndicatorAfterDelay,
  inner.markNavigationInProgress,
  inner.legacyConfigPages,
  inner.noFlashOnFastLoad,
];

export function navigate(target: string, ...args: unknown[]): void {
  runNavigation(NAVIGATION_STEPS, screen => { legacyFreeCoreLegacyA.switchScreen(screen); }, target, args);
}
