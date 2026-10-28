/**
 * The pages of the legacy page map (PAGINAS) that the layers 072–079 defined: Organización (v2.117.0), Usuarios y roles and Panel delcos
 * (v2.131.0) with their later tabs, and Eventos, Ciclo de visitas and Intervenciones (v2.195.0–v2.199.0), with their menu groups,
 * icons and plans. Folded from legado 072, 073, 075, 076 and 079 (v2.425.0); the texts are in i18n.
 */
import { term } from '../../legacy/bridge';
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';
import * as legacyFreeScreensSettingsMore from '../../screens/settings/more';
import * as legacyFreeScreensSettingsExtra from '../../screens/settings/extra';
import * as legacyFreeComponentsEmbeddedWindow from '../../components/embedded-window';
import { navigationStore } from '../navigation/store';
import { usesVerifactu } from '../organisation';
import { paintTimeZone } from '../../screens/settings/time-zone/page';
import * as legacyFreeCoreServices from '../services';
import * as legacyFreeScreensPlatform from '../../screens/platform';
import * as legacyFreeScreensEvents from '../../screens/events';
import * as legacyFreeScreensCycle from '../../screens/cycle';
import * as legacyFreeScreensSurgeries from '../../screens/surgeries';
import * as legacyFreeScreensSettingsRest from '../../screens/settings/rest';
import * as legacyFreeScreensSettings from '../../screens/settings';
import * as legacyFreeScreensBilling from '../../screens/billing';
import * as legacyFreeCoreLegacyC from './';

type Tab = [string, string, () => unknown];
interface Page { t?: string; d?: string; tabs: Tab[]; permiso?: () => boolean; admin?: boolean }
interface MenuGroup { id: string; t: string; items: string[] }

const pages = (): Record<string, Page> => PAGINAS as unknown as Record<string, Page>;
const groups = (): MenuGroup[] => MENU_GRUPOS as unknown as MenuGroup[];
const navIcons = (): Record<string, string> => ICO_NAV as unknown as Record<string, string>;
const moduleIcons = (): Record<string, string> => ICO_MOD as unknown as Record<string, string>;

/** Wraps the tabs getter of a page (each layer filtered or added tabs on top of the previous one). */
function wrapTabs(name: string, change: (tabs: Tab[]) => Tab[]): void {
  const page = pages()[name]; if (!page) return;
  const descriptor = Object.getOwnPropertyDescriptor(page, 'tabs');
  const previous = (): Tab[] => (descriptor?.get ? (descriptor.get.call(page) as Tab[]) : (descriptor?.value as Tab[] | undefined) ?? []);
  Object.defineProperty(page, 'tabs', { configurable: true, get: () => change(previous()) });
}

/**
 * v2.117.0: Organización, with billing only when the plan includes it (v2.131.0: without the organizations list; v2.445.0: VeriFactu only
 * in Spain; v2.447.0: Zona horaria).
 */
export function defineOrganization(): void {
  const page: Page = {
    t: t('legacyC.pages.organization.title'), d: t('legacyC.pages.organization.description'), permiso: () => legacyFreeCoreServices.permissions.canManageOrganization(),
    get tabs(): Tab[] {
      const billing = legacyFreeCoreServices.plans.planIncludes(('facturacion'));
      return [['marca', t('legacyC.pages.organization.brand'), () => legacyFreeScreensSettingsMore.paintBrand()], ['correo', t('legacyC.pages.organization.email'), () => legacyFreeScreensSettingsExtra.paintEmail()],
        ['zona', t('timeZone.title'), () => paintTimeZone()],
        ['copias', t('legacyC.pages.organization.backups'), () => legacyFreeScreensSettingsMore.paintBackups()], ['plan', t('legacyC.pages.organization.plan'), () => legacyFreeCoreLegacyC.paintPlanPage([])],
        ...(billing ? [['fiscal', t('legacyC.pages.organization.fiscal'), facOrg(() => { void legacyFreeCoreLegacyC.paintCompany([]); })], ['series', t('legacyC.pages.organization.series'), facOrg(() => { void legacyFreeScreensBilling.paintSeries(); })],
          ...(usesVerifactu() ? [['vf', t('legacyC.pages.organization.verifactu'), facOrg(() => { void legacyFreeScreensBilling.paintVerifactu(); })]] as Tab[] : []), ['pdf', t('legacyC.pages.organization.pdf'), () => legacyFreeCoreServices.pdf.openDesigner()]] as Tab[] : []),
        ...(legacyFreeCoreServices.permissions.can('gestionar_plataforma') ? [['orgs', t('legacyC.pages.organization.organizations'), () => legacyFreeScreensPlatform.paintOrganizations()]] as Tab[] : [])];
    },
  };
  pages().organizacion = page;
}

/** v2.131.0: Usuarios y roles and Panel delcos; Organización no longer lists the organizations. */
export function defineUsersAndPanel(): void {
  pages().usuarios = { t: t('legacyC.pages.users.title'), d: t('legacyC.pages.users.description'), admin: true,
    tabs: [['usuarios', t('legacyC.pages.users.users'), () => legacyFreeScreensSettingsRest.paintUsers()], ['roles', t('legacyC.pages.users.roles'), () => legacyFreeScreensSettingsMore.paintRoles()]] };
  pages().delcos = { t: t('legacyC.pages.panel.title'), d: t('legacyC.pages.panel.description'), permiso: () => legacyFreeCoreServices.permissions.can('gestionar_plataforma'),
    tabs: [['orgs', t('legacyC.pages.panel.organizations'), () => legacyFreeScreensPlatform.paintOrganizations()], ['accesos', t('legacyC.pages.panel.access'), () => legacyFreeComponentsEmbeddedWindow.showModuleInPanel(('accesos'))],
      ['auditoria', t('legacyC.pages.panel.audit'), () => legacyFreeComponentsEmbeddedWindow.showModuleInPanel(('auditoria'))]] };
  wrapTabs('organizacion', tabs => tabs.filter(tab => tab[0] !== 'orgs'));
  // Icons of the new sections: Usuarios y roles with the access key and the panel with the shield
  Object.assign(navIcons(), { usuarios: 'key-round', delcos: 'shield' });
}

/** v2.13x: in the test environment, Organización has «Entorno de pruebas». */
export const addTestEnvironmentTab = (): void => {
  wrapTabs('organizacion', tabs => (EN_PRUEBAS ? [...tabs, ['pruebas', t('legacyC.pages.organization.testEnvironment'), () => legacyFreeScreensSettings.paintTestEnvironment()]] : tabs));
};

/** v2.139.0: Proveedores, Compras and Oportunidades in the Ventas group, after Pedidos. */
export function addSalesSections(): void {
  Object.assign(navIcons(), { oportunidades: 'phone', compras: 'clipboard-list', proveedores: 'building' });
  const group = groups().find(item => item.id === 'ventas'); if (!group) return;
  ['proveedores', 'compras', 'oportunidades'].forEach(key => { if (!group.items.includes(key)) group.items.splice(group.items.indexOf('ventas') + 1, 0, key); });
}

/** v2.154.0: every section of the menu has its icon in «Más» and «Tus módulos». */
export function iconsForAllSections(): void {
  Object.keys(navIcons()).forEach(key => { const name = navIcons()[key] ?? ''; if (ICON_NOM[name]) moduleIcons()[key] = svgIco(ICON_NOM[name]); });
}

/** v2.159.0: Panel delcos → Errores; v2.16x: read-only billing hides its Organización tabs. */
export function addErrorsTab(): void {
  const panel = pages().delcos;
  if (panel && !panel.tabs.some(tab => tab[0] === 'errores')) panel.tabs.push(['errores', t('legacyC.pages.panel.errors'), () => legacyFreeScreensPlatform.paintPlatformErrors()]);
}
export const hideReadOnlyBillingTabs = (): void => {
  wrapTabs('organizacion', tabs => (legacyFreeScreensBilling.readOnlyBilling() ? tabs.filter(tab => !['fiscal', 'series', 'vf', 'pdf'].includes(tab[0])) : tabs));
};

/** v2.166.0: Panel delcos → Solicitudes, second. */
export function addRequestsTab(): void {
  const panel = pages().delcos;
  if (panel && !panel.tabs.some(tab => tab[0] === 'solicitudes')) panel.tabs.splice(1, 0, ['solicitudes', t('legacyC.pages.panel.requests'), () => legacyFreeScreensPlatform.paintRequests()]);
}

/** v2.16x: in platform mode, the delcos team and the template of new companies. */
export function addPlatformTabs(): void {
  const panel = pages().delcos; if (!panel) return;
  const base = panel.tabs;
  Object.defineProperty(panel, 'tabs', { configurable: true, get: (): Tab[] => (navigationStore.platformMode
    ? [...base, ['equipo', t('legacyC.pages.panel.team'), () => legacyFreeScreensSettingsRest.paintUsers()], ['plantilla', t('legacyC.pages.panel.template'), () => legacyFreeScreensPlatform.paintTemplate(undefined)]] : base) });
}

/** The panel sections as hidden buttons of the main menu, with their icons. */
function addPanelButtons(): void {
  const nav = document.getElementById('nav'); if (!nav) return;
  PANEL_SECCIONES.forEach(([key = '', , text = '', icon = '']) => {
    if (!nav.querySelector(`[data-t="${key}"]`)) nav.insertAdjacentHTML('beforeend', `<button data-t="${key}" class="hide pdsec">${escapeHtml(text)}</button>`);
    navIcons()[key] = icon;
  });
}

/** v2.16x: in platform mode the menu shows only the panel sections (as menu buttons, hidden outside it). */
export function addPanelMenu(): void {
  if (!document.getElementById('nav')) return;
  addPanelButtons();
  groups().push({ id: 'panel', t: t('legacyC.pages.panel.title'), items: PANEL_SECCIONES.map(section => section[0] ?? '') });
}

/** v2.173.0: Cobros, Altas and Estado in the panel menu; its tabs follow the menu order. */
export function completePanel(): void {
  const sections = PANEL_SECCIONES as unknown as (readonly string[])[];
  sections.splice(1, 0, ['pd-cobros', 'cobros', t('legacyC.pages.panel.billing'), 'credit-card'], ['pd-altas', 'altas', t('legacyC.pages.panel.signups'), 'rocket']);
  sections.splice(5, 0, ['pd-estado', 'estado', t('legacyC.pages.panel.status'), 'shield-check']);
  if (!document.getElementById('nav')) return;
  addPanelButtons();
  const group = groups().find(item => item.id === 'panel'); if (group) group.items = sections.map(section => section[0] ?? '');
  const extra: Record<string, () => unknown> = { cobros: () => legacyFreeScreensPlatform.paintBilling(), altas: () => legacyFreeScreensPlatform.paintSignups(), estado: () => legacyFreeScreensPlatform.paintStatus() };
  wrapTabs('delcos', base => (navigationStore.platformMode
    ? sections.map(([, key = '', name = '']): Tab | null => { const tab = base.find(item => item[0] === key); return tab ? [key, name, tab[2]] : extra[key] ? [key, name, extra[key]] : null; })
      .filter((tab): tab is Tab => tab !== null)
    : base));
}

const addToGroup = (groupId: string, key: string, after?: string): void => {
  const group = groups().find(item => item.id === groupId); if (!group || group.items.includes(key)) return;
  if (after) group.items.splice(group.items.indexOf(after) + 1, 0, key); else group.items.push(key);
};

/** v2.195.0: Eventos (plans Comercial, Empresa and A medida), after Cuentas in its group. */
export function defineEvents(): void {
  navIcons().eventos = 'graduation-cap'; moduleIcons().eventos = svgIco(ICON_NOM['graduation-cap'] ?? '');
  (PLAN_SECCIONES as Record<string, string[]>).eventos = ['comercial', 'empresa', 'medida'];
  addToGroup('cartera', 'eventos', 'directorio');
  const page: Page = { t: t('legacyC.pages.events.title'), permiso: () => !ES_MEDICO() && legacyFreeCoreServices.permissions.canUseModule('directorio') && legacyFreeCoreServices.plans.planIncludesSection('eventos'), tabs: [] };
  pages().eventos = page;
  Object.defineProperty(page, 'd', { get: () => t('legacyC.pages.events.description') });
  Object.defineProperty(page, 'tabs', { get: (): Tab[] => [['lista', t('legacyC.pages.events.list'), () => legacyFreeScreensEvents.paintEvents()] as Tab]
    .concat(verTransparencia() ? [['transparencia', t('legacyC.pages.events.expenses'), () => legacyFreeScreensEvents.paintExpenseReport(undefined)]] : []) });
}

/** v2.197.0: Ciclo de visitas, in «Tu día». */
export function defineCycle(): void {
  navIcons().ciclo = 'target'; moduleIcons().ciclo = svgIco(ICON_NOM.target ?? '');
  addToGroup('dia', 'ciclo');
  const page: Page = { permiso: () => !ES_MEDICO() && legacyFreeCoreServices.permissions.canUseModule('agenda'), tabs: [] };
  pages().ciclo = page;
  Object.defineProperty(page, 't', { get: () => t('legacyC.pages.cycle.title', { visits: term('visita', { number: 'p' }) }) });
  Object.defineProperty(page, 'd', { get: () => t('legacyC.pages.cycle.description', { professionals: term('medico', { number: 'p', capital: 'C' }), visits: term('visita', { number: 'p' }) }) });
  Object.defineProperty(page, 'tabs', { get: (): Tab[] => [['ciclo', t('legacyC.pages.cycle.current'), () => legacyFreeScreensCycle.paintCycle()] as Tab]
    .concat(legacyFreeCoreServices.plans.planIncludesSection('cobertura') ? [['cobertura', t('legacyC.pages.cycle.coverage'), () => legacyFreeScreensCycle.paintCoverage()]] : [], [['clasificar', t('legacyC.pages.cycle.classify'), () => legacyFreeScreensCycle.paintClassify()]])
    .concat(legacyFreeCoreServices.permissions.seesEverything() ? [['equipo', t('legacyC.pages.cycle.team'), () => legacyFreeScreensCycle.paintCycleTeam()]] : []) });
}

/** v2.199.0: the coverage by product goes with Comercial, Empresa and A medida (as on the web). */
export const coverageInPlans = (): void => { (PLAN_SECCIONES as Record<string, string[]>).cobertura = ['comercial', 'empresa', 'medida']; };

/** v2.199.0: Intervenciones, in «Tu día». */
export function defineSurgeries(): void {
  navIcons().cirugias = 'scissors'; moduleIcons().cirugias = svgIco(ICON_NOM.scissors ?? '');
  addToGroup('dia', 'cirugias');
  const page: Page = { t: t('legacyC.pages.surgeries.title'), permiso: () => !ES_MEDICO() && legacyFreeCoreServices.permissions.canUseModule('agenda'), tabs: [['lista', t('legacyC.pages.surgeries.title'), () => legacyFreeScreensSurgeries.paintSurgeries()]] };
  pages().cirugias = page;
  Object.defineProperty(page, 'd', { get: () => t('legacyC.pages.surgeries.description') });
}
