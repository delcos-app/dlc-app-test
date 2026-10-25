/**
 * Portal del profesional y del centro: what the page remembers (tab, the card form, what is missing, the proposal, the places), the
 * company words its texts use, the «i» help button and the failure texts. Migrated from the legacy PM, pmAyu, MOTIVO_PORTAL and
 * hiloMensajes (v2.413.0).
 */
import { cardSectionsLegacy, term } from '../../legacy/bridge';
import { t, type MessageKey } from '../../i18n';
import { escapeHtml } from '../../services/format';

/** Hours of one day: [from, to] pairs written «09:00». */
export type DayRanges = [string, string][];

/** A place where the professional (or the centre) attends; the keys are the ones the database stores. */
export interface Place {
  centro_id?: string | null | undefined; ubicacion_id?: string | null | undefined; nombre?: string | null | undefined; direccion?: string | null | undefined; municipio?: string | null | undefined;
  dias: Record<string, DayRanges>;
}

/** «Mi ficha» as it is being written (sent as a proposal with these keys). */
export interface CardForm { telefono: string; email: string; consultas: Place[]; visitas: { como: string; momento: string }; notas: string }

export interface FoundCentre { id: string; nombre: string; direccion?: string | null; municipio?: string | null }
export interface KnownPlace { id: string; centro_id?: string | null; nombre?: string | null; direccion?: string | null; municipio?: string | null; dias?: unknown }

/** What the page remembers between paints (the tests read `form` through the legacy PM). */
export const portalState = {
  tab: 'res',
  form: null as CardForm | null,
  missing: [] as string[],
  proposal: null as { estado?: string; modificado_en?: string; datos?: Record<string, unknown> } | null,
  places: [] as KnownPlace[],
  found: [] as FoundCentre[],
  /** The centre pays its orders in advance (company setting, read with its orders). */
  prepayment: false,
};

/** Monday to Saturday, as the timetable stores them. */
export const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S'] as const;

/** The portal of a centre (instead of a professional's). */
export const isCentre = (): boolean => cardSectionsLegacy.can('portal_centro');

/** The company words the portal texts use. */
export const words = (): Readonly<Record<'orders' | 'order' | 'Orders' | 'visits' | 'theVisits' | 'professional' | 'professionals' | 'Professional' | 'patients' | 'place', string>> => ({
  orders: term('pauta', { number: 'p' }), order: term('pauta'), Orders: term('pauta', { number: 'p', articleCapital: 'C' }),
  visits: term('visita', { number: 'p' }), theVisits: term('visita', { number: 'p', article: 'el' }),
  professional: term('medico'), professionals: term('medico', { number: 'p' }), Professional: term('medico', { capital: 'C' }),
  patients: term('paciente', { number: 'p' }), place: term('consulta', { capital: 'C' }),
});

/** The «i» that opens a help text. */
export const helpButton = (title: string, text: string): string =>
  `<button type="button" class="ai" data-ayuda-tit="${escapeHtml(title)}" data-ayuda-txt="${escapeHtml(text)}" aria-label="${t('portal.whatIsIt')}">i</button>`;

/** Grey boxes while a tab loads. */
export function skeleton(card: boolean): string {
  const box = '<div class="card ancard pmsk"><span class="plsk"></span></div>';
  return card ? `<div class="pmfila">${box}${box}</div><div class="pmfila">${box}</div>` : `<div class="pmfila pm3">${box}${box}${box}</div><div class="pmfila pm3">${box}${box}${box}</div>`;
}

const FAILURES = new Map<string, MessageKey>([
  ['permiso', 'portal.failures.permission'], ['extra', 'portal.failures.extra'], ['material', 'portal.failures.material'],
  ['cantidad', 'portal.failures.quantity'], ['vacio', 'portal.failures.empty'], ['cerrada', 'portal.failures.closed'], ['no_existe', 'portal.failures.gone'],
]);

/** Why a portal call failed, for people. */
export const failureText = (result: { motivo?: string } | null | undefined): string => t(FAILURES.get(result?.motivo ?? '') ?? 'portal.failures.generic');

export interface PortalMessage { id: string; texto: string; del_portal: boolean; creado_en: string; leido_en?: string | null }

/** «24 oct, 10:30». */
export const shortDateTime = (value: string): string =>
  new Date(value).toLocaleString(t('dates.locale'), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** The messages of an account: the professional sees theirs; whoever keeps the card, those of that card. */
export function messageThread(list: readonly PortalMessage[], fromProfessional: boolean): string {
  if (!list.length) return `<div class="sm">${t('portal.messages.none')}</div>`;
  return `<div class="hilo">${list.map(message => `<div class="msj ${message.del_portal === fromProfessional ? 'mio' : 'suyo'}"><div>${escapeHtml(message.texto)}</div>
      <span class="sm">${message.del_portal ? escapeHtml(words().Professional) : t('portal.messages.team')} · ${shortDateTime(message.creado_en)}</span></div>`).join('')}</div>`;
}

/** «dónde y cuándo atiendes, un teléfono de contacto y cómo prefieres las visitas». */
export function missingText(): string {
  const labels = new Map<string, string>([
    ['horario', t(isCentre() ? 'portal.missing.timetableCentre' : 'portal.missing.timetable')], ['telefono', t('portal.missing.phone')],
    ['visitas', t('portal.missing.visits', words())],
  ]);
  const list = portalState.missing.map(key => labels.get(key)).filter((label): label is string => Boolean(label));
  const last = list[list.length - 1];
  if (!last) return t('portal.missing.something');
  return list.length > 1 ? t('portal.missing.join', { first: list.slice(0, -1).join(', '), last }) : last;
}
