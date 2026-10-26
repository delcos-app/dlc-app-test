/**
 * The menu button of the screen on view carries aria-current="page" (v2.438.0). It used aria-selected, which is only valid on tabs:
 * screen readers ignored it and axe counted it on every screen. The look follows: the contract and the legacy rules mark both.
 */
export function markCurrent(button: Element, current: boolean): void {
  if (current) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
}
