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
  function orFallback(value, fallback) {
    return value === void 0 || value === null || value === "" ? fallback : value;
  }
  function nonZeroOr(value, fallback) {
    return value === void 0 || value === null || value === 0 || Number.isNaN(value) ? fallback : value;
  }
  var range = (length) => [...Array(length).keys()];
  var sum = (values) => values.reduce((total, value) => total + value, 0);
  var isPresent = (value) => value !== null && value !== void 0;

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
      const dialog = document.getElementById("dlg");
      if (dialog?.open && (Boolean(dialog.dataset.fija) || Boolean(dialog.dataset.depagina))) dialog.close();
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
    agenda: {
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
      }
    },
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
      const value = params[name] ?? vocabulary[name];
      return value === void 0 ? whole : String(value);
    });
  }
  function t(key, params = {}) {
    const text = lookup(catalogs[currentLanguage], key) ?? lookup(es, key) ?? key;
    return fill(text, params);
  }

  // src/app/screens/agenda/index.ts
  var agenda_exports = {};
  __export(agenda_exports, {
    bindWeekButton: () => bindWeekButton,
    closeMonth: () => closeMonth,
    data: () => preload_exports,
    dueList: () => dueList,
    groupByAttendance: () => groupByAttendance,
    loadAgenda: () => loadAgenda,
    metricsHtml: () => metricsHtml,
    openTray: () => openTray,
    paintOpenWeek: () => paintOpenWeek,
    paintSameCentre: () => paintSameCentre,
    paintStrip: () => paintStrip,
    paintTrayButtons: () => paintTrayButtons,
    paintWeekSidebar: () => paintWeekSidebar,
    refreshAfterChange: () => refreshAfterChange,
    refreshMetrics: () => refreshMetrics,
    refreshOpenMonth: () => refreshOpenMonth,
    refreshOpenTray: () => refreshOpenTray,
    reloadMetrics: () => reloadMetrics,
    renderMonth: () => renderMonth,
    shareWeek: () => shareWeek,
    showDay: () => showDay,
    toggleMonth: () => toggleMonth
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
    isProfessionalPortal: () => ES_MEDICO(),
    hasOpportunities: () => typeof hayOportunidades === "function" && hayOportunidades(),
    canReviewDuplicates: () => typeof puedeDuplicados === "function" && puedeDuplicados()
  };
  var homeCache = {
    panel: () => KV_INI,
    setPanel: (value) => {
      KV_INI = value;
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
    setMetrics: (value) => {
      AG_MET = value;
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
    setContext: (value) => {
      HERR_CTX = value;
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
    confirm: (message, options) => preguntar(message, options)
  };
  var initialsOf = (name) => iniciales(name);
  var reloadAgenda = () => {
    void cargarAgenda();
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

  // src/app/services/format.ts
  var HTML_ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);
  }
  function formatNumber(value) {
    return Number(value ?? 0).toLocaleString("es");
  }
  function formatEuros(value) {
    return `${Math.round(Number(value) || 0).toLocaleString("es-ES")} €`;
  }
  function looseText(text) {
    return String(text ?? "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }

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
  function headerHtml(month, current) {
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
    header.innerHTML = headerHtml(target, current);
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
  var count = (value) => formatNumber(value ?? 0);
  var decimal = (value) => value === void 0 || value === null ? "0" : String(value).replace(".", ",");
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
  var toNumber = (value) => Number(value);
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
    const body = document.getElementById("agcuerpo"), suggestions = agendaSuggestions.forDay(), isoDate = legacyAgenda.selectedDate();
    if (!body || !suggestions || !isoDate || suggestions.fecha !== isoDate) return;
    body.querySelectorAll(".agtamb").forEach((element) => {
      element.remove();
    });
    const cards = [...body.querySelectorAll(".tdu[data-tdu]")];
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
    const save = box.querySelector("#semguardar");
    if (save) save.onclick = () => {
      weekPlanner.saveDraft(save);
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
    const body = document.getElementById("agcuerpo");
    if (!hasStrip() || stripState.start() !== start || !body) return;
    const html = stripHtml(start, { today, selected: legacyAgenda.selectedDate(), perDay: perDayOf(result.data ?? [], owner), blocked });
    const old = document.getElementById("agcinta");
    if (old) old.outerHTML = html;
    else body.insertAdjacentHTML("beforebegin", html);
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
      const show = () => {
        legacyAgenda.showDay(day.dataset.agsl ?? "");
      };
      day.onclick = show;
      day.onkeydown = (event) => {
        if (event.key === "Enter") show();
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
    const close = () => {
      panel.classList.remove("abierto");
    };
    const closeButton = document.getElementById("tclose");
    if (closeButton) closeButton.onclick = close;
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
      close();
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
    const body = dayBody();
    if (!body || currentScreen() !== "agenda") return;
    const empty = body.querySelector(":scope > .vacio"), stats = body.querySelector(".tdhead .tdstats");
    stats?.classList.toggle("hide", Boolean(empty) && !body.querySelector(".tdesc"));
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
  function headerHtml2() {
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
      view.innerHTML = headerHtml2();
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
    const body = dayBody();
    if (!body) return;
    const top = body.getBoundingClientRect().top;
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
  function minutesOf(time) {
    const match = /(\d{1,2}):(\d{2})/.exec(String(time ?? ""));
    return match ? Number(match[1]) * 60 + Number(match[2]) : null;
  }
  function countsByDate(rows) {
    return new Map((rows ?? []).map((row) => [row.fecha, row.n]));
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
    const next = open.find((item) => (minutesOf(item.hora) ?? 9999) >= minutesNow - 15) ?? open[0];
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
    const bars = values.map((value, i) => {
      const day = days[i] ?? today, height = Math.max(3, value / max * 40), x = i * (barWidth + gap), future = !upcoming && day > today, isToday = day === today;
      const fill2 = future ? "#E3EBF3" : isToday ? "var(--sky)" : "var(--navy)";
      return `<rect x="${x}" y="${44 - height}" width="${barWidth}" height="${height}" rx="4" fill="${fill2}" opacity="${value ? 1 : 0.35}"/><text x="${x + barWidth / 2}" y="58" text-anchor="middle" class="${isToday ? "hoy" : ""}">${WEEKDAY_LETTERS[fromIsoDate(day).getDay()] ?? ""}</text>`;
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
    const x = (i) => i / (dayOfMonth - 1) * width, y = (value) => height - value / max * height;
    const line = (values) => values.map((value, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(value).toFixed(1)}`).join("");
    const end = current[current.length - 1] ?? 0, difference = end - (last[last.length - 1] ?? 0);
    return {
      summary: t(difference >= 0 ? "home.indicators.aboveLastMonth" : "home.indicators.belowLastMonth", { difference }),
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
    const counts = new Map((charts.estados ?? []).map((row) => [row.valor, row.n]));
    return commercialStates.all().filter((state) => state.papel !== "negativo").map((state) => ({ state, accounts: counts.get(state.valor) ?? 0 }));
  }
  function portfolioTotal(charts) {
    return sum((charts.estados ?? []).map((row) => row.n));
  }
  var color = (role) => STATE_COLORS[role] ?? "#C9D7E6";
  function interestedChart(charts) {
    const counts = stateCounts(charts), steps = counts.filter((count2) => count2.state.papel !== "inicial");
    if (!steps.length) return EMPTY_CHART;
    const max = Math.max(1, ...steps.map((count2) => count2.accounts)), width = 196, barWidth = width / steps.length;
    const columns = steps.map((count2, i) => {
      const on = count2.state.papel === "interes", height = Math.max(4, count2.accounts / max * 28);
      const name = count2.state.valor.length > 11 ? `${count2.state.valor.slice(0, 10)}.` : count2.state.valor;
      return `<rect x="${i * barWidth + 4}" y="${34 - height}" width="${barWidth - 8}" height="${height}" rx="4" fill="${on ? "var(--navy)" : "#DCE6F1"}"/><text x="${i * barWidth + barWidth / 2}" y="${30 - height}" text-anchor="middle" class="n ${on ? "on" : ""}">${count2.accounts}</text><text x="${i * barWidth + barWidth / 2}" y="48" text-anchor="middle" class="${on ? "on" : ""}">${escapeHtml(name)}</text>`;
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
    const body = context.panel ? liveBody(definition.id, capitalise(title).trim(), raw, context) : `
       ${help}
       <b>${typeof raw === "string" ? raw : formatNumber(raw)}</b><span>${escapeHtml(capitalise(title))}</span>`;
    return `<div class="${classes}"${action} data-kid="${definition.id}" data-comp="1">${icon2 ? `<span class="kico" aria-hidden="true">${icon2}</span>` : ""}${context.panel ? help : ""}${body}${description ? `<em class="kdesc">${escapeHtml(description)}</em>` : ""}</div>`;
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
    const [areas, pendingOps, stock, cycle, calls, dayAppointments, tasks] = await Promise.all(requests(today));
    if (!homeCache.panel()) homeCache.setPanel(await valueOf(legacyDb().rpc("panel_inicio")));
    return {
      today,
      areas: areas ?? {},
      pendingOps,
      stock: stock ?? [],
      cycle,
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
    const units = inEuros ? ` · <b>${formatNumber(sales.unidades ?? 0)}</b> ${t("home.sales.units")}` : "";
    return `<div class="mt mtven"><div class="mtt">${icon("chart-column")} ${t("home.sales.title")}</div>
      <div class="mn1" ${figure2}>${inEuros ? formatEuros(current) : `${formatNumber(current)}<small>${t("home.sales.units")}</small>`}</div>
      <div class="ms">${salesVersus(change)}<b>${formatNumber(sales.pedidos ?? 0)}</b> ${t("home.sales.orders")}${units}</div>
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
    const done = summary.reduce((sum2, row) => sum2 + row.hechas, 0), target = summary.reduce((sum2, row) => sum2 + row.objetivo, 0);
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
      agenda: agenda_exports
    }
  };
  listenToSameCentre();
})();
