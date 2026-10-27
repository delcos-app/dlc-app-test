/**
 * Form fields wherever they appear: VAT as a list of the organisation's rates (Spain's by default, v2.445.0) and never on an amount (v2.54.0–v2.57.0), files, long notes and
 * textareas that grow (v2.56.0/v2.57.0), month and date-time values, held «+»/«−», the wheel, minimum and maximum, no browser history,
 * keyboard in the search suggestions (v2.101.0), and dates and times on touch screens without the system picker (v2.175.0–v2.184.0).
 * Folded from legado 055, 057, 058, 071, 074, 077 and 078 (v2.425.0).
 */
import { t } from '../../i18n';
import { vatRates } from '../organisation';
import { addedElements, byId, closestTo, matchingIn, observe } from './dom';
import * as legacyFreeCoreLegacyC from './';
import * as legacyFreeComponents from '../../components';

const MAX_TEXTAREA_PX = 420, REPEAT_AFTER_MS = 450, REPEAT_EVERY_MS = 90;

function vatSelect(input: HTMLInputElement): HTMLSelectElement {
  const value = input.value === '' ? '' : Number(input.value);
  const select = document.createElement('select'), rates = vatRates();
  select.className = 'ivasel'; if (input.disabled || input.readOnly) select.disabled = true;
  select.innerHTML = rates.map(([rate, text]) => `<option value="${rate}" ${rate === value ? 'selected' : ''}>${text}</option>`).join('')
    + (value !== '' && !rates.some(rate => rate[0] === value) ? `<option value="${value}" selected>${t('legacyC.vat.unusual', { rate: value })}</option>` : '');
  return select;
}

/** v2.54.0: the VAT field becomes a list of the legal rates; the original field is still the one the platform reads. */
function replaceWithSelect(input: HTMLInputElement): void {
  if (input.dataset.ivasel || input.type === 'hidden') return;
  input.dataset.ivasel = '1';
  const select = vatSelect(input);
  if (input.id) { document.querySelector(`label[for="${input.id}"]`)?.setAttribute('for', `${input.id}_sel`); select.id = `${input.id}_sel`; }
  input.classList.add('hide'); input.after(select);
  if (input.value === '') input.value = select.value;
  select.onchange = (): void => {
    input.value = select.value; input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true }));
  };
}

/** VAT selector (the legacy ivaSelector): only on percentages, never on an amount «con IVA»; without the «+»/«−» buttons. */
export function vatSelector(input: HTMLInputElement | null | undefined): void {
  if (!input || !esPorcentajeIva(input) || input.dataset.ivasel) return;
  input.dataset.sel = '1';
  const wrapper = input.closest('.numw');
  if (wrapper) { wrapper.parentNode?.insertBefore(input, wrapper); wrapper.remove(); }
  replaceWithSelect(input);
}

const onAdded = (selector: string, each: (element: HTMLElement) => void): void => {
  observe(document.body, mutations => { addedElements(mutations).forEach(node => { matchingIn(node, selector).forEach(each); }); }, { childList: true, subtree: true });
};

/** v2.54.0: the known VAT fields. */
export const watchVatFields = (): void => { onAdded('#priva, #penvv, input[data-f="iva"]', element => { legacyFreeCoreLegacyC.vatSelector((element as HTMLInputElement)); }); };

/** v2.56.0: any VAT field (not IBAN, price or amount), files, and notes that grow. */
export function watchFormFields(): void {
  onAdded('input[type=number],input[type=text]', element => {
    const input = element as HTMLInputElement;
    if (!input.dataset.ivasel && ES_IVA(input) && !/iban|precio|importe/i.test(input.id)) legacyFreeCoreLegacyC.vatSelector(input);
  });
  onAdded('input[type=file]', element => { selectorArchivo(element as HTMLInputElement); });
  document.addEventListener('input', event => {
    const area = event.target;
    if (area instanceof HTMLTextAreaElement) { area.style.height = 'auto'; area.style.height = `${Math.min(area.scrollHeight + 2, MAX_TEXTAREA_PX)}px`; }
  });
}

/** v2.57.0: any wrong conversion is undone (an amount turned into a VAT list); long texts get a wide note. */
export function undoWrongVat(): void {
  observe(document.body, () => {
    document.querySelectorAll('select.ivasel').forEach(select => {
      const input = select.previousElementSibling;
      if (!(input instanceof HTMLInputElement) || esPorcentajeIva(input)) return;
      input.classList.remove('hide'); delete input.dataset.ivasel; delete input.dataset.sel; select.remove();
      if (input.id) document.querySelector(`label[for="${input.id}_sel"]`)?.setAttribute('for', input.id);
    });
  }, { childList: true, subtree: true });
}

export const watchWideNotes = (): void => { onAdded('input[type=text]', element => { notaAmplia(element as HTMLInputElement); }); };

/** v2.101.0: the visible value of a month and of a date with time (the legacy valorVisible). */
export function visibleValue(input: HTMLInputElement): void {
  const kind = selTipo(input);
  if (kind !== 'mes' && kind !== 'fechahora') { valorVisibleBase(input); return; }
  const shown = input.closest('.selw')?.querySelector('.selval'); if (!shown) return;
  const value = input.value;
  if (!value) { shown.textContent = t(kind === 'mes' ? 'legacyC.fields.chooseMonth' : 'legacyC.fields.chooseDateTime'); shown.classList.add('vacio'); return; }
  shown.classList.remove('vacio');
  if (kind === 'mes') { const [year, month] = value.split('-'); shown.textContent = `${MESES_L[Number(month) - 1] ?? ''} ${year ?? ''}`; return; }
  shown.textContent = `${legacyFreeComponents.mediumDate((value.slice(0, 10)))} · ${value.slice(11, 16)}`;
}

/** v2.101.0: holding «+» or «−» repeats; the last click does not add once more. */
function repeatNumberButtons(): void {
  let wait = 0, repeat = 0, repeated = false;
  const stop = (): void => { clearTimeout(wait); clearInterval(repeat); wait = repeat = 0; };
  document.addEventListener('pointerdown', event => {
    const button = closestTo(event.target, '.numw .nb'); if (!button) return;
    repeated = false; stop();
    wait = window.setTimeout(() => { repeat = window.setInterval(() => { repeated = true; button.dispatchEvent(new MouseEvent('click', { bubbles: true })); }, REPEAT_EVERY_MS); }, REPEAT_AFTER_MS);
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(type => { document.addEventListener(type, stop, true); });
  // In the window and in capture: before the buttons' handler, which is on the document
  window.addEventListener('click', event => {
    if (event.isTrusted && repeated && closestTo(event.target, '.numw .nb')) { repeated = false; event.stopPropagation(); event.preventDefault(); }
  }, true);
}

/** A number written out of its minimum or maximum is corrected when leaving the field. */
function clampNumber(event: Event): void {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || !input.matches('input[type=number]') || input.value === '') return;
  let value = Number(input.value); if (isNaN(value)) return;
  if (input.min !== '' && value < Number(input.min)) value = Number(input.min);
  if (input.max !== '' && value > Number(input.max)) value = Number(input.max);
  if (value !== Number(input.value)) { input.value = String(value); input.dispatchEvent(new Event('input', { bubbles: true })); }
}

/** v2.101.0: numbers (repeat, no wheel, limits) and fields without the browser history. */
export function improveNumbers(): void {
  repeatNumberButtons();
  // The mouse wheel does not change a number by accident
  document.addEventListener('wheel', event => {
    const input = event.target;
    if (input instanceof HTMLElement && input.matches('input[type=number]') && document.activeElement === input) input.blur();
  }, { passive: true });
  document.addEventListener('change', clampNumber, true);
  observe(document.body, sinHistorialLuego, { childList: true, subtree: true });
  sinHistorial(document.body);
}

const touchScreen = (): boolean => window.matchMedia('(pointer: coarse)').matches;

/** v2.175.0/v2.176.0: on touch screens the wrapper opens the delcos picker and the field never takes the focus. */
export function noSystemPickers(): void {
  document.addEventListener('focusin', event => {
    const input = event.target;
    if (input instanceof HTMLInputElement && input.matches('.selw input') && touchScreen()) input.blur();
  }, true);
  const mini = byId<HTMLDialogElement>('mini');
  if (mini) { const open = mini.showModal.bind(mini); mini.showModal = (): void => { try { mejorarCampos(mini); } catch { /* the window opens anyway */ } open(); }; }
  document.addEventListener('focusin', event => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !input.matches('input[type=date], input[type=time]') || input.closest('.selpop') || !touchScreen()) return;
    if (!input.closest('.selw')) { try { mejorarCampos(input.parentNode as Element); } catch { /* it stays a plain field */ } }
    input.blur();
  }, true);
}

/** v2.140.0: icon-only buttons spin while they work and show no text (the legacy conCarga). */
export async function withLoading<T>(button: HTMLElement | null, text: string, work: () => Promise<T>): Promise<T | undefined> {
  if (!button || !(button.id === 'iniact' || button.classList.contains('icoredondo') || button.classList.contains('icobtn'))) return conCargaBase(button, text, work);
  if (button.dataset.cargando) return undefined;
  button.dataset.cargando = '1'; (button as HTMLButtonElement).disabled = true; button.classList.add('icogira'); button.setAttribute('aria-busy', 'true');
  try { return await work(); } finally { (button as HTMLButtonElement).disabled = false; button.classList.remove('icogira'); button.removeAttribute('aria-busy'); delete button.dataset.cargando; }
}
