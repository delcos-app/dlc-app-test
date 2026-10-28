/**
 * Clientes (v2.411.0): the list with its filters, the customer card, the customer picker of an order, deactivating and the quick
 * search. The legacy names cargarPacientes, pintarPacientes, listaPacientes, fichaPaciente, selectorPaciente, bajaCliente and
 * buscarClientes stay as adapters. The customer editor (editorContacto) stays in legacy: it is tied to calls and orders (Pedidos).
 */
export { listCustomers, paintCustomers } from './list';
export { pickCustomer } from './picker';
export { showCustomer } from './sheet';
export { searchCustomers, setCustomerOff } from './status';
import { cachedModuleLoader } from '../../core/legacy-c/module-cache';
import { loadCustomers as paintCustomersPage } from './list';

/** With the cache of the screen, added here instead of wrapping the global name cargarPacientes (plan 7.3, cut D). */
export const loadCustomers = cachedModuleLoader('pacientes', (): Promise<void> => { paintCustomersPage(); return Promise.resolve(); });
