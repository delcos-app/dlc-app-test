/**
 * Panel delcos → Plantilla: the roles, permissions, catalogs and states every new company receives (the usual Configuración editors
 * over the platform organization, which is the template). Migrated from the legacy pintarPlantillaDelcos (v2.413.0).
 */
import { platformLegacy } from '../../legacy/platform-bridge';
import { t } from '../../i18n';
import { panelBox } from './model';

/** The template menu, or the editor of `section` ('roles' or 'cat') with a notice on top. */
export async function paintTemplate(section?: string): Promise<void> {
  const box = panelBox(); if (!box) return;
  if (!section) {
    box.innerHTML = `<div class="card cfgpanel"><h2>${t('platform.template.title')}</h2>
      <p class="sm">${t('platform.template.text')}</p>
      <div class="acts u-start"><button type="button" class="btn sec" data-plsub="roles">${t('platform.template.roles')}</button>
        <button type="button" class="btn sec" data-plsub="cat">${t('platform.template.catalogs')}</button></div></div>`;
    box.querySelectorAll<HTMLElement>('[data-plsub]').forEach(button => { button.onclick = (): void => { void paintTemplate(button.dataset.plsub); }; });
    return;
  }
  if (section === 'roles') await platformLegacy.paintRoles(); else { box.innerHTML = ''; await platformLegacy.paintCatalogs(); }
  const after = panelBox(); if (!after || document.getElementById('plaviso')) return;
  after.insertAdjacentHTML('afterbegin', `<div class="banda-info" id="plaviso">${t('platform.template.notice')}
    <button type="button" class="btn sec" id="plvolver">${t('platform.template.back')}</button></div>`);
  const back = document.getElementById('plvolver'); if (back) back.onclick = (): void => { void paintTemplate(); };
}
