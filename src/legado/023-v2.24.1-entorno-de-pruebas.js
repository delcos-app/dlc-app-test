/* ============================================================
   DLC OS 2.0 · v2.24.1 · Entorno de pruebas
   v2.424.0: la franja del entorno de pruebas está en src/app/core/legacy-a/test-strip.ts y su ayuda, en legacy-a-help.ts.
   pintarFranjaPruebas se queda: Inicio, legado 035, 040 y otros la llaman.
   ============================================================ */

const EN_PRUEBAS = CFG.entorno === 'pruebas';
function pintarFranjaPruebas() { window.delcos.legacyA.paintTestStrip(); }
if (EN_PRUEBAS) {
  pintarFranjaPruebas();
}
