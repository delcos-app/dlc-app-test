/**
 * What is lost when changing from one plan to another (to warn before), and the receipt worked out from a plan (first and later).
 * Migrated from the legacy perdidasPlan and reciboCalculado (v2.420.0); both names stay as adapters (Panel delcos, the plan choice
 * and legado 076 use them).
 */
import { term } from '../../../legacy/bridge';
import { planLegacy } from '../../../legacy/settings4-bridge';
import { t } from '../../../i18n';
import { formatNumber } from '../../../services/format';
import { nonZeroOr } from '../../../services/values';

export interface LossData { extras?: readonly string[]; facturas?: boolean; medicos?: number | string }

const MAX_PORTAL_IN_COMPANY = 50, YEAR_MONTHS_PAID = 10, MIN_USERS = 3;

const moduleName = (module: string): string => planLegacy.modules().find(item => item[0] === module)?.[1] ?? module;

function moduleLosses(from: string, to: string, data: LossData | null): string[] {
  const before = planLegacy.of(from), after = planLegacy.of(to), area = planLegacy.moduleAreas();
  return before.modulos.filter(module => !after.modulos.includes(module) && module in area).map(module => (module === 'facturacion'
    ? t(data?.facturas ? 'settingsRest.losses.billingReadOnly' : 'settingsRest.losses.billingNone') : moduleName(module)));
}

function extraLosses(from: string, to: string, data: LossData | null): string[] {
  const extras = data?.extras ?? [], list: string[] = [], plans = planLegacy.extras();
  Object.keys(plans).forEach(extra => {
    const plansOf = plans[extra] ?? [];
    if (!plansOf.includes(from) || plansOf.includes(to) || extras.includes(extra)) return;
    if (extra === 'oportunidades') list.push(t('settingsRest.losses.opportunities'));
    if (extra === 'portal') {
      const count = Number(data?.medicos ?? 0);
      list.push(t('settingsRest.losses.portal', { ofTheProfessional: term('medico', { article: 'del' }) }) + (count ? t('settingsRest.losses.portalLose', { count: formatNumber(data?.medicos) }) : ''));
    }
  });
  return list;
}

export function planLosses(from: string, to: string, data: LossData | null): string[] {
  if (from === to) return [];
  const list = moduleLosses(from, to, data), sections = planLegacy.sections();
  Object.keys(sections).forEach(section => {
    const plans = sections[section] ?? [];
    if (plans.includes(from) && !plans.includes(to)) list.push(planLegacy.sectionTitle(section) ?? section);
  });
  list.push(...extraLosses(from, to, data));
  if (from === 'medida' && to === 'empresa' && Number(data?.medicos ?? 0) > MAX_PORTAL_IN_COMPANY) list.push(t('settingsRest.losses.portalLimit', { count: formatNumber(data?.medicos) }));
  if (from === 'medida') list.push(t('settingsRest.losses.asEachPerson'), t('settingsRest.losses.support'));
  return list;
}

export interface Receipt { primero: number; despues: number; puesta: number; anual: boolean }

/** With yearly payment 10 months of 12 are paid; the set-up fee goes on the first monthly receipt of a trial. */
export function receiptOf(plan: { plan?: string; usuarios?: number | null; pago?: string; en_prueba?: boolean }): Receipt {
  const definition = planLegacy.of(plan.plan), users = Math.max(Number(plan.usuarios ?? 0), nonZeroOr(definition.minimo, MIN_USERS)), yearly = plan.pago === 'anual';
  const fee = users * definition.precio * (yearly ? YEAR_MONTHS_PAID : 1);
  const setup = plan.en_prueba && !yearly ? planLegacy.setupFee() : 0;
  return { primero: fee + setup + planLegacy.vatOf(fee + setup), despues: fee + planLegacy.vatOf(fee), puesta: setup, anual: yearly };
}
