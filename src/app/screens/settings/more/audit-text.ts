/**
 * The audit log in words: a value («sí», «Ana, Luis…», «—») and the summary of a change («teléfono: 600… → 611…»). Before, complex
 * values showed «[object Object]». Migrated from the legacy textoValor and resumenDetalle (v2.415.0).
 */
import { t } from '../../../i18n';

const SHOWN = 3, SHOWN_CHANGES = 4, SHORT = 24, LONG = 30, PLAIN = 120;

const more = (count: number): string => (count > SHOWN ? '…' : '');

/** A stored value as text. */
export function valueText(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return t(value ? 'settingsMore.audit.yes' : 'settingsMore.audit.no');
  if (Array.isArray(value)) return value.length ? value.slice(0, SHOWN).map(valueText).join(', ') + more(value.length) : '—';
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (record.nombre) return String(record.nombre);
    const keys = Object.keys(record);
    return keys.length ? keys.slice(0, SHOWN).map(key => `${key}: ${valueText(record[key])}`).join(', ') + more(keys.length) : '—';
  }
  return String(value as string | number);
}

/** One line with what a change of the audit log did. */
export function detailSummary(detail: unknown): string {
  if (!detail) return '';
  if (typeof detail !== 'object') return String(detail as string | number).slice(0, PLAIN);
  const record = detail as Record<string, unknown>;
  if (record.nombre && typeof record.nombre !== 'object') return String(record.nombre as string | number);
  const changes = Object.keys(record).filter(key => Array.isArray(record[key]) && (record[key] as unknown[]).length === 2).slice(0, SHOWN_CHANGES);
  if (changes.length) {
    return changes.map(key => { const [before, after] = record[key] as [unknown, unknown]; return `${key}: ${valueText(before).slice(0, SHORT)} → ${valueText(after).slice(0, SHORT)}`; }).join(' · ');
  }
  return Object.keys(record).slice(0, SHOWN_CHANGES).map(key => `${key}: ${valueText(record[key]).slice(0, LONG)}`).join(' · ');
}
