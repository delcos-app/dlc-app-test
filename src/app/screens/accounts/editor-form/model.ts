/**
 * What the account editor shares: how a new account is called, the private consultation (a consultation without a centre),
 * the opening hours text, the grouped options of a catalogue and the hidden fields of a consultation. Migrated from the legacy
 * fichaNueva, consultaPrivada, esConsultaPrivada, txtHorario, optsGrupos and cpCampo (v2.419.0).
 */
import { term } from '../../../legacy/bridge';
import { accountsEditorLegacy } from '../../../legacy/accounts2-bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';

export interface CentreData {
  id?: string | null; nombre?: string | null; direccion?: string | null; cp?: string | null; municipio?: string | null; provincia?: string | null;
  telefono?: string | null; lat?: number | string | null; lon?: number | string | null; horario?: Record<string, string> | null; privada?: boolean;
  metros?: number | null; medicos?: number | null;
}

const WEEK = 'LMXJVSD';

/** «Profesional» / «Nueva cuenta»: the company word for an account, or «cuenta» if it did not change it. */
export function newAccountNames(): { nombre: string; nueva: string } {
  if (accountsEditorLegacy.hasOwnTerm()) return { nombre: term('medico', { capital: 'C' }), nueva: term('medico', { article: 'nuevo', articleCapital: 'C' }) };
  return { nombre: t('accountsEditor.account'), nueva: t('accountsEditor.newAccount') };
}

/** «Consulta privada» in the company vocabulary ('C' capitalised, 'U' upper case first, 'l' lower case). */
export const privateConsultation = (capital: 'C' | 'l' | 'U' = 'C'): string =>
  (capital === 'U' ? term('consulta', { capital: 'C', adjective: 'privado' }).toUpperCase() : term('consulta', { capital, adjective: 'privado' }));

/** Name stored for a private consultation: a database value, fixed (never from the language files); it is recognised by it. */
export const PRIVATE_SAVED_NAME = 'CONSULTA PRIVADA';

/** A consultation without a centre whose name starts like «Consulta privada» (with any vocabulary word). */
export function isPrivateConsultation(centre: CentreData | null | undefined): boolean {
  if (centre?.id) return false;
  const name = String(centre?.nombre ?? '').trim().toLowerCase();
  return /^(consulta|ubicaci[oó]n) privad[ao]/.test(name) || name.startsWith(privateConsultation('l').toLowerCase());
}

/** «L–V 8:00-20:00 · S 9:00-14:00 · D Cerrado»: following days with the same hours are grouped. */
export function hoursText(hours: Record<string, string> | null | undefined): string {
  const days = WEEK.split('').filter(day => hours?.[day]);
  const groups: { first: string; last: string; value: string }[] = [];
  days.forEach(day => {
    const value = hours?.[day] ?? '', last = groups[groups.length - 1];
    if (last?.value === value && WEEK.indexOf(day) === WEEK.indexOf(last.last) + 1) last.last = day;
    else groups.push({ first: day, last: day, value });
  });
  return groups.map(group => `${group.first === group.last ? group.first : `${group.first}–${group.last}`} ${group.value}`).join(' · ');
}

const optionHtml = (value: string, chosen: string | null | undefined): string =>
  `<option value="${escapeHtml(value)}" ${chosen === value ? 'selected' : ''}>${escapeHtml(value)}</option>`;

/** The options of a catalogue with categories (Traumatología › Columna): the values of each category in its group. */
export function groupedOptions(list: readonly { valor: string; padre?: string | null }[], chosen: string | null | undefined): string {
  const children = new Map<string, string[]>();
  list.forEach(item => { if (item.padre) children.set(item.padre, [...(children.get(item.padre) ?? []), item.valor]); });
  const group = (label: string, values: readonly string[]): string => `<optgroup label="${escapeHtml(label)}">${values.map(value => optionHtml(value, chosen)).join('')}</optgroup>`;
  let html = '<option value=""></option>';
  if (chosen && !list.some(item => item.valor === chosen)) html += `<option selected>${escapeHtml(chosen)}</option>`;
  list.filter(item => !item.padre).forEach(item => {
    const own = children.get(item.valor);
    html += own ? group(item.valor, [item.valor, ...own]) : optionHtml(item.valor, chosen);
  });
  // Values whose category is no longer in the list
  [...children.keys()].filter(parent => !list.some(item => !item.padre && item.valor === parent)).forEach(parent => { html += group(parent, children.get(parent) ?? []); });
  return html;
}

/** The options of a catalogue: grouped if it has categories, else a plain list (the chosen value marked). */
export function catalogOptions(name: string, chosen: string | null | undefined): string {
  const list = accountsEditorLegacy.catalog(name);
  if (list.some(item => item.padre)) return groupedOptions(list, chosen);
  return '<option value=""></option>' + list.map(item => `<option ${chosen === item.valor ? 'selected' : ''}>${escapeHtml(item.valor)}</option>`).join('');
}

/** A hidden or visible field of consultation `index` (data-cf="index|name"). */
export const consultationField = (box: Element, index: string, name: string): HTMLInputElement | null =>
  box.querySelector<HTMLInputElement>(`[data-cf="${index}|${name}"]`);

export const fieldValue = (box: Element, index: string, name: string): string => consultationField(box, index, name)?.value ?? '';

/** The dialog with unsaved changes (it asks before closing). */
export function markDirty(element: Element): void {
  const dialog = element.closest('dialog'); if (dialog) dialog.dataset.sucio = '1';
}
