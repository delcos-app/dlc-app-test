/* ============================================================
   DLC OS 2.0 · v2.40.0 · Pantallas y ventanas que aparecen completas
   (con indicador de carga mientras llegan los datos), alertas que se
   pueden ocultar y recuperar, acceso y cierre de sesión sin menú y
   confirmación al volver a los datos de partida
   ============================================================ */

Object.assign(RPC_TTL, { mis_alertas_descartadas: 30 });

/* ---------------- carga en bloque ---------------- */

// Módulos: al entrar, la pantalla se muestra entera cuando han llegado todos sus datos (el menú se ve siempre)
let PEND = 0;
window.delcos.legacyB.countPendingReads();

/* ---------------- alertas: ocultar y recuperar ---------------- */

// Ocultar desde la ventana de la alerta
window.delcos.legacyB.listenToHideAlerts();

/* ---------------- acceso y cierre de sesión: sin menú ---------------- */

window.delcos.legacyB.markSignedOut();

/* ---------------- pruebas: volver a los datos de partida con confirmación ---------------- */

window.delcos.legacyB.guardTestReset();
