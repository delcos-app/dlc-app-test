/** The window «Nuevo clasificador»: name, group, where it is used, description and its values. Migrated from the legacy nuevoClasificador (v2.415.0). */
import { legacyDb, notices, term } from '../../../legacy/bridge';
import { settingsLegacy } from '../../../legacy/settings1-bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { orFallback } from '../../../services/values';

const value = (id: string): string => (document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null)?.value ?? '';

function groups(): string[] {
  const own = settingsLegacy.classifiers().map(classifier => orFallback(classifier.grupo, t('settings.classifiers.general')));
  return [...new Set([...own, term('medico', { number: 'p', capital: 'C' }), term('visita', { number: 'p', capital: 'C' }), t('settings.classifiers.sales'), t('settings.classifiers.general')])];
}

function areasHtml(): string {
  return `<option value="medico">${t('settings.newClassifier.onAccount', { ofTheProfessional: term('medico', { article: 'del' }) })}</option>
          <option value="visita">${t('settings.newClassifier.onVisit', { aVisit: term('visita', { article: 'un' }) })}</option>
          <option value="pedido">${t('settings.newClassifier.onOrder')}</option>
          <option value="cliente">${t('settings.newClassifier.onCustomer', { ofTheCustomer: term('paciente', { article: 'del' }) })}</option>
          <option value="producto">${t('settings.newClassifier.onProduct')}</option>`;
}

function valuesHtml(values: readonly string[]): string {
  return values.map((item, index) => `<div class="g2" style="grid-template-columns:minmax(0,1fr) auto;margin-bottom:6px">
        <input data-ncv="${index}" value="${escapeHtml(item)}" placeholder="${t('settings.newClassifier.valuePlaceholder', { index: index + 1 })}">
        ${values.length > 1 ? `<button type="button" class="btn sec" data-ncx="${index}">✕</button>` : ''}</div>`).join('');
}

function formHtml(values: readonly string[]): string {
  return `
      <div class="fh"><div><h2>${t('settings.newClassifier.title')}</h2>
        <div class="sm">${t('settings.newClassifier.subtitle', { visits: term('visita', { number: 'p' }) })}</div></div>
        <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
      <div class="g2">
        <div><label for="ncn2">${t('settings.newClassifier.name')}</label><input id="ncn2" placeholder="${t('settings.newClassifier.namePlaceholder')}"></div>
        <div><label for="ncg">${t('settings.newClassifier.group')}</label><select id="ncg">${groups().map(group => `<option>${escapeHtml(group)}</option>`).join('')}</select></div>
      </div>
      <div class="g2">
        <div><label for="nca">${t('settings.newClassifier.where')}</label><select id="nca">
          ${areasHtml()}</select></div>
        <div><label for="ncd">${t('settings.newClassifier.description')}</label><input id="ncd" placeholder="${t('settings.newClassifier.descriptionPlaceholder')}"></div>
      </div>
      <label>${t('settings.newClassifier.values')}</label>
      <div id="ncv">${valuesHtml(values)}</div>
      <div class="acts"><button type="button" class="btn sec" id="ncmas">${t('settings.newClassifier.addValue')}</button></div>
      <div class="acts u-end">
        <button class="btn sec" data-cerrar>${t('settings.newClassifier.cancel')}</button>
        <button class="btn" id="ncok2">${t('settings.newClassifier.create')}</button></div>`;
}

async function create(values: readonly string[], button: HTMLButtonElement, onCreated: () => void): Promise<void> {
  const name = value('ncn2').trim();
  if (!name) { notices.toast(t('settings.newClassifier.nameIt'), true); return; }
  button.disabled = true;
  const { data: result } = await legacyDb().rpc<{ ok?: boolean }>('crear_clasificador', { p: {
    nombre: name, grupo: value('ncg'), ambito: value('nca'), descripcion: value('ncd').trim(), valores: values.map(item => item.trim()).filter(Boolean),
  } });
  button.disabled = false;
  if (result?.ok === false) { notices.toast(t('settings.newClassifier.noPermission'), true); return; }
  (document.getElementById('dlg') as HTMLDialogElement | null)?.close();
  notices.toast(t('settings.newClassifier.created')); onCreated(); settingsLegacy.reloadCatalogs();
}

function paint(values: string[], onCreated: () => void): void {
  const body = document.getElementById('dbody'); if (!body) return;
  body.innerHTML = formHtml(values);
  const read = (): string[] => [...body.querySelectorAll<HTMLInputElement>('#ncv [data-ncv]')].map(input => input.value);
  const more = document.getElementById('ncmas'); if (more) more.onclick = (): void => { paint([...read(), ''], onCreated); };
  body.querySelectorAll<HTMLElement>('[data-ncx]').forEach(button => {
    button.onclick = (): void => { const list = read(); list.splice(Number(button.dataset.ncx), 1); paint(list, onCreated); };
  });
  const ok = document.getElementById('ncok2') as HTMLButtonElement | null; if (ok) ok.onclick = (): void => { void create(read(), ok, onCreated); };
}

/** Opens the window; `onCreated` repaints the classifiers. */
export function newClassifier(onCreated: () => void): void {
  paint([''], onCreated);
  (document.getElementById('dlg') as HTMLDialogElement | null)?.showModal();
}
