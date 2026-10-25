/**
 * The invoice PDF: lines with the chosen columns (and the product photo), totals, payment, the VeriFactu QR and the footer on every
 * page. Migrated from the legacy facturaPDFBase and facturaPDF (v2.427.0); facturaPDF stays as an adapter (the portal, the order
 * window and the email use it). With no design given, it uses the one chosen when downloading or sending (PDF_ELEGIDO).
 */
import { billing2Legacy } from '../../legacy/billing2-bridge';
import { t } from '../../i18n';
import { imageData, loadQr } from '../files';
import { orFallback, range } from '../values';
import { hexToRgb } from '../../core/utilities';
import { currentDesign, designOfTemplate, templateList, type InvoiceDesign } from './design';
import { loadJsPdf, type PdfDocument } from './document';
import {
  BLACK, companyName, drawCompanyHeader, drawDatesAndCustomer, drawLogo, drawTitle, GREY, LIGHT, logoSizeOf, pdfEuros,
  type Drawing, type PdfInvoice, type PdfLine,
} from './invoice-header';

type Column = readonly [keyof InvoiceDesign['cols'], string, (line: PdfLine) => string];
interface QrCode { addData(text: string): void; make(): void; getModuleCount(): number; isDark(row: number, column: number): boolean }

const PAGE_BOTTOM = 250, LEFT = 18, RIGHT = 192, ROW = 11, PHOTO_ROW = 20;

const columnsOf = (drawing: Drawing): Column[] => ([
  ['precio', t('billingMore.pdf.price'), line => pdfEuros(line.precio)],
  ['unidades', t('billingMore.pdf.units'), line => String(line.unidades)],
  ['subtotal', t('billingMore.pdf.subtotal'), line => pdfEuros(line.base)],
  ['iva', t('billingMore.pdf.vat'), line => `${Number(line.iva) || 0}%`],
  ['total', t('billingMore.pdf.total'), line => pdfEuros((Number(line.base) || 0) * (1 + (Number(line.iva) || 0) / 100))],
] as Column[]).filter(column => drawing.design.cols[column[0]]);

function tableHeader(drawing: Drawing, columns: readonly Column[], xs: readonly number[], y: number): void {
  const { doc, font, accent } = drawing, photos = drawing.design.fotos;
  doc.setFillColor(...LIGHT); doc.rect(photos ? 42 : LEFT, y, photos ? 150 : 174, ROW, 'F'); if (photos) doc.rect(LEFT, y, 22.5, ROW, 'F');
  doc.setFont(font, 'bold'); doc.setFontSize(8.8); doc.setTextColor(...accent);
  doc.text(t('billingMore.pdf.concept'), photos ? 46 : 20, y + 7); columns.forEach((column, index) => { doc.text(column[1], xs[index] ?? RIGHT, y + 7, { align: 'right' }); });
  doc.setFont(font, 'normal'); doc.setFontSize(9.5); doc.setTextColor(...BLACK);
}

async function photoOf(drawing: Drawing, line: PdfLine): Promise<string | null> {
  if (!drawing.design.fotos) return null;
  const description = (line.descripcion ?? '').toLowerCase();
  const product = description ? billing2Legacy.products().find(item => Boolean(item.nombre) && description.startsWith(item.nombre.toLowerCase())) : undefined;
  return product?.foto_url ? imageData(product.foto_url) : null;
}

/** The lines; returns the height reached. */
async function drawLines(drawing: Drawing, invoice: PdfInvoice, top: number): Promise<number> {
  const { doc } = drawing, columns = columnsOf(drawing), conceptX = drawing.design.fotos ? 46 : 20;
  const width = columns.length ? Math.min(28, 110 / columns.length) : 0, xs = range(columns.length).map(index => RIGHT - (columns.length - 1 - index) * width);
  tableHeader(drawing, columns, xs, top);
  const conceptWidth = (columns.length ? (xs[0] ?? RIGHT) - width : 190) - conceptX;
  let y = top + ROW;
  for (const line of invoice.lineas ?? []) {
    const image = await photoOf(drawing, line), height = image ? PHOTO_ROW : ROW;
    if (y + height > PAGE_BOTTOM) { doc.addPage(); y = 20; }
    if (image) { try { doc.addImage(image, 20, y + 3, 18, 13); } catch { /* an image jsPDF cannot read is left out */ } }
    const text = doc.splitTextToSize(line.descripcion ?? '', Math.max(30, conceptWidth));
    doc.text(text, conceptX, y + 7);
    columns.forEach((column, index) => { doc.text(column[2](line), xs[index] ?? RIGHT, y + 7, { align: 'right' }); });
    y += Math.max(height, 5 + text.length * 4.6);
    doc.setDrawColor(226, 230, 234); doc.line(LEFT, y, RIGHT, y);
  }
  return y;
}

function drawTotals(drawing: Drawing, invoice: PdfInvoice, start: number): number {
  const { doc, font, accent } = drawing;
  let y = start + 10;
  doc.setFontSize(9.5);
  const row = (label: string, value: string, strong = false): void => {
    doc.setTextColor(...GREY); doc.text(label, 150, y, { align: 'right' }); doc.setTextColor(...(strong ? accent : BLACK));
    doc.setFont(font, strong ? 'bold' : 'normal'); doc.text(value, 190, y, { align: 'right' }); doc.setFont(font, 'normal'); y += 7;
  };
  const vat = invoice.desglose_iva ?? [];
  row(t('billingMore.pdf.taxBase'), pdfEuros(invoice.base));
  vat.filter(item => Number(item.cuota)).forEach(item => { row(t('billingMore.pdf.vatRate', { rate: item.iva }), pdfEuros(item.cuota)); });
  if (!vat.some(item => Number(item.cuota))) row(t('billingMore.pdf.vatOnly'), pdfEuros(0));
  doc.setFillColor(...LIGHT); doc.rect(152, y - 5, 40, 9, 'F'); row(t('billingMore.pdf.totalRow'), pdfEuros(invoice.total), true);
  return y + 4;
}

function drawPayment(drawing: Drawing, invoice: PdfInvoice, y: number): void {
  const { doc, design, company } = drawing;
  if (!design.formaPago || !invoice.forma_pago) return;
  const label = t('billingMore.pdf.paymentMethod'), iban = design.iban && /transfer/i.test(invoice.forma_pago) && company.iban ? t('billingMore.pdf.iban', { iban: company.iban }) : '';
  doc.setTextColor(...GREY); doc.text(label, LEFT, y); doc.setTextColor(...BLACK);
  doc.text(invoice.forma_pago + iban, LEFT + doc.getTextWidth(label) + 1, y);
}

function drawModules(doc: PdfDocument, code: QrCode, at: readonly [number, number], cell: number): void {
  const count = code.getModuleCount(), [x, y] = at;
  for (let row = 0; row < count; row++) for (let column = 0; column < count; column++) if (code.isDark(row, column)) doc.rect(x + column * cell, y + row * cell, cell, cell, 'F');
}

/** The VeriFactu QR, compulsory when VeriFactu is on; only its place is chosen. */
async function drawQr(drawing: Drawing, invoice: PdfInvoice): Promise<void> {
  if (!invoice.verifactu?.activo || !invoice.qr_url) return;
  try {
    const { doc, font, logoLeft } = drawing, makeQr = await loadQr() as (type: number, level: string) => QrCode, code = makeQr(0, 'M');
    code.addData(invoice.qr_url); code.make();
    const count = code.getModuleCount(), cell = 26 / count, top = drawing.design.qrPos === 'arriba';
    const x = top && logoLeft ? 166 : LEFT, y = top ? 50 : 238;
    doc.setFillColor(0, 0, 0);
    drawModules(doc, code, [x, y], cell);
    const textX = top && logoLeft ? 164 : 48, align = top && logoLeft ? 'right' : 'left';
    doc.setFontSize(8.5); doc.setTextColor(...BLACK); doc.setFont(font, 'bold');
    doc.text(t('billingMore.pdf.verifactu'), textX, y + 10, { align }); doc.setFont(font, 'normal'); doc.setTextColor(...GREY);
    doc.text(t('billingMore.pdf.verifiable'), textX, y + 15, { align });
  } catch { /* without the QR library the invoice still downloads */ }
}

function drawFooter(drawing: Drawing): void {
  const { doc, design, font, accent, company } = drawing, pages = doc.getNumberOfPages();
  const address = [company.direccion, [company.cp, company.municipio].filter(Boolean).join(' '), orFallback(company.pais, t('billingMore.pdf.country'))].filter(Boolean).join(', ');
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page); doc.setDrawColor(...accent); doc.line(LEFT, 276, RIGHT, 276);
    doc.setFontSize(8.3); doc.setTextColor(...GREY); doc.setFont(font, 'normal');
    doc.text(t('billingMore.pdf.footer', { company: companyName(company), id: company.nif ?? '', address }), 105, 281, { align: 'center' });
    if (design.pieTel && company.telefono) doc.text(t('billingMore.pdf.customerService', { phone: company.telefono }), 105, 285, { align: 'center' });
    if (design.pieWeb && company.web) doc.text(company.web, 105, 289, { align: 'center' });
    if (design.pieTexto && company.pie) doc.text(doc.splitTextToSize(company.pie, 170), 105, 293, { align: 'center' });
    if (design.paginas) doc.text(`${page}/${pages}`, RIGHT, 289, { align: 'right' });
  }
}

/** The design to use: the given one, else the one chosen for this download or email, else the company's. */
function designFor(given: InvoiceDesign | null | undefined): InvoiceDesign {
  if (given) return given;
  const chosen = billing2Legacy.pdfChosen();
  return chosen && chosen !== templateList().defecto ? designOfTemplate(chosen) : currentDesign();
}

export async function invoicePdf(invoice: PdfInvoice, rectifies?: string | null, design?: InvoiceDesign | null): Promise<PdfDocument> {
  const chosen = designFor(design), pdfClass = await loadJsPdf();
  if (!billing2Legacy.products().length) await billing2Legacy.loadProducts();
  const doc: PdfDocument = Reflect.construct(pdfClass, [{ unit: 'mm', format: 'a4' }]);
  const drawing: Drawing = {
    doc, design: chosen, font: chosen.fuente === 'times' ? 'times' : 'helvetica', accent: hexToRgb(chosen.color),
    company: invoice.emisor ?? {}, customer: invoice.cliente ?? {}, logoLeft: chosen.logoPos !== 'der', logoSize: logoSizeOf(chosen),
  };
  await drawLogo(drawing);
  drawTitle(drawing, invoice);
  const top = drawDatesAndCustomer(drawing, invoice, rectifies ?? '', drawCompanyHeader(drawing));
  const end = await drawLines(drawing, invoice, Math.max(104, top + 34));
  drawPayment(drawing, invoice, drawTotals(drawing, invoice, end));
  await drawQr(drawing, invoice);
  drawFooter(drawing);
  return doc;
}
