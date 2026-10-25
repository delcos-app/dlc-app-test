/**
 * What is chosen in a row of filters is put back when the screen paints itself again; and a screen's own filters are compact in
 * its row and normal in the side panel. Migrated from the legacy FMEM, filtroGuardar, filtrosRestaurar and chicoEn (v2.416.0).
 */
const chosen = new Map<string, string>();

const FILTER_FIELDS = '.filtros select[id], .filtros input[id], .htpropios select[id], .htpropios input[id]';
const isChoice = (field: HTMLInputElement | HTMLSelectElement): boolean => field.type === 'checkbox' || field.type === 'radio';

/** Marks the fields of `element` (and itself) as compact (`small`) or normal. */
export function compact<T extends Element>(element: T, small: boolean): T {
  [element, ...element.querySelectorAll('input, select')].forEach(field => { if (field.matches('input, select')) field.classList.toggle('chico', small); });
  return element;
}

/** Remembers the value of a filter that changed (listener of «change» on the document). */
export function rememberFilter(event: Event): void {
  const field = event.target as HTMLInputElement | HTMLSelectElement | null;
  if (!field?.id || !/^(SELECT|INPUT)$/.test(field.tagName) || !field.closest('main .filtros, main .htpropios')) return;
  if (isChoice(field)) return;
  chosen.set(field.id, field.value);
}

/** Puts back the remembered values in the filters under `root` (a select only if it still has that option). */
export function restoreFilters(root?: ParentNode | null): void {
  (root ?? document).querySelectorAll<HTMLInputElement | HTMLSelectElement>(FILTER_FIELDS).forEach(field => {
    const value = chosen.get(field.id);
    if (value === undefined || field.value === value || isChoice(field)) return;
    if (field instanceof HTMLSelectElement && ![...field.options].some(option => option.value === value)) return;
    field.value = value;
  });
}
