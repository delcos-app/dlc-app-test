/**
 * Reading a sheet and matching its columns: cell values, the title row, the proposed field of each column, the key of a custom
 * field and the signature that remembers a mapping. Migrated from the legacy valorCelda, detectarTitulos, proponerCampo, impNorm,
 * impClave and impHash (v2.410.0). The signature must stay byte-identical: saved mappings are found by it.
 */
import { FIELDS, type Entity } from './fields';

const MIN_SCORE = 55, EXACT = 100, CONTAINED = 75, SIMILAR = 70, TITLE_ROWS = 15, TITLE_SHARE = 0.8, KEY_LENGTH = 40;

/** «Teléfono móvil» → «telefono movil»: lower case, no accents, words separated by one space. */
export const normaliseHeader = (text: unknown): string =>
  String(text ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

/** «Fecha de alta» → «FECHA_DE_ALTA»: the key of a custom field. */
export const customFieldKey = (text: string): string => normaliseHeader(text).toUpperCase().replace(/ /g, '_').slice(0, KEY_LENGTH) || 'CAMPO';

/** djb2 hash in base 36. */
export function hashText(text: string): string {
  let hash = 5381;
  for (const char of text) hash = ((hash << 5) + hash + char.charCodeAt(0)) | 0;
  return (hash >>> 0).toString(36);
}

const pad = (value: number): string => String(value).padStart(2, '0');

/** A cell as text: dates as YYYY-MM-DD, the rest trimmed. */
export function cellValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? '' : `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  return String(value).trim();
}

/** The title row is the first with many texts (exports often bring header rows before it). */
export function detectHeaderRow(rows: readonly (readonly string[])[]): number {
  const scores = rows.slice(0, TITLE_ROWS).map(row => row.filter(cell => cell.trim() && Number.isNaN(Number(cell.replace(',', '.')))).length);
  const best = Math.max(0, ...scores);
  if (best < 2) return 0;
  return scores.findIndex(score => score >= best * TITLE_SHARE);
}

function pairs(text: string): Set<string> {
  const found = new Set<string>();
  for (let i = 0; i < text.length - 1; i++) found.add(text.slice(i, i + 2));
  return found;
}

/** Dice coefficient of the letter pairs of two texts (0 to 1). */
function similarity(first: string, second: string): number {
  const firstPairs = pairs(first), secondPairs = pairs(second);
  if (!firstPairs.size || !secondPairs.size) return 0;
  let common = 0;
  firstPairs.forEach(pair => { if (secondPairs.has(pair)) common++; });
  return 2 * common / (firstPairs.size + secondPairs.size);
}

function score(header: string, synonym: string): number {
  if (header === synonym) return EXACT;
  if (header.split(' ').includes(synonym) || (synonym.length > 3 && header.includes(synonym))) return CONTAINED;
  return Math.round(similarity(header, synonym) * SIMILAR);
}

/** The field a column header most likely is (exact synonym, contained, or similar), or null; `used` fields are skipped. */
export function proposeField(header: string, entity: Entity, used: ReadonlySet<string>): string | null {
  const normalised = normaliseHeader(header);
  let best: { key: string; points: number } | null = null;
  for (const [key, , synonyms] of FIELDS[entity]) {
    if (used.has(key)) continue;
    const points = Math.max(0, ...[...synonyms, key].map(synonym => score(normalised, normaliseHeader(synonym))));
    if (points >= MIN_SCORE && (!best || points > best.points)) best = { key, points };
  }
  return best ? best.key : null;
}
