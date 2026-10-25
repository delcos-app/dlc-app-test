/**
 * In the order window: its invoices (opened above the order, which comes back as it was on closing them) or «Ver la factura» to
 * issue it after its preview. Migrated from the legacy pedidoFacturasBase and pedidoFacturas (v2.427.0); pedidoFacturas stays as
 * an adapter (the order window calls it through its bridge).
 */
import { legacyDb, permissions } from '../../../legacy/bridge';
import { billing2Legacy } from '../../../legacy/billing2-bridge';
import { t } from '../../../i18n';
import { openStacked } from '../../../components/embedded-window';
import { canInvoice } from '../../../core/permissions';
import { escapeHtml } from '../../../services/format';
import { previewOrderInvoice } from './preview';

/** Value stored in the database. */
const CONFIRMED = 'Confirmado';

interface OrderSummary { estado?: string; sin_cargo?: boolean | null }

/** Each invoice opens above the order; closing it brings the order back as it was. */
function invoiceButtons(actions: Element, list: readonly { id: string; numero: string }[]): void {
  actions.insertAdjacentHTML('afterbegin', list.map(invoice => `<button class="btn sec" data-pvfac="${invoice.id}">🧾 ${escapeHtml(invoice.numero)}</button>`).join(''));
  actions.querySelectorAll<HTMLElement>('[data-pvfac]').forEach(button => {
    button.onclick = (): void => { void openStacked(() => { billing2Legacy.openInvoice(button.dataset.pvfac ?? ''); }, t('billingMore.orderInvoices.backToOrder')); };
  });
}

/** v2.339.0: «Ver la factura», first the preview. */
function issueButton(actions: Element, order: OrderSummary, id: string): void {
  if (order.estado !== CONFIRMED || order.sin_cargo || !canInvoice()) return;
  actions.insertAdjacentHTML('afterbegin', `<button class="btn" id="pvemitir">${t('billingMore.orderInvoices.showInvoice')}</button>`);
  const issue = actions.querySelector<HTMLElement>('#pvemitir'); if (issue) issue.onclick = (): void => { void previewOrderInvoice(id); };
}

export async function paintOrderInvoices(id: string): Promise<void> {
  if (!permissions.seesEverything() || !(document.getElementById('dlg') as HTMLDialogElement | null)?.open) return;
  const actions = document.getElementById('dbody')?.querySelector('.acts:last-of-type'); if (!actions) return;
  const { data } = await billing2Legacy.rawRpc<{ pedido?: OrderSummary | null }>('pedido_detalle', { p_id: id });
  const order = data?.pedido; if (!order) return;
  // v2.350.0: only this order's invoices
  const { data: invoices } = await legacyDb().from<{ id: string; numero: string }[]>('facturas').select('id,numero,pedido_id').eq('pedido_id', id);
  if (invoices?.length) invoiceButtons(actions, invoices); else issueButton(actions, order, id);
}
