// Legacy names the «Filtros y columnas» panel and the Analítica page read (src/app/components/filters-panel, screens/analytics/page; v2.419.0).
declare let ANSEC: string;
declare let AN_REP: string;
declare const AN_SERIE: Map<string, Promise<Record<string, unknown>[]>>;
declare function panelColumnas(title: string, columns: { i: number; n: string; on: boolean; fija: boolean }[], onChange: (index: number, on: boolean) => void): void;
declare const HT_FILTROS: Record<string, string | undefined>;
