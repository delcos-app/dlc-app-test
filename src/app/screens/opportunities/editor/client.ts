/**
 * The opportunity window, step 1: find the client, create their card, or show what we know (last order to repeat it, how many
 * orders, and whether we promised to call them back).
 */
import { legacyDb, notices, opportunitiesLegacy, portalLegacy } from '../../../legacy/bridge';
import { t } from '../../../i18n';
import { formatShortDate } from '../../../services/date-format';
import { escapeHtml, formatNumber } from '../../../services/format';
import { orFallback, sum } from '../../../services/values';
import { isPhone } from '../model';
import { typedQuery, type Client, type Draft } from './draft';
import { paintInterest, paintReference } from './interest';

const SEARCH_WAIT_MS = 250, ORDERS_SHOWN = 20, CALLS_SHOWN = 5;

interface OrderLine { pedido_id: string; producto_id: string; unidades: number; importe?: number | null; iva?: number | null }
interface PastOrder { id: string; numero?: string; fecha: string; estado: string; lineas_pedido: OrderLine[] }
interface PastCall { id: string; fecha: string; resultado?: string | null; proxima_fecha?: string | null; proxima_accion?: string | null; seguimiento_hecho_en?: string | null; pedido_id?: string | null }

const phoneOf = (client: Client): string => orFallback(client.movil, orFallback(client.telefono, orFallback(client.tel, '')));
const orderTotal = (order: PastOrder): number => sum(order.lineas_pedido.map(line => (Number(line.importe) || 0) * (1 + (Number(line.iva) || 0) / 100)));
const productName = (id: string): string => opportunitiesLegacy.products().find(product => product.id === id)?.nombre ?? t('opportunities.editor.defaultProduct');

async function pastOrders(clientId: string): Promise<PastOrder[]> {
  const { data: orders } = await legacyDb().from<Omit<PastOrder, 'lineas_pedido'>[]>('pedidos').select('id,numero,fecha,estado').eq('contacto_id', clientId).neq('estado', 'Anulado')
    .order('fecha', { ascending: false }).limit(ORDERS_SHOWN);
  const list = orders ?? [];
  // The lines apart (without depending on the relation between tables)
  const { data: lines } = list.length ? await legacyDb().from<OrderLine[]>('lineas_pedido').select('pedido_id,producto_id,unidades,importe,iva').in('pedido_id', list.map(order => order.id)) : { data: [] };
  return list.map(order => ({ ...order, lineas_pedido: (lines ?? []).filter(line => line.pedido_id === order.id) }));
}

async function pastCalls(draft: Draft, clientId: string): Promise<PastCall[]> {
  if (!draft.recording) return [];
  const { data } = await legacyDb().from<PastCall[]>('llamadas').select('id,fecha,resultado,proxima_fecha,proxima_accion,seguimiento_hecho_en,pedido_id').eq('contacto_id', clientId)
    .order('fecha', { ascending: false }).limit(CALLS_SHOWN);
  return data ?? [];
}

function lastOrderHtml(draft: Draft, last: PastOrder | undefined): string {
  if (!last) return '';
  const lines = last.lineas_pedido.map(line => `${productName(line.producto_id)} × ${formatNumber(line.unidades)}`).join(', ');
  return `<div class="nvult"><span>${t('opportunities.editor.lastOrder', { date: formatShortDate(String(last.fecha).slice(0, 10)), lines: escapeHtml(lines), amount: portalLegacy.euros(orderTotal(last)) })}</span>
        ${draft.recording && !draft.closed ? `<button type="button" class="btn sec" id="nvrep">${t('opportunities.editor.repeat')}</button>` : ''}</div>`;
}

function contextHtml(draft: Draft, orders: readonly PastOrder[], promised: PastCall | undefined): string {
  if (!orders.length && !promised) return `<span class="sm">${t('opportunities.editor.noOrdersYet')}</span>`;
  const count = { count: formatNumber(orders.length), amount: portalLegacy.euros(sum(orders.map(orderTotal))) };
  const total = orders.length ? `<span class="sm">${t(orders.length === ORDERS_SHOWN ? 'opportunities.editor.ordersMore' : 'opportunities.editor.orders', count)}</span>` : '';
  const callBack = promised ? `<div class="banda-aviso">${t('opportunities.editor.promised', {
    date: formatShortDate(promised.proxima_fecha ?? ''), action: promised.proxima_accion ? `: ${escapeHtml(promised.proxima_accion)}` : '', result: escapeHtml(orFallback(promised.resultado, '')),
  })}</div>` : '';
  return `
      ${lastOrderHtml(draft, orders[0])}
      ${total}
      ${callBack}`;
}

/** What we already know of the chosen client. */
async function paintContext(draft: Draft): Promise<void> {
  const id = draft.client?.id; if (!id) return;
  const [orders, calls] = await Promise.all([pastOrders(id), pastCalls(draft, id)]);
  const box = document.getElementById('nvctx');
  if (draft.client?.id !== id || !box) return;
  const promised = calls.find(call => call.proxima_fecha && !call.seguimiento_hecho_en && !call.pedido_id && call.id !== draft.source.id);
  box.innerHTML = contextHtml(draft, orders, promised);
  const repeat = document.getElementById('nvrep'), last = orders[0];
  if (repeat && last) repeat.onclick = (): void => {
    draft.lines = last.lineas_pedido.map(line => ({ producto_id: line.producto_id, unidades: Number(line.unidades) || 1 }));
    paintInterest(draft); notices.toast(t('opportunities.editor.repeated'));
  };
}

async function choose(draft: Draft, client: Client | undefined): Promise<void> {
  if (!client) return;
  draft.client = client;
  if (client.cuenta_id && !draft.reference) {
    const { data: account } = await legacyDb().from<{ id: string; nombre: string } | null>('cuentas').select('id,nombre').eq('id', client.cuenta_id).maybeSingle();
    if (account) { draft.reference = account; if (document.getElementById('nvmed')) paintReference(draft); }
  }
  paintClient(draft);
}

const resultHtml = (client: Client): string =>
  `<button type="button" class="item" data-nvc="${client.id}"><span class="tx"><b>${escapeHtml(orFallback(client.nombre, ''))}</b><span class="sm">${escapeHtml([orFallback(client.movil, orFallback(client.telefono, '')), client.nif].filter(Boolean).join(' · '))}</span></span></button>`;

let searchTimer: ReturnType<typeof setTimeout> | undefined;

async function search(draft: Draft): Promise<void> {
  const found = await opportunitiesLegacy.searchClients<Client>(typedQuery()), box = document.getElementById('nvres1');
  if (!box) return;
  box.innerHTML = found.map(resultHtml).join('') || (typedQuery().length > 1 ? `<div class="sm" style="padding:6px">${t('opportunities.editor.notFound')}</div>` : '');
  box.querySelectorAll<HTMLElement>('[data-nvc]').forEach(button => { button.onclick = (): void => { void choose(draft, found.find(client => client.id === button.dataset.nvc)); }; });
}

function chosenHtml(draft: Draft, client: Client): string {
  return `<div class="clisel"><span><b>${escapeHtml(orFallback(client.nombre, ''))}</b><span class="sm">${escapeHtml([phoneOf(client), client.nif].filter(Boolean).join(' · '))}</span></span>
        ${draft.closed ? '' : `<button type="button" class="btn sec" id="nvcamb">${t('opportunities.editor.change')}</button>`}</div>`;
}

function searchHtml(draft: Draft): string {
  const source = draft.source, typed = source.id ? orFallback(source.nombre, orFallback(source.telefono, '')) : '';
  return `<input id="nvq" type="search" placeholder="${t('opportunities.editor.searchPlaceholder')}" autocomplete="off" value="${escapeHtml(typed)}"><div class="lista" id="nvres1"></div>
      <div class="acts u-m-6-0-0 u-start"><button type="button" class="btn sec" id="nvalta">${t('opportunities.editor.newCard')}</button>
        ${source.id || draft.previous ? '' : `<button type="button" class="lnk" id="nvsin">${t('opportunities.editor.orderWithoutClient')}</button>`}</div>
      ${draft.recording ? `<div class="sm u-mt-4">${t('opportunities.editor.nameIsEnough')}</div>` : ''}`;
}

function bindSearch(draft: Draft): void {
  const input = document.getElementById('nvq') as HTMLInputElement | null;
  if (input) input.oninput = (): void => { clearTimeout(searchTimer); searchTimer = setTimeout(() => { void search(draft); }, SEARCH_WAIT_MS); };
  const add = document.getElementById('nvalta');
  if (add) add.onclick = (): void => {
    const typed = typedQuery(), phone = isPhone(typed), reference = draft.reference;
    opportunitiesLegacy.editContact({ nombre: phone ? '' : typed, movil: phone ? typed : '', cuenta_id: reference ? reference.id : null, medico: reference ? orFallback(reference.nombre, '') : '' },
      client => { void choose(draft, client as Client); });
  };
  const withoutClient = document.getElementById('nvsin');
  if (withoutClient) withoutClient.onclick = (): void => { (document.getElementById('dlg') as HTMLDialogElement | null)?.close(); opportunitiesLegacy.editOrder(); };
}

/** Paints step 1: the chosen client or the search. */
export function paintClient(draft: Draft): void {
  const box = document.getElementById('nvcli'); if (!box) return;
  const client = draft.client;
  if (client) {
    box.innerHTML = chosenHtml(draft, client);
    const change = document.getElementById('nvcamb');
    if (change) change.onclick = (): void => { draft.client = null; const context = document.getElementById('nvctx'); if (context) context.innerHTML = ''; paintClient(draft); };
    void paintContext(draft);
    return;
  }
  box.innerHTML = searchHtml(draft);
  bindSearch(draft);
}
