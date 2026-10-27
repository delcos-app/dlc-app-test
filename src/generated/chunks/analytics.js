// delcos-shared:src/app/i18n/index.ts
var shared = globalThis["__delcosModules"]["i18n/index"];
var pick = (name) => shared[name];
var t = /* @__PURE__ */ pick("t");

// delcos-shared:src/app/services/date-format.ts
var shared2 = globalThis["__delcosModules"]["services/date-format"];
var pick2 = (name) => shared2[name];
var formatShortDate = /* @__PURE__ */ pick2("formatShortDate");
var shortMonthNames = /* @__PURE__ */ pick2("shortMonthNames");

// delcos-shared:src/app/services/format.ts
var shared3 = globalThis["__delcosModules"]["services/format"];
var pick3 = (name) => shared3[name];
var escapeHtml = /* @__PURE__ */ pick3("escapeHtml");
var formatCurrency = /* @__PURE__ */ pick3("formatCurrency");
var formatNumber = /* @__PURE__ */ pick3("formatNumber");

// delcos-shared:src/app/legacy/bridge.ts
var shared4 = globalThis["__delcosModules"]["legacy/bridge"];
var pick4 = (name) => shared4[name];
var callRpc = /* @__PURE__ */ pick4("callRpc");
var commercialStates = /* @__PURE__ */ pick4("commercialStates");
var currentScreen = /* @__PURE__ */ pick4("currentScreen");
var icon = /* @__PURE__ */ pick4("icon");
var isMobile = /* @__PURE__ */ pick4("isMobile");
var legacyDb = /* @__PURE__ */ pick4("legacyDb");
var notices = /* @__PURE__ */ pick4("notices");
var permissions = /* @__PURE__ */ pick4("permissions");
var salesTeam = /* @__PURE__ */ pick4("salesTeam");
var term = /* @__PURE__ */ pick4("term");

// delcos-shared:src/app/services/values.ts
var shared5 = globalThis["__delcosModules"]["services/values"];
var pick5 = (name) => shared5[name];
var isPresent = /* @__PURE__ */ pick5("isPresent");
var range = /* @__PURE__ */ pick5("range");
var sum = /* @__PURE__ */ pick5("sum");

// src/app/screens/analytics/visit-orders/model.ts
var DEFAULT_DAYS = 30;
var percent = (part, whole) => whole ? Math.round((part ?? 0) / whole * 100) : 0;
var words = () => ({
  visit: term("visita"),
  visits: term("visita", { number: "p" }),
  Visits: term("visita", { number: "p", capital: "C" }),
  theVisit: term("visita", { article: "el" }),
  toTheVisit: term("visita", { article: "al" }),
  ofTheVisit: term("visita", { article: "del" }),
  theVisits: term("visita", { number: "p", article: "el" }),
  TheVisits: term("visita", { number: "p", article: "el", articleCapital: "C" }),
  aVisit: term("visita", { article: "un", articleCapital: "C" }),
  aProfessional: term("medico", { article: "un" }),
  toTheProfessional: term("medico", { article: "al" })
});

// src/app/screens/analytics/visit-orders/effect.ts
var PAD = 22;
var SMOOTH = 3;
var HEADROOM = 1.2;
var MIN_MAX = 1e-3;
var smooth = (raw) => raw.map((point, index) => {
  const around = raw.slice(Math.max(0, index - SMOOTH), index + SMOOTH + 1).filter((other) => other.k < 0 === point.k < 0);
  return { k: point.k, v: sum(around.map((other) => other.v)) / around.length };
});
var average = (points) => sum(points.map((point) => point.v)) / (points.length || 1);
var decimals = (value) => value.toLocaleString("es-ES", { maximumFractionDigits: value < 10 ? 2 : 1 });
function scale(frame) {
  return {
    x: (day) => PAD + (day + frame.days) / (2 * frame.days) * (frame.width - 2 * PAD),
    y: (value) => frame.height - 24 - value / frame.max * (frame.height - 52)
  };
}
function chart(points, frame) {
  const { x, y } = scale(frame), { width, height, days } = frame, base = height - 24;
  const path = (list) => list.map((point, index) => `${index ? "L" : "M"}${x(point.k).toFixed(1)} ${y(point.v).toFixed(1)}`).join(" ");
  const area = (list, from, to) => `${path(list)} L${x(to)} ${base} L${x(from)} ${base} Z`;
  const peak = points.filter((point) => point.k >= 0).reduce((best, point) => point.v > best.v ? point : best, { k: 0, v: -1 });
  const peakText = peak.k > 0 && peak.v > 0 ? `<text x="${Math.min(x(peak.k), width - 60)}" y="${Math.max(y(peak.v) - 8, 34)}" class="tvtxt tvtxtpico" text-anchor="middle">${t("analytics.orders.peak", { day: peak.k })}</text>` : "";
  const axis = [-days, -days / 2, 0, days / 2, days].map((day) => `<text x="${x(day)}" y="${height - 6}" class="tvtxt tvtxteje" text-anchor="middle">${day > 0 ? "+" : ""}${Math.round(day)} d</text>`).join("");
  return `<svg class="tvsvg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${t("analytics.orders.effectLabel")}">
      <defs><linearGradient id="tvgrad" x1="0" x2="0" y1="0" y2="1"><stop offset="0" class="tvs1"/><stop offset="1" class="tvs2"/></linearGradient></defs>
      <path d="${area(points.filter((point) => point.k <= 0), -days, 0)}" class="tvantes"/><path d="${area(points.filter((point) => point.k >= 0), 0, days)}" fill="url(#tvgrad)"/>
      <path d="${path(points)}" class="tvlin"/>
      <line x1="${x(0)}" x2="${x(0)}" y1="14" y2="${base}" class="tvhoy"/>
      <text x="${x(0) + 6}" y="20" class="tvtxt tvtxthoy">${t("analytics.orders.visitDay", words())}</text>
      ${peakText}
      ${axis}
    </svg>`;
}
function headline(before, after, days) {
  if (before > 0) {
    return {
      big: `${after >= before ? "+" : ""}${formatNumber(Math.round((after / before - 1) * 100))}<small> %</small>`,
      label: t(after >= before ? "analytics.orders.moreUnits" : "analytics.orders.fewerUnits", { ...words(), days })
    };
  }
  return after > 0 ? { big: "—", label: t("analytics.orders.noOrdersBefore", words()) } : { big: "0", label: t("analytics.orders.noOrders") };
}
function effect(data) {
  const result = data.efecto ?? {}, visits = result.visitas ?? 0, days = data.dias ?? DEFAULT_DAYS;
  if (!visits) return `<div class="vacio">${t("analytics.orders.noVisits", words())}</div>`;
  const raw = (result.dias ?? []).map((day) => ({ k: day.k, v: (Number(day.u) || 0) / visits })), points = smooth(raw);
  const before = average(raw.filter((point) => point.k < 0)), after = average(raw.filter((point) => point.k >= 0));
  const mobile = isMobile(), frame = { width: mobile ? 360 : 640, height: mobile ? 170 : 200, days, max: Math.max(...points.map((point) => point.v), MIN_MAX) * HEADROOM };
  const { big, label } = headline(before, after, days);
  return `<div class="tvgrid tvgb"><div class="tvizq"><div class="tvbig">${big}</div>
      <div class="tvlbl">${label}</div>
      <div class="tvrow"><div class="tvmini"><b>${decimals(before)}</b><span class="tvlbl">${t("analytics.orders.perDayBefore")}</span></div><div class="tvmini"><b>${decimals(after)}</b><span class="tvlbl">${t("analytics.orders.perDayAfter")}</span></div></div></div>
    <div>${chart(points, frame)}<div class="tvley"><span><i class="tvl1"></i>${t("analytics.orders.before")}</span><span><i class="tvl2"></i>${t("analytics.orders.after")}</span></div></div></div>`;
}

// src/app/screens/analytics/visit-orders/funnel.ts
var bar = (width, extraClass) => `<svg class="tvbar" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true"><rect class="tvbg" width="100" height="10" rx="3"/><rect class="tvfg${extraClass}" width="${width}" height="10" rx="3"/></svg>`;
var mini = (value, label, valueClass = "") => `<div class="tvmini"><b${valueClass ? ` class="${valueClass}"` : ""}>${value}</b><span class="tvlbl">${label}</span></div>`;
function steps(summary, days) {
  const visits = summary.visitas ?? 0, visited = summary.profesionales ?? 0, withOrder = summary.con_venta ?? 0;
  return [
    [t("analytics.orders.visitsDone", words()), visits, visits ? 1 : 0, ""],
    [term("medico", { number: "p", capital: "C", adjective: "visitado" }), visited, visits ? visited / visits : 0, ""],
    [t("analytics.orders.withOrderIn", { days }), withOrder, visits ? withOrder / visits : 0, "c"]
  ];
}
function changeHtml(difference) {
  if (difference === null) return "";
  return `<div class="tvlbl"><span class="${difference >= 0 ? "tvok" : "tvmal"}">${difference >= 0 ? "▲ +" : "▼ "}${t("analytics.orders.points", { count: formatNumber(difference) })}</span> ${t("analytics.orders.vsPrevious")}</div>`;
}
function funnel(data) {
  const summary = data.resumen ?? {}, before = summary.anterior ?? {}, days = data.dias ?? DEFAULT_DAYS;
  const share = percent(summary.con_venta, summary.profesionales), previous = percent(before.con_venta, before.profesionales);
  const difference = before.profesionales ? share - previous : null;
  const average2 = isPresent(summary.dias_media) ? t("analytics.orders.days", { count: formatNumber(summary.dias_media) }) : "—";
  return `<div class="tvgrid"><div class="tvizq"><div class="tvbig">${formatNumber(share)}<small> %</small></div>
      <div class="tvlbl">${t("analytics.orders.haveOrder", { visited: term("medico", { number: "p", article: "del", adjective: "visitado" }), days })}</div>
      <div class="tvrow">${mini(formatNumber(summary.unidades ?? 0), t("analytics.orders.units"))}
        ${mini(average2, t("analytics.orders.untilFirst"))}</div></div>
    <div class="tvfun">${steps(summary, days).map(([label, count, share2, extraClass]) => `<div class="tvst"><span>${escapeHtml(label)}</span>
      ${bar(Math.max(share2 * 100, count ? 3 : 0).toFixed(1), extraClass ? ` ${extraClass}` : " ")}
      <b>${formatNumber(count)}</b></div>`).join("")}
      ${changeHtml(difference)}</div></div>`;
}
var TYPES = [["captacion", "analytics.orders.typeCapture"], ["presentacion", "analytics.orders.typePresentation"], ["seguimiento", "analytics.orders.typeFollowUp"]];
var FOLLOW_UP = "seguimiento";
var typeName = (type) => {
  const found = TYPES.find(([key]) => key === type);
  return found ? t(found[1]) : type;
};
var pair = (row) => row?.visitas ? t("analytics.orders.ofTotal", { part: formatNumber(row.con_pedido), total: formatNumber(row.visitas) }) : "—";
function teamHtml(team) {
  if (!team.length) return "";
  return `<div class="tveq"><table class="trtabla"><thead><tr><th>${t("analytics.orders.person")}</th>${TYPES.map(([, label]) => `<th>${t(label)}</th>`).join("")}</tr></thead>
      <tbody>${team.map((member) => `<tr><td>${escapeHtml(member.nombre)}</td>${TYPES.map(([key]) => `<td>${pair(member[key])}</td>`).join("")}</tr>`).join("")}</tbody></table>
      <div class="tvlbl">${t("analytics.orders.teamHint", words())}</div></div>`;
}
function typeRow(row) {
  const share = percent(row.con_pedido, row.visitas);
  return `<div class="tvst"><span>${escapeHtml(typeName(row.tipo))} · ${t("analytics.orders.ofTotal", { part: formatNumber(row.con_pedido), total: formatNumber(row.visitas) })}</span>
      ${bar(Math.max(share, row.con_pedido ? 3 : 0), row.tipo === FOLLOW_UP ? "" : " c")}
      <b>${formatNumber(share)} %</b></div>`;
}
function types(data) {
  const rows = data.tipos ?? [];
  if (!rows.some((row) => row.visitas)) return `<div class="vacio">${t("analytics.orders.noVisits", words())}</div>`;
  const total = sum(rows.map((row) => Number(row.con_pedido) || 0)), fresh = sum(rows.filter((row) => row.tipo !== FOLLOW_UP).map((row) => Number(row.con_pedido) || 0));
  return `<div class="tvgrid"><div class="tvizq"><div class="tvbig">${formatNumber(percent(fresh, total))}<small> %</small></div>
      <div class="tvlbl">${t("analytics.orders.newShare", words())}</div>
      <div class="tvrow">${mini(formatNumber(fresh), t("analytics.orders.newOnes"))}
        ${mini(formatNumber(total - fresh), t("analytics.orders.followUps"))}</div></div>
    <div class="tvfun">${rows.map(typeRow).join("")}
      <div class="tvlbl">${rows.map((row) => t("analytics.orders.typeUnits", { type: escapeHtml(typeName(row.tipo)), units: formatNumber(row.unidades ?? 0) })).join(" · ")}</div></div></div>
    ${teamHtml(data.equipo ?? [])}`;
}

// src/app/screens/analytics/visit-orders/months.ts
var SIDE = 14;
var BOTTOM = 26;
var TOP = 54;
var HEADROOM2 = 1.15;
var monthName = (month) => (/* @__PURE__ */ new Date(`${month}T12:00:00`)).toLocaleDateString("es-ES", { month: "short" }).replace(".", "");
function frameOf(months2) {
  const mobile = isMobile(), width = mobile ? 360 : 680, height = mobile ? 190 : 210, max = Math.max(...months2.map((month) => month.visitas), 1) * HEADROOM2;
  return {
    width,
    height,
    barWidth: (width - 2 * SIDE) / months2.length,
    yVisits: (value) => height - BOTTOM - value / max * (height - TOP),
    yPercent: (value) => height - BOTTOM - value / 100 * (height - TOP)
  };
}
function bars(month, index, frame) {
  const x0 = SIDE + frame.barWidth * index + frame.barWidth * 0.2, width = frame.barWidth * 0.6, base = frame.height - BOTTOM;
  return `<rect x="${x0}" y="${frame.yVisits(month.visitas)}" width="${width}" height="${base - frame.yVisits(month.visitas)}" rx="6" class="tvbv"/>
      <rect x="${x0}" y="${frame.yVisits(month.con_venta)}" width="${width}" height="${base - frame.yVisits(month.con_venta)}" rx="6" class="tvbc"/>
      <text x="${x0 + width / 2}" y="${frame.height - 8}" class="tvtxt tvtxteje" text-anchor="middle">${escapeHtml(monthName(month.mes))}</text>`;
}
function line(months2, frame) {
  const points = months2.map((month, index) => ({ x: SIDE + frame.barWidth * index + frame.barWidth / 2, share: percent(month.con_venta, month.visitas), visits: month.visitas })).filter((point) => point.visits).map((point) => ({ ...point, y: frame.yPercent(point.share) }));
  return `<path d="${points.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ")}" class="tvlinp"/>
    ${points.map((point) => `<circle cx="${point.x}" cy="${point.y}" r="4.5" class="tvpt"/><text x="${point.x}" y="${point.y - 10}" class="tvtxt tvtxtpct" text-anchor="middle">${point.share}%</text>`).join("")}`;
}
function headline2(months2) {
  const last = months2[months2.length - 1], before = months2[months2.length - 2];
  if (!last) return "";
  const share = percent(last.con_venta, last.visitas), previous = before ? percent(before.con_venta, before.visitas) : null;
  const change = previous !== null && before?.visitas ? `<div class="tvmini"><b class="${share >= previous ? "tvok" : "tvmal"}">${t("analytics.orders.pts", { count: `${share >= previous ? "+" : ""}${formatNumber(share - previous)}` })}</b><span class="tvlbl">${t("analytics.orders.versus", { month: escapeHtml(monthName(before.mes)) })}</span></div>` : "";
  return `<div class="tvrow tvrowc"><div class="tvmini"><b>${formatNumber(share)} %</b><span class="tvlbl">${t("analytics.orders.endInOrder", { month: escapeHtml(monthName(last.mes)) })}</span></div>
      ${change}</div>`;
}
function months(data) {
  const list = data.meses ?? [];
  if (!list.some((month) => month.visitas)) return `<div class="vacio">${t("analytics.orders.noRecentVisits", words())}</div>`;
  const frame = frameOf(list);
  return `${headline2(list)}
    <svg class="tvsvg" viewBox="0 0 ${frame.width} ${frame.height}" role="img" aria-label="${t("analytics.orders.monthsLabel")}">
    ${list.map((month, index) => bars(month, index, frame)).join("")}
    ${line(list, frame)}
    </svg><div class="tvley"><span><i class="tvl3"></i>${t("analytics.orders.legendVisits", words())}</span><span><i class="tvl4"></i>${t("analytics.orders.withOrderIn", { days: data.dias ?? DEFAULT_DAYS })}</span><span><i class="tvl5"></i>${t("analytics.orders.shareInOrder")}</span></div>`;
}

// src/app/screens/analytics/visit-orders/index.ts
var STORAGE_KEY = "delcos-tvvista";
var VIEWS = [
  { key: "embudo", label: "analytics.orders.viewFunnel", subtitle: "analytics.orders.subtitleFunnel", paint: funnel },
  { key: "efecto", label: "analytics.orders.viewEffect", subtitle: "analytics.orders.subtitleEffect", paint: effect },
  { key: "meses", label: "analytics.orders.viewMonths", subtitle: "analytics.orders.subtitleMonths", paint: months },
  { key: "tipos", label: "analytics.orders.viewTypes", subtitle: "analytics.orders.subtitleTypes", paint: types }
];
var shown = null;
var viewIndex = 0;
try {
  viewIndex = Math.max(0, VIEWS.findIndex((view) => view.key === localStorage.getItem(STORAGE_KEY)));
} catch {
}
function paint() {
  const body = document.getElementById("tvcuerpo"), view = VIEWS[viewIndex];
  if (!body || !shown || !view) return;
  body.innerHTML = view.paint(shown);
  const subtitle = document.getElementById("tvsub");
  if (subtitle) subtitle.textContent = t(view.subtitle, { ...words(), from: formatShortDate(shown.desde), to: formatShortDate(shown.hasta), days: shown.dias ?? DEFAULT_DAYS });
  const position = document.getElementById("tvpos");
  if (position) position.textContent = t("analytics.orders.position", { number: viewIndex + 1, total: VIEWS.length, name: t(view.label) });
}
function cardHtml(days) {
  const title = t("analytics.orders.title", words());
  const help = t("analytics.orders.help", { ...words(), days });
  return `<section class="card tvcard" id="tvvis"><div class="tvcab">
      <div class="tvtit"><h2>${title} <button type="button" class="ai" data-ayuda-tit="${title}" data-ayuda-txt="${escapeHtml(help)}" aria-label="${t("analytics.orders.whatIsIt")}">i</button></h2>
        <div class="sm" id="tvsub"></div></div>
      <div class="tvnav"><button type="button" class="btn sec chico" data-tvn="-1" aria-label="${t("analytics.orders.previousView")}">‹</button><span class="sm" id="tvpos"></span><button type="button" class="btn sec chico" data-tvn="1" aria-label="${t("analytics.orders.nextView")}">›</button></div>
    </div><div id="tvcuerpo"></div></section>`;
}
function showVisitOrders(data) {
  const box2 = document.getElementById("anareas");
  if (!box2) return;
  document.getElementById("tvvis")?.remove();
  shown = data;
  if (!data?.resumen) return;
  box2.insertAdjacentHTML("afterbegin", cardHtml(data.dias ?? DEFAULT_DAYS));
  paint();
}
function listenToVisitOrdersViews() {
  document.addEventListener("click", (event) => {
    const button = event.target?.closest("#tvvis [data-tvn]");
    if (!button) return;
    viewIndex = (viewIndex + Number(button.dataset.tvn) + VIEWS.length) % VIEWS.length;
    try {
      localStorage.setItem(STORAGE_KEY, VIEWS[viewIndex]?.key ?? "");
    } catch {
    }
    paint();
  });
}

// delcos-shared:src/app/components/index.ts
var shared6 = globalThis["__delcosModules"]["components/index"];
var pick6 = (name) => shared6[name];
var showLoading = /* @__PURE__ */ pick6("showLoading");

// delcos-shared:src/app/screens/home/store.ts
var shared7 = globalThis["__delcosModules"]["screens/home/store"];
var pick7 = (name) => shared7[name];
var homeStore = /* @__PURE__ */ pick7("homeStore");

// src/app/legacy/analytics-bridge.ts
var analyticsLegacy = {
  professional: () => homeStore.analyticsAccount,
  /** The range of a period picker (montarPeriodo). */
  period: (id) => {
    const range2 = Reflect.get(document.getElementById(id) ?? {}, "__rango");
    return typeof range2 === "function" ? range2() : { desde: null, hasta: null };
  },
  loading: (element3, text) => {
    showLoading(element3, text);
  },
  setTableExport: (rows) => {
    Reflect.set(window, "__ANTABLA", rows);
  }
};

// src/app/screens/analytics/filters.ts
var select = (id) => document.getElementById(id);
var valueOf = (id) => select(id)?.value ?? "";
function selectedText(id) {
  const field2 = select(id);
  return field2?.value ? field2.selectedOptions[0]?.textContent ?? "" : "";
}
function filterParams() {
  return {
    p_medico: analyticsLegacy.professional()?.id ?? null,
    p_comercial: valueOf("acom") || null,
    p_producto: valueOf("aprod") || null,
    p_reporting: valueOf("arep") || null,
    p_reportado: valueOf("areprt") || null
  };
}

// src/app/screens/analytics/monthly-table.ts
var LIMIT = 30;
var NAME_WIDTH = 220;
var MONTH_WIDTH = 110;
var TOTAL_WIDTH = 120;
var BASE_SHADE = 0.08;
var SHADE_RANGE = 0.42;
var cell = (width, html, extra = "", style = "") => `<span class="tcell${extra}" style="width:${width}px;min-width:${width}px${width === NAME_WIDTH ? "" : ";text-align:right"}${style}">${html}</span>`;
var valueIn = (row, month) => Number(row.meses?.[month]) || 0;
function monthHeader(month) {
  const name = shortMonthNames()[Number(month.slice(5, 7)) - 1] ?? month.slice(5);
  return `${name} ${month.slice(2, 4)}`;
}
function infoHtml() {
  const dimension = (selectedText("adim") || t("analytics.table.concept")).toLowerCase().replace(/^por /, "");
  const measure = t(valueOf("amedida") === "importe" ? "analytics.table.amount" : "analytics.table.units");
  return `<div class="tabinfo"><b>${t("analytics.table.title", { measure: escapeHtml(measure), dimension: escapeHtml(dimension) })}</b>
    <span>${t("analytics.table.hint", { dimension: escapeHtml(dimension) })}</span></div>`;
}
function tableHtml(data, rows) {
  const months2 = data.meses ?? [], format = (value) => data.medida === "importe" ? formatCurrency(value) : formatNumber(value);
  const max = Math.max(1, ...rows.flatMap((row) => months2.map((month) => valueIn(row, month))));
  const shade = (value) => value ? `;background:rgba(46,134,201,${(BASE_SHADE + value / max * SHADE_RANGE).toFixed(2)})` : "";
  const monthCell = (row, month) => cell(MONTH_WIDTH, row.meses?.[month] ? format(row.meses[month]) : '<span class="sm">·</span>', "", shade(valueIn(row, month)));
  return `<div class="tabla"><div style="min-width:${180 + months2.length * MONTH_WIDTH}px">
    <div class="thead">${cell(NAME_WIDTH, t("analytics.table.concept"), " th")}
      ${months2.map((month) => cell(MONTH_WIDTH, escapeHtml(monthHeader(month)), " th")).join("")}
      ${cell(TOTAL_WIDTH, t("analytics.explore.total"), " th")}</div>
    ${rows.map((row) => `<div class="trow u-cursor-default">
      ${cell(NAME_WIDTH, `<b>${escapeHtml(row.nombre)}</b>`)}
      ${months2.map((month) => monthCell(row, month)).join("")}
      ${cell(TOTAL_WIDTH, `<b>${format(row.total)}</b>`)}</div>`).join("")}
    <div class="trow" data-fijo style="cursor:default;background:var(--bg)">
      ${cell(NAME_WIDTH, `<b>${t("analytics.explore.total")}</b>`)}
      ${months2.map((month) => cell(MONTH_WIDTH, `<b>${format(sum(rows.map((row) => valueIn(row, month))))}</b>`)).join("")}
      ${cell(TOTAL_WIDTH, `<b>${format(sum(rows.map((row) => Number(row.total) || 0)))}</b>`)}</div>
  </div></div>`;
}
function exportRows(data, rows) {
  return rows.map((row) => ({ concepto: row.nombre, ...Object.fromEntries((data.meses ?? []).map((month) => [month, row.meses?.[month] ?? 0])), total: row.total }));
}
function tableParams() {
  const dimension = valueOf("adim");
  return {
    p_dim: dimension === "mes" ? "producto" : dimension,
    p_desde: valueOf("adesde") || null,
    p_hasta: valueOf("ahasta") || null,
    p_canal: valueOf("acanal") || null,
    p_medida: valueOf("amedida") || "unidades",
    lim: LIMIT,
    ...filterParams()
  };
}
async function paintMonthlyTable() {
  const box2 = document.getElementById("atabla2");
  if (!box2) return;
  analyticsLegacy.loading(box2, t("analytics.table.calculating"));
  const { data, error } = await legacyDb().rpc("analitica_tabla", tableParams());
  if (error || !data) {
    box2.innerHTML = `<div class="vacio">${escapeHtml(error?.message ?? "")}</div>`;
    return;
  }
  const rows = data.filas ?? [];
  if (!rows.length) {
    box2.innerHTML = `<div class="vacio">${t("analytics.table.noData")}</div>`;
    return;
  }
  box2.innerHTML = infoHtml() + tableHtml(data, rows);
  analyticsLegacy.setTableExport(exportRows(data, rows));
}

// src/app/screens/analytics/explore.ts
var LIMIT2 = 100;
var SKELETONS = 4;
var BAR_HEIGHT = 84;
var element = (id) => document.getElementById(id);
var measureOf = (row, measure) => Number(row[measure]) || 0;
function totalsHtml(totals) {
  const who = [analyticsLegacy.professional()?.nombre ?? "", selectedText("acom"), selectedText("aprod"), selectedText("arep"), selectedText("areprt")].filter(Boolean).join(" · ");
  return `
    <div class="kpi"><b>${formatNumber(totals.unidades)}</b><span>${t("analytics.explore.units")}${who ? ` · ${escapeHtml(who)}` : ""}</span></div>
    <div class="kpi ok"><b>${formatCurrency(totals.importe)}</b><span>${t("analytics.explore.amount")}</span></div>
    <div class="kpi"><b>${formatNumber(totals.pedidos)}</b><span>${t("analytics.explore.orders")}</span></div>
    <div class="kpi"><b>${formatNumber(totals.medicos)}</b><span>${t("analytics.explore.withSales", { professionals: term("medico", { number: "p", capital: "C" }) })}</span></div>`;
}
function productsHtml(products, totals, dimension) {
  if (!(products.length > 1 || products.length === 1 && dimension !== "producto")) return "";
  return `<div class="dgrid-wrap"><div class="dgrid aprod">
    <div class="dh"><span>${t("analytics.explore.byProduct")}</span><span class="num">${t("analytics.explore.unitsHead")}</span><span class="num">${t("analytics.explore.unitsShare")}</span><span class="num">${t("analytics.explore.amountHead")}</span></div>
    ${products.map((product) => `<div class="dr u-cursor-default"><span><b>${escapeHtml(product.nombre)}</b></span><span class="num">${formatNumber(product.unidades)}</span>
      <span class="num">${Math.round((product.unidades ?? 0) / ((totals.unidades ?? 0) || 1) * 100)}%</span><span class="num">${formatCurrency(product.importe)}</span></div>`).join("")}
  </div></div>`;
}
function seriesHtml(series, measure) {
  if (series.length <= 1) return "";
  const max = Math.max(...series.map((month) => measureOf(month, measure))) || 1;
  return `<div style="display:flex;gap:6px;align-items:flex-end;height:130px">${series.map((month) => `
      <div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:4px">
        <span class="sm">${measure === "importe" ? formatCurrency(month.importe).replace(",00", "") : formatNumber(month.unidades)}</span>
        <div style="width:100%;background:var(--sky);border-radius:6px 6px 0 0;height:${Math.round(measureOf(month, measure) / max * BAR_HEIGHT)}px"></div>
        <span class="sm">${escapeHtml(month.mes.slice(5))}/${escapeHtml(month.mes.slice(2, 4))}</span></div>`).join("")}</div>`;
}
function rankingHtml(rows, totals, measure) {
  if (!rows.length) return `<div class="vacio">${t("analytics.explore.noOrders")}</div>`;
  const total = measureOf(totals, measure) || 1, share = (row) => Math.round(measureOf(row, measure) / total * 100);
  return `<div class="dgrid-wrap"><div class="dgrid arank">
    <div class="dh"><span>#</span><span>${escapeHtml(selectedText("adim"))}</span><span class="num">${t("analytics.explore.unitsHead")}</span>
      <span class="num">${t("analytics.explore.amountHead")}</span><span class="num">${t("analytics.explore.orders")}</span><span>${t("analytics.explore.weight")}</span></div>
    ${rows.map((row, index) => `<div class="dr u-cursor-default"><span class="sm">${index + 1}</span><span><b>${escapeHtml(row.nombre)}</b></span>
      <span class="num">${formatNumber(row.unidades)}</span><span class="num">${formatCurrency(row.importe)}</span><span class="num">${formatNumber(row.pedidos)}</span>
      <span class="barra"><i style="width:${share(row)}%"></i><em>${share(row)}%</em></span></div>`).join("")}
    <div class="dr dtot"><span></span><span><b>${t("analytics.explore.total")}</b></span><span class="num"><b>${formatNumber(totals.unidades)}</b></span>
      <span class="num"><b>${formatCurrency(totals.importe)}</b></span><span class="num"><b>${formatNumber(totals.pedidos)}</b></span><span></span></div>
  </div></div>`;
}
function setHtml(id, html) {
  const box2 = element(id);
  if (box2) box2.innerHTML = html;
}
async function paintRanking() {
  analyticsLegacy.loading(element("atabla"), t("analytics.explore.calculating"));
  setHtml("atot", Array.from({ length: SKELETONS }, () => '<div class="kpi ksk"><div class="skel" style="width:40%;height:24px;margin:2px 0 8px"></div><div class="skel" style="width:70%;margin:0"></div></div>').join(""));
  const range2 = analyticsLegacy.period("aper"), dimension = valueOf("adim"), measure = valueOf("amedida");
  const { data, error } = await legacyDb().rpc("analitica_v2", {
    p_dim: dimension,
    p_desde: range2.desde,
    p_hasta: range2.hasta,
    p_canal: valueOf("acanal") || null,
    ...filterParams(),
    lim: LIMIT2
  });
  if (error || !data) {
    setHtml("atabla", `<div class="vacio">${t("analytics.explore.couldNotCalculate", { error: escapeHtml(error?.message ?? "") })}</div>`);
    setHtml("atot", "");
    return;
  }
  const totals = data.totales ?? {}, rows = [...data.filas ?? []].sort((first, second) => measureOf(second, measure) - measureOf(first, measure));
  setHtml("atot", totalsHtml(totals));
  setHtml("aprods", productsHtml(data.por_producto ?? [], totals, dimension));
  setHtml("aserie", seriesHtml(data.serie ?? [], measure));
  setHtml("atabla", rankingHtml(rows, totals, measure));
}
function refreshExplore() {
  const table = element("atabla2");
  if (currentScreen() !== "analitica" || !element("atabla") || !table) return;
  void paintRanking();
  if (!table.classList.contains("hide")) void paintMonthlyTable();
}

// delcos-shared:src/app/legacy/panels-bridge.ts
var shared8 = globalThis["__delcosModules"]["legacy/panels-bridge"];
var pick8 = (name) => shared8[name];
var panelsLegacy = /* @__PURE__ */ pick8("panelsLegacy");

// delcos-shared:src/app/services/dates.ts
var shared9 = globalThis["__delcosModules"]["services/dates"];
var pick9 = (name) => shared9[name];
var addDays = /* @__PURE__ */ pick9("addDays");
var toIsoDate = /* @__PURE__ */ pick9("toIsoDate");
var todayIso = /* @__PURE__ */ pick9("todayIso");

// delcos-shared:src/app/components/charts/small-charts.ts
var shared10 = globalThis["__delcosModules"]["components/charts/small-charts"];
var pick10 = (name) => shared10[name];
var emptyChart = /* @__PURE__ */ pick10("emptyChart");
var rankingBars = /* @__PURE__ */ pick10("rankingBars");
var shareBars = /* @__PURE__ */ pick10("shareBars");
var sixMonthLine = /* @__PURE__ */ pick10("sixMonthLine");

// delcos-shared:src/app/screens/orders/cards.ts
var shared11 = globalThis["__delcosModules"]["screens/orders/cards"];
var pick11 = (name) => shared11[name];
var countUp = /* @__PURE__ */ pick11("countUp");

// delcos-shared:src/app/screens/routes/title-case.ts
var shared12 = globalThis["__delcosModules"]["screens/routes/title-case"];
var pick12 = (name) => shared12[name];
var titleCase = /* @__PURE__ */ pick12("titleCase");

// delcos-shared:src/app/services/money.ts
var shared13 = globalThis["__delcosModules"]["services/money"];
var pick13 = (name) => shared13[name];
var round2 = /* @__PURE__ */ pick13("round2");

// src/app/screens/analytics/page/catalog.ts
var analyticsState = { config: null };
var AREA_NAMES = /* @__PURE__ */ new Map([
  ["ventas", "panels.families.sales"],
  ["clientes", "panels.families.customers"],
  ["equipo", "panels.families.team"],
  ["oportunidades", "panels.families.opportunities"],
  ["cobros", "panels.families.collections"],
  ["stock", "panels.families.stock"]
]);
var FAMILIES = [
  ["ventas", () => panelsLegacy.canUseModule("ventas")],
  ["clientes", () => panelsLegacy.canUseModule("ventas")],
  ["equipo", () => panelsLegacy.canUseModule("agenda")],
  ["oportunidades", () => panelsLegacy.canUseModule("ventas") && permissions.hasOpportunities()],
  ["cobros", () => panelsLegacy.canUseModule("facturacion")],
  ["stock", () => panelsLegacy.canUseModule("productos") && permissions.levelOf("P") >= 1]
];
var FILTERS_BY_FAMILY = {
  ventas: ["comercial", "producto", "canal", "municipio"],
  clientes: ["comercial", "producto", "canal", "municipio"],
  equipo: ["comercial", "municipio"],
  oportunidades: ["comercial", "producto"],
  cobros: [],
  stock: ["producto"]
};
var familyName = (family) => {
  const key = AREA_NAMES.get(family);
  return key ? t(key, { visits: term("visita", { number: "p" }) }) : family;
};
var familyVisible = (family) => Boolean(FAMILIES.find(([name]) => name === family)?.[1]());
var kpiVisible = (kpi) => familyVisible(kpi.fam) && (!kpi.imp || permissions.canSeeAmounts());
var CATALOGUE = [
  ["importe", "ventas", "eur", true, false, true, true],
  ["unidades", "ventas", "num", true, false, false, true],
  ["pedidos", "ventas", "num", true, false, false, false],
  ["ticket", "ventas", "eur", true, false, true, true],
  ["web_pct", "ventas", "pct", true, false, true, true],
  ["margen", "ventas", "eur", true, false, true, false],
  ["margen_pct", "ventas", "pct", true, false, true, false],
  ["top10_pct", "ventas", "pct", false, false, true, false],
  ["clientes", "clientes", "num", true, false, false, true],
  ["clientes_nuevos", "clientes", "num", true, false, false, false],
  ["repiten_pct", "clientes", "pct", true, false, false, true],
  ["perdidos", "clientes", "num", false, false, false, true],
  ["valor_cliente", "clientes", "eur", true, false, true, false],
  ["visitas", "equipo", "num", true, false, false, false],
  ["visitas_dia", "equipo", "dec", true, false, false, true],
  ["citas_pct", "equipo", "pct", true, false, false, false],
  ["cobertura_pct", "equipo", "pct", true, false, false, true],
  ["activados", "equipo", "num", true, false, false, false],
  ["op_abiertas", "oportunidades", "num", null, false, false, false],
  ["cierre_pct", "oportunidades", "pct", true, false, false, true],
  ["ganado", "oportunidades", "eur", true, false, true, true],
  ["perdido", "oportunidades", "eur", false, false, true, false],
  ["motivo_perdida", "oportunidades", "txt", null, false, false, false],
  ["facturado", "cobros", "eur", true, false, true, false],
  ["pendiente", "cobros", "eur", null, true, true, true],
  ["vencido", "cobros", "eur", false, true, true, true],
  ["dias_cobro", "cobros", "dias", false, false, true, false],
  ["valor_stock", "stock", "eur", null, true, true, true],
  ["bajo_minimo", "stock", "num", false, true, false, true],
  ["caducan", "stock", "num", false, true, false, false],
  ["compras", "stock", "eur", null, false, true, false]
];
var catalogue = () => CATALOGUE.map(([id, fam, fmt, sube, hoy, imp, def]) => ({ id, fam, fmt, sube, hoy, imp, def }));
var textKey = (id) => id.split("_").map((part, index) => index ? part.charAt(0).toUpperCase() + part.slice(1) : part).join("");
var words2 = () => ({
  professionals: term("medico", { number: "p" }),
  Professionals: term("medico", { number: "p", capital: "C" }),
  visit: term("visita"),
  visits: term("visita", { number: "p" }),
  Visits: term("visita", { number: "p", capital: "C" }),
  VisitsRecorded: term("visita", { number: "p", capital: "C", adjective: "registrado" })
});
var kpiTitle = (kpi) => t(`panels.kpiTitles.${textKey(kpi.id)}`, words2());
var kpiHelp = (kpi) => t(`panels.kpiHelp.${textKey(kpi.id)}`, words2());
var defaultSetting = (kpi) => ({ u: kpi.id, id: kpi.id, on: kpi.def, f: {}, comp: "", t: "" });
var defaultSettings = () => catalogue().map(defaultSetting);
function loadConfig() {
  const kpis = catalogue(), saved = panelsLegacy.analyticsPreferences();
  const list = Array.isArray(saved?.kpis) ? saved.kpis.filter((item) => kpis.some((kpi) => kpi.id === item.id)) : [];
  kpis.forEach((kpi) => {
    if (!list.some((item) => item.id === kpi.id)) list.push(defaultSetting(kpi));
  });
  return { comp: saved?.comp ?? "anterior", kpis: list };
}
async function saveConfig(config) {
  const preferences = { ...panelsLegacy.profilePreferences(), analitica: config };
  const { data } = await legacyDb().rpc("guardar_preferencias", { p: preferences });
  panelsLegacy.setProfilePreferences(data ?? preferences);
}
var oneDecimal = (value) => String(Math.round(value * 10) / 10).replace(".", ",");
function formatValue(value, format) {
  if (value === null || value === void 0 || value === "") return "—";
  const number = Number(value);
  switch (format) {
    case "txt":
      return escapeHtml(value);
    case "eur":
      return formatCurrency(round2(number));
    case "pct":
      return `${oneDecimal(number)} %`;
    case "dec":
      return oneDecimal(number);
    case "dias":
      return t("panels.kpis.days", { count: String(Math.round(number)) });
    default:
      return formatNumber(value);
  }
}
function noData(comparison, previous, current, kpi) {
  if (current !== null && current !== void 0 && previous !== null && previous !== void 0 && !(Number(previous) === 0 && kpi.fmt !== "pct")) return null;
  return `<span class="sm">${t(comparison === "anio" ? "panels.kpis.noDataLastYear" : "panels.kpis.noDataPrevious")}</span>`;
}
function changeHtml2(kpi, change, comparison) {
  const lastYear = comparison === "anio";
  if (Math.abs(change) < 0.05) return `<span class="ankdel igual">${t(lastYear ? "panels.kpis.sameLastYear" : "panels.kpis.samePrevious")}</span>`;
  const good = kpi.sube === null ? null : change > 0 === kpi.sube;
  const amount = kpi.fmt === "pct" ? `${oneDecimal(Math.abs(change))} pt` : `${Math.round(Math.abs(change))} %`;
  return `<span class="ankdel ${good === null ? "neutro" : good ? "up" : "down"}">${change > 0 ? "▲" : "▼"} ${amount} <span class="sm">${t(lastYear ? "panels.kpis.vsLastYear" : "panels.kpis.vsPrevious")}</span></span>`;
}
function deltaHtml(kpi, current, previous, comparison) {
  if (kpi.hoy) return `<span class="sm">${t("panels.kpis.asOfToday")}</span>`;
  if (kpi.fmt === "txt") return "";
  const missing = noData(comparison, previous, current, kpi);
  if (missing) return missing;
  const change = kpi.fmt === "pct" ? Number(current) - Number(previous) : (Number(current) - Number(previous)) / Math.abs(Number(previous)) * 100;
  return changeHtml2(kpi, change, comparison);
}
function channelText(channel) {
  const select2 = document.getElementById("acanal");
  return [...select2?.options ?? []].find((option4) => option4.value === channel)?.textContent ?? channel;
}
function filterText(filter) {
  const parts = [];
  if (filter.comercial) parts.push(salesTeam.members().find((member) => member.id === filter.comercial)?.nombre ?? t("panels.kpis.aCommercial"));
  if (filter.producto) parts.push(panelsLegacy.products().find((product) => product.id === filter.producto)?.nombre ?? t("panels.kpis.aProduct"));
  if (filter.canal) parts.push(channelText(filter.canal));
  if (filter.municipio) parts.push(titleCase(filter.municipio));
  return parts.join(" · ");
}

// src/app/screens/analytics/page/gear.ts
var MAX_WIDTH = 320;
var MARGIN = 10;
var GAP = 6;
var option = (value, text, selected) => `<option value="${escapeHtml(value)}" ${selected ? "selected" : ""}>${escapeHtml(text)}</option>`;
var field = (id) => document.getElementById(id);
function filterFields(setting, kpi) {
  const fits = FILTERS_BY_FAMILY[kpi.fam] ?? [], filter = setting.f;
  const channelSelect = document.getElementById("acanal");
  const channels = channelSelect ? [...channelSelect.options].map((item) => option(item.value, item.textContent ?? "", item.value === (filter.canal ?? ""))).join("") : "";
  return `${fits.includes("comercial") && permissions.seesEverything() ? `<label for="ankc">${t("panels.gear.commercial")}</label><select id="ankc">${option("", t("panels.gear.all"), !filter.comercial)}${salesTeam.members().map((member) => option(member.id, member.nombre, member.id === filter.comercial)).join("")}</select>` : ""}
    ${fits.includes("producto") ? `<label for="ankp">${t("panels.gear.product")}</label><select id="ankp">${option("", t("panels.gear.all"), !filter.producto)}${panelsLegacy.products().map((product) => option(product.id, product.nombre, product.id === filter.producto)).join("")}</select>` : ""}
    ${fits.includes("canal") && channels ? `<label for="ankca">${t("panels.gear.channel")}</label><select id="ankca">${channels}</select>` : ""}
    ${fits.includes("municipio") ? `<label for="ankm">${t("panels.gear.municipality")}</label><input id="ankm" autocomplete="off" value="${escapeHtml(filter.municipio ?? "")}" placeholder="${t("panels.gear.all")}">` : ""}
    ${!fits.length ? `<p class="sm">${t("panels.gear.notFiltered")}</p>` : ""}`;
}
function gearHtml(setting, kpi) {
  const title = kpiTitle(kpi);
  return `<div class="agpoph"><b>${escapeHtml(setting.t || title)}</b><button type="button" class="x" aria-label="${t("panels.gear.close")}">✕</button></div>
    <label for="ankn">${t("panels.gear.name")}</label><input id="ankn" autocomplete="off" value="${escapeHtml(setting.t || "")}" placeholder="${escapeHtml(title)}">
    ${filterFields(setting, kpi)}
    ${kpi.hoy ? "" : `<label for="ankcmp">${t("panels.gear.compareWith")}</label><select id="ankcmp">${option("", t("panels.gear.sameAsPanel"), !setting.comp)}${option("anterior", t("panels.gear.previous"), setting.comp === "anterior")}${option("anio", t("panels.gear.lastYear"), setting.comp === "anio")}</select>`}
    <div class="acts ankacts"><button type="button" class="btn sec" id="ankdup">${t("panels.gear.duplicate")}</button><button type="button" class="btn sec" id="ankoff">${t("panels.gear.hide")}</button>
      <button type="button" class="btn" id="ankok">${t("panels.gear.save")}</button></div>`;
}
function place(popover, button) {
  const box2 = button.getBoundingClientRect(), width = Math.min(MAX_WIDTH, innerWidth - 2 * MARGIN);
  popover.style.width = `${width}px`;
  popover.style.left = `${Math.max(MARGIN, Math.min(innerWidth - width - MARGIN, box2.right - width))}px`;
  popover.style.top = `${Math.max(MARGIN, Math.min(innerHeight - popover.offsetHeight - MARGIN, box2.bottom + GAP))}px`;
}
function read() {
  const filter = {};
  const value = (id) => field(id)?.value ?? "";
  if (value("ankc")) filter.comercial = value("ankc");
  if (value("ankp")) filter.producto = value("ankp");
  if (value("ankca")) filter.canal = value("ankca");
  if (value("ankm").trim()) filter.municipio = value("ankm").trim();
  return { f: filter, t: value("ankn").trim(), comp: field("ankcmp") ? value("ankcmp") : "" };
}
function bind(popover, setting, kpi, onSaved) {
  const config = analyticsState.config;
  if (!config) return;
  const done = async () => {
    popover.remove();
    await saveConfig(config);
    onSaved();
  };
  const close = popover.querySelector(".x");
  if (close) close.onclick = () => {
    popover.remove();
  };
  const on = (id, action) => {
    const button = document.getElementById(id);
    if (button) button.onclick = action;
  };
  on("ankok", () => {
    Object.assign(setting, read());
    void done();
  });
  on("ankoff", () => {
    setting.on = false;
    void done();
    notices.toast(t("panels.gear.hidden"));
  });
  on("ankdup", () => {
    const copy = { ...setting, ...read(), u: `${setting.id}-${Date.now().toString(36)}`, on: true };
    if (!copy.t) copy.t = t("panels.gear.copy", { name: kpiTitle(kpi) });
    config.kpis.splice(config.kpis.indexOf(setting) + 1, 0, copy);
    void done();
  });
}
function openGear(button, id, onSaved) {
  document.querySelectorAll(".ankpop").forEach((popover2) => {
    popover2.remove();
  });
  const setting = analyticsState.config?.kpis.find((item) => item.u === id);
  if (!setting) return;
  const kpi = catalogue().find((item) => item.id === setting.id);
  if (!kpi) return;
  const popover = document.createElement("div");
  popover.className = "ankpop";
  Reflect.set(popover, "__t", Date.now());
  popover.innerHTML = gearHtml(setting, kpi);
  document.body.appendChild(popover);
  place(popover, button);
  bind(popover, setting, kpi, onSaved);
}

// src/app/screens/analytics/page/kpis.ts
var YEAR_BACK = -364;
var MONTHS = 6;
var VISIT_DAYS = 30;
var SHORT_MONTHS = t("dates.monthsShort").split(",");
var areas = () => document.getElementById("anareas");
function summaryPeriod() {
  const range2 = analyticsLegacy.period("anper"), to = range2.hasta ?? todayIso();
  return { from: range2.desde ?? addDays(to, YEAR_BACK), to };
}
var ownFilter = (setting, kpi) => {
  const filter = {};
  (FILTERS_BY_FAMILY[kpi.fam] ?? []).forEach((name) => {
    if (setting.f[name]) filter[name] = setting.f[name];
  });
  return filter;
};
function shownKpis() {
  const config = analyticsState.config, kpis = catalogue();
  if (!config) return [];
  return config.kpis.filter((setting) => setting.on).flatMap((setting) => {
    const kpi = kpis.find((item) => item.id === setting.id);
    return kpi && kpiVisible(kpi) ? [{ ...setting, k: kpi, key: JSON.stringify([ownFilter(setting, kpi), setting.comp || config.comp]) }] : [];
  });
}
async function loadFigures(shown2, from, to) {
  const groups = /* @__PURE__ */ new Map();
  shown2.forEach((item) => {
    const group = groups.get(item.key) ?? { f: ownFilter(item, item.k), comp: item.comp || (analyticsState.config?.comp ?? ""), fams: /* @__PURE__ */ new Set() };
    group.fams.add(item.k.fam);
    groups.set(item.key, group);
  });
  const results = await Promise.all([...groups].map(async ([key, group]) => {
    const { data, error } = await legacyDb().rpc("analitica_kpis", { p_desde: from, p_hasta: to, p_filtro: group.f, p_familias: [...group.fams], p_comp: group.comp });
    return [key, error ? { error: error.message ?? "" } : data ?? {}];
  }));
  return Object.fromEntries(results);
}
function cardHtml2(item, figures) {
  const data = figures[item.key] ?? {}, current = data.act?.[item.id], previous = data.ant?.[item.id], filter = filterText(item.f), title = item.t || kpiTitle(item.k);
  return `<div class="ankpi" data-anu="${escapeHtml(item.u)}">
        <div class="ankcab"><span class="anktit">${escapeHtml(title)}</span>
          <button type="button" class="ai" data-ayuda-txt="${escapeHtml(kpiHelp(item.k))}" data-ayuda-tit="${escapeHtml(kpiTitle(item.k))}" aria-label="${t("panels.kpis.whatIs")}">i</button>
          <button type="button" class="ankcfg" data-ancfg="${escapeHtml(item.u)}" title="${t("panels.kpis.adjust")}" aria-label="${escapeHtml(t("panels.kpis.adjustOf", { name: title }))}">${icon("settings")}</button></div>
        <b class="ankval ${item.k.fmt === "txt" ? "txt" : ""}">${data.error ? "—" : formatValue(current, item.k.fmt)}</b>
        ${data.error ? `<span class="sm">${t("panels.kpis.couldNotCalculate")}</span>` : deltaHtml(item.k, current, previous, item.comp || (analyticsState.config?.comp ?? ""))}
        ${filter ? `<span class="ankfil">${escapeHtml(filter)}</span>` : ""}</div>`;
}
function areasHtml(shown2, figures) {
  return FAMILIES.map(([family]) => {
    const items = shown2.filter((item) => item.k.fam === family);
    return items.length ? `<section class="anarea" data-fam="${family}"><h3>${escapeHtml(familyName(family))}</h3>
    <div class="ankgrid">${items.map((item) => cardHtml2(item, figures)).join("")}</div></section>` : "";
  }).join("") || `<div class="vacio">${t("panels.kpis.none")}</div>`;
}
function paintRange(from, to) {
  const summary = document.getElementById("anresumen");
  const comparison = t(analyticsState.config?.comp === "anio" ? "panels.kpis.comparedLastYear" : "panels.kpis.comparedPrevious");
  if (summary) summary.innerHTML = `${t("panels.kpis.range", { from: formatShortDate(from), to: formatShortDate(to), comparison })}<button type="button" class="kcfg" id="ancambiar">${t("panels.kpis.change")}</button>`;
  const change = document.getElementById("ancambiar");
  if (change) change.onclick = () => {
    const button = document.querySelector("#v-analitica .htbtn");
    if (button) {
      button.click();
      button.scrollIntoView({ block: "nearest" });
    }
  };
}
function lastMonths(to) {
  return range(MONTHS).map((index) => {
    const date = /* @__PURE__ */ new Date(`${to}T12:00:00`);
    date.setDate(1);
    date.setMonth(date.getMonth() - (MONTHS - 1) + index);
    const first = toIsoDate(date);
    date.setMonth(date.getMonth() + 1);
    date.setDate(0);
    const last = toIsoDate(date);
    return [first, last > to ? to : last];
  });
}
async function seriesOf(months2, filter, families) {
  const cache = panelsLegacy.seriesCache(), key = JSON.stringify([months2[0]?.[0], months2[MONTHS - 1]?.[1], filter, families, panelsLegacy.reportFilter()]);
  if (!cache.has(key)) cache.set(key, Promise.all(months2.map(([from, to]) => Promise.resolve(legacyDb().rpc("analitica_kpis_periodo", { p_desde: from, p_hasta: to, p_filtro: filter, p_familias: families, p_estado: false })).then((result) => result.error ? {} : result.data ?? {}, () => ({})))));
  const series = await cache.get(key);
  if (series.every((item) => !Object.keys(item).length)) cache.delete(key);
  return series;
}
function countFigures(cards) {
  const numbers = [];
  cards.forEach(({ el, k }) => {
    el.classList.add("anv");
    const value = el.querySelector(".ankval");
    if (!value || k.fmt === "txt") return;
    const text = value.textContent ?? "", match = /-?[\d.]+(,\d+)?/.exec(text);
    if (!match) return;
    value.dataset.v = String(parseFloat(match[0].replace(/\./g, "").replace(",", ".")));
    value.dataset.f = text;
    value.dataset.dec = String(match[1] ? match[1].length - 1 : 0);
    numbers.push(value);
  });
  countUp(numbers, (number, element3) => (element3.dataset.f ?? "").replace(/-?[\d.]+(,\d+)?/, number.toLocaleString("es-ES", { minimumFractionDigits: Number(element3.dataset.dec), maximumFractionDigits: Number(element3.dataset.dec) })));
}
function drawLine(card2, series, months2) {
  const zone = card2.el.querySelector(".avz");
  if (!zone) return;
  const values = series.map((item) => Number(item[card2.x.id]) || 0);
  zone.innerHTML = sixMonthLine(values, months2);
  if (values.every((value) => !value)) {
    zone.classList.add("avcero");
    zone.title = t("panels.kpis.noDataSixMonths");
    return;
  }
  zone.title = months2.map(([first], index) => `${SHORT_MONTHS[Number(first.slice(5, 7)) - 1] ?? ""}: ${formatValue(values[index], card2.k.fmt).replace(/<[^>]+>/g, "")}`).join(" · ");
}
async function drawLines(cards, request) {
  const today = todayIso(), range2 = analyticsLegacy.period("anper"), to = !range2.hasta || range2.hasta > today ? today : range2.hasta, months2 = lastMonths(to);
  const withLine = cards.filter(({ k }) => !k.hoy && k.fmt !== "txt");
  withLine.forEach(({ el }) => {
    el.insertAdjacentHTML("beforeend", '<div class="avz" aria-hidden="true"></div>');
  });
  const groups = /* @__PURE__ */ new Map();
  withLine.forEach((card2) => {
    const filter = ownFilter(card2.x, card2.k), key = JSON.stringify(filter), group = groups.get(key) ?? { f: filter, fams: /* @__PURE__ */ new Set(), cards: [] };
    group.fams.add(card2.k.fam);
    group.cards.push(card2);
    groups.set(key, group);
  });
  await Promise.all([...groups.values()].map(async (group) => {
    const series = await seriesOf(months2, group.f, [...group.fams].sort());
    if (areas()?.dataset.pedido !== request) return;
    group.cards.forEach((card2) => {
      drawLine(card2, series, months2);
    });
  }));
}
async function paintKpis() {
  const box2 = areas();
  if (!box2 || !analyticsState.config || !document.getElementById("anper")) return;
  const { from, to } = summaryPeriod(), shown2 = shownKpis(), request = String(Date.now());
  box2.dataset.pedido = request;
  const figures = await loadFigures(shown2, from, to);
  if (areas()?.dataset.pedido !== request) return;
  box2.innerHTML = areasHtml(shown2, figures);
  box2.querySelectorAll("[data-ancfg]").forEach((button) => {
    button.onclick = (event) => {
      event.stopPropagation();
      openGear(button, button.dataset.ancfg ?? "", () => {
        void loadKpis();
      });
    };
  });
  paintRange(from, to);
  const kpis = catalogue(), cards = [...box2.querySelectorAll(".ankpi[data-anu]")].flatMap((el) => {
    const setting = analyticsState.config?.kpis.find((item) => item.u === el.dataset.anu), kpi = setting ? kpis.find((item) => item.id === setting.id) : void 0;
    return setting && kpi ? [{ el, x: setting, k: kpi }] : [];
  });
  countFigures(cards);
  await drawLines(cards, request);
}
async function loadKpis() {
  const range2 = document.getElementById("anper") ? analyticsLegacy.period("anper") : null;
  const visits = range2 ? Promise.resolve(callRpc("ventas_tras_visita", { p_desde: range2.desde ?? null, p_hasta: range2.hasta ?? null, p_dias: VISIT_DAYS })).then((result) => result.data ?? null, () => null) : null;
  await paintKpis();
  const data = visits ? await visits : null;
  if (currentScreen() === "analitica") showVisitOrders(data);
}

// src/app/screens/analytics/page/customise.ts
var dialog = () => document.getElementById("dlg");
var markChanged = () => {
  const box2 = dialog();
  if (box2) box2.dataset.sucio = "1";
};
function rowHtml(setting, index, kpi) {
  const filter = filterText(setting.f);
  return `<label class="anpf"><span class="vfswitch mini"><input type="checkbox" data-anon="${index}" ${setting.on ? "checked" : ""}><span class="sw"></span></span>
            <span class="tx"><b>${escapeHtml(setting.t || kpiTitle(kpi))}</b><span class="sm">${escapeHtml(filter || kpiHelp(kpi))}</span></span>
            ${setting.u !== setting.id ? `<button type="button" class="x" data-andel="${index}" title="${t("panels.customise.deleteCopy")}" aria-label="${t("panels.customise.deleteCopy")}">✕</button>` : ""}</label>`;
}
function areaHtml(family, draft, kpis) {
  const rows = draft.map((setting, index) => [setting, index]).map(([setting, index]) => {
    const kpi = kpis.find((item) => item.id === setting.id);
    return kpi && kpi.fam === family && kpiVisible(kpi) ? rowHtml(setting, index, kpi) : "";
  }).join("");
  return `<div class="blk anpers"><h3>${escapeHtml(familyName(family))}</h3>
        ${rows}</div>`;
}
function paint2(draft, kpis, onSaved) {
  const body = document.getElementById("dbody");
  if (!body) return;
  body.innerHTML = `<div class="fh"><div><h2>${t("panels.customise.title")}</h2>
        <div class="sm">${t("panels.customise.subtitle")}</div></div>
        <button class="x" data-cerrar aria-label="${t("panels.customise.close")}">✕</button></div>
      ${FAMILIES.filter(([family]) => familyVisible(family)).map(([family]) => areaHtml(family, draft, kpis)).join("")}
      <div class="acts u-end"><button class="btn sec" id="anres0">${t("panels.customise.reset")}</button><button class="btn" id="anpok">${t("panels.customise.save")}</button></div>`;
  body.querySelectorAll("[data-anon]").forEach((box2) => {
    box2.onchange = () => {
      const setting = draft[Number(box2.dataset.anon)];
      if (setting) setting.on = box2.checked;
      markChanged();
    };
  });
  body.querySelectorAll("[data-andel]").forEach((button) => {
    button.onclick = (event) => {
      event.preventDefault();
      draft.splice(Number(button.dataset.andel), 1);
      markChanged();
      paint2(draft, kpis, onSaved);
    };
  });
  const reset = document.getElementById("anres0");
  if (reset) reset.onclick = () => {
    draft.splice(0, draft.length, ...defaultSettings());
    markChanged();
    paint2(draft, kpis, onSaved);
  };
  const ok = document.getElementById("anpok");
  if (ok) ok.onclick = async () => {
    ok.disabled = true;
    const config = analyticsState.config ?? loadConfig();
    config.kpis = draft;
    analyticsState.config = config;
    await saveConfig(config);
    const box2 = dialog();
    if (box2) {
      delete box2.dataset.sucio;
      box2.close();
    }
    onSaved();
  };
}
function customise(onSaved) {
  analyticsState.config = analyticsState.config ?? loadConfig();
  const draft = analyticsState.config.kpis.map((setting) => ({ ...setting }));
  paint2(draft, catalogue(), onSaved);
  dialog()?.showModal();
}

// delcos-shared:src/app/components/filters-panel/counter.ts
var shared14 = globalThis["__delcosModules"]["components/filters-panel/counter"];
var pick14 = (name) => shared14[name];
var counter = /* @__PURE__ */ pick14("counter");

// delcos-shared:src/app/components/filters-panel/prepare.ts
var shared15 = globalThis["__delcosModules"]["components/filters-panel/prepare"];
var pick15 = (name) => shared15[name];
var prepare = /* @__PURE__ */ pick15("prepare");

// delcos-shared:src/app/components/loading.ts
var shared16 = globalThis["__delcosModules"]["components/loading"];
var pick16 = (name) => shared16[name];
var cardSkeleton = /* @__PURE__ */ pick16("cardSkeleton");

// delcos-shared:src/app/components/charts/month-bars.ts
var shared17 = globalThis["__delcosModules"]["components/charts/month-bars"];
var pick17 = (name) => shared17[name];
var monthBars = /* @__PURE__ */ pick17("monthBars");

// src/app/screens/analytics/page/charts.ts
var SKELETONS2 = 4;
var TOP2 = 10;
var PRODUCTS = 20;
var MIN_BAR = 3;
var box = () => document.getElementById("angraf");
var percent2 = (part, whole) => whole ? Math.round(part / whole * 100) : 0;
var words3 = () => ({
  professionals: term("medico", { number: "p" }),
  Professionals: term("medico", { number: "p", capital: "C" }),
  visits: term("visita", { number: "p" }),
  theVisits: term("visita", { number: "p", article: "el" }),
  theVisitsRecorded: term("visita", { number: "p", article: "el", adjective: "registrado" })
});
async function load(from, to) {
  const db = legacyDb();
  const [sales, top, activity, funnel2] = await Promise.all([
    db.rpc("analitica_v2", { p_dim: "producto", p_desde: from, p_hasta: to, lim: PRODUCTS }).then((result) => result.data ?? {}),
    db.rpc("analitica_v2", { p_dim: "medico", p_desde: from, p_hasta: to, lim: TOP2 }).then((result) => result.data?.filas ?? []),
    db.rpc("actividad_mensual", { p_desde: from, p_hasta: to }).then((result) => result.data ?? []),
    db.rpc("embudo_comercial").then((result) => result.data ?? {})
  ]);
  return { sales, top, activity, funnel: funnel2 };
}
var card = (title, body, read2, wide = false) => `<div class="card ancard${wide ? " ancha" : ""}"><h2>${title}</h2>
      ${body}
      <p class="leer">${read2}</p></div>`;
function salesCards(charts, months2, bySales) {
  const units = charts.sales.totales?.unidades ?? 0, products = charts.sales.por_producto ?? [], top = charts.top.filter((row) => row.clave !== "sin");
  const amounts = permissions.canSeeAmounts() ? months2.map((month) => Number(bySales.get(month)?.importe ?? 0)) : null;
  return card(t("panels.charts.salesTrend"), units ? monthBars(months2, months2.map((month) => bySales.get(month)?.unidades ?? 0), amounts, t("panels.charts.salesSeries").split(",")) : emptyChart(t("panels.charts.salesEmpty")), t("panels.charts.salesRead"), true) + card(t("panels.charts.byProduct"), products.length ? shareBars(products.map((row) => ({ n: row.nombre, v: Number(row.unidades) || 0 }))) : emptyChart(t("panels.charts.byProductEmpty")), t("panels.charts.byProductRead")) + card(t("panels.charts.topProfessionals", words3()), top.length ? rankingBars(top.map((row) => ({ n: row.nombre, v: row.unidades })), formatNumber) : emptyChart(t("panels.charts.topEmpty", words3())), t("panels.charts.topRead", words3()));
}
function funnelHtml(funnel2) {
  const order = commercialStates.all().filter((state) => state.papel !== "negativo").map((state) => state.valor), negative = panelsLegacy.stateWithRole("negativo");
  const total = order.reduce((sum2, state) => sum2 + (Number(funnel2[state]) || 0), 0);
  if (!total) return emptyChart(t("panels.charts.funnelEmpty", words3()));
  const rows = order.map((state, index) => {
    const value = Number(funnel2[state]) || 0, before = index ? Number(funnel2[order[index - 1] ?? ""]) || 0 : 0;
    return `<div class="emb"><span class="embn">${escapeHtml(state)}</span><span class="embb"><i style="width:${Math.max(MIN_BAR, value / total * 100)}%"></i></span><b>${formatNumber(value)}</b>
          ${index ? `<span class="sm">${before ? t("panels.charts.advances", { percent: percent2(value, before + value) }) : ""}</span>` : '<span class="sm"></span>'}</div>`;
  }).join("");
  return `<div class="embudo">${rows}
        ${negative && funnel2[negative] ? `<div class="sm u-mt-6">${escapeHtml(negative)}: ${formatNumber(funnel2[negative])}</div>` : ""}</div>`;
}
function chartsHtml(charts, from, to) {
  const months2 = panelsLegacy.monthsBetween(from, to);
  const bySales = new Map((charts.sales.serie ?? []).map((month) => [month.mes, month])), byActivity = new Map(charts.activity.map((month) => [month.mes, month]));
  const units = charts.sales.totales?.unidades ?? 0;
  const activity = charts.activity.length || units ? monthBars(months2, months2.map((month) => byActivity.get(month)?.visitas ?? 0), months2.map((month) => bySales.get(month)?.unidades ?? 0), [term("visita", { number: "p", capital: "C" }), t("panels.charts.unitsSold")]) : emptyChart(t("panels.charts.activityEmpty", words3()));
  return `
    ${panelsLegacy.canUseModule("ventas") ? salesCards(charts, months2, bySales) : ""}
    ${card(t("panels.charts.funnel"), funnelHtml(charts.funnel), t("panels.charts.funnelRead", words3()))}
    ${card(t("panels.charts.activity"), activity, t("panels.charts.activityRead", words3()), true)}`;
}
async function paintCharts(from, to) {
  const element3 = box();
  if (!element3) return;
  element3.innerHTML = Array.from({ length: SKELETONS2 }, () => `<div class="card">${cardSkeleton(t("panels.charts.loading"))}</div>`).join("");
  const charts = await load(from, to);
  const target = box();
  if (!target) return;
  target.innerHTML = chartsHtml(charts, from, to);
}

// src/app/screens/analytics/page/summary.ts
var SKELETON_CARDS = 4;
function moveFilters() {
  const view = document.getElementById("v-analitica");
  if (!view) return;
  prepare(view);
  const target = view.querySelector(".htpanel .htpropios");
  if (!target) return;
  [["#anfil", "resumen"], ["#v-analitica .panel > .filtros", "explorar"]].forEach(([selector, tab]) => {
    const source = document.querySelector(selector);
    if (!source) return;
    [...source.children].forEach((child) => {
      if (child.matches("input[type=search],input[type=text]") || child.querySelector("input[type=search],input[type=text], #adim, #amedida")) return;
      child.dataset.anp = tab;
      target.appendChild(child);
    });
    source.dataset.ht = "1";
    if (!source.children.length) source.classList.add("hide");
  });
  target.querySelectorAll("select").forEach((select2) => {
    if (!select2.dataset.anht) {
      select2.dataset.anht = "1";
      select2.addEventListener("change", () => {
        counter(view);
      });
    }
  });
}
function markTab() {
  const view = document.getElementById("v-analitica");
  if (!view) return;
  const explore = panelsLegacy.section() === "explorar";
  view.classList.toggle("an-exp", explore);
  view.classList.toggle("an-res", !explore);
  const tools = document.getElementById("tools");
  if (tools) tools.dataset.ansec = explore ? "explorar" : "resumen";
  moveFilters();
  const customiseButton = document.getElementById("anpers");
  if (customiseButton) customiseButton.hidden = explore;
}
var option2 = (value, text, selected) => `<option value="${value}" ${selected ? "selected" : ""}>${text}</option>`;
function summaryHtml(comparison) {
  const report = panelsLegacy.reportFilter();
  return `<div class="filtros" id="anfil"><div id="anper" data-anp="resumen"></div>
      <div data-anp="resumen"><label for="ancomp">${t("panels.analytics.compareWith")}</label><select id="ancomp">
        ${option2("anterior", t("panels.analytics.previousPeriod"), comparison === "anterior")}
        ${option2("anio", t("panels.analytics.lastYear"), comparison === "anio")}</select></div>
      ${permissions.seesEverything() ? `<div data-anp="resumen"><label for="anrep">${t("panels.analytics.report")}</label><select id="anrep">${option2("", t("panels.analytics.all"), false)}${option2("si", t("panels.analytics.reported"), report === "si")}${option2("no", t("panels.analytics.notReported"), report === "no")}</select></div>` : ""}</div>
    <p class="sm anresumen" id="anresumen"></p>
    <div id="ankpis" hidden></div>
    <div id="anareas"><div class="ankgrid">${Array.from({ length: SKELETON_CARDS }, () => '<div class="ankpi"><div class="skel" style="width:60%"></div><div class="skel" style="width:40%;height:24px"></div></div>').join("")}</div></div>
    <div class="angrid" id="angraf"></div>`;
}
function paintFigures() {
  const { from, to } = summaryPeriod();
  void loadKpis();
  void paintCharts(from, to);
}
function bindSummary() {
  panelsLegacy.mountPeriod(document.getElementById("anper"), { id: "analitica-resumen", valor: "anio", alCambiar: paintFigures });
  const comparison = document.getElementById("ancomp");
  if (comparison) comparison.onchange = async () => {
    const config = analyticsState.config;
    if (!config) return;
    config.comp = comparison.value;
    await saveConfig(config);
    void loadKpis();
  };
  const report = document.getElementById("anrep");
  if (report) report.onchange = () => {
    panelsLegacy.setReportFilter(report.value);
    void loadKpis();
  };
}
async function paintSummary() {
  const body = document.getElementById("anres");
  if (!body) return;
  if (!salesTeam.members().length && permissions.seesEverything()) await salesTeam.load();
  analyticsState.config = loadConfig();
  document.querySelectorAll('#v-analitica .htpropios [data-anp="resumen"]').forEach((item) => {
    item.remove();
  });
  body.innerHTML = summaryHtml(analyticsState.config.comp);
  bindSummary();
  paintFigures();
  moveFilters();
}

// src/app/screens/analytics/page/page.ts
var SELECTS = ["adim", "acanal", "amedida", "aprod", "acom", "arep", "areprt"];
var element2 = (id) => document.getElementById(id);
var option3 = (value, text) => `<option value="${value}">${text}</option>`;
function filtersHtml() {
  const all = permissions.seesEverything();
  return `<div id="aper"></div>
        <div><label for="adim">${t("panels.analytics.viewBy")}</label><select id="adim">
          ${option3("medico", term("medico", { capital: "C" }))}${option3("comercial", t("panels.analytics.commercial"))}
          ${option3("producto", t("panels.analytics.product"))}${option3("municipio", t("panels.analytics.municipality"))}
          ${option3("mes", t("panels.analytics.month"))}${option3("canal", t("panels.analytics.channel"))}</select></div>
        <div><label for="amedida">${t("panels.analytics.sortBy")}</label><select id="amedida">
          ${option3("unidades", t("panels.analytics.units"))}${option3("importe", t("panels.analytics.amount"))}</select></div>
        <div><label for="acanal">${t("panels.analytics.channel")}</label><select id="acanal">
          ${option3("", t("panels.analytics.all"))}${option3("paciente", t("panels.analytics.toCustomer", { toPatient: term("paciente", { article: "al" }) }))}
          ${option3("centro", t("panels.analytics.toCentre"))}</select></div>
        <div><label for="aprod">${t("panels.analytics.product")}</label><select id="aprod">${option3("", t("panels.analytics.all"))}
          ${panelsLegacy.products().map((product) => `<option value="${product.id}">${escapeHtml(product.nombre)}</option>`).join("")}</select></div>
        <div><label for="arep">${t("panels.analytics.reporting")}</label><select id="arep">${option3("", t("panels.analytics.allProfessionals", { theProfessionals: term("medico", { number: "p", article: "el" }) }))}
          ${option3("con", t("panels.analytics.withReporting"))}${option3("sin", t("panels.analytics.withoutReporting"))}</select></div>
        ${all ? `<div><label for="areprt">${t("panels.analytics.report")}</label><select id="areprt">${option3("", t("panels.analytics.all"))}${option3("si", t("panels.analytics.reported"))}${option3("no", t("panels.analytics.notReported"))}</select></div>` : ""}
        ${all ? `<div><label for="acom">${t("panels.analytics.commercial")}</label><select id="acom">${option3("", t("panels.analytics.all"))}
          ${salesTeam.members().map((member) => `<option value="${member.id}">${escapeHtml(member.nombre)}</option>`).join("")}</select></div>` : ""}
        <div style="grid-column:span 2"><label>${term("medico", { capital: "C" })}</label><div id="amed"></div></div>
        <input type="hidden" id="adesde"><input type="hidden" id="ahasta">`;
}
function pageHtml() {
  return `
    <div class="saludo"><div><h1>${t("panels.analytics.title")}</h1><div class="fecha">${t("panels.analytics.subtitle", { professional: term("medico") })}</div></div></div>
    <div class="panel">
      <div class="filtros">
        ${filtersHtml()}
      </div>
      <div class="kpis vtot" id="atot"></div>
      <div id="aprods"></div>
      <div class="subnav"><button data-avista="rank" aria-pressed="true">${t("panels.analytics.ranking")}</button>
        <button data-avista="tabla" aria-pressed="false">${t("panels.analytics.monthlyTable")}</button></div>
      <div id="aserie" style="padding:14px"></div>
      <div id="atabla"></div>
      <div id="atabla2" class="hide"></div>
    </div>`;
}
function syncPeriod() {
  const range2 = Reflect.get(element2("aper") ?? {}, "__rango");
  const chosen = range2 ? range2() : {};
  const from = element2("adesde"), to = element2("ahasta");
  if (from) from.value = chosen.desde ?? "";
  if (to) to.value = chosen.hasta ?? "";
}
function bindExplore(view) {
  panelsLegacy.mountPeriod(element2("aper"), { id: "analitica", valor: "anio", alCambiar: () => {
    syncPeriod();
    refreshExplore();
  } });
  syncPeriod();
  panelsLegacy.pickProfessional(element2("amed"), {
    value: panelsLegacy.professional(),
    placeholder: t("panels.analytics.professionalPlaceholder", { aProfessional: term("medico", { article: "un" }) }),
    onPick: (account) => {
      panelsLegacy.setProfessional(account);
      refreshExplore();
    }
  });
  SELECTS.forEach((id) => {
    const select2 = element2(id);
    if (select2) select2.onchange = () => {
      refreshExplore();
    };
  });
  view.querySelectorAll("[data-avista]").forEach((button) => {
    button.onclick = () => {
      const table = button.dataset.avista === "tabla";
      view.querySelectorAll("[data-avista]").forEach((other) => {
        other.setAttribute("aria-pressed", String(other === button));
      });
      element2("atabla")?.classList.toggle("hide", table);
      element2("aserie")?.classList.toggle("hide", table);
      element2("atabla2")?.classList.toggle("hide", !table);
      if (table) void paintMonthlyTable();
    };
  });
}
function addTabs(view, panel) {
  const section = panelsLegacy.section();
  view.querySelector(".saludo")?.insertAdjacentHTML("afterend", `<div class="subnav" id="ansub">
    <button data-ansec="resumen" aria-pressed="${String(section === "resumen")}">${t("panels.analytics.summary")}</button>
    <button data-ansec="explorar" aria-pressed="${String(section === "explorar")}">${t("panels.analytics.explore")}</button></div>
    <div id="anres" class="${section === "resumen" ? "" : "hide"}"></div>`);
  panel.classList.toggle("hide", section === "resumen");
  view.querySelectorAll("[data-ansec]").forEach((button) => {
    button.onclick = () => {
      panelsLegacy.setSection(button.dataset.ansec ?? "resumen");
      const summary = panelsLegacy.section() === "resumen";
      view.querySelectorAll("[data-ansec]").forEach((other) => {
        other.setAttribute("aria-pressed", String(other === button));
      });
      element2("anres")?.classList.toggle("hide", !summary);
      panel.classList.toggle("hide", summary);
      if (summary && !element2("ankpis")) void paintSummary();
      setTimeout(markTab, 0);
    };
  });
}
function keepInView(panel) {
  const filters = panel.querySelector(":scope > .filtros");
  if (!filters || element2("anvista")) return;
  filters.insertAdjacentHTML("afterend", '<div class="anvista" id="anvista"></div>');
  const place2 = element2("anvista");
  ["adim", "amedida"].forEach((id) => {
    const holder = element2(id)?.closest(".filtros > div") ?? element2(id)?.closest(".htpropios > div");
    if (holder && place2) {
      delete holder.dataset.anp;
      place2.appendChild(holder);
    }
  });
  [...filters.children].forEach((child) => {
    child.dataset.anp = "explorar";
  });
}
function addCustomise(view) {
  const greeting = view.querySelector(".saludo");
  const subtitle = greeting?.querySelector(".fecha");
  if (subtitle) subtitle.textContent = t("panels.analytics.summarySubtitle");
  if (!greeting || element2("anpers")) return;
  let acts = greeting.querySelector(":scope > .acts");
  if (!acts) {
    greeting.insertAdjacentHTML("beforeend", '<div class="acts"></div>');
    acts = greeting.querySelector(":scope > .acts");
  }
  acts?.insertAdjacentHTML("afterbegin", `<button type="button" class="btn sec" id="anpers">${t("panels.analytics.customise")}</button>`);
  const button = element2("anpers");
  if (button) button.onclick = () => {
    analyticsState.config = analyticsState.config ?? loadConfig();
    customise(() => {
      void loadKpis();
    });
  };
}
async function loadAnalytics() {
  if (!salesTeam.members().length && permissions.seesEverything()) await salesTeam.load();
  await panelsLegacy.loadProducts();
  const view = element2("v-analitica");
  if (!view) return;
  view.innerHTML = pageHtml();
  bindExplore(view);
  void paintRanking();
  const panel = view.querySelector(".panel");
  if (!panel) return;
  addTabs(view, panel);
  if (panelsLegacy.section() === "resumen") await paintSummary();
  keepInView(panel);
  addCustomise(view);
  markTab();
}

// src/app/screens/analytics/chunk.ts
listenToVisitOrdersViews();
export {
  loadAnalytics,
  loadKpis,
  paintMonthlyTable,
  paintRanking,
  paintSummary,
  refreshExplore,
  showVisitOrders
};
