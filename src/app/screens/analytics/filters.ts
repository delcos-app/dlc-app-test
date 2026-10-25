/** The filters of Analítica → Explorar (built by the legacy page): their values, the text of the option chosen and the call params. */
import { analyticsLegacy } from '../../legacy/analytics-bridge';

const select = (id: string): HTMLSelectElement | null => document.getElementById(id) as HTMLSelectElement | null;

/** The value of a filter ('' if it is not on the page). */
export const valueOf = (id: string): string => select(id)?.value ?? '';

/** The text of the option chosen, only if one is chosen. */
export function selectedText(id: string): string {
  const field = select(id);
  return field?.value ? field.selectedOptions[0]?.textContent ?? '' : '';
}

/** Professional, sales rep, product and reporting: the same in the ranking and in the monthly table. */
export function filterParams(): Record<string, string | null> {
  return {
    p_medico: analyticsLegacy.professional()?.id ?? null, p_comercial: valueOf('acom') || null, p_producto: valueOf('aprod') || null,
    p_reporting: valueOf('arep') || null, p_reportado: valueOf('areprt') || null,
  };
}
