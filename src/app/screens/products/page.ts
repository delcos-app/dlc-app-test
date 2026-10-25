/**
 * The Productos screen: its tabs (products, services, stock and batches), the actions of each tab and the section painted below.
 * Migrated from the legacy cargarProductosModuloBase and cargarProductosModulo (v2.413.0): the stock tab is painted at once with
 * its own actions (before, the products list was painted first and then replaced). cargarProductosModulo stays as an adapter (the
 * menu and the cache of loaded screens call it).
 */
import { cardSectionsLegacy, purchasesLegacy } from '../../legacy/bridge';
import { productsLegacy } from '../../legacy/products-bridge';
import { t, type MessageKey } from '../../i18n';
import { paintProducts } from './catalog';
import { stockMovement } from './movement';
import { editService, paintServices } from './services';
import { paintStock } from './stock';
import { editStores } from './stores';

const TABS: readonly (readonly [string, MessageKey])[] = [['productos', 'products.page.products'], ['servicios', 'products.page.services'], ['stock', 'products.page.stock']];

function actionsHtml(section: string): string {
  if (section === 'stock') {
    if (!purchasesLegacy.canBuy()) return '';
    return `<button class="btn sec" id="stalm">${t('products.page.stores')}</button><button class="btn sec" id="stmue">${t('products.page.samples')}</button><button class="btn" id="stini">${t('products.page.stockEntry')}</button>`;
  }
  if (!cardSectionsLegacy.can('administrar')) return '';
  return `<button class="btn" id="prodnuevo">${t(section === 'servicios' ? 'products.page.newService' : 'products.page.newProduct')}</button>`;
}

const on = (id: string, action: () => void): void => { const button = document.getElementById(id); if (button) button.onclick = action; };

function bind(screen: HTMLElement, section: string): void {
  screen.querySelectorAll<HTMLElement>('[data-ps]').forEach(button => { button.onclick = (): void => { productsLegacy.setSection(button.dataset.ps ?? 'productos'); productsLegacy.reload(); }; });
  on('prodnuevo', () => { if (section === 'servicios') editService(null); else productsLegacy.editProduct(null); });
  on('stalm', () => { void editStores(); });
  on('stmue', () => { productsLegacy.editSamples(); });
  on('stini', () => { void stockMovement(null, 'inicial'); });
}

export function loadProductsModule(): Promise<void> {
  productsLegacy.clearModules('v-productos');
  const screen = document.getElementById('v-productos'); if (!screen) return Promise.resolve();
  const section = productsLegacy.section();
  screen.innerHTML = `
    <div class="saludo"><div><h1>${t('products.page.title')}</h1><div class="fecha">${t('products.page.subtitle')}</div></div>
      <div class="acts u-m-0">${actionsHtml(section)}</div></div>
    <div class="subnav">${TABS.map(([key, label]) => `<button data-ps="${key}" aria-pressed="${String(section === key)}">${t(label)}</button>`).join('\n      ')}</div>
    <div id="vcuerpo"></div>`;
  bind(screen, section);
  if (section === 'stock') void paintStock();
  else if (section === 'servicios') void paintServices();
  else void paintProducts();
  return Promise.resolve();
}
