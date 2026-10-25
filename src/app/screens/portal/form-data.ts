/**
 * «Mi ficha»: the data behind the form. Reads the saved proposal (or the card) into the form, reads what is written on screen and
 * understands hours written loosely («930», «9-14», «mañana»). Migrated from the legacy pmFichaDatos, pmLeerForm, pmRangos and
 * pmHora (v2.413.0).
 */
import { portalState, WEEKDAYS, type CardForm, type DayRanges, type KnownPlace, type Place } from './model';

const MAX_HOUR = 23, MAX_MINUTE = 59, MORNING: [string, string] = ['09:00', '14:00'], AFTERNOON: [string, string] = ['16:00', '20:00'];

function splitTime(text: string): [string, string] {
  if (text.includes(':')) { const [hours = '', minutes = ''] = text.split(':'); return [hours, minutes]; }
  if (text.length <= 2) return [text, '00'];
  return [text.slice(0, text.length - 2), text.slice(-2)];
}

/** «930» → «09:30»; «9» → «09:00»; '' when it is not an hour. */
export function timeOf(value: unknown): string {
  const text = String(value ?? '').replace(/[^\d:]/g, '');
  const [hoursText, minutesText] = splitTime(text), hours = Number(hoursText), minutes = Number(minutesText || 0);
  if (!text || isNaN(hours) || hours > MAX_HOUR || minutes > MAX_MINUTE) return '';
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/** «9-14 y 16:30 a 20» → [['09:00','14:00'], ['16:30','20:00']]; «mañana» and «tarde» give the usual hours. */
export function rangesOf(value: unknown): DayRanges {
  const text = String(value ?? ''), found: DayRanges = [];
  const pattern = /(\d{1,2})(?::(\d{2}))?\s*[-–a]\s*(\d{1,2})(?::(\d{2}))?/g;
  for (let match = pattern.exec(text); match; match = pattern.exec(text)) found.push([timeOf(`${match[1]}:${match[2] ?? '00'}`), timeOf(`${match[3]}:${match[4] ?? '00'}`)]);
  if (!found.length && /mañana/i.test(text)) found.push([...MORNING]);
  if (/tarde/i.test(text) && !found.some(range => range[0] >= '14:00')) found.push([...AFTERNOON]);
  return found;
}

function daysOf(saved: unknown): Record<string, DayRanges> {
  const days: Record<string, DayRanges> = {}, source = (saved ?? {}) as Record<string, unknown>;
  WEEKDAYS.forEach(day => {
    const value = source[day];
    const list = Array.isArray(value) ? value.map(item => (Array.isArray(item) ? item as [string, string] : rangesOf(item)[0])).filter((range): range is [string, string] => Boolean(range)) : rangesOf(value);
    if (list.length) days[day] = list;
  });
  return days;
}

interface CardAnswer { faltan?: string[]; propuesta?: typeof portalState.proposal; ubicaciones?: KnownPlace[]; cuenta?: { telefono?: string | null; email?: string | null } }

const placeOf = (known: KnownPlace): Place => ({ centro_id: known.centro_id, ubicacion_id: known.id, nombre: known.nombre, direccion: known.direccion, municipio: known.municipio, dias: {} });

/** The phone and email sent, else the ones of the card. */
const contactOf = (sent: Partial<CardForm>, account: NonNullable<CardAnswer['cuenta']>): { telefono: string; email: string } =>
  ({ telefono: sent.telefono ?? account.telefono ?? '', email: sent.email ?? account.email ?? '' });

/** Keeps what portal_mi_ficha answered: what is missing, the proposal sent and the form to show (the proposal, else the card). */
export function loadForm(saved: object): void {
  const answer = saved as CardAnswer;
  portalState.missing = answer.faltan ?? []; portalState.proposal = answer.propuesta ?? null; portalState.places = answer.ubicaciones ?? [];
  const sent = (portalState.proposal?.datos ?? {}) as Partial<CardForm>;
  const places = sent.consultas ?? portalState.places.map(known => ({ ...placeOf(known), dias: known.dias as Place['dias'] }));
  portalState.form = {
    ...contactOf(sent, answer.cuenta ?? {}),
    consultas: places.map(place => ({ ...place, dias: daysOf(place.dias) })),
    visitas: { como: '', momento: '', ...sent.visitas }, notas: sent.notas ?? '',
  };
}

const field = (id: string): string => (document.getElementById(id) as HTMLInputElement | null)?.value ?? '';

/** Copies what is written on screen into the form. */
export function readForm(): void {
  const form = portalState.form;
  if (!form || !document.getElementById('pmtel')) return;
  form.telefono = field('pmtel').trim(); form.email = field('pmmail').trim();
  form.visitas = { como: field('pmcomo'), momento: field('pmmom').trim() }; form.notas = field('pmnot').trim();
  document.querySelectorAll<HTMLInputElement>('#pmficha [data-pmcf]').forEach(input => {
    const [index = '', key = ''] = (input.dataset.pmcf ?? '').split('|'), place = form.consultas[Number(index)];
    if (!place) return;
    if (key === 'nombre') place.nombre = input.value.trim();
    if (key === 'direccion') { place.direccion = input.value.trim(); place.municipio = ''; }
  });
  document.querySelectorAll<HTMLInputElement>('#pmficha [data-pmhi]').forEach(input => {
    const [index = '', day = '', row = '', side = ''] = (input.dataset.pmhi ?? '').split('|');
    const range = form.consultas[Number(index)]?.dias[day]?.[Number(row)];
    if (range) range[Number(side) as 0 | 1] = timeOf(input.value) || input.value.trim();
  });
}

const VALID_TIME = /^\d\d:\d\d$/;

/** A range with both hours and the end after the start. */
export const isValidRange = (range: readonly string[]): boolean => VALID_TIME.test(range[0] ?? '') && VALID_TIME.test(range[1] ?? '') && (range[1] ?? '') > (range[0] ?? '');
