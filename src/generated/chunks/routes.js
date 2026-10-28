// delcos-shared:src/app/i18n/index.ts
var shared = globalThis["__delcosModules"]["i18n/index"];
var pick = (name) => shared[name];
var registerMessages = /* @__PURE__ */ pick("registerMessages");
var t = /* @__PURE__ */ pick("t");

// src/app/i18n/es/chunks/routes/routes.ts
var routes = {
  list: {
    title: "Rutas",
    subtitle: "Tus rutas: créalas paso a paso, revísalas y pásalas a tu agenda",
    newRoute: "+ Nueva ruta",
    newRouteCard: "Nueva ruta",
    newRouteHint: "Elige a quién vas a ver y en qué orden",
    firstRouteHint: "Tu primera ruta: elige a quién vas a ver, el orden y cuándo. La app calcula las horas.",
    oneStop: "parada",
    stops: "paradas",
    kilometres: " · {km} km",
    fromTo: "De {start} a {end}",
    nobodyYet: "Todavía sin nadie",
    next: " · próxima: {date}",
    owner: " · de {name}",
    toAgenda: "Pasar a mi agenda",
    edit: "Editar",
    remove: "Eliminar",
    removeRoute: "Eliminar {name}",
    see: "Ver",
    removeText: "Se elimina «{name}». Las citas que ya están en tu agenda no se borran.",
    removeTitle: "¿Eliminar la ruta?",
    couldNotRemove: "No se ha podido eliminar",
    removed: "Ruta eliminada"
  },
  when: {
    /** Options of «Qué semana del mes» */
    weeksOfMonth: "La primera,La segunda,La tercera,La cuarta,La última"
  },
  sketch: {
    noLocations: "Sin ubicaciones"
  },
  hours: {
    noLocation: "Sin ubicación",
    notThatDay: "Ese día no atiende",
    outOfHours: "Fuera de su horario ({hours})"
  },
  wizard: {
    back: "‹ Mis rutas",
    nameLabel: "Nombre de la ruta",
    autoNameHint: "Nombre propuesto con el día y los municipios: puedes cambiarlo",
    nameHint: "Nombre de la ruta",
    stepWho: "A quién vas a ver",
    stepOrder: "Orden y horario",
    stepWhen: "Vista previa y cuándo"
  },
  who: {
    search: "Busca por nombre, centro o municipio",
    filters: "Filtros",
    mine: "Mi cartera",
    urgent: "Urgentes",
    attendDay: "Atienden el {day}",
    neverVisited: "Nunca visitados",
    searching: "Buscando…",
    inRoute: "En la ruta",
    toAdd: "Para añadir",
    urgentLegend: "Urgente",
    chosen: '<b id="rnn">{count}</b> elegidos',
    nextStep: "Siguiente: orden y horario",
    attends: " · atiende {hours}",
    notAttending: " · no atiende el {day}",
    urgentTag: "Urgente",
    noneWithFilters: "No hay {professionals} con esos filtros."
  },
  order: {
    leaveAt: "Sales a las",
    backBy: "Vuelves como tarde",
    noTime: "Sin hora",
    from: "Desde {place} · horas calculadas para el {date}",
    yourStart: "tu punto de salida",
    backToAuto: "Volver al orden automático",
    auto: "Orden automático",
    manualText: "Has cambiado el orden a mano.",
    autoText: "El mejor orden: el más corto que respeta las horas de atención.",
    howTo: "Usa las flechas para cambiarlo y toca una hora para fijarla.",
    minutes: "{minutes} min",
    attends: "Atiende {hours}",
    attendsShort: "atiende {hours}",
    fixedTitle: "Hora fijada: toca para cambiarla o quitarla",
    computedTitle: "Hora calculada: toca para fijarla",
    up: "Subir",
    down: "Bajar",
    remove: "Quitar",
    stops: "paradas",
    approx: "aprox.",
    finish: "terminas",
    pastBack: " (pasa de tu hora de vuelta)",
    mapNext: "Lo ves en el mapa en el paso siguiente.",
    previous: "‹ Atrás",
    nextStep: "Siguiente: vista previa",
    timeTitle: "Hora de la visita",
    cancel: "Cancelar",
    letAppCompute: "Que la calcule la app",
    fixTime: "Fijar una hora",
    fixTimeTitle: "Fijar la hora",
    timeLabel: "Hora"
  },
  preview: {
    calculating: "Calculando la ruta…",
    dayTitle: "{date} · así será tu día",
    savedKeepsAgenda: "Los cambios se guardan en la ruta; las citas que ya están en tu agenda no cambian.",
    savedInList: "Se guarda en Mis rutas.",
    save: "Guardar ruta",
    saveToAgenda: "Guardar y pasar a mi agenda",
    saveChooseDay: "Guardar y elegir el día",
    leave: "Sales de {place}",
    driving: "{minutes} min de coche",
    lastVisit: "Terminas la última {visit}",
    straight: "Vista previa en línea recta",
    streets: 'Por las calles, con tráfico · <b>{km} km</b> · <b>{duration}</b> al volante <span class="rmfuente">Ruta: © TomTom</span>',
    fallback: "{reason}: vista previa en línea recta",
    whenTitle: "¿Cuándo la haces?",
    when: "Cuándo",
    oneDay: "Un día",
    weekly: "Cada semana",
    fortnightly: "Cada 15 días",
    monthly: "Una vez al mes",
    noDate: "Sin fecha",
    day: "Día",
    weekday: "Día de la semana",
    weekOfMonth: "Qué semana del mes",
    startingOn: "Empezando el",
    savedNoDate: "Se guarda sin fecha: la pasas a tu agenda cuando quieras.",
    nextDates: " Próximas: {dates}.",
    couldNotSave: "No se ha podido guardar la ruta",
    couldNotSaveError: "No se ha podido guardar la ruta: {error}",
    saved: "Ruta guardada"
  },
  agenda: {
    noLocated: "Esta ruta no tiene {professionals} con ubicación",
    whichDay: "¿Qué día la haces?",
    day: "Día",
    noNextDay: "No hay ningún día próximo para esta ruta",
    oneAppointment: "cita",
    appointments: "citas",
    confirmText: "Se añaden {count} {appointments} cada día, en {days} días: {dates}. Los días bloqueados se saltan y no se repite a nadie que ya tenga cita ese día.",
    confirmTitle: "Pasar la ruta a tu agenda",
    add: "Añadir",
    oneAdded: "cita añadida",
    added: "citas añadidas",
    oneBlocked: "día bloqueado",
    blocked: "días bloqueados",
    addedText: "{count} {added}",
    skipped: " · {count} {blocked} sin tocar",
    couldNotSave: "No se ha podido guardar alguna cita"
  }
};

// src/app/i18n/es/chunks/routes/routes-more.ts
var routesMore = {
  planner: {
    noRoomOnDays: "no cabe en los días elegidos",
    noneOfDays: "no atiende ninguno de los días elegidos"
  },
  plan: {
    lateTitle: "Ya ha pasado la hora de vuelta de esta ruta",
    lateText: "Esta ruta sale a las {leave} y vuelve como tarde a las {back}, y ahora son las {now}.\n\nPuedes planificarla para el {date}{orChange}.",
    orChangeHours: " o cambiar el horario de la ruta",
    changeHours: "Cambiar el horario de la ruta",
    forTomorrow: "Planificar para mañana",
    tryTomorrow: "Probar para mañana",
    allCitedTitle: "Ya están todos citados",
    oneCited: "{theProfessional} de esta ruta ya tiene una cita planificada en tu agenda.",
    allCitedText: "Los {count} {professionals} de esta ruta ya tienen una cita planificada en tu agenda.",
    seeAgenda: "Ver mi agenda",
    noneFitsTitle: "No cabe {visit}",
    noneAttends: "Ninguno de estos {count} {professionals} atiende el {date}.",
    noTimeWithHours: "Con el horario de la ruta ({leave}–{back}) y las horas de atención no da tiempo a {visit}.",
    noTime: "Con las horas de atención no da tiempo a {visit}.",
    alsoOneCited: "\n\nAdemás, {count} ya tiene una cita planificada y no se proponen.",
    alsoCited: "\n\nAdemás, {count} ya tienen una cita planificada y no se proponen.",
    calculating: "Calculando…",
    couldNotPlan: "No se ha podido planificar: {error}",
    noLocated: "Esta ruta no tiene {professionals} con ubicación",
    noneLocated: "Ninguno de esos {professionals} tiene ubicación",
    couldNotSave: "No se ha podido guardar alguna cita",
    otherDay: "Este plan es para otro día: guárdalo en tu agenda.",
    started: "Plan pasado a tu agenda · jornada iniciada"
  },
  planView: {
    saved: "{count} citas en tu agenda del {date}",
    startButton: "▶ Pasar a mi agenda y empezar",
    saveButton: "Guardar en mi agenda",
    attends: "atiende {hours}",
    leftOut: "Se quedan fuera · {count}",
    seeRest: "Ver los {count} restantes",
    discard: "✕ Descartar plan",
    discardTitle: "Descarta este plan (la ruta guardada no cambia)",
    showMap: "Ver la ruta en el mapa",
    hideMap: "Ocultar el mapa",
    oneRecent: "1 {professional} del plan ya se ha",
    recent: "{count} {professionals} del plan ya se han",
    recentText: "{who} visitado o tienen cita en los últimos {days} días.",
    removeThem: "Quitarlos del plan",
    openCard: "Abrir la ficha",
    card: "Ficha",
    note: "Nota",
    editNote: "Editar nota",
    noteText: "Se guardará en la cita de cada {professional} de esta parada al pasar el plan a tu agenda.",
    noteTitle: "Nota para {centre}",
    saveNote: "Guardar nota",
    start: "Salida · {place}"
  },
  week: {
    title: "Planificar la semana",
    of: " de {name}",
    subtitle: "Reparte {theProfessionals} entre los días, cada uno un día que atienda y agrupados por zona",
    whom: "¿A quién?",
    due: "A quien le toca {visit} (según su frecuencia objetivo)",
    urgent: "Urgentes sin visitar",
    interested: "{interested} sin {visit} en 20 días",
    neverVisited: "Nunca visitados",
    route: "Ruta: {name}",
    days: "Días",
    blocked: " · bloqueado",
    past: " · pasado",
    maxPerDay: "Máximo de {newVisits} por día",
    untilBack: "Hasta la hora de vuelta",
    leave: "Hora de salida",
    back: "Vuelta como tarde",
    times: "Tiempos",
    timesText: "{minutes} min por {professional} · sin hora de vuelta, sin límite",
    hint: "Las citas que ya hay en la agenda se respetan y cuentan para el tiempo de cada día. No se proponen {professionals} que ya tienen una cita abierta.",
    propose: "Proponer reparto",
    chooseDay: "Elige al menos un día",
    calculating: "Calculando…",
    visitedOn: "visitado el {date}{who}",
    noneFits: "No cabe {visit} con estos datos",
    noFreeDays: "No quedan días laborables libres esta semana",
    saving: "Guardando…",
    saved: "{count} citas guardadas en la agenda"
  },
  editor: {
    remove: "Quitar {name}",
    removeCentre: "Quitar el centro",
    noneYet: "Todavía no has añadido {professionals}.",
    others: "Otros {professionals}",
    addCentre: "Añadir un centro",
    centrePlaceholder: "Busca el centro: se añaden todos sus {professionals}",
    addAccounts: "Añadir {professionals}",
    accountPlaceholder: "Busca por nombre, centro o municipio",
    province: "Provincia",
    municipality: "Municipio",
    centre: "Centro",
    commercialState: "Estado comercial",
    notVisitedFor: "Sin visitar hace más de (días)",
    attend: "Atienden",
    onlyUrgent: "Solo urgentes",
    editTitle: "Editar ruta",
    newTitle: "Nueva ruta",
    subtitle: "Una lista fija de {professionals}, o criterios que se recalculan cada día",
    name: "Nombre",
    namePlaceholder: "p. ej. Urgentes zona alta",
    type: "Tipo",
    countFrom: "Contar {visits} desde",
    leave: "Hora de salida",
    back: "Vuelta como tarde",
    howChosen: "Cómo se eligen {theProfessionals}",
    byList: "Lista de {professionals}",
    byCriteria: "Por criterios",
    howMany: "Ver cuántos cumplen",
    save: "Guardar",
    create: "Crear ruta",
    couldNotAddCentre: "No se ha podido añadir el centro: {error}",
    centreAdded: "{count} {professionals} de {centre} añadidos: quita los que no vayas a ver",
    centreEmpty: "{centre} no tiene {professionals} en la base",
    noCentre: "Ningún centro con ese nombre.",
    noMatches: "Sin coincidencias.",
    matching: "<b>{count}</b> {professionals} cumplen ahora estos criterios{beforeDays}.",
    beforeDays: ", antes de aplicar los días sin visitar",
    writeName: "Ponle un nombre a la ruta",
    addOne: "Añade al menos {professional}",
    saving: "Guardando…",
    couldNotSave: "No se ha podido guardar: {error}",
    saved: "Ruta guardada",
    opening: "Abriendo…"
  },
  frequency: {
    title: "Frecuencia objetivo de {visit}",
    subtitle: "Cada cuántos días hay que visitar a {aProfessional} según su estado. 0 = no se exige.",
    daysFor: "Días para {state}",
    hint: "Se usa en «A quien le toca {visit}» (planificador y sugerencias) y en la columna «Les toca» del equipo.",
    couldNotSave: "No se ha podido guardar",
    saved: "Frecuencia guardada"
  },
  dayMap: {
    title: "Tu día en el mapa",
    searching: "Buscando la ruta por las calles…",
    play: "Ver el día",
    stop: "Parar",
    hourLabel: "Hora del día",
    noMap: "No se ha podido cargar el mapa. Comprueba la conexión.",
    streets: 'Por las calles, con tráfico · <b>{km} km</b> · <b>{duration}</b> al volante{delay} · fin hacia las <b>{end}</b> <span class="rmfuente">Ruta: © TomTom</span>',
    delay: " ({minutes} min por el tráfico)",
    straight: "{reason}: tiempos aproximados en línea recta · fin hacia las <b>{end}</b>",
    start: "Salida",
    theStart: "la salida",
    afterBack: "Después de tu hora de vuelta",
    towards: "Hacia {place}",
    arrive: "Llegas hacia las {time}",
    at: "En {place}",
    until: "Hasta las {time}",
    after: " · después, {name}",
    next: "Siguiente: {name}",
    around: "Hacia las {time}",
    dayOver: "Jornada terminada",
    backAround: "De vuelta hacia las {time}",
    atTime: "A las <b>{time}</b>"
  },
  page: {
    times: "⚙ Tiempos de {visit}",
    timesTitle: "Minutos por {visit} y por parada",
    subtitle: "Crea, edita y planifica tus rutas · {minutes} min por {professional}",
    today: "Hoy tienes {count} {appointments}: {done} {visited} y {open} por hacer",
    appointment: "cita",
    appointments: "citas",
    visitedOne: "visitada",
    visited: "visitadas",
    noneToday: "Hoy no tienes citas"
  }
};

// src/app/i18n/es/chunks/routes/settings-core.ts
var settingsCore = {
  plan: {
    planFor: "Plan para el {date}",
    today: "Plan de hoy",
    summary: "Salida de {start} a las {time} · {stops} · vuelta sobre las {back} ·",
    oneStop: "1 parada",
    stops: "{count} paradas",
    changeHours: "⚙ Cambiar horario",
    go: "Ir",
    seeMap: "Ver la ruta en el mapa",
    openInNavigator: "Abrir la ruta en el navegador",
    saveToAgenda: "Guardar en mi agenda",
    saving: "Guardando…",
    start: "▶ Empezar ruta",
    close: "Cerrar",
    saved: "{count} citas guardadas en tu agenda"
  },
  planHours: {
    title: "Tiempos de {visit}",
    subtitle: "Se guardan en tus preferencias. La hora de salida y la de vuelta se ponen en cada ruta.",
    perProfessional: "Minutos por {professional}",
    perStop: "Minutos fijos por parada",
    saved: "Horario guardado"
  }
};

// src/app/i18n/es/chunks/routes/index.ts
var texts = { routes, routesMore, settingsCore };

// src/app/screens/routes/texts.ts
registerMessages(texts);

// delcos-shared:src/app/legacy/routes-bridge.ts
var shared2 = globalThis["__delcosModules"]["legacy/routes-bridge"];
var pick2 = (name) => shared2[name];
var routesLegacy = /* @__PURE__ */ pick2("routesLegacy");

// delcos-shared:src/app/legacy/bridge.ts
var shared3 = globalThis["__delcosModules"]["legacy/bridge"];
var pick3 = (name) => shared3[name];
var agendaActions = /* @__PURE__ */ pick3("agendaActions");
var agendaState = /* @__PURE__ */ pick3("agendaState");
var appLegacy = /* @__PURE__ */ pick3("appLegacy");
var appointmentLegacy = /* @__PURE__ */ pick3("appointmentLegacy");
var appointments = /* @__PURE__ */ pick3("appointments");
var callRpc = /* @__PURE__ */ pick3("callRpc");
var cardSectionsLegacy = /* @__PURE__ */ pick3("cardSectionsLegacy");
var commercialStates = /* @__PURE__ */ pick3("commercialStates");
var currentScreen = /* @__PURE__ */ pick3("currentScreen");
var cycleLegacy = /* @__PURE__ */ pick3("cycleLegacy");
var goTo = /* @__PURE__ */ pick3("goTo");
var icon = /* @__PURE__ */ pick3("icon");
var legacyAgendaPaint = /* @__PURE__ */ pick3("legacyAgendaPaint");
var legacyAgendaParts = /* @__PURE__ */ pick3("legacyAgendaParts");
var legacyDb = /* @__PURE__ */ pick3("legacyDb");
var notices = /* @__PURE__ */ pick3("notices");
var permissions = /* @__PURE__ */ pick3("permissions");
var salesTeam = /* @__PURE__ */ pick3("salesTeam");
var term = /* @__PURE__ */ pick3("term");
var weekPlanner = /* @__PURE__ */ pick3("weekPlanner");
var yourDayLegacy = /* @__PURE__ */ pick3("yourDayLegacy");

// delcos-shared:src/app/services/dates.ts
var shared4 = globalThis["__delcosModules"]["services/dates"];
var pick4 = (name) => shared4[name];
var addDays = /* @__PURE__ */ pick4("addDays");
var formatMinutes = /* @__PURE__ */ pick4("formatMinutes");
var fromIsoDate = /* @__PURE__ */ pick4("fromIsoDate");
var todayIso = /* @__PURE__ */ pick4("todayIso");

// delcos-shared:src/app/services/date-format.ts
var shared5 = globalThis["__delcosModules"]["services/date-format"];
var pick5 = (name) => shared5[name];
var capitalise = /* @__PURE__ */ pick5("capitalise");
var formatLongDate = /* @__PURE__ */ pick5("formatLongDate");
var formatShortDate = /* @__PURE__ */ pick5("formatShortDate");

// delcos-shared:src/app/services/format.ts
var shared6 = globalThis["__delcosModules"]["services/format"];
var pick6 = (name) => shared6[name];
var escapeHtml = /* @__PURE__ */ pick6("escapeHtml");
var formatNumber = /* @__PURE__ */ pick6("formatNumber");

// delcos-shared:src/app/screens/routes/model.ts
var shared7 = globalThis["__delcosModules"]["screens/routes/model"];
var pick7 = (name) => shared7[name];
var WEEKDAYS = /* @__PURE__ */ pick7("WEEKDAYS");
var autoName = /* @__PURE__ */ pick7("autoName");
var datesOf = /* @__PURE__ */ pick7("datesOf");
var hasLocation = /* @__PURE__ */ pick7("hasLocation");
var horizonOf = /* @__PURE__ */ pick7("horizonOf");
var nextDateOf = /* @__PURE__ */ pick7("nextDateOf");
var pointOf = /* @__PURE__ */ pick7("pointOf");
var referenceDate = /* @__PURE__ */ pick7("referenceDate");
var routeIcon = /* @__PURE__ */ pick7("routeIcon");
var stepFooter = /* @__PURE__ */ pick7("stepFooter");
var titleCase = /* @__PURE__ */ pick7("titleCase");
var weekdayName = /* @__PURE__ */ pick7("weekdayName");
var weekdayShort = /* @__PURE__ */ pick7("weekdayShort");
var whenText = /* @__PURE__ */ pick7("whenText");

// delcos-shared:src/app/services/values.ts
var shared8 = globalThis["__delcosModules"]["services/values"];
var pick8 = (name) => shared8[name];
var isPresent = /* @__PURE__ */ pick8("isPresent");
var nonZeroOr = /* @__PURE__ */ pick8("nonZeroOr");
var orFallback = /* @__PURE__ */ pick8("orFallback");
var range = /* @__PURE__ */ pick8("range");

// src/app/screens/routes/schedule.ts
var DEFAULT_START = "09:00";
var DEFAULT_VISIT = 15;
var KM_PER_DEGREE = 111.32;
var ROAD_FACTOR = 1.3;
var windowsOf = (member, isoDate) => weekPlanner.attendanceWindows(member.dias, isoDate);
var withHours = (start, back, work) => routesLegacy.withSchedule({ salida: orFallback(start, DEFAULT_START), vuelta: back ? back : null }, work);
var startMinutes = (start) => routesLegacy.minutesOf(orFallback(start, DEFAULT_START)) ?? 0;
function bestOrder(members, isoDate, start, back) {
  return withHours(start, back, () => {
    const items = members.map((member) => ({ id: member.id, ref: member, xy: pointOf(member), ventanas: windowsOf(member, isoDate), fija: null }));
    const { seq, fuera } = routesLegacy.schedule(items, startMinutes(start));
    return [...seq.map((step) => step.it.ref), ...fuera.map((step) => step.it.ref)];
  });
}
function warningOf(point, windows, start, length) {
  if (!point) return t("routes.hours.noLocation");
  if (windows && !windows.length) return t("routes.hours.notThatDay");
  if (windows?.length && !windows.some(([from, to]) => start >= from && start + length <= to)) return t("routes.hours.outOfHours", { hours: yourDayLegacy.windowsText(windows) });
  return "";
}
function startOf(arrival, fixed2, windows, length) {
  if (fixed2 !== null) return Math.max(arrival, fixed2);
  const window2 = windows?.find(([, to]) => arrival <= to - length);
  return window2 && arrival < window2[0] ? window2[0] : arrival;
}
var kmBetween = (from, to) => Math.hypot((to[0] - from[0]) * KM_PER_DEGREE, (to[1] - from[1]) * KM_PER_DEGREE * Math.cos(to[0] * Math.PI / 180)) * ROAD_FACTOR;
function tripTo(walk, point, stopMinutes) {
  const from = walk.pos;
  if (!from || !point) return { trip: 0, same: false };
  if (from[0] === point[0] && from[1] === point[1]) return { trip: 0, same: true };
  walk.km += kmBetween(from, point);
  return { trip: routesLegacy.travelMinutes(from, point) + stopMinutes, same: false };
}
function hourOf(member, index, walk, context) {
  const settings = routesLegacy.settings(), length = nonZeroOr(settings.visita, DEFAULT_VISIT), point = hasLocation(member) ? [Number(member.lat), Number(member.lon)] : null;
  const windows = windowsOf(member, context.isoDate), { trip, same } = tripTo(walk, point, nonZeroOr(settings.parada, 0));
  const fixedTime = context.fixed?.[member.id], fixed2 = fixedTime ? routesLegacy.minutesOf(fixedTime) : null;
  const start = startOf(walk.time + trip, fixed2, windows, length);
  if (point) walk.pos = point;
  walk.time = start + length;
  return { m: member, i: index, ini: start, fin: start + length, viaje: trip, ven: windows, aviso: warningOf(point, windows, start, length), fija: fixed2 !== null, mismo: same };
}
function hoursOf(members, isoDate, hours) {
  return withHours(hours.start, hours.back, () => {
    const home = routesLegacy.start();
    const walk = { pos: isPresent(home.lat) ? [Number(home.lat), Number(home.lon)] : null, time: startMinutes(hours.start), km: 0 };
    const rows = members.map((member, index) => hourOf(member, index, walk, { isoDate, fixed: hours.fixed }));
    const limit = routesLegacy.minutesOf(routesLegacy.settings().tope) ?? Infinity;
    return { filas: rows, fin: walk.time, km: walk.km, pasa: Boolean(hours.back) && walk.time > limit };
  });
}

// src/app/screens/routes/sketch.ts
var WIDTH = 400;
var HEIGHT = 140;
var PADDING = 22;
var PADDING_TOP = 44;
var fixed = (value2) => value2.toFixed(1);
function placesOf(members) {
  const places = [];
  members.filter(hasLocation).forEach((member) => {
    const lat = Number(member.lat), lon = Number(member.lon);
    if (!places.some((place) => place.lat === lat && place.lon === lon)) places.push({ lat, lon });
  });
  return places;
}
function routeSketch(members) {
  const places = placesOf(members);
  if (!places.length) return `<div class="rnsin">${t("routes.sketch.noLocations")}</div>`;
  const lats = places.map((place) => place.lat), lons = places.map((place) => place.lon);
  const south = Math.min(...lats), north = Math.max(...lats), west = Math.min(...lons), east = Math.max(...lons), squeeze = Math.cos(south * Math.PI / 180);
  const scale = Math.min((WIDTH - 2 * PADDING) / Math.max(1e-6, (east - west) * squeeze), (HEIGHT - PADDING - PADDING_TOP) / Math.max(1e-6, north - south));
  const left = (WIDTH - (east - west) * squeeze * scale) / 2, top = (HEIGHT - PADDING_TOP - PADDING - (north - south) * scale) / 2 + PADDING;
  const points = places.map((place) => [left + (place.lon - west) * squeeze * scale, HEIGHT - top - (place.lat - south) * scale]);
  return `<svg viewBox="0 0 ${WIDTH} ${HEIGHT}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><polyline points="${points.map((point) => point.map(fixed).join(",")).join(" ")}" fill="none" stroke="#3F82C0" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
    ${points.map((point, index) => `<circle cx="${fixed(point[0])}" cy="${fixed(point[1])}" r="10.5" fill="#17457A" stroke="#fff" stroke-width="2.5"/><text x="${fixed(point[0])}" y="${fixed(point[1] + 4)}" text-anchor="middle" font-size="11" font-weight="800" fill="#fff" font-family="Manrope, sans-serif">${index + 1}</text>`).join("")}</svg>`;
}

// src/app/screens/routes/to-agenda.ts
var REFILL_DAYS = 28;
async function routeMembers(route) {
  const { data } = await legacyDb().rpc("cuentas_de_ruta", { p_id: route.id });
  const members = data ?? [], codes = route.codigos ?? [];
  const position = (id) => {
    const index = codes.indexOf(id);
    return index < 0 ? 1e9 : index;
  };
  return route.dinamica ? members : members.slice().sort((first, second) => position(first.id) - position(second.id));
}
async function copyDay(route, members, isoDate, result) {
  const existing = await appointments.ofDay(isoDate), ids = [];
  let order = existing.length;
  for (const member of members) {
    const already = existing.find((item) => item.cuenta_id === member.id && appointments.isOpen(item.estado));
    if (already) {
      ids.push(already.id);
      continue;
    }
    order += 1;
    const fixed2 = route.fijas?.[member.id];
    const { data: saved, error } = await legacyDb().rpc("guardar_cita", { p: {
      cuenta_id: member.id,
      fecha: isoDate,
      hora: fixed2 ? fixed2 : null,
      centro_nombre: member.centro_nombre ? member.centro_nombre : null,
      estado: routesLegacy.firstOpenState(),
      origen: "Ruta",
      orden: order,
      salida: route.salida ? route.salida : null,
      vuelta: route.vuelta ? route.vuelta : null,
      op_id: `r-${route.id}-${member.id}-${isoDate}`
    } });
    if (error || !saved?.ok) {
      notices.toast(t("routes.agenda.couldNotSave"), true);
      return false;
    }
    ids.push(saved.id);
    result.n += 1;
  }
  const closed = existing.filter((item) => !appointments.isOpen(item.estado)).map((item) => item.id);
  const others = existing.filter((item) => appointments.isOpen(item.estado) && !ids.includes(item.id)).map((item) => item.id);
  await legacyDb().rpc("ordenar_citas", { p_ids: [...closed, ...others, ...ids] });
  return true;
}
async function appointmentsOn(route, members, dates) {
  const result = { n: 0, saltados: [] };
  const blocked = dates.length ? await routesLegacy.blockedDays(dates[0] ?? "", dates[dates.length - 1] ?? "") : {};
  for (const isoDate of dates) {
    if (blocked[isoDate]) {
      result.saltados.push(isoDate);
      continue;
    }
    if (!await copyDay(route, members, isoDate, result)) return { ...result, error: true };
  }
  appLegacy.forgetCache();
  return result;
}
var rememberUntil = (route, repeat, last) => legacyDb().rpc("guardar_ruta", { p: { id: route.id, repeticion: { ...repeat, hasta: last } } });
async function refillRoute(route) {
  const repeat = route.repeticion, today = todayIso();
  const from = repeat.hasta && repeat.hasta >= today ? addDays(repeat.hasta, 1) : repeat.desde && repeat.desde > today ? repeat.desde : today;
  const dates = datesOf(repeat, from, addDays(today, REFILL_DAYS));
  if (!dates.length) return;
  const members = (await routeMembers(route)).filter(hasLocation);
  if (!members.length) return;
  const result = await appointmentsOn(route, members, dates);
  if (!result.error) await rememberUntil(route, repeat, dates[dates.length - 1] ?? "");
}
async function refillRepeating() {
  try {
    const key = `delcos-rnrell-${salesTeam.currentUserId()}`;
    if (localStorage.getItem(key) === todayIso()) return;
    localStorage.setItem(key, todayIso());
    const { data } = await callRpc("rutas_visibles", {});
    const own = (data ?? []).filter((route) => Boolean(route.mia && route.repeticion && route.repeticion.tipo !== "fecha"));
    for (const route of own) await refillRoute(route);
  } catch {
  }
}
async function datesToCopy(repeat) {
  if (!repeat) {
    const day = await routesLegacy.askField(t("routes.agenda.whichDay"), "date", routesLegacy.nextWorkingDay(), t("routes.agenda.day"));
    return day ? [day] : null;
  }
  return datesOf(repeat, repeat.desde && repeat.desde > todayIso() ? repeat.desde : todayIso(), horizonOf(repeat));
}
function confirmCopy(count, dates) {
  const text = t("routes.agenda.confirmText", { count, appointments: t(count === 1 ? "routes.agenda.oneAppointment" : "routes.agenda.appointments"), days: dates.length, dates: dates.map(formatShortDate).join(", ") });
  return notices.confirm(text, { titulo: t("routes.agenda.confirmTitle"), ok: t("routes.agenda.add") });
}
function addedText(result) {
  const added = t("routes.agenda.addedText", { count: result.n, added: t(result.n === 1 ? "routes.agenda.oneAdded" : "routes.agenda.added") });
  const skipped = result.saltados.length ? t("routes.agenda.skipped", { count: result.saltados.length, blocked: t(result.saltados.length === 1 ? "routes.agenda.oneBlocked" : "routes.agenda.blocked") }) : "";
  return added + skipped;
}
async function copyAndOpen(route, members, dates) {
  const result = await appointmentsOn(route, members, dates);
  if (result.error) return;
  const repeat = route.repeticion ?? null;
  if (repeat && repeat.tipo !== "fecha") await rememberUntil(route, repeat, dates[dates.length - 1] ?? "");
  notices.toast(addedText(result));
  agendaState.setMode("dia");
  agendaState.setSelectedDate(dates.find((day) => !result.saltados.includes(day)) ?? dates[0] ?? todayIso());
  goTo("agenda");
}
async function copyToAgenda(card, button) {
  const route = card.r, members = card.ms.filter(hasLocation);
  if (!members.length) {
    notices.toast(t("routes.agenda.noLocated", { professionals: term("medico", { number: "p" }) }), true);
    return;
  }
  const dates = await datesToCopy(route.repeticion ?? null);
  if (!dates) return;
  if (!dates.length) {
    notices.toast(t("routes.agenda.noNextDay"), true);
    return;
  }
  if (dates.length > 1 && !await confirmCopy(members.length, dates)) return;
  if (button) button.disabled = true;
  try {
    await copyAndOpen(route, members, dates);
  } finally {
    if (button) button.disabled = false;
  }
}

// src/app/screens/routes/state.ts
var wizardHooks = { repaint: () => void 0 };
function unfix(draft, id) {
  draft.fijas = Object.fromEntries(Object.entries(draft.fijas).filter(([key]) => key !== id));
}
var currentDraft = () => routesLegacy.draft();
function routeName(draft) {
  if (draft.auto) draft.nombre = autoName(draft.ms, draft.rep);
  return orFallback(draft.nombre, t("routes.name.newRoute"));
}

// src/app/screens/routes/step-order.ts
function bestOrderOf(draft) {
  draft.ms = bestOrder(draft.ms, referenceDate(draft.rep, draft.nombre), draft.salida, draft.vuelta);
  draft.ordenManual = false;
}
var draftHours = (draft, isoDate) => hoursOf(draft.ms, isoDate, { start: draft.salida, back: draft.vuelta, fixed: draft.fijas });
var tripHtml = (row, index) => index && !row.mismo && row.viaje ? `<div class="rntramo">${t("routes.order.minutes", { minutes: Math.round(row.viaje) })}</div>` : "";
var noteOf = (row) => row.aviso || (row.ven?.length ? t("routes.order.attends", { hours: yourDayLegacy.windowsText(row.ven) }) : "");
function moveButtons(index, count) {
  return `<button type="button" data-rnmv="-1|${index}" aria-label="${t("routes.order.up")}" ${index ? "" : "disabled"}>${routeIcon("up")}</button><button type="button" data-rnmv="1|${index}" aria-label="${t("routes.order.down")}" ${index < count - 1 ? "" : "disabled"}>${routeIcon("down")}</button>`;
}
function rowHtml(row, index, count) {
  const note = noteOf(row);
  return `${tripHtml(row, index)}<div class="rnpar ${row.aviso ? "aviso" : ""}">
          <span class="n">${index + 1}</span>
          <div class="tx"><b>${escapeHtml(row.m.nombre)}</b><span class="sm">${escapeHtml([row.m.centro_nombre, titleCase(row.m.municipio)].filter(Boolean).join(" · "))}</span>
            <span class="sm ${row.aviso ? "rnav" : ""}">${escapeHtml(note)}</span></div>
          <div class="der"><button type="button" class="rnh ${row.fija ? "fija" : ""}" data-rnh="${row.m.id}" title="${t(row.fija ? "routes.order.fixedTitle" : "routes.order.computedTitle")}">${row.fija ? routeIcon("clock") : "~"}${formatMinutes(row.ini)}</button>
            <span class="ops">${moveButtons(index, count)}
              <button type="button" data-rnx="${index}" aria-label="${t("routes.order.remove")}">${routeIcon("close")}</button></span></div></div>`;
}
function summaryHtml(draft, hours) {
  const stops = new Set(draft.ms.filter((member) => member.lat !== null && member.lat !== void 0).map((member) => `${String(member.lat)},${String(member.lon)}`)).size;
  return `<div class="rnresum"><div><b>${draft.ms.length}</b>${term("medico", { number: "p" })}</div><div><b>${stops}</b>${t("routes.order.stops")}</div>
      <div><b>${Math.round(hours.km)} km</b>${t("routes.order.approx")}</div><div><b class="${hours.pasa ? "rnmal" : ""}">${formatMinutes(hours.fin)}</b>${t("routes.order.finish")}${hours.pasa ? t("routes.order.pastBack") : ""}</div></div>`;
}
function stepHtml(draft, isoDate, hours) {
  const home = routesLegacy.start();
  return `<div class="rnb2"><div class="rnord">
      <div class="rnordcab"><div class="rnhor2"><label>${t("routes.order.leaveAt")} <input type="time" id="rnsal" value="${escapeHtml(draft.salida)}"></label><label>${t("routes.order.backBy")} <input type="time" id="rnvue" value="${escapeHtml(draft.vuelta)}" placeholder="${t("routes.order.noTime")}"></label>
        <span class="sm">${escapeHtml(t("routes.order.from", { place: orFallback(home.nombre, t("routes.order.yourStart")), date: formatLongDate(isoDate) }))}</span></div>
        <button class="btn sec" type="button" id="rnauto">${routeIcon("wand")} ${t(draft.ordenManual ? "routes.order.backToAuto" : "routes.order.auto")}</button></div>
      <p class="sm rnordtx">${t(draft.ordenManual ? "routes.order.manualText" : "routes.order.autoText")} ${t("routes.order.howTo")}</p>
      <div class="rnlst">${hours.filas.map((row, index) => rowHtml(row, index, hours.filas.length)).join("")}</div></div>
    ${summaryHtml(draft, hours)}</div>
    ${stepFooter(t("routes.order.mapNext"), `<button class="btn sec" type="button" id="rnant2">${t("routes.order.previous")}</button><button class="btn" type="button" id="rnsig2">${t("routes.order.nextStep")}</button>`)}`;
}
async function chooseTime(draft, row) {
  const id = row.m.id, attends = row.ven?.length ? t("routes.order.attendsShort", { hours: yourDayLegacy.windowsText(row.ven) }) : "";
  const option = await notices.choose(
    t("routes.order.timeTitle"),
    `${row.m.nombre}${attends ? ` · ${attends}` : ""}`,
    [{ k: "no", t: t("routes.order.cancel"), cls: "sec" }, ...draft.fijas[id] ? [{ k: "quitar", t: t("routes.order.letAppCompute"), cls: "sec" }] : [], { k: "fijar", t: t("routes.order.fixTime") }]
  );
  if (option === "quitar") {
    unfix(draft, id);
    paintOrder();
    return;
  }
  if (option !== "fijar") return;
  const time = await routesLegacy.askField(t("routes.order.fixTimeTitle"), "time", draft.fijas[id] ?? formatMinutes(row.ini), t("routes.order.timeLabel"));
  if (!time) return;
  draft.fijas[id] = time;
  paintOrder();
}
function bindTimes(draft) {
  const reorder = () => {
    if (!draft.ordenManual) bestOrderOf(draft);
    paintOrder();
  };
  const start = document.getElementById("rnsal");
  if (start) start.onchange = () => {
    draft.salida = orFallback(start.value, "09:00");
    reorder();
  };
  const back = document.getElementById("rnvue");
  if (back) back.onchange = () => {
    draft.vuelta = back.value;
    reorder();
  };
  const auto = document.getElementById("rnauto");
  if (auto) auto.onclick = () => {
    bestOrderOf(draft);
    paintOrder();
  };
}
function bindRows(box2, draft, hours) {
  box2.querySelectorAll("[data-rnmv]").forEach((button) => {
    button.onclick = () => {
      const [step = 0, index = 0] = (button.dataset.rnmv ?? "").split("|").map(Number), other = index + step;
      const first = draft.ms[index], second = draft.ms[other];
      if (first && second) {
        draft.ms[index] = second;
        draft.ms[other] = first;
      }
      draft.ordenManual = true;
      paintOrder();
    };
  });
  box2.querySelectorAll("[data-rnx]").forEach((button) => {
    button.onclick = () => {
      const [removed] = draft.ms.splice(Number(button.dataset.rnx), 1);
      if (removed) unfix(draft, removed.id);
      if (!draft.ms.length) {
        draft.paso = 1;
        wizardHooks.repaint();
        return;
      }
      paintOrder();
    };
  });
  box2.querySelectorAll("[data-rnh]").forEach((button) => {
    button.onclick = () => {
      const row = hours.filas.find((item) => item.m.id === button.dataset.rnh);
      if (row) void chooseTime(draft, row);
    };
  });
}
function paintOrder() {
  const box2 = document.getElementById("rnpaso"), draft = currentDraft();
  if (!box2 || !draft) return;
  const isoDate = referenceDate(draft.rep, draft.nombre), hours = draftHours(draft, isoDate);
  box2.innerHTML = stepHtml(draft, isoDate, hours);
  bindTimes(draft);
  bindRows(box2, draft, hours);
  const previous = document.getElementById("rnant2");
  if (previous) previous.onclick = () => {
    draft.paso = 1;
    wizardHooks.repaint();
  };
  const next = document.getElementById("rnsig2");
  if (next) next.onclick = () => {
    draft.paso = 3;
    wizardHooks.repaint();
  };
}

// src/app/screens/routes/map.ts
var MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
var ROUTE_COLOUR = "#17457A";
var URGENT_COLOUR = "#E08A00";
var OTHER_COLOUR = "#9FB6CE";
function paintLayer(map, layer, palette) {
  const id = layer.id, set = (key, value2) => {
    try {
      map.setPaintProperty(id, key, value2);
    } catch {
    }
  };
  const hide = () => {
    try {
      map.setLayoutProperty(id, "visibility", "none");
    } catch {
    }
  };
  if (layer.type === "fill-extrusion") {
    hide();
    return;
  }
  if (layer.type === "background") {
    set("background-color", palette.tierra);
    return;
  }
  if (layer.type === "symbol") {
    if (/poi|aeroway|housenumber|transit|rail|ferry|shield/i.test(id)) {
      hide();
      return;
    }
    set("text-color", palette.texto);
    set("text-halo-color", "#FFFFFF");
    set("text-halo-width", 1.4);
    return;
  }
  if (layer.type === "fill") {
    paintFill(id, set, palette);
    return;
  }
  if (layer.type === "line") paintLine(id, { set, hide }, palette);
}
function paintFill(id, set, palette) {
  if (/water/i.test(id)) {
    set("fill-color", palette.agua);
    return;
  }
  if (/building/i.test(id)) {
    set("fill-color", palette.edif);
    return;
  }
  if (/park|wood|grass|forest|landcover|cemetery|pitch/i.test(id)) {
    set("fill-color", palette.parque);
    set("fill-opacity", 0.8);
    return;
  }
  set("fill-color", palette.zona);
  set("fill-opacity", 0.6);
}
function paintLine(id, paint2, palette) {
  if (/water|river|stream|canal/i.test(id)) {
    paint2.set("line-color", palette.agua);
    return;
  }
  if (/rail|ferry|aeroway|boundary|admin/i.test(id)) {
    paint2.hide();
    return;
  }
  const main = /motorway|trunk|primary/i.test(id);
  paint2.set("line-color", /casing/i.test(id) ? main ? palette.viaBorde : palette.borde : main ? palette.via : palette.calle);
}
function restyle(map) {
  const palette = routesLegacy.palette();
  (map.getStyle().layers ?? []).forEach((layer) => {
    if (!layer.id.startsWith("rn-")) paintLayer(map, layer, palette);
  });
}
async function newMap(element) {
  const library = await routesLegacy.mapLibrary(), previous = routesLegacy.map();
  if (previous) {
    routesLegacy.setMap(null);
    setTimeout(() => {
      try {
        previous.remove();
      } catch {
      }
    }, 0);
  }
  const map = new library.Map({ container: element, style: MAP_STYLE, maxPitch: 0, dragRotate: false, attributionControl: { compact: true } });
  routesLegacy.setMap(map);
  map.touchZoomRotate.disableRotation();
  map.addControl(new library.NavigationControl({ showCompass: false }), "top-right");
  map.__mk = [];
  map.on("load", () => {
    if (!map.style) return;
    restyle(map);
    map.__listo = true;
  });
  return { library, map };
}
var featureCollection = (features) => ({ type: "FeatureCollection", features });
function addRouteLayers(map, onPick) {
  const palette = routesLegacy.palette(), lineLayout = { "line-cap": "round", "line-join": "round" };
  map.addLayer({ id: "rn-linea-b", type: "line", source: "rn-linea", paint: { "line-color": palette.rutaBorde, "line-width": 7 }, layout: lineLayout });
  map.addLayer({ id: "rn-linea", type: "line", source: "rn-linea", paint: { "line-color": palette.ruta, "line-width": 4.5 }, layout: lineLayout });
  map.addLayer({ id: "rn-otros", type: "circle", source: "rn-otros", paint: { "circle-radius": 7, "circle-color": ["case", ["==", ["get", "u"], 1], URGENT_COLOUR, OTHER_COLOUR], "circle-stroke-color": "#fff", "circle-stroke-width": 2 } });
  map.on("click", "rn-otros", (event) => {
    const id = event.features?.[0]?.properties.id, member = (routesLegacy.draft()?.res ?? []).find((item) => item.id === id);
    if (member && onPick) onPick(member);
  });
  map.on("mouseenter", "rn-otros", () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", "rn-otros", () => {
    map.getCanvas().style.cursor = "";
  });
}
function paintSources(map, layers) {
  if (!map.style || !map.getContainer().isConnected) return;
  const source = (id, data) => {
    const found = map.getSource(id);
    if (found) found.setData(data);
    else map.addSource(id, { type: "geojson", data });
  };
  source("rn-otros", featureCollection((layers.others ?? []).filter(hasLocation).map((member) => ({ type: "Feature", properties: { id: member.id, u: member.urgente ? 1 : 0 }, geometry: { type: "Point", coordinates: [Number(member.lon), Number(member.lat)] } }))));
  source("rn-linea", { type: "Feature", geometry: { type: "LineString", coordinates: layers.line } });
  if (!map.getLayer("rn-linea-b")) addRouteLayers(map, layers.onPick);
}
function paintMarkers(map, library, layers) {
  const groups = [];
  layers.members.forEach((member, index) => {
    if (!hasLocation(member)) return;
    const last = groups[groups.length - 1], lat = Number(member.lat), lon = Number(member.lon);
    if (last && last.lat === lat && last.lon === lon) last.numbers.push(index + 1);
    else groups.push({ lat, lon, numbers: [index + 1], member });
  });
  groups.forEach((group) => {
    const marker = document.createElement("button");
    marker.type = "button";
    marker.className = `rmmk${group.numbers.length > 1 ? " multi" : ""}`;
    marker.style.setProperty("--c", ROUTE_COLOUR);
    marker.innerHTML = `<span>${group.numbers.length > 2 ? `${group.numbers[0] ?? ""}–${group.numbers[group.numbers.length - 1] ?? ""}` : group.numbers.join("·")}</span>`;
    marker.title = group.member.nombre;
    const pick22 = layers.onPick;
    if (pick22) marker.onclick = (event) => {
      event.stopPropagation();
      pick22(group.member);
    };
    map.__mk.push(new library.Marker({ element: marker, anchor: "bottom" }).setLngLat([group.lon, group.lat]).addTo(map));
  });
}
function fitAll(map, layers, home) {
  const points = [...layers.members, ...layers.others ?? []].filter(hasLocation).map((member) => [Number(member.lon), Number(member.lat)]);
  if (home.lat !== null && home.lat !== void 0 && layers.members.length) points.push([Number(home.lon), Number(home.lat)]);
  if (!points.length) return;
  const bounds = points.reduce((box2, point) => [[Math.min(box2[0][0], point[0]), Math.min(box2[0][1], point[1])], [Math.max(box2[1][0], point[0]), Math.max(box2[1][1], point[1])]], [[180, 90], [-180, -90]]);
  map.fitBounds(bounds, { padding: 50, duration: map.__ya ? 500 : 0, maxZoom: 14 });
  map.__ya = true;
}
function paintLayers(map, library, layers) {
  if (!map || !library || !map.getContainer().isConnected) return;
  if (map.__listo) paintSources(map, layers);
  else map.once("load", () => {
    setTimeout(() => {
      paintSources(map, layers);
    }, 0);
  });
  map.__mk.forEach((marker) => {
    marker.remove();
  });
  map.__mk = [];
  const home = routesLegacy.start();
  if (home.lat !== null && home.lat !== void 0) {
    const house = document.createElement("div");
    house.className = "rmcasa";
    house.innerHTML = icon("house");
    map.__mk.push(new library.Marker({ element: house }).setLngLat([Number(home.lon), Number(home.lat)]).addTo(map));
  }
  paintMarkers(map, library, layers);
  if (layers.fit !== false) fitAll(map, layers, home);
}

// src/app/screens/routes/step-when.ts
var MAX_STREET_POINTS = 30;
var SHOWN_DATES = 4;
var WEEKS_OF_MONTH = 5;
var KINDS = [["fecha", "routes.preview.oneDay"], ["semanal", "routes.preview.weekly"], ["quincenal", "routes.preview.fortnightly"], ["mensual", "routes.preview.monthly"], ["nada", "routes.preview.noDate"]];
function repeatDetailsHtml(repeat, kind) {
  const day = repeat?.dia ?? "L", nextDay = routesLegacy.nextWorkingDay();
  const date = kind === "fecha" ? `<label for="rnfe">${t("routes.preview.day")}</label><input type="date" id="rnfe" value="${escapeHtml(orFallback(repeat?.fecha, nextDay))}" min="${todayIso()}">` : "";
  const days = ["semanal", "quincenal", "mensual"].includes(kind) ? `<div class="rndias2" role="group" aria-label="${t("routes.preview.weekday")}">${WEEKDAYS.map((letter) => `<button type="button" data-rnd="${letter}" class="${letter === day ? "on" : ""}">${weekdayShort(letter)}</button>`).join("")}</div>` : "";
  const weeks = t("routes.when.weeksOfMonth").split(","), week = Number(repeat?.semana ?? 1);
  const month = kind === "mensual" ? `<label for="rnsem">${t("routes.preview.weekOfMonth")}</label><select id="rnsem">${weeks.slice(0, WEEKS_OF_MONTH).map((label, index) => `<option value="${index + 1}" ${week === index + 1 ? "selected" : ""}>${label}</option>`).join("")}</select>` : "";
  const start = kind === "quincenal" ? `<label for="rnde">${t("routes.preview.startingOn")}</label><input type="date" id="rnde" value="${escapeHtml(orFallback(repeat?.desde, nextDay))}" min="${todayIso()}">` : "";
  return date + days + month + start;
}
function repeatTextHtml(repeat) {
  if (!repeat) return t("routes.preview.savedNoDate");
  const next = datesOf(repeat, todayIso(), horizonOf(repeat)).slice(0, SHOWN_DATES);
  return `${escapeHtml(whenText(repeat))}.${next.length ? t("routes.preview.nextDates", { dates: next.map(formatShortDate).join(", ") }) : ""}`;
}
function repeatHtml(repeat) {
  const kind = repeat ? repeat.tipo : "nada";
  const options2 = KINDS.map(([key, label]) => `<button type="button" data-rnrt="${key}" class="${kind === key ? "on" : ""}" aria-pressed="${String(kind === key)}">${t(label)}</button>`).join("");
  return `<div class="rncuando"><h3>${t("routes.preview.whenTitle")}</h3>
    <div class="segs rnrt" role="group" aria-label="${t("routes.preview.when")}">${options2}</div>
    ${repeatDetailsHtml(repeat, kind)}
    <p class="sm rnrtx">${repeatTextHtml(repeat)}</p></div>`;
}
var dayTitle = (isoDate) => t("routes.preview.dayTitle", { date: capitalise(formatLongDate(isoDate)) });
function timelineHtml(draft, hours) {
  const home = routesLegacy.start(), line = (time, text) => `<div class="rntli viaje"><span class="h">${time}</span><span class="l"></span><span class="t">${text}</span></div>`;
  const rows = hours.filas.map((row, index) => `${index && !row.mismo && row.viaje ? line("", t("routes.preview.driving", { minutes: Math.round(row.viaje) })) : ""}
        <div class="rntli"><span class="h">${formatMinutes(row.ini)}</span><span class="l"><i></i></span><span class="t"><b>${index + 1}. ${escapeHtml(row.m.nombre)}</b><span class="sm">${escapeHtml(orFallback(row.m.centro_nombre, titleCase(row.m.municipio)))}${row.aviso ? ` · <span class="rnav">${escapeHtml(row.aviso)}</span>` : ""}</span></span></div>`).join("");
  return `${line(formatMinutes(routesLegacy.minutesOf(orFallback(draft.salida, "09:00")) ?? 0), t("routes.preview.leave", { place: escapeHtml(orFallback(home.nombre, t("routes.order.yourStart"))) }))}
      ${rows}
      ${line(formatMinutes(hours.fin), t("routes.preview.lastVisit", { visit: term("visita") }))}`;
}
var saveLabel = (draft) => t(draft.rep ? "routes.preview.saveToAgenda" : "routes.preview.saveChooseDay");
function stepHtml2(draft, isoDate) {
  return `<div class="rnb3"><div class="rnmini"><div class="mc" id="rnmc"></div><div class="rnchip" id="rnchip">${t("routes.preview.calculating")}</div></div>
      <div class="rnlado"><div class="rntl"><h3 id="rntlh">${escapeHtml(dayTitle(isoDate))}</h3><div id="rntl"></div></div>${repeatHtml(draft.rep)}</div></div>
    ${stepFooter(
    t(draft.id ? "routes.preview.savedKeepsAgenda" : "routes.preview.savedInList"),
    `<button class="btn sec" type="button" id="rnant3">${t("routes.order.previous")}</button><button class="btn sec" type="button" id="rnguar">${t("routes.preview.save")}</button><button class="btn" type="button" id="rnguarag">${saveLabel(draft)}</button>`
  )}`;
}
function paintTimeline(draft, hours) {
  const box2 = document.getElementById("rntl");
  if (box2) box2.innerHTML = timelineHtml(draft, hours);
}
function repeatOfKind(kind, current) {
  const day = current?.dia ?? "L", nextDay = routesLegacy.nextWorkingDay();
  if (kind === "nada") return null;
  if (kind === "fecha") return { tipo: "fecha", fecha: orFallback(current?.fecha, nextDay) };
  if (kind === "mensual") return { tipo: "mensual", dia: day, semana: current?.semana ?? 1 };
  return { tipo: kind, dia: day, desde: orFallback(current?.desde, nextDay) };
}
function repaintRepeat(box2, draft) {
  const block = box2.querySelector(".rncuando");
  if (block) block.outerHTML = repeatHtml(draft.rep);
  bindRepeat(box2, draft);
  const isoDate = referenceDate(draft.rep, draft.nombre), title = document.getElementById("rntlh");
  if (title) title.textContent = dayTitle(isoDate);
  paintTimeline(draft, draftHours(draft, isoDate));
  const name = document.getElementById("rnnom");
  if (draft.auto && name) name.value = routeName(draft);
  const save4 = document.getElementById("rnguarag");
  if (save4) save4.textContent = saveLabel(draft);
}
function bindRepeat(box2, draft) {
  const change = (repeat) => {
    draft.rep = repeat;
    repaintRepeat(box2, draft);
  };
  box2.querySelectorAll("[data-rnrt]").forEach((button) => {
    button.onclick = () => {
      change(repeatOfKind(button.dataset.rnrt ?? "nada", draft.rep));
    };
  });
  box2.querySelectorAll("[data-rnd]").forEach((button) => {
    button.onclick = () => {
      change({ ...draft.rep ?? { tipo: "" }, dia: button.dataset.rnd ?? "L" });
    };
  });
  const input = (id) => document.getElementById(id);
  const date = input("rnfe");
  if (date) date.onchange = () => {
    change({ tipo: "fecha", fecha: date.value });
  };
  const start = input("rnde");
  if (start) start.onchange = () => {
    change({ ...draft.rep ?? { tipo: "" }, desde: start.value });
  };
  const week = input("rnsem");
  if (week) week.onchange = () => {
    change({ ...draft.rep ?? { tipo: "" }, semana: Number(week.value) });
  };
  routesLegacy.improveFields(box2);
}
function previewPoints(draft) {
  const home = routesLegacy.start();
  const all = [...home.lat !== null && home.lat !== void 0 ? [[Number(home.lat), Number(home.lon)]] : [], ...draft.ms.filter(hasLocation).map((member) => [Number(member.lat), Number(member.lon)])];
  return all.filter((point, index) => !index || point[0] !== all[index - 1]?.[0] || point[1] !== all[index - 1]?.[1]);
}
async function paintPreviewMap(draft, isoDate) {
  const element = document.getElementById("rnmc");
  if (!element) return;
  const { library, map } = await newMap(element);
  if (!document.getElementById("rnmc")) return;
  const chip2 = () => document.getElementById("rnchip"), points = previewPoints(draft);
  paintLayers(map, library, { members: draft.ms, line: points.map(([lat, lon]) => [lon, lat]) });
  const label = chip2();
  if (points.length < 2 || points.length > MAX_STREET_POINTS) {
    if (label) label.textContent = t("routes.preview.straight");
    return;
  }
  const result = await routesLegacy.streetRoute(points, `${isoDate}T${orFallback(draft.salida, "09:00")}:00`), shown = chip2();
  if (!shown) return;
  if (result.ok && result.tramos?.length === points.length - 1) {
    paintLayers(map, library, { members: draft.ms, line: result.tramos.flatMap((part) => (part.linea ?? []).map(([lat, lon]) => [lon, lat])), fit: false });
    shown.innerHTML = t("routes.preview.streets", { km: String(result.km).replace(".", ","), duration: routesLegacy.durationText(result.min ?? 0) });
  } else shown.textContent = t("routes.preview.fallback", { reason: routesLegacy.reasonText(result.motivo) });
}
var withoutEnd = (repeat) => ({ tipo: repeat.tipo, ...Object.fromEntries(Object.entries(repeat).filter(([key]) => key !== "hasta")) });
function payloadOf(draft) {
  const nameInput = document.getElementById("rnnom"), name = orFallback(nameInput?.value.trim(), routeName(draft));
  const payload2 = {
    nombre: name,
    codigos: draft.ms.map((member) => member.id),
    reglas: null,
    salida: draft.salida || null,
    vuelta: draft.vuelta || null,
    repeticion: draft.rep ? withoutEnd(draft.rep) : null,
    fijas: Object.keys(draft.fijas).length ? draft.fijas : null,
    centros: draft.centros
  };
  if (draft.id) payload2.id = draft.id;
  return payload2;
}
async function save(toAgenda) {
  const draft = currentDraft();
  if (!draft) return;
  const payload2 = payloadOf(draft);
  const buttons = ["rnguar", "rnguarag"].map((id) => document.getElementById(id));
  buttons.forEach((button) => {
    if (button) button.disabled = true;
  });
  const { data, error } = await legacyDb().rpc("guardar_ruta", { p: payload2 });
  buttons.forEach((button) => {
    if (button) button.disabled = false;
  });
  if (error || !data?.ok) {
    notices.toast(error ? t("routes.preview.couldNotSaveError", { error: error.message ?? "" }) : t("routes.preview.couldNotSave"), true);
    return;
  }
  appLegacy.forgetCache();
  const members = draft.ms.slice();
  routesLegacy.setDraft(null);
  notices.toast(t("routes.preview.saved"));
  if (toAgenda) {
    await copyToAgenda({ r: { ...payload2, id: data.id, mia: true }, ms: members });
    return;
  }
  routesLegacy.reload();
}
async function paintWhen() {
  const box2 = document.getElementById("rnpaso"), draft = currentDraft();
  if (!box2 || !draft) return;
  const isoDate = referenceDate(draft.rep, draft.nombre);
  box2.innerHTML = stepHtml2(draft, isoDate);
  paintTimeline(draft, draftHours(draft, isoDate));
  bindRepeat(box2, draft);
  const previous = document.getElementById("rnant3");
  if (previous) previous.onclick = () => {
    draft.paso = 2;
    wizardHooks.repaint();
  };
  const saveOnly = document.getElementById("rnguar");
  if (saveOnly) saveOnly.onclick = () => {
    void save(false);
  };
  const saveAndCopy = document.getElementById("rnguarag");
  if (saveAndCopy) saveAndCopy.onclick = () => {
    void save(true);
  };
  await paintPreviewMap(draft, isoDate);
}

// src/app/screens/routes/step-who.ts
var SEARCH_LIMIT = 200;
var SHOWN = 120;
var SEARCH_WAIT_MS = 300;
async function search(draft) {
  const filters = draft.fil, day = draft.rep?.dia;
  const { data } = await legacyDb().rpc("buscar_cuentas", {
    q: draft.q || null,
    f_provincia: null,
    f_municipio: null,
    f_estado: null,
    f_especialidad: null,
    f_area: null,
    f_urgentes: Boolean(filters.urg),
    f_mios: Boolean(filters.mios),
    f_sin_visitar: Boolean(filters.nunca),
    f_comercial: null,
    f_reporting: null,
    orden: null,
    lim: SEARCH_LIMIT,
    desplaz: 0
  });
  let found = data?.filas ?? [];
  if (filters.mios && !found.length && !draft.q && !draft.sinCartera) {
    draft.sinCartera = true;
    filters.mios = false;
    await search(draft);
    return;
  }
  if (filters.dia && day) found = found.filter((member) => member.dias?.[day]);
  draft.res = found;
}
function attendText(member, day) {
  if (!day || !member.dias) return "";
  const hours = member.dias[day];
  return hours ? t("routes.who.attends", { hours: escapeHtml(String(hours)) }) : t("routes.who.notAttending", { day: weekdayName(day) });
}
function optionHtml(member, chosen, day) {
  return `<button type="button" class="rnopt ${chosen ? "on" : ""}" data-rnm="${member.id}" aria-pressed="${String(chosen)}">
      <span class="ck">${chosen ? routeIcon("check") : ""}</span>
      <span class="tx"><b>${escapeHtml(member.nombre)}</b><span class="sm">${escapeHtml([member.centro_nombre, titleCase(member.municipio)].filter(Boolean).join(" · "))}${attendText(member, day)}</span></span>
      <span class="tag ${member.urgente ? "u" : ""}">${member.urgente ? t("routes.who.urgentTag") : escapeHtml(member.estado_comercial ?? "")}</span></button>`;
}
function paintList() {
  const box2 = document.getElementById("rnres"), draft = currentDraft();
  if (!box2 || !draft) return;
  const chosen = new Set(draft.ms.map((member) => member.id)), day = draft.rep?.dia;
  const list = [...draft.ms.filter((member) => !draft.res.some((found) => found.id === member.id)), ...draft.res];
  box2.innerHTML = list.length ? list.slice(0, SHOWN).map((member) => optionHtml(member, chosen.has(member.id), day)).join("") : `<div class="vacio">${t("routes.who.noneWithFilters", { professionals: term("medico", { number: "p" }) })}</div>`;
  box2.querySelectorAll("[data-rnm]").forEach((button) => {
    button.onclick = () => {
      const member = list.find((item) => item.id === button.dataset.rnm);
      if (member) toggle(member);
    };
  });
}
async function mapReady(element) {
  const current = routesLegacy.map();
  if (current && current.getContainer() === element) return;
  let pending = routesLegacy.pendingMap();
  if (pending?.el !== element) {
    pending = Object.assign(newMap(element).then(({ library, map }) => {
      map.__ml = library;
    }), { el: element });
    routesLegacy.setPendingMap(pending);
  }
  await pending;
}
async function paintMap() {
  const element = document.getElementById("rnmc");
  if (!element || !currentDraft()) return;
  await mapReady(element);
  const map = routesLegacy.map(), draft = currentDraft();
  if (!draft || !map?.__ml || map.getContainer() !== document.getElementById("rnmc")) return;
  const chosen = new Set(draft.ms.map((member) => member.id)), home = routesLegacy.start();
  const line = [
    ...home.lat !== null && home.lat !== void 0 && draft.ms.length ? [[Number(home.lon), Number(home.lat)]] : [],
    ...draft.ms.filter(hasLocation).map((member) => [Number(member.lon), Number(member.lat)])
  ];
  paintLayers(map, map.__ml, { members: draft.ms, others: draft.res.filter((member) => !chosen.has(member.id)), line, fit: !map.__ya, onPick: toggle });
}
function toggle(member) {
  const draft = currentDraft();
  if (!draft) return;
  const index = draft.ms.findIndex((item) => item.id === member.id);
  if (index >= 0) {
    draft.ms.splice(index, 1);
    unfix(draft, member.id);
  } else draft.ms.push(member);
  draft.ordenManual = false;
  const count = document.getElementById("rnn");
  if (count) count.textContent = String(draft.ms.length);
  const next = document.getElementById("rnsig1");
  if (next) next.disabled = !draft.ms.length;
  const name = document.getElementById("rnnom");
  if (draft.auto && name) name.value = routeName(draft);
  document.querySelectorAll('[data-rnp="2"], [data-rnp="3"]').forEach((button) => {
    button.disabled = !draft.ms.length;
  });
  paintList();
  void paintMap();
}
function stepHtml3(draft) {
  const day = draft.rep?.dia, filter = (key, label, id = "") => `<button type="button" data-rnf="${key}" class="${draft.fil[key] ? "on" : ""}"${id ? ` id="${id}"` : ""}>${label}</button>`;
  return `<div class="rnb1"><div class="rnsel">
      <div class="rnbus">${routeIcon("search")}<input id="rnq" placeholder="${t("routes.who.search")}" value="${escapeHtml(draft.q)}" autocomplete="off"></div>
      <div class="rnfil" role="group" aria-label="${t("routes.who.filters")}">
        ${filter("mios", t("routes.who.mine"), "rnfmios")}${filter("urg", t("routes.who.urgent"))}
        ${day ? filter("dia", t("routes.who.attendDay", { day: weekdayName(day) })) : ""}${filter("nunca", t("routes.who.neverVisited"))}</div>
      <div class="rnres" id="rnres"><div class="sm" style="padding:10px 4px">${t("routes.who.searching")}</div></div></div>
    <div class="rnmini"><div class="mc" id="rnmc"></div><div class="rnley"><span><i style="background:#17457A"></i>${t("routes.who.inRoute")}</span><span><i style="background:#9FB6CE"></i>${t("routes.who.toAdd")}</span><span><i style="background:#E08A00"></i>${t("routes.who.urgentLegend")}</span></div></div></div>
    ${stepFooter(t("routes.who.chosen", { count: draft.ms.length }), `<button class="btn" type="button" id="rnsig1" ${draft.ms.length ? "" : "disabled"}>${t("routes.who.nextStep")}</button>`)}`;
}
var refresh = async (draft) => {
  await search(draft);
  paintList();
  void paintMap();
};
function bind(box2, draft) {
  let timer;
  const query = document.getElementById("rnq");
  if (query) query.oninput = () => {
    draft.q = query.value;
    clearTimeout(timer);
    timer = setTimeout(() => {
      void refresh(draft);
    }, SEARCH_WAIT_MS);
  };
  box2.querySelectorAll("[data-rnf]").forEach((button) => {
    button.onclick = () => {
      const key = button.dataset.rnf ?? "";
      draft.fil[key] = !draft.fil[key];
      button.classList.toggle("on");
      void refresh(draft);
    };
  });
  const next = document.getElementById("rnsig1");
  if (next) next.onclick = () => {
    draft.paso = 2;
    if (!draft.ordenManual) bestOrderOf(draft);
    wizardHooks.repaint();
  };
}
async function paintWho() {
  const box2 = document.getElementById("rnpaso"), draft = currentDraft();
  if (!box2 || !draft) return;
  box2.innerHTML = stepHtml3(draft);
  bind(box2, draft);
  await search(draft);
  if (!document.getElementById("rnres")) return;
  document.getElementById("rnfmios")?.classList.toggle("on", Boolean(draft.fil.mios));
  paintList();
  void paintMap();
}

// src/app/screens/routes/wizard.ts
var STEPS = ["routes.wizard.stepWho", "routes.wizard.stepOrder", "routes.wizard.stepWhen"];
var searchState = () => ({ q: "", fil: { mios: true, urg: false, dia: false, nunca: false }, res: [], mapa: null });
function freshDraft(step) {
  const nextDay = routesLegacy.nextWorkingDay(), day = WEEKDAYS[Math.max(0, fromIsoDate(nextDay).getDay() - 1)] ?? "L";
  return { id: null, nombre: "", auto: true, ms: [], rep: { tipo: "semanal", dia: day, desde: nextDay }, salida: "09:00", vuelta: "", fijas: {}, ordenManual: false, paso: step, centros: [], ...searchState() };
}
function draftOf(card, step) {
  const route = card.r;
  return {
    id: route.id,
    nombre: route.nombre,
    auto: false,
    ms: card.ms.slice(),
    rep: route.repeticion ?? null,
    salida: route.salida ? String(route.salida).slice(0, 5) : "09:00",
    vuelta: route.vuelta ? String(route.vuelta).slice(0, 5) : "",
    fijas: { ...route.fijas ?? {} },
    ordenManual: true,
    paso: step,
    centros: route.centros ?? [],
    ...searchState()
  };
}
var newDraft = (card, step) => card ? draftOf(card, step) : freshDraft(step);
function openRoute(card, step = 1) {
  routesLegacy.setDraft(newDraft(card, step));
  if (currentScreen() !== "rutas") goTo("rutas");
  else paintWizard();
}
function closeRoute() {
  routesLegacy.setDraft(null);
  const map = routesLegacy.map();
  if (map) {
    try {
      map.remove();
    } catch {
    }
    routesLegacy.setMap(null);
  }
  routesLegacy.reload();
}
function stepsHtml(draft) {
  return STEPS.map((key, index) => {
    const step = index + 1, state = step === draft.paso ? "on" : step < draft.paso ? "ok" : "";
    return `<button type="button" role="tab" data-rnp="${step}" class="${state}" aria-selected="${String(step === draft.paso)}" ${step > 1 && !draft.ms.length ? "disabled" : ""}><i>${step < draft.paso ? "✓" : step}</i><span>${t(key)}</span></button>`;
  }).join("");
}
function paintWizard() {
  const view = document.getElementById("v-rutas"), draft = currentDraft();
  if (!view || !draft) return;
  view.innerHTML = `<div class="rnroot">
    <div><button class="rnvol" type="button" id="rnvol">${t("routes.wizard.back")}</button>
      <div class="rntit"><input id="rnnom" value="${escapeHtml(routeName(draft))}" aria-label="${t("routes.wizard.nameLabel")}" maxlength="80"><span class="rnlap">${routeIcon("pencil")}</span></div>
      <div class="sm rnnomsm">${t(draft.auto ? "routes.wizard.autoNameHint" : "routes.wizard.nameHint")}</div></div>
    <div class="rnpasos" role="tablist">${stepsHtml(draft)}</div>
    <div id="rnpaso"></div></div>`;
  const back = document.getElementById("rnvol");
  if (back) back.onclick = closeRoute;
  const name = document.getElementById("rnnom");
  if (name) name.oninput = () => {
    draft.nombre = name.value;
    draft.auto = !name.value.trim();
  };
  view.querySelectorAll("[data-rnp]").forEach((button) => {
    button.onclick = () => {
      if (button.disabled) return;
      draft.paso = Number(button.dataset.rnp);
      paintWizard();
    };
  });
  if (draft.paso === 1) void paintWho();
  else if (draft.paso === 2) paintOrder();
  else void paintWhen();
}
wizardHooks.repaint = paintWizard;

// src/app/screens/routes/list.ts
function routeFacts(card) {
  const route = card.r, members = card.ms, repeat = route.repeticion ?? null;
  const hours = hoursOf(members, referenceDate(repeat, route.nombre), { start: route.salida, back: route.vuelta, fixed: route.fijas }), next = nextDateOf(repeat);
  const stops = new Set(members.filter(hasLocation).map((member) => `${Number(member.lat).toFixed(5)},${Number(member.lon).toFixed(5)}`)).size;
  const who = `${formatNumber(members.length)} ${term("medico", { number: members.length === 1 ? "s" : "p" })} · ${stops} ${t(stops === 1 ? "routes.list.oneStop" : "routes.list.stops")}${hours.km >= 1 ? t("routes.list.kilometres", { km: Math.round(hours.km) }) : ""}`;
  const when = members.length ? t("routes.list.fromTo", { start: route.salida ? String(route.salida).slice(0, 5) : "09:00", end: formatMinutes(hours.fin) }) : t("routes.list.nobodyYet");
  return { stops: who, hours: `${when}${next ? t("routes.list.next", { date: escapeHtml(formatShortDate(next)) }) : ""}${route.mia ? "" : t("routes.list.owner", { name: escapeHtml(route.duenyo ?? "") })}` };
}
function cardHtml(card, index) {
  const route = card.r, facts = routeFacts(card), editable = Boolean(route.mia) || cardSectionsLegacy.can("administrar");
  const actions = editable ? `<button class="btn sec chico" type="button" data-rned="${index}">${routeIcon("pencil")} ${t("routes.list.edit")}</button>
          <button class="btn sec chico rnico" type="button" data-rnbor="${index}" aria-label="${t("routes.list.removeRoute", { name: escapeHtml(route.nombre) })}" title="${t("routes.list.remove")}">${routeIcon("bin")}</button>` : `<button class="btn sec chico" type="button" data-rnver="${index}">${t("routes.list.see")}</button>`;
  return `<article class="rncard" data-rni="${index}"><div class="rncro">${routeSketch(card.ms)}<span class="rndia">${escapeHtml(whenText(route.repeticion ?? null))}</span></div>
        <div class="rntx"><b>${escapeHtml(route.nombre)}</b>
          <span class="sm">${facts.stops}</span>
          <span class="sm">${facts.hours}</span></div>
        <div class="rnacts"><button class="btn chico" type="button" data-rnag="${index}">${t("routes.list.toAgenda")}</button>
          ${actions}</div></article>`;
}
function pageHtml(cards) {
  return `
    <div class="saludo"><div><h1>${t("routes.list.title")}</h1><div class="fecha">${t("routes.list.subtitle")}</div></div>
      <div class="acts u-m-0"><button class="btn" id="rnueva">${t("routes.list.newRoute")}</button></div></div>
    <div class="rngrid" id="rngrid">${cards.map(cardHtml).join("")}
      <button class="rnnueva" type="button" id="rnnueva2"><span><span class="mas">+</span><b>${t("routes.list.newRouteCard")}</b><span class="sm">${t(cards.length ? "routes.list.newRouteHint" : "routes.list.firstRouteHint")}</span></span></button></div>
    <div id="rcuerpo" hidden></div><div id="rplan"></div>`;
}
async function removeRoute(route) {
  if (!await notices.confirm(t("routes.list.removeText", { name: route.nombre }), { titulo: t("routes.list.removeTitle"), ok: t("routes.list.remove"), peligro: true })) return;
  const { error } = await legacyDb().rpc("guardar_ruta", { p: { id: route.id, activa: false } });
  if (error) {
    notices.toast(t("routes.list.couldNotRemove"), true);
    return;
  }
  notices.toast(t("routes.list.removed"));
  appLegacy.forgetCache();
  routesLegacy.reload();
}
function bind2(view, cards) {
  const each = (attribute, action) => {
    view.querySelectorAll(`[data-${attribute}]`).forEach((button) => {
      button.onclick = () => {
        const card = cards[Number(button.getAttribute(`data-${attribute}`))];
        if (card) action(card, button);
      };
    });
  };
  ["rnueva", "rnnueva2"].forEach((id) => {
    const button = document.getElementById(id);
    if (button) button.onclick = () => {
      openRoute(null);
    };
  });
  each("rned", (card) => {
    openRoute(card, 3);
  });
  each("rnver", (card) => {
    openRoute(card, 3);
  });
  each("rnag", (card, button) => {
    void copyToAgenda(card, button);
  });
  each("rnbor", (card) => {
    void removeRoute(card.r);
  });
}
async function paintRoutes() {
  const view = document.getElementById("v-rutas");
  if (routesLegacy.draft()) {
    paintWizard();
    return;
  }
  const { data } = await legacyDb().rpc("rutas_visibles");
  const routes2 = data ?? [];
  routesLegacy.setRoutes(routes2);
  const cards = await Promise.all(routes2.map(async (route) => ({ r: route, ms: await routeMembers(route) })));
  routesLegacy.setCards(cards);
  if (!view) return;
  view.innerHTML = pageHtml(cards);
  bind2(view, cards);
}

// delcos-shared:src/app/legacy/rest-bridge.ts
var shared9 = globalThis["__delcosModules"]["legacy/rest-bridge"];
var pick9 = (name) => shared9[name];
var restLegacy = /* @__PURE__ */ pick9("restLegacy");

// delcos-shared:src/app/legacy/routes2-bridge.ts
var shared10 = globalThis["__delcosModules"]["legacy/routes2-bridge"];
var pick10 = (name) => shared10[name];
var routes2Legacy = /* @__PURE__ */ pick10("routes2Legacy");

// delcos-shared:src/app/components/index.ts
var shared11 = globalThis["__delcosModules"]["components/index"];
var pick11 = (name) => shared11[name];
var askText = /* @__PURE__ */ pick11("askText");
var showLoading = /* @__PURE__ */ pick11("showLoading");

// src/app/screens/routes/editor/html.ts
var WEEKDAYS2 = ["L", "M", "X", "J", "V"];
var professionals = (count) => term("medico", { number: count === 1 ? "s" : "p" });
var chip = (member) => `<span class="chip">${escapeHtml(member.nombre)}
    <button type="button" data-rq="${member.id}" aria-label="${t("routesMore.editor.remove", { name: escapeHtml(member.nombre) })}" style="border:0;background:none;color:var(--dang);cursor:pointer;font-weight:700">✕</button></span>`;
function centreGroup(centre, members) {
  const inside = members.filter((member) => member.centro_ruta === centre.id);
  return `<div class="rcentro"><div class="rcentrocab"><span class="rcentronom">${routes2Legacy.iconOrEmpty("building-2")}<b>${escapeHtml(centre.nombre)}</b>
        <span class="sm">${escapeHtml(centre.municipio ?? "")}${centre.municipio ? " · " : ""}${formatNumber(inside.length)} ${professionals(inside.length)}</span></span>
      <button type="button" class="lnk" data-rqc="${centre.id}">${t("routesMore.editor.removeCentre")}</button></div>
      <div class="chips">${inside.map(chip).join("")}</div></div>`;
}
function centresHtml(centres, members) {
  if (!members.length) return `<div class="chips"><span class="sm">${t("routesMore.editor.noneYet", { professionals: term("medico", { number: "p" }) })}</span></div>`;
  const loose = members.filter((member) => !centres.some((centre) => centre.id === member.centro_ruta));
  const others = loose.length ? `${centres.length ? `<div class="sm rcentrootros">${t("routesMore.editor.others", { professionals: term("medico", { number: "p" }) })}</div>` : ""}<div class="chips">${loose.map(chip).join("")}</div>` : "";
  return centres.map((centre) => centreGroup(centre, members)).join("") + others;
}
var options = (list, value2) => `<option value=""></option>${(list ?? []).map((option) => `<option ${value2 === option.v ? "selected" : ""}>${escapeHtml(option.v)}</option>`).join("")}`;
function listHtml(state) {
  return `
        ${centresHtml(state.centres, state.members)}
        <label for="rbuscacen">${t("routesMore.editor.addCentre")}</label>
        <input id="rbuscacen" value="${escapeHtml(state.centreSearch)}" placeholder="${t("routesMore.editor.centrePlaceholder", { professionals: term("medico", { number: "p" }) })}" autocomplete="off">
        <div id="rrescen" class="lista"></div>
        <label for="rbusca">${t("routesMore.editor.addAccounts", { professionals: term("medico", { number: "p" }) })}</label>
        <input id="rbusca" value="${escapeHtml(state.search)}" placeholder="${t("routesMore.editor.accountPlaceholder")}" autocomplete="off">
        <div id="rres" class="lista"></div>`;
}
function criteriaHtml(state) {
  const { options: found, rules } = state;
  const days = WEEKDAYS2.map((letter) => `<option value="${letter}" ${rules.dia === letter ? "selected" : ""}>${routes2Legacy.weekdayOf(letter)}</option>`).join("");
  return `
        <div class="g2">
          <div><label for="cprov">${t("routesMore.editor.province")}</label><select id="cprov">${options(found.provincias, rules.provincia)}</select></div>
          <div><label for="cmuni">${t("routesMore.editor.municipality")}</label><select id="cmuni">${options(found.municipios, rules.municipio)}</select></div>
        </div>
        <div class="g2">
          <div><label for="ccen">${t("routesMore.editor.centre")}</label><select id="ccen">${options(found.centros, rules.centro)}</select></div>
          <div><label for="cesp">${term("especialidad", { capital: "C" })}</label><select id="cesp">${options(found.especialidades, rules.especialidad)}</select></div>
        </div>
        <div class="g2">
          <div><label for="cest">${t("routesMore.editor.commercialState")}</label><select id="cest">${options(found.estados, rules.estado)}</select></div>
        </div>
        <div class="g2">
          <div><label for="csv">${t("routesMore.editor.notVisitedFor")}</label><input id="csv" type="number" min="1" max="365" value="${rules.sinVisita ?? ""}"></div>
          <div><label for="cdia">${t("routesMore.editor.attend")}</label><select id="cdia"><option value=""></option>
            ${days}</select></div>
        </div>
        <label class="opt u-mt-10"><input type="checkbox" id="curg" ${rules.urgentes ? "checked" : ""}> ${t("routesMore.editor.onlyUrgent")}</label>
        <div id="rprev" class="sm u-mt-10"></div>`;
}
function editorHtml(state) {
  const { head, id, mode } = state, accounts = term("medico", { number: "p" });
  return `
      <div class="fh"><div><h2>${t(id ? "routesMore.editor.editTitle" : "routesMore.editor.newTitle")}</h2>
        <div class="sm">${t("routesMore.editor.subtitle", { professionals: accounts })}</div></div>
        <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>
      <label for="rn">${t("routesMore.editor.name")}</label><input id="rn" value="${escapeHtml(head.nombre)}" placeholder="${t("routesMore.editor.namePlaceholder")}">
      <div class="g2">
        <div><label for="rt">${t("routesMore.editor.type")}</label><select id="rt">
          <option ${head.tipo !== "Urgente" ? "selected" : ""}>Normal</option>
          <option ${head.tipo === "Urgente" ? "selected" : ""}>Urgente</option></select></div>
        <div><label for="rd">${t("routesMore.editor.countFrom", { visits: term("visita", { number: "p" }) })}</label><input id="rd" type="date" value="${escapeHtml(head.desde)}"></div>
        <div><label for="rsal">${t("routesMore.editor.leave")}</label><input id="rsal" type="time" value="${escapeHtml(head.salida)}"></div>
        <div><label for="rvue">${t("routesMore.editor.back")}</label><input id="rvue" type="time" value="${escapeHtml(head.vuelta)}"></div>
      </div>
      <label>${t("routesMore.editor.howChosen", { theProfessionals: term("medico", { number: "p", article: "el" }) })}</label>
      <div class="subnav" style="margin:6px 0 10px">
        <button type="button" data-rm="lista" aria-pressed="${String(mode === "lista")}">${t("routesMore.editor.byList", { professionals: accounts })}</button>
        <button type="button" data-rm="crit" aria-pressed="${String(mode === "crit")}">${t("routesMore.editor.byCriteria")}</button></div>

      ${mode === "lista" ? listHtml(state) : criteriaHtml(state)}

      <div class="acts u-end">
        <button class="btn sec" data-cerrar>${t("common.cancel")}</button>
        ${mode === "crit" ? `<button class="btn sec" id="rprob">${t("routesMore.editor.howMany")}</button>` : ""}
        <button class="btn" id="rguardar">${t(id ? "routesMore.editor.save" : "routesMore.editor.create")}</button></div>`;
}

// src/app/screens/routes/editor/state.ts
var editorHooks = { repaint: () => void 0 };
var field = (id) => document.getElementById(id)?.value;
function readHead(state) {
  if (!document.getElementById("rn")) return;
  state.head = { nombre: field("rn") ?? "", tipo: field("rt") ?? "", desde: field("rd") ?? "", salida: field("rsal") ?? "", vuelta: field("rvue") ?? "" };
}

// src/app/screens/routes/editor/search.ts
var WAIT_MS = 300;
var MIN_LETTERS = 2;
var RESULTS = 8;
var CENTRE_RADIUS_KM = 400;
var professionals2 = (count) => term("medico", { number: count === 1 ? "s" : "p" });
async function addCentre(state, centre, button) {
  button.disabled = true;
  const { data, error } = await legacyDb().rpc("cuentas_de_centro", { p_centro: centre.id });
  if (error) {
    notices.toast(t("routesMore.editor.couldNotAddCentre", { error: error.message ?? "" }), true);
    button.disabled = false;
    return;
  }
  const list = data ?? [];
  for (const member of list) {
    const already = state.members.find((item) => item.id === member.id);
    if (already) already.centro_ruta = centre.id;
    else {
      state.codes.push(member.id);
      state.members.push(member);
    }
  }
  if (list.length) state.centres.push({ id: centre.id, nombre: centre.nombre, municipio: centre.municipio ?? null });
  state.centreSearch = "";
  notices.toast(list.length ? t("routesMore.editor.centreAdded", { count: formatNumber(list.length), professionals: professionals2(list.length), centre: centre.nombre }) : t("routesMore.editor.centreEmpty", { centre: centre.nombre, professionals: term("medico", { number: "p" }) }), !list.length);
  editorHooks.repaint();
}
async function searchCentres(state, query) {
  const box2 = document.getElementById("rrescen");
  if (!box2) return;
  if (query.length < MIN_LETTERS) {
    box2.innerHTML = "";
    return;
  }
  const { data } = await callRpc("buscar_centros", { p_q: query, p_lat: null, p_lon: null, p_radio: CENTRE_RADIUS_KM, p_lim: RESULTS });
  const place = document.getElementById("rrescen");
  if (!place) return;
  const found = (data ?? []).filter((centre) => !state.centres.some((item) => item.id === centre.id));
  place.innerHTML = found.map((centre, index) => `<button class="item" type="button" data-raddc="${index}"><span class="ic">+</span>
          <span class="tx"><b>${escapeHtml(centre.nombre)}</b><span class="sm">${escapeHtml([centre.direccion, centre.municipio].filter(Boolean).join(" · "))}${centre.medicos ? ` · ${formatNumber(centre.medicos)} ${professionals2(centre.medicos)}` : ""}</span></span></button>`).join("") || `<div class="vacio">${t("routesMore.editor.noCentre")}</div>`;
  place.querySelectorAll("[data-raddc]").forEach((button) => {
    button.onclick = () => {
      const centre = found[Number(button.dataset.raddc)];
      if (centre) void addCentre(state, centre, button);
    };
  });
}
async function searchAccounts(state, query) {
  const box2 = document.getElementById("rres");
  if (!box2) return;
  if (query.length < MIN_LETTERS) {
    box2.innerHTML = "";
    return;
  }
  const { data } = await legacyDb().rpc("buscar_cuentas", {
    q: query,
    f_provincia: null,
    f_municipio: null,
    f_estado: null,
    f_especialidad: null,
    f_area: null,
    f_urgentes: false,
    f_mios: false,
    f_sin_visitar: false,
    orden: "nombre",
    lim: RESULTS,
    desplaz: 0
  });
  const found = (data?.filas ?? []).filter((member) => !state.codes.includes(member.id));
  box2.innerHTML = found.map((member) => `<button class="item" data-radd='${escapeHtml(JSON.stringify({ id: member.id, nombre: member.nombre, especialidad: member.especialidad, centro_nombre: member.centro_nombre, municipio: member.municipio }))}'>
          <span class="ic">+</span><span class="tx"><b>${escapeHtml(member.nombre)}</b>
            <span class="sm">${escapeHtml(member.especialidad ?? "")} · ${escapeHtml(member.centro_nombre ?? "")} ${escapeHtml(member.municipio ?? "")}</span></span></button>`).join("") || `<div class="vacio">${t("routesMore.editor.noMatches")}</div>`;
  box2.querySelectorAll("[data-radd]").forEach((button) => {
    button.onclick = () => {
      const member = JSON.parse(button.dataset.radd ?? "{}");
      state.codes.push(member.id);
      state.members.push(member);
      state.search = "";
      editorHooks.repaint();
    };
  });
}
function bindSearch(input, onText, search2, initial) {
  if (!input) return;
  let timer;
  input.oninput = () => {
    onText(input.value);
    clearTimeout(timer);
    timer = setTimeout(() => {
      void search2(input.value.trim());
    }, WAIT_MS);
  };
  if (initial) void search2(initial);
}
function bindSearches(state) {
  bindSearch(document.getElementById("rbuscacen"), (text) => {
    state.centreSearch = text;
  }, (query) => searchCentres(state, query), state.centreSearch);
  bindSearch(document.getElementById("rbusca"), (text) => {
    state.search = text;
  }, (query) => searchAccounts(state, query), state.search);
}

// src/app/screens/routes/editor/index.ts
var field2 = (id) => document.getElementById(id)?.value ?? "";
function readRules() {
  const rules = {};
  const texts2 = [["provincia", "cprov"], ["municipio", "cmuni"], ["especialidad", "cesp"], ["centro", "ccen"], ["estado", "cest"]];
  for (const [key, id] of texts2) if (field2(id)) rules[key] = field2(id);
  if (field2("csv")) rules.sinVisita = Number(field2("csv"));
  if (field2("cdia")) rules.dia = field2("cdia");
  if (document.getElementById("curg")?.checked) rules.urgentes = true;
  return rules;
}
async function countMatching(button) {
  button.disabled = true;
  const rules = readRules();
  const { data } = await legacyDb().rpc("ids_filtrados", {
    f_provincia: rules.provincia ?? null,
    f_municipio: rules.municipio ?? null,
    f_estado: rules.estado ?? null,
    f_especialidad: rules.especialidad ?? null,
    f_urgentes: Boolean(rules.urgentes)
  });
  button.disabled = false;
  const preview = document.getElementById("rprev");
  if (preview) preview.innerHTML = t("routesMore.editor.matching", { count: formatNumber((data ?? []).length), professionals: term("medico", { number: "p" }), beforeDays: rules.sinVisita ? t("routesMore.editor.beforeDays") : "" });
}
function payload(state) {
  const list = state.mode === "lista";
  return {
    id: state.id,
    nombre: field2("rn").trim(),
    tipo: field2("rt"),
    desde: field2("rd"),
    salida: field2("rsal"),
    vuelta: field2("rvue"),
    visible_para: cardSectionsLegacy.can("administrar") ? "*" : "",
    codigos: list ? state.codes : [],
    centros: list ? state.centres.map((centre) => centre.id) : [],
    reglas: list ? null : readRules()
  };
}
async function save2(state, button) {
  if (!field2("rn").trim()) {
    notices.toast(t("routesMore.editor.writeName"), true);
    return;
  }
  if (state.mode === "lista" && !state.codes.length) {
    notices.toast(t("routesMore.editor.addOne", { professional: term("medico", { article: "un" }) }), true);
    return;
  }
  button.disabled = true;
  button.textContent = t("routesMore.editor.saving");
  const { error } = await legacyDb().rpc("guardar_ruta", { p: payload(state) });
  button.disabled = false;
  button.textContent = t(state.id ? "routesMore.editor.save" : "routesMore.editor.create");
  if (error) {
    notices.toast(t("routesMore.editor.couldNotSave", { error: error.message ?? "" }), true);
    return;
  }
  document.getElementById("dlg")?.close();
  notices.toast(t("routesMore.editor.saved"));
  routes2Legacy.setSection("mis");
  routes2Legacy.reloadRoutes();
}
function removeMember(state, id) {
  state.codes = state.codes.filter((code) => code !== id);
  state.members = state.members.filter((member) => member.id !== id);
  state.centres = state.centres.filter((centre) => state.members.some((member) => member.centro_ruta === centre.id));
  paint(state);
}
function removeCentre(state, id) {
  const out = state.members.filter((member) => member.centro_ruta === id).map((member) => member.id);
  state.codes = state.codes.filter((code) => !out.includes(code));
  state.members = state.members.filter((member) => !out.includes(member.id));
  state.centres = state.centres.filter((centre) => centre.id !== id);
  paint(state);
}
function bind3(state, body) {
  body.querySelectorAll("[data-rm]").forEach((button) => {
    button.onclick = () => {
      state.mode = button.dataset.rm === "crit" ? "crit" : "lista";
      paint(state);
    };
  });
  body.querySelectorAll("[data-rq]").forEach((button) => {
    button.onclick = () => {
      removeMember(state, button.dataset.rq ?? "");
    };
  });
  body.querySelectorAll("[data-rqc]").forEach((button) => {
    button.onclick = () => {
      removeCentre(state, button.dataset.rqc ?? "");
    };
  });
  if (state.mode === "lista") bindSearches(state);
  const count = document.getElementById("rprob");
  if (count) count.onclick = () => {
    void countMatching(count);
  };
  const ok = document.getElementById("rguardar");
  if (ok) ok.onclick = () => {
    void save2(state, ok);
  };
}
function paint(state) {
  const body = document.getElementById("dbody");
  if (!body) return;
  readHead(state);
  body.innerHTML = editorHtml(state);
  bind3(state, body);
}
function loadInBackground(state) {
  const { id, route } = state;
  void legacyDb().rpc("opciones_filtros", {}).then(({ data }) => {
    if (data) {
      state.options = data;
      if (state.mode === "crit") paint(state);
    }
  });
  if (state.codes.length) {
    const request = id && !route?.dinamica ? legacyDb().rpc("cuentas_de_ruta", { p_id: id }) : legacyDb().rpc("cuentas_por_ids", { p_ids: state.codes });
    void request.then(({ data }) => {
      state.members = (data ?? []).filter((member) => state.codes.includes(member.id));
      paint(state);
    });
  }
  const centreIds = route?.centros ?? [];
  if (centreIds.length) {
    void legacyDb().from("centros").select("id,nombre,municipio").in("id", centreIds).then(({ data }) => {
      state.centres = centreIds.map((centreId) => (data ?? []).find((centre) => centre.id === centreId)).filter((centre) => Boolean(centre));
      paint(state);
    });
  }
}
function headOf(route) {
  if (!route) return { nombre: "", tipo: "Normal", desde: todayIso(), salida: "", vuelta: "" };
  return { nombre: route.nombre, tipo: route.tipo ?? "", desde: orFallback(route.desde, todayIso()), salida: orFallback(route.salida, ""), vuelta: orFallback(route.vuelta, "") };
}
function initialState(id, route) {
  return {
    id,
    route,
    mode: route?.dinamica ? "crit" : "lista",
    codes: [...route?.codigos ?? []],
    members: [],
    centres: [],
    search: "",
    centreSearch: "",
    head: headOf(route),
    options: {},
    rules: { ...route?.reglas ?? {} }
  };
}
function editRoute(id) {
  const route = id ? routes2Legacy.savedRoutes().find((item) => item.id === id) ?? null : null, state = initialState(id, route);
  editorHooks.repaint = () => {
    paint(state);
  };
  showLoading(document.getElementById("dbody"), t("routesMore.editor.opening"));
  const box2 = document.getElementById("dlg");
  if (box2 && !box2.open) box2.showModal();
  loadInBackground(state);
  paint(state);
}

// delcos-shared:src/app/screens/routes/day-bar.ts
var shared12 = globalThis["__delcosModules"]["screens/routes/day-bar"];
var pick12 = (name) => shared12[name];
var VISITED = /* @__PURE__ */ pick12("VISITED");
var paintDayInProgress = /* @__PURE__ */ pick12("paintDayInProgress");
var paintRouteBar = /* @__PURE__ */ pick12("paintRouteBar");
var showToday = /* @__PURE__ */ pick12("showToday");

// delcos-shared:src/app/screens/routes/planner/settings.ts
var shared13 = globalThis["__delcosModules"]["screens/routes/planner/settings"];
var pick13 = (name) => shared13[name];
var activePreferences = /* @__PURE__ */ pick13("activePreferences");
var currentHours = /* @__PURE__ */ pick13("currentHours");
var hoursOfRoute = /* @__PURE__ */ pick13("hoursOfRoute");
var planSettings = /* @__PURE__ */ pick13("planSettings");
var setHours = /* @__PURE__ */ pick13("setHours");
var visitTimes = /* @__PURE__ */ pick13("visitTimes");
var withHours2 = /* @__PURE__ */ pick13("withHours");

// delcos-shared:src/app/screens/routes/planner/visits.ts
var shared14 = globalThis["__delcosModules"]["screens/routes/planner/visits"];
var pick14 = (name) => shared14[name];
var homePoint = /* @__PURE__ */ pick14("homePoint");
var nowMinutes = /* @__PURE__ */ pick14("nowMinutes");
var nowRounded = /* @__PURE__ */ pick14("nowRounded");
var scheduleVisits = /* @__PURE__ */ pick14("scheduleVisits");

// delcos-shared:src/app/screens/accounts/timetable.ts
var shared15 = globalThis["__delcosModules"]["screens/accounts/timetable"];
var pick15 = (name) => shared15[name];
var withTimetables = /* @__PURE__ */ pick15("withTimetables");

// delcos-shared:src/app/screens/accounts/editor-form/model.ts
var shared16 = globalThis["__delcosModules"]["screens/accounts/editor-form/model"];
var pick16 = (name) => shared16[name];
var privateConsultation = /* @__PURE__ */ pick16("privateConsultation");

// src/app/screens/routes/planner/plan.ts
var SCROLL_WAIT_MS = 80;
var located = (list) => list.filter((item) => item.lat && item.lon);
var longDate = (isoDate) => formatLongDate(isoDate);
async function offerAlternatives(choice, list, routeId, button) {
  if (choice === "horario") editRoute(routeId);
  if (choice === "manana") await buildPlan(list, routeId, button, { manana: true });
}
var isSavedRoute = (routeId) => routes2Legacy.savedRoutes().some((route) => route.id === routeId);
async function tooLate(list, routeId, button) {
  const settings = planSettings(), savedRoute = isSavedRoute(routeId);
  const choice = await notices.choose(t("routesMore.plan.lateTitle"), t("routesMore.plan.lateText", {
    leave: settings.salida,
    back: settings.tope,
    now: formatMinutes(nowMinutes()),
    date: longDate(routes2Legacy.nextWorkingDay()),
    orChange: savedRoute ? t("routesMore.plan.orChangeHours") : ""
  }), [{ k: "no", t: t("common.cancel"), cls: "sec" }, ...savedRoute ? [{ k: "horario", t: t("routesMore.plan.changeHours"), cls: "sec" }] : [], { k: "manana", t: t("routesMore.plan.forTomorrow") }]);
  await offerAlternatives(choice, list, routeId, button);
}
async function allCited(cited) {
  const text = cited.length === 1 ? t("routesMore.plan.oneCited", { theProfessional: term("medico", { article: "el", articleCapital: "C" }) }) : t("routesMore.plan.allCitedText", { count: cited.length, professionals: term("medico", { number: "p" }) });
  const choice = await notices.choose(t("routesMore.plan.allCitedTitle"), text, [{ k: "no", t: t("common.close"), cls: "sec" }, { k: "agenda", t: t("routesMore.plan.seeAgenda") }]);
  if (choice !== "agenda") return;
  agendaState.setMode("semana");
  agendaState.setSelectedDate(cited.map((item) => item.fecha).sort()[0] ?? todayIso());
  goTo("agenda");
}
function noneFitsText(leftOut, isoDate, citedCount) {
  const settings = planSettings(), noVisit = term("visita", { article: "ningun" });
  const notThatDay = leftOut.filter((item) => item.motivo === t("routesMore.planner.notThatDay")).length;
  let text = notThatDay === leftOut.length ? t("routesMore.plan.noneAttends", { count: leftOut.length, professionals: term("medico", { number: "p" }), date: longDate(isoDate) }) : settings.conTope ? t("routesMore.plan.noTimeWithHours", { leave: settings.salida, back: settings.tope, visit: noVisit }) : t("routesMore.plan.noTime", { visit: noVisit });
  if (citedCount) text += t(citedCount === 1 ? "routesMore.plan.alsoOneCited" : "routesMore.plan.alsoCited", { count: citedCount });
  return text;
}
async function noneFits(list, context) {
  const changeHours = planSettings().conTope && isSavedRoute(context.routeId);
  const choice = await notices.choose(
    t("routesMore.plan.noneFitsTitle", { visit: term("visita", { article: "ningun" }) }),
    noneFitsText(context.leftOut, context.isoDate, context.citedCount),
    [{ k: "no", t: t("common.cancel"), cls: "sec" }, ...changeHours ? [{ k: "horario", t: t("routesMore.plan.changeHours"), cls: "sec" }] : [], ...context.options.manana ? [] : [{ k: "manana", t: t("routesMore.plan.tryTomorrow") }]]
  );
  await offerAlternatives(choice, list, context.routeId, context.button);
}
function stopsOf(sequence) {
  const stops = [];
  for (const step of sequence) {
    const member = { ...step.it.ref, horaPlan: step.ini, ventanas: step.it.ventanas }, point = step.it.xy ?? [0, 0], last = stops[stops.length - 1];
    if (last && last.xy[0] === point[0] && last.xy[1] === point[1]) {
      last.medicos.push(member);
      last.fin = step.fin;
      continue;
    }
    stops.push({ centro: orFallback(member.centro_nombre, privateConsultation()), municipio: member.municipio, dir: member.direccion, xy: point, medicos: [member], llegada: step.ini, fin: step.fin });
  }
  return stops;
}
async function buildPlan(list, routeId, button, options2 = {}) {
  routes2Legacy.setLastPlan({ conXY: list, rutaId: routeId, opts: options2 });
  setHours(options2.horario !== void 0 ? options2.horario : hoursOfRoute(routeId));
  const settings = planSettings(), isoDate = options2.manana ? routes2Legacy.nextWorkingDay() : todayIso();
  const leave = routes2Legacy.minutesOf(settings.salida) ?? 0, limit = routes2Legacy.minutesOf(settings.tope) ?? Infinity;
  const start = options2.manana ? leave : Math.max(leave, nowRounded());
  if (start >= limit) {
    await tooLate(list, routeId, button);
    return;
  }
  const everyone = await withTimetables(list);
  const planned = await routes2Legacy.myPlannedAppointments();
  const cited = everyone.filter((item) => planned[item.id]).map((item) => ({ m: item, fecha: planned[item.id] ?? "" }));
  const members = everyone.filter((item) => !planned[item.id]);
  const items = members.map((item) => ({ id: item.id, ref: item, xy: item.lat !== null && item.lat !== void 0 && item.lon !== null && item.lon !== void 0 ? [Number(item.lat), Number(item.lon)] : null, ventanas: routes2Legacy.windowsOf(item.dias, isoDate), fija: null }));
  const { seq, fuera, fin } = scheduleVisits(items, start);
  if (!members.length && cited.length) {
    await allCited(cited);
    return;
  }
  if (!seq.length) {
    await noneFits(list, { routeId, button, options: options2, leftOut: fuera, isoDate, citedCount: cited.length });
    return;
  }
  routes2Legacy.setPlan({ rutaId: routeId, salida: routes2Legacy.start(), paradas: stopsOf(seq), fin, fecha: isoDate, inicio: start, fuera: fuera.map((item) => ({ m: item.it.ref, motivo: item.motivo })), citados: cited, horario: currentHours() });
  if (currentScreen() !== "rutas") goTo("rutas");
  routes2Legacy.paintPlan();
  setTimeout(() => {
    document.getElementById("rplan")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, SCROLL_WAIT_MS);
}
async function planRoute(routeId, button) {
  const label = button.textContent;
  button.disabled = true;
  button.textContent = t("routesMore.plan.calculating");
  const { data, error } = await legacyDb().rpc("cuentas_de_ruta", { p_id: routeId });
  button.disabled = false;
  button.textContent = label;
  if (error) {
    notices.toast(t("routesMore.plan.couldNotPlan", { error: error.message ?? "" }), true);
    return;
  }
  const list = located(data ?? []);
  if (!list.length) {
    notices.toast(t("routesMore.plan.noLocated", { professionals: term("medico", { number: "p" }) }), true);
    return;
  }
  await buildPlan(list, routeId, button);
}
async function planFromList(list, name, button) {
  const withPlace = located(list ?? []);
  if (!withPlace.length) {
    notices.toast(t("routesMore.plan.noneLocated", { professionals: term("medico", { number: "p" }) }), true);
    return;
  }
  await buildPlan(withPlace, name, button);
}
async function planToAgenda(plan) {
  const isoDate = plan.fecha || todayIso(), members = plan.paradas.flatMap((stop) => stop.medicos.map((member) => ({ member, centre: stop.centro, note: stop.nota ?? "" })));
  const existing = await appointments.ofDay(isoDate), ids = [];
  let order = existing.length;
  for (const { member, centre, note } of members) {
    const already = existing.find((item) => item.cuenta_id === member.id && appointments.isOpen(item.estado));
    if (already) {
      ids.push(already.id);
      continue;
    }
    order += 1;
    const { data: result, error } = await legacyDb().rpc("guardar_cita", { p: {
      cuenta_id: member.id,
      fecha: isoDate,
      hora: null,
      centro_nombre: centre,
      estado: "Planificada",
      origen: "Ruta",
      orden: order,
      nota: note || null,
      salida: plan.horario?.salida ?? null,
      vuelta: plan.horario?.vuelta ?? null,
      op_id: `c-${member.id}-${isoDate}`
    } });
    if (error || !result?.ok) {
      notices.toast(t("routesMore.plan.couldNotSave"), true);
      return null;
    }
    ids.push(result.id);
  }
  const closed = existing.filter((item) => !appointments.isOpen(item.estado)).map((item) => item.id);
  const others = existing.filter((item) => appointments.isOpen(item.estado) && !ids.includes(item.id)).map((item) => item.id);
  await legacyDb().rpc("ordenar_citas", { p_ids: [...closed, ...ids, ...others] });
  appLegacy.forgetCache();
  return { fecha: isoDate, n: members.length };
}
async function startRoute() {
  const plan = routes2Legacy.plan();
  if (!plan) return;
  if (plan.fecha && plan.fecha !== todayIso()) {
    notices.toast(t("routesMore.plan.otherDay"), true);
    return;
  }
  const result = await planToAgenda(plan);
  if (!result) return;
  routes2Legacy.setPlan(null);
  localStorage.setItem(restLegacy.workingDayKey(), JSON.stringify({ fecha: todayIso(), inicio: Date.now() }));
  void paintRouteBar();
  notices.toast(t("routesMore.plan.started"));
  agendaState.setMode("dia");
  agendaState.setSelectedDate(todayIso());
  goTo("agenda");
}

// src/app/screens/routes/planner/plan-map.ts
var TILES = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
var MAX_ZOOM = 19;
var ZOOM = 10;
var PIN_SIZE = 24;
var PADDING2 = 30;
var RESIZE_MS = 60;
var START_COLOUR = "#0E6B4C";
var STOP_COLOUR = "#17457A";
function showPlanMap() {
  const plan = routes2Legacy.plan(), leaflet = restLegacy.leaflet(), box2 = document.getElementById("planmapa");
  if (!plan || !leaflet || !box2 || box2.dataset.on) return;
  box2.dataset.on = "1";
  box2.style.height = "min(55vh,460px)";
  const withStart = plan.salida.lat !== null && plan.salida.lat !== void 0, start = [plan.salida.lat, plan.salida.lon];
  const map = leaflet.map("planmapa").setView(withStart ? start : plan.paradas[0]?.xy ?? [0, 0], ZOOM);
  leaflet.tileLayer(TILES, { maxZoom: MAX_ZOOM, attribution: "© OpenStreetMap" }).addTo(map);
  const pin = (point, text, colour) => leaflet.marker(point, {
    icon: leaflet.divIcon({ className: "mpin", html: `<span style="background:${colour}">${text}</span>`, iconSize: [PIN_SIZE, PIN_SIZE], iconAnchor: [PIN_SIZE / 2, PIN_SIZE / 2] })
  }).addTo(map);
  if (withStart) pin(start, "S", START_COLOUR).bindPopup(t("routesMore.planView.start", { place: escapeHtml(plan.salida.nombre ?? "") }));
  plan.paradas.forEach((stop, index) => pin(stop.xy, String(index + 1), STOP_COLOUR).bindPopup(`<b>${index + 1}. ${escapeHtml(stop.centro)}</b><br>${formatMinutes(stop.llegada)}–${formatMinutes(stop.fin)}<br>${stop.medicos.map((member) => escapeHtml(member.nombre)).join("<br>")}`));
  const line = withStart ? [start, ...plan.paradas.map((stop) => stop.xy), start] : plan.paradas.map((stop) => stop.xy);
  leaflet.polyline(line, { color: STOP_COLOUR, weight: 3, dashArray: "6 6" }).addTo(map);
  map.fitBounds(line, { padding: [PADDING2, PADDING2] });
  setTimeout(() => {
    map.invalidateSize();
  }, RESIZE_MS);
}

// src/app/screens/routes/planner/plan-view.ts
var SHOWN_LEFT_OUT = 30;
var MAP_HEIGHT = "min(55vh,460px)";
var box = () => document.getElementById("rplan");
var shownPlan = () => box() ? routes2Legacy.plan() : null;
function planAgendaButtons() {
  const save4 = document.getElementById("planag"), start = document.getElementById("planempezar");
  if (save4) save4.onclick = async () => {
    const plan = routes2Legacy.plan();
    if (!plan) return;
    save4.disabled = true;
    const result = await planToAgenda(plan);
    save4.disabled = false;
    if (!result) return;
    notices.toast(t("routesMore.planView.saved", { count: result.n, date: formatShortDate(result.fecha) }));
    agendaState.setMode("dia");
    agendaState.setSelectedDate(result.fecha);
    routes2Legacy.setPlan(null);
    goTo("agenda");
  };
  if (start) {
    start.textContent = t("routesMore.planView.startButton");
    start.onclick = () => {
      void startRoute();
    };
  }
  if (save4) save4.textContent = t("routesMore.planView.saveButton");
}
var leftOutRow = (item, index) => `<div class="item ${index >= SHOWN_LEFT_OUT ? "extra" : ""} u-cursor-default">
        <span class="ic w">!</span><span class="tx"><b>${escapeHtml(item.m.nombre)}</b>
          <span class="sm">${escapeHtml(item.motivo)}${item.m.municipio ? ` · ${escapeHtml(item.m.municipio)}` : ""}</span></span></div>`;
function planHoursAndLeftOut() {
  const plan = shownPlan(), place = box();
  if (!plan || !place) return;
  place.querySelectorAll(".lista > .item").forEach((element, index) => {
    const stop = plan.paradas[index], line = element.querySelectorAll(".tx .sm")[1];
    if (!stop || !line) return;
    line.innerHTML = stop.medicos.map((member) => `<span class="pmed"><b>${member.horaPlan !== void 0 ? formatMinutes(member.horaPlan) : ""}</b> ${escapeHtml(member.nombre)}${member.ventanas?.length ? ` <span class="pvent">${t("routesMore.planView.attends", { hours: routes2Legacy.windowsText(member.ventanas) })}</span>` : ""}</span>`).join("");
  });
  const leftOut = plan.fuera;
  if (!leftOut.length) return;
  place.querySelector(".card .lista")?.insertAdjacentHTML("afterend", `<div class="planfuera">
      <h3>${t("routesMore.planView.leftOut", { count: leftOut.length })}</h3>
      <div class="lista">${leftOut.map(leftOutRow).join("")}
        ${leftOut.length > SHOWN_LEFT_OUT ? `<button class="vermas" type="button" data-vermas>${t("routesMore.planView.seeRest", { count: leftOut.length - SHOWN_LEFT_OUT })}</button>` : ""}</div></div>`);
}
function planMapAndDiscard() {
  const place = box();
  if (!routes2Legacy.plan() || !place) return;
  const leftOut = place.querySelector(".planfuera"), map = document.getElementById("planmapa");
  if (leftOut && map) map.insertAdjacentElement("afterend", leftOut);
  const close = document.getElementById("plancerrar");
  if (close) {
    close.textContent = t("routesMore.planView.discard");
    close.title = t("routesMore.planView.discardTitle");
  }
  const show = document.getElementById("planver");
  if (show) show.onclick = () => {
    const mapBox2 = document.getElementById("planmapa");
    if (!mapBox2) return;
    if (mapBox2.dataset.on && mapBox2.style.height !== "0px") {
      mapBox2.style.height = "0px";
      mapBox2.style.marginTop = "0";
      show.textContent = t("routesMore.planView.showMap");
    } else {
      showPlanMap();
      mapBox2.style.height = MAP_HEIGHT;
      mapBox2.style.marginTop = "12px";
      show.textContent = t("routesMore.planView.hideMap");
    }
  };
}
function askRecent(plan) {
  plan.__pedido = true;
  const ids = plan.paradas.flatMap((stop) => stop.medicos.map((member) => member.id));
  void routes2Legacy.recentContacts(ids, plan.fecha || todayIso()).then((found) => {
    const current = routes2Legacy.plan();
    if (!current) return;
    current.__recientes = found;
    routes2Legacy.paintPlan();
  });
}
function markRecent(place, plan, found) {
  const members = plan.paradas.flatMap((stop) => stop.medicos);
  place.querySelectorAll(".pmed").forEach((element) => {
    const member = members.find((item) => (element.textContent ?? "").includes(item.nombre)), recent = member ? found[member.id] : void 0;
    if (recent && !element.querySelector(".prec")) element.insertAdjacentHTML("beforeend", ` <span class="prec">⚠ ${escapeHtml(routes2Legacy.recentText(recent.slice(0, 2)))}</span>`);
  });
}
function planRecentlyVisited() {
  const plan = routes2Legacy.plan(), place = box();
  if (!plan || !place || plan.__recientes === void 0 && !plan.__pedido) {
    if (plan && !plan.__pedido) askRecent(plan);
    return;
  }
  const found = plan.__recientes ?? {}, ids = Object.keys(found);
  if (!ids.length) return;
  markRecent(place, plan, found);
  const card = place.querySelector(".card");
  if (card && !document.getElementById("planrec")) recentNotice(card, ids);
}
function recentNotice(card, ids) {
  const who = ids.length === 1 ? t("routesMore.planView.oneRecent", { professional: term("medico") }) : t("routesMore.planView.recent", { count: ids.length, professionals: term("medico", { number: "p" }) });
  card.querySelector("h2")?.insertAdjacentHTML("afterend", `<div class="avisoh" id="planrec"><span>⚠ ${t("routesMore.planView.recentText", { who, days: routes2Legacy.revisitNotice().dias })}</span>
      <button class="btn sec" id="planquitar">${t("routesMore.planView.removeThem")}</button></div>`);
  const remove = document.getElementById("planquitar");
  if (remove) remove.onclick = () => {
    const last = routes2Legacy.lastPlan();
    if (!last) return;
    void buildPlan(last.conXY.filter((item) => !ids.includes(item.id)), last.rutaId, null, last.opts);
  };
}
function planNoStartNotice() {
  const place = box();
  if (routes2Legacy.plan() && place) routes2Legacy.noStartWarning(place.querySelector(".card"));
}
function stopButtons(item, stop, index) {
  const text = item.querySelector(".tx"), names = text?.querySelectorAll(".sm")[1];
  if (names) names.innerHTML = stop.medicos.map((member) => `<button type="button" class="lnkmed" data-pfm="${member.id}" title="${t("routesMore.planView.openCard")}">${escapeHtml(member.nombre)}</button>`).join("");
  if (stop.nota) text?.insertAdjacentHTML("beforeend", `<span class="sm notapar">📝 ${escapeHtml(stop.nota)}</span>`);
  const single = stop.medicos.length === 1 ? `<button class="btn sec" data-pfm="${stop.medicos[0]?.id ?? ""}">${t("routesMore.planView.card")}</button>` : "";
  item.querySelector(".acts")?.insertAdjacentHTML("afterbegin", `${single}<button class="btn sec" data-pnota="${index}">${t(stop.nota ? "routesMore.planView.editNote" : "routesMore.planView.note")}</button>`);
}
function planCardsAndNotes() {
  const plan = shownPlan(), place = box();
  if (!plan || !place) return;
  const items = place.querySelectorAll(".lista > .item");
  plan.paradas.forEach((stop, index) => {
    const item = items[index];
    if (!item || item.dataset.ext) return;
    item.dataset.ext = "1";
    stopButtons(item, stop, index);
  });
  place.querySelectorAll("[data-pfm]").forEach((button) => {
    button.onclick = () => {
      agendaActions.openAccount(button.dataset.pfm ?? "");
    };
  });
  place.querySelectorAll("[data-pnota]").forEach((button) => {
    button.onclick = async () => {
      const stop = plan.paradas[Number(button.dataset.pnota)];
      if (!stop) return;
      const text = await askText(t("routesMore.planView.noteText", { professional: term("medico") }), stop.nota ?? "", { titulo: t("routesMore.planView.noteTitle", { centre: stop.centro }), ok: t("routesMore.planView.saveNote"), tipo: "area" });
      if (text === null) return;
      stop.nota = text.trim();
      routes2Legacy.paintPlan();
    };
  });
}

// delcos-shared:src/app/legacy/settings-core-bridge.ts
var shared17 = globalThis["__delcosModules"]["legacy/settings-core-bridge"];
var pick17 = (name) => shared17[name];
var planCardLegacy = /* @__PURE__ */ pick17("planCardLegacy");

// delcos-shared:src/app/services/calendar.ts
var shared18 = globalThis["__delcosModules"]["services/calendar"];
var pick18 = (name) => shared18[name];
var longDate2 = /* @__PURE__ */ pick18("longDate");
var minutesToTime = /* @__PURE__ */ pick18("minutesToTime");

// delcos-shared:src/app/services/maps.ts
var shared19 = globalThis["__delcosModules"]["services/maps"];
var pick19 = (name) => shared19[name];
var navigationAttribute = /* @__PURE__ */ pick19("navigationAttribute");

// src/app/screens/routes/planner/plan-card.ts
var PLANNED = "Planificada";
var PLAN_ORIGIN = "Plan del día";
var DEFAULT_VISIT2 = 15;
var DEFAULT_STOP = 10;
var professionals3 = (count) => `${count} ${term("medico", { number: count === 1 ? "s" : "p" })}`;
var byId = (id) => document.getElementById(id);
function titleOf(plan) {
  return plan.fecha && plan.fecha !== todayIso() ? t("settingsCore.plan.planFor", { date: longDate2(/* @__PURE__ */ new Date(`${plan.fecha}T00:00:00`)) }) : t("settingsCore.plan.today");
}
function stopRow(stop, index) {
  const place = escapeHtml([stop.dir, stop.municipio].filter(Boolean).join(", "));
  return `<div class="item u-cursor-default">
      <span class="ic">${index + 1}</span>
      <span class="tx"><b>${escapeHtml(stop.centro)}</b>
        <span class="sm">${minutesToTime(stop.llegada)}–${minutesToTime(stop.fin)} · ${place} · ${professionals3(stop.medicos.length)}</span>
        <span class="sm">${stop.medicos.map((member) => escapeHtml(member.nombre)).join(" · ")}</span></span>
      <span class="acts u-m-0"><button class="btn sec" type="button" data-nav="${navigationAttribute(stop.xy)}">${t("settingsCore.plan.go")}</button></span>
    </div>`;
}
function routeAttribute(plan) {
  const last = plan.paradas[plan.paradas.length - 1], home = plan.salida.lat !== null && plan.salida.lat !== void 0;
  const destination = home ? [plan.salida.lat, plan.salida.lon] : last?.xy;
  const stops = home ? plan.paradas.map((stop) => stop.xy) : plan.paradas.slice(0, -1).map((stop) => stop.xy);
  return navigationAttribute(destination, stops);
}
function cardHtml2(plan) {
  const total = plan.paradas.reduce((count, stop) => count + stop.medicos.length, 0), stops = plan.paradas.length;
  const startMinute = plan.inicio;
  const summary = t("settingsCore.plan.summary", {
    start: escapeHtml(plan.salida.nombre),
    time: startMinute !== null && startMinute !== void 0 ? minutesToTime(startMinute) : planSettings().salida,
    stops: stops === 1 ? t("settingsCore.plan.oneStop") : t("settingsCore.plan.stops", { count: stops }),
    back: minutesToTime(plan.fin)
  });
  return `<div class="card">
    <h2>${titleOf(plan)}<span class="n">${professionals3(total)}</span></h2>
    <p class="sm">${summary} <button class="kcfg" id="planhora">${t("settingsCore.plan.changeHours")}</button></p>
    <div class="lista">${plan.paradas.map(stopRow).join("")}</div>
    <div id="planmapa" style="height:0;margin:0 16px;border-radius:12px;overflow:hidden"></div>
    <div class="acts" style="padding:12px 16px 16px">
      <button class="btn sec" id="planver">${t("settingsCore.plan.seeMap")}</button>
      <button class="btn" type="button" data-nav="${routeAttribute(plan)}">${t("settingsCore.plan.openInNavigator")}</button>
      <button class="btn sec" id="planag">${t("settingsCore.plan.saveToAgenda")}</button>
      ${!plan.fecha || plan.fecha === todayIso() ? `<button class="btn" id="planempezar">${t("settingsCore.plan.start")}</button>` : ""}
      <button class="btn sec" id="plancerrar">${t("settingsCore.plan.close")}</button>
    </div></div>`;
}
async function saveToAgenda(plan, button) {
  button.disabled = true;
  button.textContent = t("settingsCore.plan.saving");
  const day = plan.fecha || todayIso();
  let count = 0;
  for (const stop of plan.paradas) {
    for (const member of stop.medicos) {
      await planCardLegacy.write("guardar_cita", { p: {
        cuenta_id: member.id,
        fecha: day,
        hora: minutesToTime(stop.llegada),
        centro_nombre: stop.centro,
        estado: PLANNED,
        origen: PLAN_ORIGIN,
        op_id: `c-${member.id}-${day}`
      } });
      count += 1;
    }
  }
  button.disabled = false;
  button.textContent = t("settingsCore.plan.saveToAgenda");
  notices.toast(t("settingsCore.plan.saved", { count }));
  planCardLegacy.reloadHome();
}
function bind4(plan) {
  const on = (id, action) => {
    const button = byId(id);
    if (button) button.onclick = () => {
      action(button);
    };
  };
  on("plancerrar", () => {
    routes2Legacy.setPlan(null);
    routes2Legacy.paintPlan();
  });
  on("planver", (button) => {
    showPlanMap();
    button.classList.add("hide");
  });
  on("planhora", () => {
    routes2Legacy.openPlanTimes();
  });
  on("planempezar", () => {
    void startRoute();
  });
  on("planag", (button) => {
    void saveToAgenda(plan, button);
  });
}
function paintPlanCard() {
  const box2 = byId("rplan"), plan = routes2Legacy.plan();
  if (!box2) return;
  if (!plan) {
    box2.innerHTML = "";
    return;
  }
  box2.innerHTML = cardHtml2(plan);
  bind4(plan);
  planAgendaButtons();
  planHoursAndLeftOut();
  planMapAndDiscard();
  planRecentlyVisited();
  planNoStartNotice();
  planCardsAndNotes();
}
function rebuildPlan() {
  const last = routes2Legacy.lastPlan(), plan = routes2Legacy.plan();
  if (last) {
    void buildPlan(last.conXY, last.rutaId, null, last.opts);
    return;
  }
  if (!plan?.rutaId) return;
  const proposals = routes2Legacy.proposals(), proposal = proposals?.[plan.rutaId];
  if (proposal) void planFromList(proposal, plan.rutaId, null);
  else void planRoute(plan.rutaId, byId("rnueva") ?? document.createElement("button"));
}
async function saveTimes(button) {
  button.disabled = true;
  const stopValue = byId("hpar")?.value ?? "";
  const plan = { visita: Number(byId("hvis")?.value) || DEFAULT_VISIT2, parada: stopValue === "" ? DEFAULT_STOP : Number(stopValue) };
  const preferences = { ...routes2Legacy.ownPreferences() ?? {}, plan };
  routes2Legacy.setOwnPreferences(await planCardLegacy.savePreferences(preferences) ?? preferences);
  byId("dlg")?.close();
  notices.toast(t("settingsCore.planHours.saved"));
  rebuildPlan();
}
function openPlanTimesWindow() {
  const settings = planSettings(), body = byId("dbody");
  if (!body) return;
  body.innerHTML = `
    <div class="fh"><div><h2>${t("settingsCore.planHours.title", { visit: term("visita") })}</h2><div class="sm">${t("settingsCore.planHours.subtitle")}</div></div>
      <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>
    <div class="g2">
      <div><label for="hvis">${t("settingsCore.planHours.perProfessional", { professional: term("medico") })}</label><input id="hvis" type="number" min="5" max="60" value="${settings.visita}"></div>
      <div><label for="hpar">${t("settingsCore.planHours.perStop")}</label><input id="hpar" type="number" min="0" max="40" value="${settings.parada}"></div>
    </div>
    <div class="acts u-end">
      <button class="btn sec" data-cerrar>${t("common.cancel")}</button>
      <button class="btn" id="hok">${t("common.save")}</button></div>`;
  const ok = byId("hok");
  if (ok) ok.onclick = () => {
    void saveTimes(ok);
  };
  byId("dlg")?.showModal();
}

// src/app/screens/routes/planner/week-split.ts
var CLOSEST = 40;
var windowsOn = (days, isoDate) => routes2Legacy.windowsOf(days, isoDate);
var attendsOn = (candidate, isoDate) => {
  const windows = windowsOn(candidate.dias, isoDate);
  return !(windows && !windows.length);
};
function startOn(isoDate) {
  const start = routes2Legacy.minutesOf(planSettings().salida) ?? 0;
  return isoDate === todayIso() ? Math.max(start, nowRounded()) : start;
}
function dayEntries(pending, isoDate, options2, uid) {
  const available = pending.filter((item) => attendsOn(item.m, isoDate));
  if (!available.length) return { entries: [], chosen: /* @__PURE__ */ new Set() };
  const home = homePoint(), dayCount = (item) => options2.days.filter((day) => attendsOn(item.m, day)).length;
  available.sort((first, second) => dayCount(first) - dayCount(second) || (second.m.urgente ? 1 : 0) - (first.m.urgente ? 1 : 0) || routes2Legacy.km(home, first.xy) - routes2Legacy.km(home, second.xy));
  const seed = available[0]?.xy ?? home;
  const close = available.slice().sort((first, second) => routes2Legacy.km(seed, first.xy) - routes2Legacy.km(seed, second.xy)).slice(0, CLOSEST);
  const existing = (options2.perDay[isoDate] ?? []).filter((item) => item.usuario_id === uid && appointments.isOpen(item.estado));
  const items = [
    ...existing.map((item) => ({ id: item.id, ref: { existente: item }, xy: routes2Legacy.pointOf(item), ventanas: windowsOn(item.dias, isoDate), fija: routes2Legacy.minutesOf(item.hora) })),
    ...close.map((item) => ({ id: item.m.id, ref: { p: item }, xy: item.xy, ventanas: windowsOn(item.m.dias, isoDate), fija: null }))
  ];
  const { seq } = scheduleVisits(items, startOn(isoDate));
  let fresh = seq.filter((step) => step.it.ref.p);
  if (options2.max) fresh = fresh.slice(0, options2.max);
  const chosen = new Set(fresh.map((step) => step.it.ref.p).filter((item) => Boolean(item)));
  const entries = seq.filter((step) => step.it.ref.existente ?? (step.it.ref.p && chosen.has(step.it.ref.p))).map((step) => toEntry(step.it.ref, step.ini, isoDate));
  return { entries, chosen };
}
function toEntry(ref, start, isoDate) {
  if (ref.existente || !ref.p) return ref.existente ? { existente: ref.existente } : {};
  const { m: candidate, xy } = ref.p;
  return { m: candidate, ini: start, cita: { id: `nueva-${candidate.id}`, fecha: isoDate, dias: candidate.dias, lat: xy[0], lon: xy[1] } };
}
function splitWeek(list, options2) {
  const uid = routes2Legacy.agendaOwner();
  const located2 = (item) => item.lat !== null && item.lat !== void 0 && item.lon !== null && item.lon !== void 0;
  let pending = list.filter(located2).map((item) => ({ m: item, xy: [Number(item.lat), Number(item.lon)] }));
  const sinDia = list.filter((item) => !located2(item)).map((item) => ({ m: item, motivo: t("routesMore.planner.noLocation") }));
  const result = { semana: options2.monday, uid, dias: {}, orden: {}, sinDia, total: 0 };
  for (const day of options2.days) {
    const { entries, chosen } = dayEntries(pending, day, options2, uid);
    result.orden[day] = entries;
    result.dias[day] = entries.filter((entry) => !entry.existente);
    pending = pending.filter((item) => !chosen.has(item));
  }
  result.total = options2.days.reduce((count, day) => count + (result.dias[day]?.length ?? 0), 0);
  for (const item of pending) {
    sinDia.push({ m: item.m, motivo: t(options2.days.some((day) => attendsOn(item.m, day)) ? "routesMore.planner.noRoomOnDays" : "routesMore.planner.noneOfDays") });
  }
  return result;
}

// src/app/screens/routes/planner/week.ts
var LOOK_AHEAD_DAYS = 60;
var DUE_LIMIT = 300;
var PROPOSALS_LIMIT = 200;
var MAX_PER_DAY = 30;
var WEEKDAYS_SHOWN = 5;
var value = (id) => document.getElementById(id)?.value ?? "";
var isWeekend = (isoDate) => (/* @__PURE__ */ new Date(`${isoDate}T12:00:00`)).getDay() % 6 === 0;
function dayOption(isoDate, free, blocked) {
  const ok = free.includes(isoDate), date = /* @__PURE__ */ new Date(`${isoDate}T12:00:00`);
  const note = blocked[isoDate] ? t("routesMore.week.blocked") : isoDate < todayIso() ? t("routesMore.week.past") : "";
  return `<label class="opt ${ok ? "" : "off"} u-m-0"><input type="checkbox" data-spd="${isoDate}" ${ok ? "checked" : "disabled"}>
        ${routes2Legacy.weekdayName(isoDate).slice(0, 3)} ${date.getDate()}${note}</label>`;
}
function formHtml(days, free, blocked, routes2) {
  const viewed = agendaState.viewed(), saved = activePreferences().plan_semana;
  return `
    <div class="fh"><div><h2>${t("routesMore.week.title")}${viewed ? t("routesMore.week.of", { name: escapeHtml(viewed.nombre) }) : ""}</h2>
      <div class="sm">${t("routesMore.week.subtitle", { theProfessionals: term("medico", { number: "p", article: "el" }) })}</div></div>
      <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>
    <label for="spfuente">${t("routesMore.week.whom")}</label>
    <select id="spfuente">
      <option value="toca">${t("routesMore.week.due", { visit: term("visita") })}</option>
      <option value="urgentes">${t("routesMore.week.urgent")}</option>
      <option value="interesados">${t("routesMore.week.interested", { interested: term("medico", { number: "p", capital: "C", adjective: "interesado" }), visit: term("visita") })}</option>
      <option value="sin_visitar">${t("routesMore.week.neverVisited")}</option>
      ${routes2.map((route) => `<option value="ruta:${route.id}">${t("routesMore.week.route", { name: escapeHtml(route.nombre) })}</option>`).join("")}
    </select>
    <label>${t("routesMore.week.days")}</label>
    <div class="spdias">${days.slice(0, WEEKDAYS_SHOWN).map((day) => dayOption(day, free, blocked)).join("")}</div>
    <div class="g2">
      <div><label for="spmax">${t("routesMore.week.maxPerDay", { newVisits: term("visita", { number: "p", adjective: "nuevo" }) })}</label><input id="spmax" type="number" min="1" max="${MAX_PER_DAY}" placeholder="${t("routesMore.week.untilBack")}"></div>
      <div><label for="spsal">${t("routesMore.week.leave")}</label><input id="spsal" type="time" value="${escapeHtml(saved?.salida ?? "")}"></div>
      <div><label for="spvue">${t("routesMore.week.back")}</label><input id="spvue" type="time" value="${escapeHtml(saved?.vuelta ?? "")}"></div>
      <div><label>${t("routesMore.week.times")}</label><div class="sm" style="padding-top:12px">${t("routesMore.week.timesText", { minutes: visitTimes().visita, professional: term("medico") })}</div></div>
    </div>
    <p class="sm">${t("routesMore.week.hint", { professionals: term("medico", { number: "p" }) })}</p>
    <div class="acts u-end"><button class="btn sec" data-cerrar>${t("common.cancel")}</button>
      <button class="btn" id="spok">${t("routesMore.week.propose")}</button></div>`;
}
async function candidates(source) {
  const owner = routes2Legacy.agendaOwner();
  if (source === "toca") return (await legacyDb().rpc("toca_actividad", { p_usuario: owner === salesTeam.currentUserId() && permissions.seesEverything() ? null : owner, lim: DUE_LIMIT })).data ?? [];
  if (source.startsWith("ruta:")) return (await legacyDb().rpc("cuentas_de_ruta", { p_id: source.slice("ruta:".length) })).data ?? [];
  const { data } = await legacyDb().rpc("propuestas_rutas", { lim: PROPOSALS_LIMIT });
  return data?.[source] ?? [];
}
async function filtered(list) {
  const { data: future } = await callRpc("agenda_rango", { p_desde: todayIso(), p_hasta: addDays(todayIso(), LOOK_AHEAD_DAYS), p_usuario: routes2Legacy.agendaOwner() });
  const withAppointment = new Set((future ?? []).filter((item) => appointments.isOpen(item.estado)).map((item) => item.cuenta_id));
  let rest = await withTimetables(list.filter((item) => !withAppointment.has(item.id)));
  const notice = routes2Legacy.revisitNotice();
  if (!notice.on || !rest.length) return { list: rest, recent: [] };
  const { data: seen } = await legacyDb().rpc("actividades_recientes", { p_ids: rest.map((item) => item.id), p_desde: addDays(todayIso(), -notice.dias), p_hasta: todayIso() });
  const last = /* @__PURE__ */ new Map();
  for (const item of (seen ?? []).filter((entry) => entry.tipo === "visita")) {
    const known = last.get(item.cuenta_id);
    if (!known || item.fecha > known.fecha) last.set(item.cuenta_id, item);
  }
  const recent = rest.filter((item) => last.has(item.id)).map((item) => {
    const visit = last.get(item.id);
    return { m: item, motivo: t("routesMore.week.visitedOn", { date: routes2Legacy.shortDate(visit?.fecha ?? ""), who: visit?.usuario ? ` (${visit.usuario})` : "" }) };
  });
  rest = rest.filter((item) => !last.has(item.id));
  return { list: rest, recent };
}
function rememberHours(hours) {
  if (JSON.stringify(hours) === JSON.stringify(activePreferences().plan_semana ?? {})) return;
  const preferences = { ...routes2Legacy.ownPreferences() ?? {}, plan_semana: hours };
  void legacyDb().rpc("guardar_preferencias", { p: preferences }).then(({ data }) => {
    routes2Legacy.setOwnPreferences(data ?? preferences);
  }, () => void 0);
}
async function propose(button, monday, perDay) {
  const days = [...document.querySelectorAll("#dbody [data-spd]:checked")].map((input) => input.dataset.spd ?? "");
  if (!days.length) {
    notices.toast(t("routesMore.week.chooseDay"), true);
    return;
  }
  const max = Number(value("spmax")) || null;
  button.disabled = true;
  button.textContent = t("routesMore.week.calculating");
  const { list, recent } = await filtered(await candidates(value("spfuente")));
  const hours = { salida: value("spsal") || null, vuelta: value("spvue") || null };
  rememberHours(hours);
  const draft = withHours2(hours, () => splitWeek(list, { days, perDay, max, monday }));
  draft.horario = hours.salida || hours.vuelta ? hours : null;
  draft.sinDia = [...draft.sinDia, ...recent];
  routes2Legacy.setWeekDraft(draft);
  button.disabled = false;
  button.textContent = t("routesMore.week.propose");
  document.getElementById("dlg")?.close();
  if (!draft.total) notices.toast(t("routesMore.week.noneFits", { visit: term("visita", { article: "ningun", adjective: "nuevo" }) }), true);
  void window.delcos.screens.agenda.paintOpenWeek();
}
async function planWeek(monday, days, blocked, perDay) {
  const free = days.filter((day) => day >= todayIso() && !blocked[day] && !isWeekend(day));
  if (!free.length) {
    notices.toast(t("routesMore.week.noFreeDays"), true);
    return;
  }
  const { data } = await callRpc("rutas_visibles", {});
  const viewed = agendaState.viewed(), owner = routes2Legacy.agendaOwner();
  const routes2 = (data ?? []).filter((route) => !viewed || route.usuario_id === owner || route.visible_para === "*");
  const body = document.getElementById("dbody"), box2 = document.getElementById("dlg");
  if (!body || !box2) return;
  body.innerHTML = formHtml(days, free, blocked, routes2);
  box2.showModal();
  const ok = document.getElementById("spok");
  if (ok) ok.onclick = () => {
    void propose(ok, monday, perDay);
  };
}
function appointmentOf(draft, account, day) {
  return {
    cuenta_id: account.id,
    fecha: day,
    hora: null,
    centro_nombre: account.centro_nombre ?? null,
    estado: "Planificada",
    origen: "Planificador semanal",
    usuario_id: draft.uid !== salesTeam.currentUserId() ? draft.uid : null,
    op_id: `ps-${account.id}-${day}`,
    salida: draft.horario?.salida ?? null,
    vuelta: draft.horario?.vuelta ?? null
  };
}
async function saveDay(draft, day, entries) {
  const ids = [];
  let saved = 0;
  for (const entry of entries) {
    if (entry.existente) {
      ids.push(entry.existente.id);
      continue;
    }
    if (!entry.m) continue;
    const { data: result } = await legacyDb().rpc("guardar_cita", { p: appointmentOf(draft, entry.m, day) });
    if (result?.ok) {
      ids.push(result.id);
      saved += 1;
    }
  }
  if (ids.length) await legacyDb().rpc("ordenar_citas", { p_ids: ids });
  return saved;
}
async function saveWeekDraft(button) {
  const draft = routes2Legacy.weekDraft();
  if (!draft) return;
  button.disabled = true;
  button.textContent = t("routesMore.week.saving");
  let saved = 0;
  for (const [day, entries] of Object.entries(draft.orden)) saved += await saveDay(draft, day, entries);
  routes2Legacy.setWeekDraft(null);
  notices.toast(t("routesMore.week.saved", { count: saved }));
  routes2Legacy.reloadAgenda();
  restLegacy.reloadHome();
}

// src/app/screens/routes/frequency.ts
var MAX_DAYS = 365;
var SUGGESTED = /* @__PURE__ */ new Map([["inicial", 60], ["avance", 30], ["interes", 15], ["positivo", 30], ["negativo", 0]]);
function formHtml2(days) {
  return `
    <div class="fh"><div><h2>${t("routesMore.frequency.title", { visit: term("visita") })}</h2>
      <div class="sm">${t("routesMore.frequency.subtitle", { aProfessional: term("medico", { article: "un" }) })}</div></div>
      <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>
    ${Object.keys(days).map((state) => `<div class="g2 u-items-center"><div><b>${escapeHtml(state)}</b></div>
      <div><input type="number" min="0" max="${MAX_DAYS}" data-frec="${escapeHtml(state)}" value="${Number(days[state]) || 0}" aria-label="${t("routesMore.frequency.daysFor", { state: escapeHtml(state) })}"></div></div>`).join("")}
    <p class="sm">${t("routesMore.frequency.hint", { visit: term("visita") })}</p>
    <div class="acts u-end"><button class="btn sec" data-cerrar>${t("common.cancel")}</button><button class="btn" id="frok">${t("common.save")}</button></div>`;
}
async function save3(body) {
  const value2 = {};
  body.querySelectorAll("[data-frec]").forEach((input) => {
    value2[input.dataset.frec ?? ""] = Math.max(0, Number(input.value) || 0);
  });
  const { data: result, error } = await legacyDb().rpc("guardar_ajuste", { p_clave: "frecuencia", p_valor: value2 });
  if (error || result?.ok === false) {
    notices.toast(t("routesMore.frequency.couldNotSave"), true);
    return;
  }
  cycleLegacy.setSetting("frecuencia", value2);
  document.getElementById("dlg")?.close();
  notices.toast(t("routesMore.frequency.saved"));
  appLegacy.forgetCache();
  if (legacyAgendaParts.mode() === "equipo") void legacyAgendaPaint.team();
}
async function editFrequency() {
  await cycleLegacy.loadSettings();
  const days = {
    ...Object.fromEntries(commercialStates.all().map((state) => [state.valor, SUGGESTED.get(state.papel) ?? 0])),
    ...cycleLegacy.setting("frecuencia")
  };
  const body = document.getElementById("dbody"), box2 = document.getElementById("dlg");
  if (!body || !box2) return;
  body.innerHTML = formHtml2(days);
  box2.showModal();
  const ok = document.getElementById("frok");
  if (ok) ok.onclick = () => {
    void save3(body);
  };
}

// delcos-shared:src/app/screens/routes/today/service.ts
var shared20 = globalThis["__delcosModules"]["screens/routes/today/service"];
var pick20 = (name) => shared20[name];
var CAR_ICON = /* @__PURE__ */ pick20("CAR_ICON");
var PALETTE = /* @__PURE__ */ pick20("PALETTE");
var durationText = /* @__PURE__ */ pick20("durationText");
var flatKm = /* @__PURE__ */ pick20("flatKm");
var lineIcon = /* @__PURE__ */ pick20("lineIcon");
var mapLibrary = /* @__PURE__ */ pick20("mapLibrary");
var reasonText = /* @__PURE__ */ pick20("reasonText");
var streetRoute = /* @__PURE__ */ pick20("streetRoute");

// src/app/screens/routes/today/map-style.ts
var HALO_WIDTH = 1.4;
var PARK_OPACITY = 0.8;
var ZONE_OPACITY = 0.6;
var ROUTE_EDGE_WIDTH = 8;
var ROUTE_WIDTH = 5;
var DONE_WIDTH = 6;
function setter(map, id) {
  return {
    set: (key, value2) => {
      try {
        map.setPaintProperty(id, key, value2);
      } catch {
      }
    },
    hide: () => {
      try {
        map.setLayoutProperty(id, "visibility", "none");
      } catch {
      }
    }
  };
}
function styleFill(id, set) {
  if (/water/i.test(id)) {
    set("fill-color", PALETTE.agua);
    return;
  }
  if (/building/i.test(id)) {
    set("fill-color", PALETTE.edif);
    set("fill-outline-color", PALETTE.borde);
    return;
  }
  if (/park|wood|grass|forest|landcover|cemetery|pitch/i.test(id)) {
    set("fill-color", PALETTE.parque);
    set("fill-opacity", PARK_OPACITY);
    return;
  }
  set("fill-color", PALETTE.zona);
  set("fill-opacity", ZONE_OPACITY);
}
function styleLine(id, set, hide) {
  if (/water|river|stream|canal/i.test(id)) {
    set("line-color", PALETTE.agua);
    return;
  }
  if (/rail|ferry|aeroway|boundary|admin/i.test(id)) {
    hide();
    return;
  }
  const big = /motorway|trunk|primary/i.test(id);
  set("line-color", /casing/i.test(id) ? big ? PALETTE.viaBorde : PALETTE.borde : big ? PALETTE.via : PALETTE.calle);
}
function styleLayer(map, layer) {
  const { set, hide } = setter(map, layer.id), id = layer.id;
  if (layer.type === "fill-extrusion") {
    hide();
    return;
  }
  if (layer.type === "background") {
    set("background-color", PALETTE.tierra);
    return;
  }
  if (layer.type === "symbol") {
    if (/poi|aeroway|housenumber|transit|rail|ferry|shield/i.test(id)) {
      hide();
      return;
    }
    set("text-color", PALETTE.texto);
    set("text-halo-color", "#FFFFFF");
    set("text-halo-width", HALO_WIDTH);
    return;
  }
  if (layer.type === "fill") styleFill(id, set);
  else if (layer.type === "line") styleLine(id, set, hide);
}
function styleDayMap(map, route, streets) {
  for (const layer of map.getStyle().layers ?? []) styleLayer(map, layer);
  const layout = { "line-cap": "round", "line-join": "round" };
  map.addSource("rm-ruta", { type: "geojson", data: route });
  map.addSource("rm-hecho", { type: "geojson", data: { type: "Feature", geometry: { type: "LineString", coordinates: [] } } });
  map.addLayer({ id: "rm-ruta-borde", type: "line", source: "rm-ruta", paint: { "line-color": PALETTE.rutaBorde, "line-width": ROUTE_EDGE_WIDTH }, layout });
  map.addLayer({ id: "rm-ruta", type: "line", source: "rm-ruta", paint: { "line-color": PALETTE.ruta, "line-width": ROUTE_WIDTH, ...streets ? {} : { "line-dasharray": [1.5, 1.5] } }, layout });
  map.addLayer({ id: "rm-hecho", type: "line", source: "rm-hecho", paint: { "line-color": PALETTE.hecho, "line-width": DONE_WIDTH }, layout });
}

// src/app/screens/routes/today/track.ts
var MARGIN = 30;
var HOUR = 60;
var MIN_KM = 1e-3;
function trackScale(plan) {
  const lo = Math.floor((Math.min(plan.ini, plan.tope ?? plan.ini) - MARGIN) / HOUR) * HOUR, hi = Math.ceil((Math.max(plan.fin, plan.tope ?? 0) + MARGIN) / HOUR) * HOUR;
  return { lo, hi, x: (minutes) => `${((minutes - lo) / (hi - lo || 1) * 100).toFixed(2)}%` };
}
function segmentHtml(segment, scale) {
  const position = `left:${scale.x(segment.a)};width:calc(${scale.x(segment.b)} - ${scale.x(segment.a)})`;
  if (segment.tipo === "viaje") return `<div class="seg viaje" style="${position}"></div>`;
  const state = segment.p.c.estado, kind = routes2Legacy.isDone(state) ? "hecha" : appointments.isOpen(state) ? "" : "no";
  return `<div class="seg vis ${kind}" style="${position}" title="${escapeHtml(segment.p.c.nombre ?? "")}"><span>${segment.p.i + 1}</span></div>`;
}
function paintTrack(plan, scale, slider) {
  const now = nowMinutes(), { lo, hi, x } = scale;
  const track = document.getElementById("rmpista"), hours = document.getElementById("rmhoras");
  if (track) track.innerHTML = `${plan.tope && plan.tope < hi ? `<div class="tope" style="left:${x(plan.tope)};right:0" title="${t("routesMore.dayMap.afterBack")}"></div>` : ""}
    ${plan.segs.map((segment) => segmentHtml(segment, scale)).join("")}
    ${now > lo && now < hi ? `<div class="ahora" style="left:${x(now)}"></div>` : ""}`;
  if (hours) hours.innerHTML = range((hi - lo) / HOUR + 1).map((step) => lo + step * HOUR).map((minutes) => `<span style="left:${x(minutes)}">${formatMinutes(minutes)}</span>`).join("");
  slider.min = String(lo);
  slider.max = String(hi);
  slider.value = String(Math.min(hi, Math.max(lo, now)));
}
function prepare(points) {
  const run = [0];
  for (let index = 1; index < points.length; index++) {
    const from = points[index - 1] ?? [0, 0], to = points[index] ?? from;
    run.push((run[index - 1] ?? 0) + flatKm([from[1], from[0]], [to[1], to[0]]));
  }
  const total = run[run.length - 1] ?? 0;
  return { l: points, c: run, tot: total || MIN_KM };
}
function travelLines(travel, legs) {
  return travel.map((segment) => {
    const line = legs?.[segment.k]?.linea;
    return prepare(line && line.length > 1 ? line.map(([latitude, longitude]) => [longitude, latitude]) : [[segment.de[1], segment.de[0]], [segment.hasta[1], segment.hasta[0]]]);
  });
}
function pointOnLine(line, part) {
  const distance = Math.max(0, Math.min(1, part)) * line.tot;
  let index = 1;
  while (index < line.c.length - 1 && (line.c[index] ?? 0) < distance) index++;
  const from = line.l[index - 1] ?? [0, 0], to = line.l[index] ?? from, before = line.c[index - 1] ?? 0;
  const share = Math.max(0, Math.min(1, (distance - before) / ((line.c[index] ?? 0) - before || 1)));
  const heading = (Math.atan2((to[0] - from[0]) * Math.cos(from[1] * Math.PI / 180), to[1] - from[1]) * 180 / Math.PI + 360) % 360;
  return { pt: [from[0] + (to[0] - from[0]) * share, from[1] + (to[1] - from[1]) * share], i: index, rumbo: heading };
}

// src/app/screens/routes/today/position.ts
var DEFAULT_VISIT3 = 15;
var CHECK_ICON = '<path d="M20 6 9 17l-5-5"/>';
var CLOCK_ICON = '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>';
var lngLat = (point) => [point[1], point[0]];
function momentAt(parts, minutes) {
  const leg = parts.travel.findIndex((segment) => minutes >= segment.a && minutes < segment.b), travel = leg >= 0 ? parts.travel[leg] ?? null : null;
  const visit = parts.plan.segs.find((segment) => segment.tipo === "vis" && minutes >= segment.a && minutes <= segment.b);
  return { leg, travel, visit, part: travel ? (minutes - travel.a) / (travel.b - travel.a || 1) : 0 };
}
function markerPoint(parts, moment, minutes) {
  if (moment.travel) {
    const at = pointOnLine(parts.lines[moment.leg] ?? { l: [], c: [0], tot: 1 }, moment.part);
    return { point: at.pt, heading: at.rumbo };
  }
  if (moment.visit) return { point: lngLat(moment.visit.p.xy), heading: null };
  const before = parts.plan.segs.filter((segment) => segment.b <= minutes).pop();
  if (before) return { point: lngLat(before.tipo === "vis" ? before.p.xy : before.hasta), heading: null };
  return { point: lngLat(parts.start), heading: null };
}
function donePart(parts, moment, minutes) {
  const done = [];
  parts.lines.forEach((line, index) => {
    if ((parts.travel[index]?.b ?? Infinity) <= minutes) done.push(...line.l);
    else if (index === moment.leg) {
      const at = pointOnLine(line, moment.part);
      done.push(...line.l.slice(0, at.i), at.pt);
    }
  });
  return done;
}
function placeName(parts, point) {
  const stop = parts.plan.paradas.find((item) => item.xy[0] === point[0] && item.xy[1] === point[1]);
  return stop ? stop.c.nombre ?? "" : routes2Legacy.start().nombre ?? t("routesMore.dayMap.theStart");
}
function momentHtml(parts, moment, next) {
  const { travel, visit, part } = moment;
  if (travel) {
    const left = travel.km !== null ? ` · ${String(Math.round((1 - part) * travel.km * 10) / 10).replace(".", ",")} km` : "";
    return `<span class="ico">${lineIcon(CAR_ICON)}</span><div><b>${t("routesMore.dayMap.towards", { place: escapeHtml(placeName(parts, travel.hasta)) })}</b><span>${t("routesMore.dayMap.arrive", { time: formatMinutes(travel.b) })}${left}</span></div>`;
  }
  if (visit) {
    const after = next && next !== visit.p ? t("routesMore.dayMap.after", { name: escapeHtml(next.c.nombre ?? "") }) : "";
    return `<span class="ico">${lineIcon(CHECK_ICON)}</span><div><b>${t("routesMore.dayMap.at", { place: escapeHtml(visit.p.c.nombre ?? "") })}</b><span>${t("routesMore.dayMap.until", { time: formatMinutes(visit.b) })}${after}</span></div>`;
  }
  if (next) return `<span class="ico">${lineIcon(CLOCK_ICON)}</span><div><b>${t("routesMore.dayMap.next", { name: escapeHtml(next.c.nombre ?? "") })}</b><span>${t("routesMore.dayMap.around", { time: formatMinutes(next.ini) })}</span></div>`;
  return `<span class="ico">${routes2Legacy.iconOrEmpty("house")}</span><div><b>${t("routesMore.dayMap.dayOver")}</b><span>${t("routesMore.dayMap.backAround", { time: formatMinutes(parts.plan.fin) })}</span></div>`;
}
function dayPosition(parts, minutes) {
  if (!document.getElementById("rmscrub")) return null;
  const now = minutes ?? Number(parts.slider.value), moment = momentAt(parts, now), { point, heading } = markerPoint(parts, moment, now);
  parts.ownMarker.setLngLat(point);
  parts.own.classList.toggle("parado", !moment.travel);
  if (heading !== null) {
    const beam = parts.own.querySelector(".haz");
    if (beam) beam.style.transform = `rotate(${heading}deg)`;
  }
  const done = donePart(parts, moment, now), source = parts.map.getSource("rm-hecho");
  source?.setData({ type: "Feature", geometry: { type: "LineString", coordinates: done.length > 1 ? done : [] } });
  const length = planSettings().visita || DEFAULT_VISIT3, next = parts.plan.paradas.find((stop) => stop.ini + length > now);
  for (const stop of parts.plan.paradas) {
    const element = parts.markers[stop.c.id];
    if (!element) continue;
    element.classList.toggle("pasada", stop.ini + length <= now);
    element.classList.toggle("sig", stop === next);
  }
  const nav = document.getElementById("rmnav"), text = document.getElementById("rmtx");
  if (nav) nav.innerHTML = momentHtml(parts, moment, next);
  if (text) text.innerHTML = t("routesMore.dayMap.atTime", { time: formatMinutes(now) });
  return point;
}

// src/app/screens/routes/today/day-map.ts
var STYLE = "https://tiles.openfreemap.org/styles/liberty";
var MAX_ZOOM2 = 15;
var FOLLOW_ZOOM = 13.6;
var PADDING3 = { top: 50, bottom: 90, left: 50, right: 50 };
var FIT_MS = 900;
var MAX_STEP_S = 0.1;
var TRAVEL_SPEED = 6;
var VISIT_SPEED = 70;
var END_MARGIN = 5;
var CAMERA_EASE = 2.2;
function boundsOf(points) {
  return points.reduce((box2, [latitude, longitude]) => [[Math.min(box2[0][0], longitude), Math.min(box2[0][1], latitude)], [Math.max(box2[1][0], longitude), Math.max(box2[1][1], latitude)]], [[180, 90], [-180, -90]]);
}
function stopMarkers(library, map, plan) {
  const markers = {}, groups = /* @__PURE__ */ new Map();
  for (const stop of plan.paradas) {
    const key = stop.xy.join(",");
    groups.set(key, [...groups.get(key) ?? [], stop]);
  }
  for (const group of groups.values()) {
    const first = group[0];
    if (!first) continue;
    const element = document.createElement("button");
    element.type = "button";
    element.className = `rmmk${group.length > 1 ? " multi" : ""}`;
    element.style.setProperty("--c", commercialStates.color(first.c.estado) ?? "var(--navy)");
    element.innerHTML = `<span>${group.map((stop) => stop.i + 1).join("·")}</span>`;
    element.setAttribute("aria-label", group.map((stop) => stop.c.nombre ?? "").join(", "));
    element.onclick = (event) => {
      event.stopPropagation();
      appointmentLegacy.openSheet(first.c);
    };
    new library.Marker({ element, anchor: "bottom" }).setLngLat([first.xy[1], first.xy[0]]).addTo(map);
    for (const stop of group) markers[stop.c.id] = element;
  }
  return markers;
}
function homeMarker(library, map, plan) {
  if (!plan.casa) return;
  const home = document.createElement("div");
  home.className = "rmcasa";
  home.title = orFallback(routes2Legacy.start().nombre, t("routesMore.dayMap.start"));
  home.innerHTML = routes2Legacy.iconOrEmpty("house");
  new library.Marker({ element: home }).setLngLat([plan.casa[1], plan.casa[0]]).addTo(map);
}
function ownMarker(library, map, start) {
  const element = document.createElement("div");
  element.className = "rmyo";
  element.innerHTML = `<span class="haz"><svg viewBox="0 0 84 84"><path d="M42 42 L27 2.9 A42 42 0 0 1 57 2.9 Z" fill="#3F82C0" fill-opacity=".38"/></svg></span><span class="pun">${lineIcon(CAR_ICON)}</span>`;
  return { element, marker: new library.Marker({ element }).setLngLat([start[1], start[0]]).addTo(map) };
}
function stopAnimation() {
  const frame = routes2Legacy.animation();
  if (frame) cancelAnimationFrame(frame);
  routes2Legacy.setAnimation(null);
}
function bindPlayer(parts, bounds, move) {
  const button = document.getElementById("rmplay"), slider = parts.slider, label = () => button?.querySelector("span") ?? null;
  const stop = () => {
    stopAnimation();
    const text = label();
    if (text) text.textContent = parts.texts.play;
    parts.own.classList.remove("va");
    if (parts.camera.on) {
      parts.camera.on = false;
      parts.camera.centre = null;
      parts.camera.last = 0;
      parts.map.fitBounds(bounds, { padding: PADDING3, duration: FIT_MS, maxZoom: MAX_ZOOM2 });
    }
  };
  if (!button) return;
  button.onclick = () => {
    if (routes2Legacy.animation()) {
      stop();
      return;
    }
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let minutes = Number(slider.value) >= parts.scale.hi - END_MARGIN ? parts.scale.lo : Number(slider.value), last = null;
    parts.camera.on = !reduce;
    const text = label();
    if (text) text.textContent = parts.texts.stop;
    parts.own.classList.add("va");
    const step = (time) => {
      if (!document.getElementById("rmscrub")) {
        stop();
        return;
      }
      last ?? (last = time);
      const elapsed = Math.min(MAX_STEP_S, (time - last) / 1e3);
      last = time;
      const travelling = parts.travel.some((segment) => minutes >= segment.a && minutes <= segment.b);
      minutes = Math.min(parts.scale.hi, minutes + elapsed * (travelling ? TRAVEL_SPEED : VISIT_SPEED));
      slider.value = String(minutes);
      move(minutes);
      if (minutes < parts.scale.hi) routes2Legacy.setAnimation(requestAnimationFrame(step));
      else stop();
    };
    routes2Legacy.setAnimation(requestAnimationFrame(step));
  };
}
function follow(parts, point) {
  const camera = parts.camera;
  if (!camera.on) return;
  const time = performance.now(), ease = camera.last ? 1 - Math.exp(-Math.min(500, time - camera.last) / 1e3 * CAMERA_EASE) : 1;
  camera.last = time;
  camera.centre = camera.centre ? [camera.centre[0] + (point[0] - camera.centre[0]) * ease, camera.centre[1] + (point[1] - camera.centre[1]) * ease] : point;
  parts.map.jumpTo({ center: camera.centre, zoom: FOLLOW_ZOOM });
}
function paintDayMap(library, plan, legs, texts2) {
  stopAnimation();
  const previous = routes2Legacy.dayMap();
  if (previous) {
    try {
      previous.remove();
    } catch {
    }
    routes2Legacy.setDayMap(null);
  }
  const points = [...plan.paradas.map((stop) => stop.xy), ...plan.casa ? [plan.casa] : []], bounds = boundsOf(points);
  const map = new library.Map({ container: "rmc", style: STYLE, maxPitch: 0, dragRotate: false, attributionControl: { compact: true } });
  routes2Legacy.setDayMap(map);
  map.touchZoomRotate.disableRotation();
  map.fitBounds(bounds, { padding: PADDING3, duration: 0, maxZoom: MAX_ZOOM2 });
  map.addControl(new library.NavigationControl({ showCompass: false }), "top-right");
  const travel = plan.segs.filter((segment) => segment.tipo === "viaje"), lines = travelLines(travel, legs);
  const slider = document.getElementById("rmscrub");
  if (!slider) return;
  homeMarker(library, map, plan);
  const markers = stopMarkers(library, map, plan), first = points[0] ?? [0, 0], own = ownMarker(library, map, first), scale = trackScale(plan);
  const parts = { map, plan, travel, lines, markers, own: own.element, ownMarker: own.marker, slider, scale, start: first, camera: { on: false, centre: null, last: 0 }, texts: texts2 };
  const move = (minutes) => {
    const point = dayPosition(parts, minutes);
    if (point) follow(parts, point);
  };
  map.on("load", () => {
    styleDayMap(map, { type: "Feature", geometry: { type: "LineString", coordinates: lines.flatMap((line) => line.l) } }, Boolean(legs));
    move();
  });
  paintTrack(plan, scale, slider);
  slider.oninput = () => {
    move();
  };
  bindPlayer(parts, bounds, move);
  move();
}

// delcos-shared:src/app/screens/routes/today/day-plan.ts
var shared21 = globalThis["__delcosModules"]["screens/routes/today/day-plan"];
var pick21 = (name) => shared21[name];
var dayMapPlan = /* @__PURE__ */ pick21("dayMapPlan");

// src/app/screens/routes/today/index.ts
var MAX_POINTS = 30;
function frameHtml() {
  return `<div class="rmcab"><div><h2>${t("routesMore.dayMap.title")}</h2><span class="sm" id="rmsub">${t("routesMore.dayMap.searching")}</span></div>
      <button type="button" class="btn" id="rmplay">${lineIcon('<path d="M6 4l14 8-14 8z"/>')}<span>${t("routesMore.dayMap.play")}</span></button></div>
    <div class="rmwrap"><div class="rmc" id="rmc"></div><div class="rmnav" id="rmnav"></div></div>
    <div class="rmjorn"><div class="rmpista" id="rmpista"></div><div class="rmhoras" id="rmhoras"></div>
      <input type="range" class="rmscrub" id="rmscrub" step="5" aria-label="${t("routesMore.dayMap.hourLabel")}"><div class="rmtx sm" id="rmtx"></div></div>`;
}
function subtitle(route, plan, real) {
  if (!real) return t("routesMore.dayMap.straight", { reason: escapeHtml(reasonText(route.motivo)), end: formatMinutes(plan.fin) });
  const delay = route.retraso_min;
  return t("routesMore.dayMap.streets", { km: String(route.km).replace(".", ","), duration: durationText(route.min ?? 0), delay: delay ? t("routesMore.dayMap.delay", { minutes: delay }) : "", end: formatMinutes(plan.fin) });
}
function mapBox(reference, plan) {
  let box2 = document.getElementById("rmapa");
  if (!plan.paradas.length) {
    box2?.remove();
    return null;
  }
  if (!box2) {
    reference.insertAdjacentHTML("afterend", `<section class="card rmapa" id="rmapa" aria-label="${t("routesMore.dayMap.title")}"></section>`);
    box2 = document.getElementById("rmapa");
  }
  return box2;
}
async function prepare2() {
  const view = document.getElementById("v-rutas");
  if (currentScreen() !== "rutas" || !view) return null;
  const reference = document.getElementById("renc") ?? view.querySelector(".saludo");
  if (!reference) return null;
  const list = await appointments.ofDay(todayIso());
  if (currentScreen() !== "rutas" || !reference.isConnected) return null;
  const estimate = dayMapPlan(list, todayIso(), null), box2 = mapBox(reference, estimate);
  if (!box2) return null;
  box2.innerHTML = frameHtml();
  return { list, estimate };
}
function routeOf(estimate, isoDate) {
  const first = estimate.segs[0], leaving = first ? `${isoDate}T${formatMinutes(Math.max(0, first.a))}:00` : null;
  const fits = estimate.puntos.length > 1 && estimate.puntos.length <= MAX_POINTS;
  return fits ? streetRoute(estimate.puntos, leaving) : Promise.resolve({ ok: false, motivo: "datos" });
}
async function libraryOrNotice() {
  try {
    return await mapLibrary();
  } catch {
    const place = document.getElementById("rmc");
    if (place) place.innerHTML = `<div class="vacio">${t("routesMore.dayMap.noMap")}</div>`;
    return null;
  }
}
async function loadDayMap() {
  const ready = await prepare2();
  if (!ready) return;
  const library = await libraryOrNotice();
  if (!library || !document.getElementById("rmc")) return;
  const isoDate = todayIso(), { list, estimate } = ready, route = await routeOf(estimate, isoDate);
  if (!document.getElementById("rmc")) return;
  const legs = route.ok && route.tramos?.length === estimate.puntos.length - 1 ? route.tramos : null;
  const plan = legs ? dayMapPlan(list, isoDate, legs) : estimate;
  const text = document.getElementById("rmsub");
  if (text) text.innerHTML = subtitle(route, plan, Boolean(legs));
  paintDayMap(library, plan, legs, { play: t("routesMore.dayMap.play"), stop: t("routesMore.dayMap.stop") });
}

// src/app/screens/routes/page.ts
function headerTimes(view) {
  const actions = view.querySelector(".saludo .acts");
  if (actions && !document.getElementById("rhorario")) {
    actions.insertAdjacentHTML("afterbegin", `<button class="btn sec" id="rhorario" title="${t("routesMore.page.timesTitle", { visit: term("visita") })}">${t("routesMore.page.times", { visit: term("visita") })}</button>`);
    const times = document.getElementById("rhorario");
    if (times) times.onclick = () => {
      routes2Legacy.openPlanTimes();
    };
  }
  const subtitle2 = view.querySelector(".saludo .fecha");
  if (subtitle2) subtitle2.textContent = t("routesMore.page.subtitle", { minutes: planSettings().visita, professional: term("medico") });
}
async function todaySubtitle(view) {
  const subtitle2 = view.querySelector(".saludo .fecha");
  if (!subtitle2 || routes2Legacy.workingDay()) return;
  const list = await appointments.ofDay(todayIso());
  if (!subtitle2.isConnected) return;
  const done = list.filter((item) => item.estado === VISITED).length, open = list.filter((item) => appointments.isOpen(item.estado)).length, count = done + open;
  const text = count ? t("routesMore.page.today", { count, appointments: t(count === 1 ? "routesMore.page.appointment" : "routesMore.page.appointments"), done, visited: t(done === 1 ? "routesMore.page.visitedOne" : "routesMore.page.visited"), open }) : t("routesMore.page.noneToday");
  subtitle2.innerHTML = `${escapeHtml(text)} · <button type="button" class="kcfg" id="rverdia">${t("routesMore.page.seeDay")}</button>`;
  const see = subtitle2.querySelector("#rverdia");
  if (see) see.onclick = showToday;
}
async function pageHeader() {
  if (routes2Legacy.draft()) return;
  const view = document.getElementById("v-rutas");
  if (!view) return;
  headerTimes(view);
  await todaySubtitle(view);
}
async function loadRoutesPage() {
  await paintRoutes();
  paintDayInProgress();
  await pageHeader();
  void routes2Legacy.paintDayMapAround();
}
export {
  appointmentsOn,
  buildPlan,
  copyToAgenda,
  editFrequency,
  editRoute,
  loadDayMap,
  loadRoutesPage,
  openPlanTimesWindow,
  openRoute,
  paintPlanCard,
  paintRoutes,
  planAgendaButtons,
  planCardsAndNotes,
  planFromList,
  planHoursAndLeftOut,
  planMapAndDiscard,
  planNoStartNotice,
  planRecentlyVisited,
  planRoute,
  planToAgenda,
  planWeek,
  refillRepeating,
  saveWeekDraft,
  showPlanMap,
  startRoute
};
