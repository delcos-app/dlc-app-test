/**
 * Sales channels (plan 12.2, VEN-1, D3 B, D4 A, D5 B, v2.470.0): each company's catalogue of the ways it sells. A channel says who
 * buys (a customer with a reference account, or an account), to whom the sale is attributed, whether the customer is joined to the
 * reference account, whether it counts in the account's portal, the discount it proposes, which orders that arrive by themselves
 * land in it, whether it is the default one and whether it is active. Orders keep its key (pedidos.canal). SQL 195 sends the list
 * with the settings at start-up (ajustes_lista → «canales_venta»); without SQL 195 the settings do not bring it and the app works
 * with the two fixed channels of before, «paciente» and «centro» (now «Venta a centro», without «(con descuento)», D3 B).
 * With only one active channel there is nothing to choose: no selector in the order editor and no channel filter.
 */
import { term } from '../legacy/bridge';
import { organisationLegacy } from '../legacy/organisation-bridge';
import { t } from '../i18n';
import { escapeHtml } from '../services/format';

/** The setting SQL 195 adds to ajustes_lista (computed from the table canales_venta, never saved as a setting). */
export const SETTING_CHANNELS = 'canales_venta';

export type Buyer = 'cliente' | 'cuenta';
export type Attribution = 'referencia' | 'compradora' | 'ninguna';
/** The orders that arrive by themselves (import, the account's portal, services with material, consignment). */
export const ORIGINS = ['importacion', 'portal', 'servicios', 'consigna'] as const;
export type Origin = typeof ORIGINS[number];

export interface SalesChannel {
  clave: string; nombre: string; compra: Buyer; atribucion: Attribution; une_cliente: boolean; en_portal: boolean;
  descuento: number | null; origenes: string[]; por_defecto: boolean; orden: number; activo: boolean;
}

const PATIENT = 'paciente', CENTRE = 'centro';

/** The two channels of before v2.470.0 (and of a company without SQL 195), with their rules of always. */
function fixedChannels(): [SalesChannel, SalesChannel] {
  return [
    { clave: PATIENT, nombre: t('core.terms.saleTo', { customer: term('paciente', { article: 'al' }) }), compra: 'cliente', atribucion: 'referencia',
      une_cliente: true, en_portal: true, descuento: null, origenes: ['importacion'], por_defecto: true, orden: 1, activo: true },
    { clave: CENTRE, nombre: t('core.terms.saleToCentre'), compra: 'cuenta', atribucion: 'compradora', une_cliente: false, en_portal: false,
      descuento: null, origenes: ['portal', 'servicios', 'consigna'], por_defecto: false, orden: 2, activo: true },
  ];
}

const isChannel = (value: unknown): value is SalesChannel =>
  Boolean(value) && typeof value === 'object' && typeof (value as SalesChannel).clave === 'string' && typeof (value as SalesChannel).nombre === 'string';

function stored(): SalesChannel[] | null {
  const value = organisationLegacy.setting(SETTING_CHANNELS);
  if (!Array.isArray(value)) return null;
  const list = value.filter(isChannel);
  return list.length ? list : null;
}

/** Whether the database keeps the company's channels (false without SQL 195). */
export const knowsChannels = (): boolean => stored() !== null;

/** Every channel of the company, active or not, in its order. */
export function salesChannels(): SalesChannel[] {
  const list = stored() ?? fixedChannels();
  return [...list].sort((one, other) => (one.orden - other.orden) || one.clave.localeCompare(other.clave));
}

export const activeChannels = (): SalesChannel[] => salesChannels().filter(channel => channel.activo);

export const channelOf = (key: string | null | undefined): SalesChannel | undefined => salesChannels().find(channel => channel.clave === key);

/** The channel of a new order: the default one (active), otherwise the first active one. */
export function defaultChannel(): SalesChannel {
  const active = activeChannels(), [first] = salesChannels();
  return active.find(channel => channel.por_defecto) ?? active[0] ?? first ?? fixedChannels()[0];
}

/**
 * The name of a channel. A key the company does not have (orders saved before SQL 195 repaired them) reads as before: «centro» as
 * «Venta a centro», anything else as the default channel.
 */
export function channelName(key: string | null | undefined): string {
  const channel = channelOf(key);
  if (channel) return channel.nombre;
  return key === CENTRE ? t('core.terms.saleToCentre') : defaultChannel().nombre;
}

/** Whether there is a channel to choose (more than one active): only then the editor asks it and the lists filter by it. */
export const choosesChannel = (): boolean => activeChannels().length > 1;

/** Whether an account buys in this channel (the editor asks the buying account instead of the customer and its reference). */
export const buysAsAccount = (key: string | null | undefined): boolean => channelOf(key)?.compra === 'cuenta';

/** The channel's own discount (a percentage), 0 without one. */
export const channelDiscount = (key: string | null | undefined): number => Number(channelOf(key)?.descuento ?? 0) || 0;

/** «Venta a centro» → «venta a centro» (inside a sentence: «Solo venta a centro»). */
export const lowerFirst = (text: string): string => text.charAt(0).toLocaleLowerCase('es') + text.slice(1);

/** The options of a channel filter: «all» first, then every channel (a deactivated one says so). */
export function channelFilterOptions(allText: string, chosen = ''): string {
  const option = (value: string, text: string): string => `<option value="${escapeHtml(value)}" ${value === chosen ? 'selected' : ''}>${escapeHtml(text)}</option>`;
  return option('', allText) + salesChannels().map(channel =>
    option(channel.clave, channel.activo ? channel.nombre : t('salesChannels.inactiveOption', { name: channel.nombre }))).join('');
}
