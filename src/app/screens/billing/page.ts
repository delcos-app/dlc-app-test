/**
 * The Facturación screen: its tabs (invoices, series and, for administration, fiscal data, VeriFactu and the log), the
 * read-only notice when the plan no longer includes it, and the section painted below. Migrated from the legacy
 * cargarFacturacionBase, cargarFacturacionBase2 and cargarFacturacion (v2.413.0); cargarFacturacion stays as an adapter (the menu,
 * the cache of loaded screens and the configuration tab bar call it). The configuration tab bar itself stays in legacy.
 */
import { cardSectionsLegacy, currentScreen } from '../../legacy/bridge';
import { billingLegacy } from '../../legacy/billing-bridge';
import { t, type MessageKey } from '../../i18n';
import { escapeHtml } from '../../services/format';
import { paintInvoices } from './list';
import { paintSeries } from './series';
import { paintVerifactu } from './verifactu';
import { usesVerifactu } from '../../core/organisation';
import { blockedOnPhone, paintScreenNotice } from '../../core/mobile/gate';

const SECTIONS: readonly (readonly [string, MessageKey, boolean])[] = [
  ['facturas', 'billing.page.invoices', false], ['series', 'billing.page.series', false],
  ['empresa', 'billing.page.company', true], ['verifactu', 'billing.page.verifactu', true], ['registro', 'billing.page.log', true],
];

const PAINT: Readonly<Record<string, () => void>> = {
  facturas: paintInvoices,
  series: () => { void paintSeries(); },
  empresa: () => { billingLegacy.paintCompany(); },
  verifactu: () => { void paintVerifactu(); },
  registro: () => { billingLegacy.paintLog(); },
};

function readOnlyHtml(): string {
  if (!billingLegacy.readOnly()) return '';
  return `<div id="facconsulta" class="banda-info">${t('billing.page.readOnly', { plan: escapeHtml(billingLegacy.planName()) })}</div>`;
}

/** A «Solo ordenador» section of Facturación on the phone: the notice, with «Ir a Facturas». */
function paintBillingNotice(body: HTMLElement, section: string): void {
  paintScreenNotice(body, `facturacion/${section}`, { label: t('billing.page.invoices'), open: () => { billingLegacy.setSection('facturas'); billingLegacy.reload(); } });
}

export function loadBilling(): Promise<void> {
  const screen = document.getElementById('v-facturacion'); if (!screen) return Promise.resolve();
  const admin = cardSectionsLegacy.can('administrar'), allowed = SECTIONS.filter(([key, , adminOnly]) => (admin || !adminOnly) && (key !== 'verifactu' || usesVerifactu()));
  if (!allowed.some(([key]) => key === billingLegacy.section())) billingLegacy.setSection('facturas');
  // v2.473.0: the phone shows only the tabs used on it; one reached by a link shows the notice
  const sections = allowed.filter(([key]) => !blockedOnPhone('facturacion', key));
  const current = billingLegacy.section();
  screen.innerHTML = `
    <div class="saludo"><div><h1>${t('billing.page.title')}</h1><div class="fecha">${t('billing.page.subtitle')}</div></div>
      <div class="acts u-m-0"></div></div>
    <div class="subnav">${sections.map(([key, label]) => `<button data-fsec="${key}" aria-pressed="${String(current === key)}">${t(label)}</button>`).join('')}</div>${readOnlyHtml()}
    <div id="fcuerpo"></div>`;
  screen.querySelectorAll<HTMLElement>('[data-fsec]').forEach(button => { button.onclick = (): void => { billingLegacy.setSection(button.dataset.fsec ?? 'facturas'); billingLegacy.reload(); }; });
  const body = document.getElementById('fcuerpo');
  if (body && blockedOnPhone('facturacion', current)) paintBillingNotice(body, current);
  else PAINT[current]?.();
  requestAnimationFrame(() => { if (currentScreen() === 'facturacion') billingLegacy.paintTabs(); });
  return Promise.resolve();
}
