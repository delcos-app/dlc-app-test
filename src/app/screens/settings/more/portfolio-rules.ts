/**
 * Configuración → Cartera y visitas → «Reglas de cartera»: whether an account can be in one portfolio only. Migrated from the
 * legacy editorReglasCartera (v2.415.0).
 */
import { cycleLegacy, legacyDb, notices, term } from '../../../legacy/bridge';
import { t } from '../../../i18n';

const words = (): Record<string, string> => ({
  theProfessionals: term('medico', { number: 'p', article: 'el' }), aProfessional: term('medico', { article: 'un' }),
  AProfessional: term('medico', { article: 'un', articleCapital: 'C' }), Professionals: term('medico', { number: 'p', capital: 'C' }),
});

function editorHtml(exclusive: boolean): string {
  return `
    <div class="fh"><div><h2>${t('settingsMore.portfolio.title')}</h2><div class="sm">${t('settingsMore.portfolio.subtitle', words())}</div></div>
      <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
    <label class="opt u-mt-10"><input type="checkbox" id="rcexcl" ${exclusive ? 'checked' : ''}>
      <span><b>${t('settingsMore.portfolio.exclusive')}</b><br><span class="sm">${t('settingsMore.portfolio.exclusiveHint', words())}</span></span></label>
    <p class="sm">${t('settingsMore.portfolio.sharedHint', words())}</p>
    <div class="acts u-end"><button class="btn sec" data-cerrar>${t('common.cancel')}</button><button class="btn" id="rcok">${t('common.save')}</button></div>`;
}

async function save(box: HTMLDialogElement): Promise<void> {
  const exclusive = Boolean((document.getElementById('rcexcl') as HTMLInputElement | null)?.checked);
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean }>('guardar_ajuste', { p_clave: 'cartera', p_valor: { exclusiva: exclusive } });
  if (error || result?.ok === false) { notices.toast(t('settingsMore.couldNotSave'), true); return; }
  cycleLegacy.setSetting('cartera', { exclusiva: exclusive }); box.close(); notices.toast(t('settingsMore.portfolio.saved'));
}

export async function editPortfolioRules(): Promise<void> {
  await cycleLegacy.loadSettings();
  const rules = cycleLegacy.setting('cartera') as { exclusiva?: boolean } | undefined;
  const body = document.getElementById('dbody'), box = document.getElementById('dlg') as HTMLDialogElement | null;
  if (!body || !box) return;
  body.innerHTML = editorHtml(rules?.exclusiva !== false);
  box.showModal();
  const ok = document.getElementById('rcok'); if (ok) ok.onclick = (): void => { void save(box); };
}
