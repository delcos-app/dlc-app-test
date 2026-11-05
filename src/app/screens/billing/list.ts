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
import { publishPage, type ExportCell, type SelectableRow } from '../../components/list-bar';
import { openableRowHtml } from '../../components/list/row';

const SEARCH_WAIT_MS = 300;

interface InvoiceRow {
  id: string; numero: string; fecha: string; cliente?: string | null; nif?: string | null; base: number; cuota_iva: number; total: number; cobrado: number;
  vencimiento?: string | null; estado_cobro: string; rectifica?: string | null; rectificada_por?: string | null; forma_pago?: string | null;
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

/** «F-2026-0012 · 5 nov · Clínica Sur»: how an invoice is named in the selection and on its open button (D-048). */
const invoiceLabel = (row: InvoiceRow): string => [row.numero, formatShortDate(row.fecha), orFallback(row.cliente, '')].filter(Boolean).join(' · ');

function rowCells(row: InvoiceRow): string {
  const note = row.rectifica ? `<span class="sm">${t('billing.list.rectifies', { number: escapeHtml(row.rectifica) })}</span>`
    : row.rectificada_por ? `<span class="sm">${t('billing.list.rectifiedBy', { number: escapeHtml(row.rectificada_por) })}</span>` : '';
  return `
        <span><b>${escapeHtml(row.numero)}</b>${note}</span>
        <span>${formatShortDate(row.fecha)}</span><span class="corta">${escapeHtml(orFallback(row.cliente, '—'))}</span><span class="sm">${escapeHtml(orFallback(row.nif, '—'))}</span>
        <span class="num">${euros(row.base)}</span><span class="num">${euros(row.cuota_iva)}</span><span class="num"><b>${euros(row.total)}</b></span>
        <span class="${row.estado_cobro === PAYMENT.overdue ? 'cad-pasada' : ''}">${row.vencimiento ? formatShortDate(row.vencimiento) : '—'}</span>
        <span>${paymentPill(row.estado_cobro)}</span>`;
}

/** v2.472.0 (D-048): the row is not a button any more (it holds its selection box); its open button names the invoice. */
const rowHtml = (row: InvoiceRow): string => openableRowHtml('dr', `data-fac="${row.id}"`, rowCells(row), t('listSelection.open', { name: invoiceLabel(row) }));

const sheetDate = (value: string | null | undefined): Date | null => (value ? new Date(`${String(value).slice(0, 10)}T00:00:00`) : null);

/** For Exportar: one value per column of the header, in its order. */
const exportValues = (row: InvoiceRow): ExportCell[] => [row.numero, sheetDate(row.fecha), row.cliente ?? null, row.nif ?? null, Number(row.base) || 0,
  Number(row.cuota_iva) || 0, Number(row.total) || 0, sheetDate(row.vencimiento), row.estado_cobro];

const toSelectable = (row: InvoiceRow): SelectableRow => ({ id: row.id, label: invoiceLabel(row), data: row });

/** v2.472.0 (D-048): the page for the selection (every invoice of the filter is already here). */
function publishInvoices(rows: readonly InvoiceRow[], shown: readonly InvoiceRow[], filter: Record<string, unknown>): void {
  publishPage('facturas', { filter: JSON.stringify(filter), rows: shown.map(toSelectable), total: rows.length,
    all: limit => Promise.resolve(rows.slice(0, limit).map(toSelectable)), values: row => exportValues(row.data as InvoiceRow) });
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
  const query = { p_desde: range.desde, p_hasta: range.hasta, q: emptyToNull(field('fq')?.value.trim()), p_cobro: emptyToNull(field('fcob')?.value) };
  const { data, error } = await legacyDb().rpc<InvoiceRow[]>('facturas_lista', query);
  const list = document.getElementById('flista'), totals = document.getElementById('ftot');
  if (!list) return;
  if (error) { list.innerHTML = `<div class="vacio">${escapeHtml(errorMessage(error))}</div>`; return; }
  const rows = data ?? [];
  if (totals) totals.innerHTML = totalsHtml(rows);
  const shown = pageRows(rows);
  publishInvoices(rows, shown, query);
  list.innerHTML = tableHtml(shown);
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

/** After a bulk action (D-048): the rows again, with the same filters and page. */
export function reloadInvoiceRows(): void {
  if (currentScreen() === 'facturacion' && billingLegacy.section() === 'facturas' && document.getElementById('flista')) void paintRows();
}

/** After a change in an invoice: the list repaints if it is on screen. */
export function refreshInvoices(): void {
  if (currentScreen() === 'facturacion' && billingLegacy.section() === 'facturas' && document.getElementById('flista')) paintInvoices();
}
