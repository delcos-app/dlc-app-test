// delcos-shared:src/app/i18n/index.ts
var shared = globalThis["__delcosModules"]["i18n/index"];
var pick = (name) => shared[name];
var registerMessages = /* @__PURE__ */ pick("registerMessages");
var t = /* @__PURE__ */ pick("t");

// src/app/i18n/es/chunks/settings-email/settings-extra.ts
var settingsExtra = {
  email: {
    title: "Correo de la empresa",
    intro: "Desde esta cuenta salen las facturas, los datos de pago y los resúmenes. Cada empresa usa su propio correo: los clientes ven vuestro remitente y vuestra firma.",
    provider: "Proveedor",
    chooseProvider: "Elige tu proveedor…",
    host: "Servidor de salida (SMTP)",
    hostPlaceholder: "smtp.tuproveedor.com",
    port: "Puerto",
    security: "Seguridad",
    user: "Identificador de acceso",
    password: "Clave de acceso",
    passwordSaved: "•••••••• guardada · escribe solo para cambiarla",
    senderName: "Nombre del remitente",
    senderEmail: "Email del remitente",
    senderEmailPlaceholder: "nombre@tuempresa.com",
    passwordPrivate: "🔒 La clave de acceso se guarda aparte y nadie puede verla desde la plataforma, ni siquiera administración.",
    signature: "Firma",
    signatureIntro: "Se añade al final de cada email, con el logo de la empresa si lo tienes en Marca y logo.",
    name: "Nombre",
    jobTitle: "Cargo",
    jobTitlePlaceholder: "p. ej. Atención al cliente",
    company: "Empresa",
    web: "Web",
    webPlaceholder: "www.tuempresa.com",
    phone: "Teléfono",
    otherPhone: "Otro teléfono",
    address: "Dirección",
    legalNotice: "Aviso legal o de confidencialidad",
    legalNoticePlaceholder: "Texto que aparece en pequeño al final del correo",
    colour: "Color",
    includeLogo: "Incluir el logo",
    preview: "Vista previa",
    previewText: "Hola:<br><br>Te adjuntamos la factura de tu pedido.<br><br>Un saludo,",
    sendTest: "Enviarme un correo de prueba",
    save: "Guardar",
    saving: "Guardando…",
    sending: "Enviando…",
    missingHost: "Indica el servidor de salida",
    missingUser: "Indica el identificador de acceso",
    missingPassword: "Escribe la clave de acceso",
    missingSender: "Indica el email del remitente",
    invalidSender: "Ese email no es válido",
    oneMissing: "Falta un dato",
    manyMissing: "Faltan {count} datos",
    reviewMarked: ": revisa los campos marcados en rojo.",
    noFunction: "La base de datos no encuentra la función del correo (SQL 48).",
    ownerOnly: "Solo el propietario de la empresa puede configurar el correo.",
    couldNotSave: "No se ha podido guardar: {reason}",
    technicalDetail: "Detalle técnico: {reason}",
    saved: "✓ Guardado.",
    savedToast: "Correo guardado",
    sendingTest: "Enviando el correo de prueba…",
    testSent: '<b class="u-ok">✓ Enviado.</b> Revisa tu bandeja de entrada (y la de correo no deseado).',
    badCredentials: '<b class="u-danger">El servidor ha rechazado el identificador o la clave de acceso.</b> Revisa los datos que te da tu proveedor.',
    noConnection: '<b class="u-danger">No se ha podido conectar con el servidor.</b> Revisa el servidor, el puerto y la seguridad.',
    noSmtp: '<b class="u-danger">Falta el servidor, el usuario o la contraseña.</b>',
    noPermission: '<b class="u-danger">No tienes permiso para enviar el correo de prueba.</b> Lo envía quien administra la empresa.',
    sessionExpired: '<b class="u-danger">Tu sesión ha caducado.</b> Vuelve a entrar y prueba otra vez.',
    couldNotSend: '<b class="u-danger">No se ha podido enviar.</b> ',
    noSendFunction: "La función de envío no está instalada en el servidor.",
    hints: {
      google: "Dirección de correo de la cuenta|Contraseña de aplicación",
      microsoft: "Dirección de correo de la cuenta|Contraseña de la cuenta",
      mailjet: "API Key|Secret Key",
      ionos: "Dirección de correo completa|Contraseña del buzón",
      ovh: "Dirección de correo completa|Contraseña del buzón",
      otro: "Lo indica tu proveedor|Lo indica tu proveedor"
    }
  },
  templates: {
    title: "Plantillas de correo",
    help: "Los correos que reciben tus clientes. Crea las que quieras, con el nombre que quieras; para cada uso, una es la de por defecto y, si hay más, se elige al enviar. Los huecos entre corchetes ([nombre], [iban]…) se rellenan al enviar. La despedida y los teléfonos ya van en la firma.",
    add: "+ Nueva plantilla",
    byDefault: "Por defecto",
    edit: "Editar",
    duplicate: "Duplicar",
    remove: "Eliminar",
    none: "Sin plantillas.",
    copyOf: "{name} (copia)",
    removeText: "Se elimina la plantilla «{name}».",
    removeTitle: "¿Eliminar la plantilla?",
    removed: "Plantilla eliminada",
    newTitle: "Nueva plantilla de correo",
    editTitle: "Editar la plantilla",
    name: "Nombre",
    namePlaceholder: "Por ejemplo: Datos de pago · clínicas",
    usedFor: "Se usa para",
    subject: "Asunto",
    text: "Texto",
    gaps: "Huecos (pulsa para añadirlo donde está el cursor):",
    useByDefault: "Usarla por defecto para este uso",
    save: "Guardar",
    saving: "Guardando…",
    nameIt: "Pon un nombre a la plantilla",
    saved: "Plantilla guardada"
  }
};

// src/app/i18n/es/chunks/settings-email/index.ts
var texts = { settingsExtra };

// src/app/screens/settings/email/texts.ts
registerMessages(texts);

// delcos-shared:src/app/legacy/bridge.ts
var shared2 = globalThis["__delcosModules"]["legacy/bridge"];
var pick2 = (name) => shared2[name];
var callRpc = /* @__PURE__ */ pick2("callRpc");
var legacyDb = /* @__PURE__ */ pick2("legacyDb");
var notices = /* @__PURE__ */ pick2("notices");

// delcos-shared:src/app/legacy/settings3-bridge.ts
var shared3 = globalThis["__delcosModules"]["legacy/settings3-bridge"];
var pick3 = (name) => shared3[name];
var settingsExtraLegacy = /* @__PURE__ */ pick3("settingsExtraLegacy");

// delcos-shared:src/app/services/format.ts
var shared4 = globalThis["__delcosModules"]["services/format"];
var pick4 = (name) => shared4[name];
var escapeHtml = /* @__PURE__ */ pick4("escapeHtml");

// delcos-shared:src/app/services/values.ts
var shared5 = globalThis["__delcosModules"]["services/values"];
var pick5 = (name) => shared5[name];
var nonZeroOr = /* @__PURE__ */ pick5("nonZeroOr");
var orFallback = /* @__PURE__ */ pick5("orFallback");

// src/app/screens/settings/email/account-save.ts
var DEFAULT_PORT = 465;
var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var input = (id) => document.getElementById(id);
var text = (id) => (input(id)?.value ?? "").trim();
var message = (html) => {
  const box = document.getElementById("comsg");
  if (box) box.innerHTML = html;
};
var readSignature = () => ({
  nombre: text("fnom"),
  cargo: text("fcar"),
  empresa: text("femp"),
  web: text("fweb"),
  telefono: text("ftel"),
  telefono2: text("ftel2"),
  direccion: text("fdir"),
  aviso: text("faviso"),
  logo: input("flogo")?.checked ? "si" : "no"
});
var senderOf = (user) => orFallback(text("coemail"), user.includes("@") ? user : "");
function readConfig() {
  const user = text("cousu"), value2 = (id, fallback) => input(id)?.value ?? fallback;
  return {
    proveedor: value2("coprov", ""),
    host: text("cohost"),
    puerto: nonZeroOr(Number(input("copuer")?.value), DEFAULT_PORT),
    seguridad: value2("coseg", "ssl"),
    usuario: user,
    remitente_nombre: text("conom"),
    remitente_email: senderOf(user),
    color: value2("fcolor", ""),
    firma: readSignature()
  };
}
function missingData(config, hasPassword) {
  const errors = [];
  if (!config.host) errors.push(["cohost", "settingsExtra.email.missingHost"]);
  if (!config.usuario) errors.push(["cousu", "settingsExtra.email.missingUser"]);
  if (!hasPassword && !input("copass")?.value) errors.push(["copass", "settingsExtra.email.missingPassword"]);
  if (!config.remitente_email) errors.push(["coemail", "settingsExtra.email.missingSender"]);
  else if (!EMAIL.test(config.remitente_email)) errors.push(["coemail", "settingsExtra.email.invalidSender"]);
  return errors;
}
function markMissing(errors) {
  document.querySelectorAll("#cfgcuerpo .campoerr").forEach((item) => {
    item.remove();
  });
  document.querySelectorAll("#cfgcuerpo .conerr").forEach((item) => {
    item.classList.remove("conerr");
  });
  for (const [id, key] of errors) {
    const element = input(id);
    if (!element) continue;
    element.classList.add("conerr");
    (element.closest(".selw, .numw") ?? element).insertAdjacentHTML("afterend", `<span class="campoerr">${t(key)}</span>`);
  }
  if (!errors.length) return;
  message(`<b class="u-danger">${errors.length === 1 ? t("settingsExtra.email.oneMissing") : t("settingsExtra.email.manyMissing", { count: errors.length })}</b>${t("settingsExtra.email.reviewMarked")}`);
  const first = errors[0];
  if (first) input(first[0])?.focus();
}
function failureText(reason) {
  if (/Could not find the function|PGRST202/i.test(reason)) return t("settingsExtra.email.noFunction");
  return reason === "permiso" ? t("settingsExtra.email.ownerOnly") : t("settingsExtra.email.couldNotSave", { reason });
}
function reasonOf(error, result) {
  if (!error) return result?.error ?? "";
  const failure = error;
  return orFallback(failure.message, failure.code ?? "");
}
function showFailure(reason) {
  const failure = failureText(reason), detail = reason && !failure.includes(reason) ? `<span class="errtec">${escapeHtml(t("settingsExtra.email.technicalDetail", { reason }))}</span>` : "";
  message(`<b class="u-danger">${escapeHtml(failure)}</b>${detail}`);
  notices.toast(failure, true);
}
async function save(config) {
  const value2 = readConfig(), errors = missingData(value2, Boolean(config.hay_clave));
  markMissing(errors);
  if (errors.length) return false;
  const password = input("copass")?.value ?? "";
  const { data: result, error } = await legacyDb().rpc("guardar_correo", { p: value2, p_clave: password || null });
  if (error || result?.ok === false) {
    showFailure(reasonOf(error, result));
    return false;
  }
  if (password) config.hay_clave = true;
  message(`<b class="u-ok">${t("settingsExtra.email.saved")}</b>`);
  const field2 = input("copass");
  if (field2) {
    field2.value = "";
    field2.placeholder = t("settingsExtra.email.passwordSaved");
  }
  notices.toast(t("settingsExtra.email.savedToast"));
  return true;
}
var TEST_ERRORS = /* @__PURE__ */ new Map([
  ["credenciales", "settingsExtra.email.badCredentials"],
  ["conexion", "settingsExtra.email.noConnection"],
  ["sin_smtp", "settingsExtra.email.noSmtp"],
  ["permiso", "settingsExtra.email.noPermission"],
  ["sesion", "settingsExtra.email.sessionExpired"]
]);
async function answerOf(response) {
  const context = response.error?.context;
  if (!response.error || typeof context?.json !== "function") return response.data;
  try {
    return await context.json();
  } catch {
    return response.data;
  }
}
function testResult(answer, failed) {
  if (answer?.ok) return t("settingsExtra.email.testSent");
  const known = answer?.error ? TEST_ERRORS.get(answer.error) : void 0;
  if (known) return t(known);
  return t("settingsExtra.email.couldNotSend") + (failed && !answer ? t("settingsExtra.email.noSendFunction") : escapeHtml(answer?.error ?? ""));
}
async function sendTest(config) {
  if (!await save(config)) return;
  const box = document.getElementById("comsg");
  if (box) box.textContent = t("settingsExtra.email.sendingTest");
  const response = await settingsExtraLegacy.sendTestEmail();
  message(testResult(await answerOf(response), Boolean(response.error)));
}
function bindSaving(config) {
  const ok = document.getElementById("cook"), test = document.getElementById("coprueba");
  if (ok) ok.onclick = () => {
    void settingsExtraLegacy.withButtonLoading(ok, t("settingsExtra.email.saving"), () => save(config));
  };
  if (test) test.onclick = () => {
    void settingsExtraLegacy.withButtonLoading(test, t("settingsExtra.email.sending"), () => sendTest(config));
  };
}

// delcos-shared:src/app/screens/settings/email/templates.ts
var shared6 = globalThis["__delcosModules"]["screens/settings/email/templates"];
var pick6 = (name) => shared6[name];
var USES = /* @__PURE__ */ pick6("USES");
var VARIABLES = /* @__PURE__ */ pick6("VARIABLES");
var defaultTemplate = /* @__PURE__ */ pick6("defaultTemplate");
var newTemplateId = /* @__PURE__ */ pick6("newTemplateId");
var saveTemplates = /* @__PURE__ */ pick6("saveTemplates");
var templateList = /* @__PURE__ */ pick6("templateList");
var useLabel = /* @__PURE__ */ pick6("useLabel");

// src/app/screens/settings/email/template-list.ts
var value = (id) => document.getElementById(id)?.value ?? "";
function templateRow(template, many) {
  return `<div class="plcfila"><span class="plcn"><b>${escapeHtml(template.nombre)}</b>${template.defecto ? ` <span class="pill p-ok">${t("settingsExtra.templates.byDefault")}</span>` : ""}<span class="sm">${escapeHtml(template.asunto)}</span></span>
        <span class="plcb"><button type="button" class="btn sec chico" data-plce="${template.id}">${t("settingsExtra.templates.edit")}</button><button type="button" class="btn sec chico" data-plcd="${template.id}">${t("settingsExtra.templates.duplicate")}</button>
          ${many ? `<button type="button" class="btn sec chico dang" data-plcx="${template.id}">${t("settingsExtra.templates.remove")}</button>` : ""}</span></div>`;
}
function listHtml() {
  const list = templateList();
  return USES.map((use) => {
    const group = list.filter((item) => item.uso === use);
    return `<div class="plcuso"><div class="sm plcusot">${escapeHtml(useLabel(use))}</div>${group.map((item) => templateRow(item, group.length > 1)).join("") || `<div class="sm">${t("settingsExtra.templates.none")}</div>`}</div>`;
  }).join("");
}
function templatesCardHtml() {
  return `<div class="card cfgpanel" id="plcorreo"><div class="fh"><h2 class="plch">${t("settingsExtra.templates.title")} ${settingsExtraLegacy.helpButton(t("settingsExtra.templates.title"), t("settingsExtra.templates.help"))}</h2>
    <button type="button" class="btn sec chico" id="plcnueva">${t("settingsExtra.templates.add")}</button></div><div id="plclista" class="plclista">${listHtml()}</div></div>`;
}
var repaint = () => {
  const box = document.getElementById("plclista");
  if (box) box.innerHTML = listHtml();
};
function insertAtCursor(field2, text3) {
  const start = field2.selectionStart ?? field2.value.length, end = field2.selectionEnd ?? start;
  field2.value = field2.value.slice(0, start) + text3 + field2.value.slice(end);
  field2.focus();
  field2.selectionStart = field2.selectionEnd = start + text3.length;
}
function editorHtml(template, isNew) {
  return `<div class="fh"><div><h2>${t(isNew ? "settingsExtra.templates.newTitle" : "settingsExtra.templates.editTitle")}</h2></div><button class="x" data-cerrar2 aria-label="${t("common.close")}">✕</button></div>
    <div class="g2"><div><label for="pcen">${t("settingsExtra.templates.name")}</label><input id="pcen" value="${escapeHtml(template.nombre)}" maxlength="60" placeholder="${t("settingsExtra.templates.namePlaceholder")}"></div>
      <div><label for="pceu">${t("settingsExtra.templates.usedFor")}</label><select id="pceu">${USES.map((use) => `<option value="${use}" ${template.uso === use ? "selected" : ""}>${escapeHtml(useLabel(use))}</option>`).join("")}</select></div></div>
    <label for="pcea">${t("settingsExtra.templates.subject")}</label><input id="pcea" value="${escapeHtml(template.asunto)}">
    <label for="pcet">${t("settingsExtra.templates.text")}</label><textarea id="pcet" rows="12">${escapeHtml(template.texto)}</textarea>
    <div class="sm plchue">${t("settingsExtra.templates.gaps")}</div>
    <div class="plcvars">${VARIABLES.map(([name, key]) => `<button type="button" class="btn sec chico" data-plv="${name}" title="${escapeHtml(t(key))}">[${name}]</button>`).join("")}</div>
    <label class="chk"><input type="checkbox" id="pced" ${template.defecto ? "checked" : ""}> <span>${t("settingsExtra.templates.useByDefault")}</span></label>
    <div class="acts"><button type="button" class="btn sec" data-cerrar2>${t("settingsExtra.templates.cancel")}</button><button type="button" class="btn" id="pceok">${t("settingsExtra.templates.save")}</button></div>`;
}
async function saveEdited(template, box) {
  const name = value("pcen").trim();
  if (!name) {
    notices.toast(t("settingsExtra.templates.nameIt"), true);
    return;
  }
  const edited = { ...template, nombre: name, uso: value("pceu"), asunto: value("pcea").trim(), texto: value("pcet").replace(/\s+$/, ""), defecto: document.getElementById("pced")?.checked ?? false };
  const list = templateList().map((item) => ({ ...item })).filter((item) => item.id !== edited.id);
  if (edited.defecto) list.forEach((item) => {
    if (item.uso === edited.uso) item.defecto = false;
  });
  list.push(edited);
  USES.forEach((use) => {
    const group = list.filter((item) => item.uso === use);
    const first = group[0];
    if (first && !group.some((item) => item.defecto)) first.defecto = true;
  });
  if (await saveTemplates(list)) {
    box.close();
    notices.toast(t("settingsExtra.templates.saved"));
    repaint();
  }
}
function editTemplate(template, isNew) {
  const body = document.getElementById("dlg2body"), box = document.getElementById("dlg2");
  if (!body || !box) return;
  body.innerHTML = editorHtml(template, isNew);
  box.showModal();
  let last = document.getElementById("pcet");
  for (const id of ["pcea", "pcet"]) document.getElementById(id)?.addEventListener("focus", () => {
    last = document.getElementById(id);
  });
  body.querySelectorAll("[data-plv]").forEach((button) => {
    button.onclick = () => {
      if (last) insertAtCursor(last, `[${button.dataset.plv ?? ""}]`);
    };
  });
  const ok = document.getElementById("pceok");
  if (ok) ok.onclick = () => {
    void settingsExtraLegacy.withButtonLoading(ok, t("settingsExtra.templates.saving"), () => saveEdited(template, box));
  };
}
async function remove(template, list) {
  if (!await notices.confirm(t("settingsExtra.templates.removeText", { name: template.nombre }), { titulo: t("settingsExtra.templates.removeTitle"), ok: t("settingsExtra.templates.remove") })) return;
  const rest = list.filter((item) => item !== template);
  if (template.defecto) {
    const other = rest.find((item) => item.uso === template.uso);
    if (other) other.defecto = true;
  }
  if (await saveTemplates(rest)) {
    notices.toast(t("settingsExtra.templates.removed"));
    repaint();
  }
}
function onCardClick(event) {
  const target = event.target, list = templateList().map((item) => ({ ...item }));
  const find = (attribute) => {
    const button = target.closest(`[data-${attribute}]`);
    return button ? list.find((item) => item.id === button.getAttribute(`data-${attribute}`)) : void 0;
  };
  if (target.closest("#plcnueva")) {
    const base = defaultTemplate("pago");
    editTemplate({ id: newTemplateId(), nombre: "", uso: "pago", asunto: base.asunto, texto: base.texto, defecto: false }, true);
    return;
  }
  const edited = find("plce");
  if (edited) {
    editTemplate(edited, false);
    return;
  }
  const copied = find("plcd");
  if (copied) {
    editTemplate({ ...copied, id: newTemplateId(), nombre: t("settingsExtra.templates.copyOf", { name: copied.nombre }), defecto: false }, true);
    return;
  }
  const removed = find("plcx");
  if (removed) void remove(removed, list);
}
function bindTemplatesCard() {
  const card = document.getElementById("plcorreo");
  if (card) card.onclick = onCardClick;
}

// src/app/screens/settings/email/account.ts
var DEFAULT_PORT2 = 465;
var DEFAULT_COLOUR = "#15528F";
var HINTS = new Map(["google", "microsoft", "mailjet", "ionos", "ovh", "otro"].map((key) => [key, `settingsExtra.email.hints.${key}`]));
var field = (id, label, value2, extra = "") => `<div><label for="${id}">${label}</label><input id="${id}" value="${escapeHtml(String(value2 ?? ""))}" ${extra}></div>`;
var companyOf = () => settingsExtraLegacy.setting("empresa") ?? {};
function signatureOf(config) {
  const company = companyOf();
  return {
    nombre: settingsExtraLegacy.profileName(),
    cargo: "",
    empresa: orFallback(company.razon_social, settingsExtraLegacy.appName()),
    telefono: company.telefono ?? "",
    telefono2: "",
    web: company.web ?? "",
    direccion: [company.direccion, company.municipio].filter(Boolean).join(", "),
    aviso: "",
    logo: "si",
    ...config.firma
  };
}
function accountHtml(config) {
  const providers = settingsExtraLegacy.emailProviders(), company = companyOf();
  const options = Object.entries(providers).map(([key, provider]) => `<option value="${key}" ${config.proveedor === key ? "selected" : ""}>${provider.n}</option>`).join("");
  const sender = orFallback(config.remitente_email, orFallback(company.email, settingsExtraLegacy.profileEmail()));
  return `<div class="card cfgpanel"><h2>${t("settingsExtra.email.title")}</h2>
      <p class="sm">${t("settingsExtra.email.intro")}</p>
      <div class="g2"><div><label for="coprov">${t("settingsExtra.email.provider")}</label><select id="coprov"><option value="">${t("settingsExtra.email.chooseProvider")}</option>${options}</select></div><div></div></div>
      <div class="avisoh ${config.proveedor ? "" : "hide"}" id="coayuda"><span>${escapeHtml(providers[config.proveedor]?.ayuda ?? "")}</span></div>
      <div class="g2">${field("cohost", t("settingsExtra.email.host"), config.host, `placeholder="${t("settingsExtra.email.hostPlaceholder")}"`)}
        <div class="g2 copuerg"><div><label for="copuer">${t("settingsExtra.email.port")}</label><input id="copuer" type="number" value="${escapeHtml(String(config.puerto))}"></div>
          <div><label for="coseg">${t("settingsExtra.email.security")}</label><select id="coseg"><option value="ssl" ${config.seguridad === "ssl" ? "selected" : ""}>SSL</option><option value="starttls" ${config.seguridad === "starttls" ? "selected" : ""}>STARTTLS</option></select></div></div></div>
      <div class="g2">${field("cousu", t("settingsExtra.email.user"), config.usuario, 'autocomplete="off"')}
        <div><label for="copass">${t("settingsExtra.email.password")}</label><input id="copass" type="password" autocomplete="new-password" placeholder="${config.hay_clave ? t("settingsExtra.email.passwordSaved") : ""}"></div></div>
      <div class="g2">${field("conom", t("settingsExtra.email.senderName"), config.remitente_nombre, `placeholder="${escapeHtml(settingsExtraLegacy.appName())}"`)}${field("coemail", t("settingsExtra.email.senderEmail"), sender, `type="email" placeholder="${t("settingsExtra.email.senderEmailPlaceholder")}"`)}</div>
      <p class="sm">${t("settingsExtra.email.passwordPrivate")}</p></div>`;
}
function signatureHtml(config, signature) {
  return `<div class="card cfgpanel"><h2>${t("settingsExtra.email.signature")}</h2>
      <p class="sm">${t("settingsExtra.email.signatureIntro")}</p>
      <div class="firmaed"><div>
        <div class="g2">${field("fnom", t("settingsExtra.email.name"), signature.nombre)}${field("fcar", t("settingsExtra.email.jobTitle"), signature.cargo, `placeholder="${t("settingsExtra.email.jobTitlePlaceholder")}"`)}</div>
        <div class="g2">${field("femp", t("settingsExtra.email.company"), signature.empresa)}${field("fweb", t("settingsExtra.email.web"), signature.web, `placeholder="${t("settingsExtra.email.webPlaceholder")}"`)}</div>
        <div class="g2">${field("ftel", t("settingsExtra.email.phone"), signature.telefono)}${field("ftel2", t("settingsExtra.email.otherPhone"), signature.telefono2)}</div>
        ${field("fdir", t("settingsExtra.email.address"), signature.direccion)}
        <label for="faviso">${t("settingsExtra.email.legalNotice")}</label><textarea id="faviso" rows="3" placeholder="${t("settingsExtra.email.legalNoticePlaceholder")}">${escapeHtml(signature.aviso ?? "")}</textarea>
        <div class="g2"><div><label for="fcolor">${t("settingsExtra.email.colour")}</label><input id="fcolor" type="color" value="${escapeHtml(config.color || DEFAULT_COLOUR)}" style="height:44px"></div>
          <div><label class="vfswitch"><input type="checkbox" id="flogo" ${signature.logo !== "no" ? "checked" : ""}><span class="sw"></span><span>${t("settingsExtra.email.includeLogo")}</span></label></div></div>
      </div><div><div class="sm" style="margin-bottom:6px">${t("settingsExtra.email.preview")}</div><div class="firmaprev" id="fprev"></div></div></div></div>`;
}
var buttonsHtml = () => `<div class="card cfgpanel"><div class="acts u-end u-wrap u-m-0">
      <button class="btn sec" id="coprueba">${t("settingsExtra.email.sendTest")}</button><button class="btn" id="cook">${t("settingsExtra.email.save")}</button></div>
      <p class="sm" id="comsg"></p></div>`;
var text2 = (id) => (document.getElementById(id)?.value ?? "").trim();
function previewHtml() {
  const colour = text2("fcolor"), logo = document.getElementById("flogo")?.checked ? settingsExtraLegacy.brandLogo() : null;
  const phones = [text2("ftel"), text2("ftel2")].filter(Boolean);
  const lines = `${text2("fnom") ? `<b style="color:${colour}">${escapeHtml(text2("fnom"))}</b><br>` : ""}${text2("fcar") ? `${escapeHtml(text2("fcar"))}<br>` : ""}${text2("femp") ? `<b>${escapeHtml(text2("femp"))}</b><br>` : ""}
        ${phones.map(escapeHtml).join(" · ")}${phones.length ? "<br>" : ""}${text2("fweb") ? `<span style="color:${colour}">${escapeHtml(text2("fweb"))}</span><br>` : ""}${text2("fdir") ? escapeHtml(text2("fdir")) : ""}`;
  return `<div style="height:4px;background:${colour};border-radius:4px;margin-bottom:12px"></div><p style="margin:0 0 12px">${t("settingsExtra.email.previewText")}</p>
      <div class="fprevfirma">${logo ? `<img src="${escapeHtml(logo)}" alt="">` : ""}<div>${lines}</div></div>
      ${text2("faviso") ? `<p class="fprevaviso">${escapeHtml(text2("faviso"))}</p>` : ""}`;
}
function bindPreview() {
  const paint = () => {
    const box = document.getElementById("fprev");
    if (box) box.innerHTML = previewHtml();
  };
  for (const id of ["fnom", "fcar", "femp", "fweb", "ftel", "ftel2", "fdir", "faviso", "fcolor", "flogo"]) document.getElementById(id)?.addEventListener("input", paint);
  const logo = document.getElementById("flogo");
  if (logo) logo.onchange = paint;
  paint();
}
function bindProvider(config) {
  const select = document.getElementById("coprov");
  if (!select) return;
  const input2 = (id) => document.getElementById(id);
  const hints = () => {
    const key = HINTS.get(select.value), [user = "", password = ""] = (key ? t(key) : "|").split("|");
    const userInput = input2("cousu"), passwordInput = input2("copass");
    if (userInput) userInput.placeholder = user;
    if (!config.hay_clave && passwordInput) passwordInput.placeholder = password;
  };
  hints();
  select.onchange = () => {
    hints();
    const provider = settingsExtraLegacy.emailProviders()[select.value];
    if (!provider) return;
    const host = input2("cohost"), port = input2("copuer"), security = document.getElementById("coseg"), help = document.getElementById("coayuda");
    if (provider.host && host) host.value = provider.host;
    if (port) port.value = String(provider.puerto);
    if (security) security.value = provider.seg;
    help?.classList.remove("hide");
    const span = help?.querySelector("span");
    if (span) span.textContent = provider.ayuda;
  };
}
async function paintEmail() {
  const [{ data }] = await Promise.all([callRpc("correo_config", {}), settingsExtraLegacy.loadSettings()]);
  const config = { proveedor: "", host: "", puerto: DEFAULT_PORT2, seguridad: "ssl", usuario: "", remitente_nombre: "", remitente_email: "", color: DEFAULT_COLOUR, firma: {}, ...data };
  const box = document.getElementById("cfgcuerpo");
  if (!box) return;
  box.innerHTML = `
    ${accountHtml(config)}
    ${signatureHtml(config, signatureOf(config))}
    ${templatesCardHtml()}
    ${buttonsHtml()}`;
  bindPreview();
  bindProvider(config);
  bindSaving(config);
  bindTemplatesCard();
  settingsExtraLegacy.validateEmailLive(document.getElementById("coemail"));
}
export {
  paintEmail
};
