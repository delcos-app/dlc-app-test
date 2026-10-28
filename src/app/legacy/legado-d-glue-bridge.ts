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
import * as legacyFreeComponents from '../components';
import * as legacyFreeScreensOrders from '../screens/orders';
import * as legacyFreeComponentsFilters from '../components/filters';
import * as legacyFreeCoreLegacyA from '../core/legacy-a';
import * as legacyFreeScreensAgenda from '../screens/agenda';
import * as legacyFreeCoreLegacyB from '../core/legacy-b';
import { navigate } from '../core/navigation';
import * as legacyFreeCoreLayers from '../core/layers';
import * as legacyFreeScreensAccounts from '../screens/accounts';
import * as legacyFreeScreensAccess from '../screens/access';
import * as legacyFreeScreensCustomers from '../screens/customers';
import * as legacyFreeScreensManual from '../screens/manual';
import * as legacyFreeComponentsListBar from '../components/list-bar';

/** The arguments of a function after the first (legacy passes them through as they come). */
type Tail<T extends readonly unknown[]> = T extends readonly [unknown, ...infer R] ? R : never;

type AnyFunction = (...args: unknown[]) => unknown;
const globals = window as unknown as Record<string, unknown>;

function wrapGlobal(name: string, wrapper: (original: AnyFunction) => AnyFunction): void {
  const original = globals[name];
  if (typeof original === 'function') globals[name] = wrapper(original as AnyFunction);
}

export const agendaGlueLegacy = {
  closeMonth: (): void => { void legacyFreeScreensAgenda.closeMonth(); },
  dayAppointments: (): AgendaAppointment[] => agendaStore.dayAppointments,
  openAppointment: (appointment: AgendaAppointment): void => { void legacyFreeScreensAgenda.showAppointment(appointment as Parameters<typeof legacyFreeScreensAgenda.showAppointment>[0]); },
  mode: (): string => agendaStore.mode,
  backToDay: (): void => {
    agendaStore.mode = 'dia'; agendaStore.viewedUser = null;
    const select = document.getElementById('agvista') as HTMLSelectElement | null; if (select) select.value = '';
    void legacyFreeScreensAgenda.loadAgenda();
  },
  calculating: (): boolean => agendaStore.trafficCalculated,
  baseEstimate: (appointments: unknown, isoDate: string, rest: unknown[]): unknown => { void rest; return legacyFreeCoreLegacyA.estimateDayWithRouteHours(appointments as Parameters<typeof legacyFreeCoreLegacyA.estimateDayWithRouteHours>[0], isoDate); },
  dayRoute: (appointments: unknown, isoDate: string): { k: string } | null => legacyFreeScreensAgenda.dayRoute(appointments as Parameters<typeof legacyFreeScreensAgenda.dayRoute>[0], isoDate),
  realTimes: (): { k: string } | null => agendaStore.realTimes,
  setRealTimes: (value: null): void => { agendaStore.realTimes = value; },
  realTimesValid: (): boolean => Boolean(tdRealVigente()),
  today: (): string => legacyFreeCoreServices.calendar.today(),
  rememberedRoute: (key: string): { t: number; r: unknown } | undefined => RM_MEM.get(key),
  putRealTimes: (route: { k: string }, result: unknown): void => { legacyFreeScreensAgenda.setRealTimes(route as Parameters<typeof legacyFreeScreensAgenda.setRealTimes>[0], result as Parameters<typeof legacyFreeScreensAgenda.setRealTimes>[1]); },
  baseToggleUrgent: (id: string, rest: unknown[]): Promise<unknown> => legacyFreeCoreLegacyA.toggleUrgent(id, ...(rest as unknown as Tail<Parameters<typeof legacyFreeCoreLegacyA.toggleUrgent>>)),
  forgetCaches: (): void => { legacyFreeCoreServices.queue.forgetCache(); try { DB_PRE.clear(); } catch { /* nothing preloaded */ } },
  currentScreen: (): string => navigationStore.screen,
  searchAccounts: (): void => { void legacyFreeScreensAccounts.searchAccounts(true); },
  quietRefresh: (): void => { void legacyFreeScreensAgenda.refreshQuietly(undefined, true); },
};

/** Read when called: core.js runs before the legacy code declares PAGINAS and PL. */
const pages = (): Record<string, { t: string; d?: string; tabs: [string, string, () => unknown][] } | undefined> => PAGINAS as Record<string, { t: string; d?: string; tabs: [string, string, () => unknown][] } | undefined>;
export const navigationGlueLegacy = {
  profileLoaded: (): boolean => Boolean(sessionStore.profile),
  addIconIfMissing: (name: string, svg: string): void => { const icons = ICON_NOM as Record<string, string>; if (!icons[name]) icons[name] = svg; },
  canSeeArea: (area: string): boolean => legacyFreeCoreServices.permissions.canSeeArea(area),
  refillRoutes: (): void => { void legacyFreeScreensRoutes.refillRepeating(); },
  routeDraft: (): unknown => routesStore.wizard,
  forgetRouteDraft: (): void => { routesStore.wizard = null; },
  wrapGlobal,
  applyMenuNames: (): void => { legacyFreeCoreNavigationApi.applyMenuNames(); },
  applyMenuNamesSoon: (): void => {
    if (!Object.keys(menuNombres()).length || settingsStore.textsObserverTimer) return;
    settingsStore.textsObserverTimer = requestAnimationFrame(() => { settingsStore.textsObserverTimer = 0; try { legacyFreeCoreNavigationApi.applyMenuNames(); } catch { /* the menu may be incomplete */ } });
  },
  baseApplyLabel: (args: unknown[]): unknown => { void args; legacyFreeCoreLegacyC.applyContactsLabel(); return undefined; },
  currentScreen: (): string => navigationStore.screen,
  hasReadyCheck: (screen: string): boolean => Boolean(LISTA_PARA[screen]),
  setReadyCheck: (screen: string, check: (section: HTMLElement) => boolean): void => { LISTA_PARA[screen] = check; },
  reveal: (screen: HTMLElement): void => { legacyFreeCoreNavigationApi.reveal(screen, 6000, (Date.now() - 5)); },
  homeHeader: (): void => { inicioCabecera(); },
  renameUsersPage: (title: string, hint: string): void => {
    const page = pages().usuarios; if (!page) return;
    page.t = title; page.d = hint; page.tabs = page.tabs.filter(tab => tab[0] !== 'roles');
  },
  isProfessionalPortal: (): boolean => ES_MEDICO(),
  baseBottomBar: (args: unknown[]): unknown => { void args; legacyFreeCoreLegacyB.paintBottomNav(); return undefined; },
  mobileModules: (): string[] => legacyFreeCoreNavigationApi.bottomBar(),
  moduleIcon: (module: string): string | undefined => ICO_MOD[module],
  mobileName: (module: string): string => legacyFreeCoreNavigationApi.mobileName(module),
  goTo: (screen: string): void => { navigate(screen); },
  openMoreMenu: (): void => { legacyFreeCoreNavigationApi.openMoreMenu(); },
  measureBottomBar: (): void => { legacyFreeCoreNavigationApi.measureBottomBar(); },
  baseSummariseHelp: (popup: HTMLElement): void => { legacyFreeCoreLegacyC.summariseHelp(popup); },
  helpAnchor: (button: HTMLElement): string => legacyFreeComponents.helpAnchor(button),
  manualAnchor: (screen: string): string | undefined => MANUAL_ANCLA[screen],
  openManual: (anchor: string): void => { void legacyFreeScreensManual.openManual(anchor || ''); },
};

export interface CountItem { k: string; t: string; n: number; s: string }
export interface LegacyOrderRow { id: string; contacto?: string | null; centro?: string | null; cuenta_texto?: string | null; medico?: string | null; unidades?: number | null; productos?: string | null; forma_pago?: string | null; fecha: string; total?: number | null }
type ListConfig = { kpiFirma?: () => string; kpis?: () => Promise<CountItem[]>; pedidos?: { card?: (row: HTMLElement) => Record<string, string> } } | undefined;
const lists = (): Record<string, ListConfig> => PL as Record<string, ListConfig>;
export const listGlueLegacy = {
  leaveNearby: (): void => { accountsStore.nearby = null; void legacyFreeScreensAccounts.searchAccounts(true); },
  clearCustomerDoctor: (): void => { PAC.medico = null; PAC.medicoNombre = ''; PAC.pagina = 0; },
  listCustomers: (): void => { void legacyFreeScreensCustomers.listCustomers(); },
  setAccountType: (type: string): void => { F.tipo = type; },
  searchAccounts: (): void => { void legacyFreeScreensAccounts.searchAccounts(true); },
  rememberFilter: (event: Event): void => { legacyFreeComponentsFilters.rememberFilter(event); },
  baseMountPeriod: (element: HTMLElement | null, args: unknown[]): unknown => legacyFreeCoreLegacyA.mountPeriod(element as unknown as HTMLElement, ...(args as unknown as Tail<Parameters<typeof legacyFreeCoreLegacyA.mountPeriod>>)),
  restoreFilters: (root: HTMLElement | null): void => { legacyFreeComponentsFilters.restoreFilters(root); },
  setOrderCard: (card: (row: HTMLElement) => Record<string, string>): void => { const sales = lists().ventas as unknown as { pedidos: { card?: unknown } }; sales.pedidos.card = card; },
  orders: (): LegacyOrderRow[] => (typeof ordersStore.orders === 'undefined' ? [] : ordersStore.orders as LegacyOrderRow[]),
  number: (value: unknown): string => legacyFreeCoreServices.money.number(value),
  isFree: (order: LegacyOrderRow): boolean => Boolean(legacyFreeScreensOrders.isFree(order, order.total)),
  shortDate: (isoDate: string): string => legacyFreeCoreServices.calendar.shortDate(isoDate),
  canSeeAmounts: (): boolean => legacyFreeCoreServices.permissions.canSeeAmounts(),
  euros: (value: number): string => legacyFreeCoreServices.money.eurosRounded(value),
  stepPill: (order: LegacyOrderRow): string => legacyFreeScreensOrders.stepPill(order),
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
  addButtonToDesktop: (): void => { legacyFreeCoreNavigationApi.fabToDesktop(); },
  currentScreen: (): string => navigationStore.screen,
  syncListBar: (screen: string): void => { legacyFreeComponentsListBar.syncListBar(screen); },
  basePaintConnection: (args: unknown[]): unknown => { void args; legacyFreeCoreLegacyA.paintConnection(); return undefined; },
  refusedChanges: (): QueuedChange[] => legacyFreeCoreServices.queue.refused() as QueuedChange[],
  queuedChanges: (): QueuedChange[] => legacyFreeCoreServices.queue.queued() as QueuedChange[],
  choose: (title: string, message: string, buttons: ChoiceButton[]): Promise<string | null> => legacyFreeComponents.chooseOption(title, message, buttons),
  confirm: (message: string, options: { titulo?: string; ok?: string; peligro?: boolean }): Promise<boolean> => legacyFreeComponents.confirmAction(message, options),
  saveQueue: (queue: QueuedChange[]): void => { legacyFreeCoreServices.queue.saveQueue(queue as unknown as Parameters<typeof legacyFreeCoreServices.queue.saveQueue>[0]); },
  forgetRefused: (): void => { localStorage.removeItem(COLA_KO); },
  paintConnection: (): void => { legacyFreeCoreLayers.paintConnection([]); },
  sendQueue: (): void => { void legacyFreeCoreServices.queue.sendQueue(); },
  addScannerButtonsSoon: (): void => { if (navigationStore.scannerPending) return; navigationStore.scannerPending = true; queueMicrotask(() => { navigationStore.scannerPending = false; legacyFreeCoreLeftovers.addScannerButtons(undefined); }); },
  openScanner: (input: HTMLInputElement): void => { void legacyFreeCoreLeftovers.openScanner(input); },
  passwordEye: (input: HTMLInputElement): void => { legacyFreeCoreLeftovers.passwordEye(input); },
};

type HelpText = [string, string, string[]];
export const sessionGlueLegacy = {
  help: (key: string): HelpText | undefined => (AYUDA as unknown as Record<string, HelpText | undefined>)[key],
  defineHelp: (key: string, get: () => HelpText | undefined, set: (value: HelpText | undefined) => void): void => { Object.defineProperty(AYUDA, key, { configurable: true, enumerable: true, get, set }); },
  isProfessionalPortal: (): boolean => typeof ES_MEDICO === 'function' && ES_MEDICO(),
  checkAccess: (force?: boolean): void => { void legacyFreeCoreServices.session.checkAccess(force); },
  refreshBell: (): void => { void legacyFreeCoreServices.live.refreshBell(); },
  profileLoaded: (): boolean => Boolean((sessionStore.profile as { id?: string } | null)?.id),
  liveNotices: (): void => { legacyFreeCoreServices.live.listenLive(); },
  setCentreStateClass: (state: string, pill: string): void => { NOMBRE_ESTADO_CENTRO[state] = pill; },
  setMaterialForPortal: (id: string, offered: boolean): PromiseLike<LegacyResult<unknown>> => db.from('producto_materiales').update({ para_portal: offered }).eq('id', id),
  toast: (message: string, isError = false): void => { legacyFreeComponents.toast(message, !!isError); },
  materials: (): { id: string; para_portal?: boolean }[] | null => productsStore.presentationMaterials as { id: string; para_portal?: boolean }[] | null,
  linkError: (): string | null => ENLACE_ERROR,
  accessWithoutActivation: (text: string): void => { legacyFreeScreensAccess.showNotActivated(text); },
};
