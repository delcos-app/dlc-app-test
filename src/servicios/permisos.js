// @ts-check
// servicios/permisos.js · está en src/app/core/permissions.ts (v2.425.0). Estos nombres se quedan: todo el código viejo, los puentes y las
// pruebas los usan. Normas: docs/normas_codigo.md.

function puedeVerComo(u) { return window.delcos.core.permissions.canImpersonateUser(u); }
function puede(c) { return window.delcos.core.permissions.can(c); }
function puedeEditar() { return window.delcos.core.permissions.canEdit(); }
function puedeEditarTipo(t) { return window.delcos.core.permissions.canEditType(t); }
function puedeCrearTipo(t) { return window.delcos.core.permissions.canCreateType(t); }
function puedeCrear() { return window.delcos.core.permissions.canCreate(); }
function puedeRegistrar() { return window.delcos.core.permissions.canRecord(); }
// v2.109.0: los clasificadores son un permiso del rol (antes, administrar o nivel 2 en Configuración)
function puedeCatalogos() { return window.delcos.core.permissions.canManageLists(); }
// Crear o cambiar pedidos y pacientes: administración y televenta (el comercial solo consulta lo suyo)
function puedeVentas() { return window.delcos.core.permissions.canSell(); }
function VE_TODO() { return window.delcos.core.permissions.seesEverything(); }
function puedeMedicoLibre() { return window.delcos.core.permissions.canUseFreeAccount(); }   // v2.329.0
// v2.117.0: «Entrar como otro usuario» es del plan A medida
function puedeSuplantar() { return window.delcos.core.permissions.canImpersonate(); }
function nivelDe(a) { return window.delcos.core.permissions.levelOf(a); }
function puedeCompras() { return window.delcos.core.permissions.canBuy(); }
function puedeFacturar() { return window.delcos.core.permissions.canInvoice(); }
function nivelDe2(a) { return window.delcos.core.permissions.levelOrNone(a); }
function puedeModulo(t) { return window.delcos.core.permissions.canUseModule(t); }
function puedeOrganizacion() { return window.delcos.core.permissions.canManageOrganization(); }
function puedeDuplicados() { return window.delcos.core.permissions.canReviewDuplicates(); }
function puedeAtribuir() { return window.delcos.core.permissions.canAttribute(); }
function verArea(t) { return window.delcos.core.permissions.canSeeArea(t); }
function puedeEliminarProducto() { return window.delcos.core.permissions.canDeleteProduct(); }

const NIVELES = window.delcos.core.permissions.LEVEL_NAMES;

const NIVEL_TXT = window.delcos.core.permissions.LEVEL_NAMES;
