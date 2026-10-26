/**
 * The screen switch itself (the legacy irBase, legado 001, v2.424.0): the rules before it (redirections, blocks, what happens
 * before and after) are in core/navigation; this is the last step. In order: destinations that do not open or are redirected,
 * cancelling what the previous screen had pending, the destination by profile and permissions, the switch, loading the module and
 * the loading indicator. irBase stays as an adapter (core/navigation calls it by that name).
 */
import { notices } from '../../legacy/bridge';
import { switchLegacy } from '../../legacy/legado-a-bridge';
import { t } from '../../i18n';
import { markCurrent } from '../navigation/current';

const LOADER_MAX_MS = 8000, LOADER_MIN_MS = 300, LOADER_STEP_MS = 80, QUIET_STEPS = 3;
const PROFESSIONAL_SCREENS = ['informe', 'manual', 'config'];

/** 1. Destinations that do not open or that are redirected (null: it does not open). */
function redirect(target: string): string | null {
  if (switchLegacy.isModule(target) && switchLegacy.hasProfile() && switchLegacy.moduleAllowedV2400(target) && !switchLegacy.planIncludes(target)) {
    switchLegacy.planNotice(target);   // outside the subscribed plan
    return null;
  }
  if (target === 'admin') { switchLegacy.openAdminSection(); return 'config'; }   // Administración lives in Configuración
  return target;
}

/** 2. Everything the previous screen had pending is cancelled. */
function cancelPending(target: string): void {
  document.querySelectorAll('main > section.cargando').forEach(section => { section.classList.remove('cargando'); });
  switchLegacy.clearPending();
  if (target !== 'config') switchLegacy.leavePanel();
  switchLegacy.abortNavigation();
  switchLegacy.closeSelector();
}

/** 3. Destination by profile and permissions. */
function allowedTarget(target: string): string {
  if (switchLegacy.isProfessionalPortal() && !PROFESSIONAL_SCREENS.includes(target)) return 'informe';
  if (switchLegacy.isModule(target) && !switchLegacy.moduleAllowed(target)) {
    notices.toast(t('legacyA.navigation.noPermission'), true);
    return switchLegacy.moduleAllowed('inicio') ? 'inicio' : 'agenda';
  }
  return target;
}

/** 4. The switch of screen. */
function show(target: string): void {
  switchLegacy.rememberPrevious(target);
  document.getElementById('tools')?.classList.remove('abierto');
  if (target !== 'agenda') switchLegacy.forgetViewedAgenda();
  switchLegacy.setScreen(target);
  document.querySelectorAll<HTMLElement>('nav.main [data-t], #bnav [data-t]').forEach(button => { markCurrent(button, button.dataset.t === target); });
  document.querySelectorAll('main > section').forEach(section => { section.classList.toggle('hide', section.id !== `v-${target}`); });
  window.scrollTo({ top: 0 });
}

/** 6. Loading indicator: removed when the module stops asking for data (8 seconds at most). */
function watchLoading(target: string): void {
  const section = document.getElementById(`v-${target}`);
  if (!section || switchLegacy.isProfessionalPortal()) return;
  section.classList.add('cargando');
  const start = performance.now();
  let quiet = 0;
  const timer = setInterval(() => {
    if (switchLegacy.screen() !== target) { clearInterval(timer); section.classList.remove('cargando'); return; }
    quiet = switchLegacy.pending() === 0 ? quiet + 1 : 0;
    const elapsed = performance.now() - start;
    if ((quiet >= QUIET_STEPS && elapsed > LOADER_MIN_MS) || elapsed > LOADER_MAX_MS) {
      clearInterval(timer);
      requestAnimationFrame(() => { section.classList.remove('cargando'); });
    }
  }, LOADER_STEP_MS);
}

/** Switches to `screen`. */
export function switchScreen(screen: string): void {
  const redirected = redirect(screen);
  if (redirected === null) return;
  cancelPending(redirected);
  const target = allowedTarget(redirected);
  show(target);
  switchLegacy.loadModule(target);   // 5. loading the module
  switchLegacy.paintBottomBar();
  watchLoading(target);
}
