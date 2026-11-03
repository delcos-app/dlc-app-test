/**
 * The actions of the classifier window: field options, «+ Nuevo valor», a row (click, Enter or space opens its editor) and deleting
 * the classifier; and, in the value editor, «Eliminar valor», «Cancelar» and «Guardar». Migrated with classifier.ts (v2.415.0);
 * v2.464.0: the buttons of each row moved to its editor (activating is the «Activo» field, saved with «Guardar»).
 */
import { legacyDb, notices, term } from '../../../legacy/bridge';
import { settingsMoreLegacy, type ClassifierData, type ClassifierValue } from '../../../legacy/settings2-bridge';
import { t } from '../../../i18n';
import { addValue, saveValue } from './value-editor';

const FIELD_FLAGS = ['obligatorio', 'solo_lectura', 'en_ficha', 'en_tabla', 'en_filtro'];

/** What the window shows: the list, the editor of a value or the form of a new one. */
export type ClassifierPage = { kind: 'list'; focus?: string | undefined } | { kind: 'edit'; value: ClassifierValue } | { kind: 'new' };

export interface ClassifierView { classifier: ClassifierData; body: HTMLElement; show: (page: ClassifierPage) => void; refresh: (page: ClassifierPage) => Promise<void> }

const valueOf = (id: string): string => (document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null)?.value ?? '';
const on = (id: string, action: () => Promise<void>): void => { const button = document.getElementById(id); if (button) button.onclick = (): void => { void action(); }; };

async function saveField(view: ClassifierView): Promise<void> {
  const value: Record<string, unknown> = { tipo: valueOf('cfctipo') };
  FIELD_FLAGS.forEach(flag => { value[flag] = Boolean((document.getElementById(`cfc_${flag}`) as HTMLInputElement | null)?.checked); });
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean }>('configurar_campo', { p_id: view.classifier.id, p: value });
  if (error || !result?.ok) { notices.toast(t('settingsMore.classifier.fieldNotSaved'), true); return; }
  notices.toast(t('settingsMore.classifier.fieldSaved')); void view.refresh({ kind: 'list' }); settingsMoreLegacy.loadCustomFields().catch(() => undefined);
}

async function removeValue(view: ClassifierView, id: string): Promise<void> {
  const text = t('settingsMore.classifier.deleteValueText', { visits: term('visita', { number: 'p' }) });
  if (!await notices.confirm(text, { titulo: t('settingsMore.classifier.deleteValueTitle'), ok: t('settingsMore.classifier.delete'), peligro: true })) return;
  const { data: result } = await legacyDb().rpc<{ ok?: boolean }>('borrar_valor', { p_id: id });
  if (result?.ok === false) { notices.toast(t('settingsMore.classifier.noPermission'), true); return; }
  notices.toast(t('settingsMore.classifier.deleted')); void view.refresh({ kind: 'list' });
}

async function removeClassifier(classifier: ClassifierData): Promise<void> {
  if (!await notices.confirm(t('settingsMore.classifier.deleteClassifierText', { name: classifier.nombre }), { titulo: t('settingsMore.classifier.deleteClassifierTitle'), ok: t('settingsMore.classifier.delete'), peligro: true })) return;
  const { data: result } = await legacyDb().rpc<{ ok?: boolean; error?: string }>('borrar_clasificador', { p_id: classifier.id });
  if (result?.ok === false) { notices.toast(t(result.error === 'sistema' ? 'settingsMore.classifier.systemOnes' : 'settingsMore.classifier.withoutPermission'), true); return; }
  (document.getElementById('dlg') as HTMLDialogElement | null)?.close(); notices.toast(t('settingsMore.classifier.classifierDeleted'));
  settingsMoreLegacy.repaintClassifiers(); void settingsMoreLegacy.reloadCatalogs();
}

function bindRows(view: ClassifierView): void {
  const { body, classifier } = view;
  const edit = (id: string | undefined): void => { const value = (classifier.valores ?? []).find(item => item.id === id); if (value) view.show({ kind: 'edit', value }); };
  body.querySelectorAll<HTMLElement>('[data-vval][role=button]').forEach(row => {
    row.onclick = (): void => { edit(row.dataset.vval); };
    row.onkeydown = (event): void => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); edit(row.dataset.vval); } };
  });
}

/** Binds the list just painted. */
export function bindClassifierList(view: ClassifierView): void {
  on('cfcok', () => saveField(view));
  on('cdel', () => removeClassifier(view.classifier));
  const add = view.body.querySelector<HTMLElement>('[data-vnew]'); if (add) add.onclick = (): void => { view.show({ kind: 'new' }); };
  bindRows(view);
}

/** Binds the editor just painted: «Cancelar» goes back to the list, «Guardar» / «Añadir» saves and goes back to it. */
export function bindValueForm(view: ClassifierView, page: Exclude<ClassifierPage, { kind: 'list' }>): void {
  const focus = page.kind === 'edit' ? page.value.id : undefined;
  view.body.querySelectorAll<HTMLElement>('[data-vback]').forEach(button => { button.onclick = (): void => { view.show({ kind: 'list', focus }); }; });
  view.body.querySelectorAll<HTMLElement>('[data-vdel]').forEach(button => { button.onclick = (): void => { void removeValue(view, button.dataset.vdel ?? ''); }; });
  const save = async (button: HTMLButtonElement): Promise<void> => {
    button.disabled = true;
    const saved = page.kind === 'edit' ? await saveValue(page.value) : await addValue(view.classifier);
    button.disabled = false;
    if (saved) await view.refresh({ kind: 'list', focus });
  };
  const button = (document.getElementById('veok') ?? document.getElementById('cvadd')) as HTMLButtonElement | null; if (!button) return;
  button.onclick = (): void => { void save(button); };
  view.body.querySelectorAll<HTMLInputElement>('#vename, #cvnew').forEach(input => { input.onkeydown = (event): void => { if (event.key === 'Enter') { event.preventDefault(); void save(button); } }; });
}

