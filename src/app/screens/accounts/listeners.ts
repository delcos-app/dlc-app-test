/**
 * The listeners of Cuentas installed at start-up (main.ts). They stay in the core and only say what was pressed; what it does is
 * in the chunk (plan 7.3, cut D2): Duplicados, the day pickers of the editor, the state select of the card and the map cards. The
 * column resize stays here whole: it has to stop the browser's own drag at once (preventDefault), and repaints the header from the
 * chunk, which is loaded whenever there is a list with columns.
 */
import { currentScreen } from '../../legacy/bridge';
import { columnSettings, saveColumns } from './list/columns';
import { answerDayPickerClick, answerDuplicatesClick, changeState, paintAccountsHeader } from './lazy';

const MIN_WIDTH = 80, MAX_WIDTH = 600;
interface Drag { key: string; startX: number; startWidth: number; settings: ColumnSetting[] }

/** Duplicados: a tab, and on its page comparing a pair, opening a card or marking a pair as different. */
export function listenToDuplicates(): void {
  document.addEventListener('click', event => {
    const target = event.target as Element | null; if (!target) return;
    const onPage = currentScreen() === 'duplicados' && target.closest('[data-dcmp], [data-dver], [data-ddes]');
    if (target.closest('#duppest [data-dpest]') || onPage) void answerDuplicatesClick(target);
  });
}

/** Morning/afternoon buttons and the quick buttons of any day picker. */
export function listenToDayPickers(): void {
  document.addEventListener('click', event => {
    const target = event.target as Element | null;
    if (target?.closest('[data-dt], [data-qk]')?.closest('.dp')) void answerDayPickerClick(target);
  });
}

/** A commercial state chosen in any [data-estado] select. */
export function listenToStateSelects(): void {
  document.addEventListener('change', event => {
    const select = (event.target as Element | null)?.closest<HTMLSelectElement>('[data-estado]');
    if (select) void changeState(select.dataset.estado ?? '', select.value);
  });
}

/** «Ver ficha» in the popup of a map point. */
export function listenToMapCards(open: (id: string) => void): void {
  document.addEventListener('click', event => {
    const link = (event.target as Element | null)?.closest<HTMLElement>('[data-mapficha]');
    if (!link) return;
    event.preventDefault(); open(link.dataset.mapficha ?? '');
  });
}

/** Dragging the border of a header changes the width of its column (saved at once). */
export function listenToColumnResize(): void {
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
    void paintAccountsHeader();
    const visible = settings.filter(item => item.on);
    document.querySelectorAll('#lista .trow').forEach(row => {
      [...row.children].forEach((cellElement, index) => { const column = visible[index]; if (column && cellElement instanceof HTMLElement) { cellElement.style.width = `${column.w}px`; cellElement.style.minWidth = `${column.w}px`; } });
    });
  });
  document.addEventListener('pointerup', () => { if (drag) { drag = null; document.body.style.cursor = ''; } });
}
