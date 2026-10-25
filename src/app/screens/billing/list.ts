/**
 * Facturación → «Facturas»: period, search and payment filters, the totals (invoiced, base, VAT, to collect, overdue) and the
 * paged list. Migrated from the legacy pintarFacturas (v2.413.0). The page number stays in the legacy FACPAG (legado 107 resets it).
 */
import { accountListLegacy, currentScreen, legacyDb, opportunitiesLegacy } from '../../legacy/bridge';
import { billingLegacy } from '../../legacy/billing-bridge';
import { t } from '../../i18n';
import { formatShortDate } from '../../services/date-format';
import { escapeHtml, formatNumber } from '../../services/format';
import { orFallback, sum } from '../../services/values';
import { errorMessage, euros, PAYMENT, paymentPill } from './model';

const SEARCH_WAIT_MS = 300;

interface InvoiceRow {
  id: string; numero: string; fecha: string; cliente?: string | null; nif?: string | null; base: number; cuota_iva: number; total: number; cobrado: number;
  vencimiento?: string | null; estado_cobro: string; rectifica?: string | null; rectificada_por?: string | null;
}

/** '' or missing → null (the RPC takes null for «no filter»). */
const emptyToNull = (value: string | undefined): string | null => (value ? value : null);
const field = (id: string): HTMLInputElement | null => document.getElementById(id) as HTMLInputElement | null;
const total = (rows: readonly InvoiceRow[], key: 'total' | 'base' | 'cuota_iva' | 'cobrado'): number => sum(rows.map(row => Number(row[key]) || 0));

function shellHtml(): string {
  const options = ['', PAYMENT.pending, PAYMENT.overdue, PAYMENT.paid].map(value => (value ? `<option>${value}</option>` : `<option value="">${t('billing.list.all')}</option>`)).join('');
  return `<div class="panel">
    <div class="filtros">
      <div id="fper"></div>
      <div><label for="fq">${t('billing.list.search')}</label><input id="fq" type="search" placeholder="${t('billing.list.searchPlaceholder')}"></div>
      <div><label for="fcob">${t('billing.list.payment')}</label><select id="fcob">${options}</select></div>
    </div>
    <div class="kpis vtot" id="ftot"></div>
    <div id="flista"></div></div>`;
}

function totalsHtml(rows: readonly InvoiceRow[]): string {
  const pending = rows.filter(row => row.estado_cobro !== PAYMENT.paid), overdue = rows.filter(row => row.estado_cobro === PAYMENT.overdue);
  return `
      <div class="kpi"><b>${euros(total(rows, 'total'))}</b><span>${t('billing.list.invoiced', { count: formatNumber(rows.length) })}</span></div>
      <div class="kpi"><b>${euros(total(rows, 'base'))}</b><span>${t('billing.list.taxBase')}</span></div>
      <div class="kpi"><b>${euros(total(rows, 'cuota_iva'))}</b><span>${t('billing.list.vat')}</span></div>
      <div class="kpi"><b>${euros(total(pending, 'total') - total(pending, 'cobrado'))}</b><span>${t('billing.list.toCollect', { count: formatNumber(pending.length) })}</span></div>
      <div class="kpi ${overdue.length ? 'warn' : ''}"><b>${euros(total(overdue, 'total') - total(overdue, 'cobrado'))}</b><span>${t('billing.list.overdueTotal', { count: formatNumber(overdue.length) })}</span></div>`;
}

function rowHtml(row: InvoiceRow): string {
  const note = row.rectifica ? `<span class="sm">${t('billing.list.rectifies', { number: escapeHtml(row.rectifica) })}</span>`
    : row.rectificada_por ? `<span class="sm">${t('billing.list.rectifiedBy', { number: escapeHtml(row.rectificada_por) })}</span>` : '';
  return `<button class="dr" data-fac="${row.id}">
        <span><b>${escapeHtml(row.numero)}</b>${note}</span>
        <span>${formatShortDate(row.fecha)}</span><span class="corta">${escapeHtml(orFallback(row.cliente, '—'))}</span><span class="sm">${escapeHtml(orFallback(row.nif, '—'))}</span>
        <span class="num">${euros(row.base)}</span><span class="num">${euros(row.cuota_iva)}</span><span class="num"><b>${euros(row.total)}</b></span>
        <span class="${row.estado_cobro === PAYMENT.overdue ? 'cad-pasada' : ''}">${row.vencimiento ? formatShortDate(row.vencimiento) : '—'}</span>
        <span>${paymentPill(row.estado_cobro)}</span></button>`;
}

function tableHtml(rows: readonly InvoiceRow[]): string {
  if (!rows.length) return `<div class="vacio">${t('billing.list.none')}</div>`;
  const head = [['', 'number'], ['', 'date'], ['', 'client'], ['', 'nif'], ['num', 'base'], ['num', 'vatShort'], ['num', 'total'], ['', 'due'], ['', 'payment']] as const;
  return `<div class="dgrid-wrap"><div class="dgrid facts">
      <div class="dh">${head.map(([kind, key]) => `<span${kind ? ` class="${kind}"` : ''}>${t(`billing.list.${key}`)}</span>`).join('')}</div>
      ${rows.map(rowHtml).join('')}</div></div>`;
}

/** The rows of the current page (the page is kept inside the list length). */
function pageRows(rows: readonly InvoiceRow[]): readonly InvoiceRow[] {
  const size = accountListLegacy.pageSize();
  billingLegacy.setPage(Math.min(billingLegacy.page(), Math.max(0, Math.ceil(rows.length / size) - 1)));
  const start = billingLegacy.page() * size;
  return rows.slice(start, start + size);
}

async function paintRows(): Promise<void> {
  billingLegacy.showLoading(document.getElementById('flista'), t('billing.list.loading'));
  const range = opportunitiesLegacy.periodOf(document.getElementById('fper'));
  const { data, error } = await legacyDb().rpc<InvoiceRow[]>('facturas_lista', {
    p_desde: range.desde, p_hasta: range.hasta, q: emptyToNull(field('fq')?.value.trim()), p_cobro: emptyToNull(field('fcob')?.value),
  });
  const list = document.getElementById('flista'), totals = document.getElementById('ftot');
  if (!list) return;
  if (error) { list.innerHTML = `<div class="vacio">${escapeHtml(errorMessage(error))}</div>`; return; }
  const rows = data ?? [];
  if (totals) totals.innerHTML = totalsHtml(rows);
  list.innerHTML = tableHtml(pageRows(rows));
  list.querySelectorAll<HTMLElement>('[data-fac]').forEach(button => { button.onclick = (): void => { billingLegacy.openInvoice(button.dataset.fac ?? ''); }; });
  list.insertAdjacentHTML('beforeend', '<div id="fpag"></div>');
  accountListLegacy.paginate({
    element: document.getElementById('fpag'), total: rows.length, page: billingLegacy.page(),
    onPage: page => { billingLegacy.setPage(page); void paintRows(); }, onSize: () => { billingLegacy.setPage(0); void paintRows(); },
  });
}

/** From the first page again (a filter changed). */
const restart = (): void => { billingLegacy.setPage(0); void paintRows(); };

let searchTimer: ReturnType<typeof setTimeout> | undefined;

export function paintInvoices(): void {
  const body = document.getElementById('fcuerpo'); if (!body) return;
  body.innerHTML = shellHtml();
  opportunitiesLegacy.mountPeriod(document.getElementById('fper'), { id: 'facturas', valor: 'mes', alCambiar: () => { void paintRows(); } });
  const search = field('fq'), payment = field('fcob');
  if (search) search.oninput = (): void => { clearTimeout(searchTimer); searchTimer = setTimeout(restart, SEARCH_WAIT_MS); };
  if (payment) payment.onchange = restart;
  void paintRows();
}

/** After a change in an invoice: the list repaints if it is on screen. */
export function refreshInvoices(): void {
  if (currentScreen() === 'facturacion' && billingLegacy.section() === 'facturas' && document.getElementById('flista')) paintInvoices();
}
