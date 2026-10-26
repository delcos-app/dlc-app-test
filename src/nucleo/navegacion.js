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

function volverTrasF5(v) { return window.delcos.nav.returnAfterReload(v); }
function cometa() { return window.delcos.nav.comet(); }
function estable(el, max, desde) { return window.delcos.nav.steady(el, max, desde); }
function pantallaTrasF5() { return window.delcos.nav.screenAfterReload(); }
function nombrePantalla(t) { return window.delcos.nav.screenName(t); }
function refrescarDebajo() { return window.delcos.nav.refreshBelow(); }
function llegar(el) { return window.delcos.nav.arrive(el); }
function subirAccionPagina() { return window.delcos.nav.raisePageAction(); }
function vistaBoton(v, d0) { return window.delcos.nav.backButton(v, d0); }
function arrancar() { return window.delcos.nav.start(); }
function paginador(el, total, pagina, alCambiar, alCambiarTam) { return window.delcos.nav.pager(el, { total, page: pagina }, { onPage: alCambiar, onSize: alCambiarTam }); }
function irEnlace(e) { return window.delcos.nav.followLink(e); }
function cargarPagina(t) { return window.delcos.nav.loadPage(t); }
function revelar(el, max, desde) { return window.delcos.nav.reveal(el, max, desde); }
function congelar(sec) { return window.delcos.nav.freeze(sec); }
