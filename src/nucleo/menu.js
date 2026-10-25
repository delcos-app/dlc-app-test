// nucleo/menu.js · el menú está en src/app/core/navigation/menu (v2.426.0). Aquí quedan el estado que leen y cambian otras partes
// (MENU_FIRMA, FAB_RZ), los objetos compartidos (los mismos que en src/app) y los nombres que usan el legado, los puentes y las pruebas.

const MENU_GRUPOS = window.delcos.nav.MENU_GROUPS;

const MENU_FIJO = window.delcos.nav.MENU_FIXED;

const MENU_FUERA = window.delcos.nav.MENU_OUT;

let MENU_FIRMA = '';

let FAB_RZ = 0;

const menuPrefs = () => window.delcos.nav.menuPrefs();

const menuEscritorio = () => window.delcos.nav.isDesktopMenu();

const menuPlegado = () => window.delcos.nav.isMenuFolded();

const menuRehacer = () => window.delcos.nav.redoMenu();

const menuNombres = () => window.delcos.nav.menuNames();

function menuTip(b) { return window.delcos.nav.menuTip(b); }
function aplicarPermisosMenuPaso1() { return window.delcos.nav.lockModules(); }
function aplicarPermisosMenuPaso2() { iconosMenu(); }
function aplicarPermisosMenuPaso3() { return window.delcos.nav.orderAfterPermissions(); }
function aplicarPermisosMenuBase() { return window.delcos.nav.showAllowedModules(); }
function ordenarCabeceraMovil(sec) { return window.delcos.nav.mobileHeader(sec); }
function ordenarMenu() { return window.delcos.nav.orderMenu(); }
function candadoSecciones() { return window.delcos.nav.lockSections(); }
function aplicarNombresMenu() { return window.delcos.nav.applyMenuNames(); }
function medirBnav() { return window.delcos.nav.measureBottomBar(); }
function fabAOrdenador() { return window.delcos.nav.fabToDesktop(); }
function menuPersonalizar() { return window.delcos.nav.customiseDesktopMenu(); }
function abrirMasMovil() { return window.delcos.nav.openMoreMenu(); }
