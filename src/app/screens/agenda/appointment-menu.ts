/**
 * The «⋯» menu of an appointment. Its options come from a pure function, so knowing whether there is a menu no longer means
 * opening a hidden one with the notices muted (legacy citaConMenu). Migrated from the legacy menuCitaBase / menuCita /
 * citaConMenu (v2.398.0).
 */
import { notices } from '../../legacy/bridge';
import { t, type MessageKey } from '../../i18n';
import { todayIso } from '../../services/dates';
import { escapeHtml } from '../../services/format';
import { runAction, type AppointmentAction } from './appointment-actions';
import { canPlanAgain, isOpen, STATES } from './appointment-state';

interface MenuOption { readonly action: AppointmentAction; readonly title: string; readonly detail: string }

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

/** Opens the menu under its button (aligned to its right edge, inside the screen). */
export function openMenu(button: Element, item: SheetAppointment): void {
  document.querySelectorAll('.tdmenu').forEach(menu => { menu.remove(); });
  const options = menuOptions(item);
  if (!options.length) { notices.toast(t('agenda.menu.alreadyClosed')); return; }
  const menu = document.createElement('div') as HTMLDivElement & { __t?: number };
  menu.className = 'tdmenu';
  // The legacy scroll listener (legado 022) reads __t: the menu does not close in the first instant
  menu.__t = Date.now();
  const danger = (action: AppointmentAction): boolean => action === 'descartar' || action === 'borrar';
  menu.innerHTML = options.map(entry => `<button data-tdop="${entry.action}" class="${danger(entry.action) ? 'peligro' : ''}"><b>${escapeHtml(entry.title)}</b>${entry.detail ? `<span>${escapeHtml(entry.detail)}</span>` : ''}</button>`).join('');
  document.body.appendChild(menu);
  const rect = button.getBoundingClientRect();
  menu.style.top = `${Math.min(window.innerHeight - menu.offsetHeight - 10, rect.bottom + 6)}px`;
  menu.style.left = `${Math.max(10, Math.min(window.innerWidth - menu.offsetWidth - 10, rect.right - menu.offsetWidth))}px`;
  menu.querySelectorAll<HTMLElement>('[data-tdop]').forEach(entry => {
    entry.onclick = (): void => { menu.remove(); void runAction(entry.dataset.tdop as AppointmentAction, item); };
  });
}
