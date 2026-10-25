/**
 * How many filters are on (the number on the «Filtros y columnas» button) and the chips next to the search, one per filter, that
 * remove it. Migrated from the legacy htActivos, htContador and htChips with their Base layers (v2.419.0); htContador and htChips stay
 * as adapters (the list bar and legado 056 call them).
 */
import { panelsLegacy } from '../../legacy/panels-bridge';
import type { TableFilters } from '../../legacy/lists-bridge';
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';
import { filterChips } from '../classifiers/model';
import { paintSidePanelClassifiers, screenOf } from '../classifiers/filters';
import { applyColumnFilters, tableKind } from '../filters/table-sort';
import { sideOpen, sideOpenFor, toolsBox } from './side';

interface Chip { t: string; remove: () => void }

export const gridOf = (section: Element): HTMLElement | null => section.querySelector<HTMLElement>('.dgrid');

/** The filters chosen for the table of a screen (created empty when missing). */
export function filtersOf(grid: Element): TableFilters & { facetas: Record<string, string> } {
  const all = panelsLegacy.tableFilters(), kind = tableKind(grid);
  const state = all[kind] ?? { texto: '', facetas: {} };
  state.facetas = state.facetas ?? {};
  all[kind] = state;
  return state as TableFilters & { facetas: Record<string, string> };
}

const chosen = (selects: Iterable<HTMLSelectElement>): number => [...selects].filter(select => select.selectedIndex > 0).length;

/** The filters on: the table's (text, per column, ranges), the screen's own selects (also in the side panel) and Clasificadores. */
export function activeCount(section: Element): number {
  const grid = gridOf(section), state = grid ? panelsLegacy.tableFilters()[tableKind(grid)] ?? {} : {};
  let count = Object.values(state.facetas ?? {}).filter(Boolean).length + (state.texto ? 1 : 0);
  count += chosen(section.querySelectorAll<HTMLSelectElement>('.htpanel .htpropios select'));
  if (sideOpenFor(section)) count += chosen(toolsBox()?.querySelectorAll<HTMLSelectElement>('.htpropios.lat select') ?? []);
  const classifiers = screenOf(section);
  if (classifiers) count += Object.keys(classifiers.estado()).length;
  return count + Object.values(state.rangos ?? {}).filter(range => [range.d, range.h].some(Boolean)).length;
}

function paintNumber(section: Element): void {
  const button = section.querySelector('.htbtn'); if (!button) return;
  // Only touched when the number changes (any change in the screen notifies the observer again)
  const count = activeCount(section), text = count ? String(count) : '', number = button.querySelector('.htn');
  if (number && number.textContent !== text) number.textContent = text;
  if (button.classList.contains('conf') !== count > 0) button.classList.toggle('conf', count > 0);
}

function selectChips(section: Element): Chip[] {
  const selects = [...section.querySelectorAll<HTMLSelectElement>('.htpanel .htpropios select'), ...(sideOpen() ? [...toolsBox()?.querySelectorAll<HTMLSelectElement>('.htpropios.lat select') ?? []] : [])];
  return selects.filter(select => select.selectedIndex > 0).map(select => {
    const label = select.id ? document.querySelector(`label[for="${select.id}"]`) : null;
    return { t: (label ? `${label.textContent?.trim() ?? ''}: ` : '') + (select.options[select.selectedIndex]?.text ?? ''), remove: (): void => { select.selectedIndex = 0; select.dispatchEvent(new Event('change', { bubbles: true })); } };
  });
}

function tableChips(section: Element): Chip[] {
  const grid = gridOf(section), state = grid ? panelsLegacy.tableFilters()[tableKind(grid)] : null;
  if (!grid || !state) return [];
  const heads = [...(grid.querySelector(':scope > .dh')?.children ?? [])].map(head => head.textContent?.trim() ?? '');
  const chips: Chip[] = Object.entries(state.facetas ?? {}).filter(([, value]) => value).map(([index, value]) => ({
    t: `${heads[Number(index)] ?? t('panels.filters.column')}: ${value}`, remove: (): void => { if (state.facetas) state.facetas[index] = ''; applyColumnFilters(grid); },
  }));
  if (state.texto) chips.push({ t: t('panels.filters.contains', { text: state.texto }), remove: (): void => { state.texto = ''; applyColumnFilters(grid); } });
  return chips;
}

function chipBox(section: Element): HTMLElement | null {
  const filters = section.querySelector('.filtros');
  if (!filters || filters.classList.contains('hide')) return null;
  let box = section.querySelector<HTMLElement>('.htchips');
  if (!box) { filters.insertAdjacentHTML('beforeend', '<div class="htchips"></div>'); box = section.querySelector<HTMLElement>('.htchips'); filters.classList.add('filbusca'); }
  return box;
}

function paintScreenChips(section: Element): void {
  const box = chipBox(section); if (!box) return;
  const chips = [...selectChips(section), ...tableChips(section)];
  const html = chips.map((chip, index) => `<button class="htchip" type="button" data-hchip="${index}">${escapeHtml(chip.t)} <span aria-hidden="true">✕</span></button>`).join('');
  if (box.innerHTML === html) return;
  box.innerHTML = html;
  box.querySelectorAll<HTMLElement>('[data-hchip]').forEach(button => {
    button.onclick = (): void => { chips[Number(button.dataset.hchip)]?.remove(); counter(section); paintChips(section); };
  });
}

/** The Clasificadores chips, in their own box after the others. */
export function paintChips(section: Element): void {
  paintScreenChips(section);
  const classifiers = screenOf(section), box = section.querySelector('.htchips'); if (!box) return;
  let second = section.querySelector<HTMLElement>('.htchips2');
  if (!second) { box.insertAdjacentHTML('afterend', '<div class="htchips htchips2"></div>'); second = section.querySelector<HTMLElement>('.htchips2'); }
  if (!second) return;
  const state = classifiers ? classifiers.estado() : {}, chips = classifiers ? filterChips(classifiers.amb, state) : [];
  const html = chips.map(chip => `<button class="htchip" type="button" data-hcp="${escapeHtml(chip.k)}">${escapeHtml(chip.t)} <span aria-hidden="true">✕</span></button>`).join('');
  if (second.innerHTML === html) return;
  second.innerHTML = html;
  second.querySelectorAll<HTMLElement>('[data-hcp]').forEach(button => {
    button.onclick = (): void => {
      Reflect.deleteProperty(state, button.dataset.hcp ?? ''); classifiers?.recargar(); paintSidePanelClassifiers(section); counter(section);
    };
  });
}


/** The number on the button and the chips. */
export function counter(section: Element): void {
  paintNumber(section);
  paintChips(section);
}
