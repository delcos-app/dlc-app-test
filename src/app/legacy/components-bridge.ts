/**
 * What the shared components (src/app/components) still read from legacy: the open picker (SELPOP, closed by legacy listeners),
 * how a picked value is shown and announced, the pending fields to enhance, VAT fields, the touch screen, company and person
 * settings, the help titles and manual anchors, and the filters of the screens with custom fields (v2.416.0).
 */
import * as legacyFreeCoreLegacyC from '../core/legacy-c';
import * as legacyFreeCoreSettings from '../core/settings';
import * as legacyFreeCoreServices from '../core/services';
import { navigationStore } from '../core/navigation/store';
import { ordersStore } from '../screens/orders/store';
import { productsStore } from '../screens/products/store';
export const componentsLegacy = {
  popup: (): HTMLElement | null => navigationStore.pickerPopup,
  setPopup: (popup: HTMLElement | null): void => { navigationStore.pickerPopup = popup; },
  showValue: (input: HTMLInputElement): void => { legacyFreeCoreLegacyC.visibleValue(input); },
  placePopup: (popup: HTMLElement, anchor: Element): void => { colocarPop(popup, anchor); },
  emitChange: (input: HTMLInputElement): void => { emitir(input); },
  pending: (): Set<Element> => navigationStore.pendingEnhancements,
  flushScheduled: (): boolean => Boolean(navigationStore.enhanceFrame),
  setFlushScheduled: (scheduled: boolean): void => { navigationStore.enhanceFrame = scheduled ? 1 : 0; },
  isVatField: (input: HTMLInputElement): boolean => Boolean(ES_IVA(input)),
  vatSelector: (input: HTMLInputElement): void => { legacyFreeCoreLegacyC.vatSelector(input); },
  touchScreen: (): boolean => PANTALLA_TACTIL,
  weekdayLetter: (isoDate: string): string => LETRA_DIA(isoDate),
  readOnlyCompany: (): boolean => Boolean(ordersStore.paymentState?.solo_lectura),
  hasStartPoint: (): boolean => Boolean(prefsActivas().salida),
  helpAnchors: (): readonly (readonly [string, string])[] => ANCLAS_AYUDA,
  manualAnchors: (): Readonly<Record<string, string | undefined>> => MANUAL_ANCLA,
  euros: (value: number): string => eurI(value),
  customFields: (scope: string): readonly CustomField[] => CAMPOS[scope] ?? [],
  sortedFields: (scope: string): readonly CustomField[] => legacyFreeCoreSettings.sortedFields(scope),
  canEditCatalogs: (): boolean => Boolean(legacyFreeCoreServices.permissions.canManageLists()),
  sidePanelOpen: (): boolean => htLateralAbierto(),
  customerFilters: (): Record<string, unknown> => (PAC.campos = PAC.campos ?? {}),
  reloadCustomers: (): void => { PAC.pagina = 0; void listaPacientes(); },
  orderFilters: (): Record<string, unknown> => ordersStore.filters,
  reloadOrders: (): void => { ordersStore.page = 0; void listaPedidos(); },
  productFilters: (): Record<string, unknown> => productsStore.filters,
  reloadProducts: (): void => { void pintarProductos(); },
  productsSection: (): string => productsStore.section,
};
