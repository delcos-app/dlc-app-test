/**
 * Compras and Proveedores (v2.409.0): the purchase orders with their indicators, the order window, receiving goods by batch and the
 * suppliers. The legacy names pintarCompras, pintarProveedores, editorCompra and editorProveedor stay as adapters (Pedidos, Inicio,
 * the alerts, legado 058 and the tests use them).
 */
export { paintPurchases } from './list';
export { editSupplier, paintSuppliers } from './suppliers';
import { wideOpener } from '../../core/legacy-c/dialogs';
import { editPurchase as openPurchaseEditor } from './editor';

/** The purchase window opens wide: added here instead of wrapping the global name editorCompra (plan 7.3, cut D). */
export const editPurchase = wideOpener(openPurchaseEditor);
