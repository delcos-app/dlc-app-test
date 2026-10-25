/**
 * The order window: header, customer, professional, lines with their totals, note and the actions (edit, confirm, delete a draft,
 * void). Migrated from the legacy verPedidoBaseBase and verPedidoBase (v2.414.0).
 */
import { appLegacy, callRpc, currentScreen, legacyDb, notices, term } from '../../../legacy/bridge';
import { customersLegacy } from '../../../legacy/customers-bridge';
import { orderSheetLegacy, ordersLegacy } from '../../../legacy/orders-bridge';
import { t } from '../../../i18n';
import { formatShortDate } from '../../../services/date-format';
import { escapeHtml, formatNumber } from '../../../services/format';
import { orFallback } from '../../../services/values';
import { euros, lineBreakdown, paymentPill, round2, STATES, statePill, storedTotals, totalsHtml, type OrderDetail, type OrderLine } from '../model';
import { editNonFiscal } from './non-fiscal';

const dialog = (): HTMLDialogElement | null => document.getElementById('dlg') as HTMLDialogElement | null;
const reloadSales = (): void => { if (currentScreen() === 'ventas') ordersLegacy.reload(); };

/** The reason a save failed: the error's message or the function's answer. */
const failureOf = (error: unknown, result: { error?: string } | null): string => orFallback((error as { message?: string } | null)?.message, result?.error ?? '');

function lineHtml(line: OrderLine): string {
  const amounts = lineBreakdown(line);
  return `<div style="display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-top:1px solid var(--line)">
        <span><b>${escapeHtml(orFallback(line.producto, t('orders.sheet.noProduct')))}</b> · ${t('orders.sheet.units', { count: formatNumber(line.unidades) })}
          <div class="sm">${t('orders.sheet.base', { amount: euros(amounts.base) })}${Number(line.descuento) ? t('orders.sheet.discount', { percent: formatNumber(line.descuento) }) : ''} · ${t('orders.sheet.vat', { rate: formatNumber(line.iva ?? 0), amount: euros(amounts.iva) })}</div></span>
        <b style="white-space:nowrap">${euros(amounts.total)}</b></div>`;
}

function peopleHtml(detail: OrderDetail): string {
  const contact = detail.contacto, professional = detail.medico, firstLine = (detail.lineas ?? [])[0];
  return `${contact ? `<div class="blk"><h3>${term('paciente', { capital: 'C' })}</h3><div><b>${escapeHtml(contact.nombre)}</b></div>
      <div class="sm">${escapeHtml(orFallback(contact.telefono, contact.movil ?? ''))} ${escapeHtml(contact.email ?? '')}</div>
      <div class="acts"><button class="btn sec" data-vpac="${contact.id}">${t('orders.sheet.seeCustomer', { customer: term('paciente', { article: 'del' }) })}</button></div></div>` : ''}
    ${professional ? `<div class="blk"><h3>${term('medico', { capital: 'C' })}</h3><div><b>${escapeHtml(professional.nombre)}</b> <span class="sm">${t('orders.sheet.code', { code: escapeHtml(professional.codigo) })}</span></div>
      ${firstLine?.comercial ? `<div class="sm">${t('orders.sheet.salesperson', { name: escapeHtml(firstLine.comercial) })}</div>` : ''}</div>` : ''}`;
}

function actionsHtml(detail: OrderDetail): string {
  const order = detail.pedido, draft = order.estado === STATES.draft, open = !draft && order.estado !== STATES.voided, can = customersLegacy.canSell();
  const editButton = order.factura_id ? `<button class="btn sec" id="pdeditnf">${t('orders.sheet.editData')}</button>` : `<button class="btn sec" id="pdeditar">${t('orders.sheet.editOrder')}</button>`;
  return `<div class="acts u-end">
      ${can && draft ? `<button class="btn sec dang" id="pdborrar">${t('orders.sheet.deleteDraft')}</button>
        <button class="btn sec" id="pdeditar">${t('orders.sheet.edit')}</button>
        <button class="btn" id="pdvalidar">${t('orders.sheet.confirm')}</button>` : ''}
      ${can && open ? editButton : ''}
      ${can && open ? `<button class="btn sec dang" id="pdanular">${t('orders.sheet.void')}</button>` : ''}
      <button class="btn sec" data-cerrar>${t('common.close')}</button></div>`;
}

function sheetHtml(detail: OrderDetail): string {
  const order = detail.pedido, totals = storedTotals(detail), lines = detail.lineas ?? [];
  return `
    <div class="fh pdcab"><div class="pdcabt"><h2>${t('orders.sheet.title')}${order.numero ? ` ${escapeHtml(order.numero)}` : ''}</h2>${statePill(order.estado)}${paymentPill(order)}
      <span class="sm pdmeta">${formatShortDate(order.fecha)} · ${ordersLegacy.channelLabel(order, totals.total)}${order.forma_pago ? ` · ${escapeHtml(order.forma_pago)}` : ''}</span></div>
      <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
    ${order.estado === STATES.draft ? `<div class="cacheaviso u-mt-10">${t('orders.sheet.draftNotice')}</div>` : ''}
    ${peopleHtml(detail)}
    <div class="blk"><h3>${t('orders.sheet.lines')}</h3>
      ${lines.map(lineHtml).join('') || `<div class="sm">${t('orders.sheet.noLines')}</div>`}
      <div class="totbox">${totalsHtml(totals)}</div></div>
    ${order.nota ? `<div class="blk"><h3>${t('orders.sheet.note')}</h3><div>${escapeHtml(order.nota)}</div></div>` : ''}
    ${actionsHtml(detail)}`;
}

/** What «Confirmar pedido» saves: the draft as it is, confirmed. */
function confirmPayload(detail: OrderDetail): Record<string, unknown> {
  const order = detail.pedido, rate = Number(order.envio_iva) || 0;
  return {
    id: order.id, estado: STATES.confirmed, fecha: order.fecha, canal: order.canal, contacto_id: order.contacto_id, centro_id: order.centro_id,
    cuenta_id: detail.medico ? detail.medico.id : null, cuenta_texto: order.cuenta_texto, nota: order.nota, forma_pago: order.forma_pago, pago_referencia: order.pago_referencia ?? '',
    descuento: order.descuento ?? 0, descuento_tipo: order.descuento_tipo,
    envio: Boolean(order.envio), envio_con_iva: order.envio ? round2(Number(order.envio_base) * (1 + rate / 100)) : 0, envio_iva: order.envio_iva, servicio_id: order.servicio_id,
    lineas: (detail.lineas ?? []).map(line => ({ producto_id: line.producto_id, unidades: line.unidades, importe: line.importe, descuento: line.descuento, iva: line.iva })),
  };
}

async function confirmOrder(detail: OrderDetail, button: HTMLButtonElement): Promise<void> {
  // v2.314.0: «Cobrado · confirmar» of a bank transfer marks it paid too
  const paid = Boolean(button.dataset.pago);
  if (!await notices.confirm((paid ? t('orders.sheet.paymentNoted') : '') + t('orders.sheet.confirmText'), { titulo: t('orders.sheet.confirmTitle'), ok: t('orders.sheet.confirmOk') })) return;
  button.disabled = true;
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean; error?: string }>('guardar_pedido', { p: confirmPayload(detail) });
  button.disabled = false;
  if (error || result?.ok === false) { notices.toast(t('orders.sheet.couldNotConfirm', { error: failureOf(error, result) }), true); return; }
  const id = detail.pedido.id;
  if (paid) await legacyDb().rpc('marcar_operativa', { p_pedido: id, p_campo: 'pago', p_hecho: true });
  notices.toast(t(paid ? 'orders.sheet.confirmedAndPaid' : 'orders.sheet.confirmed')); appLegacy.openOrder(id); reloadSales();
}

async function deleteDraft(id: string): Promise<void> {
  if (!await notices.confirm(t('orders.sheet.deleteText'), { titulo: t('orders.sheet.deleteTitle'), ok: t('orders.sheet.deleteOk'), peligro: true })) return;
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean; error?: string }>('borrar_pedido', { p_id: id });
  if (error || result?.ok === false) { notices.toast(t(result?.error === 'validado' ? 'orders.sheet.onlyDrafts' : 'orders.sheet.couldNotDelete'), true); return; }
  dialog()?.close(); notices.toast(t('orders.sheet.deleted')); reloadSales();
}

async function voidOrder(id: string): Promise<void> {
  const reason = await orderSheetLegacy.askText(t('orders.sheet.voidReason'), '', { titulo: t('orders.sheet.voidTitle'), ok: t('orders.sheet.voidOk') });
  if (reason === null) return;
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean; error?: string }>('anular_pedido', { p_id: id, p_motivo: reason || null });
  if (error || result?.ok === false) { notices.toast(result?.error === 'facturado' ? t('orders.sheet.voidInvoiced') : t('orders.sheet.couldNotVoid', { error: failureOf(error, result) }), true); return; }
  dialog()?.close(); notices.toast(t('orders.sheet.voided')); reloadSales();
}

function bind(body: HTMLElement, detail: OrderDetail): void {
  const id = detail.pedido.id, on = (elementId: string, action: (button: HTMLButtonElement) => void): void => {
    const button = document.getElementById(elementId) as HTMLButtonElement | null; if (button) button.onclick = (): void => { action(button); };
  };
  // The customer's card opens on top, without closing the order
  const customer = body.querySelector<HTMLElement>('[data-vpac]');
  if (customer) customer.onclick = (): void => { orderSheetLegacy.openCustomer(customer.dataset.vpac ?? ''); };
  on('pdeditar', () => { orderSheetLegacy.edit(detail); });
  on('pdeditnf', () => { editNonFiscal(detail); });
  on('pdborrar', () => { void deleteDraft(id); });
  on('pdvalidar', button => { void confirmOrder(detail, button); });
  on('pdanular', () => { void voidOrder(id); });
}

/** Opens the window with the order (null if it is not found). */
export async function paintBase(id: string): Promise<OrderDetail | null> {
  const body = document.getElementById('dbody');
  customersLegacy.showLoading(body, t('orders.sheet.opening'));
  dialog()?.showModal();
  const { data, error } = await callRpc<OrderDetail>('pedido_detalle', { p_id: id });
  if (!body) return null;
  if (error || !data?.pedido) {
    body.innerHTML = `<div class="vacio">${escapeHtml(error ? (error as { message?: string }).message : t('orders.sheet.notFound'))}</div>`;
    return null;
  }
  body.innerHTML = sheetHtml(data);
  bind(body, data);
  return data;
}
