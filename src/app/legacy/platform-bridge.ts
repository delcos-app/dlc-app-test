import * as components from '../components';
import * as legacyFreeCoreServices from '../core/services';
import * as legacyFreeScreensSettingsMore from '../screens/settings/more';
import * as legacyFreeScreensSettings from '../screens/settings';
import { sessionStore } from '../core/session-store';
import { navigationStore } from '../core/navigation/store';
import * as legacyFreeScreensOrders from '../screens/orders';
import * as legacyFreeScreensSettingsRest from '../screens/settings/rest';
/**
 * Bridge of Panel delcos to the legacy code (kept apart from bridge.ts, which is at its size limit): the plans, the billing state
 * helpers shared with Plan (pedidos.js), the dialogs, the environment and the Configuración editors the template reuses.
 */
export type BillingState = [string, string, string];

export const platformLegacy = {
  planName: (id: string | null | undefined): string => legacyFreeCoreServices.plans.planOf(id ?? '').nombre,
  plans: (): readonly { id: string; nombre: string }[] => PLANES,
  planLosses: (from: string, to: string, data: { extras: string[]; facturas: boolean }): string[] => legacyFreeScreensSettingsRest.planLosses(from, to, data),
  planRank: (id: string): number => legacyFreeCoreServices.plans.planRank(id),
  /** The platform's own plan may have changed. */
  reloadPlan: async (): Promise<void> => { const { data } = await RPC_ORIG<{ plan?: Record<string, unknown> }>('plan_uso', {}); if (data?.plan) sessionStore.plan = data.plan; },
  askText: (message: string, value: string, options: { titulo: string; ok: string }): Promise<string | null> => components.askText(message, value, options),
  prepareOrganizationChange: (name: string): void => { legacyFreeCoreServices.session.prepareOrganizationChange(name); },
  hasProfile: (): boolean => Boolean(sessionStore.profile),
  can: (capability: string): boolean => puede(capability),
  appVersion: (): string => VERSION_APP,
  isTestEnvironment: (): boolean => EN_PRUEBAS,
  panelTab: (): string | undefined => navigationStore.pageTabs.delcos,
  skeleton: (): string => legacyFreeScreensOrders.billingSkeleton(),
  kpis: (figures: [string | number, string, string?][]): string => legacyFreeScreensOrders.kpiTiles(figures),
  billingState: (organization: object): BillingState => legacyFreeScreensOrders.companyPaymentState(organization),
  monthlyAmount: (plan: object): number => legacyFreeScreensOrders.monthlyAmount(plan),
  euros: (value: number): string => eur(value),
  shortDate: (value: string): string => legacyFreeCoreServices.calendar.dateWithYear(value),
  timeAgo: (value: string): string => legacyFreeScreensOrders.ago(value),
  paintRoles: (): Promise<void> => legacyFreeScreensSettingsMore.paintRoles(),
  paintCatalogs: (): Promise<void> => legacyFreeScreensSettings.paintClassifiers(),
};
