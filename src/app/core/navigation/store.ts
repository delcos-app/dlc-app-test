/**
 * Navigation: its state in one object (plan 6.6, v2.439.0) instead of loose legacy globals. The legacy names (TAB, TAB_ANTERIOR, APP_VISIBLE…)
 * stay on window as accessors to this same object, for the remaining legacy code and the tests.
 */
import { exposeLegacyNames } from '../../state/legacy-names';

export interface NavigationStore {
  screen: string;
  previousScreen: string | null;
  appVisible: boolean;
  via: string | null;
  pageTabs: PageTab;
  view: unknown;
  backClick: { d: Element; t: number } | null;
  backPending: boolean;
  backReopening: boolean;
  abort: AbortController;
  generation: number;
  menuSignature: string;
  fabResize: number;
  pendingReads: number;
  platformMode: boolean;
  pageKey: string;
  saveButtonFrame: number;
  pickerPopup: HTMLElement | null;
  pendingEnhancements: Set<Element>;
  enhanceFrame: number;
  scannerPending: boolean;
}

export const navigationStore: NavigationStore = {
  screen: 'inicio',
  previousScreen: 'inicio',
  appVisible: false,
  via: null,
  pageTabs: {},
  view: null,
  backClick: null,
  backPending: false,
  backReopening: false,
  abort: new AbortController(),
  generation: 0,
  menuSignature: '',
  fabResize: 0,
  pendingReads: 0,
  platformMode: false,
  pageKey: '',
  saveButtonFrame: 0,
  pickerPopup: null,
  pendingEnhancements: new Set(),
  enhanceFrame: 0,
  scannerPending: false,
};

exposeLegacyNames(navigationStore, [
  ['TAB', 'screen'],
  ['TAB_ANTERIOR', 'previousScreen'],
  ['APP_VISIBLE', 'appVisible'],
  ['VIA_IR', 'via'],
  ['PAG_TAB', 'pageTabs'],
  ['VISTA', 'view'],
  ['VUELTA_CLIC', 'backClick'],
  ['VUELTA_PONER', 'backPending'],
  ['VUELTA_REABRIENDO', 'backReopening'],
  ['NAV_CTRL', 'abort'],
  ['NAV_GEN', 'generation'],
  ['MENU_FIRMA', 'menuSignature'],
  ['FAB_RZ', 'fabResize'],
  ['PEND', 'pendingReads'],
  ['MODO_PLATAFORMA', 'platformMode'],
  ['PAG_CLAVE', 'pageKey'],
  ['PAG_GUARDA_RAF', 'saveButtonFrame'],
  ['SELPOP', 'pickerPopup'],
  ['MEJ_PEND', 'pendingEnhancements'],
  ['MEJ_RAF', 'enhanceFrame'],
  ['ESC_PEND', 'scannerPending'],
]);
