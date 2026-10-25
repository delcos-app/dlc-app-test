/**
 * Card or Bizum payment from the order (Redsys PayGold): whether it is set up and visible, which payment methods use it, the Spanish
 * mobile it is sent to, the server function «cobro_tpv» and its errors. Migrated from the legacy tpvCfg, tpvActivo, esPagoTpv,
 * tpvMovil, TPV_ERR, TPV_EST, tpvError, tpvLlamar, tpvEnviar and tpvMovilDe (v2.417.0).
 */
import { cardSectionsLegacy, legacyDb, notices, permissions, term } from '../../../legacy/bridge';
import { orderMailLegacy } from '../../../legacy/orders-bridge';
import { tpvLegacy } from '../../../legacy/orders2-bridge';
import { t, type MessageKey } from '../../../i18n';
import { orFallback } from '../../../services/values';

export interface TpvResult { ok?: boolean; error?: string; detalle?: string; movil?: string; url?: string; hay_clave?: boolean }

/** Payment states stored in pagos_tpv. */
export const TPV_STATES = { sent: 'Enviado', paid: 'Pagado', failed: 'Fallido', expired: 'Caducado', ready: 'Preparado' } as const;

export const TPV_PILLS = new Map<string, readonly [MessageKey, string]>([
  [TPV_STATES.sent, ['ordersMore.tpv.states.sent', 'p-est']], [TPV_STATES.paid, ['ordersMore.tpv.states.paid', 'p-trfok']],
  [TPV_STATES.failed, ['ordersMore.tpv.states.failed', 'p-urg']], [TPV_STATES.expired, ['ordersMore.tpv.states.expired', 'p-urg']],
  [TPV_STATES.ready, ['ordersMore.tpv.states.sending', 'p-warn']],
]);

const ERRORS = new Map<string, MessageKey>([
  ['permiso', 'ordersMore.tpv.errors.permiso'], ['estado', 'ordersMore.tpv.errors.estado'], ['pagado', 'ordersMore.tpv.errors.pagado'],
  ['sin_cargo', 'ordersMore.tpv.errors.sinCargo'], ['importe', 'ordersMore.tpv.errors.importe'], ['sesion', 'ordersMore.tpv.errors.sesion'],
  ['sin_configurar', 'ordersMore.tpv.errors.sinConfigurar'], ['no_encontrado', 'ordersMore.tpv.errors.noEncontrado'],
]);

/** The card payment is on: visible in this environment, set up and with Ventas. */
export const tpvActive = (): boolean => tpvLegacy.visible() && Boolean(tpvLegacy.settings().activo) && tpvLegacy.canUseSales();

/** Payment methods paid through the link. */
export const isTpvPayment = (method: string | null | undefined): boolean => /tarjeta|bizum/i.test(method ?? '');

/** A Spanish mobile (6xx or 7xx, without the 34 prefix), or ''. */
export function spanishMobile(phone: unknown): string {
  const digits = String(phone ?? '').replace(/\D/g, '').replace(/^(0034|34)(?=[67]\d{8}$)/, '');
  return /^[67]\d{8}$/.test(digits) ? digits : '';
}

export function tpvErrorText(result: TpvResult | null | undefined): string {
  const answer = result ?? {};
  if (answer.error === 'movil') return t('ordersMore.tpv.noMobile', { ofPatient: term('paciente', { article: 'del' }) });
  if (answer.error === 'redsys') return answer.detalle ?? t('ordersMore.tpv.bankRejected');
  const known = ERRORS.get(answer.error ?? '');
  return known ? t(known) : t('ordersMore.tpv.couldNotSend') + (answer.detalle ? `: ${answer.detalle}` : '');
}

/** Calls the server function «cobro_tpv» (an error answer is read from its body). */
export async function callTpv(body: Record<string, unknown>): Promise<TpvResult> {
  const { data, error } = await orderMailLegacy.invoke('cobro_tpv', body);
  let answer = data as TpvResult | null;
  const failure = error as { message?: string; context?: { json(): Promise<unknown> } } | null;
  if (!answer && failure) { try { answer = await failure.context?.json() as TpvResult | null ?? null; } catch { answer = null; } }
  if (!answer && failure) {
    const missing = /Failed to send|not found|404/i.test(failure.message ?? '');
    answer = { ok: false, error: 'interno', ...(missing ? { detalle: t('ordersMore.tpv.notPublished') } : failure.message ? { detalle: failure.message } : {}) };
  }
  return answer ?? { ok: false };
}

/** Sends the payment link of an order by SMS. */
export async function sendTpvLink(orderId: string): Promise<TpvResult> {
  const result = await callTpv({ accion: 'enviar', pedido_id: orderId });
  if (!result.ok) { notices.toast(tpvErrorText(result), true); return result; }
  notices.toast(t('ordersMore.tpv.sent', { mobile: result.movil ?? '' }));
  return result;
}

/** The Spanish mobile of a customer (mobile, else phone), or ''. */
export async function mobileOf(customer: { id?: string | null } | null | undefined): Promise<string> {
  if (!customer?.id) return '';
  const { data } = await legacyDb().from<{ movil?: string | null; telefono?: string | null } | null>('contactos').select('movil,telefono').eq('id', customer.id).maybeSingle();
  return spanishMobile(orFallback(data?.movil, data?.telefono ?? ''));
}

/** Who can send the link: administration or level 2 in Ventas. */
export const canSendTpv = (): boolean => cardSectionsLegacy.can('administrar') || permissions.salesLevel() >= 2;
