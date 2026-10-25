/** The tiles of the home mosaic. Each function returns the HTML of one tile, or '' when it does not apply. */
import { appointments, icon, permissions, term } from '../../legacy/bridge';
import { t } from '../../i18n';
import { addDays, fromIsoDate } from '../../services/dates';
import { escapeHtml, formatEuros, formatNumber } from '../../services/format';
import type { AttentionItem, HomeData, MonthSales } from './types';

const plural = (count: number, one: string, other: string): string => (count === 1 ? one : other);

export function attentionTile(items: readonly AttentionItem[]): string {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  const rows = items.slice(0, 7).map((item, index) => `<button type="button" class="mti ${item.priority}" data-mat="${index}"><span class="mic">${icon(item.icon)}</span>
      <span class="mtx"><b>${escapeHtml(item.title)}</b><span>${escapeHtml(item.detail)}</span></span><span class="mn" data-mcnt="${item.count}">${item.count}</span><span class="mfl" aria-hidden="true">›</span></button>`).join('');
  const allClear = `<div class="mtok">${icon('check')}<span><b>${t('home.attention.allClearTitle')}</b>${t('home.attention.allClearText')}</span></div>`;
  return `<div class="mt mtat ${items.length <= 2 ? 'pocas' : ''}"><div class="mtt">${icon('bell')} ${t('home.attention.title')}${total ? `<span class="mtatn" data-mcnt="${total}">${total}</span>` : ''}</div>
    <div class="mtl">${rows || allClear}</div></div>`;
}

function salesChart(data: HomeData): string {
  const perDay = new Map(data.visitsPerDay.map(day => [day.fecha, day.n]));
  const days = [...Array(14).keys()].map(i => addDays(data.today, i - 13));
  const max = Math.max(1, ...days.map(day => perDay.get(day) ?? 0));
  const visits = term('visita', { number: 'p', capital: 'C' });
  return `<div class="mbars" role="img" aria-label="${t('home.sales.chartLabel', { visits })}">${days.map(day => `<i class="${day === data.today ? 'h' : ''}" style="height:${Math.max(4, 100 * (perDay.get(day) ?? 0) / max)}%"></i>`).join('')}</div>
      <div class="mleg">${t('home.sales.chartLegend', { visits })}</div>`;
}

/** This month in euros (if the user may see amounts) or in units, and the change against the same day last month. */
function salesFigures(sales: MonthSales): { inEuros: boolean; current: number; change: number | null } {
  const inEuros = permissions.canSeeAmounts() && sales.importe !== null && sales.importe !== undefined;
  const current = (inEuros ? sales.importe : sales.unidades) ?? 0;
  const previous = inEuros ? sales.importe_ant : sales.unidades_ant;
  return { inEuros, current, change: previous ? Math.round(100 * (current - previous) / previous) : null };
}

function salesVersus(change: number | null): string {
  if (change === null) return '';
  const up = change >= 0;
  return `<span class="${up ? 'mup' : 'mdown'}">${up ? '▲' : '▼'} ${t('home.sales.percent', { percent: Math.abs(change) })}</span>${t('home.sales.versusLastMonth')}`;
}

export function salesTile(data: HomeData): string {
  if (!permissions.canSeeArea('ventas')) return '';
  const sales = data.areas.ventas ?? {};
  const { inEuros, current, change } = salesFigures(sales);
  const figure = inEuros ? `data-meur="${current}"` : `data-mcnt="${current}"`;
  const units = inEuros ? ` · <b>${formatNumber(sales.unidades ?? 0)}</b> ${t('home.sales.units')}` : '';
  return `<div class="mt mtven"><div class="mtt">${icon('chart-column')} ${t('home.sales.title')}</div>
      <div class="mn1" ${figure}>${inEuros ? formatEuros(current) : `${formatNumber(current)}<small>${t('home.sales.units')}</small>`}</div>
      <div class="ms">${salesVersus(change)}<b>${formatNumber(sales.pedidos ?? 0)}</b> ${t('home.sales.orders')}${units}</div>
      ${salesChart(data)}</div>`;
}

export function todayTile(data: HomeData): string {
  const open = data.appointments.filter(item => appointments.isOpen(item.estado));
  const done = data.appointments.filter(item => !appointments.isOpen(item.estado) && !appointments.isCancelled(item.estado)).length;
  const alive = data.appointments.filter(item => !appointments.isCancelled(item.estado)).length;
  const pendingTasks = data.tasks.filter(task => !task.hecha).length;
  const list = open.slice(0, 4).map(item => `<div><b>${escapeHtml(String(item.hora ?? '').slice(0, 5) || '—')}</b><span>${escapeHtml(item.medico ?? item.nombre ?? '')}</span></div>`).join('');
  return `<div class="mt mthoy"><div class="mtt">${icon('calendar-days')} ${t('home.today.title')}</div>
    <div class="mn1"><span data-mcnt="${alive}">${alive}</span><small>${plural(alive, t('home.today.appointmentOne'), t('home.today.appointmentOther'))}</small></div>
    <div class="ms"><b>${done}</b> ${t('home.today.done')} · <b>${pendingTasks}</b> ${plural(pendingTasks, t('home.today.taskOne'), t('home.today.taskOther'))}</div>
    <div class="mprog"><i style="width:${alive ? Math.max(3, 100 * done / alive) : 0}%"></i></div>
    <div class="mcitas">${list || `<button type="button" class="lnk" data-mplan>${alive ? t('home.today.dayComplete') : t('home.today.planYourDay')}</button>`}</div></div>`;
}

export function collectionsTile(data: HomeData): string {
  const collections = data.areas.cobros;
  if (!collections || !permissions.canSeeAmounts() || !permissions.canSeeArea('facturacion')) return '';
  return `<div class="mt mtcob"><div class="mtt">${icon('euro')} ${t('home.collections.title')}</div>
    <div class="mn1" data-meur="${collections.pendiente}">${formatEuros(collections.pendiente)}</div><div class="ms">${t('home.collections.pendingIn')} <b>${formatNumber(collections.n)}</b> ${plural(collections.n, t('home.collections.invoiceOne'), t('home.collections.invoiceOther'))}</div>
    <div class="mmini"><div><span>${t('home.collections.overdue')}</span><b class="${collections.vencido > 0 ? 'mdown' : ''}">${formatEuros(collections.vencido)}</b></div><div><span>${t('home.collections.invoicedThisMonth')}</span><b>${formatEuros(collections.facturado_mes)}</b></div></div></div>`;
}

export function cycleTile(data: HomeData): string {
  const summary = data.cycle?.resumen ?? [];
  if (!summary.length) return '';
  const done = summary.reduce((sum, row) => sum + row.hechas, 0), target = summary.reduce((sum, row) => sum + row.objetivo, 0);
  const percent = target ? Math.round(100 * done / target) : 0, circumference = 2 * Math.PI * 30;
  return `<div class="mt mtcic"><div class="mtt">${icon('target')} ${t('home.cycle.title', { visits: term('visita', { number: 'p' }) })}</div>
      <div class="mfila"><svg class="mring" viewBox="0 0 70 70" aria-hidden="true"><circle class="f" cx="35" cy="35" r="30"/><circle class="v" cx="35" cy="35" r="30" style="stroke-dasharray:${circumference * percent / 100} ${circumference}"/></svg>
      <div><div class="mn1 u-m-0"><span data-mcnt="${percent}">${percent}</span> %</div><div class="ms"><b>${done}</b>${t('home.cycle.progress', { target, days: data.cycle?.quedan_dias ?? 0 })}</div></div></div></div>`;
}

export function stockTile(data: HomeData): string {
  if (!permissions.canSeeArea('productos')) return '';
  const total = data.stock.reduce((sum, alert) => sum + alert.n, 0);
  const rows = data.stock.slice(0, 3).map(alert => `<div><span>${escapeHtml(alert.titulo)}</span><b>${alert.n}</b></div>`).join('');
  return `<div class="mt mtsto"><div class="mtt">${icon('package')} ${t('home.stock.title')}</div><div class="mn1"><span data-mcnt="${total}">${total}</span><small>${plural(total, t('home.stock.alertOne'), t('home.stock.alertOther'))}</small></div>
      <div class="mmini">${rows || `<div><span>${t('home.stock.allGood')}</span></div>`}</div></div>`;
}

export function portfolioTile(data: HomeData): string {
  if (!permissions.canSeeArea('directorio')) return '';
  const kpi = (key: string): number => data.kpis[key] ?? 0;
  const sold = permissions.canSeeArea('ventas') ? `<div><span>${t('home.portfolio.soldThisMonth')}</span><b>${formatNumber(kpi('prescriptores_mes'))}</b></div>` : '';
  return `<div class="mt mtcar"><div class="mtt">${icon('users')} ${t('home.portfolio.title')}</div>
    <div class="mn1"><span data-mcnt="${kpi('cuentas')}">${formatNumber(kpi('cuentas'))}</span><small>${term('medico', { number: 'p' })}</small></div>
    <div class="mmini">${sold}<div><span>${t('home.portfolio.notContacted')}</span><b>${formatNumber(kpi('sin_contactar'))}</b></div><div><span>${t('home.portfolio.noVisitIn60Days', { visit: term('visita') })}</span><b>${formatNumber(kpi('sin_visita_60'))}</b></div></div></div>`;
}

const AREA_OF_UPCOMING: Readonly<Record<string, string>> = { evento: 'eventos', concurso: 'concursos', cirugia: 'cirugias', equipo: 'parque' };

export function upcomingTile(data: HomeData): string {
  const items = (data.areas.proximos ?? []).filter(item => {
    const area = AREA_OF_UPCOMING[item.tipo];
    return area === undefined || permissions.canSeeArea(area);
  });
  if (!items.length) return '';
  const months = t('dates.monthsShort').split(','), weekdays = t('dates.weekdaysShort').split(',');
  const rows = items.slice(0, 6).map(item => {
    const date = fromIsoDate(item.fecha);
    return `<div class="me"><span class="md">${date.getDate()} ${months[date.getMonth()] ?? ''}<small>${weekdays[date.getDay()] ?? ''}</small></span><span class="mp ${item.tipo}"></span><span class="mtx"><b>${escapeHtml(item.titulo)}</b><span>${escapeHtml(item.sub ?? '')}</span></span></div>`;
  }).join('');
  return `<div class="mt mtprox"><div class="mtt">${icon('clock')} ${t('home.upcoming.title')}</div><div class="mtl2">${rows}</div></div>`;
}
