/**
 * Choosing the columns of Cuentas: the second side panel (#tools2, over the filters one) to show, hide and order them, and
 * dragging the border of a header to change its width. Migrated from the legacy abrirColumnasBase / abrirColumnas (which
 * painted by swapping the ids of the two panels for a moment and then fixed its buttons with an observer) and the column
 * resize listeners of legado 008 (v2.406.0).
 */
import { legacyIcons, notices } from '../../../legacy/bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { columnDefinitions, columnSettings, resetColumns, saveColumns } from './columns';

const MIN_WIDTH = 80, MAX_WIDTH = 600;

function panelHtml(settings: readonly ColumnSetting[]): string {
  const definitions = columnDefinitions();
  const rows = settings.map((setting, index) => {
    const column = definitions.find(item => item.k === setting.k), fixed = Boolean(column?.fixed);
    return `<label class="item" style="cursor:pointer;margin:0">
          <input type="checkbox" data-con="${index}" ${setting.on ? 'checked' : ''} ${fixed ? 'disabled' : ''}>
          <span class="tx"><b>${escapeHtml(column?.t ?? setting.k)}</b>${fixed ? `<span class="sm">${t('accounts.columns.alwaysVisible')}</span>` : ''}</span>
          <span class="kord" style="flex-direction:row">
            <button type="button" class="kmv" data-cmv="${index}|-1" aria-label="${t('accounts.columns.up')}" ${index === 0 ? 'disabled' : ''}>${legacyIcons.arrow('arriba')}</button>
            <button type="button" class="kmv" data-cmv="${index}|1" aria-label="${t('accounts.columns.down')}" ${index === settings.length - 1 ? 'disabled' : ''}>${legacyIcons.arrow('abajo')}</button></span></label>`;
  }).join('');
  return `<div class="tbox">
      <div class="fh"><h2>${t('accounts.columns.panelTitle')}</h2><button class="x" id="tclose" aria-label="${t('common.close')}">✕</button></div>
      <button class="t2volver" id="tcvolver" style="margin:0 0 10px">${t('accounts.columns.back')}</button>
      <p class="sm">${t('accounts.columns.panelNote')}</p>
      <div class="lista tcols">${rows}</div>
      <div class="acts"><button class="btn sec" id="tcres">${t('accounts.columns.restore')}</button></div></div>`;
}

function bindPanel(filters: HTMLElement, panel: HTMLElement, settings: ColumnSetting[], apply: (list: ColumnSetting[]) => void): void {
  const close = panel.querySelector<HTMLElement>('#tclose'); if (close) close.onclick = (): void => { panel.classList.remove('abierto'); filters.classList.remove('abierto'); };
  const back = panel.querySelector<HTMLElement>('#tcvolver'); if (back) back.onclick = (): void => { panel.classList.remove('abierto'); };
  panel.querySelectorAll<HTMLInputElement>('[data-con]').forEach(box => {
    box.onchange = (): void => {
      const setting = settings[Number(box.dataset.con)]; if (!setting) return;
      setting.on = box.checked;
      if (!settings.some(item => item.on)) { box.checked = true; setting.on = true; notices.toast(t('accounts.columns.keepOne'), true); return; }
      apply(settings);
    };
  });
  panel.querySelectorAll<HTMLElement>('[data-cmv]').forEach(button => {
    button.onclick = (event): void => {
      event.preventDefault();
      const [from = 0, direction = 0] = (button.dataset.cmv ?? '').split('|').map(Number), to = from + direction;
      const moved = settings[from], other = settings[to];
      if (!moved || !other) return;
      settings[from] = other; settings[to] = moved;
      apply(settings); paint(filters, panel, settings, apply);
    };
  });
  const restore = panel.querySelector<HTMLElement>('#tcres');
  if (restore) restore.onclick = (): void => { resetColumns(); const fresh = columnSettings(); apply(fresh); paint(filters, panel, fresh, apply); };
}

function paint(filters: HTMLElement, panel: HTMLElement, settings: ColumnSetting[], apply: (list: ColumnSetting[]) => void): void {
  panel.innerHTML = panelHtml(settings);
  bindPanel(filters, panel, settings, apply);
}

/** Opens the columns panel over the filters one; every change applies at once (`onChange` searches again). */
export function openColumnsPanel(onChange: () => void): void {
  const filters = document.getElementById('tools'), panel = document.getElementById('tools2');
  if (!filters || !panel) return;
  const apply = (list: ColumnSetting[]): void => { saveColumns(list); onChange(); };
  paint(filters, panel, columnSettings(), apply);
  filters.classList.add('abierto'); panel.classList.add('abierto');
}

interface Drag { readonly key: string; readonly startX: number; readonly startWidth: number; readonly settings: ColumnSetting[] }

/** Dragging the border of a header changes the width of its column at once (header and rows), and it is remembered. */
export function listenToColumnResize(paintHeader: () => void): void {
  let drag: Drag | null = null;
  document.addEventListener('pointerdown', event => {
    const handle = event.target instanceof Element ? event.target.closest<HTMLElement>('i.res[data-res]') : null; if (!handle) return;
    const settings = columnSettings(), column = settings.find(item => item.k === handle.dataset.res);
    if (!column) return;
    event.preventDefault();
    drag = { key: column.k, startX: event.clientX, startWidth: column.w, settings };
    document.body.style.cursor = 'col-resize';
  });
  document.addEventListener('pointermove', event => {
    if (!drag) return;
    const width = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, Math.round(drag.startWidth + (event.clientX - drag.startX)))), key = drag.key;
    const settings = drag.settings.map(item => (item.k === key ? { ...item, w: width } : item));
    saveColumns(settings);
    paintHeader();
    const visible = settings.filter(item => item.on);
    document.querySelectorAll('#lista .trow').forEach(row => {
      [...row.children].forEach((cellElement, index) => { const column = visible[index]; if (column && cellElement instanceof HTMLElement) { cellElement.style.width = `${column.w}px`; cellElement.style.minWidth = `${column.w}px`; } });
    });
  });
  document.addEventListener('pointerup', () => { if (drag) { drag = null; document.body.style.cursor = ''; } });
}
