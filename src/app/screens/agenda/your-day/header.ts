/** Header of «Tu día» (title, compact and day buttons, figures, actions), the working-day line, the «no cabe» banner and the
 * appointments of other people. */
import { legacyIcons } from '../../../legacy/bridge';
import { t } from '../../../i18n';
import { formatMinutes } from '../../../services/dates';
import { escapeHtml, formatNumber } from '../../../services/format';
import { statePill } from '../appointment-state';
import { timeText } from './card';
import { compactButton } from './compact';

const DAY_MINUTES = 24 * 60;

export interface DaySummary {
  readonly isToday: boolean; readonly isPast: boolean; readonly isFutureOrToday: boolean; readonly mine: number;
  readonly active: number; readonly done: number; readonly absent: number; readonly open: number;
  readonly end: number; readonly overReturn: boolean; readonly withPlace: number; readonly own: boolean; readonly isOwner: boolean;
  readonly workingDay: { inicio: number } | null; readonly compact: boolean; readonly visit: string;
}

function statsHtml(summary: DaySummary): string {
  const end = summary.open && !summary.isPast
    ? `<span>${t('agenda.yourDay.estimatedEnd')} <b style="color:${summary.overReturn ? 'var(--warn)' : 'var(--navy)'}">${formatMinutes(summary.end)}</b>${summary.overReturn ? t('agenda.yourDay.overReturn') : ''}${summary.end >= DAY_MINUTES ? ` <span class="sm">${t('agenda.yourDay.nextDay')}</span>` : ''}</span>` : '';
  return `<div class="tdstats">
          <span>${t('agenda.yourDay.appointments', { count: formatNumber(summary.active) })}</span>
          <span>${t('agenda.yourDay.visited', { count: formatNumber(summary.done) })}</span>
          ${summary.absent ? `<span>${t('agenda.yourDay.absent', { count: formatNumber(summary.absent) })}</span>` : ''}
          <span>${t('agenda.yourDay.toDo', { count: summary.open })}</span>
          ${end}
        </div>`;
}

/** «Empezar jornada» / «Terminar jornada»: today, in your own agenda. */
function workingDayButton(summary: DaySummary): string {
  if (!summary.isToday || !summary.isOwner) return '';
  if (summary.workingDay) return `<button class="btn dang chico" id="tdterminar">${t('agenda.yourDay.endDay')}</button>`;
  return summary.open ? `<button class="btn chico" id="tdempezar">${t('agenda.yourDay.startDay')}</button>` : '';
}

function actionsHtml(summary: DaySummary): string {
  const { isPast, own, open, withPlace } = summary;
  return `<div class="acts">
        ${own ? `<button type="button" class="btn sec chico" id="tdtarea">${t('agenda.yourDay.addTask')}</button>` : ''}
        ${!isPast && withPlace > 1 ? `<button class="btn sec chico" id="tdordenar" title="${t('agenda.yourDay.orderTitle')}">${t('agenda.yourDay.orderByDistance')}</button>` : ''}
        ${workingDayButton(summary)}
        ${isPast && open ?`<button class="btn chico" id="tdrepro">${t('agenda.yourDay.reschedulePending')}</button>` : ''}
      </div>`;
}

export function headerHtml(summary: DaySummary): string {
  const title = t(summary.isToday ? 'agenda.yourDay.titleToday' : summary.isPast ? 'agenda.yourDay.titlePast' : 'agenda.yourDay.titleFuture');
  const dayMenu = summary.isFutureOrToday ? `<button type="button" class="kmv tddiamas" id="tddiamas" aria-label="${t('agenda.yourDay.dayOptions')}" title="${t('agenda.yourDay.dayOptionsTitle')}">${legacyIcons.line('mas')}</button>` : '';
  return `
    <div class="tdhead">
      <div class="${summary.isFutureOrToday ? 'tdtitw' : ''}"><h2 class="u-p-0">${title}</h2>${summary.mine > 1 ? compactButton(summary.compact) : ''}${dayMenu}
        ${statsHtml(summary)}</div>
      ${actionsHtml(summary)}
    </div>`;
}

export function workingDayHtml(summary: DaySummary, duration: string): string {
  return summary.isToday && summary.workingDay ? `<div class="tdjornada">${t('agenda.yourDay.workingDay', { time: duration, visit: summary.visit })}</div>` : '';
}

export interface NoFit { readonly shown: boolean; readonly overLimit: boolean; readonly end: number; readonly outside: number; readonly canOrder: boolean }

/** «No cabe»: with this order the day ends after the working day (or 3 warnings or more): one notice above. */
export function noFitHtml(noFit: NoFit): string {
  if (!noFit.shown) return '';
  const end = t(noFit.end >= DAY_MINUTES ? 'agenda.yourDay.endAfterMidnight' : 'agenda.yourDay.endAround', { time: formatMinutes(noFit.end) });
  const outside = noFit.outside ? (noFit.outside === 1 ? t('agenda.yourDay.outsideOne') : t('agenda.yourDay.outsideMany', { count: noFit.outside })) : '';
  const head = noFit.overLimit ? t('agenda.yourDay.noFit', { end, outside }) : t('agenda.yourDay.badWindows');
  const order = noFit.canOrder ? `<button type="button" class="btn sec chico" id="tdnocord">${t('agenda.yourDay.orderByDistance')}</button>${t('agenda.yourDay.or')}` : '';
  return `<div class="banda-aviso" id="tdnocabe">${head}
      ${t('agenda.yourDay.beforeEach')}${order}${t('agenda.yourDay.moveFarthest')}</div>`;
}

export function othersHtml(others: readonly DayAppointmentFull[]): string {
  if (!others.length) return '';
  return `<h3 class="tdotros">${t('agenda.yourDay.othersTitle', { count: others.length })}</h3>
      <div class="lista">${others.map(item => `<div class="item u-cursor-default"><span class="ic">${item.hora ? timeText(item.hora) : '·'}</span>
        <span class="tx"><b>${escapeHtml(item.nombre)}</b><span class="sm">${escapeHtml(item.usuario ?? '')} · ${statePill(item.estado)}</span></span></div>`).join('')}</div>`;
}
