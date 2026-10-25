/**
 * Navigation steps, first half (the outermost rules: they run first before switching and last after it).
 * Each step was a wrapper of the legacy `ir()`; the version where it was added is in its name.
 */
import { orFallback } from '../../services/values';
import type { NavigationStep } from './pipeline';
import * as legacyFreeScreensSettingsShell from '../../screens/settings/shell';

const PORTAL_SCREENS = ['informe', 'config', 'perfil'];
const PLATFORM_SCREENS = ['delcos', 'config', 'perfil', 'manual'];

const safely = (action: () => void): void => { try { action(); } catch { /* a decoration must never break navigation */ } };
const later = (delays: readonly number[], action: () => void): void => {
  delays.forEach(delay => { setTimeout(() => { safely(action); }, delay); });
};

export const resetBackStack: NavigationStep = {
  name: 'v2.300 · a new navigation empties the «Volver» stack',
  before: () => { VUELTA.length = 0; VISTA = null; },
};

export const professionalPortalOnly: NavigationStep = {
  name: 'v2.271 · the professional (and centre) portal only opens its own screens',
  before: nav => { if (ES_MEDICO() && !PORTAL_SCREENS.includes(nav.target)) nav.target = 'informe'; },
};

export const loadingComet: NavigationStep = {
  name: 'v2.267 · the loading line at the top when the screen changes',
  before: nav => { if (nav.target && nav.target !== TAB) safely(cometa); },
};

export const watchListPage: NavigationStep = {
  name: 'v2.239 · list pages (PL) keep their layout in sync',
  after: target => { if (PL[target]) { plVigilar(target); setTimeout(() => { plVigilar(target); }, 0); } },
};

export const customMenuNames: NavigationStep = {
  name: 'v2.231 · menu names chosen by the company',
  after: () => { setTimeout(() => { safely(aplicarNombresMenu); }, 0); queueMicrotask(() => { safely(aplicarNombresMenu); }); },
};

export const rememberManualReturn: NavigationStep = {
  name: 'v2.224 · entering the manual remembers where to come back to',
  before: nav => { if (nav.target === 'manual' && TAB !== 'manual') MANUAL_VUELTA = { tab: TAB, y: window.scrollY || 0 }; },
};

/** Event for code that needs to react to every navigation without being part of it (e.g. the mobile «+» button comes back). */
export const NAVIGATION_START_EVENT = 'delcos:navigation-start';

export const announceNavigation: NavigationStep = {
  name: 'v2.221 · tell listeners a navigation starts (the mobile «+» comes back into view)',
  before: nav => { document.dispatchEvent(new CustomEvent(NAVIGATION_START_EVENT, { detail: { target: nav.target } })); },
};

/** Which part of Configuración each old screen name opens (null: not a configuration screen). */
function configKey(target: string): string | null {
  if (target === 'config') return claveCfgVieja(CFG_SEC, CFG_SUB);
  if (target === 'perfil') return PAG_TAB.perfil === 'notif' ? 'notif' : 'datos';
  if (target === 'organizacion' || target === 'empresa') return `o.${orFallback(PAG_TAB[target], 'marca')}`;
  if (target === 'plan') return 'o.plan';
  if (target === 'usuarios') return PAG_TAB.usuarios === 'roles' ? 'roles' : 'usuarios';
  return null;
}

export const singleConfiguration: NavigationStep = {
  name: 'v2.215/v2.340 · profile, company, plan and users are parts of the single Configuración page',
  before: nav => {
    if (nav.target === 'config' && ['seguridad', 'orgs'].includes(CFG_SEC ?? '')) return;   // they stay in the Panel delcos
    const key = configKey(nav.target);
    if (key === null) return;
    if (key) { CFG_KEY = key; CFG_DETALLE = true; } else if (IR_DESDE_MENU_CFG) { CFG_DETALLE = false; CFG_KEY = 'datos'; }
    if (nav.target !== 'config') { PAG_TAB.perfil = undefined; PAG_TAB.organizacion = undefined; PAG_TAB.empresa = undefined; PAG_TAB.usuarios = undefined; }
    CFG_SEC = '__cfg'; CFG_SUB = null; IR_DESDE_MENU_CFG = false;
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
    if (section) { PAG_TAB.delcos = section[1]; nav.target = 'delcos'; return; }
    if (MODO_PLATAFORMA && !PLATFORM_SCREENS.includes(nav.target)) nav.target = 'delcos';
  },
  after: target => { if (target === 'delcos') legacyFreeScreensSettingsShell.markPlatformPanel(); },
};

export const stripeReturnToPlan: NavigationStep = {
  name: 'v2.167 · coming back from Stripe opens «Plan y suscripción»',
  before: nav => {
    if (!PAGO_IR_PLAN || !PERFIL) return;
    pagoAlPlan();
    if (!ES_MEDICO() && puedeOrganizacion()) nav.target = 'plan';
  },
};

export const planSections: NavigationStep = {
  name: 'v2.152 · sections outside the contracted plan show the plan notice instead',
  before: nav => {
    if (nav.target in PLAN_SECCIONES && PERFIL && !ES_MEDICO() && !planIncluyeSeccion(nav.target)) { avisoPlan(nav.target); nav.blocked = true; }
  },
};

export const agendaFromMenuIsToday: NavigationStep = {
  name: 'v2.140 · Agenda from the menu always opens today',
  before: nav => { if (nav.target === 'agenda' && IR_DESDE_MENU) { AG_MODO = 'dia'; AG_FECHA = hoyISO(); } },
};

export const ordersSections: NavigationStep = {
  name: 'v2.128 · Oportunidades, Compras… are sections of Pedidos',
  before: nav => {
    const section = ALIAS_PEDIDOS[nav.target];
    if (section !== undefined) { PEDSEC = section; nav.target = 'ventas'; return; }
    if (nav.target === 'ventas' && IR_DESDE_MENU) PEDSEC = 'ventas';   // «Pedidos» from the menu always opens the orders
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
