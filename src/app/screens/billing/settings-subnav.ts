/**
 * Facturación: its settings sections (series, fiscal data…) go under one «Configuración» button of the sub-menu, with their own
 * second row (and «Diseño del PDF» for administration). Migrated from the legacy subnavFacturacion of componentes/pestanas.js
 * (v2.427.0); the name stays as an adapter (the screen layout glue and the billing bridge call it). The section state (FSEC,
 * FAC_ULTIMA) and the list of settings sections stay in legacy.
 */
import { leftoversLegacy } from '../../legacy/leftovers-bridge';
import { t } from '../../i18n';

/** During the atomic reveal there is a frozen copy of the screen: the sub-menu goes in the real one (v2.75.0). */
const real = (selector: string): HTMLElement | undefined =>
  [...document.querySelectorAll<HTMLElement>(`#v-facturacion ${selector}`)].find(element => !element.closest('.congelada'));

function addSettingsButton(nav: HTMLElement): void {
  if (nav.querySelector('[data-faccfg]') || !leftoversLegacy.can('administrar')) return;
  nav.insertAdjacentHTML('beforeend', `<button data-faccfg="1">${leftoversLegacy.svgIcon(leftoversLegacy.namedIcon('settings'))} ${t('leftovers.billing.settings')}</button>`);
  const button = nav.querySelector<HTMLElement>('[data-faccfg]');
  if (button) button.onclick = (): void => { leftoversLegacy.setBillingSection(leftoversLegacy.lastBillingSettings()); leftoversLegacy.loadBilling(); };
}

function addSecondRow(nav: HTMLElement, sections: readonly (readonly [string, string])[]): void {
  const current = leftoversLegacy.billingSection();
  nav.insertAdjacentHTML('afterend', `<div class="cfgsubs faccfgsub">${sections.map(([key, title]) => `<button data-fsub="${key}" class="${key === current ? 'on' : ''}">${title}</button>`).join('')}</div>`);
  // v2.87.0: «Diseño del PDF» opens from the billing settings
  const row = real('.faccfgsub');
  if (row && leftoversLegacy.can('administrar') && !row.querySelector('[data-fpdf]')) row.insertAdjacentHTML('beforeend', `<button data-fpdf="1">${t('leftovers.billing.pdfDesign')}</button>`);
  const pdf = row?.querySelector<HTMLElement>('[data-fpdf]'); if (pdf) pdf.onclick = (): void => { leftoversLegacy.pdfDesign(); };
  document.querySelectorAll<HTMLElement>('#v-facturacion [data-fsub]').forEach(button => {
    button.onclick = (): void => { leftoversLegacy.setBillingSection(button.dataset.fsub ?? ''); leftoversLegacy.loadBilling(); };
  });
}

export function billingSettingsSubnav(): void {
  const nav = real('.subnav'); if (!nav) return;
  const sections = leftoversLegacy.billingSettingsSections(), current = leftoversLegacy.billingSection();
  const inSettings = sections.some(section => section[0] === current);
  if (inSettings) leftoversLegacy.setLastBillingSettings(current);
  nav.querySelectorAll<HTMLElement>('[data-fsec]').forEach(button => { if (sections.some(section => section[0] === button.dataset.fsec)) button.classList.add('hide'); });
  addSettingsButton(nav);
  nav.querySelector('[data-faccfg]')?.setAttribute('aria-pressed', String(inSettings));
  let row = real('.faccfgsub');
  if (row && row.previousElementSibling !== nav) { row.remove(); row = undefined; }
  if (inSettings && !row) addSecondRow(nav, sections);
  else if (!inSettings && row) row.remove();
}
