// delcos-shared:src/app/i18n/index.ts
var shared = globalThis["__delcosModules"]["i18n/index"];
var pick = (name) => shared[name];
var registerMessages = /* @__PURE__ */ pick("registerMessages");
var t = /* @__PURE__ */ pick("t");

// src/app/i18n/es/chunks/settings-parts/settings.ts
var settings = {
  preferences: {
    intro: "El punto de salida y el de llegada se usan para calcular el plan del día y los recorridos.",
    startTitle: "Punto de salida",
    startHint: "Dónde empiezas el día",
    endTitle: "Punto de llegada",
    endHint: "Déjalo vacío para volver al punto de salida",
    name: "Nombre",
    namePlaceholder: "Casa, Oficina…",
    address: "Dirección",
    addressPlaceholder: "Calle, número y población",
    located: "✓ Ubicado",
    notLocated: "Sin ubicar: pulsa Buscar dirección",
    fromGps: "desde el GPS",
    findAddress: "Buscar dirección",
    finding: "Buscando…",
    useLocation: "Usar mi ubicación",
    locating: "Localizando…",
    save: "Guardar preferencias",
    saving: "Guardando…",
    writeAddress: "Escribe la dirección",
    addressNotFound: "No se ha encontrado esa dirección",
    addressFound: "Dirección encontrada",
    couldNotSearch: "No se ha podido buscar la dirección",
    noLocationDevice: "Este dispositivo no tiene ubicación",
    myLocation: "Mi ubicación",
    locationTaken: "Ubicación tomada",
    couldNotLocate: "No se ha podido obtener la ubicación",
    locateStart: "Ubica el punto de salida antes de guardar",
    locateEnd: "Ubica el punto de llegada o déjalo vacío",
    couldNotSave: "No se ha podido guardar: {error}",
    saved: "Guardado · sales de {start} y terminas en {end}"
  },
  notice: {
    title: "Avisos",
    revisit: "Avisarme si {aProfessional} ya se ha visitado hace poco",
    revisitHint: "Al añadir una cita, al planificar una ruta o la semana. Cuenta {visits} y citas de cualquier persona.",
    days: "Cuántos días cuentan como «hace poco»",
    saved: "Aviso guardado"
  },
  profile: {
    modules: "Tus módulos",
    activity: "Tu actividad",
    loading: "Cargando…",
    permissions: "Tus permisos los gestiona administración. Debajo, las preferencias que puedes cambiar tú.",
    portfolio: "en tu cartera",
    thisMonth: "este mes",
    zone: "Zona: {zones}",
    commission: "Comisión: {scheme}",
    moduleNames: {
      inicio: "Inicio",
      agenda: "Agenda",
      rutas: "Rutas",
      directorio: "Directorio",
      pacientes: "Clientes",
      productos: "Productos",
      seguimiento: "Calidad del dato",
      ventas: "Pedidos",
      analitica: "Analítica",
      facturacion: "Facturación"
    }
  },
  classifiers: {
    loading: "Cargando los clasificadores…",
    intro: "Listas que usan todos los usuarios en fichas, {visits}, pedidos y filtros.",
    readOnly: "Tienes permiso de solo lectura.",
    newClassifier: "+ Nuevo clasificador",
    general: "General",
    sales: "Ventas",
    oneClassifier: "clasificador",
    classifiers: "clasificadores",
    system: "del sistema",
    readOnlyTitle: "Solo lectura",
    oneActive: "valor activo",
    activeValues: "valores activos"
  },
  newClassifier: {
    title: "Nuevo clasificador",
    subtitle: "Una lista propia que podrás usar en fichas, {visits} o pedidos",
    name: "Nombre",
    namePlaceholder: "p. ej. Tipo de centro",
    group: "Grupo",
    where: "¿Dónde se usa?",
    onAccount: "En la ficha {ofTheProfessional}",
    onVisit: "Al registrar {aVisit}",
    onOrder: "En los pedidos",
    onCustomer: "En la ficha {ofTheCustomer}",
    onProduct: "En la ficha del producto",
    description: "Descripción",
    descriptionPlaceholder: "Para qué sirve",
    values: "Valores",
    valuePlaceholder: "Valor {index}",
    addValue: "+ Añadir valor",
    cancel: "Cancelar",
    create: "Crear clasificador",
    nameIt: "Ponle un nombre",
    noPermission: "No tienes permiso",
    created: "Clasificador creado"
  },
  audit: {
    loading: "Cargando la auditoría…",
    title: "Auditoría",
    hint: "Quién ha cambiado qué y cuándo. Se guarda automáticamente.",
    user: "Usuario",
    all: "Todos",
    entity: "Entidad",
    allEntities: "Todas",
    filtering: "Filtrando…",
    empty: "Sin movimientos con estos filtros.",
    undo: "Deshacer",
    portfolio: "Cartera",
    appointment: "Cita",
    route: "Ruta",
    order: "Pedido",
    userEntity: "Usuario",
    product: "Producto"
  },
  billingLog: {
    loading: "Cargando el registro…",
    intro: "Todo lo que ocurre en la facturación queda anotado: emisiones, rectificaciones, cobros y cambios de configuración.",
    date: "Fecha y hora",
    event: "Evento",
    invoice: "Factura",
    person: "Persona",
    detail: "Detalle",
    empty: "Sin eventos."
  },
  testEnvironment: {
    loading: "Cargando…",
    title: "Entorno de pruebas",
    subtitle: "Una copia completa de la plataforma con su propia base de datos: nada de lo que hagas aquí afecta a los datos reales.",
    startData: "Datos de partida (copia de producción)",
    lastReset: "Última vuelta a los datos de partida",
    bring: "⇣ Traer los datos de producción",
    reset: "↺ Volver a los datos de partida",
    explain: "<b>Traer los datos de producción</b> copia aquí los datos de hoy (producción solo se lee) y pasan a ser los nuevos datos de partida. <b>Volver a los datos de partida</b> deshace todo lo hecho en pruebas desde la última copia. En los dos casos se pierde lo hecho en pruebas.",
    onlyResponsible: "Solo la persona responsable del entorno de pruebas puede traer los datos de producción o volver a los datos de partida.",
    copyingStarting: "· Copiando los datos de producción (empezando): tarda unos minutos",
    copyingRunning: "· Copiando los datos de producción (en marcha): tarda unos minutos",
    copyFailed: "· La última copia de producción falló",
    copied: "Datos de producción copiados",
    copyFailedToast: "La copia de producción ha fallado",
    askText: "Se copiarán aquí los datos actuales de producción (producción no se toca) y pasarán a ser los nuevos datos de partida. Todo lo hecho en pruebas se perderá. Tarda unos minutos; puedes seguir usando la app mientras tanto.",
    askTitle: "¿Traer los datos de producción?",
    askOk: "Sí, traerlos",
    couldNotStart: "No se ha podido lanzar la copia",
    missingFunction: ": falta la función «refrescar-pruebas» en Supabase",
    started: "Copia de producción en marcha: tarda unos minutos"
  }
};

// src/app/i18n/es/chunks/settings-parts/settings-extra.ts
var settingsExtra = {
  notifications: {
    title: "Notificaciones",
    unread: "{count} sin leer",
    upToDate: "Estás al día",
    lastWeek: " · últimos 7 días",
    choose: "Elegir qué recibo y cuándo",
    close: "Cerrar",
    filter: "Filtrar",
    all: "Todas",
    fresh: "Nuevas · {count}",
    earlier: "Anteriores",
    noneInArea: "No hay avisos de esta área.",
    none: "No tienes notificaciones de los últimos 7 días.",
    keptFor: "Se guardan las de los últimos 7 días. Las que borras no vuelven a salir.",
    markAllRead: "Marcar todas como leídas",
    removeRead: "Borrar las leídas",
    removeAll: "Borrar todas",
    yesterday: "Ayer",
    fromDigest: " · del resumen del día",
    postpone: "Posponer a mañana",
    removeOne: "Borrar esta notificación",
    remove: "Borrar",
    couldNotPostpone: "No se ha podido posponer",
    postponed: "Te lo volvemos a enseñar mañana",
    couldNotRemove: "No se han podido borrar",
    readRemoved: "Notificaciones leídas borradas",
    removeAllTitle: "Borrar todas las notificaciones",
    removeAllText: "Se borran todas, también las que no has leído, y no vuelven a salir.",
    removed: "Notificaciones borradas",
    call: "Llamar",
    newSale: "Nueva venta",
    seeCard: "Ver ficha",
    appoint: "Citar",
    recordVisit: "Registrar {visit}",
    seeOrder: "Ver pedido",
    open: "Abrir"
  },
  menuNames: {
    title: "Menús",
    help: "Cómo se llama cada módulo en el menú y en el título de su pantalla. Escribe el nombre que usa tu empresa; en blanco, se usa el de siempre.",
    module: "Módulo",
    companyName: "Nombre en tu empresa",
    nameOf: "Nombre de {name} en tu empresa",
    save: "Guardar",
    saving: "Guardando…",
    couldNotSave: "No se han podido guardar los nombres",
    saved: "Nombres guardados"
  }
};

// src/app/i18n/es/chunks/settings-parts/settings-rest.ts
var settingsRest = {
  profile: {
    myData: "Mis datos",
    visibleName: "Nombre visible",
    phone: "Teléfono",
    phonePlaceholder: "Para que el equipo pueda llamarte",
    openOnStart: "Al entrar, abrir",
    language: "Idioma",
    save: "Guardar",
    emptyName: "El nombre no puede quedar vacío",
    couldNotSave: "No se ha podido guardar",
    saved: "Datos guardados",
    startScreens: {
      inicio: "Inicio",
      agenda: "Agenda",
      rutas: "Rutas",
      directorio: "Directorio",
      ventas: "Pedidos"
    },
    security: "Seguridad y sesión",
    securityHint: "Para cambiar la contraseña te enviamos un enlace a tu correo. Así nadie puede cambiarla desde un dispositivo que hayas dejado abierto.",
    accessEmail: "Correo de acceso",
    role: "Rol",
    sendLink: "Enviarme el enlace para cambiar la contraseña",
    signOut: "Cerrar sesión",
    sending: "Enviando…",
    couldNotSend: "No se ha podido enviar: {error}",
    linkSent: "Te hemos enviado el enlace a {email}",
    routesTitle: "Rutas y desplazamientos",
    routesHint: "Desde dónde sales y dónde terminas. Al pulsar «Cómo llegar» eliges con qué app navegar (Google Maps, Waze o Apple Maps). El horario de las rutas está en su propio apartado.",
    couldNotSaveError: "No se ha podido guardar: {error}"
  }
};

// src/app/i18n/es/chunks/settings-parts/index.ts
var texts = { settings, settingsExtra, settingsRest };

// src/app/screens/settings/parts/texts.ts
registerMessages(texts);

// delcos-shared:src/app/legacy/bridge.ts
var shared2 = globalThis["__delcosModules"]["legacy/bridge"];
var pick2 = (name) => shared2[name];
var agendaActions = /* @__PURE__ */ pick2("agendaActions");
var appLegacy = /* @__PURE__ */ pick2("appLegacy");
var callRpc = /* @__PURE__ */ pick2("callRpc");
var cardSectionsLegacy = /* @__PURE__ */ pick2("cardSectionsLegacy");
var currentScreen = /* @__PURE__ */ pick2("currentScreen");
var icon = /* @__PURE__ */ pick2("icon");
var initialsOf = /* @__PURE__ */ pick2("initialsOf");
var legacyDb = /* @__PURE__ */ pick2("legacyDb");
var notices = /* @__PURE__ */ pick2("notices");
var term = /* @__PURE__ */ pick2("term");

// delcos-shared:src/app/legacy/settings1-bridge.ts
var shared3 = globalThis["__delcosModules"]["legacy/settings1-bridge"];
var pick3 = (name) => shared3[name];
var settingsLegacy = /* @__PURE__ */ pick3("settingsLegacy");

// src/app/screens/settings/preferences/notice.ts
var DEFAULT_DAYS = 7;
function paintNotice() {
  const actions = document.getElementById("pfguardar")?.closest(".acts");
  if (!actions || document.getElementById("pfaviso")) return;
  const notice = settingsLegacy.revisitNotice();
  actions.insertAdjacentHTML("beforebegin", `<div class="blk" id="pfaviso"><h3>${t("settings.notice.title")}</h3>
    <label class="opt"><input type="checkbox" id="pfrev" ${notice.on ? "checked" : ""}>
      <span><b>${t("settings.notice.revisit", { aProfessional: term("medico", { article: "un" }) })}</b><br><span class="sm">${t("settings.notice.revisitHint", { visits: term("visita", { number: "p" }) })}</span></span></label>
    <div class="g2"><div><label for="pfrevd">${t("settings.notice.days")}</label><input id="pfrevd" type="number" min="1" max="60" value="${notice.dias}"></div></div></div>`);
  const enabled = document.getElementById("pfrev"), days = document.getElementById("pfrevd");
  if (!enabled || !days) return;
  const save3 = async () => {
    if (await settingsLegacy.saveRevisitNotice({ on: enabled.checked, dias: Math.max(1, Number(days.value) || DEFAULT_DAYS) })) notices.toast(t("settings.notice.saved"));
  };
  enabled.onchange = () => {
    void save3();
  };
  days.onchange = () => {
    void save3();
  };
}

// delcos-shared:src/app/services/format.ts
var shared4 = globalThis["__delcosModules"]["services/format"];
var pick4 = (name) => shared4[name];
var escapeHtml = /* @__PURE__ */ pick4("escapeHtml");
var formatNumber = /* @__PURE__ */ pick4("formatNumber");

// delcos-shared:src/app/core/organisation.ts
var shared5 = globalThis["__delcosModules"]["core/organisation"];
var pick5 = (name) => shared5[name];
var countryCode = /* @__PURE__ */ pick5("countryCode");

// src/app/screens/settings/preferences/places.ts
var searchUrl = () => `https://nominatim.openstreetmap.org/search?format=json&limit=1${countryCode() ? `&countrycodes=${countryCode()}` : ""}&q=`;
var GPS_TIMEOUT_MS = 15e3;
var GPS_DECIMALS = 6;
var SHOWN_ADDRESS_PARTS = 3;
var KEYS = { start: "salida", end: "llegada" };
var located = (text) => `<b class="u-ok">${t("settings.preferences.located")}</b> ${text}`;
function placeCard(key, place, title, hint) {
  return `<div class="card" style="padding-top:16px;padding-bottom:16px">
    <h2 class="u-p-0">${title}</h2><p class="sm u-p-0">${hint}</p>
    <div class="g2 u-mt-10">
      <div><label>${t("settings.preferences.name")}</label><input data-pn="${key}" value="${escapeHtml(place?.nombre ?? "")}" placeholder="${t("settings.preferences.namePlaceholder")}"></div>
      <div><label>${t("settings.preferences.address")}</label><input data-pd="${key}" value="${escapeHtml(place?.dir ?? "")}" placeholder="${t("settings.preferences.addressPlaceholder")}"></div>
    </div>
    <div class="sm u-mt-8" data-pe="${key}">${place?.lat ? located(escapeHtml(place.dir)) : `<span class="u-warn">${t("settings.preferences.notLocated")}</span>`}</div>
    <div class="acts"><button class="btn sec" data-pg="${key}">${t("settings.preferences.findAddress")}</button>
      <button class="btn sec" data-pgps="${key}">${t("settings.preferences.useLocation")}</button></div></div>`;
}
var field = (box, attribute, key) => box.querySelector(`[data-${attribute}="${key}"]`);
var status = (box, key) => box.querySelector(`[data-pe="${key}"]`);
async function findAddress(box, button) {
  const key = button.dataset.pg ?? "", address = field(box, "pd", key)?.value.trim() ?? "";
  if (!address) {
    notices.toast(t("settings.preferences.writeAddress"), true);
    return;
  }
  button.disabled = true;
  button.textContent = t("settings.preferences.finding");
  try {
    const found = await (await fetch(searchUrl() + encodeURIComponent(address))).json();
    button.disabled = false;
    button.textContent = t("settings.preferences.findAddress");
    const first = found[0];
    if (!first) {
      notices.toast(t("settings.preferences.addressNotFound"), true);
      return;
    }
    button.dataset.lat = first.lat;
    button.dataset.lon = first.lon;
    const shown = status(box, key);
    if (shown) shown.innerHTML = located(escapeHtml(first.display_name.split(",").slice(0, SHOWN_ADDRESS_PARTS).join(",")));
    notices.toast(t("settings.preferences.addressFound"));
  } catch {
    button.disabled = false;
    button.textContent = t("settings.preferences.findAddress");
    notices.toast(t("settings.preferences.couldNotSearch"), true);
  }
}
function useLocation(box, button) {
  const key = button.dataset.pgps ?? "";
  if (!("geolocation" in navigator)) {
    notices.toast(t("settings.preferences.noLocationDevice"), true);
    return;
  }
  button.disabled = true;
  button.textContent = t("settings.preferences.locating");
  const done = () => {
    button.disabled = false;
    button.textContent = t("settings.preferences.useLocation");
  };
  navigator.geolocation.getCurrentPosition((position) => {
    done();
    const search = field(box, "pg", key), address = field(box, "pd", key), shown = status(box, key);
    if (search) {
      search.dataset.lat = position.coords.latitude.toFixed(GPS_DECIMALS);
      search.dataset.lon = position.coords.longitude.toFixed(GPS_DECIMALS);
    }
    if (address) address.value = t("settings.preferences.myLocation");
    if (shown) shown.innerHTML = located(t("settings.preferences.fromGps"));
    notices.toast(t("settings.preferences.locationTaken"));
  }, () => {
    done();
    notices.toast(t("settings.preferences.couldNotLocate"), true);
  }, { enableHighAccuracy: true, timeout: GPS_TIMEOUT_MS });
}
var inputValue = (box, attribute, key) => field(box, attribute, key)?.value.trim() ?? "";
var coordinate = (found, saved) => found ? Number(found) : saved ?? null;
function readPlace(box, key, fallback) {
  const name = inputValue(box, "pn", key), address = inputValue(box, "pd", key);
  if (!address) return null;
  const found = box.querySelector(`[data-pg="${key}"]`)?.dataset ?? {}, before = settingsLegacy.place(key) ?? fallback;
  const kept = before?.dir === address ? before : null;
  return { nombre: name || address, dir: address, lat: coordinate(found.lat, kept?.lat), lon: coordinate(found.lon, kept?.lon) };
}
async function save(box, button, start, repaint) {
  const leaving = readPlace(box, KEYS.start, start), arriving = readPlace(box, KEYS.end, null);
  if (!leaving?.lat) {
    notices.toast(t("settings.preferences.locateStart"), true);
    return;
  }
  if (arriving && !arriving.lat) {
    notices.toast(t("settings.preferences.locateEnd"), true);
    return;
  }
  button.disabled = true;
  button.textContent = t("settings.preferences.saving");
  const preferences = { ...settingsLegacy.user().preferencias ?? {}, salida: leaving, llegada: arriving };
  const { data, error } = await legacyDb().rpc("guardar_preferencias", { p: preferences });
  button.disabled = false;
  button.textContent = t("settings.preferences.save");
  if (error) {
    notices.toast(t("settings.preferences.couldNotSave", { error: error.message ?? "" }), true);
    return;
  }
  settingsLegacy.setPreferences(data ?? preferences);
  notices.toast(t("settings.preferences.saved", { start: leaving.nombre, end: (arriving ?? leaving).nombre }));
  repaint();
}
function paintPlaces(box, repaint) {
  const start = settingsLegacy.place(KEYS.start) ?? { nombre: "", dir: "" }, end = settingsLegacy.place(KEYS.end);
  box.innerHTML = `
    <p class="sm">${t("settings.preferences.intro")}</p>
    <div class="cols">
      ${placeCard(KEYS.start, start, t("settings.preferences.startTitle"), t("settings.preferences.startHint"))}
      ${placeCard(KEYS.end, end, t("settings.preferences.endTitle"), t("settings.preferences.endHint"))}
    </div>
    <div class="acts u-end"><button class="btn" id="pfguardar">${t("settings.preferences.save")}</button></div>`;
  const navigatorSelect = document.getElementById("navsel");
  if (navigatorSelect) navigatorSelect.onchange = () => {
    settingsLegacy.changeNavigator(navigatorSelect.value);
  };
  box.querySelectorAll("[data-pg]").forEach((button) => {
    button.onclick = () => {
      void findAddress(box, button);
    };
  });
  box.querySelectorAll("[data-pgps]").forEach((button) => {
    button.onclick = () => {
      useLocation(box, button);
    };
  });
  const saveButton = document.getElementById("pfguardar");
  if (saveButton) saveButton.onclick = () => {
    void save(box, saveButton, start, repaint);
  };
}

// delcos-shared:src/app/services/values.ts
var shared6 = globalThis["__delcosModules"]["services/values"];
var pick6 = (name) => shared6[name];
var isPresent = /* @__PURE__ */ pick6("isPresent");
var orFallback = /* @__PURE__ */ pick6("orFallback");

// src/app/screens/settings/preferences/profile.ts
var MODULE_NAMES = /* @__PURE__ */ new Map([
  ["inicio", "settings.profile.moduleNames.inicio"],
  ["agenda", "settings.profile.moduleNames.agenda"],
  ["rutas", "settings.profile.moduleNames.rutas"],
  ["directorio", "settings.profile.moduleNames.directorio"],
  ["pacientes", "settings.profile.moduleNames.pacientes"],
  ["productos", "settings.profile.moduleNames.productos"],
  ["seguimiento", "settings.profile.moduleNames.seguimiento"],
  ["ventas", "settings.profile.moduleNames.ventas"],
  ["analitica", "settings.profile.moduleNames.analitica"],
  ["facturacion", "settings.profile.moduleNames.facturacion"]
]);
var moduleName = (module) => {
  const key = MODULE_NAMES.get(module);
  return key ? t(key) : module;
};
function cardHtml() {
  const user = settingsLegacy.user();
  const modules = settingsLegacy.modules().map((module) => `<span>${settingsLegacy.moduleIcon(module) ?? "•"} ${escapeHtml(moduleName(module))}</span>`).join("");
  return `<div class="card miperfil" id="miperfil">
    <div class="mpcab"><span class="mpav">${escapeHtml(initialsOf(user.nombre))}</span>
      <div><h2 class="u-p-0-0-4 u-m-0">${escapeHtml(user.nombre)}</h2><div class="sm">${escapeHtml(user.email ?? "")}</div>
        <div class="mpchips"><span class="pill p-est">${escapeHtml(user.rol)}</span></div></div></div>
    <div class="mpgrid">
      <div><b>${t("settings.profile.modules")}</b><div class="mpmods">${modules}</div></div>
      <div id="mpextra"><b>${t("settings.profile.activity")}</b><div class="sm">${t("settings.profile.loading")}</div></div>
    </div>
    <p class="sm u-m-10-0-0">${t("settings.profile.permissions")}</p></div>`;
}
var zoneName = (zone) => zone.charAt(0) + zone.slice(1).toLowerCase();
function activityHtml(kpis, zones, scheme) {
  return `<b>${t("settings.profile.activity")}</b><ul class="mplist">
    ${isPresent(kpis.medicos) ? `<li>🩺 <b>${formatNumber(kpis.medicos)}</b> ${term("medico", { number: "p" })} ${t("settings.profile.portfolio")}</li>` : ""}
    ${isPresent(kpis.visitas_mes) ? `<li>📝 <b>${formatNumber(kpis.visitas_mes)}</b> ${term("visita", { number: "p" })} ${t("settings.profile.thisMonth")}</li>` : ""}
    ${zones.length ? `<li>📍 ${escapeHtml(t("settings.profile.zone", { zones: zones.map(zoneName).join(", ") }))}</li>` : ""}
    ${scheme ? `<li>€ ${escapeHtml(t("settings.profile.commission", { scheme: scheme.esquema }))}</li>` : ""}</ul>`;
}
var safely = (read2) => Promise.resolve(read2).then((result) => result, () => ({ data: null }));
async function paintProfile() {
  const box = document.getElementById("cfgcuerpo");
  if (!box || document.getElementById("miperfil")) return;
  box.insertAdjacentHTML("afterbegin", cardHtml());
  const userId = settingsLegacy.user().id;
  const [{ data: panel }, { data: schemes }, { data: me }] = await Promise.all([
    safely(callRpc("panel_inicio", {})),
    safely(callRpc("historial_esquemas", { p_usuario: userId })),
    safely(legacyDb().from("perfiles").select("zonas").eq("id", userId).single())
  ]);
  const extra = document.getElementById("mpextra");
  if (!extra) return;
  extra.innerHTML = activityHtml(panel?.kpis ?? panel ?? {}, me?.zonas ?? [], (schemes ?? []).find((item) => !item.hasta));
}

// src/app/screens/settings/preferences/index.ts
async function paintPreferences() {
  const box = document.getElementById("cfgcuerpo");
  if (!box) return;
  paintPlaces(box, () => {
    void paintPreferences();
  });
  paintNotice();
  await paintProfile();
}

// delcos-shared:src/app/legacy/settings3-bridge.ts
var shared7 = globalThis["__delcosModules"]["legacy/settings3-bridge"];
var pick7 = (name) => shared7[name];
var settingsExtraLegacy = /* @__PURE__ */ pick7("settingsExtraLegacy");

// delcos-shared:src/app/legacy/settings4-bridge.ts
var shared8 = globalThis["__delcosModules"]["legacy/settings4-bridge"];
var pick8 = (name) => shared8[name];
var profileLegacy = /* @__PURE__ */ pick8("profileLegacy");

// delcos-shared:src/app/components/loading.ts
var shared9 = globalThis["__delcosModules"]["components/loading"];
var pick9 = (name) => shared9[name];
var showFullLoading = /* @__PURE__ */ pick9("showFullLoading");

// src/app/screens/settings/profile/page.ts
var START_SCREENS = ["inicio", "agenda", "rutas", "directorio", "ventas"];
var field2 = (id) => document.getElementById(id);
function dataCardHtml() {
  const me = profileLegacy.me(), preferences = me.preferencias ?? {};
  const starts = START_SCREENS.filter((screen) => profileLegacy.canOpenModule(screen)).map((screen) => `<option value="${screen}" ${(preferences.inicio ?? "inicio") === screen ? "selected" : ""}>${t(`settingsRest.profile.startScreens.${screen}`)}</option>`).join("");
  const languages = profileLegacy.languages().map(([id, name]) => `<option value="${id}" ${profileLegacy.language() === id ? "selected" : ""}>${name}</option>`).join("");
  return `<div class="card cfgpanel"><h2>${t("settingsRest.profile.myData")}</h2>
      <div class="g2"><div><label for="pfn">${t("settingsRest.profile.visibleName")}</label><input id="pfn" value="${escapeHtml(me.nombre)}"></div>
        <div><label for="pft">${t("settingsRest.profile.phone")}</label><input id="pft" inputmode="tel" value="${escapeHtml(preferences.telefono ?? "")}" placeholder="${t("settingsRest.profile.phonePlaceholder")}"></div></div>
      <div class="g2"><div><label for="pfi">${t("settingsRest.profile.openOnStart")}</label><select id="pfi">${starts}</select></div><div><label for="pfl">${t("settingsRest.profile.language")}</label><select id="pfl" data-notr>${languages}</select></div></div>
      <div class="acts u-end"><button class="btn" id="pfok">${t("settingsRest.profile.save")}</button></div></div>`;
}
function showName(name) {
  profileLegacy.me().nombre = name;
  const user = document.getElementById("uname"), avatar = document.getElementById("av");
  if (user) user.textContent = settingsExtraLegacy.firstName(name);
  if (avatar) avatar.textContent = initialsOf(name);
}
async function saveData() {
  const name = field2("pfn")?.value.trim() ?? "";
  if (!name) {
    notices.toast(t("settingsRest.profile.emptyName"), true);
    return;
  }
  const me = profileLegacy.me(), preferences = { ...me.preferencias ?? {}, telefono: field2("pft")?.value.trim() ?? "", inicio: field2("pfi")?.value ?? "" };
  const [saved, renamed] = await Promise.all([legacyDb().rpc("guardar_preferencias", { p: preferences }), legacyDb().from("perfiles").update({ nombre: name }).eq("id", me.id)]);
  if (saved.error) {
    notices.toast(t("settingsRest.profile.couldNotSave"), true);
    return;
  }
  me.preferencias = saved.data ?? preferences;
  if (!renamed.error) showName(name);
  notices.toast(t("settingsRest.profile.saved"));
}
async function changeLanguage(select) {
  const id = select.value, me = profileLegacy.me(), preferences = { ...me.preferencias ?? {}, idioma: id };
  const { data, error } = await legacyDb().rpc("guardar_preferencias", { p: preferences });
  if (error) {
    notices.toast(t("settingsRest.profile.couldNotSave"), true);
    return;
  }
  me.preferencias = data ?? preferences;
  try {
    localStorage.setItem("app-idioma", id);
    sessionStorage.removeItem("app-idioma-recarga");
  } catch {
  }
  showFullLoading(`${profileLegacy.languages().find((item) => item[0] === id)?.[1] ?? ""}…`);
  location.reload();
}
function placePersonCard() {
  document.querySelectorAll("#miperfil, #mpextra").forEach((item) => {
    if (item.closest(".congelada")) item.removeAttribute("id");
    else item.remove();
  });
  if (!document.getElementById("perfilcab")) return;
  void paintProfile();
  const card = document.getElementById("miperfil"), place = document.getElementById("perfilcab");
  if (card && place) place.replaceWith(card);
  else place?.remove();
}
function securityHtml() {
  const me = profileLegacy.me();
  return `<div class="card cfgpanel perfseg"><h2 class="u-p-0-0-4">${icon("shield")} ${t("settingsRest.profile.security")}</h2>
    <p class="sm">${t("settingsRest.profile.securityHint")}</p>
    <div class="perfsegf"><div><span class="sm">${t("settingsRest.profile.accessEmail")}</span><b>${escapeHtml(me.email ?? "")}</b></div><div><span class="sm">${t("settingsRest.profile.role")}</span><b>${escapeHtml(me.rol)}</b></div></div>
    <div class="acts u-start u-wrap"><button class="btn sec" id="perfclave">${icon("key-round")} ${t("settingsRest.profile.sendLink")}</button>
      <button class="btn sec" id="perfsalir">${icon("log-out")} ${t("settingsRest.profile.signOut")}</button></div></div>`;
}
function addSecurity() {
  const container = document.querySelector("#v-perfil .pagcuerpo") ?? (currentScreen() === "config" ? document.querySelector("#v-config #cfgcuerpo-real, #v-config #cfgcuerpo") : null);
  if (!container || container.querySelector(".perfseg")) return;
  container.classList.add("perfil2");
  container.insertAdjacentHTML("beforeend", securityHtml());
  const me = profileLegacy.me(), link = document.getElementById("perfclave");
  if (link) link.onclick = () => {
    void settingsExtraLegacy.withButtonLoading(link, t("settingsRest.profile.sending"), async () => {
      const { error } = await profileLegacy.sendPasswordLink(me.email ?? "");
      notices.toast(error ? t("settingsRest.profile.couldNotSend", { error: error.message ?? "" }) : t("settingsRest.profile.linkSent", { email: me.email ?? "" }), Boolean(error));
    });
  };
  const signOut = document.getElementById("perfsalir");
  if (signOut) signOut.onclick = () => {
    document.querySelector('[data-u="salir"]')?.click();
  };
}
function joinInConfig() {
  const box = document.getElementById("cfgcuerpo");
  if (!box || box.querySelector(".perfuno")) return;
  const person = box.querySelector("#miperfil"), data = [...box.children].find((child) => child.querySelector("#pfn")), security = box.querySelector(".perfseg");
  if (!data) return;
  const joined = document.createElement("div");
  joined.className = "card cfgpanel perfuno";
  joined.innerHTML = '<div class="perfunorow"></div>';
  const row = joined.firstElementChild;
  [person, data].forEach((part) => {
    if (!part) return;
    part.classList.remove("card", "cfgpanel");
    part.classList.add("perfparte");
    row?.appendChild(part);
  });
  if (security) {
    security.classList.remove("card", "cfgpanel");
    security.classList.add("perfparte");
    joined.appendChild(security);
  }
  box.prepend(joined);
}
function paintMyProfile() {
  const box = document.getElementById("cfgcuerpo");
  if (!box) return;
  box.innerHTML = `<div id="perfilcab"></div>
    ${dataCardHtml()}`;
  const ok = document.getElementById("pfok");
  if (ok) ok.onclick = () => {
    void saveData();
  };
  const language = document.getElementById("pfl");
  if (language) language.onchange = () => {
    void changeLanguage(language);
  };
  placePersonCard();
  addSecurity();
  if (currentScreen() === "config") joinInConfig();
}

// src/app/screens/settings/profile/parts.ts
async function paintPreferencesPart(part) {
  await paintPreferences();
  const box = document.getElementById("cfgcuerpo");
  if (!box) return;
  document.getElementById("miperfil")?.remove();
  if (part !== "rutas") return;
  box.querySelectorAll(":scope > p.sm").forEach((paragraph) => {
    paragraph.remove();
  });
  box.insertAdjacentHTML("afterbegin", `<div class="card cfgpanel"><h2>${t("settingsRest.profile.routesTitle")}</h2><p class="sm">${t("settingsRest.profile.routesHint")}</p></div>`);
}
async function saveIndicators(list) {
  const me = profileLegacy.me(), preferences = { ...me.preferencias ?? {}, kpis: list };
  const { data, error } = await legacyDb().rpc("guardar_preferencias", { p: preferences });
  if (error) {
    notices.toast(t("settingsRest.profile.couldNotSaveError", { error: error.message ?? "" }), true);
    return false;
  }
  me.preferencias = data ?? preferences;
  return true;
}

// src/app/screens/settings/notifications/model.ts
var DAY_MS = 864e5;
var WEEK_DAYS = 7;
function dayGroup(isoDate) {
  const date = new Date(isoDate), today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((today.getTime() - new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()) / DAY_MS);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return days < WEEK_DAYS ? "week" : "before";
}
function restockActions(data, id) {
  const phone = data.telefono, out = [];
  if (phone) out.push([t("settingsExtra.notifications.call"), () => {
    location.href = `tel:${String(phone).replace(/\s+/g, "")}`;
  }, true]);
  out.push([t("settingsExtra.notifications.newSale"), () => {
    settingsExtraLegacy.newSale({ contacto_id: data.contacto_id ?? id, cliente: data.nombre, telefono: phone });
  }, !phone]);
  return out;
}
function linkActions(notification, kind, id) {
  if (kind === "pedido" && id) return [[t("settingsExtra.notifications.seeOrder"), () => {
    appLegacy.openOrder(id);
  }, true]];
  if (kind === "ficha" && id) return [[t("settingsExtra.notifications.seeCard"), () => {
    agendaActions.openAccount(id);
  }, true]];
  const link = notification.enlace;
  return link ? [[t("settingsExtra.notifications.open"), () => {
    settingsExtraLegacy.followLink(link);
  }, true]] : [];
}
function actionsOf(notification) {
  const data = notification.datos ?? {}, [kind = "", id = ""] = String(notification.enlace ?? "").split(":");
  const account = data.cuenta_id ?? id;
  if (notification.tipo === "reponer") return restockActions(data, id);
  if (notification.tipo === "caida_ventas") {
    return [[t("settingsExtra.notifications.seeCard"), () => {
      agendaActions.openAccount(account);
    }, true], [t("settingsExtra.notifications.appoint"), () => {
      agendaActions.newAppointment(account, null);
    }, false]];
  }
  if (notification.tipo === "visita_sin_registrar") {
    const visited = data.cuenta_id ?? "";
    return [
      [t("settingsExtra.notifications.recordVisit", { visit: term("visita") }), () => {
        settingsExtraLegacy.recordVisit(visited);
      }, true],
      [t("settingsExtra.notifications.seeCard"), () => {
        agendaActions.openAccount(visited);
      }, false]
    ];
  }
  return linkActions(notification, kind, id);
}
async function removeNotifications(ids, onlyRead) {
  const { data, error } = await legacyDb().rpc("borrar_notificaciones", { p_ids: ids, p_leidas: onlyRead });
  if (error || !data?.ok) {
    notices.toast(t("settingsExtra.notifications.couldNotRemove"), true);
    return false;
  }
  return true;
}

// src/app/screens/settings/notifications/panel.ts
var LEAVE_MS = 220;
var state = { list: [], filter: "" };
var whenOf = (item) => item.visible_desde ?? item.creado_en;
function whenText(item) {
  const date = new Date(whenOf(item)), group = dayGroup(whenOf(item)), locale = t("dates.locale");
  if (group === "today") return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  return group === "yesterday" ? t("settingsExtra.notifications.yesterday") : date.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" });
}
function rowHtml(item) {
  const actions = actionsOf(item).map(([text, , main], index) => `<button type="button" class="btn chico ${main ? "" : "sec"}" data-nacc="${index}">${escapeHtml(text)}</button>`).join("");
  return `<div class="notit2 ${item.leida_en ? "" : "nuevo"}" data-nidx="${state.list.indexOf(item)}">
      <span class="ic" aria-hidden="true">${settingsExtraLegacy.iconOf(item.tipo)}</span>
      <div class="tx"><b>${escapeHtml(item.titulo)}</b>${item.cuerpo ? `<span class="sm">${escapeHtml(item.cuerpo)}</span>` : ""}
        <span class="sm notcuando">${whenText(item)}${item.resumen ? t("settingsExtra.notifications.fromDigest") : ""}</span>
        <div class="notacts">${actions}
          ${item.leida_en ? "" : `<button type="button" class="btn sec chico" data-npos>${t("settingsExtra.notifications.postpone")}</button>`}
          <button type="button" class="notbor" data-nbor aria-label="${t("settingsExtra.notifications.removeOne")}" title="${t("settingsExtra.notifications.remove")}">${settingsExtraLegacy.icon("trash-2")}</button></div></div></div>`;
}
function filterHtml(areas) {
  if (areas.length <= 1) return "";
  return `<div class="segs notfil" role="group" aria-label="${t("settingsExtra.notifications.filter")}">${[["", t("settingsExtra.notifications.all")], ...areas.map((area) => [area[0], area[1]])].map(([key = "", text = ""]) => `<button type="button" data-nfil="${key}" class="${state.filter === key ? "on" : ""}" aria-pressed="${String(state.filter === key)}">${escapeHtml(text)}</button>`).join("")}</div>`;
}
function listHtml(shown) {
  const fresh = shown.filter((item) => !item.leida_en), earlier = shown.filter((item) => item.leida_en);
  return `<div class="notlista2">
      ${fresh.length ? `<h3 class="notdia">${t("settingsExtra.notifications.fresh", { count: fresh.length })}</h3>${fresh.map(rowHtml).join("")}` : ""}
      ${earlier.length ? `<h3 class="notdia">${t("settingsExtra.notifications.earlier")}</h3>${earlier.map(rowHtml).join("")}` : ""}
      ${shown.length ? "" : `<div class="vacio">${t(state.filter ? "settingsExtra.notifications.noneInArea" : "settingsExtra.notifications.none")}</div>`}</div>`;
}
function panelHtml() {
  const unread = settingsExtraLegacy.unread(), list = state.list;
  const areas = settingsExtraLegacy.notificationAreas().filter((area) => list.some((item) => settingsExtraLegacy.areaOf(item.tipo) === area[0]));
  if (state.filter && !areas.some((area) => area[0] === state.filter)) state.filter = "";
  const shown = list.filter((item) => !state.filter || settingsExtraLegacy.areaOf(item.tipo) === state.filter);
  return `<div class="fh"><div><h2>${t("settingsExtra.notifications.title")}</h2><div class="sm">${unread ? t("settingsExtra.notifications.unread", { count: unread }) : t("settingsExtra.notifications.upToDate")}${t("settingsExtra.notifications.lastWeek")}</div></div>
      <span class="acts u-m-0"><button type="button" class="icobtn notcfgb" id="notcfg" title="${t("settingsExtra.notifications.choose")}" aria-label="${t("settingsExtra.notifications.choose")}">${settingsExtraLegacy.icon("settings")}</button>
      <button class="x" data-cerrar aria-label="${t("settingsExtra.notifications.close")}">✕</button></span></div>
    ${filterHtml(areas)}
    ${listHtml(shown)}
    <p class="sm notpie">${t("settingsExtra.notifications.keptFor")}</p>
    <div class="acts u-end u-wrap">
      ${unread ? `<button class="btn sec" id="notleer">${t("settingsExtra.notifications.markAllRead")}</button>` : ""}
      ${list.some((item) => item.leida_en) ? `<button class="btn sec" id="notlimpiar">${t("settingsExtra.notifications.removeRead")}</button>` : ""}
      ${list.length ? `<button class="btn sec dang" id="notvaciar">${t("settingsExtra.notifications.removeAll")}</button>` : ""}</div>`;
}
var dialog = () => document.getElementById("dlg");
var closeAndRefresh = () => {
  dialog()?.close();
  settingsExtraLegacy.refreshBell();
};
var markRead = (id) => legacyDb().rpc("leer_notificacion", { p_id: id });
function drop(items) {
  state.list = state.list.filter((item) => !items.includes(item));
  settingsExtraLegacy.setUnread(Math.max(0, settingsExtraLegacy.unread() - items.filter((item) => !item.leida_en).length));
  paint();
  settingsExtraLegacy.refreshBell();
}
async function postpone(item) {
  const { data } = await legacyDb().rpc("posponer_notificacion", { p_id: item.id });
  if (!data?.ok) {
    notices.toast(t("settingsExtra.notifications.couldNotPostpone"), true);
    return;
  }
  notices.toast(t("settingsExtra.notifications.postponed"));
  drop([item]);
}
async function openItem(item) {
  await markRead(item.id);
  const actions = actionsOf(item), main = actions.find((action) => action[2]) ?? actions[0];
  if (main) {
    closeAndRefresh();
    main[1]();
    return;
  }
  if (item.leida_en) return;
  item.leida_en = (/* @__PURE__ */ new Date()).toISOString();
  settingsExtraLegacy.setUnread(Math.max(0, settingsExtraLegacy.unread() - 1));
  paint();
  settingsExtraLegacy.refreshBell();
}
function bindRow(row) {
  const item = state.list[Number(row.dataset.nidx)];
  if (!item) return;
  const actions = actionsOf(item), stop = (event) => {
    event.stopPropagation();
  };
  row.querySelectorAll("[data-nacc]").forEach((button) => {
    button.onclick = async (event) => {
      stop(event);
      await markRead(item.id);
      closeAndRefresh();
      actions[Number(button.dataset.nacc)]?.[1]();
    };
  });
  const later = row.querySelector("[data-npos]");
  if (later) later.onclick = (event) => {
    stop(event);
    void postpone(item);
  };
  const bin = row.querySelector("[data-nbor]");
  if (bin) bin.onclick = async (event) => {
    stop(event);
    if (!await removeNotifications([item.id], false)) return;
    row.classList.add("notsale");
    setTimeout(() => {
      drop([item]);
    }, LEAVE_MS);
  };
  row.onclick = () => {
    void openItem(item);
  };
}
async function markAllRead() {
  await legacyDb().rpc("leer_notificaciones", {});
  const now = (/* @__PURE__ */ new Date()).toISOString();
  state.list.forEach((item) => {
    if (!item.leida_en) item.leida_en = now;
  });
  settingsExtraLegacy.setUnread(0);
  paint();
  settingsExtraLegacy.refreshBell();
}
async function removeAll() {
  const choice = await notices.choose(
    t("settingsExtra.notifications.removeAllTitle"),
    t("settingsExtra.notifications.removeAllText"),
    [{ k: "no", t: t("settingsExtra.templates.cancel"), cls: "sec" }, { k: "si", t: t("settingsExtra.notifications.removeAll") }]
  );
  if (choice === "si" && await removeNotifications(null, false)) {
    notices.toast(t("settingsExtra.notifications.removed"));
    closeAndRefresh();
  }
}
function bind(body) {
  body.querySelectorAll("[data-nfil]").forEach((button) => {
    button.onclick = () => {
      state.filter = button.dataset.nfil ?? "";
      paint();
    };
  });
  body.querySelectorAll(".notit2").forEach(bindRow);
  const on = (id, action) => {
    const button = document.getElementById(id);
    if (button) button.onclick = action;
  };
  on("notleer", () => {
    void markAllRead();
  });
  on("notlimpiar", () => {
    void (async () => {
      if (await removeNotifications(null, true)) {
        notices.toast(t("settingsExtra.notifications.readRemoved"));
        drop(state.list.filter((item) => item.leida_en));
      }
    })();
  });
  on("notvaciar", () => {
    void removeAll();
  });
  on("notcfg", () => {
    dialog()?.close();
    settingsExtraLegacy.openNotificationSettings();
  });
}
function paint() {
  const body = document.getElementById("dbody");
  if (!body) return;
  body.innerHTML = panelHtml();
  bind(body);
}
function showNotifications(list) {
  state.list = [...list ?? []];
  paint();
  const box = dialog();
  if (box && !box.open) box.showModal();
}

// src/app/screens/settings/texts/menu-names.ts
var CONTACTS = "directorio";
var HIDDEN = ["config", "delcos", "manual"];
var MAX_LENGTH = 30;
var brand = () => settingsExtraLegacy.setting("marca") ?? {};
var contactsDefault = () => term("medico", { number: "p", capital: "C" });
var contactsLabel = () => (brand().etiqueta ?? "") !== contactsDefault() ? brand().etiqueta ?? "" : "";
function menuRows() {
  const names = settingsExtraLegacy.menuNames(), seen = /* @__PURE__ */ new Set(), excluded = settingsExtraLegacy.menuExcluded();
  return [...document.querySelectorAll("nav.main [data-t]")].filter((button) => {
    const module = button.dataset.t ?? "";
    if (seen.has(module) || excluded.includes(module) || HIDDEN.includes(module) || button.classList.contains("hide")) return false;
    seen.add(module);
    return true;
  }).map((button) => {
    const module = button.dataset.t ?? "", current = settingsExtraLegacy.menuText(button)?.get();
    const byDefault = module === CONTACTS ? contactsDefault() : orFallback(button.dataset.txdef, orFallback(current, module));
    return { module, byDefault, value: module === CONTACTS ? contactsLabel() : names[module] ?? "" };
  });
}
function rowHtml2(row) {
  return `<div class="txmf" role="row"><span class="txmico" role="cell">${settingsExtraLegacy.moduleIcon(row.module) ?? "•"}</span><span role="cell" class="txmdef">${escapeHtml(row.byDefault)}</span>
      <span role="cell"><input data-txm="${row.module}" value="${escapeHtml(row.value)}" placeholder="${escapeHtml(row.byDefault)}" maxlength="${MAX_LENGTH}" aria-label="${escapeHtml(t("settingsExtra.menuNames.nameOf", { name: row.byDefault }))}"></span></div>`;
}
async function saveContactsLabel(label) {
  const value2 = { ...brand(), etiqueta: label || contactsDefault() };
  const { data, error } = await legacyDb().rpc("guardar_ajuste", { p_clave: "marca", p_valor: value2 });
  if (!error && data?.ok !== false) {
    settingsExtraLegacy.setSetting("marca", value2);
    settingsExtraLegacy.applyLabel();
  }
}
async function save2() {
  const box = document.getElementById("cfgcuerpo");
  if (!box) return;
  const names = {}, read2 = { contacts: null };
  box.querySelectorAll("[data-txm]").forEach((input) => {
    const value2 = input.value.trim(), module = input.dataset.txm ?? "";
    if (module === CONTACTS) read2.contacts = value2;
    else if (value2) names[module] = value2;
  });
  const { data, error } = await legacyDb().rpc("guardar_ajuste", { p_clave: "menu_nombres", p_valor: names });
  if (error || data?.ok === false) {
    notices.toast(t("settingsExtra.menuNames.couldNotSave"), true);
    return;
  }
  settingsExtraLegacy.setSetting("menu_nombres", names);
  if (read2.contacts !== null && read2.contacts !== contactsLabel()) await saveContactsLabel(read2.contacts);
  settingsExtraLegacy.applyMenuNames();
  notices.toast(t("settingsExtra.menuNames.saved"));
}
async function paintMenuNames() {
  await settingsExtraLegacy.loadSettings();
  const rows = menuRows(), box = document.getElementById("cfgcuerpo");
  if (!box) return;
  const help = settingsExtraLegacy.helpButton(t("settingsExtra.menuNames.title"), t("settingsExtra.menuNames.help"));
  box.innerHTML = `<div class="card cfgpanel txmenu"><h2>${t("settingsExtra.menuNames.title")} ${help}</h2>
    <div class="txmtab" role="table"><div class="txmf txmcab" role="row"><span></span><span role="columnheader">${t("settingsExtra.menuNames.module")}</span><span role="columnheader">${t("settingsExtra.menuNames.companyName")}</span></div>
    ${rows.map(rowHtml2).join("")}</div>
    <div class="acts"><button type="button" class="btn" id="txmok">${t("settingsExtra.menuNames.save")}</button></div></div>`;
  const ok = document.getElementById("txmok");
  if (ok) ok.onclick = () => {
    void settingsExtraLegacy.withButtonLoading(ok, t("settingsExtra.menuNames.saving"), () => save2());
  };
}

// src/app/screens/settings/audit/audit.ts
var LIMIT = 500;
var ADDED = "Alta";
var REMOVED = "Baja";
var keyed = (key) => () => t(key);
var ENTITIES = /* @__PURE__ */ new Map([
  ["cuentas", () => term("medico", { capital: "C" })],
  ["ubicaciones", () => term("consulta", { capital: "C" })],
  ["actividades", () => term("visita", { capital: "C" })],
  ["atribuciones", keyed("settings.audit.portfolio")],
  ["agenda", keyed("settings.audit.appointment")],
  ["rutas", keyed("settings.audit.route")],
  ["pedidos", keyed("settings.audit.order")],
  ["perfiles", keyed("settings.audit.userEntity")],
  ["productos", keyed("settings.audit.product")],
  ["contactos", () => term("paciente", { capital: "C" })]
]);
var entityName = (entity) => ENTITIES.get(entity)?.() ?? entity;
function frameHtml(users) {
  return `<h2>${t("settings.audit.title")}<span class="n" id="audn">…</span></h2>
    <p class="sm">${t("settings.audit.hint")}</p>
    <div class="filtros" style="border:0;padding:10px 16px">
      <div id="audper"></div>
      <div><label for="ausr">${t("settings.audit.user")}</label><select id="ausr"><option value="">${t("settings.audit.all")}</option>
        ${users.map((user) => `<option value="${user.id}">${escapeHtml(user.nombre)}</option>`).join("")}</select></div>
      <div><label for="aent">${t("settings.audit.entity")}</label><select id="aent"><option value="">${t("settings.audit.allEntities")}</option>
        ${[...ENTITIES.keys()].map((key) => `<option value="${key}">${entityName(key)}</option>`).join("")}</select></div></div>
    <div id="auddes"></div>
    <div class="lista" id="audlista"></div>`;
}
var iconClass = (action) => action === REMOVED ? "w" : action === ADDED ? "o" : "";
var iconText = (action) => action === ADDED ? "+" : action === REMOVED ? "−" : "✎";
var when = (date) => new Date(date).toLocaleString("es", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
function rowHtml3(entry) {
  return `<div class="item u-cursor-default">
      <span class="ic ${iconClass(entry.accion)}">${iconText(entry.accion)}</span>
      <span class="tx"><b>${escapeHtml(entry.accion)} · ${escapeHtml(entityName(entry.entidad))}</b>
        <span class="sm">${escapeHtml(entry.usuario)} · ${when(entry.creado_en)}</span>
        <span class="sm">${escapeHtml(cardSectionsLegacy.detailSummary(entry.detalle))}</span></span>${settingsLegacy.undoable(entry) ? `<button type="button" class="btn sec" data-audx="${entry.id}">${t("settings.audit.undo")}</button>` : ""}</div>`;
}
var selected = (id) => document.getElementById(id);
var chosen = (id) => selected(id)?.value ?? "";
function read(period) {
  return callRpc("auditoria_lista", { p_entidad: chosen("aent") || null, p_usuario: chosen("ausr") || null, p_desde: period.desde, lim: LIMIT });
}
function bindUndo(list, period) {
  list.querySelectorAll("[data-audx]").forEach((button) => {
    button.onclick = () => {
      cardSectionsLegacy.undo(Number(button.dataset.audx), () => {
        void paintList();
      });
    };
  });
  const user = selected("ausr");
  settingsLegacy.undoPersonBox(document.getElementById("auddes"), {
    userId: chosen("ausr"),
    from: period.desde,
    name: user?.selectedOptions[0]?.textContent ?? "",
    then: () => {
      void paintList();
    }
  });
}
async function paintList() {
  settingsLegacy.showLoading(document.getElementById("audlista"), t("settings.audit.filtering"));
  const period = settingsLegacy.periodRange(document.getElementById("audper"));
  const { data } = await read(period);
  const count = document.getElementById("audn"), list = document.getElementById("audlista");
  if (!count || !list) return;
  const until = period.hasta;
  const entries = (data ?? []).filter((entry) => !until || String(entry.creado_en).slice(0, 10) <= until);
  count.textContent = formatNumber(entries.length) + (entries.length === LIMIT ? "+" : "");
  list.innerHTML = entries.map(rowHtml3).join("") || `<div class="vacio">${t("settings.audit.empty")}</div>`;
  bindUndo(list, period);
}
async function paintAudit() {
  settingsLegacy.showLoading(document.getElementById("admcuerpo"), t("settings.audit.loading"));
  const { data: users } = await legacyDb().rpc("usuarios_lista");
  const sorted = (users ?? []).slice().sort((first, second) => String(first.nombre).localeCompare(String(second.nombre), "es"));
  const box = document.getElementById("admcuerpo");
  if (!box) return;
  box.innerHTML = frameHtml(sorted);
  settingsLegacy.mountPeriod(document.getElementById("audper"), { id: "auditoria", valor: "7d", alCambiar: () => {
    void paintList();
  } });
  for (const id of ["ausr", "aent"]) {
    const select = selected(id);
    if (select) select.onchange = () => {
      void paintList();
    };
  }
  void paintList();
}

// src/app/screens/settings/audit/billing-log.ts
var LIMIT2 = 200;
var when2 = (date) => new Date(date).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
var rowHtml4 = (event) => `<div class="dr u-cursor-default"><span>${when2(event.fecha)}</span><span><b>${escapeHtml(event.tipo)}</b></span>
      <span>${escapeHtml(orFallback(event.numero, "—"))}</span><span>${escapeHtml(orFallback(event.usuario, "—"))}</span><span class="sm corta">${escapeHtml(settingsLegacy.billingEventDetail(event.detalle))}</span></div>`;
async function paintBillingLog() {
  settingsLegacy.showLoading(document.getElementById("fcuerpo"), t("settings.billingLog.loading"));
  const { data } = await callRpc("eventos_facturacion_lista", { lim: LIMIT2 });
  const box = document.getElementById("fcuerpo");
  if (!box) return;
  const head = [t("settings.billingLog.date"), t("settings.billingLog.event"), t("settings.billingLog.invoice"), t("settings.billingLog.person"), t("settings.billingLog.detail")];
  box.innerHTML = `<div class="panel"><div class="cuenta">${t("settings.billingLog.intro")}</div>
    <div class="dgrid-wrap"><div class="dgrid evs"><div class="dh">${head.map((title) => `<span>${title}</span>`).join("")}</div>
    ${(data ?? []).map(rowHtml4).join("") || `<div class="vacio">${t("settings.billingLog.empty")}</div>`}
    </div></div></div>`;
}

// src/app/screens/settings/classifiers/new-classifier.ts
var value = (id) => document.getElementById(id)?.value ?? "";
function groups() {
  const own = settingsLegacy.classifiers().map((classifier) => orFallback(classifier.grupo, t("settings.classifiers.general")));
  return [.../* @__PURE__ */ new Set([...own, term("medico", { number: "p", capital: "C" }), term("visita", { number: "p", capital: "C" }), t("settings.classifiers.sales"), t("settings.classifiers.general")])];
}
function areasHtml() {
  return `<option value="medico">${t("settings.newClassifier.onAccount", { ofTheProfessional: term("medico", { article: "del" }) })}</option>
          <option value="visita">${t("settings.newClassifier.onVisit", { aVisit: term("visita", { article: "un" }) })}</option>
          <option value="pedido">${t("settings.newClassifier.onOrder")}</option>
          <option value="cliente">${t("settings.newClassifier.onCustomer", { ofTheCustomer: term("paciente", { article: "del" }) })}</option>
          <option value="producto">${t("settings.newClassifier.onProduct")}</option>`;
}
function valuesHtml(values) {
  return values.map((item, index) => `<div class="g2" style="grid-template-columns:minmax(0,1fr) auto;margin-bottom:6px">
        <input data-ncv="${index}" value="${escapeHtml(item)}" placeholder="${t("settings.newClassifier.valuePlaceholder", { index: index + 1 })}">
        ${values.length > 1 ? `<button type="button" class="btn sec" data-ncx="${index}">✕</button>` : ""}</div>`).join("");
}
function formHtml(values) {
  return `
      <div class="fh"><div><h2>${t("settings.newClassifier.title")}</h2>
        <div class="sm">${t("settings.newClassifier.subtitle", { visits: term("visita", { number: "p" }) })}</div></div>
        <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>
      <div class="g2">
        <div><label for="ncn2">${t("settings.newClassifier.name")}</label><input id="ncn2" placeholder="${t("settings.newClassifier.namePlaceholder")}"></div>
        <div><label for="ncg">${t("settings.newClassifier.group")}</label><select id="ncg">${groups().map((group) => `<option>${escapeHtml(group)}</option>`).join("")}</select></div>
      </div>
      <div class="g2">
        <div><label for="nca">${t("settings.newClassifier.where")}</label><select id="nca">
          ${areasHtml()}</select></div>
        <div><label for="ncd">${t("settings.newClassifier.description")}</label><input id="ncd" placeholder="${t("settings.newClassifier.descriptionPlaceholder")}"></div>
      </div>
      <label>${t("settings.newClassifier.values")}</label>
      <div id="ncv">${valuesHtml(values)}</div>
      <div class="acts"><button type="button" class="btn sec" id="ncmas">${t("settings.newClassifier.addValue")}</button></div>
      <div class="acts u-end">
        <button class="btn sec" data-cerrar>${t("settings.newClassifier.cancel")}</button>
        <button class="btn" id="ncok2">${t("settings.newClassifier.create")}</button></div>`;
}
async function create(values, button, onCreated) {
  const name = value("ncn2").trim();
  if (!name) {
    notices.toast(t("settings.newClassifier.nameIt"), true);
    return;
  }
  button.disabled = true;
  const { data: result } = await legacyDb().rpc("crear_clasificador", { p: {
    nombre: name,
    grupo: value("ncg"),
    ambito: value("nca"),
    descripcion: value("ncd").trim(),
    valores: values.map((item) => item.trim()).filter(Boolean)
  } });
  button.disabled = false;
  if (result?.ok === false) {
    notices.toast(t("settings.newClassifier.noPermission"), true);
    return;
  }
  document.getElementById("dlg")?.close();
  notices.toast(t("settings.newClassifier.created"));
  onCreated();
  settingsLegacy.reloadCatalogs();
}
function paint2(values, onCreated) {
  const body = document.getElementById("dbody");
  if (!body) return;
  body.innerHTML = formHtml(values);
  const read2 = () => [...body.querySelectorAll("#ncv [data-ncv]")].map((input) => input.value);
  const more = document.getElementById("ncmas");
  if (more) more.onclick = () => {
    paint2([...read2(), ""], onCreated);
  };
  body.querySelectorAll("[data-ncx]").forEach((button) => {
    button.onclick = () => {
      const list = read2();
      list.splice(Number(button.dataset.ncx), 1);
      paint2(list, onCreated);
    };
  });
  const ok = document.getElementById("ncok2");
  if (ok) ok.onclick = () => {
    void create(read2(), ok, onCreated);
  };
}
function newClassifier(onCreated) {
  paint2([""], onCreated);
  document.getElementById("dlg")?.showModal();
}

// src/app/screens/settings/classifiers/list.ts
var SHOWN_VALUES = 5;
var EDIT_LEVEL = 2;
var FULL_LEVEL = 3;
var ADMINISTER = "administrar";
var AREA = "K";
var folded = /* @__PURE__ */ new Set();
var level = () => settingsLegacy.user().areas?.[AREA] ?? 0;
function cardHtml2(classifier, canEdit) {
  const active = classifier.n_activos, values = (classifier.valores ?? []).filter((value2) => value2.activo).slice(0, SHOWN_VALUES);
  return `<button class="cat-card" data-cat="${classifier.id}">
            <span class="cat-h"><b>${escapeHtml(classifier.nombre)}</b>
              ${classifier.sistema ? `<span class="tagsis">${t("settings.classifiers.system")}</span>` : ""}
              ${canEdit ? "" : `<span class="tagro" title="${t("settings.classifiers.readOnlyTitle")}">🔒</span>`}</span>
            <span class="sm">${active} ${t(active === 1 ? "settings.classifiers.oneActive" : "settings.classifiers.activeValues")}${classifier.descripcion ? ` · ${escapeHtml(classifier.descripcion)}` : ""}</span>
            <span class="cat-v">${values.map((value2) => `<span class="chip">${escapeHtml(value2.valor)}</span>`).join("")}
              ${active > SHOWN_VALUES ? `<span class="sm">+${active - SHOWN_VALUES}</span>` : ""}</span>
          </button>`;
}
function groupHtml(group, list, canEdit) {
  const closed = folded.has(group);
  return `
      <div class="grupo">
        <button class="grupoh" data-grupo="${escapeHtml(group)}">
          <span>${closed ? "▸" : "▾"} <b>${escapeHtml(group)}</b>
            <span class="sm">${list.length} ${t(list.length === 1 ? "settings.classifiers.oneClassifier" : "settings.classifiers.classifiers")}</span></span></button>
        <div class="grupoc ${closed ? "hide" : ""}">
          ${list.map((classifier) => cardHtml2(classifier, canEdit)).join("")}
        </div></div>`;
}
function byGroup(list) {
  const groups2 = /* @__PURE__ */ new Map();
  for (const classifier of list) {
    const group = orFallback(classifier.grupo, t("settings.classifiers.general"));
    groups2.set(group, [...groups2.get(group) ?? [], classifier]);
  }
  return groups2;
}
async function paintClassifiers() {
  settingsLegacy.showLoading(document.getElementById("cfgcuerpo"), t("settings.classifiers.loading"));
  const { data } = await legacyDb().rpc("catalogos_todos");
  settingsLegacy.setClassifiers(data ?? []);
  const box = document.getElementById("cfgcuerpo");
  if (!box) return;
  const administers = cardSectionsLegacy.can(ADMINISTER), canEdit = administers || level() >= EDIT_LEVEL, full = administers || level() >= FULL_LEVEL;
  box.innerHTML = `
    <div class="dayhead2"><p class="sm">${t("settings.classifiers.intro", { visits: term("visita", { number: "p" }) })}
      ${canEdit ? "" : `<b>${t("settings.classifiers.readOnly")}</b>`}</p>
      ${full ? `<button class="btn" id="cnuevo">${t("settings.classifiers.newClassifier")}</button>` : ""}</div>
    ${[...byGroup(settingsLegacy.classifiers())].map(([group, list]) => groupHtml(group, list, canEdit)).join("")}`;
  box.querySelectorAll("[data-grupo]").forEach((button) => {
    button.onclick = () => {
      const group = button.dataset.grupo ?? "";
      if (folded.has(group)) folded.delete(group);
      else folded.add(group);
      void paintClassifiers();
    };
  });
  box.querySelectorAll("[data-cat]").forEach((button) => {
    button.onclick = () => {
      settingsLegacy.openClassifier(button.dataset.cat ?? "");
    };
  });
  const add = document.getElementById("cnuevo");
  if (add) add.onclick = () => {
    newClassifier(() => {
      void paintClassifiers();
    });
  };
}

// src/app/screens/settings/test-environment/index.ts
var WATCH_MS = 2e4;
var RELOAD_MS = 800;
var ADMINISTER2 = "administrar";
var REQUESTED = "pedido";
var COPYING = "copiando";
var FAILED = "error";
var DONE = "ok";
var watcher = null;
var running = (environment) => [REQUESTED, COPYING].includes(environment.refresco_estado ?? "");
function statusText(environment) {
  if (running(environment)) return t(environment.refresco_estado === REQUESTED ? "settings.testEnvironment.copyingStarting" : "settings.testEnvironment.copyingRunning");
  if (environment.refresco_estado === FAILED) return t("settings.testEnvironment.copyFailed") + (environment.refresco_error ? `: ${environment.refresco_error}` : "");
  return environment.refresco_error ? `· ${environment.refresco_error}` : "";
}
function watch() {
  watcher = setInterval(() => {
    void refreshStatus().then((environment) => {
      if (!environment || running(environment)) return;
      if (watcher) clearInterval(watcher);
      watcher = null;
      if (environment.refresco_estado === DONE) {
        notices.toast(t("settings.testEnvironment.copied"));
        settingsLegacy.clearLocalData();
        setTimeout(() => {
          location.reload();
        }, RELOAD_MS);
      } else notices.toast(t("settings.testEnvironment.copyFailedToast"), true);
    });
  }, WATCH_MS);
}
async function refreshStatus() {
  const { data: environment } = await settingsLegacy.testEnvironment().select("*").eq("id", 1).single();
  const line = document.getElementById("prrefresco");
  if (!line || !environment) return null;
  line.textContent = statusText(environment);
  line.classList.toggle("falta", environment.refresco_estado === FAILED);
  const bring = document.getElementById("prtraer");
  if (bring) bring.disabled = running(environment);
  if (running(environment) && !watcher) watch();
  return environment;
}
async function startCopy() {
  const { data, error } = await settingsLegacy.edgeFunctions().invoke("refrescar-pruebas", { body: {} });
  let result = data;
  const answer = error?.context?.json;
  if (answer) {
    try {
      result = await answer();
    } catch {
    }
  }
  return { result, failed: Boolean(error) };
}
async function bringProduction(button) {
  if (!await notices.confirm(t("settings.testEnvironment.askText"), { titulo: t("settings.testEnvironment.askTitle"), ok: t("settings.testEnvironment.askOk"), peligro: true })) return;
  if (button) button.disabled = true;
  const { result, failed } = await startCopy();
  if (!result?.ok) {
    if (button) button.disabled = false;
    const reason = result?.motivo ? settingsLegacy.refreshReason(result.motivo) : void 0;
    notices.toast(reason ?? t("settings.testEnvironment.couldNotStart") + (failed && !result ? t("settings.testEnvironment.missingFunction") : ""), true);
    return;
  }
  notices.toast(t("settings.testEnvironment.started"));
  void refreshStatus();
}
var when3 = (date) => date ? new Date(date).toLocaleString("es", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
function pageHtml(environment, allowed) {
  const actions = allowed ? `<div class="acts u-start u-wrap">
        <button type="button" class="btn" id="prtraer">${t("settings.testEnvironment.bring")}</button>
        <button type="button" class="btn sec" id="prreset">${t("settings.testEnvironment.reset")}</button></div>
      <p class="leer">${t("settings.testEnvironment.explain")}</p>` : `<p class="sm u-p-0-16">${t("settings.testEnvironment.onlyResponsible")}</p>`;
  return `<div class="card" id="cfpruebas"><div class="fh"><div><h2>${t("settings.testEnvironment.title")}</h2>
      <div class="sm">${t("settings.testEnvironment.subtitle")}</div></div></div>
    <div class="minis">
      <div><b>${when3(environment?.maestro_guardado_en)}</b><span>${t("settings.testEnvironment.startData")}</span></div>
      <div><b>${when3(environment?.ultimo_reset)}</b><span>${t("settings.testEnvironment.lastReset")}</span></div></div>
    <div class="sm u-p-0-16" id="prrefresco"></div>
    ${actions}</div>`;
}
async function paintTestEnvironment() {
  const box = document.getElementById("cfgcuerpo");
  if (!box) return;
  box.innerHTML = `<div class="card">${settingsLegacy.skeletonCard(t("settings.testEnvironment.loading"))}</div>`;
  const [{ data: environment }, { data: canReset, error }] = await Promise.all([
    settingsLegacy.testEnvironment().select("*").eq("id", 1).maybeSingle(),
    callRpc("pruebas_puede_restablecer", {})
  ]);
  if (!document.getElementById("cfgcuerpo")) return;
  const allowed = cardSectionsLegacy.can(ADMINISTER2) && (error ? true : canReset === true);
  box.innerHTML = pageHtml(environment, allowed);
  const bring = document.getElementById("prtraer");
  if (bring) bring.onclick = () => {
    void bringProduction(bring);
  };
  const reset = document.getElementById("prreset");
  if (reset) reset.onclick = () => {
    settingsLegacy.resetTestData();
  };
  void refreshStatus();
}
export {
  bringProduction,
  newClassifier,
  paintAudit,
  paintBillingLog,
  paintClassifiers,
  paintMenuNames,
  paintMyProfile,
  paintPreferences,
  paintPreferencesPart,
  paintProfile,
  paintTestEnvironment,
  refreshStatus,
  saveIndicators,
  showNotifications
};
