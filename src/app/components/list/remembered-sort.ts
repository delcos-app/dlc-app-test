/**
 * Lists that bring the whole period at once (Facturas, Llamadas) are sorted entirely before paging, by the column the person chose
 * (legacy ORD_MEM says which field each column is). Empty values always go last; equal values keep their order. Migrated from the
 * legacy ordMemValor, ordMemComparar and ordMemOrdenar (v2.416.0).
 */
import { listsLegacy, type RememberedField } from '../../legacy/lists-bridge';

type Row = Record<string, unknown>;

function fieldValue(row: Row, field: RememberedField): unknown {
  const value = typeof field === 'function' ? field(row) : row[field];
  return value === null || value === undefined || value === '' ? null : value;
}

const NUMBER = /^-?\d+(\.\d+)?$/;

/** Numbers as numbers (also numeric texts), the rest as Spanish text with numbers in order. */
function compareValues(first: unknown, second: unknown): number {
  if (typeof first === 'number' || (typeof first === 'string' && NUMBER.test(first) && NUMBER.test(String(second)))) return Number(first) - Number(second);
  return String(first).localeCompare(String(second), 'es', { numeric: true, sensitivity: 'base' });
}

/** `list` sorted by the column chosen for table `kind` (unchanged if there is no order or no such table). */
export function sortRemembered<T>(kind: string, list: T): T {
  const order = listsLegacy.sortState()[kind], settings = listsLegacy.rememberedSort()[kind];
  if (!order || !settings || !Array.isArray(list)) return list;
  const field = settings.campos[order.i]; if (field === undefined) return list;
  const rows = list as Row[];
  return rows.map((row, position) => ({ row, position })).sort((first, second) => {
    const one = fieldValue(first.row, field), other = fieldValue(second.row, field);
    // Empty values always last, whatever the direction
    if (one === null || other === null) return (Number(one === null) - Number(other === null)) || (first.position - second.position);
    return order.dir * compareValues(one, other) || (first.position - second.position);
  }).map(item => item.row) as T;
}
