/**
 * Bridge to the legacy code: typed, named access to what new screens still need from src/legado.
 * Screens import from here (never use a legacy global directly), so the remaining dependencies are visible in one file and each
 * one is replaced by a real service when its piece is migrated.
 */
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
  /** Adjective agreeing in gender and number (e.g. 'urgente') */
  readonly adjective?: string;
}

/** Company vocabulary (profesional, visita…): legacy TT() until the vocabulary service exists. */
export function term(word: string, options: TermOptions = {}): string {
  const { number = 's', article = '', capital = 'l', adjective } = options;
  return adjective === undefined ? TT(word, number, article, 'l', capital) : TT(word, number, article, 'l', capital, adjective);
}

export const permissions = {
  canSeeArea: (area: string): boolean => verArea(area),
  canSeeAmounts: (): boolean => verImportes(),
  seesEverything: (): boolean => VE_TODO(),
  salesLevel: (): number => nivelDe2('V'),
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
export const alreadyCounted = (key: string, values: readonly string[]): boolean => plYaContado(key, values);

/** Home pieces not migrated yet: the header actions and the professional portal. */
export const legacyHome = {
  removeOldBlocks: inicioQuitarAntiguo,
  header: inicioCabecera,
  professionalPortal: pintarInicioBase2,
};

/** Indicator catalog and settings: shared with Configuración, which is not migrated yet. */
export const indicatorCatalog = {
  definitions: (): readonly KpiDefinition[] => KPI_CAT,
  settings: (): readonly KpiSetting[] => kpiConfig(),
  allowed: (definition: KpiDefinition | undefined): boolean => kpiPermitido(definition),
  help: (id: string): string | undefined => AYUDA_KPI[id],
  icon: (id: string): string | undefined => KPI_ICO[id],
  description: (id: string): string | undefined => KPI_TXT[id],
  filterText: (filter: Record<string, unknown>): string => textoFiltro(filter),
  countFilter: (filter: Record<string, unknown>): Promise<number> => contarFiltro(filter),
};

export const commercialStates = {
  all: (): readonly { valor: string; papel: string }[] => ESTADOS_DEF,
  color: (state: string): string | undefined => EST_COL[state],
};

/** Cached read (offline copy) of a database function. */
export const cachedRpc = <T>(name: string, params: Record<string, unknown>, key: string): ReturnType<typeof rpcCache<T>> => rpcCache<T>(name, params, key);
export const timingMark = (step: string): void => { marca(step); };
export const showCacheNotice = (element: HTMLElement, date: string | undefined): void => { avisoCache(element, date); };
export const addHelpButtons = (): void => { ponerAyudas(); };
export const isMobile = (): boolean => ES_MOVIL();

/** Agenda state still kept by the legacy day view (selected day, whose agenda, today's appointments, the metrics). */
export const legacyAgenda = {
  selectedDate: (): string | null => AG_FECHA,
  /** The person whose agenda is shown (null: everybody the user sees, or the user). */
  userFilter: (): string | null => agUsuarioFiltro(),
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
  openCentre: (id: string): void => { void fichaCentro(id); },
  newAppointment: (accountId: string, isoDate: string | null): void => { void nuevaCita(accountId, isoDate); },
  planRoute: (list: readonly DueAccount[], button: HTMLElement): void => { void planDesdeLista(list, 'toca', button); },
  reschedule: (list: readonly PendingAppointment[], title: string, text: string): void => { void reprogramarCitas(list, title, text); },
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
  dayMenu: (button: HTMLElement, isoDate: string, blocked: boolean): void => { void menuDiaSemana(button, isoDate, blocked); },
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
  showAgendaOf: (userId: string): void => { void verAgendaDe(userId); },
};

/** Agenda pieces painted by legacy code. */
export const legacyAgendaPaint = {
  yourDay: (): Promise<void> => pintarTuDia(),
  team: (): Promise<void> => pintarEquipo(),
  noStartWarning: (element: HTMLElement | null): void => { avisoSinSalida(element); },
};

/** The week planner («Repartir la semana») and its unsaved proposal, still in legacy (pantallas/rutas.js). */
export const weekPlanner = {
  draft: (): WeekDraft | null => SEM_BORRADOR,
  discardDraft: (): void => { SEM_BORRADOR = null; },
  plan: (from: string, days: readonly string[], blocked: Record<string, string>, perDay: Record<string, WeekAppointment[]>): void => { void planificarSemana(from, days, blocked, perDay); },
  saveDraft: (button: HTMLElement): void => { void guardarBorradorSemana(button); },
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
  workingDay: (): { inicio: number } | null => jornadaActiva(),
  startWorkingDay: (): void => { void empezarJornada(); },
  endWorkingDay: (): void => { void terminarJornada(); },
  canRecordOn: (isoDate: string): boolean => puedeRegistrarEnDia(isoDate),
  originText: (item: object): string => textoOrigenCita(item),
  orderByDistance: (list: readonly object[]): { list: object[]; left: number } => { const ordered = ordenarPorCercania(list); return { list: ordered, left: ordenarPorCercania.fuera ?? 0 }; },
  editTask: (task: DayTask | null | undefined, isoDate?: string | null): void => { editarTarea(task, isoDate); },
  prepareRouteStops: (isoDate: string): void => { try { prepararParadas(isoDate); } catch { /* the route buttons are optional */ } },
  markTraffic: (): void => { tdMarcaTrafico(); },
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
  nextAttendanceDay: (days: Record<string, string | null> | null | undefined, from: string): string => proximoDiaConsulta(days, from),
  navigateTo: (point: [number, number] | null): void => { void navegarA(point); },
  recordVisit: (accountId: string, isoDate: string): void => { VISITA_FECHA = isoDate; void abrirVisita(accountId); },
  openAccountFromCentre: (accountId: string, centre: string | null | undefined): void => { FICHA_CENTRO = centre ?? null; void abrirFicha(accountId); },
  newDateAfterAbsent: (item: object): Promise<void> => nuevaFechaTrasNoEstaba(item),
  dayLabel: (isoDate: string): string => diaCita(isoDate),
  lastDayData: (): AgendaAppointment[] | null => (TD_ULTIMO && TD_ULTIMO.fecha === AG_FECHA ? TD_ULTIMO.data ?? null : null),
  isJoinedDayView: (): boolean => agUnida(),
  /** Opens the sheet through its global name, so «‹ Volver» (legado 126) records it. */
  openSheet: (item: object): void => { void (window as unknown as { verCita: (value: object) => unknown }).verCita(item); },
};

/** The loaded agenda data kept by legacy: the read cache, the last painted day and the data preset for the next paint. */
export const agendaCache = {
  /** Forgets the cached agenda reads, so the next paint asks the database. */
  forget: (): void => { for (const key of [...RC.keys()]) if (key.startsWith('agenda_')) { RC.delete(key); RC_VUELO.delete(key); } },
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

export const routeBar = { paint: (): void => { void pintarRutaBarra(); } };
