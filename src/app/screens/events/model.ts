/** What an event is (values stored in the database) and the cost of an attendee. */
import { t, type MessageKey } from '../../i18n';

export const EVENT_TYPES = ['Taller', 'Curso', 'Congreso', 'Webinar', 'Reunión científica', 'Comida de trabajo', 'Otro'] as const;
export const ATTENDANCE_STATES = ['Invitado', 'Confirmado', 'Asistió', 'No asistió'] as const;
/** The cost concepts of each attendee (database columns). */
export const CONCEPTS = ['inscripcion', 'viaje', 'comida', 'honorarios'] as const;
export type Concept = (typeof CONCEPTS)[number];
/** Code of good practices: a meal should not go over this per person. */
export const MEAL_MAX = 60;

export const conceptLabel = (concept: Concept): string => t(`events.concepts.${concept}` as MessageKey);

export interface EventRow { id: string; titulo: string; tipo?: string | null; fecha: string; hora?: string | null; lugar?: string | null; en_linea?: boolean | null; nota?: string | null; creado_por?: string | null }
export type Costs = Partial<Record<Concept, number | string | null>>;
export interface Attendee extends Costs { id: string; cuenta_id?: string; estado: string; cuentas?: { nombre?: string | null; especialidad?: string | null } | null }

export const attendeeTotal = (attendee: Costs): number => CONCEPTS.reduce((total, concept) => total + (Number(attendee[concept]) || 0), 0);
