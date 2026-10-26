// @ts-check
// «Tu día» con tiempos reales: en src/app/core/layers/agenda-glue.ts (v2.424.0).
 // v2.440.0: TD_REAL, TD_CALC → estado de src/app (plan 6.6), accesible en window   // { k, mapa: Map('a>b' → minutos), t } · TD_CALC: calculando la clave (sin volver a entrar)
function estimarDia(citas, fecha, ...x) { return window.delcos.layers.estimateDay(citas, fecha, x); }
