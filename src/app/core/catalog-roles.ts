/**
 * Values of the company's lists recognised by their role, not by their name (plan 12.2, v2.464.0: PED-3 and VIS-2). The role is the
 * value's «papel», chosen in Configuración → Datos → Clasificadores; SQL 192 gave the existing values the role their name meant. A
 * value without a role (a database without SQL 192, or a value saved by an older app) keeps the old rule by its name, so nothing
 * changes for it.
 */
import { catalogLegacy, type CatalogValue } from '../legacy/catalog-bridge';

/** How a payment method is collected (the «papel» of a value of «Formas de pago»). */
export const PAYMENT_KINDS = ['transferencia', 'entrega', 'tpv', 'otra'] as const;
export type PaymentKind = typeof PAYMENT_KINDS[number];

/** The role of a visit result that is a report for the account (VIS-2). */
export const REPORT_ROLE = 'informe';

const PAYMENT_CATALOG = 'forma_pago';
const isPaymentKind = (role: string | null | undefined): role is PaymentKind => PAYMENT_KINDS.some(kind => kind === role);

/** The old rule by the name, also the proposal for a new method: «reembolso», «transfer», «tarjeta» or «bizum». */
export function paymentKindByName(name: string | null | undefined): PaymentKind {
  const text = name ?? '';
  if (/reembolso/i.test(text)) return 'entrega';
  if (/transfer/i.test(text)) return 'transferencia';
  return /tarjeta|bizum/i.test(text) ? 'tpv' : 'otra';
}

/** How the payment method called `method` is collected: its role in the list, or by its name if it has none. */
export function paymentKind(method: string | null | undefined): PaymentKind {
  const role = catalogLegacy.values(PAYMENT_CATALOG).find(value => value.valor === method)?.papel;
  return isPaymentKind(role) ? role : paymentKindByName(method);
}

/** Bank transfer: the email with the IBAN, and the IBAN on the invoice. */
export const isBankTransfer = (method: string | null | undefined): boolean => paymentKind(method) === 'transferencia';
/** Collected on delivery: the order is packed before it is paid. */
export const isOnDelivery = (method: string | null | undefined): boolean => paymentKind(method) === 'entrega';
/** Card or Bizum through the payment link (TPV). */
export const isCardTerminal = (method: string | null | undefined): boolean => paymentKind(method) === 'tpv';

/** A visit result as clasificadores_actividad gives it: «informe» comes since SQL 192. */
export type ResultLike = Pick<CatalogValue, 'valor' | 'papel'> & { informe?: boolean | null };

/** A visit result that is a report for the account: hidden for accounts that do not receive reports. */
export function isReportResult(value: ResultLike): boolean {
  if (typeof value.informe === 'boolean') return value.informe;
  return value.papel === REPORT_ROLE || /reporting/i.test(value.valor);
}
