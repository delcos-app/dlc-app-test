/**
 * What every database call goes through, wrapped in the same order as the legacy layers did: a 20 s limit (v2.46.1), the error log of
 * failed calls (v2.52.0), the count of successful writes (v2.56.0), each query sent only once however many parts wait for it and the
 * network counters of the atomic reveal (v2.60.0), and the next receipt read with the payment data (v2.166.0). Folded from legado 051,
 * 053, 057, 059 and 076 (v2.425.0).
 */
import * as legacyFreeCoreLegacyC from './';
import { sessionStore } from '../session-store';
import { t } from '../../i18n';
import { navigationStore } from '../navigation/store';
import * as legacyFreeCoreServices from '../services';
interface RpcAnswer { data?: unknown; error?: { message?: string; code?: string } | null }
type Rpc = (name: string, params?: unknown, options?: unknown) => unknown;
type Invoke = (name: string, options?: { body?: { accion?: string } }, ...rest: unknown[]) => Promise<{ data?: { ok?: boolean; proximo?: unknown } | null }>;
interface Client { rpc: Rpc; functions: { invoke: Invoke }; from: (table: string) => { select: (columns: string) => object } }

const client = (): Client => db as unknown as Client;
const isThenable = (value: unknown): value is PromiseLike<RpcAnswer> => typeof (value as { then?: unknown } | null)?.then === 'function';

const TIMEOUT_MS = 20000, TRACE_CHARS = 1500, STALE_MS = 3000;

/** v2.46.1: a call that never answers ends as an error after 20 s (before, the screen waited forever). */
export function limitCallTime(): void {
  const original = client().rpc;
  client().rpc = (name, params, options) => {
    const result = original.call(db, name, params, options);
    if (!isThenable(result)) return result;
    let done = false;
    const limit = new Promise<RpcAnswer>(resolve => { setTimeout(() => { if (!done) resolve({ data: null, error: { message: t('legacyTexts.timeout', { name }), code: 'TIEMPO' } }); }, TIMEOUT_MS); });
    const answer = Promise.resolve(result).then(value => { done = true; return value; }, (error: unknown) => { done = true; return { data: null, error } as RpcAnswer; });
    return legacyFreeCoreServices.withCatch((Promise.race([answer, limit])));
  };
}

/** What a rejected promise says: its message, the value itself, or «Promesa rechazada» (as the legacy `a && (a.message || a) || …`). */
function rejectionText(reason: unknown): string {
  if (!reason) return 'Promesa rechazada';
  const message = (reason as { message?: unknown }).message;
  return String(message ? message : reason);
}

const rejectionStack = (reason: unknown): string | null => {
  const stack = (reason as { stack?: unknown } | null | undefined)?.stack;
  return stack ? String(stack).slice(0, TRACE_CHARS) : null;
};

/** v2.52.0: page errors, rejected promises and database errors (not the expected permission ones) go to the error log. */
export function logErrors(): void {
  window.addEventListener('error', event => {
    const stack = (event.error as Error | null)?.stack;
    legacyFreeCoreServices.errors.registerError(('error'), event.message, ({ archivo: (event.filename || '').split('/').pop(), linea: event.lineno, columna: event.colno, pila: stack ? String(stack).slice(0, TRACE_CHARS) : null }));
  });
  window.addEventListener('unhandledrejection', event => {
    legacyFreeCoreServices.errors.registerError(('error'), (rejectionText(event.reason)), ({ pila: rejectionStack(event.reason) }));
  });
  const original = client().rpc;
  client().rpc = (name, params, options) => {
    const result = original.call(db, name, params, options);
    if (isThenable(result) && name !== 'registrar_error') Promise.resolve(result).then(answer => {
      const error = answer.error;
      if (error && !/permiso|JWT|TIEMPO/i.test(error.message ?? '') && error.code !== 'TIEMPO') legacyFreeCoreServices.errors.registerError(('api'), (`${name}: ${error.message ?? error.code ?? ''}`), ({ funcion: name, codigo: error.code }));
    }, () => undefined);
    return result;
  };
}

/** v2.56.0: each successful write is counted (closing a window without changes does not reload). */
export function countWrites(): void {
  const original = client().rpc;
  client().rpc = (name, params, options) => {
    const result = original.call(db, name, params, options);
    if (ES_ESCRITURA.test(name) && isThenable(result)) Promise.resolve(result).then(answer => { if (!answer.error) sessionStore.writes++; }, () => undefined);
    return result;
  };
}

/** v2.60.0: the network counters of the atomic reveal (called by the database client when a request starts and ends). */
export function countNetwork(): void {
  // eslint-disable-next-line @typescript-eslint/naming-convention -- names the database client calls
  const target = window as unknown as { __redIni: () => number; __redFin: (mark: number) => void };
  target.__redIni = (): number => { RED_PEND++; const mark = performance.now() + Math.random() / 1000; RED_EN_CURSO.add(mark); return mark; };
  target.__redFin = (mark): void => { if (RED_EN_CURSO.delete(mark)) { RED_PEND--; RED_ULTIMO_FIN = performance.now(); } };
}

/**
 * Calls in progress started from `since` on (also preloads launched a little before entering); calls running for more than 3 s are not
 * counted (a stuck background refresh must not hold the screen).
 */
export function pendingSince(since: number): number {
  const limit = performance.now() - (Date.now() - since) - STALE_MS;
  let count = 0; RED_EN_CURSO.forEach(started => { if (started >= limit) count++; });
  return count;
}

interface OnceQuery { then: (ok?: unknown, ko?: unknown) => unknown; __unaVez?: Promise<unknown> }

/** v2.60.0: each query runs ONCE however many parts wait for it (the library sent it again every time someone awaited it). */
export function runQueriesOnce(): void {
  let prototype = Object.getPrototypeOf(client().from('perfiles').select('id')) as object | null;
  while (prototype && !Object.prototype.hasOwnProperty.call(prototype, 'then')) prototype = Object.getPrototypeOf(prototype) as object | null;
  if (!prototype) return;
  const target = prototype as OnceQuery, original = target.then;
  target.then = function (this: OnceQuery, ok?: unknown, ko?: unknown): unknown {
    this.__unaVez ??= original.call(this, (value: unknown) => value, (error: unknown) => { throw error; }) as Promise<unknown>;
    return this.__unaVez.then(ok as (value: unknown) => unknown, ko as (error: unknown) => unknown);
  };
}

/** v2.166.0: when the payment data arrives, the next receipt is kept and painted. */
export function readNextReceipt(): void {
  const functions = client().functions, original = functions.invoke.bind(functions);
  functions.invoke = async (name, options, ...rest) => {
    const result = await original(name, options, ...rest);
    try {
      if (name === 'pagos' && options?.body?.accion === 'datos' && result.data?.ok) { PAGO_PROXIMO = result.data.proximo ?? null; legacyFreeCoreLegacyC.paintNextReceipt(); }
    } catch { /* the receipt is optional */ }
    return result;
  };
}

const TRAIL_LENGTH = 25, TRAIL_TEXT = 50;

/** The first non-empty text (as the legacy `a || b || c || ''`). */
const firstText = (...texts: (string | null | undefined)[]): string => texts.find(text => Boolean(text)) ?? '';

/** v2.57.0: the last actions of the person, to reproduce a reported problem. */
export function recordTrail(): void {
  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target.closest<HTMLElement>('button, a, [data-t], [data-cfg], .dr, .trow') : null; if (!target) return;
    RASTRO.push({ t: new Date().toISOString().slice(11, 19), pantalla: navigationStore.screen, que: firstText(target.getAttribute('aria-label'), target.title, target.textContent).trim().replace(/\s+/g, ' ').slice(0, TRAIL_TEXT) });
    if (RASTRO.length > TRAIL_LENGTH) RASTRO.shift();
  }, true);
}
