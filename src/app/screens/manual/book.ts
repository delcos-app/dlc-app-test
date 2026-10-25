/**
 * The «Manual de uso» screen: the book (manual/index.html) inside the app, opened on a chapter, with «‹ Volver a …» to the exact
 * point the user came from. On iPhone and iPad the book opens on its own; the professional portal keeps its own manual.
 * Migrated from the legacy cargarManual (and its layers), abrirManual, guardarVocabManual and volverDelManual (v2.410.0).
 */
import { currentScreen, goTo, manualLegacy, permissions } from '../../legacy/bridge';
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';
import { paintPortalManual } from './portal';

const BOOK = 'manual/index.html', BACK_WAIT_MS = 4000, BACK_STEP_MS = 120;

/** The chapter the book opens on next. */
let destination = '';

/** The last address asked for (the tests read it). */
const remember = (url: string): void => { (window as unknown as { MANUAL_ULTIMA?: string }).MANUAL_ULTIMA = url; };

/** Leaves the company name and words in the browser, so the book speaks like the company. */
function saveVocabulary(): void {
  try { localStorage.setItem('delcos-manual', JSON.stringify(manualLegacy.vocabulary())); } catch { /* the book keeps its default words */ }
}

const withAnchor = (base: string): string => base + (destination ? `#${destination}` : '');

/** Opens the manual on `anchor` (a chapter); if it is already open, only the book moves. */
export function openManual(anchor = ''): void {
  saveVocabulary();
  destination = anchor;
  remember(BOOK + (anchor ? `#${anchor}` : ''));
  const frame = document.getElementById('manlibro') as HTMLIFrameElement | null;
  if (currentScreen() === 'manual' && frame) {
    try { if (frame.contentWindow) frame.contentWindow.location.hash = anchor || 'portada'; } catch { /* the book is not loaded yet */ }
    return;
  }
  goTo('manual');
}

function paintBook(): void {
  const page = document.getElementById('v-manual');
  if (!page) return;
  saveVocabulary();
  const url = withAnchor(`${BOOK}?app=1`); destination = '';
  page.innerHTML = `<div class="saludo"><div><h1>${t('manual.title')}</h1><div class="fecha">${t('manual.book.subtitle')}</div></div></div>
    <iframe id="manlibro" class="manlibro" title="${t('manual.title')}" src="${url}"></iframe>`;
}

const delay = (ms: number): Promise<void> => new Promise(resolve => { setTimeout(resolve, ms); });

/** Back to the screen the manual was opened from, and, once it is painted and tall enough, to the same point. */
export async function goBack(): Promise<void> {
  const back = manualLegacy.takeBack();
  if (!back) { goTo('inicio'); return; }
  goTo(back.tab);
  const end = Date.now() + BACK_WAIT_MS;
  while (Date.now() < end) {
    await delay(BACK_STEP_MS);
    const screen = document.getElementById(`v-${back.tab}`) ?? document.querySelector('main > section:not(.hide)');
    const ready = !document.querySelector('main > section.preparando') && !screen?.classList.contains('cargando');
    if (ready && document.documentElement.scrollHeight - innerHeight >= back.y - 2) break;
  }
  window.scrollTo(0, back.y);
}

function addBackButton(): void {
  const header = document.querySelector('#v-manual .saludo'), back = manualLegacy.back();
  if (!header || !back || document.getElementById('manvolver')) return;
  header.insertAdjacentHTML('afterbegin', `<button type="button" class="manvuelta" id="manvolver"><b aria-hidden="true">‹</b> ${t('manual.book.backTo', { name: escapeHtml(manualLegacy.screenName(back.tab)) })}</button>`);
  const button = document.getElementById('manvolver');
  if (button) button.onclick = (): void => { void goBack(); };
}

/** Paints the manual screen. */
export function paintManual(): void {
  if (permissions.isProfessionalPortal()) paintPortalManual();
  else if (manualLegacy.isIos()) {
    saveVocabulary();
    const url = withAnchor(BOOK); destination = '';
    remember(url);
    location.href = url;
    return;
  } else paintBook();
  addBackButton();
}
