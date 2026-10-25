/**
 * Productos (v2.413.0): the screen and its tabs, the catalog, the services, the stock with its batches, traceability and
 * movements, the stores and the material in deposit at a centre. The legacy names cargarProductosModulo, pintarProductos,
 * fichaStock, verDeposito and pintarAlmacenes2 stay as adapters. The catalog loaders, the product editor and the visit material
 * stay in legacy (Pedidos, Visita and Configuración use them).
 */
export { paintProducts } from './catalog';
export { showDeposit } from './deposit';
export { loadProductsModule } from './page';
export { editService, paintServices } from './services';
export { paintStock } from './stock';
export { stockMovement } from './movement';
export { showStock, traceability } from './stock-sheet';
export { editStores, paintStores } from './stores';
// v2.427.0: the product editor and the visit material
export { editProduct, paintVisitMaterial, promotedProducts } from './editor';
