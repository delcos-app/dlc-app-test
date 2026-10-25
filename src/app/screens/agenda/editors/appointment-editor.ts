/**
 * The «Nueva cita» window: who (account picker), day, optional time, centre (when they attend in more than one) and notes. Before
 * saving it warns if they already have an appointment that day or were seen recently; with a time, the new appointment takes
 * its place among the day's by time. Migrated from the legacy nuevaCita / citaRepetida(Base) / colocarPorHora (v2.400.0).
 * nuevaCita stays as an adapter (seven legacy files open this window).
 */
import { agendaCache, appointmentLegacy, callRpc, currentScreen, editorLegacy, legacyAgenda, legacyDb, notices, salesTeam, term } from '../../../legacy/bridge';
import { t } from '../../../i18n';
import { todayIso } from '../../../services/dates';
import { formatDayMonth, formatLongDate } from '../../../services/date-format';
import { escapeHtml } from '../../../services/format';
import { load as loadHome } from '../../home';
import { isOpen, STATES } from '../appointment-state';
import { orFallback } from '../../../services/values';
import { refreshQuietly, saveOrder } from '../your-day/reorder';

export interface NewAppointmentOptions { readonly origen?: string }

interface Draft { picked: PickedAccount | null; consultations: Consultation[] }

const timeOf = (item: { hora?: string | null }): string | null => (item.hora ? String(item.hora).slice(0, 5) : null);
const inputValue = (id: string): string => (document.getElementById(id) as HTMLInputElement | null)?.value ?? '';

async function loadAccount(id: string, draft: Draft): Promise<PickedAccount | null> {
  const { data } = await legacyDb().rpc<{ medico?: PickedAccount; consultas?: Consultation[] }>('ficha_cuenta', { p_id: id });
  draft.consultations = data?.consultas ?? [];
  return data?.medico ?? null;
}

/** With more than one centre, a selector (the one of the card it was opened from, or the main one, first). */
function paintCentres(draft: Draft): void {
  const box = document.getElementById('nccw'); if (!box) return;
  const list = draft.consultations.filter(item => item.centro_nombre);
  if (list.length < 2) { box.innerHTML = ''; return; }
  const preferred = editorLegacy.centreFromCard() ?? (list.find(item => item.principal) ?? list[0])?.centro_nombre;
  box.innerHTML = `<label for="ncc">${t('agenda.editor.centre')}</label><select id="ncc">${list.map(item => `<option value="${escapeHtml(item.centro_nombre)}" ${item.centro_nombre === preferred ? 'selected' : ''}>${escapeHtml([item.centro_nombre, item.municipio].filter(Boolean).join(' · '))}</option>`).join('')}</select>`;
}

function windowHtml(day: string): string {
  return `
    <div class="fh"><div><h2>${t('agenda.editor.newTitle')}</h2><div class="sm">${t('agenda.editor.newSubtitle')}</div></div>
      <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
    <label>${term('medico', { capital: 'C' })}</label><div id="ncsel"></div>
    <div class="g2">
      <div><label for="ncf">${t('agenda.editor.day')}</label><input id="ncf" type="date" value="${escapeHtml(day)}"></div>
      <div><label for="nch">${t('agenda.editor.time')} <span class="sm">${t('agenda.editor.optional')}</span></label><input id="nch" type="time"></div>
    </div>
    <div id="nccw"></div>
    <label for="ncn">${t('agenda.editor.notes')}</label><textarea id="ncn" rows="3" placeholder="${t('agenda.sheet.notesPlaceholder')}"></textarea>
    <div class="acts u-end">
      <button class="btn sec" data-cerrar>${t('agenda.editor.cancel')}</button>
      <button class="btn" id="ncok">${t('agenda.editor.add')}</button></div>`;
}

/** Already an open appointment that day: cancel, keep both, or keep only the new one (the old one is deleted). */
async function sameDayDecision(accountId: string, day: string): Promise<string | null> {
  const owner = editorLegacy.viewedUserId() ?? salesTeam.currentUserId();
  const { data } = await callRpc<RangeAppointment[]>('agenda_rango', { p_desde: day, p_hasta: day, p_usuario: owner });
  const existing = (data ?? []).find(item => (item as { cuenta_id?: string }).cuenta_id === accountId && isOpen(item.estado)) as (RangeAppointment & { id: string; origen?: string | null }) | undefined;
  if (!existing) return 'nueva';
  const message = t('agenda.editor.duplicateText', {
    name: existing.nombre ?? '', date: formatLongDate(day), time: existing.hora ? t('agenda.editor.at', { time: String(existing.hora).slice(0, 5) }) : '',
    state: existing.estado, origin: existing.origen ? ` · ${existing.origen}` : '',
  });
  const choice = await notices.choose(t('agenda.editor.duplicateTitle'), message,
    [{ k: 'no', t: t('agenda.editor.cancel'), cls: 'sec' }, { k: 'dos', t: t('agenda.editor.keepBoth'), cls: 'sec' }, { k: 'sust', t: t('agenda.editor.onlyNew') }]);
  if (!choice) return null;
  if (choice === 'sust') {
    const { data: result } = await legacyDb().rpc<{ ok?: boolean }>('borrar_cita', { p_id: existing.id });
    if (result?.ok === false) { notices.toast(t('agenda.editor.couldNotRemovePrevious'), true); return null; }
  }
  return choice;
}

/** Seen recently: add it anyway, or add it and turn the notice off. */
async function recentDecision(accountId: string, day: string): Promise<boolean> {
  const recent = await editorLegacy.recentContacts(accountId, day);
  if (!recent.length) return true;
  const choice = await notices.choose(t('agenda.editor.recentTitle'), t('agenda.editor.recentText', { list: editorLegacy.recentText(recent.slice(0, 3)) }),
    [{ k: 'no', t: t('agenda.editor.cancel'), cls: 'sec' }, { k: 'nomas', t: t('agenda.editor.yesNoMore'), cls: 'sec' }, { k: 'si', t: t('agenda.editor.addAnyway') }]);
  if (!choice) return false;
  if (choice === 'nomas') { await editorLegacy.turnOffRecentNotice(); notices.toast(t('agenda.editor.noticeOff')); }
  return true;
}

/** v2.298: with a time, the new appointment takes its place among the open ones of the day by time (it used to go last). */
async function placeByTime(day: string, owner: string, accountId: string, time: string): Promise<void> {
  const { data } = await callRpc<(RangeAppointment & { id: string; cuenta_id?: string })[]>('agenda_rango', { p_desde: day, p_hasta: day, p_usuario: owner });
  const open = (data ?? []).filter(item => item.usuario_id === owner && isOpen(item.estado));
  const mine = open.filter(item => item.cuenta_id === accountId && timeOf(item) === time).pop(); if (!mine) return;
  const rest = open.filter(item => item !== mine);
  let index = rest.findIndex(item => { const other = timeOf(item); return other !== null && other > time; });
  if (index < 0) { index = 0; rest.forEach((item, position) => { const other = timeOf(item); if (other !== null && other <= time) index = position + 1; }); }
  rest.splice(index, 0, mine);
  if (rest.some((item, position) => item !== open[position])) { await saveOrder(rest); agendaCache.forgetDay(day); }
}

/** The centre: the one chosen, else the main consultation's, else the account's own (null if none). */
function centreOf(draft: Draft, picked: PickedAccount): string | null {
  const main = draft.consultations.find(item => item.principal) ?? draft.consultations[0];
  return [inputValue('ncc'), main?.centro_nombre, picked.centro_nombre, picked.centro].find(name => Boolean(name)) ?? null;
}

async function write(picked: PickedAccount, draft: Draft, options: NewAppointmentOptions): Promise<{ error?: unknown } | null> {
  const day = inputValue('ncf'), inAgenda = currentScreen() === 'agenda';
  return appointmentLegacy.write('guardar_cita', { p: {
    cuenta_id: picked.id, fecha: day, hora: inputValue('nch') || null, centro_nombre: centreOf(draft, picked), estado: STATES.planned,
    origen: orFallback(options.origen, inAgenda ? 'Agenda' : 'Ficha'), usuario_id: editorLegacy.viewedUserId(), nota: inputValue('ncn').trim(),
    op_id: `c-${picked.id}-${day}-${Date.now()}`,
  } });
}

async function save(draft: Draft, options: NewAppointmentOptions, button: HTMLButtonElement): Promise<void> {
  const picked = draft.picked;
  if (!picked) { notices.toast(t('agenda.editor.choose', { professional: term('medico', { article: 'un' }) }), true); return; }
  const day = inputValue('ncf'), time = inputValue('nch');
  if (!await sameDayDecision(picked.id, day) || !await recentDecision(picked.id, day)) return;
  button.disabled = true;
  const result = await write(picked, draft, options);
  button.disabled = false;
  if (result?.error) { notices.toast(t('agenda.editor.couldNot', { error: (result.error as { message?: string }).message ?? '' }), true); return; }
  if (time) await placeByTime(day, editorLegacy.viewedUserId() ?? salesTeam.currentUserId(), picked.id, time);
  (document.getElementById('dlg') as HTMLDialogElement | null)?.close();
  notices.toast(t('agenda.editor.added', { date: formatDayMonth(day) }));
  if (currentScreen() === 'agenda') refreshQuietly(); else void loadHome();
}

/** Opens «Nueva cita» (for an account if given, on a day if given: otherwise the shown day from today on, or today). */
export async function newAppointment(accountId?: string | null, day?: string | null, options: NewAppointmentOptions = {}): Promise<void> {
  const draft: Draft = { picked: null, consultations: [] };
  if (accountId) draft.picked = await loadAccount(accountId, draft);
  const shown = legacyAgenda.selectedDate(), today = todayIso();
  const body = document.getElementById('dbody'), box = document.getElementById('dlg') as HTMLDialogElement | null;
  if (!body || !box) return;
  body.innerHTML = windowHtml(day ?? (currentScreen() === 'agenda' && shown && shown >= today ? shown : today));
  paintCentres(draft);
  editorLegacy.pickAccount(document.getElementById('ncsel'), draft.picked, async account => { draft.picked = account; await loadAccount(account.id, draft); paintCentres(draft); });
  const ok = document.getElementById('ncok') as HTMLButtonElement | null;
  if (ok) ok.onclick = (): void => { void save(draft, options, ok); };
  box.classList.add('pequena');
  box.showModal();
}
