// Legacy globals used by Portal del profesional y del centro (src/app/screens/portal).
interface PdfDesign { cols: Record<string, unknown>; [key: string]: unknown }
declare const PDF_DEF: PdfDesign;
declare function facturaPDF(invoice: object, rectifies: string, design: object): Promise<{ save: (name: string) => void }>;
declare function nombrePDF(invoice: object): string;
declare function svgDonut(items: { n: string; v: number }[]): string;
declare function mesesEntre(from: string, to: string): string[];
declare function skelCard(title: string): string;

declare const NOMBRE_ESTADO_CENTRO: Record<string, string>;
