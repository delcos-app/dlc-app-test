/**
 * Panel delcos → Cobros: the payment state of each company (from ajustes.plan, kept by the Stripe notice), its monthly amount, «hace
 * …» and the indicator tiles with their skeleton. Migrated from the legacy pdCobroEstado, pdMensual, pdHace, pdKpis and pdEsqueleto
 * (v2.417.0); those names stay as adapters (the Panel delcos bridge uses them).
 */
import { subscriptionLegacy } from '../../../legacy/orders2-bridge';
import { platformLegacy } from '../../../legacy/platform-bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { nonZeroOr, orFallback } from '../../../services/values';

const DAY_MS = 864e5, MINUTE_MS = 60000, HOUR_MINUTES = 60, DAY_MINUTES = 1440, GRACE_DAYS = 14, MIN_USERS = 3, SKELETON_TILES = 4;

interface CompanyPlan { estado?: string; impago_desde?: string; en_prueba?: boolean; prueba_hasta?: string; periodo_fin?: string; stripe_suscripcion?: string; plan?: string; usuarios?: number; pago?: string }
interface Company { bloqueada?: string | null; plan_datos?: CompanyPlan | null }

const until = (isoDate: string | undefined): string => (isoDate ? t('ordersMore.billing.until', { date: platformLegacy.shortDate(isoDate) }) : '');

function unpaid(plan: CompanyPlan): [string, string, string] {
  const days = plan.impago_desde ? Math.round((Date.now() - new Date(`${plan.impago_desde}T12:00:00`).getTime()) / DAY_MS) : 0;
  return [t('ordersMore.billing.unpaid'), 'p-urg', days >= GRACE_DAYS ? t('ordersMore.billing.readOnlySince', { count: days - GRACE_DAYS }) : t('ordersMore.billing.graceLeft', { count: GRACE_DAYS - days })];
}

function withoutCard(plan: CompanyPlan): [string, string, string] {
  const custom = plan.plan === 'medida';
  return [t(custom ? 'ordersMore.billing.custom' : 'ordersMore.billing.noSubscription'), 'p-per', t(custom ? 'ordersMore.billing.contract' : 'ordersMore.billing.noCard')];
}

/** [state, pill class, detail] of a company's payments. */
export function companyPaymentState(company: Company): [string, string, string] {
  const plan = company.plan_datos ?? {};
  if (company.bloqueada) return [t('ordersMore.billing.blocked'), 'p-anu', t(company.bloqueada === 'desactivada' ? 'ordersMore.billing.deactivated' : 'ordersMore.billing.trialOver')];
  if (plan.estado === 'cancelada') return [t('ordersMore.billing.cancelled'), 'p-anu', plan.periodo_fin ? t('ordersMore.billing.accessUntil', { date: platformLegacy.shortDate(plan.periodo_fin) }) : ''];
  if (plan.estado === 'impago') return unpaid(plan);
  if (plan.en_prueba || plan.estado === 'prueba') return [t('ordersMore.billing.inTrial'), 'p-warn', until(orFallback(plan.prueba_hasta, plan.periodo_fin ?? ''))];
  if (!plan.stripe_suscripcion) return withoutCard(plan);
  return [t('ordersMore.billing.upToDate'), 'p-est', plan.periodo_fin ? t('ordersMore.billing.nextCharge', { date: platformLegacy.shortDate(plan.periodo_fin) }) : ''];
}

/** What the company pays a month by card (0 without subscription, cancelled or custom). */
export function monthlyAmount(plan: CompanyPlan | null | undefined): number {
  if (!plan?.stripe_suscripcion || plan.estado === 'cancelada' || plan.plan === 'medida') return 0;
  const info = subscriptionLegacy.planOf(plan.plan), users = Math.max(Number(plan.usuarios) || 0, nonZeroOr(info.minimo, MIN_USERS));
  return (plan.pago === 'anual' ? nonZeroOr(info.anual, info.precio) : info.precio) * users;
}

/** «hace 5 min», «hace 3 h», «hace 2 días» (— without date). */
export function ago(stamp: string | null | undefined): string {
  if (!stamp) return '—';
  const minutes = Math.round((Date.now() - new Date(stamp).getTime()) / MINUTE_MS);
  if (minutes < HOUR_MINUTES) return t('ordersMore.billing.minutesAgo', { count: Math.max(1, minutes) });
  return minutes < DAY_MINUTES ? t('ordersMore.billing.hoursAgo', { count: Math.round(minutes / HOUR_MINUTES) }) : t('ordersMore.billing.daysAgo', { count: Math.round(minutes / DAY_MINUTES) });
}

/** Indicator tiles: [value, text, extra class]. */
export const kpiTiles = (tiles: readonly (readonly [string | number, string, string?])[]): string =>
  `<div class="pdkpis">${tiles.map(([value, text, extra]) => `<div class="pdkpi${extra ? ` ${extra}` : ''}"><b>${value}</b><span>${escapeHtml(text)}</span></div>`).join('')}</div>`;

export const billingSkeleton = (): string =>
  `<div class="card cfgpanel"><div class="pdkpis">${'<div class="pdkpi"><div class="skel" style="width:50%"></div><div class="skel" style="width:70%"></div></div>'.repeat(SKELETON_TILES)}</div><div class="skel"></div><div class="skel" style="width:80%"></div></div>`;
