/**
 * «Resumen» of the professional portal: the activity of the period, the period card, orders month by month, by product, the most
 * used formats and their continuity. Only figures: no person is shown. Migrated from the legacy pmResumen, pmPeriodo, pmFormatos
 * and pmActividad (v2.413.0).
 */
import { portalPageLegacy } from '../../legacy/portal-bridge';
import { t, type MessageKey } from '../../i18n';
import { capitalise, formatShortDate } from '../../services/date-format';
import { escapeHtml, formatNumber } from '../../services/format';
import { sum } from '../../services/values';
import { helpButton, missingText, portalState, words } from './model';

interface MonthFigures { mes: string; unidades?: number; pautas?: number }
export interface ReportData {
  ok?: boolean; desde: string; hasta: string; unidades?: number; pautas?: number; ultima_pauta?: string | null; serie?: MonthFigures[];
  productos?: { nombre: string; unidades: number }[]; formatos?: { formato: string; n?: number }[]; medico: { nombre: string; especialidad?: string | null };
}
export interface Continuity { ok?: boolean; pocos?: boolean; meses?: number; minimo?: number; empezaron?: number; repiten?: number; dias_entre?: number; sin_pedir?: number }

const PERIODS = new Map<string, MessageKey>([
  ['hoy', 'portal.periods.today'], ['ayer', 'portal.periods.yesterday'], ['semana', 'portal.periods.week'], ['7d', 'portal.periods.last7'],
  ['mes', 'portal.periods.month'], ['mesant', 'portal.periods.lastMonth'], ['tri', 'portal.periods.quarter'], ['triant', 'portal.periods.lastQuarter'],
  ['anio', 'portal.periods.year'], ['anioant', 'portal.periods.lastYear'], ['todo', 'portal.periods.all'], ['pers', 'portal.periods.custom'],
]);

/** «2+1» → «2 + 1 de regalo»; «4+» → «4 o más unidades». */
export function formatText(format: string): string {
  // v2.423.0: the expression had lost its backslashes, so «2+1» read «2+1 unidades»
  const pack = /^(\d+)\+(\d+)$/.exec(format);
  if (pack) return t('portal.summary.packFormat', { bought: pack[1] ?? '', free: pack[2] ?? '' });
  if (format === '4+') return t('portal.summary.fourOrMore');
  return format === '1' ? t('portal.summary.oneUnit') : t('portal.summary.units', { count: format });
}

function formatsCard(data: ReportData): string {
  const list = data.formatos ?? [], total = sum(list.map(item => item.n ?? 0)), title = t('portal.summary.formatsTitle', { Orders: capitalise(words().orders) });
  const chart = total ? portalPageLegacy.barChart(list.map(item => ({ n: formatText(item.formato), v: Math.round((item.n ?? 0) / total * 100) })), value => `${value} %`)
    : portalPageLegacy.emptyChart(t('portal.summary.formatsEmpty', words()));
  return `<div class="card ancard" id="pmformatos"><h2>${title} ${helpButton(title, t('portal.summary.formatsHelp', words()))}</h2>
    ${chart}</div>`;
}

function periodCard(data: ReportData): string {
  const last = t('portal.summary.lastOrder', words());
  const rows: [string, string, string][] = [
    [formatNumber(data.unidades), t('portal.summary.unitsLabel'), t('portal.summary.unitsHelp', words())],
    [data.ultima_pauta ? formatShortDate(data.ultima_pauta) : '—', last, t('portal.summary.lastOrderHelp', words())],
  ];
  return `<div class="card ancard" id="pmperiodo"><h2>${t('portal.summary.periodTitle')}</h2>
    <div class="pmperl">${rows.map(([value, label, help]) => `<div><span>${escapeHtml(label)} ${helpButton(label, help)}</span><b>${value}</b></div>`).join('')}</div></div>`;
}

/** «Esta semana se han activado 2 …», or, with none, the offer of «Material y dudas». */
export function activityBanner(data: ReportData): string {
  const select = document.querySelector<HTMLSelectElement>('#mdper [data-per]'), key = PERIODS.get(select ? select.value : 'semana');
  const when = key ? t(key) : t('portal.periods.thisPeriod'), count = Number(data.pautas) || 0;
  const word = portalPageLegacy.wordOf('pauta');
  if (count > 0) return `<div class="banda-ok pmact" id="pmact"><b>${t(count === 1 ? 'portal.summary.activatedOne' : 'portal.summary.activated', { when, count: formatNumber(count), word: escapeHtml(count === 1 ? word.s : word.p) })}</b></div>`;
  return `<div class="banda-info pmact" id="pmact"><b>${t(word.g === 'f' ? 'portal.summary.noneFeminine' : 'portal.summary.noneMasculine', { when, word: escapeHtml(word.s) })}</b>
    ${t('portal.summary.needHelp')}
    <button type="button" class="btn sec chico" data-pmir="mat">${t('portal.tabs.material')}</button></div>`;
}

function monthColumn(month: string, figures: MonthFigures | undefined, max: number): string {
  const units = figures?.unidades ?? 0, orders = figures?.pautas ?? 0;
  const name = new Date(`${month}-01T12:00`).toLocaleDateString(t('dates.locale'), { month: 'short' }).replace('.', '');
  const title = t('portal.summary.monthTitle', { month: name, units: formatNumber(units), orders: formatNumber(orders), ordersWord: words().orders });
  return `<div class="pmcol" title="${escapeHtml(title)}"><div class="pmbar"><b>${units ? formatNumber(units) : ''}</b><i style="height:${units ? Math.max(3, units / max * 100) : 0}%"></i></div>
        <span class="pmm">${escapeHtml(name)}</span><span class="pmn">${orders ? `<em>${formatNumber(orders)}</em>` : ''}</span></div>`;
}

function evolution(data: ReportData): string {
  if (!data.unidades) return portalPageLegacy.emptyChart(t('portal.summary.evolutionEmpty', words()));
  const months = portalPageLegacy.monthsBetween(data.desde, data.hasta), series = new Map((data.serie ?? []).map(item => [item.mes, item]));
  const max = Math.max(1, ...months.map(month => series.get(month)?.unidades ?? 0));
  return `<div class="pmleg"><span><i></i>${t('portal.summary.unitsLabel')}</span><span><i class="v"></i>${words().Orders}</span></div>
    <div class="pmev" style="--n:${months.length}">${months.map(month => monthColumn(month, series.get(month), max)).join('')}</div>`;
}

function continuity(figures: Continuity): string {
  if (!figures.ok) return `<p class="sm">${t('portal.summary.notAvailable')}</p>`;
  if (figures.pocos) return `<p class="sm">${t('portal.summary.fewStarted', { ...words(), months: formatNumber(figures.meses ?? 12), started: formatNumber(figures.empezaron), minimum: formatNumber(figures.minimo ?? 5) })}</p>`;
  const started = figures.empezaron ?? 0;
  return `<div class="minis cons"><div><b>${formatNumber(started)}</b><span>${t('portal.summary.started')}</span></div><div><b>${started ? `${Math.round((figures.repiten ?? 0) / started * 100)}%` : '—'}</b><span>${t('portal.summary.repeated')}</span></div>
        <div><b>${figures.dias_entre ? t('portal.summary.days', { count: formatNumber(figures.dias_entre) }) : '—'}</b><span>${t('portal.summary.between')}</span></div><div><b>${formatNumber(figures.sin_pedir)}</b><span>${t('portal.summary.over60')}</span></div></div>`;
}

function missingBanner(): string {
  if (!portalState.missing.length) return '';
  return `<div class="pmaviso"><div><b>${t('portal.summary.completeCard')}</b><span class="sm">${t('portal.summary.completeCardText', { missing: escapeHtml(missingText()) })}</span></div>
      <button type="button" class="btn" data-pmir="ficha">${t('portal.summary.completeCardButton')}</button></div>`;
}

function metricsCard(data: ReportData): string {
  const title = t('portal.summary.metricsTitle', words());
  const last = data.ultima_pauta ? t('portal.summary.metricsLast', { ...words(), date: formatShortDate(data.ultima_pauta) }) : '';
  return `<div class="card ancard"><h2>${title} ${helpButton(title, t('portal.summary.metricsHelp', words()) + last)}</h2>${evolution(data)}</div>`;
}

function productsCard(data: ReportData): string {
  const title = t('portal.summary.byProduct'), products = data.productos ?? [];
  return `<div class="card ancard"><h2>${title} ${helpButton(title, t('portal.summary.byProductHelp', words()))}</h2>
        ${products.length ? `<div class="pmdon">${portalPageLegacy.donut(products.map(item => ({ n: item.nombre, v: item.unidades })))}</div>` : portalPageLegacy.emptyChart(t('portal.summary.byProductEmpty'))}</div>`;
}

/** The whole «Resumen» tab. */
export function summaryHtml(data: ReportData, figures: Continuity): string {
  const title = t('portal.summary.continuityTitle', words());
  return `${activityBanner(data)}${missingBanner()}
    <div class="pmfila pm3">
      ${periodCard(data)}
      ${metricsCard(data)}
      ${productsCard(data)}</div>
    <div class="pmfila">
      ${formatsCard(data)}
      <div class="card ancard" id="pmconst"><h2>${title} ${helpButton(title, t('portal.summary.continuityHelp', words()))}</h2>${continuity(figures)}</div></div>`;
}

