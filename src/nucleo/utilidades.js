// @ts-check
// nucleo/utilidades.js · está en src/app/core/utilities.ts y core/vocabulary.ts (v2.425.0). Estos nombres se quedan: todo el código viejo
// los usa. Normas: docs/normas_codigo.md.

/** Elemento por id. Devuelve any: cada id es un tipo distinto (dialog, input, select…) y se resuelve al ejecutar. @type {(id: string) => any} */
function $(id) { return window.delcos.core.byId(id); }
function esc(s) { return window.delcos.core.escapeText(s); }
function nombrePila(n) { return window.delcos.core.vocabulary.firstName(n); }
function iniciales(n) { return window.delcos.core.vocabulary.initials(n); }
function conCatch(b) { return window.delcos.core.withCatch(b); }
function nombreApp() { return window.delcos.core.appName(); }
function hexRGB(h) { return window.delcos.core.hexToRgb(h); }

let temporizador;
