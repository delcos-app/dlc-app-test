/**
 * The Spanish texts that arrive with the chunk settings-parts (min/chunks/settings-parts.js, plan 7.3, cut F): only its code uses them, so the
 * core does not carry them. screens/settings/parts/texts.ts registers them when the chunk loads.
 */
import { settings } from './settings';
import { settingsExtra } from './settings-extra';
import { settingsRest } from './settings-rest';

export const texts = { settings, settingsExtra, settingsRest } as const;
