/** The content of each cell of the Cuentas table. Migrated from the legacy celdaBase / celda (v2.406.0). */
import { accountColumnsLegacy, currentScreen, term } from '../../../legacy/bridge';
import { t } from '../../../i18n';
import { formatShortDate } from '../../../services/date-format';
import { escapeHtml } from '../../../services/format';
import { orFallback } from '../../../services/values';

const WORKDAYS = ['L', 'M', 'X', 'J', 'V'], CUSTOM_PREFIX = 'cp:';

function nameCell(row: AccountListRow): string {
  const urgent = row.urgente ? `<span class="pill p-urg">${t('accounts.list.urgent')}</span> ` : '';
  const noReporting = row.sin_reporting ? `<span class="pill p-sr" title="${t('accounts.columns.noReportingTitle', { visit: term('visita') })}">${t('accounts.columns.noReporting')}</span> ` : '';
  return `<span class="nm">${urgent}${noReporting}${escapeHtml(row.nombre)}</span>`;
}

const daysCell = (row: AccountListRow): string => `<span class="dias">${WORKDAYS.map(day =>
  `<span class="${row.dias?.[day] ? 'on' : ''}" title="${escapeHtml(row.dias?.[day] ?? '')}">${day}</span>`).join('')}</span>`;

function salesRepsCell(row: AccountListRow): string {
  const reps = row.comerciales ?? [];
  return `<span class="comchips">${reps.length ? reps.map(rep => `<span>${escapeHtml(accountColumnsLegacy.firstName(rep.nombre))}</span>`).join('') : `<span class="sin">${t('accounts.columns.unassigned')}</span>`}</span>`;
}

/** Platform access: loaded once for all the accounts; until then the cell is empty and the list repaints when it arrives. */
function accessCell(row: AccountListRow, onAccessLoaded: () => void): string {
  const access = accountColumnsLegacy.accessOf();
  if (!access) { void accountColumnsLegacy.loadAccess().then(() => { if (currentScreen() === 'directorio') onAccessLoaded(); }); return ''; }
  const own = access[row.id];
  if (!own) return `<span class="sm">${t('accounts.columns.noAccess')}</span>`;
  return `<span class="pill ${own.activo ? 'p-est' : 'p-anu'}">${t(own.activo ? 'accounts.columns.withAccess' : 'accounts.columns.accessDisabled')}</span>`;
}

function customCell(row: AccountListRow, key: string): string {
  const field = accountColumnsLegacy.customFields().find(item => item.clave === key);
  return `<span class="sm">${escapeHtml(accountColumnsLegacy.fieldText(field, row.clasificadores?.[key]))}</span>`;
}

/** Cells with their own look, by column (database column names). */
const CELLS = new Map<string, (row: AccountListRow) => string>([
  ['nombre', nameCell],
  ['dias', daysCell],
  ['estado_comercial', row => `<span class="pill p-est">${escapeHtml(row.estado_comercial)}</span>`],
  ['ultima_visita', row => `<span class="sm">${row.ultima_visita ? formatShortDate(row.ultima_visita) : '—'}</span>`],
  ['telefono', row => `<span class="sm">${escapeHtml(orFallback(row.telefono, row.consulta_telefono ?? ''))}</span>`],
  ['comerciales', salesRepsCell],
]);

/** The cell `key` of an account (`onAccessLoaded` repaints the list when the platform access arrives). */
export function cell(row: AccountListRow, key: string, onAccessLoaded: () => void): string {
  if (key === 'acceso') return accessCell(row, onAccessLoaded);
  if (key.startsWith(CUSTOM_PREFIX)) return customCell(row, key.slice(CUSTOM_PREFIX.length));
  const special = CELLS.get(key);
  if (special) return special(row);
  const value = row[key];
  return `<span class="sm">${escapeHtml(value ? String(value as string | number) : '')}</span>`;
}
