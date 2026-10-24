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
