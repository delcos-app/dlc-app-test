/**
 * «Operativa» of a confirmed order (who sees the whole team or administers): paid, package ready, emails sent, reported to the
 * professional, and the email with the payment details. Migrated from the legacy pedidoOperativa (v2.414.0).
 */
import { appLegacy, cardSectionsLegacy, currentScreen, cycleLegacy, legacyDb, notices, permissions, term } from '../../../legacy/bridge';
import { ordersLegacy } from '../../../legacy/orders-bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { operationDone, OPERATIONS, STATES, type Order, type OrderDetail } from '../model';
import { askPaymentEmailSent, mailtoLink, paymentSubject, paymentText } from '../payment-email';

const MAIL_QUESTION_DELAY_MS = 800, SALES_LEVEL = 2;

function operationHtml(order: Order, key: string, label: string, allowed: boolean): string {
  const done = operationDone(order, key), method = order.forma_pago;
  const how = key === 'pago' && method ? ` <span class="sm">· ${escapeHtml(method)}${/reembolso/i.test(method) ? t('orders.operations.onDelivery') : ''}</span>` : '';
  return `<label class="opchk ${done ? 'on' : ''}"><input type="checkbox" data-op="${key}" ${done ? 'checked' : ''} ${allowed ? '' : 'disabled'}>
      <span>${escapeHtml(label)}${how}</span></label>`;
}

function mailHtml(detail: OrderDetail): string {
  const order = detail.pedido, customer = detail.contacto, total = Number(detail.totales?.total) || 0;
  if (order.sin_cargo) return '';
  if (!customer?.email) return `<span class="sm">${t('orders.operations.noEmail')}</span>`;
  return `<a class="btn sec" id="pdmailpago" data-ped="${order.id}" href="${mailtoLink(escapeHtml(customer.email), paymentSubject(order, total, customer.nombre), paymentText(order, total, customer.nombre))}">${t('orders.operations.preparePaymentEmail')}</a>`;
}

function blockHtml(detail: OrderDetail, allowed: boolean): string {
  const order = detail.pedido;
  return `<div class="blk" id="pdops" data-nosucio><h3>${t('orders.operations.title')}</h3>
    ${order.sin_cargo ? `<p class="sm">${t('orders.operations.freeDelivery')}</p>` : ''}${OPERATIONS.filter(([key]) => !(order.sin_cargo && key === 'pago')).map(([key, label]) => operationHtml(order, key, t(label), allowed)).join('')}
    <label class="opchk ${order.reportar_profesional ? 'on' : ''}"><input type="checkbox" data-reporte ${order.reportar_profesional ? 'checked' : ''} ${allowed ? '' : 'disabled'}>
      <span>${t('orders.operations.reported', { professional: escapeHtml(term('medico', { article: 'al' })) })}</span></label>
    <div class="acts u-m-6-0-0">
      ${mailHtml(detail)}
    </div></div>`;
}

async function markOperation(order: Order, box: HTMLInputElement): Promise<void> {
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean }>('marcar_operativa', { p_pedido: order.id, p_campo: box.dataset.op, p_hecho: box.checked });
  if (error || result?.ok === false) { box.checked = !box.checked; notices.toast(t('orders.operations.couldNotSave'), true); return; }
  box.closest('.opchk')?.classList.toggle('on', box.checked);
  const paid = box.dataset.op === 'pago';
  notices.toast(box.checked ? (paid ? t('orders.operations.paidToast') + (order.factura_id ? t('orders.operations.paidOnInvoice') : '') : t('orders.operations.done')) : t('orders.operations.unmarked'));
  if (currentScreen() === 'ventas' && ordersLegacy.section() === 'ventas') ordersLegacy.paintOperations();
}

/** v2.328.0: reported to the professional. */
async function markReport(id: string, box: HTMLInputElement): Promise<void> {
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean }>('marcar_reporte', { p_id: id, p_valor: box.checked });
  if (error || result?.ok === false) { box.checked = !box.checked; notices.toast(t('orders.operations.couldNotSave'), true); return; }
  box.closest('.opchk')?.classList.toggle('on', box.checked);
  notices.toast(t(box.checked ? 'orders.operations.reportedToast' : 'orders.operations.notReportedToast'));
}

function bind(body: HTMLElement, order: Order): void {
  body.querySelectorAll<HTMLInputElement>('[data-op]').forEach(box => { box.onchange = (): void => { void markOperation(order, box); }; });
  const report = body.querySelector<HTMLInputElement>('[data-reporte]');
  if (report) report.onchange = (): void => { void markReport(order.id, report); };
  // After writing the email with the device's mail, it asks whether it was sent
  document.getElementById('pdmailpago')?.addEventListener('click', () => {
    setTimeout(() => { void askPaymentEmailSent(order.id).then(sent => { if (sent) appLegacy.openOrder(order.id); }); }, MAIL_QUESTION_DELAY_MS);
  });
}

export async function paintOperations(detail: OrderDetail): Promise<void> {
  const dialog = document.getElementById('dlg') as HTMLDialogElement | null;
  if (!dialog?.open || !(permissions.seesEverything() || cardSectionsLegacy.can('administrar'))) return;
  const order = detail.pedido; if (order.estado !== STATES.confirmed || document.getElementById('pdops')) return;
  await cycleLegacy.loadSettings();
  const body = document.getElementById('dbody'), actions = body?.querySelector('.acts:last-of-type');
  if (!body || !actions) return;
  actions.insertAdjacentHTML('beforebegin', blockHtml(detail, permissions.seesEverything() && permissions.salesLevel() >= SALES_LEVEL));
  bind(body, order);
}
