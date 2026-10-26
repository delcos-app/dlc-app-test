/**
 * Menu and navigation details from legacy layers: the logo goes home and the company's names stay on the menu (v2.231.0, v2.233.0),
 * the first screen waits to be whole (v2.237.0), «Usuarios» without the roles tab and Inicio's header completed at start (v2.267.0),
 * the phone's bottom bar (v2.335.0, v2.338.0) and the «i» pop-up pointing at the manual (v2.224.0, v2.271.0). Moved from legado 082,
 * 083, 085, 112, 115, 150 and 152 (v2.424.0); pintarBnav, aplicarEtiqueta and resumirAyuda stay as adapters.
 */
import { navigationGlueLegacy as legacy } from '../../legacy/legado-d-glue-bridge';
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';
import { closestOf } from './events';

const ROUTES_REFILL_MS = 8000;

/** Legado 083: logo → Inicio; Rutas starts a new route draft; the repeated routes are refilled a moment after start. */
export function installMenuDetails(): void {
  document.addEventListener('click', event => {
    const logo = closestOf(event.target, 'header .top .logo, nav.main .mlmarca');
    if (!logo || !legacy.profileLoaded()) return;
    const home = document.querySelector<HTMLElement>('nav.main [data-t="inicio"]') ?? document.querySelector<HTMLElement>('nav.main [data-t]');
    if (home) { event.preventDefault(); home.click(); }
  });
  legacy.addIconIfMissing('trash-2', '<path d="M3 6h18" /> <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /> <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /> <line x1="10" x2="10" y1="11" y2="17" /> <line x1="14" x2="14" y1="11" y2="17" />');
  setTimeout(() => { if (legacy.profileLoaded() && legacy.canSeeArea('rutas')) legacy.refillRoutes(); }, ROUTES_REFILL_MS);
  document.addEventListener('click', event => {
    const button = closestOf(event.target, 'nav.main [data-t="rutas"], #bnav [data-t="rutas"], .bmasgrid [data-bm="rutas"]');
    if (button && legacy.routeDraft()) legacy.forgetRouteDraft();
  }, true);
}

/** Legado 083: when the menu is built again (start, resize…) the company's names go back on it. */
export function installMenuNames(): void {
  legacy.wrapGlobal('montarMenuLateral', original => function (this: unknown, ...args: unknown[]): unknown {
    const result = original.apply(this, args); try { legacy.applyMenuNames(); } catch { /* the menu may be incomplete */ } return result;
  });
  new MutationObserver(() => { legacy.applyMenuNamesSoon(); }).observe(document.body, { childList: true, subtree: true });
}

/** aplicarEtiqueta: the brand label, and then the menu names. */
export function applyLabel(args: unknown[]): unknown {
  const result = legacy.baseApplyLabel(args);
  try { legacy.applyMenuNames(); } catch { /* the menu may be incomplete */ }
  return result;
}

/** Legado 085: at start, the first screen also waits until it is whole. */
export function installFirstReveal(): void {
  const app = document.getElementById('app'); if (!app) return;
  let shown = !app.classList.contains('hide');
  const reveal = (): void => {
    const screen = document.getElementById(`v-${legacy.currentScreen()}`);
    if (screen && !screen.classList.contains('hide') && legacy.hasReadyCheck(legacy.currentScreen())) legacy.reveal(screen);
  };
  // The start may show the app before this runs: then it applies to the screen already shown
  if (shown) reveal();
  new MutationObserver(() => {
    const now = !app.classList.contains('hide'); if (now === shown) return;
    shown = now;
    if (now) reveal();
  }).observe(app, { attributes: true, attributeFilter: ['class'] });
  legacy.setReadyCheck('inicio', () => true);   // with the mosaic skeleton it shows at once
}

/** Legado 112: Inicio's header completed if its skeleton came first; «Usuarios» without the roles tab. */
export function installStartDetails(): void {
  if (document.querySelector('#v-inicio.conmos')) legacy.homeHeader();
  legacy.renameUsersPage(t('legacyD.navigation.users'), t('legacyD.navigation.usersHint'));
}

/** pintarBnav: the phone's bottom bar with the modules chosen for it and «Más»; then its height is measured. */
export function paintBottomBar(args: unknown[]): unknown {
  const result = paintBar(args);
  legacy.measureBottomBar();
  return result;
}

function paintBar(args: unknown[]): unknown {
  const bar = document.getElementById('bnav');
  if (legacy.isProfessionalPortal() || !bar) return legacy.baseBottomBar(args);
  const modules = legacy.mobileModules(), screen = legacy.currentScreen();
  bar.dataset.n = String(modules.length + 1);
  bar.innerHTML = modules.map(module => `<button data-t="${module}"${screen === module ? ' aria-current="page"' : ''}><span>${legacy.moduleIcon(module) ?? '•'}</span>${escapeHtml(legacy.mobileName(module))}</button>`).join('')
    + `<button id="bmasbtn"${!modules.includes(screen) ? ' aria-current="page"' : ''}><span>⋯</span>${t('legacyD.navigation.more')}</button>`;
  bar.querySelectorAll<HTMLElement>('[data-t]').forEach(button => { button.onclick = (): void => { legacy.goTo(button.dataset.t ?? ''); }; });
  const more = document.getElementById('bmasbtn'); if (more) more.onclick = (): void => { legacy.openMoreMenu(); };
  return undefined;
}

/** Legado 152: the bar's height on resize. */
export function installBottomBarMeasure(): void {
  addEventListener('resize', () => { legacy.measureBottomBar(); });
  setTimeout(() => { legacy.measureBottomBar(); }, 0);
}

/** resumirAyuda: «Ver en el manual de uso» opens this screen's section; the professional's portal has no manual. */
export function summariseHelp(popup: HTMLElement & { __de?: HTMLElement }): void {
  legacy.baseSummariseHelp(popup);
  const link = popup.querySelector<HTMLElement>('.aiman');
  if (link) {
    const anchor = popup.__de ? legacy.helpAnchor(popup.__de) : legacy.manualAnchor(legacy.currentScreen()) ?? '';
    link.innerHTML = `${t('legacyD.navigation.seeInManual')} <span aria-hidden="true">›</span>`;
    link.onclick = (event): void => { event.preventDefault(); event.stopPropagation(); popup.remove(); legacy.openManual(anchor); };
  }
  if (legacy.isProfessionalPortal()) popup.querySelectorAll('.aiman').forEach(item => { item.remove(); });
}
