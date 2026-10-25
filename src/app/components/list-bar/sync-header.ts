/**
 * The top of a list page: «⋯» and the main action in the header (on the phone, one round «+», the one of the open section), and the
 * band of indicators under the header (and its tabs, if any). Part of plSync (v2.236.0; v2.268.0; v2.421.0).
 */
import { isMobile } from '../../legacy/bridge';
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';
import { indicatorsHtml, loadIndicators } from './indicators';
import { icon } from './text';
import type { ListConfig } from './types';

const toggleIfDifferent = (element: Element, name: string, on: boolean): void => { if (element.classList.contains(name) !== on) element.classList.toggle(name, on); };

/** «⋯» (marked when there is nothing in it) and the main action with its text, or as the round «+» on the phone. */
function moreButton(section: HTMLElement, config: ListConfig): void {
  const actions = section.querySelector(':scope > .saludo')?.querySelector('.acts'); if (!actions) return;
  if (!actions.querySelector('.plmas')) actions.insertAdjacentHTML('afterbegin', `<button type="button" class="btn sec chico plmas" aria-label="${t('listBar.bar.moreActions')}" title="${t('listBar.bar.moreActions')}">${icon('ellipsis', '⋯')}</button>`);
  const more = actions.querySelector('.plmas'); if (more) toggleIfDifferent(more, 'plno', !config.mas().length);
}

function headerActions(section: HTMLElement, config: ListConfig): void {
  moreButton(section, config);
  const main = config.nuevo?.(), text = config.textoNuevo?.();
  if (!main || !text) return;
  if (!isMobile() && !main.classList.contains('fab') && (main.textContent ?? '').trim() !== text) main.innerHTML = `${icon('plus')} ${escapeHtml(text)}`;
  if (isMobile() && !main.dataset.plfab) {
    main.dataset.plfab = '1'; main.classList.add('fab'); main.dataset.txt = text; main.setAttribute('aria-label', text); main.innerHTML = icon('plus'); section.appendChild(main);
  }
}

/** Phone: a single «+», the one of the open section (when changing section, the previous one's stayed). */
function sectionFab(section: HTMLElement, key: string): void {
  const main = [...section.querySelectorAll<HTMLElement>(':scope > .saludo .acts > .btn:not(.sec):not(.htbtn), :scope > .fab')]
    .find(button => /^\s*\+/.test(button.dataset.txt ? '+' : button.textContent ?? '') && (button.classList.contains('fab') ? button.dataset.plsec === key || !button.dataset.plsec : true));
  if (!main) return;
  if (!main.classList.contains('fab')) {
    main.dataset.txt = (main.textContent ?? '').replace('+', '').trim(); main.classList.add('fab'); main.setAttribute('aria-label', main.dataset.txt); main.innerHTML = icon('plus'); section.appendChild(main);
  }
  main.dataset.plsec = key;
  section.querySelectorAll(':scope > .fab').forEach(fab => { toggleIfDifferent(fab, 'plfuera', fab !== main); });
}

function newBand(tab: string, config: ListConfig): HTMLElement {
  const box = document.createElement('div'); box.className = `plkpis${config.banda ? ' plbanda' : ''}`;
  if (config.kpis) box.innerHTML = indicatorsHtml(tab);
  return box;
}

/** The band of indicators (or the screen's own band, e.g. Operativa de Pedidos) under the header. */
function band(section: HTMLElement, tab: string, config: ListConfig, anchor: Element | null): void {
  const existing = section.querySelector<HTMLElement>(':scope > .plkpis');
  if (!config.kpis && !config.banda) { existing?.remove(); return; }
  const box = existing ?? newBand(tab, config);
  if (!box.isConnected) { if (anchor) anchor.after(box); else section.prepend(box); }
  if (config.kpis) { loadIndicators(tab); box.querySelectorAll<HTMLElement>('[data-plk]').forEach(button => { toggleIfDifferent(button, 'on', config.kpiOn(button.dataset.plk ?? '')); }); }
  if (config.banda) { const own = document.getElementById(config.banda); if (own && own.parentElement !== box) box.appendChild(own); }
}

/** The header part of the page; returns where the bar goes (under the tabs, if any, or the header). */
export function syncHeader(section: HTMLElement, tab: string, config: ListConfig, key: string): Element | null {
  headerActions(section, config);
  if (config.rejilla && isMobile()) sectionFab(section, key);
  const anchor = section.querySelector(':scope > .subnav') ?? section.querySelector(':scope > .saludo');
  band(section, tab, config, anchor);
  return anchor;
}

export { toggleIfDifferent };
