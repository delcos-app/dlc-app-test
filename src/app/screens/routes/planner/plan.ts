/**
 * The plan of a day from a list of accounts (a route, a suggestion, who is due): the order and hours of each stop, who is left out
 * and why, and who already has an appointment. The plan is painted by the legacy pintarPlan (Configuración keeps it) and copied to
 * the agenda. Migrated from the legacy construirPlan, planificar, planDesdeLista, planAAgenda and empezarRuta (v2.418.0); the five
 * names stay as adapters (Configuración, the [data-ruta] listener of legado 003 and the tests use them).
 */
import { agendaState, appLegacy, appointments, currentScreen, goTo, legacyDb, notices, term } from '../../../legacy/bridge';
import { restLegacy } from '../../../legacy/rest-bridge';
import { routes2Legacy } from '../../../legacy/routes2-bridge';
import { t } from '../../../i18n';
import { formatMinutes, todayIso } from '../../../services/dates';
import { formatLongDate } from '../../../services/date-format';
import { orFallback } from '../../../services/values';
import { editRoute } from '../editor';
import { paintRouteBar } from '../day-bar';
import { currentHours, hoursOfRoute, planSettings, setHours, type PlanHours } from './settings';
import { nowMinutes, nowRounded, scheduleVisits, type LeftOut, type Point, type ScheduledVisit, type Windows } from './visits';
import { withTimetables } from '../../accounts/timetable';
import { privateConsultation } from '../../accounts/editor-form/model';

const SCROLL_WAIT_MS = 80;

export interface PlanMember { id: string; nombre: string; lat?: number | string | null; lon?: number | string | null; dias?: Record<string, string | null> | null; centro_nombre?: string | null; municipio?: string | null; direccion?: string | null; horaPlan?: number; ventanas?: Windows | null }
export interface PlanStop { centro: string; municipio?: string | null | undefined; dir?: string | null | undefined; xy: Point; medicos: PlanMember[]; llegada: number; fin: number; nota?: string }
export interface DayPlan {
  rutaId: string; salida: PlanStart; paradas: PlanStop[]; fin: number; fecha: string; inicio: number; fuera: { m: PlanMember; motivo: string }[];
  citados: { m: PlanMember; fecha: string }[]; horario: PlanHours | null; __recientes?: Record<string, RecentContact[] | undefined>; __pedido?: boolean;
}
export interface PlanOptions { manana?: boolean; horario?: PlanHours | null }

const located = (list: readonly PlanMember[]): PlanMember[] => list.filter(item => item.lat && item.lon);
const longDate = (isoDate: string): string => formatLongDate(isoDate);

/** What the user chose when the plan could not be made: change the hours of the route, or plan for the next working day. */
async function offerAlternatives(choice: string | null, list: readonly PlanMember[], routeId: string, button: HTMLElement | null): Promise<void> {
  if (choice === 'horario') editRoute(routeId);
  if (choice === 'manana') await buildPlan(list, routeId, button, { manana: true });
}

const isSavedRoute = (routeId: string): boolean => routes2Legacy.savedRoutes().some(route => route.id === routeId);

async function tooLate(list: readonly PlanMember[], routeId: string, button: HTMLElement | null): Promise<void> {
  const settings = planSettings(), savedRoute = isSavedRoute(routeId);
  const choice = await notices.choose(t('routesMore.plan.lateTitle'), t('routesMore.plan.lateText', {
    leave: settings.salida, back: settings.tope, now: formatMinutes(nowMinutes()), date: longDate(routes2Legacy.nextWorkingDay()), orChange: savedRoute ? t('routesMore.plan.orChangeHours') : '',
  }), [{ k: 'no', t: t('common.cancel'), cls: 'sec' }, ...(savedRoute ? [{ k: 'horario', t: t('routesMore.plan.changeHours'), cls: 'sec' }] : []), { k: 'manana', t: t('routesMore.plan.forTomorrow') }]);
  await offerAlternatives(choice, list, routeId, button);
}

async function allCited(cited: readonly { fecha: string }[]): Promise<void> {
  const text = cited.length === 1 ? t('routesMore.plan.oneCited', { theProfessional: term('medico', { article: 'el', articleCapital: 'C' }) })
    : t('routesMore.plan.allCitedText', { count: cited.length, professionals: term('medico', { number: 'p' }) });
  const choice = await notices.choose(t('routesMore.plan.allCitedTitle'), text, [{ k: 'no', t: t('common.close'), cls: 'sec' }, { k: 'agenda', t: t('routesMore.plan.seeAgenda') }]);
  if (choice !== 'agenda') return;
  agendaState.setMode('semana'); agendaState.setSelectedDate(cited.map(item => item.fecha).sort()[0] ?? todayIso()); goTo('agenda');
}

function noneFitsText(leftOut: readonly LeftOut<PlanMember>[], isoDate: string, citedCount: number): string {
  const settings = planSettings(), noVisit = term('visita', { article: 'ningun' });
  const notThatDay = leftOut.filter(item => item.motivo === t('routesMore.planner.notThatDay')).length;
  let text = notThatDay === leftOut.length ? t('routesMore.plan.noneAttends', { count: leftOut.length, professionals: term('medico', { number: 'p' }), date: longDate(isoDate) })
    : settings.conTope ? t('routesMore.plan.noTimeWithHours', { leave: settings.salida, back: settings.tope, visit: noVisit })
    : t('routesMore.plan.noTime', { visit: noVisit });
  if (citedCount) text += t(citedCount === 1 ? 'routesMore.plan.alsoOneCited' : 'routesMore.plan.alsoCited', { count: citedCount });
  return text;
}

interface NoneFits { routeId: string; button: HTMLElement | null; options: PlanOptions; leftOut: readonly LeftOut<PlanMember>[]; isoDate: string; citedCount: number }

async function noneFits(list: readonly PlanMember[], context: NoneFits): Promise<void> {
  const changeHours = planSettings().conTope && isSavedRoute(context.routeId);
  const choice = await notices.choose(t('routesMore.plan.noneFitsTitle', { visit: term('visita', { article: 'ningun' }) }), noneFitsText(context.leftOut, context.isoDate, context.citedCount),
    [{ k: 'no', t: t('common.cancel'), cls: 'sec' }, ...(changeHours ? [{ k: 'horario', t: t('routesMore.plan.changeHours'), cls: 'sec' }] : []), ...(context.options.manana ? [] : [{ k: 'manana', t: t('routesMore.plan.tryTomorrow') }])]);
  await offerAlternatives(choice, list, context.routeId, context.button);
}

/** Visits one after another at the same place make one stop. */
function stopsOf(sequence: readonly ScheduledVisit<PlanMember>[]): PlanStop[] {
  const stops: PlanStop[] = [];
  for (const step of sequence) {
    const member: PlanMember = { ...step.it.ref, horaPlan: step.ini, ventanas: step.it.ventanas }, point = step.it.xy ?? [0, 0], last = stops[stops.length - 1];
    if (last && last.xy[0] === point[0] && last.xy[1] === point[1]) { last.medicos.push(member); last.fin = step.fin; continue; }
    stops.push({ centro: orFallback(member.centro_nombre, privateConsultation()), municipio: member.municipio, dir: member.direccion, xy: point, medicos: [member], llegada: step.ini, fin: step.fin });
  }
  return stops;
}

/** Builds and paints the plan of `list` (the accounts with a location) for today, or for the next working day. */
export async function buildPlan(list: readonly PlanMember[], routeId: string, button: HTMLElement | null, options: PlanOptions = {}): Promise<void> {
  routes2Legacy.setLastPlan({ conXY: list, rutaId: routeId, opts: options });
  setHours(options.horario !== undefined ? options.horario : hoursOfRoute(routeId));
  const settings = planSettings(), isoDate = options.manana ? routes2Legacy.nextWorkingDay() : todayIso();
  const leave = routes2Legacy.minutesOf(settings.salida) ?? 0, limit = routes2Legacy.minutesOf(settings.tope) ?? Infinity;
  const start = options.manana ? leave : Math.max(leave, nowRounded());
  if (start >= limit) { await tooLate(list, routeId, button); return; }
  const everyone = await withTimetables(list);
  // Who already has a planned appointment (from today) is not proposed: they are shown apart as «ya citados»
  const planned = await routes2Legacy.myPlannedAppointments();
  const cited = everyone.filter(item => planned[item.id]).map(item => ({ m: item, fecha: planned[item.id] ?? '' }));
  const members = everyone.filter(item => !planned[item.id]);
  const items = members.map(item => ({ id: item.id, ref: item, xy: item.lat !== null && item.lat !== undefined && item.lon !== null && item.lon !== undefined ? [Number(item.lat), Number(item.lon)] as Point : null, ventanas: routes2Legacy.windowsOf(item.dias, isoDate), fija: null }));
  const { seq, fuera, fin } = scheduleVisits(items, start);
  if (!members.length && cited.length) { await allCited(cited); return; }
  if (!seq.length) { await noneFits(list, { routeId, button, options, leftOut: fuera, isoDate, citedCount: cited.length }); return; }
  routes2Legacy.setPlan({ rutaId: routeId, salida: routes2Legacy.start(), paradas: stopsOf(seq), fin, fecha: isoDate, inicio: start, fuera: fuera.map(item => ({ m: item.it.ref, motivo: item.motivo })), citados: cited, horario: currentHours() });
  if (currentScreen() !== 'rutas') goTo('rutas');
  routes2Legacy.paintPlan();
  setTimeout(() => { document.getElementById('rplan')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, SCROLL_WAIT_MS);
}

/** «Planificar» a saved route: its accounts with a location. */
export async function planRoute(routeId: string, button: HTMLElement): Promise<void> {
  const label = button.textContent; (button as HTMLButtonElement).disabled = true; button.textContent = t('routesMore.plan.calculating');
  const { data, error } = await legacyDb().rpc<PlanMember[]>('cuentas_de_ruta', { p_id: routeId });
  (button as HTMLButtonElement).disabled = false; button.textContent = label;
  if (error) { notices.toast(t('routesMore.plan.couldNotPlan', { error: (error as { message?: string }).message ?? '' }), true); return; }
  const list = located(data ?? []);
  if (!list.length) { notices.toast(t('routesMore.plan.noLocated', { professionals: term('medico', { number: 'p' }) }), true); return; }
  await buildPlan(list, routeId, button);
}

/** The plan of a list (a suggestion, who is due) with the accounts that have a location. */
export async function planFromList(list: readonly PlanMember[] | null | undefined, name: string, button: HTMLElement | null): Promise<void> {
  const withPlace = located(list ?? []);
  if (!withPlace.length) { notices.toast(t('routesMore.plan.noneLocated', { professionals: term('medico', { number: 'p' }) }), true); return; }
  await buildPlan(withPlace, name, button);
}

/** Copies the plan to the agenda of its day: first what was closed, then the plan in order, then other open ones. */
export async function planToAgenda(plan: DayPlan): Promise<{ fecha: string; n: number } | null> {
  const isoDate = plan.fecha || todayIso(), members = plan.paradas.flatMap(stop => stop.medicos.map(member => ({ member, centre: stop.centro, note: stop.nota ?? '' })));
  const existing = await appointments.ofDay(isoDate) as unknown as RouteAppointment[], ids: string[] = [];
  let order = existing.length;
  for (const { member, centre, note } of members) {
    const already = existing.find(item => item.cuenta_id === member.id && appointments.isOpen(item.estado));
    if (already) { ids.push(already.id); continue; }
    order += 1;
    const { data: result, error } = await legacyDb().rpc<{ ok?: boolean; id: string }>('guardar_cita', { p: { cuenta_id: member.id, fecha: isoDate, hora: null, centro_nombre: centre,
      estado: 'Planificada', origen: 'Ruta', orden: order, nota: note || null, salida: plan.horario?.salida ?? null, vuelta: plan.horario?.vuelta ?? null, op_id: `c-${member.id}-${isoDate}` } });
    if (error || !result?.ok) { notices.toast(t('routesMore.plan.couldNotSave'), true); return null; }
    ids.push(result.id);
  }
  const closed = existing.filter(item => !appointments.isOpen(item.estado)).map(item => item.id);
  const others = existing.filter(item => appointments.isOpen(item.estado) && !ids.includes(item.id)).map(item => item.id);
  await legacyDb().rpc('ordenar_citas', { p_ids: [...closed, ...ids, ...others] });
  appLegacy.forgetCache();
  return { fecha: isoDate, n: members.length };
}

/** «Pasar a mi agenda y empezar»: copies today's plan and starts the working day. */
export async function startRoute(): Promise<void> {
  const plan = routes2Legacy.plan(); if (!plan) return;
  if (plan.fecha && plan.fecha !== todayIso()) { notices.toast(t('routesMore.plan.otherDay'), true); return; }
  const result = await planToAgenda(plan);
  if (!result) return;
  routes2Legacy.setPlan(null);
  localStorage.setItem(restLegacy.workingDayKey(), JSON.stringify({ fecha: todayIso(), inicio: Date.now() }));
  void paintRouteBar();
  notices.toast(t('routesMore.plan.started'));
  agendaState.setMode('dia'); agendaState.setSelectedDate(todayIso()); goTo('agenda');
}
