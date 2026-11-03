/**
 * Oportunidades: the catalogs they use (call reasons and results, how the client arrived), the chips to pick one, the «call
 * again» shortcuts, and the amount of a line of interest. Migrated from the legacy catLlamadas, catOportunidades, NV_DIAS and
 * nvLinea (v2.410.0).
 */
import { legacyDb, opportunitiesLegacy } from '../../legacy/bridge';
import { t, type MessageKey } from '../../i18n';
import { toIsoDate } from '../../services/dates';
import { escapeHtml } from '../../services/format';
import { round2 } from '../../services/money';

/** The result that closes an opportunity with an order when the list has none marked «pos» (the value of the old calls). */
export const ORDER_DONE = 'Pedido hecho';
/** Call directions (database values). */
export const INCOMING = 'Entrante', OUTGOING = 'Saliente';
/** The names of the follow-up call values before they had a role (SQL 192 marks them): origin and reason. */
const OUTGOING_CALL = 'Llamada saliente', FOLLOW_UP_REASON = 'Seguimiento de televenta';
/** Roles of the values (PED-5, v2.464.0): the follow-up reason, our own call and the positive result. */
const FOLLOW_UP_ROLE = 'seguimiento', OUR_CALL_ROLE = 'llamada_nuestra', POSITIVE = 'pos';

export interface CatalogEntry { valor: string; extra?: string | null; papel?: string | null }
export interface InterestLine { producto_id: string; unidades: number }
export interface SaleProduct { id: string; nombre: string; tipo?: string | null; estado?: string | null; precio?: number | null; iva?: number | null }

export const FOLLOW_UP_DAYS: readonly (readonly [MessageKey, number])[] = [
  ['opportunities.followUpDays.tomorrow', 1], ['opportunities.followUpDays.threeDays', 3],
  ['opportunities.followUpDays.week', 7], ['opportunities.followUpDays.month', 30],
];

/** «Mañana», «En 3 días»… buttons; `attribute` is data-kold or data-nvd. */
export const followUpButtons = (attribute: string): string =>
  FOLLOW_UP_DAYS.map(([key, days]) => `<button type="button" class="chipsel" data-${attribute}="${days}">${t(key)}</button>`).join('');

/** The date `days` from today (local). */
export function dateIn(days: number): string {
  const date = new Date(); date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

export const catalog = (key: string): readonly CatalogEntry[] => opportunitiesLegacy.catalog(key);

async function loadCatalog(key: string): Promise<void> {
  if (catalog(key).length) return;
  const { data } = await legacyDb().rpc<CatalogEntry[]>('catalogo_papel', { p_papel: key });
  opportunitiesLegacy.setCatalog(key, data ?? []);
}

/** The value of a list with a role; without one marked, the value with its old name if the list has it, or none. */
function valueWithRole(key: string, role: string, oldName: string): string {
  const list = catalog(key);
  return list.find(entry => entry.papel === role)?.valor ?? (list.some(entry => entry.valor === oldName) ? oldName : '');
}

/** The reason of a follow-up call: the one marked «Es el motivo de seguimiento» in «Motivos de llamada». */
export const followUpReason = (): string => valueWithRole('motivo_llamada', FOLLOW_UP_ROLE, FOLLOW_UP_REASON);

/** How a follow-up call arrives: the one marked «Es una llamada nuestra» in «Origen». */
export const ourCallOrigin = (): string => valueWithRole('origen_oportunidad', OUR_CALL_ROLE, OUTGOING_CALL);

/** The results that close with an order: the positive ones of «Resultados de llamada» («Pedido hecho» if none). */
export function orderDoneResults(): string[] {
  const positive = catalog('resultado_llamada').filter(entry => entry.extra === POSITIVE).map(entry => entry.valor);
  return positive.length ? positive : [ORDER_DONE];
}

/** The result saved when an opportunity closes with an order. */
export const orderDoneResult = (): string => orderDoneResults()[0] ?? ORDER_DONE;

/** A result that closed with an order. */
export const isOrderDone = (result: string | null | undefined): boolean => Boolean(result) && orderDoneResults().includes(result ?? '');

/** Reasons and results of a call. */
export async function loadCallCatalogs(): Promise<void> {
  for (const key of ['motivo_llamada', 'resultado_llamada']) await loadCatalog(key);
}

/** The call catalogs and how a client arrives. */
export async function loadOpportunityCatalogs(): Promise<void> {
  await loadCallCatalogs();
  await loadCatalog('origen_oportunidad');
}

const toneOf = (entry: CatalogEntry): string => (entry.extra === 'neg' ? 'neg' : entry.extra === 'pos' ? 'pos' : '');

/** A chip per catalog value, the chosen one on. */
export const chipsHtml = (list: readonly CatalogEntry[], chosen: string, attribute: string): string =>
  list.map(entry => `<button type="button" class="chipsel ${entry.valor === chosen ? 'on' : ''} ${toneOf(entry)}" ${attribute}="${escapeHtml(entry.valor)}">${escapeHtml(entry.valor)}</button>`).join('');

/** Toggles the chosen value of a chip group: pressing the chosen one clears it. Returns the new value. */
export function toggleChip(group: HTMLElement, attribute: string, current: string, pressed: string): string {
  const chosen = current === pressed ? '' : pressed;
  group.querySelectorAll<HTMLElement>(`[${attribute}]`).forEach(chip => { chip.classList.toggle('on', chip.getAttribute(attribute) === chosen); });
  return chosen;
}


/** The amount with VAT of `units` of a product (0 without price). */
export function lineAmount(productId: string, units: number): number {
  const product = opportunitiesLegacy.products().find(item => item.id === productId);
  if (product?.precio === null || product?.precio === undefined) return 0;
  return round2(product.precio * (1 + (Number(product.iva) || 0) / 100) * (Number(units) || 0));
}

/** Without tax: the order line amount of a product. */
export function orderLineAmount(productId: string, units: number): number | null {
  const product = opportunitiesLegacy.products().find(item => item.id === productId);
  return product?.precio === null || product?.precio === undefined ? null : round2(product.precio * units);
}

/** A phone number typed in the search box (digits, spaces and +). */
export const isPhone = (text: string): boolean => /^[+\d\s]{6,}$/.test(text);
