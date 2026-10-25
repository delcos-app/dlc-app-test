// Legacy globals the visit windows use (src/app/screens/visit): the open visit and the presentation material stay in legacy.
interface VisitPhoto { nombre: string; tipo: string; tamano: number; datos: string }
interface SampleItem { producto_id: string; unidades: number; max: number }
interface SignaturePad { borrar(): void; vacia(): boolean; imagen(): string | null }
interface VisitDraft { id: string; modo: string; fotos: VisitPhoto[]; productos?: string[]; muestras?: { items(): SampleItem[]; firmante(): string; firma(): string | null; validar(): string | null } }
interface PresentationMaterial { id: string; producto_id: string; nombre: string; tipo: string; orden?: number | null; para_portal?: boolean | null }
declare let VISITA_ACTUAL: VisitDraft | null;
declare let PRES_MAT: PresentationMaterial[] | null;
declare let PRES_T: number;
declare const PRES_DATOS: Map<string, string>;
declare const FOTOS_VISITA_MAX: number;
declare function guardarCache(key: string, data: unknown): void;
declare function leerCache(key: string): { t: number; d: unknown } | null;
declare function campoDato(value: object, key: string): string;
declare function padFirma(canvas: HTMLCanvasElement): SignaturePad;
declare function productosPromocionados(): Promise<{ id: string; nombre: string }[]>;
declare function leerJustificante(file: File): Promise<VisitPhoto | null>;
declare function clasNorm(text: string): string;
declare function hoyLetra(): string;
declare function cargarInicio(): Promise<void>;
