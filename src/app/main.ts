/**
 * Entry point of the new code (src/app). esbuild bundles it into src/generated/core.js, which runs first in app.js.
 * While screens migrate, the legacy code (src/legado) reaches the new services through `window.delcos`.
 */
import { createRouter, type Router } from './core/router';
import { setLanguage, setVocabulary, t } from './i18n';

export interface DelcosCore {
  readonly router: Router;
  readonly t: typeof t;
  readonly setLanguage: typeof setLanguage;
  readonly setVocabulary: typeof setVocabulary;
}

declare global {
  interface Window {
    delcos: DelcosCore;
  }
}

window.delcos = {
  router: createRouter('inicio'),
  t,
  setLanguage,
  setVocabulary,
};
