// Legacy names that what legado 000–024 moved to src/app still reads (v2.424.0).
declare let temporizador: ReturnType<typeof setTimeout> | undefined;
declare const RPC_TTL: Record<string, number | undefined>;

declare function veVentas(): unknown;
declare function rutaActiva(): unknown;
declare function respuestaConClavesAntiguas(url: string, response: Response): Promise<Response>;
declare function rcLS(key: string): string;
declare function rcCopia<T>(answer: T): T;
declare function puedeModuloV2400(screen: string): boolean;
declare let pintarFranjaPruebas: () => unknown;
declare const RPC_ESCRITURA: RegExp;
declare let RECUPERANDO: boolean;
declare const PERIODOS: readonly (readonly [string, string])[];

declare function FROM_ORIG(table: string): unknown;
declare const CFG_ADMIN: Readonly<Record<string, string | undefined>>;
interface LegacyAuth { signInWithPassword(credentials: { email: string; password: string }): Promise<{ error: LegacyAuthError | null }>; signOut(): Promise<unknown>; updateUser(values: { password: string }): Promise<{ error: LegacyAuthError | null }>; onAuthStateChange(handler: (event: string) => void): unknown }
