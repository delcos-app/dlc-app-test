/**
 * Session and portal details from legacy layers: Configuración's «i» for the professional (v2.272.0), out at once whoever lost
 * access and live notices (v2.281.0), «Pendiente de pago» for centres (v2.284.0), the material offered to centres (v2.285.0) and an
 * expired activation link (v2.305.0). Moved from legado 116, 120, 123, 124 and 129 (v2.424.0). The access-check state
 * (ACCESO_MIRADO, ACCESO_FUERA) stays in legacy: nucleo/sesion.js reads it.
 */
import { sessionGlueLegacy as legacy } from '../../legacy/legado-d-glue-bridge';
import { term } from '../../legacy/bridge';
import { t } from '../../i18n';
import { closestOf } from './events';

/** Legado 116: the professional only has their data and their notices, so Configuración's «i» speaks of that. */
export function installProfessionalSettingsHelp(): void {
  const own = (): [string, string, string[]] => [t('legacyD.session.settingsTitle'), t('legacyD.session.settingsIntro'), [
    t('legacyD.session.settingsData'),
    t('legacyD.session.settingsNotices', { guideline: term('pauta') }),
    t('legacyD.session.settingsCard', { visits: term('visita', { number: 'p' }) })]];
  let general = legacy.help('config');
  const yours = own();
  legacy.defineHelp('config', () => (legacy.isProfessionalPortal() ? yours : general), value => { general = value; });
}

const ACCESS_CHECK_MS = 15000, LOGIN_TRY_MS = 250, LOGIN_TRIES = 60, PROFILE_TRY_MS = 1000, GONE_KEY = 'delcos-fuera';

/** On the login screen, why the session ended (access removed). */
function showWhyOut(): void {
  let gone: string | null = null; try { gone = sessionStorage.getItem(GONE_KEY); } catch { /* not available */ }
  if (!gone) return;
  const put = (): boolean => {
    const login = document.getElementById('login'), message = document.getElementById('lmsg');
    if (!login || login.classList.contains('hide') || !message) return false;
    message.textContent = t('legacyD.session.accessRemoved');
    message.classList.add('err'); try { sessionStorage.removeItem(GONE_KEY); } catch { /* not available */ }
    return true;
  };
  if (put()) return;
  let tries = 0;
  const timer = setInterval(() => { if (put() || ++tries > LOGIN_TRIES) clearInterval(timer); }, LOGIN_TRY_MS);
}

/** Legado 120: access checked every 15 s with the tab visible, on coming back and on changing screen; live notices once there is a profile. */
export function installAccessChecks(): void {
  setInterval(() => { if (document.visibilityState === 'visible') legacy.checkAccess(); }, ACCESS_CHECK_MS);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { legacy.checkAccess(true); legacy.refreshBell(); } });
  addEventListener('focus', () => { legacy.checkAccess(); });
  document.addEventListener('click', event => {
    if (closestOf(event.target, 'nav.main [data-t], #bnav [data-t], #bmas [data-bm], .mllab, [data-u]')) legacy.checkAccess();
  }, true);
  showWhyOut();
  const hook = (): void => { if (legacy.profileLoaded()) { legacy.liveNotices(); legacy.checkAccess(true); } else setTimeout(hook, PROFILE_TRY_MS); };
  hook();
}

/** Legado 123: an order of the centre's portal waiting for payment. */
export function installCentrePaymentState(): void {
  legacy.setCentreStateClass('Pendiente de pago', 'p-warn');
}

/** Legado 124: in a product, each material can be offered to the centres too. */
export function installMaterialForCentres(): void {
  document.addEventListener('change', event => {
    const box = closestOf(event.target, '[data-prmatpp]') as HTMLInputElement | null; if (!box) return;
    void (async (): Promise<void> => {
      box.disabled = true;
      const { error } = await legacy.setMaterialForPortal(box.dataset.prmatpp ?? '', box.checked);
      box.disabled = false;
      if (error) { box.checked = !box.checked; legacy.toast(t('legacyD.session.couldNotSave', { error: (error as { message?: string }).message ?? '' }), true); return; }
      const material = legacy.materials()?.find(item => item.id === box.dataset.prmatpp); if (material) material.para_portal = box.checked;
      legacy.toast(t(box.checked ? 'legacyD.session.materialOffered' : 'legacyD.session.materialNotOffered'));
    })();
  });
}

/** Legado 129: an expired or used activation link opens the login with «send me a new link». */
export function installExpiredLink(): void {
  const linkError = legacy.linkError();
  if (!linkError || !/otp_expired|access_denied|expired/i.test(linkError)) return;
  legacy.accessWithoutActivation(t('legacyD.session.linkExpired'));
  try { history.replaceState(null, '', location.pathname); } catch { /* not allowed */ }
}
