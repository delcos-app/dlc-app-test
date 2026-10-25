/**
 * Notices on top about the subscription: a pending charge or read-only company, and the last 7 days of the trial (which never covers
 * the payment notice). Migrated from the legacy pagoAvisoBase and pagoAviso (v2.417.0); pagoAviso stays as an adapter (tests).
 */
import { goTo } from '../../../legacy/bridge';
import { subscriptionLegacy } from '../../../legacy/orders2-bridge';
import { t } from '../../../i18n';
import { formatShortDate } from '../../../services/date-format';

const LAST_TRIAL_DAYS = 7;

/** The band on top of main with that id, created if missing (null without main). */
function band(id: string, className: string, role: string): HTMLElement | null {
  const existing = document.getElementById(id); if (existing) return existing;
  const main = document.querySelector('main'); if (!main) return null;
  main.insertAdjacentHTML('afterbegin', `<div id="${id}" class="${className}" role="${role}"></div>`);
  return document.getElementById(id);
}

function paymentText(): string {
  const state = subscriptionLegacy.state() ?? {};
  if (state.solo_lectura) return t('ordersMore.subscription.readOnly');
  return state.plan?.estado === 'impago' ? t('ordersMore.subscription.unpaid') : '';
}

function paintPaymentBand(): void {
  const text = paymentText();
  if (!text) { document.getElementById('pagoaviso')?.remove(); return; }
  const element = band('pagoaviso', 'banda-peligro', 'alert'); if (!element) return;
  const canManage = subscriptionLegacy.canManageCompany();
  element.innerHTML = text + (canManage ? ` <button type="button" class="btn sec" id="pgavbtn">${t('ordersMore.subscription.managePayment')}</button>` : t('ordersMore.subscription.tellManager'));
  const button = document.getElementById('pgavbtn');
  if (button) button.onclick = (): void => { subscriptionLegacy.openPortal(button); };
}

function trialWhen(days: number): string {
  if (days === 0) return t('ordersMore.subscription.today');
  return days === 1 ? t('ordersMore.subscription.tomorrow') : t('ordersMore.subscription.inDays', { count: days });
}

/** In the last days of the trial (and without the payment notice), who manages the company is warned. */
function trialDaysLeft(plan: Record<string, unknown>): number | null {
  const days = subscriptionLegacy.daysUntil(plan.periodo_fin);
  if (!plan.en_prueba || plan.baja_al_final || days === null || days < 0 || days > LAST_TRIAL_DAYS) return null;
  return document.getElementById('pagoaviso') || !subscriptionLegacy.canManageCompany() ? null : days;
}

function paintTrialBand(): void {
  const plan = subscriptionLegacy.state()?.plan ?? subscriptionLegacy.plan(), days = trialDaysLeft(plan);
  if (days === null) { document.getElementById('pruebaaviso')?.remove(); return; }
  const element = band('pruebaaviso', 'banda-info', 'status'); if (!element) return;
  element.innerHTML = `${t('ordersMore.subscription.trialEnds', { when: trialWhen(days), date: formatShortDate(String(plan.periodo_fin)) })}
    ${t('ordersMore.subscription.reviewData')} <button type="button" class="btn sec" id="pruebaver">${t('ordersMore.subscription.reviewButton')}</button>`;
  const button = document.getElementById('pruebaver'); if (button) button.onclick = (): void => { goTo('plan'); };
}

/** Paints (or removes) both notices from the current payment state. */
export function paintPaymentNotices(): void {
  paintPaymentBand();
  paintTrialBand();
}
