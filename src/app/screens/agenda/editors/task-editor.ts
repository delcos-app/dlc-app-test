/**
 * The window of an own task (a note or task for a day, without a client): new, edit, delete; a done one opens read-only with
 * «Volver a pendiente». Migrated from the legacy editarTareaBase / editarTarea (v2.400.0).
 */
import { agendaState, legacyDb, notices } from '../../../legacy/bridge';
import { t } from '../../../i18n';
import { todayIso } from '../../../services/dates';
import { formatDayMonth, formatLongDate } from '../../../services/date-format';
import { escapeHtml } from '../../../services/format';
import { paintYourDay } from '../your-day';

export interface TaskData { readonly id?: string; readonly titulo?: string; readonly fecha?: string; readonly hora?: string | null; readonly nota?: string | null; readonly hecha?: boolean | null }

const dialog = (): HTMLDialogElement | null => document.getElementById('dlg') as HTMLDialogElement | null;
const value = (id: string): string => (document.getElementById(id) as HTMLInputElement | null)?.value ?? '';

function afterChange(message: string): void {
  dialog()?.close(); notices.toast(message); agendaState.forgetDayTasks(); void paintYourDay();
}

async function remove(task: TaskData): Promise<void> {
  if (!await notices.confirm(t('agenda.taskEditor.deleteText'), { titulo: t('agenda.taskEditor.deleteTitle'), ok: t('agenda.taskEditor.delete'), peligro: true })) return;
  const { error } = await legacyDb().from('tareas').delete().eq('id', task.id);
  if (error) { notices.toast(t('agenda.taskEditor.couldNotDelete'), true); return; }
  afterChange(t('agenda.taskEditor.deleted'));
}

async function save(task: TaskData, button: HTMLButtonElement): Promise<void> {
  const title = value('tat').trim();
  if (!title) { notices.toast(t('agenda.taskEditor.writeWhat'), true); document.getElementById('tat')?.focus(); return; }
  const row = { titulo: title, fecha: value('taf') || todayIso(), hora: value('tah') || null, nota: value('tan').trim() || null, modificado_en: new Date().toISOString() };
  button.disabled = true;
  const table = legacyDb().from('tareas');
  const { error } = task.id ? await table.update(row).eq('id', task.id) : await table.insert(row);
  button.disabled = false;
  if (error) { notices.toast(t('agenda.sheet.couldNotSave', { error: (error as { message?: string }).message ?? '' }), true); return; }
  afterChange(task.id ? t('agenda.taskEditor.saved') : t('agenda.taskEditor.addedOn', { date: formatDayMonth(row.fecha) }));
}

function editHtml(task: TaskData, day: string | null | undefined): string {
  const time = task.hora ? String(task.hora).slice(0, 5) : '';
  return `
    <div class="fh"><div><h2>${t(task.id ? 'agenda.taskEditor.title' : 'agenda.taskEditor.newTitle')}</h2><div class="sm">${t('agenda.taskEditor.subtitle')}</div></div>
      <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
    <label for="tat">${t('agenda.taskEditor.what')}</label><input id="tat" value="${escapeHtml(task.titulo ?? '')}" placeholder="${t('agenda.taskEditor.whatPlaceholder')}" maxlength="160">
    <div class="g2">
      <div><label for="taf">${t('agenda.editor.day')}</label><input id="taf" type="date" value="${escapeHtml(task.fecha ?? day ?? todayIso())}"></div>
      <div><label for="tah">${t('agenda.editor.time')} <span class="sm">${t('agenda.editor.optional')}</span></label><input id="tah" type="time" value="${escapeHtml(time)}"></div>
    </div>
    <label for="tan">${t('agenda.editor.notes')}</label><textarea id="tan" rows="3">${escapeHtml(task.nota ?? '')}</textarea>
    <div class="acts u-between">
      ${task.id ? `<button type="button" class="btn sec peligro" id="taborrar">${t('agenda.taskEditor.delete')}</button>` : '<span></span>'}
      <span class="u-flex u-gap-8"><button type="button" class="btn sec" data-cerrar>${t('agenda.editor.cancel')}</button><button type="button" class="btn" id="taok">${t(task.id ? 'agenda.taskEditor.save' : 'agenda.taskEditor.add')}</button></span></div>`;
}

function doneHtml(task: TaskData): string {
  return `
    <div class="fh"><div><h2>${t('agenda.taskEditor.doneTitle')}</h2><div class="sm">${escapeHtml(formatLongDate(task.fecha ?? todayIso()))}${task.hora ? ` · ${escapeHtml(String(task.hora).slice(0, 5))}` : ''}</div></div>
      <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
    <div class="tarlec"><span class="tarok">${t('agenda.taskEditor.done')}</span><b>${escapeHtml(task.titulo ?? '')}</b>${task.nota ? `<p>${escapeHtml(task.nota)}</p>` : ''}</div>
    <div class="acts u-between">
      <button type="button" class="btn sec peligro" id="taborrar">${t('agenda.taskEditor.delete')}</button>
      <span class="u-flex u-gap-8"><button type="button" class="btn sec" data-cerrar>${t('common.close')}</button><button type="button" class="btn" id="tareabrir">${t('agenda.taskEditor.reopen')}</button></span></div>`;
}

async function reopen(task: TaskData, day: string | null | undefined, button: HTMLButtonElement): Promise<void> {
  button.disabled = true;
  const { error } = await legacyDb().from('tareas').update({ hecha: false, modificado_en: new Date().toISOString() }).eq('id', task.id);
  button.disabled = false;
  if (error) { notices.toast(t('agenda.taskEditor.couldNotChange'), true); return; }
  agendaState.forgetDayTasks(); void paintYourDay();
  editTask({ ...task, hecha: false }, day);
}

function show(): void {
  const box = dialog(); if (!box) return;
  box.classList.add('pequena');
  if (!box.open) box.showModal();
}

/** Opens a task (new when `task` is empty), for the day `day`. */
export function editTask(task?: TaskData | null, day?: string | null): void {
  const body = document.getElementById('dbody'); if (!body) return;
  const current = task ?? {};
  body.innerHTML = current.id && current.hecha ? doneHtml(current) : editHtml(current, day);
  const ok = document.getElementById('taok') as HTMLButtonElement | null; if (ok) ok.onclick = (): void => { void save(current, ok); };
  const again = document.getElementById('tareabrir') as HTMLButtonElement | null; if (again) again.onclick = (): void => { void reopen(current, day, again); };
  const erase = document.getElementById('taborrar'); if (erase) erase.onclick = (): void => { void remove(current); };
  show();
}

