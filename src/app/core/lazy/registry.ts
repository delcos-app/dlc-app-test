/**
 * The registry of shared modules (plan 7.3, cut A): the core publishes, once and read-only, the modules the lazy chunks import
 * (manifest.ts, written by herramientas/bundle.mjs). A chunk reads them from window.__delcosModules instead of carrying its own copy,
 * so a module and its state exist only once. The name is the same in herramientas/bundle.mjs.
 */
import { sharedModules } from './manifest';

const REGISTRY_GLOBAL = '__delcosModules';

/** Called once by main.ts, after every module of the core has run (the namespaces are complete by then). */
export function publishSharedModules(): void {
  if (REGISTRY_GLOBAL in window) return;
  Object.defineProperty(window, REGISTRY_GLOBAL, { value: Object.freeze(sharedModules()), writable: false, configurable: false, enumerable: false });
}
