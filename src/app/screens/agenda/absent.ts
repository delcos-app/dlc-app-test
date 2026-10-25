/**
 * After «No estaba»: proposes the next day the account attends (or another date) and creates the appointment. Migrated from the
 * legacy nuevaFechaTrasNoEstaba (v2.414.0).
 */
import { legacyDb, notices } from '../../legacy/bridge';
import { t } from '../../i18n';
import { formatLongDate, formatShortDate } from '../../services/date-format';
import { refreshQuietly } from './your-day/reorder';
import { nextAttendanceDay } from '../accounts/timetable';

interface AbsentAppointment { id: string; cuenta_id: string; fecha: string; nombre: string; centro_nombre?: string | null; dias?: Record<string, string | null> | null }

async function chooseDay(item: AbsentAppointment, proposed: string): Promise<string | null> {
  const option = await notices.choose(t('agendaMore.absent.title'), t('agendaMore.absent.text', { name: item.nombre, date: formatLongDate(proposed) }), [
    { k: 'no', t: t('agendaMore.absent.notNow'), cls: 'sec' }, { k: 'otra', t: t('agendaMore.absent.other'), cls: 'sec' },
    { k: 'prop', t: t('agendaMore.absent.proposed', { date: formatShortDate(proposed) }) }]);
  if (!option || option === 'no') return null;
  if (option !== 'otra') return proposed;
  return notices.askDate(t('agendaMore.absent.whichDay'), proposed, { titulo: t('agendaMore.absent.newTitle'), ok: t('agendaMore.absent.create') });
}

/** After «No estaba»: proposes the next day the account attends (or another date) and creates the appointment. */
export async function newDateAfterAbsent(appointment: object): Promise<void> {
  const item = appointment as AbsentAppointment;
  const day = await chooseDay(item, nextAttendanceDay(item.dias, item.fecha));
  if (!day) return;
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean }>('guardar_cita', { p: {
    cuenta_id: item.cuenta_id, fecha: day, centro_nombre: item.centro_nombre, estado: 'Planificada',
    origen: t('agendaMore.absent.origin', { date: formatShortDate(item.fecha) }), op_id: `ne-${item.id}-${day}`,
  } });
  if (error || result?.ok === false) { notices.toast(t('agendaMore.absent.couldNotCreate'), true); return; }
  notices.toast(t('agendaMore.absent.created', { date: formatShortDate(day) })); refreshQuietly();
}

