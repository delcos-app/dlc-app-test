/** What each list page tells the list bar (the «Lista» page model, v2.236.0). */

/** An indicator of the band: key, title, figure and the line under it. */
export interface Indicator { readonly k: string; readonly t: string; readonly n: number; readonly s: string }

/** The mobile card of a row: title, second line, the state on the right and an optional fourth line. */
export interface RowCard { readonly a: string; readonly b: string; readonly c: string; readonly d?: string }

/** A block page (Eventos, Intervenciones…): its cards become a table with one row per record. */
export interface BlockConfig {
  readonly attr: string;
  readonly que: string;
  readonly grupo: string;
  readonly def: string;
  readonly cols: readonly (readonly [string, string])[];
  readonly celdas: (row: HTMLElement) => string[];
}

/** One screen (or one section of a screen) with the list bar. The legacy names (que, nuevo…) stay: tests and legacy read them. */
export interface ListConfig {
  que: () => string;
  nuevo?: () => HTMLElement | null;
  textoNuevo?: () => string;
  cuerpo: () => HTMLElement | null;
  tabla: () => HTMLElement | null;
  pie: () => HTMLElement | null;
  cuenta: () => HTMLElement | null;
  conDatos: (element: Element) => boolean;
  /** Quick filters: the id (or selector) of their select and its name ('' = the label of the field) */
  rapidos: readonly (readonly [string, string])[];
  q: () => string;
  buscarQ: (value: string) => void;
  buscaTxt?: () => string;
  nKpis?: number;
  activos: () => number;
  quitar?: () => void;
  filtros: () => void;
  columnas: () => void;
  mapa: () => HTMLElement | null;
  mas: () => [string, string][];
  kpis: (() => Promise<Indicator[]>) | null;
  kpiFirma?: () => string;
  kpiOn: (key: string) => boolean;
  kpiPulsar: (key: string) => void;
  card: ((row: HTMLElement) => RowCard) | null;
  rejilla?: boolean;
  banda?: string;
  despues?: string;
  bloques?: BlockConfig;
}

/** A screen with several sections: one configuration per section. */
export type SectionConfigs = Record<string, ListConfig>;

export type ScreenConfig = ListConfig | SectionConfigs;
