// delcos-shared:src/app/i18n/index.ts
var shared = globalThis["__delcosModules"]["i18n/index"];
var pick = (name) => shared[name];
var registerMessages = /* @__PURE__ */ pick("registerMessages");
var t = /* @__PURE__ */ pick("t");

// src/app/i18n/es/chunks/manual/manual.ts
var manual = {
  title: "Manual de uso",
  book: {
    subtitle: "Todo lo que puedes hacer con delcos, paso a paso, con fotos y vídeos",
    backTo: "Volver a {name}"
  },
  portal: {
    subtitle: "Todo lo que puedes hacer en la plataforma, explicado para tu perfil.",
    modules: "{count} módulos disponibles",
    search: "¿Qué quieres hacer? Aplazar una cita, bloquear un día, emitir una factura…",
    searchLabel: "Buscar en el manual",
    firstSteps: "Primeros pasos",
    byModule: "Por módulo",
    faq: "Preguntas frecuentes",
    yourAccess: "Tu acceso: {level}",
    noAccess: "Sin acceso",
    full: "Completo",
    faqHit: "Pregunta frecuente",
    configuredIn: "Dónde se configura: {place}",
    noResults: "No hay resultados para «{query}». Prueba con otra palabra: cita, ruta, pedido, factura…",
    inPlan: "Incluido en el plan {plan}",
    premium: "Premium",
    notNow: "Ahora no",
    takeMe: "Llévame",
    whatYouCanDo: "Qué puedes hacer",
    howItWorks: "Cómo funciona",
    whereConfigured: "Dónde se configura",
    goToSettings: "Ir a su configuración",
    open: "Abrir {name}"
  }
};

// src/app/i18n/es/chunks/manual/index.ts
var texts = { manual };

// src/app/screens/manual/texts.ts
registerMessages(texts);

// delcos-shared:src/app/legacy/bridge.ts
var shared2 = globalThis["__delcosModules"]["legacy/bridge"];
var pick2 = (name) => shared2[name];
var currentScreen = /* @__PURE__ */ pick2("currentScreen");
var goTo = /* @__PURE__ */ pick2("goTo");
var icon = /* @__PURE__ */ pick2("icon");
var manualLegacy = /* @__PURE__ */ pick2("manualLegacy");
var permissions = /* @__PURE__ */ pick2("permissions");

// delcos-shared:src/app/services/format.ts
var shared3 = globalThis["__delcosModules"]["services/format"];
var pick3 = (name) => shared3[name];
var escapeHtml = /* @__PURE__ */ pick3("escapeHtml");
var formatNumber = /* @__PURE__ */ pick3("formatNumber");

// src/app/screens/manual/model.ts
var FULL = 3;
var HELP_KEY = /* @__PURE__ */ new Map([["visitas", "agenda"], ["centros", "directorio"]]);
var PLAN_MODULES = /* @__PURE__ */ new Set(["agenda", "rutas", "directorio", "ventas", "facturacion", "analitica", "productos", "pacientes", "seguimiento"]);
function firstSteps() {
  const steps = manualLegacy.firstSteps(), kind = ["cartera", "televenta"].find((capability) => manualLegacy.can(capability));
  return (kind ? steps[kind] : void 0) ?? steps.default ?? [];
}
function cardLevel(section) {
  if (section.a) return permissions.levelOf(section.a);
  if (manualLegacy.can("administrar")) return FULL;
  return section.id === "roles" || section.id === "permisos" ? 1 : 0;
}
function sheetLevel(section) {
  if (section.a) return permissions.levelOf(section.a);
  return manualLegacy.can("administrar") ? FULL : 1;
}
function accessText(section) {
  if (section.a) return manualLegacy.levelText(permissions.levelOf(section.a));
  return manualLegacy.can("administrar") ? t("manual.portal.full") : "—";
}
var helpLines = (id, byScreen = true) => manualLegacy.help(byScreen ? HELP_KEY.get(id) ?? id : id)?.[2] ?? [];
var sectionIcon = (id) => manualLegacy.icon(id) ?? "📘";
var findSection = (id) => manualLegacy.sections().find((section) => section.id === id);

// src/app/screens/manual/portal-info.ts
var SETTINGS_FOR_EVERYONE = ["horario", "kpis", "prefs"];
function openDialog(html) {
  const body = document.getElementById("dbody"), box = document.getElementById("dlg");
  if (!body || !box) return;
  body.innerHTML = html;
  box.showModal();
}
function closeAndGo(buttonId, screen, section) {
  const button = document.getElementById(buttonId);
  if (button) button.onclick = () => {
    document.getElementById("dlg")?.close();
    manualLegacy.go(screen, section);
  };
}
var close = `<button class="x" data-cerrar aria-label="${t("common.close")}">✕</button>`;
function showFirstStep(step) {
  const [stepIcon, title, text, screen] = step, about = findSection(screen)?.para;
  openDialog(`<div class="fh"><div><h2>${stepIcon} ${escapeHtml(title)}</h2><div class="sm">${t("manual.portal.firstSteps")}</div></div>${close}</div>
      <p>${escapeHtml(text)}</p>${about ? `<p class="sm">${escapeHtml(about)}</p>` : ""}
      <div class="acts u-end"><button class="btn sec" data-cerrar>${t("manual.portal.notNow")}</button>
        ${screen === "config" || manualLegacy.canOpenModule(screen) ? `<button class="btn" id="mangoir">${t("manual.portal.takeMe")}</button>` : ""}</div>`);
  closeAndGo("mangoir", screen, screen === "config" ? "prefs" : void 0);
}
function listsHtml(section) {
  const level = sheetLevel(section), lines = helpLines(section.id), places = section.config ?? [];
  const can = section.hacer.map(([required, text]) => `<li class="${level >= required ? "si" : "no"}"><span>${level >= required ? "✓" : "🔒"}</span><span>${escapeHtml(text)}</span></li>`).join("");
  return `<h3 class="mansub">${t("manual.portal.whatYouCanDo")}</h3><ul class="manlist">${can}</ul>
    ${lines.length ? `<h3 class="mansub">${t("manual.portal.howItWorks")}</h3><ul class="manlist">${lines.map((line) => `<li><span>•</span><span>${line}</span></li>`).join("")}</ul>` : ""}
    ${places.length ? `<h3 class="mansub">${t("manual.portal.whereConfigured")}</h3><div class="mancfg">${places.map((place) => `<span>⚙ ${escapeHtml(place)}</span>`).join("")}</div>` : ""}`;
}
var canGoToSettings = (settings) => settings !== void 0 && settings !== "" && (manualLegacy.can("administrar") || SETTINGS_FOR_EVERYONE.includes(settings));
var canOpenScreen = (destination2) => destination2 !== null && destination2 !== "manual" && (destination2 === "config" || manualLegacy.canOpenModule(destination2));
function showSection(id) {
  const section = findSection(id);
  if (!section) return;
  const destination2 = manualLegacy.isModule(id) || ["manual", "config"].includes(id) ? id : null, settings = manualLegacy.settingsOf(id);
  const canSettings = canGoToSettings(settings), canOpen = canOpenScreen(destination2);
  openDialog(`<div class="fh"><div><h2>${sectionIcon(id)} ${escapeHtml(section.t)}</h2><div class="sm">${escapeHtml(section.para)}</div></div>${close}</div>
    ${listsHtml(section)}
    <div class="acts" style="justify-content:flex-end;flex-wrap:wrap;margin-top:14px"><button class="btn sec" data-cerrar>${t("common.close")}</button>
      ${canSettings ? `<button class="btn sec" id="manircfg">${t("manual.portal.goToSettings")}</button>` : ""}
      ${canOpen ? `<button class="btn" id="manirmod">${t("manual.portal.open", { name: escapeHtml(section.t) })}</button>` : ""}</div>`);
  if (destination2) closeAndGo("manirmod", destination2);
  if (settings) closeAndGo("manircfg", "config", settings);
}

// src/app/screens/manual/portal-search.ts
var MIN_QUERY = 2;
var MAX_HITS = 12;
var stripTags = (text) => text.replace(/<[^>]+>/g, "");
var normalise = (text) => stripTags(text).toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
var escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function searchIndex() {
  const entries = [];
  for (const section of manualLegacy.sections()) {
    const add = (text) => {
      entries.push({ section: section.id, module: section.t, text });
    };
    add(section.para);
    section.hacer.forEach(([, text]) => {
      add(text);
    });
    (section.config ?? []).forEach((place) => {
      add(t("manual.portal.configuredIn", { place }));
    });
    helpLines(section.id, false).forEach((line) => {
      add(stripTags(line));
    });
  }
  manualLegacy.faq().forEach(([question, answer]) => {
    entries.push({ section: null, module: t("manual.portal.faqHit"), text: `${question} — ${answer}` });
  });
  return entries;
}
function hitHtml(entry, words) {
  let text = escapeHtml(stripTags(entry.text));
  words.forEach((word) => {
    text = text.replace(new RegExp(`(${escapeRegExp(word)})`, "ig"), "<mark>$1</mark>");
  });
  return `<button class="manhit" ${entry.section ? `data-mansec2="${entry.section}"` : ""}><span class="mhm">${escapeHtml(entry.module)}</span><span>${text}</span></button>`;
}
function search(input, results, entries) {
  const query = normalise(input.value.trim());
  document.querySelectorAll(".mancard").forEach((card) => {
    card.classList.remove("hide");
  });
  if (query.length < MIN_QUERY) {
    results.classList.add("hide");
    return;
  }
  const words = query.split(/\s+/);
  const hits = entries.filter((entry) => words.every((word) => normalise(`${entry.text} ${entry.module}`).includes(word))).slice(0, MAX_HITS);
  results.classList.remove("hide");
  results.innerHTML = hits.length ? hits.map((entry) => hitHtml(entry, words)).join("") : `<div class="manhit">${t("manual.portal.noResults", { query: escapeHtml(input.value) })}</div>`;
}
function listenToSearch() {
  const input = document.getElementById("manq");
  if (!input) return;
  input.insertAdjacentHTML("afterend", '<div class="manres hide" id="manres"></div>');
  const results = document.getElementById("manres"), entries = searchIndex();
  if (!results) return;
  input.oninput = () => {
    search(input, results, entries);
  };
  results.addEventListener("click", (event) => {
    const hit = event.target?.closest("[data-mansec2]");
    if (!hit) return;
    results.classList.add("hide");
    showSection(hit.dataset.mansec2 ?? "");
  });
}

// src/app/screens/manual/portal.ts
function heroHtml() {
  const profile = manualLegacy.profile();
  return `<div class="manhero">
      <div><h1>${t("manual.title")}</h1><p>${t("manual.portal.subtitle")}</p>
        <div class="manchips"><span>👤 ${escapeHtml(profile.nombre)}</span><span>🎫 ${escapeHtml(profile.rol)}</span><span>🧩 ${t("manual.portal.modules", { count: formatNumber(manualLegacy.moduleCount()) })}</span></div></div>
      <div class="manbusca"><input id="manq" type="search" placeholder="${t("manual.portal.search")}" aria-label="${t("manual.portal.searchLabel")}"></div>
    </div>`;
}
function cardHtml(section) {
  const level = cardLevel(section), pill = level >= 2 ? "p-est" : level === 1 ? "p-per" : "p-anu";
  return `<button class="mancard ${level ? "" : "bloq"}" data-mansec="${section.id}"><span class="mci">${sectionIcon(section.id)}</span>
        <b>${escapeHtml(section.t)}</b><span class="mcd">${escapeHtml(section.para)}</span><span class="pill ${pill}">${level ? t("manual.portal.yourAccess", { level: accessText(section) }) : t("manual.portal.noAccess")}</span></button>`;
}
function pageHtml() {
  const steps = firstSteps().map(([stepIcon, title, text, screen], index) => `<button class="manpaso" data-mira="${screen}"><span class="mpn">${index + 1}</span><span class="mpi">${stepIcon}</span><b>${escapeHtml(title)}</b><span>${escapeHtml(text)}</span></button>`).join("");
  return `${heroHtml()}
    <h2 class="mantit">${t("manual.portal.firstSteps")}</h2>
    <div class="manpasos">${steps}</div>
    <h2 class="mantit">${t("manual.portal.byModule")}</h2>
    <div class="mangrid">${manualLegacy.sections().map(cardHtml).join("")}</div>
    <h2 class="mantit">${t("manual.portal.faq")}</h2>
    <div class="card manfaqs">${manualLegacy.faq().map(([question, answer]) => `<details class="manfaq"><summary>${escapeHtml(question)}</summary><p>${escapeHtml(answer)}</p></details>`).join("")}</div>`;
}
function markOutOfPlan(page) {
  page.querySelectorAll(".mancard").forEach((card) => {
    const module = card.dataset.mansec ?? "";
    if (!PLAN_MODULES.has(module) || manualLegacy.planIncludes(module)) return;
    const pill = card.querySelector(".pill");
    if (pill) {
      pill.className = "pill p-plan";
      pill.innerHTML = `${icon("lock")} ${t("manual.portal.inPlan", { plan: escapeHtml(manualLegacy.cheapestPlan(module) ?? t("manual.portal.premium")) })}`;
    }
    card.classList.add("bloq");
    card.onclick = () => {
      manualLegacy.showPlanNotice(module);
    };
  });
}
function bind(page) {
  page.onclick = (event) => {
    const step = event.target?.closest("[data-mira]");
    if (!step) return;
    const card = step.closest(".manpaso"), index = card ? [...page.querySelectorAll(".manpaso")].indexOf(card) : -1, chosen = firstSteps()[index];
    if (index >= 0 && chosen) showFirstStep(chosen);
  };
  page.querySelectorAll(".mancard").forEach((card) => {
    card.onclick = () => {
      showSection(card.dataset.mansec ?? "");
    };
  });
}
function paintPortalManual() {
  const page = document.getElementById("v-manual");
  if (!page) return;
  page.innerHTML = pageHtml();
  bind(page);
  listenToSearch();
  markOutOfPlan(page);
}

// src/app/screens/manual/book.ts
var BOOK = "manual/index.html";
var BACK_WAIT_MS = 4e3;
var BACK_STEP_MS = 120;
var destination = "";
var remember = (url) => {
  window.MANUAL_ULTIMA = url;
};
function saveVocabulary() {
  try {
    localStorage.setItem("delcos-manual", JSON.stringify(manualLegacy.vocabulary()));
  } catch {
  }
}
var withAnchor = (base) => base + (destination ? `#${destination}` : "");
function openManual(anchor = "") {
  saveVocabulary();
  destination = anchor;
  remember(BOOK + (anchor ? `#${anchor}` : ""));
  const frame = document.getElementById("manlibro");
  if (currentScreen() === "manual" && frame) {
    try {
      if (frame.contentWindow) frame.contentWindow.location.hash = anchor || "portada";
    } catch {
    }
    return;
  }
  goTo("manual");
}
function paintBook() {
  const page = document.getElementById("v-manual");
  if (!page) return;
  saveVocabulary();
  const url = withAnchor(`${BOOK}?app=1`);
  destination = "";
  page.innerHTML = `<div class="saludo"><div><h1>${t("manual.title")}</h1><div class="fecha">${t("manual.book.subtitle")}</div></div></div>
    <iframe id="manlibro" class="manlibro" title="${t("manual.title")}" src="${url}"></iframe>`;
}
var delay = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});
async function goBack() {
  const back = manualLegacy.takeBack();
  if (!back) {
    goTo("inicio");
    return;
  }
  goTo(back.tab);
  const end = Date.now() + BACK_WAIT_MS;
  while (Date.now() < end) {
    await delay(BACK_STEP_MS);
    const screen = document.getElementById(`v-${back.tab}`) ?? document.querySelector("main > section:not(.hide)");
    const ready = !document.querySelector("main > section.preparando") && !screen?.classList.contains("cargando");
    if (ready && document.documentElement.scrollHeight - innerHeight >= back.y - 2) break;
  }
  window.scrollTo(0, back.y);
}
function addBackButton() {
  const header = document.querySelector("#v-manual .saludo"), back = manualLegacy.back();
  if (!header || !back || document.getElementById("manvolver")) return;
  header.insertAdjacentHTML("afterbegin", `<button type="button" class="manvuelta" id="manvolver"><b aria-hidden="true">‹</b> ${t("manual.book.backTo", { name: escapeHtml(manualLegacy.screenName(back.tab)) })}</button>`);
  const button = document.getElementById("manvolver");
  if (button) button.onclick = () => {
    void goBack();
  };
}
function paintManual() {
  if (permissions.isProfessionalPortal()) paintPortalManual();
  else if (manualLegacy.isIos()) {
    saveVocabulary();
    const url = withAnchor(BOOK);
    destination = "";
    remember(url);
    location.href = url;
    return;
  } else paintBook();
  addBackButton();
}
export {
  goBack,
  openManual,
  paintManual
};
