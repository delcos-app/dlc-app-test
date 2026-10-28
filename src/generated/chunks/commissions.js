var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value2) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value: value2 }) : obj[key] = value2;
var __publicField = (obj, key, value2) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value2);

// delcos-shared:src/app/i18n/index.ts
var shared = globalThis["__delcosModules"]["i18n/index"];
var pick = (name) => shared[name];
var registerMessages = /* @__PURE__ */ pick("registerMessages");
var t = /* @__PURE__ */ pick("t");

// src/app/i18n/es/chunks/commissions/commissions.ts
var commissions = {
  page: {
    schemes: "Esquemas de comisión",
    schemesHint: "El tramo alcanzado se aplica a todas las unidades del periodo. Televenta suele ir con importe fijo por unidad.",
    perSale: "Por venta cerrada",
    perPortfolio: "Por cartera",
    perUnit: "{amount} por unidad",
    noTiers: "sin tramos",
    unassigned: " · sin asignar",
    edit: "Editar",
    noSchemes: "Todavía no hay esquemas.",
    newScheme: "+ Nuevo esquema",
    settlements: "Liquidaciones",
    calculate: "Calcular el periodo",
    person: "Persona",
    all: "Todas",
    month: "Mes",
    allMonths: "Todos",
    settlementLine: "{period} · {units} unidades · {amount} · {state}",
    approve: "Aprobar",
    markPaid: "Marcar pagada",
    noneFiltered: "Sin liquidaciones con estos filtros.",
    none: "Sin liquidaciones todavía.",
    oneSettlement: "1 liquidación",
    settlementsCount: "{count} liquidaciones",
    summary: "{settlements} · {units} unidades · {amount}",
    unpaid: " · {amount} sin pagar",
    approveText: "La liquidación quedará aprobada y congelada.",
    payText: "La liquidación quedará marcada como pagada.",
    approveTitle: "¿Aprobar?",
    payTitle: "¿Marcar pagada?",
    settled: "Liquidación {state}"
  },
  calculate: {
    couldNotRead: "No se han podido leer las asignaciones: {error}",
    nobody: "Nadie tuvo un esquema de comisión en {period}",
    allClosed: "Las liquidaciones de {period} ya están aprobadas o pagadas: no se recalculan",
    oneDone: "Calculada 1 liquidación",
    done: "Calculadas {count} liquidaciones",
    ofPeriod: " de {period}",
    oneKept: " · 1 ya aprobada o pagada se deja como estaba",
    kept: " · {count} ya aprobadas o pagadas se dejan como estaban",
    failed: " · {count} sin calcular"
  },
  editor: {
    editTitle: "Editar esquema",
    newTitle: "Nuevo esquema",
    subtitle: "Define cómo se calcula la comisión y a quién se aplica",
    name: "Nombre",
    namePlaceholder: "p. ej. Comercial zona norte",
    countedBy: "Se cuenta por",
    portfolio: "Cartera del comercial",
    closes: "Ventas que cierra (televenta)",
    calculation: "Cálculo",
    tierReached: "Tramo alcanzado a todo el volumen",
    marginal: "Por tramos (cada unidad a su tramo)",
    fixed: "Importe fijo por unidad",
    channel: "Canal",
    allChannels: "Todos",
    patientOnly: "Solo venta {toThePatient}",
    centreOnly: "Solo venta a centro",
    eurosPerUnit: "Euros por unidad",
    tiers: "Tramos",
    tiersHint: '· deja vacío el "hasta" del último',
    from: "Desde (uds.)",
    to: "Hasta (uds.)",
    perUnit: "€ por unidad",
    fromPlaceholder: "Desde",
    toPlaceholder: "Hasta",
    perUnitPlaceholder: "€/unidad",
    addTier: "+ Añadir tramo",
    cancel: "Cancelar",
    save: "Guardar",
    create: "Crear esquema",
    giveName: "Ponle un nombre",
    saving: "Guardando…",
    couldNotSave: "No se ha podido guardar",
    saved: "Esquema guardado"
  },
  people: {
    title: "Quién cobra con este esquema",
    saveFirst: "Guarda el esquema y después podrás asignarlo a las personas.",
    loading: "Cargando…",
    current: "Vigente",
    scheduled: "Programado",
    ended: "Terminado",
    locked: "Guardado: no se puede modificar",
    allHistory: "Todo el histórico",
    since: "Desde {date}",
    until: " hasta {date}",
    endToday: "Terminar hoy",
    cancelIt: "Anular",
    nobody: "Nadie cobra todavía con este esquema.",
    addPerson: "Añadir persona…",
    fromToday: "desde hoy",
    wholeHistory: "todo su histórico",
    fromDate: "desde una fecha…",
    assign: "Asignar",
    lockedHint: "Una vez guardada, la asignación queda bloqueada 🔒. Para cambiarla, asigna otro esquema: el anterior termina el día antes.",
    choosePerson: "Elige la persona",
    inAllHistory: "en todo su histórico",
    sinceDate: "desde el {date}",
    assignText: "{name} cobrará con este esquema {when}. Si tenía otro, termina el día antes. Una vez guardado no se puede modificar.",
    assignTitle: "¿Asignar el esquema?",
    couldNotAssign: "No se ha podido asignar",
    assigned: "Asignado a {name}",
    endText: "Dejará de cobrar con este esquema a partir de mañana.",
    endTitle: "¿Terminar hoy?",
    endOk: "Terminar",
    cancelText: "Se anula la asignación programada.",
    cancelTitle: "¿Anular?"
  }
};

// src/app/i18n/es/chunks/commissions/index.ts
var texts = { commissions };

// src/app/screens/commissions/texts.ts
registerMessages(texts);

// delcos-shared:src/app/legacy/bridge.ts
var shared2 = globalThis["__delcosModules"]["legacy/bridge"];
var pick2 = (name) => shared2[name];
var callRpc = /* @__PURE__ */ pick2("callRpc");
var cardSectionsLegacy = /* @__PURE__ */ pick2("cardSectionsLegacy");
var legacyDb = /* @__PURE__ */ pick2("legacyDb");
var notices = /* @__PURE__ */ pick2("notices");
var salesTeam = /* @__PURE__ */ pick2("salesTeam");
var term = /* @__PURE__ */ pick2("term");

// delcos-shared:src/app/legacy/commissions-bridge.ts
var shared3 = globalThis["__delcosModules"]["legacy/commissions-bridge"];
var pick3 = (name) => shared3[name];
var commissionsLegacy = /* @__PURE__ */ pick3("commissionsLegacy");

// delcos-shared:src/app/services/dates.ts
var shared4 = globalThis["__delcosModules"]["services/dates"];
var pick4 = (name) => shared4[name];
var addDays = /* @__PURE__ */ pick4("addDays");
var todayIso = /* @__PURE__ */ pick4("todayIso");

// delcos-shared:src/app/services/format.ts
var shared5 = globalThis["__delcosModules"]["services/format"];
var pick5 = (name) => shared5[name];
var escapeHtml = /* @__PURE__ */ pick5("escapeHtml");
var formatCurrency = /* @__PURE__ */ pick5("formatCurrency");
var formatNumber = /* @__PURE__ */ pick5("formatNumber");

// delcos-shared:src/app/services/values.ts
var shared6 = globalThis["__delcosModules"]["services/values"];
var pick6 = (name) => shared6[name];
var nonZeroOr = /* @__PURE__ */ pick6("nonZeroOr");
var sum = /* @__PURE__ */ pick6("sum");

// src/app/screens/commissions/model.ts
var SETTLEMENT = { draft: "Borrador", approved: "Aprobada", paid: "Pagada" };
var ALL_HISTORY = "2000-01-01";
var schemes = () => commissionsLegacy.schemes();
var forgetSchemes = () => {
  commissionsLegacy.setSchemes([]);
};
function assignmentState(assignment) {
  if (assignment.vigente) return { text: t("commissions.people.current"), pill: "p-est" };
  return assignment.desde > todayIso() ? { text: t("commissions.people.scheduled"), pill: "p-per" } : { text: t("commissions.people.ended"), pill: "p-anu" };
}
function monthEnd(period) {
  const [year = 0, month = 0] = period.split("-").map(Number);
  return `${period}-${String(new Date(year, month, 0).getDate()).padStart(2, "0")}`;
}

// delcos-shared:src/app/services/date-format.ts
var shared7 = globalThis["__delcosModules"]["services/date-format"];
var pick7 = (name) => shared7[name];
var formatMonth = /* @__PURE__ */ pick7("formatMonth");
var formatShortDate = /* @__PURE__ */ pick7("formatShortDate");

// src/app/screens/commissions/scheme-people.ts
var block = (inner) => `<div class="blk" id="esqpers"><h3>${t("commissions.people.title")}</h3>${inner}</div>`;
function rowHtml(item, admin) {
  const state = assignmentState(item), today = todayIso();
  const since = item.desde <= ALL_HISTORY ? t("commissions.people.allHistory") : t("commissions.people.since", { date: formatShortDate(item.desde) });
  return `<div class="esqfila"><span class="candado" title="${t("commissions.people.locked")}">🔒</span>
        <span class="ef1"><b>${escapeHtml(item.persona)}</b><span class="sm">${since}${item.hasta ? t("commissions.people.until", { date: formatShortDate(item.hasta) }) : ""}</span></span>
        <span class="pill ${state.pill}">${state.text}</span>
        ${admin && item.vigente ? `<button type="button" class="kcfg" data-efin="${item.usuario_id}">${t("commissions.people.endToday")}</button>` : ""}
        ${admin && item.desde > today ? `<button type="button" class="kcfg" data-equi="${item.usuario_id}" data-edesde="${item.desde}">${t("commissions.people.cancelIt")}</button>` : ""}</div>`;
}
function addHtml() {
  const people = commissionsLegacy.team().filter((member) => cardSectionsLegacy.roleCan(member.rol, "cobrar_comision"));
  return `<div class="esqadd"><select id="eap"><option value="">${t("commissions.people.addPerson")}</option>${people.map((member) => `<option value="${member.id}">${escapeHtml(member.nombre)}</option>`).join("")}</select>
      <select id="eadm"><option value="hoy">${t("commissions.people.fromToday")}</option><option value="todo">${t("commissions.people.wholeHistory")}</option><option value="fecha">${t("commissions.people.fromDate")}</option></select>
      <span id="eadfw" class="hide"><input id="eadf" type="date" value="${todayIso()}"></span>
      <button type="button" class="btn sec" id="eaok">${t("commissions.people.assign")}</button></div>
      <p class="sm u-mt-6">${t("commissions.people.lockedHint")}</p>`;
}
var value = (id) => document.getElementById(id)?.value ?? "";
async function assign(schemeId, repaint2) {
  const user = value("eap");
  if (!user) {
    notices.toast(t("commissions.people.choosePerson"), true);
    return;
  }
  const mode = value("eadm"), since = mode === "todo" ? ALL_HISTORY : mode === "fecha" ? value("eadf") : todayIso();
  const name = commissionsLegacy.team().find((member) => member.id === user)?.nombre ?? "";
  const when = mode === "todo" ? t("commissions.people.inAllHistory") : t("commissions.people.sinceDate", { date: formatShortDate(since) });
  if (!await notices.confirm(t("commissions.people.assignText", { name, when }), { titulo: t("commissions.people.assignTitle"), ok: t("commissions.people.assign") })) return;
  const { data: result, error } = await legacyDb().rpc("asignar_esquema", { p_usuario: user, p_esquema: schemeId, p_quitar: false, p_desde: since });
  if (error || result?.ok === false) {
    notices.toast(t("commissions.people.couldNotAssign"), true);
    return;
  }
  notices.toast(t("commissions.people.assigned", { name }));
  forgetSchemes();
  repaint2();
}
async function remove(user, since, ending) {
  const asked = ending ? { text: "commissions.people.endText", titulo: "commissions.people.endTitle", ok: "commissions.people.endOk" } : { text: "commissions.people.cancelText", titulo: "commissions.people.cancelTitle", ok: "commissions.people.cancelIt" };
  if (!await notices.confirm(t(asked.text), { titulo: t(asked.titulo), ok: t(asked.ok), peligro: true })) return;
  await legacyDb().rpc("asignar_esquema", { p_usuario: user, p_esquema: null, p_quitar: true, p_desde: since });
}
function bind(schemeId, list, repaint2) {
  const mode = document.getElementById("eadm");
  if (mode) mode.onchange = () => {
    document.getElementById("eadfw")?.classList.toggle("hide", mode.value !== "fecha");
  };
  const ok = document.getElementById("eaok");
  if (ok) ok.onclick = () => {
    void assign(schemeId, repaint2);
  };
  list.querySelectorAll("[data-efin]").forEach((button) => {
    button.onclick = async () => {
      await remove(button.dataset.efin ?? "", addDays(todayIso(), 1), true);
      repaint2();
    };
  });
  list.querySelectorAll("[data-equi]").forEach((button) => {
    button.onclick = async () => {
      await remove(button.dataset.equi ?? "", button.dataset.edesde ?? "", false);
      repaint2();
    };
  });
}
async function paintList(schemeId) {
  const { data } = await legacyDb().rpc("asignaciones_esquema_lista");
  const list = document.getElementById("esqlista");
  if (!list) return;
  const assignments = (data ?? []).filter((item) => item.esquema_id === schemeId), admin = cardSectionsLegacy.can("administrar");
  list.innerHTML = `${assignments.length ? `<div class="esqfilas">${assignments.map((item) => rowHtml(item, admin)).join("")}</div>` : `<p class="sm">${t("commissions.people.nobody")}</p>`}
    ${admin ? addHtml() : ""}`;
  if (admin) bind(schemeId, list, () => {
    void paintList(schemeId);
  });
}
async function paintSchemePeople(schemeId) {
  const buttons = document.getElementById("eguardaresq")?.closest(".acts");
  if (!buttons || document.getElementById("esqpers")) return;
  if (!schemeId) {
    buttons.insertAdjacentHTML("beforebegin", block(`<p class="sm">${t("commissions.people.saveFirst")}</p>`));
    return;
  }
  buttons.insertAdjacentHTML("beforebegin", block(`<div id="esqlista" class="sm">${t("commissions.people.loading")}</div>`));
  if (!salesTeam.members().length) await salesTeam.load();
  await paintList(schemeId);
}

// src/app/screens/commissions/scheme-editor.ts
var FIXED = "fijo";
var DEFAULT_CALCULATION = "tramo_alcanzado";
var option = (value2, label, chosen) => `<option value="${value2}" ${chosen === value2 ? "selected" : ""}>${label}</option>`;
var input = (id) => document.getElementById(id);
var SchemeEditor = class {
  constructor(id, scheme, onSaved) {
    this.id = id;
    this.scheme = scheme;
    this.onSaved = onSaved;
    __publicField(this, "tiers");
    __publicField(this, "calculation");
    __publicField(this, "fixedValue");
    this.tiers = scheme?.tramos?.length ? scheme.tramos.slice() : [{ desde_u: 0, hasta_u: 100, valor: 1 }];
    this.calculation = scheme?.calculo ?? DEFAULT_CALCULATION;
    this.fixedValue = nonZeroOr(scheme?.valor_fijo, 1);
  }
  get fixed() {
    return this.calculation === FIXED;
  }
  tiersHtml() {
    if (this.fixed) return "";
    return `<label>${t("commissions.editor.tiers")} <span class="sm">${t("commissions.editor.tiersHint")}</span></label>
      <div class="trcab" aria-hidden="true"><span>${t("commissions.editor.from")}</span><span>${t("commissions.editor.to")}</span><span>${t("commissions.editor.perUnit")}</span></div>
      <div id="etramos">${this.tiers.map((tier, index) => `<div class="g2" style="margin-bottom:8px">
        <input data-td="${index}" type="number" min="0" value="${tier.desde_u}" placeholder="${t("commissions.editor.fromPlaceholder")}">
        <input data-th="${index}" type="number" min="0" value="${tier.hasta_u ?? ""}" placeholder="${t("commissions.editor.toPlaceholder")}">
        <input data-tv="${index}" type="number" step="0.01" min="0" value="${tier.valor}" placeholder="${t("commissions.editor.perUnitPlaceholder")}">
        ${this.tiers.length > 1 ? `<button type="button" class="btn sec" data-tx="${index}">✕</button>` : ""}</div>`).join("")}</div>
      <div class="acts"><button type="button" class="btn sec" id="etmas">${t("commissions.editor.addTier")}</button></div>`;
  }
  html() {
    const scheme = this.scheme;
    return `
      <div class="fh"><div><h2>${t(this.id ? "commissions.editor.editTitle" : "commissions.editor.newTitle")}</h2>
        <div class="sm">${t("commissions.editor.subtitle")}</div></div>
        <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>
      <label for="enom">${t("commissions.editor.name")}</label><input id="enom" value="${escapeHtml(scheme ? scheme.nombre : "")}" placeholder="${t("commissions.editor.namePlaceholder")}">
      <div class="g2">
        <div><label for="eatr">${t("commissions.editor.countedBy")}</label><select id="eatr">
          ${option("comercial", t("commissions.editor.portfolio"), scheme?.atribucion)}
          ${option("cierra", t("commissions.editor.closes"), scheme?.atribucion)}</select></div>
        <div><label for="ecalc">${t("commissions.editor.calculation")}</label><select id="ecalc">
          ${option(DEFAULT_CALCULATION, t("commissions.editor.tierReached"), this.calculation)}
          ${option("marginal", t("commissions.editor.marginal"), this.calculation)}
          ${option(FIXED, t("commissions.editor.fixed"), this.calculation)}</select></div>
      </div>
      <div class="g2">
        <div><label for="ecan">${t("commissions.editor.channel")}</label><select id="ecan">
          <option value="">${t("commissions.editor.allChannels")}</option>
          ${option("paciente", t("commissions.editor.patientOnly", { toThePatient: term("paciente", { article: "al" }) }), scheme?.canal)}
          ${option("centro", t("commissions.editor.centreOnly"), scheme?.canal)}</select></div>
        ${this.fixed ? `<div><label for="efijo">${t("commissions.editor.eurosPerUnit")}</label><input id="efijo" type="number" step="0.01" min="0" value="${this.fixedValue}"></div>` : "<div></div>"}
      </div>
      ${this.tiersHtml()}
      <div class="acts u-end">
        <button class="btn sec" data-cerrar>${t("commissions.editor.cancel")}</button>
        <button class="btn" id="eguardaresq">${t(this.id ? "commissions.editor.save" : "commissions.editor.create")}</button></div>`;
  }
  /** Reads the tiers as they are written. */
  read() {
    const box = document.getElementById("etramos");
    if (this.fixed || !box) return;
    this.tiers = [...box.children].map((row, index) => {
      const value2 = (attribute) => row.querySelector(`[data-${attribute}="${index}"]`)?.value ?? "";
      return { desde_u: Number(value2("td")) || 0, hasta_u: value2("th") === "" ? null : Number(value2("th")), valor: Number(value2("tv")) || 0 };
    });
  }
  paint() {
    const body = document.getElementById("dbody");
    if (!body) return;
    body.innerHTML = this.html();
    const calculation = document.getElementById("ecalc");
    if (calculation) calculation.onchange = () => {
      this.read();
      const fixed = input("efijo");
      if (fixed) this.fixedValue = fixed.value;
      this.calculation = calculation.value;
      this.paint();
    };
    const add = document.getElementById("etmas");
    if (add) add.onclick = () => {
      this.read();
      this.addTier();
      this.paint();
    };
    body.querySelectorAll("[data-tx]").forEach((button) => {
      button.onclick = () => {
        this.read();
        this.tiers.splice(Number(button.dataset.tx), 1);
        this.paint();
      };
    });
    void paintSchemePeople(this.id);
    const save = document.getElementById("eguardaresq");
    if (save) save.onclick = () => {
      void this.save(save);
    };
  }
  addTier() {
    const last = this.tiers[this.tiers.length - 1] ?? { desde_u: 0, hasta_u: null, valor: 0 };
    this.tiers.push({ desde_u: nonZeroOr(last.hasta_u, last.desde_u) + 1, hasta_u: null, valor: last.valor });
  }
  /** What guardar_esquema receives. */
  payload(name) {
    const select = (id) => document.getElementById(id)?.value ?? "";
    return {
      id: this.id,
      nombre: name,
      atribucion: select("eatr"),
      calculo: this.calculation,
      canal: select("ecan") || null,
      valor_fijo: this.fixed ? input("efijo")?.value : null,
      ...this.fixed ? {} : { tramos: this.tiers }
    };
  }
  async save(button) {
    this.read();
    const name = input("enom")?.value.trim() ?? "";
    if (!name) {
      notices.toast(t("commissions.editor.giveName"), true);
      return;
    }
    button.disabled = true;
    button.textContent = t("commissions.editor.saving");
    const { data: result, error } = await legacyDb().rpc("guardar_esquema", { p: this.payload(name) });
    button.disabled = false;
    button.textContent = t(this.id ? "commissions.editor.save" : "commissions.editor.create");
    if (error || result?.ok === false) {
      notices.toast(t("commissions.editor.couldNotSave"), true);
      return;
    }
    document.getElementById("dlg")?.close();
    notices.toast(t("commissions.editor.saved"));
    this.onSaved();
  }
};
function editScheme(id, onSaved) {
  const scheme = id ? schemes().find((item) => item.id === id) ?? null : null;
  new SchemeEditor(id, scheme, onSaved).paint();
  document.getElementById("dlg")?.showModal();
}

// src/app/screens/commissions/settlements.ts
var settlementFilters = { person: "", month: "" };
var rowHtml2 = (item) => `<div class="item u-cursor-default" data-liqu="${item.usuario_id}" data-liqp="${item.periodo}">
      <span class="ic ${item.estado === SETTLEMENT.paid ? "o" : ""}">${item.estado === SETTLEMENT.draft ? "○" : "✓"}</span>
      <span class="tx"><b>${escapeHtml(item.nombre)}</b><span class="sm">${t("commissions.page.settlementLine", { period: formatMonth(item.periodo), units: formatNumber(item.unidades), amount: formatCurrency(item.importe), state: escapeHtml(item.estado) })}</span></span>
      <span class="acts u-m-0">
        ${item.estado === SETTLEMENT.draft ? `<button class="btn sec" data-liq="${item.usuario_id}|${item.periodo}|${SETTLEMENT.approved}">${t("commissions.page.approve")}</button>` : ""}
        ${item.estado === SETTLEMENT.approved ? `<button class="btn sec" data-liq="${item.usuario_id}|${item.periodo}|${SETTLEMENT.paid}">${t("commissions.page.markPaid")}</button>` : ""}
      </span></div>`;
function filtersHtml(all) {
  const people = [...new Map(all.map((item) => [item.usuario_id, item.nombre])).entries()].sort((first, second) => String(first[1]).localeCompare(String(second[1]), "es"));
  const months = [...new Set(all.map((item) => item.periodo))].sort().reverse();
  if (settlementFilters.person && !people.some(([id]) => id === settlementFilters.person)) settlementFilters.person = "";
  if (settlementFilters.month && !months.includes(settlementFilters.month)) settlementFilters.month = "";
  return `<div class="liqfil" id="liqfil">
      <div><label for="liqfu">${t("commissions.page.person")}</label><select id="liqfu"><option value="">${t("commissions.page.all")}</option>${people.map(([id, name]) => `<option value="${id}" ${id === settlementFilters.person ? "selected" : ""}>${escapeHtml(name)}</option>`).join("")}</select></div>
      <div><label for="liqfp">${t("commissions.page.month")}</label><select id="liqfp"><option value="">${t("commissions.page.allMonths")}</option>${months.map((month) => `<option value="${month}" ${month === settlementFilters.month ? "selected" : ""}>${escapeHtml(formatMonth(month))}</option>`).join("")}</select></div>
      <p class="sm" id="liqres"></p></div>`;
}
function summary(shown) {
  if (!shown.length) return "";
  const total = sum(shown.map((item) => Number(item.importe) || 0)), units = sum(shown.map((item) => Number(item.unidades) || 0));
  const unpaid = sum(shown.filter((item) => item.estado !== SETTLEMENT.paid).map((item) => Number(item.importe) || 0));
  const count = shown.length === 1 ? t("commissions.page.oneSettlement") : t("commissions.page.settlementsCount", { count: formatNumber(shown.length) });
  return t("commissions.page.summary", { settlements: count, units: formatNumber(units), amount: formatCurrency(total) }) + (unpaid && unpaid !== total ? t("commissions.page.unpaid", { amount: formatCurrency(unpaid) }) : "");
}
async function settle(button, repaint2) {
  const [user = "", period = "", state = ""] = (button.dataset.liq ?? "").split("|"), approve = state === SETTLEMENT.approved;
  if (!await notices.confirm(
    t(approve ? "commissions.page.approveText" : "commissions.page.payText"),
    { titulo: t(approve ? "commissions.page.approveTitle" : "commissions.page.payTitle"), ok: t(approve ? "commissions.page.approve" : "commissions.page.markPaid") }
  )) return;
  await legacyDb().rpc("liquidar", { p_usuario: user, p_periodo: period, p_estado: state });
  notices.toast(t("commissions.page.settled", { state: state.toLowerCase() }));
  repaint2();
}
function paintSettlements(list, all, repaint2) {
  const paint = () => {
    const shown = all.filter((item) => (!settlementFilters.person || item.usuario_id === settlementFilters.person) && (!settlementFilters.month || item.periodo === settlementFilters.month));
    const result = document.getElementById("liqres");
    if (result) result.textContent = summary(shown);
    list.innerHTML = shown.map(rowHtml2).join("") || `<div class="vacio">${t(all.length ? "commissions.page.noneFiltered" : "commissions.page.none")}</div>`;
    list.querySelectorAll("[data-liq]").forEach((button) => {
      button.onclick = () => {
        void settle(button, repaint2);
      };
    });
  };
  const person = document.getElementById("liqfu"), month = document.getElementById("liqfp");
  if (person) person.onchange = () => {
    settlementFilters.person = person.value;
    paint();
  };
  if (month) month.onchange = () => {
    settlementFilters.month = month.value;
    paint();
  };
  paint();
}
function resultText(period, done, closed, failed) {
  const doneText = done === 1 ? t("commissions.calculate.oneDone") : t("commissions.calculate.done", { count: done });
  const kept = closed ? closed === 1 ? t("commissions.calculate.oneKept") : t("commissions.calculate.kept", { count: closed }) : "";
  return doneText + t("commissions.calculate.ofPeriod", { period: formatMonth(period) }) + kept + (failed ? t("commissions.calculate.failed", { count: failed }) : "");
}
async function toCalculate(period) {
  const start = `${period}-01`, end = monthEnd(period), ids = new Set(schemes().map((scheme) => scheme.id));
  const [{ data: assignments, error }, { data: existing }] = await Promise.all([
    legacyDb().from("asignaciones_comision").select("usuario_id,esquema_id,desde,hasta"),
    callRpc("liquidaciones_lista", { p_periodo: period })
  ]);
  if (error) {
    notices.toast(t("commissions.calculate.couldNotRead", { error: error.message ?? "" }), true);
    return null;
  }
  const closed = new Set((existing ?? []).filter((item) => item.estado !== SETTLEMENT.draft).map((item) => item.usuario_id));
  const users = [...new Set((assignments ?? []).filter((item) => ids.has(item.esquema_id) && (!item.desde || item.desde <= end) && (!item.hasta || item.hasta >= start)).map((item) => item.usuario_id))];
  if (!users.length) {
    notices.toast(t("commissions.calculate.nobody", { period: formatMonth(period) }), true);
    return null;
  }
  return { users, closed };
}
async function calculateSettlements(repaint2) {
  const period = document.getElementById("liqper")?.value;
  if (!period) return;
  const found = await toCalculate(period);
  if (!found) return;
  const pending = found.users.filter((user) => !found.closed.has(user));
  if (!pending.length) {
    notices.toast(t("commissions.calculate.allClosed", { period: formatMonth(period) }));
    return;
  }
  const button = document.getElementById("liqcalc");
  if (button) button.disabled = true;
  let failed = 0;
  for (const user of pending) {
    const { data: result, error } = await legacyDb().rpc("liquidar", { p_usuario: user, p_periodo: period, p_estado: SETTLEMENT.draft });
    if (error || result?.ok === false) failed++;
  }
  if (button) button.disabled = false;
  notices.toast(resultText(period, pending.length - failed, found.closed.size, failed), Boolean(failed));
  settlementFilters.month = period;
  repaint2();
}

// src/app/screens/commissions/page.ts
var FIXED2 = "fijo";
var CLOSES = "cierra";
function howItCounts(scheme) {
  if (scheme.calculo === FIXED2) return t("commissions.page.perUnit", { amount: formatCurrency(scheme.valor_fijo) });
  return (scheme.tramos ?? []).map((tier) => `${tier.desde_u}${tier.hasta_u ? `-${tier.hasta_u}` : "+"}: ${formatCurrency(tier.valor)}`).join(" · ") || t("commissions.page.noTiers");
}
function schemeRow(scheme) {
  const people = scheme.personas ?? [];
  return `<div class="item u-cursor-default">
      <span class="ic">${scheme.calculo === FIXED2 ? "€" : "▤"}</span>
      <span class="tx"><b>${escapeHtml(scheme.nombre)}</b><span class="sm">
        ${t(scheme.atribucion === CLOSES ? "commissions.page.perSale" : "commissions.page.perPortfolio")} ·
        ${howItCounts(scheme)}
        ${people.length ? ` · ${people.map(escapeHtml).join(", ")}` : t("commissions.page.unassigned")}</span></span>
      <span class="acts u-m-0"><button class="btn sec chico" data-esq="${scheme.id}">${t("commissions.page.edit")}</button></span></div>`;
}
function pageHtml(all) {
  const list = schemes();
  return `
    <h2>${t("commissions.page.schemes")}<span class="n">${list.length}</span></h2>
    <p class="sm">${t("commissions.page.schemesHint")}</p>
    <div class="lista">${list.map(schemeRow).join("") || `<div class="vacio">${t("commissions.page.noSchemes")}</div>`}</div>
    <div class="acts u-p-0-16-14"><button class="btn" id="esqnuevo">${t("commissions.page.newScheme")}</button></div>

    <h2>${t("commissions.page.settlements")}</h2>
    <div class="acts u-p-0-16">
      <input id="liqper" type="month" value="${todayIso().slice(0, 7)}" style="max-width:190px">
      <button class="btn sec" id="liqcalc">${t("commissions.page.calculate")}</button></div>
    ${filtersHtml(all)}
    <div class="lista"></div>`;
}
var repaint = () => {
  void paintCommissions();
};
async function paintCommissions() {
  const loading = document.getElementById("admcuerpo");
  if (loading) loading.innerHTML = '<div class="skel"></div><div class="skel" style="width:60%"></div>';
  const [{ data: found }, { data: settlements }] = await Promise.all([
    legacyDb().rpc("esquemas_lista"),
    legacyDb().rpc("liquidaciones_lista", { p_periodo: null })
  ]);
  commissionsLegacy.setSchemes(found ?? []);
  const body = document.getElementById("admcuerpo");
  if (!body) return;
  body.innerHTML = pageHtml(settlements ?? []);
  const add = document.getElementById("esqnuevo");
  if (add) add.onclick = () => {
    editScheme(null, repaint);
  };
  body.querySelectorAll("[data-esq]").forEach((button) => {
    button.onclick = () => {
      editScheme(button.dataset.esq ?? null, repaint);
    };
  });
  const calculate = document.getElementById("liqcalc");
  if (calculate) calculate.onclick = () => {
    void calculateSettlements(repaint);
  };
  const list = document.getElementById("liqfil")?.nextElementSibling;
  if (list instanceof HTMLElement) paintSettlements(list, settlements ?? [], repaint);
}
export {
  editScheme,
  paintCommissions
};
