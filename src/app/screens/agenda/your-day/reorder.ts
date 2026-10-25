/**
 * Order and quiet repaints of «Tu día»: move an appointment or a task up or down (painted at once, saved behind), repaint the
 * day without jumps (the cards glide to their place) and the quiet refresh after a change elsewhere.
 * Migrated from the legacy guardarOrden / moverCitaLocal(Base, Base2) / moverTarea / repintarDiaSuave(Base) / tdPosiciones /
 * tdAnimar / agRefrescoQuieto (v2.399.0). agRefrescoQuieto stays as an adapter (five legacy files call it).
 */
import { agendaCache, appointmentLegacy, currentScreen, legacyAgenda, legacyDb, notices } from '../../../legacy/bridge';
import { positionsOf, slideIntoPlace } from '../../../components/slide';
import { t } from '../../../i18n';
import { load as loadHome } from '../../home';
import { loadAgenda, refreshAfterChange } from '../day-view';
import { paintYourDay } from './index';
import { paintRouteBar } from '../../routes/page';
import { orderByDistance as orderByNearness } from '../../routes/planner/visits';

const CARDS = '#agcuerpo .tdu[data-tdu]', TASKS = '#tdtareas .tdtarea';
const REPAINT_SLIDE_MS = 320, MOVE_SLIDE_MS = 260, QUIET_DELAY_MS = 40;

/** Saves the order of the appointments of a day (ordenar_citas). */
export async function saveOrder(list: readonly { id: string }[]): Promise<boolean> {
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean }>('ordenar_citas', { p_ids: list.map(item => item.id) });
  if (error || result?.ok === false) { notices.toast(t('agenda.yourDay.couldNotSaveOrder'), true); return false; }
  return true;
}

/** Paints «Tu día» again without jumps; with `data`, from that data (no network). */
export async function repaintSmoothly(id?: string | null, data?: AgendaAppointment[]): Promise<void> {
  const before = positionsOf(CARDS, 'tdu'), day = legacyAgenda.selectedDate();
  agendaCache.forget();
  if (data && day) agendaCache.preset(day, data);
  const body = document.getElementById('agcuerpo'), scroll = window.scrollY;
  if (body) body.style.minHeight = `${body.offsetHeight}px`;   // while repainting, the box does not shrink
  try { await paintYourDay(); } finally { const fresh = document.getElementById('agcuerpo'); if (fresh) fresh.style.minHeight = ''; }
  window.scrollTo({ top: scroll });
  slideIntoPlace(before, { selector: CARDS, key: 'tdu', touched: id, durationMs: REPAINT_SLIDE_MS });
}

let quietTimer: ReturnType<typeof setTimeout> | null = null, quietId: string | null = null;

/** After a change: repaints the day quietly (and the figures, unless `figures` is false); outside the day view, reloads. */
export function refreshQuietly(id?: string | null, figures = true): void {
  if (currentScreen() !== 'agenda' || !appointmentLegacy.isJoinedDayView() || !document.getElementById('agcuerpo')) {
    void loadAgenda(); void loadHome(); void paintRouteBar(); return;
  }
  agendaCache.markDialogSeen();
  if (id) quietId = id;
  if (quietTimer) clearTimeout(quietTimer);
  quietTimer = setTimeout(() => {
    const touched = quietId; quietId = null;
    void repaintSmoothly(touched).then(() => { if (figures) refreshAfterChange(); void paintRouteBar(); });
  }, QUIET_DELAY_MS);
}

function focusMoved(id: string, action: string): void {
  const button = document.querySelector<HTMLElement>(`#agcuerpo .tdu [data-td="${action}|${id}"]:not([disabled])`) ?? document.querySelector<HTMLElement>(`#agcuerpo .tdu [data-td$="|${id}"]`);
  button?.focus({ preventScroll: true });
}

/** Moves an appointment up or down: painted at once from the data in hand, then saved (reloaded if saving fails). */
export async function moveAppointment(order: AgendaAppointment[], id: string, action: string): Promise<void> {
  const day = legacyAgenda.selectedDate() ?? '', known = agendaCache.dayData(day);
  if (!agendaCache.lastPainted(day) && known) agendaCache.setLastPainted(day, known);
  const before = positionsOf(CARDS, 'tdu'), last = agendaCache.lastPainted(day);
  if (!last) { if (await saveOrder(order)) await loadAgenda(); return; }
  const ids = new Set(order.map(item => item.id));
  agendaCache.preset(day, [...order, ...last.filter(item => !ids.has(item.id))]);
  const scroll = window.scrollY;
  await paintYourDay();
  window.scrollTo({ top: scroll });
  slideIntoPlace(before, { selector: CARDS, key: 'tdu', touched: id, durationMs: MOVE_SLIDE_MS });
  focusMoved(id, action);
  if (!(await saveOrder(order))) await loadAgenda();
}

/** The tasks with `id` swapped with its neighbour (and their order numbers), or null if it cannot move that way. */
function swappedTasks(list: readonly (DayTask & { orden?: number })[], id: string, direction: number): (DayTask & { orden?: number })[] | null {
  const from = list.findIndex(task => task.id === id), to = from + direction;
  const order = list.slice(), moved = order[from], other = order[to];
  if (from < 0 || !moved || !other) return null;
  order[from] = other; order[to] = moved;
  order.forEach((task, index) => { task.orden = index + 1; });
  return order;
}

/** Moves a task up or down among the tasks of the day, then saves the order (ordenar_tareas). */
export async function moveTask(id: string, direction: number): Promise<void> {
  const day = legacyAgenda.selectedDate() ?? '', list = agendaCache.dayTasks(day);
  const order = list ? swappedTasks(list, id, direction) : null;
  if (!order) return;
  agendaCache.setDayTasks(day, order);
  const before = positionsOf(TASKS, 'tarea');
  await repaintSmoothly(null, agendaCache.lastPainted(day) ?? undefined);
  slideIntoPlace(before, { selector: TASKS, key: 'tarea', touched: id, durationMs: REPAINT_SLIDE_MS });
  const button = document.querySelector<HTMLElement>(`#tdtareas [data-tamov="${direction}|${id}"]:not([disabled])`) ?? document.querySelector<HTMLElement>(`#tdtareas [data-tamov$="|${id}"]:not([disabled])`);
  button?.focus({ preventScroll: true });
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean }>('ordenar_tareas', { p_ids: order.map(task => task.id) });
  if (error || result?.ok === false) { notices.toast(t('agenda.yourDay.couldNotSaveOrder'), true); agendaCache.setDayTasks(day, null); refreshQuietly(null, false); }
}

/** «Ordenar por cercanía»: the open appointments in the order with fewer kilometres (fixed times respected), saved. */
export async function orderByDistance(): Promise<void> {
  const { list, left } = orderByNearness(legacyAgenda.dayAppointments() as unknown as RouteAppointment[]);
  if (!await saveOrder(list as { id: string }[])) return;
  notices.toast(left ? t('agenda.yourDay.orderedWithLeft', { count: left }) : t('agenda.yourDay.ordered'));
  await repaintSmoothly();
}
