/**
 * Customer data (D-046, v2.468.0): the same four fields of a customer, always in the same order, wherever a customer is suggested,
 * chosen or summed up: address (street and number), postal code and town, phone and email. A missing value is not shown and the
 * rest keep their order (decision of Eric, 04/11/2026, option B); with no data at all, nothing is painted. Two forms of the contract component `datos-cliente`:
 * «compacto» (two lines, for suggestions and lists) and «bloque» (label and value, for summaries). Lists that are tables use
 * customerDataFields for their columns, and the mobile cards use customerDataLines.
 */
import { t } from '../i18n';
import { escapeHtml } from '../services/format';

/** What any customer row may carry (contactos and the lists that come from it). */
export interface CustomerDataSource {
  direccion?: string | null; cp?: string | null; municipio?: string | null; provincia?: string | null;
  telefono?: string | null; movil?: string | null; tel?: string | null; email?: string | null;
}

export type CustomerDataKey = 'direccion' | 'poblacion' | 'telefono' | 'email';
export interface CustomerDataField { readonly key: CustomerDataKey; readonly label: string; readonly value: string }

const clean = (value: string | null | undefined): string => (value ?? '').trim();

/** «08036 Barcelona», with the province after a comma when it is not the town itself («28400 Collado Villalba, Madrid»). */
function placeOf(customer: CustomerDataSource): string {
  const town = clean(customer.municipio), province = clean(customer.provincia);
  const place = [clean(customer.cp), town].filter(Boolean).join(' ');
  return province && province.toLowerCase() !== town.toLowerCase() ? [place, province].filter(Boolean).join(', ') : place;
}

/** The mobile first, then the landline, without repeating the same number. */
function phonesOf(customer: CustomerDataSource): string {
  const digits = (value: string): string => value.replace(/\D/g, '');
  const phones: string[] = [];
  [customer.movil, customer.telefono, customer.tel].map(clean).filter(Boolean).forEach(phone => {
    if (!phones.some(known => digits(known) === digits(phone))) phones.push(phone);
  });
  return phones.join(' / ');
}

/** The four fields, in their fixed order (an empty value means it is missing). */
export function customerDataFields(customer: CustomerDataSource): CustomerDataField[] {
  return [
    { key: 'direccion', label: t('components.customerData.address'), value: clean(customer.direccion) },
    { key: 'poblacion', label: t('components.customerData.place'), value: placeOf(customer) },
    { key: 'telefono', label: t('components.customerData.phone'), value: phonesOf(customer) },
    { key: 'email', label: t('components.customerData.email'), value: clean(customer.email) },
  ];
}

/** Where a narrow box may break a value: a phone number never in the middle, an email after «@» and before each dot. */
function breakable(field: CustomerDataField): string {
  const text = escapeHtml(field.value);
  if (field.key === 'telefono') return text.split(' / ').map(phone => phone.replace(/ /g, '&nbsp;')).join(' / ');
  if (field.key === 'email') return text.replace(/@/g, '@<wbr>').replace(/\./g, '<wbr>.');
  return text;
}

const valueHtml = (field: CustomerDataField): string => `<span data-cd="${field.key}">${breakable(field)}</span>`;

/** A table cell of one field (lists with columns): empty when the value is missing. */
export const customerDataCell = (field: CustomerDataField): string => (field.value ? valueHtml(field) : '');

/** The values present among `fields`, joined with « · ». */
const joined = (fields: readonly CustomerDataField[], render: (field: CustomerDataField) => string): string =>
  fields.filter(field => field.value).map(render).join(' · ');

/** The two lines of the compact form as text: «street · postal code and town» and «phone · email» (mobile cards); '' if empty. */
export function customerDataLines(customer: CustomerDataSource): [string, string] {
  const fields = customerDataFields(customer), text = (field: CustomerDataField): string => field.value;
  return [joined(fields.slice(0, 2), text), joined(fields.slice(2), text)];
}

/**
 * The block. «compacto»: two lines without labels (suggestions, search results, duplicate notice). «bloque»: one row per field
 * with its label (the chosen customer, the customer card and the order window).
 */
export function customerDataHtml(customer: CustomerDataSource, form: 'compacto' | 'bloque' = 'compacto'): string {
  const fields = customerDataFields(customer);
  if (!fields.some(field => field.value)) return '';
  if (form === 'bloque') {
    return `<span class="cdatos bloque" data-cdatos>${fields.filter(field => field.value).map(field => `<span class="sm">${field.label}</span>${valueHtml(field)}`).join('')}</span>`;
  }
  const lines = [joined(fields.slice(0, 2), valueHtml), joined(fields.slice(2), valueHtml)].filter(Boolean);
  return `<span class="cdatos" data-cdatos>${lines.map(line => `<span>${line}</span>`).join('')}</span>`;
}
