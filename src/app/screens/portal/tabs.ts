/** The tabs inside the portal page («Resumen», «Mi ficha», «Material y dudas»…). Migrated from the legacy pmTab (v2.413.0). */
import { t, type MessageKey } from '../../i18n';
import { portalState } from './model';

/** Shows tab `key` and hides the others. */
export function showTab(key: string): void {
  portalState.tab = key;
  document.querySelectorAll<HTMLElement>('#v-informe [data-pmt]').forEach(button => { button.classList.toggle('on', button.dataset.pmt === key); button.setAttribute('aria-selected', String(button.dataset.pmt === key)); });
  document.querySelectorAll<HTMLElement>('#v-informe [data-pmp]').forEach(panel => { panel.hidden = panel.dataset.pmp !== key; });
  window.scrollTo({ top: 0 });
}

/** The tab bar: each tab with its dot for «something missing». */
export const tabBar = (tabs: readonly (readonly [string, MessageKey])[]): string =>
  `<div class="pmtabs" role="tablist">${tabs.map(([key, label]) =>
    `<button type="button" role="tab" data-pmt="${key}" class="${portalState.tab === key ? 'on' : ''}" aria-selected="${String(portalState.tab === key)}">${t(label)}<span class="pmtpunto" hidden></span></button>`).join('')}</div>`;

/** A tab panel, hidden unless it is the current tab. */
export const tabPanel = (key: string, id: string, content: string): string =>
  `<div data-pmp="${key}" id="${id}" ${portalState.tab === key ? '' : 'hidden'}>${content}</div>`;

/** Tab buttons and the «Completar mi ficha»-style links inside a panel. */
export function bindTabs(box: ParentNode, attribute: 'pmt' | 'pmir'): void {
  box.querySelectorAll<HTMLElement>(`[data-${attribute}]`).forEach(button => { button.onclick = (): void => { showTab(button.dataset[attribute] ?? ''); }; });
}
