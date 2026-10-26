// @ts-check
/* ============================================================
   DLC OS 2.0 · Entrega 7: mapa, móvil y avisos de versión
   v2.424.0: la barra inferior, «Ver mapa» y el aviso de versión nueva están en src/app/core/legacy-a/shell-extras.ts.
   ============================================================ */

 // v2.440.0: MODO_MAPA → estado de src/app (plan 6.6), accesible en window
window.delcos.legacyA.listenToBottomBarAndMap();
window.delcos.legacyA.watchNewVersion();
