/**
 * The columns of a table: hidden ones leave the grid keeping the proportions of the rest, saved widths apply, and each header gets
 * its handle to drag the width. Migrated from the legacy htAplicarColumnas and its Base layers (v2.419.0); htAplicarColumnas stays
 * as an adapter (legado 057 calls it after resetting the widths).
 */
import { t } from '../../i18n';
import { hiddenColumns, savedWidths, tableKind } from '../filters/table-sort';

/** Tracks of a grid template, splitting on spaces outside brackets. */
const tracksOf = (template: string): string[] => template.split(/\s+(?![^(]*\))/).filter(Boolean);

export const hiddenOf = (kind: string): number[] => {
  const hidden = hiddenColumns(kind);
  return Array.isArray(hidden) ? hidden.map(Number) : [];
};

/** With more columns than widths defined, the missing ones get a flexible width (the last one used to jump to another line). */
function baseTemplate(grid: HTMLElement): string {
  if (!grid.dataset.colsBase) {
    const base = getComputedStyle(grid).getPropertyValue('--cols').trim();
    const count = grid.querySelector(':scope > .dh')?.children.length ?? 0, tracks = tracksOf(base);
    grid.dataset.colsBase = tracks.length && tracks.length < count ? base + ' minmax(90px,1fr)'.repeat(count - tracks.length) : base;
  }
  return grid.dataset.colsBase;
}

/** Splits like the legacy loop: spaces at depth 0 separate tracks (brackets may nest). */
function splitTracks(template: string): string[] {
  const tracks: string[] = []; let depth = 0, current = '';
  for (const char of template) {
    if (char === '(') depth++;
    if (char === ')') depth--;
    if (char === ' ' && !depth) { if (current) tracks.push(current); current = ''; } else current += char;
  }
  if (current) tracks.push(current);
  return tracks;
}

function hideColumns(grid: HTMLElement, hidden: readonly number[]): void {
  const tracks = splitTracks(baseTemplate(grid));
  if (!tracks.length) return;
  grid.style.setProperty('--cols', tracks.map((track, index) => (hidden.includes(index) ? '' : track)).filter(Boolean).join(' '));
  if (hidden.length) grid.style.minWidth = 'auto';
  grid.querySelectorAll(':scope > .dh, :scope > .dr').forEach(row => { [...row.children].forEach((cell, index) => { cell.classList.toggle('htno', hidden.includes(index)); }); });
}

function applyWidths(grid: HTMLElement, hidden: readonly number[], widths: unknown): void {
  if (!widths) return;
  const saved = widths as Record<number, number | undefined>, tracks = tracksOf(grid.dataset.colsBase ?? '');
  grid.style.setProperty('--cols', tracks.map((track, index) => (hidden.includes(index) ? null : (saved[index] ? `${saved[index]}px` : track))).filter(Boolean).join(' '));
  grid.style.minWidth = 'max-content';
}

export function applyColumns(grid: HTMLElement): void {
  const kind = tableKind(grid);
  hideColumns(grid, hiddenOf(kind));
  const head = grid.querySelector(':scope > .dh'); if (!head) return;
  applyWidths(grid, hiddenOf(kind), savedWidths(kind));
  [...head.children].forEach((cell, index) => {
    if (cell.querySelector('.colres') || cell.classList.contains('htno') || index === head.children.length - 1) return;
    cell.classList.add('conres');
    cell.insertAdjacentHTML('beforeend', `<i class="colres" data-colres="${index}" title="${t('panels.filters.dragWidth')}"></i>`);
  });
}

/** Saves which columns of a kind of table are hidden. */
export function setHidden(kind: string, index: number, shown: boolean): void {
  const hidden = new Set(hiddenOf(kind));
  if (shown) hidden.delete(index); else hidden.add(index);
  localStorage.setItem(`ht-cols-${kind}`, JSON.stringify([...hidden]));
}
