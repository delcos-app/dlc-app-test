/**
 * Spanish texts of the Rutas planner, today's map, the route bar and the Agenda traffic the core uses (part of es.ts). The ones
 * only the chunks routes and agenda use are in chunks/<chunk>/routes-more.ts and arrive with them (plan 7.3, cut F).
 */
export const routesMore = {
  planner: {
    notThatDay: 'no atiende este día',
    noLocation: 'sin ubicación',
    lateForFixed: 'no llegas a la hora fijada',
    hoursOver: 'su horario ({hours}) ya habrá acabado',
    noTimeToComeBack: 'no da tiempo a volver antes de tu hora de vuelta',
  },
  service: {
    company: 'Hoy tu empresa ya ha usado su cupo de rutas por calles',
    global: 'Hoy ya se ha usado el cupo de rutas por calles',
    off: 'Las rutas por calles están desactivadas',
    noKey: 'Las rutas por calles aún no están activadas',
    service: 'El servicio de rutas no ha contestado',
    session: 'No se ha podido comprobar tu sesión',
    data: 'Alguna parada no tiene una ubicación válida',
  },
  page: {
    bar: '<span class="rbtx">● <b class="rblargo">Jornada en curso · </b><span class="rt">{time}</span> · {done}<span class="rblargo"> de </span><span class="rbcorto">/</span>{total}<span class="rblargo"> hechas</span></span>\n    <span class="acts u-m-0"><button class="btn sec chico" id="rbver">Mi día</button><button class="btn dang chico" id="rbfin">Terminar</button></span>',
    inProgress: 'Jornada en curso',
    startedAgo: 'Empezaste hace {time}. El orden, las horas y el registro de {visits} están en tu agenda de hoy.',
    seeDay: 'Ver mi día',
    endDay: 'Terminar jornada',
  },
  suggestions: {
    monday: 'lunes',
    tuesday: 'martes',
    wednesday: 'miércoles',
    thursday: 'jueves',
    friday: 'viernes',
    today: 'hoy',
    attend: 'Atienden {day}',
    urgent: 'Urgentes sin visitar',
    interested: '{interested} sin {visit} en 20 días',
    neverVisited: 'Sin visitar nunca',
    title: 'Rutas sugeridas',
    hint: 'Calculadas con tus datos de hoy. Al pulsar, se planifica la ruta.',
    located: '{count} {professionals} con ubicación',
    allRoutes: 'Ver todas las rutas',
    pendingTitle: 'Pendientes de rutas anteriores',
    pendingHint: 'Los planificaste y no se visitaron.',
    seeInAgenda: 'Ver los {count} en Agenda',
  },
};
