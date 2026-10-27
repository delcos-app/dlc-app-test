// ---- Configuración, part 1 (src/app/screens/settings): what its sections still read from legacy
interface CustomField { en_ficha?: boolean | null; obligatorio?: boolean | null }
interface Classifier { id: string; nombre: string; grupo?: string | null; descripcion?: string | null; sistema?: boolean | null; n_activos: number; valores?: { valor: string; activo?: boolean | null }[] | null }

declare const CAMPO_TABLA: Readonly<Record<string, string>>;
declare const ICO_MOD: Readonly<Record<string, string | undefined>>;
declare const MOTIVO_REFRESCO: Readonly<Record<string, string | undefined>>;
declare const RPC_ORIG_FROM: <T>(table: string) => LegacyQuery<T>;
declare const deshacible: (entry: object) => boolean;
declare function cajaDeshacerPersona(box: HTMLElement | null, userId: string, from: string | null, name: string, then: () => void): void;
