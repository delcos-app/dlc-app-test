/**
 * The layers legado 030, 037, 038 and 040 put around db.rpc, each installed at its own place in the load order (the chain of
 * wrappers keeps its order): only the latest answer of a list counts, the reads in flight are counted for the loader, a confirmed
 * order is invoiced when the company asks for it, and the product of the last order (and its call) is remembered (v2.424.0).
 */
import { notices } from '../../legacy/bridge';
import { legacyBActions, legacyBState, rawDb, type RpcAnswer, type RpcFunction } from '../../legacy/legado-b-bridge';
import { t } from '../../i18n';

const LATEST_ONLY = new Set(['pedidos_pagina', 'facturas_lista', 'llamadas_lista', 'clientes_lista', 'analitica_tabla', 'compras_lista', 'stock_resumen']);
const WRITES = /^(guardar|registrar|marcar|asignar|emitir|borrar|eliminar|anular|vincular|descartar|restaurar|leer|validar|ordenar|aplazar|bloquear|desbloquear|recibir|rectificar|unificar|cambiar|crear|pruebas)_/;
const READ_GIVE_UP_MS = 8000, INVOICE_TOAST_DELAY_MS = 900, DRAFT = 'Borrador', SAVE_ORDER = 'guardar_pedido', HABITUAL_PRODUCT_KEY = 'dlc-prod-habitual';

/** Wraps db.rpc: `wrap` receives each call and what the previous layer answered. */
function wrapRpc(wrap: (answer: unknown, name: string, params: Record<string, unknown> | undefined) => unknown): void {
  const target = rawDb(), previous: RpcFunction = target.rpc.bind(target);
  target.rpc = (name, params, options): unknown => wrap(previous(name, params, options), name, params);
}

/** Resolves with the answer only when `stillValid` says so (a newer request or screen leaves it pending). */
const onlyIf = (answer: unknown, stillValid: () => boolean): Promise<unknown> =>
  legacyBActions.withCatch(new Promise(resolve => { Promise.resolve(answer).then(value => { if (stillValid()) resolve(value); }, () => undefined); }));

/** v2.37.0: in lists only the latest request counts; any cached read is dropped when the user changes screen. */
export function keepLatestAnswers(): void {
  wrapRpc((answer, name) => {
    if (LATEST_ONLY.has(name)) {
      const turn = legacyBActions.orderTurn(name), generation = legacyBState.navigationGeneration();
      return onlyIf(answer, () => legacyBActions.isMyTurn(name, turn) && generation === legacyBState.navigationGeneration());
    }
    if (!(name in legacyBState.rpcTtl())) return answer;
    const generation = legacyBState.navigationGeneration(), query = answer as { abortSignal?: (signal: AbortSignal) => unknown } | null;
    try { if (typeof query?.abortSignal === 'function') query.abortSignal(legacyBState.navigationSignal()); } catch { /* not a query builder */ }
    return onlyIf(answer, () => generation === legacyBState.navigationGeneration());
  });
}

/** v2.40.0: the reads in flight are counted (not the writes), so a screen is shown whole when its data has arrived. */
export function countPendingReads(): void {
  wrapRpc((answer, name) => {
    if (WRITES.test(name)) return answer;
    legacyBState.addPendingRead(1);
    let done = false;
    const finish = (): void => { if (!done) { done = true; legacyBState.addPendingRead(-1); } };
    Promise.resolve(answer).then(finish, finish); setTimeout(finish, READ_GIVE_UP_MS);
    return answer;
  });
}

interface SavedOrder { ok?: boolean; id?: string; estado?: string }

async function invoiceIfAsked(saved: SavedOrder): Promise<void> {
  const billing = legacyBState.settings().facturacion as { emitir_al_validar?: boolean } | undefined;
  if (!saved.ok || !saved.id || saved.estado === DRAFT || !billing?.emitir_al_validar || !legacyBActions.canInvoice()) return;
  const { data: invoice } = await legacyBActions.rpcOriginal<{ ok?: boolean; numero?: string }>('emitir_factura', { p_pedido: saved.id });
  if (invoice?.ok) setTimeout(() => { notices.toast(t('legacyB.orders.invoiceIssued', { number: invoice.numero ?? '' })); }, INVOICE_TOAST_DELAY_MS);
}

/** v2.31.0: a confirmed order is invoiced at once when Datos fiscales says so. */
export function invoiceOnConfirm(): void {
  wrapRpc((answer, name, params) => {
    const order = params?.p as { estado?: string } | undefined;
    if (name !== SAVE_ORDER || !order || order.estado === DRAFT) return answer;
    return legacyBActions.withCatch(Promise.resolve(answer as Promise<RpcAnswer<SavedOrder>>).then(async result => {
      try { if (!result.error && result.data) await invoiceIfAsked(result.data); } catch { /* the order is saved anyway */ }
      return result;
    }));
  });
}

async function linkToCall(result: RpcAnswer<SavedOrder>): Promise<void> {
  const call = legacyBState.pendingCall();
  if (result.error || !result.data?.ok || !result.data.id || !call) return;
  await legacyBActions.rpcOriginal('vincular_llamada_pedido', { p_llamada: call, p_pedido: result.data.id });
  legacyBState.forgetPendingCall(); notices.toast(t('legacyB.orders.linkedToCall'));
}

/** v2.38.0: the product of the last saved order is proposed in the next one; an order made from a call is linked to it. */
export function rememberOrderProduct(): void {
  wrapRpc((answer, name, params) => {
    if (name !== SAVE_ORDER) return answer;
    try {
      const lines = (params?.p as { lineas?: { producto_id?: string }[] } | undefined)?.lineas ?? [];
      if (lines[0]?.producto_id) localStorage.setItem(HABITUAL_PRODUCT_KEY, lines[0].producto_id);
    } catch { /* not remembered */ }
    if (!legacyBState.pendingCall()) return answer;
    return legacyBActions.withCatch(Promise.resolve(answer as Promise<RpcAnswer<SavedOrder>>).then(async result => { await linkToCall(result); return result; }));
  });
}
