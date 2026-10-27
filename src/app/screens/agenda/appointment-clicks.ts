/**
 * The appointment buttons that are not in the cards of «Tu día» (legado 003 and 022, v2.424.0): «+ Nueva cita», change the time,
 * open the card, record, discard, delete, move to today, move to another day (it postpones), and «Añadir a mi agenda» from the
 * account card. Each listener is registered by its legado file at its place in the load order. Plan 7.3 (cut C): changing the time
 * is in the Agenda chunk (called through the screen).
 */
import { legacyDb, notices, term } from '../../legacy/bridge';
import { agendaClicksLegacy } from '../../legacy/legado-a-bridge';
import { t } from '../../i18n';
import { formatShortDate } from '../../services/date-format';
import { addDays, todayIso } from '../../services/dates';
import { changeTime } from '.';

const STATES = { planned: 'Planificada', discarded: 'Descartada', rescheduled: 'Reprogramada' } as const;
const REFRESH_AFTER_DIALOG_MS = 350;

const refresh = (home = true): void => { agendaClicksLegacy.reloadAgenda(); if (home) agendaClicksLegacy.reloadHome(); };

async function discard(id: string): Promise<void> {
  const result = await agendaClicksLegacy.write('estado_cita', { p_id: id, p_estado: STATES.discarded });
  if (result?.error) { notices.toast(t('legacyA.appointments.couldNotDiscard', { error: (result.error as { message?: string }).message ?? '' }), true); return; }
  notices.toast(t('legacyA.appointments.discarded')); refresh();
}

async function remove(id: string): Promise<void> {
  if (!await notices.confirm(t('legacyA.appointments.deleteText'), { titulo: t('legacyA.appointments.deleteTitle'), ok: t('legacyA.appointments.delete'), peligro: true })) return;
  const { data: result } = await legacyDb().rpc<{ ok?: boolean; error?: string }>('borrar_cita', { p_id: id });
  if (result && result.ok === false) {
    const reason = result.error === 'visitada' ? t('legacyA.appointments.cannotDeleteDone', { aVisit: term('visita', { article: 'un' }) })
      : result.error === 'pasada' ? t('legacyA.appointments.onlyFuture') : t('legacyA.appointments.couldNotDelete');
    notices.toast(reason, true);
    return;
  }
  notices.toast(t('legacyA.appointments.deleted')); refresh();
}

async function moveToToday(id: string): Promise<void> {
  await agendaClicksLegacy.write('estado_cita', { p_id: id, p_estado: STATES.planned, p_fecha: todayIso() });
  notices.toast(t('legacyA.appointments.movedToToday')); refresh();
}

async function reschedule(id: string): Promise<void> {
  const date = await notices.askDate(t('legacyA.appointments.whichDay'), addDays(todayIso(), 1), { titulo: t('legacyA.appointments.rescheduleTitle'), ok: t('legacyA.appointments.move') });
  if (!date) return;
  await agendaClicksLegacy.write('estado_cita', { p_id: id, p_estado: STATES.rescheduled, p_fecha: date });
  notices.toast(t('legacyA.appointments.movedTo', { date: formatShortDate(date) })); refresh(false);
}

const ACTIONS: Readonly<Record<string, (id: string) => unknown>> = {
  ficha: id => { agendaClicksLegacy.openAccount(id); },
  visita: id => { agendaClicksLegacy.recordVisit(id); },
  desc: discard, borrar: remove, hoy: moveToToday, repro: reschedule,
};

async function appointmentClick(event: Event): Promise<void> {
  const target = event.target as Element;
  if (target.closest('[data-ag="nueva"]')) { agendaClicksLegacy.newAppointment(); return; }
  const button = target.closest<HTMLElement>('[data-cita]'); if (!button) return;
  const [action = '', id = '', extra = ''] = (button.dataset.cita ?? '').split('|');
  if (action === 'hora') { await changeTime(id, extra); return; }
  await ACTIONS[action]?.(id);
}

/** «+ Nueva cita» and the buttons of an appointment (legado 003). */
export function listenToAppointmentClicks(): void {
  document.addEventListener('click', event => { void appointmentClick(event); });
}

async function addToAgenda(event: Event): Promise<void> {
  const button = (event.target as Element).closest<HTMLElement>('[data-agendar]');
  if (!button) return;
  const date = await notices.askDate(t('legacyA.appointments.whichDayVisit'), todayIso(), { titulo: t('legacyA.appointments.addTitle'), ok: t('legacyA.appointments.add') });
  if (!date) return;
  const accountId = button.dataset.agendar ?? '';
  const result = await agendaClicksLegacy.write('guardar_cita', { p: { cuenta_id: accountId, fecha: date, estado: STATES.planned, origen: 'Ficha', op_id: `c-${accountId}-${date}` } });
  if (result?.error) { notices.toast(t('legacyA.appointments.couldNotAdd', { error: (result.error as { message?: string }).message ?? '' }), true); return; }
  notices.toast(t('legacyA.appointments.added', { date: formatShortDate(date) }));
  agendaClicksLegacy.reloadHome();
}

/** «Añadir a mi agenda» from the account card (legado 003). */
export function listenToAddToAgenda(): void {
  document.addEventListener('click', event => { void addToAgenda(event); });
}

/** In the week, «Mover» postpones (before, it left the appointment in a state that no longer exists; legado 022). */
async function postpone(event: Event): Promise<void> {
  const button = (event.target as Element).closest<HTMLElement>('[data-cita^="repro|"]');
  if (!button) return;
  event.stopImmediatePropagation(); event.preventDefault();
  const id = (button.dataset.cita ?? '').split('|')[1] ?? '';
  const date = await notices.askDate(t('legacyA.appointments.whichDayPostpone'), addDays(todayIso(), 1), { titulo: t('legacyA.appointments.postponeTitle'), ok: t('legacyA.appointments.postpone') });
  if (!date) return;
  const { data: result, error } = await legacyDb().rpc<{ ok?: boolean }>('aplazar_cita', { p_id: id, p_fecha: date, p_hora: null, p_origen: 'Aplazada' });
  if (error || result?.ok === false) { notices.toast(t('legacyA.appointments.couldNotPostpone'), true); return; }
  notices.toast(t('legacyA.appointments.postponed', { date: formatShortDate(date) })); agendaClicksLegacy.reloadAgenda();
}

/** «Tu día»: the menu of a card closes when pressing elsewhere or scrolling; the day refreshes when a window closes (legado 022). */
export function listenToDayMenus(): void {
  document.addEventListener('pointerdown', event => {
    if (!(event.target as Element).closest('.tdmenu, .tdmas')) document.querySelectorAll('.tdmenu').forEach(menu => { menu.remove(); });
  }, true);
  // It closes when scrolling, except in the first instant (the touch itself may move the page a little)
  document.addEventListener('scroll', () => {
    document.querySelectorAll<HTMLElement & { __t?: number }>('.tdmenu').forEach(menu => { if (Date.now() - (menu.__t ?? 0) > 400) menu.remove(); });
  }, true);
  document.getElementById('dlg')?.addEventListener('close', () => {
    if (agendaClicksLegacy.screen() === 'agenda' && agendaClicksLegacy.windowChangedData()) setTimeout(() => { agendaClicksLegacy.quietRefresh(); }, REFRESH_AFTER_DIALOG_MS);
  });
  document.addEventListener('click', event => { void postpone(event); }, true);
}
