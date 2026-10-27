// ---- Configuración, segunda parte (src/app/screens/settings/more): catálogos, roles, marca y vocabulario siguen en legado
declare const PAPELES_ESTADO: readonly (readonly [string, string, string])[];
declare const AREAS: readonly (readonly [string, string])[];
declare const QUE_ABRE: Readonly<Record<string, string | undefined>>;
declare let MARCA: { nombre: string; logo: string | null };

declare const ETIQUETAS: readonly string[];

declare const TERMKEY: string;
declare function pmAyu(title: string, text: string): string;
