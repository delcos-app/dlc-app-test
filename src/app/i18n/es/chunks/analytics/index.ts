/**
 * The Spanish texts that arrive with the chunk analytics (min/chunks/analytics.js, plan 7.3, cut F): only its code uses them, so the
 * core does not carry them. screens/analytics/texts.ts registers them when the chunk loads.
 */
import { analytics } from './analytics';
import { panels } from './panels';

export const texts = { analytics, panels } as const;
