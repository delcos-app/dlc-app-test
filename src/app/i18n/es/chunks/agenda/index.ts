/**
 * The Spanish texts that arrive with the chunk agenda (min/chunks/agenda.js, plan 7.3, cut F): only its code uses them, so the
 * core does not carry them. screens/agenda/texts.ts registers them when the chunk loads.
 */
import { agenda } from './agenda';
import { agendaMore } from './agenda-more';
import { routesMore } from './routes-more';

export const texts = { agenda, agendaMore, routesMore } as const;
