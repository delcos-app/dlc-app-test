// Legacy names the shared list components read (src/app/components/list, filters; v2.416.0).
declare const TAMANOS: readonly number[];
declare function normalizar(text: string | null): string;
declare const MESES_CORTOS: Readonly<Record<string, number>>;
declare function claveAnchos(kind: string): string;
declare const HT_ORDEN: Record<string, { i: number; dir: number; k?: string | null } | undefined>;
declare const ORD_SRV: Record<string, ((index: number, name: string) => string | null) | undefined>;
declare const ORD_MEM: Record<string, { fn: string; campos: readonly (string | ((row: Record<string, unknown>) => unknown))[] } | undefined>;
declare const HT_ESTADO: Record<string, { texto?: string; facetas?: Record<string, string>; rangos?: Record<string, { k?: string; d?: string | number | null; h?: string | number | null }> } | undefined>;
