/**
 * The Spanish texts that arrive with the chunk manual (min/chunks/manual.js, plan 7.3, cut F): only its code uses them, so the
 * core does not carry them. screens/manual/texts.ts registers them when the chunk loads.
 */
import { manual } from './manual';

export const texts = { manual } as const;
