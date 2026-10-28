// delcos-shared:src/app/i18n/index.ts
var shared = globalThis["__delcosModules"]["i18n/index"];
var pick = (name) => shared[name];
var registerMessages = /* @__PURE__ */ pick("registerMessages");
var t = /* @__PURE__ */ pick("t");

// src/app/i18n/es/chunks/settings-users/settings-rest.ts
var settingsRest = {
  users: {
    planUsers: "usuarios del plan {plan}",
    inactive: "sin actividad en 30 días",
    withAccess: "Cuentas con acceso",
    search: "Buscar por nombre o email",
    allRoles: "Todos los roles",
    active: "Activos",
    deactivatedPlural: "Desactivados",
    all: "Todos",
    newUser: "+ Nuevo usuario",
    guests: "Invitados",
    guestsHint: "{Professionals} y centros a los que has dado acceso a su portal. No cuentan como usuarios del plan. Con «Impersonalizar» abres una sesión con su usuario y ves su portal tal como lo verá.",
    nobody: "Nadie con estos filtros.",
    deactivated: "Desactivado",
    noCard: "Sin ficha",
    modules: "{count} módulos",
    inPortfolio: "en cartera",
    visitsMonth: "{visits} mes",
    lastActivity: "Última actividad registrada: {date}",
    noActivity: "Sin actividad registrada",
    openCard: "Abrir su ficha",
    yourCard: "Su ficha",
    notYet: "Aún no ha entrado",
    impersonate: "👤 Impersonalizar",
    details: "Detalles",
    noGuests: "Todavía no has dado acceso a nadie. Se da desde su ficha: «Acceso a la plataforma» → «Dar acceso»."
  },
  detail: {
    whatCanDo: "Qué puede ver y hacer",
    seesAmounts: "Ve los importes de las ventas.",
    unitsOnly: "En ventas solo ve unidades, no importes.",
    activity: "Actividad",
    linkedTo: "Vinculado a <b>{name}</b>.",
    noCardLinked: "ninguna ficha",
    visitsThisMonth: "{visits} este mes",
    zone: "Zona: {zones}",
    lastActivity: "Última actividad: {when}",
    noneRecorded: "ninguna registrada",
    edit: "✏️ Editar rol, permisos y zona",
    assignPortfolio: "🗂️ Asignar cartera",
    accessData: "Datos de acceso",
    sendPassword: "🔑 Enviar cambio de contraseña",
    resendActivation: "📧 Reenviar el correo de activación",
    deleteUser: "🗑 Borrar usuario",
    modules: {
      inicio: "Inicio",
      agenda: "Agenda",
      rutas: "Rutas",
      ventas: "Pedidos",
      pacientes: "Clientes",
      productos: "Productos",
      facturacion: "Facturación",
      analitica: "Analítica",
      seguimiento: "Calidad del dato"
    }
  },
  editor: {
    name: "Nombre",
    user: "Usuario",
    role: "Rol",
    state: "Estado",
    active: "Activo",
    deactivated: "Desactivado",
    areaPermissions: "Permisos por área",
    cancel: "Cancelar",
    save: "Guardar",
    saving: "Guardando…",
    couldNotSave: "No se ha podido guardar",
    savedButSees: "Usuario guardado, pero no se ha podido guardar qué ve de su comisión: {error}",
    savedButZone: "Usuario guardado, pero no se ha podido guardar la zona",
    zoneSaved: " · zona guardada, {count} {newProfessionals} en su cartera",
    saved: "Usuario guardado",
    linkedCard: "Ficha de {professional} vinculada",
    linkedHint: "Este usuario verá solo el informe de {thisProfessional} y recibirá un aviso con cada {guideline} registrada. Sin importes ni datos de {patients}.",
    saveLink: "Guardar vínculo",
    seeReport: "Ver su informe",
    findCard: "Busca su ficha",
    linkedWith: "Vinculado con {name}",
    linkRemoved: "Vínculo quitado",
    report: "{name}: {units} unidades, {count} {guidelines} este año",
    position: " · Nº {position}"
  },
  commission: {
    title: "Comisión",
    scheme: "Esquema",
    none: "Sin comisión",
    whatSees: "Qué ve esa persona",
    nothing: "Nada",
    unitsOnly: "Solo sus unidades",
    unitsAndAmount: "Unidades e importe",
    applies: "Se aplica",
    fromToday: "A partir de hoy",
    wholeHistory: "A todo su histórico (hacia atrás)",
    fromDate: "A partir de una fecha concreta",
    date: "Fecha",
    history: "Historial: {list}",
    since: "{scheme} desde {from}",
    until: " hasta {to}",
    info: "Comisión: <b>{scheme}</b>. Se asigna dentro de cada esquema en Configuración → Equipo → Comisiones.",
    seesHint: "Lo que ve en Inicio de su comisión: nada, solo sus unidades o también el importe."
  },
  zones: {
    title: "Zona de trabajo",
    hint: "Marca las provincias de su zona. Al guardar, {theProfessionals} de esas provincias que no tengan comercial entran en su cartera, y los que se den de alta después entran solos. Solo verá {theProfessionals} de su cartera.",
    save: "Guardar zona y asignar sus {professionals}",
    couldNotSave: "No se ha podido guardar la zona",
    saved: "Zona guardada · {count} {newProfessionals} en su cartera",
    elsewhere: " · {count} de su zona están en otra cartera"
  },
  newUser: {
    title: "Nuevo usuario",
    subtitle: "Se crea con una contraseña temporal que deberá cambiar",
    name: "Nombre",
    namePlaceholder: "Nombre y apellidos",
    email: "Correo",
    emailPlaceholder: "nombre@empresa.com",
    role: "Rol",
    password: "Contraseña temporal",
    cancel: "Cancelar",
    create: "Crear usuario",
    creating: "Creando…",
    complete: "Completa nombre, correo y contraseña",
    couldNotInvite: "No se ha podido invitar: {error}",
    couldNotCreate: "No se ha podido crear: {error}",
    created: '<b class="u-ok">Usuario creado.</b> Contraseña temporal: <b>{password}</b>.\n      Pásasela y que la cambie al entrar. Si Supabase tiene activada la confirmación por correo, deberá confirmarlo primero.',
    fromDirectory: "{Professional} del directorio",
    directoryHint: "Tendrá acceso solo a su informe y a sus avisos. No cuenta como usuario del plan.",
    findProfessional: "Busca {toTheProfessional}",
    planLimit: "Tu plan {plan} permite {max} usuarios. Añade usuarios en «Plan y suscripción» (menú de tu nombre).",
    chooseProfessional: "Elige {theProfessional} del directorio",
    linked: " Vinculado a <b>{name}</b>.",
    notLinked: ' <span class="campoerr"><b>No se ha podido vincular a {name}.</b> Hazlo en Configuración → Usuarios → su ficha → «Ficha de {professional} vinculada»; sin vínculo su portal no muestra nada.</span>',
    doneTitle: "✓ Usuario creado",
    doneSubtitle: "Pásale estos datos para que entre",
    role2: "Rol",
    user: "Usuario",
    address: "Dirección",
    confirmEmail: "Si la confirmación por correo está activada, primero deberá confirmar su email.",
    copy: "Copiar los datos",
    done: "Hecho",
    copied: "Copiado: pégalo en un mensaje",
    couldNotCopy: "No se ha podido copiar",
    message: "Hola {name}, ya tienes acceso a {app}.\nEntra en {url}\nUsuario: {email}\nContraseña temporal: {password}\nCámbiala al entrar (menú de tu nombre → Mi perfil)."
  },
  access: {
    title: "Datos de acceso",
    unreadable: "No se han podido leer sus datos de acceso.",
    alreadyIn: "Ya ha entrado en la plataforma, así que su contraseña temporal ya no sirve. Si no la recuerda, envíale el cambio de contraseña.",
    noData: "No hay datos de acceso guardados: se dio de alta antes de que se guardaran o con otro método. Envíale el cambio de contraseña para que ponga una.",
    noPermission: "No tienes permiso para ver sus datos de acceso.",
    sendPassword: "Enviar cambio de contraseña",
    close: "Cerrar",
    notYet: "Aún no ha entrado. Cuando entre por primera vez y cambie la contraseña, estos datos dejan de estar aquí."
  },
  remove: {
    title: "Borrar a {name}",
    intro: "Se borran su usuario y su acceso, sus notificaciones y avisos, y sus citas pendientes. Su cartera queda libre para asignarla a otra persona.",
    activity: "Borrar también su actividad: {visits}, llamadas, citas pasadas y rutas propias.",
    activityHint: "Pensado para usuarios de prueba. Si era alguien del equipo, déjalo sin marcar para conservar el historial.",
    never: "Nunca se borran pedidos, facturas, cobros, comisiones liquidadas ni el registro de cambios. No se puede deshacer.",
    confirmLabel: "Escribe BORRAR para confirmar",
    confirmWord: "BORRAR",
    cancel: "Cancelar",
    ok: "Borrar usuario",
    typeIt: "Escribe BORRAR en el recuadro para confirmar.",
    typeItShort: "Escribe BORRAR para confirmar",
    failed: "No se ha podido borrar: {reason}",
    noAnswer: "sin respuesta",
    reasons: {
      permiso: "Solo administración puede borrar usuarios",
      unoMismo: "No puedes borrarte a ti",
      ultimoAdmin: "Es el último administrador: da antes ese rol a otra persona",
      noExiste: "Ese usuario ya no existe",
      referencias: "hay datos que dependen de esta persona ({detail})"
    },
    doneNoAccess: "Usuario borrado (su acceso queda sin perfil: ya no puede usar la plataforma)",
    done: "Usuario borrado",
    log: "Borrar usuario: {error}"
  }
};

// src/app/i18n/es/chunks/settings-users/index.ts
var texts = { settingsRest };

// src/app/screens/settings/users/texts.ts
registerMessages(texts);

// delcos-shared:src/app/legacy/bridge.ts
var shared2 = globalThis["__delcosModules"]["legacy/bridge"];
var pick2 = (name) => shared2[name];
var accessLegacy = /* @__PURE__ */ pick2("accessLegacy");
var accountListLegacy = /* @__PURE__ */ pick2("accountListLegacy");
var agendaActions = /* @__PURE__ */ pick2("agendaActions");
var callRpc = /* @__PURE__ */ pick2("callRpc");
var cardSectionsLegacy = /* @__PURE__ */ pick2("cardSectionsLegacy");
var currentScreen = /* @__PURE__ */ pick2("currentScreen");
var editorLegacy = /* @__PURE__ */ pick2("editorLegacy");
var icon = /* @__PURE__ */ pick2("icon");
var initialsOf = /* @__PURE__ */ pick2("initialsOf");
var legacyDb = /* @__PURE__ */ pick2("legacyDb");
var notices = /* @__PURE__ */ pick2("notices");
var term = /* @__PURE__ */ pick2("term");

// delcos-shared:src/app/legacy/settings3-bridge.ts
var shared3 = globalThis["__delcosModules"]["legacy/settings3-bridge"];
var pick3 = (name) => shared3[name];
var settingsExtraLegacy = /* @__PURE__ */ pick3("settingsExtraLegacy");

// delcos-shared:src/app/services/format.ts
var shared4 = globalThis["__delcosModules"]["services/format"];
var pick4 = (name) => shared4[name];
var escapeHtml = /* @__PURE__ */ pick4("escapeHtml");
var formatNumber = /* @__PURE__ */ pick4("formatNumber");

// delcos-shared:src/app/screens/access/index.ts
var shared5 = globalThis["__delcosModules"]["screens/access/index"];
var pick5 = (name) => shared5[name];
var resendActivation = /* @__PURE__ */ pick5("resendActivation");
var resetPassword = /* @__PURE__ */ pick5("resetPassword");

// delcos-shared:src/app/screens/settings/users/model.ts
var shared6 = globalThis["__delcosModules"]["screens/settings/users/model"];
var pick6 = (name) => shared6[name];
var PRESCRIBER = /* @__PURE__ */ pick6("PRESCRIBER");
var dialog = /* @__PURE__ */ pick6("dialog");
var dialogBody = /* @__PURE__ */ pick6("dialogBody");
var ensureUser = /* @__PURE__ */ pick6("ensureUser");
var input = /* @__PURE__ */ pick6("input");
var isPrescriber = /* @__PURE__ */ pick6("isPrescriber");
var roleColour = /* @__PURE__ */ pick6("roleColour");
var roleOptions = /* @__PURE__ */ pick6("roleOptions");
var userById = /* @__PURE__ */ pick6("userById");
var userFilters = /* @__PURE__ */ pick6("userFilters");
var valueOf = /* @__PURE__ */ pick6("valueOf");
var withOldNames = /* @__PURE__ */ pick6("withOldNames");
var words = /* @__PURE__ */ pick6("words");

// src/app/screens/settings/users/access.ts
var appUrl = () => location.origin + location.pathname;
var headerHtml = (title, user) => `<div class="fh"><div><h2>${escapeHtml(title)}</h2><div class="sm">${escapeHtml(user.nombre ?? "")} · ${escapeHtml(user.email ?? "")}</div></div><button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>`;
var welcomeText = (name, email, password) => t("settingsRest.newUser.message", { name: settingsExtraLegacy.firstName(name), app: settingsExtraLegacy.appName(), url: appUrl(), email, password });
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    notices.toast(t("settingsRest.newUser.copied"));
  } catch {
    notices.toast(t("settingsRest.newUser.couldNotCopy"), true);
  }
}
function accessDataHtml(data) {
  const linked = data.vinculado ? `<div><span>${term("medico", { capital: "C", adjective: "vinculado" })}</span><b>${escapeHtml(data.vinculado)}</b></div>` : "";
  return `<div class="usrok"><div><span>${t("settingsRest.newUser.name")}</span><b>${escapeHtml(data.nombre)}</b></div><div><span>${t("settingsRest.newUser.role2")}</span><b>${escapeHtml(data.rol)}</b></div>
      <div><span>${t("settingsRest.newUser.user")}</span><b>${escapeHtml(data.email)}</b></div><div><span>${t("settingsRest.newUser.password")}</span><b class="mono">${escapeHtml(data.pass)}</b></div>
      ${linked}<div><span>${t("settingsRest.newUser.address")}</span><b>${escapeHtml(appUrl())}</b></div></div>`;
}
var REASONS = /* @__PURE__ */ new Map([["ya_entro", "settingsRest.access.alreadyIn"], ["sin_datos", "settingsRest.access.noData"]]);
function paintFailure(body, user, result) {
  const text = result ? t(REASONS.get(result.error ?? "") ?? "settingsRest.access.noPermission") : t("settingsRest.access.unreadable");
  const canSend = result && result.error !== "permiso";
  body.innerHTML = `${headerHtml(t("settingsRest.access.title"), user)}<p>${escapeHtml(text)}</p>
      <div class="acts u-end u-wrap">${canSend ? `<button class="btn sec" id="accpass">${t("settingsRest.access.sendPassword")}</button>` : ""}<button class="btn" data-cerrar>${t("settingsRest.access.close")}</button></div>`;
  const send = document.getElementById("accpass");
  if (send) send.onclick = () => {
    dialog()?.close();
    void resetPassword(user);
  };
}
async function showTemporaryAccess(user) {
  const { data: result } = await callRpc("ver_acceso_temporal", { p_usuario: user.id });
  const body = dialogBody();
  if (!body) return;
  if (!result?.ok) {
    paintFailure(body, user, result);
    return;
  }
  const data = { nombre: result.nombre ?? "", rol: result.rol ?? "", email: result.email ?? "", pass: result.pass ?? "", vinculado: result.cuenta ?? null };
  body.innerHTML = `${headerHtml(t("settingsRest.access.title"), user)}
    ${accessDataHtml(data)}
    <p class="sm">${t("settingsRest.access.notYet")}</p>
    <div class="acts u-end u-wrap"><button class="btn sec" id="acccop">${t("settingsRest.newUser.copy")}</button><button class="btn" data-cerrar>${t("settingsRest.newUser.done")}</button></div>`;
  const copy = document.getElementById("acccop");
  if (copy) copy.onclick = () => {
    void copyText(welcomeText(data.nombre, data.email, data.pass));
  };
}

// delcos-shared:src/app/legacy/settings1-bridge.ts
var shared7 = globalThis["__delcosModules"]["legacy/settings1-bridge"];
var pick7 = (name) => shared7[name];
var settingsLegacy = /* @__PURE__ */ pick7("settingsLegacy");

// delcos-shared:src/app/legacy/settings4-bridge.ts
var shared8 = globalThis["__delcosModules"]["legacy/settings4-bridge"];
var pick8 = (name) => shared8[name];
var planLegacy = /* @__PURE__ */ pick8("planLegacy");
var usersLegacy = /* @__PURE__ */ pick8("usersLegacy");

// delcos-shared:src/app/screens/settings/more/access-log.ts
var shared9 = globalThis["__delcosModules"]["screens/settings/more/access-log"];
var pick9 = (name) => shared9[name];
var connectionText = /* @__PURE__ */ pick9("connectionText");

// delcos-shared:src/app/services/dates.ts
var shared10 = globalThis["__delcosModules"]["services/dates"];
var pick10 = (name) => shared10[name];
var toIsoDate = /* @__PURE__ */ pick10("toIsoDate");
var todayIso = /* @__PURE__ */ pick10("todayIso");

// delcos-shared:src/app/services/date-format.ts
var shared11 = globalThis["__delcosModules"]["services/date-format"];
var pick11 = (name) => shared11[name];
var formatShortDate = /* @__PURE__ */ pick11("formatShortDate");

// delcos-shared:src/app/services/values.ts
var shared12 = globalThis["__delcosModules"]["services/values"];
var pick12 = (name) => shared12[name];
var orFallback = /* @__PURE__ */ pick12("orFallback");
var sum = /* @__PURE__ */ pick12("sum");

// src/app/screens/settings/users/commission.ts
var SEES = [["nada", "nothing"], ["unidades", "unitsOnly"], ["importe", "unitsAndAmount"]];
async function schemes() {
  if (!usersLegacy.schemes().length) {
    const { data } = await legacyDb().rpc("esquemas_lista");
    usersLegacy.setSchemes(data ?? []);
  }
  return usersLegacy.schemes();
}
function historyText(list) {
  if (!list.length) return "";
  return t("settingsRest.commission.history", { list: list.map((item) => escapeHtml(t("settingsRest.commission.since", { scheme: item.esquema, from: formatShortDate(item.desde) })) + (item.hasta ? escapeHtml(t("settingsRest.commission.until", { to: formatShortDate(item.hasta) })) : "")).join(" · ") });
}
function commissionHtml(list, current, sees, history) {
  const options = list.map((scheme) => `<option value="${scheme.id}" ${current?.id === scheme.id ? "selected" : ""}>${escapeHtml(scheme.nombre)}</option>`).join("");
  const seesOptions = SEES.map(([value, key]) => `<option value="${value}" ${sees === value ? "selected" : ""}>${t(`settingsRest.commission.${key}`)}</option>`).join("");
  return `<label>${t("settingsRest.commission.title")}</label>
    <div class="g2 hide">
      <div><label class="sm" for="ucom">${t("settingsRest.commission.scheme")}</label><select id="ucom" data-orig="${current?.id ?? ""}">
        <option value="">${t("settingsRest.commission.none")}</option>
        ${options}
      </select></div>
    </div><div class="avisoh" id="ucominfo"><span>${t("settingsRest.commission.info", { scheme: escapeHtml(current?.nombre ?? t("settingsRest.commission.none")) })}</span></div><div id="uvercw"><label for="uverc">${t("settingsRest.commission.whatSees")}</label><select id="uverc">
        ${seesOptions}
      </select><div class="sm">${t("settingsRest.commission.seesHint")}</div></div><div class="g2 hide" id="ucdesde">
      <div><label class="sm" for="ucdm">${t("settingsRest.commission.applies")}</label><select id="ucdm">
        <option value="hoy">${t("settingsRest.commission.fromToday")}</option><option value="todo">${t("settingsRest.commission.wholeHistory")}</option><option value="fecha">${t("settingsRest.commission.fromDate")}</option></select></div>
      <div><label class="sm" for="ucdf">${t("settingsRest.commission.date")}</label><input id="ucdf" type="date" value="${todayIso()}" disabled></div></div>
      <div class="sm hide" id="uchist">${history}</div>`;
}
async function paintCommission(user) {
  const [list, { data: profile }, { data: history }] = await Promise.all([
    schemes(),
    legacyDb().from("perfiles").select("comision_ver").eq("id", user.id).maybeSingle(),
    callRpc("historial_esquemas", { p_usuario: user.id })
  ]);
  const sees = orFallback(orFallback(profile?.comision_ver, user.comision_ver ?? ""), "nada");
  user.comision_ver = sees;
  const zone = document.getElementById("ucomzona");
  if (!zone) return;
  zone.innerHTML = commissionHtml(list, list.find((scheme) => (scheme.personas ?? []).includes(user.nombre)), sees, historyText(history ?? []));
  const mode = document.getElementById("ucdm"), date = document.getElementById("ucdf");
  if (mode && date) mode.onchange = () => {
    date.disabled = mode.value !== "fecha";
  };
}

// delcos-shared:src/app/core/organisation.ts
var shared13 = globalThis["__delcosModules"]["core/organisation"];
var pick13 = (name) => shared13[name];
var organisationCountry = /* @__PURE__ */ pick13("organisationCountry");

// src/app/screens/settings/users/zones.ts
var PREFIX = 4;
var pretty = (province) => province.charAt(0) + province.slice(1).toLowerCase();
var markedZones = () => [...dialogBody()?.querySelectorAll("#uzonas [data-zp]:checked") ?? []].map((box) => box.dataset.zp ?? "").sort();
async function provinces() {
  const known = usersLegacy.provinces();
  if (known) return known;
  const [{ data: regions }, { data: counts }] = await Promise.all([
    legacyDb().from("provincias_ccaa").select("*"),
    legacyDb().rpc("zonas_resumen")
  ]);
  const byProvince = new Map((counts ?? []).map((item) => [item.provincia, item.medicos]));
  const result = {}, country = organisationCountry().toLowerCase();
  (regions ?? []).filter((item) => !item.pais || item.pais.toLowerCase() === country).forEach((item) => {
    var _a;
    (result[_a = item.comunidad] ?? (result[_a] = [])).push({ p: item.provincia, n: byProvince.get(item.provincia) ?? 0 });
  });
  usersLegacy.setProvinces(result);
  return result;
}
var shownOf = (list, marked) => list.filter((item, index, all) => all.findIndex((other) => other.n === item.n && pretty(other.p).slice(0, PREFIX) === pretty(item.p).slice(0, PREFIX)) === index || item.n > 0 || marked.has(item.p));
function regionHtml(region, list, marked) {
  const shown = shownOf(list, marked);
  return `<details ${shown.some((item) => marked.has(item.p)) ? "open" : ""}><summary><label><input type="checkbox" data-zcc="${escapeHtml(region)}" ${shown.every((item) => marked.has(item.p)) ? "checked" : ""}> ${escapeHtml(region)}</label>
        <span class="sm">${formatNumber(sum(shown.map((item) => item.n)))} ${words().professionals}</span></summary>
        <div class="zprov">${shown.map((item) => `<label><input type="checkbox" data-zp="${escapeHtml(item.p)}" data-zpc="${escapeHtml(region)}" ${marked.has(item.p) ? "checked" : ""}> ${escapeHtml(pretty(item.p))} <span class="sm">${formatNumber(item.n)}</span></label>`).join("")}</div></details>`;
}
async function zonesHtml(user) {
  const all = await provinces();
  const { data: me } = await legacyDb().from("perfiles").select("zonas").eq("id", user.id).single();
  const marked = new Set(me?.zonas ?? []);
  return `<div class="blk" id="uzonas"><h3>${t("settingsRest.zones.title")}</h3>
    <p class="sm">${t("settingsRest.zones.hint", words())}</p>
    <div class="zonas">${Object.keys(all).sort().map((region) => regionHtml(region, all[region] ?? [], marked)).join("")}</div>
    <div class="acts u-mt-8"><button class="btn sec" id="uzok">${t("settingsRest.zones.save", words())}</button></div></div>`;
}
async function saveZones(userId, button) {
  const zones = markedZones();
  button.disabled = true;
  const { data: result, error } = await legacyDb().rpc("asignar_zona", { p_usuario: userId, p_zonas: zones });
  button.disabled = false;
  if (error || result?.ok === false) {
    notices.toast(t("settingsRest.zones.couldNotSave"), true);
    return;
  }
  const box = document.getElementById("uzonas");
  if (box) box.dataset.orig = zones.join("|");
  const elsewhere = result?.en_otra_cartera ? t("settingsRest.zones.elsewhere", { count: formatNumber(result.en_otra_cartera) }) : "";
  notices.toast(t("settingsRest.zones.saved", { ...words(), count: formatNumber(result?.asignados) }) + elsewhere);
}
function bindZones(userId) {
  const body = dialogBody();
  if (!body) return;
  body.querySelectorAll("[data-zcc]").forEach((region) => {
    region.onchange = () => {
      body.querySelectorAll(`[data-zpc="${CSS.escape(region.dataset.zcc ?? "")}"]`).forEach((box) => {
        box.checked = region.checked;
      });
    };
    region.closest("label")?.addEventListener("click", (event) => {
      event.stopPropagation();
    });
  });
  const save2 = document.getElementById("uzok");
  if (save2) save2.onclick = () => {
    void saveZones(userId, save2);
  };
}
async function paintZones(user) {
  const role = document.getElementById("ur")?.value ?? user.rol;
  if (!usersLegacy.roleCan(role, "cartera") || document.getElementById("uzonas")) return;
  const html = await zonesHtml(user);
  const place = document.getElementById("ucomzona") ?? dialogBody()?.querySelector(".acts:last-of-type");
  if (place && dialog()?.open && !document.getElementById("uzonas")) place.insertAdjacentHTML("beforebegin", html);
  const box = document.getElementById("uzonas");
  if (box) box.dataset.orig = markedZones().join("|");
  bindZones(user.id);
}
function followRole(user) {
  const select = document.getElementById("ur");
  if (!select || select.dataset.zona) return;
  select.dataset.zona = "1";
  select.addEventListener("change", () => {
    const box = document.getElementById("uzonas");
    if (box) box.classList.toggle("hide", !usersLegacy.roleCan(select.value, "cartera"));
    else void paintZones(user);
  });
}

// src/app/screens/settings/users/editor.ts
var LOADING_MAX_MS = 8e3;
var HISTORY_START = "2000-01-01";
function editorHtml(user) {
  const areas = user.areas ?? {};
  const levels = (key) => usersLegacy.levels().map((name, index) => `<option value="${index}" ${Number(areas[key] ?? 0) === index ? "selected" : ""}>${name}</option>`).join("");
  return `
    <div class="fh"><div><h2>${escapeHtml(user.nombre)}</h2><div class="sm">${escapeHtml(user.email ?? "")}</div></div>
      <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>
    <div class="g2">
      <div><label for="un">${t("settingsRest.editor.name")}</label><input id="un" value="${escapeHtml(user.nombre)}"></div>
      <div><label for="uu">${t("settingsRest.editor.user")}</label><input id="uu" value="${escapeHtml(user.usuario ?? "")}"></div>
    </div>
    <div class="g2">
      <div><label for="ur">${t("settingsRest.editor.role")}</label><select id="ur">${roleOptions(user.rol)}</select></div>
      <div><label for="ua">${t("settingsRest.editor.state")}</label><select id="ua">
        <option value="1" ${user.activo ? "selected" : ""}>${t("settingsRest.editor.active")}</option>
        <option value="0" ${user.activo ? "" : "selected"}>${t("settingsRest.editor.deactivated")}</option></select></div>
    </div>
    <label>${t("settingsRest.editor.areaPermissions")}</label>
    ${usersLegacy.areas().map(([key, title]) => `<div class="dprow" style="grid-template-columns:130px minmax(0,1fr)"><b>${title}</b>
      <select data-area="${key}">${levels(key)}</select></div>`).join("")}
    <div id="ucomzona"></div>
    <div class="acts u-end">
      <button class="btn sec" data-cerrar>${t("settingsRest.editor.cancel")}</button>
      <button class="btn" id="uguardar">${t("settingsRest.editor.save")}</button>
    </div>`;
}
function presetOnRoleChange(body) {
  const role = document.getElementById("ur");
  if (!role) return;
  role.onchange = () => {
    const changes = (settingsExtraLegacy.setting("roles") ?? {})[role.value] ?? {};
    const preset = { ...usersLegacy.role(role.value)?.plantilla ?? {}, ...changes };
    usersLegacy.areas().forEach(([key]) => {
      const select = body.querySelector(`[data-area="${key}"]`);
      if (select) select.value = String(preset[key] ?? 0);
    });
  };
}
var startDate = (mode) => mode === "todo" ? HISTORY_START : mode === "fecha" ? valueOf("ucdf") || todayIso() : todayIso();
async function saveCommission(id) {
  const scheme = input("ucom");
  if (!scheme) return true;
  const mode = input("ucdm")?.value ?? "hoy";
  if (scheme.value !== (scheme.dataset.orig ?? "") || mode !== "hoy") {
    await legacyDb().rpc("asignar_esquema", { p_usuario: id, p_esquema: scheme.value || null, p_quitar: !scheme.value, p_desde: startDate(mode) });
  }
  const { error } = await legacyDb().from("perfiles").update({ comision_ver: valueOf("uverc") }).eq("id", id);
  if (error) {
    notices.toast(t("settingsRest.editor.savedButSees", { error: error.message ?? "" }), true);
    return false;
  }
  return true;
}
async function saveZone(id) {
  const box = document.getElementById("uzonas");
  if (!box || box.classList.contains("hide") || markedZones().join("|") === (box.dataset.orig ?? "")) return "";
  const { data: result, error } = await legacyDb().rpc("asignar_zona", { p_usuario: id, p_zonas: markedZones() });
  if (error || result?.ok === false) {
    notices.toast(t("settingsRest.editor.savedButZone"), true);
    return null;
  }
  return t("settingsRest.editor.zoneSaved", { ...words(), count: formatNumber(result?.asignados) });
}
async function save(id, body, button) {
  const areas = {};
  usersLegacy.areas().forEach(([key]) => {
    areas[key] = Number(body.querySelector(`[data-area="${key}"]`)?.value);
  });
  button.disabled = true;
  button.textContent = t("settingsRest.editor.saving");
  const { data: result, error } = await legacyDb().rpc("guardar_perfil", { p: {
    id,
    nombre: valueOf("un").trim(),
    usuario: valueOf("uu").trim(),
    rol: valueOf("ur"),
    activo: valueOf("ua") === "1",
    areas
  } });
  button.disabled = false;
  button.textContent = t("settingsRest.editor.save");
  if (error || result?.ok === false) {
    notices.toast(t("settingsRest.editor.couldNotSave"), true);
    return;
  }
  if (!await saveCommission(id)) return;
  const zone = await saveZone(id);
  if (zone === null) return;
  dialog()?.close();
  notices.toast(t("settingsRest.editor.saved") + zone);
  usersLegacy.reloadAdmin();
}
async function linkedProfessional(id) {
  const { data: profile } = await legacyDb().from("perfiles").select("cuenta_id").eq("id", id).single();
  if (!profile?.cuenta_id) return null;
  const { data: card } = await legacyDb().rpc("ficha_cuenta", { p_id: profile.cuenta_id });
  return card?.medico ? { id: card.medico.id, nombre: card.medico.nombre } : null;
}
function linkedHtml(linked) {
  return `<div class="blk" id="umedw"><h3>${t("settingsRest.editor.linkedCard", words())}</h3>
    <p class="sm">${t("settingsRest.editor.linkedHint", words())}</p>
    <div id="umedsel"></div><div class="acts u-mt-8"><button class="btn sec" id="umedok">${t("settingsRest.editor.saveLink")}</button>
    ${linked ? `<button class="btn sec" id="umedver">${t("settingsRest.editor.seeReport")}</button>` : ""}</div></div>`;
}
async function showReport(linked) {
  const { data } = await callRpc("informe_cuenta", { p_medico: linked.id });
  const position = data?.posicion ? t("settingsRest.editor.position", { position: data.posicion }) : "";
  notices.toast(t("settingsRest.editor.report", { ...words(), name: linked.nombre ?? "", units: formatNumber(data?.unidades), count: formatNumber(data?.pautas) }) + position);
}
async function paintLinkedCard(user) {
  if (!isPrescriber(user) || !dialog()?.open || document.getElementById("umedw")) return;
  let linked = await linkedProfessional(user.id);
  dialogBody()?.querySelector(".acts:last-of-type")?.insertAdjacentHTML("beforebegin", linkedHtml(linked));
  editorLegacy.pickAccount(document.getElementById("umedsel"), linked, (account) => {
    linked = account;
  }, t("settingsRest.editor.findCard"));
  const ok = document.getElementById("umedok");
  if (ok) ok.onclick = async () => {
    const { data: result, error } = await legacyDb().rpc("vincular_cuenta", { p_usuario: user.id, p_medico: linked ? linked.id : null });
    if (error || result?.ok === false) {
      notices.toast(t("settingsRest.editor.couldNotSave"), true);
      return;
    }
    notices.toast(linked ? t("settingsRest.editor.linkedWith", { name: linked.nombre ?? "" }) : t("settingsRest.editor.linkRemoved"));
  };
  const report = document.getElementById("umedver");
  if (report) report.onclick = () => {
    if (linked) void showReport(linked);
  };
}
async function paintParts(user) {
  await paintCommission(user);
  if (!dialog()?.open) return;
  followRole(user);
  await paintZones(user);
  await paintLinkedCard(user);
}
async function editUser(id) {
  await ensureUser(id);
  const box = dialog(), body = dialogBody(), user = userById(id);
  if (!box || !body || !user) return;
  box.classList.add("cargando");
  const limit = setTimeout(() => {
    box.classList.remove("cargando");
  }, LOADING_MAX_MS);
  try {
    body.innerHTML = editorHtml(user);
    presetOnRoleChange(body);
    const ok = document.getElementById("uguardar");
    if (ok) ok.onclick = () => {
      void save(id, body, ok);
    };
    if (!box.open) box.showModal();
    await paintParts(user);
  } finally {
    clearTimeout(limit);
    requestAnimationFrame(() => {
      box.classList.remove("cargando");
    });
  }
}

// src/app/screens/settings/users/remove.ts
var REASONS2 = /* @__PURE__ */ new Map([
  ["permiso", "settingsRest.remove.reasons.permiso"],
  ["uno_mismo", "settingsRest.remove.reasons.unoMismo"],
  ["ultimo_admin", "settingsRest.remove.reasons.ultimoAdmin"],
  ["no_existe", "settingsRest.remove.reasons.noExiste"]
]);
var EXPECTED = ["permiso", "uno_mismo", "ultimo_admin"];
function reasonOf(result, error) {
  const code = result?.error ?? "";
  if (code === "referencias") return t("settingsRest.remove.reasons.referencias", { detail: result?.detalle ?? "" });
  const known = REASONS2.get(code);
  return known ? t(known) : error?.message ?? t("settingsRest.remove.noAnswer");
}
function showError(text) {
  let box = document.getElementById("buerr");
  if (!box) {
    document.getElementById("buok")?.closest(".acts")?.insertAdjacentHTML("beforebegin", '<p class="buerr" id="buerr" role="alert"></p>');
    box = document.getElementById("buerr");
  }
  if (box) box.textContent = text;
}
function failed(result, error) {
  const text = t("settingsRest.remove.failed", { reason: reasonOf(result, error) });
  showError(text);
  notices.toast(text, true);
  if (!result || !EXPECTED.includes(result.error ?? "")) {
    usersLegacy.logError(t("settingsRest.remove.log", { error: result?.error ?? error?.message ?? t("settingsRest.remove.noAnswer") }), { detalle: result?.detalle });
  }
}
async function confirmDelete(user, button) {
  if (input("buconf")?.value.trim().toUpperCase() !== t("settingsRest.remove.confirmWord")) {
    showError(t("settingsRest.remove.typeIt"));
    notices.toast(t("settingsRest.remove.typeItShort"), true);
    return;
  }
  button.disabled = true;
  const { data: result, error } = await legacyDb().rpc("borrar_usuario_seguro", { p_id: user.id, p_con_actividad: Boolean(input("bucon")?.checked) });
  button.disabled = false;
  if (error || !result?.ok) {
    failed(result, error);
    return;
  }
  dialog()?.close();
  notices.toast(t(String(result.acceso ?? "").startsWith("no_borrado") ? "settingsRest.remove.doneNoAccess" : "settingsRest.remove.done"));
  usersLegacy.reloadAdmin();
  if (currentScreen() === "config" && usersLegacy.settingsKey() === "usuarios") usersLegacy.repaintList();
}
function deleteUser(user) {
  const body = dialogBody();
  if (!body) return;
  body.innerHTML = `<div class="fh"><div><h2>${escapeHtml(t("settingsRest.remove.title", { name: user.nombre || (user.email ?? "") }))}</h2><div class="sm">${escapeHtml(user.email ?? "")}</div></div>
      <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>
    <p>${t("settingsRest.remove.intro")}</p>
    <label class="chk" style="display:flex;gap:8px;align-items:flex-start;margin:10px 0"><input type="checkbox" id="bucon" style="margin-top:3px">
      <span>${t("settingsRest.remove.activity", words())}<br><span class="sm">${t("settingsRest.remove.activityHint")}</span></span></label>
    <p class="sm">${t("settingsRest.remove.never")}</p>
    <label for="buconf">${t("settingsRest.remove.confirmLabel")}</label><input id="buconf" autocomplete="off">
    <div class="acts u-end"><button class="btn sec" data-cerrar>${t("settingsRest.remove.cancel")}</button><button class="btn dang" id="buok">${t("settingsRest.remove.ok")}</button></div>`;
  dialog()?.showModal();
  const ok = document.getElementById("buok");
  if (ok) ok.onclick = () => {
    void confirmDelete(user, ok);
  };
}

// src/app/screens/settings/users/detail.ts
var MODULE_ORDER = ["inicio", "agenda", "rutas", "directorio", "ventas", "pacientes", "productos", "facturacion", "analitica", "seguimiento"];
var FULL_LEVEL = 3;
var moduleName = (module) => module === "directorio" ? accountListLegacy.contactsLabel() : t(`settingsRest.detail.modules.${module}`);
function permissionsHtml(user) {
  const area = usersLegacy.moduleArea(), admin = usersLegacy.roleCan(user.rol, "administrar");
  const level = (module) => admin ? FULL_LEVEL : Number(user.areas?.[area[module] ?? ""] ?? 0);
  const amounts = admin || Number(user.areas?.E ?? 0) >= 1;
  const rows = MODULE_ORDER.filter((module) => module in area).map((module) => {
    const value = level(module);
    return `<div class="permfila ${value ? "" : "no"}">
        <span class="permmod">${icon(value ? "check" : "minus")}${escapeHtml(moduleName(module))}</span><span class="permniv nv${value}">${escapeHtml(usersLegacy.levelText(value))}</span></div>`;
  }).join("");
  return `<div class="blk"><h3>${t("settingsRest.detail.whatCanDo")}</h3>
      <div class="permtabla">${rows}</div>
      <div class="sm u-mt-8">${t(amounts ? "settingsRest.detail.seesAmounts" : "settingsRest.detail.unitsOnly")}</div></div>`;
}
function activityHtml(user) {
  const zones = (user.zonas ?? []).map((zone) => zone.charAt(0) + zone.slice(1).toLowerCase()).join(", ");
  const counts = isPrescriber(user) ? `<p class="sm">${t("settingsRest.detail.linkedTo", { name: escapeHtml(user.medico ?? t("settingsRest.detail.noCardLinked")) })}</p>` : `
      <div class="uper" style="grid-template-columns:repeat(2,minmax(0,1fr))"><div><b>${formatNumber(user.cartera)}</b><span>${t("settingsRest.users.inPortfolio")}</span></div><div><b>${formatNumber(user.visitas_mes)}</b><span>${t("settingsRest.detail.visitsThisMonth", words())}</span></div></div>
      ${zones ? `<div class="sm">${escapeHtml(t("settingsRest.detail.zone", { zones }))}</div>` : ""}`;
  const connection = cardSectionsLegacy.can("administrar") ? `${escapeHtml(connectionText(usersLegacy.connections()[user.id], true))}<br>` : "";
  const when = user.ultima_actividad ? new Date(user.ultima_actividad).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" }) : t("settingsRest.detail.noneRecorded");
  return `<div class="blk"><h3>${t("settingsRest.detail.activity")}</h3>${counts}
      <div class="sm u-mt-6">${connection}${t("settingsRest.detail.lastActivity", { when })}</div></div>`;
}
function actionsHtml(user) {
  const admin = cardSectionsLegacy.can("administrar"), notMe = user.id !== settingsLegacy.user().id;
  const impersonate = accessLegacy.canImpersonate(user) ? `<button class="btn${usersLegacy.isGuest(user) ? "" : " sec"}" data-uacc="como">${t("settingsRest.users.impersonate")}</button>` : "";
  return `<div class="usracc">
      <button class="btn" data-uacc="editar">${t("settingsRest.detail.edit")}</button>
      ${isPrescriber(user) ? "" : `<button class="btn sec" data-uacc="cartera">${t("settingsRest.detail.assignPortfolio")}</button>`}
      ${admin && notMe ? `<button class="btn sec" data-uacc="acceso">${t("settingsRest.detail.accessData")}</button>` : ""}
      <button class="btn sec" data-uacc="pass">${t("settingsRest.detail.sendPassword")}</button>
      <button class="btn sec" data-uacc="activar">${t("settingsRest.detail.resendActivation")}</button>
      ${impersonate}
      ${admin && notMe ? `<button class="btn sec dang" data-uacc="borrar">${t("settingsRest.detail.deleteUser")}</button>` : ""}</div>`;
}
var closeAnd = (action) => {
  dialog()?.close();
  action();
};
function actionFor(user, action) {
  const actions = /* @__PURE__ */ new Map([
    ["editar", () => {
      void editUser(user.id);
    }],
    ["cartera", () => {
      closeAnd(() => {
        usersLegacy.assignPortfolio(user.id);
      });
    }],
    ["pass", () => {
      closeAnd(() => {
        void resetPassword(user);
      });
    }],
    ["activar", () => {
      void resendActivation(user.email);
    }],
    ["acceso", () => {
      void showTemporaryAccess(user);
    }],
    ["como", () => {
      closeAnd(() => {
        usersLegacy.impersonate(user.id);
      });
    }],
    ["borrar", () => {
      closeAnd(() => {
        deleteUser(user);
      });
    }]
  ]);
  actions.get(action)?.();
}
function showUser(user) {
  const body = dialogBody();
  if (!body) return;
  body.innerHTML = `<div class="fh"><div class="usrcab"><span class="usrav grande">${escapeHtml(initialsOf(user.nombre))}</span>
      <div><h2>${escapeHtml(user.nombre)}</h2><div class="sm">${escapeHtml(user.email ?? "")}</div>
        <div class="usrchips"><span class="pill p-est">${escapeHtml(user.rol)}</span>${user.activo ? "" : `<span class="pill p-anu">${t("settingsRest.users.deactivated")}</span>`}</div></div></div>
    <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>
    ${permissionsHtml(user)}
    ${activityHtml(user)}
    ${actionsHtml(user)}`;
  dialog()?.showModal();
  body.querySelectorAll("[data-uacc]").forEach((button) => {
    button.onclick = () => {
      actionFor(user, button.dataset.uacc ?? "");
    };
  });
}

// src/app/screens/settings/users/new-user.ts
var LINK_TRIES = 6;
var LINK_WAIT_MS = 700;
var MIN_PASSWORD = 6;
var temporaryPassword = () => `Tmp-${Math.random().toString(36).slice(2, 8)}`;
var isPortalRole = (role) => usersLegacy.roleCan(role, PRESCRIBER);
var message = () => document.getElementById("nmsg");
function formHtml() {
  return `
    <div class="fh"><div><h2>${t("settingsRest.newUser.title")}</h2><div class="sm">${t("settingsRest.newUser.subtitle")}</div></div>
      <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>
    <div class="g2">
      <div><label for="nn">${t("settingsRest.newUser.name")}</label><input id="nn" placeholder="${t("settingsRest.newUser.namePlaceholder")}"></div>
      <div><label for="ne">${t("settingsRest.newUser.email")}</label><input id="ne" type="email" placeholder="${t("settingsRest.newUser.emailPlaceholder")}"></div>
    </div>
    <div class="g2">
      <div><label for="nr">${t("settingsRest.newUser.role")}</label><select id="nr">${roleOptions(usersLegacy.defaultRole())}</select></div>
      <div><label for="np">${t("settingsRest.newUser.password")}</label><input id="np" value="${temporaryPassword()}"></div>
    </div>
    <div id="nmedw" class="hide"><label>${t("settingsRest.newUser.fromDirectory", words())}</label><div id="nmed"></div>
    <div class="sm u-mt-4">${t("settingsRest.newUser.directoryHint")}</div></div>
    <div class="acts u-end">
      <button class="btn sec" data-cerrar>${t("settingsRest.newUser.cancel")}</button>
      <button class="btn" id="ncrear">${t("settingsRest.newUser.create")}</button></div>
    <div id="nmsg" class="sm u-mt-10"></div>`;
}
function allowed(draft) {
  const plan = planLegacy.of(planLegacy.current().plan), max = planLegacy.contractedUsers();
  const active = usersLegacy.list().filter((user) => user.activo && !isPrescriber(user)).length;
  if (!isPortalRole(draft.rol) && active >= max) {
    notices.toast(t("settingsRest.newUser.planLimit", { plan: plan.nombre, max }), true);
    return false;
  }
  if (isPortalRole(draft.rol) && !draft.medico) {
    notices.toast(t("settingsRest.newUser.chooseProfessional", words()), true);
    return false;
  }
  return true;
}
var showFailure = (key, error) => {
  const box = message();
  if (box) box.innerHTML = `<span class="u-danger">${t(`settingsRest.newUser.${key}`, { error: escapeHtml(error) })}</span>`;
};
var ready = (button) => {
  button.disabled = false;
  button.textContent = t("settingsRest.newUser.create");
};
async function invite(draft) {
  const { data: invitation, error } = await legacyDb().rpc("crear_invitacion", { p_email: draft.email, p_rol: draft.rol });
  if (!error && invitation?.ok) return true;
  showFailure("couldNotInvite", error?.message ?? invitation?.error ?? "");
  return false;
}
async function create(draft, button) {
  if (!draft.email || !draft.nombre || draft.pass.length < MIN_PASSWORD) {
    notices.toast(t("settingsRest.newUser.complete"), true);
    return false;
  }
  button.disabled = true;
  button.textContent = t("settingsRest.newUser.creating");
  if (!await invite(draft)) {
    ready(button);
    return false;
  }
  const { error, id } = await usersLegacy.signUp(draft.email, draft.pass, draft.nombre);
  ready(button);
  if (error) {
    showFailure("couldNotCreate", error.message ?? "");
    return false;
  }
  if (id) await legacyDb().rpc("guardar_perfil", { p: { id, nombre: draft.nombre, usuario: draft.email.split("@")[0], rol: draft.rol } });
  const box = message();
  if (box) box.innerHTML = t("settingsRest.newUser.created", { password: escapeHtml(draft.pass) });
  usersLegacy.reloadAdmin();
  return true;
}
async function link(draft, professional) {
  let ok = false;
  for (let attempt = 0; attempt < LINK_TRIES && !ok; attempt++) {
    if (attempt) await new Promise((resolve) => {
      setTimeout(resolve, LINK_WAIT_MS);
    });
    const { data: user } = await legacyDb().from("perfiles").select("id").eq("email", draft.email).maybeSingle();
    if (!user) continue;
    const { data: result, error } = await legacyDb().rpc("vincular_cuenta", { p_usuario: user.id, p_medico: professional.id });
    ok = !error && result?.ok !== false;
  }
  const name = escapeHtml(professional.nombre ?? "");
  message()?.insertAdjacentHTML("beforeend", ok ? t("settingsRest.newUser.linked", { name }) : t("settingsRest.newUser.notLinked", { ...words(), name }));
  if (ok) draft.linked = professional.nombre ?? "";
}
function paintSummary(draft) {
  void Promise.resolve(callRpc("guardar_acceso_temporal", { p_email: draft.email, p_pass: draft.pass })).then(() => void 0, () => void 0);
  const box = dialog(), body = dialogBody();
  if (!box || !body) return;
  delete box.dataset.sucio;
  body.innerHTML = `<div class="fh"><div><h2>${t("settingsRest.newUser.doneTitle")}</h2><div class="sm">${t("settingsRest.newUser.doneSubtitle")}</div></div><button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>
      ${accessDataHtml({ nombre: draft.nombre, rol: draft.rol, email: draft.email, pass: draft.pass, vinculado: draft.linked })}
      <p class="sm">${t("settingsRest.newUser.confirmEmail")}</p>
      <div class="acts u-end u-wrap"><button class="btn sec" id="usrcop">${t("settingsRest.newUser.copy")}</button><button class="btn" data-cerrar>${t("settingsRest.newUser.done")}</button></div>`;
  delete box.dataset.sucio;
  const copy = document.getElementById("usrcop");
  if (copy) copy.onclick = () => {
    void copyText(welcomeText(draft.nombre, draft.email, draft.pass));
  };
}
async function createUser(professional, button) {
  const draft = { nombre: valueOf("nn").trim(), email: valueOf("ne").trim(), pass: valueOf("np"), rol: valueOf("nr"), medico: professional, linked: null };
  if (!allowed(draft) || !await create(draft, button)) return;
  if (isPortalRole(draft.rol) && professional) await link(draft, professional);
  if (currentScreen() === "config" && usersLegacy.section() === "usuarios") usersLegacy.repaintList();
  paintSummary(draft);
}
async function fillFrom(professional) {
  const { data: card } = await legacyDb().rpc("ficha_cuenta", { p_id: professional.id });
  const name = input("nn"), email = input("ne");
  if (card?.medico && name && email) {
    if (!name.value) name.value = card.medico.nombre ?? "";
    if (!email.value && card.medico.email) email.value = card.medico.email;
  }
}
function presetRole(preset) {
  const centre = preset.centro ? usersLegacy.roleWith("portal_centro") : "";
  if (centre) return centre;
  return usersLegacy.roleNames().find((role) => isPortalRole(role) && !usersLegacy.roleCan(role, "portal_centro")) ?? usersLegacy.roleWith(PRESCRIBER);
}
function applyPreset(preset, role, toggle) {
  role.value = presetRole(preset);
  const name = input("nn"), email = input("ne");
  if (name) name.value = preset.nombre ?? "";
  if (email) email.value = preset.email ?? "";
  toggle();
}
function newUser(preset = null) {
  const body = dialogBody(), box = dialog();
  if (!body || !box) return;
  body.innerHTML = formHtml();
  let professional = preset?.medico ?? null;
  editorLegacy.pickAccount(document.getElementById("nmed"), professional, async (account) => {
    professional = account;
    await fillFrom(account);
  }, t("settingsRest.newUser.findProfessional", words()));
  const role = document.getElementById("nr");
  const toggle = () => {
    document.getElementById("nmedw")?.classList.toggle("hide", !isPortalRole(role?.value ?? ""));
  };
  role?.addEventListener("change", toggle);
  if (preset?.medico && role) applyPreset(preset, role, toggle);
  const ok = document.getElementById("ncrear");
  if (ok) ok.onclick = () => {
    void createUser(professional, ok);
  };
  box.showModal();
}

// src/app/screens/settings/users/list.ts
var INACTIVE_DAYS = 30;
var DAY_MS = 864e5;
var matches = (user) => {
  const query = userFilters.q.toLowerCase(), text = `${user.nombre} ${user.email ?? ""} ${user.medico ?? user.cuenta ?? ""}`.toLowerCase();
  const state = userFilters.est === "todos" || (userFilters.est === "activos" ? Boolean(user.activo) : !user.activo);
  return (!query || text.includes(query)) && (!userFilters.rol || user.rol === userFilters.rol) && state;
};
function userCard(user, connections) {
  const areas = user.areas ?? {}, area = usersLegacy.moduleArea();
  const modules = Object.keys(area).filter((module) => usersLegacy.roleCan(user.rol, "administrar") || Number(areas[area[module] ?? ""] ?? 0) >= 1);
  const recent = user.ultima_actividad ? new Date(user.ultima_actividad) : null;
  const prescriber = isPrescriber(user);
  const counts = prescriber ? "" : `<span><b>${formatNumber(user.cartera)}</b> ${t("settingsRest.users.inPortfolio")}</span><span><b>${formatNumber(user.visitas_mes)}</b> ${t("settingsRest.users.visitsMonth", words())}</span>`;
  return `<button class="usrcard ${user.activo ? "" : "off"}" data-usr="${user.id}">
        <span class="usrav" style="background:${roleColour(user.rol)}">${escapeHtml(initialsOf(user.nombre))}</span>
        <span class="usrtx"><b>${escapeHtml(user.nombre)}</b><span class="sm">${escapeHtml(user.email ?? "")}</span>
          <span class="usrchips"><span class="pill p-est">${escapeHtml(user.rol)}</span>${user.activo ? "" : `<span class="pill p-anu">${t("settingsRest.users.deactivated")}</span>`}
            ${prescriber ? `<span class="pill p-per">${escapeHtml(user.medico ?? t("settingsRest.users.noCard"))}</span>` : `<span class="sm">${t("settingsRest.users.modules", { count: modules.length })}</span>`}</span></span>
        <span class="usrdat">${counts}
          <span class="sm usrcon" title="${recent ? t("settingsRest.users.lastActivity", { date: formatShortDate(toIsoDate(recent)) }) : t("settingsRest.users.noActivity")}">${escapeHtml(connectionText(connections[user.id]))}</span></span></button>`;
}
var whenOf = (stamp) => {
  if (!stamp) return null;
  const date = new Date(stamp);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" });
};
function guestRow(user, connections) {
  const connection = connections[user.id] ?? {}, last = whenOf(connection.ultima_conexion ?? connection.ultimo_acceso);
  const card = user.cuenta_id ? `<button class="pill p-per" data-uinvf="${user.cuenta_id}" title="${t("settingsRest.users.openCard")}">${escapeHtml(user.medico ?? user.cuenta ?? t("settingsRest.users.yourCard"))}</button>` : `<span class="pill p-anu">${t("settingsRest.users.noCard")}</span>`;
  return `<div class="usrinv ${user.activo ? "" : "off"}">
      <span class="usrav" style="background:${roleColour(user.rol)}">${escapeHtml(initialsOf(user.nombre))}</span>
      <span class="usrtx"><b>${escapeHtml(user.nombre)}</b><span class="sm">${escapeHtml(user.email ?? "")}</span>
        <span class="usrchips">${card}
          ${user.activo ? "" : `<span class="pill p-anu">${t("settingsRest.users.deactivated")}</span>`}
          <span class="sm usrinvult">${last ? escapeHtml(connectionText(connection)) : t("settingsRest.users.notYet")}</span></span>
        <span class="sm usrinvve">${escapeHtml(usersLegacy.guestSees(user))}</span></span>
      <span class="usrinvacts">${accessLegacy.canImpersonate(user) ? `<button class="btn" data-ucomo="${user.id}">${t("settingsRest.users.impersonate")}</button>` : ""}
        <button class="btn sec" data-uinvd="${user.id}">${t("settingsRest.users.details")}</button></span></div>`;
}
function paintGuests(list, connections) {
  const box = document.getElementById("usrinv");
  if (!box) return;
  const count = document.getElementById("usrinvn");
  if (count) count.textContent = list.length ? `· ${formatNumber(list.length)}` : "";
  const anyGuest = Object.keys(connections).length > 0 || usersLegacy.list().some((user) => usersLegacy.isGuest(user));
  box.innerHTML = list.map((user) => guestRow(user, connections)).join("") || `<div class="vacio">${anyGuest ? t("settingsRest.users.nobody") : t("settingsRest.users.noGuests")}</div>`;
  box.querySelectorAll("[data-uinvf]").forEach((button) => {
    button.onclick = () => {
      agendaActions.openAccount(button.dataset.uinvf ?? "");
    };
  });
  box.querySelectorAll("[data-uinvd]").forEach((button) => {
    button.onclick = () => {
      const user = usersLegacy.list().find((item) => item.id === button.dataset.uinvd);
      if (user) showUser(user);
    };
  });
}
function paintList(all, connections) {
  const shown = all.filter(matches), list = shown.filter((user) => !usersLegacy.isGuest(user));
  paintGuests(shown.filter((user) => usersLegacy.isGuest(user)), connections);
  const box = document.getElementById("usrl");
  if (!box) return;
  box.innerHTML = list.map((user) => userCard(user, connections)).join("") || `<div class="vacio">${t("settingsRest.users.nobody")}</div>`;
  box.querySelectorAll("[data-usr]").forEach((button) => {
    button.onclick = () => {
      const user = all.find((item) => item.id === button.dataset.usr);
      if (user) showUser(user);
    };
  });
}
function kpisHtml(all) {
  const plan = planLegacy.of(planLegacy.current().plan), max = planLegacy.contractedUsers();
  const active = all.filter((user) => user.activo && !isPrescriber(user)), since = Date.now() - INACTIVE_DAYS * DAY_MS;
  const inactive = active.filter((user) => !user.ultima_actividad || new Date(user.ultima_actividad).getTime() < since).length;
  const byRole = /* @__PURE__ */ new Map();
  active.forEach((user) => {
    byRole.set(user.rol, (byRole.get(user.rol) ?? 0) + 1);
  });
  const guests = all.filter((user) => (isPrescriber(user) || usersLegacy.roleCan(user.rol, "portal_centro")) && user.activo).length;
  return `<div class="kpis vtot">
      <div class="kpi"><b>${formatNumber(active.length)} / ${formatNumber(max)}</b><span>${t("settingsRest.users.planUsers", { plan: escapeHtml(plan.nombre) })}</span></div>
      ${[...byRole].map(([role, count]) => `<div class="kpi"><b>${formatNumber(count)}</b><span>${escapeHtml(role)}</span></div>`).join("")}
      <div class="kpi ${inactive ? "warn" : "ok"}"><b>${formatNumber(inactive)}</b><span>${t("settingsRest.users.inactive")}</span></div>
      <div class="kpi" data-usrinvk><b>${formatNumber(guests)}</b><span>${t("settingsRest.users.withAccess")}</span></div></div>`;
}
function pageHtml(all) {
  const state = (value, key) => `<option value="${value}" ${userFilters.est === value ? "selected" : ""}>${t(`settingsRest.users.${key}`)}</option>`;
  return `<div class="cfgpanel">
    ${kpisHtml(all)}
    <div class="card" style="padding-top:14px;padding-bottom:14px">
      <div class="usrbar"><input id="usrq" type="search" placeholder="${t("settingsRest.users.search")}" value="${escapeHtml(userFilters.q)}">
        <select id="usrrol"><option value="">${t("settingsRest.users.allRoles")}</option>${roleOptions(userFilters.rol)}</select>
        <select id="usrest">${state("activos", "active")}${state("inactivos", "deactivatedPlural")}${state("todos", "all")}</select>
        <button class="btn" id="usrnuevo">${t("settingsRest.users.newUser")}</button></div>
      <div id="usrl" class="usrlista"></div></div>
    <div class="card usrinvw" style="padding-top:14px;padding-bottom:14px"><h3>${t("settingsRest.users.guests")} <span id="usrinvn" class="sm"></span></h3>
      <p class="sm">${t("settingsRest.users.guestsHint", words())}</p>
      <div id="usrinv" class="usrinvl"></div></div></div>`;
}
function bindFilters(all, connections) {
  const field = (id) => document.getElementById(id);
  const search = field("usrq"), role = field("usrrol"), state = field("usrest");
  if (search) search.oninput = () => {
    userFilters.q = search.value;
    paintList(all, connections);
  };
  if (role) role.onchange = () => {
    userFilters.rol = role.value;
    paintList(all, connections);
  };
  if (state) state.onchange = () => {
    userFilters.est = state.value;
    paintList(all, connections);
  };
  const add = document.getElementById("usrnuevo");
  if (add) add.onclick = () => {
    newUser();
  };
}
async function paintUsers() {
  const [{ data }, access] = await Promise.all([callRpc("usuarios_resumen", {}), callRpc("invitados_accesos", {})]);
  const connections = {};
  (access.data ?? []).forEach((item) => {
    connections[item.id] = item;
  });
  usersLegacy.setConnections(connections);
  const all = data ?? [];
  usersLegacy.setList(withOldNames(all));
  const box = document.getElementById("cfgcuerpo");
  if (!box) return;
  box.innerHTML = pageHtml(all);
  bindFilters(all, connections);
  paintList(all, connections);
}
export {
  deleteUser,
  editUser,
  newUser,
  paintUsers,
  showTemporaryAccess,
  showUser
};
