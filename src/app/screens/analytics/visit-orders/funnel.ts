/** «Embudo» and «Por tipo» views of «Pedidos tras la visita»: visits, professionals visited and those with an order; and by visit type. */
import { term } from '../../../legacy/bridge';
import { t, type MessageKey } from '../../../i18n';
import { escapeHtml, formatNumber } from '../../../services/format';
import { isPresent, sum } from '../../../services/values';
import { DEFAULT_DAYS, percent, words, type Period, type TypeRow, type VisitOrders } from './model';

const bar = (width: number | string, extraClass: string): string =>
  `<svg class="tvbar" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true"><rect class="tvbg" width="100" height="10" rx="3"/><rect class="tvfg${extraClass}" width="${width}" height="10" rx="3"/></svg>`;

const mini = (value: string, label: string, valueClass = ''): string => `<div class="tvmini"><b${valueClass ? ` class="${valueClass}"` : ''}>${value}</b><span class="tvlbl">${label}</span></div>`;

/** Visits done, professionals visited and those with an order: each one as a share of the visits. */
function steps(summary: Period, days: number): [string, number, number, string][] {
  const visits = summary.visitas ?? 0, visited = summary.profesionales ?? 0, withOrder = summary.con_venta ?? 0;
  return [
    [t('analytics.orders.visitsDone', words()), visits, visits ? 1 : 0, ''],
    [term('medico', { number: 'p', capital: 'C', adjective: 'visitado' }), visited, visits ? visited / visits : 0, ''],
    [t('analytics.orders.withOrderIn', { days }), withOrder, visits ? withOrder / visits : 0, 'c'],
  ];
}

function changeHtml(difference: number | null): string {
  if (difference === null) return '';
  return `<div class="tvlbl"><span class="${difference >= 0 ? 'tvok' : 'tvmal'}">${difference >= 0 ? '▲ +' : '▼ '}${t('analytics.orders.points', { count: formatNumber(difference) })}</span> ${t('analytics.orders.vsPrevious')}</div>`;
}

export function funnel(data: VisitOrders): string {
  const summary = data.resumen ?? {}, before = summary.anterior ?? {}, days = data.dias ?? DEFAULT_DAYS;
  const share = percent(summary.con_venta, summary.profesionales), previous = percent(before.con_venta, before.profesionales);
  const difference = before.profesionales ? share - previous : null;
  const average = isPresent(summary.dias_media) ? t('analytics.orders.days', { count: formatNumber(summary.dias_media) }) : '—';
  return `<div class="tvgrid"><div class="tvizq"><div class="tvbig">${formatNumber(share)}<small> %</small></div>
      <div class="tvlbl">${t('analytics.orders.haveOrder', { visited: term('medico', { number: 'p', article: 'del', adjective: 'visitado' }), days })}</div>
      <div class="tvrow">${mini(formatNumber(summary.unidades ?? 0), t('analytics.orders.units'))}
        ${mini(average, t('analytics.orders.untilFirst'))}</div></div>
    <div class="tvfun">${steps(summary, days).map(([label, count, share2, extraClass]) => `<div class="tvst"><span>${escapeHtml(label)}</span>
      ${bar(Math.max(share2 * 100, count ? 3 : 0).toFixed(1), extraClass ? ` ${extraClass}` : ' ')}
      <b>${formatNumber(count)}</b></div>`).join('')}
      ${changeHtml(difference)}</div></div>`;
}

const TYPES: readonly (readonly [string, MessageKey])[] = [['captacion', 'analytics.orders.typeCapture'], ['presentacion', 'analytics.orders.typePresentation'], ['seguimiento', 'analytics.orders.typeFollowUp']];
const FOLLOW_UP = 'seguimiento';

const typeName = (type: string): string => { const found = TYPES.find(([key]) => key === type); return found ? t(found[1]) : type; };
const pair = (row: { visitas?: number; con_pedido?: number } | undefined): string =>
  (row?.visitas ? t('analytics.orders.ofTotal', { part: formatNumber(row.con_pedido), total: formatNumber(row.visitas) }) : '—');

function teamHtml(team: NonNullable<VisitOrders['equipo']>): string {
  if (!team.length) return '';
  return `<div class="tveq"><table class="trtabla"><thead><tr><th>${t('analytics.orders.person')}</th>${TYPES.map(([, label]) => `<th>${t(label)}</th>`).join('')}</tr></thead>
      <tbody>${team.map(member => `<tr><td>${escapeHtml(member.nombre)}</td>${TYPES.map(([key]) => `<td>${pair(member[key] as { visitas?: number; con_pedido?: number } | undefined)}</td>`).join('')}</tr>`).join('')}</tbody></table>
      <div class="tvlbl">${t('analytics.orders.teamHint', words())}</div></div>`;
}

function typeRow(row: TypeRow): string {
  const share = percent(row.con_pedido, row.visitas);
  return `<div class="tvst"><span>${escapeHtml(typeName(row.tipo))} · ${t('analytics.orders.ofTotal', { part: formatNumber(row.con_pedido), total: formatNumber(row.visitas) })}</span>
      ${bar(Math.max(share, row.con_pedido ? 3 : 0), row.tipo === FOLLOW_UP ? '' : ' c')}
      <b>${formatNumber(share)} %</b></div>`;
}

export function types(data: VisitOrders): string {
  const rows = data.tipos ?? [];
  if (!rows.some(row => row.visitas)) return `<div class="vacio">${t('analytics.orders.noVisits', words())}</div>`;
  const total = sum(rows.map(row => Number(row.con_pedido) || 0)), fresh = sum(rows.filter(row => row.tipo !== FOLLOW_UP).map(row => Number(row.con_pedido) || 0));
  return `<div class="tvgrid"><div class="tvizq"><div class="tvbig">${formatNumber(percent(fresh, total))}<small> %</small></div>
      <div class="tvlbl">${t('analytics.orders.newShare', words())}</div>
      <div class="tvrow">${mini(formatNumber(fresh), t('analytics.orders.newOnes'))}
        ${mini(formatNumber(total - fresh), t('analytics.orders.followUps'))}</div></div>
    <div class="tvfun">${rows.map(typeRow).join('')}
      <div class="tvlbl">${rows.map(row => t('analytics.orders.typeUnits', { type: escapeHtml(typeName(row.tipo)), units: formatNumber(row.unidades ?? 0) })).join(' · ')}</div></div></div>
    ${teamHtml(data.equipo ?? [])}`;
}
