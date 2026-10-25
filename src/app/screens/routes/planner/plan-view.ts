/**
 * What the plan of the day adds to the card the legacy pintarPlan paints: «Guardar en mi agenda» and «Pasar a mi agenda y
 * empezar», the hour of each professional and who is left out, the map, who was visited lately, the notice without a start place,
 * and the card and note buttons of each stop. Migrated from the legacy planBotonesAgenda, planHorasYFueraDePlan,
 * planMapaYDescartar, planVisitadosRecientes, planAvisoSinSalida, planFichasYNotas and mapaDelPlan (v2.418.0); the names stay as
 * adapters (pintarPlan, in Configuración, calls them).
 */
import { agendaActions, agendaState, goTo, notices, term } from '../../../legacy/bridge';
import { routes2Legacy } from '../../../legacy/routes2-bridge';
import { askText } from '../../../components';
import { t } from '../../../i18n';
import { formatMinutes, todayIso } from '../../../services/dates';
import { formatShortDate } from '../../../services/date-format';
import { escapeHtml } from '../../../services/format';
import { buildPlan, planToAgenda, startRoute, type DayPlan, type PlanStop } from './plan';
import { showPlanMap } from './plan-map';

const SHOWN_LEFT_OUT = 30, MAP_HEIGHT = 'min(55vh,460px)';

const box = (): HTMLElement | null => document.getElementById('rplan');
const shownPlan = (): DayPlan | null => (box() ? routes2Legacy.plan() : null);

export function planAgendaButtons(): void {
  const save = document.getElementById('planag') as HTMLButtonElement | null, start = document.getElementById('planempezar');
  if (save) save.onclick = async (): Promise<void> => {
    const plan = routes2Legacy.plan(); if (!plan) return;
    save.disabled = true;
    const result = await planToAgenda(plan);
    save.disabled = false;
    if (!result) return;
    notices.toast(t('routesMore.planView.saved', { count: result.n, date: formatShortDate(result.fecha) }));
    agendaState.setMode('dia'); agendaState.setSelectedDate(result.fecha); routes2Legacy.setPlan(null); goTo('agenda');
  };
  if (start) { start.textContent = t('routesMore.planView.startButton'); start.onclick = (): void => { void startRoute(); }; }
  if (save) save.textContent = t('routesMore.planView.saveButton');
}

const leftOutRow = (item: DayPlan['fuera'][number], index: number): string => `<div class="item ${index >= SHOWN_LEFT_OUT ? 'extra' : ''}" style="cursor:default">
        <span class="ic w">!</span><span class="tx"><b>${escapeHtml(item.m.nombre)}</b>
          <span class="sm">${escapeHtml(item.motivo)}${item.m.municipio ? ` · ${escapeHtml(item.m.municipio)}` : ''}</span></span></div>`;

/** The hour of each professional with their hours of attention, and who is left out. */
export function planHoursAndLeftOut(): void {
  const plan = shownPlan(), place = box(); if (!plan || !place) return;
  place.querySelectorAll('.lista > .item').forEach((element, index) => {
    const stop = plan.paradas[index], line = element.querySelectorAll('.tx .sm')[1]; if (!stop || !line) return;
    line.innerHTML = stop.medicos.map(member => `<span class="pmed"><b>${member.horaPlan !== undefined ? formatMinutes(member.horaPlan) : ''}</b> ${escapeHtml(member.nombre)}${
      member.ventanas?.length ? ` <span class="pvent">${t('routesMore.planView.attends', { hours: routes2Legacy.windowsText(member.ventanas) })}</span>` : ''}</span>`).join('');
  });
  const leftOut = plan.fuera;
  if (!leftOut.length) return;
  place.querySelector('.card .lista')?.insertAdjacentHTML('afterend', `<div class="planfuera">
      <h3>${t('routesMore.planView.leftOut', { count: leftOut.length })}</h3>
      <div class="lista">${leftOut.map(leftOutRow).join('')}
        ${leftOut.length > SHOWN_LEFT_OUT ? `<button class="vermas" type="button" data-vermas>${t('routesMore.planView.seeRest', { count: leftOut.length - SHOWN_LEFT_OUT })}</button>` : ''}</div></div>`);
}

/** The left-out list goes under the map; «Descartar plan» and the map button. */
export function planMapAndDiscard(): void {
  const place = box(); if (!routes2Legacy.plan() || !place) return;
  const leftOut = place.querySelector('.planfuera'), map = document.getElementById('planmapa');
  if (leftOut && map) map.insertAdjacentElement('afterend', leftOut);
  const close = document.getElementById('plancerrar');
  if (close) { close.textContent = t('routesMore.planView.discard'); close.title = t('routesMore.planView.discardTitle'); }
  const show = document.getElementById('planver');
  if (show) show.onclick = (): void => {
    const mapBox = document.getElementById('planmapa'); if (!mapBox) return;
    if (mapBox.dataset.on && mapBox.style.height !== '0px') {
      mapBox.style.height = '0px'; mapBox.style.marginTop = '0'; show.textContent = t('routesMore.planView.showMap');
    } else {
      showPlanMap(); mapBox.style.height = MAP_HEIGHT; mapBox.style.marginTop = '12px'; show.textContent = t('routesMore.planView.hideMap');
    }
  };
}

function askRecent(plan: DayPlan): void {
  plan.__pedido = true;
  const ids = plan.paradas.flatMap(stop => stop.medicos.map(member => member.id));
  void routes2Legacy.recentContacts(ids, plan.fecha || todayIso()).then(found => {
    const current = routes2Legacy.plan(); if (!current) return;
    current.__recientes = found; routes2Legacy.paintPlan();
  });
}

/** The warning next to each professional seen lately. */
function markRecent(place: HTMLElement, plan: DayPlan, found: Record<string, RecentContact[] | undefined>): void {
  const members = plan.paradas.flatMap(stop => stop.medicos);
  place.querySelectorAll('.pmed').forEach(element => {
    const member = members.find(item => (element.textContent ?? '').includes(item.nombre)), recent = member ? found[member.id] : undefined;
    if (recent && !element.querySelector('.prec')) element.insertAdjacentHTML('beforeend', ` <span class="prec">⚠ ${escapeHtml(routes2Legacy.recentText(recent.slice(0, 2)))}</span>`);
  });
}

/** Who of the plan was visited or has an appointment lately, with «Quitarlos del plan». */
export function planRecentlyVisited(): void {
  const plan = routes2Legacy.plan(), place = box();
  if (!plan || !place || (plan.__recientes === undefined && !plan.__pedido)) { if (plan && !plan.__pedido) askRecent(plan); return; }
  const found = plan.__recientes ?? {}, ids = Object.keys(found);
  if (!ids.length) return;
  markRecent(place, plan, found);
  const card = place.querySelector('.card');
  if (card && !document.getElementById('planrec')) recentNotice(card, ids);
}

/** «⚠ N profesionales del plan ya se han visitado…» with «Quitarlos del plan». */
function recentNotice(card: Element, ids: readonly string[]): void {
  const who = ids.length === 1 ? t('routesMore.planView.oneRecent', { professional: term('medico') }) : t('routesMore.planView.recent', { count: ids.length, professionals: term('medico', { number: 'p' }) });
  card.querySelector('h2')?.insertAdjacentHTML('afterend', `<div class="avisoh" id="planrec"><span>⚠ ${t('routesMore.planView.recentText', { who, days: routes2Legacy.revisitNotice().dias })}</span>
      <button class="btn sec" id="planquitar">${t('routesMore.planView.removeThem')}</button></div>`);
  const remove = document.getElementById('planquitar');
  if (remove) remove.onclick = (): void => {
    const last = routes2Legacy.lastPlan(); if (!last) return;
    void buildPlan(last.conXY.filter(item => !ids.includes(item.id)), last.rutaId, null, last.opts);
  };
}

export function planNoStartNotice(): void {
  const place = box(); if (routes2Legacy.plan() && place) routes2Legacy.noStartWarning(place.querySelector('.card'));
}

function stopButtons(item: Element, stop: PlanStop, index: number): void {
  const text = item.querySelector('.tx'), names = text?.querySelectorAll('.sm')[1];
  if (names) names.innerHTML = stop.medicos.map(member => `<button type="button" class="lnkmed" data-pfm="${member.id}" title="${t('routesMore.planView.openCard')}">${escapeHtml(member.nombre)}</button>`).join('');
  if (stop.nota) text?.insertAdjacentHTML('beforeend', `<span class="sm notapar">📝 ${escapeHtml(stop.nota)}</span>`);
  const single = stop.medicos.length === 1 ? `<button class="btn sec" data-pfm="${stop.medicos[0]?.id ?? ''}">${t('routesMore.planView.card')}</button>` : '';
  item.querySelector('.acts')?.insertAdjacentHTML('afterbegin', `${single}<button class="btn sec" data-pnota="${index}">${t(stop.nota ? 'routesMore.planView.editNote' : 'routesMore.planView.note')}</button>`);
}

/** «Ficha» and «Nota» of each stop; the note goes to each appointment of the stop when the plan is copied. */
export function planCardsAndNotes(): void {
  const plan = shownPlan(), place = box(); if (!plan || !place) return;
  const items = place.querySelectorAll<HTMLElement>('.lista > .item');
  plan.paradas.forEach((stop, index) => {
    const item = items[index]; if (!item || item.dataset.ext) return;
    item.dataset.ext = '1';
    stopButtons(item, stop, index);
  });
  place.querySelectorAll<HTMLElement>('[data-pfm]').forEach(button => { button.onclick = (): void => { agendaActions.openAccount(button.dataset.pfm ?? ''); }; });
  place.querySelectorAll<HTMLElement>('[data-pnota]').forEach(button => { button.onclick = async (): Promise<void> => {
    const stop = plan.paradas[Number(button.dataset.pnota)]; if (!stop) return;
    const text = await askText(t('routesMore.planView.noteText', { professional: term('medico') }), stop.nota ?? '', { titulo: t('routesMore.planView.noteTitle', { centre: stop.centro }), ok: t('routesMore.planView.saveNote'), tipo: 'area' });
    if (text === null) return;
    stop.nota = text.trim(); routes2Legacy.paintPlan();
  }; });
}
