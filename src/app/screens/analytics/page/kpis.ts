/**
 * The figures of Analítica → Resumen: one call per distinct filter and comparison (analitica_kpis), the cards by area with their
 * comparison and gear, the figures counting up from zero, the six-month line of each card (analitica_kpis_periodo, cached in
 * AN_SERIE) and «Pedidos tras la visita» on top. Migrated from the legacy anCargarKpis with its Base layers, anMeses and anSerie
 * (v2.419.0).
 */
import { callRpc, currentScreen, icon, legacyDb } from '../../../legacy/bridge';
import { analyticsLegacy } from '../../../legacy/analytics-bridge';
import { panelsLegacy } from '../../../legacy/panels-bridge';
import { t } from '../../../i18n';
import { addDays, todayIso, toIsoDate } from '../../../services/dates';
import { formatShortDate } from '../../../services/date-format';
import { escapeHtml } from '../../../services/format';
import { range } from '../../../services/values';
import { sixMonthLine } from '../../../components/charts/small-charts';
import { countUp } from '../../orders/cards';
import { showVisitOrders } from '../visit-orders';
import type { VisitOrders } from '../visit-orders/model';
import { analyticsState, catalogue, deltaHtml, FAMILIES, familyName, FILTERS_BY_FAMILY, filterText, formatValue, kpiHelp, kpiTitle, kpiVisible, type Kpi, type KpiFilter, type KpiSetting } from './catalog';
import { openGear } from './gear';

type Figures = Record<string, unknown>;
interface Result { act?: Figures; ant?: Figures; error?: string }
interface Shown extends KpiSetting { k: Kpi; key: string }

const YEAR_BACK = -364, MONTHS = 6, VISIT_DAYS = 30;
const SHORT_MONTHS = t('dates.monthsShort').split(',');
const areas = (): HTMLElement | null => document.getElementById('anareas');

/** The period of the Resumen (its box keeps the range); with no start, the year before the end. */
export function summaryPeriod(): { from: string; to: string } {
  const range = analyticsLegacy.period('anper'), to = range.hasta ?? todayIso();
  return { from: range.desde ?? addDays(to, YEAR_BACK), to };
}

const ownFilter = (setting: KpiSetting, kpi: Kpi): KpiFilter => {
  const filter: KpiFilter = {};
  (FILTERS_BY_FAMILY[kpi.fam] ?? []).forEach(name => { if (setting.f[name]) filter[name] = setting.f[name]; });
  return filter;
};

function shownKpis(): Shown[] {
  const config = analyticsState.config, kpis = catalogue();
  if (!config) return [];
  return config.kpis.filter(setting => setting.on).flatMap(setting => {
    const kpi = kpis.find(item => item.id === setting.id);
    return kpi && kpiVisible(kpi) ? [{ ...setting, k: kpi, key: JSON.stringify([ownFilter(setting, kpi), setting.comp || config.comp]) }] : [];
  });
}

async function loadFigures(shown: readonly Shown[], from: string, to: string): Promise<Record<string, Result>> {
  const groups = new Map<string, { f: KpiFilter; comp: string; fams: Set<string> }>();
  shown.forEach(item => {
    const group = groups.get(item.key) ?? { f: ownFilter(item, item.k), comp: item.comp || (analyticsState.config?.comp ?? ''), fams: new Set<string>() };
    group.fams.add(item.k.fam); groups.set(item.key, group);
  });
  const results = await Promise.all([...groups].map(async ([key, group]) => {
    const { data, error } = await legacyDb().rpc<Result>('analitica_kpis', { p_desde: from, p_hasta: to, p_filtro: group.f, p_familias: [...group.fams], p_comp: group.comp });
    return [key, error ? { error: (error as { message?: string }).message ?? '' } : data ?? {}] as const;
  }));
  return Object.fromEntries(results);
}

function cardHtml(item: Shown, figures: Readonly<Record<string, Result>>): string {
  const data = figures[item.key] ?? {}, current = data.act?.[item.id], previous = data.ant?.[item.id], filter = filterText(item.f), title = item.t || kpiTitle(item.k);
  return `<div class="ankpi" data-anu="${escapeHtml(item.u)}">
        <div class="ankcab"><span class="anktit">${escapeHtml(title)}</span>
          <button type="button" class="ai" data-ayuda-txt="${escapeHtml(kpiHelp(item.k))}" data-ayuda-tit="${escapeHtml(kpiTitle(item.k))}" aria-label="${t('panels.kpis.whatIs')}">i</button>
          <button type="button" class="ankcfg" data-ancfg="${escapeHtml(item.u)}" title="${t('panels.kpis.adjust')}" aria-label="${escapeHtml(t('panels.kpis.adjustOf', { name: title }))}">${icon('settings')}</button></div>
        <b class="ankval ${item.k.fmt === 'txt' ? 'txt' : ''}">${data.error ? '—' : formatValue(current, item.k.fmt)}</b>
        ${data.error ? `<span class="sm">${t('panels.kpis.couldNotCalculate')}</span>` : deltaHtml(item.k, current, previous, item.comp || (analyticsState.config?.comp ?? ''))}
        ${filter ? `<span class="ankfil">${escapeHtml(filter)}</span>` : ''}</div>`;
}

function areasHtml(shown: readonly Shown[], figures: Readonly<Record<string, Result>>): string {
  return FAMILIES.map(([family]) => {
    const items = shown.filter(item => item.k.fam === family);
    return items.length ? `<section class="anarea" data-fam="${family}"><h3>${escapeHtml(familyName(family))}</h3>
    <div class="ankgrid">${items.map(item => cardHtml(item, figures)).join('')}</div></section>` : '';
  }).join('') || `<div class="vacio">${t('panels.kpis.none')}</div>`;
}

function paintRange(from: string, to: string): void {
  const summary = document.getElementById('anresumen');
  const comparison = t(analyticsState.config?.comp === 'anio' ? 'panels.kpis.comparedLastYear' : 'panels.kpis.comparedPrevious');
  if (summary) summary.innerHTML = `${t('panels.kpis.range', { from: formatShortDate(from), to: formatShortDate(to), comparison })}<button type="button" class="kcfg" id="ancambiar">${t('panels.kpis.change')}</button>`;
  const change = document.getElementById('ancambiar');
  if (change) change.onclick = (): void => { const button = document.querySelector<HTMLElement>('#v-analitica .htbtn'); if (button) { button.click(); button.scrollIntoView({ block: 'nearest' }); } };
}

/** The six months up to `to`: [first day, last day (not after `to`)]. */
function lastMonths(to: string): [string, string][] {
  return range(MONTHS).map(index => {
    const date = new Date(`${to}T12:00:00`); date.setDate(1); date.setMonth(date.getMonth() - (MONTHS - 1) + index);
    const first = toIsoDate(date); date.setMonth(date.getMonth() + 1); date.setDate(0);
    const last = toIsoDate(date);
    return [first, last > to ? to : last];
  });
}

async function seriesOf(months: readonly [string, string][], filter: KpiFilter, families: readonly string[]): Promise<Figures[]> {
  const cache = panelsLegacy.seriesCache(), key = JSON.stringify([months[0]?.[0], months[MONTHS - 1]?.[1], filter, families, panelsLegacy.reportFilter()]);
  if (!cache.has(key)) cache.set(key, Promise.all(months.map(([from, to]) => Promise.resolve(legacyDb().rpc<Figures>('analitica_kpis_periodo', { p_desde: from, p_hasta: to, p_filtro: filter, p_familias: families, p_estado: false }))
    .then(result => (result.error ? {} : result.data ?? {}), () => ({})))));
  const series = await (cache.get(key) as Promise<Figures[]>);
  if (series.every(item => !Object.keys(item).length)) cache.delete(key);
  return series;
}

interface CardRef { el: HTMLElement; x: KpiSetting; k: Kpi }

/** The figures count up from zero, keeping their format. */
function countFigures(cards: readonly CardRef[]): void {
  const numbers: HTMLElement[] = [];
  cards.forEach(({ el, k }) => {
    el.classList.add('anv');
    const value = el.querySelector<HTMLElement>('.ankval'); if (!value || k.fmt === 'txt') return;
    const text = value.textContent ?? '', match = /-?[\d.]+(,\d+)?/.exec(text); if (!match) return;
    value.dataset.v = String(parseFloat(match[0].replace(/\./g, '').replace(',', '.'))); value.dataset.f = text; value.dataset.dec = String(match[1] ? match[1].length - 1 : 0);
    numbers.push(value);
  });
  countUp(numbers, (number, element) => (element.dataset.f ?? '').replace(/-?[\d.]+(,\d+)?/, number.toLocaleString('es-ES', { minimumFractionDigits: Number(element.dataset.dec), maximumFractionDigits: Number(element.dataset.dec) })));
}

function drawLine(card: CardRef, series: readonly Figures[], months: readonly [string, string][]): void {
  const zone = card.el.querySelector<HTMLElement>('.avz'); if (!zone) return;
  const values = series.map(item => Number(item[card.x.id]) || 0);
  zone.innerHTML = sixMonthLine(values, months);
  // v2.343.0: a flat line with no data (before it was hidden and the card was left empty)
  if (values.every(value => !value)) { zone.classList.add('avcero'); zone.title = t('panels.kpis.noDataSixMonths'); return; }
  zone.title = months.map(([first], index) => `${SHORT_MONTHS[Number(first.slice(5, 7)) - 1] ?? ''}: ${formatValue(values[index], card.k.fmt).replace(/<[^>]+>/g, '')}`).join(' · ');
}

/** The line of the last six months, room kept from the start (no jumps) and drawn when it arrives. */
async function drawLines(cards: readonly CardRef[], request: string): Promise<void> {
  const today = todayIso(), range = analyticsLegacy.period('anper'), to = !range.hasta || range.hasta > today ? today : range.hasta, months = lastMonths(to);
  const withLine = cards.filter(({ k }) => !k.hoy && k.fmt !== 'txt');
  withLine.forEach(({ el }) => { el.insertAdjacentHTML('beforeend', '<div class="avz" aria-hidden="true"></div>'); });
  const groups = new Map<string, { f: KpiFilter; fams: Set<string>; cards: CardRef[] }>();
  withLine.forEach(card => {
    const filter = ownFilter(card.x, card.k), key = JSON.stringify(filter), group = groups.get(key) ?? { f: filter, fams: new Set<string>(), cards: [] };
    group.fams.add(card.k.fam); group.cards.push(card); groups.set(key, group);
  });
  await Promise.all([...groups.values()].map(async group => {
    const series = await seriesOf(months, group.f, [...group.fams].sort());
    if (areas()?.dataset.pedido !== request) return;
    group.cards.forEach(card => { drawLine(card, series, months); });
  }));
}

async function paintKpis(): Promise<void> {
  const box = areas(); if (!box || !analyticsState.config || !document.getElementById('anper')) return;
  const { from, to } = summaryPeriod(), shown = shownKpis(), request = String(Date.now());
  box.dataset.pedido = request;
  const figures = await loadFigures(shown, from, to);
  if (areas()?.dataset.pedido !== request) return;
  box.innerHTML = areasHtml(shown, figures);
  box.querySelectorAll<HTMLElement>('[data-ancfg]').forEach(button => {
    button.onclick = (event): void => { event.stopPropagation(); openGear(button, button.dataset.ancfg ?? '', () => { void loadKpis(); }); };
  });
  paintRange(from, to);
  const kpis = catalogue(), cards = [...box.querySelectorAll<HTMLElement>('.ankpi[data-anu]')].flatMap((el): CardRef[] => {
    const setting = analyticsState.config?.kpis.find(item => item.u === el.dataset.anu), kpi = setting ? kpis.find(item => item.id === setting.id) : undefined;
    return setting && kpi ? [{ el, x: setting, k: kpi }] : [];
  });
  countFigures(cards);
  await drawLines(cards, request);
}

/** Loads the figures and the lines, and «Pedidos tras la visita» with the same period. */
export async function loadKpis(): Promise<void> {
  const range = document.getElementById('anper') ? analyticsLegacy.period('anper') : null;
  const visits = range ? Promise.resolve(callRpc<VisitOrders>('ventas_tras_visita', { p_desde: range.desde ?? null, p_hasta: range.hasta ?? null, p_dias: VISIT_DAYS })).then(result => result.data ?? null, () => null) : null;
  await paintKpis();
  const data = visits ? await visits : null;
  if (currentScreen() === 'analitica') showVisitOrders(data);
}
