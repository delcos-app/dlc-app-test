/**
 * The clicks and typing of the list bar: indicators, quick filters (a pick-one popover over their select), «⋯», «Filtros», «Eliminar
 * filtros», «Columnas», map, the search and the block band. Screens with sections answer first, in the capture phase, with the open
 * section's configuration. Migrated from the listeners of legado 084, 086 and 087 (v2.236.0; v2.238.0; v2.239.0; v2.421.0); each one is
 * registered at the same place of the load order as before (see index.ts).
 */
import { t } from '../../i18n';
import { orFallback } from '../../services/values';
import { closePopovers, openPopover } from '../list';
import type { PopoverItem } from '../list/popover';
import { filterBlocks } from './blocks-table';
import { configOf, configs } from './configs';
import { chosenGroups, sections } from './state';
import { syncListBar } from './sync';
import { selectOf } from './text';
import type { ListConfig } from './types';

const SEARCH_WAIT_MS = 300, MAP_SYNC_MS = 50, CUSTOM_PERIOD_MS = 60;
let searchTimer: ReturnType<typeof setTimeout> | undefined, pendingInput: HTMLInputElement | undefined;

const screenOf = (section: Element): string => section.id.slice(2);
const listSection = (target: EventTarget | null): HTMLElement | null => (target as Element | null)?.closest<HTMLElement>('main > section.plantilla') ?? null;

/** A quick filter: its select's options in a popover (pressing it again closes it). */
function openQuickFilter(section: Element, chip: HTMLElement, options: { firstAsAll: boolean; onChosen?: (option: HTMLOptionElement) => void }): void {
  if (document.querySelector('.plpop') && chip.classList.contains('abierto')) { closePopovers(); chip.classList.remove('abierto'); return; }
  section.querySelectorAll('.plchip.abierto').forEach(other => { other.classList.remove('abierto'); });
  const select = selectOf(chip.dataset.plr); if (!select) return;
  chip.classList.add('abierto');
  const items: PopoverItem[] = [...select.options].map((option, index) => ({
    t: index === 0 && options.firstAsAll ? orFallback(option.text, t('listBar.bar.all')) : option.text, on: select.selectedIndex === index,
    fn: () => { chip.classList.remove('abierto'); select.selectedIndex = index; select.dispatchEvent(new Event('change', { bubbles: true })); options.onChosen?.(option); },
  }));
  openPopover(chip, items);
}

function openMore(button: HTMLElement, config: ListConfig): void {
  const items = config.mas().filter(([id]) => { const action = document.getElementById(id); return action && !action.classList.contains('hide'); })
    .map(([id, text]) => ({ t: text, fn: () => { document.getElementById(id)?.click(); } }));
  if (items.length) openPopover(button, items);
}

/** The bar's buttons of a screen with one configuration (Cuentas, Clientes). */
function onScreenClick(event: MouseEvent): void {
  const target = event.target as Element;
  if (!target.closest('.plpop') && !target.closest('.plchip, .plmas')) closePopovers();
  const section = listSection(target); if (!section) return;
  const tab = screenOf(section), config = configs[tab] as ListConfig | undefined; if (!config) return;
  const indicator = target.closest<HTMLElement>('[data-plk]'); if (indicator) { config.kpiPulsar(indicator.dataset.plk ?? ''); syncListBar(tab); return; }
  const chip = target.closest<HTMLElement>('[data-plr]'); if (chip) { openQuickFilter(section, chip, { firstAsAll: true }); return; }
  const more = target.closest<HTMLElement>('.plmas'); if (more) { openMore(more, config); return; }
  barButton(target, tab, config);
}

/** «Filtros», «Eliminar filtros», «Columnas» and the map. */
function barButton(target: Element, tab: string, config: ListConfig): void {
  if (target.closest('.plfil')) { config.filtros(); return; }
  if (target.closest('.plquitar') && config.quitar) { config.quitar(); syncListBar(tab); return; }
  if (target.closest('.plcol')) { config.columnas(); return; }
  if (target.closest('.plmapa')) { config.mapa()?.click(); setTimeout(() => { syncListBar(tab); }, MAP_SYNC_MS); }
}

/** The bar's buttons of a screen with sections (Ventas, Facturación, Productos, block pages): the open section's configuration. */
function onSectionClick(event: MouseEvent): void {
  const target = event.target as Element, section = listSection(target); if (!section || !sections[screenOf(section)]) return;
  const config = configOf(screenOf(section)); if (!config) return;
  const chip = target.closest<HTMLElement>('[data-plr]');
  if (chip) {
    event.stopImmediatePropagation();
    // A custom period: its dates are in the filters panel
    openQuickFilter(section, chip, { firstAsAll: false, onChosen: option => { if (/pers/i.test(option.value) || /personaliz/i.test(option.text)) setTimeout(() => { config.filtros(); }, CUSTOM_PERIOD_MS); } });
    return;
  }
  const more = target.closest<HTMLElement>('.plmas'); if (more) { event.stopImmediatePropagation(); openMore(more, config); return; }
  if (target.closest('.plfil')) { event.stopImmediatePropagation(); config.filtros(); return; }
  if (target.closest('.plcol')) { event.stopImmediatePropagation(); config.columnas(); }
}

/**
 * The typed text is searched once typing stops. It is kept as typed: while it waits, the bar does not put the old search back
 * in the box (a search that ends meanwhile repaints the bar, and on the phone the box has already lost the focus).
 */
function searchLater(input: HTMLInputElement, search: (text: string) => void): void {
  const text = input.value.trim();
  if (pendingInput && pendingInput !== input) delete pendingInput.dataset.pending;
  pendingInput = input; input.dataset.pending = '1';
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { delete input.dataset.pending; pendingInput = undefined; search(text); }, SEARCH_WAIT_MS);
}

const searchInput = (event: Event): HTMLInputElement | null => (event.target as Element | null)?.closest<HTMLInputElement>('main > section.plantilla .plqi') ?? null;

/** Listeners of the screens with one configuration (legado 084's place). */
export function listenToScreens(): void {
  document.addEventListener('click', onScreenClick);
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && document.querySelector('.plpop')) closePopovers(); });
  addEventListener('scroll', () => { if (document.querySelector('.plpop')) closePopovers(); }, { passive: true });
  document.addEventListener('input', event => {
    const input = searchInput(event); if (!input) return;
    const tab = input.closest('section')?.id.slice(2) ?? '';
    searchLater(input, text => { (configs[tab] as ListConfig | undefined)?.buscarQ(text); });
  });
}

/** Listeners of the screens with sections (legado 086's place): they answer first and stop the general ones. */
export function listenToSections(): void {
  document.addEventListener('click', onSectionClick, true);
  document.addEventListener('input', event => {
    const input = searchInput(event); if (!input) return;
    const tab = input.closest('section')?.id.slice(2) ?? ''; if (!sections[tab]) return;
    event.stopImmediatePropagation();
    searchLater(input, text => { configOf(tab)?.buscarQ(text); });
  }, true);
}

/** The block band (legado 087's place): pressing a block filters by it, pressing it again shows all. */
export function listenToBlocks(): void {
  document.addEventListener('click', event => {
    const button = (event.target as Element | null)?.closest<HTMLElement>('main > section.plantilla [data-plg]'); if (!button) return;
    const tab = button.closest('section')?.id.slice(2) ?? '';
    chosenGroups[tab] = chosenGroups[tab] === button.dataset.plg ? '' : button.dataset.plg; filterBlocks(tab); syncListBar(tab);
  });
}
