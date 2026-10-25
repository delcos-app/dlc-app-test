/**
 * Back to the starting point (v2.300.0): a window opened from another one is stacked, and closing it opens the previous one again; and
 * the frozen copy of a screen while a tab changes. Migrated from the legacy VUELTA, VISTA_TITULO, vistaDlg, vistaIgual, vistaBoton and
 * congelar (v2.426.0); VUELTA and VISTA_TITULO stay as the same objects, the functions as adapters.
 */
import { t, type MessageKey } from '../../i18n';
import { escapeHtml } from '../../services/format';
import { steady } from './reveal';

interface View { fn: string; args: unknown[]; dlg?: HTMLDialogElement | null }

const FREEZE_WAIT_MS = 3000, MIN_HEIGHT = 40, BAR_GAP = 4;

/** The windows stacked under the open one (emptied when the screen changes). */
export const BACK_STACK: View[] = [];

const TITLES: readonly (readonly [string, MessageKey])[] = [
  ['verCita', 'navigationCore.viewTitles.appointment'], ['fichaCentro', 'navigationCore.viewTitles.centre'], ['abrirFicha', 'navigationCore.viewTitles.card'],
  ['verPedido', 'navigationCore.viewTitles.order'], ['verFactura', 'navigationCore.viewTitles.invoice'], ['verEvento', 'navigationCore.viewTitles.event'],
  ['verCirugia', 'navigationCore.viewTitles.surgery'], ['verConcurso', 'navigationCore.viewTitles.tender'], ['verEquipo', 'navigationCore.viewTitles.equipment'],
  ['verDeposito', 'navigationCore.viewTitles.deposit'], ['fichaStock', 'navigationCore.viewTitles.product'],
];

/** What each window is called in «‹ Volver» («Volver a la cita»…), by the name of the function that opens it. */
export const VIEW_TITLES: Record<string, string> = Object.fromEntries(TITLES.map(([name, key]) => [name, t(key)]));

/** The open window that can be stacked (the card or the main dialog). */
export const openView = (): HTMLDialogElement | null =>
  ['ficha', 'dlg'].map(id => document.getElementById(id) as HTMLDialogElement | null).find(dialog => dialog?.open) ?? null;

const idOf = (arg: unknown): unknown => { const id = arg && typeof arg === 'object' ? (arg as { id?: unknown }).id : undefined; return id ? id : arg; };
const idsOf = (view: View): string => JSON.stringify(view.args.map(idOf));

/** Same function with the same arguments (objects compared by their id). */
export const sameView = (first: View | null | undefined, second: View | null | undefined): boolean =>
  Boolean(first && second && first.fn === second.fn && idsOf(first) === idsOf(second));

const titleOf = (view: View | undefined): string => (view ? VIEW_TITLES[view.fn] : undefined) ?? t('navigationCore.viewTitles.previousWindow');

/** «‹ Volver» at the start of the window's header, when there is a window below. */
export function backButton(view: View | null | undefined, dialog?: HTMLDialogElement | null): void {
  const box = dialog ?? view?.dlg; if (!box?.open || !BACK_STACK.length || box.querySelector('.vueltabtn')) return;
  const header = box.querySelector('.fh'); if (!header) return;
  const previous = BACK_STACK[BACK_STACK.length - 1], first = header.firstElementChild;
  const place = first && first.tagName !== 'BUTTON' && !first.matches('h2') ? first : header;
  const what = titleOf(previous);
  place.insertAdjacentHTML('afterbegin', `<button type="button" class="btn sec chico vueltabtn" title="${escapeHtml(t('navigationCore.viewTitles.backTo', { what }))}">${t('navigationCore.viewTitles.back')}</button>`);
}

/** The pressed tab is marked active at once in the copy. */
function markPressed(copy: HTMLElement, pressed: Element): void {
  const attributes = [...pressed.attributes].filter(attribute => attribute.name.startsWith('data-') && attribute.name !== 'data-expl');
  const selector = attributes.length ? attributes.map(attribute => `[${attribute.name}="${CSS.escape(attribute.value)}"]`).join('') : null;
  const button = selector ? copy.querySelector(selector) : null;
  if (!button?.parentElement) return;
  [...button.parentElement.children].forEach(other => {
    other.setAttribute('aria-pressed', String(other === button)); other.classList.toggle('on', other === button);
    if (other !== button && other.classList.contains('btn') && !other.classList.contains('sec')) other.classList.add('sec');
  });
  button.classList.remove('sec');
}

function frozenCopy(section: HTMLElement, rect: DOMRect): HTMLElement {
  // The copy keeps its ids (so it looks exactly the same); at the end of the page, the platform still finds the real elements first
  const copy = section.cloneNode(true) as HTMLElement;
  copy.classList.add('congelada', 'atenuada'); copy.classList.remove('cargando', 'cargando-pend', 'preparando');
  Object.assign(copy.style, { position: 'absolute', left: `${rect.left + scrollX}px`, top: `${rect.top + scrollY}px`, width: `${rect.width}px`, margin: 0, zIndex: 45, background: 'var(--bg, #F3F8FC)' });
  return copy;
}

/** Changing tab: the previous view stays fixed until the data arrives and the screen stops changing. */
export function freeze(section: HTMLElement | null): void {
  if (!section || section.classList.contains('hide') || document.querySelector('.congelada')) return;
  const rect = section.getBoundingClientRect(); if (rect.height < MIN_HEIGHT) return;
  const since = Date.now() - 2, copy = frozenCopy(section, rect), pressed = CLIC_PESTANA;
  const inside = pressed && section.contains(pressed) ? pressed : null;
  if (inside) markPressed(copy, inside);
  copy.insertAdjacentHTML('afterbegin', '<div class="barraprog"><i></i></div>');
  // It goes just under the row of buttons that was pressed (tabs, agenda modes…)
  if (inside) {
    const row = inside.closest('.subnav, .cfgsubs, .acts, .segs') ?? inside.parentElement, bar = copy.querySelector<HTMLElement>('.barraprog');
    if (row && bar) bar.style.top = `${Math.round(row.getBoundingClientRect().bottom - rect.top + BAR_GAP)}px`;
  }
  document.body.appendChild(copy); section.style.minHeight = `${rect.height}px`;
  setTimeout(() => { void steady(section, FREEZE_WAIT_MS, since).then(() => { copy.remove(); requestAnimationFrame(() => { section.style.minHeight = ''; }); }); }, 0);
}
