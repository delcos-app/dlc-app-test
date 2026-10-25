/**
 * Custom fields in the forms (account, customer, order, product): the block of inputs, reading it, saving it and inserting it in a
 * form already painted. Migrated from the legacy cargarCampos, camposHTML, camposLeer, camposGuardar and camposInsertar (v2.415.0).
 */
import { legacyDb, notices } from '../../../legacy/bridge';
import { settingsLegacy } from '../../../legacy/settings1-bridge';
import { t, type MessageKey } from '../../../i18n';
import { escapeHtml } from '../../../services/format';

/** What a form says: its area, the values by key and the required fields left empty. */
export interface ReadFields { amb: string; valores: Record<string, string>; falta: string[] }

const definitions = (area: string): CustomField[] => settingsLegacy.fields()[area] ?? [];

/** Reloads the field definitions of every area. */
export async function loadCustomFields(): Promise<void> {
  const fields = settingsLegacy.fields(), areas = Object.keys(fields);
  const results = await Promise.all(areas.map(area => legacyDb().rpc<CustomField[]>('campos_de', { p_ambito: area })));
  areas.forEach((area, index) => { const result = results[index]; if (result && !result.error) fields[area] = result.data ?? []; });
}

/** The block of inputs of `area` with the current `values` ('' if the area has no fields shown in the card). */
export function customFieldsHtml(area: string, values: Record<string, unknown> | null | undefined): string {
  const list = definitions(area).filter(field => field.en_ficha);
  if (!list.length) return '';
  return `<div class="cpersform" data-cpamb="${area}"><h3>${t('settings.customFields.title')}</h3><div class="g2">${list.map(field =>
    `<div><label>${escapeHtml(field.nombre)}${field.obligatorio ? ' <span class="cpob">*</span>' : ''}</label>${settingsLegacy.fieldInput(field, values?.[field.clave])}</div>`).join('')}</div></div>`;
}

/** Reads the block of a form: null if it has none; `falta` lists the required ones left empty. */
export function readCustomFields(root: Element | null | undefined): ReadFields | null {
  const block = root?.querySelector<HTMLElement>('.cpersform'); if (!block) return null;
  const area = block.dataset.cpamb ?? '', values: Record<string, string> = {}, missing: string[] = [];
  block.querySelectorAll<HTMLInputElement>('[data-cpk]:not([disabled])').forEach(input => {
    const key = input.dataset.cpk ?? '', field = definitions(area).find(item => item.clave === key);
    values[key] = input.value.trim();
    if (field?.obligatorio && !input.value.trim()) missing.push(field.nombre);
  });
  return { amb: area, valores: values, falta: missing };
}

const PROBLEMS = new Map<string, MessageKey>([
  ['obligatorio', 'settings.customFields.problems.obligatorio'], ['numero', 'settings.customFields.problems.numero'],
  ['fecha', 'settings.customFields.problems.fecha'], ['lista', 'settings.customFields.problems.lista'], ['si_no', 'settings.customFields.problems.siNo'],
  ['solo_lectura', 'settings.customFields.problems.soloLectura'], ['desconocido', 'settings.customFields.problems.desconocido'],
]);

function failureText(area: string, failure: { campo: string; error: string } | undefined): string {
  if (!failure) return t('settings.customFields.couldNotSave');
  const field = definitions(area).find(item => item.clave === failure.campo), problem = PROBLEMS.get(failure.error);
  return t('settings.customFields.check', { field: field ? field.nombre : failure.campo, problem: problem ? t(problem) : failure.error });
}

/** Saves what was read for record `id`; false (with a notice) if the database refuses a value. */
export async function saveCustomFields(read: ReadFields | null, id: string | null | undefined): Promise<boolean> {
  if (!read || !id || !Object.keys(read.valores).length) return true;
  const { data, error } = await legacyDb().rpc<{ ok?: boolean; errores?: { campo: string; error: string }[] }>('guardar_campos', { p_ambito: read.amb, p_id: id, p_valores: read.valores });
  if (!error && data?.ok) return true;
  notices.toast(failureText(read.amb, (data?.errores ?? [])[0]), true);
  return false;
}

/** Inserts the block in a form already painted (before `before`, or at the end), with the current values of record `id`. */
export async function insertCustomFields(root: Element | null, area: string, id: string | null, before?: Element | null): Promise<void> {
  if (!root || !definitions(area).some(field => field.en_ficha) || root.querySelector('.cpersform')) return;
  let values: Record<string, unknown> = {};
  const table = settingsLegacy.fieldTable(area);
  if (id && table) {
    const { data } = await legacyDb().from<{ clasificadores?: Record<string, unknown> | null }>(table).select('clasificadores').eq('id', id).maybeSingle();
    values = data?.clasificadores ?? {};
  }
  if (root.querySelector('.cpersform') || !root.isConnected) return;
  if (before?.isConnected) before.insertAdjacentHTML('beforebegin', customFieldsHtml(area, values));
  else root.insertAdjacentHTML('beforeend', customFieldsHtml(area, values));
}
