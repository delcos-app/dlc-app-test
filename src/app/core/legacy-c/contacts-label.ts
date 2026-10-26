/**
 * The name of the contacts module is configurable («Prescriptores» by default, v2.46.1) and every place that shows it follows; the fixed
 * texts of index.html use the company vocabulary (v2.71.0). Folded from legado 051 and 069 (v2.425.0).
 */
import { term } from '../../legacy/bridge';
import { t } from '../../i18n';
import { byId, observe } from './dom';
import { sessionStore } from '../session-store';

/** The names a company can give to the contacts module (the legacy ETIQUETAS). */
export const contactLabels = (): string[] =>
  [...new Set([term('medico', { number: 'p', capital: 'C' }), ...t('legacyC.contactLabels').split(',')])];

const isText = (node: ChildNode): boolean => node.nodeType === Node.TEXT_NODE && Boolean(node.nodeValue?.trim());

/** Writes the configured name in the menus, the header of Cuentas and «‹ Volver» of Calidad (the legacy aplicarEtiquetaBase). */
export function applyContactsLabel(): void {
  const name = etiquetaContactos();
  document.querySelectorAll('nav.main [data-t="directorio"], #bnav [data-t="directorio"], .bmasgrid [data-bm="directorio"]').forEach(button => {
    [...button.childNodes].forEach(node => { if (isText(node)) node.nodeValue = name; });
    const label = button.querySelector('b, em, small, .lb'); if (label && !label.querySelector('svg')) label.textContent = name;
  });
  const title = document.querySelector('#dircab h1');
  if (title) { const text = [...title.childNodes].find(isText); if (text) text.nodeValue = name; else title.insertAdjacentText('afterbegin', name); }
  const back = byId('calvolver'); if (back) back.textContent = `‹ ${name}`;
}

/** The name is written again whenever the bottom bar shows another one; the hidden group is not painted in the Configuración menu. */
export function keepContactsLabel(): void {
  observe(document.body, () => {
    const button = document.querySelector('#bnav [data-t="directorio"]');
    if (button && !(button.textContent ?? '').includes(etiquetaContactos())) aplicarEtiqueta();
  }, { childList: true, subtree: true });
  observe(document.body, () => {
    document.querySelectorAll('.cfgnav .cfgg').forEach(group => { if (group.querySelector('h3')?.textContent === '__oculto') group.remove(); });
  }, { childList: true, subtree: true });
}

/** v2.71.0: the fixed texts of index.html with the company words (only when it changed them). */
export function applyVocabularyToFixedTexts(): void {
  if (!Object.keys(sessionStore.terms ?? {}).length) return;
  const search = byId<HTMLInputElement>('q'); if (search) search.placeholder = t('legacyC.fixedTexts.search', { professional: term('medico') });
  const latest = document.querySelector('#c-ultimas h2'); if (latest) latest.textContent = t('legacyC.fixedTexts.latest', { visits: term('visita', { number: 'p' }) });
  const option = document.querySelector('option[value="reciente"]'); if (option) option.textContent = t('legacyC.fixedTexts.recent', { visit: term('visita', { capital: 'C' }) });
  const speciality = document.querySelector('label[for="fesp"]'); if (speciality) speciality.textContent = term('especialidad', { capital: 'C' });
}
