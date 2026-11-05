/**
 * Productos (v2.413.0): the screen and its tabs, the catalog, the services, the stock with its batches, traceability and
 * movements, the stores, the material in deposit at a centre and the list of every deposit (Depósitos). The legacy names cargarProductosModulo, pintarProductos,
 * fichaStock, verDeposito and pintarAlmacenes2 stay as adapters. The catalog loaders, the product editor and the visit material
 * stay in legacy (Pedidos, Visita and Configuración use them).
 */
export { paintProducts } from './catalog';
export { editService, paintServices } from './services';
export { paintStock } from './stock';
export { stockMovement } from './movement';
export { traceability } from './stock-sheet';
export { editStores, paintStores } from './stores';
// v2.471.0: Depósitos, every centre's deposit in one list (its own menu entry)
export { paintDeposits } from './deposits';
// v2.427.0: the product editor and the visit material
export { editProduct, paintVisitMaterial, promotedProducts } from './editor';
import { backOpener, sheetOpener } from '../../core/layers/dialogs';
import { cachedModuleLoader } from '../../core/legacy-c/module-cache';
import { showDeposit as openDepositSheet } from './deposit';
import { loadProductsModule as paintProductsPage } from './page';
import { showStock as openStockSheet } from './stock-sheet';

// The cache of the screen, the sheet look and «‹ Volver», added to the screen's own functions instead of wrapping the global names
// cargarProductosModulo, fichaStock and verDeposito (plan 7.3, cut D)
export const loadProductsModule = cachedModuleLoader('productos', paintProductsPage);
export const showStock = backOpener('fichaStock', sheetOpener(openStockSheet));
export const showDeposit = backOpener('verDeposito', sheetOpener(openDepositSheet));
