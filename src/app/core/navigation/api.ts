/**
 * Navigation core (v2.426.0): pages, reveal, links, the «Volver» stack, the menus and startup, registered as window.delcos.nav. The
 * legacy names of src/nucleo/menu.js, navegacion.js, arranque.js and dispositivo.js are one-line adapters to these.
 */
import { customiseMenu } from './menu/customise';
import { wireDrag } from './menu/drag';
import { customiseMobileMenu } from './menu/mobile-customise';
import { setMobileCustomise } from './menu/mobile';

export { isMobileWidth, openApp, start } from '../startup';
export { backToMySession, backToTestData, followLink, pager, returnAfterReload, screenAfterReload, screenName } from './links';
export {
  applyMenuNames, isDesktopMenu, isMenuFolded, lockModules, lockSections, MENU_FIXED, MENU_GROUPS, menuGroups, menuNames, menuPrefs, menuTip,
  orderAfterPermissions, orderMenu, pageButtons, redoMenu, showAllowedModules,
} from './menu/groups';
export { BAR_DEFAULT, bottomBar, fabToDesktop, measureBottomBar, MENU_OUT, mobileHeader, mobileName, openMoreMenu } from './menu/mobile';
export { loadPage, PAGES } from './pages';
export { arrive, comet, raisePageAction, refreshBelow, reveal, steady } from './reveal';
export { BACK_STACK, backButton, freeze, openView, sameView, VIEW_TITLES } from './views';
export { customiseMobileMenu };

setMobileCustomise(customiseMobileMenu);

/** «Personalizar menú» on desktop (opens or closes the panel). */
export const customiseDesktopMenu = (): void => { customiseMenu(wireDrag); };
