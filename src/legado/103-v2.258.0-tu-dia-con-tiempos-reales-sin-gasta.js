// «Tu día» con tiempos reales: en src/app/core/layers/agenda-glue.ts (v2.424.0).
let TD_REAL = null, TD_CALC = false;   // { k, mapa: Map('a>b' → minutos), t } · TD_CALC: calculando la clave (sin volver a entrar)
function estimarDia(citas, fecha, ...x) { return window.delcos.layers.estimateDay(citas, fecha, x); }
