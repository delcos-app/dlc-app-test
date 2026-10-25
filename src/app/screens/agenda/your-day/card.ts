/** One appointment card of «Tu día»: who, where, when (fixed or estimated), the commercial ladder, the details and its buttons. */
import { initialsOf, legacyIcons, yourDayLegacy } from '../../../legacy/bridge';
import { t } from '../../../i18n';
import { formatMinutes, fromIsoDate, todayIso } from '../../../services/dates';
import { escapeHtml, formatNumber } from '../../../services/format';
import { isPresent, range } from '../../../services/values';
import { hasMenu } from '../appointment-options';
import { isAbsent, isDone, isOpen, pointOf, statePill } from '../appointment-state';
import { originText } from '../appointment-origin';

const DAY_MS = 864e5, NEXT_GRACE_MINUTES = 15;

export interface DayContext {
  readonly day: string; readonly isPast: boolean; readonly now: number; readonly visit: string;
  readonly estimates: Readonly<Record<string, number>>; readonly info: Readonly<Record<string, StopInfo>>;
  readonly open: readonly DayAppointmentFull[]; readonly next: DayAppointmentFull | null;
  readonly ladder: readonly { readonly valor: string }[]; readonly noFitBanner: boolean; readonly limit: number;
}

export const timeText = (time: string | null | undefined): string => escapeHtml(String(time).slice(0, 5));

/** Minutes of the day of an appointment: its fixed time, or the estimate. */
export function minutesOf(item: DayAppointmentFull, estimates: Readonly<Record<string, number>>): number | null {
  if (item.hora) return Number(String(item.hora).slice(0, 2)) * 60 + Number(String(item.hora).slice(3, 5));
  return estimates[item.id] ?? null;
}

/** The next appointment today: the first open one that did not start more than 15 minutes ago. */
export function nextOf(open: readonly DayAppointmentFull[], estimates: Readonly<Record<string, number>>, now: number): DayAppointmentFull | null {
  return open.find(item => { const minutes = minutesOf(item, estimates); return minutes === null || minutes + NEXT_GRACE_MINUTES >= now; }) ?? null;
}

const daysSince = (isoDate: string): number => Math.max(0, Math.round((fromIsoDate(todayIso()).getTime() - fromIsoDate(String(isoDate).slice(0, 10)).getTime()) / DAY_MS));

function shownTime(item: DayAppointmentFull, context: DayContext): string {
  const info = context.info[item.id] ?? {}, estimate = context.estimates[item.id];
  if (item.hora) return timeText(item.hora);
  if (!isOpen(item.estado)) return '·';
  if (context.noFitBanner && isPresent(info.llegada) && info.llegada >= context.limit) return '—';
  return estimate !== undefined && !context.isPast ? `~${formatMinutes(estimate)}` : '·';
}

function whenText(item: DayAppointmentFull, time: string, context: DayContext): string {
  if (!isOpen(item.estado)) return '';
  const minutes = minutesOf(item, context.estimates), left = minutes === null ? null : minutes - context.now;
  if (item === context.next && left !== null && left > 0) return t('agenda.card.inTime', { time: `${left >= 60 ? `${Math.floor(left / 60)} h ` : ''}${left % 60} min` });
  return time.startsWith('~') ? t('agenda.card.estimatedTime') : '';
}

/** The warning of a stop: a far location always; the others only without the general «no cabe» banner. */
function warningOf(item: DayAppointmentFull, context: DayContext): string {
  const info = context.info[item.id] ?? {};
  if (!isOpen(item.estado) || !info.aviso) return '';
  if (info.lejos) return t('agenda.card.farLocation', { km: formatNumber(info.lejos) });
  return context.noFitBanner ? '' : info.aviso;
}

type Line = readonly [icon: string, className: string, html: string, title?: string];

/** «Atiende 10:00–13:00 · esperas 20 min», only for open appointments without a warning. */
function windowsLine(item: DayAppointmentFull, info: StopInfo, warning: string): Line | null {
  if (!isOpen(item.estado) || warning || !info.ventanas?.length) return null;
  const text = t('agenda.card.attends', { windows: yourDayLegacy.windowsText(info.ventanas) }) + (info.espera ? t('agenda.card.waits', { minutes: info.espera }) : '');
  return ['puerta', '', escapeHtml(text)];
}

/** «Última visita hace 12 días» or «Primera visita» (when the data says whether there was a previous one). */
function previousLine(item: DayAppointmentFull, visit: string): Line | null {
  if (item.anterior === undefined) return null;
  if (!item.anterior) return ['reloj', '', t('agenda.card.firstVisit', { visit })];
  const days = daysSince(item.anterior.fecha);
  return ['reloj', '', t('agenda.card.lastVisit', { visit, days, unit: t(days === 1 ? 'agenda.card.day' : 'agenda.card.days') })];
}

function warningLine(item: DayAppointmentFull, info: StopInfo, warning: string): Line | null {
  if (!warning) return null;
  return ['aviso', 'tdav tdaviso', `${escapeHtml(warning)} <button type="button" class="tdavi" data-tdavi="${item.id}" aria-label="${t('agenda.yourDay.whyWarning')}">i</button>`, yourDayLegacy.explainWarning(info)];
}

function detailLines(item: DayAppointmentFull, context: DayContext): Line[] {
  const info = context.info[item.id] ?? {}, warning = warningOf(item, context), action = item.anterior?.proxima_accion;
  const lines: (Line | null)[] = [
    action ? ['toca', 'toca', t('agenda.card.due', { action: escapeHtml(action) })] : null,
    previousLine(item, context.visit),
    windowsLine(item, info, warning),
    warningLine(item, info, warning),
    isOpen(item.estado) && !pointOf(item) ? ['aviso', 'tdav', t('agenda.card.noLocation')] : null,
    item.nota ? ['nota', '', escapeHtml(item.nota)] : null,
  ];
  return lines.filter((line): line is Line => line !== null);
}

function ladderHtml(item: DayAppointmentFull, ladder: DayContext['ladder']): string {
  const level = ladder.findIndex(step => step.valor === item.estado_comercial);
  if (!ladder.length || level < 0) return '';
  const goal = ladder[level + 1];
  const bars = range(ladder.length).map(index => `<i class="${index <= level ? 'on' : index === level + 1 ? 'obj' : ''}"></i>`).join('');
  return `<div class="tdu-niv"><div class="tdu-barra" title="${escapeHtml(ladder.map(step => step.valor).join(' → '))}">${bars}</div>
        <span class="tdu-nt"><b>${escapeHtml(item.estado_comercial)}</b>${goal ? ` → ${escapeHtml(goal.valor)}` : t('agenda.card.keep')}</span></div>`;
}

function headHtml(item: DayAppointmentFull, index: number, context: DayContext): string {
  const time = shownTime(item, context), when = whenText(item, time, context), next = item === context.next;
  const where = [item.centro_nombre, item.municipio].filter(Boolean).join(' · ') || t('agenda.card.noCentre');
  return `<div class="tdu-cab">
        <div class="tdu-av" aria-hidden="true">${escapeHtml(initialsOf(item.nombre ?? ''))}<span class="n">${index + 1}</span></div>
        <div class="tdu-tit">${next ? `<span class="tdu-sig"><i></i>${t('agenda.card.next')}</span>` : ''}
          <div class="tdu-nom"><b class="tdu-nb" title="${t('agenda.card.seeAppointment')}">${escapeHtml(item.nombre)}</b>${item.clase ? `<span class="tdu-k ${escapeHtml(item.clase)}" title="${t('agenda.card.classTitle', { name: escapeHtml(item.clase) })}">${escapeHtml(item.clase)}</span>` : ''}${item.urgente ? `<span class="pill p-urg">${t('agenda.card.urgent')}</span>` : ''}</div>
          <span class="tdu-sub">${escapeHtml(where)}</span></div>
        <div class="tdu-hora"><span class="h" title="${t(item.hora ? 'agenda.card.fixedTime' : 'agenda.card.estimatedByOrder')}">${time}</span>${when ? `<span class="tdu-cu">${when}</span>` : ''}</div>
      </div>`;
}

function orderButtons(item: DayAppointmentFull, context: DayContext): string {
  const position = context.open.indexOf(item);
  return `<button class="kmv" type="button" data-td="sube|${item.id}" aria-label="${t('agenda.card.moveUp')}" title="${t('agenda.card.moveUp')}" ${position <= 0 ? 'disabled' : ''}>${legacyIcons.arrow('arriba')}</button>`
    + `<button class="kmv" type="button" data-td="baja|${item.id}" aria-label="${t('agenda.card.moveDown')}" title="${t('agenda.card.moveDown')}" ${position >= context.open.length - 1 ? 'disabled' : ''}>${legacyIcons.arrow('abajo')}</button>`;
}

function footHtml(item: DayAppointmentFull, context: DayContext): string {
  const open = isOpen(item.estado), canMove = open && !context.isPast, record = open && yourDayLegacy.canRecordOn(item.fecha);
  const again = isAbsent(item.estado) && !context.isPast;
  return `<div class="tdu-pie"><span class="tdu-est">${statePill(item.estado)}<span class="sm">${originText(item)}</span></span>
        <span class="tdu-ops">${canMove ? orderButtons(item, context) : ''}${hasMenu(item) ? `<button class="btn sec tdmas" type="button" data-td="mas|${item.id}" aria-label="${t('agenda.card.moreActions')}">⋯</button>` : ''}</span>
        ${again ? `<button class="btn sec tdu-reg" type="button" data-td="nueva|${item.id}">${t('agenda.card.newAppointment')}</button>` : ''}
        ${record ? `<button class="btn ${item === context.next ? '' : 'sec'} tdu-reg" type="button" data-td="visita|${item.id}">${t('agenda.card.record', { visit: context.visit })}</button>` : ''}</div>`;
}

function statusClass(state: string): string {
  if (isOpen(state)) return 'abierta';
  if (isDone(state)) return 'hecha';
  return isAbsent(state) ? 'ausente' : 'cerrada';
}

/** The card. Moved or discarded appointments show in one line (v2.273.0); the colour says how it stands. */
export function appointmentCard(item: DayAppointmentFull, index: number, context: DayContext): string {
  const open = isOpen(item.estado), mini = !open && !isDone(item.estado) && !isAbsent(item.estado), lines = detailLines(item, context);
  const classes = `tdu ${item === context.next ? 'sig' : ''} ${open ? '' : 'hecha'} ${mini ? 'tdmini' : ''} tdst-${statusClass(item.estado)}`;
  const details = lines.length ? `<ul class="tdu-dat">${lines.map(([iconName, className, html, title]) => `<li class="${className}"${title ? ` title="${escapeHtml(title)}"` : ''}>${legacyIcons.line(iconName)}<span>${html}</span></li>`).join('')}</ul>` : '';
  return `<article class="${classes}" data-tdu="${item.id}" data-tdf="${item.cuenta_id}" tabindex="0" aria-label="${escapeHtml(item.nombre)}">
      ${headHtml(item, index, context)}
      ${ladderHtml(item, context.ladder)}
      ${details}
      ${footHtml(item, context)}
    </article>`;
}
