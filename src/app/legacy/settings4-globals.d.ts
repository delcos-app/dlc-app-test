// Legacy names read by Configuración, fourth part (src/app/screens/settings/users, profile, plan; v2.420.0).
declare let USR_ACC: Record<string, unknown> | null;
declare const NIVELES: readonly string[];
declare const MOD_PLAN: readonly (readonly [string, string, string])[];
declare function PLAN_FILAS(): readonly unknown[];
declare const PRESU_NECESITA: readonly (readonly [string, string])[];
declare const PRESU_CUANDO: readonly string[];
declare const PRESU_ESTADO: Readonly<Record<string, string | undefined>>;
declare const PLAN_EXTRAS: Readonly<Record<string, readonly string[]>>;
declare function ivaDe(amount: number): number;
declare function esInvitado(user: object): boolean;
declare function queVeInvitado(user: object): string;
declare function entrarComo(id: string): Promise<void>;
declare let PROV_CCAA: Record<string, unknown> | null;
declare const IDIOMAS: readonly (readonly [string, string])[];
declare let IDIOMA: string;
declare function aplicarIdioma(id: string): void;
declare function pintarUsuarios2(): Promise<void>;
