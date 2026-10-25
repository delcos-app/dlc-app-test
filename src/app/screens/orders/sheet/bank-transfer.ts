/**
 * v2.314.0 · A draft paid by bank transfer: whether the payment details were sent, «Enviar los datos de pago» and «Cobrado ·
 * confirmar» (confirms the order and notes the payment). Migrated from the legacy verPedidoBase6 (v2.414.0).
 */
import { appLegacy, term } from '../../../legacy/bridge';
import { customersLegacy } from '../../../legacy/customers-bridge';
import { t } from '../../../i18n';
import { formatShortDate } from '../../../services/date-format';
import { escapeHtml } from '../../../services/format';
import { isBankTransfer, STATES, type OrderDetail } from '../model';
import { sendPaymentDetails } from '../payment-email';

const PAID_FLAG_MS = 60000;

function blockHtml(detail: OrderDetail): string {
  const order = detail.pedido, sent = order.email_pago_en;
  const status = sent ? t('orders.bankTransfer.sentOn', { date: formatShortDate(String(sent).slice(0, 10)) }) : t('orders.bankTransfer.notSent');
  const send = detail.contacto?.email
    ? `<button type="button" class="btn sec chico" id="pdtrfmail">${t(sent ? 'orders.bankTransfer.sendAgain' : 'orders.bankTransfer.send')}</button>`
    : `<span class="sm">${t('orders.bankTransfer.noEmail', { customer: escapeHtml(term('paciente', { capital: 'C' })) })}</span>`;
  return `<div class="blk" id="pdtrfb"><h3>${t('orders.bankTransfer.title')}</h3>
      <p class="sm">${status}</p>
      <div class="acts pdtrfacts">${send}
        <button type="button" class="btn chico" id="pdtrfok">${t('orders.bankTransfer.paidConfirm')}</button></div></div>`;
}

export function paintBankTransfer(detail: OrderDetail): void {
  const dialog = document.getElementById('dlg') as HTMLDialogElement | null, confirm = document.getElementById('pdvalidar');
  if (!dialog?.open || document.getElementById('pdtrfb') || !confirm || !customersLegacy.canSell()) return;
  const order = detail.pedido;
  if (order.estado !== STATES.draft || !isBankTransfer(order.forma_pago)) return;
  confirm.closest('.acts')?.insertAdjacentHTML('beforebegin', blockHtml(detail));
  const send = document.getElementById('pdtrfmail') as HTMLButtonElement | null;
  if (send) send.onclick = async (): Promise<void> => { send.disabled = true; if (await sendPaymentDetails(order.id)) appLegacy.openOrder(order.id); else send.disabled = false; };
  const paid = document.getElementById('pdtrfok');
  // «Confirmar pedido» with the payment noted: the flag lives a minute in case the confirmation is cancelled
  if (paid) paid.onclick = (): void => { confirm.dataset.pago = '1'; confirm.click(); setTimeout(() => { if (confirm.isConnected) delete confirm.dataset.pago; }, PAID_FLAG_MS); };
}
