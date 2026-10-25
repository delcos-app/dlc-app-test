/**
 * The «⋯» of a day (strip, «Tu semana», the open week and «Tu día»): new appointment, see the day, and block or unblock it
 * (holidays, training…; the planner skips it). Migrated from the legacy menuDiaSemana (v2.414.0); the name stays as an adapter.
 */
import { agendaActions, agendaSources, agendaState, callRpc, notices, reloadAgenda, term } from '../../legacy/bridge';
import { restLegacy } from '../../legacy/rest-bridge';
import { t, type MessageKey } from '../../i18n';
import { todayIso } from '../../services/dates';
import { formatShortDate } from '../../services/date-format';
import { escapeHtml } from '../../services/format';
import { isPresent } from '../../services/values';

const EDGE = 10, GAP = 6;

type Option = readonly [string, MessageKey, string];

function options(isoDate: string, blocked: boolean): Option[] {
  const coming = isoDate >= todayIso();
  const block: Option = blocked ? ['desbloquear', 'agendaMore.dayMenu.unblock', t('agendaMore.dayMenu.unblockText')] : ['bloquear', 'agendaMore.dayMenu.block', t('agendaMore.dayMenu.blockText')];
  return [
    coming ? ['nueva', 'agendaMore.dayMenu.newAppointment', t('agendaMore.dayMenu.addOne', { professional: term('medico', { article: 'un' }) })] as const : null,
    ['ver', 'agendaMore.dayMenu.seeDay', t('agendaMore.dayMenu.seeDayText')] as const,
    coming ? block : null,
  ].filter(isPresent);
}

function place(menu: HTMLElement, button: HTMLElement): void {
  const box = button.getBoundingClientRect();
  menu.style.top = `${Math.min(window.innerHeight - menu.offsetHeight - EDGE, box.bottom + GAP)}px`;
  menu.style.left = `${Math.max(EDGE, Math.min(window.innerWidth - menu.offsetWidth - EDGE, box.right - menu.offsetWidth))}px`;
}

async function setBlocked(isoDate: string, block: boolean): Promise<void> {
  let reason: string | null = null;
  if (block) {
    reason = await restLegacy.askText(t('agendaMore.dayMenu.reason'), '', { titulo: t('agendaMore.dayMenu.blockTitle', { date: formatShortDate(isoDate) }), ok: t('agendaMore.dayMenu.blockOk') });
    if (reason === null) return;
  }
  const { data: result, error } = await callRpc<{ ok?: boolean }>('bloquear_dia', { p_fecha: isoDate, p_motivo: reason, p_usuario: agendaSources.ownerId(), p_bloquear: block });
  if (error || result?.ok === false) { notices.toast(t('agendaMore.dayMenu.couldNotChange'), true); return; }
  notices.toast(t(block ? 'agendaMore.dayMenu.blocked' : 'agendaMore.dayMenu.unblocked')); reloadAgenda();
}

function choose(option: string, isoDate: string): void {
  if (option === 'nueva') { agendaActions.newAppointment('', isoDate); return; }
  if (option === 'ver') { agendaState.setSelectedDate(isoDate); agendaState.setMode('dia'); reloadAgenda(); return; }
  void setBlocked(isoDate, option === 'bloquear');
}

/** Opens the menu of `isoDate` under `button`. */
export function openDayMenu(button: HTMLElement, isoDate: string, blocked: boolean): void {
  document.querySelectorAll('.tdmenu').forEach(menu => { menu.remove(); });
  const menu = Object.assign(document.createElement('div'), { className: 'tdmenu' });
  Reflect.set(menu, '__t', Date.now());
  menu.innerHTML = options(isoDate, blocked).map(([key, title, text]) => `<button data-dmo="${key}"><b>${escapeHtml(t(title))}</b><span>${escapeHtml(text)}</span></button>`).join('');
  document.body.appendChild(menu);
  place(menu, button);
  menu.querySelectorAll<HTMLElement>('[data-dmo]').forEach(option => {
    option.onclick = (): void => { menu.remove(); choose(option.dataset.dmo ?? '', isoDate); };
  });
}
