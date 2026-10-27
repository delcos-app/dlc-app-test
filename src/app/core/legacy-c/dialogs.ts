/**
 * Windows: three sizes and a stack (v2.57.0), content revealed whole (v2.60.0), no focus ring on the X and a line when scrolled
 * (v2.112.0), the window in its page section on wide screens (v2.117.0), never «already open as non-modal» (v2.159.0), and what closing
 * a window refreshes (v2.186.0, v2.195.0–v2.199.0). Folded from legado 058, 059, 071, 072, 075, 078 and 079 (v2.425.0).
 */
import { byId, closestTo, observe } from './dom';
import { settingsStore } from '../../screens/settings/store';
import { agendaStore } from '../../screens/agenda/store';
import { sessionStore } from '../session-store';
import { accountsStore } from '../../screens/accounts/store';
import { navigationStore } from '../navigation/store';
import * as legacyFreeCoreNavigationApi from '../navigation/api';
import * as legacyFreeComponentsEmbeddedWindow from '../../components/embedded-window';
import * as legacyFreeScreensEvents from '../../screens/events';
import * as legacyFreeScreensSurgeries from '../../screens/surgeries';

const REVEAL_MAX_MS = 1500, REVEAL_SINCE_MS = 50, REPAINT_AFTER_CLOSE_MS = 300, SCROLLED_PX = 4, FOCUS_DELAY_MS = 30;
type Opener = (...args: unknown[]) => unknown;

/** v2.57.0: the wide windows (order, purchase, invoice…) and their size class goes when they close. */
export function sizeWindows(): void {
  const globals = window as unknown as Record<string, Opener>;
  VENT_AMPLIA.forEach(name => {
    const original = globals[name]; if (!original) return;
    globals[name] = function (this: unknown, ...args: unknown[]): unknown { byId('dlg')?.classList.add('amplia'); return original.apply(this, args); };
  });
  const dialog = byId<HTMLDialogElement>('dlg');
  observe(dialog, () => { if (!dialog?.open) dialog?.classList.remove('amplia'); }, { attributes: true, attributeFilter: ['open'] });
  observe(dialog, () => { if (!dialog?.open) dialog?.classList.remove('pequena'); }, { attributes: true, attributeFilter: ['open'] });
}

/** v2.57.0: closing a window opened on top of another brings the previous one back. */
export function stackWindows(): void {
  byId('dlg')?.addEventListener('close', () => {
    if (settingsStore.stacking || !PILA_VENT.length) return;
    const previous = PILA_VENT.pop(), dialog = byId<HTMLDialogElement>('dlg'), body = byId('dbody');
    if (!previous || !dialog || !body) return;
    body.replaceChildren(...previous.nodos); dialog.className = previous.clases;
    setTimeout(() => { if (!dialog.open) dialog.showModal(); }, 0);
  });
}

/** v2.60.0: the content of a window appears whole, not block by block. */
export function revealWindows(): void {
  ['dlg', 'ficha', 'dlg2'].forEach(id => {
    const dialog = byId<HTMLDialogElement>(id);
    observe(dialog, () => { if (dialog?.open) { const content = dialog.firstElementChild; if (content) legacyFreeCoreNavigationApi.reveal((content as HTMLElement), REVEAL_MAX_MS, (Date.now() - REVEAL_SINCE_MS)); } },
      { attributes: true, attributeFilter: ['open'] });
  });
}

function withoutFocusOnClose(dialog: HTMLDialogElement): void {
  dialog.classList.remove('desplazada');
  const active = document.activeElement;
  if (active?.classList.contains('x') && dialog.contains(active)) {
    if (!dialog.hasAttribute('tabindex')) dialog.setAttribute('tabindex', '-1');
    dialog.focus({ preventScroll: true });
  }
}

/** v2.112.0: on opening, the focus does not stay on the X; a scrolled long window shows a line under its header. */
export function focusOpenedWindows(): void {
  const prototype = HTMLDialogElement.prototype as unknown as { showModal: (this: HTMLDialogElement) => void };
  const open = prototype.showModal;
  prototype.showModal = function (this: HTMLDialogElement): void { open.apply(this); withoutFocusOnClose(this); };
  // #dlg has its own opening (Configuración panels): it is wrapped too
  const dialog = byId<HTMLDialogElement>('dlg');
  if (dialog) {
    // eslint-disable-next-line @typescript-eslint/unbound-method -- the original is called with its own dialog as `this`
    const own = dialog.showModal; dialog.showModal = function (this: HTMLDialogElement): void { own.apply(this); if (this.open) withoutFocusOnClose(this); }; }
  document.addEventListener('scroll', event => {
    const target = event.target;
    if (target instanceof HTMLDialogElement) target.classList.toggle('desplazada', target.scrollTop > SCROLLED_PX);
  }, true);
}

/** v2.159.0: a window left open as non-modal (embedded in a page) is closed before opening it as a normal window. */
export function neverHalfOpen(): void {
  ['dlg', 'dlg2'].forEach(id => {
    const dialog = byId<HTMLDialogElement>(id); if (!dialog) return;
    // eslint-disable-next-line @typescript-eslint/unbound-method -- the original is called with its own dialog as `this`
    const previous = dialog.showModal;
    dialog.showModal = function (this: HTMLDialogElement): void {
      try { if (this.open && !this.matches(':modal') && !legacyFreeComponentsEmbeddedWindow.embedArea()) this.close(); } catch { /* it opens anyway */ }
      previous.apply(this);
    };
  });
}

/** v2.186.0: the window epoch of the Agenda cache, and the open visit is forgotten when its window closes. */
export function trackDialogEpoch(): void {
  const dialog = byId<HTMLDialogElement>('dlg');
  observe(dialog, () => { if (dialog?.open) agendaStore.dialogEpoch = sessionStore.cacheEpoch; }, { attributes: true, attributeFilter: ['open'] });
}

export function forgetVisitOnClose(): void {
  const dialog = byId<HTMLDialogElement>('dlg');
  dialog?.addEventListener('close', () => { setTimeout(() => { if (!dialog.open) accountsStore.currentVisit = null; }, 0); });
}

/** v2.195.0: Eventos repaints its list after its window closes. */
export function repaintEventsOnClose(): void {
  const dialog = byId<HTMLDialogElement>('dlg');
  dialog?.addEventListener('close', () => {
    if (navigationStore.screen === 'eventos' && (navigationStore.pageTabs.eventos ?? 'lista') === 'lista' && byId('cfgcuerpo')) setTimeout(() => { if (!dialog.open) void legacyFreeScreensEvents.paintEvents(); }, REPAINT_AFTER_CLOSE_MS);
  });
}

/** v2.197.0: Ciclo repaints its tab after the window or the account card closes. */
export function repaintCycleOnClose(): void {
  const repaint = (): void => {
    const tabs = (PAGINAS.ciclo as { tabs: [string, string, () => void][] }).tabs;
    (tabs.find(tab => tab[0] === (navigationStore.pageTabs.ciclo ?? 'ciclo')) ?? tabs[0])?.[2]();
  };
  ['dlg', 'ficha'].forEach(id => {
    const dialog = byId<HTMLDialogElement>(id);
    dialog?.addEventListener('close', () => { if (navigationStore.screen === 'ciclo' && byId('cfgcuerpo')) setTimeout(() => { if (!dialog.open && navigationStore.screen === 'ciclo') repaint(); }, REPAINT_AFTER_CLOSE_MS); });
  });
}

/** v2.199.0: Intervenciones repaints its list after its window closes. */
export function repaintSurgeriesOnClose(): void {
  const dialog = byId<HTMLDialogElement>('dlg');
  dialog?.addEventListener('close', () => { if (navigationStore.screen === 'cirugias' && byId('cfgcuerpo')) setTimeout(() => { if (!dialog.open && navigationStore.screen === 'cirugias') void legacyFreeScreensSurgeries.paintSurgeries(); }, REPAINT_AFTER_CLOSE_MS); });
}

const headerBottom = (): number => Math.max(0, ...['body > header', 'header', '.top', 'nav.main'].map(selector => {
  const element = document.querySelector(selector);
  return element && /fixed|sticky/.test(getComputedStyle(element).position) ? element.getBoundingClientRect().bottom : 0;
}));

function openEmbedded(dialog: EmbeddedDialog, area: HTMLElement): void {
  dialog.classList.add('encajada'); dialog.__area = area; dialog.__casa ??= dialog.parentNode;
  area.parentNode?.insertBefore(dialog, area);
  area.classList.add('con-ventana');
  dialog.show(); legacyFreeComponentsEmbeddedWindow.placeEmbedded();
  // On opening, the browser takes the view to the first field: back to the top of the area to see its header
  // v2.122.0: only scrolled when the window header is above the view
  const toTop = (): void => { const top = dialog.getBoundingClientRect().top; if (top < headerBottom()) scrollTo({ top: Math.max(0, top + scrollY - headerBottom() - 12) }); };
  toTop(); requestAnimationFrame(toTop);
  const field = dialog.querySelector<HTMLElement>('input:not([type=hidden]), select, textarea');
  if (field) setTimeout(() => { field.focus({ preventScroll: true }); toTop(); }, FOCUS_DELAY_MS);
}

type EmbeddedDialog = HTMLDialogElement & { __area?: HTMLElement | null; __casa?: ParentNode | null };

function returnHome(dialog: EmbeddedDialog): void {
  // v2.275.0: if the window was opened again meanwhile, the close notice arrives late and must not undo its place
  if (dialog.open) return;
  legacyFreeComponentsEmbeddedWindow.returnEmbedded(dialog); delete dialog.dataset.fija;
  if (!dialog.classList.contains('encajada')) return;
  dialog.classList.remove('encajada'); dialog.removeAttribute('style');
  const area = dialog.__area; dialog.__area = null;
  // The section shows again when no other embedded window is left on it
  if (area && !document.querySelector('dialog.encajada[open]')) { area.classList.remove('con-ventana'); area.style.minHeight = ''; }
}

function embed(dialog: EmbeddedDialog): void {
  const modal = dialog.showModal.bind(dialog);
  dialog.showModal = function (): void {
    const area = legacyFreeComponentsEmbeddedWindow.embedArea();
    if (!area) { modal(); return; }
    // v2.129.0: the sections painted in the page itself (#dbody as a panel) open no window
    if (dialog.id === 'dlg' && (settingsStore.activePanel as { tipo?: string } | null)?.tipo === 'dbody') return;
    if (dialog.open) return;
    openEmbedded(dialog, area);
  };
  // eslint-disable-next-line @typescript-eslint/unbound-method -- the original is called with its own dialog as `this`
  const close = dialog.close;
  dialog.close = function (this: HTMLDialogElement, ...args: [string?]): void { legacyFreeComponentsEmbeddedWindow.returnEmbedded(dialog); close.apply(this, args); };
  // If a repaint removes the section with the window inside, it comes back (closed) to <body>
  observe(document.body, () => { if (dialog.__casa && !dialog.isConnected) { dialog.__casa.appendChild(dialog); if (dialog.open) dialog.close(); } }, { childList: true, subtree: true });
  dialog.addEventListener('close', () => { returnHome(dialog); });
}

/** v2.117.0: on wide screens a window opens in the place of its page section; Escape and changing section close it. */
export function embedWindows(): void {
  ['dlg', 'dlg2'].forEach(id => { const dialog = byId<EmbeddedDialog>(id); if (dialog) embed(dialog); });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const dialog = ['dlg2', 'dlg'].map(id => byId<HTMLDialogElement>(id)).find(candidate => candidate?.open && candidate.classList.contains('encajada'));
    // v2.124.0: what belongs to the page (the PDF design in its tab) is not closed with Escape
    if (dialog && !dialog.dataset.fija) { event.preventDefault(); dialog.close(); }
  });
  document.addEventListener('click', event => {
    if (closestTo(event.target, '.cfgnav [data-cfg], .cfuidx [data-ck], .pagtabs [data-ptab], #cfgsubs button, nav.main [data-t], #bnav [data-t], [data-u]')) legacyFreeComponentsEmbeddedWindow.closeEmbedded();
  }, true);
  addEventListener('resize', () => {
    ['dlg', 'dlg2'].forEach(id => {
      const dialog = byId<EmbeddedDialog>(id);
      if (dialog?.open && dialog.__area) { if (innerWidth < ENCAJE_MIN) dialog.close(); else legacyFreeComponentsEmbeddedWindow.placeEmbedded(); }
    });
  });
}
