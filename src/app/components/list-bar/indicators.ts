/**
 * The band of indicators that filter (Cuentas, Clientes): its skeleton with the same places, the figures counting up the first time,
 * and a reload only when the cache epoch or the filters change or a minute has passed. Migrated from plKpisHtml and plCargarKpis
 * (v2.236.0; v2.240.0; v2.421.0).
 */
import { currentScreen } from '../../legacy/bridge';
import { listBarLegacy } from '../../legacy/listbar-bridge';
import { escapeHtml, formatNumber } from '../../services/format';
import { configOf, configs } from './configs';
import { indicatorCache, type IndicatorCache } from './state';
import type { ListConfig } from './types';

const DEFAULT_PLACES = 4, FRESH_MS = 60000, COUNT_UP_MS = 700;

function bandHtml(tab: string): string {
  const config = configs[tab] as ListConfig, cache = indicatorCache[tab];
  if (!cache?.datos) return Array.from({ length: config.nKpis ?? DEFAULT_PLACES }, () => '<div class="plk plcarga"><span class="plkt"><i class="plsk" style="width:46%"></i></span><b><i class="plsk plskv"></i></b><small><i class="plsk" style="width:70%"></i></small></div>').join('');
  return cache.datos.map(item => `<button type="button" class="plk ${config.kpiOn(item.k) ? 'on' : ''}" data-plk="${item.k}"><span class="plkt">${escapeHtml(item.t)}</span><b data-pln="${item.n}">${formatNumber(item.n)}</b><small>${escapeHtml(item.s)}</small></button>`).join('');
}

/** The indicators of a screen (its skeleton until they arrive), or nothing if it has none. */
export const indicatorsHtml = (tab: string): string => (configOf(tab)?.kpis ? bandHtml(tab) : '');

function countUp(box: Element): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  box.querySelectorAll<HTMLElement>('b[data-pln]').forEach(figure => {
    const target = Number(figure.dataset.pln), start = performance.now(); if (!target) return;
    const step = (): void => {
      const progress = Math.min(1, (performance.now() - start) / COUNT_UP_MS);
      figure.textContent = formatNumber(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) requestAnimationFrame(step);
    };
    step();
  });
}

const isFresh = (cache: IndicatorCache | undefined, epoch: number, signature: string): boolean =>
  Boolean(cache?.datos && cache.epoca === epoch && cache.firma === signature && Date.now() - (cache.t ?? 0) < FRESH_MS);

/** Loads the indicators of the open screen if they are not fresh (a change of filters while loading asks again at the end). */
export function loadIndicators(tab: string): void {
  if (tab !== currentScreen()) return;
  const config = configOf(tab); if (!config?.kpis) return;
  const epoch = listBarLegacy.cacheEpoch(), signature = config.kpiFirma ? config.kpiFirma() : '';
  let cache = indicatorCache[tab];
  if (cache?.pend) { if (signature !== cache.firma) cache.otra = true; return; }
  if (isFresh(cache, epoch, signature)) return;
  cache = Object.assign(cache ?? {}, { pend: true, firma: signature, otra: false }); indicatorCache[tab] = cache;
  const loading = cache;
  config.kpis().then(data => {
    const first = !loading.datos;
    Object.assign(loading, { datos: data, t: Date.now(), epoca: epoch, pend: false });
    const box = document.querySelector(`#v-${tab} .plkpis`);
    if (box) { box.innerHTML = indicatorsHtml(tab); if (first) countUp(box); }
    if (loading.otra) { loading.otra = false; loadIndicators(tab); }
  }, () => { loading.pend = false; });
}
