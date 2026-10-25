/**
 * The centre portal: «Resumen» (4 indicators, its orders and what it bought), «Pedir reposición», «Mi centro» and «Material y
 * dudas» on one page. Migrated from the legacy cargarCentro, cargarCentro2282, centroPintarBase and centroPintar of cuentas.js
 * (v2.413.0); centroPintar stays as an adapter (live updates call it).
 */
import { callRpc, portalLegacy } from '../../legacy/bridge';
import { portalPageLegacy } from '../../legacy/portal-bridge';
import { t } from '../../i18n';
import { formatShortDate } from '../../services/date-format';
import { escapeHtml, formatNumber } from '../../services/format';
import { sum } from '../../services/values';
import { owesHtml, orderExtras, paintDownloads, type CentreOrder } from './centre-docs';
import { paintOrder, type CentreProduct } from './centre-order';
import { paintForm } from './form';
import { loadForm } from './form-data';
import { paintMaterial } from './material';
import { helpButton, missingText, portalState, skeleton } from './model';
import { bindTabs, showTab, tabBar, tabPanel } from './tabs';

const TABS = ['res', 'ped', 'ficha', 'mat'], SHOWN_ORDERS = 8, CANCELLED = 'Anulado', PREPARED = 'Preparado';

interface CentreOrders { nombre?: string; pedidos?: CentreOrder[]; por_producto?: { producto: string; unidades: number }[]; pago_anticipado?: boolean }

const euros = (value: number): string => portalLegacy.euros(value);

function orderRow(order: CentreOrder): string {
  const lines = (order.lineas ?? []).map(line => `${line.producto} × ${formatNumber(line.unidades)}${line.regalo ? t('portal.centre.free') : ''}`).join(', ');
  return `<div class="item"><span class="tx">
            <b>${order.numero ? `${escapeHtml(order.numero)} · ` : ''}${formatShortDate(String(order.fecha).slice(0, 10))}</b>
            <span class="sm">${escapeHtml(lines)}${order.total !== null && order.total !== undefined ? ` · ${euros(order.total)}` : ''}</span>${orderExtras(order)}</span>
            <span class="pcpst"><span class="pill ${portalPageLegacy.centreStateClass(order.estado)}">${escapeHtml(order.estado)}</span>${order.proforma ? `<button type="button" class="btn sec chico" data-pcpro="${order.id}">${t('portal.centre.proforma')}</button>` : ''}</span></div>`;
}

function indicators(orders: readonly CentreOrder[], bought: CentreOrders['por_producto'], products: number): string {
  const running = orders.filter(order => order.estado !== CANCELLED && order.estado !== PREPARED).length, last = orders[0] ? String(orders[0].fecha).slice(0, 10) : null;
  const units = sum((bought ?? []).map(item => Number(item.unidades) || 0));
  return `<div class="pmk">
      <div class="kpi"><b>${formatNumber(running)}</b><span>${t('portal.centre.running')}</span></div>
      <div class="kpi"><b>${last ? formatShortDate(last) : '—'}</b><span>${t('portal.centre.lastOrder')}</span></div>
      <div class="kpi"><b>${formatNumber(units)}</b><span>${t('portal.centre.units12')}</span></div>
      <div class="kpi"><b>${formatNumber(products)}</b><span>${t('portal.centre.products')}</span></div></div>`;
}

function summaryHtml(answer: CentreOrders, products: number): string {
  const orders = answer.pedidos ?? [], bought = answer.por_producto ?? [], ordersTitle = t('portal.centre.ordersTitle'), boughtTitle = t('portal.centre.boughtTitle');
  const missing = portalState.missing.length ? `<div class="pmaviso"><div><b>${t('portal.centre.completeCard')}</b><span class="sm">${t('portal.centre.completeCardText', { missing: escapeHtml(missingText()) })}</span></div>
      <button type="button" class="btn" data-pmir="ficha">${t('portal.centre.completeCardButton')}</button></div>` : '';
  const chart = bought.length ? portalPageLegacy.barChart(bought.map(item => ({ n: item.producto, v: item.unidades })), value => t('portal.centre.unitsShort', { units: formatNumber(value) }))
    : portalPageLegacy.emptyChart(t('portal.centre.boughtEmpty'));
  return `${owesHtml(orders)}${missing}
    ${indicators(orders, bought, products)}
    <div class="pmfila">
      <div class="card ancard pcpeds"><h2>${ordersTitle} ${helpButton(ordersTitle, t('portal.centre.ordersHelp'))}</h2>
        ${orders.length ? `<div class="lista">${orders.slice(0, SHOWN_ORDERS).map(orderRow).join('')}</div>` : `<p class="sm">${t('portal.centre.noOrders')}</p>`}</div>
      <div class="card ancard"><h2>${boughtTitle} ${helpButton(boughtTitle, t('portal.centre.boughtHelp'))}</h2>
        ${chart}</div></div>`;
}

async function afterOrder(): Promise<void> {
  portalState.tab = 'res'; await paintCentre(); showTab('res');
}

function showOrders(summary: HTMLElement, answer: CentreOrders, products: number): void {
  const name = document.getElementById('ctnom'); if (name && answer.nombre) name.textContent = answer.nombre;
  portalState.prepayment = Boolean(answer.pago_anticipado);
  summary.innerHTML = summaryHtml(answer, products);
}

/** Paints the tabs of the centre portal with its orders, products and card. */
export async function paintCentre(): Promise<void> {
  if (!document.getElementById('mdcuerpo')) return;
  const [{ data: products }, { data: answer }, { data: card }] = await Promise.all([
    callRpc<CentreProduct[]>('productos_portal', {}), callRpc<CentreOrders>('mis_pedidos_portal', {}),
    portalState.form ? Promise.resolve({ data: null }) : callRpc<{ ok?: boolean }>('portal_mi_ficha', {}),
  ]);
  if (card?.ok) loadForm(card);
  const summary = document.getElementById('mdcuerpo'); if (!summary) return;
  const list = Array.isArray(products) ? products : [];
  showOrders(summary, answer ?? {}, list.length);
  bindTabs(summary, 'pmir');
  paintOrder(list, afterOrder);
  paintForm();
  try { await paintDownloads(); } catch { /* the downloads are optional */ }
}

/** Opens the centre portal page. */
export async function loadCentre(): Promise<void> {
  const page = document.getElementById('v-informe'); if (!page) return;
  if (!TABS.includes(portalState.tab)) portalState.tab = 'res';
  page.innerHTML = `<div class="medhero"><div><div class="sm" style="color:rgba(255,255,255,.8)">${t('portal.centre.kicker')}</div><h1 id="ctnom">…</h1>
      <div class="sm" style="color:rgba(255,255,255,.85)">${t('portal.centre.subtitle')}</div></div></div>
    ${tabBar([['res', 'portal.tabs.summary'], ['ped', 'portal.tabs.order'], ['ficha', 'portal.tabs.centre'], ['mat', 'portal.tabs.material']])}
    ${tabPanel('res', 'mdcuerpo', skeleton(false))}
    ${tabPanel('ped', 'pcped', skeleton(true))}
    ${tabPanel('ficha', 'pmficha', skeleton(true))}
    ${tabPanel('mat', 'pmmat', '<div id="mdportal" class="pmfila"></div>')}`;
  bindTabs(page, 'pmt');
  await paintCentre();
  await paintMaterial();
}
