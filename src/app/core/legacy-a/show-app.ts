/**
 * Entering the platform with the person's profile (legado 018, v2.424.0): what used to be 21 layers added version by version, in
 * the same order. mostrarAppBase stays as an adapter (legado 072 wraps it as mostrarApp).
 */
import { showAppLegacy, type Profile } from '../../legacy/legado-a-bridge';
import { t } from '../../i18n';
import { orFallback } from '../../services/values';
import { fromIsoDate, todayIso } from '../../services/dates';
import { preloadChunks } from '../lazy/load';
import { navigationStore } from '../navigation/store';

const ADDED_INDICATORS = ['uds_mes', 'prescriptores', 'citas_7d', 'sin_visita_60'];
const MORNING_UNTIL = 13, AFTERNOON_UNTIL = 20, START_DELAY_MS = 50, BELL_DELAY_MS = 800, DAY_NOTICES_DELAY_MS = 1500;
const LANGUAGE_KEY = 'app-idioma', LANGUAGE_RELOAD_KEY = 'app-idioma-recarga', DEFAULT_LANGUAGE = 'es';
const byId = (id: string): HTMLElement | null => document.getElementById(id);
const setText = (id: string, text: string): void => { const element = byId(id); if (element) element.textContent = text; };

/** 2. The profile's language (at most one reload per session to apply it); false when the page reloads. */
function applyLanguage(language: string): boolean {
  let saved = DEFAULT_LANGUAGE; try { saved = orFallback(localStorage.getItem(LANGUAGE_KEY), DEFAULT_LANGUAGE); } catch { /* no storage */ }
  if (language !== saved) {
    let already = false; try { already = sessionStorage.getItem(LANGUAGE_RELOAD_KEY) === language; } catch { /* no storage */ }
    try { localStorage.setItem(LANGUAGE_KEY, language); sessionStorage.setItem(LANGUAGE_RELOAD_KEY, language); } catch { /* no storage */ }
    if (!already) { location.reload(); return false; }
  }
  showAppLegacy.prepareLanguage(language);
  return true;
}

/** 3. The saved indicators of Inicio are completed with those added later. */
function completeIndicators(preferences: Profile['preferencias']): void {
  const indicators = preferences?.kpis;
  if (!Array.isArray(indicators) || !indicators.length) return;
  ADDED_INDICATORS.forEach(id => { if (!indicators.some(item => item.id === id)) indicators.push({ id, on: true, t: '' }); });
  showAppLegacy.indicatorCatalog().forEach(item => { if (!indicators.some(saved => saved.id === item.id)) indicators.push({ id: item.id, on: false, t: '' }); });
}

function greeting(): string {
  const hour = new Date().getHours();
  return t(hour < MORNING_UNTIL ? 'legacyA.showApp.morning' : hour < AFTERNOON_UNTIL ? 'legacyA.showApp.afternoon' : 'legacyA.showApp.evening');
}

/** 4. The person's data and the main screen. */
function paintFrame(profile: Profile): void {
  showAppLegacy.setProfile(profile);
  byId('bootsplash')?.classList.add('hide');
  byId('login')?.classList.add('hide');
  byId('app')?.classList.remove('hide');
  setText('av', showAppLegacy.initials(profile.nombre));
  setText('uname', showAppLegacy.firstName(profile.nombre));
  setText('umnom', profile.nombre);
  setText('umrol', `${profile.rol} · ${profile.email}`);
  setText('hola', `${greeting()}, ${showAppLegacy.firstName(profile.nombre)}`);
  setText('hoyfecha', showAppLegacy.longDate(fromIsoDate(todayIso())).replace(/^./, letter => letter.toUpperCase()));
  byId('nuevoBtn')?.classList.toggle('hide', !showAppLegacy.canCreate());
  byId('dupBtn')?.classList.toggle('hide', !showAppLegacy.can('administrar'));
  document.querySelectorAll('#nav [data-t="ventas"], #nav [data-t="pacientes"], #nav [data-t="productos"]').forEach(button => { button.classList.toggle('hide', !showAppLegacy.seesSales()); });
}

function firstTimeLoads(): void {
  if (showAppLegacy.appVisible()) return;
  showAppLegacy.setAppVisible();
  showAppLegacy.loadCatalogs(); showAppLegacy.paintRouteBar(); showAppLegacy.loadHome(); showAppLegacy.loadFilters();
}

/** 5. Bottom bar, «Entrar como», manual and modules by permissions. */
function paintMenus(): void {
  showAppLegacy.paintImpersonationBar();
  showAppLegacy.paintBottomBar();
  if (!byId('manbtn')) document.querySelector('[data-u="cfg"]')?.insertAdjacentHTML('beforebegin', `<button data-u="manual" id="manbtn">${t('legacyA.showApp.manual')}</button>`);
  document.querySelectorAll('[data-t="facturacion"]').forEach(button => { button.classList.toggle('hide', !showAppLegacy.seesEverything()); });
  showAppLegacy.applyMenuPermissions();
}

/** 6. Professionals with access only see their report. */
function professionalPortal(): void {
  const portal = showAppLegacy.can('portal_prescriptor');
  document.body.classList.toggle('modo-medico', portal);
  if (!portal) return;
  document.querySelectorAll('nav.main [data-t]').forEach(button => { button.classList.add('hide'); });
  let report = document.querySelector('nav.main [data-t="informe"]');
  if (!report) {
    const label = t(showAppLegacy.can('portal_centro') ? 'legacyA.showApp.myCentre' : 'legacyA.showApp.myReport');
    document.querySelector('nav.main .in')?.insertAdjacentHTML('afterbegin', `<button data-t="informe" aria-current="page">${label}</button>`);
    report = document.querySelector('nav.main [data-t="informe"]');
  }
  report?.classList.remove('hide');
  if (!byId('mdavisos')) byId('ubtn')?.insertAdjacentHTML('beforebegin', `<button class="mdavisos" id="mdavisos" aria-label="${t('legacyA.showApp.notices')}"></button>`);
  showAppLegacy.refreshBell();
  byId('q')?.closest('.gsearch')?.classList.add('hide');
  setTimeout(() => { showAppLegacy.goTo('informe'); }, 0);
}

/** 7. User menu and the company's brand. */
function userMenu(): void {
  document.querySelectorAll('[data-u="adm"]').forEach(button => { button.classList.add('hide'); });
  showAppLegacy.applyBrand();
  const admin = showAppLegacy.can('administrar');
  document.querySelector('[data-u="plan"]')?.classList.toggle('hide', !admin);
  document.querySelector('[data-u="empresa"]')?.classList.toggle('hide', !admin);
}

/**
 * The first screen is another one (the one before F5, or the preferred start screen, such as the Agenda of the sales reps): Inicio,
 * painted underneath, does not show for a moment before it (pantallas sin fantasmas). If the switch does not happen (no permission),
 * Inicio shows as usual.
 */
function startElsewhere(go: () => void): void {
  const home = byId('v-inicio');
  home?.classList.add('hide');
  setTimeout(() => { go(); if (navigationStore.screen === 'inicio') home?.classList.remove('hide'); }, START_DELAY_MS);
}

/** 8. Notifications, preferred start screen (or the one before F5) and the summary of the day. */
function startScreen(first: boolean, start: string | undefined): void {
  setTimeout(() => { showAppLegacy.refreshBell(); }, BELL_DELAY_MS);
  // v2.111.0: after F5 it goes back to the screen it was on (Ctrl+F5 starts from scratch, on Inicio)
  const afterF5 = first ? showAppLegacy.screenAfterF5() : null;
  if (afterF5) startElsewhere(() => { showAppLegacy.backAfterF5(afterF5); });
  else if (first && start && start !== 'inicio' && showAppLegacy.moduleAllowed(start)) startElsewhere(() => { showAppLegacy.goTo(start); });
  if (!showAppLegacy.can('portal_prescriptor')) setTimeout(() => { showAppLegacy.dayNotices(); }, DAY_NOTICES_DELAY_MS);
  // Plan 7.3: the code of the first screen, if it is loaded on first use, starts coming now; the other lazy screens when idle
  if (first) preloadChunks(afterF5 ? (afterF5 as { t?: string }).t : start);
}

/** 9. Translation, icons and menu order. */
function finishMenu(): void {
  showAppLegacy.translatePage();
  const manual = byId('manbtn');
  if (manual && !manual.querySelector('svg')) manual.insertAdjacentHTML('afterbegin', `${showAppLegacy.bookIcon()} `);
  setTimeout(() => { showAppLegacy.menuIcons(); }, 0);
  setTimeout(() => { showAppLegacy.orderMenu(); showAppLegacy.qualityButton(); }, 0);
}

/** Shows the platform for `profile`. */
export function showApp(profile: Profile): void {
  const preferences = profile.preferencias ?? {};
  // 1. With the password recovery link the platform does not open
  if (showAppLegacy.recovering()) { showAppLegacy.recoveryScreen(); return; }
  if (!applyLanguage(orFallback(preferences.idioma, DEFAULT_LANGUAGE))) return;
  const first = !showAppLegacy.appVisible();
  document.body.classList.remove('sin-sesion');
  completeIndicators(preferences);
  paintFrame(profile);
  firstTimeLoads();
  byId('fcomwrap')?.classList.toggle('hide', !showAppLegacy.seesEverything());
  if (showAppLegacy.seesEverything()) showAppLegacy.loadSalesTeam();
  showAppLegacy.loadSettings();
  if (showAppLegacy.inTestEnvironment()) showAppLegacy.paintTestStrip();
  paintMenus();
  professionalPortal();
  userMenu();
  startScreen(first, preferences.inicio);
  finishMenu();
}
