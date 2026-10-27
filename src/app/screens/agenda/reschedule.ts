/**
 * «Reprogramar»: proposes for each open appointment the next day its account attends, lets the user change the date or untick it,
 * and moves the ticked ones. Migrated from the legacy reprogramarCitas (v2.414.0); the name stays as an adapter.
 */
import { legacyDb, notices, reloadAgenda, term } from '../../legacy/bridge';
import { paintRouteBar } from '../routes/day-bar';
import { restLegacy } from '../../legacy/rest-bridge';
import { t } from '../../i18n';
import { todayIso } from '../../services/dates';
import { formatShortDate } from '../../services/date-format';
import { escapeHtml } from '../../services/format';
import { nextAttendanceDay } from '../accounts/timetable';
import { withTimetables } from '../accounts/timetable';

/** An open appointment (the legacy pending lists type it without its account, which it always carries). */
export interface ReschedulableAppointment { id: string; cuenta_id?: string; fecha: string; nombre?: string | null; centro_nombre?: string | null; municipio?: string | null; dias?: AttendanceDays }

type AttendanceDays = Record<string, string | null> | null | undefined;
interface Row { item: ReschedulableAppointment; day: string; attends: string }

async function proposals(list: readonly ReschedulableAppointment[]): Promise<Row[]> {
  const timetables = await withTimetables(list.map(item => ({ id: item.cuenta_id ?? '', ...('dias' in item ? { dias: item.dias } : {}) })));
  const days = new Map(timetables.map(entry => [entry.id, entry.dias ?? {}]));
  const today = todayIso();
  return list.map(item => {
    const attendance = days.get(item.cuenta_id ?? '') ?? {};
    return {
      item, day: nextAttendanceDay(attendance, item.fecha > today ? item.fecha : today),
      attends: Object.keys(attendance).filter(key => attendance[key]).join(' '),
    };
  });
}

function rowHtml(row: Row, index: number, today: string): string {
  const place = escapeHtml([row.item.centro_nombre, row.item.municipio].filter(Boolean).join(' · '));
  return `<div class="item u-cursor-default">
        <input type="checkbox" data-rpi="${index}" checked aria-label="${t('agendaMore.reschedule.move')}">
        <span class="tx"><b>${escapeHtml(row.item.nombre ?? '')}</b>
          <span class="sm">${place}${row.item.fecha < today ? t('agendaMore.reschedule.wasOn', { date: formatShortDate(row.item.fecha) }) : ''}</span>
          <span class="sm">${row.attends ? t('agendaMore.reschedule.attends', { days: escapeHtml(row.attends) }) : t('agendaMore.reschedule.noDays')}</span></span>
        <input type="date" data-rpf="${index}" value="${row.day}" min="${today}"></div>`;
}

function windowHtml(rows: readonly Row[], title: string, text: string): string {
  const today = todayIso();
  return `
      <div class="fh"><div><h2>${escapeHtml(title)}</h2><div class="sm">${escapeHtml(text)}</div></div>
        <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
      <p class="sm">${t('agendaMore.reschedule.proposal', { professional: term('medico') })}</p>
      <div class="lista reprog" data-nosucio>${rows.map((row, index) => rowHtml(row, index, today)).join('')}</div>
      <div class="acts u-end">
        <button class="btn sec" id="rpno">${t('agendaMore.reschedule.leave')}</button>
        <button class="btn" id="rpok">${t('agendaMore.reschedule.moveMarked')}</button></div>`;
}

async function moveTicked(body: HTMLElement, rows: readonly Row[]): Promise<number> {
  let moved = 0;
  for (const [index, row] of rows.entries()) {
    if (!body.querySelector<HTMLInputElement>(`[data-rpi="${index}"]`)?.checked) continue;
    const day = body.querySelector<HTMLInputElement>(`[data-rpf="${index}"]`)?.value;
    if (!day) continue;
    const { data: result } = await legacyDb().rpc<{ ok?: boolean }>('aplazar_cita', { p_id: row.item.id, p_fecha: day, p_hora: null, p_origen: 'Reprogramada' });
    if (result?.ok) moved++;
  }
  return moved;
}

const movedText = (count: number): string => {
  if (!count) return t('agendaMore.reschedule.noneMoved');
  return count === 1 ? t('agendaMore.reschedule.oneMoved') : t('agendaMore.reschedule.moved', { count });
};

/** Opens the window; resolves true if some appointment was moved. */
export async function rescheduleAppointments(list: readonly ReschedulableAppointment[], title: string, text: string): Promise<boolean> {
  if (!list.length) return false;
  const rows = await proposals(list);
  const body = document.getElementById('dbody'), box = document.getElementById('dlg') as HTMLDialogElement | null;
  if (!body || !box) return false;
  return new Promise(resolve => {
    body.innerHTML = windowHtml(rows, title, text);
    const close = (moved: boolean): void => { box.close(); resolve(moved); };
    const leave = document.getElementById('rpno'); if (leave) leave.onclick = (): void => { close(false); };
    const ok = document.getElementById('rpok') as HTMLButtonElement | null;
    if (ok) ok.onclick = async (): Promise<void> => {
      ok.disabled = true; ok.textContent = t('agendaMore.reschedule.moving');
      const moved = await moveTicked(body, rows);
      notices.toast(movedText(moved));
      close(moved > 0);
      reloadAgenda(); restLegacy.reloadHome(); void paintRouteBar();
    };
    box.showModal();
  });
}
