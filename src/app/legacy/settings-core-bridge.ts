/**
 * Bridge of the company settings core (src/app/core/settings) and the route plan card to the legacy state they read and write:
 * AJUSTES, ROLES_DEF, ESTADOS_DEF, CAT, CAMPOS, MARCA, LOGO_DATA, the module cache, the day proposals and the painters of each
 * Configuración section. The state stays in legacy because many screens and the tests read it by its bare name (v2.428.0).
 */
import * as legacyFreeScreensSettings from '../screens/settings';
import * as legacyFreeCoreServices from '../core/services';
import * as legacyFreeComponentsEmbeddedWindow from '../components/embedded-window';
import * as legacyFreeScreensSettingsMore from '../screens/settings/more';
import * as legacyFreeScreensSettingsExtra from '../screens/settings/extra';
import { settingsStore } from '../screens/settings/store';
import { sessionStore } from '../core/session-store';
import { routesStore } from '../screens/routes/store';

/** A role as the database defines it (roles and roles_capacidades). */
export interface RoleDefinition { nombre: string; orden?: number; color?: string | null; plantilla?: Record<string, unknown>; por_defecto?: boolean; capacidades?: string[] }

interface ModuleCacheEntry { clave: unknown; t: number; esc: number }
interface DayProposals { lista: { sel: unknown }[] }

export const settingsCoreLegacy = {
  // Settings, roles, words and states
  settings: (): Record<string, unknown> => settingsStore.settings,
  setSettings: (value: Record<string, unknown>): void => { settingsStore.settings = value; },
  roles: (): readonly RoleDefinition[] => settingsStore.roles as readonly RoleDefinition[],
  setRoles: (list: RoleDefinition[]): void => { settingsStore.roles = list; },
  terms: (): Record<string, unknown> | null => sessionStore.terms,
  setCommercialStates: (list: { valor: string; papel: string }[]): void => { sessionStore.commercialStates = list; },
  catalogs: (): Record<string, unknown[]> => CAT as unknown as Record<string, unknown[]>,
  customFields: (): Record<string, CustomField[] | undefined> => CAMPOS,
  loadCustomFields: (): Promise<void> => legacyFreeScreensSettings.loadCustomFields(),
  // Session, permissions and plan
  hasProfile: (): boolean => Boolean(sessionStore.profile),
  can: (capability: string): boolean => puede(capability),
  canEditCatalogs: (): boolean => legacyFreeCoreServices.permissions.canManageLists(),
  hasExtra: (extra: string): boolean => hayExtra(extra),
  currentPlan: (): { plan?: unknown; usuarios?: unknown } => sessionStore.plan,
  roundEuros: (value: number): string => eurI(value),
  // Brand and labels
  appName: (): string => nombreApp(),
  brand: (): { logo: string | null } => MARCA,
  setInvoiceLogo: (logo: string): void => { settingsStore.invoiceLogo = logo; sessionStore.roundLogo = true; },
  applyLabel: (): void => { aplicarEtiqueta(); },
  organisationMenu: (): void => { menuOrganizacion(); },
  contactsLabel: (): string => etiquetaContactos(),
  notificationTypes: (): readonly (readonly string[])[] => TIPOS_NOTIF,
  // Module cache, preferences and day proposals
  moduleCache: (): Record<string, ModuleCacheEntry | undefined> => CACHE_MOD as Record<string, ModuleCacheEntry | undefined>,
  moduleState: (screen: string): unknown => ESTADO_MOD[screen]?.(),
  writes: (): number => sessionStore.writes,
  activePreferences: (): { salida?: { nombre: string; lat: number | null; lon: number | null; falta?: boolean } } =>
    prefsActivas() as { salida?: { nombre: string; lat: number | null; lon: number | null; falta?: boolean } },
  dayProposals: (): DayProposals | null => routesStore.dayProposals as DayProposals | null,
  rememberProposal: (key: string, selection: unknown): void => { routesStore.proposals ??= {}; routesStore.proposals[key] = selection; },
};

/** The painter of each Configuración entry (the legacy names, looked up when the entry is opened). */
export const treePainters = {
  window: (painter: () => unknown): unknown => panelDeVentana(painter),
  module: (name: string): unknown => legacyFreeComponentsEmbeddedWindow.showModuleInPanel(name),
  preferencesPart: (part: string): unknown => pintarPrefsParte(part),
  indicators: (): unknown => abrirKpis(),
  planTimes: (): unknown => { abrirHorarioPlan(); return undefined; },
  portfolioRules: (): unknown => editorReglasCartera(),
  visitFrequency: (): unknown => editorFrecuencia(),
  cycle: (): unknown => editorCiclo(),
  classifiers: (): unknown => legacyFreeScreensSettings.paintClassifiers(),
  stores: (): unknown => pintarAlmacenes2(),
  visitMaterial: (): unknown => pintarMaterial(),
  brand: (): unknown => legacyFreeScreensSettingsMore.paintBrand(),
  email: (): unknown => legacyFreeScreensSettingsExtra.paintEmail(),
  backups: (): unknown => pintarCopias(),
  newImport: (): unknown => pintarImportar(),
  imports: (): unknown => pintarImportaciones(),
  portalSettings: (): unknown => pintarCfgPortal(),
};

/** What the route plan card needs from legacy: the write queue, Inicio and saving the preferences. */
export const planCardLegacy = {
  write: (name: string, payload: Record<string, unknown>): Promise<unknown> => escribir(name, payload),
  reloadHome: (): void => { void cargarInicio(); },
  savePreferences: async (preferences: Record<string, unknown>): Promise<Record<string, unknown> | null> => {
    const { data } = await db.rpc<Record<string, unknown> | null>('guardar_preferencias', { p: preferences });
    return data ?? null;
  },
};
