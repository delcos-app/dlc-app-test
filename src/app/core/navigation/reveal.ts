/**
 * Screens are prepared hidden and shown at once: «steady» (no pending requests and no changes for a moment), the reveal of a screen
 * or window, the frozen copy while a tab changes, the comet line, the short fade on arrival. Migrated from the legacy estable,
 * cambioDeCifra, revelarBase…revelarBase4, revelar, llegar, congelar, cometa, refrescarDebajo and subirAccionPagina (v2.426.0);
 * the names that other code and the tests use stay as adapters.
 */
import { navLegacy } from '../../legacy/nav-bridge';
import { PAGES } from './pages';
import * as legacyFreeScreensHome from '../../screens/home';

const QUIET_MS = 50, CHECK_EVERY_MS = 15, DEFAULT_MAX_MS = 4000, ARRIVAL_MS = 700, CARD_MAX_MS = 5000, LIST_MAX_MS = 6000, MIN_WAIT_MS = 300, RETRY_MS = 60;
/** v2.144.0: the main action of own pages goes up to the header */
const PAGE_ACTIONS = ['usrnuevo', 'orgnueva'];

let revealTurn = 0;
const arrivalTimers = new WeakMap<Element, ReturnType<typeof setTimeout>>();

/** A figure that counts up (only its text changes, and it is numbers) does not mean the screen is still loading (v2.269.0). */
function isCountChange(mutation: MutationRecord): boolean {
  if (mutation.type !== 'childList') return false;
  const nodes = [...mutation.addedNodes, ...mutation.removedNodes];
  return nodes.length > 0 && nodes.every(node => node.nodeType === Node.TEXT_NODE) && /^[\d.,\s%€+\-−]*$/.test(mutation.target.textContent ?? '');
}

const hasSkeletons = (element: Element): boolean => Boolean(element.querySelector('.skel, .ksk, .cargandolocal'));

/** «Steady»: no requests started since `since` are pending and nothing changed inside for 50 ms (at most `maxMs`). */
export function steady(element: Element, maxMs = DEFAULT_MAX_MS, since?: number): Promise<void> {
  return new Promise(resolve => {
    // Waits use the browser's internal clock (it always moves forward; the wall clock may jump)
    const startedAt = since && since > 0 ? since : Date.now() - 5, start = performance.now();
    let last = start - 5, done = false;
    // Changes inside the element count (not those of its own class, which are the loading mechanism's)
    const observer = new MutationObserver(list => { if (list.some(mutation => mutation.target !== element && !isCountChange(mutation))) last = performance.now(); });
    observer.observe(element, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
    const finish = (): void => { if (done) return; done = true; observer.disconnect(); resolve(); };
    // A screen already loaded is shown at once
    setTimeout(() => { if (pendientesDesde(startedAt) === 0 && last <= start && !hasSkeletons(element)) finish(); }, 0);
    const timer = setInterval(() => {
      if (done) { clearInterval(timer); return; }
      const now = performance.now();
      if ((pendientesDesde(startedAt) === 0 && now - Math.max(last, RED_ULTIMO_FIN) >= QUIET_MS && !hasSkeletons(element)) || now - start > maxMs) { clearInterval(timer); finish(); }
    }, CHECK_EVERY_MS);
  });
}

/** v2.92.0: a screen just revealed arrives with a short fade (later repaints are not animated). */
export function arrive(element: Element | null): void {
  if (!element?.matches('main > section')) return;
  element.classList.remove('llega'); void (element as HTMLElement).offsetWidth; element.classList.add('llega');
  clearTimeout(arrivalTimers.get(element));
  arrivalTimers.set(element, setTimeout(() => { element.classList.remove('llega'); }, ARRIVAL_MS));
}

const isScreen = (element: Element): boolean => element.matches('main > section');

function revealWhenSteady(element: HTMLElement, maxMs: number | undefined, since: number | undefined): void {
  const turn = ++revealTurn;
  element.classList.add('preparando');
  void steady(element, maxMs, since).then(() => { if (turn === revealTurn || !isScreen(element)) { element.classList.remove('preparando'); arrive(element); } });
}

/** Screens with a template (PL) arrive without a loader on top: their skeleton is seen. */
function revealTemplate(element: HTMLElement, screen: string, maxMs: number | undefined, since: number | undefined): void {
  if (navLegacy.listTemplates()[screen] && isScreen(element)) { element.classList.remove('preparando'); plSync(screen); arrive(element); return; }
  revealWhenSteady(element, maxMs, since);
}

/** Screens that say when they are ready (LISTA_PARA): waits for it, up to their limit. */
function revealWhenReady(element: HTMLElement, screen: string, maxMs: number | undefined, since: number | undefined): void {
  const ready = LISTA_PARA[screen];
  if (!ready || !isScreen(element)) { revealTemplate(element, screen, maxMs, since); return; }
  // Inicio with its skeleton: no loader on top
  if (screen === 'inicio' && !ES_MEDICO()) { legacyFreeScreensHome.renderSkeleton(); element.classList.remove('preparando'); arrive(element); return; }
  const turn = ++revealTurn, start = performance.now(), limit = LISTA_ESPERA[screen] ?? LIST_MAX_MS;
  element.classList.add('preparando');
  const look = (): void => {
    void steady(element, Math.max(MIN_WAIT_MS, limit - (performance.now() - start)), since).then(() => {
      if (turn !== revealTurn) return;
      if (ready(element) || performance.now() - start > limit) { element.classList.remove('preparando'); arrive(element); } else setTimeout(look, RETRY_MS);
    });
  };
  look();
}

/** Shows a screen or window once it is complete. A card waits up to 5 s for all its blocks (v2.256.0). */
export function reveal(element: HTMLElement | null, maxMs?: number, since?: number): void {
  if (!element) return;
  const limit = element.id === 'fbody' ? Math.max(maxMs ?? 0, CARD_MAX_MS) : maxMs, screen = element.id.slice(2);
  const sections = PL_SECC[screen];
  if (!sections || !isScreen(element)) { revealWhenReady(element, screen, limit, since); return; }
  // First arrival of a grid screen: at once, with the loader (the skeleton stays for when it is searched again)
  const startedAt = Date.now(); element.classList.add('preparando');
  // The section may be decided a moment later (when it paints): it is looked at again
  setTimeout(() => {
    if (plCfg(screen)) plSync(screen);
    // While the usual reveal runs, this screen is not treated as a template
    const lists = navLegacy.listTemplates(), keep = lists[screen];
    Reflect.deleteProperty(lists, screen);
    try { revealWhenReady(element, screen, limit, since && since > 0 ? since : startedAt); } finally { lists[screen] = keep; }
  }, 0);
}

/** The light line that crosses the top when changing screen (v2.267.0). */
export function comet(): void {
  let line = document.getElementById('cometa');
  if (!line) { document.body.insertAdjacentHTML('beforeend', '<div id="cometa" class="cometa" aria-hidden="true"><i></i></div>'); line = document.getElementById('cometa'); }
  if (!line) return;
  line.classList.remove('va'); void line.offsetWidth; line.classList.add('va');
}

/** After a change that other screens show: the screen below is refreshed (or marked, if a window is open). */
export function refreshBelow(): void {
  if (document.querySelector('dialog[open]')) { DATOS_CAMBIADOS = true; return; }
  DATOS_CAMBIADOS = false;
  if (TAB === 'agenda' && document.getElementById('agcuerpo')) navLegacy.refreshAgenda();
  else if (TAB === 'directorio') void buscar(true);
}

/** The main action of own pages («+ Nuevo usuario», «+ Nueva organización») goes to the right of the header. */
export function raisePageAction(): void {
  if (!PAGES[TAB]) return;
  const section = document.getElementById(`v-${TAB}`), header = section?.querySelector(':scope > .saludo');
  if (!section || !header) return;
  PAGE_ACTIONS.forEach(id => {
    const button = document.getElementById(id); if (!button || !section.contains(button) || button.closest('.saludo')) return;
    let actions = header.querySelector(':scope > .acts');
    if (!actions) { header.insertAdjacentHTML('beforeend', '<div class="acts htacts"></div>'); actions = header.querySelector(':scope > .acts'); }
    actions?.appendChild(button);
  });
}
