// delcos-shared:src/app/i18n/index.ts
var shared = globalThis["__delcosModules"]["i18n/index"];
var pick = (name) => shared[name];
var registerMessages = /* @__PURE__ */ pick("registerMessages");
var t = /* @__PURE__ */ pick("t");

// src/app/i18n/es/chunks/platform/platform.ts
var platform = {
  orgs: {
    title: "Organizaciones",
    subtitle: "Cada empresa trabaja aislada, con sus datos, sus usuarios, su numeración y su configuración.",
    new: "+ Nueva organización",
    couldNotLoad: "No se han podido cargar: {error}",
    noNif: "Sin NIF",
    counts: " · {users} usuarios · {accounts} cuentas",
    pending: " · pendiente de registro: {email}",
    domainList: "Dominios: {domains}",
    noDomain: "Sin dominio propio: su pantalla de acceso muestra la marca de delcos",
    domains: "Dominios",
    extras: "Extras",
    inside: "Estás dentro",
    enter: "Entrar",
    plan: "Plan",
    download: "Descargar datos",
    delete: "Borrar empresa",
    deleteOk: "Borrar",
    deactivate: "Desactivar",
    reactivate: "Volver a activar",
    domainsText: "Dominios desde los que se entra a {name}, separados por comas (p. ej. app.empresa.com). Su pantalla de acceso mostrará su nombre y su logo. Déjalo vacío para quitar todos.",
    domainsTitle: "Dominios de la organización",
    noPermission: "No tienes permiso",
    badDomain: "«{domain}» no es un dominio válido",
    domainInUse: "Ese dominio ya es de {organization}",
    gone: "La organización ya no existe",
    domainsFailed: "No se han podido guardar los dominios",
    domainsSaved: "Dominios guardados",
    domainsRemoved: "Dominios quitados",
    preparing: "Preparando…",
    downloadFailed: "No se han podido descargar sus datos",
    downloaded: "Datos descargados",
    invoicesNoDelete: "{name} tiene facturas emitidas: no se puede borrar (VeriFactu). Desactívala en su lugar.",
    deleteText: "Se borrarán {name} y todos sus datos ({users} usuarios, {accounts} cuentas, pedidos, agenda…). No se puede deshacer: descarga antes sus datos si hay que entregárselos. Escribe su nombre para confirmarlo.",
    nameMismatch: "El nombre no coincide: no se ha borrado nada",
    mainNotDeleted: "La organización principal no se puede borrar",
    onlyTrial: "Solo se borran empresas de prueba o desactivadas",
    hasInvoices: "Tiene facturas emitidas: no se puede borrar",
    deleteFailed: "No se ha podido borrar",
    deleted: "{name} borrada",
    deleteUsersToo: ". Borra sus usuarios en Supabase → Authentication.",
    reactivateText: "Sus {users} usuarios podrán volver a entrar.",
    deactivateText: "Sus {users} usuarios no podrán entrar hasta que la vuelvas a activar. Sus datos no se tocan.",
    reactivateTitle: "¿Volver a activar {name}?",
    deactivateTitle: "¿Desactivar {name}?",
    mainNotDeactivated: "La organización principal no se puede desactivar",
    notFound: "No se encuentra esa empresa",
    toggleFailed: "No se ha podido cambiar",
    reactivated: "{name} vuelve a estar activa",
    deactivated2: "{name} desactivada",
    enterText: "Vas a ver la plataforma como {name}: sus datos, su configuración y su plan. Lo que cambies se guarda en su empresa y queda registrado. Para volver, «Salir» en la franja de arriba.",
    enterTitle: "Entrar en {name}",
    onlyAdmin: "Solo el Administrador de delcos puede entrar",
    couldNotEnter: "No se ha podido entrar"
  },
  extras: {
    title: "Extras de {name}",
    opportunitiesText: "Registro de cada venta, se cierre con pedido o no: día y hora, qué producto y cuántas unidades quería, su {professional} de referencia y cómo llegó, con sus métricas.",
    portalTitle: "Portal {ofProfessional}",
    portalText: "En su portal, cifras agregadas de {orders} (sin datos de personas), pedir material y escribir dudas a su comercial.",
    couldNotSave: "No se han podido guardar los extras",
    saved: "Extras guardados"
  },
  newOrg: {
    title: "Nueva organización",
    subtitle: "Nace con los roles, catálogos, series y ajustes de partida de la plataforma",
    name: "Nombre de la empresa",
    nif: "NIF",
    plan: "Plan",
    users: "Usuarios contratados",
    payment: "Pago",
    monthly: "Mensual",
    yearly: "Anual",
    trial: "Empresa de prueba (30 días)",
    admin: "Su administrador",
    adminName: "Nombre",
    adminEmail: "Correo",
    password: "Contraseña temporal",
    create: "Crear organización",
    creating: "Creando…",
    complete: "Completa el nombre, el administrador, su correo y la contraseña",
    noName: "Falta el nombre",
    badEmail: "El correo no es válido",
    emailTaken: "Ese correo ya tiene usuario",
    failed: "No se ha podido crear: {reason}",
    noUser: "Organización creada, pero no su usuario: {error}. Queda invitado: puede registrarse con ese correo.",
    created: '<b class="u-ok">Organización creada.</b> Usuario de {email} con contraseña temporal <b>{password}</b>. Pásasela y que la cambie al entrar.'
  },
  plan: {
    title: "Plan de {name}",
    subtitle: "Solo la plataforma cambia el plan de una empresa",
    noLimit: "Sin límite",
    state: "Estado",
    paid: "De pago",
    trial: "Prueba",
    trialUntil: "Prueba hasta",
    commitment: "Compromiso hasta (A medida)",
    commitmentHint: "Antes de esa fecha no se puede bajar de A medida.",
    stripe: "Esta empresa paga con Stripe: este cambio no se pasa a Stripe. Para que cuadre el cobro, cámbialo también allí.",
    save: "Guardar plan",
    committed: "Tiene compromiso A medida hasta el {date}: no se puede bajar antes.",
    willLose: "Al pasar a {plan} dejará de tener:",
    minimum: "Mínimo 3 usuarios (salvo A medida)",
    noTrialEnd: "Falta la fecha de fin de la prueba",
    invalid: "Plan no válido",
    committedUntil: "Tiene compromiso A medida hasta el {date}",
    couldNotSave: "No se ha podido guardar",
    saved: "Plan guardado"
  },
  errors: {
    program: "Error de programa",
    database: "Error de base de datos",
    report: "Reporte de usuario",
    time: "vez",
    times: "veces",
    person: "persona",
    people: "personas",
    last: "última {date}",
    solvedAuto: " · resuelto solo en {version}",
    solvedIn: " · resuelto en {version}",
    details: "Versiones y detalle técnico",
    versions: "Versiones: {versions} · primera {date}",
    groupState: "Estado del grupo",
    platformTitle: "Errores de la plataforma",
    platformText: "Los errores iguales van juntos. Al marcar un grupo como resuelto queda apuntada la versión; si vuelve a salir en esa versión o en una posterior, se reabre solo. «Descargar» guarda el archivo para quien da soporte técnico.",
    couldNotRead: "No se ha podido leer el registro: {error}",
    open: "Sin resolver",
    solved: "Resueltos",
    all: "Todos",
    lastDays: "Últimos {days} días",
    download: "Descargar",
    noneOpen: "No hay errores sin resolver en este periodo.",
    none: "Sin errores con estos filtros.",
    groupSolved: "Grupo resuelto: si vuelve a salir, se reabre solo",
    stateChanged: "Estado actualizado",
    couldNotChange: "No se ha podido cambiar",
    companyTitle: "Errores y reportes",
    companyText: "Errores que se producen al usar la plataforma y problemas que reportan las personas. Descarga el archivo para enviárselo a quien da soporte técnico.",
    allKinds: "Todos los tipos",
    allStates: "Todos los estados",
    view: "Ver",
    byError: "Por error",
    byVersion: "Por versión",
    versionTitle: "Versión {version} · {count} errores distintos"
  },
  errorCode: {
    show: "Ver en el código",
    loading: "Leyendo el mapa del código…",
    noStack: "Este error no guardó dónde ocurrió.",
    otherVersion: "El error es de la versión {version} y el mapa del código solo sirve para la versión publicada ahora ({current}).",
    notMinified: "La pila no apunta al código publicado (min/app.js o min/chunks): ya se lee tal cual arriba.",
    noMap: "No se ha podido leer el mapa del código: {error}",
    unmapped: "(sin correspondencia)"
  },
  billing: {
    all: "Todas",
    attention: "Requieren atención",
    upToDate: "Al día",
    trial: "En prueba",
    unpaid: "Impago",
    company: "Empresa",
    plan: "Plan",
    state: "Estado",
    perMonth: "Al mes",
    pending: "Pendiente",
    empty: "No hay empresas en este grupo.",
    leaving: "Se da de baja al final del periodo",
    planned: "Cambio previsto a {plan}",
    plannedUsers: " · {users} usuarios",
    plannedOn: " el {date}",
    commitment: "Compromiso hasta el {date}",
    activeUsers: "{count} usuarios activos",
    fromWeb: " · alta desde la web",
    hired: "{count} contratados · ",
    yearly: "anual",
    monthly: "mensual",
    seeInStripe: "Ver en Stripe",
    couldNotRead: "No se han podido leer: {error}",
    kpiUpToDate: "al día",
    kpiTrial: "en prueba",
    kpiUnpaid: "con impago",
    kpiLeaving: "se dan de baja",
    kpiIncome: "cobro mensual estimado (sin IVA)",
    footer: "El estado llega solo desde Stripe con cada cobro. Las devoluciones y los datos de la tarjeta se miran en Stripe."
  },
  signups: {
    half: "A medias",
    halfText: "No terminó el pago · {ago}",
    inside: "Dentro",
    insideText: "Ya ha entrado en delcos",
    invited: "Invitada",
    invitedText: "Invitación enviada {ago}",
    noInvitation: "Falta la invitación",
    noName: "Sin nombre",
    plan: "{plan} · {users} usuarios · {payment}",
    started: "empezó el {date}",
    kpiDone: "completadas (90 días)",
    kpiInside: "ya han entrado",
    kpiHalf: "a medias (7 días)",
    kpiWeek: "esta semana",
    halfHelp: "Rellenaron el formulario pero no terminaron de poner la tarjeta. Puede valer la pena escribirles. Se borran solas a los 7 días.",
    completed: "Completadas",
    none: "Todavía no hay altas completadas desde la web."
  },
  requests: {
    title: "Solicitudes de las empresas",
    subtitle: "Presupuestos A medida y conversaciones sobre el contrato. Llegan también como aviso. Cambia el estado cuando las atiendas: la empresa lo ve en su Plan.",
    contract: "Contrato A medida",
    quote: "Presupuesto A medida",
    program: "Programa: {program}",
    users: "{count} usuarios",
    portal: " · {count} con portal",
    byEmail: "Por correo",
    byPhone: "Por teléfono",
    byVideo: "Videollamada",
    state: "Estado",
    notePlaceholder: "Nota interna (qué se ha hablado, próximos pasos…)",
    none: "Todavía no ha llegado ninguna solicitud.",
    saved: "Solicitud actualizada",
    couldNotSave: "No se ha podido guardar"
  },
  status: {
    couldNotRead: "No se ha podido leer: {error}",
    appVersion: "versión de esta app",
    databaseAt: "base en {version}",
    database: "base",
    activeCompanies: "empresas activas",
    activeUsers: "usuarios activos",
    portalUsers: " · {count} del portal",
    openErrors: "errores sin resolver (15 días)",
    versionsTitle: "Versiones en uso (30 días)",
    current: "la actual",
    previous: "anterior",
    company: "empresa",
    companies: "empresas",
    noVersions: "Ninguna empresa ha abierto la app en los últimos 30 días.",
    sqlTitle: "Últimos SQL aplicados en esta base",
    version: "Versión",
    whatChanges: "Qué cambia",
    applied: "Aplicado",
    footerTest: "Esto es la base de <b>pruebas</b>. La de producción se mira desde su propio panel.",
    footerProduction: "Esto es la base de <b>producción</b>. La de pruebas se mira desde su propio panel.",
    routesTitle: "Servicio de rutas (TomTom)",
    routesToday: "peticiones hoy, entre todas las empresas",
    routesMonth: "peticiones este mes",
    off: "Apagado",
    on: "Activo",
    service: "servicio",
    perUser: "por usuario activo y día",
    today: "Hoy",
    dailyLimit: "Cupo diario",
    thisMonth: "Este mes",
    noRoutes: "Ninguna empresa ha usado el servicio de rutas este mes."
  },
  template: {
    title: "Plantilla de las empresas nuevas",
    text: "Lo que recibe cada empresa al darse de alta (desde la web o desde Clientes). Cambiarlo aquí no toca a las empresas que ya existen.",
    roles: "Roles y permisos",
    catalogs: "Catálogos y estados",
    notice: "Estás cambiando la <b>plantilla de las empresas nuevas</b>.",
    back: "Volver a la plantilla"
  }
};

// src/app/i18n/es/chunks/platform/index.ts
var texts = { platform };

// src/app/screens/platform/texts.ts
registerMessages(texts);

// delcos-shared:src/app/legacy/bridge.ts
var shared2 = globalThis["__delcosModules"]["legacy/bridge"];
var pick2 = (name) => shared2[name];
var accessLegacy = /* @__PURE__ */ pick2("accessLegacy");
var callRpc = /* @__PURE__ */ pick2("callRpc");
var icon = /* @__PURE__ */ pick2("icon");
var legacyDb = /* @__PURE__ */ pick2("legacyDb");
var notices = /* @__PURE__ */ pick2("notices");
var term = /* @__PURE__ */ pick2("term");

// delcos-shared:src/app/legacy/platform-bridge.ts
var shared3 = globalThis["__delcosModules"]["legacy/platform-bridge"];
var pick3 = (name) => shared3[name];
var platformLegacy = /* @__PURE__ */ pick3("platformLegacy");

// delcos-shared:src/app/services/format.ts
var shared4 = globalThis["__delcosModules"]["services/format"];
var pick4 = (name) => shared4[name];
var escapeHtml = /* @__PURE__ */ pick4("escapeHtml");
var formatNumber = /* @__PURE__ */ pick4("formatNumber");

// delcos-shared:src/app/services/values.ts
var shared5 = globalThis["__delcosModules"]["services/values"];
var pick5 = (name) => shared5[name];
var nonZeroOr = /* @__PURE__ */ pick5("nonZeroOr");
var orFallback = /* @__PURE__ */ pick5("orFallback");
var sum = /* @__PURE__ */ pick5("sum");

// delcos-shared:src/app/screens/platform/model.ts
var shared6 = globalThis["__delcosModules"]["screens/platform/model"];
var pick6 = (name) => shared6[name];
var downloadJson = /* @__PURE__ */ pick6("downloadJson");
var errorMessage = /* @__PURE__ */ pick6("errorMessage");
var extraName = /* @__PURE__ */ pick6("extraName");
var panelBox = /* @__PURE__ */ pick6("panelBox");
var planOf = /* @__PURE__ */ pick6("planOf");
var planText = /* @__PURE__ */ pick6("planText");
var platformState = /* @__PURE__ */ pick6("platformState");
var shortDateTime = /* @__PURE__ */ pick6("shortDateTime");
var statePills = /* @__PURE__ */ pick6("statePills");
var stillOnTab = /* @__PURE__ */ pick6("stillOnTab");

// src/app/screens/platform/billing.ts
var UP_TO_DATE = "Al día";
var TRIAL = "En prueba";
var UNPAID = "Impago";
var BLOCKED = "Bloqueada";
var FILTERS = [["todas", "platform.billing.all"], ["atencion", "platform.billing.attention"], [UP_TO_DATE, "platform.billing.upToDate"], [TRIAL, "platform.billing.trial"], [UNPAID, "platform.billing.unpaid"]];
var stripeUrl = (id) => `https://dashboard.stripe.com/${platformLegacy.isTestEnvironment() ? "test/" : ""}customers/${encodeURIComponent(id)}`;
function shownIn(filter, row) {
  if (filter === "todas") return true;
  if (filter === "atencion") return [UNPAID, BLOCKED].includes(row.state[0]) || Boolean(row.plan.baja_al_final) || Boolean(row.plan.cambio_previsto);
  return row.state[0] === filter;
}
function notes(plan) {
  const change = plan.cambio_previsto;
  const planned = change ? t("platform.billing.planned", { plan: platformLegacy.planName(change.plan ?? plan.plan) }) + (change.usuarios ? t("platform.billing.plannedUsers", { users: change.usuarios }) : "") + (change.desde ? t("platform.billing.plannedOn", { date: platformLegacy.shortDate(change.desde) }) : "") : "";
  return [plan.baja_al_final ? t("platform.billing.leaving") : "", planned, plan.compromiso_hasta ? t("platform.billing.commitment", { date: platformLegacy.shortDate(plan.compromiso_hasta) }) : ""].filter(Boolean);
}
function rowHtml({ organization, plan, state }) {
  const monthly = platformLegacy.monthlyAmount(plan), users = plan.plan === "medida" ? "" : (plan.usuarios ? t("platform.billing.hired", { count: plan.usuarios }) : "") + t(plan.pago === "anual" ? "platform.billing.yearly" : "platform.billing.monthly");
  return `<tr><td><b>${escapeHtml(organization.nombre)}</b><div class="sm">${t("platform.billing.activeUsers", { count: organization.usuarios })}${plan.origen === "web" ? t("platform.billing.fromWeb") : ""}</div></td>
          <td>${escapeHtml(platformLegacy.planName(plan.plan))}<div class="sm">${users}</div></td>
          <td><span class="pill ${state[1]}">${state[0]}</span><div class="sm">${escapeHtml(state[2])}</div></td>
          <td class="num">${monthly ? platformLegacy.euros(monthly) : "—"}</td>
          <td>${notes(plan).map((note) => `<div class="sm">${escapeHtml(note)}</div>`).join("") || '<span class="sm">—</span>'}</td>
          <td>${plan.stripe_cliente ? `<a class="btn sec" href="${stripeUrl(plan.stripe_cliente)}" target="_blank" rel="noopener">${t("platform.billing.seeInStripe")}</a>` : ""}</td></tr>`;
}
function paintRows(rows, filter) {
  const box = document.getElementById("pdcobl");
  if (!box) return;
  const shown2 = rows.filter((row) => shownIn(filter, row));
  const head = ["company", "plan", "state", "perMonth", "pending"].map((key) => `<th>${t(`platform.billing.${key}`)}</th>`).join("");
  box.innerHTML = shown2.length ? `<div class="tablawrap"><table class="pdtabla"><thead><tr>${head}<th></th></tr></thead><tbody>
      ${shown2.map(rowHtml).join("")}</tbody></table></div>` : `<div class="vacio">${t("platform.billing.empty")}</div>`;
}
function pageHtml(rows, error) {
  const count = (state) => rows.filter((row) => row.state[0] === state).length;
  const income = sum(rows.filter((row) => row.state[0] === UP_TO_DATE).map((row) => platformLegacy.monthlyAmount(row.plan)));
  const figures = [
    [count(UP_TO_DATE), t("platform.billing.kpiUpToDate")],
    [count(TRIAL), t("platform.billing.kpiTrial")],
    [count(UNPAID), t("platform.billing.kpiUnpaid"), count(UNPAID) ? "mal" : ""],
    [rows.filter((row) => row.plan.baja_al_final).length, t("platform.billing.kpiLeaving")],
    [platformLegacy.euros(income), t("platform.billing.kpiIncome")]
  ];
  return `<div class="card cfgpanel">
    ${error ? `<div class="banda-peligro">${t("platform.billing.couldNotRead", { error: escapeHtml(errorMessage(error)) })}</div>` : ""}
    ${platformLegacy.kpis(figures)}
    <div class="segs" id="pdcobf">${FILTERS.map(([key, label]) => `<button type="button" data-pdf="${escapeHtml(key)}" class="${key === "todas" ? "on" : ""}">${t(label)}</button>`).join("")}</div>
    <div id="pdcobl"></div>
    <p class="sm">${t("platform.billing.footer")}</p></div>`;
}
async function paintBilling() {
  const start = panelBox();
  if (!start) return;
  start.innerHTML = platformLegacy.skeleton();
  const { data, error } = await callRpc("organizaciones_lista", {});
  if (!stillOnTab("cobros")) return;
  const box = panelBox();
  if (!box) return;
  const rows = (error ? [] : data ?? []).map((organization) => ({ organization, plan: planOf(organization), state: platformLegacy.billingState(organization) }));
  box.innerHTML = pageHtml(rows, error);
  box.querySelectorAll("[data-pdf]").forEach((button) => {
    button.onclick = () => {
      box.querySelectorAll("[data-pdf]").forEach((other) => {
        other.classList.toggle("on", other === button);
      });
      paintRows(rows, button.dataset.pdf ?? "todas");
    };
  });
  paintRows(rows, "todas");
}

// delcos-shared:src/app/services/dates.ts
var shared7 = globalThis["__delcosModules"]["services/dates"];
var pick7 = (name) => shared7[name];
var addDays = /* @__PURE__ */ pick7("addDays");
var todayIso = /* @__PURE__ */ pick7("todayIso");

// src/app/services/source-map.ts
var BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var DIGIT = new Map([...BASE64].map((char, index) => [char, index]));
var VLQ_SHIFT = 5;
var VLQ_CONTINUE = 32;
var VLQ_MASK = 31;
function decodeVlq(segment) {
  const values = [];
  let value3 = 0, shift = 0;
  for (const char of segment) {
    const digit = DIGIT.get(char);
    if (digit === void 0) throw new Error(`VLQ: invalid character «${char}»`);
    value3 += (digit & VLQ_MASK) << shift;
    if (digit & VLQ_CONTINUE) {
      shift += VLQ_SHIFT;
      continue;
    }
    values.push(value3 & 1 ? -(value3 >>> 1) : value3 >>> 1);
    value3 = 0;
    shift = 0;
  }
  if (shift !== 0) throw new Error("VLQ: unfinished segment");
  return values;
}
function parseMappings(mappings) {
  const lines = [];
  let source = 0, line = 0, sourceColumn = 0, name = 0;
  for (const text of mappings.split(";")) {
    const current = [];
    let column = 0;
    for (const segment of text.split(",")) {
      if (!segment) continue;
      const [delta = 0, sourceDelta, lineDelta, columnDelta, nameDelta] = decodeVlq(segment);
      column += delta;
      if (sourceDelta === void 0 || lineDelta === void 0 || columnDelta === void 0) continue;
      source += sourceDelta;
      line += lineDelta;
      sourceColumn += columnDelta;
      if (nameDelta !== void 0) name += nameDelta;
      current.push({ column, source, line, sourceColumn, name: nameDelta === void 0 ? null : name });
    }
    current.sort((first, second) => first.column - second.column);
    lines.push(current);
  }
  return lines;
}
function readSourceMap(data) {
  const root = data.sourceRoot ? data.sourceRoot.replace(/\/?$/, "/") : "";
  return { sources: data.sources.map((source) => root + source), names: data.names ?? [], lines: parseMappings(data.mappings) };
}
function originalPosition(map, line, column) {
  const segments = map.lines[line - 1];
  if (!segments?.length) return null;
  const target = column - 1;
  let low = 0, high = segments.length - 1, found = -1;
  while (low <= high) {
    const middle = low + high >> 1, segment = segments[middle];
    if (segment && segment.column <= target) {
      found = middle;
      low = middle + 1;
    } else high = middle - 1;
  }
  const hit = segments[found];
  if (!hit) return null;
  return { source: map.sources[hit.source] ?? "?", line: hit.line + 1, column: hit.sourceColumn + 1, name: hit.name === null ? null : map.names[hit.name] ?? null };
}
var FRAME = /(min\/chunks\/[\w-]+\.js|(?:min\/)?app\.js)(?:\?v=([\d.]+))?:(\d+):(\d+)/;
var isMinified = (file) => file === "min/app.js" || /^min\/chunks\/[\w-]+\.js$/.test(file);
function stackFrames(stack) {
  return stack.split("\n").map((text) => {
    const match = FRAME.exec(text);
    return match ? { file: match[1] ?? "", version: match[2] ?? null, line: Number(match[3]), column: Number(match[4]), text: text.trim() } : null;
  }).filter((frame) => frame !== null);
}

// src/app/screens/platform/error-code.ts
var mapRequests = /* @__PURE__ */ new Map();
function loadMap(file) {
  const known = mapRequests.get(file);
  if (known) return known;
  const request = fetch(new URL(`${file}.map`, location.href).href, { cache: "force-cache" }).then(async (response) => {
    if (!response.ok) throw new Error(String(response.status));
    return readSourceMap(await response.json());
  });
  request.catch(() => {
    mapRequests.delete(file);
  });
  mapRequests.set(file, request);
  return request;
}
var stackOf = (detail) => {
  const stack = detail && typeof detail === "object" ? detail.pila : null;
  return typeof stack === "string" ? stack : "";
};
function frameLine(maps, frame) {
  const map = maps.get(frame.file);
  const position = map ? originalPosition(map, frame.line, frame.column) : null;
  if (!position) return `${escapeHtml(frame.text)}  ${t("platform.errorCode.unmapped")}`;
  const source = position.source.replace(/^(\.\.\/)+/, "");
  return `${escapeHtml(source)}:${position.line}:${position.column}${position.name ? `  (${escapeHtml(position.name)})` : ""}`;
}
async function codeOfStack(detail, currentVersion) {
  const frames = stackFrames(stackOf(detail));
  if (!frames.length) return t("platform.errorCode.noStack");
  const other = frames.find((frame) => frame.version && frame.version !== currentVersion);
  if (other) return t("platform.errorCode.otherVersion", { version: other.version ?? "", current: currentVersion });
  const files = [...new Set(frames.map((frame) => frame.file).filter(isMinified))];
  if (!files.length) return t("platform.errorCode.notMinified");
  try {
    const maps = new Map(await Promise.all(files.map(async (file) => [file, await loadMap(file)])));
    return frames.map((frame) => frameLine(maps, frame)).join("\n");
  } catch (error) {
    return t("platform.errorCode.noMap", { error: escapeHtml(error instanceof Error ? error.message : String(error)) });
  }
}

// src/app/screens/platform/error-signature.ts
var STATE_ORDER = ["Nuevo", "Revisado", "Resuelto"];
function normaliseMessage(message) {
  return message.replace(/https?:\/\/\S+/g, "<url>").replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "<id>").replace(/(["'«`])[^"'»`]{0,120}(["'»`])/g, "$1…$2").replace(/\d+([.,]\d+)?/g, "<n>").replace(/\s+/g, " ").trim();
}
var stackOf2 = (detail) => {
  if (!detail || typeof detail !== "object") return "";
  const stack = detail.pila;
  return typeof stack === "string" ? stack : "";
};
function firstAppFrame(detail) {
  const frame = stackFrames(stackOf2(detail))[0];
  if (!frame) return "";
  const name = /^\s*(?:at\s+)?([\w$.<>]+)\s*[(@]/.exec(frame.text)?.[1];
  return name && name !== "at" ? name : frame.file;
}
var signatureOf = (group) => `${group.tipo}|${normaliseMessage(group.mensaje)}|${firstAppFrame(group.detalle)}`;
var versionsOf = (group) => String(group.versiones ?? "").split(",").map((version) => version.trim()).filter(Boolean);
function compareVersions(first, second) {
  const parts = (version) => version.replace(/^v/, "").split(".").map(Number);
  const one = parts(first), other = parts(second);
  for (let index = 0; index < Math.max(one.length, other.length); index++) {
    const difference = (other[index] ?? 0) - (one[index] ?? 0);
    if (difference) return difference;
  }
  return 0;
}
var earliest = (first, second) => first <= second ? first : second;
var openest = (first, second) => STATE_ORDER.indexOf(first) <= STATE_ORDER.indexOf(second) ? first : second;
function mergeInto(target, group) {
  target.veces += group.veces;
  target.personas = Math.max(target.personas, group.personas);
  target.primera = earliest(target.primera, group.primera);
  if (group.ultima > target.ultima) {
    target.ultima = group.ultima;
    target.detalle = group.detalle;
    target.mensaje = group.mensaje;
  }
  target.estado = openest(target.estado, group.estado);
  if (group.pantalla && !target.pantallas.includes(group.pantalla)) target.pantallas.push(group.pantalla);
  versionsOf(group).forEach((version) => {
    if (!target.versiones.includes(version)) target.versiones.push(version);
  });
  target.members.push(group);
}
function mergeBySignature(groups) {
  const bySignature = /* @__PURE__ */ new Map();
  groups.forEach((group) => {
    const signature = signatureOf(group), found = bySignature.get(signature);
    if (found) {
      mergeInto(found, group);
      return;
    }
    bySignature.set(signature, {
      signature,
      tipo: group.tipo,
      mensaje: group.mensaje,
      veces: group.veces,
      personas: group.personas,
      primera: group.primera,
      ultima: group.ultima,
      estado: group.estado,
      pantallas: group.pantalla ? [group.pantalla] : [],
      versiones: versionsOf(group),
      detalle: group.detalle,
      members: [group]
    });
  });
  const merged = [...bySignature.values()];
  merged.forEach((error) => {
    error.versiones.sort(compareVersions);
  });
  return merged.sort((first, second) => second.ultima.localeCompare(first.ultima));
}
function byVersion(errors) {
  const versions = /* @__PURE__ */ new Map();
  errors.forEach((error) => {
    (error.versiones.length ? error.versiones : ["?"]).forEach((version) => {
      const list = versions.get(version);
      if (list) list.push(error);
      else versions.set(version, [error]);
    });
  });
  return [...versions.entries()].sort(([first], [second]) => compareVersions(first, second));
}

// src/app/screens/platform/errors.ts
var STATES = ["Nuevo", "Revisado", "Resuelto"];
var SOLVED = "Resuelto";
var DAY_OPTIONS = [7, 15, 30, 90];
var KINDS = /* @__PURE__ */ new Map([["error", "platform.errors.program"], ["api", "platform.errors.database"], ["reporte", "platform.errors.report"]]);
var kindName = (kind) => {
  const key = KINDS.get(kind);
  return key ? t(key) : kind;
};
var stateOptions = (current) => STATES.map((state) => `<option ${current === state ? "selected" : ""}>${state}</option>`).join("");
var select = (id) => document.getElementById(id);
var errorView = "error";
function solvedText(error) {
  const solved = error.members.find((member) => member.resuelto_en_version);
  if (!solved?.resuelto_en_version) return "";
  return t(solved.resuelto_auto ? "platform.errors.solvedAuto" : "platform.errors.solvedIn", { version: escapeHtml(solved.resuelto_en_version) });
}
function errorRow(error, index) {
  const screens = error.pantallas.length ? error.pantallas.join(", ") : "—";
  return `<div class="errfila e-${error.tipo}">
        <div><b>${escapeHtml(kindName(error.tipo))}</b> <span class="sm">· ${escapeHtml(screens)} · ${formatNumber(error.veces)} ${t(error.veces === 1 ? "platform.errors.time" : "platform.errors.times")} · ${formatNumber(error.personas)} ${t(error.personas === 1 ? "platform.errors.person" : "platform.errors.people")}
          · ${t("platform.errors.last", { date: shortDateTime(error.ultima) })}${solvedText(error)}</span>
          <div class="errmsg">${escapeHtml(error.mensaje)}</div>
          <details class="errdet"><summary class="sm">${t("platform.errors.details")}</summary><div class="sm">${t("platform.errors.versions", { versions: escapeHtml(error.versiones.join(", ") || "—"), date: shortDateTime(error.primera) })}</div>
            <pre>${escapeHtml(JSON.stringify(error.detalle ?? {}, null, 1))}</pre>
            <button type="button" class="btn sec chico" data-egmap="${index}">${t("platform.errorCode.show")}</button><pre class="errcode" hidden></pre></details></div>
        <select class="chico" data-egh="${index}" aria-label="${t("platform.errors.groupState")}">${stateOptions(error.estado)}</select></div>`;
}
function listHtml(list) {
  if (errorView === "error") return list.map(errorRow).join("");
  return byVersion(list).map(([version, errors]) => `<h3 class="errver">${t("platform.errors.versionTitle", { version: escapeHtml(version), count: formatNumber(errors.length) })}</h3>
      ${errors.map((error) => errorRow(error, list.indexOf(error))).join("")}`).join("");
}
function platformHtml(list, error) {
  const filters = platformState.platformErrors;
  const states = [["abiertos", "platform.errors.open"], ["resueltos", "platform.errors.solved"], ["todos", "platform.errors.all"]];
  return `<div class="card cfgpanel errgrupos"><h2 style="padding:0 0 4px">${t("platform.errors.platformTitle")}</h2>
    <p class="sm">${t("platform.errors.platformText")}</p>
    ${error ? `<div class="banda-peligro">${t("platform.errors.couldNotRead", { error: escapeHtml(errorMessage(error)) })}</div>` : ""}
    <div class="usrbar"><select id="egest">${states.map(([key, label]) => `<option value="${key}" ${filters.estado === key ? "selected" : ""}>${t(label)}</option>`).join("")}</select>
      <select id="egdias">${DAY_OPTIONS.map((days) => `<option value="${days}" ${filters.dias === days ? "selected" : ""}>${t("platform.errors.lastDays", { days })}</option>`).join("")}</select>
      <select id="egvista" aria-label="${t("platform.errors.view")}"><option value="error" ${errorView === "error" ? "selected" : ""}>${t("platform.errors.byError")}</option><option value="version" ${errorView === "version" ? "selected" : ""}>${t("platform.errors.byVersion")}</option></select>
      <button class="btn sec" id="egdesc">${icon("download")} ${t("platform.errors.download")}</button></div>
    <div class="errlista">${listHtml(list) || `<div class="vacio">${t(filters.estado === "abiertos" ? "platform.errors.noneOpen" : "platform.errors.none")}</div>`}</div></div>`;
}
var shown = (group) => {
  const filter = platformState.platformErrors.estado;
  return filter === "todos" || (filter === "abiertos" ? group.estado !== SOLVED : group.estado === SOLVED);
};
async function markGroup(error, state) {
  const results = await Promise.all(error.members.map((member) => callRpc("marcar_errores_huella", { p_huella: member.huella, p_estado: state })));
  const ok = results.every(({ data: result }) => Boolean(result?.ok));
  notices.toast(ok ? t(state === SOLVED ? "platform.errors.groupSolved" : "platform.errors.stateChanged") : t("platform.errors.couldNotChange"), !ok);
  if (ok) void paintPlatformErrors();
}
function bindCode(box, list) {
  box.querySelectorAll("[data-egmap]").forEach((button) => {
    button.onclick = async () => {
      const error = list[Number(button.dataset.egmap)], out = button.nextElementSibling;
      if (!error || !out) return;
      button.disabled = true;
      out.hidden = false;
      out.textContent = t("platform.errorCode.loading");
      out.innerHTML = await codeOfStack(error.detalle, platformLegacy.appVersion());
      button.disabled = false;
    };
  });
}
async function paintPlatformErrors() {
  const start = panelBox();
  if (!start) return;
  start.innerHTML = '<div class="card cfgpanel"><div class="skel" style="width:40%"></div><div class="skel"></div></div>';
  const { data, error } = await callRpc("errores_resumen", { p_dias: platformState.platformErrors.dias });
  const box = panelBox();
  if (!box) return;
  const all = error ? [] : data ?? [], list = mergeBySignature(all).filter(shown);
  box.innerHTML = platformHtml(list, error);
  const refilter = () => {
    platformState.platformErrors = { estado: select("egest")?.value ?? "abiertos", dias: Number(select("egdias")?.value) };
    void paintPlatformErrors();
  };
  const states = select("egest"), days = select("egdias");
  if (states) states.onchange = refilter;
  if (days) days.onchange = refilter;
  const view = select("egvista");
  if (view) view.onchange = () => {
    errorView = view.value === "version" ? "version" : "error";
    void paintPlatformErrors();
  };
  box.querySelectorAll("[data-egh]").forEach((field2) => {
    field2.onchange = () => {
      const group = list[Number(field2.dataset.egh)];
      if (group) void markGroup(group, field2.value);
    };
  });
  bindCode(box, list);
  const save4 = document.getElementById("egdesc");
  if (save4) save4.onclick = () => {
    downloadJson({ generado: (/* @__PURE__ */ new Date()).toISOString(), version: platformLegacy.appVersion(), errores: all }, `errores_${todayIso()}.json`);
  };
}
function companyRow(item) {
  return `<div class="errfila e-${item.tipo}"><div><b>${escapeHtml(kindName(item.tipo))}</b> <span class="sm">${shortDateTime(item.creado_en)} · ${escapeHtml(orFallback(item.usuario, "—"))} · ${escapeHtml(orFallback(item.pantalla, "—"))} · v${escapeHtml(item.version ?? "")}</span>
        <div class="errmsg">${escapeHtml(item.mensaje)}</div></div>
      <select data-errst="${item.id}">${stateOptions(item.estado)}</select></div>`;
}
function companyHtml(list) {
  const filters = platformState.companyErrors;
  const kinds = [...KINDS.keys()].map((kind) => `<option value="${kind}" ${filters.tipo === kind ? "selected" : ""}>${kindName(kind)}</option>`).join("");
  const states = ["", ...STATES].map((state) => `<option value="${state}" ${filters.estado === state ? "selected" : ""}>${state || t("platform.errors.allStates")}</option>`).join("");
  return `<div class="card cfgpanel"><h2>${t("platform.errors.companyTitle")}</h2>
    <p class="sm">${t("platform.errors.companyText")}</p>
    <div class="usrbar"><select id="erft"><option value="">${t("platform.errors.allKinds")}</option>${kinds}</select>
      <select id="erfe">${states}</select>
      <button class="btn sec" id="erdesc">${icon("download")} ${t("platform.errors.download")}</button></div>
    <div class="errlista">${list.map(companyRow).join("") || `<div class="vacio">${t("platform.errors.none")}</div>`}</div></div>`;
}
async function paintCompanyErrors() {
  const filters = platformState.companyErrors;
  const { data } = await callRpc("errores_lista", { p_tipo: filters.tipo || null, p_estado: filters.estado || null });
  const box = panelBox();
  if (!box) return;
  const list = data ?? [];
  box.innerHTML = companyHtml(list);
  const refilter = () => {
    platformState.companyErrors = { tipo: select("erft")?.value ?? "", estado: select("erfe")?.value ?? "" };
    void paintCompanyErrors();
  };
  const kind = select("erft"), state = select("erfe");
  if (kind) kind.onchange = refilter;
  if (state) state.onchange = refilter;
  box.querySelectorAll("[data-errst]").forEach((field2) => {
    field2.onchange = async () => {
      await callRpc("marcar_error", { p_id: Number(field2.dataset.errst), p_estado: field2.value });
      notices.toast(t("platform.errors.stateChanged"));
    };
  });
  const save4 = document.getElementById("erdesc");
  if (save4) save4.onclick = () => {
    downloadJson(list, `errores_${todayIso()}.json`);
  };
}

// delcos-shared:src/app/services/date-format.ts
var shared8 = globalThis["__delcosModules"]["services/date-format"];
var pick8 = (name) => shared8[name];
var formatShortDate = /* @__PURE__ */ pick8("formatShortDate");

// src/app/screens/platform/org-actions.ts
var URL_LIFE_MS = 6e4;
var errorSuffix = (error) => error ? `: ${errorMessage(error)}` : "";
async function downloadData(organization, button) {
  const label = button.textContent;
  button.disabled = true;
  button.textContent = t("platform.orgs.preparing");
  const { data, error } = await callRpc("exportar_organizacion", { p_org: organization.id });
  button.disabled = false;
  button.textContent = label;
  if (error || !data) {
    notices.toast(t("platform.orgs.downloadFailed"), true);
    return;
  }
  downloadJson(data, `datos_${organization.nombre.replace(/[^\p{L}\p{N}]+/gu, "_")}_${todayIso()}.json`, URL_LIFE_MS);
  notices.toast(t("platform.orgs.downloaded"));
}
var DELETE_ERRORS = /* @__PURE__ */ new Map([["permiso", "platform.orgs.noPermission"], ["principal", "platform.orgs.mainNotDeleted"], ["activa", "platform.orgs.onlyTrial"], ["facturas", "platform.orgs.hasInvoices"]]);
async function deleteOrganization(organization, repaint) {
  if (organization.facturas) {
    notices.toast(t("platform.orgs.invoicesNoDelete", { name: organization.nombre }), true);
    return;
  }
  const typed = await platformLegacy.askText(
    t("platform.orgs.deleteText", { name: organization.nombre, users: formatNumber(organization.usuarios), accounts: formatNumber(organization.cuentas) }),
    "",
    { titulo: t("platform.orgs.delete"), ok: t("platform.orgs.deleteOk") }
  );
  if (typed === null) return;
  if (typed.trim() !== organization.nombre) {
    notices.toast(t("platform.orgs.nameMismatch"), true);
    return;
  }
  const { data: result, error } = await legacyDb().rpc("borrar_organizacion", { p_org: organization.id });
  if (error || !result?.ok) {
    const key = DELETE_ERRORS.get(result?.error ?? "");
    notices.toast(key ? t(key) : t("platform.orgs.deleteFailed") + errorSuffix(error), true);
    return;
  }
  notices.toast(t("platform.orgs.deleted", { name: organization.nombre }) + (String(result.acceso ?? "").startsWith("no_borrado") ? t("platform.orgs.deleteUsersToo") : ""));
  void repaint();
}
var ACTIVE_ERRORS = /* @__PURE__ */ new Map([["permiso", "platform.orgs.noPermission"], ["principal", "platform.orgs.mainNotDeactivated"], ["organizacion", "platform.orgs.notFound"]]);
async function toggleActive(organization, button, repaint) {
  const activate = organization.activa === false, users = formatNumber(organization.usuarios);
  const asked = await notices.confirm(t(activate ? "platform.orgs.reactivateText" : "platform.orgs.deactivateText", { users }), {
    titulo: t(activate ? "platform.orgs.reactivateTitle" : "platform.orgs.deactivateTitle", { name: organization.nombre }),
    ok: t(activate ? "platform.orgs.reactivate" : "platform.orgs.deactivate"),
    peligro: !activate
  });
  if (!asked) return;
  button.disabled = true;
  const { data: result, error } = await legacyDb().rpc("activar_organizacion", { p_org: organization.id, p_activa: activate });
  if (error || !result?.ok) {
    button.disabled = false;
    const key = ACTIVE_ERRORS.get(result?.error ?? "");
    notices.toast(key ? t(key) : t("platform.orgs.toggleFailed") + errorSuffix(error), true);
    return;
  }
  notices.toast(t(activate ? "platform.orgs.reactivated" : "platform.orgs.deactivated2", { name: organization.nombre }));
  void repaint();
}
async function enterOrganization(organization) {
  if (!await notices.confirm(t("platform.orgs.enterText", { name: organization.nombre }), { titulo: t("platform.orgs.enterTitle", { name: organization.nombre }), ok: t("platform.orgs.enter") })) return;
  const { data: result } = await legacyDb().rpc("entrar_organizacion", { p_org: organization.id });
  if (!result?.ok) {
    notices.toast(t(result?.motivo === "permiso" ? "platform.orgs.onlyAdmin" : "platform.orgs.couldNotEnter"), true);
    return;
  }
  platformLegacy.prepareOrganizationChange(organization.nombre);
  location.reload();
}

// src/app/screens/platform/org-extras.ts
var checked = (id) => document.getElementById(id)?.checked ?? false;
async function save(organization, repaint) {
  const extras = [checked("oxopor") ? "oportunidades" : "", checked("oxport") ? "portal" : ""].filter(Boolean);
  const { data: result, error } = await legacyDb().rpc("guardar_extras_organizacion", { p_org: organization.id, p_extras: extras });
  if (error || !result?.ok) {
    notices.toast(t("platform.extras.couldNotSave") + (error ? `: ${errorMessage(error)}` : ""), true);
    return;
  }
  document.getElementById("dlg")?.close();
  notices.toast(t("platform.extras.saved"));
  await platformLegacy.reloadPlan();
  void repaint();
}
function editExtras(organization, repaint) {
  const body = document.getElementById("dbody"), box = document.getElementById("dlg");
  if (!body || !box) return;
  const active = planOf(organization).extras ?? [];
  body.innerHTML = `<div class="fh"><div><h2>${t("platform.extras.title", { name: escapeHtml(organization.nombre) })}</h2><div class="sm">${t("platform.extras.subtitle")}</div></div>
        <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>
      <label class="chk"><input type="checkbox" id="oxopor" ${active.includes("oportunidades") ? "checked" : ""}> <span><b>${t("platform.extras.opportunities")}</b>
        <span class="sm">${t("platform.extras.opportunitiesText", { professional: term("medico") })}</span></span></label>
      <label class="chk"><input type="checkbox" id="oxport" ${active.includes("portal") ? "checked" : ""}> <span><b>${t("platform.extras.portalTitle", { ofProfessional: term("medico", { article: "del" }) })}</b>
        <span class="sm">${t("platform.extras.portalText", { orders: term("pauta", { number: "p" }) })}</span></span></label>
      <div class="acts u-end"><button class="btn sec" data-cerrar>${t("common.cancel")}</button><button class="btn" id="oxok">${t("common.save")}</button></div>`;
  box.showModal();
  const ok = document.getElementById("oxok");
  if (ok) ok.onclick = () => {
    void save(organization, repaint);
  };
}

// src/app/screens/platform/org-new.ts
var MIN_USERS = 3;
var TRIAL_DAYS = 30;
var MIN_PASSWORD = 6;
var DEFAULT_PLAN = "empresa";
var value = (id) => document.getElementById(id)?.value ?? "";
var CREATE_ERRORS = /* @__PURE__ */ new Map([["permiso", "platform.orgs.noPermission"], ["nombre", "platform.newOrg.noName"], ["email", "platform.newOrg.badEmail"], ["email_existe", "platform.newOrg.emailTaken"]]);
function formHtml() {
  const plans = platformLegacy.plans().map((plan) => `<option value="${plan.id}" ${plan.id === DEFAULT_PLAN ? "selected" : ""}>${escapeHtml(plan.nombre)}</option>`).join("");
  return `<div class="fh"><div><h2>${t("platform.newOrg.title")}</h2><div class="sm">${t("platform.newOrg.subtitle")}</div></div>
        <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>
      <div class="g2"><div><label for="onom">${t("platform.newOrg.name")}</label><input id="onom"></div>
        <div><label for="onif">${t("platform.newOrg.nif")}</label><input id="onif"></div>
        <div><label for="oplan">${t("platform.newOrg.plan")}</label><select id="oplan">${plans}</select></div>
        <div><label for="ousu">${t("platform.newOrg.users")}</label><input id="ousu" type="number" min="3" value="3"></div>
        <div><label for="opago">${t("platform.newOrg.payment")}</label><select id="opago"><option value="mensual">${t("platform.newOrg.monthly")}</option><option value="anual">${t("platform.newOrg.yearly")}</option></select></div>
        <div><label class="chk"><input type="checkbox" id="oprueba" checked> ${t("platform.newOrg.trial")}</label></div></div>
      <h3 style="margin-top:14px">${t("platform.newOrg.admin")}</h3>
      <div class="g2"><div><label for="oanom">${t("platform.newOrg.adminName")}</label><input id="oanom"></div>
        <div><label for="oamail">${t("platform.newOrg.adminEmail")}</label><input id="oamail" type="email"></div>
        <div><label for="oapass">${t("platform.newOrg.password")}</label><input id="oapass" value="Tmp-${Math.random().toString(36).slice(2, 8)}"></div></div>
      <div class="acts u-end"><button class="btn sec" data-cerrar>${t("common.cancel")}</button><button class="btn" id="ocrear">${t("platform.newOrg.create")}</button></div>
      <div id="omsg" class="sm u-mt-10"></div>`;
}
var setMessage = (html) => {
  const message = document.getElementById("omsg");
  if (message) message.innerHTML = html;
};
var busy = (button, on) => {
  button.disabled = on;
  button.textContent = t(on ? "platform.newOrg.creating" : "platform.newOrg.create");
};
function newCompany(name, email) {
  return {
    nombre: name,
    nif: value("onif").trim(),
    plan: value("oplan"),
    usuarios: Number(value("ousu")) || MIN_USERS,
    pago: value("opago"),
    prueba_dias: document.getElementById("oprueba")?.checked ? TRIAL_DAYS : 0,
    email_admin: email
  };
}
function createFailure(code, error) {
  const key = CREATE_ERRORS.get(code ?? ""), reason = key ? t(key) : errorMessage(error);
  return `<span class="u-danger">${t("platform.newOrg.failed", { reason: escapeHtml(reason) })}</span>`;
}
async function create(button, repaint) {
  const name = value("onom").trim(), email = value("oamail").trim(), password = value("oapass"), adminName = value("oanom").trim();
  if (!name || !email || !adminName || password.length < MIN_PASSWORD) {
    notices.toast(t("platform.newOrg.complete"), true);
    return;
  }
  busy(button, true);
  const { data: result, error } = await legacyDb().rpc("crear_organizacion", { p: newCompany(name, email) });
  if (error || !result?.ok) {
    busy(button, false);
    setMessage(createFailure(result?.error, error));
    return;
  }
  const failure = await accessLegacy.signUp(email, password, adminName);
  busy(button, false);
  setMessage(failure ? `<span class="u-danger">${t("platform.newOrg.noUser", { error: escapeHtml(failure.message ?? "") })}</span>` : t("platform.newOrg.created", { email: escapeHtml(email), password: escapeHtml(password) }));
  void repaint();
}
function openNewOrganization(repaint) {
  const body = document.getElementById("dbody"), box = document.getElementById("dlg");
  if (!body || !box) return;
  body.innerHTML = formHtml();
  const ok = document.getElementById("ocrear");
  if (ok) ok.onclick = () => {
    void create(ok, repaint);
  };
  box.showModal();
}

// src/app/screens/platform/org-plan.ts
var MEDIDA = "medida";
var TRIAL2 = "prueba";
var TRIAL_DAYS2 = 30;
var field = (id) => document.getElementById(id);
var value2 = (id) => field(id)?.value ?? "";
function formHtml2(organization) {
  const data = planOf(organization), current = data.plan ?? organization.plan, end = data.prueba_hasta ?? addDays(todayIso(), TRIAL_DAYS2);
  const plans = platformLegacy.plans().map((plan) => `<option value="${plan.id}" ${plan.id === current ? "selected" : ""}>${escapeHtml(plan.nombre)}</option>`).join("");
  return `<div class="fh"><div><h2>${t("platform.plan.title", { name: escapeHtml(organization.nombre) })}</h2><div class="sm">${t("platform.plan.subtitle")}</div></div>
        <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>
      <div class="g2"><div><label for="opplan">${t("platform.newOrg.plan")}</label><select id="opplan">${plans}</select></div>
        <div><label for="opusu">${t("platform.newOrg.users")}</label><input id="opusu" type="number" min="3" value="${escapeHtml(data.usuarios ?? "")}" placeholder="${t("platform.plan.noLimit")}"></div>
        <div><label for="oppago">${t("platform.newOrg.payment")}</label><select id="oppago"><option value="mensual">${t("platform.newOrg.monthly")}</option><option value="anual" ${data.pago === "anual" ? "selected" : ""}>${t("platform.newOrg.yearly")}</option></select></div>
        <div><label for="opest">${t("platform.plan.state")}</label><select id="opest"><option value="activo">${t("platform.plan.paid")}</option><option value="prueba" ${data.estado === TRIAL2 ? "selected" : ""}>${t("platform.plan.trial")}</option></select></div>
        <div id="opfinw" class="${data.estado === TRIAL2 ? "" : "hide"}"><label for="opfin">${t("platform.plan.trialUntil")}</label><input id="opfin" type="date" value="${escapeHtml(end)}"></div><div id="opcompw"><label for="opcomp">${t("platform.plan.commitment")}</label>
        <input id="opcomp" type="date" value="${escapeHtml(data.compromiso_hasta ?? "")}"><span class="sm">${t("platform.plan.commitmentHint")}</span></div></div>
      ${data.stripe_suscripcion ? `<div class="banda-aviso" id="opstripe">${t("platform.plan.stripe")}</div>` : ""}<div id="opperd"></div>
      <div class="acts u-end"><button class="btn sec" data-cerrar>${t("common.cancel")}</button><button class="btn" id="opok">${t("platform.plan.save")}</button></div>`;
}
var isCommitted = (data, from, to) => from === MEDIDA && to !== MEDIDA && Boolean(data.compromiso_hasta) && (data.compromiso_hasta ?? "") > todayIso();
function paintLosses(organization) {
  const data = planOf(organization), from = data.plan ?? organization.plan ?? "", to = value2("opplan");
  field("opcompw")?.classList.toggle("hide", to !== MEDIDA);
  const box = document.getElementById("opperd");
  if (!box) return;
  if (isCommitted(data, from, to)) {
    box.innerHTML = `<div class="banda-peligro">${t("platform.plan.committed", { date: formatShortDate(data.compromiso_hasta ?? "") })}</div>`;
    return;
  }
  const losses = platformLegacy.planLosses(from, to, { extras: data.extras ?? [], facturas: Number(organization.facturas) > 0 });
  box.innerHTML = platformLegacy.planRank(to) < platformLegacy.planRank(from) && losses.length ? `<div class="banda-aviso">${t("platform.plan.willLose", { plan: escapeHtml(platformLegacy.planName(to)) })}<ul>${losses.map((loss) => `<li>${escapeHtml(loss)}</li>`).join("")}</ul></div>` : "";
}
var PLAN_ERRORS = /* @__PURE__ */ new Map([["permiso", "platform.orgs.noPermission"], ["minimo", "platform.plan.minimum"], ["prueba_hasta", "platform.plan.noTrialEnd"], ["plan", "platform.plan.invalid"], ["compromiso", "platform.plan.committedUntil"]]);
function payload() {
  const trial = value2("opest") === TRIAL2, plan = value2("opplan");
  const result = { plan, usuarios: value2("opusu") === "" ? null : Number(value2("opusu")), pago: value2("oppago"), estado: value2("opest"), prueba_hasta: trial ? value2("opfin") : null };
  if (plan === MEDIDA) result.compromiso_hasta = value2("opcomp") || null;
  return result;
}
async function save2(organization, button, repaint) {
  button.disabled = true;
  const { data: result, error } = await legacyDb().rpc("guardar_plan_organizacion", { p_org: organization.id, p: payload() });
  button.disabled = false;
  if (error || !result?.ok) {
    const key = PLAN_ERRORS.get(result?.error ?? "");
    notices.toast(key ? t(key, { date: formatShortDate(result?.hasta ?? "") }) : t("platform.plan.couldNotSave"), true);
    return;
  }
  document.getElementById("dlg")?.close();
  notices.toast(t("platform.plan.saved"));
  void repaint();
}
function editPlan(organization, repaint) {
  const body = document.getElementById("dbody"), box = document.getElementById("dlg");
  if (!body || !box) return;
  body.innerHTML = formHtml2(organization);
  const state = field("opest");
  if (state) state.onchange = () => {
    field("opfinw")?.classList.toggle("hide", value2("opest") !== TRIAL2);
  };
  field("opplan")?.addEventListener("change", () => {
    paintLosses(organization);
  });
  paintLosses(organization);
  const ok = document.getElementById("opok");
  if (ok) ok.onclick = () => {
    void save2(organization, ok, repaint);
  };
  box.showModal();
}

// delcos-shared:src/app/screens/settings/plan/usage.ts
var shared9 = globalThis["__delcosModules"]["screens/settings/plan/usage"];
var pick9 = (name) => shared9[name];
var loadOrganisationLimits = /* @__PURE__ */ pick9("loadOrganisationLimits");
var organisationLimitsHtml = /* @__PURE__ */ pick9("organisationLimitsHtml");

// src/app/screens/platform/organizations.ts
function detailsText(organization) {
  const extras = planOf(organization).extras ?? [];
  return escapeHtml(orFallback(organization.nif, t("platform.orgs.noNif"))) + ` · ${escapeHtml(planText(organization))}${extras.length ? ` + ${extras.map(extraName).join(", ")}` : ""}` + t("platform.orgs.counts", { users: formatNumber(organization.usuarios), accounts: formatNumber(organization.cuentas) }) + (organization.pendiente ? t("platform.orgs.pending", { email: escapeHtml(organization.pendiente) }) : "");
}
function buttonsHtml(organization) {
  const inside = organization.id === platformState.viewed?.id, data = planOf(organization);
  const toggle = organization.principal ? "" : `<button class="btn sec" type="button" data-orgact="${organization.id}">${t(organization.activa === false ? "platform.orgs.reactivate" : "platform.orgs.deactivate")}</button>`;
  const remove = !organization.principal && (data.estado === "prueba" || !organization.activa) ? `<button class="btn sec" type="button" data-orgdel="${organization.id}">${t("platform.orgs.delete")}</button>` : "";
  return `<span class="acts u-m-0"><span class="sm">${organization.creado_en ? formatShortDate(String(organization.creado_en).slice(0, 10)) : ""}</span>
        <button class="btn sec chico" type="button" data-orgdom="${organization.id}">${t("platform.orgs.domains")}</button>
        <button class="btn sec chico" type="button" data-orgext="${organization.id}">${t("platform.orgs.extras")}</button>
        <button class="btn chico ${inside ? "sec" : ""}" type="button" data-orgver="${organization.id}">${t(inside ? "platform.orgs.inside" : "platform.orgs.enter")}</button>
        <button class="btn sec chico" type="button" data-orgplan="${organization.id}">${t("platform.orgs.plan")}</button>
        <button class="btn sec chico" type="button" data-orgexp="${organization.id}">${t("platform.orgs.download")}</button>
        ${toggle}${remove}</span>`;
}
function rowHtml2(organization, limits) {
  const domains = organization.dominios ?? [];
  return `<div class="item u-cursor-default">
      <span class="tx"><b>${escapeHtml(organization.nombre)}</b>${statePills(organization)}<span class="sm">${detailsText(organization)}</span>
        <span class="sm">${domains.length ? t("platform.orgs.domainList", { domains: domains.map(escapeHtml).join(", ") }) : t("platform.orgs.noDomain")}</span>${limits ? `<span class="orglim">${organisationLimitsHtml(limits)}</span>` : ""}</span>
      ${buttonsHtml(organization)}</div>`;
}
var DOMAIN_ERRORS = /* @__PURE__ */ new Map([["permiso", "platform.orgs.noPermission"], ["dominio", "platform.orgs.badDomain"], ["en_uso", "platform.orgs.domainInUse"], ["no_existe", "platform.orgs.gone"]]);
function domainsFailure(result, error) {
  const key = DOMAIN_ERRORS.get(result?.error ?? "");
  if (key) return t(key, { domain: result?.dominio ?? "", organization: result?.organizacion ?? "" });
  return t("platform.orgs.domainsFailed") + (error ? `: ${errorMessage(error)}` : "");
}
async function editDomains(organization) {
  const text = await platformLegacy.askText(t("platform.orgs.domainsText", { name: organization.nombre }), (organization.dominios ?? []).join(", "), { titulo: t("platform.orgs.domainsTitle"), ok: t("common.save") });
  if (text === null) return;
  const { data: result, error } = await legacyDb().rpc("guardar_dominios_organizacion", { p_id: organization.id, p_dominios: text.split(/[,;\s]+/).filter(Boolean) });
  if (error || !result?.ok) {
    notices.toast(domainsFailure(result, error), true);
    return;
  }
  notices.toast(t(result.dominios?.length ? "platform.orgs.domainsSaved" : "platform.orgs.domainsRemoved"));
  void paintOrganizations();
}
var ACTIONS = [
  ["orgver", (organization) => {
    if (organization.id !== platformState.viewed?.id) void enterOrganization(organization);
  }],
  ["orgdom", (organization) => {
    void editDomains(organization);
  }],
  ["orgext", (organization) => {
    editExtras(organization, paintOrganizations);
  }],
  ["orgplan", (organization) => {
    editPlan(organization, paintOrganizations);
  }],
  ["orgexp", (organization, button) => {
    void downloadData(organization, button);
  }],
  ["orgdel", (organization) => {
    void deleteOrganization(organization, paintOrganizations);
  }],
  ["orgact", (organization, button) => {
    void toggleActive(organization, button, paintOrganizations);
  }]
];
function bind(box, list) {
  for (const [key, action] of ACTIONS) box.querySelectorAll(`[data-${key}]`).forEach((button) => {
    button.onclick = () => {
      const organization = list.find((item) => item.id === button.dataset[key]);
      if (organization) action(organization, button);
    };
  });
  const add = document.getElementById("orgnueva");
  if (add) add.onclick = () => {
    openNewOrganization(paintOrganizations);
  };
}
async function paintOrganizations() {
  const start = document.getElementById("cfgcuerpo");
  if (!start) return;
  const tab = start.dataset.tab;
  start.innerHTML = `<div class="card"><div class="sm">${t("common.loading")}</div></div>`;
  const [{ data, error }, limits] = await Promise.all([legacyDb().rpc("organizaciones_lista"), loadOrganisationLimits()]);
  const box = document.getElementById("cfgcuerpo");
  if (!box || box.dataset.tab !== tab) return;
  const list = Array.isArray(data) ? data : [];
  box.innerHTML = `<div class="card"><div class="fh"><div><h2>${t("platform.orgs.title")}</h2>
      <div class="sm">${t("platform.orgs.subtitle")}</div></div>
      <button class="btn" id="orgnueva">${t("platform.orgs.new")}</button></div>
    ${error ? `<div class="vacio">${t("platform.orgs.couldNotLoad", { error: escapeHtml(errorMessage(error)) })}</div>` : `<div class="lista">${list.map((organization) => rowHtml2(organization, limits.get(organization.id))).join("")}</div>`}</div>`;
  bind(box, list);
}

// src/app/screens/platform/requests.ts
var STATES2 = ["Nueva", "En curso", "Cerrada"];
var CONTACT = /* @__PURE__ */ new Map([["correo", "platform.requests.byEmail"], ["llamada", "platform.requests.byPhone"], ["video", "platform.requests.byVideo"]]);
var statePill = (state) => state === "Nueva" ? "p-warn" : state === "En curso" ? "p-est" : "p-anu";
function figuresText(data) {
  return (data.usuarios ? t("platform.requests.users", { count: formatNumber(data.usuarios) }) : "") + (data.portal ? t("platform.requests.portal", { count: formatNumber(data.portal) }) : "") + (data.cuando ? ` · ${escapeHtml(data.cuando)}` : "");
}
function contactText(request, data) {
  const how = CONTACT.get(data.contacto ?? "");
  return escapeHtml(orFallback(data.nombre, request.persona ?? "")) + (data.correo ? ` · <a href="mailto:${escapeHtml(data.correo)}">${escapeHtml(data.correo)}</a>` : "") + (data.telefono ? ` · <a href="tel:${escapeHtml(data.telefono)}">${escapeHtml(data.telefono)}</a>` : "") + `
          · ${how ? t(how) : ""}${data.horario ? ` (${escapeHtml(data.horario)})` : ""}`;
}
function rowHtml3(request, index) {
  const data = request.datos ?? {}, needs = data.necesita_txt ?? [];
  return `<div class="presufila${request.estado === "Cerrada" ? " cerrada" : ""}">
        <div class="presucab"><b>${escapeHtml(request.organizacion)}</b> <span class="pill p-est">${escapeHtml(platformLegacy.planName(request.plan))}</span>
          <span class="pill ${statePill(request.estado)}">${escapeHtml(request.estado)}</span>
          <span class="sm">${t(request.tipo === "contrato" ? "platform.requests.contract" : "platform.requests.quote")} · ${shortDateTime(request.creado_en)}</span></div>
        ${needs.length ? `<div class="chips">${needs.map((need) => `<span class="chip">${escapeHtml(need)}</span>`).join("")}</div>` : ""}
        ${data.programa ? `<div class="sm">${t("platform.requests.program", { program: `<b>${escapeHtml(data.programa)}</b>` })}</div>` : ""}
        ${data.mensaje ? `<p class="presumsg">${escapeHtml(data.mensaje)}</p>` : ""}
        <div class="sm">${figuresText(data)}</div>
        <div class="sm">${contactText(request, data)}</div>
        <div class="presuges"><select data-psest="${index}" aria-label="${t("platform.requests.state")}">${STATES2.map((state) => `<option ${request.estado === state ? "selected" : ""}>${state}</option>`).join("")}</select>
          <input data-psnota="${index}" placeholder="${t("platform.requests.notePlaceholder")}" value="${escapeHtml(request.nota ?? "")}">
          <button type="button" class="btn sec" data-psok="${index}">${t("common.save")}</button></div></div>`;
}
async function save3(box, request, index) {
  const field2 = (attribute) => box.querySelector(`[data-${attribute}="${index}"]`)?.value ?? "";
  const { data: result } = await callRpc("marcar_solicitud_plan", { p_id: request.id, p_estado: field2("psest"), p_nota: field2("psnota") });
  const ok = Boolean(result?.ok);
  notices.toast(t(ok ? "platform.requests.saved" : "platform.requests.couldNotSave"), !ok);
  if (ok) void paintRequests();
}
async function paintRequests() {
  const start = panelBox();
  if (!start) return;
  start.innerHTML = '<div class="card cfgpanel"><div class="skel" style="width:40%"></div><div class="skel"></div></div>';
  const { data, error } = await callRpc("solicitudes_plan_lista", {});
  const box = panelBox();
  if (!box) return;
  const list = error ? [] : data ?? [];
  box.innerHTML = `<div class="card cfgpanel"><h2>${t("platform.requests.title")}</h2>
    <p class="sm">${t("platform.requests.subtitle")}</p>
    ${error ? `<div class="banda-peligro">${t("platform.billing.couldNotRead", { error: escapeHtml(errorMessage(error)) })}</div>` : ""}
    <div class="presulista">${list.map(rowHtml3).join("") || `<div class="vacio">${t("platform.requests.none")}</div>`}</div></div>`;
  box.querySelectorAll("[data-psok]").forEach((button) => {
    button.onclick = () => {
      const index = button.dataset.psok ?? "", request = list[Number(index)];
      if (request) void save3(box, request, index);
    };
  });
}

// src/app/screens/platform/signups.ts
var COMPLETED = "completada";
var WEEK_MS = 7 * 864e5;
var DEFAULT_USERS = 3;
function stateOf(signup) {
  if (signup.estado !== COMPLETED) return [t("platform.signups.half"), "p-warn", t("platform.signups.halfText", { ago: platformLegacy.timeAgo(signup.creado_en) })];
  if (signup.entro) return [t("platform.signups.inside"), "p-est", t("platform.signups.insideText")];
  return [t("platform.signups.invited"), "p-per", signup.invitado_en ? t("platform.signups.invitedText", { ago: platformLegacy.timeAgo(signup.invitado_en) }) : t("platform.signups.noInvitation")];
}
function contactHtml(data) {
  return escapeHtml(data.nombre ?? "") + (data.email ? ` · <a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a>` : "") + (data.telefono ? ` · <a href="tel:${escapeHtml(data.telefono)}">${escapeHtml(data.telefono)}</a>` : "") + (data.nif ? ` · ${escapeHtml(data.nif)}` : "");
}
function rowHtml4(signup) {
  const data = signup.datos ?? {}, [label, pill, text] = stateOf(signup);
  const plan = t("platform.signups.plan", { plan: platformLegacy.planName(data.plan), users: nonZeroOr(data.usuarios, DEFAULT_USERS), payment: t(data.pago === "anual" ? "platform.billing.yearly" : "platform.billing.monthly") });
  return `<div class="pdalta"><div class="pdaltacab"><b>${escapeHtml(orFallback(orFallback(signup.organizacion, data.empresa ?? ""), t("platform.signups.noName")))}</b> <span class="pill ${pill}">${label}</span>
        <span class="pill p-per">${escapeHtml(plan)}</span></div>
      <div class="sm">${contactHtml(data)}</div>
      <div class="sm">${escapeHtml(text)} · ${t("platform.signups.started", { date: platformLegacy.shortDate(signup.creado_en) })}</div></div>`;
}
function pageHtml2(list, error) {
  const done = list.filter((signup) => signup.estado === COMPLETED), half = list.filter((signup) => signup.estado !== COMPLETED);
  const week = list.filter((signup) => Date.now() - new Date(signup.creado_en).getTime() < WEEK_MS);
  const figures = [
    [done.length, t("platform.signups.kpiDone")],
    [done.filter((signup) => signup.entro).length, t("platform.signups.kpiInside")],
    [half.length, t("platform.signups.kpiHalf"), half.length ? "aviso" : ""],
    [week.length, t("platform.signups.kpiWeek")]
  ];
  return `<div class="card cfgpanel">
    ${error ? `<div class="banda-peligro">${t("platform.billing.couldNotRead", { error: escapeHtml(errorMessage(error)) })}</div>` : ""}
    ${platformLegacy.kpis(figures)}
    ${half.length ? `<h3 class="pdh3">${t("platform.signups.half")}</h3><p class="sm">${t("platform.signups.halfHelp")}</p>${half.map(rowHtml4).join("")}` : ""}
    <h3 class="pdh3">${t("platform.signups.completed")}</h3>${done.map(rowHtml4).join("") || `<div class="vacio">${t("platform.signups.none")}</div>`}</div>`;
}
async function paintSignups() {
  const start = panelBox();
  if (!start) return;
  start.innerHTML = platformLegacy.skeleton();
  const { data, error } = await callRpc("altas_lista", {});
  if (!stillOnTab("altas")) return;
  const box = panelBox();
  if (box) box.innerHTML = pageHtml2(error ? [] : data ?? [], error);
}

// src/app/screens/platform/status.ts
var ROUTES_DEFAULT_LIMIT = 2e3;
var ROUTES_PER_USER = 30;
var WARNING_SHARE = 0.8;
function versionsHtml(list) {
  const byVersion2 = /* @__PURE__ */ new Map();
  list.forEach((item) => {
    byVersion2.set(item.version, [...byVersion2.get(item.version) ?? [], item]);
  });
  const versions = [...byVersion2.keys()].sort((first, second) => second.localeCompare(first, "es", { numeric: true }));
  if (!versions.length) return `<div class="vacio">${t("platform.status.noVersions")}</div>`;
  return versions.map((version) => {
    const users = byVersion2.get(version) ?? [], number = version.replace(/^v/, "");
    return `<div class="pdver"><div class="pdvercab"><b>v${escapeHtml(number)}</b>${number === platformLegacy.appVersion() ? ` <span class="pill p-est">${t("platform.status.current")}</span>` : ` <span class="pill p-warn">${t("platform.status.previous")}</span>`}
        <span class="sm">${users.length} ${t(users.length === 1 ? "platform.status.company" : "platform.status.companies")}</span></div>
      <div class="sm">${users.map((item) => `${escapeHtml(item.organizacion)} (${platformLegacy.timeAgo(item.ultima_vez)})`).join(" · ")}</div></div>`;
  }).join("");
}
function sqlFigure(last) {
  return [last?.numero ? `SQL ${last.numero}` : "—", last?.version_app ? t("platform.status.databaseAt", { version: last.version_app }) : t("platform.status.database")];
}
function figuresHtml(state) {
  const companies = state.empresas ?? {};
  return platformLegacy.kpis([
    [escapeHtml(`v${platformLegacy.appVersion()}`), t("platform.status.appVersion")],
    sqlFigure((state.sql ?? [])[0]),
    [`${formatNumber(companies.activas ?? 0)} / ${formatNumber(companies.total ?? 0)}`, t("platform.status.activeCompanies")],
    [formatNumber(state.usuarios ?? 0), t("platform.status.activeUsers") + (state.portal ? t("platform.status.portalUsers", { count: formatNumber(state.portal) }) : "")],
    [formatNumber(state.errores ?? 0), t("platform.status.openErrors"), state.errores ? "aviso" : ""]
  ]);
}
function pageHtml3(state, error) {
  const test = platformLegacy.isTestEnvironment();
  return `<div class="card cfgpanel">
    ${error ? `<div class="banda-peligro">${t("platform.status.couldNotRead", { error: escapeHtml(errorMessage(error)) })}</div>` : ""}
    ${figuresHtml(state)}
    <h3 class="pdh3">${t("platform.status.versionsTitle")}</h3>
    ${versionsHtml(state.versiones ?? [])}
    <h3 class="pdh3">${t("platform.status.sqlTitle")}</h3>
    <div class="tablawrap"><table class="pdtabla"><thead><tr><th>SQL</th><th>${t("platform.status.version")}</th><th>${t("platform.status.whatChanges")}</th><th>${t("platform.status.applied")}</th></tr></thead><tbody>
      ${(state.sql ?? []).map((sql) => `<tr><td class="num">${sql.numero}</td><td>${escapeHtml(sql.version_app ?? "")}</td><td class="sm">${escapeHtml(sql.descripcion ?? "")}</td><td class="sm">${platformLegacy.shortDate(sql.aplicado_en)}</td></tr>`).join("")}</tbody></table></div>
    <p class="sm">${t(test ? "platform.status.footerTest" : "platform.status.footerProduction")}</p></div>`;
}
function routesHtml(use) {
  const config = use.config ?? {}, limit = Number(config.global) || ROUTES_DEFAULT_LIMIT, today = use.hoy ?? 0, off = config.activo === false, companies = use.empresas ?? [];
  return `<h3 class="pdh3">${t("platform.status.routesTitle")}</h3>
    ${platformLegacy.kpis([
    [`${formatNumber(today)} / ${formatNumber(limit)}`, t("platform.status.routesToday"), today >= limit * WARNING_SHARE ? "aviso" : ""],
    [formatNumber(use.mes ?? 0), t("platform.status.routesMonth")],
    [t(off ? "platform.status.off" : "platform.status.on"), t("platform.status.service"), off ? "aviso" : ""],
    [formatNumber(Number(config.por_usuario) || ROUTES_PER_USER), t("platform.status.perUser")]
  ])}
    ${companies.length ? `<div class="tablawrap"><table class="pdtabla"><thead><tr><th>${t("platform.billing.company")}</th><th class="num">${t("platform.status.today")}</th><th class="num">${t("platform.status.dailyLimit")}</th><th class="num">${t("platform.status.thisMonth")}</th></tr></thead><tbody>
      ${companies.map((item) => `<tr><td>${escapeHtml(item.nombre)}</td><td class="num" style="${item.hoy >= item.cupo ? "color:var(--warn);font-weight:700" : ""}">${formatNumber(item.hoy)}</td><td class="num">${formatNumber(item.cupo)}</td><td class="num">${formatNumber(item.mes)}</td></tr>`).join("")}</tbody></table></div>` : `<div class="vacio">${t("platform.status.noRoutes")}</div>`}`;
}
function addRoutes(box, use) {
  const card = box.querySelector(".card.cfgpanel");
  if (!card) return;
  const footer = [...card.querySelectorAll(":scope > p.sm")].pop();
  if (footer) footer.insertAdjacentHTML("beforebegin", routesHtml(use));
  else card.insertAdjacentHTML("beforeend", routesHtml(use));
}
async function paintStatus() {
  const start = panelBox();
  if (!start) return;
  start.innerHTML = platformLegacy.skeleton();
  const routes = Promise.resolve(callRpc("rutas_uso_resumen", {})).catch(() => ({ data: null }));
  const { data, error } = await callRpc("estado_plataforma", {});
  if (!stillOnTab("estado")) return;
  const box = panelBox();
  if (!box) return;
  box.innerHTML = pageHtml3(error ? {} : data ?? {}, error);
  const { data: use } = await routes;
  if (stillOnTab("estado") && use?.ok) addRoutes(box, use);
}

// src/app/screens/platform/template.ts
async function paintTemplate(section) {
  const box = panelBox();
  if (!box) return;
  if (!section) {
    box.innerHTML = `<div class="card cfgpanel"><h2>${t("platform.template.title")}</h2>
      <p class="sm">${t("platform.template.text")}</p>
      <div class="acts u-start"><button type="button" class="btn sec" data-plsub="roles">${t("platform.template.roles")}</button>
        <button type="button" class="btn sec" data-plsub="cat">${t("platform.template.catalogs")}</button></div></div>`;
    box.querySelectorAll("[data-plsub]").forEach((button) => {
      button.onclick = () => {
        void paintTemplate(button.dataset.plsub);
      };
    });
    return;
  }
  if (section === "roles") await platformLegacy.paintRoles();
  else {
    box.innerHTML = "";
    await platformLegacy.paintCatalogs();
  }
  const after = panelBox();
  if (!after || document.getElementById("plaviso")) return;
  after.insertAdjacentHTML("afterbegin", `<div class="banda-info" id="plaviso">${t("platform.template.notice")}
    <button type="button" class="btn sec" id="plvolver">${t("platform.template.back")}</button></div>`);
  const back = document.getElementById("plvolver");
  if (back) back.onclick = () => {
    void paintTemplate();
  };
}
export {
  paintBilling,
  paintCompanyErrors,
  paintOrganizations,
  paintPlatformErrors,
  paintRequests,
  paintSignups,
  paintStatus,
  paintTemplate
};
