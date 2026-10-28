import * as components from '../components';
import * as legacyFreeCoreServices from '../core/services';
import * as legacyFreeScreensSettings from '../screens/settings';
import { accountsStore } from '../screens/accounts/store';
import * as legacyFreeScreensOrders from '../screens/orders';
import * as legacyFreeCoreLeftovers from '../core/leftovers';
import * as legacyFreeScreensCustomers from '../screens/customers';
import * as legacyFreeScreensOpportunities from '../screens/opportunities';
/**
 * Bridge of Clientes to the legacy code (kept apart from bridge.ts, which is at its size limit). Its filters stay in the legacy
 * PAC (the list bar, the custom field filters and the account card fill it too); the customer editor is tied to calls and Pedidos.
 */
export type CustomerFilters = typeof PAC;
export interface CustomersPage { total: number; filas?: unknown[] | null }
export interface ContactRecord { id: string; nombre: string }

export const customersLegacy = {
  filters: (): CustomerFilters => PAC,
  canSell: (): boolean => Boolean(legacyFreeCoreServices.permissions.canSell()),
  editCustomer: (customer: object, onSave: (customer: ContactRecord) => void): void => {
    legacyFreeCoreLeftovers.editContact(customer as Record<string, unknown>, saved => { onSave(saved as ContactRecord); }, null);
  },
  orderPill: (state: string): string => legacyFreeScreensOrders.statePill(state),
  newSale: (preset: object): void => { void legacyFreeScreensOpportunities.editOpportunity(preset, null); },
  shownCustomer: (): string | null => accountsStore.cardPatients as string | null,
  setShownCustomer: (id: string | null): void => { accountsStore.cardPatients = id; },
  forgetShownAccount: (): void => { accountsStore.shownId = null; },
  visibleFieldColumns: (): CustomField[] => components.visibleFields('cliente'),
  fieldHeaders: (fields: readonly CustomField[]): string => components.columnHeaders(fields),
  widenGrid: (grid: Element | null, count: number): void => { components.widenGrid(grid, count); },
  fieldFilters: (state: Record<string, unknown>): string => camposFiltros('cliente', state, 'pfcp'),
  bindFieldFilters: (zone: Element, state: Record<string, unknown>, onChange: () => void): void => { legacyFreeScreensSettings.bindCustomFieldFilters(zone, state, onChange); },
  showLoading: (element: HTMLElement | null, text: string): void => { components.showLoading(element, text); },
  clearModules: (except: string): void => { legacyFreeCoreServices.session.emptyModules(except); },
  customFields: (id: string, container: Element | null): Promise<void> => legacyFreeScreensSettings.paintCustomFieldsBlock(('contactos'), id, container),
  forgetPreloads: (): void => { DB_PRE.clear(); },
  /** Through the global name (the list bar and Pedidos call it too). */
  repaintList: (): void => { void legacyFreeScreensCustomers.listCustomers(); },
};
