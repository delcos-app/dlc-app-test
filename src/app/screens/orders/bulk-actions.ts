/**
 * Pedidos: what can be done to several orders at once (D-048, v2.472.0; docs/seleccion_listas.md). Every action calls the same
 * single-item function the order window uses, once per order, and the database checks the permission and the rule of each one
 * again. The rules here only decide which selected orders are skipped and why (said before and after). E2 A: «Marcar preparado»
 * sends no email. E7 A: invoices are issued with today's date and the default series, as «Emitir factura» of the order does.
 */
import { legacyDb, term } from '../../legacy/bridge';
import { coreLegacy } from '../../legacy/core-bridge';
import { askText } from '../../components/dialogs';
import { canInvoice, canSell, levelOf } from '../../core/permissions';
import { marksReportedOrders } from '../../core/rules';
import { t } from '../../i18n';
import { formatNumber } from '../../services/format';
import { outcomeOf } from '../../components/list-bar/selection/outcome';
import type { Answer, BulkAction, Confirmation, ItemOutcome, SelectableRow, SelectionConfig } from '../../components/list-bar/selection/types';
import { paintOrderList } from './index';
import { orderStep, STATES, stepCode, type Order } from './model';

const SALES_LEVEL = 2;

const orderOf = (row: SelectableRow): Order => row.data as Order;

/** The operations of the order window (paid, packed, invoice, sent, report): administration, or who sees everything with Ventas 2. */
const runsOperations = (): boolean => canInvoice();
/** Void and delete, like the order window: who sells, with Ventas 2 or more. */
const changesOrders = (): boolean => canSell() && levelOf('V') >= SALES_LEVEL;

/** «en Borrador»: the step the order is at, in words. */
const isAt = (row: SelectableRow): string => t('ordersBulk.isAt', { step: orderStep(orderOf(row))[0] });

const atStep = (step: string) => (row: SelectableRow): string | null => (stepCode(orderOf(row)) === step ? null : isAt(row));

async function call(name: string, args: Record<string, unknown>, reasons: Readonly<Record<string, string>> = {}): Promise<ItemOutcome> {
  const answer = await legacyDb().rpc(name, args);
  return outcomeOf(answer, reasons);
}

const count = (value: number): string => formatNumber(value);

/** The confirmation of an action from its texts (title, text and button with the count). */
const confirmOf = (key: 'packed' | 'invoice' | 'paid' | 'sent' | 'delete', extra: Record<string, string> = {}) => (total: number, skipped: string): Confirmation =>
  ({ titulo: t(`ordersBulk.${key}.title`), texto: t(`ordersBulk.${key}.text`, { count: count(total), ...extra }) + skipped, ok: t(`ordersBulk.${key}.ok`, { count: count(total) }) });

function markPacked(): BulkAction {
  return { id: 'packed', label: t('ordersBulk.packed.label'), allowed: runsOperations, blocker: atStep('por_preparar'), confirm: confirmOf('packed'),
    runOne: row => call('marcar_operativa', { p_pedido: row.id, p_campo: 'paquete', p_hecho: true }),
    progress: t('ordersBulk.packed.progress'), done: t('ordersBulk.packed.done') };
}

function issueInvoice(): BulkAction {
  const reasons = { sin_serie: t('ordersBulk.invoice.noSeries'), ya_facturado: t('ordersBulk.invoice.already'), sin_cargo: t('ordersBulk.invoice.free'), distribuidor: t('ordersBulk.invoice.distributor') };
  return { id: 'invoice', label: t('ordersBulk.invoice.label'), allowed: runsOperations,
    blocker: row => (orderOf(row).factura_distribuidor ? t('ordersBulk.invoice.distributor') : atStep('por_facturar')(row)), confirm: confirmOf('invoice'),
    runOne: row => call('emitir_factura', { p_pedido: row.id }, reasons),
    progress: t('ordersBulk.invoice.progress'), done: t('ordersBulk.invoice.done') };
}

function markPaid(): BulkAction {
  return { id: 'paid', label: t('ordersBulk.paid.label'), allowed: runsOperations, blocker: atStep('por_cobrar'), confirm: confirmOf('paid'),
    runOne: row => call('marcar_operativa', { p_pedido: row.id, p_campo: 'pago', p_hecho: true }),
    progress: t('ordersBulk.paid.progress'), done: t('ordersBulk.paid.done') };
}

/** «Factura enviada» without sending anything (for the invoices sent some other way). */
function markSent(): BulkAction {
  const blocker = (row: SelectableRow): string | null => {
    const order = orderOf(row);
    if (order.estado !== STATES.confirmed || !order.factura) return t('ordersBulk.sent.noInvoice');
    return order.email_factura_en ? t('ordersBulk.sent.already') : null;
  };
  return { id: 'sent', label: t('ordersBulk.sent.label'), allowed: runsOperations, blocker, confirm: confirmOf('sent'),
    runOne: row => call('marcar_operativa', { p_pedido: row.id, p_campo: 'email_factura', p_hecho: true }),
    progress: t('ordersBulk.sent.progress'), done: t('ordersBulk.sent.done') };
}

/** «Reportado al profesional»: only when the portal shows the marked orders (PPR-1). */
function markReported(): BulkAction {
  const toThe = term('medico', { article: 'al' });
  return { id: 'report', label: t('ordersBulk.report.label'), allowed: () => runsOperations() && marksReportedOrders(),
    blocker: row => (orderOf(row).estado === STATES.confirmed ? null : isAt(row)),
    confirm: (total, skipped) => ({ titulo: t('ordersBulk.report.title'), texto: t('ordersBulk.report.text', { count: count(total), toTheProfessional: toThe }) + skipped, ok: t('ordersBulk.report.ok', { count: count(total) }) }),
    runOne: row => call('marcar_reporte', { p_id: row.id, p_valor: true }),
    progress: t('ordersBulk.report.progress'), done: t('ordersBulk.report.done') };
}

async function askVoidReason(): Promise<Answer | null> {
  const reason = await askText(t('ordersBulk.void.reason'), '', { titulo: t('ordersBulk.void.title'), ok: t('ordersBulk.void.reasonOk') });
  return reason === null ? null : { value: reason.trim() || null, label: reason.trim() || t('ordersBulk.void.noReason') };
}

function voidOrders(): BulkAction {
  return { id: 'void', label: t('ordersBulk.void.label'), danger: true, allowed: changesOrders,
    blocker: row => { const order = orderOf(row); return order.estado !== STATES.confirmed ? isAt(row) : order.factura ? t('ordersBulk.invoiced') : null; },
    ask: askVoidReason,
    confirm: (total, skipped, answer) => ({ titulo: t('ordersBulk.void.title'), texto: t('ordersBulk.void.text', { count: count(total), reason: answer?.label ?? '' }) + skipped, ok: t('ordersBulk.void.ok', { count: count(total) }) }),
    runOne: (row, answer) => call('anular_pedido', { p_id: row.id, p_motivo: answer?.value ?? null }, { facturado: t('ordersBulk.invoiced') }),
    progress: t('ordersBulk.void.progress'), done: t('ordersBulk.void.done') };
}

function deleteDrafts(): BulkAction {
  return { id: 'delete', label: t('ordersBulk.delete.label'), danger: true, allowed: changesOrders,
    blocker: row => (orderOf(row).estado === STATES.draft ? null : isAt(row)), confirm: confirmOf('delete'),
    runOne: row => call('borrar_pedido', { p_id: row.id }, { validado: isAt(row) }),
    progress: t('ordersBulk.delete.progress'), done: t('ordersBulk.delete.done') };
}

export const orderSelection = (): SelectionConfig => ({
  key: 'pedidos',
  shape: { table: '#pedlista .dgrid', head: '#pedlista .dgrid > .dh', rows: '#pedlista .dgrid > .dr[data-ped]', idKey: 'ped' },
  what: () => t('listBar.sales.orders'),
  one: () => t('ordersBulk.one'),
  actions: () => [markPacked(), issueInvoice(), markPaid(), markSent(), markReported(), voidOrders(), deleteDrafts()],
  // The cached pages and indicators are stale after writing: forget them, then paint again
  reload: () => { coreLegacy.forgetReadCache(); void paintOrderList(); },
});
