// delcos-shared:src/app/i18n/index.ts
var shared = globalThis["__delcosModules"]["i18n/index"];
var pick = (name) => shared[name];
var registerMessages = /* @__PURE__ */ pick("registerMessages");
var t = /* @__PURE__ */ pick("t");

// src/app/i18n/es/chunks/events/events.ts
var events = {
  list: {
    couldNotLoad: "No se han podido cargar los eventos.",
    newEvent: "+ Nuevo evento",
    upcoming: "Próximos",
    past: "Pasados",
    noUpcoming: "No hay eventos próximos.",
    noPast: "Todavía no hay eventos pasados.",
    online: "En línea",
    noPlace: "Sin lugar",
    oneAttendee: "1 asistente",
    attendees: "{count} asistentes"
  },
  editor: {
    editTitle: "Editar evento",
    newTitle: "Nuevo evento",
    subtitle: "Taller, curso, congreso, webinar…",
    title: "Título",
    titlePlaceholder: "p. ej. Taller de manejo del dolor articular",
    type: "Tipo",
    date: "Fecha",
    time: "Hora",
    place: "Lugar",
    placePlaceholder: "Hotel, centro, sede…",
    online: "En línea",
    note: "Nota",
    delete: "Borrar",
    cancel: "Cancelar",
    save: "Guardar",
    create: "Crear evento",
    writeTitle: "Escribe el título",
    chooseDate: "Elige la fecha",
    couldNotSave: "No se ha podido guardar: {error}",
    saved: "Evento guardado",
    created: "Evento creado",
    deleteText: "El evento desaparece con su lista de asistentes y lo apuntado a cada uno.",
    deleteTitle: "¿Borrar el evento?",
    couldNotDelete: "No se ha podido borrar",
    deleted: "Evento borrado"
  },
  sheet: {
    notFound: "No se ha encontrado el evento",
    attendees: "Asistentes · {count}",
    add: "+ Añadir",
    state: "Estado",
    remove: "Quitar",
    noAttendees: "Todavía no hay asistentes: añade los invitados.",
    total: "Gastos de este evento",
    note: "Las inscripciones y gastos de cada asistente (inscripción, viaje y alojamiento, comidas y honorarios) salen en el informe anual de gastos. Las comidas no deberían pasar de {max} € por persona.",
    edit: "Editar evento",
    done: "Hecho",
    alreadyIn: "{name} ya está en este evento",
    couldNotAdd: "No se ha podido añadir: {error}",
    added: "{name} añadido",
    couldNotSave: "No se ha podido guardar",
    mealOver: "La comida pasa de {max} € por persona: revisa que cumpla el código de buenas prácticas",
    removeText: "{name} deja de estar en este evento, con lo apuntado.",
    removeTitle: "¿Quitar de la lista?",
    couldNotRemove: "No se ha podido quitar"
  },
  report: {
    year: "Año",
    download: "Descargar (CSV)",
    note: "Los gastos de eventos de cada {professional} durante el año, por concepto (las asistencias marcadas «No asistió» no cuentan). Es la base del informe anual de gastos de los códigos de Farmaindustria y Fenin: revísalo con vuestro responsable de cumplimiento antes de publicarlo.",
    events: "Eventos",
    total: "Total",
    code: "Código",
    empty: "En {year} no hay gastos de eventos apuntados.",
    fileName: "informe de gastos-{year}.csv"
  }
};

// src/app/i18n/es/chunks/events/index.ts
var texts = { events };

// src/app/screens/events/texts.ts
registerMessages(texts);

// delcos-shared:src/app/legacy/bridge.ts
var shared2 = globalThis["__delcosModules"]["legacy/bridge"];
var pick2 = (name) => shared2[name];
var cardSectionsLegacy = /* @__PURE__ */ pick2("cardSectionsLegacy");
var currentScreen = /* @__PURE__ */ pick2("currentScreen");
var editorLegacy = /* @__PURE__ */ pick2("editorLegacy");
var eventsLegacy = /* @__PURE__ */ pick2("eventsLegacy");
var legacyDb = /* @__PURE__ */ pick2("legacyDb");
var notices = /* @__PURE__ */ pick2("notices");
var relatedLegacy = /* @__PURE__ */ pick2("relatedLegacy");
var salesTeam = /* @__PURE__ */ pick2("salesTeam");
var term = /* @__PURE__ */ pick2("term");

// delcos-shared:src/app/services/dates.ts
var shared3 = globalThis["__delcosModules"]["services/dates"];
var pick3 = (name) => shared3[name];
var todayIso = /* @__PURE__ */ pick3("todayIso");

// delcos-shared:src/app/services/format.ts
var shared4 = globalThis["__delcosModules"]["services/format"];
var pick4 = (name) => shared4[name];
var escapeHtml = /* @__PURE__ */ pick4("escapeHtml");
var formatCurrency = /* @__PURE__ */ pick4("formatCurrency");

// delcos-shared:src/app/screens/events/model.ts
var shared5 = globalThis["__delcosModules"]["screens/events/model"];
var pick5 = (name) => shared5[name];
var ATTENDANCE_STATES = /* @__PURE__ */ pick5("ATTENDANCE_STATES");
var CONCEPTS = /* @__PURE__ */ pick5("CONCEPTS");
var EVENT_TYPES = /* @__PURE__ */ pick5("EVENT_TYPES");
var MEAL_MAX = /* @__PURE__ */ pick5("MEAL_MAX");
var attendeeTotal = /* @__PURE__ */ pick5("attendeeTotal");
var conceptLabel = /* @__PURE__ */ pick5("conceptLabel");

// src/app/screens/events/editor.ts
var value = (id) => document.getElementById(id)?.value ?? "";
function editorHtml(event, existing) {
  const canDelete = existing && (existing.creado_por === salesTeam.currentUserId() || cardSectionsLegacy.can("administrar"));
  return `<div class="fh"><div><h2>${t(existing ? "events.editor.editTitle" : "events.editor.newTitle")}</h2><div class="sm">${t("events.editor.subtitle")}</div></div>
      <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>
    <label for="evt">${t("events.editor.title")}</label><input id="evt" value="${escapeHtml(event.titulo ?? "")}" placeholder="${t("events.editor.titlePlaceholder")}">
    <div class="g2"><div><label for="evtipo">${t("events.editor.type")}</label><select id="evtipo">${EVENT_TYPES.map((type) => `<option ${type === event.tipo ? "selected" : ""}>${type}</option>`).join("")}</select></div>
      <div><label for="evf">${t("events.editor.date")}</label><input id="evf" type="date" value="${escapeHtml(event.fecha ?? "")}"></div></div>
    <div class="g2"><div><label for="evh">${t("events.editor.time")}</label><input id="evh" type="time" value="${escapeHtml(event.hora ? String(event.hora).slice(0, 5) : "")}"></div>
      <div><label for="evl">${t("events.editor.place")}</label><input id="evl" value="${escapeHtml(event.lugar ?? "")}" placeholder="${t("events.editor.placePlaceholder")}"></div></div>
    <label class="opt"><input type="checkbox" id="evon" ${event.en_linea ? "checked" : ""}> ${t("events.editor.online")}</label>
    <label for="evn">${t("events.editor.note")}</label><textarea id="evn" rows="3">${escapeHtml(event.nota ?? "")}</textarea>
    <div class="acts u-end">${canDelete ? `<button type="button" class="btn sec peligro" id="evborrar">${t("events.editor.delete")}</button>` : ""}
      <button type="button" class="btn sec" data-cerrar>${t("events.editor.cancel")}</button><button type="button" class="btn" id="evok">${t(existing ? "events.editor.save" : "events.editor.create")}</button></div>`;
}
var repaintListIfShown = () => {
  if (currentScreen() === "eventos") eventsLegacy.repaintList();
};
function formRow(title) {
  return {
    titulo: title,
    tipo: value("evtipo"),
    fecha: value("evf"),
    hora: value("evh") || null,
    lugar: value("evl").trim() || null,
    en_linea: Boolean(document.getElementById("evon")?.checked),
    nota: value("evn").trim() || null
  };
}
async function save(existing, button) {
  const title = value("evt").trim();
  if (!title) {
    notices.toast(t("events.editor.writeTitle"), true);
    return;
  }
  if (!value("evf")) {
    notices.toast(t("events.editor.chooseDate"), true);
    return;
  }
  const row = formRow(title);
  button.disabled = true;
  const table = legacyDb().from("eventos");
  const result = existing ? await table.update(row).eq("id", existing.id).select("id").single() : await table.insert(row).select("id").single();
  button.disabled = false;
  if (result.error || !result.data) {
    notices.toast(t("events.editor.couldNotSave", { error: result.error?.message ?? "" }), true);
    return;
  }
  notices.toast(t(existing ? "events.editor.saved" : "events.editor.created"));
  relatedLegacy.openEvent(result.data.id);
  repaintListIfShown();
}
async function remove(existing) {
  if (!await notices.confirm(t("events.editor.deleteText"), { titulo: t("events.editor.deleteTitle"), ok: t("events.editor.delete"), peligro: true })) return;
  const { error } = await legacyDb().from("eventos").delete().eq("id", existing.id);
  if (error) {
    notices.toast(t("events.editor.couldNotDelete"), true);
    return;
  }
  document.getElementById("dlg")?.close();
  notices.toast(t("events.editor.deleted"));
  repaintListIfShown();
}
function editEvent(existing) {
  const body = document.getElementById("dbody"), box = document.getElementById("dlg");
  if (!body || !box) return;
  body.innerHTML = editorHtml(existing ?? { fecha: todayIso(), tipo: "Taller", en_linea: false }, existing);
  if (!box.open) box.showModal();
  const ok = document.getElementById("evok");
  if (ok) ok.onclick = () => {
    void save(existing, ok);
  };
  const erase = document.getElementById("evborrar");
  if (erase && existing) erase.onclick = () => {
    void remove(existing);
  };
}

// delcos-shared:src/app/services/date-format.ts
var shared6 = globalThis["__delcosModules"]["services/date-format"];
var pick6 = (name) => shared6[name];
var formatLongDate = /* @__PURE__ */ pick6("formatLongDate");

// delcos-shared:src/app/services/values.ts
var shared7 = globalThis["__delcosModules"]["services/values"];
var pick7 = (name) => shared7[name];
var orFallback = /* @__PURE__ */ pick7("orFallback");
var range = /* @__PURE__ */ pick7("range");
var sum = /* @__PURE__ */ pick7("sum");

// src/app/screens/events/list.ts
var SHOWN_PAST = 50;
var LIMIT = 200;
function eventSummary(event) {
  return `${escapeHtml(formatLongDate(event.fecha))}${event.hora ? ` · ${escapeHtml(String(event.hora).slice(0, 5))}` : ""}${event.tipo ? ` · ${escapeHtml(event.tipo)}` : ""} · ${event.en_linea ? t("events.list.online") : escapeHtml(orFallback(event.lugar, t("events.list.noPlace")))}`;
}
function eventRow(event) {
  const attendees = event.eventos_asistentes ?? [], total = sum(attendees.map(attendeeTotal));
  const count = attendees.length === 1 ? t("events.list.oneAttendee") : t("events.list.attendees", { count: attendees.length });
  return `<button type="button" class="item evrow" data-ev="${event.id}"><span class="tx"><b>${escapeHtml(event.titulo)}</b>
      <span class="sm">${eventSummary(event)} · ${count}</span></span>
      ${total ? `<span class="evtot">${formatCurrency(total)}</span>` : ""}</button>`;
}
var section = (title, rows, empty) => `<section class="card evbloque"><h2>${title}</h2>${rows.length ? `<div class="lista">${rows.map(eventRow).join("")}</div>` : `<div class="vacio vlinea">${empty}</div>`}</section>`;
async function paintEvents() {
  if (!document.getElementById("cfgcuerpo")) return;
  const { data, error } = await legacyDb().from("eventos").select("id,titulo,tipo,fecha,hora,lugar,en_linea,creado_por,eventos_asistentes(id,estado,inscripcion,viaje,comida,honorarios)").order("fecha", { ascending: false }).limit(LIMIT);
  const box = document.getElementById("cfgcuerpo");
  if (!box || currentScreen() !== "eventos") return;
  if (error) {
    box.innerHTML = `<div class="vacio">${t("events.list.couldNotLoad")}</div>`;
    return;
  }
  const today = todayIso(), list = data ?? [];
  const upcoming = list.filter((event) => event.fecha >= today).reverse(), past = list.filter((event) => event.fecha < today);
  box.innerHTML = `<div class="evpag"><div class="evcab"><button type="button" class="btn" id="evnuevo">${t("events.list.newEvent")}</button></div>
    ${section(t("events.list.upcoming"), upcoming, t("events.list.noUpcoming"))}
    ${section(t("events.list.past"), past.slice(0, SHOWN_PAST), t("events.list.noPast"))}</div>`;
  const add = document.getElementById("evnuevo");
  if (add) add.onclick = () => {
    editEvent(null);
  };
  box.querySelectorAll("[data-ev]").forEach((button) => {
    button.onclick = () => {
      relatedLegacy.openEvent(button.dataset.ev ?? "");
    };
  });
}

// src/app/screens/events/report.ts
var YEARS_SHOWN = 4;
var BOM = String.fromCharCode(65279);
var amount = (row, key) => Number(row[key]) || 0;
function tableHtml(rows) {
  const total = (key) => formatCurrency(sum(rows.map((row) => amount(row, key))));
  return `<div class="dgrid-wrap"><table class="trtabla"><thead><tr><th>${term("medico", { capital: "C" })}</th><th>${t("events.report.events")}</th>${CONCEPTS.map((concept) => `<th>${conceptLabel(concept)}</th>`).join("")}<th>${t("events.report.total")}</th></tr></thead>
      <tbody>${rows.map((row) => `<tr><td><b>${escapeHtml(row.nombre)}</b>${row.especialidad ? `<span class="sm"> · ${escapeHtml(row.especialidad)}</span>` : ""}</td><td>${row.eventos}</td>${CONCEPTS.map((concept) => `<td>${formatCurrency(amount(row, concept))}</td>`).join("")}<td><b>${formatCurrency(amount(row, "total"))}</b></td></tr>`).join("")}</tbody>
      <tfoot><tr><td>${t("events.report.total")}</td><td></td>${CONCEPTS.map((concept) => `<td>${total(concept)}</td>`).join("")}<td><b>${total("total")}</b></td></tr></tfoot></table></div>`;
}
function download(rows, year) {
  const quote = (value2) => `"${String(value2 ?? "").replace(/"/g, '""')}"`, decimal = (value2) => String(Number(value2) || 0).replace(".", ",");
  const header = [term("medico", { capital: "C" }), t("events.report.code"), term("especialidad", { capital: "C" }), t("events.report.events"), ...CONCEPTS.map(conceptLabel), t("events.report.total")].map(quote).join(";");
  const lines = rows.map((row) => [quote(row.nombre), quote(row.codigo), quote(row.especialidad), row.eventos, ...CONCEPTS.map((concept) => decimal(row[concept])), decimal(row.total)].join(";"));
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([BOM + [header, ...lines].join("\r\n")], { type: "text/csv;charset=utf-8" }));
  link.download = t("events.report.fileName", { year });
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    URL.revokeObjectURL(link.href);
    link.remove();
  }, 1e3);
}
async function paintExpenseReport(year) {
  if (!document.getElementById("cfgcuerpo")) return;
  const current = Number(todayIso().slice(0, 4)), shown = year ?? current - 1;
  const { data } = await legacyDb().rpc("transparencia_anual", { p_anio: shown });
  const box = document.getElementById("cfgcuerpo");
  if (!box || currentScreen() !== "eventos") return;
  const rows = data?.filas ?? [];
  box.innerHTML = `<div class="evpag"><div class="evcab"><label for="trano">${t("events.report.year")}</label><select id="trano">${range(YEARS_SHOWN).map((back) => current - back).map((option) => `<option ${option === shown ? "selected" : ""}>${option}</option>`).join("")}</select>
      ${rows.length ? `<button type="button" class="btn sec" id="trcsv">${t("events.report.download")}</button>` : ""}</div>
    <p class="sm">${t("events.report.note", { professional: term("medico") })}</p>
    ${rows.length ? tableHtml(rows) : `<div class="vacio vlinea">${t("events.report.empty", { year: shown })}</div>`}</div>`;
  const select = box.querySelector("#trano");
  if (select) select.onchange = () => {
    void paintExpenseReport(Number(select.value));
  };
  const csv = box.querySelector("#trcsv");
  if (csv) csv.onclick = () => {
    download(rows, shown);
  };
}

// delcos-shared:src/app/services/money.ts
var shared8 = globalThis["__delcosModules"]["services/money"];
var pick8 = (name) => shared8[name];
var round2 = /* @__PURE__ */ pick8("round2");

// src/app/screens/events/sheet.ts
var reopen = (id) => {
  relatedLegacy.openEvent(id);
};
function attendeeHtml(attendee) {
  const costs = CONCEPTS.map((concept) => {
    const amount2 = Number(attendee[concept]) || 0;
    return `<label class="${concept === "comida" && amount2 > MEAL_MAX ? "evaviso" : ""}"><span>${conceptLabel(concept)}</span><input type="number" min="0" step="0.01" data-asimp="${concept}" value="${amount2 || ""}" placeholder="0"></label>`;
  }).join("");
  return `<div class="evasf" data-as="${attendee.id}">
        <div class="evasn"><b>${escapeHtml(attendee.cuentas?.nombre ?? "")}</b><span class="sm">${escapeHtml(attendee.cuentas?.especialidad ?? "")}</span></div>
        <select data-asest aria-label="${t("events.sheet.state")}">${ATTENDANCE_STATES.map((state) => `<option ${state === attendee.estado ? "selected" : ""}>${state}</option>`).join("")}</select>
        <button type="button" class="x" data-asq aria-label="${t("events.sheet.remove")}">✕</button>
        <div class="evimp">${costs}</div></div>`;
}
function sheetHtml(event, attendees, canEdit) {
  return `<div class="fh"><div><h2>${escapeHtml(event.titulo)}</h2><div class="sm">${eventSummary(event)}</div></div>
      <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>
    ${event.nota ? `<p class="sm">${escapeHtml(event.nota)}</p>` : ""}
    <div class="evascab"><h3>${t("events.sheet.attendees", { count: attendees.length })}</h3><button type="button" class="btn sec" id="evanadir">${t("events.sheet.add")}</button></div>
    <div id="evsel"></div>
    <div class="evas" id="evas">${attendees.length ? attendees.map(attendeeHtml).join("") : `<div class="vacio vlinea">${t("events.sheet.noAttendees")}</div>`}</div>
    <div class="evpie"><span>${t("events.sheet.total")}</span><b id="evtotal">${formatCurrency(sum(attendees.map(attendeeTotal)))}</b></div>
    <p class="sm">${t("events.sheet.note", { max: MEAL_MAX })}</p>
    <div class="acts u-end">${canEdit ? `<button type="button" class="btn sec" id="eveditar">${t("events.sheet.edit")}</button>` : ""}<button type="button" class="btn" data-cerrar>${t("events.sheet.done")}</button></div>`;
}
function startAdding(id) {
  const add = document.getElementById("evanadir");
  if (add) add.disabled = true;
  editorLegacy.pickAccount(document.getElementById("evsel"), null, async (account) => {
    const { error } = await legacyDb().from("eventos_asistentes").insert({ evento_id: id, cuenta_id: account.id });
    const message = error?.message ?? "";
    if (error) notices.toast(/duplicate|unique/i.test(message) ? t("events.sheet.alreadyIn", { name: account.nombre ?? "" }) : t("events.sheet.couldNotAdd", { error: message }), true);
    else notices.toast(t("events.sheet.added", { name: account.nombre ?? "" }));
    reopen(id);
  });
  document.getElementById("evsel")?.querySelector("input")?.focus();
}
async function saveCost(attendee, input, attendees) {
  const concept = input.dataset.asimp, amount2 = Math.max(0, round2(input.value));
  const { error } = await legacyDb().from("eventos_asistentes").update({ [concept]: amount2 }).eq("id", attendee.id);
  if (error) {
    notices.toast(t("events.sheet.couldNotSave"), true);
    input.value = String(Number(attendee[concept]) || "");
    return;
  }
  attendee[concept] = amount2;
  const total = document.getElementById("evtotal");
  if (total) total.textContent = formatCurrency(sum(attendees.map(attendeeTotal)));
  const overMeal = concept === "comida" && amount2 > MEAL_MAX;
  input.closest("label")?.classList.toggle("evaviso", overMeal);
  if (overMeal) notices.toast(t("events.sheet.mealOver", { max: MEAL_MAX }), true);
}
function bindAttendee(row, attendee, attendees, id) {
  const state = row.querySelector("[data-asest]");
  if (state) state.onchange = async () => {
    const { error } = await legacyDb().from("eventos_asistentes").update({ estado: state.value }).eq("id", attendee.id);
    if (error) {
      notices.toast(t("events.sheet.couldNotSave"), true);
      state.value = attendee.estado;
      return;
    }
    attendee.estado = state.value;
  };
  row.querySelectorAll("[data-asimp]").forEach((input) => {
    input.onchange = () => {
      void saveCost(attendee, input, attendees);
    };
  });
  const remove2 = row.querySelector("[data-asq]");
  if (remove2) remove2.onclick = async () => {
    if (!await notices.confirm(t("events.sheet.removeText", { name: attendee.cuentas?.nombre ?? "" }), { titulo: t("events.sheet.removeTitle"), ok: t("events.sheet.remove"), peligro: true })) return;
    const { error } = await legacyDb().from("eventos_asistentes").delete().eq("id", attendee.id);
    if (error) {
      notices.toast(t("events.sheet.couldNotRemove"), true);
      return;
    }
    reopen(id);
  };
}
async function showEvent(id) {
  const db = legacyDb();
  const [{ data: event }, { data: attendeeRows }] = await Promise.all([
    db.from("eventos").select("*").eq("id", id).maybeSingle(),
    db.from("eventos_asistentes").select("id,cuenta_id,estado,inscripcion,viaje,comida,honorarios,cuentas(nombre,especialidad)").eq("evento_id", id).order("creado_en")
  ]);
  if (!event) {
    notices.toast(t("events.sheet.notFound"), true);
    return;
  }
  const body = document.getElementById("dbody"), box = document.getElementById("dlg");
  if (!body || !box) return;
  const attendees = attendeeRows ?? [], canEdit = event.creado_por === salesTeam.currentUserId() || cardSectionsLegacy.can("administrar");
  body.innerHTML = sheetHtml(event, attendees, canEdit);
  if (!box.open) box.showModal();
  const edit = document.getElementById("eveditar");
  if (edit) edit.onclick = () => {
    editEvent(event);
  };
  const add = document.getElementById("evanadir");
  if (add) add.onclick = () => {
    startAdding(id);
  };
  document.querySelectorAll("#evas [data-as]").forEach((row) => {
    const attendee = attendees.find((item) => item.id === row.dataset.as);
    if (attendee) bindAttendee(row, attendee, attendees, id);
  });
}
export {
  editEvent,
  paintEvents,
  paintExpenseReport,
  showEvent
};
