/**
 * The Rutas page around «Mis rutas»: the bar of the working day in progress (on every screen), the day in progress card, the
 * subtitle that says how today goes, «⚙ Tiempos de visita», and today's map. Migrated from the legacy pintarRutaBarra,
 * pintarRutaEnCurso(Base), cargarRutas, cargarRutasBase2, cargarRutasPaso1 and cargarRutasPaso2(Base, Base2) (v2.418.0); cargarRutas,
 * pintarRutaBarra and pintarRutaEnCurso stay as adapters (legado 001, 007, 018 and 019, and the tests use them).
 * Plan 7.3 (cut C): the bar and the day in progress card moved to day-bar.ts (core); this page is in the Rutas chunk.
 */
import { appointments, term } from '../../legacy/bridge';
import { routes2Legacy } from '../../legacy/routes2-bridge';
import { t } from '../../i18n';
import { todayIso } from '../../services/dates';
import { escapeHtml } from '../../services/format';
import { paintDayInProgress, showToday, VISITED, type DayItem } from './day-bar';
import { paintRoutes } from './list';
import { planSettings } from './planner/settings';

/** «⚙ Tiempos de visita» and the subtitle with the minutes per visit. */
function headerTimes(view: HTMLElement): void {
  const actions = view.querySelector('.saludo .acts');
  if (actions && !document.getElementById('rhorario')) {
    actions.insertAdjacentHTML('afterbegin', `<button class="btn sec" id="rhorario" title="${t('routesMore.page.timesTitle', { visit: term('visita') })}">${t('routesMore.page.times', { visit: term('visita') })}</button>`);
    const times = document.getElementById('rhorario'); if (times) times.onclick = (): void => { routes2Legacy.openPlanTimes(); };
  }
  const subtitle = view.querySelector('.saludo .fecha');
  if (subtitle) subtitle.textContent = t('routesMore.page.subtitle', { minutes: planSettings().visita, professional: term('medico') });
}

/** The subtitle says how today goes (what used to be the «Hoy» card of the summary). */
async function todaySubtitle(view: HTMLElement): Promise<void> {
  const subtitle = view.querySelector('.saludo .fecha');
  if (!subtitle || routes2Legacy.workingDay()) return;
  const list = await appointments.ofDay(todayIso()) as DayItem[];
  // The screen may have been painted again, or left, while the appointments were read
  if (!subtitle.isConnected) return;
  const done = list.filter(item => item.estado === VISITED).length, open = list.filter(item => appointments.isOpen(item.estado)).length, count = done + open;
  const text = count ? t('routesMore.page.today', { count, appointments: t(count === 1 ? 'routesMore.page.appointment' : 'routesMore.page.appointments'), done, visited: t(done === 1 ? 'routesMore.page.visitedOne' : 'routesMore.page.visited'), open }) : t('routesMore.page.noneToday');
  subtitle.innerHTML = `${escapeHtml(text)} · <button type="button" class="kcfg" id="rverdia">${t('routesMore.page.seeDay')}</button>`;
  const see = subtitle.querySelector<HTMLElement>('#rverdia'); if (see) see.onclick = showToday;
}

async function pageHeader(): Promise<void> {
  if (routes2Legacy.draft()) return;
  const view = document.getElementById('v-rutas'); if (!view) return;
  headerTimes(view);
  await todaySubtitle(view);
}

/** Paints Rutas: «Mis rutas», the day in progress, the header and today's map. */
export async function loadRoutesPage(): Promise<void> {
  await paintRoutes();
  paintDayInProgress();
  await pageHeader();
  void routes2Legacy.paintDayMapAround();
}
