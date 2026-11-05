/**
 * Facturas: what can be done to several invoices at once (D-048, v2.472.0). Invoices are never voided or deleted (they are
 * unalterable: they are corrected with a rectifying invoice). «Registrar cobro» registers, for each invoice, what it still has
 * pending, with today's date and the invoice's payment method, with the same function as its «Registrar cobro» window (the
 * database checks the permission again and never lets a payment go over what is pending).
 */
import { legacyDb } from '../../legacy/bridge';
import { canInvoice } from '../../core/permissions';
import { t } from '../../i18n';
import { todayIso } from '../../services/dates';
import { formatNumber } from '../../services/format';
import { round2 } from '../../services/money';
import { outcomeOf } from '../../components/list-bar/selection/outcome';
import type { BulkAction, SelectableRow, SelectionConfig } from '../../components/list-bar/selection/types';
import { reloadInvoiceRows } from './index';
import { PAYMENT } from './model';

interface ListedInvoice { id: string; total: number; cobrado: number; estado_cobro: string; forma_pago?: string | null }

const CENT = 0.005;

const invoiceOf = (row: SelectableRow): ListedInvoice => row.data as ListedInvoice;
const pendingOf = (invoice: ListedInvoice): number => round2((Number(invoice.total) || 0) - (Number(invoice.cobrado) || 0));

function blocker(row: SelectableRow): string | null {
  const invoice = invoiceOf(row);
  if (invoice.estado_cobro === PAYMENT.paid) return t('invoicesBulk.paid');
  return Math.abs(pendingOf(invoice)) < CENT ? t('invoicesBulk.nothingPending') : null;
}

function registerPayments(): BulkAction {
  return { id: 'payment', label: t('invoicesBulk.payment.label'), allowed: canInvoice, blocker,
    confirm: (count, skipped) => ({ titulo: t('invoicesBulk.payment.title'), texto: t('invoicesBulk.payment.text', { count: formatNumber(count) }) + skipped, ok: t('invoicesBulk.payment.ok', { count: formatNumber(count) }) }),
    runOne: async row => {
      const invoice = invoiceOf(row);
      return outcomeOf(await legacyDb().rpc('registrar_cobro', { p_factura: row.id, p_importe: pendingOf(invoice), p_fecha: todayIso(), p_forma: invoice.forma_pago ?? null, p_nota: null }), { excede: t('invoicesBulk.nothingPending') });
    },
    progress: t('invoicesBulk.payment.progress'), done: t('invoicesBulk.payment.done') };
}

export const invoiceSelection = (): SelectionConfig => ({
  key: 'facturas',
  shape: { table: '#flista .dgrid', head: '#flista .dgrid > .dh', rows: '#flista .dgrid > .dr[data-fac]', idKey: 'fac' },
  what: () => t('listBar.sales.invoices'),
  one: () => t('invoicesBulk.one'),
  feminine: true,
  actions: () => [registerPayments()],
  reload: () => { void reloadInvoiceRows(); },
});
