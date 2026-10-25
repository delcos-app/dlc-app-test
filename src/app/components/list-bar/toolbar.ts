/**
 * The bar of a list: search, quick filters, «Filtros», «Eliminar filtros», «Columnas», map and the count. Migrated from plToolHtml and
 * plRecuento with its layers (v2.236.0; v2.239.0; «Cerca de mí»; v2.421.0).
 */
import { listBarLegacy } from '../../legacy/listbar-bridge';
import { t } from '../../i18n';
import { escapeHtml, formatNumber } from '../../services/format';
import { configOf } from './configs';
import { icon, labelOf } from './text';
import type { ListConfig } from './types';

/** The bar of the open section of a screen. */
export function toolbarHtml(tab: string): string {
  const config = configOf(tab); if (!config) return '';
  const search = config.buscaTxt ? config.buscaTxt() : t('listBar.bar.searchIn', { what: config.que() });
  const quick = config.rapidos.map(([id, name]) => { const label = name || labelOf(id); return `<button type="button" class="plchip" data-plr="${escapeHtml(id)}" data-plt="${escapeHtml(label)}">${escapeHtml(label)}</button>`; }).join('');
  return `<label class="plq">${icon('search', '🔍')}<input type="search" class="plqi" placeholder="${escapeHtml(search)}" aria-label="${escapeHtml(search)}"></label>
    <div class="plrap">${quick}</div>
    <button type="button" class="plbtn chico plfil">${icon('sliders-horizontal')}<span>${t('listBar.bar.filters')}</span><span class="pln hide"></span></button>
    ${config.quitar ? `<button type="button" class="btn sec chico dang plquitar hide">${listBarLegacy.lineIcon('x')} ${t('listBar.bar.removeFilters')}</button>` : ''}
    <button type="button" class="plbtn chico plcol">${icon('columns-3', 'table', 'list')}<span>${t('listBar.bar.columns')}</span></button>
    ${config.mapa() ? `<button type="button" class="plbtn chico plic plmapa" title="${t('listBar.bar.onMap')}" aria-label="${t('listBar.bar.onMap')}">${icon('map')}</button>` : ''}
    <span class="plcnt"><i class="plsk" style="width:90px"></i></span>`;
}

const counted = (count: string, config: ListConfig): string => `<b>${count}</b> ${escapeHtml(config.que())}`;

/** «1–20 de N» of the pages: the N. */
function pagesTotal(section: Element): RegExpExecArray | null {
  const pages = section.querySelector('.pltab .pag > span, .pag > span');
  return pages ? /de\s+([\d.]+)/.exec(pages.textContent ?? '') : null;
}

/** The screen's own count; without one, the pages («1–20 de N») or the rows shown. */
function screenCount(section: Element, config: ListConfig): string {
  const own = config.cuenta();
  if (own && /\d/.test(own.textContent ?? '')) return own.innerHTML.replace(/<span class="sm">[\s\S]*?<\/span>/, '').trim();
  const match = pagesTotal(section), grid = section.querySelector('.dgrid');
  if (!match && !grid) return section.querySelector('.pltab .vacio, .panel .vacio') ? counted('0', config) : '';
  return counted(match?.[1] ?? formatNumber(grid?.querySelectorAll(':scope > .dr:not(.hide):not(.htfuera)').length ?? 0), config);
}

/** Block tables count only the rows shown (block and search). */
function blockCount(section: Element, config: ListConfig): string {
  const grid = section.querySelector('.dgrid');
  if (!grid) return section.querySelector('#cfgcuerpo .vacio') ? counted('0', config) : '';
  return counted(formatNumber(grid.querySelectorAll(':scope > .dr:not(.htfuera):not(.plgfuera)').length), config);
}

/** The count of the bar («Cerca de mí»: its «Volver a la búsqueda» works from the bar). */
export function countHtml(section: Element, config: ListConfig): string {
  const html = config.bloques ? blockCount(section, config) : screenCount(section, config);
  return html.replace(/\sid="cercacerrar"/g, ' data-cercavolver');
}
