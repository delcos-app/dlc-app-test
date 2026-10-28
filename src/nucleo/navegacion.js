// @ts-check
// nucleo/navegacion.js · páginas, revelado, enlaces, «‹ Volver» y arranque están en src/app/core/navigation y core/startup (v2.426.0).
// Aquí quedan el estado que leen y cambian otras partes, los objetos compartidos (los mismos que en src/app) y los nombres que usan el
// legado, los puentes, «‹ Volver» y las pruebas.

 // v2.440.0: TAB_ANTERIOR → estado de src/app (plan 6.6), accesible en window

 // v2.440.0: APP_VISIBLE → estado de src/app (plan 6.6), accesible en window

const PAGINAS = window.delcos.nav.PAGES;

 // v2.440.0: VIA_IR → estado de src/app (plan 6.6), accesible en window

let CLIC_PESTANA = null;

let IR_DESDE_MENU = false;

let ACCION_PAG_PEND = false;

const VUELTA = window.delcos.nav.BACK_STACK;

const VISTA_TITULO = window.delcos.nav.VIEW_TITLES;

const vistaDlg = () => window.delcos.nav.openView();

const vistaIgual = (a, b) => window.delcos.nav.sameView(a, b);

