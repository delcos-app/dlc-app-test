/**
 * Small field helpers shared by many windows: the password eye, the custom field box of a classifier, the Spanish tax id check
 * (DNI, NIE, CIF), the extra «dato» of a classifier value, the email checked while typing, the input of a custom field, wide notes
 * and fields without browser history. Migrated from the legacy componentes/campos.js (v2.427.0); the legacy names stay as adapters.
 */
import { leftoversLegacy } from '../legacy/leftovers-bridge';
import { t } from '../i18n';
import { escapeHtml } from '../services/format';
import { orFallback } from '../services/values';

const EYE = {
  show: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  hide: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.9 4.2A10.6 10.6 0 0 1 12 4c6.4 0 10 8 10 8a17.6 17.6 0 0 1-2.2 3.2M6.6 6.6C3.7 8.6 2 12 2 12s3.6 8 10 8a9.7 9.7 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/><path d="M2 2l20 20"/></svg>',
};

/** Wraps `input` and returns the wrapper (the input is moved inside it). */
function wrap(input: HTMLElement, className: string): HTMLSpanElement {
  const wrapper = document.createElement('span'); wrapper.className = className;
  input.parentNode?.insertBefore(wrapper, input); wrapper.appendChild(input);
  return wrapper;
}

/** The eye to see the password while typing it. */
export function passwordEye(input: HTMLInputElement | null): void {
  if (!input || input.dataset.ojo || input.closest('.pwdw')) return;
  input.dataset.ojo = '1';
  const wrapper = wrap(input, 'pwdw'), button = document.createElement('button');
  const label = (shown: boolean): string => t(shown ? 'leftovers.fields.hidePassword' : 'leftovers.fields.showPassword');
  button.type = 'button'; button.className = 'pwdojo'; button.innerHTML = EYE.show;
  button.setAttribute('aria-label', label(false)); button.title = label(false);
  button.onclick = (): void => {
    const show = input.type === 'password'; input.type = show ? 'text' : 'password';
    button.innerHTML = show ? EYE.hide : EYE.show; button.setAttribute('aria-label', label(show)); button.title = label(show);
    input.focus({ preventScroll: true });
  };
  wrapper.appendChild(button);
}

interface ClassifierField { papel?: string | null; ambito: string; tipo_campo?: string | null; [flag: string]: unknown }
const FIELD_FLAGS = [['obligatorio', 'required'], ['solo_lectura', 'readOnly'], ['en_ficha', 'onCard'], ['en_tabla', 'tableColumn'], ['en_filtro', 'filter']] as const;

/** v2.72.0: a classifier of an account, customer or product without a role is a custom field: its type and where it shows. */
export function customFieldBox(classifier: ClassifierField, complete: boolean): string {
  if (classifier.papel || !leftoversLegacy.fieldTable(classifier.ambito)) return '';
  const type = classifier.tipo_campo ?? 'lista', off = complete ? '' : 'disabled';
  const checks = FIELD_FLAGS.map(([flag, key]) => `<label class="chk"><input type="checkbox" id="cfc_${flag}" ${classifier[flag] ? 'checked' : ''} ${off}> ${t(`leftovers.fields.${key}`)}</label>`).join('');
  const types = leftoversLegacy.fieldTypes().map(([key, name]) => `<option value="${key}" ${key === type ? 'selected' : ''}>${name}</option>`).join('');
  return `<div class="cfcampo"><h3>${t('leftovers.fields.customField')}</h3>
    <div class="g2"><div><label for="cfctipo">${t('leftovers.fields.type')}</label><select id="cfctipo" ${off}>${types}</select></div>
      <div class="cfchks">${checks}</div></div>
    ${complete ? `<div class="acts u-end"><button class="btn sec" id="cfcok">${t('leftovers.fields.saveField')}</button></div>` : ''}</div>`;
}

export interface DocumentCheck { ok: boolean; v: string; msg?: string }
const DNI_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE', CIF_LETTERS = 'JABCDEFGHI', COMPANY = 'Empresa';

function checkCif(value: string): DocumentCheck {
  const match = /^([ABCDEFGHJKLMNPQRSUVW])(\d{7})([0-9A-J])$/.exec(value);
  if (!match) return { ok: false, v: value, msg: t('leftovers.fields.cifFormat') };
  let odd = 0, even = 0;
  (match[2] ?? '').split('').forEach((digit, index) => {
    if (index % 2) odd += Number(digit); else { const doubled = 2 * Number(digit); even += Math.floor(doubled / 10) + doubled % 10; }
  });
  const control = (10 - (odd + even) % 10) % 10, letter = CIF_LETTERS[control];
  return match[3] === String(control) || match[3] === letter ? { ok: true, v: value } : { ok: false, v: value, msg: t('leftovers.fields.cifControl') };
}

/** Checks a DNI or NIE (a person) or a CIF (a company): `v` is the value written clean, `msg` what is wrong. */
export function checkDocument(raw: string | null | undefined, type: string): DocumentCheck {
  const value = (raw ?? '').toUpperCase().replace(/[\s-]/g, '');
  if (!value) return { ok: true, v: value };
  if (type === COMPANY) return checkCif(value);
  const number = /^[XYZ]\d{7}[A-Z]$/.test(value) ? String('XYZ'.indexOf(value[0] ?? '')) + value.slice(1) : value;
  if (!/^\d{8}[A-Z]$/.test(number)) return { ok: false, v: value, msg: t('leftovers.fields.dniFormat') };
  return DNI_LETTERS[Number(number.slice(0, 8)) % 23] === number[8] ? { ok: true, v: value } : { ok: false, v: value, msg: t('leftovers.fields.dniLetter') };
}

interface ValueData { dato_etiqueta?: string | null; dato_tipo?: string | null; dato_opciones?: string[] | null }

/** The extra «dato» of a classifier value (a quantity, a choice or a detail). */
export function valueDataField(value: ValueData, key: string, current?: string | null): string {
  const label = escapeHtml(orFallback(value.dato_etiqueta, t(value.dato_tipo === 'numero' ? 'leftovers.fields.quantity' : 'leftovers.fields.detail')));
  const written = escapeHtml(current ?? '');
  if (value.dato_tipo === 'numero') return `<label class="datol">${label}<input type="number" min="0" step="1" data-dato="${key}" value="${written}" placeholder="0"></label>`;
  if (value.dato_tipo === 'lista') {
    const options = (value.dato_opciones ?? []).map(option => `<option ${option === current ? 'selected' : ''}>${escapeHtml(option)}</option>`).join('');
    return `<label class="datol">${label}<select data-dato="${key}"><option value=""></option>${options}</select></label>`;
  }
  return `<label class="datol">${label}<input data-dato="${key}" value="${written}" placeholder="${t('leftovers.fields.optional')}"></label>`;
}

/** The email checked while typing: a green ✓ if valid, a red ✗ if not (and the error under it goes once it is right). */
export function liveEmailCheck(input: HTMLInputElement | null): void {
  if (!input || input.dataset.vemail) return;
  input.dataset.vemail = '1';
  const wrapper = wrap(input, 'emailw');
  wrapper.insertAdjacentHTML('beforeend', '<span class="emailico" aria-hidden="true"></span>');
  const update = (): void => {
    const value = input.value.trim(), ok = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(value);
    wrapper.classList.toggle('ok', Boolean(value) && ok); wrapper.classList.toggle('mal', Boolean(value) && !ok);
    const icon = wrapper.querySelector('.emailico'); if (icon) icon.textContent = !value ? '' : ok ? '✓' : '✗';
    const error = wrapper.nextElementSibling?.classList.contains('campoerr') ? wrapper.nextElementSibling : null;
    if (error && ok) { error.remove(); input.classList.remove('conerr'); }
  };
  input.addEventListener('input', update); update();
}

interface FieldDefinition { clave: string; tipo?: string | null; solo_lectura?: boolean | null; valores?: string[] | null; descripcion?: string | null }

function yesNo(attributes: string, value: unknown): string {
  return `<select ${attributes}><option value=""></option><option value="true" ${value === true ? 'selected' : ''}>${t('leftovers.fields.yes')}</option><option value="false" ${value === false ? 'selected' : ''}>${t('leftovers.fields.no')}</option></select>`;
}

/** The input of a custom field, by its type (list, yes/no, date, number or text). */
export function customFieldInput(field: FieldDefinition, current: unknown): string {
  const attributes = `data-cpk="${escapeHtml(field.clave)}" ${field.solo_lectura ? 'disabled' : ''}`;
  const value = current ?? '', text = String(value);
  if (field.tipo === 'lista') {
    const values = field.valores ?? [], all = text !== '' && !values.includes(text) ? [...values, text] : values;
    return `<select ${attributes}><option value=""></option>${all.map(item => `<option ${item === value ? 'selected' : ''}>${escapeHtml(item)}</option>`).join('')}</select>`;
  }
  if (field.tipo === 'si_no') return yesNo(attributes, value);
  if (field.tipo === 'fecha') return `<input type="date" ${attributes} value="${escapeHtml(text)}">`;
  if (field.tipo === 'numero') return `<input type="text" inputmode="decimal" ${attributes} value="${escapeHtml(String(value).replace('.', ','))}">`;
  return `<input ${attributes} value="${escapeHtml(text)}" maxlength="500" placeholder="${escapeHtml(field.descripcion ?? '')}">`;
}

/** A one-line note, remark or comment field becomes a three-line text area (searches excepted). */
export function wideNote(input: HTMLInputElement | null): void {
  if (!input || input.dataset.nota || input.type !== 'text') return;
  const label = input.id ? document.querySelector(`label[for="${input.id}"]`)?.textContent ?? '' : '';
  const text = `${input.id} ${input.placeholder} ${label}`.toLowerCase();
  if (!/\bnota|observac|comentario/.test(text) || text.includes('buscar')) return;
  const area = document.createElement('textarea');
  [...input.attributes].forEach(attribute => { if (attribute.name !== 'type' && attribute.name !== 'value') area.setAttribute(attribute.name, attribute.value); });
  area.value = input.value; area.rows = 3; area.dataset.nota = '1'; area.classList.add('notaamplia'); input.replaceWith(area);
  area.closest('.g2 > div, .g3 > div')?.classList.add('ocupatodo');
}

const HISTORY_FREE = 'input:not([autocomplete]):not([type=checkbox]):not([type=radio]):not([type=file]):not([type=hidden]), textarea:not([autocomplete])';

/** v2.109.0: the fields of windows and screens keep no browser history (it suggested the previous order's note…). */
export function withoutHistory(root: ParentNode | null): void {
  (root ?? document).querySelectorAll(HISTORY_FREE).forEach(field => { field.setAttribute('autocomplete', 'off'); });
}
