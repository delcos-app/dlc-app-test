import * as components from '../components';
import * as legacyFreeCoreServices from '../core/services';
import * as legacyFreeScreensSettingsMore from '../screens/settings/more';
import * as legacyFreeScreensSettings from '../screens/settings';
import { sessionStore } from '../core/session-store';
import { navigationStore } from '../core/navigation/store';
/**
 * Bridge of Panel delcos to the legacy code (kept apart from bridge.ts, which is at its size limit): the plans, the billing state
 * helpers shared with Plan (pedidos.js), the dialogs, the environment and the Configuración editors the template reuses.
 */
export type BillingState = [string, string, string];

export const platformLegacy = {
  planName: (id: string | null | undefined): string => planDe(id).nombre,
  plans: (): readonly { id: string; nombre: string }[] => PLANES,
  planLosses: (from: string, to: string, data: { extras: string[]; facturas: boolean }): string[] => perdidasPlan(from, to, data),
  planRank: (id: string): number => rangoPlan(id),
  /** The platform's own plan may have changed. */
  reloadPlan: async (): Promise<void> => { const { data } = await RPC_ORIG<{ plan?: Record<string, unknown> }>('plan_uso', {}); if (data?.plan) sessionStore.plan = data.plan; },
  askText: (message: string, value: string, options: { titulo: string; ok: string }): Promise<string | null> => components.askText(message, value, options),
  prepareOrganizationChange: (name: string): void => { prepararCambioOrg(name); },
  hasProfile: (): boolean => Boolean(sessionStore.profile),
  can: (capability: string): boolean => puede(capability),
  appVersion: (): string => VERSION_APP,
  isTestEnvironment: (): boolean => EN_PRUEBAS,
  panelTab: (): string | undefined => navigationStore.pageTabs.delcos,
  skeleton: (): string => pdEsqueleto(),
  kpis: (figures: [string | number, string, string?][]): string => pdKpis(figures),
  billingState: (organization: object): BillingState => pdCobroEstado(organization),
  monthlyAmount: (plan: object): number => pdMensual(plan),
  euros: (value: number): string => eur(value),
  shortDate: (value: string): string => legacyFreeCoreServices.calendar.dateWithYear(value),
  timeAgo: (value: string): string => pdHace(value),
  paintRoles: (): Promise<void> => legacyFreeScreensSettingsMore.paintRoles(),
  paintCatalogs: (): Promise<void> => legacyFreeScreensSettings.paintClassifiers(),
};
