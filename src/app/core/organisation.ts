/**
 * What depends on each organisation and not on the code (plan 12.2, v2.436.0): its country for address searches, the general VAT
 * rate used as default, and the words a password should not start with. Each one has today's value as default, so a company
 * without the setting sees exactly the same as before.
 */
import { organisationLegacy } from '../legacy/organisation-bridge';
import { VAT_RATES, vatRateText } from '../services/money';

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
