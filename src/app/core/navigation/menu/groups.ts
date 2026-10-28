/**
 * The menu: its groups on desktop (v2.132.0) with each person's order and hidden sections, the names the company gives to each
 * screen, the plan locks, the order of the buttons, the tip of a folded icon, Usuarios and Panel delcos. Migrated from the legacy
 * MENU_GRUPOS, MENU_FIJO, menuGrupos, menuPrefs, menuNombres, menuTip, menuEscritorio, menuPlegado, menuRehacer, aplicarNombresMenu,
 * ordenarMenu, candadoSecciones, aplicarPermisosMenuPaso1–3, aplicarPermisosMenuBase and menuPaginas2131 (v2.426.0); the shared
 * objects stay the same and the functions as adapters.
 */
import { t } from '../../../i18n';
import { orFallback } from '../../../services/values';
import { sessionStore } from '../../session-store';
import { settingsStore } from '../../../screens/settings/store';
import { navigationStore } from '../store';
import * as legacyFreeCoreServices from '../../services';
import * as legacyFreeCoreSettings from '../../settings';
import * as legacyFreeCoreLayers from '../../layers';

export interface MenuGroup { id: string; t: string; items: string[] }
interface MenuPrefs { orden?: string[]; items?: Record<string, string[] | undefined>; ocultos?: string[]; barra?: string[]; mas?: string[] }

const FOLD_BELOW = 1440, DESKTOP_FROM = 900, TIP_GAP = 10, LAST = 99;

/** The groups of the side menu (other modules add their screens to them). «Plataforma» always goes last. */
export const MENU_GROUPS: MenuGroup[] = [
  { id: 'dia', t: t('navigationCore.menu.groupDay'), items: ['inicio', 'agenda', 'rutas'] },
  { id: 'cartera', t: t('navigationCore.menu.groupPortfolio'), items: ['directorio', 'pacientes', 'seguimiento'] },
  { id: 'ventas', t: t('navigationCore.menu.groupSales'), items: ['ventas', 'productos', 'facturacion'] },
  { id: 'resultados', t: t('navigationCore.menu.groupResults'), items: ['analitica', 'informe'] },
  { id: 'equipo', t: t('navigationCore.menu.groupTeam'), items: ['usuarios'] }];
export const MENU_FIXED: MenuGroup = { id: 'plataforma', t: t('navigationCore.menu.groupPlatform'), items: ['delcos'] };
const MENU_ORDER = ['inicio', 'agenda', 'rutas', 'directorio', 'ventas', 'pacientes', 'productos', 'facturacion', 'analitica', 'informe'];

let redoFrame = 0;

/** The menu preferences of the person (order, hidden sections, phone bar). */
export const menuPrefs = (): MenuPrefs => ((sessionStore.profile as { preferencias?: { menu?: MenuPrefs } } | null)?.preferencias?.menu) ?? {};
export const menuNames = (): Record<string, string> => ((settingsStore.settings as { menu_nombres?: Record<string, string> } | null)?.menu_nombres) ?? {};
export const isDesktopMenu = (): boolean => innerWidth >= DESKTOP_FROM;
export function isMenuFolded(): boolean {
  try { const saved = localStorage.getItem('dlc-menu-plegado'); if (saved === '1' || saved === '0') return saved === '1'; } catch { /* the default */ }
  return innerWidth < FOLD_BELOW;
}
/** The side menu is rebuilt in the next frame (once, however many changes). */
export function redoMenu(): void {
  if (redoFrame) return;
  redoFrame = requestAnimationFrame(() => { redoFrame = 0; montarMenuLateral(); });
}

function orderedItems(group: MenuGroup, prefs: MenuPrefs): string[] {
  const own = prefs.items?.[group.id];
  return Array.isArray(own) ? [...own.filter(key => group.items.includes(key)), ...group.items.filter(key => !own.includes(key))] : [...group.items];
}

/** The groups as the person ordered them; unknown buttons go to «Otros»; Inicio always first (v2.337.0). */
export function menuGroups(): MenuGroup[] {
  const prefs = menuPrefs(), known = new Set([...MENU_GROUPS.flatMap(group => group.items), ...MENU_FIXED.items]);
  const groups = MENU_GROUPS.map(group => ({ id: group.id, t: group.t, items: orderedItems(group, prefs) }));
  const order = Array.isArray(prefs.orden) ? prefs.orden : [];
  groups.sort((first, second) => ((order.indexOf(first.id) + 1) || LAST) - ((order.indexOf(second.id) + 1) || LAST));
  const others = [...document.querySelectorAll<HTMLElement>('#nav button[data-t]')].map(button => button.dataset.t ?? '').filter(key => !known.has(key));
  if (others.length) groups.push({ id: 'otros', t: t('navigationCore.menu.others'), items: others });
  groups.forEach(group => { group.items = group.items.filter(key => key !== 'inicio'); });
  if (groups.length && known.has('inicio')) groups[0]?.items.unshift('inicio');
  return groups;
}

/** The name of a section on hover when the bar is folded. */
export function menuTip(button: HTMLElement | null): void {
  let tip = document.getElementById('mltip');
  if (!button || !document.body.classList.contains('menupleg') || !document.body.classList.contains('menulat')) { tip?.classList.remove('ver'); return; }
  if (!tip) { document.body.insertAdjacentHTML('beforeend', '<div id="mltip" role="tooltip"></div>'); tip = document.getElementById('mltip'); }
  if (!tip) return;
  const rect = button.getBoundingClientRect();
  tip.textContent = button.dataset.tip ?? ''; tip.style.top = `${rect.top + rect.height / 2}px`; tip.style.left = `${rect.right + TIP_GAP}px`; tip.classList.add('ver');
}

function renameButton(button: HTMLElement, names: Record<string, string>): void {
  const key = button.dataset.t ?? button.dataset.bm; if (!key || key === 'directorio' || key.startsWith('pd-')) return;
  const text = legacyFreeCoreSettings.menuLabelText(button); if (!text) return;
  if (!button.dataset.txdef) button.dataset.txdef = text.get();
  const name = orFallback(names[key], button.dataset.txdef);
  if (text.get() !== name) text.set(name);
}

/** The names the company gives to each screen, in the menus and in the title of the open screen. */
export function applyMenuNames(): void {
  const names = menuNames();
  document.querySelectorAll<HTMLElement>('nav.main [data-t], #bnav [data-t], .bmasgrid [data-bm]').forEach(button => { renameButton(button, names); });
  renameTitle(names);
}

/** The title of the open screen, if it still says the default name or another company name. */
function titleText(screen: string): ChildNode | undefined {
  const title = document.querySelector(`#v-${screen} .saludo h1, #v-${screen} .pagcab h1`) ?? (screen === 'ventas' ? document.querySelector('#v-ventas .saludo h1') : null);
  return title ? [...title.childNodes].find(child => child.nodeType === Node.TEXT_NODE && (child.nodeValue ?? '').trim()) : undefined;
}

/** The default name of a screen in the menu (none for the directory, whose name is the company word). */
const originalName = (screen: string): string | undefined =>
  (screen && screen !== 'directorio' ? document.querySelector<HTMLElement>(`nav.main [data-t="${screen}"]`)?.dataset.txdef : undefined);

function renameTitle(names: Record<string, string>): void {
  const screen = navigationStore.screen, original = originalName(screen); if (!original) return;
  const node = titleText(screen), current = node?.nodeValue?.trim() ?? '', name = orFallback(names[screen], original);
  const known = current === original || Object.values(names).includes(current);
  if (node && known && current !== name) node.nodeValue = (node.nodeValue ?? '').replace(current, name);
}

/** The fixed order of the main buttons; Calidad del dato out of the menu; «Directorio» says the company's word. */
export function orderMenu(): void {
  const nav = document.querySelector('nav.main .in') ?? document.querySelector('nav.main'); if (!nav) return;
  MENU_ORDER.forEach(key => { const button = nav.querySelector(`:scope > [data-t="${key}"]`); if (button) nav.appendChild(button); });
  nav.querySelector('[data-t="seguimiento"]')?.classList.add('hide', 'fuera');
  const directory = nav.querySelector('[data-t="directorio"]');
  if (directory) [...directory.childNodes].forEach(node => { if (node.nodeType === Node.TEXT_NODE && (node.nodeValue ?? '').includes('Directorio')) node.nodeValue = (node.nodeValue ?? '').replace('Directorio', legacyFreeCoreServices.vocabulary.wordFor('medico', 'p', { determiner: '', determinerCase: 'l', nounCase: 'C' })); });
}

const LOCK = '<span class="cand">🔒</span>';

/** Sections out of the plan: locked, with a padlock in the menu. */
export function lockSections(): void {
  Object.keys(PLAN_SECCIONES).forEach(key => { document.querySelectorAll(`nav.main [data-t="${key}"], .bmasgrid [data-bm="${key}"]`).forEach(button => { lockButton(button, key); }); });
}

function lockButton(button: Element, key: string): void {
  const locked = !legacyFreeCoreServices.plans.planIncludesSection(key), lock = button.querySelector('.cand');
  button.classList.toggle('bloq', locked);
  if (locked && !lock && button.matches('nav.main [data-t]')) button.insertAdjacentHTML('beforeend', LOCK);
  if (!locked && lock) lock.remove();
}

/** Modules out of the plan stay in the menu, locked (step 1 of applying permissions). */
export function lockModules(): void {
  document.querySelectorAll<HTMLElement>('nav.main [data-t]').forEach(button => {
    const key = button.dataset.t ?? ''; if (!(key in MODULO_AREA)) return;
    const locked = puedeModuloV2400(key) && !legacyFreeCoreServices.plans.planIncludes(key);
    button.classList.toggle('bloq', locked);
    if (locked) { button.classList.remove('hide'); if (!button.querySelector('.cand')) button.insertAdjacentHTML('beforeend', LOCK); }
    else button.querySelector('.cand')?.remove();
  });
}

/** Step 3 of applying permissions: the order, and Calidad del dato hidden. */
export function orderAfterPermissions(): void {
  orderMenu(); document.querySelector('nav.main [data-t="seguimiento"]')?.classList.add('hide');
}

/** The base of applying permissions: each module button shown only to who can use it. */
export function showAllowedModules(): void {
  document.querySelectorAll<HTMLElement>('nav.main [data-t]').forEach(button => { if ((button.dataset.t ?? '') in MODULO_AREA) button.classList.toggle('hide', !legacyFreeCoreServices.permissions.canUseModule(button.dataset.t ?? '')); });
  legacyFreeCoreLayers.paintBottomBar([]);
}

function placePageButton(nav: Element, key: string, text: string, shown: boolean): void {
  let button = nav.querySelector(`[data-t="${key}"]`);
  if (!button && shown) { nav.insertAdjacentHTML('beforeend', `<button data-t="${key}">${text}</button>`); button = nav.querySelector(`[data-t="${key}"]`); }
  if (!button) return;
  button.classList.toggle('hide', !shown);
  // v2.132.0: if it is already in its block of the side menu, it stays
  if (!button.closest('.mlbs') && button !== nav.lastElementChild) nav.appendChild(button);
}

/** «Usuarios» (who administers; v2.267.0: no longer «Usuarios y roles») and «Panel delcos» (who manages the platform). */
export function pageButtons(): void {
  const nav = document.querySelector('nav.main .in');
  if (nav && !ES_MEDICO()) {
    placePageButton(nav, 'usuarios', t('navigationCore.menu.usersAndRoles'), legacyFreeCoreServices.permissions.can('administrar'));
    placePageButton(nav, 'delcos', t('navigationCore.menu.platformPanel'), legacyFreeCoreServices.permissions.can('gestionar_plataforma'));
  }
  const users = document.querySelector<HTMLElement>('nav.main [data-t="usuarios"]'); if (!users) return;
  const text = legacyFreeCoreSettings.menuLabelText(users), label = t('navigationCore.menu.users');
  if (text && /roles/i.test(text.get())) text.set(label); else if (!text && /roles/i.test(users.textContent ?? '')) users.textContent = label;
  if (users.dataset.txdef) users.dataset.txdef = label;
}
