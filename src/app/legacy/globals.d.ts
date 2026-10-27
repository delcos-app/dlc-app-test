/**
 * Legacy globals (src/legado and the files moved out of it) that the new code still uses while screens migrate.
 * This is the ONLY place where new code learns about legacy names: when a piece is migrated, its line goes away from here.
 * Everything here is reached through src/app/legacy/bridge.ts, never directly from a screen.
 */
interface LegacyResult<T> { data: T | null; error: unknown }
interface LegacyQuery<T> extends PromiseLike<LegacyResult<T>> {
  select(columns: string): LegacyQuery<T>;
  eq(column: string, value: unknown): LegacyQuery<T>;
  update(values: Record<string, unknown>): LegacyQuery<T>;
  limit(count: number): LegacyQuery<T>;
  insert(values: Record<string, unknown>): LegacyQuery<T>;
  delete(): LegacyQuery<T>;
  in(column: string, values: readonly unknown[]): LegacyQuery<T>;
  or(filter: string): LegacyQuery<T>;
  order(column: string, options?: { ascending?: boolean }): LegacyQuery<T>;
  maybeSingle(): LegacyQuery<T>;
  single(): LegacyQuery<T>;
  is(column: string, value: unknown): LegacyQuery<T>;
}
interface LegacyDb {
  rpc<T>(name: string, params?: Record<string, unknown>): PromiseLike<LegacyResult<T>>;
  from<T>(table: string): LegacyQuery<T>;
}

declare const db: LegacyDb;
declare function RPC_ORIG<T>(name: string, params: Record<string, unknown>): PromiseLike<LegacyResult<T>>;

declare const CITA_ABIERTA: readonly string[];
declare const ICON_NOM: Readonly<Record<string, string>>;
declare function ir(screen: string): unknown;
declare function TT(term: string, number?: string, article?: string, caseStyle?: string, capital?: string, adjective?: string): string;
declare function verArea(area: string): boolean;
declare function verImportes(): boolean;
declare function VE_TODO(): boolean;
declare function ES_MEDICO(): boolean;
declare function citaAnulada(state: string): boolean;
declare function citasDelDia(date: string): Promise<{ estado: string; hora?: string | null; medico?: string; nombre?: string }[]>;
declare function svgIco(inner: string): string;
declare function hayOportunidades(): boolean;
declare function puedeDuplicados(): boolean;

// ---- Navigation (src/app/core/navigation): state and helpers the navigation steps still read or change
type PageTab = Record<string, string | undefined>;
declare const VUELTA: unknown[];

declare const PL: Readonly<Record<string, unknown>>;

declare let CFG_KEY: string;

declare let IR_DESDE_MENU_CFG: boolean;
declare let IR_DESDE_MENU: boolean;
declare const PANEL_SECCIONES: readonly (readonly string[])[];

declare let PAGO_IR_PLAN: boolean;
declare const PLAN_SECCIONES: Readonly<Record<string, readonly string[]>>;

declare const ALIAS_PEDIDOS: Readonly<Record<string, string>>;
declare const ORG_DESDE: Readonly<Record<string, string>>;
declare const PAGINAS: Readonly<Record<string, unknown>>;

declare function cometa(): void;
declare function aplicarNombresMenu(): void;
declare function ponerAyudaManual(): void;
declare function aplicarEtiqueta(): void;
declare function pagoAlPlan(): void;
declare function puedeOrganizacion(): boolean;
declare function planIncluyeSeccion(section: string): boolean;
declare function hoyISO(): string;
declare function menuMarcarPie(): void;
declare function puede(capability: string): boolean;
declare function cargarPagina(screen: string): void;

// ---- Home indicators (src/app/screens/home/indicators): the indicator catalog is shared with Configuración (not migrated yet)
interface KpiDefinition {
  readonly id: string;
  readonly t: string;
  readonly v: (kpis: Record<string, number>) => unknown;
  readonly cls?: (kpis: Record<string, number>) => string;
  readonly h?: string;
  readonly admin?: boolean;
}
interface KpiSetting { readonly id: string; readonly on: boolean; readonly t?: string; readonly filtro?: Record<string, unknown> }
interface HomePanel {
  kpis?: Record<string, number>;
  agenda_hoy?: { estado: string; hora?: string | null; nombre: string }[];
}
interface HomeCharts {
  por_dia?: { fecha: string; n: number }[];
  estados?: { valor: string; n: number }[];
  proximos?: { fecha: string; n: number }[];
}
declare const KPI_CAT: readonly KpiDefinition[];
declare const AYUDA_KPI: Readonly<Record<string, string>>;
declare const KPI_ICO: Readonly<Record<string, string>>;
declare const KPI_TXT: Readonly<Record<string, string>>;

declare const EST_COL: Readonly<Record<string, string>>;
declare function kpiConfig(): readonly KpiSetting[];
declare function rpcCache<T>(name: string, params: Record<string, unknown>, key: string): Promise<{ data: T | null; cache?: boolean; fecha?: string }>;
declare function marca(step: string): void;
declare function ponerAyudas(): void;
declare function ES_MOVIL(): boolean;

interface AgendaMetrics {
  hoy?: { visitadas?: number | null; citas?: number | null };
  semana?: { visitas?: number | null; media?: number | null };
  cierres?: { hoy?: number | null; media_dia?: number | null };
  pendientes?: { urgentes?: number | null; sin_visita?: number | null };
  media_dia?: number | null;
}

interface AgendaAppointment { id: string; cuenta_id?: string; estado: string; lat?: number | string | null; lon?: number | string | null; centro_nombre?: string | null }

declare function agVerDia(isoDate: string): Promise<void>;
declare function agN(): boolean;

interface SameCentrePerson { id: string; nombre: string; visitar?: string | null; falta?: string[] | null; dias?: Record<string, string | null> | null }
interface SameCentreGroup { centro_id?: string | null; centro_nombre?: string | null; lat?: number | null; lon?: number | null; cuentas?: SameCentrePerson[]; medicos?: SameCentrePerson[] }
interface DueAccount { id?: string; cuenta_id?: string; nombre: string; estado_comercial?: string | null; dias_sin_visita?: number | null; municipio?: string | null; lat?: number | null; lon?: number | null }
interface PendingAppointment { id: string; nombre: string; fecha: string; centro_nombre?: string | null }

declare function abrirFicha(id: string): Promise<void>;
declare function nuevaCita(accountId: string, isoDate: string | null): Promise<void>;
interface RangeAppointment { fecha: string; estado: string; usuario_id?: string; hora?: string | null; medico?: string | null; nombre?: string | null }


declare let AG_HOY_VISTO: string | null;

interface WeekAppointment extends RangeAppointment { id: string; cuenta_id: string; usuario?: string | null; dias?: Record<string, string | null> | null }
interface WeekDraftItem { m: { nombre: string; municipio?: string | null }; ini?: number | null; cita?: Record<string, unknown>; motivo?: string }
interface WeekDraft { semana: string; uid: string; total: number; dias: Record<string, WeekDraftItem[]>; sinDia: WeekDraftItem[]; horario?: Record<string, unknown> | null }

declare function estimarDia(appointments: readonly object[], isoDate: string): { fin: number; tope: number };
declare function preguntar(message: string, options: { titulo?: string; ok?: string; peligro?: boolean }): Promise<boolean>;
declare function toast(message: string, isError?: boolean): void;
declare function cargarAgenda(): Promise<void>;
interface DayAppointmentFull extends WeekAppointment {
  lat?: number | string | null; lon?: number | string | null; centro_nombre?: string | null;
  municipio?: string | null; clase?: string | null; urgente?: boolean | null; estado_comercial?: string | null; nota?: string | null;
  anterior?: { fecha: string; proxima_accion?: string | null } | null;
}
interface StopInfo { otroCentro?: string | null; aviso?: string | null; lejos?: number | null; llegada?: number | null; ventanas?: [number, number][] | null; espera?: number | null }
interface DayTask { id: string; titulo: string; nota?: string | null; hora?: string | null; hecha?: boolean | null }

declare const ICO: Readonly<Record<string, string>>;
declare const ICU: Readonly<Record<string, string>>;
declare function SVA(path: string): string;
declare function plIco(...names: string[]): string;
declare function txtVentanas(windows: readonly [number, number][]): string;
declare function puedeRegistrarEnDia(isoDate: string): boolean;
declare function colaLeer(): { fn: string; payload?: { p?: { fecha?: string; cuenta_id?: string } } }[];
interface SheetAppointment extends DayAppointmentFull {
  especialidad?: string | null; direccion?: string | null;
  aplazada_a_fecha?: string | null; aplazada_de_fecha?: string | null;
}
interface ChoiceButton { k: string; t: string; cls?: string }
declare let VISITA_FECHA: string;

declare const CAT: Record<string, { valor: string; extra?: string | null }[]>;
declare function escribir(name: string, payload: Record<string, unknown>): Promise<{ error?: unknown } | null>;
declare function escribirRpc(name: string, payload: Record<string, unknown>): Promise<{ error?: { message?: string } | null }>;
declare function navegarA(point: [number, number] | null): Promise<void>;
declare function abrirVisita(accountId: string): Promise<void>;
declare function agUnida(): boolean;
declare const RC: Map<string, unknown>;
declare const RC_VUELO: Map<string, unknown>;

declare const AG_DIAS_DATOS: Record<string, AgendaAppointment[] | undefined>;
interface PickedAccount { id: string; nombre?: string; centro_nombre?: string | null; centro?: string | null }
interface Consultation { centro_nombre?: string | null; municipio?: string | null; principal?: boolean | null }
interface RecentContact { tipo: string; fecha: string; usuario?: string | null }
declare function avisoRevisita(): { on: boolean; dias: number };

declare function verEvento(id: string): Promise<void>;
declare function verDeposito(accountId: string, name: string, notice?: string): Promise<void>;
declare function depCaducaPronto(isoDate: string | null | undefined): boolean;
declare function verCirugia(id: string, notice?: string): Promise<void>;
declare function verConcurso(id: string): Promise<void>;
declare function verEquipo(id: string): Promise<void>;
interface CardAccount { id: string; nombre: string; tipo?: string | null; codigo?: string | null; especialidad?: string | null; area?: string | null; urgente?: boolean | null; sin_reporting?: boolean | null; estado_comercial?: string | null; email?: string | null }
interface CardConsultation extends Consultation { direccion?: string | null; cp?: string | null; planta?: string | null; sala?: string | null; indicaciones?: string | null; telefono?: string | null; dias?: Record<string, string | null> | null; lat?: number | null; lon?: number | null }
interface CardVisit { id: string; fecha: string; modo?: string | null; resultados?: string[] | null; muestras?: number | null; nota?: string | null; proxima_fecha?: string | null; proxima_accion?: string | null }
interface CardData { medico?: CardAccount; consultas?: CardConsultation[]; visitas?: CardVisit[]; comerciales?: string[] }
interface AccountUnits { hoy: number; semana: number; mes: number; trimestre: number; anio: number; total: number; pautas: number; ultima: string }
declare let UDS_SERIE: string;
declare const UDS_SERIES: [string, string][];
declare function estados(): string[];
declare function leyendaUnidades(series: string): string;
interface HistoryEntry { id: number; accion: string; entidad?: string | null; usuario?: string | null; creado_en: string; detalle?: unknown; deshacible?: boolean | null }
declare const PAC: { q: string; medico: string | null; medicoNombre: string; pagina: number; tipo?: string; pedidos?: string; municipio?: string; campos?: Record<string, unknown> };
declare function detTxt(visit: object): string;
declare function campoTxt(field: string): string;
interface PortalMessage { id: string; texto: string; del_portal: boolean; creado_en: string; leido_en?: string | null }
interface PortalResult { ok?: boolean; motivo?: string; productos?: number }
interface CatalogProduct { id: string; nombre: string; tipo?: string | null; estado?: string | null; precio?: number | null }
interface PlatformUser { id: string; cuenta_id?: string | null; email?: string | null; activo?: boolean }

declare const CFG: { url: string; anon: string };
declare function hayExtra(extra: string): boolean;
declare function pillMaterial(state: string): string;
declare function cargarProductos(): Promise<void>;
declare function facccon(userId: string): Promise<void>;
declare function nuevoUsuario(preset: Record<string, unknown>): void;
interface AccountFilters { q: string; prov: string; muni: string; esp: string; est: string; urg: boolean; mios?: boolean; sin?: boolean; com?: string | null; rep?: string | null; tipo?: string; orden: string; pagina: number; total: number; campos: Record<string, unknown> }
interface AccountRow { id: string; nombre?: string | null; urgente?: boolean | null; centro_nombre?: string | null; municipio?: string | null; estado_comercial?: string | null }
interface ColumnSetting { k: string; on: boolean; w: number }
declare const F: AccountFilters;

declare const ORD_DIR: Readonly<Record<string, string>>;
declare function etiquetaContactos(): string;
declare function tamPagina(): number;
interface CustomField { clave: string; nombre: string; tipo?: string | null; en_tabla?: boolean | null }
interface AccountListRow extends AccountRow { sin_reporting?: boolean | null; dias?: Record<string, string | null> | null; ultima_visita?: string | null; telefono?: string | null; consulta_telefono?: string | null; clasificadores?: Record<string, unknown> | null; comerciales?: { nombre: string }[] | null; [key: string]: unknown }
declare const CAMPOS: Record<string, CustomField[] | undefined>;
declare function invalidarCache(): void;
declare function verPedido(id: string): Promise<void>;

// ---- Parque instalado (src/app/screens/equipment): contract warnings and kinds live in Concursos (not migrated yet)

declare const EQ_CONTRATOS: readonly string[];

// ---- Compras (src/app/screens/purchases): the catalogs stay in legacy, Productos uses them too
interface PurchaseSupplier {
  id?: string; nombre?: string; activo?: boolean; plazo_dias?: number | null; pais?: string | null; nif?: string | null; municipio?: string | null;
  contacto?: string | null; email?: string | null; telefono?: string | null; compras?: number; ultima_compra?: string | null; nota?: string | null;
  [field: string]: unknown;
}
interface PurchaseStore { id: string; nombre: string; tipo?: string | null; activo?: boolean }

declare function cargarProveedores(): Promise<void>;
declare function cargarAlmacenes(): Promise<void>;
declare function loteRecepcion(line: object, units: number | string, storeId: string | undefined): string;
declare function cargarVentas(): Promise<void>;
declare function editorCompra(id: string | null): Promise<void>;

// ---- Importar datos (src/app/screens/import): the SheetJS reader, loaded by servicios/exportar.js

interface SheetBook { SheetNames: string[]; Sheets: Record<string, unknown> }

interface SheetReader { read(data: ArrayBuffer | string, options: Record<string, unknown>): SheetBook; utils: { sheet_to_json(sheet: unknown, options: Record<string, unknown>): unknown[][] } }



// ---- Manual de uso (src/app/screens/manual): the portal manual content and the checks it needs

interface ManualSection { id: string; t: string; a: string | null; para: string; hacer: [number, string][]; config?: string[] }

type FirstStep = readonly [string, string, string, string];

type HelpEntry = readonly [string, string, (readonly string[])?];

declare const MANUAL: ManualSection[];

declare const AYUDA: Readonly<Record<string, HelpEntry | undefined>>;

declare const FAQ: readonly (readonly [string, string])[];

declare const PRIMEROS_PASOS: Readonly<Record<string, readonly FirstStep[] | undefined>>;

declare const ICONOS_MANUAL: Readonly<Record<string, string | undefined>>;

declare const NIVEL_TXT: readonly string[];

declare const MODULO_AREA: Readonly<Record<string, string | undefined>>;

declare const CFG_DE_MODULO: Readonly<Record<string, string | undefined>>;

declare function puedeModulo(screen: string): boolean;



declare const TERM_DEF: Readonly<Record<string, unknown>>;



declare const ES_IOS: boolean;


interface GeocodeHints { direccion?: string | null | undefined; municipio?: string | null | undefined; cp?: string | null | undefined }

interface GeocodeResult { lat: string | number; lon: string | number; fuera?: string }

declare function geocodificar(query: string, hints: GeocodeHints): Promise<GeocodeResult | null>;

declare function descargar(rows: unknown[], name: string, format: string): void;

declare function productoPorDefecto(): string;


declare function editorContacto(preset: Record<string, unknown>, onSave: (client: unknown) => void): void;

declare function editorPedido(preset?: Record<string, unknown>): Promise<void>;

declare function montarPeriodo(element: HTMLElement | null, options: { id: string; valor: string; alCambiar: () => void }): void;


declare function pintarLlamadas(): Promise<void>;

interface LegacyQuery<T> { neq(column: string, value: unknown): LegacyQuery<T> }

// ---- Clientes (src/app/screens/customers): the customer editor, the order pieces and the list helpers stay in legacy
declare function nuevaVenta(preset: object): unknown;
declare function camposFiltros(area: string, state: Record<string, unknown>, prefix: string): string;
declare function cargando(element: HTMLElement | null, text?: string): void;
declare const DB_PRE: Map<string, unknown>;
declare function listaPacientes(): Promise<void>;

// ---- Comisiones (src/app/screens/commissions): the schemes are shared with the user editor of Configuración

