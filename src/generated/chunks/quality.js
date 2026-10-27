// delcos-shared:src/app/legacy/bridge.ts
var shared = globalThis["__delcosModules"]["legacy/bridge"];
var pick = (name) => shared[name];
var accountListLegacy = /* @__PURE__ */ pick("accountListLegacy");
var agendaActions = /* @__PURE__ */ pick("agendaActions");
var callRpc = /* @__PURE__ */ pick("callRpc");
var cardSectionsLegacy = /* @__PURE__ */ pick("cardSectionsLegacy");
var goTo = /* @__PURE__ */ pick("goTo");
var icon = /* @__PURE__ */ pick("icon");
var legacyDb = /* @__PURE__ */ pick("legacyDb");
var notices = /* @__PURE__ */ pick("notices");
var permissions = /* @__PURE__ */ pick("permissions");
var qualityLegacy = /* @__PURE__ */ pick("qualityLegacy");
var term = /* @__PURE__ */ pick("term");

// delcos-shared:src/app/i18n/index.ts
var shared2 = globalThis["__delcosModules"]["i18n/index"];
var pick2 = (name) => shared2[name];
var t = /* @__PURE__ */ pick2("t");

// delcos-shared:src/app/services/format.ts
var shared3 = globalThis["__delcosModules"]["services/format"];
var pick3 = (name) => shared3[name];
var escapeHtml = /* @__PURE__ */ pick3("escapeHtml");
var formatNumber = /* @__PURE__ */ pick3("formatNumber");

// delcos-shared:src/app/services/values.ts
var shared4 = globalThis["__delcosModules"]["services/values"];
var pick4 = (name) => shared4[name];
var orFallback = /* @__PURE__ */ pick4("orFallback");

// delcos-shared:src/app/core/organisation.ts
var shared5 = globalThis["__delcosModules"]["core/organisation"];
var pick5 = (name) => shared5[name];
var addressQuery = /* @__PURE__ */ pick5("addressQuery");

// src/app/screens/quality/data-quality.ts
var percentOf = (done, total) => total ? Math.round(done / total * 100) : 0;
var words = () => ({
  professional: term("medico"),
  professionals: term("medico", { number: "p" }),
  Professionals: term("medico", { number: "p", capital: "C" }),
  speciality: term("especialidad"),
  anyPlace: term("consulta", { article: "ningun" }),
  ofVisit: term("visita", { article: "del" })
});
function indicator(count, title, help) {
  return `<div class="kpi ${count ? "warn" : "ok"}"><button class="ai" data-ayuda-txt="${escapeHtml(help)}" data-ayuda-tit="${escapeHtml(title)}" aria-label="${t("quality.summary.whatIs")}">i</button><b>${formatNumber(count)}</b><span>${escapeHtml(title)}</span></div>`;
}
var INDICATORS = [
  ["sin_ubicacion", "quality.summary.noLocation", "quality.summary.noLocationHelp"],
  ["sin_horario", "quality.summary.noTimetable", "quality.summary.noTimetableHelp"],
  ["sin_especialidad", "quality.summary.noSpeciality", "quality.summary.noSpecialityHelp"],
  ["sin_contacto", "quality.summary.noContact", "quality.summary.noContactHelp"],
  ["sin_provincia", "quality.summary.noProvince", "quality.summary.noProvinceHelp"],
  ["sin_comercial", "quality.summary.noSalesperson", "quality.summary.noSalespersonHelp"],
  ["duplicados", "quality.summary.duplicates", "quality.summary.duplicatesHelp"]
];
function summaryHtml(quality) {
  const percent = percentOf(quality.completas, quality.total);
  return `<div class="card" id="calidad" style="padding-bottom:6px">
    <div class="manh" style="padding:14px 16px 0"><h2 class="u-p-0">${t("quality.summary.complete", { percent })}</h2><span class="sm">${t("quality.summary.completeOf", { ...words(), done: formatNumber(quality.completas), total: formatNumber(quality.total) })}</span></div>
    <div class="barra" style="margin:8px 16px 10px"><i style="width:${percent}%"></i></div>
    <div class="kpis" style="padding:0 16px 10px">
      ${INDICATORS.map(([key, title, help]) => indicator(quality[key], t(title, words()), t(help, words()))).join("")}
    </div>
    <p class="sm" style="padding:0 16px 10px">${t("quality.summary.completeHint", words())}</p></div>`;
}
async function paintSummary() {
  const { data: quality } = await callRpc("calidad_datos", {});
  if (!quality || document.getElementById("calidad")) return;
  document.querySelector("#v-seguimiento .saludo")?.insertAdjacentHTML("afterend", summaryHtml(quality));
}
function placeRow(place) {
  const address = [place.centro_nombre, place.direccion, [place.cp, place.municipio].filter(Boolean).join(" ")].filter(Boolean).join(" · ");
  const distance = place.km !== null && place.km !== void 0 ? t("quality.addresses.farFrom", { km: formatNumber(place.km), municipality: escapeHtml(orFallback(place.municipio, "")) }) : t("quality.addresses.outOfSpain");
  return `<div class="item cdir u-cursor-default" data-cdir="${place.id}">
      <span class="tx"><b>${escapeHtml(place.nombre)}</b>
        <span class="sm">${escapeHtml(address || t("quality.addresses.noAddress"))}</span>
        <span class="sm cdirkm">${distance}</span></span>
      <span class="acts u-m-0">
        <button type="button" class="btn sec" data-cdirf="${place.cuenta_id}">${t("quality.addresses.card")}</button>
        ${place.direccion || place.municipio ? `<button type="button" class="btn" data-cdirg="${place.id}">${t("quality.addresses.relocate")}</button>` : ""}</span></div>`;
}
var addressesHtml = (places) => `<div class="card" id="caldirs">
    <div class="fh"><div><h2>${t("quality.addresses.title", { count: formatNumber(places.length) })}</h2>
      <div class="sm">${t("quality.addresses.hint", { thesePlaces: term("consulta", { number: "p", article: "este" }) })}</div></div></div>
    <div class="lista">${places.map(placeRow).join("")}</div></div>`;
function removeRow(box, id) {
  box.querySelector(`[data-cdir="${id}"]`)?.remove();
  const title = box.querySelector("h2"), left = box.querySelectorAll(".cdir").length;
  if (!left) box.remove();
  else if (title) title.textContent = t("quality.addresses.title", { count: formatNumber(left) });
}
async function relocate(box, place, button) {
  const text = button.textContent;
  button.disabled = true;
  button.textContent = t("quality.addresses.searching");
  const query = addressQuery([place.direccion, place.cp, place.municipio, place.provincia]);
  const found = await qualityLegacy.geocode(query, { direccion: place.direccion, municipio: place.municipio, cp: place.cp });
  button.disabled = false;
  button.textContent = text;
  if (!found) {
    notices.toast(t("quality.addresses.notFound"), true);
    return;
  }
  if (found.fuera) {
    notices.toast(t("quality.addresses.elsewhere", { place: found.fuera, municipality: orFallback(place.municipio, "") }), true);
    return;
  }
  const { error } = await legacyDb().from("ubicaciones").update({ lat: Number(found.lat), lon: Number(found.lon) }).eq("id", place.id);
  if (error) {
    notices.toast(t("quality.addresses.couldNotSave", { error: error.message ?? "" }), true);
    return;
  }
  notices.toast(t("quality.addresses.placed", { name: place.nombre, municipality: orFallback(place.municipio, "") }));
  removeRow(box, place.id);
}
async function paintDoubtfulAddresses() {
  if (!document.getElementById("calidad") || document.getElementById("caldirs")) return;
  const { data, error } = await legacyDb().rpc("ubicaciones_dudosas", {});
  const card = document.getElementById("calidad");
  if (error || !card || document.getElementById("caldirs")) return;
  const places = data ?? [];
  if (!places.length) return;
  card.insertAdjacentHTML("afterend", addressesHtml(places));
  const box = document.getElementById("caldirs");
  if (!box) return;
  box.querySelectorAll("[data-cdirf]").forEach((button) => {
    button.onclick = () => {
      agendaActions.openAccount(button.dataset.cdirf ?? "");
    };
  });
  box.querySelectorAll("[data-cdirg]").forEach((button) => {
    button.onclick = () => {
      const place = places.find((item) => item.id === button.dataset.cdirg);
      if (place) void relocate(box, place, button);
    };
  });
}

// delcos-shared:src/app/services/date-format.ts
var shared6 = globalThis["__delcosModules"]["services/date-format"];
var pick6 = (name) => shared6[name];
var formatShortDate = /* @__PURE__ */ pick6("formatShortDate");

// delcos-shared:src/app/services/dates.ts
var shared7 = globalThis["__delcosModules"]["services/dates"];
var pick7 = (name) => shared7[name];
var addDays = /* @__PURE__ */ pick7("addDays");
var todayIso = /* @__PURE__ */ pick7("todayIso");

// delcos-shared:src/app/screens/home/index.ts
var shared8 = globalThis["__delcosModules"]["screens/home/index"];
var pick8 = (name) => shared8[name];
var load = /* @__PURE__ */ pick8("load");

// src/app/screens/quality/follow-up.ts
var POSTPONE_DAYS = 7;
var followUpState = { estado: "", prov: "", muni: "", modo: "todos", pagina: 0 };
var filterParams = () => ({
  f_estado: followUpState.estado || null,
  f_provincia: followUpState.prov || null,
  f_municipio: followUpState.muni || null,
  f_modo: followUpState.modo
});
var loadingHtml = (text) => `<div class="cargador"><span class="spin"></span><span class="sm">${escapeHtml(text)}</span></div>`;
function nameHtml(row) {
  const urgent = row.urgente ? `<span class="pill p-urg">${t("quality.followUp.urgent")}</span> ` : "";
  const reporting = row.sin_reporting ? `<span class="pill p-sr" title="${t("quality.followUp.noReportingHelp", { visit: term("visita") })}">${t("quality.followUp.noReporting")}</span> ` : "";
  return `<span class="nm">${urgent}${reporting}${escapeHtml(row.nombre)}</span>`;
}
function nextActionHtml(row) {
  if (!row.proxima_fecha) return "";
  return `<b style="color:${row.proxima_fecha < todayIso() ? "var(--warn)" : "var(--navy)"}">${formatShortDate(row.proxima_fecha)}</b><br>${escapeHtml(orFallback(row.proxima_accion, ""))}
           <br><span class="acts" style="margin:4px 0 0"><button class="btn sec chico" data-acc="hecha|${row.id}">${t("quality.followUp.done")}</button>
           <button class="btn sec chico" data-acc="aplazar|${row.id}">${t("quality.followUp.postpone")}</button></span>`;
}
function rowHtml(row) {
  const last = row.ultima_visita ? t("quality.followUp.last", { date: formatShortDate(row.ultima_visita), result: escapeHtml(orFallback(row.ultimo_resultado, "")) }) : t("quality.followUp.notVisited");
  return `
    <button class="fila" data-id="${row.id}">
      <span>${nameHtml(row)}
        <span class="sm">${escapeHtml(orFallback(row.especialidad, ""))} · ${escapeHtml(orFallback(row.centro_nombre, ""))} ${escapeHtml(orFallback(row.municipio, ""))}</span></span>
      <span class="c2"><span class="sm">${last}</span>
        <span class="sm">${row.n_visitas} ${term("visita", { number: "p" })}${row.muestras ? t("quality.followUp.samples", { count: row.muestras }) : ""}</span></span>
      <span class="c3"><span class="sm">${nextActionHtml(row)}</span></span>
      <span class="pill p-est">${escapeHtml(row.estado_comercial)}</span>
    </button>`;
}
async function resolveAction(action) {
  const [mode = "", accountId = ""] = action.split("|");
  let date = null;
  if (mode === "aplazar") {
    date = await notices.askDate(t("quality.followUp.postponeQuestion"), addDays(todayIso(), POSTPONE_DAYS), { titulo: t("quality.followUp.postponeTitle"), ok: t("quality.followUp.postpone") });
    if (!date) return;
  }
  const { data: result } = await legacyDb().rpc("resolver_accion", { p_medico: accountId, p_modo: mode, p_fecha: date });
  if (result?.ok === false) {
    notices.toast(t("quality.followUp.couldNot"), true);
    return;
  }
  notices.toast(t(mode === "hecha" ? "quality.followUp.markedDone" : "quality.followUp.postponed"));
  void paintFollowUp(true);
  void load();
}
function bind(list) {
  list.onclick = (event) => {
    const target = event.target, action = target.closest("[data-acc]");
    if (action) {
      event.stopPropagation();
      void resolveAction(action.dataset.acc ?? "");
      return;
    }
    const row = target.closest("[data-id]");
    if (row) agendaActions.openAccount(row.dataset.id ?? "");
  };
}
function paintRows(list, rows) {
  if (!rows.length) {
    list.innerHTML = `<div class="vacio">${t("quality.followUp.nothing")}</div>`;
    return;
  }
  list.innerHTML = "";
  list.insertAdjacentHTML("beforeend", rows.map(rowHtml).join(""));
}
async function paintFollowUp(restart) {
  const list = document.getElementById("slista"), count = document.getElementById("scuenta");
  if (!list || !count) return;
  if (restart) followUpState.pagina = 0;
  list.innerHTML = loadingHtml(t("quality.page.loadingFollowUp"));
  count.textContent = t("quality.followUp.searching");
  const size = accountListLegacy.pageSize();
  const { data, error } = await legacyDb().rpc("seguimiento_lista", { ...filterParams(), lim: size, desplaz: followUpState.pagina * size });
  if (error || !data) {
    count.textContent = t("quality.followUp.couldNotLoad", { error: error?.message ?? "" });
    return;
  }
  count.innerHTML = `<b>${formatNumber(data.total)}</b> ${term("medico", { number: "p" })}`;
  paintRows(list, data.filas ?? []);
  accountListLegacy.paginate({
    element: document.getElementById("spag"),
    total: data.total,
    page: followUpState.pagina,
    onPage: (page) => {
      followUpState.pagina = page;
      void paintFollowUp(false);
      list.scrollIntoView({ block: "start", behavior: "smooth" });
    },
    onSize: () => {
      void paintFollowUp(true);
    }
  });
  bind(list);
}

// delcos-shared:src/app/core/navigation/current.ts
var shared9 = globalThis["__delcosModules"]["core/navigation/current"];
var pick9 = (name) => shared9[name];
var markCurrent = /* @__PURE__ */ pick9("markCurrent");

// src/app/screens/quality/page.ts
var MODES = [["todos", "quality.page.showAll"], ["visitados", "quality.page.showVisited"], ["sin_visitar", "quality.page.showNotVisited"], ["con_accion", "quality.page.showWithAction"], ["atrasados", "quality.page.showLate"]];
var canSeeDuplicates = () => cardSectionsLegacy.can("administrar") || permissions.canReviewDuplicates();
function headerHtml() {
  const duplicates = canSeeDuplicates() ? `<button class="btn sec" id="caldup">${icon("copy")} ${t("quality.page.duplicates")}</button>` : "";
  return `<button class="cfgvolver visible" id="calvolver" type="button">‹ ${escapeHtml(accountListLegacy.contactsLabel())}</button>
    <div class="saludo"><div><h1>${t("quality.page.title")}</h1><div class="fecha">${t("quality.page.subtitle", { professional: term("medico") })}</div></div>
      <div class="acts u-m-0">${duplicates}</div></div>`;
}
function pageHtml() {
  const modes = MODES.map(([value, key]) => `<option value="${value}">${t(key)}</option>`).join("");
  return `${headerHtml()}
    <div class="kpis" id="segkpis"><div class="skel"></div></div>
    <div class="panel">
      <div class="filtros">
        <div><label for="sest">${t("quality.page.commercialState")}</label><select id="sest"></select></div>
        <div><label for="sprov">${t("quality.page.province")}</label><select id="sprov"></select></div>
        <div><label for="smuni">${t("quality.page.municipality")}</label><select id="smuni"></select></div>
        <div><label for="smodo">${t("quality.page.show")}</label><select id="smodo">${modes}</select></div>
      </div>
      <div class="cuenta" id="scuenta">${t("quality.page.loading")}</div>
      <div id="slista"><div class="cargador"><span class="spin"></span><span class="sm">${t("quality.page.loadingFollowUp")}</span></div></div>
      <div id="spag"></div>
    </div>`;
}
var selectValue = (id) => document.getElementById(id)?.value ?? "";
function fillFilters(options) {
  const fill = (id, list, all) => {
    const select = document.getElementById(id);
    if (select) select.innerHTML = `<option value="">${all}</option>${(list ?? []).map((option) => `<option>${escapeHtml(option.v)}</option>`).join("")}`;
  };
  fill("sest", options?.estados, t("quality.page.allStates"));
  fill("sprov", options?.provincias, t("quality.page.allProvinces"));
  fill("smuni", options?.municipios, t("quality.page.allMunicipalities"));
  for (const id of ["sest", "sprov", "smuni", "smodo"]) {
    const select = document.getElementById(id);
    if (select) select.onchange = () => {
      Object.assign(followUpState, { estado: selectValue("sest"), prov: selectValue("sprov"), muni: selectValue("smuni"), modo: selectValue("smodo"), pagina: 0 });
      void paintFollowUp(true);
    };
  }
}
var percentText = (part, total) => `${total ? Math.round(part / total * 100) : 0}%`;
function paintIndicators(summary) {
  const box = document.getElementById("segkpis");
  if (!summary || !box) return;
  const funnel = (summary.embudo ?? []).map((step) => `<div class="kpi"><b>${formatNumber(step.n)}</b><span>${escapeHtml(step.estado)}</span></div>`).join("");
  box.innerHTML = `${funnel}<div class="kpi ok"><b>${formatNumber(summary.visitados)}</b><span>${term("medico", { number: "p", adjective: "visitado" })}</span></div>
       <div class="kpi"><b>${formatNumber(summary.visitas_total)}</b><span>${term("visita", { number: "p", adjective: "registrado" })}</span></div>
       <div class="kpi"><b>${formatNumber(summary.muestras_total)}</b><span>${t("quality.page.samplesGiven")}</span></div>
       <div class="kpi"><b>${percentText(summary.con_direccion, summary.total)}</b><span>${t("quality.page.withAddress")}</span></div>
       <div class="kpi"><b>${percentText(summary.con_dias, summary.total)}</b><span>${t("quality.page.withDays")}</span></div>`;
}
function bindHeader() {
  const back = document.getElementById("calvolver");
  if (back) back.onclick = () => {
    goTo("directorio");
  };
  const duplicates = document.getElementById("caldup");
  if (duplicates) duplicates.onclick = () => {
    goTo("duplicados");
  };
  document.querySelectorAll("nav.main [data-t]").forEach((button) => {
    markCurrent(button, button.dataset.t === "directorio");
  });
  qualityLegacy.setExport((format) => {
    qualityLegacy.download([], "Exportacion_seguimiento", format);
  });
}
async function loadQuality() {
  const view = document.getElementById("v-seguimiento");
  if (!view) return;
  Object.assign(followUpState, { estado: "", prov: "", muni: "", modo: "todos", pagina: 0 });
  view.innerHTML = pageHtml();
  bindHeader();
  const { data: options } = await legacyDb().rpc("opciones_filtros", {});
  fillFilters(options);
  const { data: summary } = await legacyDb().rpc("resumen_seguimiento");
  paintIndicators(summary);
  void paintFollowUp(true);
  await paintSummary();
  try {
    await paintDoubtfulAddresses();
  } catch {
  }
}
export {
  loadQuality
};
