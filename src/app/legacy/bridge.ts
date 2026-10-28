/**
 * Bridge to the legacy code: typed, named access to what new screens still need from src/legado.
 * Screens import from here (never use a legacy global directly), so the remaining dependencies are visible in one file and each
 * one is replaced by a real service when its piece is migrated.
 */
import * as legacyFreeCoreServices from '../core/services';
import * as legacyFreeComponents from '../components';
import * as legacyFreeCoreLeftovers from '../core/leftovers';
import * as legacyFreeScreensSettings from '../screens/settings';
import * as legacyFreeCoreSettings from '../core/settings';
import { navigationStore } from '../core/navigation/store';
import { ordersStore } from '../screens/orders/store';
import { homeStore } from '../screens/home/store';
import { sessionStore } from '../core/session-store';
import { agendaStore } from '../screens/agenda/store';
import { accountsStore } from '../screens/accounts/store';
import { routesStore } from '../screens/routes/store';
import { productsStore } from '../screens/products/store';
import { settingsStore } from '../screens/settings/store';
import * as legacyFreeScreensAgenda from '../screens/agenda';
import * as legacyFreeCoreLegacyB from '../core/legacy-b';
import * as legacyFreeScreensVisit from '../screens/visit';
import * as legacyFreeScreensSettingsMore from '../screens/settings/more';
import * as legacyFreeScreensEvents from '../screens/events';
import * as legacyFreeScreensSurgeries from '../screens/surgeries';
import * as legacyFreeCoreNavigationApi from '../core/navigation/api';
import * as legacyFreeScreensCustomers from '../screens/customers';
import * as legacyFreeCoreLegacyC from '../core/legacy-c';
import * as legacyFreeScreensAccounts from '../screens/accounts';
import * as legacyFreeScreensEquipment from '../screens/equipment';
import { navigate } from '../core/navigation';
import * as legacyFreeCoreLayers from '../core/layers';
import * as legacyFreeScreensPurchases from '../screens/purchases';
import * as legacyFreeScreensTenders from '../screens/tenders';
import * as legacyFreeScreensSettingsRest from '../screens/settings/rest';
import * as legacyFreeScreensOpportunities from '../screens/opportunities';
import * as legacyFreeScreensOrders from '../screens/orders';
import * as legacyFreeScreensProducts from '../screens/products';
import * as legacyFreeComponentsListBar from '../components/list-bar';
export const legacyDb = (): LegacyDb => db;
export const callRpc = <T>(name: string, params: Record<string, unknown> = {}): PromiseLike<LegacyResult<T>> => RPC_ORIG<T>(name, params);

export const currentScreen = (): string => navigationStore.screen;
export const goTo = (screen: string): void => { navigate(screen); };
/** Opens Pedidos on one of its sections (ventas, llamadas…). */
export const goToOrders = (section: string): void => { ordersStore.section = section; navigate('ventas'); };

export interface TermOptions {
  /** 's' singular, 'p' plural */
  readonly number?: 's' | 'p';
  /** 'el', 'un', 'del', 'al' or '' */
  readonly article?: string;
  /** 'C' capitalised, 'l' lower case */
  readonly capital?: 'C' | 'l';
  /** 'C' to capitalise the article (e.g. «Última visita») */
  readonly articleCapital?: 'C' | 'l';
  /** Adjective agreeing in gender and number (e.g. 'urgente') */
  readonly adjective?: string;
}

/** Company vocabulary (profesional, visita…): legacy TT() until the vocabulary service exists. */
export function term(word: string, options: TermOptions = {}): string {
  const { number = 's', article = '', capital = 'l', adjective, articleCapital = 'l' } = options;
  return adjective === undefined ? legacyFreeCoreServices.vocabulary.wordFor(word, number, { determiner: article, determinerCase: articleCapital, nounCase: capital }) : legacyFreeCoreServices.vocabulary.wordFor(word, number, { determiner: article, determinerCase: articleCapital, nounCase: capital, adjective: adjective });
}

export const permissions = {
  canSeeArea: (area: string): boolean => legacyFreeCoreServices.permissions.canSeeArea(area),
  canSeeAmounts: (): boolean => legacyFreeCoreServices.permissions.canSeeAmounts(),
  seesEverything: (): boolean => legacyFreeCoreServices.permissions.seesEverything(),
  salesLevel: (): number => legacyFreeCoreServices.permissions.levelOrNone(('V')),
  /** Level (0–3) in an area by its letter (M: accounts, V: sales…). */
  levelOf: (letter: string): number => legacyFreeCoreServices.permissions.levelOrNone(letter),
  isProfessionalPortal: (): boolean => ES_MEDICO(),
  hasOpportunities: (): boolean => legacyFreeCoreLegacyC.hasExtra('oportunidades'),
  canReviewDuplicates: (): boolean => legacyFreeCoreServices.permissions.canReviewDuplicates(),
};

export const homeCache = {
  panel: (): typeof homeStore.panel => homeStore.panel,
  setPanel: (value: typeof homeStore.panel): void => { homeStore.panel = value; },
  charts: (): typeof homeStore.charts => homeStore.charts,
};

export const appointments = {
  ofDay: (date: string): Promise<DayAppointment[]> => legacyFreeCoreLeftovers.appointmentsOfDay(date) as Promise<DayAppointment[]>,
  isOpen: (state: string): boolean => CITA_ABIERTA.includes(state),
  isCancelled: (state: string): boolean => citaAnulada(state),
};

export const icon = (name: string): string => svgIco(ICON_NOM[name] ?? ICON_NOM.info ?? '');
/** True when these figures were already shown counting on this screen (they are not animated twice). */

/** Indicator catalog and settings: shared with Configuración, which is not migrated yet. */
export const indicatorCatalog = {
  definitions: (): readonly KpiDefinition[] => KPI_CAT,
  settings: (): readonly KpiSetting[] => kpiConfig(),
  allowed: (definition: KpiDefinition | undefined): boolean => legacyFreeCoreLeftovers.indicatorAllowed(definition),
  help: (id: string): string | undefined => AYUDA_KPI[id],
  icon: (id: string): string | undefined => KPI_ICO[id],
  description: (id: string): string | undefined => KPI_TXT[id],
};

export const commercialStates = {
  all: (): readonly { valor: string; papel: string }[] => sessionStore.commercialStates,
  color: (state: string): string | undefined => EST_COL[state],
};

/** Cached read (offline copy) of a database function. */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- the caller says what the read gives (as with rpcCache<T>)
export function cachedRpc<T>(name: string, params: Record<string, unknown>, key: string): Promise<{ data: T | null; cache?: boolean; fecha?: string }> {
  return legacyFreeCoreServices.reads.readCached(name, params, key) as unknown as Promise<{ data: T | null; cache?: boolean; fecha?: string }>;
}
export const timingMark = (step: string): void => { marca(step); };
export const showCacheNotice = (element: HTMLElement, date: string | undefined): void => { legacyFreeComponents.cacheNotice(element, date); };
export const addHelpButtons = (): void => { legacyFreeComponents.addHelpButtons(); };
export const isMobile = (): boolean => ES_MOVIL();

/** Agenda state still kept by the legacy day view (selected day, whose agenda, today's appointments, the metrics). */
export const legacyAgenda = {
  selectedDate: (): string | null => agendaStore.selectedDate,
  /** The person whose agenda is shown (null: everybody the user sees, or the user). */
  userFilter: (): string | null => legacyFreeCoreLeftovers.agendaUserFilter(),
  viewedUserId: (): string | null => agendaStore.viewedUser?.id ?? null,
  showDay: (isoDate: string): void => { void legacyFreeScreensAgenda.showDay(isoDate); },
  isDayView: (): boolean => agN(),
  metrics: (): AgendaMetrics | null => agendaStore.metrics,
  setMetrics: (value: AgendaMetrics): void => { agendaStore.metrics = value; },
  /** Today's appointments as painted in «Tu día», and the day they were loaded for. */
  dayAppointments: (): readonly AgendaAppointment[] => agendaStore.dayAppointments,
  loadedDay: (): string | null => agendaStore.lastPaintedDay?.fecha ?? null,
};

/** Suggestions of the shown day: accounts due a visit, pending ones from earlier days and colleagues in the same centre. */
export const agendaSuggestions = {
  forDay: (): typeof agendaStore.suggestions => agendaStore.suggestions,
  pending: (): readonly PendingAppointment[] => agendaStore.pendingSuggestions ?? [],
};

/** Other screens reached from Agenda. */
export const agendaActions = {
  openAccount: (id: string): void => { void legacyFreeScreensAccounts.openAccountCard(id); },
  newAppointment: (accountId: string, isoDate: string | null): void => { void legacyFreeScreensAgenda.newAppointment(accountId, isoDate, {}); },
};

/** The side panel (#tools) remembers what it shows so it can be painted again after a change. */
export const sidePanel = {
  context: (): string | null => accountsStore.toolsContext,
  setContext: (value: string): void => { accountsStore.toolsContext = value; },
};

/** Agenda pieces still in legacy. */
export const legacyAgendaParts = {
  mode: (): string => agendaStore.mode,
  blockedDays: (fromIsoDate: string, days: number): Promise<Record<string, string>> => legacyFreeCoreLeftovers.blockedFrom(fromIsoDate, days),
};

/** What the Agenda data loader needs from legacy: whose agenda, the strip start and the day tasks. */
export const agendaSources = {
  /** The person whose agenda is shown (the user, or the colleague administration is looking at). */
  ownerId: (): string => legacyFreeCoreLeftovers.agendaOwnerId(),
  isOwnAgenda: (): boolean => legacyFreeCoreLeftovers.agendaOwnerId() === (sessionStore.profile as { id: string }).id,
  stripStart: (): string | null => agendaStore.stripStart,
  /** «Tu día» of this date arrives already loaded (from Inicio). */
  hasPresetDay: (isoDate: string): boolean => agendaStore.presetDay?.fecha === isoDate,
  dayTasks: (isoDate: string): Promise<unknown> => legacyFreeCoreLeftovers.tasksOfDay(isoDate),
  blockedDays: (fromIsoDate: string, toIsoDate: string): Promise<Record<string, string>> => legacyFreeCoreLeftovers.readBlockedDays(fromIsoDate, toIsoDate),
  setSuggestions: (isoDate: string, suggestions: { pend: PendingAppointment[]; toca: DueAccount[]; centros: SameCentreGroup[] }): void => {
    agendaStore.pendingSuggestions = suggestions.pend; agendaStore.suggestions = { fecha: isoDate, toca: suggestions.toca, centros: suggestions.centros };
  },
};

/** The day strip state, still kept in legacy globals (the tests read CINTA_INI): its first Monday and whether the week is open. */
export const stripState = {
  start: (): string | null => agendaStore.stripStart,
  setStart: (isoDate: string | null): void => { agendaStore.stripStart = isoDate; },
  weekOpen: (): boolean => agendaStore.weekOpen,
  setWeekOpen: (open: boolean): void => { agendaStore.weekOpen = open; },
};

/** Agenda screen state still kept in legacy globals (the day view and «Tu día» read them). */
export const agendaState = {
  setMode: (mode: string): void => { agendaStore.mode = mode; },
  setSelectedDate: (isoDate: string): void => { agendaStore.selectedDate = isoDate; },
  /** The last day the agenda was opened on «today» (to jump to the new today after midnight). */
  lastTodaySeen: (): string | null => AG_HOY_VISTO,
  setLastTodaySeen: (isoDate: string): void => { AG_HOY_VISTO = isoDate; },
  forgetDayTasks: (): void => { agendaStore.dayTasks = null; },
  /** Someone asked to open Agenda straight on «Repartir la semana». */
  takeWeekPlanRequest: (): boolean => { const asked = agendaStore.openWeekPlan; agendaStore.openWeekPlan = false; return asked; },
  viewed: (): { id: string; nombre: string } | null => agendaStore.viewedUser,
};

/** The sales team (COMS) for the team views, loaded once. */
export const salesTeam = {
  members: (): readonly { id: string; nombre: string }[] => homeStore.salesTeam,
  load: (): Promise<void> => legacyFreeCoreLeftovers.loadSalesTeam(),
  currentUserId: (): string => (sessionStore.profile as { id: string }).id,
  showAgendaOf: (userId: string): void => { void legacyFreeCoreLeftovers.showAgendaOf(userId); },
};

/** Agenda pieces painted by legacy code. */
export const legacyAgendaPaint = {
  yourDay: (): Promise<void> => legacyFreeScreensAgenda.paintYourDay(),
  team: (): Promise<void> => legacyFreeCoreLegacyB.paintTeam(),
  noStartWarning: (element: HTMLElement | null): void => { legacyFreeComponents.noStartNotice(element); },
};

/** The week planner («Repartir la semana») and its unsaved proposal, still in legacy (pantallas/rutas.js). */
export const weekPlanner = {
  draft: (): WeekDraft | null => routesStore.weekDraft,
  discardDraft: (): void => { routesStore.weekDraft = null; },
  /** Estimated end of a day (minutes) and the latest return time. */
  estimateDay: (list: readonly object[], isoDate: string): { fin: number; tope: number } => legacyFreeCoreLayers.estimateDay(list, isoDate, []) as { fin: number; tope: number },
  /** Opening windows of a person on a date: null when unknown, [] when they do not attend that day. */
  attendanceWindows: (days: Record<string, string | null> | null | undefined, isoDate: string): unknown[] | null => legacyFreeComponents.attendanceWindows(days, isoDate),
};

/** Common dialogs and notices. */
export const notices = {
  toast: (message: string, isError = false): void => { legacyFreeComponents.toast(message, !!isError); },
  confirm: (message: string, options: { titulo?: string; ok?: string; peligro?: boolean }): Promise<boolean> => legacyFreeComponents.confirmAction(message, options),
  choose: (title: string, message: string, buttons: ChoiceButton[]): Promise<string | null> => legacyFreeComponents.chooseOption(title, message, buttons),
  askDate: (message: string, value: string, options: { titulo?: string; ok?: string }): Promise<string | null> => legacyFreeCoreServices.calendar.askDate(message, value, options) as Promise<string | null>,
  askTime: async (title: string, value: string, ok: string): Promise<string | null> => (await legacyFreeComponents.showDialog({ titulo: title, ok, campo: { valor: value, tipo: 'time' } })) as string | null,
};

export const initialsOf = (name: string): string => legacyFreeCoreServices.vocabulary.initials(name);
/** Mounts Agenda again from its current state (legacy adapter of loadAgenda: avoids an import cycle between the pieces). */
export const reloadAgenda = (): void => { void legacyFreeScreensAgenda.loadAgenda(); };

/** What «Tu día» still uses from legacy: the day estimate and its stop information (route domain, migrates with Rutas), the
 * working day, the appointment menu, ordering, tasks and the offline queue. */
export const yourDayLegacy = {
  setDayAppointments: (list: AgendaAppointment[]): void => { agendaStore.dayAppointments = list; },
  estimateDay: (list: readonly object[], isoDate: string): { est: Record<string, number>; fin: number; tope: number } =>
    legacyFreeCoreLayers.estimateDay(list, isoDate, []) as { est: Record<string, number>; fin: number; tope: number },
  stopInfo: (): Readonly<Record<string, StopInfo>> => agendaStore.stopInfo,
  explainWarning: (info: StopInfo): string => legacyFreeCoreLegacyC.explainNotice(info as Parameters<typeof legacyFreeCoreLegacyC.explainNotice>[0]),
  windowsText: (windows: readonly [number, number][]): string => txtVentanas(windows),
  canRecordOn: (isoDate: string): boolean => legacyFreeCoreLeftovers.canRecordOn(isoDate),
  queuedVisits: (): { fn: string; payload?: { p?: { fecha?: string; cuenta_id?: string } } }[] => legacyFreeCoreServices.queue.queued() as { fn: string; payload?: { p?: { fecha?: string; cuenta_id?: string } } }[],
  showDialog: (title: string, message: string, ok: string): void => { void legacyFreeComponents.showDialog({ titulo: title, msg: message, ok, cancel: false }); },
};

/** Legacy icons: the line icons of Agenda (ICU), the arrow icons (ICO) and the list icons (plIco). */
export const legacyIcons = {
  line: (name: string): string => SVA(ICU[name] ?? ''),
  arrow: (name: 'arriba' | 'abajo'): string => ICO[name] ?? '',
  list: (name: string): string => legacyFreeComponentsListBar.icon(name),
};

/** What the appointment sheet and its actions still use from legacy. */
export const appointmentLegacy = {
  /** Writes through the offline queue (the change is kept if there is no connection). */
  write: (name: string, payload: Record<string, unknown>): Promise<{ error?: unknown } | null> => legacyFreeCoreServices.queue.write(name, payload),
  writeRpc: (name: string, payload: Record<string, unknown>): Promise<{ error?: { message?: string } | null }> => legacyFreeCoreServices.reads.writeQueued(name, payload) as Promise<{ error?: { message?: string } | null }>,
  negativeResults: (): readonly { valor: string }[] => (CAT.resultado_visita ?? []).filter(item => item.extra === 'neg'),
  navigateTo: (point: [number, number] | null): void => { void legacyFreeCoreServices.maps.navigateTo(point); },
  recordVisit: (accountId: string, isoDate: string): void => { VISITA_FECHA = isoDate; void legacyFreeScreensVisit.openVisit(accountId); },
  openAccountFromCentre: (accountId: string, centre: string | null | undefined): void => { accountsStore.cardCentre = centre ?? null; void legacyFreeScreensAccounts.openAccountCard(accountId); },
  lastDayData: (): AgendaAppointment[] | null => (agendaStore.lastPaintedDay && agendaStore.lastPaintedDay.fecha === agendaStore.selectedDate ? agendaStore.lastPaintedDay.data ?? null : null),
  isJoinedDayView: (): boolean => agUnida(),
  /** Opens the sheet through its global name, so «‹ Volver» (legado 126) records it. */
  openSheet: (item: object): void => { void (window as unknown as { verCita: (value: object) => unknown }).verCita(item); },
};

/** The loaded agenda data kept by legacy: the read cache, the last painted day and the data preset for the next paint. */
export const agendaCache = {
  /** Forgets the cached agenda reads, so the next paint asks the database. */
  forget: (): void => { for (const key of [...RC.keys()]) if (key.startsWith('agenda_')) { RC.delete(key); RC_VUELO.delete(key); } },
  /** Forgets the cached read of one day (its key in rpcCache). */
  forgetDay: (isoDate: string): void => { RC.delete(`agenda-${isoDate}`); },
  /** The next «Tu día» paint of `isoDate` uses this data (no network), and it becomes the last painted day. */
  preset: (isoDate: string, data: AgendaAppointment[]): void => { agendaStore.presetDay = { fecha: isoDate, data }; agendaStore.lastPaintedDay = { fecha: isoDate, data }; },
  lastPainted: (isoDate: string): AgendaAppointment[] | null => (agendaStore.lastPaintedDay?.fecha === isoDate ? agendaStore.lastPaintedDay.data ?? null : null),
  setLastPainted: (isoDate: string, data: AgendaAppointment[]): void => { agendaStore.lastPaintedDay = { fecha: isoDate, data }; },
  /** Every day read alone (agenda_rango of one day), as it arrived. */
  dayData: (isoDate: string): AgendaAppointment[] | undefined => AG_DIAS_DATOS[isoDate],
  /** What is saved from now on is already shown: closing a dialog will not refresh again. */
  markDialogSeen: (): void => { agendaStore.dialogEpoch = sessionStore.cacheEpoch; },
  dayTasks: (isoDate: string): (DayTask & { orden?: number })[] | null => (agendaStore.dayTasks?.f === isoDate ? agendaStore.dayTasks.l : null),
  setDayTasks: (isoDate: string, list: (DayTask & { orden?: number })[] | null): void => { agendaStore.dayTasks = list ? { f: isoDate, l: list } : null; },
};


/** What the appointment and task editors use from legacy: the account picker and the «seen recently» notice (Cuentas). */
export const editorLegacy = {
  pickAccount: (element: HTMLElement | null, value: PickedAccount | null, onPick: (account: PickedAccount) => Promise<void> | void, placeholder?: string): void => {
    legacyFreeScreensAccounts.pickAccount(element as unknown as HTMLElement, { valor: value, alElegir: onPick, ...(placeholder ? { placeholder } : {}) } as Parameters<typeof legacyFreeScreensAccounts.pickAccount>[1]);
  },
  recentContacts: (accountId: string, isoDate: string): Promise<RecentContact[]> => legacyFreeCoreLeftovers.recentContacts([accountId], isoDate).then(found => (found[accountId] ?? []) as unknown as RecentContact[]),
  recentText: (list: RecentContact[]): string => legacyFreeCoreServices.calendar.recentText(list),
  turnOffRecentNotice: (): Promise<void> => legacyFreeScreensVisit.saveRevisitNotice({ ...avisoRevisita(), on: false }) as unknown as Promise<void>,
  centreFromCard: (): string | null => accountsStore.cardCentre,
  viewedUserId: (): string | null => (currentScreen() === 'agenda' && agendaStore.viewedUser ? agendaStore.viewedUser.id : null),
};

/** The account card (ficha) pieces still in legacy, and the windows other modules open from it. */
export const accountCardLegacy = {
  shownId: (): string | null => accountsStore.shownId,
  setShownId: (id: string): void => { accountsStore.shownId = id; },
  forgetPatients: (): void => { accountsStore.cardPatients = null; },
  forgetCentreFromAppointment: (): void => { accountsStore.cardCentre = null; },
  planIncludes: (section: string): boolean => legacyFreeCoreServices.plans.planIncludesSection(section),
  canEditType: (type: string | null | undefined): boolean => legacyFreeCoreServices.permissions.canEditType(type),
  /** The base sections, in their legacy order (each one paints a block of the card). */
  customFields: (id: string, container: Element | null): Promise<void> => legacyFreeScreensSettings.paintCustomFieldsBlock(('cuentas'), id, container),
};

/** Windows and labels of other modules (events, deposit, surgeries, tenders, equipment, visit photos), still in legacy. */
export const relatedLegacy = {
  openVisitPhotos: (activityId: string, accountId: string): void => { void legacyFreeScreensVisit.showVisitPhotos(activityId, accountId); },
  openEvent: (id: string): void => { void legacyFreeScreensEvents.showEvent(id); },
  openDeposit: (accountId: string, name: string): void => { void legacyFreeScreensProducts.showDeposit(accountId, name, ''); },
  expiresSoon: (isoDate: string | null | undefined): boolean => depCaducaPronto(isoDate),
  /** Opens a surgery through its global name (so «‹ Volver» sees it), optionally with a notice on top. */
  openSurgery: (id: string, notice?: string): void => { void legacyFreeScreensSurgeries.showSurgery(id, notice ?? ''); },
  openTender: (id: string): void => { void legacyFreeScreensTenders.showTender(id); },
  openEquipment: (id: string): void => { void legacyFreeScreensEquipment.showEquipment(id); },
  newEquipment: (account: { id: string; nombre: string }): void => { void legacyFreeScreensEquipment.editEquipment(null, account); },
};

/** What the base of the account card uses from legacy: the «Para la visita» block (Visitas), permissions and the units chart. */
export const cardBaseLegacy = {
  states: (): string[] => legacyFreeCoreServices.states.stateNames(),
  canRecord: (): boolean => legacyFreeCoreServices.permissions.canRecord(),
  canEdit: (): boolean => legacyFreeCoreServices.permissions.canEdit(),
  directionsAttribute: (point: [number, number]): string => legacyFreeCoreServices.maps.navigationAttribute(point, undefined),
  unitsChart: (units: AccountUnits, series: string): string => legacyFreeComponents.unitsSparkline(units as unknown as Parameters<typeof legacyFreeComponents.unitsSparkline>[0], series),
  unitsLegend: (series: string): string => leyendaUnidades(series),
  unitsSeries: (): readonly [string, string][] => UDS_SERIES,
  unitsSeriesChosen: (): string => UDS_SERIE,
  chooseUnitsSeries: (series: string): void => { UDS_SERIE = series; try { localStorage.setItem('dlc-uds-serie', series); } catch { /* not remembered */ } },
};

/** What the sales, history and proposal sections of the card use from legacy. */
export const cardSectionsLegacy = {
  can: (capability: string): boolean => legacyFreeCoreServices.permissions.can(capability),
  /** Sales level of the user (area V). */
  salesArea: (): number => (sessionStore.profile as { areas?: Record<string, number> }).areas?.V ?? 0,
  roleCan: (role: string, capability: string): boolean => legacyFreeCoreSettings.roleCan(role, capability),
  openPatient: (id: string): void => { void legacyFreeScreensCustomers.showCustomer(id); },
  /** Opens Pacientes filtered by this account. */
  patientsOf: (accountId: string, name: string): void => { Object.assign(PAC, { q: '', medico: accountId, medicoNombre: name, pagina: 0 }); goTo('pacientes'); },
  visitDetails: (visit: object): string => legacyFreeCoreLegacyB.visitDetails(visit),
  fieldName: (field: string): string => campoTxt(field),
  valueText: (value: unknown): string => legacyFreeScreensSettingsMore.valueText(value),
  detailSummary: (detail: unknown): string => legacyFreeScreensSettingsMore.detailSummary(detail),
  undo: (id: number, then: () => void): void => { void legacyFreeScreensSettingsMore.undoChange(id, then); },
};

/** Portal of the account (material requested, messages, products it can order) and platform access: legacy helpers. */
export const portalLegacy = {
  hasPortal: (): boolean => legacyFreeCoreLegacyC.hasExtra('portal'),
  materialPill: (state: string): string => pillMaterial(state),
  products: async (): Promise<readonly CatalogProduct[]> => { if (!productsStore.products.length) await cargarProductos(); return productsStore.products; },
  euros: (value: number): string => legacyFreeCoreServices.money.eurosRounded(value),
};

export const accessLegacy = {
  connectionInfo: (userId: string): void => { void legacyFreeScreensSettingsMore.fillConnection(userId); },
  canImpersonate: (user: PlatformUser): boolean => legacyFreeCoreServices.permissions.canImpersonateUser(user as Parameters<typeof legacyFreeCoreServices.permissions.canImpersonateUser>[0]),
  newUser: (preset: Record<string, unknown>): void => { void legacyFreeScreensSettingsRest.newUser(preset.medico ? preset : null); },
  forgetAccessCache: (): void => { accountsStore.portalAccess = null; },
  /** A user is created with a separate client (no session kept), as the legacy sign-up did. */
  signUp: async (email: string, password: string, name: string): Promise<{ message?: string } | null> => {
    const client = (window as unknown as { supabase: { createClient: (url: string, key: string, options: object) => { auth: { signUp: (data: object) => Promise<{ error: { message?: string } | null }> } } } })
      .supabase.createClient(CFG.url, CFG.anon, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error } = await client.auth.signUp({ email, password, options: { data: { nombre: name, usuario: email.split('@')[0] } } });
    return error;
  },
};

/** The account list still relies on legacy for its filters state (F), the column model and the cells (shared with other tables). */
export const accountListLegacy = {
  // eslint-disable-next-line id-length -- F is the legacy global state of the filters (a top-level const, not on window)
  filters: (): AccountFilters => F,
  mapMode: (): boolean => accountsStore.mapMode,
  /** The database order key of a column (only the sortable ones). */
  sortKey: (column: string): string | undefined => ORD_DIR[column],
  fieldChips: (state: Record<string, unknown>): { k: string; t: string }[] => legacyFreeComponents.filterChips(('medico'), state),
  contactsLabel: (): string => legacyFreeCoreServices.vocabulary.contactsLabel(),
  pageSize: (): number => legacyFreeComponentsListBar.storedPageSize(),
  paginate: (options: { element: HTMLElement | null; total: number; page: number; onPage: (page: number) => void; onSize: () => void }): void => {
    legacyFreeCoreNavigationApi.pager(options.element, { total: options.total, page: options.page }, { onPage: options.onPage, onSize: options.onSize });
  },
};

/** What the columns and cells of Cuentas use from legacy: custom fields, platform access and names. */
export const accountColumnsLegacy = {
  customFields: (): readonly CustomField[] => CAMPOS.medico ?? [],
  fieldText: (field: CustomField | undefined, value: unknown): string => legacyFreeComponents.fieldText(field, value),
  firstName: (name: string): string => legacyFreeCoreServices.vocabulary.firstName(name),
  /** Platform access by account (loaded once; null until it arrives). */
  accessOf: (): Record<string, { activo?: boolean }> | null => accountsStore.portalAccess as Record<string, { activo?: boolean }> | null,
  loadAccess: (): Promise<void> => legacyFreeCoreLeftovers.loadAccountAccess(),
  storageKey: (): string => `dlc-cols-${(sessionStore.profile as { id?: string } | null)?.id ?? ''}`,
};

/** Eventos: the list repaints through its global name (the page tabs and the dialog-close listener of legado 079 use it). */
export const eventsLegacy = {
  repaintList: (): void => { void legacyFreeScreensEvents.paintEvents(); },
};

/** Shared helpers some screens still need from legacy. */
export const appLegacy = {
  /** Forgets every cached read (after a change other screens show). */
  forgetCache: (): void => { legacyFreeCoreServices.queue.forgetCache(); },
  openOrder: (id: string): void => { void legacyFreeScreensOrders.showOrder(id); },
  currentUserName: (): string => (sessionStore.profile as { nombre?: string }).nombre ?? '',
};

/** Ciclo de visitas: the company settings it reads and writes, and the tabs of its page. */
export const cycleLegacy = {
  loadSettings: (): Promise<void> => legacyFreeCoreSettings.loadSettings(),
  setting: (key: string): unknown => settingsStore.settings[key],
  setSetting: (key: string, value: unknown): void => { settingsStore.settings[key] = value; },
  openTab: (tab: string): void => { navigationStore.pageTabs.ciclo = tab; legacyFreeCoreNavigationApi.loadPage('ciclo'); },
};

/** Intervenciones: the list repaints through its global name (page tab and dialog-close listener of legado 079). */
export const surgeriesLegacy = {
  repaintList: (): void => { void legacyFreeScreensSurgeries.paintSurgeries(); },
};

/** Parque instalado: the warning days of contracts (shared with Concursos), the contract kinds and the product catalog. */
export const equipmentLegacy = {
  warningDays: (): readonly number[] => homeStore.contractWarningDays,
  setWarningDays: (days: number[]): void => { homeStore.contractWarningDays = days; },
  contracts: (): readonly string[] => EQ_CONTRATOS,
  loadProducts: async (): Promise<void> => { if (!productsStore.products.length) await cargarProductos(); },
};

/** Concursos: the expiry warning days stay in the legacy CON_AVISOS (Parque uses them too). */
export const tendersLegacy = {
  warningDays: (): readonly number[] => homeStore.contractWarningDays,
  setWarningDays: (days: number[]): void => { homeStore.contractWarningDays = days; },
};

/** Compras: the catalogs it shares with Productos (suppliers, stores, products), the permission and the Pedidos tab. */
export const purchasesLegacy = {
  section: (): string => ordersStore.section,
  canBuy: (): boolean => Boolean(legacyFreeCoreServices.permissions.canBuy()),
  loadSuppliers: (): Promise<void> => cargarProveedores(),
  suppliers: (): readonly PurchaseSupplier[] => ordersStore.suppliers,
  loadStores: (): Promise<void> => cargarAlmacenes(),
  stores: (): readonly PurchaseStore[] => ordersStore.stores,
  loadProducts: (): Promise<void> => cargarProductos(),
  products: (): readonly (CatalogProduct & { coste?: number | null })[] => productsStore.products,
  /** The batch fields of «Recibir mercancía» (shared with the stock entries of Productos). */
  batchFields: (line: object, units: number | string, storeId: string | undefined): string => loteRecepcion(line, units, storeId),
  reloadSales: (): void => { void legacyFreeScreensOrders.loadSales(); },
  /** Through the global name: legado 058 wraps it to open the wide window. */
  openPurchase: (id: string | null): void => { void legacyFreeScreensPurchases.editPurchase(id ?? null); },
};

/** Importar datos: the Excel reader (loaded on first use), the error log, the write counter and the «Importaciones» tab. */
export const importLegacy = {
  excelReader: (): Promise<SheetReader> => legacyFreeCoreServices.files.loadExcelReader() as Promise<SheetReader>,
  reportError: (message: string): void => { legacyFreeCoreServices.errors.registerError(('error'), message, undefined); },
  countWrite: (): void => { sessionStore.writes++; },
  showHistory: (): void => { settingsStore.subsection = 'historial'; },
};

/** Manual de uso: the content of the portal manual (legacy data), access and plan checks, navigation and the way back. */
export const manualLegacy = {
  sections: (): readonly ManualSection[] => MANUAL,
  help: (id: string): HelpEntry | undefined => AYUDA[id],
  faq: (): readonly (readonly [string, string])[] => FAQ,
  firstSteps: (): Readonly<Record<string, readonly FirstStep[] | undefined>> => PRIMEROS_PASOS,
  icon: (id: string): string | undefined => ICONOS_MANUAL[id],
  levelText: (level: number): string => NIVEL_TXT[level] ?? '',
  can: (capability: string): boolean => legacyFreeCoreServices.permissions.can(capability),
  isModule: (id: string): boolean => Boolean(MODULO_AREA[id]),
  canOpenModule: (id: string): boolean => legacyFreeCoreServices.permissions.canUseModule(id),
  moduleCount: (): number => Object.keys(MODULO_AREA).filter(module => legacyFreeCoreServices.permissions.canUseModule(module)).length,
  settingsOf: (id: string): string | undefined => CFG_DE_MODULO[id],
  profile: (): { nombre: string; rol: string } => sessionStore.profile as { nombre: string; rol: string },
  planIncludes: (module: string): boolean => legacyFreeCoreServices.plans.planIncludes(module),
  cheapestPlan: (module: string): string | undefined => legacyFreeCoreServices.plans.minimumPlan(module)?.nombre,
  showPlanNotice: (module: string): void => { legacyFreeCoreServices.plans.planNotice(module); },
  go: (screen: string, configSection?: string): void => { if (configSection !== undefined) settingsStore.section = configSection; navigate(screen); },
  vocabulary: (): { empresa: string; terminos: Record<string, unknown> } => ({ empresa: legacyFreeCoreServices.appName(), terminos: Object.fromEntries(Object.keys(TERM_DEF).map(key => [key, legacyFreeCoreServices.vocabulary.termOf(key)])) }),
  isIos: (): boolean => ES_IOS,
  back: (): { tab: string; y: number } | null => homeStore.manualReturn,
  takeBack: (): { tab: string; y: number } | null => { const back = homeStore.manualReturn; homeStore.manualReturn = null; return back; },
  screenName: (screen: string): string => legacyFreeCoreNavigationApi.screenName(screen),
  pageInfo: (screen: string): { t?: string; d?: string } => (PAGINAS[screen] ?? {}) as { t?: string; d?: string },
  attachHelp: (title: HTMLElement, html: string): void => { legacyFreeComponents.glueHelp(title, html); },
};

/** An appointment of a day, as the Agenda gives it (state, time and who). */
interface DayAppointment { estado: string; hora?: string | null; medico?: string; nombre?: string }

/** Calidad del dato: the address search, the export hook of the tools menu, module permission and the Cuentas header order. */
export const qualityLegacy = {
  geocode: (query: string, hints: GeocodeHints): Promise<GeocodeResult | null> => legacyFreeCoreServices.maps.geocode(query, hints) as Promise<GeocodeResult | null>,
  /** The «Descargar» entry of the tools menu calls window.__dlSeg (legado 014). */
  setExport: (exporter: (format: string) => Promise<void> | void): void => { Reflect.set(window, '__dlSeg', exporter); },
  download: (): void => { legacyFreeCoreServices.files.download(); },
  canUseModule: (module: string): boolean => legacyFreeCoreServices.permissions.canUseModule(module),
};

/** Oportunidades: catalogs, products, clients, orders, the reference picker, the period selector, charts and the list page. */
export const opportunitiesLegacy = {
  catalog: (key: string): readonly { valor: string; extra?: string | null }[] => CAT[key] ?? [],
  setCatalog: (key: string, list: { valor: string; extra?: string | null }[]): void => { CAT[key] = list; },
  products: (): readonly (CatalogProduct & { iva?: number | null })[] => productsStore.products,
  loadProducts: async (): Promise<void> => { if (!productsStore.products.length) await cargarProductos(); },
  defaultProduct: (): string => productoPorDefecto(),
  searchClients: <T>(query: string): Promise<T[]> => legacyFreeScreensCustomers.searchCustomers(query) as Promise<T[]>,
  editContact: (preset: Record<string, unknown>, onSave: (client: unknown) => void): void => { legacyFreeCoreLeftovers.editContact(preset, onSave, null); },
  editOrder: (preset?: Record<string, unknown>): void => { void legacyFreeScreensOrders.editOrder(preset ?? null); },
  /** The order saved next is linked to this opportunity (legado 038). */
  setPendingCall: (id: string): void => { ordersStore.pendingCall = id; },
  /** The account picker; what is typed without choosing is kept in element.__texto. */
  pickReference: (options: { element: HTMLElement; value: PickedAccount | null; freeText: string; placeholder: string; onPick: (account: PickedAccount) => void }): void => {
    Reflect.set(options.element, '__texto', options.freeText);
    legacyFreeScreensAccounts.pickAccount(options.element as unknown as HTMLElement, { valor: options.value, alElegir: options.onPick, placeholder: options.placeholder } as Parameters<typeof legacyFreeScreensAccounts.pickAccount>[1]);
  },
  mountPeriod: (element: HTMLElement | null, options: { id: string; valor: string; alCambiar: () => void }): void => { legacyFreeCoreLayers.mountPeriod(element, [options]); },
  periodOf: (element: HTMLElement | null): { desde: string | null; hasta: string | null } =>
    (Reflect.get(element ?? {}, '__rango') as (() => { desde: string | null; hasta: string | null }) | undefined)?.() ?? { desde: null, hasta: null },
  barChart: (items: { n: string; v: number }[], format: (value: number) => string): string => legacyFreeComponents.rankingBars(items, format),
  emptyChart: (text: string): string => legacyFreeComponents.emptyChart(text),
  page: (): number => ordersStore.callsPage,
  setPage: (page: number): void => { ordersStore.callsPage = page; },
  ordersSection: (): string => ordersStore.section,
  repaintList: (): void => { void legacyFreeScreensOpportunities.paintOpportunities(); },
};
