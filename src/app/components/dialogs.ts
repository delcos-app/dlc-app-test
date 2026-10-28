/**
 * The small windows of the whole app, in the #mini dialog: a notice or a confirmation, a question with a text field, a choice
 * between several buttons and a date or time field. Also «¿Salir sin guardar?» when closing a window with unsaved changes.
 * Migrated from componentes/ventana.js (v2.416.0); appVentana, preguntar, pedirTexto, elegirOpcion, pedirCampo, intentarCerrar,
 * hayBotonGuardar and esBotonGuardar stay as adapters (the whole legacy app calls them).
 */
import { t } from '../i18n';
import { todayIso } from '../services/dates';
import { escapeHtml } from '../services/format';
import { enhanceFields } from './date-picker';

export interface DialogField { valor?: string | undefined; placeholder?: string | undefined; tipo?: string | undefined; min?: string | undefined }
export interface DialogOptions { titulo?: string | undefined; msg?: string | undefined; ok?: string | undefined; cancel?: string | false | undefined; campo?: DialogField | undefined; opciones?: readonly string[] | undefined; peligro?: boolean | undefined }
export interface ChoiceButton { k: string; t: string; cls?: string | undefined }

const FOCUS_DELAY_MS = 30;
const SAVE_BUTTON = /^(guardar|validar|crear|añadir|enviar|aplicar|aceptar|confirmar|registrar|emitir|dar de alta)/i;
const SAVING_TEXT = /^(\+\s*)?(guardar|crear|añadir|enviar|validar|aplicar|confirmar|emitir|cobrar|registrar|marcar|asignar|unificar|cambiar|borrar|eliminar|quitar|anular|rectificar|liquidar|pedir|actualizar)\b/i;

const mini = (): HTMLDialogElement => document.getElementById('mini') as HTMLDialogElement;
const fieldValue = (): string => (document.getElementById('mcampo') as HTMLInputElement | null)?.value ?? '';

function fieldHtml(field: DialogField | undefined): string {
  if (!field) return '';
  return `<input id="mcampo" type="${field.tipo ?? 'text'}" value="${escapeHtml(field.valor ?? '')}"
                   placeholder="${escapeHtml(field.placeholder ?? '')}" ${field.min ? `min="${field.min}"` : ''}>`;
}

function dialogHtml(options: DialogOptions): string {
  const { titulo, msg, ok, cancel, campo, opciones, peligro } = options;
  return `<div class="fbox">
      <div class="fh"><h2>${escapeHtml(titulo ?? t('components.dialogs.confirm'))}</h2></div>
      ${msg ? `<p style="margin:0 0 10px;white-space:pre-line">${escapeHtml(msg)}</p>` : ''}
      ${fieldHtml(campo)}
      ${opciones?.length ? `<div class="chips u-p-10-0-0">${
        opciones.map(option => `<button type="button" class="chip" data-mop="${escapeHtml(option)}">${escapeHtml(option)}</button>`).join('')}</div>` : ''}
      <div class="acts u-end">
        ${cancel === false ? '' : `<button class="btn sec" id="mno">${escapeHtml(cancel ?? t('components.dialogs.cancel'))}</button>`}
        <button class="btn ${peligro ? 'dang' : ''}" id="mok">${escapeHtml(ok ?? t('components.dialogs.accept'))}</button></div></div>`;
}

function bindDialog(dialog: HTMLDialogElement, hasField: boolean, finish: (value: unknown) => void): void {
  const ok = document.getElementById('mok'), no = document.getElementById('mno');
  if (ok) ok.onclick = (): void => { finish(hasField ? fieldValue() : true); };
  if (no) no.onclick = (): void => { finish(hasField ? null : false); };
  dialog.querySelectorAll<HTMLElement>('[data-mop]').forEach(button => {
    button.onclick = (): void => { const input = document.getElementById('mcampo') as HTMLInputElement | null; if (input) input.value = button.dataset.mop ?? ''; };
  });
  dialog.onclick = (event): void => { if (event.target === dialog) finish(hasField ? null : false); };
  dialog.oncancel = (event): void => { event.preventDefault(); finish(hasField ? null : false); };
}

function focusField(finish: (value: unknown) => void): void {
  setTimeout(() => {
    const input = document.getElementById('mcampo') as HTMLInputElement | null;
    if (!input) { document.getElementById('mok')?.focus(); return; }
    input.focus();
    input.onkeydown = (event): void => { if (event.key === 'Enter') finish(input.value); };
  }, FOCUS_DELAY_MS);
}

/** A notice or a confirmation (true/false), or a question with a field (its text, or null if cancelled). */
function openDialog(options: DialogOptions): Promise<unknown> {
  return new Promise(resolve => {
    const dialog = mini();
    dialog.innerHTML = dialogHtml(options);
    const finish = (value: unknown): void => { dialog.close(); resolve(value); };
    bindDialog(dialog, Boolean(options.campo), finish);
    dialog.showModal();
    focusField(finish);
  });
}

/** «area» fields (notes) become a wider textarea of several lines. */
export function showDialog(options: DialogOptions): Promise<unknown> {
  const answer = openDialog(options);
  if (options.campo?.tipo === 'area') setTimeout(() => {
    const input = document.getElementById('mcampo') as HTMLInputElement | null; if (!input) return;
    const area = document.createElement('textarea'); area.id = 'mcampo'; area.rows = 6; area.value = input.value; area.placeholder = input.placeholder;
    input.replaceWith(area);
    mini().classList.add('ancha'); area.focus();
  }, 0);
  return answer;
}

export const confirmAction = (message: string, options: { titulo?: string | undefined; ok?: string | undefined; peligro?: boolean | undefined } = {}): Promise<boolean> =>
  showDialog({ msg: message, titulo: options.titulo, ok: options.ok, peligro: options.peligro }) as Promise<boolean>;

export const askText = (message: string, value: string, options: { titulo?: string | undefined; ok?: string | undefined; placeholder?: string | undefined; tipo?: string | undefined; opciones?: readonly string[] | undefined } = {}): Promise<string | null> =>
  showDialog({ msg: message, titulo: options.titulo, ok: options.ok ?? t('components.dialogs.save'), campo: { valor: value, placeholder: options.placeholder, tipo: options.tipo }, opciones: options.opciones }) as Promise<string | null>;

/** A window with several buttons: the key of the chosen one, or null («no», Escape or outside). */
export function chooseOption(title: string, message: string, buttons: readonly ChoiceButton[]): Promise<string | null> {
  return new Promise(resolve => {
    const dialog = mini();
    dialog.innerHTML = `<div class="fbox"><div class="fh"><h2>${escapeHtml(title)}</h2></div>
      <p style="margin:0 0 10px;white-space:pre-line">${escapeHtml(message)}</p>
      <div class="acts u-end u-wrap">${buttons.map(button =>
        `<button class="btn ${button.cls ?? ''}" data-op="${button.k}">${escapeHtml(button.t)}</button>`).join('')}</div></div>`;
    const finish = (value: string | null): void => { dialog.close(); resolve(value); };
    dialog.querySelectorAll<HTMLElement>('[data-op]').forEach(button => { button.onclick = (): void => { finish(button.dataset.op === 'no' ? null : button.dataset.op ?? null); }; });
    dialog.oncancel = (event): void => { event.preventDefault(); finish(null); };
    dialog.onclick = (event): void => { if (event.target === dialog) finish(null); };
    dialog.showModal();
  });
}

/** A date or time field in a small window (from today on). */
export function askField(title: string, type: string, value: string | null | undefined, label: string): Promise<string | null> {
  return new Promise(resolve => {
    const dialog = mini();
    dialog.innerHTML = `<div class="fbox"><div class="fh"><h2>${escapeHtml(title)}</h2></div><label for="rnpc">${escapeHtml(label)}</label><input id="rnpc" type="${type}" value="${escapeHtml(value ?? '')}" min="${todayIso()}">
      <div class="acts u-end"><button class="btn sec" data-op="no">${t('components.dialogs.cancel')}</button><button class="btn" data-op="si">${t('components.dialogs.accept')}</button></div></div>`;
    const finish = (answer: string | null): void => { dialog.close(); resolve(answer); };
    dialog.querySelectorAll<HTMLElement>('[data-op]').forEach(button => {
      button.onclick = (): void => { finish(button.dataset.op === 'si' ? (document.getElementById('rnpc') as HTMLInputElement).value : null); };
    });
    dialog.oncancel = (event): void => { event.preventDefault(); finish(null); };
    enhanceFields(dialog);
    dialog.showModal();
  });
}

/** Whether a window shows a button that saves (Guardar, Validar, Crear…): only then can something be left half done. */
export const hasSaveButton = (dialog: Element): boolean => [...dialog.querySelectorAll<HTMLElement>('button, .btn')].some(button =>
  button.offsetParent && !(button as HTMLButtonElement).disabled && !button.classList.contains('sec') && SAVE_BUTTON.test((button.textContent ?? '').trim()));

/** Whether a button saves (it shows the saving state when pressed). */
export function isSaveButton(button: Element | null): boolean {
  if (!button || button.matches('.sec, .x, .kmv, .plic, [data-cerrar], [data-cerrar2], .vueltabtn, .guardando')) return false;
  if (!button.closest('dialog[open], #v-config')) return false;
  return /ok$|guardar|enviar/i.test(button.id || '') || SAVING_TEXT.test((button.textContent ?? '').trim());
}

/** Closes a window, asking first if it has unsaved changes and a save button. */
export async function tryClose(dialog: HTMLDialogElement): Promise<void> {
  if (dialog.dataset.sucio && hasSaveButton(dialog) && !await confirmAction(t('components.dialogs.leaveText'),
    { titulo: t('components.dialogs.leaveTitle'), ok: t('components.dialogs.leaveOk'), peligro: true })) return;
  dialog.close();
}
