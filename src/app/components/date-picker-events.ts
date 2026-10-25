/**
 * The page-wide part of the own date, time and number pickers, folded from legado 035, 037 and 038 (v2.424.0): the listeners that
 * open and close them, the number steppers, the visible value of a field, the layer they open in (#seldlg, never cut) and where
 * it is placed (a sheet at the bottom on the phone, next to its field on a computer). The pickers themselves are in date-picker/.
 */
import { legacyBActions, legacyBState } from '../legacy/legado-b-bridge';
import { t } from '../i18n';

/** On the phone, the «ghost click» that follows a tap (~300 ms) must not close the calendar or pick a day. */
const GHOST_CLICK_MS = 500, MARGIN = 8, GAP = 6, ROOM = 12;
type PickerLayer = HTMLDialogElement & { __abierto?: number };

const layer = (): PickerLayer | null => document.getElementById('seldlg') as PickerLayer | null;
const justOpened = (dialog: PickerLayer | null): boolean => Boolean(dialog?.__abierto && Date.now() - dialog.__abierto < GHOST_CLICK_MS);
const openPicker = (input: HTMLInputElement): void => { if (input.type === 'date') legacyBActions.openCalendar(input); else legacyBActions.openClock(input); };

/** The text shown in place of a date or time field. */
export function showVisibleValue(input: HTMLInputElement): void {
  const shown = input.closest('.selw')?.querySelector('.selval'); if (!shown) return;
  const value = input.value;
  if (!value) { shown.textContent = t(input.type === 'date' ? 'legacyB.datePicker.chooseDate' : 'legacyB.datePicker.chooseTime'); shown.classList.add('vacio'); return; }
  shown.classList.remove('vacio');
  if (input.type === 'time') { shown.textContent = value.slice(0, 5); return; }
  const date = new Date(`${value}T12:00:00`);
  shown.textContent = Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(t('dates.locale'), { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

/** Keeps a number between the field's min and max (when it has them). */
function withinLimits(input: HTMLInputElement, value: number): number {
  if (input.min !== '' && value < Number(input.min)) return Number(input.min);
  return input.max !== '' && value > Number(input.max) ? Number(input.max) : value;
}

function stepNumber(button: HTMLElement): void {
  const input = button.parentNode?.querySelector('input'); if (!input || input.disabled || input.readOnly) return;
  const step = Number(input.step) || 1;
  const value = withinLimits(input, (Number(input.value) || 0) + step * Number(button.dataset.nd));
  input.value = step < 1 ? value.toFixed((String(step).split('.')[1] ?? '').length) : String(value);
  legacyBActions.emit(input);
}

function onClick(event: MouseEvent): void {
  const target = event.target as Element;
  const stepper = target.closest<HTMLElement>('.numw .nb'); if (stepper) { stepNumber(stepper); return; }
  const field = target.closest('.selw');
  if (field) {
    const input = field.querySelector('input'); if (!input || input.disabled || input.dataset.ro === '1') return;
    event.preventDefault(); openPicker(input); return;
  }
  // v2.343.0: the ghost click right after opening does not close the calendar (with full-screen windows it fell outside)
  if (justOpened(layer())) return;
  if (!target.closest('.selpop')) legacyBActions.closeSelector();
}

function onKey(event: KeyboardEvent): void {
  const target = event.target, input = target instanceof Element ? target.closest<HTMLInputElement>('.selw input') : null;
  if (input && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); openPicker(input); }
  if (event.key === 'Escape') legacyBActions.closeSelector();
}

/** v2.36.0: the own pickers open instead of the system's; they close on scroll, Escape, a click outside or when their window closes. */
export function listenToPickers(): void {
  document.addEventListener('click', onClick, true);
  document.addEventListener('mousedown', event => { if ((event.target as Element).closest('.selw input')) event.preventDefault(); }, true);
  document.addEventListener('keydown', onKey);
  document.addEventListener('scroll', event => {
    const popover = legacyBState.selectedPopover(), target = event.target;
    if (popover && Date.now() - (popover.__t ?? 0) > GHOST_CLICK_MS && !(target instanceof Element && target.closest('.selpop'))) legacyBActions.closeSelector();
  }, true);
  new MutationObserver(mutations => { for (const mutation of mutations) mutation.addedNodes.forEach(node => { if (node.nodeType === Node.ELEMENT_NODE) legacyBActions.improveFields(node as Element); }); })
    .observe(document.body, { childList: true, subtree: true });
  ['dlg', 'dlg2', 'ficha', 'mini'].forEach(id => { document.getElementById(id)?.addEventListener('close', () => { legacyBActions.closeSelector(); }); });
}

/** v2.37.0: the pickers open in their own layer, so a window never cuts them. */
export function preparePickerLayer(): void {
  if (!document.getElementById('seldlg')) document.body.insertAdjacentHTML('beforeend', '<dialog id="seldlg" class="seldlg"></dialog>');
  const dialog = layer(); if (!dialog) return;
  dialog.addEventListener('click', event => { if (justOpened(dialog)) { event.stopPropagation(); event.preventDefault(); } }, true);
  dialog.addEventListener('click', event => { if (event.target === dialog) legacyBActions.closeSelector(); });
  dialog.addEventListener('cancel', event => { event.preventDefault(); legacyBActions.closeSelector(); });
}

/** Opens the layer and places it: a sheet at the bottom on the phone, next to its field (below if it fits) on a computer. */
export function placePicker(reference: Element): void {
  const dialog = layer(); if (!dialog) return;
  const mobile = legacyBState.isMobile();
  dialog.style.right = mobile ? '' : 'auto'; dialog.style.bottom = mobile ? '' : 'auto';
  if (!dialog.open) { dialog.__abierto = Date.now(); dialog.showModal(); }
  if (mobile) { dialog.classList.add('hoja'); dialog.style.top = ''; dialog.style.left = ''; return; }
  dialog.classList.remove('hoja');
  const box = reference.getBoundingClientRect(), height = dialog.offsetHeight, width = dialog.offsetWidth;
  const below = window.innerHeight - box.bottom > height + ROOM || box.top < height + ROOM;
  dialog.style.top = `${Math.max(MARGIN, below ? box.bottom + GAP : box.top - height - GAP)}px`;
  dialog.style.left = `${Math.max(MARGIN, Math.min(window.innerWidth - width - MARGIN, box.left))}px`;
}
