/**
 * The Spanish texts that arrive with the chunk platform (min/chunks/platform.js, plan 7.3, cut F): only its code uses them, so the
 * core does not carry them. screens/platform/texts.ts registers them when the chunk loads.
 */
import { platform } from './platform';

export const texts = { platform } as const;
