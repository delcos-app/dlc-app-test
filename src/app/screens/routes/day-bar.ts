/**
 * The bar «Jornada en curso» at the top of every screen and the day in progress card of Rutas. Split from page.ts for plan 7.3
 * (cut C): the Agenda and the start-up paint the bar, so it stays in the core while the rest of Rutas is loaded on first use.
 */
import { agendaState, appointments, currentScreen, goTo, term } from '../../legacy/bridge';
import { routes2Legacy } from '../../legacy/routes2-bridge';
import { t } from '../../i18n';
import { formatDuration, todayIso } from '../../services/dates';

/** Values stored in the database. */
export const VISITED = 'Visitada';
const NOT_THERE = 'No estaba', NOT_COUNTED = ['Descartada', 'Aplazada'];

export interface DayItem { estado: string }

/** «Ver el día»: today in the Agenda. */
export const showToday = (): void => { agendaState.setMode('dia'); agendaState.setSelectedDate(todayIso()); goTo('agenda'); };

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
