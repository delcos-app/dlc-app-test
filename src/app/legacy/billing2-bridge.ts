/**
 * Bridge of the invoice PDF, issuing and sending invoices, and the product editor to the legacy code (v2.427.0; kept apart from
 * bridge.ts, which is at its size limit). Shared state stays in legacy and is read at the moment of each call: the company
 * settings (AJUSTES), the catalog (PRODUCTOS, SERVICIOS, ESTADO_PROD, PROMO_PRODS — a test sets it to null), the chosen mail and
 * PDF templates (PLANT_ELEGIDA, PDF_ELEGIDO, PDF_EDITANDO in legado 156), the logo, the plan and the payment state.
 */
import * as legacyFreeScreensSettingsExtra from '../screens/settings/extra';
import * as legacyFreeCoreSettings from '../core/settings';
import { settingsStore } from '../screens/settings/store';
import { productsStore } from '../screens/products/store';
import { sessionStore } from '../core/session-store';
import { billingStore } from '../screens/billing/store';
import { ordersStore } from '../screens/orders/store';
import { navigationStore } from '../core/navigation/store';
import * as legacyFreeCoreServices from '../core/services';
import * as legacyFreeComponents from '../components';
import * as legacyFreeScreensOrders from '../screens/orders';
import * as legacyFreeScreensBilling from '../screens/billing';
export interface CatalogItem { id: string; nombre: string; foto_url?: string | null; tipo?: string | null; estado?: string; precio?: number | null; iva?: number | null }
export interface MailTemplate { id: string; nombre: string; defecto?: boolean }

export const billing2Legacy = {
  settings: (): Record<string, unknown> => settingsStore.settings,
  loadSettings: (): Promise<void> => legacyFreeCoreSettings.loadSettings(),
  products: (): CatalogItem[] => productsStore.products as CatalogItem[],
  services: (): readonly CatalogItem[] => productsStore.services as CatalogItem[],
  loadProducts: (): Promise<void> => cargarProductos(),
  refreshProducts: (): void => { void refrescarProductos(); },
  logo: (): Promise<string | null> => legacyFreeCoreSettings.invoiceLogo(),
  roundLogo: (): boolean => Boolean(sessionStore.roundLogo),
  rawRpc: <T>(name: string, params: Record<string, unknown>): PromiseLike<LegacyResult<T>> => RPC_ORIG<T>(name, params),
  /** guardar_ajuste that also refreshes the copies of other tabs (legado 156's v2.342 write). */
  saveSettingEverywhere: <T>(name: string, params: Record<string, unknown>): PromiseLike<LegacyResult<T>> => RPC_V2342<T>(name, params),
  pdfChosen: (): string | null => billingStore.pdfChosen,
  setPdfChosen: (id: string | null): void => { billingStore.pdfChosen = id; },
  pdfEditing: (): string | null => billingStore.pdfEditing,
  setPdfEditing: (id: string | null): void => { billingStore.pdfEditing = id; },
  setInvoiceMailChosen: (id: string | null): void => { billingStore.chosenTemplates.factura = id; },
  mailTemplate: (kind: string, part: string, values: Record<string, unknown>): string => legacyFreeScreensSettingsExtra.fillTemplate(kind, part as Parameters<typeof legacyFreeScreensSettingsExtra.fillTemplate>[1], values as Parameters<typeof legacyFreeScreensSettingsExtra.fillTemplate>[2]),
  mailValues: (values: Record<string, unknown>): Record<string, unknown> => legacyFreeScreensSettingsExtra.emailVariables(values),
  mailTemplates: (kind: string): MailTemplate[] => legacyFreeScreensSettingsExtra.templatesFor(kind) as MailTemplate[],
  firstName: (name: string): string => legacyFreeCoreServices.vocabulary.firstName(name),
  askText: (message: string, value: string, options: { titulo: string; ok: string }): Promise<string | null> => legacyFreeComponents.askText(message, value, options),
  newTemplateId: (): string => legacyFreeScreensSettingsExtra.newTemplateId(),
  helpButton: (title: string, text: string): string => pmAyu(title, text),
  openInvoice: (id: string): void => { void legacyFreeScreensBilling.showInvoice(id); },
  /** The legacy name: legado 058 and the wide window wrap disenoPDF. */
  openDesigner: (): void => { void legacyFreeCoreServices.pdf.openDesigner(); },
  paymentState: (): { facturas?: unknown } | null => ordersStore.paymentState as { facturas?: unknown } | null,
  currentPlan: (): string => String((sessionStore.plan as { plan?: string } | null)?.plan ?? ''),
  freeOfCharge: (order: object, total: unknown): boolean => Boolean(legacyFreeScreensOrders.isFree(order, total as number | null | undefined)),
  configKey: (): string => CFG_KEY,
  pageTab: (page: string): string | undefined => navigationStore.pageTabs[page],
  productStates: (): Record<string, string> => productsStore.productStates,
  promoted: (): { id: string; nombre: string }[] | null => productsStore.promoted,
  setPromoted: (list: { id: string; nombre: string }[] | null): void => { productsStore.promoted = list; },
  productUses: (): Readonly<Record<string, string>> => PROD_USOS,
  loadCatalogs: (): void => { void legacyFreeCoreSettings.loadCatalogs(); },
  presentationMax: (): number => PRES_MAX,
  presentationFiles: (): Map<string, string> => PRES_DATOS,
};
