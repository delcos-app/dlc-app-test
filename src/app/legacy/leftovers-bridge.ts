/**
 * Bridge of the last pieces moved out of src/pantallas, src/componentes and src/servicios/camara.js (v2.427.0) to the legacy state
 * they still read: the session and permissions, the agenda being viewed and its tasks, the read cache epochs, the page-save state,
 * the icon sets, the billing section, the contract prices, the indicator catalog and the menu glue. Kept apart from bridge.ts
 * (at its size limit).
 */
import * as legacyFreeCoreServices from '../core/services';
import * as legacyFreeCoreSettings from '../core/settings';
import * as legacyFreeScreensSettingsShell from '../screens/settings/shell';
export interface IndicatorSetting { readonly id: string; readonly on: boolean; readonly t?: string; readonly filtro?: Record<string, unknown> }
export interface SavePageDefinition { tab: string; cab: () => Element | null; cuerpo: () => Element | null }
export interface ViewedAgenda { id: string; nombre: string; rol?: string; preferencias?: Record<string, unknown> }
export interface ContractPrices { cuenta: string | null; precios: Record<string, unknown> }
export interface PeriodRange { desde: string | null; hasta: string | null }

interface Profile { id: string; preferencias?: { kpis?: IndicatorSetting[] } | null }
type Answer<T> = PromiseLike<{ data: T | null; error: unknown }>;
/** The query methods the reads below use (some are not in LegacyQuery). */
interface RawQuery extends Answer<unknown> {
  select(columns: string): RawQuery; eq(column: string, value: unknown): RawQuery; in(column: string, values: readonly unknown[]): RawQuery;
  gte(column: string, value: unknown): RawQuery; order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }): RawQuery; limit(count: number): RawQuery;
}
interface RawDb { from(table: string): RawQuery }

const RANGE_READER = '__rango';
const profile = (): Profile => PERFIL as Profile;
const rawDb = (): RawDb => db as unknown as RawDb;

export const leftoversLegacy = {
  // Session and permissions
  hasProfile: (): boolean => Boolean(PERFIL),
  userId: (): string => profile().id,
  screen: (): string => TAB,
  can: (capability: string): boolean => puede(capability),
  seesEverything: (): boolean => VE_TODO(),
  levelOf: (letter: string): number => legacyFreeCoreServices.permissions.levelOrNone(letter),
  roleCan: (role: string, capability: string): boolean => legacyFreeCoreSettings.roleCan(role, capability),
  isProfessionalPortal: (): boolean => ES_MEDICO(),
  canUseModule: (module: string): boolean => puedeModulo(module),
  canManageOrganization: (): boolean => puedeOrganizacion(),
  canReviewDuplicates: (): boolean => puedeDuplicados(),
  // Data access
  cacheEpoch: (): number => RC_EPOCA,
  dialogEpoch: (): number => DLG_EPOCA,
  today: (): string => hoyISO(),
  addDays: (isoDate: string, days: number): string => isoMas(isoDate, days),
  shortDate: (isoDate: string): string => legacyFreeCoreServices.calendar.shortDate(isoDate),
  euros: (value: number): string => eur(value),
  valueText: (value: unknown): string => textoValor(value),
  toast: (message: string, isError = false): void => { toast(message, isError); },
  showLoading: (element: HTMLElement | null, text: string): void => { cargando(element, text); },
  // Agenda
  viewedAgenda: (): ViewedAgenda | null => AG_VISTA,
  setViewedAgenda: (viewed: ViewedAgenda | null): void => { AG_VISTA = viewed; },
  reloadAgenda: (): void => { void cargarAgenda(); },
  showWeekFromToday: (): void => { AG_MODO = 'semana'; AG_FECHA = hoyISO(); },
  dayTasks: (): { f: string; l: unknown[] } | null => TAREAS_DIA,
  setDayTasks: (tasks: { f: string; l: unknown[] }): void => { TAREAS_DIA = tasks as typeof TAREAS_DIA; },
  tasks: (isoDate: string): Answer<unknown[]> => rawDb().from('tareas').select('*').eq('fecha', isoDate)
    .order('orden', { ascending: true, nullsFirst: false }).order('hora', { ascending: true, nullsFirst: false }).order('creado_en') as Answer<unknown[]>,
  planned: (states: readonly string[], from: string, limit: number): Answer<{ cuenta_id: string; fecha: string }[]> =>
    rawDb().from('agenda').select('cuenta_id,fecha').eq('usuario_id', profile().id).in('estado', states).gte('fecha', from).order('fecha').limit(limit) as Answer<{ cuenta_id: string; fecha: string }[]>,
  mountPeriod: (element: HTMLElement | null, options: { id: string; valor: string; alCambiar: () => void }): void => { montarPeriodo(element, options); },
  /** The range of a period picker (the legacy montarPeriodo leaves its reader on the element). */
  periodRange: (element: HTMLElement): PeriodRange => (Reflect.get(element, RANGE_READER) as () => PeriodRange)(),
  editFrequency: (): void => { void editorFrecuencia(); },
  // Cuentas
  setAccountAccess: (access: Record<string, unknown>): void => { MED_ACCESO = access; },
  revisitNotice: (): { on: boolean; dias: number } => avisoRevisita(),
  people: (): Answer<{ id: string; nombre: string; rol: string; activo?: boolean | null }[]> =>
    rawDb().from('perfiles').select('id,nombre,rol,activo').order('nombre') as Answer<{ id: string; nombre: string; rol: string; activo?: boolean | null }[]>,
  setSalesTeam: (team: { id: string; nombre: string }[]): void => { COMS = team; },
  salespersonFilter: (): string | null | undefined => F.com,
  // Pedidos, Concursos, Oportunidades
  contractPrices: (): ContractPrices => PED_PRECIOS,
  setContractPrices: (prices: ContractPrices): void => { PED_PRECIOS = prices; },
  setPendingCall: (id: string): void => { LLAMADA_PEND = id; },
  editOrder: (preset: Record<string, unknown>): Promise<void> => editorPedido(preset),
  ordersSection: (): string => PEDSEC,
  repaintCalls: (): void => { void pintarLlamadas(); },
  helpButton: (title: string, text: string): string => pmAyu(title, text),
  // Fields, page save and icons
  fieldTable: (area: string): string | undefined => CAMPO_TABLA[area],
  fieldTypes: (): readonly (readonly [string, string])[] => TIPOS_CAMPO,
  savePages: (): readonly SavePageDefinition[] => PAG_GUARDA as readonly SavePageDefinition[],
  saveTextPattern: (): RegExp => PAG_GUARDA_RE,
  notSaveSelector: (): string => PAG_GUARDA_NO,
  changedBlocks: (): Set<Element> => PAG_SUCIO as Set<Element>,
  pageKey: (): string => PAG_CLAVE,
  setPageKey: (key: string): void => { PAG_CLAVE = key; },
  markChanged: (): void => { legacyFreeScreensSettingsShell.markUnsaved(); },
  reloadSettings: (): void => { void cargarConfig(); },
  settingsKey: (): string => CFG_KEY,
  requestsInFlight: (): number => RED_VUELO,
  navIcon: (screen: string): string | undefined => ICO_NAV[screen],
  namedIcon: (name: string): string => ICON_NOM[name] ?? '',
  emojiIcon: (emoji: string): string => ICON_EMOJI[emoji] ?? '',
  emojiPattern: (): RegExp => RE_ICO,
  svgIcon: (inner: string): string => svgIco(inner),
  icon: (name: string): string => icono(name),
  canScan: (): boolean => Boolean((window as unknown as { ESC_FORZAR?: unknown }).ESC_FORZAR)
    || (PANTALLA_TACTIL && typeof (navigator.mediaDevices as MediaDevices | undefined)?.getUserMedia === 'function'),
  // Facturación
  billingSection: (): string => FSEC,
  // The legacy value may be null (no last settings section): it is kept as it was
  setBillingSection: (section: string | null): void => { FSEC = section as unknown as string; },
  lastBillingSettings: (): string | null => FAC_ULTIMA,
  setLastBillingSettings: (section: string): void => { FAC_ULTIMA = section; },
  billingSettingsSections: (): readonly (readonly [string, string])[] => FAC_CONFIG,
  loadBilling: (): void => { void cargarFacturacion(); },
  pdfDesign: (): void => { disenoPDF(); },
  // Configuración, Inicio and Rutas
  detailName: (key: string): string | undefined => NOMBRES_DETALLE[key],
  chosenIndicators: (): IndicatorSetting[] | undefined => profile().preferencias?.kpis,
  defaultIndicators: (): readonly string[] => KPI_DEF,
  indicatorCatalog: (): readonly { id: string }[] => KPI_CAT,
  openPlanHoursWindow: (): void => { legacyFreeCoreSettings.openPlanTimesWindow(); },
};
