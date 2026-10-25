/**
 * The automatic part of «Filtros y columnas» for the table of a screen: search in the table, a filter per column by its kind (text
 * contains, number or date range; no date range when the screen has its own period), the columns (a button that opens the second
 * panel) and «Eliminar filtros». Painted in the side panel when it is open for the screen. Migrated from the legacy htPintarPanel and
 * its Base layers (v2.419.0).
 */
import { icon } from '../../legacy/bridge';
import { panelsLegacy } from '../../legacy/panels-bridge';
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';
import { enhanceFields } from '../date-picker/enhance';
import { columnKind, normalise, notFilterable } from '../filters/cell-values';
import { applyColumnFilters, tableKind } from '../filters/table-sort';
import { applyColumns, hiddenOf, setHidden } from './columns';
import { counter, filtersOf, gridOf } from './counter';
import { sideOpen, sideOpenFor, toolsBox } from './side';

interface Facet { i: number; nombre: string; vals: string[] }

const headsOf = (grid: Element): string[] => [...(grid.querySelector(':scope > .dh')?.children ?? [])].map(cell => cell.textContent?.trim() ?? '');
const rowsOf = (grid: Element): Element[] => [...grid.querySelectorAll(':scope > .dr')];
const cellText = (row: Element, index: number): string => row.children[index]?.textContent ?? '';

function facetsOf(grid: Element): Facet[] {
  const rows = rowsOf(grid);
  return headsOf(grid).map((nombre, i) => {
    const vals = [...new Set(rows.map(row => cellText(row, i).trim()).filter(Boolean))];
    return vals.length > 1 && vals.length <= 15 && nombre ? { i, nombre, vals: vals.sort() } : null;
  }).filter((facet): facet is Facet => facet !== null);
}

function autoHtml(grid: Element, state: { texto?: string; facetas: Record<string, string> }): string {
  const heads = headsOf(grid), facets = facetsOf(grid), hidden = hiddenOf(tableKind(grid));
  const facetHtml = facets.map(facet => `<label><span>${escapeHtml(facet.nombre)}</span><select data-htf="${facet.i}"><option value="">${t('panels.filters.all')}</option>${facet.vals.map(value => `<option ${state.facetas[facet.i] === value ? 'selected' : ''}>${escapeHtml(value)}</option>`).join('')}</select></label>`).join('');
  const columnHtml = heads.map((name, i) => (name ? `<label class="opt"><input type="checkbox" data-htc="${i}" ${hidden.includes(i) ? '' : 'checked'} ${i === 0 ? 'disabled' : ''}> ${escapeHtml(name)}</label>` : '')).join('');
  return `
      <div class="htbloque"><h4>${t('panels.filters.searchTable')}</h4><input type="search" class="httexto" value="${escapeHtml(state.texto ?? '')}" placeholder="${t('panels.filters.searchPlaceholder')}"></div>
      ${facets.length ? `<div class="htbloque"><h4>${t('panels.filters.byColumn')}</h4><div class="htfacetas">${facetHtml}</div></div>` : ''}
      ${heads.filter(Boolean).length > 2 ? `<div class="htbloque"><h4>${t('panels.filters.columns')}</h4><div class="htcols">${columnHtml}</div></div>` : ''}
      <div class="acts u-m-0 u-end"><button class="btn sec dang" type="button" data-htlimpiar>${icon('x')} ${t('panels.filters.clear')}</button></div>`;
}

function bindAuto(section: Element, panel: Element, grid: HTMLElement, zone: Element): void {
  const kind = tableKind(grid), state = filtersOf(grid);
  const search = zone.querySelector<HTMLInputElement>('.httexto');
  if (search) search.oninput = (): void => { state.texto = search.value; applyColumnFilters(grid); counter(section); };
  zone.querySelectorAll<HTMLSelectElement>('[data-htf]').forEach(select => { select.onchange = (): void => { state.facetas[select.dataset.htf ?? ''] = select.value; applyColumnFilters(grid); counter(section); }; });
  zone.querySelectorAll<HTMLInputElement>('[data-htc]').forEach(box => { box.onchange = (): void => { setHidden(kind, Number(box.dataset.htc), box.checked); applyColumns(grid); }; });
  const clear = zone.querySelector<HTMLElement>('[data-htlimpiar]');
  if (clear) clear.onclick = (): void => {
    panelsLegacy.tableFilters()[kind] = { texto: '', facetas: {} };
    panel.querySelectorAll<HTMLSelectElement>('.htpropios select').forEach(select => { if (select.selectedIndex > 0) { select.selectedIndex = 0; select.dispatchEvent(new Event('change', { bubbles: true })); } });
    applyColumnFilters(grid); paintPanel(section); counter(section);
  };
}

/** The automatic zone of `panel` (the screen's panel, or a temporary one whose zone goes to the side panel). */
function paintAuto(section: Element, panel: Element): void {
  const grid = gridOf(section), zone = panel.querySelector('.htauto');
  if (!zone) return;
  zone.innerHTML = '';
  if (!grid) return;
  zone.innerHTML = autoHtml(grid, filtersOf(grid));
  bindAuto(section, panel, grid, zone);
}

/** With the side panel open for the screen, the automatic zone is painted on a temporary panel and moved there. */
function paintSideAuto(section: Element): void {
  if (!sideOpenFor(section)) return;
  const temporary = document.createElement('div');
  temporary.className = 'htpanel'; temporary.innerHTML = '<div class="htauto"></div>';
  paintAuto(section, temporary);
  const zone = temporary.querySelector('.htauto');
  if (zone) toolsBox()?.querySelector('.htauto')?.replaceWith(zone);
}

/** In the side panel, the columns become a button that opens the second panel. */
function columnsButton(section: Element): void {
  const auto = toolsBox()?.querySelector('.htauto'); if (!auto || !sideOpen()) return;
  const block = [...auto.querySelectorAll('.htbloque')].find(item => item.querySelector('[data-htc]')); if (!block) return;
  const grid = gridOf(section); if (!grid) return;
  const kind = tableKind(grid);
  const columns = [...block.querySelectorAll<HTMLInputElement>('[data-htc]')].map(box => ({ i: Number(box.dataset.htc), n: box.parentElement?.textContent?.trim() ?? '', on: box.checked, fija: box.disabled }));
  const label = (): string => t('panels.filters.chooseColumns', { visible: columns.filter(column => column.on).length, total: columns.length });
  block.innerHTML = `<h4>${t('panels.filters.columns')}</h4><button class="btn sec t2abrir" type="button">${label()}<span>›</span></button>`;
  const open = block.querySelector<HTMLElement>('.t2abrir');
  if (open) open.onclick = (): void => {
    panelsLegacy.columnsPanel(t('panels.filters.columns'), columns, (index, on) => {
      setHidden(kind, index, on); applyColumns(grid);
      const column = columns.find(item => item.i === index); if (column) column.on = on;
      const text = open.firstChild; if (text) text.textContent = label();
    });
  };
}

interface RangeColumn { i: number; nombre: string; t: 'texto' | 'fecha' | 'numero' }
type PanelFilters = ReturnType<typeof filtersOf>;

/** Columns that get a filter: not the screen's own filters, and no dates when the screen has its own period. */
function rangeColumns(panel: Element, grid: Element): RangeColumn[] {
  const own = [...panel.querySelectorAll('.htpropios label, .htpropios h4, .htpropios .lab')].map(item => normalise(item.textContent));
  const hasPeriod = own.some(text => /periodo|fecha/.test(text)), rows = rowsOf(grid);
  return headsOf(grid).map((nombre, i): RangeColumn | null => {
    if (notFilterable(nombre) || own.includes(normalise(nombre))) return null;
    const kind = columnKind(rows.map(row => cellText(row, i)));
    return kind === 'fecha' && hasPeriod ? null : { i, nombre, t: kind };
  }).filter((column): column is RangeColumn => column !== null);
}

function rangeHtml(column: RangeColumn, state: PanelFilters): string {
  if (column.t === 'texto') return `<label><span>${escapeHtml(column.nombre)}</span><input type="search" class="chico" data-htt="${column.i}" value="${escapeHtml(state.facetas[column.i] ?? '')}" placeholder="${t('panels.filters.containsPlaceholder')}"></label>`;
  const type = column.t === 'fecha' ? 'date' : 'number', range = state.rangos?.[column.i] ?? {};
  return `<div class="htrango"><span>${escapeHtml(column.nombre)}</span><div><input type="${type}" class="chico" data-htd="${column.i}" data-htk="${column.t}" value="${escapeHtml(range.d ?? '')}" aria-label="${escapeHtml(t('panels.filters.fromLabel', { name: column.nombre }))}" placeholder="${t('panels.filters.from')}">
          <input type="${type}" class="chico" data-hth="${column.i}" data-htk="${column.t}" value="${escapeHtml(range.h ?? '')}" aria-label="${escapeHtml(t('panels.filters.toLabel', { name: column.nombre }))}" placeholder="${t('panels.filters.to')}"></div></div>`;
}

function placeRanges(zone: Element, html: string): void {
  const block = zone.querySelector('.htfacetas')?.closest('.htbloque');
  const before = [...zone.querySelectorAll('.htbloque')].find(item => item.querySelector('[data-htc], .t2abrir')) ?? zone.querySelector('.acts');
  if (block) block.outerHTML = html;
  else if (html) { if (before) before.insertAdjacentHTML('beforebegin', html); else zone.insertAdjacentHTML('beforeend', html); }
}

function bindRanges(section: Element, grid: HTMLElement, zone: Element, state: PanelFilters): void {
  zone.querySelectorAll<HTMLInputElement>('[data-htt]').forEach(input => { input.oninput = (): void => { state.facetas[input.dataset.htt ?? ''] = input.value; applyColumnFilters(grid); counter(section); }; });
  zone.querySelectorAll<HTMLInputElement>('[data-htd], [data-hth]').forEach(input => {
    input.oninput = input.onchange = (): void => {
      const ranges = state.rangos ?? {}, index = input.dataset.htd ?? input.dataset.hth ?? '', range = ranges[index] ?? {};
      if (input.dataset.htk !== undefined) range.k = input.dataset.htk;
      if (input.dataset.htd) range.d = input.value; else range.h = input.value;
      ranges[index] = range; state.rangos = ranges;
      applyColumnFilters(grid); counter(section);
    };
  });
}

/** The filter per column by kind: «contiene» for text, from–to for numbers and dates. */
function paintRanges(section: Element): void {
  const panel = sideOpen() ? toolsBox() : section.querySelector('.htpanel'), grid = gridOf(section), zone = panel?.querySelector('.htauto');
  if (!panel || !grid || !zone) return;
  const state = filtersOf(grid); state.rangos = state.rangos ?? {};
  const columns = rangeColumns(panel, grid);
  const html = columns.length ? `<div class="htbloque htcolf"><h4>${t('panels.filters.byColumn')}</h4><div class="htfacetas">${columns.map(column => rangeHtml(column, state)).join('')}</div></div>` : '';
  placeRanges(zone, html);
  // The filters of before (a select with an exact value) become «contiene»
  Object.keys(state.facetas).forEach(index => { if (!columns.some(column => column.i === Number(index) && column.t === 'texto')) Reflect.deleteProperty(state.facetas, index); });
  bindRanges(section, grid, zone, state);
  try { enhanceFields(zone); } catch { /* the pickers are optional */ }
}

/** Paints the panel of a screen (in the side panel when it is open for it). */
export function paintPanel(section: Element): void {
  paintSideAuto(section);
  columnsButton(section);
  paintRanges(section);
}
