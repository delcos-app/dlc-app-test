/**
 * Own pages (Mi perfil, Empresa, Plan…; other modules add theirs to PAGES): the header, the tabs and the body where each tab paints.
 * Changing between tabs that are lists keeps the page and only swaps the list (v2.251.0). Migrated from the legacy PAGINAS,
 * cargarPaginaBase, cargarPaginaBase2 and cargarPagina (v2.426.0); PAGINAS stays as the same object and cargarPagina as an adapter.
 */
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';
import * as legacyFreeScreensSettingsMore from '../../screens/settings/more';
import * as legacyFreeScreensSettingsExtra from '../../screens/settings/extra';

/** [key, label, painter] of a page tab. */
export type PageTab = [string, string, () => unknown];

export interface PageDefinition {
  t: string;
  d: string;
  admin?: boolean;
  /** v2.121.0: pages with their own permission (Organización) */
  permiso?: () => boolean;
  tabs: PageTab[];
}

/** The pages, shared with legacy: other modules add theirs (PAGINAS.ciclo…) and some define their texts as getters. */
export const PAGES: Record<string, PageDefinition> = {
  perfil: { t: t('navigationCore.pages.profile'), d: t('navigationCore.pages.profileDescription'), tabs: [
    ['datos', t('navigationCore.pages.profileData'), (): unknown => pintarPerfil()], ['notif', t('navigationCore.pages.notifications'), (): unknown => pintarNotif()]] },
  empresa: { t: t('navigationCore.pages.company'), d: t('navigationCore.pages.companyDescription'), admin: true, tabs: [
    ['marca', t('navigationCore.pages.brand'), (): unknown => legacyFreeScreensSettingsMore.paintBrand()], ['correo', t('navigationCore.pages.mail'), (): unknown => legacyFreeScreensSettingsExtra.paintEmail()],
    ['copias', t('navigationCore.pages.backups'), (): unknown => pintarCopias()]] },
  plan: { t: t('navigationCore.pages.plan'), d: '', admin: true, tabs: [['plan', t('navigationCore.pages.planTab'), (): unknown => pintarPaginaPlan()]] },
};

const byId = (id: string): HTMLElement | null => document.getElementById(id);

const chosenTab = (screen: string, page: PageDefinition): string => {
  const wanted = PAG_TAB[screen];
  return page.tabs.some(tab => tab[0] === wanted) && wanted ? wanted : page.tabs[0]?.[0] ?? '';
};

const painterOf = (page: PageDefinition, key: string): (() => unknown) | undefined => page.tabs.find(tab => tab[0] === key)?.[2];

function headerHtml(screen: string, page: PageDefinition, tab: string): string {
  const header = screen === 'plan' ? '' : `<div class="saludo"><div><h1>${escapeHtml(page.t)}</h1><div class="fecha">${escapeHtml(page.d)}</div></div></div>`;
  const tabs = page.tabs.length > 1 ? `<div class="cfgsubs pagtabs">${page.tabs.map(([key, name]) => `<button data-ptab="${key}" class="${key === tab ? 'on' : ''}">${escapeHtml(name)}</button>`).join('')}</div>` : '';
  return `${header}
    ${tabs}
    <div id="cfgcuerpo" class="pagcuerpo"></div>`;
}

function sectionFor(screen: string): HTMLElement | null {
  let section = byId(`v-${screen}`);
  if (!section) { document.querySelector('main')?.insertAdjacentHTML('beforeend', `<section id="v-${screen}"></section>`); section = byId(`v-${screen}`); }
  return section;
}

/** The Panel delcos page shows the title and description of its section (v2.17x). */
function platformTitle(): void {
  const section = byId('v-delcos'), tab = PAG_TAB.delcos ?? 'orgs', found = PANEL_SECCIONES.find(item => item[1] === tab);
  if (!section || !found) return;
  const title = section.querySelector('.saludo h1'), description = section.querySelector('.saludo .fecha');
  if (title) title.textContent = found[2] ?? '';
  if (description) description.textContent = PANEL_DESC[tab] ?? '';
}

/** Builds the whole page: only one content container at a time (Configuración and the other pages are emptied). */
function buildPage(screen: string, page: PageDefinition): void {
  if (page.permiso && !page.permiso()) { ir('inicio'); return; }
  if (page.admin && !puede('administrar')) { ir('inicio'); return; }
  const section = sectionFor(screen); if (!section) return;
  const settings = byId('v-config'); if (settings) settings.innerHTML = '';
  Object.keys(PAGES).forEach(other => { const box = other === screen ? null : byId(`v-${other}`); if (box) box.innerHTML = ''; });
  const tab = chosenTab(screen, page);
  section.innerHTML = headerHtml(screen, page, tab);
  section.querySelectorAll<HTMLElement>('.pagtabs [data-ptab]').forEach(button => {
    button.onclick = (): void => { PAG_TAB[screen] = button.dataset.ptab; loadPage(screen); };
  });
  void Promise.resolve().then(painterOf(page, tab));
  if (screen === 'delcos' && MODO_PLATAFORMA) platformTitle();
}

/** Between tabs that are lists, the page stays: the tab is marked at once, the old list is dimmed and replaced when the new one arrives. */
function switchListTab(screen: string, page: PageDefinition, box: Element, tabs: Element): Promise<unknown> | null {
  const tab = chosenTab(screen, page);
  tabs.querySelectorAll<HTMLElement>('[data-ptab]').forEach(button => button.classList.toggle('on', button.dataset.ptab === tab));
  // Only between tabs that are lists (Informe de gastos de Eventos is not: that page is built whole, as before)
  const isList = PL_SECC[screen];
  if (isList && !isList()) return null;
  box.classList.add('pagcambia');
  return Promise.resolve().then(painterOf(page, tab)).finally(() => { byId('cfgcuerpo')?.classList.remove('pagcambia'); });
}

/** Opens a page, or changes its tab. */
export function loadPage(screen: string): unknown {
  const page = PAGES[screen]; if (!page) return undefined;
  const section = byId(`v-${screen}`), box = section?.querySelector('#cfgcuerpo'), tabs = section?.querySelector(':scope > .pagtabs');
  if (BLQ[screen] && TAB === screen && box && tabs && section?.classList.contains('plantilla')) {
    const switched = switchListTab(screen, page, box, tabs);
    if (switched) return switched;
  }
  buildPage(screen, page);
  return undefined;
}
