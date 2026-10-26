// Legacy globals of Duplicados, the centre sheet, «Cerca de mí» and the professional portal home (only names no other legacy/*.d.ts declares).
interface LegacyNearbyAccount { id: string; km: number | string; nombre: string; urgente?: boolean; sin_reporting?: boolean; especialidad?: string | null; centro_nombre?: string | null; municipio?: string | null; estado_comercial?: string | null }
interface LegacyNearbyResult { lista: LegacyNearbyAccount[]; pos: [number, number]; pagina?: number }
interface LegacyHiddenAlert { clave: string; detalle?: string | null; titulo?: string | null; hasta?: string | null }

declare const DIAS_SEM: readonly (readonly [string, string])[];

declare function claveAlerta(title: string, item: Element): string;
declare function tarjetaComision(): Promise<unknown>;
declare function itemHTML(id: string, icon: string, kind: string, name: string, detail: string): string;
