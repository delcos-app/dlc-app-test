// delcos-shared:src/app/i18n/index.ts
var shared = globalThis["__delcosModules"]["i18n/index"];
var pick = (name) => shared[name];
var registerMessages = /* @__PURE__ */ pick("registerMessages");
var t = /* @__PURE__ */ pick("t");

// src/app/i18n/es/chunks/settings-plan/settings-rest.ts
var settingsRest = {
  plan: {
    priceNote: "Precio por usuario y mes, IVA no incluido. Con pago anual pagas 10 meses de 12.",
    pageTitle: "Plan y suscripción",
    yourPlan: "Tu plan: {plan}",
    trial: "Estás en la prueba gratuita hasta el <b>{date}</b>. Sin permanencia: si no sigues, te llevas tus datos.",
    noLimit: "Sin límite",
    contracted: "Usuarios contratados",
    inUse: "Usuarios en uso",
    custom: "A medida",
    yearly: "Anual",
    monthly: "Mensual",
    payment: "Pago",
    perMonth: "Al mes, sin IVA",
    withAccess: "{Professionals} con acceso",
    usage: "{used} de {total}",
    overOne: "1 usuario",
    overMany: "{count} usuarios",
    over: "Tienes {extra} más de {total} contratados. Añádelos a tu plan o desactiva los que ya no usen la plataforma.",
    customPrice: '<b>A medida</b> <span class="sm">Presupuesto · desde 50 usuarios</span>',
    price: '<b>{price}</b> <span class="sm">por usuario al mes · {yearly} con pago anual ({year} al año)</span>',
    current: "Tu plan actual",
    askBudget: "Pedir presupuesto",
    talk: "Hablar con delcos",
    changeTo: "Cambiar a {plan}",
    hire: "Contratar {plan}",
    usersButton: "Añadir o quitar usuarios",
    managePayment: "Gestionar el pago",
    choose: "Elegir plan y pagar",
    unpaid: "No hemos podido cobrar el último recibo{since}.\n    Actualiza el método de pago con «Gestionar el pago»; si en 14 días no se puede cobrar, la cuenta queda en solo lectura.",
    unpaidSince: " (desde el {date})",
    cancelled: "Suscripción cancelada: puedes usar la plataforma hasta el\n    <b>{date}</b> y descargar tus datos. Para seguir, vuelve a contratar.",
    nextReceipt: "Próximo recibo el {date}.",
    planned: "El <b>{date}</b> pasarás al plan\n    <b>{plan}</b> con {users} usuarios y pago {payment}.",
    yearlyLower: "anual",
    monthlyLower: "mensual",
    cancelChange: "Anular el cambio",
    changeCancelled: "Cambio anulado: sigues con tu plan",
    leaving: "Has pedido la baja: puedes usar la plataforma\n    hasta el <b>{date}</b>. Si quieres seguir, entra en «Gestionar el pago» y renueva la suscripción.",
    leavingWithButton: "Has pedido la baja: puedes usar la plataforma hasta el <b>{date}</b>.",
    keep: "Seguir con la suscripción",
    kept: "Seguimos: tu suscripción continúa",
    leave: "Darme de baja",
    commitment: "Contrato A medida hasta el {date}.",
    request: "Tu solicitud {kind} del\n        {date}: <b>{state}</b>.",
    requestContract: "sobre el contrato",
    requestBudget: "de presupuesto",
    requestNew: " Te contestamos en un día laborable.",
    stripeTrial: "Estás en el periodo de prueba hasta el <b>{date}</b>:\n      hasta entonces no se cobra nada. Ese día se pasará el primer recibo, salvo que te des de baja antes.",
    billingTitle: "Datos de facturación",
    billingHint: "Con estos datos se hacen tus recibos y facturas. ",
    billingReview: "Revísalos antes del {date}, cuando se pasa el primer recibo.",
    fixData: "Corregir datos",
    unreadable: "No se han podido leer ahora. Puedes verlos y cambiarlos con «Corregir datos».",
    missing: "Falta",
    missingData: "Faltan datos para poder facturarte: complétalos con «Corregir datos».",
    companyName: "Razón social",
    taxId: "NIF o CIF",
    receiptEmail: "Correo para los recibos",
    taxAddress: "Dirección fiscal",
    conditions: "Condiciones",
    condition1: "Mínimo 3 usuarios en Campo, Comercial y Empresa. Añades o quitas usuarios cuando quieras.",
    condition2: "Puesta en marcha (importar tus Excel, configurar la empresa y formar al equipo): incluida con pago anual; con pago mensual, {fee} una sola vez.",
    condition3: "Prueba de 30 días con tus propios datos, sin permanencia. Si no sigues, te llevas tus datos.",
    condition4: "Desarrollos y configuraciones a medida: presupuesto según lo que necesites.",
    whatIncludes: "Qué incluye cada plan",
    module: "Módulo",
    included: "Incluido",
    notIncluded: "No incluido",
    portal: "Portal {ofTheProfessional} y del centro",
    portalHint: "Informe, constancia, material, mensajes y pedidos del centro",
    upTo: "Hasta {count}",
    asEachPerson: "Ver la plataforma como cada persona",
    asEachPersonHint: "De tu equipo, para ayudarla",
    pricePerUser: "Precio por usuario",
    pricePerUserHint: "Al mes, IVA no incluido",
    priceCell: "{price} · {yearly} anual"
  },
  request: {
    contractTitle: "Hablar de tu contrato A medida",
    budgetTitle: "Pide tu plan A medida",
    subtitle: "Cuéntanos qué necesitáis y te respondemos en un día laborable. No te comprometes a nada.",
    lookingFor: "Qué buscáis",
    lookingForHint: "(marca lo que encaje; no hace falta acertar)",
    program: "¿Con qué programa?",
    programPlaceholder: "Por ejemplo: Holded, Sage, A3, Salesforce…",
    words: "Cuéntanos con tus palabras",
    wordsPlaceholder: "Qué queréis conseguir, cómo trabajáis hoy, qué os falta… Todo nos ayuda a proponeros lo mejor.",
    team: "Vuestro equipo",
    users: "Usuarios aproximados",
    nowYouAre: "Ahora sois {count}.",
    withPortal: "{Professionals} o centros con portal",
    optional: "Opcional",
    when: "¿Cuándo os gustaría empezar?",
    contact: "Cómo te contactamos",
    name: "Nombre",
    email: "Correo",
    phone: "Teléfono",
    bestTime: "Mejor momento",
    bestTimePlaceholder: "Por ejemplo: mañanas de 9 a 13",
    prefers: "Prefieres",
    byEmail: "Correo",
    byCall: "Llamada",
    byVideo: "Videollamada",
    cancel: "Cancelar",
    send: "Enviar solicitud",
    tellUs: "Marca qué buscáis o cuéntanoslo con tus palabras",
    leaveContact: "Déjanos un correo o un teléfono para contestarte",
    tooMany: "Ya nos has enviado varias hoy: te contestamos enseguida",
    empty: "Cuéntanos qué buscáis",
    noPermission: "No puedes enviar solicitudes",
    couldNotSend: "No se ha podido enviar",
    sentTitle: "Solicitud enviada",
    thanks: "<b>Gracias, {name}.</b> Ya la tenemos: te {how}\n          en un día laborable{email}.",
    howEmail: "escribimos",
    howCall: "llamamos",
    howVideo: "proponemos una videollamada",
    seeState: "Puedes ver en qué punto está en Plan y suscripción.",
    understood: "Entendido"
  }
};

// src/app/i18n/es/chunks/settings-plan/index.ts
var texts = { settingsRest };

// src/app/screens/settings/plan/texts.ts
registerMessages(texts);

// delcos-shared:src/app/legacy/bridge.ts
var shared2 = globalThis["__delcosModules"]["legacy/bridge"];
var pick2 = (name) => shared2[name];
var callRpc = /* @__PURE__ */ pick2("callRpc");
var cardSectionsLegacy = /* @__PURE__ */ pick2("cardSectionsLegacy");
var currentScreen = /* @__PURE__ */ pick2("currentScreen");
var goTo = /* @__PURE__ */ pick2("goTo");
var icon = /* @__PURE__ */ pick2("icon");
var legacyDb = /* @__PURE__ */ pick2("legacyDb");
var notices = /* @__PURE__ */ pick2("notices");
var term = /* @__PURE__ */ pick2("term");

// delcos-shared:src/app/legacy/orders-bridge.ts
var shared3 = globalThis["__delcosModules"]["legacy/orders-bridge"];
var pick3 = (name) => shared3[name];
var orderMailLegacy = /* @__PURE__ */ pick3("orderMailLegacy");

// delcos-shared:src/app/legacy/orders2-bridge.ts
var shared4 = globalThis["__delcosModules"]["legacy/orders2-bridge"];
var pick4 = (name) => shared4[name];
var subscriptionLegacy = /* @__PURE__ */ pick4("subscriptionLegacy");

// delcos-shared:src/app/legacy/settings4-bridge.ts
var shared5 = globalThis["__delcosModules"]["legacy/settings4-bridge"];
var pick5 = (name) => shared5[name];
var planLegacy = /* @__PURE__ */ pick5("planLegacy");
var profileLegacy = /* @__PURE__ */ pick5("profileLegacy");

// delcos-shared:src/app/services/date-format.ts
var shared6 = globalThis["__delcosModules"]["services/date-format"];
var pick6 = (name) => shared6[name];
var formatShortDate = /* @__PURE__ */ pick6("formatShortDate");

// delcos-shared:src/app/services/format.ts
var shared7 = globalThis["__delcosModules"]["services/format"];
var pick7 = (name) => shared7[name];
var escapeHtml = /* @__PURE__ */ pick7("escapeHtml");
var formatNumber = /* @__PURE__ */ pick7("formatNumber");

// delcos-shared:src/app/screens/orders/subscription/payments.ts
var shared8 = globalThis["__delcosModules"]["screens/orders/subscription/payments"];
var pick8 = (name) => shared8[name];
var callPayments = /* @__PURE__ */ pick8("callPayments");
var loadPaymentState = /* @__PURE__ */ pick8("loadPaymentState");

// delcos-shared:src/app/screens/orders/index.ts
var shared9 = globalThis["__delcosModules"]["screens/orders/index"];
var pick9 = (name) => shared9[name];
var choosePlan = /* @__PURE__ */ pick9("choosePlan");

// src/app/screens/settings/plan/catalog.ts
var CUSTOM = "medida";
var YEAR_MONTHS_PAID = 10;
function planButton(plan, view) {
  const style = plan === view.next ? "btn" : "btn sec";
  if (planLegacy.paymentPlans().includes(plan.id)) {
    if (!view.canPay || view.plan === CUSTOM && !view.stripeSubscription) return "";
    return `<button type="button" class="${style}" data-pgplan="${plan.id}">${t(view.subscribed ? "settingsRest.plan.changeTo" : "settingsRest.plan.hire", { plan: planLegacy.of(plan.id).nombre })}</button>`;
  }
  const customCard = plan.id === CUSTOM;
  return `<button type="button" class="${style}" data-presu="${customCard && view.plan !== CUSTOM ? "presupuesto" : "contrato"}">${t(customCard ? "settingsRest.plan.askBudget" : "settingsRest.plan.talk")}</button>`;
}
function planCard(plan, view) {
  const euros = planLegacy.euros;
  const price = plan.presupuesto ? t("settingsRest.plan.customPrice") : t("settingsRest.plan.price", { price: euros(plan.precio), yearly: euros(plan.anual), year: euros(plan.precio * YEAR_MONTHS_PAID) });
  const button = plan.id === view.currentId ? `<button class="btn sec" disabled>${t("settingsRest.plan.current")}</button>` : planButton(plan, view);
  return `<div class="plan ${plan.id === view.currentId ? "actual" : ""} ${plan === view.next ? "dest" : ""}" data-plan="${plan.id}">
      <h3>${escapeHtml(plan.nombre)}</h3><div class="sm">${escapeHtml(plan.para)}</div>
      <div class="precio">${price}</div>
      <ul class="manlist">${plan.ventajas.map((item) => `<li><span>✓</span><span>${escapeHtml(item)}</span></li>`).join("")}</ul>
      ${button}</div>`;
}
var plansHtml = (view) => `<div class="planes">${planLegacy.all().map((plan) => planCard(plan, view)).join("")}</div>`;
function conditionsHtml() {
  const items = [t("settingsRest.plan.condition1"), t("settingsRest.plan.condition2", { fee: planLegacy.euros(planLegacy.setupFee()) }), t("settingsRest.plan.condition3"), t("settingsRest.plan.condition4")];
  return `<div class="card" id="plancond"><h2>${t("settingsRest.plan.conditions")}</h2><ul class="manlist">
      ${items.map((item) => `<li><span>✓</span><span>${item}</span></li>`).join("\n      ")}</ul></div>`;
}
function cell(plan, currentId, value) {
  const content = value === true ? `<span class="si" role="img" aria-label="${t("settingsRest.plan.included")}">${icon("check")}</span>` : value === false ? `<span class="no" role="img" aria-label="${t("settingsRest.plan.notIncluded")}">—</span>` : value;
  return `<td class="${plan.id === currentId ? "act" : ""}">${content}</td>`;
}
function featureRows(currentId) {
  const plans = planLegacy.all();
  return planLegacy.rows().map(([name, description, included]) => included === null || included === void 0 && description === null ? `<tr class="plangrupo"><td colspan="${plans.length + 1}">${escapeHtml(name)}</td></tr>` : `<tr><td><b>${escapeHtml(name)}</b>${description ? `<span class="sm">${escapeHtml(description)}</span>` : ""}</td>${plans.map((plan) => cell(plan, currentId, (included ?? []).includes(plan.id))).join("")}</tr>`).join("");
}
function extraRows(currentId) {
  const plans = planLegacy.all(), euros = planLegacy.euros;
  const portal = (plan) => plan.medicos === 0 ? false : plan.medicos ? t("settingsRest.plan.upTo", { count: plan.medicos }) : t("settingsRest.plan.noLimit");
  const price = (plan) => plan.presupuesto ? t("settingsRest.plan.custom") : t("settingsRest.plan.priceCell", { price: euros(plan.precio), yearly: euros(plan.anual) });
  const row = (title, hint, value) => `<tr><td>${title}<span class="sm">${hint}</span></td>${plans.map((plan) => cell(plan, currentId, value(plan))).join("")}</tr>`;
  return row(`<b>${t("settingsRest.plan.portal", { ofTheProfessional: term("medico", { article: "del" }) })}</b>`, t("settingsRest.plan.portalHint"), portal) + row(`<b>${t("settingsRest.plan.asEachPerson")}</b>`, t("settingsRest.plan.asEachPersonHint"), (plan) => plan.id === CUSTOM) + row(`<b>${t("settingsRest.plan.pricePerUser")}</b>`, t("settingsRest.plan.pricePerUserHint"), price);
}
function matrixHtml(currentId) {
  const plans = planLegacy.all();
  return `<div class="card"><h2>${t("settingsRest.plan.whatIncludes")}</h2><div class="dgrid-wrap"><table class="planmat"><thead><tr><th>${t("settingsRest.plan.module")}</th>${plans.map((plan) => `<th class="${plan.id === currentId ? "act" : ""}">${escapeHtml(plan.nombre)}</th>`).join("")}</tr></thead>
      <tbody>${featureRows(currentId)}${extraRows(currentId)}</tbody></table></div></div>`;
}

// src/app/screens/settings/plan/current-card.ts
var PERCENT = 100;
var YEAR_MONTHS_PAID2 = 10;
var YEAR_MONTHS = 12;
var subscribed = (plan) => Boolean(plan.stripe_suscripcion);
function trialNotice(plan) {
  return plan.en_prueba && plan.periodo_fin && !plan.baja_al_final ? `<div class="banda-info" id="pgprueba">${t("settingsRest.plan.stripeTrial", { date: formatShortDate(plan.periodo_fin) })}</div>` : "";
}
function requestNotice(request) {
  if (!request) return "";
  const kind = t(request.tipo === "contrato" ? "settingsRest.plan.requestContract" : "settingsRest.plan.requestBudget");
  return `<div class="banda-info" id="presuest">${t("settingsRest.plan.request", { kind, date: formatShortDate(request.creado_en.slice(0, 10)), state: escapeHtml(planLegacy.requestState(request.estado)) })}${request.estado === "Nueva" ? t("settingsRest.plan.requestNew") : ""}</div>`;
}
function leavingNotice(plan, canPay) {
  if (!plan.baja_al_final || plan.estado !== "activo") return "";
  const date = formatShortDate(plan.periodo_fin ?? "");
  const content = canPay && subscribed(plan) ? `${t("settingsRest.plan.leavingWithButton", { date })}
      <button type="button" class="btn sec" id="pgseguir">${t("settingsRest.plan.keep")}</button>` : t("settingsRest.plan.leaving", { date });
  return `<div class="banda-aviso" id="pgbajafin">${content}</div>`;
}
function plannedNotice(plan, canManage) {
  const change = plan.cambio_previsto;
  if (!change?.plan) return "";
  const payment = t(change.pago === "anual" ? "settingsRest.plan.yearlyLower" : "settingsRest.plan.monthlyLower");
  return `<div class="banda-info" id="pgprevisto">${t("settingsRest.plan.planned", { date: formatShortDate(change.desde), plan: escapeHtml(planLegacy.of(change.plan).nombre), users: formatNumber(change.usuarios), payment })}
    ${canManage ? `<button type="button" class="btn sec" id="pganular">${t("settingsRest.plan.cancelChange")}</button>` : ""}</div>`;
}
function stateNotices(plan) {
  const next = subscribed(plan) && plan.periodo_fin && plan.estado === "activo" ? `<p class="sm">${t("settingsRest.plan.nextReceipt", { date: formatShortDate(plan.periodo_fin) })}</p>` : "";
  const cancelled = plan.estado === "cancelada" ? `<div class="banda-aviso">${t("settingsRest.plan.cancelled", { date: formatShortDate(plan.periodo_fin ?? "") })}</div>` : "";
  const since = plan.impago_desde ? t("settingsRest.plan.unpaidSince", { date: formatShortDate(plan.impago_desde) }) : "";
  const unpaid = plan.estado === "impago" ? `<div class="banda-peligro">${t("settingsRest.plan.unpaid", { since })}</div>` : "";
  return next + cancelled + unpaid;
}
function noticesHtml(view) {
  const plan = view.plan, commitment = plan.plan === "medida" && plan.compromiso_hasta ? `<p class="sm" id="pgcomp">${t("settingsRest.plan.commitment", { date: formatShortDate(plan.compromiso_hasta) })}</p>` : "";
  return trialNotice(plan) + requestNotice(view.request) + commitment + leavingNotice(plan, view.canPay) + plannedNotice(plan, view.canPay) + stateNotices(plan);
}
function kpisHtml(view, contracted) {
  const { base, definition } = view, yearly = base.pago === "anual";
  const fee = definition.presupuesto || contracted === Infinity ? null : contracted * (yearly ? definition.precio * YEAR_MONTHS_PAID2 / YEAR_MONTHS : definition.precio);
  const payment = definition.presupuesto ? t("settingsRest.plan.custom") : t(yearly ? "settingsRest.plan.yearly" : "settingsRest.plan.monthly");
  return `<div class="kpis">
        <div class="kpi"><b>${contracted === Infinity ? t("settingsRest.plan.noLimit") : formatNumber(contracted)}</b><span>${t("settingsRest.plan.contracted")}</span></div>
        <div class="kpi"><b>${formatNumber(view.used)}</b><span>${t("settingsRest.plan.inUse")}</span></div>
        <div class="kpi"><b>${payment}</b><span>${t("settingsRest.plan.payment")}</span></div>
        ${fee === null ? "" : `<div class="kpi"><b>${planLegacy.euros(fee)}</b><span>${t("settingsRest.plan.perMonth")}</span></div>`}
        ${definition.medicos === 0 ? "" : `<div class="kpi"><b>${formatNumber(view.professionals)}${definition.medicos ? ` / ${definition.medicos}` : ""}</b><span>${t("settingsRest.plan.withAccess", { Professionals: term("medico", { number: "p", capital: "C" }) })}</span></div>`}
      </div>`;
}
function usageHtml(used, contracted) {
  if (contracted === Infinity) return "";
  const percent = Math.min(PERCENT, Math.round(used / contracted * PERCENT));
  const extra = used - contracted === 1 ? t("settingsRest.plan.overOne") : t("settingsRest.plan.overMany", { count: formatNumber(used - contracted) });
  return `<div class="barrauso" title="${t("settingsRest.plan.usage", { used: formatNumber(used), total: formatNumber(contracted) })}"><i style="width:${percent}%"></i></div>
      ${used > contracted ? `<div class="banda-aviso" id="plansobre">${t("settingsRest.plan.over", { extra, total: formatNumber(contracted) })}</div>` : ""}`;
}
function actionsHtml(view) {
  const plan = view.plan, withSubscription = subscribed(plan);
  const pay = view.canPay && plan.plan !== "medida" ? withSubscription ? `<button type="button" class="btn sec" id="pgusu2">${t("settingsRest.plan.usersButton")}</button><button type="button" class="btn sec" id="pgportal">${t("settingsRest.plan.managePayment")}</button>` : `<button type="button" class="btn" id="pgelegir">${t("settingsRest.plan.choose")}</button>` : "";
  const leave = view.canPay && withSubscription && plan.estado === "activo" && !plan.baja_al_final ? `<button type="button" class="btn sec" id="pgdarbaja">${t("settingsRest.plan.leave")}</button>` : "";
  const talk = view.canTalk ? `<button type="button" class="btn sec" data-presu="contrato">${t("settingsRest.plan.talk")}</button>` : "";
  return `<div class="acts">${pay}${leave}${talk}</div>`;
}
function currentCardHtml(view) {
  const contracted = planLegacy.contractedUsers(), base = view.base;
  return `<div class="card" id="planact"><h2>${t("settingsRest.plan.yourPlan", { plan: escapeHtml(view.definition.nombre) })}</h2>${noticesHtml(view)}
      ${base.estado === "prueba" ? `<div class="banda-aviso">${t("settingsRest.plan.trial", { date: formatShortDate(base.prueba_hasta ?? "") })}</div>` : ""}
      ${kpisHtml(view, contracted)}
      ${usageHtml(view.used, contracted)}
      ${actionsHtml(view)}</div>`;
}

// delcos-shared:src/app/legacy/settings3-bridge.ts
var shared10 = globalThis["__delcosModules"]["legacy/settings3-bridge"];
var pick10 = (name) => shared10[name];
var settingsExtraLegacy = /* @__PURE__ */ pick10("settingsExtraLegacy");

// src/app/screens/settings/plan/request.ts
var MIN_CUSTOM_USERS = 50;
var PLAN_SCREENS = ["plan", "organizacion", "config"];
var CONTACTS = [["correo", "byEmail", "howEmail"], ["llamada", "byCall", "howCall"], ["video", "byVideo", "howVideo"]];
var FAILURES = /* @__PURE__ */ new Map([["demasiadas", "settingsRest.request.tooMany"], ["vacia", "settingsRest.request.empty"], ["permiso", "settingsRest.request.noPermission"]]);
var field = (id) => document.getElementById(id);
var text = (id) => field(id)?.value.trim() ?? "";
function needsHtml() {
  return `<section><h3>${t("settingsRest.request.lookingFor")} <span class="sm">${t("settingsRest.request.lookingForHint")}</span></h3>
        <div class="presuops">${planLegacy.needs().map(([key, title]) => `<label class="presuop"><input type="checkbox" value="${key}"><span>${escapeHtml(title)}</span></label>`).join("")}</div>
        <div id="presuprogw" class="hide"><label for="presuprog">${t("settingsRest.request.program")}</label><input id="presuprog" placeholder="${t("settingsRest.request.programPlaceholder")}"></div>
        <label for="presumsg">${t("settingsRest.request.words")}</label>
        <textarea id="presumsg" rows="4" placeholder="${t("settingsRest.request.wordsPlaceholder")}"></textarea></section>`;
}
function teamHtml() {
  const state = planLegacy.paymentState(), used = Number(state.usuarios ?? 0), professionals = Number(state.medicos ?? 0);
  return `<section><h3>${t("settingsRest.request.team")}</h3>
        <div class="g2"><div><label for="presuusu">${t("settingsRest.request.users")}</label><input id="presuusu" type="number" min="1" class="numw" value="${Math.max(MIN_CUSTOM_USERS, used)}">
            <span class="sm">${t("settingsRest.request.nowYouAre", { count: formatNumber(used) })}</span></div>
          <div><label for="presumed">${t("settingsRest.request.withPortal", { Professionals: term("medico", { number: "p", capital: "C" }) })}</label><input id="presumed" type="number" min="0" class="numw" value="${professionals || ""}" placeholder="${t("settingsRest.request.optional")}"></div>
          <div><label for="presucuando">${t("settingsRest.request.when")}</label><select id="presucuando">${planLegacy.whenOptions().map((option) => `<option>${escapeHtml(option)}</option>`).join("")}</select></div></div></section>`;
}
function contactHtml() {
  const me = profileLegacy.me();
  return `<section><h3>${t("settingsRest.request.contact")}</h3>
        <div class="g2"><div><label for="presunom">${t("settingsRest.request.name")}</label><input id="presunom" value="${escapeHtml(me.nombre)}"></div>
          <div><label for="presumail">${t("settingsRest.request.email")}</label><input id="presumail" type="email" value="${escapeHtml(me.email ?? "")}"></div>
          <div><label for="presutel">${t("settingsRest.request.phone")}</label><input id="presutel" type="tel" placeholder="${t("settingsRest.request.optional")}" value="${escapeHtml(me.telefono ?? "")}"></div>
          <div><label for="presuhora">${t("settingsRest.request.bestTime")}</label><input id="presuhora" placeholder="${t("settingsRest.request.bestTimePlaceholder")}"></div></div>
        <label>${t("settingsRest.request.prefers")}</label><div class="segs" role="group" id="presucont">${CONTACTS.map(([key, label]) => `<button type="button" data-pc="${key}" class="${key === "correo" ? "on" : ""}" aria-pressed="${String(key === "correo")}">${t(`settingsRest.request.${label}`)}</button>`).join("")}</div></section>`;
}
var checkedNeeds = (body) => [...body.querySelectorAll(".presuop input:checked")].map((box) => box.value);
function requestData(body, contact) {
  const needs = checkedNeeds(body);
  return {
    necesita: needs,
    necesita_txt: needs.map((key) => planLegacy.needs().find((item) => item[0] === key)?.[1] ?? key),
    programa: text("presuprog") || null,
    mensaje: text("presumsg"),
    usuarios: Number(field("presuusu")?.value) || null,
    portal: Number(field("presumed")?.value) || null,
    cuando: field("presucuando")?.value ?? "",
    nombre: text("presunom"),
    correo: text("presumail"),
    telefono: text("presutel") || null,
    horario: text("presuhora") || null,
    contacto: contact,
    plan_actual: planLegacy.current().plan ?? null
  };
}
function sentHtml(data, contact) {
  const how = t(`settingsRest.request.${CONTACTS.find((item) => item[0] === contact)?.[2] ?? "howVideo"}`);
  const email = data.correo ? ` (${escapeHtml(data.correo)})` : "";
  return `<div class="fh"><div><h2>${t("settingsRest.request.sentTitle")}</h2></div><button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>
      <div class="presuok"><div class="presuokic">${icon("check")}</div>
        <p>${t("settingsRest.request.thanks", { name: escapeHtml(settingsExtraLegacy.firstName(String(data.nombre || profileLegacy.me().nombre || ""))), how, email })}</p>
        <p class="sm">${t("settingsRest.request.seeState")}</p></div>
      <div class="acts u-end"><button class="btn" data-cerrar>${t("settingsRest.request.understood")}</button></div>`;
}
function complete(body) {
  if (!checkedNeeds(body).length && !text("presumsg")) {
    notices.toast(t("settingsRest.request.tellUs"), true);
    field("presumsg")?.focus();
    return false;
  }
  if (!text("presumail") && !text("presutel")) {
    notices.toast(t("settingsRest.request.leaveContact"), true);
    return false;
  }
  return true;
}
async function send(kind, body, contact, button) {
  if (!complete(body)) return;
  const data = requestData(body, contact);
  button.disabled = true;
  const { data: result, error } = await callRpc("pedir_presupuesto", { p: { tipo: kind, datos: data } });
  button.disabled = false;
  if (error || !result?.ok) {
    notices.toast(t(FAILURES.get(result?.error ?? "") ?? "settingsRest.request.couldNotSend"), true);
    return;
  }
  body.innerHTML = sentHtml(data, contact);
  document.getElementById("dlg")?.addEventListener("close", () => {
    if (PLAN_SCREENS.includes(currentScreen())) goTo(currentScreen());
  }, { once: true });
}
function bind(kind, body) {
  const state = { contact: "correo" };
  body.querySelectorAll(".presuop input").forEach((box) => {
    box.onchange = () => {
      box.closest(".presuop")?.classList.toggle("on", box.checked);
      document.getElementById("presuprogw")?.classList.toggle("hide", !checkedNeeds(body).includes("conexion"));
    };
  });
  const options = body.querySelectorAll("[data-pc]");
  options.forEach((option) => {
    option.onclick = () => {
      state.contact = option.dataset.pc ?? "correo";
      options.forEach((other) => {
        other.classList.toggle("on", other === option);
        other.setAttribute("aria-pressed", String(other === option));
      });
    };
  });
  const ok = document.getElementById("presuok");
  if (ok) ok.onclick = () => {
    void send(kind, body, state.contact, ok);
  };
}
function askBudget(requested) {
  const kind = requested === "contrato" ? "contrato" : "presupuesto", body = document.getElementById("dbody");
  if (!body) return;
  body.innerHTML = `<div class="fh"><div><h2>${t(kind === "contrato" ? "settingsRest.request.contractTitle" : "settingsRest.request.budgetTitle")}</h2>
      <div class="sm">${t("settingsRest.request.subtitle")}</div></div>
      <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>
    <div class="presu">
      ${needsHtml()}
      ${teamHtml()}
      ${contactHtml()}
    </div>
    <div class="acts u-end"><button class="btn sec" data-cerrar>${t("settingsRest.request.cancel")}</button><button class="btn" id="presuok">${t("settingsRest.request.send")}</button></div>`;
  bind(kind, body);
  document.getElementById("dlg")?.showModal();
}

// delcos-shared:src/app/screens/settings/plan/usage.ts
var shared11 = globalThis["__delcosModules"]["screens/settings/plan/usage"];
var pick11 = (name) => shared11[name];
var loadLimits = /* @__PURE__ */ pick11("loadLimits");
var usageCardHtml = /* @__PURE__ */ pick11("usageCardHtml");

// src/app/screens/settings/plan/page.ts
var REQUEST_SHOWN_DAYS = 30;
var DAY_MS = 864e5;
async function lastRequest() {
  try {
    const { data } = await legacyDb().from("solicitudes_plan").select("creado_en,estado,tipo").order("creado_en", { ascending: false }).limit(1);
    const request = (data ?? [])[0];
    return request && (request.estado !== "Cerrada" || Date.now() - new Date(request.creado_en).getTime() < REQUEST_SHOWN_DAYS * DAY_MS) ? request : null;
  } catch {
    return null;
  }
}
async function billingData(plan) {
  if (!plan.stripe_cliente || !subscriptionLegacy.canManageCompany()) return void 0;
  return orderMailLegacy.invoke("pagos", { accion: "datos" }).then((answer) => answer.data, () => null).catch(() => null);
}
function billingRows(data) {
  if (!data?.ok) return `<p class="sm">${t("settingsRest.plan.unreadable")}</p>`;
  const fields = data.datos ?? {};
  const rows = [[t("settingsRest.plan.companyName"), fields.nombre], [t("settingsRest.plan.taxId"), fields.nif], [t("settingsRest.plan.receiptEmail"), fields.email], [t("settingsRest.plan.taxAddress"), fields.direccion]];
  const missing = rows.filter(([, value]) => !value).length;
  return rows.map(([name, value]) => `<div class="pgdfila${value ? "" : " falta"}"><span>${escapeHtml(name)}</span><b>${value ? escapeHtml(value) : t("settingsRest.plan.missing")}</b></div>`).join("") + (missing ? `<div class="banda-aviso u-mt-8">${t("settingsRest.plan.missingData")}</div>` : "");
}
function billingHtml(plan, data) {
  if (data === void 0) return "";
  const review = plan.en_prueba ? t("settingsRest.plan.billingReview", { date: formatShortDate(plan.periodo_fin ?? "") }) : "";
  return `<div class="card cfgpanel" id="pgdatos"><h2 class="u-p-0-0-4">${t("settingsRest.plan.billingTitle")}</h2>
    <p class="sm">${t("settingsRest.plan.billingHint")}${review}</p>
    <div class="pgdlista">${billingRows(data)}</div>
    <div class="acts"><button type="button" class="btn sec" id="pgdcorr">${t("settingsRest.plan.fixData")}</button></div></div>`;
}
var header = () => ["organizacion", "config"].includes(currentScreen()) ? `<p class="sm">${t("settingsRest.plan.priceNote")}</p>` : `<div class="saludo"><div><h1>${t("settingsRest.plan.pageTitle")}</h1><div class="fecha">${t("settingsRest.plan.priceNote")}</div></div></div>`;
async function payAndReload(body, button, done) {
  const answer = await callPayments(body, button);
  if (!answer) return;
  notices.toast(t(done === "cancel" ? "settingsRest.plan.changeCancelled" : "settingsRest.plan.kept"));
  await loadPaymentState();
  goTo(currentScreen());
}
function bind2(box, plan) {
  const on = (id, action) => {
    const button = document.getElementById(id);
    if (button) button.onclick = () => {
      action(button);
    };
  };
  box.querySelectorAll("[data-pgplan]").forEach((button) => {
    button.onclick = () => {
      void choosePlan(button.dataset.pgplan);
    };
  });
  on("pgusu2", () => {
    void choosePlan(plan.plan);
  });
  on("pgportal", (button) => {
    subscriptionLegacy.openPortal(button);
  });
  on("pgelegir", () => {
    void choosePlan();
  });
  on("pganular", (button) => {
    void payAndReload({ accion: "anular_cambio" }, button, "cancel");
  });
  on("pgseguir", (button) => {
    void payAndReload({ accion: "reanudar" }, button, "keep");
  });
  on("pgdarbaja", (button) => {
    void callPayments({ accion: "baja" }, button).then((answer) => {
      if (answer?.url) location.href = answer.url;
    });
  });
  on("pgdcorr", (button) => {
    subscriptionLegacy.openPortal(button);
  });
  box.querySelectorAll("[data-presu]").forEach((button) => {
    button.onclick = () => {
      askBudget(button.dataset.presu ?? "");
    };
  });
}
async function paintPlanPage() {
  const { data } = await callRpc("plan_uso", {});
  const use = data ?? {}, base = use.plan ?? {};
  if (base.plan) planLegacy.setCurrent(base);
  const plan = planLegacy.current(), definition = planLegacy.of(base.plan), all = planLegacy.all();
  const [request, billing, limits] = await Promise.all([lastRequest(), billingData(plan), loadLimits()]);
  const box = document.getElementById("cfgcuerpo");
  if (!box) return;
  const canPay = subscriptionLegacy.canManageCompany(), next = all[all.findIndex((item) => item.id === definition.id) + 1] ?? null;
  const view = { currentId: definition.id, next, canPay, subscribed: Boolean(plan.stripe_suscripcion), plan: plan.plan, stripeSubscription: Boolean(plan.stripe_suscripcion) };
  const asksDelcos = all.some((item) => item.id !== definition.id && !planLegacy.paymentPlans().includes(item.id));
  const canTalk = plan.plan === "medida" && !asksDelcos && !cardSectionsLegacy.can("gestionar_plataforma");
  box.innerHTML = `${header()}
    ${currentCardHtml({ base, plan, definition, used: Number(use.usuarios ?? 0), professionals: Number(use.medicos ?? 0), canPay, request, canTalk })}${billingHtml(plan, billing)}${usageCardHtml(limits)}
    ${plansHtml(view)}
    ${conditionsHtml()}
    ${matrixHtml(definition.id)}`;
  bind2(box, plan);
}
export {
  askBudget,
  paintPlanPage
};
