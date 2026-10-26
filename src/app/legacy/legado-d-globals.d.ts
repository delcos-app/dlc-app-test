// Legacy names the folded layers 080–161 read through legado-d-bridge.ts and legado-d-glue-bridge.ts (v2.424.0).
interface LegacyQuery<T> { not(column: string, operator: string, value: unknown): LegacyQuery<T> }
declare function pintarPerfil(): unknown;
declare function pintarNotif(): unknown;
declare function pintarDistribuidores(): unknown;
declare function pintarEstadosPapel(): unknown;
declare function pintarTpv(): unknown;
declare function pintarCfgPruebas(): unknown;
declare const MENU_GRUPOS: { id: string; items: string[] }[];
declare function pintarConcursos(view: string): unknown;
declare function candadoSecciones(): void;
declare const TIPOS_NOTIF: [string, string, string, string][];
declare const EXPLICA_NOTIF: Record<string, [string, string]>;
declare function abrirManual(anchor: string): void;
declare function aplicarPermisosMenuBase9(...args: unknown[]): unknown;
declare function cargarAdminBase(...args: unknown[]): unknown;
declare const CFG_PULIR: string[];

declare function congelar(element: HTMLElement | null): void;
declare function cfgSecDespertar(section: HTMLElement): unknown;
declare function cfgClonarEstilos(): unknown;
declare function pagActual(): { cuerpo: HTMLElement } | null;
declare const PAG_NO_CAMBIA: string;
declare function pagBloque(element: Element, body: HTMLElement): Element;

declare const PAG_GUARDA: readonly { tab: string }[];
declare function pagPonerGuardar(): void;
declare function fichaCentro(id: string): Promise<void>;

declare const VISTA_TITULO: Readonly<Record<string, string>>;

declare function vistaIgual(first: unknown, second: unknown): boolean;
declare function vistaDlg(): HTMLDialogElement | null;
declare function vistaBoton(view: unknown, dialog?: HTMLDialogElement): void;

declare function esBotonGuardar(button: HTMLButtonElement | null): unknown;
declare function subirAviso(): void;
declare function ordMemOrdenar(kind: string, rows: unknown[]): unknown[];
declare function refrescarDebajo(): void;

declare function listaPDF(): { lista: { id: string; cfg?: unknown }[]; defecto: string };
declare function guardarPDFPlantillas(templates: { lista: unknown[]; defecto: string }): Promise<boolean>;
declare function htMarcarCabecera(grid: Element): void;
declare function htTipo(grid: Element): string;
declare function htCeldaNoOrdenable(name: string): unknown;
declare function htGuardarOrden(): void;
declare function htOrdenarFilas(grid: Element): void;
declare function htQuitarOrden(grid: Element): void;
declare function num(value: unknown): string;
declare const BAJA_QUE: Record<string, string | undefined>;
declare function bajaCuenta(id: string, away: boolean): Promise<unknown>;
declare function bajaCliente(id: string, away: boolean): Promise<unknown>;
declare function refrescarProductos(): Promise<void>;
declare function cerrarMesCinta(): void;
declare function verCita(appointment: unknown): unknown;
declare function estimarDiaBase2(appointments: unknown, isoDate: string, ...rest: unknown[]): unknown;
declare function tdRutaDia(appointments: unknown, isoDate: string): { k: string } | null;
declare function tdPonerReal(route: { k: string }, result: unknown): unknown;
declare function alternarUrgenteBase(id: string, ...rest: unknown[]): Promise<unknown>;

declare function aplicarEtiquetaBase(...args: unknown[]): unknown;
declare const LISTA_PARA: Record<string, ((section: HTMLElement) => boolean) | undefined>;
declare function inicioCabecera(): void;
declare function pintarBnavBase3(...args: unknown[]): unknown;
declare function medirBnav(): void;
declare function anclaAyuda(button: HTMLElement): string;
declare function filtroGuardar(event: Event): void;
declare function montarPeriodoBase(element: HTMLElement | null, ...rest: unknown[]): unknown;
declare function filtrosRestaurar(root: HTMLElement | null): void;
declare function sinCargoP(order: unknown, total: unknown): unknown;
declare function pillPaso(order: unknown): string;

declare function fabAOrdenador(): void;
declare function plSync(screen: string): void;
declare function pintarConexionBase(...args: unknown[]): unknown;
declare function colaGuardar(queue: unknown[]): void;
declare const COLA_KO: string;

declare function ojoClave(input: HTMLInputElement): void;
declare function comprobarAcceso(force?: boolean): Promise<void>;
declare function avisosEnVivo(): void;
declare const ENLACE_ERROR: string | null;
