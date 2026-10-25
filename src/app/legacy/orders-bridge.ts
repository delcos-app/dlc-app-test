import * as components from '../components';
import * as legacyFreeScreensSettingsShell from '../screens/settings/shell';
import * as legacyFreeCoreLegacyC from '../core/legacy-c';
import * as legacyFreeCoreServices from '../core/services';
import * as legacyFreeComponentsEmbeddedWindow from '../components/embedded-window';
import * as legacyFreeScreensSettings from '../screens/settings';
/**
 * Bridge of Pedidos to the legacy code (kept apart from bridge.ts, which is at its size limit). The section, page, field filters
 * and the loaded rows stay in the legacy PEDSEC, PEDPAG, PEDF and PEDIDOS (the list bar, legado 034/082/139 and the tests read
 * them). The invoices of an order and the custom fields stay in legacy (the editor and the card payment are in src/app since v2.417.0).
 */
export interface PickedService { id: string; nombre: string }
export interface OrderFieldsRead { falta: string[] }
export interface EmailVariables { documento: string; numero?: string | null; importe: number; nombre?: string | null }
export interface Distributor { id: string; nombre: string; email?: string | null; telefono?: string | null; nota?: string | null; activo?: boolean }
interface FunctionsClient { functions: { invoke(name: string, options: { body: Record<string, unknown> }): Promise<{ data: unknown; error: unknown }> } }

export const ordersLegacy = {
  section: (): string => PEDSEC,
  setSection: (section: string): void => { PEDSEC = section; },
  setLoadingSection: (section: string | null): void => { PEDSEC_CARGA = section; },
  sectionTitle: (section: string): readonly [string, string] => TITULO_PEDSEC[section] ?? TITULO_PEDSEC.ventas ?? ['', ''],
  markSection: (): void => { legacyFreeScreensSettingsShell.markOrderSection(); },
  /** The open part of Configuración (Distribuidores lives there). */
  settingsSection: (): string => CFG_KEY,
  page: (): number => PEDPAG,
  setPage: (page: number): void => { PEDPAG = page; },
  fieldFilters: (): Record<string, unknown> => PEDF,
  setRows: (rows: unknown[]): void => { PEDIDOS = rows; },
  /** Through the global name (legado 057 keeps the screen cached around it). */
  reload: (): void => { void cargarVentas(); },
  paintOperations: (): void => { void legacyFreeCoreLegacyC.paintOrderAlerts(); },
  paintUnattributed: (): void => { void pintarSinAtribuir(); },
  canAttribute: (): boolean => Boolean(legacyFreeCoreServices.permissions.canAttribute()),
  newSale: (): void => { void (nuevaVenta as (preset?: object) => unknown)(); },
  services: (): readonly PickedService[] => SERVICIOS,
  paymentState: (order: object): string => cobroDe(order),
  channelLabel: (order: object, total: number | null | undefined): string => etiquetaCanal(order, total),
  paymentMethods: (): readonly { valor: string }[] => CAT.forma_pago ?? [],
  fieldColumns: (): CustomField[] => components.visibleFields('pedido'),
  fieldCells: (fields: readonly CustomField[], values: Record<string, unknown> | null | undefined): string => components.columnCells(fields, values),
};

/** The order window: the pieces that stay in legacy (invoices, custom fields) and the editor through its global name (legado 058 opens it wide). */
export const orderSheetLegacy = {
  whileLoading: <T>(work: () => Promise<T>): Promise<T> => legacyFreeComponentsEmbeddedWindow.withDialogLoading(work),
  whenSteady: (element: Element | null, maxMs: number): Promise<void> => estable(element, maxMs),
  invoices: (id: string): Promise<void> => pedidoFacturas(id),
  customFields: (id: string, container: Element | null): Promise<void> => legacyFreeScreensSettings.paintCustomFieldsBlock(('pedidos'), id, container),
  edit: (detail: object): void => { void editorPedido(detail as Record<string, unknown>); },
  openCustomer: (id: string): void => { void fichaPaciente(id); },
  fieldsForm: (values: Record<string, unknown>): string => legacyFreeScreensSettings.customFieldsHtml(('pedido'), values),
  readFields: (root: Element | null): OrderFieldsRead | null => camposLeer(root),
  saveFields: (read: OrderFieldsRead | null, id: string): Promise<boolean> => camposGuardar(read, id),
  loadPdf: (): Promise<unknown> => cargarJsPDF(),
  appName: (): string => nombreApp(),
  askText: (message: string, value: string, options: { titulo?: string; ok?: string }): Promise<string | null> => components.askText(message, value, options),
};

/** Emails and settings of Pedidos. */
export const orderMailLegacy = {
  template: (kind: string, field: string, values: EmailVariables): string => plantillaCorreo(kind, field, varsCorreo(values)),
  chooseTemplate: (kind: string): Promise<boolean> => elegirPlantillaCorreo(kind),
  forgetChosenTemplate: (kind: string): void => { PLANT_ELEGIDA[kind] = null; },
  companyIban: (): string => String((AJUSTES.empresa as { iban?: string } | undefined)?.iban ?? '').trim(),
  /** A server function (the answer is read by the caller). */
  invoke: (name: string, body: Record<string, unknown>): Promise<{ data: unknown; error: unknown }> =>
    (db as unknown as FunctionsClient).functions.invoke(name, { body }),
  alertPreferences: (): Record<string, boolean> =>
    ((PERFIL as { preferencias?: { avisos_pedidos?: Record<string, boolean> } }).preferencias?.avisos_pedidos) ?? {},
  saveAlertPreferences: (alerts: Record<string, boolean>): Promise<boolean> => guardarPrefsAvisos(alerts),
  roleNames: (): string[] => rolesNombres(),
};
