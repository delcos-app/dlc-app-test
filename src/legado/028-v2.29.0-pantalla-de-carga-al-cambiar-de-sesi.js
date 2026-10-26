// @ts-check
/* ============================================================
   DLC OS 2.0 · v2.29.0 · Pantalla de carga al cambiar de sesión,
   agenda sin parpadeos, más indicadores en Inicio y Analítica visual
   ============================================================ */

/* ---------------- agenda: una sola transición al cambiar de vista ---------------- */

// Desde Rutas: «Planificar la semana» abre el planificador cuando la semana ya está pintada
window.delcos.legacyB.listenToWeekPlanLinks();

/* ---------------- Inicio: más indicadores ---------------- */

// Quien ya tenía indicadores guardados recibe los nuevos principales una vez (luego puede ocultarlos)

window.delcos.legacyB.listenToIndicatorLinks();

/* ---------------- Analítica: resumen visual ---------------- */

// (v2.183.0: aquí iba la primera versión de pintarResumenAnalitica; se redefine entera más abajo)

