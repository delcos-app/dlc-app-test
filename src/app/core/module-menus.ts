/**
 * The main menu entries the sector modules add (Ciclo de visitas, Intervenciones, Concursos, Eventos, Parque instalado), each after
 * its neighbour and hidden for the professional portal or without access to its area, and the single «Organización» entry of the
 * user menu (instead of Empresa and Plan). Migrated from the legacy menuCiclo, menuCirugias, menuConcursos, menuEventos, menuParque
 * and menuOrganizacion (v2.427.0); the names stay as adapters (the menu permission chain and the start-up call them).
 */
import { term } from '../legacy/bridge';
import { leftoversLegacy } from '../legacy/leftovers-bridge';
import { t } from '../i18n';

interface ModuleEntry { screen: string; after: readonly string[]; area: string; title: () => string }

/** Adds the entry after the first neighbour found (if missing) and hides it when the user cannot open its area. */
function placeEntry(entry: ModuleEntry): void {
  const nav = document.querySelector('nav.main .in'); if (!nav) return;
  let button = nav.querySelector(`[data-t="${entry.screen}"]`);
  if (!button) {
    const neighbour = entry.after.map(screen => nav.querySelector(`[data-t="${screen}"]`)).find(Boolean);
    if (!neighbour) return;
    neighbour.insertAdjacentHTML('afterend', `<button data-t="${entry.screen}" aria-selected="false">${entry.title()}</button>`);
    button = nav.querySelector(`[data-t="${entry.screen}"]`);
  }
  button?.classList.toggle('hide', leftoversLegacy.isProfessionalPortal() || !leftoversLegacy.canUseModule(entry.area));
}

export const menuCycle = (): void => {
  placeEntry({ screen: 'ciclo', after: ['rutas', 'agenda'], area: 'agenda', title: () => t('leftovers.menu.cycle', { visits: term('visita', { number: 'p' }) }) });
};
export const menuSurgeries = (): void => { placeEntry({ screen: 'cirugias', after: ['ciclo', 'agenda'], area: 'agenda', title: () => t('leftovers.menu.surgeries') }); };
export const menuTenders = (): void => { placeEntry({ screen: 'concursos', after: ['ventas'], area: 'ventas', title: () => t('leftovers.menu.tenders') }); };
export const menuEvents = (): void => { placeEntry({ screen: 'eventos', after: ['directorio'], area: 'directorio', title: () => t('leftovers.menu.events') }); };
export const menuEquipment = (): void => { placeEntry({ screen: 'parque', after: ['concursos', 'ventas'], area: 'ventas', title: () => t('leftovers.menu.equipment') }); };

/** User menu: one «Organización» entry instead of Empresa and Plan. */
export function menuOrganization(): void {
  const plan = document.querySelector('[data-u="plan"]'), company = document.querySelector('[data-u="empresa"]'), anchor = company ?? plan;
  if (!document.querySelector('[data-u="organizacion"]') && anchor) {
    anchor.insertAdjacentHTML('beforebegin', `<button data-u="organizacion" class="hide">${leftoversLegacy.svgIcon(leftoversLegacy.namedIcon('building'))} ${t('leftovers.menu.organization')}</button>`);
  }
  [plan, company].forEach(button => button?.classList.add('hide'));
  document.querySelector('[data-u="organizacion"]')?.classList.toggle('hide', !leftoversLegacy.canManageOrganization());
}
