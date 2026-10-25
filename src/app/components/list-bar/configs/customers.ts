/**
 * Clientes (pacientes) in the list bar: quick filters, search, the four indicators that filter and the mobile card. Migrated from
 * PL.pacientes (v2.236.0) with its later versions of buscarQ (legado 096, v2.249.0) and columnas (legado 102, v2.257.0) (v2.421.0).
 */
import { listBarLegacy } from '../../../legacy/listbar-bridge';
import { t } from '../../../i18n';
import type { Indicator, ListConfig, RowCard } from '../types';

const COLUMNS_DELAY_MS = 80;
const TOTAL = 'tot', COMPANIES = 'emp', COMPANY = 'Empresa';

const byId = (id: string): HTMLElement | null => document.getElementById(id);

async function indicators(): Promise<Indicator[]> {
  const count = (filters: Record<string, unknown>): Promise<number> => Promise.resolve(listBarLegacy.countRows<{ total?: number }>('clientes_lista', {
    q: null, p_medico: null, lim: 1, desplaz: 0, p_tipo: null, p_pedidos: null, p_municipio: null, ...filters,
  })).then(result => result.data?.total ?? 0, () => 0);
  const [total, withOrders, without, companies] = await Promise.all([count({}), count({ p_pedidos: 'con' }), count({ p_pedidos: 'sin' }), count({ p_tipo: COMPANY })]);
  return [
    { k: TOTAL, t: t('listBar.customers.customers'), n: total, s: t('listBar.customers.inTotal') },
    { k: 'con', t: t('listBar.customers.withOrders'), n: withOrders, s: t('listBar.customers.boughtOnce') },
    { k: 'sin', t: t('listBar.customers.withoutOrders'), n: without, s: t('listBar.customers.noPurchases') },
    { k: COMPANIES, t: t('listBar.customers.companies'), n: companies, s: t('listBar.customers.companiesDetail') },
  ];
}

function isOn(key: string): boolean {
  const filters = listBarLegacy.customerFilters();
  if (key === TOTAL) return !filters.tipo && !filters.pedidos;
  return key === COMPANIES ? filters.tipo === COMPANY : filters.pedidos === key;
}

function press(key: string): void {
  const filters = listBarLegacy.customerFilters();
  if (key === TOTAL) { filters.tipo = ''; filters.pedidos = ''; }
  else if (key === COMPANIES) filters.tipo = filters.tipo === COMPANY ? '' : COMPANY;
  else filters.pedidos = filters.pedidos === key ? '' : key;
  const type = byId('pactipo') as HTMLSelectElement | null; if (type) type.value = filters.tipo ?? '';
  const orders = byId('pacped') as HTMLSelectElement | null; if (orders) orders.value = filters.pedidos ?? '';
  filters.pagina = 0; listBarLegacy.searchCustomers();
}

/** «Columnas» always opens the second panel (v2.257.0: before, it opened or closed it depending on how it was). */
function openColumns(): void {
  const open = (): void => { byId('tools')?.querySelector<HTMLElement>('.t2abrir')?.click(); };
  const tools = byId('tools');
  if (tools?.classList.contains('abierto') && tools.querySelector('.t2abrir')) { open(); return; }
  const button = document.querySelector<HTMLElement>('#v-pacientes .htbtn'); if (!button) return;
  button.click(); setTimeout(open, COLUMNS_DELAY_MS);
}

/** Mobile card from the table row: name, town and phone, and the type on the right. */
function card(row: HTMLElement): RowCard {
  const cells = row.children, text = (index: number): string => (cells[index]?.textContent ?? '').trim();
  return { a: text(0), b: [text(5), text(3)].filter(value => value && value !== '—').join(' · '), c: cells[1]?.innerHTML ?? '' };
}

export const customersConfig = (): ListConfig => ({
  que: () => t('listBar.customers.what'),
  nuevo: () => byId('pacnuevo'),
  cuerpo: () => byId('paclista'), tabla: () => byId('paclista'), pie: () => byId('pacpag'), cuenta: () => byId('paccuenta'),
  conDatos: element => Boolean(element.querySelector('.dgrid, .vacio')),
  rapidos: [['pactipo', t('listBar.customers.type')], ['pacped', t('listBar.customers.orders')], ['pacmun', t('listBar.customers.town')]],
  q: () => listBarLegacy.customerFilters().q || '',
  // v2.249.0: the bar's search searches directly (before, it went through the hidden field and waited twice)
  buscarQ: value => {
    const input = byId('pacq') as HTMLInputElement | null; if (input) input.value = value;
    const filters = listBarLegacy.customerFilters(); filters.q = value.trim(); filters.pagina = 0; listBarLegacy.searchCustomers();
  },
  activos: () => {
    const filters = listBarLegacy.customerFilters();
    return [filters.tipo, filters.pedidos, filters.municipio, filters.medico].filter(Boolean).length + Object.keys(filters.campos ?? {}).length;
  },
  filtros: () => { document.querySelector<HTMLElement>('#v-pacientes .htbtn')?.click(); },
  columnas: openColumns,
  mapa: () => null,
  mas: () => [],
  kpis: indicators,
  kpiOn: isOn,
  kpiPulsar: press,
  card,
});
