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
declare let KV_INI: { kpis?: Record<string, number> } | null;
declare let KV_GRAF: { por_dia?: { fecha: string; n: number }[] } | null;
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
declare function inicioIndicadores(): Promise<void>;
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
