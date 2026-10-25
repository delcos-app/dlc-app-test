/**
 * The cache of requests (legado 017, v2.424.0). What was already received is reused for some seconds or minutes depending on the
 * data; two equal requests at the same time become one; any write empties the cache so the next read is current. The original
 * functions (RPC_ORIG, FROM_ORIG) and the cache maps (RC, RC_VUELO) stay legacy globals: api.js and other code read them.
 */
import { cacheLegacy } from '../../legacy/legado-a-bridge';

const DEVICE_TTL_S = 300, WRITES = ['insert', 'update', 'upsert', 'delete'];

interface Entry { t: number; r: { data: unknown; error: null } }
interface Answer { data?: unknown; error?: unknown }
interface Request { name: string; params: unknown; options: unknown; key: string; ttl: number }

function stored(key: string): Entry | null {
  try { return JSON.parse(localStorage.getItem(cacheLegacy.storageKey(key)) ?? 'null') as Entry | null; } catch { return null; }
}

function store(key: string, entry: Entry): void {
  try { localStorage.setItem(cacheLegacy.storageKey(key), JSON.stringify(entry)); } catch { /* full or blocked */ }
}

function fetchAndKeep({ name, params, options, key, ttl }: Request): Promise<Answer> {
  const epoch = cacheLegacy.epoch(), flying = cacheLegacy.flying();
  const request = Promise.resolve(cacheLegacy.original(name, params, options)).then(answer => {
    flying.delete(key);
    if (!answer.error && epoch === cacheLegacy.epoch()) {
      const entry: Entry = { t: Date.now(), r: { data: answer.data, error: null } };
      cacheLegacy.cache().set(key, entry);
      if (ttl >= DEVICE_TTL_S) store(key, entry);
    }
    return answer;
  }, (error: unknown) => { flying.delete(key); throw error; });
  flying.set(key, request);
  return request.then(cacheLegacy.copy);
}

function cachedRpc(name: string, params?: unknown, options?: unknown): Promise<Answer> {
  if (cacheLegacy.isWrite(name)) { cacheLegacy.forget(); return cacheLegacy.withCatch(cacheLegacy.original(name, params, options)); }
  const ttl = cacheLegacy.ttl(name);
  if (!ttl || !navigator.onLine) return cacheLegacy.withCatch(cacheLegacy.original(name, params, options));
  const key = `${name}|${JSON.stringify(params ?? {})}`, cache = cacheLegacy.cache();
  let entry = cache.get(key) as Entry | undefined | null;
  if (!entry && ttl >= DEVICE_TTL_S) {   // data that changes little is also kept in the device
    entry = stored(key);
    if (entry) cache.set(key, entry);
  }
  if (entry && Date.now() - entry.t < ttl * 1000) return Promise.resolve(cacheLegacy.copy(entry.r));
  const flying = cacheLegacy.flying().get(key);
  if (flying) return flying.then(cacheLegacy.copy);
  return fetchAndKeep({ name, params, options, key, ttl });
}

/** Replaces db.rpc and db.from: reads through the cache, writes empty it. */
export function installRequestCache(): void {
  const database = cacheLegacy.database();
  database.rpc = cachedRpc;
  database.from = (table: string): Record<string, unknown> => {
    const query = cacheLegacy.originalFrom(table);
    WRITES.forEach(method => {
      const write = query[method];
      if (typeof write === 'function') query[method] = (...args: unknown[]): unknown => { cacheLegacy.forget(); return (write as (...values: unknown[]) => unknown).apply(query, args); };
    });
    return query;
  };
}
