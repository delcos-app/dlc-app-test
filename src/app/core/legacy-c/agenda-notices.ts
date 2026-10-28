/**
 * «Tu día»: the notices of each stop explain themselves (v2.174.0: the attendance hours, the arrival time, a stop more than 4 h away;
 * v2.175.0: a fixed time placed after stops without time; v2.176.0: another centre that day). The legacy estimarDiaBaseBase2, Base3,
 * estimarDiaBase, explicarAvisoBase, Base2 and explicarAviso are two functions now (folded from legado 077, v2.425.0).
 */
import { term } from '../../legacy/bridge';
import { t } from '../../i18n';
import * as legacyFreeCoreServices from '../services';
import { agendaStore } from '../../screens/agenda/store';
import * as legacyFreeScreensAccounts from '../../screens/accounts';
import * as legacyFreeCoreLegacyA from '../legacy-a';
import * as legacyFreeCoreSettings from '../settings';

const FAR_MINUTES = 240;
interface Stop { id: string; estado: string; dias?: unknown }
interface Info { llegada?: number | null | undefined; fecha?: string; lejos?: number; ventanas?: [number, number][] | null; aviso?: string; orden?: boolean; otroCentro?: string | undefined }
interface Estimate { est: Record<string, number> }

const infoOf = (id: string): Info | undefined => (agendaStore.stopInfo as Record<string, Info | undefined>)[id];

/** Marks the stops far from the previous one (or from the start point) and keeps the estimated arrival in their info. */
function markFarStops(stops: readonly Stop[], date: string, estimate: Estimate): void {
  try {
    const start = legacyFreeCoreSettings.userStart() as { lat?: number | null; lon?: number | null } | null;
    let position: [number, number] | null = start?.lat !== undefined && start.lat !== null ? [Number(start.lat), Number(start.lon)] : null;
    stops.forEach(stop => {
      const point = xyCita(stop), info = infoOf(stop.id);
      if (info) { info.llegada = estimate.est[stop.id]; info.fecha = date; }
      if (point && position && info && CITA_ABIERTA.includes(stop.estado) && legacyFreeCoreServices.maps.minutesBetween(position, point) > FAR_MINUTES) info.lejos = Math.round(legacyFreeCoreLegacyA.km(position, point));
      if (point) position = point;
    });
  } catch { /* the estimate stays as it is */ }
}

/** The day estimate with the notices that help (the legacy estimarDiaBase). */
export function estimateDay(stops: readonly Stop[] | null | undefined, date: string): Estimate {
  const otherCentre: Record<string, { lugar: string; dias: unknown }> = {};
  const withCentre = (stops ?? []).map(stop => {
    const other = legacyFreeScreensAccounts.otherCentreWithConsultation(stop as unknown as Parameters<typeof legacyFreeScreensAccounts.otherCentreWithConsultation>[0], date) as { lugar: string; dias: unknown } | null;
    if (!other) return stop; otherCentre[stop.id] = other; return { ...stop, dias: other.dias };
  });
  const estimate = legacyFreeCoreLegacyA.estimateDayBase(withCentre as unknown as Parameters<typeof legacyFreeCoreLegacyA.estimateDayBase>[0], date) as Estimate;
  markFarStops(withCentre, date, estimate);
  // A fixed time that the order leaves late: the notice says what to do, and the «i» talks about the order
  Object.values(agendaStore.stopInfo as Record<string, Info>).forEach(info => {
    if (info.aviso && info.aviso.startsWith(t('legacyC.agenda.wouldArrive')) && !info.aviso.includes(t('legacyC.agenda.moveUpWord'))) { info.orden = true; info.aviso += t('legacyC.agenda.moveUp'); }
  });
  Object.keys(otherCentre).forEach(id => { const info = infoOf(id); if (info) info.otroCentro = otherCentre[id]?.lugar; });
  return estimate;
}

function attendanceText(info: Info): string {
  const who = term('medico', { article: 'el' });
  if (info.lejos) return t('legacyC.agenda.far', { km: legacyFreeCoreServices.money.number(info.lejos) });
  const windows = info.ventanas?.length ? txtVentanas(info.ventanas) : '';
  const day = info.fecha ? legacyFreeCoreServices.calendar.weekdayOf(info.fecha) : t('legacyC.agenda.thatDay');
  if (info.ventanas && !info.ventanas.length) return t('legacyC.agenda.notThatDay', { who, day });
  const arrival = info.llegada !== undefined && info.llegada !== null ? t('legacyC.agenda.wouldArriveAt', { time: legacyFreeCoreServices.calendar.minutesToTime(info.llegada) }) : '';
  return t('legacyC.agenda.attends', { who, day, windows, arrival });
}

/** What the «i» of a stop notice says (the legacy explicarAviso). */
export function explainNotice(info: Info): string {
  const text = info.orden && !info.lejos ? t('legacyC.agenda.order') : attendanceText(info);
  return info.otroCentro ? text.replace(t('legacyC.agenda.accordingTo'), t('legacyC.agenda.otherCentre', { place: info.otroCentro })) : text;
}
