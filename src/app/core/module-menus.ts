/**
 * The main menu entries the sector modules add (Ciclo de visitas, Intervenciones, Concursos, Eventos, Parque instalado, Depósitos), each after
 * its neighbour and hidden for the professional portal or without access to its area, and the single «Organización» entry of the
 * user menu (instead of Empresa and Plan). Migrated from the legacy menuCiclo, menuCirugias, menuConcursos, menuEventos, menuParque
 * and menuOrganizacion (v2.427.0); the names stay as adapters (the menu permission chain and the start-up call them).
 */
import { term } from '../legacy/bridge';
import { leftoversLegacy } from '../legacy/leftovers-bridge';
import { t } from '../i18n';
import { moduleInUse, sectionShown } from './modules-in-use';

interface ModuleEntry { screen: string; after: readonly string[]; area: string; title: () => string; shown?: (screen: string) => boolean }

/** Adds the entry after the first neighbour found (if missing) and hides it when the user cannot open its area or the company does not
 * use the sector module yet (v2.469.0, CFG-1). `shown` replaces that last check (Depósitos: also in the plan). */
function placeEntry(entry: ModuleEntry): void {
  const nav = document.querySelector('nav.main .in'); if (!nav) return;
  let button = nav.querySelector(`[data-t="${entry.screen}"]`);
  if (!button) {
    const neighbour = entry.after.map(screen => nav.querySelector(`[data-t="${screen}"]`)).find(Boolean);
    if (!neighbour) return;
    neighbour.insertAdjacentHTML('afterend', `<button data-t="${entry.screen}">${entry.title()}</button>`);
    button = nav.querySelector(`[data-t="${entry.screen}"]`);
  }
  button?.classList.toggle('hide', leftoversLegacy.isProfessionalPortal() || !leftoversLegacy.canUseModule(entry.area) || !(entry.shown ?? moduleInUse)(entry.screen));
}

export const menuCycle = (): void => {
  placeEntry({ screen: 'ciclo', after: ['rutas', 'agenda'], area: 'agenda', title: () => t('leftovers.menu.cycle', { visits: term('visita', { number: 'p' }) }) });
};
export const menuSurgeries = (): void => { placeEntry({ screen: 'cirugias', after: ['ciclo', 'agenda'], area: 'agenda', title: () => t('leftovers.menu.surgeries') }); };
export const menuTenders = (): void => { placeEntry({ screen: 'concursos', after: ['ventas'], area: 'ventas', title: () => t('leftovers.menu.tenders') }); };
export const menuEvents = (): void => { placeEntry({ screen: 'eventos', after: ['directorio'], area: 'directorio', title: () => t('leftovers.menu.events') }); };
export const menuEquipment = (): void => { placeEntry({ screen: 'parque', after: ['concursos', 'ventas'], area: 'ventas', title: () => t('leftovers.menu.equipment') }); };
/** Depósitos (v2.471.0): after Productos (it is stock at the customer's), only with a consignment store and in the plan. */
export const menuDeposits = (): void => {
  placeEntry({ screen: 'deposito', after: ['productos', 'ventas'], area: 'ventas', title: () => term('deposito', { number: 'p', capital: 'C' }), shown: sectionShown });
};

/** User menu: one «Organización» entry instead of Empresa and Plan. */
export function menuOrganization(): void {
  const plan = document.querySelector('[data-u="plan"]'), company = document.querySelector('[data-u="empresa"]'), anchor = company ?? plan;
  if (!document.querySelector('[data-u="organizacion"]') && anchor) {
    anchor.insertAdjacentHTML('beforebegin', `<button data-u="organizacion" class="hide" data-desktop-only>${leftoversLegacy.svgIcon(leftoversLegacy.namedIcon('building'))} ${t('leftovers.menu.organization')}</button>`);
  }
  [plan, company].forEach(button => button?.classList.add('hide'));
  document.querySelector('[data-u="organizacion"]')?.classList.toggle('hide', !leftoversLegacy.canManageOrganization());
}
