/**
 * What can be done with an appointment (from its «⋯» menu or its sheet): open the card, directions, time, confirm, discard,
 * delete, postpone, «no estaba», a new date, plan it again. Migrated from the legacy accionCitaBase / accionCitaBase2 /
 * accionCita / cambiarHoraCita (v2.398.0).
 */
import { agendaSources, appointmentLegacy, currentScreen, legacyDb, notices } from '../../legacy/bridge';
import { t } from '../../i18n';
import { formatShortDate } from '../../services/date-format';
import type { AppointmentAction } from './appointment-options';
import { isOpen, pointOf, STATES } from './appointment-state';
import { refreshQuietly, repaintSmoothly, saveOrder } from './your-day/reorder';
import { newDateAfterAbsent } from './absent';
import { nextAttendanceDay } from '../accounts/timetable';


const refresh = (item: SheetAppointment): void => { refreshQuietly(item.id); };

async function setState(action: 'confirmar' | 'desconfirmar' | 'descartar', item: SheetAppointment): Promise<void> {
  const state = action === 'confirmar' ? STATES.confirmed : action === 'desconfirmar' ? STATES.planned : STATES.discarded;
  const result = await appointmentLegacy.write('estado_cita', { p_id: item.id, p_estado: state });
  if (result?.error) { notices.toast(t('agenda.actions.couldNotChange'), true); return; }
  notices.toast(t(state === STATES.confirmed ? 'agenda.actions.confirmed' : state === STATES.discarded ? 'agenda.actions.discarded' : 'agenda.actions.unconfirmed'));
  refresh(item);
}

async function remove(item: SheetAppointment): Promise<void> {
  if (!await notices.confirm(t('agenda.actions.deleteQuestion'), { titulo: t('agenda.actions.deleteTitle'), ok: t('agenda.actions.delete'), peligro: true })) return;
  const { data: result } = await legacyDb().rpc<{ ok?: boolean; error?: string }>('borrar_cita', { p_id: item.id });
  if (result?.ok === false) { notices.toast(t(result.error === 'pasada' ? 'agenda.actions.onlyFuture' : 'agenda.actions.couldNotDelete'), true); return; }
  notices.toast(t('agenda.actions.deleted')); refresh(item);
}

interface PostponeResult { ok?: boolean; ya?: boolean; mismo_dia?: boolean; reabierta?: boolean }

function postponedText(result: PostponeResult | null, day: string): string {
  if (result?.ya) return t('agenda.actions.alreadyThatDay');
  if (result?.mismo_dia) return t('agenda.actions.sameDay');
  return t(result?.reabierta ? 'agenda.actions.backToOwn' : 'agenda.actions.postponedTo', { date: formatShortDate(day) });
}

async function postpone(item: SheetAppointment): Promise<void> {
  const day = await notices.askDate(t('agenda.actions.whichDay'), nextAttendanceDay(item.dias, item.fecha), { titulo: t('agenda.actions.postponeTitle'), ok: t('agenda.actions.postpone') });
  if (!day) return;
  const { data: result, error } = await legacyDb().rpc<PostponeResult>('aplazar_cita', { p_id: item.id, p_fecha: day, p_hora: null, p_origen: STATES.postponed });
  if (error || result?.ok === false) { notices.toast(t('agenda.actions.couldNotPostpone'), true); return; }
  notices.toast(postponedText(result, day)); refresh(item);
}

/** «No estaba»: records the negative result (asking which one if there are several) and offers another day. */
async function absent(item: SheetAppointment): Promise<void> {
  const negatives = appointmentLegacy.negativeResults();
  const [first] = negatives;
  if (!first) { notices.toast(t('agenda.actions.missingNegative'), true); return; }
  let result = first.valor;
  if (negatives.length > 1) {
    const choice = await notices.choose(t('agenda.actions.whatHappened'), item.nombre ?? '', [{ k: 'no', t: t('agenda.actions.cancel'), cls: 'sec' }, ...negatives.map((negative, index) => ({ k: `n${index}`, t: negative.valor, cls: 'sec' }))]);
    if (!choice) return;
    result = negatives[Number(choice.slice(1))]?.valor ?? result;
  }
  const { error } = await appointmentLegacy.writeRpc('registrar_actividad', { p: { cuenta_id: item.cuenta_id, fecha: item.fecha, resultados: [result], op_id: `v-${item.cuenta_id}-${Date.now()}` } });
  if (error) { notices.toast(t('agenda.actions.couldNotSave', { error: error.message ?? '' }), true); return; }
  notices.toast(t('agenda.actions.noted', { result }));
  refresh(item);
  await newDateAfterAbsent(item);
}

async function planAgain(item: SheetAppointment): Promise<void> {
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean; error?: string; quitada?: string }>('reabrir_cita', { p_id: item.id });
  if (error || !result || result.ok === false) { notices.toast(t(result?.error === 'pasada' ? 'agenda.actions.reopenOnlyFuture' : 'agenda.actions.couldNotReopen'), true); return; }
  notices.toast(result.quitada ? t('agenda.actions.reopenedRemoving', { date: formatShortDate(result.quitada) }) : t('agenda.actions.reopened'));
  refresh(item);
}

const ACTIONS: Readonly<Record<AppointmentAction, (item: SheetAppointment) => Promise<void> | void>> = {
  ficha: item => { appointmentLegacy.openAccountFromCentre(item.cuenta_id, item.centro_nombre); },
  llegar: item => { appointmentLegacy.navigateTo(pointOf(item)); },
  hora: item => changeTime(item.id, item.hora ?? ''),
  confirmar: item => setState('confirmar', item),
  desconfirmar: item => setState('desconfirmar', item),
  descartar: item => setState('descartar', item),
  borrar: remove,
  aplazar: postpone,
  noestaba: absent,
  nueva: item => newDateAfterAbsent(item),
  rehacer: planAgain,
};

/** Runs an action on an appointment. */
export async function runAction(action: AppointmentAction, item: SheetAppointment): Promise<void> {
  await ACTIONS[action](item);
}

const timeOf = (item: AgendaAppointment & { hora?: string | null }): string | null => (item.hora ? String(item.hora).slice(0, 5) : null);

/** The open appointments with `id` placed by its new time among the others (the same criterion as the legacy colocarPorHora). */
function orderByTime(open: readonly (AgendaAppointment & { hora?: string | null })[], id: string, time: string): typeof open {
  const moved = open.find(item => item.id === id);
  if (!moved || !time) return open;
  const rest = open.filter(item => item.id !== id);
  let index = rest.findIndex(item => { const other = timeOf(item); return other !== null && other > time; });
  if (index < 0) { index = 0; rest.forEach((item, position) => { const other = timeOf(item); if (other !== null && other <= time) index = position + 1; }); }
  rest.splice(index, 0, moved);
  return rest;
}

/** Changes the time: the appointment takes its place by time among the others, and that order is saved. */
export async function changeTime(id: string, current: string): Promise<void> {
  const time = await notices.askTime(t('agenda.actions.timeTitle'), current, t('agenda.actions.save'));
  if (time === null) return;
  const { error } = await legacyDb().from('agenda').update({ hora: time || null }).eq('id', id);
  if (error) { notices.toast(t('agenda.actions.couldNotTime', { error: (error as { message?: string }).message ?? '' }), true); return; }
  notices.toast(t('agenda.actions.timeUpdated'));
  const day = appointmentLegacy.lastDayData();
  if (currentScreen() !== 'agenda' || !appointmentLegacy.isJoinedDayView() || !day?.some(item => item.id === id)) { refreshQuietly(id, false); return; }
  const owner = agendaSources.ownerId(), data = day.map(item => (item.id === id ? { ...item, hora: time || null } : item));
  const mine = (item: AgendaAppointment): boolean => (item as { usuario_id?: string }).usuario_id === owner;
  const open = data.filter(item => mine(item) && isOpen(item.estado)), order = orderByTime(open, id, time);
  const changed = order.some((item, index) => item.id !== open[index]?.id);
  const next = changed ? [...data.filter(item => mine(item) && !isOpen(item.estado)), ...order, ...data.filter(item => !mine(item))] : data;
  await repaintSmoothly(id, next);
  if (changed && !(await saveOrder(order))) refreshQuietly(id);
}

