/**
 * The professional portal home, last parts: «Operativa de pedidos», «Volver a llamar hoy», today's glance under the greeting,
 * the header actions and taking out the old blocks. Migrated from the legacy inicioOperativaPedidos, inicioLlamadasHoy,
 * inicioVistazoEIndicadores, vistazoHoy, inicioCabecera and inicioQuitarAntiguo (v2.417.0).
 */
import { appointments, callRpc, currentScreen, goTo, goToOrders, permissions } from '../../../legacy/bridge';
import { miscLegacy } from '../../../legacy/misc-bridge';
import { t } from '../../../i18n';
import { todayIso } from '../../../services/dates';
import { escapeHtml, formatNumber } from '../../../services/format';
import { orFallback } from '../../../services/values';

const isHome = (): boolean => currentScreen() === 'inicio';
const CHEVRON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';

/** «Operativa de pedidos»: to collect, to pack and emails to send (who sees the team and sells). */
export async function paintOperations(): Promise<void> {
  if (!isHome() || !document.getElementById('iniextra') || !(permissions.seesEverything() && permissions.salesLevel() >= 1)) return;
  const { data } = await callRpc<Record<string, unknown[] | undefined>>('operativa_pendiente', {});
  const count = (key: string): number => (data?.[key] ?? []).length;
  if (!(count('pago') + count('paquete') + count('email_factura') + count('email_pago')) || document.getElementById('iniops')) return;
  const rows: [number, string, string][] = [[count('pago'), t('homeMore.operations.toCollect'), count('pago') ? 'aviso' : ''], [count('paquete'), t('homeMore.operations.toPack'), ''],
    [count('email_factura') + count('email_pago'), t('homeMore.operations.toSend'), '']];
  document.getElementById('iniextra')?.insertAdjacentHTML('afterbegin', `<div class="card" id="iniops"><h2>${t('homeMore.operations.title')}</h2>
    <div class="opfilas">${rows.map(([value, label, kind]) => `<button class="opfila" data-opver><b class="${kind}">${formatNumber(value)}</b><span>${label}</span>${CHEVRON}</button>`).join('')}</div></div>`);
  document.getElementById('iniops')?.querySelectorAll<HTMLElement>('[data-opver]').forEach(button => { button.onclick = (): void => { goToOrders('ventas'); }; });
}

/** «Volver a llamar hoy»: the calls due today or late (who sees the team, with Oportunidades). */
export async function paintCallsToday(): Promise<void> {
  if (!isHome() || !permissions.seesEverything() || !permissions.hasOpportunities() || !document.getElementById('iniextra') || document.getElementById('inillam')) return;
  const { data } = await callRpc<{ proxima_fecha: string }[]>('llamadas_seguimiento', {});
  const today = todayIso(), due = (data ?? []).filter(call => call.proxima_fecha <= today);
  if (!due.length || document.getElementById('inillam')) return;
  document.getElementById('iniextra')?.insertAdjacentHTML('afterbegin', `<div class="card" id="inillam"><h2>${t('homeMore.calls.title')}<span class="n">${due.length}</span></h2>
    <p class="sm" style="padding:0 16px">${t('homeMore.calls.hint', { late: due.some(call => call.proxima_fecha < today) ? t('homeMore.calls.late') : '' })}</p>
    <div class="acts" style="padding:0 16px 14px"><button class="btn sec" id="inillamver">${t('homeMore.calls.seeOpportunities')}</button></div></div>`);
  const see = document.getElementById('inillamver'); if (see) see.onclick = (): void => { goToOrders('llamadas'); };
}

function markHeaderActions(greeting: Element): void {
  const actions = greeting.querySelector<HTMLElement>('.acts');
  if (actions && !actions.dataset.ico) { actions.dataset.ico = '1'; actions.classList.add('icoacts'); }
}

/** Today's glance under the greeting: appointments, visited and the next one (nothing for the professional portal). */
export async function paintGlance(): Promise<void> {
  const greeting = document.querySelector('#v-inicio .saludo'); if (!greeting) return;
  markHeaderActions(greeting);
  if (!document.getElementById('vistazo')) greeting.firstElementChild?.insertAdjacentHTML('beforeend', '<div id="vistazo" class="vistazo"></div>');
  const glance = document.getElementById('vistazo');
  if (!glance || permissions.isProfessionalPortal()) return;
  const list = await appointments.ofDay(todayIso());
  const open = list.filter(item => appointments.isOpen(item.estado)).sort((first, second) =>
    ((first as { orden?: number }).orden ?? 0) - ((second as { orden?: number }).orden ?? 0) || String(first.hora ?? '').localeCompare(String(second.hora ?? '')));
  const done = list.filter(item => item.estado === 'Visitada').length, next = open[0];
  if (!document.getElementById('vistazo')) return;
  const nextText = next ? `<span class="prox">${t('homeMore.glance.next', { name: escapeHtml(orFallback(next.medico, orFallback(next.nombre, ''))), time: next.hora ? ` · ${String(next.hora).slice(0, 5)}` : '' })}</span>`
    : `<span class="prox">${t('homeMore.glance.dayDone')}</span>`;
  glance.innerHTML = list.length
    ? `<span>${t('homeMore.glance.today', { count: formatNumber(list.length), appointments: t(list.length === 1 ? 'homeMore.glance.oneAppointment' : 'homeMore.glance.appointments'), done: formatNumber(done) })}</span>
       ${nextText}`
    : `<span>${t('homeMore.glance.none')}</span> <button class="lnk" data-irplan>${t('homeMore.glance.planDay')}</button>`;
  const plan = glance.querySelector<HTMLElement>('[data-irplan]'); if (plan) plan.onclick = (): void => { goTo('rutas'); };
}

/** The glance, after taking out the repeated duplicates notice (it is already an indicator). */
export async function paintGlanceStep(): Promise<void> {
  if (!isHome()) return;
  document.querySelectorAll('#v-inicio .avisoh').forEach(notice => { if (/unificar|duplicad/i.test(notice.textContent ?? '')) notice.remove(); });
  await paintGlance();
}

/** The header actions in their place from the skeleton on. */
export function placeHeader(): void {
  try {
    const actions = document.querySelector<HTMLElement>('#v-inicio > .saludo .acts');
    if (!actions || permissions.isProfessionalPortal()) return;
    if (!actions.dataset.ico) { actions.dataset.ico = '1'; actions.classList.add('icoacts'); }
    if (!document.getElementById('iniact')) miscLegacy.paintUpdated();
    document.body.classList.add('inilisto');
  } catch { /* the header is painted again with the next load */ }
}

/** Takes out the blocks of the old home (only the mosaic and the indicators are painted now). */
export function removeOldBlocks(): void {
  document.getElementById('v-inicio')?.querySelectorAll(':scope > .cols, :scope > #iniextra, :scope > #inialerta, :scope > #vistazo').forEach(block => { block.remove(); });
}
