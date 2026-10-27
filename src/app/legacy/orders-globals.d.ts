// ---- Pedidos (src/app/screens/orders): the order editor, the card payment (TPV), invoices, custom fields and mail templates stay in legacy
declare function estable(element: Element | null, maxMs?: number): Promise<void>;

declare let PEDSEC_CARGA: string | null;
declare const TITULO_PEDSEC: Readonly<Record<string, readonly [string, string]>>;

declare function pintarSinAtribuir(): Promise<void>;

declare function plantillaCorreo(kind: string, field: string, values: Record<string, unknown>): string;
declare function varsCorreo(values: object): Record<string, unknown>;
declare function camposGuardar(read: { falta: string[] } | null, id: string): Promise<boolean>;
