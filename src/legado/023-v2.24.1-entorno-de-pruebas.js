// @ts-check
/* ============================================================
   DLC OS 2.0 · v2.24.1 · Entorno de pruebas
   v2.424.0: la franja del entorno de pruebas está en src/app/core/legacy-a/test-strip.ts y su ayuda, en legacy-a-help.ts.
   Quién la pinta en cada momento (la franja, con sus botones, y luego la marca «Pruebas») está en esa misma pieza.
   ============================================================ */

const EN_PRUEBAS = CFG.entorno === 'pruebas';
if (EN_PRUEBAS) {
  window.delcos.legacyA.paintTestStrip();
}
