/**
 * Agenda and mobile details: «Añadir a mi agenda» opens the appointment window (v2.176.0; the day-only question of v2.174.0 never ran
 * after it and is gone), pressing «⋯» again closes its menu (v2.175.0), the popups close when pressing outside, pulling down at the top
 * reloads (v2.176.0), a centre in the top search opens its card, the visit result buttons are decorated, the samples are checked before
 * saving a visit (v2.18x), and the plan shows apart the professionals already booked (v2.64.0). Folded from legado 061, 074, 077 and 078
 * (v2.425.0).
 */
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';
import { byId, closestTo, observe } from './dom';
import * as legacyFreeCoreServices from '../services';
import { navigationStore } from '../navigation/store';
import { accountsStore } from '../../screens/accounts/store';
import { routesStore } from '../../screens/routes/store';
import * as legacyFreeScreensSettingsMore from '../../screens/settings/more';
import * as legacyFreeCoreSettings from '../settings';

const PULL_FACTOR = 0.6, PULL_READY = 80, PULL_MAX = 90, PULL_SHOW = 70, PULL_OFFSET = 50, PULL_MIN_MS = 600;

/** v2.176.0: «Añadir a mi agenda» of the card opens the same appointment window (capture on window, before anything else). */
export function addToAgendaFromCard(): void {
  window.addEventListener('click', event => {
    const button = closestTo(event.target, '[data-agendar]'); if (!button) return;
    event.stopImmediatePropagation(); event.stopPropagation(); event.preventDefault();
    void (nuevaCita as (account: string, isoDate: string | null, options: object) => unknown)(button.dataset.agendar ?? '', null, { origen: 'Ficha' });
  }, true);
}

/** v2.175.0: on the phone, pressing «⋯» again closes its menu; the menu remembers which button opened it. */
export function toggleDayMenu(): void {
  document.addEventListener('click', event => {
    const button = closestTo(event.target, 'button'), menu = document.querySelector<HTMLElement & { __de?: Element | null }>('.tdmenu');
    if (button && menu && menu.__de === button) { menu.remove(); event.stopImmediatePropagation(); event.preventDefault(); return; }
    TDM_BOTON = button;
  }, true);
  observe(document.body, mutations => {
    mutations.forEach(mutation => { mutation.addedNodes.forEach(node => { if (node instanceof HTMLElement && node.classList.contains('tdmenu')) (node as HTMLElement & { __de?: Element | null }).__de = TDM_BOTON; }); });
  }, { childList: true });
}

/** A popup closes when pressing outside it (and outside what opens it). */
export function closePopupOutside(popup: string, opener: string): void {
  document.addEventListener('pointerdown', event => {
    if (!closestTo(event.target, `${popup}, ${opener}`)) document.querySelectorAll(popup).forEach(element => { element.remove(); });
  }, true);
}

function blockedPull(target: EventTarget | null, loading: boolean): boolean {
  if (window.scrollY > 0 || document.querySelector('dialog[open]') || document.body.classList.contains('sin-sesion') || loading) return true;
  if (!(target instanceof Element) || target.closest('.leaflet-container, .tdmenu, .agpop, .agmpop, .selpop, #mlpanel')) return true;
  for (let node: Element | null = target; node && node !== document.body; node = node.parentElement) if (node.scrollTop > 0) return true;
  return false;
}

function pullIndicator(): HTMLElement {
  const existing = byId('ptr'); if (existing) return existing;
  document.body.insertAdjacentHTML('beforeend', '<div id="ptr" aria-hidden="true"><span class="ptrc"></span></div>');
  return byId('ptr') ?? document.body;
}

const showPull = (distance: number): void => {
  const indicator = pullIndicator();
  indicator.style.transform = `translate(-50%, ${Math.min(distance, PULL_MAX) - PULL_OFFSET}px)`; indicator.style.opacity = String(Math.min(1, distance / PULL_SHOW));
  indicator.classList.toggle('listo', distance > PULL_READY);
};
const hidePull = (): void => { const indicator = byId('ptr'); if (indicator) { indicator.style.transform = 'translate(-50%, -60px)'; indicator.style.opacity = '0'; indicator.classList.remove('listo', 'gira'); } };

/** v2.176.0: pulling down at the top reloads the screen (touch screens), with the delcos loader. */
export function pullToReload(): void {
  if (!('ontouchstart' in window)) return;
  let startY: number | null = null, distance = 0, loading = false;
  addEventListener('touchstart', event => { startY = event.touches.length === 1 && !blockedPull(event.target, loading) ? event.touches[0]?.clientY ?? null : null; distance = 0; }, { passive: true });
  addEventListener('touchmove', event => {
    if (startY === null) return;
    distance = (event.touches[0]?.clientY ?? startY) - startY;
    if (distance <= 0 || window.scrollY > 0) { hidePull(); return; }
    showPull(distance * PULL_FACTOR);
  }, { passive: true });
  addEventListener('touchend', () => { void (async (): Promise<void> => {
    if (startY === null) return; startY = null;
    if (distance * PULL_FACTOR <= PULL_READY) { hidePull(); return; }
    loading = true; pullIndicator().classList.add('gira'); showPull(PULL_READY);
    const started = Date.now();
    try { if (navigationStore.screen === 'agenda') await cargarAgenda(); else await ir(navigationStore.screen); } catch { /* the indicator goes anyway */ }
    await new Promise(resolve => { setTimeout(resolve, Math.max(0, PULL_MIN_MS - (Date.now() - started))); });
    loading = false; hidePull();
  })(); });
}

/** A centre registered in the top search opens its card. */
export function openCentreFromSearch(): void {
  window.addEventListener('click', event => {
    const button = closestTo(event.target, '[data-gcid]'); if (!button) return;
    event.stopImmediatePropagation(); event.stopPropagation(); event.preventDefault();
    byId('gsug')?.classList.add('hide'); const search = byId<HTMLInputElement>('q'); if (search) search.value = '';
    void fichaCentro(button.dataset.gcid ?? '');
  }, true);
}

/** The visit result buttons in a window are decorated once they appear. */
export function decorateVisitResults(): void {
  const body = byId('dbody'); if (!body) return;
  observe(body, () => {
    if (body.querySelector('[data-vdest]:not([data-vend])')) { body.querySelectorAll<HTMLElement>('[data-vdest]').forEach(item => { item.dataset.vend = '1'; }); legacyFreeScreensSettingsMore.decorateResults(); }
  }, { childList: true, subtree: true });
}

/** Before saving a visit, the samples are checked (if something fails, nothing is saved). */
export function checkSamplesBeforeSaving(): void {
  document.addEventListener('click', event => {
    const button = closestTo(event.target, '#vguardar');
    const visit = accountsStore.currentVisit as { muestras?: { validar: () => string | null } } | null;
    if (!button || !visit?.muestras) return;
    const message = visit.muestras.validar();
    if (message) { event.stopImmediatePropagation(); event.preventDefault(); toast(message, true); }
  }, true);
}

interface Booked { m: { nombre: string; municipio?: string | null }; fecha: string }

/** v2.64.0: the plan shows apart the professionals that already have an appointment (the legacy pintarPlan). */
export function paintPlan(args: readonly unknown[]): unknown {
  void args;   // the legacy callers pass their arguments; the plan card takes none
  legacyFreeCoreSettings.paintPlanCard();
  const box = byId('rplan'), booked = (routesStore.plan as { citados?: Booked[] } | null)?.citados ?? [];
  if (box && booked.length && !box.querySelector('.plancitados')) {
    box.insertAdjacentHTML('beforeend', `<div class="plancitados"><h3>${t('legacyC.plan.booked', { count: booked.length })}</h3>
      <p class="sm">${t('legacyC.plan.bookedHint')}</p>
      <div class="lista">${booked.map(item => `<div class="item u-cursor-default"><span class="ic">📅</span><span class="txt"><b>${escapeHtml(item.m.nombre)}</b>
        <span class="sm">${t('legacyC.plan.bookedOn', { date: escapeHtml(legacyFreeCoreServices.calendar.longDate((new Date(`${item.fecha}T12:00:00`)))) })}${item.m.municipio ? ` · ${escapeHtml(item.m.municipio)}` : ''}</span></span></div>`).join('')}</div></div>`);
  }
  return undefined;
}
