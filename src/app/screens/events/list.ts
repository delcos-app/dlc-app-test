/** Eventos → «Eventos»: upcoming and past events with their attendees and costs. Migrated from the legacy pintarEventos (v2.407.0). */
import { currentScreen, legacyDb, relatedLegacy } from '../../legacy/bridge';
import { t } from '../../i18n';
import { todayIso } from '../../services/dates';
import { formatLongDate } from '../../services/date-format';
import { escapeHtml, formatCurrency } from '../../services/format';
import { orFallback, sum } from '../../services/values';
import { editEvent } from './editor';
import { attendeeTotal, type Attendee, type EventRow } from './model';

const SHOWN_PAST = 50, LIMIT = 200;

type ListedEvent = EventRow & { eventos_asistentes?: Attendee[] | null };

/** «sábado, 24 de octubre · 10:00 · Taller · Hotel X»: when, what and where of an event. */
export function eventSummary(event: EventRow): string {
  return `${escapeHtml(formatLongDate(event.fecha))}${event.hora ? ` · ${escapeHtml(String(event.hora).slice(0, 5))}` : ''}${event.tipo ? ` · ${escapeHtml(event.tipo)}` : ''} · ${event.en_linea ? t('events.list.online') : escapeHtml(orFallback(event.lugar, t('events.list.noPlace')))}`;
}

function eventRow(event: ListedEvent): string {
  const attendees = event.eventos_asistentes ?? [], total = sum(attendees.map(attendeeTotal));
  const count = attendees.length === 1 ? t('events.list.oneAttendee') : t('events.list.attendees', { count: attendees.length });
  return `<button type="button" class="item evrow" data-ev="${event.id}"><span class="tx"><b>${escapeHtml(event.titulo)}</b>
      <span class="sm">${eventSummary(event)} · ${count}</span></span>
      ${total ? `<span class="evtot">${formatCurrency(total)}</span>` : ''}</button>`;
}

const section = (title: string, rows: readonly ListedEvent[], empty: string): string =>
  `<section class="card evbloque"><h2>${title}</h2>${rows.length ? `<div class="lista">${rows.map(eventRow).join('')}</div>` : `<div class="vacio vlinea">${empty}</div>`}</section>`;

export async function paintEvents(): Promise<void> {
  if (!document.getElementById('cfgcuerpo')) return;
  const { data, error } = await legacyDb().from<ListedEvent[]>('eventos').select('id,titulo,tipo,fecha,hora,lugar,en_linea,creado_por,eventos_asistentes(id,estado,inscripcion,viaje,comida,honorarios)')
    .order('fecha', { ascending: false }).limit(LIMIT);
  // The page may have been painted again meanwhile: the box is looked up after the answer
  const box = document.getElementById('cfgcuerpo');
  if (!box || currentScreen() !== 'eventos') return;
  if (error) { box.innerHTML = `<div class="vacio">${t('events.list.couldNotLoad')}</div>`; return; }
  const today = todayIso(), list = data ?? [];
  const upcoming = list.filter(event => event.fecha >= today).reverse(), past = list.filter(event => event.fecha < today);
  box.innerHTML = `<div class="evpag"><div class="evcab"><button type="button" class="btn" id="evnuevo">${t('events.list.newEvent')}</button></div>
    ${section(t('events.list.upcoming'), upcoming, t('events.list.noUpcoming'))}
    ${section(t('events.list.past'), past.slice(0, SHOWN_PAST), t('events.list.noPast'))}</div>`;
  const add = document.getElementById('evnuevo'); if (add) add.onclick = (): void => { editEvent(null); };
  box.querySelectorAll<HTMLElement>('[data-ev]').forEach(button => { button.onclick = (): void => { relatedLegacy.openEvent(button.dataset.ev ?? ''); }; });
}

