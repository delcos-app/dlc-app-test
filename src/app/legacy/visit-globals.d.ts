// Legacy globals the visit windows use (src/app/screens/visit): the open visit and the presentation material stay in legacy.
interface VisitPhoto { nombre: string; tipo: string; tamano: number; datos: string }
interface SampleItem { producto_id: string; unidades: number; max: number }
interface SignaturePad { borrar(): void; vacia(): boolean; imagen(): string | null }
interface VisitDraft { id: string; modo: string; fotos: VisitPhoto[]; productos?: string[]; muestras?: { items(): SampleItem[]; firmante(): string; firma(): string | null; validar(): string | null } }
interface PresentationMaterial { id: string; producto_id: string; nombre: string; tipo: string; orden?: number | null; para_portal?: boolean | null }

declare const PRES_DATOS: Map<string, string>;
declare const FOTOS_VISITA_MAX: number;
declare function cargarInicio(): Promise<void>;
