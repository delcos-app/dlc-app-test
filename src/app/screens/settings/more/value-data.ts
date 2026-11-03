/**
 * «Dato que pide» of a visit value: when it is marked in a visit, it also asks for a number, a free text or an option of a list.
 * A field of the value editor (value-editor.ts) since v2.464.0; before, its own window («+ Dato»). Migrated from the legacy
 * editorDato (v2.415.0).
 */
import { notices, term } from '../../../legacy/bridge';
import { type ClassifierValue } from '../../../legacy/settings2-bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { orFallback } from '../../../services/values';

const LIST = 'lista';

const field = (id: string): HTMLElement | null => document.getElementById(id);
const valueOf = (id: string): string => (document.getElementById(id) as HTMLInputElement | null)?.value ?? '';

/** «Pide: Cuántas (3 opciones)» for the row, or ''. */
export function dataText(value: ClassifierValue): string {
  if (!value.dato_tipo) return '';
  const options = value.dato_tipo === LIST ? t('settingsMore.classifier.options', { count: (value.dato_opciones ?? []).length }) : '';
  return t('settingsMore.classifier.asks', { data: orFallback(value.dato_etiqueta, value.dato_tipo) }) + options;
}

/** The data field of the editor: what it asks, its name and, for a list, its options. */
export function dataFieldHtml(value: ClassifierValue): string {
  const type = value.dato_tipo;
  return `<div class="vfield"><label for="dtt">${t('settingsMore.valueEditor.data')}</label>
    <select id="dtt"><option value="">${t('settingsMore.valueData.none')}</option>
      <option value="numero" ${type === 'numero' ? 'selected' : ''}>${t('settingsMore.valueData.number')}</option>
      <option value="texto" ${type === 'texto' ? 'selected' : ''}>${t('settingsMore.valueData.text')}</option>
      <option value="lista" ${type === LIST ? 'selected' : ''}>${t('settingsMore.valueData.list')}</option></select>
    <span class="sm vhelp">${t('settingsMore.valueEditor.dataHelp', { aVisit: term('visita', { article: 'un' }) })}</span>
    <div id="dtcfg">
      <label for="dte">${t('settingsMore.valueData.label')}</label><input id="dte" value="${escapeHtml(value.dato_etiqueta ?? '')}" placeholder="${t('settingsMore.valueData.labelPlaceholder')}">
      <div id="dtlw"><label for="dtl">${t('settingsMore.valueData.options')} <span class="sm">${t('settingsMore.valueData.onePerLine')}</span></label>
        <textarea id="dtl" rows="4">${escapeHtml((value.dato_opciones ?? []).join('\n'))}</textarea></div>
    </div></div>`;
}

function showParts(): void {
  const type = valueOf('dtt');
  field('dtcfg')?.classList.toggle('hide', !type); field('dtlw')?.classList.toggle('hide', type !== LIST);
}

/** Shows the parts the chosen kind needs, and again on every change. */
export function bindDataField(): void {
  const type = field('dtt'); if (!type) return;
  type.onchange = showParts; showParts();
}

const sameList = (one: readonly string[], other: readonly string[]): boolean => one.length === other.length && one.every((item, index) => item === other[index]);

/** The data the value has now, as the field gives it. */
function savedData(value: ClassifierValue): { dato_tipo: string; dato_etiqueta: string; dato_opciones: readonly string[] } {
  const type = value.dato_tipo ?? '';
  return { dato_tipo: type, dato_etiqueta: type ? value.dato_etiqueta ?? '' : '', dato_opciones: type === LIST ? value.dato_opciones ?? [] : [] };
}

/**
 * What changed in the data field, as guardar_valor takes it (null: nothing changed or no field; false: a list without options,
 * already told to the user).
 */
export function chosenData(value: ClassifierValue): Record<string, unknown> | null | false {
  if (!field('dtt')) return null;
  const type = valueOf('dtt'), options = valueOf('dtl').split('\n').map(line => line.trim()).filter(Boolean);
  if (type === LIST && !options.length) { notices.toast(t('settingsMore.valueData.writeOne'), true); return false; }
  const data = { dato_tipo: type, dato_etiqueta: type ? valueOf('dte').trim() : '', dato_opciones: type === LIST ? options : [] };
  const saved = savedData(value);
  const same = data.dato_tipo === saved.dato_tipo && data.dato_etiqueta === saved.dato_etiqueta && sameList(data.dato_opciones, saved.dato_opciones);
  return same ? null : data;
}
