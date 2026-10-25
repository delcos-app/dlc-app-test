/**
 * The route buttons of «Tu día»: «▶ Empezar ruta» (starts the working day and navigates to the first stop) and «Ruta completa»
 * (every open stop of the day in order in the navigation app, coming back home). Migrated from the legacy prepararParadas,
 * pintarBotonesRuta and rutaCompleta (v2.418.0); prepararParadas stays as an adapter.
 */
import { agendaSources, appointments, legacyAgenda } from '../../legacy/bridge';
import { routes2Legacy } from '../../legacy/routes2-bridge';
import { t } from '../../i18n';
import { todayIso } from '../../services/dates';
import { startWorkingDay } from './working-day';

/** Google Maps takes up to 9 stops in between. */
const MAX_STOPS = 9;

/** Every stop in order and home as the destination (without a start place, the last stop). */
function fullRoute(): void {
  const leaving = routes2Legacy.start(), home: [number, number] | null = leaving.lat !== null && leaving.lat !== undefined ? [leaving.lat, leaving.lon] as [number, number] : null;
  const points = routes2Legacy.stops().map(item => routes2Legacy.pointOf(item)).filter((point): point is [number, number] => point !== null);
  if (!points.length) return;
  if (home) { routes2Legacy.navigate(home, points.slice(0, MAX_STOPS)); return; }
  routes2Legacy.navigate(points[points.length - 1] ?? null, points.slice(0, -1).slice(0, MAX_STOPS));
}

function bindStart(): void {
  const start = document.getElementById('tdempezar'); if (!start || start.dataset.v264) return;
  start.dataset.v264 = '1'; start.textContent = t('routesMore.agenda.startRoute'); start.title = t('routesMore.agenda.startRouteTitle');
  start.onclick = async (): Promise<void> => {
    const first = routes2Legacy.stops()[0];
    await startWorkingDay();
    if (first) routes2Legacy.navigate(routes2Legacy.pointOf(first), null);
  };
}

function paintRouteButtons(isoDate: string): void {
  const actions = document.querySelector('#agcuerpo .tdhead > .acts'); if (!actions) return;
  bindStart();
  let full = document.getElementById('tdrutacompleta');
  if (isoDate >= todayIso() && routes2Legacy.stops().length && agendaSources.isOwnAgenda()) {
    if (!full) {
      actions.insertAdjacentHTML('afterbegin', `<button class="btn sec chico" id="tdrutacompleta" type="button" title="${t('routesMore.agenda.fullRouteTitle')}">${routes2Legacy.iconOrEmpty('map')} ${t('routesMore.agenda.fullRoute')}</button>`);
      full = document.getElementById('tdrutacompleta');
    }
    if (full) full.onclick = (): void => { fullRoute(); };
  } else full?.remove();
}

/** «Tu día» already has its appointments (of the person, in the order of the route): the open ones with a place are the stops. */
export function prepareRouteStops(isoDate: string): void {
  routes2Legacy.setStops(legacyAgenda.dayAppointments().filter(item => appointments.isOpen(item.estado) && routes2Legacy.pointOf(item)));
  try { paintRouteButtons(isoDate); } catch { /* the route buttons are optional */ }
}
