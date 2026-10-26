// @ts-check
// D-042: el «Guardar» de una página sabe qué ha cambiado, en src/app/core/layers/page-glue.ts (v2.424.0).
const PAG_GUARDA_RE = /^guardar(\s|$)/i, PAG_GUARDA_NO = '#coprueba, #copruebaarriba, .cfuguarda .btn';
window.delcos.layers.installPageSave();
