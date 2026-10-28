// Legacy globals used by Portal del profesional y del centro (src/app/screens/portal).
interface PdfDesign { cols: Record<string, unknown>; [key: string]: unknown }
declare const PDF_DEF: PdfDesign;
declare function nombrePDF(invoice: object): string;

declare const NOMBRE_ESTADO_CENTRO: Record<string, string>;
