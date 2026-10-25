/** «Pedidos tras la visita»: the data of the card (ventas_tras_visita, SQL 163 and 168) and the helpers its four views share. */
import { term } from '../../../legacy/bridge';

export interface Period { visitas?: number; profesionales?: number; con_venta?: number; unidades?: number; dias_media?: number | null }
export interface MonthRow { mes: string; visitas: number; con_venta: number }
export interface TypeRow { tipo: string; visitas: number; con_pedido: number; unidades?: number }
export interface VisitOrders {
  desde: string;
  hasta: string;
  dias?: number;
  resumen?: Period & { anterior?: Period };
  efecto?: { visitas?: number; dias?: { k: number; u: number }[] };
  meses?: MonthRow[];
  tipos?: TypeRow[];
  equipo?: (Record<string, { visitas?: number; con_pedido?: number } | undefined> & { nombre?: string })[];
}

export const DEFAULT_DAYS = 30;

/** Percentage of `part` in `whole`, rounded (0 without whole). */
export const percent = (part: number | undefined, whole: number | undefined): number => (whole ? Math.round((part ?? 0) / whole * 100) : 0);

/** The company words the texts of the card use. */
export const words = (): Record<string, string> => ({
  visit: term('visita'), visits: term('visita', { number: 'p' }), Visits: term('visita', { number: 'p', capital: 'C' }),
  theVisit: term('visita', { article: 'el' }), toTheVisit: term('visita', { article: 'al' }), ofTheVisit: term('visita', { article: 'del' }),
  theVisits: term('visita', { number: 'p', article: 'el' }), TheVisits: term('visita', { number: 'p', article: 'el', articleCapital: 'C' }),
  aVisit: term('visita', { article: 'un', articleCapital: 'C' }), aProfessional: term('medico', { article: 'un' }), toTheProfessional: term('medico', { article: 'al' }),
});
