/**
 * Legacy state and functions the core services (src/app/core, services/calendar, money, files, maps) still need, while the rest of the
 * app migrates: the profile, the plan, the company words and states, the language, the caches of the reads and the windows of the
 * screens. Each access reads the legacy value when called (the tests change some of them, e.g. PLAN_ACTUAL or TERMINOS).
 */
import * as legacyFreeCoreSettings from '../core/settings';
import * as legacyFreeCoreNavigationApi from '../core/navigation/api';
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
  profile: (): LegacyProfile | null => (PERFIL as LegacyProfile | null) ?? null,
  users: (): { id: string; nombre: string; rol: string }[] => (USUARIOS as { id: string; nombre: string; rol: string }[] | null) ?? [],
  roleCan: (role: string, capability: string): boolean => legacyFreeCoreSettings.roleCan(role, capability),
  currentPlan: (): { plan: string } => PLAN_ACTUAL as { plan: string },
  plans: (): readonly LegacyPlan[] => PLANES as readonly LegacyPlan[],
  planPrice: (plan: LegacyPlan): string => precioPlan(plan),
  billingReadOnly: (): boolean => facConsulta(),
  notificationTypes: (): readonly (readonly unknown[])[] => TIPOS_NOTIF,
  sectionTitle: (section: string): string | undefined => TITULO_PEDSEC[section]?.[0],
  openPlanSettings: (): void => { CFG_SEC = 'plan'; ir('config'); },
  paymentState: (): { solo_lectura?: boolean } | null => PAGO_ESTADO,
  impersonationKey: (): string => SKEY,
  profileKey: (): string => PKEY,
  accessLost: (): boolean => ACCESO_FUERA,
  setAccessLost: (): void => { ACCESO_FUERA = true; },
  accessCheckedAt: (): number => ACCESO_MIRADO,
  setAccessCheckedAt: (time: number): void => { ACCESO_MIRADO = time; },
  backToMySession: (): Promise<void> => legacyFreeCoreNavigationApi.backToMySession(),
  isProfessionalPortal: (): boolean => ES_MEDICO(),
  // ---- Company words, states and language
  terms: (): Record<string, { s?: string; p?: string; g?: string } | undefined> => (TERMINOS ?? {}) as Record<string, { s?: string; p?: string; g?: string } | undefined>,
  brandLabel: (): string | undefined => ((AJUSTES.marca ?? {}) as { etiqueta?: string }).etiqueta,
  isFree: (order: object, total: unknown): boolean => Boolean(sinCargoP(order, total)),
  commercialStates: (): readonly { valor: string; papel: string }[] => ESTADOS_DEF,
  language: (): string => IDIOMA,
  setLanguage: (language: string): void => { IDIOMA = language; },
  translationMap: (): Map<string, string> | null => (MAPA_I18N as Map<string, string> | null) ?? null,
  setTranslationMap: (map: Map<string, string> | null): void => { MAPA_I18N = map; },
  greetings: (): Readonly<Record<string, readonly string[]>> => SALUDOS,
  // ---- Screens and windows
  currentScreen: (): string => TAB,
  appVersion: (): string => VERSION_APP,
  brandName: (): string => MARCA.nombre,
  versionSeenAt: (): number => VERSION_VISTA,
  setVersionSeenAt: (time: number): void => { VERSION_VISTA = time; },
  trail: (): readonly unknown[] => RASTRO,
  toast: (message: string, isError = false): void => { toast(message, isError); },
  confirm: (message: string, options: { titulo?: string; ok?: string }): Promise<boolean> => preguntar(message, options),
  choose: (title: string, message: string, buttons: ChoiceButton[]): Promise<string | null> => elegirOpcion(title, message, buttons),
  showDialog: (options: { titulo: string; msg: string; ok: string; campo: { valor: string; tipo: string } }): Promise<unknown> => appVentana(options),
  showLoading: (message: string): void => { pantallaCarga(message); },
  hideLoading: (): void => { quitarCarga(); },
  withButtonLoading: <T>(button: HTMLElement, text: string, work: () => Promise<T>): Promise<T> => conCarga(button, text, work),
  registerError: (type: string, message: string, detail?: Record<string, unknown>): void => { registrarError(type, message, detail); },
  icon: (name: string): string => svgIco(ICON_NOM[name] ?? ''),
  paintConnection: (): void => { pintarConexion(); },
  reloadHome: (): void => { void cargarInicio(); },
  reloadAgenda: (): void => { void cargarAgenda(); },
  markQueuedVisits: (): void => { window.delcos.screens.agenda.markQueuedVisits(); },
  openNotifications: (list: readonly unknown[]): void => { panelNotificaciones(list); },
  setUnreadNotifications: (count: number): void => { NOTIF_N = count; },
  liveChannel: (): unknown => VIVO,
  setLiveChannel: (channel: unknown): void => { VIVO = channel; },
  repaintPortal: (isCentre: boolean): void => { if (isCentre && typeof centroPintar === 'function') centroPintar(); else portalMedico(); },
  shownAccount: (): string | null => FICHA_ID,
  refreshCardPortal: (id: string): void => { window.delcos.screens.accounts.refreshPortal(id); },
  // ---- Reads, writes and their caches
  forgetReadCache: (): void => { RC.clear(); RC_VUELO.clear(); RC_EPOCA++; },
  forgetSchemes: (): void => { ESQUEMAS = []; },
  writeCount: (): number => ESCRITURAS,
  pendingReads: (): number => PEND,
  arrivedVia: (): string | null => VIA_IR,
  moduleCache: (module: string): { clave: unknown; t: number; esc: number } | undefined => CACHE_MOD[module] as { clave: unknown; t: number; esc: number } | undefined,
  moduleState: (module: string): unknown => ESTADO_MOD[module]?.(),
  agendaPreset: (): { fecha: string; data?: unknown } | null => TD_PRESET,
  setAgendaPreset: (value: null): void => { TD_PRESET = value; },
  setLastAgendaDay: (day: string, data: unknown): void => { TD_ULTIMO = { fecha: day, data: data as AgendaAppointment[] }; },
  rememberAgendaDay: (day: string, data: unknown): void => { AG_DIAS_DATOS[day] = data as AgendaAppointment[]; },
  peekAgendaRange: (params: unknown): unknown => window.delcos.screens.agenda.data.peekRange(params as Parameters<typeof window.delcos.screens.agenda.data.peekRange>[0]),
  setHomeData: (panel: unknown, charts: unknown): void => { KV_INI = panel as HomePanel | null; KV_GRAF = charts as HomeCharts | null; },
  ordersSort: (): { k?: string | null; dir: number } | undefined => HT_ORDEN.peds2,
  visitDraft: (): VisitDraft | null => VISITA_ACTUAL,
  setVisitDraft: (value: null): void => { VISITA_ACTUAL = value; },
  sampleError: (result: object): string => muestraError(result),
  uploadVisitPhotos: (activity: string, photos: readonly unknown[]): Promise<boolean> => subirFotosVisita(activity, photos),
  // ---- Maps and centres
  isIos: (): boolean => ES_IOS,
  isAndroid: (): boolean => ES_ANDROID,
  km: (from: unknown, to: unknown): number => km(from, to),
  routePlan: (): unknown => PLAN,
  paintRoutePlan: (): void => { pintarPlan(); },
  centreFromLocation: (box: Element, index: string | number, lat: number, lon: number): Promise<void> => centroDesdeUbicacion(box, index, lat, lon),
  centreList: (list: Element, centres: readonly unknown[], options: CentreListOptions): void => {
    listaCentros(list, centres, options.onPick, options.extra, options.onExtra);
  },
  setCentre: (box: Element, index: string | number, centre: object): void => { cpPoner(box, index, centre); },
  paintCentreChoice: (box: Element, index: string | number): void => { pintarCentroSel(box, index); },
};
