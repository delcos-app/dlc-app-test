/**
 * Navigation steps, first half (the outermost rules: they run first before switching and last after it).
 * Each step was a wrapper of the legacy `ir()`; the version where it was added is in its name.
 */
import { orFallback } from '../../services/values';
import type { NavigationStep } from './pipeline';
import * as legacyFreeScreensSettingsShell from '../../screens/settings/shell';
import { navigationStore } from './store';
import { homeStore } from '../../screens/home/store';
import { settingsStore } from '../../screens/settings/store';
import { sessionStore } from '../session-store';
import { agendaStore } from '../../screens/agenda/store';
import { ordersStore } from '../../screens/orders/store';
import * as legacyFreeComponentsListBar from '../../components/list-bar';
import * as legacyFreeCoreServices from '../services';

const PORTAL_SCREENS = ['informe', 'config', 'perfil'];
const PLATFORM_SCREENS = ['delcos', 'config', 'perfil', 'manual'];

const safely = (action: () => void): void => { try { action(); } catch { /* a decoration must never break navigation */ } };
const later = (delays: readonly number[], action: () => void): void => {
  delays.forEach(delay => { setTimeout(() => { safely(action); }, delay); });
};

export const resetBackStack: NavigationStep = {
  name: 'v2.300 · a new navigation empties the «Volver» stack',
  before: () => { VUELTA.length = 0; navigationStore.view = null; },
};

export const professionalPortalOnly: NavigationStep = {
  name: 'v2.271 · the professional (and centre) portal only opens its own screens',
  before: nav => { if (ES_MEDICO() && !PORTAL_SCREENS.includes(nav.target)) nav.target = 'informe'; },
};

export const loadingComet: NavigationStep = {
  name: 'v2.267 · the loading line at the top when the screen changes',
  before: nav => { if (nav.target && nav.target !== navigationStore.screen) safely(cometa); },
};

export const watchListPage: NavigationStep = {
  name: 'v2.239 · list pages (PL) keep their layout in sync',
  after: target => { if (PL[target]) { legacyFreeComponentsListBar.watch(target); setTimeout(() => { legacyFreeComponentsListBar.watch(target); }, 0); } },
};

export const customMenuNames: NavigationStep = {
  name: 'v2.231 · menu names chosen by the company',
  after: () => { setTimeout(() => { safely(aplicarNombresMenu); }, 0); queueMicrotask(() => { safely(aplicarNombresMenu); }); },
};

export const rememberManualReturn: NavigationStep = {
  name: 'v2.224 · entering the manual remembers where to come back to',
  before: nav => { if (nav.target === 'manual' && navigationStore.screen !== 'manual') homeStore.manualReturn = { tab: navigationStore.screen, y: window.scrollY || 0 }; },
};

/** Event for code that needs to react to every navigation without being part of it (e.g. the mobile «+» button comes back). */
export const NAVIGATION_START_EVENT = 'delcos:navigation-start';

export const announceNavigation: NavigationStep = {
  name: 'v2.221 · tell listeners a navigation starts (the mobile «+» comes back into view)',
  before: nav => { document.dispatchEvent(new CustomEvent(NAVIGATION_START_EVENT, { detail: { target: nav.target } })); },
};

/** Which part of Configuración each old screen name opens (null: not a configuration screen). */
function configKey(target: string): string | null {
  if (target === 'config') return legacyFreeScreensSettingsShell.oldSettingsKey(settingsStore.section, settingsStore.subsection);
  if (target === 'perfil') return navigationStore.pageTabs.perfil === 'notif' ? 'notif' : 'datos';
  if (target === 'organizacion' || target === 'empresa') return `o.${orFallback(navigationStore.pageTabs[target], 'marca')}`;
  if (target === 'plan') return 'o.plan';
  if (target === 'usuarios') return navigationStore.pageTabs.usuarios === 'roles' ? 'roles' : 'usuarios';
  return null;
}

export const singleConfiguration: NavigationStep = {
  name: 'v2.215/v2.340 · profile, company, plan and users are parts of the single Configuración page',
  before: nav => {
    if (nav.target === 'config' && ['seguridad', 'orgs'].includes(settingsStore.section ?? '')) return;   // they stay in the Panel delcos
    const key = configKey(nav.target);
    if (key === null) return;
    if (key) { CFG_KEY = key; settingsStore.detail = true; } else if (IR_DESDE_MENU_CFG) { settingsStore.detail = false; CFG_KEY = 'datos'; }
    if (nav.target !== 'config') { navigationStore.pageTabs.perfil = undefined; navigationStore.pageTabs.organizacion = undefined; navigationStore.pageTabs.empresa = undefined; navigationStore.pageTabs.usuarios = undefined; }
    settingsStore.section = '__cfg'; settingsStore.subsection = null; IR_DESDE_MENU_CFG = false;
    nav.target = 'config';
  },
};

export const directoryLabel: NavigationStep = {
  name: 'v2.210 · the directory title with the company word for its accounts',
  after: target => { if (target === 'directorio') later([0, 300, 1200], aplicarEtiqueta); },
};

export const manualHelpButton: NavigationStep = {
  name: 'v2.226 · the «i» help next to each screen title',
  after: () => { later([400, 1200, 2500], ponerAyudaManual); },
};

export const platformPanel: NavigationStep = {
  name: 'v2.166 · Panel delcos sections, and platform mode only shows the panel',
  before: nav => {
    const section = PANEL_SECCIONES.find(entry => entry[0] === nav.target);
    if (section) { navigationStore.pageTabs.delcos = section[1]; nav.target = 'delcos'; return; }
    if (navigationStore.platformMode && !PLATFORM_SCREENS.includes(nav.target)) nav.target = 'delcos';
  },
  after: target => { if (target === 'delcos') legacyFreeScreensSettingsShell.markPlatformPanel(); },
};

export const stripeReturnToPlan: NavigationStep = {
  name: 'v2.167 · coming back from Stripe opens «Plan y suscripción»',
  before: nav => {
    if (!PAGO_IR_PLAN || !sessionStore.profile) return;
    pagoAlPlan();
    if (!ES_MEDICO() && puedeOrganizacion()) nav.target = 'plan';
  },
};

export const planSections: NavigationStep = {
  name: 'v2.152 · sections outside the contracted plan show the plan notice instead',
  before: nav => {
    if (nav.target in PLAN_SECCIONES && sessionStore.profile && !ES_MEDICO() && !planIncluyeSeccion(nav.target)) { legacyFreeCoreServices.plans.planNotice(nav.target); nav.blocked = true; }
  },
};

export const agendaFromMenuIsToday: NavigationStep = {
  name: 'v2.140 · Agenda from the menu always opens today',
  before: nav => { if (nav.target === 'agenda' && IR_DESDE_MENU) { agendaStore.mode = 'dia'; agendaStore.selectedDate = hoyISO(); } },
};

export const ordersSections: NavigationStep = {
  name: 'v2.128 · Oportunidades, Compras… are sections of Pedidos',
  before: nav => {
    const section = ALIAS_PEDIDOS[nav.target];
    if (section !== undefined) { ordersStore.section = section; nav.target = 'ventas'; return; }
    if (nav.target === 'ventas' && IR_DESDE_MENU) ordersStore.section = 'ventas';   // «Pedidos» from the menu always opens the orders
  },
  after: target => { if (target === 'ventas') legacyFreeScreensSettingsShell.markOrderSection(); },
};

export const closePageDialog: NavigationStep = {
  name: 'v2.128 · a window that belongs to the page closes when leaving it',
  before: () => {
    const dialog = document.getElementById('dlg') as HTMLDialogElement | null;
    if (dialog?.open && (Boolean(dialog.dataset.fija) || Boolean(dialog.dataset.depagina))) dialog.close();
  },
};

export const footerMenuMark: NavigationStep = {
  name: 'v2.128 · mark the current screen in the footer menu',
  after: () => { menuMarcarPie(); setTimeout(menuMarcarPie, 0); },
};
