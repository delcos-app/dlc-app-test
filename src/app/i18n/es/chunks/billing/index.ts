/**
 * The Spanish texts that arrive with the chunk billing (min/chunks/billing.js, plan 7.3, cut F): only its code uses them, so the
 * core does not carry them. screens/billing/texts.ts registers them when the chunk loads.
 */
import { billing } from './billing';

export const texts = { billing } as const;
