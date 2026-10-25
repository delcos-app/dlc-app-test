/**
 * The sheet of an appointment (pressing it in «Tu día» or a stop in Rutas): when, where, timetable and state, its notes, and
 * what can be done. Painted complete at once; before, five layers added pieces after painting it.
 * Migrated from the legacy verCitaBase / verCitaBase2 / verCitaBase3 / verCitaBase4 / verCita (v2.398.0). The global name
 * verCita stays as an adapter: «‹ Volver» (legado 126) wraps the windows by their global names.
 */
import { agendaState, appointmentLegacy, legacyAgenda, legacyDb, notices, term, weekPlanner, yourDayLegacy } from '../../legacy/bridge';
import { t } from '../../i18n';
import { formatMinutes, todayIso } from '../../services/dates';
import { capitalise, formatLongDate } from '../../services/date-format';
import { escapeHtml } from '../../services/format';
import { isPresent } from '../../services/values';
import { runAction } from './appointment-actions';
import { hasMenu, type AppointmentAction } from './appointment-options';
import { refreshQuietly } from './your-day/reorder';
import { canPlanAgain, isDone, isOpen, pointOf, statePill, STATES } from './appointment-state';
import { appointmentDay, originText } from './appointment-origin';

const DAY_MINUTES = 24 * 60;

function timeText(item: SheetAppointment, info: StopInfo): string {
  if (item.hora) return String(item.hora).slice(0, 5);
  if (isOpen(item.estado) && isPresent(info.llegada) && info.llegada < DAY_MINUTES) return t('agenda.sheet.around', { time: formatMinutes(info.llegada) });
  return t('agenda.sheet.noTime');
}

function timetableText(item: SheetAppointment, info: StopInfo): string {
  const windows = info.ventanas ?? weekPlanner.attendanceWindows(item.dias, item.fecha) as [number, number][] | null;
  if (!windows) return '';
  if (!windows.length) return t('agenda.sheet.notAttending');
  return (info.otroCentro ? t('agenda.sheet.atCentre', { centre: info.otroCentro }) : '') + yourDayLegacy.windowsText(windows);
}

const row = (label: string, value: string): string => `<div class="vcfila"><span>${label}</span><b>${value}</b></div>`;

function dataHtml(item: SheetAppointment, info: StopInfo): string {
  const where = [item.centro_nombre, item.direccion, item.municipio].filter(Boolean).join(' · '), timetable = timetableText(item, info), origin = originText(item);
  return `<div class="vcdatos">
      ${row(t('agenda.sheet.when'), `${escapeHtml(capitalise(formatLongDate(item.fecha)))} · ${escapeHtml(timeText(item, info))}`)}
      ${row(t('agenda.sheet.where'), escapeHtml(where || t('agenda.sheet.noCentre')))}
      ${timetable ? row(t('agenda.sheet.timetable'), escapeHtml(timetable)) : ''}
      ${row(t('agenda.sheet.state'), `${statePill(item.estado)}${origin ? ` <span class="sm">${origin}</span>` : ''}`)}
    </div>`;
}

/** A closed appointment says so (and how the visit went, filled in when it arrives). */
function closedHtml(item: SheetAppointment): string {
  if (isOpen(item.estado)) return '';
  return `<div class="banda-info vccerrada" id="vccerrada">${t('agenda.sheet.closed', { state: escapeHtml(item.estado) })}
    <span id="vccomo"></span> ${t(hasMenu(item) ? 'agenda.sheet.closedReopen' : 'agenda.sheet.closedFinal')}</div>`;
}

function goToButton(day: string | null | undefined, label: 'agenda.sheet.goTo' | 'agenda.sheet.seeDay', id: string, item: SheetAppointment): string {
  return day && day !== item.fecha ? `<button type="button" class="btn sec" id="${id}" data-vcdia="${day}">${escapeHtml(t(label, { day: appointmentDay(day) }))}</button>` : '';
}

function buttonsHtml(item: SheetAppointment): string {
  const open = isOpen(item.estado), today = todayIso();
  return `<div class="vcacts">
      <button type="button" class="btn sec" id="vcficha">${t('agenda.sheet.seeCard')}</button>
      ${pointOf(item) ? `<button type="button" class="btn sec" id="vcllegar">${t('agenda.sheet.directions')}</button>` : ''}
      ${open ? `<button type="button" class="btn sec" id="vchora">${t('agenda.sheet.changeTime')}</button><button type="button" class="btn sec" id="vcmover">${t('agenda.sheet.moveDay')}</button>` : ''}
    ${canPlanAgain(item, today) ? `<button type="button" class="btn sec" id="vcrehacer">${t('agenda.sheet.planAgain')}</button>` : ''}${item.estado === STATES.postponed ? goToButton(item.aplazada_a_fecha, 'agenda.sheet.goTo', 'vcirdest', item) : ''}${goToButton(item.aplazada_de_fecha, 'agenda.sheet.seeDay', 'vcirorig', item)}</div>
    ${open ? `<div class="vcfin">
        <button type="button" class="lnk" id="vcdescartar">${t('agenda.sheet.discard')}</button><span class="sm">${t('agenda.sheet.discardText')}</span>
        ${item.fecha >= today ? `<button type="button" class="lnk peligro" id="vcborrar">${t('agenda.sheet.delete')}</button><span class="sm">${t('agenda.sheet.deleteText')}</span>` : ''}</div>` : ''}
    <div class="acts u-end">
      <button type="button" class="btn sec" id="vcok" disabled>${t('agenda.sheet.saveNotes')}</button>
      ${open && yourDayLegacy.canRecordOn(item.fecha) ? `<button type="button" class="btn" id="vcreg">${t('agenda.sheet.record', { visit: term('visita') })}</button>` : ''}</div>`;
}

function sheetHtml(item: SheetAppointment, info: StopInfo): string {
  return `
    <div class="fh"><div><h2>${escapeHtml(item.nombre)}</h2>${item.especialidad ? `<div class="sm">${escapeHtml(item.especialidad)}</div>` : ''}</div>
      <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
    ${dataHtml(item, info)}
    ${closedHtml(item)}
    ${isOpen(item.estado) && info.aviso ? `<div class="banda-aviso" style="margin:0 0 12px">${escapeHtml(info.aviso)}</div>` : ''}
    <label for="vcnota">${t('agenda.sheet.notes')}</label>
    <textarea id="vcnota" rows="3" placeholder="${t('agenda.sheet.notesPlaceholder')}">${escapeHtml(item.nota ?? '')}</textarea>
    ${buttonsHtml(item)}`;
}

const dialog = (): HTMLDialogElement | null => document.getElementById('dlg') as HTMLDialogElement | null;
const close = (): void => { dialog()?.close(); };

async function saveNotes(item: SheetAppointment, notes: HTMLTextAreaElement, button: HTMLButtonElement): Promise<void> {
  button.disabled = true;
  const value = notes.value.trim();
  const { error } = await legacyDb().from('agenda').update({ nota: value || null }).eq('id', item.id);
  if (error) { button.disabled = false; notices.toast(t('agenda.sheet.couldNotSave', { error: (error as { message?: string }).message ?? '' }), true); return; }
  item.nota = value; close(); notices.toast(t('agenda.sheet.notesSaved')); refreshQuietly(item.id, false);
}

function bind(body: HTMLElement, item: SheetAppointment): void {
  const notes = body.querySelector<HTMLTextAreaElement>('#vcnota'), save = body.querySelector<HTMLButtonElement>('#vcok');
  if (notes && save) {
    notes.oninput = (): void => { save.disabled = notes.value.trim() === (item.nota ?? '').trim(); };
    save.onclick = (): void => { void saveNotes(item, notes, save); };
  }
  const on = (id: string, action: () => void): void => { const button = body.querySelector<HTMLElement>(`#${id}`); if (button) button.onclick = action; };
  const closeAnd = (action: AppointmentAction): (() => void) => (): void => { close(); void runAction(action, item); };
  on('vcficha', () => { close(); appointmentLegacy.openAccountFromCentre(item.cuenta_id, item.centro_nombre); });
  on('vcllegar', () => { void runAction('llegar', item); });
  on('vchora', closeAnd('hora')); on('vcmover', closeAnd('aplazar'));
  on('vcdescartar', closeAnd('descartar')); on('vcborrar', closeAnd('borrar')); on('vcrehacer', closeAnd('rehacer'));
  on('vcreg', () => { close(); appointmentLegacy.recordVisit(item.cuenta_id, item.fecha); });
  body.querySelectorAll<HTMLElement>('[data-vcdia]').forEach(button => {
    button.onclick = (): void => { close(); agendaState.setMode('dia'); legacyAgenda.showDay(button.dataset.vcdia ?? ''); };
  });
}

/** How the visit went, for a done appointment («Se registró la visita a las 10:30: Pedido»). */
function fillVisitResult(item: SheetAppointment): void {
  if (!isDone(item.estado) || !item.cuenta_id) return;
  legacyDb().from<{ resultados?: string[] | string | null; hora?: string | null }[]>('actividades').select('resultados, hora').eq('cuenta_id', item.cuenta_id).eq('fecha', item.fecha).limit(1).then(({ data }) => {
    const visit = data?.[0], place = document.getElementById('vccomo'); if (!visit || !place) return;
    const results = Array.isArray(visit.resultados) ? visit.resultados.filter(Boolean).join(', ') : (visit.resultados ?? '');
    place.textContent = t('agenda.sheet.recorded', { visit: term('visita'), time: visit.hora ? t('agenda.sheet.recordedAt', { time: String(visit.hora).slice(0, 5) }) : '', results: results ? `: ${results}` : '' });
  }, () => undefined);
}

/** Opens the sheet of an appointment. */
export function showAppointment(item: SheetAppointment | null | undefined): void {
  const body = document.getElementById('dbody'), box = dialog();
  if (!item || !body || !box) return;
  body.innerHTML = sheetHtml(item, yourDayLegacy.stopInfo()[item.id] ?? {});
  bind(body, item);
  fillVisitResult(item);
  box.classList.add('pequena');
  box.showModal();
}
