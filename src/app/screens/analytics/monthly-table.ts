/**
 * Analítica → «Explorar datos» → «Tabla por meses»: one row per concept and one column per month, with totals and the cells shaded
 * by value. It applies the same filters as the ranking (before, a db.rpc hook of legado 109 added them). Migrated from the legacy
 * pintarTablaAnalitica (v2.412.0).
 */
import { legacyDb } from '../../legacy/bridge';
import { analyticsLegacy } from '../../legacy/analytics-bridge';
import { t } from '../../i18n';
import { shortMonthNames } from '../../services/date-format';
import { escapeHtml, formatCurrency, formatNumber } from '../../services/format';
import { sum } from '../../services/values';
import { filterParams, selectedText, valueOf } from './filters';

interface TableRow { nombre: string; total?: number; meses?: Record<string, number | undefined> | null }
interface MonthlyTable { medida?: string; meses?: string[]; filas?: TableRow[] }

const LIMIT = 30, NAME_WIDTH = 220, MONTH_WIDTH = 110, TOTAL_WIDTH = 120, BASE_SHADE = 0.08, SHADE_RANGE = 0.42;

/** A cell of the given width (numbers aligned right); `style` adds to its inline style (the shade of a month). */
const cell = (width: number, html: string, extra = '', style = ''): string =>
  `<span class="tcell${extra}" style="width:${width}px;min-width:${width}px${width === NAME_WIDTH ? '' : ';text-align:right'}${style}">${html}</span>`;
const valueIn = (row: TableRow, month: string): number => Number(row.meses?.[month]) || 0;

function monthHeader(month: string): string {
  const name = shortMonthNames()[Number(month.slice(5, 7)) - 1] ?? month.slice(5);
  return `${name} ${month.slice(2, 4)}`;
}

/** «Tabla mensual de unidades vendidas por profesional»: what each row and column is. */
function infoHtml(): string {
  const dimension = (selectedText('adim') || t('analytics.table.concept')).toLowerCase().replace(/^por /, '');
  const measure = t(valueOf('amedida') === 'importe' ? 'analytics.table.amount' : 'analytics.table.units');
  return `<div class="tabinfo"><b>${t('analytics.table.title', { measure: escapeHtml(measure), dimension: escapeHtml(dimension) })}</b>
    <span>${t('analytics.table.hint', { dimension: escapeHtml(dimension) })}</span></div>`;
}

function tableHtml(data: MonthlyTable, rows: readonly TableRow[]): string {
  const months = data.meses ?? [], format = (value: unknown): string => (data.medida === 'importe' ? formatCurrency(value) : formatNumber(value));
  const max = Math.max(1, ...rows.flatMap(row => months.map(month => valueIn(row, month))));
  const shade = (value: number): string => (value ? `;background:rgba(46,134,201,${(BASE_SHADE + value / max * SHADE_RANGE).toFixed(2)})` : '');
  const monthCell = (row: TableRow, month: string): string =>
    cell(MONTH_WIDTH, row.meses?.[month] ? format(row.meses[month]) : '<span class="sm">·</span>', '', shade(valueIn(row, month)));
  return `<div class="tabla"><div style="min-width:${180 + months.length * MONTH_WIDTH}px">
    <div class="thead">${cell(NAME_WIDTH, t('analytics.table.concept'), ' th')}
      ${months.map(month => cell(MONTH_WIDTH, escapeHtml(monthHeader(month)), ' th')).join('')}
      ${cell(TOTAL_WIDTH, t('analytics.explore.total'), ' th')}</div>
    ${rows.map(row => `<div class="trow u-cursor-default">
      ${cell(NAME_WIDTH, `<b>${escapeHtml(row.nombre)}</b>`)}
      ${months.map(month => monthCell(row, month)).join('')}
      ${cell(TOTAL_WIDTH, `<b>${format(row.total)}</b>`)}</div>`).join('')}
    <div class="trow" data-fijo style="cursor:default;background:var(--bg)">
      ${cell(NAME_WIDTH, `<b>${t('analytics.explore.total')}</b>`)}
      ${months.map(month => cell(MONTH_WIDTH, `<b>${format(sum(rows.map(row => valueIn(row, month))))}</b>`)).join('')}
      ${cell(TOTAL_WIDTH, `<b>${format(sum(rows.map(row => Number(row.total) || 0)))}</b>`)}</div>
  </div></div>`;
}

/** The rows for «Descargar» (the legacy download reads window.__ANTABLA). */
function exportRows(data: MonthlyTable, rows: readonly TableRow[]): Record<string, unknown>[] {
  return rows.map(row => ({ concepto: row.nombre, ...Object.fromEntries((data.meses ?? []).map(month => [month, row.meses?.[month] ?? 0])), total: row.total }));
}

/** «Mes» has no monthly table of its own: it shows the products. */
function tableParams(): Record<string, unknown> {
  const dimension = valueOf('adim');
  return {
    p_dim: dimension === 'mes' ? 'producto' : dimension, p_desde: valueOf('adesde') || null, p_hasta: valueOf('ahasta') || null,
    p_canal: valueOf('acanal') || null, p_medida: valueOf('amedida') || 'unidades', lim: LIMIT, ...filterParams(),
  };
}

export async function paintMonthlyTable(): Promise<void> {
  const box = document.getElementById('atabla2'); if (!box) return;
  analyticsLegacy.loading(box, t('analytics.table.calculating'));
  const { data, error } = await legacyDb().rpc<MonthlyTable>('analitica_tabla', tableParams());
  if (error || !data) { box.innerHTML = `<div class="vacio">${escapeHtml((error as { message?: string } | null)?.message ?? '')}</div>`; return; }
  const rows = data.filas ?? [];
  if (!rows.length) { box.innerHTML = `<div class="vacio">${t('analytics.table.noData')}</div>`; return; }
  box.innerHTML = infoHtml() + tableHtml(data, rows);
  analyticsLegacy.setTableExport(exportRows(data, rows));
}
