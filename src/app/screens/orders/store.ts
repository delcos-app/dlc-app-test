/**
 * Pedidos and Compras: its state in one object (plan 6.6, v2.439.0) instead of loose legacy globals. The legacy names (PEDSEC, PEDF, PEDPAG…)
 * stay on window as accessors to this same object, for the remaining legacy code and the tests.
 */
import { exposeLegacyNames } from '../../state/legacy-names';

export interface OrdersStore {
  section: string;
  filters: Record<string, unknown>;
  page: number;
  orders: unknown[];
  contractPrices: { cuenta: string | null; precios: Record<string, unknown> };
  paymentState: { solo_lectura?: boolean } | null;
  stores: PurchaseStore[];
  suppliers: PurchaseSupplier[];
  distributors: { id: string; nombre: string; email?: string | null; telefono?: string | null; activo?: boolean }[] | null;
  pendingCall: string | null;
  invoicePage: number;
  callsPage: number;
}

export const ordersStore: OrdersStore = {
  section: 'ventas',
  filters: {},
  page: 0,
  orders: [],
  contractPrices: { cuenta: null, precios: {} },
  paymentState: null,
  stores: [],
  suppliers: [],
  distributors: null,
  pendingCall: null,
  invoicePage: 0,
  callsPage: 0,
};

exposeLegacyNames(ordersStore, [
  ['PEDSEC', 'section'],
  ['PEDF', 'filters'],
  ['PEDPAG', 'page'],
  ['PEDIDOS', 'orders'],
  ['PED_PRECIOS', 'contractPrices'],
  ['PAGO_ESTADO', 'paymentState'],
  ['ALMACENES', 'stores'],
  ['PROVEEDORES', 'suppliers'],
  ['DISTRIBUIDORES', 'distributors'],
  ['LLAMADA_PEND', 'pendingCall'],
  ['FACPAG', 'invoicePage'],
  ['LLPAG', 'callsPage'],
]);
