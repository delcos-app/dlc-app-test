// @ts-check
// componentes/teclado.js · las listas con el teclado están en src/app/components/keyboard.ts (v2.416.0). Estos nombres se
// quedan: la escucha de las flechas y de Intro (legado 071) los usa.

/** @param {HTMLElement} inp */
function teclaLista(inp) { return window.delcos.components.resultsOf(inp); }
/** @param {Element} l */
function teclaItems(l) { return window.delcos.components.listItems(l); }
/** @param {HTMLElement} x */
function teclaActivar(x) { window.delcos.components.activateItem(x); }
