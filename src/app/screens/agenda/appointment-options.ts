/** What the «⋯» menu of an appointment offers (pure: no actions, no DOM), so the cards and the sheet can ask whether there is one. */
import { t, type MessageKey } from '../../i18n';
import { todayIso } from '../../services/dates';
import { canPlanAgain, isOpen, STATES } from './appointment-state';

export type AppointmentAction = 'ficha' | 'llegar' | 'hora' | 'confirmar' | 'desconfirmar' | 'descartar' | 'borrar' | 'aplazar' | 'noestaba' | 'nueva' | 'rehacer';

export interface MenuOption { readonly action: AppointmentAction; readonly title: string; readonly detail: string }

const option = (action: AppointmentAction, title: MessageKey, detail = ''): MenuOption => ({ action, title: t(title), detail });

/** What the menu offers: changes for an open appointment; «Volver a planificarla» for a postponed or discarded one from today on. */
export function menuOptions(item: SheetAppointment): MenuOption[] {
  const today = todayIso();
  if (!isOpen(item.estado)) {
    if (!canPlanAgain(item, today)) return [];
    return [{ action: 'rehacer', title: t('agenda.menu.planAgain'), detail: t('agenda.menu.planAgainText') + (item.estado === STATES.postponed ? t('agenda.menu.planAgainPostponed') : '') }];
  }
  return [
    option('hora', item.hora ? 'agenda.menu.changeTime' : 'agenda.menu.setTime'),
    { ...option('aplazar', 'agenda.menu.postpone'), detail: t('agenda.menu.postponeText') },
    item.estado === STATES.planned ? { ...option('confirmar', 'agenda.menu.confirm'), detail: t('agenda.menu.confirmText') } : null,
    item.estado === STATES.confirmed ? option('desconfirmar', 'agenda.menu.unconfirm') : null,
    { ...option('descartar', 'agenda.menu.discard'), detail: t('agenda.menu.discardText') },
    item.fecha >= today ? { ...option('borrar', 'agenda.menu.delete'), detail: t('agenda.menu.deleteText') } : null,   // v2.273.0
  ].filter((entry): entry is MenuOption => entry !== null);
}

export const hasMenu = (item: SheetAppointment): boolean => menuOptions(item).length > 0;
