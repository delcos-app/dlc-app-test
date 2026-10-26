/**
 * Bridge of the folded legacy layers 080–161 (src/app/core/layers, v2.424.0) to the legacy state and helpers they still use, kept
 * apart from bridge.ts (at its size limit). Global names other code wraps (verPedido, montarMenuLateral…) are wrapped through window.
 */
import * as legacyFreeCoreServices from '../core/services';
import * as legacyFreeCoreSettings from '../core/settings';
import * as legacyFreeScreensSettingsMore from '../screens/settings/more';
import * as legacyFreeScreensSettingsExtra from '../screens/settings/extra';
import * as legacyFreeScreensEquipment from '../screens/equipment';
import * as legacyFreeCoreLeftovers from '../core/leftovers';
import * as legacyFreeScreensImport from '../screens/import';
import * as legacyFreeScreensSettingsShell from '../screens/settings/shell';
import * as legacyFreeCoreLayers from '../core/layers';
import * as legacyFreeScreensAccounts from '../screens/accounts';
import { navigationStore } from '../core/navigation/store';
import { settingsStore } from '../screens/settings/store';
import { accountsStore } from '../screens/accounts/store';
import { sessionStore } from '../core/session-store';
import { billingStore } from '../screens/billing/store';
import { ordersStore } from '../screens/orders/store';

type AnyFunction = (...args: unknown[]) => unknown;
type Wrapper = (original: AnyFunction) => AnyFunction;
const globals = window as unknown as Record<string, unknown>;

/** Replaces a legacy global function by a wrapper of it (if it exists): the same as the legacy `name = (orig => …)(name)`. */
function wrapGlobal(name: string, wrapper: Wrapper): void {
  const original = globals[name];
  if (typeof original === 'function') globals[name] = wrapper(original as AnyFunction);
}

export interface LegacyConfigItem { k: string; t: string; ic?: string; d?: string; r?: () => unknown; mod?: string; sub?: [string, string, () => unknown][] }
export interface LegacyPage { t: string; d?: string; permiso: () => boolean; tabs: [string, string, () => unknown][] }
type PageTabs = readonly (readonly [string, string, () => unknown])[];
/** Read when called: core.js runs before the legacy code declares PAGINAS. */
const pages = (): Record<string, (LegacyPage & { tabs: PageTabs }) | undefined> => PAGINAS as Record<string, (LegacyPage & { tabs: PageTabs }) | undefined>;

export const treeLegacy = {
  can: (capability: string): boolean => puede(capability),
  canManageOrganisation: (): boolean => puedeOrganizacion(),
  canUseModule: (module: string): boolean => puedeModulo(module),
  canEditCatalogs: (): boolean => Boolean(legacyFreeCoreServices.permissions.canManageLists()),
  isProfessionalPortal: (): boolean => ES_MEDICO(),
  cardPaymentVisible: (): boolean => TPV_VISIBLE,
  inTestEnvironment: (): boolean => EN_PRUEBAS,
  configTree: (): readonly (readonly [string, readonly LegacyConfigItem[]])[] => legacyFreeCoreSettings.settingsTree(),
  pageTabs: (page: string): PageTabs => pages()[page]?.tabs ?? [],
  paintProfile: (): unknown => pintarPerfil(),
  paintNotifications: (): unknown => pintarNotif(),
  paintUsers: (): unknown => pintarUsuarios2(),
  paintRoles: (): unknown => legacyFreeScreensSettingsMore.paintRoles(),
  paintTexts: (): unknown => legacyFreeScreensSettingsExtra.paintMenuNames(),
  paintDistributors: (): unknown => pintarDistribuidores(),
  paintStateRoles: (): unknown => pintarEstadosPapel(),
  paintCardPayment: (): unknown => pintarTpv(),
  paintTestEnvironment: (): unknown => pintarCfgPruebas(),
  setSearchWords: (words: Record<string, string>): void => { Object.assign(CFG_CLAVES, words); },
};

type NotificationType = [string, string, string, string];
export const menuLegacy = {
  addIcon: (name: string, svg: string): void => { (ICON_NOM as Record<string, string>)[name] = svg; },
  setModuleIcon: (module: string, icon: string): void => { ICO_NAV[module] = icon; (ICO_MOD as Record<string, string>)[module] = svgIco(ICON_NOM[icon] ?? ''); },
  menuGroups: (): { id: string; items: string[] }[] => MENU_GRUPOS,
  dialog: (): HTMLDialogElement | null => document.getElementById('dlg') as HTMLDialogElement | null,
  currentScreen: (): string => navigationStore.screen,
  isProfessionalPortal: (): boolean => ES_MEDICO(),
  canUseModule: (module: string): boolean => puedeModulo(module),
  planIncludesSection: (section: string): boolean => planIncluyeSeccion(section),
  paintTenders: (view: string): unknown => pintarConcursos(view),
  paintEquipment: (): unknown => legacyFreeScreensEquipment.paintEquipment(),
  setPage: (key: string, page: LegacyPage): void => { pages()[key] = page as LegacyPage & { tabs: PageTabs }; },
  pageTab: (key: string): string | undefined => navigationStore.pageTabs[key],
  tendersMenu: (): void => { legacyFreeCoreLeftovers.menuTenders(); },
  equipmentMenu: (): void => { legacyFreeCoreLeftovers.menuEquipment(); },
  lockSections: (): void => { candadoSecciones(); },
  setPlanSections: (sections: Record<string, string[]>): void => { Object.assign(PLAN_SECCIONES, sections); },
  requirePlanSection: (key: string): void => { const page = pages()[key]; if (!page) return; const before = page.permiso; page.permiso = (): boolean => before() && planIncluyeSeccion(key); },
  addNotificationTypes: (types: NotificationType[]): void => { TIPOS_NOTIF.push(...types); },
  notificationAreas: (): [string, string, string[]][] => NOTIF_AREAS as [string, string, string[]][],
  dailyNotifications: (): string[] => NOTIF_DIARIOS as string[],
  explainNotification: (key: string, text: [string, string]): void => { EXPLICA_NOTIF[key] = text; },
  openManual: (anchor: string): void => { abrirManual(anchor); },
  manualAnchor: (screen: string): string | undefined => MANUAL_ANCLA[screen],
  baseMenuPermissions: (args: unknown[]): unknown => aplicarPermisosMenuBase9(...args),
  term: (word: string): string => TT(word, 's', '', 'l', 'l'),
  hasPage: (screen: string): boolean => Boolean(pages()[screen]),
  loadPage: (screen: string): void => { cargarPagina(screen); },
  settingsKey: (): string => CFG_KEY,
  loadSettings: (): void => { void cargarConfig(); },
  baseLoadAdmin: (args: unknown[]): unknown => cargarAdminBase(...args),
};

export const polishLegacy = {
  normalise: (text: string | null | undefined): string => legacyFreeScreensImport.normaliseHeader((text ?? '')),
  currentScreen: (): string => navigationStore.screen,
  polishedKeys: (): string[] => CFG_PULIR,
  settingsKey: (): string => CFG_KEY,
  roleNames: (): string[] => rolesNombres(),
  adjustIndexSoon: (): void => { cancelAnimationFrame(settingsStore.indexFrame); settingsStore.indexFrame = requestAnimationFrame(() => { legacyFreeScreensSettingsShell.fitIndex(); }); },
  markOpenedFromMenu: (): void => { settingsStore.section = '__cfg'; IR_DESDE_MENU_CFG = true; },
  setManualAnchor: (screen: string, anchor: () => string): void => { Object.defineProperty(MANUAL_ANCLA, screen, { configurable: true, enumerable: true, get: anchor }); },
  polish: (): void => { legacyFreeCoreLayers.polishSettings(); },
};

export const pageLegacy = {
  currentScreen: (): string => navigationStore.screen,
  isMobile: (): boolean => ES_MOVIL(),
  freeze: (element: HTMLElement | null): void => { congelar(element); },
  settingsKey: (): string => CFG_KEY,
  wakeSection: (section: HTMLElement): void => { void cfgSecDespertar(section); },
  cloneSettingsStyles: (): void => { void cfgClonarEstilos(); },
  currentPage: (): { cuerpo: HTMLElement } | null => pagActual(),
  notAChange: (): string => PAG_NO_CAMBIA,
  markChanged: (element: Element, body: HTMLElement): void => { PAG_SUCIO.add(pagBloque(element, body)); legacyFreeScreensSettingsShell.markUnsaved(); },
  placeSaveButtonSoon: (): void => {
    if (navigationStore.saveButtonFrame || !PAG_GUARDA.some(page => page.tab === navigationStore.screen)) return;
    navigationStore.saveButtonFrame = requestAnimationFrame(() => { navigationStore.saveButtonFrame = 0; pagPonerGuardar(); });
  },
};

export const dialogLegacy = {
  dialog: (id: string): HTMLDialogElement | null => document.getElementById(id) as HTMLDialogElement | null,
  openingSheet: (): boolean => Boolean(accountsStore.cardEffect),
  sheetOpening: (step: number): void => { accountsStore.cardEffect = Number(accountsStore.cardEffect) + step; },
  wrapGlobal,
  openAccount: (id: string): void => { void abrirFicha(id); },
  openCentre: (id: string): void => { void fichaCentro(id); },
  setLastAction: (time: number): void => { settingsStore.lastAction = time; },
  lastAction: (): number => settingsStore.lastAction,
};

export interface BackView { fn: string; args: unknown[]; t: number; dlg?: HTMLDialogElement | null; cerrada?: number | null }
const backStack = (): BackView[] => VUELTA as BackView[];
export const backLegacy = {
  titledViews: (): string[] => Object.keys(VISTA_TITULO),
  wrapGlobal,
  view: (): BackView | null => navigationStore.view as BackView | null,
  setView: (view: BackView | null): void => { navigationStore.view = view; },
  lastClick: (): { d: Element; t: number } | null => navigationStore.backClick,
  setLastClick: (click: { d: Element; t: number }): void => { navigationStore.backClick = click; },
  reopening: (): boolean => navigationStore.backReopening,
  setReopening: (on: boolean): void => { navigationStore.backReopening = on; },
  putButton: (): boolean => navigationStore.backPending,
  setPutButton: (on: boolean): void => { navigationStore.backPending = on; },
  sameView: (first: BackView, second: BackView): boolean => vistaIgual(first, second),
  push: (view: BackView, max: number): void => { view.cerrada = null; backStack().push(view); if (backStack().length > max) backStack().shift(); },
  pop: (): BackView | undefined => backStack().pop(),
  stackSize: (): number => backStack().length,
  openDialog: (): HTMLDialogElement | null => vistaDlg(),
  setViewDialog: (view: BackView, dialog: HTMLDialogElement | null): void => { view.dlg = dialog; },
  button: (view: BackView, dialog?: HTMLDialogElement): void => { vistaBoton(view, dialog); },
  callGlobal: (name: string, args: unknown[]): unknown => (globals[name] as AnyFunction)(...args),
};

export const saveLegacy = {
  requestStarted: (): void => { sessionStore.networkInFlight++; sessionStore.lastNetworkEnd = performance.now(); },
  requestEnded: (): void => { sessionStore.networkInFlight = Math.max(0, sessionStore.networkInFlight - 1); sessionStore.lastNetworkEnd = performance.now(); },
  inFlight: (): number => sessionStore.networkInFlight,
  lastRequest: (): number => sessionStore.lastNetworkEnd,
  isSaveButton: (button: HTMLButtonElement | null): boolean => Boolean(esBotonGuardar(button)),
  raiseNotice: (): void => { subirAviso(); },
};

export type RpcCall = () => unknown;
type RpcFunction = (name: string, args?: Record<string, unknown>, ...rest: unknown[]) => unknown;
const database = (): { rpc: RpcFunction } => db as unknown as { rpc: RpcFunction };
export const rpcLegacy = {
  /** db.rpc = make(db.rpc): the new one wraps the one in place now (legacy layers stack the same way). */
  wrap: (make: (original: RpcFunction) => RpcFunction): void => { const original = database().rpc.bind(db); database().rpc = make(original); },
  tableOrder: (kind: string): { i: number; dir: number; k?: string | null } | undefined => HT_ORDEN[kind],
  forgetInFlight: (name: string): void => { [...RC_VUELO.keys()].forEach(key => { if (key.startsWith(`${name}|`)) RC_VUELO.delete(key); }); },
  direct: (name: string, args: Record<string, unknown>, ...rest: unknown[]): PromiseLike<unknown> => (RPC_ORIG as unknown as (...all: unknown[]) => PromiseLike<unknown>)(name, args, ...rest),
  logError: (type: string, message: string, detail: Record<string, unknown>): void => { registrarError(type, message, detail); },
  currentScreen: (): string => navigationStore.screen,
  preloaded: (): Map<string, unknown> => DB_PRE,
  rememberedSortOf: (name: string): string | undefined => Object.keys(ORD_MEM).find(kind => ORD_MEM[kind]?.fn === name),
  sortRemembered: (kind: string, rows: unknown[]): unknown[] => ordMemOrdenar(kind, rows),
  forgetCache: (): void => { invalidarCache(); try { DB_PRE.clear(); } catch { /* nothing preloaded */ } },
  refreshBelow: (): void => { refrescarDebajo(); },
  dataChanged: (): boolean => settingsStore.unsavedChanges,
  reportedFilter: (): string => AN_REP,
  pdfEditing: (): string | null => billingStore.pdfEditing,
  pdfTemplates: (): { lista: { id: string; cfg?: unknown }[]; defecto: string } => listaPDF(),
  savePdfTemplates: (templates: { lista: unknown[]; defecto: string }): Promise<boolean> => guardarPDFPlantillas(templates),
  setInvoicePdf: (design: unknown): void => { settingsStore.settings.factura_pdf = design ? design : settingsStore.settings.factura_pdf; },
};

export const sortLegacy = {
  setOrdersPage: (page: number): void => { ordersStore.page = page; },
  listOrders: (): void => { if (typeof listaPedidos === 'function') void listaPedidos(); },
  setCustomersPage: (page: number): void => { PAC.pagina = page; },
  listCustomers: (): void => { if (typeof listaPacientes === 'function') void listaPacientes(); },
  markHeader: (grid: Element): void => { htMarcarCabecera(grid); },
  tableKind: (grid: Element): string => htTipo(grid),
  serverSort: (kind: string): ((index: number, name: string) => string | null) | undefined => ORD_SRV[kind],
  setServerSort: (kind: string, sort: (index: number, name: string) => string | null): void => { ORD_SRV[kind] = sort; },
  notSortable: (name: string): boolean => Boolean(htCeldaNoOrdenable(name)),
  orders: (): Record<string, { i: number; dir: number; k?: string | null } | undefined> => HT_ORDEN,
  saveOrders: (): void => { htGuardarOrden(); },
  sortRows: (grid: Element): void => { htOrdenarFilas(grid); },
  unsort: (grid: Element): void => { htQuitarOrden(grid); },
  accountsSortKey: (column: string): string | undefined => ORD_DIR[column],
  // eslint-disable-next-line id-length -- the legacy name of Cuentas' filters
  accountFilters: (): AccountFilters => F,
  searchAccounts: (): void => { void buscar(true); },
  paintAccountsHeader: (): void => { legacyFreeScreensAccounts.paintAccountsHeader(); },
  rememberedKinds: (): string[] => Object.keys(ORD_MEM),
  rememberedHasField: (kind: string, index: number): boolean => ((ORD_MEM[kind]?.campos as readonly unknown[] | undefined)?.[index] ?? null) !== null,
  isRemembered: (kind: string): boolean => Boolean(ORD_MEM[kind]),
  setInvoicesPage: (page: number): void => { ordersStore.invoicePage = page; },
  setCallsPage: (page: number): void => { ordersStore.callsPage = page; },
};

const listsConfig = (): Record<string, { mas?: () => [string, string][]; prods?: { mas?: () => [string, string][] } } | undefined> => PL as Record<string, { mas?: () => [string, string][]; prods?: { mas?: () => [string, string][] } } | undefined>;
export const removedLegacy = {
  dialog: (id: string): HTMLDialogElement | null => document.getElementById(id) as HTMLDialogElement | null,
  shortDate: (isoDate: string): string => legacyFreeCoreServices.calendar.shortDate(isoDate),
  confirm: (message: string, options: { titulo?: string; ok?: string; peligro?: boolean }): Promise<boolean> => preguntar(message, options),
  rpc: <T>(name: string, args: Record<string, unknown>): PromiseLike<LegacyResult<T>> => db.rpc<T>(name, args),
  forgetCache: (): void => { invalidarCache(); },
  forgetPreloaded: (): void => { DB_PRE.clear(); },
  toast: (message: string, isError = false): void => { toast(message, isError); },
  currentScreen: (): string => navigationStore.screen,
  searchAccounts: (): void => { void buscar(true); },
  listCustomers: (): void => { void listaPacientes(); },
  number: (value: number): string => num(value),
  whatAccountHas: (key: string): string => BAJA_QUE[key] ?? key,
  deregisterAccount: (id: string, away: boolean): Promise<unknown> => bajaCuenta(id, away),
  deregisterCustomer: (id: string, away: boolean): Promise<unknown> => bajaCliente(id, away),
  archived: async <T>(table: string, columns: string, limit: number): Promise<T[]> => ((await db.from<T[]>(table).select(columns).not('archivado_en', 'is', null).order('archivado_en', { ascending: false }).limit(limit)).data ?? []),
  deleted: async <T>(table: string, columns: string, limit: number): Promise<T[]> => ((await db.from<T[]>(table).select(columns).not('eliminado_en', 'is', null).order('eliminado_en', { ascending: false }).limit(limit)).data ?? []),
  addListMenuEntry: (screen: string, entry: [string, string]): void => {
    const list = listsConfig()[screen]; if (!list?.mas) return;
    const before = list.mas; list.mas = (): [string, string][] => before().concat([entry]);
  },
  canDeleteProducts: (): boolean => Boolean(legacyFreeCoreServices.permissions.canDeleteProduct()),
  refreshProducts: (): void => { void refrescarProductos(); },
  addProductsMenuEntry: (entries: () => [string, string][]): void => {
    const products = listsConfig().productos?.prods; if (!products?.mas) return;
    const before = products.mas; products.mas = (): [string, string][] => before().concat(entries());
  },
};
