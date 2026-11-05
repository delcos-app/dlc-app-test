/**
 * The list bar in its «selection» state (D-048, variant A): with something selected the bar itself becomes the action bar, in the
 * same place and with the same height: ✕ · «10 pedidos seleccionados» · «Seleccionar los 28 del filtro» · each action with how
 * many of the selected rows it applies to (disabled when none) · Exportar. While an action runs it only says its progress.
 */
import { listBarLegacy } from '../../../legacy/listbar-bridge';
import { t } from '../../../i18n';
import { escapeHtml, formatNumber } from '../../../services/format';
import { splitRows } from './run';
import type { SelectionState } from './source';
import type { BulkAction, PageSource, SelectionConfig } from './types';

const BAR = 'plselbar', ON = 'plselon';

export const BAR_CLASSES = { clear: 'plselx', allOfFilter: 'plselallf', action: 'plsela', exportButton: 'plselexp' };

/** The actions this person may use. */
export const allowedActions = (config: SelectionConfig): BulkAction[] => config.actions().filter(action => action.allowed());

function actionButton(action: BulkAction, state: SelectionState): string {
  const rows = [...state.rows.values()], count = splitRows(action, rows).ready.length, off = !count || Boolean(state.running);
  return `<button type="button" class="btn sec chico${action.danger ? ' dang' : ''}" data-${BAR_CLASSES.action}="${escapeHtml(action.id)}"${off ? ' disabled' : ''}>${escapeHtml(action.label)} (${formatNumber(count)})</button>`;
}

function actionsHtml(config: SelectionConfig, state: SelectionState, canExport: boolean): string {
  const own = allowedActions(config).map(action => actionButton(action, state)).join('');
  const exportButton = canExport ? `<button type="button" class="btn sec chico" data-${BAR_CLASSES.exportButton}${state.running ? ' disabled' : ''}>${t('listSelection.export')}</button>` : '';
  return `<span class="plselacts">${own}${exportButton}</span>`;
}

function countHtml(config: SelectionConfig, state: SelectionState, page: PageSource): string {
  if (state.running) return `<span class="plselcnt" role="status">${escapeHtml(state.running)}</span>`;
  const size = state.rows.size, values = { count: formatNumber(size), what: escapeHtml(size === 1 ? config.one() : config.what()) }, total = { count: formatNumber(page.total) };
  const count = size === 1 ? (config.feminine ? t('listSelection.countOneFeminine', values) : t('listSelection.countOne', values))
    : config.feminine ? t('listSelection.countFeminine', values) : t('listSelection.count', values);
  const label = config.feminine ? t('listSelection.selectAllFeminine', total) : t('listSelection.selectAll', total);
  const more = page.all && size < page.total ? `<button type="button" class="btn sec chico ${BAR_CLASSES.allOfFilter}">${label}</button>` : '';
  return `<span class="plselcnt" role="status">${count}</span>${more}`;
}

/** Puts (or updates) the action bar inside the list bar; it shows while something is selected or running. */
/** What the bar shows: the selection, the page and whether Exportar is offered. */
export interface BarView { readonly state: SelectionState; readonly page: PageSource; readonly canExport: boolean }

export function paintBar(section: Element, config: SelectionConfig, view: BarView): void {
  const { state, page, canExport } = view;
  const bar = section.querySelector<HTMLElement>(':scope > .pltool'); if (!bar) return;
  let own = bar.querySelector<HTMLElement>(`:scope > .${BAR}`);
  if (!own) { own = document.createElement('div'); own.className = BAR; bar.appendChild(own); }
  const active = state.rows.size > 0 || Boolean(state.running);
  if (bar.classList.contains(ON) !== active) bar.classList.toggle(ON, active);
  const html = active ? `<button type="button" class="btn sec icoonly chico ${BAR_CLASSES.clear}" aria-label="${t('listSelection.clear')}" title="${t('listSelection.clear')}"${state.running ? ' disabled' : ''}>${listBarLegacy.lineIcon('x')}</button>${countHtml(config, state, page)}${actionsHtml(config, state, canExport)}` : '';
  if (own.dataset.h !== html) { own.dataset.h = html; own.innerHTML = html; }
}

export function removeBar(section: Element): void {
  const bar = section.querySelector(':scope > .pltool');
  bar?.classList.remove(ON); bar?.querySelector(`:scope > .${BAR}`)?.remove();
}
