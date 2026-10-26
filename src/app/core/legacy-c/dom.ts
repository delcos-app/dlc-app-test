import { navigationStore } from '../navigation/store';
import { sessionStore } from '../session-store';
/** Small DOM helpers of the folded legacy layers 050–079 (v2.425.0). */

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- the caller names the element type, as with querySelector<T>()
export const byId = <T extends HTMLElement = HTMLElement>(id: string): T | null => document.getElementById(id) as T | null;

/** The closest element to an event target matching `selector` (null when the target is not an element). */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- the caller names the element type, as with closest<T>()
export const closestTo = <T extends Element = HTMLElement>(target: EventTarget | null, selector: string): T | null =>
  (target instanceof Element ? target.closest<T>(selector) : null);

/** Watches `target` when it exists (the legacy layers threw when it was missing). */
export function observe(target: Node | null | undefined, callback: MutationCallback, options: MutationObserverInit): void {
  if (target) new MutationObserver(callback).observe(target, options);
}

/** Runs `paint` once per batch of DOM changes under <main> (the legacy «…_PEND» flags with queueMicrotask). */
export function onMainChanges(paint: () => void): void {
  let pending = false;
  observe(document.querySelector('main'), () => {
    if (pending) return; pending = true;
    queueMicrotask(() => { pending = false; paint(); });
  }, { childList: true, subtree: true });
}

/** Every element node added in a batch of mutations. */
export const addedElements = (mutations: readonly MutationRecord[]): Element[] =>
  mutations.flatMap(mutation => [...mutation.addedNodes].filter((node): node is Element => node.nodeType === Node.ELEMENT_NODE));

/** The element itself when it matches, plus its descendants that match. */
export const matchingIn = <T extends Element = HTMLElement>(node: Element, selector: string): T[] =>
  [...(node.matches(selector) ? [node as T] : []), ...node.querySelectorAll<T>(selector)];

/** The section of the current screen (#v-<screen>). */
export const currentSection = (): HTMLElement | null => byId(`v-${navigationStore.screen}`);

/** Waits until there is a session (PERFIL and RPC_ORIG ready), checking every `everyMs`, at most `times` times. */
export function whenSignedIn(then: () => void, everyMs: number, times: number): void {
  let tries = 0;
  const timer = setInterval(() => {
    if (signedIn()) { clearInterval(timer); then(); } else if (++tries > times) clearInterval(timer);
  }, everyMs);
}

export const signedIn = (): boolean =>
  Boolean(sessionStore.profile) && !document.body.classList.contains('sin-sesion') && typeof RPC_ORIG === 'function';
