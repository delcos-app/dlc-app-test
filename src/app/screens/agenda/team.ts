/**
 * Agenda for whoever sees the whole team: the «Mi agenda / colleague» selector and the «Equipo» button in the header, and the
 * team view (compliance of each person). Migrated from the legacy asegurarEquipo / agCargarEquipo (v2.395.0).
 */
import { agendaState, currentScreen, legacyAgendaPaint, legacyAgendaParts, permissions, salesTeam } from '../../legacy/bridge';
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';

function selectorHtml(): string {
  const me = salesTeam.currentUserId(), viewed = agendaState.viewed();
  const options = salesTeam.members().filter(member => member.id !== me)
    .map(member => `<option value="${member.id}" ${viewed?.id === member.id ? 'selected' : ''}>${escapeHtml(member.nombre)}</option>`).join('');
  return `<select id="agvista" aria-label="${t('agenda.team.agendaOf')}" title="${t('agenda.team.seeOthers')}">
        <option value="">${t('agenda.team.myAgenda')}</option>${options}</select>`;
}

/** The selector and the «Equipo» button, in the header that is shown (while repainting a frozen copy may keep the same ids). */
export function ensureTeamControls(): void {
  if (currentScreen() !== 'agenda' || !permissions.seesEverything()) return;
  const actions = document.querySelector('#v-agenda > .saludo .acts'); if (!actions) return;
  let selector = actions.querySelector<HTMLSelectElement>('#agvista');
  if (!selector) {
    if (!salesTeam.members().length) { void salesTeam.load().then(ensureTeamControls); return; }
    actions.insertAdjacentHTML('afterbegin', selectorHtml());
    selector = actions.querySelector<HTMLSelectElement>('#agvista');
    if (selector) selector.onchange = (): void => { salesTeam.showAgendaOf(selector?.value ?? ''); };
  }
  let button = actions.querySelector<HTMLElement>('[data-ag="equipo"]');
  if (!button) {
    selector?.insertAdjacentHTML('afterend', `<button class="btn sec" data-ag="equipo">${t('agenda.team.team')}</button>`);
    button = actions.querySelector<HTMLElement>('[data-ag="equipo"]');
  }
  if (!button) return;
  const teamView = legacyAgendaParts.mode() === 'equipo';
  button.textContent = t(teamView ? 'agenda.team.myAgenda' : 'agenda.team.team');
  button.classList.toggle('sec', !teamView);
  button.title = t(teamView ? 'agenda.team.backToMine' : 'agenda.team.seeTeam');
}

/** The team view: compliance of each person (the table itself is still legacy, pintarEquipo). */
export async function loadTeamView(): Promise<void> {
  const view = document.getElementById('v-agenda');
  if (permissions.seesEverything() && !salesTeam.members().length) await salesTeam.load().catch(() => undefined);
  if (currentScreen() !== 'agenda' || legacyAgendaParts.mode() !== 'equipo' || !view) return;
  view.classList.remove('agunida', 'agcinta', 'agb', 'agn');
  view.innerHTML = `<div class="saludo"><div><h1>${t('agenda.title')}</h1><div class="fecha" id="agtit">${t('agenda.team.title')}</div></div><div class="acts u-m-0"></div></div>
    <div class="card" id="agcuerpo"></div>`;
  ensureTeamControls();
  await legacyAgendaPaint.team();
  view.dataset.listo = '1';
}
