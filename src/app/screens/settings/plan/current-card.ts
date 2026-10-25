/**
 * «Tu plan» in «Plan y suscripción»: the notices of the subscription (trial, request sent, commitment, cancellation asked, planned
 * change, next receipt, cancelled, unpaid), users contracted and in use, and the buttons to pay, manage, change users or leave.
 * Migrated from the legacy pintarPaginaPlanBase and the notices of Base4–Base9 (v2.420.0), painted at once and in the order they
 * ended up in.
 */
import { term } from '../../../legacy/bridge';
import { planLegacy, type CurrentPlan, type PlanDef } from '../../../legacy/settings4-bridge';
import { t } from '../../../i18n';
import { formatShortDate } from '../../../services/date-format';
import { escapeHtml, formatNumber } from '../../../services/format';

const PERCENT = 100, YEAR_MONTHS_PAID = 10, YEAR_MONTHS = 12;

export interface PlanRequest { creado_en: string; estado: string; tipo: string }

export interface CurrentView {
  base: CurrentPlan; plan: CurrentPlan; definition: PlanDef; used: number; professionals: number;
  canPay: boolean; request: PlanRequest | null; canTalk: boolean;
}

const subscribed = (plan: CurrentPlan): boolean => Boolean(plan.stripe_suscripcion);

function trialNotice(plan: CurrentPlan): string {
  return plan.en_prueba && plan.periodo_fin && !plan.baja_al_final
    ? `<div class="banda-info" id="pgprueba">${t('settingsRest.plan.stripeTrial', { date: formatShortDate(plan.periodo_fin) })}</div>` : '';
}

function requestNotice(request: PlanRequest | null): string {
  if (!request) return '';
  const kind = t(request.tipo === 'contrato' ? 'settingsRest.plan.requestContract' : 'settingsRest.plan.requestBudget');
  return `<div class="banda-info" id="presuest">${t('settingsRest.plan.request', { kind, date: formatShortDate(request.creado_en.slice(0, 10)), state: escapeHtml(planLegacy.requestState(request.estado)) })}${request.estado === 'Nueva' ? t('settingsRest.plan.requestNew') : ''}</div>`;
}

function leavingNotice(plan: CurrentPlan, canPay: boolean): string {
  if (!plan.baja_al_final || plan.estado !== 'activo') return '';
  const date = formatShortDate(plan.periodo_fin ?? '');
  // With a subscription the notice offers to keep it
  const content = canPay && subscribed(plan) ? `${t('settingsRest.plan.leavingWithButton', { date })}
      <button type="button" class="btn sec" id="pgseguir">${t('settingsRest.plan.keep')}</button>` : t('settingsRest.plan.leaving', { date });
  return `<div class="banda-aviso" id="pgbajafin">${content}</div>`;
}

function plannedNotice(plan: CurrentPlan, canManage: boolean): string {
  const change = plan.cambio_previsto; if (!change?.plan) return '';
  const payment = t(change.pago === 'anual' ? 'settingsRest.plan.yearlyLower' : 'settingsRest.plan.monthlyLower');
  return `<div class="banda-info" id="pgprevisto">${t('settingsRest.plan.planned', { date: formatShortDate(change.desde), plan: escapeHtml(planLegacy.of(change.plan).nombre), users: formatNumber(change.usuarios), payment })}
    ${canManage ? `<button type="button" class="btn sec" id="pganular">${t('settingsRest.plan.cancelChange')}</button>` : ''}</div>`;
}

function stateNotices(plan: CurrentPlan): string {
  const next = subscribed(plan) && plan.periodo_fin && plan.estado === 'activo' ? `<p class="sm">${t('settingsRest.plan.nextReceipt', { date: formatShortDate(plan.periodo_fin) })}</p>` : '';
  const cancelled = plan.estado === 'cancelada' ? `<div class="banda-aviso">${t('settingsRest.plan.cancelled', { date: formatShortDate(plan.periodo_fin ?? '') })}</div>` : '';
  const since = plan.impago_desde ? t('settingsRest.plan.unpaidSince', { date: formatShortDate(plan.impago_desde) }) : '';
  const unpaid = plan.estado === 'impago' ? `<div class="banda-peligro">${t('settingsRest.plan.unpaid', { since })}</div>` : '';
  return next + cancelled + unpaid;
}

/** Notices under the title, newest layer first (as they were inserted right after it). */
function noticesHtml(view: CurrentView): string {
  const plan = view.plan, commitment = plan.plan === 'medida' && plan.compromiso_hasta
    ? `<p class="sm" id="pgcomp">${t('settingsRest.plan.commitment', { date: formatShortDate(plan.compromiso_hasta) })}</p>` : '';
  return trialNotice(plan) + requestNotice(view.request) + commitment + leavingNotice(plan, view.canPay) + plannedNotice(plan, view.canPay) + stateNotices(plan);
}

function kpisHtml(view: CurrentView, contracted: number): string {
  const { base, definition } = view, yearly = base.pago === 'anual';
  // With yearly payment 10 months of 12 are paid: the monthly equivalent is price × 10 / 12
  const fee = definition.presupuesto || contracted === Infinity ? null : contracted * (yearly ? definition.precio * YEAR_MONTHS_PAID / YEAR_MONTHS : definition.precio);
  const payment = definition.presupuesto ? t('settingsRest.plan.custom') : t(yearly ? 'settingsRest.plan.yearly' : 'settingsRest.plan.monthly');
  return `<div class="kpis">
        <div class="kpi"><b>${contracted === Infinity ? t('settingsRest.plan.noLimit') : formatNumber(contracted)}</b><span>${t('settingsRest.plan.contracted')}</span></div>
        <div class="kpi"><b>${formatNumber(view.used)}</b><span>${t('settingsRest.plan.inUse')}</span></div>
        <div class="kpi"><b>${payment}</b><span>${t('settingsRest.plan.payment')}</span></div>
        ${fee === null ? '' : `<div class="kpi"><b>${planLegacy.euros(fee)}</b><span>${t('settingsRest.plan.perMonth')}</span></div>`}
        ${definition.medicos === 0 ? '' : `<div class="kpi"><b>${formatNumber(view.professionals)}${definition.medicos ? ` / ${definition.medicos}` : ''}</b><span>${t('settingsRest.plan.withAccess', { Professionals: term('medico', { number: 'p', capital: 'C' }) })}</span></div>`}
      </div>`;
}

function usageHtml(used: number, contracted: number): string {
  if (contracted === Infinity) return '';
  const percent = Math.min(PERCENT, Math.round(used / contracted * PERCENT));
  const extra = used - contracted === 1 ? t('settingsRest.plan.overOne') : t('settingsRest.plan.overMany', { count: formatNumber(used - contracted) });
  return `<div class="barrauso" title="${t('settingsRest.plan.usage', { used: formatNumber(used), total: formatNumber(contracted) })}"><i style="width:${percent}%"></i></div>
      ${used > contracted ? `<div class="banda-aviso" id="plansobre">${t('settingsRest.plan.over', { extra, total: formatNumber(contracted) })}</div>` : ''}`;
}

function actionsHtml(view: CurrentView): string {
  const plan = view.plan, withSubscription = subscribed(plan);
  const pay = view.canPay && plan.plan !== 'medida' ? (withSubscription
    ? `<button type="button" class="btn sec" id="pgusu2">${t('settingsRest.plan.usersButton')}</button><button type="button" class="btn sec" id="pgportal">${t('settingsRest.plan.managePayment')}</button>`
    : `<button type="button" class="btn" id="pgelegir">${t('settingsRest.plan.choose')}</button>`) : '';
  const leave = view.canPay && withSubscription && plan.estado === 'activo' && !plan.baja_al_final ? `<button type="button" class="btn sec" id="pgdarbaja">${t('settingsRest.plan.leave')}</button>` : '';
  const talk = view.canTalk ? `<button type="button" class="btn sec" data-presu="contrato">${t('settingsRest.plan.talk')}</button>` : '';
  return `<div class="acts">${pay}${leave}${talk}</div>`;
}

export function currentCardHtml(view: CurrentView): string {
  const contracted = planLegacy.contractedUsers(), base = view.base;
  return `<div class="card" id="planact"><h2>${t('settingsRest.plan.yourPlan', { plan: escapeHtml(view.definition.nombre) })}</h2>${noticesHtml(view)}
      ${base.estado === 'prueba' ? `<div class="banda-aviso">${t('settingsRest.plan.trial', { date: formatShortDate(base.prueba_hasta ?? '') })}</div>` : ''}
      ${kpisHtml(view, contracted)}
      ${usageHtml(view.used, contracted)}
      ${actionsHtml(view)}</div>`;
}
