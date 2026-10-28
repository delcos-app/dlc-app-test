/**
 * The Spanish texts that arrive with the chunk quality (min/chunks/quality.js, plan 7.3, cut F): only its code uses them, so the
 * core does not carry them. screens/quality/texts.ts registers them when the chunk loads.
 */
import { quality } from './quality';

export const texts = { quality } as const;
