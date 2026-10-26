/**
 * Pages of a list: the page bar («1–20 de 57», ‹ 1 2 3 ›, «Mostrar 20/50/100»), the automatic paging of any list or table with
 * more than 20 rows. Migrated from the legacy pagHTML and paginarListas (v2.416.0); paginarRejilla had no callers and is gone. The page size stays in the legacy tamPagina/fijarTam (the tests replace tamPagina to page by 5).
 */
import { listsLegacy } from '../../legacy/lists-bridge';
import { t } from '../../i18n';
import { formatNumber } from '../../services/format';
import { range } from '../../services/values';

/** Lists that are never paged automatically (they have their own pages or are pickers and menus). */
const EXCLUDED = '.carsel, .picker, #lista, #slista, #kpis, .gsug, .umenu, .dl-menu, #tools, .opciones, .chips, .pag, #c-agenda, #c-acciones, #c-urgentes, #c-ultimas, #c-recom, #c-pend';

/** «1 2 … 7 8 9 … 20»: the first, the last and the neighbours of the current page. */
function pageNumbers(pages: number, page: number): (number | '…')[] {
  const numbers: (number | '…')[] = [];
  for (const index of range(pages)) {
    if (index === 0 || index === pages - 1 || Math.abs(index - page) <= 1) numbers.push(index);
    else if (numbers[numbers.length - 1] !== '…') numbers.push('…');
  }
  return numbers;
}

/** The page bar of `total` rows on page `page` (from 0) with `size` rows per page. */
export function pageHtml(total: number, page: number, size: number): string {
  const pages = Math.max(1, Math.ceil(total / size));
  const from = total ? page * size + 1 : 0, to = Math.min(total, (page + 1) * size);
  const buttons = pageNumbers(pages, page).map(item => (item === '…' ? '<span class="sm">…</span>'
    : `<button data-pg="${item}" aria-current="${String(item === page)}">${item + 1}</button>`)).join('');
  return `<div class="pag">
    <span>${t('listComponents.pagination.range', { from: formatNumber(from), to: formatNumber(to), total: formatNumber(total) })}</span>
    <span class="pbtns">
      <button data-pg="${page - 1}" ${page <= 0 ? 'disabled' : ''} aria-label="${t('listComponents.pagination.previous')}">‹</button>
      ${buttons}
      <button data-pg="${page + 1}" ${page >= pages - 1 ? 'disabled' : ''} aria-label="${t('listComponents.pagination.next')}">›</button>
    </span>
    <span class="ptam">${t('listComponents.pagination.show')} <select class="chico" data-pgtam aria-label="${t('listComponents.pagination.pageSize')}">${listsLegacy.pageSizes().map(option =>
      `<option value="${option}" ${option === size ? 'selected' : ''}>${option}</option>`).join('')}</select></span></div>`;
}

/** What the automatic paging remembers of each list (by its element). */
interface ListPaging { page: number | null; rows: number; first: Element | null; shown: string | null; bar: HTMLElement | null }

const paging = new WeakMap<Element, ListPaging>();
/** The list of each automatic page bar, to remove the bar when its list is gone. */
const barList = new WeakMap<Element, Element>();
/** Lists with an id keep their page when they are painted again. */
const rememberedPage = new Map<string, number>();

function stateOf(list: Element): ListPaging {
  let state = paging.get(list);
  if (!state) { state = { page: null, rows: 0, first: null, shown: null, bar: null }; paging.set(list, state); }
  return state;
}

/** Rows of every list on screen (and in open windows), grouped by their list. */
function listsOnScreen(): Map<Element, HTMLElement[]> {
  const groups = new Map<Element, HTMLElement[]>();
  document.querySelectorAll<HTMLElement>('main .item, main .trow, dialog[open] .item, dialog[open] .trow').forEach(row => {
    const list = row.parentElement;
    if (!list || row.hasAttribute('data-fijo') || list.closest(EXCLUDED)) return;
    const rows = groups.get(list) ?? [];
    rows.push(row); groups.set(list, rows);
  });
  return groups;
}

function choosePage(list: Element, state: ListPaging, rows: readonly HTMLElement[]): void {
  const remembered = list.id ? rememberedPage.get(list.id) : undefined;
  if (remembered !== undefined && state.page === null) state.page = remembered;
  else if ((state.rows !== rows.length || state.first !== rows[0]) && remembered === undefined) state.page = 0;
  state.rows = rows.length; state.first = rows[0] ?? null;
}

function barOf(list: Element, state: ListPaging): HTMLElement {
  if (state.bar?.isConnected) return state.bar;
  const bar = document.createElement('div');
  bar.setAttribute('data-auto', ''); bar.className = 'pag';
  barList.set(bar, list);
  list.insertAdjacentElement('afterend', bar);
  state.bar = bar;
  return bar;
}

function forgetShown(): void {
  document.querySelectorAll('.pag[data-auto]').forEach(bar => { const list = barList.get(bar); if (list) stateOf(list).shown = null; });
}

function bindBar(list: Element, state: ListPaging, bar: HTMLElement): void {
  bar.querySelectorAll<HTMLElement>('[data-pg]').forEach(button => {
    button.onclick = (): void => {
      state.page = Number(button.dataset.pg); state.shown = null; paginateLists();
      if (list.getBoundingClientRect().top < 0) list.scrollIntoView({ block: 'start', behavior: 'smooth' });
    };
  });
  const select = bar.querySelector<HTMLSelectElement>('[data-pgtam]');
  if (select) select.onchange = (): void => { listsLegacy.setPageSize(Number(select.value)); forgetShown(); paginateLists(); };
}

function paginateList(list: Element, rows: readonly HTMLElement[]): void {
  const state = stateOf(list), size = listsLegacy.pageSize();
  if (rows.length <= (listsLegacy.pageSizes()[0] ?? 0)) {
    if (state.bar) { state.bar.remove(); state.bar = null; rows.forEach(row => { row.style.display = ''; }); }
    return;
  }
  choosePage(list, state, rows);
  const pages = Math.ceil(rows.length / size);
  const page = Math.min(state.page ?? 0, pages - 1); state.page = page;
  if (list.id) rememberedPage.set(list.id, page);
  const shown = [rows.length, page, size].join('|');
  if (state.bar?.isConnected && state.shown === shown) return;   // nothing to change
  state.shown = shown;
  rows.forEach((row, index) => { row.style.display = Math.floor(index / size) === page ? '' : 'none'; });
  const bar = barOf(list, state), holder = document.createElement('div');
  holder.innerHTML = pageHtml(rows.length, page, size);
  bar.innerHTML = holder.firstElementChild?.innerHTML ?? '';
  bindBar(list, state, bar);
}

/** Pages every list or table on screen with more rows than the smallest page (called after each repaint). */
export function paginateLists(): void {
  document.querySelectorAll('.pag[data-auto]').forEach(bar => { const list = barList.get(bar); if (!list?.isConnected) bar.remove(); });
  listsOnScreen().forEach((rows, list) => { paginateList(list, rows); });
}
