// @ts-check
// nucleo/sesion.js · está en src/app/core/session.ts (v2.425.0). Estos nombres se quedan: Usuarios, el menú, la navegación, los puentes y
// las pruebas los usan. Normas: docs/normas_codigo.md.

function entrarComo(id) { return window.delcos.core.session.impersonate(id); }
function comprobarAcceso(forzar) { return window.delcos.core.session.checkAccess(forzar); }
function limpiarDatosLocales() { return window.delcos.core.session.clearLocalData(); }
function pintarBarraSuplantacion() { return window.delcos.core.session.paintImpersonationBar(); }
function prepararCambioOrg(destino) { return window.delcos.core.session.prepareOrganizationChange(destino); }
function vaciarModulos(salvo) { return window.delcos.core.session.emptyModules(salvo); }
function suplantando() { return window.delcos.core.session.impersonating(); }
function esInvitado(u) { return window.delcos.core.session.isGuest(u); }
function queVeInvitado(u) { return window.delcos.core.session.guestSees(u); }

const ERRORES_SESION = window.delcos.core.session.SESSION_ERRORS;
