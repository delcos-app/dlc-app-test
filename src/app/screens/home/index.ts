/**
 * Home screen (Inicio). Migrated from the legacy cargarInicio/pintarMosaico chain (v2.385.0).
 * The header actions and the professional portal home are in ./portal-home (v2.417.0).
 */
import { currentScreen, permissions } from '../../legacy/bridge';
import type { Route } from '../../core/router';
import { loadIndicators } from './indicators';
import { paintProfessionalHome, placeHeader, removeOldBlocks } from './portal-home';
import { loadHomeData } from './service';
import { renderMosaic, renderSkeleton } from './view';

export { renderSkeleton };

let loading: Promise<void> | null = null;
let reloadAfter = false;
let mosaicTurn = 0;

const isHome = (): boolean => currentScreen() === 'inicio';

async function paintMosaic(): Promise<void> {
  if (!isHome() || permissions.isProfessionalPortal()) return;
  const turn = ++mosaicTurn;
  const data = await loadHomeData();
  if (turn !== mosaicTurn || !isHome()) return;
  renderMosaic(data);
}

async function paintIndicators(): Promise<void> {
  if (permissions.isProfessionalPortal()) { await paintProfessionalHome(); return; }
  document.getElementById('v-inicio')?.classList.remove('ini-cargando');
  removeOldBlocks();
  await loadIndicators();
}

/** One load at a time; a request while loading repeats it once at the end (the data may have changed meanwhile). */
function loadIndicatorsOnce(): Promise<void> {
  if (!isHome()) return Promise.resolve();
  if (loading) { reloadAfter = true; return loading; }
  reloadAfter = false;
  loading = paintIndicators().catch((error: unknown) => { console.error(error); }).finally(() => {
    loading = null;
    if (reloadAfter && isHome()) void load();
  });
  return loading;
}

/** Shows Inicio: skeleton first, then the indicators and the mosaic. */
export function load(): Promise<void> {
  if (isHome()) { renderSkeleton(); placeHeader(); }
  const done = loadIndicatorsOnce();
  void done.then(() => paintMosaic()).catch(() => undefined);
  return done;
}

export const homeRoute: Route = { id: 'inicio', enter: () => load() };
