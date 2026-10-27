// Legacy names the folded layers 080–161 read through legado-d-bridge.ts and legado-d-glue-bridge.ts (v2.424.0).
interface LegacyQuery<T> { not(column: string, operator: string, value: unknown): LegacyQuery<T> }
declare const MENU_GRUPOS: { id: string; items: string[] }[];
declare const TIPOS_NOTIF: [string, string, string, string][];
declare const EXPLICA_NOTIF: Record<string, [string, string]>;
declare function abrirManual(anchor: string): void;
declare function aplicarPermisosMenuBase9(...args: unknown[]): unknown;
declare const CFG_PULIR: string[];

declare function cfgClonarEstilos(): unknown;
declare const PAG_NO_CAMBIA: string;

declare const PAG_GUARDA: readonly { tab: string }[];
declare function fichaCentro(id: string): Promise<void>;

declare const VISTA_TITULO: Readonly<Record<string, string>>;

declare function vistaIgual(first: unknown, second: unknown): boolean;
declare function vistaDlg(): HTMLDialogElement | null;


declare function htGuardarOrden(): void;
declare function num(value: unknown): string;
declare const BAJA_QUE: Record<string, string | undefined>;
declare function refrescarProductos(): Promise<void>;
declare function cerrarMesCinta(): void;
declare function verCita(appointment: unknown): unknown;

declare const LISTA_PARA: Record<string, ((section: HTMLElement) => boolean) | undefined>;
declare function inicioCabecera(): void;

declare function plSync(screen: string): void;
declare const COLA_KO: string;

declare const ENLACE_ERROR: string | null;
