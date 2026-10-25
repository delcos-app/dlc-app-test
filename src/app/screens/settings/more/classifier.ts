/**
 * Configuración → Clasificadores → one classifier: its values (rename, activate, delete, the state a visit result moves the card to,
 * the data a visit value asks for) and its custom field options. Migrated from the legacy abrirClasificadorBase and
 * abrirClasificador (v2.415.0): the «+ Dato» buttons are painted with the list instead of being added by a MutationObserver.
 * This file paints it; classifier-actions.ts binds its buttons and classifier-window.ts opens it.
 */
import { cardBaseLegacy, cardSectionsLegacy, legacyDb, term } from '../../../legacy/bridge';
import { settingsMoreLegacy, type ClassifierData, type ClassifierValue } from '../../../legacy/settings2-bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { orFallback } from '../../../services/values';

const RESULT = 'resultado_visita', CAN_EDIT_LEVEL = 2, FULL_LEVEL = 3;

export interface Rights { canEdit: boolean; complete: boolean; asksData: boolean }

export function rightsOf(classifier: ClassifierData): Rights {
  const admin = cardSectionsLegacy.can('administrar'), level = settingsMoreLegacy.areaLevel('K');
  const canEdit = admin || level >= CAN_EDIT_LEVEL;
  return { canEdit, complete: admin || level >= FULL_LEVEL, asksData: canEdit && (classifier.ambito === 'visita' || classifier.papel === RESULT) };
}

function usedIn(classifier: ClassifierData): string {
  if (classifier.ambito === 'pedido') return t('settingsMore.classifier.inOrders');
  if (classifier.ambito === 'visita') return t('settingsMore.classifier.inVisits');
  return t('settingsMore.classifier.inCards', { professional: term('medico') });
}

const stateOptions = (selected: string | null | undefined): string =>
  cardBaseLegacy.states().map(state => `<option value="${escapeHtml(state)}" ${selected === state ? 'selected' : ''}>${t('settingsMore.classifier.movesTo', { state: escapeHtml(state) })}</option>`).join('');

function resultText(value: ClassifierValue): string {
  if (!value.extra) return '';
  const kind = value.extra === 'neg' ? t('settingsMore.classifier.withoutVisit', { visit: term('visita') }) : term('visita', { adjective: 'realizado' });
  return `<span class="sm">${kind}${value.destino ? t('settingsMore.classifier.movesToShort', { state: escapeHtml(value.destino) }) : ''}</span>`;
}

function dataText(value: ClassifierValue): string {
  if (!value.dato_tipo) return '';
  const options = value.dato_tipo === 'lista' ? t('settingsMore.classifier.options', { count: (value.dato_opciones ?? []).length }) : '';
  return `<span class="sm">${t('settingsMore.classifier.asks', { data: escapeHtml(orFallback(value.dato_etiqueta, value.dato_tipo)) })}${options}</span>`;
}

function valueActions(classifier: ClassifierData, value: ClassifierValue, rights: Rights): string {
  if (!rights.canEdit) return '';
  const data = rights.asksData ? `<button class="btn sec" data-vdato="${value.id}">${t(value.dato_tipo ? 'settingsMore.classifier.changeData' : 'settingsMore.classifier.addData')}</button>` : '';
  const destination = classifier.papel === RESULT
    ? `<select data-vdest="${value.id}" title="${t('settingsMore.classifier.destinationTitle')}" style="max-width:170px"><option value="">${t('settingsMore.classifier.keepsState')}</option>${stateOptions(value.destino)}</select>` : '';
  return `<span class="acts u-m-0">${data}
          <button class="btn sec" data-vren="${value.id}|${escapeHtml(value.valor)}">${t('settingsMore.classifier.rename')}</button>
          ${destination}
          <button class="btn sec" data-vtog="${value.id}|${value.activo ? 0 : 1}">${t(value.activo ? 'settingsMore.classifier.deactivate' : 'settingsMore.classifier.activate')}</button>
          ${rights.complete ? `<button class="btn sec dang" data-vdel="${value.id}">${t('settingsMore.classifier.delete')}</button>` : ''}</span>`;
}

function valueHtml(classifier: ClassifierData, value: ClassifierValue, rights: Rights): string {
  return `<div class="item ${value.padre ? 'vsub' : ''} u-cursor-default">
        <span class="ic">${value.activo ? '●' : '○'}</span>
        <span class="tx"><b style="${value.activo ? '' : 'opacity:.5;text-decoration:line-through'}">${escapeHtml(value.valor)}</b>
          ${resultText(value)}${rights.asksData ? dataText(value) : ''}</span>
        ${valueActions(classifier, value, rights)}
      </div>`;
}

function addHtml(classifier: ClassifierData): string {
  const values = classifier.valores ?? [];
  const result = classifier.papel === RESULT ? `<select id="cvextra" style="max-width:170px"><option value="pos">${term('visita', { capital: 'C', adjective: 'realizado' })}</option><option value="neg">${t('settingsMore.classifier.withoutVisitCap', { visit: term('visita') })}</option></select>
          <select id="cvdest" style="max-width:190px" title="${t('settingsMore.classifier.destinationTitle')}"><option value="">${t('settingsMore.classifier.keepsState')}</option>${stateOptions(null)}</select>` : '';
  const parent = values.some(value => value.padre) ? `<select id="cvpadre" style="max-width:210px" title="${t('settingsMore.classifier.categoryTitle')}"><option value="">${t('settingsMore.classifier.noCategory')}</option>${values.filter(value => !value.padre).map(value => `<option value="${escapeHtml(value.valor)}">${t('settingsMore.classifier.inside', { name: escapeHtml(value.valor) })}</option>`).join('')}</select>` : '';
  return `<div class="acts"><input id="cvnew" placeholder="${t('settingsMore.classifier.newValue')}" style="flex:1;min-width:160px">
        ${result}
        ${parent}
        <button class="btn" id="cvadd">${t('settingsMore.classifier.add')}</button></div>`;
}

function listHidden(classifier: ClassifierData): boolean {
  return !classifier.papel && Boolean(settingsMoreLegacy.fieldTable(classifier.ambito)) && orFallback(classifier.tipo_campo, 'lista') !== 'lista';
}

export function classifierHtml(classifier: ClassifierData, rights: Rights): string {
  const values = classifier.valores ?? [];
  return `
      <div class="fh"><div><h2>${escapeHtml(classifier.nombre)}</h2>
        <div class="sm">${t('settingsMore.classifier.group', { group: escapeHtml(orFallback(classifier.grupo, t('settingsMore.classifier.general'))), used: escapeHtml(usedIn(classifier)) })}
        ${rights.canEdit ? '' : t('settingsMore.classifier.readOnly')}</div></div>
        <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>${rights.asksData ? `<p class="sm datoinfo">${t('settingsMore.classifier.dataHint', { aVisit: term('visita', { article: 'un' }) })}</p>` : ''}
      ${settingsMoreLegacy.fieldBox(classifier, rights.complete)}
      <div class="lista ${listHidden(classifier) ? 'hide' : ''}">${values.map(value => valueHtml(classifier, value, rights)).join('') || `<div class="vacio">${t('settingsMore.classifier.noValues')}</div>`}</div>
      ${rights.canEdit ? addHtml(classifier) : ''}
      ${rights.complete && !classifier.sistema ? `<div class="acts" style="justify-content:flex-end;border-top:1px solid var(--line);padding-top:12px">
        <button class="btn sec dang" id="cdel">${t('settingsMore.classifier.deleteClassifier')}</button></div>` : ''}`;
}

/** Reads every catalog again and refreshes this classifier from it (the list keeps the legacy CATS). */
export async function reloadClassifier(classifier: ClassifierData): Promise<void> {
  const { data } = await legacyDb().rpc<ClassifierData[]>('catalogos_todos');
  settingsMoreLegacy.setClassifiers(data ?? []);
  Object.assign(classifier, settingsMoreLegacy.classifiers().find(item => item.id === classifier.id) ?? classifier);
}
