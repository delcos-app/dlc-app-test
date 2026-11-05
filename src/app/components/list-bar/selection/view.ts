/**
 * The selection on top of a list table (D-048, v2.472.0, variant A; docs/seleccion_listas.md). On the computer: the checkbox column
 * and, with something selected, the list bar turned into the action bar. On the phone (M11 A): nothing; a long press on a row only
 * says that bulk actions are done from the computer (E6 A). Called by the list bar each time it adjusts the screen.
 */
import { notices } from '../../../legacy/bridge';
import { canExport } from '../../../services/files';
import { canManageOrganization } from '../../../core/permissions';
import { t } from '../../../i18n';
import { allowedActions, BAR_CLASSES, paintBar, removeBar } from './bar';
import { CLASSES, idOf, pageRowOf, paintChecks, removeChecks, rowsOf } from './checks';
import { exportSelection } from './export';
import { runAction } from './run';
import { clearSelection, pageOf, selectionOf, setRows, SELECTION_LIMIT } from './source';
import type { SelectionConfig } from './types';

const DESKTOP = '(min-width: 761px)', LONG_PRESS_MS = 500, MOVE_TOLERANCE = 10;

export const isDesktop = (): boolean => window.matchMedia(DESKTOP).matches;

/** The database records exports (SQL 196), known after the first question; the role is checked at each paint. */
let exportRecorded = false;

const exportAllowed = (): boolean => exportRecorded && canManageOrganization();

/** Whether this list shows its selection to this person here (computer, and something to do). */
export const showsSelection = (config: SelectionConfig): boolean => isDesktop() && (allowedActions(config).length > 0 || exportAllowed());

/** The lists painted with their selection: Escape and the clicks act on these. */
const active = new Map<string, { section: HTMLElement; config: SelectionConfig }>();

const limitNotice = (): void => { notices.toast(t('listSelection.limit', { count: SELECTION_LIMIT }), true); };

export function paintSelection(section: HTMLElement, config: SelectionConfig): void {
  const state = selectionOf(config.key), page = pageOf(config.key);
  bindOnce(section, config);
  askExport(section, config);
  if (!page || !showsSelection(config)) {
    removeChecks(section, config); removeBar(section);
    if (!isDesktop()) clearSelection(state);
    active.delete(config.key); return;
  }
  active.set(config.key, { section, config });
  paintChecks(section, config, state, page);
  paintBar(section, config, { state, page, canExport: exportAllowed() });
}

let asked = false;

/** Once someone who may export is in: whether the database records exports (SQL 196); then the bar is painted again. */
function askExport(section: HTMLElement, config: SelectionConfig): void {
  if (asked || !isDesktop() || !canManageOrganization()) return;
  asked = true;
  void canExport().then(allowed => { exportRecorded = allowed; if (allowed) paintSelection(section, config); });
}

/** A row's box: marks or unmarks it (Shift + click: from the last one touched to this one, on this page). */
function toggleRow(section: HTMLElement, config: SelectionConfig, box: HTMLInputElement, range: boolean): void {
  const state = selectionOf(config.key), page = pageOf(config.key), element = box.closest<HTMLElement>(config.shape.rows);
  const row = element && page ? pageRowOf(element, config, page) : undefined;
  if (!row || !page) return;
  const ids = rowsOf(section, config).map(item => idOf(item, config)), from = state.anchor ? ids.indexOf(state.anchor) : -1, to = ids.indexOf(row.id);
  const inRange = (id: string): boolean => { const at = ids.indexOf(id); return at >= Math.min(from, to) && at <= Math.max(from, to); };
  const chosen = range && from >= 0 && to >= 0 ? page.rows.filter(item => inRange(item.id)) : [row];
  if (!setRows(state, chosen, box.checked)) limitNotice();
  state.anchor = row.id;
  paintSelection(section, config);
}

function togglePage(section: HTMLElement, config: SelectionConfig, box: HTMLInputElement): void {
  const page = pageOf(config.key);
  if (page && !setRows(selectionOf(config.key), page.rows, box.checked)) limitNotice();
  paintSelection(section, config);
}

async function selectAllOfFilter(section: HTMLElement, config: SelectionConfig): Promise<void> {
  const page = pageOf(config.key); if (!page?.all) return;
  const rows = await page.all(SELECTION_LIMIT);
  if (!setRows(selectionOf(config.key), rows, true) || page.total > SELECTION_LIMIT) notices.toast(t('listSelection.limitFilter', { count: SELECTION_LIMIT }), true);
  paintSelection(section, config);
}

async function startAction(section: HTMLElement, config: SelectionConfig, id: string): Promise<void> {
  const state = selectionOf(config.key), action = allowedActions(config).find(item => item.id === id);
  if (!action || state.running) return;
  const progress = (text: string): void => { state.running = text; paintSelection(section, config); };
  if (await runAction(state, action, progress)) config.reload();
  paintSelection(section, config);
}

/** Clicks on the bar's buttons. */
function onBarClick(target: Element, section: HTMLElement, config: SelectionConfig): void {
  const state = selectionOf(config.key), page = pageOf(config.key);
  if (target.closest(`.${BAR_CLASSES.clear}`)) { clearSelection(state); paintSelection(section, config); return; }
  if (target.closest(`.${BAR_CLASSES.allOfFilter}`)) { void selectAllOfFilter(section, config); return; }
  if (target.closest(`[data-${BAR_CLASSES.exportButton}]`)) { if (page) void exportSelection(section, config, state, page); return; }
  const button = target.closest<HTMLElement>(`[data-${BAR_CLASSES.action}]`);
  if (button) void startAction(section, config, button.dataset[BAR_CLASSES.action] ?? '');
}

/** A click on a box never opens the row underneath; while an action runs, the boxes do not change. */
function onClick(event: MouseEvent, section: HTMLElement, config: SelectionConfig): void {
  const target = event.target as Element;
  if (target.closest(`.${CLASSES.cell}`)) {
    event.stopPropagation();
    if (selectionOf(config.key).running) { event.preventDefault(); return; }
    if (target.matches(`.${CLASSES.rowBox}`)) toggleRow(section, config, target as HTMLInputElement, event.shiftKey);
    else if (target.matches(`.${CLASSES.pageBox}`)) togglePage(section, config, target as HTMLInputElement);
    return;
  }
  if (target.closest('.plselbar')) onBarClick(target, section, config);
}

/** Phone: a long press on a row says that bulk actions are done from the computer (and does not open the row). */
function bindLongPress(section: HTMLElement, config: SelectionConfig): void {
  let timer = 0, fired = false, startX = 0, startY = 0;
  section.addEventListener('pointerdown', event => {
    if (isDesktop() || !(event.target as Element).closest(config.shape.rows) || !allowedActions(config).length) return;
    fired = false; startX = event.clientX; startY = event.clientY;
    timer = window.setTimeout(() => { fired = true; notices.toast(t('listSelection.useComputer')); }, LONG_PRESS_MS);
  });
  const cancel = (): void => { window.clearTimeout(timer); };
  const moved = (event: PointerEvent): boolean => Math.abs(event.clientX - startX) > MOVE_TOLERANCE || Math.abs(event.clientY - startY) > MOVE_TOLERANCE;
  section.addEventListener('pointermove', event => { if (moved(event)) cancel(); });
  section.addEventListener('pointerup', cancel);
  section.addEventListener('pointercancel', cancel);
  section.addEventListener('contextmenu', event => { if (fired) event.preventDefault(); });
  section.addEventListener('click', event => { if (fired) { fired = false; event.preventDefault(); event.stopPropagation(); } }, true);
}

function bindOnce(section: HTMLElement, config: SelectionConfig): void {
  if (section.dataset.plselbound?.split(' ').includes(config.key)) return;
  section.dataset.plselbound = `${section.dataset.plselbound ?? ''} ${config.key}`.trim();
  section.addEventListener('click', event => { if (active.get(config.key)?.section === section) onClick(event, section, config); }, true);
  bindLongPress(section, config);
  bindEscape();
}

let escapeBound = false;

/** Escape empties the selection of the list on screen (not while a window is open or an action runs). */
function bindEscape(): void {
  if (escapeBound) return;
  escapeBound = true;
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || document.querySelector('dialog[open]')) return;
    active.forEach(({ section, config }) => {
      const state = selectionOf(config.key);
      if (!section.isConnected || !state.rows.size || state.running || !section.querySelector('.pltool.plselon')) return;
      clearSelection(state); paintSelection(section, config);
    });
  });
}
