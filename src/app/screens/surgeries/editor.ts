/**
 * The window to schedule or change a surgery (it also goes to the Agenda of whoever assists). Migrated from the legacy
 * editarCirugia (v2.407.0); editarCirugia stays as an adapter.
 */
import { appLegacy, editorLegacy, legacyDb, notices, relatedLegacy, salesTeam, term } from '../../legacy/bridge';
import { t } from '../../i18n';
import { addDays, todayIso } from '../../services/dates';
import { escapeHtml } from '../../services/format';
import { errorText, ORIGINS, originLabel, STATES, timeOf, type Surgery } from './model';

interface Choice { hos: PickedAccount | null; cir: PickedAccount | null }

const value = (id: string): string => (document.getElementById(id) as HTMLInputElement | null)?.value ?? '';

async function team(): Promise<readonly { id: string; nombre: string }[]> {
  if (!salesTeam.members().length) await salesTeam.load().catch(() => undefined);
  const me = salesTeam.currentUserId(), members = salesTeam.members();
  return members.some(member => member.id === me) ? members : [{ id: me, nombre: appLegacy.currentUserName() }, ...members];
}

function editorHtml(surgery: Partial<Surgery>, existing: Surgery | null, people: readonly { id: string; nombre: string }[]): string {
  const origins = ORIGINS.map(origin => `<button type="button" data-o="${origin}" class="${origin === surgery.origen ? 'on' : ''}" aria-pressed="${String(origin === surgery.origen)}">${originLabel(origin)}</button>`).join('');
  return `<div class="fh"><div><h2>${t(existing ? 'surgeries.editor.changeTitle' : 'surgeries.editor.newTitle')}</h2><div class="sm">${t('surgeries.editor.subtitle')}</div></div>
      <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
    <div class="g2"><div><label for="cirf">${t('surgeries.editor.date')}</label><input id="cirf" type="date" value="${escapeHtml(surgery.fecha ?? '')}"></div>
      <div><label for="cirh">${t('surgeries.editor.time')}</label><input id="cirh" type="time" value="${escapeHtml(timeOf(surgery))}"></div></div>
    <label>${t('surgeries.editor.centre')}</label><div id="cirhos"></div>
    <label>${t('surgeries.editor.responsible')}</label><div id="circir"></div>
    <div class="g2"><div><label for="cirp">${t('surgeries.editor.procedure')}</label><input id="cirp" value="${escapeHtml(surgery.procedimiento ?? '')}" placeholder="${t('surgeries.editor.procedurePlaceholder')}"></div>
      <div><label for="cirq">${t('surgeries.editor.room')}</label><input id="cirq" value="${escapeHtml(surgery.quirofano ?? '')}" placeholder="${t('surgeries.editor.roomPlaceholder')}"></div></div>
    <div class="g2"><div><label for="cira">${t('surgeries.editor.assists')}</label><select id="cira">${people.map(person => `<option value="${person.id}" ${person.id === surgery.asistente_id ? 'selected' : ''}>${escapeHtml(person.nombre)}</option>`).join('')}</select></div>
      <div><label for="cirref">${t('surgeries.editor.caseReference', { patient: term('paciente', { article: 'del' }) })}</label><input id="cirref" maxlength="60" value="${escapeHtml(surgery.referencia_caso ?? '')}" placeholder="${t('surgeries.editor.caseReferencePlaceholder')}"></div></div>
    <label>${t('surgeries.editor.materialFrom')}</label>
    <div class="segs" id="cirori" role="group" aria-label="${t('surgeries.editor.materialFrom')}">${origins}</div>
    <label for="cirn">${t('surgeries.editor.note')}</label><textarea id="cirn" rows="2">${escapeHtml(surgery.nota ?? '')}</textarea>
    <div class="acts u-end">${existing ? `<button type="button" class="btn sec peligro" id="ciranular">${t('surgeries.editor.cancelSurgery')}</button>` : ''}
      <button type="button" class="btn sec" data-cerrar>${t('surgeries.editor.cancel')}</button><button type="button" class="btn" id="cirok">${t(existing ? 'surgeries.editor.save' : 'surgeries.editor.schedule')}</button></div>`;
}

function payload(existing: Surgery | null, centre: PickedAccount, responsible: PickedAccount, state: string): Record<string, unknown> {
  return {
    id: existing?.id ?? null, fecha: value('cirf'), hora: value('cirh') || null, hospital_id: centre.id, cirujano_id: responsible.id,
    procedimiento: value('cirp'), quirofano: value('cirq'), asistente_id: value('cira'), origen: document.querySelector<HTMLElement>('#cirori .on')?.dataset.o,
    referencia_caso: value('cirref'), nota: value('cirn'), estado: state,
  };
}

const failureText = (error: unknown, result: { error?: string } | null): string =>
  (error ? t('surgeries.editor.couldNotSave', { error: (error as { message?: string }).message ?? '' }) : errorText(result));

async function save(existing: Surgery | null, choice: Choice, state: string, button: HTMLButtonElement): Promise<void> {
  if (!value('cirf') || !choice.hos || !choice.cir) { notices.toast(t('surgeries.editor.missing'), true); return; }
  button.disabled = true;
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean; id?: string; error?: string }>('cirugia_guardar', { p: payload(existing, choice.hos, choice.cir, state) });
  button.disabled = false;
  if (error || !result || result.ok === false) { notices.toast(failureText(error, result), true); return; }
  notices.toast(t(state === STATES.cancelled ? 'surgeries.editor.cancelled' : existing ? 'surgeries.editor.saved' : 'surgeries.editor.scheduled'));
  appLegacy.forgetCache();
  if (state === STATES.cancelled) (document.getElementById('dlg') as HTMLDialogElement | null)?.close();
  else relatedLegacy.openSurgery(result.id ?? '');
}

function bind(existing: Surgery | null, choice: Choice): void {
  editorLegacy.pickAccount(document.getElementById('cirhos'), choice.hos, account => { choice.hos = account; }, t('surgeries.editor.centrePlaceholder'));
  editorLegacy.pickAccount(document.getElementById('circir'), choice.cir, account => { choice.cir = account; }, t('surgeries.editor.responsiblePlaceholder'));
  const origins = document.querySelectorAll<HTMLElement>('#cirori [data-o]');
  origins.forEach(button => { button.onclick = (): void => { origins.forEach(other => { other.classList.toggle('on', other === button); other.setAttribute('aria-pressed', String(other === button)); }); }; });
  const ok = document.getElementById('cirok') as HTMLButtonElement | null; if (ok) ok.onclick = (): void => { void save(existing, choice, STATES.scheduled, ok); };
  const cancel = document.getElementById('ciranular') as HTMLButtonElement | null;
  if (cancel) cancel.onclick = async (): Promise<void> => {
    if (!await notices.confirm(t('surgeries.editor.cancelText'), { titulo: t('surgeries.editor.cancelTitle'), ok: t('surgeries.editor.cancelSurgery'), peligro: true })) return;
    await save(existing, choice, STATES.cancelled, cancel);
  };
}

/** Opens the editor of `existing`, or a new surgery (tomorrow, from the centre's deposit, assisted by the user). */
export async function editSurgery(existing: Surgery | null): Promise<void> {
  const surgery = existing ?? { fecha: addDays(todayIso(), 1), origen: 'deposito', asistente_id: salesTeam.currentUserId() };
  const people = await team();
  const body = document.getElementById('dbody'), box = document.getElementById('dlg') as HTMLDialogElement | null;
  if (!body || !box) return;
  body.innerHTML = editorHtml(surgery, existing, people);
  if (!box.open) box.showModal();
  const choice: Choice = {
    hos: existing ? { id: existing.hospital_id ?? '', nombre: existing.hospital ?? '' } : null,
    cir: existing ? { id: existing.cirujano_id ?? '', nombre: existing.cirujano ?? '', ...(existing.especialidad ? { especialidad: existing.especialidad } : {}) } as PickedAccount : null,
  };
  bind(existing, choice);
}
