/**
 * «Tu día» compact (v2.299.0): one line per appointment, remembered on this device. Split from header.ts and index.ts for plan 7.3
 * (cut C): the mode applies on start and its button is answered by a listener of the core (listeners.ts), so it stays in the core.
 */
import { legacyIcons } from '../../../legacy/bridge';
import { t } from '../../../i18n';

const COMPACT_KEY = 'delcos-tdcompacto';

/** Whether «Tu día» is compact on this device. */
export function compact(): boolean {
  try { return localStorage.getItem(COMPACT_KEY) === '1'; } catch { return false; }
}

/** Remembers the compact mode on this device. */
export function rememberCompact(value: boolean): void {
  try { localStorage.setItem(COMPACT_KEY, value ? '1' : '0'); } catch { /* not remembered */ }
}

export const applyCompact = (): void => { document.body.classList.toggle('tdcompacto', compact()); };

/** The compact button of the header of «Tu día». */
export function compactButton(isCompact: boolean): string {
  const title = t(isCompact ? 'agenda.yourDay.showDetail' : 'agenda.yourDay.compactTitle'), label = t(isCompact ? 'agenda.yourDay.showDetail' : 'agenda.yourDay.compactLabel');
  return `<button type="button" class="btn sec chico plic" id="tdcompactar" aria-pressed="${String(isCompact)}" title="${title}" aria-label="${label}">${legacyIcons.list(isCompact ? 'file-text' : 'list')}</button>`;
}

/** The compact button after a toggle (same markup as when painted). */
export function setCompactButton(button: HTMLElement, isCompact: boolean): void {
  button.title = t(isCompact ? 'agenda.yourDay.showDetail' : 'agenda.yourDay.compactTitle');
  button.setAttribute('aria-label', t(isCompact ? 'agenda.yourDay.showDetail' : 'agenda.yourDay.compactLabel'));
  button.innerHTML = legacyIcons.list(isCompact ? 'file-text' : 'list');
  button.setAttribute('aria-pressed', String(isCompact));
}
