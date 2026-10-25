// Legacy names the invoice PDF, issuing invoices and the product editor read (v2.427.0).
declare function logoData(): Promise<string | null>;
declare let LOGO_CIRC: boolean;
declare function RPC_V2342<T>(name: string, params: Record<string, unknown>): PromiseLike<LegacyResult<T>>;
declare let PDF_ELEGIDO: string | null;
declare function idPlant(): string;
declare let ESTADO_PROD: Record<string, string>;
declare let PROMO_PRODS: { id: string; nombre: string }[] | null;
declare const PROD_USOS: Readonly<Record<string, string>>;
declare const PRES_MAX: number;
