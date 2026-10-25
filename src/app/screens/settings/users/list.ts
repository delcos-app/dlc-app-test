/**
 * Configuración → Usuarios: the plan's users, by role, inactive ones and accounts with access; the list with its filters, and the
 * «Invitados» group (professionals and centres with portal access). Migrated from the legacy pintarUsuarios2 and pintarInvitados
 * (v2.420.0); pintarUsuarios2 stays as an adapter (the page tabs of legado 073/076/081 and the tree of Configuración use it).
 */
import { accessLegacy, agendaActions, callRpc, initialsOf } from '../../../legacy/bridge';
import { planLegacy, usersLegacy, type Connection, type UserRow } from '../../../legacy/settings4-bridge';
import { t } from '../../../i18n';
import { formatShortDate } from '../../../services/date-format';
import { toIsoDate } from '../../../services/dates';
import { escapeHtml, formatNumber } from '../../../services/format';
import { connectionText } from '../more/access-log';
import { showUser } from './detail';
import { newUser } from './new-user';
import { isPrescriber, roleColour, roleOptions, userFilters, withOldNames, words } from './model';

const INACTIVE_DAYS = 30, DAY_MS = 864e5;

const matches = (user: UserRow): boolean => {
  const query = userFilters.q.toLowerCase(), text = `${user.nombre} ${user.email ?? ''} ${user.medico ?? user.cuenta ?? ''}`.toLowerCase();
  const state = userFilters.est === 'todos' || (userFilters.est === 'activos' ? Boolean(user.activo) : !user.activo);
  return (!query || text.includes(query)) && (!userFilters.rol || user.rol === userFilters.rol) && state;
};

function userCard(user: UserRow, connections: Record<string, Connection>): string {
  const areas = user.areas ?? {}, area = usersLegacy.moduleArea();
  const modules = Object.keys(area).filter(module => usersLegacy.roleCan(user.rol, 'administrar') || Number(areas[area[module] ?? ''] ?? 0) >= 1);
  const recent = user.ultima_actividad ? new Date(user.ultima_actividad) : null;
  const prescriber = isPrescriber(user);
  const counts = prescriber ? '' : `<span><b>${formatNumber(user.cartera)}</b> ${t('settingsRest.users.inPortfolio')}</span><span><b>${formatNumber(user.visitas_mes)}</b> ${t('settingsRest.users.visitsMonth', words())}</span>`;
  return `<button class="usrcard ${user.activo ? '' : 'off'}" data-usr="${user.id}">
        <span class="usrav" style="background:${roleColour(user.rol)}">${escapeHtml(initialsOf(user.nombre))}</span>
        <span class="usrtx"><b>${escapeHtml(user.nombre)}</b><span class="sm">${escapeHtml(user.email ?? '')}</span>
          <span class="usrchips"><span class="pill p-est">${escapeHtml(user.rol)}</span>${user.activo ? '' : `<span class="pill p-anu">${t('settingsRest.users.deactivated')}</span>`}
            ${prescriber ? `<span class="pill p-per">${escapeHtml(user.medico ?? t('settingsRest.users.noCard'))}</span>` : `<span class="sm">${t('settingsRest.users.modules', { count: modules.length })}</span>`}</span></span>
        <span class="usrdat">${counts}
          <span class="sm usrcon" title="${recent ? t('settingsRest.users.lastActivity', { date: formatShortDate(toIsoDate(recent)) }) : t('settingsRest.users.noActivity')}">${escapeHtml(connectionText(connections[user.id]))}</span></span></button>`;
}

const whenOf = (stamp: string | null | undefined): string | null => {
  if (!stamp) return null;
  const date = new Date(stamp);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
};

function guestRow(user: UserRow, connections: Record<string, Connection>): string {
  const connection = connections[user.id] ?? {}, last = whenOf(connection.ultima_conexion ?? connection.ultimo_acceso);
  const card = user.cuenta_id ? `<button class="pill p-per" data-uinvf="${user.cuenta_id}" title="${t('settingsRest.users.openCard')}">${escapeHtml(user.medico ?? user.cuenta ?? t('settingsRest.users.yourCard'))}</button>` : `<span class="pill p-anu">${t('settingsRest.users.noCard')}</span>`;
  return `<div class="usrinv ${user.activo ? '' : 'off'}">
      <span class="usrav" style="background:${roleColour(user.rol)}">${escapeHtml(initialsOf(user.nombre))}</span>
      <span class="usrtx"><b>${escapeHtml(user.nombre)}</b><span class="sm">${escapeHtml(user.email ?? '')}</span>
        <span class="usrchips">${card}
          ${user.activo ? '' : `<span class="pill p-anu">${t('settingsRest.users.deactivated')}</span>`}
          <span class="sm usrinvult">${last ? escapeHtml(connectionText(connection)) : t('settingsRest.users.notYet')}</span></span>
        <span class="sm usrinvve">${escapeHtml(usersLegacy.guestSees(user))}</span></span>
      <span class="usrinvacts">${accessLegacy.canImpersonate(user) ? `<button class="btn" data-ucomo="${user.id}">${t('settingsRest.users.impersonate')}</button>` : ''}
        <button class="btn sec" data-uinvd="${user.id}">${t('settingsRest.users.details')}</button></span></div>`;
}

/** The «Invitados» group under the list. */
function paintGuests(list: readonly UserRow[], connections: Record<string, Connection>): void {
  const box = document.getElementById('usrinv'); if (!box) return;
  const count = document.getElementById('usrinvn'); if (count) count.textContent = list.length ? `· ${formatNumber(list.length)}` : '';
  const anyGuest = Object.keys(connections).length > 0 || usersLegacy.list().some(user => usersLegacy.isGuest(user));
  box.innerHTML = list.map(user => guestRow(user, connections)).join('') || `<div class="vacio">${anyGuest ? t('settingsRest.users.nobody') : t('settingsRest.users.noGuests')}</div>`;
  box.querySelectorAll<HTMLElement>('[data-uinvf]').forEach(button => { button.onclick = (): void => { agendaActions.openAccount(button.dataset.uinvf ?? ''); }; });
  box.querySelectorAll<HTMLElement>('[data-uinvd]').forEach(button => {
    button.onclick = (): void => { const user = usersLegacy.list().find(item => item.id === button.dataset.uinvd); if (user) showUser(user); };
  });
}

function paintList(all: readonly UserRow[], connections: Record<string, Connection>): void {
  const shown = all.filter(matches), list = shown.filter(user => !usersLegacy.isGuest(user));
  paintGuests(shown.filter(user => usersLegacy.isGuest(user)), connections);
  const box = document.getElementById('usrl'); if (!box) return;
  box.innerHTML = list.map(user => userCard(user, connections)).join('') || `<div class="vacio">${t('settingsRest.users.nobody')}</div>`;
  box.querySelectorAll<HTMLElement>('[data-usr]').forEach(button => {
    button.onclick = (): void => { const user = all.find(item => item.id === button.dataset.usr); if (user) showUser(user); };
  });
}

function kpisHtml(all: readonly UserRow[]): string {
  const plan = planLegacy.of(planLegacy.current().plan), max = planLegacy.contractedUsers();
  const active = all.filter(user => user.activo && !isPrescriber(user)), since = Date.now() - INACTIVE_DAYS * DAY_MS;
  const inactive = active.filter(user => !user.ultima_actividad || new Date(user.ultima_actividad).getTime() < since).length;
  const byRole = new Map<string, number>(); active.forEach(user => { byRole.set(user.rol, (byRole.get(user.rol) ?? 0) + 1); });
  const guests = all.filter(user => (isPrescriber(user) || usersLegacy.roleCan(user.rol, 'portal_centro')) && user.activo).length;
  return `<div class="kpis vtot">
      <div class="kpi"><b>${formatNumber(active.length)} / ${formatNumber(max)}</b><span>${t('settingsRest.users.planUsers', { plan: escapeHtml(plan.nombre) })}</span></div>
      ${[...byRole].map(([role, count]) => `<div class="kpi"><b>${formatNumber(count)}</b><span>${escapeHtml(role)}</span></div>`).join('')}
      <div class="kpi ${inactive ? 'warn' : 'ok'}"><b>${formatNumber(inactive)}</b><span>${t('settingsRest.users.inactive')}</span></div>
      <div class="kpi" data-usrinvk><b>${formatNumber(guests)}</b><span>${t('settingsRest.users.withAccess')}</span></div></div>`;
}

function pageHtml(all: readonly UserRow[]): string {
  const state = (value: string, key: 'active' | 'deactivatedPlural' | 'all'): string => `<option value="${value}" ${userFilters.est === value ? 'selected' : ''}>${t(`settingsRest.users.${key}`)}</option>`;
  return `<div class="cfgpanel">
    ${kpisHtml(all)}
    <div class="card" style="padding-top:14px;padding-bottom:14px">
      <div class="usrbar"><input id="usrq" type="search" placeholder="${t('settingsRest.users.search')}" value="${escapeHtml(userFilters.q)}">
        <select id="usrrol"><option value="">${t('settingsRest.users.allRoles')}</option>${roleOptions(userFilters.rol)}</select>
        <select id="usrest">${state('activos', 'active')}${state('inactivos', 'deactivatedPlural')}${state('todos', 'all')}</select>
        <button class="btn" id="usrnuevo">${t('settingsRest.users.newUser')}</button></div>
      <div id="usrl" class="usrlista"></div></div>
    <div class="card usrinvw" style="padding-top:14px;padding-bottom:14px"><h3>${t('settingsRest.users.guests')} <span id="usrinvn" class="sm"></span></h3>
      <p class="sm">${t('settingsRest.users.guestsHint', words())}</p>
      <div id="usrinv" class="usrinvl"></div></div></div>`;
}

function bindFilters(all: readonly UserRow[], connections: Record<string, Connection>): void {
  const field = (id: string): HTMLInputElement | null => document.getElementById(id) as HTMLInputElement | null;
  const search = field('usrq'), role = field('usrrol'), state = field('usrest');
  if (search) search.oninput = (): void => { userFilters.q = search.value; paintList(all, connections); };
  if (role) role.onchange = (): void => { userFilters.rol = role.value; paintList(all, connections); };
  if (state) state.onchange = (): void => { userFilters.est = state.value; paintList(all, connections); };
  const add = document.getElementById('usrnuevo'); if (add) add.onclick = (): void => { newUser(); };
}

/** Paints Usuarios (v2.270.0: when each one last came in; v2.335.0: their last connection). */
export async function paintUsers(): Promise<void> {
  const [{ data }, access] = await Promise.all([callRpc<UserRow[]>('usuarios_resumen', {}), callRpc<(Connection & { id: string })[]>('invitados_accesos', {})]);
  const connections: Record<string, Connection> = {};
  (access.data ?? []).forEach(item => { connections[item.id] = item; });
  usersLegacy.setConnections(connections);
  const all = data ?? [];
  usersLegacy.setList(withOldNames(all));
  const box = document.getElementById('cfgcuerpo'); if (!box) return;
  box.innerHTML = pageHtml(all);
  bindFilters(all, connections);
  paintList(all, connections);
}
