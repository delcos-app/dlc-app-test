/**
 * The Spanish texts that arrive with the chunk routes (min/chunks/routes.js, plan 7.3, cut F): only its code uses them, so the
 * core does not carry them. screens/routes/texts.ts registers them when the chunk loads.
 */
import { routes } from './routes';
import { routesMore } from './routes-more';
import { settingsCore } from './settings-core';

export const texts = { routes, routesMore, settingsCore } as const;
