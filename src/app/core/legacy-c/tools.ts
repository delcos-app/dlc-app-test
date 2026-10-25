/**
 * «Filtros y columnas» and the second side panel of columns: the panel follows the screen (v2.53.0/v2.54.0), the columns are chosen in a
 * second panel with «Restablecer los anchos» (v2.55.0/v2.56.0), custom field columns are chosen in Clasificadores (v2.88.0), and
 * «Guardar filtro como indicador» goes into the panel (v2.52.0). Folded from legado 053, 054, 055, 056, 057, 065 and 074 (v2.425.0):
 * the layers abrirHerramientasBase2/Base3 and panelColumnasBase/Base2 are now one function each.
 */
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';
import { byId, closestTo, currentSection, observe } from './dom';

const SAVE_FILTER_DELAY_MS = 60;
interface ColumnChoice { i: number; n: string; on?: boolean; fija?: boolean }
interface FieldFilters { campos?: Record<string, unknown> }

const filters = (): FieldFilters => F as unknown as FieldFilters;

/** v2.52.0: in Cuentas, «Guardar filtro como indicador» at the end of the side panel. */
function addSaveFilter(): void {
  // v2.203.0: the filters panel is the side panel (#tools), not a window
  const tools = byId('tools'), openDialog = document.querySelector<HTMLDialogElement>('dialog[open]');
  const container = tools?.classList.contains('abierto') ? tools : document.querySelector('dialog[open] .fh') ? openDialog : null;
  const save = byId('guardarFiltro');
  if (!container || container.querySelector('#hguardarf') || !save || TAB !== 'directorio') return;
  container.insertAdjacentHTML('beforeend', `<div class="acts" style="margin:12px 0 0"><button class="btn sec" id="hguardarf">${svgIco(ICON_NOM.star ?? '')} ${t('legacyC.tools.saveFilter')}</button></div>`);
  const button = byId('hguardarf');
  if (button) button.onclick = (): void => { if (container instanceof HTMLDialogElement) container.close(); else container.classList.remove('abierto'); save.click(); };
}

const repaintFields = (zone: Element): void => {
  const current = filters();
  current.campos ??= {};
  clasPintar(zone, 'medico', current.campos, () => buscar(true), () => buscar(true), 'h3');
};

/** Opens «Filtros y columnas» (the legacy abrirHerramientas): the second panel closes, and in Cuentas the custom fields go before Columnas. */
export function openTools(context: string, ...rest: unknown[]): unknown {
  byId('tools2')?.classList.remove('abierto');
  const result = abrirHerramientasBase(context, ...rest);
  setTimeout(addSaveFilter, SAVE_FILTER_DELAY_MS);
  const tools = byId('tools'), zone = tools?.querySelector('.tfcampos');
  if (context === 'directorio' && tools && zone && tools.classList.contains('abierto')) {
    const columns = [...tools.querySelectorAll('h3')].find(heading => (heading.textContent ?? '').trim() === t('legacyC.tools.columnsHeading'));
    columns?.before(zone);
    repaintFields(zone);
  }
  return result;
}

/** v2.88.0: removing a custom field chip in Cuentas searches again and repaints the fields of the open panel. */
export function listenToFieldChips(): void {
  byId('chips')?.addEventListener('click', event => {
    const chip = closestTo(event.target, '[data-xcp]'); if (!chip) return;
    const current = filters();
    if (current.campos) Reflect.deleteProperty(current.campos, chip.dataset.xcp ?? '');
    buscar(true);
    const tools = byId('tools'), zone = tools?.querySelector('.tfcampos');
    if (zone && tools?.classList.contains('abierto')) repaintFields(zone);
  });
}

function paintColumnsPanel(panel: HTMLElement, title: string, columns: readonly ColumnChoice[], onChange: (index: number, on: boolean) => void): void {
  panel.innerHTML = `<div class="tbox"><button class="t2volver" id="t2volver" type="button">${t('legacyC.tools.back')}</button>
    <div class="fh"><h2>${escapeHtml(title)}</h2><button class="x" id="t2cerrar" aria-label="${t('common.close')}">✕</button></div>
    <p class="sm">${t('legacyC.tools.columnsHint')}</p>
    <div class="t2cols">${columns.map(column => `<label class="opt"><input type="checkbox" data-t2c="${column.i}" ${column.on ? 'checked' : ''} ${column.fija ? 'disabled' : ''}> ${escapeHtml(column.n)}</label>`).join('')}</div></div>`;
  panel.querySelectorAll<HTMLInputElement>('[data-t2c]').forEach(box => { box.onchange = (): void => { onChange(Number(box.dataset.t2c), box.checked); }; });
  const back = byId('t2volver'); if (back) back.onclick = (): void => { panel.classList.remove('abierto'); };
  const close = byId('t2cerrar'); if (close) close.onclick = (): void => { panel.classList.remove('abierto'); byId('tools')?.classList.remove('abierto'); };
  panel.classList.add('abierto');
}

/** v2.56.0: «Restablecer los anchos» at the end of the columns panel. */
function addResetWidths(grid: HTMLElement): void {
  byId('tools2')?.querySelector('.tbox')?.insertAdjacentHTML('beforeend', `<div class="acts"><button class="btn sec" type="button" id="t2anchos">${t('legacyC.tools.resetWidths')}</button></div>`);
  const reset = byId('t2anchos');
  if (reset) reset.onclick = (): void => {
    localStorage.removeItem(claveAnchos(htTipo(grid))); grid.style.minWidth = ''; delete grid.dataset.ht; htAplicarColumnas(grid); toast(t('legacyC.tools.widthsReset'));
  };
}

/** The second side panel to choose columns (the legacy panelColumnas): custom field columns are chosen in Clasificadores. */
export function showColumnsPanel(title: string, columns: readonly ColumnChoice[], onChange: (index: number, on: boolean) => void): void {
  const grid = currentSection()?.querySelector<HTMLElement>('.dgrid');
  const header = grid ? [...(grid.querySelector(':scope > .dh')?.children ?? [])] : [];
  const panel = byId('tools2'); if (!panel) return;
  paintColumnsPanel(panel, title, columns.filter(column => !header[column.i]?.classList.contains('cpcol')), onChange);
  if (grid) addResetWidths(grid);
}

/** v2.55.0: the second side panel and the backdrop that closes both panels. */
export function createColumnsPanel(): void {
  if (byId('tools2')) return;
  document.body.insertAdjacentHTML('beforeend', `<div class="tools tools2" id="tools2" aria-label="${t('legacyC.tools.columnsHeading')}"></div><div class="toolsfondo hide" id="toolsfondo"></div>`);
  const tools = byId('tools'), second = byId('tools2'), backdrop = byId('toolsfondo');
  backdrop?.addEventListener('pointerdown', () => { second?.classList.remove('abierto'); tools?.classList.remove('abierto'); });
  const toggle = (): void => { backdrop?.classList.toggle('hide', !(Boolean(tools?.classList.contains('abierto')) || Boolean(second?.classList.contains('abierto')))); };
  observe(tools, toggle, { attributes: true, attributeFilter: ['class'] });
  observe(second, toggle, { attributes: true, attributeFilter: ['class'] });
}

/** v2.53.0: «Filtros y columnas» is prepared on every screen whenever it changes. */
export function prepareToolsOnChanges(): void {
  observe(document.querySelector('main'), () => {
    if (HT_PEND) return; HT_PEND = true;
    queueMicrotask(() => { HT_PEND = false; const section = currentSection(); if (section && !section.classList.contains('hide')) htPreparar(section); });
  }, { childList: true, subtree: true });
}

/** v2.54.0: closing the side panel gives the screen its filters back; the button is placed on every change. */
export function placeToolsButton(): void {
  const tools = byId('tools');
  observe(tools, () => { if (!tools?.classList.contains('abierto')) htDevolver(); }, { attributes: true, attributeFilter: ['class'] });
  observe(document.querySelector('main'), () => {
    if (HT2_PEND) return; HT2_PEND = true;
    queueMicrotask(() => { HT2_PEND = false; const section = currentSection(); if (section) htColocarBoton(section); });
  }, { childList: true, subtree: true });
}

/** v2.143.0/v2.20x: which filters go into «Filtros y columnas» in Pedidos and Analítica. */
export function setPanelFilters(): void {
  const panelFilters = HT_FILTROS as Record<string, string>;
  panelFilters.ventas = '#v-ventas .filtros';
  Object.defineProperty(panelFilters, 'analitica', { configurable: true, enumerable: true,
    get: (): string => (ANSEC === 'explorar' ? '#v-analitica .panel > .filtros' : '#anfil') });
}

const MIN_COLUMN_PX = 60;

/** v2.56.0: the columns of a table are widened by dragging their edge, and the widths are remembered per person. */
export function resizeColumnsByDragging(): void {
  document.addEventListener('pointerdown', event => {
    const handle = closestTo(event.target, '.dgrid .colres'); if (!handle) return;
    event.preventDefault(); event.stopPropagation();
    const grid = handle.closest<HTMLElement>('.dgrid'), header = grid?.querySelector(':scope > .dh'); if (!grid || !header) return;
    const kind = htTipo(grid), index = Number(handle.dataset.colres), widths: Record<number, number> = {};
    [...header.children].forEach((cell, position) => { if (!cell.classList.contains('htno')) widths[position] = Math.round(cell.getBoundingClientRect().width); });
    const startX = event.clientX, startWidth = widths[index] ?? 0;
    const move = (moveEvent: PointerEvent): void => {
      widths[index] = Math.max(MIN_COLUMN_PX, Math.round(startWidth + moveEvent.clientX - startX));
      const tracks = (grid.dataset.colsBase ?? '').split(/\s+(?![^(]*\))/).filter(Boolean);
      grid.style.setProperty('--cols', [...tracks.keys()].map(position => (widths[position] !== undefined ? `${widths[position]}px` : null)).filter(Boolean).join(' '));
      grid.style.minWidth = 'max-content';
    };
    const drop = (): void => { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', drop); localStorage.setItem(claveAnchos(kind), JSON.stringify(widths)); };
    document.addEventListener('pointermove', move); document.addEventListener('pointerup', drop);
  }, true);
}
