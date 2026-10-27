/**
 * Configuración / Organización → «Plan y suscripción»: your plan with its notices and buttons, the billing data (with a Stripe
 * customer), the plans, the conditions and what each plan includes. Everything is read first and painted at once. Migrated from the
 * legacy pintarPaginaPlanBase–Base10 (v2.420.0): ten layers that painted mail links and replaced them, and added the notices and the
 * billing data afterwards. pintarPaginaPlanBase10 stays as an adapter (legado 076's pintarPaginaPlan adds the next receipt to it).
 */
import { callRpc, cardSectionsLegacy, currentScreen, goTo, legacyDb, notices } from '../../../legacy/bridge';
import { orderMailLegacy } from '../../../legacy/orders-bridge';
import { subscriptionLegacy } from '../../../legacy/orders2-bridge';
import { planLegacy, type CurrentPlan } from '../../../legacy/settings4-bridge';
import { t } from '../../../i18n';
import { formatShortDate } from '../../../services/date-format';
import { escapeHtml } from '../../../services/format';
import { callPayments, loadPaymentState } from '../../orders/subscription/payments';
import { choosePlan } from '../../orders/subscription/choose-plan';
import { conditionsHtml, matrixHtml, plansHtml } from './catalog';
import { currentCardHtml, type PlanRequest } from './current-card';
import { askBudget } from './request';
import { loadLimits, usageCardHtml } from './usage';

const REQUEST_SHOWN_DAYS = 30, DAY_MS = 864e5;

interface PlanUse { plan?: CurrentPlan; usuarios?: number; medicos?: number }
interface BillingData { ok?: boolean; datos?: { nombre?: string; nif?: string; email?: string; direccion?: string } }

/** The last request to delcos while open, or in the last 30 days. */
async function lastRequest(): Promise<PlanRequest | null> {
  try {
    const { data } = await legacyDb().from<PlanRequest[]>('solicitudes_plan').select('creado_en,estado,tipo').order('creado_en', { ascending: false }).limit(1);
    const request = (data ?? [])[0];
    return request && (request.estado !== 'Cerrada' || Date.now() - new Date(request.creado_en).getTime() < REQUEST_SHOWN_DAYS * DAY_MS) ? request : null;
  } catch { return null; }
}

/** Without notices if it fails («Falta» is shown and can be corrected anyway). */
async function billingData(plan: CurrentPlan): Promise<BillingData | null | undefined> {
  if (!plan.stripe_cliente || !subscriptionLegacy.canManageCompany()) return undefined;
  return orderMailLegacy.invoke('pagos', { accion: 'datos' }).then(answer => answer.data as BillingData | null, () => null).catch(() => null);
}

function billingRows(data: BillingData | null): string {
  if (!data?.ok) return `<p class="sm">${t('settingsRest.plan.unreadable')}</p>`;
  const fields = data.datos ?? {};
  const rows: [string, string | undefined][] = [[t('settingsRest.plan.companyName'), fields.nombre], [t('settingsRest.plan.taxId'), fields.nif], [t('settingsRest.plan.receiptEmail'), fields.email], [t('settingsRest.plan.taxAddress'), fields.direccion]];
  const missing = rows.filter(([, value]) => !value).length;
  return rows.map(([name, value]) => `<div class="pgdfila${value ? '' : ' falta'}"><span>${escapeHtml(name)}</span><b>${value ? escapeHtml(value) : t('settingsRest.plan.missing')}</b></div>`).join('')
    + (missing ? `<div class="banda-aviso u-mt-8">${t('settingsRest.plan.missingData')}</div>` : '');
}

function billingHtml(plan: CurrentPlan, data: BillingData | null | undefined): string {
  if (data === undefined) return '';
  const review = plan.en_prueba ? t('settingsRest.plan.billingReview', { date: formatShortDate(plan.periodo_fin ?? '') }) : '';
  return `<div class="card cfgpanel" id="pgdatos"><h2 style="padding:0 0 4px">${t('settingsRest.plan.billingTitle')}</h2>
    <p class="sm">${t('settingsRest.plan.billingHint')}${review}</p>
    <div class="pgdlista">${billingRows(data)}</div>
    <div class="acts"><button type="button" class="btn sec" id="pgdcorr">${t('settingsRest.plan.fixData')}</button></div></div>`;
}

const header = (): string => (['organizacion', 'config'].includes(currentScreen()) ? `<p class="sm">${t('settingsRest.plan.priceNote')}</p>`
  : `<div class="saludo"><div><h1>${t('settingsRest.plan.pageTitle')}</h1><div class="fecha">${t('settingsRest.plan.priceNote')}</div></div></div>`);

async function payAndReload(body: Record<string, unknown>, button: HTMLButtonElement, done: string): Promise<void> {
  const answer = await callPayments(body, button); if (!answer) return;
  notices.toast(t(done === 'cancel' ? 'settingsRest.plan.changeCancelled' : 'settingsRest.plan.kept')); await loadPaymentState(); goTo(currentScreen());
}

function bind(box: HTMLElement, plan: CurrentPlan): void {
  const on = (id: string, action: (button: HTMLButtonElement) => void): void => {
    const button = document.getElementById(id) as HTMLButtonElement | null; if (button) button.onclick = (): void => { action(button); };
  };
  box.querySelectorAll<HTMLElement>('[data-pgplan]').forEach(button => { button.onclick = (): void => { choosePlan(button.dataset.pgplan); }; });
  on('pgusu2', () => { choosePlan(plan.plan); });
  on('pgportal', button => { subscriptionLegacy.openPortal(button); });
  on('pgelegir', () => { choosePlan(); });
  on('pganular', button => { void payAndReload({ accion: 'anular_cambio' }, button, 'cancel'); });
  on('pgseguir', button => { void payAndReload({ accion: 'reanudar' }, button, 'keep'); });
  on('pgdarbaja', button => { void callPayments({ accion: 'baja' }, button).then(answer => { if (answer?.url) location.href = answer.url; }); });
  on('pgdcorr', button => { subscriptionLegacy.openPortal(button); });
  box.querySelectorAll<HTMLElement>('[data-presu]').forEach(button => { button.onclick = (): void => { askBudget(button.dataset.presu ?? ''); }; });
}

export async function paintPlanPage(): Promise<void> {
  const { data } = await callRpc<PlanUse>('plan_uso', {});
  const use = data ?? {}, base = use.plan ?? {};
  if (base.plan) planLegacy.setCurrent(base);
  const plan = planLegacy.current(), definition = planLegacy.of(base.plan), all = planLegacy.all();
  const [request, billing, limits] = await Promise.all([lastRequest(), billingData(plan), loadLimits()]);
  const box = document.getElementById('cfgcuerpo'); if (!box) return;
  const canPay = subscriptionLegacy.canManageCompany(), next = all[all.findIndex(item => item.id === definition.id) + 1] ?? null;
  const view = { currentId: definition.id, next, canPay, subscribed: Boolean(plan.stripe_suscripcion), plan: plan.plan, stripeSubscription: Boolean(plan.stripe_suscripcion) };
  const asksDelcos = all.some(item => item.id !== definition.id && !planLegacy.paymentPlans().includes(item.id));
  const canTalk = plan.plan === 'medida' && !asksDelcos && !cardSectionsLegacy.can('gestionar_plataforma');
  box.innerHTML = `${header()}
    ${currentCardHtml({ base, plan, definition, used: Number(use.usuarios ?? 0), professionals: Number(use.medicos ?? 0), canPay, request, canTalk })}${billingHtml(plan, billing)}${usageCardHtml(limits)}
    ${plansHtml(view)}
    ${conditionsHtml()}
    ${matrixHtml(definition.id)}`;
  bind(box, plan);
}
