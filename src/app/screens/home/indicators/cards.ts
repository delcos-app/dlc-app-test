/** Indicator cards of Inicio, painted complete at once (icon, help, title, figure, sentence, chart and description). */
import { indicatorCatalog } from '../../../legacy/bridge';
import { todayIso } from '../../../services/dates';
import { capitalise } from '../../../services/date-format';
import { escapeHtml, formatNumber } from '../../../services/format';
import { t } from '../../../i18n';
import { appointmentsChart, monthChart, unitsChart, urgentChart, weekChart } from './charts-activity';
import { interestedChart, noRecentVisitChart, notContactedChart, portfolioChart, portfolioTotal } from './charts-portfolio';
import { EMPTY_CHART, type ChartResult } from './chart-tools';
import { filterText } from '../../accounts/filters/saved';

type Kpis = Readonly<Record<string, number>>;

interface ChartInput { readonly id: string; readonly kpis: Kpis; readonly panel: HomePanel | null; readonly charts: HomeCharts | null; readonly today: string }
type ChartBuilder = (input: ChartInput) => ChartResult | null;

/** With the whole portfolio drawn: only when there are accounts in it. */
const withPortfolio = (draw: (charts: HomeCharts, kpis: Kpis) => ChartResult): ChartBuilder =>
  ({ charts, kpis }) => (charts && portfolioTotal(charts) ? draw(charts, kpis) : null);

const weekBuilder: ChartBuilder = ({ id, charts, today }) => (charts ? weekChart(id, charts, today) : null);

/** The chart of each indicator (by its id in the catalog); null when there is no data for it. */
const CHARTS = new Map<string, ChartBuilder>([
  ['citas', ({ panel, kpis }) => (panel ? appointmentsChart(panel, kpis) : null)],
  ['urgentes', ({ kpis }) => urgentChart(kpis)],
  ['visitas_sem', weekBuilder],
  ['citas_7d', weekBuilder],
  ['visitas_mes', ({ charts, today }) => (charts ? monthChart(charts, today) : null)],
  ['interesados', withPortfolio(charts => interestedChart(charts))],
  ['cartera', withPortfolio(charts => portfolioChart(charts))],
  ['sin_contactar', withPortfolio(notContactedChart)],
  ['sin_visita_60', ({ kpis }) => (kpis.medicos ? noRecentVisitChart(kpis) : null)],
  ['uds_mes', ({ kpis }) => (kpis.uds_mes_ant !== undefined && (kpis.uds_mes || kpis.uds_mes_ant) ? unitsChart(kpis) : null)],
]);

function chartFor(id: string, kpis: Kpis, panel: HomePanel | null, charts: HomeCharts | null): ChartResult {
  return CHARTS.get(id)?.({ id, kpis, panel, charts, today: todayIso() }) ?? EMPTY_CHART;
}

function helpButton(help: string | undefined, title: string): string {
  return help ? `<button class="ai" data-ayuda-txt="${escapeHtml(help)}" data-ayuda-tit="${escapeHtml(title)}" aria-label="${t('home.indicators.whatIsIt')}">i</button>` : '';
}

/** «8/12» counts up the first number; a plain number counts up; anything else is shown as it is. */
function figure(raw: unknown): string {
  const text = String(raw), fraction = /^(\d+)\/(\d+)$/.exec(text);
  if (fraction) return `<b data-kvn="${fraction[1] ?? ''}">0</b><span class="kvu">/${fraction[2] ?? ''}</span>`;
  return /^\d+$/.test(text) ? `<b data-kvn="${text}">0</b>` : `<b>${escapeHtml(text)}</b>`;
}

export interface CardContext { readonly kpis: Kpis; readonly panel: HomePanel | null; readonly charts: HomeCharts | null }

/** Card of an indicator from the catalog (the panel data is needed for the live version with its chart). */
export function indicatorCard(definition: KpiDefinition, setting: KpiSetting, context: CardContext): string {
  const title = setting.t ? setting.t : definition.t;
  const classes = `kpi ${definition.cls ? definition.cls(context.kpis) : ''} ${definition.h ? 'click' : ''}${context.panel ? ' kv' : ''}`;
  const action = definition.h ? ` data-k="${definition.h}"` : '';
  const icon = indicatorCatalog.icon(definition.id), description = indicatorCatalog.description(definition.id);
  const help = helpButton(indicatorCatalog.help(definition.id), title);
  const raw = definition.v(context.kpis);
  const body = context.panel ? liveBody(definition.id, capitalise(title).trim(), raw, context)
    : `\n       ${help}\n       <b>${typeof raw === 'string' ? raw : formatNumber(raw)}</b><span>${escapeHtml(capitalise(title))}</span>`;
  return `<div class="${classes}"${action} data-kid="${definition.id}" data-comp="1">${icon ? `<span class="kico" aria-hidden="true">${icon}</span>` : ''}`
    + `${context.panel ? help : ''}${body}${description ? `<em class="kdesc">${escapeHtml(description)}</em>` : ''}</div>`;
}

function liveBody(id: string, title: string, raw: unknown, context: CardContext): string {
  const { summary, visual } = chartFor(id, context.kpis, context.panel, context.charts);
  return `<div class="kvt">${escapeHtml(title)}</div>
      <div class="kvn">${figure(raw)}</div>
      <div class="kvs">${summary}</div>${visual ? `<div class="kvz">${visual}</div>` : ''}`;
}

/** Card of a saved directory filter: its count arrives later (countFilter). */
export function filterCard(setting: KpiSetting, index: number, live: boolean): string {
  const filter = setting.filtro ?? {};
  const name = setting.t ? setting.t : filterText(filter);
  const help = `<button class="ai" data-ayuda-txt="${escapeHtml(t('home.indicators.filterHelp', { help: indicatorCatalog.help('filtro') ?? '', filter: filterText(filter) }))}" data-ayuda-tit="${escapeHtml(setting.t ? setting.t : t('home.indicators.savedFilter'))}" aria-label="${t('home.indicators.whatIsIt')}">i</button>`;
  const count = '<b class="cont"><span class="spin" style="width:18px;height:18px;border-width:2px;display:inline-block"></span></b>';
  return live
    ? `<div class="kpi click kv" data-kf="${escapeHtml(JSON.stringify(filter))}" data-kfi="${index}">\n        ${help}\n        <span class="kvt">${escapeHtml(name)}</span><div class="kvn">${count}</div></div>`
    : `<div class="kpi click" data-kf="${escapeHtml(JSON.stringify(filter))}" data-kfi="${index}">\n        ${help}\n        ${count}<span>${escapeHtml(name)}</span></div>`;
}
