import { sessionStore } from '../core/session-store';
import { ordersStore } from '../screens/orders/store';
import { billingStore } from '../screens/billing/store';
import { productsStore } from '../screens/products/store';
import { accountsStore } from '../screens/accounts/store';
import * as legacyFreeScreensAccounts from '../screens/accounts';
/**
 * Legacy pieces the list bar still needs (v2.421.0): the icons, the open section of Ventas, Facturación and Productos, the
 * filters of Cuentas and Clientes and their searches, the tools panel and the cache epoch. The page size is read through the
 * global tamPagina each time (the tests replace it).
 */

export const listBarLegacy = {
  pageSize: (): number => tamPagina(),
  userId: (): string => (sessionStore.profile as { id?: string } | null)?.id ?? '',
  /** First icon found among the names (line icons, then emoji ones). */
  icon: (names: readonly string[]): string => svgIco(names.map(name => ICON_NOM[name] ?? ICON_EMOJI[name]).find(Boolean) ?? ''),
  lineIcon: (name: string): string => svgIco(ICON_NOM[name] ?? ''),
  cacheEpoch: (): number => (typeof sessionStore.cacheEpoch === 'undefined' ? 0 : sessionStore.cacheEpoch),
  salesSection: (): string | null => (typeof ordersStore.section === 'undefined' ? null : ordersStore.section),
  billingSection: (): string | null => (typeof billingStore.section === 'undefined' ? null : billingStore.section),
  productsSection: (): string | null => (typeof productsStore.section === 'undefined' ? null : productsStore.section),
  // eslint-disable-next-line id-length -- F is the legacy name of the Cuentas filters
  accountFilters: (): AccountFilters => F,
  customerFilters: (): typeof PAC => PAC,
  searchAccounts: (reset: boolean): void => { void buscar(reset); },
  loadAccountFilters: (): void => { void legacyFreeScreensAccounts.loadFilters(false); },
  searchCustomers: (): void => { void listaPacientes(); },
  openAccountColumns: (): void => { abrirColumnas(); },
  toolsContext: (): string | null => accountsStore.toolsContext,
  /** What the «Filtros y columnas» panel chose per table (the bar's search writes its free text when the screen has no search). */
  tableFilters: (): typeof HT_ESTADO => HT_ESTADO,
  countRows: <T>(name: string, params: Record<string, unknown>): PromiseLike<LegacyResult<T>> => RPC_ORIG<T>(name, params),
};
