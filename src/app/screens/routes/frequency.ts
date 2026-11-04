/**
 * «Frecuencia objetivo de visita»: every how many days an account has to be visited by its commercial state (0 = not required). It
 * is used by «A quien le toca visita» and the «Les toca» column of the team. Migrated from the legacy editorFrecuencia (v2.418.0);
 * the name stays as an adapter (Configuración and Parque open it).
 */
import { appLegacy, commercialStates, cycleLegacy, legacyAgendaPaint, legacyAgendaParts, legacyDb, notices, term } from '../../legacy/bridge';
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';
import { DEFAULT_NO_VISIT_DAYS, SETTING_NO_VISIT, generalNoVisitDays } from '../../core/rules';

const MAX_DAYS = 365, MAX_GENERAL_DAYS = 3650;
/** Suggested days by the role of each state. */
const SUGGESTED = new Map([['inicial', 60], ['avance', 30], ['interes', 15], ['positivo', 30], ['negativo', 0]]);

function formHtml(days: Record<string, number>): string {
  return `
    <div class="fh"><div><h2>${t('routesMore.frequency.title', { visit: term('visita') })}</h2>
      <div class="sm">${t('routesMore.frequency.subtitle', { aProfessional: term('medico', { article: 'un' }) })}</div></div>
      <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
    ${Object.keys(days).map(state => `<div class="g2 u-items-center"><div><b>${escapeHtml(state)}</b></div>
      <div><input type="number" min="0" max="${MAX_DAYS}" data-frec="${escapeHtml(state)}" value="${Number(days[state]) || 0}" aria-label="${t('routesMore.frequency.daysFor', { state: escapeHtml(state) })}"></div></div>`).join('')}
    <p class="sm">${t('routesMore.frequency.hint', { visit: term('visita') })}</p>
    <div class="g2 u-items-center"><div><b><label for="frgen">${t('settingsRules.noVisit.general', { visit: term('visita') })}</label></b>
      <div class="sm">${t('settingsRules.noVisit.generalHelp', { visit: term('visita'), days: DEFAULT_NO_VISIT_DAYS })}</div></div>
      <div><input type="number" id="frgen" min="1" max="${MAX_GENERAL_DAYS}" value="${generalNoVisitDays()}"></div></div>
    <div class="acts u-end"><button class="btn sec" data-cerrar>${t('common.cancel')}</button><button class="btn" id="frok">${t('common.save')}</button></div>`;
}

/** The general term without a visit (setting «sin_visita»), saved only when it changes. */
async function saveGeneralTerm(days: number): Promise<boolean> {
  if (days === generalNoVisitDays()) return true;
  const { data, error } = await legacyDb().rpc<{ ok?: boolean }>('guardar_ajuste', { p_clave: SETTING_NO_VISIT, p_valor: { dias: days } });
  if (error || data?.ok === false) return false;
  cycleLegacy.setSetting(SETTING_NO_VISIT, { dias: days });
  return true;
}

async function save(body: HTMLElement): Promise<void> {
  const value: Record<string, number> = {};
  body.querySelectorAll<HTMLInputElement>('[data-frec]').forEach(input => { value[input.dataset.frec ?? ''] = Math.max(0, Number(input.value) || 0); });
  // v2.466.0 (INI-2, D13 A): the general term for the states without a frequency
  const general = Number((document.getElementById('frgen') as HTMLInputElement | null)?.value);
  if (!Number.isInteger(general) || general < 1 || general > MAX_GENERAL_DAYS) { notices.toast(t('settingsRules.noVisit.wrong'), true); return; }
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean }>('guardar_ajuste', { p_clave: 'frecuencia', p_valor: value });
  if (error || result?.ok === false) { notices.toast(t('routesMore.frequency.couldNotSave'), true); return; }
  cycleLegacy.setSetting('frecuencia', value);
  if (!await saveGeneralTerm(general)) { notices.toast(t('routesMore.frequency.couldNotSave'), true); return; }
  (document.getElementById('dlg') as HTMLDialogElement | null)?.close();
  notices.toast(t('routesMore.frequency.saved')); appLegacy.forgetCache();
  if (legacyAgendaParts.mode() === 'equipo') void legacyAgendaPaint.team();
}

export async function editFrequency(): Promise<void> {
  await cycleLegacy.loadSettings();
  const days: Record<string, number> = {
    ...Object.fromEntries(commercialStates.all().map(state => [state.valor, SUGGESTED.get(state.papel) ?? 0])),
    ...(cycleLegacy.setting('frecuencia') as Record<string, number> | undefined),
  };
  const body = document.getElementById('dbody'), box = document.getElementById('dlg') as HTMLDialogElement | null;
  if (!body || !box) return;
  body.innerHTML = formHtml(days);
  box.showModal();
  const ok = document.getElementById('frok'); if (ok) ok.onclick = (): void => { void save(body); };
}
