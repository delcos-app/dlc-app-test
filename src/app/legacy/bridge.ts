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
