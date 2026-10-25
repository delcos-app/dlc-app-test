/**
 * List details from legacy layers: back from «Cerca de mí» (v2.249.0), removing the professional filter in Clientes (v2.257.0), the
 * filters kept between visits (v2.269.0), Cuentas' quick «Tipo» filter (v2.304.0), each order in three lines on the phone (v2.316.0)
 * and the list indicators counting within the filters (v2.341.0). Moved from legado 096, 102, 113, 128, 139 and 155 (v2.424.0);
 * montarPeriodo stays as an adapter.
 */
import { listGlueLegacy as legacy, type CountItem, type LegacyOrderRow } from '../../legacy/legado-d-glue-bridge';
import { term } from '../../legacy/bridge';
import { t } from '../../i18n';

/** Legado 096, 102 and 128: list listeners. */
export function installListListeners(): void {
  document.addEventListener('click', event => {
    if (!(event.target as Element).closest('[data-cercavolver]')) return;
    event.stopPropagation(); legacy.leaveNearby();
  });
}

export function installCustomerDoctorFilter(): void {
  document.addEventListener('click', event => {
    if (!(event.target as Element).closest('#v-pacientes [data-plmed]')) return;
    // Only the list is asked again (painting the filters again left the old ones in the side panel, with the same ids)
    event.stopPropagation(); legacy.clearCustomerDoctor();
    document.getElementById('pacmedx')?.parentElement?.parentElement?.remove();
    legacy.listCustomers();
  }, true);
}

export function installAccountTypeFilter(): void {
  document.getElementById('ftipo')?.addEventListener('change', event => { legacy.setAccountType((event.target as HTMLSelectElement).value); legacy.searchAccounts(); });
}

/** Legado 113: the chosen filters are remembered on every change. */
export function installFilterMemory(): void {
  document.addEventListener('change', event => { legacy.rememberFilter(event); }, true);
  document.addEventListener('input', event => { legacy.rememberFilter(event); }, true);
}

/** montarPeriodo: screens mount their period just before asking for the list: the moment to give the filters back. */
export function mountPeriod(element: HTMLElement | null, args: unknown[]): unknown {
  const result = legacy.baseMountPeriod(element, args);
  try { legacy.restoreFilters(element?.closest<HTMLElement>('main > section') ?? null); } catch { /* nothing remembered */ }
  return result;
}

/** Legado 139: an order on the phone — who, state and amount; what and how many; payment, date and professional. */
export function installOrderCards(): void {
  legacy.setOrderCard(row => {
    const order = legacy.orders().find(item => item.id === row.dataset.ped);
    if (!order) return { a: '', b: '', c: '' };
    return orderCard(order);
  });
}

/** The first value that is not empty (like the legacy `a || b`). */
const firstOf = (...values: (string | null | undefined)[]): string | undefined => values.find((value): value is string => Boolean(value));
/** null for an empty filter (the database ignores it). */
const orNull = (value: unknown): unknown => (value ? value : null);
/** How many custom field filters there are (none if there is no object). */
const keysOf = (value: unknown): number => (value && typeof value === 'object' ? Object.keys(value).length : 0);

function orderCard(order: LegacyOrderRow): { a: string; b: string; c: string; d: string } {
  const customer = firstOf(order.contacto, order.centro, order.cuenta_texto) ?? '', who = firstOf(customer, order.medico) ?? t('legacyD.lists.noCustomer');
  const units = order.unidades ?? 0;
  const what = [legacy.number(units) + t(Number(units) === 1 ? 'legacyD.lists.unit' : 'legacyD.lists.units'), order.productos].filter(Boolean).join(' · ');
  const payment = legacy.isFree(order) ? t('legacyD.lists.freeDelivery') : firstOf(order.forma_pago) ?? t('legacyD.lists.noPayment');
  const others = [payment, legacy.shortDate(order.fecha), customer ? order.medico ?? '' : ''].filter(Boolean).join(' · ');
  const amount = legacy.canSeeAmounts() && order.total !== null && order.total !== undefined ? `<span class="plcimp">${legacy.euros(order.total)}</span>` : '';
  return { a: who, b: what, c: legacy.stepPill(order) + amount, d: others };
}

/** Legado 155 Cuentas: each indicator counts its condition within the filters on screen (without filters, the usual total). */
function accountIndicators(): void {
  const filters = legacy.accountFilters();
  const base = (): Record<string, unknown> => ({ q: orNull(filters().q), f_provincia: orNull(filters().prov), f_municipio: orNull(filters().muni), f_estado: orNull(filters().est),
    f_especialidad: orNull(filters().esp), f_area: null, f_comercial: orNull(filters().com), f_reporting: orNull(filters().rep),
    ...(keysOf(filters().campos) ? { f_campos: filters().campos } : {}) });
  const flags = (): unknown[] => { const now = filters(); return [now.q, now.prov, now.muni, now.est, now.esp, now.com, now.rep, now.tipo, Boolean(now.urg), Boolean(now.mios), Boolean(now.sin), keysOf(now.campos) ? now.campos : {}]; };
  const filtered = (): boolean => { const now = filters(); return [now.q, now.prov, now.muni, now.est, now.esp, now.com, now.rep, now.tipo, now.urg, now.mios, now.sin, keysOf(now.campos)].some(Boolean); };
  legacy.setIndicators('directorio', () => JSON.stringify(flags()), async (): Promise<CountItem[]> => {
    const now = filters();
    const count = (extra: Record<string, unknown>): Promise<number> => legacy.total('buscar_cuentas', { ...base(), f_tipo: orNull(now.tipo), f_urgentes: Boolean(now.urg), f_mios: Boolean(now.mios), f_sin_visitar: Boolean(now.sin), lim: 1, desplaz: 0, ...extra });
    const [people, centres, urgent, never, mine] = await Promise.all([count({ f_tipo: 'Persona' }), count({ f_tipo: 'Centro' }), count({ f_urgentes: true }), count({ f_sin_visitar: true }), count({ f_mios: true })]);
    const sub = (plain: string): string => (filtered() ? t('legacyD.lists.withFilters') : plain);
    return [{ k: 'Persona', t: term('medico', { number: 'p', capital: 'C' }), n: people, s: sub(t('legacyD.lists.inTotal')) }, { k: 'Centro', t: t('legacyD.lists.centres'), n: centres, s: sub(t('legacyD.lists.inTotal')) },
      { k: 'urg', t: t('legacyD.lists.urgent'), n: urgent, s: sub(t('legacyD.lists.markedUrgent')) }, { k: 'sin', t: t('legacyD.lists.neverVisited'), n: never, s: sub(t('legacyD.lists.withoutVisits', { visits: term('visita', { number: 'p' }) })) },
      { k: 'mios', t: t('legacyD.lists.mine'), n: mine, s: sub(t('legacyD.lists.assignedToYou')) }];
  });
}

/** Legado 155 Clientes. */
function customerIndicators(): void {
  const filters = legacy.customerFilters();
  const base = (): Record<string, unknown> => ({ q: orNull(filters().q), p_medico: orNull(filters().medico), p_municipio: orNull(filters().municipio),
    ...(keysOf(filters().campos) ? { f_campos: filters().campos } : {}) });
  legacy.setIndicators('pacientes', () => { const now = filters(); return JSON.stringify([now.q, now.medico, now.municipio, now.tipo, now.pedidos, keysOf(now.campos) ? now.campos : {}]); }, async (): Promise<CountItem[]> => {
    const now = filters();
    const count = (extra: Record<string, unknown>): Promise<number> => legacy.total('clientes_lista', { ...base(), p_tipo: orNull(now.tipo), p_pedidos: orNull(now.pedidos), lim: 1, desplaz: 0, ...extra });
    const [all, withOrders, without, companies] = await Promise.all([count({ p_tipo: null, p_pedidos: null }), count({ p_pedidos: 'con' }), count({ p_pedidos: 'sin' }), count({ p_tipo: 'Empresa' })]);
    const filtered = [now.q, now.medico, now.municipio, now.tipo, now.pedidos, keysOf(now.campos)].some(Boolean);
    const sub = (plain: string): string => (filtered ? t('legacyD.lists.withFilters') : plain);
    return [{ k: 'tot', t: t('legacyD.lists.customers'), n: all, s: sub(t('legacyD.lists.inTotal')) }, { k: 'con', t: t('legacyD.lists.withOrders'), n: withOrders, s: sub(t('legacyD.lists.boughtOnce')) },
      { k: 'sin', t: t('legacyD.lists.withoutOrders'), n: without, s: sub(t('legacyD.lists.noPurchases')) }, { k: 'emp', t: t('legacyD.lists.companies'), n: companies, s: sub(t('legacyD.lists.companiesHint')) }];
  });
}

export function installListIndicators(): void {
  if (legacy.hasListConfig('directorio')) accountIndicators();
  if (legacy.hasListConfig('pacientes')) customerIndicators();
}
