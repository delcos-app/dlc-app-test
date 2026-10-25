/**
 * The sheet of an event: its attendees with their state and what is given to each one (inscription, travel, meals, fees), with a
 * notice when a meal goes over 60 € per person. Migrated from the legacy verEvento (v2.407.0); verEvento stays as an adapter
 * («‹ Volver» wraps the windows by their global names).
 */
import { cardSectionsLegacy, editorLegacy, legacyDb, notices, relatedLegacy, salesTeam } from '../../legacy/bridge';
import { t } from '../../i18n';
import { escapeHtml, formatCurrency } from '../../services/format';
import { sum } from '../../services/values';
import { editEvent } from './editor';
import { eventSummary } from './list';
import { ATTENDANCE_STATES, attendeeTotal, CONCEPTS, conceptLabel, MEAL_MAX, type Attendee, type Concept, type EventRow } from './model';

const reopen = (id: string): void => { relatedLegacy.openEvent(id); };

function attendeeHtml(attendee: Attendee): string {
  const costs = CONCEPTS.map(concept => {
    const amount = Number(attendee[concept]) || 0;
    return `<label class="${concept === 'comida' && amount > MEAL_MAX ? 'evaviso' : ''}"><span>${conceptLabel(concept)}</span><input type="number" min="0" step="0.01" data-asimp="${concept}" value="${amount || ''}" placeholder="0"></label>`;
  }).join('');
  return `<div class="evasf" data-as="${attendee.id}">
        <div class="evasn"><b>${escapeHtml(attendee.cuentas?.nombre ?? '')}</b><span class="sm">${escapeHtml(attendee.cuentas?.especialidad ?? '')}</span></div>
        <select data-asest aria-label="${t('events.sheet.state')}">${ATTENDANCE_STATES.map(state => `<option ${state === attendee.estado ? 'selected' : ''}>${state}</option>`).join('')}</select>
        <button type="button" class="x" data-asq aria-label="${t('events.sheet.remove')}">✕</button>
        <div class="evimp">${costs}</div></div>`;
}

function sheetHtml(event: EventRow, attendees: readonly Attendee[], canEdit: boolean): string {
  return `<div class="fh"><div><h2>${escapeHtml(event.titulo)}</h2><div class="sm">${eventSummary(event)}</div></div>
      <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
    ${event.nota ? `<p class="sm">${escapeHtml(event.nota)}</p>` : ''}
    <div class="evascab"><h3>${t('events.sheet.attendees', { count: attendees.length })}</h3><button type="button" class="btn sec" id="evanadir">${t('events.sheet.add')}</button></div>
    <div id="evsel"></div>
    <div class="evas" id="evas">${attendees.length ? attendees.map(attendeeHtml).join('') : `<div class="vacio vlinea">${t('events.sheet.noAttendees')}</div>`}</div>
    <div class="evpie"><span>${t('events.sheet.total')}</span><b id="evtotal">${formatCurrency(sum(attendees.map(attendeeTotal)))}</b></div>
    <p class="sm">${t('events.sheet.note', { max: MEAL_MAX })}</p>
    <div class="acts u-end">${canEdit ? `<button type="button" class="btn sec" id="eveditar">${t('events.sheet.edit')}</button>` : ''}<button type="button" class="btn" data-cerrar>${t('events.sheet.done')}</button></div>`;
}

function startAdding(id: string): void {
  const add = document.getElementById('evanadir') as HTMLButtonElement | null; if (add) add.disabled = true;
  editorLegacy.pickAccount(document.getElementById('evsel'), null, async account => {
    const { error } = await legacyDb().from('eventos_asistentes').insert({ evento_id: id, cuenta_id: account.id });
    const message = (error as { message?: string } | null)?.message ?? '';
    if (error) notices.toast(/duplicate|unique/i.test(message) ? t('events.sheet.alreadyIn', { name: account.nombre ?? '' }) : t('events.sheet.couldNotAdd', { error: message }), true);
    else notices.toast(t('events.sheet.added', { name: account.nombre ?? '' }));
    reopen(id);
  });
  document.getElementById('evsel')?.querySelector('input')?.focus();
}

async function saveCost(attendee: Attendee, input: HTMLInputElement, attendees: readonly Attendee[]): Promise<void> {
  const concept = input.dataset.asimp as Concept, amount = Math.max(0, Math.round((Number(input.value) || 0) * 100) / 100);
  const { error } = await legacyDb().from('eventos_asistentes').update({ [concept]: amount }).eq('id', attendee.id);
  if (error) { notices.toast(t('events.sheet.couldNotSave'), true); input.value = String(Number(attendee[concept]) || ''); return; }
  attendee[concept] = amount;
  const total = document.getElementById('evtotal'); if (total) total.textContent = formatCurrency(sum(attendees.map(attendeeTotal)));
  const overMeal = concept === 'comida' && amount > MEAL_MAX;
  input.closest('label')?.classList.toggle('evaviso', overMeal);
  if (overMeal) notices.toast(t('events.sheet.mealOver', { max: MEAL_MAX }), true);
}

function bindAttendee(row: HTMLElement, attendee: Attendee, attendees: readonly Attendee[], id: string): void {
  const state = row.querySelector<HTMLSelectElement>('[data-asest]');
  if (state) state.onchange = async (): Promise<void> => {
    const { error } = await legacyDb().from('eventos_asistentes').update({ estado: state.value }).eq('id', attendee.id);
    if (error) { notices.toast(t('events.sheet.couldNotSave'), true); state.value = attendee.estado; return; }
    attendee.estado = state.value;
  };
  row.querySelectorAll<HTMLInputElement>('[data-asimp]').forEach(input => { input.onchange = (): void => { void saveCost(attendee, input, attendees); }; });
  const remove = row.querySelector<HTMLElement>('[data-asq]');
  if (remove) remove.onclick = async (): Promise<void> => {
    if (!await notices.confirm(t('events.sheet.removeText', { name: attendee.cuentas?.nombre ?? '' }), { titulo: t('events.sheet.removeTitle'), ok: t('events.sheet.remove'), peligro: true })) return;
    const { error } = await legacyDb().from('eventos_asistentes').delete().eq('id', attendee.id);
    if (error) { notices.toast(t('events.sheet.couldNotRemove'), true); return; }
    reopen(id);
  };
}

/** Opens the sheet of an event. */
export async function showEvent(id: string): Promise<void> {
  const db = legacyDb();
  const [{ data: event }, { data: attendeeRows }] = await Promise.all([
    db.from<EventRow>('eventos').select('*').eq('id', id).maybeSingle(),
    db.from<Attendee[]>('eventos_asistentes').select('id,cuenta_id,estado,inscripcion,viaje,comida,honorarios,cuentas(nombre,especialidad)').eq('evento_id', id).order('creado_en'),
  ]);
  if (!event) { notices.toast(t('events.sheet.notFound'), true); return; }
  const body = document.getElementById('dbody'), box = document.getElementById('dlg') as HTMLDialogElement | null;
  if (!body || !box) return;
  const attendees = attendeeRows ?? [], canEdit = event.creado_por === salesTeam.currentUserId() || cardSectionsLegacy.can('administrar');
  body.innerHTML = sheetHtml(event, attendees, canEdit);
  if (!box.open) box.showModal();
  const edit = document.getElementById('eveditar'); if (edit) edit.onclick = (): void => { editEvent(event); };
  const add = document.getElementById('evanadir'); if (add) add.onclick = (): void => { startAdding(id); };
  document.querySelectorAll<HTMLElement>('#evas [data-as]').forEach(row => {
    const attendee = attendees.find(item => item.id === row.dataset.as);
    if (attendee) bindAttendee(row, attendee, attendees, id);
  });
}
