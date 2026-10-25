import * as components from '../components';
import * as legacyFreeCoreServices from '../core/services';
import * as legacyFreeScreensSettings from '../screens/settings';
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
    editorContacto(customer as Record<string, unknown>, saved => { onSave(saved as ContactRecord); });
  },
  orderPill: (state: string): string => pillEstado(state),
  newSale: (preset: object): void => { void nuevaVenta(preset); },
  shownCustomer: (): string | null => FICHA_PAC as string | null,
  setShownCustomer: (id: string | null): void => { FICHA_PAC = id; },
  forgetShownAccount: (): void => { FICHA_ID = null; },
  visibleFieldColumns: (): CustomField[] => components.visibleFields('cliente'),
  fieldHeaders: (fields: readonly CustomField[]): string => components.columnHeaders(fields),
  widenGrid: (grid: Element | null, count: number): void => { components.widenGrid(grid, count); },
  fieldFilters: (state: Record<string, unknown>): string => camposFiltros('cliente', state, 'pfcp'),
  bindFieldFilters: (zone: Element, state: Record<string, unknown>, onChange: () => void): void => { legacyFreeScreensSettings.bindCustomFieldFilters(zone, state, onChange); },
  showLoading: (element: HTMLElement | null, text: string): void => { components.showLoading(element, text); },
  clearModules: (except: string): void => { vaciarModulos(except); },
  customFields: (id: string, container: Element | null): Promise<void> => legacyFreeScreensSettings.paintCustomFieldsBlock(('contactos'), id, container),
  forgetPreloads: (): void => { DB_PRE.clear(); },
  /** Through the global name (the list bar and Pedidos call it too). */
  repaintList: (): void => { void listaPacientes(); },
};
