/**
 * The purchase order window: supplier, dates, product lines with their cost, shipping and note; saving it as a draft, marking it
 * sent or in transit, cancelling it and receiving the goods. Migrated from the legacy editorCompra (v2.409.0); editorCompra stays as
 * an adapter (Inicio, the alerts, Pedidos and legado 058, which opens it in the wide window, call it by that name).
 */
import { callRpc, currentScreen, legacyDb, notices, purchasesLegacy } from '../../legacy/bridge';
import { t } from '../../i18n';
import { addDays, todayIso } from '../../services/dates';
import { nonZeroOr } from '../../services/values';
import { editorHtml, totalsHtml, type PurchaseEditor } from './editor-view';
import { DEFAULT_LEAD_DAYS, EDITABLE_STATES, errorText, STATES, type Purchase, type PurchaseDetail, type PurchaseLine } from './model';
import { receivePurchase } from './receive';

const input = (id: string): HTMLInputElement | null => document.getElementById(id) as HTMLInputElement | null;
const value = (id: string): string => input(id)?.value ?? '';
const closeWindow = (): void => { (document.getElementById('dlg') as HTMLDialogElement | null)?.close(); };

function newLine(): PurchaseLine {
  const first = purchasesLegacy.products()[0];
  return { ...(first ? { producto_id: first.id } : {}), unidades: 1, coste_unitario: first?.coste };
}

function paintTotals(editor: PurchaseEditor): void {
  const box = document.getElementById('cptot');
  if (box) box.innerHTML = totalsHtml(editor.lines, Number(value('cpport')) || 0);
}

/** A change in a line: the product brings its cost (and repaints), the rest only updates the totals. */
function onLineChange(editor: PurchaseEditor, target: HTMLInputElement): void {
  const [index = '', field = ''] = (target.dataset.cl ?? '').split('|'), line = editor.lines[Number(index)];
  if (!field || !line) return;
  if (field === 'producto_id') {
    line.producto_id = target.value;
    const product = purchasesLegacy.products().find(item => item.id === target.value);
    if (product && product.coste !== null && product.coste !== undefined) { line.coste_unitario = product.coste; paint(editor); return; }
  } else if (field === 'unidades') line.unidades = Number(target.value);
  else line.coste_unitario = Number(target.value);
  paintTotals(editor);
}

/** Without an expected date, the supplier's usual lead time sets it. */
function suggestExpected(): void {
  const supplier = document.getElementById('cpprov') as HTMLSelectElement | null, expected = input('cpprev');
  if (!supplier || !expected || expected.value) return;
  expected.value = addDays(value('cpfecha') || todayIso(), nonZeroOr(Number(supplier.selectedOptions[0]?.dataset.plazo), DEFAULT_LEAD_DAYS));
}

function bindLines(editor: PurchaseEditor): void {
  const lines = document.getElementById('cplin');
  if (lines) lines.oninput = lines.onchange = (event: Event): void => { onLineChange(editor, event.target as HTMLInputElement); };
  const shipping = input('cpport'); if (shipping) shipping.oninput = (): void => { paintTotals(editor); };
  const add = document.getElementById('cpmas'); if (add) add.onclick = (): void => { editor.lines.push(newLine()); paint(editor); };
  lines?.querySelectorAll<HTMLElement>('[data-clx]').forEach(button => { button.onclick = (): void => { editor.lines.splice(Number(button.dataset.clx), 1); paint(editor); }; });
  const supplier = document.getElementById('cpprov') as HTMLSelectElement | null;
  if (supplier) supplier.onchange = suggestExpected;
  if (!value('cpprev') && supplier?.value) suggestExpected();
}

function payload(editor: PurchaseEditor, state: string | undefined): Record<string, unknown> {
  const lines = editor.lines.filter(line => line.producto_id && Number(line.unidades) > 0)
    .map(line => ({ producto_id: line.producto_id, unidades: Number(line.unidades), coste_unitario: line.coste_unitario }));
  return {
    id: editor.id ?? null, proveedor_id: value('cpprov'), fecha: value('cpfecha'), fecha_prevista: value('cpprev'), estado: state ?? editor.purchase.estado,
    portes: value('cpport'), nota: value('cpnota').trim(), lineas: lines,
  };
}

async function save(editor: PurchaseEditor, state?: string): Promise<void> {
  if (!value('cpprov')) { notices.toast(t('purchases.editor.chooseSupplier'), true); return; }
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean; error?: string; numero?: string }>('guardar_compra', { p: payload(editor, state) });
  if (error || !result || result.ok === false) { notices.toast(t('purchases.editor.couldNotSave', { error: errorText(error, result) }), true); return; }
  notices.toast(t('purchases.editor.saved', { number: result.numero ?? '' })); closeWindow();
  if (currentScreen() === 'ventas') purchasesLegacy.reloadSales();
}

/** «En tránsito» and «Cancelar pedido» keep the saved data and only change the state. */
const changeState = (purchase: Purchase, state: string): PromiseLike<{ error: unknown }> => legacyDb().rpc('guardar_compra', { p: {
  id: purchase.id, proveedor_id: purchase.proveedor_id, fecha: purchase.fecha, fecha_prevista: purchase.fecha_prevista, estado: state, portes: purchase.portes, nota: purchase.nota,
} });

async function markInTransit(purchase: Purchase): Promise<void> {
  const { error } = await changeState(purchase, STATES.inTransit);
  if (error) { notices.toast(t('purchases.editor.couldNot'), true); return; }
  notices.toast(t('purchases.editor.markedInTransit')); closeWindow(); purchasesLegacy.reloadSales();
}

async function cancel(purchase: Purchase): Promise<void> {
  if (!await notices.confirm(t('purchases.editor.cancelText'), { titulo: t('purchases.editor.cancelTitle'), ok: t('purchases.editor.cancelOrder'), peligro: true })) return;
  await changeState(purchase, STATES.cancelled);
  notices.toast(t('purchases.editor.cancelled')); closeWindow(); purchasesLegacy.reloadSales();
}

function bindButtons(editor: PurchaseEditor): void {
  const on = (id: string, action: () => void): void => { const button = document.getElementById(id); if (button) button.onclick = action; };
  on('cpguardar', () => { void save(editor); });
  on('cpenviar', () => { void save(editor, STATES.sent); });
  on('cptransito', () => { void markInTransit(editor.purchase); });
  on('cpcancel', () => { void cancel(editor.purchase); });
  on('cprecibir', () => { if (editor.id && editor.detail) receivePurchase(editor.id, editor.detail); });
}

function paint(editor: PurchaseEditor): void {
  const body = document.getElementById('dbody'); if (!body) return;
  body.innerHTML = editorHtml(editor);
  paintTotals(editor);
  if (editor.editable) bindLines(editor);
  bindButtons(editor);
}

/** Opens the purchase order `id`, or a new one (today, one line with the first product). */
export async function editPurchase(id: string | null): Promise<void> {
  await Promise.all([purchasesLegacy.loadProducts(), purchasesLegacy.loadSuppliers(), purchasesLegacy.loadStores()]);
  const detail = id ? (await callRpc<PurchaseDetail>('compra_detalle', { p_id: id })).data : null;
  const purchase: Purchase = detail ? detail.compra : { estado: STATES.draft, fecha: todayIso(), portes: 0 };
  const editor: PurchaseEditor = {
    id, purchase, detail, editable: purchasesLegacy.canBuy() && EDITABLE_STATES.includes(purchase.estado),
    lines: detail ? detail.lineas.map(line => ({ ...line })) : [newLine()],
  };
  paint(editor);
  (document.getElementById('dlg') as HTMLDialogElement | null)?.showModal();
}
