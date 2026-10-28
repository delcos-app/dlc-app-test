// delcos-shared:src/app/i18n/index.ts
var shared = globalThis["__delcosModules"]["i18n/index"];
var pick = (name) => shared[name];
var registerMessages = /* @__PURE__ */ pick("registerMessages");
var t = /* @__PURE__ */ pick("t");

// src/app/i18n/es/chunks/agenda/agenda.ts
var agenda = {
  title: "Agenda",
  todayTitle: "Hoy · {date}",
  agendaOf: " · agenda de {name}",
  yourNumbers: "Tus números",
  newAppointment: "+ Nueva cita",
  backToToday: "Volver a hoy",
  noAppointmentsThatDay: "No tuviste citas este día.",
  team: {
    title: "Cumplimiento del equipo",
    agendaOf: "Agenda de",
    seeOthers: "Ver la agenda de otra persona",
    myAgenda: "Mi agenda",
    team: "Equipo",
    backToMine: "Volver a tu agenda",
    seeTeam: "Ver el cumplimiento del equipo"
  },
  month: {
    previous: "Mes anterior",
    next: "Mes siguiente",
    choose: "Elegir mes y año",
    today: "Hoy",
    previousYear: "Año anterior",
    nextYear: "Año siguiente",
    dayLabel: "{date}: {count} citas"
  },
  metrics: {
    today: "Hoy",
    week: "Semana",
    closings: "Cierres",
    toVisit: "Por visitar",
    todayDetail: "{done} de {total} citas · media {average} {visits}/día",
    weekDetail: "{count} {visits} · media {average}/semana",
    closingsDetail: "{count} cierres con éxito hoy · media {average}/día",
    toVisitDetail: "{urgent} urgentes · {noVisit} sin {visit} en 60 días"
  },
  trays: {
    due: "Les toca {visit}",
    dueText: "Según la frecuencia objetivo de cada {professional}. Añádelos a este día o planifica una ruta con ellos.",
    pending: "Pendientes de días anteriores",
    pendingShort: "Pendientes anteriores",
    pendingText: "Los planificaste y no se visitaron. Muévelos a hoy o descártalos.",
    daysWithout: "{days} días sin {visit}",
    neverVisited: "nunca visitado",
    card: "Ficha",
    addAppointment: "+ Cita",
    moveToToday: "Mover a hoy",
    discard: "Descartar",
    planRoute: "Planificar ruta",
    rescheduleAll: "Reprogramar todas",
    notVisited: "{count} sin visitar",
    nothingPending: "Nada pendiente."
  },
  yourDay: {
    titleToday: "Tu día",
    titlePast: "Lo que pasó este día",
    titleFuture: "Tu agenda de este día",
    dayOptions: "Opciones del día",
    dayOptionsTitle: "Opciones del día: nueva cita, bloquear el día…",
    appointments: "<b>{count}</b> citas",
    visited: '<b class="u-ok">{count}</b> visitadas',
    absent: '<b class="u-warn">{count}</b> no estaban',
    toDo: "<b>{count}</b> por hacer",
    estimatedEnd: "Fin estimado",
    overReturn: " · pasa de la hora de vuelta",
    nextDay: "(día siguiente: revisa los avisos)",
    addTask: "+ Tarea",
    orderByDistance: "Ordenar por cercanía",
    orderTitle: "Ordena las citas abiertas para recorrer menos kilómetros. Las que tienen hora fija se respetan.",
    startDay: "▶ Empezar jornada",
    endDay: "Terminar jornada",
    reschedulePending: "Reprogramar pendientes",
    workingDay: "● Jornada en curso desde hace {time}. Registra cada {visit} al terminarla.",
    noFit: "<b>Este día no cabe en una jornada.</b> Con este orden acabarías {end}{outside}.",
    outsideOne: " y una cita queda fuera de tu horario",
    outsideMany: " y {count} citas quedan fuera de tu horario",
    badWindows: "<b>Varias citas no encajan con sus horarios.</b>",
    beforeEach: "Antes de mirar cada cita: ",
    or: " o ",
    moveFarthest: "pasa a otro día las citas de la zona más lejana (⋯ → Aplazar).",
    endAround: "hacia las {time}",
    endAfterMidnight: "pasada la medianoche (hacia las {time} del día siguiente)",
    emptyToday: "No tienes citas hoy. Planifica una ruta en Rutas o cita a alguien de las sugerencias.",
    emptyOther: "Sin citas este día.",
    offlineNoCopy: "Sin conexión y sin copia guardada de este día: se verá al volver la red.",
    dayAppointments: "Citas del día",
    othersTitle: "Citas de otras personas · {count}",
    pendingOf: "Pendientes del {date}",
    notVisitedThatDay: "Sin visitar ese día",
    ordered: "Citas ordenadas por cercanía",
    orderedWithLeft: "Ordenadas · {count} no caben en su horario o en el tuyo y quedan al final",
    queued: "Registrada en el móvil · pendiente de enviar",
    couldNotSaveOrder: "No se ha podido guardar el orden"
  },
  card: {
    inTime: "en {time}",
    estimatedTime: "Hora estimada",
    farLocation: "Ubicación a {km} km de la parada anterior: revisa la dirección",
    attends: "Atiende {windows}",
    waits: " · esperas {minutes} min",
    due: "Toca: {action}",
    lastVisit: "Última {visit} hace {days} {unit}",
    day: "día",
    days: "días",
    firstVisit: "Primera {visit}",
    noLocation: "Sin ubicación",
    next: "Siguiente",
    seeAppointment: "Ver la cita",
    classTitle: "Clase {name}",
    urgent: "Urgente",
    noCentre: "Sin centro",
    fixedTime: "Hora fijada",
    estimatedByOrder: "Hora estimada según el orden",
    keep: " · mantener",
    moveUp: "Subir en el orden",
    moveDown: "Bajar en el orden",
    moreActions: "Más acciones",
    newAppointment: "Nueva cita",
    record: "Registrar {visit}"
  },
  sheet: {
    when: "Cuándo",
    where: "Dónde",
    timetable: "Horario",
    state: "Estado",
    around: "hacia las {time} (estimada)",
    noTime: "sin hora",
    noCentre: "Sin centro",
    atCentre: "En {centre}: ",
    notAttending: "Ese día no atiende",
    notes: "Notas de la cita",
    notesPlaceholder: "p. ej. quedamos en el bar de enfrente, llevar el reporting…",
    seeCard: "Ver ficha",
    directions: "Cómo llegar",
    changeTime: "Cambiar hora",
    moveDay: "Mover a otro día",
    saveNotes: "Guardar notas",
    record: "Registrar {visit}",
    discard: "Descartar la cita",
    discardText: "No se hará: queda en el historial.",
    delete: "Eliminar la cita",
    deleteText: "Fue un error: desaparece sin dejar rastro.",
    planAgain: "Volver a planificarla",
    goTo: "Ir al {day}",
    seeDay: "Ver el {day}",
    closed: "<b>Cita cerrada: {state}.</b>",
    closedReopen: "Si hace falta, puedes volver a planificarla desde «⋯».",
    closedFinal: "La hora y el día ya no se cambian; las notas sí. Si hace falta volver, crea una cita nueva.",
    recorded: "Se registró la {visit}{time}{results}.",
    recordedAt: " a las {time}",
    couldNotSave: "No se ha podido guardar: {error}",
    notesSaved: "Notas guardadas"
  },
  menu: {
    alreadyClosed: "Esta cita ya está cerrada"
  },
  actions: {
    couldNotChange: "No se ha podido cambiar",
    confirmed: "Cita confirmada",
    discarded: "Cita descartada",
    unconfirmed: "Confirmación quitada",
    deleteQuestion: "La cita desaparece de la agenda sin dejar rastro.",
    deleteTitle: "¿Eliminar la cita?",
    delete: "Eliminar",
    onlyFuture: "Solo se pueden eliminar citas de hoy en adelante",
    couldNotDelete: "No se ha podido eliminar",
    deleted: "Cita eliminada",
    whichDay: "¿A qué día la pasas?",
    postponeTitle: "Aplazar la cita",
    postpone: "Aplazar",
    couldNotPostpone: "No se ha podido aplazar",
    alreadyThatDay: "Ya tenía una cita ese día",
    sameDay: "Sigue en el mismo día",
    backToOwn: "Vuelve a su cita del {date}",
    postponedTo: "Aplazada al {date}",
    missingNegative: "Falta un resultado negativo en Configuración → Clasificadores",
    whatHappened: "¿Qué ha pasado?",
    cancel: "Cancelar",
    couldNotSave: "No se ha podido guardar: {error}",
    noted: "Anotado: {result}",
    reopenOnlyFuture: "Solo se pueden volver a planificar citas de hoy en adelante",
    couldNotReopen: "No se ha podido volver a planificar",
    reopenedRemoving: "Vuelve a estar planificada (se quita la del {date})",
    reopened: "Vuelve a estar planificada",
    timeTitle: "Hora de la cita",
    save: "Guardar",
    couldNotTime: "No se ha podido: {error}",
    timeUpdated: "Hora actualizada"
  },
  tasks: {
    title: "Tareas y notas · {count}",
    done: "Hecha",
    up: "Subir la tarea",
    down: "Bajar la tarea",
    couldNotSave: "No se ha podido guardar",
    show: "Ver las tareas",
    hide: "Ocultar las tareas"
  },
  strip: {
    thisWeek: "Esta semana",
    nextWeek: "La semana que viene",
    lastWeek: "La semana pasada",
    weekOf: "Semana del {day} de {month}",
    previousWeekNav: "Semana anterior",
    nextWeekNav: "Semana siguiente",
    seeMonth: "Ver el mes",
    today: "Hoy",
    done: "Hecha",
    toDo: "Por hacer",
    notClosed: "Sin cerrar",
    oneAppointment: "{count} cita",
    appointments: "{count} citas",
    dayOptions: "Opciones del día",
    showWeek: "Ver la semana",
    hideWeek: "Ocultar la semana",
    showWeekTitle: "Ver la semana entera, moverla y repartirla"
  },
  openWeek: {
    hint: "Arrastra una cita a otro día para moverla · «⋯» en un día para bloquearlo o añadir una cita",
    share: "Repartir la semana",
    draft: "Propuesta sin guardar",
    draftSummary: "{count} {visits} en {days} días",
    draftWithoutDay: " · {count} sin día",
    discard: "Descartar",
    save: "Guardar en la agenda",
    dayOptions: "Opciones del {date}",
    dayOptionsTitle: "Opciones del día",
    estimatedEnd: "Hora de fin estimada",
    overReturn: ": pasa de la hora de vuelta {time}",
    dragToMove: " · arrástrala a otro día para moverla",
    proposal: "Propuesta: {name}",
    andMore: "y {count} más",
    withoutDay: "Se quedan sin día · {count}",
    notToPast: "No se puede mover a un día pasado",
    blockedDay: "ese día está bloqueado ({reason})",
    notAttending: "ese día no atiende",
    moveAnyway: "¿Moverla igualmente?",
    move: "Mover",
    couldNotMove: "No se ha podido mover",
    movedTo: "Movida al {date}"
  },
  week: {
    title: "Tu semana",
    hint: "«⋯» en un día para bloquearlo (festivo, vacaciones, formación) o añadir una cita.",
    seeDay: "Ver el {date}",
    dayOptions: "Opciones del {date}",
    andMore: "y {count} más",
    free: "Libre",
    share: "Repartir la semana"
  },
  editor: {
    newTitle: "Nueva cita",
    newSubtitle: "Se añade a tu agenda",
    day: "Día",
    time: "Hora",
    optional: "(opcional)",
    centre: "Centro",
    notes: "Notas",
    cancel: "Cancelar",
    add: "Añadir a la agenda",
    choose: "Elige {professional}",
    couldNot: "No se ha podido: {error}",
    added: "Cita añadida el {date}",
    duplicateTitle: "Ya tiene una cita ese día",
    duplicateText: "{name}\n{date}{time} · {state}{origin}\n\n¿Qué quieres hacer?",
    at: " a las {time}",
    keepBoth: "Mantener las dos",
    onlyNew: "Quedarme solo con la nueva",
    couldNotRemovePrevious: "No se ha podido quitar la cita anterior",
    recentTitle: "Ya se ha visto hace poco",
    recentText: "{list}.\n\n¿Añades la cita igualmente?",
    yesNoMore: "Sí, y no volver a avisarme",
    addAnyway: "Añadir igualmente",
    noticeOff: "Aviso desactivado. Puedes activarlo en Configuración → Rutas"
  },
  taskEditor: {
    title: "Tarea",
    newTitle: "Nueva tarea",
    subtitle: "Una nota o tarea tuya para ese día, sin cliente",
    what: "Qué hay que hacer",
    whatPlaceholder: "p. ej. Llamar al almacén, reunión de equipo…",
    delete: "Borrar",
    save: "Guardar",
    add: "Añadir",
    writeWhat: "Escribe qué hay que hacer",
    saved: "Tarea guardada",
    addedOn: "Tarea añadida el {date}",
    deleteText: "La tarea desaparece.",
    deleteTitle: "¿Borrar la tarea?",
    couldNotDelete: "No se ha podido borrar",
    deleted: "Tarea borrada",
    doneTitle: "Tarea hecha",
    done: "Hecha",
    reopen: "Volver a pendiente",
    couldNotChange: "No se ha podido cambiar"
  }
};

// src/app/i18n/es/chunks/agenda/agenda-more.ts
var agendaMore = {
  reschedule: {
    proposal: "Te propongo el próximo día que cada {professional} atiende. Cambia la fecha si quieres o desmarca los que no quieras mover.",
    move: "Mover",
    wasOn: " · era el {date}",
    attends: "Atiende: {days}",
    noDays: "Sin días de atención conocidos",
    leave: "Dejarlas como están",
    moveMarked: "Mover las marcadas",
    moving: "Moviendo…",
    oneMoved: "1 cita movida",
    moved: "{count} citas movidas",
    noneMoved: "No se ha movido ninguna"
  },
  workday: {
    noOpen: "No tienes citas abiertas hoy. Añade citas o planifica una ruta.",
    started: "Jornada iniciada",
    summary: "Tiempo: {time} · Visitadas: {done} de {total}",
    oneOpen: "\n\nTe queda 1 cita abierta. Al terminar te propongo a qué día moverla.",
    open: "\n\nTe quedan {count} citas abiertas. Al terminar te propongo a qué día moverlas.",
    endTitle: "¿Terminar la jornada?",
    end: "Terminar jornada",
    ended: "Jornada terminada · {count} visitadas",
    leftTitle: "Lo que ha quedado pendiente hoy",
    leftText: "{count} sin visitar"
  },
  dayMenu: {
    newAppointment: "Nueva cita",
    addOne: "Añadir {professional} a este día",
    seeDay: "Ver el día",
    seeDayText: "Abrirlo en «Tu día»",
    unblock: "Desbloquear el día",
    unblockText: "Vuelve a estar disponible para planificar",
    block: "Bloquear el día",
    blockText: "Vacaciones, formación, congreso… El planificador no lo usará",
    reason: "Motivo (opcional)",
    blockTitle: "Bloquear el {date}",
    blockOk: "Bloquear",
    couldNotChange: "No se ha podido cambiar",
    blocked: "Día bloqueado",
    unblocked: "Día desbloqueado"
  },
  absent: {
    title: "¿Le buscamos otro día?",
    text: "{name}\n\nEl próximo día que atiende es el {date}.",
    notNow: "Ahora no",
    other: "Elegir otra fecha",
    proposed: "Cita el {date}",
    whichDay: "¿Qué día?",
    newTitle: "Nueva cita",
    create: "Crear cita",
    origin: "No estaba el {date}",
    couldNotCreate: "No se ha podido crear la cita",
    created: "Nueva cita el {date}"
  }
};

// src/app/i18n/es/chunks/agenda/routes-more.ts
var routesMore = {
  agenda: {
    startRoute: "▶ Empezar ruta",
    startRouteTitle: "Inicia la jornada y abre la navegación hacia la primera parada",
    fullRoute: "Ruta completa",
    fullRouteTitle: "Abre todas las paradas del día en el navegador, en orden"
  },
  traffic: {
    calculating: "Calculando…",
    calculate: "Calcular con tráfico",
    calculateTitle: "Una petición al servicio de rutas: horas por las calles y con el tráfico de ahora",
    real: "Con tráfico real",
    realTitle: "Horas calculadas por las calles y con el tráfico de ahora (TomTom)",
    approximate: "{reason}: las horas siguen siendo aproximadas"
  }
};

// src/app/i18n/es/chunks/agenda/index.ts
var texts = { agenda, agendaMore, routesMore };

// src/app/screens/agenda/texts.ts
registerMessages(texts);

// delcos-shared:src/app/legacy/bridge.ts
var shared2 = globalThis["__delcosModules"]["legacy/bridge"];
var pick2 = (name) => shared2[name];
var agendaActions = /* @__PURE__ */ pick2("agendaActions");
var agendaCache = /* @__PURE__ */ pick2("agendaCache");
var agendaSources = /* @__PURE__ */ pick2("agendaSources");
var agendaState = /* @__PURE__ */ pick2("agendaState");
var agendaSuggestions = /* @__PURE__ */ pick2("agendaSuggestions");
var appLegacy = /* @__PURE__ */ pick2("appLegacy");
var appointmentLegacy = /* @__PURE__ */ pick2("appointmentLegacy");
var appointments = /* @__PURE__ */ pick2("appointments");
var cachedRpc = /* @__PURE__ */ pick2("cachedRpc");
var callRpc = /* @__PURE__ */ pick2("callRpc");
var commercialStates = /* @__PURE__ */ pick2("commercialStates");
var currentScreen = /* @__PURE__ */ pick2("currentScreen");
var editorLegacy = /* @__PURE__ */ pick2("editorLegacy");
var goTo = /* @__PURE__ */ pick2("goTo");
var icon = /* @__PURE__ */ pick2("icon");
var initialsOf = /* @__PURE__ */ pick2("initialsOf");
var legacyAgenda = /* @__PURE__ */ pick2("legacyAgenda");
var legacyAgendaPaint = /* @__PURE__ */ pick2("legacyAgendaPaint");
var legacyAgendaParts = /* @__PURE__ */ pick2("legacyAgendaParts");
var legacyDb = /* @__PURE__ */ pick2("legacyDb");
var legacyIcons = /* @__PURE__ */ pick2("legacyIcons");
var notices = /* @__PURE__ */ pick2("notices");
var permissions = /* @__PURE__ */ pick2("permissions");
var reloadAgenda = /* @__PURE__ */ pick2("reloadAgenda");
var salesTeam = /* @__PURE__ */ pick2("salesTeam");
var sidePanel = /* @__PURE__ */ pick2("sidePanel");
var stripState = /* @__PURE__ */ pick2("stripState");
var term = /* @__PURE__ */ pick2("term");
var weekPlanner = /* @__PURE__ */ pick2("weekPlanner");
var yourDayLegacy = /* @__PURE__ */ pick2("yourDayLegacy");

// delcos-shared:src/app/services/dates.ts
var shared3 = globalThis["__delcosModules"]["services/dates"];
var pick3 = (name) => shared3[name];
var addDays = /* @__PURE__ */ pick3("addDays");
var formatDuration = /* @__PURE__ */ pick3("formatDuration");
var formatMinutes = /* @__PURE__ */ pick3("formatMinutes");
var fromIsoDate = /* @__PURE__ */ pick3("fromIsoDate");
var mondayOf = /* @__PURE__ */ pick3("mondayOf");
var toIsoDate = /* @__PURE__ */ pick3("toIsoDate");
var todayIso = /* @__PURE__ */ pick3("todayIso");

// delcos-shared:src/app/services/date-format.ts
var shared4 = globalThis["__delcosModules"]["services/date-format"];
var pick4 = (name) => shared4[name];
var capitalise = /* @__PURE__ */ pick4("capitalise");
var formatDayMonth = /* @__PURE__ */ pick4("formatDayMonth");
var formatLongDate = /* @__PURE__ */ pick4("formatLongDate");
var formatMonth = /* @__PURE__ */ pick4("formatMonth");
var formatMonthYear = /* @__PURE__ */ pick4("formatMonthYear");
var formatShortDate = /* @__PURE__ */ pick4("formatShortDate");
var monthNameOf = /* @__PURE__ */ pick4("monthNameOf");
var shortMonthNames = /* @__PURE__ */ pick4("shortMonthNames");

// delcos-shared:src/app/services/format.ts
var shared5 = globalThis["__delcosModules"]["services/format"];
var pick5 = (name) => shared5[name];
var escapeHtml = /* @__PURE__ */ pick5("escapeHtml");
var formatNumber = /* @__PURE__ */ pick5("formatNumber");

// delcos-shared:src/app/services/values.ts
var shared6 = globalThis["__delcosModules"]["services/values"];
var pick6 = (name) => shared6[name];
var isPresent = /* @__PURE__ */ pick6("isPresent");
var orFallback = /* @__PURE__ */ pick6("orFallback");
var range = /* @__PURE__ */ pick6("range");

// src/app/screens/agenda/month-calendar.ts
var NOT_COUNTED = ["Descartada", "Aplazada"];
var POPOVER_WIDTH = 380;
var PICKER_WIDTH = 280;
var shownMonth = null;
var calendar = () => document.getElementById("agmes");
var monthOf = (isoDate) => isoDate.slice(0, 7);
function lastDayOf(month) {
  const first = /* @__PURE__ */ new Date(`${month}-01T12:00:00`);
  return addDays(toIsoDate(new Date(first.getFullYear(), first.getMonth() + 1, 1)), -1);
}
function shiftMonth(month, months) {
  const date = /* @__PURE__ */ new Date(`${month}-01T12:00:00`);
  date.setMonth(date.getMonth() + months);
  return monthOf(toIsoDate(date));
}
async function appointmentsPerDay(month) {
  const result = await cachedRpc(
    "agenda_rango",
    { p_desde: `${month}-01`, p_hasta: lastDayOf(month), p_usuario: legacyAgenda.userFilter() },
    `agenda-mes-${month}`
  );
  const perDay = /* @__PURE__ */ new Map();
  (result.data ?? []).filter((item) => !NOT_COUNTED.includes(item.estado)).forEach((item) => {
    perDay.set(item.fecha, (perDay.get(item.fecha) ?? 0) + 1);
  });
  return perDay;
}
function dayCell(isoDate, count2, today) {
  const classes = ["agmc", isoDate === today ? "hoy" : "", isoDate < today ? "pasado" : "", count2 ? "con" : ""].filter(Boolean).join(" ");
  const label = t("agenda.month.dayLabel", { date: formatShortDate(isoDate), count: count2 });
  return `<button type="button" class="${classes}" data-agdia="${isoDate}" aria-label="${label}">
        <span>${Number(isoDate.slice(8))}</span>${count2 ? `<i class="agpt">${count2 > 9 ? "9+" : count2}</i>` : ""}</button>`;
}
function gridHtml(month, perDay) {
  const today = todayIso(), first = /* @__PURE__ */ new Date(`${month}-01T12:00:00`);
  const blanks = (first.getDay() + 6) % 7, days = Number(lastDayOf(month).slice(8));
  const header = t("dates.weekdayLetters").split(",").map((letter) => `<span class="agmd">${letter}</span>`).join("");
  const cells = range(days).map((index) => `${month}-${String(index + 1).padStart(2, "0")}`);
  return header + "<span></span>".repeat(blanks) + cells.map((day) => dayCell(day, perDay.get(day) ?? 0, today)).join("");
}
function headerHtml(month, current) {
  return `<button type="button" class="kmv agmnav" data-agm="-1" aria-label="${t("agenda.month.previous")}">‹</button>
    <button type="button" class="agmtit" id="agmtit" aria-label="${t("agenda.month.choose")}">${escapeHtml(capitalise(formatMonth(month)))}</button>
    <button type="button" class="kmv agmnav" data-agm="1" aria-label="${t("agenda.month.next")}">›</button>
    ${month !== current ? `<button type="button" class="btn sec agmhoy" id="agmhoy">${t("agenda.month.today")}</button>` : ""}`;
}
function onClick(element, action) {
  if (element instanceof HTMLElement) element.onclick = (event) => {
    event.stopPropagation();
    action();
  };
}
function bindHeader(box, month, current) {
  box.querySelectorAll("[data-agm]").forEach((button) => {
    onClick(button, () => {
      void renderMonth(shiftMonth(month, Number(button.dataset.agm)));
    });
  });
  onClick(document.getElementById("agmhoy"), () => {
    void renderMonth(current);
  });
  const title = document.getElementById("agmtit");
  onClick(title, () => {
    if (title) openMonthPicker(month, title);
  });
}
function bindDays(box) {
  const selected = legacyAgenda.selectedDate(), today = todayIso();
  box.querySelectorAll(".agmc[data-agdia]").forEach((button) => {
    const day = button.dataset.agdia ?? "";
    button.classList.toggle("sel", day === selected && selected !== today);
    onClick(button, () => {
      legacyAgenda.showDay(day);
    });
  });
}
async function renderMonth(month) {
  const box = calendar();
  if (!box) return;
  const current = monthOf(todayIso()), target = month ?? current;
  shownMonth = target;
  if (orFallback(box.dataset.mes, current) !== target) {
    const perDay = await appointmentsPerDay(target);
    const fresh = calendar();
    if (shownMonth !== target || !fresh) return;
    fresh.dataset.mes = target;
    const grid = fresh.querySelector(".agmesgrid");
    if (grid) grid.innerHTML = gridHtml(target, perDay);
  }
  const box2 = calendar(), header = box2?.querySelector(".fh");
  if (!box2 || !header) return;
  header.classList.add("agmesh");
  header.innerHTML = headerHtml(target, current);
  bindHeader(header, target, current);
  bindDays(box2);
}
function openMonthPicker(month, anchor) {
  document.querySelectorAll(".agmpop").forEach((element) => {
    element.remove();
  });
  let year = Number(month.slice(0, 4));
  const picker = document.createElement("div");
  picker.className = "agmpop";
  const names = shortMonthNames();
  const paint2 = () => {
    picker.innerHTML = `<div class="agmpoph"><button type="button" class="kmv" data-an="-1" aria-label="${t("agenda.month.previousYear")}">‹</button><b>${year}</b>
      <button type="button" class="kmv" data-an="1" aria-label="${t("agenda.month.nextYear")}">›</button></div>
      <div class="agmpopg">${names.map((name, index) => {
      const key = `${year}-${String(index + 1).padStart(2, "0")}`;
      return `<button type="button" data-mk="${key}" class="${key === month ? "on" : ""}">${name}</button>`;
    }).join("")}</div>`;
    picker.querySelectorAll("[data-an]").forEach((button) => {
      onClick(button, () => {
        year += Number(button.dataset.an);
        paint2();
      });
    });
    picker.querySelectorAll("[data-mk]").forEach((button) => {
      onClick(button, () => {
        picker.remove();
        void renderMonth(button.dataset.mk);
      });
    });
  };
  paint2();
  document.body.appendChild(picker);
  const rect = anchor.getBoundingClientRect(), width = Math.min(PICKER_WIDTH, innerWidth - 20);
  picker.style.width = `${width}px`;
  picker.style.left = `${Math.max(10, Math.min(innerWidth - width - 10, rect.left + rect.width / 2 - width / 2))}px`;
  picker.style.top = `${Math.min(innerHeight - picker.offsetHeight - 10, rect.bottom + 6)}px`;
}
function closeMonth() {
  calendar()?.classList.remove("pop");
  document.getElementById("cmesb")?.setAttribute("aria-expanded", "false");
}
async function toggleMonth() {
  let box = calendar();
  if (box?.classList.contains("pop")) {
    closeMonth();
    return;
  }
  if (!box) {
    document.getElementById("v-agenda")?.insertAdjacentHTML("beforeend", '<div class="card agmes" id="agmes"><div class="fh"></div><div class="agmesgrid"></div></div>');
    box = calendar();
  }
  if (!box) return;
  box.dataset.mes = "-";
  await renderMonth(shownMonth ?? monthOf(legacyAgenda.selectedDate() ?? todayIso()));
  const button = document.getElementById("cmesb"), opened = calendar();
  if (!button || !opened) return;
  opened.classList.add("pop");
  button.setAttribute("aria-expanded", "true");
  const rect = button.getBoundingClientRect(), width = Math.min(POPOVER_WIDTH, innerWidth - 32);
  Object.assign(opened.style, { top: `${Math.round(rect.bottom + 8)}px`, left: `${Math.round(Math.max(16, Math.min(rect.left, innerWidth - width - 16)))}px`, bottom: "auto", right: "auto" });
}
function refreshOpenMonth() {
  const box = calendar();
  if (!box?.classList.contains("pop")) return;
  box.dataset.mes = "-";
  void renderMonth(shownMonth);
}

// src/app/screens/agenda/metrics.ts
var count = (value2) => formatNumber(value2 ?? 0);
var decimal = (value2) => value2 === void 0 || value2 === null ? "0" : String(value2).replace(".", ",");
function todayFigures(metrics) {
  const day = legacyAgenda.selectedDate(), today = todayIso();
  if (day === today && legacyAgenda.loadedDay() === day) {
    const active = legacyAgenda.dayAppointments().filter((item) => !appointments.isCancelled(item.estado));
    return { done: formatNumber(active.filter((item) => !appointments.isOpen(item.estado)).length), total: formatNumber(active.length) };
  }
  return { done: count(metrics.hoy?.visitadas), total: count(metrics.hoy?.citas) };
}
function pills(metrics) {
  const { done, total } = todayFigures(metrics);
  const visits = term("visita", { number: "p" }), week = metrics.semana ?? {}, closings = metrics.cierres ?? {}, pending = metrics.pendientes ?? {};
  return [
    ["agenda.metrics.today", `${done}/${total}`, t("agenda.metrics.todayDetail", { done, total, average: decimal(metrics.media_dia), visits }), ""],
    ["agenda.metrics.week", count(week.visitas), t("agenda.metrics.weekDetail", { count: count(week.visitas), visits, average: decimal(week.media) }), ""],
    ["agenda.metrics.closings", count(closings.hoy), t("agenda.metrics.closingsDetail", { count: count(closings.hoy), average: decimal(closings.media_dia) }), ""],
    [
      "agenda.metrics.toVisit",
      count((pending.urgentes ?? 0) + (pending.sin_visita ?? 0)),
      t("agenda.metrics.toVisitDetail", { urgent: count(pending.urgentes), noVisit: count(pending.sin_visita), visit: term("visita") }),
      "agp-pend"
    ]
  ];
}
function metricsHtml() {
  const metrics = legacyAgenda.metrics();
  if (!metrics) return "";
  return pills(metrics).map(([label, figure, detail, className]) => `<span class="agp ${className}" title="${escapeHtml(detail)}">${escapeHtml(t(label))} <b>${escapeHtml(figure)}</b></span>`).join("");
}
function refreshMetrics() {
  const box = document.getElementById("aghud");
  if (!legacyAgenda.isDayView() || !box || !legacyAgenda.metrics()) return;
  const html = metricsHtml();
  if (box.lastHtml !== html) {
    box.innerHTML = html;
    box.lastHtml = html;
  }
}
async function reloadMetrics() {
  if (!legacyAgenda.isDayView()) return;
  const { data } = await callRpc("agenda_metricas", { p_usuario: legacyAgenda.viewedUserId() });
  if (!data || !legacyAgenda.isDayView()) return;
  legacyAgenda.setMetrics(data);
  refreshMetrics();
}

// delcos-shared:src/app/screens/agenda/preload.ts
var shared7 = globalThis["__delcosModules"]["screens/agenda/preload"];
var pick7 = (name) => shared7[name];
var applySuggestions = /* @__PURE__ */ pick7("applySuggestions");
var dayLoads = /* @__PURE__ */ pick7("dayLoads");
var loadSuggestions = /* @__PURE__ */ pick7("loadSuggestions");
var stripLoads = /* @__PURE__ */ pick7("stripLoads");
var weekLoads = /* @__PURE__ */ pick7("weekLoads");
var withData = /* @__PURE__ */ pick7("withData");

// delcos-shared:src/app/screens/routes/index.ts
var shared8 = globalThis["__delcosModules"]["screens/routes/index"];
var pick8 = (name) => shared8[name];
var planFromList = /* @__PURE__ */ pick8("planFromList");
var planWeek = /* @__PURE__ */ pick8("planWeek");
var saveWeekDraft = /* @__PURE__ */ pick8("saveWeekDraft");

// delcos-shared:src/app/legacy/rest-bridge.ts
var shared9 = globalThis["__delcosModules"]["legacy/rest-bridge"];
var pick9 = (name) => shared9[name];
var restLegacy = /* @__PURE__ */ pick9("restLegacy");

// src/app/screens/agenda/day-menu.ts
var EDGE = 10;
var GAP = 6;
function options(isoDate, blocked) {
  const coming = isoDate >= todayIso();
  const block = blocked ? ["desbloquear", "agendaMore.dayMenu.unblock", t("agendaMore.dayMenu.unblockText")] : ["bloquear", "agendaMore.dayMenu.block", t("agendaMore.dayMenu.blockText")];
  return [
    coming ? ["nueva", "agendaMore.dayMenu.newAppointment", t("agendaMore.dayMenu.addOne", { professional: term("medico", { article: "un" }) })] : null,
    ["ver", "agendaMore.dayMenu.seeDay", t("agendaMore.dayMenu.seeDayText")],
    coming ? block : null
  ].filter(isPresent);
}
function place(menu, button) {
  const box = button.getBoundingClientRect();
  menu.style.top = `${Math.min(window.innerHeight - menu.offsetHeight - EDGE, box.bottom + GAP)}px`;
  menu.style.left = `${Math.max(EDGE, Math.min(window.innerWidth - menu.offsetWidth - EDGE, box.right - menu.offsetWidth))}px`;
}
async function setBlocked(isoDate, block) {
  let reason = null;
  if (block) {
    reason = await restLegacy.askText(t("agendaMore.dayMenu.reason"), "", { titulo: t("agendaMore.dayMenu.blockTitle", { date: formatShortDate(isoDate) }), ok: t("agendaMore.dayMenu.blockOk") });
    if (reason === null) return;
  }
  const { data: result, error } = await callRpc("bloquear_dia", { p_fecha: isoDate, p_motivo: reason, p_usuario: agendaSources.ownerId(), p_bloquear: block });
  if (error || result?.ok === false) {
    notices.toast(t("agendaMore.dayMenu.couldNotChange"), true);
    return;
  }
  notices.toast(t(block ? "agendaMore.dayMenu.blocked" : "agendaMore.dayMenu.unblocked"));
  reloadAgenda();
}
function choose(option, isoDate) {
  if (option === "nueva") {
    agendaActions.newAppointment("", isoDate);
    return;
  }
  if (option === "ver") {
    agendaState.setSelectedDate(isoDate);
    agendaState.setMode("dia");
    reloadAgenda();
    return;
  }
  void setBlocked(isoDate, option === "bloquear");
}
function openDayMenu(button, isoDate, blocked) {
  document.querySelectorAll(".tdmenu").forEach((menu2) => {
    menu2.remove();
  });
  const menu = Object.assign(document.createElement("div"), { className: "tdmenu" });
  Reflect.set(menu, "__t", Date.now());
  menu.innerHTML = options(isoDate, blocked).map(([key, title, text]) => `<button data-dmo="${key}"><b>${escapeHtml(t(title))}</b><span>${escapeHtml(text)}</span></button>`).join("");
  document.body.appendChild(menu);
  place(menu, button);
  menu.querySelectorAll("[data-dmo]").forEach((option) => {
    option.onclick = () => {
      menu.remove();
      choose(option.dataset.dmo ?? "", isoDate);
    };
  });
}

// src/app/screens/agenda/open-week.ts
var WEEK_DAYS = 7;
var SHOWN_PER_DAY = 9;
var SHOWN_WITHOUT_DAY = 25;
var NOT_SHOWN = ["Descartada", "Aplazada"];
var firstName = (name) => String(name).split(",")[0] ?? "";
function loadEstimate(day, mine, proposed, data) {
  if (!(mine.some((item) => appointments.isOpen(item.estado)) || proposed.length) || day < data.today) return "";
  const planned = proposed.map((item) => ({ estado: "Planificada", ...data.draft?.horario ?? {}, ...item.cita }));
  const { fin: end, tope: limit } = weekPlanner.estimateDay([...mine, ...planned], day);
  const title = t("agenda.openWeek.estimatedEnd") + (end > limit ? t("agenda.openWeek.overReturn", { time: formatMinutes(limit) }) : "");
  return `<span class="semcarga ${end > limit ? "pasa" : ""}" title="${title}">~${formatMinutes(end)}</span>`;
}
function appointmentChip(item, data) {
  const movable = item.usuario_id === data.owner && appointments.isOpen(item.estado) && item.fecha >= data.today;
  const title = `${escapeHtml(item.nombre)} · ${escapeHtml(item.estado)}${movable ? t("agenda.openWeek.dragToMove") : ""}`;
  const time = item.hora ? `<i>${escapeHtml(String(item.hora).slice(0, 5))}</i>` : "";
  const other = item.usuario_id !== data.owner && item.usuario ? ` <em>${escapeHtml(initialsOf(item.usuario))}</em>` : "";
  return `<span class="semcita" data-semficha="${item.cuenta_id}" ${movable ? `draggable="true" data-semcid="${item.id}"` : ""}
              title="${title}" style="border-left-color:${commercialStates.color(item.estado) ?? "var(--muted)"}">
              ${time}${escapeHtml(firstName(item.nombre))}${other}</span>`;
}
function proposedChip(item) {
  const start = item.ini === null || item.ini === void 0 ? "" : formatMinutes(item.ini);
  return `<span class="semcita nueva" title="${t("agenda.openWeek.proposal", { name: escapeHtml(item.m.nombre) })}${start ? ` · ~${start}` : ""}"><i>~${start}</i>${escapeHtml(firstName(item.m.nombre))}</span>`;
}
function dayColumn(day, data) {
  const all = (data.perDay[day] ?? []).filter((item) => !NOT_SHOWN.includes(item.estado));
  const mine = all.filter((item) => item.usuario_id === data.owner), proposed = data.draft?.dias[day] ?? [];
  const done = all.filter((item) => item.estado === "Visitada").length, date = fromIsoDate(day), reason = data.blocked[day];
  const classes = ["mesdia semdia", day === data.today ? "hoy" : "", date.getDay() === 0 || date.getDay() === 6 ? "finde" : "", reason ? "bloq" : ""].filter(Boolean).join(" ");
  return `<div class="${classes}" data-semdia="${day}" role="button" tabindex="0">
          <div class="semcab"><b>${date.getDate()}</b>${all.length ? `<span class="mespunto">${done}/${all.length}</span>` : ""}${loadEstimate(day, mine, proposed, data)}
            <button class="semmas" data-semmenu="${day}" aria-label="${t("agenda.openWeek.dayOptions", { date: formatShortDate(day) })}" title="${t("agenda.openWeek.dayOptionsTitle")}">⋯</button></div>
          ${reason ? `<span class="sembloq">🚫 ${escapeHtml(reason)}</span>` : ""}
          <div class="semcitas">${all.slice(0, SHOWN_PER_DAY).map((item) => appointmentChip(item, data)).join("")}
            ${proposed.map(proposedChip).join("")}
            ${all.length > SHOWN_PER_DAY ? `<span class="sm">${t("agenda.openWeek.andMore", { count: all.length - SHOWN_PER_DAY })}</span>` : ""}</div>
        </div>`;
}
function draftHtml(draft) {
  const days = Object.keys(draft.dias).filter((day) => draft.dias[day]?.length).length;
  const summary = t("agenda.openWeek.draftSummary", { count: formatNumber(draft.total), visits: term("visita", { number: "p", adjective: "nuevo" }), days }) + (draft.sinDia.length ? t("agenda.openWeek.draftWithoutDay", { count: draft.sinDia.length }) : "");
  return `<div class="semborr">
      <span><b>${t("agenda.openWeek.draft")}</b> · ${summary}</span>
      <span class="acts u-m-0"><button class="btn sec" id="semdescartar">${t("agenda.openWeek.discard")}</button><button class="btn" id="semguardar">${t("agenda.openWeek.save")}</button></span></div>`;
}
function withoutDayHtml(draft) {
  if (!draft?.sinDia.length) return "";
  const rows = draft.sinDia.slice(0, SHOWN_WITHOUT_DAY).map((item) => `<div class="item u-cursor-default"><span class="ic w">!</span>
        <span class="tx"><b>${escapeHtml(item.m.nombre)}</b><span class="sm">${escapeHtml(item.motivo)}${item.m.municipio ? ` · ${escapeHtml(item.m.municipio)}` : ""}</span></span></div>`).join("");
  const more = draft.sinDia.length > SHOWN_WITHOUT_DAY ? `<div class="sm" style="padding:6px 12px">${t("agenda.openWeek.andMore", { count: draft.sinDia.length - SHOWN_WITHOUT_DAY })}</div>` : "";
  return `<div class="planfuera" style="margin:0 16px 16px"><h3>${t("agenda.openWeek.withoutDay", { count: draft.sinDia.length })}</h3>
      <div class="lista">${rows}
        ${more}</div></div>`;
}
function weekHtml(data) {
  const canPlan = data.days.some((day) => day >= data.today) && !data.draft;
  return `
    <div class="semhead"><span class="sm">${t("agenda.openWeek.hint")}</span>
      ${canPlan ? `<button class="btn" id="semplan">${t("agenda.openWeek.share")}</button>` : ""}</div>
    ${data.draft ? draftHtml(data.draft) : ""}
    <div class="semwrap"><div class="mes sem">
      ${t("dates.weekdayLetters").split(",").map((letter) => `<span class="mesdow">${letter}</span>`).join("")}
      ${data.days.map((day) => dayColumn(day, data)).join("")}
    </div></div>
    ${withoutDayHtml(data.draft)}`;
}
async function moveTo(item, day, data) {
  if (item.fecha === day) return;
  if (day < todayIso()) {
    notices.toast(t("agenda.openWeek.notToPast"), true);
    return;
  }
  const warnings = [];
  const reason = data.blocked[day];
  if (reason) warnings.push(t("agenda.openWeek.blockedDay", { reason }));
  const windows = weekPlanner.attendanceWindows(item.dias, day);
  if (windows && !windows.length) warnings.push(t("agenda.openWeek.notAttending"));
  if (warnings.length && !await notices.confirm(`${item.nombre ?? ""}: ${warnings.join(" y ")}.`, { titulo: t("agenda.openWeek.moveAnyway"), ok: t("agenda.openWeek.move") })) return;
  const { data: result, error } = await legacyDb().rpc("estado_cita", { p_id: item.id, p_estado: item.estado, p_fecha: day });
  if (error || result?.ok === false) {
    notices.toast(t("agenda.openWeek.couldNotMove"), true);
    return;
  }
  notices.toast(t("agenda.openWeek.movedTo", { date: formatShortDate(day) }));
  reloadAgenda();
}
function onDayClick(event, column, data) {
  const target = event.target instanceof Element ? event.target : null;
  const menu = target?.closest("[data-semmenu]");
  if (menu) {
    const day = menu.dataset.semmenu ?? "";
    openDayMenu(menu, day, Boolean(data.blocked[day]));
    return;
  }
  if (target?.closest(".semcita.nueva")) return;
  const account = target?.closest("[data-semficha]");
  if (account) {
    agendaActions.openAccount(account.dataset.semficha ?? "");
    return;
  }
  agendaState.setSelectedDate(column.dataset.semdia ?? "");
  agendaState.setMode("dia");
  reloadAgenda();
}
function bindDay(column, data) {
  column.onclick = (event) => {
    onDayClick(event, column, data);
  };
  column.onkeydown = (event) => {
    if (event.key === "Enter") onDayClick(event, column, data);
  };
  column.ondragover = (event) => {
    if (event.dataTransfer?.types.includes("text/cita")) {
      event.preventDefault();
      column.classList.add("sobre");
    }
  };
  column.ondragleave = () => {
    column.classList.remove("sobre");
  };
  column.ondrop = (event) => {
    event.preventDefault();
    column.classList.remove("sobre");
    const id = event.dataTransfer?.getData("text/cita"), item = data.list.find((entry) => entry.id === id);
    if (item) void moveTo(item, column.dataset.semdia ?? "", data);
  };
}
function bind(box, data) {
  const plan = box.querySelector("#semplan");
  if (plan) plan.onclick = () => {
    void planWeek(data.monday, data.days, { ...data.blocked }, data.perDay);
  };
  const discard = box.querySelector("#semdescartar");
  if (discard) discard.onclick = () => {
    weekPlanner.discardDraft();
    reloadAgenda();
  };
  const save3 = box.querySelector("#semguardar");
  if (save3) save3.onclick = () => {
    void saveWeekDraft(save3);
  };
  box.querySelectorAll("[data-semdia]").forEach((column) => {
    bindDay(column, data);
  });
  box.querySelectorAll("[data-semcid]").forEach((chip) => {
    chip.ondragstart = (event) => {
      event.dataTransfer?.setData("text/cita", chip.dataset.semcid ?? "");
      if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
      chip.classList.add("arrastrando");
    };
    chip.ondragend = () => {
      chip.classList.remove("arrastrando");
    };
  });
}
async function weekData() {
  const monday = mondayOf(legacyAgenda.selectedDate() ?? todayIso()), sunday = addDays(monday, WEEK_DAYS - 1), owner = agendaSources.ownerId();
  const [result, blocked] = await Promise.all([
    cachedRpc("agenda_rango", { p_desde: monday, p_hasta: sunday, p_usuario: legacyAgenda.userFilter() }, `agenda-${monday}`),
    legacyAgendaParts.blockedDays(monday, WEEK_DAYS)
  ]);
  const list = result.data ?? [], perDay = {};
  list.forEach((item) => {
    var _a;
    (perDay[_a = item.fecha] ?? (perDay[_a] = [])).push(item);
  });
  const draft = weekPlanner.draft(), ownDraft = draft?.semana === monday && draft.uid === owner ? draft : null;
  return { monday, days: range(WEEK_DAYS).map((index) => addDays(monday, index)), today: todayIso(), owner, list, perDay, blocked, draft: ownDraft };
}
async function render() {
  const strip = document.getElementById("agcinta");
  if (!strip || !stripState.weekOpen()) {
    document.getElementById("agsemexp")?.remove();
    return;
  }
  if (!document.getElementById("agsemexp")) strip.insertAdjacentHTML("beforeend", '<div id="agsemexp" class="agsemexp"></div>');
  if (!document.getElementById("agcuerpo")) return;
  const data = await weekData();
  const box = document.getElementById("agsemexp");
  if (!box || !stripState.weekOpen()) return;
  box.innerHTML = weekHtml(data);
  bind(box, data);
}
function paintOpenWeek() {
  const paint2 = async () => {
    const strip = document.getElementById("agcinta");
    if (!legacyAgenda.isDayView() || !strip || !stripState.weekOpen() || document.getElementById("agsemexp")) {
      await render();
      return;
    }
    strip.insertAdjacentHTML("beforeend", '<div id="agsemexp" class="agsemexp" style="display:none"></div>');
    try {
      await render();
    } finally {
      const box = document.getElementById("agsemexp");
      if (box) box.style.display = "";
    }
  };
  return legacyAgenda.isDayView() ? withData(stripState.weekOpen() ? weekLoads(legacyAgenda.selectedDate()) : [], paint2) : paint2();
}

// src/app/screens/agenda/strip.ts
var STRIP_DAYS = 14;
var WEEK_DAYS2 = 7;
var MAX_DOTS = 6;
var DAY_MS = 864e5;
var hasStrip = () => currentScreen() === "agenda" && legacyAgendaParts.mode() === "dia" && Boolean(document.getElementById("v-agenda"));
function weekTitle(monday, today) {
  const weeks = Math.round((fromIsoDate(monday).getTime() - fromIsoDate(mondayOf(today)).getTime()) / DAY_MS / WEEK_DAYS2);
  if (weeks === 0) return t("agenda.strip.thisWeek");
  if (weeks === 1) return t("agenda.strip.nextWeek");
  if (weeks === -1) return t("agenda.strip.lastWeek");
  return t("agenda.strip.weekOf", { day: fromIsoDate(monday).getDate(), month: monthNameOf(monday) });
}
function dotKind(item, isoDate, today) {
  if (!appointments.isOpen(item.estado)) return "ch";
  return isoDate < today ? "cx" : "cp";
}
function dayButton(isoDate, context) {
  const { today, selected, perDay, blocked } = context;
  const items = perDay.get(isoDate) ?? [], date = fromIsoDate(isoDate), reason = blocked[isoDate];
  const dots = items.slice(0, MAX_DOTS).map((item) => `<i class="${dotKind(item, isoDate, today)}"></i>`).join("") + (items.length > MAX_DOTS ? `<em>+${items.length - MAX_DOTS}</em>` : "");
  const count2 = t(items.length === 1 ? "agenda.strip.oneAppointment" : "agenda.strip.appointments", { count: items.length });
  const classes = ["cdia", isoDate === today ? "hoy" : "", isoDate === selected ? "sel" : "", [0, 6].includes(date.getDay()) ? "finde" : "", reason ? "bloq" : ""].filter(Boolean).join(" ");
  const options2 = isoDate >= today ? `<span class="cdmas" role="button" tabindex="0" aria-label="${t("agenda.strip.dayOptions")}" title="${t("agenda.strip.dayOptions")}">⋯</span>` : "";
  const letter = t("dates.weekdayLetters").split(",")[(date.getDay() + 6) % 7] ?? "";
  return `<div><button type="button" class="${classes}" data-cf="${isoDate}"${reason ? ` data-bloq="${escapeHtml(reason)}"` : ""} aria-label="${escapeHtml(formatLongDate(isoDate))}: ${count2}" title="${count2}">
      <span class="dn">${letter}</span><span class="dd">${date.getDate()}</span><span class="cpts">${dots || "<b></b>"}</span></button>${options2}</div>`;
}
function weekButtonHtml(open) {
  const label = t(open ? "agenda.strip.hideWeek" : "agenda.strip.showWeek");
  return `<button type="button" class="btn sec chico" id="cplan" title="${open ? label : t("agenda.strip.showWeekTitle")}" aria-expanded="${String(open)}">${icon("calendar-days")}<span>${label}</span></button>`;
}
function stripHtml(start, context) {
  const month = capitalise(formatMonthYear(addDays(start, 3)));
  const today = mondayOf(context.today) === start ? "" : `<button type="button" class="btn sec chico" id="choy">${t("agenda.strip.today")}</button>`;
  const weeks = [0, WEEK_DAYS2].map((offset) => `<div class="csem"><span class="csemt">${weekTitle(addDays(start, offset), context.today)}</span><div class="c7">${range(WEEK_DAYS2).map((index) => dayButton(addDays(start, offset + index), context)).join("")}</div></div>`).join("");
  return `<div class="cinta" id="agcinta" data-ini="${start}"><div class="ccab">
      <div class="cnav"><button type="button" class="kmv" data-cm="-7" aria-label="${t("agenda.strip.previousWeekNav")}" title="${t("agenda.strip.previousWeekNav")}">‹</button><button type="button" id="cmesb" class="cmesb" aria-expanded="false" title="${t("agenda.strip.seeMonth")}">${escapeHtml(month)} <span aria-hidden="true">▾</span></button><button type="button" class="kmv" data-cm="7" aria-label="${t("agenda.strip.nextWeekNav")}" title="${t("agenda.strip.nextWeekNav")}">›</button>${today}</div>
      <div class="cley" aria-hidden="true"><span><i class="ch"></i>${t("agenda.strip.done")}</span><span><i class="cp"></i>${t("agenda.strip.toDo")}</span><span><i class="cx"></i>${t("agenda.strip.notClosed")}</span></div>
      ${weekButtonHtml(stripState.weekOpen())}</div>
    <div class="csems">${weeks}</div></div>`;
}
function perDayOf(list, owner) {
  const days = /* @__PURE__ */ new Map();
  list.filter((item) => item.usuario_id === owner && !appointments.isCancelled(item.estado)).forEach((item) => {
    days.set(item.fecha, [...days.get(item.fecha) ?? [], item]);
  });
  return days;
}
function bindWeekButton() {
  const button = document.getElementById("cplan");
  if (!button) return;
  const open = Boolean(document.getElementById("agsemexp")), label = t(open ? "agenda.strip.hideWeek" : "agenda.strip.showWeek");
  button.innerHTML = `${icon("calendar-days")}<span>${label}</span>`;
  button.title = open ? label : t("agenda.strip.showWeekTitle");
  button.setAttribute("aria-expanded", String(open));
  button.onclick = async (event) => {
    event.stopPropagation();
    event.preventDefault();
    if (button.dataset.ocupado) return;
    button.dataset.ocupado = "1";
    stripState.setWeekOpen(!open);
    try {
      await paintOpenWeek();
    } finally {
      delete button.dataset.ocupado;
      bindWeekButton();
    }
  };
}
function bindDayOptions(strip) {
  strip.querySelectorAll(".cdmas").forEach((options2) => {
    const day = options2.parentElement?.querySelector("[data-cf]");
    const open = (event) => {
      event.stopPropagation();
      event.preventDefault();
      openDayMenu(options2, day?.dataset.cf ?? "", Boolean(day?.classList.contains("bloq")));
    };
    options2.addEventListener("click", open, true);
    options2.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") open(event);
    });
  });
}
function bind2(strip) {
  strip.querySelectorAll("[data-cf]").forEach((day) => {
    day.onclick = () => {
      closeMonth();
      strip.querySelectorAll(".cdia").forEach((other) => other.classList.toggle("sel", other === day));
      legacyAgenda.showDay(day.dataset.cf ?? "");
    };
  });
  strip.querySelectorAll("[data-cm]").forEach((arrow) => {
    arrow.onclick = () => {
      stripState.setStart(addDays(stripState.start() ?? mondayOf(todayIso()), Number(arrow.dataset.cm)));
      void paintStrip();
    };
  });
  const month = document.getElementById("cmesb");
  if (month) month.onclick = (event) => {
    event.stopPropagation();
    void toggleMonth();
  };
  const today = document.getElementById("choy");
  if (today) today.onclick = () => {
    stripState.setStart(null);
    legacyAgenda.showDay(todayIso());
  };
  bindDayOptions(strip);
}
async function render2() {
  if (!hasStrip() || !document.getElementById("agcuerpo")) return;
  const today = todayIso(), start = stripState.start() ?? mondayOf(legacyAgenda.selectedDate() ?? today), owner = agendaSources.ownerId();
  stripState.setStart(start);
  const end = addDays(start, STRIP_DAYS - 1);
  const [result, blocked] = await Promise.all([
    cachedRpc("agenda_rango", { p_desde: start, p_hasta: end, p_usuario: owner }, `agenda-cinta-${owner}-${start}`),
    legacyAgendaParts.blockedDays(start, STRIP_DAYS)
  ]);
  const body = document.getElementById("agcuerpo");
  if (!hasStrip() || stripState.start() !== start || !body) return;
  const html = stripHtml(start, { today, selected: legacyAgenda.selectedDate(), perDay: perDayOf(result.data ?? [], owner), blocked });
  const old = document.getElementById("agcinta");
  if (old) old.outerHTML = html;
  else body.insertAdjacentHTML("beforebegin", html);
  const strip = document.getElementById("agcinta");
  if (!strip) return;
  bind2(strip);
  showSelectedWeek(strip, start);
}
function showSelectedWeek(strip, start) {
  const weeks = strip.querySelector(".csems"), selected = legacyAgenda.selectedDate();
  if (weeks && selected && selected >= addDays(start, WEEK_DAYS2)) weeks.scrollLeft = weeks.scrollWidth;
}
function paintStrip() {
  if (!legacyAgenda.isDayView()) return Promise.resolve();
  if (!stripState.start()) stripState.setStart(mondayOf(legacyAgenda.selectedDate() ?? todayIso()));
  return withData([...stripLoads(), ...stripState.weekOpen() ? weekLoads(legacyAgenda.selectedDate()) : []], async () => {
    await render2();
    if (!legacyAgenda.isDayView() || !document.getElementById("agcinta")) return;
    if (stripState.weekOpen()) await paintOpenWeek();
    bindWeekButton();
  });
}
async function shareWeek() {
  stripState.setWeekOpen(true);
  await paintOpenWeek();
  bindWeekButton();
  const plan = document.getElementById("semplan");
  if (plan) {
    document.getElementById("agsemexp")?.scrollIntoView({ behavior: "smooth", block: "start" });
    plan.click();
  }
}

// src/app/screens/agenda/week-sidebar.ts
var SHOWN_PER_DAY2 = 3;
var WEEK_DAYS3 = 7;
var timeOf = (item) => String(item.hora ?? "");
function byDay(list) {
  const days = /* @__PURE__ */ new Map();
  list.filter((item) => !appointments.isCancelled(item.estado)).forEach((item) => {
    days.set(item.fecha, [...days.get(item.fecha) ?? [], item]);
  });
  days.forEach((items) => items.sort((first, second) => timeOf(first).localeCompare(timeOf(second))));
  return days;
}
function dayContent(items, blockedReason) {
  const blocked = blockedReason ? `<span class="agslb">${escapeHtml(blockedReason)}</span>` : "";
  const shown = items.slice(0, SHOWN_PER_DAY2).map((item) => `<span class="agslx"><b>${escapeHtml(timeOf(item).slice(0, 5))}</b>${escapeHtml(orFallback(item.medico, item.nombre ?? ""))}</span>`).join("");
  const more = items.length > SHOWN_PER_DAY2 ? `<span class="agslv">${t("agenda.week.andMore", { count: items.length - SHOWN_PER_DAY2 })}</span>` : "";
  const free = !items.length && !blockedReason ? `<span class="agslv">${t("agenda.week.free")}</span>` : "";
  return blocked + shown + more + free;
}
function dayHtml(isoDate, items, context) {
  const date = fromIsoDate(isoDate), blockedReason = context.blocked[isoDate];
  const classes = ["agsld", isoDate === context.today ? "hoy" : "", isoDate === context.selected ? "sel" : "", blockedReason ? "bloq" : ""].filter(Boolean).join(" ");
  const weekday = t("dates.weekdaysShort").split(",")[date.getDay()] ?? "";
  const menu = isoDate >= context.today ? `<button type="button" class="agslm" data-agslm="${isoDate}" aria-label="${t("agenda.week.dayOptions", { date: formatShortDate(isoDate) })}">⋯</button>` : "";
  return `<div><div class="${classes}" data-agsl="${isoDate}" role="button" tabindex="0" aria-label="${t("agenda.week.seeDay", { date: formatShortDate(isoDate) })}">
        <span class="agslf">${date.getDate()}<small>${weekday}</small></span>
        <span class="agslc">${dayContent(items, blockedReason)}</span>
        <span></span></div>${menu}</div>`;
}
function bind3(box, blocked) {
  box.querySelectorAll("[data-agslm]").forEach((button) => {
    button.onclick = (event) => {
      event.stopPropagation();
      const day = button.dataset.agslm ?? "";
      openDayMenu(button, day, Boolean(blocked[day]));
    };
  });
  box.querySelectorAll("[data-agsl]").forEach((day) => {
    const show2 = () => {
      legacyAgenda.showDay(day.dataset.agsl ?? "");
    };
    day.onclick = show2;
    day.onkeydown = (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        show2();
      }
    };
  });
  const share = document.getElementById("agslrep");
  if (share) share.onclick = () => {
    void shareWeek();
  };
}
function sidebarBox() {
  const existing = document.getElementById("agsemlat");
  if (existing) return existing;
  document.getElementById("agcuerpo")?.insertAdjacentHTML("afterend", '<div class="card" id="agsemlat"></div>');
  return document.getElementById("agsemlat");
}
async function paint() {
  if (currentScreen() !== "agenda" || legacyAgendaParts.mode() !== "dia") return;
  if (!document.getElementById("v-agenda")?.classList.contains("agcinta")) return;
  const box = sidebarBox();
  if (!box) return;
  const today = todayIso(), selected = legacyAgenda.selectedDate(), monday = mondayOf(selected ?? today);
  const [result, blocked] = await Promise.all([
    cachedRpc("agenda_rango", { p_desde: monday, p_hasta: addDays(monday, WEEK_DAYS3 - 1), p_usuario: legacyAgenda.userFilter() }, `agenda-${monday}`),
    legacyAgendaParts.blockedDays(monday, WEEK_DAYS3)
  ]);
  if (!document.getElementById("agsemlat")) return;
  const days = range(WEEK_DAYS3).map((index) => addDays(monday, index)), perDay = byDay(result.data ?? []);
  const context = { today, selected, blocked };
  box.innerHTML = `<h2>${t("agenda.week.title")}</h2><p class="sm agslnota">${t("agenda.week.hint")}</p>
    <div class="agsl">${days.map((day) => dayHtml(day, perDay.get(day) ?? [], context)).join("")}</div>
    ${days.some((day) => day >= today) ? `<div class="acts agslacts"><button type="button" class="btn sec" id="agslrep">${t("agenda.week.share")}</button></div>` : ""}`;
  bind3(box, blocked);
}
function paintWeekSidebar() {
  return legacyAgenda.isDayView() ? withData(weekLoads(legacyAgenda.selectedDate()), paint) : paint();
}

// delcos-shared:src/app/screens/agenda/same-centre.ts
var shared10 = globalThis["__delcosModules"]["screens/agenda/same-centre"];
var pick10 = (name) => shared10[name];
var paintSameCentre = /* @__PURE__ */ pick10("paintSameCentre");
var withAppointmentToday = /* @__PURE__ */ pick10("withAppointmentToday");

// delcos-shared:src/app/screens/routes/day-bar.ts
var shared11 = globalThis["__delcosModules"]["screens/routes/day-bar"];
var pick11 = (name) => shared11[name];
var paintRouteBar = /* @__PURE__ */ pick11("paintRouteBar");

// delcos-shared:src/app/screens/accounts/timetable.ts
var shared12 = globalThis["__delcosModules"]["screens/accounts/timetable"];
var pick12 = (name) => shared12[name];
var nextAttendanceDay = /* @__PURE__ */ pick12("nextAttendanceDay");
var withTimetables = /* @__PURE__ */ pick12("withTimetables");

// src/app/screens/agenda/reschedule.ts
async function proposals(list) {
  const timetables = await withTimetables(list.map((item) => ({ id: item.cuenta_id ?? "", ..."dias" in item ? { dias: item.dias } : {} })));
  const days = new Map(timetables.map((entry) => [entry.id, entry.dias ?? {}]));
  const today = todayIso();
  return list.map((item) => {
    const attendance = days.get(item.cuenta_id ?? "") ?? {};
    return {
      item,
      day: nextAttendanceDay(attendance, item.fecha > today ? item.fecha : today),
      attends: Object.keys(attendance).filter((key) => attendance[key]).join(" ")
    };
  });
}
function rowHtml(row2, index, today) {
  const place2 = escapeHtml([row2.item.centro_nombre, row2.item.municipio].filter(Boolean).join(" · "));
  return `<div class="item u-cursor-default">
        <input type="checkbox" data-rpi="${index}" checked aria-label="${t("agendaMore.reschedule.move")}">
        <span class="tx"><b>${escapeHtml(row2.item.nombre ?? "")}</b>
          <span class="sm">${place2}${row2.item.fecha < today ? t("agendaMore.reschedule.wasOn", { date: formatShortDate(row2.item.fecha) }) : ""}</span>
          <span class="sm">${row2.attends ? t("agendaMore.reschedule.attends", { days: escapeHtml(row2.attends) }) : t("agendaMore.reschedule.noDays")}</span></span>
        <input type="date" data-rpf="${index}" value="${row2.day}" min="${today}"></div>`;
}
function windowHtml(rows, title, text) {
  const today = todayIso();
  return `
      <div class="fh"><div><h2>${escapeHtml(title)}</h2><div class="sm">${escapeHtml(text)}</div></div>
        <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>
      <p class="sm">${t("agendaMore.reschedule.proposal", { professional: term("medico") })}</p>
      <div class="lista reprog" data-nosucio>${rows.map((row2, index) => rowHtml(row2, index, today)).join("")}</div>
      <div class="acts u-end">
        <button class="btn sec" id="rpno">${t("agendaMore.reschedule.leave")}</button>
        <button class="btn" id="rpok">${t("agendaMore.reschedule.moveMarked")}</button></div>`;
}
async function moveTicked(body, rows) {
  let moved = 0;
  for (const [index, row2] of rows.entries()) {
    if (!body.querySelector(`[data-rpi="${index}"]`)?.checked) continue;
    const day = body.querySelector(`[data-rpf="${index}"]`)?.value;
    if (!day) continue;
    const { data: result } = await legacyDb().rpc("aplazar_cita", { p_id: row2.item.id, p_fecha: day, p_hora: null, p_origen: "Reprogramada" });
    if (result?.ok) moved++;
  }
  return moved;
}
var movedText = (count2) => {
  if (!count2) return t("agendaMore.reschedule.noneMoved");
  return count2 === 1 ? t("agendaMore.reschedule.oneMoved") : t("agendaMore.reschedule.moved", { count: count2 });
};
async function rescheduleAppointments(list, title, text) {
  if (!list.length) return false;
  const rows = await proposals(list);
  const body = document.getElementById("dbody"), box = document.getElementById("dlg");
  if (!body || !box) return false;
  return new Promise((resolve) => {
    body.innerHTML = windowHtml(rows, title, text);
    const close2 = (moved) => {
      box.close();
      resolve(moved);
    };
    const leave = document.getElementById("rpno");
    if (leave) leave.onclick = () => {
      close2(false);
    };
    const ok = document.getElementById("rpok");
    if (ok) ok.onclick = async () => {
      ok.disabled = true;
      ok.textContent = t("agendaMore.reschedule.moving");
      const moved = await moveTicked(body, rows);
      notices.toast(movedText(moved));
      close2(moved > 0);
      reloadAgenda();
      restLegacy.reloadHome();
      void paintRouteBar();
    };
    box.showModal();
  });
}

// src/app/screens/agenda/trays.ts
var CONTEXT_PREFIX = "agband-";
var ROUTES_MOUNT_MS = 60;
function dueList() {
  const suggestions = agendaSuggestions.forDay();
  if (!suggestions || suggestions.fecha !== legacyAgenda.selectedDate()) return [];
  const already = withAppointmentToday();
  return suggestions.toca.filter((account) => !already.has(account.id ?? account.cuenta_id));
}
function putBackToTodayFirst(actions) {
  const backToToday = document.getElementById("agahoy");
  if (backToToday && !matchMedia("(min-width: 761px)").matches && actions.firstElementChild !== backToToday) actions.prepend(backToToday);
}
function trayButtonsHtml(due, pending, inActions) {
  const pendingLabel = t(inActions ? "agenda.trays.pendingShort" : "agenda.trays.pending");
  return `<div class="agband${inActions ? " agbandin" : ""}" id="agband">` + (due ? `<button type="button" data-agbd="toca">${icon("target")} ${t("agenda.trays.due", { visit: term("visita") })} <b>${due}</b></button>` : "") + (pending ? `<button type="button" class="urg" data-agbd="pend">${icon("circle-alert")} ${pendingLabel} <b>${pending}</b></button>` : "") + "</div>";
}
function paintTrayButtons() {
  const header = document.querySelector("#agcuerpo .tdhead");
  if (!header) return;
  document.getElementById("agband")?.remove();
  const due = dueList().length, pending = agendaSuggestions.pending().length;
  const actions = document.querySelector("#agcuerpo .tdhead .acts");
  if (actions) putBackToTodayFirst(actions);
  if (!due && !pending) return;
  const html = trayButtonsHtml(due, pending, Boolean(actions));
  if (actions) actions.insertAdjacentHTML("beforeend", html);
  else header.insertAdjacentHTML("afterend", html);
  document.getElementById("agband")?.querySelectorAll("[data-agbd]").forEach((button) => {
    button.onclick = () => {
      openTray(button.dataset.agbd === "toca" ? "toca" : "pend");
    };
  });
}
function dueRow(account) {
  const visit = term("visita"), id = account.id ?? "";
  const days = isPresent(account.dias_sin_visita) ? t("agenda.trays.daysWithout", { days: account.dias_sin_visita, visit }) : t("agenda.trays.neverVisited");
  return `<div class="item u-cursor-default"><span class="ic">${icon("target")}</span>
        <span class="tx"><b>${escapeHtml(account.nombre)}</b><span class="sm">${escapeHtml([account.estado_comercial, days, account.municipio].filter(Boolean).join(" · "))}</span></span>
        <span class="acts u-m-0"><button class="btn sec" data-agbf="${id}">${t("agenda.trays.card")}</button><button class="btn sec" data-agbc="${id}">${t("agenda.trays.addAppointment")}</button></span></div>`;
}
function pendingRow(item) {
  return `<div class="item u-cursor-default"><span class="ic w">!</span>
        <span class="tx"><b>${escapeHtml(item.nombre)}</b><span class="sm">${formatShortDate(item.fecha)}${item.centro_nombre ? ` · ${escapeHtml(item.centro_nombre)}` : ""}</span></span>
        <span class="acts u-m-0"><button class="btn sec" data-cita="hoy|${item.id}">${t("agenda.trays.moveToToday")}</button><button class="btn sec" data-cita="desc|${item.id}">${t("agenda.trays.discard")}</button></span></div>`;
}
function trayHtml(tray, due, pending) {
  const isDue = tray === "toca";
  const title = isDue ? t("agenda.trays.due", { visit: term("visita") }) : t("agenda.trays.pending");
  const text = isDue ? t("agenda.trays.dueText", { professional: term("medico") }) : t("agenda.trays.pendingText");
  const action = isDue ? due.some((account) => account.lat) ? `<button class="btn sec" id="agbruta">${t("agenda.trays.planRoute")}</button>` : "" : pending.length ? `<button class="btn sec" id="agbrepro">${t("agenda.trays.rescheduleAll")}</button>` : "";
  const rows = isDue ? due.map(dueRow).join("") : pending.map(pendingRow).join("");
  return `<div class="tbox"><div class="fh"><h2>${escapeHtml(title)}</h2><button class="x" id="tclose" aria-label="${t("common.close")}">✕</button></div><p class="sm">${escapeHtml(text)}</p>
    <div class="acts" style="margin:8px 0">${action}</div>
    <div class="agbdc"><div class="lista">${rows || `<div class="vacio">${t("agenda.trays.nothingPending")}</div>`}</div></div></div>`;
}
function bindTray(panel, due, pending) {
  const close2 = () => {
    panel.classList.remove("abierto");
  };
  const closeButton = document.getElementById("tclose");
  if (closeButton) closeButton.onclick = close2;
  panel.querySelectorAll("[data-agbf]").forEach((button) => {
    button.onclick = () => {
      agendaActions.openAccount(button.dataset.agbf ?? "");
    };
  });
  panel.querySelectorAll("[data-agbc]").forEach((button) => {
    button.onclick = () => {
      agendaActions.newAppointment(button.dataset.agbc ?? "", legacyAgenda.selectedDate());
    };
  });
  const route = document.getElementById("agbruta");
  if (route) route.onclick = () => {
    close2();
    goTo("rutas");
    setTimeout(() => {
      void planFromList(due, "toca", route);
    }, ROUTES_MOUNT_MS);
  };
  const reschedule = document.getElementById("agbrepro");
  if (reschedule) reschedule.onclick = () => {
    void rescheduleAppointments(pending, t("agenda.trays.pending"), t("agenda.trays.notVisited", { count: pending.length }));
  };
}
function openTray(tray) {
  if (!legacyAgenda.isDayView()) return;
  const panel = document.getElementById("tools");
  if (!panel) return;
  const due = tray === "toca" ? dueList() : [], pending = tray === "pend" ? agendaSuggestions.pending() : [];
  panel.innerHTML = trayHtml(tray, due, pending);
  bindTray(panel, due, pending);
  sidePanel.setContext(CONTEXT_PREFIX + tray);
  panel.classList.add("abierto");
}
function refreshOpenTray() {
  const context = sidePanel.context() ?? "";
  if (document.getElementById("tools")?.classList.contains("abierto") && context.startsWith(CONTEXT_PREFIX)) openTray(context.slice(CONTEXT_PREFIX.length) === "toca" ? "toca" : "pend");
}

// src/app/screens/agenda/team.ts
function selectorHtml() {
  const me = salesTeam.currentUserId(), viewed = agendaState.viewed();
  const options2 = salesTeam.members().filter((member) => member.id !== me).map((member) => `<option value="${member.id}" ${viewed?.id === member.id ? "selected" : ""}>${escapeHtml(member.nombre)}</option>`).join("");
  return `<select id="agvista" aria-label="${t("agenda.team.agendaOf")}" title="${t("agenda.team.seeOthers")}">
        <option value="">${t("agenda.team.myAgenda")}</option>${options2}</select>`;
}
function ensureTeamControls() {
  if (currentScreen() !== "agenda" || !permissions.seesEverything()) return;
  const actions = document.querySelector("#v-agenda > .saludo .acts");
  if (!actions) return;
  let selector = actions.querySelector("#agvista");
  if (!selector) {
    if (!salesTeam.members().length) {
      void salesTeam.load().then(ensureTeamControls);
      return;
    }
    actions.insertAdjacentHTML("afterbegin", selectorHtml());
    selector = actions.querySelector("#agvista");
    if (selector) selector.onchange = () => {
      salesTeam.showAgendaOf(selector?.value ?? "");
    };
  }
  let button = actions.querySelector('[data-ag="equipo"]');
  if (!button) {
    selector?.insertAdjacentHTML("afterend", `<button class="btn sec" data-ag="equipo">${t("agenda.team.team")}</button>`);
    button = actions.querySelector('[data-ag="equipo"]');
  }
  if (!button) return;
  const teamView = legacyAgendaParts.mode() === "equipo";
  button.textContent = t(teamView ? "agenda.team.myAgenda" : "agenda.team.team");
  button.classList.toggle("sec", !teamView);
  button.title = t(teamView ? "agenda.team.backToMine" : "agenda.team.seeTeam");
}
async function loadTeamView() {
  const view = document.getElementById("v-agenda");
  if (permissions.seesEverything() && !salesTeam.members().length) await salesTeam.load().catch(() => void 0);
  if (currentScreen() !== "agenda" || legacyAgendaParts.mode() !== "equipo" || !view) return;
  view.classList.remove("agunida", "agcinta", "agb", "agn");
  view.innerHTML = `<div class="saludo"><div><h1>${t("agenda.title")}</h1><div class="fecha" id="agtit">${t("agenda.team.title")}</div></div><div class="acts u-m-0"></div></div>
    <div class="card" id="agcuerpo"></div>`;
  ensureTeamControls();
  await legacyAgendaPaint.team();
  view.dataset.listo = "1";
}

// src/app/screens/agenda/day-view.ts
var STRIP_DAYS2 = 14;
var SCROLL_MARGIN = 90;
var SCROLL_TOP_LIMIT = 80;
var SCROLL_BOTTOM_RATIO = 0.6;
var agendaView = () => document.getElementById("v-agenda");
var dayBody = () => document.getElementById("agcuerpo");
function titleText() {
  const viewed = agendaState.viewed();
  return t("agenda.todayTitle", { date: formatLongDate(todayIso()) }) + (viewed && legacyAgenda.isDayView() ? t("agenda.agendaOf", { name: viewed.nombre }) : "");
}
function markEmptyDay() {
  const body = dayBody();
  if (!body || currentScreen() !== "agenda") return;
  const empty = body.querySelector(":scope > .vacio"), stats = body.querySelector(".tdhead .tdstats");
  stats?.classList.toggle("hide", Boolean(empty) && !body.querySelector(".tdesc"));
  if (!empty) return;
  empty.classList.add("vlinea");
  const selected = legacyAgenda.selectedDate();
  if (selected && selected < todayIso()) empty.textContent = t("agenda.noAppointmentsThatDay");
}
function markSelectedDay() {
  const view = agendaView();
  if (!view?.classList.contains("agunida")) return;
  const today = todayIso(), selected = legacyAgenda.selectedDate();
  const title = document.getElementById("agtit");
  if (title) title.textContent = titleText();
  const heading = view.querySelector("#agcuerpo .tdhead h2");
  if (!heading) return;
  let back = document.getElementById("agahoy");
  if (!selected || selected === today) {
    back?.remove();
    return;
  }
  heading.textContent = capitalise(formatLongDate(selected));
  back ?? (back = addBackToToday(heading));
  if (back) putFirstOnMobile(view, back);
  heading.parentElement?.classList.add("agtitdia");
}
function putFirstOnMobile(view, back) {
  const actions = !matchMedia("(min-width: 761px)").matches && view.querySelector("#agcuerpo .tdhead .acts");
  if (actions && actions.firstElementChild !== back) actions.prepend(back);
}
function addBackToToday(heading) {
  heading.insertAdjacentHTML("afterend", `<button type="button" class="btn sec" id="agahoy">${t("agenda.backToToday")}</button>`);
  const back = document.getElementById("agahoy");
  if (back) back.onclick = () => {
    void showDay(todayIso());
  };
  return back;
}
function headerHtml2() {
  return `
      <div class="saludo"><div><h1>${t("agenda.title")}</h1><div class="fecha" id="agtit">${escapeHtml(titleText())}</div></div>
        <div class="aghud" id="aghud" role="group" aria-label="${t("agenda.yourNumbers")}">${metricsHtml()}</div>
        <div class="acts u-m-0"><button class="btn" data-ag="nueva">${t("agenda.newAppointment")}</button></div></div>
      <div class="card" id="agcuerpo"></div>
      <div class="card" id="agsemlat"></div>`;
}
function dayToShow() {
  const today = todayIso(), selected = legacyAgenda.selectedDate(), lastToday = agendaState.lastTodaySeen();
  const day = !selected || selected === lastToday && lastToday !== today ? today : selected;
  agendaState.setSelectedDate(day);
  if (day === today) agendaState.setLastTodaySeen(day);
  return day;
}
async function loadDayView() {
  const view = agendaView();
  if (!view) return;
  const day = dayToShow();
  agendaState.forgetDayTasks();
  stripState.setStart(mondayOf(day));
  view.dataset.listo = "";
  const scroll = scrollY, same = view.classList.contains("agn") && dayBody();
  if (same) dayBody()?.classList.add("agcargando");
  let suggestions = null, metrics = null;
  await withData([
    ...dayLoads(day),
    loadSuggestions(day).then((found) => {
      suggestions = found;
    }),
    Promise.resolve(callRpc("agenda_metricas", { p_usuario: legacyAgenda.viewedUserId() })).then((result) => {
      metrics = result.data;
    }),
    ...stripLoads(),
    ...weekLoads(day),
    permissions.seesEverything() && !salesTeam.members().length ? salesTeam.load() : null
  ], async () => {
    if (legacyAgenda.selectedDate() !== day || currentScreen() !== "agenda" || legacyAgendaParts.mode() !== "dia") return;
    if (metrics) legacyAgenda.setMetrics(metrics);
    applySuggestions(day, suggestions);
    view.classList.add("agunida", "agcinta", "agb", "agn");
    view.innerHTML = headerHtml2();
    ensureTeamControls();
    await Promise.all([legacyAgendaPaint.yourDay(), paintStrip(), paintWeekSidebar()]);
    markSelectedDay();
    markEmptyDay();
    if (!agendaState.viewed()) legacyAgendaPaint.noStartWarning(dayBody());
    if (same) window.scrollTo(0, scroll);
    view.dataset.listo = "1";
    refreshOpenTray();
  });
}
async function loadAgenda() {
  if (currentScreen() !== "agenda" || !agendaView()) return;
  const mode = legacyAgendaParts.mode();
  if (mode === "equipo") {
    await loadTeamView();
    return;
  }
  const plan = agendaState.takeWeekPlanRequest();
  if (mode === "semana") stripState.setWeekOpen(true);
  agendaState.setMode("dia");
  await loadDayView();
  if (mode === "mes") void toggleMonth();
  if (plan) void shareWeek();
}
function scrollToDay() {
  const body = dayBody();
  if (!body) return;
  const top = body.getBoundingClientRect().top;
  if (top < SCROLL_TOP_LIMIT || top > innerHeight * SCROLL_BOTTOM_RATIO) scrollTo({ top: scrollY + top - SCROLL_MARGIN, behavior: "smooth" });
}
async function showDay(day) {
  document.querySelectorAll(".agpop").forEach((element) => {
    element.remove();
  });
  closeMonth();
  if (!day) return;
  if (!legacyAgenda.isDayView()) {
    agendaState.setMode("dia");
    agendaState.setSelectedDate(day);
    await loadAgenda();
    return;
  }
  const before = legacyAgenda.selectedDate() ?? day, start = stripState.start();
  agendaState.setSelectedDate(day);
  dayBody()?.classList.add("agcargando");
  const outside = !start || day < start || day > addDays(start, STRIP_DAYS2 - 1);
  if (outside) stripState.setStart(mondayOf(day));
  const otherWeek = mondayOf(day) !== mondayOf(before);
  let suggestions = null;
  try {
    await withData([...dayLoads(day), loadSuggestions(day).then((found) => {
      suggestions = found;
    }), ...outside ? stripLoads() : [], ...weekLoads(day)], async () => {
      if (legacyAgenda.selectedDate() !== day || !legacyAgenda.isDayView()) return;
      applySuggestions(day, suggestions);
      const pieces = [legacyAgendaPaint.yourDay(), paintWeekSidebar()];
      if (outside || otherWeek && stripState.weekOpen()) pieces.push(paintStrip());
      await Promise.all(pieces);
      if (!outside) document.querySelectorAll("#agcinta .cdia").forEach((element) => {
        element.classList.toggle("sel", element.dataset.cf === day);
      });
      markSelectedDay();
      markEmptyDay();
      refreshMetrics();
    });
  } finally {
    dayBody()?.classList.remove("agcargando");
  }
  if (legacyAgenda.selectedDate() === day) scrollToDay();
}
function refreshAfterChange() {
  if (!legacyAgenda.isDayView()) return;
  const day = legacyAgenda.selectedDate() ?? todayIso();
  let suggestions = null;
  void reloadMetrics();
  void withData([...stripLoads(), ...weekLoads(day), loadSuggestions(day).then((found) => {
    suggestions = found;
  })], async () => {
    if (legacyAgenda.selectedDate() !== day || !legacyAgenda.isDayView()) return;
    applySuggestions(day, suggestions);
    await Promise.all([paintStrip(), paintWeekSidebar()]);
    paintSameCentre();
    paintTrayButtons();
  });
  refreshOpenMonth();
}

// delcos-shared:src/app/screens/agenda/appointment-state.ts
var shared13 = globalThis["__delcosModules"]["screens/agenda/appointment-state"];
var pick13 = (name) => shared13[name];
var STATES = /* @__PURE__ */ pick13("STATES");
var canPlanAgain = /* @__PURE__ */ pick13("canPlanAgain");
var isAbsent = /* @__PURE__ */ pick13("isAbsent");
var isCancelled = /* @__PURE__ */ pick13("isCancelled");
var isDone = /* @__PURE__ */ pick13("isDone");
var isOpen = /* @__PURE__ */ pick13("isOpen");
var pointOf = /* @__PURE__ */ pick13("pointOf");
var statePill = /* @__PURE__ */ pick13("statePill");

// delcos-shared:src/app/screens/agenda/appointment-options.ts
var shared14 = globalThis["__delcosModules"]["screens/agenda/appointment-options"];
var pick14 = (name) => shared14[name];
var hasMenu = /* @__PURE__ */ pick14("hasMenu");
var menuOptions = /* @__PURE__ */ pick14("menuOptions");

// delcos-shared:src/app/screens/agenda/appointment-origin.ts
var shared15 = globalThis["__delcosModules"]["screens/agenda/appointment-origin"];
var pick15 = (name) => shared15[name];
var appointmentDay = /* @__PURE__ */ pick15("appointmentDay");
var originText = /* @__PURE__ */ pick15("originText");

// src/app/screens/agenda/your-day/card.ts
var DAY_MS2 = 864e5;
var NEXT_GRACE_MINUTES = 15;
var timeText = (time) => escapeHtml(String(time).slice(0, 5));
function minutesOf(item, estimates) {
  if (item.hora) return Number(String(item.hora).slice(0, 2)) * 60 + Number(String(item.hora).slice(3, 5));
  return estimates[item.id] ?? null;
}
function nextOf(open, estimates, now) {
  return open.find((item) => {
    const minutes = minutesOf(item, estimates);
    return minutes === null || minutes + NEXT_GRACE_MINUTES >= now;
  }) ?? null;
}
var daysSince = (isoDate) => Math.max(0, Math.round((fromIsoDate(todayIso()).getTime() - fromIsoDate(String(isoDate).slice(0, 10)).getTime()) / DAY_MS2));
function shownTime(item, context) {
  const info = context.info[item.id] ?? {}, estimate = context.estimates[item.id];
  if (item.hora) return timeText(item.hora);
  if (!isOpen(item.estado)) return "·";
  if (context.noFitBanner && isPresent(info.llegada) && info.llegada >= context.limit) return "—";
  return estimate !== void 0 && !context.isPast ? `~${formatMinutes(estimate)}` : "·";
}
function whenText(item, time, context) {
  if (!isOpen(item.estado)) return "";
  const minutes = minutesOf(item, context.estimates), left = minutes === null ? null : minutes - context.now;
  if (item === context.next && left !== null && left > 0) return t("agenda.card.inTime", { time: `${left >= 60 ? `${Math.floor(left / 60)} h ` : ""}${left % 60} min` });
  return time.startsWith("~") ? t("agenda.card.estimatedTime") : "";
}
function warningOf(item, context) {
  const info = context.info[item.id] ?? {};
  if (!isOpen(item.estado) || !info.aviso) return "";
  if (info.lejos) return t("agenda.card.farLocation", { km: formatNumber(info.lejos) });
  return context.noFitBanner ? "" : info.aviso;
}
function windowsLine(item, info, warning) {
  if (!isOpen(item.estado) || warning || !info.ventanas?.length) return null;
  const text = t("agenda.card.attends", { windows: yourDayLegacy.windowsText(info.ventanas) }) + (info.espera ? t("agenda.card.waits", { minutes: info.espera }) : "");
  return ["puerta", "", escapeHtml(text)];
}
function previousLine(item, visit) {
  if (item.anterior === void 0) return null;
  if (!item.anterior) return ["reloj", "", t("agenda.card.firstVisit", { visit })];
  const days = daysSince(item.anterior.fecha);
  return ["reloj", "", t("agenda.card.lastVisit", { visit, days, unit: t(days === 1 ? "agenda.card.day" : "agenda.card.days") })];
}
function warningLine(item, info, warning) {
  if (!warning) return null;
  return ["aviso", "tdav tdaviso", `${escapeHtml(warning)} <button type="button" class="tdavi" data-tdavi="${item.id}" aria-label="${t("agenda.yourDay.whyWarning")}">i</button>`, yourDayLegacy.explainWarning(info)];
}
function detailLines(item, context) {
  const info = context.info[item.id] ?? {}, warning = warningOf(item, context), action = item.anterior?.proxima_accion;
  const lines = [
    action ? ["toca", "toca", t("agenda.card.due", { action: escapeHtml(action) })] : null,
    previousLine(item, context.visit),
    windowsLine(item, info, warning),
    warningLine(item, info, warning),
    isOpen(item.estado) && !pointOf(item) ? ["aviso", "tdav", t("agenda.card.noLocation")] : null,
    item.nota ? ["nota", "", escapeHtml(item.nota)] : null
  ];
  return lines.filter((line) => line !== null);
}
function ladderHtml(item, ladder) {
  const level = ladder.findIndex((step) => step.valor === item.estado_comercial);
  if (!ladder.length || level < 0) return "";
  const goal = ladder[level + 1];
  const bars = range(ladder.length).map((index) => `<i class="${index <= level ? "on" : index === level + 1 ? "obj" : ""}"></i>`).join("");
  return `<div class="tdu-niv"><div class="tdu-barra" title="${escapeHtml(ladder.map((step) => step.valor).join(" → "))}">${bars}</div>
        <span class="tdu-nt"><b>${escapeHtml(item.estado_comercial)}</b>${goal ? ` → ${escapeHtml(goal.valor)}` : t("agenda.card.keep")}</span></div>`;
}
function headHtml(item, index, context) {
  const time = shownTime(item, context), when = whenText(item, time, context), next = item === context.next;
  const where = [item.centro_nombre, item.municipio].filter(Boolean).join(" · ") || t("agenda.card.noCentre");
  return `<div class="tdu-cab">
        <div class="tdu-av" aria-hidden="true">${escapeHtml(initialsOf(item.nombre ?? ""))}<span class="n">${index + 1}</span></div>
        <div class="tdu-tit">${next ? `<span class="tdu-sig"><i></i>${t("agenda.card.next")}</span>` : ""}
          <div class="tdu-nom"><b class="tdu-nb" title="${t("agenda.card.seeAppointment")}">${escapeHtml(item.nombre)}</b>${item.clase ? `<span class="tdu-k ${escapeHtml(item.clase)}" title="${t("agenda.card.classTitle", { name: escapeHtml(item.clase) })}">${escapeHtml(item.clase)}</span>` : ""}${item.urgente ? `<span class="pill p-urg">${t("agenda.card.urgent")}</span>` : ""}</div>
          <span class="tdu-sub">${escapeHtml(where)}</span></div>
        <div class="tdu-hora"><span class="h" title="${t(item.hora ? "agenda.card.fixedTime" : "agenda.card.estimatedByOrder")}">${time}</span>${when ? `<span class="tdu-cu">${when}</span>` : ""}</div>
      </div>`;
}
function orderButtons(item, context) {
  const position = context.open.indexOf(item);
  return `<button class="kmv" type="button" data-td="sube|${item.id}" aria-label="${t("agenda.card.moveUp")}" title="${t("agenda.card.moveUp")}" ${position <= 0 ? "disabled" : ""}>${legacyIcons.arrow("arriba")}</button><button class="kmv" type="button" data-td="baja|${item.id}" aria-label="${t("agenda.card.moveDown")}" title="${t("agenda.card.moveDown")}" ${position >= context.open.length - 1 ? "disabled" : ""}>${legacyIcons.arrow("abajo")}</button>`;
}
function footHtml(item, context) {
  const open = isOpen(item.estado), canMove = open && !context.isPast, record = open && yourDayLegacy.canRecordOn(item.fecha);
  const again = isAbsent(item.estado) && !context.isPast;
  return `<div class="tdu-pie"><span class="tdu-est">${statePill(item.estado)}<span class="sm">${originText(item)}</span></span>
        <span class="tdu-ops">${canMove ? orderButtons(item, context) : ""}${hasMenu(item) ? `<button class="btn sec tdmas" type="button" data-td="mas|${item.id}" aria-label="${t("agenda.card.moreActions")}">⋯</button>` : ""}</span>
        ${again ? `<button class="btn sec tdu-reg" type="button" data-td="nueva|${item.id}">${t("agenda.card.newAppointment")}</button>` : ""}
        ${record ? `<button class="btn ${item === context.next ? "" : "sec"} tdu-reg" type="button" data-td="visita|${item.id}">${t("agenda.card.record", { visit: context.visit })}</button>` : ""}</div>`;
}
function statusClass(state) {
  if (isOpen(state)) return "abierta";
  if (isDone(state)) return "hecha";
  return isAbsent(state) ? "ausente" : "cerrada";
}
function appointmentCard(item, index, context) {
  const open = isOpen(item.estado), mini = !open && !isDone(item.estado) && !isAbsent(item.estado), lines = detailLines(item, context);
  const classes = `tdu ${item === context.next ? "sig" : ""} ${open ? "" : "hecha"} ${mini ? "tdmini" : ""} tdst-${statusClass(item.estado)}`;
  const details = lines.length ? `<ul class="tdu-dat">${lines.map(([iconName, className, html, title]) => `<li class="${className}"${title ? ` title="${escapeHtml(title)}"` : ""}>${legacyIcons.line(iconName)}<span>${html}</span></li>`).join("")}</ul>` : "";
  return `<article class="${classes}" data-tdu="${item.id}" data-tdf="${item.cuenta_id}" tabindex="0" aria-label="${escapeHtml(item.nombre)}">
      ${headHtml(item, index, context)}
      ${ladderHtml(item, context.ladder)}
      ${details}
      ${footHtml(item, context)}
    </article>`;
}

// delcos-shared:src/app/screens/agenda/your-day/compact.ts
var shared16 = globalThis["__delcosModules"]["screens/agenda/your-day/compact"];
var pick16 = (name) => shared16[name];
var compact = /* @__PURE__ */ pick16("compact");
var compactButton = /* @__PURE__ */ pick16("compactButton");

// src/app/screens/agenda/your-day/header.ts
var DAY_MINUTES = 24 * 60;
function statsHtml(summary) {
  const end = summary.open && !summary.isPast ? `<span>${t("agenda.yourDay.estimatedEnd")} <b style="color:${summary.overReturn ? "var(--warn)" : "var(--navy)"}">${formatMinutes(summary.end)}</b>${summary.overReturn ? t("agenda.yourDay.overReturn") : ""}${summary.end >= DAY_MINUTES ? ` <span class="sm">${t("agenda.yourDay.nextDay")}</span>` : ""}</span>` : "";
  return `<div class="tdstats">
          <span>${t("agenda.yourDay.appointments", { count: formatNumber(summary.active) })}</span>
          <span>${t("agenda.yourDay.visited", { count: formatNumber(summary.done) })}</span>
          ${summary.absent ? `<span>${t("agenda.yourDay.absent", { count: formatNumber(summary.absent) })}</span>` : ""}
          <span>${t("agenda.yourDay.toDo", { count: summary.open })}</span>
          ${end}
        </div>`;
}
function workingDayButton(summary) {
  if (!summary.isToday || !summary.isOwner) return "";
  if (summary.workingDay) return `<button class="btn dang chico" id="tdterminar">${t("agenda.yourDay.endDay")}</button>`;
  return summary.open ? `<button class="btn chico" id="tdempezar">${t("agenda.yourDay.startDay")}</button>` : "";
}
function actionsHtml(summary) {
  const { isPast, own, open, withPlace } = summary;
  return `<div class="acts">
        ${own ? `<button type="button" class="btn sec chico" id="tdtarea">${t("agenda.yourDay.addTask")}</button>` : ""}
        ${!isPast && withPlace > 1 ? `<button class="btn sec chico" id="tdordenar" title="${t("agenda.yourDay.orderTitle")}">${t("agenda.yourDay.orderByDistance")}</button>` : ""}
        ${workingDayButton(summary)}
        ${isPast && open ? `<button class="btn chico" id="tdrepro">${t("agenda.yourDay.reschedulePending")}</button>` : ""}
      </div>`;
}
function headerHtml3(summary) {
  const title = t(summary.isToday ? "agenda.yourDay.titleToday" : summary.isPast ? "agenda.yourDay.titlePast" : "agenda.yourDay.titleFuture");
  const dayMenu = summary.isFutureOrToday ? `<button type="button" class="kmv tddiamas" id="tddiamas" aria-label="${t("agenda.yourDay.dayOptions")}" title="${t("agenda.yourDay.dayOptionsTitle")}">${legacyIcons.line("mas")}</button>` : "";
  return `
    <div class="tdhead">
      <div class="${summary.isFutureOrToday ? "tdtitw" : ""}"><h2 class="u-p-0">${title}</h2>${summary.mine > 1 ? compactButton(summary.compact) : ""}${dayMenu}
        ${statsHtml(summary)}</div>
      ${actionsHtml(summary)}
    </div>`;
}
function workingDayHtml(summary, duration) {
  return summary.isToday && summary.workingDay ? `<div class="tdjornada">${t("agenda.yourDay.workingDay", { time: duration, visit: summary.visit })}</div>` : "";
}
function noFitHtml(noFit) {
  if (!noFit.shown) return "";
  const end = t(noFit.end >= DAY_MINUTES ? "agenda.yourDay.endAfterMidnight" : "agenda.yourDay.endAround", { time: formatMinutes(noFit.end) });
  const outside = noFit.outside ? noFit.outside === 1 ? t("agenda.yourDay.outsideOne") : t("agenda.yourDay.outsideMany", { count: noFit.outside }) : "";
  const head = noFit.overLimit ? t("agenda.yourDay.noFit", { end, outside }) : t("agenda.yourDay.badWindows");
  const order = noFit.canOrder ? `<button type="button" class="btn sec chico" id="tdnocord">${t("agenda.yourDay.orderByDistance")}</button>${t("agenda.yourDay.or")}` : "";
  return `<div class="banda-aviso" id="tdnocabe">${head}
      ${t("agenda.yourDay.beforeEach")}${order}${t("agenda.yourDay.moveFarthest")}</div>`;
}
function othersHtml(others) {
  if (!others.length) return "";
  return `<h3 class="tdotros">${t("agenda.yourDay.othersTitle", { count: others.length })}</h3>
      <div class="lista">${others.map((item) => `<div class="item u-cursor-default"><span class="ic">${item.hora ? timeText(item.hora) : "·"}</span>
        <span class="tx"><b>${escapeHtml(item.nombre)}</b><span class="sm">${escapeHtml(item.usuario ?? "")} · ${statePill(item.estado)}</span></span></div>`).join("")}</div>`;
}

// src/app/screens/agenda/your-day/tasks.ts
var FOLDED_KEY = "delcos-tareas-plegadas";
function folded() {
  try {
    return localStorage.getItem(FOLDED_KEY) === "1";
  } catch {
    return false;
  }
}
function taskRow(task, list) {
  const moves = list.length > 1 ? `<span class="tdtmov"><button type="button" class="kmv" data-tamov="-1|${task.id}" aria-label="${t("agenda.tasks.up")}" ${list[0] === task ? "disabled" : ""}>↑</button><button type="button" class="kmv" data-tamov="1|${task.id}" aria-label="${t("agenda.tasks.down")}" ${list[list.length - 1] === task ? "disabled" : ""}>↓</button></span>` : "";
  return `
    <div class="tdtarea ${task.hecha ? "hecha" : ""}" data-tarea="${task.id}">
      <label class="tdtchk"><input type="checkbox" data-tacheck="${task.id}" ${task.hecha ? "checked" : ""} aria-label="${t("agenda.tasks.done")}"></label>
      <span class="tdth">${task.hora ? timeText(task.hora) : ""}</span>
      <span class="tdttx"><b>${escapeHtml(task.titulo)}</b>${task.nota ? `<span class="sm">${escapeHtml(task.nota)}</span>` : ""}</span>
      ${moves}
    </div>`;
}
async function markDone(box) {
  const { error } = await legacyDb().from("tareas").update({ hecha: box.checked, modificado_en: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", box.dataset.tacheck);
  if (error) {
    notices.toast(t("agenda.tasks.couldNotSave"), true);
    box.checked = !box.checked;
    return;
  }
  box.closest(".tdtarea")?.classList.toggle("hecha", box.checked);
  agendaState.forgetDayTasks();
}
function bind4(block) {
  block.querySelectorAll("[data-tacheck]").forEach((box) => {
    box.onchange = (event) => {
      event.stopPropagation();
      void markDone(box);
    };
  });
}
function paintTasks(body, list) {
  document.getElementById("tdtareas")?.remove();
  if (!list?.length) return;
  const place2 = document.getElementById("tdnocabe") ?? body.querySelector(".tdesc, .vacio");
  const html = `<div class="tdtareas" id="tdtareas"><div class="tdtcab">${t("agenda.tasks.title", { count: list.length })}</div>${list.map((task) => taskRow(task, list)).join("")}</div>`;
  if (place2) place2.insertAdjacentHTML("beforebegin", html);
  else body.insertAdjacentHTML("beforeend", html);
  const block = document.getElementById("tdtareas");
  if (block) bind4(block);
}
function applyTaskFolding() {
  const block = document.getElementById("tdtareas"), header = block?.querySelector(".tdtcab");
  if (!block || !header) return;
  block.classList.toggle("plegadas", folded());
  header.setAttribute("role", "button");
  header.tabIndex = 0;
  header.setAttribute("aria-expanded", String(!folded()));
  header.title = t(folded() ? "agenda.tasks.show" : "agenda.tasks.hide");
  if (header.foldBound) return;
  header.foldBound = true;
  const toggle = () => {
    try {
      localStorage.setItem(FOLDED_KEY, folded() ? "0" : "1");
    } catch {
    }
    applyTaskFolding();
  };
  header.onclick = toggle;
  header.onkeydown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggle();
    }
  };
}

// delcos-shared:src/app/legacy/routes2-bridge.ts
var shared17 = globalThis["__delcosModules"]["legacy/routes2-bridge"];
var pick17 = (name) => shared17[name];
var routes2Legacy = /* @__PURE__ */ pick17("routes2Legacy");

// delcos-shared:src/app/screens/routes/today/service.ts
var shared18 = globalThis["__delcosModules"]["screens/routes/today/service"];
var pick18 = (name) => shared18[name];
var reasonText = /* @__PURE__ */ pick18("reasonText");
var streetRoute = /* @__PURE__ */ pick18("streetRoute");

// delcos-shared:src/app/screens/agenda/traffic-times.ts
var shared19 = globalThis["__delcosModules"]["screens/agenda/traffic-times"];
var pick19 = (name) => shared19[name];
var dayRoute = /* @__PURE__ */ pick19("dayRoute");
var setRealTimes = /* @__PURE__ */ pick19("setRealTimes");

// src/app/components/slide.ts
var HIGHLIGHT_CLASS = "tdmovida";
var HIGHLIGHT_MS = 1300;
var EASING = "cubic-bezier(.2,.7,.2,1)";
function positionsOf(selector, key) {
  const positions = /* @__PURE__ */ new Map();
  document.querySelectorAll(selector).forEach((element) => {
    positions.set(element.dataset[key] ?? "", element.getBoundingClientRect().top);
  });
  return positions;
}
function highlight(element) {
  element.classList.remove(HIGHLIGHT_CLASS);
  void element.offsetWidth;
  element.classList.add(HIGHLIGHT_CLASS);
  setTimeout(() => {
    element.classList.remove(HIGHLIGHT_CLASS);
  }, HIGHLIGHT_MS);
}
function slideIntoPlace(before, options2) {
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll(options2.selector).forEach((element) => {
    const id = element.dataset[options2.key] ?? "";
    if (options2.touched && id === String(options2.touched)) highlight(element);
    const top = before.get(id);
    if (still || top === void 0) return;
    const shift = top - element.getBoundingClientRect().top;
    if (Math.abs(shift) > 1) element.animate([{ transform: `translateY(${shift}px)` }, { transform: "none" }], { duration: options2.durationMs, easing: EASING });
  });
}

// delcos-shared:src/app/screens/home/index.ts
var shared20 = globalThis["__delcosModules"]["screens/home/index"];
var pick20 = (name) => shared20[name];
var load = /* @__PURE__ */ pick20("load");

// delcos-shared:src/app/screens/routes/planner/visits.ts
var shared21 = globalThis["__delcosModules"]["screens/routes/planner/visits"];
var pick21 = (name) => shared21[name];
var orderByDistance = /* @__PURE__ */ pick21("orderByDistance");

// src/app/screens/agenda/your-day/reorder.ts
var CARDS = "#agcuerpo .tdu[data-tdu]";
var TASKS = "#tdtareas .tdtarea";
var REPAINT_SLIDE_MS = 320;
var MOVE_SLIDE_MS = 260;
var QUIET_DELAY_MS = 40;
async function saveOrder(list) {
  const { data: result, error } = await legacyDb().rpc("ordenar_citas", { p_ids: list.map((item) => item.id) });
  if (error || result?.ok === false) {
    notices.toast(t("agenda.yourDay.couldNotSaveOrder"), true);
    return false;
  }
  return true;
}
async function repaintSmoothly(id, data) {
  const before = positionsOf(CARDS, "tdu"), day = legacyAgenda.selectedDate();
  agendaCache.forget();
  if (data && day) agendaCache.preset(day, data);
  const body = document.getElementById("agcuerpo"), scroll = window.scrollY;
  if (body) body.style.minHeight = `${body.offsetHeight}px`;
  try {
    await paintYourDay();
  } finally {
    const fresh = document.getElementById("agcuerpo");
    if (fresh) fresh.style.minHeight = "";
  }
  window.scrollTo({ top: scroll });
  slideIntoPlace(before, { selector: CARDS, key: "tdu", touched: id, durationMs: REPAINT_SLIDE_MS });
}
var quietTimer = null;
var quietId = null;
function refreshQuietly(id, figures = true) {
  if (currentScreen() !== "agenda" || !appointmentLegacy.isJoinedDayView() || !document.getElementById("agcuerpo")) {
    void loadAgenda();
    void load();
    void paintRouteBar();
    return;
  }
  agendaCache.markDialogSeen();
  if (id) quietId = id;
  if (quietTimer) clearTimeout(quietTimer);
  quietTimer = setTimeout(() => {
    const touched = quietId;
    quietId = null;
    void repaintSmoothly(touched).then(() => {
      if (figures) refreshAfterChange();
      void paintRouteBar();
    });
  }, QUIET_DELAY_MS);
}
function focusMoved(id, action) {
  const button = document.querySelector(`#agcuerpo .tdu [data-td="${action}|${id}"]:not([disabled])`) ?? document.querySelector(`#agcuerpo .tdu [data-td$="|${id}"]`);
  button?.focus({ preventScroll: true });
}
async function moveAppointment(order, id, action) {
  const day = legacyAgenda.selectedDate() ?? "", known = agendaCache.dayData(day);
  if (!agendaCache.lastPainted(day) && known) agendaCache.setLastPainted(day, known);
  const before = positionsOf(CARDS, "tdu"), last = agendaCache.lastPainted(day);
  if (!last) {
    if (await saveOrder(order)) await loadAgenda();
    return;
  }
  const ids = new Set(order.map((item) => item.id));
  agendaCache.preset(day, [...order, ...last.filter((item) => !ids.has(item.id))]);
  const scroll = window.scrollY;
  await paintYourDay();
  window.scrollTo({ top: scroll });
  slideIntoPlace(before, { selector: CARDS, key: "tdu", touched: id, durationMs: MOVE_SLIDE_MS });
  focusMoved(id, action);
  if (!await saveOrder(order)) await loadAgenda();
}
function swappedTasks(list, id, direction) {
  const from = list.findIndex((task) => task.id === id), to = from + direction;
  const order = list.slice(), moved = order[from], other = order[to];
  if (from < 0 || !moved || !other) return null;
  order[from] = other;
  order[to] = moved;
  order.forEach((task, index) => {
    task.orden = index + 1;
  });
  return order;
}
async function moveTask(id, direction) {
  const day = legacyAgenda.selectedDate() ?? "", list = agendaCache.dayTasks(day);
  const order = list ? swappedTasks(list, id, direction) : null;
  if (!order) return;
  agendaCache.setDayTasks(day, order);
  const before = positionsOf(TASKS, "tarea");
  await repaintSmoothly(null, agendaCache.lastPainted(day) ?? void 0);
  slideIntoPlace(before, { selector: TASKS, key: "tarea", touched: id, durationMs: REPAINT_SLIDE_MS });
  const button = document.querySelector(`#tdtareas [data-tamov="${direction}|${id}"]:not([disabled])`) ?? document.querySelector(`#tdtareas [data-tamov$="|${id}"]:not([disabled])`);
  button?.focus({ preventScroll: true });
  const { data: result, error } = await legacyDb().rpc("ordenar_tareas", { p_ids: order.map((task) => task.id) });
  if (error || result?.ok === false) {
    notices.toast(t("agenda.yourDay.couldNotSaveOrder"), true);
    agendaCache.setDayTasks(day, null);
    refreshQuietly(null, false);
  }
}
async function orderByDistance2() {
  const { list, left } = orderByDistance(legacyAgenda.dayAppointments());
  if (!await saveOrder(list)) return;
  notices.toast(left ? t("agenda.yourDay.orderedWithLeft", { count: left }) : t("agenda.yourDay.ordered"));
  await repaintSmoothly();
}

// src/app/screens/agenda/traffic.ts
var todayList = () => legacyAgenda.dayAppointments();
async function requestTraffic(silent) {
  const route = dayRoute(todayList(), legacyAgenda.selectedDate());
  if (!route) return;
  const button = document.getElementById("tdtrafico");
  if (button) {
    button.disabled = true;
    button.textContent = t("routesMore.traffic.calculating");
  }
  const result = await streetRoute(route.puntos, route.salida);
  if (setRealTimes(route, result)) {
    if (legacyAgenda.isDayView()) void repaintSmoothly();
    return;
  }
  if (!silent) notices.toast(t("routesMore.traffic.approximate", { reason: reasonText(result.motivo) }), true);
  const again = document.getElementById("tdtrafico");
  if (again) {
    again.disabled = false;
    again.textContent = t("routesMore.traffic.calculate");
  }
}
function markTraffic() {
  const stats = document.querySelector("#agcuerpo .tdhead .tdstats");
  if (!stats) return;
  stats.querySelectorAll(".tdtraf").forEach((item) => {
    item.remove();
  });
  const route = dayRoute(todayList(), legacyAgenda.selectedDate());
  if (!route || agendaState.viewed()) return;
  const real = routes2Legacy.realTrafficValid() && routes2Legacy.realTraffic()?.k === route.k;
  stats.insertAdjacentHTML("beforeend", real ? `<span class="tdtraf tdtrafok" title="${t("routesMore.traffic.realTitle")}">${t("routesMore.traffic.real")}</span>` : `<span class="tdtraf"><button type="button" class="kcfg" id="tdtrafico" title="${t("routesMore.traffic.calculateTitle")}">${t("routesMore.traffic.calculate")}</button></span>`);
  const button = document.getElementById("tdtrafico");
  if (button) button.onclick = () => {
    void requestTraffic(false);
  };
}

// delcos-shared:src/app/screens/agenda/active-day.ts
var shared22 = globalThis["__delcosModules"]["screens/agenda/active-day"];
var pick22 = (name) => shared22[name];
var activeWorkingDay = /* @__PURE__ */ pick22("activeWorkingDay");

// src/app/screens/agenda/working-day.ts
var VISITED = "Visitada";
var NOT_COUNTED2 = ["Descartada", "Aplazada"];
async function startWorkingDay() {
  const list = await appointments.ofDay(todayIso());
  if (!list.some((item) => isOpen(item.estado))) {
    notices.toast(t("agendaMore.workday.noOpen"), true);
    return;
  }
  localStorage.setItem(restLegacy.workingDayKey(), JSON.stringify({ fecha: todayIso(), inicio: Date.now() }));
  void paintRouteBar();
  notices.toast(t("agendaMore.workday.started"));
  agendaState.setMode("dia");
  agendaState.setSelectedDate(todayIso());
  if (currentScreen() === "agenda") reloadAgenda();
  else goTo("agenda");
  try {
    if (legacyAgenda.selectedDate() === todayIso()) void requestTraffic(true);
  } catch {
  }
}
function endQuestion(day, list, open) {
  const done = list.filter((item) => item.estado === VISITED).length, total = list.filter((item) => !NOT_COUNTED2.includes(item.estado)).length;
  const left = open === 1 ? t("agendaMore.workday.oneOpen") : t("agendaMore.workday.open", { count: open });
  return t("agendaMore.workday.summary", { time: formatDuration(Date.now() - day.inicio), done, total }) + (open ? left : "");
}
async function endWorkingDay() {
  const day = activeWorkingDay();
  if (!day) return;
  appLegacy.forgetCache();
  const list = await appointments.ofDay(todayIso());
  const open = list.filter((item) => isOpen(item.estado)), done = list.filter((item) => item.estado === VISITED).length;
  if (!await notices.confirm(endQuestion(day, list, open.length), { titulo: t("agendaMore.workday.endTitle"), ok: t("agendaMore.workday.end") })) return;
  localStorage.removeItem(restLegacy.workingDayKey());
  void paintRouteBar();
  notices.toast(t("agendaMore.workday.ended", { count: done }));
  if (open.length) await rescheduleAppointments(open, t("agendaMore.workday.leftTitle"), t("agendaMore.workday.leftText", { count: open.length }));
  if (currentScreen() === "agenda") reloadAgenda();
  if (currentScreen() === "rutas") restLegacy.reloadRoutes();
}

// src/app/screens/agenda/route-buttons.ts
var MAX_STOPS = 9;
function fullRoute() {
  const leaving = routes2Legacy.start(), home = leaving.lat !== null && leaving.lat !== void 0 ? [leaving.lat, leaving.lon] : null;
  const points = routes2Legacy.stops().map((item) => routes2Legacy.pointOf(item)).filter((point) => point !== null);
  if (!points.length) return;
  if (home) {
    routes2Legacy.navigate(home, points.slice(0, MAX_STOPS));
    return;
  }
  routes2Legacy.navigate(points[points.length - 1] ?? null, points.slice(0, -1).slice(0, MAX_STOPS));
}
function bindStart() {
  const start = document.getElementById("tdempezar");
  if (!start || start.dataset.v264) return;
  start.dataset.v264 = "1";
  start.textContent = t("routesMore.agenda.startRoute");
  start.title = t("routesMore.agenda.startRouteTitle");
  start.onclick = async () => {
    const first = routes2Legacy.stops()[0];
    await startWorkingDay();
    if (first) routes2Legacy.navigate(routes2Legacy.pointOf(first), null);
  };
}
function paintRouteButtons(isoDate) {
  const actions = document.querySelector("#agcuerpo .tdhead > .acts");
  if (!actions) return;
  bindStart();
  let full = document.getElementById("tdrutacompleta");
  if (isoDate >= todayIso() && routes2Legacy.stops().length && agendaSources.isOwnAgenda()) {
    if (!full) {
      actions.insertAdjacentHTML("afterbegin", `<button class="btn sec chico" id="tdrutacompleta" type="button" title="${t("routesMore.agenda.fullRouteTitle")}">${routes2Legacy.iconOrEmpty("map")} ${t("routesMore.agenda.fullRoute")}</button>`);
      full = document.getElementById("tdrutacompleta");
    }
    if (full) full.onclick = () => {
      fullRoute();
    };
  } else full?.remove();
}
function prepareRouteStops(isoDate) {
  routes2Legacy.setStops(legacyAgenda.dayAppointments().filter((item) => appointments.isOpen(item.estado) && routes2Legacy.pointOf(item)));
  try {
    paintRouteButtons(isoDate);
  } catch {
  }
}

// src/app/screens/agenda/your-day/index.ts
var DEFAULT_LIMIT = 21 * 60;
var WARNINGS_FOR_BANNER = 3;
function buildContext(data, estimate) {
  const { day, today, mine } = data, isPast = day < today, info = yourDayLegacy.stopInfo();
  const open = mine.filter((item) => isOpen(item.estado)), limit = Number.isFinite(estimate.tope) ? estimate.tope : DEFAULT_LIMIT;
  const warnings = Object.values(info).filter((stop) => stop.aviso && !stop.lejos).length;
  const overLimit = !isPast && open.length > 0 && estimate.fin > limit, banner = !isPast && open.length > 0 && (overLimit || warnings >= WARNINGS_FOR_BANNER);
  const now = (/* @__PURE__ */ new Date()).getHours() * 60 + (/* @__PURE__ */ new Date()).getMinutes(), withPlace = open.filter((item) => pointOf(item)).length;
  const viewed = legacyAgenda.viewedUserId(), visit = term("visita");
  const context = {
    day,
    isPast,
    now,
    visit,
    estimates: estimate.est,
    info,
    open,
    next: day === today ? nextOf(open, estimate.est, now) : null,
    ladder: commercialStates.all().filter((step) => step.papel !== "negativo"),
    noFitBanner: banner,
    limit
  };
  const summary = {
    isToday: day === today,
    isPast,
    isFutureOrToday: day >= today,
    mine: mine.length,
    active: mine.filter((item) => !isCancelled(item.estado)).length,
    done: mine.filter((item) => isDone(item.estado)).length,
    absent: mine.filter((item) => isAbsent(item.estado)).length,
    open: open.length,
    end: estimate.fin,
    overReturn: open.length > 0 && estimate.fin > estimate.tope,
    withPlace,
    own: !viewed || agendaSources.isOwnAgenda(),
    isOwner: agendaSources.isOwnAgenda(),
    workingDay: activeWorkingDay(),
    compact: compact(),
    visit
  };
  const outside = Object.values(info).filter((stop) => stop.llegada !== null && stop.llegada !== void 0 && stop.llegada >= limit).length;
  return { context, summary, noFit: { shown: banner, overLimit, end: estimate.fin, outside, canOrder: !isPast && withPlace > 1 } };
}
function on(id, action) {
  const button = document.getElementById(id);
  if (button) button.onclick = action;
}
function bindHeader2(data, open) {
  on("tdempezar", () => {
    void startWorkingDay();
  });
  on("tdterminar", () => {
    void endWorkingDay();
  });
  on("tdrepro", () => {
    void rescheduleAppointments(open, t("agenda.yourDay.pendingOf", { date: formatShortDate(data.day) }), t("agenda.yourDay.notVisitedThatDay"));
  });
  on("tddiamas", (event) => {
    event.stopPropagation();
    const stripDay = document.querySelector(`#agcinta [data-cf="${data.day}"]`), button = document.getElementById("tddiamas");
    if (button) openDayMenu(button, data.day, Boolean(stripDay?.classList.contains("bloq")));
  });
}
function cardsHtml(mine, context, isToday, noCopy) {
  if (noCopy) return `<div class="vacio">${t("agenda.yourDay.offlineNoCopy")}</div>`;
  if (!mine.length) return `<div class="vacio">${t(isToday ? "agenda.yourDay.emptyToday" : "agenda.yourDay.emptyOther")}</div>`;
  return `<div class="tdesc" role="group" aria-label="${t("agenda.yourDay.dayAppointments")}">${mine.map((item, index) => appointmentCard(item, index, context)).join("")}</div>`;
}
async function paintDay() {
  const day = legacyAgenda.selectedDate() ?? todayIso(), today = todayIso();
  const result = await cachedRpc("agenda_rango", { p_desde: day, p_hasta: day, p_usuario: legacyAgenda.userFilter() }, `agenda-${day}`);
  const body = document.getElementById("agcuerpo");
  if (legacyAgenda.selectedDate() !== day || legacyAgendaParts.mode() !== "dia" || !body) return;
  const all = result.data ?? [], owner = agendaSources.ownerId();
  const data = { day, today, mine: all.filter((item) => item.usuario_id === owner), others: all.filter((item) => item.usuario_id !== owner) };
  yourDayLegacy.setDayAppointments(data.mine);
  const { context, summary, noFit } = buildContext(data, yourDayLegacy.estimateDay(data.mine, day));
  const cards = cardsHtml(data.mine, context, summary.isToday, !result.data && Boolean(result.cache));
  body.innerHTML = `${headerHtml3(summary)}
    ${workingDayHtml(summary, summary.workingDay ? formatDuration(Date.now() - summary.workingDay.inicio) : "")}
    ${noFitHtml(noFit)}
    ${cards}
    ${othersHtml(data.others)}`;
  bindHeader2(data, context.open);
  refreshMetrics();
  prepareRouteStops(day);
  if (!summary.own) return;
  const tasks = await agendaSources.dayTasks(day);
  const fresh = document.getElementById("agcuerpo");
  if (legacyAgenda.selectedDate() === day && fresh) paintTasks(fresh, tasks);
}
function markQueuedVisits() {
  const day = legacyAgenda.selectedDate();
  const queued = yourDayLegacy.queuedVisits().filter((item) => item.fn === "registrar_actividad" && item.payload?.p?.fecha === day);
  const byId = new Map(legacyAgenda.dayAppointments().map((item) => [String(item.id), item]));
  document.querySelectorAll("#agcuerpo .tdu[data-tdu]").forEach((card) => {
    const item = byId.get(card.dataset.tdu ?? "");
    if (!item) return;
    const pending = queued.some((entry) => entry.payload?.p?.cuenta_id === item.cuenta_id);
    if (card.classList.contains("tdpend") !== pending) card.classList.toggle("tdpend", pending);
    const mark = card.querySelector(".tdpendm");
    if (pending && !mark) card.querySelector(".tdu-pie")?.insertAdjacentHTML("afterbegin", `<span class="tdpendm">${t("agenda.yourDay.queued")}</span>`);
    if (!pending && mark) mark.remove();
    card.querySelectorAll('[data-td^="visita|"]').forEach((button) => {
      if (button.classList.contains("hide") !== pending) button.classList.toggle("hide", pending);
    });
  });
}
async function paintYourDay() {
  if (hasStrip()) {
    const day = legacyAgenda.selectedDate() ?? todayIso(), current = agendaSuggestions.forDay();
    let suggestions = null;
    await withData([...dayLoads(day), current?.fecha === day ? null : loadSuggestions(day).then((found) => {
      suggestions = found;
    })], async () => {
      if (legacyAgenda.selectedDate() !== day || !hasStrip()) return;
      applySuggestions(day, suggestions);
      await paintDay();
      if (legacyAgenda.isDayView()) {
        paintSameCentre();
        paintTrayButtons();
      }
    });
    if (hasStrip()) markTraffic();
    if (hasStrip()) markQueuedVisits();
  }
  applyTaskFolding();
}

// src/app/screens/agenda/absent.ts
async function chooseDay(item, proposed) {
  const option = await notices.choose(t("agendaMore.absent.title"), t("agendaMore.absent.text", { name: item.nombre, date: formatLongDate(proposed) }), [
    { k: "no", t: t("agendaMore.absent.notNow"), cls: "sec" },
    { k: "otra", t: t("agendaMore.absent.other"), cls: "sec" },
    { k: "prop", t: t("agendaMore.absent.proposed", { date: formatShortDate(proposed) }) }
  ]);
  if (!option || option === "no") return null;
  if (option !== "otra") return proposed;
  return notices.askDate(t("agendaMore.absent.whichDay"), proposed, { titulo: t("agendaMore.absent.newTitle"), ok: t("agendaMore.absent.create") });
}
async function newDateAfterAbsent(appointment) {
  const item = appointment;
  const day = await chooseDay(item, nextAttendanceDay(item.dias, item.fecha));
  if (!day) return;
  const { data: result, error } = await legacyDb().rpc("guardar_cita", { p: {
    cuenta_id: item.cuenta_id,
    fecha: day,
    centro_nombre: item.centro_nombre,
    estado: "Planificada",
    origen: t("agendaMore.absent.origin", { date: formatShortDate(item.fecha) }),
    op_id: `ne-${item.id}-${day}`
  } });
  if (error || result?.ok === false) {
    notices.toast(t("agendaMore.absent.couldNotCreate"), true);
    return;
  }
  notices.toast(t("agendaMore.absent.created", { date: formatShortDate(day) }));
  refreshQuietly();
}

// src/app/screens/agenda/appointment-actions.ts
var refresh = (item) => {
  refreshQuietly(item.id);
};
async function setState(action, item) {
  const state = action === "confirmar" ? STATES.confirmed : action === "desconfirmar" ? STATES.planned : STATES.discarded;
  const result = await appointmentLegacy.write("estado_cita", { p_id: item.id, p_estado: state });
  if (result?.error) {
    notices.toast(t("agenda.actions.couldNotChange"), true);
    return;
  }
  notices.toast(t(state === STATES.confirmed ? "agenda.actions.confirmed" : state === STATES.discarded ? "agenda.actions.discarded" : "agenda.actions.unconfirmed"));
  refresh(item);
}
async function remove(item) {
  if (!await notices.confirm(t("agenda.actions.deleteQuestion"), { titulo: t("agenda.actions.deleteTitle"), ok: t("agenda.actions.delete"), peligro: true })) return;
  const { data: result } = await legacyDb().rpc("borrar_cita", { p_id: item.id });
  if (result?.ok === false) {
    notices.toast(t(result.error === "pasada" ? "agenda.actions.onlyFuture" : "agenda.actions.couldNotDelete"), true);
    return;
  }
  notices.toast(t("agenda.actions.deleted"));
  refresh(item);
}
function postponedText(result, day) {
  if (result?.ya) return t("agenda.actions.alreadyThatDay");
  if (result?.mismo_dia) return t("agenda.actions.sameDay");
  return t(result?.reabierta ? "agenda.actions.backToOwn" : "agenda.actions.postponedTo", { date: formatShortDate(day) });
}
async function postpone(item) {
  const day = await notices.askDate(t("agenda.actions.whichDay"), nextAttendanceDay(item.dias, item.fecha), { titulo: t("agenda.actions.postponeTitle"), ok: t("agenda.actions.postpone") });
  if (!day) return;
  const { data: result, error } = await legacyDb().rpc("aplazar_cita", { p_id: item.id, p_fecha: day, p_hora: null, p_origen: STATES.postponed });
  if (error || result?.ok === false) {
    notices.toast(t("agenda.actions.couldNotPostpone"), true);
    return;
  }
  notices.toast(postponedText(result, day));
  refresh(item);
}
async function absent(item) {
  const negatives = appointmentLegacy.negativeResults();
  const [first] = negatives;
  if (!first) {
    notices.toast(t("agenda.actions.missingNegative"), true);
    return;
  }
  let result = first.valor;
  if (negatives.length > 1) {
    const choice = await notices.choose(t("agenda.actions.whatHappened"), item.nombre ?? "", [{ k: "no", t: t("agenda.actions.cancel"), cls: "sec" }, ...negatives.map((negative, index) => ({ k: `n${index}`, t: negative.valor, cls: "sec" }))]);
    if (!choice) return;
    result = negatives[Number(choice.slice(1))]?.valor ?? result;
  }
  const { error } = await appointmentLegacy.writeRpc("registrar_actividad", { p: { cuenta_id: item.cuenta_id, fecha: item.fecha, resultados: [result], op_id: `v-${item.cuenta_id}-${Date.now()}` } });
  if (error) {
    notices.toast(t("agenda.actions.couldNotSave", { error: error.message ?? "" }), true);
    return;
  }
  notices.toast(t("agenda.actions.noted", { result }));
  refresh(item);
  await newDateAfterAbsent(item);
}
async function planAgain(item) {
  const { data: result, error } = await legacyDb().rpc("reabrir_cita", { p_id: item.id });
  if (error || !result || result.ok === false) {
    notices.toast(t(result?.error === "pasada" ? "agenda.actions.reopenOnlyFuture" : "agenda.actions.couldNotReopen"), true);
    return;
  }
  notices.toast(result.quitada ? t("agenda.actions.reopenedRemoving", { date: formatShortDate(result.quitada) }) : t("agenda.actions.reopened"));
  refresh(item);
}
var ACTIONS = {
  ficha: (item) => {
    appointmentLegacy.openAccountFromCentre(item.cuenta_id, item.centro_nombre);
  },
  llegar: (item) => {
    appointmentLegacy.navigateTo(pointOf(item));
  },
  hora: (item) => changeTime(item.id, item.hora ?? ""),
  confirmar: (item) => setState("confirmar", item),
  desconfirmar: (item) => setState("desconfirmar", item),
  descartar: (item) => setState("descartar", item),
  borrar: remove,
  aplazar: postpone,
  noestaba: absent,
  nueva: (item) => newDateAfterAbsent(item),
  rehacer: planAgain
};
async function runAction(action, item) {
  await ACTIONS[action](item);
}
var timeOf2 = (item) => item.hora ? String(item.hora).slice(0, 5) : null;
function orderByTime(open, id, time) {
  const moved = open.find((item) => item.id === id);
  if (!moved || !time) return open;
  const rest = open.filter((item) => item.id !== id);
  let index = rest.findIndex((item) => {
    const other = timeOf2(item);
    return other !== null && other > time;
  });
  if (index < 0) {
    index = 0;
    rest.forEach((item, position) => {
      const other = timeOf2(item);
      if (other !== null && other <= time) index = position + 1;
    });
  }
  rest.splice(index, 0, moved);
  return rest;
}
async function changeTime(id, current) {
  const time = await notices.askTime(t("agenda.actions.timeTitle"), current, t("agenda.actions.save"));
  if (time === null) return;
  const { error } = await legacyDb().from("agenda").update({ hora: time || null }).eq("id", id);
  if (error) {
    notices.toast(t("agenda.actions.couldNotTime", { error: error.message ?? "" }), true);
    return;
  }
  notices.toast(t("agenda.actions.timeUpdated"));
  const day = appointmentLegacy.lastDayData();
  if (currentScreen() !== "agenda" || !appointmentLegacy.isJoinedDayView() || !day?.some((item) => item.id === id)) {
    refreshQuietly(id, false);
    return;
  }
  const owner = agendaSources.ownerId(), data = day.map((item) => item.id === id ? { ...item, hora: time || null } : item);
  const mine = (item) => item.usuario_id === owner;
  const open = data.filter((item) => mine(item) && isOpen(item.estado)), order = orderByTime(open, id, time);
  const changed = order.some((item, index) => item.id !== open[index]?.id);
  const next = changed ? [...data.filter((item) => mine(item) && !isOpen(item.estado)), ...order, ...data.filter((item) => !mine(item))] : data;
  await repaintSmoothly(id, next);
  if (changed && !await saveOrder(order)) refreshQuietly(id);
}

// src/app/screens/agenda/appointment-menu.ts
function openMenu(button, item) {
  document.querySelectorAll(".tdmenu").forEach((menu2) => {
    menu2.remove();
  });
  const options2 = menuOptions(item);
  if (!options2.length) {
    notices.toast(t("agenda.menu.alreadyClosed"));
    return;
  }
  const menu = document.createElement("div");
  menu.className = "tdmenu";
  menu.__t = Date.now();
  const danger = (action) => action === "descartar" || action === "borrar";
  menu.innerHTML = options2.map((entry) => `<button data-tdop="${entry.action}" class="${danger(entry.action) ? "peligro" : ""}"><b>${escapeHtml(entry.title)}</b>${entry.detail ? `<span>${escapeHtml(entry.detail)}</span>` : ""}</button>`).join("");
  document.body.appendChild(menu);
  const rect = button.getBoundingClientRect();
  menu.style.top = `${Math.min(window.innerHeight - menu.offsetHeight - 10, rect.bottom + 6)}px`;
  menu.style.left = `${Math.max(10, Math.min(window.innerWidth - menu.offsetWidth - 10, rect.right - menu.offsetWidth))}px`;
  menu.querySelectorAll("[data-tdop]").forEach((entry) => {
    entry.onclick = () => {
      menu.remove();
      void runAction(entry.dataset.tdop, item);
    };
  });
}

// src/app/screens/agenda/editors/task-editor.ts
var dialog = () => document.getElementById("dlg");
var value = (id) => document.getElementById(id)?.value ?? "";
function afterChange(message) {
  dialog()?.close();
  notices.toast(message);
  agendaState.forgetDayTasks();
  void paintYourDay();
}
async function remove2(task) {
  if (!await notices.confirm(t("agenda.taskEditor.deleteText"), { titulo: t("agenda.taskEditor.deleteTitle"), ok: t("agenda.taskEditor.delete"), peligro: true })) return;
  const { error } = await legacyDb().from("tareas").delete().eq("id", task.id);
  if (error) {
    notices.toast(t("agenda.taskEditor.couldNotDelete"), true);
    return;
  }
  afterChange(t("agenda.taskEditor.deleted"));
}
async function save(task, button) {
  const title = value("tat").trim();
  if (!title) {
    notices.toast(t("agenda.taskEditor.writeWhat"), true);
    document.getElementById("tat")?.focus();
    return;
  }
  const row2 = { titulo: title, fecha: value("taf") || todayIso(), hora: value("tah") || null, nota: value("tan").trim() || null, modificado_en: (/* @__PURE__ */ new Date()).toISOString() };
  button.disabled = true;
  const table = legacyDb().from("tareas");
  const { error } = task.id ? await table.update(row2).eq("id", task.id) : await table.insert(row2);
  button.disabled = false;
  if (error) {
    notices.toast(t("agenda.sheet.couldNotSave", { error: error.message ?? "" }), true);
    return;
  }
  afterChange(task.id ? t("agenda.taskEditor.saved") : t("agenda.taskEditor.addedOn", { date: formatDayMonth(row2.fecha) }));
}
function editHtml(task, day) {
  const time = task.hora ? String(task.hora).slice(0, 5) : "";
  return `
    <div class="fh"><div><h2>${t(task.id ? "agenda.taskEditor.title" : "agenda.taskEditor.newTitle")}</h2><div class="sm">${t("agenda.taskEditor.subtitle")}</div></div>
      <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>
    <label for="tat">${t("agenda.taskEditor.what")}</label><input id="tat" value="${escapeHtml(task.titulo ?? "")}" placeholder="${t("agenda.taskEditor.whatPlaceholder")}" maxlength="160">
    <div class="g2">
      <div><label for="taf">${t("agenda.editor.day")}</label><input id="taf" type="date" value="${escapeHtml(task.fecha ?? day ?? todayIso())}"></div>
      <div><label for="tah">${t("agenda.editor.time")} <span class="sm">${t("agenda.editor.optional")}</span></label><input id="tah" type="time" value="${escapeHtml(time)}"></div>
    </div>
    <label for="tan">${t("agenda.editor.notes")}</label><textarea id="tan" rows="3">${escapeHtml(task.nota ?? "")}</textarea>
    <div class="acts u-between">
      ${task.id ? `<button type="button" class="btn sec peligro" id="taborrar">${t("agenda.taskEditor.delete")}</button>` : "<span></span>"}
      <span class="u-flex u-gap-8"><button type="button" class="btn sec" data-cerrar>${t("agenda.editor.cancel")}</button><button type="button" class="btn" id="taok">${t(task.id ? "agenda.taskEditor.save" : "agenda.taskEditor.add")}</button></span></div>`;
}
function doneHtml(task) {
  return `
    <div class="fh"><div><h2>${t("agenda.taskEditor.doneTitle")}</h2><div class="sm">${escapeHtml(formatLongDate(task.fecha ?? todayIso()))}${task.hora ? ` · ${escapeHtml(String(task.hora).slice(0, 5))}` : ""}</div></div>
      <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>
    <div class="tarlec"><span class="tarok">${t("agenda.taskEditor.done")}</span><b>${escapeHtml(task.titulo ?? "")}</b>${task.nota ? `<p>${escapeHtml(task.nota)}</p>` : ""}</div>
    <div class="acts u-between">
      <button type="button" class="btn sec peligro" id="taborrar">${t("agenda.taskEditor.delete")}</button>
      <span class="u-flex u-gap-8"><button type="button" class="btn sec" data-cerrar>${t("common.close")}</button><button type="button" class="btn" id="tareabrir">${t("agenda.taskEditor.reopen")}</button></span></div>`;
}
async function reopen(task, day, button) {
  button.disabled = true;
  const { error } = await legacyDb().from("tareas").update({ hecha: false, modificado_en: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", task.id);
  button.disabled = false;
  if (error) {
    notices.toast(t("agenda.taskEditor.couldNotChange"), true);
    return;
  }
  agendaState.forgetDayTasks();
  void paintYourDay();
  editTask({ ...task, hecha: false }, day);
}
function show() {
  const box = dialog();
  if (!box) return;
  box.classList.add("pequena");
  if (!box.open) box.showModal();
}
function editTask(task, day) {
  const body = document.getElementById("dbody");
  if (!body) return;
  const current = task ?? {};
  body.innerHTML = current.id && current.hecha ? doneHtml(current) : editHtml(current, day);
  const ok = document.getElementById("taok");
  if (ok) ok.onclick = () => {
    void save(current, ok);
  };
  const again = document.getElementById("tareabrir");
  if (again) again.onclick = () => {
    void reopen(current, day, again);
  };
  const erase = document.getElementById("taborrar");
  if (erase) erase.onclick = () => {
    void remove2(current);
  };
  show();
}

// src/app/screens/agenda/your-day/card-buttons.ts
function swapWithNeighbour(item, action) {
  const all = legacyAgenda.dayAppointments(), open = all.filter((entry) => isOpen(entry.estado));
  const from = open.indexOf(item), to = action === "sube" ? from - 1 : from + 1;
  const neighbour = open[to];
  if (!neighbour) return;
  open[from] = neighbour;
  open[to] = item;
  void moveAppointment([...all.filter((entry) => !isOpen(entry.estado)), ...open], item.id, action);
}
function cardButton(button) {
  const [action = "", id = ""] = (button.dataset.td ?? "").split("|");
  const item = legacyAgenda.dayAppointments().find((entry) => entry.id === id);
  if (!item) return;
  if (action === "mas") openMenu(button, item);
  else if (action === "visita") {
    if (yourDayLegacy.canRecordOn(item.fecha)) appointmentLegacy.recordVisit(item.cuenta_id, item.fecha);
  } else if (action === "nueva") void newDateAfterAbsent(item);
  else if (action === "sube" || action === "baja") swapWithNeighbour(item, action);
}
function taskRow2(row2, target) {
  if (target.closest(".tdtchk, .tdtmov")) return;
  const day = legacyAgenda.selectedDate();
  editTask((agendaCache.dayTasks(day ?? "") ?? []).find((task) => task.id === row2.dataset.tarea), day);
}
function taskArrow(arrow) {
  const [direction = "0", id = ""] = (arrow.dataset.tamov ?? "").split("|");
  void moveTask(id, Number(direction));
}
function answerCardClick(kind, target) {
  if (kind === "order") {
    void orderByDistance2();
    return;
  }
  const arrow = target.closest("[data-tamov]");
  if (kind === "arrow" && arrow) {
    taskArrow(arrow);
    return;
  }
  if (kind === "newTask") {
    editTask(null, legacyAgenda.selectedDate());
    return;
  }
  const row2 = target.closest("#tdtareas .tdtarea");
  if (kind === "task" && row2) {
    taskRow2(row2, target);
    return;
  }
  const button = target.closest("[data-td]");
  if (kind === "card" && button) cardButton(button);
}

// src/app/screens/agenda/appointment-sheet.ts
var DAY_MINUTES2 = 24 * 60;
function timeText2(item, info) {
  if (item.hora) return String(item.hora).slice(0, 5);
  if (isOpen(item.estado) && isPresent(info.llegada) && info.llegada < DAY_MINUTES2) return t("agenda.sheet.around", { time: formatMinutes(info.llegada) });
  return t("agenda.sheet.noTime");
}
function timetableText(item, info) {
  const windows = info.ventanas ?? weekPlanner.attendanceWindows(item.dias, item.fecha);
  if (!windows) return "";
  if (!windows.length) return t("agenda.sheet.notAttending");
  return (info.otroCentro ? t("agenda.sheet.atCentre", { centre: info.otroCentro }) : "") + yourDayLegacy.windowsText(windows);
}
var row = (label, value2) => `<div class="vcfila"><span>${label}</span><b>${value2}</b></div>`;
function dataHtml(item, info) {
  const where = [item.centro_nombre, item.direccion, item.municipio].filter(Boolean).join(" · "), timetable = timetableText(item, info), origin = originText(item);
  return `<div class="vcdatos">
      ${row(t("agenda.sheet.when"), `${escapeHtml(capitalise(formatLongDate(item.fecha)))} · ${escapeHtml(timeText2(item, info))}`)}
      ${row(t("agenda.sheet.where"), escapeHtml(where || t("agenda.sheet.noCentre")))}
      ${timetable ? row(t("agenda.sheet.timetable"), escapeHtml(timetable)) : ""}
      ${row(t("agenda.sheet.state"), `${statePill(item.estado)}${origin ? ` <span class="sm">${origin}</span>` : ""}`)}
    </div>`;
}
function closedHtml(item) {
  if (isOpen(item.estado)) return "";
  return `<div class="banda-info vccerrada" id="vccerrada">${t("agenda.sheet.closed", { state: escapeHtml(item.estado) })}
    <span id="vccomo"></span> ${t(hasMenu(item) ? "agenda.sheet.closedReopen" : "agenda.sheet.closedFinal")}</div>`;
}
function goToButton(day, label, id, item) {
  return day && day !== item.fecha ? `<button type="button" class="btn sec" id="${id}" data-vcdia="${day}">${escapeHtml(t(label, { day: appointmentDay(day) }))}</button>` : "";
}
function buttonsHtml(item) {
  const open = isOpen(item.estado), today = todayIso();
  return `<div class="vcacts">
      <button type="button" class="btn sec" id="vcficha">${t("agenda.sheet.seeCard")}</button>
      ${pointOf(item) ? `<button type="button" class="btn sec" id="vcllegar">${t("agenda.sheet.directions")}</button>` : ""}
      ${open ? `<button type="button" class="btn sec" id="vchora">${t("agenda.sheet.changeTime")}</button><button type="button" class="btn sec" id="vcmover">${t("agenda.sheet.moveDay")}</button>` : ""}
    ${canPlanAgain(item, today) ? `<button type="button" class="btn sec" id="vcrehacer">${t("agenda.sheet.planAgain")}</button>` : ""}${item.estado === STATES.postponed ? goToButton(item.aplazada_a_fecha, "agenda.sheet.goTo", "vcirdest", item) : ""}${goToButton(item.aplazada_de_fecha, "agenda.sheet.seeDay", "vcirorig", item)}</div>
    ${open ? `<div class="vcfin">
        <button type="button" class="lnk" id="vcdescartar">${t("agenda.sheet.discard")}</button><span class="sm">${t("agenda.sheet.discardText")}</span>
        ${item.fecha >= today ? `<button type="button" class="lnk peligro" id="vcborrar">${t("agenda.sheet.delete")}</button><span class="sm">${t("agenda.sheet.deleteText")}</span>` : ""}</div>` : ""}
    <div class="acts u-end">
      <button type="button" class="btn sec" id="vcok" disabled>${t("agenda.sheet.saveNotes")}</button>
      ${open && yourDayLegacy.canRecordOn(item.fecha) ? `<button type="button" class="btn" id="vcreg">${t("agenda.sheet.record", { visit: term("visita") })}</button>` : ""}</div>`;
}
function sheetHtml(item, info) {
  return `
    <div class="fh"><div><h2>${escapeHtml(item.nombre)}</h2>${item.especialidad ? `<div class="sm">${escapeHtml(item.especialidad)}</div>` : ""}</div>
      <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>
    ${dataHtml(item, info)}
    ${closedHtml(item)}
    ${isOpen(item.estado) && info.aviso ? `<div class="banda-aviso" style="margin:0 0 12px">${escapeHtml(info.aviso)}</div>` : ""}
    <label for="vcnota">${t("agenda.sheet.notes")}</label>
    <textarea id="vcnota" rows="3" placeholder="${t("agenda.sheet.notesPlaceholder")}">${escapeHtml(item.nota ?? "")}</textarea>
    ${buttonsHtml(item)}`;
}
var dialog2 = () => document.getElementById("dlg");
var close = () => {
  dialog2()?.close();
};
async function saveNotes(item, notes, button) {
  button.disabled = true;
  const value2 = notes.value.trim();
  const { error } = await legacyDb().from("agenda").update({ nota: value2 || null }).eq("id", item.id);
  if (error) {
    button.disabled = false;
    notices.toast(t("agenda.sheet.couldNotSave", { error: error.message ?? "" }), true);
    return;
  }
  item.nota = value2;
  close();
  notices.toast(t("agenda.sheet.notesSaved"));
  refreshQuietly(item.id, false);
}
function bind5(body, item) {
  const notes = body.querySelector("#vcnota"), save3 = body.querySelector("#vcok");
  if (notes && save3) {
    notes.oninput = () => {
      save3.disabled = notes.value.trim() === (item.nota ?? "").trim();
    };
    save3.onclick = () => {
      void saveNotes(item, notes, save3);
    };
  }
  const on2 = (id, action) => {
    const button = body.querySelector(`#${id}`);
    if (button) button.onclick = action;
  };
  const closeAnd = (action) => () => {
    close();
    void runAction(action, item);
  };
  on2("vcficha", () => {
    close();
    appointmentLegacy.openAccountFromCentre(item.cuenta_id, item.centro_nombre);
  });
  on2("vcllegar", () => {
    void runAction("llegar", item);
  });
  on2("vchora", closeAnd("hora"));
  on2("vcmover", closeAnd("aplazar"));
  on2("vcdescartar", closeAnd("descartar"));
  on2("vcborrar", closeAnd("borrar"));
  on2("vcrehacer", closeAnd("rehacer"));
  on2("vcreg", () => {
    close();
    appointmentLegacy.recordVisit(item.cuenta_id, item.fecha);
  });
  body.querySelectorAll("[data-vcdia]").forEach((button) => {
    button.onclick = () => {
      close();
      agendaState.setMode("dia");
      legacyAgenda.showDay(button.dataset.vcdia ?? "");
    };
  });
}
function fillVisitResult(item) {
  if (!isDone(item.estado) || !item.cuenta_id) return;
  legacyDb().from("actividades").select("resultados, hora").eq("cuenta_id", item.cuenta_id).eq("fecha", item.fecha).limit(1).then(({ data }) => {
    const visit = data?.[0], place2 = document.getElementById("vccomo");
    if (!visit || !place2) return;
    const results = Array.isArray(visit.resultados) ? visit.resultados.filter(Boolean).join(", ") : visit.resultados ?? "";
    place2.textContent = t("agenda.sheet.recorded", { visit: term("visita"), time: visit.hora ? t("agenda.sheet.recordedAt", { time: String(visit.hora).slice(0, 5) }) : "", results: results ? `: ${results}` : "" });
  }, () => void 0);
}
function showAppointment(item) {
  const body = document.getElementById("dbody"), box = dialog2();
  if (!item || !body || !box) return;
  body.innerHTML = sheetHtml(item, yourDayLegacy.stopInfo()[item.id] ?? {});
  bind5(body, item);
  fillVisitResult(item);
  box.classList.add("pequena");
  box.showModal();
}

// src/app/screens/agenda/editors/appointment-editor.ts
var timeOf3 = (item) => item.hora ? String(item.hora).slice(0, 5) : null;
var inputValue = (id) => document.getElementById(id)?.value ?? "";
async function loadAccount(id, draft) {
  const { data } = await legacyDb().rpc("ficha_cuenta", { p_id: id });
  draft.consultations = data?.consultas ?? [];
  return data?.medico ?? null;
}
function paintCentres(draft) {
  const box = document.getElementById("nccw");
  if (!box) return;
  const list = draft.consultations.filter((item) => item.centro_nombre);
  if (list.length < 2) {
    box.innerHTML = "";
    return;
  }
  const preferred = editorLegacy.centreFromCard() ?? (list.find((item) => item.principal) ?? list[0])?.centro_nombre;
  box.innerHTML = `<label for="ncc">${t("agenda.editor.centre")}</label><select id="ncc">${list.map((item) => `<option value="${escapeHtml(item.centro_nombre)}" ${item.centro_nombre === preferred ? "selected" : ""}>${escapeHtml([item.centro_nombre, item.municipio].filter(Boolean).join(" · "))}</option>`).join("")}</select>`;
}
function windowHtml2(day) {
  return `
    <div class="fh"><div><h2>${t("agenda.editor.newTitle")}</h2><div class="sm">${t("agenda.editor.newSubtitle")}</div></div>
      <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>
    <label>${term("medico", { capital: "C" })}</label><div id="ncsel"></div>
    <div class="g2">
      <div><label for="ncf">${t("agenda.editor.day")}</label><input id="ncf" type="date" value="${escapeHtml(day)}"></div>
      <div><label for="nch">${t("agenda.editor.time")} <span class="sm">${t("agenda.editor.optional")}</span></label><input id="nch" type="time"></div>
    </div>
    <div id="nccw"></div>
    <label for="ncn">${t("agenda.editor.notes")}</label><textarea id="ncn" rows="3" placeholder="${t("agenda.sheet.notesPlaceholder")}"></textarea>
    <div class="acts u-end">
      <button class="btn sec" data-cerrar>${t("agenda.editor.cancel")}</button>
      <button class="btn" id="ncok">${t("agenda.editor.add")}</button></div>`;
}
async function sameDayDecision(accountId, day) {
  const owner = editorLegacy.viewedUserId() ?? salesTeam.currentUserId();
  const { data } = await callRpc("agenda_rango", { p_desde: day, p_hasta: day, p_usuario: owner });
  const existing = (data ?? []).find((item) => item.cuenta_id === accountId && isOpen(item.estado));
  if (!existing) return "nueva";
  const message = t("agenda.editor.duplicateText", {
    name: existing.nombre ?? "",
    date: formatLongDate(day),
    time: existing.hora ? t("agenda.editor.at", { time: String(existing.hora).slice(0, 5) }) : "",
    state: existing.estado,
    origin: existing.origen ? ` · ${existing.origen}` : ""
  });
  const choice = await notices.choose(
    t("agenda.editor.duplicateTitle"),
    message,
    [{ k: "no", t: t("agenda.editor.cancel"), cls: "sec" }, { k: "dos", t: t("agenda.editor.keepBoth"), cls: "sec" }, { k: "sust", t: t("agenda.editor.onlyNew") }]
  );
  if (!choice) return null;
  if (choice === "sust") {
    const { data: result } = await legacyDb().rpc("borrar_cita", { p_id: existing.id });
    if (result?.ok === false) {
      notices.toast(t("agenda.editor.couldNotRemovePrevious"), true);
      return null;
    }
  }
  return choice;
}
async function recentDecision(accountId, day) {
  const recent = await editorLegacy.recentContacts(accountId, day);
  if (!recent.length) return true;
  const choice = await notices.choose(
    t("agenda.editor.recentTitle"),
    t("agenda.editor.recentText", { list: editorLegacy.recentText(recent.slice(0, 3)) }),
    [{ k: "no", t: t("agenda.editor.cancel"), cls: "sec" }, { k: "nomas", t: t("agenda.editor.yesNoMore"), cls: "sec" }, { k: "si", t: t("agenda.editor.addAnyway") }]
  );
  if (!choice) return false;
  if (choice === "nomas") {
    await editorLegacy.turnOffRecentNotice();
    notices.toast(t("agenda.editor.noticeOff"));
  }
  return true;
}
async function placeByTime(day, owner, accountId, time) {
  const { data } = await callRpc("agenda_rango", { p_desde: day, p_hasta: day, p_usuario: owner });
  const open = (data ?? []).filter((item) => item.usuario_id === owner && isOpen(item.estado));
  const mine = open.filter((item) => item.cuenta_id === accountId && timeOf3(item) === time).pop();
  if (!mine) return;
  const rest = open.filter((item) => item !== mine);
  let index = rest.findIndex((item) => {
    const other = timeOf3(item);
    return other !== null && other > time;
  });
  if (index < 0) {
    index = 0;
    rest.forEach((item, position) => {
      const other = timeOf3(item);
      if (other !== null && other <= time) index = position + 1;
    });
  }
  rest.splice(index, 0, mine);
  if (rest.some((item, position) => item !== open[position])) {
    await saveOrder(rest);
    agendaCache.forgetDay(day);
  }
}
function centreOf(draft, picked) {
  const main = draft.consultations.find((item) => item.principal) ?? draft.consultations[0];
  return [inputValue("ncc"), main?.centro_nombre, picked.centro_nombre, picked.centro].find((name) => Boolean(name)) ?? null;
}
async function write(picked, draft, options2) {
  const day = inputValue("ncf"), inAgenda = currentScreen() === "agenda";
  return appointmentLegacy.write("guardar_cita", { p: {
    cuenta_id: picked.id,
    fecha: day,
    hora: inputValue("nch") || null,
    centro_nombre: centreOf(draft, picked),
    estado: STATES.planned,
    origen: orFallback(options2.origen, inAgenda ? "Agenda" : "Ficha"),
    usuario_id: editorLegacy.viewedUserId(),
    nota: inputValue("ncn").trim(),
    op_id: `c-${picked.id}-${day}-${Date.now()}`
  } });
}
async function save2(draft, options2, button) {
  const picked = draft.picked;
  if (!picked) {
    notices.toast(t("agenda.editor.choose", { professional: term("medico", { article: "un" }) }), true);
    return;
  }
  const day = inputValue("ncf"), time = inputValue("nch");
  if (!await sameDayDecision(picked.id, day) || !await recentDecision(picked.id, day)) return;
  button.disabled = true;
  const result = await write(picked, draft, options2);
  button.disabled = false;
  if (result?.error) {
    notices.toast(t("agenda.editor.couldNot", { error: result.error.message ?? "" }), true);
    return;
  }
  if (time) await placeByTime(day, editorLegacy.viewedUserId() ?? salesTeam.currentUserId(), picked.id, time);
  document.getElementById("dlg")?.close();
  notices.toast(t("agenda.editor.added", { date: formatDayMonth(day) }));
  if (currentScreen() === "agenda") refreshQuietly();
  else void load();
}
async function newAppointment(accountId, day, options2 = {}) {
  const draft = { picked: null, consultations: [] };
  if (accountId) draft.picked = await loadAccount(accountId, draft);
  const shown = legacyAgenda.selectedDate(), today = todayIso();
  const body = document.getElementById("dbody"), box = document.getElementById("dlg");
  if (!body || !box) return;
  body.innerHTML = windowHtml2(day ?? (currentScreen() === "agenda" && shown && shown >= today ? shown : today));
  paintCentres(draft);
  editorLegacy.pickAccount(document.getElementById("ncsel"), draft.picked, async (account) => {
    draft.picked = account;
    await loadAccount(account.id, draft);
    paintCentres(draft);
  });
  const ok = document.getElementById("ncok");
  if (ok) ok.onclick = () => {
    void save2(draft, options2, ok);
  };
  box.classList.add("pequena");
  box.showModal();
}
export {
  answerCardClick,
  applyTaskFolding,
  bindWeekButton,
  changeTime,
  closeMonth,
  dueList,
  editTask,
  endWorkingDay,
  loadAgenda,
  markQueuedVisits,
  markTraffic,
  metricsHtml,
  newAppointment,
  openDayMenu,
  openMenu,
  openTray,
  paintOpenWeek,
  paintStrip,
  paintTrayButtons,
  paintWeekSidebar,
  paintYourDay,
  prepareRouteStops,
  refreshAfterChange,
  refreshMetrics,
  refreshOpenMonth,
  refreshOpenTray,
  refreshQuietly,
  reloadMetrics,
  renderMonth,
  repaintSmoothly,
  requestTraffic,
  rescheduleAppointments,
  runAction,
  saveOrder,
  shareWeek,
  showAppointment,
  showDay,
  startWorkingDay,
  toggleMonth
};
