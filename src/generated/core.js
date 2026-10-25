(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value10) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value: value10 }) : obj[key] = value10;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __publicField = (obj, key, value10) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value10);

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
  function runBefores(steps3, navigation) {
    const passed = [];
    for (const step of steps3) {
      step.before?.(navigation);
      passed.push({ step, target: navigation.target });
      if (navigation.blocked) break;
    }
    return passed;
  }
  function runNavigation(steps3, switchScreen, target, args) {
    const navigation = { target, args, blocked: false };
    let passed = [];
    try {
      passed = runBefores(steps3, navigation);
      if (!navigation.blocked) switchScreen(navigation.target, args);
      for (const { step, target: seen } of [...passed].reverse()) step.after?.(seen, args);
    } finally {
      for (const { step, target: seen } of [...passed].reverse()) step.cleanup?.(seen);
    }
  }

  // src/app/services/values.ts
  function orFallback(value10, fallback) {
    return value10 === void 0 || value10 === null || value10 === "" ? fallback : value10;
  }
  function nonZeroOr(value10, fallback) {
    return value10 === void 0 || value10 === null || value10 === 0 || Number.isNaN(value10) ? fallback : value10;
  }
  var range = (length) => [...Array(length).keys()];
  var sum = (values) => values.reduce((total, value10) => total + value10, 0);
  var isPresent = (value10) => value10 !== null && value10 !== void 0;

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
    delays.forEach((delay2) => {
      setTimeout(() => {
        safely(action);
      }, delay2);
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
      const section2 = PANEL_SECCIONES.find((entry) => entry[0] === nav.target);
      if (section2) {
        PAG_TAB.delcos = section2[1];
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
      const section2 = ALIAS_PEDIDOS[nav.target];
      if (section2 !== void 0) {
        PEDSEC = section2;
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
      const dialog4 = document.getElementById("dlg");
      if (dialog4?.open && (Boolean(dialog4.dataset.fija) || Boolean(dialog4.dataset.depagina))) dialog4.close();
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
        const section2 = document.getElementById(`v-${page}`);
        if (section2) section2.innerHTML = "";
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
      const section2 = screenSection();
      if (section2) {
        section2.classList.remove("cargando", "cargando-pend");
        revelar(section2, 4e3, revealSince[revealSince.length - 1] ?? Date.now());
      }
      document.querySelectorAll("main > section.preparando").forEach((other) => {
        if (other !== section2) other.classList.remove("preparando");
      });
    },
    cleanup: () => {
      revealSince.pop();
    }
  };
  function billingSection() {
    const map = { fiscal: "empresa", series: "series", vf: "verifactu", fact: orFallback(FAC_ULTIMA, "empresa") };
    const section2 = CFG_SEC ?? "";
    if (!(map[section2] ?? (section2 === "fact" ? map[CFG_SUB ?? ""] : void 0))) return void 0;
    return orFallback(map[section2 === "fact" ? orFallback(CFG_SUB, "fact") : section2], "empresa");
  }
  var billingSettings = {
    name: "v2.57 · fiscal data, series and VeriFactu open in Facturación",
    before: (nav) => {
      if (nav.target !== "config") return;
      const section2 = billingSection();
      if (section2 !== void 0) {
        FSEC = section2;
        CFG_SEC = "rutas";
        nav.target = "facturacion";
      }
    }
  };
  var loadingIndicatorAfterDelay = {
    name: "v2.56 · the loading indicator only shows while the screen is still requesting data",
    after: () => {
      const section2 = screenSection();
      if (section2?.classList.contains("cargando-pend")) {
        section2.classList.remove("cargando-pend");
        if (PEND > 0) section2.classList.add("cargando");
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
      const section2 = screenSection();
      if (!section2?.classList.contains("cargando")) return;
      section2.classList.remove("cargando");
      section2.classList.add("cargando-pend");
      if (PEND > 0) section2.classList.add("cargando");
      section2.classList.remove("cargando-pend");
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
    list: {
      searching: "Buscando {contacts}…",
      searchingShort: "Buscando…",
      couldNotLoad: "No se ha podido cargar la lista",
      notResponding: " (la conexión no responde)",
      retry: "Reintentar",
      count: '<b>{count}</b> {contacts} <span class="sm">· {ms} ms</span>',
      noMatches: "Ningún registro cumple estos filtros.",
      sortBy: "Ordenar por esta columna",
      urgent: "Urgente",
      chipSearch: "Búsqueda: {text}",
      chipUrgent: "Solo urgentes",
      chipMine: "De mi cartera",
      chipNeverVisited: "Sin visitar nunca"
    },
    columns: {
      centre: "Centro",
      town: "Municipio",
      address: "Dirección",
      phone: "Teléfono",
      days: "Días",
      state: "Estado",
      salesReps: "Comerciales",
      access: "Acceso a la plataforma",
      noReporting: "Sin reporting",
      noReportingTitle: "Solo {visit} presencial: sin informes ni feedback",
      unassigned: "Sin asignar",
      withAccess: "Con acceso",
      accessDisabled: "Acceso desactivado",
      noAccess: "Sin acceso",
      panelTitle: "Columnas",
      back: "‹ Volver",
      panelNote: "Marca las que quieres ver y ordénalas con las flechas. Se aplica al momento. El ancho se cambia arrastrando el borde de cada cabecera.",
      alwaysVisible: "siempre visible",
      up: "Subir",
      down: "Bajar",
      restore: "Restaurar las columnas",
      keepOne: "Deja al menos una columna"
    },
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
    portal: {
      title: "Portal",
      toDeliver: "{count} material por entregar",
      unread: "{count} sin leer",
      requested: "Pedido el {date}",
      delivered: "Entregado",
      messages: "Mensajes",
      reply: "Contestar",
      send: "Enviar",
      deliveredDone: "Material entregado: se le avisa",
      writeMessage: "Escribe el mensaje",
      sent: "Mensaje enviado",
      productsTitle: "Productos del centro",
      productsNote: "Lo que puede pedir desde su portal. Precio sin IVA; si lo dejas vacío, el de tarifa.",
      tariff: "Tarifa {price} sin IVA",
      tariffPlaceholder: "Tarifa",
      priceFor: "Precio de {name} para el centro",
      noProducts: "No hay productos activos.",
      saveProducts: "Guardar productos",
      productsSaved: "Productos del centro guardados ({count})"
    },
    access: {
      title: "Acceso a la plataforma",
      hasAccess: "Tiene acceso",
      asEmail: " como <b>{email}</b>",
      disabled: " (desactivado)",
      centreUses: "pide la reposición de sus productos, material y escribe a su comercial",
      portalUses: "ve su portal: cifras agregadas, sin importes ni datos de personas",
      impersonate: "👤 Impersonalizar",
      centreCan: "Puede tener acceso para pedir la reposición de los productos que le des de alta, pedir material y escribir a su comercial.",
      portalCan: "Puede tener acceso a su portal (cifras agregadas de {prescriptions}), pedir material y escribir a su comercial. No verá importes ni datos de {patients}.",
      give: "Dar acceso",
      email: "Correo",
      emailPlaceholder: "nombre@correo.com",
      invalidEmail: "Escribe un correo válido",
      noPermission: "Tu rol no puede dar acceso",
      notYours: "Solo puedes dar acceso a {professionals} de tu cartera",
      alreadyHas: "Esta ficha ya tiene acceso",
      emailInUse: "Ese correo ya es de otro usuario",
      emailWrong: "El correo no es válido",
      noPortalRole: "No hay ningún rol con acceso al portal: créalo en Configuración → Roles",
      couldNotGive: "No se ha podido dar acceso",
      couldNotCreate: "No se ha podido crear el acceso: {error}",
      created: '<b style="color:var(--ok)">Acceso creado.</b> Contraseña temporal: <b>{password}</b>. Pásasela y que la cambie al entrar.'
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

  // src/app/i18n/es/analytics.ts
  var analytics = {
    explore: {
      calculating: "Calculando…",
      couldNotCalculate: "No se ha podido calcular: {error}",
      units: "Unidades",
      amount: "Importe sin IVA",
      orders: "Pedidos",
      withSales: "{professionals} con ventas",
      byProduct: "Por producto",
      unitsHead: "Unidades",
      unitsShare: "% uds.",
      amountHead: "Importe",
      weight: "Peso",
      total: "Total",
      noOrders: "Sin pedidos completados con estos filtros."
    },
    table: {
      calculating: "Calculando la tabla…",
      noData: "Sin datos en este periodo.",
      concept: "Concepto",
      units: "unidades vendidas",
      amount: "importe sin IVA",
      title: "Tabla mensual de {measure} por {dimension}",
      hint: "Cada fila es un {dimension} y cada columna un mes del periodo elegido. La última columna suma la fila y la última fila suma cada mes. «·» = sin ventas ese mes. Cuanto más intenso el azul, más alto el valor."
    },
    orders: {
      title: "Pedidos tras {theVisit}",
      whatIsIt: "Qué es",
      help: "{aVisit} a {aProfessional} cuenta como con pedido si hay un pedido confirmado atribuido {toTheProfessional} el mismo día o en los {days} días siguientes. No cuentan las entregas sin cargo. {TheVisits} de los últimos {days} días todavía pueden sumar pedidos. Por tipo: captación es la primera {visit} que se registra a {aProfessional}; presentación, la que lleva la ficha a un estado de avance o interés o presenta un producto que no se le había presentado; seguimiento, las demás.",
      previousView: "Vista anterior",
      nextView: "Vista siguiente",
      position: "{number} de {total} · {name}",
      viewFunnel: "Embudo",
      viewEffect: "El efecto",
      viewMonths: "Mes a mes",
      viewTypes: "Por tipo",
      subtitleFunnel: "{Visits} del {from} al {to} y pedidos atribuidos {toTheProfessional} en los {days} días siguientes",
      subtitleEffect: "Unidades pedidas por {visit}, de media, en los {days} días antes y después de ella",
      subtitleMonths: "Por mes: {visits} hechas y cuántas tienen un pedido atribuido {toTheProfessional} en los {days} días siguientes",
      subtitleTypes: "{TheVisits} de captación, de presentación y de seguimiento, y cuántas tienen un pedido en los {days} días siguientes",
      visitsDone: "{Visits} hechas",
      withOrderIn: "Con pedido en {days} días",
      haveOrder: "{visited} tienen un pedido en {days} días",
      units: "unidades",
      days: "{count} días",
      untilFirst: "hasta el primer pedido",
      points: "{count} puntos",
      pts: "{count} pts",
      vsPrevious: "frente al periodo anterior",
      noVisits: "Sin {visits} en este periodo.",
      noRecentVisits: "Sin {visits} en los últimos meses.",
      moreUnits: "más unidades en los {days} días siguientes {toTheVisit}",
      fewerUnits: "menos unidades en los {days} días siguientes {toTheVisit}",
      noOrdersBefore: "antes {ofTheVisit} no había pedidos",
      noOrders: "sin pedidos en esas fechas",
      perDayBefore: "uds./día antes",
      perDayAfter: "uds./día después",
      effectLabel: "Unidades por día antes y después",
      visitDay: "Día {ofTheVisit}",
      peak: "pico al {day}.º día",
      before: "Antes",
      after: "Después",
      endInOrder: "{month}, acaban en pedido",
      versus: "frente a {month}",
      monthsLabel: "Por mes, con pedido y sin él",
      legendVisits: "{Visits}",
      shareInOrder: "% que acaba en pedido",
      typeCapture: "Captación",
      typePresentation: "Presentación",
      typeFollowUp: "Seguimiento",
      ofTotal: "{part} de {total}",
      person: "Persona",
      teamHint: "Con pedido de cada tipo, de las {visits} que registró cada persona",
      newShare: "de {theVisits} con pedido son de captación o de presentación",
      newOnes: "de captación o presentación",
      followUps: "de seguimiento",
      typeUnits: "{type}: {units} uds."
    }
  };

  // src/app/i18n/es/visit.ts
  var visit = {
    days: {
      monday: "lunes",
      tuesday: "martes",
      wednesday: "miércoles",
      thursday: "jueves",
      friday: "viernes",
      saturday: "sábado",
      sunday: "domingo"
    },
    modes: {
      inPerson: "Presencial",
      phone: "Teléfono",
      video: "Videollamada"
    },
    block: {
      title: "Para la {visit}",
      urgent: "Urgente",
      noAddress: "Sin dirección",
      directions: "Cómo llegar",
      attendsToday: "Hoy atiende: {hours}",
      notToday: "Hoy no atiende aquí · el {day}: {hours}",
      noTimetable: "Sin horario de atención",
      centreOpen: "Centro abierto hoy: {hours}",
      noConsultation: "Sin {consultation} registrada: añádela en «Editar ficha».",
      inside: "Cómo llegar dentro:",
      lastVisit: "Última {visit}: {date}",
      noResult: "Sin resultado",
      material: "Material: {material}",
      pending: "Pendiente:",
      visitAgain: "Volver a {visit}",
      late: "Atrasada",
      today: "Hoy",
      notes: "Notas:"
    },
    photos: {
      chooseImage: "Elige una foto",
      photo: "Foto {number}",
      photoAlt: "Foto",
      remove: "Quitar la foto",
      uploadFailed: "{visit}, pero no se ha podido subir una foto: añádela desde su historial",
      title: "Fotos de {visit}",
      none: "Todavía no hay fotos",
      one: "1 foto",
      many: "{count} fotos",
      delete: "Borrar la foto",
      add: "Añadir foto",
      done: "Hecho",
      deleteText: "La foto desaparece de {visit}.",
      deleteTitle: "¿Borrar la foto?",
      deleteOk: "Borrar",
      couldNotDelete: "No se ha podido borrar",
      deleted: "Foto borrada",
      atMost: "Como mucho {max} fotos por {visit}",
      added: "Foto añadida",
      addedMany: "Fotos añadidas",
      couldNotOpen: "No se han podido abrir las fotos",
      hint: "Lineal, exposición, material colocado… (hasta {max})"
    },
    presentation: {
      label: "Presentación",
      material: "Material",
      previous: "Anterior",
      next: "Siguiente",
      position: "{number} de {total} · {name}",
      offline: "Sin conexión: este material se podrá ver cuando vuelva la conexión.",
      couldNotLoad: "No se ha podido cargar: {reason}",
      missing: "no está"
    },
    record: {
      title: "Registrar {visit}",
      centre: "Centro {visit}",
      howItWas: "Cómo fue",
      products: "Productos presentados",
      present: "Presentar",
      result: "Resultado",
      resultLabel: "Resultado",
      severalResults: "· puedes marcar varios de «{done}»",
      withData: "+ dato",
      showOneHidden: "Ver el resultado de otros estados",
      showHidden: "Ver los {count} resultados de otros estados",
      nextActionPlaceholder: "p. ej. Llevar reporting",
      nextActionDate: "Fecha de la próxima acción",
      save: "Guardar {visit}",
      missingTimetable: "⚠ Falta su horario de atención. Aprovecha {visit} para preguntarlo\n    y complétalo después en <b>Editar ficha</b>.",
      offlineTitle: "Sin conexión.",
      offline: "{visit} se guarda en este móvil y se envía sola al recuperar la conexión. Las muestras necesitan conexión.",
      sameDay: "La visita se registra el mismo día",
      noReporting: "{professional} no quiere reporting: solo {visit} presencial.",
      chooseResult: "Elige al menos un resultado",
      couldNotSave: "No se ha podido guardar: {error}",
      saved: "{visit}",
      newState: " · estado: {state}",
      urgentTitle: "Estaba marcada como urgente",
      urgentText: "{name}\n\n¿Quitas la marca de urgente ahora que ya la has visitado?",
      keepUrgent: "La dejo",
      removeUrgent: "Quitar urgente",
      couldNotUnmark: "No se ha podido quitar la marca",
      unmarked: "Ya no está marcada como urgente",
      couldNotOpen: "No se ha podido abrir: {reason}",
      cardUnreadable: "no se ha podido leer la ficha",
      noCopy: "sin conexión y sin copia de esta ficha en el móvil"
    },
    samples: {
      title: "Muestras de medicamento",
      expired: "Ya no se puede dar: el plazo acabó el {date}",
      left: "Quedan {left} de {max} este año",
      until: " · hasta el {date}",
      of: "Muestras de {name}",
      signature: "Firma de quien las recibe",
      signatureHint: "· solicitud de muestras con fecha de hoy",
      signatureArea: "Espacio para firmar",
      signer: "Nombre de quien firma",
      clear: "Borrar la firma",
      overLimit: "Se pasa del máximo de muestras de este año",
      missingSignature: "Falta la firma de quien recibe las muestras"
    },
    edit: {
      title: "Editar {visit}",
      recordedOn: "Registrada el {date}",
      date: "Fecha",
      samples: "Muestras",
      result: "Resultado",
      nextAction: "Próxima acción",
      note: "Nota",
      delete: "Borrar {visit}",
      saving: "Guardando…",
      couldNotSave: "No se ha podido guardar",
      saved: "{visit}",
      deleteTitle: "¿Borrar {visit}?",
      deleteText: "{visit} desaparece del historial {professional}.\nQueda constancia en la auditoría.",
      deleteOk: "Borrar",
      couldNotDelete: "No se ha podido borrar",
      deleted: "{visit}"
    },
    settings: {
      samplesTitle: "Muestras y stock",
      samplesSubtitle: "Qué pasa con el stock cuando se registran muestras en {visit}",
      fromStock: "Restar las muestras del stock",
      fromStockHint: "Salen del maletín de quien registra {visit} o, si no tiene, del almacén central, por lote y caducidad.",
      product: "Producto de las muestras",
      chooseProduct: "Elige el producto de las muestras",
      couldNotSave: "No se ha podido guardar",
      saved: "Guardado"
    }
  };

  // src/app/i18n/es/commissions.ts
  var commissions = {
    homeCard: {
      yourCommission: "Tu comisión de {period}",
      yourActivity: "Tu actividad de {period}",
      units: "unidades atribuidas",
      accrued: "comisión acumulada",
      perUnit: "por unidad en tu tramo",
      nextTier: "Te faltan <b>{missing}</b> unidades para el siguiente tramo",
      nextTierAmount: ", que pasaría a <b>{amount}</b> por unidad, aplicado a todo el periodo",
      noScheme: "No tienes comisión asignada: estas unidades solo cuentan para las métricas.",
      topTier: "Estás en el tramo más alto."
    },
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

  // src/app/i18n/es/customers.ts
  var customers = {
    person: "Persona",
    company: "Empresa",
    list: {
      title: "Clientes",
      subtitle: "{Patients} y empresas que compran: con qué {professional} y su historial",
      newCustomer: "+ Nuevo cliente",
      searching: "Buscando clientes…",
      couldNotLoad: "No se ha podido cargar: {error}",
      oneCustomer: "cliente",
      customers: "clientes",
      loading: "Cargando…",
      search: "Buscar",
      searchPlaceholder: "Nombre, teléfono, email, DNI o CIF",
      type: "Tipo",
      all: "Todos",
      persons: "Personas ({patients})",
      companies: "Empresas",
      orders: "Pedidos",
      withOrders: "Con pedidos",
      withoutOrders: "Sin pedidos",
      town: "Población",
      allTowns: "Todas",
      customer: "Cliente",
      taxId: "DNI / CIF",
      phone: "Teléfono",
      email: "Email",
      salesRep: "Comercial",
      units: "Uds.",
      lastOrder: "Último pedido",
      unassigned: "Sin asignar",
      none: "Ningún cliente con estos filtros."
    },
    picker: {
      placeholder: "Nombre, teléfono o DNI",
      newOne: "+ Nuevo",
      searching: "Buscando {patients}…",
      noMatches: "Sin coincidencias. Créalo con «+ Nuevo»."
    },
    card: {
      noAddress: "Sin dirección de entrega",
      taxIdCompany: "CIF {taxId}",
      taxIdPerson: "DNI {taxId}",
      noTaxId: "Sin DNI",
      remove: "Quitar"
    },
    sheet: {
      notFound: "No se ha encontrado {thePatient}.",
      taxId: " · NIF {taxId}",
      newOrder: "+ Nuevo pedido",
      editData: "Editar datos",
      orders: "pedidos",
      units: "unidades",
      withVat: "con IVA",
      treatedBy: "{Professional} que lo trata",
      code: " · código {code}",
      salesRep: "Comercial: {name}",
      noSalesRep: "Sin comercial asignado",
      unassigned: "Sin {professionalAssigned}. Las unidades de {thisPatient} no se atribuyen a nadie hasta que lo asignes.",
      change: "Cambiar de {professional}",
      assign: "Asignar {professional}",
      removeProfessional: "Quitar {professional}",
      contact: "Contacto",
      phone: "Teléfono",
      mobile: "Móvil",
      email: "Email",
      address: "Dirección",
      note: "Nota",
      noContact: "Sin datos de contacto.",
      ordersTitle: "Pedidos",
      noProducts: "Sin productos",
      orderLine: "{units} uds. · {total} con IVA",
      noOrders: "Todavía no tiene pedidos.",
      couldNotSave: "No se ha podido guardar",
      pickPlaceholder: "Busca {theProfessional} por nombre, centro o municipio",
      reactivate: "Volver a dar de alta",
      deactivate: "Dar de baja",
      delete: "Eliminar {thePatient}"
    },
    status: {
      couldNot: "No se ha podido: {error}",
      deactivated: "{Patient} dado de baja",
      reactivated: "{Patient} dado de alta de nuevo"
    }
  };

  // src/app/i18n/es/opportunities.ts
  var opportunities = {
    followUpDays: {
      tomorrow: "Mañana",
      threeDays: "En 3 días",
      week: "En una semana",
      month: "En un mes"
    },
    weekdays: ",Lunes,Martes,Miércoles,Jueves,Viernes,Sábado,Domingo",
    callAgainWhen: "¿Cuándo volver a llamar?",
    callAgainOn: "Volver a llamar el",
    whatToDo: "Qué hacer",
    whatToDoPlaceholder: "p. ej. Enviarle el precio por WhatsApp",
    callRecord: {
      title: "Registro de llamada",
      hint: "Si llama y no compra, guarda solo la llamada: no se crea el cliente, pero quedan sus datos para las métricas.",
      reason: "Motivo",
      result: "Resultado",
      type: "Tipo",
      incoming: "Entrante",
      outgoing: "Saliente",
      note: "Nota de la llamada",
      callOnly: "No compra: guardar solo la llamada",
      couldNotSave: "No se ha podido guardar la llamada",
      couldNotSaveError: "No se ha podido guardar la llamada: {error}"
    },
    editor: {
      closedSale: "Venta cerrada",
      opportunity: "Oportunidad",
      callAgain: "Volver a llamar",
      newSale: "Nueva venta",
      followUpOf: "Seguimiento de {name}",
      subtitleRecord: "Cliente, qué quiere y cómo termina: queda registrado aunque no compre",
      subtitleOrder: "Busca el cliente o crea su ficha y haz el pedido",
      client: "Cliente",
      wants: "Qué quiere",
      reference: "{Professional} o centro de referencia",
      referenceHint: "Si no está en la base, escribe su nombre: se guarda igualmente para las métricas.",
      referencePlaceholder: "Nombre, código, centro o municipio",
      howArrived: "Cómo llegó",
      reason: "Motivo",
      moreDetails: "Más detalles",
      dateTime: "Fecha y hora",
      note: "Nota",
      howEnds: "Cómo termina",
      closedWith: "Cerrada con el pedido {order}.",
      makeOrder: "🛒 Hacer el pedido",
      noSale: "No compra",
      whyNoSale: "Por qué no compra",
      saveWithoutOrder: "Guardar sin pedido",
      close: "Cerrar",
      saveChanges: "Guardar cambios",
      change: "Cambiar",
      searchPlaceholder: "Nombre, teléfono o DNI",
      newCard: "+ Crear ficha nueva",
      orderWithoutClient: "Pedido sin cliente (venta a centro)",
      nameIsEnough: "Si no compra y no quiere ficha, basta con escribir aquí su nombre o su teléfono.",
      notFound: "No está: crea su ficha con «+ Crear ficha nueva».",
      product: "Producto",
      noProducts: "Sin productos",
      units: "Unidades",
      remove: "Quitar",
      otherProduct: "+ Otro producto",
      wouldBuy: 'Iría a comprar <b id="nvtotv">{amount}</b>',
      unsold: "Sin pedido se quedan sin vender <b>{amount}</b>.",
      defaultProduct: "Producto",
      noOrdersYet: "Cliente sin pedidos todavía.",
      lastOrder: "<b>Último pedido</b> · {date} · {lines} · {amount}",
      repeat: "Repetir",
      orders: "{count} pedidos · {amount} en total",
      ordersMore: "{count} o más pedidos · {amount} en total",
      promised: "Quedaste en llamarle el {date}{action} ({result}).",
      repeated: "Interés con lo del último pedido",
      couldNotSave: "No se ha podido guardar",
      couldNotSaveError: "No se ha podido guardar: {error}",
      noExtra: "No se ha podido guardar: tu organización no tiene el registro de oportunidades",
      findClient: "Busca el cliente o crea su ficha para hacer el pedido",
      markWhy: "Marca por qué no compra",
      nameOrPhone: "Apunta al menos su nombre o su teléfono",
      savedNoOrder: "Oportunidad guardada sin pedido",
      saved: "Oportunidad guardada"
    },
    list: {
      search: "Buscar",
      searchPlaceholder: "Cliente, teléfono o {professional}",
      result: "Resultado",
      all: "Todos",
      notClosed: "Sin cerrar",
      callAgainTitle: "Volver a llamar",
      callAgainHint: "Clientes que no compraron y a los que quedaste en volver a llamar.",
      noName: "Sin nombre",
      late: "Atrasada · ",
      today: "Hoy · ",
      fromReference: " · de {name}",
      call: "Llamar",
      record: "Registrar",
      notNeeded: "Ya no hace falta",
      followUpClosed: "Seguimiento cerrado",
      kpiOpportunities: "Oportunidades",
      kpiOrders: "Acaban en pedido",
      kpiConversion: "Conversión",
      kpiSold: "Vendido",
      kpiUnsold: "Sin vender",
      kpiNotClosed: "Sin cerrar",
      endInOrder: "{won} de {total} acaban en pedido",
      howToRead: "<b>Cómo leerlo:</b> ",
      whatFor: "<b>Para qué sirve:</b> ",
      productsTitle: "Qué piden",
      productsEmpty: "Apunta qué producto y cuántas unidades quiere cada cliente.",
      productsRead: "unidades vendidas sobre las que pidieron. Mucha diferencia en un producto señala precio, stock o argumentario.",
      resultsTitle: "Cómo terminan",
      resultsEmpty: "Aparecerá con las primeras oportunidades.",
      resultsRead: "si pesan «El precio no le convence» o «Solo quería información», conviene revisar el argumentario o las condiciones.",
      hoursTitle: "A qué hora",
      hoursEmpty: "Verás en qué horas llegan y cuáles venden más.",
      hoursRead: "poner más gente al teléfono en las horas con más oportunidades.",
      daysTitle: "Qué día",
      daysEmpty: "Verás qué días de la semana llegan más.",
      daysRead: "pedidos sobre oportunidades de cada día de la semana.",
      originsTitle: "Cómo llegan",
      originsEmpty: "Marca en cada venta cómo llegó el cliente.",
      originsRead: "pedidos sobre oportunidades por canal: dónde merece la pena invertir.",
      referencesTitle: "Por {professional} de referencia",
      referencesEmpty: "Verás qué {professionals} y centros mandan clientes.",
      referencesRead: "{aProfessional} con muchas oportunidades y pocos pedidos es una oportunidad de seguimiento.",
      salesTitle: "Por comercial {ofProfessional}",
      salesEmpty: "Aparecerá cuando las oportunidades tengan {professional} de referencia.",
      salesRead: "el volumen que genera el trabajo de cada zona.",
      date: "Fecha",
      client: "Cliente",
      wants: "Qué quiere",
      ends: "Cómo termina",
      next: "Próximo paso",
      attended: "Atendió",
      order: "Pedido {number}",
      empty: "Sin oportunidades en este periodo. Empieza con «+ Nueva venta»: queda registrada aunque no acabe en pedido."
    }
  };

  // src/app/i18n/es/quality.ts
  var quality = {
    page: {
      title: "Calidad del dato",
      subtitle: "Fichas completas, datos que faltan y avance de cada {professional}",
      commercialState: "Estado comercial",
      province: "Provincia",
      municipality: "Municipio",
      show: "Mostrar",
      showAll: "Todos",
      showVisited: "Solo visitados",
      showNotVisited: "Sin visitar",
      showWithAction: "Con próxima acción",
      showLate: "Acciones atrasadas",
      allStates: "Todos los estados",
      allProvinces: "Todas las provincias",
      allMunicipalities: "Todos los municipios",
      loading: "Cargando…",
      loadingFollowUp: "Cargando el seguimiento…",
      samplesGiven: "muestras entregadas",
      withAddress: "fichas con dirección",
      withDays: "con días de atención",
      duplicates: "Duplicados"
    },
    summary: {
      complete: "Fichas completas: {percent}%",
      completeOf: "{done} de {total} {professionals}",
      whatIs: "Qué es",
      noLocation: "sin ubicación",
      noLocationHelp: "Sin coordenadas en {anyPlace}: no entran en rutas ni en el mapa.",
      noTimetable: "sin horario de atención",
      noTimetableHelp: "Sin días ni horas de atención: las rutas no pueden ajustarse a su horario.",
      noSpeciality: "sin {speciality}",
      noSpecialityHelp: "Sin {speciality} en la ficha: no se pueden filtrar ni analizar por {speciality}.",
      noContact: "sin teléfono ni email",
      noContactHelp: "No hay forma de contactar con ellos fuera {ofVisit}.",
      noProvince: "sin provincia",
      noProvinceHelp: "Sin provincia no se pueden asignar por zona a un comercial.",
      noSalesperson: "sin comercial",
      noSalespersonHelp: "{Professionals} que no están en ninguna cartera.",
      duplicates: "pendientes de unificar",
      duplicatesHelp: "Fichas marcadas como posibles duplicados.",
      completeHint: "Una ficha completa tiene ubicación, horario, {speciality} y teléfono o email. Debajo, el avance de cada {professional}."
    },
    addresses: {
      title: "Direcciones que no cuadran · {count}",
      hint: "El punto del mapa de {thesePlaces} está lejos de su municipio: «Cómo llegar», las rutas y la agenda las sitúan mal.",
      noAddress: "Sin dirección",
      farFrom: "El punto está a {km} km de {municipality}",
      outOfSpain: "El punto está fuera de España",
      card: "Ficha",
      relocate: "Volver a situar",
      searching: "Buscando…",
      notFound: "No se encuentra esa dirección: corrígela en la ficha",
      elsewhere: "Esa dirección sale en {place}, no en {municipality}: corrígela en la ficha",
      couldNotSave: "No se ha podido guardar: {error}",
      placed: "{name}: situado en {municipality}"
    },
    followUp: {
      searching: "Buscando…",
      couldNotLoad: "No se ha podido cargar: {error}",
      nothing: "Nada que mostrar con estos filtros.",
      urgent: "Urgente",
      noReporting: "Sin reporting",
      noReportingHelp: "Solo {visit} presencial: sin informes ni feedback",
      last: "Última: <b>{date}</b> · {result}",
      notVisited: "Sin visitar",
      samples: " · {count} muestras",
      done: "Hecha",
      postpone: "Aplazar",
      postponeQuestion: "¿Para cuándo la aplazas?",
      postponeTitle: "Aplazar acción",
      couldNot: "No se ha podido",
      markedDone: "Acción marcada como hecha",
      postponed: "Acción aplazada"
    },
    accountsHeader: {
      subtitle: "{Professionals}, centros y sus fichas",
      dataQuality: "Calidad del dato"
    }
  };

  // src/app/i18n/es/manual.ts
  var manual = {
    title: "Manual de uso",
    book: {
      subtitle: "Todo lo que puedes hacer con delcos, paso a paso, con fotos y vídeos",
      backTo: "Volver a {name}"
    },
    help: "Ayuda",
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

  // src/app/i18n/es/importing.ts
  var importing = {
    steps: {
      what: "Qué importar",
      file: "Archivo",
      columns: "Columnas",
      review: "Revisión"
    },
    types: {
      clientes: "Clientes",
      clientesHint: "{Patients} y empresas: datos de contacto y facturación",
      productos: "Productos",
      productosHint: "Catálogo: referencias, precios, IVA y costes",
      prescriptoresHint: "{Professionals} y sus centros",
      ventas: "Ventas",
      ventasHint: "Histórico de ventas con sus líneas de producto"
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
    },
    fields: {
      clientes: {
        nombre: "Nombre o razón social",
        nif: "NIF / CIF / DNI",
        email: "Email",
        telefono: "Teléfono",
        movil: "Móvil",
        direccion: "Dirección",
        cp: "Código postal",
        municipio: "Población",
        provincia: "Provincia",
        pais: "País",
        empresa: "Empresa",
        tipo: "Tipo (Persona o Empresa)",
        medico: "{Professional} de referencia",
        nota: "Notas"
      },
      productos: {
        nombre: "Nombre",
        referencia: "Referencia",
        codigo_barras: "Código de barras (EAN)",
        precio: "Precio sin IVA",
        iva: "IVA (%)",
        coste: "Coste",
        presentacion: "Presentación",
        unidades_envase: "Unidades por envase",
        stock_minimo: "Stock mínimo",
        tipo: "Tipo (producto o servicio)"
      },
      prescriptores: {
        nombre: "Nombre",
        especialidad: "{Speciality}",
        area: "Área",
        cargo: "Cargo",
        telefono: "Teléfono",
        email: "Email",
        centro: "Centro o lugar de trabajo",
        direccion: "Dirección {ofConsultation}",
        cp: "Código postal",
        municipio: "Población",
        provincia: "Provincia",
        nota: "Notas"
      },
      ventas: {
        numero: "Número de pedido o factura",
        fecha: "Fecha",
        cliente: "Cliente",
        nif: "NIF del cliente",
        producto: "Producto",
        referencia: "Referencia del producto",
        unidades: "Unidades",
        precio: "Precio unitario",
        importe: "Importe de la línea (sin IVA)",
        iva: "IVA (%)",
        medico: "{Professional}",
        forma_pago: "Forma de pago",
        cobrado: "Cobrado (sí o no)",
        canal: "Canal"
      }
    }
  };

  // src/app/i18n/es/purchases.ts
  var purchases = {
    list: {
      loading: "Cargando compras…",
      inProgress: "Pedidos de compra en curso",
      unitsOnTheWay: "Unidades en camino",
      late: "Con retraso",
      boughtThisYear: "Comprado este año (sin IVA)",
      number: "Número",
      supplier: "Proveedor",
      products: "Productos",
      date: "Fecha",
      expected: "Llegada prevista",
      units: "Unidades",
      amount: "Importe",
      state: "Estado",
      lateTag: " · retraso",
      none: "Todavía no hay pedidos de compra.",
      createFirst: " Crea el primero con «+ Nuevo pedido de compra»."
    },
    editor: {
      title: "Pedido de compra {number}",
      newTitle: "Nuevo pedido de compra",
      createdOn: "Creado el {date}",
      numberedOnSave: "Se numera solo al guardarlo",
      supplier: "Proveedor",
      date: "Fecha",
      expected: "Llegada prevista",
      products: "Productos",
      product: "Producto",
      units: "Unidades",
      unitCost: "Coste unidad sin IVA",
      received: "Recibidas",
      receivedOf: "{received} de {units}",
      remove: "Quitar",
      addProduct: "+ Añadir producto",
      shipping: "Portes sin IVA (€)",
      note: "Nota",
      totalUnits: "Unidades",
      totalAmount: "Importe sin IVA (con portes)",
      batchesReceived: "Lotes recibidos",
      batchLine: "📦 <b>{product}</b> · lote {batch} · {units} uds",
      expires: " · caduca {date}",
      close: "Cerrar",
      cancelOrder: "Cancelar pedido",
      saveDraft: "Guardar borrador",
      saveChanges: "Guardar cambios",
      markSent: "Marcar como enviado",
      inTransit: "En tránsito",
      receive: "📦 Recibir mercancía",
      chooseSupplier: "Elige el proveedor (créalo antes en la pestaña Proveedores)",
      couldNotSave: "No se ha podido guardar: {error}",
      saved: "Pedido de compra {number} guardado",
      couldNot: "No se ha podido",
      markedInTransit: "Marcado en tránsito",
      cancelText: "El pedido de compra queda cancelado. Lo ya recibido se mantiene en stock.",
      cancelTitle: "¿Cancelar el pedido de compra?",
      cancelled: "Pedido de compra cancelado"
    },
    receive: {
      title: "Recibir mercancía · {number}",
      subtitle: "Anota cada lote con su caducidad. Si llega en varios lotes, usa «+ Otro lote».",
      pending: "· pendientes {pending} de {units}",
      otherBatch: "+ Otro lote de este producto",
      cancel: "Cancelar",
      record: "Registrar la entrada",
      writeUnits: "Indica las unidades recibidas",
      needsBatch: "Cada entrada necesita su número de lote",
      noExpiryText: "Hay lotes sin fecha de caducidad. Sin ella no se pueden avisar ni ordenar las salidas por caducidad.",
      noExpiryTitle: "¿Registrar sin caducidad?",
      noExpiryOk: "Registrar igualmente",
      couldNot: "No se ha podido: {error}",
      stillToCome: "Entrada registrada · quedan {units} unidades por llegar",
      complete: "Pedido recibido completo"
    },
    suppliers: {
      loading: "Cargando proveedores…",
      supplier: "Proveedor",
      taxId: "NIF",
      contact: "Contacto",
      leadTime: "Plazo",
      purchases: "Compras",
      lastPurchase: "Última compra",
      state: "Estado",
      days: "{count} días",
      active: "Activo",
      inactive: "Inactivo",
      none: "Todavía no hay proveedores."
    },
    supplierEditor: {
      newTitle: "Nuevo proveedor",
      subtitle: "Datos para pedidos de compra, lotes y contabilidad",
      name: "Nombre o razón social",
      taxId: "NIF / CIF",
      contact: "Persona de contacto",
      email: "Email",
      phone: "Teléfono",
      address: "Dirección",
      postcode: "Código postal",
      town: "Población",
      province: "Provincia",
      country: "País",
      leadTime: "Plazo de entrega habitual (días)",
      payment: "Forma de pago",
      conditions: "Condiciones (pedido mínimo, portes…)",
      account: "Cuenta contable",
      note: "Nota",
      active: "Activo",
      close: "Cerrar",
      save: "Guardar",
      create: "Crear proveedor",
      writeName: "Escribe el nombre",
      couldNotSave: "No se ha podido guardar",
      saved: "Proveedor guardado",
      created: "Proveedor creado",
      defaultCountry: "España"
    }
  };

  // src/app/i18n/es/tenders.ts
  var tenders = {
    file: "Exp. {number}",
    list: {
      couldNotLoad: "No se han podido cargar los concursos.",
      newTender: "+ Nuevo concurso",
      warnings: "Avisos de vencimiento",
      noEndDate: "Sin fecha de fin",
      expired: "Vencido",
      expiresToday: "Vence hoy",
      expiresInOneDay: "Vence en 1 día",
      expiresInDays: "Vence en {count} días",
      submitBy: "Presentar hasta el {date}",
      oneLot: "1 lote",
      lots: "{count} lotes",
      oneWon: ", 1 ganado",
      won: ", {count} ganados",
      contractsHint: "Los precios de los lotes ganados se ponen solos en los pedidos de esa ficha mientras el contrato está en vigor. Avisa {when} antes de que venza.",
      warnDays: "{days} días",
      warnNever: "nunca",
      and: " y ",
      noContracts: "No hay contratos adjudicados.",
      noClosed: "No hay concursos cerrados.",
      noOpen: "No hay concursos en marcha."
    },
    editor: {
      changeTitle: "Cambiar el concurso",
      newTitle: "Nuevo concurso",
      subtitle: "Pliego, plazos e importe",
      title: "Título",
      titlePlaceholder: "p. ej. Suministro de material de osteosíntesis",
      soldTo: "A quién se vende",
      soldToPlaceholder: "Busca el centro, la clínica o el organismo",
      file: "Expediente",
      body: "Organismo",
      bodyPlaceholder: "p. ej. Diputación de Barcelona",
      published: "Publicado",
      submitBy: "Presentar hasta",
      amount: "Importe de licitación sin IVA (€)",
      responsible: "Responsable",
      note: "Nota",
      delete: "Borrar",
      cancel: "Cancelar",
      save: "Guardar",
      create: "Crear concurso",
      missing: "Escribe el título y elige a quién se vende",
      noPermission: "No puedes crear ni cambiar concursos de esta ficha",
      couldNotSave: "No se ha podido guardar: {error}",
      saved: "Concurso guardado",
      created: "Concurso creado",
      deleteText: "El concurso desaparece con sus lotes y precios.",
      deleteTitle: "¿Borrar el concurso?",
      couldNotDelete: "No se ha podido borrar",
      deleted: "Concurso borrado"
    },
    sheet: {
      notFound: "No se ha encontrado el concurso",
      state: "Estado",
      stateLabel: "Estado del concurso",
      submitBy: "Presentar hasta",
      amount: "Licitación",
      withoutVat: "{amount} sin IVA",
      contractFrom: "Contrato desde",
      contractTo: "Hasta",
      extendedTo: "Prorrogado hasta",
      pricesApplied: "Los precios de los lotes ganados se aplican en los pedidos de {account}{left}.",
      thisAccount: "esta ficha",
      alreadyExpired: " (el contrato ya ha vencido)",
      oneMoreDay: " durante 1 día más",
      moreDays: " durante {count} días más",
      markWon: "Marca como «Ganado» los lotes adjudicados para que sus precios se apliquen en los pedidos.",
      lots: "Lotes · {count}",
      addLot: "+ Lote",
      noLots: "Añade los lotes del pliego a los que te presentas, con sus productos y precios.",
      change: "Cambiar los datos",
      done: "Hecho",
      noPermission: "No puedes cambiar este concurso",
      couldNotSave: "No se ha podido guardar: {error}",
      datesSaved: "Fechas del contrato guardadas"
    },
    lot: {
      number: "Nº",
      numberLabel: "Número de lote",
      description: "Descripción del lote",
      stateLabel: "Estado del lote",
      remove: "Quitar el lote",
      tenderAmount: "Licitación (€)",
      awardedAmount: "Adjudicado (€)",
      winner: "Se lo llevó",
      winnerPlaceholder: "Empresa que lo ganó",
      product: "Producto",
      price: "Precio sin IVA",
      units: "Unidades",
      removeProduct: "Quitar el producto",
      addProduct: "Añadir un producto",
      addProductOption: "+ Añadir un producto…",
      removeText: "El lote desaparece con sus productos y precios.",
      removeTitle: "¿Quitar el lote?",
      removeOk: "Quitar",
      writePrice: "Escribe el precio"
    },
    warnings: {
      title: "Avisos de vencimiento",
      subtitle: "Cuántos días antes de que venza un contrato se avisa",
      days: "Días antes (separados por comas)",
      hint: "El aviso llega a quien lleva la ficha, al responsable del concurso y a la administración, una vez por cada plazo. Vacío: sin avisos.",
      cancel: "Cancelar",
      save: "Guardar",
      couldNotSave: "No se ha podido guardar",
      saved: "Avisos guardados"
    }
  };

  // src/app/i18n/es/equipment.ts
  var equipment = {
    equipment: "Equipo",
    noPermission: "No puedes cambiar los equipos de esta ficha",
    couldNotSave: "No se ha podido guardar: {error}",
    pills: {
      retired: "Retirado",
      reviewPast: "Revisión pasada ({date})",
      reviewOn: "Revisar el {date}",
      nextReview: "Próxima revisión {date}",
      contract: "Contrato",
      warranty: "Garantía",
      expired: "{what} vencido",
      expiresToday: "{what}: vence hoy",
      expiresInOneDay: "{what}: vence en 1 día",
      expiresInDays: "{what}: vence en {count} días",
      installed: "Instalado"
    },
    list: {
      couldNotLoad: "No se ha podido cargar el parque instalado.",
      newEquipment: "+ Equipo",
      reviewsSoon: "Revisiones en los próximos 30 días",
      expiring: "Contratos y garantías que vencen",
      all: "Todos los equipos · {count}",
      searchPlaceholder: "Nº de serie, equipo, centro…",
      searchLabel: "Buscar un equipo",
      serial: "nº {serial}",
      since: " · desde el {date}",
      noneFound: "Ningún equipo con esa búsqueda.",
      noneYet: "Todavía no hay equipos instalados: dalos de alta aquí, en la ficha del centro o al confirmar el pedido de un producto «equipo»."
    },
    editor: {
      changeTitle: "Cambiar el equipo",
      newTitle: "Nuevo equipo",
      subtitle: "Dónde está instalado, su número de serie y sus condiciones",
      where: "Dónde está",
      wherePlaceholder: "Busca el centro",
      equipment: "Equipo",
      notMarked: " (no marcado como equipo)",
      serial: "Nº de serie",
      location: "Ubicación",
      locationPlaceholder: "p. ej. Sala 2, planta 3",
      installedOn: "Instalado el",
      contract: "Contrato",
      contractEnd: "Fin del contrato",
      warrantyUntil: "Garantía hasta",
      reviewEvery: "Revisión cada (meses; 0 = sin revisiones)",
      note: "Nota",
      retire: "Retirar",
      cancel: "Cancelar",
      save: "Guardar",
      create: "Dar de alta",
      missing: "Elige dónde está y qué equipo es",
      saved: "Equipo guardado",
      created: "Equipo dado de alta",
      retireText: "Queda en el historial como retirado: ya no avisa de revisiones ni vencimientos.",
      retireTitle: "¿Retirar el equipo?",
      retired: "Equipo retirado"
    },
    sheet: {
      notFound: "No se ha encontrado el equipo",
      serial: "Nº de serie {serial} · ",
      where: "Dónde",
      installed: "Instalado",
      contract: "Contrato",
      until: " hasta el {date}",
      warranty: "Garantía",
      warrantyUntil: "hasta el {date}",
      reviews: "Revisiones",
      everyMonth: "cada 1 mes",
      everyMonths: "cada {count} meses",
      noReviews: "sin revisiones periódicas",
      state: "Estado",
      reviewsTitle: "Revisiones · {count}",
      addReview: "Apuntar revisión",
      deleteReviewLabel: "Borrar la revisión",
      noReviewsYet: "Todavía no hay revisiones apuntadas.",
      schedule: "Programar en la agenda",
      change: "Cambiar",
      done: "Hecho",
      date: "Fecha",
      type: "Tipo",
      note: "Nota",
      notePlaceholder: "Qué se hizo",
      cancel: "Cancelar",
      record: "Apuntar",
      reviewRecorded: "Revisión apuntada",
      deleteReviewText: "La revisión desaparece del historial del equipo.",
      deleteReviewTitle: "¿Borrar la revisión?",
      delete: "Borrar"
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

  // src/app/i18n/es/events.ts
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
    },
    /** Labels of the cost concepts (the keys are database columns). */
    concepts: {
      inscripcion: "Inscripción",
      viaje: "Viaje y alojamiento",
      comida: "Comidas",
      honorarios: "Honorarios"
    }
  };

  // src/app/i18n/es/surgeries.ts
  var surgeries = {
    surgery: "Intervención",
    list: {
      couldNotLoad: "No se han podido cargar las intervenciones.",
      newSurgery: "+ Nueva intervención",
      replenishmentsPending: "Reposiciones pendientes",
      usedNotRecorded: "Sin registrar lo usado",
      upcoming: "Próximas",
      noUpcoming: "No hay intervenciones programadas.",
      doneLast30: "Hechas en los últimos 30 días",
      noneDone: "Todavía no hay intervenciones hechas.",
      assists: " · asiste {name}",
      noOrder: "Sin pedido"
    },
    pills: {
      overdue: "Reposición vencida",
      replenishBefore: "Reponer antes del {date}",
      replenished: "Repuesta"
    },
    editor: {
      changeTitle: "Cambiar la intervención",
      newTitle: "Nueva intervención",
      subtitle: "Sale también en la Agenda de quien asiste",
      date: "Fecha",
      time: "Hora",
      centre: "Centro",
      centrePlaceholder: "Busca el centro o la clínica",
      responsible: "Responsable",
      responsiblePlaceholder: "Busca al responsable",
      procedure: "Procedimiento",
      procedurePlaceholder: "p. ej. Prótesis de rodilla",
      room: "Sala",
      roomPlaceholder: "p. ej. Q3",
      assists: "Asiste",
      caseReference: "Referencia {patient}",
      caseReferencePlaceholder: "Código del centro, sin datos de salud",
      materialFrom: "De dónde sale el material",
      note: "Nota",
      cancelSurgery: "Anular",
      cancel: "Cancelar",
      save: "Guardar",
      schedule: "Programar",
      missing: "Elige la fecha, el centro y el responsable",
      couldNotSave: "No se ha podido guardar: {error}",
      cancelled: "Intervención anulada",
      saved: "Intervención guardada",
      scheduled: "Intervención programada",
      cancelText: "La cita de la Agenda queda descartada.",
      cancelTitle: "¿Anular la intervención?"
    },
    origins: {
      deposito: "Depósito del centro",
      personal: "Material de quien asiste"
    },
    sheet: {
      notFound: "No se ha encontrado la intervención",
      responsible: "Responsable",
      centre: "Centro",
      assists: "Asiste",
      material: "Material",
      reference: "Ref. {reference}",
      state: "Estado",
      noOrder: "Falta el pedido al centro con lo usado.",
      createOrder: "Crear el pedido",
      used: "Lo usado",
      product: "Producto",
      batch: "Lote",
      noBatch: "Sin lote",
      serial: "Nº de serie",
      units: "Uds",
      seeOrder: "Ver el pedido",
      replenishNow: "Reponer ahora",
      change: "Cambiar",
      noOrderPermission: "No tienes permiso para crear pedidos: pídeselo a quien lleve los pedidos",
      orderCreated: "Pedido en borrador creado",
      notEnoughStock: "No hay bastante en el almacén central para reponerlo todo",
      replenishedLate: "Repuesto (fuera del plazo de 48 horas)",
      replenished: "Repuesto lo usado"
    },
    use: {
      noMaterialDeposit: "No hay material en el depósito del centro: repón antes de registrar lo usado.",
      noMaterialPersonal: "No hay material en el almacén de quien asiste: repón antes de registrar lo usado.",
      record: "Registrar lo usado",
      hint: "Escribe las unidades usadas de cada lote. Si llevan número de serie, apúntalo en cada unidad.",
      noBatch: "sin lote",
      expires: " · cad. {date}",
      available: " · hay {count}",
      usedOf: "Usadas de {name}",
      serialOf: "Nº de serie de la unidad {index}",
      serialLabel: "Número de serie de la unidad {index}",
      save: "Guardar lo usado",
      writeUsed: "Escribe lo que se ha usado",
      tooMany: "No se puede usar más de lo que hay",
      saved: "Guardado lo usado",
      savedWithOrder: "Queda un pedido en borrador al centro para confirmarlo y la reposición pendiente: hay 48 horas para reponer lo usado.",
      savedWithoutOrder: "Guardado lo usado. Queda la reposición pendiente: hay 48 horas para reponer lo usado."
    },
    errors: {
      permission: "No puedes cambiar esta intervención",
      missing: "Faltan la fecha, el centro o el responsable",
      centre: "El centro tiene que ser una ficha de tipo centro",
      noDeposit: "Este centro no tiene depósito: déjale material desde su ficha o elige el material de quien asiste",
      noStore: "Quien asiste no tiene almacén propio con material",
      done: "La intervención ya está hecha: no se puede cambiar",
      noStock: "No hay bastante en el almacén de la intervención",
      serials: "Hay más números de serie que unidades",
      line: "Revisa las unidades de cada línea",
      empty: "Apunta al menos una unidad usada",
      cancelled: "La intervención está anulada",
      notDone: "Primero registra lo usado",
      noSource: "No hay almacén central del que reponer",
      responsible: "Elige un responsable de tu empresa",
      assistant: "Quien asiste tiene que ser una persona activa del equipo",
      values: "Revisa de dónde sale el material",
      generic: "No se ha podido guardar"
    }
  };

  // src/app/i18n/es/cycle.ts
  var cycle = {
    cycleNames: {
      month: "mes",
      twoMonths: "bimestre",
      quarter: "trimestre",
      fourMonths: "cuatrimestre",
      half: "semestre",
      year: "año",
      other: "ciclo"
    },
    allTeam: "Todo el equipo",
    whose: "De quién",
    classLabel: "Clase",
    classify: "Clasificar",
    range: "{name} del {from} al {to}",
    current: {
      couldNotLoad: "No se ha podido cargar el ciclo.",
      oneDayLeft: "Queda 1 día",
      daysLeft: "Quedan {count} días",
      allCount: "cuentan todas las {visits} registradas, también por teléfono o videollamada",
      adjust: "Ajustar el ciclo",
      oneUnclassified: "1 {professional} sin clasificar",
      unclassified: "{count} {professionals} sin clasificar",
      unclassifiedTail: ": sin clase no cuentan en el ciclo.",
      upToDate: "{done} de {total} al día",
      noneIn: "Ninguno en {class}",
      every: "{visits} cada {cycle}",
      doneOf: "{done} de {goal} hechas · {percent}%",
      missingTitle: "Les faltan {visits} este {cycle}",
      all: "Todas",
      lastVisit: " · última {visit} {date}",
      noVisits: " · sin {visits}",
      progress: "{done} de {goal}",
      oneMissing: "falta 1",
      missing: "faltan {count}",
      appointmentOn: "Cita el {date}",
      newAppointment: "+ Cita",
      noneMissingIn: "En {class} no le falta {visit} a nadie.",
      allUpToDate: "Todos al día este {cycle}.",
      nobodyClassified: "Todavía no hay {professionals} en A, B o C. Empieza por «Clasificar»: A para los más importantes, B para los intermedios y C para el resto."
    },
    classifyPage: {
      couldNotLoad: "No se han podido cargar las fichas.",
      show: "Mostrar",
      unclassified: "Sin clasificar",
      all: "Todas",
      search: "Buscar por nombre, {speciality} o municipio",
      searchLabel: "Buscar",
      hint: "Pulsa A, B o C en cada {professional}: <b>A</b> para los más importantes, <b>B</b> para los intermedios y <b>C</b> para el resto. Pulsar la letra marcada la quita. Las {visits} de los últimos 12 meses ayudan a decidir.",
      in12Months: "en 12 meses",
      firstOnly: "Se ven las 300 primeras: busca para encontrar el resto.",
      allClassified: "Todos están clasificados.",
      noneWithFilter: "No hay ninguno con este filtro.",
      noPermission: "No puedes cambiar la clase de esta ficha",
      couldNotSave: "No se ha podido guardar"
    },
    editor: {
      title: "Ciclo de {visits} A/B/C",
      subtitle: "Cuántas {visits} necesita cada clase en cada ciclo. El ciclo va por el calendario: con un trimestre, de enero a marzo, de abril a junio…",
      length: "Duración del ciclo",
      oneMonth: "Un mes",
      twoMonths: "Dos meses",
      quarter: "Un trimestre",
      fourMonths: "Cuatro meses",
      half: "Un semestre",
      year: "Un año",
      perCycle: "{Visits} por ciclo",
      ofClass: "{Visits} de la clase {class}",
      zeroHint: "Con 0, esa clase no pide {visits}. Cambiarlo no borra nada: solo cambia lo que se cuenta.",
      couldNotSave: "No se ha podido guardar",
      saved: "Ciclo guardado"
    },
    team: {
      goals: " · A {a}, B {b} y C {c} por {professional}.",
      person: "Persona",
      portfolio: "Cartera",
      noClass: "Sin clase",
      upToDate: "Al día",
      cycleVisits: "{Visits} del ciclo",
      countHint: "Cada {professional} cuenta hasta las {visits} de su clase (si tiene más, no compensan las que faltan en otro). Pulsa una persona para ver su ciclo.",
      nobody: "Nadie del equipo tiene cartera asignada."
    },
    coverage: {
      couldNotLoad: "No se ha podido cargar la cobertura.",
      subtitle: "Cuántos {professionals} de cada clase han oído hablar de cada producto en sus {visits} de este {cycle}",
      noProducts: "Ningún producto se promociona todavía.",
      markIt: " Márcalo en Productos: abre el producto y activa «Se promociona en las {visits}».",
      nobodyClassified: "Todavía no hay {professionals} en A, B o C: la cobertura se mide sobre los clasificados.",
      whoIsMissing: "A quién le falta",
      firstOf: " (los {shown} primeros de {total})",
      count: " ({count})",
      allHeard: "Todos lo han oído este {cycle}."
    },
    card: {
      thisCycle: "{done} de {goal} este {cycle}",
      noGoal: "{visits} este {cycle} · su clase no pide {visitsWord}",
      unclassified: "Sin clasificar · {visits} este {cycle}"
    }
  };

  // src/app/i18n/es.ts
  var es = {
    equipment,
    tenders,
    purchases,
    importing,
    manual,
    quality,
    opportunities,
    customers,
    commissions,
    visit,
    analytics,
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
    events,
    surgeries,
    cycle,
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
  function setVocabulary(words6) {
    vocabulary = { ...words6 };
  }
  function lookup(catalog2, key) {
    let node = catalog2;
    for (const part of key.split(".")) {
      if (typeof node !== "object" || node === null) return void 0;
      node = node[part];
    }
    return typeof node === "string" ? node : void 0;
  }
  function fill(text2, params) {
    return text2.replace(/\{(\w+)\}/g, (whole, name) => {
      const value10 = params[name] ?? vocabulary[name];
      return value10 === void 0 ? whole : String(value10);
    });
  }
  function t(key, params = {}) {
    const text2 = lookup(catalogs[currentLanguage], key) ?? lookup(es, key) ?? key;
    return fill(text2, params);
  }

  // src/app/screens/accounts/index.ts
  var accounts_exports = {};
  __export(accounts_exports, {
    columnSettings: () => columnSettings,
    openAccountCard: () => openAccountCard,
    openColumnsPanel: () => openColumnsPanel,
    paintAccountsHeader: () => paintHeader,
    refreshPortal: () => refreshPortal,
    saveColumns: () => saveColumns,
    searchAccounts: () => searchAccounts
  });

  // src/app/legacy/bridge.ts
  var legacyDb = () => db;
  var callRpc = (name, params = {}) => RPC_ORIG(name, params);
  var currentScreen = () => TAB;
  var goTo = (screen2) => {
    ir(screen2);
  };
  var goToOrders = (section2) => {
    PEDSEC = section2;
    ir("ventas");
  };
  function term(word, options = {}) {
    const { number = "s", article = "", capital = "l", adjective, articleCapital = "l" } = options;
    return adjective === void 0 ? TT(word, number, article, articleCapital, capital) : TT(word, number, article, articleCapital, capital, adjective);
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
    setPanel: (value10) => {
      KV_INI = value10;
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
  var showCacheNotice = (element2, date) => {
    avisoCache(element2, date);
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
    setMetrics: (value10) => {
      AG_MET = value10;
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
    planRoute: (list, button2) => {
      void planDesdeLista(list, "toca", button2);
    },
    reschedule: (list, title2, text2) => {
      void reprogramarCitas(list, title2, text2);
    }
  };
  var sidePanel = {
    context: () => HERR_CTX,
    setContext: (value10) => {
      HERR_CTX = value10;
    }
  };
  var legacyAgendaParts = {
    mode: () => AG_MODO,
    blockedDays: (fromIsoDate2, days) => agBloqueos(fromIsoDate2, days),
    dayMenu: (button2, isoDate, blocked) => {
      void menuDiaSemana(button2, isoDate, blocked);
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
    setWeekOpen: (open2) => {
      AG_SEM_ABIERTA = open2;
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
    noStartWarning: (element2) => {
      avisoSinSalida(element2);
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
    saveDraft: (button2) => {
      void guardarBorradorSemana(button2);
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
    choose: (title2, message, buttons) => elegirOpcion(title2, message, buttons),
    askDate: (message, value10, options) => pedirFecha(message, value10, options),
    askTime: async (title2, value10, ok) => await appVentana({ titulo: title2, ok, campo: { valor: value10, tipo: "time" } })
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
    showDialog: (title2, message, ok) => {
      void appVentana({ titulo: title2, msg: message, ok, cancel: false });
    }
  };
  var legacyIcons = {
    line: (name) => SVA(ICU[name] ?? ""),
    arrow: (name) => ICO[name] ?? "",
    list: (name) => plIco(name)
  };
  var appointmentLegacy = {
    /** Writes through the offline queue (the change is kept if there is no connection). */
    write: (name, payload6) => escribir(name, payload6),
    writeRpc: (name, payload6) => escribirRpc(name, payload6),
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
    pickAccount: (element2, value10, onPick, placeholder) => {
      selectorMedico(element2, { valor: value10, alElegir: onPick, ...placeholder ? { placeholder } : {} });
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
    planIncludes: (section2) => planIncluyeSeccion(section2),
    canEditType: (type) => puedeEditarTipo(type),
    /** The base sections, in their legacy order (each one paints a block of the card). */
    customFields: (id, container) => bloqueCampos("cuentas", id, container)
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
    /** Opens a surgery through its global name (so «‹ Volver» sees it), optionally with a notice on top. */
    openSurgery: (id, notice) => {
      void verCirugia(id, notice);
    },
    openTender: (id) => {
      void verConcurso(id);
    },
    openEquipment: (id) => {
      void verEquipo(id);
    },
    newEquipment: (account) => {
      void editarEquipo(null, account);
    }
  };
  var cardBaseLegacy = {
    states: () => estados(),
    canRecord: () => puedeRegistrar(),
    canEdit: () => puedeEditar(),
    directionsAttribute: (point) => navAttr(point),
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
    visitDetails: (visit2) => detTxt(visit2),
    fieldName: (field4) => campoTxt(field4),
    valueText: (value10) => textoValor(value10),
    detailSummary: (detail) => resumenDetalle(detail),
    undo: (id, then) => {
      void deshacerUno(id, then);
    }
  };
  var portalLegacy = {
    hasPortal: () => hayExtra("portal"),
    materialPill: (state) => pillMaterial(state),
    messageThread: (list) => hiloMensajes(list, false),
    failureText: (result) => motivoPortal(result),
    products: async () => {
      if (!PRODUCTOS.length) await cargarProductos();
      return PRODUCTOS;
    },
    euros: (value10) => eurI(value10)
  };
  var accessLegacy = {
    connectionInfo: (userId) => {
      void facccon(userId);
    },
    canImpersonate: (user) => puedeVerComo(user),
    newUser: (preset) => {
      nuevoUsuario(preset);
    },
    forgetAccessCache: () => {
      MED_ACCESO = null;
    },
    /** A user is created with a separate client (no session kept), as the legacy sign-up did. */
    signUp: async (email, password, name) => {
      const client = window.supabase.createClient(CFG.url, CFG.anon, { auth: { persistSession: false, autoRefreshToken: false } });
      const { error } = await client.auth.signUp({ email, password, options: { data: { nombre: name, usuario: email.split("@")[0] } } });
      return error;
    }
  };
  var accountListLegacy = {
    // eslint-disable-next-line id-length -- F is the legacy global state of the filters (a top-level const, not on window)
    filters: () => F,
    mapMode: () => MODO_MAPA,
    paintMap: () => {
      void pintarMapa();
    },
    /** The database order key of a column (only the sortable ones). */
    sortKey: (column) => ORD_DIR[column],
    fieldChips: (state) => clasChips("medico", state),
    contactsLabel: () => etiquetaContactos(),
    pageSize: () => tamPagina(),
    paginate: (options) => {
      paginador(options.element, options.total, options.page, options.onPage, options.onSize);
    }
  };
  var accountColumnsLegacy = {
    customFields: () => CAMPOS.medico ?? [],
    fieldText: (field4, value10) => campoTexto(field4, value10),
    firstName: (name) => nombrePila(name),
    /** Platform access by account (loaded once; null until it arrives). */
    accessOf: () => MED_ACCESO,
    loadAccess: () => cargarAccesoMedicos(),
    storageKey: () => `dlc-cols-${PERFIL?.id ?? ""}`
  };
  var eventsLegacy = {
    repaintList: () => {
      void pintarEventos();
    }
  };
  var appLegacy = {
    /** Forgets every cached read (after a change other screens show). */
    forgetCache: () => {
      invalidarCache();
    },
    openOrder: (id) => {
      void verPedido(id);
    },
    currentUserName: () => PERFIL.nombre ?? ""
  };
  var cycleLegacy = {
    loadSettings: () => cargarAjustes(),
    setting: (key) => AJUSTES[key],
    setSetting: (key, value10) => {
      AJUSTES[key] = value10;
    },
    openTab: (tab) => {
      PAG_TAB.ciclo = tab;
      cargarPagina("ciclo");
    }
  };
  var equipmentLegacy = {
    warningDays: () => CON_AVISOS,
    setWarningDays: (days) => {
      CON_AVISOS = days;
    },
    contracts: () => EQ_CONTRATOS,
    loadProducts: async () => {
      if (!PRODUCTOS.length) await cargarProductos();
    }
  };
  var tendersLegacy = {
    warningDays: () => CON_AVISOS,
    setWarningDays: (days) => {
      CON_AVISOS = days;
    }
  };
  var purchasesLegacy = {
    section: () => PEDSEC,
    canBuy: () => Boolean(puedeCompras()),
    loadSuppliers: () => cargarProveedores(),
    suppliers: () => PROVEEDORES,
    loadStores: () => cargarAlmacenes(),
    stores: () => ALMACENES,
    loadProducts: () => cargarProductos(),
    products: () => PRODUCTOS,
    /** The batch fields of «Recibir mercancía» (shared with the stock entries of Productos). */
    batchFields: (line2, units2, storeId) => loteRecepcion(line2, units2, storeId),
    reloadSales: () => {
      void cargarVentas();
    },
    /** Through the global name: legado 058 wraps it to open the wide window. */
    openPurchase: (id) => {
      void editorCompra(id);
    }
  };
  var importLegacy = {
    excelReader: () => cargarLectorExcel(),
    reportError: (message) => {
      registrarError("error", message);
    },
    countWrite: () => {
      ESCRITURAS++;
    },
    showHistory: () => {
      CFG_SUB = "historial";
    }
  };
  var manualLegacy = {
    sections: () => MANUAL,
    help: (id) => AYUDA[id],
    faq: () => FAQ,
    firstSteps: () => PRIMEROS_PASOS,
    icon: (id) => ICONOS_MANUAL[id],
    levelText: (level) => NIVEL_TXT[level] ?? "",
    can: (capability) => puede(capability),
    isModule: (id) => Boolean(MODULO_AREA[id]),
    canOpenModule: (id) => puedeModulo(id),
    moduleCount: () => Object.keys(MODULO_AREA).filter(puedeModulo).length,
    settingsOf: (id) => CFG_DE_MODULO[id],
    profile: () => PERFIL,
    planIncludes: (module) => planIncluye(module),
    cheapestPlan: (module) => planMinimo(module)?.nombre,
    showPlanNotice: (module) => {
      avisoPlan(module);
    },
    go: (screen2, configSection) => {
      if (configSection !== void 0) CFG_SEC = configSection;
      ir(screen2);
    },
    vocabulary: () => ({ empresa: nombreApp(), terminos: Object.fromEntries(Object.keys(TERM_DEF).map((key) => [key, terminoDe(key)])) }),
    isIos: () => ES_IOS,
    back: () => MANUAL_VUELTA,
    takeBack: () => {
      const back = MANUAL_VUELTA;
      MANUAL_VUELTA = null;
      return back;
    },
    screenName: (screen2) => nombrePantalla(screen2),
    pageInfo: (screen2) => PAGINAS[screen2] ?? {},
    attachHelp: (title2, html) => {
      pegarAyuda(title2, html);
    }
  };
  var qualityLegacy = {
    geocode: (query, hints) => geocodificar(query, hints),
    /** The «Descargar» entry of the tools menu calls window.__dlSeg (legado 014). */
    setExport: (exporter) => {
      Reflect.set(window, "__dlSeg", exporter);
    },
    download: (rows, name, format) => {
      descargar(rows, name, format);
    },
    canUseModule: (module) => puedeModulo(module),
    arrangeAccountsHeader: () => {
      ordenarCabeceraCuentas();
    }
  };
  var opportunitiesLegacy = {
    catalog: (key) => CAT[key] ?? [],
    setCatalog: (key, list) => {
      CAT[key] = list;
    },
    products: () => PRODUCTOS,
    loadProducts: async () => {
      if (!PRODUCTOS.length) await cargarProductos();
    },
    defaultProduct: () => productoPorDefecto(),
    searchClients: (query) => buscarClientes(query),
    editContact: (preset, onSave) => {
      editorContacto(preset, onSave);
    },
    editOrder: (preset) => {
      void editorPedido(preset);
    },
    /** The order saved next is linked to this opportunity (legado 038). */
    setPendingCall: (id) => {
      LLAMADA_PEND = id;
    },
    /** The account picker; what is typed without choosing is kept in element.__texto. */
    pickReference: (options) => {
      Reflect.set(options.element, "__texto", options.freeText);
      selectorMedico(options.element, { valor: options.value, alElegir: options.onPick, placeholder: options.placeholder });
    },
    mountPeriod: (element2, options) => {
      montarPeriodo(element2, options);
    },
    periodOf: (element2) => Reflect.get(element2 ?? {}, "__rango")?.() ?? { desde: null, hasta: null },
    barChart: (items, format) => barrasH(items, format),
    emptyChart: (text2) => vacioGrafico(text2),
    page: () => LLPAG,
    setPage: (page) => {
      LLPAG = page;
    },
    ordersSection: () => PEDSEC,
    repaintList: () => {
      void pintarLlamadas();
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
  var capitalise = (text2) => text2.charAt(0).toUpperCase() + text2.slice(1);
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
  function escapeHtml(value10) {
    return String(value10 ?? "").replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);
  }
  function formatNumber(value10) {
    return Number(value10 ?? 0).toLocaleString("es");
  }
  function formatEuros(value10) {
    return `${Math.round(Number(value10) || 0).toLocaleString("es-ES")} €`;
  }
  function looseText(text2) {
    return String(text2 ?? "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }
  function formatCurrency(value10) {
    return (Number(value10) || 0).toLocaleString("es", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });
  }

  // src/app/legacy/visit-bridge.ts
  var visitLegacy = {
    setCurrent: (draft) => {
      VISITA_ACTUAL = draft;
    },
    /** The day chosen in the Agenda for the visit (used once). */
    takeDate: () => {
      const date = VISITA_FECHA;
      VISITA_FECHA = "";
      return date;
    },
    withLoading: (work) => ventanaCargando(work),
    saveCopy: (key, data) => {
      guardarCache(key, data);
    },
    readCopy: (key) => leerCache(key)?.d ?? null,
    resultValues: () => CAT.resultado_visita ?? [],
    dataField: (value10, key) => campoDato(value10, key),
    signaturePad: (canvas) => padFirma(canvas),
    promotedProducts: () => productosPromocionados(),
    reloadProducts: async () => {
      await cargarProductos();
      return PRODUCTOS;
    },
    readPhoto: (file) => leerJustificante(file),
    photosMax: () => FOTOS_VISITA_MAX,
    privateConsultation: () => consultaPrivada(),
    normalise: (text2) => clasNorm(text2),
    weekdayLetter: () => hoyLetra(),
    /** The write queue: without connection the call is kept and `data.encolada` is true. */
    writeRpc: (name, payload6) => escribirRpc(name, payload6),
    reloadHome: () => {
      void cargarInicio();
    },
    loading: (element2, text2) => {
      cargando(element2, text2);
    },
    materials: () => PRES_MAT,
    materialsTime: () => PRES_T,
    setMaterials: (list, time) => {
      PRES_MAT = list;
      PRES_T = time;
    },
    /** Downloaded material files by id (Productos forgets one when it is removed). */
    materialFiles: () => PRES_DATOS,
    preferences: () => PERFIL.preferencias ?? {},
    setPreferences: (value10) => {
      PERFIL.preferencias = value10;
    }
  };

  // src/app/screens/visit/card-block.ts
  var WEEK = "LMXJVSD";
  var WORKDAYS = ["L", "M", "X", "J", "V"];
  var DAY_NAMES = /* @__PURE__ */ new Map([
    ["L", "visit.days.monday"],
    ["M", "visit.days.tuesday"],
    ["X", "visit.days.wednesday"],
    ["J", "visit.days.thursday"],
    ["V", "visit.days.friday"],
    ["S", "visit.days.saturday"],
    ["D", "visit.days.sunday"]
  ]);
  function visitConsultation(consultations) {
    const centre = editorLegacy.centreFromCard(), preferred = centre ? visitLegacy.normalise(centre) : "";
    const fromAppointment = preferred ? consultations.find((item) => visitLegacy.normalise(item.centro_nombre ?? "") === preferred) : void 0;
    if (fromAppointment) return fromAppointment;
    const today = visitLegacy.weekdayLetter();
    return consultations.find((item) => item.dias?.[today]) ?? consultations[0];
  }
  var row = (iconName, html, extraClass = "") => `<div class="fvfila ${extraClass}"><span class="fvico">${icon(iconName)}</span><div>${html}</div></div>`;
  function placeRow(consultation) {
    const where = [consultation.planta, consultation.sala].map((part) => String(part ?? "").trim()).filter((part) => part && !/^[-–·.]+$/.test(part)).map(escapeHtml).join(" · ");
    const address = escapeHtml([consultation.direccion, [consultation.cp, consultation.municipio].filter(Boolean).join(" ")].filter(Boolean).join(", ")) || t("visit.block.noAddress");
    const directions = consultation.lat ? `<button class="btn sec fvbtn" type="button" data-nav="${cardBaseLegacy.directionsAttribute([consultation.lat, consultation.lon ?? 0])}">${icon("map-pin")} ${t("visit.block.directions")}</button>` : "";
    return row("building-2", `<b>${escapeHtml(orFallback(consultation.centro_nombre, visitLegacy.privateConsultation()))}</b>${where ? `<span class="fvdonde">${where}</span>` : ""}
      <div class="sm">${address}</div>
      ${directions}`);
  }
  function whenRow(consultation) {
    const days = consultation.dias ?? {}, today = visitLegacy.weekdayLetter(), hours = days[today];
    const position = WEEK.indexOf(today), next = hours ? void 0 : [...WEEK.slice(position + 1), ...WEEK.slice(0, position + 1)].find((day) => days[day]);
    const centre = consultation.horario_centro?.[today];
    const head = hours ? `<b>${t("visit.block.attendsToday", { hours: escapeHtml(hours) })}</b>` : next ? t("visit.block.notToday", { day: t(DAY_NAMES.get(next) ?? "visit.days.monday"), hours: escapeHtml(days[next]) }) : t("visit.block.noTimetable");
    return row("clock", `${head}
      ${centre ? `<div class="sm">${t("visit.block.centreOpen", { hours: escapeHtml(centre) })}</div>` : ""}
      <div class="dias fvdias">${WORKDAYS.map((day) => `<span class="${days[day] ? "on" : ""} ${day === today ? "hoy" : ""}" title="${escapeHtml(days[day] ?? "")}">${day}</span>`).join("")}</div>`);
  }
  function consultationRows(consultation) {
    if (!consultation) return [row("building-2", `<span class="sm">${t("visit.block.noConsultation", { consultation: term("consulta") })}</span>`)];
    const rows = [placeRow(consultation), whenRow(consultation)];
    if (consultation.indicaciones) rows.push(row("info", `<b>${t("visit.block.inside")}</b> ${escapeHtml(consultation.indicaciones)}`, "fvind"));
    return rows;
  }
  function lastVisitRow(last) {
    if (!last) return [];
    const material = cardSectionsLegacy.visitDetails(last);
    return [row("notebook-pen", `<b>${t("visit.block.lastVisit", { visit: term("visita"), date: formatShortDate(last.fecha) })}</b> · ${escapeHtml(orFallback((last.resultados ?? []).join(" + "), t("visit.block.noResult")))}
      ${last.nota ? `<div class="sm">${escapeHtml(last.nota)}</div>` : ""}${material ? `<div class="sm">${t("visit.block.material", { material: escapeHtml(material) })}</div>` : ""}`)];
  }
  function pendingRow(visits2) {
    const pending = visits2.find((visit2) => Boolean(visit2.proxima_accion) || Boolean(visit2.proxima_fecha));
    if (!pending) return [];
    const date = pending.proxima_fecha, today = todayIso();
    const pill = !date ? "" : date < today ? `<span class="pill p-bor">${t("visit.block.late")}</span>` : date === today ? `<span class="pill p-est">${t("visit.block.today")}</span>` : "";
    return [row("clipboard-list", `<b>${t("visit.block.pending")}</b> ${escapeHtml(orFallback(pending.proxima_accion, t("visit.block.visitAgain", { visit: term("visita") })))}${date ? ` · ${formatShortDate(date)}` : ""} ${pill}`)];
  }
  function contactRows(account, consultation) {
    const rows = account.nota ? [row("message-circle", `<b>${t("visit.block.notes")}</b> ${escapeHtml(account.nota)}`)] : [];
    const phones = [account.telefono, consultation?.telefono].filter((phone) => Boolean(phone)).filter((phone, index, all) => all.indexOf(phone) === index);
    if (phones.length || account.contacto) {
      rows.push(row("phone", `${phones.map((phone) => `<a href="tel:${escapeHtml(phone.replace(/\s+/g, ""))}"><b>${escapeHtml(phone)}</b></a>`).join(" · ")}
    ${account.contacto ? `<div class="sm">${escapeHtml(account.contacto)}</div>` : ""}`));
    }
    return rows;
  }
  function visitBlock(account, consultations, visits2) {
    const person = account, consultation = visitConsultation(consultations);
    const urgent = person.urgente ? [row("circle-alert", `<b>${t("visit.block.urgent")}</b>${person.urgente_motivo ? `: ${escapeHtml(person.urgente_motivo)}` : ""}`, "fvurg")] : [];
    const rows = [...urgent, ...consultationRows(consultation), ...lastVisitRow(visits2[0]), ...pendingRow(visits2), ...contactRows(person, consultation)];
    const title2 = t("visit.block.title", { visit: term("visita") });
    return `<section class="fvis" aria-label="${title2}"><h3>${title2}</h3>${rows.join("")}</section>`;
  }

  // src/app/screens/visit/model.ts
  var NEGATIVE = "neg";
  var MODES = [["presencial", "visit.modes.inPerson"], ["telefono", "visit.modes.phone"], ["video", "visit.modes.video"]];
  var modeButtons = (attribute, chosen2) => MODES.map(([mode, label]) => `<button type="button" data-${attribute}="${mode}" class="${mode === chosen2 ? "on" : ""}" aria-pressed="${String(mode === chosen2)}">${t(label)}</button>`).join("");
  var pressed = (button2) => button2.getAttribute("aria-pressed") === "true";
  function togglePressed(button2) {
    const on2 = !pressed(button2);
    button2.setAttribute("aria-pressed", String(on2));
    return on2;
  }

  // src/app/screens/visit/edit.ts
  var value = (id) => document.getElementById(id)?.value ?? "";
  function resultButtons(values, marked, negative) {
    return values.map((result) => `<button type="button" class="opt${negative ? " neg" : ""}" data-res="${escapeHtml(result.valor)}"${negative ? ' data-neg="1"' : ""}
      aria-pressed="${String(marked.includes(result.valor))}"><span class="mk"></span>${escapeHtml(result.valor)}</button>`).join("");
  }
  function extraHtml(extra) {
    const products2 = extra.productList.length ? `<label>${t("visit.record.products")}</label><div class="opciones" id="evprods">${extra.productList.map((product) => `<button type="button" class="opt" data-evprod="${product.id}" aria-pressed="${String(extra.products.includes(product.id))}"><span class="mk"></span>${escapeHtml(product.nombre)}</button>`).join("")}</div>` : "";
    return `<label>${t("visit.record.howItWas")}</label>
      <div class="segs" id="evmodo" role="group" aria-label="${t("visit.record.howItWas")}">${modeButtons("evmodo", extra.mode)}</div>
      ${products2}`;
  }
  function editorHtml(visit2, extra) {
    const results = visitLegacy.resultValues(), marked = visit2.resultados ?? [];
    return `
    <div class="fh"><div><h2>${t("visit.edit.title", { visit: term("visita") })}</h2><div class="sm">${t("visit.edit.recordedOn", { date: formatShortDate(visit2.fecha) })}</div></div>
      <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>
    <div class="g2">
      <div><label for="evf">${t("visit.edit.date")}</label><input id="evf" type="date" value="${escapeHtml(visit2.fecha)}"></div>
      <div><label for="evm">${t("visit.edit.samples")}</label><input id="evm" type="number" min="0" value="${visit2.muestras ?? 0}"></div>
    </div>
    ${extraHtml(extra)}
    <label>${t("visit.edit.result")}</label>
    <div class="opciones">${resultButtons(results.filter((result) => result.extra !== NEGATIVE), marked, false)}</div>
    <div class="opciones" style="margin-top:8px">${resultButtons(results.filter((result) => result.extra === NEGATIVE), marked, true)}</div>
    <div class="g2" style="margin-top:6px">
      <div><label for="evpa">${t("visit.edit.nextAction")}</label><input id="evpa" value="${escapeHtml(visit2.proxima_accion ?? "")}"></div>
      <div><label for="evpf">${t("visit.edit.date")}</label><input id="evpf" type="date" value="${escapeHtml(visit2.proxima_fecha ?? "")}"></div>
    </div>
    <label for="evn">${t("visit.edit.note")}</label><textarea id="evn" rows="3">${escapeHtml(visit2.nota ?? "")}</textarea>
    <div class="acts" style="justify-content:space-between">
      <button class="btn sec dang" id="evborrar">${t("visit.edit.delete", { visit: term("visita") })}</button>
      <span class="acts" style="margin:0"><button class="btn sec" data-cerrar>${t("common.cancel")}</button>
        <button class="btn" id="evok">${t("common.save")}</button></span></div>`;
  }
  async function loadExtra(visitId, planHasCoverage) {
    const { data: activity } = await legacyDb().from("actividades").select("modo,productos").eq("id", visitId).maybeSingle();
    const chosen2 = activity?.productos ?? [];
    let productList = [];
    if (planHasCoverage) {
      productList = [...await visitLegacy.promotedProducts()];
      const missing = chosen2.filter((id) => !productList.some((product) => product.id === id));
      if (missing.length) {
        const { data } = await legacyDb().from("productos").select("id,nombre").in("id", missing);
        productList = productList.concat(data ?? []);
      }
    }
    return { mode: activity?.modo ?? "presencial", products: [...chosen2], productList };
  }
  function afterChange(accountId, message) {
    document.getElementById("dlg")?.close();
    notices.toast(message);
    agendaActions.openAccount(accountId);
    visitLegacy.reloadHome();
  }
  async function save(visit2, extra, accountId, button2) {
    const body2 = document.getElementById("dbody");
    const results = [...body2?.querySelectorAll("[data-res][aria-pressed=true]") ?? []].map((item) => item.dataset.res ?? "");
    button2.disabled = true;
    button2.textContent = t("visit.edit.saving");
    const { data: result, error } = await legacyDb().rpc("actualizar_actividad", { p: {
      id: visit2.id,
      fecha: value("evf"),
      resultados: results,
      muestras: Number(value("evm")) || 0,
      nota: value("evn").trim(),
      proxima_accion: value("evpa").trim(),
      proxima_fecha: value("evpf"),
      modo: extra.mode,
      ...document.getElementById("evprods") ? { productos: extra.products } : {}
    } });
    button2.disabled = false;
    button2.textContent = t("common.save");
    if (error || result?.ok === false) {
      notices.toast(t("visit.edit.couldNotSave"), true);
      return;
    }
    afterChange(accountId, t("visit.edit.saved", { visit: term("visita", { capital: "C", adjective: "actualizado" }) }));
  }
  async function remove(visit2, accountId) {
    const text2 = t("visit.edit.deleteText", { visit: term("visita", { article: "el", articleCapital: "C" }), professional: term("medico", { article: "del" }) });
    if (!await notices.confirm(text2, { titulo: t("visit.edit.deleteTitle", { visit: term("visita", { article: "el" }) }), ok: t("visit.edit.deleteOk"), peligro: true })) return;
    const { data: result, error } = await legacyDb().rpc("borrar_actividad", { p_id: visit2.id });
    if (error || result?.ok === false) {
      notices.toast(t("visit.edit.couldNotDelete"), true);
      return;
    }
    afterChange(accountId, t("visit.edit.deleted", { visit: term("visita", { capital: "C", adjective: "borrado" }) }));
  }
  function bind(body2, visit2, extra, accountId) {
    body2.querySelectorAll("[data-res]").forEach((button2) => {
      button2.onclick = () => {
        const negative = button2.dataset.neg === "1", on2 = pressed(button2);
        body2.querySelectorAll("[data-res]").forEach((other) => {
          if (negative || other.dataset.neg === "1") other.setAttribute("aria-pressed", "false");
        });
        button2.setAttribute("aria-pressed", String(!on2));
      };
    });
    const modes = body2.querySelectorAll("[data-evmodo]");
    modes.forEach((button2) => {
      button2.onclick = () => {
        extra.mode = button2.dataset.evmodo ?? "presencial";
        modes.forEach((other) => {
          other.classList.toggle("on", other === button2);
          other.setAttribute("aria-pressed", String(other === button2));
        });
      };
    });
    body2.querySelectorAll("[data-evprod]").forEach((button2) => {
      button2.onclick = () => {
        togglePressed(button2);
        extra.products = [...body2.querySelectorAll("[data-evprod][aria-pressed=true]")].map((item) => item.dataset.evprod ?? "");
      };
    });
    const ok = document.getElementById("evok");
    if (ok) ok.onclick = () => {
      void save(visit2, extra, accountId, ok);
    };
    const del = document.getElementById("evborrar");
    if (del) del.onclick = () => {
      void remove(visit2, accountId);
    };
  }
  async function editVisit(visit2, accountId) {
    const extra = await loadExtra(visit2.id, accountCardLegacy.planIncludes("cobertura")).catch(() => ({ mode: "presencial", products: [], productList: [] }));
    const body2 = document.getElementById("dbody"), box = document.getElementById("dlg");
    if (!body2 || !box) return;
    body2.innerHTML = editorHtml(visit2, extra);
    bind(body2, visit2, extra, accountId);
    box.showModal();
  }

  // src/app/screens/accounts/card/base.ts
  var WORKDAYS2 = ["L", "M", "X", "J", "V"];
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
    const record2 = cardBaseLegacy.canRecord(), edit = accountCardLegacy.canEditType(account.tipo);
    if (!record2 && !edit) return "";
    return `<div class="acts">
      ${record2 ? `<button class="btn" data-act="visita" data-id="${account.id}">${t("accounts.base.record", { visit: term("visita") })}</button>` : ""}
      ${edit ? `<button class="btn sec" data-act="editar" data-id="${account.id}">${t("accounts.base.edit")}</button>` : ""}
      ${edit ? `<button class="btn ${account.urgente ? "sec" : "warn"}" data-act="urgente" data-id="${account.id}" data-urg="${account.urgente ? 1 : 0}">${t(account.urgente ? "accounts.base.unmarkUrgent" : "accounts.base.markUrgent")}</button>` : ""}
      <button class="btn sec" data-agendar="${account.id}">${t("accounts.base.addToAgenda")}</button>
    </div>`;
  }
  function stateHtml(account, salesReps) {
    const state = cardBaseLegacy.canEdit() ? `<select data-estado="${account.id}" style="max-width:240px">${cardBaseLegacy.states().map((value10) => `<option ${value10 === account.estado_comercial ? "selected" : ""}>${escapeHtml(value10)}</option>`).join("")}</select>` : `<span class="pill p-est">${escapeHtml(account.estado_comercial)}</span>`;
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
      <div class="dias" style="margin-top:8px">${WORKDAYS2.map((day) => `<span class="${days[day] ? "on" : ""}">${day}</span>`).join("")}</div>
      ${WORKDAYS2.filter((day) => days[day]).map((day) => `<div class="sm">${day}: ${escapeHtml(days[day])}</div>`).join("")}
      ${consultation.lat ? `<div class="sm" style="margin-top:6px"><button class="lnk" type="button" data-nav="${cardBaseLegacy.directionsAttribute([consultation.lat, consultation.lon ?? 0])}">${t("accounts.base.directions")}</button></div>` : ""}
    </div>`;
  }
  function visitHtml(visit2, canRecord) {
    const mode = visit2.modo === "telefono" ? t("accounts.base.byPhone") : visit2.modo === "video" ? t("accounts.base.byVideo") : "";
    const results = orFallback((visit2.resultados ?? []).join(" + "), t("accounts.base.noResult"));
    return `<div data-vrow="${visit2.id}" style="padding:7px 0;border-top:1px solid var(--line);display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
        <span><b>${formatShortDate(visit2.fecha)}</b>${mode} · ${escapeHtml(results)}
          ${visit2.muestras ? t("accounts.base.samples", { count: visit2.muestras }) : ""}
          ${visit2.nota ? `<div class="sm">${escapeHtml(visit2.nota)}</div>` : ""}
          ${visit2.proxima_fecha ? `<div class="sm">${t("accounts.base.next", { date: formatShortDate(visit2.proxima_fecha), action: escapeHtml(visit2.proxima_accion ?? "") })}</div>` : ""}</span>
        ${canRecord ? `<button class="btn sec chico" data-editv='${escapeHtml(JSON.stringify(visit2))}'>${t("accounts.base.editVisit")}</button>` : ""}
      </div>`;
  }
  function visitsHtml(visits2) {
    const canRecord = cardBaseLegacy.canRecord();
    const list = visits2.length ? visits2.slice(0, SHOWN_VISITS).map((visit2) => visitHtml(visit2, canRecord)).join("") : `<div class="sm">${t("accounts.base.noVisits", { visits: term("visita", { number: "p", adjective: "registrado" }) })}</div>`;
    return `<div class="blk"><h3>${term("visita", { number: "p", capital: "C" })}</h3>
      ${list}</div>`;
  }
  function cardHtml(data, cached) {
    const account = data.medico, consultations = data.consultas ?? [], visits2 = data.visitas ?? [];
    const forVisit = visitConsultation(consultations);
    return `${cached ? `<div class="cacheaviso">${t("accounts.base.cachedNotice")}</div>` : ""}
    ${headerHtml(account)}
    ${actionsHtml(account)}
    ${visitBlock(account, consultations, visits2)}
    ${stateHtml(account, data.comerciales ?? [])}
    ${consultations.filter((consultation) => consultation !== forVisit).map(consultationHtml).join("")}
    ${visitsHtml(visits2)}
    <div id="fzcampos"></div>
    <section class="blk fventas" id="fventas"><h3>${t("accounts.base.salesTitle", { patients: term("paciente", { number: "p" }) })}</h3><div id="fventasc"></div></section>`;
  }
  async function paintBase(id) {
    const box = body(), card2 = document.getElementById("ficha");
    if (!box || !card2) return;
    accountCardLegacy.setShownId(id);
    box.innerHTML = SKELETON;
    card2.showModal();
    const result = await cachedRpc("ficha_cuenta", { p_id: id }, `ficha-${id}`);
    const data = result.data, account = data?.medico;
    if (!data || !account) {
      box.innerHTML = `<p class="sm">${t("accounts.base.noConnection")}</p>`;
      return;
    }
    box.innerHTML = cardHtml({ ...data, medico: account }, Boolean(result.cache));
    const close4 = document.getElementById("fx");
    if (close4) close4.onclick = () => {
      card2.close();
    };
    box.querySelectorAll("[data-editv]").forEach((button2) => {
      button2.onclick = () => {
        void editVisit(JSON.parse(button2.dataset.editv ?? "{}"), id);
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
  function closeCardAnd(open2) {
    document.getElementById("ficha")?.close();
    open2();
  }
  function onEach(block4, key, action) {
    block4.querySelectorAll(`[data-${key}]`).forEach((button2) => {
      button2.onclick = () => {
        action(button2.getAttribute(`data-${key}`) ?? "");
      };
    });
  }
  async function accountKind(id) {
    const { data } = await legacyDb().from("cuentas").select("tipo, nombre, centro_id, archivado_en").eq("id", id).maybeSingle();
    return data;
  }
  var historyRows = () => [...document.querySelectorAll("#fbody [data-vrow]")];

  // src/app/screens/cycle/model.ts
  var CLASSES = ["A", "B", "C"];
  var cycleState = { owner: "", classFilter: "", classifyFilter: "sin", query: "" };
  var CYCLE_NAMES = /* @__PURE__ */ new Map([
    [1, "cycle.cycleNames.month"],
    [2, "cycle.cycleNames.twoMonths"],
    [3, "cycle.cycleNames.quarter"],
    [4, "cycle.cycleNames.fourMonths"],
    [6, "cycle.cycleNames.half"],
    [12, "cycle.cycleNames.year"]
  ]);
  var cycleName = (months2) => t(CYCLE_NAMES.get(months2) ?? "cycle.cycleNames.other");
  var visitsText = (count2) => `${count2} ${term("visita", { number: count2 === 1 ? "s" : "p" })}`;
  var words = () => ({
    visit: term("visita"),
    visits: term("visita", { number: "p" }),
    Visits: term("visita", { number: "p", capital: "C" }),
    professional: term("medico"),
    professionals: term("medico", { number: "p" }),
    speciality: term("especialidad")
  });
  var classPill = (value10) => value10 ? `<span class="cicl c${value10}">${value10}</span>` : '<span class="cicl csin">—</span>';
  var classButtons = (id, value10) => `<span class="segs cicsegs" role="group" aria-label="${t("cycle.classLabel")}">${CLASSES.map((letter) => `<button type="button" data-ccl="${id}|${letter}" class="${letter === value10 ? "on" : ""}" aria-pressed="${String(letter === value10)}">${letter}</button>`).join("")}</span>`;
  var ownerParam = () => permissions.seesEverything() ? cycleState.owner || null : salesTeam.currentUserId();
  var goToTab = (tab) => {
    cycleLegacy.openTab(tab);
  };
  var rangeText = (range2) => t("cycle.range", { name: capitalise(cycleName(range2.meses)), from: formatShortDate(range2.desde), to: formatShortDate(range2.hasta) });
  async function ownerSelector() {
    if (!permissions.seesEverything()) return "";
    if (!salesTeam.members().length) await salesTeam.load().catch(() => void 0);
    return `<select id="cicde" aria-label="${t("cycle.whose")}"><option value="">${t("cycle.allTeam")}</option>${salesTeam.members().map((member) => `<option value="${member.id}" ${cycleState.owner === member.id ? "selected" : ""}>${escapeHtml(member.nombre)}</option>`).join("")}</select>`;
  }
  function bindOwner(paint8) {
    const select2 = document.getElementById("cicde");
    if (select2) select2.onchange = () => {
      cycleState.owner = select2.value;
      void paint8();
    };
  }
  var percentOf = (done, goal) => goal ? Math.round(done / goal * 100) : 0;
  var progressBar = (percent2, tag = "span") => `<${tag} class="cicbar"><i style="width:${percent2}%"></i></${tag}>`;

  // src/app/screens/cycle/card.ts
  function summary(cycle3) {
    const name = cycleName(cycle3.meses);
    if (!cycle3.clase) return t("cycle.card.unclassified", { visits: visitsText(cycle3.hechas), cycle: name });
    if (!cycle3.objetivo) return t("cycle.card.noGoal", { visits: visitsText(cycle3.hechas), cycle: name, visitsWord: term("visita", { number: "p" }) });
    return t("cycle.card.thisCycle", { done: cycle3.hechas, goal: visitsText(cycle3.objetivo), cycle: name });
  }
  async function paintCardCycle(id) {
    const { data: cycle3 } = await legacyDb().rpc("ciclo_de_cuenta", { p_id: id });
    const box = document.getElementById("fciclo");
    if (!cycle3 || !box || accountCardLegacy.shownId() !== id) return;
    box.innerHTML = `<span class="sm cicfl">${t("cycle.classLabel")}</span>${cardBaseLegacy.canEdit() ? classButtons(id, cycle3.clase) : classPill(cycle3.clase)}
    <span class="sm">${summary(cycle3)}</span>`;
  }

  // src/app/screens/accounts/card/sections-account.ts
  var CENTRE = "Centro";
  var DELETE_LEVEL = 3;
  async function cycle2(id) {
    if (permissions.isProfessionalPortal() || document.getElementById("fciclo") || !stillShown(id)) return;
    const state = [...document.querySelectorAll("#fbody .blk > h3")].find((heading) => heading.textContent?.trim() === t("accounts.card.stateTitle"));
    if (!state?.parentElement) return;
    state.parentElement.insertAdjacentHTML("beforeend", '<div class="fciclo" id="fciclo"></div>');
    await paintCardCycle(id);
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

  // src/app/screens/accounts/card/sections-access.ts
  var CENTRE2 = "Centro";
  var EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  var canShow = (id) => stillShown(id) && Boolean(document.getElementById("fbody")) && !document.getElementById("facceso");
  var accountOf = async (id) => (await cachedRpc("ficha_cuenta", { p_id: id }, `ficha-${id}`)).data?.medico ?? {};
  function hasAccessHtml(user, isCentre2, withConnection) {
    const impersonate = user.activo && accessLegacy.canImpersonate(user) ? `<button class="btn sec" data-ucomo="${user.id}">${t("accounts.access.impersonate")}</button>` : "";
    return `<p class="sm">${t("accounts.access.hasAccess")}${user.email ? t("accounts.access.asEmail", { email: escapeHtml(user.email) }) : ""}${user.activo ? "" : t("accounts.access.disabled")}: ${t(isCentre2 ? "accounts.access.centreUses" : "accounts.access.portalUses")}.</p>` + (withConnection ? `<p class="sm facccon" data-facccon="${user.id}"></p>` : "") + impersonate;
  }
  var canText = (isCentre2) => isCentre2 ? t("accounts.access.centreCan") : t("accounts.access.portalCan", { prescriptions: term("pauta", { number: "p" }), patients: term("paciente", { number: "p" }) });
  async function adminAccess(id) {
    const [{ data: users }, account] = await Promise.all([callRpc("usuarios_resumen", {}), accountOf(id)]);
    if (!canShow(id)) return;
    const user = (users ?? []).find((item) => item.cuenta_id === id), isCentre2 = account.tipo === CENTRE2;
    document.getElementById("fbody")?.insertAdjacentHTML("beforeend", `<div class="blk" id="facceso"><h3>${t("accounts.access.title")}</h3>
    ${user ? hasAccessHtml(user, isCentre2, true) : `<p class="sm">${canText(isCentre2)}</p>
         <button class="btn sec" id="fdaracc">${t("accounts.access.give")}</button>`}</div>`);
    if (user) accessLegacy.connectionInfo(user.id);
    const give = document.getElementById("fdaracc");
    if (give) give.onclick = async () => {
      const { data } = await legacyDb().rpc("ficha_cuenta", { p_id: id });
      const professional = data?.medico;
      if (!professional) return;
      document.getElementById("ficha")?.close();
      accessLegacy.newUser({ medico: { id, nombre: professional.nombre }, nombre: professional.nombre, email: professional.email ?? "", centro: professional.tipo === CENTRE2 });
    };
  }
  var FAILURES = {
    permiso: "accounts.access.noPermission",
    cartera: "accounts.access.notYours",
    ya_tiene: "accounts.access.alreadyHas",
    correo_en_uso: "accounts.access.emailInUse",
    email: "accounts.access.emailWrong",
    sin_rol_portal: "accounts.access.noPortalRole"
  };
  async function linkAccess(id, email) {
    const { data: result, error } = await legacyDb().rpc("dar_acceso_cuenta", { p_cuenta: id, p_email: email });
    if (!error && result?.ok) return true;
    const key = FAILURES[result?.error ?? ""];
    notices.toast(key ? t(key, { professionals: term("medico", { number: "p" }) }) : t("accounts.access.couldNotGive"), true);
    return false;
  }
  async function giveAccess(id, account, button2) {
    const field4 = document.getElementById("faccmail"), email = field4?.value.trim() ?? "";
    if (!EMAIL.test(email)) {
      notices.toast(t("accounts.access.invalidEmail"), true);
      return;
    }
    button2.disabled = true;
    if (!await linkAccess(id, email)) {
      button2.disabled = false;
      return;
    }
    const password = `Tmp-${Math.random().toString(36).slice(2, 8)}`;
    const failure2 = await accessLegacy.signUp(email, password, orFallback(account.nombre, email.split("@").shift() ?? email));
    button2.disabled = false;
    if (failure2) {
      notices.toast(t("accounts.access.couldNotCreate", { error: failure2.message ?? "" }), true);
      return;
    }
    button2.remove();
    if (field4) field4.disabled = true;
    accessLegacy.forgetAccessCache();
    const message = document.getElementById("faccmsg");
    if (message) message.innerHTML = t("accounts.access.created", { password: escapeHtml(password) });
  }
  async function portfolioAccess(id) {
    if (!canShow(id)) return;
    const mine = permissions.seesEverything() ? Promise.resolve({ data: [1] }) : legacyDb().from("atribuciones").select("cuenta_id").eq("cuenta_id", id).eq("usuario_id", salesTeam.currentUserId()).is("hasta", null).limit(1);
    const [{ data: withAccess }, { data: inPortfolio }, account] = await Promise.all([callRpc("cuentas_con_acceso", {}), mine, accountOf(id)]);
    const user = (withAccess ?? []).find((item) => item.cuenta_id === id);
    if (!user && !(inPortfolio ?? []).length || !canShow(id)) return;
    const isCentre2 = account.tipo === CENTRE2;
    document.getElementById("fbody")?.insertAdjacentHTML("beforeend", `<div class="blk" id="facceso"><h3>${t("accounts.access.title")}</h3>
    ${user ? hasAccessHtml(user, isCentre2, false) : `<p class="sm">${canText(isCentre2)}</p>
         <div class="g2"><div><label for="faccmail">${t("accounts.access.email")}</label><input id="faccmail" type="email" value="${escapeHtml(account.email ?? "")}" placeholder="${t("accounts.access.emailPlaceholder")}"></div>
         <div style="align-self:end"><button class="btn sec" id="fdaracc">${t("accounts.access.give")}</button></div></div><div class="sm" id="faccmsg"></div>`}</div>`);
    const give = document.getElementById("fdaracc");
    if (give) give.onclick = () => {
      void giveAccess(id, account, give);
    };
  }
  async function platformAccess(id) {
    if (!cardSectionsLegacy.can("administrar") && cardSectionsLegacy.can("dar_acceso_cuentas")) {
      await portfolioAccess(id);
      return;
    }
    if (!cardSectionsLegacy.can("administrar") || !canShow(id)) return;
    await adminAccess(id);
  }

  // src/app/screens/accounts/card/sections-admin.ts
  var HISTORY_LIMIT = 100;
  var VALUE_LENGTH = 40;
  var EDIT = "Edición";
  function changeLines(entry) {
    const detail = entry.detalle;
    if (entry.accion !== EDIT || !detail || typeof detail !== "object") return `<span class="sm">${escapeHtml(cardSectionsLegacy.detailSummary(detail))}</span>`;
    const value10 = (raw) => escapeHtml(orFallback(cardSectionsLegacy.valueText(raw).slice(0, VALUE_LENGTH), "—"));
    return Object.entries(detail).filter((pair2) => Array.isArray(pair2[1]) && pair2[1].length === 2).map(([field4, [before, after]]) => `<span class="sm">${escapeHtml(cardSectionsLegacy.fieldName(field4))}: ${value10(before)} → ${value10(after)}</span>`).join("");
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
    document.querySelectorAll("#fhist [data-fhx]").forEach((button2) => {
      button2.onclick = () => {
        cardSectionsLegacy.undo(Number(button2.dataset.fhx), () => {
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
    const data = proposal.datos ?? {}, visits2 = data.visitas;
    const sentAt = new Date(proposal.modificado_en).toLocaleString(t("dates.locale"), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    const consultations = (data.consultas ?? []).map((item) => `<div class="fpcon"><b>${escapeHtml(orFallback(item.nombre, term("consulta", { capital: "C" })))}</b> ${item.centro_id || item.ubicacion_id ? "" : `<span class="pill p-per">${t("accounts.proposal.newCentre")}</span>`}
      <span class="sm">${escapeHtml([item.direccion, item.municipio].filter(Boolean).join(" · "))}</span><span class="sm">${timetableText(item.dias)}</span></div>`).join("");
    const visitWay = visits2 && (visits2.como || visits2.momento) ? `<div class="fpdif"><span class="sm">${term("visita", { number: "p", capital: "C" })}</span><span>${escapeHtml([visits2.como, visits2.momento].filter(Boolean).join(" · "))}</span></div>` : "";
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
    const card2 = await cachedRpc("ficha_cuenta", { p_id: id }, `ficha-${id}`), body2 = document.getElementById("fbody");
    if (!body2) return;
    const edit = body2.querySelector("[data-act=editar]");
    const html = proposalHtml(proposal, card2.data?.medico ?? {}, Boolean(edit));
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
    const summary3 = units2.total ? `${t("accounts.base.unitsSummary", { count: formatNumber(units2.pautas), prescriptions: prescriptions(units2.pautas), date: formatShortDate(units2.ultima) })}<span id="fusley">${cardBaseLegacy.unitsLegend(series)}</span>` : t("accounts.base.noPrescriptions", { prescriptions: term("pauta", { number: "p" }) });
    const choices = units2.total ? `<div class="segs" id="fuserie" role="group" aria-label="${t("accounts.base.evolution")}">${cardBaseLegacy.unitsSeries().map(([key, label]) => `<button type="button" data-us="${key}" class="${key === series ? "on" : ""}">${label}</button>`).join("")}</div>` : "";
    return `<div class="blk" id="fundades"><h3>${t("accounts.base.unitsTitle")}</h3>
    <div class="uper">${PERIODS.map(([label, key]) => `<div><b>${formatNumber(units2[key])}</b><span>${t(label)}</span></div>`).join("")}</div>
    ${choices}
    <div class="spark" id="fuspark">${cardBaseLegacy.unitsChart(units2, series)}</div>
    <div class="sm">${summary3}</div></div>`;
  }
  async function units(id) {
    const box = document.getElementById("fbody");
    if (!stillShown(id) || !box || document.getElementById("fundades")) return;
    const { data } = await callRpc("unidades_cuenta", { p_medico: id });
    if (!data || !stillShown(id) || document.getElementById("fundades")) return;
    const html = unitsHtml(data, cardBaseLegacy.unitsSeriesChosen()), sales = document.getElementById("fventasc");
    if (sales) sales.insertAdjacentHTML("afterbegin", html);
    else (box.querySelector(".blk:nth-of-type(2)") ?? box.lastElementChild)?.insertAdjacentHTML("beforebegin", html);
    box.querySelectorAll("#fuserie [data-us]").forEach((button2) => {
      button2.onclick = () => {
        const series = button2.dataset.us ?? "mes";
        cardBaseLegacy.chooseUnitsSeries(series);
        box.querySelectorAll("#fuserie [data-us]").forEach((other) => other.classList.toggle("on", other === button2));
        const chart2 = document.getElementById("fuspark"), legend = document.getElementById("fusley");
        if (chart2) chart2.innerHTML = cardBaseLegacy.unitsChart(data, series);
        if (legend) legend.textContent = cardBaseLegacy.unitsLegend(series);
      };
    });
  }

  // src/app/screens/accounts/card/sections-history.ts
  async function visitPhotos(id) {
    const rows = historyRows();
    if (!rows.length) return;
    const { data } = await legacyDb().from("actividad_fotos").select("actividad_id").in("actividad_id", rows.map((row4) => row4.dataset.vrow));
    const counts = /* @__PURE__ */ new Map();
    (data ?? []).forEach((photo) => {
      counts.set(photo.actividad_id, (counts.get(photo.actividad_id) ?? 0) + 1);
    });
    rows.forEach((row4) => {
      if (row4.querySelector("[data-vfotos]")) return;
      const count2 = counts.get(row4.dataset.vrow ?? "") ?? 0, place = row4.querySelector("span");
      if (!place || !count2 && !row4.querySelector("[data-editv]")) return;
      const label = count2 ? count2 === 1 ? t("accounts.card.photo") : t("accounts.card.photos", { count: count2 }) : t("accounts.card.addPhotos");
      place.insertAdjacentHTML("beforeend", `<div><button type="button" class="lnk vfotoslnk" data-vfotos="${row4.dataset.vrow ?? ""}">${icon("camera")} ${label}</button></div>`);
    });
    document.querySelectorAll("#fbody [data-vfotos]").forEach((button2) => {
      button2.onclick = () => {
        relatedLegacy.openVisitPhotos(button2.dataset.vfotos ?? "", id);
      };
    });
  }
  async function presentedProducts(id) {
    const rows = historyRows();
    if (!rows.length || document.querySelector("#fbody .vprodtx")) return;
    const { data } = await legacyDb().from("actividades").select("id,productos").in("id", rows.map((row4) => row4.dataset.vrow));
    const ids = [...new Set((data ?? []).flatMap((visit2) => visit2.productos ?? []))];
    if (!ids.length || !stillShown(id)) return;
    const { data: products2 } = await legacyDb().from("productos").select("id,nombre").in("id", ids);
    const names = new Map((products2 ?? []).map((product) => [product.id, product.nombre]));
    (data ?? []).forEach((visit2) => {
      const row4 = document.querySelector(`#fbody [data-vrow="${visit2.id}"]`), place = row4?.querySelector("span");
      const presented = (visit2.productos ?? []).map((product) => names.get(product)).filter((name) => Boolean(name));
      if (place && presented.length && !row4?.querySelector(".vprodtx")) place.insertAdjacentHTML("beforeend", `<div class="sm vprodtx">${t("accounts.card.presented", { list: presented.map(escapeHtml).join(", ") })}</div>`);
    });
  }
  function visitMaterial(id) {
    if (!stillShown(id)) return Promise.resolve();
    document.querySelectorAll("#fbody [data-editv]").forEach((button2) => {
      let visit2;
      try {
        visit2 = JSON.parse(button2.dataset.editv ?? "");
      } catch {
        return;
      }
      const text2 = cardSectionsLegacy.visitDetails(visit2);
      if (!text2) return;
      const place = button2.parentElement?.querySelector(":scope > span");
      if (place && !place.querySelector(".vdet")) place.insertAdjacentHTML("beforeend", `<div class="sm vdet">📎 ${escapeHtml(text2)}</div>`);
    });
    return Promise.resolve();
  }

  // src/app/screens/equipment/model.ts
  var STATES = { installed: "Instalado", retired: "Retirado" };
  var SALE = "Venta";
  var REVIEW_TYPES = ["Preventiva", "Correctiva", "Instalación"];
  var DAY_MS = 864e5;
  var SOON_DAYS = 30;
  var expiryOf = (item) => item.contrato !== SALE ? item.contrato_fin : item.garantia_hasta;
  var daysUntil = (isoDate) => isoDate ? Math.round((fromIsoDate(isoDate).getTime() - fromIsoDate(todayIso()).getTime()) / DAY_MS) : null;
  var warningLimit = () => Math.max(...equipmentLegacy.warningDays(), 0);
  function reviewPill(item) {
    if (item.estado === STATES.retired) return `<span class="pill p-anu">${t("equipment.pills.retired")}</span>`;
    const days = daysUntil(item.proxima_revision), date = formatShortDate(item.proxima_revision ?? "");
    if (days === null) return "";
    if (days < 0) return `<span class="pill p-urg">${t("equipment.pills.reviewPast", { date })}</span>`;
    return days <= SOON_DAYS ? `<span class="pill p-warn">${t("equipment.pills.reviewOn", { date })}</span>` : `<span class="pill p-per">${t("equipment.pills.nextReview", { date })}</span>`;
  }
  function expiresText(what, days) {
    if (days === 0) return t("equipment.pills.expiresToday", { what });
    return days === 1 ? t("equipment.pills.expiresInOneDay", { what }) : t("equipment.pills.expiresInDays", { what, count: formatNumber(days) });
  }
  function expiryPill(item) {
    const days = daysUntil(expiryOf(item));
    if (days === null || item.estado === STATES.retired) return "";
    const what = t(item.contrato !== SALE ? "equipment.pills.contract" : "equipment.pills.warranty");
    if (days < 0) return `<span class="pill p-anu">${t("equipment.pills.expired", { what })}</span>`;
    return days <= warningLimit() ? `<span class="pill p-urg">${expiresText(what, days)}</span>` : "";
  }
  var failureText = (error) => {
    const message = error?.message ?? "";
    return /row-level|policy/i.test(message) ? t("equipment.noPermission") : t("equipment.couldNotSave", { error: message });
  };

  // src/app/screens/surgeries/model.ts
  var STATES2 = { scheduled: "Programada", done: "Hecha", cancelled: "Anulada" };
  var ORIGINS = ["deposito", "personal"];
  var originLabel = (origin) => ORIGINS.includes(origin) ? t(`surgeries.origins.${origin}`) : "";
  var timeOf = (surgery) => surgery.hora ? String(surgery.hora).slice(0, 5) : "";
  function statePill(surgery) {
    const kind = surgery.estado === STATES2.done ? "p-est" : surgery.estado === STATES2.cancelled ? "p-anu" : "p-per";
    return `<span class="pill ${kind}">${escapeHtml(surgery.estado)}</span>`;
  }
  function replenishmentPill(surgery) {
    if (surgery.reposicion === "vencida") return `<span class="pill p-urg">${t("surgeries.pills.overdue")}</span>`;
    if (surgery.reposicion === "repuesta") return `<span class="pill p-est">${t("surgeries.pills.replenished")}</span>`;
    if (surgery.reposicion !== "pendiente") return "";
    const deadline = new Date(surgery.reposicion_limite ?? "").toLocaleString(t("dates.locale"), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    return `<span class="pill p-warn">${t("surgeries.pills.replenishBefore", { date: escapeHtml(deadline) })}</span>`;
  }
  var ERRORS = /* @__PURE__ */ new Map([
    ["permiso", "surgeries.errors.permission"],
    ["faltan", "surgeries.errors.missing"],
    ["hospital", "surgeries.errors.centre"],
    ["sin_deposito", "surgeries.errors.noDeposit"],
    ["sin_almacen", "surgeries.errors.noStore"],
    ["hecha", "surgeries.errors.done"],
    ["sin_stock", "surgeries.errors.noStock"],
    ["series", "surgeries.errors.serials"],
    ["linea", "surgeries.errors.line"],
    ["vacio", "surgeries.errors.empty"],
    ["anulada", "surgeries.errors.cancelled"],
    ["no_hecha", "surgeries.errors.notDone"],
    ["sin_origen", "surgeries.errors.noSource"],
    ["cirujano", "surgeries.errors.responsible"],
    ["asistente", "surgeries.errors.assistant"],
    ["valores", "surgeries.errors.values"]
  ]);
  var errorText = (result) => t(ERRORS.get(result?.error ?? "") ?? "surgeries.errors.generic");

  // src/app/screens/tenders/model.ts
  var STATES3 = { studying: "En estudio", offerSent: "Oferta enviada", awarded: "Adjudicado", lost: "Perdido", void: "Desierto" };
  var TENDER_STATES = [STATES3.studying, STATES3.offerSent, STATES3.awarded, STATES3.lost, STATES3.void];
  var LOT_STATES = { pending: "Pendiente", won: "Ganado", lost: "Perdido" };
  var LOT_STATE_LIST = [LOT_STATES.pending, LOT_STATES.won, LOT_STATES.lost];
  var DAY_MS2 = 864e5;
  var isClosed = (state) => state === STATES3.lost || state === STATES3.void;
  function statePill2(state) {
    const kind = state === STATES3.awarded ? "p-est" : isClosed(state) ? "p-anu" : state === STATES3.offerSent ? "p-per" : "p-warn";
    return `<span class="pill ${kind}">${escapeHtml(state)}</span>`;
  }
  var contractEnd = (tender) => [tender.prorroga_hasta, tender.fin].find(Boolean) ?? null;
  function daysLeft(tender) {
    const end = contractEnd(tender);
    return end ? Math.round(((/* @__PURE__ */ new Date(`${end}T12:00:00`)).getTime() - (/* @__PURE__ */ new Date(`${todayIso()}T12:00:00`)).getTime()) / DAY_MS2) : null;
  }
  var tenderLine = (tender) => [tender.cuentas?.nombre, tender.organismo, tender.expediente ? t("tenders.file", { number: tender.expediente }) : ""].filter(Boolean).join(" · ");
  var writeFailure = (error, noPermission) => /row-level|policy/i.test(error.message ?? "") ? noPermission : t("tenders.sheet.couldNotSave", { error: error.message ?? "" });

  // src/app/screens/accounts/card/sections-related.ts
  var ATTENDED = "Asistió";
  var NOT_ATTENDED = "No asistió";
  var AWARDED = "Adjudicado";
  var INSTALLED = "Instalado";
  var CENTRE3 = "Centro";
  var OPEN_TENDERS = ["En estudio", "Oferta enviada", AWARDED];
  var SHOWN_EVENTS = 5;
  var canAdd = (blockId, section2) => Boolean(fieldsPlace()) && !document.getElementById(blockId) && (!section2 || accountCardLegacy.planIncludes(section2));
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
  async function events2(id) {
    if (!canAdd("feventos", "eventos")) return;
    const { data } = await legacyDb().from("eventos_asistentes").select("estado,eventos(id,titulo,fecha)").eq("cuenta_id", id).limit(30);
    const list = (data ?? []).filter((item) => item.eventos !== null).sort((first, second) => String(second.eventos.fecha).localeCompare(String(first.eventos.fecha))).slice(0, SHOWN_EVENTS);
    if (!list.length) return;
    const pillClass = (state) => state === ATTENDED ? "p-est" : state === NOT_ATTENDED ? "p-anu" : "p-per";
    const block4 = addBeforeFields(id, "feventos", `<div class="blk" id="feventos"><h3>${t("accounts.card.eventsTitle")}</h3>
      ${list.map((item) => `<div class="fmrow"><span><button type="button" class="lnk" data-fev="${item.eventos.id}">${escapeHtml(item.eventos.titulo)}</button><span class="sm"> · ${formatShortDate(item.eventos.fecha)}</span></span><span class="pill ${pillClass(item.estado)}">${escapeHtml(item.estado)}</span></div>`).join("")}</div>`);
    if (block4) onEach(block4, "fev", (event) => {
      closeCardAnd(() => {
        relatedLegacy.openEvent(event);
      });
    });
  }
  function depositText(state) {
    const lines = (state.lineas ?? []).filter((line2) => line2.unidades > 0), total = sum(lines.map((line2) => line2.unidades));
    if (!state.existe || !total) return t("accounts.card.depositNone");
    const productCount = new Set(lines.map((line2) => line2.producto_id)).size, expiring = lines.filter((line2) => relatedLegacy.expiresSoon(line2.caducidad)).length;
    const products2 = productCount === 1 ? t("accounts.card.oneProduct") : t("accounts.card.products", { count: productCount });
    const soon = expiring ? ` · <b style="color:var(--warn)">${expiring === 1 ? t("accounts.card.oneBatchExpires") : t("accounts.card.batchesExpire", { count: expiring })}${t("accounts.card.inLessThan60Days")}</b>` : "";
    return t("accounts.card.depositUnits", { units: formatNumber(total), products: products2 }) + soon;
  }
  async function deposit(id) {
    if (!canAdd("fdeposito", "deposito")) return;
    const account = await accountKind(id);
    if (account?.tipo !== CENTRE3) return;
    const { data: state } = await legacyDb().rpc("deposito_estado", { p_cuenta: id });
    if (!state || state.ok === false || !canAdd("fdeposito") || !stillShown(id)) return;
    addBeforeFields(id, "fdeposito", `<div class="blk" id="fdeposito"><h3>${t("accounts.card.depositTitle")}</h3>
      <p class="sm">${depositText(state)}</p>
      <button type="button" class="btn sec" id="fdepabrir">${t(state.existe ? "accounts.card.depositOpen" : "accounts.card.depositLeave")}</button></div>`);
    const open2 = document.getElementById("fdepabrir");
    if (open2) open2.onclick = () => {
      closeCardAnd(() => {
        relatedLegacy.openDeposit(id, account.nombre ?? "");
      });
    };
  }
  async function surgeries2(id) {
    if (permissions.isProfessionalPortal() || !canAdd("fcirugias", "cirugias")) return;
    const { data } = await legacyDb().from("cirugias").select("id,fecha,procedimiento,estado").or(`cirujano_id.eq.${id},hospital_id.eq.${id}`).order("fecha", { ascending: false }).limit(5);
    if (!(data ?? []).length) return;
    const block4 = addBeforeFields(id, "fcirugias", `<div class="blk" id="fcirugias"><h3>${t("accounts.card.surgeriesTitle")}</h3>
      ${(data ?? []).map((item) => `<div class="fmrow"><span><button type="button" class="lnk" data-fcir="${item.id}">${escapeHtml(orFallback(item.procedimiento, t("accounts.card.surgery")))}</button><span class="sm"> · ${formatShortDate(item.fecha)}</span></span>${statePill(item)}</div>`).join("")}</div>`);
    if (block4) onEach(block4, "fcir", (surgery) => {
      closeCardAnd(() => {
        relatedLegacy.openSurgery(surgery);
      });
    });
  }
  function tenderEnd(tender) {
    const left = daysLeft(tender);
    if (tender.estado !== AWARDED || left === null) return "";
    return ` · ${left < 0 ? t("accounts.card.tenderExpired") : t("accounts.card.tenderExpiresOn", { date: formatShortDate(contractEnd(tender) ?? "") })}`;
  }
  async function tenders2(id) {
    if (permissions.isProfessionalPortal() || !canAdd("fconcursos", "concursos")) return;
    const { data } = await legacyDb().from("concursos").select("id,titulo,estado,fin,prorroga_hasta").eq("cuenta_id", id).in("estado", OPEN_TENDERS).order("creado_en", { ascending: false }).limit(6);
    if (!(data ?? []).length) return;
    const block4 = addBeforeFields(id, "fconcursos", `<div class="blk" id="fconcursos"><h3>${t("accounts.card.tendersTitle")}</h3>
      ${(data ?? []).map((item) => `<div class="fmrow"><span><button type="button" class="lnk" data-fcon="${item.id}">${escapeHtml(item.titulo)}</button>${tenderEnd(item) ? `<span class="sm">${tenderEnd(item)}</span>` : ""}</span>${statePill2(item.estado)}</div>`).join("")}</div>`);
    if (block4) onEach(block4, "fcon", (tender) => {
      closeCardAnd(() => {
        relatedLegacy.openTender(tender);
      });
    });
  }
  function equipmentRow(item) {
    const details2 = (item.serie ? t("accounts.card.serial", { serial: escapeHtml(item.serie) }) : "") + (item.ubicacion ? ` · ${escapeHtml(item.ubicacion)}` : "");
    return `<div class="fmrow"><span><button type="button" class="lnk" data-feq="${item.id}">${escapeHtml(orFallback(item.productos?.nombre, t("accounts.card.equipment")))}</button><span class="sm">${details2}</span></span>${reviewPill(item)}</div>`;
  }
  async function equipment2(id) {
    if (permissions.isProfessionalPortal() || !canAdd("fequipos", "parque")) return;
    const { data } = await legacyDb().from("equipos").select("id,serie,ubicacion,estado,contrato,contrato_fin,garantia_hasta,proxima_revision,productos(nombre)").eq("cuenta_id", id).eq("estado", INSTALLED).order("instalado", { ascending: false }).limit(20);
    if (!canAdd("fequipos") || !stillShown(id)) return;
    const list = data ?? [], account = await accountKind(id);
    if (!list.length && account?.tipo !== CENTRE3) return;
    const block4 = addBeforeFields(id, "fequipos", equipmentHtml(list));
    if (block4) bindEquipment(block4, id, account?.nombre ?? "");
  }
  function equipmentHtml(list) {
    return `<div class="blk" id="fequipos"><h3>${t("accounts.card.equipmentTitle")}${list.length ? ` <span class="n">${list.length}</span>` : ""}</h3>
      ${list.map(equipmentRow).join("") || `<p class="sm">${t("accounts.card.equipmentNone")}</p>`}
      <button type="button" class="btn sec" id="feqmas">${t("accounts.card.addEquipment")}</button></div>`;
  }
  function bindEquipment(block4, id, name) {
    onEach(block4, "feq", (item) => {
      closeCardAnd(() => {
        relatedLegacy.openEquipment(item);
      });
    });
    const add2 = document.getElementById("feqmas");
    if (add2) add2.onclick = () => {
      closeCardAnd(() => {
        relatedLegacy.newEquipment({ id, nombre: name });
      });
    };
  }

  // src/app/screens/accounts/card/sections-portal.ts
  var PENDING = "Pendiente";
  var DELIVERED = "Entregado";
  var CENTRE4 = "Centro";
  var ACTIVE = "Activo";
  var SERVICE = "servicio";
  var SHOWN_REQUESTS = 10;
  var MESSAGES_LIMIT = 200;
  var canShow2 = (id, blockId) => !permissions.isProfessionalPortal() && portalLegacy.hasPortal() && stillShown(id) && Boolean(document.getElementById("fbody")) && !document.getElementById(blockId);
  var shortDateTime = (value10) => new Date(value10).toLocaleString(t("dates.locale"), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  function requestRow(request) {
    return `<div class="item" style="cursor:default"><span class="tx"><b>${formatNumber(request.cantidad)} × ${escapeHtml(request.material)}</b>
        <span class="sm">${t("accounts.portal.requested", { date: shortDateTime(request.creado_en) })}${request.nota ? ` · ${escapeHtml(request.nota)}` : ""}</span></span>${portalLegacy.materialPill(request.estado)}
        ${request.estado === PENDING ? `<button type="button" class="btn chico" data-fpent="${request.id}">${t("accounts.portal.delivered")}</button>` : ""}</div>`;
  }
  function portalHtml(requests2, messages) {
    const pending = requests2.filter((request) => request.estado === PENDING).length, unread = messages.filter((message) => message.del_portal && !message.leido_en).length;
    return `<section class="blk" id="fportal"><h3>${t("accounts.portal.title")}${pending ? ` <span class="pill p-warn">${t("accounts.portal.toDeliver", { count: formatNumber(pending) })}</span>` : ""}${unread ? ` <span class="pill p-urg">${t("accounts.portal.unread", { count: formatNumber(unread) })}</span>` : ""}</h3>
    ${requests2.length ? `<div class="lista">${requests2.map(requestRow).join("")}</div>` : ""}
    <div class="fpmsg"><b class="sm">${t("accounts.portal.messages")}</b><div id="fphilo">${portalLegacy.messageThread(messages)}</div>
      <div class="fpresp"><input id="fpmsgt" placeholder="${t("accounts.portal.reply")}" aria-label="${t("accounts.portal.reply")}"><button type="button" class="btn sec" id="fpmsgok">${t("accounts.portal.send")}</button></div></div></section>`;
  }
  function refreshPortal(id) {
    document.getElementById("fportal")?.remove();
    void portalActivity(id);
  }
  function bindPortal(id) {
    document.querySelectorAll("#fportal [data-fpent]").forEach((button2) => {
      button2.onclick = async () => {
        const { data: result } = await legacyDb().rpc("cerrar_material", { p_id: button2.dataset.fpent, p_estado: DELIVERED });
        if (!result?.ok) {
          notices.toast(portalLegacy.failureText(result), true);
          return;
        }
        notices.toast(t("accounts.portal.deliveredDone"));
        refreshPortal(id);
      };
    });
    const send = document.getElementById("fpmsgok");
    if (send) send.onclick = async () => {
      const text2 = document.getElementById("fpmsgt")?.value.trim() ?? "";
      if (!text2) {
        notices.toast(t("accounts.portal.writeMessage"), true);
        return;
      }
      send.disabled = true;
      const { data: result } = await legacyDb().rpc("enviar_mensaje_cuenta", { p_cuenta: id, p_texto: text2 });
      send.disabled = false;
      if (!result?.ok) {
        notices.toast(portalLegacy.failureText(result), true);
        return;
      }
      notices.toast(t("accounts.portal.sent"));
      refreshPortal(id);
    };
  }
  async function loadPortal(id) {
    const db2 = legacyDb();
    const [{ data: requests2 }, { data: messages }, { data: users }] = await Promise.all([
      db2.from("solicitudes_material").select("id,material,cantidad,nota,estado,creado_en,cerrado_en").eq("cuenta_id", id).order("creado_en", { ascending: false }).limit(SHOWN_REQUESTS),
      db2.from("mensajes_cuenta").select("id,texto,del_portal,creado_en,leido_en").eq("cuenta_id", id).order("creado_en", { ascending: true }).limit(MESSAGES_LIMIT),
      db2.from("perfiles").select("id").eq("cuenta_id", id).eq("activo", true).limit(1)
    ]);
    return { requests: requests2 ?? [], messages: messages ?? [], hasUser: Boolean(users?.length) };
  }
  async function portalActivity(id) {
    if (!canShow2(id, "fportal")) return;
    const { requests: requestList, messages: messageList, hasUser } = await loadPortal(id);
    const body2 = document.getElementById("fbody");
    if (!stillShown(id) || !body2 || document.getElementById("fportal")) return;
    if (!requestList.length && !messageList.length && !hasUser) return;
    const html = portalHtml(requestList, messageList), visit2 = body2.querySelector("section.fvis");
    if (visit2) visit2.insertAdjacentHTML("afterend", html);
    else body2.insertAdjacentHTML("beforeend", html);
    bindPortal(id);
    if (messageList.some((message) => message.del_portal && !message.leido_en)) void callRpc("leer_mensajes_cuenta", { p_cuenta: id });
  }
  function productRow(product, chosen2) {
    const own = chosen2.get(product.id), name = escapeHtml(product.nombre);
    const tariff = product.precio !== null && product.precio !== void 0 ? portalLegacy.euros(product.precio) : "—";
    return `<label class="item" style="cursor:default"><input type="checkbox" data-fpcp="${product.id}" ${own ? "checked" : ""}>
        <span class="tx"><b>${name}</b><span class="sm">${t("accounts.portal.tariff", { price: tariff })}</span></span>
        <input type="number" min="0" step="0.01" data-fpcx="${product.id}" value="${own?.precio !== null && own?.precio !== void 0 ? Number(own.precio) : ""}" placeholder="${t("accounts.portal.tariffPlaceholder")}" style="max-width:120px" aria-label="${t("accounts.portal.priceFor", { name })}"></label>`;
  }
  async function saveProducts(id, button2) {
    const block4 = document.getElementById("fprodc");
    if (!block4) return;
    const items = [...block4.querySelectorAll("[data-fpcp]")].filter((box) => box.checked).map((box) => {
      const value10 = block4.querySelector(`[data-fpcx="${box.dataset.fpcp ?? ""}"]`)?.value ?? "";
      return { producto_id: box.dataset.fpcp, precio: value10 === "" ? null : Math.max(0, Number(value10)) };
    });
    button2.disabled = true;
    const { data: result } = await legacyDb().rpc("guardar_productos_cuenta", { p_cuenta: id, p_items: items });
    button2.disabled = false;
    if (!result?.ok) {
      notices.toast(portalLegacy.failureText(result), true);
      return;
    }
    notices.toast(t("accounts.portal.productsSaved", { count: formatNumber(result.productos ?? 0) }));
    document.getElementById("fprodc")?.remove();
    void centreProducts(id);
  }
  function productsHtml(catalog2, chosenRows) {
    const chosen2 = new Map(chosenRows.map((row4) => [row4.producto_id, row4]));
    const list = catalog2.filter((product) => product.tipo !== SERVICE && (product.estado ?? ACTIVE) === ACTIVE);
    return `<section class="blk" id="fprodc"><h3>${t("accounts.portal.productsTitle")} <span class="n">${formatNumber(chosenRows.length)}</span></h3>
    <p class="sm">${t("accounts.portal.productsNote")}</p>
    <div class="lista">${list.map((product) => productRow(product, chosen2)).join("") || `<div class="sm">${t("accounts.portal.noProducts")}</div>`}</div>
    <div class="acts" style="margin:8px 0 0;justify-content:flex-end"><button type="button" class="btn sec" id="fpcok">${t("accounts.portal.saveProducts")}</button></div></section>`;
  }
  var isCentre = async (id) => (await cachedRpc("ficha_cuenta", { p_id: id }, `ficha-${id}`)).data?.medico?.tipo === CENTRE4;
  async function centreProducts(id) {
    if (!canShow2(id, "fprodc") || !await isCentre(id) || !canShow2(id, "fprodc")) return;
    const catalog2 = await portalLegacy.products();
    const { data: chosenRows } = await legacyDb().from("productos_cuenta").select("producto_id,precio").eq("cuenta_id", id);
    const body2 = document.getElementById("fbody");
    if (!body2 || !canShow2(id, "fprodc")) return;
    const html = productsHtml(catalog2, chosenRows ?? []);
    const after = document.getElementById("fportal") ?? body2.querySelector("section.fvis");
    if (after) after.insertAdjacentHTML("afterend", html);
    else body2.insertAdjacentHTML("beforeend", html);
    const save13 = document.getElementById("fpcok");
    if (save13) save13.onclick = () => {
      void saveProducts(id, save13);
    };
  }

  // src/app/screens/accounts/card/sections-sales.ts
  var SHOWN_PATIENTS = 5;
  async function fillSalesReps(id) {
    const [{ data: users }, { data: current }] = await Promise.all([legacyDb().rpc("usuarios_lista"), callRpc("responsable_de_cuenta", { p_medico: id })]);
    const select2 = document.getElementById("fcomsel");
    if (!stillShown(id) || !select2) return;
    const options = (users ?? []).filter((user) => user.activo && (cardSectionsLegacy.roleCan(user.rol, "cartera") || current?.id === user.id)).map((user) => `<option value="${user.id}" ${current?.id === user.id ? "selected" : ""}>${escapeHtml(user.nombre)} · ${escapeHtml(user.rol)}</option>`).join("");
    select2.innerHTML = `<option value="">${t("accounts.sales.noRep")}</option>${options}`;
    const save13 = document.getElementById("fcomok");
    if (save13) save13.onclick = async () => {
      save13.disabled = true;
      const { data: result, error } = await legacyDb().rpc("asignar_responsable_cuenta", { p_medico: id, p_usuario: select2.value || null });
      save13.disabled = false;
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
    const rows = data.filas.map((row4) => `<button class="item" data-fmpac="${row4.id}"><span class="tx"><b>${escapeHtml(row4.nombre)}</b>
        <span class="sm">${t("accounts.sales.patientLine", { units: formatNumber(row4.unidades), orders: formatNumber(row4.pedidos) })}${row4.ultimo_pedido ? t("accounts.sales.lastOrder", { date: formatShortDate(row4.ultimo_pedido) }) : ""}</span></span></button>`).join("");
    (document.getElementById("fventasc") ?? document.getElementById("fbody"))?.insertAdjacentHTML("beforeend", `<div class="blk"><h3>${term("paciente", { number: "p", capital: "C" })}<span class="n" style="margin-left:6px">${formatNumber(data.total)}</span></h3>
      ${rows}
      ${data.total > SHOWN_PATIENTS ? `<button class="verlo" id="fmpactodos" style="border-radius:8px;margin-top:6px">${t("accounts.sales.seeAll", { count: formatNumber(data.total), patients: plural2 })}</button>` : ""}</div>`);
    document.querySelectorAll("#fbody [data-fmpac]").forEach((button2) => {
      button2.onclick = () => {
        cardSectionsLegacy.openPatient(button2.dataset.fmpac ?? "");
      };
    });
    const all = document.getElementById("fmpactodos");
    if (all) all.onclick = () => {
      const urgent = t("accounts.base.urgent"), title2 = document.querySelector("#fbody .fh h2")?.textContent ?? "";
      const name = title2.startsWith(urgent) ? title2.slice(urgent.length).trimStart() : title2;
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
    const block4 = `<div class="blk" id="fclientes"><h3>${t("accounts.sales.associatedTitle", { patients: term("paciente", { number: "p", capital: "C" }) })}</h3>
    <div class="uper">${figures.map(([label, value10]) => `<div><b>${formatNumber(value10)}</b><span>${label}</span></div>`).join("")}</div>
    ${data.total ? "" : `<div class="sm">${t("accounts.sales.noneAssociated", { patients: term("paciente", { number: "p" }) })}</div>`}</div>`;
    const units2 = document.getElementById("fundades");
    if (units2) units2.insertAdjacentHTML("afterend", block4);
    else sales.insertAdjacentHTML("afterbegin", block4);
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
  var ACCESS = { name: "platformAccess", run: platformAccess };
  var CUSTOM_FIELDS = {
    name: "customFields",
    wait: false,
    run: (id) => accountCardLegacy.customFields(id, document.getElementById("fzcampos") ?? document.querySelector("#ficha .fbody, #ficha #fbody") ?? document.getElementById("ficha")?.firstElementChild ?? null)
  };
  var SECTIONS = [
    { name: "changeHistory", run: changeHistory, wait: false },
    { name: "portalActivity", run: portalActivity, wait: false },
    { name: "centreProducts", run: centreProducts, wait: false },
    { name: "visitPhotos", run: visitPhotos },
    { name: "samples", run: samples },
    { name: "events", run: events2 },
    { name: "deposit", run: deposit },
    { name: "cycle", run: cycle2 },
    { name: "presentedProducts", run: presentedProducts },
    { name: "surgeries", run: surgeries2 },
    { name: "tenders", run: tenders2 },
    { name: "equipment", run: equipment2 },
    { name: "portalProposal", run: portalProposal },
    { name: "centreProfessionals", run: centreProfessionals },
    { name: "archiveButtons", run: archiveButtons }
  ];
  async function runSection(section2, id) {
    try {
      await section2.run(id);
    } catch (error) {
      console.error(`ficha · ${section2.name}`, error);
    }
  }
  async function paintBase2(id) {
    const card2 = document.getElementById("ficha");
    card2?.classList.add("cargando");
    const limit = setTimeout(() => card2?.classList.remove("cargando"), LOADING_LIMIT_MS);
    try {
      accountCardLegacy.forgetPatients();
      for (const section2 of BASE) await section2.run(id);
      if (document.getElementById("fventas") && !document.getElementById("fventasc")?.children.length) document.getElementById("fventas")?.remove();
    } finally {
      clearTimeout(limit);
      requestAnimationFrame(() => card2?.classList.remove("cargando"));
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
    for (const section2 of SECTIONS) {
      if (section2.wait === false) void runSection(section2, id);
      else await runSection(section2, id);
    }
  }

  // src/app/screens/accounts/list/cells.ts
  var WORKDAYS3 = ["L", "M", "X", "J", "V"];
  var CUSTOM_PREFIX = "cp:";
  function nameCell(row4) {
    const urgent = row4.urgente ? `<span class="pill p-urg">${t("accounts.list.urgent")}</span> ` : "";
    const noReporting = row4.sin_reporting ? `<span class="pill p-sr" title="${t("accounts.columns.noReportingTitle", { visit: term("visita") })}">${t("accounts.columns.noReporting")}</span> ` : "";
    return `<span class="nm">${urgent}${noReporting}${escapeHtml(row4.nombre)}</span>`;
  }
  var daysCell = (row4) => `<span class="dias">${WORKDAYS3.map((day) => `<span class="${row4.dias?.[day] ? "on" : ""}" title="${escapeHtml(row4.dias?.[day] ?? "")}">${day}</span>`).join("")}</span>`;
  function salesRepsCell(row4) {
    const reps = row4.comerciales ?? [];
    return `<span class="comchips">${reps.length ? reps.map((rep) => `<span>${escapeHtml(accountColumnsLegacy.firstName(rep.nombre))}</span>`).join("") : `<span class="sin">${t("accounts.columns.unassigned")}</span>`}</span>`;
  }
  function accessCell(row4, onAccessLoaded) {
    const access = accountColumnsLegacy.accessOf();
    if (!access) {
      void accountColumnsLegacy.loadAccess().then(() => {
        if (currentScreen() === "directorio") onAccessLoaded();
      });
      return "";
    }
    const own = access[row4.id];
    if (!own) return `<span class="sm">${t("accounts.columns.noAccess")}</span>`;
    return `<span class="pill ${own.activo ? "p-est" : "p-anu"}">${t(own.activo ? "accounts.columns.withAccess" : "accounts.columns.accessDisabled")}</span>`;
  }
  function customCell(row4, key) {
    const field4 = accountColumnsLegacy.customFields().find((item) => item.clave === key);
    return `<span class="sm">${escapeHtml(accountColumnsLegacy.fieldText(field4, row4.clasificadores?.[key]))}</span>`;
  }
  var CELLS = /* @__PURE__ */ new Map([
    ["nombre", nameCell],
    ["dias", daysCell],
    ["estado_comercial", (row4) => `<span class="pill p-est">${escapeHtml(row4.estado_comercial)}</span>`],
    ["ultima_visita", (row4) => `<span class="sm">${row4.ultima_visita ? formatShortDate(row4.ultima_visita) : "—"}</span>`],
    ["telefono", (row4) => `<span class="sm">${escapeHtml(orFallback(row4.telefono, row4.consulta_telefono ?? ""))}</span>`],
    ["comerciales", salesRepsCell]
  ]);
  function cell(row4, key, onAccessLoaded) {
    if (key === "acceso") return accessCell(row4, onAccessLoaded);
    if (key.startsWith(CUSTOM_PREFIX)) return customCell(row4, key.slice(CUSTOM_PREFIX.length));
    const special = CELLS.get(key);
    if (special) return special(row4);
    const value10 = row4[key];
    return `<span class="sm">${escapeHtml(value10 ? String(value10) : "")}</span>`;
  }

  // src/app/screens/accounts/list/columns.ts
  var SALES_REPS = "comerciales";
  var CUSTOM_PREFIX2 = "cp:";
  var CUSTOM_WIDTH = 150;
  var DEFAULT_ON = ["nombre", "especialidad", "centro_nombre", "municipio", "dias", "estado_comercial"];
  function columnDefinitions() {
    return [
      { k: "nombre", t: term("medico", { capital: "C" }), w: 250, fixed: true },
      { k: "especialidad", t: term("especialidad", { capital: "C" }), w: 170 },
      { k: "centro_nombre", t: t("accounts.columns.centre"), w: 200 },
      { k: "municipio", t: t("accounts.columns.town"), w: 140 },
      { k: "direccion", t: t("accounts.columns.address"), w: 200 },
      { k: "telefono", t: t("accounts.columns.phone"), w: 130 },
      { k: "dias", t: t("accounts.columns.days"), w: 150 },
      { k: "ultima_visita", t: term("visita", { article: "ultimo", articleCapital: "C" }), w: 130 },
      { k: "estado_comercial", t: t("accounts.columns.state"), w: 150 },
      { k: SALES_REPS, t: t("accounts.columns.salesReps"), w: 190 },
      { k: "acceso", t: t("accounts.columns.access"), w: 170 },
      ...accountColumnsLegacy.customFields().map((field4) => ({ k: CUSTOM_PREFIX2 + field4.clave, t: field4.nombre, w: CUSTOM_WIDTH }))
    ];
  }
  var columnTitle = (key) => columnDefinitions().find((column) => column.k === key)?.t ?? key;
  function saved() {
    try {
      return JSON.parse(localStorage.getItem(accountColumnsLegacy.storageKey()) ?? "null");
    } catch {
      return null;
    }
  }
  function saveColumns(settings) {
    try {
      localStorage.setItem(accountColumnsLegacy.storageKey(), JSON.stringify(settings));
    } catch {
    }
  }
  function resetColumns() {
    try {
      localStorage.removeItem(accountColumnsLegacy.storageKey());
    } catch {
    }
  }
  function columnSettings() {
    const all = columnDefinitions(), everything = permissions.seesEverything(), chosen2 = saved();
    const settings = chosen2?.length ? [...chosen2] : all.map((column) => ({ k: column.k, on: DEFAULT_ON.includes(column.k) || column.k === SALES_REPS && everything, w: column.w }));
    all.forEach((column) => {
      if (!settings.some((setting) => setting.k === column.k)) settings.push({ k: column.k, on: column.k === SALES_REPS && everything, w: column.w });
    });
    const fields = accountColumnsLegacy.customFields();
    return settings.filter((setting) => setting.k !== SALES_REPS || everything).map((setting) => setting.k.startsWith(CUSTOM_PREFIX2) && !(chosen2 ?? []).some((item) => item.k === setting.k) ? { ...setting, on: Boolean(fields.find((field4) => CUSTOM_PREFIX2 + field4.clave === setting.k)?.en_tabla) } : setting);
  }
  var visibleColumns = () => columnSettings().filter((setting) => setting.on);

  // src/app/screens/accounts/list/table.ts
  function paintHeader() {
    const head = document.getElementById("thead");
    if (!head) return;
    const columns = visibleColumns(), width = columns.reduce((total, column) => total + column.w, 0);
    head.innerHTML = columns.map((column) => `<span class="tcell th" style="width:${column.w}px;min-width:${column.w}px">${escapeHtml(columnTitle(column.k))}<i class="res" data-res="${column.k}"></i></span>`).join("");
    head.style.minWidth = `${width}px`;
    const list = document.getElementById("lista");
    if (list) list.style.minWidth = `${width}px`;
    markSort(head, columns);
  }
  function markSort(head, columns) {
    const [key = "", direction] = String(accountListLegacy.filters().orden || "").split(":");
    [...head.querySelectorAll(".th")].forEach((header, index) => {
      const column = columns[index], sortKey = column ? accountListLegacy.sortKey(column.k) : void 0;
      if (!column || !sortKey) return;
      header.dataset.ordk = column.k;
      header.classList.add("htord");
      header.title = t("accounts.list.sortBy");
      const current = sortKey === key && !((key === "nombre" || key === "reciente") && !direction);
      header.classList.toggle("ord-asc", current && direction !== "desc");
      header.classList.toggle("ord-desc", current && direction === "desc");
    });
  }
  function rowHtml(row4, onAccessLoaded) {
    const cells = visibleColumns().map((column) => `<span class="tcell" style="width:${column.w}px;min-width:${column.w}px">${cell(row4, column.k, onAccessLoaded)}</span>`).join("");
    const place = [row4.centro_nombre, row4.municipio].filter(Boolean).join(" · ");
    const card2 = `<span class="plcard"><b>${row4.urgente ? `<i class="plurg" aria-label="${t("accounts.list.urgent")}"></i>` : ""}${escapeHtml(row4.nombre ?? "")}</b><span class="plc2">${escapeHtml(place)}</span><span class="plc3">${cell(row4, "estado_comercial", onAccessLoaded)}</span></span>`;
    return `<button class="trow" data-id="${row4.id}">${cells}${card2}</button>`;
  }
  function paintChips() {
    const box = document.getElementById("chips");
    if (!box) return;
    const filters = accountListLegacy.filters();
    const chips = [
      ...filters.q ? [["q", t("accounts.list.chipSearch", { text: filters.q })]] : [],
      ...[["prov", filters.prov], ["muni", filters.muni], ["esp", filters.esp], ["est", filters.est]].filter(([, value10]) => value10),
      ...filters.urg ? [["urg", t("accounts.list.chipUrgent")]] : [],
      ...filters.mios ? [["mios", t("accounts.list.chipMine")]] : [],
      ...filters.sin ? [["sin", t("accounts.list.chipNeverVisited")]] : []
    ];
    box.innerHTML = chips.map(([key, text2]) => `<button class="chip" data-x="${key}">${escapeHtml(text2)} ✕</button>`).join("") + accountListLegacy.fieldChips(filters.campos).map((chip) => `<button class="chip" data-xcp="${escapeHtml(chip.k)}">${escapeHtml(chip.t)} ✕</button>`).join("");
  }

  // src/app/screens/accounts/list/search.ts
  var lastSearch = 0;
  var orNull = (value10) => value10 ? value10 : null;
  var loadingHtml = (text2) => `<div class="cargador"><span class="spin"></span><span class="sm">${escapeHtml(text2)}</span></div>`;
  function searchParams() {
    const filters = accountListLegacy.filters(), size = accountListLegacy.pageSize();
    return {
      q: filters.q || null,
      f_provincia: filters.prov || null,
      f_municipio: filters.muni || null,
      f_estado: filters.est || null,
      f_especialidad: filters.esp || null,
      f_area: null,
      f_urgentes: filters.urg,
      f_mios: Boolean(filters.mios),
      f_sin_visitar: Boolean(filters.sin),
      f_comercial: orNull(filters.com),
      f_reporting: orNull(filters.rep),
      ...filters.tipo ? { f_tipo: filters.tipo } : {},
      orden: filters.orden,
      lim: size,
      desplaz: filters.pagina * size,
      ...Object.keys(filters.campos).length ? { f_campos: filters.campos } : {}
    };
  }
  function syncTypeFilter() {
    const select2 = document.getElementById("ftipo");
    if (!select2) return;
    const professionals = select2.options[1];
    if (professionals) professionals.text = term("medico", { number: "p", capital: "C" });
    const type = accountListLegacy.filters().tipo ?? "";
    if (select2.value !== type) select2.value = type;
  }
  function showFailure(list, count2, error) {
    count2.textContent = "";
    const aborted = /abort/i.test(error?.message ?? "");
    list.innerHTML = `<div class="vacio">${t("accounts.list.couldNotLoad")}${aborted ? t("accounts.list.notResponding") : ""}.<br><button class="btn sec" type="button" id="dirreint" style="margin-top:10px">${t("accounts.list.retry")}</button></div>`;
    const retry = document.getElementById("dirreint");
    if (retry) retry.onclick = () => {
      void searchAccounts(true);
    };
  }
  function showResult(data, list, count2, elapsedMs) {
    const filters = accountListLegacy.filters();
    filters.total = data.total;
    count2.innerHTML = t("accounts.list.count", { count: formatNumber(data.total), contacts: escapeHtml(accountListLegacy.contactsLabel().toLowerCase()), ms: elapsedMs });
    paintChips();
    const rows = data.filas ?? [];
    if (!rows.length) {
      list.innerHTML = `<div class="vacio">${t("accounts.list.noMatches")}</div>`;
      const head = document.getElementById("thead");
      if (head) head.innerHTML = "";
    } else {
      paintHeader();
      list.innerHTML = rows.map((row4) => rowHtml(row4, () => {
        void searchAccounts(true);
      })).join("");
    }
    accountListLegacy.paginate({
      element: document.getElementById("dirpag"),
      total: data.total,
      page: filters.pagina,
      onPage: (page) => {
        filters.pagina = page;
        void searchAccounts(false);
        document.getElementById("tabla")?.scrollIntoView({ block: "start", behavior: "smooth" });
      },
      onSize: () => {
        void searchAccounts(true);
      }
    });
  }
  async function searchWithRetry(mine) {
    const params = searchParams();
    let answer = await legacyDb().rpc("buscar_cuentas", params);
    if (mine !== lastSearch) return null;
    if (answer.error || !answer.data) {
      answer = await legacyDb().rpc("buscar_cuentas", params);
      if (mine !== lastSearch) return null;
    }
    return answer;
  }
  async function searchAccounts(reset = false) {
    syncTypeFilter();
    if (accountListLegacy.mapMode() && reset) setTimeout(() => {
      accountListLegacy.paintMap();
    }, 10);
    if (reset) accountListLegacy.filters().pagina = 0;
    const mine = ++lastSearch, list = document.getElementById("lista"), count2 = document.getElementById("cuenta");
    if (!list || !count2) return;
    list.innerHTML = loadingHtml(t("accounts.list.searching", { contacts: accountListLegacy.contactsLabel().toLowerCase() }));
    count2.textContent = t("accounts.list.searchingShort");
    const started = performance.now(), answer = await searchWithRetry(mine);
    if (!answer) return;
    if (answer.error || !answer.data) {
      showFailure(list, count2, answer.error);
      return;
    }
    showResult(answer.data, list, count2, Math.round(performance.now() - started));
  }

  // src/app/screens/accounts/list/column-panel.ts
  var MIN_WIDTH = 80;
  var MAX_WIDTH = 600;
  function panelHtml(settings) {
    const definitions = columnDefinitions();
    const rows = settings.map((setting, index) => {
      const column = definitions.find((item) => item.k === setting.k), fixed = Boolean(column?.fixed);
      return `<label class="item" style="cursor:pointer;margin:0">
          <input type="checkbox" data-con="${index}" ${setting.on ? "checked" : ""} ${fixed ? "disabled" : ""}>
          <span class="tx"><b>${escapeHtml(column?.t ?? setting.k)}</b>${fixed ? `<span class="sm">${t("accounts.columns.alwaysVisible")}</span>` : ""}</span>
          <span class="kord" style="flex-direction:row">
            <button type="button" class="kmv" data-cmv="${index}|-1" aria-label="${t("accounts.columns.up")}" ${index === 0 ? "disabled" : ""}>${legacyIcons.arrow("arriba")}</button>
            <button type="button" class="kmv" data-cmv="${index}|1" aria-label="${t("accounts.columns.down")}" ${index === settings.length - 1 ? "disabled" : ""}>${legacyIcons.arrow("abajo")}</button></span></label>`;
    }).join("");
    return `<div class="tbox">
      <div class="fh"><h2>${t("accounts.columns.panelTitle")}</h2><button class="x" id="tclose" aria-label="${t("common.close")}">✕</button></div>
      <button class="t2volver" id="tcvolver" style="margin:0 0 10px">${t("accounts.columns.back")}</button>
      <p class="sm">${t("accounts.columns.panelNote")}</p>
      <div class="lista tcols">${rows}</div>
      <div class="acts"><button class="btn sec" id="tcres">${t("accounts.columns.restore")}</button></div></div>`;
  }
  function bindPanel(filters, panel, settings, apply) {
    const close4 = panel.querySelector("#tclose");
    if (close4) close4.onclick = () => {
      panel.classList.remove("abierto");
      filters.classList.remove("abierto");
    };
    const back = panel.querySelector("#tcvolver");
    if (back) back.onclick = () => {
      panel.classList.remove("abierto");
    };
    panel.querySelectorAll("[data-con]").forEach((box) => {
      box.onchange = () => {
        const setting = settings[Number(box.dataset.con)];
        if (!setting) return;
        setting.on = box.checked;
        if (!settings.some((item) => item.on)) {
          box.checked = true;
          setting.on = true;
          notices.toast(t("accounts.columns.keepOne"), true);
          return;
        }
        apply(settings);
      };
    });
    panel.querySelectorAll("[data-cmv]").forEach((button2) => {
      button2.onclick = (event) => {
        event.preventDefault();
        const [from = 0, direction = 0] = (button2.dataset.cmv ?? "").split("|").map(Number), to = from + direction;
        const moved = settings[from], other = settings[to];
        if (!moved || !other) return;
        settings[from] = other;
        settings[to] = moved;
        apply(settings);
        paint(filters, panel, settings, apply);
      };
    });
    const restore = panel.querySelector("#tcres");
    if (restore) restore.onclick = () => {
      resetColumns();
      const fresh = columnSettings();
      apply(fresh);
      paint(filters, panel, fresh, apply);
    };
  }
  function paint(filters, panel, settings, apply) {
    panel.innerHTML = panelHtml(settings);
    bindPanel(filters, panel, settings, apply);
  }
  function openColumnsPanel(onChange) {
    const filters = document.getElementById("tools"), panel = document.getElementById("tools2");
    if (!filters || !panel) return;
    const apply = (list) => {
      saveColumns(list);
      onChange();
    };
    paint(filters, panel, columnSettings(), apply);
    filters.classList.add("abierto");
    panel.classList.add("abierto");
  }
  function listenToColumnResize(paintHeader2) {
    let drag = null;
    document.addEventListener("pointerdown", (event) => {
      const handle = event.target instanceof Element ? event.target.closest("i.res[data-res]") : null;
      if (!handle) return;
      const settings = columnSettings(), column = settings.find((item) => item.k === handle.dataset.res);
      if (!column) return;
      event.preventDefault();
      drag = { key: column.k, startX: event.clientX, startWidth: column.w, settings };
      document.body.style.cursor = "col-resize";
    });
    document.addEventListener("pointermove", (event) => {
      if (!drag) return;
      const width = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, Math.round(drag.startWidth + (event.clientX - drag.startX)))), key = drag.key;
      const settings = drag.settings.map((item) => item.k === key ? { ...item, w: width } : item);
      saveColumns(settings);
      paintHeader2();
      const visible = settings.filter((item) => item.on);
      document.querySelectorAll("#lista .trow").forEach((row4) => {
        [...row4.children].forEach((cellElement, index) => {
          const column = visible[index];
          if (column && cellElement instanceof HTMLElement) {
            cellElement.style.width = `${column.w}px`;
            cellElement.style.minWidth = `${column.w}px`;
          }
        });
      });
    });
    document.addEventListener("pointerup", () => {
      if (drag) {
        drag = null;
        document.body.style.cursor = "";
      }
    });
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
  function shiftMonth(month, months2) {
    const date = /* @__PURE__ */ new Date(`${month}-01T12:00:00`);
    date.setMonth(date.getMonth() + months2);
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
  function onClick(element2, action) {
    if (element2 instanceof HTMLElement) element2.onclick = (event) => {
      event.stopPropagation();
      action();
    };
  }
  function bindHeader(box, month, current) {
    box.querySelectorAll("[data-agm]").forEach((button2) => {
      onClick(button2, () => {
        void renderMonth(shiftMonth(month, Number(button2.dataset.agm)));
      });
    });
    onClick(document.getElementById("agmhoy"), () => {
      void renderMonth(current);
    });
    const title2 = document.getElementById("agmtit");
    onClick(title2, () => {
      if (title2) openMonthPicker(month, title2);
    });
  }
  function bindDays(box) {
    const selected = legacyAgenda.selectedDate(), today = todayIso();
    box.querySelectorAll(".agmc[data-agdia]").forEach((button2) => {
      const day = button2.dataset.agdia ?? "";
      button2.classList.toggle("sel", day === selected && selected !== today);
      onClick(button2, () => {
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
    document.querySelectorAll(".agmpop").forEach((element2) => {
      element2.remove();
    });
    let year = Number(month.slice(0, 4));
    const picker = document.createElement("div");
    picker.className = "agmpop";
    const names = shortMonthNames();
    const paint8 = () => {
      picker.innerHTML = `<div class="agmpoph"><button type="button" class="kmv" data-an="-1" aria-label="${t("agenda.month.previousYear")}">‹</button><b>${year}</b>
      <button type="button" class="kmv" data-an="1" aria-label="${t("agenda.month.nextYear")}">›</button></div>
      <div class="agmpopg">${names.map((name, index) => {
        const key = `${year}-${String(index + 1).padStart(2, "0")}`;
        return `<button type="button" data-mk="${key}" class="${key === month ? "on" : ""}">${name}</button>`;
      }).join("")}</div>`;
      picker.querySelectorAll("[data-an]").forEach((button2) => {
        onClick(button2, () => {
          year += Number(button2.dataset.an);
          paint8();
        });
      });
      picker.querySelectorAll("[data-mk]").forEach((button2) => {
        onClick(button2, () => {
          picker.remove();
          void renderMonth(button2.dataset.mk);
        });
      });
    };
    paint8();
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
    const button2 = document.getElementById("cmesb"), opened = calendar();
    if (!button2 || !opened) return;
    opened.classList.add("pop");
    button2.setAttribute("aria-expanded", "true");
    const rect = button2.getBoundingClientRect(), width = Math.min(POPOVER_WIDTH, innerWidth - 32);
    Object.assign(opened.style, { top: `${Math.round(rect.bottom + 8)}px`, left: `${Math.round(Math.max(16, Math.min(rect.left, innerWidth - width - 16)))}px`, bottom: "auto", right: "auto" });
  }
  function refreshOpenMonth() {
    const box = calendar();
    if (!box?.classList.contains("pop")) return;
    box.dataset.mes = "-";
    void renderMonth(shownMonth);
  }

  // src/app/screens/agenda/metrics.ts
  var count = (value10) => formatNumber(value10 ?? 0);
  var decimal = (value10) => value10 === void 0 || value10 === null ? "0" : String(value10).replace(".", ",");
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
    const visits2 = term("visita", { number: "p" }), week = metrics.semana ?? {}, closings = metrics.cierres ?? {}, pending = metrics.pendientes ?? {};
    return [
      ["agenda.metrics.today", `${done}/${total}`, t("agenda.metrics.todayDetail", { done, total, average: decimal(metrics.media_dia), visits: visits2 }), ""],
      ["agenda.metrics.week", count(week.visitas), t("agenda.metrics.weekDetail", { count: count(week.visitas), visits: visits2, average: decimal(week.media) }), ""],
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
  var toNumber = (value10) => Number(value10);
  function isSameCentre(group, appointment) {
    if (isPresent(group.lat) && isPresent(appointment.lat)) {
      return distanceKm([toNumber(group.lat), toNumber(group.lon)], [toNumber(appointment.lat), toNumber(appointment.lon)]) <= NEAR_KM;
    }
    return Boolean(group.centro_nombre && appointment.centro_nombre && looseText(group.centro_nombre) === looseText(appointment.centro_nombre));
  }
  function personChip(person) {
    const missing = person.falta?.length ? t("agenda.sameCentre.missing", { fields: person.falta.join(", ") }) : "";
    const title2 = person.visitar ? t("agenda.sameCentre.addAppointment", { reason: person.visitar }) : t("agenda.sameCentre.seeCard") + missing;
    return `<button type="button" data-agti="${person.id}" data-agtv="${person.visitar ? 1 : ""}" title="${escapeHtml(title2)}">${person.visitar ? "<i>+</i> " : ""}${escapeHtml(person.nombre)}</button>`;
  }
  function blockHtml(group, people, isoDate) {
    const chips = groupByAttendance(people.slice(0, SHOWN_PEOPLE), isoDate).map(({ title: title2, people: list }) => `<div class="agtambg"><span class="agtambgt">${escapeHtml(title2)}</span><div class="agtambl">${list.map(personChip).join("")}</div></div>`).join("") + (people.length > SHOWN_PEOPLE ? `<span class="sm">${t("agenda.sameCentre.andMore", { count: people.length - SHOWN_PEOPLE })}</span>` : "");
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
    body2.querySelectorAll(".agtamb").forEach((element2) => {
      element2.remove();
    });
    const cards = [...body2.querySelectorAll(".tdu[data-tdu]")];
    if (!cards.length) return;
    const byId = new Map(legacyAgenda.dayAppointments().map((item) => [String(item.id), item]));
    const already = withAppointmentToday(), used = /* @__PURE__ */ new Set();
    suggestions.centros.forEach((group) => {
      const people = (group.cuentas ?? group.medicos ?? []).filter((person) => !already.has(person.id));
      if (!people.length) return;
      const card2 = cards.find((element2) => {
        const appointment = byId.get(element2.dataset.tdu ?? "");
        return appointment !== void 0 && !used.has(element2) && isSameCentre(group, appointment);
      });
      if (!card2) return;
      used.add(card2);
      (card2.querySelector(".tdu-pie") ?? card2.lastElementChild)?.insertAdjacentHTML("beforebegin", blockHtml(group, people, isoDate));
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
      const block4 = target?.closest("#agcuerpo .agtamb[data-agtc]");
      if (block4) {
        event.stopPropagation();
        agendaActions.openCentre(block4.dataset.agtc ?? "");
      }
    }, true);
    document.addEventListener("keydown", (event) => {
      const block4 = event.target instanceof Element ? event.target.closest("#agcuerpo .agtamb[data-agtc]") : null;
      if (block4 && event.target === block4 && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        agendaActions.openCentre(block4.dataset.agtc ?? "");
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
    const start2 = agendaSources.stripStart() ?? mondayOf(legacyAgenda.selectedDate() ?? todayIso()), owner = agendaSources.ownerId();
    return [loadRange(start2, addDays(start2, STRIP_DAYS - 1), owner, `agenda-cinta-${owner}-${start2}`), loadBlocked(start2, addDays(start2, STRIP_DAYS - 1))];
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
  async function withData(loads, paint8) {
    painting++;
    try {
      await Promise.all(loads.filter(Boolean).map((load2) => Promise.resolve(load2).catch(() => null)));
      return await paint8();
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
    const title2 = t("agenda.openWeek.estimatedEnd") + (end > limit ? t("agenda.openWeek.overReturn", { time: formatMinutes(limit) }) : "");
    return `<span class="semcarga ${end > limit ? "pasa" : ""}" title="${title2}">~${formatMinutes(end)}</span>`;
  }
  function appointmentChip(item, data) {
    const movable = item.usuario_id === data.owner && appointments.isOpen(item.estado) && item.fecha >= data.today;
    const title2 = `${escapeHtml(item.nombre)} · ${escapeHtml(item.estado)}${movable ? t("agenda.openWeek.dragToMove") : ""}`;
    const time = item.hora ? `<i>${escapeHtml(String(item.hora).slice(0, 5))}</i>` : "";
    const other = item.usuario_id !== data.owner && item.usuario ? ` <em>${escapeHtml(initialsOf(item.usuario))}</em>` : "";
    return `<span class="semcita" data-semficha="${item.cuenta_id}" ${movable ? `draggable="true" data-semcid="${item.id}"` : ""}
              title="${title2}" style="border-left-color:${commercialStates.color(item.estado) ?? "var(--muted)"}">
              ${time}${escapeHtml(firstName(item.nombre))}${other}</span>`;
  }
  function proposedChip(item) {
    const start2 = item.ini === null || item.ini === void 0 ? "" : formatMinutes(item.ini);
    return `<span class="semcita nueva" title="${t("agenda.openWeek.proposal", { name: escapeHtml(item.m.nombre) })}${start2 ? ` · ~${start2}` : ""}"><i>~${start2}</i>${escapeHtml(firstName(item.m.nombre))}</span>`;
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
    const summary3 = t("agenda.openWeek.draftSummary", { count: formatNumber(draft.total), visits: term("visita", { number: "p", adjective: "nuevo" }), days }) + (draft.sinDia.length ? t("agenda.openWeek.draftWithoutDay", { count: draft.sinDia.length }) : "");
    return `<div class="semborr">
      <span><b>${t("agenda.openWeek.draft")}</b> · ${summary3}</span>
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
  function bind2(box, data) {
    const plan = box.querySelector("#semplan");
    if (plan) plan.onclick = () => {
      weekPlanner.plan(data.monday, data.days, { ...data.blocked }, data.perDay);
    };
    const discard = box.querySelector("#semdescartar");
    if (discard) discard.onclick = () => {
      weekPlanner.discardDraft();
      reloadAgenda();
    };
    const save13 = box.querySelector("#semguardar");
    if (save13) save13.onclick = () => {
      weekPlanner.saveDraft(save13);
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
    bind2(box, data);
  }
  function paintOpenWeek() {
    const paint8 = async () => {
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
    return legacyAgenda.isDayView() ? withData(stripState.weekOpen() ? weekLoads(legacyAgenda.selectedDate()) : [], paint8) : paint8();
  }

  // src/app/screens/agenda/strip.ts
  var STRIP_DAYS2 = 14;
  var WEEK_DAYS3 = 7;
  var MAX_DOTS = 6;
  var DAY_MS3 = 864e5;
  var hasStrip = () => currentScreen() === "agenda" && legacyAgendaParts.mode() === "dia" && Boolean(document.getElementById("v-agenda"));
  function weekTitle(monday, today) {
    const weeks = Math.round((fromIsoDate(monday).getTime() - fromIsoDate(mondayOf(today)).getTime()) / DAY_MS3 / WEEK_DAYS3);
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
  function weekButtonHtml(open2) {
    const label = t(open2 ? "agenda.strip.hideWeek" : "agenda.strip.showWeek");
    return `<button type="button" class="btn sec chico" id="cplan" title="${open2 ? label : t("agenda.strip.showWeekTitle")}" aria-expanded="${String(open2)}">${icon("calendar-days")}<span>${label}</span></button>`;
  }
  function stripHtml(start2, context) {
    const month = capitalise(formatMonthYear(addDays(start2, 3)));
    const today = mondayOf(context.today) === start2 ? "" : `<button type="button" class="btn sec chico" id="choy">${t("agenda.strip.today")}</button>`;
    const weeks = [0, WEEK_DAYS3].map((offset) => `<div class="csem"><span class="csemt">${weekTitle(addDays(start2, offset), context.today)}</span><div class="c7">${range(WEEK_DAYS3).map((index) => dayButton(addDays(start2, offset + index), context)).join("")}</div></div>`).join("");
    return `<div class="cinta" id="agcinta" data-ini="${start2}"><div class="ccab">
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
    const button2 = document.getElementById("cplan");
    if (!button2) return;
    const open2 = Boolean(document.getElementById("agsemexp")), label = t(open2 ? "agenda.strip.hideWeek" : "agenda.strip.showWeek");
    button2.innerHTML = `${icon("calendar-days")}<span>${label}</span>`;
    button2.title = open2 ? label : t("agenda.strip.showWeekTitle");
    button2.setAttribute("aria-expanded", String(open2));
    button2.onclick = async (event) => {
      event.stopPropagation();
      event.preventDefault();
      if (button2.dataset.ocupado) return;
      button2.dataset.ocupado = "1";
      stripState.setWeekOpen(!open2);
      try {
        await paintOpenWeek();
      } finally {
        delete button2.dataset.ocupado;
        bindWeekButton();
      }
    };
  }
  function bindDayOptions(strip) {
    strip.querySelectorAll(".cdmas").forEach((options) => {
      const day = options.closest("[data-cf]");
      const open2 = (event) => {
        event.stopPropagation();
        event.preventDefault();
        legacyAgendaParts.dayMenu(options, day?.dataset.cf ?? "", Boolean(day?.classList.contains("bloq")));
      };
      options.addEventListener("click", open2, true);
      options.addEventListener("keydown", (event) => {
        if (event.key === "Enter") open2(event);
      });
    });
  }
  function bind3(strip) {
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
    const today = todayIso(), start2 = stripState.start() ?? mondayOf(legacyAgenda.selectedDate() ?? today), owner = agendaSources.ownerId();
    stripState.setStart(start2);
    const end = addDays(start2, STRIP_DAYS2 - 1);
    const [result, blocked] = await Promise.all([
      cachedRpc("agenda_rango", { p_desde: start2, p_hasta: end, p_usuario: owner }, `agenda-cinta-${owner}-${start2}`),
      legacyAgendaParts.blockedDays(start2, STRIP_DAYS2)
    ]);
    const body2 = document.getElementById("agcuerpo");
    if (!hasStrip() || stripState.start() !== start2 || !body2) return;
    const html = stripHtml(start2, { today, selected: legacyAgenda.selectedDate(), perDay: perDayOf(result.data ?? [], owner), blocked });
    const old = document.getElementById("agcinta");
    if (old) old.outerHTML = html;
    else body2.insertAdjacentHTML("beforebegin", html);
    const strip = document.getElementById("agcinta");
    if (!strip) return;
    bind3(strip);
    showSelectedWeek(strip, start2);
  }
  function showSelectedWeek(strip, start2) {
    const weeks = strip.querySelector(".csems"), selected = legacyAgenda.selectedDate();
    if (weeks && selected && selected >= addDays(start2, WEEK_DAYS3)) weeks.scrollLeft = weeks.scrollWidth;
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
  var timeOf2 = (item) => String(item.hora ?? "");
  function byDay(list) {
    const days = /* @__PURE__ */ new Map();
    list.filter((item) => !appointments.isCancelled(item.estado)).forEach((item) => {
      days.set(item.fecha, [...days.get(item.fecha) ?? [], item]);
    });
    days.forEach((items) => items.sort((first, second) => timeOf2(first).localeCompare(timeOf2(second))));
    return days;
  }
  function dayContent(items, blockedReason) {
    const blocked = blockedReason ? `<span class="agslb">${escapeHtml(blockedReason)}</span>` : "";
    const shown4 = items.slice(0, SHOWN_PER_DAY2).map((item) => `<span class="agslx"><b>${escapeHtml(timeOf2(item).slice(0, 5))}</b>${escapeHtml(orFallback(item.medico, item.nombre ?? ""))}</span>`).join("");
    const more = items.length > SHOWN_PER_DAY2 ? `<span class="agslv">${t("agenda.week.andMore", { count: items.length - SHOWN_PER_DAY2 })}</span>` : "";
    const free = !items.length && !blockedReason ? `<span class="agslv">${t("agenda.week.free")}</span>` : "";
    return blocked + shown4 + more + free;
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
  function bind4(box, blocked) {
    box.querySelectorAll("[data-agslm]").forEach((button2) => {
      button2.onclick = (event) => {
        event.stopPropagation();
        const day = button2.dataset.agslm ?? "";
        legacyAgendaParts.dayMenu(button2, day, Boolean(blocked[day]));
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
  async function paint2() {
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
    bind4(box, blocked);
  }
  function paintWeekSidebar() {
    return legacyAgenda.isDayView() ? withData(weekLoads(legacyAgenda.selectedDate()), paint2) : paint2();
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
    document.getElementById("agband")?.querySelectorAll("[data-agbd]").forEach((button2) => {
      button2.onclick = () => {
        openTray(button2.dataset.agbd === "toca" ? "toca" : "pend");
      };
    });
  }
  function dueRow(account) {
    const visit2 = term("visita"), id = account.id ?? "";
    const days = isPresent(account.dias_sin_visita) ? t("agenda.trays.daysWithout", { days: account.dias_sin_visita, visit: visit2 }) : t("agenda.trays.neverVisited");
    return `<div class="item" style="cursor:default"><span class="ic">${icon("target")}</span>
        <span class="tx"><b>${escapeHtml(account.nombre)}</b><span class="sm">${escapeHtml([account.estado_comercial, days, account.municipio].filter(Boolean).join(" · "))}</span></span>
        <span class="acts" style="margin:0"><button class="btn sec" data-agbf="${id}">${t("agenda.trays.card")}</button><button class="btn sec" data-agbc="${id}">${t("agenda.trays.addAppointment")}</button></span></div>`;
  }
  function pendingRow2(item) {
    return `<div class="item" style="cursor:default"><span class="ic w">!</span>
        <span class="tx"><b>${escapeHtml(item.nombre)}</b><span class="sm">${formatShortDate(item.fecha)}${item.centro_nombre ? ` · ${escapeHtml(item.centro_nombre)}` : ""}</span></span>
        <span class="acts" style="margin:0"><button class="btn sec" data-cita="hoy|${item.id}">${t("agenda.trays.moveToToday")}</button><button class="btn sec" data-cita="desc|${item.id}">${t("agenda.trays.discard")}</button></span></div>`;
  }
  function trayHtml(tray, due, pending) {
    const isDue = tray === "toca";
    const title2 = isDue ? t("agenda.trays.due", { visit: term("visita") }) : t("agenda.trays.pending");
    const text2 = isDue ? t("agenda.trays.dueText", { professional: term("medico") }) : t("agenda.trays.pendingText");
    const action = isDue ? due.some((account) => account.lat) ? `<button class="btn sec" id="agbruta">${t("agenda.trays.planRoute")}</button>` : "" : pending.length ? `<button class="btn sec" id="agbrepro">${t("agenda.trays.rescheduleAll")}</button>` : "";
    const rows = isDue ? due.map(dueRow).join("") : pending.map(pendingRow2).join("");
    return `<div class="tbox"><div class="fh"><h2>${escapeHtml(title2)}</h2><button class="x" id="tclose" aria-label="${t("common.close")}">✕</button></div><p class="sm">${escapeHtml(text2)}</p>
    <div class="acts" style="margin:8px 0">${action}</div>
    <div class="agbdc"><div class="lista">${rows || `<div class="vacio">${t("agenda.trays.nothingPending")}</div>`}</div></div></div>`;
  }
  function bindTray(panel, due, pending) {
    const close4 = () => {
      panel.classList.remove("abierto");
    };
    const closeButton = document.getElementById("tclose");
    if (closeButton) closeButton.onclick = close4;
    panel.querySelectorAll("[data-agbf]").forEach((button2) => {
      button2.onclick = () => {
        agendaActions.openAccount(button2.dataset.agbf ?? "");
      };
    });
    panel.querySelectorAll("[data-agbc]").forEach((button2) => {
      button2.onclick = () => {
        agendaActions.newAppointment(button2.dataset.agbc ?? "", legacyAgenda.selectedDate());
      };
    });
    const route = document.getElementById("agbruta");
    if (route) route.onclick = () => {
      close4();
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
    let button2 = actions.querySelector('[data-ag="equipo"]');
    if (!button2) {
      selector?.insertAdjacentHTML("afterend", `<button class="btn sec" data-ag="equipo">${t("agenda.team.team")}</button>`);
      button2 = actions.querySelector('[data-ag="equipo"]');
    }
    if (!button2) return;
    const teamView = legacyAgendaParts.mode() === "equipo";
    button2.textContent = t(teamView ? "agenda.team.myAgenda" : "agenda.team.team");
    button2.classList.toggle("sec", !teamView);
    button2.title = t(teamView ? "agenda.team.backToMine" : "agenda.team.seeTeam");
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
    const empty2 = body2.querySelector(":scope > .vacio"), stats = body2.querySelector(".tdhead .tdstats");
    stats?.classList.toggle("hide", Boolean(empty2) && !body2.querySelector(".tdesc"));
    if (!empty2) return;
    empty2.classList.add("vlinea");
    const selected = legacyAgenda.selectedDate();
    if (selected && selected < todayIso()) empty2.textContent = t("agenda.noAppointmentsThatDay");
  }
  function markSelectedDay() {
    const view = agendaView();
    if (!view?.classList.contains("agunida")) return;
    const today = todayIso(), selected = legacyAgenda.selectedDate();
    const title2 = document.getElementById("agtit");
    if (title2) title2.textContent = titleText();
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
    document.querySelectorAll(".agpop").forEach((element2) => {
      element2.remove();
    });
    closeMonth();
    if (!day) return;
    if (!legacyAgenda.isDayView()) {
      agendaState.setMode("dia");
      agendaState.setSelectedDate(day);
      await loadAgenda();
      return;
    }
    const before = legacyAgenda.selectedDate() ?? day, start2 = stripState.start();
    agendaState.setSelectedDate(day);
    dayBody()?.classList.add("agcargando");
    const outside = !start2 || day < start2 || day > addDays(start2, STRIP_DAYS3 - 1);
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
        if (!outside) document.querySelectorAll("#agcinta .cdia").forEach((element2) => {
          element2.classList.toggle("sel", element2.dataset.cf === day);
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
  function statePill3(state) {
    const color2 = colorOf(state);
    return `<span class="pill cest" style="background:color-mix(in srgb, ${color2} 12%, transparent);color:${color2}">${escapeHtml(state)}</span>`;
  }
  function pointOf(item) {
    return item.lat !== null && item.lat !== void 0 && item.lon !== null && item.lon !== void 0 ? [Number(item.lat), Number(item.lon)] : null;
  }
  var STATES4 = { planned: "Planificada", confirmed: "Confirmada", discarded: "Descartada", postponed: "Aplazada" };
  var canPlanAgain = (item, today) => (item.estado === STATES4.postponed || item.estado === STATES4.discarded) && item.fecha >= today;

  // src/app/screens/agenda/appointment-options.ts
  var option = (action, title2, detail = "") => ({ action, title: t(title2), detail });
  function menuOptions(item) {
    const today = todayIso();
    if (!isOpen(item.estado)) {
      if (!canPlanAgain(item, today)) return [];
      return [{ action: "rehacer", title: t("agenda.menu.planAgain"), detail: t("agenda.menu.planAgainText") + (item.estado === STATES4.postponed ? t("agenda.menu.planAgainPostponed") : "") }];
    }
    return [
      option("hora", item.hora ? "agenda.menu.changeTime" : "agenda.menu.setTime"),
      { ...option("aplazar", "agenda.menu.postpone"), detail: t("agenda.menu.postponeText") },
      item.estado === STATES4.planned ? { ...option("confirmar", "agenda.menu.confirm"), detail: t("agenda.menu.confirmText") } : null,
      item.estado === STATES4.confirmed ? option("desconfirmar", "agenda.menu.unconfirm") : null,
      { ...option("descartar", "agenda.menu.discard"), detail: t("agenda.menu.discardText") },
      item.fecha >= today ? { ...option("borrar", "agenda.menu.delete"), detail: t("agenda.menu.deleteText") } : null
      // v2.273.0
    ].filter((entry) => entry !== null);
  }
  var hasMenu = (item) => menuOptions(item).length > 0;

  // src/app/screens/agenda/your-day/card.ts
  var DAY_MS4 = 864e5;
  var NEXT_GRACE_MINUTES = 15;
  var timeText = (time) => escapeHtml(String(time).slice(0, 5));
  function minutesOf(item, estimates) {
    if (item.hora) return Number(String(item.hora).slice(0, 2)) * 60 + Number(String(item.hora).slice(3, 5));
    return estimates[item.id] ?? null;
  }
  function nextOf(open2, estimates, now) {
    return open2.find((item) => {
      const minutes = minutesOf(item, estimates);
      return minutes === null || minutes + NEXT_GRACE_MINUTES >= now;
    }) ?? null;
  }
  var daysSince = (isoDate) => Math.max(0, Math.round((fromIsoDate(todayIso()).getTime() - fromIsoDate(String(isoDate).slice(0, 10)).getTime()) / DAY_MS4));
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
    const text2 = t("agenda.card.attends", { windows: yourDayLegacy.windowsText(info.ventanas) }) + (info.espera ? t("agenda.card.waits", { minutes: info.espera }) : "");
    return ["puerta", "", escapeHtml(text2)];
  }
  function previousLine(item, visit2) {
    if (item.anterior === void 0) return null;
    if (!item.anterior) return ["reloj", "", t("agenda.card.firstVisit", { visit: visit2 })];
    const days = daysSince(item.anterior.fecha);
    return ["reloj", "", t("agenda.card.lastVisit", { visit: visit2, days, unit: t(days === 1 ? "agenda.card.day" : "agenda.card.days") })];
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
    return lines.filter((line2) => line2 !== null);
  }
  function ladderHtml(item, ladder) {
    const level = ladder.findIndex((step) => step.valor === item.estado_comercial);
    if (!ladder.length || level < 0) return "";
    const goal = ladder[level + 1];
    const bars2 = range(ladder.length).map((index) => `<i class="${index <= level ? "on" : index === level + 1 ? "obj" : ""}"></i>`).join("");
    return `<div class="tdu-niv"><div class="tdu-barra" title="${escapeHtml(ladder.map((step) => step.valor).join(" → "))}">${bars2}</div>
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
    const open2 = isOpen(item.estado), canMove = open2 && !context.isPast, record2 = open2 && yourDayLegacy.canRecordOn(item.fecha);
    const again = isAbsent(item.estado) && !context.isPast;
    return `<div class="tdu-pie"><span class="tdu-est">${statePill3(item.estado)}<span class="sm">${yourDayLegacy.originText(item)}</span></span>
        <span class="tdu-ops">${canMove ? orderButtons(item, context) : ""}${hasMenu(item) ? `<button class="btn sec tdmas" type="button" data-td="mas|${item.id}" aria-label="${t("agenda.card.moreActions")}">⋯</button>` : ""}</span>
        ${again ? `<button class="btn sec tdu-reg" type="button" data-td="nueva|${item.id}">${t("agenda.card.newAppointment")}</button>` : ""}
        ${record2 ? `<button class="btn ${item === context.next ? "" : "sec"} tdu-reg" type="button" data-td="visita|${item.id}">${t("agenda.card.record", { visit: context.visit })}</button>` : ""}</div>`;
  }
  function statusClass(state) {
    if (isOpen(state)) return "abierta";
    if (isDone(state)) return "hecha";
    return isAbsent(state) ? "ausente" : "cerrada";
  }
  function appointmentCard(item, index, context) {
    const open2 = isOpen(item.estado), mini2 = !open2 && !isDone(item.estado) && !isAbsent(item.estado), lines = detailLines(item, context);
    const classes = `tdu ${item === context.next ? "sig" : ""} ${open2 ? "" : "hecha"} ${mini2 ? "tdmini" : ""} tdst-${statusClass(item.estado)}`;
    const details2 = lines.length ? `<ul class="tdu-dat">${lines.map(([iconName, className, html, title2]) => `<li class="${className}"${title2 ? ` title="${escapeHtml(title2)}"` : ""}>${legacyIcons.line(iconName)}<span>${html}</span></li>`).join("")}</ul>` : "";
    return `<article class="${classes}" data-tdu="${item.id}" data-tdf="${item.cuenta_id}" tabindex="0" aria-label="${escapeHtml(item.nombre)}">
      ${headHtml(item, index, context)}
      ${ladderHtml(item, context.ladder)}
      ${details2}
      ${footHtml(item, context)}
    </article>`;
  }

  // src/app/screens/agenda/your-day/header.ts
  var DAY_MINUTES = 24 * 60;
  function compactButton(compact2) {
    const title2 = t(compact2 ? "agenda.yourDay.showDetail" : "agenda.yourDay.compactTitle"), label = t(compact2 ? "agenda.yourDay.showDetail" : "agenda.yourDay.compactLabel");
    return `<button type="button" class="btn sec chico plic" id="tdcompactar" aria-pressed="${String(compact2)}" title="${title2}" aria-label="${label}">${legacyIcons.list(compact2 ? "file-text" : "list")}</button>`;
  }
  function setCompactButton(button2, compact2) {
    button2.title = t(compact2 ? "agenda.yourDay.showDetail" : "agenda.yourDay.compactTitle");
    button2.setAttribute("aria-label", t(compact2 ? "agenda.yourDay.showDetail" : "agenda.yourDay.compactLabel"));
    button2.innerHTML = legacyIcons.list(compact2 ? "file-text" : "list");
    button2.setAttribute("aria-pressed", String(compact2));
  }
  function statsHtml(summary3) {
    const end = summary3.open && !summary3.isPast ? `<span>${t("agenda.yourDay.estimatedEnd")} <b style="color:${summary3.overReturn ? "var(--warn)" : "var(--navy)"}">${formatMinutes(summary3.end)}</b>${summary3.overReturn ? t("agenda.yourDay.overReturn") : ""}${summary3.end >= DAY_MINUTES ? ` <span class="sm">${t("agenda.yourDay.nextDay")}</span>` : ""}</span>` : "";
    return `<div class="tdstats">
          <span>${t("agenda.yourDay.appointments", { count: formatNumber(summary3.active) })}</span>
          <span>${t("agenda.yourDay.visited", { count: formatNumber(summary3.done) })}</span>
          ${summary3.absent ? `<span>${t("agenda.yourDay.absent", { count: formatNumber(summary3.absent) })}</span>` : ""}
          <span>${t("agenda.yourDay.toDo", { count: summary3.open })}</span>
          ${end}
        </div>`;
  }
  function workingDayButton(summary3) {
    if (!summary3.isToday || !summary3.isOwner) return "";
    if (summary3.workingDay) return `<button class="btn dang chico" id="tdterminar">${t("agenda.yourDay.endDay")}</button>`;
    return summary3.open ? `<button class="btn chico" id="tdempezar">${t("agenda.yourDay.startDay")}</button>` : "";
  }
  function actionsHtml2(summary3) {
    const { isPast, own, open: open2, withPlace } = summary3;
    return `<div class="acts">
        ${own ? `<button type="button" class="btn sec chico" id="tdtarea">${t("agenda.yourDay.addTask")}</button>` : ""}
        ${!isPast && withPlace > 1 ? `<button class="btn sec chico" id="tdordenar" title="${t("agenda.yourDay.orderTitle")}">${t("agenda.yourDay.orderByDistance")}</button>` : ""}
        ${workingDayButton(summary3)}
        ${isPast && open2 ? `<button class="btn chico" id="tdrepro">${t("agenda.yourDay.reschedulePending")}</button>` : ""}
      </div>`;
  }
  function headerHtml4(summary3) {
    const title2 = t(summary3.isToday ? "agenda.yourDay.titleToday" : summary3.isPast ? "agenda.yourDay.titlePast" : "agenda.yourDay.titleFuture");
    const dayMenu = summary3.isFutureOrToday ? `<button type="button" class="kmv tddiamas" id="tddiamas" aria-label="${t("agenda.yourDay.dayOptions")}" title="${t("agenda.yourDay.dayOptionsTitle")}">${legacyIcons.line("mas")}</button>` : "";
    return `
    <div class="tdhead">
      <div class="${summary3.isFutureOrToday ? "tdtitw" : ""}"><h2 style="padding:0">${title2}</h2>${summary3.mine > 1 ? compactButton(summary3.compact) : ""}${dayMenu}
        ${statsHtml(summary3)}</div>
      ${actionsHtml2(summary3)}
    </div>`;
  }
  function workingDayHtml(summary3, duration) {
    return summary3.isToday && summary3.workingDay ? `<div class="tdjornada">${t("agenda.yourDay.workingDay", { time: duration, visit: summary3.visit })}</div>` : "";
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
        <span class="tx"><b>${escapeHtml(item.nombre)}</b><span class="sm">${escapeHtml(item.usuario ?? "")} · ${statePill3(item.estado)}</span></span></div>`).join("")}</div>`;
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
  function bind5(block4) {
    block4.querySelectorAll("[data-tacheck]").forEach((box) => {
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
    const block4 = document.getElementById("tdtareas");
    if (block4) bind5(block4);
  }
  function applyTaskFolding() {
    const block4 = document.getElementById("tdtareas"), header = block4?.querySelector(".tdtcab");
    if (!block4 || !header) return;
    block4.classList.toggle("plegadas", folded());
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
    const open2 = mine.filter((item) => isOpen(item.estado)), limit = Number.isFinite(estimate.tope) ? estimate.tope : DEFAULT_LIMIT;
    const warnings = Object.values(info).filter((stop) => stop.aviso && !stop.lejos).length;
    const overLimit = !isPast && open2.length > 0 && estimate.fin > limit, banner = !isPast && open2.length > 0 && (overLimit || warnings >= WARNINGS_FOR_BANNER);
    const now = (/* @__PURE__ */ new Date()).getHours() * 60 + (/* @__PURE__ */ new Date()).getMinutes(), withPlace = open2.filter((item) => pointOf(item)).length;
    const viewed = legacyAgenda.viewedUserId(), visit2 = term("visita");
    const context = {
      day,
      isPast,
      now,
      visit: visit2,
      estimates: estimate.est,
      info,
      open: open2,
      next: day === today ? nextOf(open2, estimate.est, now) : null,
      ladder: commercialStates.all().filter((step) => step.papel !== "negativo"),
      noFitBanner: banner,
      limit
    };
    const summary3 = {
      isToday: day === today,
      isPast,
      isFutureOrToday: day >= today,
      mine: mine.length,
      active: mine.filter((item) => !isCancelled(item.estado)).length,
      done: mine.filter((item) => isDone(item.estado)).length,
      absent: mine.filter((item) => isAbsent(item.estado)).length,
      open: open2.length,
      end: estimate.fin,
      overReturn: open2.length > 0 && estimate.fin > estimate.tope,
      withPlace,
      own: !viewed || agendaSources.isOwnAgenda(),
      isOwner: agendaSources.isOwnAgenda(),
      workingDay: yourDayLegacy.workingDay(),
      compact: compact(),
      visit: visit2
    };
    const outside = Object.values(info).filter((stop) => stop.llegada !== null && stop.llegada !== void 0 && stop.llegada >= limit).length;
    return { context, summary: summary3, noFit: { shown: banner, overLimit, end: estimate.fin, outside, canOrder: !isPast && withPlace > 1 } };
  }
  function on(id, action) {
    const button2 = document.getElementById(id);
    if (button2) button2.onclick = action;
  }
  function bindHeader2(data, open2) {
    on("tdempezar", () => {
      yourDayLegacy.startWorkingDay();
    });
    on("tdterminar", () => {
      yourDayLegacy.endWorkingDay();
    });
    on("tdrepro", () => {
      agendaActions.reschedule(open2, t("agenda.yourDay.pendingOf", { date: formatShortDate(data.day) }), t("agenda.yourDay.notVisitedThatDay"));
    });
    on("tddiamas", (event) => {
      event.stopPropagation();
      const stripDay = document.querySelector(`#agcinta [data-cf="${data.day}"]`), button2 = document.getElementById("tddiamas");
      if (button2) legacyAgendaParts.dayMenu(button2, data.day, Boolean(stripDay?.classList.contains("bloq")));
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
    const { context, summary: summary3, noFit } = buildContext(data, yourDayLegacy.estimateDay(data.mine, day));
    const cards = data.mine.length ? `<div class="tdesc" aria-label="${t("agenda.yourDay.dayAppointments")}">${data.mine.map((item, index) => appointmentCard(item, index, context)).join("")}</div>` : `<div class="vacio">${t(summary3.isToday ? "agenda.yourDay.emptyToday" : "agenda.yourDay.emptyOther")}</div>`;
    body2.innerHTML = `${headerHtml4(summary3)}
    ${workingDayHtml(summary3, summary3.workingDay ? formatDuration(Date.now() - summary3.workingDay.inicio) : "")}
    ${noFitHtml(noFit)}
    ${cards}
    ${othersHtml(data.others)}`;
    bindHeader2(data, context.open);
    refreshMetrics();
    yourDayLegacy.prepareRouteStops(day);
    if (!summary3.own) return;
    const tasks = await agendaSources.dayTasks(day);
    const fresh = document.getElementById("agcuerpo");
    if (legacyAgenda.selectedDate() === day && fresh) paintTasks(fresh, tasks);
  }
  function markQueuedVisits() {
    const day = legacyAgenda.selectedDate();
    const queued = yourDayLegacy.queuedVisits().filter((item) => item.fn === "registrar_actividad" && item.payload?.p?.fecha === day);
    const byId = new Map(legacyAgenda.dayAppointments().map((item) => [String(item.id), item]));
    document.querySelectorAll("#agcuerpo .tdu[data-tdu]").forEach((card2) => {
      const item = byId.get(card2.dataset.tdu ?? "");
      if (!item) return;
      const pending = queued.some((entry) => entry.payload?.p?.cuenta_id === item.cuenta_id);
      if (card2.classList.contains("tdpend") !== pending) card2.classList.toggle("tdpend", pending);
      const mark = card2.querySelector(".tdpendm");
      if (pending && !mark) card2.querySelector(".tdu-pie")?.insertAdjacentHTML("afterbegin", `<span class="tdpendm">${t("agenda.yourDay.queued")}</span>`);
      if (!pending && mark) mark.remove();
      card2.querySelectorAll('[data-td^="visita|"]').forEach((button2) => {
        if (button2.classList.contains("hide") !== pending) button2.classList.toggle("hide", pending);
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
      const button2 = event.target instanceof Element ? event.target.closest("#tdcompactar") : null;
      if (!button2) return;
      const value10 = !compact();
      try {
        localStorage.setItem(COMPACT_KEY, value10 ? "1" : "0");
      } catch {
      }
      applyCompact();
      setCompactButton(button2, value10);
    });
    document.addEventListener("click", (event) => {
      const button2 = event.target instanceof Element ? event.target.closest("[data-tdavi]") : null;
      if (!button2) return;
      event.stopPropagation();
      const info = yourDayLegacy.stopInfo()[button2.dataset.tdavi ?? ""];
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
    document.querySelectorAll(selector).forEach((element2) => {
      positions.set(element2.dataset[key] ?? "", element2.getBoundingClientRect().top);
    });
    return positions;
  }
  function highlight(element2) {
    element2.classList.remove(HIGHLIGHT_CLASS);
    void element2.offsetWidth;
    element2.classList.add(HIGHLIGHT_CLASS);
    setTimeout(() => {
      element2.classList.remove(HIGHLIGHT_CLASS);
    }, HIGHLIGHT_MS);
  }
  function slideIntoPlace(before, options) {
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.querySelectorAll(options.selector).forEach((element2) => {
      const id = element2.dataset[options.key] ?? "";
      if (options.touched && id === String(options.touched)) highlight(element2);
      const top = before.get(id);
      if (still || top === void 0) return;
      const shift = top - element2.getBoundingClientRect().top;
      if (Math.abs(shift) > 1) element2.animate([{ transform: `translateY(${shift}px)` }, { transform: "none" }], { duration: options.durationMs, easing: EASING });
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
    return new Map((rows ?? []).map((row4) => [row4.fecha, row4.n]));
  }

  // src/app/screens/home/indicators/charts-activity.ts
  function dotKind2(item, next) {
    if (appointments.isOpen(item.estado)) return item === next ? "sig" : "";
    return commercialStates.color(item.estado) === "var(--warn)" ? "no" : "ok";
  }
  function appointmentsChart(panel, kpis) {
    const list = (panel.agenda_hoy ?? []).filter((item) => !appointments.isCancelled(item.estado));
    const open2 = list.filter((item) => appointments.isOpen(item.estado));
    const now = /* @__PURE__ */ new Date(), minutesNow = now.getHours() * 60 + now.getMinutes();
    const next = open2.find((item) => (minutesOf2(item.hora) ?? 9999) >= minutesNow - 15) ?? open2[0];
    const time = (item, empty2) => escapeHtml(String(item.hora ?? "").slice(0, 5) || empty2);
    const summary3 = next ? t("home.indicators.nextAppointment", { time: time(next, "—"), name: escapeHtml(next.nombre) }) : t(list.length ? "home.indicators.allClosed" : "home.indicators.noAppointmentsToday");
    const visible = isMobile() ? 3 : 5;
    const nextIndex = next ? list.indexOf(next) : 0;
    const start2 = Math.max(0, Math.min(nextIndex - (visible >> 1), list.length - visible)), shown4 = list.slice(start2, start2 + visible);
    const more = Math.max(0, nonZeroOr(kpis.citas_hoy, list.length) - shown4.length);
    const dots = shown4.map((item) => `<span class="kvdot"><i class="${dotKind2(item, next)}" title="${escapeHtml(item.nombre)}"></i><em>${time(item, "·")}</em></span>`).join("");
    return { summary: summary3, visual: list.length ? `<div class="kvdots">${dots}${more > 0 ? `<span class="kvdot"><em class="kvmas">+${more}</em></span>` : ""}</div>` : "" };
  }
  function urgentChart(kpis) {
    if (kpis.urgentes) return { summary: t("home.indicators.urgentPending", { count: formatNumber(kpis.urgentes) }), visual: '<div class="kvradar" aria-hidden="true"><i></i><b></b><b></b></div>' };
    return { summary: t("home.indicators.noneUrgent"), visual: `<div class="kvcalma"><span>${lineIcon('<path d="M20 6 9 17l-5-5"/>')}</span>${t("home.indicators.allUpToDate")}</div>` };
  }
  function weekSummary(week, today) {
    const { upcoming: upcoming2, days, values, perDay } = week;
    if (upcoming2) {
      const busiest = values.indexOf(Math.max(...values));
      const day = days[busiest];
      return values[busiest] && day ? t("home.indicators.busiestDay", { weekday: weekdayName(day), count: values[busiest] ?? 0 }) : t("home.indicators.freeWeek");
    }
    const fourWeeks = sum(range(28).map((i) => perDay.get(addDays(mondayOf(today), -28 + i)) ?? 0)) / 20;
    return t("home.indicators.fourWeekAverage", { average: String(fourWeeks.toFixed(1)).replace(".", ",") });
  }
  function weekChart(id, charts, today) {
    const upcoming2 = id === "citas_7d";
    const days = range(7).map((i) => upcoming2 ? addDays(today, i) : addDays(mondayOf(today), i));
    const perDay = countsByDate(charts.por_dia), nextDays = countsByDate(charts.proximos);
    const values = days.map((day) => (upcoming2 ? nextDays.get(day) : perDay.get(day)) ?? 0);
    const max = Math.max(1, ...values), width = 196, barWidth = 18, gap = (width - 7 * barWidth) / 6;
    const bars2 = values.map((value10, i) => {
      const day = days[i] ?? today, height = Math.max(3, value10 / max * 40), x = i * (barWidth + gap), future = !upcoming2 && day > today, isToday = day === today;
      const fill2 = future ? "#E3EBF3" : isToday ? "var(--sky)" : "var(--navy)";
      return `<rect x="${x}" y="${44 - height}" width="${barWidth}" height="${height}" rx="4" fill="${fill2}" opacity="${value10 ? 1 : 0.35}"/><text x="${x + barWidth / 2}" y="58" text-anchor="middle" class="${isToday ? "hoy" : ""}">${WEEKDAY_LETTERS[fromIsoDate(day).getDay()] ?? ""}</text>`;
    }).join("");
    return { summary: weekSummary({ upcoming: upcoming2, days, values, perDay }, today), visual: `<svg class="kvbar" viewBox="0 0 ${width} 60" preserveAspectRatio="xMidYMax meet" aria-hidden="true">${bars2}</svg>` };
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
    const x = (i) => i / (dayOfMonth - 1) * width, y = (value10) => height - value10 / max * height;
    const line2 = (values) => values.map((value10, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(value10).toFixed(1)}`).join("");
    const end = current[current.length - 1] ?? 0, difference2 = end - (last[last.length - 1] ?? 0);
    return {
      summary: t(difference2 >= 0 ? "home.indicators.aboveLastMonth" : "home.indicators.belowLastMonth", { difference: difference2 }),
      visual: `<svg class="kvlin" viewBox="0 0 ${width} ${height + 12}" preserveAspectRatio="none" aria-hidden="true"><path d="${line2(last)}" fill="none" stroke="#C9D7E6" stroke-width="2" stroke-dasharray="4 4"/>
        <path class="l" d="${line2(current)}" pathLength="100" fill="none" stroke="var(--navy)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
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
    const counts = new Map((charts.estados ?? []).map((row4) => [row4.valor, row4.n]));
    return commercialStates.all().filter((state) => state.papel !== "negativo").map((state) => ({ state, accounts: counts.get(state.valor) ?? 0 }));
  }
  function portfolioTotal(charts) {
    return sum((charts.estados ?? []).map((row4) => row4.n));
  }
  var color = (role) => STATE_COLORS[role] ?? "#C9D7E6";
  function interestedChart(charts) {
    const counts = stateCounts(charts), steps3 = counts.filter((count2) => count2.state.papel !== "inicial");
    if (!steps3.length) return EMPTY_CHART;
    const max = Math.max(1, ...steps3.map((count2) => count2.accounts)), width = 196, barWidth = width / steps3.length;
    const columns = steps3.map((count2, i) => {
      const on2 = count2.state.papel === "interes", height = Math.max(4, count2.accounts / max * 28);
      const name = count2.state.valor.length > 11 ? `${count2.state.valor.slice(0, 10)}.` : count2.state.valor;
      return `<rect x="${i * barWidth + 4}" y="${34 - height}" width="${barWidth - 8}" height="${height}" rx="4" fill="${on2 ? "var(--navy)" : "#DCE6F1"}"/><text x="${i * barWidth + barWidth / 2}" y="${30 - height}" text-anchor="middle" class="n ${on2 ? "on" : ""}">${count2.accounts}</text><text x="${i * barWidth + barWidth / 2}" y="48" text-anchor="middle" class="${on2 ? "on" : ""}">${escapeHtml(name)}</text>`;
    }).join("");
    const positive = counts.find((count2) => count2.state.papel === "positivo");
    const state = positive ? escapeHtml(positive.state.valor) : "";
    const summary3 = positive ? positive.accounts ? t("home.indicators.alreadyIn", { count: positive.accounts, state }) : t("home.indicators.nextStep", { state }) : "";
    return { summary: summary3, visual: `<svg class="kvbar" viewBox="0 0 ${width} 52" preserveAspectRatio="xMidYMax meet" aria-hidden="true">${columns}</svg>` };
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
    const percent2 = Math.round((kpis.sin_visita_60 ?? 0) / Math.max(1, kpis.medicos ?? 0) * 100);
    return {
      summary: t("home.indicators.shareOfPortfolio", { percent: percent2 }),
      visual: `<div class="kvpropw"><div class="kvprop"><i style="width:${percent2}%"></i></div><div class="kvpropt"><span><i class="kvq a"></i>${t("home.indicators.noVisitIn60Days", { visit: term("visita") })}</span><span><i class="kvq b"></i>${t("home.indicators.theRest")}</span></div></div>`
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
  function helpButton(help, title2) {
    return help ? `<button class="ai" data-ayuda-txt="${escapeHtml(help)}" data-ayuda-tit="${escapeHtml(title2)}" aria-label="${t("home.indicators.whatIsIt")}">i</button>` : "";
  }
  function figure(raw) {
    const text2 = String(raw), fraction = /^(\d+)\/(\d+)$/.exec(text2);
    if (fraction) return `<b data-kvn="${fraction[1] ?? ""}">0</b><span class="kvu">/${fraction[2] ?? ""}</span>`;
    return /^\d+$/.test(text2) ? `<b data-kvn="${text2}">0</b>` : `<b>${escapeHtml(text2)}</b>`;
  }
  function indicatorCard(definition, setting, context) {
    const title2 = setting.t ? setting.t : definition.t;
    const classes = `kpi ${definition.cls ? definition.cls(context.kpis) : ""} ${definition.h ? "click" : ""}${context.panel ? " kv" : ""}`;
    const action = definition.h ? ` data-k="${definition.h}"` : "";
    const icon2 = indicatorCatalog.icon(definition.id), description = indicatorCatalog.description(definition.id);
    const help = helpButton(indicatorCatalog.help(definition.id), title2);
    const raw = definition.v(context.kpis);
    const body2 = context.panel ? liveBody(definition.id, capitalise(title2).trim(), raw, context) : `
       ${help}
       <b>${typeof raw === "string" ? raw : formatNumber(raw)}</b><span>${escapeHtml(capitalise(title2))}</span>`;
    return `<div class="${classes}"${action} data-kid="${definition.id}" data-comp="1">${icon2 ? `<span class="kico" aria-hidden="true">${icon2}</span>` : ""}${context.panel ? help : ""}${body2}${description ? `<em class="kdesc">${escapeHtml(description)}</em>` : ""}</div>`;
  }
  function liveBody(id, title2, raw, context) {
    const { summary: summary3, visual } = chartFor(id, context.kpis, context.panel, context.charts);
    return `<div class="kvt">${escapeHtml(title2)}</div>
      <div class="kvn">${figure(raw)}</div>
      <div class="kvs">${summary3}</div>${visual ? `<div class="kvz">${visual}</div>` : ""}`;
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
    const start2 = performance.now();
    const step = (now) => {
      const progress = Math.min(1, (now - start2) / COUNT_DURATION_MS), eased = 1 - Math.pow(1 - progress, 3);
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
    const [areas, pendingOps, stock, cycle3, calls, dayAppointments, tasks] = await Promise.all(requests(today));
    if (!homeCache.panel()) homeCache.setPanel(await valueOf(legacyDb().rpc("panel_inicio")));
    return {
      today,
      areas: areas ?? {},
      pendingOps,
      stock: stock ?? [],
      cycle: cycle3,
      calls,
      appointments: dayAppointments,
      tasks: tasks ?? [],
      kpis: homeCache.panel()?.kpis ?? {},
      visitsPerDay: homeCache.charts()?.por_dia ?? []
    };
  }

  // src/app/screens/home/attention.ts
  function collectionItems(data, add2) {
    const collections = data.areas.cobros;
    if (!collections || !permissions.canSeeArea("facturacion")) return;
    add2({
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
  function urgentItems(data, add2, pending) {
    add2({
      count: pending("pago"),
      priority: "alta",
      icon: "credit-card",
      title: t("home.attention.pendingPayment"),
      detail: t("home.attention.pendingPaymentDetail"),
      open: () => {
        goToOrders("ventas");
      }
    });
    add2({
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
      add2({
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
  function callBackItem(data, add2) {
    if (!data.calls) return;
    const due = data.calls.filter((call) => call.proxima_fecha && call.proxima_fecha <= data.today);
    const late = due.some((call) => (call.proxima_fecha ?? "") < data.today);
    add2({
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
  function operationItems(data, add2, pending) {
    add2({
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
      add2({
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
    callBackItem(data, add2);
  }
  function otherItems(data, add2, pending) {
    if (permissions.canSeeArea("concursos")) {
      add2({
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
    add2({
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
      add2({
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
    const add2 = (candidate) => {
      if (candidate.count) items.push({ ...candidate, count: candidate.count });
    };
    const pending = (key) => (data.pendingOps?.[key] ?? []).length;
    collectionItems(data, add2);
    urgentItems(data, add2, pending);
    operationItems(data, add2, pending);
    otherItems(data, add2, pending);
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
    const visits2 = term("visita", { number: "p", capital: "C" });
    return `<div class="mbars" role="img" aria-label="${t("home.sales.chartLabel", { visits: visits2 })}">${days.map((day) => `<i class="${day === data.today ? "h" : ""}" style="height:${Math.max(4, 100 * (perDay.get(day) ?? 0) / max)}%"></i>`).join("")}</div>
      <div class="mleg">${t("home.sales.chartLegend", { visits: visits2 })}</div>`;
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
    const open2 = data.appointments.filter((item) => appointments.isOpen(item.estado));
    const done = data.appointments.filter((item) => !appointments.isOpen(item.estado) && !appointments.isCancelled(item.estado)).length;
    const alive = data.appointments.filter((item) => !appointments.isCancelled(item.estado)).length;
    const pendingTasks = data.tasks.filter((task) => !task.hecha).length;
    const list = open2.slice(0, 4).map((item) => `<div><b>${escapeHtml(String(item.hora ?? "").slice(0, 5) || "—")}</b><span>${escapeHtml(item.medico ?? item.nombre ?? "")}</span></div>`).join("");
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
    const summary3 = data.cycle?.resumen ?? [];
    if (!summary3.length) return "";
    const done = summary3.reduce((sum2, row4) => sum2 + row4.hechas, 0), target = summary3.reduce((sum2, row4) => sum2 + row4.objetivo, 0);
    const percent2 = target ? Math.round(100 * done / target) : 0, circumference = 2 * Math.PI * 30;
    return `<div class="mt mtcic"><div class="mtt">${icon("target")} ${t("home.cycle.title", { visits: term("visita", { number: "p" }) })}</div>
      <div class="mfila"><svg class="mring" viewBox="0 0 70 70" aria-hidden="true"><circle class="f" cx="35" cy="35" r="30"/><circle class="v" cx="35" cy="35" r="30" style="stroke-dasharray:${circumference * percent2 / 100} ${circumference}"/></svg>
      <div><div class="mn1" style="margin:0"><span data-mcnt="${percent2}">${percent2}</span> %</div><div class="ms"><b>${done}</b>${t("home.cycle.progress", { target, days: data.cycle?.quedan_dias ?? 0 })}</div></div></div></div>`;
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
    const months2 = t("dates.monthsShort").split(","), weekdays = t("dates.weekdaysShort").split(",");
    const rows = items.slice(0, 6).map((item) => {
      const date = fromIsoDate(item.fecha);
      return `<div class="me"><span class="md">${date.getDate()} ${months2[date.getMonth()] ?? ""}<small>${weekdays[date.getDay()] ?? ""}</small></span><span class="mp ${item.tipo}"></span><span class="mtx"><b>${escapeHtml(item.titulo)}</b><span>${escapeHtml(item.sub ?? "")}</span></span></div>`;
    }).join("");
    return `<div class="mt mtprox"><div class="mtt">${icon("clock")} ${t("home.upcoming.title")}</div><div class="mtl2">${rows}</div></div>`;
  }

  // src/app/screens/home/view.ts
  var SKELETON_WIDTHS = [64, 82, 56, 74, 60];
  var COUNT_DURATION_MS2 = 900;
  function screen() {
    return document.getElementById("v-inicio");
  }
  function mosaicBox(section2) {
    const existing = document.getElementById("inimos");
    if (existing) return existing;
    const greeting = section2.querySelector(":scope > .saludo");
    if (!greeting) return null;
    greeting.insertAdjacentHTML("afterend", `<div id="inimos" class="inimos"></div><div class="inikpisb"><button type="button" class="btn sec" id="inikpisver">${t("home.showIndicators")}</button></div>`);
    const toggle = document.getElementById("inikpisver");
    if (toggle) {
      toggle.onclick = () => {
        const shown4 = !section2.classList.contains("conkpis");
        section2.classList.toggle("conkpis", shown4);
        toggle.textContent = t(shown4 ? "home.hideIndicators" : "home.showIndicators");
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
    const section2 = screen();
    if (!section2?.querySelector(":scope > .saludo")) return;
    section2.classList.add("conmos");
    const box = mosaicBox(section2);
    if (!box || box.children.length) return;
    box.innerHTML = skeletonTile("mtat", 6) + skeletonTile("mthoy", 4) + skeletonTile("", 2) + skeletonTile("", 2) + skeletonTile("mtprox", 3);
  }
  function countUp2(box) {
    const figures = [...box.querySelectorAll("[data-mcnt], [data-meur]")];
    if (alreadyCounted("mos", figures.map((el) => el.dataset.mcnt ?? el.dataset.meur ?? ""))) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start2 = performance.now();
    const step = (now) => {
      const progress = Math.min(1, (now - start2) / COUNT_DURATION_MS2), eased = 1 - Math.pow(1 - progress, 3);
      figures.forEach((el) => {
        const euros2 = el.dataset.meur;
        el.textContent = euros2 === void 0 ? formatNumber(Math.round(Number(el.dataset.mcnt) * eased)) : formatEuros(Number(euros2) * eased);
      });
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  function renderMosaic(data) {
    const section2 = screen();
    if (!section2) return;
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
    const box = mosaicBox(section2);
    if (!box) return;
    box.innerHTML = html;
    box.querySelectorAll("[data-mat]").forEach((button2) => {
      button2.onclick = () => {
        items[Number(button2.dataset.mat)]?.open();
      };
    });
    const plan = box.querySelector("[data-mplan]");
    if (plan) plan.onclick = () => {
      goTo("agenda");
    };
    section2.classList.add("conmos");
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
    const button2 = document.querySelector(`#agcuerpo .tdu [data-td="${action}|${id}"]:not([disabled])`) ?? document.querySelector(`#agcuerpo .tdu [data-td$="|${id}"]`);
    button2?.focus({ preventScroll: true });
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
    const button2 = document.querySelector(`#tdtareas [data-tamov="${direction}|${id}"]:not([disabled])`) ?? document.querySelector(`#tdtareas [data-tamov$="|${id}"]:not([disabled])`);
    button2?.focus({ preventScroll: true });
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
    const state = action === "confirmar" ? STATES4.confirmed : action === "desconfirmar" ? STATES4.planned : STATES4.discarded;
    const result = await appointmentLegacy.write("estado_cita", { p_id: item.id, p_estado: state });
    if (result?.error) {
      notices.toast(t("agenda.actions.couldNotChange"), true);
      return;
    }
    notices.toast(t(state === STATES4.confirmed ? "agenda.actions.confirmed" : state === STATES4.discarded ? "agenda.actions.discarded" : "agenda.actions.unconfirmed"));
    refresh(item);
  }
  async function remove2(item) {
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
    const { data: result, error } = await legacyDb().rpc("aplazar_cita", { p_id: item.id, p_fecha: day, p_hora: null, p_origen: STATES4.postponed });
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
    borrar: remove2,
    aplazar: postpone,
    noestaba: absent,
    nueva: (item) => appointmentLegacy.newDateAfterAbsent(item),
    rehacer: planAgain
  };
  async function runAction(action, item) {
    await ACTIONS[action](item);
  }
  var timeOf3 = (item) => item.hora ? String(item.hora).slice(0, 5) : null;
  function orderByTime(open2, id, time) {
    const moved = open2.find((item) => item.id === id);
    if (!moved || !time) return open2;
    const rest = open2.filter((item) => item.id !== id);
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
    const open2 = data.filter((item) => mine(item) && isOpen(item.estado)), order = orderByTime(open2, id, time);
    const changed = order.some((item, index) => item.id !== open2[index]?.id);
    const next = changed ? [...data.filter((item) => mine(item) && !isOpen(item.estado)), ...order, ...data.filter((item) => !mine(item))] : data;
    await repaintSmoothly(id, next);
    if (changed && !await saveOrder(order)) refreshQuietly(id);
  }

  // src/app/screens/agenda/appointment-menu.ts
  function openMenu(button2, item) {
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
    const rect = button2.getBoundingClientRect();
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
  var row2 = (label, value10) => `<div class="vcfila"><span>${label}</span><b>${value10}</b></div>`;
  function dataHtml(item, info) {
    const where = [item.centro_nombre, item.direccion, item.municipio].filter(Boolean).join(" · "), timetable = timetableText2(item, info), origin = yourDayLegacy.originText(item);
    return `<div class="vcdatos">
      ${row2(t("agenda.sheet.when"), `${escapeHtml(capitalise(formatLongDate(item.fecha)))} · ${escapeHtml(timeText2(item, info))}`)}
      ${row2(t("agenda.sheet.where"), escapeHtml(where || t("agenda.sheet.noCentre")))}
      ${timetable ? row2(t("agenda.sheet.timetable"), escapeHtml(timetable)) : ""}
      ${row2(t("agenda.sheet.state"), `${statePill3(item.estado)}${origin ? ` <span class="sm">${origin}</span>` : ""}`)}
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
    const open2 = isOpen(item.estado), today = todayIso();
    return `<div class="vcacts">
      <button type="button" class="btn sec" id="vcficha">${t("agenda.sheet.seeCard")}</button>
      ${pointOf(item) ? `<button type="button" class="btn sec" id="vcllegar">${t("agenda.sheet.directions")}</button>` : ""}
      ${open2 ? `<button type="button" class="btn sec" id="vchora">${t("agenda.sheet.changeTime")}</button><button type="button" class="btn sec" id="vcmover">${t("agenda.sheet.moveDay")}</button>` : ""}
    ${canPlanAgain(item, today) ? `<button type="button" class="btn sec" id="vcrehacer">${t("agenda.sheet.planAgain")}</button>` : ""}${item.estado === STATES4.postponed ? goToButton(item.aplazada_a_fecha, "agenda.sheet.goTo", "vcirdest", item) : ""}${goToButton(item.aplazada_de_fecha, "agenda.sheet.seeDay", "vcirorig", item)}</div>
    ${open2 ? `<div class="vcfin">
        <button type="button" class="lnk" id="vcdescartar">${t("agenda.sheet.discard")}</button><span class="sm">${t("agenda.sheet.discardText")}</span>
        ${item.fecha >= today ? `<button type="button" class="lnk peligro" id="vcborrar">${t("agenda.sheet.delete")}</button><span class="sm">${t("agenda.sheet.deleteText")}</span>` : ""}</div>` : ""}
    <div class="acts" style="justify-content:flex-end">
      <button type="button" class="btn sec" id="vcok" disabled>${t("agenda.sheet.saveNotes")}</button>
      ${open2 && yourDayLegacy.canRecordOn(item.fecha) ? `<button type="button" class="btn" id="vcreg">${t("agenda.sheet.record", { visit: term("visita") })}</button>` : ""}</div>`;
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
  async function saveNotes(item, notes, button2) {
    button2.disabled = true;
    const value10 = notes.value.trim();
    const { error } = await legacyDb().from("agenda").update({ nota: value10 || null }).eq("id", item.id);
    if (error) {
      button2.disabled = false;
      notices.toast(t("agenda.sheet.couldNotSave", { error: error.message ?? "" }), true);
      return;
    }
    item.nota = value10;
    close();
    notices.toast(t("agenda.sheet.notesSaved"));
    refreshQuietly(item.id, false);
  }
  function bind6(body2, item) {
    const notes = body2.querySelector("#vcnota"), save13 = body2.querySelector("#vcok");
    if (notes && save13) {
      notes.oninput = () => {
        save13.disabled = notes.value.trim() === (item.nota ?? "").trim();
      };
      save13.onclick = () => {
        void saveNotes(item, notes, save13);
      };
    }
    const on2 = (id, action) => {
      const button2 = body2.querySelector(`#${id}`);
      if (button2) button2.onclick = action;
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
    body2.querySelectorAll("[data-vcdia]").forEach((button2) => {
      button2.onclick = () => {
        close();
        agendaState.setMode("dia");
        legacyAgenda.showDay(button2.dataset.vcdia ?? "");
      };
    });
  }
  function fillVisitResult(item) {
    if (!isDone(item.estado) || !item.cuenta_id) return;
    legacyDb().from("actividades").select("resultados, hora").eq("cuenta_id", item.cuenta_id).eq("fecha", item.fecha).limit(1).then(({ data }) => {
      const visit2 = data?.[0], place = document.getElementById("vccomo");
      if (!visit2 || !place) return;
      const results = Array.isArray(visit2.resultados) ? visit2.resultados.filter(Boolean).join(", ") : visit2.resultados ?? "";
      place.textContent = t("agenda.sheet.recorded", { visit: term("visita"), time: visit2.hora ? t("agenda.sheet.recordedAt", { time: String(visit2.hora).slice(0, 5) }) : "", results: results ? `: ${results}` : "" });
    }, () => void 0);
  }
  function showAppointment(item) {
    const body2 = document.getElementById("dbody"), box = dialog();
    if (!item || !body2 || !box) return;
    body2.innerHTML = sheetHtml(item, yourDayLegacy.stopInfo()[item.id] ?? {});
    bind6(body2, item);
    fillVisitResult(item);
    box.classList.add("pequena");
    box.showModal();
  }

  // src/app/screens/agenda/editors/appointment-editor.ts
  var timeOf4 = (item) => item.hora ? String(item.hora).slice(0, 5) : null;
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
    const open2 = (data ?? []).filter((item) => item.usuario_id === owner && isOpen(item.estado));
    const mine = open2.filter((item) => item.cuenta_id === accountId && timeOf4(item) === time).pop();
    if (!mine) return;
    const rest = open2.filter((item) => item !== mine);
    let index = rest.findIndex((item) => {
      const other = timeOf4(item);
      return other !== null && other > time;
    });
    if (index < 0) {
      index = 0;
      rest.forEach((item, position) => {
        const other = timeOf4(item);
        if (other !== null && other <= time) index = position + 1;
      });
    }
    rest.splice(index, 0, mine);
    if (rest.some((item, position) => item !== open2[position])) {
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
      estado: STATES4.planned,
      origen: orFallback(options.origen, inAgenda ? "Agenda" : "Ficha"),
      usuario_id: editorLegacy.viewedUserId(),
      nota: inputValue("ncn").trim(),
      op_id: `c-${picked.id}-${day}-${Date.now()}`
    } });
  }
  async function save2(draft, options, button2) {
    const picked = draft.picked;
    if (!picked) {
      notices.toast(t("agenda.editor.choose", { professional: term("medico", { article: "un" }) }), true);
      return;
    }
    const day = inputValue("ncf"), time = inputValue("nch");
    if (!await sameDayDecision(picked.id, day) || !await recentDecision(picked.id, day)) return;
    button2.disabled = true;
    const result = await write(picked, draft, options);
    button2.disabled = false;
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
    const shown4 = legacyAgenda.selectedDate(), today = todayIso();
    const body2 = document.getElementById("dbody"), box = document.getElementById("dlg");
    if (!body2 || !box) return;
    body2.innerHTML = windowHtml(day ?? (currentScreen() === "agenda" && shown4 && shown4 >= today ? shown4 : today));
    paintCentres(draft);
    editorLegacy.pickAccount(document.getElementById("ncsel"), draft.picked, async (account) => {
      draft.picked = account;
      await loadAccount(account.id, draft);
      paintCentres(draft);
    });
    const ok = document.getElementById("ncok");
    if (ok) ok.onclick = () => {
      void save2(draft, options, ok);
    };
    box.classList.add("pequena");
    box.showModal();
  }

  // src/app/screens/agenda/editors/task-editor.ts
  var dialog2 = () => document.getElementById("dlg");
  var value2 = (id) => document.getElementById(id)?.value ?? "";
  function afterChange2(message) {
    dialog2()?.close();
    notices.toast(message);
    agendaState.forgetDayTasks();
    void paintYourDay();
  }
  async function remove3(task) {
    if (!await notices.confirm(t("agenda.taskEditor.deleteText"), { titulo: t("agenda.taskEditor.deleteTitle"), ok: t("agenda.taskEditor.delete"), peligro: true })) return;
    const { error } = await legacyDb().from("tareas").delete().eq("id", task.id);
    if (error) {
      notices.toast(t("agenda.taskEditor.couldNotDelete"), true);
      return;
    }
    afterChange2(t("agenda.taskEditor.deleted"));
  }
  async function save3(task, button2) {
    const title2 = value2("tat").trim();
    if (!title2) {
      notices.toast(t("agenda.taskEditor.writeWhat"), true);
      document.getElementById("tat")?.focus();
      return;
    }
    const row4 = { titulo: title2, fecha: value2("taf") || todayIso(), hora: value2("tah") || null, nota: value2("tan").trim() || null, modificado_en: (/* @__PURE__ */ new Date()).toISOString() };
    button2.disabled = true;
    const table = legacyDb().from("tareas");
    const { error } = task.id ? await table.update(row4).eq("id", task.id) : await table.insert(row4);
    button2.disabled = false;
    if (error) {
      notices.toast(t("agenda.sheet.couldNotSave", { error: error.message ?? "" }), true);
      return;
    }
    afterChange2(task.id ? t("agenda.taskEditor.saved") : t("agenda.taskEditor.addedOn", { date: formatDayMonth(row4.fecha) }));
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
  async function reopen(task, day, button2) {
    button2.disabled = true;
    const { error } = await legacyDb().from("tareas").update({ hecha: false, modificado_en: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", task.id);
    button2.disabled = false;
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
      void save3(current, ok);
    };
    const again = document.getElementById("tareabrir");
    if (again) again.onclick = () => {
      void reopen(current, day, again);
    };
    const erase = document.getElementById("taborrar");
    if (erase) erase.onclick = () => {
      void remove3(current);
    };
    show();
  }

  // src/app/screens/events/index.ts
  var events_exports = {};
  __export(events_exports, {
    EVENT_TYPES: () => EVENT_TYPES,
    editEvent: () => editEvent,
    paintEvents: () => paintEvents,
    paintExpenseReport: () => paintExpenseReport,
    showEvent: () => showEvent
  });

  // src/app/screens/events/model.ts
  var EVENT_TYPES = ["Taller", "Curso", "Congreso", "Webinar", "Reunión científica", "Comida de trabajo", "Otro"];
  var ATTENDANCE_STATES = ["Invitado", "Confirmado", "Asistió", "No asistió"];
  var CONCEPTS = ["inscripcion", "viaje", "comida", "honorarios"];
  var MEAL_MAX = 60;
  var conceptLabel = (concept) => t(`events.concepts.${concept}`);
  var attendeeTotal = (attendee) => CONCEPTS.reduce((total, concept) => total + (Number(attendee[concept]) || 0), 0);

  // src/app/screens/events/editor.ts
  var value3 = (id) => document.getElementById(id)?.value ?? "";
  function editorHtml2(event, existing) {
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
    <div class="acts" style="justify-content:flex-end">${canDelete ? `<button type="button" class="btn sec peligro" id="evborrar">${t("events.editor.delete")}</button>` : ""}
      <button type="button" class="btn sec" data-cerrar>${t("events.editor.cancel")}</button><button type="button" class="btn" id="evok">${t(existing ? "events.editor.save" : "events.editor.create")}</button></div>`;
  }
  var repaintListIfShown = () => {
    if (currentScreen() === "eventos") eventsLegacy.repaintList();
  };
  function formRow(title2) {
    return {
      titulo: title2,
      tipo: value3("evtipo"),
      fecha: value3("evf"),
      hora: value3("evh") || null,
      lugar: value3("evl").trim() || null,
      en_linea: Boolean(document.getElementById("evon")?.checked),
      nota: value3("evn").trim() || null
    };
  }
  async function save4(existing, button2) {
    const title2 = value3("evt").trim();
    if (!title2) {
      notices.toast(t("events.editor.writeTitle"), true);
      return;
    }
    if (!value3("evf")) {
      notices.toast(t("events.editor.chooseDate"), true);
      return;
    }
    const row4 = formRow(title2);
    button2.disabled = true;
    const table = legacyDb().from("eventos");
    const result = existing ? await table.update(row4).eq("id", existing.id).select("id").single() : await table.insert(row4).select("id").single();
    button2.disabled = false;
    if (result.error || !result.data) {
      notices.toast(t("events.editor.couldNotSave", { error: result.error?.message ?? "" }), true);
      return;
    }
    notices.toast(t(existing ? "events.editor.saved" : "events.editor.created"));
    relatedLegacy.openEvent(result.data.id);
    repaintListIfShown();
  }
  async function remove4(existing) {
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
    const body2 = document.getElementById("dbody"), box = document.getElementById("dlg");
    if (!body2 || !box) return;
    body2.innerHTML = editorHtml2(existing ?? { fecha: todayIso(), tipo: "Taller", en_linea: false }, existing);
    if (!box.open) box.showModal();
    const ok = document.getElementById("evok");
    if (ok) ok.onclick = () => {
      void save4(existing, ok);
    };
    const erase = document.getElementById("evborrar");
    if (erase && existing) erase.onclick = () => {
      void remove4(existing);
    };
  }

  // src/app/screens/events/list.ts
  var SHOWN_PAST = 50;
  var LIMIT = 200;
  function eventSummary(event) {
    return `${escapeHtml(formatLongDate(event.fecha))}${event.hora ? ` · ${escapeHtml(String(event.hora).slice(0, 5))}` : ""}${event.tipo ? ` · ${escapeHtml(event.tipo)}` : ""} · ${event.en_linea ? t("events.list.online") : escapeHtml(orFallback(event.lugar, t("events.list.noPlace")))}`;
  }
  function eventRow(event) {
    const attendees = event.eventos_asistentes ?? [], total = sum(attendees.map(attendeeTotal));
    const count2 = attendees.length === 1 ? t("events.list.oneAttendee") : t("events.list.attendees", { count: attendees.length });
    return `<button type="button" class="item evrow" data-ev="${event.id}"><span class="tx"><b>${escapeHtml(event.titulo)}</b>
      <span class="sm">${eventSummary(event)} · ${count2}</span></span>
      ${total ? `<span class="evtot">${formatCurrency(total)}</span>` : ""}</button>`;
  }
  var section = (title2, rows, empty2) => `<section class="card evbloque"><h2>${title2}</h2>${rows.length ? `<div class="lista">${rows.map(eventRow).join("")}</div>` : `<div class="vacio vlinea">${empty2}</div>`}</section>`;
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
    const upcoming2 = list.filter((event) => event.fecha >= today).reverse(), past = list.filter((event) => event.fecha < today);
    box.innerHTML = `<div class="evpag"><div class="evcab"><button type="button" class="btn" id="evnuevo">${t("events.list.newEvent")}</button></div>
    ${section(t("events.list.upcoming"), upcoming2, t("events.list.noUpcoming"))}
    ${section(t("events.list.past"), past.slice(0, SHOWN_PAST), t("events.list.noPast"))}</div>`;
    const add2 = document.getElementById("evnuevo");
    if (add2) add2.onclick = () => {
      editEvent(null);
    };
    box.querySelectorAll("[data-ev]").forEach((button2) => {
      button2.onclick = () => {
        relatedLegacy.openEvent(button2.dataset.ev ?? "");
      };
    });
  }

  // src/app/screens/events/report.ts
  var YEARS_SHOWN = 4;
  var BOM = String.fromCharCode(65279);
  var amount = (row4, key) => Number(row4[key]) || 0;
  function tableHtml(rows) {
    const total = (key) => formatCurrency(sum(rows.map((row4) => amount(row4, key))));
    return `<div class="dgrid-wrap"><table class="trtabla"><thead><tr><th>${term("medico", { capital: "C" })}</th><th>${t("events.report.events")}</th>${CONCEPTS.map((concept) => `<th>${conceptLabel(concept)}</th>`).join("")}<th>${t("events.report.total")}</th></tr></thead>
      <tbody>${rows.map((row4) => `<tr><td><b>${escapeHtml(row4.nombre)}</b>${row4.especialidad ? `<span class="sm"> · ${escapeHtml(row4.especialidad)}</span>` : ""}</td><td>${row4.eventos}</td>${CONCEPTS.map((concept) => `<td>${formatCurrency(amount(row4, concept))}</td>`).join("")}<td><b>${formatCurrency(amount(row4, "total"))}</b></td></tr>`).join("")}</tbody>
      <tfoot><tr><td>${t("events.report.total")}</td><td></td>${CONCEPTS.map((concept) => `<td>${total(concept)}</td>`).join("")}<td><b>${total("total")}</b></td></tr></tfoot></table></div>`;
  }
  function download(rows, year) {
    const quote = (value10) => `"${String(value10 ?? "").replace(/"/g, '""')}"`, decimal2 = (value10) => String(Number(value10) || 0).replace(".", ",");
    const header = [term("medico", { capital: "C" }), t("events.report.code"), term("especialidad", { capital: "C" }), t("events.report.events"), ...CONCEPTS.map(conceptLabel), t("events.report.total")].map(quote).join(";");
    const lines = rows.map((row4) => [quote(row4.nombre), quote(row4.codigo), quote(row4.especialidad), row4.eventos, ...CONCEPTS.map((concept) => decimal2(row4[concept])), decimal2(row4.total)].join(";"));
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
    const current = Number(todayIso().slice(0, 4)), shown4 = year ?? current - 1;
    const { data } = await legacyDb().rpc("transparencia_anual", { p_anio: shown4 });
    const box = document.getElementById("cfgcuerpo");
    if (!box || currentScreen() !== "eventos") return;
    const rows = data?.filas ?? [];
    box.innerHTML = `<div class="evpag"><div class="evcab"><label for="trano">${t("events.report.year")}</label><select id="trano">${range(YEARS_SHOWN).map((back) => current - back).map((option4) => `<option ${option4 === shown4 ? "selected" : ""}>${option4}</option>`).join("")}</select>
      ${rows.length ? `<button type="button" class="btn sec" id="trcsv">${t("events.report.download")}</button>` : ""}</div>
    <p class="sm">${t("events.report.note", { professional: term("medico") })}</p>
    ${rows.length ? tableHtml(rows) : `<div class="vacio vlinea">${t("events.report.empty", { year: shown4 })}</div>`}</div>`;
    const select2 = box.querySelector("#trano");
    if (select2) select2.onchange = () => {
      void paintExpenseReport(Number(select2.value));
    };
    const csv = box.querySelector("#trcsv");
    if (csv) csv.onclick = () => {
      download(rows, shown4);
    };
  }

  // src/app/screens/events/sheet.ts
  var reopen2 = (id) => {
    relatedLegacy.openEvent(id);
  };
  function attendeeHtml(attendee) {
    const costs = CONCEPTS.map((concept) => {
      const amount3 = Number(attendee[concept]) || 0;
      return `<label class="${concept === "comida" && amount3 > MEAL_MAX ? "evaviso" : ""}"><span>${conceptLabel(concept)}</span><input type="number" min="0" step="0.01" data-asimp="${concept}" value="${amount3 || ""}" placeholder="0"></label>`;
    }).join("");
    return `<div class="evasf" data-as="${attendee.id}">
        <div class="evasn"><b>${escapeHtml(attendee.cuentas?.nombre ?? "")}</b><span class="sm">${escapeHtml(attendee.cuentas?.especialidad ?? "")}</span></div>
        <select data-asest aria-label="${t("events.sheet.state")}">${ATTENDANCE_STATES.map((state) => `<option ${state === attendee.estado ? "selected" : ""}>${state}</option>`).join("")}</select>
        <button type="button" class="x" data-asq aria-label="${t("events.sheet.remove")}">✕</button>
        <div class="evimp">${costs}</div></div>`;
  }
  function sheetHtml2(event, attendees, canEdit) {
    return `<div class="fh"><div><h2>${escapeHtml(event.titulo)}</h2><div class="sm">${eventSummary(event)}</div></div>
      <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>
    ${event.nota ? `<p class="sm">${escapeHtml(event.nota)}</p>` : ""}
    <div class="evascab"><h3>${t("events.sheet.attendees", { count: attendees.length })}</h3><button type="button" class="btn sec" id="evanadir">${t("events.sheet.add")}</button></div>
    <div id="evsel"></div>
    <div class="evas" id="evas">${attendees.length ? attendees.map(attendeeHtml).join("") : `<div class="vacio vlinea">${t("events.sheet.noAttendees")}</div>`}</div>
    <div class="evpie"><span>${t("events.sheet.total")}</span><b id="evtotal">${formatCurrency(sum(attendees.map(attendeeTotal)))}</b></div>
    <p class="sm">${t("events.sheet.note", { max: MEAL_MAX })}</p>
    <div class="acts" style="justify-content:flex-end">${canEdit ? `<button type="button" class="btn sec" id="eveditar">${t("events.sheet.edit")}</button>` : ""}<button type="button" class="btn" data-cerrar>${t("events.sheet.done")}</button></div>`;
  }
  function startAdding(id) {
    const add2 = document.getElementById("evanadir");
    if (add2) add2.disabled = true;
    editorLegacy.pickAccount(document.getElementById("evsel"), null, async (account) => {
      const { error } = await legacyDb().from("eventos_asistentes").insert({ evento_id: id, cuenta_id: account.id });
      const message = error?.message ?? "";
      if (error) notices.toast(/duplicate|unique/i.test(message) ? t("events.sheet.alreadyIn", { name: account.nombre ?? "" }) : t("events.sheet.couldNotAdd", { error: message }), true);
      else notices.toast(t("events.sheet.added", { name: account.nombre ?? "" }));
      reopen2(id);
    });
    document.getElementById("evsel")?.querySelector("input")?.focus();
  }
  async function saveCost(attendee, input3, attendees) {
    const concept = input3.dataset.asimp, amount3 = Math.max(0, Math.round((Number(input3.value) || 0) * 100) / 100);
    const { error } = await legacyDb().from("eventos_asistentes").update({ [concept]: amount3 }).eq("id", attendee.id);
    if (error) {
      notices.toast(t("events.sheet.couldNotSave"), true);
      input3.value = String(Number(attendee[concept]) || "");
      return;
    }
    attendee[concept] = amount3;
    const total = document.getElementById("evtotal");
    if (total) total.textContent = formatCurrency(sum(attendees.map(attendeeTotal)));
    const overMeal = concept === "comida" && amount3 > MEAL_MAX;
    input3.closest("label")?.classList.toggle("evaviso", overMeal);
    if (overMeal) notices.toast(t("events.sheet.mealOver", { max: MEAL_MAX }), true);
  }
  function bindAttendee(row4, attendee, attendees, id) {
    const state = row4.querySelector("[data-asest]");
    if (state) state.onchange = async () => {
      const { error } = await legacyDb().from("eventos_asistentes").update({ estado: state.value }).eq("id", attendee.id);
      if (error) {
        notices.toast(t("events.sheet.couldNotSave"), true);
        state.value = attendee.estado;
        return;
      }
      attendee.estado = state.value;
    };
    row4.querySelectorAll("[data-asimp]").forEach((input3) => {
      input3.onchange = () => {
        void saveCost(attendee, input3, attendees);
      };
    });
    const remove7 = row4.querySelector("[data-asq]");
    if (remove7) remove7.onclick = async () => {
      if (!await notices.confirm(t("events.sheet.removeText", { name: attendee.cuentas?.nombre ?? "" }), { titulo: t("events.sheet.removeTitle"), ok: t("events.sheet.remove"), peligro: true })) return;
      const { error } = await legacyDb().from("eventos_asistentes").delete().eq("id", attendee.id);
      if (error) {
        notices.toast(t("events.sheet.couldNotRemove"), true);
        return;
      }
      reopen2(id);
    };
  }
  async function showEvent(id) {
    const db2 = legacyDb();
    const [{ data: event }, { data: attendeeRows }] = await Promise.all([
      db2.from("eventos").select("*").eq("id", id).maybeSingle(),
      db2.from("eventos_asistentes").select("id,cuenta_id,estado,inscripcion,viaje,comida,honorarios,cuentas(nombre,especialidad)").eq("evento_id", id).order("creado_en")
    ]);
    if (!event) {
      notices.toast(t("events.sheet.notFound"), true);
      return;
    }
    const body2 = document.getElementById("dbody"), box = document.getElementById("dlg");
    if (!body2 || !box) return;
    const attendees = attendeeRows ?? [], canEdit = event.creado_por === salesTeam.currentUserId() || cardSectionsLegacy.can("administrar");
    body2.innerHTML = sheetHtml2(event, attendees, canEdit);
    if (!box.open) box.showModal();
    const edit = document.getElementById("eveditar");
    if (edit) edit.onclick = () => {
      editEvent(event);
    };
    const add2 = document.getElementById("evanadir");
    if (add2) add2.onclick = () => {
      startAdding(id);
    };
    document.querySelectorAll("#evas [data-as]").forEach((row4) => {
      const attendee = attendees.find((item) => item.id === row4.dataset.as);
      if (attendee) bindAttendee(row4, attendee, attendees, id);
    });
  }

  // src/app/screens/analytics/index.ts
  var analytics_exports = {};
  __export(analytics_exports, {
    listenToVisitOrdersViews: () => listenToVisitOrdersViews,
    paintMonthlyTable: () => paintMonthlyTable,
    paintRanking: () => paintRanking,
    refreshExplore: () => refreshExplore,
    showVisitOrders: () => showVisitOrders
  });

  // src/app/legacy/analytics-bridge.ts
  var analyticsLegacy = {
    professional: () => AN_MED,
    /** The range of a period picker (montarPeriodo). */
    period: (id) => {
      const range2 = Reflect.get(document.getElementById(id) ?? {}, "__rango");
      return typeof range2 === "function" ? range2() : { desde: null, hasta: null };
    },
    loading: (element2, text2) => {
      cargando(element2, text2);
    },
    setTableExport: (rows) => {
      Reflect.set(window, "__ANTABLA", rows);
    }
  };

  // src/app/screens/analytics/filters.ts
  var select = (id) => document.getElementById(id);
  var valueOf2 = (id) => select(id)?.value ?? "";
  function selectedText(id) {
    const field4 = select(id);
    return field4?.value ? field4.selectedOptions[0]?.textContent ?? "" : "";
  }
  function filterParams() {
    return {
      p_medico: analyticsLegacy.professional()?.id ?? null,
      p_comercial: valueOf2("acom") || null,
      p_producto: valueOf2("aprod") || null,
      p_reporting: valueOf2("arep") || null,
      p_reportado: valueOf2("areprt") || null
    };
  }

  // src/app/screens/analytics/monthly-table.ts
  var LIMIT2 = 30;
  var NAME_WIDTH = 220;
  var MONTH_WIDTH = 110;
  var TOTAL_WIDTH = 120;
  var BASE_SHADE = 0.08;
  var SHADE_RANGE = 0.42;
  var cell2 = (width, html, extra = "", style = "") => `<span class="tcell${extra}" style="width:${width}px;min-width:${width}px${width === NAME_WIDTH ? "" : ";text-align:right"}${style}">${html}</span>`;
  var valueIn = (row4, month) => Number(row4.meses?.[month]) || 0;
  function monthHeader(month) {
    const name = shortMonthNames()[Number(month.slice(5, 7)) - 1] ?? month.slice(5);
    return `${name} ${month.slice(2, 4)}`;
  }
  function infoHtml() {
    const dimension = (selectedText("adim") || t("analytics.table.concept")).toLowerCase().replace(/^por /, "");
    const measure = t(valueOf2("amedida") === "importe" ? "analytics.table.amount" : "analytics.table.units");
    return `<div class="tabinfo"><b>${t("analytics.table.title", { measure: escapeHtml(measure), dimension: escapeHtml(dimension) })}</b>
    <span>${t("analytics.table.hint", { dimension: escapeHtml(dimension) })}</span></div>`;
  }
  function tableHtml2(data, rows) {
    const months2 = data.meses ?? [], format = (value10) => data.medida === "importe" ? formatCurrency(value10) : formatNumber(value10);
    const max = Math.max(1, ...rows.flatMap((row4) => months2.map((month) => valueIn(row4, month))));
    const shade = (value10) => value10 ? `;background:rgba(46,134,201,${(BASE_SHADE + value10 / max * SHADE_RANGE).toFixed(2)})` : "";
    const monthCell = (row4, month) => cell2(MONTH_WIDTH, row4.meses?.[month] ? format(row4.meses[month]) : '<span class="sm">·</span>', "", shade(valueIn(row4, month)));
    return `<div class="tabla"><div style="min-width:${180 + months2.length * MONTH_WIDTH}px">
    <div class="thead">${cell2(NAME_WIDTH, t("analytics.table.concept"), " th")}
      ${months2.map((month) => cell2(MONTH_WIDTH, escapeHtml(monthHeader(month)), " th")).join("")}
      ${cell2(TOTAL_WIDTH, t("analytics.explore.total"), " th")}</div>
    ${rows.map((row4) => `<div class="trow" style="cursor:default">
      ${cell2(NAME_WIDTH, `<b>${escapeHtml(row4.nombre)}</b>`)}
      ${months2.map((month) => monthCell(row4, month)).join("")}
      ${cell2(TOTAL_WIDTH, `<b>${format(row4.total)}</b>`)}</div>`).join("")}
    <div class="trow" data-fijo style="cursor:default;background:var(--bg)">
      ${cell2(NAME_WIDTH, `<b>${t("analytics.explore.total")}</b>`)}
      ${months2.map((month) => cell2(MONTH_WIDTH, `<b>${format(sum(rows.map((row4) => valueIn(row4, month))))}</b>`)).join("")}
      ${cell2(TOTAL_WIDTH, `<b>${format(sum(rows.map((row4) => Number(row4.total) || 0)))}</b>`)}</div>
  </div></div>`;
  }
  function exportRows(data, rows) {
    return rows.map((row4) => ({ concepto: row4.nombre, ...Object.fromEntries((data.meses ?? []).map((month) => [month, row4.meses?.[month] ?? 0])), total: row4.total }));
  }
  function tableParams() {
    const dimension = valueOf2("adim");
    return {
      p_dim: dimension === "mes" ? "producto" : dimension,
      p_desde: valueOf2("adesde") || null,
      p_hasta: valueOf2("ahasta") || null,
      p_canal: valueOf2("acanal") || null,
      p_medida: valueOf2("amedida") || "unidades",
      lim: LIMIT2,
      ...filterParams()
    };
  }
  async function paintMonthlyTable() {
    const box = document.getElementById("atabla2");
    if (!box) return;
    analyticsLegacy.loading(box, t("analytics.table.calculating"));
    const { data, error } = await legacyDb().rpc("analitica_tabla", tableParams());
    if (error || !data) {
      box.innerHTML = `<div class="vacio">${escapeHtml(error?.message ?? "")}</div>`;
      return;
    }
    const rows = data.filas ?? [];
    if (!rows.length) {
      box.innerHTML = `<div class="vacio">${t("analytics.table.noData")}</div>`;
      return;
    }
    box.innerHTML = infoHtml() + tableHtml2(data, rows);
    analyticsLegacy.setTableExport(exportRows(data, rows));
  }

  // src/app/screens/analytics/explore.ts
  var LIMIT3 = 100;
  var SKELETONS = 4;
  var BAR_HEIGHT = 84;
  var element = (id) => document.getElementById(id);
  var measureOf = (row4, measure) => Number(row4[measure]) || 0;
  function totalsHtml(totals) {
    const who2 = [analyticsLegacy.professional()?.nombre ?? "", selectedText("acom"), selectedText("aprod"), selectedText("arep"), selectedText("areprt")].filter(Boolean).join(" · ");
    return `
    <div class="kpi"><b>${formatNumber(totals.unidades)}</b><span>${t("analytics.explore.units")}${who2 ? ` · ${escapeHtml(who2)}` : ""}</span></div>
    <div class="kpi ok"><b>${formatCurrency(totals.importe)}</b><span>${t("analytics.explore.amount")}</span></div>
    <div class="kpi"><b>${formatNumber(totals.pedidos)}</b><span>${t("analytics.explore.orders")}</span></div>
    <div class="kpi"><b>${formatNumber(totals.medicos)}</b><span>${t("analytics.explore.withSales", { professionals: term("medico", { number: "p", capital: "C" }) })}</span></div>`;
  }
  function productsHtml2(products2, totals, dimension) {
    if (!(products2.length > 1 || products2.length === 1 && dimension !== "producto")) return "";
    return `<div class="dgrid-wrap"><div class="dgrid aprod">
    <div class="dh"><span>${t("analytics.explore.byProduct")}</span><span class="num">${t("analytics.explore.unitsHead")}</span><span class="num">${t("analytics.explore.unitsShare")}</span><span class="num">${t("analytics.explore.amountHead")}</span></div>
    ${products2.map((product) => `<div class="dr" style="cursor:default"><span><b>${escapeHtml(product.nombre)}</b></span><span class="num">${formatNumber(product.unidades)}</span>
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
    const total = measureOf(totals, measure) || 1, share = (row4) => Math.round(measureOf(row4, measure) / total * 100);
    return `<div class="dgrid-wrap"><div class="dgrid arank">
    <div class="dh"><span>#</span><span>${escapeHtml(selectedText("adim"))}</span><span class="num">${t("analytics.explore.unitsHead")}</span>
      <span class="num">${t("analytics.explore.amountHead")}</span><span class="num">${t("analytics.explore.orders")}</span><span>${t("analytics.explore.weight")}</span></div>
    ${rows.map((row4, index) => `<div class="dr" style="cursor:default"><span class="sm">${index + 1}</span><span><b>${escapeHtml(row4.nombre)}</b></span>
      <span class="num">${formatNumber(row4.unidades)}</span><span class="num">${formatCurrency(row4.importe)}</span><span class="num">${formatNumber(row4.pedidos)}</span>
      <span class="barra"><i style="width:${share(row4)}%"></i><em>${share(row4)}%</em></span></div>`).join("")}
    <div class="dr dtot"><span></span><span><b>${t("analytics.explore.total")}</b></span><span class="num"><b>${formatNumber(totals.unidades)}</b></span>
      <span class="num"><b>${formatCurrency(totals.importe)}</b></span><span class="num"><b>${formatNumber(totals.pedidos)}</b></span><span></span></div>
  </div></div>`;
  }
  function setHtml(id, html) {
    const box = element(id);
    if (box) box.innerHTML = html;
  }
  async function paintRanking() {
    analyticsLegacy.loading(element("atabla"), t("analytics.explore.calculating"));
    setHtml("atot", Array.from({ length: SKELETONS }, () => '<div class="kpi ksk"><div class="skel" style="width:40%;height:24px;margin:2px 0 8px"></div><div class="skel" style="width:70%;margin:0"></div></div>').join(""));
    const range2 = analyticsLegacy.period("aper"), dimension = valueOf2("adim"), measure = valueOf2("amedida");
    const { data, error } = await legacyDb().rpc("analitica_v2", {
      p_dim: dimension,
      p_desde: range2.desde,
      p_hasta: range2.hasta,
      p_canal: valueOf2("acanal") || null,
      ...filterParams(),
      lim: LIMIT3
    });
    if (error || !data) {
      setHtml("atabla", `<div class="vacio">${t("analytics.explore.couldNotCalculate", { error: escapeHtml(error?.message ?? "") })}</div>`);
      setHtml("atot", "");
      return;
    }
    const totals = data.totales ?? {}, rows = [...data.filas ?? []].sort((first, second) => measureOf(second, measure) - measureOf(first, measure));
    setHtml("atot", totalsHtml(totals));
    setHtml("aprods", productsHtml2(data.por_producto ?? [], totals, dimension));
    setHtml("aserie", seriesHtml(data.serie ?? [], measure));
    setHtml("atabla", rankingHtml(rows, totals, measure));
  }
  function refreshExplore() {
    const table = element("atabla2");
    if (currentScreen() !== "analitica" || !element("atabla") || !table) return;
    void paintRanking();
    if (!table.classList.contains("hide")) void paintMonthlyTable();
  }

  // src/app/screens/analytics/visit-orders/model.ts
  var DEFAULT_DAYS = 30;
  var percent = (part, whole) => whole ? Math.round((part ?? 0) / whole * 100) : 0;
  var words2 = () => ({
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
  var decimals = (value10) => value10.toLocaleString("es-ES", { maximumFractionDigits: value10 < 10 ? 2 : 1 });
  function scale(frame) {
    return {
      x: (day) => PAD + (day + frame.days) / (2 * frame.days) * (frame.width - 2 * PAD),
      y: (value10) => frame.height - 24 - value10 / frame.max * (frame.height - 52)
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
      <text x="${x(0) + 6}" y="20" class="tvtxt tvtxthoy">${t("analytics.orders.visitDay", words2())}</text>
      ${peakText}
      ${axis}
    </svg>`;
  }
  function headline(before, after, days) {
    if (before > 0) {
      return {
        big: `${after >= before ? "+" : ""}${formatNumber(Math.round((after / before - 1) * 100))}<small> %</small>`,
        label: t(after >= before ? "analytics.orders.moreUnits" : "analytics.orders.fewerUnits", { ...words2(), days })
      };
    }
    return after > 0 ? { big: "—", label: t("analytics.orders.noOrdersBefore", words2()) } : { big: "0", label: t("analytics.orders.noOrders") };
  }
  function effect(data) {
    const result = data.efecto ?? {}, visits2 = result.visitas ?? 0, days = data.dias ?? DEFAULT_DAYS;
    if (!visits2) return `<div class="vacio">${t("analytics.orders.noVisits", words2())}</div>`;
    const raw = (result.dias ?? []).map((day) => ({ k: day.k, v: (Number(day.u) || 0) / visits2 })), points = smooth(raw);
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
  var mini = (value10, label, valueClass = "") => `<div class="tvmini"><b${valueClass ? ` class="${valueClass}"` : ""}>${value10}</b><span class="tvlbl">${label}</span></div>`;
  function steps(summary3, days) {
    const visits2 = summary3.visitas ?? 0, visited = summary3.profesionales ?? 0, withOrder = summary3.con_venta ?? 0;
    return [
      [t("analytics.orders.visitsDone", words2()), visits2, visits2 ? 1 : 0, ""],
      [term("medico", { number: "p", capital: "C", adjective: "visitado" }), visited, visits2 ? visited / visits2 : 0, ""],
      [t("analytics.orders.withOrderIn", { days }), withOrder, visits2 ? withOrder / visits2 : 0, "c"]
    ];
  }
  function changeHtml(difference2) {
    if (difference2 === null) return "";
    return `<div class="tvlbl"><span class="${difference2 >= 0 ? "tvok" : "tvmal"}">${difference2 >= 0 ? "▲ +" : "▼ "}${t("analytics.orders.points", { count: formatNumber(difference2) })}</span> ${t("analytics.orders.vsPrevious")}</div>`;
  }
  function funnel(data) {
    const summary3 = data.resumen ?? {}, before = summary3.anterior ?? {}, days = data.dias ?? DEFAULT_DAYS;
    const share = percent(summary3.con_venta, summary3.profesionales), previous = percent(before.con_venta, before.profesionales);
    const difference2 = before.profesionales ? share - previous : null;
    const average2 = isPresent(summary3.dias_media) ? t("analytics.orders.days", { count: formatNumber(summary3.dias_media) }) : "—";
    return `<div class="tvgrid"><div class="tvizq"><div class="tvbig">${formatNumber(share)}<small> %</small></div>
      <div class="tvlbl">${t("analytics.orders.haveOrder", { visited: term("medico", { number: "p", article: "del", adjective: "visitado" }), days })}</div>
      <div class="tvrow">${mini(formatNumber(summary3.unidades ?? 0), t("analytics.orders.units"))}
        ${mini(average2, t("analytics.orders.untilFirst"))}</div></div>
    <div class="tvfun">${steps(summary3, days).map(([label, count2, share2, extraClass]) => `<div class="tvst"><span>${escapeHtml(label)}</span>
      ${bar(Math.max(share2 * 100, count2 ? 3 : 0).toFixed(1), extraClass ? ` ${extraClass}` : " ")}
      <b>${formatNumber(count2)}</b></div>`).join("")}
      ${changeHtml(difference2)}</div></div>`;
  }
  var TYPES = [["captacion", "analytics.orders.typeCapture"], ["presentacion", "analytics.orders.typePresentation"], ["seguimiento", "analytics.orders.typeFollowUp"]];
  var FOLLOW_UP = "seguimiento";
  var typeName = (type) => {
    const found = TYPES.find(([key]) => key === type);
    return found ? t(found[1]) : type;
  };
  var pair = (row4) => row4?.visitas ? t("analytics.orders.ofTotal", { part: formatNumber(row4.con_pedido), total: formatNumber(row4.visitas) }) : "—";
  function teamHtml(team3) {
    if (!team3.length) return "";
    return `<div class="tveq"><table class="trtabla"><thead><tr><th>${t("analytics.orders.person")}</th>${TYPES.map(([, label]) => `<th>${t(label)}</th>`).join("")}</tr></thead>
      <tbody>${team3.map((member) => `<tr><td>${escapeHtml(member.nombre)}</td>${TYPES.map(([key]) => `<td>${pair(member[key])}</td>`).join("")}</tr>`).join("")}</tbody></table>
      <div class="tvlbl">${t("analytics.orders.teamHint", words2())}</div></div>`;
  }
  function typeRow(row4) {
    const share = percent(row4.con_pedido, row4.visitas);
    return `<div class="tvst"><span>${escapeHtml(typeName(row4.tipo))} · ${t("analytics.orders.ofTotal", { part: formatNumber(row4.con_pedido), total: formatNumber(row4.visitas) })}</span>
      ${bar(Math.max(share, row4.con_pedido ? 3 : 0), row4.tipo === FOLLOW_UP ? "" : " c")}
      <b>${formatNumber(share)} %</b></div>`;
  }
  function types(data) {
    const rows = data.tipos ?? [];
    if (!rows.some((row4) => row4.visitas)) return `<div class="vacio">${t("analytics.orders.noVisits", words2())}</div>`;
    const total = sum(rows.map((row4) => Number(row4.con_pedido) || 0)), fresh = sum(rows.filter((row4) => row4.tipo !== FOLLOW_UP).map((row4) => Number(row4.con_pedido) || 0));
    return `<div class="tvgrid"><div class="tvizq"><div class="tvbig">${formatNumber(percent(fresh, total))}<small> %</small></div>
      <div class="tvlbl">${t("analytics.orders.newShare", words2())}</div>
      <div class="tvrow">${mini(formatNumber(fresh), t("analytics.orders.newOnes"))}
        ${mini(formatNumber(total - fresh), t("analytics.orders.followUps"))}</div></div>
    <div class="tvfun">${rows.map(typeRow).join("")}
      <div class="tvlbl">${rows.map((row4) => t("analytics.orders.typeUnits", { type: escapeHtml(typeName(row4.tipo)), units: formatNumber(row4.unidades ?? 0) })).join(" · ")}</div></div></div>
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
      yVisits: (value10) => height - BOTTOM - value10 / max * (height - TOP),
      yPercent: (value10) => height - BOTTOM - value10 / 100 * (height - TOP)
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
    if (!list.some((month) => month.visitas)) return `<div class="vacio">${t("analytics.orders.noRecentVisits", words2())}</div>`;
    const frame = frameOf(list);
    return `${headline2(list)}
    <svg class="tvsvg" viewBox="0 0 ${frame.width} ${frame.height}" role="img" aria-label="${t("analytics.orders.monthsLabel")}">
    ${list.map((month, index) => bars(month, index, frame)).join("")}
    ${line(list, frame)}
    </svg><div class="tvley"><span><i class="tvl3"></i>${t("analytics.orders.legendVisits", words2())}</span><span><i class="tvl4"></i>${t("analytics.orders.withOrderIn", { days: data.dias ?? DEFAULT_DAYS })}</span><span><i class="tvl5"></i>${t("analytics.orders.shareInOrder")}</span></div>`;
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
  function paint3() {
    const body2 = document.getElementById("tvcuerpo"), view = VIEWS[viewIndex];
    if (!body2 || !shown || !view) return;
    body2.innerHTML = view.paint(shown);
    const subtitle2 = document.getElementById("tvsub");
    if (subtitle2) subtitle2.textContent = t(view.subtitle, { ...words2(), from: formatShortDate(shown.desde), to: formatShortDate(shown.hasta), days: shown.dias ?? DEFAULT_DAYS });
    const position = document.getElementById("tvpos");
    if (position) position.textContent = t("analytics.orders.position", { number: viewIndex + 1, total: VIEWS.length, name: t(view.label) });
  }
  function cardHtml2(days) {
    const title2 = t("analytics.orders.title", words2());
    const help = t("analytics.orders.help", { ...words2(), days });
    return `<section class="card tvcard" id="tvvis"><div class="tvcab">
      <div class="tvtit"><h2>${title2} <button type="button" class="ai" data-ayuda-tit="${title2}" data-ayuda-txt="${escapeHtml(help)}" aria-label="${t("analytics.orders.whatIsIt")}">i</button></h2>
        <div class="sm" id="tvsub"></div></div>
      <div class="tvnav"><button type="button" class="btn sec chico" data-tvn="-1" aria-label="${t("analytics.orders.previousView")}">‹</button><span class="sm" id="tvpos"></span><button type="button" class="btn sec chico" data-tvn="1" aria-label="${t("analytics.orders.nextView")}">›</button></div>
    </div><div id="tvcuerpo"></div></section>`;
  }
  function showVisitOrders(data) {
    const box = document.getElementById("anareas");
    if (!box) return;
    document.getElementById("tvvis")?.remove();
    shown = data;
    if (!data?.resumen) return;
    box.insertAdjacentHTML("afterbegin", cardHtml2(data.dias ?? DEFAULT_DAYS));
    paint3();
  }
  function listenToVisitOrdersViews() {
    document.addEventListener("click", (event) => {
      const button2 = event.target?.closest("#tvvis [data-tvn]");
      if (!button2) return;
      viewIndex = (viewIndex + Number(button2.dataset.tvn) + VIEWS.length) % VIEWS.length;
      try {
        localStorage.setItem(STORAGE_KEY, VIEWS[viewIndex]?.key ?? "");
      } catch {
      }
      paint3();
    });
  }

  // src/app/screens/visit/index.ts
  var visit_exports = {};
  __export(visit_exports, {
    editSamples: () => editSamples,
    editVisit: () => editVisit,
    loadMaterials: () => loadMaterials,
    openVisit: () => openVisit,
    presentOnly: () => presentOnly,
    saveRevisitNotice: () => saveRevisitNotice,
    showVisitPhotos: () => showVisitPhotos,
    uploadVisitPhotos: () => uploadVisitPhotos,
    visitBlock: () => visitBlock,
    visitConsultation: () => visitConsultation
  });

  // src/app/screens/visit/photos.ts
  async function readVisitPhoto(file) {
    if (!file.type.startsWith("image/")) {
      notices.toast(t("visit.photos.chooseImage"), true);
      return null;
    }
    return visitLegacy.readPhoto(file);
  }
  function paintPhotos(box, photos, remove7) {
    if (!box) return;
    box.innerHTML = photos.map((photo, index) => `<span class="vfoto"><img alt="${t("visit.photos.photo", { number: index + 1 })}" src="data:${photo.tipo};base64,${photo.datos}">
    ${remove7 ? `<button type="button" class="vfquitar" data-vfq="${index}" aria-label="${t("visit.photos.remove")}">✕</button>` : ""}</span>`).join("");
    if (remove7) box.querySelectorAll("[data-vfq]").forEach((button2) => {
      button2.onclick = () => {
        remove7(Number(button2.dataset.vfq));
      };
    });
  }
  async function uploadVisitPhotos(activityId, photos) {
    for (const photo of photos) {
      const { error } = await legacyDb().from("actividad_fotos").insert({ actividad_id: activityId, nombre: photo.nombre, tipo: photo.tipo, tamano: photo.tamano, datos: photo.datos });
      if (error) {
        notices.toast(t("visit.photos.uploadFailed", { visit: term("visita", { capital: "C", adjective: "guardado" }) }), true);
        return false;
      }
    }
    return true;
  }
  var photoCount = (count2) => count2 ? count2 === 1 ? t("visit.photos.one") : t("visit.photos.many", { count: count2 }) : t("visit.photos.none");
  function galleryHtml(photos) {
    const canDelete = (photo) => photo.creado_por === salesTeam.currentUserId() || cardSectionsLegacy.can("administrar");
    return `<div class="fh"><div><h2>${t("visit.photos.title", { visit: term("visita", { article: "el" }) })}</h2><div class="sm">${photoCount(photos.length)}</div></div>
      <button class="x" data-cerrar2 aria-label="${t("common.close")}">✕</button></div>
    <div class="vfotos grande">${photos.map((photo) => `<span class="vfoto"><img alt="${escapeHtml(orFallback(photo.nombre, t("visit.photos.photoAlt")))}" src="data:${escapeHtml(photo.tipo)};base64,${photo.datos}">
      ${canDelete(photo) ? `<button type="button" class="vfquitar" data-vfdel="${photo.id}" aria-label="${t("visit.photos.delete")}">✕</button>` : ""}</span>`).join("")}</div>
    <div class="acts" style="justify-content:flex-end"><label class="btn sec" style="display:inline-flex">${icon("camera")} ${t("visit.photos.add")}<input type="file" id="vfmas" accept="image/*" data-fp="1" hidden multiple></label>
      <button type="button" class="btn" data-cerrar2>${t("visit.photos.done")}</button></div>`;
  }
  function refresh2(activityId, accountId) {
    void showVisitPhotos(activityId, accountId);
    if (accountCardLegacy.shownId() === accountId) agendaActions.openAccount(accountId);
  }
  async function deletePhoto(id, activityId, accountId) {
    if (!await notices.confirm(t("visit.photos.deleteText", { visit: term("visita", { article: "este" }) }), { titulo: t("visit.photos.deleteTitle"), ok: t("visit.photos.deleteOk"), peligro: true })) return;
    const { error } = await legacyDb().from("actividad_fotos").delete().eq("id", id);
    if (error) {
      notices.toast(t("visit.photos.couldNotDelete"), true);
      return;
    }
    notices.toast(t("visit.photos.deleted"));
    refresh2(activityId, accountId);
  }
  async function addPhotos(input3, shown4, activityId, accountId) {
    const files = [...input3.files ?? []], room = Math.max(0, visitLegacy.photosMax() - shown4), added = [];
    for (const file of files.slice(0, room)) {
      const photo = await readVisitPhoto(file);
      if (photo) added.push(photo);
    }
    if (files.length > visitLegacy.photosMax() - shown4) notices.toast(t("visit.photos.atMost", { max: visitLegacy.photosMax(), visit: term("visita") }), true);
    if (!added.length) return;
    if (await uploadVisitPhotos(activityId, added)) {
      notices.toast(t(added.length === 1 ? "visit.photos.added" : "visit.photos.addedMany"));
      refresh2(activityId, accountId);
    }
  }
  async function showVisitPhotos(activityId, accountId) {
    const { data, error } = await legacyDb().from("actividad_fotos").select("id,nombre,tipo,datos,creado_por").eq("actividad_id", activityId).order("creado_en");
    if (error) {
      notices.toast(t("visit.photos.couldNotOpen"), true);
      return;
    }
    const photos = data ?? [], body2 = document.getElementById("dlg2body"), box = document.getElementById("dlg2");
    if (!body2 || !box) return;
    body2.innerHTML = galleryHtml(photos);
    body2.querySelectorAll("[data-vfdel]").forEach((button2) => {
      button2.onclick = () => {
        void deletePhoto(button2.dataset.vfdel ?? "", activityId, accountId);
      };
    });
    const input3 = document.getElementById("vfmas");
    if (input3) input3.onchange = () => {
      void addPhotos(input3, photos.length, activityId, accountId);
    };
    if (!box.open) box.showModal();
  }

  // src/app/screens/visit/presentation.ts
  var MATERIALS_FRESH_MS = 3e5;
  var showing = null;
  async function loadMaterials(force = false) {
    const cached = visitLegacy.materials();
    if (cached && !force && Date.now() - visitLegacy.materialsTime() < MATERIALS_FRESH_MS) return cached;
    if (!navigator.onLine) return cached ?? [];
    try {
      const { data, error } = await legacyDb().from("producto_materiales").select("id,producto_id,nombre,tipo,orden,para_portal").order("orden").order("creado_en");
      if (!error) visitLegacy.setMaterials(data ?? [], Date.now());
    } catch {
    }
    return visitLegacy.materials() ?? [];
  }
  var materialsOf = (productId) => (visitLegacy.materials() ?? []).filter((material) => material.producto_id === productId);
  function blobUrl(material, data) {
    const binary = atob(String(data).replace(/^data:[^,]*,/, "")), bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return URL.createObjectURL(new Blob([bytes], { type: material.tipo }));
  }
  function close2() {
    showing?.urls.forEach((url) => {
      URL.revokeObjectURL(url);
    });
    showing = null;
    const box = document.getElementById("presenta");
    if (box?.open) box.close();
  }
  async function fileOf(material, box, current) {
    const known = visitLegacy.materialFiles().get(material.id);
    if (known) return known;
    visitLegacy.loading(box, t("common.loading"));
    if (!navigator.onLine) {
      box.innerHTML = `<p class="vacio">${t("visit.presentation.offline")}</p>`;
      return null;
    }
    const { data, error } = await legacyDb().from("producto_materiales").select("datos").eq("id", material.id).maybeSingle();
    if (showing !== current || current.list[current.index] !== material) return null;
    if (error || !data) {
      box.innerHTML = `<p class="vacio">${t("visit.presentation.couldNotLoad", { reason: escapeHtml(error?.message ?? t("visit.presentation.missing")) })}</p>`;
      return null;
    }
    visitLegacy.materialFiles().set(material.id, data.datos);
    return data.datos;
  }
  async function paint4() {
    const current = showing;
    if (!current) return;
    const material = current.list[current.index], box = document.getElementById("prescuerpo");
    if (!material || !box) return;
    const count2 = document.getElementById("presn");
    if (count2) count2.textContent = current.list.length > 1 ? t("visit.presentation.position", { number: current.index + 1, total: current.list.length, name: material.nombre }) : material.nombre;
    const previous = document.getElementById("presant"), next = document.getElementById("pressig");
    if (previous) previous.disabled = current.index === 0;
    if (next) next.disabled = current.index === current.list.length - 1;
    const data = await fileOf(material, box, current);
    if (!data || showing !== current || current.list[current.index] !== material) return;
    const url = blobUrl(material, data);
    current.urls.push(url);
    box.innerHTML = material.tipo === "application/pdf" ? `<iframe class="prespdf" src="${url}" title="${escapeHtml(material.nombre)}"></iframe>` : `<img class="presimg" src="${url}" alt="${escapeHtml(material.nombre)}">`;
  }
  function move(step) {
    if (!showing) return;
    const index = showing.index + step;
    if (index < 0 || index >= showing.list.length) return;
    showing.index = index;
    void paint4();
  }
  function dialog3() {
    if (!document.getElementById("presenta")) document.body.insertAdjacentHTML("beforeend", `<dialog id="presenta" class="presdlg" aria-label="${t("visit.presentation.label")}"></dialog>`);
    return document.getElementById("presenta");
  }
  function open(title2, list, index) {
    const box = dialog3();
    if (!box) return;
    box.innerHTML = `<div class="prescab"><b>${escapeHtml(title2)}</b><span class="sm" id="presn"></span><button type="button" class="x" id="prescerrar" aria-label="${t("common.close")}">✕</button></div>
    <div class="prescuerpo" id="prescuerpo"></div>
    <button type="button" class="presnav ant" id="presant" aria-label="${t("visit.presentation.previous")}">‹</button><button type="button" class="presnav sig" id="pressig" aria-label="${t("visit.presentation.next")}">›</button>`;
    showing = { list, index, urls: [] };
    const on2 = (id, action) => {
      const button2 = document.getElementById(id);
      if (button2) button2.onclick = action;
    };
    on2("prescerrar", close2);
    on2("presant", () => {
      move(-1);
    });
    on2("pressig", () => {
      move(1);
    });
    box.oncancel = (event) => {
      event.preventDefault();
      close2();
    };
    box.onkeydown = (event) => {
      if (event.key === "ArrowRight") move(1);
      if (event.key === "ArrowLeft") move(-1);
    };
    box.showModal();
    void paint4();
  }
  function presentProduct(productId) {
    const list = materialsOf(productId);
    if (!list.length) return;
    const chip = document.querySelector(`#vprods [data-vprod="${productId}"]`);
    if (chip && chip.getAttribute("aria-pressed") !== "true") chip.click();
    open(chip?.textContent?.trim() ?? t("visit.presentation.label"), list, 0);
  }
  function presentOnly(product, materialId) {
    const list = materialsOf(product.id);
    if (!list.length) return;
    open(orFallback(product.nombre, t("visit.presentation.material")), list, Math.max(0, list.findIndex((material) => material.id === materialId)));
  }

  // src/app/screens/visit/record/data.ts
  var CENTRE5 = "Centro";
  async function cardAndResults(id) {
    const [card2, results] = await Promise.all([
      cachedRpc("ficha_cuenta", { p_id: id }, `ficha-${id}`),
      cachedRpc("clasificadores_actividad", { p_cuenta: id }, `clasact-${id}`)
    ]);
    let groups = results.data;
    if (groups && !results.cache) visitLegacy.saveCopy("clasact", groups);
    groups ?? (groups = visitLegacy.readCopy("clasact"));
    return { card: card2.data, groups: groups ?? [] };
  }
  async function accountFlags(id) {
    try {
      return (await legacyDb().from("cuentas").select("tipo,sin_reporting").eq("id", id).maybeSingle()).data;
    } catch {
      return null;
    }
  }
  async function samplesLeft(id, type) {
    if (!navigator.onLine || type === CENTRE5) return [];
    const { data } = await legacyDb().rpc("muestras_de_cuenta", { p_cuenta: id });
    return Array.isArray(data) ? data : [];
  }
  async function loadVisitData(id) {
    const coverage = accountCardLegacy.planIncludes("cobertura");
    const [{ card: card2, groups }, flags, products2, missingTimetable] = await Promise.all([
      cardAndResults(id),
      accountFlags(id),
      coverage ? visitLegacy.promotedProducts().catch(() => []) : Promise.resolve([]),
      cardBaseLegacy.missingTimetable(id).catch(() => false)
    ]);
    if (!card2?.medico) return navigator.onLine ? "online" : "offline";
    const samples3 = await samplesLeft(id, flags?.tipo).catch(() => []);
    return { account: card2.medico, consultations: card2.consultas ?? [], groups, samples: samples3, products: products2, noReporting: Boolean(flags?.sin_reporting), missingTimetable };
  }

  // src/app/screens/visit/record/form.ts
  var RESULT_ROLE = "resultado_visita";
  function splitGroups(groups) {
    const filled = groups.filter((group) => group.valores.length);
    const results = filled.find((group) => group.papel === RESULT_ROLE) ?? { clave: "", papel: RESULT_ROLE, nombre: t("visit.record.result"), valores: [...visitLegacy.resultValues()] };
    return { results, others: filled.filter((group) => group !== results) };
  }
  function button(index, group, value10, isResult) {
    const key = `${group.clave}::${value10.valor}`, negative = isResult && value10.extra === NEGATIVE;
    index.set(key, { group: group.clave, value: value10 });
    return `<span class="optw"${value10.oculto ? ' data-oculto="1"' : ""}><button type="button" class="opt ${negative ? "neg" : ""}" data-vk="${escapeHtml(key)}" ${isResult ? `data-res="${escapeHtml(value10.valor)}"` : ""} ${negative ? 'data-neg="1"' : ""} aria-pressed="false">
      <span class="mk"></span>${escapeHtml(value10.valor)}${value10.dato_tipo ? ` <span class="datom">${t("visit.record.withData")}</span>` : ""}</button>
      ${value10.dato_tipo ? `<span class="datobox hide" data-box="${escapeHtml(key)}">${visitLegacy.dataField(value10, key)}</span>` : ""}</span>`;
  }
  function hiddenButton(groups) {
    const hidden = groups.flatMap((group) => group.valores).filter((value10) => value10.oculto).length;
    if (!hidden) return "";
    return `<button type="button" class="lnk" id="vtodos">${hidden === 1 ? t("visit.record.showOneHidden") : t("visit.record.showHidden", { count: hidden })}</button>`;
  }
  function resultsHtml(index, results, others) {
    const positive = results.valores.filter((value10) => value10.extra !== NEGATIVE), negative = results.valores.filter((value10) => value10.extra === NEGATIVE);
    const more = hiddenButton([results, ...others]);
    return `<label>${t("visit.record.resultLabel")} <span class="sm">${t("visit.record.severalResults", { done: term("visita", { adjective: "realizado" }) })}</span></label>
    <div class="opciones">${positive.map((value10) => button(index, results, value10, true)).join("")}</div>${negative.length ? "" : more}
    <div class="opciones" style="margin-top:8px">${negative.map((value10) => button(index, results, value10, true)).join("")}</div>${negative.length ? more : ""}
    ${others.map((group) => `<label>${escapeHtml(group.nombre)}${group.descripcion ? ` <span class="sm">· ${escapeHtml(group.descripcion)}</span>` : ""}</label>
      <div class="opciones">${group.valores.map((value10) => button(index, group, value10, false)).join("")}</div>`).join("")}`;
  }
  function sampleRow(sample) {
    const available = sample.en_plazo && sample.quedan;
    const text2 = !sample.en_plazo ? t("visit.samples.expired", { date: formatShortDate(sample.hasta ?? "") }) : t("visit.samples.left", { left: sample.quedan, max: sample.max }) + (sample.hasta ? t("visit.samples.until", { date: formatShortDate(sample.hasta) }) : "");
    return `<div class="vmrow ${available ? "" : "agotada"}"><span><b>${escapeHtml(sample.nombre)}</b><span class="sm">${text2}</span></span>
      <input type="number" min="0" max="${sample.en_plazo ? sample.quedan : 0}" step="1" value="0" data-vmprod="${sample.producto_id}" aria-label="${t("visit.samples.of", { name: escapeHtml(sample.nombre) })}" ${available ? "" : "disabled"}></div>`;
  }
  function samplesHtml(samples3, name) {
    if (!samples3.length) return "";
    return `<div class="vmuestras" id="vmuestras"><label>${t("visit.samples.title")}</label>
    ${samples3.map(sampleRow).join("")}
    <div class="vmfirma hide" id="vmfirma"><label>${t("visit.samples.signature")} <span class="sm">${t("visit.samples.signatureHint")}</span></label>
      <canvas id="vmcanvas" aria-label="${t("visit.samples.signatureArea")}"></canvas>
      <div class="vmfpie"><input id="vmfirmante" value="${escapeHtml(name)}" aria-label="${t("visit.samples.signer")}" placeholder="${t("visit.samples.signer")}"><button type="button" class="lnk" id="vmborrar">${t("visit.samples.clear")}</button></div></div></div>`;
  }
  function productsHtml3(products2) {
    if (!products2.length) return "";
    const materials = visitLegacy.materials() ?? [], withMaterial = products2.filter((product) => materials.some((material) => material.producto_id === product.id));
    return `<label>${t("visit.record.products")}</label>
      <div class="opciones" id="vprods">${products2.map((product) => `<button type="button" class="opt" data-vprod="${product.id}" aria-pressed="false"><span class="mk"></span>${escapeHtml(product.nombre)}</button>`).join("")}</div>
      ${withMaterial.length ? `<div class="vpres" id="vpres"><span class="sm">${t("visit.record.present")}</span>${withMaterial.map((product) => `<button type="button" class="chip" data-vpres="${product.id}">▶ ${escapeHtml(product.nombre)}</button>`).join("")}</div>` : ""}`;
  }
  function noticesHtml(data) {
    const timetable = data.missingTimetable ? `<div class="avisoh" id="vhorario"><span>${t("visit.record.missingTimetable", { visit: term("visita", { article: "el" }) })}</span></div>` : "";
    const offline = navigator.onLine ? "" : `<div class="banda-aviso vsinred"><b>${t("visit.record.offlineTitle")}</b> ${t("visit.record.offline", { visit: escapeHtml(term("visita", { article: "la", capital: "C" })) })}</div>`;
    return timetable + offline;
  }
  function centreOptions(consultations) {
    return consultations.map((item) => `<option value="${item.id ?? ""}">${escapeHtml(orFallback(item.centro_nombre, visitLegacy.privateConsultation()))}${item.municipio ? ` · ${escapeHtml(item.municipio)}` : ""}</option>`).join("");
  }
  function visitHtml2(data, index) {
    const { results, others } = splitGroups(data.groups), visit2 = term("visita");
    return `
    <div class="fh"><div><h2>${t("visit.record.title", { visit: visit2 })}</h2><div class="sm">${escapeHtml(data.account.nombre)}</div></div>
      <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>${noticesHtml(data)}
    <div class="g2">
      <div><label for="vf">${t("visit.edit.date")}</label><input id="vf" type="date" value="${todayIso()}"></div>
      <div><label for="vc">${t("visit.record.centre", { visit: term("visita", { article: "del" }) })}</label><select id="vc">
        ${centreOptions(data.consultations)}
      </select></div>
    </div><label>${t("visit.record.howItWas")}</label>
    <div class="segs" id="vmodo" role="group" aria-label="${t("visit.record.howItWas")}">${modeButtons("vmodo", "presencial")}</div>${productsHtml3(data.products)}
    ${resultsHtml(index, results, others)}
    <div class="g2" style="margin-top:6px">
      <div><label for="vpa">${t("visit.edit.nextAction")}</label><input id="vpa" placeholder="${t("visit.record.nextActionPlaceholder")}"></div>
      <div><label for="vpf">${t("visit.record.nextActionDate")}</label><input id="vpf" type="date"></div>
    </div>
    ${samplesHtml(data.samples, data.account.nombre)}<label for="vn">${t("visit.edit.note")}</label><textarea id="vn" rows="3"></textarea><div class="vfotosw"><label class="btn sec" id="vfotobtn" style="display:inline-flex">${icon("camera")} ${t("visit.photos.add")}<input type="file" id="vfotof" accept="image/*" data-fp="1" hidden multiple></label>
    <span class="sm">${t("visit.photos.hint", { max: visitLegacy.photosMax() })}</span><div class="vfotos" id="vfotos"></div></div>
    <div class="acts" style="justify-content:flex-end">
      <button class="btn sec" data-cerrar>${t("common.cancel")}</button>
      <button class="btn" id="vguardar">${t("visit.record.save", { visit: visit2 })}</button>
    </div>`;
  }

  // src/app/screens/visit/record/save.ts
  var operationId = null;
  var forgetOperation = () => {
    operationId = null;
  };
  var value4 = (id) => document.getElementById(id)?.value ?? "";
  function details(body2, marked, index) {
    return marked.map((key) => {
      const field4 = body2.querySelector(`[data-dato="${CSS.escape(key)}"]`), extra = field4 ? field4.value.trim() : "";
      const info = index.get(key);
      return { clasificador: info?.group ?? "", valor: info?.value.valor ?? "", ...extra ? { dato: extra } : {} };
    });
  }
  async function askUrgent(account, id) {
    const message = t("visit.record.urgentText", { name: `${account.nombre}${account.urgente_motivo ? ` · ${account.urgente_motivo}` : ""}` });
    const choice = await notices.choose(t("visit.record.urgentTitle"), message, [{ k: "dejar", t: t("visit.record.keepUrgent"), cls: "sec" }, { k: "quitar", t: t("visit.record.removeUrgent") }]);
    if (choice !== "quitar") return;
    const { error } = await legacyDb().from("cuentas").update({ urgente: false, urgente_motivo: null }).eq("id", id);
    notices.toast(t(error ? "visit.record.couldNotUnmark" : "visit.record.unmarked"), Boolean(error));
  }
  function payload(id, results, detailList) {
    operationId ?? (operationId = `v-${id}-${Date.now()}`);
    return {
      cuenta_id: id,
      ubicacion_id: value4("vc") || null,
      fecha: value4("vf"),
      resultados: results,
      detalles: detailList,
      nota: value4("vn").trim(),
      proxima_accion: value4("vpa").trim(),
      proxima_fecha: value4("vpf") || null,
      op_id: operationId
    };
  }
  function savedNotice(saved2) {
    if (saved2?.encolada) return;
    notices.toast(t("visit.record.saved", { visit: term("visita", { capital: "C", adjective: "registrado" }) }) + (saved2?.estado ? t("visit.record.newState", { state: saved2.estado }) : ""));
  }
  async function saveVisit(visit2, button2) {
    const { id, account, index, resultsKey } = visit2;
    const body2 = document.getElementById("dbody");
    if (!body2) return;
    const marked = [...body2.querySelectorAll("[data-vk][aria-pressed=true]")].map((item) => item.dataset.vk ?? "");
    const isResult = (key) => index.get(key)?.group === resultsKey;
    const results = marked.filter(isResult).map((key) => index.get(key)?.value.valor ?? "");
    if (!results.length) {
      notices.toast(t("visit.record.chooseResult"), true);
      return;
    }
    button2.disabled = true;
    button2.textContent = t("visit.edit.saving");
    const { data, error } = await visitLegacy.writeRpc("registrar_actividad", { p: payload(id, results, details(body2, marked, index)) });
    button2.disabled = false;
    button2.textContent = t("visit.record.save", { visit: term("visita") });
    if (error) {
      notices.toast(t("visit.record.couldNotSave", { error: error.message ?? "" }), true);
      return;
    }
    document.getElementById("dlg")?.close();
    savedNotice(data);
    const done = marked.some((key) => isResult(key) && index.get(key)?.value.extra !== NEGATIVE);
    if (account.urgente && done) await askUrgent(account, id);
    visitLegacy.reloadHome();
    if (accountCardLegacy.shownId() === id) agendaActions.openAccount(id);
  }

  // src/app/screens/visit/record/index.ts
  var REPORTING = /reporting/i;
  function bindResults(body2, visit2) {
    body2.querySelectorAll("[data-vk]").forEach((button2) => {
      button2.onclick = () => {
        const key = button2.dataset.vk ?? "", on2 = pressed(button2);
        if (visit2.index.get(key)?.group === visit2.resultsKey) {
          const negative = button2.dataset.neg === "1";
          body2.querySelectorAll("[data-res]").forEach((other) => {
            if ((negative || other.dataset.neg === "1") && other !== button2) {
              other.setAttribute("aria-pressed", "false");
              body2.querySelector(`[data-box="${CSS.escape(other.dataset.vk ?? "")}"]`)?.classList.add("hide");
            }
          });
        }
        button2.setAttribute("aria-pressed", String(!on2));
        const box = body2.querySelector(`[data-box="${CSS.escape(key)}"]`);
        if (box) {
          box.classList.toggle("hide", on2);
          if (!on2) {
            const field4 = box.querySelector("input, select");
            if (field4) setTimeout(() => {
              field4.focus();
            }, 30);
          }
        }
      };
    });
    const more = document.getElementById("vtodos");
    if (more) more.onclick = () => {
      body2.classList.add("vertodos");
      more.remove();
    };
  }
  function bindModeAndProducts(body2, draft) {
    const modes = body2.querySelectorAll("[data-vmodo]");
    modes.forEach((button2) => {
      button2.onclick = () => {
        draft.modo = button2.dataset.vmodo ?? "presencial";
        modes.forEach((other) => {
          other.classList.toggle("on", other === button2);
          other.setAttribute("aria-pressed", String(other === button2));
        });
      };
    });
    body2.querySelectorAll("[data-vprod]").forEach((button2) => {
      button2.onclick = () => {
        togglePressed(button2);
        draft.productos = [...body2.querySelectorAll("[data-vprod][aria-pressed=true]")].map((item) => item.dataset.vprod ?? "");
      };
    });
    body2.querySelectorAll("[data-vpres]").forEach((button2) => {
      button2.onclick = () => {
        presentProduct(button2.dataset.vpres ?? "");
      };
    });
  }
  function bindPhotos(draft) {
    const paint8 = () => {
      paintPhotos(document.getElementById("vfotos"), draft.fotos, (index) => {
        draft.fotos.splice(index, 1);
        paint8();
      });
    };
    const input3 = document.getElementById("vfotof");
    if (input3) input3.onchange = async () => {
      for (const file of [...input3.files ?? []]) {
        if (draft.fotos.length >= visitLegacy.photosMax()) {
          notices.toast(t("visit.photos.atMost", { max: visitLegacy.photosMax(), visit: term("visita") }), true);
          break;
        }
        const photo = await readVisitPhoto(file);
        if (photo) draft.fotos.push(photo);
      }
      input3.value = "";
      paint8();
    };
  }
  function bindSamples(body2, samples3, draft) {
    if (!samples3.length) return;
    let pad2 = null;
    const items = () => [...body2.querySelectorAll("[data-vmprod]")].map((input3) => ({ producto_id: input3.dataset.vmprod ?? "", unidades: Math.max(0, Math.floor(Number(input3.value) || 0)), max: Number(input3.max) })).filter((item) => item.unidades > 0);
    const show2 = () => {
      const any = items().length > 0, canvas = document.getElementById("vmcanvas");
      document.getElementById("vmfirma")?.classList.toggle("hide", !any);
      if (any && !pad2 && canvas) pad2 = visitLegacy.signaturePad(canvas);
    };
    body2.querySelectorAll("[data-vmprod]").forEach((input3) => {
      input3.addEventListener("input", show2);
    });
    const clear = document.getElementById("vmborrar");
    if (clear) clear.onclick = () => {
      pad2?.borrar();
    };
    draft.muestras = {
      items,
      firmante: () => document.getElementById("vmfirmante")?.value.trim() ?? "",
      firma: () => pad2?.imagen() ?? null,
      validar: () => {
        const chosen2 = items();
        if (!chosen2.length) return null;
        if (chosen2.some((item) => item.unidades > item.max)) return t("visit.samples.overLimit");
        return !pad2 || pad2.vacia() ? t("visit.samples.missingSignature") : null;
      }
    };
  }
  function applyDateRules(date) {
    const field4 = document.getElementById("vf");
    if (!field4) return;
    const today = todayIso();
    field4.max = today;
    if (!cardSectionsLegacy.can("visita_fecha_pasada")) {
      field4.value = today;
      field4.min = today;
      field4.disabled = true;
      field4.title = t("visit.record.sameDay");
    } else if (date && date <= today) field4.value = date;
  }
  function hideReporting(box) {
    let hidden = 0;
    box.querySelectorAll(".chips button, [data-res], .chip").forEach((button2) => {
      if (REPORTING.test(button2.textContent ?? "")) {
        button2.style.display = "none";
        hidden++;
      }
    });
    if (!hidden || box.querySelector(".srnota")) return;
    const first = box.querySelector(".chips, [data-res]"), container = first?.classList.contains("chips") ? first : first?.parentElement;
    container?.insertAdjacentHTML("afterend", `<p class="sm srnota">${t("visit.record.noReporting", { professional: term("medico", { article: "este", articleCapital: "C" }), visit: term("visita") })}</p>`);
  }
  function paint5(id, data, date) {
    const body2 = document.getElementById("dbody"), box = document.getElementById("dlg");
    if (!body2 || !box) return;
    const index = /* @__PURE__ */ new Map(), resultsKey = splitGroups(data.groups).results.clave;
    body2.classList.remove("vertodos");
    body2.innerHTML = visitHtml2(data, index);
    const draft = { id, modo: "presencial", fotos: [], ...data.products.length ? { productos: [] } : {} };
    visitLegacy.setCurrent(draft);
    const visit2 = { id, account: data.account, index, resultsKey };
    bindResults(body2, visit2);
    bindModeAndProducts(body2, draft);
    bindPhotos(draft);
    bindSamples(body2, data.samples, draft);
    applyDateRules(date);
    const save13 = document.getElementById("vguardar");
    if (save13) save13.onclick = () => {
      void saveVisit(visit2, save13);
    };
    box.showModal();
    if (data.noReporting) hideReporting(box);
  }
  async function openVisit(id) {
    const date = visitLegacy.takeDate();
    forgetOperation();
    await visitLegacy.withLoading(async () => {
      const data = await loadVisitData(id);
      if (typeof data === "string") {
        notices.toast(t("visit.record.couldNotOpen", { reason: t(data === "online" ? "visit.record.cardUnreadable" : "visit.record.noCopy") }), true);
        return;
      }
      paint5(id, data, date);
    });
  }

  // src/app/screens/visit/settings.ts
  function samplesHtml2(setting, products2) {
    return `
    <div class="fh"><div><h2>${t("visit.settings.samplesTitle")}</h2><div class="sm">${t("visit.settings.samplesSubtitle", { visit: term("visita", { article: "un" }) })}</div></div>
      <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>
    <label class="opt" style="margin-top:10px"><input type="checkbox" id="murest" ${setting.restar_stock ? "checked" : ""}>
      <span><b>${t("visit.settings.fromStock")}</b><br><span class="sm">${t("visit.settings.fromStockHint", { visit: term("visita", { article: "el" }) })}</span></span></label>
    <label for="muprod">${t("visit.settings.product")}</label><select id="muprod"><option value="">—</option>${products2.map((product) => `<option value="${product.id}" ${product.id === setting.producto_id ? "selected" : ""}>${escapeHtml(product.nombre)}</option>`).join("")}</select>
    <div class="acts" style="justify-content:flex-end"><button class="btn sec" data-cerrar>${t("common.cancel")}</button><button class="btn" id="muok">${t("common.save")}</button></div>`;
  }
  async function saveSamples(box) {
    const fromStock = document.getElementById("murest")?.checked ?? false, product = document.getElementById("muprod")?.value ?? "";
    if (fromStock && !product) {
      notices.toast(t("visit.settings.chooseProduct"), true);
      return;
    }
    const { error } = await legacyDb().rpc("guardar_ajuste", { p_clave: "muestras", p_valor: { producto_id: product || null, restar_stock: fromStock } });
    if (error) {
      notices.toast(t("visit.settings.couldNotSave"), true);
      return;
    }
    box.close();
    notices.toast(t("visit.settings.saved"));
  }
  async function editSamples() {
    const [, products2] = await Promise.all([cycleLegacy.loadSettings(), visitLegacy.reloadProducts()]);
    const setting = { producto_id: null, restar_stock: false, ...cycleLegacy.setting("muestras") };
    const body2 = document.getElementById("dbody"), box = document.getElementById("dlg");
    if (!body2 || !box) return;
    body2.innerHTML = samplesHtml2(setting, products2);
    box.showModal();
    const ok = document.getElementById("muok");
    if (ok) ok.onclick = () => {
      void saveSamples(box);
    };
  }
  async function saveRevisitNotice(notice) {
    const preferences = { ...visitLegacy.preferences() };
    preferences.avisos = { ...preferences.avisos, revisita: notice };
    const { data, error } = await legacyDb().rpc("guardar_preferencias", { p: preferences });
    if (error) {
      notices.toast(t("visit.settings.couldNotSave"), true);
      return false;
    }
    visitLegacy.setPreferences(data ?? preferences);
    return true;
  }

  // src/app/screens/commissions/index.ts
  var commissions_exports = {};
  __export(commissions_exports, {
    editScheme: () => editScheme,
    paintCommissionCard: () => paintCommissionCard,
    paintCommissions: () => paintCommissions
  });

  // src/app/legacy/commissions-bridge.ts
  var commissionsLegacy = {
    schemes: () => ESQUEMAS,
    setSchemes: (list) => {
      ESQUEMAS = list;
    },
    team: () => COMS,
    whatUserSees: () => PERFIL?.comision_ver
  };

  // src/app/screens/commissions/home-card.ts
  var NOTHING = "nada";
  var AMOUNT = "importe";
  function nextHtml(period, withAmount) {
    const next = period.siguiente;
    if (!next) return `<p class="sm" style="padding:0 16px 14px">${t(period.sin_esquema ? "commissions.homeCard.noScheme" : "commissions.homeCard.topTier")}</p>`;
    return `<p class="sm" style="padding:0 16px 14px">
      ${t("commissions.homeCard.nextTier", { missing: formatNumber(next.faltan) })}${withAmount ? t("commissions.homeCard.nextTierAmount", { amount: formatCurrency(next.valor) }) : ""}.</p>`;
  }
  function cardHtml3(period, withAmount) {
    const title2 = t(withAmount ? "commissions.homeCard.yourCommission" : "commissions.homeCard.yourActivity", { period: formatMonth(period.periodo) });
    return `<h2>${title2}</h2>
    <div class="kpis" style="padding:10px 16px 4px;margin:0">
      <div class="kpi"><b>${formatNumber(period.unidades)}</b><span>${t("commissions.homeCard.units")}</span></div>
      ${withAmount ? `<div class="kpi ok"><b>${formatCurrency(period.importe)}</b><span>${t("commissions.homeCard.accrued")}</span></div>` : ""}
      ${withAmount && period.valor_unidad ? `<div class="kpi"><b>${formatCurrency(period.valor_unidad)}</b><span>${t("commissions.homeCard.perUnit")}</span></div>` : ""}
    </div>
    ${nextHtml(period, withAmount)}`;
  }
  async function paintCommissionCard() {
    const box = document.getElementById("c-comision");
    if (!box) return;
    const sees = commissionsLegacy.whatUserSees();
    if (!sees || sees === NOTHING) {
      box.innerHTML = "";
      return;
    }
    const { data, error } = await legacyDb().rpc("comision_periodo", {});
    if (error || !data || data.ok === false || data.sin_esquema && !data.unidades) {
      box.innerHTML = "";
      return;
    }
    box.innerHTML = cardHtml3(data, sees === AMOUNT && !data.sin_esquema);
  }

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

  // src/app/screens/commissions/scheme-people.ts
  var block = (inner) => `<div class="blk" id="esqpers"><h3>${t("commissions.people.title")}</h3>${inner}</div>`;
  function rowHtml2(item, admin) {
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
      <p class="sm" style="margin-top:6px">${t("commissions.people.lockedHint")}</p>`;
  }
  var value5 = (id) => document.getElementById(id)?.value ?? "";
  async function assign(schemeId, repaint2) {
    const user = value5("eap");
    if (!user) {
      notices.toast(t("commissions.people.choosePerson"), true);
      return;
    }
    const mode = value5("eadm"), since = mode === "todo" ? ALL_HISTORY : mode === "fecha" ? value5("eadf") : todayIso();
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
  async function remove5(user, since, ending) {
    const asked = ending ? { text: "commissions.people.endText", titulo: "commissions.people.endTitle", ok: "commissions.people.endOk" } : { text: "commissions.people.cancelText", titulo: "commissions.people.cancelTitle", ok: "commissions.people.cancelIt" };
    if (!await notices.confirm(t(asked.text), { titulo: t(asked.titulo), ok: t(asked.ok), peligro: true })) return;
    await legacyDb().rpc("asignar_esquema", { p_usuario: user, p_esquema: null, p_quitar: true, p_desde: since });
  }
  function bind7(schemeId, list, repaint2) {
    const mode = document.getElementById("eadm");
    if (mode) mode.onchange = () => {
      document.getElementById("eadfw")?.classList.toggle("hide", mode.value !== "fecha");
    };
    const ok = document.getElementById("eaok");
    if (ok) ok.onclick = () => {
      void assign(schemeId, repaint2);
    };
    list.querySelectorAll("[data-efin]").forEach((button2) => {
      button2.onclick = async () => {
        await remove5(button2.dataset.efin ?? "", addDays(todayIso(), 1), true);
        repaint2();
      };
    });
    list.querySelectorAll("[data-equi]").forEach((button2) => {
      button2.onclick = async () => {
        await remove5(button2.dataset.equi ?? "", button2.dataset.edesde ?? "", false);
        repaint2();
      };
    });
  }
  async function paintList(schemeId) {
    const { data } = await legacyDb().rpc("asignaciones_esquema_lista");
    const list = document.getElementById("esqlista");
    if (!list) return;
    const assignments = (data ?? []).filter((item) => item.esquema_id === schemeId), admin = cardSectionsLegacy.can("administrar");
    list.innerHTML = `${assignments.length ? `<div class="esqfilas">${assignments.map((item) => rowHtml2(item, admin)).join("")}</div>` : `<p class="sm">${t("commissions.people.nobody")}</p>`}
    ${admin ? addHtml() : ""}`;
    if (admin) bind7(schemeId, list, () => {
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
  var option2 = (value10, label, chosen2) => `<option value="${value10}" ${chosen2 === value10 ? "selected" : ""}>${label}</option>`;
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
          ${option2("comercial", t("commissions.editor.portfolio"), scheme?.atribucion)}
          ${option2("cierra", t("commissions.editor.closes"), scheme?.atribucion)}</select></div>
        <div><label for="ecalc">${t("commissions.editor.calculation")}</label><select id="ecalc">
          ${option2(DEFAULT_CALCULATION, t("commissions.editor.tierReached"), this.calculation)}
          ${option2("marginal", t("commissions.editor.marginal"), this.calculation)}
          ${option2(FIXED, t("commissions.editor.fixed"), this.calculation)}</select></div>
      </div>
      <div class="g2">
        <div><label for="ecan">${t("commissions.editor.channel")}</label><select id="ecan">
          <option value="">${t("commissions.editor.allChannels")}</option>
          ${option2("paciente", t("commissions.editor.patientOnly", { toThePatient: term("paciente", { article: "al" }) }), scheme?.canal)}
          ${option2("centro", t("commissions.editor.centreOnly"), scheme?.canal)}</select></div>
        ${this.fixed ? `<div><label for="efijo">${t("commissions.editor.eurosPerUnit")}</label><input id="efijo" type="number" step="0.01" min="0" value="${this.fixedValue}"></div>` : "<div></div>"}
      </div>
      ${this.tiersHtml()}
      <div class="acts" style="justify-content:flex-end">
        <button class="btn sec" data-cerrar>${t("commissions.editor.cancel")}</button>
        <button class="btn" id="eguardaresq">${t(this.id ? "commissions.editor.save" : "commissions.editor.create")}</button></div>`;
    }
    /** Reads the tiers as they are written. */
    read() {
      const box = document.getElementById("etramos");
      if (this.fixed || !box) return;
      this.tiers = [...box.children].map((row4, index) => {
        const value10 = (attribute) => row4.querySelector(`[data-${attribute}="${index}"]`)?.value ?? "";
        return { desde_u: Number(value10("td")) || 0, hasta_u: value10("th") === "" ? null : Number(value10("th")), valor: Number(value10("tv")) || 0 };
      });
    }
    paint() {
      const body2 = document.getElementById("dbody");
      if (!body2) return;
      body2.innerHTML = this.html();
      const calculation = document.getElementById("ecalc");
      if (calculation) calculation.onchange = () => {
        this.read();
        const fixed = input("efijo");
        if (fixed) this.fixedValue = fixed.value;
        this.calculation = calculation.value;
        this.paint();
      };
      const add2 = document.getElementById("etmas");
      if (add2) add2.onclick = () => {
        this.read();
        this.addTier();
        this.paint();
      };
      body2.querySelectorAll("[data-tx]").forEach((button2) => {
        button2.onclick = () => {
          this.read();
          this.tiers.splice(Number(button2.dataset.tx), 1);
          this.paint();
        };
      });
      void paintSchemePeople(this.id);
      const save13 = document.getElementById("eguardaresq");
      if (save13) save13.onclick = () => {
        void this.save(save13);
      };
    }
    addTier() {
      const last = this.tiers[this.tiers.length - 1] ?? { desde_u: 0, hasta_u: null, valor: 0 };
      this.tiers.push({ desde_u: nonZeroOr(last.hasta_u, last.desde_u) + 1, hasta_u: null, valor: last.valor });
    }
    /** What guardar_esquema receives. */
    payload(name) {
      const select2 = (id) => document.getElementById(id)?.value ?? "";
      return {
        id: this.id,
        nombre: name,
        atribucion: select2("eatr"),
        calculo: this.calculation,
        canal: select2("ecan") || null,
        valor_fijo: this.fixed ? input("efijo")?.value : null,
        ...this.fixed ? {} : { tramos: this.tiers }
      };
    }
    async save(button2) {
      this.read();
      const name = input("enom")?.value.trim() ?? "";
      if (!name) {
        notices.toast(t("commissions.editor.giveName"), true);
        return;
      }
      button2.disabled = true;
      button2.textContent = t("commissions.editor.saving");
      const { data: result, error } = await legacyDb().rpc("guardar_esquema", { p: this.payload(name) });
      button2.disabled = false;
      button2.textContent = t(this.id ? "commissions.editor.save" : "commissions.editor.create");
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
  var rowHtml3 = (item) => `<div class="item" style="cursor:default" data-liqu="${item.usuario_id}" data-liqp="${item.periodo}">
      <span class="ic ${item.estado === SETTLEMENT.paid ? "o" : ""}">${item.estado === SETTLEMENT.draft ? "○" : "✓"}</span>
      <span class="tx"><b>${escapeHtml(item.nombre)}</b><span class="sm">${t("commissions.page.settlementLine", { period: formatMonth(item.periodo), units: formatNumber(item.unidades), amount: formatCurrency(item.importe), state: escapeHtml(item.estado) })}</span></span>
      <span class="acts" style="margin:0">
        ${item.estado === SETTLEMENT.draft ? `<button class="btn sec" data-liq="${item.usuario_id}|${item.periodo}|${SETTLEMENT.approved}">${t("commissions.page.approve")}</button>` : ""}
        ${item.estado === SETTLEMENT.approved ? `<button class="btn sec" data-liq="${item.usuario_id}|${item.periodo}|${SETTLEMENT.paid}">${t("commissions.page.markPaid")}</button>` : ""}
      </span></div>`;
  function filtersHtml(all) {
    const people = [...new Map(all.map((item) => [item.usuario_id, item.nombre])).entries()].sort((first, second) => String(first[1]).localeCompare(String(second[1]), "es"));
    const months2 = [...new Set(all.map((item) => item.periodo))].sort().reverse();
    if (settlementFilters.person && !people.some(([id]) => id === settlementFilters.person)) settlementFilters.person = "";
    if (settlementFilters.month && !months2.includes(settlementFilters.month)) settlementFilters.month = "";
    return `<div class="liqfil" id="liqfil">
      <div><label for="liqfu">${t("commissions.page.person")}</label><select id="liqfu"><option value="">${t("commissions.page.all")}</option>${people.map(([id, name]) => `<option value="${id}" ${id === settlementFilters.person ? "selected" : ""}>${escapeHtml(name)}</option>`).join("")}</select></div>
      <div><label for="liqfp">${t("commissions.page.month")}</label><select id="liqfp"><option value="">${t("commissions.page.allMonths")}</option>${months2.map((month) => `<option value="${month}" ${month === settlementFilters.month ? "selected" : ""}>${escapeHtml(formatMonth(month))}</option>`).join("")}</select></div>
      <p class="sm" id="liqres"></p></div>`;
  }
  function summary2(shown4) {
    if (!shown4.length) return "";
    const total = sum(shown4.map((item) => Number(item.importe) || 0)), units2 = sum(shown4.map((item) => Number(item.unidades) || 0));
    const unpaid = sum(shown4.filter((item) => item.estado !== SETTLEMENT.paid).map((item) => Number(item.importe) || 0));
    const count2 = shown4.length === 1 ? t("commissions.page.oneSettlement") : t("commissions.page.settlementsCount", { count: formatNumber(shown4.length) });
    return t("commissions.page.summary", { settlements: count2, units: formatNumber(units2), amount: formatCurrency(total) }) + (unpaid && unpaid !== total ? t("commissions.page.unpaid", { amount: formatCurrency(unpaid) }) : "");
  }
  async function settle(button2, repaint2) {
    const [user = "", period = "", state = ""] = (button2.dataset.liq ?? "").split("|"), approve = state === SETTLEMENT.approved;
    if (!await notices.confirm(
      t(approve ? "commissions.page.approveText" : "commissions.page.payText"),
      { titulo: t(approve ? "commissions.page.approveTitle" : "commissions.page.payTitle"), ok: t(approve ? "commissions.page.approve" : "commissions.page.markPaid") }
    )) return;
    await legacyDb().rpc("liquidar", { p_usuario: user, p_periodo: period, p_estado: state });
    notices.toast(t("commissions.page.settled", { state: state.toLowerCase() }));
    repaint2();
  }
  function paintSettlements(list, all, repaint2) {
    const paint8 = () => {
      const shown4 = all.filter((item) => (!settlementFilters.person || item.usuario_id === settlementFilters.person) && (!settlementFilters.month || item.periodo === settlementFilters.month));
      const result = document.getElementById("liqres");
      if (result) result.textContent = summary2(shown4);
      list.innerHTML = shown4.map(rowHtml3).join("") || `<div class="vacio">${t(all.length ? "commissions.page.noneFiltered" : "commissions.page.none")}</div>`;
      list.querySelectorAll("[data-liq]").forEach((button2) => {
        button2.onclick = () => {
          void settle(button2, repaint2);
        };
      });
    };
    const person = document.getElementById("liqfu"), month = document.getElementById("liqfp");
    if (person) person.onchange = () => {
      settlementFilters.person = person.value;
      paint8();
    };
    if (month) month.onchange = () => {
      settlementFilters.month = month.value;
      paint8();
    };
    paint8();
  }
  function resultText(period, done, closed, failed) {
    const doneText = done === 1 ? t("commissions.calculate.oneDone") : t("commissions.calculate.done", { count: done });
    const kept = closed ? closed === 1 ? t("commissions.calculate.oneKept") : t("commissions.calculate.kept", { count: closed }) : "";
    return doneText + t("commissions.calculate.ofPeriod", { period: formatMonth(period) }) + kept + (failed ? t("commissions.calculate.failed", { count: failed }) : "");
  }
  async function toCalculate(period) {
    const start2 = `${period}-01`, end = monthEnd(period), ids = new Set(schemes().map((scheme) => scheme.id));
    const [{ data: assignments, error }, { data: existing }] = await Promise.all([
      legacyDb().from("asignaciones_comision").select("usuario_id,esquema_id,desde,hasta"),
      callRpc("liquidaciones_lista", { p_periodo: period })
    ]);
    if (error) {
      notices.toast(t("commissions.calculate.couldNotRead", { error: error.message ?? "" }), true);
      return null;
    }
    const closed = new Set((existing ?? []).filter((item) => item.estado !== SETTLEMENT.draft).map((item) => item.usuario_id));
    const users = [...new Set((assignments ?? []).filter((item) => ids.has(item.esquema_id) && (!item.desde || item.desde <= end) && (!item.hasta || item.hasta >= start2)).map((item) => item.usuario_id))];
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
    const button2 = document.getElementById("liqcalc");
    if (button2) button2.disabled = true;
    let failed = 0;
    for (const user of pending) {
      const { data: result, error } = await legacyDb().rpc("liquidar", { p_usuario: user, p_periodo: period, p_estado: SETTLEMENT.draft });
      if (error || result?.ok === false) failed++;
    }
    if (button2) button2.disabled = false;
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
    return `<div class="item" style="cursor:default">
      <span class="ic">${scheme.calculo === FIXED2 ? "€" : "▤"}</span>
      <span class="tx"><b>${escapeHtml(scheme.nombre)}</b><span class="sm">
        ${t(scheme.atribucion === CLOSES ? "commissions.page.perSale" : "commissions.page.perPortfolio")} ·
        ${howItCounts(scheme)}
        ${people.length ? ` · ${people.map(escapeHtml).join(", ")}` : t("commissions.page.unassigned")}</span></span>
      <span class="acts" style="margin:0"><button class="btn sec chico" data-esq="${scheme.id}">${t("commissions.page.edit")}</button></span></div>`;
  }
  function pageHtml(all) {
    const list = schemes();
    return `
    <h2>${t("commissions.page.schemes")}<span class="n">${list.length}</span></h2>
    <p class="sm">${t("commissions.page.schemesHint")}</p>
    <div class="lista">${list.map(schemeRow).join("") || `<div class="vacio">${t("commissions.page.noSchemes")}</div>`}</div>
    <div class="acts" style="padding:0 16px 14px"><button class="btn" id="esqnuevo">${t("commissions.page.newScheme")}</button></div>

    <h2>${t("commissions.page.settlements")}</h2>
    <div class="acts" style="padding:0 16px">
      <input id="liqper" type="month" value="${todayIso().slice(0, 7)}" style="max-width:190px">
      <button class="btn sec" id="liqcalc">${t("commissions.page.calculate")}</button></div>
    ${filtersHtml(all)}
    <div class="lista"></div>`;
  }
  var repaint = () => {
    void paintCommissions();
  };
  async function paintCommissions() {
    const loading2 = document.getElementById("admcuerpo");
    if (loading2) loading2.innerHTML = '<div class="skel"></div><div class="skel" style="width:60%"></div>';
    const [{ data: found }, { data: settlements }] = await Promise.all([
      legacyDb().rpc("esquemas_lista"),
      legacyDb().rpc("liquidaciones_lista", { p_periodo: null })
    ]);
    commissionsLegacy.setSchemes(found ?? []);
    const body2 = document.getElementById("admcuerpo");
    if (!body2) return;
    body2.innerHTML = pageHtml(settlements ?? []);
    const add2 = document.getElementById("esqnuevo");
    if (add2) add2.onclick = () => {
      editScheme(null, repaint);
    };
    body2.querySelectorAll("[data-esq]").forEach((button2) => {
      button2.onclick = () => {
        editScheme(button2.dataset.esq ?? null, repaint);
      };
    });
    const calculate = document.getElementById("liqcalc");
    if (calculate) calculate.onclick = () => {
      void calculateSettlements(repaint);
    };
    const list = document.getElementById("liqfil")?.nextElementSibling;
    if (list instanceof HTMLElement) paintSettlements(list, settlements ?? [], repaint);
  }

  // src/app/screens/customers/index.ts
  var customers_exports = {};
  __export(customers_exports, {
    listCustomers: () => listCustomers,
    loadCustomers: () => loadCustomers,
    paintCustomers: () => paintCustomers,
    pickCustomer: () => pickCustomer,
    searchCustomers: () => searchCustomers,
    setCustomerOff: () => setCustomerOff,
    showCustomer: () => showCustomer
  });

  // src/app/legacy/customers-bridge.ts
  var customersLegacy = {
    filters: () => PAC,
    canSell: () => Boolean(puedeVentas()),
    editCustomer: (customer, onSave) => {
      editorContacto(customer, (saved2) => {
        onSave(saved2);
      });
    },
    orderPill: (state) => pillEstado(state),
    newSale: (preset) => {
      void nuevaVenta(preset);
    },
    shownCustomer: () => FICHA_PAC,
    setShownCustomer: (id) => {
      FICHA_PAC = id;
    },
    forgetShownAccount: () => {
      FICHA_ID = null;
    },
    visibleFieldColumns: () => clasVisibles("cliente"),
    fieldHeaders: (fields) => clasCabeceras(fields),
    widenGrid: (grid, count2) => {
      clasRejilla(grid, count2);
    },
    fieldFilters: (state) => camposFiltros("cliente", state, "pfcp"),
    bindFieldFilters: (zone, state, onChange) => {
      camposFiltrosActivar(zone, state, onChange);
    },
    showLoading: (element2, text2) => {
      cargando(element2, text2);
    },
    clearModules: (except) => {
      vaciarModulos(except);
    },
    customFields: (id, container) => bloqueCampos("contactos", id, container),
    forgetPreloads: () => {
      DB_PRE.clear();
    },
    /** Through the global name (the list bar and Pedidos call it too). */
    repaintList: () => {
      void listaPacientes();
    }
  };

  // src/app/screens/customers/model.ts
  var TYPES2 = { person: "Persona", company: "Empresa" };
  var words3 = () => ({
    patient: term("paciente"),
    patients: term("paciente", { number: "p" }),
    Patient: term("paciente", { capital: "C" }),
    Patients: term("paciente", { number: "p", capital: "C" }),
    professional: term("medico"),
    Professional: term("medico", { capital: "C" })
  });
  var phoneOf = (customer) => orFallback(customer.telefono, customer.movil ?? "");
  var textOrNull = (value10) => orFallback(value10, "") || null;
  var deliveryAddress = (customer) => [customer.direccion, [customer.cp, customer.municipio].filter(Boolean).join(" "), customer.provincia].filter(Boolean).join(", ");
  function taxIdText(customer) {
    if (!customer.nif) return t("customers.card.noTaxId");
    return t(customer.tipo === TYPES2.company ? "customers.card.taxIdCompany" : "customers.card.taxIdPerson", { taxId: customer.nif });
  }
  function customerCard(customer) {
    const address = deliveryAddress(customer);
    const contact = [taxIdText(customer), customer.email, phoneOf(customer)].filter(Boolean).join(" · ");
    return `<div class="selcard"><span class="ic">🧑</span>
  <span class="tx"><b>${escapeHtml(customer.nombre)}</b>
    ${address ? `<span class="sm">📦 ${escapeHtml(address)}</span>` : `<span class="sm" style="color:var(--warn)">${t("customers.card.noAddress")}</span>`}
    <span class="sm">${escapeHtml(contact)}</span>
    ${customer.medico ? `<span class="sm">${term("medico", { capital: "C" })}: ${escapeHtml(customer.medico)}</span>` : ""}</span>
  <button type="button" class="sx" aria-label="${t("customers.card.remove")}">✕</button></div>`;
  }
  function listParams() {
    const filters = customersLegacy.filters(), size = accountListLegacy.pageSize(), fields = filters.campos ?? {};
    return {
      q: textOrNull(filters.q),
      p_medico: filters.medico,
      lim: size,
      desplaz: filters.pagina * size,
      p_tipo: textOrNull(filters.tipo),
      p_pedidos: textOrNull(filters.pedidos),
      p_municipio: textOrNull(filters.municipio),
      ...Object.keys(fields).length ? { f_campos: fields } : {}
    };
  }

  // src/app/screens/customers/sheet.ts
  var NOT_COUNTED2 = ["Anulado", "Borrador"];
  var FULL_SALES_LEVEL = 3;
  var sheetBody = () => document.getElementById("fbody");
  var sheetBox = () => document.getElementById("ficha");
  function professionalHtml(professional, canSell) {
    const shown4 = professional ? `<div><button class="kcfg" data-fpmed="${professional.id}" style="font-size:15px">${escapeHtml(professional.nombre)}</button>
          <span class="sm">${t("customers.sheet.code", { code: escapeHtml(professional.codigo ?? "") })}${professional.especialidad ? ` · ${escapeHtml(professional.especialidad)}` : ""}</span></div>
        <div class="sm">${professional.comercial ? t("customers.sheet.salesRep", { name: escapeHtml(professional.comercial) }) : t("customers.sheet.noSalesRep")}</div>` : `<div class="sm">${t("customers.sheet.unassigned", { professionalAssigned: term("medico", { adjective: "asignado" }), thisPatient: term("paciente", { article: "este" }) })}</div>`;
    const change = canSell ? `<label>${t(professional ? "customers.sheet.change" : "customers.sheet.assign", words3())}</label><div id="fpsel"></div>
        ${professional ? `<div class="acts"><button class="btn sec" id="fpmedquitar">${t("customers.sheet.removeProfessional", words3())}</button></div>` : ""}` : "";
    return `<div class="blk"><h3>${t("customers.sheet.treatedBy", words3())}</h3>
      ${shown4}
      ${change}
    </div>`;
  }
  function contactHtml(customer) {
    const lines = [
      [t("customers.sheet.phone"), customer.telefono],
      [t("customers.sheet.mobile"), customer.movil],
      [t("customers.sheet.email"), customer.email],
      [t("customers.sheet.address"), [customer.direccion, customer.cp, customer.municipio, customer.provincia].filter(Boolean).join(", ")],
      [t("customers.sheet.note"), customer.nota]
    ];
    return `<div class="blk"><h3>${t("customers.sheet.contact")}</h3>
      ${lines.filter((line2) => line2[1]).map(([label, value10]) => `<div class="sm"><b style="color:var(--ink)">${label}:</b> ${escapeHtml(value10)}</div>`).join("") || `<div class="sm">${t("customers.sheet.noContact")}</div>`}</div>`;
  }
  var orderHtml = (order) => `<button class="item" data-fpped="${order.id}" style="padding:8px 4px">
        <span class="tx"><b>${formatShortDate(order.fecha)} · ${escapeHtml(orFallback(order.productos, t("customers.sheet.noProducts")))}</b>
          <span class="sm">${t("customers.sheet.orderLine", { units: formatNumber(order.unidades), total: portalLegacy.euros(Number(order.total)) })}${order.medico ? ` · ${escapeHtml(order.medico)}` : ""}</span></span>
        ${customersLegacy.orderPill(order.estado)}</button>`;
  function sheetHtml3(detail, customer, canSell) {
    const orders = detail.pedidos ?? [], counted = orders.filter((order) => !NOT_COUNTED2.includes(order.estado));
    return `
    <div class="fh"><div><h2>${escapeHtml(customer.nombre)}</h2><div class="sm">${words3().Patient}${customer.nif ? t("customers.sheet.taxId", { taxId: escapeHtml(customer.nif) }) : ""}</div></div>
      <button class="x" id="fpx" aria-label="${t("common.close")}">✕</button></div>
    ${canSell ? `<div class="acts"><button class="btn" id="fpnped">${t("customers.sheet.newOrder")}</button>
      <button class="btn sec" id="fpedit">${t("customers.sheet.editData")}</button></div>` : ""}
    <div class="kpis" style="margin:10px 0 0;grid-template-columns:repeat(3,minmax(0,1fr))">
      <div class="kpi"><b>${formatNumber(counted.length)}</b><span>${t("customers.sheet.orders")}</span></div>
      <div class="kpi"><b>${formatNumber(detail.total_unidades)}</b><span>${t("customers.sheet.units")}</span></div>
      <div class="kpi"><b>${portalLegacy.euros(sum(counted.map((order) => Number(order.total) || 0)))}</b><span>${t("customers.sheet.withVat")}</span></div></div>
    ${professionalHtml(detail.medico, canSell)}
    ${contactHtml(customer)}
    <div class="blk"><h3>${t("customers.sheet.ordersTitle")}</h3>
      ${orders.map(orderHtml).join("") || `<div class="sm">${t("customers.sheet.noOrders")}</div>`}</div>`;
  }
  async function assign2(id, professionalId) {
    const { data: result, error } = await legacyDb().rpc("asignar_cuenta_cliente", { p_contacto: id, p_medico: professionalId });
    if (error || result?.ok === false) {
      notices.toast(t("customers.sheet.couldNotSave"), true);
      return;
    }
    notices.toast(term("medico", { capital: "C", adjective: professionalId ? "asignado" : "quitado" }));
    void showCustomer(id);
    if (currentScreen() === "pacientes") customersLegacy.repaintList();
  }
  function bind8(id, customer, professional) {
    const body2 = sheetBody(), on2 = (elementId, action) => {
      const button2 = document.getElementById(elementId);
      if (button2) button2.onclick = action;
    };
    on2("fpx", () => {
      customersLegacy.setShownCustomer(null);
      sheetBox()?.close();
    });
    body2?.querySelectorAll("[data-fpped]").forEach((button2) => {
      button2.onclick = () => {
        appLegacy.openOrder(button2.dataset.fpped ?? "");
      };
    });
    const shownProfessional = body2?.querySelector("[data-fpmed]");
    if (shownProfessional) shownProfessional.onclick = () => {
      customersLegacy.setShownCustomer(null);
      agendaActions.openAccount(shownProfessional.dataset.fpmed ?? "");
    };
    on2("fpnped", () => {
      customersLegacy.newSale({
        contacto: { ...customer, ...professional ? { medico: professional.nombre, medico_codigo: professional.codigo } : {} },
        medico: professional ? { id: professional.id, nombre: professional.nombre } : null
      });
    });
    on2("fpedit", () => {
      customersLegacy.editCustomer(customer, () => {
        void showCustomer(id);
      });
    });
    on2("fpmedquitar", () => {
      void assign2(id, null);
    });
    const picker = document.getElementById("fpsel");
    if (picker) editorLegacy.pickAccount(picker, null, (picked) => {
      void assign2(id, picked.id);
    }, t("customers.sheet.pickPlaceholder", { theProfessional: term("medico", { article: "el" }) }));
  }
  async function paintSheet(id) {
    customersLegacy.setShownCustomer(id);
    customersLegacy.forgetShownAccount();
    const body2 = sheetBody(), box = sheetBox();
    if (!body2 || !box) return;
    body2.innerHTML = '<div class="skel" style="width:50%"></div><div class="skel"></div><div class="skel" style="width:80%"></div>';
    if (!box.open) box.showModal();
    const { data } = await callRpc("contacto_detalle", { p_id: id });
    if (customersLegacy.shownCustomer() !== id) return;
    if (!data?.contacto) {
      body2.innerHTML = `<div class="vacio">${t("customers.sheet.notFound", { thePatient: term("paciente", { article: "el" }) })}</div>`;
      return;
    }
    const canSell = customersLegacy.canSell();
    body2.innerHTML = sheetHtml3(data, data.contacto, canSell);
    bind8(id, data.contacto, data.medico);
  }
  async function addStatusButtons(id) {
    const body2 = sheetBody();
    if (!body2 || customersLegacy.shownCustomer() !== id || document.getElementById("cbajablk") || !customersLegacy.canSell()) return;
    const { data: customer } = await legacyDb().from("contactos").select("archivado_en").eq("id", id).maybeSingle();
    if (!customer || customersLegacy.shownCustomer() !== id) return;
    const toggle = customer.archivado_en ? `<button type="button" class="btn sec chico" data-calta="${id}">${t("customers.sheet.reactivate")}</button>` : `<button type="button" class="btn sec chico" data-cbaja="${id}">${t("customers.sheet.deactivate")}</button>`;
    body2.insertAdjacentHTML("beforeend", `<div class="blk fbajablk" id="cbajablk"><div class="acts">
      ${toggle}
      ${permissions.salesLevel() >= FULL_SALES_LEVEL ? `<button type="button" class="btn sec dang chico" data-celim="${id}">${t("customers.sheet.delete", { thePatient: escapeHtml(term("paciente", { article: "el" })) })}</button>` : ""}</div></div>`);
  }
  async function showCustomer(id) {
    await paintSheet(id);
    const box = sheetBox();
    void customersLegacy.customFields(id, box ? box.querySelector(".fbody, #fbody") ?? box.firstElementChild : null);
    try {
      await addStatusButtons(id);
    } catch {
    }
  }

  // src/app/screens/customers/list.ts
  var SEARCH_WAIT_MS = 300;
  var empty = '<span class="vac">—</span>';
  var shown2 = (value10) => value10 ? escapeHtml(value10) : empty;
  function headerHtml5(fields) {
    const titles = [t("customers.list.customer"), t("customers.list.type"), t("customers.list.taxId"), t("customers.list.phone"), t("customers.list.email"), t("customers.list.town")];
    return `<div class="dh">${titles.map((title2) => `<span>${title2}</span>`).join("")}
      <span>${words3().Professional}</span><span>${t("customers.list.salesRep")}</span><span class="num">${t("customers.list.orders")}</span><span class="num">${t("customers.list.units")}</span><span>${t("customers.list.lastOrder")}</span>${customersLegacy.fieldHeaders(fields)}</div>`;
  }
  function rowHtml4(row4, fields) {
    const company = row4.tipo === TYPES2.company, values = row4.clasificadores ?? {};
    return `<button class="dr" data-pac="${row4.id}">
      <span><b>${escapeHtml(row4.nombre)}</b></span>
      <span><span class="pill ${company ? "p-emp" : "p-per"}">${company ? t("customers.company") : words3().Patient}</span></span>
      <span>${shown2(row4.nif)}</span><span>${shown2(phoneOf(row4))}</span><span class="corta">${shown2(row4.email)}</span><span>${shown2(row4.municipio)}</span>
      <span class="corta">${row4.medico ? escapeHtml(row4.medico) : `<span class="vac">${t("customers.list.unassigned")}</span>`}</span><span>${shown2(row4.comercial)}</span>
      <span class="num">${formatNumber(row4.pedidos)}</span><span class="num"><b>${formatNumber(row4.unidades)}</b></span>
      <span>${row4.ultimo_pedido ? formatShortDate(row4.ultimo_pedido) : empty}</span>${fields.map((field4) => `<span>${shown2(accountColumnsLegacy.fieldText(field4, values[field4.clave]))}</span>`).join("")}
    </button>`;
  }
  function paintRows(page) {
    const count2 = document.getElementById("paccuenta"), list = document.getElementById("paclista");
    if (!count2 || !list) return;
    count2.innerHTML = `<b>${formatNumber(page.total)}</b> ${page.total === 1 ? t("customers.list.oneCustomer") : t("customers.list.customers")}`;
    const rows = page.filas ?? [], fields = customersLegacy.visibleFieldColumns();
    list.innerHTML = rows.length ? `<div class="dgrid-wrap"><div class="dgrid pacs">
    ${headerHtml5(fields)}
    ${rows.map((row4) => rowHtml4(row4, fields)).join("")}</div></div>` : `<div class="vacio">${t("customers.list.none")}</div>`;
    customersLegacy.widenGrid(list.querySelector(".dgrid.pacs"), fields.length);
    list.querySelectorAll("[data-pac]").forEach((button2) => {
      button2.onclick = () => {
        void showCustomer(button2.dataset.pac ?? "");
      };
    });
    const filters = customersLegacy.filters();
    accountListLegacy.paginate({
      element: document.getElementById("pacpag"),
      total: page.total,
      page: filters.pagina,
      onPage: (pageNumber) => {
        filters.pagina = pageNumber;
        void listCustomers();
      },
      onSize: () => {
        filters.pagina = 0;
        void listCustomers();
      }
    });
  }
  async function listCustomers(answer) {
    customersLegacy.showLoading(document.getElementById("paclista"), t("customers.list.searching"));
    const { data, error } = await (answer ?? legacyDb().rpc("clientes_lista", listParams()));
    if (error || !data) {
      const count2 = document.getElementById("paccuenta"), list = document.getElementById("paclista");
      if (count2) count2.textContent = t("customers.list.couldNotLoad", { error: error?.message ?? "" });
      if (list) list.innerHTML = "";
      return;
    }
    paintRows(data);
  }
  var option3 = (value10, label, chosen2) => `<option value="${escapeHtml(value10)}" ${chosen2 === value10 ? "selected" : ""}>${label}</option>`;
  function filtersHtml2(towns) {
    const filters = customersLegacy.filters();
    filters.campos ?? (filters.campos = {});
    return `<div class="filtros">
        <div><label for="pacq">${t("customers.list.search")}</label><input id="pacq" type="search" value="${escapeHtml(filters.q)}" placeholder="${t("customers.list.searchPlaceholder")}"></div>
        <div><label for="pactipo">${t("customers.list.type")}</label><select id="pactipo">
          <option value="">${t("customers.list.all")}</option>${option3(TYPES2.person, t("customers.list.persons", words3()), filters.tipo)}
          ${option3(TYPES2.company, t("customers.list.companies"), filters.tipo)}</select></div>
        <div><label for="pacped">${t("customers.list.orders")}</label><select id="pacped">
          <option value="">${t("customers.list.all")}</option>${option3("con", t("customers.list.withOrders"), filters.pedidos)}
          ${option3("sin", t("customers.list.withoutOrders"), filters.pedidos)}</select></div>
        <div><label for="pacmun">${t("customers.list.town")}</label><select id="pacmun"><option value="">${t("customers.list.allTowns")}</option>
          ${towns.map((town) => option3(town.v, `${escapeHtml(town.v)} (${town.n})`, filters.municipio)).join("")}</select></div>
        ${customersLegacy.fieldFilters(filters.campos)}
        ${filters.medico ? `<div><label>${words3().Professional}</label><div style="min-height:44px;display:flex;align-items:center"><button class="chip" id="pacmedx">${escapeHtml(filters.medicoNombre)} ✕</button></div></div>` : ""}
      </div>`;
  }
  var searchTimer;
  function bindFilters(body2) {
    const filters = customersLegacy.filters(), again = () => {
      filters.pagina = 0;
      void listCustomers();
    };
    const search3 = document.getElementById("pacq");
    if (search3) search3.oninput = () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        filters.q = search3.value.trim();
        again();
      }, SEARCH_WAIT_MS);
    };
    const onSelect = (id, set) => {
      const select2 = document.getElementById(id);
      if (select2) select2.onchange = () => {
        set(select2.value);
        again();
      };
    };
    onSelect("pactipo", (value10) => {
      filters.tipo = value10;
    });
    onSelect("pacped", (value10) => {
      filters.pedidos = value10;
    });
    onSelect("pacmun", (value10) => {
      filters.municipio = value10;
    });
    customersLegacy.bindFieldFilters(body2, filters.campos ?? {}, again);
    const professional = document.getElementById("pacmedx");
    if (professional) professional.onclick = () => {
      filters.medico = null;
      filters.medicoNombre = "";
      filters.pagina = 0;
      void paintCustomers();
    };
  }
  async function paintCustomers() {
    const [{ data: towns }, list] = await Promise.all([legacyDb().rpc("municipios_clientes"), legacyDb().rpc("clientes_lista", listParams())]);
    const body2 = document.getElementById("vcuerpo");
    if (!body2) return;
    body2.innerHTML = `
    <div class="panel">
      ${filtersHtml2(towns ?? [])}
      <div class="cuenta" id="paccuenta">${t("customers.list.loading")}</div>
      <div id="paclista"></div>
      <div id="pacpag"></div>
    </div>`;
    bindFilters(body2);
    await listCustomers(Promise.resolve(list));
  }
  function loadCustomers() {
    customersLegacy.clearModules("v-pacientes");
    const page = document.getElementById("v-pacientes");
    if (!page) return;
    page.innerHTML = `
    <div class="saludo"><div><h1>${t("customers.list.title")}</h1><div class="fecha">${t("customers.list.subtitle", words3())}</div></div>
      <div class="acts" style="margin:0">${customersLegacy.canSell() ? `<button class="btn" id="pacnuevo">${t("customers.list.newCustomer")}</button>` : ""}</div></div>
    <div id="vcuerpo"></div>`;
    const add2 = document.getElementById("pacnuevo");
    if (add2) add2.onclick = () => {
      customersLegacy.editCustomer({}, (customer) => {
        void showCustomer(customer.id);
      });
    };
    void paintCustomers();
  }

  // src/app/screens/customers/picker.ts
  var MIN_LETTERS = 2;
  var WAIT_MS = 250;
  var SHOWN = 8;
  var foundRow = (item, index) => `<button type="button" data-pc="${index}"><span class="gic">🧑</span>
          <span><b>${escapeHtml(item.nombre)}</b><span class="sm">${escapeHtml([phoneOf(item), item.nif, item.municipio, item.medico].filter(Boolean).join(" · "))}</span></span></button>`;
  var CustomerPicker = class {
    constructor(element2, options) {
      this.element = element2;
      this.options = options;
      __publicField(this, "value");
      __publicField(this, "timer");
      __publicField(this, "asked", 0);
      this.value = options.valor ?? null;
    }
    choose(customer) {
      this.value = customer;
      this.paint();
      this.options.alElegir?.(customer);
    }
    paint() {
      if (this.value) {
        this.element.innerHTML = customerCard(this.value);
        const remove7 = this.element.querySelector(".sx");
        if (remove7) remove7.onclick = () => {
          this.choose(null);
        };
        return;
      }
      this.element.innerHTML = `<div style="display:flex;gap:8px"><div class="picker" style="flex:1">
        <input type="search" autocomplete="off" placeholder="${t("customers.picker.placeholder")}"><div class="gsug hide"></div></div>
      <button type="button" class="btn sec" data-pnuevo>${t("customers.picker.newOne")}</button></div>`;
      const input3 = this.element.querySelector("input");
      if (input3) input3.oninput = () => {
        this.search(input3.value.trim());
      };
      const add2 = this.element.querySelector("[data-pnuevo]");
      if (add2) add2.onclick = () => {
        customersLegacy.editCustomer({ nombre: input3?.value.trim() ?? "" }, (customer) => {
          this.choose({ ...customer });
        });
      };
    }
    search(text2) {
      const box = this.element.querySelector(".picker"), list = box?.querySelector(".gsug");
      if (!box || !list) return;
      clearTimeout(this.timer);
      if (text2.length < MIN_LETTERS) {
        list.classList.add("hide");
        box.classList.remove("buscando");
        return;
      }
      box.classList.add("buscando");
      list.innerHTML = `<div class="gload"><span class="spin"></span>${t("customers.picker.searching", words3())}</div>`;
      list.classList.remove("hide");
      const turn = ++this.asked;
      this.timer = setTimeout(() => {
        void this.showFound(text2, turn, box, list);
      }, WAIT_MS);
    }
    async showFound(text2, turn, box, list) {
      const { data } = await legacyDb().rpc("contactos_lista", { q: text2, lim: SHOWN });
      if (turn !== this.asked) return;
      box.classList.remove("buscando");
      const found = data ?? [];
      list.innerHTML = `<div class="gsh">${words3().Patients}</div>${found.map(foundRow).join("") || `<div class="gload">${t("customers.picker.noMatches")}</div>`}`;
      list.querySelectorAll("[data-pc]").forEach((button2) => {
        button2.onclick = () => {
          this.choose(found[Number(button2.dataset.pc)] ?? null);
        };
      });
    }
  };
  function pickCustomer(element2, options) {
    new CustomerPicker(element2, options).paint();
  }

  // src/app/screens/customers/status.ts
  var MIN_LETTERS2 = 2;
  var SHOWN2 = 8;
  async function setCustomerOff(id, off) {
    const { data: result, error } = await legacyDb().rpc("baja_cliente", { p_id: id, p_baja: off });
    if (error || !result?.ok) {
      const reason = error?.message ?? result?.error ?? "";
      notices.toast(t("customers.status.couldNot", { error: reason }), true);
      return false;
    }
    try {
      appLegacy.forgetCache();
      customersLegacy.forgetPreloads();
    } catch {
    }
    notices.toast(t(off ? "customers.status.deactivated" : "customers.status.reactivated", words3()));
    if (currentScreen() === "pacientes") customersLegacy.repaintList();
    return true;
  }
  async function searchCustomers(text2) {
    const clean = text2.trim().replace(/[,()]/g, " ");
    if (clean.length < MIN_LETTERS2) return [];
    const { data } = await legacyDb().from("contactos").select("id,nombre,telefono,movil,email,nif,cuenta_id").or(`nombre.ilike.%${clean}%,telefono.ilike.%${clean}%,movil.ilike.%${clean}%,nif.ilike.%${clean}%`).limit(SHOWN2);
    return data ?? [];
  }

  // src/app/screens/opportunities/index.ts
  var opportunities_exports = {};
  __export(opportunities_exports, {
    activateCallRecord: () => activateCallRecord,
    callRecordHtml: () => callRecordHtml,
    editOpportunity: () => editOpportunity,
    paintOpportunities: () => paintOpportunities,
    readCallRecord: () => readCallRecord,
    saveCallRecord: () => saveCallRecord
  });

  // src/app/screens/opportunities/model.ts
  var ORDER_DONE = "Pedido hecho";
  var INCOMING = "Entrante";
  var OUTGOING = "Saliente";
  var OUTGOING_CALL = "Llamada saliente";
  var FOLLOW_UP_REASON = "Seguimiento de televenta";
  var FOLLOW_UP_DAYS = [
    ["opportunities.followUpDays.tomorrow", 1],
    ["opportunities.followUpDays.threeDays", 3],
    ["opportunities.followUpDays.week", 7],
    ["opportunities.followUpDays.month", 30]
  ];
  var followUpButtons = (attribute) => FOLLOW_UP_DAYS.map(([key, days]) => `<button type="button" class="chipsel" data-${attribute}="${days}">${t(key)}</button>`).join("");
  function dateIn(days) {
    const date = /* @__PURE__ */ new Date();
    date.setDate(date.getDate() + days);
    return toIsoDate(date);
  }
  var catalog = (key) => opportunitiesLegacy.catalog(key);
  async function loadCatalog(key) {
    if (catalog(key).length) return;
    const { data } = await legacyDb().rpc("catalogo_papel", { p_papel: key });
    opportunitiesLegacy.setCatalog(key, data ?? []);
  }
  async function loadCallCatalogs() {
    for (const key of ["motivo_llamada", "resultado_llamada"]) await loadCatalog(key);
  }
  async function loadOpportunityCatalogs() {
    await loadCallCatalogs();
    await loadCatalog("origen_oportunidad");
  }
  var toneOf = (entry) => entry.extra === "neg" ? "neg" : entry.extra === "pos" ? "pos" : "";
  var chipsHtml = (list, chosen2, attribute) => list.map((entry) => `<button type="button" class="chipsel ${entry.valor === chosen2 ? "on" : ""} ${toneOf(entry)}" ${attribute}="${escapeHtml(entry.valor)}">${escapeHtml(entry.valor)}</button>`).join("");
  function toggleChip(group, attribute, current, pressed2) {
    const chosen2 = current === pressed2 ? "" : pressed2;
    group.querySelectorAll(`[${attribute}]`).forEach((chip) => {
      chip.classList.toggle("on", chip.getAttribute(attribute) === chosen2);
    });
    return chosen2;
  }
  var round2 = (value10) => Math.round((Number(value10) || 0) * 100) / 100;
  function lineAmount(productId, units2) {
    const product = opportunitiesLegacy.products().find((item) => item.id === productId);
    if (product?.precio === null || product?.precio === void 0) return 0;
    return round2(product.precio * (1 + (Number(product.iva) || 0) / 100) * (Number(units2) || 0));
  }
  function orderLineAmount(productId, units2) {
    const product = opportunitiesLegacy.products().find((item) => item.id === productId);
    return product?.precio === null || product?.precio === void 0 ? null : round2(product.precio * units2);
  }
  var isPhone = (text2) => /^[+\d\s]{6,}$/.test(text2);

  // src/app/screens/opportunities/call-record.ts
  var chosen = { motivo: "", resultado: "" };
  var value6 = (id) => document.getElementById(id)?.value ?? "";
  var needsFollowUp = (result) => Boolean(result) && result !== ORDER_DONE;
  function callRecordHtml(state) {
    const call = state ?? {}, outgoing = call.direccion === OUTGOING;
    return `<details class="blk kollam" id="kollam" ${call.motivo !== void 0 ? "open" : ""}><summary>${t("opportunities.callRecord.title")}</summary>
    <div class="sm">${t("opportunities.callRecord.hint")}</div>
    <label>${t("opportunities.callRecord.reason")}</label><div class="chipsw" id="kolmot"></div>
    <label>${t("opportunities.callRecord.result")}</label><div class="chipsw" id="kolres"></div>
    <div id="kolseg" class="${needsFollowUp(call.resultado) ? "" : "hide"}">
      <div class="sm" style="margin:8px 0 4px">${t("opportunities.callAgainWhen")}</div>
      <div class="chipsw">${followUpButtons("kold")}</div>
      <div class="g2" style="margin-top:6px"><div><input id="kolpf" type="date" value="${escapeHtml(orFallback(call.proxima_fecha, ""))}" aria-label="${t("opportunities.callAgainOn")}"></div>
        <div><input id="kolpa" value="${escapeHtml(orFallback(call.proxima_accion, ""))}" placeholder="${t("opportunities.whatToDoPlaceholder")}" aria-label="${t("opportunities.whatToDo")}"></div></div></div>
    <div class="g2"><div><label for="kold">${t("opportunities.callRecord.type")}</label><select id="kold"><option value="${INCOMING}" ${outgoing ? "" : "selected"}>${t("opportunities.callRecord.incoming")}</option><option value="${OUTGOING}" ${outgoing ? "selected" : ""}>${t("opportunities.callRecord.outgoing")}</option></select></div>
      <div><label for="kolno">${t("opportunities.callRecord.note")}</label><input id="kolno" value="${escapeHtml(orFallback(call.nota, ""))}"></div></div>
    <div class="acts" style="margin-top:8px"><button type="button" class="btn sec" id="kosolo">${t("opportunities.callRecord.callOnly")}</button></div>
  </details>`;
  }
  function onClick2(event) {
    const target = event.target;
    const reason = target.closest("[data-kom]"), result = target.closest("[data-kor]"), days = target.closest("[data-kold]");
    const reasons = document.getElementById("kolmot"), results = document.getElementById("kolres");
    if (reason && reasons) chosen.motivo = toggleChip(reasons, "data-kom", chosen.motivo, reason.dataset.kom ?? "");
    if (result && results) {
      chosen.resultado = toggleChip(results, "data-kor", chosen.resultado, result.dataset.kor ?? "");
      document.getElementById("kolseg")?.classList.toggle("hide", !needsFollowUp(chosen.resultado));
    }
    if (days) {
      const date = document.getElementById("kolpf");
      if (date) date.value = dateIn(Number(days.dataset.kold));
      document.getElementById("kollam")?.querySelectorAll("[data-kold]").forEach((other) => {
        other.classList.toggle("on", other === days);
      });
    }
  }
  function activateCallRecord(state) {
    chosen.motivo = orFallback(state?.motivo, "");
    chosen.resultado = orFallback(state?.resultado, "");
    void loadCallCatalogs().then(() => {
      const reasons = document.getElementById("kolmot"), results = document.getElementById("kolres");
      if (!reasons || !results) return;
      reasons.innerHTML = chipsHtml(catalog("motivo_llamada"), chosen.motivo, "data-kom");
      results.innerHTML = chipsHtml(catalog("resultado_llamada"), chosen.resultado, "data-kor");
    });
    const block4 = document.getElementById("kollam");
    if (block4) block4.onclick = onClick2;
  }
  function readCallRecord() {
    if (!document.getElementById("kollam")) return null;
    return { motivo: chosen.motivo, resultado: chosen.resultado, direccion: value6("kold"), nota: value6("kolno").trim(), proxima_fecha: value6("kolpf"), proxima_accion: value6("kolpa").trim() };
  }
  function caller(subject, state) {
    return {
      nombre: subject.nombre ?? "",
      telefono: subject.telefono ?? "",
      contacto_id: subject.contacto_id ?? null,
      cliente_nuevo: null,
      cuenta_id: subject.medico ? subject.medico.id : null,
      cuenta_texto: subject.medico ? "" : orFallback(state.cuenta_texto, ""),
      ...subject.datos && Object.keys(subject.datos).length ? { datos: subject.datos } : {}
    };
  }
  function payload2(record2, subject, state) {
    const followUp = needsFollowUp(subject.resultado);
    return {
      id: state.id ?? null,
      fecha: state.fecha ?? null,
      direccion: record2.direccion,
      ...caller(subject, state),
      motivo: record2.motivo,
      resultado: orFallback(subject.resultado, ""),
      proxima_accion: followUp ? record2.proxima_accion : "",
      proxima_fecha: followUp ? record2.proxima_fecha : "",
      nota: record2.nota,
      pedido_id: null,
      llamada_origen: state.previa ?? null
    };
  }
  async function saveCallRecord(record2, subject, state) {
    const { data: result, error } = await legacyDb().rpc("guardar_llamada", { p: payload2(record2, subject, state ?? {}) });
    if (error || result?.ok === false) {
      notices.toast(error ? t("opportunities.callRecord.couldNotSaveError", { error: error.message ?? "" }) : t("opportunities.callRecord.couldNotSave"), true);
      return null;
    }
    return result?.id ?? null;
  }

  // src/app/screens/opportunities/editor/draft.ts
  var typedQuery = () => document.getElementById("nvq")?.value.trim() ?? "";
  var fieldValue = (id) => {
    const field4 = document.getElementById(id);
    return field4 ? field4.value : null;
  };

  // src/app/screens/opportunities/editor/interest.ts
  var HIDDEN_STATES = ["En pausa", "Descatalogado"];
  var totalInterest = (draft) => sum(draft.lines.map((line2) => lineAmount(line2.producto_id, line2.unidades)));
  function paintLoss(draft) {
    const loss = document.getElementById("nvperd");
    if (loss) loss.innerHTML = totalInterest(draft) ? t("opportunities.editor.unsold", { amount: portalLegacy.euros(totalInterest(draft)) }) : "";
  }
  function lineHtml(draft, products2, index) {
    const line2 = draft.lines[index] ?? { producto_id: "", unidades: 0 };
    const options = products2.map((product) => `<option value="${product.id}" ${product.id === line2.producto_id ? "selected" : ""}>${escapeHtml(product.nombre)}</option>`).join("") || `<option value="">${t("opportunities.editor.noProducts")}</option>`;
    return `<div class="nvlin" data-nvi="${index}">
        <select data-nvf="producto_id" aria-label="${t("opportunities.editor.product")}">${options}</select>
        <input data-nvf="unidades" type="number" min="1" step="1" value="${escapeHtml(String(line2.unidades))}" aria-label="${t("opportunities.editor.units")}">
        <span class="nvimp">${portalLegacy.euros(lineAmount(line2.producto_id, line2.unidades))}</span>
        ${draft.lines.length > 1 ? `<button type="button" class="btn sec" data-nvx="${index}" aria-label="${t("opportunities.editor.remove")}">✕</button>` : "<span></span>"}</div>`;
  }
  function bindLine(draft, row4) {
    const index = Number(row4.dataset.nvi), line2 = draft.lines[index];
    if (!line2) return;
    row4.querySelectorAll("[data-nvf]").forEach((input3) => {
      input3.oninput = input3.onchange = () => {
        if (input3.dataset.nvf === "unidades") line2.unidades = Math.max(0, Number(input3.value) || 0);
        else line2.producto_id = input3.value;
        const amount3 = row4.querySelector(".nvimp");
        if (amount3) amount3.textContent = portalLegacy.euros(lineAmount(line2.producto_id, line2.unidades));
        const total = document.getElementById("nvtotv");
        if (total) total.textContent = portalLegacy.euros(totalInterest(draft));
        paintLoss(draft);
      };
    });
  }
  function paintInterest(draft) {
    const box = document.getElementById("nvint");
    if (!box) return;
    const products2 = opportunitiesLegacy.products().filter((product) => product.tipo !== "servicio" && !HIDDEN_STATES.includes(product.estado ?? ""));
    box.innerHTML = range(draft.lines.length).map((index) => lineHtml(draft, products2, index)).join("") + `<div class="nvtot"><button type="button" class="lnk" id="nvmas">${t("opportunities.editor.otherProduct")}</button><span>${t("opportunities.editor.wouldBuy", { amount: portalLegacy.euros(totalInterest(draft)) })}</span></div>`;
    box.querySelectorAll("[data-nvi]").forEach((row4) => {
      bindLine(draft, row4);
    });
    box.querySelectorAll("[data-nvx]").forEach((button2) => {
      button2.onclick = () => {
        draft.lines.splice(Number(button2.dataset.nvx), 1);
        paintInterest(draft);
      };
    });
    const more = document.getElementById("nvmas");
    if (more) more.onclick = () => {
      draft.lines.push({ producto_id: opportunitiesLegacy.defaultProduct(), unidades: 1 });
      paintInterest(draft);
    };
    paintLoss(draft);
  }
  function paintReference(draft) {
    const box = document.getElementById("nvmed");
    if (!box) return;
    box.innerHTML = "";
    opportunitiesLegacy.pickReference({
      element: box,
      value: draft.reference,
      freeText: draft.reference ? "" : draft.source.cuenta_texto ?? "",
      placeholder: t("opportunities.editor.referencePlaceholder"),
      onPick: (account) => {
        draft.reference = account;
      }
    });
  }

  // src/app/screens/opportunities/editor/client.ts
  var SEARCH_WAIT_MS2 = 250;
  var ORDERS_SHOWN = 20;
  var CALLS_SHOWN = 5;
  var phoneOf2 = (client) => orFallback(client.movil, orFallback(client.telefono, orFallback(client.tel, "")));
  var orderTotal = (order) => sum(order.lineas_pedido.map((line2) => (Number(line2.importe) || 0) * (1 + (Number(line2.iva) || 0) / 100)));
  var productName = (id) => opportunitiesLegacy.products().find((product) => product.id === id)?.nombre ?? t("opportunities.editor.defaultProduct");
  async function pastOrders(clientId) {
    const { data: orders } = await legacyDb().from("pedidos").select("id,numero,fecha,estado").eq("contacto_id", clientId).neq("estado", "Anulado").order("fecha", { ascending: false }).limit(ORDERS_SHOWN);
    const list = orders ?? [];
    const { data: lines } = list.length ? await legacyDb().from("lineas_pedido").select("pedido_id,producto_id,unidades,importe,iva").in("pedido_id", list.map((order) => order.id)) : { data: [] };
    return list.map((order) => ({ ...order, lineas_pedido: (lines ?? []).filter((line2) => line2.pedido_id === order.id) }));
  }
  async function pastCalls(draft, clientId) {
    if (!draft.recording) return [];
    const { data } = await legacyDb().from("llamadas").select("id,fecha,resultado,proxima_fecha,proxima_accion,seguimiento_hecho_en,pedido_id").eq("contacto_id", clientId).order("fecha", { ascending: false }).limit(CALLS_SHOWN);
    return data ?? [];
  }
  function lastOrderHtml(draft, last) {
    if (!last) return "";
    const lines = last.lineas_pedido.map((line2) => `${productName(line2.producto_id)} × ${formatNumber(line2.unidades)}`).join(", ");
    return `<div class="nvult"><span>${t("opportunities.editor.lastOrder", { date: formatShortDate(String(last.fecha).slice(0, 10)), lines: escapeHtml(lines), amount: portalLegacy.euros(orderTotal(last)) })}</span>
        ${draft.recording && !draft.closed ? `<button type="button" class="btn sec" id="nvrep">${t("opportunities.editor.repeat")}</button>` : ""}</div>`;
  }
  function contextHtml(draft, orders, promised) {
    if (!orders.length && !promised) return `<span class="sm">${t("opportunities.editor.noOrdersYet")}</span>`;
    const count2 = { count: formatNumber(orders.length), amount: portalLegacy.euros(sum(orders.map(orderTotal))) };
    const total = orders.length ? `<span class="sm">${t(orders.length === ORDERS_SHOWN ? "opportunities.editor.ordersMore" : "opportunities.editor.orders", count2)}</span>` : "";
    const callBack = promised ? `<div class="banda-aviso">${t("opportunities.editor.promised", {
      date: formatShortDate(promised.proxima_fecha ?? ""),
      action: promised.proxima_accion ? `: ${escapeHtml(promised.proxima_accion)}` : "",
      result: escapeHtml(orFallback(promised.resultado, ""))
    })}</div>` : "";
    return `
      ${lastOrderHtml(draft, orders[0])}
      ${total}
      ${callBack}`;
  }
  async function paintContext(draft) {
    const id = draft.client?.id;
    if (!id) return;
    const [orders, calls] = await Promise.all([pastOrders(id), pastCalls(draft, id)]);
    const box = document.getElementById("nvctx");
    if (draft.client?.id !== id || !box) return;
    const promised = calls.find((call) => call.proxima_fecha && !call.seguimiento_hecho_en && !call.pedido_id && call.id !== draft.source.id);
    box.innerHTML = contextHtml(draft, orders, promised);
    const repeat = document.getElementById("nvrep"), last = orders[0];
    if (repeat && last) repeat.onclick = () => {
      draft.lines = last.lineas_pedido.map((line2) => ({ producto_id: line2.producto_id, unidades: Number(line2.unidades) || 1 }));
      paintInterest(draft);
      notices.toast(t("opportunities.editor.repeated"));
    };
  }
  async function choose(draft, client) {
    if (!client) return;
    draft.client = client;
    if (client.cuenta_id && !draft.reference) {
      const { data: account } = await legacyDb().from("cuentas").select("id,nombre").eq("id", client.cuenta_id).maybeSingle();
      if (account) {
        draft.reference = account;
        if (document.getElementById("nvmed")) paintReference(draft);
      }
    }
    paintClient(draft);
  }
  var resultHtml = (client) => `<button type="button" class="item" data-nvc="${client.id}"><span class="tx"><b>${escapeHtml(orFallback(client.nombre, ""))}</b><span class="sm">${escapeHtml([orFallback(client.movil, orFallback(client.telefono, "")), client.nif].filter(Boolean).join(" · "))}</span></span></button>`;
  var searchTimer2;
  async function search(draft) {
    const found = await opportunitiesLegacy.searchClients(typedQuery()), box = document.getElementById("nvres1");
    if (!box) return;
    box.innerHTML = found.map(resultHtml).join("") || (typedQuery().length > 1 ? `<div class="sm" style="padding:6px">${t("opportunities.editor.notFound")}</div>` : "");
    box.querySelectorAll("[data-nvc]").forEach((button2) => {
      button2.onclick = () => {
        void choose(draft, found.find((client) => client.id === button2.dataset.nvc));
      };
    });
  }
  function chosenHtml(draft, client) {
    return `<div class="clisel"><span><b>${escapeHtml(orFallback(client.nombre, ""))}</b><span class="sm">${escapeHtml([phoneOf2(client), client.nif].filter(Boolean).join(" · "))}</span></span>
        ${draft.closed ? "" : `<button type="button" class="btn sec" id="nvcamb">${t("opportunities.editor.change")}</button>`}</div>`;
  }
  function searchHtml(draft) {
    const source = draft.source, typed = source.id ? orFallback(source.nombre, orFallback(source.telefono, "")) : "";
    return `<input id="nvq" type="search" placeholder="${t("opportunities.editor.searchPlaceholder")}" autocomplete="off" value="${escapeHtml(typed)}"><div class="lista" id="nvres1"></div>
      <div class="acts" style="margin:6px 0 0;justify-content:flex-start"><button type="button" class="btn sec" id="nvalta">${t("opportunities.editor.newCard")}</button>
        ${source.id || draft.previous ? "" : `<button type="button" class="lnk" id="nvsin">${t("opportunities.editor.orderWithoutClient")}</button>`}</div>
      ${draft.recording ? `<div class="sm" style="margin-top:4px">${t("opportunities.editor.nameIsEnough")}</div>` : ""}`;
  }
  function bindSearch(draft) {
    const input3 = document.getElementById("nvq");
    if (input3) input3.oninput = () => {
      clearTimeout(searchTimer2);
      searchTimer2 = setTimeout(() => {
        void search(draft);
      }, SEARCH_WAIT_MS2);
    };
    const add2 = document.getElementById("nvalta");
    if (add2) add2.onclick = () => {
      const typed = typedQuery(), phone = isPhone(typed), reference2 = draft.reference;
      opportunitiesLegacy.editContact(
        { nombre: phone ? "" : typed, movil: phone ? typed : "", cuenta_id: reference2 ? reference2.id : null, medico: reference2 ? orFallback(reference2.nombre, "") : "" },
        (client) => {
          void choose(draft, client);
        }
      );
    };
    const withoutClient = document.getElementById("nvsin");
    if (withoutClient) withoutClient.onclick = () => {
      document.getElementById("dlg")?.close();
      opportunitiesLegacy.editOrder();
    };
  }
  function paintClient(draft) {
    const box = document.getElementById("nvcli");
    if (!box) return;
    const client = draft.client;
    if (client) {
      box.innerHTML = chosenHtml(draft, client);
      const change = document.getElementById("nvcamb");
      if (change) change.onclick = () => {
        draft.client = null;
        const context = document.getElementById("nvctx");
        if (context) context.innerHTML = "";
        paintClient(draft);
      };
      void paintContext(draft);
      return;
    }
    box.innerHTML = searchHtml(draft);
    bindSearch(draft);
  }

  // src/app/screens/opportunities/editor/html.ts
  function title(draft) {
    if (draft.source.id) return t(draft.closed ? "opportunities.editor.closedSale" : "opportunities.editor.opportunity");
    return t(draft.previous ? "opportunities.editor.callAgain" : "opportunities.editor.newSale");
  }
  function subtitle(draft) {
    if (draft.previous) return t("opportunities.editor.followUpOf", { name: escapeHtml(orFallback(draft.previous.cliente, orFallback(draft.previous.nombre, ""))) });
    return t(draft.recording ? "opportunities.editor.subtitleRecord" : "opportunities.editor.subtitleOrder");
  }
  function localDateTime(isoDate) {
    const date = new Date(isoDate);
    return new Date(date.getTime() - date.getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
  }
  function wantsHtml(draft) {
    if (!draft.recording) return "";
    return `<div class="llpaso" id="nvp2"><span class="lln">2</span><b>${t("opportunities.editor.wants")}</b>
      <div id="nvint"></div>
      <label>${t("opportunities.editor.reference", { Professional: term("medico", { capital: "C" }) })}</label><div id="nvmed"></div>
      <div class="sm" style="margin-top:4px">${t("opportunities.editor.referenceHint")}</div>
      <label>${t("opportunities.editor.howArrived")}</label><div class="chipsw" id="nvori">${chipsHtml(catalog("origen_oportunidad"), draft.origin, "data-nvo")}</div>
      <label>${t("opportunities.editor.reason")}</label><div class="chipsw" id="nvmot">${chipsHtml(catalog("motivo_llamada"), draft.reason, "data-nvm")}</div>
      <details class="llmas"><summary>${t("opportunities.editor.moreDetails")}</summary>
        <div class="g2"><div><label for="nvf">${t("opportunities.editor.dateTime")}</label><input id="nvf" type="datetime-local" value="${localDateTime(draft.source.fecha ?? "")}"></div>
          <div><label for="nvno">${t("opportunities.editor.note")}</label><input id="nvno" value="${escapeHtml(orFallback(draft.source.nota, ""))}"></div></div></details></div>`;
  }
  function noSaleHtml(draft) {
    if (!draft.recording || draft.closed) return "";
    const results = catalog("resultado_llamada").filter((entry) => entry.extra !== "pos" && entry.valor !== ORDER_DONE);
    return `<div id="nvnoz" class="${draft.noSale ? "" : "hide"}">
        <label>${t("opportunities.editor.whyNoSale")}</label><div class="chipsw" id="nvres">${chipsHtml(results, draft.result, "data-nvr")}</div>
        <div class="sm" style="margin:8px 0 4px">${t("opportunities.callAgainWhen")}</div>
        <div class="chipsw">${followUpButtons("nvd")}</div>
        <div class="g2" style="margin-top:6px"><div><input id="nvpf" type="date" value="${escapeHtml(orFallback(draft.source.proxima_fecha, ""))}" aria-label="${t("opportunities.callAgainOn")}"></div>
          <div><input id="nvpa" value="${escapeHtml(orFallback(draft.source.proxima_accion, ""))}" placeholder="${t("opportunities.whatToDoPlaceholder")}" aria-label="${t("opportunities.whatToDo")}"></div></div>
        <div id="nvperd" class="sm" style="margin-top:6px"></div>
        <div class="acts" style="margin:8px 0 0;justify-content:flex-start"><button type="button" class="btn" id="nvnook">${t("opportunities.editor.saveWithoutOrder")}</button></div></div>`;
  }
  function endsHtml(draft) {
    const ends = draft.closed ? `<div class="banda-ok">${t("opportunities.editor.closedWith", { order: escapeHtml(orFallback(draft.source.pedido, "")) })}</div>` : `<div class="acts nvfin" style="margin:6px 0 0;justify-content:flex-start">
          <button type="button" class="btn" id="nvped">${t("opportunities.editor.makeOrder")}</button>
          ${draft.recording ? `<button type="button" class="btn sec ${draft.noSale ? "on" : ""}" id="nvno2">${t("opportunities.editor.noSale")}</button>` : ""}</div>`;
    return `<div class="llpaso" id="nvp3"><span class="lln">${draft.recording ? 3 : 2}</span><b>${t("opportunities.editor.howEnds")}</b>
      ${ends}
      ${noSaleHtml(draft)}
    </div>`;
  }
  function editorHtml3(draft) {
    const saveChanges2 = draft.recording && (draft.closed || draft.source.id) ? `<button class="btn sec" id="nvguar">${t("opportunities.editor.saveChanges")}</button>` : "";
    return `
    <div class="fh"><div><h2>${title(draft)}</h2>
      <div class="sm">${subtitle(draft)}</div></div>
      <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>
    <div class="llpaso" id="nvp1"><span class="lln">1</span><b>${t("opportunities.editor.client")}</b><div id="nvcli"></div><div id="nvctx" class="nvctx"></div></div>
    ${wantsHtml(draft)}
    ${endsHtml(draft)}
    <div class="acts" style="justify-content:flex-end;flex-wrap:wrap"><button class="btn sec" data-cerrar>${t("opportunities.editor.close")}</button>
      ${saveChanges2}</div>`;
  }

  // src/app/screens/opportunities/editor/outcome.ts
  var closeWindow = () => {
    document.getElementById("dlg")?.close();
  };
  var refreshList = () => {
    if (currentScreen() === "ventas" && opportunitiesLegacy.ordersSection() === "llamadas") opportunitiesLegacy.repaintList();
  };
  var wantedLines = (draft) => draft.lines.filter((line2) => line2.producto_id && Number(line2.unidades) > 0).map((line2) => ({ producto_id: line2.producto_id, unidades: Number(line2.unidades) }));
  function who(draft) {
    const typed = typedQuery(), phone = isPhone(typed), source = draft.source;
    if (draft.client) return { nombre: orFallback(draft.client.nombre, ""), telefono: orFallback(draft.client.movil, orFallback(draft.client.telefono, orFallback(draft.client.tel, ""))) };
    return { nombre: orFallback(phone ? "" : typed, orFallback(source.nombre, "")), telefono: phone ? typed : orFallback(source.telefono, "") };
  }
  function reference(draft) {
    const freeText = String(Reflect.get(document.getElementById("nvmed") ?? {}, "__texto") ?? "");
    return { cuenta_id: draft.reference ? draft.reference.id : null, cuenta_texto: draft.reference ? "" : freeText.trim() };
  }
  function nextStep(result) {
    const followUp = Boolean(result) && result !== ORDER_DONE;
    return { proxima_fecha: followUp ? fieldValue("nvpf") ?? "" : "", proxima_accion: followUp ? (fieldValue("nvpa") ?? "").trim() : "" };
  }
  function payload3(draft, result) {
    const source = draft.source, date = fieldValue("nvf");
    return {
      id: source.id ?? null,
      fecha: date ? new Date(date).toISOString() : source.fecha,
      ...who(draft),
      contacto_id: draft.client ? draft.client.id : null,
      ...reference(draft),
      origen: draft.origin,
      motivo: draft.reason,
      resultado: result,
      ...nextStep(result),
      nota: fieldValue("nvno")?.trim() ?? orFallback(source.nota, ""),
      pedido_id: source.pedido_id ?? null,
      llamada_origen: draft.previous ? draft.previous.id : source.llamada_origen ?? null,
      interes: wantedLines(draft)
    };
  }
  function failure(error, result) {
    if (error) return t("opportunities.editor.couldNotSaveError", { error: error.message ?? "" });
    return t(result?.motivo === "extra" ? "opportunities.editor.noExtra" : "opportunities.editor.couldNotSave");
  }
  async function save5(draft, result) {
    const { data, error } = await legacyDb().rpc("guardar_llamada", { p: payload3(draft, result) });
    if (error || !data || data.ok === false) {
      notices.toast(failure(error, data), true);
      return null;
    }
    return data;
  }
  async function makeOrder(draft, button2) {
    const client = draft.client;
    if (!client) {
      notices.toast(t("opportunities.editor.findClient"), true);
      return;
    }
    button2.disabled = true;
    let saved2 = null;
    if (draft.recording) {
      saved2 = await save5(draft, "");
      if (!saved2) {
        button2.disabled = false;
        return;
      }
    }
    const { data: contact } = await legacyDb().from("contactos").select("id,nombre,nif,email,telefono,movil,cuenta_id").eq("id", client.id).maybeSingle();
    closeWindow();
    refreshList();
    if (saved2?.id) opportunitiesLegacy.setPendingCall(saved2.id);
    const lines = draft.recording ? wantedLines(draft).map((line2) => ({ ...line2, importe: orderLineAmount(line2.producto_id, line2.unidades) })) : [];
    const reference2 = draft.reference;
    opportunitiesLegacy.editOrder({
      contacto: { ...contact ?? client, medico: reference2 ? orFallback(reference2.nombre, "") : "" },
      medico: reference2 ? { id: reference2.id, nombre: reference2.nombre } : null,
      lineas: lines.length ? lines : void 0,
      origen: /web/i.test(draft.origin) ? "web" : void 0
    });
  }
  async function saveWithoutOrder(draft, button2) {
    if (!draft.result) {
      notices.toast(t("opportunities.editor.markWhy"), true);
      return;
    }
    if (!draft.client && !typedQuery() && !draft.source.nombre && !draft.source.telefono) {
      notices.toast(t("opportunities.editor.nameOrPhone"), true);
      return;
    }
    button2.disabled = true;
    const saved2 = await save5(draft, draft.result);
    button2.disabled = false;
    if (!saved2) return;
    closeWindow();
    notices.toast(t("opportunities.editor.savedNoOrder"));
    refreshList();
  }
  async function saveChanges(draft) {
    const result = draft.closed ? orFallback(draft.source.resultado, ORDER_DONE) : draft.noSale ? draft.result : "";
    if (!await save5(draft, result)) return;
    closeWindow();
    notices.toast(t("opportunities.editor.saved"));
    refreshList();
  }
  function bindOutcome(draft) {
    const order = document.getElementById("nvped");
    if (order) order.onclick = () => {
      void makeOrder(draft, order);
    };
    const noOrder = document.getElementById("nvnook");
    if (noOrder) noOrder.onclick = () => {
      void saveWithoutOrder(draft, noOrder);
    };
    const changes = document.getElementById("nvguar");
    if (changes) changes.onclick = () => {
      void saveChanges(draft);
    };
  }

  // src/app/screens/opportunities/editor/index.ts
  function clientOf(source) {
    if (source.contacto) return source.contacto;
    if (!source.contacto_id) return null;
    return { id: source.contacto_id, nombre: orFallback(source.cliente, orFallback(source.nombre, "")), movil: orFallback(source.tel_cliente, orFallback(source.telefono, "")) };
  }
  function referenceOf(source, client) {
    if (source.medico && typeof source.medico === "object") return source.medico;
    if (source.cuenta_id) return { id: source.cuenta_id, nombre: typeof source.medico === "string" ? source.medico : "" };
    if (client?.cuenta_id) return { id: client.cuenta_id, nombre: orFallback(client.medico, term("medico", { capital: "C" })) };
    return null;
  }
  function draftOf(start2, previous) {
    const now = (/* @__PURE__ */ new Date()).toISOString(), source = { fecha: now, ...start2 };
    if (!source.fecha) source.fecha = now;
    const recording = permissions.hasOpportunities(), client = clientOf(source);
    const lines = (source.interes ?? []).map((line2) => ({ producto_id: line2.producto_id, unidades: line2.unidades }));
    const defaultOrigin = previous ? OUTGOING_CALL : catalog("origen_oportunidad")[0]?.valor ?? "";
    return {
      source,
      previous,
      recording,
      closed: Boolean(source.pedido_id),
      client,
      reference: referenceOf(source, client),
      lines: lines.length ? lines : [{ producto_id: opportunitiesLegacy.defaultProduct(), unidades: 1 }],
      origin: orFallback(source.origen, defaultOrigin),
      reason: orFallback(source.motivo, ""),
      result: orFallback(source.resultado, ""),
      noSale: Boolean(source.id && source.resultado && source.resultado !== ORDER_DONE)
    };
  }
  function onChip(group, handler) {
    const box = document.getElementById(group);
    if (box) box.onclick = (event) => {
      const target = event.target;
      handler(target);
    };
  }
  function bindChoices(draft) {
    onChip("nvori", (target) => {
      const chip = target.closest("[data-nvo]"), box = document.getElementById("nvori");
      if (chip && box) draft.origin = toggleChip(box, "data-nvo", draft.origin, chip.dataset.nvo ?? "");
    });
    onChip("nvmot", (target) => {
      const chip = target.closest("[data-nvm]"), box = document.getElementById("nvmot");
      if (chip && box) draft.reason = toggleChip(box, "data-nvm", draft.reason, chip.dataset.nvm ?? "");
    });
    onChip("nvnoz", (target) => {
      const days = target.closest("[data-nvd]"), box = document.getElementById("nvnoz");
      if (days && box) {
        const date = document.getElementById("nvpf");
        if (date) date.value = dateIn(Number(days.dataset.nvd));
        box.querySelectorAll("[data-nvd]").forEach((other) => {
          other.classList.toggle("on", other === days);
        });
        return;
      }
      const chip = target.closest("[data-nvr]"), results = document.getElementById("nvres");
      if (chip && results) draft.result = toggleChip(results, "data-nvr", draft.result, chip.dataset.nvr ?? "");
    });
    const noSale = document.getElementById("nvno2");
    if (noSale) noSale.onclick = () => {
      draft.noSale = !draft.noSale;
      noSale.classList.toggle("on", draft.noSale);
      document.getElementById("nvnoz")?.classList.toggle("hide", !draft.noSale);
    };
  }
  async function editOpportunity(start2, previous = null) {
    await opportunitiesLegacy.loadProducts();
    if (permissions.hasOpportunities()) await loadOpportunityCatalogs();
    const draft = draftOf(start2, previous);
    const body2 = document.getElementById("dbody"), box = document.getElementById("dlg");
    if (!body2 || !box) return;
    body2.innerHTML = editorHtml3(draft);
    box.showModal();
    paintClient(draft);
    if (draft.recording) {
      paintInterest(draft);
      paintReference(draft);
    }
    bindChoices(draft);
    bindOutcome(draft);
  }
  async function registerFollowUp(call) {
    const { data: previous } = await legacyDb().from("llamadas").select("interes").eq("id", call.id).maybeSingle();
    await editOpportunity({
      contacto_id: call.contacto_id ?? null,
      cliente: call.cliente ?? null,
      nombre: call.nombre ?? null,
      telefono: call.telefono ?? null,
      tel_cliente: call.tel_cliente ?? null,
      cuenta_id: call.cuenta_id ?? null,
      medico: call.medico ?? null,
      motivo: FOLLOW_UP_REASON,
      origen: OUTGOING_CALL,
      interes: previous?.interes ?? []
    }, call);
  }

  // src/app/screens/opportunities/charts.ts
  function indicatorsHtml(summary3) {
    const total = summary3.total ?? 0, orders = summary3.con_pedido ?? 0, closed = total - (summary3.sin_cerrar ?? 0);
    const kpi = (value10, key) => `<div class="kpi"><b>${value10}</b><span>${t(key)}</span></div>`;
    return [
      kpi(formatNumber(total), "opportunities.list.kpiOpportunities"),
      kpi(formatNumber(orders), "opportunities.list.kpiOrders"),
      kpi(closed ? `${Math.round(orders / closed * 100)}%` : "—", "opportunities.list.kpiConversion"),
      kpi(portalLegacy.euros(summary3.importe_ganado ?? 0), "opportunities.list.kpiSold"),
      kpi(portalLegacy.euros(summary3.importe_perdido ?? 0), "opportunities.list.kpiUnsold"),
      kpi(formatNumber(summary3.sin_cerrar ?? 0), "opportunities.list.kpiNotClosed")
    ].join("\n      ");
  }
  function ratioRow(item, max) {
    return `<div class="bh bhr"><span class="bhn">${escapeHtml(item.n)}</span><span class="bhb" title="${t("opportunities.list.endInOrder", { won: formatNumber(item.p), total: formatNumber(item.t) })}"><i style="width:${Math.max(3, item.t / max * 100)}%"><em style="width:${item.t ? Math.round(item.p / item.t * 100) : 0}%"></em></i></span><b>${formatNumber(item.p)}<span>/${formatNumber(item.t)}</span></b></div>`;
  }
  var ratioBars = (items) => {
    const max = Math.max(1, ...items.map((item) => item.t));
    return `<div class="barrash">${items.map((item) => ratioRow(item, max)).join("")}</div>`;
  };
  var card = (id, title2, body2, read) => `<div class="card ancard" id="${id}"><h2>${title2}</h2>${body2}<p class="leer">${read}</p></div>`;
  var ratiosOr = (list, toRatio, empty2) => (list ?? []).length ? ratioBars((list ?? []).map(toRatio)) : opportunitiesLegacy.emptyChart(empty2);
  var words4 = () => ({
    professional: term("medico"),
    professionals: term("medico", { number: "p" }),
    aProfessional: term("medico", { article: "un", articleCapital: "C" }),
    ofProfessional: term("medico", { article: "del" })
  });
  var HOW = "opportunities.list.howToRead";
  var FOR = "opportunities.list.whatFor";
  function chartsHtml(summary3) {
    const weekdays = t("opportunities.weekdays").split(","), read = (lead, key) => t(lead) + t(key, words4());
    const results = (summary3.por_resultado ?? []).length ? opportunitiesLegacy.barChart((summary3.por_resultado ?? []).map((item) => ({ n: item.resultado, v: item.n })), formatNumber) : opportunitiesLegacy.emptyChart(t("opportunities.list.resultsEmpty"));
    return card("llgprod", t("opportunities.list.productsTitle"), ratiosOr(summary3.por_producto, (item) => ({ n: item.producto, p: Number(item.unidades_ganadas) || 0, t: Number(item.unidades) || 0 }), t("opportunities.list.productsEmpty")), read(HOW, "opportunities.list.productsRead")) + card("llgres", t("opportunities.list.resultsTitle"), results, read(HOW, "opportunities.list.resultsRead")) + card("llghora", t("opportunities.list.hoursTitle"), ratiosOr(summary3.por_hora, (item) => ({ n: `${String(item.hora).padStart(2, "0")}:00`, p: item.pedidos, t: item.n }), t("opportunities.list.hoursEmpty")), read(FOR, "opportunities.list.hoursRead")) + card("llgdia", t("opportunities.list.daysTitle"), ratiosOr(summary3.por_dia, (item) => ({ n: weekdays[item.dia] ?? "", p: item.pedidos, t: item.n }), t("opportunities.list.daysEmpty")), read(HOW, "opportunities.list.daysRead")) + card("llgori", t("opportunities.list.originsTitle"), ratiosOr(summary3.por_origen, (item) => ({ n: item.origen, p: item.pedidos, t: item.n }), t("opportunities.list.originsEmpty")), read(HOW, "opportunities.list.originsRead")) + card("llgmed", t("opportunities.list.referencesTitle", words4()), ratiosOr(summary3.por_medico, (item) => ({ n: item.medico, p: item.pedidos, t: item.n }), t("opportunities.list.referencesEmpty", words4())), read(HOW, "opportunities.list.referencesRead")) + card("llcom", t("opportunities.list.salesTitle", words4()), ratiosOr(summary3.por_comercial, (item) => ({ n: item.comercial, p: item.pedidos, t: item.n }), t("opportunities.list.salesEmpty", words4())), read(HOW, "opportunities.list.salesRead"));
  }

  // src/app/screens/opportunities/follow-ups.ts
  var SHOWN3 = 20;
  function whenHtml(call, today) {
    if (call.proxima_fecha < today) return `<b style="color:var(--dang)">${t("opportunities.list.late")}</b>`;
    return call.proxima_fecha === today ? `<b style="color:var(--warn)">${t("opportunities.list.today")}</b>` : `${formatShortDate(call.proxima_fecha)} · `;
  }
  function iconStyle(call, today) {
    if (call.proxima_fecha < today) return "background:#FDECEC;color:var(--dang)";
    return call.proxima_fecha === today ? "background:#FFF4E5;color:var(--warn)" : "";
  }
  function rowHtml5(call, today) {
    const phone = orFallback(call.tel_cliente, orFallback(call.telefono, ""));
    const details2 = `${whenHtml(call, today)}${escapeHtml(orFallback(call.resultado, ""))}${call.proxima_accion ? ` · ${escapeHtml(call.proxima_accion)}` : ""}${call.medico ? t("opportunities.list.fromReference", { name: escapeHtml(call.medico) }) : ""}`;
    return `<div class="item" style="cursor:default">
        <span class="ic" style="${iconStyle(call, today)}">📞</span>
        <span class="tx"><b>${escapeHtml(orFallback(call.cliente, orFallback(call.nombre, t("opportunities.list.noName"))))}</b>
          <span class="sm">${details2}</span></span>
        <span class="acts" style="margin:0;flex-wrap:nowrap">${phone ? `<a class="btn sec chico" href="tel:${escapeHtml(phone)}">${t("opportunities.list.call")}</a>` : ""}
          <button class="btn chico" data-llseg="${call.id}">${t("opportunities.list.record")}</button><button class="btn sec chico" data-llok="${call.id}" title="${t("opportunities.list.notNeeded")}">✓</button></span></div>`;
  }
  async function paintFollowUps() {
    const { data } = await callRpc("llamadas_seguimiento", {});
    const list = data ?? [], today = todayIso(), box = document.getElementById("llsegz");
    if (!box) return;
    box.innerHTML = !list.length ? "" : `<div class="card" id="llsegs"><h2>${t("opportunities.list.callAgainTitle")}<span class="n">${list.length}</span></h2>
      <p class="sm" style="padding:0 16px">${t("opportunities.list.callAgainHint")}</p>
      <div class="lista">${list.slice(0, SHOWN3).map((call) => rowHtml5(call, today)).join("")}</div></div>`;
    box.querySelectorAll("[data-llseg]").forEach((button2) => {
      button2.onclick = () => {
        const call = list.find((item) => item.id === button2.dataset.llseg);
        if (call) void registerFollowUp(call);
      };
    });
    box.querySelectorAll("[data-llok]").forEach((button2) => {
      button2.onclick = async () => {
        await legacyDb().rpc("marcar_seguimiento", { p_id: button2.dataset.llok, p_hecho: true });
        notices.toast(t("opportunities.list.followUpClosed"));
        void paintFollowUps();
      };
    });
  }

  // src/app/screens/opportunities/list.ts
  var SEARCH_WAIT_MS3 = 300;
  function pageHtml2() {
    const results = catalog("resultado_llamada").map((entry) => `<option>${escapeHtml(entry.valor)}</option>`).join("");
    return `<div class="panel">
    <div id="llsegz"></div>
    <div class="filtros"><div id="llper"></div>
      <div><label for="llq">${t("opportunities.list.search")}</label><input id="llq" type="search" placeholder="${t("opportunities.list.searchPlaceholder", { professional: term("medico") })}"></div>
      <div><label for="llfres">${t("opportunities.list.result")}</label><select id="llfres"><option value="">${t("opportunities.list.all")}</option><option>${t("opportunities.list.notClosed")}</option>${results}</select></div></div>
    <div class="kpis vtot" id="lltot"></div>
    <div class="angrid" id="llres2" style="margin:0 0 14px"></div>
    <div id="lllista"></div></div>`;
  }
  var interestText = (item) => (item.interes ?? []).map((line2) => `${orFallback(line2.producto, "")} × ${formatNumber(line2.unidades)}`).join(", ");
  function endsHtml2(item) {
    const ends = item.pedido_id || item.resultado ? escapeHtml(orFallback(item.resultado, ORDER_DONE)) : `<span class="pill p-warn">${t("opportunities.list.notClosed")}</span>`;
    return `${ends}${item.pedido ? `<span class="sm">${t("opportunities.list.order", { number: escapeHtml(item.pedido) })}</span>` : ""}`;
  }
  function rowHtml6(item) {
    const when = new Date(item.fecha).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
    const reference2 = typeof item.medico === "string" ? item.medico : "";
    return `<button class="dr" data-ll="${item.id}"><span>${when}<span class="sm">${escapeHtml(orFallback(item.origen, orFallback(item.direccion, "")))}</span></span>
        <span><b>${escapeHtml(orFallback(item.cliente, orFallback(item.nombre, "—")))}</b><span class="sm">${escapeHtml(orFallback(item.tel_cliente, orFallback(item.telefono, "")))}</span></span>
        <span class="corta">${escapeHtml(interestText(item) || "—")}${item.importe_estimado ? `<span class="sm">${portalLegacy.euros(item.importe_estimado)}</span>` : ""}</span>
        <span class="corta">${escapeHtml(orFallback(reference2, orFallback(item.cuenta_texto, "—")))}</span>
        <span>${endsHtml2(item)}</span>
        <span class="sm">${item.proxima_fecha ? `${formatShortDate(item.proxima_fecha)} · ` : ""}${escapeHtml(orFallback(item.proxima_accion, ""))}</span><span class="sm">${escapeHtml(orFallback(item.usuario, ""))}</span></button>`;
  }
  function tableHtml3(shown4) {
    const heads = [t("opportunities.list.date"), t("opportunities.list.client"), t("opportunities.list.wants"), term("medico", { capital: "C" }), t("opportunities.list.ends"), t("opportunities.list.next"), t("opportunities.list.attended")];
    return `<div class="dgrid-wrap"><div class="dgrid llam opor">
      <div class="dh">${heads.map((head) => `<span>${head}</span>`).join("")}</div>
      ${shown4.map(rowHtml6).join("")}</div></div>`;
  }
  function paintList2(list, rows) {
    const size = accountListLegacy.pageSize();
    opportunitiesLegacy.setPage(Math.min(opportunitiesLegacy.page(), Math.max(0, Math.ceil(rows.length / size) - 1)));
    const start2 = opportunitiesLegacy.page() * size;
    list.innerHTML = rows.length ? tableHtml3(rows.slice(start2, start2 + size)) : `<div class="vacio">${t("opportunities.list.empty")}</div>`;
    list.querySelectorAll("[data-ll]").forEach((button2) => {
      button2.onclick = () => {
        void editOpportunity(rows.find((item) => item.id === button2.dataset.ll) ?? null);
      };
    });
    list.insertAdjacentHTML("beforeend", '<div id="llpag"></div>');
    accountListLegacy.paginate({
      element: document.getElementById("llpag"),
      total: rows.length,
      page: opportunitiesLegacy.page(),
      onPage: (page) => {
        opportunitiesLegacy.setPage(page);
        void paintPeriod();
      },
      onSize: () => {
        opportunitiesLegacy.setPage(0);
        void paintPeriod();
      }
    });
  }
  var fieldValue2 = (id) => document.getElementById(id)?.value ?? "";
  async function paintPeriod() {
    const period = opportunitiesLegacy.periodOf(document.getElementById("llper"));
    const [{ data: rows }, { data: summary3 }] = await Promise.all([
      legacyDb().rpc("llamadas_lista", { p_desde: period.desde, p_hasta: period.hasta, q: fieldValue2("llq").trim() || null, p_resultado: fieldValue2("llfres") || null }),
      legacyDb().rpc("llamadas_resumen", { p_desde: period.desde, p_hasta: period.hasta })
    ]);
    const list = document.getElementById("lllista"), totals = document.getElementById("lltot"), charts = document.getElementById("llres2");
    if (!list || !totals || !charts) return;
    totals.innerHTML = indicatorsHtml(summary3 ?? {});
    charts.innerHTML = chartsHtml(summary3 ?? {});
    paintList2(list, rows ?? []);
  }
  var searchTimer3;
  async function paintOpportunities() {
    await loadOpportunityCatalogs();
    const box = document.getElementById("vcuerpo");
    if (!box) return;
    box.innerHTML = pageHtml2();
    const search3 = document.getElementById("llq"), result = document.getElementById("llfres");
    opportunitiesLegacy.mountPeriod(document.getElementById("llper"), { id: "llamadas", valor: "mes", alCambiar: () => {
      void paintPeriod();
    } });
    if (search3) search3.oninput = () => {
      clearTimeout(searchTimer3);
      searchTimer3 = setTimeout(() => {
        void paintPeriod();
      }, SEARCH_WAIT_MS3);
    };
    if (result) result.onchange = () => {
      void paintPeriod();
    };
    void paintFollowUps();
    void paintPeriod();
  }

  // src/app/screens/quality/index.ts
  var quality_exports = {};
  __export(quality_exports, {
    loadQuality: () => loadQuality,
    paintAccountsHeader: () => paintAccountsHeader
  });

  // src/app/screens/quality/accounts-header.ts
  function paintAccountsHeader() {
    const view = document.getElementById("v-directorio");
    if (view && !document.getElementById("dircab")) {
      const button2 = qualityLegacy.canUseModule("seguimiento") ? `<button class="btn sec" id="dircalidad">${icon("shield-check")} ${t("quality.accountsHeader.dataQuality")}</button>` : "";
      view.insertAdjacentHTML("afterbegin", `<div class="saludo" id="dircab"><div><h1>${term("medico", { number: "p", capital: "C" })}</h1><div class="fecha">${t("quality.accountsHeader.subtitle", { Professionals: term("medico", { number: "p", capital: "C" }) })}</div></div>
    <div class="acts">${button2}</div></div>`);
      const quality2 = document.getElementById("dircalidad");
      if (quality2) quality2.onclick = () => {
        goTo("seguimiento");
      };
    }
    qualityLegacy.arrangeAccountsHeader();
  }

  // src/app/screens/quality/data-quality.ts
  var percentOf2 = (done, total) => total ? Math.round(done / total * 100) : 0;
  var words5 = () => ({
    professional: term("medico"),
    professionals: term("medico", { number: "p" }),
    Professionals: term("medico", { number: "p", capital: "C" }),
    speciality: term("especialidad"),
    anyPlace: term("consulta", { article: "ningun" }),
    ofVisit: term("visita", { article: "del" })
  });
  function indicator(count2, title2, help) {
    return `<div class="kpi ${count2 ? "warn" : "ok"}"><button class="ai" data-ayuda-txt="${escapeHtml(help)}" data-ayuda-tit="${escapeHtml(title2)}" aria-label="${t("quality.summary.whatIs")}">i</button><b>${formatNumber(count2)}</b><span>${escapeHtml(title2)}</span></div>`;
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
  function summaryHtml(quality2) {
    const percent2 = percentOf2(quality2.completas, quality2.total);
    return `<div class="card" id="calidad" style="padding-bottom:6px">
    <div class="manh" style="padding:14px 16px 0"><h2 style="padding:0">${t("quality.summary.complete", { percent: percent2 })}</h2><span class="sm">${t("quality.summary.completeOf", { ...words5(), done: formatNumber(quality2.completas), total: formatNumber(quality2.total) })}</span></div>
    <div class="barra" style="margin:8px 16px 10px"><i style="width:${percent2}%"></i></div>
    <div class="kpis" style="padding:0 16px 10px">
      ${INDICATORS.map(([key, title2, help]) => indicator(quality2[key], t(title2, words5()), t(help, words5()))).join("")}
    </div>
    <p class="sm" style="padding:0 16px 10px">${t("quality.summary.completeHint", words5())}</p></div>`;
  }
  async function paintSummary() {
    const { data: quality2 } = await callRpc("calidad_datos", {});
    if (!quality2 || document.getElementById("calidad")) return;
    document.querySelector("#v-seguimiento .saludo")?.insertAdjacentHTML("afterend", summaryHtml(quality2));
  }
  function placeRow2(place) {
    const address = [place.centro_nombre, place.direccion, [place.cp, place.municipio].filter(Boolean).join(" ")].filter(Boolean).join(" · ");
    const distance = place.km !== null && place.km !== void 0 ? t("quality.addresses.farFrom", { km: formatNumber(place.km), municipality: escapeHtml(orFallback(place.municipio, "")) }) : t("quality.addresses.outOfSpain");
    return `<div class="item cdir" data-cdir="${place.id}" style="cursor:default">
      <span class="tx"><b>${escapeHtml(place.nombre)}</b>
        <span class="sm">${escapeHtml(address || t("quality.addresses.noAddress"))}</span>
        <span class="sm cdirkm">${distance}</span></span>
      <span class="acts" style="margin:0">
        <button type="button" class="btn sec" data-cdirf="${place.cuenta_id}">${t("quality.addresses.card")}</button>
        ${place.direccion || place.municipio ? `<button type="button" class="btn" data-cdirg="${place.id}">${t("quality.addresses.relocate")}</button>` : ""}</span></div>`;
  }
  var addressesHtml = (places) => `<div class="card" id="caldirs">
    <div class="fh"><div><h2>${t("quality.addresses.title", { count: formatNumber(places.length) })}</h2>
      <div class="sm">${t("quality.addresses.hint", { thesePlaces: term("consulta", { number: "p", article: "este" }) })}</div></div></div>
    <div class="lista">${places.map(placeRow2).join("")}</div></div>`;
  function removeRow(box, id) {
    box.querySelector(`[data-cdir="${id}"]`)?.remove();
    const title2 = box.querySelector("h2"), left = box.querySelectorAll(".cdir").length;
    if (!left) box.remove();
    else if (title2) title2.textContent = t("quality.addresses.title", { count: formatNumber(left) });
  }
  async function relocate(box, place, button2) {
    const text2 = button2.textContent;
    button2.disabled = true;
    button2.textContent = t("quality.addresses.searching");
    const query = [place.direccion, place.cp, place.municipio, place.provincia, "España"].filter(Boolean).join(", ");
    const found = await qualityLegacy.geocode(query, { direccion: place.direccion, municipio: place.municipio, cp: place.cp });
    button2.disabled = false;
    button2.textContent = text2;
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
    const card2 = document.getElementById("calidad");
    if (error || !card2 || document.getElementById("caldirs")) return;
    const places = data ?? [];
    if (!places.length) return;
    card2.insertAdjacentHTML("afterend", addressesHtml(places));
    const box = document.getElementById("caldirs");
    if (!box) return;
    box.querySelectorAll("[data-cdirf]").forEach((button2) => {
      button2.onclick = () => {
        agendaActions.openAccount(button2.dataset.cdirf ?? "");
      };
    });
    box.querySelectorAll("[data-cdirg]").forEach((button2) => {
      button2.onclick = () => {
        const place = places.find((item) => item.id === button2.dataset.cdirg);
        if (place) void relocate(box, place, button2);
      };
    });
  }

  // src/app/screens/quality/follow-up.ts
  var POSTPONE_DAYS = 7;
  var followUpState = { estado: "", prov: "", muni: "", modo: "todos", pagina: 0 };
  var filterParams2 = () => ({
    f_estado: followUpState.estado || null,
    f_provincia: followUpState.prov || null,
    f_municipio: followUpState.muni || null,
    f_modo: followUpState.modo
  });
  var loadingHtml2 = (text2) => `<div class="cargador"><span class="spin"></span><span class="sm">${escapeHtml(text2)}</span></div>`;
  function nameHtml(row4) {
    const urgent = row4.urgente ? `<span class="pill p-urg">${t("quality.followUp.urgent")}</span> ` : "";
    const reporting = row4.sin_reporting ? `<span class="pill p-sr" title="${t("quality.followUp.noReportingHelp", { visit: term("visita") })}">${t("quality.followUp.noReporting")}</span> ` : "";
    return `<span class="nm">${urgent}${reporting}${escapeHtml(row4.nombre)}</span>`;
  }
  function nextActionHtml(row4) {
    if (!row4.proxima_fecha) return "";
    return `<b style="color:${row4.proxima_fecha < todayIso() ? "var(--warn)" : "var(--navy)"}">${formatShortDate(row4.proxima_fecha)}</b><br>${escapeHtml(orFallback(row4.proxima_accion, ""))}
           <br><span class="acts" style="margin:4px 0 0"><button class="btn sec chico" data-acc="hecha|${row4.id}">${t("quality.followUp.done")}</button>
           <button class="btn sec chico" data-acc="aplazar|${row4.id}">${t("quality.followUp.postpone")}</button></span>`;
  }
  function rowHtml7(row4) {
    const last = row4.ultima_visita ? t("quality.followUp.last", { date: formatShortDate(row4.ultima_visita), result: escapeHtml(orFallback(row4.ultimo_resultado, "")) }) : t("quality.followUp.notVisited");
    return `
    <button class="fila" data-id="${row4.id}">
      <span>${nameHtml(row4)}
        <span class="sm">${escapeHtml(orFallback(row4.especialidad, ""))} · ${escapeHtml(orFallback(row4.centro_nombre, ""))} ${escapeHtml(orFallback(row4.municipio, ""))}</span></span>
      <span class="c2"><span class="sm">${last}</span>
        <span class="sm">${row4.n_visitas} ${term("visita", { number: "p" })}${row4.muestras ? t("quality.followUp.samples", { count: row4.muestras }) : ""}</span></span>
      <span class="c3"><span class="sm">${nextActionHtml(row4)}</span></span>
      <span class="pill p-est">${escapeHtml(row4.estado_comercial)}</span>
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
  function bind9(list) {
    list.onclick = (event) => {
      const target = event.target, action = target.closest("[data-acc]");
      if (action) {
        event.stopPropagation();
        void resolveAction(action.dataset.acc ?? "");
        return;
      }
      const row4 = target.closest("[data-id]");
      if (row4) agendaActions.openAccount(row4.dataset.id ?? "");
    };
  }
  function paintRows2(list, rows) {
    if (!rows.length) {
      list.innerHTML = `<div class="vacio">${t("quality.followUp.nothing")}</div>`;
      return;
    }
    list.innerHTML = "";
    list.insertAdjacentHTML("beforeend", rows.map(rowHtml7).join(""));
  }
  async function paintFollowUp(restart) {
    const list = document.getElementById("slista"), count2 = document.getElementById("scuenta");
    if (!list || !count2) return;
    if (restart) followUpState.pagina = 0;
    list.innerHTML = loadingHtml2(t("quality.page.loadingFollowUp"));
    count2.textContent = t("quality.followUp.searching");
    const size = accountListLegacy.pageSize();
    const { data, error } = await legacyDb().rpc("seguimiento_lista", { ...filterParams2(), lim: size, desplaz: followUpState.pagina * size });
    if (error || !data) {
      count2.textContent = t("quality.followUp.couldNotLoad", { error: error?.message ?? "" });
      return;
    }
    count2.innerHTML = `<b>${formatNumber(data.total)}</b> ${term("medico", { number: "p" })}`;
    paintRows2(list, data.filas ?? []);
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
    bind9(list);
  }

  // src/app/screens/quality/page.ts
  var MODES2 = [["todos", "quality.page.showAll"], ["visitados", "quality.page.showVisited"], ["sin_visitar", "quality.page.showNotVisited"], ["con_accion", "quality.page.showWithAction"], ["atrasados", "quality.page.showLate"]];
  var canSeeDuplicates = () => cardSectionsLegacy.can("administrar") || permissions.canReviewDuplicates();
  function headerHtml6() {
    const duplicates = canSeeDuplicates() ? `<button class="btn sec" id="caldup">${icon("copy")} ${t("quality.page.duplicates")}</button>` : "";
    return `<button class="cfgvolver visible" id="calvolver" type="button">‹ ${escapeHtml(accountListLegacy.contactsLabel())}</button>
    <div class="saludo"><div><h1>${t("quality.page.title")}</h1><div class="fecha">${t("quality.page.subtitle", { professional: term("medico") })}</div></div>
      <div class="acts" style="margin:0">${duplicates}</div></div>`;
  }
  function pageHtml3() {
    const modes = MODES2.map(([value10, key]) => `<option value="${value10}">${t(key)}</option>`).join("");
    return `${headerHtml6()}
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
    const fill2 = (id, list, all) => {
      const select2 = document.getElementById(id);
      if (select2) select2.innerHTML = `<option value="">${all}</option>${(list ?? []).map((option4) => `<option>${escapeHtml(option4.v)}</option>`).join("")}`;
    };
    fill2("sest", options?.estados, t("quality.page.allStates"));
    fill2("sprov", options?.provincias, t("quality.page.allProvinces"));
    fill2("smuni", options?.municipios, t("quality.page.allMunicipalities"));
    for (const id of ["sest", "sprov", "smuni", "smodo"]) {
      const select2 = document.getElementById(id);
      if (select2) select2.onchange = () => {
        Object.assign(followUpState, { estado: selectValue("sest"), prov: selectValue("sprov"), muni: selectValue("smuni"), modo: selectValue("smodo"), pagina: 0 });
        void paintFollowUp(true);
      };
    }
  }
  var percentText = (part, total) => `${total ? Math.round(part / total * 100) : 0}%`;
  function paintIndicators3(summary3) {
    const box = document.getElementById("segkpis");
    if (!summary3 || !box) return;
    const funnel2 = (summary3.embudo ?? []).map((step) => `<div class="kpi"><b>${formatNumber(step.n)}</b><span>${escapeHtml(step.estado)}</span></div>`).join("");
    box.innerHTML = `${funnel2}<div class="kpi ok"><b>${formatNumber(summary3.visitados)}</b><span>${term("medico", { number: "p", adjective: "visitado" })}</span></div>
       <div class="kpi"><b>${formatNumber(summary3.visitas_total)}</b><span>${term("visita", { number: "p", adjective: "registrado" })}</span></div>
       <div class="kpi"><b>${formatNumber(summary3.muestras_total)}</b><span>${t("quality.page.samplesGiven")}</span></div>
       <div class="kpi"><b>${percentText(summary3.con_direccion, summary3.total)}</b><span>${t("quality.page.withAddress")}</span></div>
       <div class="kpi"><b>${percentText(summary3.con_dias, summary3.total)}</b><span>${t("quality.page.withDays")}</span></div>`;
  }
  function bindHeader3() {
    const back = document.getElementById("calvolver");
    if (back) back.onclick = () => {
      goTo("directorio");
    };
    const duplicates = document.getElementById("caldup");
    if (duplicates) duplicates.onclick = () => {
      goTo("duplicados");
    };
    document.querySelectorAll("nav.main [data-t]").forEach((button2) => {
      button2.setAttribute("aria-selected", String(button2.dataset.t === "directorio"));
    });
    qualityLegacy.setExport(async (format) => {
      const { data } = await legacyDb().rpc("exportar_seguimiento", filterParams2());
      qualityLegacy.download(data ?? [], "Exportacion_seguimiento", format);
    });
  }
  async function loadQuality() {
    const view = document.getElementById("v-seguimiento");
    if (!view) return;
    Object.assign(followUpState, { estado: "", prov: "", muni: "", modo: "todos", pagina: 0 });
    view.innerHTML = pageHtml3();
    bindHeader3();
    const { data: options } = await legacyDb().rpc("opciones_filtros", {});
    fillFilters(options);
    const { data: summary3 } = await legacyDb().rpc("resumen_seguimiento");
    paintIndicators3(summary3);
    void paintFollowUp(true);
    await paintSummary();
    try {
      await paintDoubtfulAddresses();
    } catch {
    }
  }

  // src/app/screens/manual/index.ts
  var manual_exports = {};
  __export(manual_exports, {
    goBack: () => goBack,
    openManual: () => openManual,
    paintManual: () => paintManual,
    putHelpButton: () => putHelpButton
  });

  // src/app/screens/manual/model.ts
  var FULL = 3;
  var HELP_KEY = /* @__PURE__ */ new Map([["visitas", "agenda"], ["centros", "directorio"]]);
  var PLAN_MODULES = /* @__PURE__ */ new Set(["agenda", "rutas", "directorio", "ventas", "facturacion", "analitica", "productos", "pacientes", "seguimiento"]);
  function firstSteps() {
    const steps3 = manualLegacy.firstSteps(), kind = ["cartera", "televenta"].find((capability) => manualLegacy.can(capability));
    return (kind ? steps3[kind] : void 0) ?? steps3.default ?? [];
  }
  function cardLevel(section2) {
    if (section2.a) return permissions.levelOf(section2.a);
    if (manualLegacy.can("administrar")) return FULL;
    return section2.id === "roles" || section2.id === "permisos" ? 1 : 0;
  }
  function sheetLevel(section2) {
    if (section2.a) return permissions.levelOf(section2.a);
    return manualLegacy.can("administrar") ? FULL : 1;
  }
  function accessText(section2) {
    if (section2.a) return manualLegacy.levelText(permissions.levelOf(section2.a));
    return manualLegacy.can("administrar") ? t("manual.portal.full") : "—";
  }
  var helpLines = (id, byScreen = true) => manualLegacy.help(byScreen ? HELP_KEY.get(id) ?? id : id)?.[2] ?? [];
  var sectionIcon = (id) => manualLegacy.icon(id) ?? "📘";
  var findSection = (id) => manualLegacy.sections().find((section2) => section2.id === id);

  // src/app/screens/manual/portal-info.ts
  var SETTINGS_FOR_EVERYONE = ["horario", "kpis", "prefs"];
  function openDialog(html) {
    const body2 = document.getElementById("dbody"), box = document.getElementById("dlg");
    if (!body2 || !box) return;
    body2.innerHTML = html;
    box.showModal();
  }
  function closeAndGo(buttonId, screen2, section2) {
    const button2 = document.getElementById(buttonId);
    if (button2) button2.onclick = () => {
      document.getElementById("dlg")?.close();
      manualLegacy.go(screen2, section2);
    };
  }
  var close3 = `<button class="x" data-cerrar aria-label="${t("common.close")}">✕</button>`;
  function showFirstStep(step) {
    const [stepIcon, title2, text2, screen2] = step, about = findSection(screen2)?.para;
    openDialog(`<div class="fh"><div><h2>${stepIcon} ${escapeHtml(title2)}</h2><div class="sm">${t("manual.portal.firstSteps")}</div></div>${close3}</div>
      <p>${escapeHtml(text2)}</p>${about ? `<p class="sm">${escapeHtml(about)}</p>` : ""}
      <div class="acts" style="justify-content:flex-end"><button class="btn sec" data-cerrar>${t("manual.portal.notNow")}</button>
        ${screen2 === "config" || manualLegacy.canOpenModule(screen2) ? `<button class="btn" id="mangoir">${t("manual.portal.takeMe")}</button>` : ""}</div>`);
    closeAndGo("mangoir", screen2, screen2 === "config" ? "prefs" : void 0);
  }
  function listsHtml(section2) {
    const level = sheetLevel(section2), lines = helpLines(section2.id), places = section2.config ?? [];
    const can = section2.hacer.map(([required, text2]) => `<li class="${level >= required ? "si" : "no"}"><span>${level >= required ? "✓" : "🔒"}</span><span>${escapeHtml(text2)}</span></li>`).join("");
    return `<h3 class="mansub">${t("manual.portal.whatYouCanDo")}</h3><ul class="manlist">${can}</ul>
    ${lines.length ? `<h3 class="mansub">${t("manual.portal.howItWorks")}</h3><ul class="manlist">${lines.map((line2) => `<li><span>•</span><span>${line2}</span></li>`).join("")}</ul>` : ""}
    ${places.length ? `<h3 class="mansub">${t("manual.portal.whereConfigured")}</h3><div class="mancfg">${places.map((place) => `<span>⚙ ${escapeHtml(place)}</span>`).join("")}</div>` : ""}`;
  }
  var canGoToSettings = (settings) => settings !== void 0 && settings !== "" && (manualLegacy.can("administrar") || SETTINGS_FOR_EVERYONE.includes(settings));
  var canOpenScreen = (destination2) => destination2 !== null && destination2 !== "manual" && (destination2 === "config" || manualLegacy.canOpenModule(destination2));
  function showSection(id) {
    const section2 = findSection(id);
    if (!section2) return;
    const destination2 = manualLegacy.isModule(id) || ["manual", "config"].includes(id) ? id : null, settings = manualLegacy.settingsOf(id);
    const canSettings = canGoToSettings(settings), canOpen = canOpenScreen(destination2);
    openDialog(`<div class="fh"><div><h2>${sectionIcon(id)} ${escapeHtml(section2.t)}</h2><div class="sm">${escapeHtml(section2.para)}</div></div>${close3}</div>
    ${listsHtml(section2)}
    <div class="acts" style="justify-content:flex-end;flex-wrap:wrap;margin-top:14px"><button class="btn sec" data-cerrar>${t("common.close")}</button>
      ${canSettings ? `<button class="btn sec" id="manircfg">${t("manual.portal.goToSettings")}</button>` : ""}
      ${canOpen ? `<button class="btn" id="manirmod">${t("manual.portal.open", { name: escapeHtml(section2.t) })}</button>` : ""}</div>`);
    if (destination2) closeAndGo("manirmod", destination2);
    if (settings) closeAndGo("manircfg", "config", settings);
  }

  // src/app/screens/manual/portal-search.ts
  var MIN_QUERY = 2;
  var MAX_HITS = 12;
  var stripTags = (text2) => text2.replace(/<[^>]+>/g, "");
  var normalise = (text2) => stripTags(text2).toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  var escapeRegExp = (text2) => text2.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  function searchIndex() {
    const entries = [];
    for (const section2 of manualLegacy.sections()) {
      const add2 = (text2) => {
        entries.push({ section: section2.id, module: section2.t, text: text2 });
      };
      add2(section2.para);
      section2.hacer.forEach(([, text2]) => {
        add2(text2);
      });
      (section2.config ?? []).forEach((place) => {
        add2(t("manual.portal.configuredIn", { place }));
      });
      helpLines(section2.id, false).forEach((line2) => {
        add2(stripTags(line2));
      });
    }
    manualLegacy.faq().forEach(([question, answer]) => {
      entries.push({ section: null, module: t("manual.portal.faqHit"), text: `${question} — ${answer}` });
    });
    return entries;
  }
  function hitHtml(entry, words6) {
    let text2 = escapeHtml(stripTags(entry.text));
    words6.forEach((word) => {
      text2 = text2.replace(new RegExp(`(${escapeRegExp(word)})`, "ig"), "<mark>$1</mark>");
    });
    return `<button class="manhit" ${entry.section ? `data-mansec2="${entry.section}"` : ""}><span class="mhm">${escapeHtml(entry.module)}</span><span>${text2}</span></button>`;
  }
  function search2(input3, results, entries) {
    const query = normalise(input3.value.trim());
    document.querySelectorAll(".mancard").forEach((card2) => {
      card2.classList.remove("hide");
    });
    if (query.length < MIN_QUERY) {
      results.classList.add("hide");
      return;
    }
    const words6 = query.split(/\s+/);
    const hits = entries.filter((entry) => words6.every((word) => normalise(`${entry.text} ${entry.module}`).includes(word))).slice(0, MAX_HITS);
    results.classList.remove("hide");
    results.innerHTML = hits.length ? hits.map((entry) => hitHtml(entry, words6)).join("") : `<div class="manhit">${t("manual.portal.noResults", { query: escapeHtml(input3.value) })}</div>`;
  }
  function listenToSearch() {
    const input3 = document.getElementById("manq");
    if (!input3) return;
    input3.insertAdjacentHTML("afterend", '<div class="manres hide" id="manres"></div>');
    const results = document.getElementById("manres"), entries = searchIndex();
    if (!results) return;
    input3.oninput = () => {
      search2(input3, results, entries);
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
  function cardHtml4(section2) {
    const level = cardLevel(section2), pill = level >= 2 ? "p-est" : level === 1 ? "p-per" : "p-anu";
    return `<button class="mancard ${level ? "" : "bloq"}" data-mansec="${section2.id}"><span class="mci">${sectionIcon(section2.id)}</span>
        <b>${escapeHtml(section2.t)}</b><span class="mcd">${escapeHtml(section2.para)}</span><span class="pill ${pill}">${level ? t("manual.portal.yourAccess", { level: accessText(section2) }) : t("manual.portal.noAccess")}</span></button>`;
  }
  function pageHtml4() {
    const steps3 = firstSteps().map(([stepIcon, title2, text2, screen2], index) => `<button class="manpaso" data-mira="${screen2}"><span class="mpn">${index + 1}</span><span class="mpi">${stepIcon}</span><b>${escapeHtml(title2)}</b><span>${escapeHtml(text2)}</span></button>`).join("");
    return `${heroHtml()}
    <h2 class="mantit">${t("manual.portal.firstSteps")}</h2>
    <div class="manpasos">${steps3}</div>
    <h2 class="mantit">${t("manual.portal.byModule")}</h2>
    <div class="mangrid">${manualLegacy.sections().map(cardHtml4).join("")}</div>
    <h2 class="mantit">${t("manual.portal.faq")}</h2>
    <div class="card manfaqs">${manualLegacy.faq().map(([question, answer]) => `<details class="manfaq"><summary>${escapeHtml(question)}</summary><p>${escapeHtml(answer)}</p></details>`).join("")}</div>`;
  }
  function markOutOfPlan(page) {
    page.querySelectorAll(".mancard").forEach((card2) => {
      const module = card2.dataset.mansec ?? "";
      if (!PLAN_MODULES.has(module) || manualLegacy.planIncludes(module)) return;
      const pill = card2.querySelector(".pill");
      if (pill) {
        pill.className = "pill p-plan";
        pill.innerHTML = `${icon("lock")} ${t("manual.portal.inPlan", { plan: escapeHtml(manualLegacy.cheapestPlan(module) ?? t("manual.portal.premium")) })}`;
      }
      card2.classList.add("bloq");
      card2.onclick = () => {
        manualLegacy.showPlanNotice(module);
      };
    });
  }
  function bind10(page) {
    page.onclick = (event) => {
      const step = event.target?.closest("[data-mira]");
      if (!step) return;
      const card2 = step.closest(".manpaso"), index = card2 ? [...page.querySelectorAll(".manpaso")].indexOf(card2) : -1, chosen2 = firstSteps()[index];
      if (index >= 0 && chosen2) showFirstStep(chosen2);
    };
    page.querySelectorAll(".mancard").forEach((card2) => {
      card2.onclick = () => {
        showSection(card2.dataset.mansec ?? "");
      };
    });
  }
  function paintPortalManual() {
    const page = document.getElementById("v-manual");
    if (!page) return;
    page.innerHTML = pageHtml4();
    bind10(page);
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
      const screen2 = document.getElementById(`v-${back.tab}`) ?? document.querySelector("main > section:not(.hide)");
      const ready = !document.querySelector("main > section.preparando") && !screen2?.classList.contains("cargando");
      if (ready && document.documentElement.scrollHeight - innerHeight >= back.y - 2) break;
    }
    window.scrollTo(0, back.y);
  }
  function addBackButton() {
    const header = document.querySelector("#v-manual .saludo"), back = manualLegacy.back();
    if (!header || !back || document.getElementById("manvolver")) return;
    header.insertAdjacentHTML("afterbegin", `<button type="button" class="manvuelta" id="manvolver"><b aria-hidden="true">‹</b> ${t("manual.book.backTo", { name: escapeHtml(manualLegacy.screenName(back.tab)) })}</button>`);
    const button2 = document.getElementById("manvolver");
    if (button2) button2.onclick = () => {
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

  // src/app/screens/manual/help.ts
  var isWithoutHelp = (screen2) => screen2 === "manual" || screen2 === "delcos" || screen2.startsWith("pd-");
  function putHelpButton() {
    document.querySelectorAll(".manq").forEach((button2) => {
      button2.remove();
    });
    const screen2 = currentScreen();
    if (permissions.isProfessionalPortal() || isWithoutHelp(screen2)) return;
    const title2 = document.getElementById(`v-${screen2}`)?.querySelector(".saludo h1");
    if (!title2) return;
    if ((title2.closest(".saludo") ?? title2).querySelector(".ai")) return;
    const label = t("manual.help");
    if (manualLegacy.help(screen2)) {
      manualLegacy.attachHelp(title2, `<button class="ai" data-ayuda="${screen2}" aria-label="${label}">i</button>`);
      return;
    }
    const page = manualLegacy.pageInfo(screen2);
    manualLegacy.attachHelp(title2, `<button class="ai" data-ayuda-tit="${escapeHtml(orFallback(page.t, (title2.textContent ?? "").trim()))}" data-ayuda-txt="${escapeHtml(orFallback(page.d, ""))}" aria-label="${label}">i</button>`);
  }

  // src/app/screens/import/index.ts
  var import_exports = {};
  __export(import_exports, {
    normaliseHeader: () => normaliseHeader,
    paintImport: () => paintImport,
    paintImports: () => paintImports
  });

  // src/app/screens/import/fields.ts
  var fieldWords = () => ({
    Patients: term("paciente", { number: "p", capital: "C" }),
    Professionals: term("medico", { number: "p", capital: "C" }),
    Professional: term("medico", { capital: "C" }),
    Speciality: term("especialidad", { capital: "C" }),
    ofConsultation: term("consulta", { article: "del" })
  });
  var entityTypes = () => [
    { key: "clientes", name: t("importing.types.clientes"), hint: t("importing.types.clientesHint", fieldWords()), icon: "users" },
    { key: "productos", name: t("importing.types.productos"), hint: t("importing.types.productosHint"), icon: "package" },
    { key: "prescriptores", name: accountListLegacy.contactsLabel(), hint: t("importing.types.prescriptoresHint", fieldWords()), icon: "stethoscope" },
    { key: "ventas", name: t("importing.types.ventas"), hint: t("importing.types.ventasHint"), icon: "shopping-cart" }
  ];
  var entityName = (entity) => entityTypes().find((type) => type.key === entity)?.name ?? entity;
  var fieldLabel = (entity, key) => t(`importing.fields.${entity}.${key}`, fieldWords());
  var CUSTOMER_FIELDS = [
    ["nombre", true, ["nombre", "cliente", "razon social", "name", "nombre completo", "denominacion", "nombre cliente"]],
    ["nif", false, ["nif", "cif", "dni", "nie", "vat", "tax id", "nif cif", "identificacion fiscal", "documento"]],
    ["email", false, ["email", "correo", "e mail", "mail", "correo electronico"]],
    ["telefono", false, ["telefono", "tel", "phone", "telefono fijo", "tlf", "tfno", "telf", "tlfno", "tfn"]],
    ["movil", false, ["movil", "mobile", "celular", "telefono movil", "mvl"]],
    ["direccion", false, ["direccion", "domicilio", "address", "calle"]],
    ["cp", false, ["codigo postal", "cp", "postal", "zip", "c p"]],
    ["municipio", false, ["poblacion", "municipio", "ciudad", "localidad", "city"]],
    ["provincia", false, ["provincia", "state", "region"]],
    ["pais", false, ["pais", "country"]],
    ["empresa", false, ["empresa", "company", "compania"]],
    ["tipo", false, ["tipo", "tipo cliente", "tipo de cliente"]],
    ["medico", false, ["medico", "prescriptor", "doctor", "recomendado por"]],
    ["nota", false, ["notas", "nota", "observaciones", "comentarios"]]
  ];
  var PRODUCT_FIELDS = [
    ["nombre", true, ["nombre", "producto", "articulo", "name", "descripcion corta"]],
    ["referencia", false, ["referencia", "ref", "sku", "codigo", "codigo interno", "cod"]],
    ["codigo_barras", false, ["ean", "codigo de barras", "barcode", "gtin", "ean13"]],
    ["precio", false, ["precio", "pvp", "price", "precio venta", "subtotal", "precio sin iva"]],
    ["iva", false, ["iva", "impuesto", "impuestos", "tax", "tipo iva", "iva"]],
    ["coste", false, ["coste", "costo", "cost", "precio compra", "precio de compra"]],
    ["presentacion", false, ["presentacion", "formato", "descripcion"]],
    ["unidades_envase", false, ["unidades por envase", "uds envase", "pack", "unidades envase"]],
    ["stock_minimo", false, ["stock minimo", "minimo"]],
    ["tipo", false, ["tipo"]]
  ];
  var PROFESSIONAL_FIELDS = [
    ["nombre", true, ["nombre", "medico", "doctor", "prescriptor", "nombre completo", "name"]],
    ["especialidad", false, ["especialidad", "specialty", "especialitat", "segmento", "categoria"]],
    ["area", false, ["area", "zona"]],
    ["cargo", false, ["cargo", "puesto"]],
    ["telefono", false, ["telefono", "tel", "phone", "movil", "tfno", "telf", "tlf"]],
    ["email", false, ["email", "correo", "e mail", "mail"]],
    ["centro", false, ["centro", "clinica", "hospital", "centro de trabajo", "consulta"]],
    ["direccion", false, ["direccion", "domicilio", "address"]],
    ["cp", false, ["codigo postal", "cp", "postal"]],
    ["municipio", false, ["poblacion", "municipio", "ciudad", "localidad"]],
    ["provincia", false, ["provincia"]],
    ["nota", false, ["notas", "nota", "observaciones"]]
  ];
  var SALES_FIELDS = [
    ["numero", false, ["numero", "num factura", "factura", "n pedido", "pedido", "num", "numero factura", "numero pedido", "n factura"]],
    ["fecha", true, ["fecha", "date", "fecha factura", "fecha pedido"]],
    ["cliente", true, ["cliente", "contacto", "nombre cliente", "razon social", "customer"]],
    ["nif", false, ["nif", "cif", "dni"]],
    ["producto", true, ["producto", "item", "articulo", "concepto", "descripcion producto"]],
    ["referencia", false, ["referencia", "sku", "ref", "codigo"]],
    ["unidades", false, ["unidades", "uds", "cantidad", "qty", "unidad"]],
    ["precio", false, ["precio", "precio unitario", "pvp"]],
    ["importe", false, ["importe", "subtotal", "base", "total linea", "base imponible"]],
    ["iva", false, ["iva", "impuesto", "tipo iva"]],
    ["medico", false, ["medico", "prescriptor", "doctor"]],
    ["forma_pago", false, ["forma de pago", "f pago", "metodo de pago", "pago"]],
    ["cobrado", false, ["cobrado", "pagado", "estado cobro"]],
    ["canal", false, ["canal"]]
  ];
  var FIELDS = {
    clientes: CUSTOMER_FIELDS,
    productos: PRODUCT_FIELDS,
    prescriptores: PROFESSIONAL_FIELDS,
    ventas: SALES_FIELDS
  };

  // src/app/screens/import/wizard.ts
  var wizard = { entity: "clientes", fileName: "", book: null, headers: [], rows: [], mapping: [], signature: "", remembered: false };
  var steps2 = {
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
  function paint6(html) {
    const box = pageBox();
    if (box) box.innerHTML = html;
    return box;
  }
  function onClick3(id, action) {
    const element2 = document.getElementById(id);
    if (element2) element2.onclick = action;
  }
  var errorLines = (errors) => errors.slice(0, 200).map((item) => `<div><b>${t("importing.review.row", { row: item.fila })}</b> · ${escapeHtml(item.error)}</div>`).join("");
  function showProgress(done, total) {
    const bar2 = pageBox()?.querySelector(".impbarra i");
    if (bar2) bar2.style.width = `${Math.round(done / total * 100)}%`;
  }

  // src/app/screens/import/columns-step.ts
  var SAMPLE_ROWS = 40;
  var SAMPLES = 3;
  var samples2 = (index) => [...new Set(wizard.rows.slice(0, SAMPLE_ROWS).map((row4) => row4.v[index] ?? "").filter(Boolean))].slice(0, SAMPLES);
  function columnHtml(header, index) {
    const chosen2 = wizard.mapping[index] ?? "no", entity = wizard.entity;
    const options = FIELDS[entity].map(([key, required]) => `<option value="std:${key}" ${chosen2 === `std:${key}` ? "selected" : ""}>${escapeHtml(fieldLabel(entity, key))}${required ? " *" : ""}</option>`).join("");
    return `<div class="impcol ${chosen2 === "no" ? "ignorada" : ""}">
      <div><b>${escapeHtml(header)}</b><span class="sm">${samples2(index).map(escapeHtml).join(" · ") || t("importing.columns.empty")}</span></div>
      <span class="impflecha">→</span>
      <select data-impc="${index}"><option value="no" ${chosen2 === "no" ? "selected" : ""}>${t("importing.columns.skip")}</option>
        <optgroup label="${t("importing.columns.platformFields")}">${options}</optgroup>
        <option value="extra" ${chosen2 === "extra" ? "selected" : ""}>${t("importing.columns.custom", { name: escapeHtml(header) })}</option></select></div>`;
  }
  function pageHtml5() {
    const intro = t("importing.columns.summary", { rows: formatNumber(wizard.rows.length), columns: wizard.headers.length }) + (wizard.remembered ? t("importing.columns.remembered") : t("importing.columns.proposed")) + t("importing.columns.customHint", { type: escapeHtml(entityName(wizard.entity)) });
    return `<div class="card cfgpanel impcaja">${stepsHtml(3)}
    <h2 style="padding:0 0 4px">${t("importing.columns.title", { name: escapeHtml(wizard.fileName) })}</h2>
    <p class="sm">${intro}</p>
    <div class="impmapa">${wizard.headers.map(columnHtml).join("")}</div>
    <div id="impaviso" class="sm" style="margin-top:10px"></div>
    <div class="acts" style="justify-content:space-between"><button class="btn sec" type="button" id="impvolver">${t("importing.file.back")}</button><button class="btn" type="button" id="impsig">${t("importing.columns.next")}</button></div></div>`;
  }
  function problems() {
    const entity = wizard.entity, assigned = wizard.mapping.filter((value10) => value10.startsWith("std:")).map((value10) => value10.slice(4));
    const missing = FIELDS[entity].filter(([key, required]) => required && !assigned.includes(key) && !(entity === "ventas" && key === "producto" && assigned.includes("referencia"))).map(([key]) => fieldLabel(entity, key));
    const repeated = [...new Set(assigned.filter((key, index) => assigned.indexOf(key) !== index))].map((key) => fieldLabel(entity, key));
    return { missing, repeated };
  }
  function check() {
    const { missing, repeated } = problems(), notice = document.getElementById("impaviso"), next = document.getElementById("impsig");
    const danger = (text2) => `<span style="color:var(--dang)">${text2}</span>`;
    if (notice) {
      notice.innerHTML = missing.length ? danger(t("importing.columns.missing", { fields: missing.map(escapeHtml).join(", ") })) : repeated.length ? danger(t("importing.columns.repeated", { fields: repeated.map(escapeHtml).join(", ") })) : "";
    }
    if (next) next.disabled = Boolean(missing.length || repeated.length);
  }
  function paintColumnsStep() {
    const box = paint6(pageHtml5());
    box?.querySelectorAll("[data-impc]").forEach((select2) => {
      select2.onchange = () => {
        wizard.mapping[Number(select2.dataset.impc)] = select2.value;
        select2.closest(".impcol")?.classList.toggle("ignorada", select2.value === "no");
        check();
      };
    });
    onClick3("impvolver", steps2.file);
    onClick3("impsig", steps2.review);
    check();
  }

  // src/app/screens/import/matching.ts
  var MIN_SCORE = 55;
  var EXACT = 100;
  var CONTAINED = 75;
  var SIMILAR = 70;
  var TITLE_ROWS = 15;
  var TITLE_SHARE = 0.8;
  var KEY_LENGTH = 40;
  var normaliseHeader = (text2) => String(text2 ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  var customFieldKey = (text2) => normaliseHeader(text2).toUpperCase().replace(/ /g, "_").slice(0, KEY_LENGTH) || "CAMPO";
  function hashText(text2) {
    let hash = 5381;
    for (const char of text2) hash = (hash << 5) + hash + char.charCodeAt(0) | 0;
    return (hash >>> 0).toString(36);
  }
  var pad = (value10) => String(value10).padStart(2, "0");
  function cellValue(value10) {
    if (value10 === null || value10 === void 0) return "";
    if (value10 instanceof Date) return Number.isNaN(value10.getTime()) ? "" : `${value10.getFullYear()}-${pad(value10.getMonth() + 1)}-${pad(value10.getDate())}`;
    return String(value10).trim();
  }
  function detectHeaderRow(rows) {
    const scores = rows.slice(0, TITLE_ROWS).map((row4) => row4.filter((cell3) => cell3.trim() && Number.isNaN(Number(cell3.replace(",", ".")))).length);
    const best = Math.max(0, ...scores);
    if (best < 2) return 0;
    return scores.findIndex((score2) => score2 >= best * TITLE_SHARE);
  }
  function pairs(text2) {
    const found = /* @__PURE__ */ new Set();
    for (let i = 0; i < text2.length - 1; i++) found.add(text2.slice(i, i + 2));
    return found;
  }
  function similarity(first, second) {
    const firstPairs = pairs(first), secondPairs = pairs(second);
    if (!firstPairs.size || !secondPairs.size) return 0;
    let common = 0;
    firstPairs.forEach((pair2) => {
      if (secondPairs.has(pair2)) common++;
    });
    return 2 * common / (firstPairs.size + secondPairs.size);
  }
  function score(header, synonym) {
    if (header === synonym) return EXACT;
    if (header.split(" ").includes(synonym) || synonym.length > 3 && header.includes(synonym)) return CONTAINED;
    return Math.round(similarity(header, synonym) * SIMILAR);
  }
  function proposeField(header, entity, used) {
    const normalised = normaliseHeader(header);
    let best = null;
    for (const [key, , synonyms] of FIELDS[entity]) {
      if (used.has(key)) continue;
      const points = Math.max(0, ...[...synonyms, key].map((synonym) => score(normalised, normaliseHeader(synonym))));
      if (points >= MIN_SCORE && (!best || points > best.points)) best = { key, points };
    }
    return best ? best.key : null;
  }

  // src/app/screens/import/file-step.ts
  var MAX_ROWS = 2e4;
  function paintImport() {
    wizard.book = null;
    const types2 = entityTypes().map((type) => `<button class="imptipo" type="button" data-impt="${type.key}"><span class="imptic">${icon(type.icon)}</span><b>${escapeHtml(type.name)}</b><span class="sm">${escapeHtml(type.hint)}</span></button>`).join("");
    const box = paint6(`<div class="card cfgpanel impcaja">${stepsHtml(1)}
    <h2 style="padding:0 0 4px">${t("importing.start.title")}</h2>
    <p class="sm">${t("importing.start.text")}</p>
    <div class="imptipos">${types2}</div></div>`);
    box?.querySelectorAll("[data-impt]").forEach((button2) => {
      button2.onclick = () => {
        wizard.entity = button2.dataset.impt;
        paintFileStep();
      };
    });
  }
  function paintFileStep() {
    paint6(`<div class="card cfgpanel impcaja">${stepsHtml(2)}
    <h2 style="padding:0 0 4px">${t("importing.file.title", { name: escapeHtml(entityName(wizard.entity).toLowerCase()) })}</h2>
    <p class="sm">${t("importing.file.text")}${wizard.entity === "ventas" ? t("importing.file.salesText") : ""}</p>
    <label class="impzona" id="impzona"><input type="file" id="impfile" accept=".xlsx,.xls,.csv,.txt" hidden>
      ${icon("file-spreadsheet")}<b>${t("importing.file.drop")}</b><span class="sm">${t("importing.file.maxRows")}</span></label>
    <div id="imphojas"></div>
    <div class="acts" style="justify-content:space-between"><button class="btn sec" type="button" id="impvolver">${t("importing.file.back")}</button></div></div>`);
    onClick3("impvolver", steps2.start);
    const zone = document.getElementById("impzona"), input3 = document.getElementById("impfile");
    if (!zone || !input3) return;
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
    input3.onchange = () => {
      const file = input3.files?.[0];
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
    onClick3("imphojaok", () => {
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
      const field4 = proposeField(header, wizard.entity, used);
      if (field4) {
        used.add(field4);
        return `std:${field4}`;
      }
      return wizard.rows.some((row4) => row4.v[index] !== "") ? "extra" : "no";
    });
  }
  async function readSheet(name) {
    const reader = await importLegacy.excelReader(), sheet = wizard.book?.Sheets[name];
    const rows = reader.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: "" }).map((row4) => row4.map(cellValue));
    const titleRow = detectHeaderRow(rows);
    wizard.headers = (rows[titleRow] ?? []).map((cell3, index) => cell3 || t("importing.file.column", { index: index + 1 }));
    wizard.rows = rows.slice(titleRow + 1).map((values, index) => ({ fila: titleRow + index + 2, v: values })).filter((row4) => row4.v.some((cell3) => cell3 !== ""));
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
    steps2.columns();
  }

  // src/app/screens/import/rows.ts
  var BATCH = 200;
  function columnsOf() {
    const standard = /* @__PURE__ */ new Map(), custom = /* @__PURE__ */ new Map();
    wizard.mapping.forEach((value10, index) => {
      if (value10.startsWith("std:")) standard.set(value10.slice(4), index);
      else if (value10 === "extra") custom.set(customFieldKey(wizard.headers[index] ?? ""), index);
    });
    return { standard, custom };
  }
  function rowObject(row4, columns) {
    const result = { _fila: row4.fila }, extra = {};
    columns.standard.forEach((index, key) => {
      result[key] = row4.v[index] ?? "";
    });
    columns.custom.forEach((index, key) => {
      const value10 = row4.v[index];
      if (value10 !== void 0 && value10 !== "") extra[key] = value10;
    });
    result.extra = extra;
    return result;
  }
  var text = (value10) => typeof value10 === "string" ? value10 : "";
  function newOrder(row4) {
    return {
      _fila: row4._fila,
      numero: text(row4.numero),
      fecha: row4.fecha,
      cliente: row4.cliente,
      nif: text(row4.nif),
      medico: text(row4.medico),
      forma_pago: text(row4.forma_pago),
      cobrado: text(row4.cobrado),
      canal: text(row4.canal),
      extra: row4.extra,
      lineas: []
    };
  }
  function salesOrders(rows) {
    const orders = /* @__PURE__ */ new Map();
    for (const row4 of rows) {
      const key = text(row4.numero) ? `n:${text(row4.numero)}` : `f:${String(row4.fecha)}|${String(row4.cliente)}`;
      const order = orders.get(key) ?? newOrder(row4);
      orders.set(key, order);
      order.lineas.push({ producto: text(row4.producto), referencia: text(row4.referencia), unidades: row4.unidades, precio: row4.precio, importe: row4.importe, iva: row4.iva, medico: text(row4.medico) });
    }
    return [...orders.values()];
  }
  function rowsToImport() {
    const columns = columnsOf(), rows = wizard.rows.map((row4) => rowObject(row4, columns));
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
    return wizard.mapping.map((value10, index) => value10 === "extra" ? index : null).filter(isPresent).map((index) => {
      const values = [...new Set(wizard.rows.map((row4) => row4.v[index] ?? "").filter(Boolean))], name = wizard.headers[index] ?? "";
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
    const errors = result.errores, figure2 = (value10, label, extraClass = "") => `<div class="${extraClass}"><b>${formatNumber(value10)}</b><span>${label}</span></div>`;
    return `<div class="card cfgpanel impcaja"><div class="impfin">${icon("check")}</div>
    <h2 style="padding:0 0 4px;text-align:center">${t("importing.run.finished")}</h2>
    <div class="impres">${figure2(result.creados, t("importing.run.created"), "ok")}${figure2(result.actualizados, t("importing.run.updated"))}
      ${figure2(result.omitidos, t("importing.run.unchanged"))}${figure2(errors.length, t("importing.run.withErrors"), errors.length ? "mal" : "")}</div>
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
    paint6(`<div class="card cfgpanel impcaja">${stepsHtml(4)}<h2 style="padding:0 0 4px">${t("importing.run.running")}</h2><p class="sm" id="impav">${t("importing.run.progress", { done: 0, total: formatNumber(rows.length) })}</p><div class="impbarra"><i style="width:0"></i></div></div>`);
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
    paint6(finishedHtml(result));
    const destination2 = DESTINATIONS[wizard.entity];
    onClick3("impdes", () => {
      void undoImport(importId);
    });
    onClick3("impotra", steps2.start);
    onClick3("impver", () => {
      if (destination2 === "ventas") goToOrders("ventas");
      else goTo(destination2);
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
    steps2.history();
  }

  // src/app/screens/import/history.ts
  var UNDONE = "Deshecha";
  function rowHtml8(item, names) {
    const date = new Date(item.creado_en).toLocaleString(t("dates.locale"), { dateStyle: "short", timeStyle: "short" });
    const line2 = t("importing.history.line", {
      date,
      user: escapeHtml(orFallback(item.usuario, "—")),
      rows: formatNumber(item.filas),
      created: formatNumber(item.creados),
      updated: formatNumber(item.actualizados),
      errors: formatNumber(item.errores),
      state: escapeHtml(item.estado)
    });
    return `<div class="errfila e-${item.estado === UNDONE ? "api" : "reporte"}"><div><b>${escapeHtml(names.get(item.entidad) ?? item.entidad)} · ${escapeHtml(item.archivo ?? "")}</b>
      <span class="sm">${line2}</span></div>
      ${item.estado !== UNDONE ? `<button class="btn sec" type="button" data-impdes="${item.id}">${icon("undo-2")} ${t("importing.history.undo")}</button>` : "<span></span>"}</div>`;
  }
  async function paintImports() {
    const { data } = await callRpc("importaciones_lista", {});
    const names = new Map(entityTypes().map((type) => [type.key, type.name]));
    const box = paint6(`<div class="card cfgpanel"><h2>${t("importing.history.title")}</h2>
    <p class="sm">${t("importing.history.text")}</p>
    <div class="errlista">${(data ?? []).map((item) => rowHtml8(item, names)).join("") || `<div class="vacio">${t("importing.history.none")}</div>`}</div></div>`);
    box?.querySelectorAll("[data-impdes]").forEach((button2) => {
      button2.onclick = () => {
        void undoImport(button2.dataset.impdes ?? "");
      };
    });
  }

  // src/app/screens/import/review-step.ts
  var MATCHED_BY = /* @__PURE__ */ new Map([["clientes", "importing.review.byCustomer"], ["productos", "importing.review.byProduct"]]);
  var OPEN_ERRORS = 10;
  function countsOf(check2) {
    const count2 = (action) => check2.filas.filter((row4) => row4.accion === action).length;
    return { created: count2("nuevo"), existing: count2("actualizado"), skipped: count2("omitido"), unit: t(wizard.entity === "ventas" ? "importing.review.orders" : "importing.review.records") };
  }
  function summaryHtml2(counts, errors) {
    return `<div class="impres"><div class="ok"><b>${formatNumber(counts.created)}</b><span>${t("importing.review.newOnes", { unit: counts.unit })}</span></div>
      <div><b>${formatNumber(counts.existing + counts.skipped)}</b><span>${t("importing.review.existing")}${wizard.entity === "ventas" ? t("importing.review.untouched") : ""}</span></div>
      <div class="${errors ? "mal" : ""}"><b>${formatNumber(errors)}</b><span>${t("importing.review.withErrors")}</span></div></div>`;
  }
  function modeHtml(counts) {
    if (!counts.existing || wizard.entity === "ventas") return "";
    return `<label>${t("importing.review.existingLabel")}</label><div class="segs" id="impmodo"><button type="button" data-v="actualizar" class="on">${t("importing.review.update")}</button><button type="button" data-v="omitir">${t("importing.review.keep")}</button></div>
      <p class="sm">${t("importing.review.matchedBy", { keys: t(MATCHED_BY.get(wizard.entity) ?? "importing.review.byName") })}</p>`;
  }
  function pageHtml6(check2, counts) {
    const custom = wizard.mapping.map((value10, index) => value10 === "extra" ? wizard.headers[index] ?? "" : "").filter(Boolean);
    const errors = check2.errores;
    return `<div class="card cfgpanel impcaja">${stepsHtml(4)}
    <h2 style="padding:0 0 4px">${t("importing.review.title", { name: escapeHtml(wizard.fileName) })}</h2>
    ${summaryHtml2(counts, errors.length)}
    ${modeHtml(counts)}
    ${custom.length ? `<p class="sm">${t("importing.review.customFields", { fields: custom.map(escapeHtml).join(", ") })}</p>` : ""}
    ${errors.length ? `<details class="imperr" ${errors.length <= OPEN_ERRORS ? "open" : ""}><summary>${t("importing.review.seeErrors")}</summary><div>${errorLines(errors)}</div></details>` : ""}
    <div class="acts" style="justify-content:space-between"><button class="btn sec" type="button" id="impvolver">${t("importing.review.backToColumns")}</button>
      <button class="btn" type="button" id="impok" ${counts.created + counts.existing ? "" : "disabled"}>${t("importing.review.run", { count: formatNumber(counts.created + counts.existing), unit: counts.unit })}</button></div></div>`;
  }
  function bind11(rows, counts) {
    let mode = "actualizar";
    const modes = document.getElementById("impmodo"), run = document.getElementById("impok");
    modes?.querySelectorAll("button").forEach((button2) => {
      button2.onclick = () => {
        mode = button2.dataset.v ?? "actualizar";
        modes.querySelectorAll("button").forEach((other) => {
          other.classList.toggle("on", other === button2);
        });
        if (run) run.textContent = t("importing.review.run", { count: formatNumber(counts.created + (mode === "actualizar" ? counts.existing : 0)), unit: counts.unit });
      };
    });
    onClick3("impvolver", steps2.columns);
    if (run) run.onclick = () => {
      void runImport(rows, wizard.entity === "ventas" ? "omitir" : mode);
    };
  }
  async function paintReviewStep() {
    const rows = rowsToImport();
    paint6(`<div class="card cfgpanel impcaja">${stepsHtml(4)}<h2 style="padding:0 0 4px">${t("importing.review.checking")}</h2><p class="sm">${t("importing.review.checkingText")}</p><div class="impbarra"><i style="width:0"></i></div></div>`);
    let check2;
    try {
      check2 = await sendInBatches(rows, { entity: wizard.entity, mode: "actualizar", simulate: true, importId: null }, showProgress);
    } catch (error) {
      notices.toast(t("importing.review.couldNotCheck", { error: error instanceof Error ? error.message : String(error) }), true);
      steps2.columns();
      return;
    }
    const counts = countsOf(check2);
    paint6(pageHtml6(check2, counts));
    bind11(rows, counts);
  }

  // src/app/screens/import/index.ts
  Object.assign(steps2, {
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

  // src/app/screens/purchases/index.ts
  var purchases_exports = {};
  __export(purchases_exports, {
    editPurchase: () => editPurchase,
    editSupplier: () => editSupplier,
    paintPurchases: () => paintPurchases,
    paintSuppliers: () => paintSuppliers
  });

  // src/app/screens/purchases/model.ts
  var STATES5 = {
    draft: "Borrador",
    sent: "Enviado",
    inTransit: "En tránsito",
    partlyReceived: "Recibido parcial",
    received: "Recibido",
    cancelled: "Cancelado"
  };
  var OPEN_STATES = [STATES5.sent, STATES5.inTransit, STATES5.partlyReceived];
  var EDITABLE_STATES = [STATES5.draft, STATES5.sent, STATES5.inTransit];
  var CLOSED_STATES = [STATES5.received, STATES5.cancelled];
  var DEFAULT_LEAD_DAYS = 90;
  var errorText2 = (error, result) => error?.message ?? result?.error ?? "";
  var euros = (value10) => formatCurrency(Math.round((Number(value10) || 0) * 100) / 100);
  function purchasePill(state) {
    const kind = state === STATES5.received ? "p-est" : state === STATES5.cancelled ? "p-anu" : state === STATES5.draft ? "p-bor" : "p-per";
    return `<span class="pill ${kind}">${escapeHtml(state)}</span>`;
  }

  // src/app/screens/purchases/editor-view.ts
  var disabled = (editor) => editor.editable ? "" : "disabled";
  function headerHtml7(editor) {
    const { id, purchase } = editor;
    const title2 = id ? t("purchases.editor.title", { number: escapeHtml(purchase.numero) }) : t("purchases.editor.newTitle");
    return `<div class="fh"><div><h2>${title2} ${id ? purchasePill(purchase.estado) : ""}</h2>
        <div class="sm">${id ? t("purchases.editor.createdOn", { date: formatShortDate(purchase.fecha) }) : t("purchases.editor.numberedOnSave")}</div></div>
        <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>`;
  }
  function supplierHtml(editor) {
    const { purchase } = editor, off = disabled(editor);
    const suppliers = purchasesLegacy.suppliers().filter((supplier) => supplier.activo === true || supplier.id === purchase.proveedor_id).map((supplier) => `<option value="${supplier.id ?? ""}" data-plazo="${nonZeroOr(supplier.plazo_dias, DEFAULT_LEAD_DAYS)}" ${supplier.id === purchase.proveedor_id ? "selected" : ""}>${escapeHtml(supplier.nombre)}</option>`).join("");
    return `<div class="g2">
        <div><label for="cpprov">${t("purchases.editor.supplier")}</label><select id="cpprov" ${off}>
          ${suppliers}</select></div>
        <div class="g2" style="margin:0">
          <div><label for="cpfecha">${t("purchases.editor.date")}</label><input id="cpfecha" type="date" value="${escapeHtml(orFallback(purchase.fecha, todayIso()))}" ${off}></div>
          <div><label for="cpprev">${t("purchases.editor.expected")}</label><input id="cpprev" type="date" value="${escapeHtml(purchase.fecha_prevista ?? "")}" ${off}></div></div>
      </div>`;
  }
  function lineHtml2(editor, line2, index) {
    const off = disabled(editor);
    const products2 = purchasesLegacy.products().map((product) => `<option value="${product.id}" ${product.id === line2.producto_id ? "selected" : ""}>${escapeHtml(product.nombre)}</option>`).join("");
    const received = editor.id ? `<label>${t("purchases.editor.received")}</label><div class="cprec">${t("purchases.editor.receivedOf", { received: formatNumber(line2.recibidas ?? 0), units: formatNumber(line2.unidades) })}</div>` : "";
    const remove7 = editor.editable && editor.lines.length > 1 ? `<button type="button" class="btn sec" data-clx="${index}" aria-label="${t("purchases.editor.remove")}">✕</button>` : "";
    return `<div class="lin"><div class="lrow cprow">
        <div><label>${t("purchases.editor.product")}</label><select data-cl="${index}|producto_id" ${off}>${products2}</select></div>
        <div><label>${t("purchases.editor.units")}</label><input type="number" min="1" data-cl="${index}|unidades" value="${line2.unidades}" ${off}></div>
        <div><label>${t("purchases.editor.unitCost")}</label><input type="number" step="0.0001" min="0" data-cl="${index}|coste_unitario" value="${line2.coste_unitario ?? ""}" ${off}></div>
        <div>${received}</div>
        <div>${remove7}</div></div></div>`;
  }
  function batchesHtml(editor) {
    const batches = editor.detail?.lotes ?? [];
    if (!batches.length) return "";
    return `<div class="blk"><h3>${t("purchases.editor.batchesReceived")}</h3>${batches.map((batch) => `<div class="sm">${t("purchases.editor.batchLine", { product: escapeHtml(batch.producto), batch: escapeHtml(batch.numero_lote), units: formatNumber(batch.unidades) })}${batch.caducidad ? t("purchases.editor.expires", { date: formatShortDate(batch.caducidad) }) : ""}</div>`).join("")}</div>`;
  }
  function stepButtons(editor) {
    const state = editor.purchase.estado;
    if (!purchasesLegacy.canBuy()) return [];
    return [
      state === STATES5.draft ? `<button class="btn sec" id="cpenviar">${t("purchases.editor.markSent")}</button>` : "",
      state === STATES5.sent ? `<button class="btn sec" id="cptransito">${t("purchases.editor.inTransit")}</button>` : "",
      editor.id && OPEN_STATES.includes(state) ? `<button class="btn" id="cprecibir">${t("purchases.editor.receive")}</button>` : ""
    ];
  }
  function buttonsHtml2(editor) {
    const { id, purchase, editable } = editor, state = purchase.estado;
    const buttons = [
      purchasesLegacy.canBuy() && id && !CLOSED_STATES.includes(state) ? `<button class="btn sec dang" id="cpcancel">${t("purchases.editor.cancelOrder")}</button>` : "",
      editable ? `<button class="btn sec" id="cpguardar">${t(state === STATES5.draft ? "purchases.editor.saveDraft" : "purchases.editor.saveChanges")}</button>` : "",
      ...stepButtons(editor)
    ];
    return `<div class="acts" style="justify-content:flex-end;flex-wrap:wrap">
        <button class="btn sec" data-cerrar>${t("purchases.editor.close")}</button>
        ${buttons.join("\n        ")}
      </div>`;
  }
  function editorHtml4(editor) {
    const { purchase } = editor, off = disabled(editor);
    return `
      ${headerHtml7(editor)}
      ${supplierHtml(editor)}
      <label>${t("purchases.editor.products")}</label>
      <div id="cplin">${editor.lines.map((line2, index) => lineHtml2(editor, line2, index)).join("")}</div>
      ${editor.editable ? `<div class="acts" style="margin-top:0"><button type="button" class="btn sec" id="cpmas">${t("purchases.editor.addProduct")}</button></div>` : ""}
      <div class="g2">
        <div><label for="cpport">${t("purchases.editor.shipping")}</label><input id="cpport" type="number" step="0.01" min="0" value="${purchase.portes ? String(purchase.portes) : 0}" ${off}></div>
        <div><label for="cpnota">${t("purchases.editor.note")}</label><input id="cpnota" value="${escapeHtml(purchase.nota ?? "")}" ${off}></div></div>
      <div class="totbox" id="cptot"></div>
      ${batchesHtml(editor)}
      ${buttonsHtml2(editor)}`;
  }
  function totalsHtml2(lines, shipping) {
    const amount3 = sum(lines.map((line2) => (Number(line2.unidades) || 0) * (Number(line2.coste_unitario) || 0))) + shipping;
    return `<div><span>${t("purchases.editor.totalUnits")}</span><b>${formatNumber(sum(lines.map((line2) => Number(line2.unidades) || 0)))}</b></div>
        <div class="tot"><span>${t("purchases.editor.totalAmount")}</span><b>${euros(amount3)}</b></div>`;
  }

  // src/app/screens/purchases/receive.ts
  var field = (row4, name) => row4.querySelector(`[data-r=${name}]`)?.value ?? "";
  function lineHtml3(line2, storeId) {
    const pending = line2.unidades - (line2.recibidas ?? 0);
    return `<div class="lin" data-rl="${line2.id ?? ""}">
      <b>${escapeHtml(line2.producto)}</b> <span class="sm">${t("purchases.receive.pending", { pending: formatNumber(pending), units: formatNumber(line2.unidades) })}</span>
      <div class="rclotes">${purchasesLegacy.batchFields(line2, pending, storeId)}</div>
      <button type="button" class="kcfg" data-rlmas="${line2.id ?? ""}">${t("purchases.receive.otherBatch")}</button></div>`;
  }
  function readRows(box) {
    return [...box.querySelectorAll(".rcl")].map((row4) => ({
      linea_id: row4.closest("[data-rl]")?.dataset.rl ?? "",
      unidades: Number(field(row4, "u")) || 0,
      numero_lote: field(row4, "lote").trim(),
      caducidad: field(row4, "cad"),
      fecha_fabricacion: field(row4, "fab"),
      almacen_id: field(row4, "alm")
    })).filter((row4) => row4.unidades > 0);
  }
  async function checked(rows) {
    if (!rows.length) {
      notices.toast(t("purchases.receive.writeUnits"), true);
      return false;
    }
    if (rows.some((row4) => !row4.numero_lote)) {
      notices.toast(t("purchases.receive.needsBatch"), true);
      return false;
    }
    if (!rows.some((row4) => !row4.caducidad)) return true;
    return notices.confirm(t("purchases.receive.noExpiryText"), { titulo: t("purchases.receive.noExpiryTitle"), ok: t("purchases.receive.noExpiryOk") });
  }
  async function record(id, box, button2) {
    const rows = readRows(box);
    if (!await checked(rows)) return;
    button2.disabled = true;
    const { data: result, error } = await legacyDb().rpc("recibir_compra", { p_compra: id, p_lineas: rows });
    if (error || !result || result.ok === false) {
      button2.disabled = false;
      notices.toast(t("purchases.receive.couldNot", { error: errorText2(error, result) }), true);
      return;
    }
    document.getElementById("dlg")?.close();
    notices.toast(result.pendientes ? t("purchases.receive.stillToCome", { units: formatNumber(result.pendientes) }) : t("purchases.receive.complete"));
    purchasesLegacy.reloadSales();
  }
  function receivePurchase(id, detail) {
    const pending = detail.lineas.filter((line2) => line2.unidades > (line2.recibidas ?? 0));
    const stores = purchasesLegacy.stores(), storeId = (stores.find((store) => store.tipo === "central") ?? stores[0])?.id;
    const body2 = document.getElementById("dbody");
    if (!body2) return;
    body2.innerHTML = `
    <div class="fh"><div><h2>${t("purchases.receive.title", { number: escapeHtml(detail.compra.numero) })}</h2>
      <div class="sm">${t("purchases.receive.subtitle")}</div></div>
      <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>
    <div id="rclin">${pending.map((line2) => lineHtml3(line2, storeId)).join("")}</div>
    <div class="acts" style="justify-content:flex-end"><button class="btn sec" data-cerrar>${t("purchases.receive.cancel")}</button><button class="btn" id="rcok">${t("purchases.receive.record")}</button></div>`;
    const box = document.getElementById("rclin");
    if (!box) return;
    box.querySelectorAll("[data-rlmas]").forEach((button2) => {
      button2.onclick = () => {
        const line2 = pending.find((item) => item.id === button2.dataset.rlmas);
        if (line2) button2.previousElementSibling?.insertAdjacentHTML("beforeend", purchasesLegacy.batchFields(line2, "", storeId));
      };
    });
    const ok = document.getElementById("rcok");
    if (ok) ok.onclick = () => {
      void record(id, box, ok);
    };
  }

  // src/app/screens/purchases/editor.ts
  var input2 = (id) => document.getElementById(id);
  var value7 = (id) => input2(id)?.value ?? "";
  var closeWindow2 = () => {
    document.getElementById("dlg")?.close();
  };
  function newLine() {
    const first = purchasesLegacy.products()[0];
    return { ...first ? { producto_id: first.id } : {}, unidades: 1, coste_unitario: first?.coste };
  }
  function paintTotals(editor) {
    const box = document.getElementById("cptot");
    if (box) box.innerHTML = totalsHtml2(editor.lines, Number(value7("cpport")) || 0);
  }
  function onLineChange(editor, target) {
    const [index = "", field4 = ""] = (target.dataset.cl ?? "").split("|"), line2 = editor.lines[Number(index)];
    if (!field4 || !line2) return;
    if (field4 === "producto_id") {
      line2.producto_id = target.value;
      const product = purchasesLegacy.products().find((item) => item.id === target.value);
      if (product && product.coste !== null && product.coste !== void 0) {
        line2.coste_unitario = product.coste;
        paint7(editor);
        return;
      }
    } else if (field4 === "unidades") line2.unidades = Number(target.value);
    else line2.coste_unitario = Number(target.value);
    paintTotals(editor);
  }
  function suggestExpected() {
    const supplier = document.getElementById("cpprov"), expected = input2("cpprev");
    if (!supplier || !expected || expected.value) return;
    expected.value = addDays(value7("cpfecha") || todayIso(), nonZeroOr(Number(supplier.selectedOptions[0]?.dataset.plazo), DEFAULT_LEAD_DAYS));
  }
  function bindLines(editor) {
    const lines = document.getElementById("cplin");
    if (lines) lines.oninput = lines.onchange = (event) => {
      onLineChange(editor, event.target);
    };
    const shipping = input2("cpport");
    if (shipping) shipping.oninput = () => {
      paintTotals(editor);
    };
    const add2 = document.getElementById("cpmas");
    if (add2) add2.onclick = () => {
      editor.lines.push(newLine());
      paint7(editor);
    };
    lines?.querySelectorAll("[data-clx]").forEach((button2) => {
      button2.onclick = () => {
        editor.lines.splice(Number(button2.dataset.clx), 1);
        paint7(editor);
      };
    });
    const supplier = document.getElementById("cpprov");
    if (supplier) supplier.onchange = suggestExpected;
    if (!value7("cpprev") && supplier?.value) suggestExpected();
  }
  function payload4(editor, state) {
    const lines = editor.lines.filter((line2) => line2.producto_id && Number(line2.unidades) > 0).map((line2) => ({ producto_id: line2.producto_id, unidades: Number(line2.unidades), coste_unitario: line2.coste_unitario }));
    return {
      id: editor.id ?? null,
      proveedor_id: value7("cpprov"),
      fecha: value7("cpfecha"),
      fecha_prevista: value7("cpprev"),
      estado: state ?? editor.purchase.estado,
      portes: value7("cpport"),
      nota: value7("cpnota").trim(),
      lineas: lines
    };
  }
  async function save6(editor, state) {
    if (!value7("cpprov")) {
      notices.toast(t("purchases.editor.chooseSupplier"), true);
      return;
    }
    const { data: result, error } = await legacyDb().rpc("guardar_compra", { p: payload4(editor, state) });
    if (error || !result || result.ok === false) {
      notices.toast(t("purchases.editor.couldNotSave", { error: errorText2(error, result) }), true);
      return;
    }
    notices.toast(t("purchases.editor.saved", { number: result.numero ?? "" }));
    closeWindow2();
    if (currentScreen() === "ventas") purchasesLegacy.reloadSales();
  }
  var changeState = (purchase, state) => legacyDb().rpc("guardar_compra", { p: {
    id: purchase.id,
    proveedor_id: purchase.proveedor_id,
    fecha: purchase.fecha,
    fecha_prevista: purchase.fecha_prevista,
    estado: state,
    portes: purchase.portes,
    nota: purchase.nota
  } });
  async function markInTransit(purchase) {
    const { error } = await changeState(purchase, STATES5.inTransit);
    if (error) {
      notices.toast(t("purchases.editor.couldNot"), true);
      return;
    }
    notices.toast(t("purchases.editor.markedInTransit"));
    closeWindow2();
    purchasesLegacy.reloadSales();
  }
  async function cancel(purchase) {
    if (!await notices.confirm(t("purchases.editor.cancelText"), { titulo: t("purchases.editor.cancelTitle"), ok: t("purchases.editor.cancelOrder"), peligro: true })) return;
    await changeState(purchase, STATES5.cancelled);
    notices.toast(t("purchases.editor.cancelled"));
    closeWindow2();
    purchasesLegacy.reloadSales();
  }
  function bindButtons(editor) {
    const on2 = (id, action) => {
      const button2 = document.getElementById(id);
      if (button2) button2.onclick = action;
    };
    on2("cpguardar", () => {
      void save6(editor);
    });
    on2("cpenviar", () => {
      void save6(editor, STATES5.sent);
    });
    on2("cptransito", () => {
      void markInTransit(editor.purchase);
    });
    on2("cpcancel", () => {
      void cancel(editor.purchase);
    });
    on2("cprecibir", () => {
      if (editor.id && editor.detail) receivePurchase(editor.id, editor.detail);
    });
  }
  function paint7(editor) {
    const body2 = document.getElementById("dbody");
    if (!body2) return;
    body2.innerHTML = editorHtml4(editor);
    paintTotals(editor);
    if (editor.editable) bindLines(editor);
    bindButtons(editor);
  }
  async function editPurchase(id) {
    await Promise.all([purchasesLegacy.loadProducts(), purchasesLegacy.loadSuppliers(), purchasesLegacy.loadStores()]);
    const detail = id ? (await callRpc("compra_detalle", { p_id: id })).data : null;
    const purchase = detail ? detail.compra : { estado: STATES5.draft, fecha: todayIso(), portes: 0 };
    const editor = {
      id,
      purchase,
      detail,
      editable: purchasesLegacy.canBuy() && EDITABLE_STATES.includes(purchase.estado),
      lines: detail ? detail.lineas.map((line2) => ({ ...line2 })) : [newLine()]
    };
    paint7(editor);
    document.getElementById("dlg")?.showModal();
  }

  // src/app/screens/purchases/list.ts
  var LATE_STYLE = "color:var(--danger);font-weight:700";
  var loadingHtml3 = (text2) => `<div class="cargador"><span class="spin"></span><span class="sm">${escapeHtml(text2)}</span></div>`;
  function indicatorsHtml2(rows) {
    const open2 = rows.filter((row4) => OPEN_STATES.includes(row4.estado)), late = rows.filter((row4) => row4.retrasada);
    const yearStart = `${todayIso().slice(0, 4)}-01-01`;
    const bought = sum(rows.filter((row4) => row4.estado !== STATES5.cancelled && row4.fecha >= yearStart).map((row4) => Number(row4.importe) || 0));
    return `<div class="kpis vtot">
      <div class="kpi"><b>${formatNumber(open2.length)}</b><span>${t("purchases.list.inProgress")}</span></div>
      <div class="kpi"><b>${formatNumber(sum(open2.map((row4) => row4.unidades - row4.recibidas)))}</b><span>${t("purchases.list.unitsOnTheWay")}</span></div>
      <div class="kpi ${late.length ? "warn" : ""}"><b>${formatNumber(late.length)}</b><span>${t("purchases.list.late")}</span></div>
      <div class="kpi"><b>${euros(bought)}</b><span>${t("purchases.list.boughtThisYear")}</span></div>
    </div>`;
  }
  function rowHtml9(row4) {
    const expected = row4.fecha_prevista ? formatShortDate(row4.fecha_prevista) + (row4.retrasada ? t("purchases.list.lateTag") : "") : "—";
    const received = row4.recibidas && row4.recibidas < row4.unidades ? `${formatNumber(row4.recibidas)}/` : "";
    return `<button class="dr" data-comp="${row4.id}">
        <span><b>${escapeHtml(row4.numero)}</b></span><span>${escapeHtml(orFallback(row4.proveedor, "—"))}</span><span class="sm">${escapeHtml(row4.productos ?? "")}</span>
        <span>${formatShortDate(row4.fecha)}</span>
        <span style="${row4.retrasada ? LATE_STYLE : ""}">${expected}</span>
        <span class="num">${received}${formatNumber(row4.unidades)}</span>
        <span class="num">${euros(row4.importe)}</span><span>${purchasePill(row4.estado)}</span></button>`;
  }
  function tableHtml4(rows) {
    if (!rows.length) return `<div class="vacio">${t("purchases.list.none")}${purchasesLegacy.canBuy() ? t("purchases.list.createFirst") : ""}</div>`;
    const head = [["", "number"], ["", "supplier"], ["", "products"], ["", "date"], ["", "expected"], ["num", "units"], ["num", "amount"], ["", "state"]];
    return `<div class="dgrid-wrap"><div class="dgrid comps">
      <div class="dh">${head.map(([kind, key]) => `<span${kind ? ` class="${kind}"` : ""}>${t(`purchases.list.${key}`)}</span>`).join("")}</div>
      ${rows.map(rowHtml9).join("")}
    </div></div>`;
  }
  async function paintPurchases() {
    const loading2 = document.getElementById("vcuerpo");
    if (loading2) loading2.innerHTML = loadingHtml3(t("purchases.list.loading"));
    const { data, error } = await legacyDb().rpc("compras_lista");
    if (purchasesLegacy.section() !== "compras") return;
    const box = document.getElementById("vcuerpo");
    if (!box) return;
    if (error) {
      box.innerHTML = `<div class="vacio">${escapeHtml(error.message)}</div>`;
      return;
    }
    const rows = data ?? [];
    box.innerHTML = `<div class="panel">
    ${indicatorsHtml2(rows)}
    ${tableHtml4(rows)}</div>`;
    box.querySelectorAll("[data-comp]").forEach((button2) => {
      button2.onclick = () => {
        purchasesLegacy.openPurchase(button2.dataset.comp ?? null);
      };
    });
  }

  // src/app/screens/purchases/suppliers.ts
  var joined = (values) => values.filter(Boolean).join(" · ");
  function rowHtml10(supplier) {
    return `<button class="dr" data-prov="${supplier.id ?? ""}" style="${supplier.activo ? "" : "opacity:.55"}">
      <span><b>${escapeHtml(supplier.nombre)}</b><span class="sm">${escapeHtml(joined([supplier.municipio, supplier.pais]))}</span></span>
      <span>${escapeHtml(orFallback(supplier.nif, "—"))}</span><span class="sm">${escapeHtml(orFallback(joined([supplier.contacto, supplier.email, supplier.telefono]), "—"))}</span>
      <span class="num">${t("purchases.suppliers.days", { count: formatNumber(supplier.plazo_dias ?? 0) })}</span><span class="num">${formatNumber(supplier.compras)}</span>
      <span>${supplier.ultima_compra ? formatShortDate(supplier.ultima_compra) : "—"}</span>
      <span><span class="pill ${supplier.activo ? "p-est" : "p-anu"}">${t(supplier.activo ? "purchases.suppliers.active" : "purchases.suppliers.inactive")}</span></span></button>`;
  }
  function listHtml(suppliers) {
    if (!suppliers.length) return `<div class="vacio">${t("purchases.suppliers.none")}</div>`;
    const head = [["", "supplier"], ["", "taxId"], ["", "contact"], ["num", "leadTime"], ["num", "purchases"], ["", "lastPurchase"], ["", "state"]];
    return `<div class="dgrid-wrap"><div class="dgrid provs">
    <div class="dh">${head.map(([kind, key]) => `<span${kind ? ` class="${kind}"` : ""}>${t(`purchases.suppliers.${key}`)}</span>`).join("")}</div>
    ${suppliers.map(rowHtml10).join("")}
  </div></div>`;
  }
  async function paintSuppliers() {
    const loading2 = document.getElementById("vcuerpo");
    if (loading2) loading2.innerHTML = loadingHtml3(t("purchases.suppliers.loading"));
    await purchasesLegacy.loadSuppliers();
    const box = document.getElementById("vcuerpo");
    if (!box) return;
    const suppliers = purchasesLegacy.suppliers();
    box.innerHTML = `<div class="panel">${listHtml(suppliers)}</div>`;
    box.querySelectorAll("[data-prov]").forEach((button2) => {
      button2.onclick = () => {
        editSupplier(suppliers.find((supplier) => supplier.id === button2.dataset.prov) ?? null);
      };
    });
  }
  var FIELDS2 = [
    ["nombre", "purchases.supplierEditor.name"],
    ["nif", "purchases.supplierEditor.taxId"],
    ["contacto", "purchases.supplierEditor.contact"],
    ["email", "purchases.supplierEditor.email", 'type="email"'],
    ["telefono", "purchases.supplierEditor.phone"],
    ["direccion", "purchases.supplierEditor.address"],
    ["cp", "purchases.supplierEditor.postcode"],
    ["municipio", "purchases.supplierEditor.town"],
    ["provincia", "purchases.supplierEditor.province"],
    ["pais", "purchases.supplierEditor.country"],
    ["plazo_dias", "purchases.supplierEditor.leadTime", 'type="number" min="0"'],
    ["forma_pago", "purchases.supplierEditor.payment"],
    ["condiciones", "purchases.supplierEditor.conditions"],
    ["cuenta_contable", "purchases.supplierEditor.account", 'placeholder="400xxxxx"']
  ];
  var SAVED_FIELDS = [...FIELDS2.map(([name]) => name), "nota"];
  function fieldHtml(supplier, [name, label, extra = ""], readOnly) {
    const current = supplier[name];
    return `<div><label for="pv_${name}">${t(label)}</label><input id="pv_${name}" value="${escapeHtml(current ?? "")}" ${extra} ${readOnly}></div>`;
  }
  function editorHtml5(supplier, canBuy) {
    const readOnly = canBuy ? "" : "disabled", pairs2 = [];
    for (let i = 0; i < FIELDS2.length; i += 2) pairs2.push(`<div class="g2">${FIELDS2.slice(i, i + 2).map((item) => fieldHtml(supplier, item, readOnly)).join("")}</div>`);
    return `
    <div class="fh"><div><h2>${supplier.id ? escapeHtml(supplier.nombre) : t("purchases.supplierEditor.newTitle")}</h2><div class="sm">${t("purchases.supplierEditor.subtitle")}</div></div>
      <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>
    ${pairs2.join("\n    ")}
    <label for="pv_nota">${t("purchases.supplierEditor.note")}</label><input id="pv_nota" value="${escapeHtml(supplier.nota ?? "")}" ${readOnly}>
    ${supplier.id ? `<label class="opt" style="margin-top:10px"><input type="checkbox" id="pv_activo" ${supplier.activo ? "checked" : ""} ${readOnly}> ${t("purchases.supplierEditor.active")}</label>` : ""}
    <div class="acts" style="justify-content:flex-end"><button class="btn sec" data-cerrar>${t("purchases.supplierEditor.close")}</button>${canBuy ? `<button class="btn" id="pvok">${t(supplier.id ? "purchases.supplierEditor.save" : "purchases.supplierEditor.create")}</button>` : ""}</div>`;
  }
  function readValues(supplier) {
    const values = { id: supplier.id ?? null };
    for (const name of SAVED_FIELDS) values[name] = (document.getElementById(`pv_${name}`)?.value ?? "").trim();
    const active = document.getElementById("pv_activo");
    if (active) values.activo = active.checked;
    return values;
  }
  async function save7(supplier) {
    const values = readValues(supplier);
    if (!values.nombre) {
      notices.toast(t("purchases.supplierEditor.writeName"), true);
      return;
    }
    const { data: result, error } = await legacyDb().rpc("guardar_proveedor", { p: values });
    if (error || result?.ok === false) {
      notices.toast(t("purchases.supplierEditor.couldNotSave"), true);
      return;
    }
    document.getElementById("dlg")?.close();
    notices.toast(t(supplier.id ? "purchases.supplierEditor.saved" : "purchases.supplierEditor.created"));
    await purchasesLegacy.loadSuppliers();
    if (currentScreen() === "ventas" && purchasesLegacy.section() === "proveedores") void paintSuppliers();
  }
  function editSupplier(existing) {
    const supplier = existing ?? { activo: true, plazo_dias: DEFAULT_LEAD_DAYS, pais: t("purchases.supplierEditor.defaultCountry") };
    const body2 = document.getElementById("dbody"), box = document.getElementById("dlg");
    if (!body2 || !box) return;
    body2.innerHTML = editorHtml5(supplier, purchasesLegacy.canBuy());
    box.showModal();
    const ok = document.getElementById("pvok");
    if (ok) ok.onclick = () => {
      void save7(supplier);
    };
  }

  // src/app/screens/tenders/index.ts
  var tenders_exports = {};
  __export(tenders_exports, {
    editTender: () => editTender,
    editWarnings: () => editWarnings,
    paintTenders: () => paintTenders,
    showTender: () => showTender
  });

  // src/app/screens/tenders/editor.ts
  var field2 = (id) => document.getElementById(id)?.value ?? "";
  var textOrNull2 = (id) => field2(id).trim() || null;
  async function team() {
    if (!salesTeam.members().length) await salesTeam.load().catch(() => void 0);
    const me = salesTeam.currentUserId(), members = salesTeam.members();
    return members.some((member) => member.id === me) ? members : [{ id: me, nombre: appLegacy.currentUserName() }, ...members];
  }
  function editorHtml6(tender, existing, people) {
    const value10 = (text2) => escapeHtml(text2 ?? "");
    return `<div class="fh"><div><h2>${t(existing ? "tenders.editor.changeTitle" : "tenders.editor.newTitle")}</h2><div class="sm">${t("tenders.editor.subtitle")}</div></div>
      <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>
    <label for="cont">${t("tenders.editor.title")}</label><input id="cont" value="${value10(tender.titulo)}" placeholder="${t("tenders.editor.titlePlaceholder")}">
    <label>${t("tenders.editor.soldTo")}</label><div id="concta"></div>
    <div class="g2"><div><label for="conexp">${t("tenders.editor.file")}</label><input id="conexp" value="${value10(tender.expediente)}"></div>
      <div><label for="conorg">${t("tenders.editor.body")}</label><input id="conorg" value="${value10(tender.organismo)}" placeholder="${t("tenders.editor.bodyPlaceholder")}"></div></div>
    <div class="g2"><div><label for="conpub">${t("tenders.editor.published")}</label><input id="conpub" type="date" value="${value10(tender.publicado)}"></div>
      <div><label for="conlim">${t("tenders.editor.submitBy")}</label><input id="conlim" type="date" value="${value10(tender.limite)}"></div></div>
    <div class="g2"><div><label for="conimp">${t("tenders.editor.amount")}</label><input id="conimp" type="number" min="0" step="0.01" value="${isPresent(tender.importe_licitacion) ? Number(tender.importe_licitacion) : ""}"></div>
      <div><label for="conres">${t("tenders.editor.responsible")}</label><select id="conres">${people.map((person) => `<option value="${person.id}" ${person.id === tender.responsable_id ? "selected" : ""}>${escapeHtml(person.nombre)}</option>`).join("")}</select></div></div>
    <label for="conn">${t("tenders.editor.note")}</label><textarea id="conn" rows="2">${value10(tender.nota)}</textarea>
    <div class="acts" style="justify-content:flex-end">${existing ? `<button type="button" class="btn sec peligro" id="conborrar">${t("tenders.editor.delete")}</button>` : ""}
      <button type="button" class="btn sec" data-cerrar>${t("tenders.editor.cancel")}</button><button type="button" class="btn" id="conok">${t(existing ? "tenders.editor.save" : "tenders.editor.create")}</button></div>`;
  }
  function row3(title2, account) {
    const amount3 = field2("conimp");
    return {
      titulo: title2,
      cuenta_id: account.id,
      expediente: textOrNull2("conexp"),
      organismo: textOrNull2("conorg"),
      publicado: field2("conpub") || null,
      limite: field2("conlim") || null,
      importe_licitacion: amount3 === "" ? null : Math.max(0, Number(amount3)),
      responsable_id: field2("conres") || null,
      nota: textOrNull2("conn")
    };
  }
  async function save8(existing, account, button2) {
    const title2 = field2("cont").trim();
    if (!title2 || !account) {
      notices.toast(t("tenders.editor.missing"), true);
      return;
    }
    button2.disabled = true;
    const table = legacyDb().from("concursos"), values = row3(title2, account);
    const result = existing ? await table.update(values).eq("id", existing.id).select("id").single() : await table.insert(values).select("id").single();
    button2.disabled = false;
    if (result.error) {
      notices.toast(writeFailure(result.error, t("tenders.editor.noPermission")), true);
      return;
    }
    notices.toast(t(existing ? "tenders.editor.saved" : "tenders.editor.created"));
    relatedLegacy.openTender(result.data?.id ?? "");
  }
  async function remove6(existing) {
    if (!await notices.confirm(t("tenders.editor.deleteText"), { titulo: t("tenders.editor.deleteTitle"), ok: t("tenders.editor.delete"), peligro: true })) return;
    const { error } = await legacyDb().from("concursos").delete().eq("id", existing.id);
    if (error) {
      notices.toast(t("tenders.editor.couldNotDelete"), true);
      return;
    }
    document.getElementById("dlg")?.close();
    notices.toast(t("tenders.editor.deleted"));
  }
  async function editTender(existing) {
    const tender = existing ?? { estado: STATES3.studying, responsable_id: salesTeam.currentUserId() };
    const people = await team();
    const body2 = document.getElementById("dbody"), box = document.getElementById("dlg");
    if (!body2 || !box) return;
    body2.innerHTML = editorHtml6(tender, existing, people);
    if (!box.open) box.showModal();
    let account = existing ? { id: existing.cuenta_id ?? "", nombre: existing.cuentas?.nombre ?? "" } : null;
    editorLegacy.pickAccount(document.getElementById("concta"), account, (picked) => {
      account = picked;
    }, t("tenders.editor.soldToPlaceholder"));
    const ok = document.getElementById("conok");
    if (ok) ok.onclick = () => {
      void save8(existing, account, ok);
    };
    const erase = document.getElementById("conborrar");
    if (erase && existing) erase.onclick = () => {
      void remove6(existing);
    };
  }

  // src/app/screens/tenders/warnings.ts
  var MAX_DAYS = 999;
  var newestFirst = (days) => [...days].sort((first, second) => second - first);
  function warningsHtml() {
    return `<div class="fh"><div><h2>${t("tenders.warnings.title")}</h2><div class="sm">${t("tenders.warnings.subtitle")}</div></div>
      <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>
    <label for="convd">${t("tenders.warnings.days")}</label><input id="convd" value="${escapeHtml(newestFirst(tendersLegacy.warningDays()).join(", "))}" placeholder="90, 30">
    <p class="sm">${t("tenders.warnings.hint")}</p>
    <div class="acts" style="justify-content:flex-end"><button class="btn sec" data-cerrar>${t("tenders.warnings.cancel")}</button><button class="btn" id="convok">${t("tenders.warnings.save")}</button></div>`;
  }
  async function save9(box) {
    const typed = document.getElementById("convd")?.value ?? "";
    const days = newestFirst([...new Set(typed.split(/[^0-9]+/).map(Number).filter((day) => day > 0 && day <= MAX_DAYS))]);
    const { data: result, error } = await legacyDb().rpc("guardar_ajuste", { p_clave: "avisos_vencimiento", p_valor: { dias: days } });
    if (error || result?.ok === false) {
      notices.toast(t("tenders.warnings.couldNotSave"), true);
      return;
    }
    tendersLegacy.setWarningDays(days);
    box.close();
    notices.toast(t("tenders.warnings.saved"));
  }
  function editWarnings() {
    const body2 = document.getElementById("dbody"), box = document.getElementById("dlg");
    if (!body2 || !box) return;
    body2.innerHTML = warningsHtml();
    if (!box.open) box.showModal();
    const ok = document.getElementById("convok");
    if (ok) ok.onclick = () => {
      void save9(box);
    };
  }

  // src/app/screens/tenders/list.ts
  var LIMIT4 = 300;
  var URGENT_DAYS = 7;
  var NO_DATE = "9999";
  var byDate = (date) => (first, second) => orFallback(date(first), NO_DATE).localeCompare(orFallback(date(second), NO_DATE));
  function shown3(list, view) {
    if (view === "contratos") return list.filter((item) => item.estado === STATES3.awarded).sort(byDate(contractEnd));
    if (view === "cerrados") return list.filter((item) => isClosed(item.estado));
    return list.filter((item) => item.estado === STATES3.studying || item.estado === STATES3.offerSent).sort(byDate((item) => item.limite));
  }
  function contractPill(tender, warnDays) {
    const left = daysLeft(tender);
    if (left === null) return `<span class="pill p-warn">${t("tenders.list.noEndDate")}</span>`;
    if (left < 0) return `<span class="pill p-anu">${t("tenders.list.expired")}</span>`;
    const text2 = left === 0 ? t("tenders.list.expiresToday") : left === 1 ? t("tenders.list.expiresInOneDay") : t("tenders.list.expiresInDays", { count: formatNumber(left) });
    return `<span class="pill ${left <= warnDays ? "p-urg" : "p-est"}">${text2}</span>`;
  }
  function deadlinePill(tender) {
    if (!tender.limite) return "";
    const today = todayIso(), studying = tender.estado === STATES3.studying;
    const kind = studying && tender.limite < today ? "p-anu" : studying && tender.limite <= addDays(today, URGENT_DAYS) ? "p-urg" : "p-per";
    return `<span class="pill ${kind}">${t("tenders.list.submitBy", { date: formatShortDate(tender.limite) })}</span>`;
  }
  function lotsText(tender) {
    const lots = tender.concurso_lotes ?? [], won = lots.filter((lot) => lot.estado === LOT_STATES.won).length;
    if (!lots.length) return "";
    const wonText = won ? won === 1 ? t("tenders.list.oneWon") : t("tenders.list.won", { count: won }) : "";
    return ` · ${lots.length === 1 ? t("tenders.list.oneLot") : t("tenders.list.lots", { count: lots.length })}${wonText}`;
  }
  function rowHtml11(tender, view, warnDays) {
    const extra = view === "contratos" ? contractPill(tender, warnDays) : view === "marcha" ? deadlinePill(tender) : "";
    return `<button type="button" class="item conrow" data-con="${tender.id}"><span class="tx"><b>${escapeHtml(tender.titulo)}</b>
      <span class="sm">${escapeHtml(tenderLine(tender))}${lotsText(tender)}${tender.importe_licitacion ? ` · ${formatCurrency(tender.importe_licitacion)}` : ""}</span></span>
      <span class="cirest">${statePill2(tender.estado)}${extra}</span></button>`;
  }
  function contractsHint(days) {
    const when = days.length ? t("tenders.list.warnDays", { days: [...days].sort((first, second) => second - first).join(t("tenders.list.and")) }) : t("tenders.list.warnNever");
    return `<p class="sm">${t("tenders.list.contractsHint", { when })}</p>`;
  }
  function pageHtml7(list, view) {
    const days = tendersLegacy.warningDays(), warnDays = Math.max(...days, 0);
    const empty2 = t(view === "contratos" ? "tenders.list.noContracts" : view === "cerrados" ? "tenders.list.noClosed" : "tenders.list.noOpen");
    return `<div class="cirpag"><div class="evcab"><button type="button" class="btn" id="connuevo">${t("tenders.list.newTender")}</button>
      ${cardSectionsLegacy.can("administrar") ? `<button type="button" class="btn sec" id="conavisos">${t("tenders.list.warnings")}</button>` : ""}</div>
    ${view === "contratos" ? contractsHint(days) : ""}
    <section class="card cirbloque">${list.length ? `<div class="lista">${list.map((item) => rowHtml11(item, view, warnDays)).join("")}</div>` : `<div class="vacio vlinea">${empty2}</div>`}</section></div>`;
  }
  async function paintTenders(view) {
    if (!document.getElementById("cfgcuerpo")) return;
    const [{ data, error }, { data: setting }] = await Promise.all([
      legacyDb().from("concursos").select("id,titulo,expediente,organismo,estado,limite,inicio,fin,prorroga_hasta,importe_licitacion,cuenta_id,cuentas(nombre),concurso_lotes(estado)").order("creado_en", { ascending: false }).limit(LIMIT4),
      legacyDb().from("ajustes").select("valor").eq("clave", "avisos_vencimiento").maybeSingle()
    ]);
    const box = document.getElementById("cfgcuerpo");
    if (!box || currentScreen() !== "concursos") return;
    if (error) {
      box.innerHTML = `<div class="vacio">${t("tenders.list.couldNotLoad")}</div>`;
      return;
    }
    const days = setting?.valor?.dias;
    if (Array.isArray(days)) tendersLegacy.setWarningDays(days.map(Number).filter((day) => day > 0));
    box.innerHTML = pageHtml7(shown3(data ?? [], view), view);
    const add2 = document.getElementById("connuevo");
    if (add2) add2.onclick = () => {
      void editTender(null);
    };
    const warnings = document.getElementById("conavisos");
    if (warnings) warnings.onclick = () => {
      editWarnings();
    };
    box.querySelectorAll("[data-con]").forEach((button2) => {
      button2.onclick = () => {
        relatedLegacy.openTender(button2.dataset.con ?? "");
      };
    });
  }

  // src/app/screens/tenders/lots.ts
  var DISCONTINUED = "Descatalogado";
  var amount2 = (value10) => isPresent(value10) ? String(Number(value10)) : "";
  function priceHtml(price, products2) {
    const name = orFallback(products2.find((product) => product.id === price.producto_id)?.nombre, t("tenders.lot.product"));
    return `<div class="conpf" data-cp="${price.id}"><span>${escapeHtml(name)}</span>
          <label><span class="sm">${t("tenders.lot.price")}</span><input type="number" min="0" step="0.01" data-cpf="precio" value="${Number(price.precio)}"></label>
          <label><span class="sm">${t("tenders.lot.units")}</span><input type="number" min="0" step="1" data-cpf="unidades" value="${isPresent(price.unidades) ? price.unidades : ""}"></label>
          <button type="button" class="x" data-cpq aria-label="${t("tenders.lot.removeProduct")}">✕</button></div>`;
  }
  function addProductHtml(lot, products2) {
    const prices = lot.concurso_precios ?? [];
    const options = products2.filter((product) => orFallback(product.estado, "Activo") !== DISCONTINUED && !prices.some((price) => price.producto_id === product.id)).map((product) => `<option value="${product.id}">${escapeHtml(product.nombre)}</option>`).join("");
    return `<div class="conpadd"><select data-cpnuevo aria-label="${t("tenders.lot.addProduct")}"><option value="">${t("tenders.lot.addProductOption")}</option>${options}</select></div>`;
  }
  function lotHtml(lot, products2) {
    const states = LOT_STATE_LIST.map((state) => `<option ${state === lot.estado ? "selected" : ""}>${state}</option>`).join("");
    return `<div class="conlote" data-lote="${lot.id}">
      <div class="conlcab"><input data-lf="numero" value="${escapeHtml(lot.numero ?? "")}" placeholder="${t("tenders.lot.number")}" aria-label="${t("tenders.lot.numberLabel")}" class="conln">
        <input data-lf="descripcion" value="${escapeHtml(lot.descripcion ?? "")}" placeholder="${t("tenders.lot.description")}" aria-label="${t("tenders.lot.description")}">
        <select data-lf="estado" aria-label="${t("tenders.lot.stateLabel")}">${states}</select>
        <button type="button" class="x" data-lq aria-label="${t("tenders.lot.remove")}">✕</button></div>
      <div class="conlimp"><label><span>${t("tenders.lot.tenderAmount")}</span><input type="number" min="0" step="0.01" data-lf="importe_licitacion" value="${amount2(lot.importe_licitacion)}"></label>
        <label><span>${t("tenders.lot.awardedAmount")}</span><input type="number" min="0" step="0.01" data-lf="importe_adjudicado" value="${amount2(lot.importe_adjudicado)}"></label>
        <label class="${lot.estado === LOT_STATES.lost ? "" : "hide"}" data-ladj><span>${t("tenders.lot.winner")}</span><input data-lf="adjudicatario" value="${escapeHtml(lot.adjudicatario ?? "")}" placeholder="${t("tenders.lot.winnerPlaceholder")}"></label></div>
      <div class="conprecios">${(lot.concurso_precios ?? []).map((price) => priceHtml(price, products2)).join("")}
        ${addProductHtml(lot, products2)}</div></div>`;
  }
  function lotValue(input3) {
    if (input3.dataset.lf === "estado") return input3.value;
    if (input3.type === "number") return input3.value === "" ? null : Math.max(0, Number(input3.value));
    return input3.value.trim() || null;
  }
  async function removeLot(lotId, context) {
    if (!await notices.confirm(t("tenders.lot.removeText"), { titulo: t("tenders.lot.removeTitle"), ok: t("tenders.lot.removeOk"), peligro: true })) return;
    const { error } = await legacyDb().from("concurso_lotes").delete().eq("id", lotId);
    if (error) {
      context.fail(error);
      return;
    }
    context.reopen();
  }
  async function addProduct(lotId, productId, context) {
    if (!productId) return;
    const product = context.products.find((item) => item.id === productId);
    const { error } = await legacyDb().from("concurso_precios").insert({ lote_id: lotId, producto_id: productId, precio: isPresent(product?.precio) ? Number(product.precio) : 0 });
    if (error) {
      context.fail(error);
      return;
    }
    context.reopen();
  }
  async function savePrice(row4, input3, context) {
    const key = input3.dataset.cpf ?? "";
    const value10 = input3.value === "" ? null : Math.max(0, key === "unidades" ? Math.floor(Number(input3.value)) : Number(input3.value));
    if (key === "precio" && value10 === null) {
      notices.toast(t("tenders.lot.writePrice"), true);
      return;
    }
    const { error } = await legacyDb().from("concurso_precios").update({ [key]: value10 }).eq("id", row4.dataset.cp);
    if (error) context.fail(error);
  }
  async function removePrice(row4, context) {
    const { error } = await legacyDb().from("concurso_precios").delete().eq("id", row4.dataset.cp);
    if (error) {
      context.fail(error);
      return;
    }
    context.reopen();
  }
  function bindPrices(box, context) {
    box.querySelectorAll("[data-cp]").forEach((row4) => {
      row4.querySelectorAll("[data-cpf]").forEach((input3) => {
        input3.onchange = () => {
          void savePrice(row4, input3, context);
        };
      });
      const remove7 = row4.querySelector("[data-cpq]");
      if (remove7) remove7.onclick = () => {
        void removePrice(row4, context);
      };
    });
  }
  async function saveLotField(lotId, input3, context) {
    const key = input3.dataset.lf ?? "";
    const { error } = await legacyDb().from("concurso_lotes").update({ [key]: lotValue(input3) }).eq("id", lotId);
    if (error) {
      context.fail(error);
      return;
    }
    if (key === "estado") context.reopen();
  }
  function bindLots(list, context) {
    list.querySelectorAll("[data-lote]").forEach((box) => {
      const lotId = box.dataset.lote ?? "";
      box.querySelectorAll("[data-lf]").forEach((input3) => {
        input3.onchange = () => {
          void saveLotField(lotId, input3, context);
        };
      });
      const remove7 = box.querySelector("[data-lq]");
      if (remove7) remove7.onclick = () => {
        void removeLot(lotId, context);
      };
      const add2 = box.querySelector("[data-cpnuevo]");
      if (add2) add2.onchange = () => {
        void addProduct(lotId, add2.value, context);
      };
      bindPrices(box, context);
    });
  }

  // src/app/screens/tenders/sheet.ts
  var DETAIL = "*,cuentas(nombre),concurso_lotes(id,numero,descripcion,importe_licitacion,estado,adjudicatario,importe_adjudicado,creado_en,concurso_precios(id,producto_id,precio,unidades))";
  var CONTRACT_DATES = [["conini", "inicio"], ["confin", "fin"], ["conpro", "prorroga_hasta"]];
  var sortedLots = (tender) => [...tender.concurso_lotes ?? []].sort((first, second) => String(first.numero ?? "").localeCompare(String(second.numero ?? ""), "es", { numeric: true }) || String(first.creado_en).localeCompare(String(second.creado_en)));
  function dataHtml2(tender) {
    const states = TENDER_STATES.map((state) => `<option ${state === tender.estado ? "selected" : ""}>${state}</option>`).join("");
    return `<div class="cirdat"><span>${t("tenders.sheet.state")}</span><b><select id="conest" aria-label="${t("tenders.sheet.stateLabel")}">${states}</select></b>
      ${tender.limite ? `<span>${t("tenders.sheet.submitBy")}</span><b>${escapeHtml(formatLongDate(tender.limite))}</b>` : ""}
      ${tender.importe_licitacion ? `<span>${t("tenders.sheet.amount")}</span><b>${t("tenders.sheet.withoutVat", { amount: formatCurrency(tender.importe_licitacion) })}</b>` : ""}</div>
    <div class="cong3 ${tender.estado === STATES3.awarded ? "" : "hide"}" id="confechas"><div><label for="conini">${t("tenders.sheet.contractFrom")}</label><input id="conini" type="date" value="${escapeHtml(tender.inicio ?? "")}"></div>
      <div><label for="confin">${t("tenders.sheet.contractTo")}</label><input id="confin" type="date" value="${escapeHtml(tender.fin ?? "")}"></div>
      <div><label for="conpro">${t("tenders.sheet.extendedTo")}</label><input id="conpro" type="date" value="${escapeHtml(tender.prorroga_hasta ?? "")}"></div></div>`;
  }
  function leftText(left) {
    if (left === null) return "";
    if (left < 0) return t("tenders.sheet.alreadyExpired");
    return left === 1 ? t("tenders.sheet.oneMoreDay") : t("tenders.sheet.moreDays", { count: formatNumber(left) });
  }
  function awardedHtml(tender, lots) {
    if (tender.estado !== STATES3.awarded) return "";
    if (!lots.some((lot) => lot.estado === LOT_STATES.won)) return `<div class="banda-aviso conok">${t("tenders.sheet.markWon")}</div>`;
    const account = escapeHtml(orFallback(tender.cuentas?.nombre, t("tenders.sheet.thisAccount")));
    return `<div class="banda-ok conok">${t("tenders.sheet.pricesApplied", { account, left: leftText(daysLeft(tender)) })}</div>`;
  }
  function sheetHtml4(tender, lots, products2) {
    return `<div class="fh"><div><h2>${escapeHtml(tender.titulo)}</h2><div class="sm">${escapeHtml(tenderLine(tender))}</div></div>
      <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>
    ${dataHtml2(tender)}
    ${awardedHtml(tender, lots)}
    <div class="evascab"><h3>${t("tenders.sheet.lots", { count: lots.length })}</h3><button type="button" class="btn sec" id="conlmas">${t("tenders.sheet.addLot")}</button></div>
    <div id="conlotes">${lots.length ? lots.map((lot) => lotHtml(lot, products2)).join("") : `<div class="vacio vlinea">${t("tenders.sheet.noLots")}</div>`}</div>
    ${tender.nota ? `<p class="sm">${escapeHtml(tender.nota)}</p>` : ""}
    <div class="acts" style="justify-content:flex-end"><button type="button" class="btn sec" id="coneditar">${t("tenders.sheet.change")}</button><button type="button" class="btn" data-cerrar>${t("tenders.sheet.done")}</button></div>`;
  }
  var fail = (error) => {
    notices.toast(writeFailure(error, t("tenders.sheet.noPermission")), true);
  };
  function bindDates(id) {
    CONTRACT_DATES.forEach(([elementId, column]) => {
      const input3 = document.getElementById(elementId);
      if (!input3) return;
      input3.onchange = async () => {
        const { error } = await legacyDb().from("concursos").update({ [column]: input3.value || null }).eq("id", id);
        if (error) {
          fail(error);
          return;
        }
        notices.toast(t("tenders.sheet.datesSaved"));
      };
    });
  }
  function bind12(tender, lots, context) {
    const id = tender.id;
    const change = document.getElementById("coneditar");
    if (change) change.onclick = () => {
      void editTender(tender);
    };
    const state = document.getElementById("conest");
    if (state) state.onchange = async () => {
      const { error } = await legacyDb().from("concursos").update({ estado: state.value }).eq("id", id);
      if (error) {
        fail(error);
        state.value = tender.estado;
        return;
      }
      context.reopen();
    };
    bindDates(id);
    const addLot = document.getElementById("conlmas");
    if (addLot) addLot.onclick = async () => {
      const { error } = await legacyDb().from("concurso_lotes").insert({ concurso_id: id, numero: String(lots.length + 1) });
      if (error) {
        fail(error);
        return;
      }
      context.reopen();
    };
    const list = document.getElementById("conlotes");
    if (list) bindLots(list, context);
  }
  async function showTender(id) {
    const { data: tender, error } = await legacyDb().from("concursos").select(DETAIL).eq("id", id).maybeSingle();
    if (error || !tender) {
      notices.toast(t("tenders.sheet.notFound"), true);
      return;
    }
    const products2 = await portalLegacy.products(), lots = sortedLots(tender);
    const body2 = document.getElementById("dbody"), box = document.getElementById("dlg");
    if (!body2 || !box) return;
    body2.innerHTML = sheetHtml4(tender, lots, products2);
    if (!box.open) box.showModal();
    bind12(tender, lots, { tenderId: id, products: products2, reopen: () => {
      void showTender(id);
    }, fail });
  }

  // src/app/screens/equipment/index.ts
  var equipment_exports = {};
  __export(equipment_exports, {
    editEquipment: () => editEquipment,
    expiryPill: () => expiryPill,
    paintEquipment: () => paintEquipment,
    reviewPill: () => reviewPill,
    showEquipment: () => showEquipment
  });

  // src/app/screens/equipment/editor.ts
  var MAX_REVIEW_MONTHS = 120;
  var field3 = (id) => document.getElementById(id);
  var value8 = (id) => field3(id)?.value ?? "";
  var trimmedOrNull = (id) => value8(id).trim() || null;
  async function products() {
    const { data } = await legacyDb().from("productos").select("id,nombre,es_equipo,revision_meses").order("nombre");
    return (data ?? []).sort((first, second) => Number(second.es_equipo) - Number(first.es_equipo) || String(first.nombre).localeCompare(String(second.nombre)));
  }
  function productOptions(list, chosen2) {
    return list.map((product) => `<option value="${product.id}" data-rm="${product.revision_meses ?? 0}" ${product.id === chosen2 ? "selected" : ""}>${escapeHtml(product.nombre)}${product.es_equipo ? "" : t("equipment.editor.notMarked")}</option>`).join("");
  }
  function editorHtml7(item, existing, list) {
    const contracts = equipmentLegacy.contracts().map((kind) => `<option ${kind === item.contrato ? "selected" : ""}>${kind}</option>`).join("");
    return `<div class="fh"><div><h2>${t(existing ? "equipment.editor.changeTitle" : "equipment.editor.newTitle")}</h2><div class="sm">${t("equipment.editor.subtitle")}</div></div>
      <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>
    <label>${t("equipment.editor.where")}</label><div id="eqcta"></div>
    <div class="g2"><div><label for="eqp">${t("equipment.editor.equipment")}</label><select id="eqp">${productOptions(list, item.producto_id)}</select></div>
      <div><label for="eqs">${t("equipment.editor.serial")}</label><input id="eqs" value="${escapeHtml(item.serie ?? "")}" maxlength="120"></div></div>
    <div class="g2"><div><label for="equ">${t("equipment.editor.location")}</label><input id="equ" value="${escapeHtml(item.ubicacion ?? "")}" placeholder="${t("equipment.editor.locationPlaceholder")}"></div>
      <div><label for="eqi">${t("equipment.editor.installedOn")}</label><input id="eqi" type="date" value="${escapeHtml(item.instalado ?? "")}"></div></div>
    <div class="g2"><div><label for="eqc">${t("equipment.editor.contract")}</label><select id="eqc">${contracts}</select></div>
      <div id="eqcfw"><label for="eqcf">${t("equipment.editor.contractEnd")}</label><input id="eqcf" type="date" value="${escapeHtml(item.contrato_fin ?? "")}"></div></div>
    <div class="g2"><div><label for="eqg">${t("equipment.editor.warrantyUntil")}</label><input id="eqg" type="date" value="${escapeHtml(item.garantia_hasta ?? "")}"></div>
      <div><label for="eqr">${t("equipment.editor.reviewEvery")}</label><input id="eqr" type="number" min="0" max="${MAX_REVIEW_MONTHS}" step="1" value="${Number(item.revision_meses) || 0}"></div></div>
    <label for="eqn">${t("equipment.editor.note")}</label><textarea id="eqn" rows="2">${escapeHtml(item.nota ?? "")}</textarea>
    <div class="acts" style="justify-content:flex-end">${existing?.estado === STATES.installed ? `<button type="button" class="btn sec peligro" id="eqretirar">${t("equipment.editor.retire")}</button>` : ""}
      <button type="button" class="btn sec" data-cerrar>${t("equipment.editor.cancel")}</button><button type="button" class="btn" id="eqok">${t(existing ? "equipment.editor.save" : "equipment.editor.create")}</button></div>`;
  }
  function rowOf(account) {
    const contract = value8("eqc");
    return {
      cuenta_id: account.id,
      producto_id: value8("eqp"),
      serie: trimmedOrNull("eqs"),
      ubicacion: trimmedOrNull("equ"),
      instalado: value8("eqi") || todayIso(),
      contrato: contract,
      contrato_fin: contract === SALE ? null : value8("eqcf") || null,
      garantia_hasta: value8("eqg") || null,
      revision_meses: Math.min(MAX_REVIEW_MONTHS, Math.max(0, Math.floor(Number(value8("eqr")) || 0))),
      nota: trimmedOrNull("eqn")
    };
  }
  async function save10(existing, account, button2) {
    if (!account || !value8("eqp")) {
      notices.toast(t("equipment.editor.missing"), true);
      return;
    }
    const row4 = rowOf(account), table = legacyDb().from("equipos");
    button2.disabled = true;
    const result = existing ? await table.update(row4).eq("id", existing.id).select("id").single() : await table.insert(row4).select("id").single();
    button2.disabled = false;
    if (result.error) {
      notices.toast(failureText(result.error), true);
      return;
    }
    notices.toast(t(existing ? "equipment.editor.saved" : "equipment.editor.created"));
    appLegacy.forgetCache();
    relatedLegacy.openEquipment(result.data?.id ?? "");
  }
  async function retire(existing) {
    if (!await notices.confirm(t("equipment.editor.retireText"), { titulo: t("equipment.editor.retireTitle"), ok: t("equipment.editor.retire"), peligro: true })) return;
    const { error } = await legacyDb().from("equipos").update({ estado: STATES.retired }).eq("id", existing.id);
    if (error) {
      notices.toast(failureText(error), true);
      return;
    }
    notices.toast(t("equipment.editor.retired"));
    relatedLegacy.openEquipment(existing.id);
  }
  function bind13(existing, chosen2) {
    editorLegacy.pickAccount(field3("eqcta"), chosen2.account, (account) => {
      chosen2.account = account;
    }, t("equipment.editor.wherePlaceholder"));
    const contract = document.getElementById("eqc"), product = document.getElementById("eqp");
    const showEnd = () => {
      field3("eqcfw")?.classList.toggle("hide", contract?.value === SALE);
    };
    showEnd();
    if (contract) contract.onchange = showEnd;
    if (product) product.onchange = () => {
      const months2 = field3("eqr");
      if (!existing && months2) months2.value = product.selectedOptions[0]?.dataset.rm ?? "0";
    };
    const ok = document.getElementById("eqok");
    if (ok) ok.onclick = () => {
      void save10(existing, chosen2.account, ok);
    };
    const retireButton = field3("eqretirar");
    if (retireButton && existing) retireButton.onclick = () => {
      void retire(existing);
    };
  }
  function newItem(list) {
    const first = list.find((product) => product.es_equipo);
    return { instalado: todayIso(), contrato: SALE, ...first ? { producto_id: first.id } : {}, revision_meses: first?.revision_meses ?? 0 };
  }
  async function editEquipment(existing, account) {
    await equipmentLegacy.loadProducts();
    const list = await products(), item = existing ?? newItem(list);
    const body2 = document.getElementById("dbody"), box = document.getElementById("dlg");
    if (!body2 || !box) return;
    body2.innerHTML = editorHtml7(item, existing, list);
    if (!box.open) box.showModal();
    bind13(existing, { account: existing ? { id: existing.cuenta_id ?? "", nombre: existing.cuentas?.nombre ?? "" } : account ?? null });
  }

  // src/app/screens/equipment/list.ts
  var LIMIT5 = 500;
  var SOON_DAYS2 = 30;
  var SEARCH_WAIT_MS4 = 300;
  var listState = { query: "" };
  var plain = (text2) => String(text2 ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  function rowHtml12(item) {
    const details2 = [item.serie ? t("equipment.list.serial", { serial: item.serie }) : "", item.cuentas?.nombre, item.ubicacion, item.contrato].filter(Boolean).join(" · ");
    return `<button type="button" class="item conrow" data-eq="${item.id}"><span class="tx"><b>${escapeHtml(orFallback(item.productos?.nombre, t("equipment.equipment")))}</b>
      <span class="sm">${escapeHtml(details2)}${t("equipment.list.since", { date: formatShortDate(item.instalado ?? "") })}</span></span>
    <span class="cirest">${reviewPill(item)}${expiryPill(item)}</span></button>`;
  }
  var block2 = (title2, list) => `<section class="card cirbloque"><h2>${title2}</h2>${list.length ? `<div class="lista">${list.map(rowHtml12).join("")}</div>` : '<div class="vacio vlinea"></div>'}</section>`;
  function upcoming(list) {
    const installed = list.filter((item) => item.estado === STATES.installed), limit = addDays(todayIso(), SOON_DAYS2), warning = warningLimit();
    const reviews = installed.filter((item) => item.proxima_revision && item.proxima_revision <= limit).sort((first, second) => String(first.proxima_revision).localeCompare(String(second.proxima_revision)));
    const expiring = installed.filter((item) => {
      const days = daysUntil(expiryOf(item));
      return days !== null && days <= warning;
    }).sort((first, second) => String(expiryOf(first)).localeCompare(String(expiryOf(second))));
    return { reviews, expiring };
  }
  function pageHtml8(list) {
    const { reviews, expiring } = upcoming(list), query = plain(listState.query);
    const found = list.filter((item) => !listState.query || plain([item.serie, item.productos?.nombre, item.cuentas?.nombre, item.ubicacion].join(" ")).includes(query));
    const empty2 = list.length ? t("equipment.list.noneFound") : t("equipment.list.noneYet");
    return `<div class="cirpag"><div class="evcab"><button type="button" class="btn" id="eqnuevo">${t("equipment.list.newEquipment")}</button></div>
    ${reviews.length ? block2(t("equipment.list.reviewsSoon"), reviews) : ""}
    ${expiring.length ? block2(t("equipment.list.expiring"), expiring) : ""}
    <section class="card cirbloque"><div class="cicbcab"><h2>${t("equipment.list.all", { count: formatNumber(list.length) })}</h2><input id="eqq" type="search" placeholder="${t("equipment.list.searchPlaceholder")}" value="${escapeHtml(listState.query)}" aria-label="${t("equipment.list.searchLabel")}"></div>
      ${found.length ? `<div class="lista">${found.map(rowHtml12).join("")}</div>` : `<div class="vacio vlinea">${empty2}</div>`}</section></div>`;
  }
  var searchTimer4;
  function bind14(box, wasSearching) {
    const add2 = document.getElementById("eqnuevo");
    if (add2) add2.onclick = () => {
      void editEquipment(null);
    };
    const search3 = document.getElementById("eqq");
    if (search3) {
      search3.oninput = () => {
        clearTimeout(searchTimer4);
        searchTimer4 = setTimeout(() => {
          listState.query = search3.value.trim();
          void paintEquipment();
        }, SEARCH_WAIT_MS4);
      };
      if (wasSearching) {
        search3.focus();
        search3.setSelectionRange(search3.value.length, search3.value.length);
      }
    }
    box.querySelectorAll("[data-eq]").forEach((button2) => {
      button2.onclick = () => {
        relatedLegacy.openEquipment(button2.dataset.eq ?? "");
      };
    });
  }
  function rememberWarningDays(setting) {
    const days = setting?.valor?.dias;
    if (Array.isArray(days)) equipmentLegacy.setWarningDays(days.map(Number).filter((day) => day > 0));
  }
  async function paintEquipment() {
    if (!document.getElementById("cfgcuerpo")) return;
    const [{ data, error }, { data: setting }] = await Promise.all([
      legacyDb().from("equipos").select("id,serie,ubicacion,instalado,contrato,contrato_fin,garantia_hasta,proxima_revision,estado,cuenta_id,cuentas(nombre),productos(nombre)").order("creado_en", { ascending: false }).limit(LIMIT5),
      legacyDb().from("ajustes").select("valor").eq("clave", "avisos_vencimiento").maybeSingle()
    ]);
    const box = document.getElementById("cfgcuerpo");
    if (!box || currentScreen() !== "parque") return;
    if (error) {
      box.innerHTML = `<div class="vacio">${t("equipment.list.couldNotLoad")}</div>`;
      return;
    }
    rememberWarningDays(setting);
    const search3 = document.getElementById("eqq"), wasSearching = Boolean(search3) && document.activeElement === search3;
    box.innerHTML = pageHtml8(data ?? []);
    bind14(box, wasSearching);
  }

  // src/app/screens/equipment/sheet.ts
  var REVIEWS_SHOWN = 50;
  function reviewsText(months2) {
    if (!months2) return t("equipment.sheet.noReviews");
    return months2 === 1 ? t("equipment.sheet.everyMonth") : t("equipment.sheet.everyMonths", { count: months2 });
  }
  function dataHtml3(item) {
    const account = escapeHtml(orFallback(item.cuentas?.nombre, "")), installed = item.estado === STATES.installed;
    const contractEnd2 = item.contrato !== SALE && item.contrato_fin ? t("equipment.sheet.until", { date: formatShortDate(item.contrato_fin) }) : "";
    const plain2 = installed && !item.proxima_revision && !expiryOf(item) ? `<span class="pill p-est">${t("equipment.pills.installed")}</span>` : "";
    return `<div class="cirdat"><span>${t("equipment.sheet.where")}</span><b><button type="button" class="lnk" data-cfi="${item.cuenta_id ?? ""}">${account}</button>${item.ubicacion ? ` · ${escapeHtml(item.ubicacion)}` : ""}</b>
      <span>${t("equipment.sheet.installed")}</span><b>${escapeHtml(formatLongDate(item.instalado ?? ""))}</b>
      <span>${t("equipment.sheet.contract")}</span><b>${escapeHtml(item.contrato ?? "")}${contractEnd2}</b>
      ${item.garantia_hasta ? `<span>${t("equipment.sheet.warranty")}</span><b>${t("equipment.sheet.warrantyUntil", { date: formatShortDate(item.garantia_hasta) })}</b>` : ""}
      <span>${t("equipment.sheet.reviews")}</span><b>${reviewsText(item.revision_meses)}</b>
      <span>${t("equipment.sheet.state")}</span><b>${reviewPill(item)} ${expiryPill(item)}${plain2}</b></div>`;
  }
  function reviewsHtml(reviews) {
    if (!reviews.length) return `<div class="vacio vlinea">${t("equipment.sheet.noReviewsYet")}</div>`;
    return `<div class="lista">${reviews.map((review) => `<div class="fmrow"><span><b>${formatShortDate(review.fecha)}</b> · ${escapeHtml(review.tipo)}${review.nota ? `<span class="sm"> · ${escapeHtml(review.nota)}</span>` : ""}</span><button type="button" class="x" data-rvq="${review.id}" aria-label="${t("equipment.sheet.deleteReviewLabel")}">✕</button></div>`).join("")}</div>`;
  }
  function sheetHtml5(item, reviews) {
    const installed = item.estado === STATES.installed;
    return `<div class="fh"><div><h2>${escapeHtml(orFallback(item.productos?.nombre, t("equipment.equipment")))}</h2><div class="sm">${item.serie ? t("equipment.sheet.serial", { serial: escapeHtml(item.serie) }) : ""}${escapeHtml(orFallback(item.cuentas?.nombre, ""))}</div></div>
      <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>
    ${dataHtml3(item)}
    ${item.nota ? `<p class="sm">${escapeHtml(item.nota)}</p>` : ""}
    <div class="evascab"><h3>${t("equipment.sheet.reviewsTitle", { count: reviews.length })}</h3>${installed ? `<button type="button" class="btn sec" id="eqrevmas">${t("equipment.sheet.addReview")}</button>` : ""}</div>
    <div id="eqrevf"></div>
    ${reviewsHtml(reviews)}
    <div class="acts" style="justify-content:flex-end">${installed && item.revision_meses ? `<button type="button" class="btn sec" id="eqagenda">${t("equipment.sheet.schedule")}</button>` : ""}
      <button type="button" class="btn sec" id="eqeditar">${t("equipment.sheet.change")}</button><button type="button" class="btn" data-cerrar>${t("equipment.sheet.done")}</button></div>`;
  }
  var reviewFormHtml = () => `<div class="depbox"><div class="cong3"><div><label for="eqrf">${t("equipment.sheet.date")}</label><input id="eqrf" type="date" value="${todayIso()}"></div>
        <div><label for="eqrt">${t("equipment.sheet.type")}</label><select id="eqrt">${REVIEW_TYPES.map((kind) => `<option>${kind}</option>`).join("")}</select></div>
        <div><label for="eqrn">${t("equipment.sheet.note")}</label><input id="eqrn" maxlength="300" placeholder="${t("equipment.sheet.notePlaceholder")}"></div></div>
      <div class="acts" style="justify-content:flex-end"><button type="button" class="btn sec" id="eqrcanc">${t("equipment.sheet.cancel")}</button><button type="button" class="btn" id="eqrok">${t("equipment.sheet.record")}</button></div></div>`;
  var inputValue2 = (id) => document.getElementById(id)?.value ?? "";
  async function recordReview(id, button2) {
    button2.disabled = true;
    const { error } = await legacyDb().from("equipo_revisiones").insert({ equipo_id: id, fecha: inputValue2("eqrf") || todayIso(), tipo: inputValue2("eqrt"), nota: inputValue2("eqrn").trim() || null });
    button2.disabled = false;
    if (error) {
      notices.toast(failureText(error), true);
      return;
    }
    notices.toast(t("equipment.sheet.reviewRecorded"));
    relatedLegacy.openEquipment(id);
  }
  function openReviewForm(id) {
    const place = document.getElementById("eqrevf");
    if (!place) return;
    place.innerHTML = reviewFormHtml();
    const cancel2 = document.getElementById("eqrcanc");
    if (cancel2) cancel2.onclick = () => {
      place.innerHTML = "";
    };
    const ok = document.getElementById("eqrok");
    if (ok) ok.onclick = () => {
      void recordReview(id, ok);
    };
  }
  async function deleteReview(id, reviewId) {
    if (!await notices.confirm(t("equipment.sheet.deleteReviewText"), { titulo: t("equipment.sheet.deleteReviewTitle"), ok: t("equipment.sheet.delete"), peligro: true })) return;
    const { error } = await legacyDb().from("equipo_revisiones").delete().eq("id", reviewId);
    if (error) {
      notices.toast(failureText(error), true);
      return;
    }
    relatedLegacy.openEquipment(id);
  }
  function bind15(id, item) {
    const body2 = document.getElementById("dbody");
    if (!body2) return;
    const on2 = (elementId, action) => {
      const button2 = document.getElementById(elementId);
      if (button2) button2.onclick = action;
    };
    body2.querySelectorAll("[data-cfi]").forEach((button2) => {
      button2.onclick = () => {
        document.getElementById("dlg")?.close();
        agendaActions.openAccount(button2.dataset.cfi ?? "");
      };
    });
    on2("eqeditar", () => {
      void editEquipment(item);
    });
    on2("eqagenda", () => {
      const today = todayIso(), next = item.proxima_revision;
      agendaActions.newAppointment(item.cuenta_id ?? "", next && next > today ? next : today);
    });
    on2("eqrevmas", () => {
      openReviewForm(id);
    });
    body2.querySelectorAll("[data-rvq]").forEach((button2) => {
      button2.onclick = () => {
        void deleteReview(id, button2.dataset.rvq ?? "");
      };
    });
  }
  async function showEquipment(id) {
    const [{ data: item, error }, { data: reviews }] = await Promise.all([
      legacyDb().from("equipos").select("*,cuentas(nombre),productos(nombre)").eq("id", id).maybeSingle(),
      legacyDb().from("equipo_revisiones").select("id,fecha,tipo,nota,hecha_por").eq("equipo_id", id).order("fecha", { ascending: false }).limit(REVIEWS_SHOWN)
    ]);
    if (error || !item) {
      notices.toast(t("equipment.sheet.notFound"), true);
      return;
    }
    const body2 = document.getElementById("dbody"), box = document.getElementById("dlg");
    if (!body2 || !box) return;
    body2.innerHTML = sheetHtml5(item, reviews ?? []);
    if (!box.open) box.showModal();
    bind15(id, item);
  }

  // src/app/screens/surgeries/index.ts
  var surgeries_exports = {};
  __export(surgeries_exports, {
    editSurgery: () => editSurgery,
    paintSurgeries: () => paintSurgeries,
    showSurgery: () => showSurgery
  });

  // src/app/screens/surgeries/editor.ts
  var value9 = (id) => document.getElementById(id)?.value ?? "";
  async function team2() {
    if (!salesTeam.members().length) await salesTeam.load().catch(() => void 0);
    const me = salesTeam.currentUserId(), members = salesTeam.members();
    return members.some((member) => member.id === me) ? members : [{ id: me, nombre: appLegacy.currentUserName() }, ...members];
  }
  function editorHtml8(surgery, existing, people) {
    const origins = ORIGINS.map((origin) => `<button type="button" data-o="${origin}" class="${origin === surgery.origen ? "on" : ""}" aria-pressed="${String(origin === surgery.origen)}">${originLabel(origin)}</button>`).join("");
    return `<div class="fh"><div><h2>${t(existing ? "surgeries.editor.changeTitle" : "surgeries.editor.newTitle")}</h2><div class="sm">${t("surgeries.editor.subtitle")}</div></div>
      <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>
    <div class="g2"><div><label for="cirf">${t("surgeries.editor.date")}</label><input id="cirf" type="date" value="${escapeHtml(surgery.fecha ?? "")}"></div>
      <div><label for="cirh">${t("surgeries.editor.time")}</label><input id="cirh" type="time" value="${escapeHtml(timeOf(surgery))}"></div></div>
    <label>${t("surgeries.editor.centre")}</label><div id="cirhos"></div>
    <label>${t("surgeries.editor.responsible")}</label><div id="circir"></div>
    <div class="g2"><div><label for="cirp">${t("surgeries.editor.procedure")}</label><input id="cirp" value="${escapeHtml(surgery.procedimiento ?? "")}" placeholder="${t("surgeries.editor.procedurePlaceholder")}"></div>
      <div><label for="cirq">${t("surgeries.editor.room")}</label><input id="cirq" value="${escapeHtml(surgery.quirofano ?? "")}" placeholder="${t("surgeries.editor.roomPlaceholder")}"></div></div>
    <div class="g2"><div><label for="cira">${t("surgeries.editor.assists")}</label><select id="cira">${people.map((person) => `<option value="${person.id}" ${person.id === surgery.asistente_id ? "selected" : ""}>${escapeHtml(person.nombre)}</option>`).join("")}</select></div>
      <div><label for="cirref">${t("surgeries.editor.caseReference", { patient: term("paciente", { article: "del" }) })}</label><input id="cirref" maxlength="60" value="${escapeHtml(surgery.referencia_caso ?? "")}" placeholder="${t("surgeries.editor.caseReferencePlaceholder")}"></div></div>
    <label>${t("surgeries.editor.materialFrom")}</label>
    <div class="segs" id="cirori" role="group" aria-label="${t("surgeries.editor.materialFrom")}">${origins}</div>
    <label for="cirn">${t("surgeries.editor.note")}</label><textarea id="cirn" rows="2">${escapeHtml(surgery.nota ?? "")}</textarea>
    <div class="acts" style="justify-content:flex-end">${existing ? `<button type="button" class="btn sec peligro" id="ciranular">${t("surgeries.editor.cancelSurgery")}</button>` : ""}
      <button type="button" class="btn sec" data-cerrar>${t("surgeries.editor.cancel")}</button><button type="button" class="btn" id="cirok">${t(existing ? "surgeries.editor.save" : "surgeries.editor.schedule")}</button></div>`;
  }
  function payload5(existing, centre, responsible, state) {
    return {
      id: existing?.id ?? null,
      fecha: value9("cirf"),
      hora: value9("cirh") || null,
      hospital_id: centre.id,
      cirujano_id: responsible.id,
      procedimiento: value9("cirp"),
      quirofano: value9("cirq"),
      asistente_id: value9("cira"),
      origen: document.querySelector("#cirori .on")?.dataset.o,
      referencia_caso: value9("cirref"),
      nota: value9("cirn"),
      estado: state
    };
  }
  var failureText2 = (error, result) => error ? t("surgeries.editor.couldNotSave", { error: error.message ?? "" }) : errorText(result);
  async function save11(existing, choice, state, button2) {
    if (!value9("cirf") || !choice.hos || !choice.cir) {
      notices.toast(t("surgeries.editor.missing"), true);
      return;
    }
    button2.disabled = true;
    const { data: result, error } = await legacyDb().rpc("cirugia_guardar", { p: payload5(existing, choice.hos, choice.cir, state) });
    button2.disabled = false;
    if (error || !result || result.ok === false) {
      notices.toast(failureText2(error, result), true);
      return;
    }
    notices.toast(t(state === STATES2.cancelled ? "surgeries.editor.cancelled" : existing ? "surgeries.editor.saved" : "surgeries.editor.scheduled"));
    appLegacy.forgetCache();
    if (state === STATES2.cancelled) document.getElementById("dlg")?.close();
    else relatedLegacy.openSurgery(result.id ?? "");
  }
  function bind16(existing, choice) {
    editorLegacy.pickAccount(document.getElementById("cirhos"), choice.hos, (account) => {
      choice.hos = account;
    }, t("surgeries.editor.centrePlaceholder"));
    editorLegacy.pickAccount(document.getElementById("circir"), choice.cir, (account) => {
      choice.cir = account;
    }, t("surgeries.editor.responsiblePlaceholder"));
    const origins = document.querySelectorAll("#cirori [data-o]");
    origins.forEach((button2) => {
      button2.onclick = () => {
        origins.forEach((other) => {
          other.classList.toggle("on", other === button2);
          other.setAttribute("aria-pressed", String(other === button2));
        });
      };
    });
    const ok = document.getElementById("cirok");
    if (ok) ok.onclick = () => {
      void save11(existing, choice, STATES2.scheduled, ok);
    };
    const cancel2 = document.getElementById("ciranular");
    if (cancel2) cancel2.onclick = async () => {
      if (!await notices.confirm(t("surgeries.editor.cancelText"), { titulo: t("surgeries.editor.cancelTitle"), ok: t("surgeries.editor.cancelSurgery"), peligro: true })) return;
      await save11(existing, choice, STATES2.cancelled, cancel2);
    };
  }
  async function editSurgery(existing) {
    const surgery = existing ?? { fecha: addDays(todayIso(), 1), origen: "deposito", asistente_id: salesTeam.currentUserId() };
    const people = await team2();
    const body2 = document.getElementById("dbody"), box = document.getElementById("dlg");
    if (!body2 || !box) return;
    body2.innerHTML = editorHtml8(surgery, existing, people);
    if (!box.open) box.showModal();
    const choice = {
      hos: existing ? { id: existing.hospital_id ?? "", nombre: existing.hospital ?? "" } : null,
      cir: existing ? { id: existing.cirujano_id ?? "", nombre: existing.cirujano ?? "", ...existing.especialidad ? { especialidad: existing.especialidad } : {} } : null
    };
    bind16(existing, choice);
  }

  // src/app/screens/surgeries/list.ts
  var DAYS_BACK = 30;
  var DAYS_AHEAD = 120;
  function surgeryRow(surgery) {
    const people = [surgery.cirujano, surgery.hospital, surgery.quirofano].filter(Boolean).join(" · ");
    const noOrder = surgery.estado === STATES2.done && !surgery.pedido_id ? `<span class="pill p-warn">${t("surgeries.list.noOrder")}</span>` : "";
    return `<button type="button" class="item cirrow" data-cir="${surgery.id}"><span class="cirf"><b>${escapeHtml(formatShortDate(surgery.fecha))}</b><span class="sm">${escapeHtml(timeOf(surgery))}</span></span>
    <span class="tx"><b>${escapeHtml(orFallback(surgery.procedimiento, t("surgeries.surgery")))}</b><span class="sm">${escapeHtml(people)}${surgery.asistente ? escapeHtml(t("surgeries.list.assists", { name: surgery.asistente })) : ""}</span></span>
    <span class="cirest">${statePill(surgery)}${noOrder}${replenishmentPill(surgery)}</span></button>`;
  }
  var block3 = (title2, list, empty2) => `<section class="card cirbloque"><h2>${title2}</h2>${list.length ? `<div class="lista">${list.map(surgeryRow).join("")}</div>` : `<div class="vacio vlinea">${empty2}</div>`}</section>`;
  async function paintSurgeries() {
    if (!document.getElementById("cfgcuerpo")) return;
    const today = todayIso();
    const { data, error } = await legacyDb().rpc("cirugias_lista", { p_desde: addDays(today, -DAYS_BACK), p_hasta: addDays(today, DAYS_AHEAD) });
    const box = document.getElementById("cfgcuerpo");
    if (!box || currentScreen() !== "cirugias") return;
    if (error) {
      box.innerHTML = `<div class="vacio">${t("surgeries.list.couldNotLoad")}</div>`;
      return;
    }
    const list = data ?? [];
    const pending = list.filter((item) => item.reposicion === "vencida" || item.reposicion === "pendiente");
    const scheduled = list.filter((item) => item.estado === STATES2.scheduled);
    const behind = scheduled.filter((item) => item.fecha < today), upcoming2 = scheduled.filter((item) => item.fecha >= today);
    const done = list.filter((item) => item.estado !== STATES2.scheduled && item.fecha <= today).reverse();
    box.innerHTML = `<div class="cirpag"><div class="evcab"><button type="button" class="btn" id="cirnueva">${t("surgeries.list.newSurgery")}</button></div>
    ${pending.length ? block3(t("surgeries.list.replenishmentsPending"), pending, "") : ""}
    ${behind.length ? block3(t("surgeries.list.usedNotRecorded"), behind, "") : ""}
    ${block3(t("surgeries.list.upcoming"), upcoming2, t("surgeries.list.noUpcoming"))}
    ${block3(t("surgeries.list.doneLast30"), done, t("surgeries.list.noneDone"))}</div>`;
    const add2 = document.getElementById("cirnueva");
    if (add2) add2.onclick = () => {
      void editSurgery(null);
    };
    box.querySelectorAll("[data-cir]").forEach((button2) => {
      button2.onclick = () => {
        relatedLegacy.openSurgery(button2.dataset.cir ?? "");
      };
    });
  }

  // src/app/screens/surgeries/use.ts
  var MAX_SERIALS = 30;
  function lineHtml4(line2, index) {
    const details2 = `${escapeHtml(line2.numero_lote ?? t("surgeries.use.noBatch"))}${line2.caducidad ? t("surgeries.use.expires", { date: formatShortDate(line2.caducidad) }) : ""}${t("surgeries.use.available", { count: formatNumber(line2.unidades) })}`;
    return `<div class="cirl" data-ci="${index}"><label><span>${escapeHtml(line2.nombre)} <span class="sm">· ${details2}</span></span>
      <input type="number" min="0" max="${line2.unidades}" step="1" data-cu="${index}" placeholder="0" aria-label="${t("surgeries.use.usedOf", { name: escapeHtml(line2.nombre) })}"></label><div class="cirser" data-cs="${index}"></div></div>`;
  }
  function paintSerials(box, input3) {
    const key = input3.dataset.cu ?? "", units2 = Math.min(Number(input3.max), Math.max(0, Math.floor(Number(input3.value) || 0)));
    const place = box.querySelector(`[data-cs="${key}"]`);
    if (!place) return;
    const written = [...place.querySelectorAll("input")].map((field4) => field4.value);
    place.innerHTML = range(Math.min(units2, MAX_SERIALS)).map((index) => `<input data-cser="${key}" maxlength="120" value="${escapeHtml(written[index] ?? "")}" placeholder="${t("surgeries.use.serialOf", { index: index + 1 })}" aria-label="${t("surgeries.use.serialLabel", { index: index + 1 })}">`).join("");
  }
  async function saveUsed(surgery, stock, box, button2) {
    const items = stock.map((line2, index) => ({
      producto_id: line2.producto_id,
      lote_id: line2.lote_id,
      max: line2.unidades,
      unidades: Math.max(0, Math.floor(Number(box.querySelector(`[data-cu="${index}"]`)?.value) || 0)),
      series: [...box.querySelectorAll(`[data-cser="${index}"]`)].map((field4) => field4.value.trim()).filter(Boolean)
    })).filter((item) => item.unidades > 0);
    if (!items.length) {
      notices.toast(t("surgeries.use.writeUsed"), true);
      return;
    }
    if (items.some((item) => item.unidades > item.max)) {
      notices.toast(t("surgeries.use.tooMany"), true);
      return;
    }
    button2.disabled = true;
    const reference2 = document.getElementById("cirref2")?.value ?? "";
    const { data: result, error } = await legacyDb().rpc("cirugia_consumo", { p: {
      id: surgery.id,
      referencia_caso: reference2,
      items: items.map((item) => ({ producto_id: item.producto_id, lote_id: item.lote_id, unidades: item.unidades, series: item.series }))
    } });
    button2.disabled = false;
    if (error || !result || result.ok === false) {
      notices.toast(error ? t("surgeries.editor.couldNotSave", { error: error.message ?? "" }) : errorText(result), true);
      return;
    }
    notices.toast(t("surgeries.use.saved"));
    appLegacy.forgetCache();
    relatedLegacy.openSurgery(surgery.id, `<div class="banda-ok depaviso">${t(result.pedido_id ? "surgeries.use.savedWithOrder" : "surgeries.use.savedWithoutOrder")}</div>`);
  }
  function paintUse(surgery, stock) {
    const box = document.getElementById("cirusar");
    if (!box) return;
    if (!stock.length) {
      box.innerHTML = `<div class="banda-aviso">${t(surgery.origen === "deposito" ? "surgeries.use.noMaterialDeposit" : "surgeries.use.noMaterialPersonal")}</div>`;
      return;
    }
    box.innerHTML = `<details class="cirdet"><summary class="btn">${t("surgeries.use.record")}</summary><div class="depbox">
    <span class="sm">${t("surgeries.use.hint")}</span>
    <div class="cirlin">${stock.map(lineHtml4).join("")}</div>
    <label for="cirref2">${t("surgeries.editor.caseReference", { patient: term("paciente", { article: "del" }) })}</label><input id="cirref2" maxlength="60" value="${escapeHtml(surgery.referencia_caso ?? "")}" placeholder="${t("surgeries.editor.caseReferencePlaceholder")}">
    <div class="acts" style="justify-content:flex-end"><button type="button" class="btn" id="cirusok">${t("surgeries.use.save")}</button></div></div></details>`;
    box.querySelectorAll("[data-cu]").forEach((input3) => {
      input3.oninput = () => {
        paintSerials(box, input3);
      };
    });
    const save13 = document.getElementById("cirusok");
    if (save13) save13.onclick = () => {
      void saveUsed(surgery, stock, box, save13);
    };
  }

  // src/app/screens/surgeries/sheet.ts
  function replenishmentOf(surgery) {
    if (surgery.estado !== STATES2.done) return null;
    if (surgery.repuesta_en) return "repuesta";
    return new Date(surgery.reposicion_limite ?? "") < /* @__PURE__ */ new Date() ? "vencida" : "pendiente";
  }
  function dataHtml4(detail, replenishment) {
    const surgery = detail.cirugia;
    return `<div class="cirdat"><span>${t("surgeries.sheet.responsible")}</span><b><button type="button" class="lnk" data-cfi="${surgery.cirujano_id ?? ""}">${escapeHtml(detail.cirujano)}</button>${detail.especialidad ? ` <span class="sm">· ${escapeHtml(detail.especialidad)}</span>` : ""}</b>
      <span>${t("surgeries.sheet.centre")}</span><b><button type="button" class="lnk" data-cfi="${surgery.hospital_id ?? ""}">${escapeHtml(detail.hospital)}</button></b>
      <span>${t("surgeries.sheet.assists")}</span><b>${escapeHtml(orFallback(detail.asistente, "—"))}</b>
      <span>${t("surgeries.sheet.material")}</span><b>${escapeHtml(orFallback(detail.almacen, originLabel(surgery.origen ?? "")))}</b>
      ${surgery.referencia_caso ? `<span>${term("paciente", { capital: "C" })}</span><b>${escapeHtml(t("surgeries.sheet.reference", { reference: surgery.referencia_caso }))}</b>` : ""}
      <span>${t("surgeries.sheet.state")}</span><b>${statePill(surgery)} ${replenishmentPill({ ...surgery, reposicion: replenishment })}</b></div>`;
  }
  function usedHtml(used) {
    if (!used.length) return "";
    return `<h3>${t("surgeries.sheet.used")}</h3><div class="deptab"><div class="deph cirh"><span>${t("surgeries.sheet.product")}</span><span>${t("surgeries.sheet.batch")}</span><span>${t("surgeries.sheet.serial")}</span><span>${t("surgeries.sheet.units")}</span></div>
      ${used.map((line2) => `<div class="depf cirh"><span>${escapeHtml(line2.producto)}</span><span>${escapeHtml(orFallback(line2.numero_lote, t("surgeries.sheet.noBatch")))}</span><span>${escapeHtml(orFallback(line2.serie, "—"))}</span><b>${formatNumber(line2.unidades)}</b></div>`).join("")}</div>`;
  }
  function sheetHtml6(detail, notice) {
    const surgery = detail.cirugia, scheduled = surgery.estado === STATES2.scheduled, replenishment = replenishmentOf(surgery), can = Boolean(detail.puede);
    return `<div class="fh"><div><h2>${escapeHtml(orFallback(surgery.procedimiento, t("surgeries.surgery")))}</h2>
      <div class="sm">${escapeHtml(formatLongDate(surgery.fecha))}${surgery.hora ? ` · ${escapeHtml(timeOf(surgery))}` : ""} · ${escapeHtml(detail.hospital)}${surgery.quirofano ? ` · ${escapeHtml(surgery.quirofano)}` : ""}</div></div>
      <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>
    ${notice}
    ${dataHtml4(detail, replenishment)}
    ${surgery.nota ? `<p class="sm">${escapeHtml(surgery.nota)}</p>` : ""}
    ${surgery.estado === STATES2.done && !surgery.pedido_id ? `<div class="banda-aviso cirsinped">${t("surgeries.sheet.noOrder")} <button type="button" class="btn sec" id="cirhacerped">${t("surgeries.sheet.createOrder")}</button></div>` : ""}
    ${scheduled && can ? '<div id="cirusar"></div>' : ""}
    ${usedHtml(detail.consumos ?? [])}
    ${actionsHtml3(surgery, replenishment, can)}`;
  }
  function actionsHtml3(surgery, replenishment, can) {
    const scheduled = surgery.estado === STATES2.scheduled;
    return `<div class="acts" style="justify-content:flex-end">${surgery.pedido_id ? `<button type="button" class="btn sec" id="cirped">${t("surgeries.sheet.seeOrder")}</button>` : ""}
      ${replenishment && replenishment !== "repuesta" && can ? `<button type="button" class="btn" id="cirrepo">${t("surgeries.sheet.replenishNow")}</button>` : ""}
      ${scheduled && can ? `<button type="button" class="btn sec" id="cireditar">${t("surgeries.sheet.change")}</button>` : ""}<button type="button" class="btn sec" data-cerrar>${t("common.close")}</button></div>`;
  }
  async function createOrder(id, button2) {
    button2.disabled = true;
    const { data: result } = await legacyDb().rpc("cirugia_pedido", { p_id: id });
    if (!result || result.ok === false) {
      button2.disabled = false;
      notices.toast(result?.error === "pedido" ? t("surgeries.sheet.noOrderPermission") : errorText(result), true);
      return;
    }
    notices.toast(t("surgeries.sheet.orderCreated"));
    relatedLegacy.openSurgery(id);
  }
  async function replenish(id, button2) {
    button2.disabled = true;
    const { data: result } = await legacyDb().rpc("cirugia_reponer", { p_id: id });
    if (!result || result.ok === false) {
      button2.disabled = false;
      notices.toast(result?.error === "sin_stock" ? t("surgeries.sheet.notEnoughStock") : errorText(result), true);
      return;
    }
    notices.toast(t(result.a_tiempo === false ? "surgeries.sheet.replenishedLate" : "surgeries.sheet.replenished"));
    relatedLegacy.openSurgery(id);
  }
  function bind17(id, detail) {
    const surgery = detail.cirugia, on2 = (elementId, action) => {
      const button2 = document.getElementById(elementId);
      if (button2) button2.onclick = () => {
        action(button2);
      };
    };
    document.querySelectorAll("#dbody [data-cfi]").forEach((button2) => {
      button2.onclick = () => {
        document.getElementById("dlg")?.close();
        agendaActions.openAccount(button2.dataset.cfi ?? "");
      };
    });
    on2("cirped", () => {
      appLegacy.openOrder(surgery.pedido_id ?? "");
    });
    on2("cirhacerped", (button2) => {
      void createOrder(id, button2);
    });
    on2("cireditar", () => {
      void editSurgery({ ...surgery, hospital: detail.hospital, cirujano: detail.cirujano, especialidad: detail.especialidad ?? null });
    });
    on2("cirrepo", (button2) => {
      void replenish(id, button2);
    });
  }
  async function showSurgery(id, notice = "") {
    const { data: detail, error } = await legacyDb().rpc("cirugia_detalle", { p_id: id });
    if (error || !detail) {
      notices.toast(t("surgeries.sheet.notFound"), true);
      return;
    }
    const body2 = document.getElementById("dbody"), box = document.getElementById("dlg");
    if (!body2 || !box) return;
    body2.innerHTML = sheetHtml6(detail, notice);
    if (!box.open) box.showModal();
    bind17(id, detail);
    if (document.getElementById("cirusar")) paintUse(detail.cirugia, detail.stock ?? []);
  }

  // src/app/screens/cycle/index.ts
  var cycle_exports = {};
  __export(cycle_exports, {
    editCycle: () => editCycle,
    listenToClassButtons: () => listenToClassButtons,
    paintCardCycle: () => paintCardCycle,
    paintClassify: () => paintClassify,
    paintCoverage: () => paintCoverage,
    paintCycle: () => paintCycle,
    paintCycleTeam: () => paintCycleTeam
  });

  // src/app/screens/cycle/settings.ts
  var MAX_VISITS = 31;
  var DEFAULT_MONTHS = 3;
  var DEFAULTS = { meses: DEFAULT_MONTHS, A: 3, B: 2, C: 1 };
  var LENGTHS = [
    [1, "cycle.editor.oneMonth"],
    [2, "cycle.editor.twoMonths"],
    [3, "cycle.editor.quarter"],
    [4, "cycle.editor.fourMonths"],
    [6, "cycle.editor.half"],
    [12, "cycle.editor.year"]
  ];
  var visits = (value10) => Math.min(MAX_VISITS, Math.max(0, Math.floor(Number(value10) || 0)));
  function editorHtml9(current) {
    const months2 = LENGTHS.map(([value10, key]) => `<option value="${value10}" ${Number(current.meses) === value10 ? "selected" : ""}>${t(key)}</option>`).join("");
    const goals = CLASSES.map((letter) => `<label>${classPill(letter)}<span>${t("cycle.editor.perCycle", words())}</span><input type="number" min="0" max="${MAX_VISITS}" step="1" data-cobj="${letter}" value="${Math.max(0, Number(current[letter]) || 0)}" aria-label="${t("cycle.editor.ofClass", { ...words(), class: letter })}"></label>`).join("");
    return `<div class="fh"><div><h2>${t("cycle.editor.title", words())}</h2>
      <div class="sm">${t("cycle.editor.subtitle", words())}</div></div>
      <button class="x" data-cerrar aria-label="${t("common.close")}">✕</button></div>
    <label for="cicmeses">${t("cycle.editor.length")}</label><select id="cicmeses">${months2}</select>
    <div class="cicobj">${goals}</div>
    <p class="sm">${t("cycle.editor.zeroHint", words())}</p>
    <div class="acts" style="justify-content:flex-end"><button class="btn sec" data-cerrar>${t("common.cancel")}</button><button class="btn" id="cicok">${t("common.save")}</button></div>`;
  }
  async function save12(body2, box) {
    const value10 = { meses: Number(document.getElementById("cicmeses")?.value) || DEFAULT_MONTHS };
    body2.querySelectorAll("[data-cobj]").forEach((input3) => {
      value10[input3.dataset.cobj ?? ""] = visits(input3.value);
    });
    const { data: result, error } = await legacyDb().rpc("guardar_ajuste", { p_clave: "ciclo_visitas", p_valor: value10 });
    if (error || result?.ok === false) {
      notices.toast(t("cycle.editor.couldNotSave"), true);
      return;
    }
    cycleLegacy.setSetting("ciclo_visitas", value10);
    box.close();
    notices.toast(t("cycle.editor.saved"));
    appLegacy.forgetCache();
  }
  async function editCycle() {
    await cycleLegacy.loadSettings();
    const current = { ...DEFAULTS, ...cycleLegacy.setting("ciclo_visitas") };
    const body2 = document.getElementById("dbody"), box = document.getElementById("dlg");
    if (!body2 || !box) return;
    body2.innerHTML = editorHtml9(current);
    if (!box.open) box.showModal();
    const ok = document.getElementById("cicok");
    if (ok) ok.onclick = () => {
      void save12(body2, box);
    };
  }

  // src/app/screens/cycle/current.ts
  var EMPTY = { clase: "", cuentas: 0, al_dia: 0, hechas: 0, objetivo: 0 };
  function classCard(letter, data) {
    const summary3 = (data.resumen ?? []).find((item) => item.clase === letter) ?? EMPTY, percent2 = percentOf(summary3.hechas, summary3.objetivo);
    const head = summary3.cuentas ? t("cycle.current.upToDate", { done: formatNumber(summary3.al_dia), total: formatNumber(summary3.cuentas) }) : t("cycle.current.noneIn", { class: letter });
    return `<div class="card cicc">${classPill(letter)}<div class="cicct"><b>${head}</b>
      <span class="sm">${t("cycle.current.every", { visits: visitsText(data.objetivo?.[letter] ?? 0), cycle: cycleName(data.meses) })}</span></div>
      ${summary3.cuentas ? `${progressBar(percent2, "div")}<span class="sm">${t("cycle.current.doneOf", { done: formatNumber(summary3.hechas), goal: visitsText(summary3.objetivo), percent: percent2 })}</span>` : ""}</div>`;
  }
  function pendingRow3(item) {
    const place = escapeHtml([item.especialidad, item.municipio].filter(Boolean).join(" · "));
    const last = item.ultima_visita ? t("cycle.current.lastVisit", { ...words(), date: formatShortDate(item.ultima_visita) }) : t("cycle.current.noVisits", words());
    return `<div class="item cicrow">${classPill(item.clase)}
        <span class="tx"><button type="button" class="lnk" data-cfi="${item.id}"><b>${escapeHtml(item.nombre)}</b></button>
          <span class="sm">${place}${last}</span></span>
        <span class="cicfal"><b>${t("cycle.current.progress", { done: item.hechas, goal: item.objetivo })}</b><span class="sm">${item.faltan === 1 ? t("cycle.current.oneMissing") : t("cycle.current.missing", { count: item.faltan })}</span></span>
        ${item.proxima_cita ? `<span class="pill p-per">${t("cycle.current.appointmentOn", { date: formatShortDate(item.proxima_cita) })}</span>` : `<button type="button" class="btn sec" data-ccita="${item.id}">${t("cycle.current.newAppointment")}</button>`}</div>`;
  }
  function headerHtml8(data, selector) {
    const left = data.quedan_dias === 1 ? t("cycle.current.oneDayLeft") : t("cycle.current.daysLeft", { count: formatNumber(data.quedan_dias) });
    return `<div class="ciccab"><div><b>${escapeHtml(rangeText(data))}</b>
      <span class="sm">${left} · ${t("cycle.current.allCount", words())}</span></div>
      <span class="cicacc">${selector}${cardSectionsLegacy.can("administrar") ? `<button type="button" class="btn sec" id="cicajustar">${t("cycle.current.adjust")}</button>` : ""}</span></div>`;
  }
  function unclassifiedHtml(count2) {
    if (!count2) return "";
    const text2 = count2 === 1 ? t("cycle.current.oneUnclassified", words()) : t("cycle.current.unclassified", { ...words(), count: formatNumber(count2) });
    return `<div class="banda-aviso cicsin">${text2}${t("cycle.current.unclassifiedTail")}
      <button type="button" class="btn sec" id="cicirclas">${t("cycle.classify")}</button></div>`;
  }
  function missingHtml(data) {
    const filter = cycleState.classFilter, pending = (data.pendientes ?? []).filter((item) => !filter || item.clase === filter), cycle3 = cycleName(data.meses);
    const buttons = [["", t("cycle.current.all")], ...CLASSES.map((letter) => [letter, letter])].map(([value10 = "", label = ""]) => `<button type="button" data-cf="${value10}" class="${value10 === filter ? "on" : ""}" aria-pressed="${String(value10 === filter)}">${label}</button>`).join("");
    const empty2 = filter ? t("cycle.current.noneMissingIn", { ...words(), class: filter }) : t("cycle.current.allUpToDate", { cycle: cycle3 });
    return `<section class="card cicbloque"><div class="cicbcab"><h2>${t("cycle.current.missingTitle", { ...words(), cycle: cycle3 })}</h2>
        <span class="segs" id="cicfil" role="group" aria-label="${t("cycle.classLabel")}">${buttons}</span></div>
      ${pending.length ? `<div class="lista">${pending.map(pendingRow3).join("")}</div>` : `<div class="vacio vlinea">${empty2}</div>`}</section>`;
  }
  function pageHtml9(data, selector) {
    const classified = sum((data.resumen ?? []).map((item) => item.cuentas));
    return `<div class="cicpag">${headerHtml8(data, selector)}
    ${unclassifiedHtml(data.sin_clase ?? 0)}
    ${classified ? `<div class="cicres">${CLASSES.map((letter) => classCard(letter, data)).join("")}</div>
    ${missingHtml(data)}` : `<div class="vacio">${t("cycle.current.nobodyClassified", words())}</div>`}</div>`;
  }
  function bindAccounts(box) {
    box.querySelectorAll("[data-cfi]").forEach((button2) => {
      button2.onclick = () => {
        agendaActions.openAccount(button2.dataset.cfi ?? "");
      };
    });
    box.querySelectorAll("[data-ccita]").forEach((button2) => {
      button2.onclick = () => {
        agendaActions.newAppointment(button2.dataset.ccita ?? "", null);
      };
    });
  }
  function bindClassify(elementId) {
    const button2 = document.getElementById(elementId);
    if (button2) button2.onclick = () => {
      cycleState.classifyFilter = "sin";
      goToTab("clasificar");
    };
  }
  function bind18(box) {
    bindOwner(paintCycle);
    const adjust = document.getElementById("cicajustar");
    if (adjust) adjust.onclick = () => {
      void editCycle();
    };
    bindClassify("cicirclas");
    box.querySelectorAll("#cicfil [data-cf]").forEach((button2) => {
      button2.onclick = () => {
        cycleState.classFilter = button2.dataset.cf ?? "";
        void paintCycle();
      };
    });
    bindAccounts(box);
  }
  async function paintCycle() {
    if (!document.getElementById("cfgcuerpo")) return;
    const [{ data, error }, selector] = await Promise.all([legacyDb().rpc("ciclo_cuentas", { p_usuario: ownerParam() }), ownerSelector()]);
    const box = document.getElementById("cfgcuerpo");
    if (!box || currentScreen() !== "ciclo") return;
    if (error || !data) {
      box.innerHTML = `<div class="vacio">${t("cycle.current.couldNotLoad")}</div>`;
      return;
    }
    box.innerHTML = pageHtml9(data, selector);
    bind18(box);
  }

  // src/app/screens/cycle/classify.ts
  var SHOWN4 = 300;
  var SEARCH_WAIT_MS5 = 350;
  function rowHtml13(item) {
    return `<div class="item cicrow" data-cfila="${item.id}">
        <span class="tx"><button type="button" class="lnk" data-cfi="${item.id}"><b>${escapeHtml(item.nombre)}</b></button>
          <span class="sm">${escapeHtml([item.especialidad, item.municipio, item.estado_comercial].filter(Boolean).join(" · "))}</span></span>
        <span class="cicfal"><b>${formatNumber(item.actividades_12m)}</b><span class="sm">${t("cycle.classifyPage.in12Months")}</span></span>
        ${classButtons(item.id, item.clase)}</div>`;
  }
  function listHtml2(rows) {
    if (!rows.length) return `<div class="vacio vlinea">${t(cycleState.classifyFilter === "sin" && !cycleState.query ? "cycle.classifyPage.allClassified" : "cycle.classifyPage.noneWithFilter")}</div>`;
    return `<section class="card cicbloque"><div class="lista">${rows.map(rowHtml13).join("")}</div></section>${rows.length >= SHOWN4 ? `<p class="sm">${t("cycle.classifyPage.firstOnly")}</p>` : ""}`;
  }
  function pageHtml10(rows, selector) {
    const filters = [["sin", t("cycle.classifyPage.unclassified")], ...CLASSES.map((letter) => [letter, letter]), ["todas", t("cycle.classifyPage.all")]].map(([value10 = "", label = ""]) => `<button type="button" data-cl="${value10}" class="${value10 === cycleState.classifyFilter ? "on" : ""}" aria-pressed="${String(value10 === cycleState.classifyFilter)}">${label}</button>`).join("");
    return `<div class="cicpag"><div class="ciccab"><span class="segs" id="cicclf" role="group" aria-label="${t("cycle.classifyPage.show")}">${filters}</span>
      <span class="cicacc"><input id="cicq" type="search" placeholder="${t("cycle.classifyPage.search", words())}" value="${escapeHtml(cycleState.query)}" aria-label="${t("cycle.classifyPage.searchLabel")}">${selector}</span></div>
    <p class="sm">${t("cycle.classifyPage.hint", words())}</p>
    ${listHtml2(rows)}</div>`;
  }
  var searchTimer5;
  function bind19(box, wasSearching) {
    box.querySelectorAll("#cicclf [data-cl]").forEach((button2) => {
      button2.onclick = () => {
        cycleState.classifyFilter = button2.dataset.cl ?? "sin";
        void paintClassify();
      };
    });
    const search3 = document.getElementById("cicq");
    if (search3) {
      search3.oninput = () => {
        clearTimeout(searchTimer5);
        searchTimer5 = setTimeout(() => {
          cycleState.query = search3.value.trim();
          void paintClassify();
        }, SEARCH_WAIT_MS5);
      };
      if (wasSearching) {
        search3.focus();
        search3.setSelectionRange(search3.value.length, search3.value.length);
      }
    }
    bindOwner(paintClassify);
    bindAccounts(box);
  }
  async function paintClassify() {
    if (!document.getElementById("cfgcuerpo")) return;
    const [{ data, error }, selector] = await Promise.all([
      legacyDb().rpc("cuentas_para_clasificar", { p_usuario: ownerParam(), p_filtro: cycleState.classifyFilter, p_q: cycleState.query || null }),
      ownerSelector()
    ]);
    const box = document.getElementById("cfgcuerpo");
    if (!box || currentScreen() !== "ciclo") return;
    if (error) {
      box.innerHTML = `<div class="vacio">${t("cycle.classifyPage.couldNotLoad")}</div>`;
      return;
    }
    const search3 = document.getElementById("cicq"), wasSearching = Boolean(search3) && document.activeElement === search3;
    box.innerHTML = pageHtml10(data ?? [], selector);
    bind19(box, wasSearching);
  }
  async function classify(button2, onCard) {
    const [id = "", letter = ""] = (button2.dataset.ccl ?? "").split("|"), group = button2.closest(".cicsegs");
    if (!group) return;
    const chosen2 = button2.classList.contains("on") ? null : letter, buttons = [...group.querySelectorAll("button")];
    buttons.forEach((other) => {
      other.disabled = true;
    });
    const { data: result, error } = await legacyDb().rpc("clasificar_cuentas", { p_ids: [id], p_clase: chosen2 });
    buttons.forEach((other) => {
      other.disabled = false;
    });
    if (error || !result || result.ok === false) {
      notices.toast(t(result?.error === "permiso" ? "cycle.classifyPage.noPermission" : "cycle.classifyPage.couldNotSave"), true);
      return;
    }
    buttons.forEach((other) => {
      const on2 = other.dataset.ccl === `${id}|${String(chosen2)}`;
      other.classList.toggle("on", on2);
      other.setAttribute("aria-pressed", String(on2));
    });
    appLegacy.forgetCache();
    if (group.closest("#fciclo")) onCard(id);
  }
  function listenToClassButtons(onCard) {
    document.addEventListener("click", (event) => {
      const button2 = event.target?.closest("[data-ccl]");
      if (!button2 || button2.disabled) return;
      void classify(button2, onCard);
    }, true);
  }

  // src/app/screens/cycle/coverage.ts
  function classRow(item) {
    const percent2 = percentOf(item.presentado, item.cuentas);
    return `<div class="cobf">${classPill(item.clase)}${progressBar(percent2)}<span class="cobn"><b>${t("cycle.current.progress", { done: formatNumber(item.presentado), goal: formatNumber(item.cuentas) })}</b> · ${percent2}%</span></div>`;
  }
  var missingRow = (item) => `<div class="item cicrow">${classPill(item.clase)}<span class="tx"><button type="button" class="lnk" data-cfi="${item.id}"><b>${escapeHtml(item.nombre)}</b></button>
              <span class="sm">${escapeHtml([item.especialidad, item.municipio].filter(Boolean).join(" · "))}</span></span><button type="button" class="btn sec" data-ccita="${item.id}">${t("cycle.current.newAppointment")}</button></div>`;
  function missingHtml2(product, notHeard, cycle3) {
    const missing = product.faltan ?? [];
    if (!missing.length) return `<div class="banda-ok cobok">${t("cycle.coverage.allHeard", { cycle: cycle3 })}</div>`;
    const count2 = notHeard > missing.length ? t("cycle.coverage.firstOf", { shown: missing.length, total: formatNumber(notHeard) }) : t("cycle.coverage.count", { count: formatNumber(missing.length) });
    return `<details class="cobfal"><summary>${t("cycle.coverage.whoIsMissing")}${count2}</summary>
            <div class="lista">${missing.map(missingRow).join("")}</div></details>`;
  }
  function productCard(product, cycle3) {
    const classes = product.clases ?? [], accounts2 = sum(classes.map((item) => item.cuentas)), heard = sum(classes.map((item) => item.presentado));
    return `<section class="card cobcard"><div class="cobcab"><h2>${escapeHtml(product.nombre)}</h2><span class="cobtot">${percentOf(heard, accounts2)}%</span></div>
          ${classes.map(classRow).join("")}
          ${missingHtml2(product, accounts2 - heard, cycle3)}</section>`;
  }
  function bodyHtml(data) {
    const products2 = data.productos ?? [];
    if (!products2.length) return `<div class="vacio">${t("cycle.coverage.noProducts")}${cardSectionsLegacy.can("administrar") ? t("cycle.coverage.markIt", words()) : ""}</div>`;
    if (!data.cuentas) return `<div class="vacio">${t("cycle.coverage.nobodyClassified", words())} <button type="button" class="btn sec" id="cobclas">${t("cycle.classify")}</button></div>`;
    return `<div class="cobgrid">${products2.map((product) => productCard(product, cycleName(data.meses))).join("")}</div>`;
  }
  async function paintCoverage() {
    if (!document.getElementById("cfgcuerpo")) return;
    const [{ data, error }, selector] = await Promise.all([legacyDb().rpc("ciclo_cobertura", { p_usuario: ownerParam() }), ownerSelector()]);
    const box = document.getElementById("cfgcuerpo");
    if (!box || currentScreen() !== "ciclo") return;
    if (error || !data) {
      box.innerHTML = `<div class="vacio">${t("cycle.coverage.couldNotLoad")}</div>`;
      return;
    }
    box.innerHTML = `<div class="cicpag"><div class="ciccab"><div><b>${escapeHtml(rangeText(data))}</b>
      <span class="sm">${t("cycle.coverage.subtitle", { ...words(), cycle: cycleName(data.meses) })}</span></div>
      <span class="cicacc">${selector}</span></div>
    ${bodyHtml(data)}</div>`;
    bindOwner(paintCoverage);
    bindClassify("cobclas");
    bindAccounts(box);
  }

  // src/app/screens/cycle/team.ts
  var ofText = (done, goal) => t("cycle.current.progress", { done: formatNumber(done), goal: formatNumber(goal) });
  function rowHtml14(member) {
    const classified = member.a + member.b + member.c, percent2 = member.objetivo ? percentOf(member.hechas, member.objetivo) : null;
    const progress = percent2 === null ? "—" : `<span class="cicbarc">${progressBar(percent2)}${ofText(member.hechas, member.objetivo)} · ${percent2}%</span>`;
    return `<tr><td><button type="button" class="lnk" data-cde="${member.id}"><b>${escapeHtml(member.nombre)}</b></button><span class="sm"> · ${escapeHtml(member.rol)}</span></td><td>${formatNumber(member.cartera)}</td><td>${formatNumber(member.a)}</td><td>${formatNumber(member.b)}</td><td>${formatNumber(member.c)}</td>
          <td class="${member.sin_clase ? "cicaviso" : ""}">${formatNumber(member.sin_clase)}</td><td>${classified ? ofText(member.al_dia, classified) : "—"}</td>
          <td>${progress}</td></tr>`;
  }
  function tableHtml5(members) {
    if (!members.length) return `<div class="vacio">${t("cycle.team.nobody")}</div>`;
    const head = [t("cycle.team.person"), t("cycle.team.portfolio"), "A", "B", "C", t("cycle.team.noClass"), t("cycle.team.upToDate"), t("cycle.team.cycleVisits", words())];
    return `<div class="card cicbloque"><div class="dgrid-wrap"><table class="trtabla cictab"><thead><tr>${head.map((title2) => `<th>${title2}</th>`).join("")}</tr></thead>
      <tbody>${members.map(rowHtml14).join("")}</tbody></table></div></div>
      <p class="sm">${t("cycle.team.countHint", words())}</p>`;
  }
  async function paintCycleTeam() {
    if (!document.getElementById("cfgcuerpo")) return;
    const [{ data: members }, { data: ranges }] = await Promise.all([legacyDb().rpc("ciclo_equipo"), legacyDb().rpc("ciclo_rango")]);
    const box = document.getElementById("cfgcuerpo");
    if (!box || currentScreen() !== "ciclo") return;
    const range2 = (ranges ?? [])[0];
    const goals = range2 ? `<p class="sm">${escapeHtml(rangeText(range2))}${t("cycle.team.goals", { ...words(), a: visitsText(range2.obj_a), b: range2.obj_b, c: range2.obj_c })}</p>` : "";
    box.innerHTML = `<div class="cicpag">${goals}
    ${tableHtml5(members ?? [])}</div>`;
    box.querySelectorAll("[data-cde]").forEach((button2) => {
      button2.onclick = () => {
        cycleState.owner = button2.dataset.cde ?? "";
        goToTab("ciclo");
      };
    });
  }

  // src/app/screens/agenda/your-day/card-buttons.ts
  function swapWithNeighbour(item, action) {
    const all = legacyAgenda.dayAppointments(), open2 = all.filter((entry) => isOpen(entry.estado));
    const from = open2.indexOf(item), to = action === "sube" ? from - 1 : from + 1;
    const neighbour = open2[to];
    if (!neighbour) return;
    open2[from] = neighbour;
    open2[to] = item;
    void moveAppointment([...all.filter((entry) => !isOpen(entry.estado)), ...open2], item.id, action);
  }
  function cardButton(button2) {
    const [action = "", id = ""] = (button2.dataset.td ?? "").split("|");
    const item = legacyAgenda.dayAppointments().find((entry) => entry.id === id);
    if (!item) return;
    if (action === "mas") openMenu(button2, item);
    else if (action === "visita") {
      if (yourDayLegacy.canRecordOn(item.fecha)) appointmentLegacy.recordVisit(item.cuenta_id, item.fecha);
    } else if (action === "nueva") void appointmentLegacy.newDateAfterAbsent(item);
    else if (action === "sube" || action === "baja") swapWithNeighbour(item, action);
  }
  function taskRow2(row4, target) {
    if (target.closest(".tdtchk, .tdtmov")) return;
    const day = legacyAgenda.selectedDate();
    editTask((agendaCache.dayTasks(day ?? "") ?? []).find((task) => task.id === row4.dataset.tarea), day);
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
      const row4 = target.closest("#tdtareas .tdtarea");
      if (row4) {
        taskRow2(row4, target);
        return;
      }
      const button2 = target.closest("[data-td]");
      if (button2) {
        event.stopPropagation();
        cardButton(button2);
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
      accounts: accounts_exports,
      events: events_exports,
      analytics: analytics_exports,
      visit: visit_exports,
      commissions: commissions_exports,
      customers: customers_exports,
      opportunities: opportunities_exports,
      quality: quality_exports,
      manual: manual_exports,
      importing: import_exports,
      purchases: purchases_exports,
      tenders: tenders_exports,
      equipment: equipment_exports,
      surgeries: surgeries_exports,
      cycle: cycle_exports
    }
  };
  listenToSameCentre();
  listenToYourDay();
  listenToCards();
  listenToColumnResize(paintHeader);
  listenToVisitOrdersViews();
  listenToClassButtons((id) => {
    void paintCardCycle(id);
  });
})();
