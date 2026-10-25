/**
 * «Plan y suscripción», below the current plan: one card per plan with its button (hire or change online, or ask delcos), the
 * conditions and what each plan includes. Migrated from the legacy pintarPaginaPlanBase–Base5 and Base8 (v2.420.0), which painted
 * mail links and then replaced them; now each button is painted as it ends up.
 */
import { icon, term } from '../../../legacy/bridge';
import { planLegacy, type PlanDef } from '../../../legacy/settings4-bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';

const CUSTOM = 'medida', YEAR_MONTHS_PAID = 10;

export interface PlanView { currentId: string; next: PlanDef | null; canPay: boolean; subscribed: boolean; plan: string | undefined; stripeSubscription: boolean }

/** The button of a plan card that is not yours: hire or change (plans paid online), or ask delcos (the others). */
function planButton(plan: PlanDef, view: PlanView): string {
  const style = plan === view.next ? 'btn' : 'btn sec';
  if (planLegacy.paymentPlans().includes(plan.id)) {
    if (!view.canPay || (view.plan === CUSTOM && !view.stripeSubscription)) return '';
    return `<button type="button" class="${style}" data-pgplan="${plan.id}">${t(view.subscribed ? 'settingsRest.plan.changeTo' : 'settingsRest.plan.hire', { plan: planLegacy.of(plan.id).nombre })}</button>`;
  }
  const customCard = plan.id === CUSTOM;
  return `<button type="button" class="${style}" data-presu="${customCard && view.plan !== CUSTOM ? 'presupuesto' : 'contrato'}">${t(customCard ? 'settingsRest.plan.askBudget' : 'settingsRest.plan.talk')}</button>`;
}

function planCard(plan: PlanDef, view: PlanView): string {
  const euros = planLegacy.euros;
  const price = plan.presupuesto ? t('settingsRest.plan.customPrice')
    : t('settingsRest.plan.price', { price: euros(plan.precio), yearly: euros(plan.anual), year: euros(plan.precio * YEAR_MONTHS_PAID) });
  const button = plan.id === view.currentId ? `<button class="btn sec" disabled>${t('settingsRest.plan.current')}</button>` : planButton(plan, view);
  return `<div class="plan ${plan.id === view.currentId ? 'actual' : ''} ${plan === view.next ? 'dest' : ''}" data-plan="${plan.id}">
      <h3>${escapeHtml(plan.nombre)}</h3><div class="sm">${escapeHtml(plan.para)}</div>
      <div class="precio">${price}</div>
      <ul class="manlist">${plan.ventajas.map(item => `<li><span>✓</span><span>${escapeHtml(item)}</span></li>`).join('')}</ul>
      ${button}</div>`;
}

export const plansHtml = (view: PlanView): string => `<div class="planes">${planLegacy.all().map(plan => planCard(plan, view)).join('')}</div>`;

export function conditionsHtml(): string {
  const items = [t('settingsRest.plan.condition1'), t('settingsRest.plan.condition2', { fee: planLegacy.euros(planLegacy.setupFee()) }), t('settingsRest.plan.condition3'), t('settingsRest.plan.condition4')];
  return `<div class="card" id="plancond"><h2>${t('settingsRest.plan.conditions')}</h2><ul class="manlist">
      ${items.map(item => `<li><span>✓</span><span>${item}</span></li>`).join('\n      ')}</ul></div>`;
}

/** A cell of the matrix: included, not included or a text. */
function cell(plan: PlanDef, currentId: string, value: boolean | string): string {
  const content = value === true ? `<span class="si" role="img" aria-label="${t('settingsRest.plan.included')}">${icon('check')}</span>`
    : value === false ? `<span class="no" role="img" aria-label="${t('settingsRest.plan.notIncluded')}">—</span>` : value;
  return `<td class="${plan.id === currentId ? 'act' : ''}">${content}</td>`;
}

function featureRows(currentId: string): string {
  const plans = planLegacy.all();
  return planLegacy.rows().map(([name, description, included]) => (included === null || (included === undefined && description === null)
    ? `<tr class="plangrupo"><td colspan="${plans.length + 1}">${escapeHtml(name)}</td></tr>`
    : `<tr><td><b>${escapeHtml(name)}</b>${description ? `<span class="sm">${escapeHtml(description)}</span>` : ''}</td>${plans.map(plan => cell(plan, currentId, (included ?? []).includes(plan.id))).join('')}</tr>`)).join('');
}

/** The portal, «see the platform as each person» and the price per user, after the features. */
function extraRows(currentId: string): string {
  const plans = planLegacy.all(), euros = planLegacy.euros;
  const portal = (plan: PlanDef): boolean | string => (plan.medicos === 0 ? false : plan.medicos ? t('settingsRest.plan.upTo', { count: plan.medicos }) : t('settingsRest.plan.noLimit'));
  const price = (plan: PlanDef): string => (plan.presupuesto ? t('settingsRest.plan.custom') : t('settingsRest.plan.priceCell', { price: euros(plan.precio), yearly: euros(plan.anual) }));
  const row = (title: string, hint: string, value: (plan: PlanDef) => boolean | string): string =>
    `<tr><td>${title}<span class="sm">${hint}</span></td>${plans.map(plan => cell(plan, currentId, value(plan))).join('')}</tr>`;
  return row(`<b>${t('settingsRest.plan.portal', { ofTheProfessional: term('medico', { article: 'del' }) })}</b>`, t('settingsRest.plan.portalHint'), portal)
    + row(`<b>${t('settingsRest.plan.asEachPerson')}</b>`, t('settingsRest.plan.asEachPersonHint'), plan => plan.id === CUSTOM)
    + row(`<b>${t('settingsRest.plan.pricePerUser')}</b>`, t('settingsRest.plan.pricePerUserHint'), price);
}

export function matrixHtml(currentId: string): string {
  const plans = planLegacy.all();
  return `<div class="card"><h2>${t('settingsRest.plan.whatIncludes')}</h2><div class="dgrid-wrap"><table class="planmat"><thead><tr><th>${t('settingsRest.plan.module')}</th>${plans.map(plan => `<th class="${plan.id === currentId ? 'act' : ''}">${escapeHtml(plan.nombre)}</th>`).join('')}</tr></thead>
      <tbody>${featureRows(currentId)}${extraRows(currentId)}</tbody></table></div></div>`;
}
