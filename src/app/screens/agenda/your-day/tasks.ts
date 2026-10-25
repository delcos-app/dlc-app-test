/** The own tasks and notes of the day in «Tu día» (painted after the appointments, so they do not delay them), and their folding. */
import { agendaState, legacyDb, notices } from '../../../legacy/bridge';
import { t } from '../../../i18n';
import { escapeHtml } from '../../../services/format';
import { timeText } from './card';

const FOLDED_KEY = 'delcos-tareas-plegadas';

function folded(): boolean {
  try { return localStorage.getItem(FOLDED_KEY) === '1'; } catch { return false; }
}

function taskRow(task: DayTask, list: readonly DayTask[]): string {
  const moves = list.length > 1
    ? `<span class="tdtmov"><button type="button" class="kmv" data-tamov="-1|${task.id}" aria-label="${t('agenda.tasks.up')}" ${list[0] === task ? 'disabled' : ''}>↑</button><button type="button" class="kmv" data-tamov="1|${task.id}" aria-label="${t('agenda.tasks.down')}" ${list[list.length - 1] === task ? 'disabled' : ''}>↓</button></span>` : '';
  return `
    <div class="tdtarea ${task.hecha ? 'hecha' : ''}" data-tarea="${task.id}">
      <label class="tdtchk"><input type="checkbox" data-tacheck="${task.id}" ${task.hecha ? 'checked' : ''} aria-label="${t('agenda.tasks.done')}"></label>
      <span class="tdth">${task.hora ? timeText(task.hora) : ''}</span>
      <span class="tdttx"><b>${escapeHtml(task.titulo)}</b>${task.nota ? `<span class="sm">${escapeHtml(task.nota)}</span>` : ''}</span>
      ${moves}
    </div>`;
}

async function markDone(box: HTMLInputElement): Promise<void> {
  const { error } = await legacyDb().from('tareas').update({ hecha: box.checked, modificado_en: new Date().toISOString() }).eq('id', box.dataset.tacheck);
  if (error) { notices.toast(t('agenda.tasks.couldNotSave'), true); box.checked = !box.checked; return; }
  box.closest('.tdtarea')?.classList.toggle('hecha', box.checked);
  agendaState.forgetDayTasks();
}

function bind(block: HTMLElement): void {
  block.querySelectorAll<HTMLInputElement>('[data-tacheck]').forEach(box => { box.onchange = (event): void => { event.stopPropagation(); void markDone(box); }; });
}

/** Paints the tasks above the appointments (or above the «no cabe» banner). */
export function paintTasks(body: HTMLElement, list: readonly DayTask[] | null): void {
  document.getElementById('tdtareas')?.remove();
  if (!list?.length) return;
  const place = document.getElementById('tdnocabe') ?? body.querySelector('.tdesc, .vacio');
  const html = `<div class="tdtareas" id="tdtareas"><div class="tdtcab">${t('agenda.tasks.title', { count: list.length })}</div>${list.map(task => taskRow(task, list)).join('')}</div>`;
  if (place) place.insertAdjacentHTML('beforebegin', html); else body.insertAdjacentHTML('beforeend', html);
  const block = document.getElementById('tdtareas'); if (block) bind(block);
}

/** The tasks header folds and unfolds them; remembered on this device. */
export function applyTaskFolding(): void {
  const block = document.getElementById('tdtareas'), header = block?.querySelector<HTMLElement & { foldBound?: boolean }>('.tdtcab');
  if (!block || !header) return;
  block.classList.toggle('plegadas', folded());
  header.setAttribute('role', 'button'); header.tabIndex = 0;
  header.setAttribute('aria-expanded', String(!folded())); header.title = t(folded() ? 'agenda.tasks.show' : 'agenda.tasks.hide');
  if (header.foldBound) return;
  header.foldBound = true;
  const toggle = (): void => { try { localStorage.setItem(FOLDED_KEY, folded() ? '0' : '1'); } catch { /* not remembered */ } applyTaskFolding(); };
  header.onclick = toggle;
  header.onkeydown = (event): void => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggle(); } };
}
