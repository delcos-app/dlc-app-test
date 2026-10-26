/**
 * Panel delcos: the extras are exceptions to the plan (v2.158.0), and entering or leaving a company reloads the app covered («Abriendo
 * …») until its menu, brand and screen are ready (v2.173.0). Folded from legado 075 and 076 (v2.425.0).
 */
import { t } from '../../i18n';
import { byId, closestTo } from './dom';
import * as legacyFreeCoreLegacyC from './';
import { navigationStore } from '../navigation/store';
import { sessionStore } from '../session-store';

const COVER_MAX_MS = 9000, CHECK_EVERY_MS = 60, CHECKS = 80, REVEAL_STEP_MS = 100, REVEAL_STEPS = 30;

/** Organizaciones → Extras: the subtitle says they are on top of what the plan includes. */
export function extrasAreExceptions(): void {
  document.addEventListener('click', event => {
    if (!closestTo(event.target, '[data-orgext]')) return;
    setTimeout(() => {
      const subtitle = byId('dbody')?.querySelector('.fh .sm');
      if (subtitle && (subtitle.textContent ?? '').includes('aparte de su plan')) subtitle.textContent = t('legacyC.platform.extras');
    }, 0);
  }, true);
}

/** «Salir» of the viewed organization covers the app while it goes back to the panel. */
export function coverWhenLeavingOrganization(): void {
  document.addEventListener('click', event => { if (closestTo(event.target, '#orgvistasal')) prepararCambioOrg(t('legacyC.platform.panel')); }, true);
}

const pause = (ms: number): Promise<void> => new Promise(resolve => { setTimeout(resolve, ms); });

async function finishWhenReady(): Promise<void> {
  try { await pagoCargarEstado(); } catch { /* the cover goes anyway */ }
  try { await franjaVista(); } catch { /* the cover goes anyway */ }
  try { legacyFreeCoreLegacyC.applyPlatformMode(); } catch { /* the cover goes anyway */ }
  if (navigationStore.platformMode && navigationStore.screen !== 'delcos') ir('pd-orgs');
  // Waits until the screen has revealed its data (3 s at most)
  for (let step = 0; step < REVEAL_STEPS; step++) { await pause(REVEAL_STEP_MS); if (!document.querySelector('main > section.preparando, main > section.cargando')) break; }
}

/** After entering or leaving a company, the cover goes when the new organization is on screen (or at the login, or after 9 s). */
export function finishOrganizationChange(): void {
  let target: string | null = null; try { target = sessionStorage.getItem('dlc-cambio-org'); } catch { /* private mode */ }
  const html = document.documentElement;
  if (target === null && !html.classList.contains('cambiando-org')) return;
  const finish = (): void => { html.classList.remove('cambiando-org'); try { sessionStorage.removeItem('dlc-cambio-org'); } catch { /* private mode */ } };
  const limit = setTimeout(finish, COVER_MAX_MS);
  let tries = 0;
  const timer = setInterval(() => {
    if (++tries > CHECKS) { clearInterval(timer); return; }
    if (!(sessionStore.profile && !document.body.classList.contains('sin-sesion') && typeof RPC_ORIG === 'function')) {
      if (!byId('login')?.classList.contains('hide')) { clearInterval(timer); clearTimeout(limit); finish(); }
      return;
    }
    clearInterval(timer);
    void finishWhenReady().then(() => { clearTimeout(limit); finish(); });
  }, CHECK_EVERY_MS);
}
