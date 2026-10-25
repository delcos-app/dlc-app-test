/* ============================================================
   DLC OS 2.0 · Entrega 7: mapa, móvil y avisos de versión
   v2.424.0: la barra inferior, «Ver mapa» y el aviso de versión nueva están en src/app/core/legacy-a/shell-extras.ts.
   ============================================================ */

let MODO_MAPA = false;
window.delcos.legacyA.listenToBottomBarAndMap();
window.delcos.legacyA.watchNewVersion();
