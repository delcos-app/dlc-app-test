/**
 * Spanish texts of Agenda the core uses (part of es.ts). The ones only the chunk agenda uses are in chunks/agenda/agenda.ts and
 * arrive with it (plan 7.3, cut F).
 */
export const agenda = {
  yourDay: {
    showDetail: 'Ver el detalle de las citas',
    compactTitle: 'Compactar las citas: una línea cada una',
    compactLabel: 'Compactar las citas',
    whyWarning: 'Por qué sale este aviso',
    understood: 'Entendido',
  },
  menu: {
    setTime: 'Fijar una hora',
    changeTime: 'Cambiar la hora',
    postpone: 'Aplazar a otro día',
    postponeText: 'Queda como aplazada y se crea la cita nueva',
    confirm: 'Marcar como confirmada',
    confirmText: 'Ya has confirmado la cita',
    unconfirm: 'Quitar la confirmación',
    discard: 'Descartar la cita',
    discardText: 'Ya no hace falta ir',
    delete: 'Eliminar la cita',
    deleteText: 'Fue un error: desaparece de la agenda',
    planAgain: 'Volver a planificarla',
    planAgainText: 'Vuelve a este día',
    planAgainPostponed: '; si la pasaste a otro, esa se quita',
  },
  sameCentre: {
    title: 'En este centro también',
    seeCentre: 'Ver el centro ›',
    openCentre: 'Abrir la ficha del centro',
    addAppointment: 'Añadir una cita · {reason}',
    seeCard: 'Ver su ficha',
    missing: ' · falta: {fields}',
    morning: 'Por la mañana',
    afternoon: 'Por la tarde',
    otherDay: 'Otro día',
    noTimetable: 'Sin horario',
    andMore: 'y {count} más',
  },
} as const;
