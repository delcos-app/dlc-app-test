/**
 * Pedidos → Ventas: the extra filters (operations, origin, report), the indicators and the order table with its pages. Migrated from
 * the legacy listaPedidos (v2.414.0); listaPedidos stays as an adapter (the list bar and legado 082 call it by name).
 */
import { accountListLegacy, appLegacy, cachedRpc, opportunitiesLegacy, permissions, showCacheNotice, term } from '../../legacy/bridge';
import { customersLegacy } from '../../legacy/customers-bridge';
import { ordersLegacy } from '../../legacy/orders-bridge';
import { t } from '../../i18n';
import { formatShortDate } from '../../services/date-format';
import { escapeHtml, formatNumber } from '../../services/format';
import { orFallback } from '../../services/values';
import { euros, isStepCode, STATES, stepPill, storedStateOf } from './model';
import { restoreFilters } from '../../components/filters/memory';

interface OrderRow {
  id: string; fecha: string; estado: string; numero?: string | null; factura?: string | null; contacto?: string | null; centro?: string | null; cuenta_texto?: string | null;
  origen?: string | null; forma_pago?: string | null; justificante?: boolean | null; medico?: string | null; comercial?: string | null; productos?: string | null;
  unidades: number; base?: number | null; total?: number | null; nota?: string | null; sin_cargo?: boolean | null; pago_estado?: string | null; paquete_en?: string | null;
  email_factura_en?: string | null; clasificadores?: Record<string, unknown> | null; paso?: string | null;
}
interface Summary { pedidos?: number; borradores?: number; unidades?: number; web_pedidos?: number | null; web_base?: number | null; base?: number; iva?: number; total?: number }
/** por_paso: the database filters by step and each row brings its own (SQL 191). */
interface OrdersPage { filas?: OrderRow[] | null; resumen?: Summary | null; total: number; por_paso?: boolean }

const PAID = 'Cobrado';

/**
 * The extra filter selects, added once after the state filter (each one after the previous). v2.462.0 (Eric, option A): «Operativa»
 * only offers «Factura por enviar»; the steps are in «Estado». «pago» and «paquete» stay as hidden options: the «Por hacer» cards
 * (legacy-c/order-alerts) still filter the table with them.
 */
const EXTRA_FILTERS: readonly { id: string; after: string; html: () => string; onlyTeam?: boolean }[] = [
  { id: 'popf', after: 'pestado', html: (): string => `<div><label for="popf">${t('orders.list.operations')}</label><select id="popf">
      <option value="">${t('orders.list.everything')}</option><option value="email">${t('orders.list.invoiceToSend')}</option>
      <option value="pago" hidden>${t('orders.list.toCollect')}</option><option value="paquete" hidden>${t('orders.list.toPack')}</option></select></div>` },
  // v2.115.0: the order's origin (web or the rest)
  { id: 'porigf', after: 'popf', html: (): string => `<div><label for="porigf">${t('orders.list.origin')}</label><select id="porigf">
      <option value="">${t('orders.page.all')}</option><option value="web">${t('orders.list.web')}</option><option value="portal">${t('orders.list.portal')}</option><option value="otros">${t('orders.list.others')}</option></select></div>` },
  // v2.329.0: reported or not to the professional (internal: only who sees everything)
  { id: 'prepf', after: 'porigf', onlyTeam: true, html: (): string => `<div><label for="prepf">${t('orders.list.report')}</label><select id="prepf">
      <option value="">${t('orders.page.all')}</option><option value="si">${t('orders.list.reported')}</option><option value="no">${t('orders.list.notReported')}</option></select></div>` },
];

function addExtraFilters(): void {
  for (const filter of EXTRA_FILTERS) {
    const previous = document.getElementById(filter.after);
    if (document.getElementById(filter.id) || !previous || (filter.onlyTeam && !permissions.seesEverything())) continue;
    previous.closest('div')?.insertAdjacentHTML('afterend', filter.html());
    const select = document.getElementById(filter.id);
    if (select) select.onchange = (): void => { ordersLegacy.setPage(0); void paintOrderList(); };
  }
}

const valueOf = (id: string): string => (document.getElementById(id) as HTMLInputElement | null)?.value ?? '';

function params(): Record<string, unknown> {
  const range = opportunitiesLegacy.periodOf(document.getElementById('pper')), size = accountListLegacy.pageSize(), fields = ordersLegacy.fieldFilters();
  return {
    p_desde: range.desde, p_hasta: range.hasta, p_canal: valueOf('pcanal') || null, q: valueOf('pq').trim() || null,
    p_estado: valueOf('pestado') || null, p_operativa: valueOf('popf') || null, lim: size, desplaz: ordersLegacy.page() * size,
    ...(valueOf('porigf') ? { p_origen: valueOf('porigf') } : {}),
    ...(valueOf('prepf') ? { p_reportado: valueOf('prepf') } : {}),
    ...(Object.keys(fields).length ? { f_campos: fields } : {}),
  };
}

function summaryHtml(summary: Summary): string {
  const amounts = permissions.canSeeAmounts(), drafts = summary.borradores ? t('orders.list.inDraft', { count: summary.borradores }) : '';
  const web = summary.web_pedidos !== null && summary.web_pedidos !== undefined
    ? `<div class="kpi" id="pkweb"><b>${formatNumber(summary.web_pedidos)}</b><span>${t('orders.list.byWeb')}${amounts && summary.web_base !== null && summary.web_base !== undefined ? t('orders.list.withoutVat', { amount: euros(summary.web_base) }) : ''}</span></div>` : '';
  return `
    <div class="kpi"><b>${formatNumber(summary.pedidos)}</b><span>${t('orders.list.completed')}${drafts}</span></div>
    <div class="kpi"><b>${formatNumber(summary.unidades)}</b><span>${t('orders.list.units')}</span></div>
    ${web}
    ${amounts ? `<div class="kpi"><b>${euros(summary.base)}</b><span>${t('orders.list.base')}</span></div>
    <div class="kpi"><b>${euros(summary.iva)}</b><span>${t('orders.list.vat')}</span></div>
    <div class="kpi ok"><b>${euros(summary.total)}</b><span>${t('orders.list.total')}</span></div>` : ''}`;
}

const mark = (done: boolean): string => (done ? 'ok' : 'no');

/** The operation icons of a confirmed order (paid, packed and, with an invoice, sent). */
function operationIcons(row: OrderRow): string {
  if (row.estado !== STATES.confirmed) return '';
  const packed = Boolean(row.paquete_en), packedText = t(packed ? 'orders.list.packageReady' : 'orders.list.packageToPrepare');
  if (row.sin_cargo) return `<span class="opico" title="${packedText}"><i class="${mark(packed)}">📦</i></span>`;
  const paid = row.pago_estado === PAID, sent = Boolean(row.email_factura_en);
  const title = `${t(paid ? 'orders.list.paymentReceived' : 'orders.list.paymentPending')} · ${packedText}${row.factura ? ` · ${t(sent ? 'orders.list.invoiceSent' : 'orders.list.invoiceToSendShort')}` : ''}`;
  return `<span class="opico" title="${title}">
      <i class="${mark(paid)}">💳</i><i class="${mark(packed)}">📦</i>${row.factura ? `<i class="${mark(sent)}">🧾</i>` : ''}</span>`;
}

function originText(row: OrderRow): string {
  if (row.origen === 'web') return ` · <span class="pweb">${t('orders.list.webTag')}</span>`;
  return row.origen === 'portal' ? ` · <span class="pweb">${t('orders.list.portalTag')}</span>` : '';
}

function rowHtml(row: OrderRow, fields: readonly CustomField[]): string {
  const amounts = permissions.canSeeAmounts(), reference = orFallback(row.factura, row.numero ?? '');
  return `<button class="dr" data-ped="${row.id}" style="${row.estado === STATES.voided ? 'opacity:.55' : ''}">
      <span>${formatShortDate(row.fecha)}${reference ? `<span class="sm">${escapeHtml(reference)}</span>` : ''}</span>
      <span><b>${escapeHtml(orFallback(row.contacto, orFallback(row.centro, orFallback(row.cuenta_texto, '—'))))}</b><span class="sm">${ordersLegacy.channelLabel(row, row.total)}${originText(row)}${row.forma_pago ? ` · ${escapeHtml(row.forma_pago)}` : ''}${row.justificante ? ` · <span title="${t('orders.list.withReceipt')}">📎</span>` : ''}</span></span>
      <span class="corta">${row.medico ? escapeHtml(row.medico) : `<span class="vac">${t('orders.list.unattributed')}</span>`}</span>
      <span>${row.comercial ? escapeHtml(row.comercial) : '<span class="vac">—</span>'}</span>
      <span class="sm corta">${escapeHtml(row.productos ?? '')}</span><span class="num">${formatNumber(row.unidades)}</span>
      ${amounts ? `<span class="num">${euros(row.base)}</span><span class="num"><b>${euros(row.total)}</b></span>` : ''}
      <span>${stepPill(row)}</span><span>${operationIcons(row)}</span><span class="sm corta pednota" title="${escapeHtml(row.nota ?? '')}">${escapeHtml(row.nota ?? '')}</span>${ordersLegacy.fieldCells(fields, row.clasificadores)}</button>`;
}

function tableHtml(rows: readonly OrderRow[], fields: readonly CustomField[]): string {
  if (!rows.length) return `<div class="vacio">${t('orders.list.none')}</div>`;
  const amounts = permissions.canSeeAmounts();
  return `<div class="dgrid-wrap"><div class="dgrid peds2 ${amounts ? '' : 'sinimp'}">
    <div class="dh"><span>${t('orders.list.date')}</span><span>${t('orders.list.customer')}</span><span>${term('medico', { capital: 'C' })}</span><span>${t('orders.list.salesperson')}</span><span>${t('orders.list.products')}</span>
      <span class="num">${t('orders.list.unitsShort')}</span>${amounts ? `<span class="num">${t('orders.list.baseShort')}</span><span class="num">${t('orders.list.totalShort')}</span>` : ''}<span>${t('orders.list.state')}</span><span>${t('orders.list.operations')}</span><span>${t('orders.list.notes')}</span>${customersLegacy.fieldHeaders(fields)}</div>
    ${rows.map(row => rowHtml(row, fields)).join('')}
  </div></div>`;
}

function paintPages(list: HTMLElement, total: number): void {
  if (!document.getElementById('pedpag')) list.insertAdjacentHTML('afterend', '<div id="pedpag"></div>');
  accountListLegacy.paginate({
    element: document.getElementById('pedpag'), total, page: ordersLegacy.page(),
    onPage: page => { ordersLegacy.setPage(page); void paintOrderList(); document.getElementById('pedlista')?.scrollIntoView({ block: 'start' }); },
    onSize: () => { ordersLegacy.setPage(0); void paintOrderList(); },
  });
}

function paint(list: HTMLElement, data: OrdersPage): void {
  const rows = data.filas ?? [], fields = ordersLegacy.fieldColumns();
  ordersLegacy.setRows(rows);
  const totals = document.getElementById('ptotales'); if (totals) totals.innerHTML = summaryHtml(data.resumen ?? {});
  list.innerHTML = tableHtml(rows, fields);
  customersLegacy.widenGrid(list.querySelector('.dgrid.peds2'), fields.length);
  paintPages(list, data.total);
  list.querySelectorAll<HTMLElement>('[data-ped]').forEach(button => { button.onclick = (): void => { appLegacy.openOrder(button.dataset.ped ?? ''); }; });
}

type PageResult = Awaited<ReturnType<typeof cachedRpc<OrdersPage>>>;

const requestPage = (query: Record<string, unknown>): Promise<PageResult> => cachedRpc<OrdersPage>('pedidos_pagina', query, `pedidos-${JSON.stringify(query)}`);

/**
 * The page of orders. A database without SQL 191 does not know the steps (it answers without por_paso and finds nothing): then the
 * stored state that holds the step is asked for instead (Por cobrar, Por preparar, Por facturar and Completado → Confirmado).
 */
async function loadPage(query: Record<string, unknown>): Promise<PageResult> {
  const result = await requestPage(query), step = query.p_estado as string | null;
  if (!isStepCode(step) || !result.data || result.data.por_paso) return result;
  return requestPage({ ...query, p_estado: storedStateOf(step) });
}

export async function paintOrderList(): Promise<void> {
  if (!document.getElementById('pedlista') || !document.getElementById('pper') || !document.getElementById('pcanal')) return;
  addExtraFilters();
  // v2.269.0: the filters the user had
  restoreFilters(document.getElementById('v-ventas'));
  const query = params(), loading = document.getElementById('pedlista');
  if (loading && !loading.querySelector('.dgrid')) customersLegacy.showLoading(loading, t('orders.list.loading'));
  const result = await loadPage(query);
  const list = document.getElementById('pedlista');
  if (!list || !document.getElementById('pestado')) return;
  if (!result.data) {
    const error = (result as { error?: { message?: string } | null }).error;
    list.innerHTML = `<div class="vacio">${t('orders.list.couldNotLoad', { error: error ? `: ${escapeHtml(error.message)}` : '' })}</div>`;
    return;
  }
  paint(list, result.data);
  if (result.cache) showCacheNotice(list, result.fecha);
}
