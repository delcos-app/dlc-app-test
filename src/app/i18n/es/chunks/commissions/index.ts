/**
 * The Spanish texts that arrive with the chunk commissions (min/chunks/commissions.js, plan 7.3, cut F): only its code uses them, so the
 * core does not carry them. screens/commissions/texts.ts registers them when the chunk loads.
 */
import { commissions } from './commissions';

export const texts = { commissions } as const;
