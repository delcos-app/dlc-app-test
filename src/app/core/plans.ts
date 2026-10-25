/**
 * The plans (Campo, Comercial, Empresa, A medida): what each one includes, the comparison rows and the notice of a module that is not
 * in the plan. Migrated from the legacy servicios/planes.js (v2.425.0); planDe, planIncluye, planMinimo, planIncluyeSeccion, esBajada,
 * PLAN_FILAS, avisoPlan… stay as adapters. The current plan (PLAN_ACTUAL) and the catalogue (PLANES) stay in legacy state.
 */
import { coreLegacy, type LegacyPlan } from '../legacy/core-bridge';
import { t } from '../i18n';
import { escapeHtml } from '../services/format';
import { can, canManageOrganization, MODULE_AREA } from './permissions';
import { wordFor } from './vocabulary';

const PLAN_ORDER = ['campo', 'comercial', 'empresa', 'medida'] as const;
const DEFAULT_PLAN_INDEX = 3;

/** Opportunities and the portal come with these plans (the «Extras» button of the delcos panel is for exceptions). */
export const PLAN_EXTRAS: Readonly<Record<string, readonly string[]>> = { oportunidades: ['comercial', 'empresa', 'medida'], portal: ['empresa', 'medida'] };

/** Sections of a module that need a plan (Compras and Proveedores, from Empresa). */
export const PLAN_SECTIONS: Record<string, string[]> = { compras: ['empresa', 'medida'], proveedores: ['empresa', 'medida'] };

export const planOf = (id: string): LegacyPlan => {
  const plans = coreLegacy.plans();
  const plan = plans.find(item => item.id === id) ?? plans[DEFAULT_PLAN_INDEX];
  if (!plan) throw new Error('The plans are not loaded');
  return plan;
};

/** Without Facturación in the plan but with invoices, it opens read only. */
export const planIncludes = (module: string): boolean =>
  !(module in MODULE_AREA) || planOf(coreLegacy.currentPlan().plan).modulos.includes(module) || (module === 'facturacion' && coreLegacy.billingReadOnly());

/** The cheapest plan with a module. */
export const minimumPlan = (module: string): LegacyPlan | undefined => coreLegacy.plans().find(plan => plan.modulos.includes(module));

export const planIncludesSection = (section: string): boolean => !(section in PLAN_SECTIONS) || Boolean(PLAN_SECTIONS[section]?.includes(coreLegacy.currentPlan().plan));

export const currentPlanName = (): string => { try { return planOf(coreLegacy.currentPlan().plan).nombre; } catch { return ''; } };

export const planRank = (id: string): number => (PLAN_ORDER as readonly string[]).indexOf(id);

interface PlanChoice { plan: string; usuarios: number | string; pago?: string }

/** Like the «pagos» function: a smaller plan, fewer users, or from yearly to monthly. */
export const isDowngrade = (from: PlanChoice, to: PlanChoice): boolean => planRank(to.plan) < planRank(from.plan)
  || (planRank(to.plan) === planRank(from.plan) && (Number(to.usuarios) < Number(from.usuarios) || (from.pago === 'anual' && to.pago === 'mensual')));

/** The notice types the role can receive. */
export const notificationTypesOfRole = (): unknown[] => coreLegacy.notificationTypes().filter(type => can(`aviso_${String(type[0])}`));

type ComparisonRow = readonly [string, string | null] | readonly [string, string | null, readonly string[]];

/** Rows of the comparison: [name, detail, plans that include it]; a row without plans is a group title. */
export function planRows(): ComparisonRow[] {
  const all = PLAN_ORDER, fromSales = PLAN_ORDER.slice(1), fromCompany = PLAN_ORDER.slice(2), custom = PLAN_ORDER.slice(3);
  const words = { professionals: wordFor('medico', 'p'), visits: wordFor('visita', 'p'), customers: wordFor('paciente', 'p'), visit: wordFor('visita', 's') };
  const row = (key: string, plans: readonly string[] | null, detail = true): ComparisonRow =>
    (plans ? [t(`core.planRows.${key}` as 'core.planRows.portfolio', words), detail ? t(`core.planRows.${key}Detail` as 'core.planRows.portfolioDetail', words) : null, plans]
      : [t(`core.planRows.${key}` as 'core.planRows.portfolio', words), null]);
  return [
    row('field', null), row('portfolio', all), row('agenda', all), row('routes', all), row('cycle', all), row('samples', all), row('quality', all),
    row('notifications', all), row('users', all), row('import', all),
    row('sale', null), row('orders', fromSales), row('webOrders', fromSales), row('opportunities', fromSales), row('coverage', fromSales), row('events', fromSales),
    row('products', fromSales), row('analytics', fromSales), row('commissions', fromSales),
    row('office', null), row('invoicing', fromCompany), row('purchases', fromCompany), row('deposit', fromCompany), row('surgeries', fromCompany), row('tenders', fromCompany),
    row('equipment', fromCompany), row('audit', fromCompany),
    row('service', null), row('migration', custom), row('support', custom, false),
  ];
}

function noticeHtml(title: string, plan: LegacyPlan | undefined, canChange: boolean): string {
  const current = planOf(coreLegacy.currentPlan().plan).nombre;
  return `<div class="fh"><div><h2>${escapeHtml(title)}</h2><div class="sm">${escapeHtml(t('core.plans.notInPlan', { plan: current }))}</div></div>
    <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
    <p>${t('core.plans.availableFrom', { plan: escapeHtml(plan ? plan.nombre : t('core.plans.custom')) })}${plan ? ` (${coreLegacy.planPrice(plan)})` : ''}.</p>
    ${plan ? `<ul class="manlist">${plan.ventajas.map(advantage => `<li><span>✓</span><span>${escapeHtml(advantage)}</span></li>`).join('')}</ul>` : ''}
    <div class="acts u-end"><button class="btn sec" data-cerrar>${t('core.plans.notNow')}</button>${canChange ? `<button class="btn" id="vplan">${t('core.plans.seePlans')}</button>` : ''}</div>`;
}

function showNotice(html: string): void {
  const body = document.getElementById('dbody'), dialog = document.getElementById('dlg') as HTMLDialogElement | null;
  if (!body || !dialog) return;
  body.innerHTML = html;
  dialog.showModal();
  const button = document.getElementById('vplan');
  if (button) button.onclick = (): void => { dialog.close(); coreLegacy.openPlanSettings(); };
}

/** «🔒 Facturación · Está disponible desde el plan Empresa…» for a module, or a section (Compras, Proveedores) not in the plan. */
export function planNotice(module: string): void {
  const sectionPlans = PLAN_SECTIONS[module];
  if (sectionPlans) {
    showNotice(noticeHtml(coreLegacy.sectionTitle(module) ?? module, planOf(sectionPlans[0] ?? ''), canManageOrganization()));
    return;
  }
  const name = (document.querySelector(`nav.main [data-t="${module}"]`)?.textContent ?? module).replace('🔒', '').trim();
  showNotice(noticeHtml(`🔒 ${name}`, minimumPlan(module), can('administrar')));
}
