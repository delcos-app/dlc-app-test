/**
 * «Clasificadores» in «Filtros y columnas»: a filter and a «Columna» box for every custom field of the screen. Lists and texts
 * with few values: a dropdown; with many: a search box. Numbers and dates: from / to. Clientes, Pedidos and Productos have it in
 * the side panel. Migrated from componentes/clasificadores.js (v2.416.0); clasPintar, clasPintarLateral and clasPantalla stay as
 * adapters.
 */
import { componentsLegacy } from '../../legacy/components-bridge';
import { legacyDb, sidePanel } from '../../legacy/bridge';
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';
import { toast } from '../toast';
import { setColumn, showsColumn } from './columns';
import type { FieldDefinition, FilterState, FilterValue, RangeFilter } from './model';

/** Up to this many values, a dropdown; with more, a search box. */
const MAX_DROPDOWN = 15, SEARCH_WAIT_MS = 400;
/** Per scope: the values the accounts already have in each field. */
const knownValues: Record<string, Record<string, string[]>> = {};

export interface ClassifierScreen { amb: string; estado: () => FilterState; recargar: () => void; activo?: () => boolean }

const SCREENS: Readonly<Record<string, ClassifierScreen>> = {
  pacientes: { amb: 'cliente', estado: () => componentsLegacy.customerFilters(), recargar: () => { componentsLegacy.reloadCustomers(); } },
  ventas: { amb: 'pedido', estado: () => componentsLegacy.orderFilters(), recargar: () => { componentsLegacy.reloadOrders(); }, activo: () => Boolean(document.getElementById('pedlista')) },
  productos: { amb: 'producto', estado: () => componentsLegacy.productFilters(), recargar: () => { componentsLegacy.reloadProducts(); }, activo: () => componentsLegacy.productsSection() === 'productos' },
};

/** The classifier settings of a screen section (#v-pacientes…), when it has them and they apply now. */
export function screenOf(section: Element | null | undefined): ClassifierScreen | null {
  const screen = section ? SCREENS[section.id.replace('v-', '')] : undefined;
  return screen && (!screen.activo || screen.activo()) ? screen : null;
}

async function loadValues(scope: string): Promise<Record<string, string[]>> {
  const { data } = await legacyDb().rpc<Record<string, string[]>>('valores_campos', { p_ambito: scope });
  if (data) knownValues[scope] = data;
  return knownValues[scope] ?? {};
}

function rangeControl(field: FieldDefinition, active: FilterValue, id: string): string {
  const range: RangeFilter = active && typeof active === 'object' ? active : {}, type = field.tipo === 'fecha' ? 'type="date"' : 'type="text" inputmode="decimal"';
  const shown = (value: unknown): string => (value === null || value === undefined ? '' : escapeHtml(field.tipo === 'numero' ? String(value as string).replace('.', ',') : String(value as string)));
  return `<div class="clasrango"><input id="${id}" ${type} data-clr="desde" value="${shown(range.desde)}" placeholder="${t('components.classifiers.fromPlaceholder')}" aria-label="${t('components.classifiers.fromLabel', { name: escapeHtml(field.nombre) })}">
      <input ${type} data-clr="hasta" value="${shown(range.hasta)}" placeholder="${t('components.classifiers.toPlaceholder')}" aria-label="${t('components.classifiers.toLabel', { name: escapeHtml(field.nombre) })}"></div>`;
}

function listControl(list: readonly string[], active: FilterValue, id: string): string {
  if (list.length <= MAX_DROPDOWN) {
    const options = typeof active === 'string' && active && !list.includes(active) ? [...list, active] : list;
    return `<select id="${id}" data-clv><option value="">${t('components.classifiers.all')}</option>${options.map(value => `<option ${active === value ? 'selected' : ''}>${escapeHtml(value)}</option>`).join('')}</select>`;
  }
  const text = active && typeof active === 'object' ? active.contiene ?? '' : typeof active === 'string' ? active : '';
  return `<input id="${id}" type="search" data-clbus list="${id}_l" value="${escapeHtml(text)}" placeholder="${t('components.classifiers.typeToSearch')}" autocomplete="off">
    <datalist id="${id}_l">${list.map(value => `<option value="${escapeHtml(value)}">`).join('')}</datalist>`;
}

/** The filter of a field by its type and how many values it has. */
function control(field: FieldDefinition, active: FilterValue, values: Readonly<Record<string, string[]>>, id: string): string {
  if (field.tipo === 'si_no') return `<select id="${id}" data-clv><option value="">${t('components.classifiers.all')}</option>${[['true', t('components.classifiers.yes')], ['false', t('components.classifiers.no')]].map(([value = '', label = '']) =>
    `<option value="${value}" ${active === (value === 'true') ? 'selected' : ''}>${label}</option>`).join('')}</select>`;
  if (field.tipo === 'numero' || field.tipo === 'fecha') return rangeControl(field, active, id);
  return listControl(field.tipo === 'lista' ? field.valores ?? [] : values[field.clave] ?? [], active, id);
}

function readRange(field: FieldDefinition, inputs: readonly HTMLInputElement[]): RangeFilter | null | false {
  const range: Record<string, string | number> = {};
  for (const input of inputs) {
    const value = input.value.trim(); if (!value) continue;
    const parsed = field.tipo === 'numero' ? Number(value.replace(',', '.')) : value;
    if (typeof parsed === 'number' && isNaN(parsed)) { toast(t('components.classifiers.mustBeNumber', { name: field.nombre }), true); return false; }
    range[input.dataset.clr ?? ''] = parsed;
  }
  return Object.keys(range).length ? range : null;
}

interface Binding { field: FieldDefinition; state: FilterState; onChange: () => void }

function bindSelect(block: Element, { field, state, onChange }: Binding): void {
  const select = block.querySelector<HTMLSelectElement>('select[data-clv]');
  if (select) select.onchange = (): void => {
    if (!select.value) Reflect.deleteProperty(state, field.clave); else state[field.clave] = field.tipo === 'si_no' ? select.value === 'true' : select.value;
    onChange();
  };
}

function bindSearch(block: Element, { field, state, onChange }: Binding): void {
  const search = block.querySelector<HTMLInputElement>('input[data-clbus]');
  if (!search) return;
  let timer: ReturnType<typeof setTimeout> | undefined;
  search.oninput = (): void => {
    clearTimeout(timer);
    timer = setTimeout(() => { const text = search.value.trim(); if (text) state[field.clave] = { contiene: text }; else Reflect.deleteProperty(state, field.clave); onChange(); }, SEARCH_WAIT_MS);
  };
}

function bindRange(block: Element, { field, state, onChange }: Binding): void {
  const inputs = [...block.querySelectorAll<HTMLInputElement>('input[data-clr]')];
  inputs.forEach(input => { input.onchange = (): void => {
    const range = readRange(field, inputs); if (range === false) return;
    if (range) state[field.clave] = range; else Reflect.deleteProperty(state, field.clave);
    onChange();
  }; });
}

function blockHtml(scope: string, fields: readonly FieldDefinition[], state: FilterState, values: Readonly<Record<string, string[]>>): string {
  const prefix = `clas_${scope}_`;
  return fields.map((field, index) => `<div class="clascampo" data-clk="${escapeHtml(field.clave)}">
      <div class="clascab"><label for="${prefix}${index}">${escapeHtml(field.nombre)}</label>
        <label class="clascol" title="${t('components.classifiers.asColumn', { name: escapeHtml(field.nombre) })}"><input type="checkbox" data-clcol ${showsColumn(scope, field.clave) ? 'checked' : ''}> ${t('components.classifiers.column')}</label></div>
      ${control(field, state[field.clave] as FilterValue, values, prefix + String(index))}</div>`).join('');
}

export interface PaintOptions { state: FilterState; onChange: () => void; onColumn: () => void; heading?: string }

/** Paints the «Clasificadores» section in `container`: a filter and a «Columna» box per custom field of `scope`. */
export async function paintClassifiers(container: Element | null, scope: string, options: PaintOptions): Promise<void> {
  const { state, onChange, onColumn, heading } = options;
  if (!container) return;
  const fields = componentsLegacy.sortedFields(scope) as FieldDefinition[];
  const title = heading === 'h3' ? `<h3 style="margin-top:18px">${t('components.classifiers.title')}</h3>` : `<h4>${t('components.classifiers.title')}</h4>`;
  if (!fields.length) { container.innerHTML = componentsLegacy.canEditCatalogs() ? `<div class="htbloque clasif">${title}<p class="sm">${t('components.classifiers.none')}</p></div>` : ''; return; }
  const needsValues = fields.some(field => field.tipo === 'texto' || (field.tipo === 'lista' && (field.valores ?? []).length > MAX_DROPDOWN));
  const values = needsValues ? await loadValues(scope) : {};
  if (!container.isConnected) return;
  container.innerHTML = `<div class="htbloque clasif">${title}${blockHtml(scope, fields, state, values)}</div>`;
  container.querySelectorAll<HTMLElement>('[data-clk]').forEach(block => {
    const field = fields.find(item => item.clave === block.dataset.clk); if (!field) return;
    const binding = { field, state, onChange };
    bindSelect(block, binding); bindSearch(block, binding); bindRange(block, binding);
    const column = block.querySelector<HTMLInputElement>('[data-clcol]');
    if (column) column.onchange = (): void => { setColumn(scope, field.clave, column.checked); onColumn(); };
  });
}

/** Clientes, Pedidos and Productos: the section goes in the side panel when it is open for that screen. */
export function paintSidePanelClassifiers(section: Element): void {
  const screen = screenOf(section), container = document.getElementById('tools')?.querySelector('.htclas');
  if (screen && container && componentsLegacy.sidePanelOpen() && sidePanel.context() === `ht-${section.id.replace('v-', '')}`)
    void paintClassifiers(container, screen.amb, { state: screen.estado(), onChange: screen.recargar, onColumn: screen.recargar });
}
