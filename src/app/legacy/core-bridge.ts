/**
 * Legacy state and functions the core services (src/app/core, services/calendar, money, files, maps) still need, while the rest of the
 * app migrates: the profile, the plan, the company words and states, the language, the caches of the reads and the windows of the
 * screens. Each access reads the legacy value when called (the tests change some of them, e.g. PLAN_ACTUAL or TERMINOS).
 */
import * as legacyFreeCoreSettings from '../core/settings';
import * as legacyFreeCoreNavigationApi from '../core/navigation/api';
import { sessionStore } from '../core/session-store';
import { settingsStore } from '../screens/settings/store';
import { ordersStore } from '../screens/orders/store';
import { navigationStore } from '../core/navigation/store';
import { accountsStore } from '../screens/accounts/store';
import { homeStore } from '../screens/home/store';
import { agendaStore } from '../screens/agenda/store';
import { routesStore } from '../screens/routes/store';
import * as legacyFreeScreensBilling from '../screens/billing';
import * as legacyFreeComponents from '../components';
import * as legacyFreeCoreServices from '../core/services';
import * as legacyFreeScreensOrders from '../screens/orders';
import * as legacyFreeCoreLegacyC from '../core/legacy-c';
import * as legacyFreeScreensPortal from '../screens/portal';
import * as legacyFreeScreensVisit from '../screens/visit';
import * as legacyFreeScreensAccounts from '../screens/accounts';
export interface LegacyProfile {
  id: string; nombre: string; rol: string; areas?: Record<string, number | string>; capacidades?: string[];
  preferencias?: Record<string, unknown> & { navegador?: string };
}
export interface LegacyPlan { id: string; nombre: string; modulos: string[]; ventajas: string[] }
export interface QueuedWrite { fn: string; payload: unknown; etiqueta?: string | undefined; t: number; motivo?: string; falla?: number }

interface Channel { on(event: string, filter: Record<string, string>, listener: () => void): Channel; subscribe(): Channel }
interface CoreDb {
  rpc(name: string, params?: Record<string, unknown>): PromiseLike<{ data: unknown; error: { message?: string } | null }>;
  from<T>(table: string): LegacyQuery<T>;
  channel?: (name: string) => Channel;
  auth: {
    getSession(): Promise<{ data: { session: { access_token: string; refresh_token: string } | null } }>;
    verifyOtp(options: { token_hash?: string | undefined; type: string }): Promise<{ error: { message?: string } | null }>;
    setSession(tokens: { access_token: string; refresh_token: string }): Promise<unknown>;
    refreshSession(): Promise<unknown>;
    signOut(): Promise<unknown>;
  };
  functions: { invoke(name: string, options: { body: unknown }): Promise<{ data: unknown; error: { message?: string; context?: { status?: number; json?: () => Promise<unknown> } } | null }> };
}

type Answer<T> = PromiseLike<{ data: T | null; error: unknown }>;

export interface CentreListOptions { onPick: (centre: { nombre: string }) => void; extra: string; onExtra: () => unknown }

export const coreLegacy = {
  // ---- Session, profile and plan
  db: (): CoreDb => db as unknown as CoreDb,
  rpc: (name: string, params: Record<string, unknown>): Answer<unknown> => RPC_ORIG<unknown>(name, params),
  profile: (): LegacyProfile | null => (sessionStore.profile as LegacyProfile | null) ?? null,
  users: (): { id: string; nombre: string; rol: string }[] => (settingsStore.users as { id: string; nombre: string; rol: string }[] | null) ?? [],
  roleCan: (role: string, capability: string): boolean => legacyFreeCoreSettings.roleCan(role, capability),
  currentPlan: (): { plan: string } => sessionStore.plan as { plan: string },
  plans: (): readonly LegacyPlan[] => PLANES as readonly LegacyPlan[],
  planPrice: (plan: LegacyPlan): string => legacyFreeCoreSettings.planPrice(plan as Parameters<typeof legacyFreeCoreSettings.planPrice>[0]),
  billingReadOnly: (): boolean => legacyFreeScreensBilling.readOnlyBilling(),
  notificationTypes: (): readonly (readonly unknown[])[] => TIPOS_NOTIF,
  sectionTitle: (section: string): string | undefined => TITULO_PEDSEC[section]?.[0],
  openPlanSettings: (): void => { settingsStore.section = 'plan'; ir('config'); },
  paymentState: (): { solo_lectura?: boolean } | null => ordersStore.paymentState,
  impersonationKey: (): string => SKEY,
  profileKey: (): string => PKEY,
  accessLost: (): boolean => sessionStore.accessOut,
  setAccessLost: (): void => { sessionStore.accessOut = true; },
  accessCheckedAt: (): number => sessionStore.accessChecked,
  setAccessCheckedAt: (time: number): void => { sessionStore.accessChecked = time; },
  backToMySession: (): Promise<void> => legacyFreeCoreNavigationApi.backToMySession(),
  isProfessionalPortal: (): boolean => ES_MEDICO(),
  // ---- Company words, states and language
  terms: (): Record<string, { s?: string; p?: string; g?: string } | undefined> => (sessionStore.terms ?? {}) as Record<string, { s?: string; p?: string; g?: string } | undefined>,
  brandLabel: (): string | undefined => ((settingsStore.settings.marca ?? {}) as { etiqueta?: string }).etiqueta,
  isFree: (order: object, total: unknown): boolean => Boolean(legacyFreeScreensOrders.isFree(order, total as number | null | undefined)),
  commercialStates: (): readonly { valor: string; papel: string }[] => sessionStore.commercialStates,
  language: (): string => sessionStore.language,
  setLanguage: (language: string): void => { sessionStore.language = language; },
  translationMap: (): Map<string, string> | null => (sessionStore.translationMap as Map<string, string> | null) ?? null,
  setTranslationMap: (map: Map<string, string> | null): void => { sessionStore.translationMap = map; },
  greetings: (): Readonly<Record<string, readonly string[]>> => SALUDOS,
  // ---- Screens and windows
  currentScreen: (): string => navigationStore.screen,
  appVersion: (): string => VERSION_APP,
  brandName: (): string => MARCA.nombre,
  versionSeenAt: (): number => sessionStore.versionSeen,
  setVersionSeenAt: (time: number): void => { sessionStore.versionSeen = time; },
  trail: (): readonly unknown[] => RASTRO,
  toast: (message: string, isError = false): void => { toast(message, isError); },
  confirm: (message: string, options: { titulo?: string; ok?: string }): Promise<boolean> => preguntar(message, options),
  choose: (title: string, message: string, buttons: ChoiceButton[]): Promise<string | null> => legacyFreeComponents.chooseOption(title, message, buttons),
  showDialog: (options: { titulo: string; msg: string; ok: string; campo: { valor: string; tipo: string } }): Promise<unknown> => legacyFreeComponents.showDialog(options),
  showLoading: (message: string): void => { legacyFreeComponents.showFullLoading(message); },
  hideLoading: (): void => { legacyFreeComponents.hideFullLoading(); },
  withButtonLoading: <T>(button: HTMLElement, text: string, work: () => Promise<T>): Promise<T> => legacyFreeCoreLegacyC.withLoading(button, text, work) as Promise<T>,
  registerError: (type: string, message: string, detail?: Record<string, unknown>): void => { legacyFreeCoreServices.errors.registerError(type, message, detail); },
  icon: (name: string): string => svgIco(ICON_NOM[name] ?? ''),
  paintConnection: (): void => { pintarConexion(); },
  reloadHome: (): void => { void cargarInicio(); },
  reloadAgenda: (): void => { void cargarAgenda(); },
  markQueuedVisits: (): void => { window.delcos.screens.agenda.markQueuedVisits(); },
  openNotifications: (list: readonly unknown[]): void => { panelNotificaciones(list); },
  setUnreadNotifications: (count: number): void => { settingsStore.notificationCount = count; },
  liveChannel: (): unknown => sessionStore.live,
  setLiveChannel: (channel: unknown): void => { sessionStore.live = channel; },
  repaintPortal: (isCentre: boolean): void => { if (isCentre && typeof centroPintar === 'function') centroPintar(); else void legacyFreeScreensPortal.paintMaterial(); },
  shownAccount: (): string | null => accountsStore.shownId,
  refreshCardPortal: (id: string): void => { window.delcos.screens.accounts.refreshPortal(id); },
  // ---- Reads, writes and their caches
  forgetReadCache: (): void => { RC.clear(); RC_VUELO.clear(); sessionStore.cacheEpoch++; },
  forgetSchemes: (): void => { homeStore.commissionSchemes = []; },
  writeCount: (): number => sessionStore.writes,
  pendingReads: (): number => navigationStore.pendingReads,
  arrivedVia: (): string | null => navigationStore.via,
  moduleCache: (module: string): { clave: unknown; t: number; esc: number } | undefined => CACHE_MOD[module] as { clave: unknown; t: number; esc: number } | undefined,
  moduleState: (module: string): unknown => ESTADO_MOD[module]?.(),
  agendaPreset: (): { fecha: string; data?: unknown } | null => agendaStore.presetDay,
  setAgendaPreset: (value: null): void => { agendaStore.presetDay = value; },
  setLastAgendaDay: (day: string, data: unknown): void => { agendaStore.lastPaintedDay = { fecha: day, data: data as AgendaAppointment[] }; },
  rememberAgendaDay: (day: string, data: unknown): void => { AG_DIAS_DATOS[day] = data as AgendaAppointment[]; },
  peekAgendaRange: (params: unknown): unknown => window.delcos.screens.agenda.data.peekRange(params as Parameters<typeof window.delcos.screens.agenda.data.peekRange>[0]),
  setHomeData: (panel: unknown, charts: unknown): void => { homeStore.panel = panel as HomePanel | null; homeStore.charts = charts as HomeCharts | null; },
  ordersSort: (): { k?: string | null; dir: number } | undefined => HT_ORDEN.peds2,
  visitDraft: (): VisitDraft | null => accountsStore.currentVisit,
  setVisitDraft: (value: null): void => { accountsStore.currentVisit = value; },
  sampleError: (result: object): string => muestraError(result),
  uploadVisitPhotos: (activity: string, photos: readonly unknown[]): Promise<boolean> => legacyFreeScreensVisit.uploadVisitPhotos(activity, photos as Parameters<typeof legacyFreeScreensVisit.uploadVisitPhotos>[1]),
  // ---- Maps and centres
  isIos: (): boolean => ES_IOS,
  isAndroid: (): boolean => ES_ANDROID,
  km: (from: unknown, to: unknown): number => km(from, to),
  routePlan: (): unknown => routesStore.plan,
  paintRoutePlan: (): void => { pintarPlan(); },
  centreFromLocation: (box: Element, index: string | number, lat: number, lon: number): Promise<void> => legacyFreeScreensAccounts.centreFromLocation(box as HTMLElement, index as string, lat, lon),
  centreList: (list: Element, centres: readonly unknown[], options: CentreListOptions): void => {
    legacyFreeScreensAccounts.centreList(list as HTMLElement, centres as Parameters<typeof legacyFreeScreensAccounts.centreList>[1], options.onPick as Parameters<typeof legacyFreeScreensAccounts.centreList>[2], options.extra ? { html: options.extra, onClick: options.onExtra } : undefined);
  },
  setCentre: (box: Element, index: string | number, centre: object): void => { legacyFreeScreensAccounts.setCentre(box as HTMLElement, index as string, centre); },
  paintCentreChoice: (box: Element, index: string | number): void => { void legacyFreeScreensAccounts.paintCentrePicker(box as HTMLElement, index as string, undefined); },
};
