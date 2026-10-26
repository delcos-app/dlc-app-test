/**
 * Second part of the bridge of the folded legacy layers 080–161 (src/app/core/layers, v2.424.0): Agenda, menu, lists, phone and
 * session details. Split from legado-d-bridge.ts to keep both short.
 */
import * as legacyFreeScreensRoutes from '../screens/routes';
import * as legacyFreeCoreNavigationApi from '../core/navigation/api';
import * as legacyFreeCoreLegacyC from '../core/legacy-c';
import * as legacyFreeCoreServices from '../core/services';
import * as legacyFreeCoreLeftovers from '../core/leftovers';
import { agendaStore } from '../screens/agenda/store';
import { navigationStore } from '../core/navigation/store';
import { sessionStore } from '../core/session-store';
import { routesStore } from '../screens/routes/store';
import { settingsStore } from '../screens/settings/store';
import { accountsStore } from '../screens/accounts/store';
import { ordersStore } from '../screens/orders/store';
import { productsStore } from '../screens/products/store';

type AnyFunction = (...args: unknown[]) => unknown;
const globals = window as unknown as Record<string, unknown>;

function wrapGlobal(name: string, wrapper: (original: AnyFunction) => AnyFunction): void {
  const original = globals[name];
  if (typeof original === 'function') globals[name] = wrapper(original as AnyFunction);
}

export const agendaGlueLegacy = {
  closeMonth: (): void => { cerrarMesCinta(); },
  dayAppointments: (): AgendaAppointment[] => agendaStore.dayAppointments,
  openAppointment: (appointment: AgendaAppointment): void => { void verCita(appointment); },
  mode: (): string => agendaStore.mode,
  backToDay: (): void => {
    agendaStore.mode = 'dia'; agendaStore.viewedUser = null;
    const select = document.getElementById('agvista') as HTMLSelectElement | null; if (select) select.value = '';
    void cargarAgenda();
  },
  calculating: (): boolean => agendaStore.trafficCalculated,
  baseEstimate: (appointments: unknown, isoDate: string, rest: unknown[]): unknown => estimarDiaBase2(appointments, isoDate, ...rest),
  dayRoute: (appointments: unknown, isoDate: string): { k: string } | null => tdRutaDia(appointments, isoDate),
  realTimes: (): { k: string } | null => agendaStore.realTimes,
  setRealTimes: (value: null): void => { agendaStore.realTimes = value; },
  realTimesValid: (): boolean => Boolean(tdRealVigente()),
  today: (): string => hoyISO(),
  rememberedRoute: (key: string): { t: number; r: unknown } | undefined => RM_MEM.get(key),
  putRealTimes: (route: { k: string }, result: unknown): void => { tdPonerReal(route, result); },
  baseToggleUrgent: (id: string, rest: unknown[]): Promise<unknown> => alternarUrgenteBase(id, ...rest),
  forgetCaches: (): void => { invalidarCache(); try { DB_PRE.clear(); } catch { /* nothing preloaded */ } },
  currentScreen: (): string => navigationStore.screen,
  searchAccounts: (): void => { void buscar(true); },
  quietRefresh: (): void => { if (typeof agRefrescoQuieto === 'function') agRefrescoQuieto(); },
};

/** Read when called: core.js runs before the legacy code declares PAGINAS and PL. */
const pages = (): Record<string, { t: string; d?: string; tabs: [string, string, () => unknown][] } | undefined> => PAGINAS as Record<string, { t: string; d?: string; tabs: [string, string, () => unknown][] } | undefined>;
export const navigationGlueLegacy = {
  profileLoaded: (): boolean => Boolean(sessionStore.profile),
  addIconIfMissing: (name: string, svg: string): void => { const icons = ICON_NOM as Record<string, string>; if (!icons[name]) icons[name] = svg; },
  canSeeArea: (area: string): boolean => typeof verArea !== 'function' || verArea(area),
  refillRoutes: (): void => { void legacyFreeScreensRoutes.refillRepeating(); },
  routeDraft: (): unknown => routesStore.wizard,
  forgetRouteDraft: (): void => { routesStore.wizard = null; },
  wrapGlobal,
  applyMenuNames: (): void => { aplicarNombresMenu(); },
  applyMenuNamesSoon: (): void => {
    if (!Object.keys(menuNombres()).length || settingsStore.textsObserverTimer) return;
    settingsStore.textsObserverTimer = requestAnimationFrame(() => { settingsStore.textsObserverTimer = 0; try { aplicarNombresMenu(); } catch { /* the menu may be incomplete */ } });
  },
  baseApplyLabel: (args: unknown[]): unknown => aplicarEtiquetaBase(...args),
  currentScreen: (): string => navigationStore.screen,
  hasReadyCheck: (screen: string): boolean => Boolean(LISTA_PARA[screen]),
  setReadyCheck: (screen: string, check: (section: HTMLElement) => boolean): void => { LISTA_PARA[screen] = check; },
  reveal: (screen: HTMLElement): void => { revelar(screen, 6000, Date.now() - 5); },
  homeHeader: (): void => { inicioCabecera(); },
  renameUsersPage: (title: string, hint: string): void => {
    const page = pages().usuarios; if (!page) return;
    page.t = title; page.d = hint; page.tabs = page.tabs.filter(tab => tab[0] !== 'roles');
  },
  isProfessionalPortal: (): boolean => ES_MEDICO(),
  baseBottomBar: (args: unknown[]): unknown => pintarBnavBase3(...args),
  mobileModules: (): string[] => legacyFreeCoreNavigationApi.bottomBar(),
  moduleIcon: (module: string): string | undefined => ICO_MOD[module],
  mobileName: (module: string): string => legacyFreeCoreNavigationApi.mobileName(module),
  goTo: (screen: string): void => { void ir(screen); },
  openMoreMenu: (): void => { abrirMasMovil(); },
  measureBottomBar: (): void => { medirBnav(); },
  baseSummariseHelp: (popup: HTMLElement): void => { legacyFreeCoreLegacyC.summariseHelp(popup); },
  helpAnchor: (button: HTMLElement): string => anclaAyuda(button),
  manualAnchor: (screen: string): string | undefined => MANUAL_ANCLA[screen],
  openManual: (anchor: string): void => { abrirManual(anchor); },
};

export interface CountItem { k: string; t: string; n: number; s: string }
export interface LegacyOrderRow { id: string; contacto?: string | null; centro?: string | null; cuenta_texto?: string | null; medico?: string | null; unidades?: number | null; productos?: string | null; forma_pago?: string | null; fecha: string; total?: number | null }
type ListConfig = { kpiFirma?: () => string; kpis?: () => Promise<CountItem[]>; pedidos?: { card?: (row: HTMLElement) => Record<string, string> } } | undefined;
const lists = (): Record<string, ListConfig> => PL as Record<string, ListConfig>;
export const listGlueLegacy = {
  leaveNearby: (): void => { accountsStore.nearby = null; void buscar(true); },
  clearCustomerDoctor: (): void => { PAC.medico = null; PAC.medicoNombre = ''; PAC.pagina = 0; },
  listCustomers: (): void => { void listaPacientes(); },
  setAccountType: (type: string): void => { F.tipo = type; },
  searchAccounts: (): void => { void buscar(true); },
  rememberFilter: (event: Event): void => { filtroGuardar(event); },
  baseMountPeriod: (element: HTMLElement | null, args: unknown[]): unknown => montarPeriodoBase(element, ...args),
  restoreFilters: (root: HTMLElement | null): void => { filtrosRestaurar(root); },
  setOrderCard: (card: (row: HTMLElement) => Record<string, string>): void => { const sales = lists().ventas as unknown as { pedidos: { card?: unknown } }; sales.pedidos.card = card; },
  orders: (): LegacyOrderRow[] => (typeof ordersStore.orders === 'undefined' ? [] : ordersStore.orders as LegacyOrderRow[]),
  number: (value: unknown): string => num(value),
  isFree: (order: LegacyOrderRow): boolean => Boolean(sinCargoP(order, order.total)),
  shortDate: (isoDate: string): string => legacyFreeCoreServices.calendar.shortDate(isoDate),
  canSeeAmounts: (): boolean => verImportes(),
  euros: (value: number): string => eurI(value),
  stepPill: (order: LegacyOrderRow): string => pillPaso(order),
  accountFilters: (): (() => AccountFilters & { campos?: Record<string, unknown> }) => () => F as AccountFilters & { campos?: Record<string, unknown> },
  customerFilters: (): (() => typeof PAC) => () => PAC,
  hasListConfig: (screen: string): boolean => Boolean(lists()[screen]),
  setIndicators: (screen: string, signature: () => string, counts: () => Promise<CountItem[]>): void => { const list = lists()[screen]; if (!list) return; list.kpiFirma = signature; list.kpis = counts; },
  total: (name: string, args: Record<string, unknown>): Promise<number> => Promise.resolve(RPC_ORIG<{ total?: number }>(name, args)).then(result => result.data?.total ?? 0, () => 0),
};

interface QueuedChange { fn: string; etiqueta?: string; t?: number; falla?: number; motivo?: string }
export const deviceLegacy = {
  isMobile: (): boolean => ES_MOVIL(),
  icon: (name: string): string => svgIco(ICON_NOM[name] ?? ''),
  debounceAddButton: (work: () => void, ms: number): void => { clearTimeout(navigationStore.fabResize); navigationStore.fabResize = setTimeout(work, ms); },
  addButtonToDesktop: (): void => { fabAOrdenador(); },
  currentScreen: (): string => navigationStore.screen,
  syncListBar: (screen: string): void => { if (typeof plSync === 'function') plSync(screen); },
  basePaintConnection: (args: unknown[]): unknown => pintarConexionBase(...args),
  refusedChanges: (): QueuedChange[] => legacyFreeCoreServices.queue.refused() as QueuedChange[],
  queuedChanges: (): QueuedChange[] => colaLeer() as QueuedChange[],
  choose: (title: string, message: string, buttons: ChoiceButton[]): Promise<string | null> => elegirOpcion(title, message, buttons),
  confirm: (message: string, options: { titulo?: string; ok?: string; peligro?: boolean }): Promise<boolean> => preguntar(message, options),
  saveQueue: (queue: QueuedChange[]): void => { colaGuardar(queue); },
  forgetRefused: (): void => { localStorage.removeItem(COLA_KO); },
  paintConnection: (): void => { pintarConexion(); },
  sendQueue: (): void => { void vaciarCola(); },
  addScannerButtonsSoon: (): void => { if (navigationStore.scannerPending) return; navigationStore.scannerPending = true; queueMicrotask(() => { navigationStore.scannerPending = false; legacyFreeCoreLeftovers.addScannerButtons(undefined); }); },
  openScanner: (input: HTMLInputElement): void => { void legacyFreeCoreLeftovers.openScanner(input); },
  passwordEye: (input: HTMLInputElement): void => { ojoClave(input); },
};

type HelpText = [string, string, string[]];
export const sessionGlueLegacy = {
  help: (key: string): HelpText | undefined => (AYUDA as unknown as Record<string, HelpText | undefined>)[key],
  defineHelp: (key: string, get: () => HelpText | undefined, set: (value: HelpText | undefined) => void): void => { Object.defineProperty(AYUDA, key, { configurable: true, enumerable: true, get, set }); },
  isProfessionalPortal: (): boolean => typeof ES_MEDICO === 'function' && ES_MEDICO(),
  checkAccess: (force?: boolean): void => { void comprobarAcceso(force); },
  refreshBell: (): void => { void refrescarCampana(); },
  profileLoaded: (): boolean => Boolean((sessionStore.profile as { id?: string } | null)?.id),
  liveNotices: (): void => { avisosEnVivo(); },
  setCentreStateClass: (state: string, pill: string): void => { NOMBRE_ESTADO_CENTRO[state] = pill; },
  setMaterialForPortal: (id: string, offered: boolean): PromiseLike<LegacyResult<unknown>> => db.from('producto_materiales').update({ para_portal: offered }).eq('id', id),
  toast: (message: string, isError = false): void => { toast(message, isError); },
  materials: (): { id: string; para_portal?: boolean }[] | null => productsStore.presentationMaterials as { id: string; para_portal?: boolean }[] | null,
  linkError: (): string | null => ENLACE_ERROR,
  accessWithoutActivation: (text: string): void => { accesoSinActivar(text); },
};
