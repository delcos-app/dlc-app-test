/** Indicator charts about the portfolio: commercial states, accounts not contacted and accounts without a recent visit. */
import { commercialStates, isMobile, term } from '../../../legacy/bridge';
import { escapeHtml } from '../../../services/format';
import { range, sum } from '../../../services/values';
import { t } from '../../../i18n';
import { EMPTY_CHART, STATE_COLORS, type ChartResult } from './chart-tools';

type Kpis = Readonly<Record<string, number>>;
interface StateCount { readonly state: { readonly valor: string; readonly papel: string }; readonly accounts: number }

/** Accounts per commercial state (negative states left out), in the order of the catalog. */
export function stateCounts(charts: HomeCharts): StateCount[] {
  const counts = new Map((charts.estados ?? []).map(row => [row.valor, row.n]));
  return commercialStates.all().filter(state => state.papel !== 'negativo').map(state => ({ state, accounts: counts.get(state.valor) ?? 0 }));
}

export function portfolioTotal(charts: HomeCharts): number {
  return sum((charts.estados ?? []).map(row => row.n));
}

const color = (role: string): string => STATE_COLORS[role] ?? '#C9D7E6';

/** The ladder of states after the first one, with the «interest» step highlighted. */
export function interestedChart(charts: HomeCharts): ChartResult {
  const counts = stateCounts(charts), steps = counts.filter(count => count.state.papel !== 'inicial');
  if (!steps.length) return EMPTY_CHART;
  const max = Math.max(1, ...steps.map(count => count.accounts)), width = 196, barWidth = width / steps.length;
  const columns = steps.map((count, i) => {
    const on = count.state.papel === 'interes', height = Math.max(4, count.accounts / max * 28);
    const name = count.state.valor.length > 11 ? `${count.state.valor.slice(0, 10)}.` : count.state.valor;
    return `<rect x="${i * barWidth + 4}" y="${34 - height}" width="${barWidth - 8}" height="${height}" rx="4" fill="${on ? 'var(--navy)' : '#DCE6F1'}"/><text x="${i * barWidth + barWidth / 2}" y="${30 - height}" text-anchor="middle" class="n ${on ? 'on' : ''}">${count.accounts}</text><text x="${i * barWidth + barWidth / 2}" y="48" text-anchor="middle" class="${on ? 'on' : ''}">${escapeHtml(name)}</text>`;
  }).join('');
  const positive = counts.find(count => count.state.papel === 'positivo');
  const state = positive ? escapeHtml(positive.state.valor) : '';
  const summary = positive ? (positive.accounts ? t('home.indicators.alreadyIn', { count: positive.accounts, state }) : t('home.indicators.nextStep', { state })) : '';
  return { summary, visual: `<svg class="kvbar" viewBox="0 0 ${width} 52" preserveAspectRatio="xMidYMax meet" aria-hidden="true">${columns}</svg>` };
}

/** The whole portfolio as a ring by state, with the four biggest in the legend. */
export function portfolioChart(charts: HomeCharts): ChartResult {
  const total = portfolioTotal(charts), present = stateCounts(charts).filter(count => count.accounts);
  const circumference = 2 * Math.PI * 22;
  let offset = 0;
  const segments = present.map(count => {
    const length = count.accounts / total * circumference;
    const segment = `<circle class="s" cx="29" cy="29" r="22" fill="none" stroke="${color(count.state.papel)}" stroke-width="9" stroke-dasharray="${Math.max(0, length - 1.5)} ${circumference}" stroke-dashoffset="${-offset}"/>`;
    offset += length;
    return segment;
  }).join('');
  const legend = present.slice(0, 4).map(count => `<span><i style="background:${color(count.state.papel)}"></i>${count.accounts} ${escapeHtml(count.state.valor)}</span>`).join('');
  return { summary: '', visual: `<div class="kvdona"><svg viewBox="0 0 58 58" aria-hidden="true">${segments}</svg><div class="kvley">${legend}</div></div>` };
}

/** One square per account (64 on mobile, 96 on a computer): the filled ones are not contacted yet. */
export function notContactedChart(charts: HomeCharts, kpis: Kpis): ChartResult {
  const total = portfolioTotal(charts), notContacted = kpis.sin_contactar ?? 0;
  const squares = Math.min(total, isMobile() ? 64 : 96), filled = Math.round(notContacted / total * squares);
  const grid = range(squares).map(i => `<i class="${i >= squares - filled ? 'f' : ''}"></i>`).join('');
  return { summary: t('home.indicators.shareOfPortfolio', { percent: Math.round(notContacted / total * 100) }), visual: `<div class="kvwaf" aria-hidden="true">${grid}</div>` };
}

/** Share of the portfolio without a visit in 60 days. */
export function noRecentVisitChart(kpis: Kpis): ChartResult {
  const percent = Math.round((kpis.sin_visita_60 ?? 0) / Math.max(1, kpis.medicos ?? 0) * 100);
  return {
    summary: t('home.indicators.shareOfPortfolio', { percent }),
    visual: `<div class="kvpropw"><div class="kvprop"><i style="width:${percent}%"></i></div><div class="kvpropt"><span><i class="kvq a"></i>${t('home.indicators.noVisitIn60Days', { visit: term('visita') })}</span><span><i class="kvq b"></i>${t('home.indicators.theRest')}</span></div></div>`,
  };
}
