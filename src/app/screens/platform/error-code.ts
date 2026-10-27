/**
 * Panel delcos → Errores → «Ver en el código»: the stack of an error, which points at min/app.js, turned back into source files and
 * lines with min/app.js.map. The map (several MB) is only fetched when asked for, once per visit, and only serves the version that is
 * published now: an error of another version says so instead of showing wrong lines (v2.440.0).
 * Plan 7.3: a frame inside a screen loaded on first use points at min/chunks/<screen>.js; it is read with that chunk's own map
 * (min/chunks/<screen>.js.map), fetched the same way.
 */
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';
import { isMinified, originalPosition, readSourceMap, stackFrames, type SourceMap, type SourceMapData, type StackFrame } from '../../services/source-map';

/** One request per map and visit (a failed one can be tried again). */
const mapRequests = new Map<string, Promise<SourceMap>>();

function loadMap(file: string): Promise<SourceMap> {
  const known = mapRequests.get(file);
  if (known) return known;
  const request = fetch(new URL(`${file}.map`, location.href).href, { cache: 'force-cache' })
    .then(async response => {
      if (!response.ok) throw new Error(String(response.status));
      return readSourceMap(await response.json() as SourceMapData);
    });
  request.catch(() => { mapRequests.delete(file); });
  mapRequests.set(file, request);
  return request;
}

const stackOf = (detail: unknown): string => {
  const stack = detail && typeof detail === 'object' ? (detail as { pila?: unknown }).pila : null;
  return typeof stack === 'string' ? stack : '';
};

function frameLine(maps: ReadonlyMap<string, SourceMap>, frame: StackFrame): string {
  const map = maps.get(frame.file);
  const position = map ? originalPosition(map, frame.line, frame.column) : null;
  if (!position) return `${escapeHtml(frame.text)}  ${t('platform.errorCode.unmapped')}`;
  const source = position.source.replace(/^(\.\.\/)+/, '');
  return `${escapeHtml(source)}:${position.line}:${position.column}${position.name ? `  (${escapeHtml(position.name)})` : ''}`;
}

/**
 * The lines of the stack in source terms, as HTML for a <pre>, or the reason why they cannot be shown: no stack, frames of another
 * version, or a map could not be read.
 */
export async function codeOfStack(detail: unknown, currentVersion: string): Promise<string> {
  const frames = stackFrames(stackOf(detail));
  if (!frames.length) return t('platform.errorCode.noStack');
  const other = frames.find(frame => frame.version && frame.version !== currentVersion);
  if (other) return t('platform.errorCode.otherVersion', { version: other.version ?? '', current: currentVersion });
  const files = [...new Set(frames.map(frame => frame.file).filter(isMinified))];
  if (!files.length) return t('platform.errorCode.notMinified');
  try {
    const maps = new Map(await Promise.all(files.map(async file => [file, await loadMap(file)] as const)));
    return frames.map(frame => frameLine(maps, frame)).join('\n');
  } catch (error) {
    return t('platform.errorCode.noMap', { error: escapeHtml(error instanceof Error ? error.message : String(error)) });
  }
}
