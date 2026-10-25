/**
 * Pedidos: the order and line shapes, their totals (lines, general discount, shipping service and VAT by rate), the state and step
 * pills, the operations (paid, packed, emails) and the transfer states with the distributor. Migrated from the legacy
 * totalesPedido, lineaDesglose, bloqueTotales, pillEstado, pasoPedido, pillPaso, sinCargoP, OPS and TRF_EST (v2.414.0).
 */
import { ordersLegacy } from '../../legacy/orders-bridge';
import { t, type MessageKey } from '../../i18n';
import { escapeHtml, formatCurrency, formatNumber } from '../../services/format';
import { sum } from '../../services/values';

/** States stored in the database. */
export const STATES = { draft: 'Borrador', confirmed: 'Confirmado', voided: 'Anulado' } as const;
const PAID = 'Cobrado', FREE = 'Sin cargo', PENDING_PAYMENT = 'Pendiente de cobro';

export interface OrderLine { producto_id?: string | null; producto?: string | null; nombre?: string | null; unidades: number; importe: number; descuento?: number | null; iva?: number | null; comercial?: string | null; cuenta_id?: string | null }
export interface Order {
  id: string; numero?: string | null; estado: string; fecha: string; canal?: string | null; forma_pago?: string | null; nota?: string | null;
  contacto_id?: string | null; centro_id?: string | null; cuenta_texto?: string | null; pago_referencia?: string | null; pago_estado?: string | null;
  descuento?: number | null; descuento_tipo?: string | null; envio?: boolean | null; envio_base?: number | null; envio_iva?: number | null; servicio_id?: string | null;
  sin_cargo?: boolean | null; factura_id?: string | null; factura?: string | null; origen?: string | null; paquete_en?: string | null; email_pago_en?: string | null;
  email_factura_en?: string | null; reportar_profesional?: boolean | null; completado?: boolean | null; unidades?: number | null; total?: number | null;
  distribuidor_id?: string | null; distribuidor_codigo?: string | null; factura_distribuidor?: boolean | null; transfer_estado?: string | null;
  transfer_nota?: string | null; transfer_enviado_en?: string | null; clasificadores?: Record<string, unknown> | null;
}
export interface OrderContact { id: string; nombre: string; telefono?: string | null; movil?: string | null; email?: string | null; direccion?: string | null; cp?: string | null; municipio?: string | null; nif?: string | null }
export interface OrderDetail { pedido: Order; lineas?: OrderLine[] | null; contacto?: OrderContact | null; medico?: { id: string; nombre: string; codigo?: string | null } | null; totales?: { total?: number | null } | null }

/** Rounded to cents, like the legacy r2. */
export const round2 = (value: unknown): number => Math.round((Number(value) || 0) * 100) / 100;

/** Euros with cents, like the legacy eurI. */
export const euros = (value: unknown): string => formatCurrency(round2(value));

export interface LineBreakdown { bruto: number; base: number; iva: number; total: number }

export function lineBreakdown(line: OrderLine): LineBreakdown {
  const gross = Number(line.importe) || 0, base = gross * (1 - (Number(line.descuento) || 0) / 100), vat = base * (Number(line.iva) || 0) / 100;
  return { bruto: gross, base, iva: vat, total: base + vat };
}

export interface Shipping { on: boolean; con: number; iva: number; nombre?: string }
interface ShippingTotals { con: number; iva: number; base: number; nombre: string; ivaImp: number }
export interface OrderTotals { unidades: number; bruto: number; descuento: number; baseProd: number; porIva: Record<string, number>; envio: ShippingTotals | null; base: number; iva: number; total: number }

/** The service is written with VAT: its base and VAT are separated here. */
function shippingTotals(shipping: Shipping | null | undefined): ShippingTotals | null {
  if (!shipping?.on) return null;
  const withVat = round2(shipping.con), rate = Number(shipping.iva) || 0, base = (Number(shipping.con) || 0) / (1 + rate / 100);
  return { con: withVat, iva: rate, base, nombre: shipping.nombre ?? t('orders.totals.shipping'), ivaImp: withVat - base };
}

/** Totals of some lines with a general discount (percentage or amount) and an optional shipping service. */
export function orderTotals(lines: readonly OrderLine[], discount: number, discountType: string | null | undefined, shipping?: Shipping | null): OrderTotals {
  const items = lines.map(line => ({ base: (Number(line.importe) || 0) * (1 - (Number(line.descuento) || 0) / 100), rate: Number(line.iva) || 0, units: Number(line.unidades) || 0 }));
  const gross = sum(items.map(item => item.base));
  const factor = !Number(discount) || !gross ? 1 : discountType === 'importe' ? Math.max(0, 1 - discount / gross) : Math.max(0, 1 - discount / 100);
  const byRate: Record<string, number> = {};
  items.forEach(item => { byRate[item.rate] = (byRate[item.rate] ?? 0) + item.base * factor * item.rate / 100; });
  const service = shippingTotals(shipping);
  if (service) byRate[service.iva] = (byRate[service.iva] ?? 0) + service.ivaImp;
  const base = gross * factor + (service ? service.base : 0), vat = sum(Object.values(byRate));
  return { unidades: sum(items.map(item => item.units)), bruto: gross, descuento: gross * (1 - factor), baseProd: gross * factor, porIva: byRate, envio: service, base, iva: vat, total: base + vat };
}

const totalRow = (label: string, value: string): string => `<div><span>${label}</span><b>${value}</b></div>`;

/** The totals box: units, discount, shipping, base, VAT by rate and total. */
export function totalsHtml(totals: OrderTotals): string {
  const rates = Object.keys(totals.porIva).sort((first, second) => Number(first) - Number(second));
  const service = totals.envio;
  return `${totalRow(t('orders.totals.units'), formatNumber(totals.unidades))}
    ${totals.descuento > 0.004 ? `${totalRow(t('orders.totals.linesSum'), euros(totals.bruto))}
      ${totalRow(t('orders.totals.generalDiscount'), `−${euros(totals.descuento)}`)}` : ''}
    ${service ? `${totalRow(t('orders.totals.productsWithoutVat'), euros(totals.baseProd))}
      ${totalRow(t('orders.totals.serviceWithoutVat', { name: escapeHtml(service.nombre) }), euros(service.base))}` : ''}
    ${totalRow(t('orders.totals.taxBase'), euros(totals.base))}
    ${rates.filter(rate => (totals.porIva[rate] ?? 0) > 0.004 || rates.length === 1).map(rate => totalRow(t('orders.totals.vatRate', { rate }), euros(totals.porIva[rate]))).join('')}
    ${service ? `<div class="sm u-end"><span>${t('orders.totals.includesService', { name: escapeHtml(service.nombre.toLowerCase()), amount: euros(service.con) })}</span></div>` : ''}
    <div class="tot"><span>${t('orders.totals.total')}</span><b>${euros(totals.total)}</b></div>`;
}

/** The totals of an order as stored (its shipping is stored without VAT). */
export function storedTotals(detail: OrderDetail): OrderTotals {
  const order = detail.pedido, rate = Number(order.envio_iva) || 0;
  const service = ordersLegacy.services().find(item => item.id === order.servicio_id);
  return orderTotals(detail.lineas ?? [], Number(order.descuento) || 0, order.descuento_tipo,
    { on: Boolean(order.envio), con: round2(Number(order.envio_base) * (1 + rate / 100)), iva: rate, nombre: service?.nombre ?? t('orders.totals.shipping') });
}

export const statePill = (state: string): string =>
  `<span class="pill ${state === STATES.draft ? 'p-bor' : state === STATES.voided ? 'p-anu' : 'p-est'}">${escapeHtml(state)}</span>`;

/** A free delivery: marked so, or at 0 € with units (also the old ones at 100 % discount). */
export function isFree(order: Partial<Order> | null | undefined, total?: number | null): boolean {
  if (!order) return false;
  if (order.sin_cargo) return true;
  if (total === null || total === undefined || Math.abs(Number(total)) >= 0.005) return false;
  return order.unidades === null || order.unidades === undefined || Number(order.unidades) > 0;
}

export const isBankTransfer = (paymentMethod: string | null | undefined): boolean => /transfer/i.test(paymentMethod ?? '');

const paymentOf = (order: Partial<Order>): string => ordersLegacy.paymentState(order);

/** «Cobrado», «Sin cargo» or «Pendiente de cobro» next to a confirmed order's state. */
export function paymentPill(order: Order): string {
  if (order.estado !== STATES.confirmed) return '';
  const payment = paymentOf(order);
  return ` <span class="pill ${payment === PAID ? 'p-trfok' : payment === FREE ? 'p-sr' : 'p-bor'}">${payment}</span>`;
}

type Step = [MessageKey, string];

function confirmedStep(order: Partial<Order>): Step {
  const onDelivery = /reembolso/i.test(order.forma_pago ?? ''), toCollect = paymentOf(order) === PENDING_PAYMENT;
  if (toCollect && !onDelivery) return ['orders.steps.toCollect', 'p-bor'];
  if (!order.paquete_en) return ['orders.steps.toPack', 'p-est'];
  if (toCollect) return ['orders.steps.toCollect', 'p-bor'];
  if (order.completado === false || (!order.factura && !order.factura_id && paymentOf(order) !== FREE)) return ['orders.steps.toInvoice', 'p-est'];
  return ['orders.steps.completed', 'p-trfok'];
}

/** The step an order is at: [text, pill class]. */
export function orderStep(order: Partial<Order>): [string, string] {
  let step: Step;
  if (order.estado === STATES.voided) step = ['orders.steps.voided', 'p-anu'];
  else if (order.estado === STATES.draft) step = order.email_pago_en ? ['orders.steps.awaitingPayment', 'p-bor'] : ['orders.steps.draft', 'p-sr'];
  // v2.351.0: the same rule as the figures (pedido_completado)
  else if (order.completado === true) step = ['orders.steps.completed', 'p-trfok'];
  else step = confirmedStep(order);
  return [t(step[0]), step[1]];
}

export function stepPill(order: Partial<Order>): string {
  const [text, pillClass] = orderStep(order);
  const done = order.estado === STATES.confirmed
    ? [t('orders.steps.doneConfirmed'), order.paquete_en ? t('orders.steps.donePacked') : '', paymentOf(order) === PAID ? t('orders.steps.donePaid') : '', order.factura ? t('orders.steps.doneInvoiced') : ''].filter(Boolean).join(' · ')
    : '';
  return `<span class="pill ${pillClass}"${done ? ` title="${t('orders.steps.done', { steps: done })}"` : ''}>${text}</span>`;
}

/** Operations of a confirmed order: [key, label key, column]. */
export const OPERATIONS: readonly (readonly [string, MessageKey, keyof Order])[] = [
  ['pago', 'orders.operations.paid', 'pago_estado'], ['paquete', 'orders.operations.packed', 'paquete_en'],
  ['email_factura', 'orders.operations.invoiceEmail', 'email_factura_en'], ['email_pago', 'orders.operations.paymentEmail', 'email_pago_en'],
];

export function operationDone(order: Order, key: string): boolean {
  if (key === 'pago') return order.pago_estado === PAID;
  const column = OPERATIONS.find(operation => operation[0] === key)?.[2];
  return Boolean(column && order[column]);
}

/** Transfer states with the distributor (stored values). */
export const TRANSFER_STATES = ['Enviado', 'Aceptado', 'Servido', 'Incidencia'] as const;
const TRANSFER_SERVED = 'Servido';
export const TRANSFER_ISSUE = 'Incidencia';

export const transferPill = (state: string | null | undefined): string =>
  (state ? `<span class="pill ${state === TRANSFER_SERVED ? 'p-trfok' : state === TRANSFER_ISSUE ? 'p-urg' : 'p-per'}">${escapeHtml(state)}</span>` : `<span class="pill">${t('orders.transfer.notSent')}</span>`);

