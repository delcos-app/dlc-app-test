/**
 * Every date, time, month, date-and-time and number field is enhanced when it appears: the app's own picker instead of the
 * system's (the value shown in Spanish), − and + on quantities, the right keyboard on the phone, a VAT selector on VAT fields.
 * Migrated from mejorarCampos and its layers in componentes/selector_fecha.js (v2.416.0); mejorarCampos stays as an adapter.
 */
import { componentsLegacy } from '../../legacy/components-bridge';
import { t } from '../../i18n';

const SMALL_ROW_INPUT = 70;
const NEW_KINDS = 'input[type=month]:not([data-sel]), input[type=datetime-local]:not([data-sel])';
const DECIMAL_TEXT = /€|precio|importe|coste|portes|env[ií]o|descuento|pvp|cobro|total|base/;
const valueProperty = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');

type Root = Document | Element;

/** The input shows its value through .selval (Spanish format) and is read-only: the picker sets it. */
function wrapPicked(input: HTMLInputElement, className: string, icon: string): void {
  const wrapper = document.createElement('span'); wrapper.className = className;
  input.parentNode?.insertBefore(wrapper, input); wrapper.appendChild(input);
  wrapper.insertAdjacentHTML('beforeend', `<span class="selico" aria-hidden="true">${icon}</span>`);
  input.dataset.ro = input.readOnly ? '1' : '';
  input.readOnly = true; input.setAttribute('inputmode', 'none');
  wrapper.insertAdjacentHTML('afterbegin', '<span class="selval"></span>');
  Object.defineProperty(input, 'value', { configurable: true, get(this: HTMLInputElement): string { return valueProperty?.get?.call(this) as string; },
    set(this: HTMLInputElement, value: string): void { valueProperty?.set?.call(this, value); componentsLegacy.showValue(this); } });
  input.addEventListener('change', () => { componentsLegacy.showValue(input); });
  input.addEventListener('input', () => { componentsLegacy.showValue(input); });
  componentsLegacy.showValue(input);
}

function wrapNumber(input: HTMLInputElement): void {
  if (input.closest('.lrow') && input.offsetWidth && input.offsetWidth < SMALL_ROW_INPUT) return;
  const wrapper = document.createElement('span'); wrapper.className = 'numw';
  input.parentNode?.insertBefore(wrapper, input); wrapper.appendChild(input);
  wrapper.insertAdjacentHTML('afterbegin', `<button type="button" class="nb" data-nd="-1" aria-label="${t('components.datePicker.less')}" tabindex="-1">−</button>`);
  wrapper.insertAdjacentHTML('beforeend', `<button type="button" class="nb" data-nd="1" aria-label="${t('components.datePicker.more')}" tabindex="-1">+</button>`);
  if (input.disabled) wrapper.classList.add('dis');
}

function enhanceNow(root: Root): void {
  root.querySelectorAll<HTMLInputElement>('input[type=date]:not([data-sel]), input[type=time]:not([data-sel]), input[type=number]:not([data-sel])').forEach(input => {
    input.dataset.sel = '1';
    if (input.closest('.selpop')) return;
    if (input.type === 'number') { wrapNumber(input); return; }
    wrapPicked(input, `selw ${input.type === 'date' ? 'fecha' : 'hora'}`, input.type === 'date' ? '📅' : '🕒');
  });
}

/** Fields that appear inside a node are enhanced together, once per microtask. */
function enhanceSoon(root: Root): void {
  if (root === document) { enhanceNow(root); return; }
  const element = root as Element;
  if (element.nodeType !== 1 || (!Reflect.has(element, 'querySelector') && element.tagName !== 'INPUT')) return;
  const pending = componentsLegacy.pending();
  pending.add(element);
  if (componentsLegacy.flushScheduled()) return;
  componentsLegacy.setFlushScheduled(true);
  queueMicrotask(() => {
    componentsLegacy.setFlushScheduled(false);
    const nodes = [...pending]; pending.clear();
    nodes.forEach(node => {
      const target = node.tagName === 'INPUT' ? node.parentElement : node;
      if (node.isConnected && target && (node.tagName === 'INPUT' || node.querySelector('input[type=date],input[type=time],input[type=number]'))) enhanceNow(target);
    });
  });
}

function labelText(input: HTMLInputElement): string {
  const label = (input.id ? document.querySelector(`label[for="${input.id}"]`) : null) ?? input.closest('label');
  return `${input.id} ${input.dataset.f ?? ''} ${input.placeholder} ${label?.textContent ?? ''}`.toLowerCase();
}

/** Amounts and percentages go without − and + (adding one by one to an amount makes no sense); VAT gets its selector. */
function markDecimals(root: Root): void {
  root.querySelectorAll<HTMLInputElement>('input[type=number]:not([data-sel])').forEach(input => {
    if (componentsLegacy.isVatField(input)) { componentsLegacy.vatSelector(input); return; }
    const decimal = /^(0?\.\d+|any)$/.test(input.getAttribute('step') ?? '');
    if (decimal || DECIMAL_TEXT.test(labelText(input))) { input.dataset.sel = '1'; input.classList.add('numdec'); }
  });
}

/** Month and date-and-time fields with the same picker; the number keyboard by the field's step. */
function enhanceNewKinds(root: Root): void {
  const list = [...root.querySelectorAll<HTMLInputElement>(NEW_KINDS)];
  if (root instanceof HTMLInputElement && root.matches(NEW_KINDS)) list.push(root);
  list.forEach(input => {
    input.dataset.sel = '1';
    if (input.closest('.selpop')) return;
    wrapPicked(input, 'selw fecha', '📅');
  });
  root.querySelectorAll<HTMLInputElement>('input[type=number]:not([inputmode])').forEach(input => {
    const step = input.step && input.step !== 'any' ? Number(input.step) : 1;
    input.setAttribute('inputmode', step < 1 || input.step === 'any' ? 'decimal' : 'numeric');
  });
}

/** On touch screens, the system pickers never open (the app's own do). */
function withoutSystemPicker(root: Root): void {
  if (!componentsLegacy.touchScreen()) return;
  const inputs = [...root.querySelectorAll('input')];
  if (root instanceof HTMLInputElement) inputs.push(root);
  inputs.forEach(input => { if (/^(date|time|month|datetime-local)$/.test(input.type) && !input.closest('.selpop')) input.inert = true; });
}

/** Enhances the fields inside `root` (the whole page when not given). */
export function enhanceFields(root?: Root | null): void {
  const target = root ?? document;
  if (!Reflect.has(target, 'querySelectorAll')) return;
  markDecimals(target);
  enhanceSoon(target);
  enhanceNewKinds(target);
  try { withoutSystemPicker(target); } catch { /* the system picker stays usable */ }
}

export { enhanceNewKinds as enhanceNewFieldKinds, withoutSystemPicker };
