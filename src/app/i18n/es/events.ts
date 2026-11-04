/**
 * Spanish texts of Eventos the core uses (part of es.ts). The ones only the chunk events uses are in chunks/events/events.ts and
 * arrive with it (plan 7.3, cut F).
 */
export const events = {
  /** v2.466.0 (EVE-1): today's note of the yearly report, for the companies that have not written their own. */
  reportNote: 'Los gastos de eventos de cada {professional} durante el año, por concepto (las asistencias marcadas «No asistió» no cuentan). Es la base del informe anual de gastos de los códigos de Farmaindustria y Fenin: revísalo con vuestro responsable de cumplimiento antes de publicarlo.',
  /** Labels of the cost concepts (the keys are database columns). */
  concepts: {
    inscripcion: 'Inscripción',
    viaje: 'Viaje y alojamiento',
    comida: 'Comidas',
    honorarios: 'Honorarios',
  },
} as const;
