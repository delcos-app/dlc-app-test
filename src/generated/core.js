(() => {
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
    async function navigate(target, ...params) {
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
      navigate,
      get current() {
        return current;
      }
    };
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

  // src/app/main.ts
  window.delcos = {
    router: createRouter("inicio"),
    t,
    setLanguage,
    setVocabulary
  };
})();
