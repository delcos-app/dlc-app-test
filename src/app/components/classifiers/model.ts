/**
 * Custom fields (clasificadores) of Cuentas, Clientes, Pedidos and Productos: how a value is written, whether a value passes a
 * filter (the same rules as campos_cumplen() in the database), the text of an active filter and the cells of the table.
 * Migrated from componentes/clasificadores.js (v2.416.0); clasNorm, clasCumple, campoTexto, clasChips, clasCabeceras and clasCeldas
 * stay as adapters.
 */
import { componentsLegacy } from '../../legacy/components-bridge';
import { t } from '../../i18n';
import { formatShortDate } from '../../services/date-format';
import { escapeHtml } from '../../services/format';

export interface FieldDefinition { clave: string; nombre: string; tipo?: string | null; valores?: string[] | null; en_tabla?: boolean | null; en_filtro?: boolean | null }
export interface RangeFilter { desde?: string | number; hasta?: string | number; contiene?: string }
export type FilterValue = string | boolean | number | RangeFilter | null | undefined;
export type FilterState = Record<string, unknown>;

/** Lower case without accents, to compare texts. */
export const normalise = (text: unknown): string => String(text ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** A value as it is written: Sí / No, a short date, a number with a decimal comma. */
export function fieldText(field: FieldDefinition | null | undefined, value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  if (field?.tipo === 'si_no') return t(value === true || value === 'true' ? 'components.classifiers.yes' : 'components.classifiers.no');
  if (field?.tipo === 'fecha') return formatShortDate(String(value));
  if (field?.tipo === 'numero') return String(value).replace('.', ',');
  return String(value as string);
}

/** Whether `value` is on the right side of `limit` (numbers as numbers, the rest as text). */
function passesLimit(value: unknown, operator: 'desde' | 'hasta', limit: string | number | undefined): boolean {
  if (value === null || value === undefined || value === '') return false;
  if (typeof limit === 'number') {
    const number = Number(value);
    return !isNaN(number) && (operator === 'desde' ? number >= limit : number <= limit);
  }
  if (limit === undefined) return true;
  const text = String(value as string);
  return operator === 'desde' ? text >= limit : text <= limit;
}

function passesRange(value: unknown, filter: RangeFilter): boolean {
  if ('contiene' in filter && !normalise(value).includes(normalise(filter.contiene))) return false;
  return (['desde', 'hasta'] as const).every(operator => !(operator in filter) || passesLimit(value, operator, filter[operator]));
}

/** Whether `values` pass every filter in `filters`. */
export function matchesFilters(values: Readonly<Record<string, unknown>> | null | undefined, filters: Readonly<Record<string, unknown>> | null | undefined): boolean {
  const own = values ?? {};
  return Object.entries(filters ?? {}).every(([key, filter]) => (!filter || typeof filter !== 'object' ? own[key] === filter : passesRange(own[key], filter as RangeFilter)));
}

/** The text of an active filter, for its chip. */
export function filterText(field: FieldDefinition, filter: FilterValue): string {
  if (filter && typeof filter === 'object') {
    const text = (value: unknown): string => fieldText(field, value), name = field.nombre;
    if ('contiene' in filter) return t('components.classifiers.contains', { name, text: filter.contiene ?? '' });
    if ('desde' in filter && 'hasta' in filter) return t('components.classifiers.fromTo', { name, from: text(filter.desde), to: text(filter.hasta) });
    return 'desde' in filter ? t('components.classifiers.from', { name, from: text(filter.desde) }) : t('components.classifiers.to', { name, to: text(filter.hasta) });
  }
  return `${field.nombre}: ${fieldText(field, filter)}`;
}

/** The chips of the active filters of `scope`. */
export const filterChips = (scope: string, state: Readonly<Record<string, unknown>> | null | undefined): { k: string; t: string }[] => Object.keys(state ?? {}).map(key => {
  const field = (componentsLegacy.customFields(scope) as FieldDefinition[]).find(item => item.clave === key) ?? { clave: key, nombre: key };
  return { k: key, t: filterText(field, state?.[key] as FilterValue) };
});

export const columnHeaders = (fields: readonly FieldDefinition[]): string => fields.map(field => `<span class="cpcol">${escapeHtml(field.nombre)}</span>`).join('');

export const columnCells = (fields: readonly FieldDefinition[], values: Readonly<Record<string, unknown>> | null | undefined): string => fields.map(field => {
  const text = fieldText(field, values?.[field.clave]);
  return `<span class="sm">${text ? escapeHtml(text) : '<span class="vac">—</span>'}</span>`;
}).join('');
