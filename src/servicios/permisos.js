// servicios/permisos.js · funciones llevadas aquí desde src/legado (bloque 6 del plan): todavía sin separar la vista de los datos.
// Solo declaraciones de función: el orden dentro del archivo no cambia nada. Normas: docs/normas_codigo.md.

function puedeVerComo(u) {
  return !!(PERFIL && u && (puede('administrar') || ((PERFIL.areas || {}).U || 0) >= 3) && !suplantando() && u.id !== PERFIL.id && u.activo
    && !rolPuede(u.rol, 'administrar') && (PLAN_ACTUAL.plan === 'medida' || esInvitado(u)));
}
