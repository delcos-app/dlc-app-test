/**
 * Screens loaded on first use (plan 7.3, cut A). Each src/app/screens/<screen>/chunk.ts is built as its own ES module
 * (min/chunks/<screen>.js, herramientas/bundle.mjs) and the screen's index.ts publishes its functions through lazyChunk(): the same
 * functions, now async, that import the chunk the first time. The chunk reads the modules it shares with the core from the registry
 * (registry.ts), so there is one copy of each module and of its state.
 * - At start-up the chunk of the first screen starts loading at once and the others when the browser is idle (preloadChunks): when
 *   a person opens one of these screens its code is already here and the function runs at once, as before (same timing).
 * - If a screen is opened before its chunk arrives, the wait counts as a request in progress: the screen stays «preparando» with the
 *   usual loader and is shown whole once painted (nothing appears late).
 * - The service worker keeps a copy of every chunk (sw.js), so these screens open without network too.
 */
import { notices } from '../../legacy/bridge';
import { t } from '../../i18n';
import { registerError } from '../errors';
import { LAZY_CHUNKS } from './manifest';

export type ChunkName = (typeof LAZY_CHUNKS)[number];

const CHUNK_FOLDER = 'min/chunks/', IDLE_DELAY_MS = 1500, IDLE_TIMEOUT_MS = 4000;
/** The screens (ids of ir()) whose loader is in a chunk. */
const SCREEN_CHUNKS: Readonly<Record<string, ChunkName | undefined>> = {
  analitica: 'analytics', seguimiento: 'quality', manual: 'manual', eventos: 'events', facturacion: 'billing', delcos: 'platform',
  rutas: 'routes', ventas: 'orders', agenda: 'agenda', directorio: 'accounts', duplicados: 'accounts',
  usuarios: 'settings-users', plan: 'settings-plan', perfil: 'settings-parts', config: 'settings-parts',
};

const loads = new Map<ChunkName, Promise<unknown>>();
/** The chunks already evaluated: their functions are called at once, without waiting a turn. */
const ready = new Map<ChunkName, unknown>();

/** The network counters of the atomic reveal (core/legacy-c/rpc-hooks: countNetwork). */
// eslint-disable-next-line @typescript-eslint/naming-convention -- names the database client calls
interface NetworkCounters { __redIni?: () => number; __redFin?: (mark: number) => void }
const counters = (): NetworkCounters => window as unknown as NetworkCounters;

/** min/chunks/<name>.js with the same ?v= as min/app.js: the copy the service worker keeps has that address. */
function chunkUrl(name: ChunkName): string {
  const script = document.querySelector<HTMLScriptElement>('script[src*="app.js"]');
  const query = script?.src ? new URL(script.src, document.baseURI).search : '';
  return new URL(`${CHUNK_FOLDER}${name}.js${query}`, document.baseURI).href;
}

/** Loads a chunk once; a load that fails (no network and no copy) is tried again the next time. */
export function loadChunk(name: ChunkName): Promise<unknown> {
  const known = loads.get(name);
  if (known) return known;
  const load = (import(chunkUrl(name)) as Promise<unknown>).then(module => { ready.set(name, module); return module; });
  load.catch(() => { loads.delete(name); });
  loads.set(name, load);
  return load;
}

/** The chunk, for someone waiting for it: until it arrives it counts as a request in progress. */
async function waitForChunk(name: ChunkName): Promise<unknown> {
  const mark = counters().__redIni?.();
  try { return await loadChunk(name); } finally { if (mark !== undefined) counters().__redFin?.(mark); }
}

function reportFailure(name: ChunkName, error: unknown): void {
  registerError('error', `chunk ${name}: ${String(error)}`, { chunk: name });
  notices.toast(t('core.offline.screenNotLoaded'), true);
}

type Lazy<Exported> = Exported extends (...args: infer Args) => infer Result ? (...args: Args) => Promise<Awaited<Result> | undefined> : never;

/**
 * The functions of a chunk, loaded on first use: `lazyChunk<typeof Chunk>('analytics')('loadAnalytics')` is loadAnalytics,
 * async. If the chunk cannot be loaded, the error is logged, the person is told and the call gives undefined.
 */
export function lazyChunk<Module>(name: ChunkName): <Key extends keyof Module>(key: Key) => Lazy<Module[Key]> {
  return <Key extends keyof Module>(key: Key): Lazy<Module[Key]> => {
    const run = (module: unknown, args: unknown[]): unknown => ((module as Module)[key] as (...values: unknown[]) => unknown)(...args);
    // Loaded: called right away (an async function runs synchronously up to its first await)
    const call = async (...args: unknown[]): Promise<unknown> => {
      if (ready.has(name)) return run(ready.get(name), args);
      let module: unknown;
      try { module = await waitForChunk(name); } catch (error) { reportFailure(name, error); return undefined; }
      return run(module, args);
    };
    return call as unknown as Lazy<Module[Key]>;
  };
}

const ignoreFailure = (): void => { /* a preload that fails (no network and no copy yet) is tried again when the screen opens */ };

function whenIdle(task: () => void): void {
  if ('requestIdleCallback' in window) requestIdleCallback(task, { timeout: IDLE_TIMEOUT_MS });
  else setTimeout(task, 0);
}

/** At start-up: the chunk of the first screen at once (if it has one), the others when the browser is idle. */
export function preloadChunks(firstScreen: string | undefined): void {
  const first = firstScreen ? SCREEN_CHUNKS[firstScreen] : undefined;
  if (first) loadChunk(first).catch(ignoreFailure);
  setTimeout(() => { whenIdle(() => { LAZY_CHUNKS.forEach(name => { loadChunk(name).catch(ignoreFailure); }); }); }, IDLE_DELAY_MS);
}
