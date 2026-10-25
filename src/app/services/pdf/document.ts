/**
 * jsPDF, loaded on demand, and the shapes the invoice PDF uses. Migrated from the legacy cargarJsPDF and nombrePDF (v2.427.0); both
 * names stay as adapters (Pedidos, the portal and the tests use them: a test replaces jsPDF's save).
 */
import { t } from '../../i18n';
import { orFallback } from '../values';

export type Rgb = readonly number[];
export interface TextOptions { align?: 'left' | 'right' | 'center' }
/** The jsPDF methods the invoice uses. */
export interface PdfDocument {
  setFont(font: string, style: string): void;
  setFontSize(size: number): void;
  setTextColor(...rgb: number[]): void;
  setFillColor(...rgb: number[]): void;
  setDrawColor(...rgb: number[]): void;
  text(text: string | string[], x: number, y: number, options?: TextOptions): void;
  getTextWidth(text: string): number;
  splitTextToSize(text: string, width: number): string[];
  addImage(...args: unknown[]): void;
  circle(x: number, y: number, radius: number, style: string): void;
  rect(x: number, y: number, width: number, height: number, style?: string): void;
  line(x1: number, y1: number, x2: number, y2: number): void;
  addPage(): void;
  getNumberOfPages(): number;
  setPage(page: number): void;
  output(kind: 'blob'): Blob;
  output(kind: string): string;
  save(name: string): void;
}
export type PdfConstructor = new (options: { unit: string; format: string }) => PdfDocument;

interface PdfWindow { jspdf?: { jsPDF: PdfConstructor } }

/** jsPDF's class, loading the library the first time. */
export async function loadJsPdf(): Promise<PdfConstructor> {
  const found = (window as unknown as PdfWindow).jspdf;
  if (found) return found.jsPDF;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = new URL('jspdf.umd.min.js', location.href).href;
    script.onload = (): void => { resolve(); };
    script.onerror = (): void => { reject(new Error('jspdf')); };
    document.head.appendChild(script);
  });
  const loaded = (window as unknown as PdfWindow).jspdf;
  if (!loaded) throw new Error('jspdf');
  return loaded.jsPDF;
}

/** «F260001_Nombre_del_cliente.pdf». */
export const pdfFileName = (invoice: { numero?: string | null | undefined; cliente?: { nombre?: string | null | undefined } | null | undefined }): string =>
  `${String(invoice.numero)}_${orFallback(invoice.cliente?.nombre, t('billingMore.pdf.defaultCustomer')).replace(/[^\p{L}\p{N} ]/gu, '').trim().replace(/\s+/g, '_')}.pdf`;
