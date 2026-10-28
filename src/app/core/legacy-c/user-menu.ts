/**
 * The user menu: Mi perfil and Plan (v2.46.0), Empresa (v2.46.1) and «Reportar un problema» (v2.52.0); each page entry opens its own
 * page (v2.53.0) and so does Organización (v2.117.0); a press in the menus marks that the screen comes from the menu (v2.139.0).
 * Folded from legado 050, 051, 053, 054, 072 and 073 (v2.425.0). The click listeners of 050 and 051 never ran (the capture listener of
 * 054 stops those clicks first) and are gone.
 */
import { t } from '../../i18n';
import { closestTo } from './dom';
import * as legacyFreeCoreServices from '../services';
import { navigate } from '../navigation';

const hideUserMenus = (): void => { document.querySelectorAll('.umenu, #umenu').forEach(menu => { menu.classList.add('hide'); }); };

/** v2.46.0: Mi perfil before Configuración, Plan after it, and icons on Configuración and Salir. */
export function addProfileAndPlan(): void {
  const settings = document.querySelector('[data-u="cfg"]'); if (!settings) return;
  if (!document.querySelector('[data-u="perfil"]')) settings.insertAdjacentHTML('beforebegin', `<button data-u="perfil">${svgIco(ICON_NOM.user ?? '')} ${t('legacyC.userMenu.profile')}</button>`);
  settings.insertAdjacentHTML('afterend', `<button data-u="plan" class="hide">${svgIco(ICON_NOM['credit-card'] ?? '')} ${t('legacyC.userMenu.plan')}</button>`);
  settings.insertAdjacentHTML('afterbegin', `${svgIco(ICON_NOM.settings ?? '')} `);
  document.querySelector('[data-u="salir"]')?.insertAdjacentHTML('afterbegin', `${svgIco(ICON_NOM['log-out'] ?? ICON_NOM.lock ?? '')} `);
}

/** v2.46.1: Empresa before Plan. */
export function addCompany(): void {
  const plan = document.querySelector('[data-u="plan"]'); if (!plan || document.querySelector('[data-u="empresa"]')) return;
  plan.insertAdjacentHTML('beforebegin', `<button data-u="empresa" class="hide">${svgIco(ICON_NOM.building ?? '')} ${t('legacyC.userMenu.company')}</button>`);
}

/** v2.52.0: «Reportar un problema» before Salir. */
export function addReportProblem(): void {
  const signOut = document.querySelector('[data-u="salir"]'); if (!signOut || document.querySelector('[data-u="reportar"]')) return;
  signOut.insertAdjacentHTML('beforebegin', `<button data-u="reportar">${svgIco(ICON_NOM.bug ?? '')} ${t('legacyC.userMenu.report')}</button>`);
  document.addEventListener('click', event => { if (closestTo(event.target, '[data-u="reportar"]')) legacyFreeCoreServices.report.reportProblem(); });
}

/** Opens a page from the user menu before anything else hears the click (v2.53.0: perfil, empresa, plan; v2.117.0: organización). */
function openPageFromMenu(selector: string): void {
  document.addEventListener('click', event => {
    const button = closestTo(event.target, selector); if (!button) return;
    event.stopImmediatePropagation(); event.preventDefault();
    hideUserMenus();
    navigate(button.dataset.u ?? '');
  }, true);
}

export const openOwnPages = (): void => { openPageFromMenu('[data-u="perfil"], [data-u="empresa"], [data-u="plan"]'); };
export const openOrganizationPage = (): void => { openPageFromMenu('[data-u="organizacion"]'); };

/** v2.139.0: a press in the menus marks that the next screen comes from the menu (only during that click). */
export function markMenuNavigation(): void {
  document.addEventListener('click', event => {
    if (closestTo(event.target, 'nav.main [data-t], #bnav [data-t], [data-bm]')) { IR_DESDE_MENU = true; setTimeout(() => { IR_DESDE_MENU = false; }, 0); }
  }, true);
}
