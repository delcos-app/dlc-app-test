/**
 * Skeleton of a list table while it loads: the same columns and row heights as the loaded table (Cuentas uses its visible column
 * widths), with the phone card placeholder in each row. Migrated from the legacy plEsqueleto (v2.416.0).
 */
import { range } from '../../services/values';
import { columnSettings } from '../../screens/accounts/list/columns';

const DEFAULT_WIDTHS = [200, 90, 110, 110, 170, 130, 130, 110, 70, 60, 100];
const BAR_WIDTHS = [70, 55, 80, 60, 45, 65, 50];
const ROWS = 8, HEADER_BAR = 46;

const cell = (width: number, barWidth: number): string =>
  `<span class="plskc" style="width:${width}px;min-width:${width}px"><i class="plsk" style="width:${barWidth}%"></i></span>`;

function rowHtml(widths: readonly number[], row: number): string {
  return `<div class="plskr">${widths.map((width, index) => cell(width, BAR_WIDTHS[(index + row) % BAR_WIDTHS.length] ?? 0)).join('')}<span class="plcard"><i class="plsk" style="width:62%"></i><i class="plsk" style="width:44%"></i></span></div>`;
}

/** The skeleton of the table of screen `screen`, with its header row if `withHeader`. */
export function tableSkeleton(screen: string, withHeader: boolean): string {
  const widths = screen === 'directorio' ? columnSettings().filter(column => column.on).map(column => column.w) : DEFAULT_WIDTHS;
  const header = withHeader ? `<div class="plskh">${widths.map(width => cell(width, HEADER_BAR)).join('')}</div>` : '';
  return `<div class="plsktab">${header}${range(ROWS).map(row => rowHtml(widths, row)).join('')}</div>`;
}
