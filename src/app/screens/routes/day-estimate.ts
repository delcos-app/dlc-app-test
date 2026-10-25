/**
 * «Tu día»: estimated hours respecting each professional's attendance hours (legado 024, v2.424.0). Following the current order,
 * each open appointment gets its estimated start, a notice when it does not fit (with the hours) and the wait when arriving before
 * it opens. estimarDiaBaseBase and estimarDiaBase2 stay as adapters (legado 077 and 103 wrap them).
 */
import { dayEstimateLegacy, type EstimatedAppointment, type StopNotice } from '../../legacy/legado-a-bridge';
import { t } from '../../i18n';
import { todayIso } from '../../services/dates';

const ROUND_MINUTES = 5, SHOW_WAIT_FROM = 5;

export interface DayEstimate { est: Record<string, number>; fin: number; tope: number }

const roundedNow = (): number => { const now = new Date(); return Math.ceil((now.getHours() * 60 + now.getMinutes()) / ROUND_MINUTES) * ROUND_MINUTES; };

function notice(arrival: number, fixed: number | null, windows: readonly [number, number][] | null): string {
  if (fixed !== null) return t('legacyA.estimate.late', { arrival: dayEstimateLegacy.hourText(arrival), time: dayEstimateLegacy.hourText(fixed) });
  if (windows && !windows.length) return t('legacyA.estimate.closedThatDay');
  return t('legacyA.estimate.outsideHours', { hours: dayEstimateLegacy.windowsText(windows) });
}

interface Leg { time: number; position: [number, number]; first: boolean; today: boolean; stopMinutes: number; withDeparture: boolean }

/** When one arrives at the next appointment, and where one is then. */
function arrivalAt(leg: Leg, point: [number, number] | null, fixed: number | null): { arrival: number; position: [number, number] } {
  if (leg.first && !leg.withDeparture) {
    // v2.77.1: without a planned departure the time leaving home is unknown: one arrives at the first appointment at its time
    const now = leg.today ? roundedNow() : 0;
    return { arrival: fixed !== null ? Math.max(fixed, now) : leg.time, position: point ?? leg.position };
  }
  if (!point) return { arrival: leg.time, position: leg.position };
  const same = !leg.first && leg.position[0] === point[0] && leg.position[1] === point[1];
  return { arrival: leg.time + (same ? 0 : dayEstimateLegacy.travelMinutes(leg.position, point) + leg.stopMinutes), position: point };
}

/** The estimate of the day with the user's settings (the base the hour-aware layers start from). */
export function estimateDayBase(appointments: readonly EstimatedAppointment[], isoDate: string): DayEstimate {
  const settings = dayEstimateLegacy.planSettings(), start = dayEstimateLegacy.startPoint(), duration = settings.visita, today = isoDate === todayIso();
  let time = dayEstimateLegacy.minutesOf(settings.salida), position: [number, number] = [start.lat, start.lon], first = true;
  if (today) time = Math.max(time, roundedNow());
  const estimated: Record<string, number> = {}, info: Record<string, StopNotice> = {};
  dayEstimateLegacy.setStopInfo(info);
  appointments.forEach(appointment => {
    const point = dayEstimateLegacy.pointOf(appointment);
    if (!dayEstimateLegacy.isOpen(appointment.estado)) { if (point) position = point; return; }
    const windows = dayEstimateLegacy.windowsOf(appointment.dias, isoDate), fixed = dayEstimateLegacy.minutesOrNull(appointment.hora);
    const leg = arrivalAt({ time, position, first, today, stopMinutes: settings.parada, withDeparture: Boolean(settings.conSalida) }, point, fixed);
    const arrival = leg.arrival;
    position = leg.position;
    first = false;
    let begin = dayEstimateLegacy.possibleStart({ xy: point, ventanas: windows, fija: fixed }, arrival, duration);
    const stop: StopNotice = { ventanas: windows };
    if (begin === null) {
      begin = fixed !== null ? Math.max(arrival, fixed) : arrival;
      stop.aviso = notice(arrival, fixed, windows);   // v2.75.0: the notice says why, with the hours
    } else if (begin > arrival + SHOW_WAIT_FROM && windows) stop.espera = begin - arrival;
    estimated[appointment.id] = begin;
    info[appointment.id] = stop;
    time = begin + duration;
  });
  return { est: estimated, fin: time + dayEstimateLegacy.travelMinutes(position, [start.lat, start.lon]), tope: dayEstimateLegacy.minutesOf(settings.tope) };
}

/** The estimate with the hours of the route the appointments come from (without a planned return there is no notice). */
export function estimateDayWithRouteHours(appointments: readonly EstimatedAppointment[], isoDate: string): DayEstimate {
  const hours = dayEstimateLegacy.routeHours(appointments);
  const result = dayEstimateLegacy.withHours(hours, () => dayEstimateLegacy.estimateBase(appointments, isoDate));
  if (!hours?.vuelta) result.tope = Infinity;
  return result;
}
