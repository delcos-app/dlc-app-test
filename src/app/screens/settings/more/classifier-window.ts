/** Opens the window of a classifier (Configuración → Clasificadores, and the tests). Migrated from the legacy abrirClasificador (v2.415.0). */
import { settingsMoreLegacy } from '../../../legacy/settings2-bridge';
import { bindClassifier } from './classifier-actions';
import { classifierHtml, reloadClassifier, rightsOf } from './classifier';
import { editValueData } from './value-data';

/** Opens a classifier by id (nothing if it is not in the catalog list). */
export function openClassifier(id: string): void {
  const classifier = settingsMoreLegacy.classifiers().find(item => item.id === id); if (!classifier) return;
  const paint = (): void => {
    const body = document.getElementById('dbody'); if (!body) return;
    body.innerHTML = classifierHtml(classifier, rightsOf(classifier));
    bindClassifier(classifier, paint, value => {
      editValueData(value, () => { void reloadClassifier(classifier).then(() => { void settingsMoreLegacy.reloadCatalogs(); openClassifier(id); }); });
    });
  };
  paint();
  const box = document.getElementById('dlg') as HTMLDialogElement | null;
  if (box && !box.open) box.showModal();
}
