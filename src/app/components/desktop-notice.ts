/**
 * Aviso «Solo ordenador» (contract component `aviso-ordenador`, D-050, v2.473.0): what the phone shows in place of a screen, tab,
 * Configuración entry or window that is used on the computer (docs/movil_alcance.md, M1 A). Centred in the place of the content:
 * the screen icon, «Esta pantalla se usa en el ordenador», one line with the reason of that place and «‹ Volver»; when the screen has
 * a part that is on the phone, a link «Ir a …» as well. It is the body of an empty state, not a sentence under a title.
 */
import { t, type MessageKey } from '../i18n';
import { escapeHtml } from '../services/format';
import { desktopReason } from '../core/mobile/levels';

const MONITOR = '<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>';

export interface DesktopNoticeOptions {
  /** The place: «screen», «screen/tab», a settings key or a window key (its reason comes from core/mobile/levels). */
  place: string;
  back: () => void;
  /** The part of the same screen that is on the phone, if any. */
  goTo?: { label: string; open: () => void };
}

/** The reason line of a place, in words. */
export const desktopReasonText = (place: string): string => t(`mobile.desktopOnly.reasons.${desktopReason(place)}` as MessageKey);

export function desktopNoticeHtml(place: string, goToLabel?: string): string {
  const goTo = goToLabel ? `<button type="button" class="lnk" data-desktop-go>${escapeHtml(t('mobile.desktopOnly.goTo', { place: goToLabel }))}</button>` : '';
  return `<div class="aviso-ordenador" role="status" data-desktop-notice="${escapeHtml(place)}">
    <span class="avoico">${MONITOR}</span>
    <h2 class="avotit">${t('mobile.desktopOnly.title')}</h2>
    <p class="avomot">${escapeHtml(desktopReasonText(place))}</p>
    <div class="avoacts"><button type="button" class="btn sec" data-desktop-back><b aria-hidden="true">‹</b> ${t('mobile.desktopOnly.back')}</button>${goTo}</div></div>`;
}

/** Paints the notice in `box` (its whole content) and binds «Volver» and «Ir a …». */
export function paintDesktopNotice(box: Element, options: DesktopNoticeOptions): void {
  box.innerHTML = desktopNoticeHtml(options.place, options.goTo?.label);
  const back = box.querySelector<HTMLElement>('[data-desktop-back]'); if (back) back.onclick = (): void => { options.back(); };
  const go = box.querySelector<HTMLElement>('[data-desktop-go]'); if (go && options.goTo) go.onclick = options.goTo.open;
}
