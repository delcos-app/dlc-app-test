/**
 * The side menu on desktop (v2.131.0): brand, groups, sections that can be hidden or are out of the plan (v2.16x), Configuración,
 * «Personalizar menú» and fold, the test-environment marker (v2.13x) and the tips. The legacy montarMenuLateralBase, Base2 and
 * montarMenuLateral are one function now (folded from legado 073 and 075, v2.425.0).
 */
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';
import { byId, observe } from './dom';
import * as legacyFreeCoreNavigationApi from '../navigation/api';
import * as legacyFreeCoreServices from '../services';
import { sessionStore } from '../session-store';
import { settingsStore } from '../../screens/settings/store';
import { navigationStore } from '../navigation/store';

interface MenuGroup { id: string; t: string; items: string[] }

const visible = (button: HTMLElement): boolean => getComputedStyle(button).display !== 'none';
const shownSection = (button: HTMLElement): boolean => !button.classList.contains('hide') && !button.classList.contains('mloculto') && button.dataset.t !== 'seguimiento' && visible(button);
const isPortal = (): boolean => { try { return ES_MEDICO(); } catch { return false; } };
const hiddenSections = (): string[] => (menuPrefs() as { ocultos?: string[] }).ocultos ?? [];

function wantsSideMenu(nav: HTMLElement): boolean {
  // With one section (professional or centre portal) there is no side bar: the usual header stays
  const shown = [...nav.querySelectorAll<HTMLElement>('button[data-t]')].filter(button => !button.classList.contains('hide') && button.dataset.t !== 'seguimiento' && button.style.display !== 'none'
    && (button.classList.contains('mloculto') || visible(button) || document.body.classList.contains('menulat')));
  // v2.135.0: the portal never has a side bar
  return menuEscritorio() && Boolean(sessionStore.profile) && !isPortal() && shown.length > 1;
}

function paintBrand(nav: HTMLElement): void {
  if (!nav.querySelector('.mlmarca')) {
    const logo = document.querySelector<HTMLImageElement>('header .logo')?.src ?? './logo-app.png';
    nav.insertAdjacentHTML('afterbegin', `<div class="mlmarca"><img src="${escapeHtml(logo)}" alt=""><b class="mllab"></b></div>`);
  }
  const brand = ((settingsStore.settings.marca) || {}) as { nombre?: string };
  const name = nav.querySelector('.mlmarca b'); if (name) name.textContent = brand.nombre ? brand.nombre : document.title;
}

function placeGroups(nav: HTMLElement): void {
  const fixed = MENU_FIJO as MenuGroup;
  [...(legacyFreeCoreNavigationApi.menuGroups() as MenuGroup[]), fixed].forEach(group => {
    let box = nav.querySelector(`.mlgrupo[data-g="${group.id}"]`);
    if (!box) {
      nav.insertAdjacentHTML('beforeend', `<div class="mlgrupo${group === fixed ? ' fijo' : ''}" data-g="${group.id}"><div class="mltit">${escapeHtml(group.t)}</div><div class="mlbs"></div></div>`);
      box = nav.querySelector(`.mlgrupo[data-g="${group.id}"]`);
    }
    if (!box) return;
    nav.appendChild(box);
    const buttons = box.querySelector('.mlbs');
    group.items.forEach(key => { const button = nav.querySelector(`button[data-t="${key}"]`); if (button) buttons?.appendChild(button); });
  });
}

function labelButtons(buttons: readonly HTMLElement[]): void {
  const hidden = hiddenSections(), fixed = (MENU_FIJO as MenuGroup).items;
  buttons.forEach(button => {
    button.classList.toggle('mloculto', hidden.includes(button.dataset.t ?? '') && !fixed.includes(button.dataset.t ?? '') && button.dataset.t !== 'inicio');
    // The text goes in its own label (hidden when folded) and the name is the tip on hover
    const texts = [...button.childNodes].filter(node => node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim());
    if (texts.length) {
      const text = texts.map(node => node.textContent ?? '').join('').trim(); texts.forEach(node => { node.remove(); });
      const label = button.querySelector('.mllab'); if (label) label.textContent = text; else button.insertAdjacentHTML('beforeend', `<span class="mllab">${escapeHtml(text)}</span>`);
    }
    button.dataset.tip = (button.querySelector('.mllab') ?? button).textContent?.trim() ?? '';
    // Folded, the label is hidden: the tip is also its accessible name (v2.438.0)
    button.setAttribute('aria-label', button.dataset.tip);
  });
}

function paintFooter(nav: HTMLElement): void {
  if (!nav.querySelector('.mlpie')) {
    nav.insertAdjacentHTML('beforeend', `<div class="mlpie">
      <button type="button" class="mlitem" id="mlcfg" data-tip="${t('legacyC.sideMenu.settings')}" aria-label="${t('legacyC.sideMenu.settings')}">${svgIco(ICON_NOM.settings ?? '')}<span class="mllab">${t('legacyC.sideMenu.settings')}</span></button>
      <button type="button" class="mlitem" id="mlpers" data-tip="${t('legacyC.sideMenu.customise')}" aria-label="${t('legacyC.sideMenu.customise')}">${svgIco(ICON_NOM['sliders-horizontal'] ?? '')}<span class="mllab">${t('legacyC.sideMenu.customise')}</span></button>
      <button type="button" class="mlplegar" id="mlplegar" aria-label="${t('legacyC.sideMenu.foldLabel')}">${svgIco(ICO_PLEGAR)}</button></div>`);
    const settings = byId('mlcfg'), customise = byId('mlpers'), fold = byId('mlplegar');
    if (settings) settings.onclick = (): void => { ir('config'); };
    if (customise) customise.onclick = (event): void => { event.stopPropagation(); menuPersonalizar(); };
    if (fold) fold.onclick = (): void => {
      const folded = !document.body.classList.contains('menupleg');
      try { localStorage.setItem('dlc-menu-plegado', folded ? '1' : '0'); } catch { /* private mode */ }
      document.body.classList.toggle('menupleg', folded); menuTip(null); navigationStore.menuSignature = ''; montarMenuLateral();
    };
  }
  const footer = nav.querySelector('.mlpie'); if (footer) nav.appendChild(footer);
  const userSettings = document.querySelector('#umenu [data-u="cfg"]');
  byId('mlcfg')?.classList.toggle('hide', !userSettings || userSettings.classList.contains('hide'));
  const fold = byId('mlplegar'); if (fold) fold.dataset.tip = t(document.body.classList.contains('menupleg') ? 'legacyC.sideMenu.unfold' : 'legacyC.sideMenu.fold');
}

const markEmptyGroups = (nav: HTMLElement): void => {
  nav.querySelectorAll('.mlgrupo').forEach(group => { group.classList.toggle('vacio', ![...group.querySelectorAll<HTMLElement>('button[data-t]')].some(shownSection)); });
};

function buildSideMenu(nav: HTMLElement): void {
  document.body.classList.toggle('menupleg', menuPlegado());
  const buttons = [...nav.querySelectorAll<HTMLElement>('button[data-t]')];
  // Signature: if nothing changed (buttons, permissions, preferences) nothing is redone (avoids loops with the observer)
  const signature = buttons.map(button => `${button.dataset.t ?? ''}${button.classList.contains('hide') ? '-' : '+'}${(button.textContent ?? '').trim()}`).join('|')
    + JSON.stringify(menuPrefs()) + String(document.body.classList.contains('menupleg'));
  if (signature === navigationStore.menuSignature && nav.querySelector('.mlmarca')) return;
  navigationStore.menuSignature = signature;
  paintBrand(nav); placeGroups(nav); labelButtons(buttons); markEmptyGroups(nav); paintFooter(nav);
}

/** v2.16x: sections out of the plan are hidden with a padlock class (only touched when it changes: the observer calls here again). */
function markOutOfPlan(nav: HTMLElement): void {
  const hidden = hiddenSections();
  nav.querySelectorAll<HTMLElement>('button[data-t]').forEach(button => {
    if (legacyFreeCoreServices.session.outOfPlan(button)) { if (!button.classList.contains('mlplan')) button.classList.add('mlplan'); if (!button.classList.contains('mloculto')) button.classList.add('mloculto'); }
    else if (button.classList.contains('mlplan')) { button.classList.remove('mlplan'); if (!hidden.includes(button.dataset.t ?? '')) button.classList.remove('mloculto'); }
  });
  markEmptyGroups(nav);
}

/** Builds the side menu (the legacy montarMenuLateral). */
export function mountSideMenu(): void {
  const nav = byId('nav');
  if (nav) {
    const side = wantsSideMenu(nav);
    document.body.classList.toggle('menulat', side);
    if (side) buildSideMenu(nav);
  }
  colocarIndPruebas();
  if (!nav || !document.body.classList.contains('menulat')) return;
  markOutOfPlan(nav);
}

/** The menu follows its buttons, the window size and the app classes; the tips follow the pointer. */
export function watchSideMenu(): void {
  document.addEventListener('mouseover', event => { const button = event.target instanceof Element ? event.target.closest<HTMLElement>('nav.main [data-tip]') : null; menuTip(button); });
  observe(byId('nav'), menuRehacer, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  addEventListener('resize', menuRehacer);
  observe(byId('app'), menuRehacer, { attributes: true, attributeFilter: ['class'] });
  menuRehacer();
}
