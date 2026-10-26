import { sessionStore } from '../session-store';
import { navigationStore } from '../navigation/store';
import { settingsStore } from '../../screens/settings/store';
/**
 * Keyboard: ↑ ↓ and Enter in the search suggestions (the mouse moves the mark too), and F5 / Ctrl+R remembers the screen to come back to
 * it (Ctrl+F5 and Shift start again). Folded from legado 071 (v2.425.0).
 */

const clearMark = (list: Element): void => { list.querySelectorAll('.activo').forEach(item => { item.classList.remove('activo'); item.removeAttribute('aria-selected'); }); };

const isListKey = (event: KeyboardEvent): boolean =>
  ['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key) && !event.altKey && !event.ctrlKey && !event.metaKey && esBuscador(event.target);

function moveMark(event: KeyboardEvent): void {
  if (!isListKey(event)) return;
  const list = teclaLista(event.target); if (!list) return;
  const items = teclaItems(list); if (!items.length) return;
  let index = items.findIndex(item => item.classList.contains('activo'));
  if (event.key === 'Enter') {
    const marked = items[index]; if (!marked) return;
    event.preventDefault(); event.stopImmediatePropagation(); teclaActivar(marked); return;
  }
  event.preventDefault();
  items.forEach(item => { item.classList.remove('activo'); item.removeAttribute('aria-selected'); });
  index = event.key === 'ArrowDown' ? (index + 1) % items.length : (index <= 0 ? items.length - 1 : index - 1);
  const next = items[index]; if (!next) return;
  next.classList.add('activo'); next.setAttribute('aria-selected', 'true'); next.scrollIntoView({ block: 'nearest' });
}

/** v2.101.0: ↑ ↓ and Enter in the search suggestions. */
export function navigateSuggestions(): void {
  document.addEventListener('keydown', moveMark, true);
  // Writing again removes the mark (the results change); with the mouse, the mark follows the pointer
  document.addEventListener('input', event => {
    if (!esBuscador(event.target)) return;
    const list = teclaLista(event.target); if (list) clearMark(list);
  }, true);
  document.addEventListener('mouseover', event => {
    const list = event.target instanceof Element ? event.target.closest('.gsug, .cpres') : null; if (!list) return;
    const item = teclaItems(list).find(candidate => candidate.contains(event.target as Node));
    if (!item || item.classList.contains('activo')) return;
    clearMark(list);
    item.classList.add('activo');
  });
}

/** F5 or Ctrl+R remembers where you are; a full reload (Ctrl+F5, Shift) or no session forgets it. The browser does the reload. */
export function rememberScreenOnReload(): void {
  document.addEventListener('keydown', event => {
    const f5 = event.key === 'F5', reload = (event.ctrlKey || event.metaKey) && (event.key === 'r' || event.key === 'R');
    if (!f5 && !reload) return;
    const full = f5 ? event.ctrlKey || event.shiftKey : event.shiftKey;
    try {
      if (full || !sessionStore.profile) sessionStorage.removeItem('dlc-f5');
      else sessionStorage.setItem('dlc-f5', JSON.stringify({ t: navigationStore.screen, c: settingsStore.section, s: settingsStore.subsection, p: navigationStore.pageTabs, h: Date.now() }));
    } catch { /* private mode: nothing is remembered */ }
  });
}
