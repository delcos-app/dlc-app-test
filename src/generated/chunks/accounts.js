// delcos-shared:src/app/i18n/index.ts
var shared = globalThis["__delcosModules"]["i18n/index"];
var pick = (name) => shared[name];
var registerMessages = /* @__PURE__ */ pick("registerMessages");
var t = /* @__PURE__ */ pick("t");

// src/app/i18n/es/chunks/accounts/accounts.ts
var accounts = {
  list: {
    searching: "Buscando {contacts}…",
    searchingShort: "Buscando…",
    couldNotLoad: "No se ha podido cargar la lista",
    notResponding: " (la conexión no responde)",
    retry: "Reintentar",
    count: '<b>{count}</b> {contacts} <span class="sm">· {ms} ms</span>',
    noMatches: "Ningún registro cumple estos filtros.",
    sortBy: "Ordenar por esta columna",
    urgent: "Urgente",
    chipSearch: "Búsqueda: {text}",
    chipUrgent: "Solo urgentes",
    chipMine: "De mi cartera",
    chipNeverVisited: "Sin visitar nunca"
  },
  columns: {
    noReporting: "Sin reporting",
    noReportingTitle: "Solo {visit} presencial: sin informes ni feedback",
    unassigned: "Sin asignar",
    withAccess: "Con acceso",
    accessDisabled: "Acceso desactivado",
    noAccess: "Sin acceso",
    panelTitle: "Columnas",
    back: "‹ Volver",
    panelNote: "Marca las que quieres ver y ordénalas con las flechas. Se aplica al momento. El ancho se cambia arrastrando el borde de cada cabecera.",
    alwaysVisible: "siempre visible",
    up: "Subir",
    down: "Bajar",
    restore: "Restaurar las columnas",
    keepOne: "Deja al menos una columna"
  },
  base: {
    noConnection: "Sin conexión y sin copia guardada de esta ficha.",
    cachedNotice: "Sin conexión · ficha guardada en este dispositivo",
    urgent: "Urgente",
    noReporting: "Sin reporting",
    noReportingTitle: "Solo {visit} presencial: sin informes ni feedback",
    code: " · código {code}",
    record: "Registrar {visit}",
    edit: "Editar ficha",
    markUrgent: "Marcar urgente",
    unmarkUrgent: "Quitar urgente",
    addToAgenda: "+ Añadir a mi agenda",
    salesRep: "Comercial: {names}",
    noAddress: "Sin dirección",
    phone: "Teléfono: {phone}",
    directions: "Cómo llegar",
    byPhone: " · Por teléfono",
    byVideo: " · Por videollamada",
    noResult: "Sin resultado",
    samples: " · {count} muestras",
    next: "Próxima: {date} · {action}",
    editVisit: "Editar",
    noVisits: "Todavía no hay {visits}.",
    salesTitle: "Ventas y {patients}",
    timetableMissing: "⚠ <b>Falta su horario de atención.</b> Sin él, las rutas y el planificador no saben qué días y horas atiende.",
    completeTimetable: "Completar horario",
    unitsTitle: "Unidades atribuidas",
    unitsToday: "Hoy",
    unitsWeek: "Semana",
    unitsMonth: "Mes",
    unitsQuarter: "Trimestre",
    unitsYear: "Año",
    unitsTotal: "Total",
    evolution: "Evolución",
    unitsSummary: "{count} {prescriptions} · última el {date} · ",
    noPrescriptions: "Todavía sin {prescriptions} registradas."
  },
  sales: {
    repTitle: "Comercial asignado",
    loading: "Cargando…",
    save: "Guardar",
    repNote: "Las ventas nuevas se atribuyen al comercial asignado en ese momento. Las anteriores no cambian.",
    noRep: "Sin comercial",
    couldNotAssign: "No se ha podido asignar",
    assigned: "Comercial asignado",
    patientLine: "{units} uds. · {orders} pedidos",
    lastOrder: " · último {date}",
    seeAll: "Ver los {count} {patients}",
    associatedTitle: "{patients} asociados",
    associated: "Asociados",
    withOrders: "Con pedidos",
    withoutOrders: "Sin pedidos",
    noneAssociated: "Todavía no tiene {patients} asociados."
  },
  portal: {
    title: "Portal",
    toDeliver: "{count} material por entregar",
    unread: "{count} sin leer",
    requested: "Pedido el {date}",
    delivered: "Entregado",
    messages: "Mensajes",
    reply: "Contestar",
    send: "Enviar",
    deliveredDone: "Material entregado: se le avisa",
    writeMessage: "Escribe el mensaje",
    sent: "Mensaje enviado",
    productsTitle: "Productos del centro",
    productsNote: "Lo que puede pedir desde su portal. Precio sin IVA; si lo dejas vacío, el de tarifa.",
    tariff: "Tarifa {price} sin IVA",
    tariffPlaceholder: "Tarifa",
    priceFor: "Precio de {name} para el centro",
    noProducts: "No hay productos activos.",
    saveProducts: "Guardar productos",
    productsSaved: "Productos del centro guardados ({count})"
  },
  access: {
    title: "Acceso a la plataforma",
    hasAccess: "Tiene acceso",
    asEmail: " como <b>{email}</b>",
    disabled: " (desactivado)",
    centreUses: "pide la reposición de sus productos, material y escribe a su comercial",
    portalUses: "ve su portal: cifras agregadas, sin importes ni datos de personas",
    impersonate: "👤 Impersonalizar",
    centreCan: "Puede tener acceso para pedir la reposición de los productos que le des de alta, pedir material y escribir a su comercial.",
    portalCan: "Puede tener acceso a su portal (cifras agregadas de {prescriptions}), pedir material y escribir a su comercial. No verá importes ni datos de {patients}.",
    give: "Dar acceso",
    email: "Correo",
    emailPlaceholder: "nombre@correo.com",
    invalidEmail: "Escribe un correo válido",
    noPermission: "Tu rol no puede dar acceso",
    notYours: "Solo puedes dar acceso a {professionals} de tu cartera",
    alreadyHas: "Esta ficha ya tiene acceso",
    emailInUse: "Ese correo ya es de otro usuario",
    emailWrong: "El correo no es válido",
    noPortalRole: "No hay ningún rol con acceso al portal: créalo en Configuración → Roles",
    couldNotGive: "No se ha podido dar acceso",
    couldNotCreate: "No se ha podido crear el acceso: {error}",
    created: '<b class="u-ok">Acceso creado.</b> Contraseña temporal: <b>{password}</b>. Pásasela y que la cambie al entrar.'
  },
  history: {
    title: "Historial de cambios",
    undo: "Deshacer",
    none: "Sin cambios registrados."
  },
  proposal: {
    title: "Datos enviados desde su portal",
    toReview: "Por revisar",
    sent: "{who} los envió el {date}. Pásalos a la ficha con «Editar la ficha» y márcalos como revisados.",
    phone: "Teléfono",
    email: "Correo",
    newCentre: "Centro nuevo",
    noTimetable: "Sin horario",
    notes: "Notas",
    edit: "Editar la ficha",
    reviewed: "Marcar como revisado",
    noPermission: "No tienes permiso para revisarlo",
    couldNotMark: "No se ha podido marcar",
    marked: "Marcado como revisado"
  },
  card: {
    stateTitle: "Estado",
    photo: "1 foto",
    photos: "{count} fotos",
    addPhotos: "Añadir fotos",
    presented: "Presentado: {list}",
    samplesTitle: "Muestras este año",
    samplesGiven: "{given} de {max}",
    samplesOutOfTime: "Fuera de plazo",
    samplesNoneLeft: "Sin muestras este año",
    eventsTitle: "Eventos",
    depositTitle: "Material en depósito",
    depositUnits: "{units} unidades de {products}",
    oneProduct: "1 producto",
    products: "{count} productos",
    oneBatchExpires: "1 lote caduca",
    batchesExpire: "{count} lotes caducan",
    inLessThan60Days: " en menos de 60 días",
    depositNone: "Sin material en depósito.",
    depositOpen: "Abrir el depósito",
    depositLeave: "Dejar material en depósito",
    surgeriesTitle: "{Surgeries}",
    surgery: "{Surgery}",
    tendersTitle: "Concursos",
    tenderExpired: "vencido",
    tenderExpiresOn: "vence el {date}",
    equipmentTitle: "Equipos instalados",
    equipment: "Equipo",
    serial: " · nº {serial}",
    equipmentNone: "Sin equipos instalados.",
    addEquipment: "+ Equipo",
    centreProfessionals: "Los {professionals} que atienden aquí y su horario",
    seeCentreProfessionals: "Ver sus {professionals}",
    reactivate: "Volver a dar de alta",
    archive: "Dar de baja",
    delete: "Eliminar la ficha"
  }
};

// src/app/i18n/es/chunks/accounts/accounts-editor.ts
var accountsEditor = {
  editor: {
    editTitle: "Editar ficha",
    newCentre: "Nuevo centro",
    centreSubtitle: "Empresa, tienda, oficina u otro local",
    personSubtitle: "{professional} con sus centros",
    centreName: "Nombre del centro",
    personName: "Apellidos, Nombre",
    centreNamePlaceholder: "CENTRO SANT JORDI",
    personNamePlaceholder: "GARCIA LOPEZ, ANA",
    area: "Área",
    phone: "Teléfono",
    email: "Email",
    contact: "Contacto (secretaría, teléfono, email)",
    noReporting: "Sin reporting",
    noReportingHint: "Solo {visit} presencial: no quiere informes ni feedback.",
    note: "Nota",
    addConsultation: "+ Añadir {consultation}",
    saveChanges: "Guardar cambios",
    create: "Crear",
    couldNotOpen: "No se ha podido abrir: {error}"
  },
  save: {
    writeName: "Escribe el nombre",
    fillField: "Rellena «{field}»",
    nameFormat: "Escribe el nombre como APELLIDOS, NOMBRE",
    mayExist: "Puede que ya exista",
    mayExistHint: "Si es la misma persona, cancela y abre su ficha. Si no lo es, vuelve a pulsar Crear.",
    createAnyway: "Crear de todos modos",
    saving: "Guardando…",
    couldNotSave: "No se ha podido guardar: {error}",
    saved: "Ficha guardada",
    created: "Creado correctamente"
  },
  salesperson: {
    label: "Comercial asignado",
    hint: "Las ventas nuevas se atribuyen al comercial asignado en ese momento.",
    none: "Sin comercial",
    couldNotChange: "No se ha podido cambiar el comercial"
  },
  consultation: {
    main: "Principal",
    upTitle: "Subir (más prioridad)",
    up: "Subir",
    downTitle: "Bajar (menos prioridad)",
    down: "Bajar",
    remove: "Quitar",
    centre: "Centro",
    floor: "Planta",
    floorPlaceholder: "p. ej. 2.ª planta",
    room: "Sala o despacho",
    roomPlaceholder: "p. ej. Despacho 14",
    directions: "Indicaciones para llegar",
    directionsPlaceholder: "p. ej. Entrar por la puerta B y preguntar en recepción",
    phone: "Teléfono {ofTheConsultation}",
    phonePlaceholder: "Si es distinto del del centro",
    days: "Días y horario de {visit}",
    /** The start of the label above: the centre account renames it */
    daysStart: "Días y horario"
  },
  days: {
    morning: "Mañana",
    afternoon: "Tarde",
    noTime: "Sin hora",
    weekMornings: "L-V mañanas",
    weekAfternoons: "L-V tardes",
    clear: "Limpiar"
  },
  centre: {
    noName: "Sin nombre",
    unlinked: "Sin enlazar",
    unlinkedTitle: "{thisConsultation} aún no está enlazada con un centro de la base",
    noAddress: "Sin dirección",
    today: "Hoy {hours}",
    noOpening: "Sin horario de apertura",
    noLocation: "Sin ubicación: no saldrá en rutas ni en el mapa",
    directions: "Cómo llegar",
    edit: "Editar centro",
    link: "Enlazar con un centro",
    change: "Cambiar"
  },
  private: {
    noCentre: "Sin centro",
    noAddressYet: "Sin dirección todavía",
    addAddressHint: "Añade la dirección para que salga en rutas y en el mapa",
    edit: "Editar {theConsultation}",
    addAddress: "Añadir la dirección",
    hint: "Dónde atiende (en su casa, un despacho…). Se guarda con la ficha.",
    address: "Dirección",
    addressPlaceholder: "Calle, número, piso",
    located: "✓ Ubicada",
    withLocation: "con tu ubicación: revisa la dirección",
    elsewhere: "Esa dirección sale en {place}, no en {town}: revísala (no se ha guardado el punto)",
    noGeolocation: "Este dispositivo no da la ubicación",
    locating: "Localizando…",
    locationFailed: "No se ha podido obtener tu ubicación: revisa el permiso de ubicación del navegador",
    writeTown: "Escribe al menos la población",
    /** The name the private consultation is saved with */
    ready: "{privateConsultation} lista: se guarda con la ficha",
    readyNoPoint: "Dirección puesta, sin punto en el mapa: se guarda con la ficha"
  },
  centreForm: {
    editTitle: "Editar centro",
    newTitle: "Centro nuevo",
    name: "Nombre del centro",
    namePlaceholder: "p. ej. Centro Sagrada Família",
    phone: "Teléfono",
    address: "Dirección",
    postcode: "Código postal",
    town: "Población",
    province: "Provincia",
    located: "✓ Ubicado",
    notLocated: "Sin ubicación todavía",
    findOnMap: "🔎 Buscar la dirección en el mapa",
    searching: "Buscando…",
    opening: "Horario de apertura",
    closed: "Cerrado",
    hoursPlaceholder: "8:00-20:00",
    copyMonday: "Copiar el horario del lunes al resto de días laborables",
    save: "Guardar cambios",
    create: "Crear centro",
    writeAddress: "Escribe la dirección o la población",
    notFound: "No se ha encontrado esa dirección. Prueba con calle, número y población.",
    elsewhere: "Esa dirección sale en {place}, no en {town}: revísala",
    writeName: "Escribe el nombre del centro",
    noPermission: "no tienes permiso",
    couldNotSave: "No se ha podido guardar el centro",
    updated: "Centro actualizado",
    created: "Centro creado y elegido"
  },
  centreAccount: {
    title: "Dirección del centro",
    street: "Calle y número",
    streetPlaceholder: "p. ej. Calle Mayor 12",
    hours: "Horario de atención",
    elsewhere: "La dirección sale en {place}, no en {town}: se guarda sin situarla en el mapa"
  },
  picker: {
    away: " · a {distance}",
    oneDoctor: "{count} médico",
    doctors: "{count} médicos",
    none: "No hay ningún centro con ese nombre.",
    fromLocation: "Datos rellenados con tu ubicación: revísalos.",
    fromLocationNoName: "Dirección rellenada con tu ubicación. El mapa no conoce el nombre del centro: escríbelo.",
    located: "✓ Ubicado",
    seeOnMap: "Ver en el mapa",
    searchPlaceholder: "Busca el centro por nombre, calle o población",
    imHere: "📍 Estoy aquí",
    newCentre: "+ Centro nuevo",
    private: "{privateConsultation} (sin centro)",
    createNamed: "+ Crear «{name}» como centro nuevo"
  },
  portfolio: {
    loading: "Cargando la cartera…",
    title: "Cartera de {name}",
    search: "Buscar dentro de la cartera",
    notVisited: "sin visitar",
    card: "Ficha",
    remove: "Quitar",
    none: "Sin {assigned}.",
    assignMore: "Asignar más {professionals}",
    removeText: "Dejará de verlo en su cartera. El histórico de {visits} no cambia.",
    removeTitle: "¿Quitar de la cartera?",
    noPermission: "No tienes permiso",
    removed: "Quitado de la cartera"
  },
  status: {
    couldNotChange: "No se ha podido cambiar: {error}",
    changed: "Estado: {state}",
    couldNot: "No se ha podido: {error}",
    out: "Ficha dada de baja",
    oneAppointmentRemoved: " · {count} cita quitada de la agenda",
    appointmentsRemoved: " · {count} citas quitadas de la agenda",
    backIn: "Ficha dada de alta de nuevo"
  }
};

// src/app/i18n/es/chunks/accounts/accounts-map.ts
var accountsMap = {
  needsConnection: "El mapa necesita conexión.",
  loading: "Cargando puntos…",
  couldNotLoad: "No se ha podido cargar el mapa: {error}",
  openCard: "Abrir ficha",
  urgent: "Urgente sin visitar",
  found: "{shown} con ubicación de {total} encontrados"
};

// src/app/i18n/es/chunks/accounts/accounts-more.ts
var accountsMore = {
  duplicates: {
    title: "Duplicados",
    subtitle: "Revisa fichas repetidas y unifícalas sin perder la lista",
    back: "← Volver",
    backToQuality: "‹ Calidad del dato",
    searchAgain: "Volver a buscar parecidos",
    pickPair: "Elige una pareja para revisarla",
    pickPairHint: "Pulsa «Comparar» en la lista de la izquierda y aquí verás las dos fichas lado a lado. Al terminar, pasas a la siguiente.",
    adminOnly: "Solo administración puede unificar fichas.",
    searchingPending: "Buscando fichas pendientes…",
    searchingSimilar: "Buscando nombres parecidos…",
    pendingTitle: "Pendientes de unificar",
    pendingHint: "Fichas marcadas como posible duplicado al darlas de alta.",
    code: "Código {code}",
    looksLike: "Se parece a {name}",
    noPair: "Sin pareja identificada",
    compare: "Comparar",
    notDuplicate: "No es duplicado",
    notDuplicates: "No son duplicados",
    card: "Ficha",
    noPending: "No hay fichas pendientes de unificar.",
    similarTitle: "Nombres parecidos",
    similarHint: "Parejas con un parecido del 80% o más. Si no son la misma persona, márcalas como distintas y no volverán a salir.",
    codes: "códigos {a} y {b}",
    noSimilar: "Sin parejas parecidas pendientes de revisar.",
    kindLabel: "Tipo de ficha",
    centres: "Centros",
    couldNotSave: "No se ha podido guardar",
    markedDifferent: "Marcadas como distintas",
    markedDifferentPanel: "Marcadas como personas distintas.",
    nextPair: "Elige la siguiente pareja de la lista."
  },
  compare: {
    loading: "Cargando las dos fichas…",
    gone: "Alguna de las dos fichas ya no existe.",
    title: "Comparar fichas",
    hint: "Elige cuál se conserva y con qué datos. {Consultations}, {visits}, citas y cartera se juntan en la que quede.",
    summary: "{consultations} {consultationsWord} · {visits} {visitsWord}",
    kept: "Se conserva esta",
    goes: "Desaparece",
    seeCard: "Ver ficha de {code}",
    empty: "(vacío)",
    same: "Los datos principales coinciden.",
    unify: "Unificar",
    unifying: "Unificando…",
    confirmText: "Desaparece la ficha de {name}.\nNo se puede deshacer desde la app.",
    confirmTitle: "¿Unificar fichas?",
    couldNotUnify: "No se ha podido unificar",
    unified: "Fichas unificadas",
    unifiedPanel: "Fichas unificadas.",
    keepOne: "Deja marcado al menos un centro o {consultation}",
    couldNotTidy: "Unificadas, pero no se ha podido terminar de ordenar los centros: {error}",
    noAddress: "Sin dirección",
    centreAddress: "Dirección del centro",
    keepMarked: "Se conserva la marcada.",
    from: "· de {name}",
    noAddresses: "Ninguno de los dos tiene dirección.",
    professionalsMove: "Los de los dos centros ({a} + {b}) pasan al que se conserva. Si alguno estaba en los dos, queda una sola vez.",
    centresAndConsultations: "Centros y {consultations}",
    keepMarkedMany: "Se conservan los marcados en la ficha que queda: puedes quedarte con los dos."
  },
  fields: {
    name: "Nombre",
    area: "Área",
    phone: "Teléfono",
    email: "Email",
    contact: "Contacto",
    note: "Nota",
    commercialState: "Estado comercial"
  },
  centre: {
    title: "Centro",
    couldNotOpen: "No se ha podido abrir el centro{error}.",
    noAddress: "Sin dirección",
    call: "Llamar · {phone}",
    directions: "Cómo llegar",
    edit: "Editar centro",
    commercialCard: "Ficha comercial",
    timetable: "Horario",
    add: "+ Añadir",
    floor: "Planta {value}",
    room: "Sala {value}",
    attends: "Atiende: {days}",
    card: "Ficha",
    appointment: "+ Cita",
    remove: "Quitar",
    removeLabel: "Quitar a {name} del centro",
    nobody: "Todavía no hay {professionals} en este centro.",
    addThem: " Añádelos con «+ Añadir».",
    noPermission: "No puedes cambiar la ficha de {name}",
    couldNotAdd: "No se ha podido añadir",
    alreadyThere: "{name} ya estaba en el centro: queda enlazado",
    added: "{name} añadido a {centre}",
    removeText: "Se quita a {name} de {centre}: {thisConsultation} desaparece de su ficha.",
    removeOnly: " Era su única {consultation}: su ficha se queda sin centro.",
    removeTitle: "¿Quitar del centro?",
    couldNotRemove: "No se ha podido quitar",
    removed: "{name} ya no está en {centre}"
  },
  centreEditor: {
    title: "Editar centro",
    subtitle: "Los cambios se pasan a {consultations} enlazadas a este centro",
    name: "Nombre del centro",
    phone: "Teléfono",
    address: "Dirección",
    postcode: "Código postal",
    town: "Población",
    province: "Provincia",
    opening: "Horario de apertura",
    closed: "Cerrado",
    hoursPlaceholder: "8:00-20:00",
    back: "Volver",
    save: "Guardar cambios",
    writeName: "Escribe el nombre del centro",
    elsewhere: "La dirección sale en {place}, no en {town}: se guarda sin mover el punto del mapa",
    couldNotSave: "No se ha podido guardar",
    saved: "Centro guardado"
  },
  nearby: {
    noLocation: "Este dispositivo no tiene ubicación",
    locating: "Localizando…",
    button: "Cerca de mí",
    couldNotSearch: "No se ha podido buscar: {error}",
    noPosition: "No se ha podido obtener tu ubicación. Revisa los permisos del navegador.",
    count: "<b>{count}</b> {professionals} a menos de 10 km de ti",
    back: "Volver a la búsqueda",
    urgent: "Urgente",
    noReporting: "Sin reporting",
    noReportingTitle: "Solo {visit} presencial: sin informes ni feedback",
    none: "No hay {professionals} con ubicación a menos de 10 km."
  }
};

// src/app/i18n/es/chunks/accounts/index.ts
var texts = { accounts, accountsEditor, accountsMap, accountsMore };

// src/app/screens/accounts/texts.ts
registerMessages(texts);

// delcos-shared:src/app/legacy/bridge.ts
var shared2 = globalThis["__delcosModules"]["legacy/bridge"];
var pick2 = (name) => shared2[name];
var accessLegacy = /* @__PURE__ */ pick2("accessLegacy");
var accountCardLegacy = /* @__PURE__ */ pick2("accountCardLegacy");
var accountColumnsLegacy = /* @__PURE__ */ pick2("accountColumnsLegacy");
var accountListLegacy = /* @__PURE__ */ pick2("accountListLegacy");
var agendaActions = /* @__PURE__ */ pick2("agendaActions");
var appLegacy = /* @__PURE__ */ pick2("appLegacy");
var appointmentLegacy = /* @__PURE__ */ pick2("appointmentLegacy");
var cachedRpc = /* @__PURE__ */ pick2("cachedRpc");
var callRpc = /* @__PURE__ */ pick2("callRpc");
var cardBaseLegacy = /* @__PURE__ */ pick2("cardBaseLegacy");
var cardSectionsLegacy = /* @__PURE__ */ pick2("cardSectionsLegacy");
var commercialStates = /* @__PURE__ */ pick2("commercialStates");
var currentScreen = /* @__PURE__ */ pick2("currentScreen");
var editorLegacy = /* @__PURE__ */ pick2("editorLegacy");
var goTo = /* @__PURE__ */ pick2("goTo");
var icon = /* @__PURE__ */ pick2("icon");
var legacyDb = /* @__PURE__ */ pick2("legacyDb");
var legacyIcons = /* @__PURE__ */ pick2("legacyIcons");
var notices = /* @__PURE__ */ pick2("notices");
var permissions = /* @__PURE__ */ pick2("permissions");
var portalLegacy = /* @__PURE__ */ pick2("portalLegacy");
var qualityLegacy = /* @__PURE__ */ pick2("qualityLegacy");
var relatedLegacy = /* @__PURE__ */ pick2("relatedLegacy");
var salesTeam = /* @__PURE__ */ pick2("salesTeam");
var term = /* @__PURE__ */ pick2("term");

// delcos-shared:src/app/screens/privacy/person-data.ts
var shared3 = globalThis["__delcosModules"]["screens/privacy/person-data"];
var pick3 = (name) => shared3[name];
var addPrivacySection = /* @__PURE__ */ pick3("addPrivacySection");

// delcos-shared:src/app/services/date-format.ts
var shared4 = globalThis["__delcosModules"]["services/date-format"];
var pick4 = (name) => shared4[name];
var capitalise = /* @__PURE__ */ pick4("capitalise");
var formatShortDate = /* @__PURE__ */ pick4("formatShortDate");

// delcos-shared:src/app/services/format.ts
var shared5 = globalThis["__delcosModules"]["services/format"];
var pick5 = (name) => shared5[name];
var escapeHtml = /* @__PURE__ */ pick5("escapeHtml");
var formatNumber = /* @__PURE__ */ pick5("formatNumber");

// delcos-shared:src/app/services/values.ts
var shared6 = globalThis["__delcosModules"]["services/values"];
var pick6 = (name) => shared6[name];
var orFallback = /* @__PURE__ */ pick6("orFallback");
var sum = /* @__PURE__ */ pick6("sum");

// delcos-shared:src/app/screens/visit/card-block.ts
var shared7 = globalThis["__delcosModules"]["screens/visit/card-block"];
var pick7 = (name) => shared7[name];
var visitBlock = /* @__PURE__ */ pick7("visitBlock");
var visitConsultation = /* @__PURE__ */ pick7("visitConsultation");

// delcos-shared:src/app/screens/visit/edit.ts
var shared8 = globalThis["__delcosModules"]["screens/visit/edit"];
var pick8 = (name) => shared8[name];
var editVisit = /* @__PURE__ */ pick8("editVisit");

// src/app/screens/accounts/card/base.ts
var WORKDAYS = ["L", "M", "X", "J", "V"];
var SHOWN_VISITS = 10;
var SKELETON = '<div class="skel" style="width:50%"></div><div class="skel"></div><div class="skel" style="width:80%"></div>';
var body = () => document.getElementById("fbody");
function headerHtml(account) {
  const urgent = account.urgente ? `<span class="pill p-urg">${t("accounts.base.urgent")}</span> ` : "";
  const noReporting = account.sin_reporting ? `<span class="pill p-sr" title="${t("accounts.base.noReportingTitle", { visit: term("visita") })}">${t("accounts.base.noReporting")}</span> ` : "";
  return `<div class="fh">
      <div><h2>${urgent}${noReporting}${escapeHtml(account.nombre)}</h2>
        <div class="sm">${escapeHtml(account.especialidad ?? "")}${account.area ? ` · ${escapeHtml(account.area)}` : ""}${t("accounts.base.code", { code: escapeHtml(account.codigo) })}</div></div>
      <button class="x" id="fx" aria-label="${t("common.close")}">✕</button>
    </div>`;
}
function actionsHtml(account) {
  const record = cardBaseLegacy.canRecord(), edit = accountCardLegacy.canEditType(account.tipo);
  if (!record && !edit) return "";
  return `<div class="acts">
      ${record ? `<button class="btn" data-act="visita" data-id="${account.id}">${t("accounts.base.record", { visit: term("visita") })}</button>` : ""}
      ${edit ? `<button class="btn sec" data-act="editar" data-id="${account.id}">${t("accounts.base.edit")}</button>` : ""}
      ${edit ? `<button class="btn ${account.urgente ? "sec" : "warn"}" data-act="urgente" data-id="${account.id}" data-urg="${account.urgente ? 1 : 0}">${t(account.urgente ? "accounts.base.unmarkUrgent" : "accounts.base.markUrgent")}</button>` : ""}
      <button class="btn sec" data-agendar="${account.id}">${t("accounts.base.addToAgenda")}</button>
    </div>`;
}
function stateHtml(account, salesReps) {
  const state = cardBaseLegacy.canEdit() ? `<select data-estado="${account.id}" style="max-width:240px">${cardBaseLegacy.states().map((value4) => `<option ${value4 === account.estado_comercial ? "selected" : ""}>${escapeHtml(value4)}</option>`).join("")}</select>` : `<span class="pill p-est">${escapeHtml(account.estado_comercial)}</span>`;
  return `<div class="blk"><h3>${t("accounts.card.stateTitle")}</h3>
      <div>${state}</div>
      ${salesReps.length ? `<div class="sm u-mt-6">${t("accounts.base.salesRep", { names: salesReps.map(escapeHtml).join(", ") })}</div>` : ""}
    </div>`;
}
function consultationHtml(consultation) {
  const days = consultation.dias ?? {};
  const address = escapeHtml([consultation.direccion, consultation.cp, consultation.municipio].filter(Boolean).join(", "));
  const room = [consultation.planta, consultation.sala].filter(Boolean).join(" · ");
  return `<div class="blk"><h3>${escapeHtml(orFallback(consultation.centro_nombre, term("consulta", { capital: "C", adjective: "privado" })))}</h3>
      <div>${address || `<span class="sm">${t("accounts.base.noAddress")}</span>`}</div>
      ${room ? `<div class="sm">${escapeHtml(room)}</div>` : ""}
      ${consultation.indicaciones ? `<div class="sm">${escapeHtml(consultation.indicaciones)}</div>` : ""}
      ${consultation.telefono ? `<div class="sm">${t("accounts.base.phone", { phone: escapeHtml(consultation.telefono) })}</div>` : ""}
      <div class="dias u-mt-8">${WORKDAYS.map((day) => `<span class="${days[day] ? "on" : ""}">${day}</span>`).join("")}</div>
      ${WORKDAYS.filter((day) => days[day]).map((day) => `<div class="sm">${day}: ${escapeHtml(days[day])}</div>`).join("")}
      ${consultation.lat ? `<div class="sm u-mt-6"><button class="lnk" type="button" data-nav="${cardBaseLegacy.directionsAttribute([consultation.lat, consultation.lon ?? 0])}">${t("accounts.base.directions")}</button></div>` : ""}
    </div>`;
}
function visitHtml(visit, canRecord) {
  const mode = visit.modo === "telefono" ? t("accounts.base.byPhone") : visit.modo === "video" ? t("accounts.base.byVideo") : "";
  const results = orFallback((visit.resultados ?? []).join(" + "), t("accounts.base.noResult"));
  return `<div data-vrow="${visit.id}" style="padding:7px 0;border-top:1px solid var(--line);display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
        <span><b>${formatShortDate(visit.fecha)}</b>${mode} · ${escapeHtml(results)}
          ${visit.muestras ? t("accounts.base.samples", { count: visit.muestras }) : ""}
          ${visit.nota ? `<div class="sm">${escapeHtml(visit.nota)}</div>` : ""}
          ${visit.proxima_fecha ? `<div class="sm">${t("accounts.base.next", { date: formatShortDate(visit.proxima_fecha), action: escapeHtml(visit.proxima_accion ?? "") })}</div>` : ""}</span>
        ${canRecord ? `<button class="btn sec chico" data-editv='${escapeHtml(JSON.stringify(visit))}'>${t("accounts.base.editVisit")}</button>` : ""}
      </div>`;
}
function visitsHtml(visits) {
  const canRecord = cardBaseLegacy.canRecord();
  const list = visits.length ? visits.slice(0, SHOWN_VISITS).map((visit) => visitHtml(visit, canRecord)).join("") : `<div class="sm">${t("accounts.base.noVisits", { visits: term("visita", { number: "p", adjective: "registrado" }) })}</div>`;
  return `<div class="blk"><h3>${term("visita", { number: "p", capital: "C" })}</h3>
      ${list}</div>`;
}
function cardHtml(data, cached) {
  const account = data.medico, consultations = data.consultas ?? [], visits = data.visitas ?? [];
  const forVisit = visitConsultation(consultations);
  return `${cached ? `<div class="cacheaviso">${t("accounts.base.cachedNotice")}</div>` : ""}
    ${headerHtml(account)}
    ${actionsHtml(account)}
    ${visitBlock(account, consultations, visits)}
    ${stateHtml(account, data.comerciales ?? [])}
    ${consultations.filter((consultation) => consultation !== forVisit).map(consultationHtml).join("")}
    ${visitsHtml(visits)}
    <div id="fzcampos"></div>
    <section class="blk fventas" id="fventas"><h3>${t("accounts.base.salesTitle", { patients: term("paciente", { number: "p" }) })}</h3><div id="fventasc"></div></section>`;
}
async function paintBase(id) {
  const box = body(), card = document.getElementById("ficha");
  if (!box || !card) return;
  accountCardLegacy.setShownId(id);
  box.innerHTML = SKELETON;
  card.showModal();
  const result = await cachedRpc("ficha_cuenta", { p_id: id }, `ficha-${id}`);
  const data = result.data, account = data?.medico;
  if (!data || !account) {
    box.innerHTML = `<p class="sm">${t("accounts.base.noConnection")}</p>`;
    return;
  }
  box.innerHTML = cardHtml({ ...data, medico: account }, Boolean(result.cache));
  const close = document.getElementById("fx");
  if (close) close.onclick = () => {
    card.close();
  };
  box.querySelectorAll("[data-editv]").forEach((button) => {
    button.onclick = () => {
      void editVisit(JSON.parse(button.dataset.editv ?? "{}"), id);
    };
  });
}

// src/app/screens/accounts/card/card-tools.ts
var stillShown = (id) => accountCardLegacy.shownId() === id;
var fieldsPlace = () => document.getElementById("fzcampos");
function addBeforeFields(id, blockId, html) {
  const place = fieldsPlace();
  if (!place || document.getElementById(blockId) || !stillShown(id)) return null;
  place.insertAdjacentHTML("beforebegin", html);
  return document.getElementById(blockId);
}
function closeCardAnd(open) {
  document.getElementById("ficha")?.close();
  open();
}
function onEach(block, key, action) {
  block.querySelectorAll(`[data-${key}]`).forEach((button) => {
    button.onclick = () => {
      action(button.getAttribute(`data-${key}`) ?? "");
    };
  });
}
async function accountKind(id) {
  const { data } = await legacyDb().from("cuentas").select("tipo, nombre, centro_id, archivado_en").eq("id", id).maybeSingle();
  return data;
}
var historyRows = () => [...document.querySelectorAll("#fbody [data-vrow]")];

// delcos-shared:src/app/screens/cycle/card.ts
var shared9 = globalThis["__delcosModules"]["screens/cycle/card"];
var pick9 = (name) => shared9[name];
var paintCardCycle = /* @__PURE__ */ pick9("paintCardCycle");

// src/app/screens/accounts/card/sections-account.ts
var CENTRE = "Centro";
var DELETE_LEVEL = 3;
async function cycle(id) {
  if (permissions.isProfessionalPortal() || document.getElementById("fciclo") || !stillShown(id)) return;
  const state = [...document.querySelectorAll("#fbody .blk > h3")].find((heading) => heading.textContent?.trim() === t("accounts.card.stateTitle"));
  if (!state?.parentElement) return;
  state.parentElement.insertAdjacentHTML("beforeend", '<div class="fciclo" id="fciclo"></div>');
  await paintCardCycle(id);
}
async function centreProfessionals(id) {
  const account = await accountKind(id), body2 = document.getElementById("fbody");
  if (account?.tipo !== CENTRE || !account.centro_id || !body2 || !stillShown(id) || document.getElementById("fcentrop")) return;
  const professionals = escapeHtml(term("medico", { number: "p" }));
  (body2.querySelector(".fh") ?? body2.firstElementChild)?.insertAdjacentHTML("afterend", `<div class="blk" id="fcentrop"><div class="fcentropf"><span>${t("accounts.card.centreProfessionals", { professionals })}</span>
        <button type="button" class="btn sec chico" data-fcver="${account.centro_id}">${t("accounts.card.seeCentreProfessionals", { professionals })}</button></div></div>`);
}
async function archiveButtons(id) {
  const account = await accountKind(id), body2 = document.getElementById("fbody");
  if (!account || !body2 || !stillShown(id) || document.getElementById("fbajablk") || !accountCardLegacy.canEditType(account.tipo)) return;
  const status = account.archivado_en ? `<button type="button" class="btn sec chico" data-falta="${id}">${t("accounts.card.reactivate")}</button>` : `<button type="button" class="btn sec chico" data-fbaja="${id}">${t("accounts.card.archive")}</button>`;
  body2.insertAdjacentHTML("beforeend", `<div class="blk fbajablk" id="fbajablk"><div class="acts">
      ${status}
      ${permissions.levelOf("M") >= DELETE_LEVEL ? `<button type="button" class="btn sec dang chico" data-felim="${id}">${t("accounts.card.delete")}</button>` : ""}</div></div>`);
}

// src/app/screens/accounts/card/sections-access.ts
var CENTRE2 = "Centro";
var EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
var canShow = (id) => stillShown(id) && Boolean(document.getElementById("fbody")) && !document.getElementById("facceso");
var accountOf = async (id) => (await cachedRpc("ficha_cuenta", { p_id: id }, `ficha-${id}`)).data?.medico ?? {};
function hasAccessHtml(user, isCentre2, withConnection) {
  const impersonate = user.activo && accessLegacy.canImpersonate(user) ? `<button class="btn sec" data-ucomo="${user.id}">${t("accounts.access.impersonate")}</button>` : "";
  return `<p class="sm">${t("accounts.access.hasAccess")}${user.email ? t("accounts.access.asEmail", { email: escapeHtml(user.email) }) : ""}${user.activo ? "" : t("accounts.access.disabled")}: ${t(isCentre2 ? "accounts.access.centreUses" : "accounts.access.portalUses")}.</p>` + (withConnection ? `<p class="sm facccon" data-facccon="${user.id}"></p>` : "") + impersonate;
}
var canText = (isCentre2) => isCentre2 ? t("accounts.access.centreCan") : t("accounts.access.portalCan", { prescriptions: term("pauta", { number: "p" }), patients: term("paciente", { number: "p" }) });
async function adminAccess(id) {
  const [{ data: users }, account] = await Promise.all([callRpc("usuarios_resumen", {}), accountOf(id)]);
  if (!canShow(id)) return;
  const user = (users ?? []).find((item) => item.cuenta_id === id), isCentre2 = account.tipo === CENTRE2;
  document.getElementById("fbody")?.insertAdjacentHTML("beforeend", `<div class="blk" id="facceso"><h3>${t("accounts.access.title")}</h3>
    ${user ? hasAccessHtml(user, isCentre2, true) : `<p class="sm">${canText(isCentre2)}</p>
         <button class="btn sec" id="fdaracc">${t("accounts.access.give")}</button>`}</div>`);
  if (user) accessLegacy.connectionInfo(user.id);
  const give = document.getElementById("fdaracc");
  if (give) give.onclick = async () => {
    const { data } = await legacyDb().rpc("ficha_cuenta", { p_id: id });
    const professional = data?.medico;
    if (!professional) return;
    document.getElementById("ficha")?.close();
    accessLegacy.newUser({ medico: { id, nombre: professional.nombre }, nombre: professional.nombre, email: professional.email ?? "", centro: professional.tipo === CENTRE2 });
  };
}
var FAILURES = {
  permiso: "accounts.access.noPermission",
  cartera: "accounts.access.notYours",
  ya_tiene: "accounts.access.alreadyHas",
  correo_en_uso: "accounts.access.emailInUse",
  email: "accounts.access.emailWrong",
  sin_rol_portal: "accounts.access.noPortalRole"
};
async function linkAccess(id, email) {
  const { data: result, error } = await legacyDb().rpc("dar_acceso_cuenta", { p_cuenta: id, p_email: email });
  if (!error && result?.ok) return true;
  const key = FAILURES[result?.error ?? ""];
  notices.toast(key ? t(key, { professionals: term("medico", { number: "p" }) }) : t("accounts.access.couldNotGive"), true);
  return false;
}
async function giveAccess(id, account, button) {
  const field2 = document.getElementById("faccmail"), email = field2?.value.trim() ?? "";
  if (!EMAIL.test(email)) {
    notices.toast(t("accounts.access.invalidEmail"), true);
    return;
  }
  button.disabled = true;
  if (!await linkAccess(id, email)) {
    button.disabled = false;
    return;
  }
  const password = `Tmp-${Math.random().toString(36).slice(2, 8)}`;
  const failure = await accessLegacy.signUp(email, password, orFallback(account.nombre, email.split("@").shift() ?? email));
  button.disabled = false;
  if (failure) {
    notices.toast(t("accounts.access.couldNotCreate", { error: failure.message ?? "" }), true);
    return;
  }
  button.remove();
  if (field2) field2.disabled = true;
  accessLegacy.forgetAccessCache();
  const message = document.getElementById("faccmsg");
  if (message) message.innerHTML = t("accounts.access.created", { password: escapeHtml(password) });
}
async function portfolioAccess(id) {
  if (!canShow(id)) return;
  const mine = permissions.seesEverything() ? Promise.resolve({ data: [1] }) : legacyDb().from("atribuciones").select("cuenta_id").eq("cuenta_id", id).eq("usuario_id", salesTeam.currentUserId()).is("hasta", null).limit(1);
  const [{ data: withAccess }, { data: inPortfolio }, account] = await Promise.all([callRpc("cuentas_con_acceso", {}), mine, accountOf(id)]);
  const user = (withAccess ?? []).find((item) => item.cuenta_id === id);
  if (!user && !(inPortfolio ?? []).length || !canShow(id)) return;
  const isCentre2 = account.tipo === CENTRE2;
  document.getElementById("fbody")?.insertAdjacentHTML("beforeend", `<div class="blk" id="facceso"><h3>${t("accounts.access.title")}</h3>
    ${user ? hasAccessHtml(user, isCentre2, false) : `<p class="sm">${canText(isCentre2)}</p>
         <div class="g2"><div><label for="faccmail">${t("accounts.access.email")}</label><input id="faccmail" type="email" value="${escapeHtml(account.email ?? "")}" placeholder="${t("accounts.access.emailPlaceholder")}"></div>
         <div style="align-self:end"><button class="btn sec" id="fdaracc">${t("accounts.access.give")}</button></div></div><div class="sm" id="faccmsg"></div>`}</div>`);
  const give = document.getElementById("fdaracc");
  if (give) give.onclick = () => {
    void giveAccess(id, account, give);
  };
}
async function platformAccess(id) {
  if (!cardSectionsLegacy.can("administrar") && cardSectionsLegacy.can("dar_acceso_cuentas")) {
    await portfolioAccess(id);
    return;
  }
  if (!cardSectionsLegacy.can("administrar") || !canShow(id)) return;
  await adminAccess(id);
}

// src/app/screens/accounts/card/sections-admin.ts
var HISTORY_LIMIT = 100;
var VALUE_LENGTH = 40;
var EDIT = "Edición";
function changeLines(entry) {
  const detail = entry.detalle;
  if (entry.accion !== EDIT || !detail || typeof detail !== "object") return `<span class="sm">${escapeHtml(cardSectionsLegacy.detailSummary(detail))}</span>`;
  const value4 = (raw) => escapeHtml(orFallback(cardSectionsLegacy.valueText(raw).slice(0, VALUE_LENGTH), "—"));
  return Object.entries(detail).filter((pair) => Array.isArray(pair[1]) && pair[1].length === 2).map(([field2, [before, after]]) => `<span class="sm">${escapeHtml(cardSectionsLegacy.fieldName(field2))}: ${value4(before)} → ${value4(after)}</span>`).join("");
}
function historyRow(entry) {
  const when = new Date(entry.creado_en).toLocaleString(t("dates.locale"), { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  return `<div class="item u-cursor-default"><span class="tx">
        <b>${escapeHtml(entry.accion)}${entry.entidad === "ubicaciones" ? ` · ${term("consulta")}` : ""}</b>
        <span class="sm">${escapeHtml(entry.usuario)} · ${when}</span>
        ${changeLines(entry)}</span>${entry.deshacible ? `<button type="button" class="btn sec" data-fhx="${entry.id}">${t("accounts.history.undo")}</button>` : ""}</div>`;
}
async function changeHistory(id) {
  if (!cardSectionsLegacy.can("administrar") || !stillShown(id) || !document.getElementById("fbody") || document.getElementById("fhist")) return;
  const { data } = await callRpc("historial_entidad", { p_entidad: "cuentas", p_id: id, lim: HISTORY_LIMIT });
  const list = Array.isArray(data) ? data : [], body2 = document.getElementById("fbody");
  if (!stillShown(id) || !body2 || document.getElementById("fhist")) return;
  body2.insertAdjacentHTML("beforeend", `<details class="blk" id="fhist"><summary>${t("accounts.history.title")} <span class="n">${formatNumber(list.length)}</span></summary>
    <div class="lista">${list.map(historyRow).join("") || `<div class="sm">${t("accounts.history.none")}</div>`}</div></details>`);
  document.querySelectorAll("#fhist [data-fhx]").forEach((button) => {
    button.onclick = () => {
      cardSectionsLegacy.undo(Number(button.dataset.fhx), () => {
        agendaActions.openAccount(id);
      });
    };
  });
}
var PORTAL_DAYS = ["L", "M", "X", "J", "V", "S"];
function timetableText(days) {
  const names = t("dates.weekdaysLong").split(",");
  return PORTAL_DAYS.map((day, index) => days?.[day] ? `${capitalise(names[index] ?? "").slice(0, 3)} ${escapeHtml(days[day])}` : "").filter(Boolean).join(" · ") || t("accounts.proposal.noTimetable");
}
var difference = (label, now, proposed) => proposed && proposed !== now ? `<div class="fpdif"><span class="sm">${label}</span><span>${now ? `<s>${escapeHtml(now)}</s> → ` : ""}<b>${escapeHtml(proposed)}</b></span></div>` : "";
function proposalHtml(proposal, account, canEdit) {
  const data = proposal.datos ?? {}, visits = data.visitas;
  const sentAt = new Date(proposal.modificado_en).toLocaleString(t("dates.locale"), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const consultations = (data.consultas ?? []).map((item) => `<div class="fpcon"><b>${escapeHtml(orFallback(item.nombre, term("consulta", { capital: "C" })))}</b> ${item.centro_id || item.ubicacion_id ? "" : `<span class="pill p-per">${t("accounts.proposal.newCentre")}</span>`}
      <span class="sm">${escapeHtml([item.direccion, item.municipio].filter(Boolean).join(" · "))}</span><span class="sm">${timetableText(item.dias)}</span></div>`).join("");
  const visitWay = visits && (visits.como || visits.momento) ? `<div class="fpdif"><span class="sm">${term("visita", { number: "p", capital: "C" })}</span><span>${escapeHtml([visits.como, visits.momento].filter(Boolean).join(" · "))}</span></div>` : "";
  return `<section class="blk fprop" id="fprop"><h3>${t("accounts.proposal.title")} <span class="pill p-warn">${t("accounts.proposal.toReview")}</span></h3>
    <p class="sm">${t("accounts.proposal.sent", { who: escapeHtml(orFallback(proposal.quien, term("medico", { article: "el", capital: "C" }))), date: sentAt })}</p>
    ${difference(t("accounts.proposal.phone"), account.telefono, data.telefono)}${difference(t("accounts.proposal.email"), account.email, data.email)}
    ${consultations}
    ${visitWay}
    ${data.notas ? `<div class="fpdif"><span class="sm">${t("accounts.proposal.notes")}</span><span>${escapeHtml(data.notas)}</span></div>` : ""}
    <div class="acts" style="justify-content:flex-start;margin:8px 0 0">${canEdit ? `<button type="button" class="btn sec" id="fpropedit">${t("accounts.proposal.edit")}</button>` : ""}
      <button type="button" class="btn" id="fpropok">${t("accounts.proposal.reviewed")}</button></div></section>`;
}
async function markReviewed(proposal) {
  const { data: result } = await legacyDb().rpc("revisar_propuesta", { p_id: proposal.id });
  if (!result?.ok) {
    notices.toast(t(result?.error === "permiso" ? "accounts.proposal.noPermission" : "accounts.proposal.couldNotMark"), true);
    return;
  }
  notices.toast(t("accounts.proposal.marked"));
  document.getElementById("fprop")?.remove();
}
var canShowProposal = (id) => stillShown(id) && Boolean(document.getElementById("fbody")) && !document.getElementById("fprop");
async function portalProposal(id) {
  if (permissions.isProfessionalPortal() || !canShowProposal(id)) return;
  const { data: proposal } = await callRpc("ficha_propuesta", { p_cuenta: id });
  if (!proposal || !canShowProposal(id)) return;
  const card = await cachedRpc("ficha_cuenta", { p_id: id }, `ficha-${id}`), body2 = document.getElementById("fbody");
  if (!body2) return;
  const edit = body2.querySelector("[data-act=editar]");
  const html = proposalHtml(proposal, card.data?.medico ?? {}, Boolean(edit));
  const first2 = [...body2.children].find((child) => child.matches(".blk, section, .card") && child.id !== "fprop");
  if (first2) first2.insertAdjacentHTML("beforebegin", html);
  else body2.insertAdjacentHTML("beforeend", html);
  bindProposal(body2, proposal);
}
function bindProposal(body2, proposal) {
  const editButton = document.getElementById("fpropedit");
  if (editButton) editButton.onclick = () => {
    body2.querySelector("[data-act=editar]")?.click();
  };
  const ok = document.getElementById("fpropok");
  if (ok) ok.onclick = () => {
    void markReviewed(proposal);
  };
}

// delcos-shared:src/app/legacy/accounts2-bridge.ts
var shared10 = globalThis["__delcosModules"]["legacy/accounts2-bridge"];
var pick10 = (name) => shared10[name];
var accountsEditorLegacy = /* @__PURE__ */ pick10("accountsEditorLegacy");

// delcos-shared:src/app/screens/settings/custom-fields/index.ts
var shared11 = globalThis["__delcosModules"]["screens/settings/custom-fields/index"];
var pick11 = (name) => shared11[name];
var customFieldsHtml = /* @__PURE__ */ pick11("customFieldsHtml");
var readCustomFields = /* @__PURE__ */ pick11("readCustomFields");
var saveCustomFields = /* @__PURE__ */ pick11("saveCustomFields");

// delcos-shared:src/app/screens/accounts/editor-form/model.ts
var shared12 = globalThis["__delcosModules"]["screens/accounts/editor-form/model"];
var pick12 = (name) => shared12[name];
var PRIVATE_SAVED_NAME = /* @__PURE__ */ pick12("PRIVATE_SAVED_NAME");
var catalogOptions = /* @__PURE__ */ pick12("catalogOptions");
var consultationField = /* @__PURE__ */ pick12("consultationField");
var fieldValue = /* @__PURE__ */ pick12("fieldValue");
var hoursText = /* @__PURE__ */ pick12("hoursText");
var isPrivateConsultation = /* @__PURE__ */ pick12("isPrivateConsultation");
var markDirty = /* @__PURE__ */ pick12("markDirty");
var newAccountNames = /* @__PURE__ */ pick12("newAccountNames");
var privateConsultation = /* @__PURE__ */ pick12("privateConsultation");

// src/app/screens/accounts/editor-form/centre-card.ts
var placeOf = (centre) => [centre.direccion, [centre.cp, centre.municipio].filter(Boolean).join(" ")].filter(Boolean).join(" · ");
var directionsButton = (centre) => centre.lat ? `<button type="button" class="btn sec" data-nav="${accountsEditorLegacy.directions([Number(centre.lat), Number(centre.lon)])}">${t("accountsEditor.centre.directions")}</button>` : "";
function hoursLine(centre, linked) {
  const hours = centre.horario && Object.keys(centre.horario).length ? centre.horario : null;
  if (!hours) return linked ? `<span class="sm" style="color:var(--muted)">${t("accountsEditor.centre.noOpening")}</span>` : "";
  const today = hours[accountsEditorLegacy.todayLetter()];
  return `<span class="sm">🕘 ${today ? `<b>${t("accountsEditor.centre.today", { hours: escapeHtml(today) })}</b> · ` : ""}${escapeHtml(hoursText(hours))}</span>`;
}
function centreCardHtml(centre, linked) {
  const unlinked = linked ? "" : `<span class="pill p-warn" title="${t("accountsEditor.centre.unlinkedTitle", { thisConsultation: term("consulta", { article: "este", articleCapital: "C" }) })}">${t("accountsEditor.centre.unlinked")}</span>`;
  return `<div class="cpcard"><div class="cpcab"><b>${escapeHtml(orFallback(centre.nombre, t("accountsEditor.centre.noName")))}</b>
      ${unlinked}</div>
    <span class="sm">${escapeHtml(placeOf(centre) || t("accountsEditor.centre.noAddress"))}</span>
    ${centre.telefono ? `<span class="sm">☎ <a href="tel:${escapeHtml(centre.telefono)}">${escapeHtml(centre.telefono)}</a></span>` : ""}
    ${hoursLine(centre, linked)}
    ${centre.lat ? "" : `<span class="sm u-warn">${t("accountsEditor.centre.noLocation")}</span>`}
    <div class="acts" style="margin:8px 0 0;flex-wrap:wrap">
      ${directionsButton(centre)}
      ${linked ? `<button type="button" class="btn sec" data-cpeditar>${t("accountsEditor.centre.edit")}</button>` : `<button type="button" class="btn" data-cpenlazar>${t("accountsEditor.centre.link")}</button>`}
      <button type="button" class="btn sec" data-cpcambiar>${t("accountsEditor.centre.change")}</button></div></div>`;
}
function privateCardHtml(centre) {
  const place = placeOf(centre);
  const warning = place ? t("accountsEditor.centre.noLocation") : t("accountsEditor.private.addAddressHint");
  return `<div class="cpcard cppriv"><div class="cpcab"><b>${privateConsultation()}</b><span class="pill p-est">${t("accountsEditor.private.noCentre")}</span></div>
    <span class="sm">${escapeHtml(place || t("accountsEditor.private.noAddressYet"))}</span>
    ${centre.lat ? "" : `<span class="sm u-warn">${warning}</span>`}
    <div class="acts" style="margin:8px 0 0;flex-wrap:wrap">
      ${directionsButton(centre)}
      <button type="button" class="btn ${place ? "sec" : ""}" data-cpeditar>${place ? t("accountsEditor.private.edit", { theConsultation: term("consulta", { article: "el" }) }) : t("accountsEditor.private.addAddress")}</button>
      <button type="button" class="btn sec" data-cpcambiar>${t("accountsEditor.centre.change")}</button></div></div>`;
}
var centreCard = (centre, linked) => linked || !isPrivateConsultation(centre) ? centreCardHtml(centre, linked) : privateCardHtml(centre);

// delcos-shared:src/app/legacy/misc-bridge.ts
var shared13 = globalThis["__delcosModules"]["legacy/misc-bridge"];
var pick13 = (name) => shared13[name];
var miscLegacy = /* @__PURE__ */ pick13("miscLegacy");

// delcos-shared:src/app/core/organisation.ts
var shared14 = globalThis["__delcosModules"]["core/organisation"];
var pick14 = (name) => shared14[name];
var addressQuery = /* @__PURE__ */ pick14("addressQuery");

// src/app/screens/accounts/editor-form/private-form.ts
var LOCATION_TIMEOUT_MS = 12e3;
var LOCATION_MAX_AGE_MS = 3e4;
var DECIMALS = 6;
var valueOf = (context, suffix) => (document.getElementById(context.key + suffix)?.value ?? "").trim();
var inputOf = (context, suffix) => document.getElementById(context.key + suffix);
var first = (...values) => values.find(Boolean) ?? "";
function formHtml(box, index, key, located) {
  const value4 = (name) => escapeHtml(fieldValue(box, index, name).trim());
  return `<div class="cpform cppriv">
    <div class="cpformcab"><b>${privateConsultation()}</b><span class="sm">${t("accountsEditor.private.hint")}</span></div>
    <div class="g2"><div><label for="${key}d">${t("accountsEditor.private.address")}</label><input id="${key}d" value="${value4("direccion")}" placeholder="${t("accountsEditor.private.addressPlaceholder")}"></div>
      <div><label for="${key}c">${t("accountsEditor.centreForm.postcode")}</label><input id="${key}c" value="${value4("cp")}" inputmode="numeric"></div></div>
    <div class="g2"><div><label for="${key}m">${t("accountsEditor.centreForm.town")}</label><input id="${key}m" value="${value4("municipio")}"></div>
      <div><label for="${key}p">${t("accountsEditor.centreForm.province")}</label><input id="${key}p" value="${value4("provincia")}"></div></div>
    <div class="cpubi sm">${located ? `<b class="u-ok">${t("accountsEditor.private.located")}</b>` : t("accountsEditor.centreForm.notLocated")}
      <button type="button" class="lnk" data-pvgeo>${t("accountsEditor.centreForm.findOnMap")}</button> <button type="button" class="lnk" data-pvaqui>${t("accountsEditor.picker.imHere")}</button></div>
    <div class="acts" style="justify-content:flex-end;margin:10px 0 0"><button type="button" class="btn sec" data-pvcancel>${t("common.cancel")}</button><button type="button" class="btn" data-pvok>${t("common.save")}</button></div></div>`;
}
function showLocated(context, extra = "") {
  context.place.querySelector(".cpubi")?.firstChild?.replaceWith(Object.assign(document.createElement("b"), { style: "color:var(--ok)", textContent: `${t("accountsEditor.private.located")} ${extra}` }));
}
function fillFrom(context, address) {
  if (!address) return;
  const set = (suffix, text) => {
    const field2 = inputOf(context, suffix);
    if (field2 && !field2.value.trim()) field2.value = text;
  };
  if (address.road) set("d", [address.road, address.house_number].filter(Boolean).join(", "));
  if (address.postcode) set("c", address.postcode);
  set("m", first(address.city, address.town, address.village, address.municipality).toUpperCase());
  set("p", first(address.province, address.state_district, address.county, address.state).toUpperCase());
}
async function search(context, quiet) {
  const value4 = (suffix) => valueOf(context, suffix);
  if (!value4("d") && !value4("m")) {
    if (!quiet) notices.toast(t("accountsEditor.centreForm.writeAddress"), true);
    return false;
  }
  const query = addressQuery([value4("d"), value4("c"), value4("m"), value4("p")]);
  const found = await qualityLegacy.geocode(query, { direccion: value4("d"), municipio: value4("m"), cp: value4("c") }).catch(() => null);
  if (!found) {
    if (!quiet) notices.toast(t("accountsEditor.centreForm.notFound"), true);
    return false;
  }
  if (found.fuera) {
    notices.toast(t("accountsEditor.private.elsewhere", { place: found.fuera, town: value4("m") }), true);
    return false;
  }
  context.point = { lat: Number(found.lat), lon: Number(found.lon) };
  context.located = true;
  fillFrom(context, found.address);
  showLocated(context);
  return true;
}
async function here(context, button) {
  if (!("geolocation" in navigator)) {
    notices.toast(t("accountsEditor.private.noGeolocation"), true);
    return;
  }
  const text = button.textContent;
  button.textContent = t("accountsEditor.private.locating");
  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: LOCATION_TIMEOUT_MS, maximumAge: LOCATION_MAX_AGE_MS });
    });
    const lat = Number(position.coords.latitude.toFixed(DECIMALS)), lon = Number(position.coords.longitude.toFixed(DECIMALS));
    context.point = { lat, lon };
    context.located = true;
    const found = await accountsEditorLegacy.reverseGeocode(lat, lon);
    fillFrom(context, found?.address);
    showLocated(context, t("accountsEditor.private.withLocation"));
  } catch {
    notices.toast(t("accountsEditor.private.locationFailed"), true);
  } finally {
    button.textContent = text;
  }
}
async function accept(context, button) {
  const value4 = (suffix) => valueOf(context, suffix);
  if (!value4("d") && !value4("m")) {
    notices.toast(t("accountsEditor.private.writeTown"), true);
    inputOf(context, "m")?.focus();
    return;
  }
  if ([value4("d"), value4("c"), value4("m")].join("|") !== context.addressBefore && !context.located) {
    button.disabled = true;
    const found = await search(context, true);
    button.disabled = false;
    if (!found) context.point = { lat: null, lon: null };
  }
  setCentre(context.box, context.index, { nombre: PRIVATE_SAVED_NAME, direccion: value4("d"), cp: value4("c"), municipio: value4("m").toUpperCase(), provincia: value4("p").toUpperCase(), ...context.point });
  void paintCentrePicker(context.box, context.index);
  notices.toast(context.point.lat !== null ? t("accountsEditor.private.ready", { privateConsultation: privateConsultation() }) : t("accountsEditor.private.readyNoPoint"));
}
function privateForm(box, index) {
  const place = box.querySelector(`[data-cp="${index}"]`);
  if (!place) return;
  const lat = fieldValue(box, index, "lat").trim(), lon = fieldValue(box, index, "lon").trim(), key = `pv${index}_`;
  const context = {
    place,
    box,
    index,
    key,
    point: { lat: lat ? Number(lat) : null, lon: lon ? Number(lon) : null },
    located: false,
    addressBefore: ["direccion", "cp", "municipio"].map((name) => fieldValue(box, index, name).trim()).join("|")
  };
  place.innerHTML = formHtml(box, index, key, Boolean(lat));
  const on = (selector, action) => {
    const button = place.querySelector(selector);
    if (button) button.onclick = () => {
      action(button);
    };
  };
  on("[data-pvgeo]", (button) => {
    const text = button.textContent;
    button.textContent = t("accountsEditor.centreForm.searching");
    void search(context, false).finally(() => {
      button.textContent = text;
    });
  });
  on("[data-pvaqui]", (button) => {
    void here(context, button);
  });
  on("[data-pvcancel]", () => {
    void paintCentrePicker(box, index);
  });
  on("[data-pvok]", (button) => {
    void accept(context, button);
  });
  inputOf(context, fieldValue(box, index, "direccion") ? "d" : "m")?.focus();
}

// src/app/screens/accounts/editor-form/centre-form.ts
var WEEKDAYS = ["M", "X", "J", "V"];
var pointOf = (value4) => value4 !== null && value4 !== void 0 && value4 !== "" ? Number(value4) : null;
function formHtml2(centre, key, notice) {
  const hours = centre.horario ?? {}, input2 = (suffix, value4, extra = "") => `<input id="${key}${suffix}" value="${escapeHtml(value4 ?? "")}"${extra}>`;
  const days = miscLegacy.weekDays().map(([day, name]) => `<div><span>${name}</span><input data-hd="${day}" value="${escapeHtml(hours[day] ?? "")}" placeholder="${day === "D" ? t("accountsEditor.centreForm.closed") : t("accountsEditor.centreForm.hoursPlaceholder")}"></div>`).join("");
  return `<div class="cpform">
    <div class="cpformcab"><b>${t(centre.id ? "accountsEditor.centreForm.editTitle" : "accountsEditor.centreForm.newTitle")}</b>${notice ? `<span class="sm cpaviso">${escapeHtml(notice)}</span>` : ""}</div>
    <div class="g2"><div><label for="${key}n">${t("accountsEditor.centreForm.name")}</label>${input2("n", centre.nombre, ` placeholder="${t("accountsEditor.centreForm.namePlaceholder")}"`)}</div>
      <div><label for="${key}t">${t("accountsEditor.centreForm.phone")}</label>${input2("t", centre.telefono, ' inputmode="tel"')}</div></div>
    <div class="g2"><div><label for="${key}d">${t("accountsEditor.centreForm.address")}</label>${input2("d", centre.direccion)}</div>
      <div><label for="${key}c">${t("accountsEditor.centreForm.postcode")}</label>${input2("c", centre.cp, ' inputmode="numeric"')}</div></div>
    <div class="g2"><div><label for="${key}m">${t("accountsEditor.centreForm.town")}</label>${input2("m", centre.municipio)}</div>
      <div><label for="${key}p">${t("accountsEditor.centreForm.province")}</label>${input2("p", centre.provincia)}</div></div>
    <div class="cpubi sm">${centre.lat ? `<b class="u-ok">${t("accountsEditor.centreForm.located")}</b>` : t("accountsEditor.centreForm.notLocated")} <button type="button" class="lnk" data-cpgeo>${t("accountsEditor.centreForm.findOnMap")}</button></div>
    <label>${t("accountsEditor.centreForm.opening")}</label>
    <div class="cphor">${days}</div>
    <button type="button" class="lnk" data-cpcopiar>${t("accountsEditor.centreForm.copyMonday")}</button>
    <div class="acts" style="justify-content:flex-end;margin:10px 0 0"><button type="button" class="btn sec" data-cpcancel>${t("common.cancel")}</button><button type="button" class="btn" data-cpguardar>${t(centre.id ? "accountsEditor.centreForm.save" : "accountsEditor.centreForm.create")}</button></div></div>`;
}
var valueOf2 = (context, suffix) => (document.getElementById(context.key + suffix)?.value ?? "").trim();
async function locate(context, button) {
  const value4 = (suffix) => valueOf2(context, suffix);
  if (!value4("d") && !value4("m")) {
    notices.toast(t("accountsEditor.centreForm.writeAddress"), true);
    return;
  }
  button.textContent = t("accountsEditor.centreForm.searching");
  const query = addressQuery([value4("d"), value4("c"), value4("m"), value4("p")]);
  const found = await qualityLegacy.geocode(query, { direccion: value4("d"), municipio: value4("m"), cp: value4("c") }).catch(() => null);
  button.textContent = t("accountsEditor.centreForm.findOnMap");
  if (!found) {
    notices.toast(t("accountsEditor.centreForm.notFound"), true);
    return;
  }
  if (found.fuera) {
    notices.toast(t("accountsEditor.centreForm.elsewhere", { place: found.fuera, town: value4("m") }), true);
    return;
  }
  context.point = { lat: Number(found.lat), lon: Number(found.lon) };
  const address = found.address ?? {}, first2 = (...values) => values.find(Boolean) ?? "";
  const set = (suffix, text) => {
    const field2 = document.getElementById(context.key + suffix);
    if (field2 && !field2.value.trim()) field2.value = text;
  };
  if (address.postcode) set("c", address.postcode);
  set("m", first2(address.city, address.town, address.village, address.municipality).toUpperCase());
  set("p", first2(address.province, address.state_district, address.county).toUpperCase());
  context.place.querySelector(".cpubi")?.firstChild?.replaceWith(Object.assign(document.createElement("b"), { style: "color:var(--ok)", textContent: `${t("accountsEditor.centreForm.located")} ` }));
}
async function save(context, button) {
  const value4 = (suffix) => valueOf2(context, suffix);
  if (!value4("n")) {
    notices.toast(t("accountsEditor.centreForm.writeName"), true);
    document.getElementById(context.key + "n")?.focus();
    return;
  }
  const hours = {};
  context.place.querySelectorAll("[data-hd]").forEach((field2) => {
    if (field2.value.trim()) hours[field2.dataset.hd ?? ""] = field2.value.trim();
  });
  button.disabled = true;
  const { data, error } = await callRpc("guardar_centro", { p: {
    id: context.centre.id ?? null,
    nombre: value4("n"),
    telefono: value4("t"),
    direccion: value4("d"),
    cp: value4("c"),
    municipio: value4("m"),
    provincia: value4("p"),
    ...context.point,
    horario: hours
  } });
  button.disabled = false;
  if (error || !data?.ok || !data.centro) {
    const reason = data?.error ? `: ${data.error === "permiso" ? t("accountsEditor.centreForm.noPermission") : data.error}` : "";
    notices.toast(t("accountsEditor.centreForm.couldNotSave") + reason, true);
    return;
  }
  setCentre(context.box, context.index, data.centro);
  void paintCentrePicker(context.box, context.index);
  notices.toast(t(context.centre.id ? "accountsEditor.centreForm.updated" : "accountsEditor.centreForm.created"));
}
function bind(context) {
  const { place } = context, on = (selector, action) => {
    const button = place.querySelector(selector);
    if (button) button.onclick = () => {
      action(button);
    };
  };
  on("[data-cpcopiar]", () => {
    const monday = place.querySelector('[data-hd="L"]')?.value ?? "";
    WEEKDAYS.forEach((day) => {
      const field2 = place.querySelector(`[data-hd="${day}"]`);
      if (field2) field2.value = monday;
    });
  });
  on("[data-cpgeo]", (button) => {
    void locate(context, button);
  });
  on("[data-cpcancel]", () => {
    void paintCentrePicker(context.box, context.index, context.centre.id ? void 0 : "buscar");
  });
  on("[data-cpguardar]", (button) => {
    void save(context, button);
  });
}
function centreForm(box, index, centre, notice) {
  if (centre && (centre.privada || isPrivateConsultation(centre))) {
    privateForm(box, index);
    return;
  }
  const place = box.querySelector(`[data-cp="${index}"]`);
  if (!place) return;
  const current = centre ?? {}, key = `cf${index}_`;
  place.innerHTML = formHtml2(current, key, notice);
  bind({ place, box, index, centre: current, key, point: { lat: pointOf(current.lat), lon: pointOf(current.lon) } });
  document.getElementById(key + "n")?.focus();
}

// src/app/screens/accounts/editor-form/centre-picker.ts
var SEARCH_WAIT_MS = 250;
var SEARCH_RADIUS_KM = 400;
var SEARCH_LIMIT = 8;
var METRES_IN_KM = 1e3;
var CENTRE_FIELDS = ["centro_id", "centro_nombre", "direccion", "municipio", "cp", "provincia"];
function setCentre(box, index, centre) {
  const set = (name, value4) => {
    const field2 = consultationField(box, index, name);
    if (field2) field2.value = value4 === null || value4 === void 0 ? "" : String(value4);
  };
  const keys = { centro_id: "id", centro_nombre: "nombre", direccion: "direccion", municipio: "municipio", cp: "cp", provincia: "provincia" };
  CENTRE_FIELDS.forEach((name) => {
    set(name, centre ? centre[keys[name]] ?? "" : "");
  });
  set("lat", centre?.lat ?? "");
  set("lon", centre?.lon ?? "");
  if (centre && centre.lat !== null && centre.lat !== void 0) box.dataset.lat = String(centre.lat);
  else delete box.dataset.lat;
  markDirty(box);
}
var distanceText = (metres) => metres < METRES_IN_KM ? `${metres} m` : `${(metres / METRES_IN_KM).toFixed(1)} km`;
function centreItem(centre, key) {
  const details = [centre.direccion, centre.municipio].filter(Boolean).join(" · ");
  const away = centre.metros !== null && centre.metros !== void 0 ? t("accountsEditor.picker.away", { distance: distanceText(centre.metros) }) : "";
  const doctors = centre.medicos ? ` · ${t(centre.medicos === 1 ? "accountsEditor.picker.oneDoctor" : "accountsEditor.picker.doctors", { count: centre.medicos })}` : "";
  return `<button type="button" class="cpitem" data-k="${key}"><b>${escapeHtml(centre.nombre)}</b>
      <span class="sm">${escapeHtml(details)}${away}${doctors}</span></button>`;
}
function centreList(results, list, choose, extra) {
  results.innerHTML = list.map(centreItem).join("") + (list.length ? "" : `<div class="sm" style="padding:8px 2px">${t("accountsEditor.picker.none")}</div>`) + (extra?.html ?? "");
  results.querySelectorAll("[data-k]").forEach((button) => {
    button.onclick = () => {
      const centre = list[Number(button.dataset.k)];
      if (centre) choose(centre);
    };
  });
  const last = results.querySelector(".cpnuevo");
  if (last && extra) last.onclick = extra.onClick;
}
async function centreFromLocation(box, index, lat, lon) {
  const found = await accountsEditorLegacy.reverseGeocode(lat, lon).catch(() => null), address = found?.address ?? {};
  const first2 = (...values) => values.find(Boolean) ?? "";
  const name = first2(found?.name, address.hospital, address.clinic, address.doctors, address.amenity, address.healthcare, address.building);
  centreForm(box, index, {
    nombre: name,
    direccion: [address.road, address.house_number].filter(Boolean).join(", "),
    cp: first2(address.postcode),
    municipio: first2(address.city, address.town, address.village, address.municipality).toUpperCase(),
    provincia: first2(address.province, address.state_district, address.county).toUpperCase(),
    lat,
    lon
  }, t(name ? "accountsEditor.picker.fromLocation" : "accountsEditor.picker.fromLocationNoName"));
}
function markLocated(box, index, point, text) {
  const set = (name, value4) => {
    let field2 = consultationField(box, index, name);
    if (!field2) {
      field2 = Object.assign(document.createElement("input"), { type: "hidden" });
      field2.dataset.cf = `${index}|${name}`;
      box.appendChild(field2);
    }
    field2.value = String(value4);
  };
  set("lat", point.lat);
  set("lon", point.lon);
  const state = box.querySelector(".cubest");
  if (state) state.innerHTML = `<b class="u-ok">${t("accountsEditor.picker.located")}</b> ${escapeHtml(text)} <a href="https://www.openstreetmap.org/?mlat=${point.lat}&mlon=${point.lon}#map=18/${point.lat}/${point.lon}" target="_blank" rel="noopener">${t("accountsEditor.picker.seeOnMap")}</a>`;
  markDirty(box);
}
var chosenOf = (box, index) => ({
  id: fieldValue(box, index, "centro_id"),
  nombre: fieldValue(box, index, "centro_nombre"),
  direccion: fieldValue(box, index, "direccion"),
  municipio: fieldValue(box, index, "municipio"),
  cp: fieldValue(box, index, "cp"),
  lat: fieldValue(box, index, "lat"),
  lon: fieldValue(box, index, "lon")
});
function bindCard(place, box, index, centre) {
  const change = place.querySelector("[data-cpcambiar]");
  if (change) change.onclick = () => {
    void paintCentrePicker(box, index, "buscar");
  };
  const edit = place.querySelector("[data-cpeditar]");
  if (edit) edit.onclick = () => {
    centreForm(box, index, centre);
  };
  const link = place.querySelector("[data-cpenlazar]");
  if (link) link.onclick = () => {
    void paintCentrePicker(box, index, "buscar");
    const search3 = place.querySelector(".cpq");
    if (search3) {
      search3.value = centre.nombre ?? "";
      search3.dispatchEvent(new Event("input"));
    }
  };
}
async function paintChosen(place, box, index) {
  let centre = chosenOf(box, index);
  place.innerHTML = centreCard(centre, Boolean(centre.id));
  if (centre.id) {
    const { data } = await legacyDb().from("centros").select("id,nombre,direccion,municipio,cp,provincia,telefono,lat,lon,horario").eq("id", centre.id).maybeSingle();
    if (data && place.isConnected) {
      centre = data;
      place.innerHTML = centreCard(centre, true);
    }
  }
  bindCard(place, box, index, centre);
}
function searchHtml() {
  return `<div class="cpbus"><input class="cpq" type="search" placeholder="${t("accountsEditor.picker.searchPlaceholder")}" autocomplete="off">
      <div class="cpres"></div>
      <div class="acts" style="margin:8px 0 0;flex-wrap:wrap"><button type="button" class="btn sec" data-cpaqui>${t("accountsEditor.picker.imHere")}</button>
        <button type="button" class="btn sec" data-cpnuevo>${t("accountsEditor.picker.newCentre")}</button><button type="button" class="btn sec" data-cpprivada>${t("accountsEditor.picker.private", { privateConsultation: privateConsultation() })}</button></div></div>`;
}
function bindSearch(place, box, index) {
  const search3 = place.querySelector(".cpq"), results = place.querySelector(".cpres");
  if (!search3 || !results) return null;
  let timer, asked = 0;
  search3.oninput = () => {
    clearTimeout(timer);
    const mine = ++asked, text = search3.value.trim();
    if (text.length < 2) {
      results.innerHTML = "";
      return;
    }
    timer = setTimeout(() => {
      void (async () => {
        const { data } = await callRpc("buscar_centros", { p_q: text, p_lat: null, p_lon: null, p_radio: SEARCH_RADIUS_KM, p_lim: SEARCH_LIMIT });
        if (mine !== asked) return;
        centreList(
          results,
          data ?? [],
          (centre) => {
            setCentre(box, index, centre);
            void paintCentrePicker(box, index);
          },
          { html: `<button type="button" class="cpitem cpnuevo">${t("accountsEditor.picker.createNamed", { name: escapeHtml(text) })}</button>`, onClick: () => {
            centreForm(box, index, { nombre: text });
          } }
        );
      })();
    }, SEARCH_WAIT_MS);
  };
  return search3;
}
async function paintCentrePicker(box, index, mode) {
  const place = box.querySelector(`[data-cp="${index}"]`);
  if (!place) return;
  place.dataset.listo = "1";
  if (mode !== "buscar" && (fieldValue(box, index, "centro_id") || fieldValue(box, index, "centro_nombre"))) {
    await paintChosen(place, box, index);
    return;
  }
  place.innerHTML = searchHtml();
  const search3 = bindSearch(place, box, index);
  const on = (selector, action) => {
    const button = place.querySelector(selector);
    if (button) button.onclick = () => {
      action(button);
    };
  };
  on("[data-cpnuevo]", () => {
    centreForm(box, index, { nombre: search3?.value.trim() ?? "" });
  });
  on("[data-cpprivada]", () => {
    setCentre(box, index, { nombre: privateConsultation("U") });
    void paintCentrePicker(box, index);
    centreForm(box, index, { nombre: privateConsultation(), privada: true });
  });
  on("[data-cpaqui]", (button) => {
    accountsEditorLegacy.imHere(box, index, button);
  });
  if (mode === "buscar") search3?.focus();
}
function paintNewPickers(list) {
  [...list.children].forEach((box) => {
    const index = box.dataset.cons ?? "", place = box.querySelector(`[data-cp="${index}"]`);
    if (place && !place.dataset.listo) void paintCentrePicker(box, index);
  });
}

// src/app/screens/accounts/editor-form/centre-account.ts
var ADDRESS = ["direccion", "cp", "municipio", "provincia"];
var value = (id) => (document.getElementById(id)?.value ?? "").trim();
function addressHtml(index) {
  return `<h3 class="edch">${t("accountsEditor.centreAccount.title")}</h3>
    <label for="edcd">${t("accountsEditor.centreAccount.street")}</label><input id="edcd" data-cf="${index}|direccion" value="" placeholder="${t("accountsEditor.centreAccount.streetPlaceholder")}">
    <div class="g2"><div><label for="edcc">${t("accountsEditor.centreForm.postcode")}</label><input id="edcc" data-cf="${index}|cp" inputmode="numeric" maxlength="5" value=""></div>
      <div><label for="edcm">${t("accountsEditor.centreForm.town")}</label><input id="edcm" data-cf="${index}|municipio" autocapitalize="characters"></div></div>
    <label for="edcp">${t("accountsEditor.centreForm.province")}</label><input id="edcp" data-cf="${index}|provincia" autocapitalize="characters">`;
}
function locateBeforeSaving(box, index, saved) {
  return async () => {
    const name = value("en").toUpperCase(), field2 = consultationField(box, index, "centro_nombre");
    if (field2) field2.value = name;
    const address = value("edcd"), town = value("edcm");
    if (!address || address === saved.address && town === saved.town && saved.located) return;
    const found = await qualityLegacy.geocode(addressQuery([address, value("edcc"), town, value("edcp")]), { direccion: address, municipio: town, cp: value("edcc") }).catch(() => null);
    if (found && !found.fuera) {
      const lat = consultationField(box, index, "lat"), lon = consultationField(box, index, "lon");
      if (lat) lat.value = String(found.lat);
      if (lon) lon.value = String(found.lon);
    } else if (found?.fuera) notices.toast(t("accountsEditor.centreAccount.elsewhere", { place: found.fuera, town }), true);
    saved.address = address;
    saved.town = town;
  };
}
function showAddress(box, index) {
  const address = /* @__PURE__ */ new Map();
  ADDRESS.forEach((name) => {
    address.set(name, fieldValue(box, index, name));
    consultationField(box, index, name)?.remove();
  });
  box.insertAdjacentHTML("afterbegin", addressHtml(index));
  const set = (fieldId, name) => {
    const field2 = document.getElementById(fieldId);
    if (field2) field2.value = address.get(name) ?? "";
  };
  set("edcd", "direccion");
  set("edcc", "cp");
  set("edcm", "municipio");
  set("edcp", "provincia");
}
function adaptForCentre(id, hooks) {
  const body2 = document.getElementById("dbody"), list = document.getElementById("econs");
  if (!body2 || !list || document.getElementById("ee") || document.getElementById("esr")) return;
  body2.classList.add("edcentro");
  body2.querySelectorAll(".cpersform[data-cpamb=medico]").forEach((block) => {
    block.remove();
  });
  if (!id) [...list.children].slice(1).forEach((box2) => {
    box2.remove();
  });
  const box = list.firstElementChild;
  if (!box) return;
  const index = box.dataset.cons ?? "";
  showAddress(box, index);
  const label = [...box.querySelectorAll("label")].find((item) => (item.textContent ?? "").startsWith(t("accountsEditor.consultation.daysStart")));
  if (label) label.textContent = t("accountsEditor.centreAccount.hours");
  document.getElementById("eadd")?.closest(".acts")?.classList.add("hide");
  hooks.before.push(locateBeforeSaving(box, index, { address: value("edcd"), town: value("edcm"), located: Boolean(box.dataset.lat) }));
}

// src/app/screens/accounts/editor-form/day-picker.ts
var PARTS = ["M", "T"];
var AFTERNOON_FROM = 14;
var RANGE = /(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/;
var partName = (part) => t(part === "M" ? "accountsEditor.days.morning" : "accountsEditor.days.afternoon");
var STORED_PART = { M: "Mañana", T: "Tarde" };
function stateOf(days) {
  const state = {};
  accountsEditorLegacy.dayLetters().forEach((day) => {
    const text = String(days?.[day] ?? ""), range = RANGE.exec(text), startHour = range ? Number(range[1]?.slice(0, 2)) : null;
    const morning = /mañana/i.test(text) || startHour !== null && startHour < AFTERNOON_FROM;
    const afternoon = /tarde/i.test(text) || startHour !== null && startHour >= AFTERNOON_FROM;
    const hours = range ? `${range[1] ?? ""}-${range[2] ?? ""}` : "";
    state[day] = { M: morning, T: afternoon, h: { M: hours, T: hours } };
  });
  return state;
}
function hourSelect(index, day, part, chosen) {
  const list = part === "M" ? accountsEditorLegacy.morningHours() : accountsEditorLegacy.afternoonHours();
  return `<select data-dh="${index}|${day}|${part}"><option value="">${t("accountsEditor.days.noTime")}</option>${list.map((range) => `<option ${chosen === range ? "selected" : ""}>${range.replace("-", " - ")}</option>`).join("")}</select>`;
}
function htmlOf(state, index) {
  const cell2 = (day, part, item) => `<div class="dpc"><button type="button" class="dpt" data-dt="${index}|${day}|${part}" aria-pressed="${String(item[part])}">${item[part] ? "✓ " : ""}${partName(part)}</button>${item[part] ? hourSelect(index, day, part, item.h[part]) : ""}</div>`;
  return `<div class="dp" data-dp="${index}">
    <div class="qk"><button type="button" data-qk="${index}|lvm">${t("accountsEditor.days.weekMornings")}</button>
      <button type="button" data-qk="${index}|lvt">${t("accountsEditor.days.weekAfternoons")}</button>
      <button type="button" data-qk="${index}|clr">${t("accountsEditor.days.clear")}</button></div>
    ${accountsEditorLegacy.dayLetters().map((day) => {
    const item = state[day] ?? { M: false, T: false, h: { M: "", T: "" } };
    return `<div class="dprow"><b>${accountsEditorLegacy.dayName(day).slice(0, 3)}</b>
      ${cell2(day, "M", item)}
      ${cell2(day, "T", item)}
    </div>`;
  }).join("")}</div>`;
}
var dayPickerHtml = (days, index) => htmlOf(stateOf(days), index);
function readDays(container, index) {
  const days = {};
  accountsEditorLegacy.dayLetters().forEach((day) => {
    const parts = PARTS.filter((part) => container.querySelector(`[data-dt="${index}|${day}|${part}"]`)?.getAttribute("aria-pressed") === "true").map((part) => {
      const select = container.querySelector(`[data-dh="${index}|${day}|${part}"]`);
      return STORED_PART[part] + (select?.value ? ` ${select.value.replace(/\s/g, "")}` : "");
    });
    if (parts.length) days[day] = parts.join("; ");
  });
  return days;
}
function currentState(picker, index) {
  const state = {};
  accountsEditorLegacy.dayLetters().forEach((day) => {
    const item = { M: false, T: false, h: { M: "", T: "" } };
    PARTS.forEach((part) => {
      const button = picker.querySelector(`[data-dt="${index}|${day}|${part}"]`);
      if (button) item[part] = button.getAttribute("aria-pressed") === "true";
      const select = picker.querySelector(`[data-dh="${index}|${day}|${part}"]`);
      if (select) item.h[part] = select.value;
    });
    state[day] = item;
  });
  return state;
}
function repaint(picker, index, state) {
  const days = {};
  Object.entries(state).forEach(([day, item]) => {
    const parts = PARTS.filter((part) => item[part]).map((part) => STORED_PART[part] + (item.h[part] ? ` ${item.h[part].replace(/\s/g, "")}` : ""));
    if (parts.length) days[day] = parts.join("; ");
  });
  picker.outerHTML = dayPickerHtml(days, index);
}
function quick(state, mode) {
  Object.values(state).forEach((item) => {
    if (mode === "clr") {
      item.M = false;
      item.T = false;
      item.h = { M: "", T: "" };
    }
    if (mode === "lvm") item.M = true;
    if (mode === "lvt") item.T = true;
  });
}
function toggle(button, picker) {
  const [index = "", day = "", part = "M"] = (button.dataset.dt ?? "").split("|"), state = currentState(picker, index), item = state[day];
  if (item) item[part] = !item[part];
  repaint(picker, index, state);
}
function shortcut(button, picker) {
  const [index = "", mode = ""] = (button.dataset.qk ?? "").split("|"), state = currentState(picker, index);
  quick(state, mode);
  repaint(picker, index, state);
}
function answerDayPickerClick(target) {
  const day = target.closest("[data-dt]"), quickButton = target.closest("[data-qk]");
  const picker = (day ?? quickButton)?.closest(".dp");
  if (picker && day) toggle(day, picker);
  else if (picker && quickButton) shortcut(quickButton, picker);
}

// src/app/screens/accounts/editor-form/consultation.ts
var HIDDEN = ["centro_id", "centro_nombre", "municipio", "provincia", "direccion", "cp", "lat", "lon"];
var hidden = (index, name, value4) => `<input type="hidden" data-cf="${index}|${name}" value="${escapeHtml(value4 ?? "")}">`;
var input = (index, name, value4, extra) => `<input data-cf="${index}|${name}" value="${escapeHtml(value4 ?? "")}" ${extra}>`;
function consultationHtml2(item, index) {
  return `<div class="cons" data-cons="${index}" ${item.lat ? `data-lat="${escapeHtml(item.lat)}"` : ""}>
    <span class="consbar"><span class="consprio">${t("accountsEditor.consultation.main")}</span>
      <button type="button" class="kmv" data-cmov="-1" title="${t("accountsEditor.consultation.upTitle")}" aria-label="${t("accountsEditor.consultation.up")}">↑</button>
      <button type="button" class="kmv" data-cmov="1" title="${t("accountsEditor.consultation.downTitle")}" aria-label="${t("accountsEditor.consultation.down")}">↓</button>
      <button type="button" class="quitar" data-quitar="${index}">${t("accountsEditor.consultation.remove")}</button></span>
    <input type="hidden" data-cid="${index}" value="${escapeHtml(item.id ?? "")}">
    ${HIDDEN.map((name) => hidden(index, name, item[name])).join("")}
    <label>${t("accountsEditor.consultation.centre")}</label><div class="cenpick" data-cp="${index}"></div>
    <div class="g2 u-mt-10">
      <div><label>${t("accountsEditor.consultation.floor")}</label>${input(index, "planta", item.planta, `maxlength="60" placeholder="${t("accountsEditor.consultation.floorPlaceholder")}"`)}</div>
      <div><label>${t("accountsEditor.consultation.room")}</label>${input(index, "sala", item.sala, `maxlength="60" placeholder="${t("accountsEditor.consultation.roomPlaceholder")}"`)}</div>
    </div>
    <label>${t("accountsEditor.consultation.directions")}</label>${input(index, "indicaciones", item.indicaciones, `maxlength="300" placeholder="${t("accountsEditor.consultation.directionsPlaceholder")}"`)}
    <div class="g2 u-mt-10">
      <div><label>${t("accountsEditor.consultation.phone", { ofTheConsultation: term("consulta", { article: "del" }) })}</label>${input(index, "telefono", item.telefono, `inputmode="tel" placeholder="${t("accountsEditor.consultation.phonePlaceholder")}"`)}</div><div></div>
    </div>
    <label>${t("accountsEditor.consultation.days", { visit: term("visita") })}</label>${dayPickerHtml(item.dias ?? {}, index)}
  </div>`;
}
var nextIndex = (list) => String(1 + Math.max(-1, ...[...list.children].map((box) => Number(box.dataset.cons) || 0)));
function moveConsultation(move) {
  const box = move.closest(".cons"), parent = box?.parentElement;
  if (!box || !parent) return;
  if (move.dataset.cmov === "-1" && box.previousElementSibling) parent.insertBefore(box, box.previousElementSibling);
  else if (move.dataset.cmov === "1" && box.nextElementSibling) parent.insertBefore(box.nextElementSibling, box);
}
function bindConsultationList(list) {
  list.onclick = (event) => {
    const target = event.target, remove = target?.closest("[data-quitar]"), move = target?.closest("[data-cmov]");
    if (remove) {
      remove.closest(".cons")?.remove();
      if (!list.children.length) list.insertAdjacentHTML("beforeend", consultationHtml2({}, nextIndex(list)));
    } else if (move) moveConsultation(move);
  };
}
var orNull = (text) => text ? text : null;
function readConsultation(box) {
  const index = box.dataset.cons ?? "", value4 = (name) => fieldValue(box, index, name);
  return {
    id: orNull(box.querySelector(`[data-cid="${index}"]`)?.value),
    centro_id: orNull(value4("centro_id")),
    centro_nombre: value4("centro_nombre").toUpperCase(),
    municipio: value4("municipio").toUpperCase(),
    provincia: value4("provincia").toUpperCase(),
    direccion: value4("direccion"),
    cp: value4("cp"),
    telefono: value4("telefono"),
    dias: readDays(box, index),
    lat: orNull(value4("lat")),
    lon: orNull(value4("lon")),
    planta: value4("planta").trim(),
    sala: value4("sala").trim(),
    indicaciones: value4("indicaciones").trim()
  };
}
var readConsultations = (list) => [...list.children].map(readConsultation);

// src/app/screens/accounts/editor-form/salesperson.ts
async function addSalesperson(id, hooks) {
  const button = document.getElementById("eguardar");
  if (!cardSectionsLegacy.can("administrar") || !button) return;
  button.closest(".acts")?.insertAdjacentHTML("beforebegin", `<label for="ecom">${t("accountsEditor.salesperson.label")}</label>
    <select id="ecom"><option>${t("common.loading")}</option></select>
    <div class="sm u-mt-4">${t("accountsEditor.salesperson.hint")}</div>`);
  if (!salesTeam.members().length) await salesTeam.load();
  const { data: current } = await callRpc("responsable_de_cuenta", { p_medico: id });
  const before = current?.id ?? "", select = document.getElementById("ecom");
  if (!select) return;
  const members = salesTeam.members();
  select.innerHTML = `<option value="">${t("accountsEditor.salesperson.none")}</option>` + members.filter((member) => cardSectionsLegacy.roleCan(member.rol ?? "", "cartera") || member.id === before).map((member) => `<option value="${member.id}" ${member.id === before ? "selected" : ""}>${escapeHtml(member.nombre)} · ${escapeHtml(member.rol ?? "")}</option>`).join("");
  hooks.after.push(async () => {
    const now = document.getElementById("ecom")?.value ?? before;
    if (now === before) return;
    const { data: result } = await legacyDb().rpc("asignar_responsable_cuenta", { p_medico: id, p_usuario: now || null });
    if (result?.ok === false) notices.toast(t("accountsEditor.salesperson.couldNotChange"), true);
  });
}

// src/app/screens/accounts/list/cells.ts
var WORKDAYS2 = ["L", "M", "X", "J", "V"];
var CUSTOM_PREFIX = "cp:";
function nameCell(row) {
  const urgent = row.urgente ? `<span class="pill p-urg">${t("accounts.list.urgent")}</span> ` : "";
  const noReporting = row.sin_reporting ? `<span class="pill p-sr" title="${t("accounts.columns.noReportingTitle", { visit: term("visita") })}">${t("accounts.columns.noReporting")}</span> ` : "";
  return `<span class="nm">${urgent}${noReporting}${escapeHtml(row.nombre)}</span>`;
}
var daysCell = (row) => `<span class="dias">${WORKDAYS2.map((day) => `<span class="${row.dias?.[day] ? "on" : ""}" title="${escapeHtml(row.dias?.[day] ?? "")}">${day}</span>`).join("")}</span>`;
function salesRepsCell(row) {
  const reps = row.comerciales ?? [];
  return `<span class="comchips">${reps.length ? reps.map((rep) => `<span>${escapeHtml(accountColumnsLegacy.firstName(rep.nombre))}</span>`).join("") : `<span class="sin">${t("accounts.columns.unassigned")}</span>`}</span>`;
}
function accessCell(row, onAccessLoaded) {
  const access = accountColumnsLegacy.accessOf();
  if (!access) {
    void accountColumnsLegacy.loadAccess().then(() => {
      if (currentScreen() === "directorio") onAccessLoaded();
    });
    return "";
  }
  const own = access[row.id];
  if (!own) return `<span class="sm">${t("accounts.columns.noAccess")}</span>`;
  return `<span class="pill ${own.activo ? "p-est" : "p-anu"}">${t(own.activo ? "accounts.columns.withAccess" : "accounts.columns.accessDisabled")}</span>`;
}
function customCell(row, key) {
  const field2 = accountColumnsLegacy.customFields().find((item) => item.clave === key);
  return `<span class="sm">${escapeHtml(accountColumnsLegacy.fieldText(field2, row.clasificadores?.[key]))}</span>`;
}
var CELLS = /* @__PURE__ */ new Map([
  ["nombre", nameCell],
  ["dias", daysCell],
  ["estado_comercial", (row) => `<span class="pill p-est">${escapeHtml(row.estado_comercial)}</span>`],
  ["ultima_visita", (row) => `<span class="sm">${row.ultima_visita ? formatShortDate(row.ultima_visita) : "—"}</span>`],
  ["telefono", (row) => `<span class="sm">${escapeHtml(orFallback(row.telefono, row.consulta_telefono ?? ""))}</span>`],
  ["comerciales", salesRepsCell]
]);
function cell(row, key, onAccessLoaded) {
  if (key === "acceso") return accessCell(row, onAccessLoaded);
  if (key.startsWith(CUSTOM_PREFIX)) return customCell(row, key.slice(CUSTOM_PREFIX.length));
  const special = CELLS.get(key);
  if (special) return special(row);
  const value4 = row[key];
  return `<span class="sm">${escapeHtml(value4 ? String(value4) : "")}</span>`;
}

// delcos-shared:src/app/screens/accounts/list/columns.ts
var shared15 = globalThis["__delcosModules"]["screens/accounts/list/columns"];
var pick15 = (name) => shared15[name];
var columnDefinitions = /* @__PURE__ */ pick15("columnDefinitions");
var columnSettings = /* @__PURE__ */ pick15("columnSettings");
var columnTitle = /* @__PURE__ */ pick15("columnTitle");
var resetColumns = /* @__PURE__ */ pick15("resetColumns");
var saveColumns = /* @__PURE__ */ pick15("saveColumns");
var visibleColumns = /* @__PURE__ */ pick15("visibleColumns");

// src/app/screens/accounts/list/table.ts
function paintHeader() {
  const head = document.getElementById("thead");
  if (!head) return;
  const columns = visibleColumns(), width = columns.reduce((total, column) => total + column.w, 0);
  head.innerHTML = columns.map((column) => `<span class="tcell th" style="width:${column.w}px;min-width:${column.w}px">${escapeHtml(columnTitle(column.k))}<i class="res" data-res="${column.k}"></i></span>`).join("");
  head.style.minWidth = `${width}px`;
  const list = document.getElementById("lista");
  if (list) list.style.minWidth = `${width}px`;
  markSort(head, columns);
}
function markSort(head, columns) {
  const [key = "", direction] = String(accountListLegacy.filters().orden || "").split(":");
  [...head.querySelectorAll(".th")].forEach((header2, index) => {
    const column = columns[index], sortKey = column ? accountListLegacy.sortKey(column.k) : void 0;
    if (!column || !sortKey) return;
    header2.dataset.ordk = column.k;
    header2.classList.add("htord");
    header2.title = t("accounts.list.sortBy");
    const current = sortKey === key && !((key === "nombre" || key === "reciente") && !direction);
    header2.classList.toggle("ord-asc", current && direction !== "desc");
    header2.classList.toggle("ord-desc", current && direction === "desc");
  });
}
function rowHtml(row, onAccessLoaded) {
  const cells = visibleColumns().map((column) => `<span class="tcell" style="width:${column.w}px;min-width:${column.w}px">${cell(row, column.k, onAccessLoaded)}</span>`).join("");
  const place = [row.centro_nombre, row.municipio].filter(Boolean).join(" · ");
  const card = `<span class="plcard"><b>${row.urgente ? `<i class="plurg" aria-label="${t("accounts.list.urgent")}"></i>` : ""}${escapeHtml(row.nombre ?? "")}</b><span class="plc2">${escapeHtml(place)}</span><span class="plc3">${cell(row, "estado_comercial", onAccessLoaded)}</span></span>`;
  return `<button class="trow" data-id="${row.id}">${cells}${card}</button>`;
}
function paintChips() {
  const box = document.getElementById("chips");
  if (!box) return;
  const filters = accountListLegacy.filters();
  const chips = [
    ...filters.q ? [["q", t("accounts.list.chipSearch", { text: filters.q })]] : [],
    ...[["prov", filters.prov], ["muni", filters.muni], ["esp", filters.esp], ["est", filters.est]].filter(([, value4]) => value4),
    ...filters.urg ? [["urg", t("accounts.list.chipUrgent")]] : [],
    ...filters.mios ? [["mios", t("accounts.list.chipMine")]] : [],
    ...filters.sin ? [["sin", t("accounts.list.chipNeverVisited")]] : []
  ];
  box.innerHTML = chips.map(([key, text]) => `<button class="chip" data-x="${key}">${escapeHtml(text)} ✕</button>`).join("") + accountListLegacy.fieldChips(filters.campos).map((chip) => `<button class="chip" data-xcp="${escapeHtml(chip.k)}">${escapeHtml(chip.t)} ✕</button>`).join("");
}

// delcos-shared:src/app/legacy/rest-bridge.ts
var shared16 = globalThis["__delcosModules"]["legacy/rest-bridge"];
var pick16 = (name) => shared16[name];
var restLegacy = /* @__PURE__ */ pick16("restLegacy");

// src/app/screens/accounts/map/index.ts
var URGENT = "#B42318";
var NO_STATE = "#6B7F95";
var START = [41.6, 1.9];
var START_ZOOM = 9;
var MAX_ZOOM = 19;
var RESIZE_MS = 60;
var TILES = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
var map = null;
var layer = null;
var colourOf = (point) => point.urgente && !point.ultima_visita ? URGENT : restLegacy.stateColour(point.estado) || NO_STATE;
function popupHtml(point, colour) {
  return `<b>${escapeHtml(point.nombre)}</b><br>${escapeHtml(point.especialidad ?? "")}<br>${escapeHtml(point.centro ?? "")} ${escapeHtml(point.municipio ?? "")}<br>
       <span style="color:${colour};font-weight:700">${escapeHtml(point.estado)}</span><br>
       <a href="#" data-mapficha="${escapeHtml(point.id)}">${t("accountsMap.openCard")}</a>`;
}
function legendHtml(found, total) {
  const states = commercialStates.all().map((state) => `<span><i style="background:${restLegacy.stateColour(state.valor) || NO_STATE}"></i>${escapeHtml(state.valor)}</span>`).join("");
  return `<span><i style="background:${URGENT}"></i>${t("accountsMap.urgent")}</span>${states}<span style="margin-left:auto">${t("accountsMap.found", { shown: `<b>${formatNumber(found)}</b>`, total: formatNumber(total) })}</span>`;
}
function readyMap(leaflet) {
  if (!map) {
    map = leaflet.map("mapa", { preferCanvas: true }).setView(START, START_ZOOM);
    leaflet.tileLayer(TILES, { maxZoom: MAX_ZOOM, attribution: "© OpenStreetMap" }).addTo(map);
  }
  layer?.remove();
  layer = leaflet.layerGroup().addTo(map);
  return { map, layer };
}
async function paintMap() {
  const legend = document.getElementById("mapleg"), leaflet = restLegacy.leaflet();
  if (!legend) return;
  if (!leaflet) {
    legend.textContent = t("accountsMap.needsConnection");
    return;
  }
  legend.textContent = t("accountsMap.loading");
  const filters = accountListLegacy.filters();
  const { data, error } = await legacyDb().rpc("mapa_cuentas", {
    q: filters.q || null,
    f_provincia: filters.prov || null,
    f_municipio: filters.muni || null,
    f_estado: filters.est || null,
    f_especialidad: filters.esp || null,
    f_urgentes: Boolean(filters.urg)
  });
  if (error) {
    legend.textContent = t("accountsMap.couldNotLoad", { error: error.message ?? "" });
    return;
  }
  const points = data ?? [], ready = readyMap(leaflet);
  points.forEach((point) => {
    const colour = colourOf(point);
    leaflet.circleMarker([point.lat, point.lon], { radius: point.urgente ? 7 : 5, color: "#fff", weight: 1.5, fillColor: colour, fillOpacity: 0.92 }).addTo(ready.layer).bindPopup(popupHtml(point, colour));
  });
  if (points.length) ready.map.fitBounds(points.map((point) => [point.lat, point.lon]), { padding: [30, 30] });
  setTimeout(() => {
    ready.map.invalidateSize();
  }, RESIZE_MS);
  legend.innerHTML = legendHtml(points.length, filters.total);
}

// src/app/screens/accounts/list/search.ts
var lastSearch = 0;
var orNull2 = (value4) => value4 ? value4 : null;
var loadingHtml = (text) => `<div class="cargador"><span class="spin"></span><span class="sm">${escapeHtml(text)}</span></div>`;
function searchParams() {
  const filters = accountListLegacy.filters(), size = accountListLegacy.pageSize();
  return {
    q: filters.q || null,
    f_provincia: filters.prov || null,
    f_municipio: filters.muni || null,
    f_estado: filters.est || null,
    f_especialidad: filters.esp || null,
    f_area: null,
    f_urgentes: filters.urg,
    f_mios: Boolean(filters.mios),
    f_sin_visitar: Boolean(filters.sin),
    f_comercial: orNull2(filters.com),
    f_reporting: orNull2(filters.rep),
    ...filters.tipo ? { f_tipo: filters.tipo } : {},
    orden: filters.orden,
    lim: size,
    desplaz: filters.pagina * size,
    ...Object.keys(filters.campos).length ? { f_campos: filters.campos } : {}
  };
}
function syncTypeFilter() {
  const select = document.getElementById("ftipo");
  if (!select) return;
  const professionals = select.options[1];
  if (professionals) professionals.text = term("medico", { number: "p", capital: "C" });
  const type = accountListLegacy.filters().tipo ?? "";
  if (select.value !== type) select.value = type;
}
function showFailure(list, count, error) {
  count.textContent = "";
  const aborted = /abort/i.test(error?.message ?? "");
  list.innerHTML = `<div class="vacio">${t("accounts.list.couldNotLoad")}${aborted ? t("accounts.list.notResponding") : ""}.<br><button class="btn sec u-mt-10" type="button" id="dirreint">${t("accounts.list.retry")}</button></div>`;
  const retry = document.getElementById("dirreint");
  if (retry) retry.onclick = () => {
    void searchAccounts(true);
  };
}
function showResult(data, list, count, elapsedMs) {
  const filters = accountListLegacy.filters();
  filters.total = data.total;
  count.innerHTML = t("accounts.list.count", { count: formatNumber(data.total), contacts: escapeHtml(accountListLegacy.contactsLabel().toLowerCase()), ms: elapsedMs });
  paintChips();
  const rows = data.filas ?? [];
  if (!rows.length) {
    list.innerHTML = `<div class="vacio">${t("accounts.list.noMatches")}</div>`;
    const head = document.getElementById("thead");
    if (head) head.innerHTML = "";
  } else {
    paintHeader();
    list.innerHTML = rows.map((row) => rowHtml(row, () => {
      void searchAccounts(true);
    })).join("");
  }
  accountListLegacy.paginate({
    element: document.getElementById("dirpag"),
    total: data.total,
    page: filters.pagina,
    onPage: (page) => {
      filters.pagina = page;
      void searchAccounts(false);
      document.getElementById("tabla")?.scrollIntoView({ block: "start", behavior: "smooth" });
    },
    onSize: () => {
      void searchAccounts(true);
    }
  });
}
async function searchWithRetry(mine) {
  const params = searchParams();
  let answer = await legacyDb().rpc("buscar_cuentas", params);
  if (mine !== lastSearch) return null;
  if (answer.error || !answer.data) {
    answer = await legacyDb().rpc("buscar_cuentas", params);
    if (mine !== lastSearch) return null;
  }
  return answer;
}
async function searchAccounts(reset2 = false) {
  syncTypeFilter();
  if (accountListLegacy.mapMode() && reset2) setTimeout(() => {
    void paintMap();
  }, 10);
  if (reset2) accountListLegacy.filters().pagina = 0;
  const mine = ++lastSearch, list = document.getElementById("lista"), count = document.getElementById("cuenta");
  if (!list || !count) return;
  list.innerHTML = loadingHtml(t("accounts.list.searching", { contacts: accountListLegacy.contactsLabel().toLowerCase() }));
  count.textContent = t("accounts.list.searchingShort");
  const started = performance.now(), answer = await searchWithRetry(mine);
  if (!answer) return;
  if (answer.error || !answer.data) {
    showFailure(list, count, answer.error);
    return;
  }
  showResult(answer.data, list, count, Math.round(performance.now() - started));
}

// src/app/screens/accounts/editor-form/save.ts
var MIN_NAME = 3;
var DUPLICATE_PERCENT = 70;
var CENTRE3 = "Centro";
var value2 = (id) => (document.getElementById(id)?.value ?? "").trim();
function payload(id, account) {
  const isCentre2 = account.tipo === CENTRE3, noReporting = document.getElementById("esr"), list = document.getElementById("econs");
  return {
    id: id ?? null,
    tipo: account.tipo,
    nombre: value2("en").toUpperCase(),
    especialidad: isCentre2 ? "" : value2("ee"),
    area: isCentre2 ? "" : value2("ea"),
    telefono: value2("et"),
    email: value2("em"),
    contacto: value2("ect"),
    nota: value2("eno"),
    estado_comercial: account.estado_comercial,
    consultas: list ? readConsultations(list) : [],
    sin_reporting: noReporting ? noReporting.checked : Boolean(account.sin_reporting)
  };
}
function problemOf(id, account, name, missing) {
  if (name.length < MIN_NAME) return t("accountsEditor.save.writeName");
  if (missing) return t("accountsEditor.save.fillField", { field: missing });
  if (!id && account.tipo !== CENTRE3 && !name.includes(",")) return t("accountsEditor.save.nameFormat");
  return null;
}
var duplicateRow = (item) => `<div class="l"><span><b>${escapeHtml(item.nombre)}</b><br><span class="sm">${[item.especialidad, item.centro, item.municipio].filter(Boolean).map(escapeHtml).join(" · ")}</span></span>
            <span><b>${item.pct}%</b></span></div>`;
async function warnedOfDuplicates(data) {
  const firstTown = data.consultas[0]?.municipio ?? null;
  const { data: found } = await legacyDb().rpc("duplicados_de", { p_nombre: data.nombre, p_tipo: data.tipo, p_municipio: firstTown ? firstTown : null });
  const close = (found ?? []).filter((item) => item.pct >= DUPLICATE_PERCENT);
  const box = document.getElementById("edup"), button = document.getElementById("eguardar");
  if (!close.length || !box || !button) return false;
  box.innerHTML = `<div class="dupbox"><b>${t("accountsEditor.save.mayExist")}</b>
          <div class="sm">${t("accountsEditor.save.mayExistHint")}</div>
          ${close.map(duplicateRow).join("")}</div>`;
  button.textContent = t("accountsEditor.save.createAnyway");
  return true;
}
async function store(state, data, button) {
  button.disabled = true;
  button.textContent = t("accountsEditor.save.saving");
  const { data: result, error } = await legacyDb().rpc("guardar_cuenta", { p: data });
  button.disabled = false;
  button.textContent = t(state.id ? "accountsEditor.editor.saveChanges" : "accountsEditor.editor.create");
  if (error) {
    notices.toast(t("accountsEditor.save.couldNotSave", { error: error.message ?? "" }), true);
    return null;
  }
  return result ?? {};
}
async function readyToSave(state, data, missing) {
  const problem = problemOf(state.id, state.account, data.nombre, missing);
  if (problem) {
    notices.toast(problem, true);
    return false;
  }
  if (!state.id && !state.warned && await warnedOfDuplicates(data)) {
    state.warned = true;
    return false;
  }
  return true;
}
function done(state, savedId) {
  document.getElementById("dlg")?.close();
  notices.toast(t(state.id ? "accountsEditor.save.saved" : "accountsEditor.save.created"));
  void searchAccounts(true);
  miscLegacy.reloadHome();
  if (savedId) void openAccountCard(savedId);
}
async function save2(state, button) {
  for (const step of state.hooks.before) await step();
  const data = payload(state.id, state.account), fields = readCustomFields(document.getElementById("dbody"));
  if (!await readyToSave(state, data, fields?.falta[0])) return;
  const result = await store(state, data, button);
  if (!result) return;
  const savedId = result.medico?.id ?? state.id ?? "";
  if (fields && !await saveCustomFields(fields, savedId)) return;
  for (const step of state.hooks.after) await step(savedId);
  done(state, result.medico?.id);
}
function bindSave(id, account) {
  const state = { id, account, hooks: { before: [], after: [] }, warned: false };
  const button = document.getElementById("eguardar");
  if (button) button.onclick = () => {
    void save2(state, button);
  };
  return state.hooks;
}

// src/app/screens/accounts/editor-form/editor.ts
var CENTRE4 = "Centro";
function headHtml(account, id, isCentre2) {
  const title = id ? t("accountsEditor.editor.editTitle") : isCentre2 ? t("accountsEditor.editor.newCentre") : escapeHtml(newAccountNames().nueva);
  const subtitle = id ? escapeHtml(account.nombre ?? "") : isCentre2 ? t("accountsEditor.editor.centreSubtitle") : t("accountsEditor.editor.personSubtitle", { professional: term("medico", { capital: "C" }) });
  return `<div class="fh"><div><h2>${title}</h2>
      <div class="sm">${subtitle}</div></div>
      <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>`;
}
function personFields(account) {
  return `<div class="g2">
      <div><label for="ee">${term("especialidad", { capital: "C" })}</label><select id="ee">${catalogOptions("especialidad", account.especialidad)}</select></div>
      <div><label for="ea">${t("accountsEditor.editor.area")}</label><select id="ea">${catalogOptions("area", account.area)}</select></div></div>`;
}
function formHtml3(account, consultations, id) {
  const isCentre2 = account.tipo === CENTRE4, value4 = (text) => escapeHtml(text ?? "");
  return `
    ${headHtml(account, id, isCentre2)}
    <label for="en">${t(isCentre2 ? "accountsEditor.editor.centreName" : "accountsEditor.editor.personName")}</label>
    <input id="en" value="${value4(account.nombre)}" placeholder="${t(isCentre2 ? "accountsEditor.editor.centreNamePlaceholder" : "accountsEditor.editor.personNamePlaceholder")}" autocapitalize="characters">
    ${isCentre2 ? "" : personFields(account)}
    <div class="g2">
      <div><label for="et">${t("accountsEditor.editor.phone")}</label><input id="et" value="${value4(account.telefono)}" inputmode="tel"></div>
      <div><label for="em">${t("accountsEditor.editor.email")}</label><input id="em" type="email" value="${value4(account.email)}"></div>
    </div>
    <label for="ect">${t("accountsEditor.editor.contact")}</label><input id="ect" value="${value4(account.contacto)}">
    ${isCentre2 ? "" : `<label class="chksr"><input type="checkbox" id="esr" ${account.sin_reporting ? "checked" : ""}><span><b>${t("accountsEditor.editor.noReporting")}</b><span class="sm">${t("accountsEditor.editor.noReportingHint", { visit: term("visita") })}</span></span></label>`}
    <label for="eno">${t("accountsEditor.editor.note")}</label><textarea id="eno" rows="3">${value4(account.nota)}</textarea>
    ${customFieldsHtml("medico", account.clasificadores)}
    <div id="econs">${consultations.map((item, index) => consultationHtml2(item, String(index))).join("")}</div>
    <div class="acts"><button type="button" class="btn sec" id="eadd">${t("accountsEditor.editor.addConsultation", { consultation: term("consulta") })}</button></div>
    <div id="edup"></div>
    <div class="acts u-end">
      <button class="btn sec" data-cerrar>${t("common.cancel")}</button>
      <button class="btn" id="eguardar">${t(id ? "accountsEditor.editor.saveChanges" : "accountsEditor.editor.create")}</button>
    </div>`;
}
async function loadAccount(id, type) {
  if (!id) return { account: { tipo: type ?? "Persona", estado_comercial: accountsEditorLegacy.initialState() }, consultations: [{}] };
  const { data, error } = await legacyDb().rpc("ficha_cuenta", { p_id: id });
  if (error || !data) {
    notices.toast(t("accountsEditor.editor.couldNotOpen", { error: error?.message ?? "" }), true);
    return null;
  }
  return { account: data.medico, consultations: data.consultas?.length ? data.consultas : [{}] };
}
async function openEditor(id, type) {
  const loaded = await loadAccount(id, type);
  const body2 = document.getElementById("dbody"), dialog = document.getElementById("dlg");
  if (!loaded || !body2 || !dialog) return;
  body2.innerHTML = formHtml3(loaded.account, loaded.consultations, id);
  const list = document.getElementById("econs"), add = document.getElementById("eadd");
  if (list) {
    bindConsultationList(list);
    paintNewPickers(list);
    if (add) add.onclick = () => {
      list.insertAdjacentHTML("beforeend", consultationHtml2({}, nextIndex(list)));
      paintNewPickers(list);
    };
  }
  const save4 = bindSave(id, loaded.account);
  dialog.showModal();
  if (id) await addSalesperson(id, save4);
  if (loaded.account.tipo === CENTRE4) adaptForCentre(id, save4);
}

// delcos-shared:src/app/screens/accounts/timetable.ts
var shared17 = globalThis["__delcosModules"]["screens/accounts/timetable"];
var pick17 = (name) => shared17[name];
var missingTimetable = /* @__PURE__ */ pick17("missingTimetable");

// src/app/screens/accounts/card/sections-base.ts
async function timetableNotice(id) {
  const header2 = document.querySelector("#fbody .fh");
  if (!stillShown(id) || !header2) return;
  if (!await missingTimetable(id) || !stillShown(id) || document.getElementById("fhorario")) return;
  document.querySelector("#fbody .fh")?.insertAdjacentHTML("afterend", `<div class="avisoh" id="fhorario">
    <span>${t("accounts.base.timetableMissing")}</span>
    ${cardBaseLegacy.canEdit() ? `<button class="btn sec" id="fhcompletar">${t("accounts.base.completeTimetable")}</button>` : ""}</div>`);
  const complete = document.getElementById("fhcompletar");
  if (complete) complete.onclick = () => {
    void openEditor(id);
  };
}
var PERIODS = [
  ["accounts.base.unitsToday", "hoy"],
  ["accounts.base.unitsWeek", "semana"],
  ["accounts.base.unitsMonth", "mes"],
  ["accounts.base.unitsQuarter", "trimestre"],
  ["accounts.base.unitsYear", "anio"],
  ["accounts.base.unitsTotal", "total"]
];
function unitsHtml(units2, series) {
  const prescriptions = (count) => term("pauta", { number: count === 1 ? "s" : "p" });
  const summary2 = units2.total ? `${t("accounts.base.unitsSummary", { count: formatNumber(units2.pautas), prescriptions: prescriptions(units2.pautas), date: formatShortDate(units2.ultima) })}<span id="fusley">${cardBaseLegacy.unitsLegend(series)}</span>` : t("accounts.base.noPrescriptions", { prescriptions: term("pauta", { number: "p" }) });
  const choices = units2.total ? `<div class="segs" id="fuserie" role="group" aria-label="${t("accounts.base.evolution")}">${cardBaseLegacy.unitsSeries().map(([key, label]) => `<button type="button" data-us="${key}" class="${key === series ? "on" : ""}">${label}</button>`).join("")}</div>` : "";
  return `<div class="blk" id="fundades"><h3>${t("accounts.base.unitsTitle")}</h3>
    <div class="uper">${PERIODS.map(([label, key]) => `<div><b>${formatNumber(units2[key])}</b><span>${t(label)}</span></div>`).join("")}</div>
    ${choices}
    <div class="spark" id="fuspark">${cardBaseLegacy.unitsChart(units2, series)}</div>
    <div class="sm">${summary2}</div></div>`;
}
async function units(id) {
  const box = document.getElementById("fbody");
  if (!stillShown(id) || !box || document.getElementById("fundades")) return;
  const { data } = await callRpc("unidades_cuenta", { p_medico: id });
  if (!data || !stillShown(id) || document.getElementById("fundades")) return;
  const html = unitsHtml(data, cardBaseLegacy.unitsSeriesChosen()), sales = document.getElementById("fventasc");
  if (sales) sales.insertAdjacentHTML("afterbegin", html);
  else (box.querySelector(".blk:nth-of-type(2)") ?? box.lastElementChild)?.insertAdjacentHTML("beforebegin", html);
  box.querySelectorAll("#fuserie [data-us]").forEach((button) => {
    button.onclick = () => {
      const series = button.dataset.us ?? "mes";
      cardBaseLegacy.chooseUnitsSeries(series);
      box.querySelectorAll("#fuserie [data-us]").forEach((other) => other.classList.toggle("on", other === button));
      const chart = document.getElementById("fuspark"), legend = document.getElementById("fusley");
      if (chart) chart.innerHTML = cardBaseLegacy.unitsChart(data, series);
      if (legend) legend.textContent = cardBaseLegacy.unitsLegend(series);
    };
  });
}

// src/app/screens/accounts/card/sections-history.ts
async function visitPhotos(id) {
  const rows = historyRows();
  if (!rows.length) return;
  const { data } = await legacyDb().from("actividad_fotos").select("actividad_id").in("actividad_id", rows.map((row) => row.dataset.vrow));
  const counts = /* @__PURE__ */ new Map();
  (data ?? []).forEach((photo) => {
    counts.set(photo.actividad_id, (counts.get(photo.actividad_id) ?? 0) + 1);
  });
  rows.forEach((row) => {
    if (row.querySelector("[data-vfotos]")) return;
    const count = counts.get(row.dataset.vrow ?? "") ?? 0, place = row.querySelector("span");
    if (!place || !count && !row.querySelector("[data-editv]")) return;
    const label = count ? count === 1 ? t("accounts.card.photo") : t("accounts.card.photos", { count }) : t("accounts.card.addPhotos");
    place.insertAdjacentHTML("beforeend", `<div><button type="button" class="lnk vfotoslnk" data-vfotos="${row.dataset.vrow ?? ""}">${icon("camera")} ${label}</button></div>`);
  });
  document.querySelectorAll("#fbody [data-vfotos]").forEach((button) => {
    button.onclick = () => {
      relatedLegacy.openVisitPhotos(button.dataset.vfotos ?? "", id);
    };
  });
}
async function presentedProducts(id) {
  const rows = historyRows();
  if (!rows.length || document.querySelector("#fbody .vprodtx")) return;
  const { data } = await legacyDb().from("actividades").select("id,productos").in("id", rows.map((row) => row.dataset.vrow));
  const ids = [...new Set((data ?? []).flatMap((visit) => visit.productos ?? []))];
  if (!ids.length || !stillShown(id)) return;
  const { data: products } = await legacyDb().from("productos").select("id,nombre").in("id", ids);
  const names = new Map((products ?? []).map((product) => [product.id, product.nombre]));
  (data ?? []).forEach((visit) => {
    const row = document.querySelector(`#fbody [data-vrow="${visit.id}"]`), place = row?.querySelector("span");
    const presented = (visit.productos ?? []).map((product) => names.get(product)).filter((name) => Boolean(name));
    if (place && presented.length && !row?.querySelector(".vprodtx")) place.insertAdjacentHTML("beforeend", `<div class="sm vprodtx">${t("accounts.card.presented", { list: presented.map(escapeHtml).join(", ") })}</div>`);
  });
}
function visitMaterial(id) {
  if (!stillShown(id)) return Promise.resolve();
  document.querySelectorAll("#fbody [data-editv]").forEach((button) => {
    let visit;
    try {
      visit = JSON.parse(button.dataset.editv ?? "");
    } catch {
      return;
    }
    const text = cardSectionsLegacy.visitDetails(visit);
    if (!text) return;
    const place = button.parentElement?.querySelector(":scope > span");
    if (place && !place.querySelector(".vdet")) place.insertAdjacentHTML("beforeend", `<div class="sm vdet">📎 ${escapeHtml(text)}</div>`);
  });
  return Promise.resolve();
}

// delcos-shared:src/app/screens/equipment/model.ts
var shared18 = globalThis["__delcosModules"]["screens/equipment/model"];
var pick18 = (name) => shared18[name];
var reviewPill = /* @__PURE__ */ pick18("reviewPill");

// delcos-shared:src/app/screens/surgeries/model.ts
var shared19 = globalThis["__delcosModules"]["screens/surgeries/model"];
var pick19 = (name) => shared19[name];
var statePill = /* @__PURE__ */ pick19("statePill");

// delcos-shared:src/app/screens/tenders/model.ts
var shared20 = globalThis["__delcosModules"]["screens/tenders/model"];
var pick20 = (name) => shared20[name];
var contractEnd = /* @__PURE__ */ pick20("contractEnd");
var daysLeft = /* @__PURE__ */ pick20("daysLeft");
var statePill2 = /* @__PURE__ */ pick20("statePill");

// src/app/screens/accounts/card/sections-related.ts
var ATTENDED = "Asistió";
var NOT_ATTENDED = "No asistió";
var AWARDED = "Adjudicado";
var INSTALLED = "Instalado";
var CENTRE5 = "Centro";
var OPEN_TENDERS = ["En estudio", "Oferta enviada", AWARDED];
var SHOWN_EVENTS = 5;
var canAdd = (blockId, section) => Boolean(fieldsPlace()) && !document.getElementById(blockId) && (!section || accountCardLegacy.planIncludes(section));
async function samples(id) {
  if (!canAdd("fmuestras")) return;
  const { data } = await legacyDb().rpc("muestras_de_cuenta", { p_cuenta: id });
  if (!Array.isArray(data) || !data.length) return;
  const pill = (sample) => {
    if (!sample.en_plazo) return `<span class="pill p-anu">${t("accounts.card.samplesOutOfTime")}</span>`;
    return sample.quedan ? "" : `<span class="pill p-warn">${t("accounts.card.samplesNoneLeft")}</span>`;
  };
  addBeforeFields(id, "fmuestras", `<div class="blk" id="fmuestras"><h3>${t("accounts.card.samplesTitle")}</h3>
      ${data.map((sample) => `<div class="fmrow"><span>${escapeHtml(sample.nombre)}</span><b>${t("accounts.card.samplesGiven", { given: sample.entregadas, max: sample.max })}</b>${pill(sample)}</div>`).join("")}</div>`);
}
async function events(id) {
  if (!canAdd("feventos", "eventos")) return;
  const { data } = await legacyDb().from("eventos_asistentes").select("estado,eventos(id,titulo,fecha)").eq("cuenta_id", id).limit(30);
  const list = (data ?? []).filter((item) => item.eventos !== null).sort((first2, second) => String(second.eventos.fecha).localeCompare(String(first2.eventos.fecha))).slice(0, SHOWN_EVENTS);
  if (!list.length) return;
  const pillClass = (state) => state === ATTENDED ? "p-est" : state === NOT_ATTENDED ? "p-anu" : "p-per";
  const block = addBeforeFields(id, "feventos", `<div class="blk" id="feventos"><h3>${t("accounts.card.eventsTitle")}</h3>
      ${list.map((item) => `<div class="fmrow"><span><button type="button" class="lnk" data-fev="${item.eventos.id}">${escapeHtml(item.eventos.titulo)}</button><span class="sm"> · ${formatShortDate(item.eventos.fecha)}</span></span><span class="pill ${pillClass(item.estado)}">${escapeHtml(item.estado)}</span></div>`).join("")}</div>`);
  if (block) onEach(block, "fev", (event) => {
    closeCardAnd(() => {
      relatedLegacy.openEvent(event);
    });
  });
}
function depositText(state) {
  const lines = (state.lineas ?? []).filter((line) => line.unidades > 0), total = sum(lines.map((line) => line.unidades));
  if (!state.existe || !total) return t("accounts.card.depositNone");
  const productCount = new Set(lines.map((line) => line.producto_id)).size, expiring = lines.filter((line) => relatedLegacy.expiresSoon(line.caducidad)).length;
  const products = productCount === 1 ? t("accounts.card.oneProduct") : t("accounts.card.products", { count: productCount });
  const soon = expiring ? ` · <b class="u-warn">${expiring === 1 ? t("accounts.card.oneBatchExpires") : t("accounts.card.batchesExpire", { count: expiring })}${t("accounts.card.inLessThan60Days")}</b>` : "";
  return t("accounts.card.depositUnits", { units: formatNumber(total), products }) + soon;
}
async function deposit(id) {
  if (!canAdd("fdeposito", "deposito")) return;
  const account = await accountKind(id);
  if (account?.tipo !== CENTRE5) return;
  const { data: state } = await legacyDb().rpc("deposito_estado", { p_cuenta: id });
  if (!state || state.ok === false || !canAdd("fdeposito") || !stillShown(id)) return;
  addBeforeFields(id, "fdeposito", `<div class="blk" id="fdeposito"><h3>${t("accounts.card.depositTitle")}</h3>
      <p class="sm">${depositText(state)}</p>
      <button type="button" class="btn sec" id="fdepabrir">${t(state.existe ? "accounts.card.depositOpen" : "accounts.card.depositLeave")}</button></div>`);
  const open = document.getElementById("fdepabrir");
  if (open) open.onclick = () => {
    closeCardAnd(() => {
      relatedLegacy.openDeposit(id, account.nombre ?? "");
    });
  };
}
async function surgeries(id) {
  if (permissions.isProfessionalPortal() || !canAdd("fcirugias", "cirugias")) return;
  const { data } = await legacyDb().from("cirugias").select("id,fecha,procedimiento,estado").or(`cirujano_id.eq.${id},hospital_id.eq.${id}`).order("fecha", { ascending: false }).limit(5);
  if (!(data ?? []).length) return;
  const block = addBeforeFields(id, "fcirugias", `<div class="blk" id="fcirugias"><h3>${t("accounts.card.surgeriesTitle")}</h3>
      ${(data ?? []).map((item) => `<div class="fmrow"><span><button type="button" class="lnk" data-fcir="${item.id}">${escapeHtml(orFallback(item.procedimiento, t("accounts.card.surgery")))}</button><span class="sm"> · ${formatShortDate(item.fecha)}</span></span>${statePill(item)}</div>`).join("")}</div>`);
  if (block) onEach(block, "fcir", (surgery) => {
    closeCardAnd(() => {
      relatedLegacy.openSurgery(surgery);
    });
  });
}
function tenderEnd(tender) {
  const left = daysLeft(tender);
  if (tender.estado !== AWARDED || left === null) return "";
  return ` · ${left < 0 ? t("accounts.card.tenderExpired") : t("accounts.card.tenderExpiresOn", { date: formatShortDate(contractEnd(tender) ?? "") })}`;
}
async function tenders(id) {
  if (permissions.isProfessionalPortal() || !canAdd("fconcursos", "concursos")) return;
  const { data } = await legacyDb().from("concursos").select("id,titulo,estado,fin,prorroga_hasta").eq("cuenta_id", id).in("estado", OPEN_TENDERS).order("creado_en", { ascending: false }).limit(6);
  if (!(data ?? []).length) return;
  const block = addBeforeFields(id, "fconcursos", `<div class="blk" id="fconcursos"><h3>${t("accounts.card.tendersTitle")}</h3>
      ${(data ?? []).map((item) => `<div class="fmrow"><span><button type="button" class="lnk" data-fcon="${item.id}">${escapeHtml(item.titulo)}</button>${tenderEnd(item) ? `<span class="sm">${tenderEnd(item)}</span>` : ""}</span>${statePill2(item.estado)}</div>`).join("")}</div>`);
  if (block) onEach(block, "fcon", (tender) => {
    closeCardAnd(() => {
      relatedLegacy.openTender(tender);
    });
  });
}
function equipmentRow(item) {
  const details = (item.serie ? t("accounts.card.serial", { serial: escapeHtml(item.serie) }) : "") + (item.ubicacion ? ` · ${escapeHtml(item.ubicacion)}` : "");
  return `<div class="fmrow"><span><button type="button" class="lnk" data-feq="${item.id}">${escapeHtml(orFallback(item.productos?.nombre, t("accounts.card.equipment")))}</button><span class="sm">${details}</span></span>${reviewPill(item)}</div>`;
}
async function equipment(id) {
  if (permissions.isProfessionalPortal() || !canAdd("fequipos", "parque")) return;
  const { data } = await legacyDb().from("equipos").select("id,serie,ubicacion,estado,contrato,contrato_fin,garantia_hasta,proxima_revision,productos(nombre)").eq("cuenta_id", id).eq("estado", INSTALLED).order("instalado", { ascending: false }).limit(20);
  if (!canAdd("fequipos") || !stillShown(id)) return;
  const list = data ?? [], account = await accountKind(id);
  if (!list.length && account?.tipo !== CENTRE5) return;
  const block = addBeforeFields(id, "fequipos", equipmentHtml(list));
  if (block) bindEquipment(block, id, account?.nombre ?? "");
}
function equipmentHtml(list) {
  return `<div class="blk" id="fequipos"><h3>${t("accounts.card.equipmentTitle")}${list.length ? ` <span class="n">${list.length}</span>` : ""}</h3>
      ${list.map(equipmentRow).join("") || `<p class="sm">${t("accounts.card.equipmentNone")}</p>`}
      <button type="button" class="btn sec" id="feqmas">${t("accounts.card.addEquipment")}</button></div>`;
}
function bindEquipment(block, id, name) {
  onEach(block, "feq", (item) => {
    closeCardAnd(() => {
      relatedLegacy.openEquipment(item);
    });
  });
  const add = document.getElementById("feqmas");
  if (add) add.onclick = () => {
    closeCardAnd(() => {
      relatedLegacy.newEquipment({ id, nombre: name });
    });
  };
}

// delcos-shared:src/app/screens/portal/model.ts
var shared21 = globalThis["__delcosModules"]["screens/portal/model"];
var pick21 = (name) => shared21[name];
var failureText = /* @__PURE__ */ pick21("failureText");
var messageThread = /* @__PURE__ */ pick21("messageThread");

// src/app/screens/accounts/card/sections-portal.ts
var PENDING = "Pendiente";
var DELIVERED = "Entregado";
var CENTRE6 = "Centro";
var ACTIVE = "Activo";
var SERVICE = "servicio";
var SHOWN_REQUESTS = 10;
var MESSAGES_LIMIT = 200;
var canShow2 = (id, blockId) => !permissions.isProfessionalPortal() && portalLegacy.hasPortal() && stillShown(id) && Boolean(document.getElementById("fbody")) && !document.getElementById(blockId);
var shortDateTime = (value4) => new Date(value4).toLocaleString(t("dates.locale"), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
function requestRow(request) {
  return `<div class="item u-cursor-default"><span class="tx"><b>${formatNumber(request.cantidad)} × ${escapeHtml(request.material)}</b>
        <span class="sm">${t("accounts.portal.requested", { date: shortDateTime(request.creado_en) })}${request.nota ? ` · ${escapeHtml(request.nota)}` : ""}</span></span>${portalLegacy.materialPill(request.estado)}
        ${request.estado === PENDING ? `<button type="button" class="btn chico" data-fpent="${request.id}">${t("accounts.portal.delivered")}</button>` : ""}</div>`;
}
function portalHtml(requests, messages) {
  const pending = requests.filter((request) => request.estado === PENDING).length, unread = messages.filter((message) => message.del_portal && !message.leido_en).length;
  return `<section class="blk" id="fportal"><h3>${t("accounts.portal.title")}${pending ? ` <span class="pill p-warn">${t("accounts.portal.toDeliver", { count: formatNumber(pending) })}</span>` : ""}${unread ? ` <span class="pill p-urg">${t("accounts.portal.unread", { count: formatNumber(unread) })}</span>` : ""}</h3>
    ${requests.length ? `<div class="lista">${requests.map(requestRow).join("")}</div>` : ""}
    <div class="fpmsg"><b class="sm">${t("accounts.portal.messages")}</b><div id="fphilo">${messageThread(messages, false)}</div>
      <div class="fpresp"><input id="fpmsgt" placeholder="${t("accounts.portal.reply")}" aria-label="${t("accounts.portal.reply")}"><button type="button" class="btn sec" id="fpmsgok">${t("accounts.portal.send")}</button></div></div></section>`;
}
function refreshPortal(id) {
  document.getElementById("fportal")?.remove();
  void portalActivity(id);
}
function bindPortal(id) {
  document.querySelectorAll("#fportal [data-fpent]").forEach((button) => {
    button.onclick = async () => {
      const { data: result } = await legacyDb().rpc("cerrar_material", { p_id: button.dataset.fpent, p_estado: DELIVERED });
      if (!result?.ok) {
        notices.toast(failureText(result), true);
        return;
      }
      notices.toast(t("accounts.portal.deliveredDone"));
      refreshPortal(id);
    };
  });
  const send = document.getElementById("fpmsgok");
  if (send) send.onclick = async () => {
    const text = document.getElementById("fpmsgt")?.value.trim() ?? "";
    if (!text) {
      notices.toast(t("accounts.portal.writeMessage"), true);
      return;
    }
    send.disabled = true;
    const { data: result } = await legacyDb().rpc("enviar_mensaje_cuenta", { p_cuenta: id, p_texto: text });
    send.disabled = false;
    if (!result?.ok) {
      notices.toast(failureText(result), true);
      return;
    }
    notices.toast(t("accounts.portal.sent"));
    refreshPortal(id);
  };
}
async function loadPortal(id) {
  const db = legacyDb();
  const [{ data: requests }, { data: messages }, { data: users }] = await Promise.all([
    db.from("solicitudes_material").select("id,material,cantidad,nota,estado,creado_en,cerrado_en").eq("cuenta_id", id).order("creado_en", { ascending: false }).limit(SHOWN_REQUESTS),
    db.from("mensajes_cuenta").select("id,texto,del_portal,creado_en,leido_en").eq("cuenta_id", id).order("creado_en", { ascending: true }).limit(MESSAGES_LIMIT),
    db.from("perfiles").select("id").eq("cuenta_id", id).eq("activo", true).limit(1)
  ]);
  return { requests: requests ?? [], messages: messages ?? [], hasUser: Boolean(users?.length) };
}
async function portalActivity(id) {
  if (!canShow2(id, "fportal")) return;
  const { requests: requestList, messages: messageList, hasUser } = await loadPortal(id);
  const body2 = document.getElementById("fbody");
  if (!stillShown(id) || !body2 || document.getElementById("fportal")) return;
  if (!requestList.length && !messageList.length && !hasUser) return;
  const html = portalHtml(requestList, messageList), visit = body2.querySelector("section.fvis");
  if (visit) visit.insertAdjacentHTML("afterend", html);
  else body2.insertAdjacentHTML("beforeend", html);
  bindPortal(id);
  if (messageList.some((message) => message.del_portal && !message.leido_en)) void callRpc("leer_mensajes_cuenta", { p_cuenta: id });
}
function productRow(product, chosen) {
  const own = chosen.get(product.id), name = escapeHtml(product.nombre);
  const tariff = product.precio !== null && product.precio !== void 0 ? portalLegacy.euros(product.precio) : "—";
  return `<label class="item u-cursor-default"><input type="checkbox" data-fpcp="${product.id}" ${own ? "checked" : ""}>
        <span class="tx"><b>${name}</b><span class="sm">${t("accounts.portal.tariff", { price: tariff })}</span></span>
        <input type="number" min="0" step="0.01" data-fpcx="${product.id}" value="${own?.precio !== null && own?.precio !== void 0 ? Number(own.precio) : ""}" placeholder="${t("accounts.portal.tariffPlaceholder")}" style="max-width:120px" aria-label="${t("accounts.portal.priceFor", { name })}"></label>`;
}
async function saveProducts(id, button) {
  const block = document.getElementById("fprodc");
  if (!block) return;
  const items = [...block.querySelectorAll("[data-fpcp]")].filter((box) => box.checked).map((box) => {
    const value4 = block.querySelector(`[data-fpcx="${box.dataset.fpcp ?? ""}"]`)?.value ?? "";
    return { producto_id: box.dataset.fpcp, precio: value4 === "" ? null : Math.max(0, Number(value4)) };
  });
  button.disabled = true;
  const { data: result } = await legacyDb().rpc("guardar_productos_cuenta", { p_cuenta: id, p_items: items });
  button.disabled = false;
  if (!result?.ok) {
    notices.toast(failureText(result), true);
    return;
  }
  notices.toast(t("accounts.portal.productsSaved", { count: formatNumber(result.productos ?? 0) }));
  document.getElementById("fprodc")?.remove();
  void centreProducts(id);
}
function productsHtml(catalog, chosenRows) {
  const chosen = new Map(chosenRows.map((row) => [row.producto_id, row]));
  const list = catalog.filter((product) => product.tipo !== SERVICE && (product.estado ?? ACTIVE) === ACTIVE);
  return `<section class="blk" id="fprodc"><h3>${t("accounts.portal.productsTitle")} <span class="n">${formatNumber(chosenRows.length)}</span></h3>
    <p class="sm">${t("accounts.portal.productsNote")}</p>
    <div class="lista">${list.map((product) => productRow(product, chosen)).join("") || `<div class="sm">${t("accounts.portal.noProducts")}</div>`}</div>
    <div class="acts" style="margin:8px 0 0;justify-content:flex-end"><button type="button" class="btn sec" id="fpcok">${t("accounts.portal.saveProducts")}</button></div></section>`;
}
var isCentre = async (id) => (await cachedRpc("ficha_cuenta", { p_id: id }, `ficha-${id}`)).data?.medico?.tipo === CENTRE6;
async function centreProducts(id) {
  if (!canShow2(id, "fprodc") || !await isCentre(id) || !canShow2(id, "fprodc")) return;
  const catalog = await portalLegacy.products();
  const { data: chosenRows } = await legacyDb().from("productos_cuenta").select("producto_id,precio").eq("cuenta_id", id);
  const body2 = document.getElementById("fbody");
  if (!body2 || !canShow2(id, "fprodc")) return;
  const html = productsHtml(catalog, chosenRows ?? []);
  const after = document.getElementById("fportal") ?? body2.querySelector("section.fvis");
  if (after) after.insertAdjacentHTML("afterend", html);
  else body2.insertAdjacentHTML("beforeend", html);
  const save4 = document.getElementById("fpcok");
  if (save4) save4.onclick = () => {
    void saveProducts(id, save4);
  };
}

// src/app/screens/accounts/card/sections-sales.ts
var SHOWN_PATIENTS = 5;
async function fillSalesReps(id) {
  const [{ data: users }, { data: current }] = await Promise.all([legacyDb().rpc("usuarios_lista"), callRpc("responsable_de_cuenta", { p_medico: id })]);
  const select = document.getElementById("fcomsel");
  if (!stillShown(id) || !select) return;
  const options = (users ?? []).filter((user) => user.activo && (cardSectionsLegacy.roleCan(user.rol, "cartera") || current?.id === user.id)).map((user) => `<option value="${user.id}" ${current?.id === user.id ? "selected" : ""}>${escapeHtml(user.nombre)} · ${escapeHtml(user.rol)}</option>`).join("");
  select.innerHTML = `<option value="">${t("accounts.sales.noRep")}</option>${options}`;
  const save4 = document.getElementById("fcomok");
  if (save4) save4.onclick = async () => {
    save4.disabled = true;
    const { data: result, error } = await legacyDb().rpc("asignar_responsable_cuenta", { p_medico: id, p_usuario: select.value || null });
    save4.disabled = false;
    if (error || result?.ok === false) {
      notices.toast(t("accounts.sales.couldNotAssign"), true);
      return;
    }
    notices.toast(t("accounts.sales.assigned"));
    agendaActions.openAccount(id);
  };
}
async function patients(id) {
  const { data } = await legacyDb().rpc("clientes_lista", { q: null, p_medico: id, lim: SHOWN_PATIENTS, desplaz: 0 });
  if (!stillShown(id) || !data?.total) return;
  const plural = term("paciente", { number: "p" });
  const rows = data.filas.map((row) => `<button class="item" data-fmpac="${row.id}"><span class="tx"><b>${escapeHtml(row.nombre)}</b>
        <span class="sm">${t("accounts.sales.patientLine", { units: formatNumber(row.unidades), orders: formatNumber(row.pedidos) })}${row.ultimo_pedido ? t("accounts.sales.lastOrder", { date: formatShortDate(row.ultimo_pedido) }) : ""}</span></span></button>`).join("");
  (document.getElementById("fventasc") ?? document.getElementById("fbody"))?.insertAdjacentHTML("beforeend", `<div class="blk"><h3>${term("paciente", { number: "p", capital: "C" })}<span class="n" style="margin-left:6px">${formatNumber(data.total)}</span></h3>
      ${rows}
      ${data.total > SHOWN_PATIENTS ? `<button class="verlo" id="fmpactodos" style="border-radius:8px;margin-top:6px">${t("accounts.sales.seeAll", { count: formatNumber(data.total), patients: plural })}</button>` : ""}</div>`);
  document.querySelectorAll("#fbody [data-fmpac]").forEach((button) => {
    button.onclick = () => {
      cardSectionsLegacy.openPatient(button.dataset.fmpac ?? "");
    };
  });
  const all = document.getElementById("fmpactodos");
  if (all) all.onclick = () => {
    const urgent = t("accounts.base.urgent"), title = document.querySelector("#fbody .fh h2")?.textContent ?? "";
    const name = title.startsWith(urgent) ? title.slice(urgent.length).trimStart() : title;
    document.getElementById("ficha")?.close();
    cardSectionsLegacy.patientsOf(id, name);
  };
}
async function salesRepAndPatients(id) {
  const body2 = document.getElementById("fbody");
  if (!stillShown(id) || !body2?.querySelector(".fh")) return;
  const admin = cardSectionsLegacy.can("administrar");
  if (admin) {
    body2.insertAdjacentHTML("beforeend", `<div class="blk" id="fcomblk"><h3>${t("accounts.sales.repTitle")}</h3>
      <div class="u-flex u-gap-8"><select id="fcomsel" class="u-flex-1"><option>${t("accounts.sales.loading")}</option></select>
        <button class="btn sec" id="fcomok">${t("accounts.sales.save")}</button></div>
      <div class="sm u-mt-6">${t("accounts.sales.repNote")}</div></div>`);
    await fillSalesReps(id);
    if (!stillShown(id) || !document.getElementById("fcomsel")) return;
  }
  if (admin || cardSectionsLegacy.salesArea() >= 1) await patients(id);
}
async function associatedClients(id) {
  if (!stillShown(id) || !document.getElementById("fventasc") || document.getElementById("fclientes")) return;
  const { data } = await callRpc("clientes_de_cuenta", { p_cuenta: id });
  const sales = document.getElementById("fventasc");
  if (!data?.ok || !stillShown(id) || !sales || document.getElementById("fclientes")) return;
  const figures = [[t("accounts.sales.associated"), data.total], [t("accounts.sales.withOrders"), data.con_pedido], [t("accounts.sales.withoutOrders"), data.sin_pedido]];
  const block = `<div class="blk" id="fclientes"><h3>${t("accounts.sales.associatedTitle", { patients: term("paciente", { number: "p", capital: "C" }) })}</h3>
    <div class="uper">${figures.map(([label, value4]) => `<div><b>${formatNumber(value4)}</b><span>${label}</span></div>`).join("")}</div>
    ${data.total ? "" : `<div class="sm">${t("accounts.sales.noneAssociated", { patients: term("paciente", { number: "p" }) })}</div>`}</div>`;
  const units2 = document.getElementById("fundades");
  if (units2) units2.insertAdjacentHTML("afterend", block);
  else sales.insertAdjacentHTML("afterbegin", block);
}

// src/app/screens/accounts/card/index.ts
var LOADING_LIMIT_MS = 8e3;
var BASE = [
  { name: "base", run: paintBase },
  { name: "salesRepAndPatients", run: salesRepAndPatients },
  { name: "timetableNotice", run: timetableNotice },
  { name: "visitMaterial", run: visitMaterial },
  { name: "units", run: units },
  { name: "associatedClients", run: associatedClients }
];
var ACCESS = { name: "platformAccess", run: platformAccess };
var CUSTOM_FIELDS = {
  name: "customFields",
  wait: false,
  run: (id) => accountCardLegacy.customFields(id, document.getElementById("fzcampos") ?? document.querySelector("#ficha .fbody, #ficha #fbody") ?? document.getElementById("ficha")?.firstElementChild ?? null)
};
var SECTIONS = [
  { name: "changeHistory", run: changeHistory, wait: false },
  { name: "portalActivity", run: portalActivity, wait: false },
  { name: "centreProducts", run: centreProducts, wait: false },
  { name: "visitPhotos", run: visitPhotos },
  { name: "samples", run: samples },
  { name: "events", run: events },
  { name: "deposit", run: deposit },
  { name: "cycle", run: cycle },
  { name: "presentedProducts", run: presentedProducts },
  { name: "surgeries", run: surgeries },
  { name: "tenders", run: tenders },
  { name: "equipment", run: equipment },
  { name: "portalProposal", run: portalProposal },
  { name: "centreProfessionals", run: centreProfessionals },
  { name: "archiveButtons", run: archiveButtons },
  // v2.446.0: «Protección de datos» (RGPD), at the foot, for whoever configures the company
  { name: "privacy", run: (id) => {
    addPrivacySection("cuenta", id, () => stillShown(id), () => {
      agendaActions.openAccount(id);
    });
    return Promise.resolve();
  } }
];
async function runSection(section, id) {
  try {
    await section.run(id);
  } catch (error) {
    console.error(`ficha · ${section.name}`, error);
  }
}
async function paintBase2(id) {
  const card = document.getElementById("ficha");
  card?.classList.add("cargando");
  const limit = setTimeout(() => card?.classList.remove("cargando"), LOADING_LIMIT_MS);
  try {
    accountCardLegacy.forgetPatients();
    for (const section of BASE) await section.run(id);
    if (document.getElementById("fventas") && !document.getElementById("fventasc")?.children.length) document.getElementById("fventas")?.remove();
  } finally {
    clearTimeout(limit);
    requestAnimationFrame(() => card?.classList.remove("cargando"));
  }
}
async function openAccountCard(id) {
  try {
    await paintBase2(id);
    await runSection(ACCESS, id);
    void runSection(CUSTOM_FIELDS, id);
  } finally {
    accountCardLegacy.forgetCentreFromAppointment();
  }
  for (const section of SECTIONS) {
    if (section.wait === false) void runSection(section, id);
    else await runSection(section, id);
  }
}

// src/app/screens/accounts/list/column-panel.ts
function panelHtml(settings) {
  const definitions = columnDefinitions();
  const rows = settings.map((setting, index) => {
    const column = definitions.find((item) => item.k === setting.k), fixed = Boolean(column?.fixed);
    return `<label class="item" style="cursor:pointer;margin:0">
          <input type="checkbox" data-con="${index}" ${setting.on ? "checked" : ""} ${fixed ? "disabled" : ""}>
          <span class="tx"><b>${escapeHtml(column?.t ?? setting.k)}</b>${fixed ? `<span class="sm">${t("accounts.columns.alwaysVisible")}</span>` : ""}</span>
          <span class="kord" style="flex-direction:row">
            <button type="button" class="kmv" data-cmv="${index}|-1" aria-label="${t("accounts.columns.up")}" ${index === 0 ? "disabled" : ""}>${legacyIcons.arrow("arriba")}</button>
            <button type="button" class="kmv" data-cmv="${index}|1" aria-label="${t("accounts.columns.down")}" ${index === settings.length - 1 ? "disabled" : ""}>${legacyIcons.arrow("abajo")}</button></span></label>`;
  }).join("");
  return `<div class="tbox">
      <div class="fh"><h2>${t("accounts.columns.panelTitle")}</h2><button class="x" id="tclose" aria-label="${t("common.close")}">✕</button></div>
      <button class="t2volver" id="tcvolver" style="margin:0 0 10px">${t("accounts.columns.back")}</button>
      <p class="sm">${t("accounts.columns.panelNote")}</p>
      <div class="lista tcols">${rows}</div>
      <div class="acts"><button class="btn sec" id="tcres">${t("accounts.columns.restore")}</button></div></div>`;
}
function bindPanel(filters, panel, settings, apply) {
  const close = panel.querySelector("#tclose");
  if (close) close.onclick = () => {
    panel.classList.remove("abierto");
    filters.classList.remove("abierto");
  };
  const back = panel.querySelector("#tcvolver");
  if (back) back.onclick = () => {
    panel.classList.remove("abierto");
  };
  panel.querySelectorAll("[data-con]").forEach((box) => {
    box.onchange = () => {
      const setting = settings[Number(box.dataset.con)];
      if (!setting) return;
      setting.on = box.checked;
      if (!settings.some((item) => item.on)) {
        box.checked = true;
        setting.on = true;
        notices.toast(t("accounts.columns.keepOne"), true);
        return;
      }
      apply(settings);
    };
  });
  panel.querySelectorAll("[data-cmv]").forEach((button) => {
    button.onclick = (event) => {
      event.preventDefault();
      const [from2 = 0, direction = 0] = (button.dataset.cmv ?? "").split("|").map(Number), to = from2 + direction;
      const moved = settings[from2], other = settings[to];
      if (!moved || !other) return;
      settings[from2] = other;
      settings[to] = moved;
      apply(settings);
      paint(filters, panel, settings, apply);
    };
  });
  const restore = panel.querySelector("#tcres");
  if (restore) restore.onclick = () => {
    resetColumns();
    const fresh = columnSettings();
    apply(fresh);
    paint(filters, panel, fresh, apply);
  };
}
function paint(filters, panel, settings, apply) {
  panel.innerHTML = panelHtml(settings);
  bindPanel(filters, panel, settings, apply);
}
function openColumnsPanel(onChange) {
  const filters = document.getElementById("tools"), panel = document.getElementById("tools2");
  if (!filters || !panel) return;
  const apply = (list) => {
    saveColumns(list);
    onChange();
  };
  paint(filters, panel, columnSettings(), apply);
  filters.classList.add("abierto");
  panel.classList.add("abierto");
}

// delcos-shared:src/app/components/index.ts
var shared22 = globalThis["__delcosModules"]["components/index"];
var pick22 = (name) => shared22[name];
var showLoading = /* @__PURE__ */ pick22("showLoading");

// src/app/screens/accounts/duplicates/centres.ts
var placeText = (item) => [item.centro_nombre, item.direccion, item.municipio].filter(Boolean).join(" · ") || t("accountsMore.compare.noAddress");
var from = (item) => `<span class="sm">${t("accountsMore.compare.from", { name: escapeHtml(item.de) })}</span>`;
function centresHtml(choice) {
  const { consultations } = choice;
  if (choice.isCentre) {
    const addresses = consultations.map((item) => `<label class="opt"><input type="radio" name="dupdir" value="${item.id}" ${item.id === choice.address ? "checked" : ""}> <span>${escapeHtml(placeText(item))} ${from(item)}</span></label>`).join("");
    return `<div class="dupcons"><h3>${t("accountsMore.compare.centreAddress")}</h3><p class="sm">${t("accountsMore.compare.keepMarked")}</p>
      ${addresses || `<p class="sm">${t("accountsMore.compare.noAddresses")}</p>`}
      <h3>${escapeHtml(term("medico", { number: "p", capital: "C" }))}</h3><p class="sm">${t("accountsMore.compare.professionalsMove", { a: formatNumber(choice.professionals[0]), b: formatNumber(choice.professionals[1]) })}</p></div>`;
  }
  if (!consultations.length) return "";
  return `<div class="dupcons"><h3>${t("accountsMore.compare.centresAndConsultations", { consultations: term("consulta", { number: "p" }) })}</h3><p class="sm">${t("accountsMore.compare.keepMarkedMany")}</p>
      ${consultations.map((item) => `<label class="opt"><input type="checkbox" data-dupcons="${item.id}" ${choice.removed.has(item.id) ? "" : "checked"}> <span>${escapeHtml(placeText(item))} ${from(item)}</span></label>`).join("")}</div>`;
}
function bindCentres(panel, choice) {
  panel.querySelectorAll("[data-dupcons]").forEach((input2) => {
    input2.onchange = () => {
      const id = input2.dataset.dupcons ?? "";
      if (input2.checked) choice.removed.delete(id);
      else choice.removed.add(id);
    };
  });
  panel.querySelectorAll("input[name=dupdir]").forEach((input2) => {
    input2.onchange = () => {
      if (input2.checked) choice.address = input2.value;
    };
  });
}
var toRemove = (choice) => choice.isCentre ? choice.consultations.filter((item) => item.id !== choice.address).map((item) => item.id) : [...choice.removed];
var keepsNone = (choice) => !choice.isCentre && choice.consultations.length > 0 && toRemove(choice).length === choice.consultations.length;
async function joinCentres(stays, goes) {
  if (!stays.centro_id || !goes.centro_id) return;
  const centre = (id) => legacyDb().from("centros").select("id, nombre, municipio").eq("id", id).maybeSingle();
  const { data: kept } = await centre(stays.centro_id), { data: gone } = await centre(goes.centro_id);
  if (!kept) return;
  const values = { centro_id: kept.id, centro_nombre: kept.nombre };
  await legacyDb().from("ubicaciones").update(values).eq("centro_id", goes.centro_id);
  if (gone) await legacyDb().from("ubicaciones").update(values).is("centro_id", null).eq("centro_nombre", gone.nombre);
  const { data: places } = await legacyDb().from("ubicaciones").select("id, cuenta_id, principal").eq("centro_id", kept.id);
  const seen = /* @__PURE__ */ new Set(), extra = [];
  [...places ?? []].sort((first2, second) => Number(Boolean(second.principal)) - Number(Boolean(first2.principal))).forEach((place) => {
    if (place.cuenta_id === stays.id) return;
    if (seen.has(place.cuenta_id)) extra.push(place.id);
    else seen.add(place.cuenta_id);
  });
  if (extra.length) await legacyDb().from("ubicaciones").delete().in("id", extra);
  appLegacy.forgetCache();
}
async function tidyAfterUnify(choice, staysId, rows) {
  const removed = toRemove(choice);
  if (removed.length) await legacyDb().from("ubicaciones").delete().in("id", removed);
  if (!choice.isCentre) return;
  await legacyDb().from("ubicaciones").update({ principal: true }).eq("cuenta_id", staysId);
  await joinCentres(staysId === rows.a.id ? rows.a : rows.b, staysId === rows.a.id ? rows.b : rows.a);
}

// src/app/screens/accounts/duplicates/model.ts
var PERSON = "Persona";
var CENTRE7 = "Centro";
var duplicatesState = {
  pending: [],
  similar: [],
  kindById: /* @__PURE__ */ new Map(),
  tab: PERSON,
  current: null
};
var kindOf = (id) => duplicatesState.kindById.get(id) === CENTRE7 ? CENTRE7 : PERSON;
var unifyFields = () => [
  ["nombre", t("accountsMore.fields.name")],
  ["especialidad", term("especialidad", { capital: "C" })],
  ["area", t("accountsMore.fields.area")],
  ["telefono", t("accountsMore.fields.phone")],
  ["email", t("accountsMore.fields.email")],
  ["contacto", t("accountsMore.fields.contact")],
  ["nota", t("accountsMore.fields.note")],
  ["estado_comercial", t("accountsMore.fields.commercialState")]
];
function emptyPanel(message) {
  const panel = document.getElementById("dcmp");
  if (panel) panel.innerHTML = `<div class="vacio">${escapeHtml(message)} ${t("accountsMore.duplicates.nextPair")}</div>`;
}
function forgetPair(first2, second) {
  const inPair = (id) => id === first2 || id === second;
  duplicatesState.similar = duplicatesState.similar.filter((pair) => !(inPair(pair.a_id) && inPair(pair.b_id)));
  duplicatesState.pending = duplicatesState.pending.filter((item) => !(inPair(item.id) && inPair(item.par_id)));
}
function forgetAccount(id) {
  duplicatesState.similar = duplicatesState.similar.filter((pair) => pair.a_id !== id && pair.b_id !== id);
  duplicatesState.pending = duplicatesState.pending.filter((item) => item.id !== id && item.par_id !== id);
}

// src/app/screens/accounts/duplicates/lists.ts
var KINDS_PER_READ = 150;
var SIMILAR_LIMIT = 200;
var SIMILAR_THRESHOLD = 80;
var selectedPair = () => duplicatesState.current ? duplicatesState.current.join("|") : "";
function pendingRow(item) {
  const selected = item.par_id && selectedPair() === `${item.id}|${item.par_id}` ? "sel" : "";
  const place = `${escapeHtml(orFallback(item.centro, ""))} ${escapeHtml(orFallback(item.municipio, ""))}`;
  const buttons = item.par_id ? `<button class="btn" data-dcmp="${item.id}|${item.par_id}">${t("accountsMore.duplicates.compare")}</button>
          <button class="btn sec" data-ddes="${item.id}|${item.par_id}">${t("accountsMore.duplicates.notDuplicate")}</button>` : "";
  return `<div class="item ${selected} u-cursor-default">
      <span class="ic w">${item.pct ? `${item.pct}%` : "?"}</span>
      <span class="tx"><b>${escapeHtml(item.nombre)}</b>
        <span class="sm">${t("accountsMore.duplicates.code", { code: escapeHtml(item.codigo) })} · ${place}</span>
        <span class="sm">${item.par_nombre ? t("accountsMore.duplicates.looksLike", { name: escapeHtml(item.par_nombre) }) : t("accountsMore.duplicates.noPair")}</span></span>
      <span class="acts u-m-0">
        ${buttons}
        <button class="btn sec" data-dver="${item.id}">${t("accountsMore.duplicates.card")}</button></span></div>`;
}
function similarRow(pair) {
  return `<div class="item ${selectedPair() === `${pair.a_id}|${pair.b_id}` ? "sel" : ""}" style="cursor:default">
      <span class="ic">${pair.pct}%</span>
      <span class="tx"><b>${escapeHtml(pair.a_nombre)}</b><span class="sm">${escapeHtml(pair.b_nombre)} · ${t("accountsMore.duplicates.codes", { a: escapeHtml(pair.a_codigo), b: escapeHtml(pair.b_codigo) })}</span></span>
      <span class="acts u-m-0">
        <button class="btn" data-dcmp="${pair.a_id}|${pair.b_id}">${t("accountsMore.duplicates.compare")}</button>
        <button class="btn sec" data-ddes="${pair.a_id}|${pair.b_id}">${t("accountsMore.duplicates.notDuplicates")}</button></span></div>`;
}
function paintTabs() {
  const grid = document.querySelector("#v-duplicados .dupgrid");
  if (grid && !document.getElementById("duppest")) grid.insertAdjacentHTML("beforebegin", `<div class="segs duppest" id="duppest" role="group" aria-label="${t("accountsMore.duplicates.kindLabel")}"></div>`);
  const tabs = document.getElementById("duppest");
  if (!tabs) return;
  const count = (kind) => duplicatesState.pending.filter((item) => kindOf(item.id) === kind).length + duplicatesState.similar.filter((pair) => kindOf(pair.a_id) === kind).length;
  tabs.innerHTML = [[PERSON, term("medico", { number: "p", capital: "C" })], [CENTRE7, t("accountsMore.duplicates.centres")]].map(([kind = "", label = ""]) => `<button type="button" data-dpest="${kind}" class="${duplicatesState.tab === kind ? "on" : ""}" aria-pressed="${String(duplicatesState.tab === kind)}">${escapeHtml(label)} <span class="n">${formatNumber(count(kind))}</span></button>`).join("");
}
function paintLists() {
  const pendingBox = document.getElementById("dpendc"), similarBox = document.getElementById("dparc");
  if (!pendingBox || !similarBox) return;
  const pending = duplicatesState.pending.filter((item) => kindOf(item.id) === duplicatesState.tab);
  const similar = duplicatesState.similar.filter((pair) => kindOf(pair.a_id) === duplicatesState.tab);
  pendingBox.innerHTML = `<h2>${t("accountsMore.duplicates.pendingTitle")}<span class="n">${pending.length}</span></h2>
    <p class="sm">${t("accountsMore.duplicates.pendingHint")}</p>
    <div class="lista" id="dpendl">${pending.map(pendingRow).join("") || `<div class="vacio">${t("accountsMore.duplicates.noPending")}</div>`}</div>`;
  similarBox.innerHTML = `<h2>${t("accountsMore.duplicates.similarTitle")}<span class="n">${similar.length}</span></h2>
    <p class="sm">${t("accountsMore.duplicates.similarHint")}</p>
    <div class="lista" id="dparl">${similar.map(similarRow).join("") || `<div class="vacio">${t("accountsMore.duplicates.noSimilar")}</div>`}</div>`;
  paintTabs();
}
async function readKinds(ids) {
  duplicatesState.kindById = /* @__PURE__ */ new Map();
  for (let start = 0; start < ids.length; start += KINDS_PER_READ) {
    const { data } = await legacyDb().from("cuentas").select("id, tipo").in("id", ids.slice(start, start + KINDS_PER_READ));
    (data ?? []).forEach((account) => {
      duplicatesState.kindById.set(account.id, orFallback(account.tipo, PERSON));
    });
  }
}
async function loadLists() {
  showLoading(document.getElementById("dpendc"), t("accountsMore.duplicates.searchingPending"));
  showLoading(document.getElementById("dparc"), t("accountsMore.duplicates.searchingSimilar"));
  const [pending, similar] = await Promise.all([
    legacyDb().rpc("duplicados_pendientes"),
    legacyDb().rpc("escanear_duplicados", { p_umbral: SIMILAR_THRESHOLD, p_tope: SIMILAR_LIMIT })
  ]);
  duplicatesState.pending = pending.data ?? [];
  duplicatesState.similar = similar.data ?? [];
  await readKinds([.../* @__PURE__ */ new Set([...duplicatesState.pending.map((item) => item.id), ...duplicatesState.similar.map((pair) => pair.a_id)])]);
  paintLists();
}

// src/app/screens/accounts/duplicates/compare.ts
var words = () => ({
  Consultations: term("consulta", { number: "p", capital: "C" }),
  visits: term("visita", { number: "p" })
});
var summary = (sheet) => t("accountsMore.compare.summary", {
  consultations: formatNumber((sheet.consultas ?? []).length),
  consultationsWord: term("consulta", { number: "p" }),
  visits: formatNumber((sheet.visitas ?? []).length),
  visitsWord: term("visita", { number: "p" })
});
function optionsHtml(view) {
  return [[view.a, view.sheets[0]], [view.b, view.sheets[1]]].map(([account, sheet]) => {
    const item = account, stays = view.stays === item.id;
    return `<button class="opt" data-queda="${item.id}" aria-pressed="${String(stays)}">
          <span class="mk"></span><span><b>${escapeHtml(item.nombre)}</b><br>
          <span class="sm">${t("accountsMore.duplicates.code", { code: escapeHtml(item.codigo) })} · ${summary(sheet)}</span><br>
          <span class="sm">${t(stays ? "accountsMore.compare.kept" : "accountsMore.compare.goes")}</span></span></button>`;
  }).join("");
}
function fieldsHtml(view) {
  const { a, b } = view, goes = view.stays === a.id ? b : a, stays = view.stays === a.id ? a : b;
  const different = unifyFields().filter(([key]) => orFallback(a[key], "") !== orFallback(b[key], ""));
  if (!different.length) return `<p class="sm u-mt-12">${t("accountsMore.compare.same")}</p>`;
  const option = (key, side, account) => `<button class="opt" data-campo="${key}|${side}" aria-pressed="${String(view.fields[key] === side)}"><span class="mk"></span>${escapeHtml(orFallback(account[key], t("accountsMore.compare.empty")))}</button>`;
  return `<div>${different.map(([key, label]) => `
        <label>${label}</label>
        <div class="opciones">
          ${option(key, "queda", stays)}
          ${option(key, "va", goes)}
        </div>`).join("")}</div>`;
}
function panelHtml2(view) {
  const { a, b } = view, pair = a.id < b.id ? `${a.id}|${b.id}` : `${b.id}|${a.id}`;
  return `<div class="fbox">
      <div class="fh"><div><h2>${t("accountsMore.compare.title")}</h2>
        <div class="sm">${t("accountsMore.compare.hint", words())}</div></div>
        <button class="x" id="dcx" aria-label="${t("common.close")}">✕</button></div>
      <div class="opciones">
        ${optionsHtml(view)}
      </div>
      <div class="acts"><button class="btn sec" data-dver="${a.id}">${t("accountsMore.compare.seeCard", { code: escapeHtml(a.codigo) })}</button>
        <button class="btn sec" data-dver="${b.id}">${t("accountsMore.compare.seeCard", { code: escapeHtml(b.codigo) })}</button></div>
      ${fieldsHtml(view)}
      ${centresHtml(view.centres)}
      <div class="acts u-end">
        <button class="btn sec" data-ddes="${pair}">${t("accountsMore.duplicates.notDuplicates")}</button>
        <button class="btn dang" id="duniok">${t("accountsMore.compare.unify")}</button></div></div>`;
}
async function unify(view, button) {
  if (keepsNone(view.centres)) {
    notices.toast(t("accountsMore.compare.keepOne", { consultation: term("consulta") }), true);
    return;
  }
  const goes = view.stays === view.a.id ? view.b : view.a;
  if (!await notices.confirm(t("accountsMore.compare.confirmText", { name: goes.nombre }), { titulo: t("accountsMore.compare.confirmTitle"), ok: t("accountsMore.compare.unify"), peligro: true })) return;
  button.disabled = true;
  button.textContent = t("accountsMore.compare.unifying");
  const { data: result, error } = await legacyDb().rpc("unificar_cuentas", { p: { queda: view.stays, va: goes.id, campos: view.fields } });
  if (error || result?.ok === false) {
    button.disabled = false;
    button.textContent = t("accountsMore.compare.unify");
    notices.toast(t("accountsMore.compare.couldNotUnify"), true);
    return;
  }
  try {
    await tidyAfterUnify(view.centres, view.stays, view.rows);
  } catch (problem) {
    notices.toast(t("accountsMore.compare.couldNotTidy", { error: problem.message }), true);
  }
  notices.toast(t("accountsMore.compare.unified"));
  forgetAccount(goes.id);
  duplicatesState.current = null;
  paintLists();
  emptyPanel(t("accountsMore.compare.unifiedPanel"));
  const list = document.getElementById("lista");
  if (list) list.innerHTML = "";
}
function paint2(panel, view) {
  panel.innerHTML = panelHtml2(view);
  const close = document.getElementById("dcx");
  if (close) close.onclick = () => {
    duplicatesState.current = null;
    document.querySelectorAll("#v-duplicados .item.sel").forEach((item) => {
      item.classList.remove("sel");
    });
    emptyPanel("");
  };
  panel.querySelectorAll("[data-queda]").forEach((option) => {
    option.onclick = () => {
      view.stays = option.dataset.queda ?? view.stays;
      paint2(panel, view);
    };
  });
  panel.querySelectorAll("[data-campo]").forEach((option) => {
    option.onclick = () => {
      const [key = "", side] = (option.dataset.campo ?? "").split("|");
      view.fields[key] = side === "va" ? "va" : "queda";
      paint2(panel, view);
    };
  });
  bindCentres(panel, view.centres);
  const ok = document.getElementById("duniok");
  if (ok) ok.onclick = () => {
    void unify(view, ok);
  };
}
async function professionalsOf(row) {
  if (!row?.centro_id) return 0;
  const { data } = await legacyDb().rpc("ficha_centro", { p_id: row.centro_id });
  return (data?.profesionales ?? []).length;
}
async function centreChoice(sheets, rows) {
  const isCentre2 = rows.a.tipo === CENTRE7 && rows.b.tipo === CENTRE7;
  const consultations = sheets.flatMap((sheet) => (sheet.consultas ?? []).filter((item) => Boolean(item.id)).map((item) => ({ ...item, de: sheet.medico.nombre })));
  const professionals = isCentre2 ? [await professionalsOf(rows.a), await professionalsOf(rows.b)] : [0, 0];
  return { isCentre: isCentre2, consultations, professionals, removed: /* @__PURE__ */ new Set(), address: consultations[0]?.id ?? null };
}
async function compareIn(panel, idA, idB) {
  showLoading(panel, t("accountsMore.compare.loading"));
  const [{ data: first2 }, { data: second }, { data: kinds }] = await Promise.all([
    legacyDb().rpc("ficha_cuenta", { p_id: idA }),
    legacyDb().rpc("ficha_cuenta", { p_id: idB }),
    legacyDb().from("cuentas").select("id, tipo, centro_id, nombre").in("id", [idA, idB])
  ]);
  if (!first2?.medico || !second?.medico) {
    panel.innerHTML = `<div class="vacio">${t("accountsMore.compare.gone")}</div>`;
    return;
  }
  const kindOfId = (id) => (kinds ?? []).find((row) => row.id === id) ?? { id };
  const sheets = [first2, second], rows = { a: kindOfId(idA), b: kindOfId(idB) };
  const kept = second.medico, other = first2.medico, fields = {};
  unifyFields().forEach(([key]) => {
    fields[key] = kept[key] ? "queda" : other[key] ? "va" : "queda";
  });
  paint2(panel, { a: other, b: kept, sheets, rows, centres: await centreChoice(sheets, rows), stays: kept.id, fields });
}

// src/app/screens/accounts/duplicates/page.ts
var NARROW_SCREEN = 900;
function pageHtml(allowed) {
  const grid = allowed ? `<div class="dupgrid">
      <div><div class="card" id="dpendc"></div><div class="card" id="dparc"></div></div>
      <div class="card dupcmp" id="dcmp"><div class="vacio vguia"><b>${t("accountsMore.duplicates.pickPair")}</b><span>${t("accountsMore.duplicates.pickPairHint")}</span></div></div>
    </div>` : `<div class="card"><div class="vacio">${t("accountsMore.duplicates.adminOnly")}</div></div>`;
  return `<button class="cfgvolver visible" id="dupvolver" type="button">${t("accountsMore.duplicates.backToQuality")}</button>
    <div class="saludo"><div><h1>${t("accountsMore.duplicates.title")}</h1>
      <div class="fecha">${t("accountsMore.duplicates.subtitle")}</div></div>
      <div class="acts u-m-0">
        <button class="btn sec" id="dvolver">${t("accountsMore.duplicates.back")}</button>
        <button class="btn sec${allowed ? "" : " hide"}" id="dbuscar">${t("accountsMore.duplicates.searchAgain")}</button></div></div>
    ${grid}`;
}
async function loadDuplicates() {
  const view = document.getElementById("v-duplicados");
  if (!view) return;
  const allowed = miscLegacy.canUnify();
  view.innerHTML = pageHtml(allowed);
  const back = document.getElementById("dupvolver");
  if (back) back.onclick = () => {
    goTo("seguimiento");
  };
  const close = document.getElementById("dvolver");
  if (close) close.onclick = () => {
    const previous = miscLegacy.previousScreen();
    goTo(previous && previous !== "duplicados" ? previous : "directorio");
  };
  if (!allowed) return;
  const again = document.getElementById("dbuscar");
  if (again) again.onclick = () => {
    appLegacy.forgetCache();
    void loadLists();
  };
  await loadLists();
}
function compare(button) {
  const [first2 = "", second = ""] = (button.dataset.dcmp ?? "").split("|");
  duplicatesState.current = [first2, second];
  document.querySelectorAll("#v-duplicados .item.sel").forEach((item) => {
    item.classList.remove("sel");
  });
  button.closest(".item")?.classList.add("sel");
  const panel = document.getElementById("dcmp");
  if (!panel) return;
  void compareIn(panel, first2, second);
  if (window.innerWidth <= NARROW_SCREEN) panel.scrollIntoView({ block: "start", behavior: "smooth" });
}
async function markDifferent(button) {
  const [first2 = "", second = ""] = (button.dataset.ddes ?? "").split("|");
  button.disabled = true;
  const { data: result, error } = await legacyDb().rpc("descartar_duplicado", { p_a: first2, p_b: second });
  if (error || result?.ok === false) {
    button.disabled = false;
    notices.toast(t("accountsMore.duplicates.couldNotSave"), true);
    return;
  }
  forgetPair(first2, second);
  const current = duplicatesState.current;
  if (current?.includes(first2) && current.includes(second)) {
    duplicatesState.current = null;
    emptyPanel(t("accountsMore.duplicates.markedDifferentPanel"));
  }
  paintLists();
  notices.toast(t("accountsMore.duplicates.markedDifferent"));
}
function answerDuplicatesClick(target) {
  const tab = target.closest("#duppest [data-dpest]");
  if (tab) {
    duplicatesState.tab = tab.dataset.dpest ?? duplicatesState.tab;
    duplicatesState.current = null;
    paintLists();
    emptyPanel("");
    return;
  }
  if (currentScreen() !== "duplicados") return;
  const comparison = target.closest("[data-dcmp]"), card = target.closest("[data-dver]"), different = target.closest("[data-ddes]");
  if (comparison) compare(comparison);
  if (card) agendaActions.openAccount(card.dataset.dver ?? "");
  if (different) void markDifferent(different);
}

// src/app/screens/accounts/centre/editor.ts
var value3 = (id) => (document.getElementById(id)?.value ?? "").trim();
var field = (id, label, current, mode = "") => `<div><label for="${id}">${label}</label><input id="${id}" value="${escapeHtml(orFallback(current, ""))}"${mode ? ` inputmode="${mode}"` : ""}></div>`;
function editorHtml(centre) {
  const hours = centre.horario ?? {};
  const days = miscLegacy.weekDays().map(([day, name]) => `<div><span>${name}</span><input data-ech="${day}" value="${escapeHtml(hours[day] ?? "")}" placeholder="${day === "D" ? t("accountsMore.centreEditor.closed") : t("accountsMore.centreEditor.hoursPlaceholder")}"></div>`).join("");
  return `
    <div class="fh"><div><h2>${t("accountsMore.centreEditor.title")}</h2><div class="sm">${t("accountsMore.centreEditor.subtitle", { consultations: term("consulta", { number: "p", article: "el" }) })}</div></div>
      <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>
    <div class="g2">${field("ecn", t("accountsMore.centreEditor.name"), centre.nombre)}
      ${field("ect", t("accountsMore.centreEditor.phone"), centre.telefono, "tel")}</div>
    <div class="g2">${field("ecd", t("accountsMore.centreEditor.address"), centre.direccion)}
      ${field("ecc", t("accountsMore.centreEditor.postcode"), centre.cp, "numeric")}</div>
    <div class="g2">${field("ecm", t("accountsMore.centreEditor.town"), centre.municipio)}
      ${field("ecp", t("accountsMore.centreEditor.province"), centre.provincia)}</div>
    <label>${t("accountsMore.centreEditor.opening")}</label>
    <div class="cphor">${days}</div>
    <div class="acts u-end"><button type="button" class="btn sec" id="ecvolver">${t("accountsMore.centreEditor.back")}</button><button type="button" class="btn" id="ecok">${t("accountsMore.centreEditor.save")}</button></div>`;
}
async function pointOf2(centre) {
  const moved = value3("ecd") !== orFallback(centre.direccion, "") || value3("ecm") !== orFallback(centre.municipio, "") || value3("ecc") !== orFallback(centre.cp, "");
  if (!moved || !(value3("ecd") || value3("ecm"))) return { lat: centre.lat, lon: centre.lon };
  const query = addressQuery([value3("ecd"), value3("ecc"), value3("ecm"), value3("ecp")]);
  const found = await qualityLegacy.geocode(query, { direccion: value3("ecd"), municipio: value3("ecm"), cp: value3("ecc") }).catch(() => null);
  if (found && !found.fuera) return { lat: Number(found.lat), lon: Number(found.lon) };
  if (found?.fuera) notices.toast(t("accountsMore.centreEditor.elsewhere", { place: found.fuera, town: value3("ecm") }), true);
  return { lat: centre.lat, lon: centre.lon };
}
async function save3(centre, button, reopen) {
  if (!value3("ecn")) {
    notices.toast(t("accountsMore.centreEditor.writeName"), true);
    return;
  }
  const hours = {};
  document.querySelectorAll("#dbody [data-ech]").forEach((input2) => {
    if (input2.value.trim()) hours[input2.dataset.ech ?? ""] = input2.value.trim();
  });
  button.disabled = true;
  const { lat, lon } = await pointOf2(centre);
  const { data: result, error } = await callRpc("guardar_centro", { p: {
    id: centre.id,
    nombre: value3("ecn"),
    telefono: value3("ect"),
    direccion: value3("ecd"),
    cp: value3("ecc"),
    municipio: value3("ecm"),
    provincia: value3("ecp"),
    lat,
    lon,
    horario: hours
  } });
  button.disabled = false;
  if (error || !result?.ok) {
    notices.toast(orFallback(result?.error, t("accountsMore.centreEditor.couldNotSave")), true);
    return;
  }
  notices.toast(t("accountsMore.centreEditor.saved"));
  void reopen(centre.id);
}
function editCentre(centre, reopen) {
  const body2 = document.getElementById("dbody");
  if (!body2) return;
  body2.innerHTML = editorHtml(centre);
  const back = document.getElementById("ecvolver");
  if (back) back.onclick = () => {
    void reopen(centre.id);
  };
  const ok = document.getElementById("ecok");
  if (ok) ok.onclick = () => {
    void save3(centre, ok, reopen);
  };
}

// src/app/screens/accounts/centre/model.ts
var hoursText2 = (hours) => miscLegacy.weekDays().filter(([day]) => hours?.[day]).map(([day, name]) => `${name} ${hours?.[day] ?? ""}`).join(" · ");

// src/app/screens/accounts/centre/sheet.ts
var header = (title, subtitle = "") => `<div class="fh"><div><h2>${title}</h2>${subtitle}</div><button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>`;
function professionalRow(item, canChange) {
  const where = [item.planta ? t("accountsMore.centre.floor", { value: item.planta }) : "", item.sala ? t("accountsMore.centre.room", { value: item.sala }) : ""].filter(Boolean).join(" · ");
  const days = hoursText2(item.dias);
  return `<div class="item fcpro">
        <span class="tx"><b>${item.urgente ? "❗ " : ""}${escapeHtml(item.nombre)}</b>
          <span class="sm">${escapeHtml([item.especialidad, where].filter(Boolean).join(" · ") || "—")}</span>
          ${days ? `<span class="sm">${escapeHtml(t("accountsMore.centre.attends", { days }))}</span>` : ""}</span>
        <span class="acts u-m-0">
          <button type="button" class="btn sec" data-fcf="${item.id}">${t("accountsMore.centre.card")}</button>
          <button type="button" class="btn sec" data-fcc="${item.id}">${t("accountsMore.centre.appointment")}</button>
          ${canChange ? `<button type="button" class="btn sec fcquitar" data-fcq="${item.id}" aria-label="${t("accountsMore.centre.removeLabel", { name: escapeHtml(item.nombre) })}">${t("accountsMore.centre.remove")}</button>` : ""}
        </span></div>`;
}
function sheetHtml(sheet, centre, accountId) {
  const list = sheet.profesionales ?? [], canChange = Boolean(sheet.puede_fichas), who = term("medico", { number: "p", capital: "C" });
  const address = [centre.direccion, [centre.cp, centre.municipio].filter(Boolean).join(" "), centre.provincia].filter(Boolean).join(", ");
  const hours = hoursText2(centre.horario);
  const empty = `<div class="vacio">${t("accountsMore.centre.nobody", { professionals: escapeHtml(who.toLowerCase()) })}${canChange ? t("accountsMore.centre.addThem") : ""}</div>`;
  return `
    ${header(escapeHtml(centre.nombre), `<div class="sm">${escapeHtml(address || t("accountsMore.centre.noAddress"))}</div>`)}
    <div class="fcacts">
      ${centre.telefono ? `<a class="btn sec" href="tel:${escapeHtml(centre.telefono)}">${t("accountsMore.centre.call", { phone: escapeHtml(centre.telefono) })}</a>` : ""}
      ${centre.lat !== null && centre.lat !== void 0 ? `<button type="button" class="btn sec" id="fcllegar">${t("accountsMore.centre.directions")}</button>` : ""}
      ${sheet.puede_editar ? `<button type="button" class="btn sec" id="fceditar">${t("accountsMore.centre.edit")}</button>` : ""}
      ${accountId ? `<button type="button" class="btn sec" id="fccuenta" data-fccta="${accountId}">${t("accountsMore.centre.commercialCard")}</button>` : ""}
    </div>
    ${hours ? `<div class="vcdatos"><div class="vcfila"><span>${t("accountsMore.centre.timetable")}</span><b>${escapeHtml(hours)}</b></div></div>` : ""}
    <div class="fcprocab"><h3>${escapeHtml(who)} · ${formatNumber(list.length)}</h3>${canChange ? `<button type="button" class="btn" id="fcanadir">${t("accountsMore.centre.add")}</button>` : ""}</div>
    <div id="fcsel"></div>
    ${list.length ? `<div class="lista fclista">${list.map((item) => professionalRow(item, canChange)).join("")}</div>` : empty}`;
}
async function addProfessional(centre, account) {
  if (!account) return;
  const { data: result, error } = await legacyDb().rpc("centro_anadir_profesional", { p_centro: centre.id, p_cuenta: account.id });
  if (error || !result?.ok) {
    notices.toast(result?.error === "permiso" ? t("accountsMore.centre.noPermission", { name: account.nombre ?? "" }) : t("accountsMore.centre.couldNotAdd"), true);
    void showCentre(centre.id);
    return;
  }
  notices.toast(result.ya ? t("accountsMore.centre.alreadyThere", { name: account.nombre ?? "" }) : t("accountsMore.centre.added", { name: account.nombre ?? "", centre: centre.nombre }));
  void showCentre(centre.id);
}
async function removeProfessional(centre, item) {
  const only = Number(item.consultas) <= 1;
  const text = t("accountsMore.centre.removeText", { name: item.nombre, centre: centre.nombre, thisConsultation: term("consulta", { article: "este" }) }) + (only ? t("accountsMore.centre.removeOnly", { consultation: term("consulta") }) : "");
  if (!await notices.confirm(text, { titulo: t("accountsMore.centre.removeTitle"), ok: t("accountsMore.centre.remove"), peligro: true })) return;
  const { data: result, error } = await legacyDb().rpc("centro_quitar_profesional", { p_centro: centre.id, p_cuenta: item.id });
  if (error || !result?.ok) {
    notices.toast(result?.error === "permiso" ? t("accountsMore.centre.noPermission", { name: item.nombre }) : t("accountsMore.centre.couldNotRemove"), true);
    return;
  }
  notices.toast(t("accountsMore.centre.removed", { name: item.nombre, centre: centre.nombre }));
  void showCentre(centre.id);
}
function bind2(body2, box, sheet, centre) {
  const on = (id, action) => {
    const button = document.getElementById(id);
    if (button) button.onclick = () => {
      action(button);
    };
  };
  on("fcllegar", () => {
    appointmentLegacy.navigateTo([Number(centre.lat), Number(centre.lon)]);
  });
  on("fceditar", () => {
    editCentre(centre, showCentre);
  });
  on("fcanadir", (button) => {
    button.disabled = true;
    const place = document.getElementById("fcsel");
    editorLegacy.pickAccount(place, null, (account) => addProfessional(centre, account));
    place?.querySelector("input")?.focus();
  });
  body2.querySelectorAll("[data-fcf]").forEach((button) => {
    button.onclick = () => {
      box.close();
      appointmentLegacy.openAccountFromCentre(button.dataset.fcf ?? "", centre.nombre);
    };
  });
  body2.querySelectorAll("[data-fcc]").forEach((button) => {
    button.onclick = () => {
      miscLegacy.setCardCentre(centre.nombre);
      agendaActions.newAppointment(button.dataset.fcc ?? "", null);
    };
  });
  body2.querySelectorAll("[data-fcq]").forEach((button) => {
    button.onclick = () => {
      const item = (sheet.profesionales ?? []).find((other) => other.id === button.dataset.fcq);
      if (item) void removeProfessional(centre, item);
    };
  });
}
async function showCentre(id) {
  const body2 = document.getElementById("dbody"), box = document.getElementById("dlg");
  if (!body2 || !box) return;
  box.classList.remove("pequena");
  body2.innerHTML = `${header(t("accountsMore.centre.title"))}
    <div class="skel" style="width:60%"></div><div class="skel"></div><div class="skel" style="width:80%"></div>`;
  if (!box.open) box.showModal();
  const [{ data: sheet, error }, { data: account }] = await Promise.all([
    legacyDb().rpc("ficha_centro", { p_id: id }),
    legacyDb().from("cuentas").select("id").eq("centro_id", id).maybeSingle().then((result) => result, () => ({ data: null }))
  ]);
  if (!box.open) return;
  if (error || !sheet?.datos) {
    body2.innerHTML = `${header(t("accountsMore.centre.title"))}
      <div class="banda-peligro">${t("accountsMore.centre.couldNotOpen", { error: error ? `: ${escapeHtml(orFallback(error.message, ""))}` : "" })}</div>`;
    return;
  }
  body2.innerHTML = sheetHtml(sheet, sheet.datos, account?.id ?? null);
  bind2(body2, box, sheet, sheet.datos);
}

// src/app/screens/accounts/nearby.ts
var RADIUS_KM = 10;
var LIMIT = 100;
var TIMEOUT_MS = 15e3;
function rowHtml2(item) {
  const urgent = item.urgente ? `<span class="pill p-urg">${t("accountsMore.nearby.urgent")}</span> ` : "";
  const noReporting = item.sin_reporting ? `<span class="pill p-sr" title="${t("accountsMore.nearby.noReportingTitle", { visit: term("visita") })}">${t("accountsMore.nearby.noReporting")}</span> ` : "";
  return `<button class="trow" data-id="${item.id}" style="padding:10px 14px;gap:12px">
      <span class="tcell cercakm"><b style="color:var(--navy)">${String(item.km).replace(".", ",")} km</b></span>
      <span class="tcell" style="flex:1;width:auto">
        <span class="nm">${urgent}${noReporting}${escapeHtml(item.nombre)}</span>
        <span class="sm">${escapeHtml(orFallback(item.especialidad, ""))} · ${escapeHtml(orFallback(item.centro_nombre, ""))} ${escapeHtml(orFallback(item.municipio, ""))}</span></span>
      <span class="tcell cercaest"><span class="pill p-est">${escapeHtml(orFallback(item.estado_comercial, ""))}</span></span>
    </button>`;
}
function paintNearby() {
  const nearby = miscLegacy.nearby();
  if (!nearby) return;
  const list = nearby.lista, size = accountListLegacy.pageSize(), page = nearby.pagina ?? 0;
  const shown = list.slice(page * size, page * size + size);
  const head = document.getElementById("thead"), count = document.getElementById("cuenta"), rows = document.getElementById("lista"), pages = document.getElementById("dirpag");
  if (head) head.innerHTML = "";
  if (count) count.innerHTML = `${t("accountsMore.nearby.count", { count: formatNumber(list.length), professionals: term("medico", { number: list.length === 1 ? "s" : "p" }) })}
    <button class="kcfg" id="cercacerrar" style="margin-left:10px">${t("accountsMore.nearby.back")}</button>`;
  if (rows) rows.innerHTML = shown.length ? shown.map(rowHtml2).join("") : `<div class="vacio">${t("accountsMore.nearby.none", { professionals: term("medico", { number: "p" }) })}</div>`;
  pages?.classList.remove("hide");
  accountListLegacy.paginate({
    element: pages,
    total: list.length,
    page,
    onPage: (next) => {
      nearby.pagina = next;
      paintNearby();
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onSize: () => {
      nearby.pagina = 0;
      paintNearby();
    }
  });
  const close = document.getElementById("cercacerrar");
  if (close) close.onclick = () => {
    miscLegacy.setNearby(null);
    void searchAccounts(true);
  };
}
function reset(button) {
  button.disabled = false;
  button.textContent = t("accountsMore.nearby.button");
}
async function search2(button, position) {
  const { latitude, longitude } = position.coords;
  const { data, error } = await legacyDb().rpc("cuentas_cerca", { p_lat: latitude, p_lon: longitude, p_km: RADIUS_KM, lim: LIMIT });
  reset(button);
  if (error) {
    notices.toast(t("accountsMore.nearby.couldNotSearch", { error: orFallback(error.message, "") }), true);
    return;
  }
  miscLegacy.setNearby({ lista: data ?? [], pos: [latitude, longitude] });
  paintNearby();
}
function searchNearby(button) {
  if (!("geolocation" in navigator)) {
    notices.toast(t("accountsMore.nearby.noLocation"), true);
    return;
  }
  button.disabled = true;
  button.textContent = t("accountsMore.nearby.locating");
  navigator.geolocation.getCurrentPosition((position) => {
    void search2(button, position);
  }, () => {
    reset(button);
    notices.toast(t("accountsMore.nearby.noPosition"), true);
  }, { enableHighAccuracy: true, timeout: TIMEOUT_MS });
}

// src/app/screens/accounts/portfolio.ts
var LIMIT2 = 500;
var SEARCH_WAIT_MS2 = 300;
function rowHtml3(account) {
  const last = account.ultima_visita ? ` · ${term("visita", { article: "ultimo" })} ${formatShortDate(account.ultima_visita)}` : ` · ${t("accountsEditor.portfolio.notVisited")}`;
  return `<div class="item u-cursor-default">
        <span class="ic ${account.urgente ? "w" : ""}">${account.urgente ? "!" : "·"}</span>
        <span class="tx"><b>${escapeHtml(account.nombre)}</b><span class="sm">${escapeHtml(account.especialidad ?? "")} · ${escapeHtml(account.centro ?? "")} ${escapeHtml(account.municipio ?? "")}
          ${last}</span></span>
        <span class="acts u-m-0">
          <button class="btn sec" data-cficha="${account.id}">${t("accountsEditor.portfolio.card")}</button>
          <button class="btn sec dang" data-cquita="${account.id}">${t("accountsEditor.portfolio.remove")}</button></span></div>`;
}
function pageHtml2(name, list, query) {
  const assigned = term("medico", { number: "p", adjective: "asignado" });
  return `
      <div class="fh"><div><h2>${t("accountsEditor.portfolio.title", { name: escapeHtml(name) })}</h2>
        <div class="sm">${formatNumber(list.length)} ${assigned}</div></div>
        <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>
      <input id="cbusca" value="${escapeHtml(query)}" placeholder="${t("accountsEditor.portfolio.search")}">
      <div class="lista" style="max-height:52vh;overflow:auto">${list.map(rowHtml3).join("") || `<div class="vacio">${t("accountsEditor.portfolio.none", { assigned })}</div>`}</div>
      <div class="acts u-end"><button class="btn sec" id="cmas">${t("accountsEditor.portfolio.assignMore", { professionals: term("medico", { number: "p" }) })}</button></div>`;
}
async function removeFrom(userId, accountId, repaint2) {
  if (!await notices.confirm(t("accountsEditor.portfolio.removeText", { visits: term("visita", { number: "p" }) }), { titulo: t("accountsEditor.portfolio.removeTitle"), ok: t("accountsEditor.portfolio.remove"), peligro: true })) return;
  const { data: result } = await legacyDb().rpc("quitar_de_cartera", { p_usuario: userId, p_medico: accountId });
  if (result?.ok === false) {
    notices.toast(t("accountsEditor.portfolio.noPermission"), true);
    return;
  }
  notices.toast(t("accountsEditor.portfolio.removed"));
  repaint2();
  accountsEditorLegacy.reloadAdmin();
}
async function paint3(userId, name, query) {
  const { data } = await legacyDb().rpc("cartera_usuario", { p_usuario: userId, q: query || null, lim: LIMIT2 });
  const body2 = document.getElementById("dbody"), dialog = document.getElementById("dlg");
  if (!body2 || !dialog) return;
  body2.innerHTML = pageHtml2(name, data ?? [], query);
  let timer;
  const search3 = document.getElementById("cbusca");
  if (search3) search3.oninput = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      void paint3(userId, name, search3.value.trim());
    }, SEARCH_WAIT_MS2);
  };
  body2.querySelectorAll("[data-cficha]").forEach((button) => {
    button.onclick = () => {
      dialog.close();
      void openAccountCard(button.dataset.cficha ?? "");
    };
  });
  body2.querySelectorAll("[data-cquita]").forEach((button) => {
    button.onclick = () => {
      void removeFrom(userId, button.dataset.cquita ?? "", () => {
        void paint3(userId, name, query);
      });
    };
  });
  const more = document.getElementById("cmas");
  if (more) more.onclick = () => {
    dialog.close();
    accountsEditorLegacy.assignPortfolio(userId);
  };
}
async function showPortfolio(userId) {
  const user = accountsEditorLegacy.teamUsers().find((item) => item.id === userId);
  const body2 = document.getElementById("dbody"), dialog = document.getElementById("dlg");
  showLoading(body2, t("accountsEditor.portfolio.loading"));
  dialog?.showModal();
  await paint3(userId, user?.nombre ?? "", "");
}

// src/app/screens/accounts/status.ts
async function changeState(id, state) {
  const { error } = await legacyDb().from("cuentas").update({ estado_comercial: state }).eq("id", id);
  if (error) {
    notices.toast(t("accountsEditor.status.couldNotChange", { error: error.message ?? "" }), true);
    return;
  }
  notices.toast(t("accountsEditor.status.changed", { state }));
  void searchAccounts(true);
  miscLegacy.reloadHome();
}
var removedText = (removed) => removed ? t(removed === 1 ? "accountsEditor.status.oneAppointmentRemoved" : "accountsEditor.status.appointmentsRemoved", { count: removed }) : "";
var errorText = (error, result) => error?.message ?? result?.error ?? "";
async function setAccountOut(id, out) {
  const { data: result, error } = await legacyDb().rpc("baja_cuenta", { p_id: id, p_baja: out });
  if (error || !result?.ok) {
    notices.toast(t("accountsEditor.status.couldNot", { error: errorText(error, result) }), true);
    return false;
  }
  try {
    appLegacy.forgetCache();
  } catch {
  }
  notices.toast(out ? t("accountsEditor.status.out") + removedText(result.citas_quitadas ?? 0) : t("accountsEditor.status.backIn"));
  if (currentScreen() === "directorio") void searchAccounts(true);
  return true;
}
export {
  answerDayPickerClick,
  answerDuplicatesClick,
  centreFromLocation,
  centreList,
  changeState,
  consultationHtml2 as consultationHtml,
  loadDuplicates,
  markLocated,
  openAccountCard,
  openColumnsPanel,
  openEditor,
  paintCentrePicker,
  paintHeader,
  paintMap,
  paintNearby,
  readDays,
  refreshPortal,
  searchAccounts,
  searchNearby,
  setAccountOut,
  setCentre,
  showCentre,
  showPortfolio
};
