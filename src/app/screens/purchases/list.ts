/**
 * Pedidos → «Compras»: the indicators (in progress, units on the way, late, bought this year) and the list of purchase orders.
 * Migrated from the legacy pintarCompras (v2.409.0); pintarCompras stays as an adapter (the Pedidos tab calls it).
 * Orders open through the global editorCompra: legado 058 wraps it to open the wide window.
 */
import { legacyDb, purchasesLegacy } from '../../legacy/bridge';
import { t } from '../../i18n';
import { todayIso } from '../../services/dates';
import { formatShortDate } from '../../services/date-format';
import { escapeHtml, formatNumber } from '../../services/format';
import { orFallback, sum } from '../../services/values';
import { euros, OPEN_STATES, purchasePill, STATES } from './model';

interface PurchaseRow {
  id: string; numero: string; proveedor?: string | null; productos?: string | null; fecha: string; fecha_prevista?: string | null; retrasada?: boolean;
  unidades: number; recibidas: number; importe?: number | string | null; estado: string;
}

const LATE_STYLE = 'color:var(--danger);font-weight:700';

export const loadingHtml = (text: string): string => `<div class="cargador"><span class="spin"></span><span class="sm">${escapeHtml(text)}</span></div>`;

function indicatorsHtml(rows: readonly PurchaseRow[]): string {
  const open = rows.filter(row => OPEN_STATES.includes(row.estado)), late = rows.filter(row => row.retrasada);
  const yearStart = `${todayIso().slice(0, 4)}-01-01`;
  const bought = sum(rows.filter(row => row.estado !== STATES.cancelled && row.fecha >= yearStart).map(row => Number(row.importe) || 0));
  return `<div class="kpis vtot">
      <div class="kpi"><b>${formatNumber(open.length)}</b><span>${t('purchases.list.inProgress')}</span></div>
      <div class="kpi"><b>${formatNumber(sum(open.map(row => row.unidades - row.recibidas)))}</b><span>${t('purchases.list.unitsOnTheWay')}</span></div>
      <div class="kpi ${late.length ? 'warn' : ''}"><b>${formatNumber(late.length)}</b><span>${t('purchases.list.late')}</span></div>
      <div class="kpi"><b>${euros(bought)}</b><span>${t('purchases.list.boughtThisYear')}</span></div>
    </div>`;
}

function rowHtml(row: PurchaseRow): string {
  const expected = row.fecha_prevista ? formatShortDate(row.fecha_prevista) + (row.retrasada ? t('purchases.list.lateTag') : '') : '—';
  const received = row.recibidas && row.recibidas < row.unidades ? `${formatNumber(row.recibidas)}/` : '';
  return `<button class="dr" data-comp="${row.id}">
        <span><b>${escapeHtml(row.numero)}</b></span><span>${escapeHtml(orFallback(row.proveedor, '—'))}</span><span class="sm">${escapeHtml(row.productos ?? '')}</span>
        <span>${formatShortDate(row.fecha)}</span>
        <span style="${row.retrasada ? LATE_STYLE : ''}">${expected}</span>
        <span class="num">${received}${formatNumber(row.unidades)}</span>
        <span class="num">${euros(row.importe)}</span><span>${purchasePill(row.estado)}</span></button>`;
}

function tableHtml(rows: readonly PurchaseRow[]): string {
  if (!rows.length) return `<div class="vacio">${t('purchases.list.none')}${purchasesLegacy.canBuy() ? t('purchases.list.createFirst') : ''}</div>`;
  const head = [['', 'number'], ['', 'supplier'], ['', 'products'], ['', 'date'], ['', 'expected'], ['num', 'units'], ['num', 'amount'], ['', 'state']] as const;
  return `<div class="dgrid-wrap"><div class="dgrid comps">
      <div class="dh">${head.map(([kind, key]) => `<span${kind ? ` class="${kind}"` : ''}>${t(`purchases.list.${key}`)}</span>`).join('')}</div>
      ${rows.map(rowHtml).join('')}
    </div></div>`;
}

export async function paintPurchases(): Promise<void> {
  const loading = document.getElementById('vcuerpo');
  if (loading) loading.innerHTML = loadingHtml(t('purchases.list.loading'));
  const { data, error } = await legacyDb().rpc<PurchaseRow[]>('compras_lista');
  // Another tab may have been opened meanwhile (Oportunidades is mounted over Compras): it is not overwritten
  if (purchasesLegacy.section() !== 'compras') return;
  const box = document.getElementById('vcuerpo'); if (!box) return;
  if (error) { box.innerHTML = `<div class="vacio">${escapeHtml((error as { message?: string }).message)}</div>`; return; }
  const rows = data ?? [];
  box.innerHTML = `<div class="panel">
    ${indicatorsHtml(rows)}
    ${tableHtml(rows)}</div>`;
  box.querySelectorAll<HTMLElement>('[data-comp]').forEach(button => { button.onclick = (): void => { purchasesLegacy.openPurchase(button.dataset.comp ?? null); }; });
}
