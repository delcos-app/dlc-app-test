// @ts-check
// servicios/permisos.js · está en src/app/core/permissions.ts (v2.425.0). Estos nombres se quedan: todo el código viejo, los puentes y las
// pruebas los usan. Normas: docs/normas_codigo.md.

function puede(c) { return window.delcos.core.permissions.can(c); }
// v2.109.0: los clasificadores son un permiso del rol (antes, administrar o nivel 2 en Configuración)
// Crear o cambiar pedidos y pacientes: administración y televenta (el comercial solo consulta lo suyo)
function VE_TODO() { return window.delcos.core.permissions.seesEverything(); }
function puedeMedicoLibre() { return window.delcos.core.permissions.canUseFreeAccount(); }   // v2.329.0
// v2.117.0: «Entrar como otro usuario» es del plan A medida
function puedeModulo(t) { return window.delcos.core.permissions.canUseModule(t); }
function puedeOrganizacion() { return window.delcos.core.permissions.canManageOrganization(); }
function puedeDuplicados() { return window.delcos.core.permissions.canReviewDuplicates(); }
function verArea(t) { return window.delcos.core.permissions.canSeeArea(t); }

const NIVELES = window.delcos.core.permissions.LEVEL_NAMES;

const NIVEL_TXT = window.delcos.core.permissions.LEVEL_NAMES;
