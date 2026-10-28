/**
 * Entry point of the new code (src/app). esbuild bundles it into src/generated/core.js, which runs first in app.js.
 * While screens migrate, the legacy code (src/legado) reaches the new services and screens through `window.delcos`.
 */
// Plan 6.6: the state objects first, so the legacy names exist on window before any legacy piece runs
import './screens/agenda/store';
import './screens/routes/store';
import './screens/settings/store';
import './screens/orders/store';
import './screens/products/store';
import './screens/billing/store';
import './screens/accounts/store';
import './screens/home/store';
import './core/navigation/store';
import './core/session-store';
import * as components from './components';
import { createRouter, type Router } from './core/router';
import { navigate } from './core/navigation';
import { setLanguage, setVocabulary, t } from './i18n';
import * as nav from './core/navigation/api';
import * as accounts from './screens/accounts';
import * as agenda from './screens/agenda';
import * as events from './screens/events';
import * as coreServices from './core/services';
import * as legacyC from './core/legacy-c';
import * as layers from './core/layers';
import * as leftovers from './core/leftovers';
import * as legacyB from './core/legacy-b';
import * as legacyA from './core/legacy-a';
import * as settingsCore from './core/settings';
import * as content from './content';
import * as settingsShell from './screens/settings/shell';
import * as embeddedWindow from './components/embedded-window';
import * as settingsRest from './screens/settings/rest';
import * as portalHome from './screens/home/portal-home';
import { listenToColumnResize, listenToDayPickers, listenToDuplicates, listenToMapCards, listenToStateSelects } from './screens/accounts/listeners';
import { openCard } from './screens/accounts/lazy';
import * as settingsExtra from './screens/settings/extra';
import * as listComponents from './components/list';
import * as filterComponents from './components/filters';
import * as filtersPanel from './components/filters-panel';
import * as listBar from './components/list-bar';
import * as settingsMore from './screens/settings/more';
import * as settings from './screens/settings';
import * as access from './screens/access';
import * as routes from './screens/routes';
import * as orders from './screens/orders';
import * as products from './screens/products';
import * as billing from './screens/billing';
import * as platform from './screens/platform';
import * as portal from './screens/portal';
import * as analytics from './screens/analytics';
import * as visit from './screens/visit';
import * as commissions from './screens/commissions';
import * as customers from './screens/customers';
import * as opportunities from './screens/opportunities';
import * as quality from './screens/quality';
import * as manual from './screens/manual';
import * as importing from './screens/import';
import * as purchases from './screens/purchases';
import * as tenders from './screens/tenders';
import * as equipment from './screens/equipment';
import * as surgeries from './screens/surgeries';
import * as cycle from './screens/cycle';
import { listenToPolicyViolations } from './core/csp-watch';
import { publishSharedModules } from './core/lazy/registry';
import { listenToSameCentre } from './screens/agenda/same-centre';
import { listenToCards, listenToYourDay } from './screens/agenda/your-day/listeners';
import * as home from './screens/home';
import { paintIndicators } from './screens/home/indicators';
import { openIndicatorSettings } from './screens/home/indicator-settings';

export interface DelcosCore {
  readonly router: Router;
  /** Change screen: the legacy ir() calls this. */
  readonly navigate: typeof navigate;
  readonly t: typeof t;
  readonly setLanguage: typeof setLanguage;
  readonly setVocabulary: typeof setVocabulary;
  /** Navigation core (src/app/core/navigation, core/startup), called by the legacy adapters in src/nucleo (v2.426.0). */
  readonly nav: typeof nav;
  /** Core services (src/app/core, src/app/services), called by the legacy adapters in src/nucleo and src/servicios. */
  readonly core: typeof coreServices;
  /** The legacy layers 050–079 folded into src/app/core/legacy-c (v2.425.0): their start functions and the adapters they call. */
  readonly legacyC: typeof legacyC;
  /** The legacy layers 080–161 folded into src/app/core/layers (v2.424.0): installed from their legado files, in load order. */
  readonly layers: typeof layers;
  /** The last pieces moved out of src/pantallas, src/componentes and servicios/camara.js (v2.427.0), called by their legacy adapters. */
  readonly leftovers: typeof leftovers;
  /** What legado 000–024 did (v2.424.0): each legado file calls it at its place in the load order. */
  readonly legacyA: typeof legacyA;
  /** The company settings core and the route plan card (src/app/core/settings, v2.428.0), called by pantallas/configuracion.js. */
  readonly settingsCore: typeof settingsCore;
  /** Content catalogs (help, manual, indicators, notifications, plans), built once in their final state (v2.427.0). */
  readonly content: typeof content;
  /** Shared components (src/app/components), called by the legacy adapters in src/componentes. */
  readonly components: typeof components & { readonly embeddedWindow: typeof embeddedWindow; readonly list: typeof listComponents; readonly filters: typeof filterComponents; readonly filtersPanel: typeof filtersPanel; readonly listBar: typeof listBar };
  /** Migrated screens, called by the legacy adapters (e.g. cargarInicio) until navigation moves to the router. */
  /** What legado 025–049 did (v2.424.0): each legado file calls its part at its place in the load order. */
  readonly legacyB: typeof legacyB;
  readonly screens: {
    readonly home: { readonly load: typeof home.loadWithCache; readonly renderSkeleton: typeof home.renderSkeleton; readonly paintIndicators: typeof paintIndicators; readonly openIndicatorSettings: typeof openIndicatorSettings };
    readonly agenda: typeof agenda;
    readonly accounts: typeof accounts;
    readonly events: typeof events;
    readonly settingsShell: typeof settingsShell;
    readonly settingsRest: typeof settingsRest;
    readonly portalHome: typeof portalHome;
    readonly settingsExtra: typeof settingsExtra;
    readonly settingsMore: typeof settingsMore;
    readonly settings: typeof settings;
    readonly access: typeof access;
    readonly routes: typeof routes;
    readonly orders: typeof orders;
    readonly products: typeof products;
    readonly billing: typeof billing;
    readonly platform: typeof platform;
    readonly portal: typeof portal;
    readonly analytics: typeof analytics;
    readonly visit: typeof visit;
    readonly commissions: typeof commissions;
    readonly customers: typeof customers;
    readonly opportunities: typeof opportunities;
    readonly quality: typeof quality;
    readonly manual: typeof manual;
    readonly importing: typeof importing;
    readonly purchases: typeof purchases;
    readonly tenders: typeof tenders;
    readonly equipment: typeof equipment;
    readonly surgeries: typeof surgeries;
    readonly cycle: typeof cycle;
  };
}

declare global {
  interface Window {
    delcos: DelcosCore;
  }
}

// Plan 7.3: the modules the lazy screens share with the core, before any of them can load
publishSharedModules();

const router = createRouter('inicio');
router.register(home.homeRoute);

window.delcos = {
  router,
  navigate,
  t,
  setLanguage,
  setVocabulary,
  nav,
  core: coreServices,
  legacyC,
  layers,
  leftovers,
  legacyA,
  settingsCore,
  content,
  components: { ...components, embeddedWindow, list: listComponents, filters: filterComponents, filtersPanel, listBar },
  legacyB,
  screens: {
    home: { load: home.loadWithCache, renderSkeleton: home.renderSkeleton, paintIndicators, openIndicatorSettings },
    agenda,
    accounts,
    events,
    settingsShell,
    settingsRest,
    portalHome,
    settingsExtra,
    settingsMore,
    settings,
    access,
    routes,
    orders,
    products,
    billing,
    platform,
    portal,
    analytics,
    visit,
    commissions,
    customers,
    opportunities,
    quality,
    manual,
    importing,
    purchases,
    tenders,
    equipment,
    surgeries,
    cycle,
  },
};

listenToPolicyViolations();
listenToSameCentre();
listenToDuplicates();
listenToDayPickers();
listenToStateSelects();
// The card itself, as before plan 7.3 cut D (the map was never wrapped by the global name abrirFicha)
listenToMapCards(id => { void openCard(id); });
listenToYourDay();
listenToCards();
listenToColumnResize();
cycle.listenToClassButtons(id => { void cycle.paintCardCycle(id); });
portal.listenToForm();
portal.listenToCentreDocs();
