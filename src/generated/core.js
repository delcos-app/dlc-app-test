(() => {
  var __defProp = Object.defineProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // src/app/core/router.ts
  var MAX_REDIRECTS = 10;
  function createRouter(fallbackRoute) {
    const routes = /* @__PURE__ */ new Map();
    const redirects = [];
    const hooks = [];
    let current = null;
    function resolve(target, context) {
      let resolved = target;
      for (let hops = 0; hops < MAX_REDIRECTS; hops++) {
        const next = redirects.map((redirect) => redirect(resolved, context)).find((id) => id !== void 0 && id !== resolved);
        if (next === void 0) break;
        resolved = next;
      }
      const route = routes.get(resolved);
      return route && (route.canEnter?.() ?? true) ? resolved : fallbackRoute;
    }
    async function navigate2(target, ...params) {
      const context = { from: current, params };
      const routeId = resolve(target, context);
      const route = routes.get(routeId);
      if (!route) throw new Error(`Unknown route: ${routeId}`);
      current = routeId;
      await route.enter(context);
      hooks.forEach((hook) => {
        hook(routeId, context);
      });
      return routeId;
    }
    return {
      register: (route) => {
        routes.set(route.id, route);
      },
      addRedirect: (redirect) => {
        redirects.push(redirect);
      },
      onNavigate: (hook) => {
        hooks.push(hook);
      },
      navigate: navigate2,
      get current() {
        return current;
      }
    };
  }

  // src/app/core/navigation/pipeline.ts
  function runBefores(steps, navigation) {
    const passed = [];
    for (const step of steps) {
      step.before?.(navigation);
      passed.push({ step, target: navigation.target });
      if (navigation.blocked) break;
    }
    return passed;
  }
  function runNavigation(steps, switchScreen, target, args) {
    const navigation = { target, args, blocked: false };
    let passed = [];
    try {
      passed = runBefores(steps, navigation);
      if (!navigation.blocked) switchScreen(navigation.target, args);
      for (const { step, target: seen } of [...passed].reverse()) step.after?.(seen, args);
    } finally {
      for (const { step, target: seen } of [...passed].reverse()) step.cleanup?.(seen);
    }
  }

  // src/app/services/values.ts
  function orFallback(value2, fallback) {
    return value2 === void 0 || value2 === null || value2 === "" ? fallback : value2;
  }
  function nonZeroOr(value2, fallback) {
    return value2 === void 0 || value2 === null || value2 === 0 || Number.isNaN(value2) ? fallback : value2;
  }
  var range = (length) => [...Array(length).keys()];
  var sum = (values) => values.reduce((total, value2) => total + value2, 0);
  var isPresent = (value2) => value2 !== null && value2 !== void 0;

  // src/app/core/navigation/steps-outer.ts
  var PORTAL_SCREENS = ["informe", "config", "perfil"];
  var PLATFORM_SCREENS = ["delcos", "config", "perfil", "manual"];
  var safely = (action) => {
    try {
      action();
    } catch {
    }
  };
  var later = (delays, action) => {
    delays.forEach((delay) => {
      setTimeout(() => {
        safely(action);
      }, delay);
    });
  };
  var resetBackStack = {
    name: "v2.300 · a new navigation empties the «Volver» stack",
    before: () => {
      VUELTA.length = 0;
      VISTA = null;
    }
  };
  var professionalPortalOnly = {
    name: "v2.271 · the professional (and centre) portal only opens its own screens",
    before: (nav) => {
      if (ES_MEDICO() && !PORTAL_SCREENS.includes(nav.target)) nav.target = "informe";
    }
  };
  var loadingComet = {
    name: "v2.267 · the loading line at the top when the screen changes",
    before: (nav) => {
      if (nav.target && nav.target !== TAB) safely(cometa);
    }
  };
  var watchListPage = {
    name: "v2.239 · list pages (PL) keep their layout in sync",
    after: (target) => {
      if (PL[target]) {
        plVigilar(target);
        setTimeout(() => {
          plVigilar(target);
        }, 0);
      }
    }
  };
  var customMenuNames = {
    name: "v2.231 · menu names chosen by the company",
    after: () => {
      setTimeout(() => {
        safely(aplicarNombresMenu);
      }, 0);
      queueMicrotask(() => {
        safely(aplicarNombresMenu);
      });
    }
  };
  var rememberManualReturn = {
    name: "v2.224 · entering the manual remembers where to come back to",
    before: (nav) => {
      if (nav.target === "manual" && TAB !== "manual") MANUAL_VUELTA = { tab: TAB, y: window.scrollY || 0 };
    }
  };
  var NAVIGATION_START_EVENT = "delcos:navigation-start";
  var announceNavigation = {
    name: "v2.221 · tell listeners a navigation starts (the mobile «+» comes back into view)",
    before: (nav) => {
      document.dispatchEvent(new CustomEvent(NAVIGATION_START_EVENT, { detail: { target: nav.target } }));
    }
  };
  function configKey(target) {
    if (target === "config") return claveCfgVieja(CFG_SEC, CFG_SUB);
    if (target === "perfil") return PAG_TAB.perfil === "notif" ? "notif" : "datos";
    if (target === "organizacion" || target === "empresa") return `o.${orFallback(PAG_TAB[target], "marca")}`;
    if (target === "plan") return "o.plan";
    if (target === "usuarios") return PAG_TAB.usuarios === "roles" ? "roles" : "usuarios";
    return null;
  }
  var singleConfiguration = {
    name: "v2.215/v2.340 · profile, company, plan and users are parts of the single Configuración page",
    before: (nav) => {
      if (nav.target === "config" && ["seguridad", "orgs"].includes(CFG_SEC ?? "")) return;
      const key = configKey(nav.target);
      if (key === null) return;
      if (key) {
        CFG_KEY = key;
        CFG_DETALLE = true;
      } else if (IR_DESDE_MENU_CFG) {
        CFG_DETALLE = false;
        CFG_KEY = "datos";
      }
      if (nav.target !== "config") {
        PAG_TAB.perfil = void 0;
        PAG_TAB.organizacion = void 0;
        PAG_TAB.empresa = void 0;
        PAG_TAB.usuarios = void 0;
      }
      CFG_SEC = "__cfg";
      CFG_SUB = null;
      IR_DESDE_MENU_CFG = false;
      nav.target = "config";
    }
  };
  var directoryLabel = {
    name: "v2.210 · the directory title with the company word for its accounts",
    after: (target) => {
      if (target === "directorio") later([0, 300, 1200], aplicarEtiqueta);
    }
  };
  var manualHelpButton = {
    name: "v2.226 · the «i» help next to each screen title",
    after: () => {
      later([400, 1200, 2500], ponerAyudaManual);
    }
  };
  var platformPanel = {
    name: "v2.166 · Panel delcos sections, and platform mode only shows the panel",
    before: (nav) => {
      const section = PANEL_SECCIONES.find((entry) => entry[0] === nav.target);
      if (section) {
        PAG_TAB.delcos = section[1];
        nav.target = "delcos";
        return;
      }
      if (MODO_PLATAFORMA && !PLATFORM_SCREENS.includes(nav.target)) nav.target = "delcos";
    },
    after: (target) => {
      if (target === "delcos") marcarPanel();
    }
  };
  var stripeReturnToPlan = {
    name: "v2.167 · coming back from Stripe opens «Plan y suscripción»",
    before: (nav) => {
      if (!PAGO_IR_PLAN || !PERFIL) return;
      pagoAlPlan();
      if (!ES_MEDICO() && puedeOrganizacion()) nav.target = "plan";
    }
  };
  var planSections = {
    name: "v2.152 · sections outside the contracted plan show the plan notice instead",
    before: (nav) => {
      if (nav.target in PLAN_SECCIONES && PERFIL && !ES_MEDICO() && !planIncluyeSeccion(nav.target)) {
        avisoPlan(nav.target);
        nav.blocked = true;
      }
    }
  };
  var agendaFromMenuIsToday = {
    name: "v2.140 · Agenda from the menu always opens today",
    before: (nav) => {
      if (nav.target === "agenda" && IR_DESDE_MENU) {
        AG_MODO = "dia";
        AG_FECHA = hoyISO();
      }
    }
  };
  var ordersSections = {
    name: "v2.128 · Oportunidades, Compras… are sections of Pedidos",
    before: (nav) => {
      const section = ALIAS_PEDIDOS[nav.target];
      if (section !== void 0) {
        PEDSEC = section;
        nav.target = "ventas";
        return;
      }
      if (nav.target === "ventas" && IR_DESDE_MENU) PEDSEC = "ventas";
    },
    after: (target) => {
      if (target === "ventas") marcarPedsec();
    }
  };
  var closePageDialog = {
    name: "v2.128 · a window that belongs to the page closes when leaving it",
    before: () => {
      const dialog3 = document.getElementById("dlg");
      if (dialog3?.open && (Boolean(dialog3.dataset.fija) || Boolean(dialog3.dataset.depagina))) dialog3.close();
    }
  };
  var footerMenuMark = {
    name: "v2.128 · mark the current screen in the footer menu",
    after: () => {
      menuMarcarPie();
      setTimeout(menuMarcarPie, 0);
    }
  };

  // src/app/core/navigation/steps-inner.ts
  var COMPANY_SECTIONS = ["__empresa", "empresa", "marca", "correo", "copias"];
  var MAIL_SECTIONS = ["correo", "copias"];
  var screenSection = () => document.getElementById(`v-${TAB}`);
  var configToOwnPages = {
    name: "v2.128 · team, security and organizations open their own pages",
    before: (nav) => {
      if (nav.target === "config" && CFG_SEC === "equipo") {
        PAG_TAB.usuarios = CFG_SUB === "roles" ? "roles" : "usuarios";
        CFG_SEC = "inicio";
        CFG_SUB = null;
        nav.target = "usuarios";
      }
      if (nav.target === "config" && CFG_SEC === "seguridad" && puede("gestionar_plataforma")) {
        PAG_TAB.delcos = CFG_SUB === "accesos" ? "accesos" : "auditoria";
        CFG_SEC = "inicio";
        CFG_SUB = null;
        nav.target = "delcos";
      }
      if (nav.target === "config" && CFG_SEC === "orgs" && puede("gestionar_plataforma")) {
        PAG_TAB.delcos = "orgs";
        CFG_SEC = "inicio";
        nav.target = "delcos";
      }
    }
  };
  var closeEmbeddedWindows = {
    name: "v2.117 · windows embedded in a page close when leaving it",
    before: () => {
      cerrarEncajadas();
    }
  };
  var organizationPage = {
    name: "v2.121 · company and plan are parts of the Organización page (only for who may configure it)",
    before: (nav) => {
      const fromConfig = nav.target === "config" && CFG_SEC !== null ? ORG_DESDE[CFG_SEC] : void 0;
      if (nav.target === "empresa") {
        PAG_TAB.organizacion = orFallback(PAG_TAB.empresa, "marca");
        nav.target = "organizacion";
      } else if (nav.target === "plan") {
        PAG_TAB.organizacion = "plan";
        nav.target = "organizacion";
      } else if (fromConfig) {
        PAG_TAB.organizacion = orFallback(CFG_SUB !== null ? ORG_DESDE[CFG_SUB] : void 0, fromConfig);
        CFG_SEC = "rutas";
        nav.target = "organizacion";
      }
      if (nav.target === "organizacion" && !puedeOrganizacion()) nav.target = "inicio";
    }
  };
  var clearPagesWhenLeaving = {
    name: "v2.117 · going to a non-page screen empties the pages, so no old page shows up",
    before: (nav) => {
      if (nav.target in PAGINAS) return;
      Object.keys(PAGINAS).forEach((page) => {
        const section = document.getElementById(`v-${page}`);
        if (section) section.innerHTML = "";
      });
    }
  };
  var revealSince = [];
  var atomicReveal = {
    name: "v2.60 · the screen is revealed at once when its data is ready (no screen «ghosts»)",
    before: () => {
      revealSince.push(Date.now() - 2);
    },
    after: () => {
      const section = screenSection();
      if (section) {
        section.classList.remove("cargando", "cargando-pend");
        revelar(section, 4e3, revealSince[revealSince.length - 1] ?? Date.now());
      }
      document.querySelectorAll("main > section.preparando").forEach((other) => {
        if (other !== section) other.classList.remove("preparando");
      });
    },
    cleanup: () => {
      revealSince.pop();
    }
  };
  function billingSection() {
    const map = { fiscal: "empresa", series: "series", vf: "verifactu", fact: orFallback(FAC_ULTIMA, "empresa") };
    const section = CFG_SEC ?? "";
    if (!(map[section] ?? (section === "fact" ? map[CFG_SUB ?? ""] : void 0))) return void 0;
    return orFallback(map[section === "fact" ? orFallback(CFG_SUB, "fact") : section], "empresa");
  }
  var billingSettings = {
    name: "v2.57 · fiscal data, series and VeriFactu open in Facturación",
    before: (nav) => {
      if (nav.target !== "config") return;
      const section = billingSection();
      if (section !== void 0) {
        FSEC = section;
        CFG_SEC = "rutas";
        nav.target = "facturacion";
      }
    }
  };
  var loadingIndicatorAfterDelay = {
    name: "v2.56 · the loading indicator only shows while the screen is still requesting data",
    after: () => {
      const section = screenSection();
      if (section?.classList.contains("cargando-pend")) {
        section.classList.remove("cargando-pend");
        if (PEND > 0) section.classList.add("cargando");
      }
    }
  };
  var markNavigationInProgress = {
    name: "v2.56 · VIA_IR tells the screens they are being opened by a navigation",
    before: (nav) => {
      VIA_IR = nav.target;
    },
    cleanup: () => {
      setTimeout(() => {
        VIA_IR = null;
      }, 0);
    }
  };
  function companyTab() {
    if (CFG_SUB !== null && MAIL_SECTIONS.includes(CFG_SUB)) return CFG_SUB;
    if (CFG_SEC !== null && MAIL_SECTIONS.includes(CFG_SEC)) return CFG_SEC;
    return "marca";
  }
  var legacyConfigPages = {
    name: "v2.53 · notifications, company and plan have their own page; pages are loaded after switching",
    before: (nav) => {
      if (nav.target === "config" && CFG_SEC === "notif") {
        PAG_TAB.perfil = "notif";
        CFG_SEC = "rutas";
        nav.target = "perfil";
      }
      if (nav.target === "config" && ["perfil", "prefs"].includes(CFG_SEC ?? "")) CFG_SEC = "rutas";
      if (nav.target === "config" && COMPANY_SECTIONS.includes(CFG_SEC ?? "")) {
        PAG_TAB.empresa = companyTab();
        CFG_SEC = "rutas";
        nav.target = "empresa";
      }
      if (nav.target === "config" && CFG_SEC === "plan") {
        CFG_SEC = "rutas";
        nav.target = "plan";
      }
    },
    after: (target) => {
      if (PAGINAS[target]) cargarPagina(target);
    }
  };
  var noFlashOnFastLoad = {
    name: "v2.52 · fast screens go straight from the old content to the new one, without a flash of the loader",
    after: () => {
      const section = screenSection();
      if (!section?.classList.contains("cargando")) return;
      section.classList.remove("cargando");
      section.classList.add("cargando-pend");
      if (PEND > 0) section.classList.add("cargando");
      section.classList.remove("cargando-pend");
    }
  };

  // src/app/core/navigation/index.ts
  var NAVIGATION_STEPS = [
    resetBackStack,
    professionalPortalOnly,
    loadingComet,
    watchListPage,
    customMenuNames,
    rememberManualReturn,
    announceNavigation,
    singleConfiguration,
    directoryLabel,
    manualHelpButton,
    platformPanel,
    stripeReturnToPlan,
    planSections,
    agendaFromMenuIsToday,
    ordersSections,
    closePageDialog,
    footerMenuMark,
    configToOwnPages,
    closeEmbeddedWindows,
    organizationPage,
    clearPagesWhenLeaving,
    atomicReveal,
    billingSettings,
    loadingIndicatorAfterDelay,
    markNavigationInProgress,
    legacyConfigPages,
    noFlashOnFastLoad
  ];
  function navigate(target, ...args) {
    runNavigation(NAVIGATION_STEPS, (screen2) => {
      irBase(screen2);
    }, target, args);
  }

  // src/app/i18n/es/accounts.ts
  var accounts = {
    base: {
      noConnection: "Sin conexión y sin copia guardada de esta ficha.",
      cachedNotice: "Sin conexión · ficha guardada en este dispositivo",
      urgent: "Urgente",
      noReporting: "Sin reporting",
      noReportingTitle: "Solo {visit} presencial: sin informes ni feedback",
      code: " · código {code}",
      record: "Registrar {visit}",
      edit: "Editar ficha",
      markUrgent: "Marcar urgente",
      unmarkUrgent: "Quitar urgente",
      addToAgenda: "+ Añadir a mi agenda",
      salesRep: "Comercial: {names}",
      noAddress: "Sin dirección",
      phone: "Teléfono: {phone}",
      directions: "Cómo llegar",
      byPhone: " · Por teléfono",
      byVideo: " · Por videollamada",
      noResult: "Sin resultado",
      samples: " · {count} muestras",
      next: "Próxima: {date} · {action}",
      editVisit: "Editar",
      noVisits: "Todavía no hay {visits}.",
      salesTitle: "Ventas y {patients}",
      timetableMissing: "⚠ <b>Falta su horario de atención.</b> Sin él, las rutas y el planificador no saben qué días y horas atiende.",
      completeTimetable: "Completar horario",
      unitsTitle: "Unidades atribuidas",
      unitsToday: "Hoy",
      unitsWeek: "Semana",
      unitsMonth: "Mes",
      unitsQuarter: "Trimestre",
      unitsYear: "Año",
      unitsTotal: "Total",
      evolution: "Evolución",
      unitsSummary: "{count} {prescriptions} · última el {date} · ",
      noPrescriptions: "Todavía sin {prescriptions} registradas."
    },
    sales: {
      repTitle: "Comercial asignado",
      loading: "Cargando…",
      save: "Guardar",
      repNote: "Las ventas nuevas se atribuyen al comercial asignado en ese momento. Las anteriores no cambian.",
      noRep: "Sin comercial",
      couldNotAssign: "No se ha podido asignar",
      assigned: "Comercial asignado",
      patientLine: "{units} uds. · {orders} pedidos",
      lastOrder: " · último {date}",
      seeAll: "Ver los {count} {patients}",
      associatedTitle: "{patients} asociados",
      associated: "Asociados",
      withOrders: "Con pedidos",
      withoutOrders: "Sin pedidos",
      noneAssociated: "Todavía no tiene {patients} asociados."
    },
    history: {
      title: "Historial de cambios",
      undo: "Deshacer",
      none: "Sin cambios registrados."
    },
    proposal: {
      title: "Datos enviados desde su portal",
      toReview: "Por revisar",
      sent: "{who} los envió el {date}. Pásalos a la ficha con «Editar la ficha» y márcalos como revisados.",
      phone: "Teléfono",
      email: "Correo",
      newCentre: "Centro nuevo",
      noTimetable: "Sin horario",
      notes: "Notas",
      edit: "Editar la ficha",
      reviewed: "Marcar como revisado",
      noPermission: "No tienes permiso para revisarlo",
      couldNotMark: "No se ha podido marcar",
      marked: "Marcado como revisado"
    },
    card: {
      stateTitle: "Estado",
      photo: "1 foto",
      photos: "{count} fotos",
      addPhotos: "Añadir fotos",
      presented: "Presentado: {list}",
      samplesTitle: "Muestras este año",
      samplesGiven: "{given} de {max}",
      samplesOutOfTime: "Fuera de plazo",
      samplesNoneLeft: "Sin muestras este año",
      eventsTitle: "Eventos",
      depositTitle: "Material en depósito",
      depositUnits: "{units} unidades de {products}",
      oneProduct: "1 producto",
      products: "{count} productos",
      oneBatchExpires: "1 lote caduca",
      batchesExpire: "{count} lotes caducan",
      inLessThan60Days: " en menos de 60 días",
      depositNone: "Sin material en depósito.",
      depositOpen: "Abrir el depósito",
      depositLeave: "Dejar material en depósito",
      surgeriesTitle: "Intervenciones",
      surgery: "Intervención",
      tendersTitle: "Concursos",
      tenderExpired: "vencido",
      tenderExpiresOn: "vence el {date}",
      equipmentTitle: "Equipos instalados",
      equipment: "Equipo",
      serial: " · nº {serial}",
      equipmentNone: "Sin equipos instalados.",
      addEquipment: "+ Equipo",
      centreProfessionals: "Los {professionals} que atienden aquí y su horario",
      seeCentreProfessionals: "Ver sus {professionals}",
      reactivate: "Volver a dar de alta",
      archive: "Dar de baja",
      delete: "Eliminar la ficha"
    }
  };

  // src/app/i18n/es/agenda.ts
  var agenda = {
    title: "Agenda",
    todayTitle: "Hoy · {date}",
    agendaOf: " · agenda de {name}",
    yourNumbers: "Tus números",
    newAppointment: "+ Nueva cita",
    backToToday: "Volver a hoy",
    noAppointmentsThatDay: "No tuviste citas este día.",
    team: {
      title: "Cumplimiento del equipo",
      agendaOf: "Agenda de",
      seeOthers: "Ver la agenda de otra persona",
      myAgenda: "Mi agenda",
      team: "Equipo",
      backToMine: "Volver a tu agenda",
      seeTeam: "Ver el cumplimiento del equipo"
    },
    month: {
      previous: "Mes anterior",
      next: "Mes siguiente",
      choose: "Elegir mes y año",
      today: "Hoy",
      previousYear: "Año anterior",
      nextYear: "Año siguiente",
      dayLabel: "{date}: {count} citas"
    },
    metrics: {
      today: "Hoy",
      week: "Semana",
      closings: "Cierres",
      toVisit: "Por visitar",
      todayDetail: "{done} de {total} citas · media {average} {visits}/día",
      weekDetail: "{count} {visits} · media {average}/semana",
      closingsDetail: "{count} cierres con éxito hoy · media {average}/día",
      toVisitDetail: "{urgent} urgentes · {noVisit} sin {visit} en 60 días"
    },
    trays: {
      due: "Les toca {visit}",
      dueText: "Según la frecuencia objetivo de cada {professional}. Añádelos a este día o planifica una ruta con ellos.",
      pending: "Pendientes de días anteriores",
      pendingShort: "Pendientes anteriores",
      pendingText: "Los planificaste y no se visitaron. Muévelos a hoy o descártalos.",
      daysWithout: "{days} días sin {visit}",
      neverVisited: "nunca visitado",
      card: "Ficha",
      addAppointment: "+ Cita",
      moveToToday: "Mover a hoy",
      discard: "Descartar",
      planRoute: "Planificar ruta",
      rescheduleAll: "Reprogramar todas",
      notVisited: "{count} sin visitar",
      nothingPending: "Nada pendiente."
    },
    yourDay: {
      titleToday: "Tu día",
      titlePast: "Lo que pasó este día",
      titleFuture: "Tu agenda de este día",
      showDetail: "Ver el detalle de las citas",
      compactTitle: "Compactar las citas: una línea cada una",
      compactLabel: "Compactar las citas",
      dayOptions: "Opciones del día",
      dayOptionsTitle: "Opciones del día: nueva cita, bloquear el día…",
      appointments: "<b>{count}</b> citas",
      visited: '<b style="color:var(--ok)">{count}</b> visitadas',
      absent: '<b style="color:var(--warn)">{count}</b> no estaban',
      toDo: "<b>{count}</b> por hacer",
      estimatedEnd: "Fin estimado",
      overReturn: " · pasa de la hora de vuelta",
      nextDay: "(día siguiente: revisa los avisos)",
      addTask: "+ Tarea",
      orderByDistance: "Ordenar por cercanía",
      orderTitle: "Ordena las citas abiertas para recorrer menos kilómetros. Las que tienen hora fija se respetan.",
      startDay: "▶ Empezar jornada",
      endDay: "Terminar jornada",
      reschedulePending: "Reprogramar pendientes",
      workingDay: "● Jornada en curso desde hace {time}. Registra cada {visit} al terminarla.",
      noFit: "<b>Este día no cabe en una jornada.</b> Con este orden acabarías {end}{outside}.",
      outsideOne: " y una cita queda fuera de tu horario",
      outsideMany: " y {count} citas quedan fuera de tu horario",
      badWindows: "<b>Varias citas no encajan con sus horarios.</b>",
      beforeEach: "Antes de mirar cada cita: ",
      or: " o ",
      moveFarthest: "pasa a otro día las citas de la zona más lejana (⋯ → Aplazar).",
      endAround: "hacia las {time}",
      endAfterMidnight: "pasada la medianoche (hacia las {time} del día siguiente)",
      emptyToday: "No tienes citas hoy. Planifica una ruta en Rutas o cita a alguien de las sugerencias.",
      emptyOther: "Sin citas este día.",
      dayAppointments: "Citas del día",
      othersTitle: "Citas de otras personas · {count}",
      pendingOf: "Pendientes del {date}",
      notVisitedThatDay: "Sin visitar ese día",
      ordered: "Citas ordenadas por cercanía",
      orderedWithLeft: "Ordenadas · {count} no caben en su horario o en el tuyo y quedan al final",
      queued: "Registrada en el móvil · pendiente de enviar",
      couldNotSaveOrder: "No se ha podido guardar el orden",
      whyWarning: "Por qué sale este aviso",
      understood: "Entendido"
    },
    card: {
      inTime: "en {time}",
      estimatedTime: "Hora estimada",
      farLocation: "Ubicación a {km} km de la parada anterior: revisa la dirección",
      attends: "Atiende {windows}",
      waits: " · esperas {minutes} min",
      due: "Toca: {action}",
      lastVisit: "Última {visit} hace {days} {unit}",
      day: "día",
      days: "días",
      firstVisit: "Primera {visit}",
      noLocation: "Sin ubicación",
      next: "Siguiente",
      seeAppointment: "Ver la cita",
      classTitle: "Clase {name}",
      urgent: "Urgente",
      noCentre: "Sin centro",
      fixedTime: "Hora fijada",
      estimatedByOrder: "Hora estimada según el orden",
      keep: " · mantener",
      moveUp: "Subir en el orden",
      moveDown: "Bajar en el orden",
      moreActions: "Más acciones",
      newAppointment: "Nueva cita",
      record: "Registrar {visit}"
    },
    sheet: {
      when: "Cuándo",
      where: "Dónde",
      timetable: "Horario",
      state: "Estado",
      around: "hacia las {time} (estimada)",
      noTime: "sin hora",
      noCentre: "Sin centro",
      atCentre: "En {centre}: ",
      notAttending: "Ese día no atiende",
      notes: "Notas de la cita",
      notesPlaceholder: "p. ej. quedamos en el bar de enfrente, llevar el reporting…",
      seeCard: "Ver ficha",
      directions: "Cómo llegar",
      changeTime: "Cambiar hora",
      moveDay: "Mover a otro día",
      saveNotes: "Guardar notas",
      record: "Registrar {visit}",
      discard: "Descartar la cita",
      discardText: "No se hará: queda en el historial.",
      delete: "Eliminar la cita",
      deleteText: "Fue un error: desaparece sin dejar rastro.",
      planAgain: "Volver a planificarla",
      goTo: "Ir al {day}",
      seeDay: "Ver el {day}",
      closed: "<b>Cita cerrada: {state}.</b>",
      closedReopen: "Si hace falta, puedes volver a planificarla desde «⋯».",
      closedFinal: "La hora y el día ya no se cambian; las notas sí. Si hace falta volver, crea una cita nueva.",
      recorded: "Se registró la {visit}{time}{results}.",
      recordedAt: " a las {time}",
      couldNotSave: "No se ha podido guardar: {error}",
      notesSaved: "Notas guardadas"
    },
    menu: {
      setTime: "Fijar una hora",
      changeTime: "Cambiar la hora",
      postpone: "Aplazar a otro día",
      postponeText: "Queda como aplazada y se crea la cita nueva",
      confirm: "Marcar como confirmada",
      confirmText: "Ya has confirmado la cita",
      unconfirm: "Quitar la confirmación",
      discard: "Descartar la cita",
      discardText: "Ya no hace falta ir",
      delete: "Eliminar la cita",
      deleteText: "Fue un error: desaparece de la agenda",
      planAgain: "Volver a planificarla",
      planAgainText: "Vuelve a este día",
      planAgainPostponed: "; si la pasaste a otro, esa se quita",
      alreadyClosed: "Esta cita ya está cerrada"
    },
    actions: {
      couldNotChange: "No se ha podido cambiar",
      confirmed: "Cita confirmada",
      discarded: "Cita descartada",
      unconfirmed: "Confirmación quitada",
      deleteQuestion: "La cita desaparece de la agenda sin dejar rastro.",
      deleteTitle: "¿Eliminar la cita?",
      delete: "Eliminar",
      onlyFuture: "Solo se pueden eliminar citas de hoy en adelante",
      couldNotDelete: "No se ha podido eliminar",
      deleted: "Cita eliminada",
      whichDay: "¿A qué día la pasas?",
      postponeTitle: "Aplazar la cita",
      postpone: "Aplazar",
      couldNotPostpone: "No se ha podido aplazar",
      alreadyThatDay: "Ya tenía una cita ese día",
      sameDay: "Sigue en el mismo día",
      backToOwn: "Vuelve a su cita del {date}",
      postponedTo: "Aplazada al {date}",
      missingNegative: "Falta un resultado negativo en Configuración → Clasificadores",
      whatHappened: "¿Qué ha pasado?",
      cancel: "Cancelar",
      couldNotSave: "No se ha podido guardar: {error}",
      noted: "Anotado: {result}",
      reopenOnlyFuture: "Solo se pueden volver a planificar citas de hoy en adelante",
      couldNotReopen: "No se ha podido volver a planificar",
      reopenedRemoving: "Vuelve a estar planificada (se quita la del {date})",
      reopened: "Vuelve a estar planificada",
      timeTitle: "Hora de la cita",
      save: "Guardar",
      couldNotTime: "No se ha podido: {error}",
      timeUpdated: "Hora actualizada"
    },
    tasks: {
      title: "Tareas y notas · {count}",
      done: "Hecha",
      up: "Subir la tarea",
      down: "Bajar la tarea",
      couldNotSave: "No se ha podido guardar",
      show: "Ver las tareas",
      hide: "Ocultar las tareas"
    },
    strip: {
      thisWeek: "Esta semana",
      nextWeek: "La semana que viene",
      lastWeek: "La semana pasada",
      weekOf: "Semana del {day} de {month}",
      previousWeekNav: "Semana anterior",
      nextWeekNav: "Semana siguiente",
      seeMonth: "Ver el mes",
      today: "Hoy",
      done: "Hecha",
      toDo: "Por hacer",
      notClosed: "Sin cerrar",
      oneAppointment: "{count} cita",
      appointments: "{count} citas",
      dayOptions: "Opciones del día",
      showWeek: "Ver la semana",
      hideWeek: "Ocultar la semana",
      showWeekTitle: "Ver la semana entera, moverla y repartirla"
    },
    openWeek: {
      hint: "Arrastra una cita a otro día para moverla · «⋯» en un día para bloquearlo o añadir una cita",
      share: "Repartir la semana",
      draft: "Propuesta sin guardar",
      draftSummary: "{count} {visits} en {days} días",
      draftWithoutDay: " · {count} sin día",
      discard: "Descartar",
      save: "Guardar en la agenda",
      dayOptions: "Opciones del {date}",
      dayOptionsTitle: "Opciones del día",
      estimatedEnd: "Hora de fin estimada",
      overReturn: ": pasa de la hora de vuelta {time}",
      dragToMove: " · arrástrala a otro día para moverla",
      proposal: "Propuesta: {name}",
      andMore: "y {count} más",
      withoutDay: "Se quedan sin día · {count}",
      notToPast: "No se puede mover a un día pasado",
      blockedDay: "ese día está bloqueado ({reason})",
      notAttending: "ese día no atiende",
      moveAnyway: "¿Moverla igualmente?",
      move: "Mover",
      couldNotMove: "No se ha podido mover",
      movedTo: "Movida al {date}"
    },
    week: {
      title: "Tu semana",
      hint: "«⋯» en un día para bloquearlo (festivo, vacaciones, formación) o añadir una cita.",
      seeDay: "Ver el {date}",
      dayOptions: "Opciones del {date}",
      andMore: "y {count} más",
      free: "Libre",
      share: "Repartir la semana"
    },
    sameCentre: {
      title: "En este centro también",
      seeCentre: "Ver el centro ›",
      openCentre: "Abrir la ficha del centro",
      addAppointment: "Añadir una cita · {reason}",
      seeCard: "Ver su ficha",
      missing: " · falta: {fields}",
      morning: "Por la mañana",
      afternoon: "Por la tarde",
      otherDay: "Otro día",
      noTimetable: "Sin horario",
      andMore: "y {count} más"
    },
    editor: {
      newTitle: "Nueva cita",
      newSubtitle: "Se añade a tu agenda",
      day: "Día",
      time: "Hora",
      optional: "(opcional)",
      centre: "Centro",
      notes: "Notas",
      cancel: "Cancelar",
      add: "Añadir a la agenda",
      choose: "Elige {professional}",
      couldNot: "No se ha podido: {error}",
      added: "Cita añadida el {date}",
      duplicateTitle: "Ya tiene una cita ese día",
      duplicateText: "{name}\n{date}{time} · {state}{origin}\n\n¿Qué quieres hacer?",
      at: " a las {time}",
      keepBoth: "Mantener las dos",
      onlyNew: "Quedarme solo con la nueva",
      couldNotRemovePrevious: "No se ha podido quitar la cita anterior",
      recentTitle: "Ya se ha visto hace poco",
      recentText: "{list}.\n\n¿Añades la cita igualmente?",
      yesNoMore: "Sí, y no volver a avisarme",
      addAnyway: "Añadir igualmente",
      noticeOff: "Aviso desactivado. Puedes activarlo en Configuración → Rutas"
    },
    taskEditor: {
      title: "Tarea",
      newTitle: "Nueva tarea",
      subtitle: "Una nota o tarea tuya para ese día, sin cliente",
      what: "Qué hay que hacer",
      whatPlaceholder: "p. ej. Llamar al almacén, reunión de equipo…",
      delete: "Borrar",
      save: "Guardar",
      add: "Añadir",
      writeWhat: "Escribe qué hay que hacer",
      saved: "Tarea guardada",
      addedOn: "Tarea añadida el {date}",
      deleteText: "La tarea desaparece.",
      deleteTitle: "¿Borrar la tarea?",
      couldNotDelete: "No se ha podido borrar",
      deleted: "Tarea borrada",
      doneTitle: "Tarea hecha",
      done: "Hecha",
      reopen: "Volver a pendiente",
      couldNotChange: "No se ha podido cambiar"
    }
  };

  // src/app/i18n/es.ts
  var es = {
    common: {
      save: "Guardar",
      cancel: "Cancelar",
      close: "Cerrar",
      back: "Volver",
      loading: "Cargando…",
      retry: "Reintentar"
    },
    navigation: {
      notInPlan: "No está incluido en tu plan",
      notAllowed: "No tienes permiso para entrar aquí",
      unknownScreen: "Esa pantalla no existe"
    },
    errors: {
      network: "Sin conexión: se guardará al volver la red",
      generic: "Algo ha fallado. Inténtalo de nuevo"
    },
    dates: {
      monthsShort: "ene,feb,mar,abr,may,jun,jul,ago,sep,oct,nov,dic",
      weekdaysShort: "dom,lun,mar,mié,jue,vie,sáb",
      /** Locale for the browser date and number formats (Intl) */
      locale: "es-ES",
      monthsLong: "enero,febrero,marzo,abril,mayo,junio,julio,agosto,septiembre,octubre,noviembre,diciembre",
      /** Weekday initials from Monday */
      weekdayLetters: "L,M,X,J,V,S,D",
      weekdaysLong: "lunes,martes,miércoles,jueves,viernes,sábado,domingo"
    },
    agenda,
    accounts,
    home: {
      showIndicators: "Ver tus indicadores",
      hideIndicators: "Ocultar tus indicadores",
      indicators: {
        offline: "Sin conexión y sin copia guardada todavía.",
        whatIsIt: "Qué es",
        savedFilter: "Filtro guardado",
        filterHelp: "{help} Filtro: {filter}.",
        nextAppointment: "Siguiente <b>{time}</b> · {name}",
        allClosed: "Todas cerradas",
        noAppointmentsToday: "Sin citas hoy",
        urgentPending: "{count} por atender",
        noneUrgent: "Ninguno pendiente",
        allUpToDate: "Todo al día",
        busiestDay: "El {weekday}, el día más lleno (<b>{count}</b>)",
        freeWeek: "Semana libre",
        fourWeekAverage: "Media <b>{average}</b> al día las 4 semanas anteriores",
        aboveLastMonth: "<b>+{difference}</b> sobre el mismo día del mes pasado",
        belowLastMonth: "<b>{difference}</b> frente al mismo día del mes pasado",
        unitsVersusLastMonth: "{sign}{percent} % frente al mismo día del mes pasado",
        alreadyIn: "<b>{count}</b> ya en «{state}»",
        nextStep: "Siguiente paso: «{state}»",
        shareOfPortfolio: "{percent} % de tu cartera",
        noVisitIn60Days: "Sin {visit} en 60 días",
        theRest: "El resto",
        today: "hoy"
      },
      attention: {
        title: "Requiere tu atención",
        allClearTitle: "Todo al día",
        allClearText: "No hay nada pendiente en ninguna área.",
        overdueInvoices: "Facturas vencidas",
        overdueInvoicesDetail: "{amount} por cobrar",
        pendingPayment: "Pendientes de cobro",
        pendingPaymentDetail: "Pedidos confirmados que aún no están cobrados",
        urgentUnvisited: "{professionals} sin visitar",
        urgentUnvisitedDetail: "Marcados como urgentes en su ficha",
        surgeryRestock: "Material de intervenciones por reponer",
        surgeryRestockDetail: "Reposición en 48 horas",
        packagesToPrepare: "Paquetes por preparar",
        packagesToPrepareDetail: "Pedidos confirmados sin enviar",
        callBackToday: "Volver a llamar hoy",
        callBackLate: "Algunas llamadas van con retraso",
        callBackOnTime: "Clientes a los que quedaste en llamar",
        contractsExpiring: "Contratos que vencen en 90 días",
        contractsExpiringDetail: "Concursos por renovar",
        emailsToSend: "Correos por enviar",
        emailsToSendDetail: "Facturas y avisos de pago sin enviar al cliente",
        duplicates: "Fichas duplicadas por revisar",
        duplicatesDetail: "Posibles duplicados"
      },
      sales: {
        title: "Ventas del mes",
        units: "uds.",
        percent: "{percent} %",
        versusLastMonth: " frente al mismo día del mes pasado · ",
        orders: "pedidos",
        chartLabel: "{visits} por día en los últimos 14 días",
        chartLegend: "{visits} de los últimos 14 días"
      },
      today: {
        title: "Tu día",
        appointmentOne: "cita",
        appointmentOther: "citas",
        done: "hechas",
        taskOne: "tarea pendiente",
        taskOther: "tareas pendientes",
        dayComplete: "Día completado",
        planYourDay: "Planifica tu día"
      },
      collections: {
        title: "Cobros",
        pendingIn: "pendiente en",
        invoiceOne: "factura",
        invoiceOther: "facturas",
        overdue: "Vencido",
        invoicedThisMonth: "Facturado este mes"
      },
      cycle: {
        title: "Ciclo de {visits}",
        progress: " de {target} · quedan {days} días"
      },
      stock: {
        title: "Stock",
        alertOne: "aviso",
        alertOther: "avisos",
        allGood: "Todo en orden"
      },
      portfolio: {
        title: "Cartera",
        soldThisMonth: "Han vendido este mes",
        notContacted: "Sin contactar",
        noVisitIn60Days: "Sin {visit} en 60 días"
      },
      upcoming: {
        title: "Lo que viene"
      }
    }
  };

  // src/app/i18n/index.ts
  var catalogs = { es };
  var currentLanguage = "es";
  var vocabulary = {};
  function setLanguage(language) {
    currentLanguage = language;
  }
  function setVocabulary(words) {
    vocabulary = { ...words };
  }
  function lookup(catalog, key) {
    let node = catalog;
    for (const part of key.split(".")) {
      if (typeof node !== "object" || node === null) return void 0;
      node = node[part];
    }
    return typeof node === "string" ? node : void 0;
  }
  function fill(text, params) {
    return text.replace(/\{(\w+)\}/g, (whole, name) => {
      const value2 = params[name] ?? vocabulary[name];
      return value2 === void 0 ? whole : String(value2);
    });
  }
  function t(key, params = {}) {
    const text = lookup(catalogs[currentLanguage], key) ?? lookup(es, key) ?? key;
    return fill(text, params);
  }

  // src/app/screens/accounts/index.ts
  var accounts_exports = {};
  __export(accounts_exports, {
    openAccountCard: () => openAccountCard
  });

  // src/app/legacy/bridge.ts
  var legacyDb = () => db;
  var callRpc = (name, params = {}) => RPC_ORIG(name, params);
  var currentScreen = () => TAB;
  var goTo = (screen2) => {
    ir(screen2);
  };
  var goToOrders = (section) => {
    PEDSEC = section;
    ir("ventas");
  };
  function term(word, options = {}) {
    const { number = "s", article = "", capital = "l", adjective } = options;
    return adjective === void 0 ? TT(word, number, article, "l", capital) : TT(word, number, article, "l", capital, adjective);
  }
  var permissions = {
    canSeeArea: (area) => verArea(area),
    canSeeAmounts: () => verImportes(),
    seesEverything: () => VE_TODO(),
    salesLevel: () => nivelDe2("V"),
    /** Level (0–3) in an area by its letter (M: accounts, V: sales…). */
    levelOf: (letter) => nivelDe2(letter),
    isProfessionalPortal: () => ES_MEDICO(),
    hasOpportunities: () => typeof hayOportunidades === "function" && hayOportunidades(),
    canReviewDuplicates: () => typeof puedeDuplicados === "function" && puedeDuplicados()
  };
  var homeCache = {
    panel: () => KV_INI,
    setPanel: (value2) => {
      KV_INI = value2;
    },
    charts: () => KV_GRAF
  };
  var appointments = {
    ofDay: citasDelDia,
    isOpen: (state) => CITA_ABIERTA.includes(state),
    isCancelled: (state) => citaAnulada(state)
  };
  var icon = (name) => svgIco(ICON_NOM[name] ?? ICON_NOM.info ?? "");
  var alreadyCounted = (key, values) => plYaContado(key, values);
  var legacyHome = {
    removeOldBlocks: inicioQuitarAntiguo,
    header: inicioCabecera,
    professionalPortal: pintarInicioBase2
  };
  var indicatorCatalog = {
    definitions: () => KPI_CAT,
    settings: () => kpiConfig(),
    allowed: (definition) => kpiPermitido(definition),
    help: (id) => AYUDA_KPI[id],
    icon: (id) => KPI_ICO[id],
    description: (id) => KPI_TXT[id],
    filterText: (filter) => textoFiltro(filter),
    countFilter: (filter) => contarFiltro(filter)
  };
  var commercialStates = {
    all: () => ESTADOS_DEF,
    color: (state) => EST_COL[state]
  };
  var cachedRpc = (name, params, key) => rpcCache(name, params, key);
  var timingMark = (step) => {
    marca(step);
  };
  var showCacheNotice = (element, date) => {
    avisoCache(element, date);
  };
  var addHelpButtons = () => {
    ponerAyudas();
  };
  var isMobile = () => ES_MOVIL();
  var legacyAgenda = {
    selectedDate: () => AG_FECHA,
    /** The person whose agenda is shown (null: everybody the user sees, or the user). */
    userFilter: () => agUsuarioFiltro(),
    viewedUserId: () => AG_VISTA?.id ?? null,
    showDay: (isoDate) => {
      void agVerDia(isoDate);
    },
    isDayView: () => agN(),
    metrics: () => AG_MET,
    setMetrics: (value2) => {
      AG_MET = value2;
    },
    /** Today's appointments as painted in «Tu día», and the day they were loaded for. */
    dayAppointments: () => TD_CITAS,
    loadedDay: () => TD_ULTIMO?.fecha ?? null
  };
  var agendaSuggestions = {
    forDay: () => AG_SUG,
    pending: () => AG_PEND ?? []
  };
  var agendaActions = {
    openAccount: (id) => {
      void abrirFicha(id);
    },
    openCentre: (id) => {
      void fichaCentro(id);
    },
    newAppointment: (accountId, isoDate) => {
      void nuevaCita(accountId, isoDate);
    },
    planRoute: (list, button) => {
      void planDesdeLista(list, "toca", button);
    },
    reschedule: (list, title, text) => {
      void reprogramarCitas(list, title, text);
    }
  };
  var sidePanel = {
    context: () => HERR_CTX,
    setContext: (value2) => {
      HERR_CTX = value2;
    }
  };
  var legacyAgendaParts = {
    mode: () => AG_MODO,
    blockedDays: (fromIsoDate2, days) => agBloqueos(fromIsoDate2, days),
    dayMenu: (button, isoDate, blocked) => {
      void menuDiaSemana(button, isoDate, blocked);
    }
  };
  var agendaSources = {
    /** The person whose agenda is shown (the user, or the colleague administration is looking at). */
    ownerId: () => agUid(),
    isOwnAgenda: () => agUid() === PERFIL.id,
    stripStart: () => CINTA_INI,
    /** «Tu día» of this date arrives already loaded (from Inicio). */
    hasPresetDay: (isoDate) => TD_PRESET?.fecha === isoDate,
    dayTasks: (isoDate) => tareasDelDia(isoDate),
    blockedDays: (fromIsoDate2, toIsoDate2) => bloqueadosSemanaBase(fromIsoDate2, toIsoDate2),
    setSuggestions: (isoDate, suggestions) => {
      AG_PEND = suggestions.pend;
      AG_SUG = { fecha: isoDate, toca: suggestions.toca, centros: suggestions.centros };
    }
  };
  var stripState = {
    start: () => CINTA_INI,
    setStart: (isoDate) => {
      CINTA_INI = isoDate;
    },
    weekOpen: () => AG_SEM_ABIERTA,
    setWeekOpen: (open) => {
      AG_SEM_ABIERTA = open;
    }
  };
  var agendaState = {
    setMode: (mode) => {
      AG_MODO = mode;
    },
    setSelectedDate: (isoDate) => {
      AG_FECHA = isoDate;
    },
    /** The last day the agenda was opened on «today» (to jump to the new today after midnight). */
    lastTodaySeen: () => AG_HOY_VISTO,
    setLastTodaySeen: (isoDate) => {
      AG_HOY_VISTO = isoDate;
    },
    forgetDayTasks: () => {
      TAREAS_DIA = null;
    },
    /** Someone asked to open Agenda straight on «Repartir la semana». */
    takeWeekPlanRequest: () => {
      const asked = ABRIR_PLAN_SEMANA;
      ABRIR_PLAN_SEMANA = false;
      return asked;
    },
    viewed: () => AG_VISTA
  };
  var salesTeam = {
    members: () => COMS,
    load: () => cargarComerciales(),
    currentUserId: () => PERFIL.id,
    showAgendaOf: (userId) => {
      void verAgendaDe(userId);
    }
  };
  var legacyAgendaPaint = {
    yourDay: () => pintarTuDia(),
    team: () => pintarEquipo(),
    noStartWarning: (element) => {
      avisoSinSalida(element);
    }
  };
  var weekPlanner = {
    draft: () => SEM_BORRADOR,
    discardDraft: () => {
      SEM_BORRADOR = null;
    },
    plan: (from, days, blocked, perDay) => {
      void planificarSemana(from, days, blocked, perDay);
    },
    saveDraft: (button) => {
      void guardarBorradorSemana(button);
    },
    /** Estimated end of a day (minutes) and the latest return time. */
    estimateDay: (list, isoDate) => estimarDia(list, isoDate),
    /** Opening windows of a person on a date: null when unknown, [] when they do not attend that day. */
    attendanceWindows: (days, isoDate) => ventanasDe(days, isoDate)
  };
  var notices = {
    toast: (message, isError = false) => {
      toast(message, isError);
    },
    confirm: (message, options) => preguntar(message, options),
    choose: (title, message, buttons) => elegirOpcion(title, message, buttons),
    askDate: (message, value2, options) => pedirFecha(message, value2, options),
    askTime: async (title, value2, ok) => await appVentana({ titulo: title, ok, campo: { valor: value2, tipo: "time" } })
  };
  var initialsOf = (name) => iniciales(name);
  var reloadAgenda = () => {
    void cargarAgenda();
  };
  var yourDayLegacy = {
    setDayAppointments: (list) => {
      TD_CITAS = list;
    },
    estimateDay: (list, isoDate) => estimarDia(list, isoDate),
    stopInfo: () => TD_INFO,
    explainWarning: (info) => explicarAviso(info),
    windowsText: (windows) => txtVentanas(windows),
    workingDay: () => jornadaActiva(),
    startWorkingDay: () => {
      void empezarJornada();
    },
    endWorkingDay: () => {
      void terminarJornada();
    },
    canRecordOn: (isoDate) => puedeRegistrarEnDia(isoDate),
    originText: (item) => textoOrigenCita(item),
    orderByDistance: (list) => {
      const ordered = ordenarPorCercania(list);
      return { list: ordered, left: ordenarPorCercania.fuera ?? 0 };
    },
    prepareRouteStops: (isoDate) => {
      try {
        prepararParadas(isoDate);
      } catch {
      }
    },
    markTraffic: () => {
      tdMarcaTrafico();
    },
    queuedVisits: () => colaLeer(),
    showDialog: (title, message, ok) => {
      void appVentana({ titulo: title, msg: message, ok, cancel: false });
    }
  };
  var legacyIcons = {
    line: (name) => SVA(ICU[name] ?? ""),
    arrow: (name) => ICO[name] ?? "",
    list: (name) => plIco(name)
  };
  var appointmentLegacy = {
    /** Writes through the offline queue (the change is kept if there is no connection). */
    write: (name, payload) => escribir(name, payload),
    writeRpc: (name, payload) => escribirRpc(name, payload),
    negativeResults: () => (CAT.resultado_visita ?? []).filter((item) => item.extra === "neg"),
    nextAttendanceDay: (days, from) => proximoDiaConsulta(days, from),
    navigateTo: (point) => {
      void navegarA(point);
    },
    recordVisit: (accountId, isoDate) => {
      VISITA_FECHA = isoDate;
      void abrirVisita(accountId);
    },
    openAccountFromCentre: (accountId, centre) => {
      FICHA_CENTRO = centre ?? null;
      void abrirFicha(accountId);
    },
    newDateAfterAbsent: (item) => nuevaFechaTrasNoEstaba(item),
    dayLabel: (isoDate) => diaCita(isoDate),
    lastDayData: () => TD_ULTIMO && TD_ULTIMO.fecha === AG_FECHA ? TD_ULTIMO.data ?? null : null,
    isJoinedDayView: () => agUnida(),
    /** Opens the sheet through its global name, so «‹ Volver» (legado 126) records it. */
    openSheet: (item) => {
      void window.verCita(item);
    }
  };
  var agendaCache = {
    /** Forgets the cached agenda reads, so the next paint asks the database. */
    forget: () => {
      for (const key of [...RC.keys()]) if (key.startsWith("agenda_")) {
        RC.delete(key);
        RC_VUELO.delete(key);
      }
    },
    /** Forgets the cached read of one day (its key in rpcCache). */
    forgetDay: (isoDate) => {
      RC.delete(`agenda-${isoDate}`);
    },
    /** The next «Tu día» paint of `isoDate` uses this data (no network), and it becomes the last painted day. */
    preset: (isoDate, data) => {
      TD_PRESET = { fecha: isoDate, data };
      TD_ULTIMO = { fecha: isoDate, data };
    },
    lastPainted: (isoDate) => TD_ULTIMO?.fecha === isoDate ? TD_ULTIMO.data ?? null : null,
    setLastPainted: (isoDate, data) => {
      TD_ULTIMO = { fecha: isoDate, data };
    },
    /** Every day read alone (agenda_rango of one day), as it arrived. */
    dayData: (isoDate) => AG_DIAS_DATOS[isoDate],
    /** What is saved from now on is already shown: closing a dialog will not refresh again. */
    markDialogSeen: () => {
      DLG_EPOCA = RC_EPOCA;
    },
    dayTasks: (isoDate) => TAREAS_DIA?.f === isoDate ? TAREAS_DIA.l : null,
    setDayTasks: (isoDate, list) => {
      TAREAS_DIA = list ? { f: isoDate, l: list } : null;
    }
  };
  var routeBar = { paint: () => {
    void pintarRutaBarra();
  } };
  var editorLegacy = {
    pickAccount: (element, value2, onPick) => {
      selectorMedico(element, { valor: value2, alElegir: onPick });
    },
    recentContacts: (accountId, isoDate) => recientesDe([accountId], isoDate).then((found) => found[accountId] ?? []),
    recentText: (list) => txtReciente(list),
    turnOffRecentNotice: () => guardarAvisoRevisita({ ...avisoRevisita(), on: false }),
    centreFromCard: () => FICHA_CENTRO,
    viewedUserId: () => currentScreen() === "agenda" && AG_VISTA ? AG_VISTA.id : null
  };
  var accountCardLegacy = {
    shownId: () => FICHA_ID,
    setShownId: (id) => {
      FICHA_ID = id;
    },
    forgetPatients: () => {
      FICHA_PAC = null;
    },
    forgetCentreFromAppointment: () => {
      FICHA_CENTRO = null;
    },
    planIncludes: (section) => planIncluyeSeccion(section),
    canEditType: (type) => puedeEditarTipo(type),
    /** The base sections, in their legacy order (each one paints a block of the card). */
    base: { access: fichaAcceso },
    customFields: (id, container) => bloqueCampos("cuentas", id, container),
    portal: (id) => fichaPortal(id),
    centreProducts: (id) => fichaProductosCentro(id),
    cycle: (id) => cicFicha(id)
  };
  var relatedLegacy = {
    openVisitPhotos: (activityId, accountId) => {
      void verFotosVisita(activityId, accountId);
    },
    openEvent: (id) => {
      void verEvento(id);
    },
    openDeposit: (accountId, name) => {
      void verDeposito(accountId, name);
    },
    expiresSoon: (isoDate) => depCaducaPronto(isoDate),
    openSurgery: (id) => {
      void verCirugia(id);
    },
    surgeryPill: (surgery) => cirEstado(surgery),
    openTender: (id) => {
      void verConcurso(id);
    },
    tenderDaysLeft: (tender) => conQuedan(tender),
    tenderEnd: (tender) => conVence(tender),
    tenderPill: (state) => conPill(state),
    openEquipment: (id) => {
      void verEquipo(id);
    },
    newEquipment: (account) => {
      void editarEquipo(null, account);
    },
    equipmentPill: (equipment2) => eqRevPill(equipment2)
  };
  var cardBaseLegacy = {
    visitBlock: (account, consultations, visits) => fichaVisitaHTML(account, consultations, visits),
    visitConsultation: (consultations) => consultaDeLaVisita(consultations),
    states: () => estados(),
    canRecord: () => puedeRegistrar(),
    canEdit: () => puedeEditar(),
    directionsAttribute: (point) => navAttr(point),
    editVisit: (visit, accountId) => {
      void editarVisita(visit, accountId);
    },
    unitsChart: (units2, series) => sparkUnidades(units2, series),
    unitsLegend: (series) => leyendaUnidades(series),
    unitsSeries: () => UDS_SERIES,
    unitsSeriesChosen: () => UDS_SERIE,
    chooseUnitsSeries: (series) => {
      UDS_SERIE = series;
      try {
        localStorage.setItem("dlc-uds-serie", series);
      } catch {
      }
    },
    missingTimetable: (id) => faltaHorario(id),
    openEditor: (id) => {
      void abrirEditor(id);
    }
  };
  var cardSectionsLegacy = {
    can: (capability) => puede(capability),
    /** Sales level of the user (area V). */
    salesArea: () => PERFIL.areas?.V ?? 0,
    roleCan: (role, capability) => rolPuede(role, capability),
    openPatient: (id) => {
      void fichaPaciente(id);
    },
    /** Opens Pacientes filtered by this account. */
    patientsOf: (accountId, name) => {
      Object.assign(PAC, { q: "", medico: accountId, medicoNombre: name, pagina: 0 });
      goTo("pacientes");
    },
    visitDetails: (visit) => detTxt(visit),
    fieldName: (field) => campoTxt(field),
    valueText: (value2) => textoValor(value2),
    detailSummary: (detail) => resumenDetalle(detail),
    undo: (id, then) => {
      void deshacerUno(id, then);
    }
  };

  // src/app/services/dates.ts
  function toIsoDate(date) {
    return new Date(date.getTime() - date.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
  }
  function todayIso() {
    return toIsoDate(/* @__PURE__ */ new Date());
  }
  function addDays(isoDate, days) {
    const date = /* @__PURE__ */ new Date(`${isoDate}T12:00:00`);
    date.setDate(date.getDate() + days);
    return toIsoDate(date);
  }
  function fromIsoDate(isoDate) {
    return /* @__PURE__ */ new Date(`${isoDate}T12:00:00`);
  }
  function mondayOf(isoDate) {
    const date = fromIsoDate(isoDate);
    return addDays(isoDate, -((date.getDay() + 6) % 7));
  }
  function formatMinutes(minutes) {
    return `${String(Math.floor(minutes / 60) % 24).padStart(2, "0")}:${String(Math.round(minutes) % 60).padStart(2, "0")}`;
  }
  function formatDuration(milliseconds) {
    const minutes = Math.floor(milliseconds / 6e4);
    return `${minutes >= 60 ? `${Math.floor(minutes / 60)} h ` : ""}${minutes % 60} min`;
  }

  // src/app/services/date-format.ts
  var locale = () => t("dates.locale");
  function formatShortDate(isoDate) {
    return (/* @__PURE__ */ new Date(`${isoDate}T00:00:00`)).toLocaleDateString(locale(), { day: "numeric", month: "short" });
  }
  function formatMonth(month) {
    const [year = "", number = "1"] = month.split("-");
    return `${t("dates.monthsLong").split(",")[Number(number) - 1] ?? ""} ${year}`;
  }
  function weekdayName(isoDate) {
    return fromIsoDate(isoDate).toLocaleDateString(locale(), { weekday: "long" });
  }
  function shortMonthNames() {
    return range(12).map((index) => new Date(2026, index, 15).toLocaleDateString(locale(), { month: "short" }).replace(".", ""));
  }
  var capitalise = (text) => text.charAt(0).toUpperCase() + text.slice(1);
  function formatLongDate(isoDate) {
    return fromIsoDate(isoDate).toLocaleDateString(locale(), { weekday: "long", day: "numeric", month: "long" });
  }
  function formatMonthYear(isoDate) {
    return fromIsoDate(isoDate).toLocaleDateString(locale(), { month: "long", year: "numeric" });
  }
  function monthNameOf(isoDate) {
    return fromIsoDate(isoDate).toLocaleDateString(locale(), { month: "long" });
  }
  function formatDayMonth(isoDate) {
    return fromIsoDate(isoDate.slice(0, 10)).toLocaleDateString(locale(), { day: "numeric", month: "long" });
  }

  // src/app/services/format.ts
  var HTML_ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  function escapeHtml(value2) {
    return String(value2 ?? "").replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);
  }
  function formatNumber(value2) {
    return Number(value2 ?? 0).toLocaleString("es");
  }
  function formatEuros(value2) {
    return `${Math.round(Number(value2) || 0).toLocaleString("es-ES")} €`;
  }
  function looseText(text) {
    return String(text ?? "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }

  // src/app/screens/accounts/card/base.ts
  var WORKDAYS = ["L", "M", "X", "J", "V"];
  var SHOWN_VISITS = 10;
  var SKELETON = '<div class="skel" style="width:50%"></div><div class="skel"></div><div class="skel" style="width:80%"></div>';
  var body = () => document.getElementById("fbody");
  function headerHtml(account) {
    const urgent = account.urgente ? `<span class="pill p-urg">${t("accounts.base.urgent")}</span> ` : "";
    const noReporting = account.sin_reporting ? `<span class="pill p-sr" title="${t("accounts.base.noReportingTitle", { visit: term("visita") })}">${t("accounts.base.noReporting")}</span> ` : "";
    return `<div class="fh">
      <div><h2>${urgent}${noReporting}${escapeHtml(account.nombre)}</h2>
        <div class="sm">${escapeHtml(account.especialidad ?? "")}${account.area ? ` · ${escapeHtml(account.area)}` : ""}${t("accounts.base.code", { code: escapeHtml(account.codigo) })}</div></div>
      <button class="x" id="fx" aria-label="${t("common.close")}">✕</button>
    </div>`;
  }
  function actionsHtml(account) {
    const record = cardBaseLegacy.canRecord(), edit = accountCardLegacy.canEditType(account.tipo);
    if (!record && !edit) return "";
    return `<div class="acts">
      ${record ? `<button class="btn" data-act="visita" data-id="${account.id}">${t("accounts.base.record", { visit: term("visita") })}</button>` : ""}
      ${edit ? `<button class="btn sec" data-act="editar" data-id="${account.id}">${t("accounts.base.edit")}</button>` : ""}
      ${edit ? `<button class="btn ${account.urgente ? "sec" : "warn"}" data-act="urgente" data-id="${account.id}" data-urg="${account.urgente ? 1 : 0}">${t(account.urgente ? "accounts.base.unmarkUrgent" : "accounts.base.markUrgent")}</button>` : ""}
      <button class="btn sec" data-agendar="${account.id}">${t("accounts.base.addToAgenda")}</button>
    </div>`;
  }
  function stateHtml(account, salesReps) {
    const state = cardBaseLegacy.canEdit() ? `<select data-estado="${account.id}" style="max-width:240px">${cardBaseLegacy.states().map((value2) => `<option ${value2 === account.estado_comercial ? "selected" : ""}>${escapeHtml(value2)}</option>`).join("")}</select>` : `<span class="pill p-est">${escapeHtml(account.estado_comercial)}</span>`;
    return `<div class="blk"><h3>${t("accounts.card.stateTitle")}</h3>
      <div>${state}</div>
      ${salesReps.length ? `<div class="sm" style="margin-top:6px">${t("accounts.base.salesRep", { names: salesReps.map(escapeHtml).join(", ") })}</div>` : ""}
    </div>`;
  }
  function consultationHtml(consultation) {
    const days = consultation.dias ?? {};
    const address = escapeHtml([consultation.direccion, consultation.cp, consultation.municipio].filter(Boolean).join(", "));
    const room = [consultation.planta, consultation.sala].filter(Boolean).join(" · ");
    return `<div class="blk"><h3>${escapeHtml(orFallback(consultation.centro_nombre, term("consulta", { capital: "C", adjective: "privado" })))}</h3>
      <div>${address || `<span class="sm">${t("accounts.base.noAddress")}</span>`}</div>
      ${room ? `<div class="sm">${escapeHtml(room)}</div>` : ""}
      ${consultation.indicaciones ? `<div class="sm">${escapeHtml(consultation.indicaciones)}</div>` : ""}
      ${consultation.telefono ? `<div class="sm">${t("accounts.base.phone", { phone: escapeHtml(consultation.telefono) })}</div>` : ""}
      <div class="dias" style="margin-top:8px">${WORKDAYS.map((day) => `<span class="${days[day] ? "on" : ""}">${day}</span>`).join("")}</div>
      ${WORKDAYS.filter((day) => days[day]).map((day) => `<div class="sm">${day}: ${escapeHtml(days[day])}</div>`).join("")}
      ${consultation.lat ? `<div class="sm" style="margin-top:6px"><button class="lnk" type="button" data-nav="${cardBaseLegacy.directionsAttribute([consultation.lat, consultation.lon ?? 0])}">${t("accounts.base.directions")}</button></div>` : ""}
    </div>`;
  }
  function visitHtml(visit, canRecord) {
    const mode = visit.modo === "telefono" ? t("accounts.base.byPhone") : visit.modo === "video" ? t("accounts.base.byVideo") : "";
    const results = orFallback((visit.resultados ?? []).join(" + "), t("accounts.base.noResult"));
    return `<div data-vrow="${visit.id}" style="padding:7px 0;border-top:1px solid var(--line);display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
        <span><b>${formatShortDate(visit.fecha)}</b>${mode} · ${escapeHtml(results)}
          ${visit.muestras ? t("accounts.base.samples", { count: visit.muestras }) : ""}
          ${visit.nota ? `<div class="sm">${escapeHtml(visit.nota)}</div>` : ""}
          ${visit.proxima_fecha ? `<div class="sm">${t("accounts.base.next", { date: formatShortDate(visit.proxima_fecha), action: escapeHtml(visit.proxima_accion ?? "") })}</div>` : ""}</span>
        ${canRecord ? `<button class="btn sec chico" data-editv='${escapeHtml(JSON.stringify(visit))}'>${t("accounts.base.editVisit")}</button>` : ""}
      </div>`;
  }
  function visitsHtml(visits) {
    const canRecord = cardBaseLegacy.canRecord();
    const list = visits.length ? visits.slice(0, SHOWN_VISITS).map((visit) => visitHtml(visit, canRecord)).join("") : `<div class="sm">${t("accounts.base.noVisits", { visits: term("visita", { number: "p", adjective: "registrado" }) })}</div>`;
    return `<div class="blk"><h3>${term("visita", { number: "p", capital: "C" })}</h3>
      ${list}</div>`;
  }
  function cardHtml(data, cached) {
    const account = data.medico, consultations = data.consultas ?? [], visits = data.visitas ?? [];
    const forVisit = cardBaseLegacy.visitConsultation(consultations);
    return `${cached ? `<div class="cacheaviso">${t("accounts.base.cachedNotice")}</div>` : ""}
    ${headerHtml(account)}
    ${actionsHtml(account)}
    ${cardBaseLegacy.visitBlock(account, consultations, visits)}
    ${stateHtml(account, data.comerciales ?? [])}
    ${consultations.filter((consultation) => consultation !== forVisit).map(consultationHtml).join("")}
    ${visitsHtml(visits)}
    <div id="fzcampos"></div>
    <section class="blk fventas" id="fventas"><h3>${t("accounts.base.salesTitle", { patients: term("paciente", { number: "p" }) })}</h3><div id="fventasc"></div></section>`;
  }
  async function paintBase(id) {
    const box = body(), card = document.getElementById("ficha");
    if (!box || !card) return;
    accountCardLegacy.setShownId(id);
    box.innerHTML = SKELETON;
    card.showModal();
    const result = await cachedRpc("ficha_cuenta", { p_id: id }, `ficha-${id}`);
    const data = result.data, account = data?.medico;
    if (!data || !account) {
      box.innerHTML = `<p class="sm">${t("accounts.base.noConnection")}</p>`;
      return;
    }
    box.innerHTML = cardHtml({ ...data, medico: account }, Boolean(result.cache));
    const close2 = document.getElementById("fx");
    if (close2) close2.onclick = () => {
      card.close();
    };
    box.querySelectorAll("[data-editv]").forEach((button) => {
      button.onclick = () => {
        cardBaseLegacy.editVisit(JSON.parse(button.dataset.editv ?? "{}"), id);
      };
    });
  }

  // src/app/screens/accounts/card/card-tools.ts
  var stillShown = (id) => accountCardLegacy.shownId() === id;
  var fieldsPlace = () => document.getElementById("fzcampos");
  function addBeforeFields(id, blockId, html) {
    const place = fieldsPlace();
    if (!place || document.getElementById(blockId) || !stillShown(id)) return null;
    place.insertAdjacentHTML("beforebegin", html);
    return document.getElementById(blockId);
  }
  function closeCardAnd(open) {
    document.getElementById("ficha")?.close();
    open();
  }
  function onEach(block, key, action) {
    block.querySelectorAll(`[data-${key}]`).forEach((button) => {
      button.onclick = () => {
        action(button.getAttribute(`data-${key}`) ?? "");
      };
    });
  }
  async function accountKind(id) {
    const { data } = await legacyDb().from("cuentas").select("tipo, nombre, centro_id, archivado_en").eq("id", id).maybeSingle();
    return data;
  }
  var historyRows = () => [...document.querySelectorAll("#fbody [data-vrow]")];

  // src/app/screens/accounts/card/sections-account.ts
  var CENTRE = "Centro";
  var DELETE_LEVEL = 3;
  async function cycle(id) {
    if (permissions.isProfessionalPortal() || document.getElementById("fciclo") || !stillShown(id)) return;
    const state = [...document.querySelectorAll("#fbody .blk > h3")].find((heading) => heading.textContent?.trim() === t("accounts.card.stateTitle"));
    if (!state?.parentElement) return;
    state.parentElement.insertAdjacentHTML("beforeend", '<div class="fciclo" id="fciclo"></div>');
    await accountCardLegacy.cycle(id);
  }
  async function centreProfessionals(id) {
    const account = await accountKind(id), body2 = document.getElementById("fbody");
    if (account?.tipo !== CENTRE || !account.centro_id || !body2 || !stillShown(id) || document.getElementById("fcentrop")) return;
    const professionals = escapeHtml(term("medico", { number: "p" }));
    (body2.querySelector(".fh") ?? body2.firstElementChild)?.insertAdjacentHTML("afterend", `<div class="blk" id="fcentrop"><div class="fcentropf"><span>${t("accounts.card.centreProfessionals", { professionals })}</span>
        <button type="button" class="btn sec chico" data-fcver="${account.centro_id}">${t("accounts.card.seeCentreProfessionals", { professionals })}</button></div></div>`);
  }
  async function archiveButtons(id) {
    const account = await accountKind(id), body2 = document.getElementById("fbody");
    if (!account || !body2 || !stillShown(id) || document.getElementById("fbajablk") || !accountCardLegacy.canEditType(account.tipo)) return;
    const status = account.archivado_en ? `<button type="button" class="btn sec chico" data-falta="${id}">${t("accounts.card.reactivate")}</button>` : `<button type="button" class="btn sec chico" data-fbaja="${id}">${t("accounts.card.archive")}</button>`;
    body2.insertAdjacentHTML("beforeend", `<div class="blk fbajablk" id="fbajablk"><div class="acts">
      ${status}
      ${permissions.levelOf("M") >= DELETE_LEVEL ? `<button type="button" class="btn sec dang chico" data-felim="${id}">${t("accounts.card.delete")}</button>` : ""}</div></div>`);
  }

  // src/app/screens/accounts/card/sections-admin.ts
  var HISTORY_LIMIT = 100;
  var VALUE_LENGTH = 40;
  var EDIT = "Edición";
  function changeLines(entry) {
    const detail = entry.detalle;
    if (entry.accion !== EDIT || !detail || typeof detail !== "object") return `<span class="sm">${escapeHtml(cardSectionsLegacy.detailSummary(detail))}</span>`;
    const value2 = (raw) => escapeHtml(orFallback(cardSectionsLegacy.valueText(raw).slice(0, VALUE_LENGTH), "—"));
    return Object.entries(detail).filter((pair) => Array.isArray(pair[1]) && pair[1].length === 2).map(([field, [before, after]]) => `<span class="sm">${escapeHtml(cardSectionsLegacy.fieldName(field))}: ${value2(before)} → ${value2(after)}</span>`).join("");
  }
  function historyRow(entry) {
    const when = new Date(entry.creado_en).toLocaleString(t("dates.locale"), { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    return `<div class="item" style="cursor:default"><span class="tx">
        <b>${escapeHtml(entry.accion)}${entry.entidad === "ubicaciones" ? ` · ${term("consulta")}` : ""}</b>
        <span class="sm">${escapeHtml(entry.usuario)} · ${when}</span>
        ${changeLines(entry)}</span>${entry.deshacible ? `<button type="button" class="btn sec" data-fhx="${entry.id}">${t("accounts.history.undo")}</button>` : ""}</div>`;
  }
  async function changeHistory(id) {
    if (!cardSectionsLegacy.can("administrar") || !stillShown(id) || !document.getElementById("fbody") || document.getElementById("fhist")) return;
    const { data } = await callRpc("historial_entidad", { p_entidad: "cuentas", p_id: id, lim: HISTORY_LIMIT });
    const list = Array.isArray(data) ? data : [], body2 = document.getElementById("fbody");
    if (!stillShown(id) || !body2 || document.getElementById("fhist")) return;
    body2.insertAdjacentHTML("beforeend", `<details class="blk" id="fhist"><summary>${t("accounts.history.title")} <span class="n">${formatNumber(list.length)}</span></summary>
    <div class="lista">${list.map(historyRow).join("") || `<div class="sm">${t("accounts.history.none")}</div>`}</div></details>`);
    document.querySelectorAll("#fhist [data-fhx]").forEach((button) => {
      button.onclick = () => {
        cardSectionsLegacy.undo(Number(button.dataset.fhx), () => {
          agendaActions.openAccount(id);
        });
      };
    });
  }
  var PORTAL_DAYS = ["L", "M", "X", "J", "V", "S"];
  function timetableText(days) {
    const names = t("dates.weekdaysLong").split(",");
    return PORTAL_DAYS.map((day, index) => days?.[day] ? `${capitalise(names[index] ?? "").slice(0, 3)} ${escapeHtml(days[day])}` : "").filter(Boolean).join(" · ") || t("accounts.proposal.noTimetable");
  }
  var difference = (label, now, proposed) => proposed && proposed !== now ? `<div class="fpdif"><span class="sm">${label}</span><span>${now ? `<s>${escapeHtml(now)}</s> → ` : ""}<b>${escapeHtml(proposed)}</b></span></div>` : "";
  function proposalHtml(proposal, account, canEdit) {
    const data = proposal.datos ?? {}, visits = data.visitas;
    const sentAt = new Date(proposal.modificado_en).toLocaleString(t("dates.locale"), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    const consultations = (data.consultas ?? []).map((item) => `<div class="fpcon"><b>${escapeHtml(orFallback(item.nombre, term("consulta", { capital: "C" })))}</b> ${item.centro_id || item.ubicacion_id ? "" : `<span class="pill p-per">${t("accounts.proposal.newCentre")}</span>`}
      <span class="sm">${escapeHtml([item.direccion, item.municipio].filter(Boolean).join(" · "))}</span><span class="sm">${timetableText(item.dias)}</span></div>`).join("");
    const visitWay = visits && (visits.como || visits.momento) ? `<div class="fpdif"><span class="sm">${term("visita", { number: "p", capital: "C" })}</span><span>${escapeHtml([visits.como, visits.momento].filter(Boolean).join(" · "))}</span></div>` : "";
    return `<section class="blk fprop" id="fprop"><h3>${t("accounts.proposal.title")} <span class="pill p-warn">${t("accounts.proposal.toReview")}</span></h3>
    <p class="sm">${t("accounts.proposal.sent", { who: escapeHtml(orFallback(proposal.quien, term("medico", { article: "el", capital: "C" }))), date: sentAt })}</p>
    ${difference(t("accounts.proposal.phone"), account.telefono, data.telefono)}${difference(t("accounts.proposal.email"), account.email, data.email)}
    ${consultations}
    ${visitWay}
    ${data.notas ? `<div class="fpdif"><span class="sm">${t("accounts.proposal.notes")}</span><span>${escapeHtml(data.notas)}</span></div>` : ""}
    <div class="acts" style="justify-content:flex-start;margin:8px 0 0">${canEdit ? `<button type="button" class="btn sec" id="fpropedit">${t("accounts.proposal.edit")}</button>` : ""}
      <button type="button" class="btn" id="fpropok">${t("accounts.proposal.reviewed")}</button></div></section>`;
  }
  async function markReviewed(proposal) {
    const { data: result } = await legacyDb().rpc("revisar_propuesta", { p_id: proposal.id });
    if (!result?.ok) {
      notices.toast(t(result?.error === "permiso" ? "accounts.proposal.noPermission" : "accounts.proposal.couldNotMark"), true);
      return;
    }
    notices.toast(t("accounts.proposal.marked"));
    document.getElementById("fprop")?.remove();
  }
  var canShowProposal = (id) => stillShown(id) && Boolean(document.getElementById("fbody")) && !document.getElementById("fprop");
  async function portalProposal(id) {
    if (permissions.isProfessionalPortal() || !canShowProposal(id)) return;
    const { data: proposal } = await callRpc("ficha_propuesta", { p_cuenta: id });
    if (!proposal || !canShowProposal(id)) return;
    const card = await cachedRpc("ficha_cuenta", { p_id: id }, `ficha-${id}`), body2 = document.getElementById("fbody");
    if (!body2) return;
    const edit = body2.querySelector("[data-act=editar]");
    const html = proposalHtml(proposal, card.data?.medico ?? {}, Boolean(edit));
    const first = [...body2.children].find((child) => child.matches(".blk, section, .card") && child.id !== "fprop");
    if (first) first.insertAdjacentHTML("beforebegin", html);
    else body2.insertAdjacentHTML("beforeend", html);
    bindProposal(body2, proposal);
  }
  function bindProposal(body2, proposal) {
    const editButton = document.getElementById("fpropedit");
    if (editButton) editButton.onclick = () => {
      body2.querySelector("[data-act=editar]")?.click();
    };
    const ok = document.getElementById("fpropok");
    if (ok) ok.onclick = () => {
      void markReviewed(proposal);
    };
  }

  // src/app/screens/accounts/card/sections-base.ts
  async function timetableNotice(id) {
    const header = document.querySelector("#fbody .fh");
    if (!stillShown(id) || !header) return;
    if (!await cardBaseLegacy.missingTimetable(id) || !stillShown(id) || document.getElementById("fhorario")) return;
    document.querySelector("#fbody .fh")?.insertAdjacentHTML("afterend", `<div class="avisoh" id="fhorario">
    <span>${t("accounts.base.timetableMissing")}</span>
    ${cardBaseLegacy.canEdit() ? `<button class="btn sec" id="fhcompletar">${t("accounts.base.completeTimetable")}</button>` : ""}</div>`);
    const complete = document.getElementById("fhcompletar");
    if (complete) complete.onclick = () => {
      cardBaseLegacy.openEditor(id);
    };
  }
  var PERIODS = [
    ["accounts.base.unitsToday", "hoy"],
    ["accounts.base.unitsWeek", "semana"],
    ["accounts.base.unitsMonth", "mes"],
    ["accounts.base.unitsQuarter", "trimestre"],
    ["accounts.base.unitsYear", "anio"],
    ["accounts.base.unitsTotal", "total"]
  ];
  function unitsHtml(units2, series) {
    const prescriptions = (count2) => term("pauta", { number: count2 === 1 ? "s" : "p" });
    const summary = units2.total ? `${t("accounts.base.unitsSummary", { count: formatNumber(units2.pautas), prescriptions: prescriptions(units2.pautas), date: formatShortDate(units2.ultima) })}<span id="fusley">${cardBaseLegacy.unitsLegend(series)}</span>` : t("accounts.base.noPrescriptions", { prescriptions: term("pauta", { number: "p" }) });
    const choices = units2.total ? `<div class="segs" id="fuserie" role="group" aria-label="${t("accounts.base.evolution")}">${cardBaseLegacy.unitsSeries().map(([key, label]) => `<button type="button" data-us="${key}" class="${key === series ? "on" : ""}">${label}</button>`).join("")}</div>` : "";
    return `<div class="blk" id="fundades"><h3>${t("accounts.base.unitsTitle")}</h3>
    <div class="uper">${PERIODS.map(([label, key]) => `<div><b>${formatNumber(units2[key])}</b><span>${t(label)}</span></div>`).join("")}</div>
    ${choices}
    <div class="spark" id="fuspark">${cardBaseLegacy.unitsChart(units2, series)}</div>
    <div class="sm">${summary}</div></div>`;
  }
  async function units(id) {
    const box = document.getElementById("fbody");
    if (!stillShown(id) || !box || document.getElementById("fundades")) return;
    const { data } = await callRpc("unidades_cuenta", { p_medico: id });
    if (!data || !stillShown(id) || document.getElementById("fundades")) return;
    const html = unitsHtml(data, cardBaseLegacy.unitsSeriesChosen()), sales = document.getElementById("fventasc");
    if (sales) sales.insertAdjacentHTML("afterbegin", html);
    else (box.querySelector(".blk:nth-of-type(2)") ?? box.lastElementChild)?.insertAdjacentHTML("beforebegin", html);
    box.querySelectorAll("#fuserie [data-us]").forEach((button) => {
      button.onclick = () => {
        const series = button.dataset.us ?? "mes";
        cardBaseLegacy.chooseUnitsSeries(series);
        box.querySelectorAll("#fuserie [data-us]").forEach((other) => other.classList.toggle("on", other === button));
        const chart = document.getElementById("fuspark"), legend = document.getElementById("fusley");
        if (chart) chart.innerHTML = cardBaseLegacy.unitsChart(data, series);
        if (legend) legend.textContent = cardBaseLegacy.unitsLegend(series);
      };
    });
  }

  // src/app/screens/accounts/card/sections-history.ts
  async function visitPhotos(id) {
    const rows = historyRows();
    if (!rows.length) return;
    const { data } = await legacyDb().from("actividad_fotos").select("actividad_id").in("actividad_id", rows.map((row2) => row2.dataset.vrow));
    const counts = /* @__PURE__ */ new Map();
    (data ?? []).forEach((photo) => {
      counts.set(photo.actividad_id, (counts.get(photo.actividad_id) ?? 0) + 1);
    });
    rows.forEach((row2) => {
      if (row2.querySelector("[data-vfotos]")) return;
      const count2 = counts.get(row2.dataset.vrow ?? "") ?? 0, place = row2.querySelector("span");
      if (!place || !count2 && !row2.querySelector("[data-editv]")) return;
      const label = count2 ? count2 === 1 ? t("accounts.card.photo") : t("accounts.card.photos", { count: count2 }) : t("accounts.card.addPhotos");
      place.insertAdjacentHTML("beforeend", `<div><button type="button" class="lnk vfotoslnk" data-vfotos="${row2.dataset.vrow ?? ""}">${icon("camera")} ${label}</button></div>`);
    });
    document.querySelectorAll("#fbody [data-vfotos]").forEach((button) => {
      button.onclick = () => {
        relatedLegacy.openVisitPhotos(button.dataset.vfotos ?? "", id);
      };
    });
  }
  async function presentedProducts(id) {
    const rows = historyRows();
    if (!rows.length || document.querySelector("#fbody .vprodtx")) return;
    const { data } = await legacyDb().from("actividades").select("id,productos").in("id", rows.map((row2) => row2.dataset.vrow));
    const ids = [...new Set((data ?? []).flatMap((visit) => visit.productos ?? []))];
    if (!ids.length || !stillShown(id)) return;
    const { data: products } = await legacyDb().from("productos").select("id,nombre").in("id", ids);
    const names = new Map((products ?? []).map((product) => [product.id, product.nombre]));
    (data ?? []).forEach((visit) => {
      const row2 = document.querySelector(`#fbody [data-vrow="${visit.id}"]`), place = row2?.querySelector("span");
      const presented = (visit.productos ?? []).map((product) => names.get(product)).filter((name) => Boolean(name));
      if (place && presented.length && !row2?.querySelector(".vprodtx")) place.insertAdjacentHTML("beforeend", `<div class="sm vprodtx">${t("accounts.card.presented", { list: presented.map(escapeHtml).join(", ") })}</div>`);
    });
  }
  function visitMaterial(id) {
    if (!stillShown(id)) return Promise.resolve();
    document.querySelectorAll("#fbody [data-editv]").forEach((button) => {
      let visit;
      try {
        visit = JSON.parse(button.dataset.editv ?? "");
      } catch {
        return;
      }
      const text = cardSectionsLegacy.visitDetails(visit);
      if (!text) return;
      const place = button.parentElement?.querySelector(":scope > span");
      if (place && !place.querySelector(".vdet")) place.insertAdjacentHTML("beforeend", `<div class="sm vdet">📎 ${escapeHtml(text)}</div>`);
    });
    return Promise.resolve();
  }

  // src/app/screens/accounts/card/sections-related.ts
  var ATTENDED = "Asistió";
  var NOT_ATTENDED = "No asistió";
  var AWARDED = "Adjudicado";
  var INSTALLED = "Instalado";
  var CENTRE2 = "Centro";
  var OPEN_TENDERS = ["En estudio", "Oferta enviada", AWARDED];
  var SHOWN_EVENTS = 5;
  var canAdd = (blockId, section) => Boolean(fieldsPlace()) && !document.getElementById(blockId) && (!section || accountCardLegacy.planIncludes(section));
  async function samples(id) {
    if (!canAdd("fmuestras")) return;
    const { data } = await legacyDb().rpc("muestras_de_cuenta", { p_cuenta: id });
    if (!Array.isArray(data) || !data.length) return;
    const pill = (sample) => {
      if (!sample.en_plazo) return `<span class="pill p-anu">${t("accounts.card.samplesOutOfTime")}</span>`;
      return sample.quedan ? "" : `<span class="pill p-warn">${t("accounts.card.samplesNoneLeft")}</span>`;
    };
    addBeforeFields(id, "fmuestras", `<div class="blk" id="fmuestras"><h3>${t("accounts.card.samplesTitle")}</h3>
      ${data.map((sample) => `<div class="fmrow"><span>${escapeHtml(sample.nombre)}</span><b>${t("accounts.card.samplesGiven", { given: sample.entregadas, max: sample.max })}</b>${pill(sample)}</div>`).join("")}</div>`);
  }
  async function events(id) {
    if (!canAdd("feventos", "eventos")) return;
    const { data } = await legacyDb().from("eventos_asistentes").select("estado,eventos(id,titulo,fecha)").eq("cuenta_id", id).limit(30);
    const list = (data ?? []).filter((item) => item.eventos !== null).sort((first, second) => String(second.eventos.fecha).localeCompare(String(first.eventos.fecha))).slice(0, SHOWN_EVENTS);
    if (!list.length) return;
    const pillClass = (state) => state === ATTENDED ? "p-est" : state === NOT_ATTENDED ? "p-anu" : "p-per";
    const block = addBeforeFields(id, "feventos", `<div class="blk" id="feventos"><h3>${t("accounts.card.eventsTitle")}</h3>
      ${list.map((item) => `<div class="fmrow"><span><button type="button" class="lnk" data-fev="${item.eventos.id}">${escapeHtml(item.eventos.titulo)}</button><span class="sm"> · ${formatShortDate(item.eventos.fecha)}</span></span><span class="pill ${pillClass(item.estado)}">${escapeHtml(item.estado)}</span></div>`).join("")}</div>`);
    if (block) onEach(block, "fev", (event) => {
      closeCardAnd(() => {
        relatedLegacy.openEvent(event);
      });
    });
  }
  function depositText(state) {
    const lines = (state.lineas ?? []).filter((line) => line.unidades > 0), total = sum(lines.map((line) => line.unidades));
    if (!state.existe || !total) return t("accounts.card.depositNone");
    const productCount = new Set(lines.map((line) => line.producto_id)).size, expiring = lines.filter((line) => relatedLegacy.expiresSoon(line.caducidad)).length;
    const products = productCount === 1 ? t("accounts.card.oneProduct") : t("accounts.card.products", { count: productCount });
    const soon = expiring ? ` · <b style="color:var(--warn)">${expiring === 1 ? t("accounts.card.oneBatchExpires") : t("accounts.card.batchesExpire", { count: expiring })}${t("accounts.card.inLessThan60Days")}</b>` : "";
    return t("accounts.card.depositUnits", { units: formatNumber(total), products }) + soon;
  }
  async function deposit(id) {
    if (!canAdd("fdeposito", "deposito")) return;
    const account = await accountKind(id);
    if (account?.tipo !== CENTRE2) return;
    const { data: state } = await legacyDb().rpc("deposito_estado", { p_cuenta: id });
    if (!state || state.ok === false || !canAdd("fdeposito") || !stillShown(id)) return;
    addBeforeFields(id, "fdeposito", `<div class="blk" id="fdeposito"><h3>${t("accounts.card.depositTitle")}</h3>
      <p class="sm">${depositText(state)}</p>
      <button type="button" class="btn sec" id="fdepabrir">${t(state.existe ? "accounts.card.depositOpen" : "accounts.card.depositLeave")}</button></div>`);
    const open = document.getElementById("fdepabrir");
    if (open) open.onclick = () => {
      closeCardAnd(() => {
        relatedLegacy.openDeposit(id, account.nombre ?? "");
      });
    };
  }
  async function surgeries(id) {
    if (permissions.isProfessionalPortal() || !canAdd("fcirugias", "cirugias")) return;
    const { data } = await legacyDb().from("cirugias").select("id,fecha,procedimiento,estado").or(`cirujano_id.eq.${id},hospital_id.eq.${id}`).order("fecha", { ascending: false }).limit(5);
    if (!(data ?? []).length) return;
    const block = addBeforeFields(id, "fcirugias", `<div class="blk" id="fcirugias"><h3>${t("accounts.card.surgeriesTitle")}</h3>
      ${(data ?? []).map((item) => `<div class="fmrow"><span><button type="button" class="lnk" data-fcir="${item.id}">${escapeHtml(orFallback(item.procedimiento, t("accounts.card.surgery")))}</button><span class="sm"> · ${formatShortDate(item.fecha)}</span></span>${relatedLegacy.surgeryPill(item)}</div>`).join("")}</div>`);
    if (block) onEach(block, "fcir", (surgery) => {
      closeCardAnd(() => {
        relatedLegacy.openSurgery(surgery);
      });
    });
  }
  function tenderEnd(tender) {
    const left = relatedLegacy.tenderDaysLeft(tender);
    if (tender.estado !== AWARDED || left === null) return "";
    return ` · ${left < 0 ? t("accounts.card.tenderExpired") : t("accounts.card.tenderExpiresOn", { date: formatShortDate(relatedLegacy.tenderEnd(tender) ?? "") })}`;
  }
  async function tenders(id) {
    if (permissions.isProfessionalPortal() || !canAdd("fconcursos", "concursos")) return;
    const { data } = await legacyDb().from("concursos").select("id,titulo,estado,fin,prorroga_hasta").eq("cuenta_id", id).in("estado", OPEN_TENDERS).order("creado_en", { ascending: false }).limit(6);
    if (!(data ?? []).length) return;
    const block = addBeforeFields(id, "fconcursos", `<div class="blk" id="fconcursos"><h3>${t("accounts.card.tendersTitle")}</h3>
      ${(data ?? []).map((item) => `<div class="fmrow"><span><button type="button" class="lnk" data-fcon="${item.id}">${escapeHtml(item.titulo)}</button>${tenderEnd(item) ? `<span class="sm">${tenderEnd(item)}</span>` : ""}</span>${relatedLegacy.tenderPill(item.estado)}</div>`).join("")}</div>`);
    if (block) onEach(block, "fcon", (tender) => {
      closeCardAnd(() => {
        relatedLegacy.openTender(tender);
      });
    });
  }
  function equipmentRow(item) {
    const details = (item.serie ? t("accounts.card.serial", { serial: escapeHtml(item.serie) }) : "") + (item.ubicacion ? ` · ${escapeHtml(item.ubicacion)}` : "");
    return `<div class="fmrow"><span><button type="button" class="lnk" data-feq="${item.id}">${escapeHtml(orFallback(item.productos?.nombre, t("accounts.card.equipment")))}</button><span class="sm">${details}</span></span>${relatedLegacy.equipmentPill(item)}</div>`;
  }
  async function equipment(id) {
    if (permissions.isProfessionalPortal() || !canAdd("fequipos", "parque")) return;
    const { data } = await legacyDb().from("equipos").select("id,serie,ubicacion,estado,contrato,contrato_fin,garantia_hasta,proxima_revision,productos(nombre)").eq("cuenta_id", id).eq("estado", INSTALLED).order("instalado", { ascending: false }).limit(20);
    if (!canAdd("fequipos") || !stillShown(id)) return;
    const list = data ?? [], account = await accountKind(id);
    if (!list.length && account?.tipo !== CENTRE2) return;
    const block = addBeforeFields(id, "fequipos", equipmentHtml(list));
    if (block) bindEquipment(block, id, account?.nombre ?? "");
  }
  function equipmentHtml(list) {
    return `<div class="blk" id="fequipos"><h3>${t("accounts.card.equipmentTitle")}${list.length ? ` <span class="n">${list.length}</span>` : ""}</h3>
      ${list.map(equipmentRow).join("") || `<p class="sm">${t("accounts.card.equipmentNone")}</p>`}
      <button type="button" class="btn sec" id="feqmas">${t("accounts.card.addEquipment")}</button></div>`;
  }
  function bindEquipment(block, id, name) {
    onEach(block, "feq", (item) => {
      closeCardAnd(() => {
        relatedLegacy.openEquipment(item);
      });
    });
    const add = document.getElementById("feqmas");
    if (add) add.onclick = () => {
      closeCardAnd(() => {
        relatedLegacy.newEquipment({ id, nombre: name });
      });
    };
  }

  // src/app/screens/accounts/card/sections-sales.ts
  var SHOWN_PATIENTS = 5;
  async function fillSalesReps(id) {
    const [{ data: users }, { data: current }] = await Promise.all([legacyDb().rpc("usuarios_lista"), callRpc("responsable_de_cuenta", { p_medico: id })]);
    const select = document.getElementById("fcomsel");
    if (!stillShown(id) || !select) return;
    const options = (users ?? []).filter((user) => user.activo && (cardSectionsLegacy.roleCan(user.rol, "cartera") || current?.id === user.id)).map((user) => `<option value="${user.id}" ${current?.id === user.id ? "selected" : ""}>${escapeHtml(user.nombre)} · ${escapeHtml(user.rol)}</option>`).join("");
    select.innerHTML = `<option value="">${t("accounts.sales.noRep")}</option>${options}`;
    const save3 = document.getElementById("fcomok");
    if (save3) save3.onclick = async () => {
      save3.disabled = true;
      const { data: result, error } = await legacyDb().rpc("asignar_responsable_cuenta", { p_medico: id, p_usuario: select.value || null });
      save3.disabled = false;
      if (error || result?.ok === false) {
        notices.toast(t("accounts.sales.couldNotAssign"), true);
        return;
      }
      notices.toast(t("accounts.sales.assigned"));
      agendaActions.openAccount(id);
    };
  }
  async function patients(id) {
    const { data } = await legacyDb().rpc("clientes_lista", { q: null, p_medico: id, lim: SHOWN_PATIENTS, desplaz: 0 });
    if (!stillShown(id) || !data?.total) return;
    const plural2 = term("paciente", { number: "p" });
    const rows = data.filas.map((row2) => `<button class="item" data-fmpac="${row2.id}"><span class="tx"><b>${escapeHtml(row2.nombre)}</b>
        <span class="sm">${t("accounts.sales.patientLine", { units: formatNumber(row2.unidades), orders: formatNumber(row2.pedidos) })}${row2.ultimo_pedido ? t("accounts.sales.lastOrder", { date: formatShortDate(row2.ultimo_pedido) }) : ""}</span></span></button>`).join("");
    (document.getElementById("fventasc") ?? document.getElementById("fbody"))?.insertAdjacentHTML("beforeend", `<div class="blk"><h3>${term("paciente", { number: "p", capital: "C" })}<span class="n" style="margin-left:6px">${formatNumber(data.total)}</span></h3>
      ${rows}
      ${data.total > SHOWN_PATIENTS ? `<button class="verlo" id="fmpactodos" style="border-radius:8px;margin-top:6px">${t("accounts.sales.seeAll", { count: formatNumber(data.total), patients: plural2 })}</button>` : ""}</div>`);
    document.querySelectorAll("#fbody [data-fmpac]").forEach((button) => {
      button.onclick = () => {
        cardSectionsLegacy.openPatient(button.dataset.fmpac ?? "");
      };
    });
    const all = document.getElementById("fmpactodos");
    if (all) all.onclick = () => {
      const urgent = t("accounts.base.urgent"), title = document.querySelector("#fbody .fh h2")?.textContent ?? "";
      const name = title.startsWith(urgent) ? title.slice(urgent.length).trimStart() : title;
      document.getElementById("ficha")?.close();
      cardSectionsLegacy.patientsOf(id, name);
    };
  }
  async function salesRepAndPatients(id) {
    const body2 = document.getElementById("fbody");
    if (!stillShown(id) || !body2?.querySelector(".fh")) return;
    const admin = cardSectionsLegacy.can("administrar");
    if (admin) {
      body2.insertAdjacentHTML("beforeend", `<div class="blk" id="fcomblk"><h3>${t("accounts.sales.repTitle")}</h3>
      <div style="display:flex;gap:8px"><select id="fcomsel" style="flex:1"><option>${t("accounts.sales.loading")}</option></select>
        <button class="btn sec" id="fcomok">${t("accounts.sales.save")}</button></div>
      <div class="sm" style="margin-top:6px">${t("accounts.sales.repNote")}</div></div>`);
      await fillSalesReps(id);
      if (!stillShown(id) || !document.getElementById("fcomsel")) return;
    }
    if (admin || cardSectionsLegacy.salesArea() >= 1) await patients(id);
  }
  async function associatedClients(id) {
    if (!stillShown(id) || !document.getElementById("fventasc") || document.getElementById("fclientes")) return;
    const { data } = await callRpc("clientes_de_cuenta", { p_cuenta: id });
    const sales = document.getElementById("fventasc");
    if (!data?.ok || !stillShown(id) || !sales || document.getElementById("fclientes")) return;
    const figures = [[t("accounts.sales.associated"), data.total], [t("accounts.sales.withOrders"), data.con_pedido], [t("accounts.sales.withoutOrders"), data.sin_pedido]];
    const block = `<div class="blk" id="fclientes"><h3>${t("accounts.sales.associatedTitle", { patients: term("paciente", { number: "p", capital: "C" }) })}</h3>
    <div class="uper">${figures.map(([label, value2]) => `<div><b>${formatNumber(value2)}</b><span>${label}</span></div>`).join("")}</div>
    ${data.total ? "" : `<div class="sm">${t("accounts.sales.noneAssociated", { patients: term("paciente", { number: "p" }) })}</div>`}</div>`;
    const units2 = document.getElementById("fundades");
    if (units2) units2.insertAdjacentHTML("afterend", block);
    else sales.insertAdjacentHTML("afterbegin", block);
  }

  // src/app/screens/accounts/card/index.ts
  var LOADING_LIMIT_MS = 8e3;
  var BASE = [
    { name: "base", run: paintBase },
    { name: "salesRepAndPatients", run: salesRepAndPatients },
    { name: "timetableNotice", run: timetableNotice },
    { name: "visitMaterial", run: visitMaterial },
    { name: "units", run: units },
    { name: "associatedClients", run: associatedClients }
  ];
  var ACCESS = { name: "access", run: (id) => accountCardLegacy.base.access(id) };
  var CUSTOM_FIELDS = {
    name: "customFields",
    wait: false,
    run: (id) => accountCardLegacy.customFields(id, document.getElementById("fzcampos") ?? document.querySelector("#ficha .fbody, #ficha #fbody") ?? document.getElementById("ficha")?.firstElementChild ?? null)
  };
  var SECTIONS = [
    { name: "changeHistory", run: changeHistory, wait: false },
    { name: "portal", run: (id) => accountCardLegacy.portal(id), wait: false },
    { name: "centreProducts", run: (id) => accountCardLegacy.centreProducts(id), wait: false },
    { name: "visitPhotos", run: visitPhotos },
    { name: "samples", run: samples },
    { name: "events", run: events },
    { name: "deposit", run: deposit },
    { name: "cycle", run: cycle },
    { name: "presentedProducts", run: presentedProducts },
    { name: "surgeries", run: surgeries },
    { name: "tenders", run: tenders },
    { name: "equipment", run: equipment },
    { name: "portalProposal", run: portalProposal },
    { name: "centreProfessionals", run: centreProfessionals },
    { name: "archiveButtons", run: archiveButtons }
  ];
  async function runSection(section, id) {
    try {
      await section.run(id);
    } catch (error) {
      console.error(`ficha · ${section.name}`, error);
    }
  }
  async function paintBase2(id) {
    const card = document.getElementById("ficha");
    card?.classList.add("cargando");
    const limit = setTimeout(() => card?.classList.remove("cargando"), LOADING_LIMIT_MS);
    try {
      accountCardLegacy.forgetPatients();
      for (const section of BASE) await section.run(id);
      if (document.getElementById("fventas") && !document.getElementById("fventasc")?.children.length) document.getElementById("fventas")?.remove();
    } finally {
      clearTimeout(limit);
      requestAnimationFrame(() => card?.classList.remove("cargando"));
    }
  }
  async function openAccountCard(id) {
    try {
      await paintBase2(id);
      await runSection(ACCESS, id);
      void runSection(CUSTOM_FIELDS, id);
    } finally {
      accountCardLegacy.forgetCentreFromAppointment();
    }
    for (const section of SECTIONS) {
      if (section.wait === false) void runSection(section, id);
      else await runSection(section, id);
    }
  }

  // src/app/screens/agenda/index.ts
  var agenda_exports = {};
  __export(agenda_exports, {
    applyTaskFolding: () => applyTaskFolding,
    bindWeekButton: () => bindWeekButton,
    changeTime: () => changeTime,
    closeMonth: () => closeMonth,
    data: () => preload_exports,
    dueList: () => dueList,
    editTask: () => editTask,
    groupByAttendance: () => groupByAttendance,
    hasMenu: () => hasMenu,
    loadAgenda: () => loadAgenda,
    markQueuedVisits: () => markQueuedVisits,
    metricsHtml: () => metricsHtml,
    newAppointment: () => newAppointment,
    openMenu: () => openMenu,
    openTray: () => openTray,
    paintOpenWeek: () => paintOpenWeek,
    paintSameCentre: () => paintSameCentre,
    paintStrip: () => paintStrip,
    paintTrayButtons: () => paintTrayButtons,
    paintWeekSidebar: () => paintWeekSidebar,
    paintYourDay: () => paintYourDay,
    refreshAfterChange: () => refreshAfterChange,
    refreshMetrics: () => refreshMetrics,
    refreshOpenMonth: () => refreshOpenMonth,
    refreshOpenTray: () => refreshOpenTray,
    refreshQuietly: () => refreshQuietly,
    reloadMetrics: () => reloadMetrics,
    renderMonth: () => renderMonth,
    repaintSmoothly: () => repaintSmoothly,
    runAction: () => runAction,
    saveOrder: () => saveOrder,
    shareWeek: () => shareWeek,
    showAppointment: () => showAppointment,
    showDay: () => showDay,
    toggleMonth: () => toggleMonth
  });

  // src/app/screens/agenda/month-calendar.ts
  var NOT_COUNTED = ["Descartada", "Aplazada"];
  var POPOVER_WIDTH = 380;
  var PICKER_WIDTH = 280;
  var shownMonth = null;
  var calendar = () => document.getElementById("agmes");
  var monthOf = (isoDate) => isoDate.slice(0, 7);
  function lastDayOf(month) {
    const first = /* @__PURE__ */ new Date(`${month}-01T12:00:00`);
    return addDays(toIsoDate(new Date(first.getFullYear(), first.getMonth() + 1, 1)), -1);
  }
  function shiftMonth(month, months) {
    const date = /* @__PURE__ */ new Date(`${month}-01T12:00:00`);
    date.setMonth(date.getMonth() + months);
    return monthOf(toIsoDate(date));
  }
  async function appointmentsPerDay(month) {
    const result = await cachedRpc(
      "agenda_rango",
      { p_desde: `${month}-01`, p_hasta: lastDayOf(month), p_usuario: legacyAgenda.userFilter() },
      `agenda-mes-${month}`
    );
    const perDay = /* @__PURE__ */ new Map();
    (result.data ?? []).filter((item) => !NOT_COUNTED.includes(item.estado)).forEach((item) => {
      perDay.set(item.fecha, (perDay.get(item.fecha) ?? 0) + 1);
    });
    return perDay;
  }
  function dayCell(isoDate, count2, today) {
    const classes = ["agmc", isoDate === today ? "hoy" : "", isoDate < today ? "pasado" : "", count2 ? "con" : ""].filter(Boolean).join(" ");
    const label = t("agenda.month.dayLabel", { date: formatShortDate(isoDate), count: count2 });
    return `<button type="button" class="${classes}" data-agdia="${isoDate}" aria-label="${label}">
        <span>${Number(isoDate.slice(8))}</span>${count2 ? `<i class="agpt">${count2 > 9 ? "9+" : count2}</i>` : ""}</button>`;
  }
  function gridHtml(month, perDay) {
    const today = todayIso(), first = /* @__PURE__ */ new Date(`${month}-01T12:00:00`);
    const blanks = (first.getDay() + 6) % 7, days = Number(lastDayOf(month).slice(8));
    const header = t("dates.weekdayLetters").split(",").map((letter) => `<span class="agmd">${letter}</span>`).join("");
    const cells = range(days).map((index) => `${month}-${String(index + 1).padStart(2, "0")}`);
    return header + "<span></span>".repeat(blanks) + cells.map((day) => dayCell(day, perDay.get(day) ?? 0, today)).join("");
  }
  function headerHtml2(month, current) {
    return `<button type="button" class="kmv agmnav" data-agm="-1" aria-label="${t("agenda.month.previous")}">‹</button>
    <button type="button" class="agmtit" id="agmtit" aria-label="${t("agenda.month.choose")}">${escapeHtml(capitalise(formatMonth(month)))}</button>
    <button type="button" class="kmv agmnav" data-agm="1" aria-label="${t("agenda.month.next")}">›</button>
    ${month !== current ? `<button type="button" class="btn sec agmhoy" id="agmhoy">${t("agenda.month.today")}</button>` : ""}`;
  }
  function onClick(element, action) {
    if (element instanceof HTMLElement) element.onclick = (event) => {
      event.stopPropagation();
      action();
    };
  }
  function bindHeader(box, month, current) {
    box.querySelectorAll("[data-agm]").forEach((button) => {
      onClick(button, () => {
        void renderMonth(shiftMonth(month, Number(button.dataset.agm)));
      });
    });
    onClick(document.getElementById("agmhoy"), () => {
      void renderMonth(current);
    });
    const title = document.getElementById("agmtit");
    onClick(title, () => {
      if (title) openMonthPicker(month, title);
    });
  }
  function bindDays(box) {
    const selected = legacyAgenda.selectedDate(), today = todayIso();
    box.querySelectorAll(".agmc[data-agdia]").forEach((button) => {
      const day = button.dataset.agdia ?? "";
      button.classList.toggle("sel", day === selected && selected !== today);
      onClick(button, () => {
        legacyAgenda.showDay(day);
      });
    });
  }
  async function renderMonth(month) {
    const box = calendar();
    if (!box) return;
    const current = monthOf(todayIso()), target = month ?? current;
    shownMonth = target;
    if (orFallback(box.dataset.mes, current) !== target) {
      const perDay = await appointmentsPerDay(target);
      const fresh = calendar();
      if (shownMonth !== target || !fresh) return;
      fresh.dataset.mes = target;
      const grid = fresh.querySelector(".agmesgrid");
      if (grid) grid.innerHTML = gridHtml(target, perDay);
    }
    const box2 = calendar(), header = box2?.querySelector(".fh");
    if (!box2 || !header) return;
    header.classList.add("agmesh");
    header.innerHTML = headerHtml2(target, current);
    bindHeader(header, target, current);
    bindDays(box2);
  }
  function openMonthPicker(month, anchor) {
    document.querySelectorAll(".agmpop").forEach((element) => {
      element.remove();
    });
    let year = Number(month.slice(0, 4));
    const picker = document.createElement("div");
    picker.className = "agmpop";
    const names = shortMonthNames();
    const paint2 = () => {
      picker.innerHTML = `<div class="agmpoph"><button type="button" class="kmv" data-an="-1" aria-label="${t("agenda.month.previousYear")}">‹</button><b>${year}</b>
      <button type="button" class="kmv" data-an="1" aria-label="${t("agenda.month.nextYear")}">›</button></div>
      <div class="agmpopg">${names.map((name, index) => {
        const key = `${year}-${String(index + 1).padStart(2, "0")}`;
        return `<button type="button" data-mk="${key}" class="${key === month ? "on" : ""}">${name}</button>`;
      }).join("")}</div>`;
      picker.querySelectorAll("[data-an]").forEach((button) => {
        onClick(button, () => {
          year += Number(button.dataset.an);
          paint2();
        });
      });
      picker.querySelectorAll("[data-mk]").forEach((button) => {
        onClick(button, () => {
          picker.remove();
          void renderMonth(button.dataset.mk);
        });
      });
    };
    paint2();
    document.body.appendChild(picker);
    const rect = anchor.getBoundingClientRect(), width = Math.min(PICKER_WIDTH, innerWidth - 20);
    picker.style.width = `${width}px`;
    picker.style.left = `${Math.max(10, Math.min(innerWidth - width - 10, rect.left + rect.width / 2 - width / 2))}px`;
    picker.style.top = `${Math.min(innerHeight - picker.offsetHeight - 10, rect.bottom + 6)}px`;
  }
  function closeMonth() {
    calendar()?.classList.remove("pop");
    document.getElementById("cmesb")?.setAttribute("aria-expanded", "false");
  }
  async function toggleMonth() {
    let box = calendar();
    if (box?.classList.contains("pop")) {
      closeMonth();
      return;
    }
    if (!box) {
      document.getElementById("v-agenda")?.insertAdjacentHTML("beforeend", '<div class="card agmes" id="agmes"><div class="fh"></div><div class="agmesgrid"></div></div>');
      box = calendar();
    }
    if (!box) return;
    box.dataset.mes = "-";
    await renderMonth(shownMonth ?? monthOf(legacyAgenda.selectedDate() ?? todayIso()));
    const button = document.getElementById("cmesb"), opened = calendar();
    if (!button || !opened) return;
    opened.classList.add("pop");
    button.setAttribute("aria-expanded", "true");
    const rect = button.getBoundingClientRect(), width = Math.min(POPOVER_WIDTH, innerWidth - 32);
    Object.assign(opened.style, { top: `${Math.round(rect.bottom + 8)}px`, left: `${Math.round(Math.max(16, Math.min(rect.left, innerWidth - width - 16)))}px`, bottom: "auto", right: "auto" });
  }
  function refreshOpenMonth() {
    const box = calendar();
    if (!box?.classList.contains("pop")) return;
    box.dataset.mes = "-";
    void renderMonth(shownMonth);
  }

  // src/app/screens/agenda/metrics.ts
  var count = (value2) => formatNumber(value2 ?? 0);
  var decimal = (value2) => value2 === void 0 || value2 === null ? "0" : String(value2).replace(".", ",");
  function todayFigures(metrics) {
    const day = legacyAgenda.selectedDate(), today = todayIso();
    if (day === today && legacyAgenda.loadedDay() === day) {
      const active = legacyAgenda.dayAppointments().filter((item) => !appointments.isCancelled(item.estado));
      return { done: formatNumber(active.filter((item) => !appointments.isOpen(item.estado)).length), total: formatNumber(active.length) };
    }
    return { done: count(metrics.hoy?.visitadas), total: count(metrics.hoy?.citas) };
  }
  function pills(metrics) {
    const { done, total } = todayFigures(metrics);
    const visits = term("visita", { number: "p" }), week = metrics.semana ?? {}, closings = metrics.cierres ?? {}, pending = metrics.pendientes ?? {};
    return [
      ["agenda.metrics.today", `${done}/${total}`, t("agenda.metrics.todayDetail", { done, total, average: decimal(metrics.media_dia), visits }), ""],
      ["agenda.metrics.week", count(week.visitas), t("agenda.metrics.weekDetail", { count: count(week.visitas), visits, average: decimal(week.media) }), ""],
      ["agenda.metrics.closings", count(closings.hoy), t("agenda.metrics.closingsDetail", { count: count(closings.hoy), average: decimal(closings.media_dia) }), ""],
      [
        "agenda.metrics.toVisit",
        count((pending.urgentes ?? 0) + (pending.sin_visita ?? 0)),
        t("agenda.metrics.toVisitDetail", { urgent: count(pending.urgentes), noVisit: count(pending.sin_visita), visit: term("visita") }),
        "agp-pend"
      ]
    ];
  }
  function metricsHtml() {
    const metrics = legacyAgenda.metrics();
    if (!metrics) return "";
    return pills(metrics).map(([label, figure2, detail, className]) => `<span class="agp ${className}" title="${escapeHtml(detail)}">${escapeHtml(t(label))} <b>${escapeHtml(figure2)}</b></span>`).join("");
  }
  function refreshMetrics() {
    const box = document.getElementById("aghud");
    if (!legacyAgenda.isDayView() || !box || !legacyAgenda.metrics()) return;
    const html = metricsHtml();
    if (box.lastHtml !== html) {
      box.innerHTML = html;
      box.lastHtml = html;
    }
  }
  async function reloadMetrics() {
    if (!legacyAgenda.isDayView()) return;
    const { data } = await callRpc("agenda_metricas", { p_usuario: legacyAgenda.viewedUserId() });
    if (!data || !legacyAgenda.isDayView()) return;
    legacyAgenda.setMetrics(data);
    refreshMetrics();
  }

  // src/app/services/geo.ts
  var EARTH_RADIUS_KM = 6371;
  function distanceKm(from, to) {
    const radians = Math.PI / 180;
    const latitudeDelta = (to[0] - from[0]) * radians, longitudeDelta = (to[1] - from[1]) * radians;
    const chord = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(from[0] * radians) * Math.cos(to[0] * radians) * Math.sin(longitudeDelta / 2) ** 2;
    return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(chord));
  }

  // src/app/screens/agenda/same-centre.ts
  var NEAR_KM = 0.2;
  var SHOWN_PEOPLE = 6;
  var MAX_DAYS_LISTED = 3;
  var LETTERS_FROM_SUNDAY = "DLMXJVS";
  var LETTERS_FROM_MONDAY = "LMXJVSD";
  var AFTERNOON_HOUR = 14;
  function attendsInAfternoon(timetable) {
    const hour = Number.parseInt(/(\d{1,2})(?::\d{2})?/.exec(timetable)?.[1] ?? "", 10);
    return /tarde/i.test(timetable) || !/ma[ñn]ana/i.test(timetable) && hour >= AFTERNOON_HOUR;
  }
  function groupByAttendance(people, isoDate) {
    const letter = LETTERS_FROM_SUNDAY[fromIsoDate(isoDate).getDay()] ?? "";
    const morning = [], afternoon = [], otherDay = [], noTimetable = [];
    const otherDays = /* @__PURE__ */ new Set();
    people.forEach((person) => {
      const days = person.dias ?? {}, today = days[letter], withTimetable = Object.keys(days).filter((key) => days[key]);
      if (!withTimetable.length) noTimetable.push(person);
      else if (!today) {
        otherDay.push(person);
        withTimetable.forEach((key) => otherDays.add(key));
      } else (attendsInAfternoon(today) ? afternoon : morning).push(person);
    });
    const names = t("dates.weekdaysLong").split(",");
    const listed = [...LETTERS_FROM_MONDAY].map((key, index) => otherDays.has(key) ? names[index] : void 0).filter((name) => Boolean(name));
    const otherTitle = t("agenda.sameCentre.otherDay") + (listed.length && listed.length <= MAX_DAYS_LISTED ? ` (${listed.join(", ")})` : "");
    return [
      { title: t("agenda.sameCentre.morning"), people: morning },
      { title: t("agenda.sameCentre.afternoon"), people: afternoon },
      { title: otherTitle, people: otherDay },
      { title: t("agenda.sameCentre.noTimetable"), people: noTimetable }
    ].filter((group) => group.people.length);
  }
  var toNumber = (value2) => Number(value2);
  function isSameCentre(group, appointment) {
    if (isPresent(group.lat) && isPresent(appointment.lat)) {
      return distanceKm([toNumber(group.lat), toNumber(group.lon)], [toNumber(appointment.lat), toNumber(appointment.lon)]) <= NEAR_KM;
    }
    return Boolean(group.centro_nombre && appointment.centro_nombre && looseText(group.centro_nombre) === looseText(appointment.centro_nombre));
  }
  function personChip(person) {
    const missing = person.falta?.length ? t("agenda.sameCentre.missing", { fields: person.falta.join(", ") }) : "";
    const title = person.visitar ? t("agenda.sameCentre.addAppointment", { reason: person.visitar }) : t("agenda.sameCentre.seeCard") + missing;
    return `<button type="button" data-agti="${person.id}" data-agtv="${person.visitar ? 1 : ""}" title="${escapeHtml(title)}">${person.visitar ? "<i>+</i> " : ""}${escapeHtml(person.nombre)}</button>`;
  }
  function blockHtml(group, people, isoDate) {
    const chips = groupByAttendance(people.slice(0, SHOWN_PEOPLE), isoDate).map(({ title, people: list }) => `<div class="agtambg"><span class="agtambgt">${escapeHtml(title)}</span><div class="agtambl">${list.map(personChip).join("")}</div></div>`).join("") + (people.length > SHOWN_PEOPLE ? `<span class="sm">${t("agenda.sameCentre.andMore", { count: people.length - SHOWN_PEOPLE })}</span>` : "");
    const centre = group.centro_id ? escapeHtml(group.centro_id) : "";
    const opener = centre ? ` data-agtc="${centre}" role="button" tabindex="0" title="${t("agenda.sameCentre.openCentre")}"` : "";
    return `<div class="agtamb${centre ? " agtambc" : ""}"${opener}><div class="agtambh">${icon("map-pin")} ${t("agenda.sameCentre.title")}${centre ? `<span class="agtambver">${t("agenda.sameCentre.seeCentre")}</span>` : ""}</div>${chips}</div>`;
  }
  function withAppointmentToday() {
    return new Set(legacyAgenda.dayAppointments().filter((item) => !appointments.isCancelled(item.estado)).map((item) => item.cuenta_id));
  }
  function paintSameCentre() {
    const body2 = document.getElementById("agcuerpo"), suggestions = agendaSuggestions.forDay(), isoDate = legacyAgenda.selectedDate();
    if (!body2 || !suggestions || !isoDate || suggestions.fecha !== isoDate) return;
    body2.querySelectorAll(".agtamb").forEach((element) => {
      element.remove();
    });
    const cards = [...body2.querySelectorAll(".tdu[data-tdu]")];
    if (!cards.length) return;
    const byId = new Map(legacyAgenda.dayAppointments().map((item) => [String(item.id), item]));
    const already = withAppointmentToday(), used = /* @__PURE__ */ new Set();
    suggestions.centros.forEach((group) => {
      const people = (group.cuentas ?? group.medicos ?? []).filter((person) => !already.has(person.id));
      if (!people.length) return;
      const card = cards.find((element) => {
        const appointment = byId.get(element.dataset.tdu ?? "");
        return appointment !== void 0 && !used.has(element) && isSameCentre(group, appointment);
      });
      if (!card) return;
      used.add(card);
      (card.querySelector(".tdu-pie") ?? card.lastElementChild)?.insertAdjacentHTML("beforebegin", blockHtml(group, people, isoDate));
    });
  }
  function listenToSameCentre() {
    document.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      const person = target?.closest("#agcuerpo .agtamb [data-agti]");
      if (person) {
        event.stopPropagation();
        if (person.dataset.agtv) agendaActions.newAppointment(person.dataset.agti ?? "", legacyAgenda.selectedDate());
        else agendaActions.openAccount(person.dataset.agti ?? "");
        return;
      }
      const block = target?.closest("#agcuerpo .agtamb[data-agtc]");
      if (block) {
        event.stopPropagation();
        agendaActions.openCentre(block.dataset.agtc ?? "");
      }
    }, true);
    document.addEventListener("keydown", (event) => {
      const block = event.target instanceof Element ? event.target.closest("#agcuerpo .agtamb[data-agtc]") : null;
      if (block && event.target === block && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        agendaActions.openCentre(block.dataset.agtc ?? "");
      }
    });
  }

  // src/app/screens/agenda/preload.ts
  var preload_exports = {};
  __export(preload_exports, {
    applySuggestions: () => applySuggestions,
    dayLoads: () => dayLoads,
    loadSuggestions: () => loadSuggestions,
    peekBlocked: () => peekBlocked,
    peekRange: () => peekRange,
    stripLoads: () => stripLoads,
    weekLoads: () => weekLoads,
    withData: () => withData
  });
  var STRIP_DAYS = 14;
  var WEEK_DAYS = 7;
  var DUE_LIMIT = 60;
  var preloaded = /* @__PURE__ */ new Map();
  var painting = 0;
  var keyOf = (name, from, to, user) => [name, from, to, user ?? ""].join("|");
  function peekRange(params) {
    if (!preloaded.size || !params.p_desde || !params.p_hasta) return void 0;
    return preloaded.get(keyOf("agenda_rango", params.p_desde, params.p_hasta, params.p_usuario));
  }
  function peekBlocked(from, to) {
    return preloaded.get(keyOf("bloq", from, to, agendaSources.ownerId()));
  }
  function loadRange(from, to, user, cacheKey) {
    const key = keyOf("agenda_rango", from, to, user);
    if (preloaded.has(key)) return null;
    return cachedRpc("agenda_rango", { p_desde: from, p_hasta: to, p_usuario: user }, cacheKey).then((result) => {
      preloaded.set(key, result);
    });
  }
  function loadBlocked(from, to) {
    const key = keyOf("bloq", from, to, agendaSources.ownerId());
    if (preloaded.has(key)) return null;
    return agendaSources.blockedDays(from, to).catch(() => ({})).then((blocked) => {
      preloaded.set(key, blocked);
    });
  }
  function dayLoads(isoDate) {
    return [
      agendaSources.hasPresetDay(isoDate) ? null : loadRange(isoDate, isoDate, legacyAgenda.userFilter(), `agenda-${isoDate}`),
      agendaSources.dayTasks(isoDate).catch(() => null)
    ];
  }
  function stripLoads() {
    const start = agendaSources.stripStart() ?? mondayOf(legacyAgenda.selectedDate() ?? todayIso()), owner = agendaSources.ownerId();
    return [loadRange(start, addDays(start, STRIP_DAYS - 1), owner, `agenda-cinta-${owner}-${start}`), loadBlocked(start, addDays(start, STRIP_DAYS - 1))];
  }
  function weekLoads(isoDate) {
    const monday = mondayOf(isoDate ?? legacyAgenda.selectedDate() ?? todayIso());
    return [loadRange(monday, addDays(monday, WEEK_DAYS - 1), legacyAgenda.userFilter(), `agenda-${monday}`), loadBlocked(monday, addDays(monday, WEEK_DAYS - 1))];
  }
  var listOf = (request) => Promise.resolve(request).then((result) => result.data ?? [], () => []);
  async function loadSuggestions(isoDate) {
    const future = isoDate >= todayIso(), own = agendaSources.isOwnAgenda(), owner = agendaSources.ownerId();
    const [pend, toca, centros] = await Promise.all([
      listOf(callRpc("pendientes_ruta", {})),
      future ? listOf(legacyDb().rpc("toca_actividad", { p_usuario: own && permissions.seesEverything() ? null : owner, lim: DUE_LIMIT })) : [],
      future ? listOf(callRpc("sugerencias_centros", { p_fecha: isoDate, p_usuario: own ? null : owner })) : []
    ]);
    return { date: isoDate, pend, toca, centros };
  }
  function applySuggestions(isoDate, suggestions) {
    if (suggestions?.date === isoDate) agendaSources.setSuggestions(isoDate, suggestions);
  }
  async function withData(loads, paint2) {
    painting++;
    try {
      await Promise.all(loads.filter(Boolean).map((load2) => Promise.resolve(load2).catch(() => null)));
      return await paint2();
    } finally {
      setTimeout(() => {
        painting--;
        if (painting <= 0) {
          painting = 0;
          preloaded.clear();
        }
      }, 0);
    }
  }

  // src/app/screens/agenda/open-week.ts
  var WEEK_DAYS2 = 7;
  var SHOWN_PER_DAY = 9;
  var SHOWN_WITHOUT_DAY = 25;
  var NOT_SHOWN = ["Descartada", "Aplazada"];
  var firstName = (name) => String(name).split(",")[0] ?? "";
  function loadEstimate(day, mine, proposed, data) {
    if (!(mine.some((item) => appointments.isOpen(item.estado)) || proposed.length) || day < data.today) return "";
    const planned = proposed.map((item) => ({ estado: "Planificada", ...data.draft?.horario ?? {}, ...item.cita }));
    const { fin: end, tope: limit } = weekPlanner.estimateDay([...mine, ...planned], day);
    const title = t("agenda.openWeek.estimatedEnd") + (end > limit ? t("agenda.openWeek.overReturn", { time: formatMinutes(limit) }) : "");
    return `<span class="semcarga ${end > limit ? "pasa" : ""}" title="${title}">~${formatMinutes(end)}</span>`;
  }
  function appointmentChip(item, data) {
    const movable = item.usuario_id === data.owner && appointments.isOpen(item.estado) && item.fecha >= data.today;
    const title = `${escapeHtml(item.nombre)} · ${escapeHtml(item.estado)}${movable ? t("agenda.openWeek.dragToMove") : ""}`;
    const time = item.hora ? `<i>${escapeHtml(String(item.hora).slice(0, 5))}</i>` : "";
    const other = item.usuario_id !== data.owner && item.usuario ? ` <em>${escapeHtml(initialsOf(item.usuario))}</em>` : "";
    return `<span class="semcita" data-semficha="${item.cuenta_id}" ${movable ? `draggable="true" data-semcid="${item.id}"` : ""}
              title="${title}" style="border-left-color:${commercialStates.color(item.estado) ?? "var(--muted)"}">
              ${time}${escapeHtml(firstName(item.nombre))}${other}</span>`;
  }
  function proposedChip(item) {
    const start = item.ini === null || item.ini === void 0 ? "" : formatMinutes(item.ini);
    return `<span class="semcita nueva" title="${t("agenda.openWeek.proposal", { name: escapeHtml(item.m.nombre) })}${start ? ` · ~${start}` : ""}"><i>~${start}</i>${escapeHtml(firstName(item.m.nombre))}</span>`;
  }
  function dayColumn(day, data) {
    const all = (data.perDay[day] ?? []).filter((item) => !NOT_SHOWN.includes(item.estado));
    const mine = all.filter((item) => item.usuario_id === data.owner), proposed = data.draft?.dias[day] ?? [];
    const done = all.filter((item) => item.estado === "Visitada").length, date = fromIsoDate(day), reason = data.blocked[day];
    const classes = ["mesdia semdia", day === data.today ? "hoy" : "", date.getDay() === 0 || date.getDay() === 6 ? "finde" : "", reason ? "bloq" : ""].filter(Boolean).join(" ");
    return `<div class="${classes}" data-semdia="${day}" role="button" tabindex="0">
          <div class="semcab"><b>${date.getDate()}</b>${all.length ? `<span class="mespunto">${done}/${all.length}</span>` : ""}${loadEstimate(day, mine, proposed, data)}
            <button class="semmas" data-semmenu="${day}" aria-label="${t("agenda.openWeek.dayOptions", { date: formatShortDate(day) })}" title="${t("agenda.openWeek.dayOptionsTitle")}">⋯</button></div>
          ${reason ? `<span class="sembloq">🚫 ${escapeHtml(reason)}</span>` : ""}
          <div class="semcitas">${all.slice(0, SHOWN_PER_DAY).map((item) => appointmentChip(item, data)).join("")}
            ${proposed.map(proposedChip).join("")}
            ${all.length > SHOWN_PER_DAY ? `<span class="sm">${t("agenda.openWeek.andMore", { count: all.length - SHOWN_PER_DAY })}</span>` : ""}</div>
        </div>`;
  }
  function draftHtml(draft) {
    const days = Object.keys(draft.dias).filter((day) => draft.dias[day]?.length).length;
    const summary = t("agenda.openWeek.draftSummary", { count: formatNumber(draft.total), visits: term("visita", { number: "p", adjective: "nuevo" }), days }) + (draft.sinDia.length ? t("agenda.openWeek.draftWithoutDay", { count: draft.sinDia.length }) : "");
    return `<div class="semborr">
      <span><b>${t("agenda.openWeek.draft")}</b> · ${summary}</span>
      <span class="acts" style="margin:0"><button class="btn sec" id="semdescartar">${t("agenda.openWeek.discard")}</button><button class="btn" id="semguardar">${t("agenda.openWeek.save")}</button></span></div>`;
  }
  function withoutDayHtml(draft) {
    if (!draft?.sinDia.length) return "";
    const rows = draft.sinDia.slice(0, SHOWN_WITHOUT_DAY).map((item) => `<div class="item" style="cursor:default"><span class="ic w">!</span>
        <span class="tx"><b>${escapeHtml(item.m.nombre)}</b><span class="sm">${escapeHtml(item.motivo)}${item.m.municipio ? ` · ${escapeHtml(item.m.municipio)}` : ""}</span></span></div>`).join("");
    const more = draft.sinDia.length > SHOWN_WITHOUT_DAY ? `<div class="sm" style="padding:6px 12px">${t("agenda.openWeek.andMore", { count: draft.sinDia.length - SHOWN_WITHOUT_DAY })}</div>` : "";
    return `<div class="planfuera" style="margin:0 16px 16px"><h3>${t("agenda.openWeek.withoutDay", { count: draft.sinDia.length })}</h3>
      <div class="lista">${rows}
        ${more}</div></div>`;
  }
  function weekHtml(data) {
    const canPlan = data.days.some((day) => day >= data.today) && !data.draft;
    return `
    <div class="semhead"><span class="sm">${t("agenda.openWeek.hint")}</span>
      ${canPlan ? `<button class="btn" id="semplan">${t("agenda.openWeek.share")}</button>` : ""}</div>
    ${data.draft ? draftHtml(data.draft) : ""}
    <div class="semwrap"><div class="mes sem">
      ${t("dates.weekdayLetters").split(",").map((letter) => `<span class="mesdow">${letter}</span>`).join("")}
      ${data.days.map((day) => dayColumn(day, data)).join("")}
    </div></div>
    ${withoutDayHtml(data.draft)}`;
  }
  async function moveTo(item, day, data) {
    if (item.fecha === day) return;
    if (day < todayIso()) {
      notices.toast(t("agenda.openWeek.notToPast"), true);
      return;
    }
    const warnings = [];
    const reason = data.blocked[day];
    if (reason) warnings.push(t("agenda.openWeek.blockedDay", { reason }));
    const windows = weekPlanner.attendanceWindows(item.dias, day);
    if (windows && !windows.length) warnings.push(t("agenda.openWeek.notAttending"));
    if (warnings.length && !await notices.confirm(`${item.nombre ?? ""}: ${warnings.join(" y ")}.`, { titulo: t("agenda.openWeek.moveAnyway"), ok: t("agenda.openWeek.move") })) return;
    const { data: result, error } = await legacyDb().rpc("estado_cita", { p_id: item.id, p_estado: item.estado, p_fecha: day });
    if (error || result?.ok === false) {
      notices.toast(t("agenda.openWeek.couldNotMove"), true);
      return;
    }
    notices.toast(t("agenda.openWeek.movedTo", { date: formatShortDate(day) }));
    reloadAgenda();
  }
  function onDayClick(event, column, data) {
    const target = event.target instanceof Element ? event.target : null;
    const menu = target?.closest("[data-semmenu]");
    if (menu) {
      const day = menu.dataset.semmenu ?? "";
      legacyAgendaParts.dayMenu(menu, day, Boolean(data.blocked[day]));
      return;
    }
    if (target?.closest(".semcita.nueva")) return;
    const account = target?.closest("[data-semficha]");
    if (account) {
      agendaActions.openAccount(account.dataset.semficha ?? "");
      return;
    }
    agendaState.setSelectedDate(column.dataset.semdia ?? "");
    agendaState.setMode("dia");
    reloadAgenda();
  }
  function bindDay(column, data) {
    column.onclick = (event) => {
      onDayClick(event, column, data);
    };
    column.onkeydown = (event) => {
      if (event.key === "Enter") onDayClick(event, column, data);
    };
    column.ondragover = (event) => {
      if (event.dataTransfer?.types.includes("text/cita")) {
        event.preventDefault();
        column.classList.add("sobre");
      }
    };
    column.ondragleave = () => {
      column.classList.remove("sobre");
    };
    column.ondrop = (event) => {
      event.preventDefault();
      column.classList.remove("sobre");
      const id = event.dataTransfer?.getData("text/cita"), item = data.list.find((entry) => entry.id === id);
      if (item) void moveTo(item, column.dataset.semdia ?? "", data);
    };
  }
  function bind(box, data) {
    const plan = box.querySelector("#semplan");
    if (plan) plan.onclick = () => {
      weekPlanner.plan(data.monday, data.days, { ...data.blocked }, data.perDay);
    };
    const discard = box.querySelector("#semdescartar");
    if (discard) discard.onclick = () => {
      weekPlanner.discardDraft();
      reloadAgenda();
    };
    const save3 = box.querySelector("#semguardar");
    if (save3) save3.onclick = () => {
      weekPlanner.saveDraft(save3);
    };
    box.querySelectorAll("[data-semdia]").forEach((column) => {
      bindDay(column, data);
    });
    box.querySelectorAll("[data-semcid]").forEach((chip) => {
      chip.ondragstart = (event) => {
        event.dataTransfer?.setData("text/cita", chip.dataset.semcid ?? "");
        if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
        chip.classList.add("arrastrando");
      };
      chip.ondragend = () => {
        chip.classList.remove("arrastrando");
      };
    });
  }
  async function weekData() {
    const monday = mondayOf(legacyAgenda.selectedDate() ?? todayIso()), sunday = addDays(monday, WEEK_DAYS2 - 1), owner = agendaSources.ownerId();
    const [result, blocked] = await Promise.all([
      cachedRpc("agenda_rango", { p_desde: monday, p_hasta: sunday, p_usuario: legacyAgenda.userFilter() }, `agenda-${monday}`),
      legacyAgendaParts.blockedDays(monday, WEEK_DAYS2)
    ]);
    const list = result.data ?? [], perDay = {};
    list.forEach((item) => {
      var _a;
      (perDay[_a = item.fecha] ?? (perDay[_a] = [])).push(item);
    });
    const draft = weekPlanner.draft(), ownDraft = draft?.semana === monday && draft.uid === owner ? draft : null;
    return { monday, days: range(WEEK_DAYS2).map((index) => addDays(monday, index)), today: todayIso(), owner, list, perDay, blocked, draft: ownDraft };
  }
  async function render() {
    const strip = document.getElementById("agcinta");
    if (!strip || !stripState.weekOpen()) {
      document.getElementById("agsemexp")?.remove();
      return;
    }
    if (!document.getElementById("agsemexp")) strip.insertAdjacentHTML("beforeend", '<div id="agsemexp" class="agsemexp"></div>');
    if (!document.getElementById("agcuerpo")) return;
    const data = await weekData();
    const box = document.getElementById("agsemexp");
    if (!box || !stripState.weekOpen()) return;
    box.innerHTML = weekHtml(data);
    bind(box, data);
  }
  function paintOpenWeek() {
    const paint2 = async () => {
      const strip = document.getElementById("agcinta");
      if (!legacyAgenda.isDayView() || !strip || !stripState.weekOpen() || document.getElementById("agsemexp")) {
        await render();
        return;
      }
      strip.insertAdjacentHTML("beforeend", '<div id="agsemexp" class="agsemexp" style="display:none"></div>');
      try {
        await render();
      } finally {
        const box = document.getElementById("agsemexp");
        if (box) box.style.display = "";
      }
    };
    return legacyAgenda.isDayView() ? withData(stripState.weekOpen() ? weekLoads(legacyAgenda.selectedDate()) : [], paint2) : paint2();
  }

  // src/app/screens/agenda/strip.ts
  var STRIP_DAYS2 = 14;
  var WEEK_DAYS3 = 7;
  var MAX_DOTS = 6;
  var DAY_MS = 864e5;
  var hasStrip = () => currentScreen() === "agenda" && legacyAgendaParts.mode() === "dia" && Boolean(document.getElementById("v-agenda"));
  function weekTitle(monday, today) {
    const weeks = Math.round((fromIsoDate(monday).getTime() - fromIsoDate(mondayOf(today)).getTime()) / DAY_MS / WEEK_DAYS3);
    if (weeks === 0) return t("agenda.strip.thisWeek");
    if (weeks === 1) return t("agenda.strip.nextWeek");
    if (weeks === -1) return t("agenda.strip.lastWeek");
    return t("agenda.strip.weekOf", { day: fromIsoDate(monday).getDate(), month: monthNameOf(monday) });
  }
  function dotKind(item, isoDate, today) {
    if (!appointments.isOpen(item.estado)) return "ch";
    return isoDate < today ? "cx" : "cp";
  }
  function dayButton(isoDate, context) {
    const { today, selected, perDay, blocked } = context;
    const items = perDay.get(isoDate) ?? [], date = fromIsoDate(isoDate), reason = blocked[isoDate];
    const dots = items.slice(0, MAX_DOTS).map((item) => `<i class="${dotKind(item, isoDate, today)}"></i>`).join("") + (items.length > MAX_DOTS ? `<em>+${items.length - MAX_DOTS}</em>` : "");
    const count2 = t(items.length === 1 ? "agenda.strip.oneAppointment" : "agenda.strip.appointments", { count: items.length });
    const classes = ["cdia", isoDate === today ? "hoy" : "", isoDate === selected ? "sel" : "", [0, 6].includes(date.getDay()) ? "finde" : "", reason ? "bloq" : ""].filter(Boolean).join(" ");
    const options = isoDate >= today ? `<span class="cdmas" role="button" tabindex="0" aria-label="${t("agenda.strip.dayOptions")}" title="${t("agenda.strip.dayOptions")}">⋯</span>` : "";
    const letter = t("dates.weekdayLetters").split(",")[(date.getDay() + 6) % 7] ?? "";
    return `<button type="button" class="${classes}" data-cf="${isoDate}"${reason ? ` data-bloq="${escapeHtml(reason)}"` : ""} aria-label="${escapeHtml(formatLongDate(isoDate))}: ${count2}" title="${count2}">
      <span class="dn">${letter}</span><span class="dd">${date.getDate()}</span><span class="cpts">${dots || "<b></b>"}</span>${options}</button>`;
  }
  function weekButtonHtml(open) {
    const label = t(open ? "agenda.strip.hideWeek" : "agenda.strip.showWeek");
    return `<button type="button" class="btn sec chico" id="cplan" title="${open ? label : t("agenda.strip.showWeekTitle")}" aria-expanded="${String(open)}">${icon("calendar-days")}<span>${label}</span></button>`;
  }
  function stripHtml(start, context) {
    const month = capitalise(formatMonthYear(addDays(start, 3)));
    const today = mondayOf(context.today) === start ? "" : `<button type="button" class="btn sec chico" id="choy">${t("agenda.strip.today")}</button>`;
    const weeks = [0, WEEK_DAYS3].map((offset) => `<div class="csem"><span class="csemt">${weekTitle(addDays(start, offset), context.today)}</span><div class="c7">${range(WEEK_DAYS3).map((index) => dayButton(addDays(start, offset + index), context)).join("")}</div></div>`).join("");
    return `<div class="cinta" id="agcinta" data-ini="${start}"><div class="ccab">
      <div class="cnav"><button type="button" class="kmv" data-cm="-7" aria-label="${t("agenda.strip.previousWeekNav")}" title="${t("agenda.strip.previousWeekNav")}">‹</button><button type="button" id="cmesb" class="cmesb" aria-expanded="false" title="${t("agenda.strip.seeMonth")}">${escapeHtml(month)} <span aria-hidden="true">▾</span></button><button type="button" class="kmv" data-cm="7" aria-label="${t("agenda.strip.nextWeekNav")}" title="${t("agenda.strip.nextWeekNav")}">›</button>${today}</div>
      <div class="cley" aria-hidden="true"><span><i class="ch"></i>${t("agenda.strip.done")}</span><span><i class="cp"></i>${t("agenda.strip.toDo")}</span><span><i class="cx"></i>${t("agenda.strip.notClosed")}</span></div>
      ${weekButtonHtml(stripState.weekOpen())}</div>
    <div class="csems">${weeks}</div></div>`;
  }
  function perDayOf(list, owner) {
    const days = /* @__PURE__ */ new Map();
    list.filter((item) => item.usuario_id === owner && !appointments.isCancelled(item.estado)).forEach((item) => {
      days.set(item.fecha, [...days.get(item.fecha) ?? [], item]);
    });
    return days;
  }
  function bindWeekButton() {
    const button = document.getElementById("cplan");
    if (!button) return;
    const open = Boolean(document.getElementById("agsemexp")), label = t(open ? "agenda.strip.hideWeek" : "agenda.strip.showWeek");
    button.innerHTML = `${icon("calendar-days")}<span>${label}</span>`;
    button.title = open ? label : t("agenda.strip.showWeekTitle");
    button.setAttribute("aria-expanded", String(open));
    button.onclick = async (event) => {
      event.stopPropagation();
      event.preventDefault();
      if (button.dataset.ocupado) return;
      button.dataset.ocupado = "1";
      stripState.setWeekOpen(!open);
      try {
        await paintOpenWeek();
      } finally {
        delete button.dataset.ocupado;
        bindWeekButton();
      }
    };
  }
  function bindDayOptions(strip) {
    strip.querySelectorAll(".cdmas").forEach((options) => {
      const day = options.closest("[data-cf]");
      const open = (event) => {
        event.stopPropagation();
        event.preventDefault();
        legacyAgendaParts.dayMenu(options, day?.dataset.cf ?? "", Boolean(day?.classList.contains("bloq")));
      };
      options.addEventListener("click", open, true);
      options.addEventListener("keydown", (event) => {
        if (event.key === "Enter") open(event);
      });
    });
  }
  function bind2(strip) {
    strip.querySelectorAll("[data-cf]").forEach((day) => {
      day.onclick = () => {
        closeMonth();
        strip.querySelectorAll(".cdia").forEach((other) => other.classList.toggle("sel", other === day));
        legacyAgenda.showDay(day.dataset.cf ?? "");
      };
    });
    strip.querySelectorAll("[data-cm]").forEach((arrow) => {
      arrow.onclick = () => {
        stripState.setStart(addDays(stripState.start() ?? mondayOf(todayIso()), Number(arrow.dataset.cm)));
        void paintStrip();
      };
    });
    const month = document.getElementById("cmesb");
    if (month) month.onclick = (event) => {
      event.stopPropagation();
      void toggleMonth();
    };
    const today = document.getElementById("choy");
    if (today) today.onclick = () => {
      stripState.setStart(null);
      legacyAgenda.showDay(todayIso());
    };
    bindDayOptions(strip);
  }
  async function render2() {
    if (!hasStrip() || !document.getElementById("agcuerpo")) return;
    const today = todayIso(), start = stripState.start() ?? mondayOf(legacyAgenda.selectedDate() ?? today), owner = agendaSources.ownerId();
    stripState.setStart(start);
    const end = addDays(start, STRIP_DAYS2 - 1);
    const [result, blocked] = await Promise.all([
      cachedRpc("agenda_rango", { p_desde: start, p_hasta: end, p_usuario: owner }, `agenda-cinta-${owner}-${start}`),
      legacyAgendaParts.blockedDays(start, STRIP_DAYS2)
    ]);
    const body2 = document.getElementById("agcuerpo");
    if (!hasStrip() || stripState.start() !== start || !body2) return;
    const html = stripHtml(start, { today, selected: legacyAgenda.selectedDate(), perDay: perDayOf(result.data ?? [], owner), blocked });
    const old = document.getElementById("agcinta");
    if (old) old.outerHTML = html;
    else body2.insertAdjacentHTML("beforebegin", html);
    const strip = document.getElementById("agcinta");
    if (!strip) return;
    bind2(strip);
    showSelectedWeek(strip, start);
  }
  function showSelectedWeek(strip, start) {
    const weeks = strip.querySelector(".csems"), selected = legacyAgenda.selectedDate();
    if (weeks && selected && selected >= addDays(start, WEEK_DAYS3)) weeks.scrollLeft = weeks.scrollWidth;
  }
  function paintStrip() {
    if (!legacyAgenda.isDayView()) return Promise.resolve();
    if (!stripState.start()) stripState.setStart(mondayOf(legacyAgenda.selectedDate() ?? todayIso()));
    return withData([...stripLoads(), ...stripState.weekOpen() ? weekLoads(legacyAgenda.selectedDate()) : []], async () => {
      await render2();
      if (!legacyAgenda.isDayView() || !document.getElementById("agcinta")) return;
      if (stripState.weekOpen()) await paintOpenWeek();
      bindWeekButton();
    });
  }
  async function shareWeek() {
    stripState.setWeekOpen(true);
    await paintOpenWeek();
    bindWeekButton();
    const plan = document.getElementById("semplan");
    if (plan) {
      document.getElementById("agsemexp")?.scrollIntoView({ behavior: "smooth", block: "start" });
      plan.click();
    }
  }

  // src/app/screens/agenda/week-sidebar.ts
  var SHOWN_PER_DAY2 = 3;
  var WEEK_DAYS4 = 7;
  var timeOf = (item) => String(item.hora ?? "");
  function byDay(list) {
    const days = /* @__PURE__ */ new Map();
    list.filter((item) => !appointments.isCancelled(item.estado)).forEach((item) => {
      days.set(item.fecha, [...days.get(item.fecha) ?? [], item]);
    });
    days.forEach((items) => items.sort((first, second) => timeOf(first).localeCompare(timeOf(second))));
    return days;
  }
  function dayContent(items, blockedReason) {
    const blocked = blockedReason ? `<span class="agslb">${escapeHtml(blockedReason)}</span>` : "";
    const shown = items.slice(0, SHOWN_PER_DAY2).map((item) => `<span class="agslx"><b>${escapeHtml(timeOf(item).slice(0, 5))}</b>${escapeHtml(orFallback(item.medico, item.nombre ?? ""))}</span>`).join("");
    const more = items.length > SHOWN_PER_DAY2 ? `<span class="agslv">${t("agenda.week.andMore", { count: items.length - SHOWN_PER_DAY2 })}</span>` : "";
    const free = !items.length && !blockedReason ? `<span class="agslv">${t("agenda.week.free")}</span>` : "";
    return blocked + shown + more + free;
  }
  function dayHtml(isoDate, items, context) {
    const date = fromIsoDate(isoDate), blockedReason = context.blocked[isoDate];
    const classes = ["agsld", isoDate === context.today ? "hoy" : "", isoDate === context.selected ? "sel" : "", blockedReason ? "bloq" : ""].filter(Boolean).join(" ");
    const weekday = t("dates.weekdaysShort").split(",")[date.getDay()] ?? "";
    const menu = isoDate >= context.today ? `<button type="button" class="agslm" data-agslm="${isoDate}" aria-label="${t("agenda.week.dayOptions", { date: formatShortDate(isoDate) })}">⋯</button>` : "<span></span>";
    return `<div class="${classes}" data-agsl="${isoDate}" role="button" tabindex="0" aria-label="${t("agenda.week.seeDay", { date: formatShortDate(isoDate) })}">
        <span class="agslf">${date.getDate()}<small>${weekday}</small></span>
        <span class="agslc">${dayContent(items, blockedReason)}</span>
        ${menu}</div>`;
  }
  function bind3(box, blocked) {
    box.querySelectorAll("[data-agslm]").forEach((button) => {
      button.onclick = (event) => {
        event.stopPropagation();
        const day = button.dataset.agslm ?? "";
        legacyAgendaParts.dayMenu(button, day, Boolean(blocked[day]));
      };
    });
    box.querySelectorAll("[data-agsl]").forEach((day) => {
      const show2 = () => {
        legacyAgenda.showDay(day.dataset.agsl ?? "");
      };
      day.onclick = show2;
      day.onkeydown = (event) => {
        if (event.key === "Enter") show2();
      };
    });
    const share = document.getElementById("agslrep");
    if (share) share.onclick = () => {
      void shareWeek();
    };
  }
  function sidebarBox() {
    const existing = document.getElementById("agsemlat");
    if (existing) return existing;
    document.getElementById("agcuerpo")?.insertAdjacentHTML("afterend", '<div class="card" id="agsemlat"></div>');
    return document.getElementById("agsemlat");
  }
  async function paint() {
    if (currentScreen() !== "agenda" || legacyAgendaParts.mode() !== "dia") return;
    if (!document.getElementById("v-agenda")?.classList.contains("agcinta")) return;
    const box = sidebarBox();
    if (!box) return;
    const today = todayIso(), selected = legacyAgenda.selectedDate(), monday = mondayOf(selected ?? today);
    const [result, blocked] = await Promise.all([
      cachedRpc("agenda_rango", { p_desde: monday, p_hasta: addDays(monday, WEEK_DAYS4 - 1), p_usuario: legacyAgenda.userFilter() }, `agenda-${monday}`),
      legacyAgendaParts.blockedDays(monday, WEEK_DAYS4)
    ]);
    if (!document.getElementById("agsemlat")) return;
    const days = range(WEEK_DAYS4).map((index) => addDays(monday, index)), perDay = byDay(result.data ?? []);
    const context = { today, selected, blocked };
    box.innerHTML = `<h2>${t("agenda.week.title")}</h2><p class="sm agslnota">${t("agenda.week.hint")}</p>
    <div class="agsl">${days.map((day) => dayHtml(day, perDay.get(day) ?? [], context)).join("")}</div>
    ${days.some((day) => day >= today) ? `<div class="acts agslacts"><button type="button" class="btn sec" id="agslrep">${t("agenda.week.share")}</button></div>` : ""}`;
    bind3(box, blocked);
  }
  function paintWeekSidebar() {
    return legacyAgenda.isDayView() ? withData(weekLoads(legacyAgenda.selectedDate()), paint) : paint();
  }

  // src/app/screens/agenda/trays.ts
  var CONTEXT_PREFIX = "agband-";
  var ROUTES_MOUNT_MS = 60;
  function dueList() {
    const suggestions = agendaSuggestions.forDay();
    if (!suggestions || suggestions.fecha !== legacyAgenda.selectedDate()) return [];
    const already = withAppointmentToday();
    return suggestions.toca.filter((account) => !already.has(account.id ?? account.cuenta_id));
  }
  function putBackToTodayFirst(actions) {
    const backToToday = document.getElementById("agahoy");
    if (backToToday && !matchMedia("(min-width: 761px)").matches && actions.firstElementChild !== backToToday) actions.prepend(backToToday);
  }
  function trayButtonsHtml(due, pending, inActions) {
    const pendingLabel = t(inActions ? "agenda.trays.pendingShort" : "agenda.trays.pending");
    return `<div class="agband${inActions ? " agbandin" : ""}" id="agband">` + (due ? `<button type="button" data-agbd="toca">${icon("target")} ${t("agenda.trays.due", { visit: term("visita") })} <b>${due}</b></button>` : "") + (pending ? `<button type="button" class="urg" data-agbd="pend">${icon("circle-alert")} ${pendingLabel} <b>${pending}</b></button>` : "") + "</div>";
  }
  function paintTrayButtons() {
    const header = document.querySelector("#agcuerpo .tdhead");
    if (!header) return;
    document.getElementById("agband")?.remove();
    const due = dueList().length, pending = agendaSuggestions.pending().length;
    const actions = document.querySelector("#agcuerpo .tdhead .acts");
    if (actions) putBackToTodayFirst(actions);
    if (!due && !pending) return;
    const html = trayButtonsHtml(due, pending, Boolean(actions));
    if (actions) actions.insertAdjacentHTML("beforeend", html);
    else header.insertAdjacentHTML("afterend", html);
    document.getElementById("agband")?.querySelectorAll("[data-agbd]").forEach((button) => {
      button.onclick = () => {
        openTray(button.dataset.agbd === "toca" ? "toca" : "pend");
      };
    });
  }
  function dueRow(account) {
    const visit = term("visita"), id = account.id ?? "";
    const days = isPresent(account.dias_sin_visita) ? t("agenda.trays.daysWithout", { days: account.dias_sin_visita, visit }) : t("agenda.trays.neverVisited");
    return `<div class="item" style="cursor:default"><span class="ic">${icon("target")}</span>
        <span class="tx"><b>${escapeHtml(account.nombre)}</b><span class="sm">${escapeHtml([account.estado_comercial, days, account.municipio].filter(Boolean).join(" · "))}</span></span>
        <span class="acts" style="margin:0"><button class="btn sec" data-agbf="${id}">${t("agenda.trays.card")}</button><button class="btn sec" data-agbc="${id}">${t("agenda.trays.addAppointment")}</button></span></div>`;
  }
  function pendingRow(item) {
    return `<div class="item" style="cursor:default"><span class="ic w">!</span>
        <span class="tx"><b>${escapeHtml(item.nombre)}</b><span class="sm">${formatShortDate(item.fecha)}${item.centro_nombre ? ` · ${escapeHtml(item.centro_nombre)}` : ""}</span></span>
        <span class="acts" style="margin:0"><button class="btn sec" data-cita="hoy|${item.id}">${t("agenda.trays.moveToToday")}</button><button class="btn sec" data-cita="desc|${item.id}">${t("agenda.trays.discard")}</button></span></div>`;
  }
  function trayHtml(tray, due, pending) {
    const isDue = tray === "toca";
    const title = isDue ? t("agenda.trays.due", { visit: term("visita") }) : t("agenda.trays.pending");
    const text = isDue ? t("agenda.trays.dueText", { professional: term("medico") }) : t("agenda.trays.pendingText");
    const action = isDue ? due.some((account) => account.lat) ? `<button class="btn sec" id="agbruta">${t("agenda.trays.planRoute")}</button>` : "" : pending.length ? `<button class="btn sec" id="agbrepro">${t("agenda.trays.rescheduleAll")}</button>` : "";
    const rows = isDue ? due.map(dueRow).join("") : pending.map(pendingRow).join("");
    return `<div class="tbox"><div class="fh"><h2>${escapeHtml(title)}</h2><button class="x" id="tclose" aria-label="${t("common.close")}">✕</button></div><p class="sm">${escapeHtml(text)}</p>
    <div class="acts" style="margin:8px 0">${action}</div>
    <div class="agbdc"><div class="lista">${rows || `<div class="vacio">${t("agenda.trays.nothingPending")}</div>`}</div></div></div>`;
  }
  function bindTray(panel, due, pending) {
    const close2 = () => {
      panel.classList.remove("abierto");
    };
    const closeButton = document.getElementById("tclose");
    if (closeButton) closeButton.onclick = close2;
    panel.querySelectorAll("[data-agbf]").forEach((button) => {
      button.onclick = () => {
        agendaActions.openAccount(button.dataset.agbf ?? "");
      };
    });
    panel.querySelectorAll("[data-agbc]").forEach((button) => {
      button.onclick = () => {
        agendaActions.newAppointment(button.dataset.agbc ?? "", legacyAgenda.selectedDate());
      };
    });
    const route = document.getElementById("agbruta");
    if (route) route.onclick = () => {
      close2();
      goTo("rutas");
      setTimeout(() => {
        agendaActions.planRoute(due, route);
      }, ROUTES_MOUNT_MS);
    };
    const reschedule = document.getElementById("agbrepro");
    if (reschedule) reschedule.onclick = () => {
      agendaActions.reschedule(pending, t("agenda.trays.pending"), t("agenda.trays.notVisited", { count: pending.length }));
    };
  }
  function openTray(tray) {
    if (!legacyAgenda.isDayView()) return;
    const panel = document.getElementById("tools");
    if (!panel) return;
    const due = tray === "toca" ? dueList() : [], pending = tray === "pend" ? agendaSuggestions.pending() : [];
    panel.innerHTML = trayHtml(tray, due, pending);
    bindTray(panel, due, pending);
    sidePanel.setContext(CONTEXT_PREFIX + tray);
    panel.classList.add("abierto");
  }
  function refreshOpenTray() {
    const context = sidePanel.context() ?? "";
    if (document.getElementById("tools")?.classList.contains("abierto") && context.startsWith(CONTEXT_PREFIX)) openTray(context.slice(CONTEXT_PREFIX.length) === "toca" ? "toca" : "pend");
  }

  // src/app/screens/agenda/team.ts
  function selectorHtml() {
    const me = salesTeam.currentUserId(), viewed = agendaState.viewed();
    const options = salesTeam.members().filter((member) => member.id !== me).map((member) => `<option value="${member.id}" ${viewed?.id === member.id ? "selected" : ""}>${escapeHtml(member.nombre)}</option>`).join("");
    return `<select id="agvista" aria-label="${t("agenda.team.agendaOf")}" title="${t("agenda.team.seeOthers")}">
        <option value="">${t("agenda.team.myAgenda")}</option>${options}</select>`;
  }
  function ensureTeamControls() {
    if (currentScreen() !== "agenda" || !permissions.seesEverything()) return;
    const actions = document.querySelector("#v-agenda > .saludo .acts");
    if (!actions) return;
    let selector = actions.querySelector("#agvista");
    if (!selector) {
      if (!salesTeam.members().length) {
        void salesTeam.load().then(ensureTeamControls);
        return;
      }
      actions.insertAdjacentHTML("afterbegin", selectorHtml());
      selector = actions.querySelector("#agvista");
      if (selector) selector.onchange = () => {
        salesTeam.showAgendaOf(selector?.value ?? "");
      };
    }
    let button = actions.querySelector('[data-ag="equipo"]');
    if (!button) {
      selector?.insertAdjacentHTML("afterend", `<button class="btn sec" data-ag="equipo">${t("agenda.team.team")}</button>`);
      button = actions.querySelector('[data-ag="equipo"]');
    }
    if (!button) return;
    const teamView = legacyAgendaParts.mode() === "equipo";
    button.textContent = t(teamView ? "agenda.team.myAgenda" : "agenda.team.team");
    button.classList.toggle("sec", !teamView);
    button.title = t(teamView ? "agenda.team.backToMine" : "agenda.team.seeTeam");
  }
  async function loadTeamView() {
    const view = document.getElementById("v-agenda");
    if (permissions.seesEverything() && !salesTeam.members().length) await salesTeam.load().catch(() => void 0);
    if (currentScreen() !== "agenda" || legacyAgendaParts.mode() !== "equipo" || !view) return;
    view.classList.remove("agunida", "agcinta", "agb", "agn");
    view.innerHTML = `<div class="saludo"><div><h1>${t("agenda.title")}</h1><div class="fecha" id="agtit">${t("agenda.team.title")}</div></div><div class="acts" style="margin:0"></div></div>
    <div class="card" id="agcuerpo"></div>`;
    ensureTeamControls();
    await legacyAgendaPaint.team();
    view.dataset.listo = "1";
  }

  // src/app/screens/agenda/day-view.ts
  var STRIP_DAYS3 = 14;
  var SCROLL_MARGIN = 90;
  var SCROLL_TOP_LIMIT = 80;
  var SCROLL_BOTTOM_RATIO = 0.6;
  var agendaView = () => document.getElementById("v-agenda");
  var dayBody = () => document.getElementById("agcuerpo");
  function titleText() {
    const viewed = agendaState.viewed();
    return t("agenda.todayTitle", { date: formatLongDate(todayIso()) }) + (viewed && legacyAgenda.isDayView() ? t("agenda.agendaOf", { name: viewed.nombre }) : "");
  }
  function markEmptyDay() {
    const body2 = dayBody();
    if (!body2 || currentScreen() !== "agenda") return;
    const empty = body2.querySelector(":scope > .vacio"), stats = body2.querySelector(".tdhead .tdstats");
    stats?.classList.toggle("hide", Boolean(empty) && !body2.querySelector(".tdesc"));
    if (!empty) return;
    empty.classList.add("vlinea");
    const selected = legacyAgenda.selectedDate();
    if (selected && selected < todayIso()) empty.textContent = t("agenda.noAppointmentsThatDay");
  }
  function markSelectedDay() {
    const view = agendaView();
    if (!view?.classList.contains("agunida")) return;
    const today = todayIso(), selected = legacyAgenda.selectedDate();
    const title = document.getElementById("agtit");
    if (title) title.textContent = titleText();
    const heading = view.querySelector("#agcuerpo .tdhead h2");
    if (!heading) return;
    let back = document.getElementById("agahoy");
    if (!selected || selected === today) {
      back?.remove();
      return;
    }
    heading.textContent = capitalise(formatLongDate(selected));
    back ?? (back = addBackToToday(heading));
    if (back) putFirstOnMobile(view, back);
    heading.parentElement?.classList.add("agtitdia");
  }
  function putFirstOnMobile(view, back) {
    const actions = !matchMedia("(min-width: 761px)").matches && view.querySelector("#agcuerpo .tdhead .acts");
    if (actions && actions.firstElementChild !== back) actions.prepend(back);
  }
  function addBackToToday(heading) {
    heading.insertAdjacentHTML("afterend", `<button type="button" class="btn sec" id="agahoy">${t("agenda.backToToday")}</button>`);
    const back = document.getElementById("agahoy");
    if (back) back.onclick = () => {
      void showDay(todayIso());
    };
    return back;
  }
  function headerHtml3() {
    return `
      <div class="saludo"><div><h1>${t("agenda.title")}</h1><div class="fecha" id="agtit">${escapeHtml(titleText())}</div></div>
        <div class="aghud" id="aghud" aria-label="${t("agenda.yourNumbers")}">${metricsHtml()}</div>
        <div class="acts" style="margin:0"><button class="btn" data-ag="nueva">${t("agenda.newAppointment")}</button></div></div>
      <div class="card" id="agcuerpo"></div>
      <div class="card" id="agsemlat"></div>`;
  }
  function dayToShow() {
    const today = todayIso(), selected = legacyAgenda.selectedDate(), lastToday = agendaState.lastTodaySeen();
    const day = !selected || selected === lastToday && lastToday !== today ? today : selected;
    agendaState.setSelectedDate(day);
    if (day === today) agendaState.setLastTodaySeen(day);
    return day;
  }
  async function loadDayView() {
    const view = agendaView();
    if (!view) return;
    const day = dayToShow();
    agendaState.forgetDayTasks();
    stripState.setStart(mondayOf(day));
    view.dataset.listo = "";
    const scroll = scrollY, same = view.classList.contains("agn") && dayBody();
    if (same) dayBody()?.classList.add("agcargando");
    let suggestions = null, metrics = null;
    await withData([
      ...dayLoads(day),
      loadSuggestions(day).then((found) => {
        suggestions = found;
      }),
      Promise.resolve(callRpc("agenda_metricas", { p_usuario: legacyAgenda.viewedUserId() })).then((result) => {
        metrics = result.data;
      }),
      ...stripLoads(),
      ...weekLoads(day),
      permissions.seesEverything() && !salesTeam.members().length ? salesTeam.load() : null
    ], async () => {
      if (legacyAgenda.selectedDate() !== day || currentScreen() !== "agenda" || legacyAgendaParts.mode() !== "dia") return;
      if (metrics) legacyAgenda.setMetrics(metrics);
      applySuggestions(day, suggestions);
      view.classList.add("agunida", "agcinta", "agb", "agn");
      view.innerHTML = headerHtml3();
      ensureTeamControls();
      await Promise.all([legacyAgendaPaint.yourDay(), paintStrip(), paintWeekSidebar()]);
      markSelectedDay();
      markEmptyDay();
      if (!agendaState.viewed()) legacyAgendaPaint.noStartWarning(dayBody());
      if (same) window.scrollTo(0, scroll);
      view.dataset.listo = "1";
      refreshOpenTray();
    });
  }
  async function loadAgenda() {
    if (currentScreen() !== "agenda" || !agendaView()) return;
    const mode = legacyAgendaParts.mode();
    if (mode === "equipo") {
      await loadTeamView();
      return;
    }
    const plan = agendaState.takeWeekPlanRequest();
    if (mode === "semana") stripState.setWeekOpen(true);
    agendaState.setMode("dia");
    await loadDayView();
    if (mode === "mes") void toggleMonth();
    if (plan) void shareWeek();
  }
  function scrollToDay() {
    const body2 = dayBody();
    if (!body2) return;
    const top = body2.getBoundingClientRect().top;
    if (top < SCROLL_TOP_LIMIT || top > innerHeight * SCROLL_BOTTOM_RATIO) scrollTo({ top: scrollY + top - SCROLL_MARGIN, behavior: "smooth" });
  }
  async function showDay(day) {
    document.querySelectorAll(".agpop").forEach((element) => {
      element.remove();
    });
    closeMonth();
    if (!day) return;
    if (!legacyAgenda.isDayView()) {
      agendaState.setMode("dia");
      agendaState.setSelectedDate(day);
      await loadAgenda();
      return;
    }
    const before = legacyAgenda.selectedDate() ?? day, start = stripState.start();
    agendaState.setSelectedDate(day);
    dayBody()?.classList.add("agcargando");
    const outside = !start || day < start || day > addDays(start, STRIP_DAYS3 - 1);
    if (outside) stripState.setStart(mondayOf(day));
    const otherWeek = mondayOf(day) !== mondayOf(before);
    let suggestions = null;
    try {
      await withData([...dayLoads(day), loadSuggestions(day).then((found) => {
        suggestions = found;
      }), ...outside ? stripLoads() : [], ...weekLoads(day)], async () => {
        if (legacyAgenda.selectedDate() !== day || !legacyAgenda.isDayView()) return;
        applySuggestions(day, suggestions);
        const pieces = [legacyAgendaPaint.yourDay(), paintWeekSidebar()];
        if (outside || otherWeek && stripState.weekOpen()) pieces.push(paintStrip());
        await Promise.all(pieces);
        if (!outside) document.querySelectorAll("#agcinta .cdia").forEach((element) => {
          element.classList.toggle("sel", element.dataset.cf === day);
        });
        markSelectedDay();
        markEmptyDay();
        refreshMetrics();
      });
    } finally {
      dayBody()?.classList.remove("agcargando");
    }
    if (legacyAgenda.selectedDate() === day) scrollToDay();
  }
  function refreshAfterChange() {
    if (!legacyAgenda.isDayView()) return;
    const day = legacyAgenda.selectedDate() ?? todayIso();
    let suggestions = null;
    void reloadMetrics();
    void withData([...stripLoads(), ...weekLoads(day), loadSuggestions(day).then((found) => {
      suggestions = found;
    })], async () => {
      if (legacyAgenda.selectedDate() !== day || !legacyAgenda.isDayView()) return;
      applySuggestions(day, suggestions);
      await Promise.all([paintStrip(), paintWeekSidebar()]);
      paintSameCentre();
      paintTrayButtons();
    });
    refreshOpenMonth();
  }

  // src/app/screens/agenda/appointment-state.ts
  var colorOf = (state) => commercialStates.color(state) ?? "var(--muted)";
  var isOpen = (state) => appointments.isOpen(state);
  var isCancelled = (state) => appointments.isCancelled(state);
  var isDone = (state) => commercialStates.color(state) === "var(--ok)";
  var isAbsent = (state) => commercialStates.color(state) === "var(--warn)" && !isOpen(state);
  function statePill(state) {
    const color2 = colorOf(state);
    return `<span class="pill cest" style="background:color-mix(in srgb, ${color2} 12%, transparent);color:${color2}">${escapeHtml(state)}</span>`;
  }
  function pointOf(item) {
    return item.lat !== null && item.lat !== void 0 && item.lon !== null && item.lon !== void 0 ? [Number(item.lat), Number(item.lon)] : null;
  }
  var STATES = { planned: "Planificada", confirmed: "Confirmada", discarded: "Descartada", postponed: "Aplazada" };
  var canPlanAgain = (item, today) => (item.estado === STATES.postponed || item.estado === STATES.discarded) && item.fecha >= today;

  // src/app/screens/agenda/appointment-options.ts
  var option = (action, title, detail = "") => ({ action, title: t(title), detail });
  function menuOptions(item) {
    const today = todayIso();
    if (!isOpen(item.estado)) {
      if (!canPlanAgain(item, today)) return [];
      return [{ action: "rehacer", title: t("agenda.menu.planAgain"), detail: t("agenda.menu.planAgainText") + (item.estado === STATES.postponed ? t("agenda.menu.planAgainPostponed") : "") }];
    }
    return [
      option("hora", item.hora ? "agenda.menu.changeTime" : "agenda.menu.setTime"),
      { ...option("aplazar", "agenda.menu.postpone"), detail: t("agenda.menu.postponeText") },
      item.estado === STATES.planned ? { ...option("confirmar", "agenda.menu.confirm"), detail: t("agenda.menu.confirmText") } : null,
      item.estado === STATES.confirmed ? option("desconfirmar", "agenda.menu.unconfirm") : null,
      { ...option("descartar", "agenda.menu.discard"), detail: t("agenda.menu.discardText") },
      item.fecha >= today ? { ...option("borrar", "agenda.menu.delete"), detail: t("agenda.menu.deleteText") } : null
      // v2.273.0
    ].filter((entry) => entry !== null);
  }
  var hasMenu = (item) => menuOptions(item).length > 0;

  // src/app/screens/agenda/your-day/card.ts
  var DAY_MS2 = 864e5;
  var NEXT_GRACE_MINUTES = 15;
  var timeText = (time) => escapeHtml(String(time).slice(0, 5));
  function minutesOf(item, estimates) {
    if (item.hora) return Number(String(item.hora).slice(0, 2)) * 60 + Number(String(item.hora).slice(3, 5));
    return estimates[item.id] ?? null;
  }
  function nextOf(open, estimates, now) {
    return open.find((item) => {
      const minutes = minutesOf(item, estimates);
      return minutes === null || minutes + NEXT_GRACE_MINUTES >= now;
    }) ?? null;
  }
  var daysSince = (isoDate) => Math.max(0, Math.round((fromIsoDate(todayIso()).getTime() - fromIsoDate(String(isoDate).slice(0, 10)).getTime()) / DAY_MS2));
  function shownTime(item, context) {
    const info = context.info[item.id] ?? {}, estimate = context.estimates[item.id];
    if (item.hora) return timeText(item.hora);
    if (!isOpen(item.estado)) return "·";
    if (context.noFitBanner && isPresent(info.llegada) && info.llegada >= context.limit) return "—";
    return estimate !== void 0 && !context.isPast ? `~${formatMinutes(estimate)}` : "·";
  }
  function whenText(item, time, context) {
    if (!isOpen(item.estado)) return "";
    const minutes = minutesOf(item, context.estimates), left = minutes === null ? null : minutes - context.now;
    if (item === context.next && left !== null && left > 0) return t("agenda.card.inTime", { time: `${left >= 60 ? `${Math.floor(left / 60)} h ` : ""}${left % 60} min` });
    return time.startsWith("~") ? t("agenda.card.estimatedTime") : "";
  }
  function warningOf(item, context) {
    const info = context.info[item.id] ?? {};
    if (!isOpen(item.estado) || !info.aviso) return "";
    if (info.lejos) return t("agenda.card.farLocation", { km: formatNumber(info.lejos) });
    return context.noFitBanner ? "" : info.aviso;
  }
  function windowsLine(item, info, warning) {
    if (!isOpen(item.estado) || warning || !info.ventanas?.length) return null;
    const text = t("agenda.card.attends", { windows: yourDayLegacy.windowsText(info.ventanas) }) + (info.espera ? t("agenda.card.waits", { minutes: info.espera }) : "");
    return ["puerta", "", escapeHtml(text)];
  }
  function previousLine(item, visit) {
    if (item.anterior === void 0) return null;
    if (!item.anterior) return ["reloj", "", t("agenda.card.firstVisit", { visit })];
    const days = daysSince(item.anterior.fecha);
    return ["reloj", "", t("agenda.card.lastVisit", { visit, days, unit: t(days === 1 ? "agenda.card.day" : "agenda.card.days") })];
  }
  function warningLine(item, info, warning) {
    if (!warning) return null;
    return ["aviso", "tdav tdaviso", `${escapeHtml(warning)} <button type="button" class="tdavi" data-tdavi="${item.id}" aria-label="${t("agenda.yourDay.whyWarning")}">i</button>`, yourDayLegacy.explainWarning(info)];
  }
  function detailLines(item, context) {
    const info = context.info[item.id] ?? {}, warning = warningOf(item, context), action = item.anterior?.proxima_accion;
    const lines = [
      action ? ["toca", "toca", t("agenda.card.due", { action: escapeHtml(action) })] : null,
      previousLine(item, context.visit),
      windowsLine(item, info, warning),
      warningLine(item, info, warning),
      isOpen(item.estado) && !pointOf(item) ? ["aviso", "tdav", t("agenda.card.noLocation")] : null,
      item.nota ? ["nota", "", escapeHtml(item.nota)] : null
    ];
    return lines.filter((line) => line !== null);
  }
  function ladderHtml(item, ladder) {
    const level = ladder.findIndex((step) => step.valor === item.estado_comercial);
    if (!ladder.length || level < 0) return "";
    const goal = ladder[level + 1];
    const bars = range(ladder.length).map((index) => `<i class="${index <= level ? "on" : index === level + 1 ? "obj" : ""}"></i>`).join("");
    return `<div class="tdu-niv"><div class="tdu-barra" title="${escapeHtml(ladder.map((step) => step.valor).join(" → "))}">${bars}</div>
        <span class="tdu-nt"><b>${escapeHtml(item.estado_comercial)}</b>${goal ? ` → ${escapeHtml(goal.valor)}` : t("agenda.card.keep")}</span></div>`;
  }
  function headHtml(item, index, context) {
    const time = shownTime(item, context), when = whenText(item, time, context), next = item === context.next;
    const where = [item.centro_nombre, item.municipio].filter(Boolean).join(" · ") || t("agenda.card.noCentre");
    return `<div class="tdu-cab">
        <div class="tdu-av" aria-hidden="true">${escapeHtml(initialsOf(item.nombre ?? ""))}<span class="n">${index + 1}</span></div>
        <div class="tdu-tit">${next ? `<span class="tdu-sig"><i></i>${t("agenda.card.next")}</span>` : ""}
          <div class="tdu-nom"><b class="tdu-nb" title="${t("agenda.card.seeAppointment")}">${escapeHtml(item.nombre)}</b>${item.clase ? `<span class="tdu-k ${escapeHtml(item.clase)}" title="${t("agenda.card.classTitle", { name: escapeHtml(item.clase) })}">${escapeHtml(item.clase)}</span>` : ""}${item.urgente ? `<span class="pill p-urg">${t("agenda.card.urgent")}</span>` : ""}</div>
          <span class="tdu-sub">${escapeHtml(where)}</span></div>
        <div class="tdu-hora"><span class="h" title="${t(item.hora ? "agenda.card.fixedTime" : "agenda.card.estimatedByOrder")}">${time}</span>${when ? `<span class="tdu-cu">${when}</span>` : ""}</div>
      </div>`;
  }
  function orderButtons(item, context) {
    const position = context.open.indexOf(item);
    return `<button class="kmv" type="button" data-td="sube|${item.id}" aria-label="${t("agenda.card.moveUp")}" title="${t("agenda.card.moveUp")}" ${position <= 0 ? "disabled" : ""}>${legacyIcons.arrow("arriba")}</button><button class="kmv" type="button" data-td="baja|${item.id}" aria-label="${t("agenda.card.moveDown")}" title="${t("agenda.card.moveDown")}" ${position >= context.open.length - 1 ? "disabled" : ""}>${legacyIcons.arrow("abajo")}</button>`;
  }
  function footHtml(item, context) {
    const open = isOpen(item.estado), canMove = open && !context.isPast, record = open && yourDayLegacy.canRecordOn(item.fecha);
    const again = isAbsent(item.estado) && !context.isPast;
    return `<div class="tdu-pie"><span class="tdu-est">${statePill(item.estado)}<span class="sm">${yourDayLegacy.originText(item)}</span></span>
        <span class="tdu-ops">${canMove ? orderButtons(item, context) : ""}${hasMenu(item) ? `<button class="btn sec tdmas" type="button" data-td="mas|${item.id}" aria-label="${t("agenda.card.moreActions")}">⋯</button>` : ""}</span>
        ${again ? `<button class="btn sec tdu-reg" type="button" data-td="nueva|${item.id}">${t("agenda.card.newAppointment")}</button>` : ""}
        ${record ? `<button class="btn ${item === context.next ? "" : "sec"} tdu-reg" type="button" data-td="visita|${item.id}">${t("agenda.card.record", { visit: context.visit })}</button>` : ""}</div>`;
  }
  function statusClass(state) {
    if (isOpen(state)) return "abierta";
    if (isDone(state)) return "hecha";
    return isAbsent(state) ? "ausente" : "cerrada";
  }
  function appointmentCard(item, index, context) {
    const open = isOpen(item.estado), mini = !open && !isDone(item.estado) && !isAbsent(item.estado), lines = detailLines(item, context);
    const classes = `tdu ${item === context.next ? "sig" : ""} ${open ? "" : "hecha"} ${mini ? "tdmini" : ""} tdst-${statusClass(item.estado)}`;
    const details = lines.length ? `<ul class="tdu-dat">${lines.map(([iconName, className, html, title]) => `<li class="${className}"${title ? ` title="${escapeHtml(title)}"` : ""}>${legacyIcons.line(iconName)}<span>${html}</span></li>`).join("")}</ul>` : "";
    return `<article class="${classes}" data-tdu="${item.id}" data-tdf="${item.cuenta_id}" tabindex="0" aria-label="${escapeHtml(item.nombre)}">
      ${headHtml(item, index, context)}
      ${ladderHtml(item, context.ladder)}
      ${details}
      ${footHtml(item, context)}
    </article>`;
  }

  // src/app/screens/agenda/your-day/header.ts
  var DAY_MINUTES = 24 * 60;
  function compactButton(compact2) {
    const title = t(compact2 ? "agenda.yourDay.showDetail" : "agenda.yourDay.compactTitle"), label = t(compact2 ? "agenda.yourDay.showDetail" : "agenda.yourDay.compactLabel");
    return `<button type="button" class="btn sec chico plic" id="tdcompactar" aria-pressed="${String(compact2)}" title="${title}" aria-label="${label}">${legacyIcons.list(compact2 ? "file-text" : "list")}</button>`;
  }
  function setCompactButton(button, compact2) {
    button.title = t(compact2 ? "agenda.yourDay.showDetail" : "agenda.yourDay.compactTitle");
    button.setAttribute("aria-label", t(compact2 ? "agenda.yourDay.showDetail" : "agenda.yourDay.compactLabel"));
    button.innerHTML = legacyIcons.list(compact2 ? "file-text" : "list");
    button.setAttribute("aria-pressed", String(compact2));
  }
  function statsHtml(summary) {
    const end = summary.open && !summary.isPast ? `<span>${t("agenda.yourDay.estimatedEnd")} <b style="color:${summary.overReturn ? "var(--warn)" : "var(--navy)"}">${formatMinutes(summary.end)}</b>${summary.overReturn ? t("agenda.yourDay.overReturn") : ""}${summary.end >= DAY_MINUTES ? ` <span class="sm">${t("agenda.yourDay.nextDay")}</span>` : ""}</span>` : "";
    return `<div class="tdstats">
          <span>${t("agenda.yourDay.appointments", { count: formatNumber(summary.active) })}</span>
          <span>${t("agenda.yourDay.visited", { count: formatNumber(summary.done) })}</span>
          ${summary.absent ? `<span>${t("agenda.yourDay.absent", { count: formatNumber(summary.absent) })}</span>` : ""}
          <span>${t("agenda.yourDay.toDo", { count: summary.open })}</span>
          ${end}
        </div>`;
  }
  function workingDayButton(summary) {
    if (!summary.isToday || !summary.isOwner) return "";
    if (summary.workingDay) return `<button class="btn dang chico" id="tdterminar">${t("agenda.yourDay.endDay")}</button>`;
    return summary.open ? `<button class="btn chico" id="tdempezar">${t("agenda.yourDay.startDay")}</button>` : "";
  }
  function actionsHtml2(summary) {
    const { isPast, own, open, withPlace } = summary;
    return `<div class="acts">
        ${own ? `<button type="button" class="btn sec chico" id="tdtarea">${t("agenda.yourDay.addTask")}</button>` : ""}
        ${!isPast && withPlace > 1 ? `<button class="btn sec chico" id="tdordenar" title="${t("agenda.yourDay.orderTitle")}">${t("agenda.yourDay.orderByDistance")}</button>` : ""}
        ${workingDayButton(summary)}
        ${isPast && open ? `<button class="btn chico" id="tdrepro">${t("agenda.yourDay.reschedulePending")}</button>` : ""}
      </div>`;
  }
  function headerHtml4(summary) {
    const title = t(summary.isToday ? "agenda.yourDay.titleToday" : summary.isPast ? "agenda.yourDay.titlePast" : "agenda.yourDay.titleFuture");
    const dayMenu = summary.isFutureOrToday ? `<button type="button" class="kmv tddiamas" id="tddiamas" aria-label="${t("agenda.yourDay.dayOptions")}" title="${t("agenda.yourDay.dayOptionsTitle")}">${legacyIcons.line("mas")}</button>` : "";
    return `
    <div class="tdhead">
      <div class="${summary.isFutureOrToday ? "tdtitw" : ""}"><h2 style="padding:0">${title}</h2>${summary.mine > 1 ? compactButton(summary.compact) : ""}${dayMenu}
        ${statsHtml(summary)}</div>
      ${actionsHtml2(summary)}
    </div>`;
  }
  function workingDayHtml(summary, duration) {
    return summary.isToday && summary.workingDay ? `<div class="tdjornada">${t("agenda.yourDay.workingDay", { time: duration, visit: summary.visit })}</div>` : "";
  }
  function noFitHtml(noFit) {
    if (!noFit.shown) return "";
    const end = t(noFit.end >= DAY_MINUTES ? "agenda.yourDay.endAfterMidnight" : "agenda.yourDay.endAround", { time: formatMinutes(noFit.end) });
    const outside = noFit.outside ? noFit.outside === 1 ? t("agenda.yourDay.outsideOne") : t("agenda.yourDay.outsideMany", { count: noFit.outside }) : "";
    const head = noFit.overLimit ? t("agenda.yourDay.noFit", { end, outside }) : t("agenda.yourDay.badWindows");
    const order = noFit.canOrder ? `<button type="button" class="btn sec chico" id="tdnocord">${t("agenda.yourDay.orderByDistance")}</button>${t("agenda.yourDay.or")}` : "";
    return `<div class="banda-aviso" id="tdnocabe">${head}
      ${t("agenda.yourDay.beforeEach")}${order}${t("agenda.yourDay.moveFarthest")}</div>`;
  }
  function othersHtml(others) {
    if (!others.length) return "";
    return `<h3 class="tdotros">${t("agenda.yourDay.othersTitle", { count: others.length })}</h3>
      <div class="lista">${others.map((item) => `<div class="item" style="cursor:default"><span class="ic">${item.hora ? timeText(item.hora) : "·"}</span>
        <span class="tx"><b>${escapeHtml(item.nombre)}</b><span class="sm">${escapeHtml(item.usuario ?? "")} · ${statePill(item.estado)}</span></span></div>`).join("")}</div>`;
  }

  // src/app/screens/agenda/your-day/tasks.ts
  var FOLDED_KEY = "delcos-tareas-plegadas";
  function folded() {
    try {
      return localStorage.getItem(FOLDED_KEY) === "1";
    } catch {
      return false;
    }
  }
  function taskRow(task, list) {
    const moves = list.length > 1 ? `<span class="tdtmov"><button type="button" class="kmv" data-tamov="-1|${task.id}" aria-label="${t("agenda.tasks.up")}" ${list[0] === task ? "disabled" : ""}>↑</button><button type="button" class="kmv" data-tamov="1|${task.id}" aria-label="${t("agenda.tasks.down")}" ${list[list.length - 1] === task ? "disabled" : ""}>↓</button></span>` : "";
    return `
    <div class="tdtarea ${task.hecha ? "hecha" : ""}" data-tarea="${task.id}">
      <label class="tdtchk"><input type="checkbox" data-tacheck="${task.id}" ${task.hecha ? "checked" : ""} aria-label="${t("agenda.tasks.done")}"></label>
      <span class="tdth">${task.hora ? timeText(task.hora) : ""}</span>
      <span class="tdttx"><b>${escapeHtml(task.titulo)}</b>${task.nota ? `<span class="sm">${escapeHtml(task.nota)}</span>` : ""}</span>
      ${moves}
    </div>`;
  }
  async function markDone(box) {
    const { error } = await legacyDb().from("tareas").update({ hecha: box.checked, modificado_en: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", box.dataset.tacheck);
    if (error) {
      notices.toast(t("agenda.tasks.couldNotSave"), true);
      box.checked = !box.checked;
      return;
    }
    box.closest(".tdtarea")?.classList.toggle("hecha", box.checked);
    agendaState.forgetDayTasks();
  }
  function bind4(block) {
    block.querySelectorAll("[data-tacheck]").forEach((box) => {
      box.onchange = (event) => {
        event.stopPropagation();
        void markDone(box);
      };
    });
  }
  function paintTasks(body2, list) {
    document.getElementById("tdtareas")?.remove();
    if (!list?.length) return;
    const place = document.getElementById("tdnocabe") ?? body2.querySelector(".tdesc, .vacio");
    const html = `<div class="tdtareas" id="tdtareas"><div class="tdtcab">${t("agenda.tasks.title", { count: list.length })}</div>${list.map((task) => taskRow(task, list)).join("")}</div>`;
    if (place) place.insertAdjacentHTML("beforebegin", html);
    else body2.insertAdjacentHTML("beforeend", html);
    const block = document.getElementById("tdtareas");
    if (block) bind4(block);
  }
  function applyTaskFolding() {
    const block = document.getElementById("tdtareas"), header = block?.querySelector(".tdtcab");
    if (!block || !header) return;
    block.classList.toggle("plegadas", folded());
    header.setAttribute("role", "button");
    header.tabIndex = 0;
    header.setAttribute("aria-expanded", String(!folded()));
    header.title = t(folded() ? "agenda.tasks.show" : "agenda.tasks.hide");
    if (header.foldBound) return;
    header.foldBound = true;
    const toggle = () => {
      try {
        localStorage.setItem(FOLDED_KEY, folded() ? "0" : "1");
      } catch {
      }
      applyTaskFolding();
    };
    header.onclick = toggle;
    header.onkeydown = (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggle();
      }
    };
  }

  // src/app/screens/agenda/your-day/index.ts
  var COMPACT_KEY = "delcos-tdcompacto";
  var DEFAULT_LIMIT = 21 * 60;
  var WARNINGS_FOR_BANNER = 3;
  function compact() {
    try {
      return localStorage.getItem(COMPACT_KEY) === "1";
    } catch {
      return false;
    }
  }
  var applyCompact = () => {
    document.body.classList.toggle("tdcompacto", compact());
  };
  function buildContext(data, estimate) {
    const { day, today, mine } = data, isPast = day < today, info = yourDayLegacy.stopInfo();
    const open = mine.filter((item) => isOpen(item.estado)), limit = Number.isFinite(estimate.tope) ? estimate.tope : DEFAULT_LIMIT;
    const warnings = Object.values(info).filter((stop) => stop.aviso && !stop.lejos).length;
    const overLimit = !isPast && open.length > 0 && estimate.fin > limit, banner = !isPast && open.length > 0 && (overLimit || warnings >= WARNINGS_FOR_BANNER);
    const now = (/* @__PURE__ */ new Date()).getHours() * 60 + (/* @__PURE__ */ new Date()).getMinutes(), withPlace = open.filter((item) => pointOf(item)).length;
    const viewed = legacyAgenda.viewedUserId(), visit = term("visita");
    const context = {
      day,
      isPast,
      now,
      visit,
      estimates: estimate.est,
      info,
      open,
      next: day === today ? nextOf(open, estimate.est, now) : null,
      ladder: commercialStates.all().filter((step) => step.papel !== "negativo"),
      noFitBanner: banner,
      limit
    };
    const summary = {
      isToday: day === today,
      isPast,
      isFutureOrToday: day >= today,
      mine: mine.length,
      active: mine.filter((item) => !isCancelled(item.estado)).length,
      done: mine.filter((item) => isDone(item.estado)).length,
      absent: mine.filter((item) => isAbsent(item.estado)).length,
      open: open.length,
      end: estimate.fin,
      overReturn: open.length > 0 && estimate.fin > estimate.tope,
      withPlace,
      own: !viewed || agendaSources.isOwnAgenda(),
      isOwner: agendaSources.isOwnAgenda(),
      workingDay: yourDayLegacy.workingDay(),
      compact: compact(),
      visit
    };
    const outside = Object.values(info).filter((stop) => stop.llegada !== null && stop.llegada !== void 0 && stop.llegada >= limit).length;
    return { context, summary, noFit: { shown: banner, overLimit, end: estimate.fin, outside, canOrder: !isPast && withPlace > 1 } };
  }
  function on(id, action) {
    const button = document.getElementById(id);
    if (button) button.onclick = action;
  }
  function bindHeader2(data, open) {
    on("tdempezar", () => {
      yourDayLegacy.startWorkingDay();
    });
    on("tdterminar", () => {
      yourDayLegacy.endWorkingDay();
    });
    on("tdrepro", () => {
      agendaActions.reschedule(open, t("agenda.yourDay.pendingOf", { date: formatShortDate(data.day) }), t("agenda.yourDay.notVisitedThatDay"));
    });
    on("tddiamas", (event) => {
      event.stopPropagation();
      const stripDay = document.querySelector(`#agcinta [data-cf="${data.day}"]`), button = document.getElementById("tddiamas");
      if (button) legacyAgendaParts.dayMenu(button, data.day, Boolean(stripDay?.classList.contains("bloq")));
    });
  }
  async function paintDay() {
    const day = legacyAgenda.selectedDate() ?? todayIso(), today = todayIso();
    const result = await cachedRpc("agenda_rango", { p_desde: day, p_hasta: day, p_usuario: legacyAgenda.userFilter() }, `agenda-${day}`);
    const body2 = document.getElementById("agcuerpo");
    if (legacyAgenda.selectedDate() !== day || legacyAgendaParts.mode() !== "dia" || !body2) return;
    const all = result.data ?? [], owner = agendaSources.ownerId();
    const data = { day, today, mine: all.filter((item) => item.usuario_id === owner), others: all.filter((item) => item.usuario_id !== owner) };
    yourDayLegacy.setDayAppointments(data.mine);
    const { context, summary, noFit } = buildContext(data, yourDayLegacy.estimateDay(data.mine, day));
    const cards = data.mine.length ? `<div class="tdesc" aria-label="${t("agenda.yourDay.dayAppointments")}">${data.mine.map((item, index) => appointmentCard(item, index, context)).join("")}</div>` : `<div class="vacio">${t(summary.isToday ? "agenda.yourDay.emptyToday" : "agenda.yourDay.emptyOther")}</div>`;
    body2.innerHTML = `${headerHtml4(summary)}
    ${workingDayHtml(summary, summary.workingDay ? formatDuration(Date.now() - summary.workingDay.inicio) : "")}
    ${noFitHtml(noFit)}
    ${cards}
    ${othersHtml(data.others)}`;
    bindHeader2(data, context.open);
    refreshMetrics();
    yourDayLegacy.prepareRouteStops(day);
    if (!summary.own) return;
    const tasks = await agendaSources.dayTasks(day);
    const fresh = document.getElementById("agcuerpo");
    if (legacyAgenda.selectedDate() === day && fresh) paintTasks(fresh, tasks);
  }
  function markQueuedVisits() {
    const day = legacyAgenda.selectedDate();
    const queued = yourDayLegacy.queuedVisits().filter((item) => item.fn === "registrar_actividad" && item.payload?.p?.fecha === day);
    const byId = new Map(legacyAgenda.dayAppointments().map((item) => [String(item.id), item]));
    document.querySelectorAll("#agcuerpo .tdu[data-tdu]").forEach((card) => {
      const item = byId.get(card.dataset.tdu ?? "");
      if (!item) return;
      const pending = queued.some((entry) => entry.payload?.p?.cuenta_id === item.cuenta_id);
      if (card.classList.contains("tdpend") !== pending) card.classList.toggle("tdpend", pending);
      const mark = card.querySelector(".tdpendm");
      if (pending && !mark) card.querySelector(".tdu-pie")?.insertAdjacentHTML("afterbegin", `<span class="tdpendm">${t("agenda.yourDay.queued")}</span>`);
      if (!pending && mark) mark.remove();
      card.querySelectorAll('[data-td^="visita|"]').forEach((button) => {
        if (button.classList.contains("hide") !== pending) button.classList.toggle("hide", pending);
      });
    });
  }
  async function paintYourDay() {
    if (hasStrip()) {
      const day = legacyAgenda.selectedDate() ?? todayIso(), current = agendaSuggestions.forDay();
      let suggestions = null;
      await withData([...dayLoads(day), current?.fecha === day ? null : loadSuggestions(day).then((found) => {
        suggestions = found;
      })], async () => {
        if (legacyAgenda.selectedDate() !== day || !hasStrip()) return;
        applySuggestions(day, suggestions);
        await paintDay();
        if (legacyAgenda.isDayView()) {
          paintSameCentre();
          paintTrayButtons();
        }
      });
      if (hasStrip()) yourDayLegacy.markTraffic();
      if (hasStrip()) markQueuedVisits();
    }
    applyTaskFolding();
  }
  function listenToYourDay() {
    applyCompact();
    document.addEventListener("click", (event) => {
      const button = event.target instanceof Element ? event.target.closest("#tdcompactar") : null;
      if (!button) return;
      const value2 = !compact();
      try {
        localStorage.setItem(COMPACT_KEY, value2 ? "1" : "0");
      } catch {
      }
      applyCompact();
      setCompactButton(button, value2);
    });
    document.addEventListener("click", (event) => {
      const button = event.target instanceof Element ? event.target.closest("[data-tdavi]") : null;
      if (!button) return;
      event.stopPropagation();
      const info = yourDayLegacy.stopInfo()[button.dataset.tdavi ?? ""];
      if (!info) return;
      yourDayLegacy.showDialog(t("agenda.yourDay.whyWarning"), yourDayLegacy.explainWarning(info), t("agenda.yourDay.understood"));
    }, true);
  }

  // src/app/components/slide.ts
  var HIGHLIGHT_CLASS = "tdmovida";
  var HIGHLIGHT_MS = 1300;
  var EASING = "cubic-bezier(.2,.7,.2,1)";
  function positionsOf(selector, key) {
    const positions = /* @__PURE__ */ new Map();
    document.querySelectorAll(selector).forEach((element) => {
      positions.set(element.dataset[key] ?? "", element.getBoundingClientRect().top);
    });
    return positions;
  }
  function highlight(element) {
    element.classList.remove(HIGHLIGHT_CLASS);
    void element.offsetWidth;
    element.classList.add(HIGHLIGHT_CLASS);
    setTimeout(() => {
      element.classList.remove(HIGHLIGHT_CLASS);
    }, HIGHLIGHT_MS);
  }
  function slideIntoPlace(before, options) {
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.querySelectorAll(options.selector).forEach((element) => {
      const id = element.dataset[options.key] ?? "";
      if (options.touched && id === String(options.touched)) highlight(element);
      const top = before.get(id);
      if (still || top === void 0) return;
      const shift = top - element.getBoundingClientRect().top;
      if (Math.abs(shift) > 1) element.animate([{ transform: `translateY(${shift}px)` }, { transform: "none" }], { duration: options.durationMs, easing: EASING });
    });
  }

  // src/app/screens/home/indicators/chart-tools.ts
  var EMPTY_CHART = { summary: "", visual: "" };
  var WEEKDAY_LETTERS = ["D", "L", "M", "X", "J", "V", "S"];
  var STATE_COLORS = {
    inicial: "#C9D7E6",
    avance: "#3F82C0",
    interes: "#17457A",
    positivo: "#1E7A4C",
    negativo: "#94A3B8"
  };
  function lineIcon(path, width = 2.4) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
  }
  function minutesOf2(time) {
    const match = /(\d{1,2}):(\d{2})/.exec(String(time ?? ""));
    return match ? Number(match[1]) * 60 + Number(match[2]) : null;
  }
  function countsByDate(rows) {
    return new Map((rows ?? []).map((row2) => [row2.fecha, row2.n]));
  }

  // src/app/screens/home/indicators/charts-activity.ts
  function dotKind2(item, next) {
    if (appointments.isOpen(item.estado)) return item === next ? "sig" : "";
    return commercialStates.color(item.estado) === "var(--warn)" ? "no" : "ok";
  }
  function appointmentsChart(panel, kpis) {
    const list = (panel.agenda_hoy ?? []).filter((item) => !appointments.isCancelled(item.estado));
    const open = list.filter((item) => appointments.isOpen(item.estado));
    const now = /* @__PURE__ */ new Date(), minutesNow = now.getHours() * 60 + now.getMinutes();
    const next = open.find((item) => (minutesOf2(item.hora) ?? 9999) >= minutesNow - 15) ?? open[0];
    const time = (item, empty) => escapeHtml(String(item.hora ?? "").slice(0, 5) || empty);
    const summary = next ? t("home.indicators.nextAppointment", { time: time(next, "—"), name: escapeHtml(next.nombre) }) : t(list.length ? "home.indicators.allClosed" : "home.indicators.noAppointmentsToday");
    const visible = isMobile() ? 3 : 5;
    const nextIndex = next ? list.indexOf(next) : 0;
    const start = Math.max(0, Math.min(nextIndex - (visible >> 1), list.length - visible)), shown = list.slice(start, start + visible);
    const more = Math.max(0, nonZeroOr(kpis.citas_hoy, list.length) - shown.length);
    const dots = shown.map((item) => `<span class="kvdot"><i class="${dotKind2(item, next)}" title="${escapeHtml(item.nombre)}"></i><em>${time(item, "·")}</em></span>`).join("");
    return { summary, visual: list.length ? `<div class="kvdots">${dots}${more > 0 ? `<span class="kvdot"><em class="kvmas">+${more}</em></span>` : ""}</div>` : "" };
  }
  function urgentChart(kpis) {
    if (kpis.urgentes) return { summary: t("home.indicators.urgentPending", { count: formatNumber(kpis.urgentes) }), visual: '<div class="kvradar" aria-hidden="true"><i></i><b></b><b></b></div>' };
    return { summary: t("home.indicators.noneUrgent"), visual: `<div class="kvcalma"><span>${lineIcon('<path d="M20 6 9 17l-5-5"/>')}</span>${t("home.indicators.allUpToDate")}</div>` };
  }
  function weekSummary(week, today) {
    const { upcoming, days, values, perDay } = week;
    if (upcoming) {
      const busiest = values.indexOf(Math.max(...values));
      const day = days[busiest];
      return values[busiest] && day ? t("home.indicators.busiestDay", { weekday: weekdayName(day), count: values[busiest] ?? 0 }) : t("home.indicators.freeWeek");
    }
    const fourWeeks = sum(range(28).map((i) => perDay.get(addDays(mondayOf(today), -28 + i)) ?? 0)) / 20;
    return t("home.indicators.fourWeekAverage", { average: String(fourWeeks.toFixed(1)).replace(".", ",") });
  }
  function weekChart(id, charts, today) {
    const upcoming = id === "citas_7d";
    const days = range(7).map((i) => upcoming ? addDays(today, i) : addDays(mondayOf(today), i));
    const perDay = countsByDate(charts.por_dia), nextDays = countsByDate(charts.proximos);
    const values = days.map((day) => (upcoming ? nextDays.get(day) : perDay.get(day)) ?? 0);
    const max = Math.max(1, ...values), width = 196, barWidth = 18, gap = (width - 7 * barWidth) / 6;
    const bars = values.map((value2, i) => {
      const day = days[i] ?? today, height = Math.max(3, value2 / max * 40), x = i * (barWidth + gap), future = !upcoming && day > today, isToday = day === today;
      const fill2 = future ? "#E3EBF3" : isToday ? "var(--sky)" : "var(--navy)";
      return `<rect x="${x}" y="${44 - height}" width="${barWidth}" height="${height}" rx="4" fill="${fill2}" opacity="${value2 ? 1 : 0.35}"/><text x="${x + barWidth / 2}" y="58" text-anchor="middle" class="${isToday ? "hoy" : ""}">${WEEKDAY_LETTERS[fromIsoDate(day).getDay()] ?? ""}</text>`;
    }).join("");
    return { summary: weekSummary({ upcoming, days, values, perDay }, today), visual: `<svg class="kvbar" viewBox="0 0 ${width} 60" preserveAspectRatio="xMidYMax meet" aria-hidden="true">${bars}</svg>` };
  }
  function monthChart(charts, today) {
    const perDay = countsByDate(charts.por_dia), dayOfMonth = Number(today.slice(8, 10)), monthStart = `${today.slice(0, 8)}01`;
    const previous = fromIsoDate(monthStart);
    previous.setMonth(previous.getMonth() - 1);
    const accumulate = (from) => {
      let total = 0;
      return range(dayOfMonth).map((i) => {
        total += perDay.get(addDays(from, i)) ?? 0;
        return total;
      });
    };
    const current = accumulate(monthStart), last = accumulate(toIsoDate(previous));
    if (dayOfMonth < 2) return EMPTY_CHART;
    const max = Math.max(1, ...last, ...current), width = 196, height = 46;
    const x = (i) => i / (dayOfMonth - 1) * width, y = (value2) => height - value2 / max * height;
    const line = (values) => values.map((value2, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(value2).toFixed(1)}`).join("");
    const end = current[current.length - 1] ?? 0, difference2 = end - (last[last.length - 1] ?? 0);
    return {
      summary: t(difference2 >= 0 ? "home.indicators.aboveLastMonth" : "home.indicators.belowLastMonth", { difference: difference2 }),
      visual: `<svg class="kvlin" viewBox="0 0 ${width} ${height + 12}" preserveAspectRatio="none" aria-hidden="true"><path d="${line(last)}" fill="none" stroke="#C9D7E6" stroke-width="2" stroke-dasharray="4 4"/>
        <path class="l" d="${line(current)}" pathLength="100" fill="none" stroke="var(--navy)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="0" y="${height + 11}">1</text><text x="${width}" y="${height + 11}" text-anchor="end" class="hoy">${t("home.indicators.today")}</text>
        <circle class="fin" cx="${x(dayOfMonth - 1)}" cy="${y(end)}" r="4" fill="var(--sky)" stroke="var(--navy)" stroke-width="1.5"/></svg>`
    };
  }
  function unitsChart(kpis) {
    const now = kpis.uds_mes ?? 0, before = kpis.uds_mes_ant ?? 0, max = Math.max(1, now, before), width = 196;
    return {
      summary: before ? t("home.indicators.unitsVersusLastMonth", { sign: now >= before ? "+" : "", percent: Math.round((now - before) / before * 100) }) : "",
      visual: `<svg class="kvbar" viewBox="0 0 ${width} 44" preserveAspectRatio="none" aria-hidden="true"><rect x="0" y="4" width="${before / max * width}" height="12" rx="4" fill="#DCE6F1"/><rect x="0" y="24" width="${Math.max(3, now / max * width)}" height="12" rx="4" fill="var(--navy)"/></svg>`
    };
  }

  // src/app/screens/home/indicators/charts-portfolio.ts
  function stateCounts(charts) {
    const counts = new Map((charts.estados ?? []).map((row2) => [row2.valor, row2.n]));
    return commercialStates.all().filter((state) => state.papel !== "negativo").map((state) => ({ state, accounts: counts.get(state.valor) ?? 0 }));
  }
  function portfolioTotal(charts) {
    return sum((charts.estados ?? []).map((row2) => row2.n));
  }
  var color = (role) => STATE_COLORS[role] ?? "#C9D7E6";
  function interestedChart(charts) {
    const counts = stateCounts(charts), steps = counts.filter((count2) => count2.state.papel !== "inicial");
    if (!steps.length) return EMPTY_CHART;
    const max = Math.max(1, ...steps.map((count2) => count2.accounts)), width = 196, barWidth = width / steps.length;
    const columns = steps.map((count2, i) => {
      const on2 = count2.state.papel === "interes", height = Math.max(4, count2.accounts / max * 28);
      const name = count2.state.valor.length > 11 ? `${count2.state.valor.slice(0, 10)}.` : count2.state.valor;
      return `<rect x="${i * barWidth + 4}" y="${34 - height}" width="${barWidth - 8}" height="${height}" rx="4" fill="${on2 ? "var(--navy)" : "#DCE6F1"}"/><text x="${i * barWidth + barWidth / 2}" y="${30 - height}" text-anchor="middle" class="n ${on2 ? "on" : ""}">${count2.accounts}</text><text x="${i * barWidth + barWidth / 2}" y="48" text-anchor="middle" class="${on2 ? "on" : ""}">${escapeHtml(name)}</text>`;
    }).join("");
    const positive = counts.find((count2) => count2.state.papel === "positivo");
    const state = positive ? escapeHtml(positive.state.valor) : "";
    const summary = positive ? positive.accounts ? t("home.indicators.alreadyIn", { count: positive.accounts, state }) : t("home.indicators.nextStep", { state }) : "";
    return { summary, visual: `<svg class="kvbar" viewBox="0 0 ${width} 52" preserveAspectRatio="xMidYMax meet" aria-hidden="true">${columns}</svg>` };
  }
  function portfolioChart(charts) {
    const total = portfolioTotal(charts), present = stateCounts(charts).filter((count2) => count2.accounts);
    const circumference = 2 * Math.PI * 22;
    let offset = 0;
    const segments = present.map((count2) => {
      const length = count2.accounts / total * circumference;
      const segment = `<circle class="s" cx="29" cy="29" r="22" fill="none" stroke="${color(count2.state.papel)}" stroke-width="9" stroke-dasharray="${Math.max(0, length - 1.5)} ${circumference}" stroke-dashoffset="${-offset}"/>`;
      offset += length;
      return segment;
    }).join("");
    const legend = present.slice(0, 4).map((count2) => `<span><i style="background:${color(count2.state.papel)}"></i>${count2.accounts} ${escapeHtml(count2.state.valor)}</span>`).join("");
    return { summary: "", visual: `<div class="kvdona"><svg viewBox="0 0 58 58" aria-hidden="true">${segments}</svg><div class="kvley">${legend}</div></div>` };
  }
  function notContactedChart(charts, kpis) {
    const total = portfolioTotal(charts), notContacted = kpis.sin_contactar ?? 0;
    const squares = Math.min(total, isMobile() ? 64 : 96), filled = Math.round(notContacted / total * squares);
    const grid = range(squares).map((i) => `<i class="${i >= squares - filled ? "f" : ""}"></i>`).join("");
    return { summary: t("home.indicators.shareOfPortfolio", { percent: Math.round(notContacted / total * 100) }), visual: `<div class="kvwaf" aria-hidden="true">${grid}</div>` };
  }
  function noRecentVisitChart(kpis) {
    const percent = Math.round((kpis.sin_visita_60 ?? 0) / Math.max(1, kpis.medicos ?? 0) * 100);
    return {
      summary: t("home.indicators.shareOfPortfolio", { percent }),
      visual: `<div class="kvpropw"><div class="kvprop"><i style="width:${percent}%"></i></div><div class="kvpropt"><span><i class="kvq a"></i>${t("home.indicators.noVisitIn60Days", { visit: term("visita") })}</span><span><i class="kvq b"></i>${t("home.indicators.theRest")}</span></div></div>`
    };
  }

  // src/app/screens/home/indicators/cards.ts
  var withPortfolio = (draw) => ({ charts, kpis }) => charts && portfolioTotal(charts) ? draw(charts, kpis) : null;
  var weekBuilder = ({ id, charts, today }) => charts ? weekChart(id, charts, today) : null;
  var CHARTS = /* @__PURE__ */ new Map([
    ["citas", ({ panel, kpis }) => panel ? appointmentsChart(panel, kpis) : null],
    ["urgentes", ({ kpis }) => urgentChart(kpis)],
    ["visitas_sem", weekBuilder],
    ["citas_7d", weekBuilder],
    ["visitas_mes", ({ charts, today }) => charts ? monthChart(charts, today) : null],
    ["interesados", withPortfolio((charts) => interestedChart(charts))],
    ["cartera", withPortfolio((charts) => portfolioChart(charts))],
    ["sin_contactar", withPortfolio(notContactedChart)],
    ["sin_visita_60", ({ kpis }) => kpis.medicos ? noRecentVisitChart(kpis) : null],
    ["uds_mes", ({ kpis }) => kpis.uds_mes_ant !== void 0 && (kpis.uds_mes || kpis.uds_mes_ant) ? unitsChart(kpis) : null]
  ]);
  function chartFor(id, kpis, panel, charts) {
    return CHARTS.get(id)?.({ id, kpis, panel, charts, today: todayIso() }) ?? EMPTY_CHART;
  }
  function helpButton(help, title) {
    return help ? `<button class="ai" data-ayuda-txt="${escapeHtml(help)}" data-ayuda-tit="${escapeHtml(title)}" aria-label="${t("home.indicators.whatIsIt")}">i</button>` : "";
  }
  function figure(raw) {
    const text = String(raw), fraction = /^(\d+)\/(\d+)$/.exec(text);
    if (fraction) return `<b data-kvn="${fraction[1] ?? ""}">0</b><span class="kvu">/${fraction[2] ?? ""}</span>`;
    return /^\d+$/.test(text) ? `<b data-kvn="${text}">0</b>` : `<b>${escapeHtml(text)}</b>`;
  }
  function indicatorCard(definition, setting, context) {
    const title = setting.t ? setting.t : definition.t;
    const classes = `kpi ${definition.cls ? definition.cls(context.kpis) : ""} ${definition.h ? "click" : ""}${context.panel ? " kv" : ""}`;
    const action = definition.h ? ` data-k="${definition.h}"` : "";
    const icon2 = indicatorCatalog.icon(definition.id), description = indicatorCatalog.description(definition.id);
    const help = helpButton(indicatorCatalog.help(definition.id), title);
    const raw = definition.v(context.kpis);
    const body2 = context.panel ? liveBody(definition.id, capitalise(title).trim(), raw, context) : `
       ${help}
       <b>${typeof raw === "string" ? raw : formatNumber(raw)}</b><span>${escapeHtml(capitalise(title))}</span>`;
    return `<div class="${classes}"${action} data-kid="${definition.id}" data-comp="1">${icon2 ? `<span class="kico" aria-hidden="true">${icon2}</span>` : ""}${context.panel ? help : ""}${body2}${description ? `<em class="kdesc">${escapeHtml(description)}</em>` : ""}</div>`;
  }
  function liveBody(id, title, raw, context) {
    const { summary, visual } = chartFor(id, context.kpis, context.panel, context.charts);
    return `<div class="kvt">${escapeHtml(title)}</div>
      <div class="kvn">${figure(raw)}</div>
      <div class="kvs">${summary}</div>${visual ? `<div class="kvz">${visual}</div>` : ""}`;
  }
  function filterCard(setting, index, live) {
    const filter = setting.filtro ?? {};
    const name = setting.t ? setting.t : indicatorCatalog.filterText(filter);
    const help = `<button class="ai" data-ayuda-txt="${escapeHtml(t("home.indicators.filterHelp", { help: indicatorCatalog.help("filtro") ?? "", filter: indicatorCatalog.filterText(filter) }))}" data-ayuda-tit="${escapeHtml(setting.t ? setting.t : t("home.indicators.savedFilter"))}" aria-label="${t("home.indicators.whatIsIt")}">i</button>`;
    const count2 = '<b class="cont"><span class="spin" style="width:18px;height:18px;border-width:2px;display:inline-block"></span></b>';
    return live ? `<div class="kpi click kv" data-kf="${escapeHtml(JSON.stringify(filter))}" data-kfi="${index}">
        ${help}
        <span class="kvt">${escapeHtml(name)}</span><div class="kvn">${count2}</div></div>` : `<div class="kpi click" data-kf="${escapeHtml(JSON.stringify(filter))}" data-kfi="${index}">
        ${help}
        ${count2}<span>${escapeHtml(name)}</span></div>`;
  }

  // src/app/screens/home/indicators/index.ts
  var COUNT_DURATION_MS = 900;
  function countUp(container) {
    const figures = [...container.querySelectorAll("[data-kvn]")];
    const finalValue = (el) => Number(el.dataset.kvn);
    const showFinal = () => {
      figures.forEach((el) => {
        el.textContent = formatNumber(finalValue(el));
      });
    };
    if (alreadyCounted("kv", figures.map((el) => el.dataset.kvn ?? "")) || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      showFinal();
      return;
    }
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min(1, (now - start) / COUNT_DURATION_MS), eased = 1 - Math.pow(1 - progress, 3);
      figures.forEach((el) => {
        if (el.isConnected) el.textContent = formatNumber(Math.round(finalValue(el) * eased));
      });
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  function render3(container, settings, kpis) {
    const definitions = indicatorCatalog.definitions();
    const allowed = settings.map((setting) => ({ setting, definition: definitions.find((item) => item.id === setting.id) }));
    const panel = homeCache.panel();
    const live = Boolean(panel) && allowed.some(({ setting, definition }) => !setting.filtro && indicatorCatalog.allowed(definition));
    const context = { kpis, panel: live ? panel : null, charts: homeCache.charts() };
    container.innerHTML = allowed.map(({ setting, definition }, index) => {
      if (setting.filtro) return filterCard(setting, index, live);
      if (!definition || !indicatorCatalog.allowed(definition)) return "";
      return indicatorCard(definition, setting, context);
    }).join("");
    if (live) container.classList.add("kvivo");
    return live;
  }
  function countSavedFilters(settings) {
    settings.forEach((setting, index) => {
      if (!setting.filtro) return;
      indicatorCatalog.countFilter(setting.filtro).then((count2) => {
        const figure2 = document.querySelector(`#kpis [data-kfi="${index}"] .cont`);
        if (figure2) figure2.textContent = formatNumber(count2);
      }).catch(() => void 0);
    });
  }
  function paintIndicators(result) {
    const container = document.getElementById("kpis");
    if (!container) return;
    if (!result.data) {
      container.innerHTML = `<div class="vacio">${t("home.indicators.offline")}</div>`;
      return;
    }
    const settings = indicatorCatalog.settings().filter((setting) => setting.on);
    const live = render3(container, settings, result.data.kpis ?? {});
    if (result.cache) showCacheNotice(container, result.fecha);
    countSavedFilters(settings);
    addHelpButtons();
    if (live) countUp(container);
  }
  async function loadIndicators() {
    const result = await cachedRpc("panel_inicio", { lim: 6 }, "inicio");
    timingMark("datos de Inicio recibidos");
    if (currentScreen() !== "inicio") return;
    paintIndicators(result);
    if (result.data) timingMark("Inicio completo");
  }

  // src/app/screens/home/service.ts
  function valueOf(request) {
    if (!request) return Promise.resolve(null);
    return Promise.resolve(request).then((result) => result.data, () => null);
  }
  function requests(today) {
    const seesOperations = permissions.seesEverything() && permissions.salesLevel() >= 1;
    return [
      valueOf(legacyDb().rpc("inicio_areas")),
      valueOf(seesOperations ? callRpc("operativa_pendiente") : null),
      valueOf(permissions.canSeeArea("productos") ? callRpc("alertas_stock") : null),
      valueOf(permissions.canSeeArea("ciclo") ? callRpc("ciclo_cuentas", { p_usuario: null }) : null),
      valueOf(permissions.seesEverything() && permissions.hasOpportunities() ? callRpc("llamadas_seguimiento") : null),
      appointments.ofDay(today).catch(() => []),
      valueOf(legacyDb().from("tareas").select("id,titulo,hora,hecha").eq("fecha", today))
    ];
  }
  async function loadHomeData() {
    const today = todayIso();
    const [areas, pendingOps, stock, cycle2, calls, dayAppointments, tasks] = await Promise.all(requests(today));
    if (!homeCache.panel()) homeCache.setPanel(await valueOf(legacyDb().rpc("panel_inicio")));
    return {
      today,
      areas: areas ?? {},
      pendingOps,
      stock: stock ?? [],
      cycle: cycle2,
      calls,
      appointments: dayAppointments,
      tasks: tasks ?? [],
      kpis: homeCache.panel()?.kpis ?? {},
      visitsPerDay: homeCache.charts()?.por_dia ?? []
    };
  }

  // src/app/screens/home/attention.ts
  function collectionItems(data, add) {
    const collections = data.areas.cobros;
    if (!collections || !permissions.canSeeArea("facturacion")) return;
    add({
      count: collections.n_vencidas,
      priority: "alta",
      icon: "receipt",
      title: t("home.attention.overdueInvoices"),
      detail: t("home.attention.overdueInvoicesDetail", { amount: formatEuros(collections.vencido) }),
      open: () => {
        goTo("facturacion");
      }
    });
  }
  function urgentItems(data, add, pending) {
    add({
      count: pending("pago"),
      priority: "alta",
      icon: "credit-card",
      title: t("home.attention.pendingPayment"),
      detail: t("home.attention.pendingPaymentDetail"),
      open: () => {
        goToOrders("ventas");
      }
    });
    add({
      count: data.kpis.urgentes,
      priority: "alta",
      icon: "zap",
      title: t("home.attention.urgentUnvisited", { professionals: term("medico", { number: "p", capital: "C", adjective: "urgente" }) }),
      detail: t("home.attention.urgentUnvisitedDetail"),
      open: () => {
        goTo("directorio");
      }
    });
    if (permissions.canSeeArea("cirugias")) {
      add({
        count: data.areas.cirugias_reponer,
        priority: "alta",
        icon: "scissors",
        title: t("home.attention.surgeryRestock"),
        detail: t("home.attention.surgeryRestockDetail"),
        open: () => {
          goTo("cirugias");
        }
      });
    }
  }
  function callBackItem(data, add) {
    if (!data.calls) return;
    const due = data.calls.filter((call) => call.proxima_fecha && call.proxima_fecha <= data.today);
    const late = due.some((call) => (call.proxima_fecha ?? "") < data.today);
    add({
      count: due.length,
      priority: "media",
      icon: "phone",
      title: t("home.attention.callBackToday"),
      detail: t(late ? "home.attention.callBackLate" : "home.attention.callBackOnTime"),
      open: () => {
        goToOrders("llamadas");
      }
    });
  }
  function operationItems(data, add, pending) {
    add({
      count: pending("paquete"),
      priority: "media",
      icon: "package",
      title: t("home.attention.packagesToPrepare"),
      detail: t("home.attention.packagesToPrepareDetail"),
      open: () => {
        goToOrders("ventas");
      }
    });
    data.stock.forEach((alert) => {
      add({
        count: alert.n,
        priority: alert.gravedad === "alta" ? "alta" : "media",
        icon: "package",
        title: alert.titulo,
        detail: (alert.items ?? []).slice(0, 2).map((item) => item.nombre).join(" · "),
        open: () => {
          goTo("productos");
        }
      });
    });
    callBackItem(data, add);
  }
  function otherItems(data, add, pending) {
    if (permissions.canSeeArea("concursos")) {
      add({
        count: data.areas.concursos_vencen,
        priority: "media",
        icon: "gavel",
        title: t("home.attention.contractsExpiring"),
        detail: t("home.attention.contractsExpiringDetail"),
        open: () => {
          goTo("concursos");
        }
      });
    }
    add({
      count: pending("email_factura") + pending("email_pago"),
      priority: "media",
      icon: "mail",
      title: t("home.attention.emailsToSend"),
      detail: t("home.attention.emailsToSendDetail"),
      open: () => {
        goToOrders("ventas");
      }
    });
    if (permissions.canReviewDuplicates()) {
      add({
        count: data.kpis.pendientes_unificar,
        priority: "media",
        icon: "copy",
        title: t("home.attention.duplicates"),
        detail: t("home.attention.duplicatesDetail"),
        open: () => {
          goTo("duplicados");
        }
      });
    }
  }
  function byUrgency(first, second) {
    if (first.priority === second.priority) return second.count - first.count;
    return first.priority === "alta" ? -1 : 1;
  }
  function attentionItems(data) {
    const items = [];
    const add = (candidate) => {
      if (candidate.count) items.push({ ...candidate, count: candidate.count });
    };
    const pending = (key) => (data.pendingOps?.[key] ?? []).length;
    collectionItems(data, add);
    urgentItems(data, add, pending);
    operationItems(data, add, pending);
    otherItems(data, add, pending);
    return items.sort(byUrgency);
  }

  // src/app/screens/home/tiles.ts
  var plural = (count2, one, other) => count2 === 1 ? one : other;
  function attentionTile(items) {
    const total = items.reduce((sum2, item) => sum2 + item.count, 0);
    const rows = items.slice(0, 7).map((item, index) => `<button type="button" class="mti ${item.priority}" data-mat="${index}"><span class="mic">${icon(item.icon)}</span>
      <span class="mtx"><b>${escapeHtml(item.title)}</b><span>${escapeHtml(item.detail)}</span></span><span class="mn" data-mcnt="${item.count}">${item.count}</span><span class="mfl" aria-hidden="true">›</span></button>`).join("");
    const allClear = `<div class="mtok">${icon("check")}<span><b>${t("home.attention.allClearTitle")}</b>${t("home.attention.allClearText")}</span></div>`;
    return `<div class="mt mtat ${items.length <= 2 ? "pocas" : ""}"><div class="mtt">${icon("bell")} ${t("home.attention.title")}${total ? `<span class="mtatn" data-mcnt="${total}">${total}</span>` : ""}</div>
    <div class="mtl">${rows || allClear}</div></div>`;
  }
  function salesChart(data) {
    const perDay = new Map(data.visitsPerDay.map((day) => [day.fecha, day.n]));
    const days = [...Array(14).keys()].map((i) => addDays(data.today, i - 13));
    const max = Math.max(1, ...days.map((day) => perDay.get(day) ?? 0));
    const visits = term("visita", { number: "p", capital: "C" });
    return `<div class="mbars" role="img" aria-label="${t("home.sales.chartLabel", { visits })}">${days.map((day) => `<i class="${day === data.today ? "h" : ""}" style="height:${Math.max(4, 100 * (perDay.get(day) ?? 0) / max)}%"></i>`).join("")}</div>
      <div class="mleg">${t("home.sales.chartLegend", { visits })}</div>`;
  }
  function salesFigures(sales) {
    const inEuros = permissions.canSeeAmounts() && sales.importe !== null && sales.importe !== void 0;
    const current = (inEuros ? sales.importe : sales.unidades) ?? 0;
    const previous = inEuros ? sales.importe_ant : sales.unidades_ant;
    return { inEuros, current, change: previous ? Math.round(100 * (current - previous) / previous) : null };
  }
  function salesVersus(change) {
    if (change === null) return "";
    const up = change >= 0;
    return `<span class="${up ? "mup" : "mdown"}">${up ? "▲" : "▼"} ${t("home.sales.percent", { percent: Math.abs(change) })}</span>${t("home.sales.versusLastMonth")}`;
  }
  function salesTile(data) {
    if (!permissions.canSeeArea("ventas")) return "";
    const sales = data.areas.ventas ?? {};
    const { inEuros, current, change } = salesFigures(sales);
    const figure2 = inEuros ? `data-meur="${current}"` : `data-mcnt="${current}"`;
    const units2 = inEuros ? ` · <b>${formatNumber(sales.unidades ?? 0)}</b> ${t("home.sales.units")}` : "";
    return `<div class="mt mtven"><div class="mtt">${icon("chart-column")} ${t("home.sales.title")}</div>
      <div class="mn1" ${figure2}>${inEuros ? formatEuros(current) : `${formatNumber(current)}<small>${t("home.sales.units")}</small>`}</div>
      <div class="ms">${salesVersus(change)}<b>${formatNumber(sales.pedidos ?? 0)}</b> ${t("home.sales.orders")}${units2}</div>
      ${salesChart(data)}</div>`;
  }
  function todayTile(data) {
    const open = data.appointments.filter((item) => appointments.isOpen(item.estado));
    const done = data.appointments.filter((item) => !appointments.isOpen(item.estado) && !appointments.isCancelled(item.estado)).length;
    const alive = data.appointments.filter((item) => !appointments.isCancelled(item.estado)).length;
    const pendingTasks = data.tasks.filter((task) => !task.hecha).length;
    const list = open.slice(0, 4).map((item) => `<div><b>${escapeHtml(String(item.hora ?? "").slice(0, 5) || "—")}</b><span>${escapeHtml(item.medico ?? item.nombre ?? "")}</span></div>`).join("");
    return `<div class="mt mthoy"><div class="mtt">${icon("calendar-days")} ${t("home.today.title")}</div>
    <div class="mn1"><span data-mcnt="${alive}">${alive}</span><small>${plural(alive, t("home.today.appointmentOne"), t("home.today.appointmentOther"))}</small></div>
    <div class="ms"><b>${done}</b> ${t("home.today.done")} · <b>${pendingTasks}</b> ${plural(pendingTasks, t("home.today.taskOne"), t("home.today.taskOther"))}</div>
    <div class="mprog"><i style="width:${alive ? Math.max(3, 100 * done / alive) : 0}%"></i></div>
    <div class="mcitas">${list || `<button type="button" class="lnk" data-mplan>${alive ? t("home.today.dayComplete") : t("home.today.planYourDay")}</button>`}</div></div>`;
  }
  function collectionsTile(data) {
    const collections = data.areas.cobros;
    if (!collections || !permissions.canSeeAmounts() || !permissions.canSeeArea("facturacion")) return "";
    return `<div class="mt mtcob"><div class="mtt">${icon("euro")} ${t("home.collections.title")}</div>
    <div class="mn1" data-meur="${collections.pendiente}">${formatEuros(collections.pendiente)}</div><div class="ms">${t("home.collections.pendingIn")} <b>${formatNumber(collections.n)}</b> ${plural(collections.n, t("home.collections.invoiceOne"), t("home.collections.invoiceOther"))}</div>
    <div class="mmini"><div><span>${t("home.collections.overdue")}</span><b class="${collections.vencido > 0 ? "mdown" : ""}">${formatEuros(collections.vencido)}</b></div><div><span>${t("home.collections.invoicedThisMonth")}</span><b>${formatEuros(collections.facturado_mes)}</b></div></div></div>`;
  }
  function cycleTile(data) {
    const summary = data.cycle?.resumen ?? [];
    if (!summary.length) return "";
    const done = summary.reduce((sum2, row2) => sum2 + row2.hechas, 0), target = summary.reduce((sum2, row2) => sum2 + row2.objetivo, 0);
    const percent = target ? Math.round(100 * done / target) : 0, circumference = 2 * Math.PI * 30;
    return `<div class="mt mtcic"><div class="mtt">${icon("target")} ${t("home.cycle.title", { visits: term("visita", { number: "p" }) })}</div>
      <div class="mfila"><svg class="mring" viewBox="0 0 70 70" aria-hidden="true"><circle class="f" cx="35" cy="35" r="30"/><circle class="v" cx="35" cy="35" r="30" style="stroke-dasharray:${circumference * percent / 100} ${circumference}"/></svg>
      <div><div class="mn1" style="margin:0"><span data-mcnt="${percent}">${percent}</span> %</div><div class="ms"><b>${done}</b>${t("home.cycle.progress", { target, days: data.cycle?.quedan_dias ?? 0 })}</div></div></div></div>`;
  }
  function stockTile(data) {
    if (!permissions.canSeeArea("productos")) return "";
    const total = data.stock.reduce((sum2, alert) => sum2 + alert.n, 0);
    const rows = data.stock.slice(0, 3).map((alert) => `<div><span>${escapeHtml(alert.titulo)}</span><b>${alert.n}</b></div>`).join("");
    return `<div class="mt mtsto"><div class="mtt">${icon("package")} ${t("home.stock.title")}</div><div class="mn1"><span data-mcnt="${total}">${total}</span><small>${plural(total, t("home.stock.alertOne"), t("home.stock.alertOther"))}</small></div>
      <div class="mmini">${rows || `<div><span>${t("home.stock.allGood")}</span></div>`}</div></div>`;
  }
  function portfolioTile(data) {
    if (!permissions.canSeeArea("directorio")) return "";
    const kpi = (key) => data.kpis[key] ?? 0;
    const sold = permissions.canSeeArea("ventas") ? `<div><span>${t("home.portfolio.soldThisMonth")}</span><b>${formatNumber(kpi("prescriptores_mes"))}</b></div>` : "";
    return `<div class="mt mtcar"><div class="mtt">${icon("users")} ${t("home.portfolio.title")}</div>
    <div class="mn1"><span data-mcnt="${kpi("cuentas")}">${formatNumber(kpi("cuentas"))}</span><small>${term("medico", { number: "p" })}</small></div>
    <div class="mmini">${sold}<div><span>${t("home.portfolio.notContacted")}</span><b>${formatNumber(kpi("sin_contactar"))}</b></div><div><span>${t("home.portfolio.noVisitIn60Days", { visit: term("visita") })}</span><b>${formatNumber(kpi("sin_visita_60"))}</b></div></div></div>`;
  }
  var AREA_OF_UPCOMING = { evento: "eventos", concurso: "concursos", cirugia: "cirugias", equipo: "parque" };
  function upcomingTile(data) {
    const items = (data.areas.proximos ?? []).filter((item) => {
      const area = AREA_OF_UPCOMING[item.tipo];
      return area === void 0 || permissions.canSeeArea(area);
    });
    if (!items.length) return "";
    const months = t("dates.monthsShort").split(","), weekdays = t("dates.weekdaysShort").split(",");
    const rows = items.slice(0, 6).map((item) => {
      const date = fromIsoDate(item.fecha);
      return `<div class="me"><span class="md">${date.getDate()} ${months[date.getMonth()] ?? ""}<small>${weekdays[date.getDay()] ?? ""}</small></span><span class="mp ${item.tipo}"></span><span class="mtx"><b>${escapeHtml(item.titulo)}</b><span>${escapeHtml(item.sub ?? "")}</span></span></div>`;
    }).join("");
    return `<div class="mt mtprox"><div class="mtt">${icon("clock")} ${t("home.upcoming.title")}</div><div class="mtl2">${rows}</div></div>`;
  }

  // src/app/screens/home/view.ts
  var SKELETON_WIDTHS = [64, 82, 56, 74, 60];
  var COUNT_DURATION_MS2 = 900;
  function screen() {
    return document.getElementById("v-inicio");
  }
  function mosaicBox(section) {
    const existing = document.getElementById("inimos");
    if (existing) return existing;
    const greeting = section.querySelector(":scope > .saludo");
    if (!greeting) return null;
    greeting.insertAdjacentHTML("afterend", `<div id="inimos" class="inimos"></div><div class="inikpisb"><button type="button" class="btn sec" id="inikpisver">${t("home.showIndicators")}</button></div>`);
    const toggle = document.getElementById("inikpisver");
    if (toggle) {
      toggle.onclick = () => {
        const shown = !section.classList.contains("conkpis");
        section.classList.toggle("conkpis", shown);
        toggle.textContent = t(shown ? "home.hideIndicators" : "home.showIndicators");
      };
    }
    return document.getElementById("inimos");
  }
  function skeletonTile(className, lines) {
    const rows = [...Array(lines).keys()].map((i) => `<i class="plsk" style="width:${SKELETON_WIDTHS[i % SKELETON_WIDTHS.length] ?? 60}%"></i>`).join("");
    return `<div class="mt ${className} mtsk"><i class="plsk" style="width:38%"></i>${rows}</div>`;
  }
  function renderSkeleton() {
    if (permissions.isProfessionalPortal()) return;
    const section = screen();
    if (!section?.querySelector(":scope > .saludo")) return;
    section.classList.add("conmos");
    const box = mosaicBox(section);
    if (!box || box.children.length) return;
    box.innerHTML = skeletonTile("mtat", 6) + skeletonTile("mthoy", 4) + skeletonTile("", 2) + skeletonTile("", 2) + skeletonTile("mtprox", 3);
  }
  function countUp2(box) {
    const figures = [...box.querySelectorAll("[data-mcnt], [data-meur]")];
    if (alreadyCounted("mos", figures.map((el) => el.dataset.mcnt ?? el.dataset.meur ?? ""))) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min(1, (now - start) / COUNT_DURATION_MS2), eased = 1 - Math.pow(1 - progress, 3);
      figures.forEach((el) => {
        const euros = el.dataset.meur;
        el.textContent = euros === void 0 ? formatNumber(Math.round(Number(el.dataset.mcnt) * eased)) : formatEuros(Number(euros) * eased);
      });
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  function renderMosaic(data) {
    const section = screen();
    if (!section) return;
    const items = attentionItems(data);
    const html = [
      attentionTile(items),
      salesTile(data),
      todayTile(data),
      collectionsTile(data),
      cycleTile(data),
      stockTile(data),
      portfolioTile(data),
      upcomingTile(data)
    ].join("");
    const box = mosaicBox(section);
    if (!box) return;
    box.innerHTML = html;
    box.querySelectorAll("[data-mat]").forEach((button) => {
      button.onclick = () => {
        items[Number(button.dataset.mat)]?.open();
      };
    });
    const plan = box.querySelector("[data-mplan]");
    if (plan) plan.onclick = () => {
      goTo("agenda");
    };
    section.classList.add("conmos");
    countUp2(box);
  }

  // src/app/screens/home/index.ts
  var loading = null;
  var reloadAfter = false;
  var mosaicTurn = 0;
  var isHome = () => currentScreen() === "inicio";
  async function paintMosaic() {
    if (!isHome() || permissions.isProfessionalPortal()) return;
    const turn = ++mosaicTurn;
    const data = await loadHomeData();
    if (turn !== mosaicTurn || !isHome()) return;
    renderMosaic(data);
  }
  async function paintIndicators2() {
    if (permissions.isProfessionalPortal()) {
      await legacyHome.professionalPortal();
      return;
    }
    document.getElementById("v-inicio")?.classList.remove("ini-cargando");
    legacyHome.removeOldBlocks();
    await loadIndicators();
  }
  function loadIndicatorsOnce() {
    if (!isHome()) return Promise.resolve();
    if (loading) {
      reloadAfter = true;
      return loading;
    }
    reloadAfter = false;
    loading = paintIndicators2().catch((error) => {
      console.error(error);
    }).finally(() => {
      loading = null;
      if (reloadAfter && isHome()) void load();
    });
    return loading;
  }
  function load() {
    if (isHome()) {
      renderSkeleton();
      legacyHome.header();
    }
    const done = loadIndicatorsOnce();
    void done.then(() => paintMosaic()).catch(() => void 0);
    return done;
  }
  var homeRoute = { id: "inicio", enter: () => load() };

  // src/app/screens/agenda/your-day/reorder.ts
  var CARDS = "#agcuerpo .tdu[data-tdu]";
  var TASKS = "#tdtareas .tdtarea";
  var REPAINT_SLIDE_MS = 320;
  var MOVE_SLIDE_MS = 260;
  var QUIET_DELAY_MS = 40;
  async function saveOrder(list) {
    const { data: result, error } = await legacyDb().rpc("ordenar_citas", { p_ids: list.map((item) => item.id) });
    if (error || result?.ok === false) {
      notices.toast(t("agenda.yourDay.couldNotSaveOrder"), true);
      return false;
    }
    return true;
  }
  async function repaintSmoothly(id, data) {
    const before = positionsOf(CARDS, "tdu"), day = legacyAgenda.selectedDate();
    agendaCache.forget();
    if (data && day) agendaCache.preset(day, data);
    const body2 = document.getElementById("agcuerpo"), scroll = window.scrollY;
    if (body2) body2.style.minHeight = `${body2.offsetHeight}px`;
    try {
      await paintYourDay();
    } finally {
      const fresh = document.getElementById("agcuerpo");
      if (fresh) fresh.style.minHeight = "";
    }
    window.scrollTo({ top: scroll });
    slideIntoPlace(before, { selector: CARDS, key: "tdu", touched: id, durationMs: REPAINT_SLIDE_MS });
  }
  var quietTimer = null;
  var quietId = null;
  function refreshQuietly(id, figures = true) {
    if (currentScreen() !== "agenda" || !appointmentLegacy.isJoinedDayView() || !document.getElementById("agcuerpo")) {
      void loadAgenda();
      void load();
      routeBar.paint();
      return;
    }
    agendaCache.markDialogSeen();
    if (id) quietId = id;
    if (quietTimer) clearTimeout(quietTimer);
    quietTimer = setTimeout(() => {
      const touched = quietId;
      quietId = null;
      void repaintSmoothly(touched).then(() => {
        if (figures) refreshAfterChange();
        routeBar.paint();
      });
    }, QUIET_DELAY_MS);
  }
  function focusMoved(id, action) {
    const button = document.querySelector(`#agcuerpo .tdu [data-td="${action}|${id}"]:not([disabled])`) ?? document.querySelector(`#agcuerpo .tdu [data-td$="|${id}"]`);
    button?.focus({ preventScroll: true });
  }
  async function moveAppointment(order, id, action) {
    const day = legacyAgenda.selectedDate() ?? "", known = agendaCache.dayData(day);
    if (!agendaCache.lastPainted(day) && known) agendaCache.setLastPainted(day, known);
    const before = positionsOf(CARDS, "tdu"), last = agendaCache.lastPainted(day);
    if (!last) {
      if (await saveOrder(order)) await loadAgenda();
      return;
    }
    const ids = new Set(order.map((item) => item.id));
    agendaCache.preset(day, [...order, ...last.filter((item) => !ids.has(item.id))]);
    const scroll = window.scrollY;
    await paintYourDay();
    window.scrollTo({ top: scroll });
    slideIntoPlace(before, { selector: CARDS, key: "tdu", touched: id, durationMs: MOVE_SLIDE_MS });
    focusMoved(id, action);
    if (!await saveOrder(order)) await loadAgenda();
  }
  function swappedTasks(list, id, direction) {
    const from = list.findIndex((task) => task.id === id), to = from + direction;
    const order = list.slice(), moved = order[from], other = order[to];
    if (from < 0 || !moved || !other) return null;
    order[from] = other;
    order[to] = moved;
    order.forEach((task, index) => {
      task.orden = index + 1;
    });
    return order;
  }
  async function moveTask(id, direction) {
    const day = legacyAgenda.selectedDate() ?? "", list = agendaCache.dayTasks(day);
    const order = list ? swappedTasks(list, id, direction) : null;
    if (!order) return;
    agendaCache.setDayTasks(day, order);
    const before = positionsOf(TASKS, "tarea");
    await repaintSmoothly(null, agendaCache.lastPainted(day) ?? void 0);
    slideIntoPlace(before, { selector: TASKS, key: "tarea", touched: id, durationMs: REPAINT_SLIDE_MS });
    const button = document.querySelector(`#tdtareas [data-tamov="${direction}|${id}"]:not([disabled])`) ?? document.querySelector(`#tdtareas [data-tamov$="|${id}"]:not([disabled])`);
    button?.focus({ preventScroll: true });
    const { data: result, error } = await legacyDb().rpc("ordenar_tareas", { p_ids: order.map((task) => task.id) });
    if (error || result?.ok === false) {
      notices.toast(t("agenda.yourDay.couldNotSaveOrder"), true);
      agendaCache.setDayTasks(day, null);
      refreshQuietly(null, false);
    }
  }
  async function orderByDistance() {
    const { list, left } = yourDayLegacy.orderByDistance(legacyAgenda.dayAppointments());
    if (!await saveOrder(list)) return;
    notices.toast(left ? t("agenda.yourDay.orderedWithLeft", { count: left }) : t("agenda.yourDay.ordered"));
    await repaintSmoothly();
  }

  // src/app/screens/agenda/appointment-actions.ts
  var refresh = (item) => {
    refreshQuietly(item.id);
  };
  async function setState(action, item) {
    const state = action === "confirmar" ? STATES.confirmed : action === "desconfirmar" ? STATES.planned : STATES.discarded;
    const result = await appointmentLegacy.write("estado_cita", { p_id: item.id, p_estado: state });
    if (result?.error) {
      notices.toast(t("agenda.actions.couldNotChange"), true);
      return;
    }
    notices.toast(t(state === STATES.confirmed ? "agenda.actions.confirmed" : state === STATES.discarded ? "agenda.actions.discarded" : "agenda.actions.unconfirmed"));
    refresh(item);
  }
  async function remove(item) {
    if (!await notices.confirm(t("agenda.actions.deleteQuestion"), { titulo: t("agenda.actions.deleteTitle"), ok: t("agenda.actions.delete"), peligro: true })) return;
    const { data: result } = await legacyDb().rpc("borrar_cita", { p_id: item.id });
    if (result?.ok === false) {
      notices.toast(t(result.error === "pasada" ? "agenda.actions.onlyFuture" : "agenda.actions.couldNotDelete"), true);
      return;
    }
    notices.toast(t("agenda.actions.deleted"));
    refresh(item);
  }
  function postponedText(result, day) {
    if (result?.ya) return t("agenda.actions.alreadyThatDay");
    if (result?.mismo_dia) return t("agenda.actions.sameDay");
    return t(result?.reabierta ? "agenda.actions.backToOwn" : "agenda.actions.postponedTo", { date: formatShortDate(day) });
  }
  async function postpone(item) {
    const day = await notices.askDate(t("agenda.actions.whichDay"), appointmentLegacy.nextAttendanceDay(item.dias, item.fecha), { titulo: t("agenda.actions.postponeTitle"), ok: t("agenda.actions.postpone") });
    if (!day) return;
    const { data: result, error } = await legacyDb().rpc("aplazar_cita", { p_id: item.id, p_fecha: day, p_hora: null, p_origen: STATES.postponed });
    if (error || result?.ok === false) {
      notices.toast(t("agenda.actions.couldNotPostpone"), true);
      return;
    }
    notices.toast(postponedText(result, day));
    refresh(item);
  }
  async function absent(item) {
    const negatives = appointmentLegacy.negativeResults();
    const [first] = negatives;
    if (!first) {
      notices.toast(t("agenda.actions.missingNegative"), true);
      return;
    }
    let result = first.valor;
    if (negatives.length > 1) {
      const choice = await notices.choose(t("agenda.actions.whatHappened"), item.nombre ?? "", [{ k: "no", t: t("agenda.actions.cancel"), cls: "sec" }, ...negatives.map((negative, index) => ({ k: `n${index}`, t: negative.valor, cls: "sec" }))]);
      if (!choice) return;
      result = negatives[Number(choice.slice(1))]?.valor ?? result;
    }
    const { error } = await appointmentLegacy.writeRpc("registrar_actividad", { p: { cuenta_id: item.cuenta_id, fecha: item.fecha, resultados: [result], op_id: `v-${item.cuenta_id}-${Date.now()}` } });
    if (error) {
      notices.toast(t("agenda.actions.couldNotSave", { error: error.message ?? "" }), true);
      return;
    }
    notices.toast(t("agenda.actions.noted", { result }));
    refresh(item);
    await appointmentLegacy.newDateAfterAbsent(item);
  }
  async function planAgain(item) {
    const { data: result, error } = await legacyDb().rpc("reabrir_cita", { p_id: item.id });
    if (error || !result || result.ok === false) {
      notices.toast(t(result?.error === "pasada" ? "agenda.actions.reopenOnlyFuture" : "agenda.actions.couldNotReopen"), true);
      return;
    }
    notices.toast(result.quitada ? t("agenda.actions.reopenedRemoving", { date: formatShortDate(result.quitada) }) : t("agenda.actions.reopened"));
    refresh(item);
  }
  var ACTIONS = {
    ficha: (item) => {
      appointmentLegacy.openAccountFromCentre(item.cuenta_id, item.centro_nombre);
    },
    llegar: (item) => {
      appointmentLegacy.navigateTo(pointOf(item));
    },
    hora: (item) => changeTime(item.id, item.hora ?? ""),
    confirmar: (item) => setState("confirmar", item),
    desconfirmar: (item) => setState("desconfirmar", item),
    descartar: (item) => setState("descartar", item),
    borrar: remove,
    aplazar: postpone,
    noestaba: absent,
    nueva: (item) => appointmentLegacy.newDateAfterAbsent(item),
    rehacer: planAgain
  };
  async function runAction(action, item) {
    await ACTIONS[action](item);
  }
  var timeOf2 = (item) => item.hora ? String(item.hora).slice(0, 5) : null;
  function orderByTime(open, id, time) {
    const moved = open.find((item) => item.id === id);
    if (!moved || !time) return open;
    const rest = open.filter((item) => item.id !== id);
    let index = rest.findIndex((item) => {
      const other = timeOf2(item);
      return other !== null && other > time;
    });
    if (index < 0) {
      index = 0;
      rest.forEach((item, position) => {
        const other = timeOf2(item);
        if (other !== null && other <= time) index = position + 1;
      });
    }
    rest.splice(index, 0, moved);
    return rest;
  }
  async function changeTime(id, current) {
    const time = await notices.askTime(t("agenda.actions.timeTitle"), current, t("agenda.actions.save"));
    if (time === null) return;
    const { error } = await legacyDb().from("agenda").update({ hora: time || null }).eq("id", id);
    if (error) {
      notices.toast(t("agenda.actions.couldNotTime", { error: error.message ?? "" }), true);
      return;
    }
    notices.toast(t("agenda.actions.timeUpdated"));
    const day = appointmentLegacy.lastDayData();
    if (currentScreen() !== "agenda" || !appointmentLegacy.isJoinedDayView() || !day?.some((item) => item.id === id)) {
      refreshQuietly(id, false);
      return;
    }
    const owner = agendaSources.ownerId(), data = day.map((item) => item.id === id ? { ...item, hora: time || null } : item);
    const mine = (item) => item.usuario_id === owner;
    const open = data.filter((item) => mine(item) && isOpen(item.estado)), order = orderByTime(open, id, time);
    const changed = order.some((item, index) => item.id !== open[index]?.id);
    const next = changed ? [...data.filter((item) => mine(item) && !isOpen(item.estado)), ...order, ...data.filter((item) => !mine(item))] : data;
    await repaintSmoothly(id, next);
    if (changed && !await saveOrder(order)) refreshQuietly(id);
  }

  // src/app/screens/agenda/appointment-menu.ts
  function openMenu(button, item) {
    document.querySelectorAll(".tdmenu").forEach((menu2) => {
      menu2.remove();
    });
    const options = menuOptions(item);
    if (!options.length) {
      notices.toast(t("agenda.menu.alreadyClosed"));
      return;
    }
    const menu = document.createElement("div");
    menu.className = "tdmenu";
    menu.__t = Date.now();
    const danger = (action) => action === "descartar" || action === "borrar";
    menu.innerHTML = options.map((entry) => `<button data-tdop="${entry.action}" class="${danger(entry.action) ? "peligro" : ""}"><b>${escapeHtml(entry.title)}</b>${entry.detail ? `<span>${escapeHtml(entry.detail)}</span>` : ""}</button>`).join("");
    document.body.appendChild(menu);
    const rect = button.getBoundingClientRect();
    menu.style.top = `${Math.min(window.innerHeight - menu.offsetHeight - 10, rect.bottom + 6)}px`;
    menu.style.left = `${Math.max(10, Math.min(window.innerWidth - menu.offsetWidth - 10, rect.right - menu.offsetWidth))}px`;
    menu.querySelectorAll("[data-tdop]").forEach((entry) => {
      entry.onclick = () => {
        menu.remove();
        void runAction(entry.dataset.tdop, item);
      };
    });
  }

  // src/app/screens/agenda/appointment-sheet.ts
  var DAY_MINUTES2 = 24 * 60;
  function timeText2(item, info) {
    if (item.hora) return String(item.hora).slice(0, 5);
    if (isOpen(item.estado) && isPresent(info.llegada) && info.llegada < DAY_MINUTES2) return t("agenda.sheet.around", { time: formatMinutes(info.llegada) });
    return t("agenda.sheet.noTime");
  }
  function timetableText2(item, info) {
    const windows = info.ventanas ?? weekPlanner.attendanceWindows(item.dias, item.fecha);
    if (!windows) return "";
    if (!windows.length) return t("agenda.sheet.notAttending");
    return (info.otroCentro ? t("agenda.sheet.atCentre", { centre: info.otroCentro }) : "") + yourDayLegacy.windowsText(windows);
  }
  var row = (label, value2) => `<div class="vcfila"><span>${label}</span><b>${value2}</b></div>`;
  function dataHtml(item, info) {
    const where = [item.centro_nombre, item.direccion, item.municipio].filter(Boolean).join(" · "), timetable = timetableText2(item, info), origin = yourDayLegacy.originText(item);
    return `<div class="vcdatos">
      ${row(t("agenda.sheet.when"), `${escapeHtml(capitalise(formatLongDate(item.fecha)))} · ${escapeHtml(timeText2(item, info))}`)}
      ${row(t("agenda.sheet.where"), escapeHtml(where || t("agenda.sheet.noCentre")))}
      ${timetable ? row(t("agenda.sheet.timetable"), escapeHtml(timetable)) : ""}
      ${row(t("agenda.sheet.state"), `${statePill(item.estado)}${origin ? ` <span class="sm">${origin}</span>` : ""}`)}
    </div>`;
  }
  function closedHtml(item) {
    if (isOpen(item.estado)) return "";
    return `<div class="banda-info vccerrada" id="vccerrada">${t("agenda.sheet.closed", { state: escapeHtml(item.estado) })}
    <span id="vccomo"></span> ${t(hasMenu(item) ? "agenda.sheet.closedReopen" : "agenda.sheet.closedFinal")}</div>`;
  }
  function goToButton(day, label, id, item) {
    return day && day !== item.fecha ? `<button type="button" class="btn sec" id="${id}" data-vcdia="${day}">${escapeHtml(t(label, { day: appointmentLegacy.dayLabel(day) }))}</button>` : "";
  }
  function buttonsHtml(item) {
    const open = isOpen(item.estado), today = todayIso();
    return `<div class="vcacts">
      <button type="button" class="btn sec" id="vcficha">${t("agenda.sheet.seeCard")}</button>
      ${pointOf(item) ? `<button type="button" class="btn sec" id="vcllegar">${t("agenda.sheet.directions")}</button>` : ""}
      ${open ? `<button type="button" class="btn sec" id="vchora">${t("agenda.sheet.changeTime")}</button><button type="button" class="btn sec" id="vcmover">${t("agenda.sheet.moveDay")}</button>` : ""}
    ${canPlanAgain(item, today) ? `<button type="button" class="btn sec" id="vcrehacer">${t("agenda.sheet.planAgain")}</button>` : ""}${item.estado === STATES.postponed ? goToButton(item.aplazada_a_fecha, "agenda.sheet.goTo", "vcirdest", item) : ""}${goToButton(item.aplazada_de_fecha, "agenda.sheet.seeDay", "vcirorig", item)}</div>
    ${open ? `<div class="vcfin">
        <button type="button" class="lnk" id="vcdescartar">${t("agenda.sheet.discard")}</button><span class="sm">${t("agenda.sheet.discardText")}</span>
        ${item.fecha >= today ? `<button type="button" class="lnk peligro" id="vcborrar">${t("agenda.sheet.delete")}</button><span class="sm">${t("agenda.sheet.deleteText")}</span>` : ""}</div>` : ""}
    <div class="acts" style="justify-content:flex-end">
      <button type="button" class="btn sec" id="vcok" disabled>${t("agenda.sheet.saveNotes")}</button>
      ${open && yourDayLegacy.canRecordOn(item.fecha) ? `<button type="button" class="btn" id="vcreg">${t("agenda.sheet.record", { visit: term("visita") })}</button>` : ""}</div>`;
  }
  function sheetHtml(item, info) {
    return `
    <div class="fh"><div><h2>${escapeHtml(item.nombre)}</h2>${item.especialidad ? `<div class="sm">${escapeHtml(item.especialidad)}</div>` : ""}</div>
      <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>
    ${dataHtml(item, info)}
    ${closedHtml(item)}
    ${isOpen(item.estado) && info.aviso ? `<div class="banda-aviso" style="margin:0 0 12px">${escapeHtml(info.aviso)}</div>` : ""}
    <label for="vcnota">${t("agenda.sheet.notes")}</label>
    <textarea id="vcnota" rows="3" placeholder="${t("agenda.sheet.notesPlaceholder")}">${escapeHtml(item.nota ?? "")}</textarea>
    ${buttonsHtml(item)}`;
  }
  var dialog = () => document.getElementById("dlg");
  var close = () => {
    dialog()?.close();
  };
  async function saveNotes(item, notes, button) {
    button.disabled = true;
    const value2 = notes.value.trim();
    const { error } = await legacyDb().from("agenda").update({ nota: value2 || null }).eq("id", item.id);
    if (error) {
      button.disabled = false;
      notices.toast(t("agenda.sheet.couldNotSave", { error: error.message ?? "" }), true);
      return;
    }
    item.nota = value2;
    close();
    notices.toast(t("agenda.sheet.notesSaved"));
    refreshQuietly(item.id, false);
  }
  function bind5(body2, item) {
    const notes = body2.querySelector("#vcnota"), save3 = body2.querySelector("#vcok");
    if (notes && save3) {
      notes.oninput = () => {
        save3.disabled = notes.value.trim() === (item.nota ?? "").trim();
      };
      save3.onclick = () => {
        void saveNotes(item, notes, save3);
      };
    }
    const on2 = (id, action) => {
      const button = body2.querySelector(`#${id}`);
      if (button) button.onclick = action;
    };
    const closeAnd = (action) => () => {
      close();
      void runAction(action, item);
    };
    on2("vcficha", () => {
      close();
      appointmentLegacy.openAccountFromCentre(item.cuenta_id, item.centro_nombre);
    });
    on2("vcllegar", () => {
      void runAction("llegar", item);
    });
    on2("vchora", closeAnd("hora"));
    on2("vcmover", closeAnd("aplazar"));
    on2("vcdescartar", closeAnd("descartar"));
    on2("vcborrar", closeAnd("borrar"));
    on2("vcrehacer", closeAnd("rehacer"));
    on2("vcreg", () => {
      close();
      appointmentLegacy.recordVisit(item.cuenta_id, item.fecha);
    });
    body2.querySelectorAll("[data-vcdia]").forEach((button) => {
      button.onclick = () => {
        close();
        agendaState.setMode("dia");
        legacyAgenda.showDay(button.dataset.vcdia ?? "");
      };
    });
  }
  function fillVisitResult(item) {
    if (!isDone(item.estado) || !item.cuenta_id) return;
    legacyDb().from("actividades").select("resultados, hora").eq("cuenta_id", item.cuenta_id).eq("fecha", item.fecha).limit(1).then(({ data }) => {
      const visit = data?.[0], place = document.getElementById("vccomo");
      if (!visit || !place) return;
      const results = Array.isArray(visit.resultados) ? visit.resultados.filter(Boolean).join(", ") : visit.resultados ?? "";
      place.textContent = t("agenda.sheet.recorded", { visit: term("visita"), time: visit.hora ? t("agenda.sheet.recordedAt", { time: String(visit.hora).slice(0, 5) }) : "", results: results ? `: ${results}` : "" });
    }, () => void 0);
  }
  function showAppointment(item) {
    const body2 = document.getElementById("dbody"), box = dialog();
    if (!item || !body2 || !box) return;
    body2.innerHTML = sheetHtml(item, yourDayLegacy.stopInfo()[item.id] ?? {});
    bind5(body2, item);
    fillVisitResult(item);
    box.classList.add("pequena");
    box.showModal();
  }

  // src/app/screens/agenda/editors/appointment-editor.ts
  var timeOf3 = (item) => item.hora ? String(item.hora).slice(0, 5) : null;
  var inputValue = (id) => document.getElementById(id)?.value ?? "";
  async function loadAccount(id, draft) {
    const { data } = await legacyDb().rpc("ficha_cuenta", { p_id: id });
    draft.consultations = data?.consultas ?? [];
    return data?.medico ?? null;
  }
  function paintCentres(draft) {
    const box = document.getElementById("nccw");
    if (!box) return;
    const list = draft.consultations.filter((item) => item.centro_nombre);
    if (list.length < 2) {
      box.innerHTML = "";
      return;
    }
    const preferred = editorLegacy.centreFromCard() ?? (list.find((item) => item.principal) ?? list[0])?.centro_nombre;
    box.innerHTML = `<label for="ncc">${t("agenda.editor.centre")}</label><select id="ncc">${list.map((item) => `<option value="${escapeHtml(item.centro_nombre)}" ${item.centro_nombre === preferred ? "selected" : ""}>${escapeHtml([item.centro_nombre, item.municipio].filter(Boolean).join(" · "))}</option>`).join("")}</select>`;
  }
  function windowHtml(day) {
    return `
    <div class="fh"><div><h2>${t("agenda.editor.newTitle")}</h2><div class="sm">${t("agenda.editor.newSubtitle")}</div></div>
      <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>
    <label>${term("medico", { capital: "C" })}</label><div id="ncsel"></div>
    <div class="g2">
      <div><label for="ncf">${t("agenda.editor.day")}</label><input id="ncf" type="date" value="${escapeHtml(day)}"></div>
      <div><label for="nch">${t("agenda.editor.time")} <span class="sm">${t("agenda.editor.optional")}</span></label><input id="nch" type="time"></div>
    </div>
    <div id="nccw"></div>
    <label for="ncn">${t("agenda.editor.notes")}</label><textarea id="ncn" rows="3" placeholder="${t("agenda.sheet.notesPlaceholder")}"></textarea>
    <div class="acts" style="justify-content:flex-end">
      <button class="btn sec" data-cerrar>${t("agenda.editor.cancel")}</button>
      <button class="btn" id="ncok">${t("agenda.editor.add")}</button></div>`;
  }
  async function sameDayDecision(accountId, day) {
    const owner = editorLegacy.viewedUserId() ?? salesTeam.currentUserId();
    const { data } = await callRpc("agenda_rango", { p_desde: day, p_hasta: day, p_usuario: owner });
    const existing = (data ?? []).find((item) => item.cuenta_id === accountId && isOpen(item.estado));
    if (!existing) return "nueva";
    const message = t("agenda.editor.duplicateText", {
      name: existing.nombre ?? "",
      date: formatLongDate(day),
      time: existing.hora ? t("agenda.editor.at", { time: String(existing.hora).slice(0, 5) }) : "",
      state: existing.estado,
      origin: existing.origen ? ` · ${existing.origen}` : ""
    });
    const choice = await notices.choose(
      t("agenda.editor.duplicateTitle"),
      message,
      [{ k: "no", t: t("agenda.editor.cancel"), cls: "sec" }, { k: "dos", t: t("agenda.editor.keepBoth"), cls: "sec" }, { k: "sust", t: t("agenda.editor.onlyNew") }]
    );
    if (!choice) return null;
    if (choice === "sust") {
      const { data: result } = await legacyDb().rpc("borrar_cita", { p_id: existing.id });
      if (result?.ok === false) {
        notices.toast(t("agenda.editor.couldNotRemovePrevious"), true);
        return null;
      }
    }
    return choice;
  }
  async function recentDecision(accountId, day) {
    const recent = await editorLegacy.recentContacts(accountId, day);
    if (!recent.length) return true;
    const choice = await notices.choose(
      t("agenda.editor.recentTitle"),
      t("agenda.editor.recentText", { list: editorLegacy.recentText(recent.slice(0, 3)) }),
      [{ k: "no", t: t("agenda.editor.cancel"), cls: "sec" }, { k: "nomas", t: t("agenda.editor.yesNoMore"), cls: "sec" }, { k: "si", t: t("agenda.editor.addAnyway") }]
    );
    if (!choice) return false;
    if (choice === "nomas") {
      await editorLegacy.turnOffRecentNotice();
      notices.toast(t("agenda.editor.noticeOff"));
    }
    return true;
  }
  async function placeByTime(day, owner, accountId, time) {
    const { data } = await callRpc("agenda_rango", { p_desde: day, p_hasta: day, p_usuario: owner });
    const open = (data ?? []).filter((item) => item.usuario_id === owner && isOpen(item.estado));
    const mine = open.filter((item) => item.cuenta_id === accountId && timeOf3(item) === time).pop();
    if (!mine) return;
    const rest = open.filter((item) => item !== mine);
    let index = rest.findIndex((item) => {
      const other = timeOf3(item);
      return other !== null && other > time;
    });
    if (index < 0) {
      index = 0;
      rest.forEach((item, position) => {
        const other = timeOf3(item);
        if (other !== null && other <= time) index = position + 1;
      });
    }
    rest.splice(index, 0, mine);
    if (rest.some((item, position) => item !== open[position])) {
      await saveOrder(rest);
      agendaCache.forgetDay(day);
    }
  }
  function centreOf(draft, picked) {
    const main = draft.consultations.find((item) => item.principal) ?? draft.consultations[0];
    return [inputValue("ncc"), main?.centro_nombre, picked.centro_nombre, picked.centro].find((name) => Boolean(name)) ?? null;
  }
  async function write(picked, draft, options) {
    const day = inputValue("ncf"), inAgenda = currentScreen() === "agenda";
    return appointmentLegacy.write("guardar_cita", { p: {
      cuenta_id: picked.id,
      fecha: day,
      hora: inputValue("nch") || null,
      centro_nombre: centreOf(draft, picked),
      estado: STATES.planned,
      origen: orFallback(options.origen, inAgenda ? "Agenda" : "Ficha"),
      usuario_id: editorLegacy.viewedUserId(),
      nota: inputValue("ncn").trim(),
      op_id: `c-${picked.id}-${day}-${Date.now()}`
    } });
  }
  async function save(draft, options, button) {
    const picked = draft.picked;
    if (!picked) {
      notices.toast(t("agenda.editor.choose", { professional: term("medico", { article: "un" }) }), true);
      return;
    }
    const day = inputValue("ncf"), time = inputValue("nch");
    if (!await sameDayDecision(picked.id, day) || !await recentDecision(picked.id, day)) return;
    button.disabled = true;
    const result = await write(picked, draft, options);
    button.disabled = false;
    if (result?.error) {
      notices.toast(t("agenda.editor.couldNot", { error: result.error.message ?? "" }), true);
      return;
    }
    if (time) await placeByTime(day, editorLegacy.viewedUserId() ?? salesTeam.currentUserId(), picked.id, time);
    document.getElementById("dlg")?.close();
    notices.toast(t("agenda.editor.added", { date: formatDayMonth(day) }));
    if (currentScreen() === "agenda") refreshQuietly();
    else void load();
  }
  async function newAppointment(accountId, day, options = {}) {
    const draft = { picked: null, consultations: [] };
    if (accountId) draft.picked = await loadAccount(accountId, draft);
    const shown = legacyAgenda.selectedDate(), today = todayIso();
    const body2 = document.getElementById("dbody"), box = document.getElementById("dlg");
    if (!body2 || !box) return;
    body2.innerHTML = windowHtml(day ?? (currentScreen() === "agenda" && shown && shown >= today ? shown : today));
    paintCentres(draft);
    editorLegacy.pickAccount(document.getElementById("ncsel"), draft.picked, async (account) => {
      draft.picked = account;
      await loadAccount(account.id, draft);
      paintCentres(draft);
    });
    const ok = document.getElementById("ncok");
    if (ok) ok.onclick = () => {
      void save(draft, options, ok);
    };
    box.classList.add("pequena");
    box.showModal();
  }

  // src/app/screens/agenda/editors/task-editor.ts
  var dialog2 = () => document.getElementById("dlg");
  var value = (id) => document.getElementById(id)?.value ?? "";
  function afterChange(message) {
    dialog2()?.close();
    notices.toast(message);
    agendaState.forgetDayTasks();
    void paintYourDay();
  }
  async function remove2(task) {
    if (!await notices.confirm(t("agenda.taskEditor.deleteText"), { titulo: t("agenda.taskEditor.deleteTitle"), ok: t("agenda.taskEditor.delete"), peligro: true })) return;
    const { error } = await legacyDb().from("tareas").delete().eq("id", task.id);
    if (error) {
      notices.toast(t("agenda.taskEditor.couldNotDelete"), true);
      return;
    }
    afterChange(t("agenda.taskEditor.deleted"));
  }
  async function save2(task, button) {
    const title = value("tat").trim();
    if (!title) {
      notices.toast(t("agenda.taskEditor.writeWhat"), true);
      document.getElementById("tat")?.focus();
      return;
    }
    const row2 = { titulo: title, fecha: value("taf") || todayIso(), hora: value("tah") || null, nota: value("tan").trim() || null, modificado_en: (/* @__PURE__ */ new Date()).toISOString() };
    button.disabled = true;
    const table = legacyDb().from("tareas");
    const { error } = task.id ? await table.update(row2).eq("id", task.id) : await table.insert(row2);
    button.disabled = false;
    if (error) {
      notices.toast(t("agenda.sheet.couldNotSave", { error: error.message ?? "" }), true);
      return;
    }
    afterChange(task.id ? t("agenda.taskEditor.saved") : t("agenda.taskEditor.addedOn", { date: formatDayMonth(row2.fecha) }));
  }
  function editHtml(task, day) {
    const time = task.hora ? String(task.hora).slice(0, 5) : "";
    return `
    <div class="fh"><div><h2>${t(task.id ? "agenda.taskEditor.title" : "agenda.taskEditor.newTitle")}</h2><div class="sm">${t("agenda.taskEditor.subtitle")}</div></div>
      <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>
    <label for="tat">${t("agenda.taskEditor.what")}</label><input id="tat" value="${escapeHtml(task.titulo ?? "")}" placeholder="${t("agenda.taskEditor.whatPlaceholder")}" maxlength="160">
    <div class="g2">
      <div><label for="taf">${t("agenda.editor.day")}</label><input id="taf" type="date" value="${escapeHtml(task.fecha ?? day ?? todayIso())}"></div>
      <div><label for="tah">${t("agenda.editor.time")} <span class="sm">${t("agenda.editor.optional")}</span></label><input id="tah" type="time" value="${escapeHtml(time)}"></div>
    </div>
    <label for="tan">${t("agenda.editor.notes")}</label><textarea id="tan" rows="3">${escapeHtml(task.nota ?? "")}</textarea>
    <div class="acts" style="justify-content:space-between">
      ${task.id ? `<button type="button" class="btn sec peligro" id="taborrar">${t("agenda.taskEditor.delete")}</button>` : "<span></span>"}
      <span style="display:flex;gap:8px"><button type="button" class="btn sec" data-cerrar>${t("agenda.editor.cancel")}</button><button type="button" class="btn" id="taok">${t(task.id ? "agenda.taskEditor.save" : "agenda.taskEditor.add")}</button></span></div>`;
  }
  function doneHtml(task) {
    return `
    <div class="fh"><div><h2>${t("agenda.taskEditor.doneTitle")}</h2><div class="sm">${escapeHtml(formatLongDate(task.fecha ?? todayIso()))}${task.hora ? ` · ${escapeHtml(String(task.hora).slice(0, 5))}` : ""}</div></div>
      <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>
    <div class="tarlec"><span class="tarok">${t("agenda.taskEditor.done")}</span><b>${escapeHtml(task.titulo ?? "")}</b>${task.nota ? `<p>${escapeHtml(task.nota)}</p>` : ""}</div>
    <div class="acts" style="justify-content:space-between">
      <button type="button" class="btn sec peligro" id="taborrar">${t("agenda.taskEditor.delete")}</button>
      <span style="display:flex;gap:8px"><button type="button" class="btn sec" data-cerrar>${t("common.close")}</button><button type="button" class="btn" id="tareabrir">${t("agenda.taskEditor.reopen")}</button></span></div>`;
  }
  async function reopen(task, day, button) {
    button.disabled = true;
    const { error } = await legacyDb().from("tareas").update({ hecha: false, modificado_en: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", task.id);
    button.disabled = false;
    if (error) {
      notices.toast(t("agenda.taskEditor.couldNotChange"), true);
      return;
    }
    agendaState.forgetDayTasks();
    void paintYourDay();
    editTask({ ...task, hecha: false }, day);
  }
  function show() {
    const box = dialog2();
    if (!box) return;
    box.classList.add("pequena");
    if (!box.open) box.showModal();
  }
  function editTask(task, day) {
    const body2 = document.getElementById("dbody");
    if (!body2) return;
    const current = task ?? {};
    body2.innerHTML = current.id && current.hecha ? doneHtml(current) : editHtml(current, day);
    const ok = document.getElementById("taok");
    if (ok) ok.onclick = () => {
      void save2(current, ok);
    };
    const again = document.getElementById("tareabrir");
    if (again) again.onclick = () => {
      void reopen(current, day, again);
    };
    const erase = document.getElementById("taborrar");
    if (erase) erase.onclick = () => {
      void remove2(current);
    };
    show();
  }

  // src/app/screens/agenda/your-day/card-buttons.ts
  function swapWithNeighbour(item, action) {
    const all = legacyAgenda.dayAppointments(), open = all.filter((entry) => isOpen(entry.estado));
    const from = open.indexOf(item), to = action === "sube" ? from - 1 : from + 1;
    const neighbour = open[to];
    if (!neighbour) return;
    open[from] = neighbour;
    open[to] = item;
    void moveAppointment([...all.filter((entry) => !isOpen(entry.estado)), ...open], item.id, action);
  }
  function cardButton(button) {
    const [action = "", id = ""] = (button.dataset.td ?? "").split("|");
    const item = legacyAgenda.dayAppointments().find((entry) => entry.id === id);
    if (!item) return;
    if (action === "mas") openMenu(button, item);
    else if (action === "visita") {
      if (yourDayLegacy.canRecordOn(item.fecha)) appointmentLegacy.recordVisit(item.cuenta_id, item.fecha);
    } else if (action === "nueva") void appointmentLegacy.newDateAfterAbsent(item);
    else if (action === "sube" || action === "baja") swapWithNeighbour(item, action);
  }
  function taskRow2(row2, target) {
    if (target.closest(".tdtchk, .tdtmov")) return;
    const day = legacyAgenda.selectedDate();
    editTask((agendaCache.dayTasks(day ?? "") ?? []).find((task) => task.id === row2.dataset.tarea), day);
  }
  function taskArrow(arrow) {
    const [direction = "0", id = ""] = (arrow.dataset.tamov ?? "").split("|");
    void moveTask(id, Number(direction));
  }
  function listenToCards() {
    document.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      if (target.closest("#tdordenar, #tdnocord")) {
        void orderByDistance();
        return;
      }
      const arrow = target.closest("[data-tamov]");
      if (arrow) {
        taskArrow(arrow);
        return;
      }
      if (target.closest("#tdtarea")) {
        editTask(null, legacyAgenda.selectedDate());
        return;
      }
      const row2 = target.closest("#tdtareas .tdtarea");
      if (row2) {
        taskRow2(row2, target);
        return;
      }
      const button = target.closest("[data-td]");
      if (button) {
        event.stopPropagation();
        cardButton(button);
      }
    });
  }

  // src/app/main.ts
  var router = createRouter("inicio");
  router.register(homeRoute);
  window.delcos = {
    router,
    navigate,
    t,
    setLanguage,
    setVocabulary,
    screens: {
      home: { load, renderSkeleton, paintIndicators },
      agenda: agenda_exports,
      accounts: accounts_exports
    }
  };
  listenToSameCentre();
  listenToYourDay();
  listenToCards();
})();
