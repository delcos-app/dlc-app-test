/**
 * Analítica → «Explorar datos» → «Ranking»: totals, the split by product, the monthly series and the ranking by the dimension
 * chosen («Ver por»), with the screen filters. Migrated from the legacy pintarAnalitica and refrescarAnalitica (v2.412.0); both
 * stay as adapters (the legacy page builds the filters and calls them).
 */
import { currentScreen, legacyDb, term } from '../../legacy/bridge';
import { analyticsLegacy } from '../../legacy/analytics-bridge';
import { t } from '../../i18n';
import { escapeHtml, formatCurrency, formatNumber } from '../../services/format';
import { paintMonthlyTable } from './monthly-table';
import { filterParams, selectedText, valueOf } from './filters';

interface Totals { unidades?: number; importe?: number; pedidos?: number; medicos?: number }
interface Row { nombre: string; unidades?: number; importe?: number; pedidos?: number; [measure: string]: unknown }
interface Ranking { totales?: Totals; filas?: Row[]; por_producto?: Row[]; serie?: (Row & { mes: string })[] }

const LIMIT = 100, SKELETONS = 4, BAR_HEIGHT = 84;
const element = (id: string): HTMLElement | null => document.getElementById(id);
const measureOf = (row: Row | Totals, measure: string): number => Number((row as Record<string, unknown>)[measure]) || 0;

function totalsHtml(totals: Totals): string {
  const who = [analyticsLegacy.professional()?.nombre ?? '', selectedText('acom'), selectedText('aprod'), selectedText('arep'), selectedText('areprt')].filter(Boolean).join(' · ');
  return `
    <div class="kpi"><b>${formatNumber(totals.unidades)}</b><span>${t('analytics.explore.units')}${who ? ` · ${escapeHtml(who)}` : ''}</span></div>
    <div class="kpi ok"><b>${formatCurrency(totals.importe)}</b><span>${t('analytics.explore.amount')}</span></div>
    <div class="kpi"><b>${formatNumber(totals.pedidos)}</b><span>${t('analytics.explore.orders')}</span></div>
    <div class="kpi"><b>${formatNumber(totals.medicos)}</b><span>${t('analytics.explore.withSales', { professionals: term('medico', { number: 'p', capital: 'C' }) })}</span></div>`;
}

function productsHtml(products: readonly Row[], totals: Totals, dimension: string): string {
  if (!(products.length > 1 || (products.length === 1 && dimension !== 'producto'))) return '';
  return `<div class="dgrid-wrap"><div class="dgrid aprod">
    <div class="dh"><span>${t('analytics.explore.byProduct')}</span><span class="num">${t('analytics.explore.unitsHead')}</span><span class="num">${t('analytics.explore.unitsShare')}</span><span class="num">${t('analytics.explore.amountHead')}</span></div>
    ${products.map(product => `<div class="dr u-cursor-default"><span><b>${escapeHtml(product.nombre)}</b></span><span class="num">${formatNumber(product.unidades)}</span>
      <span class="num">${Math.round((product.unidades ?? 0) / ((totals.unidades ?? 0) || 1) * 100)}%</span><span class="num">${formatCurrency(product.importe)}</span></div>`).join('')}
  </div></div>`;
}

function seriesHtml(series: readonly (Row & { mes: string })[], measure: string): string {
  if (series.length <= 1) return '';
  const max = Math.max(...series.map(month => measureOf(month, measure))) || 1;
  return `<div style="display:flex;gap:6px;align-items:flex-end;height:130px">${series.map(month => `
      <div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:4px">
        <span class="sm">${measure === 'importe' ? formatCurrency(month.importe).replace(',00', '') : formatNumber(month.unidades)}</span>
        <div style="width:100%;background:var(--sky);border-radius:6px 6px 0 0;height:${Math.round(measureOf(month, measure) / max * BAR_HEIGHT)}px"></div>
        <span class="sm">${escapeHtml(month.mes.slice(5))}/${escapeHtml(month.mes.slice(2, 4))}</span></div>`).join('')}</div>`;
}

function rankingHtml(rows: readonly Row[], totals: Totals, measure: string): string {
  if (!rows.length) return `<div class="vacio">${t('analytics.explore.noOrders')}</div>`;
  const total = measureOf(totals, measure) || 1, share = (row: Row): number => Math.round(measureOf(row, measure) / total * 100);
  return `<div class="dgrid-wrap"><div class="dgrid arank">
    <div class="dh"><span>#</span><span>${escapeHtml(selectedText('adim'))}</span><span class="num">${t('analytics.explore.unitsHead')}</span>
      <span class="num">${t('analytics.explore.amountHead')}</span><span class="num">${t('analytics.explore.orders')}</span><span>${t('analytics.explore.weight')}</span></div>
    ${rows.map((row, index) => `<div class="dr u-cursor-default"><span class="sm">${index + 1}</span><span><b>${escapeHtml(row.nombre)}</b></span>
      <span class="num">${formatNumber(row.unidades)}</span><span class="num">${formatCurrency(row.importe)}</span><span class="num">${formatNumber(row.pedidos)}</span>
      <span class="barra"><i style="width:${share(row)}%"></i><em>${share(row)}%</em></span></div>`).join('')}
    <div class="dr dtot"><span></span><span><b>${t('analytics.explore.total')}</b></span><span class="num"><b>${formatNumber(totals.unidades)}</b></span>
      <span class="num"><b>${formatCurrency(totals.importe)}</b></span><span class="num"><b>${formatNumber(totals.pedidos)}</b></span><span></span></div>
  </div></div>`;
}

function setHtml(id: string, html: string): void { const box = element(id); if (box) box.innerHTML = html; }

export async function paintRanking(): Promise<void> {
  analyticsLegacy.loading(element('atabla'), t('analytics.explore.calculating'));
  setHtml('atot', Array.from({ length: SKELETONS }, () => '<div class="kpi ksk"><div class="skel" style="width:40%;height:24px;margin:2px 0 8px"></div><div class="skel" style="width:70%;margin:0"></div></div>').join(''));
  const range = analyticsLegacy.period('aper'), dimension = valueOf('adim'), measure = valueOf('amedida');
  const { data, error } = await legacyDb().rpc<Ranking>('analitica_v2', {
    p_dim: dimension, p_desde: range.desde, p_hasta: range.hasta, p_canal: valueOf('acanal') || null, ...filterParams(), lim: LIMIT,
  });
  if (error || !data) { setHtml('atabla', `<div class="vacio">${t('analytics.explore.couldNotCalculate', { error: escapeHtml((error as { message?: string } | null)?.message ?? '') })}</div>`); setHtml('atot', ''); return; }
  const totals = data.totales ?? {}, rows = [...(data.filas ?? [])].sort((first, second) => measureOf(second, measure) - measureOf(first, measure));
  setHtml('atot', totalsHtml(totals));
  setHtml('aprods', productsHtml(data.por_producto ?? [], totals, dimension));
  setHtml('aserie', seriesHtml(data.serie ?? [], measure));
  setHtml('atabla', rankingHtml(rows, totals, measure));
}

/** Repaints Explorar after a filter changes (the monthly table too, if it is the one shown). */
export function refreshExplore(): void {
  const table = element('atabla2');
  if (currentScreen() !== 'analitica' || !element('atabla') || !table) return;
  void paintRanking();
  if (!table.classList.contains('hide')) void paintMonthlyTable();
}
