/**
 * «Cobro con tarjeta o Bizum» inside «Pago» of an order: the state of the last link (sent, paid, not paid, expired), «Volver a
 * enviar» and, in the test environment, «Abrir la página de pago». While the payment is awaited and the order is open, it looks every
 * 8 s: when paid, the order is shown again as paid. Migrated from the legacy tpvBloque (v2.417.0).
 */
import { appLegacy, currentScreen, legacyDb, notices } from '../../../legacy/bridge';
import { ordersLegacy } from '../../../legacy/orders-bridge';
import { t } from '../../../i18n';
import { formatShortDate } from '../../../services/date-format';
import { escapeHtml } from '../../../services/format';
import { orFallback } from '../../../services/values';
import { canSendTpv, isTpvPayment, sendTpvLink, tpvActive, TPV_PILLS, TPV_STATES } from './model';

const WATCH_MS = 8000, BIZUM = 'Bizum', SALES_SCREEN = 'ventas';
const OPEN_STATES = ['Confirmado', 'Borrador'], PENDING = 'Pendiente', DRAFT = 'Borrador';

interface TpvPayment { id: string; estado: string; caduca_en?: string | null; metodo?: string | null; pagado_en?: string | null; autorizacion?: string | null; forma_pedida?: string | null; error?: string | null; movil?: string | null; creado_en?: string | null; entorno?: string | null; url_pago?: string | null }
interface OrderPaymentState { estado: string; pago_estado?: string | null; forma_pago?: string | null; sin_cargo?: boolean | null }

let watchTimer: ReturnType<typeof setTimeout> | undefined;

const when = (stamp: string | null | undefined): string =>
  (stamp ? t('ordersMore.tpv.when', { date: formatShortDate(String(stamp).slice(0, 10)), time: new Date(stamp).toTimeString().slice(0, 5) }) : '');
const methodName = (method: string): string => escapeHtml(method === BIZUM ? method : method.toLowerCase());

function shownState(payment: TpvPayment | undefined): string | undefined {
  if (payment?.estado === TPV_STATES.sent && payment.caduca_en && new Date(payment.caduca_en) < new Date()) return TPV_STATES.expired;
  return payment?.estado;
}

function paidText(payment: TpvPayment): string {
  const method = payment.metodo ? t('ordersMore.tpv.with', { method: methodName(payment.metodo) }) : '';
  const authorisation = payment.autorizacion ? t('ordersMore.tpv.authorisation', { code: escapeHtml(payment.autorizacion) }) : '';
  const changed = payment.metodo && payment.forma_pedida && payment.forma_pedida.toLowerCase() !== payment.metodo.toLowerCase();
  const chose = changed ? t('ordersMore.tpv.chose', { asked: escapeHtml(payment.forma_pedida ?? ''), method: methodName(payment.metodo ?? '') }) : '';
  return t('ordersMore.tpv.paidWith', { method, when: when(payment.pagado_en), authorisation, chose });
}

function detailText(payment: TpvPayment | undefined, state: string | undefined, order: OrderPaymentState): string {
  if (!payment) return t('ordersMore.tpv.notSentYet');
  if (state === TPV_STATES.paid) return paidText(payment);
  if (state === TPV_STATES.failed) return escapeHtml(payment.error ?? t('ordersMore.tpv.notAuthorised'));
  const mobile = escapeHtml(payment.movil ?? '');
  if (state === TPV_STATES.expired) return t('ordersMore.tpv.expiredText', { mobile, when: when(payment.creado_en) });
  return t('ordersMore.tpv.waiting', { mobile, when: when(payment.creado_en), draft: order.estado === DRAFT ? t('ordersMore.tpv.confirmsAlone') : '' });
}

function actionsHtml(payment: TpvPayment | undefined, canSend: boolean, testLink: string): string {
  if (!canSend && !testLink) return '';
  return `<div class="acts">
      ${testLink ? `<a class="btn sec chico" id="tpvabrir" href="${escapeHtml(testLink)}" target="_blank" rel="noopener">${t('ordersMore.tpv.openTestPage')}</a>` : ''}
      ${canSend ? `<button type="button" class="btn ${payment ? 'sec ' : ''}chico" id="tpvenviar">${t(payment ? 'ordersMore.tpv.sendAgain' : 'ordersMore.tpv.sendLink')}</button>` : ''}</div>`;
}

function blockHtml(payment: TpvPayment | undefined, state: string | undefined, order: OrderPaymentState, canSend: boolean): string {
  const pill = TPV_PILLS.get(state ?? '');
  const testLink = payment?.entorno === 'pruebas' && state === TPV_STATES.sent ? payment.url_pago ?? '' : '';
  return `<div class="tpvped" id="pdtpv">
    <div class="pdpagof"><span class="sm">${t('ordersMore.tpv.title')}</span>${pill ? `<span class="pill ${pill[1]}">${t(pill[0])}</span>` : ''}</div>
    <p class="sm">${detailText(payment, state, order)}</p>
    ${actionsHtml(payment, canSend, testLink)}</div>`;
}

const stillOpen = (): boolean => Boolean((document.getElementById('dlg') as HTMLDialogElement | null)?.open) && Boolean(document.getElementById('pdtpv'));

function repaint(id: string): void { document.getElementById('pdtpv')?.remove(); void tpvBlock(id); }

/** While the link is awaited, the order is looked at every 8 s: when paid, it is shown again. */
function watch(id: string, payment: TpvPayment, order: OrderPaymentState): void {
  watchTimer = setTimeout(async function look() {
    if (!stillOpen()) return;
    const { data: now } = await legacyDb().from<{ estado: string } | null>('pagos_tpv').select('estado').eq('id', payment.id).maybeSingle();
    if (!stillOpen()) return;
    if (now?.estado === TPV_STATES.paid) {
      notices.toast(t(order.estado === DRAFT ? 'ordersMore.tpv.paidConfirmed' : 'ordersMore.tpv.paid')); appLegacy.forgetCache(); appLegacy.openOrder(id);
      if (currentScreen() === SALES_SCREEN) ordersLegacy.reload();
      return;
    }
    if (now && now.estado !== TPV_STATES.sent) { repaint(id); return; }
    watchTimer = setTimeout(look, WATCH_MS);
  }, WATCH_MS);
}

function bindSend(id: string, payment: TpvPayment | undefined, state: string | undefined): void {
  const button = document.getElementById('tpvenviar') as HTMLButtonElement | null; if (!button) return;
  button.onclick = async (): Promise<void> => {
    if (payment && state === TPV_STATES.sent && !await notices.confirm(t('ordersMore.tpv.resendText'), { titulo: t('ordersMore.tpv.resendTitle'), ok: t('ordersMore.tpv.send') })) return;
    button.disabled = true;
    const result = await sendTpvLink(id);
    button.disabled = false;
    if (result.ok && document.getElementById('pdtpv')) repaint(id);
  };
}

/** The order can still be paid and the user can send the link. */
const canSendFor = (order: OrderPaymentState): boolean =>
  OPEN_STATES.includes(order.estado) && orFallback(order.pago_estado, PENDING) === PENDING && !order.sin_cargo
  && tpvActive() && isTpvPayment(order.forma_pago) && canSendTpv();

async function read(id: string): Promise<{ payment: TpvPayment | undefined; order: OrderPaymentState | null }> {
  const [{ data: payments }, { data: order }] = await Promise.all([
    legacyDb().from<TpvPayment[]>('pagos_tpv').select('*').eq('pedido_id', id).neq('estado', 'Anulado').order('creado_en', { ascending: false }).limit(1),
    legacyDb().from<OrderPaymentState | null>('pedidos').select('estado,pago_estado,forma_pago,sin_cargo').eq('id', id).maybeSingle()]);
  return { payment: (payments ?? [])[0], order };
}

/** Adds the card payment block to «Pago» of the open order (only if there is a link or one can be sent). */
export async function tpvBlock(id: string): Promise<void> {
  if (!document.getElementById('pdpago') || document.getElementById('pdtpv')) return;
  const { payment, order } = await read(id);
  const box = document.getElementById('pdpago');
  if (!box || document.getElementById('pdtpv') || !order) return;
  const canSend = canSendFor(order);
  if (!payment && !canSend) return;
  const state = shownState(payment);
  box.insertAdjacentHTML('beforeend', blockHtml(payment, state, order, canSend));
  bindSend(id, payment, state);
  clearTimeout(watchTimer);
  if (payment && state === TPV_STATES.sent) watch(id, payment, order);
}
