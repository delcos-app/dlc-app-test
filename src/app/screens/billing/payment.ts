/** «Registrar cobro» of an invoice, in the second window. Migrated from the legacy cobroFactura (v2.413.0). */
import { legacyDb, notices } from '../../legacy/bridge';
import { billingLegacy } from '../../legacy/billing-bridge';
import { t } from '../../i18n';
import { todayIso } from '../../services/dates';
import { escapeHtml } from '../../services/format';
import { refreshInvoices } from './list';
import { euros, type Invoice } from './model';

const value = (id: string): string => (document.getElementById(id) as HTMLInputElement | null)?.value ?? '';

function formHtml(invoice: Invoice, pending: number): string {
  const methods = billingLegacy.paymentMethods().map(item => `<option ${item.valor === invoice.forma_pago ? 'selected' : ''}>${escapeHtml(item.valor)}</option>`).join('');
  return `
    <div class="fh"><div><h2>${t('billing.payment.title', { number: escapeHtml(invoice.numero) })}</h2><div class="sm">${t('billing.payment.pending', { amount: euros(pending) })}</div></div>
      <button class="x" data-cerrar2 aria-label="${t('common.close')}">✕</button></div>
    <div class="g2"><div><label for="cbi">${t('billing.payment.amount')}</label><input id="cbi" type="number" step="0.01" value="${pending}"></div>
      <div><label for="cbf">${t('billing.payment.date')}</label><input id="cbf" type="date" value="${todayIso()}"></div></div>
    <div class="g2"><div><label for="cbp">${t('billing.payment.method')}</label><select id="cbp">${methods}</select></div>
      <div><label for="cbn">${t('billing.payment.note')}</label><input id="cbn" placeholder="${t('billing.payment.optional')}"></div></div>
    <div class="acts u-end"><button class="btn sec" data-cerrar2>${t('common.cancel')}</button><button class="btn" id="cbok">${t('billing.payment.register')}</button></div>`;
}

async function save(invoice: Invoice, box: HTMLDialogElement): Promise<void> {
  const amount = Number(value('cbi'));
  if (!amount) { notices.toast(t('billing.payment.writeAmount'), true); return; }
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean }>('registrar_cobro', {
    p_factura: invoice.id, p_importe: amount, p_fecha: value('cbf'), p_forma: value('cbp'), p_nota: value('cbn').trim() || null,
  });
  if (error || result?.ok === false) { notices.toast(t('billing.payment.couldNotRegister'), true); return; }
  box.close(); notices.toast(t('billing.payment.registered')); billingLegacy.openInvoice(invoice.id); refreshInvoices();
}

export function registerPayment(invoice: Invoice, pending: number): void {
  const body = document.getElementById('dlg2body'), box = document.getElementById('dlg2') as HTMLDialogElement | null;
  if (!body || !box) return;
  body.innerHTML = formHtml(invoice, pending);
  box.showModal();
  const ok = document.getElementById('cbok'); if (ok) ok.onclick = (): void => { void save(invoice, box); };
}
