/**
 * «Plan y suscripción» and coming back from Stripe: the next receipt with VAT (v2.166.0; with annual payment, the yearly fee, v2.175.0),
 * the payment result and the cancellation when coming back (v2.161.0–v2.167.0), the version in use (v2.161.0) and the companies signed
 * up from the web (v2.168.0). Folded from legado 075, 076 and 077 (v2.425.0): pintarProximoReciboBase and pintarProximoRecibo are one.
 */
import { t } from '../../i18n';
import { byId, signedIn, whenSignedIn } from './dom';
import * as legacyFreeCoreServices from '../services';

const CHECK_EVERY_MS = 1500, CHECKS = 90, VERSION_EVERY_MS = 2000, WELCOME_EVERY_MS = 1000, WELCOME_CHECKS = 60, WELCOME_DELAY_MS = 900;
const SIGNUP_NOTICE_DELAY_MS = 400, BACK_TO_PLAN_FOR_MS = 30000, ANNUAL_MONTHS = 10, MIN_USERS = 3;

interface CurrentPlan { plan?: string; pago?: string; usuarios?: number; stripe_suscripcion?: string; baja_al_final?: boolean; estado?: string; en_prueba?: boolean; periodo_fin?: string }
interface NextReceipt { fecha?: string; total?: number | null }
interface Receipt { primero: number; despues: number; puesta: number; anual: boolean }

const currentPlan = (): CurrentPlan => (PLAN_ACTUAL as CurrentPlan | null | undefined) ?? {};

/** v2.175.0: with annual payment, the fee card shows what is charged in the year. */
function annualFee(cards: NodeListOf<Element>, plan: CurrentPlan): void {
  if (plan.pago !== 'anual' || plan.plan === 'medida') return;
  cards.forEach(card => {
    const label = card.querySelector(':scope > span'), amount = card.querySelector(':scope > b');
    if (!label || !amount || (label.textContent ?? '').trim() !== t('legacyC.plan.perMonth')) return;
    const definition = planDe(plan.plan ?? '') as unknown as { minimo?: number; precio: number };
    const base = Math.max(Number(plan.usuarios) || 0, definition.minimo ?? MIN_USERS) * definition.precio * ANNUAL_MONTHS;
    amount.textContent = eurW(base); label.textContent = t('legacyC.plan.perYear');
    card.querySelector('.kpiiva')?.remove();
    card.insertAdjacentHTML('beforeend', `<span class="sm kpiiva">${t('legacyC.plan.withVat', { amount: eurW(base + ivaDe(base)) })}</span>`);
  });
}

/** The fee of the plan, also with VAT. */
function feeWithVat(cards: NodeListOf<Element>): void {
  cards.forEach(card => {
    const label = card.querySelector(':scope > span'), amount = card.querySelector(':scope > b');
    if (!label || !amount || (label.textContent ?? '').trim() !== t('legacyC.plan.perMonth') || card.querySelector('.kpiiva')) return;
    const value = parseFloat((amount.textContent ?? '').replace(/[^\d,]/g, '').replace(',', '.'));
    if (value > 0) card.insertAdjacentHTML('beforeend', `<span class="sm kpiiva">${t('legacyC.plan.withVat', { amount: eurW(value + ivaDe(value)) })}</span>`);
  });
}

function receiptText(plan: CurrentPlan, next: NextReceipt | null): string {
  const receipt = reciboCalculado(plan) as Receipt;
  const date = next?.fecha ? next.fecha : plan.periodo_fin ?? '', total = next?.total ?? receipt.primero;
  if (!plan.en_prueba) return t('legacyC.plan.nextReceipt', { total: eurW(total) }) + (date ? t('legacyC.plan.onDate', { date: legacyFreeCoreServices.calendar.dayAndMonth(date) }) : '') + '.';
  const setup = receipt.puesta ? t('legacyC.plan.includesSetup', { setup: eurW(receipt.puesta) }) : receipt.anual ? t('legacyC.plan.setupIncluded') : '';
  return t('legacyC.plan.trial', { date: legacyFreeCoreServices.calendar.dayAndMonth(date), total: eurW(total), setup, after: eurW(receipt.despues), every: t(receipt.anual ? 'legacyC.plan.perYearShort' : 'legacyC.plan.perMonthShort') });
}

function receiptBox(title: Element): HTMLElement | null {
  let box = byId('pgrecibo');
  if (!box) {
    const trial = byId('pgprueba');
    if (trial) { trial.id = 'pgrecibo'; box = trial; } else { title.insertAdjacentHTML('afterend', '<div class="banda-info" id="pgrecibo"></div>'); box = byId('pgrecibo'); }
  }
  return box;
}

const charged = (plan: CurrentPlan): boolean => Boolean(plan.stripe_suscripcion) && plan.plan !== 'medida' && !plan.baja_al_final && plan.estado !== 'cancelada';

/** The fee with VAT and the notice of the next receipt in «Plan y suscripción» (the legacy pintarProximoRecibo). */
export function paintNextReceipt(): void {
  const body = byId('cfgcuerpo'), plan = currentPlan();
  if (body) annualFee(body.querySelectorAll('#planact .kpi'), plan);
  const title = body?.querySelector('#planact h2');
  if (!body || !title) return;
  feeWithVat(body.querySelectorAll('#planact .kpi'));
  if (!charged(plan)) return;
  const next = PAGO_PROXIMO as NextReceipt | null, box = receiptBox(title); if (!box) return;
  box.innerHTML = receiptText(plan, next);
  box.dataset.origen = next?.total !== undefined && next.total !== null ? 'stripe' : 'calculo';
  // The date is already in the notice: the loose line «Próximo recibo el …» goes
  body.querySelectorAll('#planact > p.sm').forEach(line => { if ((line.textContent ?? '').trim().startsWith(t('legacyC.plan.looseLine'))) line.remove(); });
}

/** The plan page, then the next receipt (the legacy pintarPaginaPlan). */
export async function paintPlanPage(args: readonly unknown[]): Promise<unknown> {
  const result = await pintarPaginaPlanBase10(...args);
  try { pintarProximoRecibo(); } catch { /* the receipt is optional */ }
  return result;
}

/** v2.161.0: the app tells the database once which version is in use. */
export function reportVersionInUse(): void {
  whenSignedIn(() => { Promise.resolve(RPC_ORIG('version_en_uso', { p_version: VERSION_APP })).then(() => undefined, () => undefined); }, VERSION_EVERY_MS, CHECKS);
}

/** v2.16x: coming back from Stripe: the payment result, then the subscription state. */
export function paymentOnStart(): void {
  whenSignedIn(() => {
    const result = new URLSearchParams(location.search).get('pago');
    if (result) history.replaceState(null, '', location.pathname + location.hash);
    if (result === 'ok') { toast(t('legacyC.plan.paymentReceived')); pagoEsperarActivo(); } else if (result === 'cancelado') toast(t('legacyC.plan.paymentLeft'));
    void pagoCargarEstado();
  }, CHECK_EVERY_MS, CHECKS);
}

/** v2.166.0: coming back from cancelling in Stripe waits for the cancellation (read before the start cleans the address). */
export function cancellationOnStart(): void {
  if (new URLSearchParams(location.search).get('pago') !== 'baja') return;
  let tries = 0;
  const timer = setInterval(() => {
    if (typeof PERFIL !== 'undefined' && PERFIL && !document.body.classList.contains('sin-sesion')) { clearInterval(timer); pagoEsperarBaja(); } else if (++tries > CHECKS) clearInterval(timer);
  }, CHECK_EVERY_MS);
}

/** v2.167.0: coming back from Stripe opens «Plan y suscripción» (only during the first 30 s). */
export const forgetPlanReturnLater = (): void => { setTimeout(() => { PAGO_IR_PLAN = false; }, BACK_TO_PLAN_FOR_MS); };

/** v2.168.0: a company signed up from the web: the login says the e-mail is on its way; the invitation link opens a welcome. */
export function signUpNotices(): void {
  const query = new URLSearchParams(location.search);
  if (query.get('alta') === 'ok') {
    history.replaceState(null, '', location.pathname + location.hash);
    setTimeout(() => {
      const message = byId('lmsg');
      if (message && !(typeof PERFIL !== 'undefined' && PERFIL)) { message.style.color = 'var(--ok)'; message.textContent = t('legacyC.plan.signupLogin'); } else toast(t('legacyC.plan.signupToast'));
    }, SIGNUP_NOTICE_DELAY_MS);
  }
  if (query.get('bienvenida') === '1') {
    history.replaceState(null, '', location.pathname);
    let tries = 0;
    const timer = setInterval(() => {
      if (signedIn()) { clearInterval(timer); setTimeout(bienvenidaAlta, WELCOME_DELAY_MS); } else if (++tries > WELCOME_CHECKS) clearInterval(timer);
    }, WELCOME_EVERY_MS);
  }
}
