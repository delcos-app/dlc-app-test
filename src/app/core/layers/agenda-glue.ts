/**
 * Agenda behaviour from legacy layers: the strip's month pop-up closing, «Tu día» cards opening their appointment, «Equipo» going
 * back to the day (v2.224.0), today's times with real traffic when the map already has the route (v2.258.0) and «urgente» showing at
 * once (v2.273.0). Moved from legado 081, 082, 103 and 117 (v2.424.0); estimarDia and alternarUrgente stay as adapters, and the
 * real-times state (TD_REAL, TD_CALC) stays in legacy.
 */
import { agendaGlueLegacy } from '../../legacy/legado-d-glue-bridge';

/** Legado 081: the month pop-up closes on a click outside or Escape; a «Tu día» card opens its appointment. */
export function installAgendaListeners(): void {
  document.addEventListener('click', event => {
    const month = document.getElementById('agmes');
    if (month?.classList.contains('pop') && !(event.target as Element).closest('#agmes, #cmesb, .agmpop, .agpop')) agendaGlueLegacy.closeMonth();
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') agendaGlueLegacy.closeMonth(); });
  // Pressing the card (outside its buttons) opens the appointment, like the row of before
  document.addEventListener('click', event => {
    const target = event.target as Element, card = target.closest<HTMLElement>('.tdu');
    if (!card || target.closest('button, a, input, select, .agtamb[data-agtc]')) return;
    const appointment = agendaGlueLegacy.dayAppointments().find(item => item.id === card.dataset.tdu); if (appointment) agendaGlueLegacy.openAppointment(appointment);
  });
  document.addEventListener('keydown', event => {
    const target = event.target as HTMLElement;
    if (event.key !== 'Enter' || !target.matches('.tdu')) return;
    const appointment = agendaGlueLegacy.dayAppointments().find(item => item.id === target.dataset.tdu); if (appointment) agendaGlueLegacy.openAppointment(appointment);
  });
}

/** Legado 082: «Equipo» pressed again goes back to the day view. */
export function installTeamToggle(): void {
  window.addEventListener('click', event => {
    const button = (event.target as Element).closest('[data-ag="equipo"]');
    if (!button || agendaGlueLegacy.mode() !== 'equipo') return;
    event.stopImmediatePropagation(); event.preventDefault();
    agendaGlueLegacy.backToDay();
  }, true);
}

const REAL_TIMES_MS = 600000;

/** estimarDia: before estimating today, the route already asked by the map (same order, last 10 minutes) gives real times. */
export function estimateDay(appointments: unknown, isoDate: string, rest: unknown[]): unknown {
  // Only «Tu día» (TD_CITAS); the others (map, planner) as they were
  if (agendaGlueLegacy.calculating() || appointments !== agendaGlueLegacy.dayAppointments()) return agendaGlueLegacy.baseEstimate(appointments, isoDate, rest);
  const route = agendaGlueLegacy.dayRoute(appointments, isoDate);
  if (!route) {
    if (agendaGlueLegacy.realTimes() && isoDate === agendaGlueLegacy.today()) agendaGlueLegacy.setRealTimes(null);
    return agendaGlueLegacy.baseEstimate(appointments, isoDate, rest);
  }
  if (!(agendaGlueLegacy.realTimesValid() && agendaGlueLegacy.realTimes()?.k === route.k)) {
    agendaGlueLegacy.setRealTimes(null);
    const remembered = agendaGlueLegacy.rememberedRoute(route.k);
    if (remembered && Date.now() - remembered.t < REAL_TIMES_MS) agendaGlueLegacy.putRealTimes(route, remembered.r);
  }
  return agendaGlueLegacy.baseEstimate(appointments, isoDate, rest);
}

/** alternarUrgente: marking or unmarking «urgente» shows at once in Cuentas and in the Agenda. */
export async function toggleUrgent(id: string, rest: unknown[]): Promise<unknown> {
  const result = await agendaGlueLegacy.baseToggleUrgent(id, rest);
  agendaGlueLegacy.forgetCaches();
  const screen = agendaGlueLegacy.currentScreen();
  if (screen === 'directorio') agendaGlueLegacy.searchAccounts();
  if (screen === 'agenda') agendaGlueLegacy.quietRefresh();
  return result;
}
