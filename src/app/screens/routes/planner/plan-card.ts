/**
 * The card of the day's route plan (#rplan): the stops in order with their arrival, the whole route in the navigator, saving it in
 * the agenda and «Empezar ruta»; then, in order, each part added to it (agenda buttons, hours and those left out, map and discard,
 * recently visited, the notice without a start, cards and notes). And the «Tiempos de visita» window. Migrated from the legacy
 * pintarPlanBase, pintarPlanBase2 and abrirHorarioPlanBase of Configuración (v2.428.0); the last two stay as adapters (legado 061's
 * pintarPlan and the hours window of pantallas/cuentas.js call them).
 */
import { notices, term } from '../../../legacy/bridge';
import { routes2Legacy } from '../../../legacy/routes2-bridge';
import { planCardLegacy } from '../../../legacy/settings-core-bridge';
import { t } from '../../../i18n';
import { longDate, minutesToTime } from '../../../services/calendar';
import { todayIso } from '../../../services/dates';
import { escapeHtml } from '../../../services/format';
import { navigationAttribute } from '../../../services/maps';
import { buildPlan, planFromList, planRoute, startRoute, type DayPlan, type PlanStop } from './plan';
import { showPlanMap } from './plan-map';
import { planAgendaButtons, planCardsAndNotes, planHoursAndLeftOut, planMapAndDiscard, planNoStartNotice, planRecentlyVisited } from './plan-view';
import { planSettings } from './settings';

/** Stored values of an appointment saved from the plan. */
const PLANNED = 'Planificada', PLAN_ORIGIN = 'Plan del día';
const DEFAULT_VISIT = 15, DEFAULT_STOP = 10;

const professionals = (count: number): string => `${count} ${term('medico', { number: count === 1 ? 's' : 'p' })}`;
const byId = (id: string): HTMLElement | null => document.getElementById(id);

function titleOf(plan: DayPlan): string {
  return plan.fecha && plan.fecha !== todayIso() ? t('settingsCore.plan.planFor', { date: longDate(new Date(`${plan.fecha}T00:00:00`)) }) : t('settingsCore.plan.today');
}

function stopRow(stop: PlanStop, index: number): string {
  const place = escapeHtml([stop.dir, stop.municipio].filter(Boolean).join(', '));
  return `<div class="item u-cursor-default">
      <span class="ic">${index + 1}</span>
      <span class="tx"><b>${escapeHtml(stop.centro)}</b>
        <span class="sm">${minutesToTime(stop.llegada)}–${minutesToTime(stop.fin)} · ${place} · ${professionals(stop.medicos.length)}</span>
        <span class="sm">${stop.medicos.map(member => escapeHtml(member.nombre)).join(' · ')}</span></span>
      <span class="acts u-m-0"><button class="btn sec" type="button" data-nav="${navigationAttribute(stop.xy)}">${t('settingsCore.plan.go')}</button></span>
    </div>`;
}

/** The whole route: every stop and back to the start, or ending at the last stop when the start has no place. */
function routeAttribute(plan: DayPlan): string {
  const last = plan.paradas[plan.paradas.length - 1], home = plan.salida.lat !== null && plan.salida.lat !== undefined;
  const destination = home ? [plan.salida.lat, plan.salida.lon] : last?.xy;
  const stops = home ? plan.paradas.map(stop => stop.xy) : plan.paradas.slice(0, -1).map(stop => stop.xy);
  return navigationAttribute(destination, stops);
}

function cardHtml(plan: DayPlan): string {
  const total = plan.paradas.reduce((count, stop) => count + stop.medicos.length, 0), stops = plan.paradas.length;
  // A plan made from a list may have no start hour (then the configured departure is shown)
  const startMinute = plan.inicio as number | null | undefined;
  const summary = t('settingsCore.plan.summary', {
    start: escapeHtml(plan.salida.nombre), time: startMinute !== null && startMinute !== undefined ? minutesToTime(startMinute) : planSettings().salida,
    stops: stops === 1 ? t('settingsCore.plan.oneStop') : t('settingsCore.plan.stops', { count: stops }), back: minutesToTime(plan.fin),
  });
  return `<div class="card">
    <h2>${titleOf(plan)}<span class="n">${professionals(total)}</span></h2>
    <p class="sm">${summary} <button class="kcfg" id="planhora">${t('settingsCore.plan.changeHours')}</button></p>
    <div class="lista">${plan.paradas.map(stopRow).join('')}</div>
    <div id="planmapa" style="height:0;margin:0 16px;border-radius:12px;overflow:hidden"></div>
    <div class="acts" style="padding:12px 16px 16px">
      <button class="btn sec" id="planver">${t('settingsCore.plan.seeMap')}</button>
      <button class="btn" type="button" data-nav="${routeAttribute(plan)}">${t('settingsCore.plan.openInNavigator')}</button>
      <button class="btn sec" id="planag">${t('settingsCore.plan.saveToAgenda')}</button>
      ${!plan.fecha || plan.fecha === todayIso() ? `<button class="btn" id="planempezar">${t('settingsCore.plan.start')}</button>` : ''}
      <button class="btn sec" id="plancerrar">${t('settingsCore.plan.close')}</button>
    </div></div>`;
}

async function saveToAgenda(plan: DayPlan, button: HTMLButtonElement): Promise<void> {
  button.disabled = true; button.textContent = t('settingsCore.plan.saving');
  const day = plan.fecha || todayIso();
  let count = 0;
  for (const stop of plan.paradas) {
    for (const member of stop.medicos) {
      // One by one, in order: each appointment is its own write (and the queue keeps them if there is no connection)
      await planCardLegacy.write('guardar_cita', { p: {
        cuenta_id: member.id, fecha: day, hora: minutesToTime(stop.llegada), centro_nombre: stop.centro, estado: PLANNED, origen: PLAN_ORIGIN, op_id: `c-${member.id}-${day}`,
      } });
      count += 1;
    }
  }
  button.disabled = false; button.textContent = t('settingsCore.plan.saveToAgenda');
  notices.toast(t('settingsCore.plan.saved', { count }));
  planCardLegacy.reloadHome();
}

function bind(plan: DayPlan): void {
  const on = (id: string, action: (button: HTMLButtonElement) => void): void => { const button = (byId(id) as HTMLButtonElement | null); if (button) button.onclick = (): void => { action(button); }; };
  on('plancerrar', () => { routes2Legacy.setPlan(null); routes2Legacy.paintPlan(); });
  on('planver', button => { showPlanMap(); button.classList.add('hide'); });
  on('planhora', () => { routes2Legacy.openPlanTimes(); });
  on('planempezar', () => { void startRoute(); });
  on('planag', button => { void saveToAgenda(plan, button); });
}

/** Paints the plan card (empty without a plan) and each part added to it, in order. */
export function paintPlanCard(): void {
  const box = byId('rplan'), plan = routes2Legacy.plan();
  if (!box) return;
  if (!plan) { box.innerHTML = ''; return; }
  box.innerHTML = cardHtml(plan);
  bind(plan);
  planAgendaButtons();
  planHoursAndLeftOut();
  planMapAndDiscard();
  planRecentlyVisited();
  planNoStartNotice();
  planCardsAndNotes();
}

/** After changing the times, the plan shown is made again with them. */
function rebuildPlan(): void {
  const last = routes2Legacy.lastPlan(), plan = routes2Legacy.plan();
  if (last) { void buildPlan(last.conXY, last.rutaId, null, last.opts); return; }
  if (!plan?.rutaId) return;
  const proposals = routes2Legacy.proposals(), proposal = proposals?.[plan.rutaId] as Parameters<typeof planFromList>[0] | undefined;
  if (proposal) void planFromList(proposal, plan.rutaId, null);
  else void planRoute(plan.rutaId, byId('rnueva') ?? document.createElement('button'));
}

async function saveTimes(button: HTMLButtonElement): Promise<void> {
  button.disabled = true;
  const stopValue = (byId('hpar') as HTMLInputElement | null)?.value ?? '';
  const plan = { visita: Number((byId('hvis') as HTMLInputElement | null)?.value) || DEFAULT_VISIT, parada: stopValue === '' ? DEFAULT_STOP : Number(stopValue) };
  const preferences = { ...(routes2Legacy.ownPreferences() ?? {}), plan };
  routes2Legacy.setOwnPreferences(await planCardLegacy.savePreferences(preferences) ?? preferences);
  (byId('dlg') as HTMLDialogElement | null)?.close(); notices.toast(t('settingsCore.planHours.saved'));
  rebuildPlan();
}

/** «Tiempos de visita»: minutes per professional and fixed minutes per stop, saved in the user's preferences. */
export function openPlanTimesWindow(): void {
  const settings = planSettings(), body = byId('dbody');
  if (!body) return;
  body.innerHTML = `
    <div class="fh"><div><h2>${t('settingsCore.planHours.title', { visit: term('visita') })}</h2><div class="sm">${t('settingsCore.planHours.subtitle')}</div></div>
      <button class="x" data-cerrar aria-label="${t('common.close')}">✕</button></div>
    <div class="g2">
      <div><label for="hvis">${t('settingsCore.planHours.perProfessional', { professional: term('medico') })}</label><input id="hvis" type="number" min="5" max="60" value="${settings.visita}"></div>
      <div><label for="hpar">${t('settingsCore.planHours.perStop')}</label><input id="hpar" type="number" min="0" max="40" value="${settings.parada}"></div>
    </div>
    <div class="acts u-end">
      <button class="btn sec" data-cerrar>${t('common.cancel')}</button>
      <button class="btn" id="hok">${t('common.save')}</button></div>`;
  const ok = (byId('hok') as HTMLButtonElement | null); if (ok) ok.onclick = (): void => { void saveTimes(ok); };
  (byId('dlg') as HTMLDialogElement | null)?.showModal();
}
