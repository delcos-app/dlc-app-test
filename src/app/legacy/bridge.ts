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
export const legacyDb = (): LegacyDb => db;
export const callRpc = <T>(name: string, params: Record<string, unknown> = {}): PromiseLike<LegacyResult<T>> => RPC_ORIG<T>(name, params);

export const currentScreen = (): string => TAB;
export const goTo = (screen: string): void => { ir(screen); };
/** Opens Pedidos on one of its sections (ventas, llamadas…). */
export const goToOrders = (section: string): void => { PEDSEC = section; ir('ventas'); };

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
  return adjective === undefined ? TT(word, number, article, articleCapital, capital) : TT(word, number, article, articleCapital, capital, adjective);
}

export const permissions = {
  canSeeArea: (area: string): boolean => verArea(area),
  canSeeAmounts: (): boolean => verImportes(),
  seesEverything: (): boolean => VE_TODO(),
  salesLevel: (): number => legacyFreeCoreServices.permissions.levelOrNone(('V')),
  /** Level (0–3) in an area by its letter (M: accounts, V: sales…). */
  levelOf: (letter: string): number => legacyFreeCoreServices.permissions.levelOrNone(letter),
  isProfessionalPortal: (): boolean => ES_MEDICO(),
  hasOpportunities: (): boolean => typeof hayOportunidades === 'function' && hayOportunidades(),
  canReviewDuplicates: (): boolean => typeof puedeDuplicados === 'function' && puedeDuplicados(),
};

export const homeCache = {
  panel: (): typeof KV_INI => KV_INI,
  setPanel: (value: typeof KV_INI): void => { KV_INI = value; },
  charts: (): typeof KV_GRAF => KV_GRAF,
};

export const appointments = {
  ofDay: citasDelDia,
  isOpen: (state: string): boolean => CITA_ABIERTA.includes(state),
  isCancelled: (state: string): boolean => citaAnulada(state),
};

export const icon = (name: string): string => svgIco(ICON_NOM[name] ?? ICON_NOM.info ?? '');
/** True when these figures were already shown counting on this screen (they are not animated twice). */

/** Indicator catalog and settings: shared with Configuración, which is not migrated yet. */
export const indicatorCatalog = {
  definitions: (): readonly KpiDefinition[] => KPI_CAT,
  settings: (): readonly KpiSetting[] => kpiConfig(),
  allowed: (definition: KpiDefinition | undefined): boolean => kpiPermitido(definition),
  help: (id: string): string | undefined => AYUDA_KPI[id],
  icon: (id: string): string | undefined => KPI_ICO[id],
  description: (id: string): string | undefined => KPI_TXT[id],
};

export const commercialStates = {
  all: (): readonly { valor: string; papel: string }[] => ESTADOS_DEF,
  color: (state: string): string | undefined => EST_COL[state],
};

/** Cached read (offline copy) of a database function. */
export const cachedRpc = <T>(name: string, params: Record<string, unknown>, key: string): ReturnType<typeof rpcCache<T>> => rpcCache<T>(name, params, key);
export const timingMark = (step: string): void => { marca(step); };
export const showCacheNotice = (element: HTMLElement, date: string | undefined): void => { legacyFreeComponents.cacheNotice(element, date); };
export const addHelpButtons = (): void => { ponerAyudas(); };
export const isMobile = (): boolean => ES_MOVIL();

/** Agenda state still kept by the legacy day view (selected day, whose agenda, today's appointments, the metrics). */
export const legacyAgenda = {
  selectedDate: (): string | null => AG_FECHA,
  /** The person whose agenda is shown (null: everybody the user sees, or the user). */
  userFilter: (): string | null => legacyFreeCoreLeftovers.agendaUserFilter(),
  viewedUserId: (): string | null => AG_VISTA?.id ?? null,
  showDay: (isoDate: string): void => { void agVerDia(isoDate); },
  isDayView: (): boolean => agN(),
  metrics: (): AgendaMetrics | null => AG_MET,
  setMetrics: (value: AgendaMetrics): void => { AG_MET = value; },
  /** Today's appointments as painted in «Tu día», and the day they were loaded for. */
  dayAppointments: (): readonly AgendaAppointment[] => TD_CITAS,
  loadedDay: (): string | null => TD_ULTIMO?.fecha ?? null,
};

/** Suggestions of the shown day: accounts due a visit, pending ones from earlier days and colleagues in the same centre. */
export const agendaSuggestions = {
  forDay: (): typeof AG_SUG => AG_SUG,
  pending: (): readonly PendingAppointment[] => AG_PEND ?? [],
};

/** Other screens reached from Agenda. */
export const agendaActions = {
  openAccount: (id: string): void => { void abrirFicha(id); },
  newAppointment: (accountId: string, isoDate: string | null): void => { void nuevaCita(accountId, isoDate); },
};

/** The side panel (#tools) remembers what it shows so it can be painted again after a change. */
export const sidePanel = {
  context: (): string | null => HERR_CTX,
  setContext: (value: string): void => { HERR_CTX = value; },
};

/** Agenda pieces still in legacy. */
export const legacyAgendaParts = {
  mode: (): string => AG_MODO,
  blockedDays: (fromIsoDate: string, days: number): Promise<Record<string, string>> => agBloqueos(fromIsoDate, days),
};

/** What the Agenda data loader needs from legacy: whose agenda, the strip start and the day tasks. */
export const agendaSources = {
  /** The person whose agenda is shown (the user, or the colleague administration is looking at). */
  ownerId: (): string => agUid(),
  isOwnAgenda: (): boolean => agUid() === (PERFIL as { id: string }).id,
  stripStart: (): string | null => CINTA_INI,
  /** «Tu día» of this date arrives already loaded (from Inicio). */
  hasPresetDay: (isoDate: string): boolean => TD_PRESET?.fecha === isoDate,
  dayTasks: (isoDate: string): Promise<unknown> => tareasDelDia(isoDate),
  blockedDays: (fromIsoDate: string, toIsoDate: string): Promise<Record<string, string>> => bloqueadosSemanaBase(fromIsoDate, toIsoDate),
  setSuggestions: (isoDate: string, suggestions: { pend: PendingAppointment[]; toca: DueAccount[]; centros: SameCentreGroup[] }): void => {
    AG_PEND = suggestions.pend; AG_SUG = { fecha: isoDate, toca: suggestions.toca, centros: suggestions.centros };
  },
};

/** The day strip state, still kept in legacy globals (the tests read CINTA_INI): its first Monday and whether the week is open. */
export const stripState = {
  start: (): string | null => CINTA_INI,
  setStart: (isoDate: string | null): void => { CINTA_INI = isoDate; },
  weekOpen: (): boolean => AG_SEM_ABIERTA,
  setWeekOpen: (open: boolean): void => { AG_SEM_ABIERTA = open; },
};

/** Agenda screen state still kept in legacy globals (the day view and «Tu día» read them). */
export const agendaState = {
  setMode: (mode: string): void => { AG_MODO = mode; },
  setSelectedDate: (isoDate: string): void => { AG_FECHA = isoDate; },
  /** The last day the agenda was opened on «today» (to jump to the new today after midnight). */
  lastTodaySeen: (): string | null => AG_HOY_VISTO,
  setLastTodaySeen: (isoDate: string): void => { AG_HOY_VISTO = isoDate; },
  forgetDayTasks: (): void => { TAREAS_DIA = null; },
  /** Someone asked to open Agenda straight on «Repartir la semana». */
  takeWeekPlanRequest: (): boolean => { const asked = ABRIR_PLAN_SEMANA; ABRIR_PLAN_SEMANA = false; return asked; },
  viewed: (): { id: string; nombre: string } | null => AG_VISTA,
};

/** The sales team (COMS) for the team views, loaded once. */
export const salesTeam = {
  members: (): readonly { id: string; nombre: string }[] => COMS,
  load: (): Promise<void> => cargarComerciales(),
  currentUserId: (): string => (PERFIL as { id: string }).id,
  showAgendaOf: (userId: string): void => { void legacyFreeCoreLeftovers.showAgendaOf(userId); },
};

/** Agenda pieces painted by legacy code. */
export const legacyAgendaPaint = {
  yourDay: (): Promise<void> => pintarTuDia(),
  team: (): Promise<void> => pintarEquipo(),
  noStartWarning: (element: HTMLElement | null): void => { legacyFreeComponents.noStartNotice(element); },
};

/** The week planner («Repartir la semana») and its unsaved proposal, still in legacy (pantallas/rutas.js). */
export const weekPlanner = {
  draft: (): WeekDraft | null => SEM_BORRADOR,
  discardDraft: (): void => { SEM_BORRADOR = null; },
  /** Estimated end of a day (minutes) and the latest return time. */
  estimateDay: (list: readonly object[], isoDate: string): { fin: number; tope: number } => estimarDia(list, isoDate),
  /** Opening windows of a person on a date: null when unknown, [] when they do not attend that day. */
  attendanceWindows: (days: Record<string, string | null> | null | undefined, isoDate: string): unknown[] | null => ventanasDe(days, isoDate),
};

/** Common dialogs and notices. */
export const notices = {
  toast: (message: string, isError = false): void => { toast(message, isError); },
  confirm: (message: string, options: { titulo?: string; ok?: string; peligro?: boolean }): Promise<boolean> => preguntar(message, options),
  choose: (title: string, message: string, buttons: ChoiceButton[]): Promise<string | null> => elegirOpcion(title, message, buttons),
  askDate: (message: string, value: string, options: { titulo?: string; ok?: string }): Promise<string | null> => pedirFecha(message, value, options),
  askTime: async (title: string, value: string, ok: string): Promise<string | null> => (await appVentana({ titulo: title, ok, campo: { valor: value, tipo: 'time' } })) as string | null,
};

export const initialsOf = (name: string): string => iniciales(name);
/** Mounts Agenda again from its current state (legacy adapter of loadAgenda: avoids an import cycle between the pieces). */
export const reloadAgenda = (): void => { void cargarAgenda(); };

/** What «Tu día» still uses from legacy: the day estimate and its stop information (route domain, migrates with Rutas), the
 * working day, the appointment menu, ordering, tasks and the offline queue. */
export const yourDayLegacy = {
  setDayAppointments: (list: AgendaAppointment[]): void => { TD_CITAS = list; },
  estimateDay: (list: readonly object[], isoDate: string): { est: Record<string, number>; fin: number; tope: number } =>
    estimarDia(list, isoDate) as unknown as { est: Record<string, number>; fin: number; tope: number },
  stopInfo: (): Readonly<Record<string, StopInfo>> => TD_INFO,
  explainWarning: (info: StopInfo): string => explicarAviso(info),
  windowsText: (windows: readonly [number, number][]): string => txtVentanas(windows),
  canRecordOn: (isoDate: string): boolean => puedeRegistrarEnDia(isoDate),
  queuedVisits: (): ReturnType<typeof colaLeer> => colaLeer(),
  showDialog: (title: string, message: string, ok: string): void => { void appVentana({ titulo: title, msg: message, ok, cancel: false }); },
};

/** Legacy icons: the line icons of Agenda (ICU), the arrow icons (ICO) and the list icons (plIco). */
export const legacyIcons = {
  line: (name: string): string => SVA(ICU[name] ?? ''),
  arrow: (name: 'arriba' | 'abajo'): string => ICO[name] ?? '',
  list: (name: string): string => plIco(name),
};

/** What the appointment sheet and its actions still use from legacy. */
export const appointmentLegacy = {
  /** Writes through the offline queue (the change is kept if there is no connection). */
  write: (name: string, payload: Record<string, unknown>): Promise<{ error?: unknown } | null> => escribir(name, payload),
  writeRpc: (name: string, payload: Record<string, unknown>): Promise<{ error?: { message?: string } | null }> => escribirRpc(name, payload),
  negativeResults: (): readonly { valor: string }[] => (CAT.resultado_visita ?? []).filter(item => item.extra === 'neg'),
  navigateTo: (point: [number, number] | null): void => { void navegarA(point); },
  recordVisit: (accountId: string, isoDate: string): void => { VISITA_FECHA = isoDate; void abrirVisita(accountId); },
  openAccountFromCentre: (accountId: string, centre: string | null | undefined): void => { FICHA_CENTRO = centre ?? null; void abrirFicha(accountId); },
  lastDayData: (): AgendaAppointment[] | null => (TD_ULTIMO && TD_ULTIMO.fecha === AG_FECHA ? TD_ULTIMO.data ?? null : null),
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
  preset: (isoDate: string, data: AgendaAppointment[]): void => { TD_PRESET = { fecha: isoDate, data }; TD_ULTIMO = { fecha: isoDate, data }; },
  lastPainted: (isoDate: string): AgendaAppointment[] | null => (TD_ULTIMO?.fecha === isoDate ? TD_ULTIMO.data ?? null : null),
  setLastPainted: (isoDate: string, data: AgendaAppointment[]): void => { TD_ULTIMO = { fecha: isoDate, data }; },
  /** Every day read alone (agenda_rango of one day), as it arrived. */
  dayData: (isoDate: string): AgendaAppointment[] | undefined => AG_DIAS_DATOS[isoDate],
  /** What is saved from now on is already shown: closing a dialog will not refresh again. */
  markDialogSeen: (): void => { DLG_EPOCA = RC_EPOCA; },
  dayTasks: (isoDate: string): (DayTask & { orden?: number })[] | null => (TAREAS_DIA?.f === isoDate ? TAREAS_DIA.l : null),
  setDayTasks: (isoDate: string, list: (DayTask & { orden?: number })[] | null): void => { TAREAS_DIA = list ? { f: isoDate, l: list } : null; },
};


/** What the appointment and task editors use from legacy: the account picker and the «seen recently» notice (Cuentas). */
export const editorLegacy = {
  pickAccount: (element: HTMLElement | null, value: PickedAccount | null, onPick: (account: PickedAccount) => Promise<void> | void, placeholder?: string): void => {
    selectorMedico(element, { valor: value, alElegir: onPick, ...(placeholder ? { placeholder } : {}) });
  },
  recentContacts: (accountId: string, isoDate: string): Promise<RecentContact[]> => recientesDe([accountId], isoDate).then(found => found[accountId] ?? []),
  recentText: (list: RecentContact[]): string => txtReciente(list),
  turnOffRecentNotice: (): Promise<void> => guardarAvisoRevisita({ ...avisoRevisita(), on: false }),
  centreFromCard: (): string | null => FICHA_CENTRO,
  viewedUserId: (): string | null => (currentScreen() === 'agenda' && AG_VISTA ? AG_VISTA.id : null),
};

/** The account card (ficha) pieces still in legacy, and the windows other modules open from it. */
export const accountCardLegacy = {
  shownId: (): string | null => FICHA_ID,
  setShownId: (id: string): void => { FICHA_ID = id; },
  forgetPatients: (): void => { FICHA_PAC = null; },
  forgetCentreFromAppointment: (): void => { FICHA_CENTRO = null; },
  planIncludes: (section: string): boolean => planIncluyeSeccion(section),
  canEditType: (type: string | null | undefined): boolean => legacyFreeCoreServices.permissions.canEditType(type),
  /** The base sections, in their legacy order (each one paints a block of the card). */
  customFields: (id: string, container: Element | null): Promise<void> => legacyFreeScreensSettings.paintCustomFieldsBlock(('cuentas'), id, container),
};

/** Windows and labels of other modules (events, deposit, surgeries, tenders, equipment, visit photos), still in legacy. */
export const relatedLegacy = {
  openVisitPhotos: (activityId: string, accountId: string): void => { void verFotosVisita(activityId, accountId); },
  openEvent: (id: string): void => { void verEvento(id); },
  openDeposit: (accountId: string, name: string): void => { void verDeposito(accountId, name); },
  expiresSoon: (isoDate: string | null | undefined): boolean => depCaducaPronto(isoDate),
  /** Opens a surgery through its global name (so «‹ Volver» sees it), optionally with a notice on top. */
  openSurgery: (id: string, notice?: string): void => { void verCirugia(id, notice); },
  openTender: (id: string): void => { void verConcurso(id); },
  openEquipment: (id: string): void => { void verEquipo(id); },
  newEquipment: (account: { id: string; nombre: string }): void => { void editarEquipo(null, account); },
};

/** What the base of the account card uses from legacy: the «Para la visita» block (Visitas), permissions and the units chart. */
export const cardBaseLegacy = {
  states: (): string[] => estados(),
  canRecord: (): boolean => legacyFreeCoreServices.permissions.canRecord(),
  canEdit: (): boolean => legacyFreeCoreServices.permissions.canEdit(),
  directionsAttribute: (point: [number, number]): string => navAttr(point),
  unitsChart: (units: AccountUnits, series: string): string => sparkUnidades(units, series),
  unitsLegend: (series: string): string => leyendaUnidades(series),
  unitsSeries: (): readonly [string, string][] => UDS_SERIES,
  unitsSeriesChosen: (): string => UDS_SERIE,
  chooseUnitsSeries: (series: string): void => { UDS_SERIE = series; try { localStorage.setItem('dlc-uds-serie', series); } catch { /* not remembered */ } },
};

/** What the sales, history and proposal sections of the card use from legacy. */
export const cardSectionsLegacy = {
  can: (capability: string): boolean => puede(capability),
  /** Sales level of the user (area V). */
  salesArea: (): number => (PERFIL as { areas?: Record<string, number> }).areas?.V ?? 0,
  roleCan: (role: string, capability: string): boolean => legacyFreeCoreSettings.roleCan(role, capability),
  openPatient: (id: string): void => { void fichaPaciente(id); },
  /** Opens Pacientes filtered by this account. */
  patientsOf: (accountId: string, name: string): void => { Object.assign(PAC, { q: '', medico: accountId, medicoNombre: name, pagina: 0 }); goTo('pacientes'); },
  visitDetails: (visit: object): string => detTxt(visit),
  fieldName: (field: string): string => campoTxt(field),
  valueText: (value: unknown): string => textoValor(value),
  detailSummary: (detail: unknown): string => resumenDetalle(detail),
  undo: (id: number, then: () => void): void => { void deshacerUno(id, then); },
};

/** Portal of the account (material requested, messages, products it can order) and platform access: legacy helpers. */
export const portalLegacy = {
  hasPortal: (): boolean => hayExtra('portal'),
  materialPill: (state: string): string => pillMaterial(state),
  products: async (): Promise<readonly CatalogProduct[]> => { if (!PRODUCTOS.length) await cargarProductos(); return PRODUCTOS; },
  euros: (value: number): string => eurI(value),
};

export const accessLegacy = {
  connectionInfo: (userId: string): void => { void facccon(userId); },
  canImpersonate: (user: PlatformUser): boolean => puedeVerComo(user),
  newUser: (preset: Record<string, unknown>): void => { nuevoUsuario(preset); },
  forgetAccessCache: (): void => { MED_ACCESO = null; },
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
  mapMode: (): boolean => MODO_MAPA,
  /** The database order key of a column (only the sortable ones). */
  sortKey: (column: string): string | undefined => ORD_DIR[column],
  fieldChips: (state: Record<string, unknown>): { k: string; t: string }[] => clasChips('medico', state),
  contactsLabel: (): string => etiquetaContactos(),
  pageSize: (): number => tamPagina(),
  paginate: (options: { element: HTMLElement | null; total: number; page: number; onPage: (page: number) => void; onSize: () => void }): void => {
    paginador(options.element, options.total, options.page, options.onPage, options.onSize);
  },
};

/** What the columns and cells of Cuentas use from legacy: custom fields, platform access and names. */
export const accountColumnsLegacy = {
  customFields: (): readonly CustomField[] => CAMPOS.medico ?? [],
  fieldText: (field: CustomField | undefined, value: unknown): string => campoTexto(field, value),
  firstName: (name: string): string => nombrePila(name),
  /** Platform access by account (loaded once; null until it arrives). */
  accessOf: (): Record<string, { activo?: boolean }> | null => MED_ACCESO as Record<string, { activo?: boolean }> | null,
  loadAccess: (): Promise<void> => legacyFreeCoreLeftovers.loadAccountAccess(),
  storageKey: (): string => `dlc-cols-${(PERFIL as { id?: string } | null)?.id ?? ''}`,
};

/** Eventos: the list repaints through its global name (the page tabs and the dialog-close listener of legado 079 use it). */
export const eventsLegacy = {
  repaintList: (): void => { void pintarEventos(); },
};

/** Shared helpers some screens still need from legacy. */
export const appLegacy = {
  /** Forgets every cached read (after a change other screens show). */
  forgetCache: (): void => { invalidarCache(); },
  openOrder: (id: string): void => { void verPedido(id); },
  currentUserName: (): string => (PERFIL as { nombre?: string }).nombre ?? '',
};

/** Ciclo de visitas: the company settings it reads and writes, and the tabs of its page. */
export const cycleLegacy = {
  loadSettings: (): Promise<void> => cargarAjustes(),
  setting: (key: string): unknown => AJUSTES[key],
  setSetting: (key: string, value: unknown): void => { AJUSTES[key] = value; },
  openTab: (tab: string): void => { PAG_TAB.ciclo = tab; cargarPagina('ciclo'); },
};

/** Intervenciones: the list repaints through its global name (page tab and dialog-close listener of legado 079). */
export const surgeriesLegacy = {
  repaintList: (): void => { void pintarCirugias(); },
};

/** Parque instalado: the warning days of contracts (shared with Concursos), the contract kinds and the product catalog. */
export const equipmentLegacy = {
  warningDays: (): readonly number[] => CON_AVISOS,
  setWarningDays: (days: number[]): void => { CON_AVISOS = days; },
  contracts: (): readonly string[] => EQ_CONTRATOS,
  loadProducts: async (): Promise<void> => { if (!PRODUCTOS.length) await cargarProductos(); },
};

/** Concursos: the expiry warning days stay in the legacy CON_AVISOS (Parque uses them too). */
export const tendersLegacy = {
  warningDays: (): readonly number[] => CON_AVISOS,
  setWarningDays: (days: number[]): void => { CON_AVISOS = days; },
};

/** Compras: the catalogs it shares with Productos (suppliers, stores, products), the permission and the Pedidos tab. */
export const purchasesLegacy = {
  section: (): string => PEDSEC,
  canBuy: (): boolean => Boolean(legacyFreeCoreServices.permissions.canBuy()),
  loadSuppliers: (): Promise<void> => cargarProveedores(),
  suppliers: (): readonly PurchaseSupplier[] => PROVEEDORES,
  loadStores: (): Promise<void> => cargarAlmacenes(),
  stores: (): readonly PurchaseStore[] => ALMACENES,
  loadProducts: (): Promise<void> => cargarProductos(),
  products: (): readonly (CatalogProduct & { coste?: number | null })[] => PRODUCTOS,
  /** The batch fields of «Recibir mercancía» (shared with the stock entries of Productos). */
  batchFields: (line: object, units: number | string, storeId: string | undefined): string => loteRecepcion(line, units, storeId),
  reloadSales: (): void => { void cargarVentas(); },
  /** Through the global name: legado 058 wraps it to open the wide window. */
  openPurchase: (id: string | null): void => { void editorCompra(id); },
};

/** Importar datos: the Excel reader (loaded on first use), the error log, the write counter and the «Importaciones» tab. */
export const importLegacy = {
  excelReader: (): Promise<SheetReader> => cargarLectorExcel(),
  reportError: (message: string): void => { registrarError('error', message); },
  countWrite: (): void => { ESCRITURAS++; },
  showHistory: (): void => { CFG_SUB = 'historial'; },
};

/** Manual de uso: the content of the portal manual (legacy data), access and plan checks, navigation and the way back. */
export const manualLegacy = {
  sections: (): readonly ManualSection[] => MANUAL,
  help: (id: string): HelpEntry | undefined => AYUDA[id],
  faq: (): readonly (readonly [string, string])[] => FAQ,
  firstSteps: (): Readonly<Record<string, readonly FirstStep[] | undefined>> => PRIMEROS_PASOS,
  icon: (id: string): string | undefined => ICONOS_MANUAL[id],
  levelText: (level: number): string => NIVEL_TXT[level] ?? '',
  can: (capability: string): boolean => puede(capability),
  isModule: (id: string): boolean => Boolean(MODULO_AREA[id]),
  canOpenModule: (id: string): boolean => puedeModulo(id),
  moduleCount: (): number => Object.keys(MODULO_AREA).filter(puedeModulo).length,
  settingsOf: (id: string): string | undefined => CFG_DE_MODULO[id],
  profile: (): { nombre: string; rol: string } => PERFIL as { nombre: string; rol: string },
  planIncludes: (module: string): boolean => planIncluye(module),
  cheapestPlan: (module: string): string | undefined => planMinimo(module)?.nombre,
  showPlanNotice: (module: string): void => { avisoPlan(module); },
  go: (screen: string, configSection?: string): void => { if (configSection !== undefined) CFG_SEC = configSection; ir(screen); },
  vocabulary: (): { empresa: string; terminos: Record<string, unknown> } => ({ empresa: nombreApp(), terminos: Object.fromEntries(Object.keys(TERM_DEF).map(key => [key, terminoDe(key)])) }),
  isIos: (): boolean => ES_IOS,
  back: (): { tab: string; y: number } | null => MANUAL_VUELTA,
  takeBack: (): { tab: string; y: number } | null => { const back = MANUAL_VUELTA; MANUAL_VUELTA = null; return back; },
  screenName: (screen: string): string => nombrePantalla(screen),
  pageInfo: (screen: string): { t?: string; d?: string } => (PAGINAS[screen] ?? {}) as { t?: string; d?: string },
  attachHelp: (title: HTMLElement, html: string): void => { legacyFreeComponents.glueHelp(title, html); },
};

/** Calidad del dato: the address search, the export hook of the tools menu, module permission and the Cuentas header order. */
export const qualityLegacy = {
  geocode: (query: string, hints: GeocodeHints): Promise<GeocodeResult | null> => geocodificar(query, hints),
  /** The «Descargar» entry of the tools menu calls window.__dlSeg (legado 014). */
  setExport: (exporter: (format: string) => Promise<void>): void => { Reflect.set(window, '__dlSeg', exporter); },
  download: (rows: unknown[], name: string, format: string): void => { descargar(rows, name, format); },
  canUseModule: (module: string): boolean => puedeModulo(module),
};

/** Oportunidades: catalogs, products, clients, orders, the reference picker, the period selector, charts and the list page. */
export const opportunitiesLegacy = {
  catalog: (key: string): readonly { valor: string; extra?: string | null }[] => CAT[key] ?? [],
  setCatalog: (key: string, list: { valor: string; extra?: string | null }[]): void => { CAT[key] = list; },
  products: (): readonly (CatalogProduct & { iva?: number | null })[] => PRODUCTOS,
  loadProducts: async (): Promise<void> => { if (!PRODUCTOS.length) await cargarProductos(); },
  defaultProduct: (): string => productoPorDefecto(),
  searchClients: <T>(query: string): Promise<T[]> => buscarClientes(query) as Promise<T[]>,
  editContact: (preset: Record<string, unknown>, onSave: (client: unknown) => void): void => { editorContacto(preset, onSave); },
  editOrder: (preset?: Record<string, unknown>): void => { void editorPedido(preset); },
  /** The order saved next is linked to this opportunity (legado 038). */
  setPendingCall: (id: string): void => { LLAMADA_PEND = id; },
  /** The account picker; what is typed without choosing is kept in element.__texto. */
  pickReference: (options: { element: HTMLElement; value: PickedAccount | null; freeText: string; placeholder: string; onPick: (account: PickedAccount) => void }): void => {
    Reflect.set(options.element, '__texto', options.freeText);
    selectorMedico(options.element, { valor: options.value, alElegir: options.onPick, placeholder: options.placeholder });
  },
  mountPeriod: (element: HTMLElement | null, options: { id: string; valor: string; alCambiar: () => void }): void => { montarPeriodo(element, options); },
  periodOf: (element: HTMLElement | null): { desde: string | null; hasta: string | null } =>
    (Reflect.get(element ?? {}, '__rango') as (() => { desde: string | null; hasta: string | null }) | undefined)?.() ?? { desde: null, hasta: null },
  barChart: (items: { n: string; v: number }[], format: (value: number) => string): string => legacyFreeComponents.rankingBars(items, format),
  emptyChart: (text: string): string => vacioGrafico(text),
  page: (): number => LLPAG,
  setPage: (page: number): void => { LLPAG = page; },
  ordersSection: (): string => PEDSEC,
  repaintList: (): void => { void pintarLlamadas(); },
};
