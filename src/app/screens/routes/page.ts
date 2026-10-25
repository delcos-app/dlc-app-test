/**
 * The Rutas page around «Mis rutas»: the bar of the working day in progress (on every screen), the day in progress card, the
 * subtitle that says how today goes, «⚙ Tiempos de visita», and today's map. Migrated from the legacy pintarRutaBarra,
 * pintarRutaEnCurso(Base), cargarRutas, cargarRutasBase2, cargarRutasPaso1 and cargarRutasPaso2(Base, Base2) (v2.418.0); cargarRutas,
 * pintarRutaBarra and pintarRutaEnCurso stay as adapters (legado 001, 007, 018 and 019, and the tests use them).
 */
import { agendaState, appointments, currentScreen, goTo, term } from '../../legacy/bridge';
import { routes2Legacy } from '../../legacy/routes2-bridge';
import { t } from '../../i18n';
import { formatDuration, todayIso } from '../../services/dates';
import { escapeHtml } from '../../services/format';
import { paintRoutes } from './list';
import { planSettings } from './planner/settings';

/** Values stored in the database. */
const VISITED = 'Visitada', NOT_THERE = 'No estaba', NOT_COUNTED = ['Descartada', 'Aplazada'];

interface DayItem { estado: string }

const showToday = (): void => { agendaState.setMode('dia'); agendaState.setSelectedDate(todayIso()); goTo('agenda'); };

/** The bar «Jornada en curso» at the top of every screen while the working day is on. */
export async function paintRouteBar(): Promise<void> {
  const day = routes2Legacy.workingDay(), bar = document.getElementById('rutabar'); if (!bar) return;
  if (!day) { bar.classList.add('hide'); document.body.classList.remove('conruta'); return; }
  bar.classList.remove('hide'); document.body.classList.add('conruta');
  const list = await appointments.ofDay(todayIso()) as DayItem[];
  const done = list.filter(item => item.estado === VISITED || item.estado === NOT_THERE).length, total = list.filter(item => !NOT_COUNTED.includes(item.estado)).length;
  bar.innerHTML = t('routesMore.page.bar', { time: formatDuration(Date.now() - day.inicio), done, total });
  // The content of the page starts right under the bar, whatever its height
  requestAnimationFrame(() => { document.documentElement.style.setProperty('--rbh', `${bar.offsetHeight}px`); });
  const see = document.getElementById('rbver'), end = document.getElementById('rbfin');
  if (see) see.onclick = showToday;
  if (end) end.onclick = (): void => { void routes2Legacy.endWorkingDay(); };
}

/** In Rutas, the working day in progress is shown in a card (the order, hours and visits are in today's agenda). */
export function paintDayInProgress(): void {
  if (routes2Legacy.draft() || currentScreen() !== 'rutas') return;
  const view = document.getElementById('v-rutas'); if (!view) return;
  if (!document.getElementById('renc')) view.querySelector('.saludo')?.insertAdjacentHTML('afterend', '<div id="renc"></div>');
  const box = document.getElementById('renc'), day = routes2Legacy.workingDay(); if (!box) return;
  box.innerHTML = day ? `<div class="card renc"><h2>${t('routesMore.page.inProgress')}</h2>
    <p class="sm">${t('routesMore.page.startedAgo', { time: formatDuration(Date.now() - day.inicio), visits: term('visita', { number: 'p' }) })}</p>
    <div class="acts" style="padding:0 16px 16px"><button class="btn" id="rencver">${t('routesMore.page.seeDay')}</button>
      <button class="btn sec dang" id="rencfin">${t('routesMore.page.endDay')}</button></div></div>` : '';
  if (!day) return;
  const see = document.getElementById('rencver'), end = document.getElementById('rencfin');
  if (see) see.onclick = showToday;
  if (end) end.onclick = (): void => { void routes2Legacy.endWorkingDay(); };
}

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
