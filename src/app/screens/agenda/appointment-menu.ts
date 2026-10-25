/**
 * The «⋯» menu of an appointment. Its options come from a pure function, so knowing whether there is a menu no longer means
 * opening a hidden one with the notices muted (legacy citaConMenu). Migrated from the legacy menuCitaBase / menuCita /
 * citaConMenu (v2.398.0).
 */
import { notices } from '../../legacy/bridge';
import { t } from '../../i18n';
import { escapeHtml } from '../../services/format';
import { runAction } from './appointment-actions';
import { menuOptions, type AppointmentAction } from './appointment-options';

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
