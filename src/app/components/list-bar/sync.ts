/**
 * Puts (or adjusts again) the list page model on top of what the screen painted; it can be called as often as needed. The seven
 * legacy layers of plSync (v2.236.0–v2.257.0 and the quick filters that do not disappear) are one function here, in the same order.
 * Migrated from plSync, plSyncBase–plSyncBase7 and plAjenos (v2.421.0).
 */
import { term } from '../../legacy/bridge';
import { listBarLegacy } from '../../legacy/listbar-bridge';
import { convertBlocks } from './blocks-table';
import { blocks, configOf } from './configs';
import { sections } from './state';
import { syncBar } from './sync-bar';
import { syncTable } from './sync-body';
import { syncHeader, toggleIfDifferent } from './sync-header';
import { orFallback } from '../../services/values';
import { t } from '../../i18n';
import { labelOf, selectOf } from './text';
import type { ListConfig } from './types';

const PERIOD_FILTERS = ['pper', 'pcanal', 'pestado', 'popf', 'porigf', 'prepf'];
/** Pedidos and Oportunidades share the filters panel: the other section's filters move aside (not in the panel nor as active filters). */
const FOREIGN: Readonly<Record<string, readonly string[]>> = {
  pedidos: ['llper', 'llfres'], oport: PERIOD_FILTERS, compras: ['llper', 'llfres', ...PERIOD_FILTERS], prov: ['llper', 'llfres', ...PERIOD_FILTERS],
};

function moveForeignFilters(section: Element, key: string): void {
  const panel = section.querySelector(':scope > .htpanel'), own = panel?.querySelector('.htpropios'); if (!panel || !own) return;
  let aside = panel.querySelector(':scope > .plajenos');
  if (!aside) { aside = document.createElement('div'); aside.className = 'plajenos hide'; panel.appendChild(aside); }
  const foreign = new Set(FOREIGN[key] ?? []);
  [...own.children, ...aside.children].forEach(field => {
    const select = field.querySelector('select'), id = field.id || (select?.id ?? ''), isForeign = foreign.has(id);
    if (isForeign && field.parentElement !== aside) aside.appendChild(field);
    else if (!isForeign && field.parentElement === aside) own.appendChild(field);
  });
}

/** A section without the model: what had been put is removed. */
function removeModel(section: HTMLElement): void {
  if (!section.classList.contains('plantilla')) return;
  section.classList.remove('plantilla'); section.querySelectorAll(':scope > .plkpis, :scope > .pltool, .plmas').forEach(element => { element.remove(); });
}

/** The page tabs (.pagtabs) go right under the header: the band and the bar, after them. */
function tabsFirst(section: HTMLElement): void {
  const tabs = section.querySelector(':scope > .pagtabs, :scope > .subnav'), band = section.querySelector(':scope > .plkpis'), bar = section.querySelector(':scope > .pltool');
  if (tabs && bar && (tabs.compareDocumentPosition(bar) & Node.DOCUMENT_POSITION_PRECEDING)) (band ?? bar).before(tabs);
}

/** The quick filters are there from the start: while their select does not exist yet, they show their name and wait. */
function waitingChips(section: HTMLElement, config: ListConfig): void {
  section.querySelectorAll<HTMLElement>(':scope > .pltool [data-plr]').forEach(chip => {
    if (selectOf(chip.dataset.plr)) { if (chip.classList.contains('plespera')) chip.classList.remove('plespera'); return; }
    const name = config.rapidos.find(([id]) => id === chip.dataset.plr)?.[1]; if (!name) return;
    if (chip.classList.contains('hide')) chip.classList.remove('hide');
    if (!chip.classList.contains('plespera')) chip.classList.add('plespera');
    if (chip.textContent !== name) chip.textContent = name;
  });
}

/** The block filter does not disappear: with a single block it stays disabled. */
function blockChip(tab: string): void {
  const block = blocks[tab]; if (!block) return;
  const chip = document.querySelector(`#v-${tab} > .pltool [data-plr="#plg-${tab}"]`), select = document.getElementById(`plg-${tab}`) as HTMLSelectElement | null;
  if (!chip || !select) return;
  const nothing = select.options.length < 2;
  if (nothing && chip.classList.contains('hide')) chip.classList.remove('hide');
  toggleIfDifferent(chip, 'plnada', nothing);
  if (nothing && chip.textContent !== block.grupo) chip.textContent = block.grupo;
}

/** Clientes from an account card: the professional filter is a marked quick filter with its «✕» (v2.257.0). */
function professionalChip(): void {
  const quick = document.querySelector('#v-pacientes > .pltool .plrap'); if (!quick) return;
  let chip = quick.querySelector('[data-plmed]');
  const filters = listBarLegacy.customerFilters();
  if (!filters.medico) { chip?.remove(); return; }
  const text = `${term('medico', { capital: 'C' })}: ${filters.medicoNombre || '—'}`;
  if (!chip) { quick.insertAdjacentHTML('afterbegin', `<button type="button" class="plchip on plmed" data-plmed title="${t('listBar.bar.removeThisFilter')}"><span></span><i aria-hidden="true">✕</i></button>`); chip = quick.querySelector('[data-plmed]'); }
  const label = chip?.querySelector('span'); if (label && label.textContent !== text) label.textContent = text;
}

/** Quick filters that do not disappear: one whose select has no options yet is shown disabled in its place. */
/** A chip with options is enabled again (except the block filter, which blockChip handles). */
function enableChip(chip: HTMLElement, tab: string): void {
  if (chip.classList.contains('plnada') && !(blocks[tab] && chip.dataset.plr === `#plg-${tab}`)) chip.classList.remove('plnada');
}

function emptyChip(chip: HTMLElement, tab: string): void {
  const select = selectOf(chip.dataset.plr); if (!select?.options) return;
  if (select.closest('#fcomwrap')?.classList.contains('hide')) return;
  if (select.options.length > 1) { enableChip(chip, tab); return; }
  if (chip.classList.contains('hide')) chip.classList.remove('hide');
  if (!chip.classList.contains('plnada')) chip.classList.add('plnada');
  const name = orFallback(chip.dataset.plt, labelOf(chip.dataset.plr ?? '')); if (name && chip.textContent !== name) chip.textContent = name;
}

function emptyChips(section: HTMLElement, tab: string): void {
  section.querySelectorAll<HTMLElement>(':scope > .pltool [data-plr]').forEach(chip => { emptyChip(chip, tab); });
}

function syncModel(section: HTMLElement, tab: string, config: ListConfig): void {
  const key = sections[tab]?.() ?? tab;
  section.classList.add('plantilla'); section.dataset.plsec = key;
  const anchor = syncHeader(section, tab, config, key);
  syncBar(section, tab, config, { key, anchor });
  syncTable(section, tab, config);
}

/** The later layers, in their order: tabs first, waiting chips, the block chip, the professional chip, the empty chips. */
function afterSync(section: HTMLElement, tab: string): void {
  if (section.classList.contains('plantilla')) tabsFirst(section);
  const config = configOf(tab); if (config) waitingChips(section, config);
  blockChip(tab);
  if (tab === 'pacientes') professionalChip();
  if (section.classList.contains('plantilla')) emptyChips(section, tab);
}

/** Puts or adjusts the list page model of a screen. */
export function syncListBar(tab: string): void {
  const section = document.getElementById(`v-${tab}`);
  const salesKey = tab === 'ventas' ? sections.ventas?.() : null; if (section && salesKey) moveForeignFilters(section, salesKey);
  if (blocks[tab] && configOf(tab)) convertBlocks(tab);
  if (!section) return;
  const config = configOf(tab);
  if (!config) { removeModel(section); } else syncModel(section, tab, config);
  afterSync(section, tab);
}
