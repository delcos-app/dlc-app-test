/** What an event is (values stored in the database) and the cost of an attendee. */
import { t, type MessageKey } from '../../i18n';
import { eventRules } from '../../core/rules';

/** The company's event types (v2.466.0, EVE-1: Configuración → Cartera y visitas → Eventos; without it, today's seven). */
export const eventTypes = (): string[] => eventRules().types;
export const ATTENDANCE_STATES = ['Invitado', 'Confirmado', 'Asistió', 'No asistió'] as const;
/** The cost concepts of each attendee (database columns). */
export const CONCEPTS = ['inscripcion', 'viaje', 'comida', 'honorarios'] as const;
export type Concept = (typeof CONCEPTS)[number];
/** The company's limit per person of a concept (today, meals 60 €), undefined without a limit (v2.466.0, EVE-1). */
export const limitOf = (concept: Concept): number | undefined => eventRules().limits[concept];
/** True when the amount goes over the concept's limit. */
export const isOverLimit = (concept: Concept, amount: number): boolean => { const limit = limitOf(concept); return limit !== undefined && amount > limit; };

export const conceptLabel = (concept: Concept): string => t(`events.concepts.${concept}` as MessageKey);

export interface EventRow { id: string; titulo: string; tipo?: string | null; fecha: string; hora?: string | null; lugar?: string | null; en_linea?: boolean | null; nota?: string | null; creado_por?: string | null }
export type Costs = Partial<Record<Concept, number | string | null>>;
export interface Attendee extends Costs { id: string; cuenta_id?: string; estado: string; cuentas?: { nombre?: string | null; especialidad?: string | null } | null }

export const attendeeTotal = (attendee: Costs): number => CONCEPTS.reduce((total, concept) => total + (Number(attendee[concept]) || 0), 0);
