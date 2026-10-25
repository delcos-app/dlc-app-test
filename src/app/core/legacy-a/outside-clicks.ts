/**
 * Windows and panels that close when pressing outside, the pagination and help buttons of any list, and the «i» popover (legado
 * 017, v2.424.0). Registered by legado 017 at its place in the load order.
 */
import { outsideClicksLegacy } from '../../legacy/legado-a-bridge';
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';
import { orFallback } from '../../services/values';

const OBSERVE_WAIT_MS = 40, POPOVER_GAP = 8, POPOVER_MARGIN = 10;
const TOOL_BUTTONS = '#dirtools, #segtools, #antools, .htbtn';

let pressedOn: EventTarget | null = null, swallowClick = false, observeTimer: ReturnType<typeof setTimeout> | undefined;

const removePopover = (): void => { document.querySelector('.aipop')?.remove(); };

function pointerDown(event: PointerEvent): void {
  pressedOn = event.target;
  const target = event.target as Element, tools = document.getElementById('tools');
  if (tools?.classList.contains('abierto') && !tools.contains(target) && !target.closest('#tools2') && !target.closest(TOOL_BUTTONS) && !document.querySelector('dialog[open]')) {
    tools.classList.remove('abierto');
    swallowClick = true;   // the click that closes the panel does not activate what is under it
  }
  const popover = document.querySelector('.aipop');
  if (popover && !popover.contains(target) && !target.closest('.ai')) popover.remove();
}

/** Registers the outside clicks: it only closes if the click starts and ends outside (so selecting text does not close). */
export function listenToOutsideClicks(): void {
  document.addEventListener('click', event => {
    if (!swallowClick) return;
    swallowClick = false; event.preventDefault(); event.stopPropagation();
  }, true);
  document.addEventListener('pointerdown', pointerDown, true);
  ['ficha', 'dlg', 'dlg2'].forEach(id => {
    const box = document.getElementById(id) as HTMLDialogElement | null; if (!box) return;
    box.addEventListener('click', event => {
      if (event.target !== box || pressedOn !== box) return;
      if (id === 'ficha') box.close(); else outsideClicksLegacy.tryClose(box);
    });
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    document.getElementById('tools')?.classList.remove('abierto');
    removePopover();
  });
}

/** Any change in the page paginates the lists and adds the help buttons (except changes inside a pagination or a popover). */
export function watchListsAndHelp(): void {
  new MutationObserver(mutations => {
    if (mutations.every(mutation => mutation.target.nodeType === 1 && (mutation.target as Element).closest('.pag, .aipop'))) return;
    clearTimeout(observeTimer);
    observeTimer = setTimeout(() => { outsideClicksLegacy.paginate(); outsideClicksLegacy.addHelp(); }, OBSERVE_WAIT_MS);
  }).observe(document.body, { childList: true, subtree: true });
}

function popoverContent(button: HTMLElement): string {
  if (button.dataset.ayuda) {
    const [title, text, items] = outsideClicksLegacy.help(button.dataset.ayuda) ?? [t('legacyA.help.fallbackTitle'), '', []];
    return `<b>${escapeHtml(title)}</b>${escapeHtml(text)}${items.length ? `<ul>${items.map(item => `<li>${item}</li>`).join('')}</ul>` : ''}`;
  }
  return `<b>${escapeHtml(orFallback(button.dataset.ayudaTit, t('legacyA.help.whatIs')))}</b>${escapeHtml(button.dataset.ayudaTxt ?? '')}`;
}

function place(popover: HTMLElement, button: HTMLElement): void {
  const rect = button.getBoundingClientRect(), width = popover.offsetWidth, height = popover.offsetHeight;
  const left = Math.min(window.innerWidth - width - POPOVER_MARGIN, Math.max(POPOVER_MARGIN, rect.left + rect.width / 2 - width / 2));
  let top = rect.bottom + POPOVER_GAP;
  if (top + height > window.innerHeight - POPOVER_MARGIN) top = Math.max(POPOVER_MARGIN, rect.top - height - POPOVER_GAP);
  popover.style.left = `${left}px`; popover.style.top = `${top}px`;
}

/** The «i» buttons open their explanation; pressing the same one again closes it. */
export function listenToHelpButtons(): void {
  document.addEventListener('click', event => {
    const button = (event.target as Element).closest<HTMLElement>('.ai');
    if (!button) return;
    event.preventDefault(); event.stopPropagation();
    const previous = document.querySelector<HTMLElement & { __de?: Element }>('.aipop');
    if (previous) { const same = previous.__de === button; previous.remove(); if (same) return; }
    const popover = document.createElement('div') as HTMLDivElement & { __de?: Element };
    popover.className = 'aipop'; popover.__de = button;
    popover.innerHTML = popoverContent(button);
    document.body.appendChild(popover);
    place(popover, button);
  }, true);
}
