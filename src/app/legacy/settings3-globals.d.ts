// Legacy names read by Configuración, third part (src/app/screens/settings/email, notifications, texts; v2.417.0).
declare const PROVEEDORES_CORREO: Readonly<Record<string, { n: string; host: string; puerto: number; seg: string; ayuda: string }>>;
declare const NOTIF_AREAS: readonly (readonly [string, string, readonly string[]])[];
declare const NOTIF_DIARIOS: readonly string[];

declare function menuNombres(): Record<string, string>;
declare const MENU_FUERA: readonly string[];

declare function montarMenuLateral(): void;
