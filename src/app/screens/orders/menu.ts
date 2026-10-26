/**
 * Pedidos, Oportunidades, Compras and Proveedores: each one its own entry in the menu, after Pedidos (inside, the same module with its
 * section). With the side menu, each one goes in its block. Migrated from the legacy menuPedidos2139 (v2.417.0); the name stays as an
 * adapter (legado 073 calls it when the permissions are applied).
 */
import { permissions, qualityLegacy } from '../../legacy/bridge';
import { t, type MessageKey } from '../../i18n';

const ENTRIES: readonly (readonly [string, MessageKey, boolean])[] = [
  ['oportunidades', 'ordersMore.menu.opportunities', true], ['compras', 'ordersMore.menu.purchases', false], ['proveedores', 'ordersMore.menu.suppliers', false],
];

export function addOrderMenuEntries(): void {
  const nav = document.querySelector('nav.main .in'); if (!nav || permissions.isProfessionalPortal()) return;
  const orders = nav.querySelector('[data-t="ventas"]'); if (!orders) return;
  const sees = !orders.classList.contains('hide') && qualityLegacy.canUseModule('ventas');
  let after: Element = orders;
  ENTRIES.forEach(([key, label, needsTeam]) => {
    const visible = sees && (!needsTeam || (permissions.seesEverything() && permissions.hasOpportunities()));
    let button = nav.querySelector(`[data-t="${key}"]`);
    if (!button) { after.insertAdjacentHTML('afterend', `<button data-t="${key}">${t(label)}</button>`); button = nav.querySelector(`[data-t="${key}"]`); }
    if (!button) return;
    button.classList.toggle('hide', !visible);
    if (!button.closest('.mlbs')) after = button;
  });
}
