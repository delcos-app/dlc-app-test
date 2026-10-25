/**
 * Mi perfil → «Notificaciones»: each notice «Al momento · En el resumen · No», grouped by area, and the quiet hours; and saving the
 * order alerts of the profile. Migrated from the legacy pintarNotif, notifModo, notifGuardarPrefs and guardarPrefsAvisos (v2.417.0).
 */
import { legacyDb, notices } from '../../../legacy/bridge';
import { settingsExtraLegacy, type NotificationType } from '../../../legacy/settings3-bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { orFallback } from '../../../services/values';

type Mode = 'm' | 'r' | 'n';
interface QuietHours { activo?: boolean; desde?: string; hasta?: string; finde?: boolean }
type ModeSetting = boolean | { m?: boolean; r?: boolean } | undefined;

const QUIET_FROM = '20:00', QUIET_TO = '08:00';

async function savePreferences(change: Record<string, unknown>): Promise<boolean> {
  const preferences = { ...settingsExtraLegacy.preferences(), ...change };
  const { data, error } = await legacyDb().rpc<Record<string, unknown>>('guardar_preferencias', { p: preferences });
  if (error) { notices.toast(t('settingsExtra.notifications.couldNotSave'), true); return false; }
  settingsExtraLegacy.setPreferences(data ?? preferences); return true;
}

/** Saves the order alerts of the profile (Pedidos → «Avisos de pedidos»). */
export const saveOrderAlerts = (alerts: Record<string, boolean>): Promise<boolean> => savePreferences({ avisos_pedidos: alerts });

const modeSettings = (): Record<string, ModeSetting> => (settingsExtraLegacy.preferences().notif ?? {}) as Record<string, ModeSetting>;

/** How a notice arrives: at once (m), in the morning digest (r) or not at all (n). */
export function modeOf(key: string): Mode {
  const value = modeSettings()[key], daily = settingsExtraLegacy.dailyNotifications().includes(key);
  if (value === false) return 'n';
  if (value && typeof value === 'object') { if (value.m === false && value.r) return 'r'; if (value.m === false) return 'n'; }
  return daily ? 'r' : 'm';
}

function summaryHtml(types: readonly NotificationType[]): string {
  const count = { m: 0, r: 0, n: 0 }; types.forEach(([key]) => { count[modeOf(key)] += 1; });
  return `<span>${t('settingsExtra.notificationSettings.atOnce', { count: count.m })}</span><span>${t('settingsExtra.notificationSettings.inDigest', { count: count.r })}</span><span>${t('settingsExtra.notificationSettings.off', { count: count.n })}</span>`;
}

function quietHtml(quiet: QuietHours): string {
  return `<div class="ajfila ntfsil"><div><div class="ntfsilt"><label class="vfswitch mini" title="${t('settingsExtra.notificationSettings.quietOn')}"><input type="checkbox" id="nsil" ${quiet.activo ? 'checked' : ''} aria-label="${t('settingsExtra.notificationSettings.quietOn')}"><span class="sw"></span></label><b>${t('settingsExtra.notificationSettings.quietHours')}</b></div><span class="sm">${t('settingsExtra.notificationSettings.quietHint')}</span></div>
      <div class="ajctl">
        <input type="time" id="nsild" value="${escapeHtml(quiet.desde ?? QUIET_FROM)}" aria-label="${t('settingsExtra.notificationSettings.from')}"> ${t('settingsExtra.notificationSettings.toWord')} <input type="time" id="nsilh" value="${escapeHtml(quiet.hasta ?? QUIET_TO)}" aria-label="${t('settingsExtra.notificationSettings.to')}">
        <label class="ntffin"><input type="checkbox" id="nsilf" ${quiet.finde !== false ? 'checked' : ''}> ${t('settingsExtra.notificationSettings.weekends')}</label></div></div>`;
}

function rowHtml([key, icon, title, description]: NotificationType): string {
  const mode = modeOf(key), daily = settingsExtraLegacy.dailyNotifications().includes(key);
  const button = (value: Mode, label: string): string => `<button type="button" data-v="${value}" class="${mode === value ? 'on' : ''}" aria-pressed="${String(mode === value)}">${label}</button>`;
  return `<div class="ntfrow"><span class="ntfic">${icon}</span><div><b>${escapeHtml(title)}</b><span class="sm">${escapeHtml(description)}</span></div>
        <div class="segs ntfseg" role="group" aria-label="${escapeHtml(title)}" data-nk="${key}">${daily ? '' : button('m', t('settingsExtra.notificationSettings.atOnceButton'))}${button('r', t('settingsExtra.notificationSettings.inDigestButton'))}${button('n', t('settingsExtra.notificationSettings.no'))}</div></div>`;
}

function groupsOf(types: readonly NotificationType[]): (readonly [string, readonly NotificationType[]])[] {
  const areas = settingsExtraLegacy.notificationAreas();
  const groups = areas.map(([, title, keys]) => [title, types.filter(type => keys.includes(type[0]))] as const).filter(([, list]) => list.length);
  const loose = types.filter(type => !areas.some(area => area[2].includes(type[0])));
  return loose.length ? [...groups, [t('settingsExtra.notificationSettings.others'), loose] as const] : groups;
}

async function choose(button: HTMLElement, types: readonly NotificationType[]): Promise<void> {
  const group = button.closest<HTMLElement>('.ntfseg'); if (!group || button.classList.contains('on')) return;
  const key = group.dataset.nk ?? '', value = button.dataset.v as Mode;
  group.querySelectorAll('button').forEach(other => { other.classList.toggle('on', other === button); other.setAttribute('aria-pressed', String(other === button)); });
  const settings = { ...modeSettings() }, daily = settingsExtraLegacy.dailyNotifications().includes(key), atOnce = value === 'm', digest = value === 'r';
  if (daily ? digest : atOnce && !digest) Reflect.deleteProperty(settings, key); else settings[key] = { m: atOnce, r: digest };
  const done = value === 'n' ? 'willNot' : value === 'm' ? 'willAtOnce' : 'willInDigest';
  if (await savePreferences({ notif: settings })) notices.toast(t(`settingsExtra.notificationSettings.${done}`));
  const summary = document.getElementById('ntfres'); if (summary) summary.innerHTML = summaryHtml(types);
}

function saveQuiet(): void {
  const checked = (id: string): boolean => (document.getElementById(id) as HTMLInputElement | null)?.checked ?? false;
  const time = (id: string, fallback: string): string => orFallback((document.getElementById(id) as HTMLInputElement | null)?.value, fallback);
  const on = checked('nsil');
  void savePreferences({ notif_silencio: { activo: on, desde: time('nsild', QUIET_FROM), hasta: time('nsilh', QUIET_TO), finde: checked('nsilf') } })
    .then(saved => { if (saved) notices.toast(t(on ? 'settingsExtra.notificationSettings.quietSaved' : 'settingsExtra.notificationSettings.quietOff')); });
}

export function paintNotificationSettings(): void {
  const box = document.getElementById('cfgcuerpo'); if (!box) return;
  const types = settingsExtraLegacy.typesForMyRole(), quiet = (settingsExtraLegacy.preferences().notif_silencio ?? {}) as QuietHours;
  box.innerHTML = types.length ? `<div class="card cfgpanel ntf">
    <div class="ntfres" id="ntfres">${summaryHtml(types)}</div>
    ${quietHtml(quiet)}
    ${groupsOf(types).map(([title, list]) => `<h3 class="ntfarea">${escapeHtml(title)}</h3>${list.map(rowHtml).join('')}`).join('')}
  </div>` : `<div class="card cfgpanel"><div class="vacio">${t('settingsExtra.notificationSettings.none')}</div></div>`;
  box.querySelectorAll<HTMLElement>('.ntfseg button').forEach(button => { button.onclick = (): void => { void choose(button, types); }; });
  for (const id of ['nsil', 'nsild', 'nsilh', 'nsilf']) { const input = document.getElementById(id); if (input) input.onchange = saveQuiet; }
}
