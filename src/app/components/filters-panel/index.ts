/**
 * «Filtros y columnas» (v2.419.0): the button, the screen's panel, the side panel, the automatic filters per column, the chips and the
 * counter. The legacy names htPreparar, htColocarBoton, htDevolver, htLateralAbierto, htContador, htChips and htAplicarColumnas stay
 * as adapters in componentes/filtros.js (legado 054–057 and the list bar call them).
 */
export { applyColumns } from './columns';
export { activeCount, counter, paintChips } from './counter';
export { paintPanel } from './panel';
export { openSide, placeButton, prepare } from './prepare';
export { giveBack, sideOpen } from './side';
