// Legacy globals Facturación uses (src/app/screens/billing): the PDF, the email, the fiscal data, the log and the tab bar stay in legacy.

declare function cargarFacturacion(): Promise<void>;
declare function verFactura(id: string): Promise<void>;
declare function facConsulta(): boolean;
declare function pintarEmpresa(): Promise<void>;
declare function pintarRegistro(): Promise<void>;
declare function enviarFacturaEmail(invoice: object, rectifies: string | null | undefined): Promise<void>;
