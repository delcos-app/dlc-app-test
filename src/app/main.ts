/**
 * Entry point of the new code (src/app). esbuild bundles it into src/generated/core.js, which runs first in app.js.
 * While screens migrate, the legacy code (src/legado) reaches the new services and screens through `window.delcos`.
 */
import { createRouter, type Router } from './core/router';
import { navigate } from './core/navigation';
import { setLanguage, setVocabulary, t } from './i18n';
import * as accounts from './screens/accounts';
import * as agenda from './screens/agenda';
import { listenToSameCentre } from './screens/agenda/same-centre';
import { listenToYourDay } from './screens/agenda/your-day';
import { listenToCards } from './screens/agenda/your-day/card-buttons';
import { listenToColumnResize } from './screens/accounts/list/column-panel';
import { paintHeader as paintAccountsHeader } from './screens/accounts/list/table';
import * as home from './screens/home';
import { paintIndicators } from './screens/home/indicators';

export interface DelcosCore {
  readonly router: Router;
  /** Change screen: the legacy ir() calls this. */
  readonly navigate: typeof navigate;
  readonly t: typeof t;
  readonly setLanguage: typeof setLanguage;
  readonly setVocabulary: typeof setVocabulary;
  /** Migrated screens, called by the legacy adapters (e.g. cargarInicio) until navigation moves to the router. */
  readonly screens: {
    readonly home: { readonly load: typeof home.load; readonly renderSkeleton: typeof home.renderSkeleton; readonly paintIndicators: typeof paintIndicators };
    readonly agenda: typeof agenda;
    readonly accounts: typeof accounts;
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
  screens: {
    home: { load: home.load, renderSkeleton: home.renderSkeleton, paintIndicators },
    agenda,
    accounts,
  },
};

listenToSameCentre();
listenToYourDay();
listenToCards();
listenToColumnResize(paintAccountsHeader);
