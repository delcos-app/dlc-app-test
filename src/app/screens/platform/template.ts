/**
 * Panel delcos → Plantilla: the roles, permissions, catalogs and states every new company receives (the usual Configuración editors
 * over the platform organization, which is the template). Migrated from the legacy pintarPlantillaDelcos (v2.413.0). v2.469.0
 * (CFG-1): the sector templates chosen when creating a company, each with what it brings on top of that base.
 */
import { platformLegacy } from '../../legacy/platform-bridge';
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';
import { panelBox } from './model';
import { loadTemplates, templateBrings, templateName, type SectorTemplate } from './templates';

function sectorTemplateHtml(template: SectorTemplate): string {
  const brings = templateBrings(template);
  return `<div class="item u-cursor-default" data-plantilla="${escapeHtml(template.clave)}"><span class="tx"><b>${escapeHtml(templateName(template))}</b>
      <span class="sm">${escapeHtml(brings.length ? t('platform.templates.brings', { list: brings.join(' · ') }) : t('platform.templates.onlyBase'))}</span></span></div>`;
}

function sectorTemplatesHtml(templates: readonly SectorTemplate[]): string {
  if (!templates.length) return '';
  return `<div class="card cfgpanel" id="plsector"><h2>${t('platform.templates.title')}</h2>
      <p class="sm">${t('platform.templates.text')}</p>
      <div class="lista">${templates.map(sectorTemplateHtml).join('')}</div></div>`;
}

/** The template menu, or the editor of `section` ('roles' or 'cat') with a notice on top. */
export async function paintTemplate(section?: string): Promise<void> {
  if (!section) {
    const templates = await loadTemplates();
    const box = panelBox(); if (!box) return;
    box.innerHTML = `<div class="card cfgpanel"><h2>${t('platform.template.title')}</h2>
      <p class="sm">${t('platform.template.text')}</p>
      <div class="acts u-start"><button type="button" class="btn sec" data-plsub="roles">${t('platform.template.roles')}</button>
        <button type="button" class="btn sec" data-plsub="cat">${t('platform.template.catalogs')}</button></div></div>${sectorTemplatesHtml(templates)}`;
    box.querySelectorAll<HTMLElement>('[data-plsub]').forEach(button => { button.onclick = (): void => { void paintTemplate(button.dataset.plsub); }; });
    return;
  }
  const box = panelBox(); if (!box) return;
  if (section === 'roles') await platformLegacy.paintRoles(); else { box.innerHTML = ''; await platformLegacy.paintCatalogs(); }
  const after = panelBox(); if (!after || document.getElementById('plaviso')) return;
  after.insertAdjacentHTML('afterbegin', `<div class="banda-info" id="plaviso">${t('platform.template.notice')}
    <button type="button" class="btn sec" id="plvolver">${t('platform.template.back')}</button></div>`);
  const back = document.getElementById('plvolver'); if (back) back.onclick = (): void => { void paintTemplate(); };
}
