/**
 * The window to contract or change the subscription: plan, monthly or yearly payment and users, the receipt with VAT and, when it is
 * a downgrade, the date it applies and what is lost. Migrated from the legacy elegirPago (v2.417.0); elegirPago stays as an adapter
 * (Configuración and the tests open it).
 */
import { notices } from '../../../legacy/bridge';
import { subscriptionLegacy, type PlanInfo } from '../../../legacy/orders2-bridge';
import { t } from '../../../i18n';
import { formatShortDate } from '../../../services/date-format';
import { escapeHtml, formatNumber } from '../../../services/format';
import { euros } from '../model';
import { callPayments, loadPaymentState, repaintPlanScreen, waitUntilActive } from './payments';

const MIN_USERS = 3, YEARLY_MONTHS = 10, VAT_RATE = 21, CUSTOM = 'medida', YEARLY = 'anual', MONTHLY = 'mensual', DEFAULT_PLAN = 'comercial';

interface Choice { plan: string; pago: string; usuarios: number }
interface Context { current: Record<string, unknown>; subscribed: boolean; used: number; was: Choice }

const planOf = (id: string): PlanInfo => subscriptionLegacy.planOf(id);

function amounts(choice: Choice, subscribed: boolean): { base: number; setup: number; vat: number } {
  const plan = planOf(choice.plan), yearly = choice.pago === YEARLY;
  const base = yearly ? plan.precio * YEARLY_MONTHS * choice.usuarios : plan.precio * choice.usuarios;
  const setup = !yearly && !subscribed ? subscriptionLegacy.setupFee() : 0;
  return { base, setup, vat: Math.round((base + setup) * VAT_RATE) / 100 };
}

const isDowngrade = (context: Context, choice: Choice): boolean =>
  context.subscribed && subscriptionLegacy.isDowngrade(context.was as unknown as Record<string, unknown>, choice as unknown as Record<string, unknown>);
const endDate = (context: Context): string =>
  (context.current.periodo_fin ? formatShortDate(String(context.current.periodo_fin)) : t('ordersMore.choosePlan.endOfPeriod'));

function downgradeHtml(context: Context, choice: Choice): string {
  if (!isDowngrade(context, choice)) return '';
  const state = { ...(subscriptionLegacy.state() ?? {}), extras: context.current.extras };
  const lost = subscriptionLegacy.losses(String(context.current.plan), choice.plan, state);
  const list = lost.length ? `${t('ordersMore.choosePlan.youLose')}<ul id="pgpierde">${lost.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : '.';
  return `<div class="banda-aviso" id="pgbaja">${t('ordersMore.choosePlan.downgrade', { date: escapeHtml(endDate(context)), plan: escapeHtml(planOf(String(context.current.plan)).nombre) })}${list}</div>`;
}

function receiptHtml(context: Context, choice: Choice): string {
  const plan = planOf(choice.plan), yearly = choice.pago === YEARLY, { base, setup, vat } = amounts(choice, context.subscribed);
  const label = !context.subscribed ? t('ordersMore.choosePlan.firstCharge')
    : isDowngrade(context, choice) ? t('ordersMore.choosePlan.amountFrom', { date: escapeHtml(endDate(context)) }) : t('ordersMore.choosePlan.newAmount');
  return `<div class="pgres">
        <div><span>${formatNumber(choice.usuarios)} × ${euros(yearly ? plan.precio * YEARLY_MONTHS : plan.precio)} ${t(yearly ? 'ordersMore.choosePlan.perYear' : 'ordersMore.choosePlan.perMonth')}</span><b>${euros(base)}</b></div>
        ${setup ? `<div><span>${t('ordersMore.choosePlan.setup')}</span><b>${euros(setup)}</b></div>` : ''}
        <div><span>${t('ordersMore.choosePlan.vat')}</span><b>${euros(vat)}</b></div>
        <div class="pgtot"><span>${label}</span><b>${euros(base + setup + vat)}</b></div></div>`;
}

function headerHtml(context: Context, choice: Choice): string {
  const note = !context.subscribed ? t('ordersMore.choosePlan.stripePage') : isDowngrade(context, choice) ? '' : t('ordersMore.choosePlan.appliedNow');
  return `<div class="fh"><div><h2>${t(context.subscribed ? 'ordersMore.choosePlan.changeTitle' : 'ordersMore.choosePlan.contractTitle')}</h2>
        <div class="sm">${t('ordersMore.choosePlan.pricesPerUser')} ${note}</div></div>
        <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>`;
}

function choicesHtml(context: Context, choice: Choice): string {
  const yearly = choice.pago === YEARLY, minimum = Math.max(MIN_USERS, context.used);
  const plans = subscriptionLegacy.plans().map(key => `<button type="button" data-pgp="${key}" class="${choice.plan === key ? 'on' : ''}" aria-pressed="${String(choice.plan === key)}">${escapeHtml(planOf(key).nombre)} · ${euros(planOf(key).precio)}</button>`).join('');
  return `<label>${t('ordersMore.choosePlan.plan')}</label><div class="segs pgplan" role="group">${plans}</div>
      <label class="u-mt-12">${t('ordersMore.choosePlan.payment')}</label><div class="segs" role="group">
        <button type="button" data-pga="${MONTHLY}" class="${yearly ? '' : 'on'}" aria-pressed="${String(!yearly)}">${t('ordersMore.choosePlan.monthly')}</button>
        <button type="button" data-pga="${YEARLY}" class="${yearly ? 'on' : ''}" aria-pressed="${String(yearly)}">${t('ordersMore.choosePlan.yearly')}</button></div>
      <label for="pgusu" class="u-mt-12">${t('ordersMore.choosePlan.users')}</label><input id="pgusu" type="number" min="${minimum}" value="${choice.usuarios}" class="numw">
      <span class="sm">${context.used ? t('ordersMore.choosePlan.usingNow', { count: formatNumber(context.used) }) : ''}${t('ordersMore.choosePlan.minimum', { count: minimum })}</span>`;
}

function windowHtml(context: Context, choice: Choice): string {
  const okKey = !context.subscribed ? 'ordersMore.choosePlan.goToPayment' : isDowngrade(context, choice) ? 'ordersMore.choosePlan.schedule' : 'ordersMore.choosePlan.confirm';
  return `${headerHtml(context, choice)}
      ${choicesHtml(context, choice)}
      ${downgradeHtml(context, choice)}
      ${receiptHtml(context, choice)}
      <div class="acts u-end"><button class="btn sec" data-cerrar>${t('ordersMore.choosePlan.cancel')}</button>
        <button class="btn" id="pgok">${t(okKey)}</button></div>`;
}

async function confirm(context: Context, choice: Choice, button: HTMLButtonElement): Promise<void> {
  const answer = await callPayments({ accion: context.subscribed ? 'cambiar' : 'checkout', plan: choice.plan, pago: choice.pago, usuarios: choice.usuarios }, button);
  if (!answer) return;
  if (answer.url) { location.href = answer.url; return; }
  (document.getElementById('dlg') as HTMLDialogElement | null)?.close();
  if (answer.previsto) {
    notices.toast(t('ordersMore.choosePlan.scheduled', { date: formatShortDate(answer.previsto) }));
    await loadPaymentState(); repaintPlanScreen(); return;
  }
  notices.toast(t('ordersMore.choosePlan.done')); void waitUntilActive();
}

function paint(context: Context, choice: Choice): void {
  const body = document.getElementById('dbody'); if (!body) return;
  body.innerHTML = windowHtml(context, choice);
  const repaint = (): void => { paint(context, choice); };
  body.querySelectorAll<HTMLElement>('[data-pgp]').forEach(button => { button.onclick = (): void => { choice.plan = button.dataset.pgp ?? choice.plan; repaint(); }; });
  body.querySelectorAll<HTMLElement>('[data-pga]').forEach(button => { button.onclick = (): void => { choice.pago = button.dataset.pga ?? choice.pago; repaint(); }; });
  const users = document.getElementById('pgusu') as HTMLInputElement | null;
  if (users) users.onchange = (): void => { choice.usuarios = Math.max(MIN_USERS, context.used, Math.floor(Number(users.value) || 0)); repaint(); };
  const ok = document.getElementById('pgok') as HTMLButtonElement | null;
  if (ok) ok.onclick = (): void => { void confirm(context, choice, ok); };
}

/** Opens the window, starting on `initialPlan` if it is one of the plans. */
export function choosePlan(initialPlan?: string | null): void {
  const current = subscriptionLegacy.plan(), plans = subscriptionLegacy.plans();
  if (current.plan === CUSTOM) { notices.toast(t('ordersMore.choosePlan.custom')); return; }
  const used = Number(subscriptionLegacy.state()?.usuarios ?? 0) || 0, pago = current.pago === YEARLY ? YEARLY : MONTHLY;
  const plan = plans.includes(initialPlan ?? '') ? String(initialPlan) : plans.includes(String(current.plan)) ? String(current.plan) : DEFAULT_PLAN;
  const context: Context = { current, subscribed: Boolean(current.stripe_suscripcion), used, was: { plan: current.plan as string, pago, usuarios: Number(current.usuarios) || 0 } };
  paint(context, { plan, pago, usuarios: Math.max(MIN_USERS, used, Number(current.usuarios) || 0) });
  (document.getElementById('dlg') as HTMLDialogElement | null)?.showModal();
}
