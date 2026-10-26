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

type AuthAnswer = PromiseLike<{ error: { message: string } | null }>;
interface AskOptions { titulo?: string; ok?: string; tipo?: string; opciones?: string[] }

/** Startup: the database client and its answers. */
export const startupLegacy = {
  withOldKeys: (url: string, response: Response): Promise<Response> => respuestaConClavesAntiguas(url, response),
};

const MODULE_LOADERS: Readonly<Record<string, () => unknown>> = {
  directorio: () => { if (!document.getElementById('lista')?.children.length) buscar(true); },
  inicio: () => cargarInicio(), agenda: () => cargarAgenda(), rutas: () => legacyFreeScreensRoutes.loadRoutesPage(), seguimiento: () => legacyFreeScreensQuality.loadQuality(),
  ventas: () => cargarVentas(), analitica: () => cargarAnalitica(), config: () => cargarConfig(), duplicados: () => cargarDuplicados(),
  pacientes: () => cargarPacientes(), productos: () => cargarProductosModulo(), manual: () => cargarManual(),
  facturacion: () => cargarFacturacion(), informe: () => cargarInforme(),
};

/** The screen switch (irBase): navigation state, permissions and the loader of each module. */
export const switchLegacy = {
  isModule: (screen: string): boolean => screen in MODULO_AREA,
  hasProfile: (): boolean => Boolean(sessionStore.profile),
  moduleAllowedV2400: (screen: string): boolean => puedeModuloV2400(screen),
  moduleAllowed: (screen: string): boolean => puedeModulo(screen),
  planIncludes: (screen: string): boolean => planIncluye(screen),
  planNotice: (screen: string): void => { avisoPlan(screen); },
  openAdminSection: (): void => { settingsStore.section = CFG_ADMIN[settingsStore.adminSection] ?? 'usuarios'; },
  clearPending: (): void => { navigationStore.pendingReads = 0; },
  leavePanel: (): void => { salirPanel(); },
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
  applySavedFilter: (filter: object): void => { aplicarFiltroGuardado(filter); },
  openIndicatorSettings: (): void => { abrirKpis(); },
  openAccount: (id: string): void => { void abrirFicha(id); },
  // eslint-disable-next-line id-length -- F is the legacy name of the directory filters
  filters: (): AccountFilters => F,
  stateFor: (role: string): string => estadoPapel(role),
  search: (): void => { buscar(true); },
  loadFilters: (reset?: boolean): void => { void cargarFiltros(reset); },
  restartSearchTimer: (run: () => void, ms: number): void => { clearTimeout(temporizador); temporizador = setTimeout(run, ms); },
};

/** Actions of the account card and «Crear nuevo». */
export const cardActionsLegacy = {
  askText: (message: string, options: AskOptions): Promise<string | null> => pedirTexto(message, '', options),
  urgencyReasons: (): string[] => (CAT.motivo_urgencia ?? []).map(item => item.valor),
  openAccount: (id: string): void => { void abrirFicha(id); },
  search: (): void => { buscar(true); },
  reloadHome: (): void => { void cargarInicio(); },
  tryClose: (box: HTMLDialogElement | null): void => { if (box) intentarCerrar(box); },
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
  sendQueue: (): void => { void vaciarCola(); },
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
  windowChangedData: (): boolean => agCambiosEnVentana(),
  quietRefresh: (): void => { agRefrescoQuieto(); },
};

/** Route buttons, navigation links and the route bar. */
export const routeListenersLegacy = {
  plan: (route: string, button: HTMLElement): void => { void planificar(route, button); },
  routeInProgress: (): boolean => Boolean(rutaActiva()),
  paintBar: (): void => { void legacyFreeScreensRoutes.paintRouteBar(); },
  paintInProgress: (): void => { void pintarRutaEnCurso(); },
  navigate: (destination: unknown, stops: unknown): void => { void (navegarA as unknown as (to: unknown, via: unknown) => Promise<void>)(destination, stops); },
};

export interface AdminUser { id: string; nombre: string; rol: string; email?: string | null; activo?: boolean; medicos: number; visitas: number }

/** The old Administración page. */
export const adminLegacy = {
  section: (): string => settingsStore.adminSection,
  users: (): AdminUser[] => settingsStore.users as AdminUser[],
  setUsers: (users: AdminUser[]): void => { settingsStore.users = users; },
  initials: (name: string): string => iniciales(name),
  canImpersonate: (user: AdminUser): boolean => puedeVerComo(user as unknown as PlatformUser),
  paintCommissions: (): void => { void pintarComisiones(); },
  paintAccesses: (): void => { void pintarAccesos(); },
  paintAudit: (): void => { void pintarAuditoria(); },
  newUser: (): void => { nuevoUsuario({}); },
  editUser: (id: string): void => { void editarUsuario(id); },
  assignPortfolio: (id: string): void => { void asignarCartera(id); },
  showPortfolio: (id: string): void => { void verCartera(id); },
  resetPassword: (user: Partial<AdminUser>): void => { void restablecerPassword(user); },
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
  askText: (message: string, value: string, options: AskOptions): Promise<string | null> => pedirTexto(message, value, options),
};

/** Small pieces of the app frame. */
export const shellExtrasLegacy = {
  goTo: (screen: string): void => { ir(screen); },
  toggleMapMode: (): boolean => { accountsStore.mapMode = !accountsStore.mapMode; return accountsStore.mapMode; },
  paintMap: (): void => { void legacyFreeScreensAccounts.paintMap(); },
  nearMe: (button: HTMLElement): void => { void cercaDeMi(button); },
  openTools: (context: string): void => { abrirHerramientas(context); },
  tryClose: (box: HTMLDialogElement): void => { intentarCerrar(box); },
  closePickers: (): void => { cerrarPickers(); },
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
  option: (list: unknown[], value: string, all: string): string => optFiltro(list, value, all),
  allOf: (word: string): string => todosLos(word),
  seesEverything: (): boolean => VE_TODO(),
  fieldFilters: (state: Record<string, unknown>): string => camposFiltros('medico', state, 'tfcp'),
  bindFieldFilters: (zone: Element, state: Record<string, unknown>): void => { legacyFreeScreensSettings.bindCustomFieldFilters(zone, state, (() => buscar(true))); },
  loadFilters: (): void => { void cargarFiltros(); },
  search: (): void => { buscar(true); },
  openColumns: (): void => { abrirColumnas(); },
};

/** «★ Guardar filtro». */
export const saveFilterLegacy = {
  currentFilter: (): Record<string, unknown> => filtroActual(),
  filterText: (filter: Record<string, unknown>): string => textoFiltro(filter),
  askText: (message: string, value: string, options: AskOptions): Promise<string | null> => pedirTexto(message, value, options),
  indicators: (): unknown[] => [...kpiConfig()],
  saveIndicators: (list: unknown[]): Promise<boolean> => guardarKpis(list as Record<string, unknown>[]),
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
  withCatch: (request: PromiseLike<Answer>): Promise<Answer> => conCatch(request),
  storageKey: (key: string): string => rcLS(key),
  copy: (answer: Answer): Answer => rcCopia(answer),
  epoch: (): number => sessionStore.cacheEpoch,
  cache: (): Map<string, unknown> => RC as unknown as Map<string, unknown>,
  flying: (): Map<string, Promise<Answer>> => RC_VUELO as unknown as Map<string, Promise<Answer>>,
};

type LegacyHelp = Record<string, [string, string, string[]] | undefined>;

/** Outside clicks, pagination and help buttons. */
export const outsideClicksLegacy = {
  tryClose: (box: HTMLDialogElement): void => { intentarCerrar(box); },
  paginate: (): void => { paginarListas(); },
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
  prepareLanguage: (language: string): void => { prepararIdioma(language); },
  appVisible: (): boolean => navigationStore.appVisible,
  setAppVisible: (): void => { navigationStore.appVisible = true; },
  indicatorCatalog: (): readonly { id: string }[] => KPI_CAT,
  setProfile: (profile: Profile): void => { sessionStore.profile = profile; },
  initials: (name: string): string => iniciales(name),
  firstName: (name: string): string => nombrePila(name),
  longDate: (date: Date): string => legacyFreeCoreServices.calendar.longDate(date),
  canCreate: (): boolean => legacyFreeCoreServices.permissions.canCreate(),
  can: (capability: string): boolean => puede(capability),
  seesSales: (): boolean => Boolean(veVentas()),
  seesEverything: (): boolean => VE_TODO(),
  loadCatalogs: (): void => { void legacyFreeCoreSettings.loadCatalogs(); },
  paintRouteBar: (): void => { void legacyFreeScreensRoutes.paintRouteBar(); },
  loadHome: (): void => { void cargarInicio(); },
  loadFilters: (): void => { void cargarFiltros(); },
  loadSalesTeam: (): void => { void cargarComerciales(); },
  loadSettings: (): void => { void legacyFreeCoreSettings.loadSettings(); },
  inTestEnvironment: (): boolean => EN_PRUEBAS,
  paintTestStrip: (): void => { pintarFranjaPruebas(); },
  paintImpersonationBar: (): void => { pintarBarraSuplantacion(); },
  paintBottomBar: (): void => { pintarBnav(); },
  applyMenuPermissions: (): void => { aplicarPermisosMenu(); },
  refreshBell: (): void => { void refrescarCampana(); },
  goTo: (screen: string): void => { ir(screen); },
  applyBrand: (): void => { legacyFreeCoreSettings.applyBrand(); },
  screenAfterF5: (): unknown => pantallaTrasF5(),
  backAfterF5: (screen: unknown): void => { void volverTrasF5(screen); },
  moduleAllowed: (screen: string): boolean => puedeModulo(screen),
  dayNotices: (): void => {
    Promise.resolve(RPC_ORIG<{ nuevo?: boolean }>('avisos_del_dia', {})).then(answer => { if (answer.data?.nuevo) void refrescarCampana(); }, () => undefined);
  },
  translatePage: (): void => { if (sessionStore.translationMap) traducir(document.body); },
  bookIcon: (): string => svgIco(ICON_NOM['book-open'] ?? ''),
  menuIcons: (): void => { iconosMenu(); },
  orderMenu: (): void => { ordenarMenu(); },
  qualityButton: (): void => { legacyFreeScreensQuality.paintAccountsHeader(); },
};

/** The portfolio window. */
export const portfolioLegacy = {
  firstName: (name: string): string => nombrePila(name),
  loading: (element: HTMLElement, text: string): void => { cargando(element, text); },
  pages: (total: number, page: number, size: number): string => pagHTML(total, page, size),
  reloadAdmin: (): void => { void cargarAdmin(); },
};

/** The period selector. */
export const periodLegacy = {
  userId: (): string => (sessionStore.profile ? (sessionStore.profile as { id: string }).id : ''),
  periods: (): readonly (readonly [string, string])[] => PERIODOS,
  rangeOf: (period: string): (string | null)[] => rangoPeriodo(period),
  shortDate: (isoDate: string | null): string => legacyFreeCoreServices.calendar.shortDate((isoDate ?? '')),
};

/** The strip of the test environment. */
export const testStripLegacy = {
  inTests: (): boolean => EN_PRUEBAS,
  notConfigured: (): boolean => Boolean((CFG as { sinConfigurar?: boolean }).sinConfigurar),
  isAdmin: (): boolean => Boolean(sessionStore.profile) && puede('administrar'),
  environment: (): PromiseLike<{ data: { maestro_guardado_en?: string | null } | null }> =>
    RPC_ORIG_FROM('entorno_pruebas').select('maestro_guardado_en, ultimo_reset').eq('id', 1).single() as unknown as PromiseLike<{ data: { maestro_guardado_en?: string | null } | null }>,
  askText: (message: string, value: string, options: AskOptions): Promise<string | null> => pedirTexto(message, value, options),
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
  windowsOf: (days: Record<string, string | null> | null | undefined, isoDate: string): [number, number][] | null => ventanasDe(days, isoDate) as [number, number][] | null,
  travelMinutes: (from: [number, number], to: [number, number]): number => tdMinutos(from, to),
  possibleStart: (item: { xy: [number, number] | null; ventanas: [number, number][] | null; fija: number | null }, arrival: number, duration: number): number | null => inicioPosible(item, arrival, duration) ?? null,
  hourText: (minutes: number): string => hm(minutes),
  windowsText: (windows: readonly [number, number][] | null): string => txtVentanas(windows ?? []),
  setStopInfo: (info: Record<string, StopNotice>): void => { agendaStore.stopInfo = info; },
  routeHours: (appointments: readonly EstimatedAppointment[]): RouteHours | null => horDeCitas(appointments) as RouteHours | null,
  withHours: (hours: RouteHours | null, run: () => DayEstimateResult): DayEstimateResult => conHor(hours, run),
  estimateBase: (appointments: readonly EstimatedAppointment[], isoDate: string): DayEstimateResult => legacyFreeCoreLegacyC.estimateDay(appointments, isoDate) as DayEstimateResult,
};

/** Small settings applied while loading. */
export const loadTimeLegacy = {
  cacheTimes: (): Record<string, number | undefined> => RPC_TTL,
  helpAnchors: (): [string, string][] => ANCLAS_AYUDA,
  stateColours: (): Record<string, string> => EST_COL as Record<string, string>,
};
