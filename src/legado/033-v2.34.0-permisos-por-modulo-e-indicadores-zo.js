/* ============================================================
   DLC OS 2.0 · v2.34.0 · Permisos por módulo e indicadores, zonas de
   los comerciales, operativa de pedidos, registro de llamadas,
   comisiones con fecha de efecto, varios meses en la agenda y
   «Calidad del dato»
   ============================================================ */

Object.assign(RPC_TTL, { operativa_pendiente: 20, llamadas_lista: 20, llamadas_resumen: 30, calidad_datos: 60, zonas_resumen: 120 });

/* ---------------- permisos nuevos ---------------- */

/* aplicarPermisosMenu: la parte base y, en orden, cada paso que se le añade (antes eran 3 capas separadas). */
function aplicarPermisosMenuBase2() {
  aplicarPermisosMenuBase();
  aplicarPermisosMenuPaso1();
  aplicarPermisosMenuPaso2();
  aplicarPermisosMenuPaso3();
}

/* ---------------- operativa de los pedidos ---------------- */

// (v2.183.0: aquí iba la primera versión de pintarOperativa; se redefine entera más abajo)

/* ---------------- «Seguimiento» pasa a «Calidad del dato» ---------------- */

window.delcos.legacyB.renameMenuEntry('seguimiento');

/* ---------------- ayudas y manual ---------------- */

