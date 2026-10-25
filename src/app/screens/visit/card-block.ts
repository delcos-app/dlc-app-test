/**
 * «Para la visita» at the top of the account card: where (centre, floor, room, how to get there), when (their timetable today and
 * the centre's), how to get in, what was left pending in the last visit, the notes and whom to call. Migrated from the legacy
 * fichaVisitaHTML and consultaDeLaVisita (v2.412.0).
 */
import { cardBaseLegacy, cardSectionsLegacy, editorLegacy, icon, term } from '../../legacy/bridge';
import { visitLegacy } from '../../legacy/visit-bridge';
import { t, type MessageKey } from '../../i18n';
import { formatShortDate } from '../../services/date-format';
import { todayIso } from '../../services/dates';
import { escapeHtml } from '../../services/format';
import { orFallback } from '../../services/values';
import { privateConsultation } from '../accounts/editor-form/model';

const WEEK = 'LMXJVSD', WORKDAYS = ['L', 'M', 'X', 'J', 'V'];
const DAY_NAMES = new Map<string, MessageKey>([
  ['L', 'visit.days.monday'], ['M', 'visit.days.tuesday'], ['X', 'visit.days.wednesday'], ['J', 'visit.days.thursday'],
  ['V', 'visit.days.friday'], ['S', 'visit.days.saturday'], ['D', 'visit.days.sunday'],
]);

type BlockConsultation = CardConsultation & { horario_centro?: Record<string, string | null> | null };
type BlockAccount = CardAccount & { urgente_motivo?: string | null; nota?: string | null; telefono?: string | null; contacto?: string | null };
type BlockVisit = CardVisit & { detalles?: unknown };

/** The consultation of the visit: the one in the centre of the appointment; else the one open today; else the main one. */
export function visitConsultation(consultations: readonly CardConsultation[]): CardConsultation | undefined {
  const centre = editorLegacy.centreFromCard(), preferred = centre ? visitLegacy.normalise(centre) : '';
  const fromAppointment = preferred ? consultations.find(item => visitLegacy.normalise(item.centro_nombre ?? '') === preferred) : undefined;
  if (fromAppointment) return fromAppointment;
  const today = visitLegacy.weekdayLetter();
  return consultations.find(item => item.dias?.[today]) ?? consultations[0];
}

const row = (iconName: string, html: string, extraClass = ''): string =>
  `<div class="fvfila ${extraClass}"><span class="fvico">${icon(iconName)}</span><div>${html}</div></div>`;

function placeRow(consultation: BlockConsultation): string {
  const where = [consultation.planta, consultation.sala].map(part => String(part ?? '').trim()).filter(part => part && !/^[-–·.]+$/.test(part)).map(escapeHtml).join(' · ');
  const address = escapeHtml([consultation.direccion, [consultation.cp, consultation.municipio].filter(Boolean).join(' ')].filter(Boolean).join(', ')) || t('visit.block.noAddress');
  const directions = consultation.lat ? `<button class="btn sec fvbtn" type="button" data-nav="${cardBaseLegacy.directionsAttribute([consultation.lat, consultation.lon ?? 0])}">${icon('map-pin')} ${t('visit.block.directions')}</button>` : '';
  return row('building-2', `<b>${escapeHtml(orFallback(consultation.centro_nombre, privateConsultation()))}</b>${where ? `<span class="fvdonde">${where}</span>` : ''}
      <div class="sm">${address}</div>
      ${directions}`);
}

/** Their timetable today in this consultation (or the next day they attend) and the centre's timetable today. */
function whenRow(consultation: BlockConsultation): string {
  const days = consultation.dias ?? {}, today = visitLegacy.weekdayLetter(), hours = days[today];
  const position = WEEK.indexOf(today), next = hours ? undefined : [...WEEK.slice(position + 1), ...WEEK.slice(0, position + 1)].find(day => days[day]);
  const centre = consultation.horario_centro?.[today];
  const head = hours ? `<b>${t('visit.block.attendsToday', { hours: escapeHtml(hours) })}</b>`
    : next ? t('visit.block.notToday', { day: t(DAY_NAMES.get(next) ?? 'visit.days.monday'), hours: escapeHtml(days[next]) }) : t('visit.block.noTimetable');
  return row('clock', `${head}
      ${centre ? `<div class="sm">${t('visit.block.centreOpen', { hours: escapeHtml(centre) })}</div>` : ''}
      <div class="dias fvdias">${WORKDAYS.map(day => `<span class="${days[day] ? 'on' : ''} ${day === today ? 'hoy' : ''}" title="${escapeHtml(days[day] ?? '')}">${day}</span>`).join('')}</div>`);
}

function consultationRows(consultation: BlockConsultation | undefined): string[] {
  if (!consultation) return [row('building-2', `<span class="sm">${t('visit.block.noConsultation', { consultation: term('consulta') })}</span>`)];
  const rows = [placeRow(consultation), whenRow(consultation)];
  if (consultation.indicaciones) rows.push(row('info', `<b>${t('visit.block.inside')}</b> ${escapeHtml(consultation.indicaciones)}`, 'fvind'));
  return rows;
}

function lastVisitRow(last: BlockVisit | undefined): string[] {
  if (!last) return [];
  const material = cardSectionsLegacy.visitDetails(last);
  return [row('notebook-pen', `<b>${t('visit.block.lastVisit', { visit: term('visita'), date: formatShortDate(last.fecha) })}</b> · ${escapeHtml(orFallback((last.resultados ?? []).join(' + '), t('visit.block.noResult')))}
      ${last.nota ? `<div class="sm">${escapeHtml(last.nota)}</div>` : ''}${material ? `<div class="sm">${t('visit.block.material', { material: escapeHtml(material) })}</div>` : ''}`)];
}

function pendingRow(visits: readonly BlockVisit[]): string[] {
  const pending = visits.find(visit => Boolean(visit.proxima_accion) || Boolean(visit.proxima_fecha));
  if (!pending) return [];
  const date = pending.proxima_fecha, today = todayIso();
  const pill = !date ? '' : date < today ? `<span class="pill p-bor">${t('visit.block.late')}</span>` : date === today ? `<span class="pill p-est">${t('visit.block.today')}</span>` : '';
  return [row('clipboard-list', `<b>${t('visit.block.pending')}</b> ${escapeHtml(orFallback(pending.proxima_accion, t('visit.block.visitAgain', { visit: term('visita') })))}${date ? ` · ${formatShortDate(date)}` : ''} ${pill}`)];
}

function contactRows(account: BlockAccount, consultation: BlockConsultation | undefined): string[] {
  const rows = account.nota ? [row('message-circle', `<b>${t('visit.block.notes')}</b> ${escapeHtml(account.nota)}`)] : [];
  const phones = [account.telefono, consultation?.telefono].filter((phone): phone is string => Boolean(phone)).filter((phone, index, all) => all.indexOf(phone) === index);
  if (phones.length || account.contacto) {
    rows.push(row('phone', `${phones.map(phone => `<a href="tel:${escapeHtml(phone.replace(/\s+/g, ''))}"><b>${escapeHtml(phone)}</b></a>`).join(' · ')}
    ${account.contacto ? `<div class="sm">${escapeHtml(account.contacto)}</div>` : ''}`));
  }
  return rows;
}

/** The «Para la visita» block of the account card. */
export function visitBlock(account: CardAccount, consultations: readonly CardConsultation[], visits: readonly CardVisit[]): string {
  const person = account as BlockAccount, consultation = visitConsultation(consultations) as BlockConsultation | undefined;
  const urgent = person.urgente ? [row('circle-alert', `<b>${t('visit.block.urgent')}</b>${person.urgente_motivo ? `: ${escapeHtml(person.urgente_motivo)}` : ''}`, 'fvurg')] : [];
  const rows = [...urgent, ...consultationRows(consultation), ...lastVisitRow(visits[0]), ...pendingRow(visits), ...contactRows(person, consultation)];
  const title = t('visit.block.title', { visit: term('visita') });
  return `<section class="fvis" aria-label="${title}"><h3>${title}</h3>${rows.join('')}</section>`;
}
