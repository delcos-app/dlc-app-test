/**
 * Panel delcos → Errores → «Ver en el código»: the stack of an error, which points at min/app.js, turned back into source files and
 * lines with min/app.js.map. The map (several MB) is only fetched when asked for, once per visit, and only serves the version that is
 * published now: an error of another version says so instead of showing wrong lines (v2.440.0).
 */
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';
import { originalPosition, readSourceMap, stackFrames, type SourceMap, type SourceMapData, type StackFrame } from '../../services/source-map';

const MAP_PATH = 'min/app.js.map', MINIFIED = 'min/app.js';

let mapRequest: Promise<SourceMap> | null = null;

function loadMap(): Promise<SourceMap> {
  mapRequest ??= fetch(new URL(MAP_PATH, location.href).href, { cache: 'force-cache' })
    .then(async response => {
      if (!response.ok) throw new Error(String(response.status));
      return readSourceMap(await response.json() as SourceMapData);
    });
  // A failed download can be tried again
  mapRequest.catch(() => { mapRequest = null; });
  return mapRequest;
}

const stackOf = (detail: unknown): string => {
  const stack = detail && typeof detail === 'object' ? (detail as { pila?: unknown }).pila : null;
  return typeof stack === 'string' ? stack : '';
};

function frameLine(map: SourceMap, frame: StackFrame): string {
  const position = frame.file === MINIFIED ? originalPosition(map, frame.line, frame.column) : null;
  if (!position) return `${escapeHtml(frame.text)}  ${t('platform.errorCode.unmapped')}`;
  const source = position.source.replace(/^(\.\.\/)+/, '');
  return `${escapeHtml(source)}:${position.line}:${position.column}${position.name ? `  (${escapeHtml(position.name)})` : ''}`;
}

/**
 * The lines of the stack in source terms, as HTML for a <pre>, or the reason why they cannot be shown: no stack, frames of another
 * version, or the map could not be read.
 */
export async function codeOfStack(detail: unknown, currentVersion: string): Promise<string> {
  const frames = stackFrames(stackOf(detail));
  if (!frames.length) return t('platform.errorCode.noStack');
  const other = frames.find(frame => frame.version && frame.version !== currentVersion);
  if (other) return t('platform.errorCode.otherVersion', { version: other.version ?? '', current: currentVersion });
  if (!frames.some(frame => frame.file === MINIFIED)) return t('platform.errorCode.notMinified');
  try {
    const map = await loadMap();
    return frames.map(frame => frameLine(map, frame)).join('\n');
  } catch (error) {
    return t('platform.errorCode.noMap', { error: escapeHtml(error instanceof Error ? error.message : String(error)) });
  }
}
