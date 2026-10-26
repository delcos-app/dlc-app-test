// @ts-check
/* ============================================================
   DLC OS 2.0 · v2.21.0 · Periodos de fechas, ventas y analítica
   con totales, indicadores en tarjetas, ruta en curso reordenable
   v2.424.0: el selector de periodo está en src/app/components/period-picker.ts y las ayudas, en legacy-a-help.ts.
   montarPeriodoBase se queda: legado 113 la envuelve como montarPeriodo.
   ============================================================ */

function montarPeriodoBase(el, o) { return window.delcos.legacyA.mountPeriod(el, o); }

var PEDSEC_CARGA = null;
