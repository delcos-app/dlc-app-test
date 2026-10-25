/**
 * The two trays of «Tu día»: «Les toca visita» (toca_actividad) and «Pendientes de días anteriores» (pendientes_ruta). Their
 * buttons sit in the day header; each one opens its list in the side panel.
 * Migrated from the legacy agTocaLista / agBandejasBase / agBandejas / agBandeja (v2.391.0).
 */
import { agendaActions, agendaSuggestions, goTo, icon, legacyAgenda, sidePanel, term } from '../../legacy/bridge';
import { t } from '../../i18n';
import { formatShortDate } from '../../services/date-format';
import { escapeHtml } from '../../services/format';
import { isPresent } from '../../services/values';
import { withAppointmentToday } from './same-centre';
import { planFromList, type PlanMember } from '../routes/planner/plan';
import { rescheduleAppointments } from './reschedule';

type Tray = 'toca' | 'pend';
const CONTEXT_PREFIX = 'agband-';
/** Rutas needs a moment to mount before a plan is built on it. */
const ROUTES_MOUNT_MS = 60;

/** Accounts due a visit on the shown day, without the ones that already have an appointment that day. */
export function dueList(): DueAccount[] {
  const suggestions = agendaSuggestions.forDay();
  if (!suggestions || suggestions.fecha !== legacyAgenda.selectedDate()) return [];
  const already = withAppointmentToday();
  return suggestions.toca.filter(account => !already.has(account.id ?? account.cuenta_id));
}

/** v2.338.0 (Eric): on mobile the header goes in one row too, with «Volver a hoy» first. */
function putBackToTodayFirst(actions: Element): void {
  const backToToday = document.getElementById('agahoy');
  if (backToToday && !matchMedia('(min-width: 761px)').matches && actions.firstElementChild !== backToToday) actions.prepend(backToToday);
}

/** In the actions row the pending label is shorter. */
function trayButtonsHtml(due: number, pending: number, inActions: boolean): string {
  const pendingLabel = t(inActions ? 'agenda.trays.pendingShort' : 'agenda.trays.pending');
  return `<div class="agband${inActions ? ' agbandin' : ''}" id="agband">`
    + (due ? `<button type="button" data-agbd="toca">${icon('target')} ${t('agenda.trays.due', { visit: term('visita') })} <b>${due}</b></button>` : '')
    + (pending ? `<button type="button" class="urg" data-agbd="pend">${icon('circle-alert')} ${pendingLabel} <b>${pending}</b></button>` : '') + '</div>';
}

/** The tray buttons in the header of «Tu día» (in the actions row when there is one). */
export function paintTrayButtons(): void {
  const header = document.querySelector('#agcuerpo .tdhead'); if (!header) return;
  document.getElementById('agband')?.remove();
  const due = dueList().length, pending = agendaSuggestions.pending().length;
  const actions = document.querySelector('#agcuerpo .tdhead .acts');
  if (actions) putBackToTodayFirst(actions);
  if (!due && !pending) return;
  const html = trayButtonsHtml(due, pending, Boolean(actions));
  if (actions) actions.insertAdjacentHTML('beforeend', html); else header.insertAdjacentHTML('afterend', html);
  document.getElementById('agband')?.querySelectorAll<HTMLElement>('[data-agbd]').forEach(button => {
    button.onclick = (): void => { openTray(button.dataset.agbd === 'toca' ? 'toca' : 'pend'); };
  });
}

function dueRow(account: DueAccount): string {
  const visit = term('visita'), id = account.id ?? '';
  const days = isPresent(account.dias_sin_visita) ?t('agenda.trays.daysWithout', { days: account.dias_sin_visita, visit }) : t('agenda.trays.neverVisited');
  return `<div class="item u-cursor-default"><span class="ic">${icon('target')}</span>
        <span class="tx"><b>${escapeHtml(account.nombre)}</b><span class="sm">${escapeHtml([account.estado_comercial, days, account.municipio].filter(Boolean).join(' · '))}</span></span>
        <span class="acts u-m-0"><button class="btn sec" data-agbf="${id}">${t('agenda.trays.card')}</button><button class="btn sec" data-agbc="${id}">${t('agenda.trays.addAppointment')}</button></span></div>`;
}

function pendingRow(item: PendingAppointment): string {
  return `<div class="item u-cursor-default"><span class="ic w">!</span>
        <span class="tx"><b>${escapeHtml(item.nombre)}</b><span class="sm">${formatShortDate(item.fecha)}${item.centro_nombre ? ` · ${escapeHtml(item.centro_nombre)}` : ''}</span></span>
        <span class="acts u-m-0"><button class="btn sec" data-cita="hoy|${item.id}">${t('agenda.trays.moveToToday')}</button><button class="btn sec" data-cita="desc|${item.id}">${t('agenda.trays.discard')}</button></span></div>`;
}

function trayHtml(tray: Tray, due: readonly DueAccount[], pending: readonly PendingAppointment[]): string {
  const isDue = tray === 'toca';
  const title = isDue ? t('agenda.trays.due', { visit: term('visita') }) : t('agenda.trays.pending');
  const text = isDue ? t('agenda.trays.dueText', { professional: term('medico') }) : t('agenda.trays.pendingText');
  const action = isDue
    ? (due.some(account => account.lat) ? `<button class="btn sec" id="agbruta">${t('agenda.trays.planRoute')}</button>` : '')
    : (pending.length ? `<button class="btn sec" id="agbrepro">${t('agenda.trays.rescheduleAll')}</button>` : '');
  const rows = isDue ? due.map(dueRow).join('') : pending.map(pendingRow).join('');
  return `<div class="tbox"><div class="fh"><h2>${escapeHtml(title)}</h2><button class="x" id="tclose" aria-label="${t('common.close')}">✕</button></div><p class="sm">${escapeHtml(text)}</p>
    <div class="acts" style="margin:8px 0">${action}</div>
    <div class="agbdc"><div class="lista">${rows || `<div class="vacio">${t('agenda.trays.nothingPending')}</div>`}</div></div></div>`;
}

function bindTray(panel: HTMLElement, due: readonly DueAccount[], pending: readonly PendingAppointment[]): void {
  const close = (): void => { panel.classList.remove('abierto'); };
  const closeButton = document.getElementById('tclose'); if (closeButton) closeButton.onclick = close;
  panel.querySelectorAll<HTMLElement>('[data-agbf]').forEach(button => { button.onclick = (): void => { agendaActions.openAccount(button.dataset.agbf ?? ''); }; });
  panel.querySelectorAll<HTMLElement>('[data-agbc]').forEach(button => { button.onclick = (): void => { agendaActions.newAppointment(button.dataset.agbc ?? '', legacyAgenda.selectedDate()); }; });
  const route = document.getElementById('agbruta');
  if (route) route.onclick = (): void => { close(); goTo('rutas'); setTimeout(() => { void planFromList(due as unknown as PlanMember[], 'toca', route); }, ROUTES_MOUNT_MS); };
  const reschedule = document.getElementById('agbrepro');
  if (reschedule) reschedule.onclick = (): void => { void rescheduleAppointments(pending, t('agenda.trays.pending'), t('agenda.trays.notVisited', { count: pending.length })); };
}

/** Opens a tray in the side panel. */
export function openTray(tray: Tray): void {
  if (!legacyAgenda.isDayView()) return;
  const panel = document.getElementById('tools'); if (!panel) return;
  const due = tray === 'toca' ? dueList() : [], pending = tray === 'pend' ? agendaSuggestions.pending() : [];
  panel.innerHTML = trayHtml(tray, due, pending);
  bindTray(panel, due, pending);
  sidePanel.setContext(CONTEXT_PREFIX + tray);
  panel.classList.add('abierto');
}

/** After the day is painted again: an open tray shows the new data. */
export function refreshOpenTray(): void {
  const context = sidePanel.context() ?? '';
  if (document.getElementById('tools')?.classList.contains('abierto') && context.startsWith(CONTEXT_PREFIX)) openTray(context.slice(CONTEXT_PREFIX.length) === 'toca' ? 'toca' : 'pend');
}
