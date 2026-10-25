/**
 * How an appointment stands, without writing state names (each company names its states; the literals test counts them):
 * open (planned or confirmed), done (green), absent («no estaba»: warning colour and not open) or cancelled (grey).
 */
import { appointments, commercialStates } from '../../legacy/bridge';
import { escapeHtml } from '../../services/format';

const colorOf = (state: string): string => commercialStates.color(state) ?? 'var(--muted)';

export const isOpen = (state: string): boolean => appointments.isOpen(state);
export const isCancelled = (state: string): boolean => appointments.isCancelled(state);
export const isDone = (state: string): boolean => commercialStates.color(state) === 'var(--ok)';
export const isAbsent = (state: string): boolean => commercialStates.color(state) === 'var(--warn)' && !isOpen(state);

/** Coloured pill with the state name. */
export function statePill(state: string): string {
  const color = colorOf(state);
  return `<span class="pill cest" style="background:color-mix(in srgb, ${color} 12%, transparent);color:${color}">${escapeHtml(state)}</span>`;
}

/** Point of an appointment, or null without coordinates. */
export function pointOf(item: { lat?: number | string | null; lon?: number | string | null }): [number, number] | null {
  return item.lat !== null && item.lat !== undefined && item.lon !== null && item.lon !== undefined ? [Number(item.lat), Number(item.lon)] : null;
}

/** The appointment states the app itself writes (stored in the database with these names). */
export const STATES = { planned: 'Planificada', confirmed: 'Confirmada', discarded: 'Descartada', postponed: 'Aplazada' } as const;

/** Postponed or discarded, from today on: it can be planned again. */
export const canPlanAgain = (item: { estado: string; fecha: string }, today: string): boolean =>
  (item.estado === STATES.postponed || item.estado === STATES.discarded) && item.fecha >= today;
