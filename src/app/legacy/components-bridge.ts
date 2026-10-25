/**
 * What the shared components (src/app/components) still read from legacy: the open picker (SELPOP, closed by legacy listeners),
 * how a picked value is shown and announced, the pending fields to enhance, VAT fields, the touch screen, company and person
 * settings, the help titles and manual anchors, and the filters of the screens with custom fields (v2.416.0).
 */
import * as legacyFreeCoreLegacyC from '../core/legacy-c';
import * as legacyFreeCoreSettings from '../core/settings';
import * as legacyFreeCoreServices from '../core/services';
export const componentsLegacy = {
  popup: (): HTMLElement | null => SELPOP,
  setPopup: (popup: HTMLElement | null): void => { SELPOP = popup; },
  showValue: (input: HTMLInputElement): void => { legacyFreeCoreLegacyC.visibleValue(input); },
  placePopup: (popup: HTMLElement, anchor: Element): void => { colocarPop(popup, anchor); },
  emitChange: (input: HTMLInputElement): void => { emitir(input); },
  pending: (): Set<Element> => MEJ_PEND,
  flushScheduled: (): boolean => Boolean(MEJ_RAF),
  setFlushScheduled: (scheduled: boolean): void => { MEJ_RAF = scheduled ? 1 : 0; },
  isVatField: (input: HTMLInputElement): boolean => Boolean(ES_IVA(input)),
  vatSelector: (input: HTMLInputElement): void => { legacyFreeCoreLegacyC.vatSelector(input); },
  touchScreen: (): boolean => PANTALLA_TACTIL,
  weekdayLetter: (isoDate: string): string => LETRA_DIA(isoDate),
  readOnlyCompany: (): boolean => Boolean(PAGO_ESTADO?.solo_lectura),
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
  orderFilters: (): Record<string, unknown> => PEDF,
  reloadOrders: (): void => { PEDPAG = 0; void listaPedidos(); },
  productFilters: (): Record<string, unknown> => PRODF,
  reloadProducts: (): void => { void pintarProductos(); },
  productsSection: (): string => PSEC,
};
