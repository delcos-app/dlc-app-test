// @ts-check
/* ============================================================
   DLC OS 2.0 · v2.39.0 · Paradas del plan con ficha y nota,
   configuración completa en el panel (sin ventanas ni saltos),
   VeriFactu explicado, manual con explicación antes de ir,
   preferencias con contexto y limpieza para que no se acumule lentitud
   ============================================================ */

/* ---------------- rendimiento: memoria y mapas ---------------- */

// Caché del dispositivo con tope: se guardan las 60 consultas más recientes
window.delcos.legacyB.limitLocalCache();
// Cada mapa se libera cuando su pantalla desaparece (antes quedaban vivos en memoria)
window.delcos.legacyB.releaseDetachedMaps();

/* ---------------- Configuración: todo se muestra en el panel de la derecha ---------------- */
// La ventana dentro del panel está en src/app/components/embedded-window (v2.422.0); aquí, en su sitio de siempre, se protege la ventana
// (va antes que los parches de legado 072)
window.delcos.components.embeddedWindow.guardPanelDialog(/** @type {HTMLDialogElement} */ (window.delcos.core.byId('dlg')));

/* ---------------- Manual: se explica antes de llevarte a ningún sitio ---------------- */

window.delcos.legacyB.listenToManualSearch();
