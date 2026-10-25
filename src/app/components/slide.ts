/**
 * Slide into place: after a list is painted again, its items glide from where they were to where they are now, and the touched
 * one is highlighted for a moment (class tdmovida). Nothing jumps. Without animation when the person prefers reduced motion.
 */
const HIGHLIGHT_CLASS = 'tdmovida', HIGHLIGHT_MS = 1300, EASING = 'cubic-bezier(.2,.7,.2,1)';

/** Where each item is now (top in pixels), by its key (a data-* attribute). */
export function positionsOf(selector: string, key: string): Map<string, number> {
  const positions = new Map<string, number>();
  document.querySelectorAll<HTMLElement>(selector).forEach(element => { positions.set(element.dataset[key] ?? '', element.getBoundingClientRect().top); });
  return positions;
}

function highlight(element: HTMLElement): void {
  element.classList.remove(HIGHLIGHT_CLASS);
  void element.offsetWidth;   // restart the highlight animation
  element.classList.add(HIGHLIGHT_CLASS);
  setTimeout(() => { element.classList.remove(HIGHLIGHT_CLASS); }, HIGHLIGHT_MS);
}

export interface SlideOptions { readonly selector: string; readonly key: string; readonly touched?: string | null | undefined; readonly durationMs: number }

/** Slides the items of `selector` from their `before` positions; highlights the `touched` one. */
export function slideIntoPlace(before: ReadonlyMap<string, number>, options: SlideOptions): void {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll<HTMLElement>(options.selector).forEach(element => {
    const id = element.dataset[options.key] ?? '';
    if (options.touched && id === String(options.touched)) highlight(element);
    const top = before.get(id);
    if (still || top === undefined) return;
    const shift = top - element.getBoundingClientRect().top;
    if (Math.abs(shift) > 1) element.animate([{ transform: `translateY(${shift}px)` }, { transform: 'none' }], { duration: options.durationMs, easing: EASING });
  });
}
