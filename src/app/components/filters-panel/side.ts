/**
 * The side panel (#tools) where «Filtros y columnas» opens: whether it is open for this screen, and giving the screen's own filters
 * back when it closes. Migrated from the legacy htLateralAbierto and htDevolver (v2.419.0); both stay as adapters (legado 055 and the
 * components bridge call them).
 */
import { sidePanel } from '../../legacy/bridge';
import { compact } from '../filters/memory';

export const toolsBox = (): HTMLElement | null => document.getElementById('tools');

export const screenId = (section: Element): string => section.id.replace('v-', '');

/** The side panel is open and shows a «Filtros y columnas» (its context starts with «ht-»). */
export function sideOpen(): boolean {
  return Boolean(toolsBox()?.classList.contains('abierto')) && String(sidePanel.context() ?? '').startsWith('ht-');
}

/** The side panel is open with the filters of this screen. */
export const sideOpenFor = (section: Element): boolean => sideOpen() && sidePanel.context() === `ht-${screenId(section)}`;

/** The screen's own filters that were in the side panel go back to the screen's (hidden) panel. */
export function giveBack(): void {
  const side = toolsBox()?.querySelector('.htpropios.lat');
  if (!side) return;
  const section = document.getElementById(`v-${String(sidePanel.context() ?? '').replace('ht-', '')}`);
  const hold = section?.querySelector('.htpanel .htpropios');
  if (hold) [...side.children].forEach(child => { hold.appendChild(compact(child, true)); });
}
