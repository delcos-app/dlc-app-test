import * as components from '../components';
import * as legacyFreeCoreServices from '../core/services';
import * as legacyFreeComponentsEmbeddedWindow from '../components/embedded-window';
import * as legacyFreeCoreLeftovers from '../core/leftovers';
import * as legacyFreeCoreSettings from '../core/settings';
import { billingStore } from '../screens/billing/store';
import { ordersStore } from '../screens/orders/store';
import { sessionStore } from '../core/session-store';
import { settingsStore } from '../screens/settings/store';
/**
 * Bridge of Facturación to the legacy code (kept apart from bridge.ts, which is at its size limit). The section (FSEC) and the
 * page of the list (FACPAG) stay in legacy: the tab bar, the filters and the cache of loaded screens read them. The PDF, the
 * email, the fiscal data and the log stay in legacy too (they are shared with Pedidos and Configuración).
 */
export interface InvoicePdf { output: (kind: string) => string }
/** The legacy facturaPDF(invoice, rectifies, design?): the design is optional (the default one when it is missing). */
type PdfMaker = (invoice: object, rectifies: string | null | undefined) => Promise<InvoicePdf>;

export const billingLegacy = {
  section: (): string => billingStore.section,
  setSection: (section: string): void => { billingStore.section = section; },
  page: (): number => ordersStore.invoicePage,
  setPage: (page: number): void => { ordersStore.invoicePage = page; },
  canInvoice: (): boolean => Boolean(legacyFreeCoreServices.permissions.canInvoice()),
  /** Through the global names: legado 057 caches the screen and legado 089 / the wide window wrap verFactura. */
  reload: (): void => { void cargarFacturacion(); },
  openInvoice: (id: string): void => { void verFactura(id); },
  withLoading: <T>(work: () => Promise<T>): Promise<T> => legacyFreeComponentsEmbeddedWindow.withDialogLoading(work),
  showLoading: (element: HTMLElement | null, text: string): void => { components.showLoading(element, text); },
  readOnly: (): boolean => Boolean(facConsulta()),
  planName: (): string => planDe(String(sessionStore.plan.plan)).nombre,
  paintCompany: (): void => { void pintarEmpresa(); },
  paintLog: (): void => { void pintarRegistro(); },
  paintTabs: (): void => { legacyFreeCoreLeftovers.billingSettingsSubnav(); },
  invoicePdf: (invoice: object, rectifies: string | null | undefined): Promise<InvoicePdf> => (facturaPDF as unknown as PdfMaker)(invoice, rectifies),
  downloadPdf: (invoice: object, rectifies: string | null | undefined): void => { void legacyFreeCoreServices.pdf.downloadInvoicePdf(invoice, rectifies); },
  sendByEmail: (invoice: object, rectifies: string | null | undefined): void => { void enviarFacturaEmail(invoice, rectifies); },
  loadSettings: (): Promise<void> => legacyFreeCoreSettings.loadSettings(),
  setting: (key: string): unknown => settingsStore.settings[key],
  setSetting: (key: string, value: unknown): void => { settingsStore.settings[key] = value; },
  paymentMethods: (): readonly { valor: string }[] => CAT.forma_pago ?? [],
};
