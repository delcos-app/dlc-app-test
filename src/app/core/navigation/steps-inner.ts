/**
 * Navigation steps, second half (the innermost rules: they run last before switching and first after it).
 * Each step was a wrapper of the legacy `ir()`; the version where it was added is in its name.
 */
import { orFallback } from '../../services/values';
import type { NavigationStep } from './pipeline';
import { navigationStore } from './store';
import { settingsStore } from '../../screens/settings/store';
import { billingStore } from '../../screens/billing/store';
import * as legacyFreeComponentsEmbeddedWindow from '../../components/embedded-window';
import * as legacyFreeCoreNavigationApi from './api';

const COMPANY_SECTIONS = ['__empresa', 'empresa', 'marca', 'correo', 'copias'];
const MAIL_SECTIONS = ['correo', 'copias'];

const screenSection = (): HTMLElement | null => document.getElementById(`v-${navigationStore.screen}`);

export const configToOwnPages: NavigationStep = {
  name: 'v2.128 · team, security and organizations open their own pages',
  before: nav => {
    if (nav.target === 'config' && settingsStore.section === 'equipo') {
      navigationStore.pageTabs.usuarios = settingsStore.subsection === 'roles' ? 'roles' : 'usuarios'; settingsStore.section = 'inicio'; settingsStore.subsection = null; nav.target = 'usuarios';
    }
    if (nav.target === 'config' && settingsStore.section === 'seguridad' && puede('gestionar_plataforma')) {
      navigationStore.pageTabs.delcos = settingsStore.subsection === 'accesos' ? 'accesos' : 'auditoria'; settingsStore.section = 'inicio'; settingsStore.subsection = null; nav.target = 'delcos';
    }
    if (nav.target === 'config' && settingsStore.section === 'orgs' && puede('gestionar_plataforma')) { navigationStore.pageTabs.delcos = 'orgs'; settingsStore.section = 'inicio'; nav.target = 'delcos'; }
  },
};

export const closeEmbeddedWindows: NavigationStep = {
  name: 'v2.117 · windows embedded in a page close when leaving it',
  before: () => { legacyFreeComponentsEmbeddedWindow.closeEmbedded(); },
};

export const organizationPage: NavigationStep = {
  name: 'v2.121 · company and plan are parts of the Organización page (only for who may configure it)',
  before: nav => {
    const fromConfig = nav.target === 'config' && settingsStore.section !== null ? ORG_DESDE[settingsStore.section] : undefined;
    if (nav.target === 'empresa') { navigationStore.pageTabs.organizacion = orFallback(navigationStore.pageTabs.empresa, 'marca'); nav.target = 'organizacion'; }
    else if (nav.target === 'plan') { navigationStore.pageTabs.organizacion = 'plan'; nav.target = 'organizacion'; }
    else if (fromConfig) { navigationStore.pageTabs.organizacion = orFallback(settingsStore.subsection !== null ? ORG_DESDE[settingsStore.subsection] : undefined, fromConfig); settingsStore.section = 'rutas'; nav.target = 'organizacion'; }
    if (nav.target === 'organizacion' && !puedeOrganizacion()) nav.target = 'inicio';
  },
};

export const clearPagesWhenLeaving: NavigationStep = {
  name: 'v2.117 · going to a non-page screen empties the pages, so no old page shows up',
  before: nav => {
    if (nav.target in PAGINAS) return;
    Object.keys(PAGINAS).forEach(page => { const section = document.getElementById(`v-${page}`); if (section) section.innerHTML = ''; });
  },
};

const revealSince: number[] = [];

export const atomicReveal: NavigationStep = {
  name: 'v2.60 · the screen is revealed at once when its data is ready (no screen «ghosts»)',
  before: () => { revealSince.push(Date.now() - 2); },
  after: () => {
    const section = screenSection();
    if (section) { section.classList.remove('cargando', 'cargando-pend'); legacyFreeCoreNavigationApi.reveal(section, 4000, (revealSince[revealSince.length - 1] ?? Date.now())); }
    document.querySelectorAll('main > section.preparando').forEach(other => { if (other !== section) other.classList.remove('preparando'); });
  },
  cleanup: () => { revealSince.pop(); },
};

/** Old Facturación settings that used to live in Configuración. */
function billingSection(): string | undefined {
  const map: Readonly<Record<string, string>> = { fiscal: 'empresa', series: 'series', vf: 'verifactu', fact: orFallback(billingStore.lastSection, 'empresa') };
  const section = settingsStore.section ?? '';
  if (!(map[section] ?? (section === 'fact' ? map[settingsStore.subsection ?? ''] : undefined))) return undefined;
  return orFallback(map[section === 'fact' ? orFallback(settingsStore.subsection, 'fact') : section], 'empresa');
}

export const billingSettings: NavigationStep = {
  name: 'v2.57 · fiscal data, series and VeriFactu open in Facturación',
  before: nav => {
    if (nav.target !== 'config') return;
    const section = billingSection();
    if (section !== undefined) { billingStore.section = section; settingsStore.section = 'rutas'; nav.target = 'facturacion'; }
  },
};

export const loadingIndicatorAfterDelay: NavigationStep = {
  name: 'v2.56 · the loading indicator only shows while the screen is still requesting data',
  after: () => {
    const section = screenSection();
    if (section?.classList.contains('cargando-pend')) { section.classList.remove('cargando-pend'); if (navigationStore.pendingReads > 0) section.classList.add('cargando'); }
  },
};

export const markNavigationInProgress: NavigationStep = {
  name: 'v2.56 · VIA_IR tells the screens they are being opened by a navigation',
  before: nav => { navigationStore.via = nav.target; },
  cleanup: () => { setTimeout(() => { navigationStore.via = null; }, 0); },
};

/** Tab of the company page for an old Configuración section: mail and backups have their own tab, the rest is the brand. */
function companyTab(): string {
  if (settingsStore.subsection !== null && MAIL_SECTIONS.includes(settingsStore.subsection)) return settingsStore.subsection;
  if (settingsStore.section !== null && MAIL_SECTIONS.includes(settingsStore.section)) return settingsStore.section;
  return 'marca';
}

export const legacyConfigPages: NavigationStep = {
  name: 'v2.53 · notifications, company and plan have their own page; pages are loaded after switching',
  before: nav => {
    if (nav.target === 'config' && settingsStore.section === 'notif') { navigationStore.pageTabs.perfil = 'notif'; settingsStore.section = 'rutas'; nav.target = 'perfil'; }
    if (nav.target === 'config' && ['perfil', 'prefs'].includes(settingsStore.section ?? '')) settingsStore.section = 'rutas';
    if (nav.target === 'config' && COMPANY_SECTIONS.includes(settingsStore.section ?? '')) { navigationStore.pageTabs.empresa = companyTab(); settingsStore.section = 'rutas'; nav.target = 'empresa'; }
    if (nav.target === 'config' && settingsStore.section === 'plan') { settingsStore.section = 'rutas'; nav.target = 'plan'; }
  },
  after: target => { if (PAGINAS[target]) cargarPagina(target); },
};

export const noFlashOnFastLoad: NavigationStep = {
  name: 'v2.52 · fast screens go straight from the old content to the new one, without a flash of the loader',
  after: () => {
    const section = screenSection();
    if (!section?.classList.contains('cargando')) return;
    section.classList.remove('cargando'); section.classList.add('cargando-pend');
    if (navigationStore.pendingReads > 0) section.classList.add('cargando');
    section.classList.remove('cargando-pend');
  },
};
