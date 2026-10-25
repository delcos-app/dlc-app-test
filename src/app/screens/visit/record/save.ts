/**
 * «Guardar visita»: the results and their data, through the write queue (without connection it stays on this phone and is sent
 * by itself; the same op_id if pressed twice). How it was, the photos, the samples and the products are added by the legacy
 * escribirRpc from the open visit (VISITA_ACTUAL). If the account was urgent and the visit was done, it asks whether to unmark it.
 */
import { accountCardLegacy, agendaActions, legacyDb, notices, term } from '../../../legacy/bridge';
import { visitLegacy } from '../../../legacy/visit-bridge';
import { t } from '../../../i18n';
import { NEGATIVE } from '../model';
import type { RecordAccount } from './data';
import type { ButtonIndex } from './form';

let operationId: string | null = null;

/** A new window is a new visit (a new op_id). */
export const forgetOperation = (): void => { operationId = null; };

const value = (id: string): string => (document.getElementById(id) as HTMLInputElement | null)?.value ?? '';

function details(body: HTMLElement, marked: readonly string[], index: ButtonIndex): Record<string, string>[] {
  return marked.map(key => {
    const field = body.querySelector<HTMLInputElement>(`[data-dato="${CSS.escape(key)}"]`), extra = field ? field.value.trim() : '';
    const info = index.get(key);
    return { clasificador: info?.group ?? '', valor: info?.value.valor ?? '', ...(extra ? { dato: extra } : {}) };
  });
}

async function askUrgent(account: RecordAccount, id: string): Promise<void> {
  const message = t('visit.record.urgentText', { name: `${account.nombre}${account.urgente_motivo ? ` · ${account.urgente_motivo}` : ''}` });
  const choice = await notices.choose(t('visit.record.urgentTitle'), message, [{ k: 'dejar', t: t('visit.record.keepUrgent'), cls: 'sec' }, { k: 'quitar', t: t('visit.record.removeUrgent') }]);
  if (choice !== 'quitar') return;
  const { error } = await legacyDb().from('cuentas').update({ urgente: false, urgente_motivo: null }).eq('id', id);
  notices.toast(t(error ? 'visit.record.couldNotUnmark' : 'visit.record.unmarked'), Boolean(error));
}

interface Saved { encolada?: boolean; estado?: string | null }

/** The same op_id if «Guardar» is pressed twice: the server does not save it twice. */
function payload(id: string, results: readonly string[], detailList: readonly Record<string, string>[]): Record<string, unknown> {
  operationId ??= `v-${id}-${Date.now()}`;
  return {
    cuenta_id: id, ubicacion_id: value('vc') || null, fecha: value('vf'), resultados: results, detalles: detailList,
    nota: value('vn').trim(), proxima_accion: value('vpa').trim(), proxima_fecha: value('vpf') || null, op_id: operationId,
  };
}

/** Queued without connection: «Tu día» says so instead. */
function savedNotice(saved: Saved | null | undefined): void {
  if (saved?.encolada) return;
  notices.toast(t('visit.record.saved', { visit: term('visita', { capital: 'C', adjective: 'registrado' }) }) + (saved?.estado ? t('visit.record.newState', { state: saved.estado }) : ''));
}

/** The open window: whose visit, its result buttons and the key of the results group. */
export interface OpenVisit { id: string; account: RecordAccount; index: ButtonIndex; resultsKey: string }

/** Saves the visit from the open window. */
export async function saveVisit(visit: OpenVisit, button: HTMLButtonElement): Promise<void> {
  const { id, account, index, resultsKey } = visit;
  const body = document.getElementById('dbody'); if (!body) return;
  const marked = [...body.querySelectorAll<HTMLElement>('[data-vk][aria-pressed=true]')].map(item => item.dataset.vk ?? '');
  const isResult = (key: string): boolean => index.get(key)?.group === resultsKey;
  const results = marked.filter(isResult).map(key => index.get(key)?.value.valor ?? '');
  if (!results.length) { notices.toast(t('visit.record.chooseResult'), true); return; }
  button.disabled = true; button.textContent = t('visit.edit.saving');
  const { data, error } = await visitLegacy.writeRpc('registrar_actividad', { p: payload(id, results, details(body, marked, index)) });
  button.disabled = false; button.textContent = t('visit.record.save', { visit: term('visita') });
  if (error) { notices.toast(t('visit.record.couldNotSave', { error: error.message ?? '' }), true); return; }
  (document.getElementById('dlg') as HTMLDialogElement | null)?.close();
  savedNotice(data as Saved | null | undefined);
  const done = marked.some(key => isResult(key) && index.get(key)?.value.extra !== NEGATIVE);
  if (account.urgente && done) await askUrgent(account, id);
  visitLegacy.reloadHome();
  if (accountCardLegacy.shownId() === id) agendaActions.openAccount(id);
}
