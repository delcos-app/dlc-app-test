// @ts-check
// nucleo/menu.js · el menú está en src/app/core/navigation/menu (v2.426.0). Aquí quedan el estado que leen y cambian otras partes
// (MENU_FIRMA, FAB_RZ), los objetos compartidos (los mismos que en src/app) y los nombres que usan el legado, los puentes y las pruebas.

const MENU_GRUPOS = window.delcos.nav.MENU_GROUPS;

const MENU_FIJO = window.delcos.nav.MENU_FIXED;

const MENU_FUERA = window.delcos.nav.MENU_OUT;

 // v2.440.0: MENU_FIRMA → estado de src/app (plan 6.6), accesible en window

 // v2.440.0: FAB_RZ → estado de src/app (plan 6.6), accesible en window

const menuPrefs = () => window.delcos.nav.menuPrefs();

const menuEscritorio = () => window.delcos.nav.isDesktopMenu();

const menuPlegado = () => window.delcos.nav.isMenuFolded();

const menuRehacer = () => window.delcos.nav.redoMenu();

const menuNombres = () => window.delcos.nav.menuNames();

