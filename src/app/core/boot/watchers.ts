/**
 * Watchers of the whole page folded from legado 037, 043 and 049 (v2.424.0): only the current module's screen can be shown, new
 * content is translated and gets line icons (in batches, once per microtask), the «Más» menu uses the same icons and the
 * «Cambiar contraseña» entries are removed (the password is changed from the access screen).
 */
import { legacyBActions, legacyBState } from '../../legacy/legado-b-bridge';
import { orFallback } from '../../services/values';

/** Collects added elements (and the parent of added text, or of any other node with `anyNode`) and handles them once per microtask. */
function inBatches(handle: (element: Element) => void, options: { active?: () => boolean; anyNode?: boolean } = {}): void {
  const active = options.active ?? ((): boolean => true);
  const pending = new Set<Element>();
  let queued = false;
  new MutationObserver(mutations => {
    if (!active()) return;
    mutations.forEach(mutation => { mutation.addedNodes.forEach(node => {
      const element = node.nodeType === Node.ELEMENT_NODE ? node as Element : options.anyNode || node.nodeType === Node.TEXT_NODE ? node.parentElement : null;
      if (element) pending.add(element);
    }); });
    if (queued) return;
    queued = true;
    queueMicrotask(() => { queued = false; const list = [...pending]; pending.clear(); list.forEach(element => { if (element.isConnected) handle(element); }); });
  }).observe(document.body, { childList: true, subtree: true });
}

/** v2.37.0: no screen can appear unless it is the current module's. */
export function hideForeignViews(): void {
  const main = document.querySelector('main'); if (!main) return;
  new MutationObserver(mutations => {
    for (const mutation of mutations) {
      const view = mutation.target as HTMLElement;
      if (view.parentElement?.tagName === 'MAIN' && view.id !== `v-${legacyBState.tab()}` && !view.classList.contains('hide')) view.classList.add('hide');
    }
  }).observe(main, { attributes: true, attributeFilter: ['class'], subtree: true });
}

/** v2.43.0: with a language other than Spanish, new content is translated; dates follow the language chosen on the device. */
export function watchTranslations(): void {
  inBatches(element => { legacyBActions.translate(element); }, { active: () => Boolean(legacyBState.i18nMap()) });
  let language = 'es';
  try { language = orFallback(localStorage.getItem('app-idioma'), 'es'); } catch { /* default */ }
  legacyBActions.prepareLanguage(language);
  if (legacyBState.i18nMap()) legacyBActions.translate(document.body);
}

const removePasswordEntries = (): void => { document.querySelectorAll('[data-u="pass"]').forEach(button => { button.remove(); }); };

/** v2.45.5: one-colour line icons everywhere; the «Más» menu uses the same icons; no «Cambiar contraseña» in the menus. */
export function watchIcons(): void {
  inBatches(element => { legacyBActions.iconise(element); }, { anyNode: true });
  legacyBActions.iconise(document.body);
  Object.entries(legacyBState.navIcons()).forEach(([tab, name]) => { legacyBState.setModuleIcon(tab, legacyBActions.iconSvg(name)); });
  legacyBActions.menuIcons();
  new MutationObserver(() => { if (document.querySelector('nav.main [data-t]:not(:has(.navico))')) legacyBActions.menuIcons(); })
    .observe(document.querySelector('nav.main') ?? document.body, { childList: true, subtree: true });
  removePasswordEntries();
  new MutationObserver(removePasswordEntries).observe(document.body, { childList: true, subtree: true });
}
