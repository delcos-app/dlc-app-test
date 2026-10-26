/**
 * What the order editor keeps while it is open: the order being changed (if any), its lines, the account and customer, the form values
 * (kept when the window is painted again), the receipts to upload and the custom field values. The price of a line follows its product
 * (or the contract price of the account) until it is written by hand. Migrated from the legacy editorPedidoBase (v2.417.0).
 */
import { term } from '../../../legacy/bridge';
import { orderEditorLegacy, type EditorProduct, type EditorService, type OrderReceipt } from '../../../legacy/orders2-bridge';
import { todayIso } from '../../../services/dates';
import { nonZeroOr, orFallback } from '../../../services/values';
import { round2, STATES, type Order } from '../model';
import type { DistributorChoice } from './distributor';
import { generalVat } from '../../../core/organisation';

export const CHANNELS = { patient: 'paciente', centre: 'centro' } as const;
const WEB_ORIGINS = ['web', 'portal'], MANUAL = 'manual', PERCENT = 'porcentaje';

export interface EditorLine { producto_id: string | null; producto?: string | null; unidades: number | null; importe: number | null; descuento: number | null; iva: number | null; manual?: boolean }
export interface EditorAccount { id: string; nombre?: string; codigo?: string | null }
export interface EditorCustomer { id: string; nombre?: string; cuenta_id?: string | null; medico?: string | null; medico_codigo?: string | null }

export interface EditorForm {
  fecha: string; canal: string; forma_pago: string; descuento: string | number; descuento_tipo: string; nota: string; cuenta_texto: string;
  servicio_id: string; envio: boolean; envio_iva: number; envio_con: number; origen: string; pago_referencia: string; sin_cargo: boolean; reportar: boolean;
}

/** What opens the editor: an order from its window, or a preset (customer, account, lines, origin). */
export interface EditorPreset {
  pedido?: Order | null; lineas?: (Partial<EditorLine> & { cuenta_id?: string | null; medico?: string | null })[] | null;
  medico?: EditorAccount | null; contacto?: (EditorCustomer & { cuenta_id?: string | null }) | null; origen?: string | null;
}

export interface EditorState {
  order: Order | null; lines: EditorLine[]; account: EditorAccount | null; customer: EditorCustomer | null; form: EditorForm;
  receipts: OrderReceipt[]; fieldValues: Record<string, unknown> | null; distributor: DistributorChoice;
}

export const productOf = (id: string | null | undefined): EditorProduct => orderEditorLegacy.product(id);

/** The amount follows the product price × units unless written by hand; the VAT follows the product. */
export function autoAmount(line: EditorLine): void {
  const product = productOf(line.producto_id);
  if (!line.manual && product.precio !== null && product.precio !== undefined) line.importe = round2(product.precio * (Number(line.unidades) || 0));
  if (product.iva !== null && product.iva !== undefined) line.iva = Number(product.iva);
}

export const newLine = (): EditorLine => ({ producto_id: orderEditorLegacy.defaultProduct(), unidades: 1, importe: null, descuento: 0, iva: null });

function linesOf(preset: EditorPreset | null): EditorLine[] {
  if (!preset?.lineas?.length) return [newLine()];
  return preset.lineas.map(line => {
    const product = productOf(line.producto_id), price = product.precio;
    const manual = price === null || price === undefined || round2(price * Number(line.unidades)) !== round2(line.importe);
    return { producto_id: line.producto_id ?? null, producto: line.producto ?? null, unidades: line.unidades ?? null, importe: line.importe ?? null,
      descuento: line.descuento ?? 0, iva: line.iva !== null && line.iva !== undefined ? Number(line.iva) : product.iva ?? null, manual };
  });
}

function accountOf(preset: EditorPreset | null): EditorAccount | null {
  if (preset?.medico) return preset.medico;
  const first = preset?.lineas?.[0];
  if (first?.cuenta_id) return { id: first.cuenta_id, nombre: first.medico ?? '' };
  const customer = preset?.contacto;
  if (!customer?.cuenta_id) return null;
  const fallback = `${term('medico', { capital: 'C' })} ${term('paciente', { article: 'del' })}`;
  return { id: customer.cuenta_id, nombre: orFallback(customer.medico, fallback), codigo: customer.medico_codigo ?? '' };
}

const defaultService = (): EditorService | undefined => orderEditorLegacy.services().find(service => service.por_defecto && service.activo);

function serviceOfOrder(order: Order): Pick<EditorForm, 'servicio_id' | 'envio' | 'envio_iva' | 'envio_con'> {
  const vat = Number(order.envio_iva) || 0, first = orderEditorLegacy.services()[0]?.id ?? '';
  return { servicio_id: orFallback(order.servicio_id, first), envio: true, envio_iva: Number(order.envio_iva), envio_con: round2(Number(order.envio_base) * (1 + vat / 100)) };
}

function serviceFields(order: Order | null): Pick<EditorForm, 'servicio_id' | 'envio' | 'envio_iva' | 'envio_con'> {
  if (order?.envio) return serviceOfOrder(order);
  const service = defaultService(), fallback = { envio_iva: Number(service?.iva ?? generalVat()), envio_con: nonZeroOr(service?.pvp, 0) };
  return order ? { servicio_id: '', envio: false, ...fallback } : { servicio_id: service?.id ?? '', envio: Boolean(service), ...fallback };
}

/** The form of a new order. */
const newForm = (preset: EditorPreset | null): Omit<EditorForm, 'servicio_id' | 'envio' | 'envio_iva' | 'envio_con'> => ({
  fecha: todayIso(), canal: CHANNELS.patient, forma_pago: '', descuento: 0, descuento_tipo: PERCENT, nota: '', cuenta_texto: '',
  origen: WEB_ORIGINS.includes(preset?.origen ?? '') ? preset?.origen ?? MANUAL : MANUAL, pago_referencia: '', sin_cargo: false, reportar: false,
});

/** The form of an existing order. */
const orderForm = (order: Order): Omit<EditorForm, 'servicio_id' | 'envio' | 'envio_iva' | 'envio_con'> => ({
  fecha: order.fecha, canal: order.canal ?? '', forma_pago: order.forma_pago ?? '', descuento: nonZeroOr(order.descuento, 0), descuento_tipo: order.descuento_tipo ?? '',
  nota: order.nota ?? '', cuenta_texto: order.cuenta_texto ?? '', origen: WEB_ORIGINS.includes(order.origen ?? '') ? order.origen ?? MANUAL : MANUAL,
  pago_referencia: order.pago_referencia ?? '', sin_cargo: Boolean(order.sin_cargo), reportar: Boolean(order.reportar_profesional),
});

function formOf(order: Order | null, preset: EditorPreset | null): EditorForm {
  return { ...(order ? orderForm(order) : newForm(preset)), ...serviceFields(order) };
}

/** Whether the order can be edited (not voided, and a confirmed one only while it has no invoice). */
export function editableProblem(order: Order | null): 'invoiced' | 'voided' | null {
  if (!order) return null;
  if (order.estado === STATES.voided) return order.factura_id ? 'invoiced' : 'voided';
  return order.estado !== STATES.draft && order.factura_id ? 'invoiced' : null;
}

export function buildState(preset: EditorPreset | null, distributor: DistributorChoice): EditorState {
  const order = preset?.pedido ?? null, lines = linesOf(preset);
  lines.forEach(line => { if (line.importe === null) autoAmount(line); if (line.iva === null) line.iva = productOf(line.producto_id).iva ?? 0; });
  return { order, lines, account: accountOf(preset), customer: preset?.contacto ?? null, form: formOf(order, preset), receipts: [], fieldValues: null, distributor };
}

const input = (id: string): HTMLInputElement | null => document.getElementById(id) as HTMLInputElement | null;

/** Keeps what was written before the window is painted again. */
export function readForm(state: EditorState): void {
  if (!input('pfecha')) return;
  const text = (id: string): string => input(id)?.value ?? '', form = state.form;
  Object.assign(form, { fecha: text('pfecha'), canal: text('pcan'), forma_pago: text('ppago'), descuento: text('pdto'), descuento_tipo: text('pdtot'), nota: text('pnota'),
    envio: Boolean(input('penv')?.checked), envio_con: Number(text('penvi')) || 0, envio_iva: Number(text('penvv')) || 0, servicio_id: text('pserv') });
  const accountBox = document.getElementById('pselmed') as (HTMLElement & { __texto?: string }) | null;
  if (accountBox) form.cuenta_texto = accountBox.__texto ?? '';
  if (input('porig')) form.origen = text('porig');
  if (input('pref')) form.pago_referencia = text('pref');
  const free = input('psincargo'), report = input('prepprof');
  if (free) form.sin_cargo = free.checked;
  if (report) form.reportar = report.checked;
}
