/**
 * Route listeners from the first deliveries (legado 003, 007, 011 and 019, v2.424.0): a [data-ruta] button plans its route, a
 * [data-nav] link opens the navigation app, the route bar refreshes every minute while a route is in progress and after a window
 * closes. Each one is registered by its legado file at its place in the load order.
 */
import { routeListenersLegacy } from '../../legacy/legado-a-bridge';

const BAR_REFRESH_MS = 60000, AFTER_DIALOG_MS = 400;

/** A [data-ruta] button plans its route (v2.203.0: those with their own click are not launched twice; legado 003). */
export function listenToRouteButtons(): void {
  document.addEventListener('click', event => {
    const button = (event.target as Element).closest<HTMLElement>('[data-ruta]');
    if (button && !button.onclick) routeListenersLegacy.plan(button.dataset.ruta ?? '', button);
  });
}

/** Approximate distance in km between two points (0 without a starting point: no travel to count). */
export function km(from: readonly (number | null | undefined)[] | null | undefined, to: readonly (number | null | undefined)[] | null | undefined): number {
  if (!from || !to || from[0] === null || from[0] === undefined || to[0] === null || to[0] === undefined) return 0;
  // Number(): like the legacy arithmetic (a missing longitude gives NaN, a text gives its number)
  const fromLat = Number(from[0]), fromLon = Number(from[1]), toLat = Number(to[0]), toLon = Number(to[1]);
  const earthRadius = 6371, radians = Math.PI / 180;
  const latitudeDelta = (toLat - fromLat) * radians, longitudeDelta = (toLon - fromLon) * radians;
  const chord = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(fromLat * radians) * Math.cos(toLat * radians) * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(chord));
}

/** While a route is in progress, its bar is repainted every minute (legado 007). */
export function refreshRouteBar(): void {
  setInterval(() => { if (routeListenersLegacy.routeInProgress()) routeListenersLegacy.paintBar(); }, BAR_REFRESH_MS);
}

/** A [data-nav] link opens the navigation app with its destination and stops (legado 011). */
export function listenToNavigationLinks(): void {
  document.addEventListener('click', event => {
    const link = (event.target as Element).closest<HTMLElement>('[data-nav]'); if (!link) return;
    event.preventDefault();
    try {
      const value = JSON.parse(link.dataset.nav ?? '') as { d: unknown; p?: unknown };
      routeListenersLegacy.navigate(value.d, value.p);
    } catch { /* invalid navigation data */ }
  });
}

/** After recording a visit, the route bar and the route list are updated (legado 019). */
export function refreshRouteAfterDialog(): void {
  document.getElementById('dlg')?.addEventListener('close', () => {
    if (!routeListenersLegacy.routeInProgress()) return;
    setTimeout(() => { routeListenersLegacy.paintBar(); routeListenersLegacy.paintInProgress(); }, AFTER_DIALOG_MS);
  });
}
