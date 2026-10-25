/**
 * Saving the customer editor: the checks (name, required custom fields, tax id), guardar_contacto, the custom fields, «professional
 * on each order», and the call it comes from; «Crear y hacer pedido» continues to the order editor. «No compra» saves only the call.
 */
import { legacyDb, notices, term } from '../../../legacy/bridge';
import { leftoversLegacy } from '../../../legacy/leftovers-bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { orFallback } from '../../../services/values';
import { checkDocument } from '../../../components/fields';
import { readCallRecord, saveCallRecord, type CallRecord } from '../../opportunities/call-record';
import { ORDER_DONE } from '../../opportunities/model';
import { readCustomFields, saveCustomFields, type ReadFields } from '../../settings/custom-fields/form';
import { listCustomers } from '../list';
import { field, fieldValue, freeAccount, isCompany, type EditorState, type SavedCustomer } from './state';

const DUPLICATE_HINT = 'cliente_duplicado';

/** The tax id under the field: what is wrong, if anything. */
export function reviewDocument(state: EditorState): ReturnType<typeof checkDocument> {
  const result = checkDocument(field('konif')?.value, state.type), message = document.getElementById('konifm');
  if (message) message.innerHTML = result.ok ? '' : `<span style="color:var(--danger)">${escapeHtml(result.msg ?? '')}</span>`;
  return result;
}

function payload(state: EditorState, taxId: string): Record<string, unknown> {
  return {
    id: state.customer.id ?? null, nombre: fieldValue('konom'), nif: taxId, tipo: state.type,
    direccion: fieldValue('kodir'), cp: fieldValue('kocp'), municipio: fieldValue('komun'),
    provincia: fieldValue('kopro'), telefono: fieldValue('kotel'), movil: fieldValue('komov'),
    email: fieldValue('komail'), empresa: isCompany(state) ? '' : fieldValue('koemp'), nota: fieldValue('konota'),
    cuenta_id: state.account && !freeAccount() ? state.account.id : null,
  };
}

/** The checks before saving; the custom fields read (or false if something is missing). */
function checked(state: EditorState): { fields: ReadFields | null; taxId: string } | false {
  if (!fieldValue('konom')) { notices.toast(t('leftovers.customer.writeName'), true); return false; }
  const fields = readCustomFields(document.getElementById('dlg2'));
  if (fields?.falta.length) { notices.toast(t('leftovers.customer.fillIn', { field: fields.falta[0] ?? '' }), true); return false; }
  const taxIdCheck = reviewDocument(state);
  if (!taxIdCheck.ok) { notices.toast(t(isCompany(state) ? 'leftovers.customer.checkCif' : 'leftovers.customer.checkDni'), true); return false; }
  return { fields, taxId: taxIdCheck.v };
}

/** v2.329.0: «professional on each order» is saved on its own when it changes. */
async function saveFreeAccount(state: EditorState, id: string | null | undefined, saved: SavedCustomer | null): Promise<boolean> {
  const free = freeAccount();
  if (!field('komlibre') || free === state.freeBefore) return true;
  const { data, error } = await legacyDb().rpc<{ ok?: boolean }>('guardar_cuenta_por_pedido', { p_id: id, p_valor: free });
  if (error || data?.ok === false) { notices.toast(t('leftovers.customer.couldNotSaveFree'), true); return false; }
  if (free && saved) saved.cuenta_id = null;
  return true;
}

function buttonText(state: EditorState, withOrder: boolean): string {
  if (state.customer.id) return t('common.save');
  return withOrder ? t('leftovers.customer.createAndOrder') : t('leftovers.customer.create', { patient: term('paciente') });
}

/** v2.119.0: the call is saved with the new customer (if something was noted or it comes from a call). */
async function saveCall(state: EditorState, call: CallRecord | null, customer: SavedCustomer, withOrder: boolean): Promise<string | null> {
  if (!call || !(withOrder || call.motivo || call.resultado || call.nota || state.options.llamada)) return null;
  return saveCallRecord(call, {
    contacto_id: customer.id, nombre: customer.nombre, telefono: orFallback(customer.movil, customer.telefono ?? ''), medico: state.account,
    resultado: withOrder ? orFallback(call.resultado, ORDER_DONE) : call.resultado,
  }, state.options.llamada);
}

async function afterSave(state: EditorState, customer: SavedCustomer, callId: string | null, withOrder: boolean): Promise<void> {
  if (withOrder) {
    if (callId) leftoversLegacy.setPendingCall(callId);
    await leftoversLegacy.editOrder({ contacto: customer, medico: state.account ? { id: state.account.id, nombre: state.account.nombre } : null });
    return;
  }
  state.onSave?.(customer);
  if (leftoversLegacy.screen() === 'pacientes') void listCustomers();
  if (callId && leftoversLegacy.screen() === 'ventas' && leftoversLegacy.ordersSection() === 'llamadas') leftoversLegacy.repaintCalls();
}

type SaveAnswer = { ok?: boolean; contacto?: SavedCustomer } | null;

async function send(state: EditorState, button: HTMLButtonElement, taxId: string, withOrder: boolean): Promise<{ data: SaveAnswer; error: { message?: string; hint?: string } | null }> {
  button.disabled = true; button.textContent = t('leftovers.customer.saving');
  const answer = await legacyDb().rpc<SaveAnswer>('guardar_contacto', { p: payload(state, taxId) });
  button.disabled = false; button.textContent = buttonText(state, withOrder);
  return { data: answer.data, error: answer.error as { message?: string; hint?: string } | null };
}

/** A failed save, said (a duplicate customer marks its tax id again). */
function failed(error: { message?: string; hint?: string } | null, result: SaveAnswer): boolean {
  if (error && (error.hint ?? '').includes(DUPLICATE_HINT)) {   // v2.225.0
    notices.toast(error.message ?? '', true); field('konif')?.dispatchEvent(new Event('input')); return true;
  }
  if (error || result?.ok === false) { notices.toast(t('leftovers.customer.couldNotSave'), true); return true; }
  return false;
}

/** guardar_contacto, the custom fields and «professional on each order»: the saved customer, or null if something failed. */
async function store(state: EditorState, button: HTMLButtonElement, ready: { fields: ReadFields | null; taxId: string }, withOrder: boolean): Promise<SavedCustomer | null> {
  const { data: result, error } = await send(state, button, ready.taxId, withOrder);
  if (failed(error, result)) return null;
  const saved = { ...(result?.contacto ?? {}) } as SavedCustomer, id = result?.contacto?.id ?? state.customer.id;
  if (ready.fields && !(await saveCustomFields(ready.fields, id))) return null;
  if (!(await saveFreeAccount(state, id, saved))) return null;
  return saved;
}

/** «Guardar» / «Crear …» / «Crear y hacer pedido». */
export async function saveCustomer(state: EditorState, button: HTMLButtonElement, withOrder: boolean): Promise<void> {
  const call = state.withCall ? readCallRecord() : null, ready = checked(state);
  if (!ready) return;
  const saved = await store(state, button, ready, withOrder);
  if (!saved) return;
  if (freeAccount()) state.account = null;
  (document.getElementById('dlg2') as HTMLDialogElement | null)?.close();
  notices.toast(term('paciente', { capital: 'C', adjective: state.customer.id ? 'guardado' : 'creado' }));
  const customer: SavedCustomer = { ...saved, ...(state.account ? { medico: state.account.nombre, medico_codigo: state.account.codigo ?? null } : {}) };
  const callId = await saveCall(state, call, customer, withOrder);
  await afterSave(state, customer, callId, withOrder);
}

/** «No compra»: only the call, without creating the customer, with what was noted about them. */
export async function saveCallOnly(state: EditorState, button: HTMLButtonElement): Promise<void> {
  const call = readCallRecord();
  const name = fieldValue('konom'), phone = orFallback(fieldValue('komov'), fieldValue('kotel'));
  if (!name && !phone) { notices.toast(t('leftovers.customer.nameOrPhone'), true); return; }
  if (!call) return;
  button.disabled = true;
  const noted: Record<string, string> = {
    tipo: state.type, nif: fieldValue('konif'), email: fieldValue('komail'), direccion: fieldValue('kodir'), cp: fieldValue('kocp'),
    municipio: fieldValue('komun'), provincia: fieldValue('kopro'), empresa: fieldValue('koemp'), nota: fieldValue('konota'),
  };
  const data = Object.fromEntries(Object.entries(noted).filter(([, value]) => value));
  const callId = await saveCallRecord(call, { contacto_id: null, nombre: name, telefono: phone, medico: state.account, resultado: call.resultado, datos: data }, state.options.llamada);
  button.disabled = false;
  if (!callId) return;
  (document.getElementById('dlg2') as HTMLDialogElement | null)?.close(); notices.toast(t('leftovers.customer.callOnlySaved'));
  if (leftoversLegacy.screen() === 'ventas' && leftoversLegacy.ordersSection() === 'llamadas') leftoversLegacy.repaintCalls();
}
