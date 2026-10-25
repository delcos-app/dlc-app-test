// Legacy names the last migrated pieces read (src/app/legacy/leftovers-bridge.ts; v2.427.0).
declare const TIPOS_CAMPO: readonly (readonly [string, string])[];
declare const PAG_GUARDA_RE: RegExp;
declare const PAG_GUARDA_NO: string;
declare let PAG_CLAVE: string;
declare const RE_ICO: RegExp;
declare function icono(name: string): string;
declare const FAC_CONFIG: readonly (readonly [string, string])[];
declare const NOMBRES_DETALLE: Readonly<Record<string, string>>;
declare let PED_PRECIOS: { cuenta: string | null; precios: Record<string, unknown> };
declare function editorFrecuencia(): unknown;
