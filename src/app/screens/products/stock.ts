/**
 * Productos → «Stock y lotes»: the stock of each product by store, next expiry, coverage, units on the way and its state.
 * Migrated from the legacy pintarStock (v2.413.0). Each product opens through the global fichaStock (legado 089 wraps it).
 */
import { callRpc, purchasesLegacy } from '../../legacy/bridge';
import { productsLegacy } from '../../legacy/products-bridge';
import { t } from '../../i18n';
import { formatShortDate } from '../../services/date-format';
import { escapeHtml, formatNumber } from '../../services/format';
import { isPresent } from '../../services/values';
import { errorMessage, expiryClass, stockState, type StockLine } from './model';

function rowHtml(line: StockLine): string {
  const [label, kind] = stockState(line);
  const unbatched = line.sin_lote ? ` · <span class="u-warn">${t('products.stock.soldWithoutBatch', { units: formatNumber(-line.sin_lote) })}</span>` : '';
  const byStore = (line.por_almacen ?? []).map(store => `${escapeHtml(store.almacen)}: ${formatNumber(store.unidades)}`).join(' · ') || '—';
  const coverage = isPresent(line.dias_cobertura) ? t('products.stock.coverageDays', { days: formatNumber(line.dias_cobertura), supplier: formatNumber(line.plazo_dias) }) : t('products.stock.noSales');
  const onTheWay = line.en_camino ? formatNumber(line.en_camino) + (line.llegada ? `<span class="sm">${formatShortDate(line.llegada)}</span>` : '') : '—';
  return `<button class="dr" data-stk="${line.id}">
        <span><b>${escapeHtml(line.nombre)}</b><span class="sm">${escapeHtml(line.presentacion ?? '')}${unbatched}</span></span>
        <span class="num"><b>${formatNumber(line.stock)}</b></span>
        <span class="sm">${byStore}</span>
        <span class="${expiryClass(line.proxima_caducidad)}">${line.proxima_caducidad ? formatShortDate(line.proxima_caducidad) : '—'}</span>
        <span class="sm">${coverage}</span>
        <span class="num">${onTheWay}</span>
        <span><span class="pill ${kind}">${label}</span></span></button>`;
}

export async function paintStock(): Promise<void> {
  productsLegacy.showLoading(document.getElementById('vcuerpo'), t('products.stock.loading'));
  await purchasesLegacy.loadStores();
  const { data, error } = await callRpc<StockLine[]>('stock_resumen', {});
  const body = document.getElementById('vcuerpo'); if (!body) return;
  if (error) { body.innerHTML = `<div class="vacio">${escapeHtml(errorMessage(error))}</div>`; return; }
  const list = (data ?? []).filter(line => Boolean(line.activo) || Boolean(line.stock));
  const head = [['', 'product'], ['num', 'stock'], ['', 'byStore'], ['', 'nextExpiry'], ['', 'coverage'], ['num', 'onTheWay'], ['', 'state']] as const;
  body.innerHTML = `<div class="panel">
    <div class="cuenta">${t('products.stock.intro')}</div>
    <div class="dgrid-wrap"><div class="dgrid stock">
      <div class="dh">${head.map(([kind, key]) => `<span${kind ? ` class="${kind}"` : ''}>${t(`products.stock.${key}`)}</span>`).join('')}</div>
      ${list.map(rowHtml).join('') || `<div class="vacio">${t('products.stock.none')}</div>`}
    </div></div></div>`;
  body.querySelectorAll<HTMLElement>('[data-stk]').forEach(button => {
    button.onclick = (): void => { const line = list.find(item => item.id === button.dataset.stk); if (line) productsLegacy.openStock(line); };
  });
}
