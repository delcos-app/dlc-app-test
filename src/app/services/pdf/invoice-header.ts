/**
 * The top of the invoice PDF: logo, title and number, the company (optional), the dates and the customer. Part of the legacy
 * facturaPDFBase (v2.427.0).
 */
import { billing2Legacy } from '../../legacy/billing2-bridge';
import { t } from '../../i18n';
import { appName } from '../../core/utilities';
import { orFallback } from '../values';
import type { InvoiceDesign } from './design';
import type { PdfDocument, Rgb } from './document';

export interface PdfParty { razon_social?: string | null | undefined; nombre?: string | null | undefined; nif?: string | null | undefined; direccion?: string | null | undefined; cp?: string | null | undefined; municipio?: string | null | undefined; provincia?: string | null | undefined; pais?: string | null | undefined; telefono?: string | null | undefined; email?: string | null | undefined; web?: string | null | undefined; iban?: string | null | undefined; pie?: string | null | undefined }
export interface PdfLine { descripcion?: string | null; precio?: number | null; unidades?: number | null; base?: number | null; iva?: number | null }
export interface PdfInvoice {
  numero?: string | null; fecha?: string | null; vencimiento?: string | null; emisor?: PdfParty | null; cliente?: PdfParty | null; forma_pago?: string | null;
  lineas?: PdfLine[] | null; base?: number | null; desglose_iva?: { iva: number; cuota?: number | null }[] | null; total?: number | null;
  rectifica_id?: string | null; motivo_rectificacion?: string | null; verifactu?: { activo?: boolean } | null; qr_url?: string | null;
}

/** What every part of the drawing shares. */
export interface Drawing {
  doc: PdfDocument; design: InvoiceDesign; font: string; accent: Rgb; company: PdfParty; customer: PdfParty;
  logoLeft: boolean; logoSize: number;
}

export const GREY: Rgb = [110, 118, 126], BLACK: Rgb = [28, 39, 51], LIGHT: Rgb = [238, 240, 242];
const LOGO_SIZES: Readonly<Record<string, number>> = { s: 22, m: 34, l: 44 };
const LOGO_TOP = 19, LEFT = 18, RIGHT = 192, TITLE_Y = 36, NUMBER_Y = 44, LINE_GAP = 4.6, COMPANY_GAP = 4.2;

export const logoSizeOf = (design: InvoiceDesign): number => LOGO_SIZES[design.logoTam] ?? LOGO_SIZES.m ?? 0;

/** 2024-05-31 → 31/05/2024. */
export const dmy = (isoDate: string | null | undefined): string => (isoDate ? isoDate.split('-').reverse().join('/') : '');

/** 1234.5 → «1.234,50€». */
export const pdfEuros = (value: unknown): string =>
  `${(Math.round((Number(value) || 0) * 100) / 100).toLocaleString(t('dates.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€`;

export const documentTitle = (design: InvoiceDesign): string => orFallback(design.titulo, t('billingMore.pdf.title'));

export const companyName = (company: PdfParty): string => orFallback(company.razon_social, appName());

export async function drawLogo(drawing: Drawing): Promise<void> {
  const { doc, design, logoLeft, logoSize: size } = drawing;
  if (!design.logo) return;
  const logo = await billing2Legacy.logo(), x = logoLeft ? 17 : RIGHT - size;
  if (logo && billing2Legacy.roundLogo()) { doc.addImage(logo, 'PNG', x, LOGO_TOP, size, size); return; }
  if (!logo) return;
  doc.setFillColor(236, 240, 245); doc.circle(x + size / 2, LOGO_TOP + size / 2, size / 2 - 2, 'F');
  doc.addImage(logo, 'PNG', x + size * 0.16, LOGO_TOP + size * 0.37, size * 0.68, size * 0.27);
}

export function drawTitle(drawing: Drawing, invoice: PdfInvoice): void {
  const { doc, font, accent, logoLeft } = drawing, x = logoLeft ? RIGHT : LEFT, align = logoLeft ? 'right' : 'left';
  doc.setFont(font, 'normal'); doc.setTextColor(...accent); doc.setFontSize(invoice.rectifica_id ? 22 : 28);
  doc.text(invoice.rectifica_id ? documentTitle(drawing.design) + t('billingMore.pdf.rectifying') : documentTitle(drawing.design), x, TITLE_Y, { align });
  doc.setFontSize(14); doc.setTextColor(...GREY); doc.text(invoice.numero ?? '', x, NUMBER_Y, { align });
}

/** The company in the header (optional); returns where it starts. */
export function drawCompanyHeader(drawing: Drawing): number {
  const { doc, design, font, company, logoLeft } = drawing, top = LOGO_TOP + (design.logo ? drawing.logoSize : 0) + 6;
  if (!design.empresaCab) return top;
  const x = logoLeft ? LEFT : RIGHT, align = logoLeft ? 'left' : 'right';
  doc.setFontSize(8.8); doc.setTextColor(...BLACK); doc.setFont(font, 'bold');
  doc.text(companyName(company), x, top, { align }); doc.setFont(font, 'normal'); doc.setTextColor(...GREY);
  [company.nif ? t('billingMore.pdf.taxId', { id: company.nif }) : '', [company.direccion, [company.cp, company.municipio].filter(Boolean).join(' ')].filter(Boolean).join(', '),
    [company.telefono, company.email].filter(Boolean).join(' · ')].filter(Boolean)
    .forEach((text, index) => { doc.text(text, x, top + COMPANY_GAP * (index + 1), { align }); });
  return top;
}

const customerAddress = (customer: PdfParty): string[] => [customer.direccion,
  [customer.municipio, customer.cp ? `(${customer.cp})` : '', customer.provincia, customer.pais].filter(Boolean).join(', ').replace(', (', ' (')]
  .filter((text): text is string => Boolean(text));

function labelled(drawing: Drawing, label: string, value: string, at: readonly [number, number]): void {
  const { doc } = drawing, [x, y] = at;
  doc.setTextColor(...GREY); doc.text(label, x, y); doc.setTextColor(...BLACK); doc.text(value, x + doc.getTextWidth(label) + 2, y);
}

function drawDates(drawing: Drawing, invoice: PdfInvoice, x: number, y: number): void {
  const { doc, design } = drawing, address = customerAddress(drawing.customer);
  labelled(drawing, t('billingMore.pdf.date'), dmy(invoice.fecha), [x, y]);
  if (design.vencimiento && !invoice.rectifica_id) labelled(drawing, t('billingMore.pdf.dueDate'), dmy(invoice.vencimiento), [x, y + LINE_GAP]);
  if (design.direccion && address.length) {
    labelled(drawing, t('billingMore.pdf.reference'), address[0] ?? '', [x, y + 13.8]);
    if (address[1]) { doc.setTextColor(...BLACK); doc.text(address[1], x, y + 18.4); }
  }
}

/** The dates and the customer; returns the height reached. */
export function drawDatesAndCustomer(drawing: Drawing, invoice: PdfInvoice, rectifies: string, companyTop: number): number {
  const { doc, design, font, customer } = drawing;
  doc.setFontSize(9.5);
  const y = design.empresaCab ? Math.max(76, companyTop + 20) : 70, customerRight = design.clientePos !== 'izq';
  const datesX = customerRight ? LEFT : 110, customerX = customerRight ? 110 : LEFT;
  drawDates(drawing, invoice, datesX, y);
  if (invoice.rectifica_id) {
    doc.setTextColor(...GREY);
    doc.text(t('billingMore.pdf.rectifies', { number: rectifies }) + (invoice.motivo_rectificacion ? ` · ${invoice.motivo_rectificacion}` : ''), datesX, y + 9.2);
  }
  doc.setFont(font, 'bold'); doc.setTextColor(...BLACK); doc.text(customer.nombre ?? '', customerX, y); doc.setFont(font, 'normal');
  [customer.nif, ...customerAddress(customer), customer.email].filter(Boolean)
    .forEach((text, index) => { doc.text(String(text), customerX, y + LINE_GAP * (index + 1)); });
  return y;
}
