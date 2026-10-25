/**
 * Mobile navigation folded from legado 027, 035 and 037 (v2.424.0): the bottom bar (the four main modules and «Más», or a single
 * «Mi informe»/«Mi centro» in the professional portal), the «Más» sheet with the other modules, and the toolbar of each screen
 * ordered for the phone. The legacy names pintarBnavBase3 and abrirMasMovilBase stay as adapters (legado 150 and the menu use them).
 */
import { legacyBActions, legacyBState } from '../../legacy/legado-b-bridge';
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';

const MAIN_TABS = ['inicio', 'agenda', 'rutas', 'directorio'];
const MAIN_ICONS: Readonly<Record<string, string>> = { inicio: '◉', agenda: '▤', rutas: '➤', directorio: '☰' };
const CLOSE_MS = 180;
/** The view of each module whose toolbar is ordered on the phone. */
const ORDERED_VIEWS: Readonly<Record<string, string>> = { agenda: 'v-agenda', rutas: 'v-rutas', productos: 'v-productos', ventas: 'v-ventas', analitica: 'v-analitica',
  facturacion: 'v-facturacion', config: 'v-config', admin: 'v-admin', pacientes: 'v-pacientes', seguimiento: 'v-seguimiento', duplicados: 'v-duplicados' };

const menuName = (tab: string): string => document.querySelector(`nav.main [data-t="${tab}"]`)?.textContent ?? tab;

function paintPortalBar(bar: HTMLElement): void {
  bar.innerHTML = `<button data-t="informe" aria-selected="true"><span>◉</span>${t(legacyBActions.can('portal_centro') ? 'legacyB.mobile.myCentre' : 'legacyB.mobile.myReport')}</button>`;
  (bar.firstChild as HTMLElement).onclick = (): void => { legacyBActions.goTo('informe'); };
}

/** The bottom bar of the phone. */
export function paintBottomNav(): void {
  const bar = document.getElementById('bnav'); if (!bar) return;
  if (legacyBActions.isProfessionalPortal()) { paintPortalBar(bar); return; }
  const tab = legacyBState.tab();
  bar.innerHTML = MAIN_TABS.map(main => `<button data-t="${main}" aria-selected="${String(tab === main)}"><span>${MAIN_ICONS[main] ?? ''}</span>${escapeHtml(menuName(main) || main)}</button>`).join('')
    + `<button id="bmasbtn" aria-selected="${String(!MAIN_TABS.includes(tab))}"><span>⋯</span>${t('legacyB.mobile.more')}</button>`;
  bar.querySelectorAll<HTMLElement>('[data-t]').forEach(button => { button.onclick = (): void => { legacyBActions.goTo(button.dataset.t ?? ''); }; });
  const more = document.getElementById('bmasbtn'); if (more) more.onclick = (): void => { legacyBActions.openMoreMenu(); };
}

const otherModules = (): [string, string][] => [...document.querySelectorAll<HTMLButtonElement>('nav.main [data-t]')]
  .filter(button => !button.classList.contains('hide') && !button.disabled && !MAIN_TABS.includes(button.dataset.t ?? ''))
  .map(button => [button.dataset.t ?? '', (button.textContent ?? '').replace(t('legacyB.mobile.soon'), '').trim()]);

/** The «Más» sheet: the modules that are not in the bottom bar. */
export function openMoreMenu(): void {
  let sheet = document.getElementById('bmas');
  if (!sheet) { document.body.insertAdjacentHTML('beforeend', '<div id="bmas" class="bmas hide"></div>'); sheet = document.getElementById('bmas'); }
  if (!sheet) return;
  const tab = legacyBState.tab(), box = sheet;
  box.innerHTML = `<div class="bmasbox"><div class="bmasasa" aria-hidden="true"></div>
    <div class="bmasgrid">${otherModules().map(([module, name]) => `<button data-bm="${module}" class="${tab === module ? 'on' : ''}"><span>${legacyBActions.moduleIcon(module) ?? '•'}</span>${escapeHtml(name)}</button>`).join('')}</div>
    <div class="sm" style="text-align:center;margin-top:8px">${t('legacyB.mobile.moreHint')}</div></div>`;
  box.classList.remove('hide');
  requestAnimationFrame(() => { box.classList.add('abierto'); });
  const close = (): void => { box.classList.remove('abierto'); setTimeout(() => { box.classList.add('hide'); }, CLOSE_MS); };
  box.onclick = (event): void => { if (event.target === box) close(); };
  box.querySelectorAll<HTMLElement>('[data-bm]').forEach(button => { button.onclick = (): void => { close(); legacyBActions.goTo(button.dataset.bm ?? ''); }; });
}

/** v2.37.0: on the phone each screen's toolbar is ordered as it changes; back on a wide screen, the floating «+» buttons get their text. */
export function orderMobileToolbars(): void {
  const main = document.querySelector('main');
  if (main) new MutationObserver(() => {
    const view = ORDERED_VIEWS[legacyBState.tab()];
    if (view) legacyBActions.orderMobileHeader(document.getElementById(view));
  }).observe(main, { childList: true, subtree: true });
  window.addEventListener('resize', () => {
    if (legacyBState.isMobile()) return;
    document.querySelectorAll<HTMLElement>('.fab').forEach(button => { button.textContent = `+ ${button.dataset.txt ?? ''}`; button.classList.remove('fab'); });
  });
}
