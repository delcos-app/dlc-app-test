/** «Mes a mes» view of «Pedidos tras la visita»: visits and visits with an order in the last months, with the line of the %. */
import { isMobile } from '../../../legacy/bridge';
import { t } from '../../../i18n';
import { escapeHtml, formatNumber } from '../../../services/format';
import { DEFAULT_DAYS, percent, words, type MonthRow, type VisitOrders } from './model';

const SIDE = 14, BOTTOM = 26, TOP = 54, HEADROOM = 1.15;

const monthName = (month: string): string => new Date(`${month}T12:00:00`).toLocaleDateString('es-ES', { month: 'short' }).replace('.', '');

interface Frame { width: number; height: number; barWidth: number; yVisits: (value: number) => number; yPercent: (value: number) => number }

function frameOf(months: readonly MonthRow[]): Frame {
  const mobile = isMobile(), width = mobile ? 360 : 680, height = mobile ? 190 : 210, max = Math.max(...months.map(month => month.visitas), 1) * HEADROOM;
  return {
    width, height, barWidth: (width - 2 * SIDE) / months.length,
    yVisits: value => height - BOTTOM - value / max * (height - TOP), yPercent: value => height - BOTTOM - value / 100 * (height - TOP),
  };
}

function bars(month: MonthRow, index: number, frame: Frame): string {
  const x0 = SIDE + frame.barWidth * index + frame.barWidth * 0.2, width = frame.barWidth * 0.6, base = frame.height - BOTTOM;
  return `<rect x="${x0}" y="${frame.yVisits(month.visitas)}" width="${width}" height="${base - frame.yVisits(month.visitas)}" rx="6" class="tvbv"/>
      <rect x="${x0}" y="${frame.yVisits(month.con_venta)}" width="${width}" height="${base - frame.yVisits(month.con_venta)}" rx="6" class="tvbc"/>
      <text x="${x0 + width / 2}" y="${frame.height - 8}" class="tvtxt tvtxteje" text-anchor="middle">${escapeHtml(monthName(month.mes))}</text>`;
}

function line(months: readonly MonthRow[], frame: Frame): string {
  const points = months.map((month, index) => ({ x: SIDE + frame.barWidth * index + frame.barWidth / 2, share: percent(month.con_venta, month.visitas), visits: month.visitas }))
    .filter(point => point.visits).map(point => ({ ...point, y: frame.yPercent(point.share) }));
  return `<path d="${points.map((point, index) => `${index ? 'L' : 'M'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ')}" class="tvlinp"/>
    ${points.map(point => `<circle cx="${point.x}" cy="${point.y}" r="4.5" class="tvpt"/><text x="${point.x}" y="${point.y - 10}" class="tvtxt tvtxtpct" text-anchor="middle">${point.share}%</text>`).join('')}`;
}

function headline(months: readonly MonthRow[]): string {
  const last = months[months.length - 1], before = months[months.length - 2];
  if (!last) return '';
  const share = percent(last.con_venta, last.visitas), previous = before ? percent(before.con_venta, before.visitas) : null;
  const change = previous !== null && before?.visitas ? `<div class="tvmini"><b class="${share >= previous ? 'tvok' : 'tvmal'}">${t('analytics.orders.pts', { count: `${share >= previous ? '+' : ''}${formatNumber(share - previous)}` })}</b><span class="tvlbl">${t('analytics.orders.versus', { month: escapeHtml(monthName(before.mes)) })}</span></div>` : '';
  return `<div class="tvrow tvrowc"><div class="tvmini"><b>${formatNumber(share)} %</b><span class="tvlbl">${t('analytics.orders.endInOrder', { month: escapeHtml(monthName(last.mes)) })}</span></div>
      ${change}</div>`;
}

export function months(data: VisitOrders): string {
  const list = data.meses ?? [];
  if (!list.some(month => month.visitas)) return `<div class="vacio">${t('analytics.orders.noRecentVisits', words())}</div>`;
  const frame = frameOf(list);
  return `${headline(list)}
    <svg class="tvsvg" viewBox="0 0 ${frame.width} ${frame.height}" role="img" aria-label="${t('analytics.orders.monthsLabel')}">
    ${list.map((month, index) => bars(month, index, frame)).join('')}
    ${line(list, frame)}
    </svg><div class="tvley"><span><i class="tvl3"></i>${t('analytics.orders.legendVisits', words())}</span><span><i class="tvl4"></i>${t('analytics.orders.withOrderIn', { days: data.dias ?? DEFAULT_DAYS })}</span><span><i class="tvl5"></i>${t('analytics.orders.shareInOrder')}</span></div>`;
}
