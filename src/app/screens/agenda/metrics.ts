/**
 * The four figures in the Agenda header (Hoy, Semana, Cierres, Por visitar), from agenda_metricas.
 * Migrated from the legacy agPastillasHtml / agPastillas / agMetricas (v2.390.0).
 */
import { appointments, callRpc, legacyAgenda, term } from '../../legacy/bridge';
import { t, type MessageKey } from '../../i18n';
import { todayIso } from '../../services/dates';
import { escapeHtml, formatNumber } from '../../services/format';

type Pill = readonly [label: MessageKey, figure: string, detail: string, className: string];

const count = (value: number | null | undefined): string => formatNumber(value ?? 0);
const decimal = (value: number | null | undefined): string => (value === undefined || value === null ? '0' : String(value).replace('.', ','));

/** «Hoy» uses the same appointments as «Tu día» when today is shown. */
function todayFigures(metrics: AgendaMetrics): { done: string; total: string } {
  const day = legacyAgenda.selectedDate(), today = todayIso();
  if (day === today && legacyAgenda.loadedDay() === day) {
    const active = legacyAgenda.dayAppointments().filter(item => !appointments.isCancelled(item.estado));
    return { done: formatNumber(active.filter(item => !appointments.isOpen(item.estado)).length), total: formatNumber(active.length) };
  }
  return { done: count(metrics.hoy?.visitadas), total: count(metrics.hoy?.citas) };
}

function pills(metrics: AgendaMetrics): Pill[] {
  const { done, total } = todayFigures(metrics);
  const visits = term('visita', { number: 'p' }), week = metrics.semana ?? {}, closings = metrics.cierres ?? {}, pending = metrics.pendientes ?? {};
  return [
    ['agenda.metrics.today', `${done}/${total}`, t('agenda.metrics.todayDetail', { done, total, average: decimal(metrics.media_dia), visits }), ''],
    ['agenda.metrics.week', count(week.visitas), t('agenda.metrics.weekDetail', { count: count(week.visitas), visits, average: decimal(week.media) }), ''],
    ['agenda.metrics.closings', count(closings.hoy), t('agenda.metrics.closingsDetail', { count: count(closings.hoy), average: decimal(closings.media_dia) }), ''],
    ['agenda.metrics.toVisit', count((pending.urgentes ?? 0) + (pending.sin_visita ?? 0)),
      t('agenda.metrics.toVisitDetail', { urgent: count(pending.urgentes), noVisit: count(pending.sin_visita), visit: term('visita') }), 'agp-pend'],
  ];
}

/** The pills as HTML (empty until the metrics arrive). */
export function metricsHtml(): string {
  const metrics = legacyAgenda.metrics();
  if (!metrics) return '';
  return pills(metrics).map(([label, figure, detail, className]) =>
    `<span class="agp ${className}" title="${escapeHtml(detail)}">${escapeHtml(t(label))} <b>${escapeHtml(figure)}</b></span>`).join('');
}

/** Paints the pills again, only if a figure changed (so they do not flicker). */
export function refreshMetrics(): void {
  const box = document.getElementById('aghud') as (HTMLElement & { lastHtml?: string }) | null;
  if (!legacyAgenda.isDayView() || !box || !legacyAgenda.metrics()) return;
  const html = metricsHtml();
  if (box.lastHtml !== html) { box.innerHTML = html; box.lastHtml = html; }
}

/** Asks agenda_metricas again and repaints the pills. */
export async function reloadMetrics(): Promise<void> {
  if (!legacyAgenda.isDayView()) return;
  const { data } = await callRpc<AgendaMetrics>('agenda_metricas', { p_usuario: legacyAgenda.viewedUserId() });
  if (!data || !legacyAgenda.isDayView()) return;
  legacyAgenda.setMetrics(data);
  refreshMetrics();
}
