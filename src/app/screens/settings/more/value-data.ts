/**
 * «+ Dato» of a visit value: when it is marked in a visit, it also asks for a number, a free text or an option of a list. Opens in
 * the second window over the classifier. Migrated from the legacy editorDato (v2.415.0).
 */
import { legacyDb, notices, term } from '../../../legacy/bridge';
import { type ClassifierValue } from '../../../legacy/settings2-bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';

const LIST = 'lista';

const field = (id: string): HTMLElement | null => document.getElementById(id);
const valueOf = (id: string): string => (document.getElementById(id) as HTMLInputElement | null)?.value ?? '';
const dialog = (): HTMLDialogElement | null => document.getElementById('dlg2') as HTMLDialogElement | null;

function editorHtml(value: ClassifierValue): string {
  const type = value.dato_tipo;
  return `
    <div class="fh"><div><h2>${t('settingsMore.valueData.title', { name: escapeHtml(value.valor) })}</h2>
      <div class="sm">${t('settingsMore.valueData.subtitle', { aVisit: term('visita', { article: 'un' }) })}</div></div>
      <button class="x" data-cerrar2 aria-label="${t('common.close')}">✕</button></div>
    <label for="dtt">${t('settingsMore.valueData.kind')}</label>
    <select id="dtt"><option value="">${t('settingsMore.valueData.none')}</option>
      <option value="numero" ${type === 'numero' ? 'selected' : ''}>${t('settingsMore.valueData.number')}</option>
      <option value="texto" ${type === 'texto' ? 'selected' : ''}>${t('settingsMore.valueData.text')}</option>
      <option value="lista" ${type === LIST ? 'selected' : ''}>${t('settingsMore.valueData.list')}</option></select>
    <div id="dtcfg">
      <label for="dte">${t('settingsMore.valueData.label')}</label><input id="dte" value="${escapeHtml(value.dato_etiqueta ?? '')}" placeholder="${t('settingsMore.valueData.labelPlaceholder')}">
      <div id="dtlw"><label for="dtl">${t('settingsMore.valueData.options')} <span class="sm">${t('settingsMore.valueData.onePerLine')}</span></label>
        <textarea id="dtl" rows="4">${escapeHtml((value.dato_opciones ?? []).join('\n'))}</textarea></div>
    </div>
    <div class="acts u-end"><button class="btn sec" data-cerrar2>${t('common.cancel')}</button><button class="btn" id="dtok">${t('common.save')}</button></div>`;
}

function showParts(): void {
  const type = valueOf('dtt');
  field('dtcfg')?.classList.toggle('hide', !type); field('dtlw')?.classList.toggle('hide', type !== LIST);
}

async function save(value: ClassifierValue, onSave: () => void): Promise<void> {
  const type = valueOf('dtt'), options = valueOf('dtl').split('\n').map(line => line.trim()).filter(Boolean);
  if (type === LIST && !options.length) { notices.toast(t('settingsMore.valueData.writeOne'), true); return; }
  const data = { id: value.id, dato_tipo: type, dato_etiqueta: type ? valueOf('dte').trim() : '', dato_opciones: type === LIST ? options : [] };
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean }>('guardar_valor', { p: data });
  if (error || result?.ok === false) { notices.toast(t('settingsMore.couldNotSave'), true); return; }
  dialog()?.close(); notices.toast(t('settingsMore.valueData.saved')); onSave();
}

/** Opens the data editor of a value; `onSave` runs after saving. */
export function editValueData(value: ClassifierValue, onSave: () => void): void {
  const body = field('dlg2body'); if (!body) return;
  body.innerHTML = editorHtml(value);
  const type = field('dtt'); if (type) type.onchange = showParts;
  showParts();
  const ok = field('dtok'); if (ok) ok.onclick = (): void => { void save(value, onSave); };
  dialog()?.showModal();
}
