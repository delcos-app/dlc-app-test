// @ts-check
// componentes/carga.js · los estados de carga están en src/app/components/loading.ts (v2.416.0). Estos nombres se quedan:
// toda la app los usa.

/** @param {string} msg */
function pantallaCarga(msg) { window.delcos.components.showFullLoading(msg); }
/** @param {Element | null} el @param {string} [texto] */
function cargando(el, texto) { window.delcos.components.showLoading(el, texto); }
/** @param {string} t */
function skelCard(t) { return window.delcos.components.cardSkeleton(t); }
function quitarCarga() { window.delcos.components.hideFullLoading(); }
