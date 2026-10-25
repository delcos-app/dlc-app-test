/**
 * Writes that survive without coverage: without network a write is kept on the device (the «cola») and sent later, one by one; what the
 * server refuses goes to a separate list to review. Also the read cache (rpcCache: last copy of each read, used without network) and
 * forgetting cached reads after a change. Migrated from the legacy servicios/api.js (v2.425.0); escribir, escribirRpc, vaciarCola,
 * colaLeer, colaGuardar, colaPoner, colaKo, colaKoPoner, marcarSinConexion, invalidarCache, rpcCache, guardarCache, leerCache, cargaLocal,
 * usarCache, pedirTurno and esMiTurno stay as adapters. The shared state (RC, RC_EPOCA, ESCRITURAS, CACHE_MOD, TD_*…) stays in legacy.
 */
import { coreLegacy, type QueuedWrite } from '../legacy/core-bridge';
import { t } from '../i18n';
import { sendPendingPhotos } from '../services/files';
import { isNetworkError } from './errors';
import { wordFor } from './vocabulary';

const QUEUE = 'dlc-cola', REFUSED = 'dlc-cola-ko', NOTICE_DELAY_MS = 1500;
const NETWORK_MESSAGE = /fetch|network|Failed/i, SESSION_MESSAGE = /jwt|token/i;

interface RpcAnswer { data?: unknown; error?: { message?: string } | null }

const readList = (key: string): QueuedWrite[] => { try { return JSON.parse(localStorage.getItem(key) ?? '[]') as QueuedWrite[]; } catch { return []; } };

export const queued = (): QueuedWrite[] => readList(QUEUE);
export const saveQueue = (list: readonly QueuedWrite[]): void => { localStorage.setItem(QUEUE, JSON.stringify(list)); };
export const refused = (): QueuedWrite[] => readList(REFUSED);

/** Adds a write to the queue (false if the device has no space left). */
export function enqueue(write: QueuedWrite): boolean {
  try { saveQueue([...queued(), write]); return true; } catch { coreLegacy.toast(t('core.queue.noSpace'), true); return false; }
}

export function addRefused(write: QueuedWrite, reason: string): void {
  try { localStorage.setItem(REFUSED, JSON.stringify([...refused(), { ...write, motivo: reason, falla: Date.now() }])); } catch { /* nothing to keep it in */ }
}

/** A visit saved without connection says so (the server keeps the mark). */
export function markOffline(name: string, payload: unknown): unknown {
  const params = payload as { p?: Record<string, unknown> } | null;
  if (name !== 'registrar_actividad' || !params?.p) return payload;
  return { ...params, p: { ...params.p, sin_conexion: true } };
}

/** Forgets every cached read (memory and device) after a change other screens show. */
export function forgetCache(): void {
  coreLegacy.forgetReadCache();
  try { coreLegacy.forgetSchemes(); } catch { /* nothing to forget */ }
  try { Object.keys(localStorage).filter(key => key.startsWith('dlc-rc-')).forEach(key => { localStorage.removeItem(key); }); } catch { /* nothing kept */ }
}

function keepOffline(name: string, payload: unknown, label: string | undefined, notice: string): { offline: true } {
  saveQueue([...queued(), { fn: name, payload: markOffline(name, payload), etiqueta: label, t: Date.now() }]);
  coreLegacy.paintConnection();
  coreLegacy.toast(notice);
  return { offline: true };
}

/** Runs a write; without connection, keeps it and sends it later. */
export async function write(name: string, payload: unknown, label?: string): Promise<{ offline?: true; data?: unknown; error?: unknown }> {
  if (!navigator.onLine) return keepOffline(name, payload, label, t('core.queue.offline'));
  const { data, error } = await coreLegacy.db().rpc(name, payload as Record<string, unknown>);
  if (!error) return { data };
  if (NETWORK_MESSAGE.test(String((error as { message?: string }).message ?? ''))) return keepOffline(name, payload, label, t('core.queue.savedHere'));
  return { error };
}

/** Sends one queued write: 'stop' while there is no network (or the session must be renewed), else whether the server refused it. */
async function call(write: QueuedWrite): Promise<RpcAnswer> {
  try { return await coreLegacy.db().rpc(write.fn, write.payload as Record<string, unknown>); } catch (error) { return { error: error as { message?: string } }; }
}

type Outcome = 'stop' | 'sent' | 'refused';
type WriteResult = { ok?: boolean; error?: string; id?: string } | null | undefined;

/** Without network (or with the session to renew) the queue waits; what the server refuses goes aside. */
async function waitForNetwork(error: { message?: string }): Promise<boolean> {
  if (isNetworkError(error)) return true;
  if (!SESSION_MESSAGE.test(String(error.message ?? ''))) return false;
  try { await coreLegacy.db().auth.refreshSession(); } catch { /* next time */ }
  return true;
}

async function failure(write: QueuedWrite, error: { message?: string } | null | undefined, result: WriteResult): Promise<Outcome | null> {
  if (error && await waitForNetwork(error)) return 'stop';
  if (!error && result?.ok !== false) return null;
  addRefused(write, error ? String(error.message ?? '') : (result?.error ?? 'rechazado'));
  return 'refused';
}

/** Sends one queued write: 'stop' while there is no network (or the session must be renewed), else whether the server refused it. */
async function sendOne(write: QueuedWrite): Promise<Outcome> {
  const { data, error } = await call(write), result = data as WriteResult;
  const outcome = await failure(write, error, result); if (outcome) return outcome;
  const operation = (write.payload as { p?: { op_id?: string } } | null)?.p?.op_id;
  if (write.fn === 'registrar_actividad' && result?.id && operation) await sendPendingPhotos(operation, result.id);
  return 'sent';
}

let sending = false;

/** Sends the queue one by one; what the server refuses goes to the list to review. */
export async function sendQueue(): Promise<void> {
  if (!navigator.onLine || sending) return;
  let list = queued(); if (!list.length) return;
  sending = true;
  const before = list.length; let refusedCount = 0;
  try {
    coreLegacy.paintConnection();
    while (list.length) {
      const first = list[0]; if (!first) break;
      const outcome = await sendOne(first);
      if (outcome === 'stop') break;
      if (outcome === 'refused') refusedCount++;
      list = queued().slice(1); saveQueue(list);
    }
  } finally { sending = false; }
  coreLegacy.paintConnection();
  if (refusedCount) coreLegacy.toast(t(refusedCount === 1 ? 'core.queue.oneRefused' : 'core.queue.refused', { count: refusedCount }), true);
  if (queued().length < before) { forgetCache(); coreLegacy.reloadHome(); if (coreLegacy.currentScreen() === 'agenda') coreLegacy.reloadAgenda(); }
}

/** A write of a visit (or anything) that, without network, stays queued on the device. */
export async function writeOrQueue(name: string, payload: unknown): Promise<RpcAnswer> {
  const answer: RpcAnswer = navigator.onLine ? await coreLegacy.db().rpc(name, payload as Record<string, unknown>) : { error: { message: 'Failed to fetch' } };
  if (answer.error && isNetworkError(answer.error)) {
    enqueue({ fn: name, payload: markOffline(name, payload), etiqueta: wordFor('visita', 's', { nounCase: 'C' }), t: Date.now() });
    coreLegacy.paintConnection();
    setTimeout(() => { coreLegacy.toast(t('core.queue.keptOnDevice')); }, NOTICE_DELAY_MS);
    return { data: { encolada: true }, error: null };
  }
  return answer;
}

