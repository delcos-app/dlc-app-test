// Legacy names of the Rutas planner, today's map and the Agenda traffic (src/app/screens/routes, agenda; v2.418.0).
interface RouteAppointment { id: string; cuenta_id?: string; estado: string; fecha?: string | null; hora?: string | null; dias?: Record<string, string | null> | null; lat?: number | string | null; lon?: number | string | null; centro_nombre?: string | null; nombre?: string | null; usuario_id?: string | null; salida?: string | null; vuelta?: string | null }
interface RealTraffic { k: string; mapa: Map<string, number>; t: number }
interface RoutesFunctionError { context?: { status?: number; json?(): Promise<unknown> } }
interface LegacyDb { readonly functions: { invoke<T>(name: string, options: { body: unknown }): Promise<{ data: T | null; error: RoutesFunctionError | null }> } }
interface SavedRoute { tipo?: string | null; desde?: string | null; usuario_id?: string | null; visible_para?: string | null }
interface StreetRoute { retraso_min?: number }
interface RouteMap { jumpTo(options: { center: [number, number]; zoom: number }): void }
interface Leaflet { marker(point: [number, number], options: Record<string, unknown>): LeafletLayer; divIcon(options: Record<string, unknown>): unknown; polyline(points: [number, number][], options: Record<string, unknown>): LeafletLayer }

declare const RM_MEM: Map<string, { t: number; r: StreetRoute }>;

declare const DIAN: Readonly<Record<string, string | undefined>>;
declare function xyCita(item: object): [number, number] | null;
declare function citaHecha(state: string): boolean;
declare function horDeCitas(list: readonly object[]): { salida: string | null; vuelta: string | null } | null;
declare function tdClaveXY(from: unknown, to: unknown): string;
declare function tdRealVigente(): boolean;
declare function rutasMapa(): Promise<void>;
