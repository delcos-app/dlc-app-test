// Legacy names the core services read (src/app/core, src/app/services; v2.425.0).
declare const ESTADO_MOD: Record<string, (() => unknown) | undefined>;
declare const ES_ANDROID: boolean;
declare const SALUDOS: Readonly<Record<string, readonly string[]>>;

declare const SKEY: string;
declare const PKEY: string;

declare function muestraError(result: object): string;
