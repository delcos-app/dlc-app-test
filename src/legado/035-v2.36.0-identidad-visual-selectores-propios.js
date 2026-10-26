// @ts-check
/* ============================================================
   DLC OS 2.0 · v2.36.0 · Identidad visual, selectores propios de fecha,
   hora y número, espacio del médico con avisos, alertas en ventana,
   asignación de comisiones con fecha desde Comisiones y restablecer
   pruebas solo para la persona responsable
   ============================================================ */

Object.assign(RPC_TTL, { informe_cuenta: 60, mis_notificaciones: 20, asignaciones_esquema_lista: 30 });

/* ---------------- selectores propios: fecha, hora y número ---------------- */

 // v2.440.0: SELPOP, LOGO_CIRC → estado de src/app (plan 6.6), accesible en window

// (v2.183.0: aquí iba la primera versión de abrirCalendario; se redefine entera más abajo)

// (v2.183.0: aquí iba la primera versión de abrirReloj; se redefine entera más abajo)

function valorVisibleBase(inp) { return window.delcos.legacyB.showVisibleValue(inp); }
window.delcos.legacyB.listenToPickers();

/* ---------------- espacio del médico ---------------- */

// Vincular un usuario de tipo Médico con su ficha (Administración → Usuarios → Editar)

