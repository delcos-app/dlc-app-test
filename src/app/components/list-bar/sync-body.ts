/**
 * The body of a list page: table and pages in one card (totals in a summary strip above), the last content kept while it reloads
 * (or the skeleton with the same shape the first time) and the mobile card of each row. Part of plSync (v2.236.0; v2.316.0; v2.421.0).
 */
import { escapeHtml } from '../../services/format';
import { tableSkeleton } from '../list';
import type { ListConfig } from './types';

/** Last content of each list body, painted again (faded) while the list reloads. */
const lastContent = new WeakMap<Element, string>();

const SKELETON_PANEL = (tab: string): string => `<div class="panel plskpanel"><div class="pltab">${tableSkeleton(tab, true)}</div></div>`;

/** Table and pages in one card; the totals (.kpis.vtot) become the summary strip; «después» goes right after the card. */
function cardOf(config: ListConfig): Element | null {
  const table = config.tabla(), pages = config.pie(); if (!table) return null;
  if (table.parentElement && !table.parentElement.classList.contains('pltab')) {
    const card = document.createElement('div'); card.className = 'pltab'; table.before(card); card.appendChild(table); if (pages) card.appendChild(pages);
  } else if (pages && pages.parentElement !== table.parentElement) table.parentElement?.appendChild(pages);
  return table.closest('.pltab');
}

function wrapTable(section: HTMLElement, tab: string, config: ListConfig): void {
  const card = cardOf(config);
  if (!config.rejilla || !card) return;
  section.querySelectorAll('.kpis.vtot:not(.plres)').forEach(totals => { if (totals.closest(`#v-${tab}`) && !totals.closest('.plkpis')) totals.classList.add('plres'); });
  if (config.despues) { const after = document.getElementById(config.despues); if (after && card.nextElementSibling !== after) card.after(after); }
}

/** While the list loads: the last content (faded) or, the first time, the skeleton; once it has data, that content is remembered. */
function syncBody(tab: string, config: ListConfig): void {
  const body = config.cuerpo(); if (!body) return;
  if (body.querySelector(':scope > .cargador')) {
    const last = lastContent.get(body);
    if (last) { body.innerHTML = last; body.classList.add('platenua'); return; }
    if (tab !== 'directorio') { body.innerHTML = tableSkeleton(tab, true); return; }
    body.innerHTML = tableSkeleton(tab, false);
    const head = document.getElementById('thead');
    if (head && !head.children.length) head.innerHTML = /<div class="plskh">[\s\S]*?<\/div>/.exec(tableSkeleton(tab, true))?.[0] ?? '';
  } else if (config.conDatos(body)) { body.classList.remove('platenua'); lastContent.set(body, body.innerHTML); }
}

/** The skeleton panels: Clientes' empty body, and a grid page's first arrival (removed as soon as there is a table). */
function skeletonPanels(section: HTMLElement, tab: string, config: ListConfig, bar: Element | null): void {
  const customers = tab === 'pacientes' ? document.getElementById('vcuerpo') : null;
  if (customers && !customers.children.length) customers.innerHTML = SKELETON_PANEL(tab);
  if (config.rejilla && !section.querySelector('.dgrid, .pltab, .vacio') && !section.querySelector(':scope > .plskpanel')) bar?.insertAdjacentHTML('afterend', SKELETON_PANEL(tab));
  if (section.querySelector('.dgrid, .vacio')) section.querySelectorAll(':scope > .plskpanel').forEach(panel => { panel.remove(); });
}

/** Each row's mobile card (hidden on the computer). */
function cards(section: HTMLElement, config: ListConfig): void {
  const card = config.card; if (!card) return;
  section.querySelectorAll<HTMLElement>('.dgrid > .dr:not([data-plc])').forEach(row => {
    row.dataset.plc = '1'; const item = card(row);
    row.insertAdjacentHTML('beforeend', `<span class="plcard"><b>${escapeHtml(item.a)}</b><span class="plc2">${escapeHtml(item.b)}</span><span class="plc3">${item.c}</span>${item.d ? `<span class="plc4">${escapeHtml(item.d)}</span>` : ''}</span>`);
  });
}

export function syncTable(section: HTMLElement, tab: string, config: ListConfig): void {
  wrapTable(section, tab, config);
  syncBody(tab, config);
  skeletonPanels(section, tab, config, section.querySelector(':scope > .pltool'));
  cards(section, config);
}
