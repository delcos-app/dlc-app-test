/**
 * Configuración → Clasificadores → one list → «Editar» or «+ Nuevo valor» (v2.464.0): everything a value has in one form, painted in
 * the same window as the list (same edges, «Cancelar» goes back to it). Name, category, kind of result, destination state, «Solo en
 * estos estados», the data it asks and its role, each field with its label and a line of help. Saving calls the same functions as the
 * buttons of each row did before: guardar_valor (name, destination, states, data) and guardar_papel_valor (role).
 */
import { legacyDb, notices, term } from '../../../legacy/bridge';
import type { ClassifierData, ClassifierValue } from '../../../legacy/settings2-bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { RESULT, type Rights } from './classifier';
import { bindDataField, chosenData, dataFieldHtml } from './value-data';
import { bindStatesField, chosenStatesChange, destinationFieldHtml, statesFieldHtml } from './result-states';
import { bindRoleField, chosenRole, roleFieldHtml, saveNewValueRole, saveRole } from './value-roles';

const help = (text: string): string => `<span class="sm vhelp">${text}</span>`;
const valueOf = (id: string): string => (document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null)?.value ?? '';

function headHtml(classifier: ClassifierData, title: string): string {
  return `<div class="fh"><div><h2>${title}</h2><div class="sm">${t('settingsMore.valueEditor.in', { list: escapeHtml(classifier.nombre) })}</div></div>
    <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>`;
}

const nameField = (id: string, name: string): string =>
  `<div class="vfield"><label for="${id}">${t('settingsMore.valueEditor.name')}</label><input id="${id}" value="${escapeHtml(name)}" autocomplete="off">${help(t('settingsMore.valueEditor.nameHelp'))}</div>`;

/** The bar at the bottom: «Eliminar valor» (a red link, only with full rights) on the left, «Cancelar» and the main one on the right. */
function footHtml(okId: string, okText: string, removeId = ''): string {
  const buttons = `<button type="button" class="btn sec" data-vback>${t('common.cancel')}</button><button type="button" class="btn" id="${okId}">${okText}</button>`;
  if (!removeId) return `<div class="acts u-end">${buttons}</div>`;
  return `<div class="acts u-between"><button type="button" class="lnk u-danger" data-vdel="${removeId}">${t('settingsMore.valueEditor.deleteValue')}</button><span class="u-flex u-gap-8">${buttons}</span></div>`;
}

/** «Activo»: a switch, saved with «Guardar». */
const activeField = (value: ClassifierValue): string =>
  `<div class="vfield"><label class="vfswitch u-mt-12"><input type="checkbox" role="switch" id="veactive" ${value.activo ? 'checked' : ''}><span class="sw"></span><b>${t('settingsMore.valueEditor.active')}</b></label>${help(t('settingsMore.valueEditor.activeHelp'))}</div>`;

/** The form of an existing value. */
export function editorHtml(classifier: ClassifierData, value: ClassifierValue, rights: Rights): string {
  const result = classifier.papel === RESULT;
  return `${headHtml(classifier, t('settingsMore.valueEditor.editTitle'))}<div class="vform">
    ${nameField('vename', value.valor)}
    ${activeField(value)}
    ${roleFieldHtml(classifier, value)}
    ${result ? destinationFieldHtml('vedest', value.destino) : ''}
    ${result ? statesFieldHtml(value) : ''}
    ${rights.asksData ? dataFieldHtml(value) : ''}</div>
    ${footHtml('veok', t('common.save'), rights.complete ? value.id : '')}`;
}

function parentField(classifier: ClassifierData): string {
  const values = classifier.valores ?? [];
  if (!values.some(value => value.padre)) return '';
  return `<div class="vfield"><label for="cvpadre">${t('settingsMore.valueEditor.parent')}</label><select id="cvpadre"><option value="">${t('settingsMore.classifier.noCategory')}</option>${values.filter(value => !value.padre).map(value => `<option value="${escapeHtml(value.valor)}">${t('settingsMore.classifier.inside', { name: escapeHtml(value.valor) })}</option>`).join('')}</select>${help(t('settingsMore.valueEditor.parentHelp'))}</div>`;
}

function kindField(): string {
  const done = term('visita', { adjective: 'realizado' });
  return `<div class="vfield"><label for="cvextra">${t('settingsMore.valueEditor.kind')}</label><select id="cvextra"><option value="pos">${term('visita', { capital: 'C', adjective: 'realizado' })}</option><option value="neg">${t('settingsMore.classifier.withoutVisitCap', { visit: term('visita') })}</option></select>${help(t('settingsMore.valueEditor.kindHelp', { visitDone: done }))}</div>`;
}

/** The form of a new value: the same data the list asked for before (name, category, kind and destination of a result, payment kind). */
export function newValueHtml(classifier: ClassifierData): string {
  const result = classifier.papel === RESULT;
  return `${headHtml(classifier, t('settingsMore.valueEditor.newTitle'))}<div class="vform">
    ${nameField('cvnew', '')}
    ${parentField(classifier)}
    ${result ? kindField() + destinationFieldHtml('cvdest', null) : ''}
    ${roleFieldHtml(classifier, null)}</div>
    ${footHtml('cvadd', t('settingsMore.valueEditor.add'))}`;
}

/** Binds the fields of either form. */
export function bindEditor(): void {
  bindDataField(); bindStatesField(); bindRoleField();
  const name = document.getElementById('vename') ?? document.getElementById('cvnew');
  name?.focus({ preventScroll: true });
}

/** What changed for guardar_valor (name, destination, states, data), null if nothing, false if the form is not valid. */
function changes(value: ClassifierValue): Record<string, unknown> | null | false {
  const name = valueOf('vename').trim();
  if (!name) { notices.toast(t('settingsMore.valueEditor.nameMissing'), true); return false; }
  const data = chosenData(value); if (data === false) return false;
  const change: Record<string, unknown> = { ...data };
  if (name !== value.valor) change.valor = name;
  Object.assign(change, stateChanges(value));
  return Object.keys(change).length ? change : null;
}

/** «Activo», the destination and the states, when they changed. */
function stateChanges(value: ClassifierValue): Record<string, unknown> {
  const change: Record<string, unknown> = {}, active = document.getElementById('veactive') as HTMLInputElement | null;
  if (active && active.checked !== Boolean(value.activo)) change.activo = active.checked;
  if (document.getElementById('vedest') && valueOf('vedest') !== (value.destino ?? '')) change.destino = valueOf('vedest');
  const states = chosenStatesChange(value); if (states) change.en_estados = states;
  return change;
}

/** Saves an existing value; true when it is saved (or nothing changed). */
export async function saveValue(value: ClassifierValue): Promise<boolean> {
  const change = changes(value); if (change === false) return false;
  const role = chosenRole(value);
  if (change) {
    const { data: result, error } = await legacyDb().rpc<{ ok?: boolean }>('guardar_valor', { p: { id: value.id, ...change } });
    if (error || result?.ok === false) { notices.toast(t('settingsMore.couldNotSave'), true); return false; }
  }
  if (role !== undefined && !await saveRole(value.id, role)) { notices.toast(t('settingsMore.valueRoles.notSaved'), true); return false; }
  if (change || role !== undefined) notices.toast(t('settingsMore.valueEditor.saved'));
  return true;
}

function newValue(classifier: ClassifierData, text: string): Record<string, unknown> {
  const parent = valueOf('cvpadre'), extra = document.getElementById('cvextra') ? valueOf('cvextra') : null, destination = document.getElementById('cvdest') ? valueOf('cvdest') : null;
  const value: Record<string, unknown> = { clasificador_id: classifier.id, valor: text, extra, destino: destination };
  if (parent) { value.padre = parent; value.valor = text.startsWith(`${parent} · `) ? text : `${parent} · ${text}`; }
  return value;
}

/** Adds the new value (with its payment kind); true when it is added. */
export async function addValue(classifier: ClassifierData): Promise<boolean> {
  const text = valueOf('cvnew').trim();
  if (!text) { notices.toast(t('settingsMore.valueEditor.nameMissing'), true); return false; }
  const { data, error } = await legacyDb().rpc<{ id?: string }>('guardar_valor', { p: newValue(classifier, text) });
  if (error) { notices.toast(t('settingsMore.classifier.couldNotAdd'), true); return false; }
  await saveNewValueRole(data?.id);
  notices.toast(t('settingsMore.classifier.added'));
  return true;
}

