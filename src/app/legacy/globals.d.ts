/**
 * Legacy globals (src/legado and the files moved out of it) that the new code still uses while screens migrate.
 * This is the ONLY place where new code learns about legacy names: when a piece is migrated, its line goes away from here.
 * Everything here is reached through src/app/legacy/bridge.ts, never directly from a screen.
 */
interface LegacyResult<T> { data: T | null; error: unknown }
interface LegacyQuery<T> extends PromiseLike<LegacyResult<T>> {
  select(columns: string): LegacyQuery<T>;
  eq(column: string, value: unknown): LegacyQuery<T>;
}
interface LegacyDb {
  rpc<T>(name: string, params?: Record<string, unknown>): PromiseLike<LegacyResult<T>>;
  from<T>(table: string): LegacyQuery<T>;
}

declare const db: LegacyDb;
declare function RPC_ORIG<T>(name: string, params: Record<string, unknown>): PromiseLike<LegacyResult<T>>;
declare let TAB: string;
declare let PEDSEC: string;
declare let KV_INI: HomePanel | null;
declare let KV_GRAF: HomeCharts | null;
declare const CITA_ABIERTA: readonly string[];
declare const ICON_NOM: Readonly<Record<string, string>>;
declare function ir(screen: string): unknown;
declare function TT(term: string, number?: string, article?: string, caseStyle?: string, capital?: string, adjective?: string): string;
declare function verArea(area: string): boolean;
declare function verImportes(): boolean;
declare function VE_TODO(): boolean;
declare function nivelDe2(letter: string): number;
declare function ES_MEDICO(): boolean;
declare function citaAnulada(state: string): boolean;
declare function citasDelDia(date: string): Promise<{ estado: string; hora?: string | null; medico?: string; nombre?: string }[]>;
declare function svgIco(inner: string): string;
declare function plYaContado(key: string, values: readonly string[]): boolean;
declare function hayOportunidades(): boolean;
declare function puedeDuplicados(): boolean;
declare function inicioQuitarAntiguo(): void;
declare function inicioCabecera(): void;
declare function pintarInicioBase2(): Promise<void>;

// ---- Navigation (src/app/core/navigation): state and helpers the navigation steps still read or change
type PageTab = Record<string, string | undefined>;
declare const VUELTA: unknown[];
declare let VISTA: unknown;
declare const PL: Readonly<Record<string, unknown>>;
declare let MANUAL_VUELTA: { tab: string; y: number } | null;
declare let CFG_SEC: string | null;
declare let CFG_SUB: string | null;
declare let CFG_KEY: string;
declare let CFG_DETALLE: boolean;
declare let PAG_TAB: PageTab;
declare let IR_DESDE_MENU_CFG: boolean;
declare let IR_DESDE_MENU: boolean;
declare const PANEL_SECCIONES: readonly (readonly string[])[];
declare let MODO_PLATAFORMA: boolean;
declare let PAGO_IR_PLAN: boolean;
declare const PLAN_SECCIONES: Readonly<Record<string, readonly string[]>>;
declare let PERFIL: unknown;
declare let AG_MODO: string;
declare let AG_FECHA: string | null;
declare const ALIAS_PEDIDOS: Readonly<Record<string, string>>;
declare const ORG_DESDE: Readonly<Record<string, string>>;
declare const PAGINAS: Readonly<Record<string, unknown>>;
declare let FAC_ULTIMA: string | null;
declare let FSEC: string;
declare let PEND: number;
declare let VIA_IR: string | null;
declare function irBase(screen: string): void;
declare function cometa(): void;
declare function plVigilar(screen: string): void;
declare function aplicarNombresMenu(): void;
declare function claveCfgVieja(section: string | null, subsection: string | null): string;
declare function marcarPanel(): void;
declare function ponerAyudaManual(): void;
declare function aplicarEtiqueta(): void;
declare function pagoAlPlan(): void;
declare function puedeOrganizacion(): boolean;
declare function planIncluyeSeccion(section: string): boolean;
declare function avisoPlan(section: string): void;
declare function hoyISO(): string;
declare function marcarPedsec(): void;
declare function menuMarcarPie(): void;
declare function puede(capability: string): boolean;
declare function cerrarEncajadas(): void;
declare function revelar(section: HTMLElement, maxMs: number, since: number): void;
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
declare let ESTADOS_DEF: readonly { valor: string; papel: string }[];
declare const EST_COL: Readonly<Record<string, string>>;
declare function kpiConfig(): readonly KpiSetting[];
declare function kpiPermitido(definition: KpiDefinition | undefined): boolean;
declare function textoFiltro(filter: Record<string, unknown>): string;
declare function contarFiltro(filter: Record<string, unknown>): Promise<number>;
declare function rpcCache<T>(name: string, params: Record<string, unknown>, key: string): Promise<{ data: T | null; cache?: boolean; fecha?: string }>;
declare function marca(step: string): void;
declare function avisoCache(element: HTMLElement, date: string | undefined): void;
declare function ponerAyudas(): void;
declare function ES_MOVIL(): boolean;

interface AgendaMetrics {
  hoy?: { visitadas?: number | null; citas?: number | null };
  semana?: { visitas?: number | null; media?: number | null };
  cierres?: { hoy?: number | null; media_dia?: number | null };
  pendientes?: { urgentes?: number | null; sin_visita?: number | null };
  media_dia?: number | null;
}
declare let AG_FECHA: string | null;
declare let AG_MET: AgendaMetrics | null;
declare let AG_VISTA: { id: string; nombre: string } | null;
interface AgendaAppointment { id: string; cuenta_id?: string; estado: string; lat?: number | string | null; lon?: number | string | null; centro_nombre?: string | null }
declare let TD_CITAS: AgendaAppointment[];
declare let TD_ULTIMO: { fecha: string } | null;
declare function agUsuarioFiltro(): string | null;
declare function agVerDia(isoDate: string): Promise<void>;
declare function agN(): boolean;

interface SameCentrePerson { id: string; nombre: string; visitar?: string | null; falta?: string[] | null; dias?: Record<string, string | null> | null }
interface SameCentreGroup { centro_id?: string | null; centro_nombre?: string | null; lat?: number | null; lon?: number | null; cuentas?: SameCentrePerson[]; medicos?: SameCentrePerson[] }
interface DueAccount { id?: string; cuenta_id?: string; nombre: string; estado_comercial?: string | null; dias_sin_visita?: number | null; municipio?: string | null; lat?: number | null; lon?: number | null }
interface PendingAppointment { id: string; nombre: string; fecha: string; centro_nombre?: string | null }
declare let AG_SUG: { fecha: string; toca: DueAccount[]; centros: SameCentreGroup[] } | null;
declare let AG_PEND: PendingAppointment[] | null;
declare let HERR_CTX: string | null;
declare function abrirFicha(id: string): Promise<void>;
declare function fichaCentro(id: string): Promise<void>;
declare function nuevaCita(accountId: string, isoDate: string | null): Promise<void>;
declare function planDesdeLista(list: readonly DueAccount[], name: string, button: HTMLElement): Promise<void>;
declare function reprogramarCitas(list: readonly PendingAppointment[], title: string, text: string): Promise<void>;
interface RangeAppointment { fecha: string; estado: string; usuario_id?: string; hora?: string | null; medico?: string | null; nombre?: string | null }
declare let AG_MODO: string;
declare function agBloqueos(fromIsoDate: string, days: number): Promise<Record<string, string>>;
declare function menuDiaSemana(button: HTMLElement, isoDate: string, blocked: boolean): Promise<void>;
declare function agRepartirSemana(): Promise<void>;
declare let TD_PRESET: { fecha: string } | null;
declare let CINTA_INI: string | null;
declare function agUid(): string;
declare function tareasDelDia(isoDate: string): Promise<unknown>;
declare function bloqueadosSemanaBase(fromIsoDate: string, toIsoDate: string): Promise<Record<string, string>>;
declare let AG_SEM_ABIERTA: boolean;
declare function agPintarSemanaExp(): Promise<void>;
