/**
 * What runs before anything else (legado 000 and the top of 001, v2.424.0): the error of an expired activation link, the class
 * list that ignores changes that change nothing, and the session that must not outlive the browser.
 */
import { orFallback } from '../../services/values';

const SESSION_KEY = 'dlc-os-sesion', NOT_REMEMBERED_KEY = 'dlc-no-recordar', ALIVE_COOKIE = /(^|; )dlc-sesion-viva=1/;

/**
 * v2.305.0: when the activation link has expired, Supabase comes back with the error in the address (#error_code=otp_expired or
 * ?error_code=…): it is read before anything else, to warn on the sign-in screen and offer a new link.
 */
export function readLinkError(): string | null {
  try {
    const params = new URLSearchParams(`${location.hash.replace(/^#/, '')}&${location.search.replace(/^\?/, '')}`);
    const error = orFallback(params.get('error_code'), orFallback(params.get('error'), ''));
    return error === '' ? null : error;
  } catch { return null; }
}

/**
 * Adding a class that is already there or removing one that is not does nothing (the browser counted it as a change and woke up the
 * components that watch the screen, which could loop between them).
 */
export function patchClassList(): void {
  // eslint-disable-next-line @typescript-eslint/unbound-method -- the originals are called with apply/call on each list
  const prototype = DOMTokenList.prototype, { add, remove, toggle } = prototype;
  prototype.add = function addIfMissing(this: DOMTokenList, ...tokens: string[]): void {
    if (tokens.every(token => this.contains(token))) return;
    add.apply(this, tokens);
  };
  prototype.remove = function removeIfPresent(this: DOMTokenList, ...tokens: string[]): void {
    if (!tokens.some(token => this.contains(token))) return;
    remove.apply(this, tokens);
  };
  prototype.toggle = function toggleIfNeeded(this: DOMTokenList, token: string, force?: boolean): boolean {
    if (force !== undefined && this.contains(token) === force) return force;
    return force === undefined ? toggle.call(this, token) : toggle.call(this, token, force);
  };
}

/** Kind of link the app was opened with (password recovery, invitation, expired link). */
export const linkKind = {
  invitation: (): boolean => /(^#|&)type=invite(&|$)/.test(location.hash),
  recovery: (): boolean => /(^#|&)type=(recovery|invite)(&|$)/.test(location.hash),
  expired: (): boolean => /(^#|&)error_code=/.test(location.hash) || /(^#|&)error=access_denied/.test(location.hash),
};

/** If «Mantener la sesión iniciada» was unticked, closing the browser asks to sign in again. */
export function forgetUnrememberedSession(): void {
  try { if (localStorage.getItem(NOT_REMEMBERED_KEY) && !ALIVE_COOKIE.test(document.cookie)) localStorage.removeItem(SESSION_KEY); } catch { /* no storage */ }
}

/** A list saved in the device, or an empty one. */
export function storedList(key: string): unknown[] {
  try { return (JSON.parse(localStorage.getItem(key) ?? '[]') as unknown[] | null) ?? []; } catch { return []; }
}

/** An object saved in the device, or an empty one. */
export function storedObject(key: string): Record<string, unknown> {
  try { return (JSON.parse(localStorage.getItem(key) ?? '{}') as Record<string, unknown> | null) ?? {}; } catch { return {}; }
}
