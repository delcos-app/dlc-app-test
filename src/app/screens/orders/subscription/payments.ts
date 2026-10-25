/**
 * Subscriptions with Stripe: the server function «pagos», waiting for the plan to be active after paying or cancelled after asking,
 * and the payment state of the company (plan_uso) with its notices on top. Migrated from the legacy pagoLlamar, pagoEsperarActivo,
 * pagoEsperarBaja and pagoCargarEstado (v2.417.0).
 */
import { callRpc, currentScreen, goTo, notices } from '../../../legacy/bridge';
import { orderMailLegacy } from '../../../legacy/orders-bridge';
import { subscriptionLegacy, type PaymentState } from '../../../legacy/orders2-bridge';
import { t } from '../../../i18n';
import { formatShortDate } from '../../../services/date-format';
import { orFallback } from '../../../services/values';
import { paintPaymentNotices } from './notices';

export interface PaymentsAnswer { ok?: boolean; error?: string; url?: string; previsto?: string }

const ACTIVE_TRIES = 20, ACTIVE_WAIT_MS = 3000, CANCEL_TRIES = 15, CANCEL_WAIT_MS = 2000;
const PLAN_SCREENS = ['plan', 'organizacion', 'config'];

const pause = (ms: number): Promise<void> => new Promise(resolve => { setTimeout(resolve, ms); });

/** Shows the plan screen again if it is the one open. */
export function repaintPlanScreen(): void {
  const screen = currentScreen();
  if (PLAN_SCREENS.includes(screen)) goTo(screen);
}

async function answerOf(data: unknown, error: unknown): Promise<PaymentsAnswer | null> {
  if (!error) return data as PaymentsAnswer | null;
  const failure = error as { message?: string; context?: { json(): Promise<unknown> } };
  try { return await failure.context?.json() as PaymentsAnswer; } catch { return { ok: false, ...(failure.message ? { error: failure.message } : {}) }; }
}

/** Calls the server function «pagos» (the button shows «Abriendo…» meanwhile); null if it failed. */
export async function callPayments(body: Record<string, unknown>, button?: HTMLButtonElement | null): Promise<PaymentsAnswer | null> {
  const text = button?.textContent ?? '';
  if (button) { button.disabled = true; button.textContent = t('ordersMore.subscription.opening'); }
  try {
    const { data, error } = await orderMailLegacy.invoke('pagos', body);
    const answer = await answerOf(data, error);
    if (!answer?.ok) { notices.toast(t('ordersMore.subscription.couldNot', { error: orFallback(answer?.error, t('ordersMore.subscription.paymentError')) }), true); return null; }
    return answer;
  } finally { if (button) { button.disabled = false; button.textContent = text; } }
}

/** Reads the payment state (plan_uso), shows its notices and, if the platform mode changes, applies it. */
export async function loadPaymentState(): Promise<void> {
  const before = subscriptionLegacy.platformMode();
  const { data } = await callRpc<PaymentState>('plan_uso', {});
  if (data) {
    subscriptionLegacy.setState(data);
    if (data.plan?.plan) subscriptionLegacy.setPlan(data.plan);
    paintPaymentNotices();
  }
  subscriptionLegacy.markBillingPlan();
  const platform = Boolean(subscriptionLegacy.state()?.plataforma);
  subscriptionLegacy.setPlatformMode(platform);
  if (platform === before) return;
  subscriptionLegacy.applyPlatformMode();
  if (platform && !['delcos', 'config'].includes(currentScreen())) goTo('pd-orgs');
}

/** Back from Stripe: waits for the notice and the plan to be active. */
export async function waitUntilActive(): Promise<void> {
  for (let attempt = 0; attempt < ACTIVE_TRIES; attempt++) {
    await pause(ACTIVE_WAIT_MS);
    await loadPaymentState();
    const plan = subscriptionLegacy.plan();
    if (plan.stripe_suscripcion && plan.estado === 'activo') {
      notices.toast(t('ordersMore.subscription.active', { plan: subscriptionLegacy.planOf(plan.plan as string).nombre }));
      repaintPlanScreen(); return;
    }
  }
  notices.toast(t('ordersMore.subscription.paidSoon'));
}

/** After asking to cancel: waits until the cancellation is registered. */
export async function waitUntilCancelled(): Promise<void> {
  for (let attempt = 0; attempt < CANCEL_TRIES; attempt++) {
    await loadPaymentState();
    const plan = subscriptionLegacy.plan();
    if (plan.baja_al_final || plan.estado === 'cancelada') {
      notices.toast(t('ordersMore.subscription.cancelled', { date: formatShortDate(String(plan.periodo_fin ?? '')) }));
      repaintPlanScreen(); return;
    }
    await pause(CANCEL_WAIT_MS);
  }
  notices.toast(t('ordersMore.subscription.cancelSoon'));
}
