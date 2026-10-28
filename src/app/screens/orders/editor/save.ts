/**
 * Saving the order from its editor: the questions first (card or Bizum link or confirm now, a transfer kept as draft until paid, a
 * free delivery without account, the confirmation), then guardar_pedido with who serves it, the custom fields, «Reportar» and the
 * receipts, and what to show afterwards. Migrated from the legacy editorPedidoBase (v2.417.0).
 */
import { currentScreen, legacyDb, notices, term } from '../../../legacy/bridge';
import { orderSheetLegacy, ordersLegacy } from '../../../legacy/orders-bridge';
import { orderEditorLegacy } from '../../../legacy/orders2-bridge';
import { t } from '../../../i18n';
import { nonZeroOr, orFallback } from '../../../services/values';
import { isBankTransfer, STATES } from '../model';
import { warnIfAmountChanged } from '../tpv/after-save';
import { isTpvPayment, mobileOf, tpvActive } from '../tpv/model';
import { distributorFields } from './distributor';
import type { EditorState } from './state';

export interface SaveOptions { afterSave?: (id: string) => Promise<void> }
interface Plan { status: string; options: SaveOptions; confirmedNow: boolean; withoutMobile: boolean }

const SALES_SCREEN = 'ventas', CUSTOMERS_SCREEN = 'pacientes';
const field = (id: string): HTMLInputElement | null => document.getElementById(id) as HTMLInputElement | null;
const value = (id: string): string => field(id)?.value ?? '';
const isFree = (): boolean => Boolean(field('psincargo')?.checked);
const isCentre = (): boolean => Boolean(document.getElementById('zonapac')?.classList.contains('escentro'));
const isConfirmedOrder = (state: EditorState): boolean => state.order?.estado === STATES.confirmed;

/** Card or Bizum with the link on: send it (draft until paid) or confirm now. Without the customer's mobile, it is confirmed as always. */
async function askCardPath(state: EditorState, plan: Plan, sendLink: (id: string) => Promise<void>): Promise<boolean> {
  if (!await mobileOf(state.customer)) { plan.withoutMobile = true; return true; }
  const choice = await notices.choose(t('ordersMore.save.cardTitle'), t('ordersMore.save.cardText'),
    [{ k: 'no', t: t('ordersMore.save.cancel'), cls: 'sec' }, { k: 'validar', t: t('ordersMore.save.confirmNow'), cls: 'sec' }, { k: 'enlace', t: t('ordersMore.save.sendLink') }]);
  if (!choice) return false;
  if (choice === 'enlace') { plan.status = STATES.draft; plan.options = { ...plan.options, afterSave: sendLink }; } else plan.confirmedNow = true;
  return true;
}

async function askTransfer(plan: Plan): Promise<boolean> {
  const choice = await notices.choose(t('ordersMore.save.transferTitle'), t('ordersMore.save.transferText'),
    [{ k: 'no', t: t('ordersMore.save.cancel'), cls: 'sec' }, { k: 'validar', t: t('ordersMore.save.confirmNow'), cls: 'sec' }, { k: 'borrador', t: t('ordersMore.save.saveAsDraft') }]);
  if (!choice) return false;
  if (choice === 'borrador') plan.status = STATES.draft; else plan.confirmedNow = true;
  return true;
}

/** A customer whose account goes with it (not chosen per order) gives the order its account. */
async function accountFromCustomer(state: EditorState): Promise<void> {
  if (state.account || !state.customer?.id || isCentre()) return;
  const { data } = await legacyDb().from<{ cuenta_id?: string | null; cuenta_por_pedido?: boolean | null } | null>('contactos').select('cuenta_id, cuenta_por_pedido').eq('id', state.customer.id).maybeSingle();
  if (data?.cuenta_id && !data.cuenta_por_pedido) state.account = { id: data.cuenta_id, nombre: state.customer.medico ?? '' };
}

/** Card or Bizum with the link on, for an order still to be confirmed. */
const asksCardPath = (plan: Plan, free: boolean, already: boolean): boolean =>
  !free && !already && plan.status === STATES.confirmed && !plan.options.afterSave && tpvActive() && isTpvPayment(value('ppago'));
const asksTransfer = (plan: Plan, free: boolean, already: boolean): boolean => !free && !already && plan.status === STATES.confirmed && isBankTransfer(value('ppago'));
const asksConfirmation = (plan: Plan, already: boolean): boolean => plan.status === STATES.confirmed && !plan.confirmedNow && !already;

const confirmFreeWithoutAccount = (): Promise<boolean> =>
  notices.confirm(t('ordersMore.save.freeWithoutAccount', { professional: term('medico') }), { titulo: t('ordersMore.save.freeTitle'), ok: t('ordersMore.save.saveAnyway') });
const confirmOrder = (): Promise<boolean> => notices.confirm(t('ordersMore.save.confirmText'), { titulo: t('ordersMore.save.confirmTitle'), ok: t('ordersMore.save.confirm') });

/** All the questions before saving; null if one was cancelled. */
async function plan(state: EditorState, status: string, options: SaveOptions, sendLink: (id: string) => Promise<void>): Promise<Plan | null> {
  const result: Plan = { status, options, confirmedNow: false, withoutMobile: false }, free = isFree(), already = isConfirmedOrder(state);
  if (asksCardPath(result, free, already) && !await askCardPath(state, result, sendLink)) return null;
  await accountFromCustomer(state);
  if (free && !state.account && !await confirmFreeWithoutAccount()) return null;
  if (asksTransfer(result, free, already) && !await askTransfer(result)) return null;
  if (asksConfirmation(result, already) && !await confirmOrder()) return null;
  return result;
}

const nullIfEmpty = (text: string): string | null => (text === '' ? null : text);

function lines(state: EditorState): Record<string, unknown>[] {
  return state.lines.filter(line => line.producto_id).map(line => ({ producto_id: line.producto_id, unidades: nonZeroOr(line.unidades, 1), importe: line.importe, descuento: nonZeroOr(line.descuento, 0), iva: line.iva }));
}

function paymentFields(): Record<string, unknown> {
  // A sample delivery is saved without a payment method or a delivery service, whatever was chosen before ticking it
  if (isFree()) return { forma_pago: null, pago_referencia: '', descuento: Number(value('pdto')) || 0, descuento_tipo: value('pdtot'), envio: false, envio_con_iva: 0, envio_iva: Number(value('penvv')) || 0, servicio_id: null };
  const method = value('ppago');
  return { forma_pago: nullIfEmpty(method), pago_referencia: method ? value('pref').trim() : '', descuento: Number(value('pdto')) || 0, descuento_tipo: value('pdtot'),
    envio: Boolean(field('penv')?.checked), envio_con_iva: Number(value('penvi')) || 0, envio_iva: Number(value('penvv')) || 0, servicio_id: nullIfEmpty(value('pserv')) };
}

function payload(state: EditorState, status: string): Record<string, unknown> {
  const accountBox = document.getElementById('pselmed') as (HTMLElement & { __texto?: string }) | null;
  return {
    id: state.order?.id ?? null, estado: status, fecha: value('pfecha'), canal: value('pcan'),
    cuenta_id: state.account?.id ?? null, cuenta_texto: state.account ? '' : (accountBox?.__texto ?? '').trim(),
    contacto_id: state.customer?.id ?? null, nota: value('pnota').trim(), origen: value('porig'), ...paymentFields(), sin_cargo: isFree(),
    lineas: lines(state), op_id: `p-${Date.now()}`, ...distributorFields(state.distributor),
  };
}

function failureText(result: { error?: string } | null, error: unknown): string {
  if (result?.error === 'facturado') return t('ordersMore.editor.alreadyInvoiced');
  if (result?.error === 'validado') return t('ordersMore.save.noLongerEditable');
  return t('ordersMore.save.couldNotSave', { error: orFallback((error as { message?: string } | null)?.message, t('ordersMore.save.noPermission')) });
}

/** «Reportar» only if ticked (by default, no); it is also turned off if it was on. */
async function saveReport(state: EditorState, id: string): Promise<void> {
  const report = Boolean(field('prepprof')?.checked) && !isCentre();
  if (!report && !state.order?.reportar_profesional) return;
  const { data, error } = await legacyDb().rpc<{ ok?: boolean }>('marcar_reporte', { p_id: id, p_valor: report });
  if (error || data?.ok === false) notices.toast(t('ordersMore.save.reportFailed'), true);
}

function doneText(state: EditorState, status: string): string {
  if (isConfirmedOrder(state)) return t('ordersMore.save.updated');
  if (isFree()) return t(status === STATES.draft ? 'ordersMore.save.freeDraft' : 'ordersMore.save.freeConfirmed');
  if (status === STATES.draft) return t(isBankTransfer(value('ppago')) ? 'ordersMore.save.draftUntilPaid' : 'ordersMore.save.draftSaved');
  return t(state.account ? 'ordersMore.save.confirmedAttributed' : 'ordersMore.save.confirmedUnattributed');
}

function afterSave(state: EditorState, decided: Plan): void {
  notices.toast(doneText(state, decided.status));
  if (decided.withoutMobile) notices.toast(t('ordersMore.save.noMobile', { ofPatient: term('paciente', { article: 'del' }) }));
  if (decided.status === STATES.draft && state.order?.id) void warnIfAmountChanged(state.order.id);
  const screen = currentScreen();
  if (screen === SALES_SCREEN) ordersLegacy.reload();
  if (screen === CUSTOMERS_SCREEN) orderEditorLegacy.repaintCustomers();
  if ((document.getElementById('ficha') as HTMLDialogElement | null)?.open && orderEditorLegacy.customerCardOpen()) orderEditorLegacy.openCustomer(orderEditorLegacy.customerCardOpen());
}

/** guardar_pedido with the button showing «Guardando…»; the id of the order, or null if it failed. */
async function store(state: EditorState, status: string, button: HTMLButtonElement): Promise<string | null> {
  button.disabled = true; const text = button.textContent; button.textContent = t('ordersMore.save.saving');
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean; id?: string; error?: string }>('guardar_pedido', { p: payload(state, status) });
  button.disabled = false; button.textContent = text;
  if (error || result?.ok === false) { notices.toast(failureText(result, error), true); return null; }
  return orFallback(result?.id, state.order?.id ?? '');
}

/** Custom fields, «Reportar» and receipts of the saved order; false if one failed. */
async function storeExtras(state: EditorState, id: string, fields: ReturnType<typeof orderSheetLegacy.readFields>): Promise<boolean> {
  if (fields && !await orderSheetLegacy.saveFields(fields, id)) return false;
  if (id) await saveReport(state, id);
  return !state.receipts.length || orderEditorLegacy.uploadReceipts(id, state.receipts);
}

/** Saves the order as `status` (Borrador or Confirmado). */
export async function saveOrder(state: EditorState, status: string, button: HTMLButtonElement, extra: { options?: SaveOptions; sendLink: (id: string) => Promise<void> }): Promise<void> {
  if (!state.lines.some(line => line.producto_id)) { notices.toast(t('ordersMore.save.addProduct'), true); return; }
  const fields = orderSheetLegacy.readFields(document.getElementById('dbody'));
  if (fields?.falta.length) { notices.toast(t('ordersMore.save.fillIn', { field: fields.falta[0] ?? '' }), true); return; }
  const decided = await plan(state, status, extra.options ?? {}, extra.sendLink); if (!decided) return;
  const id = await store(state, decided.status, button);
  if (id === null || !await storeExtras(state, id, fields)) return;
  (document.getElementById('dlg') as HTMLDialogElement | null)?.close();
  if (decided.options.afterSave) { await decided.options.afterSave(id); return; }
  afterSave(state, decided);
}
