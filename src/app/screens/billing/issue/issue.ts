/**
 * Issuing the invoice of a confirmed order (after its preview), the read-only mode of Facturación and the payment state of an
 * order. Migrated from the legacy emitirFacturaPedido, facConsulta and cobroDe (v2.427.0); facConsulta and cobroDe stay as
 * adapters (the plan, Organización and the order list use them).
 */
import { legacyDb, notices } from '../../../legacy/bridge';
import { billing2Legacy } from '../../../legacy/billing2-bridge';
import { t, type MessageKey } from '../../../i18n';

const FULL_PLANS = ['empresa', 'medida'];
/** Values stored in the database. */
const PAID = 'Cobrado', FREE = 'Sin cargo', PENDING = 'Pendiente de cobro';

/** Without Facturación in the plan but with invoices issued, Facturación is read only (see them and download them). */
export function readOnlyBilling(): boolean {
  try { return Boolean(billing2Legacy.paymentState()?.facturas) && !FULL_PLANS.includes(billing2Legacy.currentPlan()); } catch { return false; }
}

interface OrderPayment { sin_cargo?: boolean | null; total?: number | null; pago_estado?: string | null; pago_validado_en?: string | null }

/** «Sin cargo», «Cobrado» or «Pendiente de cobro» (the payment goes apart from the state of the order). */
export function paymentStateOf(order: OrderPayment): string {
  if (order.sin_cargo || billing2Legacy.freeOfCharge(order, order.total)) return FREE;
  return order.pago_estado === PAID || order.pago_validado_en ? PAID : PENDING;
}

interface IssueResult { ok?: boolean; error?: string; numero?: string; id: string }
const ERRORS = new Map<string, MessageKey>([
  ['no_validado', 'billingMore.issue.notConfirmed'], ['distribuidor', 'billingMore.issue.distributor'], ['sin_cargo', 'billingMore.issue.freeOfCharge'],
]);

function failureText(error: unknown, result: IssueResult | null): string {
  if (result?.error === 'ya_facturado') return t('billingMore.issue.alreadyInvoiced', { number: result.numero ?? '' });
  const known = ERRORS.get(result?.error ?? '');
  if (known) return t(known);
  return t('billingMore.issue.couldNotIssue', { error: (error as { message?: string } | null)?.message ?? result?.error ?? '' });
}

async function confirmIssue(orderId: string): Promise<boolean> {
  const { data: detail } = await billing2Legacy.rawRpc<{ contacto?: { nombre?: string; nif?: string | null } | null }>('pedido_detalle', { p_id: orderId });
  const customer = detail?.contacto;
  const warning = !customer ? t('billingMore.issue.noCustomer') : !customer.nif ? t('billingMore.issue.noTaxId', { name: customer.nombre ?? '' }) : '';
  return notices.confirm(t('billingMore.issue.confirm') + warning, { titulo: t('billingMore.issue.confirmTitle'), ok: t('billingMore.issue.confirmOk') });
}

/** Issues the invoice of an order (asking first unless the preview was already seen); the new invoice, or null. */
export async function issueOrderInvoice(orderId: string, options: { yaVista?: boolean } = {}): Promise<IssueResult | null> {
  if (!options.yaVista && !await confirmIssue(orderId)) return null;
  const { data: result, error } = await legacyDb().rpc<IssueResult>('emitir_factura', { p_pedido: orderId });
  if (error || !result || result.ok === false) { notices.toast(failureText(error, result), true); return null; }
  notices.toast(t('billingMore.issue.issued', { number: result.numero ?? '' }));
  return result;
}
