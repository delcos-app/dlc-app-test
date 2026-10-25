/**
 * Bridge of the invoice PDF, issuing and sending invoices, and the product editor to the legacy code (v2.427.0; kept apart from
 * bridge.ts, which is at its size limit). Shared state stays in legacy and is read at the moment of each call: the company
 * settings (AJUSTES), the catalog (PRODUCTOS, SERVICIOS, ESTADO_PROD, PROMO_PRODS — a test sets it to null), the chosen mail and
 * PDF templates (PLANT_ELEGIDA, PDF_ELEGIDO, PDF_EDITANDO in legado 156), the logo, the plan and the payment state.
 */
import * as legacyFreeScreensSettingsExtra from '../screens/settings/extra';
import * as legacyFreeCoreSettings from '../core/settings';
export interface CatalogItem { id: string; nombre: string; foto_url?: string | null; tipo?: string | null; estado?: string; precio?: number | null; iva?: number | null }
export interface MailTemplate { id: string; nombre: string; defecto?: boolean }

export const billing2Legacy = {
  settings: (): Record<string, unknown> => AJUSTES,
  loadSettings: (): Promise<void> => cargarAjustes(),
  products: (): CatalogItem[] => PRODUCTOS as CatalogItem[],
  services: (): readonly CatalogItem[] => SERVICIOS as CatalogItem[],
  loadProducts: (): Promise<void> => cargarProductos(),
  refreshProducts: (): void => { void refrescarProductos(); },
  logo: (): Promise<string | null> => logoData(),
  roundLogo: (): boolean => Boolean(LOGO_CIRC),
  rawRpc: <T>(name: string, params: Record<string, unknown>): PromiseLike<LegacyResult<T>> => RPC_ORIG<T>(name, params),
  /** guardar_ajuste that also refreshes the copies of other tabs (legado 156's v2.342 write). */
  saveSettingEverywhere: <T>(name: string, params: Record<string, unknown>): PromiseLike<LegacyResult<T>> => RPC_V2342<T>(name, params),
  pdfChosen: (): string | null => PDF_ELEGIDO,
  setPdfChosen: (id: string | null): void => { PDF_ELEGIDO = id; },
  pdfEditing: (): string | null => PDF_EDITANDO,
  setPdfEditing: (id: string | null): void => { PDF_EDITANDO = id; },
  setInvoiceMailChosen: (id: string | null): void => { PLANT_ELEGIDA.factura = id; },
  mailTemplate: (kind: string, part: string, values: Record<string, unknown>): string => plantillaCorreo(kind, part, values),
  mailValues: (values: Record<string, unknown>): Record<string, unknown> => varsCorreo(values),
  mailTemplates: (kind: string): MailTemplate[] => legacyFreeScreensSettingsExtra.templatesFor(kind) as MailTemplate[],
  firstName: (name: string): string => nombrePila(name),
  askText: (message: string, value: string, options: { titulo: string; ok: string }): Promise<string | null> => pedirTexto(message, value, options),
  newTemplateId: (): string => idPlant(),
  helpButton: (title: string, text: string): string => pmAyu(title, text),
  openInvoice: (id: string): void => { void verFactura(id); },
  /** The legacy name: legado 058 and the wide window wrap disenoPDF. */
  openDesigner: (): void => { void disenoPDF(); },
  paymentState: (): { facturas?: unknown } | null => PAGO_ESTADO as { facturas?: unknown } | null,
  currentPlan: (): string => String((PLAN_ACTUAL as { plan?: string } | null)?.plan ?? ''),
  freeOfCharge: (order: object, total: unknown): boolean => Boolean(sinCargoP(order, total)),
  configKey: (): string => CFG_KEY,
  pageTab: (page: string): string | undefined => PAG_TAB[page],
  productStates: (): Record<string, string> => ESTADO_PROD,
  promoted: (): { id: string; nombre: string }[] | null => PROMO_PRODS,
  setPromoted: (list: { id: string; nombre: string }[] | null): void => { PROMO_PRODS = list; },
  productUses: (): Readonly<Record<string, string>> => PROD_USOS,
  loadCatalogs: (): void => { void legacyFreeCoreSettings.loadCatalogs(); },
  presentationMax: (): number => PRES_MAX,
  presentationFiles: (): Map<string, string> => PRES_DATOS,
};
