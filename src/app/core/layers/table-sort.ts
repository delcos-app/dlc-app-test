/**
 * Sorting tables by pressing a column (v2.224.0: asc → desc → no order, remembered per table), Profesionales' own header (its order
 * goes in F.orden) and the lists sorted by the database (v2.262.0: Facturas and Llamadas start again from the first page). Moved from
 * legado 082 and 107 (v2.424.0); the sort state (HT_ORDEN, ORD_SRV) stays in legacy, the tests and other code read it.
 */
import { sortLegacy } from '../../legacy/legado-d-bridge';

const ORDER_KEY = 'delcos-orden';

const headerCell = (target: EventTarget | null): Element | null => {
  const element = target as Element, cell = element.closest('.dgrid > .dh > *');
  return cell && !element.closest('input, button, select, .res') ? cell : null;
};

/** Lists sorted by the database: their first page again, with the new order. */
function reloadServerSorted(kind: string, grid: Element): void {
  if (kind === 'peds2') { sortLegacy.setOrdersPage(0); sortLegacy.listOrders(); }
  if (kind === 'pacs') { sortLegacy.setCustomersPage(0); sortLegacy.listCustomers(); }
  sortLegacy.markHeader(grid);
}

function sortByColumn(cell: Element): void {
  const grid = cell.closest('.dgrid'), row = cell.parentElement; if (!grid || !row) return;
  const kind = sortLegacy.tableKind(grid), index = [...row.children].indexOf(cell), name = (cell.textContent ?? '').trim();
  const server = sortLegacy.serverSort(kind), key = server ? server(index, name) : null;
  if (server ? !key : sortLegacy.notSortable(name)) return;
  const orders = sortLegacy.orders(), current = orders[kind];
  if (current?.i !== index) orders[kind] = { i: index, dir: 1, k: key };
  else if (current.dir === 1) current.dir = -1;
  else Reflect.deleteProperty(orders, kind);
  sortLegacy.saveOrders();
  if (server) { reloadServerSorted(kind, grid); return; }
  if (orders[kind]) sortLegacy.sortRows(grid); else { sortLegacy.unsort(grid); sortLegacy.markHeader(grid); }
}

/** Profesionales: name → asc → desc → back to name. */
function sortAccounts(header: HTMLElement): void {
  const key = sortLegacy.accountsSortKey(header.dataset.ordk ?? ''), filters = sortLegacy.accountFilters();
  const [current, direction] = String(filters.orden).split(':');
  filters.orden = current === key && direction === 'asc' ? `${key}:desc` : current === key && direction === 'desc' ? 'nombre' : `${key}:asc`;
  const select = document.getElementById('forden') as HTMLSelectElement | null;
  if (select && [...select.options].some(option => option.value === filters.orden)) select.value = filters.orden;
  sortLegacy.searchAccounts(); sortLegacy.paintAccountsHeader();
}

/** Legado 082. */
export function installTableSort(): void {
  try { Object.assign(sortLegacy.orders(), JSON.parse(localStorage.getItem(ORDER_KEY) ?? '{}')); } catch { /* nothing remembered */ }
  document.addEventListener('click', event => { const cell = headerCell(event.target); if (cell) sortByColumn(cell); });
  document.addEventListener('click', event => {
    const target = event.target as Element, header = target.closest<HTMLElement>('#thead .th[data-ordk]');
    if (header && !target.closest('.res')) sortAccounts(header);
  });
}

/** Legado 107: the remembered lists sort on the server columns, and a new order reloads from the first page. */
export function installRememberedSortColumns(): void {
  for (const kind of sortLegacy.rememberedKinds()) {
    sortLegacy.setServerSort(kind, (index, name) => (sortLegacy.rememberedHasField(kind, index) && !sortLegacy.notSortable(name) ? `c${index}` : null));
  }
  document.addEventListener('click', event => {
    const cell = headerCell(event.target); if (!cell) return;
    const grid = cell.closest('.dgrid'), kind = grid ? sortLegacy.tableKind(grid) : '';
    if (!sortLegacy.isRemembered(kind)) return;
    if (kind === 'facts' && document.getElementById('fcob')) { sortLegacy.setInvoicesPage(0); document.getElementById('fcob')?.dispatchEvent(new Event('change')); }
    if (kind === 'llam' && document.getElementById('llfres')) { sortLegacy.setCallsPage(0); document.getElementById('llfres')?.dispatchEvent(new Event('change')); }
  });
}
