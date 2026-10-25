/** The window to create or edit an event. Migrated from the legacy editarEvento (v2.407.0); editarEvento stays as an adapter. */
import { cardSectionsLegacy, currentScreen, eventsLegacy, legacyDb, notices, relatedLegacy, salesTeam } from '../../legacy/bridge';
import { t } from '../../i18n';
import { todayIso } from '../../services/dates';
import { escapeHtml } from '../../services/format';
import { EVENT_TYPES, type EventRow } from './model';

const value = (id: string): string => (document.getElementById(id) as HTMLInputElement | null)?.value ?? '';

function editorHtml(event: Partial<EventRow>, existing: EventRow | null): string {
  const canDelete = existing && (existing.creado_por === salesTeam.currentUserId() || cardSectionsLegacy.can('administrar'));
  return `<div class="fh"><div><h2>${t(existing ? 'events.editor.editTitle' : 'events.editor.newTitle')}</h2><div class="sm">${t('events.editor.subtitle')}</div></div>
      <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
    <label for="evt">${t('events.editor.title')}</label><input id="evt" value="${escapeHtml(event.titulo ?? '')}" placeholder="${t('events.editor.titlePlaceholder')}">
    <div class="g2"><div><label for="evtipo">${t('events.editor.type')}</label><select id="evtipo">${EVENT_TYPES.map(type => `<option ${type === event.tipo ? 'selected' : ''}>${type}</option>`).join('')}</select></div>
      <div><label for="evf">${t('events.editor.date')}</label><input id="evf" type="date" value="${escapeHtml(event.fecha ?? '')}"></div></div>
    <div class="g2"><div><label for="evh">${t('events.editor.time')}</label><input id="evh" type="time" value="${escapeHtml(event.hora ? String(event.hora).slice(0, 5) : '')}"></div>
      <div><label for="evl">${t('events.editor.place')}</label><input id="evl" value="${escapeHtml(event.lugar ?? '')}" placeholder="${t('events.editor.placePlaceholder')}"></div></div>
    <label class="opt"><input type="checkbox" id="evon" ${event.en_linea ? 'checked' : ''}> ${t('events.editor.online')}</label>
    <label for="evn">${t('events.editor.note')}</label><textarea id="evn" rows="3">${escapeHtml(event.nota ?? '')}</textarea>
    <div class="acts u-end">${canDelete ? `<button type="button" class="btn sec peligro" id="evborrar">${t('events.editor.delete')}</button>` : ''}
      <button type="button" class="btn sec" data-cerrar>${t('events.editor.cancel')}</button><button type="button" class="btn" id="evok">${t(existing ? 'events.editor.save' : 'events.editor.create')}</button></div>`;
}

const repaintListIfShown = (): void => { if (currentScreen() === 'eventos') eventsLegacy.repaintList(); };

function formRow(title: string): Record<string, unknown> {
  return { titulo: title, tipo: value('evtipo'), fecha: value('evf'), hora: value('evh') || null, lugar: value('evl').trim() || null,
    en_linea: Boolean((document.getElementById('evon') as HTMLInputElement | null)?.checked), nota: value('evn').trim() || null };
}

async function save(existing: EventRow | null, button: HTMLButtonElement): Promise<void> {
  const title = value('evt').trim();
  if (!title) { notices.toast(t('events.editor.writeTitle'), true); return; }
  if (!value('evf')) { notices.toast(t('events.editor.chooseDate'), true); return; }
  const row = formRow(title);
  button.disabled = true;
  const table = legacyDb().from<{ id: string }>('eventos');
  const result = existing ? await table.update(row).eq('id', existing.id).select('id').single() : await table.insert(row).select('id').single();
  button.disabled = false;
  if (result.error || !result.data) { notices.toast(t('events.editor.couldNotSave', { error: (result.error as { message?: string } | null)?.message ?? '' }), true); return; }
  notices.toast(t(existing ? 'events.editor.saved' : 'events.editor.created'));
  relatedLegacy.openEvent(result.data.id);
  repaintListIfShown();
}

async function remove(existing: EventRow): Promise<void> {
  if (!await notices.confirm(t('events.editor.deleteText'), { titulo: t('events.editor.deleteTitle'), ok: t('events.editor.delete'), peligro: true })) return;
  const { error } = await legacyDb().from('eventos').delete().eq('id', existing.id);
  if (error) { notices.toast(t('events.editor.couldNotDelete'), true); return; }
  (document.getElementById('dlg') as HTMLDialogElement | null)?.close();
  notices.toast(t('events.editor.deleted')); repaintListIfShown();
}

/** Opens the editor of `existing`, or a new event (today, «Taller», in person). */
export function editEvent(existing: EventRow | null): void {
  const body = document.getElementById('dbody'), box = document.getElementById('dlg') as HTMLDialogElement | null;
  if (!body || !box) return;
  body.innerHTML = editorHtml(existing ?? { fecha: todayIso(), tipo: 'Taller', en_linea: false }, existing);
  if (!box.open) box.showModal();
  const ok = document.getElementById('evok') as HTMLButtonElement | null; if (ok) ok.onclick = (): void => { void save(existing, ok); };
  const erase = document.getElementById('evborrar'); if (erase && existing) erase.onclick = (): void => { void remove(existing); };
}
