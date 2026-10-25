/**
 * «Tu día» with real times, without spending more: today, with two or more open stops with a place, the times of the street route
 * with traffic are used when «Tu día en el mapa» already asked for them (same key, 10 minutes in memory), or when the user asks
 * («Empezar jornada», «Calcular con tráfico»). The header says whether the hours are with real traffic. Migrated from the legacy
 * tdMinutos, tdRutaDia, tdPonerReal, tdTrafico and tdMarcaTrafico (v2.418.0); tdMinutos, tdRutaDia and tdPonerReal stay as adapters
 * (the day estimate of legado 024 and 103 uses them).
 */
import { agendaState, appointments, legacyAgenda, notices } from '../../legacy/bridge';
import { routes2Legacy } from '../../legacy/routes2-bridge';
import { t } from '../../i18n';
import { formatMinutes, todayIso } from '../../services/dates';
import { dayMapPlan } from '../routes/today/day-plan';
import { reasonText, streetRoute } from '../routes/today/service';
import { repaintSmoothly } from './your-day/reorder';

const MIN_STOPS = 2, MAX_POINTS = 30;

export interface DayRoute { puntos: [number, number][]; salida: string | null; k: string }

/** Minutes between two points: the time with traffic of that leg when it is known, otherwise the usual estimate. */
export function legMinutes(from: [number, number], to: [number, number]): number {
  if (routes2Legacy.realTrafficValid()) { const known = routes2Legacy.realTraffic()?.mapa.get(routes2Legacy.legKey(from, to)); if (known !== undefined) return known; }
  return routes2Legacy.travelMinutes(from, to);
}

/** Today's route with the same points and start as «Tu día en el mapa» (null on another day or with fewer than two stops). */
export function dayRoute(list: readonly RouteAppointment[] | null | undefined, isoDate: string | null): DayRoute | null {
  if (isoDate !== todayIso() || !list) return null;
  if (list.filter(item => appointments.isOpen(item.estado) && routes2Legacy.pointOf(item)).length < MIN_STOPS) return null;
  routes2Legacy.setCalculating(true);
  let plan;
  try { plan = dayMapPlan(list, isoDate, null); } finally { routes2Legacy.setCalculating(false); }
  if (plan.puntos.length < MIN_STOPS || plan.puntos.length > MAX_POINTS) return null;
  const first = plan.segs[0], start = first ? `${isoDate}T${formatMinutes(Math.max(0, first.a))}:00` : null;
  return { puntos: plan.puntos, salida: start, k: JSON.stringify([plan.puntos, start]) };
}

/** Keeps the times with traffic of `route` (false when the answer does not fit its legs). */
export function setRealTimes(route: DayRoute | null, result: StreetRoute | null | undefined): boolean {
  const legs = result?.tramos;
  if (!route || !result?.ok || !legs || legs.length !== route.puntos.length - 1) return false;
  const times = new Map<string, number>();
  legs.forEach((leg, index) => { times.set(routes2Legacy.legKey(route.puntos[index], route.puntos[index + 1]), Math.round(Number(leg.min) || 0)); });
  routes2Legacy.setRealTraffic({ k: route.k, mapa: times, t: Date.now() });
  return true;
}

const todayList = (): RouteAppointment[] => legacyAgenda.dayAppointments() as unknown as RouteAppointment[];

/** Asks for the times with traffic (one query) and paints «Tu día» again. */
export async function requestTraffic(silent: boolean): Promise<void> {
  const route = dayRoute(todayList(), legacyAgenda.selectedDate()); if (!route) return;
  const button = document.getElementById('tdtrafico') as HTMLButtonElement | null;
  if (button) { button.disabled = true; button.textContent = t('routesMore.traffic.calculating'); }
  const result = await streetRoute(route.puntos, route.salida);
  if (setRealTimes(route, result)) { if (legacyAgenda.isDayView()) void repaintSmoothly(); return; }
  if (!silent) notices.toast(t('routesMore.traffic.approximate', { reason: reasonText(result.motivo) }), true);
  const again = document.getElementById('tdtrafico') as HTMLButtonElement | null;
  if (again) { again.disabled = false; again.textContent = t('routesMore.traffic.calculate'); }
}

/** In the header of «Tu día» (today): whether the hours go with real traffic, or the button to calculate them. */
export function markTraffic(): void {
  const stats = document.querySelector('#agcuerpo .tdhead .tdstats'); if (!stats) return;
  stats.querySelectorAll('.tdtraf').forEach(item => { item.remove(); });
  const route = dayRoute(todayList(), legacyAgenda.selectedDate()); if (!route || agendaState.viewed()) return;
  const real = routes2Legacy.realTrafficValid() && routes2Legacy.realTraffic()?.k === route.k;
  stats.insertAdjacentHTML('beforeend', real
    ? `<span class="tdtraf tdtrafok" title="${t('routesMore.traffic.realTitle')}">${t('routesMore.traffic.real')}</span>`
    : `<span class="tdtraf"><button type="button" class="kcfg" id="tdtrafico" title="${t('routesMore.traffic.calculateTitle')}">${t('routesMore.traffic.calculate')}</button></span>`);
  const button = document.getElementById('tdtrafico'); if (button) button.onclick = (): void => { void requestTraffic(false); };
}
