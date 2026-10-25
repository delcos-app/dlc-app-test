/** Panel delcos → Clientes → Extras: what a company has hired besides its plan. Migrated from the legacy orgExtras (v2.413.0). */
import { legacyDb, notices, term } from '../../legacy/bridge';
import { platformLegacy } from '../../legacy/platform-bridge';
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';
import { errorMessage, type Organization, planOf } from './model';

const checked = (id: string): boolean => (document.getElementById(id) as HTMLInputElement | null)?.checked ?? false;

async function save(organization: Organization, repaint: () => Promise<void>): Promise<void> {
  const extras = [checked('oxopor') ? 'oportunidades' : '', checked('oxport') ? 'portal' : ''].filter(Boolean);
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean }>('guardar_extras_organizacion', { p_org: organization.id, p_extras: extras });
  if (error || !result?.ok) { notices.toast(t('platform.extras.couldNotSave') + (error ? `: ${errorMessage(error)}` : ''), true); return; }
  (document.getElementById('dlg') as HTMLDialogElement | null)?.close(); notices.toast(t('platform.extras.saved'));
  await platformLegacy.reloadPlan();   // in case it is the platform's own
  void repaint();
}

export function editExtras(organization: Organization, repaint: () => Promise<void>): void {
  const body = document.getElementById('dbody'), box = document.getElementById('dlg') as HTMLDialogElement | null;
  if (!body || !box) return;
  const active = planOf(organization).extras ?? [];
  body.innerHTML = `<div class="fh"><div><h2>${t('platform.extras.title', { name: escapeHtml(organization.nombre) })}</h2><div class="sm">${t('platform.extras.subtitle')}</div></div>
        <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
      <label class="chk"><input type="checkbox" id="oxopor" ${active.includes('oportunidades') ? 'checked' : ''}> <span><b>${t('platform.extras.opportunities')}</b>
        <span class="sm">${t('platform.extras.opportunitiesText', { professional: term('medico') })}</span></span></label>
      <label class="chk"><input type="checkbox" id="oxport" ${active.includes('portal') ? 'checked' : ''}> <span><b>${t('platform.extras.portalTitle', { ofProfessional: term('medico', { article: 'del' }) })}</b>
        <span class="sm">${t('platform.extras.portalText', { orders: term('pauta', { number: 'p' }) })}</span></span></label>
      <div class="acts u-end"><button class="btn sec" data-cerrar>${t('common.cancel')}</button><button class="btn" id="oxok">${t('common.save')}</button></div>`;
  box.showModal();
  const ok = document.getElementById('oxok'); if (ok) ok.onclick = (): void => { void save(organization, repaint); };
}
