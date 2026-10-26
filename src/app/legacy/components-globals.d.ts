// ---- Componentes compartidos (src/app/components, v2.416.0): lo que todavía leen de legacy

declare function colocarPop(popup: HTMLElement, anchor: Element): void;
declare function emitir(input: HTMLInputElement): void;

declare function ES_IVA(input: HTMLInputElement): boolean;
declare const PANTALLA_TACTIL: boolean;
declare function LETRA_DIA(isoDate: string): string;

declare function prefsActivas(): { salida?: unknown };
declare const ANCLAS_AYUDA: [string, string][];
declare const MANUAL_ANCLA: Record<string, string | undefined>;
declare function htLateralAbierto(): boolean;
declare function listaPedidos(): Promise<void>;
declare function pintarProductos(): Promise<void>;
