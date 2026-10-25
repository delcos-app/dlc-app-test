/**
 * What the calendar and the clock share: the kind of field, the open popup (legacy SELPOP, also closed by legacy listeners), where it
 * goes and how a value is set. Migrated from componentes/selector_fecha.js (v2.416.0).
 */
import { componentsLegacy } from '../../legacy/components-bridge';
import { t } from '../../i18n';

export type PickerKind = 'mes' | 'fechahora' | 'hora' | 'fecha';

export interface PickerOptions { fecha?: string | undefined; mismo?: boolean | undefined; teclado?: boolean | undefined; desdeCal?: boolean | undefined }

/** A popup that remembers when it was last touched (legacy listeners read __t). */
export type PickerPopup = HTMLDivElement & { __t?: number };

export const twoDigits = (value: number): string => String(value).padStart(2, '0');

export const kindOf = (input: HTMLInputElement): PickerKind => {
  if (input.type === 'month') return 'mes';
  if (input.type === 'datetime-local') return 'fechahora';
  return input.type === 'time' ? 'hora' : 'fecha';
};

export const longMonths = (): string[] => t('dates.monthsLong').split(',');
export const shortMonths = (): string[] => t('dates.monthsShort').split(',');

/** «lunes, 26 de octubre de 2026» (screen readers). */
export function longDate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`), weekdays = t('components.datePicker.weekdays').split(',');
  return t('components.datePicker.longDate', { weekday: weekdays[date.getDay()] ?? '', day: date.getDate(), month: longMonths()[date.getMonth()] ?? '', year: date.getFullYear() });
}

/** «lun, 26 oct 2026». */
export function mediumDate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  return isNaN(date.getTime()) ? isoDate : date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

/** Closes the open calendar or clock. */
export function closePicker(): void {
  componentsLegacy.popup()?.remove();
  componentsLegacy.setPopup(null);
  const dialog = document.getElementById('seldlg') as HTMLDialogElement | null;
  if (dialog?.open) dialog.close();
}

/** Closes the suggestion lists of the pickers, except the one inside `except`. */
export function closePickers(except?: Element | null): void {
  document.querySelectorAll('.picker .gsug').forEach(list => { if (!except?.contains(list)) list.classList.add('hide'); });
}

/** With a window open, only what is inside it can be pressed: the picker goes in it. */
const layerOf = (input: HTMLInputElement): Element =>
  input.closest('dialog[open]') ?? [...document.querySelectorAll('dialog[open]')].pop() ?? document.body;

/** A new popup replaces the open one (inside the same small window when it comes from the other picker). */
export function newPopup(className: string, label: string, same: boolean | undefined): PickerPopup {
  if (same && componentsLegacy.popup()) { componentsLegacy.popup()?.remove(); componentsLegacy.setPopup(null); } else closePicker();
  const popup: PickerPopup = document.createElement('div');
  popup.className = className; popup.__t = Date.now();
  popup.setAttribute('role', 'dialog'); popup.setAttribute('aria-label', label);
  componentsLegacy.setPopup(popup);
  popup.addEventListener('pointerdown', () => { popup.__t = Date.now(); });
  return popup;
}

export function attachPopup(popup: PickerPopup, input: HTMLInputElement): void {
  (document.getElementById('seldlg') ?? layerOf(input)).appendChild(popup);
}

export const placePopup = (popup: HTMLElement, input: HTMLInputElement): void => { componentsLegacy.placePopup(popup, input.closest('.selw') ?? input); };

/** Sets the value, tells the screen, closes the picker. */
export function setValue(input: HTMLInputElement, value: string, focus = false): void {
  input.value = value; componentsLegacy.emitChange(input); closePicker();
  if (focus) input.focus({ preventScroll: true });
}
