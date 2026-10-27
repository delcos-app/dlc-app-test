/**
 * Small startup steps folded from legado 026–042 (v2.424.0), each called at its own place in the load order: menu names, the
 * mobile orientation and zoom, the local cache limit, maps freed with their screen, the signed-out class, the brand and plan of
 * the company, the bell refresh and the directory map's close button.
 */
import { legacyBActions, legacyBState } from '../../legacy/legado-b-bridge';
import { navLegacy } from '../../legacy/nav-bridge';
import { t, type MessageKey } from '../../i18n';

const CACHE_PREFIX = 'dlc-rc-', CACHE_KEEP = 60, CACHE_CHECK_MS = 10 * 60 * 1000, MAPS_CHECK_MS = 30000, BELL_MS = 30000, ZOOMED = 1.01;
/** Menu entries renamed for the company (and where they live: #nav is the old menu, nav.main the current one). */
const MENU_NAMES = new Map<string, readonly [MessageKey, string]>([['pacientes', ['legacyB.menu.customers', '#nav']], ['ventas', ['legacyB.menu.orders', 'nav.main']],
  ['seguimiento', ['legacyB.menu.dataQuality', 'nav.main']]]);

/** The menu entry of `tab` with its company name (Clientes, Pedidos, Calidad del dato). */
export function renameMenuEntry(tab: string): void {
  const entry = MENU_NAMES.get(tab); if (!entry) return;
  const [key, menu] = entry;
  document.querySelectorAll<HTMLElement>(`[data-t="${tab}"]`).forEach(button => { if (button.closest(menu)) button.textContent = t(key); });
}

/** v2.36.1: portrait only where the system allows it (installed on Android); a zoomed field goes back to normal size on leaving it. */
export function keepPortrait(): void {
  try {
    const orientation = screen.orientation as ScreenOrientation & { lock?: (kind: string) => Promise<void> };
    if (typeof orientation.lock === 'function' && matchMedia('(display-mode: standalone)').matches) orientation.lock('portrait').catch(() => undefined);
  } catch { /* not available */ }
  document.addEventListener('focusout', () => {
    if (window.visualViewport && window.visualViewport.scale > ZOOMED) window.scrollTo(window.scrollX, window.scrollY);
  }, true);
}

const savedAt = (key: string): number => {
  try { return (JSON.parse(localStorage.getItem(key) ?? '{}') as { t?: number }).t ?? 0; } catch { return 0; }
};

/** v2.39.0: the device cache keeps the 60 most recent reads (checked every 10 minutes). */
export function limitLocalCache(): void {
  try {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(CACHE_PREFIX));
    if (keys.length > CACHE_KEEP) keys.map(key => [key, savedAt(key)] as const).sort((first, second) => first[1] - second[1])
      .slice(0, keys.length - CACHE_KEEP).forEach(([key]) => { localStorage.removeItem(key); });
  } catch { /* storage not available */ }
  setTimeout(limitLocalCache, CACHE_CHECK_MS);
}

interface LeafletMap { remove: () => void; getContainer?: () => HTMLElement }
type MapElement = HTMLElement & { __mapa?: LeafletMap };

/** v2.39.0: each Leaflet map is freed when its screen disappears (they used to stay alive in memory). */
export function releaseDetachedMaps(): void {
  const leaflet = (window as unknown as { L?: { map?: (element: string | HTMLElement, options?: unknown) => LeafletMap } }).L;
  if (!leaflet?.map) return;
  const maps = new Set<LeafletMap>(), create = leaflet.map.bind(leaflet), drop = (map: LeafletMap): void => { try { map.remove(); } catch { /* already gone */ } maps.delete(map); };
  leaflet.map = (element, options): LeafletMap => {
    const container = (typeof element === 'string' ? document.getElementById(element) : element) as MapElement | null;
    if (container?.__mapa) drop(container.__mapa);
    const map = create(element, options); if (container) container.__mapa = map; maps.add(map); return map;
  };
  setInterval(() => { maps.forEach(map => { const container = map.getContainer?.(); if (!container?.isConnected) drop(map); }); }, MAPS_CHECK_MS);
}

/** v2.40.0: without a session, the menu is not shown. */
export function markSignedOut(): void {
  if (!legacyBState.profile()) document.body.classList.add('sin-sesion');
}

/** v2.41.0: the brand of the domain the app is opened from (delcos's own after signing up, ?alta=ok). */
export function loadPublicBrand(): void {
  Promise.resolve(legacyBActions.rpcOriginal<Record<string, unknown>>('marca_publica', { p_dominio: /[?&]alta=ok/.test(location.search) ? null : location.hostname })).then(result => {
    if (!result.data) return;
    legacyBState.setBrand(result.data);
    try { localStorage.setItem('app-marca', JSON.stringify(legacyBState.brand())); } catch { /* not remembered */ }
    legacyBActions.applyBrand();
  }, () => undefined);
}

/** v2.41.0: the company's plan, then the menu with what it includes. v2.444.0: only with a session (without one the server refuses it
 * since SQL 181, and the entry screen showed that 401 in the console); signing in asks for it again. */
export function loadPlanUsage(): void {
  Promise.resolve(navLegacy.auth().getSession()).then(async ({ data: { session } }) => {
    if (!session) return;
    const result = await legacyBActions.rpcOriginal<{ plan?: Record<string, unknown> }>('plan_uso', {});
    if (!result.data?.plan) return;
    legacyBState.setPlan(result.data.plan);
    if (legacyBState.profile()) legacyBActions.applyMenuPermissions();
  }).catch(() => undefined);
}

/** v2.41.0: Administración is inside Configuración, so its menu entry is hidden. */
export function hideAdminMenu(): void {
  document.querySelectorAll('[data-u="adm"]').forEach(button => { button.classList.add('hide'); });
}

/** v2.281.0: the bell is refreshed every 30 seconds (and live with SQL 150). */
export function pollBell(): void {
  setInterval(() => { legacyBActions.refreshBell(); }, BELL_MS);
}

/** v2.32.0: the directory map always has a visible close button. */
export function addMapCloseButton(): void {
  const wrap = document.getElementById('mapawrap');
  if (!wrap || document.getElementById('mapacerrar')) return;
  wrap.style.position = 'relative';
  wrap.insertAdjacentHTML('afterbegin', `<button class="mapacerrar" id="mapacerrar" aria-label="${t('legacyB.map.closeLabel')}">${t('legacyB.map.close')}</button>`);
  const close = document.getElementById('mapacerrar');
  if (close) close.onclick = (): void => {
    if (legacyBState.mapMode()) document.getElementById('mapaBtn')?.click();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
}
