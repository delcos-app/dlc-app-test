/**
 * Opens the window of a classifier (Configuración → Clasificadores, and the tests). Migrated from the legacy abrirClasificador
 * (v2.415.0). v2.464.0: the editor of a value and the form of a new one are painted in the same window as the list (same edges,
 * in the page or on the whole phone screen), not in a second window.
 */
import { settingsMoreLegacy, type ClassifierData } from '../../../legacy/settings2-bridge';
import { bindClassifierList, bindValueForm, type ClassifierPage, type ClassifierView } from './classifier-actions';
import { classifierHtml, reloadClassifier, rightsOf } from './classifier';
import { bindEditor, editorHtml, newValueHtml } from './value-editor';

const HEADER_GAP = 12;

/** The top of the window in view: in the page (under the fixed header) or at the top of the phone window. */
function toTop(body: HTMLElement): void {
  const dialog = body.closest('dialog');
  if (dialog && !dialog.classList.contains('encajada')) { dialog.scrollTop = 0; body.scrollTop = 0; return; }
  const top = body.getBoundingClientRect().top, header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--alto-cab')) || 0;
  if (top < header) scrollTo({ top: Math.max(0, top + scrollY - header - HEADER_GAP) });
}

function paint(view: ClassifierView, page: ClassifierPage): void {
  const { body, classifier } = view, rights = rightsOf(classifier);
  if (page.kind === 'list') {
    body.innerHTML = classifierHtml(classifier, rights);
    bindClassifierList(view);
    const row = page.focus ? body.querySelector<HTMLElement>(`[data-vval="${page.focus}"]`) : null;
    if (row) { row.scrollIntoView({ block: 'nearest' }); row.focus({ preventScroll: true }); } else toTop(body);
    return;
  }
  body.innerHTML = page.kind === 'edit' ? editorHtml(classifier, page.value, rights) : newValueHtml(classifier);
  bindEditor(); bindValueForm(view, page); toTop(body);
}

function viewOf(classifier: ClassifierData, body: HTMLElement): ClassifierView {
  const view: ClassifierView = {
    classifier, body,
    show: page => { paint(view, page); },
    refresh: async page => { await reloadClassifier(classifier); paint(view, page); void settingsMoreLegacy.reloadCatalogs(); },
  };
  return view;
}

/** Opens a classifier by id (nothing if it is not in the catalog list). */
export function openClassifier(id: string): void {
  const classifier = settingsMoreLegacy.classifiers().find(item => item.id === id); if (!classifier) return;
  const body = document.getElementById('dbody'); if (!body) return;
  paint(viewOf(classifier, body), { kind: 'list' });
  const box = document.getElementById('dlg') as HTMLDialogElement | null;
  if (box && !box.open) box.showModal();
}
