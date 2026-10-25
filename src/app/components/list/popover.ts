/**
 * The pick-one popover of the list bar (quick filters, «⋯»): a menu under its button on a computer, a sheet on a phone, with a
 * search box when it has more than 12 options. Migrated from the legacy plPop and plCerrarPop (v2.416.0).
 */
import { isMobile } from '../../legacy/bridge';
import { listsLegacy } from '../../legacy/lists-bridge';
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';

const SEARCH_FROM = 12, MARGIN = 8, GAP = 6;

/** One option: its text, whether it is the chosen one and what it does. */
export interface PopoverItem { readonly t: string; readonly on?: boolean; readonly fn: () => void }

export function closePopovers(): void {
  document.querySelectorAll('.plpop').forEach(popover => { popover.remove(); });
}

function place(popover: HTMLElement, button: HTMLElement): void {
  if (isMobile()) { popover.classList.add('plhoja'); return; }
  const anchor = button.getBoundingClientRect();
  const left = Math.min(Math.max(MARGIN, anchor.left), innerWidth - popover.offsetWidth - MARGIN);
  Object.assign(popover.style, { left: `${left}px`, top: `${anchor.bottom + GAP + scrollY}px` });
}

function bindSearch(popover: HTMLElement): void {
  const search = popover.querySelector<HTMLInputElement>('.plpopq'); if (!search) return;
  search.oninput = (): void => {
    const wanted = listsLegacy.normalise(search.value);
    popover.querySelectorAll('[data-ppi]').forEach(option => { option.classList.toggle('hide', Boolean(wanted) && !listsLegacy.normalise(option.textContent).includes(wanted)); });
  };
  if (!listsLegacy.touchScreen()) search.focus();
}

/** Opens the popover of `button` with `items` (closing any other). */
export function openPopover(button: HTMLElement, items: readonly PopoverItem[]): void {
  closePopovers();
  const popover = document.createElement('div'); popover.className = 'plpop'; popover.setAttribute('role', 'menu');
  popover.innerHTML = (items.length > SEARCH_FROM ? `<input type="search" class="plpopq" placeholder="${t('listComponents.popover.searchPlaceholder')}" aria-label="${t('listComponents.popover.search')}">` : '')
    + `<div class="plpopl">${items.map((item, index) => `<button type="button" role="menuitemradio" aria-checked="${String(Boolean(item.on))}" class="${item.on ? 'on' : ''}" data-ppi="${index}">${escapeHtml(item.t)}</button>`).join('')}</div>`;
  document.body.appendChild(popover);
  place(popover, button);
  popover.querySelectorAll<HTMLElement>('[data-ppi]').forEach(option => {
    option.onclick = (): void => { closePopovers(); items[Number(option.dataset.ppi)]?.fn(); };
  });
  bindSearch(popover);
}
