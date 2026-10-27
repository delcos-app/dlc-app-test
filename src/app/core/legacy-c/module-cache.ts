/**
 * Screens already loaded are not loaded again without a reason, and closing a window without changes does not reload the Agenda
 * (v2.56.0); Inicio says when it was updated with an icon button (v2.56.0/v2.57.0); a page change shows the local loader. Folded from
 * legado 057 and 058 (v2.425.0). The loader minimum of v2.56.0 was switched off (`if (false)`) and is gone.
 */
import { t } from '../../i18n';
import { byId, closestTo, observe } from './dom';
import * as legacyFreeCoreLegacyC from './';
import * as legacyFreeCoreSettings from '../settings';
import { sessionStore } from '../session-store';
import { ordersStore } from '../../screens/orders/store';
import { productsStore } from '../../screens/products/store';
import { billingStore } from '../../screens/billing/store';
import { agendaStore } from '../../screens/agenda/store';
import { navigationStore } from '../navigation/store';
import * as legacyFreeCoreServices from '../services';

const UNCHANGED_FOR_MS = 800, MINUTE_MS = 60000, SAFETY_MS = 6000;
type Loader = (...args: unknown[]) => Promise<unknown>;

let writesWhenOpened = 0, unchangedUntil = 0;

/** Closing a window without having written anything does not reload the Agenda or the route. */
export function watchDialogWrites(): void {
  const dialog = byId<HTMLDialogElement>('dlg');
  observe(dialog, () => {
    if (dialog?.open) writesWhenOpened = sessionStore.writes;
    else if (sessionStore.writes === writesWhenOpened) unchangedUntil = Date.now() + UNCHANGED_FOR_MS;
  }, { attributes: true, attributeFilter: ['open'] });
}

/** What makes each screen different (its section, its day…): the legacy ESTADO_MOD. */
export const moduleStates = (): Record<string, () => string> => ({
  inicio: () => '', ventas: () => ordersStore.section, productos: () => productsStore.section, facturacion: () => billingStore.section,
  analitica: () => (typeof ASEC !== 'undefined' ? ASEC : ''), pacientes: () => '',
  agenda: () => [agendaStore.mode, agendaStore.selectedDate, agendaStore.viewedUser ? agendaStore.viewedUser.id : ''].join('|'),
});

const LOADERS: readonly (readonly [string, string])[] = [['inicio', 'cargarInicio'], ['ventas', 'cargarVentas'], ['productos', 'cargarProductosModulo'],
  ['facturacion', 'cargarFacturacion'], ['analitica', 'cargarAnalitica'], ['pacientes', 'cargarPacientes'], ['agenda', 'cargarAgenda']];

/** Each loader uses the cache of its screen; the Agenda is not reloaded right after closing a window without changes. */
export function cacheModuleLoaders(): void {
  const globals = window as unknown as Record<string, Loader>;
  LOADERS.forEach(([screen, name]) => {
    const original = globals[name]; if (!original) return;
    globals[name] = async function (this: unknown, ...args: unknown[]): Promise<unknown> {
      if (legacyFreeCoreServices.reads.canReuseScreen(screen)) { if (screen === 'inicio') legacyFreeCoreLegacyC.paintUpdated(); return undefined; }
      if (screen === 'agenda' && Date.now() < unchangedUntil && !navigationStore.via) return undefined;   // a window closed without changes
      const result = await original.apply(this, args); legacyFreeCoreSettings.markModuleCache(screen); if (screen === 'inicio') legacyFreeCoreLegacyC.paintUpdated(); return result;
    };
  });
}

/** The update button of Inicio, created on its header the first time (null header: only an existing button). */
function updateButton(): { button: HTMLElement | null; inHeader: boolean } {
  const actions = document.querySelector('#v-inicio .saludo .acts, #v-inicio .hero .acts, #v-inicio .inihead .acts') ?? document.querySelector('#v-inicio .saludo');
  if (!actions) return { button: byId('iniact'), inHeader: false };
  let button = byId('iniact');
  if (!button) {
    actions.insertAdjacentHTML('beforeend', `<button class="btn sec iniact" id="iniact" type="button" title="${t('legacyC.home.update')}">${svgIco(ICON_NOM['refresh-cw'] ?? '')}<span></span></button>`);
    button = byId('iniact');
    if (button) { const target = button; target.onclick = (): void => { delete CACHE_MOD.inicio; void legacyFreeCoreLegacyC.withLoading(target, (t('legacyC.home.updating')), (() => cargarInicio())); }; }
  }
  return { button, inHeader: true };
}

/** Inicio: when the data was updated, as the title of its icon button (the legacy pintarActualizado). */
export function paintUpdated(): void {
  const { button, inHeader } = updateButton();
  if (inHeader) requestAnimationFrame(() => { document.body.classList.add('inilisto'); });
  if (!button) return;
  // v2.337.0: icon button of the delcos system (with the padding of a normal button the icon was 3 px to the right)
  button.classList.add('icoredondo', 'icoonly');
  const cache = CACHE_MOD.inicio, minutes = cache ? Math.floor((Date.now() - cache.t) / MINUTE_MS) : 0;
  button.title = `${minutes < 1 ? t('legacyC.home.updatedNow') : t('legacyC.home.updatedAgo', { minutes })} · ${t('legacyC.home.pressToUpdate')}`;
  button.setAttribute('aria-label', button.title);
  const text = button.querySelector('span'); if (text) text.textContent = '';
}

/** Inicio refreshes «updated N min ago» every minute; its buttons never stay hidden. */
export function keepUpdateTime(): void {
  setInterval(() => { if (navigationStore.screen === 'inicio') legacyFreeCoreLegacyC.paintUpdated(); }, MINUTE_MS);
  setTimeout(() => { document.body.classList.add('inilisto'); }, SAFETY_MS);   // safety net
}

/** A page change in a list shows the local loader on its card. */
export function loaderOnPageChange(): void {
  document.addEventListener('click', event => {
    const button = closestTo<HTMLButtonElement>(event.target, 'main .pag button:not(:disabled)');
    if (button) legacyFreeCoreServices.reads.localLoading((button.closest('.card') ?? button.closest('.pag')?.parentElement ?? null));
  }, true);
  document.addEventListener('change', event => {
    const select = closestTo(event.target, 'main .pag select');
    if (select) legacyFreeCoreServices.reads.localLoading((select.closest('.card') ?? select.closest('.pag')?.parentElement ?? null));
  }, true);
}
