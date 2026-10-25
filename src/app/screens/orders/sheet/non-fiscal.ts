/**
 * v2.307.0 · «Editar datos» of a confirmed or invoiced order: only what is not fiscal (note, payment method, payment reference and
 * the order's custom fields). Lines, prices, VAT, customer and date do not change; an issued invoice keeps the payment method it was
 * issued with. Migrated from the legacy editarPedidoNoFiscal (v2.414.0).
 */
import { appLegacy, legacyDb, notices } from '../../../legacy/bridge';
import { orderSheetLegacy, ordersLegacy } from '../../../legacy/orders-bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import type { OrderDetail } from '../model';

const value = (id: string): string => (document.getElementById(id) as HTMLInputElement | null)?.value.trim() ?? '';

function formHtml(detail: OrderDetail): string {
  const order = detail.pedido;
  const methods = ordersLegacy.paymentMethods().map(method => `<option ${order.forma_pago === method.valor ? 'selected' : ''}>${escapeHtml(method.valor)}</option>`).join('');
  return `<div class="fh"><div><h2>${t('orders.nonFiscal.title', { number: escapeHtml(order.numero ?? '') })}</h2>
      <div class="sm">${t('orders.nonFiscal.subtitle')}</div></div>
      <button class="x" data-cerrar2 aria-label="${t('common.close')}">✕</button></div>
    <label for="nfnota">${t('orders.nonFiscal.note')}</label><textarea id="nfnota" rows="4">${escapeHtml(order.nota ?? '')}</textarea>
    <div class="g2"><div><label for="nffp">${t('orders.nonFiscal.paymentMethod')}</label><select id="nffp"><option value="">—</option>${methods}</select></div>
      <div><label for="nfref">${t('orders.nonFiscal.paymentReference')}</label><input id="nfref" value="${escapeHtml(order.pago_referencia ?? '')}" placeholder="${t('orders.nonFiscal.referencePlaceholder')}"></div></div>
    ${order.factura_id ? `<p class="sm">${t('orders.nonFiscal.invoiceKeeps')}</p>` : ''}
    <div id="nfcampos">${orderSheetLegacy.fieldsForm(order.clasificadores ?? {})}</div>
    <div class="acts nfacts"><button class="btn sec" data-cerrar2>${t('common.cancel')}</button><button class="btn" id="nfok">${t('common.save')}</button></div>`;
}

async function save(id: string, button: HTMLButtonElement): Promise<void> {
  const read = orderSheetLegacy.readFields(document.getElementById('nfcampos'));
  const missing = read?.falta[0];
  if (missing) { notices.toast(t('orders.nonFiscal.fillIn', { field: missing }), true); return; }
  button.disabled = true;
  const { error } = await legacyDb().from('pedidos').update({ nota: value('nfnota') || null, forma_pago: value('nffp') || null, pago_referencia: value('nfref') || null }).eq('id', id);
  if (error) { button.disabled = false; notices.toast(t('orders.nonFiscal.couldNotSave', { error: (error as { message?: string }).message ?? '' }), true); return; }
  if (!(await orderSheetLegacy.saveFields(read, id))) { button.disabled = false; return; }
  (document.getElementById('dlg2') as HTMLDialogElement | null)?.close(); notices.toast(t('orders.nonFiscal.saved'));
  try { appLegacy.forgetCache(); } catch { /* the cache is only a speed-up */ }
  appLegacy.openOrder(id);
}

export function editNonFiscal(detail: OrderDetail): void {
  const body = document.getElementById('dlg2body'), box = document.getElementById('dlg2') as HTMLDialogElement | null;
  if (!body || !box) return;
  body.innerHTML = formHtml(detail);
  box.showModal();
  const ok = document.getElementById('nfok') as HTMLButtonElement | null;
  if (ok) ok.onclick = (): void => { void save(detail.pedido.id, ok); };
}
