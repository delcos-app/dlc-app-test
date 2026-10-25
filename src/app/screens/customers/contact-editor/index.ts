/**
 * The customer editor (delivery and billing data), in the second window: person or company, tax id checked while typing, the
 * professional who treats them (or a different one on each order), address and contact, custom fields, and — for a new customer
 * from a call — its «Registro de llamada» with «Crear y hacer pedido» and «No compra». It warns of duplicates while typing.
 * Migrated from the legacy editorContactoBase and editorContacto of pantallas/clientes.js (v2.427.0); editorContacto stays as an
 * adapter (Clientes, Pedidos, Oportunidades, the bridges and the tests call it).
 */
import { legacyDb, term } from '../../../legacy/bridge';
import { leftoversLegacy } from '../../../legacy/leftovers-bridge';
import { orFallback } from '../../../services/values';
import { pickAccount } from '../../accounts/account-picker';
import { activateCallRecord } from '../../opportunities/call-record';
import { insertCustomFields } from '../../settings/custom-fields/form';
import { TYPES } from '../model';
import { watchDuplicates } from './duplicates';
import { reviewDocument, saveCallOnly, saveCustomer } from './save';
import { field, freeAccount, isCompany, type EditedCustomer, type EditorOptions, type EditorState, type SavedCustomer } from './state';
import { editorHtml, typeTexts } from './view';

const body = (): HTMLElement | null => document.getElementById('dlg2body');

/** With «professional on each order», the professional field and its note are hidden. */
function showAccountField(): void {
  const free = freeAccount(), picker = document.getElementById('kosel');
  picker?.classList.toggle('hide', free); document.getElementById('komsm')?.classList.toggle('hide', free);
  picker?.previousElementSibling?.classList.toggle('hide', free);
}

function bindFreeAccount(state: EditorState): void {
  const free = field('komlibre'); if (!free) return;
  free.onchange = showAccountField;
  if (!state.customer.id) return;
  void legacyDb().from<{ cuenta_por_pedido?: boolean | null } | null>('contactos').select('cuenta_por_pedido').eq('id', state.customer.id).maybeSingle().then(({ data }) => {
    state.freeBefore = Boolean(data?.cuenta_por_pedido);
    const checkbox = field('komlibre'); if (checkbox) { checkbox.checked = state.freeBefore; showAccountField(); }
  });
}

function bindType(state: EditorState, root: HTMLElement): void {
  const buttons = root.querySelectorAll<HTMLElement>('[data-ktipo]');
  buttons.forEach(button => {
    button.onclick = (): void => {
      state.type = button.dataset.ktipo ?? TYPES.person;
      buttons.forEach(other => { other.setAttribute('aria-pressed', String(other === button)); });
      const texts = typeTexts(isCompany(state)), taxId = field('konif');
      const taxLabel = document.getElementById('konifl'), nameLabel = document.getElementById('konoml');
      if (taxLabel) taxLabel.textContent = texts.taxId;
      if (nameLabel) nameLabel.textContent = texts.name;
      if (taxId) taxId.placeholder = texts.placeholder;
      document.getElementById('koempw')?.classList.toggle('koinv', isCompany(state));   // v2.341.0: the gap stays (the rest no longer jumps)
      if (taxId?.value) reviewDocument(state);
    };
  });
}

function bindButtons(state: EditorState): void {
  const cancel = document.getElementById('kocancel'); if (cancel) cancel.onclick = (): void => { (document.getElementById('dlg2') as HTMLDialogElement | null)?.close(); };
  const save = document.getElementById('kook') as HTMLButtonElement | null; if (save) save.onclick = (): void => { void saveCustomer(state, save, false); };
  const order = document.getElementById('kopedido') as HTMLButtonElement | null; if (order) order.onclick = (): void => { void saveCustomer(state, order, true); };
  const callOnly = document.getElementById('kosolo') as HTMLButtonElement | null; if (callOnly) callOnly.onclick = (): void => { void saveCallOnly(state, callOnly); };
}

function initialState(customer: EditedCustomer, onSave: ((customer: SavedCustomer) => void) | null, options: EditorOptions): EditorState {
  const account = customer.cuenta_id
    ? { id: customer.cuenta_id, nombre: orFallback(customer.medico, term('medico', { capital: 'C', adjective: 'asignado' })), codigo: orFallback(customer.medico_codigo, '') } : null;
  return { customer, onSave, options, withCall: !customer.id && Boolean(options.llamada), type: customer.tipo ?? TYPES.person, account, freeBefore: false };
}

/** Opens the editor of `customer` (a new one if it has no id); `onSave` receives the saved customer. */
export function editContact(customer?: EditedCustomer | null, onSave?: ((customer: SavedCustomer) => void) | null, options?: EditorOptions | null): void {
  const root = body(); if (!root) return;
  const state = initialState(customer ?? {}, onSave ?? null, options ?? {});
  root.innerHTML = editorHtml(state);
  const picker = document.getElementById('kosel');
  if (picker) pickAccount(picker, { valor: state.account, alElegir: account => { state.account = account; } });
  bindFreeAccount(state);
  const taxId = field('konif'); if (taxId) taxId.oninput = (): void => { reviewDocument(state); };
  bindType(state, root);
  void insertCustomFields(root, 'cliente', state.customer.id ?? null, document.getElementById('kook')?.closest('.acts') ?? null);
  if (state.withCall) activateCallRecord(state.options.llamada);
  bindButtons(state);
  (document.getElementById('dlg2') as HTMLDialogElement | null)?.showModal();
  watchDuplicates(state, leftoversLegacy.screen());
}
