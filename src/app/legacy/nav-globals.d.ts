// Legacy names the navigation core reads (src/app/core/navigation, core/startup; v2.426.0).
declare function pendientesDesde(since: number): number;

declare function mostrarApp(profile: unknown): void;
declare const PANEL_DESC: Readonly<Record<string, string | undefined>>;
declare const LISTA_ESPERA: Readonly<Record<string, number | undefined>>;
declare const PL_SECC: Readonly<Record<string, (() => unknown) | undefined>>;
declare const BLQ: Readonly<Record<string, unknown>>;
