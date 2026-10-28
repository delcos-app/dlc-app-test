/**
 * The Spanish texts that arrive with the chunk events (min/chunks/events.js, plan 7.3, cut F): only its code uses them, so the
 * core does not carry them. screens/events/texts.ts registers them when the chunk loads.
 */
import { events } from './events';

export const texts = { events } as const;
