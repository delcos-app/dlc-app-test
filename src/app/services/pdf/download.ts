/**
 * Downloading an invoice PDF (asking which design when there are several) and the sample invoice of the designer. Migrated from the
 * legacy descargarFacturaPDF and facturaEjemplo (v2.427.0); descargarFacturaPDF stays as an adapter (the invoice window uses it).
 */
import { legacyDb } from '../../legacy/bridge';
import { billing2Legacy } from '../../legacy/billing2-bridge';
import { t } from '../../i18n';
import { appName } from '../../core/utilities';
import { todayIso } from '../dates';
import { chooseTemplate } from './design';
import { pdfFileName } from './document';
import { invoicePdf } from './invoice';
import type { PdfInvoice, PdfParty } from './invoice-header';

export async function downloadInvoicePdf(invoice: PdfInvoice & { id?: string }, rectifies?: string | null): Promise<void> {
  if (!await chooseTemplate()) return;
  try {
    const doc = await invoicePdf(invoice, rectifies);
    doc.save(pdfFileName(invoice));
    await Promise.resolve(legacyDb().from('eventos_facturacion').insert({ tipo: 'PDF descargado', factura_id: invoice.id, detalle: {} })).catch(() => undefined);
  } finally { billing2Legacy.setPdfChosen(null); }
}

/** The company's real fiscal data (Datos fiscales), with only the empty ones filled for the example. */
export function companyForPdf(): PdfParty {
  const saved = (billing2Legacy.settings().empresa ?? {}) as Record<string, unknown>;
  const real = Object.fromEntries(Object.entries(saved).filter(([, value]) => Boolean(value))) as PdfParty & { poblacion?: string };
  if (real.poblacion && !real.municipio) real.municipio = real.poblacion;
  return real;
}

/** An example invoice for the designer's preview. */
export function sampleInvoice(): PdfInvoice {
  const company: PdfParty = {
    razon_social: appName(), nif: t('billingMore.sample.taxId'), direccion: t('billingMore.sample.address'), cp: t('billingMore.sample.postcode'),
    municipio: t('billingMore.sample.town'), telefono: t('billingMore.sample.phone'), web: t('billingMore.sample.web'), email: t('billingMore.sample.email'),
    iban: t('billingMore.sample.iban'), pie: t('billingMore.sample.footer'), ...companyForPdf(),
  };
  const product = billing2Legacy.products()[0]?.nombre ?? t('billingMore.sample.product'), today = todayIso();
  return {
    numero: 'F260001', fecha: today, vencimiento: today, emisor: company, forma_pago: t('billingMore.sample.payment'),
    cliente: { nombre: t('billingMore.sample.customer'), nif: t('billingMore.sample.customerTaxId'), direccion: t('billingMore.sample.customerAddress'),
      municipio: t('billingMore.sample.town'), cp: t('billingMore.sample.customerPostcode'), provincia: t('billingMore.sample.town'), email: t('billingMore.sample.customerEmail') },
    lineas: [{ descripcion: t('billingMore.sample.productLine', { product }), precio: 41.82, unidades: 2, base: 83.64, iva: 10 },
      { descripcion: t('billingMore.sample.shipping'), precio: 5, unidades: 1, base: 5, iva: 21 }],
    base: 88.64, desglose_iva: [{ iva: 10, cuota: 8.36 }, { iva: 21, cuota: 1.05 }], total: 98.05, verifactu: {},
  };
}
