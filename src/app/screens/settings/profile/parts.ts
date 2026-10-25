/**
 * Small parts of Mi perfil: a part of the preferences on its own (Rutas: start and end points, with its explanation) and saving the
 * indicators chosen for Inicio. Migrated from the legacy pintarPrefsParte and guardarKpis (v2.420.0); both names stay as adapters
 * (the tree of Configuración, legado 007 and the Inicio indicators window use them).
 */
import { legacyDb, notices } from '../../../legacy/bridge';
import { profileLegacy } from '../../../legacy/settings4-bridge';
import { t } from '../../../i18n';
import { paintPreferences } from '../preferences';

export async function paintPreferencesPart(part: string): Promise<void> {
  await paintPreferences();
  const box = document.getElementById('cfgcuerpo'); if (!box) return;
  document.getElementById('miperfil')?.remove();
  if (part !== 'rutas') return;
  box.querySelectorAll(':scope > p.sm').forEach(paragraph => { paragraph.remove(); });
  box.insertAdjacentHTML('afterbegin', `<div class="card cfgpanel"><h2>${t('settingsRest.profile.routesTitle')}</h2><p class="sm">${t('settingsRest.profile.routesHint')}</p></div>`);
}

/** Saves the Inicio indicators in the person's preferences; false if it failed. */
export async function saveIndicators(list: readonly Record<string, unknown>[]): Promise<boolean> {
  const me = profileLegacy.me(), preferences = { ...(me.preferencias ?? {}), kpis: list };
  const { data, error } = await legacyDb().rpc<Record<string, unknown>>('guardar_preferencias', { p: preferences });
  if (error) { notices.toast(t('settingsRest.profile.couldNotSaveError', { error: (error as { message?: string }).message ?? '' }), true); return false; }
  me.preferencias = data ?? preferences;
  return true;
}
