// Legacy globals Rutas uses (src/app/screens/routes): the planner, the day map and the route being edited stay in legacy.
interface RouteRepeat { tipo: string; dia?: string; fecha?: string; desde?: string; hasta?: string; semana?: number }
interface RouteMember { id: string; nombre: string; lat?: number | string | null; lon?: number | string | null; dias?: Record<string, string | null> | null; centro_nombre?: string | null; municipio?: string | null; urgente?: boolean | null; estado_comercial?: string | null }
interface SavedRoute { id: string; nombre: string; repeticion?: RouteRepeat | null; salida?: string | null; vuelta?: string | null; fijas?: Record<string, string> | null; centros?: unknown[] | null; codigos?: string[] | null; reglas?: unknown; dinamica?: boolean | null; mia?: boolean | null; duenyo?: string | null }
interface RouteCard { r: SavedRoute; ms: RouteMember[] }
interface RouteDraft { id: string | null; nombre: string; auto: boolean; ms: RouteMember[]; rep: RouteRepeat | null; salida: string; vuelta: string; fijas: Record<string, string>; ordenManual: boolean; paso: number; centros: unknown[]; q: string; fil: Record<string, boolean>; res: RouteMember[]; mapa: null; sinCartera?: boolean }
interface PlanItem { id: string; ref: RouteMember; xy: [number, number] | null; ventanas: [number, number][] | null; fija: null }
interface PlanSettings { visita: number; parada: number; salida: string; tope: string; conSalida: boolean; conTope: boolean }
interface PlanStart { nombre?: string; lat?: number | string | null; lon?: number | string | null; falta?: boolean }
interface StreetRoute { ok: boolean; motivo?: string; km?: number; min?: number; tramos?: { linea?: [number, number][]; min: number; km: number }[] }
interface MapMarker { setLngLat(point: [number, number]): MapMarker; addTo(map: RouteMap): MapMarker; remove(): void }
interface MapLayerEvent { features?: { properties: { id?: string } }[] }
interface RouteMap {
  style?: unknown; touchZoomRotate: { disableRotation(): void }; __mk: MapMarker[]; __listo?: boolean; __ya?: boolean; __ml?: MapLibrary;
  addControl(control: unknown, position: string): void; remove(): void; getContainer(): HTMLElement; getCanvas(): HTMLCanvasElement;
  on(type: string, handler: () => void): void;
  on(type: string, layer: string, handler: (event: MapLayerEvent) => void): void;
  once(type: string, handler: () => void): void;
  getStyle(): { layers?: { id: string; type: string }[] }; setPaintProperty(id: string, key: string, value: unknown): void; setLayoutProperty(id: string, key: string, value: unknown): void;
  getSource(id: string): { setData(data: unknown): void } | undefined; addSource(id: string, source: Record<string, unknown>): void; getLayer(id: string): unknown; addLayer(layer: Record<string, unknown>): void;
  fitBounds(bounds: [[number, number], [number, number]], options: Record<string, unknown>): void;
}
interface MapLibrary { Map: new (options: Record<string, unknown>) => RouteMap; NavigationControl: new (options: Record<string, unknown>) => unknown; Marker: new (options: Record<string, unknown>) => MapMarker }
type PendingMap = Promise<void> & { el?: HTMLElement };
declare let RN: RouteDraft | null;
declare let RN_LISTA: RouteCard[] | null;
declare let RN_MAPA_P: PendingMap | null;
declare let RM_MAPA: RouteMap | null;
declare let RUTAS: SavedRoute[];
declare function salidaUsuario(): PlanStart;
declare function minHora(time: string | null | undefined): number | null;
declare function minutosEntre(from: [number, number], to: [number, number]): number;
declare function siguienteLaborable(): string;
declare function mejorarCampos(root: Element): void;
declare function pedirCampo(title: string, type: string, value: string, label: string): Promise<string | null>;
declare function bloqueadosSemana(from: string, to: string): Promise<Record<string, string>>;
