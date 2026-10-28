/**
 * Changing tab keeps the previous view still until the new one is whole (v2.54.0/v2.61.0); short helps with a link to the manual
 * (v2.61.0) and the help lines added for Clasificadores, the search and the centres in routes (v2.88.0–v2.98.0); the login remembers the
 * e-mail and keeps the session (v2.62.0). Folded from legado 055, 060, 065, 066 and 068 (v2.425.0).
 */
import { t } from '../../i18n';
import { byId, closestTo, observe } from './dom';
import * as legacyFreeCoreLayers from '../layers';
import { navigationStore } from '../navigation/store';
import * as legacyFreeCoreNavigationApi from '../navigation/api';
import { navigate } from '../navigation';

const SUMMARY_CHARS = 320, MAX_ITEMS = 3, FIRST_SENTENCE_CHARS = 200, MANUAL_SEARCH_DELAY_MS = 350, FOCUS_DELAY_MS = 50;

/** v2.54.0: pressing another tab or view of a screen freezes the current one until the new one is ready. */
export function freezeOnTabChange(): void {
  document.addEventListener('click', event => {
    const button = closestTo(event.target, 'main .subnav button, main [data-pedsec], main [data-psec], main [data-fsec], main [data-ansec], main [data-avista], main [data-ag="equipo"]');
    if (!button || button.getAttribute('aria-pressed') === 'true') return;
    legacyFreeCoreNavigationApi.freeze((button.closest('main > section')));
  }, true);
}

/** v2.61.0: the pressed button is known before the click (pointer or keyboard), and the Facturación settings tabs freeze too. */
export function rememberPressedTab(): void {
  document.addEventListener('pointerdown', event => { CLIC_PESTANA = closestTo(event.target, 'button, [data-ag]'); }, true);
  document.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') CLIC_PESTANA = closestTo(event.target, 'button, [data-ag]'); }, true);
  document.addEventListener('click', event => {
    const button = closestTo(event.target, 'main [data-fsub], main [data-faccfg]');
    if (button && button.getAttribute('aria-pressed') !== 'true' && !button.classList.contains('on')) legacyFreeCoreNavigationApi.freeze((button.closest('main > section')));
  }, true);
}

function shortenFirstSentence(popup: HTMLElement): void {
  const walker = document.createTreeWalker(popup, NodeFilter.SHOW_TEXT); let first = true;
  while (walker.nextNode()) {
    const text = walker.currentNode, parent = text.parentElement;
    if (!parent || parent.tagName === 'B' || parent.closest('li')) continue;
    const value = text.nodeValue ?? '';
    if (first && value.length > FIRST_SENTENCE_CHARS) { const cut = value.slice(0, FIRST_SENTENCE_CHARS); text.nodeValue = `${cut.slice(0, Math.max(cut.lastIndexOf('. ') + 1, cut.lastIndexOf(' ')))}…`; }
    first = false;
  }
}

/** A help popup: long ones keep 3 points and their first sentence, and all end with a link to the manual (the legacy resumirAyudaBase). */
export function summariseHelp(popup: HTMLElement): void {
  const items = [...popup.querySelectorAll('li')];
  if ((popup.textContent ?? '').length > SUMMARY_CHARS || items.length > MAX_ITEMS) { items.slice(MAX_ITEMS).forEach(item => { item.remove(); }); shortenFirstSentence(popup); }
  const screen = navigationStore.screen;
  popup.insertAdjacentHTML('beforeend', `<a href="#" class="aiman">${t('legacyC.help.moreInManual')}</a>`);
  const link = popup.querySelector<HTMLAnchorElement>('.aiman');
  if (link) link.onclick = (event): void => {
    event.preventDefault(); popup.remove(); navigate('manual');
    setTimeout(() => {
      const search = byId<HTMLInputElement>('manq'), name = document.querySelector(`nav.main [data-t="${screen}"]`)?.textContent ?? screen;
      if (search) { search.value = name.trim(); search.dispatchEvent(new Event('input', { bubbles: true })); }
    }, MANUAL_SEARCH_DELAY_MS);
  };
}

export function summariseNewHelps(): void {
  observe(document.body, mutations => {
    mutations.forEach(mutation => { mutation.addedNodes.forEach(node => { if (node instanceof HTMLElement && node.classList.contains('aipop')) legacyFreeCoreLayers.summariseHelp(node); }); });
  }, { childList: true });
}

/** v2.62.0: the login remembers the last e-mail and keeps the session on this device unless unchecked. */
export function rememberLogin(): void {
  const email = byId<HTMLInputElement>('lu'), form = byId('lform'); if (!email || !form) return;
  try {
    const last = localStorage.getItem('dlc-ultimo-correo');
    if (last && !email.value) { email.value = last; setTimeout(() => { const password = byId('lp'); if (password && document.activeElement !== email) password.focus(); }, FOCUS_DELAY_MS); }
  } catch { /* private mode */ }
  if (!byId('lrecordar')) byId('lbtn')?.insertAdjacentHTML('beforebegin', `<label class="opt lrecordar"><input type="checkbox" id="lrecordar" ${localStorage.getItem('dlc-no-recordar') ? '' : 'checked'}> ${t('legacyC.login.keepSession')}</label>`);
  form.addEventListener('submit', () => {
    try {
      localStorage.setItem('dlc-ultimo-correo', email.value.trim());
      if (byId<HTMLInputElement>('lrecordar')?.checked) localStorage.removeItem('dlc-no-recordar'); else localStorage.setItem('dlc-no-recordar', '1');
      document.cookie = 'dlc-sesion-viva=1; path=/; SameSite=Lax';   // session cookie: lasts until the browser closes
    } catch { /* private mode */ }
  }, true);
}
