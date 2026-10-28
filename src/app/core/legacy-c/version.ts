/**
 * The new-version notice: it shows only when sw.js names a version newer than the open one (v2.46.0), and the app checks again when it
 * comes back to the front and every 10 minutes (v2.184.0). Folded from legado 050 and 078 (v2.425.0).
 */
import { byId, observe } from './dom';
import * as legacyFreeCoreServices from '../services';

const CHECK_EVERY_MS = 10 * 60 * 1000, CHECKED_FOR_MS = 2000;

const openVersion = (): string => (document.querySelector<HTMLScriptElement>('script[src*="app.js"]')?.src ?? '').split('v=')[1] ?? '';

async function confirmNewer(notice: HTMLElement, current: string): Promise<void> {
  notice.classList.add('hide'); notice.dataset.comprobado = '1';
  try {
    const text = await (await fetch('./sw.js', { cache: 'no-store' })).text();
    const newer = /dlc-os-([\d.]+)/.exec(text)?.[1];
    // After reloading, the page is already the last version: nothing to tell
    if (newer && newer !== current) notice.classList.remove('hide');
  } catch { /* no network: no notice */ }
  setTimeout(() => { delete notice.dataset.comprobado; }, CHECKED_FOR_MS);
}

/** v2.46.0: the notice is confirmed against sw.js each time something shows it. */
export function watchVersionNotice(): void {
  const current = openVersion(), notice = byId('nuevaver');
  observe(notice, () => {
    if (!notice || notice.classList.contains('hide') || notice.dataset.comprobado) return;
    void confirmNewer(notice, current);
  }, { attributes: true, attributeFilter: ['class'] });
}

/** v2.184.0: check for a new version when the app comes back and every 10 minutes. */
export function checkVersionPeriodically(): void {
  document.addEventListener('visibilitychange', () => { if (!document.hidden) void legacyFreeCoreServices.live.checkVersion(); });
  setInterval(() => { void legacyFreeCoreServices.live.checkVersion(); }, CHECK_EVERY_MS);
}
