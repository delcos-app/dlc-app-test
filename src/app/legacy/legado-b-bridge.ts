/**
 * Bridge of the pieces folded from legado 025–049 (v2.424.0) to the legacy code, kept apart from bridge.ts (at its size limit).
 * The shared state (navigation generation, pending reads, the brand, the selected date popover, the recovery flag…) stays in
 * legacy: the navigation, the API layer, the tests and other legado files read and write it.
 */
import * as legacyFreeCoreServices from '../core/services';
import * as legacyFreeCoreSettings from '../core/settings';
import * as legacyFreeScreensSettingsShell from '../screens/settings/shell';
import * as legacyFreeCoreLeftovers from '../core/leftovers';
import { navigationStore } from '../core/navigation/store';
import { accountsStore } from '../screens/accounts/store';
import { sessionStore } from '../core/session-store';
import { ordersStore } from '../screens/orders/store';
import { settingsStore } from '../screens/settings/store';
import { agendaStore } from '../screens/agenda/store';
import { productsStore } from '../screens/products/store';
import { homeStore } from '../screens/home/store';

/** db.rpc as the legacy layers wrap it: (name, params, options) → the query builder or a promise. */
export type RpcFunction = (name: string, params?: Record<string, unknown>, options?: unknown) => unknown;
export interface RpcAnswer<T> { data?: T | null; error?: { message?: string } | null }
interface RawDb {
  rpc: RpcFunction;
  auth: { signOut: () => Promise<unknown>; updateUser: (values: { password: string }) => Promise<{ error?: { message: string } | null }> };
  functions: { invoke: (name: string, options: { body: Record<string, unknown> }) => Promise<{ data?: unknown; error?: unknown }> };
}

export const rawDb = (): RawDb => db as unknown as RawDb;

export const legacyBState = {
  tab: (): string => navigationStore.screen,
  mapMode: (): boolean => accountsStore.mapMode,
  isMobile: (): boolean => ES_MOVIL(),
  profile: (): unknown => sessionStore.profile,
  inTests: (): boolean => EN_PRUEBAS,
  rpcTtl: (): Readonly<Record<string, unknown>> => RPC_TTL,
  navigationGeneration: (): number => navigationStore.generation,
  navigationSignal: (): AbortSignal => navigationStore.abort.signal,
  addPendingRead: (delta: number): void => { navigationStore.pendingReads = Math.max(0, navigationStore.pendingReads + delta); },
  pendingCall: (): string | null => ordersStore.pendingCall,
  forgetPendingCall: (): void => { ordersStore.pendingCall = null; },
  setOrdersPage: (page: number): void => { ordersStore.page = page; },
  setSettingsSection: (section: string): void => { settingsStore.section = section; },
  settings: (): Record<string, unknown> => settingsStore.settings,
  setSetting: (key: string, value: unknown): void => { settingsStore.settings[key] = value; },
  paymentMethods: (): readonly { valor: string }[] => CAT.forma_pago ?? [],
  adminSection: (): string => settingsStore.adminSection,
  selectedPopover: (): (HTMLElement & { __t?: number }) | null => navigationStore.pickerPopup as (HTMLElement & { __t?: number }) | null,
  i18nMap: (): unknown => sessionStore.translationMap,
  setRecovering: (on: boolean): void => { RECUPERANDO = on; },
  recoveryLink: (): boolean => Boolean(RECUPERACION_URL),
  invitationLink: (): boolean => Boolean(INVITACION_URL),
  expiredLink: (): boolean => Boolean(ENLACE_CADUCADO),
  brandLogo: (): string | null => MARCA.logo,
  setBrand: (brand: Record<string, unknown>): void => { MARCA = Object.assign({}, MARCA, brand); },
  brand: (): unknown => MARCA,
  setPlan: (plan: Record<string, unknown>): void => { sessionStore.plan = plan; },
  setAgendaWeek: (mode: string, isoDate: string): void => { agendaStore.mode = mode; agendaStore.selectedDate = isoDate; },
  setAgendaMode: (mode: string): void => { agendaStore.mode = mode; },
  askWeekPlan: (): void => { agendaStore.openWeekPlan = true; },
  setProductsSection: (section: string): void => { productsStore.section = section; },
  forgetHiddenAlerts: (): void => { homeStore.hiddenAlerts = null; },
  navIcons: (): Readonly<Record<string, string>> => ICO_NAV,
  setModuleIcon: (key: string, svg: string): void => { (ICO_MOD as Record<string, string | undefined>)[key] = svg; },
};

export const legacyBActions = {
  ask: (message: string, options: { titulo: string; ok: string; cancelar: string; peligro: boolean }): Promise<boolean> => preguntar(message, options),
  goTo: (screen: string): void => { void ir(screen); },
  todayIso: (): string => hoyISO(),
  reloadAgenda: (): void => { void cargarAgenda(); },
  impersonate: (id: string): void => { void entrarComo(id); },
  orderTurn: (name: string): unknown => pedirTurno(name),
  isMyTurn: (name: string, turn: unknown): boolean => esMiTurno(name, turn),
  withCatch: <T>(promise: Promise<T>): Promise<T> => conCatch(promise),
  rpcOriginal: <T>(name: string, params: Record<string, unknown>): PromiseLike<RpcAnswer<T>> => RPC_ORIG<T>(name, params) as PromiseLike<RpcAnswer<T>>,
  canInvoice: (): boolean => Boolean(legacyFreeCoreServices.permissions.canInvoice()),
  loadSettings: (): Promise<void> => legacyFreeCoreSettings.loadSettings(),
  clearLocalData: (): void => { limpiarDatosLocales(); },
  showLoadingScreen: (text: string): void => { pantallaCarga(text); },
  hideLoadingScreen: (): void => { quitarCarga(); },
  testStrip: (): (() => unknown) => pintarFranjaPruebas,
  setTestStrip: (paint: () => unknown): void => { pintarFranjaPruebas = paint; },
  applyBrand: (): void => { legacyFreeCoreSettings.applyBrand(); },
  applyMenuPermissions: (): void => { aplicarPermisosMenu(); },
  refreshBell: (): void => { void refrescarCampana(); },
  translate: (element: Element): void => { traducir(element); },
  prepareLanguage: (language: string): void => { prepararIdioma(language); },
  iconise: (element: Element): void => { iconizar(element); },
  menuIcons: (): void => { iconosMenu(); },
  iconSvg: (name: string): string => svgIco(ICON_NOM[name] ?? ''),
  moduleIcon: (tab: string): string | undefined => ICO_MOD[tab],
  mobileSettings: (): void => { legacyFreeScreensSettingsShell.mobileLayout(); },
  passwordMeter: (first: HTMLElement | null, second: HTMLElement | null, button: HTMLElement | null): void => { medidorClave(first, second, button); },
  isSamples: (detail: unknown): boolean => esMuestras(detail),
  improveFields: (root: Element): void => { mejorarCampos(root); },
  closeSelector: (): void => { cerrarSelector(); },
  openCalendar: (input: HTMLInputElement): void => { abrirCalendario(input); },
  openClock: (input: HTMLInputElement): void => { abrirReloj(input); },
  emit: (input: HTMLInputElement): void => { emitir(input); },
  orderMobileHeader: (view: HTMLElement | null): void => { ordenarCabeceraMovil(view); },
  alertKey: (title: string, item: Element): string => claveAlerta(title, item),
  paginate: (element: HTMLElement | null, total: number, page: number, onPage: (page: number) => void): void => {
    paginador(element, total, page, onPage, () => { onPage(0); });
  },
  openAccount: (id: string): void => { void abrirFicha(id); },
  openOrder: (id: string): void => { void verPedido(id); },
  openPurchase: (id: string): void => { void editorCompra(id); },
  filterHomeAlerts: (): void => { filtrarAlertasInicio(); },
  portfolioRules: (): void => { void editorReglasCartera(); },
  teamTable: (): Promise<void> => legacyFreeCoreLeftovers.paintTeamCompliance(),
  can: (capability: string): boolean => puede(capability),
  isProfessionalPortal: (): boolean => ES_MEDICO(),
  openMoreMenu: (): void => { abrirMasMovil(); },
};
