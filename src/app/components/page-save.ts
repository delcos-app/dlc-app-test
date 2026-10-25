/**
 * D-042: a page that configures something in several blocks has one «Guardar» (and «Descartar cambios») at the top right. Each
 * block keeps its own save button, hidden, and «Guardar» presses those of the changed blocks one after another. Repeated titles
 * are hidden. Migrated from the legacy componentes/guardar_pagina.js (v2.427.0); the legacy names stay as adapters (the page glue
 * of legado 157 and the shell call them). The pages (PAG_GUARDA), what counts as a save button and the changed blocks stay in
 * legacy state.
 */
import { leftoversLegacy } from '../legacy/leftovers-bridge';
import { t } from '../i18n';

const STEP_MS = 120, POLL_MS = 80, MAX_WAIT_MS = 15000;
const CONFIG = 'config';
const BILLING_SUB = '#v-facturacion .cfgsubs';

export interface SavePage { cab: Element; cuerpo: Element }

/** The header and body of the current page, if it is one of the pages with a single «Guardar». */
export function currentPage(): SavePage | null {
  const page = leftoversLegacy.savePages().find(item => item.tab === leftoversLegacy.screen()); if (!page) return null;
  const header = page.cab(), body = page.cuerpo();
  return header && body ? { cab: header, cuerpo: body } : null;
}

export const blockOf = (element: Element, body: Element): Element => element.closest('.cfgsec') ?? body;

/** The block save buttons of the page (not those of a window on top, the header or the greeting). */
export function saveButtons(body: Element): HTMLElement[] {
  const pattern = leftoversLegacy.saveTextPattern(), excluded = leftoversLegacy.notSaveSelector();
  return [...body.querySelectorAll<HTMLElement>('button, a.btn')]
    .filter(button => pattern.test((button.textContent ?? '').trim()) && !button.matches(excluded) && !button.closest('dialog:not(.encajada:has([data-pagina])), .cfucab, .saludo'));
}

/** The save button of each block stays (with its function) in a hidden box of its block; a row left empty is hidden. */
export function hideButton(button: HTMLElement): void {
  if (button.closest('.cfgocultos')) return;
  const row = button.parentElement, block = button.closest('.cfgsecc, .card, #cfgcuerpo, #fcuerpo') ?? row;
  if (!block) return;
  let hidden = block.querySelector<HTMLElement>(':scope > .cfgocultos');
  if (!hidden) { hidden = document.createElement('div'); hidden.className = 'cfgocultos'; hidden.hidden = true; block.appendChild(hidden); }
  hidden.appendChild(button);
  if (row && row !== block && ![...row.children].some(child => child.getClientRects().length)) row.style.display = 'none';
}

/** A title that repeats the text of the one above is hidden. */
function hideRepeatedTitles(page: SavePage): void {
  let previous = '';
  const titles = [...page.cab.querySelectorAll('h1, h2'), ...[...page.cuerpo.querySelectorAll('h2, h3')].filter(title => !page.cab.contains(title))];
  for (const title of titles) {
    if (!title.getClientRects().length && !title.classList.contains('cfudup')) continue;
    const text = (title.textContent ?? '').trim().toLowerCase();
    if (text && text === previous) title.classList.add('cfudup'); else previous = text;
  }
}

const pressedBillingTab = (): HTMLElement | null =>
  document.querySelector<HTMLElement>(`${BILLING_SUB} button.on, ${BILLING_SUB} button[aria-pressed="true"]`);

function discard(): void {
  leftoversLegacy.changedBlocks().clear();
  if (leftoversLegacy.screen() === CONFIG) leftoversLegacy.reloadSettings(); else pressedBillingTab()?.click();
}

/** The changed-blocks mark is only lost when changing section (a header painted again does not clear it). */
function sectionKey(): string {
  const screen = leftoversLegacy.screen();
  const sub = document.querySelector(`${BILLING_SUB} .on, ${BILLING_SUB} [aria-pressed="true"]`)?.textContent;
  return `${screen}|${screen === CONFIG ? leftoversLegacy.settingsKey() : String(sub)}`;
}

function addButtons(header: Element): void {
  const key = sectionKey();
  if (key !== leftoversLegacy.pageKey()) { leftoversLegacy.changedBlocks().clear(); leftoversLegacy.setPageKey(key); }
  const actions = document.createElement('div'); actions.className = 'acts cfuacts cfuguarda';
  actions.innerHTML = `<button type="button" class="btn sec" id="cfudescartar" disabled>${t('leftovers.pageSave.discard')}</button><button type="button" class="btn" id="cfuguardar" disabled>${t('common.save')}</button>`;
  header.appendChild(actions);
  const discardButton = document.getElementById('cfudescartar'), save = document.getElementById('cfuguardar');
  if (discardButton) discardButton.onclick = discard;
  if (save) save.onclick = (): void => { void saveAll(); };
}

/** Puts «Descartar cambios» and «Guardar» in the page header and hides the block buttons. */
export function placeSave(): void {
  const page = currentPage();
  document.querySelectorAll('.cfuguarda').forEach(actions => { if (!page?.cab.contains(actions)) actions.remove(); });
  if (!page) return;
  hideRepeatedTitles(page);
  if (page.cab.querySelector('.cfuacts:not(.cfuguarda)')) return;   // the section brings its own buttons in the header (Inicio KPIs)
  const buttons = saveButtons(page.cuerpo), actions = page.cab.querySelector('.cfuguarda');
  if (!buttons.length) { actions?.remove(); return; }
  buttons.forEach(hideButton);
  if (!actions) addButtons(page.cab);
  leftoversLegacy.markChanged();
}

const wait = (ms: number): Promise<void> => new Promise(resolve => { setTimeout(resolve, ms); });

/** «Guardar»: presses the save of each changed block (all if none is marked), waiting for each one to finish. */
export async function saveAll(): Promise<void> {
  const save = document.getElementById('cfuguardar') as HTMLButtonElement | null, page = currentPage();
  if (!save || save.disabled || !page) return;
  save.disabled = true;
  const changed = [...leftoversLegacy.changedBlocks()], all = saveButtons(page.cuerpo);
  const buttons = all.filter(button => changed.some(block => block.contains(button)));
  for (const button of buttons.length ? buttons : all) {
    if (!button.isConnected) continue;
    button.click();
    const start = Date.now(); await wait(STEP_MS);
    while (Date.now() - start < MAX_WAIT_MS && (leftoversLegacy.requestsInFlight() > 0 || button.classList.contains('guardando'))) await wait(POLL_MS);
  }
  leftoversLegacy.changedBlocks().clear(); leftoversLegacy.markChanged();
}
