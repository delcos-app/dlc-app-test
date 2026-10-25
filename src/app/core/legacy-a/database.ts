/**
 * How the database client works (legado 001, v2.424.0): the lock within the tab, the maximum time of every request and where the
 * pending requests are counted. The client itself stays the legacy global `db`, created with these options.
 */
import { startupLegacy } from '../../legacy/legado-a-bridge';

const LOCK_MAX_WAIT_MS = 8000, REQUEST_TIMEOUT_MS = 20000;

type Task<T> = () => Promise<T>;

/**
 * Lock within the tab: avoids long waits when another tab of the app is open. It never waits more than 8 s for the previous
 * operation: if a session refresh hangs (poor coverage, back from the background on a phone), the next requests do not wait forever.
 */
function tabLock(): <T>(name: string, timeout: number, task: Task<T>) => Promise<T> {
  const queues: Record<string, Promise<unknown>> = {};
  return <T>(name: string, timeout: number, task: Task<T>): Promise<T> => {
    void timeout;   // Supabase passes its own wait; this lock uses LOCK_MAX_WAIT_MS
    const previous = queues[name] ?? Promise.resolve();
    const run = Promise.race([previous, new Promise(resolve => { setTimeout(resolve, LOCK_MAX_WAIT_MS); })]).then(() => task());
    queues[name] = run.catch(() => undefined);
    return run;
  };
}


/**
 * Every request has a maximum time (20 s): if the network does not answer, it fails instead of loading forever. All real requests
 * go through here: it is where the pending ones are counted (to show each screen whole).
 */
function timedFetch(url: RequestInfo | URL, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController(), timer = setTimeout(() => { controller.abort(); }, REQUEST_TIMEOUT_MS);
  if (options.signal) {
    if (options.signal.aborted) controller.abort();
    else options.signal.addEventListener('abort', () => { controller.abort(); });
  }
  // window.__redIni / __redFin count the pending requests (nucleo); they may not exist yet
  const start = Reflect.get(window, '__redIni') as (() => unknown) | undefined, end = Reflect.get(window, '__redFin') as ((mark: unknown) => void) | undefined;
  const mark = start ? start() : null;
  return fetch(url, { ...options, signal: controller.signal }).then(response => startupLegacy.withOldKeys(String(url), response)).finally(() => {
    clearTimeout(timer);
    if (mark && end) end(mark);
  });
}

/** The options of the Supabase client: session kept in the device, tab lock and timed requests. */
export const databaseOptions = (): object => ({
  auth: { persistSession: true, autoRefreshToken: true, storageKey: 'dlc-os-sesion', lock: tabLock() },
  global: { fetch: timedFetch },
});
