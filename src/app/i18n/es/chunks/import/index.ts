/**
 * The Spanish texts that arrive with the chunk import (min/chunks/import.js, plan 7.3, cut F): only its code uses them, so the
 * core does not carry them. screens/import/texts.ts registers them when the chunk loads.
 */
import { importing } from './importing';

export const texts = { importing } as const;
