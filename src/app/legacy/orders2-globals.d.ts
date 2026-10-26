// ---- Rest of Pedidos (src/app/screens/orders: editor, tpv, subscription, cards; v2.417.0): what it still reads from legacy
declare function opcionesProducto(id: string | null | undefined, name: string | null | undefined): string;
declare function conPrecioContrato<T>(product: T): T;
declare function subirJustificantes(id: string, list: readonly { nombre: string }[]): Promise<boolean>;

declare const TPV_VISIBLE: boolean;
declare function conCarga<T>(button: HTMLElement | null, text: string, work: () => Promise<T>): Promise<T>;
declare function esBajada(from: Record<string, unknown>, to: Record<string, unknown>): boolean;
declare const PUESTA_EN_MARCHA: number;
declare const PAGO_PLANES: readonly string[];
declare function pagoPortal(button: HTMLElement): Promise<void>;
declare function diasHasta(isoDate: unknown): number | null;
declare function isoMas(isoDate: string, days: number): string;
declare const KPI_DEF: readonly string[];
declare function guardarKpis(list: readonly Record<string, unknown>[]): Promise<boolean>;
declare const ES_IMPORTE: RegExp;
