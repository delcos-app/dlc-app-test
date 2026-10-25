/**
 * The common base of the lists in a grid (.dgrid) with «Filtros y columnas»: Ventas, Facturación, Productos and the block pages.
 * Migrated from plRejilla (v2.238.0; v2.421.0). Without a search of its own, the bar's search filters the table («Contiene»).
 */
import { listBarLegacy } from '../../../legacy/listbar-bridge';
import { applyColumnFilters, tableKind } from '../../filters';
import { counter } from '../../filters-panel';
import { textOf } from '../text';
import type { ListConfig, RowCard } from '../types';

const COLUMNS_DELAY_MS = 80;

/** What a grid page says: its screen, what it lists and, if it has them, its list, pages, search and extra «⋯» actions. */
export interface GridOptions extends Partial<ListConfig> {
  tab: string;
  que: () => string;
  lista?: string;
  pag?: string;
  buscador?: string;
  extra?: [string, string][];
}

const byId = (id: string | undefined): HTMLElement | null => (id ? document.getElementById(id) : null);
const gridOf = (tab: string): HTMLElement | null => document.querySelector<HTMLElement>(`#v-${tab} .dgrid`);

function searchText(options: GridOptions): string {
  const input = byId(options.buscador) as HTMLInputElement | null; if (input) return input.value || '';
  const grid = gridOf(options.tab);
  return grid ? listBarLegacy.tableFilters()[tableKind(grid)]?.texto ?? '' : '';
}

function search(options: GridOptions, value: string): void {
  const input = byId(options.buscador) as HTMLInputElement | null;
  if (input) { input.value = value; input.dispatchEvent(new Event('input', { bubbles: true })); return; }
  const grid = gridOf(options.tab); if (!grid) return;
  const state = listBarLegacy.tableFilters(), kind = tableKind(grid);
  const filters = state[kind] ?? { texto: '', facetas: {} }; state[kind] = filters; filters.texto = value; applyColumnFilters(grid);
  const section = document.getElementById(`v-${options.tab}`); if (section) counter(section);
}

/** Opens «Filtros y columnas» and then its second panel, «Columnas». */
export function openColumns(tab: string): void {
  const button = document.querySelector<HTMLElement>(`#v-${tab} .htbtn`); if (!button) return;
  button.click();
  setTimeout(() => { document.getElementById('tools')?.querySelector<HTMLElement>('.t2abrir')?.click(); }, COLUMNS_DELAY_MS);
}

/** «⋯»: the secondary buttons of the header (except «Filtros y columnas») and the extra actions of the page. */
function moreActions(options: GridOptions): [string, string][] {
  const extra = options.extra ?? [];
  return [...document.querySelectorAll<HTMLElement>(`#v-${options.tab} > .saludo .acts > button.sec:not(.htbtn):not(.plmas)`)]
    .filter(button => !button.classList.contains('hide') && !extra.some(([id]) => id === button.id))
    .map((button): [string, string] => {
      if (!button.id) button.id = `plb${Math.random().toString(36).slice(2, 8)}`;
      return [button.id, ((button.textContent ?? '').trim() || button.title || (button.getAttribute('aria-label') ?? '')).replace(/\s+/g, ' ')];
    })
    .concat(extra.filter(([id]) => document.getElementById(id)));
}

/** Mobile card: the first cell, the next two with text and the state pill (if any) on the right. */
function gridCard(row: HTMLElement): RowCard {
  const cells = [...row.children].filter(cell => !cell.classList.contains('plcard'));
  const state = cells.find(cell => cell.querySelector('.pill, .est, .cirest, [class*="estado"]'));
  const rest = cells.slice(1).filter(cell => cell !== state).map(textOf).filter(text => text && text !== '—').slice(0, 2);
  return { a: textOf(cells[0]), b: rest.join(' · '), c: state ? state.innerHTML : '' };
}

export const gridConfig = (options: GridOptions): ListConfig => Object.assign({
  rejilla: true,
  nuevo: () => document.querySelector<HTMLElement>(`#v-${options.tab} > .saludo .acts > .btn:not(.sec):not(.htbtn):not(.fab)`) ?? document.querySelector<HTMLElement>(`#v-${options.tab} .fab`),
  cuerpo: () => byId(options.lista),
  tabla: () => byId(options.lista) ?? document.querySelector<HTMLElement>(`#v-${options.tab} .dgrid-wrap`),
  pie: () => byId(options.pag),
  cuenta: () => null,
  conDatos: (element: Element) => Boolean(element.querySelector('.dgrid, .vacio')),
  rapidos: [],
  q: () => searchText(options),
  buscarQ: (value: string) => { search(options, value); },
  activos: () => document.getElementById(`v-${options.tab}`)?.querySelectorAll('.htchips .htchip').length ?? 0,
  filtros: () => { document.querySelector<HTMLElement>(`#v-${options.tab} .htbtn`)?.click(); },
  columnas: () => { openColumns(options.tab); },
  mapa: () => null,
  mas: () => moreActions(options),
  kpis: null, kpiOn: () => false, kpiPulsar: () => undefined,
  card: gridCard,
}, options);
