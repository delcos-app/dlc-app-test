/**
 * The phone menu: the bottom bar (up to 4, Inicio always first), «Más» with the rest in the person's order (out-of-plan sections
 * removed, the open one marked), the header of a screen on the phone (the main «+» as a floating button) and back on desktop, and
 * the measured height of the bottom bar. Migrated from the legacy movNombre, movDisponibles, movOrden, movBarra, movMasOrden,
 * tabDelMenu, abrirMasMovil and abrirMasMovilBase2–5, ordenarCabeceraMovil, medirBnav and fabAOrdenador (v2.426.0).
 */
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { orFallback } from '../../../services/values';
import { menuGroups, menuPrefs } from './groups';
import { navigationStore } from '../store';

/** The screens that never go in the phone menu (v2.335.0: Usuarios is in Configuración). */
export const MENU_OUT = ['usuarios'];
export const BAR_DEFAULT = ['inicio', 'agenda', 'rutas', 'directorio'];
/** The section the phone menu marks, not the page that holds it */
const SUBSECTION_MENU: Readonly<Record<string, string>> = { llamadas: 'oportunidades', compras: 'compras', proveedores: 'proveedores' };
const BAR_SIZE = 4, CLOSE_MS = 180, UNKNOWN = 999, NEW_AFTER = 900;

/** The screen the menus mark (Oportunidades, Compras and Proveedores mark themselves, not Pedidos). */
export const menuTab = (): string => (navigationStore.screen === 'ventas' && SUBSECTION_MENU[pedsecVista()] ? SUBSECTION_MENU[pedsecVista()] ?? navigationStore.screen : navigationStore.screen);

/** The name of a screen in the menu (without «Pronto»). */
export function mobileName(key: string): string {
  const button = document.querySelector(`nav.main [data-t="${key}"]`); if (!button) return key;
  const text = txTexto(button);
  return orFallback(text?.get(), orFallback(button.textContent, '')).replace('Pronto', '').trim();
}

/** Like the desktop menu: Tu día, Cartera, Ventas… */
function menuPosition(key: string): number {
  let keys: string[] = [];
  try { keys = menuGroups().flatMap(group => group.items); } catch { /* unknown position */ }
  const index = keys.indexOf(key); return index < 0 ? UNKNOWN : index;
}

/** The screens the person can open from the phone menu. */
export function availableScreens(): string[] {
  const seen = new Set<string>();
  return [...document.querySelectorAll<HTMLButtonElement>('nav.main [data-t]')].filter(button => {
    const key = button.dataset.t ?? '';
    if (seen.has(key) || button.classList.contains('hide') || button.disabled || button.classList.contains('bloq') || button.classList.contains('mlplan') || MENU_OUT.includes(key)) return false;
    seen.add(key); return true;
  }).map(button => button.dataset.t ?? '').sort((first, second) => menuPosition(first) - menuPosition(second));
}

/** The bottom bar: the chosen ones (up to 4) with Inicio first (v2.337.0). */
export function bottomBar(): string[] {
  const available = availableScreens(), chosen = menuPrefs().barra;
  let bar = (Array.isArray(chosen) && chosen.length ? chosen : BAR_DEFAULT).filter(key => available.includes(key) && key !== 'inicio');
  if (available.includes('inicio')) bar.unshift('inicio');
  bar = bar.slice(0, BAR_SIZE);
  return bar.length ? bar : BAR_DEFAULT.filter(key => available.includes(key));
}

/** The order of «Más»: the person's, and behind it the new ones in the menu order. */
export function moreOrder(keys: readonly string[]): string[] {
  const own = menuPrefs().mas ?? [];
  const position = (key: string): number => { const index = own.indexOf(key); return index < 0 ? NEW_AFTER + menuPosition(key) : index; };
  return [...keys].sort((first, second) => position(first) - position(second));
}

function lockOutOfPlan(sheet: HTMLElement): void {
  const close = (): void => { sheet.classList.add('hide'); document.body.classList.remove('masabierto'); };
  sheet.querySelectorAll<HTMLElement>('[data-bm]').forEach(button => {
    const key = button.dataset.bm ?? '';
    if (planIncluye(key) && planIncluyeSeccion(key)) return;
    button.classList.add('bloq'); button.onclick = (): void => { close(); avisoPlan(key); };
  });
  // Locked ones are removed from «Más»
  sheet.querySelectorAll('.bmasgrid [data-bm].bloq').forEach(button => { button.remove(); });
}

function fillMore(sheet: HTMLElement, grid: Element): void {
  const bar = bottomBar(), hidden = menuPrefs().ocultos ?? [];
  const wanted = moreOrder(availableScreens().filter(key => !bar.includes(key) && !hidden.includes(key)));
  const close = (): void => { sheet.classList.remove('abierto'); setTimeout(() => { sheet.classList.add('hide'); }, CLOSE_MS); };
  grid.querySelectorAll<HTMLElement>('[data-bm]').forEach(button => { if (!wanted.includes(button.dataset.bm ?? '')) button.remove(); });
  wanted.forEach(key => {
    if (grid.querySelector(`[data-bm="${key}"]`)) return;
    grid.insertAdjacentHTML('beforeend', `<button data-bm="${key}" class="${menuTab() === key ? 'on' : ''}"><span>${ICO_MOD[key] ?? '•'}</span>${escapeHtml(mobileName(key))}</button>`);
    const added = grid.querySelector<HTMLElement>(`[data-bm="${key}"]`); if (added) added.onclick = (): void => { close(); ir(key); };
  });
  wanted.forEach(key => { const button = grid.querySelector(`[data-bm="${key}"]`); if (button) grid.appendChild(button); });   // in the chosen order
  if (!sheet.querySelector('#bmaspers')) {
    grid.insertAdjacentHTML('afterend', `<div class="acts bmaspers"><button type="button" class="btn sec chico" id="bmaspers">${t('navigationCore.menu.customise')}</button></div>`);
    const customise = document.getElementById('bmaspers'); if (customise) customise.onclick = (): void => { close(); void openMobileCustomise(); };
  }
}

let openMobileCustomise: () => unknown = () => undefined;
/** The customise window is passed in by the index (it imports this module). */
export function setMobileCustomise(open: () => unknown): void { openMobileCustomise = open; }

/** Opens «Más» on the phone. */
export function openMoreMenu(): void {
  abrirMasMovilBase();
  const sheet = document.getElementById('bmas'); if (!sheet) return;
  sheet.querySelectorAll('.bmasbox > .sm').forEach(note => { note.remove(); });
  lockOutOfPlan(sheet);
  document.body.classList.add('masabierto');
  const observer = new MutationObserver(() => { if (sheet.classList.contains('hide')) { document.body.classList.remove('masabierto'); observer.disconnect(); } });
  observer.observe(sheet, { attributes: true, attributeFilter: ['class'] });
  const current = menuTab();
  sheet.querySelectorAll('[data-bm]').forEach(button => { const on = (button as HTMLElement).dataset.bm === current; if (button.classList.contains('on') !== on) button.classList.toggle('on', on); });
  const grid = sheet.querySelector('.bmasgrid'); if (grid) fillMore(sheet, grid);
}

/** On the phone, the main «+ …» of a screen becomes a floating button and the rest a row of compact controls. */
export function mobileHeader(section: HTMLElement | null): void {
  if (!ES_MOVIL() || !section) return;
  const header = section.querySelector<HTMLElement>(':scope > .saludo'); if (!header || header.dataset.movil) return;
  const actions = header.querySelector('.acts'); if (!actions) return;
  header.dataset.movil = '1';
  const main = [...actions.children].find(child => child.tagName === 'BUTTON' && !child.classList.contains('sec') && /^\s*\+/.test(child.textContent ?? '')) as HTMLElement | undefined;
  if (main) {
    const label = (main.textContent ?? '').replace('+', '').trim();
    main.classList.add('fab'); main.setAttribute('aria-label', label);
    // v2.95.0: the «+» is the library icon, not a character
    main.dataset.txt = label; main.innerHTML = svgIco(ICON_NOM.plus ?? '');
    section.appendChild(main);
  }
  // The row stays even if empty: other parts add controls later (agenda view, team…)
  actions.classList.add('chips'); [...actions.children].forEach(child => { child.classList.add('chip'); });
}

/** --bnavh is the height of the bottom bar, measured (v2.338.0: windows fill the phone screen above it). */
export function measureBottomBar(): void {
  const bar = document.getElementById('bnav'), height = bar && getComputedStyle(bar).display !== 'none' ? Math.round(bar.getBoundingClientRect().height) : 0;
  document.documentElement.style.setProperty('--bnavh', `${height}px`);
}

/** v2.343.0: the floating «+» goes back to the header when the window becomes desktop-wide. */
export function fabToDesktop(): void {
  if (ES_MOVIL()) return;
  document.querySelectorAll<HTMLElement>('main > section .fab[data-txt], main > section .fab[data-plfab], main > section > button[data-plfab], main > section > button[data-txt]').forEach(button => {
    const actions = button.closest('main > section')?.querySelector(':scope > .saludo .acts'); if (!actions) return;
    const text = button.dataset.txt ?? button.getAttribute('aria-label') ?? t('navigationCore.menu.add');
    button.classList.remove('fab', 'plfuera'); delete button.dataset.plfab; delete button.dataset.txt;
    button.innerHTML = `${plIco('plus')} ${escapeHtml(text.replace(/^\s*\+\s*/, ''))}`;
    actions.appendChild(button);
  });
}
