/**
 * «Descargar transfer»: a PDF for the distributor with the customer, their code at the distributor and the lines with reference and
 * barcode. Migrated from the legacy trfPDF (v2.414.0).
 */
import { legacyDb } from '../../../legacy/bridge';
import { orderSheetLegacy, type Distributor } from '../../../legacy/orders-bridge';
import { t } from '../../../i18n';
import { todayIso } from '../../../services/dates';
import { formatShortDate } from '../../../services/date-format';
import { formatNumber } from '../../../services/format';
import { orFallback, sum } from '../../../services/values';
import type { OrderDetail } from '../model';

interface PdfDocument {
  text(text: string | string[], x: number, y: number, options?: { align?: string }): void;
  setFont(name: string, style: string): void;
  setFontSize(size: number): void;
  setDrawColor(gray: number): void;
  line(fromX: number, fromY: number, toX: number, toY: number): void;
  splitTextToSize(text: string, width: number): string[];
  addPage(): void;
  save(name: string): void;
}
type PdfConstructor = new (options: { unit: string; format: string }) => PdfDocument;

/** Page layout in millimetres (A4). */
const LEFT = 15, RIGHT_COLUMN = 110, RIGHT = 195, PAGE_END = 270, REFERENCE_X = 105, BARCODE_X = 140;
const TITLE_SIZE = 16, TEXT_SIZE = 10, LINE_GREY = 200, NAME_WIDTH = 86, ADDRESS_WIDTH = 85, NOTE_WIDTH = 180;

interface ProductCodes { id: string; referencia?: string | null; codigo_barras?: string | null }

class TransferWriter {
  y = 18;
  constructor(readonly doc: PdfDocument) {}
  write(text: unknown, x: number, options?: { align?: string }): void { this.doc.text(String(text ?? ''), x, this.y, options); }
  bold(): void { this.doc.setFont('helvetica', 'bold'); }
  normal(): void { this.doc.setFont('helvetica', 'normal'); }
}

/** The customer column: name, code at the distributor, address and tax id. */
function customerLines(detail: OrderDetail): string[] {
  const order = detail.pedido, customer = detail.contacto;
  return [orFallback(customer?.nombre, order.cuenta_texto ?? ''), order.distribuidor_codigo ? t('orders.transfer.pdfCode', { code: order.distribuidor_codigo }) : '',
    [customer?.direccion, customer?.cp, customer?.municipio].filter(Boolean).join(', '), customer?.nif ? t('orders.transfer.pdfTaxId', { id: customer.nif }) : ''].filter(Boolean);
}

function header(writer: TransferWriter, detail: OrderDetail, distributor: Distributor): void {
  const order = detail.pedido, doc = writer.doc;
  writer.bold(); doc.setFontSize(TITLE_SIZE); writer.write(t('orders.transfer.pdfTitle', { number: order.numero ?? '' }), LEFT); writer.y += 7;
  writer.normal(); doc.setFontSize(TEXT_SIZE); writer.write(`${orderSheetLegacy.appName()} · ${formatShortDate(String(order.fecha || todayIso()).slice(0, 10))}`, LEFT); writer.y += 10;
  writer.bold(); writer.write(t('orders.transfer.pdfDistributor'), LEFT); writer.write(t('orders.transfer.pdfCustomer'), RIGHT_COLUMN); writer.y += 5; writer.normal();
  const left = [distributor.nombre, distributor.email, distributor.telefono].filter((item): item is string => Boolean(item)), right = customerLines(detail);
  for (let row = 0; row < Math.max(left.length, right.length); row++) {
    if (left[row]) writer.write(left[row], LEFT);
    const value = right[row]; if (value) doc.text(doc.splitTextToSize(value, ADDRESS_WIDTH), RIGHT_COLUMN, writer.y);
    writer.y += 5;
  }
}

function lines(writer: TransferWriter, detail: OrderDetail, codes: ReadonlyMap<string, ProductCodes>): void {
  const doc = writer.doc;
  writer.y += 6; writer.bold();
  writer.write(t('orders.transfer.pdfProduct'), LEFT); writer.write(t('orders.transfer.pdfReference'), REFERENCE_X); writer.write(t('orders.transfer.pdfBarcode'), BARCODE_X); writer.write(t('orders.transfer.pdfUnits'), RIGHT, { align: 'right' });
  doc.setDrawColor(LINE_GREY); doc.line(LEFT, writer.y + 2, RIGHT, writer.y + 2); writer.y += 8; writer.normal();
  for (const line of detail.lineas ?? []) {
    if (writer.y > PAGE_END) { doc.addPage(); writer.y = 20; }
    const product = codes.get(line.producto_id ?? '');
    doc.text(doc.splitTextToSize(String(line.producto ?? ''), NAME_WIDTH), LEFT, writer.y);
    writer.write(orFallback(product?.referencia, '—'), REFERENCE_X); writer.write(orFallback(product?.codigo_barras, '—'), BARCODE_X); writer.write(formatNumber(line.unidades), RIGHT, { align: 'right' });
    writer.y += 7;
  }
}

function footer(writer: TransferWriter, detail: OrderDetail): void {
  const order = detail.pedido, doc = writer.doc, units = sum((detail.lineas ?? []).map(line => Number(line.unidades) || 0));
  doc.line(LEFT, writer.y - 3, RIGHT, writer.y - 3); writer.y += 4;
  writer.bold(); writer.write(t('orders.transfer.pdfTotal', { units: formatNumber(units) }), RIGHT, { align: 'right' }); writer.y += 8;
  writer.normal(); writer.write(order.factura_distribuidor ? t('orders.distributor.invoicedByThem') : t('orders.distributor.invoicedBy', { app: orderSheetLegacy.appName() }), LEFT); writer.y += 6;
  if (order.nota) doc.text(doc.splitTextToSize(t('orders.distributor.mailNote', { note: order.nota }), NOTE_WIDTH), LEFT, writer.y);
}

export async function downloadTransfer(detail: OrderDetail, distributor: Distributor): Promise<void> {
  const pdfConstructor = await orderSheetLegacy.loadPdf() as PdfConstructor, doc = new pdfConstructor({ unit: 'mm', format: 'a4' });
  const ids = [...new Set((detail.lineas ?? []).map(line => line.producto_id).filter((id): id is string => Boolean(id)))];
  const { data } = ids.length ? await legacyDb().from<ProductCodes[]>('productos').select('id,referencia,codigo_barras').in('id', ids) : { data: [] };
  const writer = new TransferWriter(doc);
  header(writer, detail, distributor);
  lines(writer, detail, new Map((data ?? []).map(product => [product.id, product])));
  footer(writer, detail);
  doc.save(`transfer_${orFallback(detail.pedido.numero, detail.pedido.id).replace(/[^\w-]+/g, '_')}.pdf`);
}
