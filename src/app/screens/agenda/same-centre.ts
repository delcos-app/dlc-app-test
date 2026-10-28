/**
 * «En este centro también»: under the first appointment of the day in a centre (less than 200 m away, or the same name), the
 * other people of that centre who are due a visit, grouped by when they attend there that day.
 * Migrated from the legacy agTamb / agTambGrupos and the click handlers of legado 092 (v2.391.0).
 */
import { agendaActions, agendaSuggestions, appointments, icon, legacyAgenda } from '../../legacy/bridge';
import { showCentreSheet as showCentre } from '../accounts/lazy';
import { t } from '../../i18n';
import { fromIsoDate } from '../../services/dates';
import { escapeHtml, looseText } from '../../services/format';
import { distanceKm } from '../../services/geo';
import { isPresent } from '../../services/values';

const NEAR_KM = 0.2, SHOWN_PEOPLE = 6, MAX_DAYS_LISTED = 3;
/** Day letters as in ubicaciones.dias, from Sunday (Date.getDay) and from Monday (the order they are listed in). */
const LETTERS_FROM_SUNDAY = 'DLMXJVS', LETTERS_FROM_MONDAY = 'LMXJVSD';
const AFTERNOON_HOUR = 14;

export interface AttendanceGroup { readonly title: string; readonly people: readonly SameCentrePerson[] }

function attendsInAfternoon(timetable: string): boolean {
  const hour = Number.parseInt(/(\d{1,2})(?::\d{2})?/.exec(timetable)?.[1] ?? '', 10);
  return /tarde/i.test(timetable) || (!/ma[ñn]ana/i.test(timetable) && hour >= AFTERNOON_HOUR);
}

/** Morning / afternoon / another day / no timetable, from the timetable of their consultation (dias: {"L": "Mañana 10:00-13:00"…}). */
export function groupByAttendance(people: readonly SameCentrePerson[], isoDate: string): AttendanceGroup[] {
  const letter = LETTERS_FROM_SUNDAY[fromIsoDate(isoDate).getDay()] ?? '';
  const morning: SameCentrePerson[] = [], afternoon: SameCentrePerson[] = [], otherDay: SameCentrePerson[] = [], noTimetable: SameCentrePerson[] = [];
  const otherDays = new Set<string>();
  people.forEach(person => {
    const days = person.dias ?? {}, today = days[letter], withTimetable = Object.keys(days).filter(key => days[key]);
    if (!withTimetable.length) noTimetable.push(person);
    else if (!today) { otherDay.push(person); withTimetable.forEach(key => otherDays.add(key)); }
    else (attendsInAfternoon(today) ? afternoon : morning).push(person);
  });
  const names = t('dates.weekdaysLong').split(',');
  const listed = [...LETTERS_FROM_MONDAY].map((key, index) => (otherDays.has(key) ? names[index] : undefined)).filter((name): name is string => Boolean(name));
  const otherTitle = t('agenda.sameCentre.otherDay') + (listed.length && listed.length <= MAX_DAYS_LISTED ? ` (${listed.join(', ')})` : '');
  return [
    { title: t('agenda.sameCentre.morning'), people: morning },
    { title: t('agenda.sameCentre.afternoon'), people: afternoon },
    { title: otherTitle, people: otherDay },
    { title: t('agenda.sameCentre.noTimetable'), people: noTimetable },
  ].filter(group => group.people.length);
}

const toNumber = (value: number | string | null | undefined): number => Number(value);

function isSameCentre(group: SameCentreGroup, appointment: AgendaAppointment): boolean {
  if (isPresent(group.lat) && isPresent(appointment.lat)) {
    return distanceKm([toNumber(group.lat), toNumber(group.lon)], [toNumber(appointment.lat), toNumber(appointment.lon)]) <= NEAR_KM;
  }
  return Boolean(group.centro_nombre && appointment.centro_nombre && looseText(group.centro_nombre) === looseText(appointment.centro_nombre));
}

function personChip(person: SameCentrePerson): string {
  const missing = person.falta?.length ? t('agenda.sameCentre.missing', { fields: person.falta.join(', ') }) : '';
  const title = person.visitar ? t('agenda.sameCentre.addAppointment', { reason: person.visitar }) : t('agenda.sameCentre.seeCard') + missing;
  return `<button type="button" data-agti="${person.id}" data-agtv="${person.visitar ? 1 : ''}" title="${escapeHtml(title)}">${person.visitar ? '<i>+</i> ' : ''}${escapeHtml(person.nombre)}</button>`;
}

function blockHtml(group: SameCentreGroup, people: readonly SameCentrePerson[], isoDate: string): string {
  const chips = groupByAttendance(people.slice(0, SHOWN_PEOPLE), isoDate)
    .map(({ title, people: list }) => `<div class="agtambg"><span class="agtambgt">${escapeHtml(title)}</span><div class="agtambl">${list.map(personChip).join('')}</div></div>`).join('')
    + (people.length > SHOWN_PEOPLE ? `<span class="sm">${t('agenda.sameCentre.andMore', { count: people.length - SHOWN_PEOPLE })}</span>` : '');
  const centre = group.centro_id ? escapeHtml(group.centro_id) : '';
  const opener = centre ? ` data-agtc="${centre}" role="button" tabindex="0" title="${t('agenda.sameCentre.openCentre')}"` : '';
  return `<div class="agtamb${centre ? ' agtambc' : ''}"${opener}><div class="agtambh">${icon('map-pin')} ${t('agenda.sameCentre.title')}${centre ? `<span class="agtambver">${t('agenda.sameCentre.seeCentre')}</span>` : ''}</div>${chips}</div>`;
}

/** Accounts that already have an appointment on the shown day. */
export function withAppointmentToday(): Set<string | undefined> {
  return new Set(legacyAgenda.dayAppointments().filter(item => !appointments.isCancelled(item.estado)).map(item => item.cuenta_id));
}

/** Paints the blocks in «Tu día» (removing the previous ones). */
export function paintSameCentre(): void {
  const body = document.getElementById('agcuerpo'), suggestions = agendaSuggestions.forDay(), isoDate = legacyAgenda.selectedDate();
  if (!body || !suggestions || !isoDate || suggestions.fecha !== isoDate) return;
  body.querySelectorAll('.agtamb').forEach(element => { element.remove(); });
  const cards = [...body.querySelectorAll<HTMLElement>('.tdu[data-tdu]')];
  if (!cards.length) return;
  const byId = new Map(legacyAgenda.dayAppointments().map(item => [String(item.id), item]));
  const already = withAppointmentToday(), used = new Set<HTMLElement>();
  suggestions.centros.forEach(group => {
    const people = (group.cuentas ?? group.medicos ?? []).filter(person => !already.has(person.id));
    if (!people.length) return;
    const card = cards.find(element => {
      const appointment = byId.get(element.dataset.tdu ?? '');
      return appointment !== undefined && !used.has(element) && isSameCentre(group, appointment);
    });
    if (!card) return;
    used.add(card);
    (card.querySelector('.tdu-pie') ?? card.lastElementChild)?.insertAdjacentHTML('beforebegin', blockHtml(group, people, isoDate));
  });
}

/** Clicks on a block open the centre; clicks on a person add an appointment (if due) or open their card. Installed once. */
export function listenToSameCentre(): void {
  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    const person = target?.closest<HTMLElement>('#agcuerpo .agtamb [data-agti]');
    if (person) {
      event.stopPropagation();
      if (person.dataset.agtv) agendaActions.newAppointment(person.dataset.agti ?? '', legacyAgenda.selectedDate());
      else agendaActions.openAccount(person.dataset.agti ?? '');
      return;
    }
    const block = target?.closest<HTMLElement>('#agcuerpo .agtamb[data-agtc]');
    if (block) { event.stopPropagation(); void showCentre(block.dataset.agtc ?? ''); }
  }, true);
  document.addEventListener('keydown', event => {
    const block = event.target instanceof Element ? event.target.closest<HTMLElement>('#agcuerpo .agtamb[data-agtc]') : null;
    if (block && event.target === block && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); void showCentre(block.dataset.agtc ?? ''); }
  });
}
