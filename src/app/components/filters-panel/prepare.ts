/**
 * «Filtros y columnas» on a screen: the button in the header, the hidden panel where the screen's own filters wait (the text search
 * stays in view), the side panel it opens, and what a freshly painted table gets (its columns, filters and order). Migrated from the
 * legacy htPreparar, htColocarBoton and htAbrirLateral with their Base layers (v2.419.0); htPreparar and htColocarBoton stay as
 * adapters (legado 054 and 055 call them from their observers).
 */
import { icon, sidePanel } from '../../legacy/bridge';
import { panelsLegacy } from '../../legacy/panels-bridge';
import { t } from '../../i18n';
import { paintSidePanelClassifiers, screenOf } from '../classifiers/filters';
import { compact } from '../filters/memory';
import { applyColumnFilters, sortRows } from '../filters/table-sort';
import { applyColumns } from './columns';
import { counter, gridOf } from './counter';
import { paintPanel } from './panel';
import { giveBack, screenId, sideOpen, toolsBox } from './side';

const PANEL_HTML = '<div class="htpanel hide"><div class="htpropios"></div><div class="htauto"></div></div>';
const buttonHtml = (): string => `<button class="btn sec chico htbtn" type="button" title="${t('panels.filters.button')}" aria-label="${t('panels.filters.button')}">${icon('sliders-horizontal')}<span class="htl"> ${t('panels.filters.button')}</span><span class="htn"></span></button>`;

/** Opens (or closes) the side panel with the screen's filters, the automatic part and Clasificadores. */
export function openSide(section: Element): void {
  const box = toolsBox(), id = screenId(section);
  if (!box) return;
  if (sideOpen() && sidePanel.context() === `ht-${id}`) { box.classList.remove('abierto'); return; }
  giveBack();
  sidePanel.setContext(`ht-${id}`);
  box.innerHTML = `<div class="tbox"><div class="fh"><h2>${t('panels.filters.title')}</h2><button class="x" id="tclose" aria-label="${t('panels.filters.close')}">✕</button></div>
    <div class="htpropios lat"></div><div class="htauto"></div></div>`;
  const hold = section.querySelector('.htpanel .htpropios'), side = box.querySelector('.htpropios.lat');
  if (hold && side) [...hold.children].forEach(child => { side.appendChild(compact(child, false)); });
  const close = document.getElementById('tclose'); if (close) close.onclick = (): void => { box.classList.remove('abierto'); };
  box.classList.add('abierto');
  paintPanel(section);
  const auto = box.querySelector('.htauto');
  if (!screenOf(section) || !sideOpen() || !auto || box.querySelector('.htclas')) return;
  auto.insertAdjacentHTML('beforebegin', '<div class="htclas"></div>');
  paintSidePanelClassifiers(section);
}

/** The button goes to the right of the header and opens the side panel. */
export function placeButton(section: Element): void {
  const button = section.querySelector<HTMLElement>('.htbtn'); if (!button || button.dataset.v254) return;
  button.dataset.v254 = '1';
  const acts = button.parentElement; if (!acts) return;
  acts.appendChild(button); acts.classList.add('htacts');
  button.onclick = (): void => { openSide(section); };
  section.querySelectorAll('.htpanel').forEach(panel => { panel.classList.add('hide'); });
  // The selects of the side panel update the counter
  toolsBox()?.addEventListener('change', () => { counter(section); });
}

function headerActs(section: Element): Element | null {
  const greeting = section.querySelector('.saludo');
  let acts = section.querySelector('.saludo .acts');
  if (!acts && greeting) { greeting.insertAdjacentHTML('beforeend', '<div class="acts"></div>'); acts = section.querySelector('.saludo .acts'); }
  return acts;
}

function createPanel(section: Element): HTMLElement | null {
  const reference = section.querySelector('.subnav') ?? section.querySelector('.saludo'), acts = headerActs(section);
  if (!reference || !acts) return null;
  reference.insertAdjacentHTML('afterend', PANEL_HTML);
  const panel = section.querySelector<HTMLElement>('.htpanel');
  acts.insertAdjacentHTML('afterbegin', buttonHtml());
  const button = acts.querySelector<HTMLElement>('.htbtn');
  if (button && panel) button.onclick = (): void => { panel.classList.toggle('hide'); if (!panel.classList.contains('hide')) paintPanel(section); };
  return panel;
}

/** The screen's own filters move into the panel; the text search stays in view. */
function moveOwnFilters(section: Element, panel: Element, own: HTMLElement): void {
  own.dataset.ht = '1';
  const hold = panel.querySelector('.htpropios');
  [...own.children].forEach(child => {
    if (child.matches('input[type=search],input[type=text]') || child.querySelector('input[type=search],input[type=text]')) return;
    hold?.appendChild(compact(child, true));
  });
  if (!own.children.length) own.classList.add('hide');
  panel.querySelectorAll('.htpropios select').forEach(select => { select.addEventListener('change', () => { counter(section); }); });
}

/** Screens without the panel: Profesionales hides its own filters (it has its list bar), and the billing settings have no tables. */
function withoutPanel(section: Element, id: string): boolean {
  if (id === 'directorio') { section.querySelector('.panel > .filtros')?.classList.add('hide'); return true; }
  // v2.87.0: in the billing settings there are no tables to filter
  const billing = panelsLegacy.billingSection();
  return id === 'facturacion' && billing !== null && billing !== 'facturas';
}

/** A new table (data just painted): its columns and filters apply, and the panel repaints if open. */
function prepareTable(section: Element, panel: HTMLElement, grid: HTMLElement): void {
  if (grid.dataset.ht) return;
  grid.dataset.ht = '1'; applyColumns(grid); applyColumnFilters(grid);
  if (!panel.classList.contains('hide')) paintPanel(section);
}

function prepareBase(section: Element): void {
  const id = screenId(section);
  if (withoutPanel(section, id)) return;
  const grid = gridOf(section), target = panelsLegacy.filterTargets()[id], own = target ? document.querySelector<HTMLElement>(target) : null;
  if (!grid && !own) return;
  const panel = section.querySelector<HTMLElement>('.htpanel') ?? createPanel(section);
  if (!panel) return;
  if (own && !own.dataset.ht) moveOwnFilters(section, panel, own);
  if (grid) prepareTable(section, panel, grid);
  counter(section);
}

/** The panel exists even when the list is empty (a period or a Clasificadores filter that leaves nothing), and the button comes back
 *  if the table was painted again whole. */
function prepareEmpty(section: Element): void {
  const acts = section.querySelector('.saludo .acts'), reference = section.querySelector('.subnav') ?? section.querySelector('.saludo');
  if (!section.querySelector('.htpanel') && !gridOf(section) && screenOf(section) && reference && acts) reference.insertAdjacentHTML('afterend', PANEL_HTML);
  if (section.querySelector('.htpanel') && !section.querySelector('.htbtn') && acts) acts.insertAdjacentHTML('afterbegin', buttonHtml());
}

/** Prepares «Filtros y columnas» on a screen and sorts its tables when their rows change. */
export function prepare(section: Element): void {
  // v2.218.0: «Filtros y columnas» does not hook into Configuración (its tables are still sorted)
  if (section.id === 'v-config') section.querySelectorAll('.htbtn, .htpanel').forEach(item => { item.remove(); });
  else {
    prepareEmpty(section);
    prepareBase(section);
    if (!gridOf(section) && screenOf(section)) counter(section);
  }
  section.querySelectorAll<HTMLElement>('.dgrid').forEach(grid => {
    const rows = String(grid.querySelectorAll(':scope > .dr').length);
    if (grid.dataset.htn !== rows) { grid.dataset.htn = rows; sortRows(grid); }
  });
}
