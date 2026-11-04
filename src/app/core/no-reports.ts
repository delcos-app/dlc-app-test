/**
 * «No recibe informes» (plan 12.2, PPR-1 with D7 B, v2.466.0): an account that does not receive reports is marked by a yes/no custom
 * field of the accounts with that use (clasificadores.papel_campo = 'sin_informes', one per company), chosen in Configuración →
 * Clasificadores. SQL 193 gave every company of today the field «Sin reporting» with that use and copied the accounts marked in the
 * old column into it. The pill, the filters of Cuentas and Analítica and the visit (VIS-2) read it from here. Without SQL 193 the
 * classifiers have no «papel_campo» and everything keeps reading the old column cuentas.sin_reporting.
 */
import { legacyDb } from '../legacy/bridge';
import { t } from '../i18n';

export const NO_REPORTS_ROLE = 'sin_informes';
const ACCOUNTS_SCOPE = 'medico', YES_NO = 'si_no', STORED_KEY = 'dlc-sinf';

interface RoleField { clave: string; nombre: string }
interface ClassifierRow { clave: string; nombre: string; papel?: string | null; tipo_campo?: string | null; papel_campo?: string | null }
/** known: the database has field uses (SQL 193); field: the company's field with the use, if it has one. */
interface NoReportsState { known: boolean; field: RoleField | null }

function stored(): NoReportsState {
  try {
    const value = JSON.parse(localStorage.getItem(STORED_KEY) ?? 'null') as NoReportsState | null;
    return value && typeof value.known === 'boolean' ? value : { known: false, field: null };
  } catch { return { known: false, field: null }; }
}

let state: NoReportsState = stored();

/** An account as the screens have it: its custom field values, the old column and, from buscar_cuentas, what the database says. */
export interface AccountMarks { sin_reporting?: boolean | null; sin_informes?: boolean | null; clasificadores?: Record<string, unknown> | null }

const isYes = (value: unknown): boolean => value === true || value === 'true';

/** Whether the account does not receive reports: its field with the use says «Sí» (the old column without SQL 193). */
export function hasNoReports(account: AccountMarks | null | undefined): boolean {
  if (!account) return false;
  if (typeof account.sin_informes === 'boolean') return account.sin_informes;
  if (!state.known) return Boolean(account.sin_reporting);
  return Boolean(state.field && isYes(account.clasificadores?.[state.field.clave]));
}

/** The name of the field (DLC: «Sin reporting»), for the pill; null without SQL 193 (each screen keeps its text of today). */
export const noReportsName = (): string | null => (state.known ? state.field?.nombre ?? null : null);

/** Without SQL 193 the account editor keeps its old checkbox; with it, the field is one more of the custom fields block. */
export const usesOldColumn = (): boolean => !state.known;

export interface FilterTexts { label: string; withReports: string; withoutReports: string }

/** The texts of the filter «con / sin» informes: today's without SQL 193, the field's name with «No» / «Sí»; null = no filter. */
export function noReportsFilter(today: FilterTexts): FilterTexts | null {
  if (!state.known) return today;
  if (!state.field) return null;
  return { label: state.field.nombre, withReports: t('leftovers.fields.no'), withoutReports: t('leftovers.fields.yes') };
}

/** The value of the filter to send ('con' / 'sin'): none when the company has no such field (a filter kept from before would hide all). */
export const reportsFilterValue = (value: string | null | undefined): string | null => (!value || (state.known && !state.field) ? null : value);

/** The filter of the Cuentas bar is in the page from the start (#frep): its label and options follow the field, or it goes. */
export function paintAccountsFilter(): void {
  const select = document.getElementById('frep') as HTMLSelectElement | null;
  if (!select || !state.known) return;
  const box = select.closest('div'), texts = noReportsFilter({ label: '', withReports: '', withoutReports: '' });
  box?.classList.toggle('hide', !texts);
  if (!texts) return;
  const label = document.querySelector('label[for="frep"]'); if (label) label.textContent = texts.label;
  const withReports = select.querySelector('option[value="con"]'), withoutReports = select.querySelector('option[value="sin"]');
  if (withReports) withReports.textContent = texts.withReports;
  if (withoutReports) withoutReports.textContent = texts.withoutReports;
}

/** Reads the company's field with the use (with the catalogs at start-up and after changing a field); offline, the last one known. */
export async function loadNoReportsField(): Promise<void> {
  const { data, error } = await legacyDb().from<ClassifierRow[]>('clasificadores').select('*').eq('ambito', ACCOUNTS_SCOPE).eq('activo', true);
  if (error || !data?.length) { paintAccountsFilter(); return; }
  const field = data.find(row => row.papel_campo === NO_REPORTS_ROLE && row.tipo_campo === YES_NO && !row.papel);
  state = { known: data.some(row => 'papel_campo' in row), field: field ? { clave: field.clave, nombre: field.nombre } : null };
  try { localStorage.setItem(STORED_KEY, JSON.stringify(state)); } catch { /* without the device copy */ }
  paintAccountsFilter();
}
