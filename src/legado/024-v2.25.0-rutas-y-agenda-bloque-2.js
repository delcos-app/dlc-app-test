// @ts-check
/* ============================================================
   DLC OS 2.0 · v2.25.0 · Rutas y Agenda, bloque 2:
   horario de atención en la planificación, reprogramación de lo
   no visitado y semana en cuadrícula
   v2.424.0: las horas estimadas de «Tu día» con los horarios de atención están en src/app/screens/routes/day-estimate.ts.
   estimarDiaBaseBase y estimarDiaBase2 se quedan: legado 077 y 103 las envuelven.
   ============================================================ */

function estimarDiaBase2(citas, fecha) { return window.delcos.legacyA.estimateDayWithRouteHours(citas, fecha); }
function estimarDiaBaseBase(citas, fecha) { return window.delcos.legacyA.estimateDayBase(citas, fecha); }
