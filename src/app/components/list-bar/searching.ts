/**
 * v2.468.0 (D-047): the «buscando» state of a list's search, the same on every list with the list bar (Clientes, Profesionales,
 * Pedidos, Facturas…). From the first letter typed until the latest answer is painted (or fails):
 * - the search box swaps its magnifier for the spinner (`.plq.buscando`, no size change);
 * - the count of the bar says «Buscando…»;
 * - the list says it is busy (`aria-busy`) and, while the request is out, keeps its last rows dimmed (`.platenua`, sync-body.ts).
 * Before, nothing showed while the search waited for the typing to stop, and the dimmed rows of Clientes lit up again while the
 * answer was still on its way (Eric, v2.467.0: «al buscar un cliente no aparece ningún cargador»).
 */
import { t } from '../../i18n';
import { configOf } from './configs';
import type { ListConfig } from './types';

/** How often the state looks at the list while it waits, and how long it waits for a screen that has not started loading. */
const CHECK_MS = 50, START_GRACE_MS = 500;

interface Searching { sentAt: number; sawLoading: boolean; timer?: ReturnType<typeof setInterval> | undefined }

const searching: Record<string, Searching | undefined> = {};

/** The count of the bar while searching. */
export const searchingText = (): string => t('listBar.bar.searching');

const sectionOf = (tab: string): HTMLElement | null => document.getElementById(`v-${tab}`);

/** The list is loading: the screen's loader, or the last rows kept (marked) while the answer comes. */
export const isLoading = (body: Element | null): boolean => Boolean(body?.querySelector(':scope > .cargador, :scope > [data-plold]'));

export const isSearching = (tab: string): boolean => Boolean(searching[tab]);

function mark(tab: string, on: boolean, config: ListConfig | null): void {
  const section = sectionOf(tab);
  section?.querySelectorAll(':scope > .pltool .plq').forEach(box => { box.classList.toggle('buscando', on); });
  const body = config?.cuerpo();
  if (body) { if (on) body.setAttribute('aria-busy', 'true'); else body.removeAttribute('aria-busy'); }
}

/** The search is over: everything goes back (and, from the timer, the bar shows the count of the list painted). */
function finish(tab: string, sync?: (tab: string) => void): void {
  const state = searching[tab]; if (!state) return;
  clearInterval(state.timer); searching[tab] = undefined;
  mark(tab, false, configOf(tab));
  sync?.(tab);
}

/** After the search was sent: true once the list has loaded and shows new content (or its error), or never started loading. */
function isOver(tab: string, state: Searching): boolean {
  if (!sectionOf(tab)?.isConnected) return true;
  if (isLoading(configOf(tab)?.cuerpo() ?? null)) { state.sawLoading = true; return false; }
  return state.sawLoading || performance.now() - state.sentAt > START_GRACE_MS;
}

/**
 * Each adjustment of the bar (the screen painted something): the state ends in the same frame in which the new rows appear, so that
 * the count and the rows change together. The bar is adjusted next, with its count.
 */
export function settleSearching(tab: string): void {
  const state = searching[tab]; if (!state) return;
  if (state.sentAt && isOver(tab, state)) finish(tab); else mark(tab, true, configOf(tab));
}

/** Typing: the state starts (or goes on) and waits for the search to be sent. */
export function startSearching(tab: string): void {
  const state = searching[tab];
  if (state) { clearInterval(state.timer); state.timer = undefined; state.sentAt = 0; state.sawLoading = false; }
  else searching[tab] = { sentAt: 0, sawLoading: false };
  mark(tab, true, configOf(tab));
  const count = sectionOf(tab)?.querySelector<HTMLElement>(':scope > .pltool .plcnt');
  if (count) { count.dataset.h = ''; count.textContent = searchingText(); }
}

/**
 * The search was sent: the state ends when the list, after loading, shows new content (or its error). A screen that does not load
 * (a table filtered in place) or that never starts ends after a short wait. The timer only watches what changes without painting.
 */
export function searchSent(tab: string, sync: (tab: string) => void): void {
  const state = searching[tab]; if (!state) return;
  state.sentAt = performance.now();
  state.timer = setInterval(() => { if (isOver(tab, state)) finish(tab, sync); }, CHECK_MS);
}
