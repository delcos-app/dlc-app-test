/**
 * Agenda data loader («sin fantasmas», v2.248.0): before painting a change, Agenda asks for everything the pieces will need and
 * keeps it here while it paints, so every piece reads it without waiting for the network and the screen appears in one go.
 * The legacy rpcCache('agenda_rango') and bloqueadosSemana read from here first (peekRange / peekBlocked).
 * Migrated from the legacy agCargaRango / agCargaBloq / agDiaCargas / agCintaCargas / agSemCargas / agSugDatos / agPonerSug /
 * agConDatos / AG_PRE (v2.393.0).
 */
import { agendaSources, cachedRpc, callRpc, legacyAgenda, legacyDb, permissions } from '../../legacy/bridge';
import { addDays, mondayOf, todayIso } from '../../services/dates';

/** A load to wait for before painting (null when there is nothing to fetch). */
export type Load = Promise<unknown> | null;

const STRIP_DAYS = 14, WEEK_DAYS = 7, DUE_LIMIT = 60;
const preloaded = new Map<string, unknown>();
/** Paints in progress that use the preloaded data; it is cleared when the last one ends. */
let painting = 0;

const keyOf = (name: string, from: string, to: string, user: string | null | undefined): string => [name, from, to, user ?? ''].join('|');

/** The preloaded agenda_rango result for these parameters, if any. */
export function peekRange(params: { p_desde?: string; p_hasta?: string; p_usuario?: string | null }): unknown {
  if (!preloaded.size || !params.p_desde || !params.p_hasta) return undefined;
  return preloaded.get(keyOf('agenda_rango', params.p_desde, params.p_hasta, params.p_usuario));
}

/** The preloaded blocked days of the shown person between these dates, if any. */
export function peekBlocked(from: string, to: string): Record<string, string> | undefined {
  return preloaded.get(keyOf('bloq', from, to, agendaSources.ownerId())) as Record<string, string> | undefined;
}

function loadRange(from: string, to: string, user: string | null, cacheKey: string): Load {
  const key = keyOf('agenda_rango', from, to, user);
  if (preloaded.has(key)) return null;
  return cachedRpc('agenda_rango', { p_desde: from, p_hasta: to, p_usuario: user }, cacheKey).then(result => { preloaded.set(key, result); });
}

function loadBlocked(from: string, to: string): Load {
  const key = keyOf('bloq', from, to, agendaSources.ownerId());
  if (preloaded.has(key)) return null;
  return agendaSources.blockedDays(from, to).catch(() => ({})).then(blocked => { preloaded.set(key, blocked); });
}

/** What «Tu día» needs: its appointments (unless they arrive from Inicio) and its tasks. */
export function dayLoads(isoDate: string): Load[] {
  return [
    agendaSources.hasPresetDay(isoDate) ? null : loadRange(isoDate, isoDate, legacyAgenda.userFilter(), `agenda-${isoDate}`),
    agendaSources.dayTasks(isoDate).catch(() => null),
  ];
}

/** What the strip needs: two weeks of the shown person and their blocked days. */
export function stripLoads(): Load[] {
  const start = agendaSources.stripStart() ?? mondayOf(legacyAgenda.selectedDate() ?? todayIso()), owner = agendaSources.ownerId();
  return [loadRange(start, addDays(start, STRIP_DAYS - 1), owner, `agenda-cinta-${owner}-${start}`), loadBlocked(start, addDays(start, STRIP_DAYS - 1))];
}

/** What the week of `isoDate` needs («Tu semana» and the open week). */
export function weekLoads(isoDate?: string | null): Load[] {
  const monday = mondayOf(isoDate ?? legacyAgenda.selectedDate() ?? todayIso());
  return [loadRange(monday, addDays(monday, WEEK_DAYS - 1), legacyAgenda.userFilter(), `agenda-${monday}`), loadBlocked(monday, addDays(monday, WEEK_DAYS - 1))];
}

export interface DaySuggestions { readonly date: string; readonly pend: PendingAppointment[]; readonly toca: DueAccount[]; readonly centros: SameCentreGroup[] }

const listOf = <T>(request: PromiseLike<{ data: T[] | null }>): Promise<T[]> => Promise.resolve(request).then(result => result.data ?? [], () => []);

/** Suggestions for `isoDate`: pending from earlier days; for today and later, accounts due a visit and colleagues per centre. */
export async function loadSuggestions(isoDate: string): Promise<DaySuggestions> {
  const future = isoDate >= todayIso(), own = agendaSources.isOwnAgenda(), owner = agendaSources.ownerId();
  const [pend, toca, centros] = await Promise.all([
    listOf(callRpc<PendingAppointment[]>('pendientes_ruta', {})),
    future ? listOf(legacyDb().rpc<DueAccount[]>('toca_actividad', { p_usuario: own && permissions.seesEverything() ? null : owner, lim: DUE_LIMIT })) : [],
    future ? listOf(callRpc<SameCentreGroup[]>('sugerencias_centros', { p_fecha: isoDate, p_usuario: own ? null : owner })) : [],
  ]);
  return { date: isoDate, pend, toca, centros };
}

/** Keeps the suggestions if they are still for the shown day. */
export function applySuggestions(isoDate: string, suggestions: DaySuggestions | null): void {
  if (suggestions?.date === isoDate) agendaSources.setSuggestions(isoDate, suggestions);
}

/** Waits for every load and then paints, reading from the preloaded data (kept until the end of that paint). */
export async function withData<T>(loads: readonly unknown[], paint: () => Promise<T> | T): Promise<T> {
  painting++;
  try {
    await Promise.all(loads.filter(Boolean).map(load => Promise.resolve(load).catch(() => null)));
    return await paint();
  } finally {
    setTimeout(() => { painting--; if (painting <= 0) { painting = 0; preloaded.clear(); } }, 0);
  }
}
