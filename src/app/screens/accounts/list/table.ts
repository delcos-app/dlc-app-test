/**
 * The table of Cuentas: header with the configured columns (sortable ones marked with their direction), one row per account
 * (with its card for mobile) and the chips of the active filters. Migrated from the legacy cabeceraTablaBase / cabeceraTabla /
 * filaTablaBase / filaTabla / pintarChipsBase / pintarChips (v2.405.0). Columns and cells: columns.ts and cells.ts (v2.406.0).
 */
import { accountListLegacy } from '../../../legacy/bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { cell } from './cells';
import { columnTitle, visibleColumns } from './columns';

/** Paints the header and gives the table its full width (the sum of the column widths). */
export function paintHeader(): void {
  const head = document.getElementById('thead'); if (!head) return;
  const columns = visibleColumns(), width = columns.reduce((total, column) => total + column.w, 0);
  head.innerHTML = columns.map(column => `<span class="tcell th" style="width:${column.w}px;min-width:${column.w}px">${escapeHtml(columnTitle(column.k))}<i class="res" data-res="${column.k}"></i></span>`).join('');
  head.style.minWidth = `${width}px`;
  const list = document.getElementById('lista'); if (list) list.style.minWidth = `${width}px`;
  markSort(head, columns);
}

/** Sortable columns: click to sort; the current one shows its direction («nombre» and «reciente» without direction are the default). */
function markSort(head: HTMLElement, columns: readonly ColumnSetting[]): void {
  const [key = '', direction] = String(accountListLegacy.filters().orden || '').split(':');
  [...head.querySelectorAll<HTMLElement>('.th')].forEach((header, index) => {
    const column = columns[index], sortKey = column ? accountListLegacy.sortKey(column.k) : undefined;
    if (!column || !sortKey) return;
    header.dataset.ordk = column.k; header.classList.add('htord'); header.title = t('accounts.list.sortBy');
    const current = sortKey === key && !((key === 'nombre' || key === 'reciente') && !direction);
    header.classList.toggle('ord-asc', current && direction !== 'desc');
    header.classList.toggle('ord-desc', current && direction === 'desc');
  });
}

/** One account: its cells, and the card used on mobile (name, centre and town, state). `onAccessLoaded` repaints the list when the platform access of the accounts arrives (the «Acceso» column). */
export function rowHtml(row: AccountListRow, onAccessLoaded: () => void): string {
  const cells = visibleColumns().map(column => `<span class="tcell" style="width:${column.w}px;min-width:${column.w}px">${cell(row, column.k, onAccessLoaded)}</span>`).join('');
  const place = [row.centro_nombre, row.municipio].filter(Boolean).join(' · ');
  const card = `<span class="plcard"><b>${row.urgente ? `<i class="plurg" aria-label="${t('accounts.list.urgent')}"></i>` : ''}${escapeHtml(row.nombre ?? '')}</b><span class="plc2">${escapeHtml(place)}</span><span class="plc3">${cell(row, 'estado_comercial', onAccessLoaded)}</span></span>`;
  return `<button class="trow" data-id="${row.id}">${cells}${card}</button>`;
}

/** The chips of the active filters (each one removes its filter) and those of the custom fields. */
export function paintChips(): void {
  const box = document.getElementById('chips'); if (!box) return;
  const filters = accountListLegacy.filters();
  const chips: [string, string][] = [
    ...(filters.q ? [['q', t('accounts.list.chipSearch', { text: filters.q })] as [string, string]] : []),
    ...([['prov', filters.prov], ['muni', filters.muni], ['esp', filters.esp], ['est', filters.est]] as [string, string][]).filter(([, value]) => value),
    ...(filters.urg ? [['urg', t('accounts.list.chipUrgent')] as [string, string]] : []),
    ...(filters.mios ? [['mios', t('accounts.list.chipMine')] as [string, string]] : []),
    ...(filters.sin ? [['sin', t('accounts.list.chipNeverVisited')] as [string, string]] : []),
  ];
  box.innerHTML = chips.map(([key, text]) => `<button class="chip" data-x="${key}">${escapeHtml(text)} ✕</button>`).join('')
    + accountListLegacy.fieldChips(filters.campos).map(chip => `<button class="chip" data-xcp="${escapeHtml(chip.k)}">${escapeHtml(chip.t)} ✕</button>`).join('');
}
