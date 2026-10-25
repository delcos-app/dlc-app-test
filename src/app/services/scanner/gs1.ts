/**
 * GS1 codes (the ones on boxes and the UDI): (01) GTIN, (10) batch, (11) manufacturing date, (17) expiry, (21) serial number…, with
 * brackets or with the GS separator. Migrated from the legacy leerGS1, gs1Fecha and valorEscaneado of servicios/camara.js
 * (v2.427.0); leerGS1 stays as an adapter (the camera test reads codes with it).
 */
const FIXED_LENGTH: Readonly<Record<string, number>> = { '00': 18, '01': 14, '02': 14, '11': 6, '12': 6, '13': 6, '15': 6, '16': 6, '17': 6, '20': 2 };
const VARIABLE = new Set(['10', '21', '22', '30', '37', '90', '91', '92', '93', '94', '95', '96', '97', '98', '99']);
const GROUP_SEPARATOR = '\u001d', FIRST_YEAR = 2000;

export interface Gs1 { gtin: string; lote: string; serie: string; cad: string; fab: string }

/** «271231» → «2027-12-31»; day 00 is the last day of the month. */
export function gs1Date(text: string | undefined): string {
  if (!/^\d{6}$/.test(text ?? '')) return '';
  const value = text ?? '', year = FIRST_YEAR + Number(value.slice(0, 2)), month = Number(value.slice(2, 4));
  let day = Number(value.slice(4, 6));
  if (month < 1 || month > 12) return '';
  if (!day) day = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function bracketed(text: string): Record<string, string> {
  const fields: Record<string, string> = {}, pattern = /\((\d{2,4})\)([^(]*)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) fields[match[1] ?? ''] = (match[2] ?? '').trim();
  return fields;
}

/** Without brackets, the fixed-length fields follow each other and the variable ones end with GS. */
function separated(text: string): Record<string, string> | null {
  // eslint-disable-next-line no-control-regex -- the GS separator a scanner may put first is removed on purpose
  const value = text.replace(/^è|^\u001d/, '');
  if (!/^(01|02|00)\d/.test(value)) return null;
  const fields: Record<string, string> = {};
  let index = 0;
  while (index < value.length) {
    const id = value.slice(index, index + 2), length = FIXED_LENGTH[id]; index += 2;
    if (length) { fields[id] = value.slice(index, index + length); index += length; if (value[index] === GROUP_SEPARATOR) index++; continue; }
    if (!VARIABLE.has(id)) break;   // an unknown identifier: the rest cannot be split safely
    const end = value.indexOf(GROUP_SEPARATOR, index);
    fields[id] = value.slice(index, end < 0 ? value.length : end); index = end < 0 ? value.length : end + 1;
  }
  return fields;
}

/** The GS1 fields of a code, or null if it is not GS1. */
export function readGs1(raw: unknown): Gs1 | null {
  const text = String(raw ?? '').trim().replace(/^\](d2|C1|Q3|e0)/, '');
  const fields = /^\(\d{2,4}\)/.test(text) ? bracketed(text) : separated(text);
  if (!fields || (!fields['01'] && !fields['10'] && !fields['21'])) return null;
  return { gtin: fields['01'] ?? '', lote: fields['10'] ?? '', serie: fields['21'] ?? '', cad: gs1Date(fields['17']), fab: gs1Date(fields['11']) };
}

/** What is written in the field: the batch or the serial number if the code has them; else the code as it is. */
export function scannedValue(raw: string, mode: string): { v: string; g: Gs1 | null } {
  const gs1 = readGs1(raw);
  if (gs1 && mode === 'lote' && gs1.lote) return { v: gs1.lote, g: gs1 };
  if (gs1 && mode === 'serie' && gs1.serie) return { v: gs1.serie, g: gs1 };
  // eslint-disable-next-line no-control-regex -- control characters a scanner may add are removed on purpose
  return { v: raw.replace(/[\u0000-\u001f]/g, '').trim(), g: gs1 };
}
