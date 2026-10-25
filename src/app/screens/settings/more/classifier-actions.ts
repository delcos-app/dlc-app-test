/** The buttons of the classifier view: field options, add, rename, activate, destination state, delete. Migrated with classifier.ts (v2.415.0). */
import { legacyDb, notices, term } from '../../../legacy/bridge';
import { settingsMoreLegacy, type ClassifierData, type ClassifierValue } from '../../../legacy/settings2-bridge';
import { t } from '../../../i18n';
import { reloadClassifier } from './classifier';

const FIELD_FLAGS = ['obligatorio', 'solo_lectura', 'en_ficha', 'en_tabla', 'en_filtro'];

interface ClassifierView { classifier: ClassifierData; body: HTMLElement; refresh: () => Promise<void> }

const valueOf = (id: string): string => (document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null)?.value ?? '';
const on = (id: string, action: () => Promise<void>): void => { const button = document.getElementById(id); if (button) button.onclick = (): void => { void action(); }; };

async function saveField(view: ClassifierView): Promise<void> {
  const value: Record<string, unknown> = { tipo: valueOf('cfctipo') };
  FIELD_FLAGS.forEach(flag => { value[flag] = Boolean((document.getElementById(`cfc_${flag}`) as HTMLInputElement | null)?.checked); });
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean }>('configurar_campo', { p_id: view.classifier.id, p: value });
  if (error || !result?.ok) { notices.toast(t('settingsMore.classifier.fieldNotSaved'), true); return; }
  notices.toast(t('settingsMore.classifier.fieldSaved')); void view.refresh(); settingsMoreLegacy.loadCustomFields().catch(() => undefined);
}

function newValue(classifier: ClassifierData, text: string): Record<string, unknown> {
  const parent = valueOf('cvpadre'), extra = document.getElementById('cvextra') ? valueOf('cvextra') : null, destination = document.getElementById('cvdest') ? valueOf('cvdest') : null;
  const value: Record<string, unknown> = { clasificador_id: classifier.id, valor: text, extra, destino: destination };
  if (parent) { value.padre = parent; value.valor = text.startsWith(`${parent} · `) ? text : `${parent} · ${text}`; }
  return value;
}

async function addValue(view: ClassifierView): Promise<void> {
  const text = valueOf('cvnew').trim(); if (!text) return;
  const { error } = await legacyDb().rpc('guardar_valor', { p: newValue(view.classifier, text) });
  if (error) { notices.toast(t('settingsMore.classifier.couldNotAdd'), true); return; }
  notices.toast(t('settingsMore.classifier.added')); void view.refresh();
}

async function rename(view: ClassifierView, button: HTMLElement): Promise<void> {
  const [id, current = ''] = (button.dataset.vren ?? '').split('|');
  const name = await settingsMoreLegacy.askText(t('settingsMore.classifier.newName'), current, { titulo: t('settingsMore.classifier.renameTitle'), ok: t('common.save') });
  if (!name) return;
  await legacyDb().rpc('guardar_valor', { p: { id, valor: name } });
  notices.toast(t('settingsMore.classifier.renamed')); void view.refresh();
}

async function changeDestination(select: HTMLSelectElement): Promise<void> {
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean }>('guardar_valor', { p: { id: select.dataset.vdest, destino: select.value } });
  if (error || result?.ok === false) { notices.toast(t('settingsMore.classifier.couldNotChange'), true); return; }
  notices.toast(select.value ? t('settingsMore.classifier.nowMovesTo', { state: select.value }) : t('settingsMore.classifier.noLongerMoves'));
}

async function removeValue(view: ClassifierView, id: string): Promise<void> {
  const text = t('settingsMore.classifier.deleteValueText', { visits: term('visita', { number: 'p' }) });
  if (!await notices.confirm(text, { titulo: t('settingsMore.classifier.deleteValueTitle'), ok: t('settingsMore.classifier.delete'), peligro: true })) return;
  const { data: result } = await legacyDb().rpc<{ ok?: boolean }>('borrar_valor', { p_id: id });
  if (result?.ok === false) { notices.toast(t('settingsMore.classifier.noPermission'), true); return; }
  notices.toast(t('settingsMore.classifier.deleted')); void view.refresh();
}

async function removeClassifier(classifier: ClassifierData): Promise<void> {
  if (!await notices.confirm(t('settingsMore.classifier.deleteClassifierText', { name: classifier.nombre }), { titulo: t('settingsMore.classifier.deleteClassifierTitle'), ok: t('settingsMore.classifier.delete'), peligro: true })) return;
  const { data: result } = await legacyDb().rpc<{ ok?: boolean; error?: string }>('borrar_clasificador', { p_id: classifier.id });
  if (result?.ok === false) { notices.toast(t(result.error === 'sistema' ? 'settingsMore.classifier.systemOnes' : 'settingsMore.classifier.withoutPermission'), true); return; }
  (document.getElementById('dlg') as HTMLDialogElement | null)?.close(); notices.toast(t('settingsMore.classifier.classifierDeleted'));
  settingsMoreLegacy.repaintClassifiers(); void settingsMoreLegacy.reloadCatalogs();
}

function bindValues(view: ClassifierView, onData: (value: ClassifierValue) => void): void {
  const { body, classifier } = view;
  body.querySelectorAll<HTMLElement>('[data-vtog]').forEach(button => {
    button.onclick = async (): Promise<void> => {
      const [id, active] = (button.dataset.vtog ?? '').split('|');
      await legacyDb().rpc('guardar_valor', { p: { id, activo: active === '1' } }); void view.refresh();
    };
  });
  body.querySelectorAll<HTMLElement>('[data-vren]').forEach(button => { button.onclick = (): void => { void rename(view, button); }; });
  body.querySelectorAll<HTMLSelectElement>('[data-vdest]').forEach(select => { select.onchange = (): void => { void changeDestination(select); }; });
  body.querySelectorAll<HTMLElement>('[data-vdel]').forEach(button => { button.onclick = (): void => { void removeValue(view, button.dataset.vdel ?? ''); }; });
  body.querySelectorAll<HTMLElement>('[data-vdato]').forEach(button => {
    button.onclick = (): void => { const value = (classifier.valores ?? []).find(item => item.id === button.dataset.vdato); if (value) onData(value); };
  });
}

/** Binds the view just painted; `repaint` paints it again after a change (with the catalogs read again). */
export function bindClassifier(classifier: ClassifierData, repaint: () => void, onData: (value: ClassifierValue) => void): void {
  const body = document.getElementById('dbody'); if (!body) return;
  const view: ClassifierView = { classifier, body, refresh: async () => { await reloadClassifier(classifier); repaint(); void settingsMoreLegacy.reloadCatalogs(); } };
  on('cfcok', () => saveField(view));
  on('cvadd', () => addValue(view));
  on('cdel', () => removeClassifier(classifier));
  bindValues(view, onData);
}
