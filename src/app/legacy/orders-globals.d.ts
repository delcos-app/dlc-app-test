// ---- Pedidos (src/app/screens/orders): the order editor, the card payment (TPV), invoices, custom fields and mail templates stay in legacy
declare function cobroDe(order: object): string;
declare function etiquetaCanal(order: object, total: number | null | undefined): string;
declare function estable(element: Element | null, maxMs?: number): Promise<void>;
declare function pedidoFacturas(id: string): Promise<void>;

declare let PEDSEC_CARGA: string | null;
declare const TITULO_PEDSEC: Readonly<Record<string, readonly [string, string]>>;

declare function pintarSinAtribuir(): Promise<void>;

declare function elegirPlantillaCorreo(kind: string): Promise<boolean>;
declare function plantillaCorreo(kind: string, field: string, values: Record<string, unknown>): string;
declare function varsCorreo(values: object): Record<string, unknown>;
declare function guardarPrefsAvisos(alerts: Record<string, boolean>): Promise<boolean>;
declare function rolesNombres(): string[];
declare function camposLeer(root: Element | null): { falta: string[] } | null;
declare function camposGuardar(read: { falta: string[] } | null, id: string): Promise<boolean>;
