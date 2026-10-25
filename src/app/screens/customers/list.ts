/**
 * Clientes: the page, its filters and the list (people and companies that buy, with their professional and history). Migrated
 * from the legacy cargarPacientes, pintarPacientes and listaPacientes (v2.411.0); those names stay as adapters (the menu, the list
 * bar, the custom field filters, Pedidos and «‹ Volver» use them).
 */
import { accountColumnsLegacy, accountListLegacy, legacyDb } from '../../legacy/bridge';
import { customersLegacy, type CustomersPage } from '../../legacy/customers-bridge';
import { t } from '../../i18n';
import { formatShortDate } from '../../services/date-format';
import { escapeHtml, formatNumber } from '../../services/format';
import { listParams, phoneOf, TYPES, words } from './model';
import { showCustomer } from './sheet';

const SEARCH_WAIT_MS = 300;

interface Row {
  id: string; nombre: string; tipo?: string | null; nif?: string | null; telefono?: string | null; movil?: string | null; email?: string | null;
  municipio?: string | null; medico?: string | null; comercial?: string | null; pedidos: number; unidades: number; ultimo_pedido?: string | null;
  clasificadores?: Record<string, unknown> | null;
}
interface Town { v: string; n: number }

const empty = '<span class="vac">—</span>';
const shown = (value: string | null | undefined): string => (value ? escapeHtml(value) : empty);

function headerHtml(fields: readonly CustomField[]): string {
  const titles = [t('customers.list.customer'), t('customers.list.type'), t('customers.list.taxId'), t('customers.list.phone'), t('customers.list.email'), t('customers.list.town')];
  return `<div class="dh">${titles.map(title => `<span>${title}</span>`).join('')}
      <span>${words().Professional}</span><span>${t('customers.list.salesRep')}</span><span class="num">${t('customers.list.orders')}</span><span class="num">${t('customers.list.units')}</span><span>${t('customers.list.lastOrder')}</span>${customersLegacy.fieldHeaders(fields)}</div>`;
}

function rowHtml(row: Row, fields: readonly CustomField[]): string {
  const company = row.tipo === TYPES.company, values = row.clasificadores ?? {};
  return `<button class="dr" data-pac="${row.id}">
      <span><b>${escapeHtml(row.nombre)}</b></span>
      <span><span class="pill ${company ? 'p-emp' : 'p-per'}">${company ? t('customers.company') : words().Patient}</span></span>
      <span>${shown(row.nif)}</span><span>${shown(phoneOf(row))}</span><span class="corta">${shown(row.email)}</span><span>${shown(row.municipio)}</span>
      <span class="corta">${row.medico ? escapeHtml(row.medico) : `<span class="vac">${t('customers.list.unassigned')}</span>`}</span><span>${shown(row.comercial)}</span>
      <span class="num">${formatNumber(row.pedidos)}</span><span class="num"><b>${formatNumber(row.unidades)}</b></span>
      <span>${row.ultimo_pedido ? formatShortDate(row.ultimo_pedido) : empty}</span>${fields.map(field => `<span>${shown(accountColumnsLegacy.fieldText(field, values[field.clave]))}</span>`).join('')}
    </button>`;
}

function paintRows(page: CustomersPage): void {
  const count = document.getElementById('paccuenta'), list = document.getElementById('paclista');
  if (!count || !list) return;
  count.innerHTML = `<b>${formatNumber(page.total)}</b> ${page.total === 1 ? t('customers.list.oneCustomer') : t('customers.list.customers')}`;
  const rows = (page.filas ?? []) as Row[], fields = customersLegacy.visibleFieldColumns();
  list.innerHTML = rows.length ? `<div class="dgrid-wrap"><div class="dgrid pacs">
    ${headerHtml(fields)}
    ${rows.map(row => rowHtml(row, fields)).join('')}</div></div>` : `<div class="vacio">${t('customers.list.none')}</div>`;
  // Custom field columns are added to the grid
  customersLegacy.widenGrid(list.querySelector('.dgrid.pacs'), fields.length);
  list.querySelectorAll<HTMLElement>('[data-pac]').forEach(button => { button.onclick = (): void => { void showCustomer(button.dataset.pac ?? ''); }; });
  const filters = customersLegacy.filters();
  accountListLegacy.paginate({
    element: document.getElementById('pacpag'), total: page.total, page: filters.pagina,
    onPage: pageNumber => { filters.pagina = pageNumber; void listCustomers(); }, onSize: () => { filters.pagina = 0; void listCustomers(); },
  });
}

/** Asks for the list with the current filters and paints it (`answer` when the page already asked for it). */
export async function listCustomers(answer?: PromiseLike<{ data: CustomersPage | null; error: unknown }>): Promise<void> {
  customersLegacy.showLoading(document.getElementById('paclista'), t('customers.list.searching'));
  const { data, error } = await (answer ?? legacyDb().rpc<CustomersPage>('clientes_lista', listParams()));
  if (error || !data) {
    const count = document.getElementById('paccuenta'), list = document.getElementById('paclista');
    if (count) count.textContent = t('customers.list.couldNotLoad', { error: (error as { message?: string } | null)?.message ?? '' });
    if (list) list.innerHTML = '';
    return;
  }
  paintRows(data);
}

const option = (value: string, label: string, chosen: string | undefined): string => `<option value="${escapeHtml(value)}" ${chosen === value ? 'selected' : ''}>${label}</option>`;

function filtersHtml(towns: readonly Town[]): string {
  const filters = customersLegacy.filters();
  filters.campos ??= {};
  return `<div class="filtros">
        <div><label for="pacq">${t('customers.list.search')}</label><input id="pacq" type="search" value="${escapeHtml(filters.q)}" placeholder="${t('customers.list.searchPlaceholder')}"></div>
        <div><label for="pactipo">${t('customers.list.type')}</label><select id="pactipo">
          <option value="">${t('customers.list.all')}</option>${option(TYPES.person, t('customers.list.persons', words()), filters.tipo)}
          ${option(TYPES.company, t('customers.list.companies'), filters.tipo)}</select></div>
        <div><label for="pacped">${t('customers.list.orders')}</label><select id="pacped">
          <option value="">${t('customers.list.all')}</option>${option('con', t('customers.list.withOrders'), filters.pedidos)}
          ${option('sin', t('customers.list.withoutOrders'), filters.pedidos)}</select></div>
        <div><label for="pacmun">${t('customers.list.town')}</label><select id="pacmun"><option value="">${t('customers.list.allTowns')}</option>
          ${towns.map(town => option(town.v, `${escapeHtml(town.v)} (${town.n})`, filters.municipio)).join('')}</select></div>
        ${customersLegacy.fieldFilters(filters.campos)}
        ${filters.medico ? `<div><label>${words().Professional}</label><div style="min-height:44px;display:flex;align-items:center"><button class="chip" id="pacmedx">${escapeHtml(filters.medicoNombre)} ✕</button></div></div>` : ''}
      </div>`;
}

let searchTimer: ReturnType<typeof setTimeout> | undefined;

function bindFilters(body: HTMLElement): void {
  const filters = customersLegacy.filters(), again = (): void => { filters.pagina = 0; void listCustomers(); };
  const search = document.getElementById('pacq') as HTMLInputElement | null;
  if (search) search.oninput = (): void => { clearTimeout(searchTimer); searchTimer = setTimeout(() => { filters.q = search.value.trim(); again(); }, SEARCH_WAIT_MS); };
  const onSelect = (id: string, set: (value: string) => void): void => { const select = document.getElementById(id) as HTMLSelectElement | null; if (select) select.onchange = (): void => { set(select.value); again(); }; };
  onSelect('pactipo', value => { filters.tipo = value; });
  onSelect('pacped', value => { filters.pedidos = value; });
  onSelect('pacmun', value => { filters.municipio = value; });
  customersLegacy.bindFieldFilters(body, filters.campos ?? {}, again);
  const professional = document.getElementById('pacmedx');
  if (professional) professional.onclick = (): void => { filters.medico = null; filters.medicoNombre = ''; filters.pagina = 0; void paintCustomers(); };
}

/** The filters and the list (both asked for at once). */
export async function paintCustomers(): Promise<void> {
  // Both answers arrive before painting, so the filters and the list appear together
  const [{ data: towns }, list] = await Promise.all([legacyDb().rpc<Town[]>('municipios_clientes'), legacyDb().rpc<CustomersPage>('clientes_lista', listParams())]);
  const body = document.getElementById('vcuerpo'); if (!body) return;
  body.innerHTML = `
    <div class="panel">
      ${filtersHtml(towns ?? [])}
      <div class="cuenta" id="paccuenta">${t('customers.list.loading')}</div>
      <div id="paclista"></div>
      <div id="pacpag"></div>
    </div>`;
  bindFilters(body);
  await listCustomers(Promise.resolve(list));
}

/** Opens Clientes: title, «+ Nuevo cliente» and the list. */
export function loadCustomers(): void {
  customersLegacy.clearModules('v-pacientes');
  const page = document.getElementById('v-pacientes'); if (!page) return;
  page.innerHTML = `
    <div class="saludo"><div><h1>${t('customers.list.title')}</h1><div class="fecha">${t('customers.list.subtitle', words())}</div></div>
      <div class="acts u-m-0">${customersLegacy.canSell() ? `<button class="btn" id="pacnuevo">${t('customers.list.newCustomer')}</button>` : ''}</div></div>
    <div id="vcuerpo"></div>`;
  const add = document.getElementById('pacnuevo');
  if (add) add.onclick = (): void => { customersLegacy.editCustomer({}, customer => { void showCustomer(customer.id); }); };
  void paintCustomers();
}
