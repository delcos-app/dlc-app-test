/**
 * The buttons of «Tu día», answered in one place (one listener for the whole app): each card (data-td="action|id": menu, record
 * the visit, a new date, up and down), the task arrows (data-tamov) and «Ordenar por cercanía» (also in the «no cabe» banner).
 * Migrated from the card buttons listener of legado 022 (v2.399.0).
 */
import { agendaCache, appointmentLegacy, legacyAgenda, yourDayLegacy } from '../../../legacy/bridge';
import { openMenu } from '../appointment-menu';
import { isOpen } from '../appointment-state';
import { editTask } from '../editors/task-editor';
import { moveAppointment, moveTask, orderByDistance } from './reorder';
import { newDateAfterAbsent } from '../absent';

function swapWithNeighbour(item: AgendaAppointment, action: 'sube' | 'baja'): void {
  const all = legacyAgenda.dayAppointments() as AgendaAppointment[], open = all.filter(entry => isOpen(entry.estado));
  const from = open.indexOf(item), to = action === 'sube' ? from - 1 : from + 1;
  const neighbour = open[to];
  if (!neighbour) return;
  open[from] = neighbour; open[to] = item;
  void moveAppointment([...all.filter(entry => !isOpen(entry.estado)), ...open], item.id, action);
}

/** The buttons of the cards (data-td="action|id"): menu, record the visit, a new date, up and down; and «Ordenar por cercanía»
 * (also from the «no cabe» banner). Installed once. */
function cardButton(button: HTMLElement): void {
  const [action = '', id = ''] = (button.dataset.td ?? '').split('|');
  const item = legacyAgenda.dayAppointments().find(entry => entry.id === id) as SheetAppointment | undefined;
  if (!item) return;
  if (action === 'mas') openMenu(button, item);
  else if (action === 'visita') { if (yourDayLegacy.canRecordOn(item.fecha)) appointmentLegacy.recordVisit(item.cuenta_id, item.fecha); }
  else if (action === 'nueva') void newDateAfterAbsent(item);
  else if (action === 'sube' || action === 'baja') swapWithNeighbour(item, action);
}

/** A task opens its window (not when pressing its tick or its arrows). */
function taskRow(row: HTMLElement, target: Element): void {
  if (target.closest('.tdtchk, .tdtmov')) return;
  const day = legacyAgenda.selectedDate();
  editTask((agendaCache.dayTasks(day ?? '') ?? []).find(task => task.id === row.dataset.tarea), day);
}

function taskArrow(arrow: HTMLElement): void {
  const [direction = '0', id = ''] = (arrow.dataset.tamov ?? '').split('|');
  void moveTask(id, Number(direction));
}

export function listenToCards(): void {
  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    if (target.closest('#tdordenar, #tdnocord')) { void orderByDistance(); return; }
    const arrow = target.closest<HTMLElement>('[data-tamov]');
    if (arrow) { taskArrow(arrow); return; }
    if (target.closest('#tdtarea')) { editTask(null, legacyAgenda.selectedDate()); return; }
    const row = target.closest<HTMLElement>('#tdtareas .tdtarea');
    if (row) { taskRow(row, target); return; }
    const button = target.closest<HTMLElement>('[data-td]');
    if (button) { event.stopPropagation(); cardButton(button); }
  });
}

