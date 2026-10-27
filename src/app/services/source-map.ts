/**
 * Source maps (v3) without dependencies: since v2.434.0 the page loads min/app.js, so error stacks point at positions in the minified
 * file; with min/app.js.map they are turned back into source files and lines (Panel delcos → Errores, «Ver en el código»).
 * Plan 7.3: the screens loaded on first use run from min/chunks/<screen>.js, each with its own map next to it.
 * Pure functions: no DOM, no network.
 */

const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const DIGIT = new Map([...BASE64].map((char, index) => [char, index]));
const VLQ_SHIFT = 5, VLQ_CONTINUE = 32, VLQ_MASK = 31;

/** Decodes one base64 VLQ segment («AAgBC») into its numbers. Throws on an invalid character. */
export function decodeVlq(segment: string): number[] {
  const values: number[] = [];
  let value = 0, shift = 0;
  for (const char of segment) {
    const digit = DIGIT.get(char);
    if (digit === undefined) throw new Error(`VLQ: invalid character «${char}»`);
    value += (digit & VLQ_MASK) << shift;
    if (digit & VLQ_CONTINUE) { shift += VLQ_SHIFT; continue; }
    // The lowest bit is the sign
    values.push(value & 1 ? -(value >>> 1) : value >>> 1);
    value = 0; shift = 0;
  }
  if (shift !== 0) throw new Error('VLQ: unfinished segment');
  return values;
}

/** One mapped position: generated column → source file, line and column (0-based, as in the map), and the name if any. */
export interface Mapping { column: number; source: number; line: number; sourceColumn: number; name: number | null }

/** The «mappings» string decoded line by line (each line sorted by generated column). */
export function parseMappings(mappings: string): Mapping[][] {
  const lines: Mapping[][] = [];
  let source = 0, line = 0, sourceColumn = 0, name = 0;
  for (const text of mappings.split(';')) {
    const current: Mapping[] = [];
    let column = 0;
    for (const segment of text.split(',')) {
      if (!segment) continue;
      const [delta = 0, sourceDelta, lineDelta, columnDelta, nameDelta] = decodeVlq(segment);
      column += delta;
      // A segment with only the generated column maps to nothing
      if (sourceDelta === undefined || lineDelta === undefined || columnDelta === undefined) continue;
      source += sourceDelta; line += lineDelta; sourceColumn += columnDelta;
      if (nameDelta !== undefined) name += nameDelta;
      current.push({ column, source, line, sourceColumn, name: nameDelta === undefined ? null : name });
    }
    current.sort((first, second) => first.column - second.column);
    lines.push(current);
  }
  return lines;
}

export interface SourceMapData { sources: readonly string[]; names?: readonly string[]; mappings: string; sourceRoot?: string }
export interface OriginalPosition { source: string; line: number; column: number; name: string | null }

/** A decoded map, ready to answer positions. */
export interface SourceMap { sources: readonly string[]; names: readonly string[]; lines: Mapping[][] }

export function readSourceMap(data: SourceMapData): SourceMap {
  const root = data.sourceRoot ? data.sourceRoot.replace(/\/?$/, '/') : '';
  return { sources: data.sources.map(source => root + source), names: data.names ?? [], lines: parseMappings(data.mappings) };
}

/**
 * The source position of a generated one (line and column 1-based, as in a browser stack): the closest mapping at or before the
 * column on that line. null when the line has nothing mapped.
 */
export function originalPosition(map: SourceMap, line: number, column: number): OriginalPosition | null {
  const segments = map.lines[line - 1];
  if (!segments?.length) return null;
  const target = column - 1;
  let low = 0, high = segments.length - 1, found = -1;
  while (low <= high) {
    const middle = (low + high) >> 1, segment = segments[middle];
    if (segment && segment.column <= target) { found = middle; low = middle + 1; } else high = middle - 1;
  }
  const hit = segments[found];
  if (!hit) return null;
  return { source: map.sources[hit.source] ?? '?', line: hit.line + 1, column: hit.sourceColumn + 1, name: hit.name === null ? null : map.names[hit.name] ?? null };
}

/** A frame of a stack that points at the bundle or a chunk: which file, which version (from «?v=») and where. */
export interface StackFrame { file: string; version: string | null; line: number; column: number; text: string }

const FRAME = /(min\/chunks\/[\w-]+\.js|(?:min\/)?app\.js)(?:\?v=([\d.]+))?:(\d+):(\d+)/;

/** The published, minified files that have their map next to them (<file>.map): min/app.js and the chunks in min/chunks. */
export const isMinified = (file: string): boolean => file === 'min/app.js' || /^min\/chunks\/[\w-]+\.js$/.test(file);

/** The frames of a stack that point at app.js, min/app.js or a chunk of min/chunks (libraries and extensions are left out). */
export function stackFrames(stack: string): StackFrame[] {
  return stack.split('\n').map(text => {
    const match = FRAME.exec(text);
    return match ? { file: match[1] ?? '', version: match[2] ?? null, line: Number(match[3]), column: Number(match[4]), text: text.trim() } : null;
  }).filter((frame): frame is StackFrame => frame !== null);
}
