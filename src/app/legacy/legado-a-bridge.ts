/**
 * Bridge for what legado 000–024 moved to src/app (v2.424.0): the legacy state and functions those pieces still read or write.
 * Each member is replaced by a direct import when its legacy owner moves.
 */
import * as legacyFreeScreensRoutes from '../screens/routes';
import * as legacyFreeScreensQuality from '../screens/quality';
import * as legacyFreeCoreServices from '../core/services';
import * as legacyFreeScreensAccounts from '../screens/accounts';
import * as legacyFreeComponents from '../components';
import * as legacyFreeScreensSettings from '../screens/settings';
import * as legacyFreeCoreSettings from '../core/settings';
import * as legacyFreeCoreLegacyC from '../core/legacy-c';
import { sessionStore } from '../core/session-store';
import { settingsStore } from '../screens/settings/store';
import { navigationStore } from '../core/navigation/store';
import { agendaStore } from '../screens/agenda/store';
import { accountsStore } from '../screens/accounts/store';
import * as legacyFreeComponentsEmbeddedWindow from '../components/embedded-window';
import * as legacyFreeCoreLeftovers from '../core/leftovers';
import * as legacyFreeScreensSettingsMore from '../screens/settings/more';
import * as legacyFreeScreensAccess from '../screens/access';
import * as legacyFreeScreensSettingsRest from '../screens/settings/rest';
import * as legacyFreeCoreNavigationApi from '../core/navigation/api';
import * as legacyFreeComponentsList from '../components/list';
import * as legacyFreeScreensPortal from '../screens/portal';
import * as legacyFreeScreensAgenda from '../screens/agenda';
import * as legacyFreeScreensManual from '../screens/manual';

type AuthAnswer = PromiseLike<{ error: { message: string } | null }>;
interface AskOptions { titulo?: string; ok?: string; tipo?: string; opciones?: string[] }

/** Startup: the database client and its answers. */
export const startupLegacy = {
  withOldKeys: (url: string, response: Response): Promise<Response> => respuestaConClavesAntiguas(url, response),
};

const MODULE_LOADERS: Readonly<Record<string, () => unknown>> = {
  directorio: () => { if (!document.getElementById('lista')?.children.length) buscar(true); },
  inicio: () => cargarInicio(), agenda: () => cargarAgenda(), rutas: () => legacyFreeScreensRoutes.loadRoutesPage(), seguimiento: () => legacyFreeScreensQuality.loadQuality(),
  ventas: () => cargarVentas(), analitica: () => cargarAnalitica(), config: () => cargarConfig(), duplicados: () => legacyFreeScreensAccounts.loadDuplicates(),
  pacientes: () => cargarPacientes(), productos: () => cargarProductosModulo(), manual: () => { void legacyFreeScreensManual.paintManual(); },
  facturacion: () => cargarFacturacion(), informe: () => legacyFreeScreensPortal.loadReport(),
};

/** The screen switch (irBase): navigation state, permissions and the loader of each module. */
export const switchLegacy = {
  isModule: (screen: string): boolean => screen in MODULO_AREA,
  hasProfile: (): boolean => Boolean(sessionStore.profile),
  moduleAllowedV2400: (screen: string): boolean => puedeModuloV2400(screen),
  moduleAllowed: (screen: string): boolean => puedeModulo(screen),
  planIncludes: (screen: string): boolean => legacyFreeCoreServices.plans.planIncludes(screen),
  planNotice: (screen: string): void => { legacyFreeCoreServices.plans.planNotice(screen); },
  openAdminSection: (): void => { settingsStore.section = CFG_ADMIN[settingsStore.adminSection] ?? 'usuarios'; },
  clearPending: (): void => { navigationStore.pendingReads = 0; },
  leavePanel: (): void => { legacyFreeComponentsEmbeddedWindow.leavePanel(); },
  abortNavigation: (): void => { navigationStore.abort.abort(); navigationStore.abort = new AbortController(); navigationStore.generation++; },
  closeSelector: (): void => { if (typeof cerrarSelector === 'function') cerrarSelector(); },
  isProfessionalPortal: (): boolean => ES_MEDICO(),
  rememberPrevious: (target: string): void => { if (target !== navigationStore.screen) navigationStore.previousScreen = navigationStore.screen; },
  forgetViewedAgenda: (): void => { agendaStore.viewedUser = null; },
  setScreen: (screen: string): void => { navigationStore.screen = screen; },
  screen: (): string => navigationStore.screen,
  pending: (): number => navigationStore.pendingReads,
  loadModule: (screen: string): void => { MODULE_LOADERS[screen]?.(); },
  paintBottomBar: (): void => { pintarBnav(); },
};

/** The app frame: sign in, menus, directory filters. */
export const shellLegacy = {
  signIn: (email: string, password: string): AuthAnswer => db.auth.signInWithPassword({ email, password }),
  signOut: (): PromiseLike<unknown> => db.auth.signOut(),
  notActivated: (message: string): void => { accesoSinActivar(message); },
  start: (): void => { void arrancar(); },
  goTo: (screen: string): void => { ir(screen); },
  screen: (): string => navigationStore.screen,
  applySavedFilter: (filter: object): void => { legacyFreeScreensAccounts.applySavedFilter(filter); },
  openIndicatorSettings: (): void => { abrirKpis(); },
  openAccount: (id: string): void => { void abrirFicha(id); },
  // eslint-disable-next-line id-length -- F is the legacy name of the directory filters
  filters: (): AccountFilters => F,
  stateFor: (role: string): string => legacyFreeCoreServices.states.stateOfRole(role),
  search: (): void => { buscar(true); },
  loadFilters: (reset?: boolean): void => { void legacyFreeScreensAccounts.loadFilters(!!reset); },
  restartSearchTimer: (run: () => void, ms: number): void => { clearTimeout(temporizador); temporizador = setTimeout(run, ms); },
};

/** Actions of the account card and «Crear nuevo». */
export const cardActionsLegacy = {
  askText: (message: string, options: AskOptions): Promise<string | null> => legacyFreeComponents.askText(message, '', options),
  urgencyReasons: (): string[] => (CAT.motivo_urgencia ?? []).map(item => item.valor),
  openAccount: (id: string): void => { void abrirFicha(id); },
  search: (): void => { buscar(true); },
  reloadHome: (): void => { void cargarInicio(); },
  tryClose: (box: HTMLDialogElement | null): void => { if (box) void legacyFreeComponents.tryClose(box); },
  recordVisit: (id: string): void => { void abrirVisita(id); },
  edit: (id: string): void => { void abrirEditor(id); },
  create: (kind: string): void => { void abrirEditor(null, kind); },
  toggleUrgent: (id: string, isUrgent: boolean): void => { void alternarUrgente(id, isUrgent); },
  canCreate: (): boolean => legacyFreeCoreServices.permissions.canCreate(),
  canCreateType: (kind: string): boolean => legacyFreeCoreServices.permissions.canCreateType(kind),
  newAccountName: (): string => fichaNueva().nombre,
};

/** The offline queue. */
export const connectionLegacy = {
  queued: (): number => colaLeer().length,
  paint: (): void => { pintarConexion(); },
  sendQueue: (): void => { void legacyFreeCoreServices.queue.sendQueue(); },
};

/** Appointment buttons outside the cards of «Tu día». */
export const agendaClicksLegacy = {
  // Without an account: the editor asks for it (the legacy signature takes null)
  newAppointment: (): void => { void nuevaCita(null as unknown as string, agendaStore.selectedDate); },
  write: (name: string, payload: Record<string, unknown>): Promise<{ error?: unknown } | null> => escribir(name, payload),
  openAccount: (id: string): void => { void abrirFicha(id); },
  recordVisit: (id: string): void => { void abrirVisita(id); },
  reloadAgenda: (): void => { void cargarAgenda(); },
  reloadHome: (): void => { void cargarInicio(); },
  screen: (): string => navigationStore.screen,
  windowChangedData: (): boolean => legacyFreeCoreLeftovers.changedWhileOpen(),
  quietRefresh: (): void => { agRefrescoQuieto(); },
};

/** Route buttons, navigation links and the route bar. */
export const routeListenersLegacy = {
  plan: (route: string, button: HTMLElement): void => { void planificar(route, button); },
  routeInProgress: (): boolean => Boolean(rutaActiva()),
  paintBar: (): void => { void legacyFreeScreensRoutes.paintRouteBar(); },
  paintInProgress: (): void => { legacyFreeScreensRoutes.paintDayInProgress(); },
  navigate: (destination: unknown, stops: unknown): void => { void (navegarA as unknown as (to: unknown, via: unknown) => Promise<void>)(destination, stops); },
};

export interface AdminUser { id: string; nombre: string; rol: string; email?: string | null; activo?: boolean; medicos: number; visitas: number }

/** The old Administración page. */
export const adminLegacy = {
  section: (): string => settingsStore.adminSection,
  users: (): AdminUser[] => settingsStore.users as AdminUser[],
  setUsers: (users: AdminUser[]): void => { settingsStore.users = users; },
  initials: (name: string): string => legacyFreeCoreServices.vocabulary.initials(name),
  canImpersonate: (user: AdminUser): boolean => legacyFreeCoreServices.permissions.canImpersonateUser(user as unknown as Parameters<typeof legacyFreeCoreServices.permissions.canImpersonateUser>[0]),
  // Plan 7.3: the promise is returned so Administración waits for the page (its code may still be loading)
  paintCommissions: (): unknown => pintarComisiones(),
  paintAccesses: (): void => { void legacyFreeScreensSettingsMore.paintAccesses(); },
  paintAudit: (): void => { void legacyFreeScreensSettings.paintAudit(); },
  newUser: (): void => { nuevoUsuario({}); },
  editUser: (id: string): void => { void editarUsuario(id); },
  assignPortfolio: (id: string): void => { void asignarCartera(id); },
  showPortfolio: (id: string): void => { void legacyFreeScreensAccounts.showPortfolio(id); },
  resetPassword: (user: Partial<AdminUser>): void => { void legacyFreeScreensAccess.resetPassword(user); },
  openSettingsSection: (section: string): void => { settingsStore.section = section; void cargarConfig(); },
  openAdminSection: (section: string): void => { settingsStore.adminSection = section; void cargarAdmin(); },
};

/** The password flows. */
export const passwordLegacy = {
  sendReset: (email: string, redirectTo: string): AuthAnswer => db.auth.resetPasswordForEmail(email, { redirectTo }),
  update: (password: string): AuthAnswer => db.auth.updateUser({ password }),
  onRecovery: (handler: () => void): void => { db.auth.onAuthStateChange((event: string) => { if (event === 'PASSWORD_RECOVERY') handler(); }); },
  hasRecoveryScreen: (): boolean => typeof pantallaRecuperacion === 'function',
  recoveryScreen: (): void => { pantallaRecuperacion(); },
  start: (): void => { void arrancar(); },
  askText: (message: string, value: string, options: AskOptions): Promise<string | null> => legacyFreeComponents.askText(message, value, options),
};

/** Small pieces of the app frame. */
export const shellExtrasLegacy = {
  goTo: (screen: string): void => { ir(screen); },
  toggleMapMode: (): boolean => { accountsStore.mapMode = !accountsStore.mapMode; return accountsStore.mapMode; },
  paintMap: (): void => { void legacyFreeScreensAccounts.paintMap(); },
  nearMe: (button: HTMLElement): void => { void cercaDeMi(button); },
  openTools: (context: string): void => { abrirHerramientas(context); },
  tryClose: (box: HTMLDialogElement): void => { void legacyFreeComponents.tryClose(box); },
  closePickers: (): void => { legacyFreeComponents.closePickers(undefined); },
  // eslint-disable-next-line id-length -- F is the legacy name of the directory filters
  filters: (): AccountFilters => F,
  search: (): void => { buscar(true); },
};

/** The global search. */
export const globalSearchLegacy = {
  highlight: (text: string, query: string): string => legacyFreeComponents.highlightSearch(text, query),
  // eslint-disable-next-line id-length -- F is the legacy name of the directory filters
  filters: (): AccountFilters => F,
  goTo: (screen: string): void => { ir(screen); },
  search: (): void => { buscar(true); },
  openAccount: (id: string): void => { void abrirFicha(id); },
};

interface FilterOptions { provincias: unknown[]; municipios: unknown[]; especialidades: unknown[]; estados: unknown[] }

/** The «Herramientas» panel of the directory. */
export const toolsPanelLegacy = {
  context: (): string | null => accountsStore.toolsContext,
  setContext: (context: string): void => { accountsStore.toolsContext = context; },
  // eslint-disable-next-line id-length -- F is the legacy name of the directory filters
  filters: (): AccountFilters => F,
  options: (): FilterOptions => accountsStore.filterOptions as FilterOptions,
  option: (list: unknown[], value: string, all: string): string => legacyFreeScreensAccounts.filterOptionsHtml(list as Parameters<typeof legacyFreeScreensAccounts.filterOptionsHtml>[0], value, all),
  allOf: (word: string): string => legacyFreeCoreServices.vocabulary.allOf(word),
  seesEverything: (): boolean => VE_TODO(),
  fieldFilters: (state: Record<string, unknown>): string => camposFiltros('medico', state, 'tfcp'),
  bindFieldFilters: (zone: Element, state: Record<string, unknown>): void => { legacyFreeScreensSettings.bindCustomFieldFilters(zone, state, (() => buscar(true))); },
  loadFilters: (): void => { void legacyFreeScreensAccounts.loadFilters(false); },
  search: (): void => { buscar(true); },
  openColumns: (): void => { abrirColumnas(); },
};

/** «★ Guardar filtro». */
export const saveFilterLegacy = {
  currentFilter: (): Record<string, unknown> => legacyFreeScreensAccounts.currentFilter() as unknown as Record<string, unknown>,
  filterText: (filter: Record<string, unknown>): string => legacyFreeScreensAccounts.filterText(filter),
  askText: (message: string, value: string, options: AskOptions): Promise<string | null> => legacyFreeComponents.askText(message, value, options),
  indicators: (): unknown[] => [...kpiConfig()],
  saveIndicators: (list: unknown[]): Promise<boolean> => legacyFreeScreensSettingsRest.saveIndicators((list as Record<string, unknown>[])),
  reloadHome: (): void => { void cargarInicio(); },
};

interface Answer { data?: unknown; error?: unknown }

/** The cache of requests: its maps and the original functions stay legacy globals (api.js reads them). */
export const cacheLegacy = {
  database: (): { rpc: unknown; from: unknown } => db as unknown as { rpc: unknown; from: unknown },
  original: (name: string, params: unknown, options: unknown): PromiseLike<Answer> => (RPC_ORIG as unknown as (n: string, p: unknown, o: unknown) => PromiseLike<Answer>)(name, params, options),
  originalFrom: (table: string): Record<string, unknown> => (FROM_ORIG as unknown as (t: string) => Record<string, unknown>)(table),
  isWrite: (name: string): boolean => RPC_ESCRITURA.test(name),
  ttl: (name: string): number | undefined => RPC_TTL[name],
  forget: (): void => { invalidarCache(); },
  withCatch: (request: PromiseLike<Answer>): Promise<Answer> => legacyFreeCoreServices.withCatch(request as Promise<Answer>),
  storageKey: (key: string): string => rcLS(key),
  copy: (answer: Answer): Answer => rcCopia(answer),
  epoch: (): number => sessionStore.cacheEpoch,
  cache: (): Map<string, unknown> => RC as unknown as Map<string, unknown>,
  flying: (): Map<string, Promise<Answer>> => RC_VUELO as unknown as Map<string, Promise<Answer>>,
};

type LegacyHelp = Record<string, [string, string, string[]] | undefined>;

/** Outside clicks, pagination and help buttons. */
export const outsideClicksLegacy = {
  tryClose: (box: HTMLDialogElement): void => { void legacyFreeComponents.tryClose(box); },
  paginate: (): void => { legacyFreeComponentsList.paginateLists(); },
  addHelp: (): void => { ponerAyudas(); },
  help: (key: string): [string, string, string[]] | undefined => (AYUDA as unknown as LegacyHelp)[key],
};

export interface Profile {
  id: string; nombre: string; rol: string; email: string;
  preferencias?: { idioma?: string; inicio?: string; kpis?: { id: string; on: boolean; t: string }[] } | null;
}

/** Entering the platform. */
export const showAppLegacy = {
  recovering: (): boolean => RECUPERANDO,
  recoveryScreen: (): void => { pantallaRecuperacion(); },
  prepareLanguage: (language: string): void => { legacyFreeCoreServices.language.prepareLanguage(language); },
  appVisible: (): boolean => navigationStore.appVisible,
  setAppVisible: (): void => { navigationStore.appVisible = true; },
  indicatorCatalog: (): readonly { id: string }[] => KPI_CAT,
  setProfile: (profile: Profile): void => { sessionStore.profile = profile; },
  initials: (name: string): string => legacyFreeCoreServices.vocabulary.initials(name),
  firstName: (name: string): string => legacyFreeCoreServices.vocabulary.firstName(name),
  longDate: (date: Date): string => legacyFreeCoreServices.calendar.longDate(date),
  canCreate: (): boolean => legacyFreeCoreServices.permissions.canCreate(),
  can: (capability: string): boolean => puede(capability),
  seesSales: (): boolean => Boolean(veVentas()),
  seesEverything: (): boolean => VE_TODO(),
  loadCatalogs: (): void => { void legacyFreeCoreSettings.loadCatalogs(); },
  paintRouteBar: (): void => { void legacyFreeScreensRoutes.paintRouteBar(); },
  loadHome: (): void => { void cargarInicio(); },
  loadFilters: (): void => { void legacyFreeScreensAccounts.loadFilters(false); },
  loadSalesTeam: (): void => { void legacyFreeCoreLeftovers.loadSalesTeam(); },
  loadSettings: (): void => { void legacyFreeCoreSettings.loadSettings(); },
  inTestEnvironment: (): boolean => EN_PRUEBAS,
  paintTestStrip: (): void => { pintarFranjaPruebas(); },
  paintImpersonationBar: (): void => { legacyFreeCoreServices.session.paintImpersonationBar(); },
  paintBottomBar: (): void => { pintarBnav(); },
  applyMenuPermissions: (): void => { aplicarPermisosMenu(); },
  refreshBell: (): void => { void refrescarCampana(); },
  goTo: (screen: string): void => { ir(screen); },
  applyBrand: (): void => { legacyFreeCoreSettings.applyBrand(); },
  screenAfterF5: (): unknown => legacyFreeCoreNavigationApi.screenAfterReload(),
  backAfterF5: (screen: unknown): void => { legacyFreeCoreNavigationApi.returnAfterReload(screen as Parameters<typeof legacyFreeCoreNavigationApi.returnAfterReload>[0]); },
  moduleAllowed: (screen: string): boolean => puedeModulo(screen),
  dayNotices: (): void => {
    Promise.resolve(RPC_ORIG<{ nuevo?: boolean }>('avisos_del_dia', {})).then(answer => { if (answer.data?.nuevo) void refrescarCampana(); }, () => undefined);
  },
  translatePage: (): void => { if (sessionStore.translationMap) legacyFreeCoreServices.language.translate(document.body); },
  bookIcon: (): string => svgIco(ICON_NOM['book-open'] ?? ''),
  menuIcons: (): void => { iconosMenu(); },
  orderMenu: (): void => { legacyFreeCoreNavigationApi.orderMenu(); },
  qualityButton: (): void => { legacyFreeScreensQuality.paintAccountsHeader(); },
};

/** The portfolio window. */
export const portfolioLegacy = {
  firstName: (name: string): string => legacyFreeCoreServices.vocabulary.firstName(name),
  loading: (element: HTMLElement, text: string): void => { cargando(element, text); },
  pages: (total: number, page: number, size: number): string => legacyFreeComponentsList.pageHtml(total, page, size),
  reloadAdmin: (): void => { void cargarAdmin(); },
};

/** The period selector. */
export const periodLegacy = {
  userId: (): string => (sessionStore.profile ? (sessionStore.profile as { id: string }).id : ''),
  periods: (): readonly (readonly [string, string])[] => PERIODOS,
  rangeOf: (period: string): (string | null)[] => legacyFreeCoreServices.calendar.periodRange(period),
  shortDate: (isoDate: string | null): string => legacyFreeCoreServices.calendar.shortDate((isoDate ?? '')),
};

/** The strip of the test environment. */
export const testStripLegacy = {
  inTests: (): boolean => EN_PRUEBAS,
  notConfigured: (): boolean => Boolean((CFG as { sinConfigurar?: boolean }).sinConfigurar),
  isAdmin: (): boolean => Boolean(sessionStore.profile) && puede('administrar'),
  environment: (): PromiseLike<{ data: { maestro_guardado_en?: string | null } | null }> =>
    RPC_ORIG_FROM('entorno_pruebas').select('maestro_guardado_en, ultimo_reset').eq('id', 1).single() as unknown as PromiseLike<{ data: { maestro_guardado_en?: string | null } | null }>,
  askText: (message: string, value: string, options: AskOptions): Promise<string | null> => legacyFreeComponents.askText(message, value, options),
  reset: (): PromiseLike<LegacyResult<{ ok?: boolean; error?: string }>> => RPC_ORIG<{ ok?: boolean; error?: string }>('pruebas_resetear', { p_confirmacion: 'RESTABLECER' }),
};

export interface EstimatedAppointment { id: string; estado: string; dias?: Record<string, string | null> | null; hora?: string | null }
export interface StopNotice { ventanas: [number, number][] | null; aviso?: string; espera?: number }
interface PlanSettings { visita: number; salida: string; parada: number; tope: string; conSalida?: boolean }
interface RouteHours { vuelta?: string | null }
interface DayEstimateResult { est: Record<string, number>; fin: number; tope: number }

/** The estimate of «Tu día». */
export const dayEstimateLegacy = {
  planSettings: (): PlanSettings => PLANCFG() as PlanSettings,
  // The legacy arithmetic takes the stored values as they are
  startPoint: (): { lat: number; lon: number } => salidaUsuario() as unknown as { lat: number; lon: number },
  minutesOf: (time: string | null | undefined): number => legacyFreeCoreServices.calendar.timeToMinutes(time) ?? 0,   // the settings always have their hours
  minutesOrNull: (time: string | null | undefined): number | null => legacyFreeCoreServices.calendar.timeToMinutes(time),
  pointOf: (appointment: EstimatedAppointment): [number, number] | null => xyCita(appointment) ?? null,
  isOpen: (state: string): boolean => CITA_ABIERTA.includes(state),
  windowsOf: (days: Record<string, string | null> | null | undefined, isoDate: string): [number, number][] | null => legacyFreeComponents.attendanceWindows(days, isoDate),
  travelMinutes: (from: [number, number], to: [number, number]): number => legacyFreeScreensAgenda.legMinutes(from, to),
  possibleStart: (item: { xy: [number, number] | null; ventanas: [number, number][] | null; fija: number | null }, arrival: number, duration: number): number | null => legacyFreeCoreLeftovers.earliestStart(item, arrival, duration) ?? null,
  hourText: (minutes: number): string => hm(minutes),
  windowsText: (windows: readonly [number, number][] | null): string => txtVentanas(windows ?? []),
  setStopInfo: (info: Record<string, StopNotice>): void => { agendaStore.stopInfo = info; },
  routeHours: (appointments: readonly EstimatedAppointment[]): RouteHours | null => horDeCitas(appointments) as RouteHours | null,
  withHours: (hours: RouteHours | null, run: () => DayEstimateResult): DayEstimateResult => legacyFreeScreensRoutes.withHours(hours as Parameters<typeof legacyFreeScreensRoutes.withHours>[0], run),
  estimateBase: (appointments: readonly EstimatedAppointment[], isoDate: string): DayEstimateResult => legacyFreeCoreLegacyC.estimateDay(appointments, isoDate) as DayEstimateResult,
};

/** Small settings applied while loading. */
export const loadTimeLegacy = {
  cacheTimes: (): Record<string, number | undefined> => RPC_TTL,
  helpAnchors: (): [string, string][] => ANCLAS_AYUDA,
  stateColours: (): Record<string, string> => EST_COL as Record<string, string>,
};
