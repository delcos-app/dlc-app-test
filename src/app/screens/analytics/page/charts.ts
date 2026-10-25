/**
 * The charts under the indicators of Analítica → Resumen, with the panel's period: sales trend, split by product, the professionals
 * with more sales, the commercial funnel, and activity against results. Migrated from the legacy anGraficos (v2.419.0).
 */
import { commercialStates, legacyDb, permissions, term } from '../../../legacy/bridge';
import { panelsLegacy } from '../../../legacy/panels-bridge';
import { t } from '../../../i18n';
import { escapeHtml, formatNumber } from '../../../services/format';
import { cardSkeleton } from '../../../components/loading';
import { monthBars } from '../../../components/charts/month-bars';
import { emptyChart, rankingBars, shareBars } from '../../../components/charts/small-charts';

interface Month { mes: string; unidades?: number; importe?: number; visitas?: number }
interface Sales { totales?: { unidades?: number }; serie?: Month[]; por_producto?: { nombre: string; unidades?: number }[] }
interface Charts { sales: Sales; top: { clave?: string; nombre: string; unidades: number }[]; activity: Month[]; funnel: Record<string, number> }

const SKELETONS = 4, TOP = 10, PRODUCTS = 20, MIN_BAR = 3;
const box = (): HTMLElement | null => document.getElementById('angraf');
const percent = (part: number, whole: number): number => (whole ? Math.round(part / whole * 100) : 0);

const words = (): Record<string, string> => ({
  professionals: term('medico', { number: 'p' }), Professionals: term('medico', { number: 'p', capital: 'C' }), visits: term('visita', { number: 'p' }),
  theVisits: term('visita', { number: 'p', article: 'el' }), theVisitsRecorded: term('visita', { number: 'p', article: 'el', adjective: 'registrado' }),
});

async function load(from: string, to: string): Promise<Charts> {
  const db = legacyDb();
  const [sales, top, activity, funnel] = await Promise.all([
    db.rpc<Sales>('analitica_v2', { p_dim: 'producto', p_desde: from, p_hasta: to, lim: PRODUCTS }).then(result => result.data ?? {}),
    db.rpc<{ filas?: Charts['top'] }>('analitica_v2', { p_dim: 'medico', p_desde: from, p_hasta: to, lim: TOP }).then(result => result.data?.filas ?? []),
    db.rpc<Month[]>('actividad_mensual', { p_desde: from, p_hasta: to }).then(result => result.data ?? []),
    db.rpc<Record<string, number>>('embudo_comercial').then(result => result.data ?? {}),
  ]);
  return { sales, top, activity, funnel };
}

const card = (title: string, body: string, read: string, wide = false): string =>
  `<div class="card ancard${wide ? ' ancha' : ''}"><h2>${title}</h2>
      ${body}
      <p class="leer">${read}</p></div>`;

function salesCards(charts: Charts, months: readonly string[], bySales: ReadonlyMap<string, Month>): string {
  const units = charts.sales.totales?.unidades ?? 0, products = charts.sales.por_producto ?? [], top = charts.top.filter(row => row.clave !== 'sin');
  const amounts = permissions.canSeeAmounts() ? months.map(month => Number(bySales.get(month)?.importe ?? 0)) : null;
  return card(t('panels.charts.salesTrend'), units ? monthBars(months, months.map(month => bySales.get(month)?.unidades ?? 0), amounts, t('panels.charts.salesSeries').split(',')) : emptyChart(t('panels.charts.salesEmpty')), t('panels.charts.salesRead'), true)
    + card(t('panels.charts.byProduct'), products.length ? shareBars(products.map(row => ({ n: row.nombre, v: Number(row.unidades) || 0 }))) : emptyChart(t('panels.charts.byProductEmpty')), t('panels.charts.byProductRead'))
    + card(t('panels.charts.topProfessionals', words()), top.length ? rankingBars(top.map(row => ({ n: row.nombre, v: row.unidades })), formatNumber) : emptyChart(t('panels.charts.topEmpty', words())), t('panels.charts.topRead', words()));
}

function funnelHtml(funnel: Readonly<Record<string, number>>): string {
  const order = commercialStates.all().filter(state => state.papel !== 'negativo').map(state => state.valor), negative = panelsLegacy.stateWithRole('negativo');
  const total = order.reduce((sum, state) => sum + (Number(funnel[state]) || 0), 0);
  if (!total) return emptyChart(t('panels.charts.funnelEmpty', words()));
  const rows = order.map((state, index) => {
    const value = Number(funnel[state]) || 0, before = index ? Number(funnel[order[index - 1] ?? '']) || 0 : 0;
    return `<div class="emb"><span class="embn">${escapeHtml(state)}</span><span class="embb"><i style="width:${Math.max(MIN_BAR, value / total * 100)}%"></i></span><b>${formatNumber(value)}</b>
          ${index ? `<span class="sm">${before ? t('panels.charts.advances', { percent: percent(value, before + value) }) : ''}</span>` : '<span class="sm"></span>'}</div>`;
  }).join('');
  return `<div class="embudo">${rows}
        ${negative && funnel[negative] ? `<div class="sm u-mt-6">${escapeHtml(negative)}: ${formatNumber(funnel[negative])}</div>` : ''}</div>`;
}

function chartsHtml(charts: Charts, from: string, to: string): string {
  const months = panelsLegacy.monthsBetween(from, to);
  const bySales = new Map((charts.sales.serie ?? []).map(month => [month.mes, month])), byActivity = new Map(charts.activity.map(month => [month.mes, month]));
  const units = charts.sales.totales?.unidades ?? 0;
  const activity = charts.activity.length || units
    ? monthBars(months, months.map(month => byActivity.get(month)?.visitas ?? 0), months.map(month => bySales.get(month)?.unidades ?? 0), [term('visita', { number: 'p', capital: 'C' }), t('panels.charts.unitsSold')])
    : emptyChart(t('panels.charts.activityEmpty', words()));
  return `
    ${panelsLegacy.canUseModule('ventas') ? salesCards(charts, months, bySales) : ''}
    ${card(t('panels.charts.funnel'), funnelHtml(charts.funnel), t('panels.charts.funnelRead', words()))}
    ${card(t('panels.charts.activity'), activity, t('panels.charts.activityRead', words()), true)}`;
}

/** Paints the charts of the period `from`–`to`. */
export async function paintCharts(from: string, to: string): Promise<void> {
  const element = box(); if (!element) return;
  element.innerHTML = Array.from({ length: SKELETONS }, () => `<div class="card">${cardSkeleton(t('panels.charts.loading'))}</div>`).join('');
  const charts = await load(from, to);
  const target = box(); if (!target) return;
  target.innerHTML = chartsHtml(charts, from, to);
}
