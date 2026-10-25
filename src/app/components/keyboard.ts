/**
 * Keyboard on desktop: from a search box, the arrows go through its results (the suggestions under it, or the rows of the list or
 * table it filters) and Enter opens the marked one. Migrated from componentes/teclado.js (v2.416.0); teclaLista, teclaItems and
 * teclaActivar stay as adapters (the listener of legado 071 uses them).
 */
const LISTS = '.gsug, .cpres, .lista, .dgrid, [role=listbox], table';

const visible = (element: HTMLElement): boolean => element.offsetParent !== null && !element.classList.contains('hide');

/** The items of a list or table that can be marked. */
export function listItems(list: Element): HTMLElement[] {
  let items: HTMLElement[];
  if (list.matches('table')) items = [...list.querySelectorAll<HTMLElement>(':scope > tbody > tr')];
  else if (list.matches('.dgrid')) items = [...list.querySelectorAll<HTMLElement>(':scope > .dr')];
  else if (list.matches('.lista')) items = [...list.children] as HTMLElement[];
  else items = [...list.querySelectorAll<HTMLElement>('button, [role=option], a[href]')];
  return items.filter(item => visible(item) && !item.matches('.gsh, .gload, .vacio, [disabled]'));
}

/** The results of a search box: its own suggestions, or the first list with results after it in its window or screen. */
export function resultsOf(input: HTMLElement): Element | null {
  const box = input.closest('.gsearch, .picker, .cpbus');
  if (box) return box.querySelector('.gsug, .cpres');
  const area = input.closest('dialog, section, .card') ?? document.body;
  return [...area.querySelectorAll(LISTS)].find(list => Boolean(input.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING)
    && !list.closest('.hide') && listItems(list).length) ?? null;
}

/** Opens the marked item: the item itself if it is pressable, else its first button or link. */
export function activateItem(item: HTMLElement): void {
  const target = item.matches('button, a[href], [role=option], tr, .dr') ? item : item.querySelector<HTMLElement>('button, a[href], [data-inificha]') ?? item;
  target.click();
}
