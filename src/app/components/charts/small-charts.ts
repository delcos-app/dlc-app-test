/**
 * Small charts shared by several screens: a ranking in horizontal bars, the share per product, the units sparkline of a card, the
 * six-month line of a home card, the donut and the empty state. Migrated from componentes/graficos.js (v2.416.0); barrasH,
 * barrasReparto, sparkUnidades, anLinea, svgDonut and vacioGrafico stay as adapters.
 */
import { t } from '../../i18n';
import { formatShortDate } from '../../services/date-format';
import { escapeHtml, formatNumber } from '../../services/format';
import { sum } from '../../services/values';
import { periodLabel, shortMonthOf } from './labels';

export interface ChartItem { n: string; v: number }

/** Brand chart palette (checked for colour blindness); grey for the rest. */
export const CHART_COLOURS = ['#3F82C0', '#E0762B', '#1BAF7A', '#6E5BC4', '#E0A400', '#D9618C', '#94A3B8'];
const MAX_PRODUCTS = 10, SPARK_POINTS = 5, SPARK_WIDTH = 200, SPARK_HEIGHT = 40, DONUT_RADIUS = 70;

/** «1. Name ███ value» rows, scaled to the biggest. */
export function rankingBars(items: readonly ChartItem[], format: (value: number) => string): string {
  const max = Math.max(1, ...items.map(item => item.v));
  return `<div class="barrash">${items.map((item, index) => `<div class="bh"><span class="bhn">${index + 1}. ${escapeHtml(item.n)}</span>
    <span class="bhb"><i style="width:${Math.max(2, item.v / max * 100)}%"></i></span><b>${format(item.v)}</b></div>`).join('')}</div>`;
}

const percentText = (value: number, total: number): string => { const percent = value / total * 100; return `${percent > 0 && percent < 1 ? '<1' : Math.round(percent)} %`; };

/** «Reparto por producto»: total on top and, per product, a bar with units and percentage, up to ten (the rest in «Otros»). */
export function shareBars(items: readonly ChartItem[]): string {
  const sorted = [...items].sort((first, second) => second.v - first.v), total = sum(sorted.map(item => item.v)) || 1;
  const shown = sorted.length > MAX_PRODUCTS
    ? [...sorted.slice(0, MAX_PRODUCTS - 1), { n: t('components.charts.others', { count: sorted.length - MAX_PRODUCTS + 1 }), v: sum(sorted.slice(MAX_PRODUCTS - 1).map(item => item.v)) }] : sorted;
  return `<div class="reptot"><b>${formatNumber(total)}</b> ${t(sorted.length === 1 ? 'components.charts.unitsOneProduct' : 'components.charts.unitsProducts', { count: formatNumber(sorted.length) })}</div>
    <div class="barrash reparto">${shown.map(item => `<div class="bh"><span class="bhn" title="${escapeHtml(item.n)}">${escapeHtml(item.n)}</span>
      <svg class="bhsvg" viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden="true"><rect class="f" width="100" height="12" rx="6"/><rect class="v" width="${Math.max(2, item.v / total * 100).toFixed(1)}" height="12" rx="6"/></svg><b>${formatNumber(item.v)}</b><span class="sm bhp">${percentText(item.v, total)}</span></div>`).join('')}</div>`;
}

export interface UnitsHistory { semanas?: { unidades: number; semana: string }[]; meses?: { unidades: number; mes: string }[]; anios?: { unidades: number; anio: string | number }[] }

type Bar = [number, string, string];

function barsOf(units: UnitsHistory, series: string): Bar[] {
  if (series === 'semana') return (units.semanas ?? []).map(item => [item.unidades, t('components.charts.weekOf', { date: formatShortDate(item.semana) }), formatShortDate(item.semana)]);
  if (series === 'anio') return (units.anios ?? []).map(item => [item.unidades, String(item.anio), String(item.anio)]);
  return (units.meses ?? []).map(item => [item.unidades, periodLabel(item.mes), periodLabel(item.mes)]);
}

/** Units of an account by week, month or year: empty bars as base line, the current one highlighted, the end dates under it. */
export function unitsSparkline(units: UnitsHistory, series: string): string {
  const bars = barsOf(units, series), max = Math.max(1, ...bars.map(bar => bar[0]));
  return bars.map(([count, title, label], index) => `<i class="${count ? '' : 'cero'}${index === bars.length - 1 ? ' actual' : ''}" style="height:${Math.round(count / max * 100)}%" title="${escapeHtml(title)}: ${formatNumber(count)}"${index === 0 ? ` data-ini="${escapeHtml(label)}"` : ''}${index === bars.length - 1 ? ` data-fin="${escapeHtml(label)}"` : ''}></i>`).join('');
}

/** The six-month line of a home card with the month names under it. */
export function sixMonthLine(values: readonly number[], months: readonly (readonly [string, ...unknown[]])[]): string {
  const max = Math.max(...values), min = Math.min(...values, 0), spread = (max - min) || 1;
  const points = values.map((value, index) => [index * SPARK_WIDTH / SPARK_POINTS, SPARK_HEIGHT - 4 - (SPARK_HEIGHT - 8) * (value - min) / spread] as const);
  const path = points.map((point, index) => `${index ? 'L' : 'M'}${point[0].toFixed(1)} ${point[1].toFixed(1)}`).join(' ');
  const [lastX = 0, lastY = 0] = points[SPARK_POINTS] ?? [];
  return `<svg class="avsp" viewBox="0 0 200 46" preserveAspectRatio="none" aria-hidden="true"><path class="a" d="${path} L200 46 L0 46 Z"/><path class="l" pathLength="100" d="${path}"/></svg>
    <span class="avpt" style="left:${(lastX / 2).toFixed(1)}%;top:${(lastY / 46 * 100).toFixed(1)}%"></span>
    <div class="avm">${months.map(([month]) => `<span>${shortMonthOf(month)}</span>`).join('')}</div>`;
}

/** Donut with the total in the middle and the legend beside it. */
export function donut(items: readonly ChartItem[]): string {
  const total = sum(items.map(item => item.v)) || 1, circumference = 2 * Math.PI * DONUT_RADIUS, colour = (index: number): string => CHART_COLOURS[index % CHART_COLOURS.length] ?? '';
  let offset = 0;
  const arcs = items.map((item, index) => {
    const length = circumference * item.v / total;
    const arc = `<circle cx="100" cy="100" r="${DONUT_RADIUS}" stroke="${colour(index)}" stroke-dasharray="${length} ${circumference - length}" stroke-dashoffset="${-offset}" class="arco"><title>${escapeHtml(item.n)}: ${formatNumber(item.v)} (${Math.round(item.v / total * 100)}%)</title></circle>`;
    offset += length; return arc;
  }).join('');
  return `<div class="donutw"><svg viewBox="0 0 200 200" class="donut" role="img" aria-label="${t('components.charts.shareByProduct')}">
    <circle cx="100" cy="100" r="${DONUT_RADIUS}" class="fondo"/>
    ${arcs}
    <text x="100" y="96" class="dn1">${formatNumber(total)}</text><text x="100" y="116" class="dn2">${t('components.charts.units')}</text></svg>
    <div class="donutley">${items.map((item, index) => `<span><i style="background:${colour(index)}"></i>${escapeHtml(item.n)} <b>${Math.round(item.v / total * 100)}%</b></span>`).join('')}</div></div>`;
}

export const emptyChart = (text: string): string =>
  `<div class="gvacio"><span>📊</span><b>${t('components.charts.noData')}</b><span class="sm">${escapeHtml(text)}</span></div>`;
