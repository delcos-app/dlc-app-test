/**
 * The Spanish texts that arrive with the chunk settings-users (min/chunks/settings-users.js, plan 7.3, cut F): only its code uses them, so the
 * core does not carry them. screens/settings/users/texts.ts registers them when the chunk loads.
 */
import { settingsRest } from './settings-rest';

export const texts = { settingsRest } as const;
