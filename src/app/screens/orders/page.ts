/**
 * The Pedidos page: its header, the Ventas / Compras / Proveedores (and Oportunidades) tabs, the sales filters and, below, the
 * section that is open. Migrated from the legacy cargarVentasBase, pedidosSecciones, pedidosLlamadas and the cargarVentas layers
 * (v2.414.0); cargarVentas stays as an adapter (the menu, legado 057 and the tests call it by name).
 */
import { opportunitiesLegacy, permissions, purchasesLegacy, term } from '../../legacy/bridge';
import { customersLegacy } from '../../legacy/customers-bridge';
import { ordersLegacy } from '../../legacy/orders-bridge';
import { glueHelp } from '../../components';
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';
import { editSupplier, paintPurchases, paintSuppliers } from '../purchases';
import { paintOrderList } from './list';

const SEARCH_WAIT_MS = 350;
const SALES = 'ventas', PURCHASES = 'compras', SUPPLIERS = 'proveedores', CALLS = 'llamadas';

let searchTimer: ReturnType<typeof setTimeout> | undefined;

/** The page, already with the title of the section it opens (before, «Ventas» first and the section title after loading). */
function baseHtml([title, subtitle]: readonly [string, string]): string {
  return `
    <div class="saludo"><div><h1>${escapeHtml(title)}</h1><div class="fecha">${escapeHtml(subtitle)}</div></div>
      <div class="acts u-m-0">${customersLegacy.canSell() ? `<button class="btn" id="pednuevo">${t('orders.page.newSale')}</button>` : ''}</div></div>
    <div id="vcuerpo">
      <div class="panel">
        <div class="filtros">
          <div id="pper"></div>
          <div><label for="pcanal">${t('orders.page.channel')}</label><select id="pcanal">
            <option value="">${t('orders.page.all')}</option><option value="paciente">${t('orders.page.saleTo', { customer: term('paciente', { article: 'al' }) })}</option>
            <option value="centro">${t('orders.page.saleToCentre')}</option></select></div>
          <div><label for="pestado">${t('orders.page.state')}</label><select id="pestado">
            <option value="">${t('orders.page.all')}</option><option value="Confirmado">${t('orders.page.confirmed')}</option>
            <option value="Borrador">${t('orders.page.drafts')}</option><option value="Anulado">${t('orders.page.voided')}</option></select></div>
          <div><label for="pq">${t('orders.page.search')}</label><input id="pq" type="search" placeholder="${t('orders.page.searchPlaceholder', { professional: term('medico', { capital: 'C' }), customer: term('paciente') })}"></div>
        </div>
        <div class="kpis vtot" id="ptotales"></div>
        <div id="pedlista"></div>
      </div>
    </div>`;
}

/** The page with the sales filters (every section starts from it; the others replace #vcuerpo). */
async function paintBase(section: string): Promise<void> {
  const view = document.getElementById('v-ventas'); if (!view) return;
  customersLegacy.clearModules('v-ventas');
  view.innerHTML = baseHtml(ordersLegacy.sectionTitle(section));
  const add = document.getElementById('pednuevo'); if (add) add.onclick = (): void => { ordersLegacy.newSale(); };
  const repaint = (): void => { void paintOrderList(); };
  opportunitiesLegacy.mountPeriod(document.getElementById('pper'), { id: 'ventas', valor: 'mes', alCambiar: repaint });
  ['pcanal', 'pestado'].forEach(id => { const select = document.getElementById(id); if (select) select.onchange = repaint; });
  const search = document.getElementById('pq');
  if (search) search.oninput = (): void => { clearTimeout(searchTimer); searchTimer = setTimeout(repaint, SEARCH_WAIT_MS); };
  await purchasesLegacy.loadProducts();
  repaint();
  ordersLegacy.paintUnattributed();
}

const shownSection = (loading: string): string => loading || ordersLegacy.section();

function tabsHtml(loading: string): string {
  const shown = shownSection(loading);
  return `<div class="subnav" id="pedsub">${[[SALES, 'orders.page.tabSales'], [PURCHASES, 'orders.page.tabPurchases'], [SUPPLIERS, 'orders.page.tabSuppliers']]
    .map(([section = '', key = '']) => `<button data-pedsec="${section}" aria-pressed="${String(shown === section)}">${t(key as 'orders.page.tabSales')}</button>`).join('\n    ')}</div>`;
}

/** The tabs and, for Compras and Proveedores, their button and content. */
function paintSections(loading: string): void {
  const view = document.getElementById('v-ventas'); if (!view) return;
  view.querySelector('.saludo')?.insertAdjacentHTML('afterend', tabsHtml(loading));
  view.querySelectorAll<HTMLElement>('[data-pedsec]').forEach(button => { button.onclick = (): void => { ordersLegacy.setSection(button.dataset.pedsec ?? SALES); ordersLegacy.reload(); }; });
  const section = ordersLegacy.section();
  if (section === SALES) return;
  const actions = view.querySelector('.saludo .acts');
  if (actions) actions.innerHTML = purchaseButton(section);
  const purchase = document.getElementById('compnueva'); if (purchase) purchase.onclick = (): void => { purchasesLegacy.openPurchase(null); };
  const supplier = document.getElementById('provnuevo'); if (supplier) supplier.onclick = (): void => { editSupplier(null); };
  void (section === PURCHASES ? paintPurchases() : paintSuppliers());
}

function purchaseButton(section: string): string {
  if (!purchasesLegacy.canBuy()) return '';
  return section === PURCHASES ? `<button class="btn" id="compnueva">${t('orders.page.newPurchase')}</button>` : `<button class="btn" id="provnuevo">${t('orders.page.newSupplier')}</button>`;
}

/** Oportunidades (only for who sees the whole team) and the sales operations. */
function addOpportunitiesTab(tabs: HTMLElement | null, current: string): void {
  if (!tabs || !permissions.seesEverything() || !permissions.hasOpportunities() || tabs.querySelector(`[data-pedsec="${CALLS}"]`)) return;
  tabs.insertAdjacentHTML('beforeend', `<button data-pedsec="${CALLS}" aria-pressed="${String(current === CALLS)}">${t('orders.page.tabOpportunities')}</button>`);
  const button = tabs.querySelector<HTMLElement>(`[data-pedsec="${CALLS}"]`);
  if (button) button.onclick = (): void => { ordersLegacy.setSection(CALLS); ordersLegacy.reload(); };
}

function paintCalls(section: string): void {
  ordersLegacy.setSection(section === CALLS && !permissions.hasOpportunities() ? SALES : section);
  const current = ordersLegacy.section(), tabs = document.getElementById('pedsub');
  addOpportunitiesTab(tabs, current);
  tabs?.querySelectorAll<HTMLElement>('[data-pedsec]').forEach(button => { button.setAttribute('aria-pressed', String(button.dataset.pedsec === current)); });
  if (current === SALES && permissions.seesEverything()) ordersLegacy.paintOperations();
  if (current !== CALLS) return;
  const actions = document.querySelector('#v-ventas .saludo .acts');
  if (actions) actions.innerHTML = `<button class="btn" id="llnueva">${t('orders.page.newSale')}</button>`;
  const add = document.getElementById('llnueva'); if (add) add.onclick = (): void => { ordersLegacy.newSale(); };
  opportunitiesLegacy.repaintList();
}

/**
 * The title of a heading that may already have its «i» of help glued to the last word (components/help.ts): the whole text changes
 * and the «i» is glued again. Before, only the first text node changed and the glued word stayed: «Compras Ventas» when the «i»
 * arrived while the page was loading (the intermittent «Compras no tiene su título» of rapidos2139).
 */
function setHeading(heading: Element, title: string): void {
  const help = heading.querySelector('.ai');
  heading.textContent = title;
  if (!help) return;
  glueHelp(heading, '');
  (heading.querySelector('.ai-pegada') ?? heading).append(help);
}

function paintTitle(): void {
  const view = document.getElementById('v-ventas'), [title, subtitle] = ordersLegacy.sectionTitle(ordersLegacy.section());
  const heading = view?.querySelector('.saludo h1'); if (heading) setHeading(heading, title);
  const date = view?.querySelector('.saludo .fecha'); if (date) date.textContent = subtitle;
  ordersLegacy.markSection();
}

/** Opens Pedidos in its section (Ventas, Compras, Proveedores or Oportunidades). */
export async function loadSales(): Promise<void> {
  // Oportunidades only for who sees the whole team; it is mounted over Compras (whose list gives way to it)
  if (ordersLegacy.section() === CALLS && !permissions.seesEverything()) ordersLegacy.setSection(SALES);
  const section = ordersLegacy.section();
  if (section === CALLS) ordersLegacy.setSection(PURCHASES);
  // v2.335.0: while it is mounted over Compras, the menu and the tabs already mark the real section
  ordersLegacy.setLoadingSection(section);
  try {
    await paintBase(section);
    paintSections(section);
  } finally { ordersLegacy.setLoadingSection(null); }
  paintCalls(section);
  paintTitle();
  const body = document.getElementById('vcuerpo');
  if (ordersLegacy.section() === SALES && body && ordersLegacy.canAttribute() && !document.getElementById('cardsinatr')) {
    body.insertAdjacentHTML('afterbegin', '<div class="card hide" id="cardsinatr"></div>');
    ordersLegacy.paintUnattributed();
  }
}
