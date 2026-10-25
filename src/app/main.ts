/**
 * Entry point of the new code (src/app). esbuild bundles it into src/generated/core.js, which runs first in app.js.
 * While screens migrate, the legacy code (src/legado) reaches the new services and screens through `window.delcos`.
 */
import * as components from './components';
import { createRouter, type Router } from './core/router';
import { navigate } from './core/navigation';
import { setLanguage, setVocabulary, t } from './i18n';
import * as accounts from './screens/accounts';
import * as agenda from './screens/agenda';
import * as events from './screens/events';
import * as settingsRest from './screens/settings/rest';
import * as portalHome from './screens/home/portal-home';
import { listenToDuplicates } from './screens/accounts/duplicates';
import { listenToDayPickers } from './screens/accounts/editor-form';
import { listenToStateSelects } from './screens/accounts/status';
import * as settingsExtra from './screens/settings/extra';
import * as listComponents from './components/list';
import * as filterComponents from './components/filters';
import * as filtersPanel from './components/filters-panel';
import * as settingsMore from './screens/settings/more';
import * as settings from './screens/settings';
import * as access from './screens/access';
import { listenToMapCards } from './screens/accounts/map';
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
import { listenToSameCentre } from './screens/agenda/same-centre';
import { listenToYourDay } from './screens/agenda/your-day';
import { listenToCards } from './screens/agenda/your-day/card-buttons';
import { listenToColumnResize } from './screens/accounts/list/column-panel';
import { paintHeader as paintAccountsHeader } from './screens/accounts/list/table';
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
  /** Shared components (src/app/components), called by the legacy adapters in src/componentes. */
  readonly components: typeof components & { readonly list: typeof listComponents; readonly filters: typeof filterComponents; readonly filtersPanel: typeof filtersPanel };
  /** Migrated screens, called by the legacy adapters (e.g. cargarInicio) until navigation moves to the router. */
  readonly screens: {
    readonly home: { readonly load: typeof home.load; readonly renderSkeleton: typeof home.renderSkeleton; readonly paintIndicators: typeof paintIndicators; readonly openIndicatorSettings: typeof openIndicatorSettings };
    readonly agenda: typeof agenda;
    readonly accounts: typeof accounts;
    readonly events: typeof events;
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

const router = createRouter('inicio');
router.register(home.homeRoute);

window.delcos = {
  router,
  navigate,
  t,
  setLanguage,
  setVocabulary,
  components: { ...components, list: listComponents, filters: filterComponents, filtersPanel },
  screens: {
    home: { load: home.load, renderSkeleton: home.renderSkeleton, paintIndicators, openIndicatorSettings },
    agenda,
    accounts,
    events,
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

listenToSameCentre();
listenToDuplicates();
listenToDayPickers();
listenToStateSelects();
listenToMapCards(id => { void accounts.openAccountCard(id); });
listenToYourDay();
listenToCards();
listenToColumnResize(paintAccountsHeader);
analytics.listenToVisitOrdersViews();
cycle.listenToClassButtons(id => { void cycle.paintCardCycle(id); });
portal.listenToForm();
portal.listenToCentreDocs();
