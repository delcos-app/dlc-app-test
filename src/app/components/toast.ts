/**
 * The corner notice (toast) and the small notices of a screen: offline data and the start point not set yet. Migrated from
 * componentes/aviso.js (v2.416.0); toast, subirAviso, avisoCache and avisoSinSalida stay as adapters.
 */
import { componentsLegacy } from '../legacy/components-bridge';
import { term } from '../legacy/bridge';
import { t } from '../i18n';

const SHOWN_MS = 3200, LEAVE_MS = 260;
let timer: ReturnType<typeof setTimeout> | undefined;

/** Shows the notice above every window: modal windows live in the browser's top layer, so it opens there too, after them. */
function onTop(notice: HTMLElement): void {
  if (typeof notice.showPopover !== 'function') return;
  try {
    if (!notice.hasAttribute('popover')) notice.setAttribute('popover', 'manual');
    if (notice.matches(':popover-open')) notice.hidePopover();
    notice.showPopover();
  } catch { /* without popovers it shows in the page */ }
}

/**
 * The corner notice: it slides in even when it replaces one still shown (a new node repeats the entrance), fades out after 3.2 s,
 * and in read-only mode (company with the payment pending) an error explains that reason.
 */
export function toast(message: string, isError = false): void {
  const text = isError && componentsLegacy.readOnlyCompany() ? t('components.notices.readOnly') : message;
  const current = document.getElementById('toast');
  if (!current) return;
  const notice = current.cloneNode(true) as HTMLElement; current.replaceWith(notice);
  notice.textContent = text; notice.className = `toast${isError ? ' err' : ''}`;
  clearTimeout(timer);
  timer = setTimeout(() => { notice.classList.add('sale'); timer = setTimeout(() => { notice.classList.add('hide'); notice.classList.remove('sale'); }, LEAVE_MS); }, SHOWN_MS);
  onTop(notice);
}

/** When a window opens with the notice still shown, the notice goes back on top. */
export function raiseNotice(): void {
  const notice = document.getElementById('toast');
  if (!notice || notice.classList.contains('hide') || typeof notice.showPopover !== 'function' || !notice.hasAttribute('popover')) return;
  try { if (notice.matches(':popover-open')) notice.hidePopover(); notice.showPopover(); } catch { /* stays where it is */ }
}

/** «Sin conexión · datos guardados el …» on top of a screen painted from the offline copy. */
export function cacheNotice(element: Element | null, date?: string | null): void {
  if (!element) return;
  const when = date ? t('components.notices.savedOn', { date: new Date(date).toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }) : '';
  element.insertAdjacentHTML('afterbegin', `<div class="cacheaviso">${t('components.notices.offline')}
    ${when}</div>`);
}

/** The Agenda's notice while the start point is not set: hours are counted from the first visit. */
export function noStartNotice(element: Element | null): void {
  if (componentsLegacy.hasStartPoint() || !element || element.querySelector('.sinsalida')) return;
  element.insertAdjacentHTML('afterbegin', `<div class="avisoh sinsalida"><span>📍 <b>${t('components.notices.noStartTitle')}</b> ${t('components.notices.noStartText', { firstVisit: term('visita', { article: 'primer' }) })}</span>
    <button class="btn sec chico" data-irprefs>${t('components.notices.noStartButton')}</button></div>`);
}
