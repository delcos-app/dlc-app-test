/**
 * «Planificar la semana» (Agenda): whom (who is due a visit, urgent, interested, never visited or a route), which days, how many a
 * day and the hours; the proposal is shown in the open week and saved with «Guardar». Migrated from the legacy planificarSemana and
 * guardarBorradorSemana (v2.418.0); both names stay as adapters.
 */
import { agendaState, appointments, callRpc, legacyDb, notices, permissions, salesTeam, term } from '../../../legacy/bridge';
import { restLegacy } from '../../../legacy/rest-bridge';
import { routes2Legacy } from '../../../legacy/routes2-bridge';
import { t } from '../../../i18n';
import { addDays, todayIso } from '../../../services/dates';
import { escapeHtml } from '../../../services/format';
import { activePreferences, visitTimes, withHours, type PlanHours } from './settings';
import { splitWeek, type WeekCandidate, type WeekEntry, type WeekSplit } from './week-split';
import { withTimetables } from '../../accounts/timetable';

const LOOK_AHEAD_DAYS = 60, DUE_LIMIT = 300, PROPOSALS_LIMIT = 200, MAX_PER_DAY = 30, WEEKDAYS_SHOWN = 5;

const value = (id: string): string => (document.getElementById(id) as HTMLInputElement | null)?.value ?? '';
const isWeekend = (isoDate: string): boolean => new Date(`${isoDate}T12:00:00`).getDay() % 6 === 0;

function dayOption(isoDate: string, free: readonly string[], blocked: Record<string, string>): string {
  const ok = free.includes(isoDate), date = new Date(`${isoDate}T12:00:00`);
  const note = blocked[isoDate] ? t('routesMore.week.blocked') : isoDate < todayIso() ? t('routesMore.week.past') : '';
  return `<label class="opt ${ok ? '' : 'off'} u-m-0"><input type="checkbox" data-spd="${isoDate}" ${ok ? 'checked' : 'disabled'}>
        ${routes2Legacy.weekdayName(isoDate).slice(0, 3)} ${date.getDate()}${note}</label>`;
}

function formHtml(days: readonly string[], free: readonly string[], blocked: Record<string, string>, routes: readonly SavedRoute[]): string {
  const viewed = agendaState.viewed(), saved = activePreferences().plan_semana;
  return `
    <div class="fh"><div><h2>${t('routesMore.week.title')}${viewed ? t('routesMore.week.of', { name: escapeHtml(viewed.nombre) }) : ''}</h2>
      <div class="sm">${t('routesMore.week.subtitle', { theProfessionals: term('medico', { number: 'p', article: 'el' }) })}</div></div>
      <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
    <label for="spfuente">${t('routesMore.week.whom')}</label>
    <select id="spfuente">
      <option value="toca">${t('routesMore.week.due', { visit: term('visita') })}</option>
      <option value="urgentes">${t('routesMore.week.urgent')}</option>
      <option value="interesados">${t('routesMore.week.interested', { interested: term('medico', { number: 'p', capital: 'C', adjective: 'interesado' }), visit: term('visita') })}</option>
      <option value="sin_visitar">${t('routesMore.week.neverVisited')}</option>
      ${routes.map(route => `<option value="ruta:${route.id}">${t('routesMore.week.route', { name: escapeHtml(route.nombre) })}</option>`).join('')}
    </select>
    <label>${t('routesMore.week.days')}</label>
    <div class="spdias">${days.slice(0, WEEKDAYS_SHOWN).map(day => dayOption(day, free, blocked)).join('')}</div>
    <div class="g2">
      <div><label for="spmax">${t('routesMore.week.maxPerDay', { newVisits: term('visita', { number: 'p', adjective: 'nuevo' }) })}</label><input id="spmax" type="number" min="1" max="${MAX_PER_DAY}" placeholder="${t('routesMore.week.untilBack')}"></div>
      <div><label for="spsal">${t('routesMore.week.leave')}</label><input id="spsal" type="time" value="${escapeHtml(saved?.salida ?? '')}"></div>
      <div><label for="spvue">${t('routesMore.week.back')}</label><input id="spvue" type="time" value="${escapeHtml(saved?.vuelta ?? '')}"></div>
      <div><label>${t('routesMore.week.times')}</label><div class="sm" style="padding-top:12px">${t('routesMore.week.timesText', { minutes: visitTimes().visita, professional: term('medico') })}</div></div>
    </div>
    <p class="sm">${t('routesMore.week.hint', { professionals: term('medico', { number: 'p' }) })}</p>
    <div class="acts u-end"><button class="btn sec" data-cerrar>${t('common.cancel')}</button>
      <button class="btn" id="spok">${t('routesMore.week.propose')}</button></div>`;
}

async function candidates(source: string): Promise<WeekCandidate[]> {
  const owner = routes2Legacy.agendaOwner();
  if (source === 'toca') return (await legacyDb().rpc<WeekCandidate[]>('toca_actividad', { p_usuario: owner === salesTeam.currentUserId() && permissions.seesEverything() ? null : owner, lim: DUE_LIMIT })).data ?? [];
  if (source.startsWith('ruta:')) return (await legacyDb().rpc<WeekCandidate[]>('cuentas_de_ruta', { p_id: source.slice('ruta:'.length) })).data ?? [];
  const { data } = await legacyDb().rpc<Record<string, WeekCandidate[] | undefined>>('propuestas_rutas', { lim: PROPOSALS_LIMIT });
  return data?.[source] ?? [];
}

/** Without who already has an open appointment, and (with the recent-visit notice on) without who was seen lately. */
async function filtered(list: readonly WeekCandidate[]): Promise<{ list: WeekCandidate[]; recent: { m: WeekCandidate; motivo: string }[] }> {
  const { data: future } = await callRpc<RouteAppointment[]>('agenda_rango', { p_desde: todayIso(), p_hasta: addDays(todayIso(), LOOK_AHEAD_DAYS), p_usuario: routes2Legacy.agendaOwner() });
  const withAppointment = new Set((future ?? []).filter(item => appointments.isOpen(item.estado)).map(item => item.cuenta_id));
  let rest = await withTimetables(list.filter(item => !withAppointment.has(item.id)));
  const notice = routes2Legacy.revisitNotice();
  if (!notice.on || !rest.length) return { list: rest, recent: [] };
  const { data: seen } = await legacyDb().rpc<{ cuenta_id: string; tipo: string; fecha: string; usuario?: string | null }[]>('actividades_recientes', { p_ids: rest.map(item => item.id), p_desde: addDays(todayIso(), -notice.dias), p_hasta: todayIso() });
  const last = new Map<string, { fecha: string; usuario?: string | null }>();
  for (const item of (seen ?? []).filter(entry => entry.tipo === 'visita')) { const known = last.get(item.cuenta_id); if (!known || item.fecha > known.fecha) last.set(item.cuenta_id, item); }
  const recent = rest.filter(item => last.has(item.id)).map(item => { const visit = last.get(item.id); return { m: item, motivo: t('routesMore.week.visitedOn', { date: routes2Legacy.shortDate(visit?.fecha ?? ''), who: visit?.usuario ? ` (${visit.usuario})` : '' }) }; });
  rest = rest.filter(item => !last.has(item.id));
  return { list: rest, recent };
}

/** The hours of this planning are remembered as the last ones used. */
function rememberHours(hours: PlanHours): void {
  if (JSON.stringify(hours) === JSON.stringify(activePreferences().plan_semana ?? {})) return;
  const preferences = { ...(routes2Legacy.ownPreferences() ?? {}), plan_semana: hours };
  void legacyDb().rpc<Record<string, unknown>>('guardar_preferencias', { p: preferences }).then(({ data }) => { routes2Legacy.setOwnPreferences(data ?? preferences); }, () => undefined);
}

async function propose(button: HTMLButtonElement, monday: string, perDay: Record<string, RouteAppointment[]>): Promise<void> {
  const days = [...document.querySelectorAll<HTMLInputElement>('#dbody [data-spd]:checked')].map(input => input.dataset.spd ?? '');
  if (!days.length) { notices.toast(t('routesMore.week.chooseDay'), true); return; }
  const max = Number(value('spmax')) || null;
  button.disabled = true; button.textContent = t('routesMore.week.calculating');
  const { list, recent } = await filtered(await candidates(value('spfuente')));
  const hours: PlanHours = { salida: value('spsal') || null, vuelta: value('spvue') || null };
  rememberHours(hours);
  const draft = withHours(hours, () => splitWeek(list, { days, perDay, max, monday }));
  draft.horario = hours.salida || hours.vuelta ? hours : null;
  draft.sinDia = [...draft.sinDia, ...recent];
  routes2Legacy.setWeekDraft(draft);
  button.disabled = false; button.textContent = t('routesMore.week.propose');
  (document.getElementById('dlg') as HTMLDialogElement | null)?.close();
  if (!draft.total) notices.toast(t('routesMore.week.noneFits', { visit: term('visita', { article: 'ningun', adjective: 'nuevo' }) }), true);
  void window.delcos.screens.agenda.paintOpenWeek();
}

/** Opens «Planificar la semana» for the week of `monday`. */
export async function planWeek(monday: string, days: readonly string[], blocked: Record<string, string>, perDay: Record<string, RouteAppointment[]>): Promise<void> {
  const free = days.filter(day => day >= todayIso() && !blocked[day] && !isWeekend(day));
  if (!free.length) { notices.toast(t('routesMore.week.noFreeDays'), true); return; }
  const { data } = await callRpc<SavedRoute[]>('rutas_visibles', {});
  const viewed = agendaState.viewed(), owner = routes2Legacy.agendaOwner();
  const routes = (data ?? []).filter(route => !viewed || route.usuario_id === owner || route.visible_para === '*');
  const body = document.getElementById('dbody'), box = document.getElementById('dlg') as HTMLDialogElement | null;
  if (!body || !box) return;
  body.innerHTML = formHtml(days, free, blocked, routes);
  box.showModal();
  const ok = document.getElementById('spok') as HTMLButtonElement | null;
  if (ok) ok.onclick = (): void => { void propose(ok, monday, perDay); };
}

function appointmentOf(draft: WeekSplit, account: WeekCandidate, day: string): Record<string, unknown> {
  return {
    cuenta_id: account.id, fecha: day, hora: null, centro_nombre: account.centro_nombre ?? null, estado: 'Planificada', origen: 'Planificador semanal',
    usuario_id: draft.uid !== salesTeam.currentUserId() ? draft.uid : null, op_id: `ps-${account.id}-${day}`,
    salida: draft.horario?.salida ?? null, vuelta: draft.horario?.vuelta ?? null,
  };
}

/** Saves the new appointments of a day and orders them with those already there; returns how many were saved. */
async function saveDay(draft: WeekSplit, day: string, entries: readonly WeekEntry[]): Promise<number> {
  const ids: string[] = [];
  let saved = 0;
  for (const entry of entries) {
    if (entry.existente) { ids.push(entry.existente.id); continue; }
    if (!entry.m) continue;
    const { data: result } = await legacyDb().rpc<{ ok?: boolean; id: string }>('guardar_cita', { p: appointmentOf(draft, entry.m, day) });
    if (result?.ok) { ids.push(result.id); saved += 1; }
  }
  if (ids.length) await legacyDb().rpc('ordenar_citas', { p_ids: ids });
  return saved;
}

/** Saves the proposal: the new appointments of each day, in order with those already there. */
export async function saveWeekDraft(button: HTMLElement): Promise<void> {
  const draft = routes2Legacy.weekDraft(); if (!draft) return;
  (button as HTMLButtonElement).disabled = true; button.textContent = t('routesMore.week.saving');
  let saved = 0;
  for (const [day, entries] of Object.entries(draft.orden)) saved += await saveDay(draft, day, entries);
  routes2Legacy.setWeekDraft(null);
  notices.toast(t('routesMore.week.saved', { count: saved }));
  routes2Legacy.reloadAgenda(); restLegacy.reloadHome();
}
