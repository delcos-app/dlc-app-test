/**
 * From a saved route to the agenda: its members in their order, one appointment per member and day (skipping blocked days and who
 * already has one), «Pasar a mi agenda», and the daily refill of the routes that repeat. Migrated from the legacy rnMiembros,
 * rnCitasEn, rnRellenar and rnPasarAgenda (v2.414.0).
 */
import { routesLegacy } from '../../legacy/routes-bridge';
import { agendaState, appLegacy, appointments, callRpc, goTo, legacyDb, notices, salesTeam, term } from '../../legacy/bridge';
import { t } from '../../i18n';
import { addDays, todayIso } from '../../services/dates';
import { formatShortDate } from '../../services/date-format';
import { datesOf, hasLocation, horizonOf } from './model';

const REFILL_DAYS = 28;

interface DayAppointment { id: string; cuenta_id: string; estado: string }
export interface CopyResult { n: number; saltados: string[]; error?: boolean }

/** The accounts of a route, in the order it was saved (a route by criteria keeps the order of the database). */
export async function routeMembers(route: SavedRoute): Promise<RouteMember[]> {
  const { data } = await legacyDb().rpc<RouteMember[]>('cuentas_de_ruta', { p_id: route.id });
  const members = data ?? [], codes = route.codigos ?? [];
  const position = (id: string): number => { const index = codes.indexOf(id); return index < 0 ? 1e9 : index; };
  return route.dinamica ? members : members.slice().sort((first, second) => position(first.id) - position(second.id));
}

async function copyDay(route: SavedRoute, members: readonly RouteMember[], isoDate: string, result: CopyResult): Promise<boolean> {
  const existing = await appointments.ofDay(isoDate) as unknown as DayAppointment[], ids: string[] = [];
  let order = existing.length;
  for (const member of members) {
    const already = existing.find(item => item.cuenta_id === member.id && appointments.isOpen(item.estado));
    if (already) { ids.push(already.id); continue; }
    order += 1;
    const fixed = route.fijas?.[member.id];
    const { data: saved, error } = await legacyDb().rpc<{ ok?: boolean; id: string }>('guardar_cita', { p: {
      cuenta_id: member.id, fecha: isoDate, hora: fixed ? fixed : null, centro_nombre: member.centro_nombre ? member.centro_nombre : null, estado: routesLegacy.firstOpenState(),
      origen: 'Ruta', orden: order, salida: route.salida ? route.salida : null, vuelta: route.vuelta ? route.vuelta : null, op_id: `r-${route.id}-${member.id}-${isoDate}`,
    } });
    if (error || !saved?.ok) { notices.toast(t('routes.agenda.couldNotSave'), true); return false; }
    ids.push(saved.id); result.n += 1;
  }
  const closed = existing.filter(item => !appointments.isOpen(item.estado)).map(item => item.id);
  const others = existing.filter(item => appointments.isOpen(item.estado) && !ids.includes(item.id)).map(item => item.id);
  await legacyDb().rpc('ordenar_citas', { p_ids: [...closed, ...others, ...ids] });
  return true;
}

/** Adds the route to the agenda on each of `dates`. */
export async function appointmentsOn(route: SavedRoute, members: readonly RouteMember[], dates: readonly string[]): Promise<CopyResult> {
  const result: CopyResult = { n: 0, saltados: [] };
  const blocked = dates.length ? await routesLegacy.blockedDays(dates[0] ?? '', dates[dates.length - 1] ?? '') : {};
  for (const isoDate of dates) {
    if (blocked[isoDate]) { result.saltados.push(isoDate); continue; }
    if (!await copyDay(route, members, isoDate, result)) return { ...result, error: true };
  }
  appLegacy.forgetCache();
  return result;
}

const rememberUntil = (route: SavedRoute, repeat: RouteRepeat, last: string): PromiseLike<unknown> =>
  legacyDb().rpc('guardar_ruta', { p: { id: route.id, repeticion: { ...repeat, hasta: last } } });

async function refillRoute(route: SavedRoute & { repeticion: RouteRepeat }): Promise<void> {
  const repeat = route.repeticion, today = todayIso();
  const from = repeat.hasta && repeat.hasta >= today ? addDays(repeat.hasta, 1) : repeat.desde && repeat.desde > today ? repeat.desde : today;
  const dates = datesOf(repeat, from, addDays(today, REFILL_DAYS)); if (!dates.length) return;
  const members = (await routeMembers(route)).filter(hasLocation); if (!members.length) return;
  const result = await appointmentsOn(route, members, dates);
  if (!result.error) await rememberUntil(route, repeat, dates[dates.length - 1] ?? '');
}

/** The routes that repeat fill themselves up to 4 weeks ahead (once a day, only the user's own). */
export async function refillRepeating(): Promise<void> {
  try {
    const key = `delcos-rnrell-${salesTeam.currentUserId()}`; if (localStorage.getItem(key) === todayIso()) return;
    localStorage.setItem(key, todayIso());
    const { data } = await callRpc<SavedRoute[]>('rutas_visibles', {});
    const own = (data ?? []).filter((route): route is SavedRoute & { repeticion: RouteRepeat } => Boolean(route.mia && route.repeticion && route.repeticion.tipo !== 'fecha'));
    for (const route of own) await refillRoute(route);
  } catch { /* the refill is tried again tomorrow */ }
}

async function datesToCopy(repeat: RouteRepeat | null): Promise<string[] | null> {
  if (!repeat) {
    const day = await routesLegacy.askField(t('routes.agenda.whichDay'), 'date', routesLegacy.nextWorkingDay(), t('routes.agenda.day'));
    return day ? [day] : null;
  }
  return datesOf(repeat, repeat.desde && repeat.desde > todayIso() ? repeat.desde : todayIso(), horizonOf(repeat));
}

function confirmCopy(count: number, dates: readonly string[]): Promise<boolean> {
  const text = t('routes.agenda.confirmText', { count, appointments: t(count === 1 ? 'routes.agenda.oneAppointment' : 'routes.agenda.appointments'), days: dates.length, dates: dates.map(formatShortDate).join(', ') });
  return notices.confirm(text, { titulo: t('routes.agenda.confirmTitle'), ok: t('routes.agenda.add') });
}

function addedText(result: CopyResult): string {
  const added = t('routes.agenda.addedText', { count: result.n, added: t(result.n === 1 ? 'routes.agenda.oneAdded' : 'routes.agenda.added') });
  const skipped = result.saltados.length ? t('routes.agenda.skipped', { count: result.saltados.length, blocked: t(result.saltados.length === 1 ? 'routes.agenda.oneBlocked' : 'routes.agenda.blocked') }) : '';
  return added + skipped;
}

/** Copies to the agenda and opens it on the first day added. */
async function copyAndOpen(route: SavedRoute, members: readonly RouteMember[], dates: readonly string[]): Promise<void> {
  const result = await appointmentsOn(route, members, dates);
  if (result.error) return;
  const repeat = route.repeticion ?? null;
  if (repeat && repeat.tipo !== 'fecha') await rememberUntil(route, repeat, dates[dates.length - 1] ?? '');
  notices.toast(addedText(result));
  agendaState.setMode('dia'); agendaState.setSelectedDate(dates.find(day => !result.saltados.includes(day)) ?? dates[0] ?? todayIso()); goTo('agenda');
}

/** «Pasar a mi agenda»: the days it repeats on (or the day asked), then the agenda on the first day added. */
export async function copyToAgenda(card: RouteCard, button?: HTMLButtonElement): Promise<void> {
  const route = card.r, members = card.ms.filter(hasLocation);
  if (!members.length) { notices.toast(t('routes.agenda.noLocated', { professionals: term('medico', { number: 'p' }) }), true); return; }
  const dates = await datesToCopy(route.repeticion ?? null);
  if (!dates) return;
  if (!dates.length) { notices.toast(t('routes.agenda.noNextDay'), true); return; }
  if (dates.length > 1 && !await confirmCopy(members.length, dates)) return;
  if (button) button.disabled = true;
  try { await copyAndOpen(route, members, dates); } finally { if (button) button.disabled = false; }
}
