/**
 * The bar of a list page kept in step with the screen: the search text, each quick filter (shown with its value, marked when it
 * filters, hidden without options), the number of filters, «Eliminar filtros» and the count. Part of plSync (v2.236.0; v2.421.0).
 */
import { t } from '../../i18n';
import { toggleIfDifferent } from './sync-header';
import { labelOf, selectOf } from './text';
import { countHtml, toolbarHtml } from './toolbar';
import type { ListConfig } from './types';

/** The bar of the open section (a new one when the section changes), right under the band or the anchor. */
function barOf(section: HTMLElement, tab: string, key: string, anchor: Element | null): HTMLElement {
  let bar = section.querySelector<HTMLElement>(':scope > .pltool');
  if (bar && bar.dataset.plsec !== key) { bar.remove(); bar = null; }
  if (!bar) { bar = document.createElement('div'); bar.className = 'pltool'; bar.dataset.plsec = key; bar.innerHTML = toolbarHtml(tab); }
  if (!bar.isConnected) { const before = section.querySelector(':scope > .plkpis') ?? anchor; if (before) before.after(bar); else section.prepend(bar); }
  return bar;
}

/** A quick filter: visible only with options (and its box not hidden); its text says the value chosen. */
function shownSelect(chip: HTMLElement): HTMLSelectElement | null {
  const select = selectOf(chip.dataset.plr); if (!select) return null;
  const hiddenBox = select.closest('#fcomwrap')?.classList.contains('hide') ?? false;
  return !hiddenBox && select.options.length > 1 ? select : null;
}

function syncChip(chip: HTMLElement): void {
  const select = shownSelect(chip);
  toggleIfDifferent(chip, 'hide', !select); if (!select) return;
  if (!chip.dataset.plt) chip.dataset.plt = labelOf(chip.dataset.plr ?? '');
  const name = chip.dataset.plt, isPeriod = name === t('listBar.bar.period'), chosen = select.selectedIndex > 0;
  const text = chosen || isPeriod ? `${name}: ${(select.options[select.selectedIndex]?.text ?? '').replace(/\s*\(\d[\d.]*\)\s*$/, '')}` : name;
  if (chip.textContent !== text) chip.textContent = text;
  toggleIfDifferent(chip, 'on', chosen && !isPeriod);
}

/** The number of filters on «Filtros», «Eliminar filtros» and the count. */
function syncCounts(section: HTMLElement, bar: HTMLElement, config: ListConfig): void {
  const active = config.activos(), number = bar.querySelector('.pln');
  if (number) { const value = String(active || ''); if (number.textContent !== value) number.textContent = value; toggleIfDifferent(number, 'hide', !active); }
  const remove = bar.querySelector('.plquitar'); if (remove) toggleIfDifferent(remove, 'hide', !active);
  const count = bar.querySelector<HTMLElement>('.plcnt'), html = countHtml(section, config);
  if (count && html && count.dataset.h !== html) { count.dataset.h = html; count.innerHTML = html; }
}

export function syncBar(section: HTMLElement, tab: string, config: ListConfig, place: { key: string; anchor: Element | null }): void {
  const bar = barOf(section, tab, place.key, place.anchor);
  const search = bar.querySelector<HTMLInputElement>('.plqi'); if (search && document.activeElement !== search && search.value !== config.q()) search.value = config.q();
  bar.querySelectorAll<HTMLElement>('[data-plr]').forEach(syncChip);
  syncCounts(section, bar, config);
}
