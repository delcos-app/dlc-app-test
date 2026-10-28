import * as components from '../components';
import * as legacyFreeCoreServices from '../core/services';
import * as legacyFreeComponentsEmbeddedWindow from '../components/embedded-window';
import * as legacyFreeCoreLeftovers from '../core/leftovers';
import * as legacyFreeCoreSettings from '../core/settings';
import { billingStore } from '../screens/billing/store';
import { ordersStore } from '../screens/orders/store';
import { sessionStore } from '../core/session-store';
import { settingsStore } from '../screens/settings/store';
import * as legacyFreeScreensSettings from '../screens/settings';
import * as legacyFreeScreensBilling from '../screens/billing';
import * as legacyFreeCoreLegacyC from '../core/legacy-c';
/**
 * Bridge of Facturación to the legacy code (kept apart from bridge.ts, which is at its size limit). The section (FSEC) and the
 * page of the list (FACPAG) stay in legacy: the tab bar, the filters and the cache of loaded screens read them. The PDF, the
 * email, the fiscal data and the log stay in legacy too (they are shared with Pedidos and Configuración).
 */
export interface InvoicePdf { output: (kind: string) => string }
/** The legacy facturaPDF(invoice, rectifies, design?): the design is optional (the default one when it is missing). */

export const billingLegacy = {
  section: (): string => billingStore.section,
  setSection: (section: string): void => { billingStore.section = section; },
  page: (): number => ordersStore.invoicePage,
  setPage: (page: number): void => { ordersStore.invoicePage = page; },
  canInvoice: (): boolean => Boolean(legacyFreeCoreServices.permissions.canInvoice()),
  /** Through the global names (the adapters of pantallas/facturacion.js), which call the screen with its cache and its window. */
  reload: (): void => { void legacyFreeScreensBilling.loadBilling(); },
  openInvoice: (id: string): void => { void legacyFreeScreensBilling.showInvoice(id); },
  withLoading: <T>(work: () => Promise<T>): Promise<T> => legacyFreeComponentsEmbeddedWindow.withDialogLoading(work),
  showLoading: (element: HTMLElement | null, text: string): void => { components.showLoading(element, text); },
  readOnly: (): boolean => Boolean(legacyFreeScreensBilling.readOnlyBilling()),
  planName: (): string => legacyFreeCoreServices.plans.planOf((String(sessionStore.plan.plan))).nombre,
  paintCompany: (): void => { void legacyFreeCoreLegacyC.paintCompany([]); },
  paintLog: (): void => { void legacyFreeScreensSettings.paintBillingLog(); },
  paintTabs: (): void => { legacyFreeCoreLeftovers.billingSettingsSubnav(); },
  invoicePdf: (invoice: object, rectifies: string | null | undefined): Promise<InvoicePdf> => legacyFreeCoreServices.pdf.invoicePdf(invoice, rectifies, null),
  downloadPdf: (invoice: object, rectifies: string | null | undefined): void => { void legacyFreeCoreServices.pdf.downloadInvoicePdf(invoice, rectifies); },
  sendByEmail: (invoice: object, rectifies: string | null | undefined): void => { void legacyFreeScreensBilling.sendInvoiceByEmail(invoice, rectifies); },
  loadSettings: (): Promise<void> => legacyFreeCoreSettings.loadSettings(),
  setting: (key: string): unknown => settingsStore.settings[key],
  setSetting: (key: string, value: unknown): void => { settingsStore.settings[key] = value; },
  paymentMethods: (): readonly { valor: string }[] => CAT.forma_pago ?? [],
};
