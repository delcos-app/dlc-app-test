/**
 * The order editor (new order, draft, or a confirmed order while it has no invoice): it is painted again whole when lines, receipts or
 * free delivery change, keeping what was written. Migrated from the legacy editorPedido and editorPedidoBase (v2.417.0); editorPedido
 * stays as an adapter (legado 058 opens it wide, Clientes, Oportunidades, the order window and the tests call it by that name).
 */
import { appLegacy, currentScreen, legacyDb, notices, term } from '../../../legacy/bridge';
import { orderMailLegacy, orderSheetLegacy, ordersLegacy } from '../../../legacy/orders-bridge';
import { orderEditorLegacy } from '../../../legacy/orders2-bridge';
import { t } from '../../../i18n';
import { orFallback } from '../../../services/values';
import { pickCustomer } from '../../customers/picker';
import { round2 } from '../model';
import { sendPaymentDetails } from '../payment-email';
import { sendLinkAndShow } from '../tpv/after-save';
import { mobileOf } from '../tpv/model';
import { bindDistributor, choiceOf, distributorFields, loadDistributors } from './distributor';
import { bindLineInputs, paintBreakdown } from './lines';
import { saveOrder, type SaveOptions } from './save';
import { autoAmount, buildState, editableProblem, newLine, readForm, type EditorAccount, type EditorCustomer, type EditorPreset, type EditorState } from './state';
import { editorHtml, showsCardLink, showsTransfer } from './view';
import { generalVat } from '../../../core/organisation';

const FULL_DISCOUNT = 100, SALES_SCREEN = 'ventas';

const element = (id: string): HTMLInputElement | null => document.getElementById(id) as HTMLInputElement | null;
const choice = (id: string): HTMLSelectElement | null => document.getElementById(id) as HTMLSelectElement | null;
const on = (id: string, handler: (target: HTMLElement) => void): void => { const target = document.getElementById(id); if (target) target.onclick = (): void => { handler(target); }; };

function save(state: EditorState, status: string, button: HTMLElement, options?: SaveOptions): void {
  void saveOrder(state, status, button as HTMLButtonElement, { ...(options ? { options } : {}), sendLink: sendLinkAndShow });
}

/** Choosing another account brings its contract prices to the lines not written by hand. */
function contractPrices(state: EditorState): void {
  void orderEditorLegacy.loadContractPrices(state.account?.id).then(found => {
    if (!found) return;
    state.lines.forEach(line => { if (!line.manual) autoAmount(line); });
    paint(state);
  });
}

function mountAccount(state: EditorState): void {
  const box = document.getElementById('pselmed') as (HTMLElement & { __texto?: string }) | null; if (!box) return;
  box.__texto = state.account ? '' : state.form.cuenta_texto;
  orderEditorLegacy.pickAccount(box, state.account as PickedAccount | null, account => { state.account = account as EditorAccount; contractPrices(state); }, t('ordersMore.editor.accountPlaceholder'));
}

function bindPickers(state: EditorState): void {
  const customerBox = document.getElementById('pselpac');
  if (customerBox) pickCustomer(customerBox, { valor: state.customer as never, alElegir: chosen => {
    const customer = chosen as EditorCustomer | null;
    state.customer = customer;
    if (customer && !state.account && customer.cuenta_id) { state.account = { id: customer.cuenta_id, nombre: customer.medico ?? '', codigo: customer.medico_codigo ?? null }; mountAccount(state); contractPrices(state); }
  } });
  mountAccount(state);
}

function bindLines(state: EditorState): void {
  bindLineInputs(state);
  on('plmas', () => { const line = newLine(); state.lines.push(line); autoAmount(line); paint(state); });
  document.getElementById('plineas')?.querySelectorAll<HTMLElement>('[data-lx]').forEach(button => { button.onclick = (): void => { state.lines.splice(Number(button.dataset.lx), 1); paint(state); }; });
  const free = element('psincargo');
  if (free) free.onchange = (): void => { readForm(state); state.lines.forEach(line => { line.descuento = state.form.sin_cargo ? FULL_DISCOUNT : 0; }); paint(state); };
}

function bindPayment(state: EditorState): void {
  const method = choice('ppago'), channel = choice('pcan');
  if (channel) channel.onchange = (): void => { document.getElementById('zonapac')?.classList.toggle('escentro', channel.value === 'centro'); };
  if (method) method.onchange = (): void => {
    document.getElementById('ppagox')?.classList.toggle('hide', !method.value);
    document.getElementById('ptrfbox')?.classList.toggle('hide', !showsTransfer(state, method.value));
    document.getElementById('ptpvbox')?.classList.toggle('hide', !showsCardLink(state, method.value));
  };
  const receipt = element('pjus');
  if (receipt) receipt.onchange = async (): Promise<void> => {
    const file = receipt.files?.[0]; receipt.value = ''; if (!file) return;
    const read = await orderEditorLegacy.readReceipt(file); if (!read) return;
    state.receipts.push(read); paint(state);
  };
  document.getElementById('dbody')?.querySelectorAll<HTMLElement>('[data-jx]').forEach(button => { button.onclick = (): void => { state.receipts.splice(Number(button.dataset.jx), 1); paint(state); }; });
}

function bindService(state: EditorState): void {
  const repaint = (): void => { paintBreakdown(state); };
  ['pdto', 'pdtot', 'penv', 'penvi', 'penvv'].forEach(id => { const target = element(id); if (target) { target.oninput = repaint; target.onchange = repaint; } });
  const service = choice('pserv');
  if (service) service.onchange = (): void => {
    const chosen = orderEditorLegacy.services().find(item => item.id === service.value), shipping = element('penv'), amount = element('penvi'), vat = element('penvv');
    if (shipping) shipping.checked = Boolean(chosen);
    if (chosen && amount && vat) { amount.value = String(round2(chosen.pvp ?? 0)); vat.value = String(chosen.iva ?? generalVat()); }
    paintBreakdown(state);
  };
}

/** «Enviar los datos de pago»: saves as draft and sends the email with the payment details. */
async function sendDetailsAfterSave(id: string): Promise<void> {
  await sendPaymentDetails(id); appLegacy.openOrder(id);
  if (currentScreen() === SALES_SCREEN) ordersLegacy.reload();
}

function bindButtons(state: EditorState): void {
  const patient = (article: string): string => term('paciente', { article });
  on('pborr', button => { save(state, 'Borrador', button); });
  on('pvalid', button => { save(state, 'Confirmado', button); });
  on('ptrfmail', button => {
    if (!state.customer) { notices.toast(t('ordersMore.save.pickForDetails', { thePatient: patient('el') }), true); return; }
    if (!orderMailLegacy.companyIban()) { notices.toast(t('ordersMore.save.missingIban'), true); return; }
    save(state, 'Borrador', button, { afterSave: sendDetailsAfterSave });
  });
  on('ptpvenv', button => {
    void (async (): Promise<void> => {
      if (!state.customer) { notices.toast(t('ordersMore.save.pickForLink', { thePatient: patient('el') }), true); return; }
      if (!await mobileOf(state.customer)) { notices.toast(t('ordersMore.save.patientWithoutMobile', { Patient: term('paciente', { capital: 'C' }) }), true); return; }
      save(state, 'Borrador', button, { afterSave: sendLinkAndShow });
    })();
  });
}

/** Custom fields of the order (kept when the window is painted again; read from the order the first time). */
function mountFields(state: EditorState): void {
  const note = element('pnota');
  if (!note || !orderEditorLegacy.orderFields().some(item => item.en_ficha)) return;
  const put = (): void => {
    const body = document.getElementById('dbody'); if (!body || body.querySelector('.cpersform')) return;
    const values = state.fieldValues ?? {};
    element('pnota')?.insertAdjacentHTML('afterend', orderSheetLegacy.fieldsForm(values));
    const form = body.querySelector('.cpersform');
    const keep = (event: Event): void => { const input = (event.target as Element).closest<HTMLInputElement>('[data-cpk]'); if (input) values[input.dataset.cpk ?? ''] = input.value; };
    form?.addEventListener('input', keep); form?.addEventListener('change', keep);
  };
  if (state.fieldValues) { put(); return; }
  if (!state.order?.id) { state.fieldValues = {}; put(); return; }
  void legacyDb().from<{ clasificadores?: Record<string, unknown> | null } | null>('pedidos').select('clasificadores').eq('id', state.order.id).maybeSingle()
    .then(({ data }) => { state.fieldValues = { ...(data?.clasificadores ?? {}) }; put(); });
}

function paint(state: EditorState): void {
  readForm(state);
  const body = document.getElementById('dbody'); if (!body) return;
  body.innerHTML = editorHtml(state);
  bindDistributor(state.distributor);
  bindLines(state); bindPayment(state); bindService(state);
  paintBreakdown(state);
  bindPickers(state); bindButtons(state); mountFields(state);
}

function accountIdOf(preset: EditorPreset | null): string | null {
  const id = orFallback(preset?.medico?.id, orFallback(preset?.lineas?.[0]?.cuenta_id, preset?.contacto?.cuenta_id ?? ''));
  return id === '' ? null : id;
}

let openState: EditorState | null = null;

/** Who serves the order in the open editor, as guardar_pedido takes it (empty with no editor open). */
export const openEditorDistributor = (): Record<string, unknown> =>
  (openState && document.getElementById('pdist') ? distributorFields(openState.distributor) : {});

/** Opens the editor of an order (its window's detail) or of a new one (a preset or nothing). */
export async function editOrder(preset: EditorPreset | null): Promise<void> {
  const order = preset?.pedido ?? null, distributor = choiceOf(order);
  await loadDistributors().catch(() => []);
  await orderEditorLegacy.loadProducts();
  const problem = editableProblem(order);
  if (problem) { notices.toast(t(problem === 'invoiced' ? 'ordersMore.editor.alreadyInvoiced' : 'ordersMore.editor.voided'), true); return; }
  await orderEditorLegacy.loadContractPrices(accountIdOf(preset));
  openState = buildState(preset, distributor);
  paint(openState);
  (document.getElementById('dlg') as HTMLDialogElement | null)?.showModal();
}
