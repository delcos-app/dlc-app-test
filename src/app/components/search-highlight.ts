/**
 * The search boxes: what matches is highlighted in the results (word by word, without accents, from the start of each word or
 * inside it from three letters). Migrated from componentes/buscador.js (v2.416.0); resaltarBusqueda and esBuscador stay as adapters.
 */
import { escapeHtml } from '../services/format';
import { normalise } from './classifiers/model';

const MIN_INSIDE = 3;

function matchIn(word: string, tokens: readonly string[]): [number, number] | null {
  let start = -1, length = 0;
  for (const token of tokens) {
    if (word.startsWith(token)) return [0, token.length];
    if (start < 0 && token.length >= MIN_INSIDE && word.indexOf(token) > 0) { start = word.indexOf(token); length = token.length; }
  }
  return start < 0 ? null : [start, length];
}

/** `text` safe for HTML with the parts that match `query` inside <mark>. */
export function highlightSearch(text: unknown, query: string): string {
  const value = String(text ?? '');
  // The longest first: if «pe» and «pedro» match, «pedro» is marked
  const tokens = [...new Set(normalise(query).split(/[^\p{L}\p{N}]+/u).filter(Boolean))].sort((first, second) => second.length - first.length);
  if (!tokens.length) return escapeHtml(value);
  let html = '', last = 0;
  for (const found of value.matchAll(/[\p{L}\p{N}]+/gu)) {
    const word = normalise(found[0]);
    if (word.length !== found[0].length) continue;   // removing accents changed its length: not marked (it would shift)
    const match = matchIn(word, tokens);
    if (!match) continue;
    const start = found.index + match[0];
    html += `${escapeHtml(value.slice(last, start))}<mark>${escapeHtml(value.slice(start, start + match[1]))}</mark>`;
    last = start + match[1];
  }
  return html + escapeHtml(value.slice(last));
}

/** Only search boxes: the search inputs and the fields with their result list right under them. */
export function isSearchBox(element: Element | null): boolean {
  if (!(element instanceof HTMLInputElement) || element.list) return false;
  return element.type === 'search' || Boolean(element.nextElementSibling?.matches('.gsug, .cpres, .lista, [role=listbox]'));
}
