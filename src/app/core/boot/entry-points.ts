/**
 * Page-wide click listeners folded from legado 025–039 (v2.424.0), each registered at its own place in the load order (capture
 * listeners keep their order): the team agenda, impersonating, the manual button, «Planificar la semana» from Rutas, the indicators
 * that open a module, the start point link, the orders' filters going back to page 1, the payment details email and the manual's
 * search results closing.
 */
import { notices } from '../../legacy/bridge';
import { legacyBActions, legacyBState, rawDb } from '../../legacy/legado-b-bridge';
import { t } from '../../i18n';

const closest = (event: Event, selector: string): HTMLElement | null => (event.target instanceof Element ? event.target.closest<HTMLElement>(selector) : null);

/** v2.26.0: «Equipo» in the agenda header. */
export function listenToTeamButton(): void {
  document.addEventListener('click', event => {
    if (!closest(event, '[data-ag="equipo"]')) return;
    event.stopImmediatePropagation();
    legacyBState.setAgendaMode('equipo'); legacyBActions.reloadAgenda();
  }, true);
}

/** v2.28.0: «Impersonalizar» a user, and the manual from the user menu. */
export function listenToImpersonateAndManual(): void {
  document.addEventListener('click', event => { const button = closest(event, '[data-ucomo]'); if (button) legacyBActions.impersonate(button.dataset.ucomo ?? ''); });
  document.addEventListener('click', event => {
    if (!closest(event, '#manbtn')) return;
    event.stopPropagation();
    document.querySelectorAll('.umenu').forEach(menu => { menu.classList.add('hide'); });
    legacyBActions.goTo('manual');
  }, true);
}

/** v2.29.0: «Planificar la semana» (from Rutas or Inicio) opens the planner once the week is painted. */
export function listenToWeekPlanLinks(): void {
  document.addEventListener('click', event => {
    if (!closest(event, '#rrsem, [data-inisem="plan"]')) return;
    event.stopImmediatePropagation();
    legacyBState.askWeekPlan(); legacyBState.setAgendaWeek('semana', legacyBActions.todayIso()); legacyBActions.goTo('agenda');
  }, true);
}

/** v2.29.0: the indicators of Inicio that open a module (Analítica, your week, Pedidos). */
export function listenToIndicatorLinks(): void {
  document.addEventListener('click', event => {
    const indicator = closest(event, '#kpis [data-k^="x-"]');
    if (!indicator || closest(event, '.ai')) return;
    event.stopImmediatePropagation();
    const link = indicator.dataset.k;
    if (link === 'x-analitica') legacyBActions.goTo('analitica');
    if (link === 'x-semana') { legacyBState.setAgendaWeek('semana', legacyBActions.todayIso()); legacyBActions.goTo('agenda'); }
    if (link === 'x-ventas') legacyBActions.goTo('ventas');
  }, true);
}

/** v2.35.0: «Configura tu punto de salida» opens the preferences; changing a filter of Pedidos goes back to the first page. */
export function listenToOrderListLinks(): void {
  document.addEventListener('click', event => { if (closest(event, '[data-irprefs]')) { legacyBState.setSettingsSection('prefs'); legacyBActions.goTo('config'); } });
  document.addEventListener('change', event => { if (closest(event, '#pper, #pcanal, #pestado')) legacyBState.setOrdersPage(0); }, true);
  document.addEventListener('input', event => { if ((event.target as Element | null)?.id === 'pq') legacyBState.setOrdersPage(0); }, true);
}

async function sendPaymentEmail(link: HTMLAnchorElement): Promise<void> {
  const company = legacyBState.settings().empresa as { iban?: string } | undefined;
  // v2.306.0: without the IBAN there is nothing to pay to
  if (!(company?.iban ?? '').trim()) { notices.toast(t('legacyB.orders.missingIban'), true); return; }
  const address = new URL(link.href.replace(/^mailto:/, 'http://x/?to=').replace('?subject', '&subject'));
  const body = { para: decodeURIComponent(address.searchParams.get('to') ?? ''), asunto: address.searchParams.get('subject') ?? '', texto: address.searchParams.get('body') ?? '',
    pedido_id: link.dataset.ped ?? null, marca: 'email_pago' };
  const { data, error } = await rawDb().functions.invoke('enviar_email', { body });
  if (!error && (data as { ok?: boolean } | null | undefined)?.ok) { notices.toast(t('legacyB.orders.paymentEmailSent')); return; }
  // Without direct sending, the device's mail opens
  location.href = link.href;
}

/** v2.35.0: «Enviar datos de pago» sends it straight from the company's mail when it is set up. */
export function listenToPaymentEmailLinks(): void {
  document.addEventListener('click', event => {
    const link = closest(event, '#pdmailpago') as HTMLAnchorElement | null; if (!link) return;
    event.preventDefault(); event.stopImmediatePropagation();
    void sendPaymentEmail(link);
  }, true);
}

/** v2.39.0: the manual's search results close when clicking elsewhere. */
export function listenToManualSearch(): void {
  document.addEventListener('click', event => {
    const results = document.getElementById('manres');
    if (results && !closest(event, '.manbusca')) results.classList.add('hide');
  });
}
