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
const CLOSE_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';

/**
 * Other buttons that open the same popover with their own content (v2.474.0, D-051: the portal of a professional in Pedidos). Each
 * one says its selector, what the popover shows and whether it ends with the «Ver en el manual» link of the help.
 */
interface PopoverSource { readonly selector: string; readonly content: (button: HTMLElement) => string; readonly manualLink: boolean }
const sources: PopoverSource[] = [];

/** Registers a kind of button that opens the «i» popover (same bubble, place and closing) with its own content. */
export function registerPopoverSource(source: PopoverSource): void {
  if (!sources.some(item => item.selector === source.selector)) sources.push(source);
}

const openers = (): string => ['.ai', ...sources.map(source => source.selector)].join(', ');

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
  if (popover && !popover.contains(target) && !target.closest(openers())) popover.remove();
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

function helpContent(button: HTMLElement): string {
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

type Popover = HTMLDivElement & { __de?: Element };

/** v2.474.0 (D-051): the popover closes with its ✕ too (and the focus goes back to the button that opened it). */
function closeWithX(event: Event): boolean {
  const close = (event.target as Element).closest('.aipopx');
  if (!close) return false;
  event.preventDefault(); event.stopPropagation();
  const popover = close.closest<Popover>('.aipop'), opener = popover?.__de;
  popover?.remove();
  if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
  return true;
}

function openPopover(button: HTMLElement): void {
  const source = button.matches('.ai') ? null : sources.find(item => button.matches(item.selector));
  const popover = document.createElement('div') as Popover;
  popover.className = 'aipop'; popover.__de = button;
  if (source && !source.manualLink) popover.dataset.noManual = '';
  popover.innerHTML = `${source ? source.content(button) : helpContent(button)}<button type="button" class="aipopx" aria-label="${escapeHtml(t('legacyA.help.close'))}">${CLOSE_ICON}</button>`;
  // v2.464.0: inside a window that covers the screen (the phone), the explanation goes in it: on <body> it would stay behind
  (button.closest('dialog[open]:not(.encajada)') ?? document.body).appendChild(popover);
  place(popover, button);
}

/** The «i» buttons (and the registered ones) open their explanation; pressing the same one again, its ✕ or outside closes it. */
export function listenToHelpButtons(): void {
  document.addEventListener('click', event => {
    if (closeWithX(event)) return;
    const button = (event.target as Element).closest<HTMLElement>(openers());
    if (!button) return;
    event.preventDefault(); event.stopPropagation();
    const previous = document.querySelector<Popover>('.aipop');
    if (previous) { const same = previous.__de === button; previous.remove(); if (same) return; }
    openPopover(button);
  }, true);
}
