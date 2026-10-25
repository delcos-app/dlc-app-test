/**
 * Phone and connection details from legacy layers: the floating «+» moving away while scrolling (v2.221.0) and coming back round
 * (v2.267.0, v2.342.0), the connection notice saying what could not be sent (v2.259.0), the camera button of batch and serial fields
 * (v2.261.0) and the eye of password fields (v2.279.0). Moved from legado 081, 104, 106, 112, 119 and 156 (v2.424.0); pintarConexion
 * stays as an adapter.
 */
import { deviceLegacy as legacy } from '../../legacy/legado-d-glue-bridge';
import { t } from '../../i18n';

const SCROLL_TOP_PX = 40, SCROLL_STEP_PX = 6, BOTTOM_PX = 8, RESIZE_MS = 120;

/** Legado 081: the «+» moves away scrolling down and comes back scrolling up, at the top or at the end. */
export function installFloatingButton(): void {
  let lastY = scrollY, away = false, pending = false;
  const set = (value: boolean): void => { if (value === away) return; away = value; document.body.classList.toggle('fabfuera', value); };
  addEventListener('scroll', () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      const y = scrollY, step = y - lastY, atEnd = innerHeight + y >= document.documentElement.scrollHeight - BOTTOM_PX;
      if (y < SCROLL_TOP_PX || atEnd) set(false);
      else if (step > SCROLL_STEP_PX) set(true);
      else if (step < -SCROLL_STEP_PX) set(false);
      lastY = y;
    });
  }, { passive: true });
  // Changing screen shows it again (navigation event, src/app/core/navigation)
  document.addEventListener('delcos:navigation-start', () => { set(false); lastY = 0; });
}

/** Legado 112: the round «+» comes back when the phone turns upright. */
export function installRoundAddButton(): void {
  window.addEventListener('resize', () => {
    if (!legacy.isMobile()) return;
    document.querySelectorAll<HTMLElement>('main button[data-txt]:not(.fab)').forEach(button => {
      if (!/^\s*\+/.test(button.textContent ?? '') &&!button.dataset.plfab) return;
      button.classList.add('fab'); button.setAttribute('aria-label', button.dataset.txt ? button.dataset.txt : t('legacyD.device.add')); button.innerHTML = legacy.icon('plus');
    });
  });
}

/** Legado 156: on resize the «+» goes back to a desktop button and the list bar is synced again. */
export function installDesktopAddButton(): void {
  addEventListener('resize', () => {
    // The timer is shared with the menu (FAB_RZ, nucleo/menu.js)
    legacy.debounceAddButton(() => { legacy.addButtonToDesktop(); try { if (legacy.currentScreen()) legacy.syncListBar(legacy.currentScreen()); } catch { /* not a list */ } }, RESIZE_MS);
  });
}

/** pintarConexion: online with changes the server refused, the notice says how many (pressing it shows them). */
export function paintConnection(args: unknown[]): unknown {
  const result = legacy.basePaintConnection(args);
  const notice = document.getElementById('conex'), refused = legacy.refusedChanges().length;
  if (notice && navigator.onLine && !legacy.queuedChanges().length && refused) {
    notice.className = 'conex err';
    notice.textContent = t(refused === 1 ? 'legacyD.device.oneUnsent' : 'legacyD.device.unsent', { count: refused });
  }
  return result;
}

async function showRefused(): Promise<void> {
  const refused = legacy.refusedChanges(); if (!refused.length) return;
  const when = (time: number | string | undefined): string => new Date(time ?? 0).toLocaleString(t('dates.locale'), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const lines = refused.map(item => t('legacyD.device.refusedLine', { what: item.etiqueta ? item.etiqueta : item.fn, when: when(item.t ? item.t : item.falla), why: item.motivo ? item.motivo : t('legacyD.device.refused') })).join('\n');
  const choice = await legacy.choose(t('legacyD.device.unsentTitle'), t('legacyD.device.unsentText', { lines }),
    [{ k: 'reint', t: t('legacyD.device.retry') }, { k: 'desc', t: t('legacyD.device.discard'), cls: 'sec' }, { k: 'nada', t: t('common.close'), cls: 'sec' }]);
  if (choice === 'reint') {
    legacy.saveQueue(legacy.queuedChanges().concat(refused.map(item => { const copy = { ...item }; delete copy.motivo; delete copy.falla; return copy; })));
    legacy.forgetRefused(); legacy.paintConnection(); legacy.sendQueue();
  } else if (choice === 'desc' && await legacy.confirm(t('legacyD.device.discardText'), { titulo: t('legacyD.device.discardTitle'), ok: t('legacyD.device.discardOk'), peligro: true })) {
    legacy.forgetRefused(); legacy.paintConnection();
  }
}

/** Legado 104. */
export function installRefusedChanges(): void {
  document.addEventListener('click', event => { if ((event.target as Element).closest('#conex.err')) void showRefused(); });
}

/** Legado 106: batch and serial fields get their camera button; pressing it reads a code into the field. */
export function installScanner(): void {
  new MutationObserver(() => { legacy.addScannerButtonsSoon(); }).observe(document.body, { childList: true, subtree: true });
  document.addEventListener('click', event => {
    const button = (event.target as Element).closest<HTMLElement>('[data-esc]'); if (!button) return;
    event.preventDefault(); event.stopPropagation();
    const input = button.parentNode?.querySelector('input'); if (input) legacy.openScanner(input);
  }, true);
}

/** Legado 119: every password field (also those added later) gets its eye. */
export function installPasswordEyes(): void {
  document.querySelectorAll<HTMLInputElement>('input[type=password]').forEach(input => { legacy.passwordEye(input); });
  new MutationObserver(records => {
    for (const record of records) for (const node of record.addedNodes) {
      if (!(node instanceof Element)) continue;
      if (node.matches('input[type=password]')) legacy.passwordEye(node as HTMLInputElement);
      else node.querySelectorAll<HTMLInputElement>('input[type=password]').forEach(input => { legacy.passwordEye(input); });
    }
  }).observe(document.body, { childList: true, subtree: true });
}
