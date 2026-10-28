/**
 * The list bar (v2.421.0): the «Lista» page model on top of what each list screen paints (header with the main action and «⋯»,
 * indicators that filter, bar with search, quick filters, «Filtros», «Columnas» and the count, table and its pages, mobile cards),
 * the block pages as tables and the page size. The legacy globals PL, PL_SECC, BLQ and PLG are these same objects; plSync, plCfg,
 * plObservar, plVigilar and the rest stay as one-line adapters (navigation, other legacy code and the tests use them).
 */
import { blocks, configs, FIRST_SCREENS, SECTION_SCREENS } from './configs';
import { listenToBlocks, listenToScreens, listenToSections } from './events';
import { observe, watch } from './observer';

export { convertBlocks, filterBlocks } from './blocks-table';
export { blocks, configOf, configs } from './configs';
export { indicatorsHtml, loadIndicators } from './indicators';
export { observe, watch } from './observer';
export { overridePageSize, PAGE_SIZES, savePageSize, storedPageSize } from './page-size';
export { chosenGroups, sections } from './state';
export { syncListBar } from './sync';
export { icon } from './text';
export { toolbarHtml } from './toolbar';

/** Cuentas and Clientes: observed and listened to from legado 084's place in the load order. */
export function startScreens(): void {
  FIRST_SCREENS.forEach(observe);
  listenToScreens();
}

/** Ventas, Facturación and Productos (legado 086's place): their capture listeners answer before the general ones. */
export function startSections(): void {
  SECTION_SCREENS.forEach(observe);
  listenToSections();
}

/** The block pages (legado 087's place); then every list screen is watched in case its section is a new element. */
export function startBlocks(): void {
  listenToBlocks();
  Object.keys(blocks).forEach(observe);
  Object.keys(configs).forEach(watch);
}
