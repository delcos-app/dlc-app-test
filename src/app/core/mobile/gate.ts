/**
 * The one gate of the phone levels (v2.473.0, docs/movil_alcance.md «Mecanismo»): every way into a screen asks here. The navigation
 * (`ir()`, a step of core/navigation), the page tabs (`loadPage()`), the Configuración entries (its page painter) and the windows
 * that only open on the computer. «Phone» is the width of M2 A (as before: up to 760 px; a phone on its side and tablets are
 * the computer). No screen looks at the width on its own for this.
 */
import { mobileLevel, settingsLevel, WINDOW_MOBILE, type MobileLevel } from './levels';
import { navigationStore } from '../navigation/store';
import { navigate } from '../navigation';
import { paintDesktopNotice, type DesktopNoticeOptions } from '../../components/desktop-notice';

/** M2 A: the phone is up to 760 px wide (the same query as the rest of the phone layout). */
export const PHONE_QUERY = '(max-width: 760px)';
export const isPhone = (): boolean => matchMedia(PHONE_QUERY).matches;

/** The level that applies now: on the computer, always `full`. */
export const levelNow = (screen: string, tab?: string | null): MobileLevel => (isPhone() ? mobileLevel(screen, tab) : 'full');
/** A screen (or its tab) that the phone does not paint. */
export const blockedOnPhone = (screen: string, tab?: string | null): boolean => levelNow(screen, tab) === 'desktop';
/** A Configuración entry or part that the phone does not paint (nor lists in the index). */
export const settingsBlockedOnPhone = (key: string): boolean => isPhone() && settingsLevel(key) === 'desktop';

/** «‹ Volver» of the notice: the screen it came from, if that one opens on the phone; Inicio otherwise (Mis datos in platform mode). */
export function backFromNotice(from: string): void {
  const previous = navigationStore.previousScreen;
  // In platform mode everything else leads back to the panel: Mis datos is the way out
  const target = !navigationStore.platformMode && previous && previous !== from && !blockedOnPhone(previous) ? previous : navigationStore.platformMode ? 'perfil' : 'inicio';
  navigate(target);
  // Configuración reopens on its last entry, which may be «Solo ordenador» too: then it lands on its index
  const toIndex = (): void => { if (navigationStore.screen === 'config' && document.querySelector('#cfgcuerpo > .aviso-ordenador')) document.getElementById('cfuvolver')?.click(); };
  toIndex(); setTimeout(toIndex, INDEX_CHECK_MS);
}

/** Configuración may paint a moment after the navigation (its parts load on first use). */
const INDEX_CHECK_MS = 400;

/** Paints the notice of a screen (or tab) in `box`, with «Volver» to where it came from. */
export function paintScreenNotice(box: Element, place: string, goTo?: DesktopNoticeOptions['goTo']): void {
  const screen = place.split('/')[0] ?? place;
  paintDesktopNotice(box, { place, back: () => { backFromNotice(screen); }, ...(goTo ? { goTo } : {}) });
}

/**
 * A window that only opens on the computer: on the phone it shows the notice as a sheet over what is open (D-045) and says so,
 * so its opener stops. `key` is one of WINDOW_MOBILE.
 */
export function windowBlockedOnPhone(key: string): boolean {
  if (!isPhone() || WINDOW_MOBILE[key] !== 'desktop') return false;
  const sheet = document.getElementById('mini') as HTMLDialogElement | null; if (!sheet) return true;
  sheet.innerHTML = '<div class="fbox"></div>';
  const box = sheet.querySelector('.fbox');
  if (box) paintDesktopNotice(box, { place: key, back: () => { sheet.close(); } });
  sheet.onclick = (event): void => { if (event.target === sheet) sheet.close(); };
  sheet.oncancel = null;
  if (!sheet.open) sheet.showModal();
  return true;
}

/** When the window crosses the phone width, a screen showing the notice (or hiding one) is opened again with the level of now. */
export function reopenOnWidthChange(): void {
  matchMedia(PHONE_QUERY).addEventListener('change', () => {
    const section = document.getElementById(`v-${navigationStore.screen}`);
    const notice = section?.querySelector('.aviso-ordenador');
    if (notice || blockedOnPhone(navigationStore.screen)) navigate(navigationStore.screen);
  });
}

/** A window of a «Solo consulta» screen on the phone opens in reading: its fields locked (its «Guardar» is `data-desktop-only`). */
export function readOnlyOnPhone(container: Element, screen: string): void {
  if (levelNow(screen) !== 'read') return;
  container.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea').forEach(field => { field.disabled = true; });
}
