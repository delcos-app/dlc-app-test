/** Small readers of the list bar: icons, the text of an element and the label of a quick filter. Migrated from plIco, plTxt, plSm, plSel and plEtiq (v2.421.0). */
import { listBarLegacy } from '../../legacy/listbar-bridge';

/** The first icon found among the names (line icons first, then the emoji ones). */
export const icon = (...names: string[]): string => listBarLegacy.icon(names);

/** The text of an element in one line. */
export const textOf = (element: Element | null | undefined): string => (element?.textContent ?? '').trim().replace(/\s+/g, ' ');

/** The small line of a card. */
export const smallText = (element: Element | null | undefined): string => textOf(element?.querySelector('.tx .sm, .sm'));

/** A quick filter's select: by id, or by selector when it starts with # or . */
export const selectOf = (id: string | null | undefined): HTMLSelectElement | null => {
  if (!id) return null;
  return (/^[#.]/.test(id) ? document.querySelector(id) : document.getElementById(id)) as HTMLSelectElement | null;
};

/** The label of a quick filter's field (its <label for> or the label of its box). */
export function labelOf(id: string): string {
  const select = selectOf(id); if (!select) return '';
  const label = (select.id ? document.querySelector(`label[for="${select.id}"]`) : null) ?? select.closest('div')?.querySelector(':scope > label');
  return label ? (label.textContent ?? '').trim() : '';
}
