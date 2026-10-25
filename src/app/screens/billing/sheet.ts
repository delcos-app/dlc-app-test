/**
 * The sheet of an invoice: client and issuer, lines, VAT breakdown, payments, the billing record and its actions (see the order,
 * rectify, register a payment, see, download and email the PDF). Migrated from the legacy verFactura, verFacturaBase and
 * facturaBotonesPdfYEmail (v2.413.0): the sheet is painted at once with its final buttons. verFactura stays as an adapter
 * (legado 089, the wide window, «‹ Volver», Pedidos and the tests open invoices by that name).
 */
import { appLegacy, callRpc, cardSectionsLegacy, legacyDb, notices } from '../../legacy/bridge';
import { billingLegacy } from '../../legacy/billing-bridge';
import { t } from '../../i18n';
import { todayIso } from '../../services/dates';
import { formatLongDate, formatShortDate } from '../../services/date-format';
import { escapeHtml, formatNumber } from '../../services/format';
import { orFallback } from '../../services/values';
import { refreshInvoices } from './list';
import { euros, PAYMENT, paymentPill, type Invoice, type InvoiceParty } from './model';
import { registerPayment } from './payment';
import { rectifyInvoice } from './rectify';

interface Payment { id: string; fecha: string; forma_pago?: string | null; nota?: string | null; importe: number }
interface InvoiceDetail { factura?: Invoice; cobros?: Payment[]; rectifica?: { id: string; numero: string } | null; rectificativas?: { numero: string; total: number; motivo?: string | null }[] }

const FINGERPRINT_SHOWN = 32;

function paymentState(invoice: Invoice): string {
  if (invoice.total === 0 || Math.abs(invoice.cobrado) >= Math.abs(invoice.total)) return PAYMENT.paid;
  return invoice.vencimiento && invoice.vencimiento < todayIso() ? PAYMENT.overdue : PAYMENT.pending;
}

const address = (party: InvoiceParty, withProvince: boolean): string =>
  escapeHtml([party.direccion, party.cp, party.municipio, withProvince ? party.provincia : null].filter(Boolean).join(', '));

function headerHtml(invoice: Invoice): string {
  const when = `${formatLongDate(invoice.fecha)}${invoice.vencimiento ? t('billing.sheet.dueOn', { date: formatShortDate(invoice.vencimiento) }) : ''}${invoice.forma_pago ? ` · ${escapeHtml(invoice.forma_pago)}` : ''}`;
  return `<div class="fh"><div><h2>${t(invoice.rectifica_id ? 'billing.sheet.rectifying' : 'billing.sheet.invoice')} ${escapeHtml(invoice.numero)} ${paymentPill(paymentState(invoice))}</h2>
      <div class="sm">${when}</div></div>
      <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>`;
}

function noticesHtml(detail: InvoiceDetail, invoice: Invoice): string {
  const original = detail.rectifica ? `<div class="avisoh"><span>${t('billing.sheet.rectifiesNotice', { number: escapeHtml(detail.rectifica.numero), reason: escapeHtml(invoice.motivo_rectificacion ?? '') })}</span><button class="btn sec" data-vfac="${detail.rectifica.id}">${t('billing.sheet.seeOriginal')}</button></div>` : '';
  const later = detail.rectificativas ?? [];
  const list = later.map(item => `<b>${escapeHtml(item.numero)}</b> (${euros(item.total)} · ${escapeHtml(item.motivo ?? '')})`).join(', ');
  return original + (later.length ? `<div class="avisoh"><span>${t('billing.sheet.rectifiedBy', { list })}</span></div>` : '');
}

function partiesHtml(invoice: Invoice): string {
  const client = invoice.cliente, issuer = invoice.emisor;
  return `<div class="g2">
      <div class="blk"><h3>${t('billing.sheet.client')}</h3><b>${escapeHtml(client.nombre ?? '')}</b><div class="sm">${escapeHtml(orFallback(client.nif, t('billing.sheet.noNif')))}</div>
        <div class="sm">${address(client, true)}</div></div>
      <div class="blk"><h3>${t('billing.sheet.issuer')}</h3><b>${escapeHtml(issuer.razon_social ?? '')}</b><div class="sm">${escapeHtml(issuer.nif ?? '')}</div>
        <div class="sm">${address(issuer, false)}</div></div></div>`;
}

function linesHtml(invoice: Invoice): string {
  const head = [['', 'concept'], ['num', 'units'], ['num', 'price'], ['num', 'discount'], ['num', 'vat'], ['num', 'base']] as const;
  const lines = invoice.lineas.map(line => `<div class="dr u-cursor-default"><span>${escapeHtml(line.descripcion)}</span><span class="num">${formatNumber(line.unidades)}</span>
        <span class="num">${euros(line.precio)}</span><span class="num">${line.descuento ? `${formatNumber(line.descuento)}%` : '—'}</span><span class="num">${formatNumber(line.iva)}%</span><span class="num"><b>${euros(line.base)}</b></span></div>`).join('');
  const breakdown = invoice.desglose_iva.map(item => `<div><span>${t('billing.sheet.baseAt', { rate: formatNumber(item.iva) })}</span><b>${euros(item.base)}</b></div><div><span>${t('billing.sheet.vatAt', { rate: formatNumber(item.iva) })}</span><b>${euros(item.cuota)}</b></div>`).join('');
  return `<div class="dgrid-wrap"><div class="dgrid flin">
      <div class="dh">${head.map(([kind, key]) => `<span${kind ? ` class="${kind}"` : ''}>${t(`billing.sheet.${key}`)}</span>`).join('')}</div>
      ${lines}</div></div>
    <div class="totbox">${breakdown}
      <div class="tot"><span>${t('billing.sheet.total')}</span><b>${euros(invoice.total)}</b></div></div>`;
}

function paymentsHtml(payments: readonly Payment[], pending: number): string {
  const admin = cardSectionsLegacy.can('administrar');
  const rows = payments.map(item => `<div class="sm" style="display:flex;justify-content:space-between;gap:8px;padding:4px 0">
        <span>${formatShortDate(item.fecha)} · ${escapeHtml(item.forma_pago ?? '')}${item.nota ? ` · ${escapeHtml(item.nota)}` : ''}</span><b>${euros(item.importe)}</b>
        ${admin ? `<button class="kcfg" data-bcob="${item.id}">${t('billing.sheet.removePayment')}</button>` : ''}</div>`).join('');
  return `<div class="blk"><h3>${t('billing.sheet.payments')}</h3>
      ${rows || `<div class="sm">${t('billing.sheet.noPayments')}</div>`}
      ${pending ? `<div class="sm u-mt-4">${t('billing.sheet.pendingAmount', { amount: euros(pending) })}</div>` : ''}</div>`;
}

function recordHtml(invoice: Invoice): string {
  if (!invoice.huella) return '';
  return `<div class="blk"><h3>${t('billing.sheet.record')}</h3><div class="sm mono">${t('billing.sheet.fingerprint', { value: escapeHtml(invoice.huella.slice(0, FINGERPRINT_SHOWN)) })}</div>
      <div class="sm">${t('billing.sheet.verifactuState', { state: escapeHtml(orFallback(invoice.verifactu?.estado, t('billing.sheet.notApplicable'))) })}</div></div>`;
}

function actionsHtml(invoice: Invoice, pending: number): string {
  const can = billingLegacy.canInvoice();
  return `<div class="acts u-end u-wrap">
      <button class="btn sec" data-cerrar>${t('common.close')}</button>
      ${invoice.pedido_id ? `<button class="btn sec" id="fvped">${t('billing.sheet.seeOrder')}</button>` : ''}
      ${can && !invoice.rectifica_id ? `<button class="btn sec dang" id="fvrect">${t('billing.sheet.rectify')}</button>` : ''}
      ${can && pending ? `<button class="btn sec" id="fvcob">${t('billing.sheet.registerPayment')}</button>` : ''}
      <button class="btn sec" id="fvpdf">${t('billing.sheet.see')}</button><button class="btn sec" id="fvdl">${t('billing.sheet.download')}</button>${can ? `<button class="btn" id="fvmail">${t('billing.sheet.email')}</button>` : ''}</div>`;
}

const on = (id: string, action: () => void): void => { const button = document.getElementById(id); if (button) button.onclick = action; };

function bind(body: HTMLElement, detail: InvoiceDetail, invoice: Invoice, pending: number): void {
  const rectifies = detail.rectifica?.numero;
  body.querySelectorAll<HTMLElement>('[data-vfac]').forEach(button => { button.onclick = (): void => { billingLegacy.openInvoice(button.dataset.vfac ?? ''); }; });
  body.querySelectorAll<HTMLElement>('[data-bcob]').forEach(button => {
    button.onclick = async (): Promise<void> => {
      if (!await notices.confirm(t('billing.sheet.removePaymentText'), { titulo: t('billing.sheet.removePaymentTitle'), ok: t('billing.sheet.removePayment'), peligro: true })) return;
      await legacyDb().rpc('borrar_cobro', { p_id: button.dataset.bcob }); billingLegacy.openInvoice(invoice.id); refreshInvoices();
    };
  });
  on('fvped', () => { appLegacy.openOrder(invoice.pedido_id ?? ''); });
  on('fvcob', () => { registerPayment(invoice, pending); });
  on('fvrect', () => { rectifyInvoice(invoice); });
  on('fvdl', () => { billingLegacy.downloadPdf(invoice, rectifies); });
  on('fvmail', () => { billingLegacy.sendByEmail(invoice, rectifies); });
  // «Ver» opens the same PDF that is sent
  on('fvpdf', () => { void billingLegacy.invoicePdf(invoice, rectifies).then(pdf => { window.open(pdf.output('bloburl'), '_blank'); }); });
}

async function paint(id: string): Promise<void> {
  const { data: detail } = await callRpc<InvoiceDetail>('factura_detalle', { p_id: id });
  const invoice = detail?.factura;
  if (!detail || !invoice) { notices.toast(t('billing.sheet.couldNotOpen'), true); return; }
  const body = document.getElementById('dbody'), box = document.getElementById('dlg') as HTMLDialogElement | null;
  if (!body || !box) return;
  const pending = Number((invoice.total - invoice.cobrado).toFixed(2));
  body.innerHTML = `
    ${headerHtml(invoice)}
    ${noticesHtml(detail, invoice)}
    ${partiesHtml(invoice)}
    ${linesHtml(invoice)}
    ${paymentsHtml(detail.cobros ?? [], pending)}
    ${recordHtml(invoice)}
    ${actionsHtml(invoice, pending)}`;
  if (!box.open) box.showModal();
  bind(body, detail, invoice, pending);
}

/** Opens an invoice in the window (with the loading state while it is read). */
export function showInvoice(id: string): Promise<void> {
  return billingLegacy.withLoading(() => paint(id));
}
