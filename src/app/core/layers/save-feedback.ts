/**
 * v2.308.0 · Saving answers at once (Eric chose B: button and notice together). A button that saves (in a window or a Configuración
 * page) shows «Guardando…» with a spinner at once and takes no second click; it comes back when the app stops talking to the
 * database. The «saved» notice appears the moment the window closes. Moved from legado 132 (v2.424.0); the count of requests in
 * flight (RED_VUELO, RED_ULT) stays in legacy state, other code reads it.
 */
import { saveLegacy } from '../../legacy/legado-d-bridge';
import { t } from '../../i18n';
import { closestOf } from './events';

const OUR_REQUESTS = /\/rest\/v1\/|\/functions\/v1\//;
const POLL_MS = 80, MIN_MS = 350, QUIET_MS = 120, MAX_MS = 30000;

function countRequests(): void {
  const original = window.fetch;
  window.fetch = function (this: unknown, ...args: Parameters<typeof fetch>): Promise<Response> {
    const [input] = args, url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (!OUR_REQUESTS.test(url)) return original.apply(this, args);
    saveLegacy.requestStarted();
    return original.apply(this, args).finally(() => { saveLegacy.requestEnded(); });
  };
}

function showSaving(button: HTMLButtonElement): void {
  const before = button.innerHTML, start = performance.now(), width = button.offsetWidth;
  button.classList.add('guardando'); button.setAttribute('aria-busy', 'true'); button.style.minWidth = `${width}px`;
  const saving = `<span class="bsp" aria-hidden="true"></span>${t('legacyD.saving')}`;
  button.innerHTML = saving;
  const end = (): void => {
    button.classList.remove('guardando'); button.removeAttribute('aria-busy'); button.style.minWidth = '';
    if (button.innerHTML === saving) button.innerHTML = before;   // if the button changed its own text, it is kept
  };
  const check = (): void => {
    if (!button.isConnected || !button.closest('dialog[open], #v-config')) { end(); return; }
    const now = performance.now();
    if ((saveLegacy.inFlight() === 0 && now - start > MIN_MS && now - saveLegacy.lastRequest() > QUIET_MS) || now - start > MAX_MS) { end(); return; }
    setTimeout(check, POLL_MS);
  };
  setTimeout(check, POLL_MS);
}

export function installSaveFeedback(): void {
  countRequests();
  document.addEventListener('click', event => {
    const button = closestOf(event.target, 'button.btn') as HTMLButtonElement | null;
    if (!saveLegacy.isSaveButton(button)) {
      if (button?.classList.contains('guardando')) { event.stopImmediatePropagation(); event.preventDefault(); }
      return;
    }
    if (button) showSaving(button);
  }, true);
  new MutationObserver(records => {
    if (records.some(record => record.target instanceof HTMLDialogElement && record.target.open)) requestAnimationFrame(() => { saveLegacy.raiseNotice(); });
  }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['open'] });
}
