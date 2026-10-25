/**
 * Whose agenda is shown and the reads many parts of the app share: the appointments of a day, the user's planned appointments, the
 * tasks of a day, the blocked days and whether a visit can be recorded on a day. Migrated from the legacy helpers of
 * pantallas/agenda.js (v2.427.0); their names stay as adapters (bridges, Rutas, Parque and the tests call them). The agenda being
 * viewed (AG_VISTA), the tasks of the day (TAREAS_DIA) and the cache epochs stay in legacy state.
 */
import { cachedRpc, callRpc } from '../../legacy/bridge';
import { leftoversLegacy } from '../../legacy/leftovers-bridge';
import { t } from '../../i18n';
import { orFallback } from '../../services/values';
import { peekBlocked } from './preload';

/** Values stored in the database. */
const PLANNED = ['Planificada', 'Confirmada'];
const MAX_PLANNED = 2000;

/** The user's appointments of a day (from the read cache). */
export async function appointmentsOfDay(isoDate: string): Promise<unknown[]> {
  const answer = await cachedRpc<unknown[]>('agenda_rango', { p_desde: isoDate, p_hasta: isoDate, p_usuario: leftoversLegacy.userId() }, `agenda-${isoDate}`);
  return answer.data ?? [];
}

/** The agenda owner: the person whose agenda administration is viewing, else the user. */
export const agendaOwnerId = (): string => leftoversLegacy.viewedAgenda()?.id ?? leftoversLegacy.userId();

/** The user filter of agenda reads: the viewed person, nobody for administration (everyone), else the user. */
export function agendaUserFilter(): string | null {
  const viewed = leftoversLegacy.viewedAgenda();
  if (leftoversLegacy.screen() === 'agenda' && viewed) return viewed.id;
  return leftoversLegacy.can('administrar') ? null : leftoversLegacy.userId();
}

/** Opens the agenda of another person (or the user's own). */
export async function showAgendaOf(id: string | null | undefined): Promise<void> {
  if (!id || id === leftoversLegacy.userId()) { leftoversLegacy.setViewedAgenda(null); leftoversLegacy.reloadAgenda(); return; }
  const { data } = await callRpc<{ id: string; nombre: string; rol: string; preferencias?: Record<string, unknown> | null }>('preferencias_de', { p_usuario: id });
  if (!data) { leftoversLegacy.toast(t('leftovers.agenda.couldNotOpen'), true); return; }
  leftoversLegacy.setViewedAgenda({ id: data.id, nombre: data.nombre, rol: data.rol, preferencias: data.preferencias ?? {} });
  leftoversLegacy.reloadAgenda();
}

/** The user's open appointments from today: account → first date. */
export async function myPlannedAppointments(): Promise<Record<string, string>> {
  try {
    const { data } = await leftoversLegacy.planned(PLANNED, leftoversLegacy.today(), MAX_PLANNED);
    const first: Record<string, string> = {};
    (data ?? []).forEach(item => { if (!first[item.cuenta_id]) first[item.cuenta_id] = item.fecha; });
    return first;
  } catch { return {}; }
}

/** The tasks of a day (each person's own: none in another person's agenda), kept in memory until the day changes. */
export async function tasksOfDay(isoDate: string): Promise<unknown[] | null> {
  const viewed = leftoversLegacy.viewedAgenda();
  if (viewed && viewed.id !== leftoversLegacy.userId()) return null;
  const kept = leftoversLegacy.dayTasks();
  if (kept?.f === isoDate) return kept.l;
  const { data, error } = await leftoversLegacy.tasks(isoDate);
  if (error) return null;
  const list = data ?? [];
  leftoversLegacy.setDayTasks({ f: isoDate, l: list });
  return list;
}

/** Something changed while a window was open (the window was painted with older data). */
export const changedWhileOpen = (): boolean => leftoversLegacy.cacheEpoch() !== leftoversLegacy.dialogEpoch();

/** A visit can be recorded today, on an open day, or on a past day with the «visita_fecha_pasada» permission. */
export function canRecordOn(isoDate: string | null | undefined): boolean {
  const today = leftoversLegacy.today();
  return !isoDate || isoDate === today || (isoDate < today && leftoversLegacy.can('visita_fecha_pasada'));
}

/** The blocked days of the agenda owner between two dates: date → reason. */
export async function readBlockedDays(from: string, to: string): Promise<Record<string, string>> {
  const { data } = await callRpc<{ fecha: string; motivo?: string | null }[]>('dias_bloqueados_rango', { p_desde: from, p_hasta: to, p_usuario: agendaOwnerId() });
  const blocked: Record<string, string> = {};
  (data ?? []).forEach(item => { blocked[item.fecha] = orFallback(item.motivo, t('leftovers.agenda.blockedDay')); });
  return blocked;
}

/** The blocked days, from the preloaded ones when they are there. */
export function blockedDays(from: string, to: string): Promise<Record<string, string>> {
  const preloaded = peekBlocked(from, to);
  return preloaded ? Promise.resolve(preloaded) : readBlockedDays(from, to);
}

/** The blocked days of `days` days from `from` (none if they cannot be read). */
export async function blockedFrom(from: string, days: number): Promise<Record<string, string>> {
  try { return await blockedDays(from, leftoversLegacy.addDays(from, days - 1)); } catch { return {}; }
}
