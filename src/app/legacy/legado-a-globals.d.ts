// Legacy names that what legado 000–024 moved to src/app still reads (v2.424.0).
declare function pantallaRecuperacion(): void;
declare let temporizador: ReturnType<typeof setTimeout> | undefined;
declare function cerrarSelector(): void;
declare function arrancar(): unknown;
declare function abrirEditor(id: string | null, kind?: string): unknown;
declare const RPC_TTL: Record<string, number | undefined>;

declare function veVentas(): unknown;
declare function rutaActiva(): unknown;
declare function respuestaConClavesAntiguas(url: string, response: Response): Promise<Response>;
declare function rcLS(key: string): string;
declare function rcCopia<T>(answer: T): T;
declare function puedeModuloV2400(screen: string): boolean;
declare function planificar(route: string, button: HTMLElement | null): unknown;
declare let pintarFranjaPruebas: () => unknown;
declare function pintarConexion(): void;
declare function pintarComisiones(): unknown;
declare function iconosMenu(): void;
declare function hm(minutes: number): string;
declare function fichaNueva(): { nombre: string };
declare function editarUsuario(id: string): unknown;
declare function cercaDeMi(button: HTMLElement): unknown;
declare function cargarPacientes(): unknown;
declare function cargarAnalitica(): unknown;
declare function alternarUrgente(id: string, isUrgent: boolean): unknown;
declare function agRefrescoQuieto(): void;
declare function accesoSinActivar(message: string): void;
declare function abrirKpis(): unknown;
declare function abrirHerramientas(context: string): void;
declare const RPC_ESCRITURA: RegExp;
declare let RECUPERANDO: boolean;
declare function PLANCFG(): unknown;
declare const PERIODOS: readonly (readonly [string, string])[];

declare function FROM_ORIG(table: string): unknown;
declare const CFG_ADMIN: Readonly<Record<string, string | undefined>>;
interface LegacyAuth { signInWithPassword(credentials: { email: string; password: string }): Promise<{ error: LegacyAuthError | null }>; signOut(): Promise<unknown>; updateUser(values: { password: string }): Promise<{ error: LegacyAuthError | null }>; onAuthStateChange(handler: (event: string) => void): unknown }
