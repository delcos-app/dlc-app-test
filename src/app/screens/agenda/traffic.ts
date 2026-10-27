/**
 * «Tu día» with real times, without spending more: today, with two or more open stops with a place, the times of the street route
 * with traffic are used when «Tu día en el mapa» already asked for them (same key, 10 minutes in memory), or when the user asks
 * («Empezar jornada», «Calcular con tráfico»). The header says whether the hours are with real traffic. Migrated from the legacy
 * tdMinutos, tdRutaDia, tdPonerReal, tdTrafico and tdMarcaTrafico (v2.418.0); tdMinutos, tdRutaDia and tdPonerReal stay as adapters
 * (the day estimate of legado 024 and 103 uses them). Plan 7.3 (cut C): those three are in traffic-times.ts (core).
 */
import { agendaState, legacyAgenda, notices } from '../../legacy/bridge';
import { routes2Legacy } from '../../legacy/routes2-bridge';
import { t } from '../../i18n';
import { reasonText, streetRoute } from '../routes/today/service';
import { dayRoute, setRealTimes } from './traffic-times';
import { repaintSmoothly } from './your-day/reorder';

export { dayRoute, legMinutes, setRealTimes, type DayRoute } from './traffic-times';

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
