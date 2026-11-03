/**
 * Configuración → Clasificadores → one classifier: its values and its custom field options. Migrated from the legacy
 * abrirClasificadorBase and abrirClasificador (v2.415.0).
 * v2.464.0: each value is one compact row (D-044): its name and, under it, what it does in plain words («Pasa a: Presentado ·
 * Pide: Cuántas», «Cómo se cobra: A la entrega») and «Desactivado» when it is off. The whole row opens its editor (value-editor.ts),
 * where everything a value has is changed, also «Activo» and «Eliminar valor»: one single way in, with a chevron as its sign; «+ Nuevo valor» and «Eliminar clasificador» are in
 * the bar at the bottom of the window. The «i» of the title says what the list is for.
 * This file paints the list; classifier-actions.ts binds it and classifier-window.ts opens it.
 */
import { cardSectionsLegacy, legacyDb, term } from '../../../legacy/bridge';
import { settingsMoreLegacy, type ClassifierData, type ClassifierValue } from '../../../legacy/settings2-bridge';
import { t, type MessageKey } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { orFallback } from '../../../services/values';
import { dataText } from './value-data';
import { onlyInText, resultParts } from './result-states';
import { fixedRole, flagOf, isPaymentList, valueRoleKey, valueRoleText } from './value-roles';

export const RESULT = 'resultado_visita';
const CAN_EDIT_LEVEL = 2, FULL_LEVEL = 3, SEPARATOR = ' · ';

export interface Rights { canEdit: boolean; complete: boolean; asksData: boolean }

export function rightsOf(classifier: ClassifierData): Rights {
  const admin = cardSectionsLegacy.can('administrar'), level = settingsMoreLegacy.areaLevel('K');
  const canEdit = admin || level >= CAN_EDIT_LEVEL;
  return { canEdit, complete: admin || level >= FULL_LEVEL, asksData: canEdit && (classifier.ambito === 'visita' || classifier.papel === RESULT) };
}

type UsedIn = 'orders' | 'visits' | 'calls' | 'customers' | 'products';
/** Where a list is really used: by its role first (the stored scope of some lists says «medico»: «Forma de pago» is used in orders). */
const USED_BY_ROLE: Readonly<Record<string, UsedIn>> = {
  forma_pago: 'orders', resultado_visita: 'visits', material_visita: 'visits', motivo_llamada: 'calls', origen_oportunidad: 'calls', resultado_llamada: 'calls',
};
const USED_BY_SCOPE: Readonly<Record<string, UsedIn>> = { pedido: 'orders', visita: 'visits', llamada: 'calls', cliente: 'customers', producto: 'products' };
const USED_TEXT: Readonly<Record<UsedIn, MessageKey>> = {
  orders: 'settingsMore.classifier.inOrders', visits: 'settingsMore.classifier.inVisits', calls: 'settingsMore.classifier.inCalls',
  customers: 'settingsMore.classifier.inCustomers', products: 'settingsMore.classifier.inProducts',
};

function usedIn(classifier: ClassifierData): string {
  const where = USED_BY_ROLE[classifier.papel ?? ''] ?? USED_BY_SCOPE[classifier.ambito ?? ''];
  return where ? t(USED_TEXT[where]) : t('settingsMore.classifier.inCards', { professional: term('medico') });
}

/** What the list is for, where it is used and what its special values mean: the text of the «i» of the title. */
function helpText(classifier: ClassifierData, rights: Rights): string {
  const visit = { theVisit: term('visita', { article: 'el' }), aVisit: term('visita', { article: 'un' }) };
  const flag = flagOf(classifier), values = classifier.valores ?? [];
  const parts = [t('settingsMore.valueList.help', { used: usedIn(classifier) })];
  if (classifier.papel === RESULT) parts.push(t('settingsMore.valueList.helpResults', visit));
  else if (rights.asksData) parts.push(t('settingsMore.valueList.helpData', visit));
  if (isPaymentList(classifier)) parts.push(t('settingsMore.valueList.helpPayments'));
  if (flag === 'seguimiento') parts.push(t('settingsMore.valueList.helpFollowUp'));
  if (flag === 'llamada_nuestra') parts.push(t('settingsMore.valueList.helpOurCall'));
  if (values.some(value => fixedRole(classifier, value))) parts.push(t('settingsMore.valueList.helpFixed'));
  if (classifier.sistema) parts.push(t('settingsMore.valueList.helpSystem'));
  return parts.join('');
}

/** The line under the name: what the value does, in plain words. */
function summary(classifier: ClassifierData, value: ClassifierValue, rights: Rights): string {
  const parts = classifier.papel === RESULT ? resultParts(value) : [];
  if (classifier.papel === RESULT) parts.push(onlyInText(value));
  if (rights.asksData || classifier.papel === RESULT) parts.push(dataText(value));
  parts.push(valueRoleText(classifier, value));
  return parts.filter(Boolean).join(SEPARATOR);
}

/** One single way in: the whole row opens the editor (a button for the keyboard), with a chevron as its only sign. */
function valueHtml(classifier: ClassifierData, value: ClassifierValue, rights: Rights): string {
  const line = summary(classifier, value, rights), name = escapeHtml(value.valor);
  const off = value.activo ? '' : `<span class="pill p-anu">${t('settingsMore.valueList.inactive')}</span>`;
  const open = rights.canEdit ? ` role="button" tabindex="0" aria-label="${t('settingsMore.valueList.openOf', { name })}"` : '';
  const chevron = rights.canEdit ? `<span class="vchev" aria-hidden="true">${t('settingsMore.valueList.open')}</span>` : '';
  return `<div class="item vrow ${value.padre ? 'vsub' : ''} ${value.activo ? '' : 'off'} ${rights.canEdit ? '' : 'u-cursor-default'}" data-vval="${value.id}" data-role="${escapeHtml(valueRoleKey(classifier, value))}"${open}>
        <span class="tx"><b>${name}</b>${line ? `<span class="sm">${escapeHtml(line)}</span>` : ''}</span>${off}${chevron}
      </div>`;
}

function footHtml(classifier: ClassifierData, rights: Rights): string {
  const remove = rights.complete && !classifier.sistema ? `<button type="button" class="btn sec dang" id="cdel">${t('settingsMore.classifier.deleteClassifier')}</button>` : '';
  return `<div class="acts ${remove ? 'u-between' : 'u-end'}">${remove}<button type="button" class="btn" data-vnew>${t('settingsMore.valueList.newValue')}</button></div>`;
}

function listHidden(classifier: ClassifierData): boolean {
  return !classifier.papel && Boolean(settingsMoreLegacy.fieldTable(classifier.ambito)) && orFallback(classifier.tipo_campo, 'lista') !== 'lista';
}

export function classifierHtml(classifier: ClassifierData, rights: Rights): string {
  const values = classifier.valores ?? [], title = escapeHtml(classifier.nombre);
  return `
      <div class="fh"><div><h2>${title} <button type="button" class="ai" data-ayuda-tit="${t('settingsMore.valueList.helpTitle')}" data-ayuda-txt="${escapeHtml(helpText(classifier, rights))}" aria-label="${t('settingsMore.valueList.helpTitle')}">i</button></h2>
        <div class="sm">${t('settingsMore.classifier.group', { group: escapeHtml(orFallback(classifier.grupo, t('settingsMore.classifier.general'))), used: escapeHtml(usedIn(classifier)) })}
        ${rights.canEdit ? '' : t('settingsMore.classifier.readOnly')}</div></div>
        <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
      ${settingsMoreLegacy.fieldBox(classifier, rights.complete)}
      <div class="lista vlist ${listHidden(classifier) ? 'hide' : ''}">${values.map(value => valueHtml(classifier, value, rights)).join('') || `<div class="vacio">${t('settingsMore.classifier.noValues')}</div>`}</div>
      ${rights.canEdit ? footHtml(classifier, rights) : ''}`;
}

/** Reads every catalog again and refreshes this classifier from it (the list keeps the legacy CATS). */
export async function reloadClassifier(classifier: ClassifierData): Promise<void> {
  const { data } = await legacyDb().rpc<ClassifierData[]>('catalogos_todos');
  settingsMoreLegacy.setClassifiers(data ?? []);
  Object.assign(classifier, settingsMoreLegacy.classifiers().find(item => item.id === classifier.id) ?? classifier);
}
