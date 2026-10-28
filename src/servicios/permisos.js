// @ts-check
// servicios/permisos.js · está en src/app/core/permissions.ts (v2.425.0). Estos nombres se quedan: todo el código viejo, los puentes y las
// pruebas los usan. Normas: docs/normas_codigo.md.

// v2.109.0: los clasificadores son un permiso del rol (antes, administrar o nivel 2 en Configuración)
// Crear o cambiar pedidos y pacientes: administración y televenta (el comercial solo consulta lo suyo)
function puedeMedicoLibre() { return window.delcos.core.permissions.canUseFreeAccount(); }   // v2.329.0
// v2.117.0: «Entrar como otro usuario» es del plan A medida

const NIVELES = window.delcos.core.permissions.LEVEL_NAMES;

const NIVEL_TXT = window.delcos.core.permissions.LEVEL_NAMES;
