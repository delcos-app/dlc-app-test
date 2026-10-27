/**
 * What every screen gets whenever it changes: the header buttons in the same order with «Filtros y columnas» last (v2.55.0/v2.57.0,
 * v2.140.0), one help next to the Cuentas title, the configured name in every text, «Ver más» lists, and the observers of Cuentas,
 * Facturación and Analítica. Folded from legado 053, 056, 057, 058, 060, 073 and 074 (v2.425.0).
 */
import { t } from '../../i18n';
import { byId, closestTo, currentSection, observe, onMainChanges } from './dom';
import * as legacyFreeCoreSettings from '../settings';
import * as legacyFreeCoreLeftovers from '../leftovers';
import { navigationStore } from '../navigation/store';
import * as legacyFreeComponentsFiltersPanel from '../../components/filters-panel';
import * as legacyFreeScreensAccounts from '../../screens/accounts';
import * as legacyFreeScreensBilling from '../../screens/billing';
import * as legacyFreeCoreNavigationApi from '../navigation/api';
import * as legacyFreeComponents from '../../components';

const MIN_DESKTOP = 900;
const ACTION_WEIGHT = 3, TOOLS_WEIGHT = 4;

function buttonWeight(button: HTMLElement): number {
  const isView = Boolean(button.dataset.ag) && button.dataset.ag !== 'nueva';
  if (button.classList.contains('htbtn') || button.id === 'dirtools') return TOOLS_WEIGHT;
  if (button.matches('.btn:not(.sec)') && !button.classList.contains('icobtn') && !button.classList.contains('iniact') && !isView) return ACTION_WEIGHT;
  return button.matches('select') ? 0 : 1;
}

/** Header: secondary → main action → «Filtros y columnas» (the last: the same place on every screen). The legacy ordenarBotones. */
export function orderButtons(section: Element): void {
  section.querySelectorAll('.saludo .acts, #dircab .acts').forEach(actions => {
    const buttons = [...actions.children].filter((child): child is HTMLElement => child.matches('button, a.btn, select'));
    const ordered = [...buttons].sort((first, second) => buttonWeight(first) - buttonWeight(second));
    if (ordered.some((button, index) => button !== buttons[index])) ordered.forEach(button => actions.appendChild(button));
    const tools = actions.querySelector(':scope > #dirtools'), gap = actions.querySelector(':scope > .ai-hueco');
    if (tools && gap && gap.nextElementSibling !== tools) actions.insertBefore(gap, tools);
    actions.querySelectorAll(':scope > .ai-dir').forEach(help => { help.remove(); });
  });
}

function headerActions(greeting: Element): Element | null {
  if (!greeting.querySelector(':scope > .acts')) greeting.insertAdjacentHTML('beforeend', '<div class="acts htacts"></div>');
  return greeting.querySelector(':scope > .acts');
}

function moveToolsButton(section: Element): void {
  const button = section.querySelector('.htbtn'), greeting = section.querySelector('.saludo');
  if (!button || !greeting) return;
  const actions = headerActions(greeting);
  if (!actions) return;
  actions.classList.add('htacts');
  if (button.parentElement === actions) return;
  const before = button.parentElement; button.classList.remove('aderecha'); actions.appendChild(button);
  if (before?.classList.contains('tbarra') && !before.children.length && !(before.textContent ?? '').trim()) before.remove();
  else if (before?.classList.contains('conbtn')) before.classList.remove('conbtn');
}

/** v2.140.0: «Filtros y columnas» in the header of each screen, next to the main action (the legacy barraTabla). */
export function placeTableBar(section: Element): void {
  // v2.142.0: also on the phone
  moveToolsButton(section);
  // Cuentas: its «Filtros y columnas» (#dirtools) also goes next to «Crear nuevo» (on the phone it stays next to «Cerca de mí»)
  const tools = section.id === 'v-directorio' && innerWidth >= MIN_DESKTOP ? byId('dirtools') : null, actions = document.querySelector('#dircab .acts');
  if (!tools || !actions || tools.parentElement === actions) return;
  tools.classList.remove('aderecha');
  // The «i» of the bar goes before #dirtools if there is none: a hidden gap keeps it out of the header
  actions.insertAdjacentHTML('beforeend', '<span class="ai ai-hueco hide" aria-hidden="true"></span>');
  actions.appendChild(tools);
}

/** v2.55.0 and v2.57.0: on every screen change, the header order, the chips, the table bar and the order again. */
export function arrangeEveryScreen(): void {
  onMainChanges(() => { const section = currentSection(); if (!section) return; orderButtons(section); legacyFreeComponentsFiltersPanel.paintChips(section); });
}

export function arrangeTableBars(): void {
  onMainChanges(() => { const section = currentSection(); if (section) { placeTableBar(section); orderButtons(section); } });
}

/** v2.57.0: only one help next to the Cuentas title. */
export function keepOneTitleHelp(): void {
  observe(document.querySelector('main'), () => {
    document.querySelector('#dircab h1')?.querySelectorAll('.ai').forEach((help, index) => { if (index) help.remove(); });
  }, { childList: true, subtree: true });
}

/** v2.59.0: the configured name in every text that appears. */
export function nameInEveryText(): void {
  observe(document.body, mutations => { mutations.forEach(mutation => { mutation.addedNodes.forEach(node => { legacyFreeCoreSettings.nameInTexts((node instanceof Element ? node : node.parentElement)); }); }); },
    { childList: true, subtree: true });
  legacyFreeCoreSettings.nameInTexts(document.body);
}

/** v2.52.0: «Ver más» shows the rest of a list where it said «y N más». */
export function listenToSeeMore(): void {
  document.addEventListener('click', event => {
    const button = closestTo(event.target, '[data-vermas]'); if (!button) return;
    const list = button.closest('.lista') ?? button.parentElement;
    list?.querySelectorAll(':scope > .extra').forEach(item => { item.classList.remove('extra'); });
    button.remove();
  });
}

/** v2.56.0 and later: Cuentas, Facturación and Analítica repaint their own parts when their section changes. */
export function watchModuleSections(): void {
  observe(byId('v-directorio'), () => { if (navigationStore.screen === 'directorio') legacyFreeScreensAccounts.refreshBar(); }, { childList: true, subtree: true, characterData: true });
  observe(byId('v-facturacion'), () => { if (navigationStore.screen === 'facturacion') legacyFreeCoreLeftovers.billingSettingsSubnav(); }, { childList: true, subtree: true });
}

export function watchAnalyticsChannel(): void {
  observe(byId('v-analitica'), () => { if (navigationStore.screen === 'analitica' && !byId('ancanal')) void legacyFreeComponents.channelChart(); }, { childList: true, subtree: true });
}

export function watchBillingSettings(): void {
  observe(byId('v-facturacion'), () => { legacyFreeScreensBilling.arrangeBilling(); }, { childList: true, subtree: true });
}

function renameIn(node: Node): void {
  const homeOld = t('legacyC.kpis.homeOld'), homeNew = t('legacyC.kpis.homeNew'), old = t('legacyC.kpis.old'), renamed = t('legacyC.kpis.new');
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const text = walker.currentNode, value = text.nodeValue ?? '', trimmed = value.trim();
    if (!trimmed.includes(homeOld) && trimmed !== old) continue;
    const renamedHome = value.replace(homeOld, homeNew);
    text.nodeValue = renamedHome.trim() === old ? renamedHome.replace(old, renamed) : renamedHome;
  }
}

/** v2.56.0: «Indicadores» is called «KPIs» wherever it appears. */
export function renameIndicators(): void {
  observe(document.body, mutations => {
    mutations.forEach(mutation => { mutation.addedNodes.forEach(node => { if (node.nodeType === Node.ELEMENT_NODE) renameIn(node); }); });
  }, { childList: true, subtree: true });
}

/** v2.143.0: the page action goes up to the header on every change. */
export function raisePageAction(): void {
  observe(document.querySelector('main'), () => {
    if (ACCION_PAG_PEND) return; ACCION_PAG_PEND = true;
    queueMicrotask(() => { ACCION_PAG_PEND = false; legacyFreeCoreNavigationApi.raisePageAction(); });
  }, { childList: true, subtree: true });
}
