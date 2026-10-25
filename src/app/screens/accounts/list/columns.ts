/**
 * The columns of the Cuentas table: which ones exist (the fixed ones, «Comerciales» for whoever sees everything, «Acceso a la
 * plataforma» and one per custom field), and which ones each person sees, in which order and how wide (saved in this
 * browser). Migrated from the legacy COLS (and its pushes in legado 019, 054 and camposEnDirectorio) / colsConfigBase /
 * colsConfig / colsGuardar (v2.406.0). colsConfig and colsGuardar stay as adapters (the custom-fields panel uses them).
 */
import { accountColumnsLegacy, permissions, term } from '../../../legacy/bridge';
import { t } from '../../../i18n';

export interface ColumnDefinition { readonly k: string; readonly t: string; readonly w: number; readonly fixed?: boolean }

const SALES_REPS = 'comerciales', CUSTOM_PREFIX = 'cp:', CUSTOM_WIDTH = 150;
/** Shown until the person chooses (with «Comerciales» for whoever sees everything). */
const DEFAULT_ON = ['nombre', 'especialidad', 'centro_nombre', 'municipio', 'dias', 'estado_comercial'];

/** Every column that exists, in the default order (titles in the company vocabulary). */
export function columnDefinitions(): ColumnDefinition[] {
  return [
    { k: 'nombre', t: term('medico', { capital: 'C' }), w: 250, fixed: true },
    { k: 'especialidad', t: term('especialidad', { capital: 'C' }), w: 170 },
    { k: 'centro_nombre', t: t('accounts.columns.centre'), w: 200 },
    { k: 'municipio', t: t('accounts.columns.town'), w: 140 },
    { k: 'direccion', t: t('accounts.columns.address'), w: 200 },
    { k: 'telefono', t: t('accounts.columns.phone'), w: 130 },
    { k: 'dias', t: t('accounts.columns.days'), w: 150 },
    { k: 'ultima_visita', t: term('visita', { article: 'ultimo', articleCapital: 'C' }), w: 130 },
    { k: 'estado_comercial', t: t('accounts.columns.state'), w: 150 },
    { k: SALES_REPS, t: t('accounts.columns.salesReps'), w: 190 },
    { k: 'acceso', t: t('accounts.columns.access'), w: 170 },
    ...accountColumnsLegacy.customFields().map(field => ({ k: CUSTOM_PREFIX + field.clave, t: field.nombre, w: CUSTOM_WIDTH })),
  ];
}

export const columnTitle = (key: string): string => columnDefinitions().find(column => column.k === key)?.t ?? key;

function saved(): ColumnSetting[] | null {
  try { return JSON.parse(localStorage.getItem(accountColumnsLegacy.storageKey()) ?? 'null') as ColumnSetting[] | null; } catch { return null; }
}

export function saveColumns(settings: readonly ColumnSetting[]): void {
  try { localStorage.setItem(accountColumnsLegacy.storageKey(), JSON.stringify(settings)); } catch { /* not remembered */ }
}

export function resetColumns(): void {
  try { localStorage.removeItem(accountColumnsLegacy.storageKey()); } catch { /* nothing saved */ }
}

/**
 * The columns of this person: their saved choice plus any column created since (off, except «Comerciales» for whoever sees
 * everything); a custom field never chosen follows its «en tabla» setting. «Comerciales» only for whoever sees everything.
 */
export function columnSettings(): ColumnSetting[] {
  const all = columnDefinitions(), everything = permissions.seesEverything(), chosen = saved();
  const settings = chosen?.length ? [...chosen] : all.map(column => ({ k: column.k, on: DEFAULT_ON.includes(column.k) || (column.k === SALES_REPS && everything), w: column.w }));
  all.forEach(column => { if (!settings.some(setting => setting.k === column.k)) settings.push({ k: column.k, on: column.k === SALES_REPS && everything, w: column.w }); });
  const fields = accountColumnsLegacy.customFields();
  return settings.filter(setting => setting.k !== SALES_REPS || everything).map(setting =>
    (setting.k.startsWith(CUSTOM_PREFIX) && !(chosen ?? []).some(item => item.k === setting.k)
      ? { ...setting, on: Boolean(fields.find(field => CUSTOM_PREFIX + field.clave === setting.k)?.en_tabla) } : setting));
}

/** The columns shown, in order. */
export const visibleColumns = (): ColumnSetting[] => columnSettings().filter(setting => setting.on);
