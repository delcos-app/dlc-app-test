// delcos-shared:src/app/i18n/index.ts
var shared = globalThis["__delcosModules"]["i18n/index"];
var pick = (name) => shared[name];
var registerMessages = /* @__PURE__ */ pick("registerMessages");
var t = /* @__PURE__ */ pick("t");

// src/app/i18n/es/chunks/billing/billing.ts
var billing = {
  page: {
    title: "Facturación",
    subtitle: "Facturas emitidas desde los pedidos, rectificativas y cobros",
    invoices: "Facturas",
    series: "Series y numeración",
    company: "Datos fiscales",
    verifactu: "VeriFactu",
    log: "Registro",
    readOnly: "Tu plan {plan} no incluye Facturación:\n      puedes consultar y descargar las facturas que ya emitiste y registrar sus cobros, pero no emitir nuevas."
  },
  list: {
    search: "Buscar",
    searchPlaceholder: "Número, cliente o NIF",
    payment: "Cobro",
    all: "Todos",
    pending: "Pendiente",
    overdue: "Vencida",
    paid: "Cobrada",
    loading: "Cargando facturas…",
    invoiced: "Facturado con IVA · {count} facturas",
    taxBase: "Base imponible",
    vat: "IVA repercutido",
    toCollect: "Pendiente de cobro · {count}",
    overdueTotal: "Vencido · {count}",
    number: "Número",
    date: "Fecha",
    client: "Cliente",
    nif: "NIF",
    base: "Base",
    vatShort: "IVA",
    total: "Total",
    due: "Vencimiento",
    rectifies: "rectifica {number}",
    rectifiedBy: "rectificada: {number}",
    none: "No hay facturas con estos filtros. Las facturas se emiten desde un pedido confirmado (Pedidos → Ventas → abrir el pedido → «Emitir factura»)."
  },
  sheet: {
    couldNotOpen: "No se ha podido abrir la factura",
    rectifying: "Rectificativa",
    invoice: "Factura",
    dueOn: " · vence el {date}",
    rectifiesNotice: "Rectifica la factura <b>{number}</b> · Motivo: {reason}",
    seeOriginal: "Ver original",
    rectifiedBy: "Rectificada por {list}",
    client: "Cliente",
    issuer: "Emisor",
    noNif: "Sin NIF",
    concept: "Concepto",
    units: "Uds.",
    price: "Precio",
    discount: "Dto.",
    vat: "IVA",
    base: "Base",
    baseAt: "Base al {rate}%",
    vatAt: "IVA {rate}%",
    total: "Total",
    payments: "Cobros",
    removePayment: "Quitar",
    noPayments: "Sin cobros registrados.",
    pendingAmount: "Pendiente: <b>{amount}</b>",
    record: "Registro de facturación",
    fingerprint: "Huella: {value}…",
    verifactuState: "VeriFactu: {state}",
    notApplicable: "No aplica",
    seeOrder: "Ver pedido",
    rectify: "Rectificar",
    registerPayment: "Registrar cobro",
    see: "Ver",
    download: "⬇ PDF",
    email: "✉️ Enviar por email",
    removePaymentText: "Se quita este cobro de la factura.",
    removePaymentTitle: "¿Quitar el cobro?"
  },
  payment: {
    title: "Registrar cobro · {number}",
    pending: "Pendiente: {amount}",
    amount: "Importe (€)",
    date: "Fecha",
    method: "Forma de pago",
    note: "Nota",
    optional: "Opcional",
    register: "Registrar",
    writeAmount: "Indica el importe",
    couldNotRegister: "No se ha podido registrar",
    registered: "Cobro registrado"
  },
  rectify: {
    title: "Rectificar {number}",
    subtitle: "Se emite una factura rectificativa en negativo. La original no se toca.",
    reason: "Motivo",
    reasonPlaceholder: "p. ej. Devolución de una caja rota, error en el precio…",
    what: "Qué se rectifica",
    whole: "Toda la factura",
    someUnits: "Solo algunas unidades",
    units: "({units} uds)",
    unitsLabel: "Unidades a rectificar",
    cancelOrder: "Anular también el pedido (las unidades vuelven al stock y dejan de contar en métricas)",
    issue: "Emitir rectificativa",
    writeReason: "Escribe el motivo",
    writeUnits: "Indica las unidades a rectificar",
    failed: "No se ha podido: {error}",
    cancelReason: "Rectificativa {number}: {reason}",
    issued: "Rectificativa {number} emitida"
  },
  series: {
    loading: "Cargando series…",
    intro: "Cada serie numera sus facturas de forma correlativa. Para continuar la numeración de otro programa, pon en «Siguiente número» el que toca.",
    add: "+ Nueva serie",
    series: "Serie",
    type: "Tipo",
    format: "Formato",
    next: "Próximo número",
    last: "Última emitida",
    issued: "Emitidas",
    yearlyReset: "Reinicio anual",
    byDefault: " · por defecto",
    inactive: " · inactiva",
    ordinary: "Facturas",
    rectifying: "Rectificativas",
    simplified: "Simplificadas",
    simplifiedTickets: "Simplificadas (tickets)",
    yes: "Sí",
    no: "No",
    formatHelp: "Formato: <b>{S}</b> código de la serie · <b>{AAAA}</b> o <b>{AA}</b> año · <b>{NNNN}</b> número con tantas cifras como «N». Ejemplo: {S}{AA}{NNNN} → F260408.",
    titleOf: "Serie {code}",
    newTitle: "Nueva serie",
    nextNumber: "Próximo número: ",
    code: "Código",
    codePlaceholder: "p. ej. F, CN, W",
    name: "Nombre",
    nextField: "Siguiente número",
    year: "Año de la numeración",
    restartYearly: "Volver a empezar desde 1 cada año",
    defaultForType: "Serie por defecto para su tipo",
    active: "Activa",
    numberUsed: "Ese número ya se ha usado: el último emitido es el {last}",
    couldNotSave: "No se ha podido guardar",
    saved: "Serie guardada"
  },
  verifactu: {
    on: "Activado",
    off: "Preparado · desactivado",
    intro: "Sistema de la Agencia Tributaria para que las facturas no se puedan alterar y se puedan verificar. La plataforma ya emite cada factura cumpliendo sus requisitos; solo falta conectar el envío cuando decidáis activarlo.",
    step1: "1 · Facturas preparadas",
    step1Text: "Numeración sin huecos, facturas inalterables y rectificativas.",
    step2: "2 · Registro encadenado",
    step2Text: "{count} facturas con huella · {chain}.",
    chainOk: "cadena íntegra",
    chainBroken: "revisar desde {from}",
    step3: "3 · QR y leyenda",
    step3On: "Las facturas nuevas llevan QR y «VERI*FACTU».",
    step3Off: "Se añaden al activarlo.",
    step4: "4 · Envío a Hacienda",
    step4Text: "Requiere el certificado digital de la empresa. Se configura al activarlo.",
    whatTitle: "Qué hace cada factura",
    what1: "Recibe el siguiente número de su serie: no puede haber huecos ni repetidos.",
    what2: "Guarda una <b>huella</b> que la encadena con la anterior: si alguien cambiara una factura, la cadena lo delataría.",
    what3: "No se puede modificar ni borrar: los errores se corrigen con una <b>rectificativa</b>.",
    what4: "Todo queda en el <b>registro de eventos</b>: emisiones, cobros, envíos y cambios de configuración{last}.",
    lastEvent: " (último: {type} el {date})",
    settings: "Configuración",
    activate: "Activar VeriFactu",
    activateHint: "Las facturas nuevas llevarán el QR y la leyenda. Las ya emitidas no cambian.",
    mode: "Modalidad",
    modeVerifactu: "VeriFactu",
    modeVerifactuText: "Cada factura se envía a Hacienda al emitirla. La más sencilla de mantener.",
    modeOther: "No VeriFactu",
    modeOtherText: "Las facturas se firman y se guardan; Hacienda puede pedirlas cuando quiera.",
    environment: "Entorno",
    testing: "Pruebas de la Agencia Tributaria",
    production: "Producción",
    activateText: "Las facturas que se emitan a partir de ahora llevarán el QR y la leyenda VERI*FACTU. El envío a Hacienda necesitará el certificado de la empresa.",
    deactivateText: "Las facturas nuevas dejarán de llevar el QR. Las ya emitidas no cambian.",
    activateTitle: "¿Activar VeriFactu?",
    deactivateTitle: "¿Desactivar VeriFactu?",
    activateOk: "Activar",
    deactivateOk: "Desactivar",
    couldNotSave: "No se ha podido guardar",
    saved: "Guardado · queda anotado en el registro"
  }
};

// src/app/i18n/es/chunks/billing/index.ts
var texts = { billing };

// src/app/screens/billing/texts.ts
registerMessages(texts);

// delcos-shared:src/app/legacy/bridge.ts
var shared2 = globalThis["__delcosModules"]["legacy/bridge"];
var pick2 = (name) => shared2[name];
var accountListLegacy = /* @__PURE__ */ pick2("accountListLegacy");
var appLegacy = /* @__PURE__ */ pick2("appLegacy");
var callRpc = /* @__PURE__ */ pick2("callRpc");
var cardSectionsLegacy = /* @__PURE__ */ pick2("cardSectionsLegacy");
var currentScreen = /* @__PURE__ */ pick2("currentScreen");
var legacyDb = /* @__PURE__ */ pick2("legacyDb");
var notices = /* @__PURE__ */ pick2("notices");
var opportunitiesLegacy = /* @__PURE__ */ pick2("opportunitiesLegacy");

// delcos-shared:src/app/legacy/billing-bridge.ts
var shared3 = globalThis["__delcosModules"]["legacy/billing-bridge"];
var pick3 = (name) => shared3[name];
var billingLegacy = /* @__PURE__ */ pick3("billingLegacy");

// delcos-shared:src/app/services/date-format.ts
var shared4 = globalThis["__delcosModules"]["services/date-format"];
var pick4 = (name) => shared4[name];
var formatLongDate = /* @__PURE__ */ pick4("formatLongDate");
var formatShortDate = /* @__PURE__ */ pick4("formatShortDate");

// delcos-shared:src/app/services/format.ts
var shared5 = globalThis["__delcosModules"]["services/format"];
var pick5 = (name) => shared5[name];
var escapeHtml = /* @__PURE__ */ pick5("escapeHtml");
var formatCurrency = /* @__PURE__ */ pick5("formatCurrency");
var formatNumber = /* @__PURE__ */ pick5("formatNumber");

// delcos-shared:src/app/services/values.ts
var shared6 = globalThis["__delcosModules"]["services/values"];
var pick6 = (name) => shared6[name];
var orFallback = /* @__PURE__ */ pick6("orFallback");
var sum = /* @__PURE__ */ pick6("sum");

// delcos-shared:src/app/services/money.ts
var shared7 = globalThis["__delcosModules"]["services/money"];
var pick7 = (name) => shared7[name];
var round2 = /* @__PURE__ */ pick7("round2");

// src/app/screens/billing/model.ts
var PAYMENT = { paid: "Cobrada", overdue: "Vencida", pending: "Pendiente" };
var euros = (value2) => formatCurrency(round2(value2));
function paymentPill(state) {
  const kind = state === PAYMENT.paid ? "p-est" : state === PAYMENT.overdue ? "p-anu" : "p-bor";
  return `<span class="pill ${kind}">${escapeHtml(state)}</span>`;
}
var errorMessage = (error) => error?.message ?? "";

// src/app/screens/billing/list.ts
var SEARCH_WAIT_MS = 300;
var emptyToNull = (value2) => value2 ? value2 : null;
var field = (id) => document.getElementById(id);
var total = (rows, key) => sum(rows.map((row) => Number(row[key]) || 0));
function shellHtml() {
  const options = ["", PAYMENT.pending, PAYMENT.overdue, PAYMENT.paid].map((value2) => value2 ? `<option>${value2}</option>` : `<option value="">${t("billing.list.all")}</option>`).join("");
  return `<div class="panel">
    <div class="filtros">
      <div id="fper"></div>
      <div><label for="fq">${t("billing.list.search")}</label><input id="fq" type="search" placeholder="${t("billing.list.searchPlaceholder")}"></div>
      <div><label for="fcob">${t("billing.list.payment")}</label><select id="fcob">${options}</select></div>
    </div>
    <div class="kpis vtot" id="ftot"></div>
    <div id="flista"></div></div>`;
}
function totalsHtml(rows) {
  const pending = rows.filter((row) => row.estado_cobro !== PAYMENT.paid), overdue = rows.filter((row) => row.estado_cobro === PAYMENT.overdue);
  return `
      <div class="kpi"><b>${euros(total(rows, "total"))}</b><span>${t("billing.list.invoiced", { count: formatNumber(rows.length) })}</span></div>
      <div class="kpi"><b>${euros(total(rows, "base"))}</b><span>${t("billing.list.taxBase")}</span></div>
      <div class="kpi"><b>${euros(total(rows, "cuota_iva"))}</b><span>${t("billing.list.vat")}</span></div>
      <div class="kpi"><b>${euros(total(pending, "total") - total(pending, "cobrado"))}</b><span>${t("billing.list.toCollect", { count: formatNumber(pending.length) })}</span></div>
      <div class="kpi ${overdue.length ? "warn" : ""}"><b>${euros(total(overdue, "total") - total(overdue, "cobrado"))}</b><span>${t("billing.list.overdueTotal", { count: formatNumber(overdue.length) })}</span></div>`;
}
function rowHtml(row) {
  const note = row.rectifica ? `<span class="sm">${t("billing.list.rectifies", { number: escapeHtml(row.rectifica) })}</span>` : row.rectificada_por ? `<span class="sm">${t("billing.list.rectifiedBy", { number: escapeHtml(row.rectificada_por) })}</span>` : "";
  return `<button class="dr" data-fac="${row.id}">
        <span><b>${escapeHtml(row.numero)}</b>${note}</span>
        <span>${formatShortDate(row.fecha)}</span><span class="corta">${escapeHtml(orFallback(row.cliente, "—"))}</span><span class="sm">${escapeHtml(orFallback(row.nif, "—"))}</span>
        <span class="num">${euros(row.base)}</span><span class="num">${euros(row.cuota_iva)}</span><span class="num"><b>${euros(row.total)}</b></span>
        <span class="${row.estado_cobro === PAYMENT.overdue ? "cad-pasada" : ""}">${row.vencimiento ? formatShortDate(row.vencimiento) : "—"}</span>
        <span>${paymentPill(row.estado_cobro)}</span></button>`;
}
function tableHtml(rows) {
  if (!rows.length) return `<div class="vacio">${t("billing.list.none")}</div>`;
  const head = [["", "number"], ["", "date"], ["", "client"], ["", "nif"], ["num", "base"], ["num", "vatShort"], ["num", "total"], ["", "due"], ["", "payment"]];
  return `<div class="dgrid-wrap"><div class="dgrid facts">
      <div class="dh">${head.map(([kind, key]) => `<span${kind ? ` class="${kind}"` : ""}>${t(`billing.list.${key}`)}</span>`).join("")}</div>
      ${rows.map(rowHtml).join("")}</div></div>`;
}
function pageRows(rows) {
  const size = accountListLegacy.pageSize();
  billingLegacy.setPage(Math.min(billingLegacy.page(), Math.max(0, Math.ceil(rows.length / size) - 1)));
  const start = billingLegacy.page() * size;
  return rows.slice(start, start + size);
}
async function paintRows() {
  billingLegacy.showLoading(document.getElementById("flista"), t("billing.list.loading"));
  const range = opportunitiesLegacy.periodOf(document.getElementById("fper"));
  const { data, error } = await legacyDb().rpc("facturas_lista", {
    p_desde: range.desde,
    p_hasta: range.hasta,
    q: emptyToNull(field("fq")?.value.trim()),
    p_cobro: emptyToNull(field("fcob")?.value)
  });
  const list = document.getElementById("flista"), totals = document.getElementById("ftot");
  if (!list) return;
  if (error) {
    list.innerHTML = `<div class="vacio">${escapeHtml(errorMessage(error))}</div>`;
    return;
  }
  const rows = data ?? [];
  if (totals) totals.innerHTML = totalsHtml(rows);
  list.innerHTML = tableHtml(pageRows(rows));
  list.querySelectorAll("[data-fac]").forEach((button) => {
    button.onclick = () => {
      billingLegacy.openInvoice(button.dataset.fac ?? "");
    };
  });
  list.insertAdjacentHTML("beforeend", '<div id="fpag"></div>');
  accountListLegacy.paginate({
    element: document.getElementById("fpag"),
    total: rows.length,
    page: billingLegacy.page(),
    onPage: (page) => {
      billingLegacy.setPage(page);
      void paintRows();
    },
    onSize: () => {
      billingLegacy.setPage(0);
      void paintRows();
    }
  });
}
var restart = () => {
  billingLegacy.setPage(0);
  void paintRows();
};
var searchTimer;
function paintInvoices() {
  const body = document.getElementById("fcuerpo");
  if (!body) return;
  body.innerHTML = shellHtml();
  opportunitiesLegacy.mountPeriod(document.getElementById("fper"), { id: "facturas", valor: "mes", alCambiar: () => {
    void paintRows();
  } });
  const search = field("fq"), payment = field("fcob");
  if (search) search.oninput = () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(restart, SEARCH_WAIT_MS);
  };
  if (payment) payment.onchange = restart;
  void paintRows();
}
function refreshInvoices() {
  if (currentScreen() === "facturacion" && billingLegacy.section() === "facturas" && document.getElementById("flista")) paintInvoices();
}

// delcos-shared:src/app/services/dates.ts
var shared8 = globalThis["__delcosModules"]["services/dates"];
var pick8 = (name) => shared8[name];
var todayIso = /* @__PURE__ */ pick8("todayIso");

// src/app/screens/billing/series.ts
var TYPES = [
  ["ordinaria", "billing.series.ordinary", "billing.series.ordinary"],
  ["rectificativa", "billing.series.rectifying", "billing.series.rectifying"],
  ["simplificada", "billing.series.simplified", "billing.series.simplifiedTickets"]
];
var FALLBACK_YEAR = 2026;
var YEAR_DIGITS = 100;
var typeName = (type) => t(TYPES.find(([key]) => key === type)?.[1] ?? "billing.series.simplified");
var input = (id) => document.getElementById(id);
var valueOf = (id) => input(id)?.value ?? "";
function rowHtml2(series) {
  const notes = `${series.por_defecto ? t("billing.series.byDefault") : ""}${series.activa ? "" : t("billing.series.inactive")}`;
  return `<button class="dr" data-ser="${series.id ?? ""}"><span><b>${escapeHtml(series.codigo)}</b><span class="sm">${escapeHtml(series.nombre)}${notes}</span></span>
        <span>${escapeHtml(typeName(series.tipo))}</span><span class="mono">${escapeHtml(series.formato)}</span>
        <span><b>${escapeHtml(series.proximo ?? "")}</b></span><span>${escapeHtml(orFallback(series.ultima, "—"))}</span><span class="num">${formatNumber(series.emitidas)}</span><span>${t(series.reinicio_anual ? "billing.series.yes" : "billing.series.no")}</span></button>`;
}
function listHtml(list, admin) {
  const head = [["", "series"], ["", "type"], ["", "format"], ["", "next"], ["", "last"], ["num", "issued"], ["", "yearlyReset"]];
  return `<div class="panel">
    <div class="cuenta">${t("billing.series.intro")}
      ${admin ? `<button class="btn sec" id="sernueva" style="margin-left:8px">${t("billing.series.add")}</button>` : ""}</div>
    <div class="dgrid-wrap"><div class="dgrid sers">
      <div class="dh">${head.map(([kind, key]) => `<span${kind ? ` class="${kind}"` : ""}>${t(`billing.series.${key}`)}</span>`).join("")}</div>
      ${list.map(rowHtml2).join("")}
    </div></div>
    <p class="sm" style="padding:10px 16px">${t("billing.series.formatHelp")}</p></div>`;
}
async function paintSeries() {
  billingLegacy.showLoading(document.getElementById("fcuerpo"), t("billing.series.loading"));
  const { data } = await callRpc("series_lista", {});
  const body = document.getElementById("fcuerpo");
  if (!body) return;
  const list = data ?? [], admin = cardSectionsLegacy.can("administrar");
  body.innerHTML = listHtml(list, admin);
  body.querySelectorAll("[data-ser]").forEach((button) => {
    button.onclick = () => {
      editSeries(list.find((series) => series.id === button.dataset.ser) ?? null);
    };
  });
  const add = document.getElementById("sernueva");
  if (add) add.onclick = () => {
    editSeries(null);
  };
}
function editorHtml(series, admin) {
  const locked = admin ? "" : "disabled", fixed = series.id ? "disabled" : locked;
  const types = TYPES.map(([key, , label]) => `<option value="${key}" ${series.tipo === key ? "selected" : ""}>${t(label)}</option>`).join("");
  const check = (id, on2, label) => `<label class="opt" style="margin-top:${id === "ser" ? 10 : 8}px"><input type="checkbox" id="${id}" ${on2 ? "checked" : ""} ${locked}> ${t(label)}</label>`;
  return `
    <div class="fh"><div><h2>${series.id ? t("billing.series.titleOf", { code: escapeHtml(series.codigo) }) : t("billing.series.newTitle")}</h2><div class="sm">${t("billing.series.nextNumber")}<b id="serprev"></b></div></div>
      <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>
    <div class="g2"><div><label for="sec">${t("billing.series.code")}</label><input id="sec" value="${escapeHtml(series.codigo)}" ${fixed} placeholder="${t("billing.series.codePlaceholder")}"></div>
      <div><label for="sen">${t("billing.series.name")}</label><input id="sen" value="${escapeHtml(series.nombre)}" ${locked}></div></div>
    <div class="g2"><div><label for="set">${t("billing.series.type")}</label><select id="set" ${fixed}>${types}</select></div>
      <div><label for="sef">${t("billing.series.format")}</label><input id="sef" value="${escapeHtml(series.formato)}" ${locked}></div></div>
    <div class="g2"><div><label for="ses">${t("billing.series.nextField")}</label><input id="ses" type="number" min="1" value="${series.siguiente}" ${locked}></div>
      <div><label for="sea">${t("billing.series.year")}</label><input id="sea" type="number" value="${series.anio}" ${locked}></div></div>
    ${check("ser", series.reinicio_anual, "billing.series.restartYearly")}
    ${check("sed", series.por_defecto, "billing.series.defaultForType")}
    ${series.id ? check("seac", series.activa !== false, "billing.series.active") : ""}
    <div class="acts u-end"><button class="btn sec" data-cerrar>${t("common.close")}</button>${admin ? `<button class="btn" id="seok">${t("common.save")}</button>` : ""}</div>`;
}
function preview() {
  const code = valueOf("sec").trim().toUpperCase() || "X", year = Number(valueOf("sea")) || FALLBACK_YEAR, next = Number(valueOf("ses")) || 1;
  const text = valueOf("sef").replace("{S}", code).replace("{AAAA}", String(year)).replace("{AA}", String(year % YEAR_DIGITS).padStart(2, "0")).replace(/\{(N+)\}/, (...[, digits]) => String(next).padStart(digits?.length ?? 0, "0"));
  const place = document.getElementById("serprev");
  if (place) place.textContent = text;
}
async function save(series) {
  const checked = (id) => Boolean(input(id)?.checked), active = input("seac");
  const { data: result, error } = await legacyDb().rpc("guardar_serie", { p: {
    id: series.id ?? null,
    codigo: valueOf("sec").trim(),
    nombre: valueOf("sen").trim(),
    tipo: valueOf("set"),
    formato: valueOf("sef").trim(),
    siguiente: Number(valueOf("ses")),
    anio: Number(valueOf("sea")),
    reinicio_anual: checked("ser"),
    por_defecto: checked("sed"),
    ...active ? { activa: active.checked } : {}
  } });
  if (error || result?.ok === false) {
    notices.toast(result?.error === "numero_usado" ? t("billing.series.numberUsed", { last: result.ultimo ?? "" }) : t("billing.series.couldNotSave"), true);
    return;
  }
  document.getElementById("dlg")?.close();
  notices.toast(t("billing.series.saved"));
  void paintSeries();
}
function editSeries(existing) {
  const admin = cardSectionsLegacy.can("administrar");
  const series = existing ?? { codigo: "", nombre: "", tipo: "ordinaria", formato: "{S}{AA}{NNNN}", siguiente: 1, anio: Number(todayIso().slice(0, 4)), reinicio_anual: true };
  const body = document.getElementById("dbody"), box = document.getElementById("dlg");
  if (!body || !box) return;
  body.innerHTML = editorHtml(series, admin);
  box.showModal();
  for (const id of ["sec", "sef", "ses", "sea"]) {
    const field2 = input(id);
    if (field2) field2.oninput = preview;
  }
  preview();
  const ok = document.getElementById("seok");
  if (ok) ok.onclick = () => {
    void save(series);
  };
}

// src/app/screens/billing/verifactu.ts
var DEFAULTS = { activo: false, modalidad: "verifactu", entorno: "pruebas" };
var MODES = [
  ["verifactu", "billing.verifactu.modeVerifactu", "billing.verifactu.modeVerifactuText"],
  ["no_verifactu", "billing.verifactu.modeOther", "billing.verifactu.modeOtherText"]
];
function heroHtml(settings) {
  const pill = settings.activo ? `<span class="pill p-est">${t("billing.verifactu.on")}</span>` : `<span class="pill p-per">${t("billing.verifactu.off")}</span>`;
  return `<div class="vfhero ${settings.activo ? "on" : ""}">
      <div class="vfico">🛡️</div>
      <div><h2>VeriFactu ${pill}</h2>
        <p>${t("billing.verifactu.intro")}</p></div></div>`;
}
function stepsHtml(settings, chain) {
  const intact = !chain.rotas;
  const chainText = intact ? t("billing.verifactu.chainOk") : t("billing.verifactu.chainBroken", { from: escapeHtml(chain.primera_rota ?? "") });
  return `<div class="vfpasos">
      <div class="vfpaso hecho"><span>✓</span><b>${t("billing.verifactu.step1")}</b><em>${t("billing.verifactu.step1Text")}</em></div>
      <div class="vfpaso hecho"><span>✓</span><b>${t("billing.verifactu.step2")}</b><em>${t("billing.verifactu.step2Text", { count: formatNumber(chain.facturas ?? 0), chain: chainText })}</em></div>
      <div class="vfpaso ${settings.activo ? "hecho" : ""}"><span>${settings.activo ? "✓" : "3"}</span><b>${t("billing.verifactu.step3")}</b><em>${t(settings.activo ? "billing.verifactu.step3On" : "billing.verifactu.step3Off")}</em></div>
      <div class="vfpaso pend"><span>🔒</span><b>${t("billing.verifactu.step4")}</b><em>${t("billing.verifactu.step4Text")}</em></div>
    </div>`;
}
function whatHtml(last) {
  const lastText = last ? t("billing.verifactu.lastEvent", { type: escapeHtml(last.tipo), date: new Date(last.fecha).toLocaleDateString("es-ES") }) : "";
  return `<div class="card vfcard"><h3>${t("billing.verifactu.whatTitle")}</h3><ul class="manlist">
        <li><span>🔢</span><span>${t("billing.verifactu.what1")}</span></li>
        <li><span>🔗</span><span>${t("billing.verifactu.what2")}</span></li>
        <li><span>🧾</span><span>${t("billing.verifactu.what3")}</span></li>
        <li><span>📋</span><span>${t("billing.verifactu.what4", { last: lastText })}</span></li></ul></div>`;
}
function settingsHtml(settings) {
  const modes = MODES.map(([key, name, text]) => `<label class="vfmodo"><input type="radio" name="vfm" value="${key}" ${settings.modalidad === key ? "checked" : ""}><b>${t(name)}</b><span>${t(text)}</span></label>`).join("");
  return `<div class="card vfcard"><h3>${t("billing.verifactu.settings")}</h3>
        <label class="vfswitch"><input type="checkbox" id="vfa" ${settings.activo ? "checked" : ""}><span class="sw"></span>
          <span><b>${t("billing.verifactu.activate")}</b><br><span class="sm">${t("billing.verifactu.activateHint")}</span></span></label>
        <label>${t("billing.verifactu.mode")}</label>
        <div class="vfmodos">
          ${modes}</div>
        <label for="vfe">${t("billing.verifactu.environment")}</label><select id="vfe"><option value="pruebas" ${settings.entorno === "pruebas" ? "selected" : ""}>${t("billing.verifactu.testing")}</option><option value="produccion" ${settings.entorno === "produccion" ? "selected" : ""}>${t("billing.verifactu.production")}</option></select>
        <div class="acts u-end"><button class="btn" id="vfok">${t("common.save")}</button></div></div>`;
}
async function save2(current) {
  const next = {
    activo: Boolean(document.getElementById("vfa")?.checked),
    modalidad: document.querySelector("[name=vfm]:checked")?.value ?? DEFAULTS.modalidad,
    entorno: document.getElementById("vfe")?.value ?? DEFAULTS.entorno
  };
  if (next.activo !== current.activo) {
    const on2 = next.activo;
    const sure = await notices.confirm(
      t(on2 ? "billing.verifactu.activateText" : "billing.verifactu.deactivateText"),
      { titulo: t(on2 ? "billing.verifactu.activateTitle" : "billing.verifactu.deactivateTitle"), ok: t(on2 ? "billing.verifactu.activateOk" : "billing.verifactu.deactivateOk") }
    );
    if (!sure) return;
  }
  const { error } = await legacyDb().rpc("guardar_ajuste", { p_clave: "verifactu", p_valor: next });
  if (error) {
    notices.toast(t("billing.verifactu.couldNotSave"), true);
    return;
  }
  billingLegacy.setSetting("verifactu", next);
  notices.toast(t("billing.verifactu.saved"));
  void paintVerifactu();
}
async function paintVerifactu() {
  await billingLegacy.loadSettings();
  const settings = { ...DEFAULTS, ...billingLegacy.setting("verifactu") };
  const [{ data: chain }, { data: events }] = await Promise.all([callRpc("verificar_cadena", {}), callRpc("eventos_facturacion_lista", { lim: 1 })]);
  const body = document.getElementById("fcuerpo");
  if (!body) return;
  body.innerHTML = `
    ${heroHtml(settings)}
    ${stepsHtml(settings, chain ?? {})}
    <div class="vfgrid">
      ${whatHtml((events ?? [])[0])}
      ${settingsHtml(settings)}
    </div>`;
  const ok = document.getElementById("vfok");
  if (ok) ok.onclick = () => {
    void save2(settings);
  };
}

// delcos-shared:src/app/core/organisation.ts
var shared9 = globalThis["__delcosModules"]["core/organisation"];
var pick9 = (name) => shared9[name];
var usesVerifactu = /* @__PURE__ */ pick9("usesVerifactu");

// src/app/screens/billing/page.ts
var SECTIONS = [
  ["facturas", "billing.page.invoices", false],
  ["series", "billing.page.series", false],
  ["empresa", "billing.page.company", true],
  ["verifactu", "billing.page.verifactu", true],
  ["registro", "billing.page.log", true]
];
var PAINT = {
  facturas: paintInvoices,
  series: () => {
    void paintSeries();
  },
  empresa: () => {
    billingLegacy.paintCompany();
  },
  verifactu: () => {
    void paintVerifactu();
  },
  registro: () => {
    billingLegacy.paintLog();
  }
};
function readOnlyHtml() {
  if (!billingLegacy.readOnly()) return "";
  return `<div id="facconsulta" class="banda-info">${t("billing.page.readOnly", { plan: escapeHtml(billingLegacy.planName()) })}</div>`;
}
function loadBilling() {
  const screen = document.getElementById("v-facturacion");
  if (!screen) return Promise.resolve();
  const admin = cardSectionsLegacy.can("administrar"), sections = SECTIONS.filter(([key, , adminOnly]) => (admin || !adminOnly) && (key !== "verifactu" || usesVerifactu()));
  if (!sections.some(([key]) => key === billingLegacy.section())) billingLegacy.setSection("facturas");
  const current = billingLegacy.section();
  screen.innerHTML = `
    <div class="saludo"><div><h1>${t("billing.page.title")}</h1><div class="fecha">${t("billing.page.subtitle")}</div></div>
      <div class="acts u-m-0"></div></div>
    <div class="subnav">${sections.map(([key, label]) => `<button data-fsec="${key}" aria-pressed="${String(current === key)}">${t(label)}</button>`).join("")}</div>${readOnlyHtml()}
    <div id="fcuerpo"></div>`;
  screen.querySelectorAll("[data-fsec]").forEach((button) => {
    button.onclick = () => {
      billingLegacy.setSection(button.dataset.fsec ?? "facturas");
      billingLegacy.reload();
    };
  });
  PAINT[current]?.();
  requestAnimationFrame(() => {
    if (currentScreen() === "facturacion") billingLegacy.paintTabs();
  });
  return Promise.resolve();
}

// src/app/screens/billing/payment.ts
var value = (id) => document.getElementById(id)?.value ?? "";
function formHtml(invoice, pending) {
  const methods = billingLegacy.paymentMethods().map((item) => `<option ${item.valor === invoice.forma_pago ? "selected" : ""}>${escapeHtml(item.valor)}</option>`).join("");
  return `
    <div class="fh"><div><h2>${t("billing.payment.title", { number: escapeHtml(invoice.numero) })}</h2><div class="sm">${t("billing.payment.pending", { amount: euros(pending) })}</div></div>
      <button class="x" data-cerrar2 aria-label="${t("common.close")}">✕</button></div>
    <div class="g2"><div><label for="cbi">${t("billing.payment.amount")}</label><input id="cbi" type="number" step="0.01" value="${pending}"></div>
      <div><label for="cbf">${t("billing.payment.date")}</label><input id="cbf" type="date" value="${todayIso()}"></div></div>
    <div class="g2"><div><label for="cbp">${t("billing.payment.method")}</label><select id="cbp">${methods}</select></div>
      <div><label for="cbn">${t("billing.payment.note")}</label><input id="cbn" placeholder="${t("billing.payment.optional")}"></div></div>
    <div class="acts u-end"><button class="btn sec" data-cerrar2>${t("common.cancel")}</button><button class="btn" id="cbok">${t("billing.payment.register")}</button></div>`;
}
async function save3(invoice, box) {
  const amount = Number(value("cbi"));
  if (!amount) {
    notices.toast(t("billing.payment.writeAmount"), true);
    return;
  }
  const { data: result, error } = await legacyDb().rpc("registrar_cobro", {
    p_factura: invoice.id,
    p_importe: amount,
    p_fecha: value("cbf"),
    p_forma: value("cbp"),
    p_nota: value("cbn").trim() || null
  });
  if (error || result?.ok === false) {
    notices.toast(t("billing.payment.couldNotRegister"), true);
    return;
  }
  box.close();
  notices.toast(t("billing.payment.registered"));
  billingLegacy.openInvoice(invoice.id);
  refreshInvoices();
}
function registerPayment(invoice, pending) {
  const body = document.getElementById("dlg2body"), box = document.getElementById("dlg2");
  if (!body || !box) return;
  body.innerHTML = formHtml(invoice, pending);
  box.showModal();
  const ok = document.getElementById("cbok");
  if (ok) ok.onclick = () => {
    void save3(invoice, box);
  };
}

// src/app/screens/billing/rectify.ts
var failure = (error, result) => orFallback(errorMessage(error), result?.error ?? "");
var partial = (body) => body.querySelector("[name=rft]:checked")?.value === "parcial";
function formHtml2(invoice) {
  const lines = invoice.lineas.map((line, index) => `<div class="g2" style="align-items:center"><div>${escapeHtml(line.descripcion)} <span class="sm">${t("billing.rectify.units", { units: formatNumber(line.unidades) })}</span></div>
      <div><input type="number" min="0" max="${line.unidades}" data-rfi="${index}" value="0" aria-label="${t("billing.rectify.unitsLabel")}"></div></div>`).join("");
  return `
    <div class="fh"><div><h2>${t("billing.rectify.title", { number: escapeHtml(invoice.numero) })}</h2><div class="sm">${t("billing.rectify.subtitle")}</div></div>
      <button class="x" data-cerrar2 aria-label="${t("common.close")}">✕</button></div>
    <label for="rfm">${t("billing.rectify.reason")}</label><input id="rfm" placeholder="${t("billing.rectify.reasonPlaceholder")}">
    <label>${t("billing.rectify.what")}</label>
    <div class="opciones" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr)"><label class="opt"><input type="radio" name="rft" value="total" checked> ${t("billing.rectify.whole")}</label>
      <label class="opt"><input type="radio" name="rft" value="parcial"> ${t("billing.rectify.someUnits")}</label></div>
    <div id="rflin" class="hide">${lines}</div>
    ${invoice.pedido_id ? `<label class="opt u-mt-10"><input type="checkbox" id="rfan"> ${t("billing.rectify.cancelOrder")}</label>` : ""}
    <div class="acts u-end"><button class="btn sec" data-cerrar2>${t("common.cancel")}</button><button class="btn dang" id="rfok">${t("billing.rectify.issue")}</button></div>`;
}
var reasonOf = () => document.getElementById("rfm")?.value.trim() ?? "";
function chosenLines(body) {
  return [...body.querySelectorAll("[data-rfi]")].map((input2) => ({ indice: Number(input2.dataset.rfi), unidades: Number(input2.value) || 0 })).filter((line) => line.unidades > 0);
}
async function issue(invoice, body, button) {
  const reason = reasonOf();
  if (!reason) {
    notices.toast(t("billing.rectify.writeReason"), true);
    return;
  }
  const lines = partial(body) ? chosenLines(body) : null;
  if (lines?.length === 0) {
    notices.toast(t("billing.rectify.writeUnits"), true);
    return;
  }
  button.disabled = true;
  const { data: result, error } = await legacyDb().rpc("rectificar_factura", { p_factura: invoice.id, p_motivo: reason, p_lineas: lines });
  if (error || !result || result.ok === false) {
    button.disabled = false;
    notices.toast(t("billing.rectify.failed", { error: failure(error, result) }), true);
    return;
  }
  await afterIssue(invoice, result, reason);
}
async function afterIssue(invoice, result, reason) {
  const number = result.numero ?? "";
  if (document.getElementById("rfan")?.checked) await legacyDb().rpc("anular_pedido", { p_id: invoice.pedido_id, p_motivo: t("billing.rectify.cancelReason", { number, reason }) });
  document.getElementById("dlg2")?.close();
  notices.toast(t("billing.rectify.issued", { number }));
  billingLegacy.openInvoice(result.id ?? "");
  refreshInvoices();
}
function rectifyInvoice(invoice) {
  const body = document.getElementById("dlg2body"), box = document.getElementById("dlg2");
  if (!body || !box) return;
  body.innerHTML = formHtml2(invoice);
  box.showModal();
  body.querySelectorAll("[name=rft]").forEach((radio) => {
    radio.onchange = () => {
      const some = partial(body), cancel = document.getElementById("rfan");
      document.getElementById("rflin")?.classList.toggle("hide", !some);
      if (cancel) {
        cancel.disabled = some;
        if (some) cancel.checked = false;
      }
    };
  });
  const ok = document.getElementById("rfok");
  if (ok) ok.onclick = () => {
    void issue(invoice, body, ok);
  };
}

// src/app/screens/billing/sheet.ts
var FINGERPRINT_SHOWN = 32;
function paymentState(invoice) {
  if (invoice.total === 0 || Math.abs(invoice.cobrado) >= Math.abs(invoice.total)) return PAYMENT.paid;
  return invoice.vencimiento && invoice.vencimiento < todayIso() ? PAYMENT.overdue : PAYMENT.pending;
}
var address = (party, withProvince) => escapeHtml([party.direccion, party.cp, party.municipio, withProvince ? party.provincia : null].filter(Boolean).join(", "));
function headerHtml(invoice) {
  const when = `${formatLongDate(invoice.fecha)}${invoice.vencimiento ? t("billing.sheet.dueOn", { date: formatShortDate(invoice.vencimiento) }) : ""}${invoice.forma_pago ? ` · ${escapeHtml(invoice.forma_pago)}` : ""}`;
  return `<div class="fh"><div><h2>${t(invoice.rectifica_id ? "billing.sheet.rectifying" : "billing.sheet.invoice")} ${escapeHtml(invoice.numero)} ${paymentPill(paymentState(invoice))}</h2>
      <div class="sm">${when}</div></div>
      <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>`;
}
function noticesHtml(detail, invoice) {
  const original = detail.rectifica ? `<div class="avisoh"><span>${t("billing.sheet.rectifiesNotice", { number: escapeHtml(detail.rectifica.numero), reason: escapeHtml(invoice.motivo_rectificacion ?? "") })}</span><button class="btn sec" data-vfac="${detail.rectifica.id}">${t("billing.sheet.seeOriginal")}</button></div>` : "";
  const later = detail.rectificativas ?? [];
  const list = later.map((item) => `<b>${escapeHtml(item.numero)}</b> (${euros(item.total)} · ${escapeHtml(item.motivo ?? "")})`).join(", ");
  return original + (later.length ? `<div class="avisoh"><span>${t("billing.sheet.rectifiedBy", { list })}</span></div>` : "");
}
function partiesHtml(invoice) {
  const client = invoice.cliente, issuer = invoice.emisor;
  return `<div class="g2">
      <div class="blk"><h3>${t("billing.sheet.client")}</h3><b>${escapeHtml(client.nombre ?? "")}</b><div class="sm">${escapeHtml(orFallback(client.nif, t("billing.sheet.noNif")))}</div>
        <div class="sm">${address(client, true)}</div></div>
      <div class="blk"><h3>${t("billing.sheet.issuer")}</h3><b>${escapeHtml(issuer.razon_social ?? "")}</b><div class="sm">${escapeHtml(issuer.nif ?? "")}</div>
        <div class="sm">${address(issuer, false)}</div></div></div>`;
}
function linesHtml(invoice) {
  const head = [["", "concept"], ["num", "units"], ["num", "price"], ["num", "discount"], ["num", "vat"], ["num", "base"]];
  const lines = invoice.lineas.map((line) => `<div class="dr u-cursor-default"><span>${escapeHtml(line.descripcion)}</span><span class="num">${formatNumber(line.unidades)}</span>
        <span class="num">${euros(line.precio)}</span><span class="num">${line.descuento ? `${formatNumber(line.descuento)}%` : "—"}</span><span class="num">${formatNumber(line.iva)}%</span><span class="num"><b>${euros(line.base)}</b></span></div>`).join("");
  const breakdown = invoice.desglose_iva.map((item) => `<div><span>${t("billing.sheet.baseAt", { rate: formatNumber(item.iva) })}</span><b>${euros(item.base)}</b></div><div><span>${t("billing.sheet.vatAt", { rate: formatNumber(item.iva) })}</span><b>${euros(item.cuota)}</b></div>`).join("");
  return `<div class="dgrid-wrap"><div class="dgrid flin">
      <div class="dh">${head.map(([kind, key]) => `<span${kind ? ` class="${kind}"` : ""}>${t(`billing.sheet.${key}`)}</span>`).join("")}</div>
      ${lines}</div></div>
    <div class="totbox">${breakdown}
      <div class="tot"><span>${t("billing.sheet.total")}</span><b>${euros(invoice.total)}</b></div></div>`;
}
function paymentsHtml(payments, pending) {
  const admin = cardSectionsLegacy.can("administrar");
  const rows = payments.map((item) => `<div class="sm" style="display:flex;justify-content:space-between;gap:8px;padding:4px 0">
        <span>${formatShortDate(item.fecha)} · ${escapeHtml(item.forma_pago ?? "")}${item.nota ? ` · ${escapeHtml(item.nota)}` : ""}</span><b>${euros(item.importe)}</b>
        ${admin ? `<button class="kcfg" data-bcob="${item.id}">${t("billing.sheet.removePayment")}</button>` : ""}</div>`).join("");
  return `<div class="blk"><h3>${t("billing.sheet.payments")}</h3>
      ${rows || `<div class="sm">${t("billing.sheet.noPayments")}</div>`}
      ${pending ? `<div class="sm u-mt-4">${t("billing.sheet.pendingAmount", { amount: euros(pending) })}</div>` : ""}</div>`;
}
function recordHtml(invoice) {
  if (!invoice.huella) return "";
  return `<div class="blk"><h3>${t("billing.sheet.record")}</h3><div class="sm mono">${t("billing.sheet.fingerprint", { value: escapeHtml(invoice.huella.slice(0, FINGERPRINT_SHOWN)) })}</div>
      <div class="sm">${t("billing.sheet.verifactuState", { state: escapeHtml(orFallback(invoice.verifactu?.estado, t("billing.sheet.notApplicable"))) })}</div></div>`;
}
function actionsHtml(invoice, pending) {
  const can = billingLegacy.canInvoice();
  return `<div class="acts u-end u-wrap">
      <button class="btn sec" data-cerrar>${t("common.close")}</button>
      ${invoice.pedido_id ? `<button class="btn sec" id="fvped">${t("billing.sheet.seeOrder")}</button>` : ""}
      ${can && !invoice.rectifica_id ? `<button class="btn sec dang" id="fvrect">${t("billing.sheet.rectify")}</button>` : ""}
      ${can && pending ? `<button class="btn sec" id="fvcob">${t("billing.sheet.registerPayment")}</button>` : ""}
      <button class="btn sec" id="fvpdf">${t("billing.sheet.see")}</button><button class="btn sec" id="fvdl">${t("billing.sheet.download")}</button>${can ? `<button class="btn" id="fvmail">${t("billing.sheet.email")}</button>` : ""}</div>`;
}
var on = (id, action) => {
  const button = document.getElementById(id);
  if (button) button.onclick = action;
};
function bind(body, detail, invoice, pending) {
  const rectifies = detail.rectifica?.numero;
  body.querySelectorAll("[data-vfac]").forEach((button) => {
    button.onclick = () => {
      billingLegacy.openInvoice(button.dataset.vfac ?? "");
    };
  });
  body.querySelectorAll("[data-bcob]").forEach((button) => {
    button.onclick = async () => {
      if (!await notices.confirm(t("billing.sheet.removePaymentText"), { titulo: t("billing.sheet.removePaymentTitle"), ok: t("billing.sheet.removePayment"), peligro: true })) return;
      await legacyDb().rpc("borrar_cobro", { p_id: button.dataset.bcob });
      billingLegacy.openInvoice(invoice.id);
      refreshInvoices();
    };
  });
  on("fvped", () => {
    appLegacy.openOrder(invoice.pedido_id ?? "");
  });
  on("fvcob", () => {
    registerPayment(invoice, pending);
  });
  on("fvrect", () => {
    rectifyInvoice(invoice);
  });
  on("fvdl", () => {
    billingLegacy.downloadPdf(invoice, rectifies);
  });
  on("fvmail", () => {
    billingLegacy.sendByEmail(invoice, rectifies);
  });
  on("fvpdf", () => {
    void billingLegacy.invoicePdf(invoice, rectifies).then((pdf) => {
      window.open(pdf.output("bloburl"), "_blank");
    });
  });
}
async function paint(id) {
  const { data: detail } = await callRpc("factura_detalle", { p_id: id });
  const invoice = detail?.factura;
  if (!detail || !invoice) {
    notices.toast(t("billing.sheet.couldNotOpen"), true);
    return;
  }
  const body = document.getElementById("dbody"), box = document.getElementById("dlg");
  if (!body || !box) return;
  const pending = Number((invoice.total - invoice.cobrado).toFixed(2));
  body.innerHTML = `
    ${headerHtml(invoice)}
    ${noticesHtml(detail, invoice)}
    ${partiesHtml(invoice)}
    ${linesHtml(invoice)}
    ${paymentsHtml(detail.cobros ?? [], pending)}
    ${recordHtml(invoice)}
    ${actionsHtml(invoice, pending)}`;
  if (!box.open) box.showModal();
  bind(body, detail, invoice, pending);
}
function showInvoice(id) {
  return billingLegacy.withLoading(() => paint(id));
}
export {
  editSeries,
  loadBilling,
  paintInvoices,
  paintSeries,
  paintVerifactu,
  refreshInvoices,
  showInvoice
};
