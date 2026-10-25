/**
 * The invoice preview of an order before issuing it (v2.339.0): the PDF as it will be (same sums as emitir_factura: price = amount /
 * units, base with the general discount spread, shipping as a line, VAT by rate) with «VISTA PREVIA» and no number, in its wide
 * window above the order, and «Emitir factura» from there. It saves nothing. Migrated from the legacy facturaDePedido and
 * previaFacturaPedido (v2.427.0).
 */
import { notices, term } from '../../../legacy/bridge';
import { billing2Legacy } from '../../../legacy/billing2-bridge';
import { t } from '../../../i18n';
import { withLoading } from '../../../components/loading-button';
import { registerError } from '../../../core/errors';
import { todayIso } from '../../../services/dates';
import { escapeHtml } from '../../../services/format';
import { orFallback } from '../../../services/values';
import { companyForPdf, currentDesign, invoicePdf } from '../../../services/pdf';
import type { PdfInvoice, PdfLine } from '../../../services/pdf/invoice-header';
import { issueOrderInvoice } from './issue';

interface OrderLine { producto?: string | null; unidades?: number | null; importe?: number | null; descuento?: number | null; iva?: number | null }
interface OrderContact { id?: string; nombre?: string; nif?: string | null; direccion?: string | null; cp?: string | null; municipio?: string | null; provincia?: string | null; email?: string | null }
interface OrderDetail {
  pedido: { envio?: boolean | null; envio_base?: number | null; envio_iva?: number | null; servicio_id?: string | null; forma_pago?: string | null };
  totales?: { bruto?: number | null; base_productos?: number | null } | null; contacto?: OrderContact | null; lineas?: OrderLine[] | null;
}

const PREVIEW_HASH = '#toolbar=0&navpanes=0&view=FitH';
const round2 = (value: number): number => Math.round(value * 100) / 100;
const numberOf = (value: unknown): number => Number(value) || 0;

function linesOf(detail: OrderDetail): (PdfLine & { descuento?: number; servicio?: boolean })[] {
  const order = detail.pedido, gross = numberOf(detail.totales?.bruto), share = gross ? numberOf(detail.totales?.base_productos) / gross : 1;
  const lines = (detail.lineas ?? []).map(line => ({
    descripcion: orFallback(line.producto, t('billingMore.preview.noProduct')), unidades: numberOf(line.unidades),
    precio: numberOf(line.unidades) ? numberOf(line.importe) / numberOf(line.unidades) : 0, descuento: numberOf(line.descuento), iva: numberOf(line.iva),
    base: round2(numberOf(line.importe) * (1 - numberOf(line.descuento) / 100) * share),
  }));
  if (!order.envio) return lines;
  const service = billing2Legacy.services().find(item => item.id === order.servicio_id);
  return [...lines, { descripcion: service?.nombre ?? t('billingMore.preview.shipping'), unidades: 1, precio: numberOf(order.envio_base), descuento: 0,
    iva: numberOf(order.envio_iva), base: round2(numberOf(order.envio_base)), servicio: true }];
}

/** The invoice an order would give, without a number. */
export function invoiceOfOrder(detail: OrderDetail): PdfInvoice {
  const lines = linesOf(detail), byRate = new Map<number, number>(), contact = detail.contacto ?? {};
  lines.forEach(line => { byRate.set(numberOf(line.iva), (byRate.get(numberOf(line.iva)) ?? 0) + numberOf(line.base)); });
  const vat = [...byRate.keys()].sort((first, second) => first - second).map(rate => ({ iva: rate, base: round2(byRate.get(rate) ?? 0), cuota: round2((byRate.get(rate) ?? 0) * rate / 100) }));
  const base = round2(vat.reduce((total, item) => total + item.base, 0)), total = round2(vat.reduce((all, item) => all + item.base + item.cuota, 0));
  return {
    numero: t('billingMore.preview.number'), fecha: todayIso(), vencimiento: todayIso(), emisor: companyForPdf(), forma_pago: detail.pedido.forma_pago ?? '',
    cliente: contact.id ? { nombre: contact.nombre, nif: contact.nif, direccion: contact.direccion, cp: contact.cp, municipio: contact.municipio, provincia: contact.provincia, email: contact.email } : {},
    lineas: lines, base, desglose_iva: vat, total, verifactu: {},
  };
}

const header = (): string => `<div class="fh"><div><h2>${t('billingMore.preview.title')}</h2></div><button class="x" data-cerrar2 aria-label="${t('common.close')}">✕</button></div>`;

function missingText(contact: OrderContact | null | undefined): string {
  if (!contact) return t('billingMore.preview.noCustomer', { patient: term('paciente') });
  return contact.nif ? '' : t('billingMore.preview.noTaxId', { name: escapeHtml(contact.nombre ?? '') });
}

function previewHtml(detail: OrderDetail): string {
  const missing = missingText(detail.contacto);
  return `${header()}
    ${missing ? `<div class="banda-aviso facpaviso">${missing}</div>` : ''}
    <div class="facprev"><iframe id="facpif" title="${t('billingMore.preview.title')}"></iframe></div>
    <p class="sm">${t('billingMore.preview.hint')}</p>
    <div class="acts"><button type="button" class="btn sec" data-cerrar2>${t('billingMore.preview.cancel')}</button><button type="button" class="btn" id="facpemitir">${t('billingMore.preview.issue')}</button></div>`;
}

async function paintPdf(detail: OrderDetail): Promise<void> {
  try {
    const design = currentDesign(); design.titulo = design.titulo + t('billingMore.preview.titleSuffix');
    const doc = await invoicePdf(invoiceOfOrder(detail), '', design), frame = document.getElementById('facpif') as HTMLIFrameElement | null;
    if (frame) frame.src = doc.output('bloburl') + PREVIEW_HASH;
  } catch (error) {
    notices.toast(t('billingMore.preview.couldNotPrepare'), true); registerError('app', t('billingMore.preview.errorLog'), { e: String(error) });
  }
}

/** Opens the preview at once (with the loader) in its wide window above the order, which stays open as it was. */
export async function previewOrderInvoice(id: string): Promise<void> {
  const box = document.getElementById('dlg2') as HTMLDialogElement | null, body = document.getElementById('dlg2body');
  if (!box || !body) return;
  body.innerHTML = `${header()}<div class="facprev facpcarga"><div class="spin"></div></div>`;
  box.classList.add('amplia'); box.addEventListener('close', () => { box.classList.remove('amplia'); }, { once: true });
  if (!box.open) box.showModal();
  await billing2Legacy.loadSettings();
  const { data: detail } = await billing2Legacy.rawRpc<OrderDetail>('pedido_detalle', { p_id: id });
  if (!box.open) return;
  if (!detail?.pedido) { box.close(); notices.toast(t('billingMore.preview.couldNotRead'), true); return; }
  body.innerHTML = previewHtml(detail);
  await paintPdf(detail);
  const issue = document.getElementById('facpemitir') as HTMLButtonElement | null;
  if (issue) issue.onclick = (): void => {
    void withLoading(issue, t('billingMore.preview.issuing'), async () => {
      const result = await issueOrderInvoice(id, { yaVista: true });
      if (result) { box.close(); billing2Legacy.openInvoice(result.id); }
    });
  };
}
