/**
 * Productos → «Productos»: the catalog with photo, reference, prices without and with VAT, state and the visible custom fields,
 * filtered by the field filters of the list bar. Migrated from the legacy pintarProductos (v2.413.0); pintarProductos stays as an
 * adapter (the field filters repaint it by that name). Products open in the legacy product editor.
 */
import { callRpc, cardSectionsLegacy } from '../../legacy/bridge';
import { productsLegacy, type ProductValues } from '../../legacy/products-bridge';
import { t } from '../../i18n';
import { escapeHtml, formatNumber } from '../../services/format';
import { isPresent, orFallback } from '../../services/values';
import { euros } from './model';

interface CatalogRow {
  id: string; nombre: string; tipo?: string | null; activo?: boolean; foto_url?: string | null; presentacion?: string | null; referencia?: string | null;
  precio?: number | null; iva?: number | null; pvp?: number | null; clasificadores?: ProductValues | null;
}

const money = (value: number | null | undefined): string => (isPresent(value) ? euros(value) : '—');
const activePill = (active: boolean | undefined): string =>
  `<span class="pill ${active ? 'p-est' : 'p-anu'}">${t(active ? 'products.catalog.activeState' : 'products.catalog.inactiveState')}</span>`;

function countHtml(rows: readonly CatalogRow[]): string {
  const active = rows.filter(row => row.activo).length, inactive = rows.length - active;
  return `<b>${formatNumber(active)}</b> ${t(active === 1 ? 'products.catalog.oneActive' : 'products.catalog.active')}${inactive ? t('products.catalog.inactive', { count: formatNumber(inactive) }) : ''}`;
}

function rowHtml(row: CatalogRow, fields: readonly CustomField[]): string {
  const photo = row.foto_url ? `background-image:url('${escapeHtml(row.foto_url)}')` : '';
  return `<button class="dr" data-prod="${row.id}" style="${row.activo ? '' : 'opacity:.55'}">
        <span><span class="pfoto" style="${photo}">${row.foto_url ? '' : '◧'}</span></span>
        <span><b>${escapeHtml(row.nombre)}</b><span class="sm">${escapeHtml(orFallback(row.presentacion, t('products.catalog.noPresentation')))}</span></span>
        <span class="sm">${escapeHtml(orFallback(row.referencia, '—'))}</span><span class="num">${money(row.precio)}</span>
        <span class="num">${formatNumber(row.iva ?? 0)}%</span><span class="num"><b>${money(row.pvp)}</b></span>
        <span>${activePill(row.activo)}</span>${productsLegacy.fieldCells(fields, row.clasificadores)}</button>`;
}

function tableHtml(rows: readonly CatalogRow[], fields: readonly CustomField[]): string {
  const head = [['', ''], ['', 'product'], ['', 'reference'], ['num', 'withoutVat'], ['num', 'vat'], ['num', 'withVat'], ['', 'state']] as const;
  const empty = `<div class="vacio">${t(productsLegacy.hasFieldFilters() ? 'products.catalog.noneFiltered' : 'products.catalog.none')}</div>`;
  return `<div class="dgrid-wrap"><div class="dgrid prods">
      <div class="dh">${head.map(([kind, key]) => `<span${kind ? ` class="${kind}"` : ''}>${key ? t(`products.catalog.${key}`) : ''}</span>`).join('')}${productsLegacy.fieldHeaders(fields)}</div>
      ${rows.map(row => rowHtml(row, fields)).join('') || empty}
    </div></div>`;
}

export async function paintProducts(): Promise<void> {
  const admin = cardSectionsLegacy.can('administrar');
  productsLegacy.showLoading(document.getElementById('vcuerpo'), t('products.catalog.loading'));
  const { data } = await callRpc<CatalogRow[]>('productos_lista', { p_todos: admin });
  const body = document.getElementById('vcuerpo'); if (!body) return;
  // The whole list arrives, so the field filters are applied here
  const rows = (data ?? []).filter(row => orFallback(row.tipo, 'producto') === 'producto' && productsLegacy.matchesFieldFilters(row.clasificadores));
  const fields = productsLegacy.visibleFieldColumns();
  body.innerHTML = `<div class="panel">
    <div class="cuenta">${countHtml(rows)}</div>
    ${tableHtml(rows, fields)}</div>`;
  productsLegacy.widenGrid(body.querySelector('.dgrid.prods'), fields.length);
  body.querySelectorAll<HTMLElement>('[data-prod]').forEach(button => { button.onclick = (): void => { productsLegacy.editProduct(rows.find(row => row.id === button.dataset.prod) ?? null); }; });
}
