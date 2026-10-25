/** The element matching `selector` from an event target, or null if the target is not an element (the legacy `e.target.closest && …`). */
export const closestOf = (target: EventTarget | null, selector: string): HTMLElement | null =>
  (target instanceof Element ? target.closest<HTMLElement>(selector) : null);
