/**
 * The Spanish texts that arrive with the chunk settings-plan (min/chunks/settings-plan.js, plan 7.3, cut F): only its code uses them, so the
 * core does not carry them. screens/settings/plan/texts.ts registers them when the chunk loads.
 */
import { settingsRest } from './settings-rest';

export const texts = { settingsRest } as const;
