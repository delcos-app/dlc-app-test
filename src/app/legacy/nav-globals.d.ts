// Legacy names the navigation core reads (src/app/core/navigation, core/startup; v2.426.0).
declare function pendientesDesde(since: number): number;
declare let ROLES_DEF: readonly unknown[];
declare function mostrarApp(profile: unknown): void;
declare function mostrarLogin(message?: string): void;
declare function suplantando(): { nombre: string; access_token: string; refresh_token: string } | null;
declare const PANEL_DESC: Readonly<Record<string, string | undefined>>;
declare const LISTA_ESPERA: Readonly<Record<string, number | undefined>>;
declare const PL_SECC: Readonly<Record<string, (() => unknown) | undefined>>;
declare function plCfg(screen: string): unknown;
declare const BLQ: Readonly<Record<string, unknown>>;
declare function PLAN_NOMBRE(): string;
declare function abrirMasMovilBase(): void;
