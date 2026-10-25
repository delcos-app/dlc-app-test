/**
 * What changes while the app is open: the published version (the app reloads itself when nothing is half done, or shows «Hay una
 * versión nueva»), the notifications bell, and live notices (new notifications, messages and material requests repaint the bell, the
 * portal and the account card). Migrated from the legacy nucleo/version.js, nucleo/notificaciones.js and nucleo/en_vivo.js (v2.425.0);
 * versionPublicada, hayAlgoAMedias, comprobarVersion, refrescarCampana and avisosEnVivo stay as adapters. VERSION_VISTA, NOTIF_N and
 * VIVO stay in legacy state (the tests set VERSION_VISTA).
 */
import { coreLegacy } from '../legacy/core-bridge';
import { t } from '../i18n';
import { can } from './permissions';

const VERSION_CHECK_MS = 60 * 1000, LIVE_WAIT_MS = 400, MAX_BADGE = 9, NOTIFICATIONS = 30;
const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]', '::1'];

/** The version in the published index.html (no cache), or null. */
export async function publishedVersion(): Promise<string | null> {
  try {
    const response = await fetch(`./index.html?v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) return null;
    return /app\.js\?v=([0-9.]+)/.exec(await response.text())?.[1] ?? null;
  } catch { return null; }
}

/** A window open or a field with the cursor: reloading now would lose something. */
export function somethingHalfDone(): boolean {
  if (document.querySelector('dialog[open]')) return true;
  const active = document.activeElement;
  return Boolean(active?.matches('input:not([type=search]), textarea, select, [contenteditable="true"]'));
}

/** At most once a minute: with another version published, reloads (nothing half done) or shows the notice. */
export async function checkVersion(): Promise<void> {
  if (Date.now() - coreLegacy.versionSeenAt() < VERSION_CHECK_MS || !coreLegacy.appVersion() || document.hidden) return;
  coreLegacy.setVersionSeenAt(Date.now());
  const version = await publishedVersion();
  if (!version || version === coreLegacy.appVersion()) return;
  if (!somethingHalfDone()) { try { sessionStorage.setItem('dlc-recarga-version', version); } catch { /* reloads anyway */ } location.reload(); return; }
  document.getElementById('nuevaver')?.classList.remove('hide');
}

/** The bell with the unread count; pressing it opens the notifications. */
export async function refreshBell(): Promise<void> {
  if (!coreLegacy.profile() || document.body.classList.contains('sin-sesion')) return;
  const { data } = await coreLegacy.rpc('mis_notificaciones', { lim: NOTIFICATIONS });
  const answer = (data ?? {}) as { sin_leer?: number; lista?: unknown[] }, unread = answer.sin_leer ?? 0;
  coreLegacy.setUnreadNotifications(unread);
  let bell = document.getElementById('mdavisos');
  if (!bell) {
    const user = document.getElementById('ubtn'); if (!user) return;
    user.insertAdjacentHTML('beforebegin', `<button class="mdavisos" id="mdavisos" aria-label="${t('core.live.notifications')}"></button>`);
    bell = document.getElementById('mdavisos');
  }
  if (!bell) return;
  bell.innerHTML = `🔔${unread ? `<span class="nb2">${unread > MAX_BADGE ? `${MAX_BADGE}+` : unread}</span>` : ''}`;
  bell.onclick = (): void => { coreLegacy.openNotifications(answer.lista ?? []); };
}

function repaintAfterChange(kind: string): void {
  void refreshBell();
  if (coreLegacy.isProfessionalPortal() && document.getElementById('v-informe') && coreLegacy.currentScreen() === 'informe') {
    try { coreLegacy.repaintPortal(can('portal_centro')); } catch { /* the next change repaints it */ }
  }
  const shown = coreLegacy.shownAccount();
  if (kind !== 'notif' && shown && document.getElementById('fportal')) { try { coreLegacy.refreshCardPortal(shown); } catch { /* the next change repaints it */ } }
}

/** Live notices of the database (not in the local copy, which has no live server). */
export function listenLive(): void {
  const profile = coreLegacy.profile(), database = coreLegacy.db();
  if (coreLegacy.liveChannel() || !profile?.id || typeof database.channel !== 'function') return;
  if (LOCAL_HOSTS.includes(location.hostname)) return;
  try {
    let wait: ReturnType<typeof setTimeout> | undefined;
    const changed = (kind: string): void => { clearTimeout(wait); wait = setTimeout(() => { repaintAfterChange(kind); }, LIVE_WAIT_MS); };
    coreLegacy.setLiveChannel(database.channel(`vivo-${profile.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notificaciones', filter: `usuario_id=eq.${profile.id}` }, () => { changed('notif'); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mensajes_cuenta' }, () => { changed('msg'); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'solicitudes_material' }, () => { changed('mat'); })
      .subscribe());
  } catch { coreLegacy.setLiveChannel(null); }
}
