/**
 * Block pages as a table (v2.239.0): each time the page paints its block cards again, they become one table with a row per record
 * (a record in two blocks shows once and counts in both); the main action goes to the header and the rest to «⋯»; the blocks become
 * a quick filter and a band of indicators. Migrated from blqConvertir and blqFiltrar (v2.421.0).
 */
import { t } from '../../i18n';
import { escapeHtml, formatNumber } from '../../services/format';
import { blocks } from './configs';
import { chosenGroups } from './state';
import { textOf } from './text';
import type { BlockConfig } from './types';

interface BlockRow { row: HTMLElement; groups: Set<string> }

/** The header actions: the page's own buttons (.evcab) move to the header (the ones moved before are removed: their ids would repeat). */
function moveActions(section: HTMLElement, box: Element): void {
  const greeting = section.querySelector(':scope > .saludo');
  let actions = greeting?.querySelector(':scope > .acts') ?? null;
  if (greeting && !actions) { greeting.insertAdjacentHTML('beforeend', '<div class="acts"></div>'); actions = greeting.querySelector(':scope > .acts'); }
  const own = box.querySelector('.evcab');
  if (!own || !actions) return;
  section.querySelectorAll('[data-plmov]').forEach(button => { button.remove(); });
  [...own.querySelectorAll<HTMLElement>('button')].forEach(button => { button.dataset.plmov = '1'; actions.appendChild(button); });
  own.remove();
}

/** One row per record, with the blocks it is in. */
function collectRows(box: Element, block: BlockConfig): { rows: Map<string, BlockRow>; groups: string[] } {
  const rows = new Map<string, BlockRow>(), groups: string[] = [];
  box.querySelectorAll('section.card, .card').forEach(card => {
    const heading = card.querySelector('h2'), group = heading ? textOf(heading).replace(/\s*·\s*[\d.]+$/, '') : block.def;
    const items = [...card.querySelectorAll<HTMLElement>(`.lista > .item[data-${block.attr}]`)]; if (!items.length) return;
    if (!groups.includes(group)) groups.push(group);
    items.forEach(item => {
      const key = item.dataset[block.attr] ?? '', known = rows.get(key);
      if (known) { known.groups.add(group); item.remove(); } else rows.set(key, { row: item, groups: new Set([group]) });
    });
  });
  return { rows, groups };
}

function tableOf(tab: string, block: BlockConfig, rows: Map<string, BlockRow>, empty: string): HTMLElement {
  const wrap = document.createElement('div'); wrap.className = 'dgrid-wrap';
  wrap.innerHTML = `<div class="dgrid blq-${tab}"><div class="dh">${block.cols.map(([title, kind]) => `<span class="${kind}">${escapeHtml(title)}</span>`).join('')}</div></div>`;
  const grid = wrap.firstElementChild as HTMLElement;
  rows.forEach(({ row, groups }) => {
    const cells = block.celdas(row), click = row.onclick;
    row.className = 'dr'; row.innerHTML = cells.map((cell, index) => `<span class="${block.cols[index]?.[1] ?? ''}">${cell || '<span class="vac">—</span>'}</span>`).join('');
    row.dataset.grupos = [...groups].join('|'); row.onclick = click; grid.appendChild(row);
  });
  if (!rows.size) wrap.innerHTML = `<div class="vacio">${escapeHtml(empty)}</div>`;
  return wrap;
}

/** The block filter (select) and the band of indicators of the blocks. */
function paintChoice(section: HTMLElement, tab: string, block: BlockConfig, data: { rows: Map<string, BlockRow>; groups: string[] }): void {
  const { rows, groups } = data;
  if (chosenGroups[tab] && !groups.includes(chosenGroups[tab])) chosenGroups[tab] = '';
  let select = document.getElementById(`plg-${tab}`) as HTMLSelectElement | null;
  if (!select) {
    section.insertAdjacentHTML('beforeend', `<div class="plgsel hide"><label for="plg-${tab}">${escapeHtml(block.grupo)}</label><select id="plg-${tab}"></select></div>`);
    select = document.getElementById(`plg-${tab}`) as HTMLSelectElement;
    const chooser = select; chooser.onchange = (): void => { chosenGroups[tab] = chooser.value; filterBlocks(tab); };
  }
  select.innerHTML = `<option value="">${t('listBar.bar.all')}</option>` + (groups.length > 1 ? groups.map(group => `<option ${chosenGroups[tab] === group ? 'selected' : ''}>${escapeHtml(group)}</option>`).join('') : '');
  let band = document.getElementById(`plgb-${tab}`);
  if (!band) { band = document.createElement('div'); band.id = `plgb-${tab}`; band.className = 'plgband'; section.appendChild(band); }
  const count = (group: string): number => [...rows.values()].filter(row => row.groups.has(group)).length;
  const what = (group: string): string => escapeHtml(count(group) === 1 ? `1 ${block.que.replace(/s$/, '')}` : block.que);
  band.innerHTML = groups.length > 1 ? groups.map(group => `<button type="button" class="plk ${chosenGroups[tab] === group ? 'on' : ''}" data-plg="${escapeHtml(group)}"><span class="plkt">${escapeHtml(group)}</span><b>${formatNumber(count(group))}</b><small>${what(group)}</small></button>`).join('') : '';
  band.classList.toggle('hide', groups.length < 2);
}

/** Turns the page's block cards into the table (each time the page paints them again). */
export function convertBlocks(tab: string): void {
  const block = blocks[tab], section = document.getElementById(`v-${tab}`), box = section?.querySelector('#cfgcuerpo');
  if (!block || !section || !box) return;
  const items = box.querySelectorAll(`.lista > .item[data-${block.attr}]`);
  if (!items.length && (box.querySelector(`.dgrid.blq-${tab}`) || !box.querySelector('.cirpag, .evpag'))) return;
  moveActions(section, box);
  const data = collectRows(box, block), empty = box.querySelector('.vacio');
  const notes = [...box.querySelectorAll('.cirpag > p.sm, .evpag > p.sm')];
  const wrap = tableOf(tab, block, data.rows, empty ? textOf(empty) : t('listBar.bar.nothingYet'));
  box.innerHTML = ''; notes.forEach(note => { box.appendChild(note); }); box.appendChild(wrap);
  paintChoice(section, tab, block, data);
  filterBlocks(tab);
}

/** Shows only the rows of the chosen block and marks it in the band and the select. */
export function filterBlocks(tab: string): void {
  const chosen = chosenGroups[tab] ?? '', section = document.getElementById(`v-${tab}`); if (!section) return;
  section.querySelectorAll<HTMLElement>(`.dgrid.blq-${tab} > .dr`).forEach(row => { row.classList.toggle('plgfuera', Boolean(chosen) && !(row.dataset.grupos ?? '').split('|').includes(chosen)); });
  section.querySelectorAll<HTMLElement>('[data-plg]').forEach(button => { button.classList.toggle('on', button.dataset.plg === chosen); });
  const select = document.getElementById(`plg-${tab}`) as HTMLSelectElement | null; if (select && select.value !== chosen) select.value = chosen;
  const count = section.querySelector<HTMLElement>('.plcnt'); if (count) count.dataset.h = '';
}
