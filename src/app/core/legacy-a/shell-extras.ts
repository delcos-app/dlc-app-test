/**
 * Small pieces of the app frame from the first deliveries (legado 001, 006, 008 and 019, v2.424.0): the service worker and the
 * new-version notice, the bottom bar, the map button and the directory buttons, the date fields, the global search clean-up,
 * the windows with unsaved changes and the selectors that close when pressing elsewhere. Each one is registered by its legado file
 * at its place in the load order.
 */
import { shellExtrasLegacy } from '../../legacy/legado-a-bridge';
import { t } from '../../i18n';

const UPDATE_CHECK_MS = 15 * 60 * 1000;
const byId = (id: string): HTMLElement | null => document.getElementById(id);

/** The service worker that keeps the app available offline (legado 001). */
export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').catch(() => undefined); });
}

/** «Hay una versión nueva»: shown when a new service worker is installed; checked every 15 minutes (legado 006). */
export function watchNewVersion(): void {
  if (!('serviceWorker' in navigator)) return;
  void navigator.serviceWorker.getRegistration().then(registration => {
    if (!registration) return;
    registration.addEventListener('updatefound', () => {
      const installing = registration.installing;
      if (!installing) return;
      installing.addEventListener('statechange', () => {
        if (installing.state === 'installed' && navigator.serviceWorker.controller) byId('nuevaver')?.classList.remove('hide');
      });
    });
    setInterval(() => { registration.update().catch(() => undefined); }, UPDATE_CHECK_MS);
  });
  const update = byId('actualizar'); if (update) update.onclick = (): void => { location.reload(); };
}

/** The bottom bar on phones and the «Ver mapa» button of the directory (legado 006). */
export function listenToBottomBarAndMap(): void {
  byId('bnav')?.addEventListener('click', event => {
    const button = (event.target as Element).closest<HTMLElement>('[data-t]');
    if (button) shellExtrasLegacy.goTo(button.dataset.t ?? '');
  });
  byId('mapaBtn')?.addEventListener('click', () => {
    const map = shellExtrasLegacy.toggleMapMode();
    const button = byId('mapaBtn'); if (button) button.textContent = t(map ? 'legacyA.map.seeList' : 'legacyA.map.seeMap');
    byId('mapawrap')?.classList.toggle('hide', !map);
    byId('lista')?.classList.toggle('hide', map);
    byId('dirpag')?.classList.toggle('hide', map);
    if (map) shellExtrasLegacy.paintMap();
  });
}

/** «Cerca de mí», «Duplicados» and the tools of the directory (legado 008). */
export function listenToDirectoryButtons(): void {
  byId('cercaBtn')?.addEventListener('click', event => { shellExtrasLegacy.nearMe(event.target as HTMLElement); });
  byId('dupBtn')?.addEventListener('click', () => { shellExtrasLegacy.goTo('duplicados'); });
  byId('dirtools')?.addEventListener('click', () => { shellExtrasLegacy.openTools('directorio'); });
}

const DATE_INPUTS = 'input[type=date], input[type=time], input[type=month], input[type=week], input[type=datetime-local]';
const DOWNLOADS = ['__dlDir', '__dlSeg', '__dlAn'];

function watchUnsavedChanges(id: string): void {
  const box = (byId(id) as HTMLDialogElement | null); if (!box) return;
  const mark = (event: Event): void => { if (!(event.target as Element).closest('[data-nosucio]')) box.dataset.sucio = '1'; };
  box.addEventListener('input', mark);
  box.addEventListener('change', mark);
  box.addEventListener('close', () => { delete box.dataset.sucio; });
  box.addEventListener('cancel', event => { event.preventDefault(); shellExtrasLegacy.tryClose(box); });
}

/** Legado 019: date fields, no downloads, global search clean-up, unsaved changes, pickers and the salesperson filter. */
export function startSelectorsAndWindows(): void {
  // Dates and times: the whole field opens the selector
  document.addEventListener('click', event => {
    const input = (event.target as Element).closest<HTMLInputElement>(DATE_INPUTS);
    if (input && !input.disabled && !input.readOnly && typeof input.showPicker === 'function') { try { input.showPicker(); } catch { /* not allowed now */ } }
  });
  // Data protection: no downloads
  const holder = window as unknown as Record<string, unknown>;
  DOWNLOADS.forEach(key => { try { Reflect.deleteProperty(holder, key); } catch { holder[key] = undefined; } });
  // The top search is cleared when a result is chosen
  document.addEventListener('click', event => {
    if (!(event.target as Element).closest('#gsug [data-gm], #gsug [data-gc], #gsug [data-gme]')) return;
    setTimeout(() => {
      const search = (byId('q') as HTMLInputElement | null); if (!search) return;
      search.value = '';
      search.closest('.gsearch')?.classList.remove('buscando');
      search.blur();
    }, 0);
  });
  ['dlg', 'dlg2'].forEach(watchUnsavedChanges);
  document.addEventListener('pointerdown', event => { if (!(event.target as Element).closest('.picker')) shellExtrasLegacy.closePickers(); });
}

/** The salesperson filter of the directory (legado 019). */
export function listenToSalespersonFilter(): void {
  byId('fcom')?.addEventListener('change', event => { shellExtrasLegacy.filters().com = (event.target as HTMLSelectElement).value; shellExtrasLegacy.search(); });
}
