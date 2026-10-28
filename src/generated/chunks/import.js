// delcos-shared:src/app/i18n/index.ts
var shared = globalThis["__delcosModules"]["i18n/index"];
var pick = (name) => shared[name];
var registerMessages = /* @__PURE__ */ pick("registerMessages");
var t = /* @__PURE__ */ pick("t");

// src/app/i18n/es/chunks/import/importing.ts
var importing = {
  steps: {
    what: "Qué importar",
    file: "Archivo",
    columns: "Columnas",
    review: "Revisión"
  },
  start: {
    title: "¿Qué quieres importar?",
    text: "Carga un Excel o un CSV. La plataforma reconocerá sus columnas y te propondrá con qué campo se corresponde cada una. Las columnas que no tengamos se pueden guardar como campos personalizados."
  },
  file: {
    title: "Archivo de {name}",
    text: "Excel (.xlsx, .xls) o CSV. La primera fila con títulos se detecta sola, aunque el archivo tenga filas de encabezado antes.",
    salesText: " En ventas, cada fila es una línea de producto: las filas con el mismo número forman un pedido. Los productos deben existir ya (impórtalos antes).",
    drop: "Arrastra aquí el archivo o pulsa para elegirlo",
    maxRows: "Hasta 20.000 filas",
    back: "‹ Volver",
    reading: "Leyendo {name}…",
    sheets: "El archivo tiene varias hojas: ¿cuál importamos?",
    next: "Continuar",
    unreadable: "No se ha podido leer el archivo. ¿Es un Excel o un CSV?",
    noRows: "El archivo no tiene filas con datos",
    tooMany: "El archivo tiene más de 20.000 filas: divídelo en varios",
    column: "Columna {index}"
  },
  columns: {
    title: "Columnas de «{name}»",
    summary: "{rows} filas · {columns} columnas. ",
    remembered: "<b>Se ha aplicado la correspondencia que usaste la última vez con un archivo con estas columnas.</b>",
    proposed: "Te proponemos el campo de cada columna: revísalo.",
    customHint: " Las columnas sin equivalente se proponen como <b>campo personalizado</b>: se crearán en Clasificadores ({type}).",
    empty: "vacía",
    skip: "No importar",
    platformFields: "Campos de la plataforma",
    custom: "Campo personalizado: «{name}»",
    missing: "Falta asignar: {fields}.",
    repeated: "Hay dos columnas asignadas al mismo campo: {fields}.",
    next: "Revisar la importación ›"
  },
  review: {
    checking: "Revisando…",
    checkingText: "Comprobamos cada fila sin guardar nada todavía.",
    couldNotCheck: "No se ha podido revisar: {error}",
    title: "Revisión de «{name}»",
    orders: "pedidos",
    records: "registros",
    newOnes: "{unit} nuevos",
    existing: "ya existen",
    untouched: " (no se tocan)",
    withErrors: "con errores (no se importarán)",
    existingLabel: "Los que ya existen",
    update: "Actualizar con los datos del archivo",
    keep: "Dejarlos como están",
    matchedBy: "Se reconocen por {keys}. Al actualizar solo se rellenan los datos que trae el archivo; los demás se conservan.",
    byCustomer: "NIF, email o nombre",
    byProduct: "referencia, código de barras o nombre",
    byName: "nombre",
    customFields: "Campos personalizados que se crearán en Clasificadores: <b>{fields}</b>.",
    seeErrors: "Ver las filas con errores",
    row: "Fila {row}",
    backToColumns: "‹ Columnas",
    run: "Importar {count} {unit}"
  },
  run: {
    couldNotStart: "No se ha podido iniciar la importación",
    running: "Importando…",
    progress: "{done} de {total}",
    interrupted: "La importación se ha interrumpido: {error}. Lo importado hasta ahora se puede deshacer desde «Importaciones».",
    finished: "Importación terminada",
    created: "creados",
    updated: "actualizados",
    unchanged: "sin cambios",
    withErrors: "con errores",
    undo: "Deshacer esta importación",
    another: "Importar otro archivo",
    see: "Ver {name}",
    noAnswer: "sin respuesta"
  },
  undo: {
    text: "Se borrará lo que CREÓ esta importación (los datos que actualizó no cambian). No se borra lo que ya se esté usando en pedidos, facturas o citas.",
    title: "¿Deshacer la importación?",
    ok: "Deshacer",
    couldNotUndo: "No se ha podido deshacer",
    done: "Deshecha: {customers} clientes, {products} productos, {contacts} {contactsLabel} y {orders} pedidos borrados"
  },
  history: {
    title: "Importaciones",
    text: "Cada importación se puede deshacer: se borra lo que creó (lo que actualizó se conserva, y no se borra lo que ya se use en pedidos, facturas o citas).",
    line: "{date} · {user} · {rows} filas: {created} creados, {updated} actualizados, {errors} con errores · <b>{state}</b>",
    undo: "Deshacer",
    none: "Aún no se ha importado ningún archivo."
  }
};

// src/app/i18n/es/chunks/import/index.ts
var texts = { importing };

// src/app/screens/import/texts.ts
registerMessages(texts);

// delcos-shared:src/app/services/format.ts
var shared2 = globalThis["__delcosModules"]["services/format"];
var pick2 = (name) => shared2[name];
var escapeHtml = /* @__PURE__ */ pick2("escapeHtml");
var formatNumber = /* @__PURE__ */ pick2("formatNumber");

// delcos-shared:src/app/screens/import/fields.ts
var shared3 = globalThis["__delcosModules"]["screens/import/fields"];
var pick3 = (name) => shared3[name];
var FIELDS = /* @__PURE__ */ pick3("FIELDS");
var entityName = /* @__PURE__ */ pick3("entityName");
var entityTypes = /* @__PURE__ */ pick3("entityTypes");
var fieldLabel = /* @__PURE__ */ pick3("fieldLabel");

// delcos-shared:src/app/legacy/bridge.ts
var shared4 = globalThis["__delcosModules"]["legacy/bridge"];
var pick4 = (name) => shared4[name];
var accountListLegacy = /* @__PURE__ */ pick4("accountListLegacy");
var callRpc = /* @__PURE__ */ pick4("callRpc");
var goTo = /* @__PURE__ */ pick4("goTo");
var goToOrders = /* @__PURE__ */ pick4("goToOrders");
var icon = /* @__PURE__ */ pick4("icon");
var importLegacy = /* @__PURE__ */ pick4("importLegacy");
var notices = /* @__PURE__ */ pick4("notices");

// src/app/screens/import/wizard.ts
var wizard = { entity: "clientes", fileName: "", book: null, headers: [], rows: [], mapping: [], signature: "", remembered: false };
var steps = {
  start: () => void 0,
  file: () => void 0,
  columns: () => void 0,
  review: () => void 0,
  history: () => void 0
};
var STEP_NAMES = ["importing.steps.what", "importing.steps.file", "importing.steps.columns", "importing.steps.review"];
function stepsHtml(current) {
  return `<div class="imppasos">${STEP_NAMES.map((key, index) => {
    const step = index + 1, state = step < current ? "hecho" : step === current ? "actual" : "";
    return `<span class="${state}"><b>${step < current ? icon("check") : step}</b>${t(key)}</span>`;
  }).join("")}</div>`;
}
var pageBox = () => document.getElementById("cfgcuerpo");
function paint(html) {
  const box = pageBox();
  if (box) box.innerHTML = html;
  return box;
}
function onClick(id, action) {
  const element = document.getElementById(id);
  if (element) element.onclick = action;
}
var errorLines = (errors) => errors.slice(0, 200).map((item) => `<div><b>${t("importing.review.row", { row: item.fila })}</b> · ${escapeHtml(item.error)}</div>`).join("");
function showProgress(done, total) {
  const bar = pageBox()?.querySelector(".impbarra i");
  if (bar) bar.style.width = `${Math.round(done / total * 100)}%`;
}

// src/app/screens/import/columns-step.ts
var SAMPLE_ROWS = 40;
var SAMPLES = 3;
var samples = (index) => [...new Set(wizard.rows.slice(0, SAMPLE_ROWS).map((row) => row.v[index] ?? "").filter(Boolean))].slice(0, SAMPLES);
function columnHtml(header, index) {
  const chosen = wizard.mapping[index] ?? "no", entity = wizard.entity;
  const options = FIELDS[entity].map(([key, required]) => `<option value="std:${key}" ${chosen === `std:${key}` ? "selected" : ""}>${escapeHtml(fieldLabel(entity, key))}${required ? " *" : ""}</option>`).join("");
  return `<div class="impcol ${chosen === "no" ? "ignorada" : ""}">
      <div><b>${escapeHtml(header)}</b><span class="sm">${samples(index).map(escapeHtml).join(" · ") || t("importing.columns.empty")}</span></div>
      <span class="impflecha">→</span>
      <select data-impc="${index}"><option value="no" ${chosen === "no" ? "selected" : ""}>${t("importing.columns.skip")}</option>
        <optgroup label="${t("importing.columns.platformFields")}">${options}</optgroup>
        <option value="extra" ${chosen === "extra" ? "selected" : ""}>${t("importing.columns.custom", { name: escapeHtml(header) })}</option></select></div>`;
}
function pageHtml() {
  const intro = t("importing.columns.summary", { rows: formatNumber(wizard.rows.length), columns: wizard.headers.length }) + (wizard.remembered ? t("importing.columns.remembered") : t("importing.columns.proposed")) + t("importing.columns.customHint", { type: escapeHtml(entityName(wizard.entity)) });
  return `<div class="card cfgpanel impcaja">${stepsHtml(3)}
    <h2 class="u-p-0-0-4">${t("importing.columns.title", { name: escapeHtml(wizard.fileName) })}</h2>
    <p class="sm">${intro}</p>
    <div class="impmapa">${wizard.headers.map(columnHtml).join("")}</div>
    <div id="impaviso" class="sm u-mt-10"></div>
    <div class="acts u-between"><button class="btn sec" type="button" id="impvolver">${t("importing.file.back")}</button><button class="btn" type="button" id="impsig">${t("importing.columns.next")}</button></div></div>`;
}
function problems() {
  const entity = wizard.entity, assigned = wizard.mapping.filter((value) => value.startsWith("std:")).map((value) => value.slice(4));
  const missing = FIELDS[entity].filter(([key, required]) => required && !assigned.includes(key) && !(entity === "ventas" && key === "producto" && assigned.includes("referencia"))).map(([key]) => fieldLabel(entity, key));
  const repeated = [...new Set(assigned.filter((key, index) => assigned.indexOf(key) !== index))].map((key) => fieldLabel(entity, key));
  return { missing, repeated };
}
function check() {
  const { missing, repeated } = problems(), notice = document.getElementById("impaviso"), next = document.getElementById("impsig");
  const danger = (text2) => `<span class="u-danger">${text2}</span>`;
  if (notice) {
    notice.innerHTML = missing.length ? danger(t("importing.columns.missing", { fields: missing.map(escapeHtml).join(", ") })) : repeated.length ? danger(t("importing.columns.repeated", { fields: repeated.map(escapeHtml).join(", ") })) : "";
  }
  if (next) next.disabled = Boolean(missing.length || repeated.length);
}
function paintColumnsStep() {
  const box = paint(pageHtml());
  box?.querySelectorAll("[data-impc]").forEach((select) => {
    select.onchange = () => {
      wizard.mapping[Number(select.dataset.impc)] = select.value;
      select.closest(".impcol")?.classList.toggle("ignorada", select.value === "no");
      check();
    };
  });
  onClick("impvolver", steps.file);
  onClick("impsig", steps.review);
  check();
}

// delcos-shared:src/app/screens/import/matching.ts
var shared5 = globalThis["__delcosModules"]["screens/import/matching"];
var pick5 = (name) => shared5[name];
var cellValue = /* @__PURE__ */ pick5("cellValue");
var customFieldKey = /* @__PURE__ */ pick5("customFieldKey");
var detectHeaderRow = /* @__PURE__ */ pick5("detectHeaderRow");
var hashText = /* @__PURE__ */ pick5("hashText");
var normaliseHeader = /* @__PURE__ */ pick5("normaliseHeader");
var proposeField = /* @__PURE__ */ pick5("proposeField");

// src/app/screens/import/file-step.ts
var MAX_ROWS = 2e4;
function paintImport() {
  wizard.book = null;
  const types = entityTypes().map((type) => `<button class="imptipo" type="button" data-impt="${type.key}"><span class="imptic">${icon(type.icon)}</span><b>${escapeHtml(type.name)}</b><span class="sm">${escapeHtml(type.hint)}</span></button>`).join("");
  const box = paint(`<div class="card cfgpanel impcaja">${stepsHtml(1)}
    <h2 class="u-p-0-0-4">${t("importing.start.title")}</h2>
    <p class="sm">${t("importing.start.text")}</p>
    <div class="imptipos">${types}</div></div>`);
  box?.querySelectorAll("[data-impt]").forEach((button) => {
    button.onclick = () => {
      wizard.entity = button.dataset.impt;
      paintFileStep();
    };
  });
}
function paintFileStep() {
  paint(`<div class="card cfgpanel impcaja">${stepsHtml(2)}
    <h2 class="u-p-0-0-4">${t("importing.file.title", { name: escapeHtml(entityName(wizard.entity).toLowerCase()) })}</h2>
    <p class="sm">${t("importing.file.text")}${wizard.entity === "ventas" ? t("importing.file.salesText") : ""}</p>
    <label class="impzona" id="impzona"><input type="file" id="impfile" accept=".xlsx,.xls,.csv,.txt" hidden>
      ${icon("file-spreadsheet")}<b>${t("importing.file.drop")}</b><span class="sm">${t("importing.file.maxRows")}</span></label>
    <div id="imphojas"></div>
    <div class="acts u-between"><button class="btn sec" type="button" id="impvolver">${t("importing.file.back")}</button></div></div>`);
  onClick("impvolver", steps.start);
  const zone = document.getElementById("impzona"), input = document.getElementById("impfile");
  if (!zone || !input) return;
  zone.ondragover = (event) => {
    event.preventDefault();
    zone.classList.add("sobre");
  };
  zone.ondragleave = () => {
    zone.classList.remove("sobre");
  };
  zone.ondrop = (event) => {
    event.preventDefault();
    zone.classList.remove("sobre");
    const file = event.dataTransfer?.files[0];
    if (file) void readFile(zone, file);
  };
  input.onchange = () => {
    const file = input.files?.[0];
    if (file) void readFile(zone, file);
  };
}
var zoneText = (zone, text2) => {
  const label = zone.querySelector("b");
  if (label) label.textContent = text2;
};
async function openBook(file) {
  const reader = await importLegacy.excelReader(), buffer = await file.arrayBuffer();
  if (/\.(csv|txt)$/i.test(file.name)) return reader.read(new TextDecoder("utf-8").decode(buffer), { type: "string", cellDates: true, raw: false });
  return reader.read(buffer, { type: "array", cellDates: true });
}
function askSheet(zone, file, book) {
  const place = document.getElementById("imphojas");
  if (!place) return;
  place.innerHTML = `<label for="imphoja">${t("importing.file.sheets")}</label><select id="imphoja">${book.SheetNames.map((name) => `<option>${escapeHtml(name)}</option>`).join("")}</select>
        <div class="acts"><button class="btn" type="button" id="imphojaok">${t("importing.file.next")}</button></div>`;
  zoneText(zone, file.name);
  zone.classList.remove("leyendo");
  onClick("imphojaok", () => {
    void readSheet(document.getElementById("imphoja")?.value ?? "");
  });
}
async function readFile(zone, file) {
  zone.classList.add("leyendo");
  zoneText(zone, t("importing.file.reading", { name: file.name }));
  try {
    const book = await openBook(file);
    wizard.fileName = file.name;
    wizard.book = book;
    if (book.SheetNames.length > 1) askSheet(zone, file, book);
    else await readSheet(book.SheetNames[0] ?? "");
  } catch (error) {
    zone.classList.remove("leyendo");
    zoneText(zone, t("importing.file.unreadable"));
    importLegacy.reportError(`Importar: ${error instanceof Error ? error.message : String(error)}`);
  }
}
function proposeMapping(template) {
  const used = /* @__PURE__ */ new Set();
  return wizard.headers.map((header, index) => {
    const remembered = template?.[header];
    if (remembered) {
      if (remembered.startsWith("std:")) used.add(remembered.slice(4));
      return remembered;
    }
    const field = proposeField(header, wizard.entity, used);
    if (field) {
      used.add(field);
      return `std:${field}`;
    }
    return wizard.rows.some((row) => row.v[index] !== "") ? "extra" : "no";
  });
}
async function readSheet(name) {
  const reader = await importLegacy.excelReader(), sheet = wizard.book?.Sheets[name];
  const rows = reader.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: "" }).map((row) => row.map(cellValue));
  const titleRow = detectHeaderRow(rows);
  wizard.headers = (rows[titleRow] ?? []).map((cell, index) => cell || t("importing.file.column", { index: index + 1 }));
  wizard.rows = rows.slice(titleRow + 1).map((values, index) => ({ fila: titleRow + index + 2, v: values })).filter((row) => row.v.some((cell) => cell !== ""));
  if (!wizard.rows.length) {
    notices.toast(t("importing.file.noRows"), true);
    return;
  }
  if (wizard.rows.length > MAX_ROWS) {
    notices.toast(t("importing.file.tooMany"), true);
    return;
  }
  wizard.signature = hashText(`${wizard.entity}|${wizard.headers.map(normaliseHeader).join("|")}`);
  const { data: template } = await callRpc("plantilla_importacion", { p_entidad: wizard.entity, p_firma: wizard.signature });
  wizard.mapping = proposeMapping(template ?? null);
  wizard.remembered = Boolean(template);
  steps.columns();
}

// delcos-shared:src/app/services/values.ts
var shared6 = globalThis["__delcosModules"]["services/values"];
var pick6 = (name) => shared6[name];
var isPresent = /* @__PURE__ */ pick6("isPresent");
var orFallback = /* @__PURE__ */ pick6("orFallback");

// src/app/screens/import/rows.ts
var BATCH = 200;
function columnsOf() {
  const standard = /* @__PURE__ */ new Map(), custom = /* @__PURE__ */ new Map();
  wizard.mapping.forEach((value, index) => {
    if (value.startsWith("std:")) standard.set(value.slice(4), index);
    else if (value === "extra") custom.set(customFieldKey(wizard.headers[index] ?? ""), index);
  });
  return { standard, custom };
}
function rowObject(row, columns) {
  const result = { _fila: row.fila }, extra = {};
  columns.standard.forEach((index, key) => {
    result[key] = row.v[index] ?? "";
  });
  columns.custom.forEach((index, key) => {
    const value = row.v[index];
    if (value !== void 0 && value !== "") extra[key] = value;
  });
  result.extra = extra;
  return result;
}
var text = (value) => typeof value === "string" ? value : "";
function newOrder(row) {
  return {
    _fila: row._fila,
    numero: text(row.numero),
    fecha: row.fecha,
    cliente: row.cliente,
    nif: text(row.nif),
    medico: text(row.medico),
    forma_pago: text(row.forma_pago),
    cobrado: text(row.cobrado),
    canal: text(row.canal),
    extra: row.extra,
    lineas: []
  };
}
function salesOrders(rows) {
  const orders = /* @__PURE__ */ new Map();
  for (const row of rows) {
    const key = text(row.numero) ? `n:${text(row.numero)}` : `f:${String(row.fecha)}|${String(row.cliente)}`;
    const order = orders.get(key) ?? newOrder(row);
    orders.set(key, order);
    order.lineas.push({ producto: text(row.producto), referencia: text(row.referencia), unidades: row.unidades, precio: row.precio, importe: row.importe, iva: row.iva, medico: text(row.medico) });
  }
  return [...orders.values()];
}
function rowsToImport() {
  const columns = columnsOf(), rows = wizard.rows.map((row) => rowObject(row, columns));
  return wizard.entity === "ventas" ? salesOrders(rows) : rows;
}
function add(total, part) {
  total.creados += part.creados;
  total.actualizados += part.actualizados;
  total.omitidos += part.omitidos;
  total.errores.push(...part.errores);
  total.filas.push(...part.filas);
}
async function sendInBatches(rows, options, onProgress) {
  const total = { creados: 0, actualizados: 0, omitidos: 0, errores: [], filas: [] };
  for (let start2 = 0; start2 < rows.length; start2 += BATCH) {
    const { data, error } = await callRpc("importar_lote", {
      p_imp: options.importId,
      p_entidad: options.entity,
      p_filas: rows.slice(start2, start2 + BATCH),
      p_modo: options.mode,
      p_simular: options.simulate
    });
    if (error || !data?.ok) throw new Error(error ? error.message ?? "" : data?.error ?? t("importing.run.noAnswer"));
    add(total, data);
    onProgress(Math.min(rows.length, start2 + BATCH), rows.length);
  }
  return total;
}

// src/app/screens/import/run-step.ts
var MAX_CLASSIFIER_VALUES = 30;
var DESTINATIONS = { clientes: "pacientes", productos: "productos", prescriptores: "directorio", ventas: "ventas" };
function customFields() {
  return wizard.mapping.map((value, index) => value === "extra" ? index : null).filter(isPresent).map((index) => {
    const values = [...new Set(wizard.rows.map((row) => row.v[index] ?? "").filter(Boolean))], name = wizard.headers[index] ?? "";
    return { clave: customFieldKey(name), nombre: name, valores: values.length <= MAX_CLASSIFIER_VALUES ? values : [] };
  });
}
async function start(rowCount) {
  const mapping = {};
  wizard.headers.forEach((header, index) => {
    mapping[header] = wizard.mapping[index] ?? "no";
  });
  const { data } = await callRpc("importar_iniciar", { p_entidad: wizard.entity, p_archivo: wizard.fileName, p_filas: rowCount, p_mapeo: mapping, p_firma: wizard.signature });
  return data?.ok ? data.id : null;
}
function finishedHtml(result) {
  const errors = result.errores, figure = (value, label, extraClass = "") => `<div class="${extraClass}"><b>${formatNumber(value)}</b><span>${label}</span></div>`;
  return `<div class="card cfgpanel impcaja"><div class="impfin">${icon("check")}</div>
    <h2 class="u-p-0-0-4 u-center">${t("importing.run.finished")}</h2>
    <div class="impres">${figure(result.creados, t("importing.run.created"), "ok")}${figure(result.actualizados, t("importing.run.updated"))}
      ${figure(result.omitidos, t("importing.run.unchanged"))}${figure(errors.length, t("importing.run.withErrors"), errors.length ? "mal" : "")}</div>
    ${errors.length ? `<details class="imperr"><summary>${t("importing.review.seeErrors")}</summary><div>${errorLines(errors)}</div></details>` : ""}
    <div class="acts" style="justify-content:center;flex-wrap:wrap"><button class="btn sec" type="button" id="impdes">${icon("undo-2")} ${t("importing.run.undo")}</button>
      <button class="btn sec" type="button" id="impotra">${t("importing.run.another")}</button><button class="btn" type="button" id="impver">${t("importing.run.see", { name: escapeHtml(entityName(wizard.entity).toLowerCase()) })}</button></div></div>`;
}
function showRunProgress(done, total) {
  showProgress(done, total);
  const counter = document.getElementById("impav");
  if (counter) counter.textContent = t("importing.run.progress", { done: formatNumber(done), total: formatNumber(total) });
}
async function runImport(rows, mode) {
  const importId = await start(rows.length);
  if (!importId) {
    notices.toast(t("importing.run.couldNotStart"), true);
    return;
  }
  const fields = customFields();
  if (fields.length) await callRpc("importar_campos", { p_entidad: wizard.entity, p_campos: fields });
  paint(`<div class="card cfgpanel impcaja">${stepsHtml(4)}<h2 class="u-p-0-0-4">${t("importing.run.running")}</h2><p class="sm" id="impav">${t("importing.run.progress", { done: 0, total: formatNumber(rows.length) })}</p><div class="impbarra"><i style="width:0"></i></div></div>`);
  let result;
  try {
    result = await sendInBatches(rows, { entity: wizard.entity, mode, simulate: false, importId }, showRunProgress);
  } catch (error) {
    notices.toast(t("importing.run.interrupted", { error: error instanceof Error ? error.message : String(error) }), true);
    return;
  }
  await callRpc("importar_terminar", { p_imp: importId });
  importLegacy.countWrite();
  if (!pageBox()) return;
  paint(finishedHtml(result));
  const destination = DESTINATIONS[wizard.entity];
  onClick("impdes", () => {
    void undoImport(importId);
  });
  onClick("impotra", steps.start);
  onClick("impver", () => {
    if (destination === "ventas") goToOrders("ventas");
    else goTo(destination);
  });
}
async function undoImport(id) {
  if (!await notices.confirm(t("importing.undo.text"), { titulo: t("importing.undo.title"), ok: t("importing.undo.ok"), peligro: true })) return;
  const { data } = await callRpc("importar_deshacer", { p_imp: id });
  if (!data?.ok) {
    notices.toast(t("importing.undo.couldNotUndo"), true);
    return;
  }
  importLegacy.countWrite();
  notices.toast(t("importing.undo.done", { customers: data.clientes, products: data.productos, contacts: data.prescriptores, contactsLabel: accountListLegacy.contactsLabel().toLowerCase(), orders: data.pedidos }));
  importLegacy.showHistory();
  steps.history();
}

// src/app/screens/import/history.ts
var UNDONE = "Deshecha";
function rowHtml(item, names) {
  const date = new Date(item.creado_en).toLocaleString(t("dates.locale"), { dateStyle: "short", timeStyle: "short" });
  const line = t("importing.history.line", {
    date,
    user: escapeHtml(orFallback(item.usuario, "—")),
    rows: formatNumber(item.filas),
    created: formatNumber(item.creados),
    updated: formatNumber(item.actualizados),
    errors: formatNumber(item.errores),
    state: escapeHtml(item.estado)
  });
  return `<div class="errfila e-${item.estado === UNDONE ? "api" : "reporte"}"><div><b>${escapeHtml(names.get(item.entidad) ?? item.entidad)} · ${escapeHtml(item.archivo ?? "")}</b>
      <span class="sm">${line}</span></div>
      ${item.estado !== UNDONE ? `<button class="btn sec" type="button" data-impdes="${item.id}">${icon("undo-2")} ${t("importing.history.undo")}</button>` : "<span></span>"}</div>`;
}
async function paintImports() {
  const { data } = await callRpc("importaciones_lista", {});
  const names = new Map(entityTypes().map((type) => [type.key, type.name]));
  const box = paint(`<div class="card cfgpanel"><h2>${t("importing.history.title")}</h2>
    <p class="sm">${t("importing.history.text")}</p>
    <div class="errlista">${(data ?? []).map((item) => rowHtml(item, names)).join("") || `<div class="vacio">${t("importing.history.none")}</div>`}</div></div>`);
  box?.querySelectorAll("[data-impdes]").forEach((button) => {
    button.onclick = () => {
      void undoImport(button.dataset.impdes ?? "");
    };
  });
}

// src/app/screens/import/review-step.ts
var MATCHED_BY = /* @__PURE__ */ new Map([["clientes", "importing.review.byCustomer"], ["productos", "importing.review.byProduct"]]);
var OPEN_ERRORS = 10;
function countsOf(check2) {
  const count = (action) => check2.filas.filter((row) => row.accion === action).length;
  return { created: count("nuevo"), existing: count("actualizado"), skipped: count("omitido"), unit: t(wizard.entity === "ventas" ? "importing.review.orders" : "importing.review.records") };
}
function summaryHtml(counts, errors) {
  return `<div class="impres"><div class="ok"><b>${formatNumber(counts.created)}</b><span>${t("importing.review.newOnes", { unit: counts.unit })}</span></div>
      <div><b>${formatNumber(counts.existing + counts.skipped)}</b><span>${t("importing.review.existing")}${wizard.entity === "ventas" ? t("importing.review.untouched") : ""}</span></div>
      <div class="${errors ? "mal" : ""}"><b>${formatNumber(errors)}</b><span>${t("importing.review.withErrors")}</span></div></div>`;
}
function modeHtml(counts) {
  if (!counts.existing || wizard.entity === "ventas") return "";
  return `<label>${t("importing.review.existingLabel")}</label><div class="segs" id="impmodo"><button type="button" data-v="actualizar" class="on">${t("importing.review.update")}</button><button type="button" data-v="omitir">${t("importing.review.keep")}</button></div>
      <p class="sm">${t("importing.review.matchedBy", { keys: t(MATCHED_BY.get(wizard.entity) ?? "importing.review.byName") })}</p>`;
}
function pageHtml2(check2, counts) {
  const custom = wizard.mapping.map((value, index) => value === "extra" ? wizard.headers[index] ?? "" : "").filter(Boolean);
  const errors = check2.errores;
  return `<div class="card cfgpanel impcaja">${stepsHtml(4)}
    <h2 class="u-p-0-0-4">${t("importing.review.title", { name: escapeHtml(wizard.fileName) })}</h2>
    ${summaryHtml(counts, errors.length)}
    ${modeHtml(counts)}
    ${custom.length ? `<p class="sm">${t("importing.review.customFields", { fields: custom.map(escapeHtml).join(", ") })}</p>` : ""}
    ${errors.length ? `<details class="imperr" ${errors.length <= OPEN_ERRORS ? "open" : ""}><summary>${t("importing.review.seeErrors")}</summary><div>${errorLines(errors)}</div></details>` : ""}
    <div class="acts u-between"><button class="btn sec" type="button" id="impvolver">${t("importing.review.backToColumns")}</button>
      <button class="btn" type="button" id="impok" ${counts.created + counts.existing ? "" : "disabled"}>${t("importing.review.run", { count: formatNumber(counts.created + counts.existing), unit: counts.unit })}</button></div></div>`;
}
function bind(rows, counts) {
  let mode = "actualizar";
  const modes = document.getElementById("impmodo"), run = document.getElementById("impok");
  modes?.querySelectorAll("button").forEach((button) => {
    button.onclick = () => {
      mode = button.dataset.v ?? "actualizar";
      modes.querySelectorAll("button").forEach((other) => {
        other.classList.toggle("on", other === button);
      });
      if (run) run.textContent = t("importing.review.run", { count: formatNumber(counts.created + (mode === "actualizar" ? counts.existing : 0)), unit: counts.unit });
    };
  });
  onClick("impvolver", steps.columns);
  if (run) run.onclick = () => {
    void runImport(rows, wizard.entity === "ventas" ? "omitir" : mode);
  };
}
async function paintReviewStep() {
  const rows = rowsToImport();
  paint(`<div class="card cfgpanel impcaja">${stepsHtml(4)}<h2 class="u-p-0-0-4">${t("importing.review.checking")}</h2><p class="sm">${t("importing.review.checkingText")}</p><div class="impbarra"><i style="width:0"></i></div></div>`);
  let check2;
  try {
    check2 = await sendInBatches(rows, { entity: wizard.entity, mode: "actualizar", simulate: true, importId: null }, showProgress);
  } catch (error) {
    notices.toast(t("importing.review.couldNotCheck", { error: error instanceof Error ? error.message : String(error) }), true);
    steps.columns();
    return;
  }
  const counts = countsOf(check2);
  paint(pageHtml2(check2, counts));
  bind(rows, counts);
}

// src/app/screens/import/chunk.ts
Object.assign(steps, {
  start: paintImport,
  file: paintFileStep,
  columns: paintColumnsStep,
  review: () => {
    void paintReviewStep();
  },
  history: () => {
    void paintImports();
  }
});
export {
  paintImport,
  paintImports
};
