/**
 * What depends on each organisation and not on the code (plan 12.2, v2.436.0): its country for address searches, the general VAT
 * rate used as default, and the words a password should not start with. Each one has today's value as default, so a company
 * without the setting sees exactly the same as before. v2.447.0: its time zone for «today» (plan 11.3).
 */
import { organisationLegacy } from '../legacy/organisation-bridge';
import { VAT_RATES, vatRateText } from '../services/money';
import { useDayZone } from '../services/dates';

/** The country stored in Datos fiscales (setting «empresa», field «pais»); the default is a database value, never translated. */
export const DEFAULT_COUNTRY = 'España';
const COUNTRY_CODES: Readonly<Record<string, string>> = { 'españa': 'es', 'portugal': 'pt', 'francia': 'fr', 'italia': 'it', 'andorra': 'ad' };

/** General VAT rate when the organisation has not set one (setting «impuestos», field «general»). */
export const DEFAULT_GENERAL_VAT = 21;
const MAX_RATE = 100, MIN_NAME_LENGTH = 3;

/** The organisation's country, «España» if it has none. */
export function organisationCountry(): string {
  const company = organisationLegacy.setting('empresa') as { pais?: unknown } | undefined;
  return String(company?.pais ?? '').trim() || DEFAULT_COUNTRY;
}

/** Its two-letter code for the map searches (empty when unknown: the search is then not limited to one country). */
export const countryCode = (): string => COUNTRY_CODES[organisationCountry().toLowerCase()] ?? '';

/** VeriFactu is a Spanish rule: its section only shows to organisations from Spain (v2.445.0). */
export const usesVerifactu = (): boolean => countryCode() === 'es';

/** «calle, cp, municipio, provincia, país»: the text of an address search, ending with the organisation's country. */
export const addressQuery = (parts: readonly (string | null | undefined)[]): string => [...parts, organisationCountry()].filter(Boolean).join(', ');

/** The general VAT rate of the organisation (21 if it has none). */
export function generalVat(): number {
  const raw = (organisationLegacy.setting('impuestos') as { general?: unknown } | undefined)?.general;
  if (raw === undefined || raw === null || raw === '') return DEFAULT_GENERAL_VAT;
  const rate = Number(raw);
  return Number.isFinite(rate) && rate >= 0 && rate <= MAX_RATE ? rate : DEFAULT_GENERAL_VAT;
}

/**
 * The VAT rates offered in the forms: the organisation's own list (setting «impuestos», field «tipos»: [{ "tipo": 21, "nombre": "General" }…],
 * v2.445.0) or, without it, Spain's.
 */
export function vatRates(): readonly (readonly [number, string])[] {
  const own = (organisationLegacy.setting('impuestos') as { tipos?: unknown } | undefined)?.tipos;
  if (!Array.isArray(own)) return VAT_RATES;
  const rates = own.flatMap((item: { tipo?: unknown; nombre?: unknown } | null) => {
    const rate = Number(item?.tipo);
    return item && item.tipo !== '' && item.tipo !== null && Number.isFinite(rate) && rate >= 0 && rate <= MAX_RATE
      ? [[rate, vatRateText(rate, String(item.nombre ?? '').trim())] as const] : [];
  });
  return rates.length ? rates : VAT_RATES;
}

/** Words a password should not start with: the platform's name and the first word of the organisation's name. */
export function obviousPasswordWords(): string[] {
  const first = /[a-zñ]+/.exec(organisationLegacy.name().toLowerCase())?.[0] ?? '';
  return ['delcos', ...(first.length >= MIN_NAME_LENGTH ? [first] : [])];
}

/**
 * Time zones offered in Organización → Zona horaria (IANA names; the database keeps the same list valid). Without the setting, the
 * database works in Spain's (Europe/Madrid) and the screens with the device's clock, as before.
 */
export const TIME_ZONES = ['Europe/Madrid', 'Atlantic/Canary', 'Europe/Lisbon', 'Europe/London', 'Europe/Paris', 'Europe/Rome', 'Europe/Berlin',
  'America/Mexico_City', 'America/Bogota', 'America/Lima', 'America/Santiago', 'America/Argentina/Buenos_Aires', 'America/New_York'] as const;

/** True when the browser knows the zone (an unknown one would stop every date). */
export function knownZone(zone: string): boolean {
  try { new Intl.DateTimeFormat('en-CA', { timeZone: zone }); return true; } catch { return false; }
}

/** The organisation's time zone (setting «zona_horaria», field «zona»), empty when it has none. */
export function organisationZone(): string {
  const zone = (organisationLegacy.setting('zona_horaria') as { zona?: unknown } | undefined)?.zona;
  return typeof zone === 'string' && zone && knownZone(zone) ? zone : '';
}

// «Today» in the whole app follows the organisation's zone once its settings have loaded
useDayZone(organisationZone);
