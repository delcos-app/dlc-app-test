/** Configuración → Preferencias → «Avisos»: warn when a professional was visited recently. Migrated from the legacy pintarPrefsPaso1 (v2.415.0). */
import { notices, term } from '../../../legacy/bridge';
import { settingsLegacy } from '../../../legacy/settings1-bridge';
import { t } from '../../../i18n';

const DEFAULT_DAYS = 7;

/** Adds the «Avisos» block above the save button (once). */
export function paintNotice(): void {
  const actions = document.getElementById('pfguardar')?.closest('.acts');
  if (!actions || document.getElementById('pfaviso')) return;
  const notice = settingsLegacy.revisitNotice();
  actions.insertAdjacentHTML('beforebegin', `<div class="blk" id="pfaviso"><h3>${t('settings.notice.title')}</h3>
    <label class="opt"><input type="checkbox" id="pfrev" ${notice.on ? 'checked' : ''}>
      <span><b>${t('settings.notice.revisit', { aProfessional: term('medico', { article: 'un' }) })}</b><br><span class="sm">${t('settings.notice.revisitHint', { visits: term('visita', { number: 'p' }) })}</span></span></label>
    <div class="g2"><div><label for="pfrevd">${t('settings.notice.days')}</label><input id="pfrevd" type="number" min="1" max="60" value="${notice.dias}"></div></div></div>`);
  const enabled = document.getElementById('pfrev') as HTMLInputElement | null, days = document.getElementById('pfrevd') as HTMLInputElement | null;
  if (!enabled || !days) return;
  const save = async (): Promise<void> => {
    if (await settingsLegacy.saveRevisitNotice({ on: enabled.checked, dias: Math.max(1, Number(days.value) || DEFAULT_DAYS) })) notices.toast(t('settings.notice.saved'));
  };
  enabled.onchange = (): void => { void save(); };
  days.onchange = (): void => { void save(); };
}
