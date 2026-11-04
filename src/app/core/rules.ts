/**
 * Terms and rules each company sets in Configuración (plan 12.2, batch 3, v2.466.0; SQL 193 reads the same settings). Without the
 * setting, today's value: the companies of today (DLC among them) see exactly the same. A company created from v2.466.0 is born
 * with the generic values (SQL 193, crear_organizacion_interna).
 */
import { organisationLegacy } from '../legacy/organisation-bridge';
import { generalVat, vatRates } from './organisation';

type Raw = Record<string, unknown> | undefined;
const setting = (key: string): Raw => organisationLegacy.setting(key) as Raw;

/** A whole number between min and max, or undefined. */
function whole(value: unknown, min: number, max: number): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max ? Math.round(number) : undefined;
}

// VEN-3 · Servicios con material → Reposición
export const SETTING_SERVICES = 'servicios', DEFAULT_REPLENISH_HOURS = 48, MAX_REPLENISH_HOURS = 8760;

/** Hours to replenish what a service used: 48 without the setting, null when the company left it empty (no deadline). */
export function replenishHours(): number | null {
  const services = setting(SETTING_SERVICES);
  if (!services || !('reposicion_horas' in services)) return DEFAULT_REPLENISH_HOURS;
  return whole(services.reposicion_horas, 1, MAX_REPLENISH_HOURS) ?? null;
}

// FAC-1 · Facturación → Impuestos
export const SETTING_TAXES = 'impuestos';
/** Today's default VAT of a new product, for the companies without the setting. */
export const DEFAULT_PRODUCT_VAT = 10;
export type VatUse = 'productos' | 'servicios' | 'envios';

/** The VAT a new product, service or shipping starts with (without the setting: 10, the general one and 21). */
export function defaultVat(use: VatUse): number {
  const own = whole(setting(SETTING_TAXES)?.[use], 0, 100);
  if (own !== undefined) return own;
  return use === 'productos' ? DEFAULT_PRODUCT_VAT : use === 'servicios' ? generalVat() : 21;
}

/** The highest rate the company uses (the VAT fields do not go over it). */
export const highestVat = (): number => Math.max(...vatRates().map(([rate]) => rate));

// PPR-2 and PPR-3 · Portal → Formatos y Recurrencia (setting «portal»)
export const DEFAULT_GROUP_FROM = 4, DEFAULT_RECURRENCE = { meses: 12, dias: 60, minimo: 5 } as const, MIN_RECURRENCE = 3;

// PPR-1 · Portal → Informes: «Pedidos que ve la cuenta» («portal».pedidos)
export const SETTING_PORTAL = 'portal';
export type PortalOrders = 'todos' | 'marcados';

/** Which orders the account sees in its portal: all the completed ones, or only the ones marked «Reportar» (without the setting). */
export const portalOrders = (): PortalOrders => (setting(SETTING_PORTAL)?.pedidos === 'todos' ? 'todos' : 'marcados');

/** The checkbox «Reportar» of the orders and the filters «Reporte»: only with the portal and when it shows only the marked orders. */
export const marksReportedOrders = (): boolean => organisationLegacy.hasPortal() && portalOrders() === 'marcados';

// CAL-1 · Cartera y visitas → Ficha completa
export const SETTING_COMPLETE = 'ficha_completa';
export const COMPLETE_FIELDS = ['ubicacion', 'horario', 'especialidad', 'contacto', 'provincia', 'obligatorios'] as const;
export type CompleteField = (typeof COMPLETE_FIELDS)[number];
export const DEFAULT_COMPLETE: readonly CompleteField[] = ['ubicacion', 'horario', 'especialidad', 'contacto'];

/** What a complete account needs (today's four without the setting). */
export function completeFields(): CompleteField[] {
  const own = setting(SETTING_COMPLETE)?.campos;
  if (!Array.isArray(own)) return [...DEFAULT_COMPLETE];
  return COMPLETE_FIELDS.filter(field => own.includes(field));
}

// EVE-1 · Cartera y visitas → Eventos
export const SETTING_EVENTS = 'eventos';
export const DEFAULT_EVENT_TYPES = ['Taller', 'Curso', 'Congreso', 'Webinar', 'Reunión científica', 'Comida de trabajo', 'Otro'] as const;
export const EVENT_CONCEPTS = ['inscripcion', 'viaje', 'comida', 'honorarios'] as const;
export type EventConcept = (typeof EVENT_CONCEPTS)[number];
const DEFAULT_LIMITS: Partial<Record<EventConcept, number>> = { comida: 60 };
const MAX_LIMIT = 100000;

export interface EventRules { types: string[]; limits: Partial<Record<EventConcept, number>>; note: string | null }

/** Types, limits per person (empty = no limit) and the note of the yearly report. note null = today's text. */
export function eventRules(): EventRules {
  const own = setting(SETTING_EVENTS);
  if (!own) return { types: [...DEFAULT_EVENT_TYPES], limits: { ...DEFAULT_LIMITS }, note: null };
  const types = Array.isArray(own.tipos) ? own.tipos.map(type => String(type).trim()).filter(Boolean) : [];
  const given = (own.limites ?? {}) as Record<string, unknown>, limits: Partial<Record<EventConcept, number>> = {};
  EVENT_CONCEPTS.forEach(concept => { const limit = whole(given[concept], 1, MAX_LIMIT); if (limit !== undefined) limits[concept] = limit; });
  return { types: types.length ? types : [...DEFAULT_EVENT_TYPES], limits, note: typeof own.nota === 'string' ? own.nota : null };
}

// VIS-1 · Stock y material → Entregas controladas
export const SETTING_DELIVERIES = 'entregas';
export type DeliveryPeriod = 'anio' | 'trimestre' | 'mes';
export interface DeliveryRule {
  active: boolean; name: string | null; cap: number; period: DeliveryPeriod; months: number; signature: boolean; recipients: 'personas' | 'todas';
  legal: string | null;
}
const PERIODS: readonly DeliveryPeriod[] = ['anio', 'trimestre', 'mes'];

/**
 * The rule of controlled deliveries. Without the setting, today's: medicine samples, 10 a calendar year, 24 months from the
 * authorisation, signed, only people, with today's legal text (name and legal null = today's texts).
 */
export function deliveryRule(): DeliveryRule {
  const own = setting(SETTING_DELIVERIES);
  if (!own) return { active: true, name: null, cap: 10, period: 'anio', months: 24, signature: true, recipients: 'personas', legal: null };
  const name = typeof own.nombre === 'string' && own.nombre.trim() ? own.nombre.trim() : '';
  return {
    active: 'activa' in own ? own.activa === true : true, name, cap: whole(own.tope, 1, 1000) ?? 10,
    period: PERIODS.includes(own.periodo as DeliveryPeriod) ? own.periodo as DeliveryPeriod : 'anio', months: whole(own.meses, 0, 240) ?? 24,
    signature: own.firma !== false, recipients: own.receptores === 'todas' ? 'todas' : 'personas', legal: typeof own.texto_legal === 'string' ? own.texto_legal : '',
  };
}

// INI-2 · Cartera y visitas → Frecuencia → «Plazo general sin visita»
export const SETTING_NO_VISIT = 'sin_visita', DEFAULT_NO_VISIT_DAYS = 60;

/** The general term without a visit (60 without the setting). */
export const generalNoVisitDays = (): number => whole(setting(SETTING_NO_VISIT)?.dias, 1, 3650) ?? DEFAULT_NO_VISIT_DAYS;

/**
 * How «sin visita» reads: «en 60 días» with only the general term, «en su plazo» when some state has its own frequency (D13 A). The
 * summary of Inicio says which one the database used (sin_visita_dias, sin_visita_por_estado, SQL 193); before it, the settings.
 */
export function noVisitWording(kpis?: Readonly<Record<string, unknown>>): { byState: boolean; days: number } {
  const days = whole(kpis?.sin_visita_dias, 1, 3650);
  if (days !== undefined) return { byState: kpis?.sin_visita_por_estado === true, days };
  // Without SQL 193 the database still counts 60 days for everyone
  return kpis ? { byState: false, days: DEFAULT_NO_VISIT_DAYS } : { byState: noVisitByState(), days: generalNoVisitDays() };
}

/** True when some commercial state has its own frequency: then «sin visita» follows each state (D13 A). */
export function noVisitByState(): boolean {
  const frequency = setting('frecuencia');
  return Boolean(frequency && Object.values(frequency).some(days => (whole(days, 1, 3650) ?? 0) > 0));
}
