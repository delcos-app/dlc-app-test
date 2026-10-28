/**
 * Spanish texts of Eventos the core uses (part of es.ts). The ones only the chunk events uses are in chunks/events/events.ts and
 * arrive with it (plan 7.3, cut F).
 */
export const events = {
  /** Labels of the cost concepts (the keys are database columns). */
  concepts: {
    inscripcion: 'Inscripción',
    viaje: 'Viaje y alojamiento',
    comida: 'Comidas',
    honorarios: 'Honorarios',
  },
} as const;
