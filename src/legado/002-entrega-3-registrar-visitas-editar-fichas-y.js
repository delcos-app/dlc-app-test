// @ts-check
/* ============================================================
   DLC OS 2.0 · Entrega 3: registrar visitas, editar fichas y altas
   v2.424.0: las acciones de la ficha, los botones de cerrar y «Crear nuevo» están en src/app/screens/accounts/card-actions.ts.
   alternarUrgenteBase se queda: legado 117 la envuelve como alternarUrgente.
   ============================================================ */

function alternarUrgenteBase(id, esUrgente) { return window.delcos.legacyA.toggleUrgent(id, esUrgente); }

window.delcos.legacyA.listenToCardActions();
