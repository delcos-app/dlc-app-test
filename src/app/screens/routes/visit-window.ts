/**
 * The first minute a visit can start arriving at `arrival`: at its fixed time (up to 10 minutes late), in the first attendance window
 * where it fits, or right away without windows; null if there is no room. Migrated from the legacy inicioPosible of
 * pantallas/inicio.js (v2.427.0); the name stays as an adapter (the route and estimate bridges call it).
 */
import { isPresent } from '../../services/values';

const FIXED_TIME_TOLERANCE = 10;

export interface VisitSlot { fija?: number | null; ventanas?: readonly (readonly [number, number])[] | null }

export function earliestStart(slot: VisitSlot, arrival: number, duration: number): number | null {
  if (isPresent(slot.fija)) return arrival <= slot.fija + FIXED_TIME_TOLERANCE ? Math.max(arrival, slot.fija) : null;
  if (!slot.ventanas) return arrival;
  for (const [from, to] of slot.ventanas) { const start = Math.max(arrival, from); if (start + duration <= to) return start; }
  return null;
}
