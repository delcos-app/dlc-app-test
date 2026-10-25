/**
 * The «Horario» window of the route plan, with a line of help under each field (departure, return, visit length, stop time) and a
 * note on what the times are used for. Migrated from the legacy abrirHorarioPlan of pantallas/cuentas.js (v2.427.0); the name
 * stays as an adapter (the routes bridge, the plan card and the tests call it). The window itself is still the legacy
 * abrirHorarioPlanBase of Configuración.
 */
import { term } from '../../legacy/bridge';
import { leftoversLegacy } from '../../legacy/leftovers-bridge';
import { t, type MessageKey } from '../../i18n';
import { escapeHtml } from '../../services/format';

const HELP: readonly (readonly [string, MessageKey])[] = [
  ['hsal', 'leftovers.planHours.departure'], ['htop', 'leftovers.planHours.return'], ['hvis', 'leftovers.planHours.visit'], ['hpar', 'leftovers.planHours.stop'],
];

const words = (): Record<string, string> => ({
  firstVisit: term('visita', { article: 'primer' }), visits: term('visita', { number: 'p' }), visit: term('visita'),
  aProfessional: term('medico', { article: 'un' }), professionals: term('medico', { number: 'p' }),
});

export function openPlanHours(): void {
  leftoversLegacy.openPlanHoursWindow();
  HELP.forEach(([id, key]) => {
    const input = document.getElementById(id);
    if (input && !input.parentElement?.querySelector('.ayudah')) input.insertAdjacentHTML('afterend', `<span class="sm ayudah">${escapeHtml(t(key, words()))}</span>`);
  });
  const header = document.getElementById('dbody')?.querySelector('.fh');
  if (header && !document.getElementById('horinfo')) header.insertAdjacentHTML('afterend', `<p class="sm" id="horinfo">${t('leftovers.planHours.info', words())}</p>`);
}
