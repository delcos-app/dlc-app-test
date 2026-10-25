/**
 * The planner settings: minutes per visit and per stop (each person's preferences, or those of the person whose agenda is shown)
 * and the hours of the plan in progress (leaving and coming back as late as). Without hours the day starts at 9:00 and has no
 * limit. Migrated from the legacy prefsActivas, TIEMPOS, PLANCFG, conHor, HOR and horDeRuta (v2.418.0); prefsActivas, PLANCFG and
 * conHor stay as adapters (Configuración, Analítica, legado 024 and the day estimate use them).
 */
import { currentScreen } from '../../../legacy/bridge';
import { routes2Legacy } from '../../../legacy/routes2-bridge';
import { orFallback } from '../../../services/values';

const DEFAULT_VISIT = 15, DEFAULT_STOP = 10, DEFAULT_START = '09:00', NO_LIMIT = '23:59';

export interface PlanHours { salida: string | null; vuelta: string | null }
export interface Preferences { plan?: { visita?: number | string; parada?: number | string | null }; plan_semana?: PlanHours; salida?: PlanStart; analitica?: unknown; [key: string]: unknown }

let hours: PlanHours | null = null;

/** The preferences in use: those of the person whose agenda is shown, or the user's own. */
export function activePreferences(): Preferences {
  const viewed = currentScreen() === 'agenda' ? routes2Legacy.viewedPreferences() : null;
  return viewed ?? routes2Legacy.ownPreferences() ?? {};
}

/** Minutes per visit and per stop (parking, walking to the door). */
export function visitTimes(): { visita: number; parada: number } {
  const plan = activePreferences().plan ?? {};
  const stop = plan.parada !== null && plan.parada !== undefined && plan.parada !== '' ? Number(plan.parada) : DEFAULT_STOP;
  return { visita: Number(plan.visita) || DEFAULT_VISIT, parada: stop };
}

/** The times and the hours of the plan in progress. */
export function planSettings(): PlanSettings {
  return { ...visitTimes(), salida: orFallback(hours?.salida, DEFAULT_START), tope: orFallback(hours?.vuelta, NO_LIMIT), conSalida: Boolean(hours?.salida), conTope: Boolean(hours?.vuelta) };
}

export const currentHours = (): PlanHours | null => hours;

/** Sets the hours of the plan in progress (null: no hours). */
export function setHours(value: PlanHours | null): void { hours = value?.salida || value?.vuelta ? value : null; }

/** Runs `work` with other hours, and puts the previous ones back. */
export function withHours<T>(value: PlanHours | null, work: () => T): T {
  const previous = hours;
  setHours(value);
  try { return work(); } finally { hours = previous; }
}

/** The hours saved in a route, or null. */
export function hoursOfRoute(id: string): PlanHours | null {
  const route = routes2Legacy.savedRoutes().find(item => item.id === id);
  return route && (route.salida || route.vuelta) ? { salida: route.salida ?? null, vuelta: route.vuelta ?? null } : null;
}
