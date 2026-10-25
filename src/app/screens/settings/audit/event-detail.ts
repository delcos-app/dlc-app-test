/**
 * The detail of an audit event in one line: «Importe: 30 € · Motivo: …», without ids, at most 160 characters. Migrated from the
 * legacy detalleEvento of pantallas/eventos.js (v2.427.0); the name stays as an adapter (the Configuración bridge calls it). The
 * field names (NOMBRES_DETALLE) stay in legacy data, next to the audit texts of Configuración.
 */
import { leftoversLegacy } from '../../../legacy/leftovers-bridge';
import { isPresent } from '../../../services/values';

const MAX_LENGTH = 160, NONE = '—';
const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f-]{27}$/i;

const fieldName = (key: string): string => leftoversLegacy.detailName(key) ?? key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');

export function eventDetail(detail: unknown): string {
  if (!detail || typeof detail !== 'object') return detail ? String(detail) : NONE;
  const values = detail as Record<string, unknown>;
  const parts = Object.keys(values).filter(key => isPresent(values[key]) && values[key] !== '' && key !== 'valor' && !ID_PATTERN.test(String(values[key]))).map(key => {
    const value = values[key];
    return `${fieldName(key)}: ${typeof value === 'number' && /importe|total/.test(key) ? leftoversLegacy.euros(value) : leftoversLegacy.valueText(value)}`;
  });
  return parts.join(' · ').slice(0, MAX_LENGTH) || NONE;
}
